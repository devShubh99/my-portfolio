"use client";

import { useInView } from "@/hooks/useInView";
import { MOCK_DATA } from "./mock-data";

export function SocialProof() {
    const { ref: statsRef, isInView: statsInView } = useInView();
    const { ref: testsRef, isInView: testsInView } = useInView();

    return (
        <section className="py-24 px-6 border-t border-border/40 relative bg-background">
            <div className="max-w-5xl mx-auto text-center" ref={statsRef}>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 divide-y md:divide-y-0 md:divide-x divide-border/40">
                    {MOCK_DATA.stats.map((stat, i) => (
                        <div
                            key={i}
                            className={`py-4 md:py-0 transition-opacity duration-1000 ${statsInView ? "opacity-100" : "opacity-0"
                                }`}
                            style={{ transitionDelay: `${i * 200}ms` }}
                        >
                            <p className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground">{stat.value}</p>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Testimonial Cards */}
                <div
                    ref={testsRef}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {MOCK_DATA.testimonials.map((testimonial, i) => (
                        <div
                            key={i}
                            className={`glass text-left p-8 rounded-2xl transition-all duration-1000 ${testsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                                }`}
                            style={{ transitionDelay: `${i * 300}ms` }}
                        >
                            <p className="text-lg italic text-foreground/90 mb-6 leading-relaxed">
                                "{testimonial.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary-foreground font-bold flex items-center justify-center border border-primary/30">
                                    {testimonial.initial}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{testimonial.name}</p>
                                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
