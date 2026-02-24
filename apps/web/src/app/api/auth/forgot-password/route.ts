import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPasswordResetToken, logAuditEvent } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";

        // Rate limit
        const rl = checkRateLimit(`forgot-password:${ip}`);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Try again later." },
                { status: 429 }
            );
        }

        const { email } = await req.json();
        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Always return success to prevent email enumeration
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (user && user.status === "ACTIVE") {
            const token = await createPasswordResetToken(user.id);
            await sendPasswordResetEmail(user.email, token);
            await logAuditEvent(
                "PASSWORD_RESET_REQUESTED",
                user.id,
                "Password reset email sent",
                ip
            );
        }

        return NextResponse.json({
            message: "If an account with that email exists, a reset link has been sent.",
        });
    } catch (error: any) {
        console.error("[Forgot Password Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
