# גיוס אנשי מקצוע (Prospects + Superadmin)

**יעד:** מבצעי שירות אצל הלקוח — עצמאים וצוותים קטנים בירושלים (ובהמשך ערים אחרות).  
לא חנויות חומרים, רשתות או מוקדים.

אין הסכם עם מידרג — **אין סקרייפינג ממידרג**.  
אין איסוף מקבוצות פייסבוק / Messenger.

## ממשק

- **[`/superadmin`](../app/superadmin/page.tsx)** — גיוס, תור בדיקה, WhatsApp ידני.
- כניסה: אימייל ב־`ADMIN_EMAILS` או `app_metadata.role=admin`.

## דירוג התאמה (נפרד מסטטוס גיוס)

| שדה | משמעות |
|-----|--------|
| `fit_class` | `suitable` / `needs_review` / `unsuitable` / `unknown` |
| `fit_confidence` | 0–100 (כיול, לא מדע מדויק) |
| `fit_reasons` | סיבות קריאות |
| `contactability` | `mobile` / `landline` / `unknown` / `none` — **לא** קובע התאמה מקצועית |

- מילים כמו «שירותי / התקנות / מערכות / פתרונות» **אינן** פוסלות אוטומטית.
- שם ו־businessName זהים לא מקבלים קנס כפול.
- שמות בעברית, ערבית ואנגלית נתמכים.
- נייד ≠ WhatsApp מאומת.

משקלים ב־[`lib/prospects/config.ts`](../lib/prospects/config.ts) (`FIT_WEIGHTS`).

## מקורות גילוי

| מקור | Env |
|------|-----|
| Google Places API (New) | `GOOGLE_PLACES_API_KEY` |
| OpenStreetMap Overpass | — |
| ידני / CSV | — |

### Places — מה מופעל

- `includePureServiceAreaBusinesses: true`
- Pagination עם `pageToken` / `nextPageToken` (חובה ב־FieldMask)
- תקציב **קריאות API**: `FIXLY_DISCOVERY_API_CALL_BUDGET` (ברירת מחדל 80)
- תקציב תוצאות גולמיות: `FIXLY_DISCOVERY_TOTAL_BUDGET` (1200)
- תור שאילתות עם רוטציה לפי `prospect_query_stats` (~15% ניסוי)
- שאילתות HE / AR / EN + שכונות ירושלים; שאילתות פשוטות (לא תמיד «מומלץ/נייד»)
- FieldMask מינימלי: id, displayName, address, phones, website, maps, types, pureServiceAreaBusiness, nextPageToken  
  (שדות Enterprise כמו ביקורות/תמונות **לא** נמשכים — עלות גבוהה יותר)

### גאוגרפיה

- פרופיל עיר ב־`getCityGeoProfile` — שינוי `FIXLY_RECRUIT_CITY` (+ אופציונלי `FIXLY_RECRUIT_CITY_LAT/LNG/RADIUS_M`) משנה bbox/bias.
- `business_address` / `search_city` נשמרים בנפרד; **אין** סימון אוטומטי של אזור שירות מאומת רק כי הופיע בשאילתה.

### גילוי מצטבר

- ברירת מחדל: **ללא מחיקה** (`replacePrevious=false`).
- כפילות → מיזוג (קטגוריות נוספות, fit, last_seen) בלי לדרוס `rejected` / DNC / contacted+.
- נעילה אם יש ריצה ב־`status=running`.

## WhatsApp

1. **פתח WhatsApp** → `contact_link_opened` בלבד (לא `contacted`).
2. **סימנתי שנשלח** → `POST .../contact/confirm` → `contacted`.

אין שליחה אוטומטית.

## מיגרציות

1. `20260909010000_professional_prospects.sql`
2. `20260909120000_prospect_discovery_runs.sql`
3. `20260909140000_expand_recruit_categories.sql`
4. `20260909150000_prospect_fit_score.sql`
5. **`20260909160000_prospect_fit_quality.sql`** — fit_class, contactability, categories junction, sightings, query_stats

## משתני סביבה

| מפתח | תיאור |
|------|--------|
| `GOOGLE_PLACES_API_KEY` | חובה לגילוי Places |
| `ADMIN_EMAILS` | גישת Superadmin |
| `FIXLY_RECRUIT_CITY` | ברירת מחדל ירושלים |
| `FIXLY_RECRUIT_CITY_LAT/LNG/RADIUS_M` | גאו לעיר שאינה ירושלים |
| `FIXLY_DISCOVERY_TOTAL_BUDGET` | תוצאות גולמיות |
| `FIXLY_DISCOVERY_API_CALL_BUDGET` | קריאות Places לריצה |
| `FIXLY_DISCOVERY_PER_CATEGORY_CAP` | תקרת שמירה לקטגוריה |
| `FIXLY_RECRUIT_CATEGORY_SLUGS` | אופציונלי, CSV של slugs |

## מדידת לפני/אחרי (מדגם 100)

1. ייצוא CSV לפני השדרוג (או snapshot).
2. הרצת גילוי מצטבר אחרי דיפלוי + מיגרציה.
3. ייצוא כולל `fit_class`, `fit_reasons`, `contactability`.
4. סימון ידני של 100: TP/FP ל־suitable, ודיוק על unsuitable שנדחו.
5. השוואת: ייחודיים חדשים מתאימים / קריאות API / זמן סינון ידני.

## מה לא אומת מול שירות חי במסגרת הפיתוח

- תגובות אמיתיות של Google Places / Overpass בפרוד
- עלות חיוב מדויקת בחשבון Google (מוצג רק מספר קריאות / הערכה מסומנת)
- דיוק השאילתות הערביות מול תוצאות מקומיות
