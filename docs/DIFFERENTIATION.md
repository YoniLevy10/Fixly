# Fixly — Product Differentiation (Canonical)

This document is binding for every product, design, architecture, and engineering decision.
Do not add generic features that do not reinforce this differentiation.

## What Fixly is

Fixly is an **execution network**, not “Uber for trades” and not another open marketplace.

Demand starts from real work:

1. **Bamakor (= BINO)** — building-ops tickets that internal maintenance did not close
2. **Business customers** — commercial / property demand routed into the same network

Unresolved internal-maintenance issues escalate into Fixly. Fixly matches verified professionals by **domain, area, availability, price, and objective past performance**.

## What Fixly is not

- An open consumer marketplace from day one
- A phone directory or “browse pros” product as the core loop
- A star-only reputation system
- A national consumer launch before local density exists

## Objective performance (not stars alone)

Ranking and trust must use measurable job outcomes:

| Signal | Meaning |
|--------|---------|
| Response time | Invite → accept latency |
| Arrival time | Accept → en route / on site |
| Accept rate | Offers accepted vs offered |
| Price vs estimate | Quote accuracy relative to category estimate |
| Close quality | Completed cleanly without late cancel |
| Reopen rate | Same issue / address reopened after completion |

Star reviews remain a secondary signal. They do not define the product.

## Density before private consumers

Private consumers open **only after** one area has enough professionals and completed jobs.
Until then:

- Bamakor / partner jobs stay open (primary demand)
- Consumer create-request stays gated (`launch_regions`)
- Waitlist collects intent by city

## Feature test (mandatory)

Every new feature must strengthen at least one:

1. **Local liquidity** — more fillable jobs + available pros in a city
2. **Match quality** — better domain / area / availability / price / performance fit
3. **Customer trust** — clearer status, verified pros, objective outcomes
4. **Job economics** — healthier completion, pricing, and monetization per job

If it does none of these, do not build it.

## Naming

| Name in docs / speech | Meaning in this repo |
|-----------------------|----------------------|
| **BINO** | Bamakor (building-ops SaaS; demand source) |
| **Fixly** | Execution / matching / dispatch network |

See also: [`ARCHITECTURE.md`](../ARCHITECTURE.md), [`BAMAKOR_INTEGRATION.md`](./BAMAKOR_INTEGRATION.md).
