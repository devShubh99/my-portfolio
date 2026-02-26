"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeOff,
    LogIn,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

export default function LoginPage() {
    const router = useRouter();
    const { setTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                // If unverified email, redirect to OTP verification
                if (data.requiresOtp && data.email) {
                    router.push(
                        `/verify-otp?email=${encodeURIComponent(data.email)}&type=EMAIL_VERIFICATION`
                    );
                    return;
                }
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }

            if (data.user?.theme) {
                setTheme(data.user.theme);
            }

            if (data.user?.mustChangePassword) {
                router.push("/change-password");
            } else if (data.user?.role === "ADMIN" || data.user?.role === "MODERATOR") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <ThemeToggle className="absolute top-4 right-4 rounded-full border border-border/50 bg-card/80 p-2 shadow-sm backdrop-blur transition-colors hover:bg-accent" />

            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2">
                        <div className="rounded-lg bg-gradient-to-br from-primary to-cyan-500 p-2">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">StockFolio</span>
                    </div>
                </div>

                <Card className="border-border/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Welcome back</CardTitle>
                        <CardDescription>Sign in to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full gap-2" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <LogIn className="h-4 w-4" />
                                )}
                                Sign In
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="font-medium text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
