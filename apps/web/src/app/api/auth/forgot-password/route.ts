import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, logAuditEvent } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
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

        const cleanEmail = email.toLowerCase().trim();

        // Always return success to prevent email enumeration
        const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });

        if (user && user.status === "ACTIVE") {
            const code = await generateOtp(cleanEmail, "PASSWORD_RESET");
            await sendOtpEmail(cleanEmail, code, "PASSWORD_RESET");
            await logAuditEvent(
                "PASSWORD_RESET_OTP_SENT",
                user.id,
                "Password reset OTP sent",
                ip
            );
        }

        return NextResponse.json({
            requiresOtp: true,
            email: cleanEmail,
            message: "If an account with that email exists, an OTP has been sent.",
        });
    } catch (error: any) {
        console.error("[Forgot Password Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
