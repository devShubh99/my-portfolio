"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Eye,
    EyeOff,
    Loader2,
    TrendingUp,
    Check,
    X,
    KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ResetForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };
    const allValid = rules.length && rules.uppercase && rules.number && rules.special;
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allValid || !passwordsMatch) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Reset failed");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch {
            setError("Network error.");
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-red-400">Invalid or missing reset token.</p>
                    <Link href="/forgot-password">
                        <Button variant="outline" className="mt-4">
                            Request new reset link
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                        <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-medium">Password reset!</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Redirecting to login...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription>Enter your new password</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {password && (
                            <div className="mt-2 space-y-1 text-xs">
                                {[
                                    { met: rules.length, label: "At least 8 characters" },
                                    { met: rules.uppercase, label: "One uppercase letter" },
                                    { met: rules.number, label: "One number" },
                                    { met: rules.special, label: "One special character" },
                                ].map((r, i) => (
                                    <div key={i} className={`flex items-center gap-1.5 ${r.met ? "text-emerald-400" : "text-muted-foreground"}`}>
                                        {r.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        {r.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm Password</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-xs text-red-400">Passwords do not match</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={loading || !allValid || !passwordsMatch}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Reset Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2">
                        <div className="rounded-lg bg-gradient-to-br from-primary to-cyan-500 p-2">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">StockFolio</span>
                    </div>
                </div>
                <Suspense fallback={<div />}>
                    <ResetForm />
                </Suspense>
            </div>
        </div>
    );
}
