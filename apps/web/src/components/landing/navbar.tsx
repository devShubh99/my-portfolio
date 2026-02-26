"use client";

import Link from "next/link";
import { TrendingUp, Menu } from "lucide-react";
import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <TrendingUp className="h-6 w-6 text-bullish" />
                    <span className="text-xl font-bold tracking-tight">StockFolio</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-6 md:flex">
                    <ThemeToggle className="rounded-full border border-border/50 bg-card/50 p-2 shadow-sm backdrop-blur transition-colors hover:bg-accent" />
                    <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Sign In
                    </Link>
                    <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>

                {/* Mobile Nav (Sheet) */}
                <div className="md:hidden flex items-center gap-3">
                    <ThemeToggle className="rounded-full border border-border/50 bg-card/50 p-2 shadow-sm backdrop-blur transition-colors hover:bg-accent" />
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="flex flex-col gap-6 pt-12">
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Sign In
                            </Link>
                            <Button asChild className="w-full rounded-full bg-primary text-primary-foreground">
                                <Link href="/register" onClick={() => setIsOpen(false)}>Get Started</Link>
                            </Button>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
