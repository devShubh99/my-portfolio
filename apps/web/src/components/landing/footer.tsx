import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <TrendingUp className="h-6 w-6 text-bullish" />
                        <span className="text-xl font-bold tracking-tight">StockFolio</span>
                    </Link>
                    <p className="text-sm text-muted-foreground">Global Portfolio Tracking, Simplified.</p>
                </div>

                <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
                    <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
                    <Link href="/register" className="hover:text-foreground transition-colors text-foreground">Get Started</Link>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60 border-t border-border/20 pt-8">
                <p>&copy; {new Date().getFullYear()} StockFolio. All rights reserved.</p>
                <div className="flex items-center gap-4">
                    <span>Built with Next.js, FastAPI & ❤️</span>
                    <span className="w-1 h-1 rounded-full bg-border/40" />
                    <span>MIT License</span>
                </div>
            </div>
        </footer>
    );
}
