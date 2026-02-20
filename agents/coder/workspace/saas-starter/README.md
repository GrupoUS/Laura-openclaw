# SaaS Starter Kit 🚀

A production-ready SaaS starter built with **Next.js 14**, **Prisma**, **NextAuth v5**, and **Stripe**.

## Features

- 🔐 **Authentication**: NextAuth v5 (Google & Email magic links)
- 💳 **Payments**: Stripe Checkout & Webhooks
- 🗄️ **Database**: Prisma ORM (SQLite for dev, PostgreSQL for prod)
- 🎨 **Styling**: Tailwind CSS + Shadcn UI principles
- 📧 **Email**: Resend integration (ready to use)
- 🛡️ **Type Safety**: Full TypeScript support

## Getting Started

1.  **Install dependencies**:
    ```bash
    bun install
    ```

2.  **Setup Environment**:
    Copy `.env.local.example` to `.env.local` and add your keys.
    *(Currently set up with mocks for immediate local dev)*

3.  **Initialize Database**:
    ```bash
    bun prisma db push
    ```

4.  **Run Development Server**:
    ```bash
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## 🛠️ Going to Production

### 1. Switch to PostgreSQL
Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql" // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```
Then run `bun prisma db push` with a real Postgres URL (e.g. from Neon or Supabase).

### 2. Enable Real Auth
In `src/lib/auth.ts`:
- Comment out the `CredentialsProvider` (Mock).
- Uncomment `GoogleProvider` and `EmailProvider`.
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`.

### 3. Stripe Setup
- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`.
- Create a webhook in Stripe Dashboard pointing to `https://your-domain.com/api/webhooks/stripe`.
- Select events: `checkout.session.completed`, `invoice.payment_succeeded`.

## Deployment

Deploy to **Vercel**:
1.  Push to GitHub.
2.  Import project in Vercel.
3.  Add Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.).
4.  Deploy!
