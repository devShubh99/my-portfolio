"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setLoading(false);
                return;
            }

            // Redirect to OTP verification page
            router.push(
                `/verify-otp?email=${encodeURIComponent(data.email || email)}&type=PASSWORD_RESET`
            );
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <ThemeToggle className="absolute top-4 right-4 rounded-full border border-border/50 bg-card/80 p-2 shadow-sm backdrop-blur transition-colors hover:bg-accent" />
            <div className="w-full max-w-md space-y-6">
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
                        <CardTitle className="text-xl">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email and we&apos;ll send you a verification code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full gap-2" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="h-4 w-4" />
                                )}
                                Send Verification Code
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                <Link href="/login" className="text-primary hover:underline">
                                    Back to login
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
