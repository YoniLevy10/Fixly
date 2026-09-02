# מצב הדגמה (Investor Demo)

## מה מופעל

- **58+** אנשי מקצוע, **120+** בקשות, **250+** ביקורות
- מעקב חי מדומה, ETA, התראות דפדפן
- באנר כתום בראש האפליקציה

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

## בדיקה מהירה (כשדמו ON)

- `/professionals` — רשימה ארוכה
- `/my-requests` — בקשות רבות
- `/` — 4 מדדי פלטפורמה
- `/tracking/req-demo-1` — מפה חיה
