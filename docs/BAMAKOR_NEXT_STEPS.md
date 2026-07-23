# Bamakor team — later work (not in Fixly repo)

Fixly exposes a clean API + webhook. Bamakor production stays untouched until you choose to wire it.

## Minimum Bamakor changes (future PR in Bamakor repo)

1. **One button** on the ticket screen: **«שלח ל-Fixly»**
2. **One thin endpoint** (server action / route) that POSTs ticket fields to:
   `POST {FIXLY_BASE_URL}/api/v1/jobs`
   with `Authorization: Bearer <FIXLY_API_KEY>`
3. **Webhook receiver** at the `callback_url` you pass (e.g. `/api/integrations/fixly/webhook`) that verifies `X-Fixly-Signature` and mirrors status onto the ticket.

Fixly already implements the **outbound** signed webhook client (3 attempts + backoff). The Bamakor receiver is intentionally **not** built in this workstream.

Do not replace the existing per-tenant professionals SMS flow.

Contract: `docs/BAMAKOR_INTEGRATION.md`
