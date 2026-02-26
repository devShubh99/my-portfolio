import { useState, useEffect } from "react";
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { searchSecurities, SearchResult } from "@/lib/api";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchSecurities(query);
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
            >
                <span className="hidden lg:inline-flex">Search securities...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type a ticker or company name..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {loading && (
                        <div className="p-4 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!loading && query.length >= 2 && results.length === 0 && (
                        <CommandEmpty>No results found.</CommandEmpty>
                    )}

                    {!loading && results.length > 0 && (
                        <CommandGroup heading="Global Securities">
                            {results.map((result) => (
                                <CommandItem key={result.ticker} onSelect={() => {
                                    // Navigate to future asset detail page or take action
                                    console.log("Selected from global search", result);
                                    setOpen(false);
                                }}>
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold flex items-center gap-2">
                                                {result.ticker}
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1">{result.exchange}</Badge>
                                            </span>
                                            <span className="text-xs text-muted-foreground">{result.name}</span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.length === 0 && !query && (
                        <>
                            <CommandGroup heading="Suggestions">
                                <CommandItem><Calendar className="mr-2 h-4 w-4" /> <span>Portfolio Analytics</span></CommandItem>
                                <CommandItem><Smile className="mr-2 h-4 w-4" /> <span>Search Emojis</span></CommandItem>
                                <CommandItem><Calculator className="mr-2 h-4 w-4" /> <span>Tax Calculator</span></CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Settings">
                                <CommandItem><User className="mr-2 h-4 w-4" /> <span>Profile</span></CommandItem>
                                <CommandItem><CreditCard className="mr-2 h-4 w-4" /> <span>Billing</span></CommandItem>
                                <CommandItem><Settings className="mr-2 h-4 w-4" /> <span>Settings</span></CommandItem>
                            </CommandGroup>
                        </>
                    )}

                </CommandList>
            </CommandDialog>
        </>
    );
}
