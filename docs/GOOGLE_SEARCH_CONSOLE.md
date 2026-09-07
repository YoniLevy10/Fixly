# Google Search Console — Fixly.tech

מדריך קצר לחיבור הדומיין `fixly.tech` ל-Google Search Console ולדחיפת תנועה אורגנית.

## 0. דומיינים — נחיתה מול מערכת

| דומיין | מה מוצג ב-`/` |
|--------|----------------|
| `https://fixly.tech` | דף נחיתה / הרשמה מוקדמת |
| `https://*.vercel.app` | המערכת המלאה (marketplace) |
| `localhost` | המערכת (פיתוח) |

`/waitlist` זמין תמיד. אחרי השקה מלאה: `NEXT_PUBLIC_FF_PRELAUNCH=false`.

מומלץ להגדיר גם:
- `NEXT_PUBLIC_APP_URL=https://fixly.tech` (SEO / GSC)
- `NEXT_PUBLIC_PRODUCT_URL=https://YOUR-PROJECT.vercel.app` (קישור למערכת)

## 1. חברו את הדומיין ב-Vercel

1. Vercel → Project → **Settings → Domains**
2. הוסיפו `fixly.tech` ו-`www.fixly.tech`
3. העתיקו את רשומות ה-DNS לספק הדומיין (A / CNAME לפי ההוראות)
4. המתינו עד שסטטוס הדומיין ירוק

## 2. משתני סביבה ב-Vercel

| משתנה | ערך |
|--------|------|
| `NEXT_PUBLIC_APP_URL` | `https://fixly.tech` |
| `NEXT_PUBLIC_PRODUCT_URL` | `https://YOUR-ALIAS.vercel.app` (אופציונלי) |
| `NEXT_PUBLIC_FF_PRELAUNCH` | `true` (עד להשקה מלאה; vercel.app עדיין מציג את האפליקציה) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | טוקן האימות מ-GSC (ראו למטה) |
| `NEXT_PUBLIC_FF_ANALYTICS` | `true` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-…` (מומלץ יחד עם GSC) |

אחרי שינוי env — Redeploy.

## 3. אימות בעלות ב-Google Search Console

1. היכנסו ל-[Google Search Console](https://search.google.com/search-console)
2. **Add property** → בחרו **URL prefix** → `https://fixly.tech`
3. בחרו שיטת **HTML tag**
4. העתיקו רק את ערך `content="…"` מהמטא־תג
5. שימו אותו ב-`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` ב-Vercel
6. Redeploy → חזרו ל-GSC ולחצו **Verify**

חלופה (DNS): רשומת TXT אצל ספק הדומיין — לא דורשת שינוי בקוד.

## 4. Sitemap ו-robots

אחרי שהאתר חי על `fixly.tech`:

- Sitemap: `https://fixly.tech/sitemap.xml`
- Robots: `https://fixly.tech/robots.txt`

ב-GSC: **Sitemaps** → הוסיפו `sitemap.xml` → Submit.

## 5. מה האתר כבר מגיש לגוגל

- מטא־תגיות בעברית + Open Graph
- `metadataBase` על `fixly.tech`
- JSON-LD מסוג Organization + FAQPage ב-`/waitlist`
- עמוד נחיתה `/` (במצב prelaunch) + `/waitlist`
- עמודי SEO קיימים: `/services/[city]/[category]`
- אירועי funnel: page view, CTA, signup start/complete, scroll depth (דרך GA4 כשמופעל)

## 6. אחרי האימות — פעולות מומלצות

1. **URL Inspection** על `https://fixly.tech` → Request indexing
2. חברו **GA4** לאותו נכס (או דרך GSC ↔ GA link)
3. עקבו אחרי **Performance** למילות מפתח בעברית (תיקונים, אינסטלטור, בעל מקצוע וכו׳)
4. כשהפלטפורמה נפתחת: `NEXT_PUBLIC_FF_PRELAUNCH=false` ושמרו על `/waitlist` כהפניה או הסתירו מהניווט

## 7. מיגרציית Waitlist

להרצה על Supabase production:

```bash
# דרך Supabase CLI / Dashboard SQL
# קבצים:
#   supabase/migrations/20260903130000_waitlist_audience.sql
#   supabase/migrations/20260903140000_waitlist_attribution.sql
```

מוסיף:
- `audience` (`customer` | `professional`) ו-`source`
- `attribution` (JSONB) לשמירת UTM על כל ליד
