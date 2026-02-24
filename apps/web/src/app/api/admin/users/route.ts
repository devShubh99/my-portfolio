import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/users — list users with search, filter, pagination, sorting
export async function GET(req: NextRequest) {
    try {
        const result = await requireAdmin(PERMISSIONS.manage_users);
        if (result.error) return result.error;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const role = searchParams.get("role") || "";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const order = searchParams.get("order") === "asc" ? "asc" : "desc";
        const signedUpAfter = searchParams.get("signedUpAfter");
        const signedUpBefore = searchParams.get("signedUpBefore");

        const where: any = {};

        // SQLite-compatible search (no insensitive mode)
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { name: { contains: search } },
            ];
        }

        if (status) where.status = status;
        if (role) where.role = role;

        // Date range filters
        if (signedUpAfter || signedUpBefore) {
            where.createdAt = {};
            if (signedUpAfter) where.createdAt.gte = new Date(signedUpAfter);
            if (signedUpBefore) where.createdAt.lte = new Date(signedUpBefore);
        }

        // Validate sortBy field
        const allowedSorts = ["createdAt", "email", "name", "role", "status", "lastLoginAt", "failedLogins"];
        const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : "createdAt";

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    failedLogins: true,
                    lockedUntil: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { [safeSortBy]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[Admin Users List Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
