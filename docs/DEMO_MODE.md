# מצב הדגמה (Investor Demo)

## מה מופעל

- **58+** אנשי מקצוע, **120+** בקשות, **250+** ביקורות
- מעקב חי מדומה, ETA, התראות דפדפן
- באנר כתום בראש האפליקציה + קישור **התחל הזמנה מלאה**
- זרימת הזמנה מלאה: יצירה → אישור Pro → בדרך → עבודה → סיום → ביקורת

## ברירת מחדל

`NEXT_PUBLIC_FF_DEMO_DATA` **כבוי** אם לא הוגדר (גם ב-Vercel אחרי deploy).

[`next.config.ts`](../next.config.ts) מזריק `'false'` ב-build כשאין ערך — כדי שלא ייכנס דמו לפרודקשן בטעות.

בפיתוח מקומי בלי env מפורש, [`lib/data/demo-mode.ts`](../lib/data/demo-mode.ts) עדיין מפעיל דמו כש-`NODE_ENV !== production`.

להפעלה מפורשת (הצגה למשקיעים / preview):

```env
NEXT_PUBLIC_FF_DEMO_DATA=true
```

לכבות ולעבוד רק מול Supabase אמיתי:

```env
NEXT_PUBLIC_FF_DEMO_DATA=false
```

## מקומי

```bash
# דמו (ברירת מחדל בפיתוח)
npm run dev

# בלי דמו — מול Supabase
NEXT_PUBLIC_FF_DEMO_DATA=false npm run dev
```

רענון קשיח: `Ctrl+Shift+R`. עם דמו אמור להופיע באנר "מצב הדגמה להצגה למשקיעים".

## הזמנה מלאה למשקיעים (Walkthrough)

הפעילו Preview עם `NEXT_PUBLIC_FF_DEMO_DATA=true` (לא על `fixly.tech` פרודקשן).

| שלב | מה לעשות |
|-----|-----------|
| 1 | לחצו **התחל הזמנה מלאה** בבאנר (או `/request/new?professional=1`) |
| 2 | מלאו כתובת / תיאור → שליחה → עוברים למעקב |
| 3 | פתחו `/pro/dashboard` → **כניסה כאיש מקצוע (דמו)** |
| 4 | אשרו את הבקשה → **בדרך** → **התחלת עבודה** → **סיום** |
| 5 | חזרו למסך המעקב של הלקוח — מפה חיה + ETA בזמן `בדרך` |
| 6 | אחרי סיום — שלחו ביקורת |

מסלול מהיר חלופי (multi-match): `/request/quick` → בדשבורד Pro לחצו **קבל הזמנה**.

מעקב חי על בקשה קיימת: `/tracking/req-demo-5` (או כל `req-demo-*` במצב `on_the_way`).

## Vercel (פרודקשן)

**חובה לפני שיווק:**

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_FF_DEMO_DATA` | `false` |

אחרי שינוי env — redeploy (הערך נאפה ב-build).

אימות:

```bash
curl -sS 'https://YOUR_DOMAIN/api/health?verbose=1' | jq '.demoMode, .mode'
# Expect: false, "supabase"
```

**Preview למשקיעים:** הגדירו `NEXT_PUBLIC_FF_DEMO_DATA=true` רק ב־Preview (לא Production) + redeploy.

## בדיקה מהירה (כשדמו ON)

- `/professionals` — רשימה ארוכה
- `/my-requests` — בקשות רבות
- `/` — 4 מדדי פלטפורמה
- `/tracking/req-demo-5` — מפה חיה
- באנר → הזמנה מלאה → Pro dashboard → סיום + ביקורת

## פרודקשן בלי דמו (Supabase)

כש־`NEXT_PUBLIC_FF_DEMO_DATA=false`, הרשימה מגיעה מ־Supabase.

- חייבים שמיגרציות Midrag + יופי יהיו על ה־DB (`supabase db push`), אחרת `/api/professionals` עלול להיכשל על עמודות חסרות.
- קטלוג יופי מקוצר (ציפורניים / שיער / איפור) מרובד מהקוד גם בלי דמו מלא — עד שיש אנשי מקצוע אמיתיים ב־DB.
- סיד אופציונלי: `supabase/migrations/20260904120000_fix_professionals_catalog.sql`
