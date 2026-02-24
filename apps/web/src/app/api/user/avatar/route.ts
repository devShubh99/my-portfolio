import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import storage from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

// POST /api/user/avatar — upload avatar
export async function POST(req: NextRequest) {
    try {
        const auth = await getCurrentUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("avatar") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            );
        }

        const ext = file.name.split(".").pop() || "jpg";
        const filename = `avatars/${uuidv4()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Delete old avatar
        const currentUser = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { avatarUrl: true },
        });
        if (currentUser?.avatarUrl) {
            await storage.delete(currentUser.avatarUrl).catch(() => { });
        }

        // Save new avatar
        const url = await storage.save(filename, buffer);

        await prisma.user.update({
            where: { id: auth.userId },
            data: { avatarUrl: url },
        });

        await logAuditEvent("AVATAR_UPDATED", auth.userId, "Avatar uploaded");

        return NextResponse.json({ avatarUrl: url });
    } catch (error) {
        console.error("[Avatar Upload Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
