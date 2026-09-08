# גיוס אנשי מקצוע (Prospects)

אין הסכם עם מידרג — **אין סקרייפינג או ייבוא אוטומטי ממידרג**.
אין איסוף מקבוצות פייסבוק פרטיות ואין עקיפת תנאי שימוש.

## מה קיים במערכת

1. **הצטרפות עצמית** — [`/pro/join`](../app/pro/join/page.tsx) שומרת ב־`pro_waitlist` דרך `/api/pro/waitlist`.
2. **מנוע לידים** — טבלת `professional_prospects` (נפרדת מ־`professionals`).
3. **ממשק ניהול** — [`/admin/prospects`](../app/admin/prospects/page.tsx):
   - מונים לפי סטטוס / קטגוריה / עיר
   - חיפוש וסינון
   - אישור / דחייה / אין ליצור קשר
   - קישור WhatsApp ידני (`wa.me`) רק אחרי אישור
   - ייבוא / ייצוא CSV
   - עדכון סטטוס מרובה (ללא שליחת הודעות)
4. **Audit** — `professional_prospect_events` לכל יצירה, שינוי סטטוס ויצירת קשר.

## משפך סטטוסים

`discovered → verified → approved → contacted → interested → joined → active`

בנוסף: `rejected`, `do_not_contact`.

## מקורות (v1)

- הזנה ידנית בממשק הניהול
- ייבוא CSV ממקורות מורשים בלבד
- Adapter אחיד ב־`lib/prospects/adapters` לחיבור APIs עתידיים

## WhatsApp

אין שליחה אוטומטית. המנהל פותח `wa.me` עם הודעת גיוס אמינה.
מספר בקשות מתווסף להודעה **רק** אם יש ספירה אמיתית של בקשות פעילות מתאימות בקטגוריה ובעיר.

## קישור להצטרפות

כאשר איש מקצוע נרשם ב־`/pro/join` עם אותו מספר טלפון כמו ליד קיים:
- הליד מתעדכן ל־`joined`
- נשמר `waitlist_id` / `consent_at`
- **לא** נוצרת רשומת `professionals` כפולה

כשפרופיל נתבע (`/api/pro/claim`) עם טלפון תואם — הליד יכול לעבור ל־`active`.

## אבטחה

- RLS על טבלאות הלידים
- הרשאת admin דרך `app_metadata.role` או `ADMIN_EMAILS` (לא `user_metadata`)
- Service-role רק בצד שרת
- Rate limiting על יצירה / ייבוא / bulk / contact

## יעד תפעולי

ירושלים + ~10 אנשי מקצוע מאומתים לכל אחת מ־10 הקטגוריות המרכזיות (דינמי דרך env / `service_categories`).

## Migration

`supabase/migrations/20260909010000_professional_prospects.sql` — **לא להחיל על Production בלי אישור מפורש**.
