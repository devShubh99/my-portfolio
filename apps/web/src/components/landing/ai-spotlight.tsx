"use client";

import { useInView } from "@/hooks/useInView";
import { BrainCircuit, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export function AISpotlight() {
    const { ref, isInView } = useInView({ threshold: 0.3 });

    return (
        <section className="py-24 px-6 overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Copy */}
                    <div
                        ref={ref}
                        className={`transition-all duration-1000 delay-100
                            ${isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}
                        `}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                            Your portfolio has a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">brain now.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mb-8">
                            StockFolio's AI engine analyzes your holdings, detects market correlations, scores sentiment across news sources, and surfaces unseen risks — so you can make smarter decisions faster.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: <TrendingUp className="h-5 w-5 text-emerald-400" />, text: "Automated fundamental analysis." },
                                { icon: <BrainCircuit className="h-5 w-5 text-purple-400" />, text: "Market correlation and diversity checks." },
                                { icon: <AlertTriangle className="h-5 w-5 text-amber-400" />, text: "Real-time vulnerability surfacing." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="font-medium text-foreground/80">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: AI Card Mock */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className={`relative w-full max-w-sm glass rounded-2xl p-8 shadow-2xl transition-all duration-1000 delay-300
                            ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
                        `}>
                            {/* AI Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl pointer-events-none animate-[pulse-glow_4s_ease-in-out_infinite]" />

                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/40">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <BrainCircuit className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Portfolio Analysis</h3>
                                    <p className="text-xs text-muted-foreground">Generated just now</p>
                                </div>
                            </div>

                            <ul className="space-y-5">
                                <li className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                    <div>
                                        <p className="text-sm font-semibold mb-1 text-foreground/90">Medium Risk Level</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Exposure to Financials is relatively high at 42%. Consider hedging with IT or FMCG.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    <div>
                                        <p className="text-sm font-semibold mb-1 text-foreground/90">Positive Sentiment</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Recent earnings calls for 3 of your top 5 holdings indicate strong forward guidance.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                    <div>
                                        <p className="text-sm font-semibold mb-1 text-foreground/90">High Correlation</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Your portfolio closely mimics NIFTY 50 (0.89 beta). You are largely indexed to the market.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
