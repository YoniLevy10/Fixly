# גיוס אנשי מקצוע (Prospects + Superadmin)

אין הסכם עם מידרג — **אין סקרייפינג או ייבוא אוטומטי ממידרג**.
אין איסוף מקבוצות פייסבוק פרטיות ואין עקיפת תנאי שימוש.

## ממשק

- **[`/superadmin`](../app/superadmin/page.tsx)** — מסך הגיוס הוויזואלי (מונים, טבלה, אישור, WhatsApp, גילוי).
- `/admin/prospects` מפנה ל־`/superadmin`.
- כניסה: התחברות עם אימייל שמופיע ב־`ADMIN_EMAILS` או `app_metadata.role=admin`.

## מקורות גילוי מותרים

| מקור | סוג | Env |
|------|-----|-----|
| Google Places API | API רשמי | `GOOGLE_PLACES_API_KEY` |
| OpenStreetMap Overpass | נתונים פתוחים (ODbL) | לא נדרש |
| הזנה ידנית / CSV | מנהל | — |

### איך משיגים Google Places key

1. Google Cloud Console → יצירת פרויקט / בחירת פרויקט
2. Enable **Places API** (New)
3. Credentials → API key → הגבלה ל־Places בלבד
4. Billing חייב להיות פעיל
5. להוסיף ב־Vercel: `GOOGLE_PLACES_API_KEY=...`

## סוכן אוטומטי

- Cron יומי: `GET /api/cron/discover-prospects` (Bearer `CRON_SECRET`) — רשום ב־`vercel.json` ב־07:00 UTC
- הרצה ידנית: כפתור **הרץ גילוי עכשיו** ב־`/superadmin` → `POST /api/admin/prospects/discover`
- לוג ריצות: טבלת `prospect_discovery_runs`
- סינון אחרי גילוי: נשמרים בעיקר **שמות שנראים כמו אדם פרטי** (לא בע״מ / שירותי / רשתות). לידים ישנים שלא עוברים את הסינון נשארים עד דחייה ידנית.

## WhatsApp

אין שליחה אוטומטית. בכל ליד עם טלפון (חוץ מ־`rejected` / `do_not_contact`) יש כפתור **WhatsApp** שפותח `wa.me` עם הודעת גיוס מוכנה מהטלפון שלך.
לחיצה על הקישור מאשרת אוטומטית לידים ב־`discovered`/`verified` ומעדכנת ל־`contacted`.
מספר בקשות מתווסף להודעה **רק** אם יש ספירה אמיתית של בקשות פעילות מתאימות.

## משפך סטטוסים

`discovered → verified → approved → contacted → interested → joined → active`

בנוסף: `rejected`, `do_not_contact`.

## קישור להצטרפות

`/pro/join` עם אותו טלפון → ליד עובר ל־`joined` (בלי ליצור `professionals` כפול).
Claim פרופיל עם טלפון תואם → `active`.

## Migrations (להחיל על Production)

1. `supabase/migrations/20260909010000_professional_prospects.sql`
2. `supabase/migrations/20260909120000_prospect_discovery_runs.sql`

## Env נדרש

```bash
ADMIN_EMAILS=you@example.com
CRON_SECRET=long-random
GOOGLE_PLACES_API_KEY=your-places-key
# optional:
# FIXLY_RECRUIT_CITY=ירושלים
# FIXLY_RECRUIT_CATEGORY_SLUGS=plumbing,electricity,...
```
