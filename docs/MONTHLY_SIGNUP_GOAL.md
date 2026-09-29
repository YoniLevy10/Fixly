# יעד חודשי — 10 נרשמים אמיתיים

**חלון:** 29 בספטמבר 2026 – 29 באוקטובר 2026  
**יעד:** 10 הרשמות ב-`pro_waitlist` (לקוחות + בעלי מקצוע)  
**לא נספרים:** ספאם, `smoke_*`, prospects ממנוע הגילוי, פרופילי דמו

## איפה רואים התקדמות

- `/admin` — כרטיס יעד עם בר התקדמות + פיצול לקוחות/מקצוענים
- API: `GET /api/admin/stats` → `signupGoal`

## מה נחשב הרשמה אמיתית

- שם + טלפון ישראלי תקין
- `created_at` בתוך החלון
- `source` לא smoke/test
- נשמר דרך `/waitlist` → `POST /api/waitlist` עם `audience` + UTM

## איך מגיעים ל-10 (תפעול)

1. לשלוח קישור קנוני: `https://fixly.tech/waitlist`
2. לבעלי מקצוע / WhatsApp outreach: `https://fixly.tech/waitlist?audience=professional&utm_source=outreach&utm_medium=referral&utm_campaign=pro_leads`
3. Meta: `utm_source=meta&utm_medium=paid`
4. אחרי כל הרשמה — לבקש שיתוף (כפתור בוואטסאפ בדף ההצלחה)
5. לא לספור prospects כנרשמים

קוד: [`lib/growth/monthly-signup-goal.ts`](../lib/growth/monthly-signup-goal.ts)
