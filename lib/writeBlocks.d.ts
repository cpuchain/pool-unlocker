import { BlockData } from './getCandidates';
import { Miner, Payment } from './payer';
import { Unlocker } from './unlocker';
export declare function writeBlocks(unlocker: Unlocker, blocks: BlockData[], miners: Record<string, Miner>, payments: Payment[], poolFees: bigint): Promise<void>;
