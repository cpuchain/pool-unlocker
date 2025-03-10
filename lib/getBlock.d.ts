/**
 * Extend provider block with uncles and receipts
 */
import { Block, BlockTag, JsonRpcProvider, TransactionReceipt } from 'ethers';
export declare class BlockWithUncles extends Block {
    uncles?: Block[];
    receipts?: TransactionReceipt[];
    txFees?: bigint;
}
export declare function calculateTxFees(receipts: TransactionReceipt[]): bigint;
export declare function getBlock(provider: JsonRpcProvider, blockTag?: BlockTag): Promise<null | BlockWithUncles>;
