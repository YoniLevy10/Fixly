# מפת דרכים להשקה — Fixly

עדכון: מימוש תשתית לכל הצירים (Pro / OAuth / כסף / App Store / סקייל).

## סטטוס

| ציר | תשתית בקוד | דורש הגדרה חיצונית | סטטוס |
|-----|------------|---------------------|--------|
| **25 שיפורי UX** | כן | — | [ ] commit + push |
| **סקייל** | Realtime מסונן, pagination, cache, rate limit | Supabase Pro, load test | [ ] |
| **Pro (ללא מידרג)** | `/pro/join` waitlist | שיווק, מיילים | [ ] |
| **Google OAuth** | כפתור + callback | Supabase + Google Console | [ ] |
| **מונטיזציה** | DB + billing events + pricing | Stripe keys | [ ] |
| **App Store** | Capacitor iOS, legal | Apple Developer, הגשה | [ ] |

## צ'קליסט לפני השקה

### Supabase
- [ ] הרצת כל המיגרציות (`pro_waitlist`, `monetization`, `scale_indexes`)
- [ ] Anonymous + Email + **Google** providers מופעלים
- [ ] Redirect URLs: `https://your-domain/auth/callback`

### Google OAuth
- [ ] פרויקט ב-[Google Cloud Console](https://console.cloud.google.com/)
- [ ] OAuth client (Web) — Authorized redirect: Supabase callback URL
- [ ] Client ID/Secret ב-Supabase → Authentication → Google

### Stripe (כשמפעילים תשלומים)
- [ ] חשבון Stripe + מוצר מנוי Pro
- [ ] `STRIPE_*` ב-Vercel
- [ ] Webhook → `/api/billing/webhook`

### App Store
- [ ] Apple Developer Program
- [ ] `npm run mobile:prepare`
- [ ] צילומי מסך, תיאור, Privacy Nutrition Labels
- [ ] `docs/MOBILE_APP_STORE.md`

### מידרג
- [ ] **אין הסכם** — רק waitlist + גיוס ידני עד שותפות

## סדר עבודה מומלץ (שבועות)

1. **שבוע 1:** commit הכל → staging → בדיקות flow → מיגרציות
2. **שבוע 2:** Google OAuth + Supabase production
3. **שבוע 3:** Stripe test mode + מנוי Pro
4. **שבוע 4:** TestFlight + גיוס 20–50 Pro בעיר אחת
5. **שבוע 5+:** עמלות, ניטור, load test

## מסמכים קשורים

- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — **מדריך השקה מלא**
- [MONETIZATION.md](./MONETIZATION.md)
- [IMPROVEMENTS_25.md](./IMPROVEMENTS_25.md)
- [MOBILE_APP_STORE.md](./MOBILE_APP_STORE.md)
- [PRO_OUTREACH.md](./PRO_OUTREACH.md)
