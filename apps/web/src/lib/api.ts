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

/** Fetch current quote for a single ticker (uses historical with 5d/1d and takes the last candle) */
export async function fetchQuote(ticker: string) {
    const candles = await fetchHistorical(ticker, "5d", "1d");
    if (candles.length < 2) return null;
    const latest = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const dayChange = latest.close - prev.close;
    const dayChangePercent = (dayChange / prev.close) * 100;
    return {
        price: latest.close,
        dayChange,
        dayChangePercent,
    };
}
