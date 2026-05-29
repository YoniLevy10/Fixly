# BASE44 → Fixly Migration Map

Source: `filly-smart-sync.zip` (Vite + React Router + `@base44/sdk`)  
Target: Fixly (Next.js App Router + TypeScript + Supabase + mock)

## Stack translation

| BASE44 | Fixly |
|--------|-------|
| `src/pages/*.jsx` | `app/**/page.tsx` + `features/**/components` |
| `react-router-dom` | Next.js App Router (`Link`, `useRouter`, `useSearchParams`) |
| `base44.entities.*` | `mock/*` now → `lib/repositories/*` + Supabase later |
| `@/components/ui/*` (shadcn) | Reuse Fixly components or minimal Tailwind primitives |
| `AuthContext` | `lib/auth/auth-provider.tsx` (guest + demo pro + Supabase when configured) |

## Route mapping (MVP)

| BASE44 route | Fixly route | Status |
|--------------|-------------|--------|
| `/` | `/` | ✅ Phase 1 |
| `/professionals` | `/professionals` | ✅ Phase 1 |
| `/professional/:id` | `/professional/[id]` | Phase 2 |
| `/request/new` | `/request/new` | ✅ Phase 2 |
| `/my-requests` | `/my-requests` | ✅ Phase 1 |
| `/tracking/:id` | `/tracking/[id]` | ✅ Phase 1 |
| `/pro-dashboard` | `/pro/dashboard` | ✅ Phase 2 |
| `/profile` | `/profile` | ✅ Phase 2 |
| `/admin` | `/admin` | Exists |

## Out of MVP scope (ARCHITECTURE.md)

Do **not** port unless stubbed:

- Chat (`/chat/:requestId`)
- Notifications (`/notifications`)
- Maps / location tracker
- Payments, subscriptions, coupons, compare
- Wix/Stripe webhooks (`base44/functions/*`)

## Entity mapping

| BASE44 entity | Fixly |
|---------------|-------|
| `Request` | `types/request.ts` + `mock/requests.ts` |
| `Professional` | `types/professional.ts` + `mock/professionals.ts` |
| `Category` | `mock/categories.ts` |
| `Review` | `mock/profile-reviews.ts` (existing) |
| `User` | Supabase auth (later) |

## Request statuses

BASE44 and Fixly MVP align on:

`pending` → `accepted` → `in_progress` → `completed` | `cancelled`

## Folder placement

```
app/           → routes only
components/    → shared UI (layout, home, professionals)
features/      → business modules (requests, professionals)
mock/          → Hebrew seed data from BASE44 mockData.js
shared/        → constants, status labels
```
