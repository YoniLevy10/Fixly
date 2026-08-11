# Fixly — Deployment Checklist / רשימת השקה

Bilingual launch checklist for production. Keep this in sync with `.env.example`.

---

## 1. Environment variables / משתני סביבה

Set in **Vercel → Project → Settings → Environment Variables** (Production + Preview as needed).

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only — never expose to browser |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical URL (OAuth, Stripe, Capacitor) |
| `NEXT_PUBLIC_FF_DEMO_DATA` | ✅ | Must be `false` in production |
| `ADMIN_EMAILS` | ✅ | Comma-separated admin allow-list |
| `CRON_SECRET` | ✅ | Protects `/api/cron/*` |
| `STRIPE_SECRET_KEY` | ⚪ | Live/test secret when charging |
| `STRIPE_WEBHOOK_SECRET` | ⚪ | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚪ | Browser Stripe.js |
| `STRIPE_PRICE_PRO_MONTHLY` | ⚪ | Pro monthly Price ID |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⚪ | Web Push public key |
| `VAPID_PRIVATE_KEY` | ⚪ | Web Push private key |
| `VAPID_SUBJECT` | ⚪ | e.g. `mailto:ops@fixly.app` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ⚪ | Durable rate limits on Vercel |
| `NEXT_PUBLIC_SENTRY_DSN` (+ auth/org/project) | ⚪ | Error monitoring |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ⚪ | Maps / geocoding |
| `FIXLY_API_KEYS` / `BAMAKOR_WEBHOOK_SECRET` | ⚪ | Partner (Bamakor) API |
| Feature flags `NEXT_PUBLIC_FF_*` | ⚪ | See `.env.example` — list all explicitly |

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
- `stripe_customer_id`
- RLS hardening (`20260811210000_enable_rls_security.sql`)
- **Push subscriptions** (`20260811220000_push_subscriptions.sql`)

Also verify:

1. Auth → Google provider + redirect URLs  
2. Storage bucket `request-images`  
3. Anonymous sign-in if still required for MVP  

---

## 3. Vercel deploy steps / שלבי Vercel

1. Connect the GitHub repo; production branch = `main` (or your release branch).  
2. Paste all required env vars (section 1).  
3. Deploy; confirm build succeeds.  
4. Stripe Dashboard → Webhook → `https://<domain>/api/billing/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`  
5. Vercel Cron (see `vercel.json`) must send `Authorization: Bearer $CRON_SECRET` (or query secret if configured).  
6. Optional: Capacitor / App Store — `docs/MOBILE_APP_STORE.md`; set `CAPACITOR_SERVER_URL` only for local device testing.

```bash
curl -sS https://YOUR_DOMAIN/api/health | jq
# Expect: status ok|degraded, demoMode: false, mode: supabase
```

---

## 4. E2E verification / בדיקות קצה־לקצה

Manual smoke (production or staging with real Supabase):

1. **Customer:** browse pros → create request → track status → complete → leave review  
2. **Pro:** claim profile → pending tab → accept invite → status updates → mark completed (quote amount)  
3. **Billing:** `/pro/pricing` checkout (test mode) → Pro dashboard billing card → Customer Portal manage/cancel  
4. **Credits:** free-tier accept until credits exhausted → expect `402` on accept-invite  
5. **Admin:** `/admin` only for `ADMIN_EMAILS`  
6. **Push (optional):** enable `NEXT_PUBLIC_FF_PUSH` + VAPID → subscribe → send test via server  
7. **Health:** `/api/health` and `/api/health?verbose=1`  
8. **i18n:** switch he/en on home, quick request categories, pro billing card  

Automated:

```bash
npm run build
npm run test:unit
# Optional: npm run test:e2e (Playwright; demo flags in playwright.config)
```

---

## 5. Known limitations / מגבלות ידועות

| Area | Limitation | Mitigation |
|------|------------|------------|
| Rate limits | In-memory without Upstash; resets on cold start | Set Upstash Redis env vars |
| Demo mode | If `NEXT_PUBLIC_FF_DEMO_DATA` unset in some local flows, demo may stay on | Force `false` in production |
| Web Push | Requires HTTPS, SW registration, VAPID; iOS Safari constraints | Document for users; Capacitor push later |
| Stripe | Commission/lead fees may record in DB before live charge | Enable keys + webhooks before pilot billing |
| SEO landings | `/services/[city]/[category]` intentionally Hebrew | Not fully localized EN |
| Partner API | Bamakor needs shared secrets + partner-side receiver | See `docs/BAMAKOR_INTEGRATION.md` |
| Maps | Leaflet works without Google; Maps key optional | Add key when Google tiles/geocode needed |

---

## 6. Go / No-go

**Go** when:

- [ ] `demoMode: false` on `/api/health`  
- [ ] Migrations applied (including push + RLS)  
- [ ] Admin email works  
- [ ] Request ↔ pro accept ↔ complete path verified  
- [ ] Secrets not in git; `.env` gitignored  

**No-go** if demo data is on in production, cron is unauthenticated, or Stripe webhooks are unverified while charging live customers.

---

## Related docs

- `docs/PRODUCTION_READINESS.md`  
- `docs/MONETIZATION.md`  
- `docs/MOBILE_APP_STORE.md`  
- `docs/BAMAKOR_INTEGRATION.md`  
- `.env.example`
