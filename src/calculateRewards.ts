import { parseEther } from 'ethers';

export enum ChainId {
    MAINNET = 1,
    CPUCHAIN = 6516853,
}

export const blockRewards: Record<number, Record<number, bigint>> = {
    [ChainId.MAINNET]: {
        // homestead
        0: parseEther('5'),
        // byzantium
        4370000: parseEther('3'),
        // constantinople
        7280000: parseEther('2'),
    },
    [ChainId.CPUCHAIN]: {
        // for debug, should get live rewards from contract
        0: parseEther('2'),
    },
};

export function getConstReward(chainId: number, height: number) {
    const rewardMap = Object.entries(blockRewards[chainId] || blockRewards[ChainId.MAINNET]).sort(
        ([a], [b]) => Number(b) - Number(a),
    );

    for (const [forkHeight, blockReward] of rewardMap) {
        if (height > Number(forkHeight)) {
            return blockReward;
        }
    }

    return rewardMap[rewardMap.length - 1][1] as bigint;
}

export function getRewardForUncle(chainId: number, height: number, uncleCount: number) {
    return (BigInt(uncleCount) * getConstReward(chainId, height)) / 32n;
}

export function getUncleReward(chainId: number, height: number, uncleHeight: number) {
    const reward = getConstReward(chainId, height);
    const k = Math.min(height - uncleHeight, 8);
    return (reward * BigInt(8 - k)) / 8n;
}
