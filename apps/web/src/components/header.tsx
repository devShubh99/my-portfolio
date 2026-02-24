"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    Search,
    User,
    Settings,
    PieChart,
    LogOut,
    Moon,
    Sun,
    HelpCircle,
    Shield,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
}

export default function Header() {
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync initial theme from <html> class
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    // Fetch current user profile
    useEffect(() => {
        fetch("/api/user/profile")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.user) setUser(data.user);
            })
            .catch(() => { });
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch { }
        router.push("/login");
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <header className="flex h-16 items-center justify-between border-b bg-card/50 px-6 backdrop-blur-sm">
            {/* Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search stocks, portfolios..."
                    className="h-9 pl-9 bg-background/50"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </Button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProfileOpen(!profileOpen)}
                        className={profileOpen ? "bg-accent" : ""}
                    >
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt="Avatar"
                                className="h-7 w-7 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500">
                                <User className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </Button>

                    {profileOpen && (
                        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* User Info */}
                            <div className="border-b px-4 py-3">
                                <p className="text-sm font-semibold">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {user?.email || "..."}
                                </p>
                                {user?.role && user.role !== "USER" && (
                                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${user.role === "ADMIN"
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-amber-500/10 text-amber-400"
                                        }`}>
                                        {user.role}
                                    </span>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="p-1.5">
                                <Link
                                    href="/dashboard/portfolio"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent">
                                        <PieChart className="h-4 w-4 text-muted-foreground" />
                                        My Portfolio
                                    </div>
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        Settings
                                    </div>
                                </Link>
                                {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent">
                                            <Shield className="h-4 w-4 text-red-400" />
                                            Admin Panel
                                        </div>
                                    </Link>
                                )}
                                <button
                                    onClick={toggleTheme}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                                >
                                    {isDark ? (
                                        <Moon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Sun className="h-4 w-4 text-amber-400" />
                                    )}
                                    {isDark ? "Dark Mode" : "Light Mode"}
                                    <span
                                        className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${isDark
                                                ? "bg-primary/15 text-primary"
                                                : "bg-amber-500/15 text-amber-400"
                                            }`}
                                    >
                                        {isDark ? "ON" : "OFF"}
                                    </span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    Help & Support
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="border-t p-1.5">
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                >
                                    {loggingOut ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
