import { TransactionRequest } from 'ethers';
import type { Unlocker } from './unlocker';
import type { BlockData } from './getCandidates';
export declare const GAS_LIMIT = 42000n;
export type TxParams = TransactionRequest & {
    nonce: number;
};
export declare function getTxParams(unlocker: Unlocker): Promise<{
    tx: TxParams;
    balance: bigint;
    gasPrice: bigint;
    gasCost: bigint;
}>;
export interface Miner {
    immature: bigint;
    balance: bigint;
    pending: bigint;
    paid: bigint;
}
export declare function initMiners(balances: Record<string, bigint>): Record<string, Miner>;
export interface Payment {
    timestamp: number;
    hash: string;
    to: string;
    amount: bigint;
}
export declare function sendPayments(unlocker: Unlocker, miners: Record<string, Miner>, txParams: TxParams, poolFees: bigint): Promise<Payment[]>;
export declare function processPayments(unlocker: Unlocker, miners: Record<string, Miner>, txParams: TxParams, poolFees: bigint): Promise<Payment[]>;
export declare function calculateRewards(unlocker: Unlocker, candidates: BlockData[], balances: Record<string, bigint>): Promise<{
    miners: Record<string, Miner>;
    payments: Payment[];
    poolFees: bigint;
}>;
