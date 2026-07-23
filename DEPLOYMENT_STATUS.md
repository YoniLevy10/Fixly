# Deployment Status

**Updated:** 2026-07-23 (post Bamakor Phase 1–2 merge)

## Code (agent / repo): done

| Item | Status |
|------|--------|
| Marketplace MVP (requests, matching, statuses) | In `main` |
| Production hardening (Zod, rate limits, health, demo off) | In `main` |
| Bamakor `/api/v1/jobs` + signed webhooks + retries | Merged (#6) |
| Unit tests + `smoke:phase1` in CI | This PR |
| Docs: `PRODUCTION_READINESS`, `BAMAKOR_INTEGRATION`, `FIXLY_STATUS` | In repo |

## You (external / ops): still required for launch marketing

| Step | Owner | Notes |
|------|--------|--------|
| Vercel env vars | You | See `docs/PRODUCTION_READINESS.md` + `.env.example` |
| `FIXLY_API_KEYS` + `BAMAKOR_WEBHOOK_SECRET` | You | Needed for partner API / signed callbacks |
| Supabase migrations (all) | You | Bamakor migration already run ✓ |
| Optional pilot seed | You | `supabase/seed_pilot_optional.sql` |
| Google OAuth | You | Supabase + Google Console |
| Stripe (if charging) | You | Keys + webhook |
| `ADMIN_EMAILS` | You | `/admin` access |
| `/api/health` → `ok`, `demoMode: false` | You | After env + deploy |
| 20+ real pros in pilot city | You | Supply before paid ads |
| Bamakor button + webhook receiver | Bamakor team | Not in this repo |

## Verify after you configure

```bash
curl -s https://fixly.vercel.app/api/health | jq
# Expect: status ok|degraded, demoMode false, mode supabase
# checks.bamakor_migration.ok true
# checks.partner_api_keys.ok true (once FIXLY_API_KEYS set)
```
