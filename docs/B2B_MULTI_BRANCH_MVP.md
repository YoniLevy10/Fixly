# Fixly B2B Multi-Branch MVP — Optical Center Pilot

**Status:** planning only (no feature build in this doc)  
**Date:** 2026-09-22  
**Pilot customer:** Optical Center  
**Product role:** Fixly = on-demand skilled labor / execution network for multi-branch businesses

Canonical product rules still apply: [`DIFFERENTIATION.md`](./DIFFERENTIATION.md).  
This is the **business-customers** demand path already named there — Optical Center is the first concrete tenant, not a parallel product.

---

## 1. Business problem (compressed)

Optical Center has stores nationwide. When a store has a fault, they need a suitable local pro fast — reliable, available, fair price — and the **maintenance manager must not chase** parties. Fixly should run the loop between Fixly ↔ pro ↔ store; the manager gets transparency and intervenes only on exceptions.

Optical Center is **customer #1**. The model must generalize to any multi-branch business (retail chains, clinics, banks, etc.).

---

## 2. Desired end-to-end flow

```text
Store opens service call
  → fault type + location + urgency + notes/photos
  → Fixly matches local pros
  → ranks (trade, distance, availability, price band, rating, performance)
  → dispatches invites
  → first suitable accept wins
  → store coordination (time / access / on-site contact)
  → pro arrives → works → uploads photos + report
  → store confirms
  → job closes
  → manager notified only on exceptions
```

Four MVP pillars: **Matching · Availability · Dispatch · End-to-End Workflow**.

---

## 3. Audit — what already exists (reuse)

### 3.1 Matching — largely ready

| Asset | Path | Reuse |
|-------|------|--------|
| Single matching engine | `lib/matching/find-candidates.ts` | **Must remain the only engine** |
| Performance ranking | `lib/matching/performance-score.ts` | Domain/area/availability/price + objective score |
| Price estimate band | `lib/estimate/price-estimate.ts` | Soft price fit in rank |
| Multi-offer rows | `request_candidates` | Invite set for broadcast |
| Partner create → match | `lib/integrations/bamakor/jobs-service.ts` | Same create/match/invite path |

**Today’s filters:** `available=true` → optional `category_id` → city `ILIKE` → optional weekly slot → rank by performance + price fit (default top 3; Bamakor top 5).

### 3.2 Availability — partial

| Asset | Path | Reuse |
|-------|------|--------|
| Weekly rules table | `pro_availability_rules` | Keep |
| Match helper | `lib/matching/availability-match.ts` | Keep |
| Pro editor API/UI | `/api/pro/availability`, `ProAvailabilityEditor` | Keep |
| Hard flag | `professionals.available` | Keep |
| Capacity helper | `services/professionals/professional-availability-service.ts` | Exists but **not wired** |

Partner/Bamakor create currently **does not** pass preferred date/time → weekly rules often skipped on B2B jobs.

### 3.3 Dispatch — spine ready, delivery weak

| Asset | Path | Reuse |
|-------|------|--------|
| `broadcast_first_accept` | `lib/integrations/bamakor/assignment.ts` | Primary OC mode |
| Invite + first-accept | `request_candidates` + `/api/requests/[id]/accept-invite` | Keep |
| Partner accept | `/api/v1/jobs/[id]/accept` | Keep |
| Push notify | `lib/push/notify-invited-professionals.ts` | Keep |
| WhatsApp deep links | `lib/contact/whatsapp-link.ts` | Built, but invite path only **logs** WA as fallback |

`manual_select` is stored but has **no manager-pick UI/API** — do not depend on it for MVP.

### 3.4 End-to-end workflow — consumer-complete, B2B half-open

| Asset | Path | Reuse |
|-------|------|--------|
| Status machine | `shared/constants/request-status.ts`, `lib/guards/request-transition.ts` | Core lifecycle |
| Partner status map | `lib/integrations/bamakor/status-map.ts` | External API names |
| Partner Jobs API | `/api/v1/jobs*` | **Primary OC integration surface** |
| Signed webhooks | `lib/integrations/bamakor/webhook.ts` | Status callbacks to OC |
| Escalation metadata | Bamakor schema columns | Map to “needs manager” later |
| Live tracking | `/tracking/[id]`, location API | Pro → store visibility |
| Chat | `RequestChat`, messages API | Needs identity for store (today assumes Fixly `customer_id`) |
| Create-time images | upload + `media_urls` on partner create | Inbound evidence only |
| Pro complete | Pro dashboard → `completed` | **No store confirmation gate** |
| Reviews / payment | ReviewForm, JobPaymentButton | Secondary for B2B MVP |

