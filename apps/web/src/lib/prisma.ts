/**
 * Prisma client singleton module.
 *
 * Uses the globalThis cache pattern recommended by Next.js to prevent
 * instantiating multiple PrismaClient instances during hot-reload in
 * development. In production, a single instance is created and reused.
 *
 * Requires DATABASE_URL to be set in the environment.
 *
 * @module lib/prisma
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
                ? ["error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
