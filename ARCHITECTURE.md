# FIXLY — FOUNDATION ARCHITECTURE

## Core Principle

Fixly is **not** a generic marketplace and **not** “Uber for trades”.

Fixly is an **execution network**:

1. Real demand arrives from **Bamakor (= BINO)** and business customers
2. Issues unresolved by internal maintenance escalate into Fixly
3. Fixly matches verified professionals by domain, area, availability, price, and objective past performance
4. Private consumers open only after local density is proven

Canonical product rules: [`docs/DIFFERENTIATION.md`](./docs/DIFFERENTIATION.md).

The core system is:

**REQUEST LIFECYCLE MANAGEMENT.**

Everything in the MVP revolves around:
- request creation (partner-first; consumer density-gated)
- assignment / matching
- acceptance
- progress tracking
- completion
- objective performance updates

---

# MVP STACK

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase
- Vercel
- Capacitor (iOS App Store shell) — `docs/MOBILE_APP_STORE.md`, `app-store/CHECKLIST.md`, `npm run mobile:check`

---

# PROJECT STRUCTURE

```txt
/app
/components
/features
/shared
/lib
/hooks
/types
/mock
/styles
```

---

# FOLDER RESPONSIBILITIES

## /app
Routes only.

NO business logic.

---

## /components
Reusable UI primitives.

Examples:
- Button
- Card
- Modal
- Badge
- Input

---

## /features
Feature-based business modules.

Examples:
- requests
- professionals
- categories
- auth

Each feature owns:
- components
- hooks
- actions
- state
- services

---

## /shared
Cross-app contracts.

Examples:
- enums
- constants
- schemas
- validation

---

## /lib
Infrastructure.

Examples:
- supabase
- api
- matching / performance
- regions (consumer density gate)
- utilities
- helpers

---

## /mock
Temporary fake data.

UI must work before backend exists.

---

# DATABASE ENTITIES

## users
Base identity.

## professionals
Professional profile layer + objective performance aggregates.

## categories
Service categories (domain matching).

## requests
Core lifecycle entity (consumer + Bamakor/partner sources).

## request_candidates
Offers / matching outcomes (accept rate source of truth).

## reviews
Secondary trust layer (stars). Not the primary ranking signal.

## launch_regions
City (optional category) open / waitlist / closed for private consumers.

## images
Attachments.

---

# REQUEST STATUS FLOW

```txt
pending
accepted
on_the_way
in_progress
completed
cancelled
```

Partner API maps alternate names in `lib/integrations/bamakor/status-map.ts`.

---

# NAMING RULES

Database:
- snake_case

Frontend:
- camelCase

Examples:

DB:
- created_at
- professional_id

Frontend:
- createdAt
- professionalId

---

# POST-MVP TRACK (aligned to differentiation)

Launch pillars documented in `docs/ROADMAP_LAUNCH.md`:

- Bamakor demand + escalation metadata (primary demand)
- Objective performance scoring + matching
- Density-gated consumer open (`launch_regions`)
- Monetization foundation (`docs/MONETIZATION.md`)
- Google OAuth (`/auth/callback`)
- Scale: filtered Realtime, pagination, rate limits, DB indexes
- Pro waitlist without Midrag scraping (`docs/PRO_OUTREACH.md`)
- App Store shell (`docs/MOBILE_APP_STORE.md`)

Do **not** prioritize generic directory SEO expansion, star-only ranking UX, or nationwide consumer ads before local liquidity.

---

# MVP NON-GOALS

Forbidden for core request lifecycle MVP:

- AI
- Full escrow payments (foundation only)
- Open consumer marketplace without density
- Star-only reputation as the product
- Wallets
- Dynamic pricing auctions
- Premature national scale

---

# DEVELOPMENT RULE

Before building anything:

1. Pass the feature test in `docs/DIFFERENTIATION.md`
2. Check reuse from Naaryo
3. Check reuse / demand path from Bamakor (BINO)
4. Check reuse from OpsBrain
5. Only then build new
