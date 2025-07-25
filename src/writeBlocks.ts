import { Logger } from 'logger-chain';
import { formatEther, formatUnits } from 'ethers';
import { BlockData } from './getCandidates.js';
import { Miner, Payment } from './payer.js';
import { Unlocker } from './unlocker.js';

function toShannon(amount: bigint) {
    return Number(formatUnits(amount, 'gwei')).toFixed(0);
}

function toShannonNum(amount: bigint) {
    return Math.floor(Number(formatUnits(amount, 'gwei')));
}

export async function writeBlocks(
    unlocker: Unlocker,
    blocks: BlockData[],
    miners: Record<string, Miner>,
    payments: Payment[],
    poolFees: bigint,
) {
    const logger = new Logger(undefined, 'Write');

    const { coin, window, blockWindow, redisClient } = unlocker;

    const now = Math.floor(Date.now() / 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let writeMulti: any = redisClient.multi().zRemRangeByScore(`${coin}:payments:all`, 0, `(${now - window}`);

    let lastCreditBlock: BlockData | null = null;

    blocks.forEach((block) => {
        // Write immature blocks
        if (!block.confirmed) {
            if (block.height != block.roundHeight) {
                writeMulti = writeMulti.rename(
                    `${coin}:shares:round${block.roundHeight}:${block.nonce}`,
                    `${coin}:shares:round${block.height}:${block.nonce}`,
                );
            }

            if (block.candidateKey) {
                writeMulti = writeMulti.zRem(`${coin}:blocks:candidates`, block.candidateKey);
            }

            if (!block.immatureKey) {
                writeMulti = writeMulti.zAdd(`${coin}:blocks:immature`, {
                    score: block.height,
                    value: block.key(),
                });

                Object.entries(block.shareRewards).forEach(([miner, rewards]) => {
                    writeMulti = writeMulti.hSetNX(
                        `${coin}:credits:immature:${block.height}:${block.hash}`,
                        miner,
                        toShannon(rewards),
                    );
                });
            }

            // Write mature blocks
        } else {
            if (block.height != block.roundHeight) {
                writeMulti = writeMulti.del(`${coin}:shares:round${block.roundHeight}:${block.nonce}`);
            } else {
                writeMulti = writeMulti.del(`${coin}:shares:round${block.height}:${block.nonce}`);
            }

            if (block.candidateKey) {
                writeMulti = writeMulti.zRem(`${coin}:blocks:candidates`, block.candidateKey);
            }

            if (block.immatureKey) {
                writeMulti = writeMulti
                    .zRem(`${coin}:blocks:immature`, block.immatureKey)
                    .del(`${coin}:credits:immature:${block.height}:${block.hash}`);
            }

            writeMulti = writeMulti.zAdd(`${coin}:blocks:matured`, {
                score: block.height,
                value: block.key(),
            });

            writeMulti = writeMulti.zAdd(`${coin}:credits:all`, {
                score: block.height,
                value: `${block.hash}:${block.timestamp}:${toShannon(block.reward)}`,
            });

            // disabled to save memory, refer credits:all instead
            /**
            Object.entries(block.shareRewards).forEach(([miner, rewards]) => {
                writeMulti = writeMulti.hSetNX(`${coin}:credits:${block.height}:${block.hash}`, miner, toShannon(rewards));
            });
            **/

            if (!lastCreditBlock || (lastCreditBlock as BlockData).height > block.height) {
                lastCreditBlock = block;
            }
        }
    });

    if (lastCreditBlock) {
        writeMulti = writeMulti
            .zRemRangeByScore(
                `${coin}:blocks:matured`,
                '-inf',
                `(${(lastCreditBlock as BlockData).height - blockWindow}`,
            )
            .zRemRangeByScore(
                `${coin}:credits:all`,
                '-inf',
                `(${(lastCreditBlock as BlockData).height - blockWindow}`,
            );
    }

    let totalImmature = 0n,
        totalBalance = 0n,
        totalPending = 0n,
        totalPaid = 0n;

    Object.entries(miners).forEach(([miner, { immature, balance, pending, paid }]) => {
        totalImmature += immature;
        totalBalance += balance;
        totalPending += pending;
        totalPaid += paid;

        writeMulti = writeMulti
            .hSet(`${coin}:miners:${miner}`, 'immature', toShannon(immature))
            .hSet(`${coin}:miners:${miner}`, 'balance', toShannon(balance))
            .hSet(`${coin}:miners:${miner}`, 'pending', toShannon(pending))
            .hIncrByFloat(`${coin}:miners:${miner}`, 'paid', toShannonNum(paid));
    });

    writeMulti = writeMulti
        .hSet(`${coin}:finances`, 'immature', toShannon(totalImmature))
        .hSet(`${coin}:finances`, 'balance', toShannon(totalBalance))
        .hSet(`${coin}:finances`, 'pending', toShannon(totalPending))
        .hIncrByFloat(`${coin}:finances`, 'poolFees', toShannonNum(poolFees))
        .hIncrByFloat(`${coin}:finances`, 'paid', toShannonNum(totalPaid))
        .hIncrByFloat(`${coin}:finances`, 'totalMined', toShannonNum(totalPaid));

    payments.forEach(({ timestamp, hash, to, amount }) => {
        writeMulti = writeMulti
            .zRemRangeByScore(`${coin}:payments:${to}`, 0, `(${now - window}`)
            .zAdd(`${coin}:payments:${to}`, { score: timestamp, value: `${hash}:${toShannon(amount)}` })
            .zAdd(`${coin}:payments:all`, { score: timestamp, value: `${hash}:${to}:${toShannon(amount)}` });
    });

    await writeMulti.exec();

    logger.debug(
        `Wrote ${Object.keys(blocks).length} blocks, ${Object.keys(miners).length} miners, ${payments.length} txs, ` +
            `paid: ${formatEther(totalPaid)}, pending: ${formatEther(totalPending)}, immature: ${formatEther(totalImmature)}, balance: ${formatEther(totalBalance)}`,
    );
}
