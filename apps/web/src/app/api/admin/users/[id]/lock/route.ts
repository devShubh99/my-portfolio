import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * POST /api/admin/users/[id]/lock — Instantly lock a user account.
 * Sets lockedUntil to 100 years in the future and revokes all sessions.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireAdmin(PERMISSIONS.lock_accounts);
        if (result.error) return result.error;
        const { auth } = result;

        const { id } = await params;

        if (id === auth.userId) {
            return NextResponse.json(
                { error: "Cannot lock your own account" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Lock for 100 years (effectively permanent until manually unlocked)
        const lockedUntil = new Date();
        lockedUntil.setFullYear(lockedUntil.getFullYear() + 100);

        await prisma.user.update({
            where: { id },
            data: { lockedUntil, status: "SUSPENDED" },
        });

        // Revoke all tokens
        await prisma.refreshToken.updateMany({
            where: { userId: id, revoked: false },
            data: { revoked: true },
        });

        await logAuditEvent(
            "ADMIN_ACCOUNT_LOCKED",
            auth.userId,
            `Instantly locked account: ${user.email}`,
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({ message: `Account ${user.email} locked` });
    } catch (error) {
        console.error("[Lock Account Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users/[id]/lock — Unlock a user account.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireAdmin(PERMISSIONS.lock_accounts);
        if (result.error) return result.error;
        const { auth } = result;

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.user.update({
            where: { id },
            data: { lockedUntil: null, failedLogins: 0, status: "ACTIVE" },
        });

        await logAuditEvent(
            "ADMIN_ACCOUNT_UNLOCKED",
            auth.userId,
            `Unlocked account: ${user.email}`,
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({ message: `Account ${user.email} unlocked` });
    } catch (error) {
        console.error("[Unlock Account Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
