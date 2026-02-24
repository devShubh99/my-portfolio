import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function InsightsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
                <p className="text-sm text-muted-foreground">
                    AI-powered market analysis and sentiment
                </p>
            </div>
            <Card className="flex flex-col items-center justify-center py-16">
                <CardContent className="text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-semibold">AI Insights Hub</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        View automated fundamental and technical analysis for any ticker.
                        Configure your LLM API key in .env to unlock AI-powered insights.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
