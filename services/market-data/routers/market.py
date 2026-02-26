from fastapi import APIRouter, HTTPException
import yfinance as yf
import asyncio
from typing import List, Dict, Any

router = APIRouter(prefix="/api", tags=["Market"])

# A representative list of major Indian stocks (Nifty 50 components)
NIFTY_50_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
    "LICI.NS", "LTIM.NS", "LT.NS", "KOTAKBANK.NS", "HCLTECH.NS",
    "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS",
    "ULTRACEMCO.NS", "BAJAJFINSV.NS", "ADANIENT.NS", "JSWSTEEL.NS", "M&M.NS",
    "TATASTEEL.NS", "NTPC.NS", "POWERGRID.NS", "HINDALCO.NS", "ADANIPORTS.NS",
    "GRASIM.NS", "ONGC.NS", "TATAMOTORS.NS", "COALINDIA.NS", "WIPRO.NS",
    "BRITANNIA.NS", "BPCL.NS", "NESTLEIND.NS", "SBILIFE.NS", "DRREDDY.NS",
    "HDFCLIFE.NS", "BAJAJ-AUTO.NS", "CIPLA.NS", "EICHERMOT.NS", "DIVISLAB.NS",
    "APOLLOHOSP.NS", "HEROMOTOCO.NS", "TATACONSUM.NS", "UPL.NS", "ADANIPOWER.NS"
]

@router.get("/movers")
async def get_market_movers():
    """
    Fetch top gainers and losers for the Indian market by sampling Nifty 50 components.
    """
    try:
        def fetch_movers_sync():
            # Use yfinance download for batch fetch of 1d history
            data = yf.download(NIFTY_50_TICKERS, period="2d", group_by='ticker', progress=False)
            
            movers_list = []
            for ticker in NIFTY_50_TICKERS:
                try:
                    if ticker not in data or data[ticker].empty or len(data[ticker]) < 2:
                        continue
                    
                    hist = data[ticker]
                    curr_price = float(hist["Close"].iloc[-1])
                    prev_close = float(hist["Close"].iloc[-2])
                    
                    change = curr_price - prev_close
                    pct_change = (change / prev_close) * 100 if prev_close != 0 else 0
                    
                    movers_list.append({
                        "ticker": ticker,
                        "price": round(curr_price, 2),
                        "dayChange": round(change, 2),
                        "dayChangePercent": round(pct_change, 2),
                        "name": ticker.replace(".NS", "")
                    })
                except Exception:
                    continue
            
            # Sort by dayChangePercent
            movers_list.sort(key=lambda x: x["dayChangePercent"], reverse=True)
            
            return {
                "gainers": movers_list[:10],
                "losers": movers_list[-10:][::-1],
                "mostActive": sorted(movers_list, key=lambda x: abs(x["dayChangePercent"]), reverse=True)[:10]
            }

        result = await asyncio.to_thread(fetch_movers_sync)
        return result

    except Exception as e:
        print(f"[DEBUG] Error in get_market_movers: {e}")
        raise HTTPException(status_code=500, detail=str(e))
