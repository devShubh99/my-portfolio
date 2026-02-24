import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/portfolios — list all portfolios (optionally filter by userId)
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

// POST /api/portfolios — create a portfolio for a user
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
