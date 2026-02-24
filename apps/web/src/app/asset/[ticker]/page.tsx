"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CandlestickChart from "@/components/candlestick-chart";
import AIInsightsPanel from "@/components/ai-insights-panel";
import {
    fetchHistorical,
    fetchTechnicals,
    fetchAIInsight,
    type CandleData,
    type TechnicalsResponse,
    type AIInsightResponse,
} from "@/lib/api";

export default function AssetDetailPage({
    params,
}: {
    params: Promise<{ ticker: string }>;
}) {
    const { ticker } = use(params);
    const decodedTicker = decodeURIComponent(ticker);

    const [candles, setCandles] = useState<CandleData[]>([]);
    const [technicals, setTechnicals] = useState<TechnicalsResponse | null>(null);
    const [insight, setInsight] = useState<AIInsightResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            setError(null);

            try {
                // Fetch all three in parallel
                const [candleData, techData, insightData] = await Promise.all([
                    fetchHistorical(decodedTicker, "6mo", "1d"),
                    fetchTechnicals(decodedTicker).catch(() => null),
                    fetchAIInsight(decodedTicker).catch(() => null),
                ]);

                if (cancelled) return;

                setCandles(candleData);
                setTechnicals(techData);
                setInsight(insightData);
            } catch (err: any) {
                if (!cancelled) {
                    setError(
                        "Could not fetch market data. Make sure the FastAPI service is running on port 8000."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, [decodedTicker]);

    // Derived values from candles
    const latestPrice =
        candles.length > 0 ? candles[candles.length - 1].close : 0;
    const prevClose =
        candles.length > 1 ? candles[candles.length - 2].close : latestPrice;
    const dayChange = latestPrice - prevClose;
    const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

    // SMA series from technicals API
    const sma50Series = technicals?.series?.sma_50 || [];
    const sma200Series = technicals?.series?.sma_200 || [];

    // Exchange detection
    const exchange = decodedTicker.endsWith(".BO") ? "BSE" : "NSE";

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            {/* ── Back + Header ── */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{decodedTicker}</h1>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {exchange}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {insight?.fundamentals?.name || decodedTicker}
                    </p>
                </div>
                {!loading && candles.length > 0 && (
                    <div className="text-right">
                        <p className="text-2xl font-bold font-mono">
                            ₹{latestPrice.toLocaleString("en-IN")}
                        </p>
                        <p
                            className={`flex items-center justify-end gap-1 text-sm font-medium ${dayChange >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                        >
                            {dayChange >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4" />
                            )}
                            {dayChange >= 0 ? "+" : ""}
                            {dayChange.toFixed(2)} ({dayChangePercent.toFixed(2)}%)
                        </p>
                    </div>
                )}
            </div>

            {/* ── Loading State ── */}
            {loading && (
                <Card className="flex items-center justify-center py-24">
                    <CardContent className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            Fetching live data for {decodedTicker}...
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Error State ── */}
            {error && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm font-medium text-red-400">{error}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Run: <code className="rounded bg-accent px-1.5 py-0.5">uvicorn main:app --reload --port 8000</code> in the <code className="rounded bg-accent px-1.5 py-0.5">services/market-data</code> directory
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Chart ── */}
            {!loading && candles.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                            <span>Price Chart</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {sma50Series.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-4 rounded-sm bg-blue-500" /> SMA 50
                                    </span>
                                )}
                                {sma200Series.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-4 rounded-sm bg-amber-500" /> SMA 200
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 6 months
                                </span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <CandlestickChart
                            candles={candles}
                            sma50={sma50Series}
                            sma200={sma200Series}
                            height={450}
                        />
                    </CardContent>
                </Card>
            )}

            {/* ── AI Insights ── */}
            {!loading && insight && (
                <AIInsightsPanel
                    ticker={decodedTicker}
                    sentiment={insight.sentiment}
                    analysisText={insight.analysis}
                    fundamentals={insight.fundamentals}
                    technicals={insight.technicals}
                />
            )}

            {/* Fallback technicals if AI insight unavailable but technicals loaded */}
            {!loading && !insight && technicals && (
                <AIInsightsPanel
                    ticker={decodedTicker}
                    sentiment={
                        technicals.signal === "Bullish"
                            ? "Bullish"
                            : technicals.signal === "Bearish"
                                ? "Bearish"
                                : "Neutral"
                    }
                    analysisText="AI analysis unavailable. Showing rule-based technical analysis. Configure LLM_API_KEY in your .env file for full AI insights."
                    fundamentals={{}}
                    technicals={{
                        latest_price: technicals.latest_price,
                        rsi_14: technicals.rsi_14,
                        sma_50: technicals.sma_50,
                        sma_200: technicals.sma_200,
                    }}
                />
            )}
        </div>
    );
}
