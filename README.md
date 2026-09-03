# Fixly

מרקטפלייס תחזוקה ובעלי מקצוע לישראל — עברית קודם.

לקוח שולח בקשה → המערכת מתאימה אנשי מקצוע → מעקב עד סיום.  
בעלי מקצוע משלמים על לידים / מנוי; לקוחות משתמשים בחינם.

**סטטוס:** מוצר MVP מוכן בקוד. ההשקה תלויה בתשתית חיצונית (Supabase / Stripe / OAuth) ובגיוס ידני של בעלי מקצוע בעיר פיילוט — לא בפיתוח נוסף.

---

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Web | Next.js 16 · React 19 · TypeScript · Tailwind |
| Backend | Supabase (Auth, DB, Realtime) |
| Deploy | Vercel |
| Payments | Stripe (מנוי Pro + לידים + webhooks) |
| Mobile | Capacitor iOS shell |
| Monitoring | Sentry · health check · rate limits |

---

## מה בנוי

- מחזור חיים מלא לבקשות: יצירה → התאמה → קבלה → מעקב → סיום
- התאמת מועמדים (matching) + הצעות לכמה Pros
- דשבורד לקוח / Pro, צ'אט על בקשה, מעקב חי
- מונטיזציה: קרדיטי לידים, מנוי Pro (₪149/חודש), עמלה על עסקה
- WhatsApp deep links ליצירת קשר
- SEO לעמודי עיר + קטגוריה
- הפניות (referrals), אימות Pro, פאנל אדמין
- Partner API ל-Bamakor (`/api/v1/jobs` + webhooks חתומים)
- Demo mode לפיתוח מקומי (כבוי בברירת מחדל בפרודקשן)

---

## מה עדיין לא “מוכן להשקה”

הקוד במאגר. מה שחסר הוא תפעול:

| משימה | בעלים |
|--------|--------|
| משתני סביבה ב-Vercel + מיגרציות Supabase | Ops |
| Google OAuth (Supabase + Google Console) | Ops |
| Stripe חי (מפתחות + webhook) | Ops |
| 20–50 בעלי מקצוע פעילים בעיר אחת | GTM / מכירה ידנית |
| כפתור «שלח ל-Fixly» בצד Bamakor | צוות Bamakor |

פירוט: [`DEPLOYMENT_STATUS.md`](./DEPLOYMENT_STATUS.md) · [`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md) · [`docs/PRO_OUTREACH.md`](./docs/PRO_OUTREACH.md)

---

## הרצה מקומית

דרישות: Node.js 20+ · npm

```bash
npm ci
cp .env.example .env.local   # מלא לפחות מפתחות Supabase, או השאר demo
npm run dev
```

האפליקציה: [http://localhost:3000](http://localhost:3000)

בלי Supabase — מצב demo עם נתוני דמה (נוח ל-UI).  
עם Supabase — הגדר `NEXT_PUBLIC_SUPABASE_*` ו-`SUPABASE_SERVICE_ROLE_KEY` לפי `.env.example`.

### בדיקות

```bash
npm run typecheck
npm run test:unit
npm run smoke:phase1      # Bamakor jobs API (memory store)
npm run test:e2e          # Playwright — דורש דפדפנים מותקנים
```

### מובייל (iOS)

```bash
npm run mobile:prepare
npm run cap:ios
```

ראו [`docs/MOBILE_APP_STORE.md`](./docs/MOBILE_APP_STORE.md).

---

## מודל הכנסות (בקצרה)

| קהל | מחיר |
|-----|------|
| לקוחות | חינם |
| בעלי מקצוע | 3 לידים חינם/חודש → אחר כך תשלום לליד, או מנוי Pro |

פירוט מלא: [`docs/MONETIZATION.md`](./docs/MONETIZATION.md)

---

## מבנה הפרויקט

```text
app/           # Routes (App Router) — בלי לוגיקת עסק עמוקה
components/    # UI
features/      # מודולי פיצ'ר (בקשות וכו')
lib/           # Matching, Stripe, Supabase, monetization, integrations
services/      # שירותי דומיין
shared/        # חוזים משותפים, hooks, utils
supabase/      # Migrations + repositories
docs/          # מדריכי השקה, מונטיזציה, אינטגרציות
```

עקרונות ארכיטקטורה: [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
מיפוי דומיין וסטטוס ריפו: [`FIXLY_STATUS.md`](./FIXLY_STATUS.md)

---

## תיעוד מרכזי

| מסמך | נושא |
|------|------|
| [`docs/GOOGLE_SEARCH_CONSOLE.md`](./docs/GOOGLE_SEARCH_CONSOLE.md) | חיבור Fixly.tech ל-GSC |
| [`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md) | צ'קליסט השקה |
| [`docs/ROADMAP_LAUNCH.md`](./docs/ROADMAP_LAUNCH.md) | סדר עבודה להשקה |
| [`docs/MONETIZATION.md`](./docs/MONETIZATION.md) | תמחור וגבייה |
| [`docs/PRO_OUTREACH.md`](./docs/PRO_OUTREACH.md) | גיוס בעלי מקצוע |
| [`docs/BAMAKOR_INTEGRATION.md`](./docs/BAMAKOR_INTEGRATION.md) | Partner API |
| [`docs/PLATFORM_FEATURES.md`](./docs/PLATFORM_FEATURES.md) | פיצ'רי צמיחה |
| [`docs/DEMO_MODE.md`](./docs/DEMO_MODE.md) | מצב דמו |
| [`DEPLOYMENT_STATUS.md`](./DEPLOYMENT_STATUS.md) | מה בקוד מול מה ב-ops |

---

## פיתוח

- עבודה ב-branches; לא דוחפים ישירות ל-`main`
- לפני פיצ'ר חדש: בדקו reuse ב-`lib/` / `shared/` / `features/`
- Singleton: כפתור אחד, Card אחד, מודל Request אחד, מנוע matching אחד

---

## רישיון

Private — כל הזכויות שמורות.
