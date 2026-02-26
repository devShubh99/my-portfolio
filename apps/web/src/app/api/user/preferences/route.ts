import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
