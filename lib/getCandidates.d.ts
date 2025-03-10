import { Unlocker } from './unlocker';
export declare function fromShannon(bal: string): bigint;
export interface BlockDataParams {
    height: number;
    timestamp: number;
    difficulty: bigint;
    totalShares: bigint;
    uncle?: boolean;
    uncleHeight?: number;
    orphan?: boolean;
    hash?: string;
    nonce: string;
    powHash?: string;
    mixDigest?: string;
    reward?: bigint;
    candidateKey?: string;
    immatureKey?: string;
}
export declare class BlockData {
    height: number;
    roundHeight: number;
    timestamp: number;
    difficulty: bigint;
    totalShares: bigint;
    uncle: boolean;
    uncleHeight: number;
    orphan: boolean;
    hash?: string;
    nonce: string;
    powHash?: string;
    mixDigest?: string;
    reward: bigint;
    confirmed: boolean;
    candidateKey?: string;
    immatureKey?: string;
    shares: Record<string, bigint>;
    shareRewards: Record<string, bigint>;
    constructor(params: BlockDataParams);
    key(): string;
    static parseCandidate(height: number, candidateKey: string): BlockData;
    static parseImmutable(height: number, immatureKey: string): BlockData;
}
export declare function getCandidates(unlocker: Unlocker): Promise<{
    latestBlock: number;
    blocks: BlockData[];
    balances: Record<string, bigint>;
}>;
