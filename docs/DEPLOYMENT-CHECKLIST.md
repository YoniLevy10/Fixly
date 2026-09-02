# Fixly — Deployment Checklist / רשימת השקה

Bilingual launch checklist for production. Keep this in sync with `.env.example` and `docs/DEVELOPER-GUIDE.md`.

---

## Marketing-ready gate (before ₪1 on ads)

Must all pass:

| Check | How |
|-------|-----|
| Health green | `curl -sS 'https://DOMAIN/api/health?verbose=1'` → `status: ok`, `demoMode: false`, `mode: supabase` |
| Demo off | `NEXT_PUBLIC_FF_DEMO_DATA=false` in Vercel **and** redeployed |
| Migrations | Including `20260902090000_marketing_ready_rls.sql` |
| Tranzila | Terminal + keys + `TRANZILA_WEBHOOK_SECRET` on notification URL |
| Analytics | `NEXT_PUBLIC_FF_ANALYTICS=true` + `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Push | `NEXT_PUBLIC_FF_PUSH=true` + VAPID keys |
| Supply | ≥20 claimed, available pros in one pilot city |
| E2E | request → match → accept → track → complete → review on production |
| Smoke | `npm run smoke:pilot` and `PILOT_BASE_URL=https://DOMAIN npm run smoke:pilot` |

Defer for later (not ads blockers): App Store, Bamakor UI, Midrag growth channel, native APNs.

---

## 1. Environment variables / משתני סביבה

Set in **Vercel → Project → Settings → Environment Variables** (Production + Preview as needed).

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only — never expose to browser |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical URL (OAuth, Tranzila redirects, Capacitor) |
| `NEXT_PUBLIC_FF_DEMO_DATA` | ✅ | Must be `false` in production |
| `ADMIN_EMAILS` | ✅ | Comma-separated admin allow-list |
| `CRON_SECRET` | ✅ | Protects `/api/cron/*` |
| `TRANZILA_TERMINAL` | ✅* | *Required before monetization / ads with paid Pro |
| `TRANZILA_API_APP_KEY` | ✅* | Tranzila API app key |
| `TRANZILA_API_SECRET_KEY` | ✅* | Tranzila API secret |
| `TRANZILA_WEBHOOK_SECRET` | ✅* | Bearer / `?secret=` / `x-tranzila-secret` on webhook |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅* | *Required before paid ads measurement |
| `NEXT_PUBLIC_FF_ANALYTICS` | ✅* | `true` before ads |
| `NEXT_PUBLIC_FF_PUSH` | ✅* | `true` so invited pros get notified |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | ✅* | Web Push |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ⚪ | Durable rate limits on Vercel |
| `NEXT_PUBLIC_SENTRY_DSN` (+ auth/org/project) | ⚪ | Error monitoring |
| `FIXLY_API_KEYS` / `BAMAKOR_WEBHOOK_SECRET` | ⚪ | Partner (Bamakor) API |
| Feature flags `NEXT_PUBLIC_FF_*` | ⚪ | See `.env.example` |

Maps use **OpenStreetMap / Leaflet** — no Google Maps API key required.

**Do not commit `.env` / `.env.local`.** Use `.env.example` as the template only.

---

## 2. Database migrations / מיגרציות

```bash
# Linked project
supabase db push

# Or apply SQL files in order under supabase/migrations/
```

Critical recent migrations:

- Monetization + billing fields
- Live tracking / platform features
- Bamakor integration
- `stripe_customer_id` (optional Customer Portal)
- RLS hardening (`20260811210000_enable_rls_security.sql`)
- Push subscriptions (`20260811220000_push_subscriptions.sql`)
- **Tranzila fields** (`20260811230000_tranzila_fields.sql`)
- **Marketing-ready RLS** (`20260902090000_marketing_ready_rls.sql`) — invited pros can SELECT parent requests

Also verify:

1. Auth → Google provider + redirect URLs  
2. Storage bucket `request-images`  
3. Anonymous sign-in if still required for MVP  

---

## 3. Vercel deploy steps / שלבי Vercel

1. Connect the GitHub repo; production branch = `main` (or your release branch).  
2. Paste all required env vars (section 1). Confirm `NEXT_PUBLIC_FF_DEMO_DATA=false` before build.  
3. Deploy; confirm build succeeds.  
4. Tranzila portal → Transaction Notification Endpoint → `https://<domain>/api/tranzila/webhook?secret=<TRANZILA_WEBHOOK_SECRET>`  
5. Vercel Cron (see `vercel.json`) must send `Authorization: Bearer $CRON_SECRET`.  
6. Optional: Capacitor / App Store — `docs/MOBILE_APP_STORE.md`.

```bash
curl -sS https://YOUR_DOMAIN/api/health | jq
# Expect: status ok|degraded
curl -sS 'https://YOUR_DOMAIN/api/health?verbose=1' | jq
# Expect: demoMode: false, mode: supabase, tranzila configured when monetizing

npm run smoke:pilot
PILOT_BASE_URL=https://YOUR_DOMAIN npm run smoke:pilot
```

---

## 4. E2E verification / בדיקות קצה־לקצה

Manual smoke (production or staging with real Supabase):

1. **Customer:** browse pros → create request (single + quick multi-match) → track status → complete → leave review  
2. **Pro:** claim profile → pending tab → accept invite → status updates → mark completed (quote amount)  
3. **Billing:** `/pro/pricing` Tranzila checkout → Pro dashboard billing card  
4. **Credits:** free-tier accept until credits exhausted → expect `402` on accept-invite  
5. **Admin:** `/admin` only for `ADMIN_EMAILS`  
6. **Push:** enable `NEXT_PUBLIC_FF_PUSH` + VAPID → subscribe; create multi-match request → pro notified  
7. **Analytics:** GA4 realtime shows `request_created` / `pro_accepted` / `request_completed`  
8. **Health:** `/api/health` and `/api/health?verbose=1`  
9. **i18n:** switch he/en on home, quick request categories, pro billing card  

Automated:

```bash
npm run build
npm run test:unit
npm run smoke:pilot
# Optional: npm run test:e2e
```

---

## 5. Known limitations

| Area | Status | Notes |
|------|--------|--------|
| Push (native iOS/Android) | Web Push only | APNs/FCM via Capacitor still needed for store apps |
| Rate limits | In-memory fallback | Prefer Upstash on Vercel |
| Mobile stores | Capacitor ready | See `docs/MOBILE_APP_STORE.md` |
| Partner (Bamakor) | Code ready | Confirm staging HMAC with partner |
| Stripe portal | Optional legacy | Tranzila is primary checkout |
| Lead fee collection | Accrual in DB | Tranzila charge for per-lead can follow soft launch |

---

## Tips

```bash
NEXT_PUBLIC_FF_DEMO_DATA=false npm run build && npm start
```

Confirm Sentry after first production deploy. Enable Supabase PITR / daily backups.
