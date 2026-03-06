# 🛠️ SETUP.md — Developer Setup Guide

Complete guide to get StockFolio running on your local machine.

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| **Node.js** | v18+ | `node -v` |
| **npm** | v9+ (bundled with Node) | `npm -v` |
| **Python** | 3.10+ (for market data service) | `python --version` |
| **Git** | Any recent version | `git --version` |

---

## 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd my-portfolio
npm install
```

This installs dependencies for all workspaces (`apps/web`, `packages/db`) via npm workspaces.

---

## 2. Environment Configuration

StockFolio needs environment variables in **three** locations:

### 2a. Root `.env`

```bash
cp .env.example .env
```

Edit `.env` with at minimum:

```env
# Database — PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/stock_portfolio?schema=public"

# Auth — generate a random 64+ character secret
JWT_SECRET="your-super-secret-key-at-least-64-characters-long-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2b. `apps/web/.env.local` (Next.js runtime)

Create `apps/web/.env.local`:

```env
# Auth (must match root .env)
JWT_SECRET="same-secret-as-root-env"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Market data proxy target (server-side only)
MARKET_DATA_API_URL="http://localhost:8000"

# Email — use "console" for dev (prints OTP to terminal) or "smtp" for real emails
MAILER_PROVIDER="console"

# Uncomment for real SMTP (Gmail):
# MAILER_PROVIDER="smtp"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
# SMTP_FROM="your-email@gmail.com"
```

### 2c. `services/market-data/.env` (FastAPI)

```bash
cp services/market-data/.env.example services/market-data/.env
```

Edit `services/market-data/.env`:

```env
# Required — sign up at https://twelvedata.com for a free API key
TWELVE_DATA_API_KEY="your-twelve-data-api-key"

# Optional — for AI insights (Google Gemini). Without this, rule-based analysis is used.
GOOGLE_API_KEY="your-google-api-key"
```

---

## 3. Database Setup

StockFolio uses **Prisma ORM** with **PostgreSQL**. For production, use [Neon](https://neon.tech) (free tier) — see **[DEPLOYMENT.md](DEPLOYMENT.md)** for full instructions.

```bash
cd packages/db

# Run migrations against your PostgreSQL database
npx prisma migrate dev --name init

# Generate the Prisma client
npx prisma generate

# Return to project root
cd ../..
```

### Optional: Seed the database

```bash
cd packages/db
npx prisma db seed
cd ../..
```

This creates a default admin user. Check `packages/db/prisma/seed.ts` for credentials.

### Optional: Browse the database

```bash
cd packages/db
npx prisma studio
```

Opens a web UI at `http://localhost:5555` to inspect all tables.

---

## 4. Start the Next.js Dev Server

```bash
npm run dev
```

The app is now available at **http://localhost:3000**.

- Landing page: `/`
- Login: `/login`
- Register: `/register`
- Dashboard: `/dashboard` (requires auth)
- Admin: `/admin` (requires ADMIN role)

---

## 5. Start the FastAPI Market Data Service

Open a **separate terminal**:

```bash
cd services/market-data

# Create a Python virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The FastAPI service is now at **http://localhost:8000**. You can verify:
- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs` (Swagger UI)

> **Note:** The Next.js app proxies all requests from `/api/market/*` to this service. The browser never talks to port 8000 directly.

---

## 6. Optional: Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run tests (starts the dev server automatically)
npm run test:e2e
```

Tests are in `tests/e2e/` and run against Chromium, Firefox, and WebKit.

---

## 7. Optional: Expose via ngrok

To access the app from another device or share a demo link:

```bash
ngrok http 3000
```

Only port 3000 needs to be exposed — market data is proxied through Next.js.

---

## 8. Production Build

```bash
npm run build
```

This runs `next build` in the `apps/web` workspace. The output is in `apps/web/.next/`.

To start the production server:

```bash
cd apps/web
npx next start
```

---

## 🧩 Common Issues & Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `PrismaClientInitializationError` | Missing or invalid `DATABASE_URL` | Ensure `.env` has a valid PostgreSQL connection string |
| OTP not arriving (SMTP) | Invalid Gmail credentials | Use a Gmail **App Password** (not your login password). Enable 2FA first. |
| OTP not visible (Console mode) | `MAILER_PROVIDER` is `console` | Check your Next.js terminal output — OTP is printed to stdout. |
| Market data returns 502 | FastAPI service not running | Start the Python service: `uvicorn main:app --reload --port 8000` |
| Market data returns 504 | FastAPI timeout (slow external API) | Retry, or check your `TWELVE_DATA_API_KEY` — free tier has rate limits. |
| `JWT_SECRET` errors | Mismatched secrets between `.env` files | Ensure `JWT_SECRET` is identical in root `.env` and `apps/web/.env.local`. |
| Prisma schema drift | Changed `schema.prisma` without migrating | Run `cd packages/db && npx prisma migrate dev --name <change> && npx prisma generate` |
| `Module not found: @repo/db` | Missing Prisma generate step | Run `cd packages/db && npx prisma generate` |
| Admin panel returns 403 | User has `USER` role | Promote via Prisma Studio or seed script. Only `ADMIN` / `MODERATOR` roles can access. |
| Avatar upload fails | Missing `./uploads` directory | Create `uploads/` in `apps/web/` or set `STORAGE_LOCAL_PATH` in `.env`. |
| Python `ModuleNotFoundError` | Virtual env not activated or deps missing | Activate venv and re-run `pip install -r requirements.txt`. |

---

## 📚 Related Documentation

- **[README.md](README.md)** — Project overview and architecture
- **[docs/API.md](docs/API.md)** — Complete API reference
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deploy to Vercel + Neon + Render (free)
