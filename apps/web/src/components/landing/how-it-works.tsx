"use client";

import { useInView } from "@/hooks/useInView";
import { UserPlus, Search, TrendingUp } from "lucide-react";

export function HowItWorks() {
    const { ref, isInView } = useInView({ threshold: 0.2 });

    const steps = [
        {
            icon: <UserPlus className="h-8 w-8 text-primary-foreground" />,
            title: "Create Your Account",
            desc: "Sign up and verify instantly with a secure Google OTP.",
        },
        {
            icon: <Search className="h-8 w-8 text-primary-foreground" />,
            title: "Add Your Holdings",
            desc: "Search any global or Indian stock, currency, or commodity.",
        },
        {
            icon: <TrendingUp className="h-8 w-8 text-primary-foreground" />,
            title: "Track & Get Insights",
            desc: "Watch live prices and let AI analyze your portfolio vulnerabilities.",
        },
    ];

    return (
        <section className="py-24 bg-background relative overflow-hidden" id="how-it-works">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        How It Works
                    </h2>
                </div>

                <div
                    ref={ref}
                    className="relative flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-12 lg:gap-8"
                >
                    {/* Dashed connector line for desktop */}
                    <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-border z-0 opacity-50" />

                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`relative z-10 flex flex-col items-center text-center w-full lg:w-1/3 transition-all duration-1000
                                ${isInView ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}
                            `}
                            style={{ transitionDelay: `${index * 200}ms` }}
                        >
                            <div className="relative">
                                {/* Large step number background */}
                                <span className="absolute -top-10 -left-6 text-8xl font-black text-muted/30 select-none z-0">
                                    {index + 1}
                                </span>
                                <div className="relative z-10 h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20 mb-6 border-4 border-background">
                                    {step.icon}
                                </div>
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
