# Fixly — Production Readiness Guide

> **מטרה:** 100% מוכנות טכנולוגית. אתה מטפל בפיילוט, משקיעים ואנשי מקצוע.

## מה כבר מוכן בקוד (אחרי branch זה)

| רכיב | סטטוס |
|------|--------|
| Demo mode | **OFF ב-production** כברירת מחדל |
| Supabase schema | מיגרציה ראשונית + hardening |
| Stripe webhook | **אימות חתימה HMAC** + lifecycle events |
| Request PATCH | Zod + מעברי סטטוס + rate limit |
| Live tracking | קואורדינטות נשמרות ביצירת בקשה |
| Admin panel | `/admin` + `/api/admin/stats` (מוגן ADMIN_EMAILS) |
| Health check | `/api/health` — בודק demo, Stripe, Upstash |
| Pro waitlist | Zod + rate limit |
| Image upload | ולידציה 5MB, JPG/PNG/WebP |
| Lead credits reset | Cron `/api/cron/reset-lead-credits` |
| Env validation | startup warnings ב-production |

---

## מה **אתה** צריך להגדיר (חיצוני)

### 1. Vercel — Environment Variables

```env
# חובה
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://fixly.vercel.app
NEXT_PUBLIC_FF_DEMO_DATA=false

# Admin (האימייל שלך)
ADMIN_EMAILS=your@email.com,partner@email.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...

# מומלץ
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=https://...
CRON_SECRET=random-long-secret
```

### 2. Supabase

1. הרץ את כל המיגרציות: `supabase db push` (או דרך Dashboard → SQL)
2. Auth → Providers → **Google** (Client ID + Secret)
3. Auth → URL Configuration → Redirect: `https://your-domain/auth/callback`
4. Storage → bucket `request-images` (public read)
5. Authentication → Anonymous sign-in: **ON** (MVP)

### 3. Google Cloud Console

1. OAuth 2.0 Client (Web)
2. Authorized redirect URI = Supabase callback URL
3. העתק Client ID/Secret ל-Supabase

### 4. Stripe

1. צור Product "Fixly Pro" — 149 ₪/month
2. Webhook endpoint: `https://your-domain/api/billing/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. העתק `whsec_...` ל-Vercel

### 5. Deploy

```bash
git push origin cursor/production-readiness-bf25
# Vercel auto-deploys
# Verify: curl https://fixly.vercel.app/api/health
```

**Health צריך להחזיר:** `"status":"ok"`, `"demoMode":false`, `"mode":"supabase"`

### 6. App Store (iOS)

ראה `docs/MOBILE_APP_STORE.md` — Capacitor מוכן, צריך Apple Developer + TestFlight.

---

## בדיקות לפני פיילוט

```bash
# Local production simulation
NEXT_PUBLIC_FF_DEMO_DATA=false npm run build && npm start

# Health
curl https://your-domain/api/health | jq

# Create request flow (manual)
# 1. Browse pros → 2. Submit request → 3. Pro accepts → 4. Track → 5. Complete → 6. Review
```

---

## Checklist מהיר

### בקוד (סגור)
- [x] Marketplace + hardening ב-`main`
- [x] Bamakor API + webhooks (#6)
- [x] מיגרציית Bamakor (ורצה אצלך)

### אתה (תפעול — חוסם שיווק חזק)
- [ ] Vercel env vars מוגדרים (כולל `FIXLY_API_KEYS`, `BAMAKOR_WEBHOOK_SECRET` אם רוצים שותפים)
- [ ] שאר מיגרציות Supabase (אם עדיין לא: monetization / scale / waitlist…)
- [ ] אופציונלי: `supabase/seed_pilot_optional.sql` לפיילוט
- [ ] Google OAuth עובד
- [ ] Stripe webhook verified (רק אם גובים כסף)
- [ ] `/api/health` מחזיר `ok` / `degraded` עם `demoMode: false`
- [ ] `/admin` נגיש עם האימייל שלך
- [ ] 20+ pros אמיתיים בעיר הפיילוט
- [ ] TestFlight / App Store (אופציונלי לשלב 1)
- [ ] Bamakor UI + webhook receiver — בריפו Bamakor בלבד

---

## תמיכה

- `docs/ROADMAP_LAUNCH.md` — לוח זמנים
- `docs/MONETIZATION.md` — מודל הכנסות
- `docs/PRO_OUTREACH.md` — גיוס מקצוענים
