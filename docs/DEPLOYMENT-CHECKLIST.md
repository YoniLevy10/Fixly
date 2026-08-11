# Fixly — Deployment Checklist / רשימת השקה

Bilingual launch checklist for production. Keep this in sync with `.env.example` and `docs/DEVELOPER-GUIDE.md`.

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
| `TRANZILA_TERMINAL` | ⚪ | Tranzila terminal name |
| `TRANZILA_API_APP_KEY` | ⚪ | Tranzila API app key |
| `TRANZILA_API_SECRET_KEY` | ⚪ | Tranzila API secret |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | ⚪ | Web Push |
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

Also verify:

1. Auth → Google provider + redirect URLs  
2. Storage bucket `request-images`  
3. Anonymous sign-in if still required for MVP  

---

## 3. Vercel deploy steps / שלבי Vercel

1. Connect the GitHub repo; production branch = `main` (or your release branch).  
2. Paste all required env vars (section 1).  
3. Deploy; confirm build succeeds.  
4. Tranzila portal → Transaction Notification Endpoint → `https://<domain>/api/tranzila/webhook`  
5. Vercel Cron (see `vercel.json`) must send `Authorization: Bearer $CRON_SECRET`.  
6. Optional: Capacitor / App Store — `docs/MOBILE_APP_STORE.md`.

```bash
curl -sS https://YOUR_DOMAIN/api/health | jq
# Expect: status ok|degraded
curl -sS 'https://YOUR_DOMAIN/api/health?verbose=1' | jq
# Expect: demoMode: false, mode: supabase, tranzila configured when monetizing
```

---

## 4. E2E verification / בדיקות קצה־לקצה

Manual smoke (production or staging with real Supabase):

1. **Customer:** browse pros → create request → track status → complete → leave review  
2. **Pro:** claim profile → pending tab → accept invite → status updates → mark completed (quote amount)  
3. **Billing:** `/pro/pricing` Tranzila checkout → Pro dashboard billing card  
4. **Credits:** free-tier accept until credits exhausted → expect `402` on accept-invite  
5. **Admin:** `/admin` only for `ADMIN_EMAILS`  
6. **Push (optional):** enable `NEXT_PUBLIC_FF_PUSH` + VAPID → subscribe  
7. **Health:** `/api/health` and `/api/health?verbose=1`  
8. **i18n:** switch he/en on home, quick request categories, pro billing card  

Automated:

```bash
npm run build
npm run test:unit
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

---

## Tips

```bash
NEXT_PUBLIC_FF_DEMO_DATA=false npm run build && npm start
```

Confirm Sentry after first production deploy. Enable Supabase PITR / daily backups.
