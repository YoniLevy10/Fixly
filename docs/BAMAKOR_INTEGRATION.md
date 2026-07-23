# Bamakor ↔ Fixly Integration Contract

**Hard rule:** Bamakor production code is **not** changed in this workstream.  
This document is the Fixly-side contract Bamakor can implement later (thin client).

Mental model:
- **Bamakor** = source of truth for the **building ticket**
- **Fixly** = source of truth for **matching / dispatching** the professional
- Integration = Bamakor creates a Fixly job; Fixly reports status back via webhook

Fixly is seen as another provider/network in Bamakor’s world — everything goes over **API + webhook**, no shared database.

---

## Auth

| Direction | Mechanism |
|-----------|-----------|
| Bamakor → Fixly | `Authorization: Bearer <FIXLY_API_KEY>` **or** `X-Fixly-Key: <FIXLY_API_KEY>` |
| Optional tenant attribution | `X-Bamakor-Client-Id: <uuid>` |
| Fixly → Bamakor | HMAC-SHA256 of raw body; header `X-Fixly-Signature: sha256=<hex>` using `BAMAKOR_WEBHOOK_SECRET` |

Keys on Fixly: `FIXLY_API_KEYS` (comma-separated) or `FIXLY_API_KEY`.

---

## 1) Create job

`POST /api/v1/jobs`

```json
{
  "source": "bamakor",
  "external_ref": {
    "system": "bamakor",
    "ticket_id": "uuid",
    "ticket_number": 42,
    "client_id": "uuid",
    "client_name": "חברת ניהול לדוגמה"
  },
  "category": "elevators",
  "title": "רעש בדלתות מעלית ימין",
  "description": "Hi, the doors of the right lift in Helets 12 is making lots of noises",
  "priority": "medium",
  "location": {
    "building_name": "חלץ 12",
    "address": "חלץ 12, חדרה",
    "city": "חדרה",
    "lat": null,
    "lng": null
  },
  "contact": {
    "reporter_phone": "9725...",
    "manager_phone": "9725...",
    "notes": "optional manager note"
  },
  "media_urls": [],
  "assignment_mode": "broadcast_first_accept",
  "callback_url": "https://bamakor.vercel.app/api/integrations/fixly/webhook"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "job_id": "fixly_job_uuid",
  "status": "open",
  "matched_providers": 3
}
```

Idempotency: same `external_ref.system` + `external_ref.ticket_id` returns the existing job.

### Categories (keys)

| Key | Hebrew |
|-----|--------|
| `elevators` | מעליות |
| `cleaning` | ניקיון |
| `electrical` / `electricity` | חשמל |
| `plumbing` | אינסטלציה |
| `hvac` / `ac` | מיזוג |
| `gardening` | גינון |
| `locksmith` | מנעולים |
| `pest_control` | הדברה |
| `general` | כללי / אחר |

### Assignment modes

- `broadcast_first_accept` — top N matched pros invited; first accept wins
- `manual_select` — offers created; Bamakor/manager picks later (accept still via Fixly)

---

## 2) Get job status

`GET /api/v1/jobs/:job_id`

```json
{
  "ok": true,
  "job": {
    "job_id": "...",
    "status": "accepted",
    "matched_providers": 3,
    "assigned_provider_id": "...",
    "offers": [],
    "events": [],
    "external_ref": { "system": "bamakor", "ticket_id": "..." }
  }
}
```

### Status lifecycle (API)

`draft` → `open` → `offered` → `accepted` → `en_route` → `in_progress` → `completed`  
Terminal / special: `cancelled` | `expired` | `no_providers` | `rejected_by_all`

Hebrew UX direction:

| API | UI copy |
|-----|---------|
| open / offered | נשלח |
| accepted | התקבל |
| en_route | בדרך |
| in_progress | בטיפול |
| completed | הושלם |
| no_providers | אין ספקים בקטגוריה הזו באזור → CTA הרחב חיפוש |

Internal Fixly DB still uses `pending` / `on_the_way` for the consumer app; the v1 API maps names above.

---

## 3) Cancel job

`POST /api/v1/jobs/:job_id/cancel`

```json
{ "reason": "optional manager cancel note" }
```

**Response:** `{ "ok": true, "job_id": "...", "status": "cancelled", "webhook": { ... } }`

Allowed from non-terminal statuses (`open` / `offered` / `accepted` / `en_route` / `in_progress` / `no_providers` / …).  
Emits a signed `cancelled` webhook.

