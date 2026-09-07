# מצב הדגמה (Investor Demo)

## מצב נוכחי (לפני השקעה)

**דמו מופעל בכל הסביבות** — כולל `fixly.tech` בפרודקשן.

- באנר כתום, החלפת תפקיד לקוח ↔ בעל מקצוע, סיור מקצה לקצה
- 58+ אנשי מקצוע, 120+ בקשות, 250+ ביקורות (mock)
- ב־`fixly.tech` מוצגת האפליקציה המלאה (לא רק דף המתנה)

## קישור למשקיעים

```
https://fixly.tech/demo
```

הסיור מתחיל אוטומטית: יצירת הזמנה → אישור Pro → בדרך + מפה חיה → עבודה → סיום.

מהבאנר הכתום: **התחל סיור**.

## Kill-switch (אחרי השקעה)

```env
NEXT_PUBLIC_FF_DEMO_KILL=true
```

אחרי השינוי — redeploy. `NEXT_PUBLIC_FF_DEMO_DATA=false` הישן **לא** מכבה יותר את הדמו.

## טכני — למה זה היה נשבר

מאגר ה־mock בזיכרון לא משותף בין אינסטנסים ב־Vercel → PATCH אחרי CREATE החזיר 404 → «עדכון נכשל».

**תיקון:** סטטוסים נשמרים ב־`sessionStorage` + `PUT /api/demo/requests` (upsert לכל אינסטנס).
מסכי מעקב / דשבורד Pro קוראים גם מה־snapshot המקומי.
ב־`/tracking` ו־`/request` התפריט התחתון מוסתר.

## אימות

```bash
curl -sS 'https://fixly.tech/api/health?verbose=1' | jq '.demoMode, .mode'
# Expect: true, "mock"
```
