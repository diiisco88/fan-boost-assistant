# Fan Boost Assistant

> The retention co-pilot for Fanvue creators. Keep more subs. Earn more tips. Post smarter.

---

## What this app does

Fan Boost Assistant watches your Fanvue account in the background and surfaces:

- **Welcome DMs** — drafted the moment someone subscribes, waiting for your approval
- **Tip thank-yous** — queued instantly when a tip lands
- **Churn risk scores** — flags subscribers going quiet before they cancel
- **Re-engagement drafts** — one-tap check-in messages for quiet fans
- **Posting optimizer** — the best hour to post, based on your actual fan data

**Nothing ever sends without the creator tapping Send.** Every outbound action is creator-approved.

---

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + PostgreSQL
- **Tailwind CSS** with dark brand theme
- **BullMQ** + Redis for job queues
- **jose** for JWT session management
- **Fanvue OAuth2** for creator login

---

## Quick start (local dev)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (free: [Supabase](https://supabase.com) or [Neon](https://neon.tech))
- Redis (free: [Upstash](https://upstash.com))
- A Fanvue Builder app ([builder.fanvue.com](https://builder.fanvue.com))

### 2. Clone and install

```bash
git clone https://github.com/yourname/fan-boost-assistant
cd fan-boost-assistant
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | How to get it |
|---|---|
| `DATABASE_URL` | Your Postgres connection string |
| `REDIS_URL` | Your Redis connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Run `openssl rand -hex 32` |
| `FANVUE_CLIENT_ID` | Fanvue Builder app → App Details |
| `FANVUE_CLIENT_SECRET` | Fanvue Builder app → Authentication |
| `FANVUE_REDIRECT_URI` | `http://localhost:3000/api/auth/fanvue/callback` (local) |
| `FANVUE_SIGNING_SECRET` | Fanvue Builder app → Events/Webhooks |

### 4. Set up the database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Fan Boost landing page.

---

## Fanvue app configuration

In your Fanvue Builder app, configure:

**App Type:** Off Platform App

**OAuth Redirect URI:**
```
https://fanboost.app/api/auth/fanvue/callback
```

**Scopes to request:**
```
read:self read:creator read:fan read:chat read:insights read:post read:media read:tracking_links
```
(Add `write:chat` only when ready to enable one-tap sending)

**Webhook endpoint:**
```
https://fanboost.app/api/webhooks/fanvue
```

**Webhook events to subscribe:**
- New Subscriber
- Tip Received
- Purchase Received
- Message Received
- Message Read
- New Follower

---

## Deploy to Vercel (recommended for non-developers)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Add all environment variables in the Vercel dashboard (copy from `.env.example`)
4. Click Deploy

After first deploy, run the database migration once:
```bash
npx vercel env pull .env.local
npx prisma migrate deploy
```

Set `FANVUE_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` to your production domain before going live.

---

## Pricing (Fanvue App Store)

| Plan | Price | Included |
|---|---|---|
| Starter | $19/mo | 1 account · Welcome DMs · Tip thank-yous · Basic insights |
| Pro | $49/mo | Multi-account · Full analytics · Posting optimizer · Custom templates |

Both plans: 7-day free trial. Fanvue takes 20%; net ~$15.20 / $39.20 per subscriber/month.

---

## Safety & compliance built in

- No autonomous sends — every message requires creator approval
- Opt-out detection — fan replies with stop/unsubscribe words auto-suppress further drafts
- AES-256-GCM encrypted token storage
- Full audit log of every action
- One-click data purge in Settings

---

## Project structure

```
src/
  app/
    api/
      auth/fanvue/           OAuth redirect + callback
      auth/logout/           Session clear
      webhooks/fanvue/       Webhook handler (HMAC verified)
      dashboard/             KPI data
      subscribers/           Subscriber list + churn scores
      messages/[id]/         Send / dismiss / edit drafts
      automations/           Automation settings
      insights/              Posting heatmap + top fans
      settings/              Creator settings + purge
      health/                Health check endpoint
    dashboard/
      page.tsx               KPIs + pending drafts
      subscribers/           Churn risk table
      messages/              DM approval inbox
      automations/           Toggle automations + templates
      insights/              Posting optimizer + top fans
      settings/              Account settings
    page.tsx                 Landing / login page
  lib/
    prisma.ts                Prisma singleton
    crypto.ts                AES-256-GCM encrypt/decrypt
    fanvue.ts                Fanvue API client
    churn.ts                 Churn risk scoring (0-100)
    optout.ts                Opt-out keyword detection
    audit.ts                 Audit logging helper
    templates.ts             {{name}} template renderer
    posting-optimizer.ts     Best posting time analysis
    session.ts               JWT session helpers
  middleware.ts              Protects /dashboard/* routes
  components/
    ui/                      Button, Card, Badge, Input, Textarea
    DraftCard.tsx            Message approval card
    ChurnBadge.tsx           Risk score badge
    Sidebar.tsx              Dashboard navigation
prisma/
  schema.prisma              Full data model
.env.example                 All required environment variables
```

---

Built for Fanvue creators. Not affiliated with Fanvue Ltd.
