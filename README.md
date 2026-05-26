# Fixly

AI-powered marketplace MVP.

---

# Development Architecture

Fixly is developed using parallel AI agents with strict ownership boundaries.

The goal:
- Fast iteration
- Stable architecture
- Zero AI spaghetti code

---

# Agent System

## Agent A — UI / UX

Responsible for:
- Screens
- Layouts
- Marketplace UI
- Mobile UX
- Components

Allowed:
- /app
- /components
- /features/*/components

Forbidden:
- package.json
- tsconfig.json
- /lib
- /services
- /supabase

---

## Agent B — Data / Logic

Responsible for:
- Marketplace logic
- Supabase
- Hooks
- Types
- Requests flow

Allowed:
- /lib
- /services
- /supabase
- /types

Forbidden:
- UI redesign
- Tailwind changes
- package.json

---

## Agent C — Infra / Design System

Responsible for:
- Shared architecture
- Dependencies
- Design system
- Tailwind config
- TypeScript config
- Build stability

Allowed:
- /shared
- /styles
- /config
- package.json
- tsconfig.json

Forbidden:
- Business logic
- Marketplace screens

---

# Global Rules

## NEVER PUSH DIRECTLY TO MAIN

Use branches only:

- feat/ui-marketplace
- feat/data-logic
- feat/design-system

---

# Singleton Policy

There must be ONLY ONE:

- cn()
- Button
- Card
- Request model
- Status badge
- Design system

---

# Rules

- Reuse before creating
- No duplicate utilities
- No duplicate components
- No duplicate types
- No random architecture changes

---

# Goal

Build a scalable marketplace MVP fast,
without breaking architecture consistency.