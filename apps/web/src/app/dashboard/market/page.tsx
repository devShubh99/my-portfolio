"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchBatchQuotes, fetchMarketMovers, MarketMovers, QuoteData } from "@/lib/api";
import { cn } from "@/lib/utils";

const INDEX_TICKERS = ["^NSEI", "^BSESN", "^NSEBANK", "^GSPC", "^IXIC", "^DJI"];
const INDEX_NAMES: Record<string, string> = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "SENSEX",
    "^NSEBANK": "NIFTY BANK",
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ",
    "^DJI": "DOW JONES",
};

const WATCHLIST_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "ADANIENT.NS", "WIPRO.NS",
    "AXISBANK.NS", "MARUTI.NS", "SUNPHARMA.NS", "TATAMOTORS.NS", "KOTAKBANK.NS"
];

const ASSET_TICKERS = ["USDINR=X", "GC=F", "CL=F"];
const ASSET_NAMES: Record<string, string> = {
    "USDINR=X": "USD / INR",
    "GC=F": "GOLD",
    "CL=F": "CRUDE OIL",
};

const SECTOR_TICKERS = [
    "^CNXIT", "^NSEBANK", "^CNXAUTO", "^CNXPHARMA",
    "^CNXFMCG", "^CNXMETAL", "^CNXREALTY", "^CNXENERGY"
];
const SECTOR_NAMES: Record<string, string> = {
    "^CNXIT": "IT",
    "^NSEBANK": "BANK",
    "^CNXAUTO": "AUTO",
    "^CNXPHARMA": "PHARMA",
    "^CNXFMCG": "FMCG",
    "^CNXMETAL": "METAL",
    "^CNXREALTY": "REAL ESTATE",
    "^CNXENERGY": "ENERGY"
};

function MarketStatusBadge({ exchange }: { exchange: string }) {
    const [status, setStatus] = useState<{
        isOpen: boolean;
        message: string;
    }>({ isOpen: false, message: "Calculating..." });

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date();
            const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
            const istTime = new Date(utcTime + (5.5 * 3600000));

            const day = istTime.getDay(); // 0 = Sun, 6 = Sat
            const hours = istTime.getHours();
            const minutes = istTime.getMinutes();
            const timeInMinutes = hours * 60 + minutes;

            const openTime = 9 * 60 + 15;
            const closeTime = 15 * 60 + 30;

            const isWeekday = day >= 1 && day <= 5;
            const isOpen = isWeekday && timeInMinutes >= openTime && timeInMinutes < closeTime;

            let message = "";
            if (isOpen) {
                const diff = closeTime - timeInMinutes;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                message = `Closes in ${h}h ${m}m`;
            } else {
                if (!isWeekday || (isWeekday && timeInMinutes >= closeTime)) {
                    message = "Market Closed";
                } else {
                    const diff = openTime - timeInMinutes;
                    const h = Math.floor(diff / 60);
                    const m = diff % 60;
                    message = `Opens in ${h}h ${m}m`;
                }
            }
            setStatus({ isOpen, message });
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className={cn(
                    "h-2 w-2 rounded-full",
                    status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                )} />
                <span className="text-sm font-semibold">{exchange}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">{status.message}</span>
        </div>
    );
}

