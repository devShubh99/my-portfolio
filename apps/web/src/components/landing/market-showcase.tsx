"use client";

import { useInView } from "@/hooks/useInView";
import { MOCK_DATA } from "./mock-data";
import { Landmark, Globe2, Coins } from "lucide-react";

export function MarketShowcase() {
    const { ref, isInView } = useInView();

    const markets = [
        {
            icon: <Landmark className="h-6 w-6 text-orange-400" />,
            title: "Indian Markets",
            description: "NSE & BSE stocks with native .NS / .BO tracking. Track NIFTY 50 and SENSEX live."
        },
        {
            icon: <Globe2 className="h-6 w-6 text-blue-400" />,
            title: "Global Markets",
            description: "S&P 500, NASDAQ, NYSE, and major global indices right alongside your local assets."
        },
        {
            icon: <Coins className="h-6 w-6 text-amber-500" />,
            title: "Currencies & Commodities",
            description: "Monitor FX pairs like USD/INR, EUR/INR plus Gold (MCX) and Crude Oil."
        }
    ];

    return (
        <section className="py-24 px-6 border-y border-border/40 bg-card/10">
            <div className="max-w-7xl mx-auto text-center" ref={ref}>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                    Supports every market you care about.
                </h2>
                <p className="text-muted-foreground text-lg mb-16">
                    Powered by high-fidelity data feeds via Yahoo Finance.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {markets.map((market, i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center glass rounded-2xl p-8 transition-all duration-700
                                ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
                            `}
                            style={{ transitionDelay: `${i * 150}ms` }}
                        >
                            <div className="mb-4 bg-background p-3 rounded-full border border-border/50">
                                {market.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{market.title}</h3>
                            <p className="text-muted-foreground">{market.description}</p>
                        </div>
                    ))}
                </div>

                {/* Brands/Exchanges */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 opacity-60">
                    {MOCK_DATA.brands.map((brand, i) => (
                        <span key={i} className="text-2xl sm:text-3xl font-bold tracking-tighter text-muted-foreground hover:text-foreground transition-colors cursor-default">
                            {brand}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
