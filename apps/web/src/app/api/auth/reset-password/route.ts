import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, logAuditEvent } from "@/lib/auth";
import { checkPasswordStrength } from "@/lib/validators";

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and new password are required" },
                { status: 400 }
            );
        }

        // Validate password strength
        const pwCheck = checkPasswordStrength(password);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: "Password too weak", details: pwCheck.errors },
                { status: 400 }
            );
        }

        // Find valid token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        // Update password
        const passwordHash = await hashPassword(password);
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash, mustChangePassword: false },
        });

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        });

        // Revoke all refresh tokens (force re-login)
        await prisma.refreshToken.updateMany({
            where: { userId: resetToken.userId },
            data: { revoked: true },
        });

        await logAuditEvent(
            "PASSWORD_RESET",
            resetToken.userId,
            "Password was reset via reset token",
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({
            message: "Password has been reset successfully. Please log in.",
        });
    } catch (error: any) {
        console.error("[Reset Password Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
