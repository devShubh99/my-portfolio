/**
 * Seed script — creates default admin account.
 * Run with: npx ts-node packages/db/prisma/seed.ts
 * Or configure in package.json: "prisma": { "seed": "ts-node packages/db/prisma/seed.ts" }
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@system.com";
const ADMIN_PASSWORD = "Admin@1234";

async function main() {
    console.log("🌱 Seeding database...\n");

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (existing) {
        console.log(`✅ Admin account already exists: ${ADMIN_EMAIL}`);
        console.log(`   Role: ${existing.role}`);
        console.log(`   Must change password: ${existing.mustChangePassword}`);
        return;
    }

    // Create admin
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            name: "System Admin",
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
            mustChangePassword: true,
        },
    });

    console.log("✅ Default admin account created:");
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   ID:       ${admin.id}`);
    console.log(`\n⚠️  Admin will be forced to change password on first login.`);

    // Log the seed event
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "ADMIN_SEEDED",
            details: "Default admin account created via seed script",
        },
    });

    console.log("\n🌱 Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
