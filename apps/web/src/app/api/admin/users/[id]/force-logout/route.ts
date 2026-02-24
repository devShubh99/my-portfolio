import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * POST /api/admin/users/[id]/force-logout — Revoke all sessions for a user.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireAdmin(PERMISSIONS.force_logout);
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

        // Revoke all refresh tokens
        const { count } = await prisma.refreshToken.updateMany({
            where: { userId: id, revoked: false },
            data: { revoked: true },
        });

        await logAuditEvent(
            "ADMIN_FORCE_LOGOUT",
            auth.userId,
            `Force-logged out user ${user.email} (${count} tokens revoked)`,
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({
            message: `User ${user.email} has been logged out`,
            tokensRevoked: count,
        });
    } catch (error) {
        console.error("[Force Logout Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
