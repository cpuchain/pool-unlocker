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
export declare const configSchema: {
    readonly type: "object";
    readonly properties: {
        readonly coin: {
            readonly type: "string";
        };
        readonly redis: {
            readonly type: "object";
            readonly properties: {
                readonly endpoint: {
                    readonly type: "string";
                };
            };
        };
        readonly unlocker: {
            readonly type: "object";
            readonly properties: {
                readonly poolFee: {
                    readonly type: "number";
                };
                readonly poolFeeAddress: {
                    readonly type: "string";
                };
                readonly depth: {
                    readonly type: "number";
                };
                readonly immatureDepth: {
                    readonly type: "number";
                };
                readonly window: {
                    readonly type: "number";
                };
                readonly blockWindow: {
                    readonly type: "number";
                };
                readonly interval: {
                    readonly type: "string";
                };
                readonly daemon: {
                    readonly type: "string";
                };
                readonly timeout: {
                    readonly type: "string";
                };
            };
        };
        readonly payouts: {
            readonly type: "object";
            readonly properties: {
                readonly address: {
                    readonly type: "string";
                };
                readonly thresold: {
                    readonly type: "number";
                };
                readonly bgsave: {
                    readonly type: "boolean";
                };
            };
        };
    };
    readonly required: readonly ["coin"];
};
export declare function getConfig(): UnlockerParams;
