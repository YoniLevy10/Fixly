# גיוס אנשי מקצוע (Prospects + Superadmin)

**יעד:** מבצעי שירות אצל הלקוח — עצמאים וצוותים קטנים בירושלים (ובהמשך ערים אחרות).  
לא חנויות חומרים, רשתות או מוקדים.

אין הסכם עם מידרג — **אין סקרייפינג ממידרג**.  
אין איסוף מקבוצות פייסבוק / Messenger.  
אין סקרייפינג מ־B144 / דפי זהב / איזי.  
**אין מקורות בתשלום** (Brave / D&B / מדריכים מסחריים) — רק API שכבר בשימוש, OSM, ו־open data ממשלתי.

## ממשק

- **[`/superadmin`](../app/superadmin/page.tsx)** — גיוס, תור בדיקה, WhatsApp ידני.
- כניסה: אימייל ב־`ADMIN_EMAILS` או `app_metadata.role=admin`.

## דירוג התאמה (נפרד מסטטוס גיוס)

| שדה | משמעות |
|-----|--------|
| `fit_class` | `suitable` / `needs_review` / `unsuitable` / `unknown` |
| `fit_confidence` | 0–100 |
| `fit_reasons` | סיבות קריאות |
| `contactability` | `mobile` / `landline` / `unknown` / `none` |
| `website_url` | אתר עסקי (לא Maps) |
| `source_refs` | מקורות מרובים שמוזגו לרשומה אחת |
| `license` | ראיית רישוי (פיילוט מדבירים) |

משקלים ב־[`lib/prospects/config.ts`](../lib/prospects/config.ts).

## מקורות גילוי (חינם / קיים)

| מקור | Env / הערה |
|------|------------|
| Google Places API (New) | `GOOGLE_PLACES_API_KEY` — אם כבר מופעל אצלכם |
| OpenStreetMap Overpass | חינם — מדוד `uniqueToSource` בכרטיס ריצה |
| מאגר מדבירים מורשים | data.gov.il CKAN (`gov_pest_control`) — open data |
| ידני / CSV | — |

### מאגר מדבירים (פיילוט רישוי)

- Resource id: `4941fd97-9f9f-4e45-b117-9f71735e9845` (חבילת `madbirim`).
- שדות: LicenseNumber, FirstName, LastName, settlement, Telephone, LicenseType, Status, PermitExpirationDate.
- סינון ירושלים + יישובי מטרופולין; `license` נשמר על הרשומה.

### מיזוג בין מקורות

סדר dedupe: טלפון → דומיין אתר → source+externalId → שם+קטגוריה+עיר.  
מיזוג ממלא `source_refs`, `website_url`, `license` חזק יותר, בלי לדרוס סטטוסים מוגנים.

### גילוי מצטבר

- ברירת מחדל: **ללא מחיקה** (`replacePrevious=false`).
- נעילה אם יש ריצה ב־`status=running`.

## מקורות בתשלום — לא מיושמים

לא קונים Brave / B144 / דפי זהב / איזי / D&B.  
אם בעתיד ייבחן מקור מסחרי — רק אחרי מדגם 50 בירושלים (חדשים, פעילים, שירות בבית, קשר שימושי).

## WhatsApp

1. **פתח WhatsApp** → `contact_link_opened` בלבד.
2. **סימנתי שנשלח** → `POST .../contact/confirm` → `contacted`.

## מיגרציות

1. `20260909010000_professional_prospects.sql`
2. `20260909120000_prospect_discovery_runs.sql`
3. `20260909140000_expand_recruit_categories.sql`
4. `20260909150000_prospect_fit_score.sql`
5. `20260909160000_prospect_fit_quality.sql`
6. **`20260909180000_prospect_source_refs_license.sql`** — website_url, source_refs, license

## משתני סביבה

| מפתח | תיאור |
|------|--------|
| `GOOGLE_PLACES_API_KEY` | גילוי Places (אופציונלי אם כבר יש) |
| `ADMIN_EMAILS` | גישת Superadmin |
| `FIXLY_RECRUIT_CITY` | ברירת מחדל ירושלים |
| `FIXLY_DISCOVERY_TOTAL_BUDGET` | תוצאות גולמיות |
| `FIXLY_DISCOVERY_API_CALL_BUDGET` | קריאות Places |

## מדידת לפני/אחרי

1. ייצוא CSV + הריצו גילוי אחרי מיגרציה.
2. השוו `uniqueToSource` ל־OSM / Places / מאגר מדבירים.
3. מדגם 100 לדיוק fit.
