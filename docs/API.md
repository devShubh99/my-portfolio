# 📡 API Reference — StockFolio

Complete reference for all API endpoints in the StockFolio application.

**Base URL (Next.js):** `http://localhost:3000`  
**Base URL (FastAPI):** Configured via `MARKET_DATA_API_URL` (default `http://localhost:8000` for local dev, set to your Render URL in production). Proxied via `/api/market/*`.

---

## Table of Contents

- [Authentication](#authentication)
- [User Self-Service](#user-self-service)
- [Portfolios](#portfolios)
- [Holdings](#holdings)
- [Transactions](#transactions)
- [Admin — Dashboard](#admin--dashboard)
- [Admin — User Management](#admin--user-management)
- [Admin — Bulk Actions](#admin--bulk-actions)
- [Admin — Permissions](#admin--permissions)
- [Market Data Proxy](#market-data-proxy)
- [FastAPI — Quotes](#fastapi--quotes)
- [FastAPI — Historical Data](#fastapi--historical-data)
- [FastAPI — Technical Analysis](#fastapi--technical-analysis)
- [FastAPI — AI Insights](#fastapi--ai-insights)
- [FastAPI — Market Movers](#fastapi--market-movers)

---

## Authentication

All auth routes are publicly accessible. Rate-limited by IP.

### `POST /api/auth/register`

Register a new user account. Sends an OTP to verify email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```

**Response (201):**
```json
{
  "requiresOtp": true,
  "email": "john@example.com",
  "message": "Account created. Please verify your email with the OTP sent."
}
```

**Response (200 — unverified user re-registers):**
```json
{
  "requiresOtp": true,
  "email": "john@example.com",
  "message": "Account exists but is unverified. A new OTP has been sent."
}
```

| Status | Description |
|---|---|
| `201` | Account created, OTP sent |
| `200` | Existing unverified account, OTP re-sent |
| `400` | Missing fields or weak password |
| `409` | Email already registered (verified) |
| `429` | Rate limit exceeded |

---

### `POST /api/auth/login`

Authenticate with email and password. Sets `access_token` and `refresh_token` as HttpOnly cookies.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "mustChangePassword": false,
    "theme": "dark"
  },
  "accessToken": "eyJhb..."
}
```

| Status | Description |
|---|---|
| `200` | Successful login |
| `400` | Missing email or password |
| `401` | Invalid credentials |
| `403` | Account suspended or deactivated |
| `423` | Account locked (too many failed attempts) |
| `429` | Rate limit exceeded |

---

### `POST /api/auth/logout`

Revokes the refresh token and clears auth cookies.

**Request Body:** None (uses cookies)

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

### `POST /api/auth/refresh`

Rotates the refresh token and issues a new access token.

**Request Body:** None (uses `refresh_token` cookie)

**Response (200):**
```json
{ "accessToken": "eyJhb..." }
```

| Status | Description |
|---|---|
| `200` | New tokens issued |
| `401` | Missing or invalid refresh token |

---

### `POST /api/auth/send-otp`

Send or re-send an OTP code via email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"
}
```

`type` must be `"EMAIL_VERIFICATION"` or `"PASSWORD_RESET"`.

**Response (200):**
```json
{ "message": "OTP sent successfully. Check your email." }
```

| Status | Description |
|---|---|
| `200` | OTP sent (or silent success for password reset) |
| `400` | Missing fields, invalid type, or already verified |
| `404` | No account found (EMAIL_VERIFICATION only) |
| `429` | Rate limit exceeded |

---

### `POST /api/auth/verify-otp`

Verify a 6-digit OTP code. On success:
- **EMAIL_VERIFICATION** → marks email verified, issues auth tokens.
- **PASSWORD_RESET** → returns a short-lived reset token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "type": "EMAIL_VERIFICATION"
}
```

**Response — EMAIL_VERIFICATION (200):**
```json
{
  "verified": true,
  "type": "EMAIL_VERIFICATION",
  "user": {
    "id": "clx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "accessToken": "eyJhb..."
}
```

**Response — PASSWORD_RESET (200):**
```json
{
  "verified": true,
  "type": "PASSWORD_RESET",
  "resetToken": "uuid-v4-token"
}
```

| Status | Description |
|---|---|
| `200` | OTP verified |
| `400` | Invalid/expired OTP, too many attempts, or missing fields |

---

### `POST /api/auth/forgot-password`

Initiate password reset. Sends OTP if account exists (always returns success to prevent email enumeration).

**Request Body:**
```json
{ "email": "john@example.com" }
```

**Response (200):**
```json
{
  "requiresOtp": true,
  "email": "john@example.com",
  "message": "If an account with that email exists, an OTP has been sent."
}
```

---

### `POST /api/auth/reset-password`

Set a new password using a reset token (obtained after OTP verification).

**Request Body:**
```json
{
  "token": "uuid-v4-reset-token",
  "password": "NewSecurePass1!"
}
```

**Response (200):**
```json
{ "message": "Password has been reset successfully. Please log in." }
```

| Status | Description |
|---|---|
| `200` | Password reset, all sessions revoked |
| `400` | Missing fields, weak password, or invalid/expired token |

---

## User Self-Service

All routes require a valid `access_token` cookie.

### `GET /api/user/profile`

Returns the current user's profile.

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "status": "ACTIVE",
    "avatarUrl": "/uploads/avatars/uuid.jpg",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-02-01T00:00:00.000Z",
    "mustChangePassword": false
  }
}
```

---

### `PATCH /api/user/profile`

Update the current user's name or email.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "role": "USER",
    "avatarUrl": null
  }
}
```

| Status | Description |
|---|---|
| `200` | Profile updated |
| `401` | Unauthorized |
| `409` | Email already in use by another account |

---

### `PATCH /api/user/preferences`

Update the user's theme preference (persisted to database).

**Request Body:**
```json
{ "theme": "light" }
```

`theme` must be `"dark"` or `"light"`.

**Response (200):**
```json
{ "success": true, "theme": "light" }
```

---

### `POST /api/user/avatar`

Upload a new profile avatar. Replaces existing avatar.

**Request:** `multipart/form-data` with field `avatar`.

**Headers:** `Content-Type: multipart/form-data`

**Constraints:**
- Allowed types: JPEG, PNG, WebP, GIF
- Max size: 5 MB

**Response (200):**
```json
{ "avatarUrl": "/uploads/avatars/uuid.jpg" }
```

| Status | Description |
|---|---|
| `200` | Avatar uploaded |
| `400` | No file, invalid type, or too large |

---

### `POST /api/user/change-password`

Change the current user's password. Revokes all sessions.

**Request Body:**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

**Response (200):**
```json
{ "message": "Password changed. Please log in again." }
```

| Status | Description |
|---|---|
| `200` | Password changed, all sessions revoked |
| `400` | Missing fields or weak new password |
| `401` | Current password incorrect |

---

### `DELETE /api/user/delete-account`

Permanently delete the user's own account. Cascades to all related data.

**Request Body:**
```json
{
  "password": "CurrentPass1!",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response (200):**
```json
{ "message": "Account has been permanently deleted" }
```

| Status | Description |
|---|---|
| `200` | Account deleted |
| `400` | Missing confirmation text |
| `401` | Incorrect password |

---

## Portfolios

### `GET /api/portfolios`

List all portfolios. Optionally filter by user.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `userId` | string | Filter by user ID (optional) |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "userId": "clx...",
    "name": "My Portfolio",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "holdings": [
      {
        "id": "clx...",
        "tickerSymbol": "AAPL",
        "averageBuyPrice": 150.00,
        "totalQuantity": 10,
        "transactions": [...]
      }
    ]
  }
]
```

---

### `POST /api/portfolios`

Create a new portfolio.

**Request Body:**
```json
{
  "userId": "clx...",
  "name": "Growth Stocks"
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "userId": "clx...",
  "name": "Growth Stocks",
  "holdings": []
}
```

---

## Holdings

### `GET /api/holdings`

List holdings. Optionally filter by portfolio.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `portfolioId` | string | Filter by portfolio ID (optional) |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "portfolioId": "clx...",
    "tickerSymbol": "RELIANCE.NS",
    "averageBuyPrice": 2500.00,
    "totalQuantity": 5,
    "transactions": [...]
  }
]
```

---

### `POST /api/holdings`

Add a new holding to a portfolio.

**Request Body:**
```json
{
  "portfolioId": "clx...",
  "tickerSymbol": "TCS.NS",
  "averageBuyPrice": 3500,
  "totalQuantity": 10
}
```

**Response (201):** The created holding object with `transactions: []`.

---

### `DELETE /api/holdings`

Delete a holding and all its transactions.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `id` | string | **Required.** Holding ID to delete |

**Response (200):**
```json
{ "success": true }
```

---

## Transactions

### `GET /api/transactions`

List transactions. Optionally filter by holding.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `holdingId` | string | Filter by holding ID (optional) |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "holdingId": "clx...",
    "type": "BUY",
    "price": 150.00,
    "quantity": 10,
    "date": "2025-01-15T00:00:00.000Z"
  }
]
```

---

### `POST /api/transactions`

Record a new BUY or SELL transaction. Automatically recalculates the parent holding's `averageBuyPrice` and `totalQuantity`.

**Request Body:**
```json
{
  "holdingId": "clx...",
  "type": "BUY",
  "price": 155.50,
  "quantity": 5,
  "date": "2025-02-01"
}
```

`type` must be `"BUY"` or `"SELL"`. `date` is optional (defaults to now).

**Response (201):** The created transaction object.

---

## Admin — Dashboard

Requires `ADMIN` or `MODERATOR` role.

### `GET /api/admin/dashboard`

Returns dashboard stats: user counts, role distribution, and 7-day trends.

**Response (200):**
```json
{
  "stats": {
    "totalUsers": 150,
    "activeUsers": 140,
    "suspendedUsers": 5,
    "deactivatedUsers": 5,
    "newSignupsToday": 3,
    "newSignups30d": 45,
    "failedLoginsToday": 12,
    "totalAuditLogs": 5000,
    "roleDistribution": {
      "admin": 2,
      "moderator": 3,
      "user": 145
    },
    "signupTrend": [
      { "date": "2025-02-24", "count": 5 },
      { "date": "2025-02-25", "count": 3 }
    ],
    "failedLoginTrend": [
      { "date": "2025-02-24", "count": 2 },
      { "date": "2025-02-25", "count": 1 }
    ]
  }
}
```

---

## Admin — User Management

All routes require `ADMIN` or `MODERATOR` role with appropriate permissions.

### `GET /api/admin/users`

List users with search, filter, pagination, and sorting.

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `search` | string | | Search in email and name |
| `status` | string | | Filter: `ACTIVE`, `SUSPENDED`, `DEACTIVATED` |
| `role` | string | | Filter: `USER`, `MODERATOR`, `ADMIN` |
| `sortBy` | string | `createdAt` | Sort field |
| `order` | string | `desc` | `asc` or `desc` |
| `signedUpAfter` | ISO date | | Filter users created after this date |
| `signedUpBefore` | ISO date | | Filter users created before this date |

**Response (200):**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### `PATCH /api/admin/users/:id`

Update a user's role or status. Role changes require `manage_roles` permission; destructive ops accept optional re-authentication.

**Request Body:**
```json
{
  "role": "MODERATOR",
  "status": "ACTIVE",
  "unlock": true,
  "adminPassword": "admin-password"
}
```

All fields are optional. `adminPassword` is used for re-authentication on role changes.

| Status | Description |
|---|---|
| `200` | User updated |
| `400` | Self-demotion or invalid values |
| `401` | Invalid admin password |

---

### `DELETE /api/admin/users/:id`

Permanently delete a user. Requires `delete_users` permission.

| Status | Description |
|---|---|
| `200` | User deleted |
| `400` | Cannot delete yourself |
| `404` | User not found |

---

### `POST /api/admin/users/:id/force-logout`

Revoke all refresh tokens for a user, forcing them to log in again.

**Response (200):**
```json
{
  "message": "User john@example.com has been logged out",
  "tokensRevoked": 3
}
```

---

### `POST /api/admin/users/:id/lock`

Instantly lock a user account (sets `lockedUntil` to 100 years, suspends, revokes all tokens).

**Response (200):**
```json
{ "message": "Account john@example.com locked" }
```

---

### `DELETE /api/admin/users/:id/lock`

Unlock a user account (clears lockout, resets failed login count, sets status to ACTIVE).

**Response (200):**
```json
{ "message": "Account john@example.com unlocked" }
```

---

### `GET /api/admin/users/export`

Export users as CSV file. Supports the same `search`, `status`, and `role` filters as the user list.

**Response:** CSV file download.

---

## Admin — Bulk Actions

### `POST /api/admin/users/bulk`

Perform bulk operations on multiple users. Destructive actions (`delete`, `changeRole`) require admin password re-authentication.

**Request Body:**
```json
{
  "action": "suspend",
  "userIds": ["clx...", "clx..."],
  "value": "MODERATOR",
  "adminPassword": "admin-password"
}
```

| `action` | Description | Requires `adminPassword` |
|---|---|---|
| `suspend` | Set status to SUSPENDED | No |
| `activate` | Set status to ACTIVE, clear lockout | No |
| `deactivate` | Set status to DEACTIVATED | No |
| `delete` | Permanently delete users | **Yes** |
| `changeRole` | Set role to `value` | **Yes** |

**Response (200):**
```json
{ "affected": 5, "action": "suspend" }
```

---

## Admin — Permissions

### `GET /api/admin/permissions`

Return the full RBAC permission matrix.

**Response (200):**
```json
{
  "matrix": [
    {
      "role": "ADMIN",
      "permissions": [
        { "key": "manage_users", "granted": true },
        { "key": "manage_roles", "granted": true },
        { "key": "delete_users", "granted": true }
      ]
    },
    {
      "role": "MODERATOR",
      "permissions": [
        { "key": "manage_users", "granted": true },
        { "key": "manage_roles", "granted": false },
        { "key": "delete_users", "granted": false }
      ]
    }
  ]
}
```

---

## Market Data Proxy

### `GET /api/market/[...path]`
### `POST /api/market/[...path]`

Proxies requests to the FastAPI service running at `MARKET_DATA_API_URL` (default `http://localhost:8000` for local dev).

**Mapping:** `/api/market/quote/AAPL` → `{MARKET_DATA_API_URL}/api/quote/AAPL`

All FastAPI endpoints below can be accessed through this proxy by prepending `/api/market/` instead of accessing port 8000 directly.

| Status | Description |
|---|---|
| `200` | Proxied response |
| `502` | FastAPI service unreachable |
| `504` | FastAPI request timed out (60s limit) |

---

## FastAPI — Quotes

### `GET /api/quote/{ticker}`

Fetch a live quote for a single ticker using Twelve Data.

**Example:** `GET /api/market/quote/AAPL`

**Response (200):**
```json
{
  "ticker": "AAPL",
  "price": 178.50,
  "previousClose": 176.20,
  "dayChange": 2.30,
  "dayChangePercent": 1.31,
  "name": "Apple Inc",
  "fiftyTwoWeekHigh": 199.62,
  "fiftyTwoWeekLow": 124.17
}
```

---

### `POST /api/batch-quotes`

Fetch live quotes for multiple tickers in one request. Uses Twelve Data with yfinance fallback for tickers not found (e.g., Indian `.NS`/`.BO` symbols).

**Request Body:**
```json
{
  "tickers": ["AAPL", "MSFT", "RELIANCE.NS"]
}
```

**Response (200):**
```json
{
  "quotes": [
    {
      "ticker": "AAPL",
      "price": 178.50,
      "previousClose": 176.20,
      "dayChange": 2.30,
      "dayChangePercent": 1.31,
      "name": "Apple Inc"
    }
  ]
}
```

---

### `GET /api/search?q={query}`

Search for securities using Yahoo Finance autocomplete. Returns up to 5 results.

**Example:** `GET /api/market/search?q=reliance`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Search query (min 2 characters) |

**Response (200):**
```json
{
  "results": [
    {
      "ticker": "RELIANCE.NS",
      "name": "Reliance Industries Limited",
      "exchange": "NSI",
      "typeDisp": "Equity"
    }
  ]
}
```

---

## FastAPI — Historical Data

### `GET /api/historical/{ticker}`

Fetch OHLCV candlestick data formatted for TradingView Lightweight Charts.

**Example:** `GET /api/market/historical/TCS.NS?period=6mo&interval=1d`

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `period` | string | `6mo` | yfinance period: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max` |
| `interval` | string | `1d` | yfinance interval: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo` |

**Response (200):**
```json
{
  "ticker": "TCS.NS",
  "period": "6mo",
  "interval": "1d",
  "count": 124,
  "data": [
    {
      "time": 1706745600,
      "open": 3850.00,
      "high": 3870.50,
      "low": 3840.25,
      "close": 3865.00,
      "volume": 1234567
    }
  ]
}
```

---

## FastAPI — Technical Analysis

### `GET /api/technicals/{ticker}`

Compute RSI-14, SMA-50, and SMA-200 with chart-ready time series data.

**Example:** `GET /api/market/technicals/INFY.NS`

**Response (200):**
```json
{
  "ticker": "INFY.NS",
  "latestPrice": 1650.00,
  "rsi14": 55.30,
  "sma50": 1620.00,
  "sma200": 1580.00,
  "sma50Series": [
    { "time": 1706745600, "value": 1615.20 }
  ],
  "sma200Series": [
    { "time": 1706745600, "value": 1575.80 }
  ],
  "signal": [
    "Golden Cross (50 SMA > 200 SMA) — Bullish",
    "RSI 55.3 — Neutral"
  ]
}
```

---

## FastAPI — AI Insights

### `GET /api/ai-insight/{ticker}`

Fetch fundamentals + technicals, send to Gemini LLM for sentiment analysis. Falls back to rule-based analysis if no API key is configured.

**Example:** `GET /api/market/ai-insight/RELIANCE.NS`

**Response (200):**
```json
{
  "ticker": "RELIANCE.NS",
  "sentiment": "Bullish",
  "analysis_text": "Reliance Industries is currently trading at ₹2850.00...",
  "fundamentals": {
    "name": "Reliance Industries Limited",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "marketCap": 19300000000000,
    "pe_ratio": 28.5,
    "forward_pe": 25.2,
    "dividend_yield": 0.003,
    "52w_high": 3024.90,
    "52w_low": 2220.30
  },
  "technicals": {
    "latest_price": 2850.00,
    "rsi_14": 58.20,
    "sma_50": 2780.00,
    "sma_200": 2650.00
  }
}
```

---

## FastAPI — Market Movers

### `GET /api/movers`

Fetch top gainers, losers, and most active stocks from Nifty 50 components.

**Example:** `GET /api/market/movers`

**Response (200):**
```json
{
  "gainers": [
    {
      "ticker": "ADANIENT.NS",
      "price": 3200.00,
      "dayChange": 120.50,
      "dayChangePercent": 3.91,
      "name": "ADANIENT"
    }
  ],
  "losers": [...],
  "mostActive": [...]
}
```

Each array contains up to 10 entries, sorted by `dayChangePercent`.

---

## FastAPI — Health Check

### `GET /health`

**Response (200):**
```json
{ "status": "ok", "service": "market-data" }
```

---

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing or invalid auth) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (duplicate resource) |
| `423` | Account locked |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `502` | FastAPI service unreachable |
| `504` | Proxy timeout |
