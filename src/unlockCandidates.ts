/**
 * Calculate block maturity & rewards
 */
import { Logger } from 'logger-chain';
import { Block, formatEther, getAddress } from 'ethers';
import { BlockData } from './getCandidates.js';
import { BlockWithUncles, getBlock } from './getBlock.js';
import { Unlocker } from './unlocker.js';
import { getConstReward, getRewardForUncle, getUncleReward } from './calculateRewards.js';
import { ConsensusView, Multicall } from './contracts/index.js';

export function findBlocks(blocks: (Block | null)[], candidate: BlockData, reorgDepth: number) {
    return blocks.find((b) => {
        return (
            b &&
            b.number < candidate.height + reorgDepth &&
            b.number > candidate.height - reorgDepth &&
            b.nonce === candidate.nonce
        );
    });
}

export async function getContractRewards(unlocker: Unlocker, blocks: number[]) {
    if (!unlocker.ConsensusView || !unlocker.Multicall) {
        return {};
    }

    const coinbase = getAddress(unlocker.coinbase as string);
    const Multicall = unlocker.Multicall as Multicall;
    const ConsensusView = unlocker.ConsensusView as ConsensusView;

    return (
        await Multicall.aggregate3.staticCall(
            blocks.map((b) => {
                return {
                    target: ConsensusView.target as string,
                    callData: ConsensusView.interface.encodeFunctionData('getBlockRewards', [b, coinbase]),
                    allowFailure: false,
                };
            }),
        )
    ).reduce(
        (acc, [, data], i) => {
            const block = blocks[i];
            const [, addresses, rewards] = ConsensusView.interface.decodeFunctionResult(
                'getBlockRewards',
                data,
            );

            if (!acc[block]) {
                acc[block] = 0n;
            }

            (addresses as string[]).forEach((addr, j) => {
                if (addr === coinbase) {
                    acc[block] += rewards[j];
                }
            });

            return acc;
        },
        {} as Record<number, bigint>,
    );
}

export async function unlockCandidates(unlocker: Unlocker, candidates: BlockData[], latestBlock: number) {
    const logger = new Logger(undefined, 'Candidates');

    let confirmedCount = 0,
        blockCount = 0,
        uncleCount = 0,
        orphanCount = 0;

    const { chainId } = unlocker;

    const blockNumbers = [...new Set(candidates.map((c) => c.height))];

    const provider = await unlocker.provider;

    const rpcBlocks = await Promise.all(blockNumbers.map((b) => getBlock(provider, b)));

    const contractRewards = await getContractRewards(unlocker, blockNumbers);

    const rpcUncles = rpcBlocks.map((b) => b?.uncles || []).flat() as Block[];

    // Bind candidate blocks with rpc blocks
    candidates.forEach((candidate) => {
        const blockOnHeight = rpcBlocks.find((b) => b?.number === candidate.height);
        const otherBlock = findBlocks(rpcBlocks, candidate, unlocker.depth);
        const uncle = findBlocks(rpcUncles, candidate, unlocker.depth);

        // Node doesn't have a block on specific height
        // either unindexed but we simply consider it orphaned so make sure it is confirmed with at least 1 conf
        if (!blockOnHeight) {
            orphanCount++;
            candidate.orphan = true;
            logger.warning(
                `Error while retrieving block ${candidate.height}, considering it orphaned while it could be RPC error`,
            );
            return;
        }

        const isSameBlock = blockOnHeight.hash === candidate.hash || blockOnHeight.nonce === candidate.nonce;
        const isOtherBlock = !isSameBlock && otherBlock;

        // Found mined block on same height
        if (isSameBlock || isOtherBlock) {
            const foundBlock = isSameBlock ? blockOnHeight : (otherBlock as BlockWithUncles);

            const blockRewards =
                contractRewards[foundBlock.number] || getConstReward(chainId, foundBlock.number);
            const uncleRewards = contractRewards[foundBlock.number]
                ? 0n
                : getRewardForUncle(chainId, foundBlock.number, foundBlock.uncles?.length || 0);
            const txFees = foundBlock.txFees || 0n;

            const confirmed = foundBlock.number + unlocker.depth < latestBlock;

            if (confirmed) {
                confirmedCount++;
            }

            blockCount++;
            candidate.confirmed = confirmed;
            candidate.height = foundBlock.number;
            candidate.hash = foundBlock.hash as string;
            candidate.reward = blockRewards + uncleRewards + txFees;
            logger.debug(
                `${confirmed ? 'Confirmed' : 'Mature'} ${isSameBlock ? 'block' : 'other block'} ${foundBlock.number} ` +
                    `with ${Object.keys(candidate.shares).length} miners, ${foundBlock.transactions.length} txs, hash: ${foundBlock.hash} ` +
                    `( blockRewards: ${formatEther(blockRewards)}, uncleRewards: ${formatEther(uncleRewards)}, txFees: ${formatEther(txFees)} )`,
            );
            return;
        }

        if (uncle && (uncle.hash === candidate.hash || uncle.nonce === candidate.nonce)) {
            const uncleRewards = contractRewards[candidate.height]
                ? 0n
                : getUncleReward(chainId, candidate.height, uncle.number);

            const confirmed = uncle.number + unlocker.depth < latestBlock;

            if (confirmed) {
                confirmedCount++;
            }

            uncleCount++;
            candidate.confirmed = confirmed;
            candidate.uncle = true;
            candidate.uncleHeight = uncle.number;
            candidate.hash = uncle.hash as string;
            candidate.reward = uncleRewards;
            logger.debug(
                `${confirmed ? 'Confirmed' : 'Mature'} uncle ${candidate.height}/${uncle.number} of reward ${formatEther(uncleRewards)} with hash: ${candidate.hash}`,
            );
            return;
        }

        orphanCount++;
        candidate.orphan = true;
        logger.warning(`Orphaned block ${candidate.height}:${candidate.nonce}`);
    });

    logger.debug(
        `blocks: ${blockCount}, confirmed: ${confirmedCount}, uncles: ${uncleCount}, orphans: ${orphanCount}`,
    );
}
