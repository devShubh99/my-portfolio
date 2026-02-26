"use client";

import { useInView } from "@/hooks/useInView";
import { LayoutDashboard, Globe, Brain, LineChart, ShieldCheck, Settings } from "lucide-react";

export function FeaturesGrid() {
    const { ref, isInView } = useInView();

    const features = [
        {
            icon: <LayoutDashboard className="h-6 w-6 text-blue-400" />,
            title: "Multi-Asset Dashboard",
            desc: "Stocks, currencies, and commodities unified in one simple view."
        },
        {
            icon: <Globe className="h-6 w-6 text-emerald-400" />,
            title: "Global Market Overview",
            desc: "Live NIFTY, SENSEX, S&P 500, NASDAQ and comprehensive market data."
        },
        {
            icon: <Brain className="h-6 w-6 text-purple-400" />,
            title: "AI-Powered Insights",
            desc: "Sentiment scoring, correlation analysis, and personalized recommendations."
        },
        {
            icon: <LineChart className="h-6 w-6 text-amber-400" />,
            title: "Technical Analysis",
            desc: "RSI, SMA-50/200, and fully interactive candlestick charts for any ticker."
        },
        {
            icon: <ShieldCheck className="h-6 w-6 text-green-400" />,
            title: "Secure by Design",
            desc: "JWT auth, robust OTP verification, rate limiting, and meticulous audit logs."
        }
    ];

    return (
        <section className="py-24 px-6 relative" id="features">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-bullish to-blue-400">track, analyze, and grow.</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        A suite of professional-grade tools built into an incredibly intuitive, single-page command center.
                    </p>
                </div>

                <div
                    ref={ref}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feat, index) => (
                        <div
                            key={index}
                            className={`glass group relative overflow-hidden rounded-2xl p-8 transition-all duration-700
                                ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                            `}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-transparent transition-opacity duration-500 pointer-events-none" />

                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 shadow-inner">
                                {feat.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
