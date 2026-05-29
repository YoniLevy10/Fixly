# Production hardening (Sentry, rate limits, tests)

## Sentry

1. Create a project at [sentry.io](https://sentry.io).
2. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel (Production).
3. Optional: `SENTRY_AUTH_TOKEN` in CI for source map upload.

Errors from `trackError()` and unhandled request errors are reported in production only.

## Rate limiting

- Default: in-memory (per serverless instance).
- Production: create a free [Upstash Redis](https://upstash.com) database and set:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

Applied on `POST` for `/api/requests`, `/api/reviews`, `/api/billing/checkout`.

## E2E smoke tests

```bash
npm run test:e2e
```

Uses demo data mode locally. CI runs `build` → `start` → Playwright on every PR to `main`.

## API validation

POST bodies are validated with Zod (`lib/api/schemas.ts`). Invalid payloads return `400` with `details` field errors.
