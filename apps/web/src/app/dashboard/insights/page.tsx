"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAIInsight, AIInsightResponse } from "@/lib/api";

interface DbHolding {
    id: string;
    tickerSymbol: string;
    totalQuantity: number;
    averageBuyPrice: number;
}

export default function InsightsPage() {
    const [holdings, setHoldings] = useState<DbHolding[]>([]);
    const [insights, setInsights] = useState<Record<string, AIInsightResponse | null>>({});
    const [loading, setLoading] = useState(true);

    const loadPortfolio = useCallback(async () => {
        try {
            setLoading(true);
            const userRes = await fetch("/api/user/profile");
            if (!userRes.ok) return;
            const userData = await userRes.json();
            const userId = userData.user?.id || userData.id;

            const portfolioRes = await fetch(`/api/portfolios?userId=${userId}`);
            if (!portfolioRes.ok) return;
            const portfolios = await portfolioRes.json();
            const portfolio = portfolios[0];

            if (portfolio && portfolio.holdings) {
                setHoldings(portfolio.holdings);
                fetchInsightsConcurrently(portfolio.holdings);
            }
        } catch (error) {
            console.error("Failed to load portfolio:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInsightsConcurrently = (hList: DbHolding[]) => {
        // Fetch AI insight for each unique ticker
        const uniqueTickers = Array.from(new Set(hList.map((h) => h.tickerSymbol)));

        uniqueTickers.forEach(async (ticker) => {
            try {
                const insight = await fetchAIInsight(ticker);
                setInsights((prev) => ({ ...prev, [ticker]: insight }));
            } catch (err) {
                console.error(`Failed to fetch insight for ${ticker}:`, err);
                setInsights((prev) => ({ ...prev, [ticker]: null }));
            }
        });
    };

    useEffect(() => {
        loadPortfolio();
    }, [loadPortfolio]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
                <p className="text-sm text-muted-foreground">
                    Generative Market Analysis for Your Portfolio Holdings
                </p>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && holdings.length === 0 && (
                <Card className="flex flex-col items-center justify-center py-16">
                    <CardContent className="text-center">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <h3 className="mt-4 text-lg font-semibold">No Holdings Found</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                            Go to your Portfolio and add some assets. The Google Gemini AI will automatically generate insights for them here!
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && holdings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from(new Set(holdings.map((h) => h.tickerSymbol))).map((ticker) => {
                        const insight = insights[ticker];

                        return (
                            <Card key={ticker} className="flex flex-col overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-4 border-b">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {ticker}
                                        </CardTitle>
                                        {insight === undefined ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : insight ? (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-background px-2 py-1 rounded-md border">
                                                {insight.sentiment === "Bullish" && <TrendingUp className="h-3 w-3 text-green-500" />}
                                                {insight.sentiment === "Bearish" && <TrendingDown className="h-3 w-3 text-red-500" />}
                                                {insight.sentiment === "Neutral" && <Minus className="h-3 w-3 text-yellow-500" />}
                                                <span className={
                                                    insight.sentiment === "Bullish" ? "text-green-500" :
                                                        insight.sentiment === "Bearish" ? "text-red-500" :
                                                            "text-yellow-500"
                                                }>
                                                    {insight.sentiment}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Unavailable</span>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {insight?.fundamentals?.name || "Market Asset"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 p-5 text-sm leading-relaxed text-muted-foreground flex flex-col gap-4">
                                    {insight === undefined ? (
                                        <div className="h-full flex flex-col items-center justify-center py-8 opacity-50 space-y-3">
                                            <Sparkles className="h-6 w-6 animate-pulse" />
                                            <p className="text-xs">Generating Analysis...</p>
                                        </div>
                                    ) : insight ? (
                                        <>
                                            <p className="font-medium text-foreground/90">{insight.analysis}</p>

                                            <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t">
                                                <div className="space-y-2 text-xs">
                                                    <p className="font-semibold text-foreground">Fundamentals</p>
                                                    <ul className="space-y-1">
                                                        {Object.entries(insight.fundamentals).slice(3, 6).map(([k, v]) => (
                                                            <li key={k} className="flex justify-between items-center bg-muted/50 px-2 py-1 rounded">
                                                                <span className="capitalize">{k.replace("_", " ")}</span>
                                                                <span className="font-mono font-medium">{String(v)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="space-y-2 text-xs">
                                                    <p className="font-semibold text-foreground">Technicals</p>
                                                    <ul className="space-y-1">
                                                        {Object.entries(insight.technicals).slice(0, 3).map(([k, v]) => (
                                                            <li key={k} className="flex justify-between items-center bg-muted/50 px-2 py-1 rounded">
                                                                <span className="capitalize">{k.replace("_", " ")}</span>
                                                                <span className="font-mono font-medium">{String(v)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-destructive/80 italic text-center py-8">
                                            AI Analysis could not be generated for this asset.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
