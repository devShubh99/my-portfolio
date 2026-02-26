"use client";

import Link from "next/link";
import { ArrowRight, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";

export function Hero() {
    const { ref, isInView } = useInView();

    return (
        <section className="relative min-h-[90vh] overflow-hidden pt-24 pb-12 flex items-center">
            {/* Background Glow */}
            <div className="absolute inset-0 z-0 bg-background">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-bullish/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            </div>

            <div className="mx-auto w-full max-w-7xl px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Copy */}
                    <div
                        ref={ref}
                        className={`flex flex-col gap-6 transform transition-all duration-1000 ${isInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                            }`}
                    >
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                            Your Entire Portfolio.<br />
                            <span className="bg-gradient-to-r from-bullish to-blue-500 bg-clip-text text-transparent">
                                One Intelligent Dashboard.
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
                            Track stocks across global and Indian markets, monitor currencies and commodities, and get AI-powered insights — all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base">
                                <Link href="/register">Start Tracking Free</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full h-14 px-8 text-base hover:bg-secondary">
                                <Link href="#how-it-works" className="group flex items-center gap-2">
                                    See how it works
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right: Visual Mock */}
                    <div className="relative w-full aspect-square max-w-md mx-auto lg:max-w-none perspective-1000">
                        {/* Main Glass Card */}
                        <div className="absolute inset-0 bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-[pulse-glow_4s_ease-in-out_infinite] transform lg:rotate-y-[-10deg] lg:rotate-x-[5deg]">
                            <div className="p-6 h-full flex flex-col gap-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg text-foreground">Live Markets</h3>
                                    <Activity className="h-5 w-5 text-bullish animate-pulse" />
                                </div>
                                {/* Fake Index Data */}
                                {[
                                    { name: "NIFTY 50", value: "24,320.15", change: "+1.2%" },
                                    { name: "S&P 500", value: "5,891.20", change: "+0.8%" },
                                    { name: "NASDAQ", value: "18,540.30", change: "-0.3%" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
                                        <span className="font-medium">{item.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm">{item.value}</span>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.change.startsWith('+') ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
                                                {item.change}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating AI Insight Card */}
                        <div className="absolute -bottom-8 -right-8 sm:-right-12 bg-card/80 backdrop-blur-3xl border border-bullish/30 p-4 rounded-xl shadow-xl max-w-[280px] animate-[slide-up_1s_ease-out_forwards] delay-500">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-bullish/20 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-bullish" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-bullish mb-1">AI Insight</p>
                                    <p className="text-sm text-muted-foreground leading-tight">
                                        Your portfolio is 67% correlated with NIFTY IT — consider diversification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
