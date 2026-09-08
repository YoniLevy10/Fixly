# Fixly Execution-Network Business Rules

Canonical differentiation: [`docs/DIFFERENTIATION.md`](../docs/DIFFERENTIATION.md).

## Demand Priority

1. Bamakor (= BINO) and business / partner jobs are always accepted into the network.
2. Private consumer requests are allowed only when the request city is `open` in `launch_regions`.
3. Unresolved internal-maintenance tickets escalate into Fixly via Bamakor with escalation metadata.

## Request Ownership

A consumer request belongs to one customer.

A partner job is attributed via Bamakor `external_ref` / `callback_url` (may have null `customer_id`).

---

## Professional Assignment

A request may have zero or one assigned professional.

Multi-offer uses `request_candidates` until one accept.

---

## Matching Rules

Candidates are filtered and ranked by:

1. Domain (`category_id`)
2. Area (city / region)
3. Availability (`available` + weekly rules when preferred slot exists)
4. Price fit vs category estimate
5. Objective `performance_score` (response, accept rate, arrival, price accuracy, close quality, reopen)
6. Tie-break: verified, then response time, then star rating

---

## Status Rules

pending -> accepted -> on_the_way -> in_progress -> completed

cancelled can happen before completion.

---

## Reviews

Reviews (stars) allowed only after completion.

Stars are a **secondary** signal. Objective performance drives ranking.

---

## Verification

Professional verification is controlled internally.

Users cannot self-verify.

---

## Density Gate

| Region status | Private consumer create | Partner / Bamakor create |
|---------------|-------------------------|--------------------------|
| `closed` / `waitlist` | Denied → waitlist | Allowed |
| `open` | Allowed | Allowed |

---

# MVP Constraints

Current MVP intentionally avoids:

- bidding systems
- auctions
- open nationwide consumer marketplace
- star-only ranking as the product
- dynamic pricing markets
