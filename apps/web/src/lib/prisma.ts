/**
 * Prisma client singleton module.
 *
 * Uses the globalThis cache pattern recommended by Next.js to prevent
 * instantiating multiple PrismaClient instances during hot-reload in
 * development. In production, a single instance is created and reused.
 *
 * @module lib/prisma
 */

import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Resolve the Prisma `datasourceUrl`.
 *
 * 1. If `DATABASE_URL` is set in the environment, use it directly.
 * 2. Otherwise, fall back to an absolute path pointing at the SQLite
 *    `dev.db` file inside `packages/db/prisma/`.
 *
 * @returns The database connection URL string.
 */
function getDatabaseUrl(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    // Fallback: construct absolute path to the SQLite database
    const dbPath = path.resolve(process.cwd(), "../../packages/db/prisma/dev.db");
    return `file:${dbPath}`;
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: getDatabaseUrl(),
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
