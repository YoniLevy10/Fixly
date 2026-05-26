# FIXLY — FOUNDATION ARCHITECTURE

## Core Principle
Fixly is NOT a generic marketplace.

The core system is:

REQUEST LIFECYCLE MANAGEMENT.

Everything in the MVP revolves around:
- request creation
- assignment
- acceptance
- progress tracking
- completion

---

# MVP STACK

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase
- Vercel

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
Professional profile layer.

## categories
Marketplace categories.

## requests
Core lifecycle entity.

## reviews
Trust layer.

## images
Attachments.

---

# REQUEST STATUS FLOW

```txt
pending
accepted
in_progress
completed
cancelled
```

NO extra statuses in MVP.

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

# MVP NON-GOALS

Forbidden for current MVP:

- AI
- Payments
- Chat
- Notifications infra
- Maps
- Dispatch systems
- Wallets
- Recommendation engine
- Dynamic pricing

---

# DEVELOPMENT RULE

Before building anything:

1. Check reuse from Naaryo
2. Check reuse from Bamakor
3. Check reuse from OpsBrain
4. Only then build new
