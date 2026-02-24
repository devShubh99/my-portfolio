import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    getCurrentUser,
    verifyPassword,
    hashPassword,
    logAuditEvent,
    clearAuthCookies,
} from "@/lib/auth";
import { checkPasswordStrength } from "@/lib/validators";

export async function POST(req: NextRequest) {
    try {
        const auth = await getCurrentUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        // Password strength check
        const pwCheck = checkPasswordStrength(newPassword);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: "New password too weak", details: pwCheck.errors },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify current password
        const valid = await verifyPassword(currentPassword, user.passwordHash);
        if (!valid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // Update password
        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: auth.userId },
            data: { passwordHash, mustChangePassword: false },
        });

        // Revoke all refresh tokens
        await prisma.refreshToken.updateMany({
            where: { userId: auth.userId },
            data: { revoked: true },
        });

        await clearAuthCookies();

        await logAuditEvent(
            "PASSWORD_CHANGED",
            auth.userId,
            "Password changed by user",
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({
            message: "Password changed. Please log in again.",
        });
    } catch (error) {
        console.error("[Change Password Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
