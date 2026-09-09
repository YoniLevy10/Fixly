# גיוס אנשי מקצוע (Prospects + Superadmin)

**יעד:** אנשי מקצוע **פרטיים** בסגנון מידרג — שם אדם + מקצוע + נייד (05x), לא חנויות/רשתות/מוקדים.

אין הסכם עם מידרג — **אין סקרייפינג או ייבוא אוטומטי ממידרג**.
אין איסוף מקבוצות פייסבוק / Messenger / שיחות Meta — ראו סעיף Meta למטה.

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

**סינון חובה אחרי גילוי:** שם בסגנון אדם (score ≥ 70) **וגם** טלפון נייד ישראלי `05x`. קווי 02 / 1-700 / חנויות נזרקים.
לידים ממוינים לפי `fit_score` (גבוה = מתאים יותר לפלטפורמה).
בהרצת גילוי נמחקים אוטומטית לידים קודמים מ־Places/OSM בסטטוסים `discovered`/`verified`/`approved`/`rejected` (לא נוגעים ב־contacted / joined / DNC / ידני).
תקציב חיפוש ברירת מחדל: **500** תוצאות גולמיות (`FIXLY_DISCOVERY_TOTAL_BUDGET`).

### איך משיגים Google Places key

1. Google Cloud Console → יצירת פרויקט / בחירת פרויקט
2. Enable **Places API** (New)
3. Credentials → API key → הגבלה ל־Places בלבד
4. Billing חייב להיות פעיל
5. להוסיף ב־Vercel: `GOOGLE_PLACES_API_KEY=...`

## Meta / Facebook / WhatsApp — מה מותר ומה לא

בדיקה מול מדיניות Meta (Platform Terms + Automated Data Collection + WhatsApp Business Policy):

| פעולה | מותר? | הערה |
|--------|--------|------|
| משיכה אוטומטית משיחות / קבוצות Facebook / Messenger | **לא** | Meta אוסרת איסוף נתונים ב־automated means בלי אישור כתוב מראש; רק דרך Platform APIs הרשמיים (וקבוצות/הודעות כמעט לא חשופות לכך לגיוס לידים) |
| סקרייפינג פרופילים/פוסטים מקבוצות בעלי מקצוע | **לא** | מפר [תנאי שימוש](https://www.facebook.com/terms) סעיף 3.2.3 ו־[Automated Data Collection](https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection/) |
| שליחת WhatsApp Business API / תבניות בלי opt-in | **לא** | [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy): נדרש מספר שניתן ע״י האדם + הסכמה לקבל הודעות |
| פתיחת `wa.me` ידנית מהטלפון האישי שלך לליד שמצאת ממקור חוקי | **כן (מוצר נוכחי)** | אין שליחה אוטומטית מהמערכת; אתה שולח ידנית. עדיין לכבד בקשות «אל תיצור קשר» ודין ספאם ישראלי |
| שותפות / API רשמי עם Meta אחרי אישור | רק עם אישור Meta | לא רלוונטי כרגע |

**מסקנה ל־Fixly:** לא בונים שאיבה משיחות Meta. הגיוס נשאר Places/OSM + הזנה ידנית, ואתה פונה בוואטסאפ ידנית מהטלפון שלך.

## סוכן אוטומטי

- Cron יומי: `GET /api/cron/discover-prospects` (Bearer `CRON_SECRET`) — רשום ב־`vercel.json` ב־07:00 UTC
- הרצה ידנית: כפתור **הרץ גילוי עכשיו** ב־`/superadmin` → `POST /api/admin/prospects/discover`
- לוג ריצות: טבלת `prospect_discovery_runs`
- שאילתות Places מכוונות ל־«מומלץ / נייד / עצמאי / עד הבית» (סגנון מידרג), לא לחנויות קרמיקה

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

## יעד גיוס (ירושלים)

19 קטגוריות בית (כולל **ריצוף וקרמיקה**, שיפוצים, איטום, אלומיניום, גבס, סולאר/דודים, תיקון מכשירים, הדברה, זגגות, ריהוט) × 10 לידים מאומתים = יעד ברירת מחדל.

## Migrations (להחיל על Production)

1. `supabase/migrations/20260909010000_professional_prospects.sql`
2. `supabase/migrations/20260909120000_prospect_discovery_runs.sql`
3. `supabase/migrations/20260909140000_expand_recruit_categories.sql`
4. `supabase/migrations/20260909150000_prospect_fit_score.sql`

## Env נדרש

```bash
ADMIN_EMAILS=you@example.com
CRON_SECRET=long-random
GOOGLE_PLACES_API_KEY=your-places-key
# optional:
# FIXLY_RECRUIT_CITY=ירושלים
# FIXLY_RECRUIT_CATEGORY_SLUGS=plumbing,electricity,...
```
