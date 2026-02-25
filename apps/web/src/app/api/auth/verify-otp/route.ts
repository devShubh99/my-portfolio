import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    verifyOtp,
    signAccessToken,
    createRefreshToken,
    setAuthCookies,
    createPasswordResetToken,
    logAuditEvent,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, code, type } = await req.json();

        if (!email || !code || !type) {
            return NextResponse.json(
                { error: "Email, code, and type are required" },
                { status: 400 }
            );
        }

        const cleanEmail = email.toLowerCase().trim();
        const result = await verifyOtp(cleanEmail, code, type);

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        const ip = req.headers.get("x-forwarded-for") || "unknown";

        if (type === "EMAIL_VERIFICATION") {
            // Mark email as verified
            const user = await prisma.user.update({
                where: { email: cleanEmail },
                data: { emailVerified: true },
            });

            // Issue auth tokens
            const accessToken = signAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            const refreshToken = await createRefreshToken(user.id);
            await setAuthCookies(accessToken, refreshToken);

            await logAuditEvent(
                "EMAIL_VERIFIED",
                user.id,
                "Email verified via OTP",
                ip,
                req.headers.get("user-agent") || undefined
            );

            return NextResponse.json({
                verified: true,
                type: "EMAIL_VERIFICATION",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
            });
        }

        if (type === "PASSWORD_RESET") {
            // Generate a short-lived reset token for the password form
            const user = await prisma.user.findUnique({
                where: { email: cleanEmail },
            });

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            const resetToken = await createPasswordResetToken(user.id);

            await logAuditEvent(
                "OTP_VERIFIED_FOR_RESET",
                user.id,
                "OTP verified for password reset",
                ip
            );

            return NextResponse.json({
                verified: true,
                type: "PASSWORD_RESET",
                resetToken,
            });
        }

        return NextResponse.json(
            { error: "Invalid OTP type" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("[Verify OTP Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
