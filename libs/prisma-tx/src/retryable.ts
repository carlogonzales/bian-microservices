import type { Prisma } from "@prisma/client";

/**
 * Prisma sometimes wraps DB errors into PrismaClientKnownRequestError
 * with a Prisma code (like P2034) and/or DB error codes in `meta`.
 */
export function isRetryablePrismaError(err: unknown): boolean {
    // Prisma exports error classes at runtime, but we avoid importing classes
    // directly to keep this lib light and compatible across Prisma versions.
    // We'll detect shape.
    if (!err || typeof err !== "object") return false;

    const anyErr = err as any;

    // Prisma "known request" error code (Prisma-specific)
    const prismaCode: string | undefined = typeof anyErr.code === "string" ? anyErr.code : undefined;

    // Common transient transaction conflict (write conflict / deadlock)
    // P2034 is documented as "Transaction failed due to a write conflict or a deadlock"
    // REF: https://www.prisma.io/docs/orm/reference/error-reference#p2034
    if (prismaCode === "P2034") return true;

    // Prisma "transaction already closed" etc. not always retryable
    // but sometimes appears due to transient disconnects; we keep conservative.
    // REF: https://www.prisma.io/docs/orm/reference/error-reference#p2028
    if (prismaCode === "P2028") return true; // "Transaction API error" (often due to transient issues)

    // Underlying DB error code (Postgres SQLSTATE), sometimes in meta
    const meta = anyErr.meta ?? {};
    const dbCode: string | undefined =
        typeof meta.code === "string"
            ? meta.code
            : typeof anyErr?.cause?.code === "string"
                ? anyErr.cause.code
                : undefined;

    // Postgres retryable SQLSTATE codes
    // 40001: serialization_failure
    // 40P01: deadlock_detected
    // 55P03: lock_not_available
    // 57014: query_canceled (sometimes from statement_timeout)
    const retryableDbCodes = new Set(["40001", "40P01", "55P03", "57014"]);

    if (dbCode && retryableDbCodes.has(dbCode)) return true;

    // Network-ish / connection hiccups sometimes show as generic errors
    const msg = typeof anyErr.message === "string" ? anyErr.message : "";
    const retryableMessageFragments = [
        "ECONNRESET",
        "ETIMEDOUT",
        "EPIPE",
        "Connection terminated unexpectedly",
        "the database system is starting up",
        "could not serialize access",
        "deadlock detected",
    ];

    if (retryableMessageFragments.some((f) => msg.includes(f))) return true;

    return false;
}

export type RetryClassifier = (err: unknown) => boolean;