/**
 * Holdings API — CRUD operations for stock positions within a portfolio.
 *
 * @module api/holdings
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * List all holdings, optionally filtered by portfolio.
 *
 * @param request - Incoming request. Query param `portfolioId` to filter.
 * @returns JSON array of holdings with their transactions.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get("portfolioId");

        const holdings = await prisma.holding.findMany({
            where: portfolioId ? { portfolioId } : undefined,
            include: { transactions: true },
            orderBy: { tickerSymbol: "asc" },
        });

        return NextResponse.json(holdings);
    } catch (error) {
        console.error("[GET /api/holdings]", error);
        return NextResponse.json(
            { error: "Failed to fetch holdings" },
            { status: 500 }
        );
    }
}

/**
 * Create a new holding in a portfolio.
 *
 * @param request - JSON body: `{ portfolioId, tickerSymbol, averageBuyPrice, totalQuantity }`
 * @returns The created holding (201) or an error.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { portfolioId, tickerSymbol, averageBuyPrice, totalQuantity } = body;

        if (!portfolioId || !tickerSymbol) {
            return NextResponse.json(
                { error: "portfolioId and tickerSymbol are required" },
                { status: 400 }
            );
        }

        const holding = await prisma.holding.create({
            data: {
                portfolioId,
                tickerSymbol: tickerSymbol.toUpperCase(),
                averageBuyPrice: parseFloat(averageBuyPrice) || 0,
                totalQuantity: parseInt(totalQuantity) || 0,
            },
            include: { transactions: true },
        });

        return NextResponse.json(holding, { status: 201 });
    } catch (error) {
        console.error("[POST /api/holdings]", error);
        return NextResponse.json(
            { error: "Failed to create holding" },
            { status: 500 }
        );
    }
}

/**
 * Delete a holding and all of its associated transactions.
 *
 * @param request - Query param `id` (required) — the holding ID to remove.
 * @returns `{ success: true }` on success.
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const holdingId = searchParams.get("id");

        if (!holdingId) {
            return NextResponse.json(
                { error: "Holding ID is required" },
                { status: 400 }
            );
        }

        // Delete transactions first, then the holding
        await prisma.transaction.deleteMany({
            where: { holdingId },
        });

        await prisma.holding.delete({
            where: { id: holdingId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/holdings]", error);
        return NextResponse.json(
            { error: "Failed to delete holding" },
            { status: 500 }
        );
    }
}
