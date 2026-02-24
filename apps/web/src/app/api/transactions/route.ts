import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/transactions — list transactions (optionally filter by holdingId)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const holdingId = searchParams.get("holdingId");

        const transactions = await prisma.transaction.findMany({
            where: holdingId ? { holdingId } : undefined,
            orderBy: { date: "desc" },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("[GET /api/transactions]", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

// POST /api/transactions — record a new BUY or SELL transaction
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { holdingId, type, price, quantity, date } = body;

        if (!holdingId || !type || !price || !quantity) {
            return NextResponse.json(
                { error: "holdingId, type, price, and quantity are required" },
                { status: 400 }
            );
        }

        if (!["BUY", "SELL"].includes(type)) {
            return NextResponse.json(
                { error: "type must be BUY or SELL" },
                { status: 400 }
            );
        }

        // Create the transaction
        const transaction = await prisma.transaction.create({
            data: {
                holdingId,
                type,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                date: date ? new Date(date) : new Date(),
            },
        });

        // Recalculate the holding's averageBuyPrice and totalQuantity
        const allTransactions = await prisma.transaction.findMany({
            where: { holdingId },
        });

        let totalQty = 0;
        let totalCost = 0;

        for (const t of allTransactions) {
            if (t.type === "BUY") {
                totalCost += t.price * t.quantity;
                totalQty += t.quantity;
            } else {
                totalQty -= t.quantity;
            }
        }

        await prisma.holding.update({
            where: { id: holdingId },
            data: {
                totalQuantity: Math.max(totalQty, 0),
                averageBuyPrice: totalQty > 0 ? totalCost / totalQty : 0,
            },
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error("[POST /api/transactions]", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
