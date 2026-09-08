# Fixly — Repository Status

Last updated: 2026-09-08  
On branch work aligned to execution-network differentiation (Bamakor / BINO demand-first).

## Product

Fixly = Hebrew-first **execution network** for maintenance jobs (not an open marketplace).  
Primary demand: **Bamakor (= BINO)** + business customers; unresolved internal maintenance escalates into Fixly.  
Private consumers open only after local density (`launch_regions`).

Canonical rules: [`docs/DIFFERENTIATION.md`](./docs/DIFFERENTIATION.md).

Bamakor = separate building-ops SaaS; integration is **API + webhook only** (no shared DB).

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind · Supabase · Vercel · Capacitor iOS

## Domain map (single source of truth)

| Concept | Table / module |
|---------|----------------|
| Category | `service_categories` |
| Provider | `professionals` (+ performance aggregates) |
| Job | `requests` (+ Bamakor / escalation columns) |
| Offer | `request_candidates` |
| Events / webhook audit | `request_events` |
| Matching | `lib/matching/find-candidates.ts` (**one engine**) |
| Performance | `lib/matching/performance-score.ts`, `update-performance.ts` |
| Consumer density | `launch_regions` + `lib/regions/consumer-access.ts` |
| Partner façade | `lib/integrations/bamakor/*` + `/api/v1/jobs/*` |
| Consumer API | `/api/requests*` (density-gated) |

## What Phase 1–2 added (Bamakor)

- `POST/GET /api/v1/jobs`, `POST …/accept`, `POST …/cancel`, `PATCH …/status`
- API-key auth (`FIXLY_API_KEYS`), signed outbound webhooks + 3 retries
- Migration `20260723210000_bamakor_integration.sql`
- Docs: `docs/BAMAKOR_INTEGRATION.md`, `docs/BAMAKOR_NEXT_STEPS.md`
- Smoke: `npm run smoke:phase1` (memory store → real modules)
- Tests: `npm run test:unit`

## Status naming (not duplicated product state)

| Partner API | Fixly DB / consumer UI |
|-------------|------------------------|
| `open` / `offered` | `pending` |
| `en_route` | `on_the_way` |
| `accepted` / `in_progress` / `completed` / `cancelled` | same |
| `no_providers` / `expired` / `rejected_by_all` | same (partner jobs) |

Mapped only in `lib/integrations/bamakor/status-map.ts`.

## Assignment naming

| Partner `assignment_mode` | Internal `match_mode` |
|---------------------------|------------------------|
| `broadcast_first_accept` | `multi` |
| `manual_select` | `multi` |

Helper: `lib/integrations/bamakor/assignment.ts`

## Still later (Bamakor repo — not here)

1. Button «שלח ל-Fixly» (escalation from unresolved internal maintenance)
2. Thin `POST` to Fixly `/api/v1/jobs` with escalation fields
3. Webhook receiver at the `callback_url`

## Ops

See `.env.example`: `FIXLY_API_KEYS`, `BAMAKOR_WEBHOOK_SECRET`, `FIXLY_WEBHOOK_DRY_RUN`, `FIXLY_JOBS_STORE`.
