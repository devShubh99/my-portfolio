import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    BarChart3,
    DollarSign,
    Activity,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIInsightsPanelProps {
    ticker: string;
    sentiment: "Bullish" | "Bearish" | "Neutral";
    analysisText: string;
    fundamentals: {
        name?: string;
        sector?: string;
        marketCap?: string | number;
        pe_ratio?: string | number;
        forward_pe?: string | number;
        dividend_yield?: string | number;
        "52w_high"?: string | number;
        "52w_low"?: string | number;
    };
    technicals: {
        latest_price?: number;
        rsi_14?: number | null;
        sma_50?: number | null;
        sma_200?: number | null;
    };
}

const sentimentConfig = {
    Bullish: {
        variant: "bullish" as const,
        icon: TrendingUp,
        gradient: "from-emerald-500/20 to-emerald-500/5",
        border: "border-emerald-500/20",
    },
    Bearish: {
        variant: "bearish" as const,
        icon: TrendingDown,
        gradient: "from-red-500/20 to-red-500/5",
        border: "border-red-500/20",
    },
    Neutral: {
        variant: "neutral" as const,
        icon: Minus,
        gradient: "from-amber-500/20 to-amber-500/5",
        border: "border-amber-500/20",
    },
};

export default function AIInsightsPanel({
    ticker,
    sentiment,
    analysisText,
    fundamentals,
    technicals,
}: AIInsightsPanelProps) {
    const config = sentimentConfig[sentiment];
    const SentimentIcon = config.icon;

    return (
        <div data-testid="ai-insights-panel" className="space-y-4">
            {/* Sentiment Header */}
            <Card
                className={`bg-gradient-to-r ${config.gradient} ${config.border} border`}
            >
                <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">AI Analysis</h3>
                            <Badge
                                data-testid="sentiment-badge"
                                variant={config.variant}
                                className="gap-1"
                            >
                                <SentimentIcon className="h-3 w-3" />
                                {sentiment}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Automated fundamental & technical analysis for {ticker}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Fundamentals Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Fundamentals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <MetricRow label="Sector" value={fundamentals.sector || "N/A"} />
                            <MetricRow
                                label="Market Cap"
                                value={
                                    fundamentals.marketCap
                                        ? formatLargeNumber(Number(fundamentals.marketCap))
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="P/E Ratio"
                                value={
                                    fundamentals.pe_ratio
                                        ? Number(fundamentals.pe_ratio).toFixed(2)
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="Forward P/E"
                                value={
                                    fundamentals.forward_pe
                                        ? Number(fundamentals.forward_pe).toFixed(2)
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="52W High"
                                value={
                                    fundamentals["52w_high"]
                                        ? `₹${Number(fundamentals["52w_high"]).toLocaleString("en-IN")}`
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="52W Low"
                                value={
                                    fundamentals["52w_low"]
                                        ? `₹${Number(fundamentals["52w_low"]).toLocaleString("en-IN")}`
                                        : "N/A"
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Technicals Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-primary" />
                            Technical Indicators
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <MetricRow
                                label="Price"
                                value={
                                    technicals.latest_price
                                        ? `₹${technicals.latest_price.toLocaleString("en-IN")}`
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="RSI (14)"
                                value={technicals.rsi_14?.toFixed(2) || "N/A"}
                                badge={
                                    technicals.rsi_14
                                        ? technicals.rsi_14 > 70
                                            ? "Overbought"
                                            : technicals.rsi_14 < 30
                                                ? "Oversold"
                                                : "Normal"
                                        : undefined
                                }
                                badgeVariant={
                                    technicals.rsi_14
                                        ? technicals.rsi_14 > 70
                                            ? "bearish"
                                            : technicals.rsi_14 < 30
                                                ? "bullish"
                                                : "secondary"
                                        : undefined
                                }
                            />
                            <MetricRow
                                label="SMA 50"
                                value={
                                    technicals.sma_50
                                        ? `₹${technicals.sma_50.toLocaleString("en-IN")}`
                                        : "N/A"
                                }
                            />
                            <MetricRow
                                label="SMA 200"
                                value={
                                    technicals.sma_200
                                        ? `₹${technicals.sma_200.toLocaleString("en-IN")}`
                                        : "N/A"
                                }
                            />
                            {technicals.sma_50 && technicals.sma_200 && (
                                <MetricRow
                                    label="Signal"
                                    value={
                                        technicals.sma_50 > technicals.sma_200
                                            ? "Golden Cross"
                                            : "Death Cross"
                                    }
                                    badge={
                                        technicals.sma_50 > technicals.sma_200
                                            ? "Bullish"
                                            : "Bearish"
                                    }
                                    badgeVariant={
                                        technicals.sma_50 > technicals.sma_200
                                            ? "bullish"
                                            : "bearish"
                                    }
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Text */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Detailed Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p
                        data-testid="analysis-text"
                        className="text-sm leading-relaxed text-muted-foreground"
                    >
                        {analysisText}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

/* ── Helper Components ── */

function MetricRow({
    label,
    value,
    badge,
    badgeVariant,
}: {
    label: string;
    value: string;
    badge?: string;
    badgeVariant?: "bullish" | "bearish" | "secondary";
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium font-mono">{value}</span>
                {badge && badgeVariant && (
                    <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
                        {badge}
                    </Badge>
                )}
            </div>
        </div>
    );
}

function formatLargeNumber(num: number): string {
    if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
    return `₹${num.toLocaleString("en-IN")}`;
}
