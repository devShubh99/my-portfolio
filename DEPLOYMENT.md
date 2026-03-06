# 🚀 DEPLOYMENT.md — Deploy StockFolio for Free

Deploy StockFolio to the public internet using free-tier services.

| Service | Provider | What It Hosts |
|---|---|---|
| **Frontend + API** | [Vercel](https://vercel.com) | Next.js app (serverless) |
| **Database** | [Neon](https://neon.tech) | PostgreSQL (0.5 GB free) |
| **Market Data** | [Render](https://render.com) | FastAPI Python service |

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30–60 seconds (cold start). This is normal for a portfolio project.

---

## Prerequisites

- A GitHub account (all three services support GitHub login)
- Your repo pushed to GitHub

---

## Step 1: Create a Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Click **"New Project"**
3. Name it `stockfolio` (or anything)
4. Select the region closest to you
5. Click **Create Project**
6. Copy the **connection string** — it looks like:
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. **Save this string** — you'll need it for both the migration and Vercel.

---

## Step 2: Run the PostgreSQL Baseline Migration

The project previously used SQLite with its own migration history. You must delete the old migrations and create a fresh PostgreSQL baseline.

> ⚠️ **Before deleting:** Commit or back up your current `packages/db/prisma/migrations/` folder first. If you ever need to revert to local SQLite development, you'll need those migration files.

**From your local machine:**

```bash
# 1. Back up, then delete old SQLite migrations
cd packages/db/prisma
rm -rf migrations/

# 2. Set DATABASE_URL to your Neon connection string
#    (Windows PowerShell)
$env:DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

#    (macOS/Linux)
export DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 3. Create the baseline migration (run from packages/db)
cd ..
npx prisma migrate dev --name init

# 4. Generate the Prisma client
npx prisma generate

# 5. Seed the admin user (creates default admin account)
npx prisma db seed
```

This creates all 9 tables in your Neon database, generates the Prisma client, and creates the default admin user.

> **Default admin account:** Check `packages/db/prisma/seed.ts` for the default admin credentials. **Change the password immediately after first login** — the admin is forced to change it on first login (`mustChangePassword: true`).

> ⚠️ **Important:** Always run Prisma commands from inside `packages/db`, never from the monorepo root.

---

## Step 3: Deploy the FastAPI Service to Render

Deploy the market data service **first**, because you need its URL for Vercel.

1. Go to [render.com](https://render.com) and sign up (free)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `stockfolio-market-data` |
| **Root Directory** | `services/market-data` |
| **Runtime** | Python |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

5. Add environment variables under **"Environment"**:

| Variable | Value |
|---|---|
| `TWELVE_DATA_API_KEY` | Your Twelve Data API key ([sign up free](https://twelvedata.com)) |
| `GOOGLE_API_KEY` | Your Google Gemini API key (optional — omit for rule-based analysis) |

6. Click **"Create Web Service"**
7. Wait for the build to complete
8. **Copy your Render URL** — it looks like: `https://stockfolio-market-data.onrender.com`
9. Verify it's live: visit `https://stockfolio-market-data.onrender.com/health`
   - You should see: `{"status": "ok", "service": "market-data"}`
   - This route is defined in `services/market-data/main.py` (`GET /health`)

---

## Step 4: Deploy the Next.js App to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **"Add New" → "Project"**
3. Import your GitHub repo
4. Configure the project:

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js (auto-detected) |

> Vercel will read `apps/web/vercel.json` which contains the custom build configuration:
> ```json
> {
>     "buildCommand": "cd ../packages/db && npx prisma generate && cd ../apps/web && npm run build",
>     "installCommand": "cd ../.. && npm install",
>     "framework": "nextjs"
> }
> ```
> This ensures `prisma generate` runs before `next build`, and `npm install` runs from the monorepo root so workspace dependencies resolve correctly.

5. Add **all** environment variables under **"Environment Variables"**:

### Required Variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string from Step 1 |
| `JWT_SECRET` | A random 64+ character secret (generate with `openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_URL` | Set to `http://localhost:3000` for now — update to your real Vercel URL in Step 6 after the first deploy |
| `MARKET_DATA_API_URL` | Your Render URL from Step 3 (e.g. `https://stockfolio-market-data.onrender.com`) |

### Email (choose one)

**Option A — Console mode (OTPs printed to Vercel function logs):**
| Variable | Value |
|---|---|
| `MAILER_PROVIDER` | `console` |

**Option B — Real email via Gmail SMTP:**
| Variable | Value |
|---|---|
| `MAILER_PROVIDER` | `smtp` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | Your Gmail App Password ([how to create](https://support.google.com/accounts/answer/185833)) |
| `SMTP_FROM` | `your-email@gmail.com` |

### Optional Variables

| Variable | Value | Default if omitted |
|---|---|---|
| `JWT_ACCESS_EXPIRY` | `15m` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` | `7d` |
| `RATE_LIMIT_WINDOW_MS` | `900000` | `900000` (15 min) |
| `RATE_LIMIT_MAX_ATTEMPTS` | `5` | `5` |
| `ACCOUNT_LOCKOUT_MINUTES` | `15` | `15` |

> ⚠️ **Avatar uploads:** Vercel's filesystem is **read-only** — the default `STORAGE_PROVIDER=local` will not work for avatar uploads. Either leave avatar uploads disabled, or configure an S3-compatible storage provider (e.g. [Cloudflare R2](https://developers.cloudflare.com/r2/) has a generous free tier). Do **not** set `STORAGE_PROVIDER=local` on Vercel.

6. Click **"Deploy"**
7. Wait for the build to complete

---

## Step 5: Post-Deployment Verification

1. Visit your Vercel URL → landing page should load
2. Register a new account → OTP should arrive (or check Vercel function logs if using `console` mailer)
3. Log in → dashboard should load
4. Navigate to `/dashboard/market` → market data should load (first request may be slow due to Render cold start)
5. Add a security to your portfolio → verify it saves

---

## Step 6: Update `NEXT_PUBLIC_APP_URL`

After your first deploy, Vercel assigns a production URL. Go to **Vercel → Project → Settings → Environment Variables** and update:

```
NEXT_PUBLIC_APP_URL=https://your-actual-app-name.vercel.app
```

Redeploy for the change to take effect.

---

## Full Environment Variable Checklist

### Vercel (Next.js)

| Variable | Required | Source |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon dashboard |
| `JWT_SECRET` | ✅ | Generate randomly |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your Vercel URL |
| `MARKET_DATA_API_URL` | ✅ | Your Render URL |
| `MAILER_PROVIDER` | ✅ | `console` or `smtp` |
| `SMTP_HOST` | If SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | If SMTP | `587` |
| `SMTP_USER` | If SMTP | Your Gmail address |
| `SMTP_PASS` | If SMTP | Gmail App Password |
| `SMTP_FROM` | If SMTP | Your Gmail address |
| `JWT_ACCESS_EXPIRY` | ❌ | Defaults to `15m` |
| `JWT_REFRESH_EXPIRY` | ❌ | Defaults to `7d` |
| `RATE_LIMIT_WINDOW_MS` | ❌ | Defaults to `900000` |
| `RATE_LIMIT_MAX_ATTEMPTS` | ❌ | Defaults to `5` |
| `ACCOUNT_LOCKOUT_MINUTES` | ❌ | Defaults to `15` |
| `STORAGE_PROVIDER` | ⚠️ | `local` won't work on Vercel (read-only FS). Use `s3` or omit avatar uploads. |

### Render (FastAPI)

| Variable | Required | Source |
|---|---|---|
| `TWELVE_DATA_API_KEY` | ✅ | [twelvedata.com](https://twelvedata.com) |
| `GOOGLE_API_KEY` | ❌ | [Google AI Studio](https://aistudio.google.com) |

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Build fails with `prisma generate` error | Prisma client not generated | The `vercel.json` build command handles this. Check Vercel build logs. |
| `JWT_SECRET environment variable is required` | Missing env var on Vercel | Add `JWT_SECRET` in Vercel → Settings → Environment Variables |
| Market data returns 502 | Render service is cold/offline | Wait 30–60 seconds for the cold start, then retry |
| `PrismaClientInitializationError` | Missing or invalid `DATABASE_URL` | Verify the Neon connection string is correct and includes `?sslmode=require` |
| OTP not arriving | SMTP misconfigured | Check Vercel function logs. If using `console` mode, OTP is printed there. |
| `MARKET_DATA_API_URL` pointing to localhost | Env var not updated | Set it to your Render URL: `https://your-service.onrender.com` |
