# Meta Launch V1 — Jerusalem

## החלטה אסטרטגית

לא משיקים קמפיין ארצי ולא מערבבים שני צדדי מרקטפלייס. מתחילים בירושלים עם שני קמפיינים נפרדים:

1. גיוס בעלי מקצוע — ראשון בזמן, כי בלי היצע אין מוצר.
2. גיוס בקשות מלקוחות — רק אחרי שיש לפחות 20 בעלי מקצוע זמינים ב-3 קטגוריות.

## Campaign A — Professionals

- Objective: Leads / CompleteRegistration
- Landing: `/go/jerusalem-pros`
- Geo: Jerusalem + 20km
- Budget test: ₪80/day for 7 days
- Audiences:
  - Broad local, ages 24–60
  - Interests test only: plumbing, electrician, HVAC, renovation, self-employed
- Success gate: qualified lead ≤ ₪35; activation ≥ 35%
- Stop rule: pause an ad after ₪100 spend with zero qualified leads

### Ads

**A1 — Direct pain**

Primary: אתם בעלי מקצוע בירושלים? במקום לבזבז ערב שלם על חיפוש לקוחות, קבלו פניות שמתאימות לתחום ולאזור שלכם. Fixly מרכזת את הלידים והעבודות במקום אחד. 3 לידים ראשונים בחודש ללא עלות.

Headline: עבודות חדשות באזור שלכם

CTA: Sign Up

**A2 — Outcome**

Primary: יותר עבודות מתאימות, פחות טלפונים שלא מובילים לכלום. מצטרפים לפיילוט Fixly בירושלים ומקבלים פניות לפי תחום, אזור וזמינות.

Headline: מצטרפים מוקדם ל-Fixly

CTA: Learn More

**A3 — Founder-led / UGC script**

Hook: "אם אתם בעלי מקצוע בירושלים, יש לי שאלה: כמה זמן אתם מבזבזים כל שבוע רק כדי למצוא את העבודה הבאה?"

Body: 15–20 seconds showing the request → match → job flow.

Close: "אנחנו פותחים עכשיו את פיילוט Fixly בירושלים. ההצטרפות הראשונית ללא עלות."

## Campaign B — Customers

- Objective: Leads / request completion
- Landing: `/go/jerusalem-repair`
- Geo: Jerusalem only
- Budget test: ₪120/day for 7 days, only after supply gate
- Initial categories: plumbing, electricity, air conditioning
- Success gate: completed request ≤ ₪45; match rate ≥ 80%; time-to-first-response < 15 min
- Stop rule: do not scale if fulfillment fails, even when CPL is cheap

### Ads

**B1 — Pain**

Primary: יש תקלה בבית ואין לכם כוח להתחיל לרדוף אחרי בעלי מקצוע? מספרים ל-Fixly מה צריך, מקבלים התאמות רלוונטיות ועוקבים עד שהעבודה מסתיימת.

Headline: בעל מקצוע בלי מרדף טלפונים

CTA: Get Quote

**B2 — Urgency**

Primary: אינסטלטור, חשמלאי או טכנאי מזגנים בירושלים — בקשה אחת ב-Fixly במקום עשרות טלפונים.

Headline: ספרו מה התקלקל

CTA: Learn More

## Tracking

- Set `NEXT_PUBLIC_META_PIXEL_ID` in Vercel.
- Both landing pages fire PageView.
- CTA clicks fire Lead with `content_name` of customer or professional.
- UTM campaigns:
  - `jerusalem_pros_v1`
  - `jerusalem_customers_v1`
- Before spend, verify Pixel events in Meta Events Manager and confirm the destination conversion flow completes.

## What must be decided before launch

- Meta ad account and Pixel ID
- Daily and total test budget
- WhatsApp/phone owner for lead follow-up
- Exact launch categories and service radius
- SLA: who contacts each lead, within how many minutes

## Hard recommendation

The current business bottleneck is not more software. It is liquidity. Spend the first ₪560 on recruiting supply, not customer demand. Only open the customer campaign once the pilot can reliably fulfill requests.
