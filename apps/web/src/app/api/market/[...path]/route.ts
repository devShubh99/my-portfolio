import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for market data API.
 * This ensures market data works identically on localhost and via ngrok
 * by routing all requests through the Next.js server.
 *
 * GET /api/market/[...path] → http://localhost:8000/api/[...path]
 */

const FASTAPI_BASE = process.env.MARKET_DATA_API_URL || "http://localhost:8000";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const segments = path.join("/");
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const url = `${FASTAPI_BASE}/api/${segments}${queryString ? `?${queryString}` : ""}`;

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
            // Don't cache market data
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: `FastAPI returned ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[Market Proxy Error]", error.message);
        return NextResponse.json(
            { error: "Could not fetch market data. Make sure the FastAPI service is running on port 8000." },
            { status: 502 }
        );
    }
}
