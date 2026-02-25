/**
 * Auth module — JWT sign/verify, password hashing, cookie helpers.
 * Stateless JWT with refresh token rotation.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// ── Config from env ──
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";
const BCRYPT_ROUNDS = 12;

// ── Types ──
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
}

// ── Password Hashing ──
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ── JWT ──
export function signAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// ── Refresh Token ──
export async function createRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();

    // Parse expiry (e.g. "7d" → 7 days)
    const match = JWT_REFRESH_EXPIRY.match(/^(\d+)([dhms])$/);
    if (match) {
        const val = parseInt(match[1]);
        const unit = match[2];
        if (unit === "d") expiresAt.setDate(expiresAt.getDate() + val);
        else if (unit === "h") expiresAt.setHours(expiresAt.getHours() + val);
        else if (unit === "m") expiresAt.setMinutes(expiresAt.getMinutes() + val);
        else if (unit === "s") expiresAt.setSeconds(expiresAt.getSeconds() + val);
    } else {
        expiresAt.setDate(expiresAt.getDate() + 7); // default 7 days
    }

    await prisma.refreshToken.create({
        data: { userId, token, expiresAt },
    });

    return token;
}

export async function rotateRefreshToken(
    oldToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
    const stored = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
        include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        // Revoke all tokens for this user if token reuse detected
        if (stored) {
            await prisma.refreshToken.updateMany({
                where: { userId: stored.userId },
                data: { revoked: true },
            });
        }
        return null;
    }

    // Revoke old token
    await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
    });

    // Issue new pair
    const accessToken = signAccessToken({
        userId: stored.user.id,
        email: stored.user.email,
        role: stored.user.role,
    });
    const refreshToken = await createRefreshToken(stored.user.id);

    return { accessToken, refreshToken };
}

// ── Cookie Helpers ──
export async function setAuthCookies(
    accessToken: string,
    refreshToken: string
) {
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
    });
    cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
}

export async function getTokensFromCookies() {
    const cookieStore = await cookies();
    return {
        accessToken: cookieStore.get("access_token")?.value || null,
        refreshToken: cookieStore.get("refresh_token")?.value || null,
    };
}

// ── Auth Check Helper ──
export async function getCurrentUser(): Promise<JWTPayload | null> {
    const { accessToken } = await getTokensFromCookies();
    if (!accessToken) return null;
    return verifyAccessToken(accessToken);
}

// ── Password Reset Token ──
export async function createPasswordResetToken(
    userId: string
): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Invalidate any existing tokens
    await prisma.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
        data: { userId, token, expiresAt },
    });

    return token;
}

// ── OTP ──
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export async function generateOtp(
    email: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, BCRYPT_ROUNDS);

    // Invalidate any existing unused OTPs for this email + type
    await prisma.otpToken.updateMany({
        where: { email: email.toLowerCase(), type, usedAt: null },
        data: { usedAt: new Date() },
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await prisma.otpToken.create({
        data: {
            email: email.toLowerCase(),
            code: hashedCode,
            type,
            expiresAt,
        },
    });

    return code;
}

export async function verifyOtp(
    email: string,
    code: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
): Promise<{ valid: boolean; error?: string }> {
    const otp = await prisma.otpToken.findFirst({
        where: {
            email: email.toLowerCase(),
            type,
            usedAt: null,
        },
        orderBy: { createdAt: "desc" },
    });

    if (!otp) {
        return { valid: false, error: "No OTP found. Please request a new one." };
    }

    if (otp.expiresAt < new Date()) {
        return { valid: false, error: "OTP has expired. Please request a new one." };
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        return { valid: false, error: "Too many wrong attempts. Please request a new OTP." };
    }

    const isMatch = await bcrypt.compare(code, otp.code);

    if (!isMatch) {
        // Increment attempt counter
        await prisma.otpToken.update({
            where: { id: otp.id },
            data: { attempts: { increment: 1 } },
        });
        const remaining = OTP_MAX_ATTEMPTS - otp.attempts - 1;
        return {
            valid: false,
            error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        };
    }

    // Mark as used
    await prisma.otpToken.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
    });

    return { valid: true };
}

// ── Audit Logging ──
export async function logAuditEvent(
    action: string,
    userId?: string | null,
    details?: string,
    ipAddress?: string,
    userAgent?: string
) {
    await prisma.auditLog.create({
        data: {
            action,
            userId: userId || null,
            details: details || null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
        },
    });
}

// ── Account Lockout ──
const MAX_FAILED_LOGINS = parseInt(
    process.env.RATE_LIMIT_MAX_ATTEMPTS || "5"
);
const LOCKOUT_MINUTES = parseInt(
    process.env.ACCOUNT_LOCKOUT_MINUTES || "15"
);

export async function handleFailedLogin(userId: string) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { failedLogins: { increment: 1 } },
    });

    if (user.failedLogins >= MAX_FAILED_LOGINS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_MINUTES);
        await prisma.user.update({
            where: { id: userId },
            data: { lockedUntil },
        });
    }
}

export async function resetFailedLogins(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { failedLogins: 0, lockedUntil: null },
    });
}

export function isAccountLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
}

// ── Re-authenticate admin for destructive operations ──
export async function reAuthenticateAdmin(
    userId: string,
    password: string
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, role: true },
    });

    if (!user) return false;
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") return false;
    return verifyPassword(password, user.passwordHash);
}
