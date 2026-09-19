# AUDIT — Google Places billing in Fixly lead engine

**Date:** 2026-09-19  
**Scope:** Read-only code audit. No architecture changes in this PR.  
**Goal:** ZERO SURPRISE BILLING — explain ₪246.77 Places charges (1–18 Sep 2026) and what must stop.

Official pricing source: [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing) (updated 2026-09-17).  
SKU field triggers: [SKU details — Text Search Enterprise](https://developers.google.com/maps/billing-and-pricing/sku-details).

---

## Executive verdict

The Fixly prospect discovery engine calls **Places API (New) Text Search** at  
`POST https://places.googleapis.com/v1/places:searchText` with a field mask that includes **`nationalPhoneNumber`**, **`internationalPhoneNumber`**, and **`websiteUri`**.

Per Google docs, **any one of those fields bills the whole request as “Places API Text Search Enterprise”** (~**$35 / 1,000** after a **1,000 free** monthly cap). The in-code cost comment that classifies phone/website as “Essentials / Pro” is **wrong**.

Billing is amplified by:

1. **~801 search jobs** per Jerusalem full pass (23 categories × multi-query × 10 areas).
2. **Up to 3 pages** per job → theoretical **~2,403** HTTP calls per full matrix.
3. Cron **`/api/cron/discover-prospects` every 15 minutes** that **starts a new discovery** when the previous one finished — continuous re-scan.
4. **No response cache**, **no monthly hard spend cap**, Google preferred **before** free OSM/gov sources.

---

## A. What caused the Google bill

| Fact | Detail |
|------|--------|
| Service | Places API (New) |
| SKU on invoice | Places API Text Search Enterprise |
| Fixly share | ₪246.77 of ₪260.50 (1–18 Sep 2026) |
| Code path | `GooglePlacesProspectAdapter.textSearch` → discovery cron + Superadmin “הרץ גילוי” |
| Why Enterprise | Field mask requests phone + website (Enterprise fields) |
| Volume fit | At ~$35/1k and ~₪3.7/USD → ~**1,900 billable** calls after 1,000 free ≈ **~2,900 total** calls — consistent with multi-day chunked discovery + cron resumes/restarts |

Maps on the product UI use **Leaflet + OpenStreetMap** (free). They are **not** this bill.

---

## B. Where it is in the code

### Paid Google Places (only call site)

| Item | Value |
|------|--------|
| File | `lib/prospects/adapters/google-places.ts` |
| Class / methods | `GooglePlacesProspectAdapter.fetchRecords` → private `textSearch` |
| Endpoint | `POST https://places.googleapis.com/v1/places:searchText` |
| Auth | `X-Goog-Api-Key: GOOGLE_PLACES_API_KEY` |
| Field mask | see section C |

### Orchestration (multipliers)

| File | Role |
|------|------|
| `lib/prospects/discover.ts` | Chunked discovery; **defaults sources to `google_places` first**, then `osm`, `gov_pest_control` |
| `lib/prospects/discovery-mapping.ts` | Builds job matrix (`placesSearchJobsFor`) |
| `lib/prospects/config.ts` | Per-chunk budgets (not monthly spend) |
| `lib/prospects/query-stats-store.ts` | Yield stats for **job ordering only** — not a result cache |
| `app/api/admin/prospects/discover/route.ts` | Manual Superadmin trigger + `after()` continue |
| `app/api/cron/discover-prospects/route.ts` | Cron resume / **new run** |
| `vercel.json` | `"schedule": "*/15 * * * *"` for discover-prospects |

### Not Places (no Maps Platform bill from these)

- `components/auth/GoogleSignInButton.tsx` — OAuth
- `components/analytics/GoogleAnalytics.tsx` — GA
- `docs/GOOGLE_SEARCH_CONSOLE.md` — Search Console
- Live map: Leaflet / OSM tiles

### Free / open sources already implemented

| Adapter | File | Cost |
|---------|------|------|
| OSM Overpass | `lib/prospects/adapters/osm-overpass.ts` | Free (public mirrors) |
| Gov pest registry | `lib/prospects/adapters/gov-pest-control.ts` | Free (data.gov.il) |

---

## C. Why Text Search Enterprise

### Actual `X-Goog-FieldMask` (from code)

```
places.id
places.displayName
places.formattedAddress
places.nationalPhoneNumber      ← ENTERPRISE
places.internationalPhoneNumber ← ENTERPRISE
places.websiteUri               ← ENTERPRISE
places.googleMapsUri
places.types
places.pureServiceAreaBusiness
nextPageToken
```

Google bills at the **highest** SKU among requested fields. Phone + website ⇒ **Text Search Enterprise**.

| Field | Official SKU tier |
|-------|-------------------|
| `id`, `displayName`, `formattedAddress`, `googleMapsUri`, `types`, `pureServiceAreaBusiness` | Pro (or lower) |
| `nationalPhoneNumber`, `internationalPhoneNumber`, `websiteUri` | **Enterprise** |

The comment in `google-places.ts` (lines 47–53) incorrectly says phone/website are “Essentials / Pro” and to “avoid Enterprise”. **That assumption is false** — the code already requests Enterprise fields.

### Pricing (global, USD, per 1,000 successful requests)

| SKU | Free / month | Then (0–100k) |
|-----|--------------|---------------|
| Text Search Essentials (IDs Only) | Unlimited | $0 |
| Text Search Pro | 5,000 | $32 |
| **Text Search Enterprise** | **1,000** | **$35** |

Lead engine needs phones for outreach → current design forces Enterprise on **every** search call (not a separate Place Details call).

---

## D. How many calls the system can make

### Job matrix (Jerusalem defaults)

Measured from code (`CORE_RECRUIT_CATEGORY_SLUGS` + `JERUSALEM_SEARCH_AREAS`):

| Metric | Value |
|--------|-------|
| Categories | 23 |
| Geo areas | 10 |
| Jobs per full ordered list | **801** |
| Pages soft-max per job | **3** (`pages >= 3` break) |
| Theoretical HTTP calls if every job pages fully | **~2,403** |

City-wide area uses **all** HE/EN/AR query variants; neighborhoods use primary HE/EN/AR only (`placesSearchJobsFor`).

### Soft budgets (per chunk / session — not monthly)

| Knob | Default | Env override (capped) |
|------|---------|------------------------|
| API calls / chunk | 40 | `FIXLY_DISCOVERY_API_CALL_BUDGET` ≤ 120 |
| Jobs / chunk | 20 | `FIXLY_DISCOVERY_CHUNK_MAX_JOBS` ≤ 80 |
| Chunks / HTTP session | 8 | `FIXLY_DISCOVERY_SESSION_MAX_CHUNKS` ≤ 24 |
| Max calls / session | **40 × 8 = 320** | up to 120 × 24 = 2,880 |
| Raw results / chunk | 400 | ≤ 2000 |
| Pages / query | 3 | hard-coded |
| Retries on Places HTTP | **none** (fail job, continue) | — |

### Multipliers that multiply cost

| Mechanism | Effect |
|-----------|--------|
| Pagination loop | Up to 3× calls per job |
| Chunk continue (`runProspectDiscoveryChunks` + `after()` + cron) | Walks entire 801-job list across many invocations |
| Cron every 15 min | If run finished → **starts a fresh discovery** again |
| Default source order | Google **before** free OSM/gov |
| UI “הרץ גילוי” | POST with default sources (includes Google when key set); polling is GET-only (no extra Places calls) |
| Page load / filters / typing | **Do not** call Places (list APIs are DB-only) |
| Response caching | **None** — same `textQuery`+area can be paid again on next run |
| `prospect_query_stats` | Orders jobs by yield; **does not skip** paying Google again |
| In-run dedupe | `seen` Set of place IDs — prevents duplicate **ingest**, not duplicate **billing** across pages/jobs |

### Cost estimate scenarios (Text Search Enterprise)

Assume ~₪3.70 / $1. Free tier = first **1,000** calls/month.

| Scenario | Calls | Billable | ≈ USD | ≈ ILS |
|----------|-------|----------|-------|-------|
| 1 search | 1 | 0 (within free) | $0 | ₪0 |
| 100 searches | 100 | 0 | $0 | $0 |
| 1,000 searches | 1,000 | 0 | $0 | ₪0 |
| 1,000 **paid** (2,000 total) | 2,000 | 1,000 | **$35** | **~₪130** |
| One full Jerusalem matrix @ 1 page/job | 801 | 0 if first of month | $0 | ₪0 |
| One full matrix @ 3 pages/job | 2,403 | 1,403 | **~$49** | **~₪182** |
| Sep bill reverse (~₪246.77) | ~2,900 | ~1,900 | ~$67 | ₪246.77 |
| Cron theoretical ceiling if always burning 320 calls/session × 96 ticks/day | 30,720/day | huge | **>$1,000/day** | **thousands ₪** |

Collecting **thousands of pros** with current Google-first design ≈ multiple full matrices + cron restarts → **easy hundreds–thousands ₪/month** once past the 1k free cap.

---

## E. What can still bill you right now

If production still has `GOOGLE_PLACES_API_KEY` set:

1. **Cron every 15 minutes** — continues running runs or **starts new** Google-inclusive discovery.
2. **Superadmin “הרץ גילוי”** — same path; server `after()` + cron keep going after you leave the page.
3. Any env raising `FIXLY_DISCOVERY_API_CALL_BUDGET` / session chunks (`.env.example` even suggests 80).

If the key is removed / Places API disabled in GCP → code skips `google_places` and falls through to OSM + gov (no Places bill).

---

## F. What to stop immediately (ops — before code change)

**Do these now in Google Cloud + Vercel:**

1. **Disable or delete** `GOOGLE_PLACES_API_KEY` on Vercel (Production + Preview).
2. In GCP: **disable Places API (New)** and/or set **quota = 0** for Text Search; revoke the key.
3. Set a **GCP budget alert** (e.g. ₪20) with email/SMS.
4. Optionally pause cron path `discover-prospects` in `vercel.json` / Vercel Cron until safeguards land.
5. Do **not** click “הרץ גילוי” with Google sources until hard limits exist.

These stop spend without deleting lead-engine functionality (OSM + gov + CSV remain).

---

## G. Proposed rebuild for minimal cost (design only — not implemented here)

Keep functionality; change **priority and paid surface**:

1. **Primary:** OSM Overpass + gov open data (already in repo). Expand OSM filters / Nominatim only where gaps hurt quality.
2. **Google = optional, opt-in, last resort** — never default in `initialCursor` / cron.
3. If Google is ever used:
   - Prefer **IDs-only Text Search** (unlimited free) + **Place Details Enterprise** only for **new** place IDs missing phone — fewer Enterprise events than embedding phone in every Text Search.
   - Or: Text Search **Pro** fields (name/address/types) only; obtain phones from OSM/manual/CSV.
4. **Hard monthly call + ₪ budget** in app; when hit → stop Google, continue OSM/gov only.
5. **Cache** `(queryKey, city, area)` responses (TTL days/weeks) in DB; never re-pay identical searches.
6. Cap jobs aggressively (1–2 areas, fewer query variants) for paid path.

---

## H. Safeguards to add (implementation sketch — not in this PR)

| Control | Proposal |
|---------|----------|
| Kill switch | `FIXLY_GOOGLE_PLACES_ENABLED=false` default; cron/admin refuse Google unless true |
| Hard monthly limit | Counter in DB/Redis; after N calls or estimated ₪X → throw / skip Google |
| Per-run confirmation | Admin must pass `confirmPaidSources: true` + show estimated call count |
| Caching | Persist Places JSON by `queryKey`; serve cache on discovery |
| Dedup across runs | Skip jobs whose `queryKey` was fetched within TTL with good yield |
| Rate limit | Max Places calls/hour globally (Upstash) |
| Pagination | Max 1 page on paid path unless explicitly allowed |
| Retries | Already no Places retry; keep it; never blind retry 5xx in a loop |
| No auto page-load calls | Keep (already true); never bind Places to filter/typing |
| Logging | Increment `provider_api_calls` + estimated USD/ILS per request |
| Cron | Resume incomplete runs only; **do not** auto-start Google discovery; or run OSM-only on schedule |
| Source order | `osm` → `gov_pest_control` → Google fallback |
| GCP | Quotas + budget alerts as second line of defense (app limit is first) |

**Invariant:** no paid provider may spend material money without explicit limit, monitoring, and owner approval.

---

## Inventory checklist (requested items)

| API | Present? | Notes |
|-----|----------|-------|
| Places API (New) Text Search | **Yes** | Only paid Places usage |
| Nearby Search | No | |
| Place Details | No | (ingest `enrichWebsites` is not Google Places) |
| Google Maps Platform (maps/geocoding) | No in app maps | Leaflet/OSM |
| Other paid Google Maps SKUs | Not found in lead engine | |

---

## Appendix — key code references

- Field mask + `searchText`: `lib/prospects/adapters/google-places.ts`
- Default sources + cron continue: `lib/prospects/discover.ts` (`initialCursor`)
- Cron schedule: `vercel.json` → `*/15 * * * *`
- Cron handler: `app/api/cron/discover-prospects/route.ts`
- Docs that understated cost: `docs/PRO_OUTREACH.md` (“אם כבר מופעל”)
