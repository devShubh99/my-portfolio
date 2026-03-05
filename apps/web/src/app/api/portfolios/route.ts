/**
 * Portfolios API — create and list user portfolios.
 *
 * Each portfolio is a named collection of {@link Holding} records
 * belonging to a specific user.
 *
 * @module api/portfolios
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * List all portfolios with their holdings and transactions.
 *
 * @param request - Query param `userId` to filter by owner (optional).
 * @returns JSON array of portfolios, ordered by creation date (newest first).
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        const portfolios = await prisma.portfolio.findMany({
            where: userId ? { userId } : undefined,
            include: {
                holdings: {
                    include: { transactions: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(portfolios);
    } catch (error) {
        console.error("[GET /api/portfolios]", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolios" },
            { status: 500 }
        );
    }
}

/**
 * Create a new portfolio for a user.
 *
 * @param request - JSON body: `{ userId, name }`
 * @returns The created portfolio (201) with an empty holdings array.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, name } = body;

        if (!userId || !name) {
            return NextResponse.json(
                { error: "userId and name are required" },
                { status: 400 }
            );
        }

        const portfolio = await prisma.portfolio.create({
            data: { userId, name },
            include: { holdings: true },
        });

        return NextResponse.json(portfolio, { status: 201 });
    } catch (error) {
        console.error("[POST /api/portfolios]", error);
        return NextResponse.json(
            { error: "Failed to create portfolio" },
            { status: 500 }
        );
    }
}
