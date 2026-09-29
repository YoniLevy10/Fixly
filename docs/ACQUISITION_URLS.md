# Acquisition URLs — מה מוביל לאן

מקור אמת אחד לקמפיינים, ללידים ולאפליקציה. **אל תמציאו קישורים חדשים** בלי לעדכן את הקובץ הזה.

## המפה (קנוני)

| מטרה | URL קנוני | למי | מה קורה |
|------|-----------|-----|---------|
| **הרשמה ציבורית (לקוח + בעל מקצוע)** | [`https://fixly.tech/waitlist`](https://fixly.tech/waitlist) | כולם | דף אחד עם בחירת קהל → `POST /api/waitlist` → `pro_waitlist` עם `audience`, `source`, `attribution` |
| **קישור ישיר לבעלי מקצוע** | [`https://fixly.tech/waitlist?audience=professional`](https://fixly.tech/waitlist?audience=professional) | בעלי מקצוע | אותו דף, טאב בעל מקצוע פתוח |
| **`/pro/join`** | redirect | בעלי מקצוע | מפנה ל-`/waitlist?audience=professional` (נשמר לקישורי outreach ישנים) |
| **אפליקציה / marketplace** | [`https://fixly.tech/`](https://fixly.tech/) | משתמשים בישראל | `HomeScreen` (nationwide) |

## UTM קנוני (סיווג ערוצים ב-GA4)

| ערוץ | `utm_source` | `utm_medium` | דוגמה |
|------|--------------|--------------|--------|
| Meta paid | `meta` | `paid` | `?utm_source=meta&utm_medium=paid&utm_campaign=weekend_waitlist` |
| Google organic / GSC | `google` | `organic` | `?utm_source=google&utm_medium=organic` |
| Share / referral | `share` | `share` | נוצר אוטומטית אחרי הרשמה |
| Outreach WhatsApp | `outreach` | `referral` | `?utm_source=outreach&utm_medium=referral&utm_campaign=pro_leads` |

**אל תשתמשו** ב-`utm_medium=whatsapp` / `cpc` סתמי — זה מבלבל את Default Channel Group.

## Meta / paid — קישור להעתקה

```
https://fixly.tech/waitlist?utm_source=meta&utm_medium=paid&utm_campaign=weekend_waitlist&utm_content=feed_v1
```

אנשי מקצוע ממודעות / WhatsApp:

```
https://fixly.tech/waitlist?audience=professional&utm_source=outreach&utm_medium=referral&utm_campaign=pro_leads
```

## איפה רואים את הרשימות

- `/admin` — הרשמות אמיתיות (`pro_waitlist`) לפי `audience`
- `/superadmin` — prospects חיצוניים בלבד (`professional_prospects`) — **לא מאוחדים** עם הרשמה

## הפרדה חשובה

| טבלה | מה זה |
|------|--------|
| `pro_waitlist` | אדם שנרשם באתר (ליד אמיתי) |
| `professional_prospects` | גילוי חיצוני / outreach — לא הרשמה |
| `professionals` | פרופילים במערכת (כולל 4 seed דמו — לא לספור כלידים) |
