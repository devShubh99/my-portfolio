"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Trash2,
    Edit3,
    Check,
    X,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { fetchQuote } from "@/lib/api";

/* ── Types ── */
interface Holding {
    id: string;
    ticker: string;
    name: string;
    qty: number;
    avgPrice: number;
    currentPrice: number | null;
    dayChangePercent: number | null;
}

/* ── Default Holdings ── */
const DEFAULT_HOLDINGS: Holding[] = [
    { id: "1", ticker: "RELIANCE.NS", name: "Reliance Industries", qty: 50, avgPrice: 2380, currentPrice: null, dayChangePercent: null },
    { id: "2", ticker: "TCS.NS", name: "Tata Consultancy Services", qty: 30, avgPrice: 3550, currentPrice: null, dayChangePercent: null },
    { id: "3", ticker: "INFY.NS", name: "Infosys", qty: 100, avgPrice: 1420, currentPrice: null, dayChangePercent: null },
    { id: "4", ticker: "HDFCBANK.NS", name: "HDFC Bank", qty: 40, avgPrice: 1580, currentPrice: null, dayChangePercent: null },
    { id: "5", ticker: "WIPRO.NS", name: "Wipro", qty: 200, avgPrice: 405, currentPrice: null, dayChangePercent: null },
    { id: "6", ticker: "ICICIBANK.NS", name: "ICICI Bank", qty: 60, avgPrice: 920, currentPrice: null, dayChangePercent: null },
];

function formatCurrency(val: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(val);
}

