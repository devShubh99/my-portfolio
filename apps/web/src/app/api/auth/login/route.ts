import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    verifyPassword,
    signAccessToken,
    createRefreshToken,
    setAuthCookies,
    logAuditEvent,
    handleFailedLogin,
    resetFailedLogins,
    isAccountLocked,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";

        // Rate limit
        const rl = checkRateLimit(`login:${ip}`);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many login attempts. Try again later." },
                { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            await logAuditEvent("LOGIN_FAILED", null, `Unknown email: ${email}`, ip);
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check account status
        if (user.status === "DEACTIVATED") {
            return NextResponse.json(
                { error: "This account has been deactivated" },
                { status: 403 }
            );
        }

        if (user.status === "SUSPENDED") {
            return NextResponse.json(
                { error: "This account has been suspended. Contact support." },
                { status: 403 }
            );
        }

        // Check lockout
        if (isAccountLocked(user.lockedUntil)) {
            await logAuditEvent("LOGIN_LOCKED", user.id, "Account is locked", ip);
            return NextResponse.json(
                { error: "Account is locked due to too many failed attempts. Try again later." },
                { status: 423 }
            );
        }

        // Verify password
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            await handleFailedLogin(user.id);
            await logAuditEvent(
                "LOGIN_FAILED",
                user.id,
                `Failed login attempt (${user.failedLogins + 1})`,
                ip,
                req.headers.get("user-agent") || undefined
            );
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Successful login
        await resetFailedLogins(user.id);

        // Track last login time (graceful if migration not yet applied)
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        } catch {
            // lastLoginAt column may not exist yet — non-critical
        }

        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
        });
        const refreshToken = await createRefreshToken(user.id);
        await setAuthCookies(accessToken, refreshToken);

        await logAuditEvent(
            "LOGIN",
            user.id,
            "Successful login",
            ip,
            req.headers.get("user-agent") || undefined
        );

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
            accessToken,
        });
    } catch (error: any) {
        console.error("[Login Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
