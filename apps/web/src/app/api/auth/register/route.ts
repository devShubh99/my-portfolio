import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    hashPassword,
    signAccessToken,
    createRefreshToken,
    setAuthCookies,
    logAuditEvent,
} from "@/lib/auth";
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
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Create user
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email: cleanEmail,
                name: cleanName,
                passwordHash,
            },
        });

        // Issue tokens
        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = await createRefreshToken(user.id);
        await setAuthCookies(accessToken, refreshToken);

        // Audit
        await logAuditEvent(
            "REGISTER",
            user.id,
            `New user registered: ${user.email}`,
            ip,
            req.headers.get("user-agent") || undefined
        );

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
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
