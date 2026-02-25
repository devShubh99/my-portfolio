import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    hashPassword,
    generateOtp,
    logAuditEvent,
} from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import { isValidEmail, checkPasswordStrength, cleanInput } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
    try {
        // Rate limit
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const rl = checkRateLimit(`register:${ip}`);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many registration attempts. Try again later." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { name, email, password } = body;

        // Validate
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const cleanEmail = cleanInput(email).toLowerCase();
        const cleanName = name ? cleanInput(name) : null;

        if (!isValidEmail(cleanEmail)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        const pwCheck = checkPasswordStrength(password);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: "Password too weak", details: pwCheck.errors },
                { status: 400 }
            );
        }

        // Check duplicate
        const existing = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (existing) {
            // If user exists but hasn't verified, resend OTP
            if (!existing.emailVerified) {
                const code = await generateOtp(cleanEmail, "EMAIL_VERIFICATION");
                await sendOtpEmail(cleanEmail, code, "EMAIL_VERIFICATION");
                return NextResponse.json(
                    {
                        requiresOtp: true,
                        email: cleanEmail,
                        message: "Account exists but is unverified. A new OTP has been sent.",
                    },
                    { status: 200 }
                );
            }
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Create user (unverified)
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email: cleanEmail,
                name: cleanName,
                passwordHash,
                emailVerified: false,
            },
        });

        // Generate and send OTP
        const code = await generateOtp(cleanEmail, "EMAIL_VERIFICATION");
        console.log(`[Register] OTP generated for ${cleanEmail}, sending email...`);
        try {
            await sendOtpEmail(cleanEmail, code, "EMAIL_VERIFICATION");
            console.log(`[Register] OTP email sent successfully to ${cleanEmail}`);
        } catch (emailError: any) {
            console.error(`[Register] Failed to send OTP email:`, emailError);
        }

        // Audit
        await logAuditEvent(
            "REGISTER",
            user.id,
            `New user registered (pending verification): ${user.email}`,
            ip,
            req.headers.get("user-agent") || undefined
        );

        return NextResponse.json(
            {
                requiresOtp: true,
                email: cleanEmail,
                message: "Account created. Please verify your email with the OTP sent.",
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[Register Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
