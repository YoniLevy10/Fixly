# השקה ארצית לפרודקשן — Fixly

עדכון: מעבר ממצב דמו למשקיעים → **פרודקשן ארצי**.

## החלטות מוצר

| נושא | החלטה |
|------|--------|
| דמו מלא (mock backend) | כבוי — בקשות/auth על Supabase |
| קטלוג בעלי מקצוע mock | **דלוק** (`NEXT_PUBLIC_FF_MOCK_CATALOG=true`) — ממלא את השוק עד שיש supply אמיתי |
| Prelaunch waitlist | כבוי — `fixly.tech` מציג את האפליקציה |
| צרכנים | ארצי — `NEXT_PUBLIC_FF_NATIONWIDE=true` |
| תשלומים | **בצד** — בעתיד **Grow** (כמו Bino), לא Tranzila |
| Bamakor | API מוכן; צריך מפתחות ב־env |

## Env חובה ב־Vercel (Production)

```env
NEXT_PUBLIC_APP_URL=https://fixly.tech
NEXT_PUBLIC_FF_DEMO_DATA=false
NEXT_PUBLIC_FF_DEMO_KILL=true
NEXT_PUBLIC_FF_PRELAUNCH=false
NEXT_PUBLIC_FF_NATIONWIDE=true
NEXT_PUBLIC_FF_MONETIZATION=false
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
FIXLY_API_KEYS=…
BAMAKOR_WEBHOOK_SECRET=…
ADMIN_EMAILS=…
CRON_SECRET=…
```

## Supabase — לפני עלייה

1. להריץ את כל המיגרציות (כולל `message_image_attachments`, `nationwide_launch_regions`, `request_images_storage_bucket`)
2. Auth: Email + Anonymous + Google (מומלץ)
3. Redirect URLs: `https://fixly.tech/auth/callback`
4. Bucket `request-images` (מיגרציית storage)

## Health יעד אחרי deploy

```bash
curl -sS 'https://fixly.tech/api/health?verbose=1' | jq '{status,mode,demoMode}'
```

צפוי: `demoMode: false`, `mode: "supabase"`, `status: "ok"` או `degraded` קל (Redis/Sentry אופציונלי).

## Smoke

```bash
PILOT_BASE_URL=https://fixly.tech npm run smoke:pilot
```

## Grow (עתיד)

ראה [`PAYMENTS_GROW.md`](./PAYMENTS_GROW.md).
