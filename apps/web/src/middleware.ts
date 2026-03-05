/**
 * Next.js Edge Middleware — Authentication & Route Protection.
 *
 * Runs on every matched request before the page/API handler.
 * Responsibilities:
 *  1. Verify the JWT access token from cookies.
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Enforce RBAC — only ADMIN/MODERATOR can access `/admin/*`.
 *  4. Redirect authenticated users away from auth pages (login, register).
 *  5. Force users with `mustChangePassword` flag to `/change-password`.
 *
 * Auth API routes (`/api/auth/*`) are excluded — they handle their own auth.
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "dev-secret-change-me"
);

// ── Route categories ──
const USER_ROUTES = ["/dashboard", "/asset", "/api/user"];
const ADMIN_ROUTES = ["/admin", "/api/admin"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip API auth routes — they handle their own auth
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // ── Classify route ──
    const isUserRoute = USER_ROUTES.some((r) => pathname.startsWith(r));
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    const isAdminLogin = pathname === "/admin/login";
    const isAuthPage = AUTH_PAGES.some((r) => pathname.startsWith(r));

    // ── Verify JWT ──
    const accessToken = req.cookies.get("access_token")?.value;
    let payload: any = null;

    if (accessToken) {
        try {
            const { payload: decoded } = await jwtVerify(accessToken, JWT_SECRET);
            payload = decoded;
        } catch {
            // Token invalid or expired — treat as unauthenticated
        }
    }

    const isAdmin = payload?.role === "ADMIN" || payload?.role === "MODERATOR";

    // ── Force password change (highest priority after auth) ──
    if (
        payload?.mustChangePassword &&
        !pathname.startsWith("/change-password") &&
        !pathname.startsWith("/api/auth") &&
        !pathname.startsWith("/api/user/change-password")
    ) {
        return NextResponse.redirect(new URL("/change-password", req.url));
    }

    // ── Auth pages: redirect already-authenticated users by role ──
    if (isAuthPage && payload) {
        if (isAdmin) {
            return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ── Admin login page: allow unauthenticated, redirect authenticated admins ──
    if (isAdminLogin) {
        if (payload && isAdmin) {
            return NextResponse.redirect(new URL("/admin", req.url));
        }
        // Allow access (unauthenticated or non-admin can see the form)
        return NextResponse.next();
    }

    // ── Admin routes (excluding /admin/login) ──
    if (isAdminRoute && !isAdminLogin) {
        if (!payload) {
            // API routes return 401, pages redirect to admin login
            if (pathname.startsWith("/api/admin")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
        if (!isAdmin) {
            // Regular user trying to access admin — block
            if (pathname.startsWith("/api/admin")) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        // Admin user accessing admin route — allow
        return NextResponse.next();
    }

    // ── User routes: admin users get redirected to admin panel ──
    if (isUserRoute) {
        if (!payload) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
        // Admin hitting user dashboard → redirect to admin panel
        if (isAdmin && pathname === "/dashboard") {
            return NextResponse.redirect(new URL("/admin", req.url));
        }
        // Allow admin to use /api/user/* routes (for their own profile etc)
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/asset/:path*",
        "/admin/:path*",
        "/api/user/:path*",
        "/api/admin/:path*",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/change-password",
    ],
};
