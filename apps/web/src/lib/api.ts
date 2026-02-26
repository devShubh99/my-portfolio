/**
 * API client for the FastAPI market-data service.
 * Routes through the Next.js proxy at /api/market/* so it works
 * identically on localhost and via ngrok.
 */

const BASE_URL = "/api/market";

export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface TechnicalsResponse {
    ticker: string;
    latest_price: number;
    rsi_14: number | null;
    sma_50: number | null;
    sma_200: number | null;
    signal: string;
    series: {
        sma_50: Array<{ time: number; value: number }>;
        sma_200: Array<{ time: number; value: number }>;
    };
}

export interface AIInsightResponse {
    ticker: string;
    sentiment: "Bullish" | "Bearish" | "Neutral";
    analysis: string;
    fundamentals: Record<string, any>;
    technicals: Record<string, any>;
}

/** Fetch historical OHLCV candles for a ticker */
export async function fetchHistorical(
    ticker: string,
    period = "6mo",
    interval = "1d"
): Promise<CandleData[]> {
    const res = await fetch(
        `${BASE_URL}/historical/${encodeURIComponent(ticker)}?period=${period}&interval=${interval}`
    );
    if (!res.ok) throw new Error(`Historical API error: ${res.status}`);
    const json = await res.json();
    // FastAPI returns { data: [...] }
    return json.data || [];
}

/** Fetch technical indicators (RSI-14, SMA-50, SMA-200) */
export async function fetchTechnicals(
    ticker: string
): Promise<TechnicalsResponse> {
    const res = await fetch(
        `${BASE_URL}/technicals/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error(`Technicals API error: ${res.status}`);
    const json = await res.json();

    // Normalize keys from FastAPI's camelCase to our interface
    return {
        ticker: json.ticker,
        latest_price: json.latestPrice,
        rsi_14: json.rsi14,
        sma_50: json.sma50,
        sma_200: json.sma200,
        signal: Array.isArray(json.signal) ? json.signal[0] : json.signal,
        series: {
            sma_50: json.sma50Series || [],
            sma_200: json.sma200Series || [],
        },
    };
}

/** Fetch AI-powered insight (sentiment + analysis) */
export async function fetchAIInsight(
    ticker: string
): Promise<AIInsightResponse> {
    const res = await fetch(
        `${BASE_URL}/ai-insight/${encodeURIComponent(ticker)}`
    );
    if (!res.ok) throw new Error(`AI Insight API error: ${res.status}`);
    const json = await res.json();

    // Normalize: FastAPI returns analysis_text, we use analysis
    return {
        ticker: json.ticker,
        sentiment: json.sentiment,
        analysis: json.analysis_text || json.analysis || "",
        fundamentals: json.fundamentals || {},
        technicals: json.technicals || {},
    };
}

export interface QuoteData {
    ticker: string;
    price: number;
    previousClose: number;
    dayChange: number;
    dayChangePercent: number;
    name?: string;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
}

/** Fetch current quote for a single ticker efficiently (uses new backend endpoint) */
export async function fetchSingleQuote(ticker: string): Promise<QuoteData | null> {
    try {
        const res = await fetch(`${BASE_URL}/quote/${encodeURIComponent(ticker)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Error fetching single quote:", e);
        return null;
    }
}

/** Fetch current quotes for multiple tickers in one batch request */
export async function fetchBatchQuotes(tickers: string[]): Promise<QuoteData[]> {
    if (!tickers || tickers.length === 0) return [];

    try {
        const res = await fetch(`${BASE_URL}/batch-quotes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tickers }),
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.quotes || [];
    } catch (e) {
        console.error("Error fetching batch quotes:", e);
        return [];
    }
}

/** Legacy signature for backward compatibility - calls the new single quote endpoint */
export async function fetchQuote(ticker: string) {
    const quote = await fetchSingleQuote(ticker);
    if (!quote) return null;

    return {
        price: quote.price,
        dayChange: quote.dayChange,
        dayChangePercent: quote.dayChangePercent,
        name: quote.name,
    };
}

export interface SearchResult {
    ticker: string;
    name: string;
    exchange: string;
    typeDisp: string;
    // Removed price and previousClose to optimize search performance natively via Yahoo
}

// Simple in-memory cache for search results to avoid spamming the API
// Keys are lowercase query strings, Values are the result arrays and a timestamp
const searchCache = new Map<string, { data: SearchResult[], timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute

/** Fetch live search autocomplete options with prices directly */
export async function searchSecurities(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = query.toLowerCase().trim();
    const cached = searchCache.get(cacheKey);

    // Return cached results if they are fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    try {
        const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return [];
        const data = await res.json();

        const results = data.results || [];

        // Save to cache
        searchCache.set(cacheKey, { data: results, timestamp: Date.now() });

        return results;
    } catch (e) {
        console.error("Error searching securities:", e);
        return [];
    }
}
export interface MarketMovers {
    gainers: QuoteData[];
    losers: QuoteData[];
    mostActive: QuoteData[];
}

/** Fetch top market movers (gainers, losers, most active) */
export async function fetchMarketMovers(): Promise<MarketMovers> {
    try {
        const res = await fetch(`${BASE_URL}/movers`);
        if (!res.ok) throw new Error(`Movers API error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Error fetching market movers:", e);
        return { gainers: [], losers: [], mostActive: [] };
    }
}
