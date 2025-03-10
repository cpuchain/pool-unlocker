import process from 'process';
import { existsSync, readFileSync } from 'fs';
import Ajv from 'ajv';
import parseDuration from 'parse-duration';
import { getAddress } from 'ethers';
import { UnlockerParams } from './unlocker';

export interface ConfigJson {
    coin: string;
    redis?: {
        endpoint?: string;
    };
    unlocker?: {
        poolFee?: number;
        poolFeeAddress?: string;
        depth?: number;
        immatureDepth?: number;
        window?: number;
        blockWindow?: number;
        interval?: string;
        daemon?: string;
        timeout?: string;
    };
    payouts?: {
        address?: string;
        thresold?: number;
        bgsave?: boolean;
    };
}

export const configSchema = {
    type: 'object',
    properties: {
        coin: { type: 'string' },

        redis: {
            type: 'object',
            properties: {
                endpoint: { type: 'string' },
            },
        },

        unlocker: {
            type: 'object',
            properties: {
                poolFee: { type: 'number' },
                poolFeeAddress: { type: 'string' },
                depth: { type: 'number' },
                immatureDepth: { type: 'number' },
                window: { type: 'number' },
                blockWindow: { type: 'number' },
                interval: { type: 'string' },
                daemon: { type: 'string' },
                timeout: { type: 'string' },
            },
        },

        payouts: {
            type: 'object',
            properties: {
                address: { type: 'string' },
                thresold: { type: 'number' },
                bgsave: { type: 'boolean' },
            },
        },
    },
    required: ['coin'],
} as const;

export function getConfig(): UnlockerParams {
    const configFile = process.argv[2] || 'config.json';

    if (!existsSync(configFile)) {
        throw new Error('Config file not found');
    }

    const config = JSON.parse(readFileSync(configFile, { encoding: 'utf8' })) as ConfigJson;

    const ajv = new Ajv();

    if (!ajv.compile(configSchema)(config)) {
        throw new Error('Invalid config, check the config.example.json and verify if config is valid');
    }

    return {
        redisUrl: config.redis?.endpoint,
        bgSave: config.payouts?.bgsave,

        providerUrl: config.unlocker?.daemon,
        providerTimeout: parseDuration(config.unlocker?.timeout || '0') || undefined,

        coin: config.coin,

        poolFee: BigInt(config.unlocker?.poolFee || 0) || undefined,
        poolFeeAddress: config.unlocker?.poolFeeAddress
            ? getAddress(config.unlocker?.poolFeeAddress)
            : undefined,

        depth: config.unlocker?.depth,
        immatureDepth: config.unlocker?.immatureDepth,
        window: config.unlocker?.window,
        blockWindow: config.unlocker?.blockWindow,
        interval: parseDuration(config.unlocker?.interval || '0') || undefined,
        coinbase: config.payouts?.address ? getAddress(config.payouts?.address) : undefined,
        thresold: BigInt(config.payouts?.thresold || 0) || undefined,
    };
}
