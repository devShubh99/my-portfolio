"use client";

import { MOCK_DATA } from "./mock-data";

export function TickerStrip() {
    // We render the list twice to create a seamless infinite CSS marquee.
    const renderTickers = () => {
        return MOCK_DATA.tickers.map((ticker, index) => (
            <div key={`${ticker.name}-${index}`} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 border-r border-border/20 last:border-0 hover:bg-white/5 transition-colors cursor-default">
                <span className="font-semibold text-sm text-foreground/90">{ticker.name}</span>
                <span className="text-sm font-mono text-muted-foreground ml-2">·</span>
                <span className="font-mono text-sm">{ticker.value}</span>
                <span className={`text-xs ml-1 flex items-center shadow-sm ${ticker.isUp ? 'text-bullish' : 'text-bearish'}`}>
                    {ticker.isUp ? '▲' : '▼'} {ticker.change}%
                </span>
            </div>
        ));
    };

    return (
        <div className="w-full bg-background/80 backdrop-blur-md border-y border-border/40 overflow-hidden relative flex py-1">
            {/* Left and right fade masks for a cleaner edge look */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee w-max">
                {/* First Segment */}
                <div className="flex items-center">
                    {renderTickers()}
                </div>
                {/* Duplicated Segment for seamless looping */}
                <div className="flex items-center" aria-hidden="true">
                    {renderTickers()}
                </div>
            </div>
        </div>
    );
}
