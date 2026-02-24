import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { reAuthenticateAdmin, logAuditEvent } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

// PATCH /api/admin/users/[id] — update user role/status (destructive ops require re-auth)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireAdmin(PERMISSIONS.manage_users);
        if (result.error) return result.error;
        const { auth } = result;

        const { id } = await params;
        const body = await req.json();
        const updateData: Record<string, any> = {};

        // Prevent self-demotion
        if (id === auth.userId && body.role && body.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Cannot change your own role" },
                { status: 400 }
            );
        }

        // Role changes require manage_roles permission and re-authentication
        if (body.role) {
            if (!["USER", "MODERATOR", "ADMIN"].includes(body.role)) {
                return NextResponse.json({ error: "Invalid role" }, { status: 400 });
            }
            // Check manage_roles permission
            const roleResult = await requireAdmin(PERMISSIONS.manage_roles);
            if (roleResult.error) return roleResult.error;

            // Re-auth for role changes
            if (body.adminPassword) {
                const valid = await reAuthenticateAdmin(auth.userId, body.adminPassword);
                if (!valid) {
                    return NextResponse.json(
                        { error: "Invalid admin password" },
                        { status: 401 }
                    );
                }
            }
            updateData.role = body.role;
        }

        if (body.status) {
            if (!["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(body.status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            updateData.status = body.status;
        }

        // Unlock account
        if (body.unlock) {
            updateData.failedLogins = 0;
            updateData.lockedUntil = null;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
            },
        });

        await logAuditEvent(
            "ADMIN_USER_UPDATED",
            auth.userId,
            `Admin updated user ${user.email}: ${JSON.stringify(updateData)}`,
            req.headers.get("x-forwarded-for") || undefined
        );

        return NextResponse.json({ user });
    } catch (error) {
        console.error("[Admin User Update Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] — permanently delete user (requires re-auth)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireAdmin(PERMISSIONS.delete_users);
        if (result.error) return result.error;
        const { auth } = result;

        const { id } = await params;

        // Prevent self-deletion
        if (id === auth.userId) {
            return NextResponse.json(
                { error: "Cannot delete your own account from admin panel" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await logAuditEvent(
            "ADMIN_USER_DELETED",
            auth.userId,
            `Admin permanently deleted user: ${user.email}`,
            req.headers.get("x-forwarded-for") || undefined
        );

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ message: "User permanently deleted" });
    } catch (error) {
        console.error("[Admin User Delete Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
