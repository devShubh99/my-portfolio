import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchSecurities, SearchResult } from "@/lib/api";

export interface SecuritySearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (result: SearchResult) => void;
    placeholder?: string;
    error?: string | null;
    id?: string;
}

export function SecuritySearchInput({
    value,
    onChange,
    onSelect,
    placeholder = "e.g. AAPL, NVDA, BTC/USD",
    error,
    id = "security-search",
}: SecuritySearchInputProps) {
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Prevent closing suggestions when clicking inside the dropdown
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Live search debouncing
    useEffect(() => {
        if (!value || value.length < 2) {
            setSearchResults([]);
            return;
        }

        // Don't search if they just selected from dropdown
        if (!showSuggestions) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const results = await searchSecurities(value);
                setSearchResults(results);
                if (results.length === 0) {
                    setSearchError("No matching security found. Please check the symbol and try again.");
                }
            } catch {
                setSearchError("Failed to search databases.");
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, showSuggestions]);

    const handleSelect = (result: SearchResult) => {
        onSelect(result);
        setShowSuggestions(false);
        setSearchError(null);
    };

    return (
        <div className="relative space-y-2" ref={containerRef}>
            <div className="relative">
                <Input
                    id={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value.toUpperCase());
                        setSearchError(null);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => {
                        if (value.length >= 2) setShowSuggestions(true);
                    }}
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Show local error or prop error */}
            {(searchError || error) && (
                <p className="text-[11px] text-amber-500 font-medium">{searchError || error}</p>
            )}

            {showSuggestions && searchResults.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-background border rounded-md shadow-xl overflow-hidden">
                    {searchResults.map((result) => (
                        <div
                            key={result.ticker}
                            onClick={() => handleSelect(result)}
                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground border-b last:border-0 flex justify-between items-center transition-colors"
                        >
                            <div className="flex flex-col w-full">
                                <span className="font-bold flex items-center gap-2">
                                    {result.ticker}
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">{result.exchange}</Badge>
                                </span>
                                <span className="text-xs text-muted-foreground line-clamp-1 truncate">{result.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
