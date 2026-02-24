import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MarketPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Market</h1>
                <p className="text-sm text-muted-foreground">
                    Browse NSE &amp; BSE market data
                </p>
            </div>
            <Card className="flex flex-col items-center justify-center py-16">
                <CardContent className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-semibold">Market Overview</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Real-time market data and stock screener. Start the FastAPI service
                        to fetch live prices from NSE and BSE.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
