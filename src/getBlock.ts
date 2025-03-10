/**
 * Extend provider block with uncles and receipts
 */
import { Block, BlockTag, JsonRpcProvider, TransactionReceipt } from 'ethers';

export class BlockWithUncles extends Block {
    // uncles have their own different height
    uncles?: Block[];
    receipts?: TransactionReceipt[];
    txFees?: bigint;
}

export function calculateTxFees(receipts: TransactionReceipt[]) {
    // receipt gasPrice fetched from effectiveGasPrice which is also available on ETC
    return receipts.reduce((acc, curr) => {
        acc += curr.gasPrice * curr.gasUsed;
        return acc;
    }, 0n);
}

export async function getBlock(
    provider: JsonRpcProvider,
    blockTag?: BlockTag,
): Promise<null | BlockWithUncles> {
    const blockHashOrNum = provider._getBlockTag(blockTag);

    const [rawBlock, rawReceipts] = await Promise.all([
        provider.send('eth_getBlockByNumber', [blockHashOrNum, false]),
        provider.send('eth_getBlockReceipts', [blockHashOrNum]),
    ]);

    if (!rawBlock) {
        return null;
    }

    // Uncles are blocks orphaned behind -1 of blockTag so can't associate here
    const rawUncles = await Promise.all(
        ((rawBlock.uncles as string[]) || []).map((u) => provider.send('eth_getBlockByHash', [u, false])),
    );

    const block = provider._wrapBlock(rawBlock, provider._network) as BlockWithUncles;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block.uncles = (rawUncles as any[])
        .filter((u) => u)
        .map((r) => provider._wrapBlock(r, provider._network));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block.receipts = (rawReceipts || []).map((r: any) =>
        provider._wrapTransactionReceipt(r, provider._network),
    );

    block.txFees = calculateTxFees(block.receipts as TransactionReceipt[]);

    return block;
}
