"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TransactionType = "BUY" | "SELL";

interface AddTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AddTransactionDialog({
    open,
    onOpenChange,
}: AddTransactionDialogProps) {
    const [type, setType] = useState<TransactionType>("BUY");
    const [ticker, setTicker] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    const totalValue =
        parseFloat(price || "0") * parseInt(quantity || "0");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker || !price || !quantity) return;

        setLoading(true);
        try {
            // In production, this would call the API
            console.log("Transaction submitted:", {
                type,
                ticker,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                date,
            });

            // Reset form
            setTicker("");
            setPrice("");
            setQuantity("");
            setDate(new Date().toISOString().split("T")[0]);
            setType("BUY");
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to submit transaction:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Record a buy or sell transaction for your portfolio.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* BUY/SELL Toggle */}
                    <div className="flex rounded-lg border p-1">
                        {(["BUY", "SELL"] as TransactionType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={cn(
                                    "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
                                    type === t
                                        ? t === "BUY"
                                            ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                                            : "bg-red-500/15 text-red-400 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Ticker */}
                    <div className="space-y-2">
                        <Label htmlFor="ticker">Ticker Symbol</Label>
                        <Input
                            id="ticker"
                            placeholder="e.g. RELIANCE.NS, TCS.BO"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            required
                        />
                    </div>

                    {/* Price & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Total */}
                    {totalValue > 0 && (
                        <div className="rounded-lg border bg-accent/50 p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Value</span>
                                <span className="font-mono font-semibold">
                                    ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !ticker || !price || !quantity}
                            className={cn(
                                "gap-2",
                                type === "BUY"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {loading ? "Saving..." : `${type === "BUY" ? "Buy" : "Sell"}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
