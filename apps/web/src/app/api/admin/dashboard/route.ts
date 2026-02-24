import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/admin/dashboard — Enhanced dashboard stats.
 * Returns counts, role distribution, and 7-day trends.
 */
export async function GET() {
    try {
        const result = await requireAdmin(PERMISSIONS.view_audit);
        if (result.error) return result.error;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            deactivatedUsers,
            newSignupsToday,
            newSignups30d,
            failedLoginsToday,
            totalAuditLogs,
            adminCount,
            moderatorCount,
            userCount,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "ACTIVE" } }),
            prisma.user.count({ where: { status: "SUSPENDED" } }),
            prisma.user.count({ where: { status: "DEACTIVATED" } }),
            prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.auditLog.count({
                where: { action: "LOGIN_FAILED", createdAt: { gte: todayStart } },
            }),
            prisma.auditLog.count(),
            prisma.user.count({ where: { role: "ADMIN" } }),
            prisma.user.count({ where: { role: "MODERATOR" } }),
            prisma.user.count({ where: { role: "USER" } }),
        ]);

        // 7-day signup trend
        const signupTrend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);

            const count = await prisma.user.count({
                where: { createdAt: { gte: dayStart, lt: dayEnd } },
            });
            signupTrend.push({
                date: dayStart.toISOString().slice(0, 10),
                count,
            });
        }

        // 7-day failed login trend
        const failedLoginTrend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);

            const count = await prisma.auditLog.count({
                where: {
                    action: "LOGIN_FAILED",
                    createdAt: { gte: dayStart, lt: dayEnd },
                },
            });
            failedLoginTrend.push({
                date: dayStart.toISOString().slice(0, 10),
                count,
            });
        }

        return NextResponse.json({
            stats: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                deactivatedUsers,
                newSignupsToday,
                newSignups30d,
                failedLoginsToday,
                totalAuditLogs,
                roleDistribution: {
                    admin: adminCount,
                    moderator: moderatorCount,
                    user: userCount,
                },
                signupTrend,
                failedLoginTrend,
            },
        });
    } catch (error) {
        console.error("[Admin Dashboard Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
