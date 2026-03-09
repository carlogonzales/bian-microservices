import type { Prisma, PrismaClient } from "@prisma/client";
import { computeBackoffMs, sleep, type BackoffOptions } from "./backoff.js";
import { isRetryablePrismaError, type RetryClassifier } from "./retryable.js";

export type TxIsolationLevel =
    | "ReadUncommitted"
    | "ReadCommitted"
    | "RepeatableRead"
    | "Serializable";

export type PrismaTxRetryOptions = {
    /**
     * Total attempts = 1 + maxRetries
     * Example: maxRetries=3 => 4 total attempts
     */
    maxRetries: number;

    /**
     * Postgres best practice for money-moving tx is SERIALIZABLE.
     * If you’re using advisory locks as well, this is very safe.
     */
    isolationLevel?: TxIsolationLevel;

    /**
     * Interactive transaction timeout.
     * (Prisma: `timeout` is supported in newer versions; if your version doesn’t,
     * remove it or keep as undefined.)
     */
    timeoutMs?: number;

    /**
     * Max wait time to acquire transaction (Prisma option in newer versions).
     */
    maxWaitMs?: number;

    /**
     * Backoff config.
     */
    backoff?: Partial<BackoffOptions>;

    /**
     * Custom retry classifier. Defaults to isRetryablePrismaError.
     */
    isRetryable?: RetryClassifier;

    /**
     * Optional hook for logging/metrics.
     */
    onRetry?: (info: {
        attempt: number;
        maxRetries: number;
        backoffMs: number;
        error: unknown;
    }) => void;
};

// Prisma option type is Prisma.TransactionIsolationLevel enum,
// but we avoid importing runtime Prisma here.
function mapIsolationLevel(level?: TxIsolationLevel): any | undefined {
    // Prisma expects values like Prisma.TransactionIsolationLevel.Serializable
    // but also accepts string in some versions. We'll keep it string.
    return level;
}

const DEFAULT_BACKOFF: BackoffOptions = {
    baseMs: 25,
    maxMs: 2000,
    multiplier: 2,
    jitterRatio: 0.2,
};

const DEFAULT_OPTIONS: PrismaTxRetryOptions = {
    maxRetries: 3,
    isolationLevel: "Serializable",
    backoff: DEFAULT_BACKOFF,
    isRetryable: isRetryablePrismaError,
};

// XXX: This type is a bit hacky, but it allows us to pass the tx client to the user function
//      without exposing the full PrismaClient type.
export type InteractiveTxClient = Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Run an interactive Prisma transaction with retry on transient errors.
 *
 * Usage:
 *   await prismaTx(prisma, async (tx) => {
 *     // ... tx.account.update(...)
 *   })
 */
export async function prismaTx<T>(
    prisma: PrismaClient,
    fn: (tx: InteractiveTxClient) => Promise<T>,
    options?: Partial<PrismaTxRetryOptions>,
): Promise<T> {
    const opts: PrismaTxRetryOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        backoff: { ...DEFAULT_BACKOFF, ...(options?.backoff ?? {}) },
        isRetryable: options?.isRetryable ?? DEFAULT_OPTIONS.isRetryable!,
    };

    const totalAttempts = 1 + Math.max(0, opts.maxRetries);

    let lastErr: unknown;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
        try {
            // NOTE: Prisma accepts an options object as 2nd arg (version-dependent).
            // Use only fields supported by your Prisma version.
            const txOptions: any = {
                isolationLevel: mapIsolationLevel(opts.isolationLevel),
            };

            if (typeof opts.timeoutMs === "number") txOptions.timeout = opts.timeoutMs;
            if (typeof opts.maxWaitMs === "number") txOptions.maxWait = opts.maxWaitMs;

            // If your Prisma version doesn't support txOptions, just remove the 2nd arg.
            return await (prisma as any).$transaction(async (tx: any) => fn(tx), txOptions);
        } catch (err) {
            lastErr = err;

            const retryable = opts.isRetryable?.(err) ?? false;
            const isLastAttempt = attempt === totalAttempts;

            if (!retryable || isLastAttempt) {
                throw err;
            }

            const backoffMs = computeBackoffMs(attempt, opts.backoff as BackoffOptions);
            opts.onRetry?.({ attempt, maxRetries: opts.maxRetries, backoffMs, error: err });

            await sleep(backoffMs);
        }
    }

    // Should never reach here
    throw lastErr;
}

/**
 * Convenience wrapper for "Serializable" tx with sane retry defaults.
 * Good for money-moving commands.
 */
export async function prismaSerializableTx<T>(
    prisma: PrismaClient,
    fn: (tx: InteractiveTxClient) => Promise<T>,
    options?: Partial<Omit<PrismaTxRetryOptions, "isolationLevel">>,
): Promise<T> {
    return prismaTx(prisma, fn, { ...options, isolationLevel: "Serializable" });
}