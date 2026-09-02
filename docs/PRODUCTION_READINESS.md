# Fixly — Production Readiness Guide

> **מטרה:** מוצר מוכן להשקעה בשיווק. אתה מטפל בפיילוט, חשבונות חיצוניים וגיוס אנשי מקצוע.

## שער יציאה לפני ₪1 בשיווק

| בדיקה | יעד |
|--------|-----|
| Health | `ok`, `demoMode: false`, `mode: supabase` |
| Flow | בקשה → התאמה → קבלה → מעקב → סיום → ביקורת |
| Supply | ≥20 Pro claimed וזמינים בעיר אחת |
| Analytics | GA4 רואה `request_created` / `pro_accepted` / `request_completed` |
| Tranzila | מנוי Pro נבדק (test → live) + webhook עם secret |
| Smoke | `npm run smoke:pilot` + `PILOT_BASE_URL=… npm run smoke:pilot` |

נדחה: App Store, Bamakor UI, Midrag כערוץ צמיחה.

פירוט ops: [`DEPLOYMENT-CHECKLIST.md`](./DEPLOYMENT-CHECKLIST.md)

---

## מה כבר מוכן בקוד

| רכיב | סטטוס |
|------|--------|
| Demo mode | **OFF כברירת מחדל ב-build** (`next.config.ts` → `'false'`) |
| Multi-match RLS | מיגרציה `20260902090000_marketing_ready_rls.sql` — Pro מוזמן רואה request |
| Candidates insert | Service-role ב-[`lib/data/supabase-requests.ts`](../lib/data/supabase-requests.ts) |
| Billing / lead credits | Service-role ב-[`lib/monetization/record-billing.ts`](../lib/monetization/record-billing.ts) |
| Pro notify (consumer) | Web Push + WhatsApp fallback log |
| GA4 | [`components/analytics/GoogleAnalytics.tsx`](../components/analytics/GoogleAnalytics.tsx) |
| Tranzila webhook | אימות `TRANZILA_WEBHOOK_SECRET` |
| Supabase schema | מיגרציות + hardening + Tranzila fields |
| Request PATCH | Zod + מעברי סטטוס + rate limit |
| Live tracking | קואורדינטות נשמרות ביצירת בקשה |
| Admin panel | `/admin` + `/api/admin/stats` (מוגן ADMIN_EMAILS) |
| Health check | `/api/health` — demo, Tranzila, Upstash, Bamakor |
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
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_FF_DEMO_DATA=false

# Admin
ADMIN_EMAILS=your@email.com,partner@email.com
CRON_SECRET=random-long-secret

# Tranzila
TRANZILA_TERMINAL=your_terminal
TRANZILA_API_APP_KEY=...
TRANZILA_API_SECRET_KEY=...
TRANZILA_WEBHOOK_SECRET=long-random-secret

# Ads measurement + pro notify
NEXT_PUBLIC_FF_ANALYTICS=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
NEXT_PUBLIC_FF_PUSH=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@fixly.app
NEXT_PUBLIC_FF_MONETIZATION=true

# מומלץ
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### 2. Supabase

1. הרץ את כל המיגרציות: `supabase db push` (כולל `20260902090000_marketing_ready_rls.sql`)
2. Auth → Providers → **Google** (Client ID + Secret)
3. Auth → URL Configuration → Redirect: `https://your-domain/auth/callback`
4. Storage → bucket `request-images` (public read)
5. Authentication → Anonymous sign-in: **ON** (MVP)

### 3. Google Cloud Console

1. OAuth 2.0 Client (Web)
2. Authorized redirect URI = Supabase callback URL
3. העתק Client ID/Secret ל-Supabase
4. GA4 property → Measurement ID → `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 4. Tranzila

1. חשבון ב-my.tranzila.com — terminal + API keys
2. Webhook / Transaction Notification:  
   `https://your-domain/api/tranzila/webhook?secret=YOUR_TRANZILA_WEBHOOK_SECRET`
3. העתק `TRANZILA_*` ל-Vercel

### 5. Deploy

```bash
git push origin main
# Vercel auto-deploys — confirm DEMO_DATA=false before this build
curl -sS 'https://your-domain/api/health?verbose=1' | jq
PILOT_BASE_URL=https://your-domain.com npm run smoke:pilot
```

**Health צריך להחזיר:** `"status":"ok"` (או degraded), `"demoMode":false`, `"mode":"supabase"`

### 6. App Store (iOS) — אופציונלי אחרי פיילוט web

ראה `docs/MOBILE_APP_STORE.md`.

---

## בדיקות לפני פיילוט / שיווק

```bash
npm run typecheck
npm run test:unit
npm run smoke:pilot
NEXT_PUBLIC_FF_DEMO_DATA=false npm run build && npm start

# Manual flow
# 1. Browse pros → 2. Submit request (single + quick) → 3. Pro accepts
# 4. Track → 5. Complete → 6. Review → 7. Check GA4 realtime
```

---

## Checklist מהיר

### בקוד (סגור ב-PR marketing-ready)
- [x] Demo default OFF ב-build
- [x] Multi-match RLS + candidate insert via service-role
- [x] Billing via admin client
- [x] Pro notify on consumer match
- [x] GA4 loader
- [x] Tranzila webhook secret
- [x] `npm run smoke:pilot`

### אתה (תפעול — חוסם שיווק)
- [ ] Vercel מחובר ל-repo הנכון + domain
- [ ] Env vars (סעיף 1) + redeploy
- [ ] כל מיגרציות Supabase כולל marketing_ready_rls
- [ ] Google OAuth + GA4
- [ ] Tranzila live + webhook עם secret
- [ ] `/api/health?verbose=1` ירוק
- [ ] `/admin` נגיש
- [ ] 20+ pros אמיתיים בעיר הפיילוט
- [ ] Soft launch 20–50 בקשות לפני תקציב מודעות

---

## תמיכה

- [`DEPLOYMENT-CHECKLIST.md`](./DEPLOYMENT-CHECKLIST.md) — רשימת השקה מלאה
- [`ROADMAP_LAUNCH.md`](./ROADMAP_LAUNCH.md) — לוח זמנים
- [`MONETIZATION.md`](./MONETIZATION.md) — מודל הכנסות
- [`PRO_OUTREACH.md`](./PRO_OUTREACH.md) — גיוס מקצוענים
- [`DEMO_MODE.md`](./DEMO_MODE.md) — מצב דמו
