/**
 * Main unlocker module
 */
import { JsonRpcProvider, JsonRpcSigner } from 'ethers';
import { RedisClientType } from 'redis';
import { ConsensusView, Multicall, Sender } from './contracts';
export declare const contracts: Record<number, {
    multicall: string;
    consensusView: string;
    sender: string;
}>;
export declare function getCoinbase(provider: JsonRpcProvider): Promise<string>;
export declare function getProvider(unlocker: Unlocker): Promise<JsonRpcProvider>;
export declare function getSigner(unlocker: Unlocker): Promise<JsonRpcSigner>;
export declare function unlockPool(unlocker: Unlocker): Promise<void>;
export interface UnlockerParams {
    redisUrl?: string;
    bgSave?: boolean;
    providerUrl?: string;
    providerTimeout?: number;
    coin: string;
    poolFee?: bigint;
    poolFeeAddress?: string;
    depth?: number;
    immatureDepth?: number;
    window?: number;
    blockWindow?: number;
    interval?: number;
    coinbase?: string;
    thresold?: bigint;
}
export declare class Unlocker {
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
    constructor({ redisUrl, bgSave, providerUrl, providerTimeout, coin, poolFee, poolFeeAddress, depth, immatureDepth, window, blockWindow, interval, coinbase, thresold, }: UnlockerParams);
    unlock(): Promise<void>;
}
