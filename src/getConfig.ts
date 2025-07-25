import process from 'process';
import { existsSync, readFileSync } from 'fs';
import { Ajv } from 'ajv';
import parseDuration from 'parse-duration';
import { getAddress, parseEther } from 'ethers';
import { UnlockerParams } from './unlocker.js';

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
    const configFile = process.env.CONFIG_FILE || 'config.json';

    if (!existsSync(configFile)) {
        throw new Error('Config file not found');
    }

    const config = JSON.parse(readFileSync(configFile, { encoding: 'utf8' })) as ConfigJson;

    const ajv = new Ajv();

    if (!ajv.compile(configSchema)(config)) {
        throw new Error('Invalid config, check the config.example.json and verify if config is valid');
    }

    return {
        redisUrl: config.redis?.endpoint || '127.0.0.1:6379',
        bgSave: config.payouts?.bgsave ?? true,

        providerUrl: config.unlocker?.daemon || 'http://localhost:8545',
        providerTimeout: parseDuration(config.unlocker?.timeout || '0') ?? 60 * 1000,

        coin: config.coin,

        poolFee: BigInt(config.unlocker?.poolFee || 0) || undefined,
        poolFeeAddress: config.unlocker?.poolFeeAddress
            ? getAddress(config.unlocker?.poolFeeAddress)
            : undefined,

        depth: config.unlocker?.depth || 32,
        immatureDepth: config.unlocker?.immatureDepth || 16,
        window: config.unlocker?.window || 86400,
        blockWindow: config.unlocker?.blockWindow || 1000,
        interval: parseDuration(config.unlocker?.interval || '0') || 600 * 1000, // default to 10 minutes
        coinbase: config.payouts?.address ? getAddress(config.payouts?.address) : undefined,
        thresold: BigInt(config.payouts?.thresold || 0) || parseEther('0.01'),
    };
}
