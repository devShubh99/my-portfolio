import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const rl = checkRateLimit(`send-otp:${ip}`);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Try again later." },
                { status: 429 }
            );
        }

        const { email, type } = await req.json();

        if (!email || !type) {
            return NextResponse.json(
                { error: "Email and type are required" },
                { status: 400 }
            );
        }

        if (type !== "EMAIL_VERIFICATION" && type !== "PASSWORD_RESET") {
            return NextResponse.json(
                { error: "Invalid OTP type" },
                { status: 400 }
            );
        }

        const cleanEmail = email.toLowerCase().trim();

        if (type === "EMAIL_VERIFICATION") {
            // Check user exists and is unverified
            const user = await prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (!user) {
                return NextResponse.json(
                    { error: "No account found with this email" },
                    { status: 404 }
                );
            }
            if (user.emailVerified) {
                return NextResponse.json(
                    { error: "Email is already verified" },
                    { status: 400 }
                );
            }
        }

        if (type === "PASSWORD_RESET") {
            // Silent fail to prevent email enumeration
            const user = await prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (!user || user.status !== "ACTIVE") {
                return NextResponse.json({
                    message: "If an account exists, an OTP has been sent.",
                });
            }
        }

        const code = await generateOtp(cleanEmail, type);
        await sendOtpEmail(cleanEmail, code, type);

        return NextResponse.json({
            message: "OTP sent successfully. Check your email.",
        });
    } catch (error: any) {
        console.error("[Send OTP Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