---

## 4) Status webhook (Fixly → Bamakor)

Emitted when status changes (create, accept, progress, cancel).

**Important statuses to emit:**  
`offered` · `accepted` · `en_route` · `in_progress` · `completed` · `cancelled` · `expired` · `no_providers`

`POST <callback_url>` — expected Bamakor path (receiver **not** built in this workstream):

`https://bamakor.vercel.app/api/integrations/fixly/webhook`

```json
{
  "event": "job.status_changed",
  "job_id": "fixly_job_uuid",
  "status": "accepted",
  "previous_status": "offered",
  "external_ref": {
    "system": "bamakor",
    "ticket_id": "uuid",
    "ticket_number": 42,
    "client_id": "uuid"
  },
  "provider": {
    "id": "provider_uuid",
    "name": "מעלית שירות בע״מ",
    "phone": "9725...",
    "category": "elevators"
  },
  "occurred_at": "2026-07-23T21:00:00.000Z"
}
```

Headers:
- `Content-Type: application/json`
- `X-Fixly-Event: job.status_changed`
- `X-Fixly-Job-Id: <uuid>`
- `X-Fixly-Signature: sha256=<hmac_hex>` (when secret configured)

Verify: HMAC-SHA256(raw body, `BAMAKOR_WEBHOOK_SECRET`) must equal signature hex.

### Retries

Outbound client retries **up to 3 attempts** with backoff: immediate → **500ms** → **2000ms**.  
Retries on network errors, `408`, `429`, and `5xx`. Most `4xx` are not retried.

Dev: set `FIXLY_WEBHOOK_DRY_RUN=1` or omit `callback_url` to log payload to console (no HTTP).

---

## 5) Accept offer (smoke / partner)

`POST /api/v1/jobs/:job_id/accept`

```json
{ "provider_id": "pro_uuid" }
```

Production Fixly pros continue to use authenticated `POST /api/requests/:id/accept-invite`.

## 6) Patch status (progress)

`PATCH /api/v1/jobs/:job_id/status`

```json
{ "status": "en_route", "note": "optional" }
```

---

## What Bamakor needs later (not implemented here)

**Do not build the Bamakor webhook receiver in Bamakor as part of this Fixly workstream.**  
Documented expected path only. Bamakor team later:

Exactly **one thin endpoint + one button**:

1. **Button** in Bamakor ticket UI: **«שלח ל-Fixly»** (only when addon / feature allowed).
2. **Thin server action / API route** that:
   - Builds the JSON payload from the ticket (id, number, description, phones, building, client)
   - `POST`s to Fixly `/api/v1/jobs` with the API key
   - Stores returned `job_id` on the ticket (or side table)
3. **Webhook receiver** at e.g. `/api/integrations/fixly/webhook` that verifies signature and updates ticket status / timeline (e.g. toward `PROFESSIONAL_ESCORT` or a Fixly-specific mirror status).

Do **not** replace Bamakor’s existing per-tenant professionals SMS flow.

---

## Env / ops (Fixly)

| Variable | Purpose |
|----------|---------|
| `FIXLY_API_KEYS` or `FIXLY_API_KEY` | Inbound partner auth |
| `BAMAKOR_WEBHOOK_SECRET` | Sign outbound callbacks |
| `FIXLY_WEBHOOK_DRY_RUN=1` | Log webhooks instead of POSTing |
| `FIXLY_JOBS_STORE=memory` | Force in-memory store (local/tests) |
| Existing | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, SMS/WhatsApp if notifying pros |

Migration: `supabase/migrations/20260723210000_bamakor_integration.sql`

---

## Local smoke checklist

```bash
# memory-backed (no Supabase required)
FIXLY_JOBS_STORE=memory FIXLY_WEBHOOK_DRY_RUN=1 npm run smoke:phase1
```

Manual steps (also encoded in the script):

1. Seed categories  
2. Create 2 providers in elevators / חדרה  
3. Create job `category=elevators`, `city=חדרה`  
4. Verify offers created  
5. Accept as provider  
6. Verify webhook payload generated (console / webhook.site)

---

## Entity mapping

| Contract | Fixly table |
|----------|-------------|
| Job | `requests` (+ Bamakor columns) |
| Offer | `request_candidates` |
| Provider | `professionals` |
| Category | `service_categories` |
| Events | `request_events` |
