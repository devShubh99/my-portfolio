"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2,
    TrendingUp,
    ShieldCheck,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function OtpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const type = searchParams.get("type") || "EMAIL_VERIFICATION";

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
    const [resending, setResending] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Start countdown timer on mount
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length === 0) return;

        const newOtp = [...otp];
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        setError("");

        // Focus the next empty input or the last one
        const nextEmpty = newOtp.findIndex((v) => !v);
        inputRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();
    };

    const handleSubmit = useCallback(async () => {
        const code = otp.join("");
        if (code.length !== OTP_LENGTH) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, type }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Verification failed");
                setLoading(false);
                return;
            }

            setSuccess(true);

            if (type === "EMAIL_VERIFICATION") {
                setTimeout(() => router.push("/dashboard"), 1500);
            } else if (type === "PASSWORD_RESET") {
                // Redirect to reset password page with the reset token
                setTimeout(
                    () =>
                        router.push(
                            `/reset-password?token=${data.resetToken}&email=${encodeURIComponent(email)}`
                        ),
                    1500
                );
            }
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    }, [otp, email, type, router]);

    // Auto-submit when all digits are entered
    useEffect(() => {
        const code = otp.join("");
        if (code.length === OTP_LENGTH && !loading && !success) {
            handleSubmit();
        }
    }, [otp, loading, success, handleSubmit]);

    const handleResend = async () => {
        setResending(true);
        setError("");

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, type }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to resend OTP");
            } else {
                setResendTimer(RESEND_COOLDOWN);
                setOtp(Array(OTP_LENGTH).fill(""));
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError("Network error.");
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-red-400">Missing email. Please go back and try again.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/register")}
                    >
                        Go to Register
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <ShieldCheck className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">
                            {type === "EMAIL_VERIFICATION"
                                ? "Email Verified!"
                                : "OTP Verified!"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {type === "EMAIL_VERIFICATION"
                                ? "Redirecting to dashboard..."
                                : "Redirecting to set your new password..."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">
                    {type === "EMAIL_VERIFICATION"
                        ? "Verify Your Email"
                        : "Enter Reset Code"}
                </CardTitle>
                <CardDescription>
                    We sent a 6-digit code to{" "}
                    <strong className="text-foreground">{email}</strong>
                    . Check your inbox and spam folder.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="h-14 w-12 rounded-lg border border-border bg-background text-center text-2xl font-bold
                                       focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                                       transition-all duration-150"
                            disabled={loading}
                        />
                    ))}
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full gap-2"
                    disabled={loading || otp.join("").length !== OTP_LENGTH}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ShieldCheck className="h-4 w-4" />
                    )}
                    Verify Code
                </Button>

                {/* Resend */}
                <div className="text-center">
                    {resendTimer > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Resend code in{" "}
                            <span className="font-mono font-medium text-foreground">
                                {resendTimer}s
                            </span>
                        </p>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={resending}
                            className="gap-1.5 text-primary"
                        >
                            {resending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Resend Code
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerifyOtpPage() {
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
                <Suspense fallback={<div />}>
                    <OtpForm />
                </Suspense>
            </div>
        </div>
    );
}
