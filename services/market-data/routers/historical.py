# ─────────────────────────────────────────────────────────────
# FastAPI Router — Historical Market Data (yfinance)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import yfinance as yf

router = APIRouter(prefix="/api/historical", tags=["Historical Data"])


@router.get("/{ticker}")
async def get_historical_data(
    ticker: str,
    period: str = Query("6mo", description="Valid yfinance period: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max"),
    interval: str = Query("1d", description="Valid yfinance interval: 1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo"),
):
    """
    Fetch OHLCV historical data for an NSE (.NS) or BSE (.BO) ticker.
    Returns data formatted for TradingView Lightweight Charts.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for ticker: {ticker}",
            )

        # Format for Lightweight Charts candlestick series
        candles = []
        for index, row in hist.iterrows():
            candles.append(
                {
                    "time": int(index.timestamp()),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                }
            )

        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "count": len(candles),
            "data": candles,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
