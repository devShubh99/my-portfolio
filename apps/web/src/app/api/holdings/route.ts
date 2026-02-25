import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/holdings — list holdings (optionally filter by portfolioId)
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

// POST /api/holdings — add a new holding to a portfolio
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

// DELETE /api/holdings — remove a holding (and its transactions)
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
