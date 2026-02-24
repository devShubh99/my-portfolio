import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    clearAuthCookies,
    getTokensFromCookies,
    logAuditEvent,
    verifyAccessToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { accessToken, refreshToken } = await getTokensFromCookies();

        let userId: string | null = null;
        if (accessToken) {
            const payload = verifyAccessToken(accessToken);
            if (payload) userId = payload.userId;
        }

        // Revoke refresh token if present
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true },
            });
        }

        await clearAuthCookies();

        if (userId) {
            await logAuditEvent(
                "LOGOUT",
                userId,
                "User logged out",
                req.headers.get("x-forwarded-for") || undefined
            );
        }

        return NextResponse.json({ message: "Logged out successfully" });
    } catch (error: any) {
        console.error("[Logout Error]", error);
        await clearAuthCookies();
        return NextResponse.json({ message: "Logged out" });
    }
}