function FiftyTwoWeekRange({ high, low, current }: { high: number; low: number; current: number }) {
    if (!high || !low || !current) return null;
    const progress = ((current - low) / (high - low)) * 100;
    const boundedProgress = Math.max(0, Math.min(100, progress));

    return (
        <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>52w L: ₹{low.toLocaleString()}</span>
                <span>52w H: ₹{high.toLocaleString()}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${boundedProgress}%` }}
                />
            </div>
        </div>
    );
}

export default function MarketPage() {
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [indices, setIndices] = useState<QuoteData[]>([]);
    const [movers, setMovers] = useState<MarketMovers>({ gainers: [], losers: [], mostActive: [] });
    const [watchlist, setWatchlist] = useState<QuoteData[]>([]);
    const [assets, setAssets] = useState<QuoteData[]>([]);
    const [sectors, setSectors] = useState<QuoteData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "mostActive">("gainers");
    const [nextRefreshIn, setNextRefreshIn] = useState(60);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [indicesData, moversData, watchlistData, assetsData, sectorsData] = await Promise.all([
                fetchBatchQuotes(INDEX_TICKERS),
                fetchMarketMovers(),
                fetchBatchQuotes(WATCHLIST_TICKERS),
                fetchBatchQuotes(ASSET_TICKERS),
                fetchBatchQuotes(SECTOR_TICKERS)
            ]);

            setIndices(indicesData);
            setMovers(moversData);
            setWatchlist(watchlistData);
            setAssets(assetsData);
            setSectors(sectorsData);
            setLastUpdated(new Date());
            setNextRefreshIn(60);
        } catch (err) {
            console.error("Failed to fetch market data:", err);
            setError("Failed to load market data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNextRefreshIn((prev) => {
                if (prev <= 1) {
                    loadData();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
    };

    const currentMovers = movers[activeTab] || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Loading..."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Auto-refresh in {nextRefreshIn}s</span>
                        <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary/40 transition-all duration-1000 ease-linear"
                                style={{ width: `${(nextRefreshIn / 60) * 100}%` }}
                            />
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-fit"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    {error}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
                <MarketStatusBadge exchange="NSE/BSE" />

                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                    {isLoading && assets.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-9 w-32 animate-pulse rounded-xl bg-muted/50" />
                        ))
                    ) : (
                        assets.map((asset) => (
                            <div key={asset.ticker} className="flex items-center gap-2 rounded-xl border bg-card/30 px-3 py-1.5 whitespace-nowrap">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{ASSET_NAMES[asset.ticker] || asset.ticker}</span>
                                <span className="text-sm font-mono">
                                    {asset.ticker === "USDINR=X" ? "" : "$"}
                                    {asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    (asset.dayChangePercent || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {(asset.dayChangePercent || 0) >= 0 ? "+" : ""}{asset.dayChangePercent?.toFixed(2)}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {isLoading && indices.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="min-w-[240px] animate-pulse bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="h-4 w-24 rounded bg-muted"></div>
                                    <div className="mt-2 h-8 w-32 rounded bg-muted"></div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        indices.map((index) => {
                            const isPositive = index.dayChange >= 0;
                            return (
                                <Card key={index.ticker} className="min-w-[240px] shrink-0">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    {INDEX_NAMES[index.ticker] || index.ticker}
                                                </p>
                                                <h3 className="mt-1 text-2xl font-bold">
                                                    {index.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
                                                </h3>
                                            </div>
                                            <div className={cn(
                                                "flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {isPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                                                {Math.abs(index.dayChangePercent || 0).toFixed(2)}%
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "mt-1 text-xs font-medium",
                                            isPositive ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {isPositive ? "+" : ""}{index.dayChange?.toFixed(2) || "—"}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12 xl:col-span-5">
                    <Card className="h-full">
                        <CardContent className="p-0 flex flex-col h-full">
                            <div className="border-b px-4 py-2">
                                <h2 className="text-lg font-semibold mb-2">Market Movers</h2>
                                <div className="flex gap-4">
                                    {(["gainers", "losers", "mostActive"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "pb-2 pt-2 text-sm font-medium transition-colors border-b-2",
                                                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {tab === "gainers" ? "Gainers" : tab === "losers" ? "Losers" : "Active"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50 px-4 py-2">
                                            <th className="px-4 py-2 font-medium">Company</th>
                                            <th className="px-4 py-2 font-medium text-right">Price</th>
                                            <th className="px-4 py-2 font-medium text-right">Change %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && currentMovers.length === 0 ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse border-b">
                                                    <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="ml-auto h-4 w-16 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="ml-auto h-4 w-16 rounded bg-muted" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            currentMovers.map((mover) => (
                                                <tr key={mover.ticker} className="border-b hover:bg-accent/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium truncate max-w-[120px]" title={mover.name}>{mover.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase">{mover.ticker}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">₹{mover.price?.toLocaleString()}</td>
                                                    <td className={cn(
                                                        "px-4 py-3 text-right font-medium",
                                                        (mover.dayChangePercent || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {(mover.dayChangePercent || 0) >= 0 ? "+" : ""}{mover.dayChangePercent?.toFixed(2)}%
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-12 xl:col-span-7">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Watchlist</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {isLoading && watchlist.length === 0 ? (
                                Array.from({ length: 9 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse bg-muted/50"><CardContent className="h-28" /></Card>
                                ))
                            ) : (
                                watchlist.map((stock) => {
                                    const isPositive = (stock.dayChangePercent || 0) >= 0;
                                    return (
                                        <Card key={stock.ticker} className="hover:border-primary/50 transition-colors group">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-muted-foreground truncate" title={stock.name}>{stock.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{stock.ticker}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded",
                                                        isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                    )}>
                                                        {isPositive ? "+" : ""}{stock.dayChangePercent?.toFixed(2)}%
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="text-lg font-bold">₹{stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <FiftyTwoWeekRange high={stock.fiftyTwoWeekHigh} low={stock.fiftyTwoWeekLow} current={stock.price} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Sector Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {isLoading && sectors.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
                        ))
                    ) : (
                        sectors.map((sector) => {
                            const change = sector.dayChangePercent || 0;
                            const isPositive = change >= 0;
                            const absChange = Math.min(Math.abs(change), 3);
                            const intensity = Math.floor((absChange / 3) * 90) + 10;

                            const bgColor = isPositive
                                ? `hsla(142, 70%, 45%, ${intensity / 100 * 0.2})`
                                : `hsla(0, 84%, 60%, ${intensity / 100 * 0.2})`;
                            const borderColor = isPositive
                                ? `hsla(142, 70%, 45%, ${intensity / 100 * 0.5})`
                                : `hsla(0, 84%, 60%, ${intensity / 100 * 0.5})`;

                            return (
                                <div
                                    key={sector.ticker}
                                    style={{ backgroundColor: bgColor, borderColor: borderColor }}
                                    className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:scale-[1.02] cursor-default"
                                >
                                    <span className="text-xs font-bold text-foreground/80 mb-1">{SECTOR_NAMES[sector.ticker] || sector.ticker}</span>
                                    <span className={cn("text-lg font-bold", isPositive ? "text-emerald-500" : "text-rose-500")}>
                                        {isPositive ? "+" : ""}{change.toFixed(2)}%
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-2xl font-bold">Your Portfolio</h2>
                            <p className="text-muted-foreground">
                                View your holdings, track your P&L, and manage your investments in one place.
                            </p>
                        </div>
                        <Button asChild size="lg" className="px-8 shrink-0">
                            <a href="/dashboard/portfolio">Go to Portfolio</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
