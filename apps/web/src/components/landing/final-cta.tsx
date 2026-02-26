"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";

export function FinalCTA() {
    const { ref, isInView } = useInView();

    return (
        <section className="relative py-32 px-6 overflow-hidden bg-background border-t border-border/40">
            {/* Massive background glow */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                <div className="w-full max-w-[800px] aspect-square rounded-full bg-bullish/10 blur-[150px] opacity-70" />
            </div>

            <div
                ref={ref}
                className={`max-w-3xl mx-auto text-center relative z-10 transition-all duration-1000
                    ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}
                `}
            >
                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                    Start tracking your portfolio today.
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                    Free to use. No credit card required. Connect your investments to a world-class analytics engine in seconds.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105">
                        <Link href="/register">Create Free Account</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-10 text-lg font-semibold bg-background/50 backdrop-blur-sm border-border/50 hover:bg-secondary">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
