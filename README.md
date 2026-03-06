# 📈 StockFolio — Global Portfolio Tracker

A comprehensive, AI-powered portfolio tracking application built for **Global Markets**. Manage your investments across **Stocks (Global & Indian)**, **Currencies**, and **Commodities**. Track performance with live prices, get AI-driven insights, and administer users with a robust Role-Based Access Control (RBAC) system.

---

## 🚀 Features

### For Users
- **Landing Page** — Public-facing aesthetic landing page at `/` with live ticker strip, feature showcase, and AI spotlight.
- **Dark / Light Mode** — Persistent theme toggle; authenticated users have their preference saved to the database and restored on every login.
- **Market Overview** — Dynamic `/dashboard/market` page with live indices, top movers, sector heatmap, and currency/commodities strip.
- **Global Security Search** — Reusable Yahoo Finance-powered search component used across Add Security and Add Transaction flows.
- **Multi-Asset Dashboard** — Real-time tracking for Stocks, Currencies (USD/INR, etc.), and Commodities (Gold, Crude Oil).
- **Portfolio Management** — Add and track securities from any market supported by Yahoo Finance.
- **Transaction Tracking** — Record buy/sell orders with full history; holdings auto-rebalance on each transaction.
- **AI Insights** — Automated portfolio analysis, sentiment scoring, and market correlation insights (Gemini / OpenAI).
- **Technical Analysis** — Interactive candlestick charts, RSI-14, SMA-50/200, and key indicator overlays for any ticker.
- **OTP Verification** — Email-based OTP for signup and password reset (SMTP via Gmail).
- **Secure Authentication** — JWT-based login with password hashing, rate-limiting, and account lockouts.

### For Administrators (RBAC)
- **Admin Dashboard** — High-level metrics, role distribution, and 7-day sign-up / login trends.
- **User Management** — Search, filter, suspend, and manage users; perform manual password resets and role changes.
- **Bulk Actions** — Select multiple users for batch operations (activate, suspend, role change, delete).
- **Emergency Controls** — Instantly lock accounts (revoke all sessions) or force-logout specific users.
- **Data Export** — Download user reports as CSV.
- **Audit Logs** — Track all critical actions (logins, password changes, admin ops) with IP & User-Agent.
- **Permission Matrix** — Clear visibility into what each role (`USER`, `MODERATOR`, `ADMIN`) can do.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI (shadcn/ui), Lucide Icons |
| **Theme System** | `next-themes` (Dark/Light persistent state synced to DB) |
| **Charts** | Recharts (dashboard), Lightweight Charts (candlestick / technical analysis) |
| **Backend API** | Next.js Route Handlers, Custom JWT (`jose` / `jsonwebtoken`) with refresh token rotation |
| **Database** | PostgreSQL (Neon free tier), Prisma ORM |
| **Market Data** | FastAPI (Python) microservice — Twelve Data + Yahoo Finance fallback |
| **AI/ML** | Google Gemini API with rule-based fallback for sentiment analysis |
| **Email** | Nodemailer with Gmail SMTP for OTP delivery |
| **E2E Testing** | Playwright (Chromium, Firefox, WebKit) |
| **Monorepo** | npm Workspaces |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (React)                     │
│  Landing Page  │  Dashboard  │  Admin Panel  │  Auth UI  │
└────────────────────────┬─────────────────────────────────┘
                         │  HTTP (port 3000)
