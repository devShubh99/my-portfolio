# ─────────────────────────────────────────────────
# FastAPI Market Data & AI Service — Entry Point
# ─────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Stock Portfolio Tracker — Market Data API",
    version="1.0.0",
    description="Provides historical market data, technical indicators, and AI-driven insights for NSE/BSE stocks.",
)

# ── CORS (allow all origins for tunnel/dev access) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "market-data"}


# ── Route imports ──
from routers import historical, technicals, ai_insight

app.include_router(historical.router)
app.include_router(technicals.router)
app.include_router(ai_insight.router)
