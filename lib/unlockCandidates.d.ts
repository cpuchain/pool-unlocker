import { Block } from 'ethers';
import { BlockData } from './getCandidates';
import { Unlocker } from './unlocker';
export declare function findBlocks(blocks: (Block | null)[], candidate: BlockData, reorgDepth: number): Block | null | undefined;
export declare function getContractRewards(unlocker: Unlocker, blocks: number[]): Promise<Record<number, bigint>>;
export declare function unlockCandidates(unlocker: Unlocker, candidates: BlockData[], latestBlock: number): Promise<void>;
