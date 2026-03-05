/**
 * User Preferences API — persists user settings (e.g. theme) to the database.
 *
 * Requires authentication. The saved theme is returned in the login
 * response payload so the client can apply it without an extra request.
 *
 * @module api/user/preferences
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Update the authenticated user's theme preference.
 *
 * @param req - JSON body: `{ theme: "dark" | "light" }`
 * @returns `{ success: true, theme }` on success.
 */
export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { theme } = body;

        if (theme !== "dark" && theme !== "light") {
            return NextResponse.json({ error: "Invalid theme value. Must be 'dark' or 'light'" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: { theme },
        });

        return NextResponse.json({
            success: true,
            theme: updatedUser.theme,
        });
    } catch (error) {
        console.error("[User Preference Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
