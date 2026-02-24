import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";

// GET /api/user/profile — get current user profile
export async function GET() {
    try {
        const auth = await getCurrentUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                mustChangePassword: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("[Profile GET Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/user/profile — update name/email
export async function PATCH(req: NextRequest) {
    try {
        const auth = await getCurrentUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const updateData: Record<string, any> = {};

        if (body.name !== undefined) {
            updateData.name = body.name.trim();
        }

        if (body.email !== undefined) {
            const newEmail = body.email.toLowerCase().trim();

            // Check if email is taken by another user
            const existing = await prisma.user.findUnique({
                where: { email: newEmail },
            });
            if (existing && existing.id !== auth.userId) {
                return NextResponse.json(
                    { error: "Email is already in use" },
                    { status: 409 }
                );
            }
            updateData.email = newEmail;
        }

        const user = await prisma.user.update({
            where: { id: auth.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
            },
        });

        await logAuditEvent(
            "PROFILE_UPDATED",
            auth.userId,
            `Profile updated: ${JSON.stringify(updateData)}`
        );

        return NextResponse.json({ user });
    } catch (error) {
        console.error("[Profile PATCH Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
