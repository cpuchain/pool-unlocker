/**
 * Dump redis DB here
 */
import { parseUnits } from 'ethers';
import { Unlocker } from './unlocker.js';

export function fromShannon(bal: string) {
    return parseUnits(bal, 'gwei');
}

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

export class BlockData {
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

    // redis key in full string
    // candidate => "nonce:powHash:mixDigest:timestamp:diff:totalShares"
    // immature => "uncleHeight:orphan:nonce:blockHash:timestamp:diff:totalShares:rewardInWei"
    candidateKey?: string;
    immatureKey?: string;

    shares: Record<string, bigint>;
    shareRewards: Record<string, bigint>;

    constructor(params: BlockDataParams) {
        this.height = params.height;
        this.roundHeight = params.height;

        this.timestamp = params.timestamp;
        this.difficulty = params.difficulty;
        this.totalShares = params.totalShares;

        this.uncle = params.uncle || false;
        this.uncleHeight = params.uncleHeight || 0;
        this.orphan = params.orphan || false;

        this.hash = params.hash;
        this.nonce = params.nonce;
        this.powHash = params.powHash;
        this.mixDigest = params.mixDigest;

        this.reward = params.reward || 0n;
        this.confirmed = false;

        this.candidateKey = params.candidateKey;
        this.immatureKey = params.immatureKey;

        this.shares = {};
        this.shareRewards = {};
    }

    key() {
        const { uncleHeight, orphan, nonce, hash, timestamp, difficulty, totalShares, reward } = this;
        const orphanNum = !orphan ? 0 : 1;
        const sHash = hash || '0x0';
        return `${uncleHeight}:${orphanNum}:${nonce}:${sHash}:${timestamp}:${difficulty}:${totalShares}:${reward}`;
    }

    static parseCandidate(height: number, candidateKey: string) {
        // "nonce:powHash:mixDigest:timestamp:diff:totalShares"
        const params = candidateKey.split(':');

        return new BlockData({
            height,
            nonce: params[0],
            powHash: params[1],
            mixDigest: params[2],
            timestamp: parseInt(params[3]),
            difficulty: BigInt(params[4]),
            totalShares: BigInt(params[5]),
            candidateKey,
        });
    }

    static parseImmutable(height: number, immatureKey: string) {
        // "uncleHeight:orphan:nonce:blockHash:timestamp:diff:totalShares:rewardInWei"
        const params = immatureKey.split(':');
        const uncleHeight = Number(params[0]);

        return new BlockData({
            height,
            uncle: uncleHeight > 0,
            uncleHeight,
            orphan: Boolean(parseInt(params[1])),
            nonce: params[2],
            hash: params[3],
            timestamp: parseInt(params[4]),
            difficulty: BigInt(params[5]),
            totalShares: BigInt(params[6]),
            reward: BigInt(params[7]),
            immatureKey,
        });
    }
}

export async function getCandidates(unlocker: Unlocker) {
    await unlocker.redisConnect;

    const { redisClient, coin, depth, immatureDepth } = unlocker;

    const provider = await unlocker.provider;

    const latestBlock = await provider.getBlockNumber();

    const result = (await redisClient
        .multi()
        .zRangeByScoreWithScores(`${coin}:blocks:immature`, 0, latestBlock - depth)
        .zRangeByScoreWithScores(`${coin}:blocks:candidates`, 0, latestBlock - immatureDepth)
        .exec()) as unknown as { value: string; score: number }[][];

    const blocks = [
        ...result[0].map(({ score, value }) => BlockData.parseImmutable(score, value)),
        ...result[1].map(({ score, value }) => BlockData.parseCandidate(score, value)),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sharesMulti: any = redisClient.multi();

    for (const block of blocks) {
        sharesMulti = sharesMulti.HGETALL(`${coin}:shares:round${block.height}:${block.nonce}`);
    }

    const shares = (await sharesMulti.exec()) as unknown as Record<string, string>[];

    // Unpaid balance cause it were under payment condition
    const balances = {} as Record<string, bigint>;

    blocks.forEach((block, i) => {
        Object.entries(shares[i]).forEach(([key, value]) => {
            block.shares[key] = BigInt(value);
            block.shareRewards[key] = 0n;
            balances[key] = 0n;
        });
    });

    const balKeys = Object.keys(balances);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let balanceMulti: any = redisClient.multi();

    // Use keys to ensure ordered index
    balKeys.forEach((miner) => {
        balanceMulti = balanceMulti.hGet(`${coin}:miners:${miner}`, 'balance');
    });

    ((await balanceMulti.exec()) as string[]).forEach((bal, i) => {
        if (bal) {
            balances[balKeys[i]] = fromShannon(bal);
        }
    });

    return {
        latestBlock,
        blocks,
        balances,
    };
}
