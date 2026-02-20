# System Architecture

## Overview
This SaaS Starter uses a **Monolithic Modular Architecture** built on the Next.js App Router. It leverages Server Components for data fetching and Server Actions for mutations, eliminating the need for a separate API layer for most internal operations.

## Tech Stack Decisions

### 1. Framework: Next.js 14 (App Router)
- **Why?** React Server Components (RSC) reduce client bundle size and improve initial load performance.
- **Routing:** File-system based routing in `src/app`.
- **Data Fetching:** Direct DB calls in Server Components (no `fetch('/api/...')` needed).

### 2. Database: PostgreSQL + Prisma
- **ORM:** Prisma provides type-safe database access.
- **Connection:** Managed via a singleton instance (`src/lib/db.ts`) to prevent connection exhaustion in serverless environments (Vercel).
- **Migration:** `prisma migrate` (Postgres) or `db push` (SQLite/Proto).

### 3. Authentication: NextAuth v5 (Auth.js)
- **Session Strategy:** JWT-based stateless sessions.
- **Adapter:** `@auth/prisma-adapter` persists users and sessions in Postgres.
- **Edge Compatibility:** V5 is designed for edge runtimes (middleware friendly).

### 4. Payments: Stripe
- **Checkout:** Hosted checkout page for PCI compliance and reduced complexity.
- **Webhooks:** `src/app/api/webhooks/stripe` listens for `checkout.session.completed` to provision access.
- **Sync:** Database user record holds `stripeSubscriptionId` to verify status.

## Data Flow

### User Sign Up
1. User clicks "Sign In" -> `UserAuthForm`.
2. NextAuth handles OAuth flow (Google) or Magic Link (Resend).
3. `PrismaAdapter` creates `User` record in DB.
4. User redirected to `/dashboard`.

### Subscription Upgrade
1. User clicks "Upgrade" in `/pricing`.
2. `createCheckoutSession` Server Action is called.
3. User redirected to Stripe Checkout.
4. **Async:** Stripe sends webhook -> `POST /api/webhooks/stripe`.
5. Webhook handler updates `User` table with `stripePriceId` and `stripeCurrentPeriodEnd`.

## Directory Structure
- `src/app`: Routes. `(group)` folders are used for layout isolation (e.g., `(dashboard)` vs `(marketing)`).
- `src/components`: UI components.
  - `ui`: Reusable primitives (buttons, inputs).
  - `dashboard`: Domain-specific components.
- `src/lib`: Singletons and utilities (`db.ts`, `stripe.ts`, `utils.ts`).

## Security
- **Protected Routes:** `src/app/(dashboard)/layout.tsx` checks `auth()` session.
- **API Routes:** Webhook verifies `Stripe-Signature` header.
- **Environment:** Secrets managed via `.env.local` (not committed).
