import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Resolve the database URL — default to SQLite dev.db in the packages/db/prisma directory
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
