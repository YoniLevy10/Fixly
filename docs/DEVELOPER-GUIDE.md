# Fixly — Developer Guide (מדריך למפתחים)

> Development and integration guide for the Fixly team: local setup, architecture, Tranzila payments, free vs paid services, build & deploy, and key files.

---

## Quick Start
- Clone, `npm install`, `npm run dev`
- Copy `.env.example` to `.env.local`
- Required: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and Tranzila (`TRANZILA_TERMINAL`, `TRANZILA_API_APP_KEY`, `TRANZILA_API_SECRET_KEY`)
- Optional: VAPID (`npx web-push generate-vapid-keys`), Upstash Redis, Sentry

---

## Architecture Overview
- Next.js App Router, React 19, Supabase, TypeScript
- i18n: en/he with RTL support
- PWA via manifest + service worker (`public/sw.js`)
- Mobile via Capacitor
- Maps: Leaflet / OpenStreetMap (free, no API key)
- Push: web-push (VAPID)
- Payments: **Tranzila** (Israeli gateway — Bit, Apple Pay, Google Pay, cards, installments, STO recurring)
- Rate limiting: in-memory or Upstash Redis
- Error monitoring: Sentry (optional)

---

## Payment Flow (Tranzila)
1. Server creates handshake token via Tranzila API (`lib/tranzila/handshake.ts`)
2. Client opens Tranzila iframe (stays on our domain / redirect URL)
3. Customer pays
4. Tranzila posts to `/api/tranzila/webhook`
5. Handler updates Supabase (`billing_events`, professional `subscription_tier`, request `payment_status`)
6. Pro subscription: first payment stores token; STO is created for monthly recurring billing

Legacy Stripe checkout code remains under `lib/stripe/` for reference; billing routes use Tranzila. Optional Stripe Customer Portal is still available at `/api/billing/portal` if `STRIPE_SECRET_KEY` is set.

---

## Free vs Paid Services
| Service | Cost | Notes |
|---------|------|-------|
| Supabase | Free tier | Upgrade for scale |
| Tranzila | ~% per transaction | Israeli gateway |
| OpenStreetMap | Free | No API key |
| VAPID / Push | Free | Generate keys locally |
| Upstash Redis | Free tier | Optional rate limits |
| Sentry | Free tier | Optional |
| Vercel | Free tier | Upgrade for bandwidth |

---

## Setup Checklist
1. Create Supabase project; copy URL + anon + service role keys
2. Run migrations: `supabase db push` (includes Tranzila + push + RLS migrations)
3. Create Tranzila account at my.tranzila.com; copy terminal + API keys
4. Generate VAPID keys: `npx web-push generate-vapid-keys`
5. Copy `.env.example` → `.env.local` and fill values
6. `npm run dev` — verify app loads
7. Auth: register → login → create request
8. Payments: Pro subscription + job payment; set webhook to `https://yourdomain.com/api/tranzila/webhook`

---

## Build & Deploy
```bash
npm run build
npm run test:unit
npm run test:e2e   # optional
```
Deploy on Vercel: connect repo, set env vars, deploy.

---

## Key Files
- `lib/tranzila/` — auth, handshake, checkout, STO, webhooks
- `lib/push/` — VAPID + send + client hook
- `lib/i18n/` — en/he messages
- `lib/monetization/` — pricing, lead credits, commission
- `lib/api/rate-limit.ts`
- `public/sw.js`
- `supabase/migrations/`
- `tests/unit/`

---

## Notes
- Default locale is Hebrew (RTL); English via locale toggle
- Demo data OFF in production (`NEXT_PUBLIC_FF_DEMO_DATA=false`)
- RLS enabled on core tables
- Tranzila webhook must be configured in the Tranzila portal
- Push requires HTTPS (Vercel provides this by default)
