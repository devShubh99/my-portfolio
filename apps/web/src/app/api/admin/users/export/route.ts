import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/admin/users/export — Export users as CSV.
 * Supports same filters as the user list endpoint.
 */
export async function GET(req: NextRequest) {
    try {
        const result = await requireAdmin(PERMISSIONS.export_data);
        if (result.error) return result.error;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const role = searchParams.get("role") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search } },
                { name: { contains: search } },
            ];
        }
        if (status) where.status = status;
        if (role) where.role = role;

        const users = await prisma.user.findMany({
            where,
            select: {
                email: true,
                name: true,
                role: true,
                status: true,
                failedLogins: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Build CSV
        const header = "Email,Name,Role,Status,Failed Logins,Signup Date,Last Login";
        const rows = users.map((u) =>
            [
                u.email,
                `"${(u.name || "").replace(/"/g, '""')}"`,
                u.role,
                u.status,
                u.failedLogins,
                u.createdAt.toISOString(),
                u.lastLoginAt?.toISOString() || "",
            ].join(",")
        );
        const csv = [header, ...rows].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error("[Admin Users Export Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
