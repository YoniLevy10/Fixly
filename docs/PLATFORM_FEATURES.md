# Platform Features — Execution Network

Aligned to [`DIFFERENTIATION.md`](./DIFFERENTIATION.md). Features exist to strengthen local liquidity, match quality, trust, and job economics — not to become a generic marketplace.

## Layer 1 — Quick wins

| Feature | Implementation |
|---------|----------------|
| WhatsApp deep links | `lib/contact/whatsapp-link.ts`, `WhatsAppButton`, tracking screen |
| Response time badge | `avg_response_minutes` on pros, updated on accept |
| Fixly Verified | `is_verified` column, `VerifiedBadge`, admin PATCH |
| Review prompts | Badge on my-requests, cron `/api/cron/review-reminders` (secondary signal) |
| Referral loop | `/api/referrals`, `ReferralSharePanel`, capture on requests |

## Layer 2 — Matching & lifecycle

| Feature | Implementation |
|---------|----------------|
| Job payment (Stripe) | `/api/billing/job-checkout`, webhook `job_payment` |
| Multi-pro matching | `request_candidates`, quick request `matchMode`, accept-invite API |
| Objective performance | `performance_score` + aggregates on `professionals` |
| In-app chat | `messages` table, `/api/requests/[id]/messages`, `RequestChat` |
| Pro availability | `pro_availability_rules`, `/api/pro/availability`, editor UI |
| Density gate | `launch_regions`, `lib/regions/consumer-access.ts` |

## Layer 3 — Trust & ops

| Feature | Implementation |
|---------|----------------|
| Fixly Guarantee | `FixlyGuaranteeBanner` on tracking + quick request |
| Performance ranking | Matching sorts by `performance_score` then verified / response |
| Admin verify | `PATCH /api/admin/professionals/[id]` |
| Admin regions | `PATCH /api/admin/launch-regions` |
| Bamakor demand | `/api/v1/jobs` + escalation fields |

## Migration

Run platform + differentiation migrations under `supabase/migrations/`.

## Cron jobs (vercel.json)

- Monthly lead credits reset
- Daily review reminders
