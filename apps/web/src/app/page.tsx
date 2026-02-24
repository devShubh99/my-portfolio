import {
    TrendingUp,
    BarChart3,
    Sparkles,
    ArrowRight,
} from "lucide-react";

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
            {/* ── Hero ── */}
            <div className="animate-fade-in text-center">
                <h1 className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
                    StockFolio
                </h1>
                <p className="mt-3 max-w-lg text-lg text-muted-foreground">
                    Your personal Indian stock market command centre — real-time
                    portfolios, technical charts &amp; AI-driven insights.
                </p>
            </div>

            {/* ── Feature cards ── */}
            <div className="grid w-full max-w-3xl animate-slide-up grid-cols-1 gap-4 sm:grid-cols-3">
                <FeatureCard
                    icon={<TrendingUp className="h-6 w-6 text-bullish" />}
                    title="Live Portfolios"
                    desc="Track NSE / BSE holdings with real-time P&L."
                />
                <FeatureCard
                    icon={<BarChart3 className="h-6 w-6 text-primary" />}
                    title="Technical Analysis"
                    desc="Candlestick charts with SMA overlays."
                />
                <FeatureCard
                    icon={<Sparkles className="h-6 w-6 text-neutral" />}
                    title="AI Insights"
                    desc="Automated fundamental & sentiment analysis."
                />
            </div>

            {/* ── CTA ── */}
            <a
                href="/dashboard"
                className="group mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:gap-3 hover:shadow-lg hover:shadow-primary/25"
            >
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
        </main>
    );
}

/* ── Small feature card ── */
function FeatureCard({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="glass group rounded-xl p-5 transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="mb-3">{icon}</div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
    );
}
