"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("theme");
        const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="fixed bottom-5 right-5 z-50 rounded-full border border-border/50 bg-card/80 p-2.5 shadow-lg backdrop-blur-sm transition-colors hover:bg-accent"
        >
            {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
            ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
            )}
        </button>
    );
}
