export declare enum ChainId {
    MAINNET = 1,
    CPUCHAIN = 6516853
}
export declare const blockRewards: Record<number, Record<number, bigint>>;
export declare function getConstReward(chainId: number, height: number): bigint;
export declare function getRewardForUncle(chainId: number, height: number, uncleCount: number): bigint;
export declare function getUncleReward(chainId: number, height: number, uncleHeight: number): bigint;