### 3.5 Closest existing product shape

Bamakor (= BINO) is already “business demand → Fixly execution network”:

- Fixly owns matching/dispatch
- Partner owns the originating ticket
- API + webhook only (no shared DB)
- Partner jobs bypass consumer `launch_regions`

**Optical Center should ride the same partner spine**, not a second jobs stack.

Brand UI already references Optical Center patterns in splash/login (`components/brand/*`) — visual kinship only; no OC domain model yet.

---

## 4. Gap analysis vs MVP needs

| Need | Exists? | Gap for MVP |
|------|---------|-------------|
| Fault → trade category | Categories exist | Map OC fault taxonomy → Fixly category keys (config, not new engine) |
| Local pro by store | City ILIKE only | MVP: seed pros with correct `city` per store region. Phase 2: lat/lng radius / service areas |
| Urgency | `priority` stored | Unused in matching; MVP: use for invite size + accept timeout / rebroadcast |
| Know who can take work now | `available` + weekly rules | Pass preferred window on B2B create; for `urgent`, prefer `available=true` and widen invite set |
| Fast outreach | Push + WA link | **Must actually send** WhatsApp/SMS for unclaimed / no-push pros |
| First accept wins | Yes | Keep `broadcast_first_accept` |
| Store coordination | Chat/tracking assume consumer user | Magic-link store portal **or** OC UI via webhooks + thin status page |
| Pro evidence at close | Create-time media only | Completion photos + short report required before store confirm |
| Store confirms close | Missing | New gate: `pending_confirmation` → store confirm → `completed` |
| Manager exception-only | Escalation fields + admin counts | Exception queue: no match, all declined, stuck SLA, disputed confirm |
| Multi-branch org | Only Bamakor `external_client_id` / building fields | Thin `business_accounts` + `business_locations` (generic), OC as first tenant |
| Not OC-only | Partner API is Bamakor-named | Generalize `source` / docs to `partner` / `business`; keep Bamakor as one source |

---

## 5. Architecture principle

```text
┌─────────────────────────────────────────────────────────┐
│  Business system (Optical Center app / ops tool)         │
│  - store opens ticket                                    │
│  - shows Fixly status                                    │
│  - store confirms done                                   │
└───────────────────────┬─────────────────────────────────┘
                        │  POST /api/v1/jobs + webhooks
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Fixly execution network (THIS REPO)                     │
│  matching · availability · dispatch · lifecycle          │
│  one requests table · one matcher · one candidate model  │
└───────────────────────┬─────────────────────────────────┘
                        │  push / WhatsApp / pro app
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Professionals (existing Fixly supply)                   │
└─────────────────────────────────────────────────────────┘
```

**Do not build:** a second matcher, a second request table, an OC-only fork of `/api/v1/jobs`, or a parallel “Optical Center marketplace” inside Fixly.

---

## 6. Domain model (minimal, generic B2B)

Reuse `requests` + `request_candidates` + `professionals` + `request_events`.

Add only what partner fields cannot express cleanly:

```text
business_accounts
  id, name, slug, status, created_at
  -- e.g. Optical Center

business_locations
  id, account_id, external_store_id, name, address, city, lat, lng,
  contact_phone, contact_name, timezone, active

business_fault_types (optional config table or JSON config)
  account_id, fault_key, label_he, fixly_category_key, default_priority
```

Job linkage (prefer columns on existing `requests`, aligned with Bamakor patterns):

| Field | Purpose |
|-------|---------|
| `source` | `optical_center` / `business` / `bamakor` / `consumer` |
| `external_ref.*` | Partner ticket id (idempotency) |
| `business_account_id` | Tenant |
| `business_location_id` | Store |
| `priority` | Already exists |
| `callback_url` | Already exists |
| `completion_media_urls` / `completion_notes` | Pro close evidence (new) |
| `store_confirmed_at` / `store_confirmed_by` | Close gate (new) |
| `exception_reason` | Why manager should see it (optional) |

