/**
 * Main unlocker module
 */
import { FetchRequest, getAddress, JsonRpcProvider, JsonRpcSigner, parseEther } from 'ethers';
import { createClient, RedisClientType } from 'redis';
import { factory } from '@cpuchain/logger';
import { getCandidates } from './getCandidates';
import { calculateRewards } from './payer';
import { unlockCandidates } from './unlockCandidates';
import { writeBlocks } from './writeBlocks';
import { ChainId } from './calculateRewards';
import {
    ConsensusView,
    ConsensusView__factory,
    Multicall,
    Multicall__factory,
    Sender,
    Sender__factory,
} from './contracts';

export const contracts: Record<number, { multicall: string; consensusView: string; sender: string }> = {
    [ChainId.CPUCHAIN]: {
        multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
        consensusView: '0x0000000000000000000000000000000000637075',
        sender: '0x0000000000000000000000000000000000637075',
    },
};

export async function getCoinbase(provider: JsonRpcProvider) {
    return getAddress(await provider.send('eth_coinbase', []));
}

export async function getProvider(unlocker: Unlocker) {
    const { providerUrl, providerTimeout } = unlocker;

    const request = new FetchRequest(providerUrl);
    request.timeout = providerTimeout;

    const staticNetwork = await new JsonRpcProvider(request).getNetwork();

    const chainId = Number(staticNetwork.chainId);

    const provider = new JsonRpcProvider(request, staticNetwork, {
        staticNetwork,
    });

    unlocker.chainId = chainId;

    if (contracts[chainId]) {
        unlocker.Multicall = Multicall__factory.connect(contracts[chainId].multicall, provider);
        unlocker.ConsensusView = ConsensusView__factory.connect(contracts[chainId].consensusView, provider);
    }

    return provider;
}

export async function getSigner(unlocker: Unlocker) {
    const provider = await unlocker.provider;

    const signer = new JsonRpcSigner(provider, (unlocker.coinbase ||= await getCoinbase(provider)));

    if (contracts[unlocker.chainId]) {
        unlocker.Sender = Sender__factory.connect(contracts[unlocker.chainId].sender, signer);
    }

    return signer;
}

export async function unlockPool(unlocker: Unlocker) {
    const { redisClient, bgSave } = unlocker;

    // Dump blocks from redis DB
    const { latestBlock, blocks, balances } = await getCandidates(unlocker);

    // Get blocks from RPC for confirmation
    await unlockCandidates(unlocker, blocks, latestBlock);

    // Pay rewards to miners
    const { miners, payments, poolFees } = await calculateRewards(unlocker, blocks, balances);

    // Write all data to redis DB
    await writeBlocks(unlocker, blocks, miners, payments, poolFees);

    if (bgSave) {
        await redisClient.bgSave();
    }
}

export interface UnlockerParams {
    redisUrl?: string; // redis[s]://[[username][:password]@][host][:port][/db-number]
    bgSave?: boolean;

    providerUrl?: string;
    providerTimeout?: number;

    coin: string;

    poolFee?: bigint;
    poolFeeAddress?: string;

    depth?: number; // Depth to pay blocks (should be mainly used)
    immatureDepth?: number; // Depth to consider blocks enough for reward calculations (still raw)
    window?: number; // Window to save payments for
    blockWindow?: number; // Blocks to save last shares
    interval?: number; // Interval to run unlocker in ms
    coinbase?: string;
    thresold?: bigint; // min payment thresold
}

export class Unlocker {
    redisClient: RedisClientType;
    redisConnect: Promise<RedisClientType>;
    bgSave: boolean;

    provider: Promise<JsonRpcProvider>;
    providerUrl: string;
    providerTimeout: number;

    signer: Promise<JsonRpcSigner>;

    coin: string;

    poolFee?: bigint;
    poolFeeAddress?: string;

    depth: number;
    immatureDepth: number;
    window: number;
    blockWindow: number;
    interval: number;
    coinbase?: string;
    thresold: bigint;

    chainId: number;
    Multicall?: Multicall;
    ConsensusView?: ConsensusView;
    Sender?: Sender;

    locked: boolean;

    constructor({
        redisUrl,
        bgSave,
        providerUrl,
        providerTimeout,
        coin,
        poolFee,
        poolFeeAddress,
        depth,
        immatureDepth,
        window,
        blockWindow,
        interval,
        coinbase,
        thresold,
    }: UnlockerParams) {
        this.redisClient = createClient({
            url: `redis://${redisUrl || '127.0.0.1:6379'}`,
        });
        this.redisConnect = this.redisClient.connect();
        this.bgSave = bgSave ?? true;

        this.providerUrl = providerUrl || 'http://localhost:8545';
        this.providerTimeout = providerTimeout ?? 60 * 1000;

        this.provider = getProvider(this);
        this.signer = getSigner(this);

        this.coin = coin;

        this.poolFee = poolFee;
        this.poolFeeAddress = poolFeeAddress;

        this.depth = depth || 32;
        this.immatureDepth = immatureDepth || 16;
        this.window = window || 86400;
        this.blockWindow = blockWindow || 1000;
        this.interval = interval || 600 * 1000; // default to 10 minutes
        this.coinbase = coinbase;
        this.thresold = thresold || parseEther('0.01');

        this.chainId = 1;

        this.locked = false;
    }

    async unlock() {
        if (this.locked) {
            return;
        }
        this.locked = true;

        const logger = factory(undefined, 'Unlocker');

        try {
            await unlockPool(this);
        } catch (err) {
            logger.error(`Error while processing pool unlock / payouts`);
            console.log(err);
        }

        this.locked = false;
    }
}
