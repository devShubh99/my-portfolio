# ─────────────────────────────────────────────────────────────
# FastAPI Router — AI Insights (LLM Integration)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
import pandas_ta as ta
import httpx
import os
import json

router = APIRouter(prefix="/api/ai-insight", tags=["AI Insights"])

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_URL = os.getenv(
    "LLM_API_URL",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
)


class AIInsightResponse(BaseModel):
    ticker: str
    sentiment: str  # Bullish | Bearish | Neutral
    analysis_text: str
    fundamentals: dict
    technicals: dict


@router.get("/{ticker}", response_model=AIInsightResponse)
async def get_ai_insight(ticker: str):
    """
    Fetch fundamentals + technicals for a ticker, send to an LLM,
    and return a structured sentiment + analysis response.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1y", interval="1d")

        if not info or hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for ticker: {ticker}",
            )

        # ── Fundamentals ──
        fundamentals = {
            "name": info.get("shortName", ticker),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "marketCap": info.get("marketCap", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "forward_pe": info.get("forwardPE", "N/A"),
            "dividend_yield": info.get("dividendYield", "N/A"),
            "52w_high": info.get("fiftyTwoWeekHigh", "N/A"),
            "52w_low": info.get("fiftyTwoWeekLow", "N/A"),
        }

        # ── Technicals ──
        close = hist["Close"]
        rsi_14 = ta.rsi(close, length=14)
        sma_50 = ta.sma(close, length=50)
        sma_200 = ta.sma(close, length=200)

        technicals = {
            "latest_price": round(close.iloc[-1], 2),
            "rsi_14": round(rsi_14.iloc[-1], 2) if rsi_14 is not None and not rsi_14.empty else None,
            "sma_50": round(sma_50.iloc[-1], 2) if sma_50 is not None and not sma_50.empty else None,
            "sma_200": round(sma_200.iloc[-1], 2) if sma_200 is not None and not sma_200.empty else None,
        }

        # ── Build LLM Prompt ──
        prompt = f"""You are a professional Indian stock market analyst.
Analyze the following data for {ticker} and provide your assessment.

FUNDAMENTALS:
{json.dumps(fundamentals, indent=2)}

TECHNICALS:
{json.dumps(technicals, indent=2)}

Respond ONLY with valid JSON in this exact format:
{{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "analysis_text": "A 2-3 paragraph analysis covering key fundamental and technical observations, risks, and outlook."
}}"""

        # ── Call LLM (with fallback) ──
        sentiment = "Neutral"
        analysis_text = ""

        if LLM_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{LLM_API_URL}?key={LLM_API_KEY}",
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                        },
                        headers={"Content-Type": "application/json"},
                    )
                    response.raise_for_status()
                    result = response.json()

                    # Parse Gemini response
                    text = result["candidates"][0]["content"]["parts"][0]["text"]
                    # Strip markdown code fences if present
                    text = text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("```", 1)[0]
                    text = text.strip()

                    parsed = json.loads(text)
                    sentiment = parsed.get("sentiment", "Neutral")
                    analysis_text = parsed.get("analysis_text", "")

            except Exception as llm_err:
                print(f"[AI Insight] LLM call failed: {llm_err}")
                analysis_text = _generate_fallback_analysis(ticker, fundamentals, technicals)
        else:
            # No API key — use rule-based fallback
            analysis_text = _generate_fallback_analysis(ticker, fundamentals, technicals)
            sentiment = _fallback_sentiment(technicals)

        return AIInsightResponse(
            ticker=ticker,
            sentiment=sentiment,
            analysis_text=analysis_text,
            fundamentals=fundamentals,
            technicals=technicals,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_fallback_analysis(ticker: str, fundamentals: dict, technicals: dict) -> str:
    """Rule-based fallback when no LLM API key is configured."""
    price = technicals.get("latest_price", "N/A")
    rsi = technicals.get("rsi_14")
    pe = fundamentals.get("pe_ratio", "N/A")

    lines = [f"{fundamentals.get('name', ticker)} is currently trading at ₹{price}."]

    if pe and pe != "N/A":
        lines.append(f"The trailing P/E ratio is {pe:.1f}.")

    if rsi:
        if rsi > 70:
            lines.append(f"The RSI-14 at {rsi} indicates the stock is in overbought territory, suggesting caution.")
        elif rsi < 30:
            lines.append(f"The RSI-14 at {rsi} indicates the stock is in oversold territory, potentially presenting a buying opportunity.")
        else:
            lines.append(f"The RSI-14 is at {rsi}, within normal range.")

    sma50 = technicals.get("sma_50")
    sma200 = technicals.get("sma_200")
    if sma50 and sma200:
        if sma50 > sma200:
            lines.append("The 50-day SMA is above the 200-day SMA (Golden Cross), which is a bullish technical signal.")
        else:
            lines.append("The 50-day SMA is below the 200-day SMA (Death Cross), which is a bearish technical signal.")

    lines.append("Note: This is an automated analysis. Please consult a financial advisor before making investment decisions.")

    return " ".join(lines)


def _fallback_sentiment(technicals: dict) -> str:
    """Derive a simple sentiment from technicals alone."""
    rsi = technicals.get("rsi_14")
    sma50 = technicals.get("sma_50")
    sma200 = technicals.get("sma_200")

    bullish_signals = 0
    bearish_signals = 0

    if rsi:
        if rsi > 55:
            bullish_signals += 1
        elif rsi < 45:
            bearish_signals += 1

    if sma50 and sma200:
        if sma50 > sma200:
            bullish_signals += 1
        else:
            bearish_signals += 1

    if bullish_signals > bearish_signals:
        return "Bullish"
    elif bearish_signals > bullish_signals:
        return "Bearish"
    return "Neutral"
