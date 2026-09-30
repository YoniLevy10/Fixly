# צ׳קליסט שבועי — GSC מול יעד 10 הרשמות

מבוסס על [`GSC_GROWTH_PLAN.md`](./GSC_GROWTH_PLAN.md) ו־[`MONTHLY_SIGNUP_GOAL.md`](./MONTHLY_SIGNUP_GOAL.md).  
מריצים **פעם בשבוע** (מומלץ יום קבוע) — כ־15 דקות.

## 1) מוצר — יעד 10

- [ ] לפתוח `/admin` → כרטיס `signupGoal`
- [ ] לרשום: הרשמות השבוע / מצטבר לחודש / פיצול לקוח vs מקצוען
- [ ] לוודא שאין ספאם / `smoke_*` בספירה
- [ ] אם מאחורי קצב (פחות מ־~2.5/שבוע): להגביר outreach + Meta לפי [`ACQUISITION_URLS.md`](./ACQUISITION_URLS.md)

## 2) Google Search Console — Performance

ייצוא או צילום מסך ל־7 הימים האחרונים:

| מדד | ערך השבוע | הערה |
|-----|-----------|------|
| הופעות | | יעד שלב A: ≥50/שבוע |
| קליקים | | |
| CTR | | |
| מקום ממוצע על `fixly` | | יעד ≤1.5 |
| שאילתות כוונה חדשות (לא מותג) | | יעד שלב B: ≥3 |
| הופעות `/waitlist` | | יעד שלב B: ≥20 |

- [ ] לסנן ישראל בלבד (לא ארה״ב)
- [ ] לסמן שיבושי הקלדה (`flixly`) — לא להשקיע תוכן

## 3) Coverage / Indexing

- [ ] URL Inspection על `/`, `/waitlist`, `/about` אם עדיין לא באינדקס
- [ ] Sitemap submitted: `https://fixly.tech/sitemap.xml`
- [ ] לדחות / להסיר `*.vercel.app` אם מופיעים
- [ ] לבדוק שדפי `/services/...` בלי ערך נשארים `noindex`

## 4) שער ערך לדפי services

פתיחת אינדקס רק אם:

1. ≥1 בעל מקצוע אמיתי בעיר×קטגוריה, **או**
2. ≥3 הרשמות `audience=customer` לאותה עיר ב־`pro_waitlist`

קוד: [`lib/seo/has-seo-value.ts`](../lib/seo/has-seo-value.ts)

- [ ] אם יש עיר שעברה את הסף — לוודא Request indexing לדף הראשון
- [ ] אם אין — לא לפתוח דפי תבנית; להמשיך גיוס ל־waitlist

## 5) המרה אורגנית

- [ ] CTA בית → waitlist עובד (`home-waitlist-cta`)
- [ ] `/about` מקשר ל־waitlist
- [ ] ב־GA4 (אם פעיל): סינון `utm_medium=organic` מול הרשמות

## 6) סיכום השבוע (שורה אחת)

```
שבוע YYYY-MM-DD | הרשמות: N/10 | הופעות: X | כוונה חדשה: כן/לא | פעולה הבאה: …
```

שמרו את השורה ב־Notion / Slack / הערת admin — לא חובה בקוד.