/* ── Allocation Colors ── */
const ALLOC_COLORS = [
    "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
    "#f97316", "#84cc16", "#a855f7", "#0ea5e9",
];

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Holding | null>(null);
    const [editQty, setEditQty] = useState("");
    const [editAvg, setEditAvg] = useState("");
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // ── Add Security Form State ──
    const [newTicker, setNewTicker] = useState("");
    const [newName, setNewName] = useState("");
    const [newQty, setNewQty] = useState("");
    const [newAvgPrice, setNewAvgPrice] = useState("");
    const [addLoading, setAddLoading] = useState(false);

    // ── Fetch Prices ──
    const fetchAllPrices = async () => {
        setLoadingPrices(true);
        const updated = await Promise.all(
            holdings.map(async (h) => {
                try {
                    const quote = await fetchQuote(h.ticker);
                    return {
                        ...h,
                        currentPrice: quote?.price ?? null,
                        dayChangePercent: quote?.dayChangePercent ?? null,
                    };
                } catch {
                    return h;
                }
            })
        );
        setHoldings(updated);
        setLoadingPrices(false);
    };

    // ── Add Security ──
    const handleAddSecurity = async () => {
        if (!newTicker || !newQty || !newAvgPrice) return;
        setAddLoading(true);

        const ticker = newTicker.toUpperCase();
        let currentPrice: number | null = null;
        let dayChangePercent: number | null = null;

        try {
            const quote = await fetchQuote(ticker);
            if (quote) {
                currentPrice = quote.price;
                dayChangePercent = quote.dayChangePercent;
            }
        } catch {
            // Price fetch failed, that's okay
        }

        const newHolding: Holding = {
            id: Date.now().toString(),
            ticker,
            name: newName || ticker,
            qty: parseInt(newQty),
            avgPrice: parseFloat(newAvgPrice),
            currentPrice,
            dayChangePercent,
        };

        setHoldings((prev) => [...prev, newHolding]);
        setNewTicker("");
        setNewName("");
        setNewQty("");
        setNewAvgPrice("");
        setAddDialogOpen(false);
        setAddLoading(false);
    };

    // ── Remove Security ──
    const confirmDelete = (h: Holding) => {
        setDeleteTarget(h);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setHoldings((prev) => prev.filter((h) => h.id !== deleteTarget.id));
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    // ── Edit Inline ──
    const startEdit = (h: Holding) => {
        setEditingId(h.id);
        setEditQty(String(h.qty));
        setEditAvg(String(h.avgPrice));
    };

    const saveEdit = (id: string) => {
        setHoldings((prev) =>
            prev.map((h) =>
                h.id === id
                    ? { ...h, qty: parseInt(editQty) || h.qty, avgPrice: parseFloat(editAvg) || h.avgPrice }
                    : h
            )
        );
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    // ── Computed Stats ──
    const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.qty, 0);
    const totalCurrent = holdings.reduce(
        (s, h) => s + (h.currentPrice ?? h.avgPrice) * h.qty,
        0
    );
    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // ── Allocation Data ──
    const allocations = holdings.map((h, i) => ({
        ticker: h.ticker,
        value: (h.currentPrice ?? h.avgPrice) * h.qty,
        color: ALLOC_COLORS[i % ALLOC_COLORS.length],
    }));
    const totalAllocValue = allocations.reduce((s, a) => s + a.value, 0);

    // ── Search Filter ──
    const filtered = searchQuery
        ? holdings.filter(
            (h) =>
                h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : holdings;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your investment portfolio — {holdings.length} securities
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllPrices}
                        disabled={loadingPrices}
                        className="gap-2"
                    >
                        {loadingPrices ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                        Fetch Prices
                    </Button>
                    <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Security
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Total Invested</p>
                        <p className="mt-1 text-xl font-bold">{formatCurrency(totalInvested)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="mt-1 text-xl font-bold">{formatCurrency(totalCurrent)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">Overall P&L</p>
                        <div className="mt-1 flex items-center gap-2">
                            <span
                                className={`text-xl font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                                    }`}
                            >
                                {totalPnL >= 0 ? "+" : ""}
                                {formatCurrency(totalPnL)}
                            </span>
                            <Badge variant={totalPnL >= 0 ? "bullish" : "bearish"} className="font-mono">
                                {totalPnLPercent >= 0 ? "+" : ""}
                                {totalPnLPercent.toFixed(2)}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Holdings List ── */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Securities</CardTitle>
                                <div className="relative w-56">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        className="h-8 pl-8 text-xs"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {filtered.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No securities found.
                                    </p>
                                ) : (
                                    filtered.map((h) => {
                                        const pnl = h.currentPrice
                                            ? (h.currentPrice - h.avgPrice) * h.qty
                                            : 0;
                                        const pnlPercent = h.currentPrice
                                            ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100
                                            : 0;
                                        const isEditing = editingId === h.id;

                                        return (
                                            <div
                                                key={h.id}
                                                className="group flex items-center gap-4 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-accent/30"
                                            >
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{h.ticker}</span>
                                                        {h.dayChangePercent !== null && (
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${h.dayChangePercent >= 0
                                                                        ? "text-emerald-400"
                                                                        : "text-red-400"
                                                                    }`}
                                                            >
                                                                {h.dayChangePercent >= 0 ? (
                                                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                                                ) : (
                                                                    <ArrowDownRight className="h-2.5 w-2.5" />
                                                                )}
                                                                {Math.abs(h.dayChangePercent).toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {h.name}
                                                    </p>
                                                </div>

                                                {/* Qty & Avg Price (editable) */}
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16">
                                                            <Input
                                                                className="h-7 text-xs text-center"
                                                                type="number"
                                                                value={editQty}
                                                                onChange={(e) => setEditQty(e.target.value)}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">×</span>
                                                        <div className="w-24">
                                                            <Input
                                                                className="h-7 text-xs text-center"
                                                                type="number"
                                                                step="0.01"
                                                                value={editAvg}
                                                                onChange={(e) => setEditAvg(e.target.value)}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                                                            onClick={() => saveEdit(h.id)}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground"
                                                            onClick={cancelEdit}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-right">
                                                            <p className="text-sm font-mono font-medium">
                                                                {h.currentPrice
                                                                    ? formatCurrency(h.currentPrice)
                                                                    : "—"}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                                {h.qty} × {formatCurrency(h.avgPrice)}
                                                            </p>
                                                        </div>

                                                        {/* P&L */}
                                                        <div className="w-24 text-right">
                                                            {h.currentPrice ? (
                                                                <>
                                                                    <p
                                                                        className={`text-sm font-mono font-semibold ${pnl >= 0
                                                                                ? "text-emerald-400"
                                                                                : "text-red-400"
                                                                            }`}
                                                                    >
                                                                        {pnl >= 0 ? "+" : ""}
                                                                        {formatCurrency(pnl)}
                                                                    </p>
                                                                    <Badge
                                                                        variant={pnlPercent >= 0 ? "bullish" : "bearish"}
                                                                        className="text-[10px] font-mono px-1.5 py-0"
                                                                    >
                                                                        {pnlPercent >= 0 ? "+" : ""}
                                                                        {pnlPercent.toFixed(1)}%
                                                                    </Badge>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    No price
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <Link href={`/asset/${h.ticker}`}>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => startEdit(h)}
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-400 hover:text-red-300"
                                                                onClick={() => confirmDelete(h)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Allocation Chart ── */}
                <div>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Allocation</CardTitle>
                            <CardDescription className="text-xs">
                                Portfolio weight by current value
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Simple donut using CSS conic-gradient */}
                            <div className="flex justify-center">
                                <div
                                    className="relative h-44 w-44 rounded-full"
                                    style={{
                                        background: totalAllocValue > 0
                                            ? `conic-gradient(${allocations
                                                .map((a, i) => {
                                                    const startPct =
                                                        (allocations
                                                            .slice(0, i)
                                                            .reduce((s, x) => s + x.value, 0) /
                                                            totalAllocValue) *
                                                        100;
                                                    const endPct =
                                                        (allocations
                                                            .slice(0, i + 1)
                                                            .reduce((s, x) => s + x.value, 0) /
                                                            totalAllocValue) *
                                                        100;
                                                    return `${a.color} ${startPct}% ${endPct}%`;
                                                })
                                                .join(", ")})`
                                            : "hsl(var(--muted))",
                                    }}
                                >
                                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-card">
                                        <div className="text-center">
                                            <p className="text-lg font-bold">
                                                {holdings.length}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Securities
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="mt-5 space-y-2">
                                {allocations.map((a) => {
                                    const pct =
                                        totalAllocValue > 0
                                            ? ((a.value / totalAllocValue) * 100).toFixed(1)
                                            : "0";
                                    return (
                                        <div key={a.ticker} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: a.color }}
                                                />
                                                <span className="text-xs">{a.ticker.replace(".NS", "").replace(".BO", "")}</span>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {pct}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Add Security Dialog ── */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Security</DialogTitle>
                        <DialogDescription>
                            Add a stock to your portfolio. Use NSE (.NS) or BSE (.BO) suffix.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-ticker">Ticker Symbol</Label>
                                <Input
                                    id="add-ticker"
                                    placeholder="e.g. TATAMOTORS.NS"
                                    value={newTicker}
                                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-name">Company Name</Label>
                                <Input
                                    id="add-name"
                                    placeholder="e.g. Tata Motors"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-qty">Quantity</Label>
                                <Input
                                    id="add-qty"
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={newQty}
                                    onChange={(e) => setNewQty(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-avg">Avg Buy Price (₹)</Label>
                                <Input
                                    id="add-avg"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={newAvgPrice}
                                    onChange={(e) => setNewAvgPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        {newQty && newAvgPrice && (
                            <div className="rounded-lg border bg-accent/50 p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Investment Value</span>
                                    <span className="font-mono font-semibold">
                                        {formatCurrency(
                                            parseInt(newQty || "0") * parseFloat(newAvgPrice || "0")
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddSecurity}
                            disabled={addLoading || !newTicker || !newQty || !newAvgPrice}
                            className="gap-2"
                        >
                            {addLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Add Security
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Remove Security
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.ticker}
                            </span>{" "}
                            ({deleteTarget?.name}) from your portfolio? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
