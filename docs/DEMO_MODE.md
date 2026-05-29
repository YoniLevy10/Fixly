# מצב הדגמה (Investor Demo)

## מה מופעל

- **58+** אנשי מקצוע, **120+** בקשות, **250+** ביקורות
- מעקב חי מדומה, ETA, התראות דפדפן
- באנר כתום בראש האפליקציה

## ברירת מחדל

`NEXT_PUBLIC_FF_DEMO_DATA` **פעיל** אם לא הוגדר (גם ב-Vercel אחרי deploy).

לכבות ולעבוד רק מול Supabase אמיתי:

```env
NEXT_PUBLIC_FF_DEMO_DATA=false
```

## מקומי

```bash
npm run dev
```

רענון קשיח: `Ctrl+Shift+R`. אמור להופיע באנר "מצב הדגמה להצגה למשקיעים".

## Vercel

אחרי push ל-`main`, ה-build הבא יכלול דמו אוטומטית (דרך `next.config.ts`).

אופציונלי — להגדיר בממשק Vercel → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_FF_DEMO_DATA` | `true` |

## בדיקה מהירה

- `/professionals` — רשימה ארוכה
- `/my-requests` — בקשות רבות
- `/` — 4 מדדי פלטפורמה
- `/tracking/req-demo-1` — מפה חיה
