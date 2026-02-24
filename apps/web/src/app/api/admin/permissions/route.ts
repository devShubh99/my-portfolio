import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { PERMISSIONS, getPermissionMatrix } from "@/lib/permissions";

/**
 * GET /api/admin/permissions — Return the full permission matrix.
 */
export async function GET() {
    try {
        const result = await requireAdmin(PERMISSIONS.manage_roles);
        if (result.error) return result.error;

        return NextResponse.json({ matrix: getPermissionMatrix() });
    } catch (error) {
        console.error("[Admin Permissions Error]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
