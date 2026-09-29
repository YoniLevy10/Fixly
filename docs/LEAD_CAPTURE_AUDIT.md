# Lead capture audit — Fixly (2026-09-29)

Verified against live Supabase project `lfzxvmievofvdhxrwggo`, GitHub `main`, and `https://fixly.tech/api/health`.

## Two real registrants (not waitlist)

Found in `auth.users` / `public.users` — **Google OAuth only**, not `/waitlist` or `/pro/join`:

| Name | Email | Source | Created | Notes |
|------|-------|--------|---------|-------|
| Yoni Levy | levyyoni5@gmail.com | Google (`accounts.google.com`) | 2026-05-29 | Linked to seed demo pro «יוסי כהן»; last sign-in 2026-09-25 |
| OpsBrain | opsbrain1@gmail.com | Google | 2026-09-09 | `user_type=customer`; never signed in again |

Real service requests: **0**.

## `pro_waitlist` — spam / test only

Exactly **2** rows (2026-09-16, 2026-09-20) with random ASCII names/phones/cities. Treat as spam until proven otherwise. **No real customer or pro signup** in this table.

## `professionals` — 4 demo seed profiles

| Title | City | ID pattern |
|-------|------|------------|
| יוסי כהן | תל אביב | `10000000-0000-4000-8000-…0001` |
| דוד לוי | ירושלים | `…0002` |
| מוחמד עבאס | חיפה | `…0003` |
| רחל גרין | תל אביב | `…0004` |

Health: `professionals: 4 rows`, `mock_catalog: ON`. Organic pages must not treat these as real supply.

## Schema gap (before this rebuild)

Live `pro_waitlist` columns were only:
`id, full_name, phone, email, category, city, referral_code, created_at`

Missing in production: `audience`, `source`, `attribution` — so UTM / audience never persisted even when the API sent them.

## Prospects vs registrations

~531 rows in `professional_prospects` (external discovery). `waitlist_id` links: **0**. Keep tables separate; do not merge signup into prospects.

## GA note

User-reported: ~200 sessions and ~29.5% engagement (Aug 30–Sep 28). Measurement must exclude localhost; strategy is **not** capped by that figure.
