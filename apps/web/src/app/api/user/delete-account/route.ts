import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, verifyPassword, clearAuthCookies, logAuditEvent } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
    try {
        const auth = await getCurrentUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { password, confirmation } = await req.json();

        if (confirmation !== "DELETE MY ACCOUNT") {
            return NextResponse.json(
                { error: 'Type "DELETE MY ACCOUNT" to confirm' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { error: "Password is required for account deletion" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify password
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json(
                { error: "Incorrect password" },
                { status: 401 }
            );
        }

        // Log before deletion (audit log userId will be set to null due to onDelete: SetNull)
        await logAuditEvent(
            "ACCOUNT_DELETED",
            auth.userId,
            `Account self-deleted: ${user.email}`,
            req.headers.get("x-forwarded-for") || undefined
        );

        // Delete (cascades to portfolios, holdings, transactions, tokens)
        await prisma.user.delete({ where: { id: auth.userId } });

        await clearAuthCookies();

        return NextResponse.json({
            message: "Account has been permanently deleted",
        });
    } catch (error) {
        console.error("[Delete Account Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
