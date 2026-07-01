# Platform Features — Growth Playbook Implementation

All three layers from the growth strategy are implemented in code.

## Layer 1 — Quick wins

| Feature | Implementation |
|---------|----------------|
| WhatsApp deep links | `lib/contact/whatsapp-link.ts`, `WhatsAppButton`, tracking screen |
| Response time badge | `avg_response_minutes` on pros, updated on accept |
| Fixly Verified | `is_verified` column, `VerifiedBadge`, admin PATCH |
| Review prompts | Badge on my-requests, cron `/api/cron/review-reminders` |
| SEO city/category | `/services/[city]/[category]` — 48 static pages + sitemap |
| Referral loop | `/api/referrals`, `ReferralSharePanel`, capture on requests |

## Layer 2 — Marketplace core

| Feature | Implementation |
|---------|----------------|
| Job payment (Stripe) | `/api/billing/job-checkout`, webhook `job_payment` |
| 3-pro matching | `request_candidates`, quick request `matchMode`, accept-invite API |
| In-app chat | `messages` table, `/api/requests/[id]/messages`, `RequestChat` |
| Pro availability | `pro_availability_rules`, `/api/pro/availability`, editor UI |

## Layer 3 — Trust & ops

| Feature | Implementation |
|---------|----------------|
| Fixly Guarantee | `FixlyGuaranteeBanner` on tracking + quick request |
| Response KPI | Pros sorted by response time in matching |
| Admin verify | `PATCH /api/admin/professionals/[id]` |

## Migration

Run: `supabase/migrations/20260531300000_platform_features.sql`

## Cron jobs (vercel.json)

- Monthly lead credits reset
- Daily review reminders