┌────────────────────────▼─────────────────────────────────┐
│               Next.js 15 (App Router)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ API Routes  │  │  Middleware   │  │  React Pages   │  │
│  │ /api/auth/* │  │  JWT verify   │  │  /dashboard/*  │  │
│  │ /api/user/* │  │  RBAC guard   │  │  /admin/*      │  │
│  │ /api/admin/*│  │  Route protect │  │  /login, etc   │  │
│  │ /api/market │──┼─── Proxy ────▶│  └────────────────┘  │
│  └──────┬──────┘  └──────────────┘                       │
│         │                                                │
│  ┌──────▼──────┐                                         │
│  │   Prisma    │                                         │
│  │   ORM       │                                         │
│  └──────┬──────┘                                         │
└─────────┼────────────────────────────────────────────────┘
          │                          │
  ┌───────▼───────┐         ┌───────▼────────────┐
  │  PostgreSQL   │         │  FastAPI Service    │
  │  (Neon)       │         │  (port 8000)        │
  │               │         │  ┌───────────────┐  │
  │  Users        │         │  │ Twelve Data   │  │
  │  Portfolios   │         │  │ Yahoo Finance │  │
  │  Holdings     │         │  │ pandas-ta     │  │
  │  Transactions │         │  │ Gemini AI     │  │
  │  AuditLogs    │         │  └───────────────┘  │
  └───────────────┘         └─────────────────────┘
```

### Key Data Flows

**Portfolio:**
```
User adds security → POST /api/holdings → Prisma → PostgreSQL
Dashboard loads    → GET /api/portfolios → holdings from DB → live prices via proxy
User deletes       → DELETE /api/holdings?id=... → removed from DB permanently
```

**Authentication:**
```
Register → OTP sent via email → Verify OTP → Account activated
Login    → Email + Password → JWT access + refresh tokens (HttpOnly cookies)
Password Reset → OTP sent → Verify OTP → New password set → All sessions revoked
```

**Market Data Proxy:**
```
Browser → GET /api/market/quote/AAPL → Next.js proxy → FastAPI :8000/api/quote/AAPL
```
All market data is proxied through Next.js. The browser only talks to port 3000, avoiding CORS issues and enabling single-tunnel access via ngrok.

---

## 📂 Project Structure

```text
my-portfolio/
├── apps/
│   └── web/                          # Next.js 15 frontend + API backend
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/              # API route handlers
│       │   │   │   ├── auth/         #   Authentication (login, register, OTP, etc.)
│       │   │   │   ├── admin/        #   Admin panel (dashboard, user mgmt, bulk ops)
│       │   │   │   ├── user/         #   User self-service (profile, avatar, password)
│       │   │   │   ├── holdings/     #   CRUD for stock holdings
│       │   │   │   ├── portfolios/   #   CRUD for portfolios
│       │   │   │   ├── transactions/ #   Buy/sell transaction recording
│       │   │   │   ├── market/       #   Proxy to FastAPI market data service
│       │   │   │   └── users/        #   Public user listing (legacy)
│       │   │   ├── dashboard/        # Dashboard pages (portfolio, market)
│       │   │   ├── admin/            # Admin panel pages
│       │   │   ├── login/            # Auth pages
│       │   │   ├── register/
│       │   │   ├── verify-otp/
│       │   │   ├── forgot-password/
│       │   │   ├── reset-password/
│       │   │   ├── change-password/
│       │   │   ├── asset/            # Individual asset detail page
│       │   │   ├── layout.tsx        # Root layout (providers, fonts, metadata)
│       │   │   ├── page.tsx          # Landing page
│       │   │   └── globals.css       # Tailwind base + custom styles
│       │   ├── components/
│       │   │   ├── landing/          # Landing page UI (navbar, hero, features, etc.)
│       │   │   ├── ui/               # shadcn/ui primitives (button, dialog, input, etc.)
│       │   │   ├── header.tsx        # Authenticated header with search & nav
│       │   │   ├── sidebar.tsx       # Dashboard sidebar navigation
│       │   │   ├── theme-toggle.tsx  # Dark/light mode toggle button
│       │   │   ├── theme-provider.tsx# next-themes provider wrapper
│       │   │   ├── global-search.tsx # Yahoo Finance security search
│       │   │   ├── candlestick-chart.tsx  # Lightweight Charts integration
│       │   │   ├── ai-insights-panel.tsx  # AI analysis display panel
│       │   │   └── add-transaction-dialog.tsx  # Transaction entry dialog
│       │   ├── hooks/
│       │   │   └── useInView.ts      # Intersection Observer hook
│       │   ├── lib/
│       │   │   ├── auth.ts           # JWT, password hashing, OTP, audit logging
│       │   │   ├── mailer.ts         # Pluggable email (Console / SMTP)
│       │   │   ├── prisma.ts         # Prisma client singleton
│       │   │   ├── api.ts            # Client-side API fetch helpers
│       │   │   ├── rate-limiter.ts   # In-memory sliding window rate limiter
│       │   │   ├── permissions.ts    # RBAC permission matrix
│       │   │   ├── require-admin.ts  # Admin route guard helper
│       │   │   ├── storage.ts        # Pluggable file storage (local / S3)
│       │   │   ├── validators.ts     # Email, password strength, sanitization
│       │   │   └── utils.ts          # Tailwind cn() utility
│       │   └── middleware.ts         # JWT verification, RBAC routing, path protection
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── next.config.ts
├── packages/
│   └── db/                           # Prisma ORM package
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema (9 models, 6 enums)
│       │   ├── seed.ts               # Database seeder (admin user)
│       │   └── migrations/           # Prisma migration history
│       ├── index.ts                  # Re-exports Prisma client
│       └── package.json
├── services/
│   └── market-data/                  # FastAPI Python microservice
│       ├── main.py                   # App entry point, CORS, router registration
│       ├── routers/
│       │   ├── quote.py              # Live quotes (Twelve Data + yfinance fallback)
│       │   ├── historical.py         # OHLCV candlestick data
│       │   ├── technicals.py         # RSI, SMA-50, SMA-200 indicators
│       │   ├── ai_insight.py         # AI sentiment analysis (Gemini + fallback)
│       │   └── market.py             # Market movers (top gainers/losers)
│       ├── requirements.txt
│       └── .env.example
├── tests/
│   └── e2e/                          # Playwright E2E tests
│       ├── dashboard.spec.js
│       ├── transaction.spec.js
│       └── ai-insights.spec.js
├── .env.example                      # Environment variable template
├── package.json                      # Root workspace config
└── playwright.config.js              # E2E test configuration
```

---

## ⚙️ Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma PostgreSQL connection string (Neon). | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JWT tokens. **Must be ≥ 64 chars in production.** | `change-this-to-a-random-64-char-secret` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime. | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime. | `7d` |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (used in emails, redirects). | `http://localhost:3000` |
| `MARKET_DATA_API_URL` | FastAPI service URL (server-side proxy target). | `http://localhost:8000` |
| `LLM_API_KEY` | Google Gemini API key (optional — falls back to rule-based analysis). | `AIzaSy...` |
| `MAILER_PROVIDER` | Email provider: `console` (stdout) or `smtp`. | `smtp` |
| `SMTP_HOST` | SMTP server hostname. | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port. | `587` |
| `SMTP_USER` | SMTP username / email. | `you@gmail.com` |
| `SMTP_PASS` | SMTP password (use an App Password for Gmail). | `abcd efgh ijkl mnop` |
| `SMTP_FROM` | "From" address on outgoing emails. | `you@gmail.com` |
| `STORAGE_PROVIDER` | File storage backend: `local` or `s3`. | `local` |
| `STORAGE_LOCAL_PATH` | Local disk path for uploaded files. | `./uploads` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds. | `900000` (15 min) |
| `RATE_LIMIT_MAX_ATTEMPTS` | Max attempts per rate-limit window. | `5` |
| `ACCOUNT_LOCKOUT_MINUTES` | Lockout duration after too many failed logins. | `15` |
| `TWELVE_DATA_API_KEY` | Twelve Data API key for live quotes (set in `services/market-data/.env`). | `your-key` |
| `GOOGLE_API_KEY` | Google Gemini API key for AI insights (set in `services/market-data/.env`). | `AIzaSy...` |

---

## 🖥️ Local Development Setup

> Full step-by-step guide with troubleshooting: **[SETUP.md](SETUP.md)**

### Quick Start

```bash
# 1. Clone & install
git clone <your-repo-url>
cd my-portfolio
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# 3. Set up database (requires a PostgreSQL instance — see DEPLOYMENT.md for Neon setup)
cd packages/db
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
cd ../..

# 4. Start Next.js
npm run dev            # → http://localhost:3000

# 5. Start market data service (separate terminal)
cd services/market-data
python -m venv venv
venv\Scripts\activate  # or `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🛡️ Security

- **JWT Cookies** — Access and refresh tokens in `HttpOnly`, `Secure`, `SameSite=lax` cookies
- **Passwords** — Hashed with `bcryptjs` (12 rounds)
- **Rate Limiting** — In-memory sliding window on `/login`, `/register`, `/forgot-password`
- **OTP Protection** — 6-digit codes, 10-minute expiry, max 5 verification attempts
- **Audit Trails** — All critical actions logged with IP and User-Agent
- **Admin Security** — Destructive actions (role change, delete) require password re-authentication
- **Input Sanitization** — HTML tag stripping on all user inputs

---

## 🌗 Theme System

- **Default:** Dark mode for all users to prevent flash of unstyled content.
- **Unauthenticated visitors:** Preference stored in `localStorage` via `next-themes`.
- **Authenticated users:** Theme preference synced to the database. Logging in on a new device restores the saved theme.
- **Toggle:** Accessible from the Navbar / Header on every page.

---

## 📋 Stock Ticker Format

When adding securities, use the correct Yahoo Finance ticker format:

| Exchange | Suffix | Example |
|---|---|---|
| NSE (India) | `.NS` | `RELIANCE.NS`, `TCS.NS`, `INFY.NS` |
| BSE (India) | `.BO` | `RELIANCE.BO`, `TCS.BO` |
| US Markets | (none) | `AAPL`, `MSFT`, `GOOGL` |
| Forex | (slash) | `EUR/USD`, `GBP/INR` |

---

## 📚 Additional Documentation

- **[SETUP.md](SETUP.md)** — Detailed setup & troubleshooting guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deploy to Vercel + Neon + Render (free)
- **[docs/API.md](docs/API.md)** — Complete API reference (40+ endpoints)

---

## 📜 License

[MIT License](LICENSE)
