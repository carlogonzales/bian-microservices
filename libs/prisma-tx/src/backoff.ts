export type BackoffOptions = {
    baseMs: number;      // e.g. 25
    maxMs: number;       // e.g. 2000
    multiplier: number;  // e.g. 2
    // To avaoid thundering herd problem, we add some randomness to the backoff
    // Ref: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    jitterRatio: number; // 0..1 (e.g. 0.2 = ±20%)
};

export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

export function computeBackoffMs(attempt: number, opts: BackoffOptions): number {
    //Provide default value on backoff options
    opts = Object.assign({
        baseMs: 25,
        maxMs: 2000,
        multiplier: 2,
        jitterRatio: 0.2,
    }, opts);
    // attempt starts at 1
    const exp = opts.baseMs * Math.pow(opts.multiplier, attempt - 1);
    const capped = Math.min(exp, opts.maxMs);

    // jitter around capped: [capped*(1-j), capped*(1+j)]
    const jitter = Math.max(0, Math.min(1, opts.jitterRatio));
    const low = capped * (1 - jitter);
    const high = capped * (1 + jitter);
    const withJitter = low + Math.random() * (high - low);

    return Math.max(0, Math.floor(withJitter));
}