/**
 * @repo/db — Shared Prisma client package.
 *
 * Re-exports a singleton PrismaClient instance that can be imported
 * by any workspace package via `import prisma from "@repo/db"`.
 * Uses the globalThis pattern to survive Next.js hot-reload.
 *
 * @module @repo/db
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
