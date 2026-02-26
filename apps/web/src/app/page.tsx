import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { TickerStrip } from "@/components/landing/ticker-strip";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MarketShowcase } from "@/components/landing/market-showcase";
import { AISpotlight } from "@/components/landing/ai-spotlight";
import { SocialProof } from "@/components/landing/social-proof";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col text-sans overflow-x-hidden">
            <Navbar />
            <main className="flex-grow flex flex-col">
                <Hero />
                <TickerStrip />
                <FeaturesGrid />
                <HowItWorks />
                <MarketShowcase />
                <AISpotlight />
                <SocialProof />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
}
