"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
    isAuthenticated?: boolean;
    className?: string;
}

export function ThemeToggle({ isAuthenticated = false, className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);

        if (isAuthenticated) {
            // fire and forget background sync
            fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: next })
            }).catch(e => console.warn("Failed to sync theme preference", e));
        }
    };

    if (!mounted) {
        // Render a placeholder with the same dimensions to avoid layout shift
        return (
            <button
                aria-label="Toggle theme"
                className={className || "fixed bottom-5 right-5 z-50 rounded-full border border-border/50 bg-card/80 p-2.5 shadow-lg backdrop-blur-sm"}
                disabled
            >
                <div className="h-4 w-4" />
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            className={className || "fixed bottom-5 right-5 z-50 rounded-full border border-border/50 bg-card/80 p-2.5 shadow-lg backdrop-blur-sm transition-colors hover:bg-accent"}
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
            ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
            )}
        </button>
    );
}

