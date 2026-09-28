# תשלומים ב-Fixly — Grow (Meshulam)

> **סטטוס השקה ארצית:** תשלומים **בצד**. המוצר עולה בלי גבייה.
> כשנחבר כסף — **Grow**, כמו ב־Bino (לא Tranzila).

## למה Grow

אותו ספק כמו Bino/Bamakor:

- `GROW_API_KEY` + `GROW_PAGE_CODE` + `GROW_WEBHOOK_SECRET` ב־Vercel
- `GROW_ENV=sandbox` לבדיקות / `production` ללייב
- Webhook: `https://fixly.tech/api/webhook/grow?token={GROW_WEBHOOK_SECRET}`

## מתי מפעילים

1. יש מפתחות Grow לפלטפורמת Fixly
2. מגדירים env ב־Vercel
3. `NEXT_PUBLIC_FF_MONETIZATION=true`
4. מממשים checkout למנוי Pro / תשלום עבודה (כרגע stub ב־`lib/grow/` + webhook)

## מה לא עושים עכשיו

- לא מחברים Tranzila
- לא גובים עמלה על עסקאות עד שהמודל יאושר מחדש
- לקוחות נשארים חינם; בעלי מקצוע יכולים להצטרף בלי תשלום בשלב ההשקה

## קוד רלוונטי

- `lib/grow/config.ts` — קריאת מפתחות
- `app/api/webhook/grow/route.ts` — קבלת התראות (stub)
- `lib/feature-flags.ts` → `monetization` (opt-in)
