# ─────────────────────────────────────────────────────────────
# FastAPI Router — Technical Indicators (pandas-ta)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas_ta as ta

router = APIRouter(prefix="/api/technicals", tags=["Technical Analysis"])


@router.get("/{ticker}")
async def get_technicals(ticker: str):
    """
    Calculate 14-day RSI, 50-day SMA, and 200-day SMA for a ticker.
    Requires ~200+ days of daily data to compute the 200 SMA.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y", interval="1d")

        if hist.empty or len(hist) < 14:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient data for technical analysis: {ticker}",
            )

        close = hist["Close"]

        # ── Compute indicators ──
        rsi_14 = ta.rsi(close, length=14)
        sma_50 = ta.sma(close, length=50)
        sma_200 = ta.sma(close, length=200)

        # Latest values
        latest_rsi = round(rsi_14.iloc[-1], 2) if rsi_14 is not None and not rsi_14.empty else None
        latest_sma50 = round(sma_50.iloc[-1], 2) if sma_50 is not None and not sma_50.empty else None
        latest_sma200 = round(sma_200.iloc[-1], 2) if sma_200 is not None and not sma_200.empty else None
        latest_price = round(close.iloc[-1], 2)

        # ── SMA time-series for chart overlay ──
        sma50_series = []
        sma200_series = []

        if sma_50 is not None:
            for idx, val in sma_50.dropna().items():
                sma50_series.append({"time": int(idx.timestamp()), "value": round(val, 2)})

        if sma_200 is not None:
            for idx, val in sma_200.dropna().items():
                sma200_series.append({"time": int(idx.timestamp()), "value": round(val, 2)})

        return {
            "ticker": ticker,
            "latestPrice": latest_price,
            "rsi14": latest_rsi,
            "sma50": latest_sma50,
            "sma200": latest_sma200,
            "sma50Series": sma50_series,
            "sma200Series": sma200_series,
            "signal": _derive_signal(latest_rsi, latest_sma50, latest_sma200, latest_price),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _derive_signal(rsi, sma50, sma200, price):
    """Simple signal logic based on SMA crossover and RSI."""
    signals = []

    if sma50 and sma200:
        if sma50 > sma200:
            signals.append("Golden Cross (50 SMA > 200 SMA) — Bullish")
        else:
            signals.append("Death Cross (50 SMA < 200 SMA) — Bearish")

    if rsi:
        if rsi > 70:
            signals.append(f"RSI {rsi} — Overbought")
        elif rsi < 30:
            signals.append(f"RSI {rsi} — Oversold")
        else:
            signals.append(f"RSI {rsi} — Neutral")

    return signals if signals else ["Insufficient data for signal"]
