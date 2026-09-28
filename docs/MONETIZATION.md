# Fixly — מודל הכנסות

> **השקה ארצית:** תשלומים **בצד**. כשנחבר כסף — **Grow** (כמו Bino), לא Tranzila.
> פירוט: [`PAYMENTS_GROW.md`](./PAYMENTS_GROW.md) · [`PRODUCTION_NATIONWIDE.md`](./PRODUCTION_NATIONWIDE.md)
>
> תוכנית הנגשה לצרכנים + פירוט 3 מסלולים / עקיפה: [`CONSUMER_ACCESS_PLAN.md`](./CONSUMER_ACCESS_PLAN.md) (סעיף 5).

## עקרון

| קהל | מחיר (השקה) |
|-----|-------------|
| **לקוחות** | חינם תמיד |
| **אנשי מקצוע** | חינם בשלב ההשקה; מאוחר יותר מנוי / ליד / עמלה דרך Grow |

## כש־`NEXT_PUBLIC_FF_MONETIZATION=true`

```text
┌─────────────────────────────────────────────────────────┐
│ 1. מנוי Pro (חודשי)     │ פרופיל מודגש, לידים ללא הגבלה │
│ 2. תשלום לליד          │ כשמאשרים בקשה (אם אין מנוי)   │
│ 3. עמלה על עסקה        │ % רק כשיש תשלום דרך Fixly+Grow │
└─────────────────────────────────────────────────────────┘
```

סליקה: Grow (`GROW_API_KEY`, `GROW_PAGE_CODE`, `GROW_WEBHOOK_SECRET`).

## משתני סביבה (כשמפעילים)

```env
NEXT_PUBLIC_FF_MONETIZATION=true
GROW_API_KEY=...
GROW_PAGE_CODE=...
GROW_WEBHOOK_SECRET=...
GROW_ENV=sandbox
```

Webhook: `https://fixly.tech/api/webhook/grow?token=…`
