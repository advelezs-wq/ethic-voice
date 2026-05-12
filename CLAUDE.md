# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

EthicVoice is a SaaS compliance platform ("línea ética") for LATAM companies. Organizations subscribe to create anonymous ethics reporting channels. Employees submit reports via custom forms, an ethics hotline, or email; compliance managers review them in the dashboard; an AI agent (LangChain + OpenAI) analyzes each submission for severity, category, and risk.

## Commands

```bash
# Development (prefer Webpack — Turbopack can fail on paths with spaces)
bun run dev

# Turbopack dev (only use if the volume has no spaces in its path)
bun run dev:turbo

# Demo mode (uses synthetic analytics data instead of real Prisma queries)
bun run dev:demo

# Build
bun run build

# Lint
bun run lint

# Regenerate Prisma client after schema changes
bun run db:generate

# Start local Redis (required for BullMQ queue workers)
docker compose up -d

# Run background workers (separate process, connects to Redis + Upstash)
bun run workers:dev

# Deploy Prisma migrations
bunx prisma migrate deploy

# One-off admin scripts
bunx tsx scripts/<script-name>.ts
```

## Architecture

### Module structure

Code lives in `src/modules/` organized by feature domain. Import via `@/modules/...` (alias `@/*` → `./src/*`).

| Module | Purpose |
|--------|---------|
| `modules/ai/core` | Raw AI processor entry point |
| `modules/app` | Dashboard app — components, services, hooks, context, lib |
| `modules/app/lib/queue` | BullMQ queue manager + Redis config |
| `modules/app/lib/ai` | Compliance AI processor (LangChain + OpenAI) |
| `modules/app/services` | Business logic services (analytics, PDF, email, payments, subscriptions, notifications) |
| `modules/core` | Shared providers, hooks (`usePlanPermissions`, `useUserRole`), middleware, utils |
| `modules/forms/builder` | Drag-and-drop form builder (DnD Kit) |
| `modules/prisma/lib/prisma` | Prisma client singleton |
| `modules/store` | Zustand global stores (organization, user) |
| `modules/submit` | Public report submission multi-step flow |
| `modules/track` | Anonymous report tracking by code |
| `modules/landig-page` | Marketing/landing page components (note: typo in folder name) |

### App Router layout

```
src/app/
  page.tsx              ← Marketing home (public)
  app/                  ← Authenticated dashboard (Clerk + DB required)
    layout.tsx          ← Wraps: FrigadeProvider > SubscriptionProvider > OrganizationProvider > ThemeProvider > SidebarProvider > SubscriptionGuard
    reports/[id]/       ← Individual report detail
    your-forms/         ← Custom form builder
    billing/            ← Subscription management
    superadmin/         ← Superadmin panel (gated by NEXT_PUBLIC_SUPER_ADMIN_EMAILS)
  api/                  ← API routes
    webhooks/           ← Clerk, MercadoPago, Rebill, email providers
    admin/              ← Cron-triggered admin routes (validated via Vercel-cron header or ADMIN_API_KEY)
    ai/                 ← AI processing endpoints
  submit/[formUrl]/     ← Public form submission (unauthenticated)
  track/[code]/         ← Anonymous report tracking (unauthenticated)
  auth/                 ← Clerk sign-in / sign-up pages
  checkout/             ← Subscription checkout (Rebill SDK)
```

### Middleware (`src/proxy.ts`)

The middleware file is `src/proxy.ts` — not the standard `middleware.ts`. It runs Clerk auth, enforces onboarding redirect (new users without an org go to `/app/onboarding`), and applies plan-level restrictions via `modules/core/middleware/plan-restrictions.middleware.ts`.

Admin endpoints (`/api/admin/*`) accept either a valid Clerk session or the `ADMIN_API_KEY` / `x-vercel-cron` header (used by Vercel Cron jobs).

### Auth & user sync

Clerk is the identity provider. On every server-rendered page load, the root layout (`src/app/layout.tsx`) upserts the Clerk user into the Prisma `User` table. This means a Prisma `User` record is required for dashboard access; the middleware enforces this via `/api/users/org-status`.

Superadmins are identified by email addresses listed in `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` (comma-separated).

### Subscription & plan gating

Plans: `STARTER`, `GROW`, `GROW_PRO`, `PREMIUM`. Features like AI processing, email channel, chatbot, and phone channel are toggled as booleans on the `Organization` model. The `SubscriptionGuard` component and `usePlanPermissions` hook enforce plan limits client-side; the middleware enforces them server-side.

Payment gateways: **MercadoPago** (Argentina/LATAM subscriptions) and **Rebill** (subscription management; Rebill SDK loaded via `<Script strategy="beforeInteractive">`). Webhook routes for both live under `src/app/api/webhooks/`.

### Background processing

A separate worker process (`workers/index.ts`) runs BullMQ workers against Redis:
- **Submission worker** – processes queued ethics reports through the AI compliance agent
- **Email worker** – polls email inboxes configured per organization

Local dev Redis via Docker (`docker compose up -d`). Production uses two Redis instances: Upstash REST API (rate limiting / cache via `@upstash/redis`) and a BullMQ-compatible Redis URL (`REDIS_URL` / `UPSTASH_REDIS_URL`).

### Key environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth |
| `OPENAI_API_KEY` | AI compliance analysis |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash rate-limit cache |
| `REDIS_URL` / `UPSTASH_REDIS_URL` | BullMQ queue Redis |
| `PUSHER_*` / `NEXT_PUBLIC_PUSHER_*` | Real-time notifications |
| `RESEND_API_KEY` | Transactional email |
| `CLOUDINARY_*` | File/logo uploads |
| `MERCADOPAGO_ACCESS_TOKEN` + `MP_*_PLAN_ID` | MercadoPago subscriptions |
| `ADMIN_API_KEY` | Secures `/api/admin/*` endpoints |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | Comma-separated superadmin emails |
| `NEXT_PUBLIC_DEMO_MODE` | Enables synthetic analytics data (`dev:demo`) |

### Vercel Cron jobs (vercel.json)

- `0 5 * * *` → `/api/admin/daily-runner` (daily maintenance + SLA alerts)
- `0 6 * * 1` → `/api/digest/weekly` (weekly email digest)

### Key conventions

- **Server Actions** live in `src/actions/` and are imported directly into Server and Client Components.
- **Schemas** (Zod) are colocated inside the relevant module's `lib/schemas/` directory.
- **Prisma migrations** use raw SQL files in `prisma/migrations/` — not auto-generated Prisma migrations; run `prisma migrate deploy` to apply them.
- All dashboard pages are in Spanish (es-MX locale); Clerk is also localized to `esMX`.
- `NEXT_PUBLIC_DEMO_MODE=true` swaps real Prisma queries for synthetic demo data in analytics and dashboard views.
