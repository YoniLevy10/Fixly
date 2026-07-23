# Fixly — Repository Status (Phase 1 kickoff)

Last inspected: 2026-07-23  
Branch baseline: `main` (`YoniLevy10/Fixly`)

## What Fixly is today

Fixly is a **Hebrew-first maintenance marketplace** (Next.js App Router + Supabase + Vercel + Capacitor iOS shell). The product core is **request lifecycle management**, not a generic social feed.

Primary users already modeled:
- Customers who create service requests
- Professionals (pros) who accept / progress jobs
- Admins / waitlist / monetization hooks

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16, React 19, TypeScript, Tailwind |
| Data | Supabase (Postgres + Auth + Realtime + Storage) |
| Deploy | Vercel |
| Mobile | Capacitor iOS |
| Payments | Stripe (optional feature flag) |
| Monitoring | Sentry (optional) |

## Existing domain map (vs brief entities)

| Brief entity | Existing Fixly artifact | Notes |
|--------------|-------------------------|--------|
| Category | `service_categories` | Slugs: plumbing, electricity, ac, cleaning, … Missing: elevators, pest_control, general |
| Provider | `professionals` | Single `category_id` + `city` + `available`; phone/WhatsApp columns exist |
| Service area | `professionals.city` | No radius/polygon table yet |
| Job / Order | `requests` | Statuses: pending → accepted → on_the_way → in_progress → completed \| cancelled |
| Offer / Assignment | `request_candidates` | Multi-match invites; first accept wins via `/api/requests/[id]/accept-invite` |
| Job status events | — | **Missing** — no audit/timeline table |
| External source (Bamakor) | — | **Missing** — no `source` / ticket / callback columns |

## Matching (already present)

`lib/matching/find-candidates.ts`:
1. `available = true`
2. Optional `category_id` equality
3. Optional city `ilike`
4. Prefer verified + faster `avg_response_minutes` + rating
5. Top N (default 3)

Consumer create path: `POST /api/requests` with `matchMode` inserts candidates.

## API surface (pre–Phase 1)

- `GET/POST /api/requests`, `GET/PATCH /api/requests/[id]`
- `POST /api/requests/[id]/accept-invite`
- `GET /api/categories`, `GET/POST /api/professionals`, …
- **No** `/api/v1/jobs` and **no** outbound Bamakor webhook

## Auth / ops today

- End-user: Supabase Auth (email / Google OAuth)
- Server admin: `SUPABASE_SERVICE_ROLE_KEY`
- Cron: `CRON_SECRET`
- **No** inter-service API key for Bamakor yet

## Gaps vs Phase 1 brief

1. Bamakor integration contract (`POST/GET /api/v1/jobs` + signed status webhooks)
2. External ticket / callback fields on jobs
3. `request_events` timeline for callbacks
4. Category seed for elevators / pest / general (+ slug aliases electrical→electricity, hvac→ac)
5. Documented env: `FIXLY_API_KEYS`, `BAMAKOR_WEBHOOK_SECRET`
6. Smoke path: seed → 2 pros → create job → offers → accept → webhook payload

## Design decision for Phase 1

**Map jobs onto `requests` + offers onto `request_candidates`** (do not duplicate tables).  
Add Bamakor columns + `request_events`, expose a clean `/api/v1/*` boundary, and map Bamakor-facing statuses (`open` / `offered` / `en_route` / …) in the API layer while keeping the consumer app on existing Fixly statuses where possible.

Hard rule honored: **no Bamakor repo changes**.

## Independent marketplace (usable without Bamakor)

Existing consumer + pro flows already create/match/accept requests. Phase 1 keeps that path and adds an API-key job ingress for Bamakor (and future partners) that reuses the same matching engine.