MVP alternative if schema must stay thinner: encode store in `external_ref` + `location.*` like Bamakor buildings, and add only confirmation + completion-evidence columns. Prefer explicit `business_*` tables if a second chain is expected within one quarter.

---

## 7. Status flow (MVP)

Keep existing core statuses; add **one** confirmation gate:

```text
pending          // matched / offered (partner API: offered | no_providers)
accepted         // pro won
on_the_way
in_progress
pending_confirmation   // NEW — pro finished + uploaded evidence
completed              // only after store confirm (or auto-confirm timeout policy)
cancelled
```

Partner API mapping (extend `status-map.ts`):

| Fixly DB | Partner API |
|----------|-------------|
| `pending` + offers | `offered` |
| `pending_confirmation` | `pending_confirmation` or `awaiting_customer_confirm` |
| rest | existing Bamakor map |

**Auto-confirm policy (recommended):** if store does not confirm within X hours and no dispute, auto-complete and flag for audit — keeps manager out of the happy path.

Exception states already partially exist for partners: `no_providers`, `rejected_by_all`, `expired` — surface these on a manager exception board.

---

## 8. Pillar plans

### 8.1 Matching

**Reuse:** `findMatchingCandidates` only.

**MVP changes (small):**
1. OC fault → Fixly category map (config).
2. Always pass store `city` (and later lat/lng).
3. Use `priority`:
   - `urgent` → higher invite limit (e.g. 8) + shorter accept SLA
   - `low` → smaller invite set
4. Keep performance + price-band ranking; stars remain secondary.

**Explicitly defer:** multi-skill pros, certifications, brand-specific preferred vendor lists, true geo radius (unless pilot cities fail with city string alone).

### 8.2 Availability

**Reuse:** `available` + `pro_availability_rules` + `matchesAvailability`.

**MVP changes:**
1. Partner create accepts `preferred_date` / `preferred_time` / `service_window` and passes them into the matcher (today Bamakor skips this).
2. `urgent`: do not require weekly-window match; require `available=true`; optionally sort by `avg_response_minutes`.
3. Document that capacity helper is Phase 2.

**Ops requirement (not code):** pros in pilot cities must keep `available` accurate and fill weekly rules.

### 8.3 Dispatch

**Reuse:** `broadcast_first_accept` + `request_candidates` + accept-invite.

**MVP changes (critical):**
1. **Deliver** WhatsApp (or SMS) invites when push fails or pro has no `user_id` — stop logging-only fallback.
2. Accept timeout → expire invite → **rebroadcast** next N ranked pros (or widen radius/city) once.
3. Decline path: allow pro to decline so `rejected_by_all` is real, not only timeout-derived.

Manager does not pick the pro in happy path. `manual_select` stays out of MVP.

### 8.4 End-to-end workflow

**Happy path (hands-off manager):**

```text
OC/store creates job via API or thin Fixly store form
  → Fixly matches + dispatches
  → Pro accepts (push/WA)
  → Status webhooks update OC
  → Tracking link for store contact
  → Pro: en_route → in_progress → submit evidence → pending_confirmation
  → Store confirms (magic link / OC button calling Fixly)
  → completed + webhook
  → performance aggregates update
```

**Manager intervenes when:**
- `no_providers` / `rejected_by_all` after rebroadcast
- Accept SLA breached
- Store disputes evidence
- Pro cancels after accept
- Stuck in `on_the_way` / `in_progress` beyond SLA

**MVP surfaces:**
1. Extend `/api/v1/jobs` for generic business sources (OC first).
2. Thin **Store job page** (tokenized): status, tracking, confirm done — no full consumer app identity required.
3. Thin **Manager exceptions page** (auth by `business_account` / admin): list exception jobs only.
4. Pro dashboard: require completion media + note before `pending_confirmation`.

Chat between store and pro: Phase 1.5 via WhatsApp deep link to store contact; in-app chat after store identity exists.

---

