/**
 * Shared admin authorization helper.
 * Validates JWT, checks admin role, and checks specific permissions.
 * Every admin API endpoint should call this instead of duplicating auth logic.
 */

import { getCurrentUser, type JWTPayload } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import { NextResponse } from "next/server";

interface AdminAuthResult {
    auth: JWTPayload;
    error?: never;
}

interface AdminAuthError {
    auth?: never;
    error: NextResponse;
}

/**
 * Validate that the current user is an admin/moderator and has the required permission.
 */
export async function requireAdmin(
    requiredPermission?: Permission
): Promise<AdminAuthResult | AdminAuthError> {
    const auth = await getCurrentUser();

    if (!auth) {
        return {
            error: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }

    if (auth.role !== "ADMIN" && auth.role !== "MODERATOR") {
        return {
            error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    if (requiredPermission && !hasPermission(auth.role, requiredPermission)) {
        return {
            error: NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            ),
        };
    }

    return { auth };
}
