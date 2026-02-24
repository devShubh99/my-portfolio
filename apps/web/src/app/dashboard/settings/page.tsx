import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Configure your account and preferences
                </p>
            </div>
            <Card className="flex flex-col items-center justify-center py-16">
                <CardContent className="text-center">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-semibold">Settings</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Manage your profile, API keys, notification preferences, and
                        database connection settings.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
