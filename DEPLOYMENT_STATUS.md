# Deployment Status

**Updated:** 2026-09-02 (marketing-ready code path)

## Code (agent / repo): done for ads gate

| Item | Status |
|------|--------|
| Marketplace MVP (requests, matching, statuses) | In `main` / this branch |
| Demo default OFF in `next.config.ts` | This PR |
| Multi-match RLS + billing via service-role | This PR |
| Consumer pro notify (push + WA log) | This PR |
| GA4 loader + Tranzila webhook secret | This PR |
| `npm run smoke:pilot` | This PR |
| Bamakor `/api/v1/jobs` + signed webhooks | Merged |
| Unit tests + phase1 smoke in CI | In repo |

## You (external / ops): still required before paid ads

| Step | Owner | Notes |
|------|--------|--------|
| Vercel project + canonical domain | You | `fixly.tech` = landing; `*.vercel.app` = full app |
| Vercel env vars | You | See `docs/PRODUCTION_READINESS.md` + `.env.example` |
| `NEXT_PUBLIC_FF_DEMO_DATA=false` + redeploy | You | Critical |
| `NEXT_PUBLIC_FF_PRELAUNCH=true` | You | Landing on fixly.tech; app still on vercel.app |
| `NEXT_PUBLIC_PRODUCT_URL` | You | Optional public vercel.app URL for the product |
| `TRANZILA_*` + `TRANZILA_WEBHOOK_SECRET` | You | Notification URL with `?secret=` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` + analytics flag | You | Ads measurement |
| VAPID + `NEXT_PUBLIC_FF_PUSH=true` | You | Pro notify |
| Supabase migrations (all, incl. marketing_ready_rls) | You | `supabase db push` |
| Google OAuth | You | Supabase + Google Console |
| `ADMIN_EMAILS` | You | `/admin` access |
| `/api/health` → `ok`, `demoMode: false` | You | After env + deploy |
| 20+ real pros in pilot city | You | Supply before paid ads |
| Soft launch 20–50 real requests | You | Before ad spend |
| Bamakor button + webhook receiver | Bamakor team | Not in this repo |

## Verify after you configure

```bash
curl -sS 'https://YOUR_DOMAIN/api/health?verbose=1' | jq
# Expect: status ok|degraded, demoMode false, mode supabase
PILOT_BASE_URL=https://YOUR_DOMAIN npm run smoke:pilot
```
