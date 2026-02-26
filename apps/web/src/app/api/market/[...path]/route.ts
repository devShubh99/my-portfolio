import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for market data API.
 * This ensures market data works identically on localhost and via ngrok
 * by routing all requests through the Next.js server.
 *
 * GET /api/market/[...path] → http://localhost:8000/api/[...path]
 */

const FASTAPI_BASE = process.env.MARKET_DATA_API_URL || "http://localhost:8000";
const PROXY_TIMEOUT_MS = 60000; // 60 seconds

async function handleProxyRequest(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
    method: "GET" | "POST"
) {
    try {
        const { path } = await params;
        const segments = path.join("/");
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const url = `${FASTAPI_BASE}/api/${segments}${queryString ? `?${queryString}` : ""}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

        const fetchOptions: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
        };

        if (method === "POST") {
            try {
                // Clone request to avoid consuming body if we need it later
                const body = await request.clone().json();
                fetchOptions.body = JSON.stringify(body);
            } catch (e) {
                // No body or invalid JSON
            }
        }

        const res = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json(
                { error: `FastAPI returned ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.name === "AbortError") {
            console.error("[Market Proxy Error] Request to Python backend timed out after 15s");
            return NextResponse.json(
                { error: "Market data service is taking too long to respond. Please try again." },
                { status: 504 }
            );
        }

        console.error("[Market Proxy Error]", error.message);
        return NextResponse.json(
            { error: "Could not fetch market data. Make sure the FastAPI service is running on port 8000." },
            { status: 502 }
        );
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    return handleProxyRequest(request, context, "GET");
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    return handleProxyRequest(request, context, "POST");
}