## 9. Integration options for Optical Center

| Option | When | Notes |
|--------|------|-------|
| **A. Partner API only** (recommended MVP) | OC already has (or will have) a ticket UI | OC POSTs to `/api/v1/jobs`, receives webhooks — same as Bamakor contract |
| **B. Thin Fixly store form** | OC has no ticket UI yet | `/business/[account]/store/[location]/new` creates the same partner job under the hood |
| **C. Bamakor-style escalation** | Internal tech team tries first | Reuse escalation metadata; still same jobs API |

Do not require shared database with Optical Center.

Generalize naming in code/docs over time:

- Package folder may stay `lib/integrations/bamakor/` short-term
- Treat it as **partner jobs** module; add `source: 'optical_center' | 'business' | 'bamakor'`
- Auth stays API-key per tenant (`FIXLY_API_KEYS` or per-account keys later)

---

## 10. MVP scope cut

### In scope (build next)

1. Generic B2B tenant + locations (or external_ref-only if ultra-thin) seeded for Optical Center stores in **1–2 pilot cities**
2. Fault→category map for OC
3. Partner create passes availability window + priority into matcher
4. Real WhatsApp/SMS dispatch fallback
5. One rebroadcast on no-accept
6. Completion evidence + `pending_confirmation` + store confirm
7. Webhooks including evidence URLs + confirm flag
8. Manager exception list (no full command center)

### Out of scope (explicit)

- Nationwide consumer marketplace
- Second matching engine
- Full escrow / complex B2B billing (use existing job payment later)
- Preferred-vendor procurement workflows
- Replacing Optical Center’s internal IT systems
- App Store as prerequisite
- AI triage of faults

---

## 11. Suggested implementation sequence

| Step | Work | Depends on |
|------|------|------------|
| 0 | Production env real (Supabase on, demo kill or `demo.` host) | Ops |
| 1 | Seed OC account + pilot stores + pros in those cities | Ops + light schema |
| 2 | Generalize partner job create for `source=optical_center` + fault map | Code |
| 3 | Availability window + priority → matcher | Code |
| 4 | WhatsApp/SMS send on invite | Code + provider keys |
| 5 | Rebroadcast timer (cron) | Code |
| 6 | Completion evidence + store confirm + status | Code |
| 7 | Exception list for manager | Code |
| 8 | Pilot 1 city soft-launch (10–20 real tickets) | GTM |

---

## 12. Success criteria (pilot)

| Metric | Target |
|--------|--------|
| Time to first accept | Track; improve via supply + WA delivery |
| Jobs closed without manager touch | Majority of completed jobs |
| Store confirm rate | High; auto-confirm only as backstop |
| Reopen / dispute rate | Low enough that performance score stays meaningful |
| Second chain reusable | Same APIs work with a new `business_account` and fault map |

---

## 13. Relation to Bamakor / differentiation

| | Bamakor (BINO) | Optical Center (B2B multi-branch) |
|--|----------------|-----------------------------------|
| Origin | Building-ops ticket escalation | Store service call |
| Location unit | Building | Store / branch |
| Fixly role | Same — execution network | Same |
| Integration | `/api/v1/jobs` + webhooks | Same |
| Consumer density gate | Bypassed | Bypassed |

Both strengthen: local liquidity, match quality, customer trust, job economics.

---

## 14. Open decisions (product, before coding)

1. Does Optical Center already have a ticket UI, or does Fixly ship the store form (option B)?
2. Confirm channel: magic link SMS to store manager vs button inside OC app?
3. Auto-confirm timeout hours?
4. Pilot cities and which fault types first (e.g. AC, electrical, locksmith only)?
5. Who pays the pro in MVP — Optical Center central billing vs store vs Fixly collects?

Until those are answered, implement **API + workflow gates** first; keep OC UI thin.

---

## Related docs

- [`DIFFERENTIATION.md`](./DIFFERENTIATION.md)
- [`BAMAKOR_INTEGRATION.md`](./BAMAKOR_INTEGRATION.md)
- [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`PLATFORM_FEATURES.md`](./PLATFORM_FEATURES.md)
- [`LIVE_TRACKING.md`](./LIVE_TRACKING.md)
