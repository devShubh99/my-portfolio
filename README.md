# Indian Stock Market Portfolio Tracker

A comprehensive, AI-powered portfolio tracking application built specifically for the Indian stock market (NSE/BSE). This platform allows users to manage their investments, track performance in real-time, get AI-driven insights, and features a robust Role-Based Access Control (RBAC) admin system.

## 🚀 Features

### For Users
- **Dashboard & Analytics:** Real-time visibility into portfolio value, daily P&L, and asset allocation.
- **Transaction Management:** Add, edit, and categorize buy/sell orders.
- **AI Insights:** Automated portfolio analysis, risk assessment, and market correlation insights (powered by Gemini/OpenAI).
- **Technical Analysis:** Stock charts, moving averages, and key indicators.
- **Secure Authentication:** JWT-based login with password hashing, rate-limiting, and account lockouts to prevent brute-force attacks.
- **Personalized Experience:** Light/Dark mode toggle with persistent preferences.

### For Administrators (RBAC)
- **Strict Role-Based Routing:** Secure separation between `USER`, `MODERATOR`, and `ADMIN` areas.
- **Comprehensive Admin Panel:**
  1. **Dashboard:** High-level metrics, role distribution, and 7-day sign-up/login trends.
  2. **User Management:** View, search, and filter users. Perform actions like manual password resets, role changes, and account suspensions.
  3. **Bulk Actions:** Select multiple users to activate, suspend, change roles, or delete.
  4. **Emergency Controls:** Instantly lock accounts (revokes all sessions) or force-logout specific users.
  5. **Data Export:** Download user reports as CSV files.
  6. **Audit Logs:** Track all critical system actions (logins, password changes, admin actions) with detailed metadata.
  7. **Permission Matrix:** Clear visibility into exactly what each role is permitted to do.
- **High-Security Operations:** Destructive actions (like deleting users or changing roles) require the admin to re-authenticate with their password.

## 🛠️ Tech Stack

### Frontend (User & Admin)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI (shadcn/ui components)
- **Icons:** Lucide React

### Backend (API Routes)
- **Framework:** Next.js Route Handlers
- **Auth:** Custom JWT implementation (jose/jsonwebtoken) with refresh token rotation
- **Database:** SQLite (local development) / PostgreSQL (production)
- **ORM:** Prisma

### AI & Data Services (Microservice)
- **Framework:** FastAPI (Python)
- **LLM Integration:** LangChain / LlamaIndex

## 📂 Project Structure

This project uses a Turborepo monorepo structure:

```text
my-portfolio/
├── apps/
│   └── web/                 # Next.js frontend and main API backend
│       ├── src/app/         # Next.js App Router pages (user & admin)
│       ├── src/components/  # Reusable UI components
│       └── src/lib/         # Auth, Prisma, and utility functions
├── packages/
│   ├── db/                  # Prisma schema and migrations
│   └── ui/                  # Shared UI components (if applicable)
├── services/
│   └── market-data/         # FastAPI microservice for AI/market data
└── ...
```

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm
- Python 3.10+ (for the market data service)

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd my-portfolio
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in `apps/web/.env` and `packages/db/.env` (or link them) based on `.env.example`.

Key variables required for Next.js (`apps/web/.env`):
```env
# Database
DATABASE_URL="file:./dev.db"  # Path relative to packages/db/prisma

# Auth Secrets
JWT_SECRET="generate-a-super-secure-64-character-string-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Database Setup (Prisma)
Navigate to the DB package and run migrations:
```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 6. Run the Next.js Development Server
```bash
# Start the web app (runs on localhost:3000)
npm run dev --workspace=apps/web
```

### 7. Run the Python Microservice (Optional, for AI features)
```bash
cd services/market-data
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 🛡️ Security Configuration overview

- **JWT Cookies:** Access and Refresh tokens are stored in `HttpOnly`, `Secure`, `SameSite=lax` cookies.
- **Passwords:** Hashed using `bcryptjs`.
- **Rate Limiting:** Protects `/login`, `/register`, and `/forgot-password` endpoints.
- **Audit Trails:** Critical actions are logged to the `AuditLog` table with IP and User-Agent tracking.
- **Admin Security:** Sensitive API routes utilize a centralized `requireAdmin` helper that maps specific HTTP methods to granular permissions (e.g., `PERMISSIONS.manage_roles`).

## 📜 License

[MIT License](LICENSE)
