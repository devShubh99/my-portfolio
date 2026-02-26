"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeOff,
    UserPlus,
    Loader2,
    TrendingUp,
    Check,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

interface PasswordRules {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
}

function checkRules(pw: string): PasswordRules {
    return {
        length: pw.length >= 8,
        uppercase: /[A-Z]/.test(pw),
        number: /[0-9]/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    };
}

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const rules = checkRules(password);
    const allValid = rules.length && rules.uppercase && rules.number && rules.special;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allValid) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok && !data.requiresOtp) {
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Redirect to OTP verification
            router.push(
                `/verify-otp?email=${encodeURIComponent(data.email || email)}&type=EMAIL_VERIFICATION`
            );
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
                        <CardTitle className="text-xl">Create an account</CardTitle>
                        <CardDescription>Start tracking your portfolio today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>

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
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
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

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-2 space-y-1 text-xs">
                                        {[
                                            { key: "length", label: "At least 8 characters", met: rules.length },
                                            { key: "uppercase", label: "One uppercase letter", met: rules.uppercase },
                                            { key: "number", label: "One number", met: rules.number },
                                            { key: "special", label: "One special character", met: rules.special },
                                        ].map((rule) => (
                                            <div
                                                key={rule.key}
                                                className={`flex items-center gap-1.5 ${rule.met ? "text-emerald-400" : "text-muted-foreground"
                                                    }`}
                                            >
                                                {rule.met ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <X className="h-3 w-3" />
                                                )}
                                                {rule.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={loading || !allValid}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                                Create Account
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
