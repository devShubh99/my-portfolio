import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCookies, rotateRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await getTokensFromCookies();

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token" },
                { status: 401 }
            );
        }

        const result = await rotateRefreshToken(refreshToken);

        if (!result) {
            return NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        await setAuthCookies(result.accessToken, result.refreshToken);

        return NextResponse.json({
            accessToken: result.accessToken,
        });
    } catch (error: any) {
        console.error("[Refresh Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
