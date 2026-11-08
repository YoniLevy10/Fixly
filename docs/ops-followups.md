# Ops follow-ups

Human actions required after signup-blocker fixes. Code cannot complete these alone.

## Product URL (signup-blockers item 2)

- [ ] Set `NEXT_PUBLIC_PRODUCT_URL` in Vercel **Production** to the real Fixly product deployment (historically `https://fixly-five.vercel.app`, or the current production alias). Do **not** point it at the wrong `*.vercel.app` host that serves a different app.
- [ ] Optionally set `NEXT_PUBLIC_PRODUCT_HOST` to the hostname-only form if you prefer host-based config.
- [ ] Confirm **Deployment Protection** is off (or bypassed for public marketing/product traffic) for the product URL so deep links and “כניסה למערכת” work for end users.
- [ ] Redeploy after changing the env vars; `/api/health` should report `productUrl` and `productHostConfigured: true`.
