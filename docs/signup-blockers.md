# Signup blockers — before / after

One-screen summary of the surgical fix on `fix/signup-blockers`.

| # | Before | After | Proving tests |
|---|--------|-------|---------------|
| 1 | `POST /api/waitlist` rewritten to HTML `/il-only` (405-ish) | Waitlist API + marketing paths geo-public; other APIs get JSON `403 GEO_BLOCKED` | `tests/unit/israel-access.test.ts` |
| 2 | Silent `fixly.vercel.app` product URL (wrong app) | `resolveProductUrl()` requires env in production; health exposes `productUrl` | `tests/unit/site-config.test.ts` + `docs/ops-followups.md` |
| 3 | Admin goal window ended 2026-10-29 | Rolling last 30 days + `waitlistLast7Days` | `tests/unit/monthly-signup-goal.test.ts` |
| 4 | Errors were bare Hebrew strings | Codes: `INVALID_INPUT`, `AUDIENCE_CLOSED`, `RATE_LIMITED`, `STORAGE_UNAVAILABLE`, `INTERNAL_ERROR`, `GEO_BLOCKED` | `tests/unit/waitlist-api-errors.test.ts` |
| 5 | Entry modal + body scroll lock blocked form | Inline `role="status"` card; no dismiss needed | `tests/e2e/smoke.spec.ts`, `tests/e2e/signup.spec.ts` |
| 6 | Arabic names / landlines / custom trades rejected | Broader name/phone rules + `אחר` free text | `tests/unit/waitlist-spam-guard.test.ts` (21-row fixture) |
| 7 | IP 10/60s (carrier NAT friction) | IP 30/60s + phone failure bucket 3/10m (cleared on success) | `tests/unit/rate-limit.test.ts` |
| 8 | Every DB row `isApproved: true` | `is_active !== false && is_verified === true`; index on `isVerified` | `tests/unit/supabase-mappers-approved.test.ts` |
| 9 | `/pro/join` soft redirect; hubs often `noindex` | Config **308**; hubs index with ≥1 approved pro or qualifying pair | `next.config.ts` redirects + sitemap |

## Ops (humans)

See [ops-followups.md](./ops-followups.md) — set `NEXT_PUBLIC_PRODUCT_URL` in Vercel Production and confirm Deployment Protection is off for that host.

## Gate

- `npm run lint` (`tsc --noEmit` — Next 16 no longer ships `next lint`)
- `npx tsc --noEmit`
- `npm test` (unit)
- `npx playwright test tests/e2e/smoke.spec.ts tests/e2e/signup.spec.ts` (`@live` skipped unless `LIVE_SIGNUP_TEST=1`)
