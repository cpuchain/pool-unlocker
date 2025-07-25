/**
 * Payment module defined here
 */
import { Logger } from 'logger-chain';
import { formatEther, formatUnits, getAddress, TransactionRequest } from 'ethers';
import type { Unlocker } from './unlocker.js';
import type { BlockData } from './getCandidates.js';
import { Sender } from './contracts/index.js';

// Gas limit to allow per payment (used for sending transactions & fee calculations)
export const GAS_LIMIT = 42000n;

export type TxParams = TransactionRequest & { nonce: number };

export async function getTxParams(unlocker: Unlocker) {
    const provider = await unlocker.provider;

    const signer = await unlocker.signer;

    const [feeData, balance, nonce] = await Promise.all([
        provider.getFeeData(),
        provider.getBalance(signer.address),
        provider.getTransactionCount(signer.address, 'pending'),
    ]);

    const tx: TxParams = {
        from: signer.address,
        nonce,
    };

    let gasPrice = 0n;

    if (feeData?.maxFeePerGas) {
        tx.type = 2;
        tx.maxFeePerGas = feeData.maxFeePerGas;
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        gasPrice = feeData.maxFeePerGas + (feeData.maxPriorityFeePerGas as bigint);
    } else if (feeData?.gasPrice) {
        tx.type = 0;
        tx.gasPrice = (feeData.gasPrice * 13n) / 10n;

        gasPrice = tx.gasPrice;
    }

    const gasCost = GAS_LIMIT * gasPrice;

    return { tx, balance, gasPrice, gasCost };
}

export interface Miner {
    immature: bigint;
    balance: bigint;
    pending: bigint;
    paid: bigint;
}

export function initMiners(balances: Record<string, bigint>): Record<string, Miner> {
    const miners = {} as Record<string, Miner>;

    for (const bal in balances) {
        miners[bal] = {
            immature: 0n,
            balance: 0n,
            pending: BigInt(balances[bal]),
            paid: 0n,
        };
    }

    return miners;
}

export interface Payment {
    timestamp: number;
    hash: string;
    to: string;
    amount: bigint;
}

export async function sendPayments(
    unlocker: Unlocker,
    miners: Record<string, Miner>,
    txParams: TxParams,
    poolFees: bigint,
) {
    const logger = new Logger(undefined, 'Sender');

    const signer = await unlocker.signer;

    const addresses: string[] = [];
    const amounts: bigint[] = [];

    if (poolFees && unlocker.poolFeeAddress && unlocker.poolFeeAddress !== signer.address) {
        addresses.push(unlocker.poolFeeAddress);
        amounts.push(poolFees);
    }

    for (const miner in miners) {
        addresses.push(miner);
        amounts.push(miners[miner].pending);
    }

    if (addresses.length) {
        try {
            const resp = await (unlocker.Sender as Sender).send(addresses, amounts, GAS_LIMIT, txParams);

            const payments: Payment[] = addresses.map((to, i) => {
                const amount = amounts[i];

                if (miners[to]) {
                    miners[to].paid = amount;
                    miners[to].pending = 0n;
                }

                logger.debug(
                    `Sent ${formatEther(amount)} to ${to} (hash: ${resp.hash}, nonce: ${resp.nonce})`,
                );

                return {
                    timestamp: Math.floor(Date.now() / 1000),
                    hash: resp.hash,
                    to,
                    amount,
                };
            });

            return payments;
        } catch (err) {
            logger.error('Sender expected to fail, reverting to balance');
            console.log(err);

            for (const miner in miners) {
                miners[miner].balance = BigInt(miners[miner].pending);
                miners[miner].pending = 0n;
            }
        }
    }

    return [];
}

