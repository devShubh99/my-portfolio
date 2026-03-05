/**
 * Transactions API — record and list buy/sell events.
 *
 * When a new transaction is created, the parent holding's
 * `averageBuyPrice` and `totalQuantity` are automatically
 * recalculated from the full transaction history.
 *
 * @module api/transactions
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * List transactions, optionally filtered by holding.
 *
 * @param request - Query param `holdingId` to filter (optional).
 * @returns JSON array of transactions, ordered by date (newest first).
 */
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

/**
 * Record a new BUY or SELL transaction.
 *
 * After creation, recalculates the parent holding's aggregate fields:
 * - `totalQuantity`: sum of BUY quantities minus sum of SELL quantities.
 * - `averageBuyPrice`: weighted average of BUY prices (SELL excluded).
 *
 * @param request - JSON body: `{ holdingId, type, price, quantity, date? }`
 * @returns The created transaction (201).
 */
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
