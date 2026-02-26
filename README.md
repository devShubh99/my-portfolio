# 📈 StockFolio — Global Portfolio Tracker

A comprehensive, AI-powered portfolio tracking application built for **Global Markets**. Manage your investments across **Stocks (Global & Indian)**, **Currencies**, and **Commodities**. Track performance with live prices, get AI-driven insights, and administer users with a robust Role-Based Access Control (RBAC) system.

---

## 🚀 Features

### For Users
- **Landing Page** — Public-facing aesthetic landing page at `/` with live ticker strip, feature showcase, and AI spotlight.
- **Dark / Light Mode** — Persistent theme toggle; authenticated users have their preference saved to the database and restored on every login. Default theme is dark for all users.
- **Market Overview** — Dynamic `/dashboard/market` page with live indices, top movers, sector heatmap, and currency/commodities strip.
- **Global Security Search** — Reusable Yahoo Finance-powered search component used across Add Security and Add Transaction flows.
- **Multi-Asset Dashboard** — Real-time tracking for Stocks, Currencies (USD/INR, etc.), and Commodities (Gold, Crude Oil)
- **Portfolio Management** — Add and track securities from any market supported by Yahoo Finance
- **Transaction Tracking** — Record buy/sell orders with full history
- **AI Insights** — Automated portfolio analysis, sentiment scoring, and market correlation insights (Gemini/OpenAI)
- **Technical Analysis** — Interactive charts, RSI, SMA-50/200, and key indicator overlays for any ticker
- **OTP Verification** — Email-based OTP for signup and password reset (SMTP via Gmail)
- **Secure Authentication** — JWT-based login with password hashing, rate-limiting, and account lockouts

### For Administrators (RBAC)
- **Admin Dashboard** — High-level metrics, role distribution, and 7-day sign-up/login trends
- **User Management** — Search, filter, suspend, and manage users; perform manual password resets and role changes
- **Bulk Actions** — Select multiple users for batch operations (activate, suspend, role change, delete)
- **Emergency Controls** — Instantly lock accounts (revoke all sessions) or force-logout specific users
- **Data Export** — Download user reports as CSV
- **Audit Logs** — Track all critical actions (logins, password changes, admin ops) with IP & User-Agent
- **Permission Matrix** — Clear visibility into what each role (`USER`, `MODERATOR`, `ADMIN`) can do

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI (shadcn/ui), Lucide Icons |
| **Theme System** | `next-themes` (Dark/Light persistent state) |
| **Backend API** | Next.js Route Handlers, Custom JWT (jose/jsonwebtoken) with refresh token rotation |
| **Database** | SQLite (dev) / PostgreSQL (prod), Prisma ORM |
| **Market Data** | FastAPI (Python) microservice with Yahoo Finance |
| **AI/ML** | LangChain / LlamaIndex for AI-powered insights |
| **Email** | Nodemailer with Gmail SMTP for OTP delivery |
| **Monorepo** | Turborepo |

---

## 📂 Project Structure

```text
my-portfolio/
├── apps/
│   └── web/                     # Next.js frontend + API backend
│       ├── src/app/
│       │   ├── api/             # API routes (auth, holdings, portfolios, market proxy, user)
│       │   ├── dashboard/       # Dashboard & Portfolio pages
│       │   ├── admin/           # Admin panel pages
│       │   ├── login/           # Auth pages
│       │   ├── register/
│       │   ├── verify-otp/      # OTP verification page
│       │   └── forgot-password/
│       ├── src/components/      # Reusable UI components
│       │   └── landing/         # Dedicated landing page UI components
│       ├── src/hooks/           # Custom React hooks (useInView, etc)
│       └── src/lib/             # Auth, Prisma, mailer, API client utilities
├── packages/
│   ├── db/                      # Prisma schema, migrations, and seed
│   └── ui/                      # Shared UI components
├── services/
│   └── market-data/             # FastAPI microservice for market data & AI insights
│       ├── main.py
│       ├── routers/             # API routes (historical, technicals, AI insight)
│       └── requirements.txt
└── turbo.json
```

---

## ⚙️ Local Development Setup

### Prerequisites
- **Node.js** v18+
- **npm**
- **Python** 3.10+ (for market data service)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd my-portfolio
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Database (path relative to packages/db/prisma/)
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET="generate-a-super-secure-64-character-string-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Create `apps/web/.env.local` for runtime configuration:

```env
# SMTP (Gmail) — for OTP emails
MAILER_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Auth
JWT_SECRET="same-secret-as-root-env"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Market data proxy (server-side)
MARKET_DATA_API_URL="http://localhost:8000"
```

### 3. Database Setup

```bash
cd packages/db
npx prisma db push
npx prisma generate
cd ../..
```

### 4. Start the Next.js Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 5. Start the Market Data Service

```bash
cd services/market-data
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This enables live stock prices, technical analysis, and AI insights.

### 6. (Optional) Expose via ngrok

To access the app from another device:

```bash
ngrok http 3000
```

> **Note:** Market data is proxied through Next.js (`/api/market/*` → `localhost:8000`), so only port 3000 needs to be exposed.

---

## 🔑 Key Architecture Decisions

### Market Data Proxy
All market data requests are routed through a Next.js server-side proxy (`/api/market/[...path]`), which forwards to the FastAPI service on `localhost:8000`. This ensures:
- **Consistent behavior** on localhost and remote access (ngrok)
- **No CORS issues** — browser only talks to the Next.js server
- **Single tunnel** — only port 3000 needs to be exposed

### Portfolio Data Flow
```
User adds security → POST /api/holdings → Prisma → SQLite
Dashboard loads    → GET /api/portfolios → holdings from DB → live prices via proxy
User deletes       → DELETE /api/holdings?id=... → removed from DB permanently
```

### Authentication Flow
```
Register → OTP sent via email → Verify OTP → Account activated
Login    → Email + Password → JWT access + refresh tokens (HttpOnly cookies)
Password Reset → OTP sent via email → Verify OTP → New password set
```

---

## 🛡️ Security

- **JWT Cookies** — Access and refresh tokens in `HttpOnly`, `Secure`, `SameSite=lax` cookies
- **Passwords** — Hashed with `bcryptjs`
- **Rate Limiting** — Protects `/login`, `/register`, and `/forgot-password`
- **OTP Protection** — 6-digit codes, 10-minute expiry, max 5 attempts
- **Audit Trails** — All critical actions logged with IP and User-Agent
- **Admin Security** — Destructive actions require password re-authentication

---

## 🌗 Theme System
The application ships with a fully persistent Dark/Light mode engine.
- **Default:** Dark mode out of the gate for all users to prevent flashing.
- **Unauthenticated Visitors:** Preferences are synced to standard browser `localStorage` locally cleanly across routing.
- **Authenticated Users:** Their theme choice saves to the database. They can log into a new device and immediately land on their stored theme! Toggle is accessible from the top Navbar / Header. 

---

## 📋 Stock Ticker Format

When adding securities to your portfolio, use the correct Yahoo Finance ticker format:

| Exchange | Suffix | Example |
|---|---|---|
| NSE | `.NS` | `RELIANCE.NS`, `TCS.NS`, `INFY.NS` |
| BSE | `.BO` | `RELIANCE.BO`, `TCS.BO` |

---

## 📜 License

[MIT License](LICENSE)