export async function processPayments(
    unlocker: Unlocker,
    miners: Record<string, Miner>,
    txParams: TxParams,
    poolFees: bigint,
): Promise<Payment[]> {
    if (unlocker.Sender) {
        return sendPayments(unlocker, miners, txParams, poolFees);
    }

    const logger = new Logger(undefined, 'Send');

    const provider = await unlocker.provider;

    const signer = await unlocker.signer;

    const tx: TxParams = { ...txParams };

    const payments: Payment[] = [];

    if (poolFees && unlocker.poolFeeAddress && unlocker.poolFeeAddress !== signer.address) {
        try {
            const poolFeeAddress = getAddress(unlocker.poolFeeAddress);

            tx.to = poolFeeAddress;
            tx.value = poolFees;
            tx.gasLimit = await provider.estimateGas(tx);

            if (tx.gasLimit > GAS_LIMIT) {
                throw new Error('Gas limit exceeds limit');
            } else if (tx.gasLimit > 21000n) {
                tx.gasLimit = GAS_LIMIT;
            }

            const resp = await signer.sendTransaction(tx);

            payments.push({
                timestamp: Math.floor(Date.now() / 1000),
                hash: resp.hash,
                to: poolFeeAddress.toLowerCase(),
                amount: tx.value,
            });

            tx.nonce++;

            logger.debug(
                `Sent ${formatEther(tx.value)} to ${tx.to} (hash: ${resp.hash}, nonce: ${tx.nonce - 1})`,
            );
        } catch (err) {
            logger.error('Pool fee payment failed with unknown error');
            console.log(err);
        }
    }

    for (const miner in miners) {
        if (!miners[miner].pending) {
            continue;
        }

        try {
            tx.to = getAddress(miner);
            tx.value = BigInt(miners[miner].pending);
            tx.gasLimit = await provider.estimateGas(tx);

            if (tx.gasLimit > GAS_LIMIT) {
                throw new Error('Gas limit exceeds limit');
            } else if (tx.gasLimit > 21000n) {
                tx.gasLimit = GAS_LIMIT;
            }

            const resp = await signer.sendTransaction(tx);

            payments.push({
                timestamp: Math.floor(Date.now() / 1000),
                hash: resp.hash,
                to: miner,
                amount: tx.value,
            });

            miners[miner].paid = tx.value;
            miners[miner].pending = 0n;

            tx.nonce++;

            logger.debug(
                `Sent ${formatEther(tx.value)} to ${tx.to} (hash: ${resp.hash}, nonce: ${tx.nonce - 1})`,
            );
        } catch (err) {
            logger.error('Payment expected to fail, crediting payments to balance');
            console.log(err);

            miners[miner].balance = BigInt(miners[miner].pending);
            miners[miner].pending = 0n;
        }
    }

    return payments;
}

export async function calculateRewards(
    unlocker: Unlocker,
    candidates: BlockData[],
    balances: Record<string, bigint>,
) {
    const logger = new Logger(undefined, 'Rewards');

    const signer = await unlocker.signer;

    const miners = initMiners(balances);

    candidates.forEach((candidate) => {
        if (candidate.orphan) {
            return;
        }

        for (const miner in candidate.shares) {
            const share = candidate.shares[miner];
            const rewards = (candidate.reward * share) / candidate.totalShares;

            candidate.shareRewards[miner] = rewards;

            if (candidate.confirmed) {
                miners[miner].pending += rewards;
            } else {
                miners[miner].immature += rewards;
            }
        }
    });

    const { tx, balance: poolBalance, gasPrice, gasCost } = await getTxParams(unlocker);

    logger.debug(
        `PoolBalance: ${formatEther(poolBalance)}, GasPrice: ${formatUnits(gasPrice, 'gwei')} gwei, GasCost: ${formatEther(gasCost)}`,
    );

    let totalPending = 0n,
        totalImmature = 0n,
        totalBalance = 0n,
        totalFees = 0n;

    for (const miner in miners) {
        // If miner balance is under payment move to balance
        if (miners[miner].pending < unlocker.thresold || miners[miner].pending < gasCost) {
            miners[miner].balance = BigInt(miners[miner].pending);
            miners[miner].pending = 0n;
            continue;
        }

        // Deduct pool fees
        const poolFees = (miners[miner].pending * (unlocker.poolFee || 0n)) / 100n;
        miners[miner].pending -= poolFees;
        totalFees += poolFees;

        // Deduct transaction fees
        miners[miner].pending -= gasCost;

        totalPending += miners[miner].pending;
        totalImmature += miners[miner].immature;
        totalBalance += miners[miner].balance;

        logger.debug(
            `Miner ${miner}: toPay: ${formatEther(miners[miner].pending)}, immature: ${formatEther(miners[miner].immature)}, bal: ${formatEther(miners[miner].balance)}`,
        );
    }

    if (totalFees) {
        if (totalFees < gasCost) {
            logger.debug(
                `Omitting fees payment due to lower amount than gas costs ${formatEther(totalFees)}`,
            );
            totalFees = 0n;
        } else {
            totalFees -= gasCost;
        }
    }

    if (poolBalance < totalPending) {
        const errMsg = `Signer ${signer.address} balance ${formatEther(poolBalance)} under payment ${formatEther(totalPending)}`;
        throw new Error(errMsg);
    }

    logger.debug(
        `Total toPay: ${formatEther(totalPending)}, immature: ${formatEther(totalImmature)}, balance: ${formatEther(totalBalance)}, poolFees: ${formatEther(totalFees)}`,
    );

    const payments = totalPending ? await processPayments(unlocker, miners, tx, totalFees) : [];

    return { miners, payments, poolFees: totalFees };
}
