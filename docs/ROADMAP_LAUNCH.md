# מפת דרכים להשקה — Fixly

עדכון: מימוש תשתית לכל הצירים (Pro / OAuth / כסף / App Store / סקייל).

## סטטוס

| ציר | תשתית בקוד | דורש הגדרה חיצונית | סטטוס |
|-----|------------|---------------------|--------|
| **25 שיפורי UX** | כן | — | [x] ב-`main` |
| **סקייל** | Realtime מסונן, pagination, cache, rate limit | Supabase Pro, load test | [x] קוד / [ ] ops |
| **Pro (ללא מידרג)** | `/pro/join` waitlist | שיווק, מיילים | [x] קוד / [ ] גיוס |
| **Google OAuth** | כפתור + callback | Supabase + Google Console | [x] קוד / [ ] הגדרה |
| **מונטיזציה** | DB + billing events + pricing | Tranzila keys + webhook secret | [x] קוד / [ ] keys |
| **Marketing-ready** | Demo OFF, RLS multi-match, GA4, pro notify | Env + ≥20 Pros | [x] קוד / [ ] ops |
| **App Store** | Capacitor iOS, legal | Apple Developer, הגשה | [x] shell / [ ] הגשה |
| **Bamakor API** | `/api/v1/jobs` + webhooks | `FIXLY_API_KEYS`, secret, Bamakor UI | [x] Fixly / [ ] Bamakor |

## צ'קליסט לפני השקה

### Supabase
- [ ] הרצת כל המיגרציות (`pro_waitlist`, `monetization`, `scale_indexes`)
- [ ] Anonymous + Email + **Google** providers מופעלים
- [ ] Redirect URLs: `https://your-domain/auth/callback`

### Google OAuth
- [ ] פרויקט ב-[Google Cloud Console](https://console.cloud.google.com/)
- [ ] OAuth client (Web) — Authorized redirect: Supabase callback URL
- [ ] Client ID/Secret ב-Supabase → Authentication → Google

### Tranzila (כשמפעילים תשלומים)
- [ ] חשבון Tranzila + terminal
- [ ] `TRANZILA_*` + `TRANZILA_WEBHOOK_SECRET` ב-Vercel
- [ ] Notification URL → `/api/tranzila/webhook?secret=…`

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
3. **שבוע 3:** Tranzila test mode + מנוי Pro + GA4
4. **שבוע 4:** גיוס 20–50 Pro בעיר אחת + soft launch
5. **שבוע 5+:** מודעות בתקציב, עמלות, ניטור, load test

## מסמכים קשורים

- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — **מדריך השקה מלא**
- [MONETIZATION.md](./MONETIZATION.md)
- [IMPROVEMENTS_25.md](./IMPROVEMENTS_25.md)
- [MOBILE_APP_STORE.md](./MOBILE_APP_STORE.md)
- [PRO_OUTREACH.md](./PRO_OUTREACH.md)
