import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/users — list all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: { portfolios: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("[GET /api/users]", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST /api/users — create a new user
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.create({
            data: { email, name },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 409 }
            );
        }
        console.error("[POST /api/users]", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
