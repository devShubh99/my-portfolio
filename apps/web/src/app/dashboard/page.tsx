"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Loader2,
    RefreshCw,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddTransactionDialog from "@/components/add-transaction-dialog";
import { fetchQuote } from "@/lib/api";

/* ── Watchlist tickers (user's portfolio — will come from DB in production) ── */
const WATCHLIST = [
    { ticker: "RELIANCE.NS", name: "Reliance Industries", qty: 50, avgPrice: 2380.0 },
    { ticker: "TCS.NS", name: "Tata Consultancy Services", qty: 30, avgPrice: 3550.0 },
    { ticker: "INFY.NS", name: "Infosys", qty: 100, avgPrice: 1420.0 },
    { ticker: "HDFCBANK.NS", name: "HDFC Bank", qty: 40, avgPrice: 1580.0 },
    { ticker: "WIPRO.NS", name: "Wipro", qty: 200, avgPrice: 405.0 },
    { ticker: "ICICIBANK.NS", name: "ICICI Bank", qty: 60, avgPrice: 920.0 },
];

interface HoldingRow {
    id: string;
    ticker: string;
    name: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    dayChange: number;
    pnl: number;
    pnlPercent: number;
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(val);
}

export default function DashboardPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [holdings, setHoldings] = useState<HoldingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadLiveData = async () => {
        setLoading(true);
        setError(null);

        try {
            const results = await Promise.allSettled(
                WATCHLIST.map(async (item, idx) => {
                    const quote = await fetchQuote(item.ticker);
                    if (!quote) throw new Error("No data");
                    const pnl = (quote.price - item.avgPrice) * item.qty;
                    const pnlPercent =
                        ((quote.price - item.avgPrice) / item.avgPrice) * 100;
                    return {
                        id: String(idx + 1),
                        ticker: item.ticker,
                        name: item.name,
                        qty: item.qty,
                        avgPrice: item.avgPrice,
                        currentPrice: quote.price,
                        dayChange: quote.dayChangePercent,
                        pnl,
                        pnlPercent,
                    };
                })
            );

            const successfulHoldings: HoldingRow[] = [];
            for (const result of results) {
                if (result.status === "fulfilled") {
                    successfulHoldings.push(result.value);
                }
            }

            if (successfulHoldings.length === 0) {
                setError(
                    "Could not fetch live prices. Make sure the FastAPI service is running on port 8000."
                );
            } else {
                setHoldings(successfulHoldings);
                setLastUpdated(new Date());
            }
        } catch {
            setError(
                "Could not fetch live prices. Make sure the FastAPI service is running on port 8000."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLiveData();
    }, []);

    // Derived portfolio stats
    const totalValue = holdings.reduce(
        (sum, h) => sum + h.currentPrice * h.qty,
        0
    );
    const totalInvested = holdings.reduce(
        (sum, h) => sum + h.avgPrice * h.qty,
        0
    );
    const overallPnL = totalValue - totalInvested;
    const overallPnLPercent =
        totalInvested > 0 ? (overallPnL / totalInvested) * 100 : 0;
    const dailyPnL = holdings.reduce(
        (sum, h) =>
            sum + h.currentPrice * h.qty * (h.dayChange / (100 + h.dayChange)),
        0
    );
    const dailyPnLPercent =
        totalValue > 0 ? (dailyPnL / (totalValue - dailyPnL)) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        {lastUpdated
                            ? `Live prices · Updated ${lastUpdated.toLocaleTimeString("en-IN")}`
                            : "Your portfolio at a glance"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadLiveData}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-red-400">{error}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Run:{" "}
                            <code className="rounded bg-accent px-1.5 py-0.5">
                                uvicorn main:app --reload --port 8000
                            </code>{" "}
                            in the{" "}
                            <code className="rounded bg-accent px-1.5 py-0.5">
                                services/market-data
                            </code>{" "}
                            directory
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Portfolio Value"
                    value={loading ? "..." : formatCurrency(totalValue)}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend={null}
                    loading={loading}
                />
                <StatCard
                    title="Today's P&L"
                    value={loading ? "..." : formatCurrency(dailyPnL)}
                    icon={
                        dailyPnL >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )
                    }
                    trend={loading ? null : dailyPnLPercent}
                    loading={loading}
                />
                <StatCard
                    title="Total Invested"
                    value={loading ? "..." : formatCurrency(totalInvested)}
                    icon={<BarChart3 className="h-4 w-4" />}
                    trend={null}
                    loading={loading}
                />
                <StatCard
                    title="Overall P&L"
                    value={loading ? "..." : formatCurrency(overallPnL)}
                    icon={
                        overallPnL >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )
                    }
                    trend={loading ? null : overallPnLPercent}
                    loading={loading}
                />
            </div>

            {/* ── Holdings Table ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Holdings</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {loading ? "..." : `${holdings.length} stocks`}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-3 text-sm text-muted-foreground">
                                Fetching live prices...
                            </span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-3 font-medium">Stock</th>
                                        <th className="pb-3 font-medium text-right">Qty</th>
                                        <th className="pb-3 font-medium text-right">Avg Price</th>
                                        <th className="pb-3 font-medium text-right">LTP</th>
                                        <th className="pb-3 font-medium text-right">Day %</th>
                                        <th className="pb-3 font-medium text-right">P&L</th>
                                        <th className="pb-3 font-medium text-right">P&L %</th>
                                        <th className="pb-3 font-medium text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {holdings.map((h) => (
                                        <tr
                                            key={h.id}
                                            className="group transition-colors hover:bg-accent/50"
                                        >
                                            <td className="py-3">
                                                <div>
                                                    <div className="font-semibold">{h.ticker}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {h.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-mono">{h.qty}</td>
                                            <td className="py-3 text-right font-mono">
                                                {formatCurrency(h.avgPrice)}
                                            </td>
                                            <td className="py-3 text-right font-mono font-semibold">
                                                {formatCurrency(h.currentPrice)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-0.5 font-mono text-xs font-medium ${h.dayChange >= 0
                                                            ? "text-emerald-400"
                                                            : "text-red-400"
                                                        }`}
                                                >
                                                    {h.dayChange >= 0 ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {Math.abs(h.dayChange).toFixed(2)}%
                                                </span>
                                            </td>
                                            <td
                                                className={`py-3 text-right font-mono font-semibold ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                                                    }`}
                                            >
                                                {h.pnl >= 0 ? "+" : ""}
                                                {formatCurrency(h.pnl)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <Badge
                                                    variant={h.pnlPercent >= 0 ? "bullish" : "bearish"}
                                                    className="font-mono"
                                                >
                                                    {h.pnlPercent >= 0 ? "+" : ""}
                                                    {h.pnlPercent.toFixed(2)}%
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Link href={`/asset/${h.ticker}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Dialog */}
            <AddTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}

/* ── Stat Card Component ── */
function StatCard({
    title,
    value,
    icon,
    trend,
    loading,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: number | null;
    loading: boolean;
}) {
    return (
        <Card className="group hover:shadow-md hover:shadow-primary/5 transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20">
                        {icon}
                    </div>
                </div>
                <div className="mt-3">
                    {loading ? (
                        <div className="h-8 w-32 animate-pulse rounded bg-accent" />
                    ) : (
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                    )}
                    {trend !== null && !loading && (
                        <p
                            className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                        >
                            {trend >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trend >= 0 ? "+" : ""}
                            {trend.toFixed(2)}% today
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
