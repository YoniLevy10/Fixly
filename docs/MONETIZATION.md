# Fixly — מודל הכנסות (החלטה רשמית)

> **לא הייתה החלטה חד-משמעית בקוד עד עכשיו.** בשיחה הומלץ על שילוב פרגמטי; המסמך הזה קובע את כיוון המימוש.

## עקרון

| קהל | מחיר |
|-----|------|
| **לקוחות** | חינם תמיד (גידול והמרה) |
| **אנשי מקצוע** | משלמים — מנוי, לידים, ו/או עמלה על עסקה |

## מודל מומלץ (3 מסלולים — משולבים)

```text
┌─────────────────────────────────────────────────────────┐
│ 1. מנוי Pro (חודשי)     │ פרופיל מודגש, לידים ללא הגבלה │
│ 2. תשלום לליד          │ כשמאשרים בקשה (אם אין מנוי)   │
│ 3. עמלה על עסקה        │ % רק כשיש תשלום דרך Fixly      │
└─────────────────────────────────────────────────────────┘
```

### שלב השקה (עכשיו — בקוד)

- **פיילוט:** 3 לידים חינם לכל Pro (`lead_credits`), אחר כך חיוב לליד בקבלה (`accepted`).
- **מנוי Pro:** 149 ₪/חודש (מוגדר ב-`lib/monetization/config.ts`) — דף `/pro/pricing`, Stripe כשמוגדר.
- **עמלה:** 10% מסכום שדווח ב-`quoted_amount` כשהבקשה `completed` (רישום ב-`billing_events`; גבייה ב-Stripe בשלב 2).

### שלב 2 (אחרי Stripe)

- Checkout למנוי + Payment Intent ללידים.
- Webhook מעדכן `subscription_until` ו-`lead_credits`.

### שלב 3

- Escrow, אחריות, תמחור לפי קטגוריה/עיר.

## נקודת מדידה

**עסקה לחיוב עמלה** = `requests.status = completed` **ו** `quoted_amount` מולא **ו** (בעתיד) `paid_at` דרך Fixly.

## משתני סביבה

```env
NEXT_PUBLIC_FF_MONETIZATION=true
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PRICE_PRO_MONTHLY=price_...
```

## טבלאות

ראה `supabase/migrations/20260530100000_monetization.sql`.
