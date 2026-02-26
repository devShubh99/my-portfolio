# ─────────────────────────────────────────────────────────────
# FastAPI Router — Live Quotes (yfinance)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import httpx
import os
import asyncio
import yfinance as yf

router = APIRouter(
    prefix="/api",
    tags=["quote"]
)

class BatchQuoteRequest(BaseModel):
    tickers: List[str]

TWELVE_DATA_BASE_URL = "https://api.twelvedata.com"

def get_td_api_key():
    api_key = os.getenv("TWELVE_DATA_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="TWELVE_DATA_API_KEY environment variable is missing. Please sign up at twelvedata.com and add your API key to the .env file."
        )
    return api_key

@router.get("/quote/{ticker}")
async def get_live_quote(ticker: str):
    """
    Fetch current live price for a single global ticker efficiently using Twelve Data.
    """
    api_key = get_td_api_key()
    
    url = f"{TWELVE_DATA_BASE_URL}/quote?symbol={ticker}&apikey={api_key}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            if "status" in data and data["status"] == "error":
                raise HTTPException(
                    status_code=404,
                    detail=f"Twelve Data error: {data.get('message', 'Unknown error')}",
                )
            
            price = float(data.get("close", 0))
            prev_close = float(data.get("previous_close", 0))
            day_change = float(data.get("change", 0))
            day_change_percent = float(data.get("percent_change", 0))
            name = data.get("name", ticker)
                
            return {
                "ticker": ticker,
                "price": round(price, 2),
                "previousClose": round(prev_close, 2),
                "dayChange": round(day_change, 2),
                "dayChangePercent": round(day_change_percent, 2),
                "name": name,
                "fiftyTwoWeekHigh": float(data.get("fifty_two_week", {}).get("high", 0)) if data.get("fifty_two_week") else 0,
                "fiftyTwoWeekLow": float(data.get("fifty_two_week", {}).get("low", 0)) if data.get("fifty_two_week") else 0
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Twelve Data API error: {str(e)}")


@router.post("/batch-quotes")
async def get_batch_quotes(request: BatchQuoteRequest):
    """
    Fetch current live prices for multiple global tickers efficiently using Twelve Data.
    Takes a list of tickers and fetches them in a single REST request.
    """
    tickers = request.tickers
    if not tickers:
        return {"quotes": []}
        
    api_key = get_td_api_key()
    
    # Twelve Data supports passing multiple symbols separated by commas
    # e.g.: /quote?symbol=AAPL,MSFT,EUR/USD
    tickers_str = ",".join(tickers)
    url = f"{TWELVE_DATA_BASE_URL}/quote?symbol={tickers_str}&apikey={api_key}"
    
    print(f"[DEBUG] Fetching batch quotes for: {tickers_str}")
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            
            print(f"[DEBUG] Twelve Data response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")

            if "status" in data and data["status"] == "error":
                print(f"[DEBUG] Twelve Data returned top-level error: {data.get('message')}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Twelve Data error: {data.get('message', 'Unknown error')}",
                )
                
            results = []
            
            # If requesting a single ticker, Twelve Data returns a flat object.
            # If requesting multiple, Twelve Data returns a dict where keys are symbols.
            if len(tickers) == 1:
                items = {tickers[0]: data}
            else:
                items = data

            for ticker, quote_data in items.items():
                if not isinstance(quote_data, dict):
                    print(f"[DEBUG] quote_data for {ticker} is not a dict: {quote_data}")
                    continue

                if "status" in quote_data and quote_data["status"] == "error":
                    print(f"[DEBUG] Error for ticker {ticker}: {quote_data.get('message')}")
                    continue # Skip invalid tickers in Twelve Data
                
                price = float(quote_data.get("close", 0))
                prev_close = float(quote_data.get("previous_close", 0))
                day_change = float(quote_data.get("change", 0))
                day_change_percent = float(quote_data.get("percent_change", 0))
                name = quote_data.get("name", ticker)
                
                results.append({
                    "ticker": ticker.upper(),
                    "price": round(price, 2),
                    "previousClose": round(prev_close, 2),
                    "dayChange": round(day_change, 2),
                    "dayChangePercent": round(day_change_percent, 2),
                    "name": name 
                })
            
            # --- Fallback for missing tickers (e.g., Indian stocks with .NS/.BO) ---
            found_tickers = {r["ticker"].upper() for r in results}
            missing_tickers = [t for t in tickers if t.upper() not in found_tickers]
            
            if missing_tickers:
                print(f"[DEBUG] Tickers not found by Twelve Data, trying yfinance: {missing_tickers}")
                
                def fetch_yf_quotes_sync(ticker_list):
                    yf_results = []
                    for t in ticker_list:
                        try:
                            s = yf.Ticker(t)
                            h = s.history(period="2d")
                            if h.empty:
                                continue
                            
                            # Use iloc[-1] for latest close, iloc[-2] for previous if available
                            curr_price = float(h["Close"].iloc[-1])
                            prev_close = float(h["Close"].iloc[-2]) if len(h) > 1 else curr_price
                            change = curr_price - prev_close
                            pct_change = (change / prev_close * 100) if prev_close != 0 else 0
                            
                            yf_results.append({
                                "ticker": t.upper(),
                                "price": round(curr_price, 2),
                                "previousClose": round(prev_close, 2),
                                "dayChange": round(change, 2),
                                "dayChangePercent": round(pct_change, 2),
                                "name": s.info.get("shortName", t),
                                "fiftyTwoWeekHigh": s.info.get("fiftyTwoWeekHigh", 0),
                                "fiftyTwoWeekLow": s.info.get("fiftyTwoWeekLow", 0)
                            })
                        except Exception as yf_e:
                            print(f"[DEBUG] yfinance fallback failed for {t}: {yf_e}")
                    return yf_results

                yf_quotes = await asyncio.to_thread(fetch_yf_quotes_sync, missing_tickers)
                results.extend(yf_quotes)

            print(f"[DEBUG] Returning {len(results)} valid quotes out of {len(tickers)} requested (Twelve Data + yfinance)")
            return {"quotes": results}
        
    except httpx.HTTPStatusError as e:
        print(f"[DEBUG] Twelve Data HTTP error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 401:
             raise HTTPException(status_code=401, detail="Invalid Twelve Data API Key.")
        if e.response.status_code == 429:
             raise HTTPException(status_code=429, detail="Twelve Data API quota exhausted.")
        raise HTTPException(status_code=502, detail=f"API returned error: {e.response.status_code}")
    except Exception as e:
        print(f"[DEBUG] Unexpected error in batch-quotes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_securities(q: str):
    """
    Live search for securities using Yahoo Finance (autocomplete).
    Returns top 5 matching results with name, ticker, and exchange.
    """
    if not q or len(q) < 2:
        return {"results": []}
        
    # 1. Fetch autocomplete suggestions from Yahoo Finance (Free, no API key needed)
    yh_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=5"
    
    try:
        async with httpx.AsyncClient() as client:
            yh_resp = await client.get(yh_url, timeout=10.0, headers={"User-Agent": "Mozilla/5.0"})
            
            # If Yahoo limit triggers or fails, fallback to empty list instead of crashing search
            if yh_resp.status_code != 200:
                print(f"Yahoo search error: {yh_resp.status_code}")
                return {"results": []}
                
            yh_data = yh_resp.json()
            quotes = yh_data.get("quotes", [])
            
            if not quotes:
                return {"results": []}
                
            # Filter to equities/ETFs, etc. and extract symbols
            valid_quotes = [q for q in quotes if q.get("quoteType") in ["EQUITY", "ETF", "MUTUALFUND", "CRYPTOCURRENCY", "INDEX"]]
            if not valid_quotes:
                # If no valid types, just take the first 5
                valid_quotes = quotes[:5]
                
            # 2. Return data
            results = []
            for item in valid_quotes:
                sym = item.get("symbol")
                if not sym: continue
                     
                results.append({
                    "ticker": sym,
                    "name": item.get("shortname") or item.get("longname") or sym,
                    "exchange": item.get("exchange", "Unknown"),
                    "typeDisp": item.get("typeDisp", "Asset")
                })
                
            return {"results": results[:5]}
            
    except Exception as e:
        print(f"Search endpoint error: {str(e)}")
        # Return empty list on failure so the UI dropdown degrades gracefully
        return {"results": []}
