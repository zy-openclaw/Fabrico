# BUILD_SUMMARY.md

## Feature ID: F5-4

## What was built

Added API Gateway proxy routes for `/v1/admin/*` to the admin service backend, along with config updates and endpoint improvements to support multiple ban/unban cycles.

### Changes included:

1. **API Gateway Admin Routes** (`services/api-gateway/src/routes/admin.ts` - NEW)
   - Created `createAdminRoutes()` function returning an Express Router that proxies requests to the admin service using Node.js built-in `http`/`https` modules
   - Proxy routes:
     - `GET /users` → `GET /admin/users` (list users)
     - `GET /disputes` → `GET /admin/disputes` (list disputes)
     - `POST /users/:id/ban` → `POST /admin/users/:userId/ban` (ban user)
     - `POST /sellers/:id/approve` → `POST /admin/sellers/:sellerId/approve` (approve seller)
     - `POST /sellers/:id/verify` → `POST /admin/sellers/:sellerId/verify` (verify seller)
     - `POST /disputes/:orderId/refund` → `POST /admin/disputes/:orderId/refund` (issue refund)
     - `GET /stats` → `GET /admin/stats` (platform statistics)
     - `GET /health` → `GET /admin/health` (admin health check)
   - Forwards request body (for POST) and query params
   - Returns 502 with JSON error on connection failure
   - Returns 504 on timeout

2. **Config Update** (`services/api-gateway/src/config/index.ts` - MODIFIED)
   - Added `admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006'` to services config

3. **Gateway Mounting** (`services/api-gateway/src/index.ts` - MODIFIED)
   - Imported `createAdminRoutes` and mounted at `/v1/admin`

4. **Admin Service Enhancement** (`services/admin-service/src/index.ts` - MODIFIED)
   - Added `GET /admin/health` endpoint for gateway health proxy
   - Added `POST /admin/users/:userId/unban` endpoint for unban/un-suspend support
   - Ban endpoint returns 409 if user already has an active ban

5. **Prisma Schema Fix** (`prisma/schema.prisma` - MODIFIED)
   - Changed `UserBan.userId` from `@unique` to `@@unique([userId, active])` to support multiple ban/unban cycles

## Files created/modified

| File | Action |
|------|--------|
| `services/api-gateway/src/routes/admin.ts` | **Created** - Proxy routes for admin service |
| `services/api-gateway/src/config/index.ts` | Modified - Added admin service URL |
| `services/api-gateway/src/index.ts` | Modified - Mounted admin routes at `/v1/admin` |
| `services/admin-service/src/index.ts` | Modified - Added `/admin/health` and `/admin/users/:userId/unban` |
| `prisma/schema.prisma` | Modified - Changed to composite unique constraint for multi-ban support |

## Key decisions

- Used Node.js built-in `http`/`https` modules for proxying instead of `http-proxy-middleware` to avoid extra dependencies and maintain compatibility with Express 5
- Used in-memory storage in admin service for simplicity (no database setup required)
- Prisma schema uses `@@unique([userId, active])` to allow one active ban per user while supporting multiple historical ban records
- Ban endpoint returns HTTP 409 Conflict when attempting to ban an already-banned user

## PR URL

https://github.com/zy-openclaw/Fabrico/pull/1
