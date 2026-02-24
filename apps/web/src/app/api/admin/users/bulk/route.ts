import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { reAuthenticateAdmin, logAuditEvent } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * POST /api/admin/users/bulk — Bulk operations on multiple users.
 * Actions: suspend, activate, deactivate, delete, changeRole
 * Requires admin password re-authentication for destructive ops.
 */
export async function POST(req: NextRequest) {
    try {
        const result = await requireAdmin(PERMISSIONS.bulk_actions);
        if (result.error) return result.error;
        const { auth } = result;

        const { action, userIds, value, adminPassword } = await req.json();

        if (!action || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: "action and userIds[] are required" },
                { status: 400 }
            );
        }

        // Prevent self-inclusion
        const filteredIds = userIds.filter((id: string) => id !== auth.userId);
        if (filteredIds.length === 0) {
            return NextResponse.json(
                { error: "Cannot perform bulk action on yourself" },
                { status: 400 }
            );
        }

        // Destructive actions require re-authentication
        const destructiveActions = ["delete", "changeRole"];
        if (destructiveActions.includes(action)) {
            if (!adminPassword) {
                return NextResponse.json(
                    { error: "Admin password required for this action" },
                    { status: 400 }
                );
            }
            const valid = await reAuthenticateAdmin(auth.userId, adminPassword);
            if (!valid) {
                return NextResponse.json(
                    { error: "Invalid admin password" },
                    { status: 401 }
                );
            }
        }

        const ip = req.headers.get("x-forwarded-for") || undefined;
        let affected = 0;

        switch (action) {
            case "suspend":
                ({ count: affected } = await prisma.user.updateMany({
                    where: { id: { in: filteredIds } },
                    data: { status: "SUSPENDED" },
                }));
                break;

            case "activate":
                ({ count: affected } = await prisma.user.updateMany({
                    where: { id: { in: filteredIds } },
                    data: { status: "ACTIVE", failedLogins: 0, lockedUntil: null },
                }));
                break;

            case "deactivate":
                ({ count: affected } = await prisma.user.updateMany({
                    where: { id: { in: filteredIds } },
                    data: { status: "DEACTIVATED" },
                }));
                break;

            case "delete":
                // Revoke all tokens first
                await prisma.refreshToken.updateMany({
                    where: { userId: { in: filteredIds } },
                    data: { revoked: true },
                });
                ({ count: affected } = await prisma.user.deleteMany({
                    where: { id: { in: filteredIds } },
                }));
                break;

            case "changeRole":
                if (!value || !["USER", "MODERATOR", "ADMIN"].includes(value)) {
                    return NextResponse.json(
                        { error: "Invalid role value" },
                        { status: 400 }
                    );
                }
                ({ count: affected } = await prisma.user.updateMany({
                    where: { id: { in: filteredIds } },
                    data: { role: value },
                }));
                break;

            default:
                return NextResponse.json(
                    { error: "Unknown action" },
                    { status: 400 }
                );
        }

        await logAuditEvent(
            `ADMIN_BULK_${action.toUpperCase()}`,
            auth.userId,
            `Bulk ${action} on ${affected} users (IDs: ${filteredIds.join(", ")})`,
            ip
        );

        return NextResponse.json({ affected, action });
    } catch (error) {
        console.error("[Admin Bulk Action Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
