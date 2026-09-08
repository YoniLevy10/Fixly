# מפת דרכים להשקה — Fixly

עדכון: יישור לבידול רשת ביצוע ([`DIFFERENTIATION.md`](./DIFFERENTIATION.md)).  
ביקוש ראשון מ־Bamakor (= BINO); צרכנים פרטיים רק אחרי צפיפות מקומית.

## סטטוס

| ציר | תשתית בקוד | דורש הגדרה חיצונית | סטטוס |
|-----|------------|---------------------|--------|
| **בידול / ביצועים / צפיפות** | `performance_score`, `launch_regions`, escalation | מיגרציות + ops פתיחת ערים | [x] קוד / [ ] ops |
| **25 שיפורי UX** | כן | — | [x] ב-`main` |
| **סקייל** | Realtime מסונן, pagination, cache, rate limit | Supabase Pro, load test | [x] קוד / [ ] ops |
| **Pro (ללא מידרג)** | `/pro/join` waitlist | שיווק, מיילים | [x] קוד / [ ] גיוס |
| **Google OAuth** | כפתור + callback | Supabase + Google Console | [x] קוד / [ ] הגדרה |
| **מונטיזציה** | DB + billing events + pricing | Tranzila keys + webhook secret | [x] קוד / [ ] keys |
| **Marketing-ready** | Demo OFF, density gate, GA4, pro notify | Env + צפיפות בעיר אחת | [x] קוד / [ ] ops |
| **App Store** | Capacitor iOS, legal | Apple Developer, הגשה | [x] shell / [ ] הגשה |
| **Bamakor API** | `/api/v1/jobs` + webhooks + escalation | `FIXLY_API_KEYS`, secret, Bamakor UI | [x] Fixly / [ ] Bamakor |

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

## סדר עבודה מומלץ

1. מיגרציות + staging + בדיקות flow (כולל `launch_regions` / performance)
2. Google OAuth + Supabase production
3. חיבור Bamakor UI («שלח ל-Fixly») + נפח כרטיסים אמיתי
4. גיוס Pros בעיר אחת עד ספי צפיפות → פתיחת `launch_regions` ל־`open`
5. Soft launch צרכנים **רק** באותה עיר; אחר כך עמלות, ניטור, ערים נוספות

אין להריץ רכישת צרכנים ארצית לפני צפיפות מקומית + ביקוש Bamakor.

## מסמכים קשורים

- [DIFFERENTIATION.md](./DIFFERENTIATION.md) — **בידול מחייב**
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — מדריך השקה
- [MONETIZATION.md](./MONETIZATION.md)
- [IMPROVEMENTS_25.md](./IMPROVEMENTS_25.md)
- [MOBILE_APP_STORE.md](./MOBILE_APP_STORE.md)
- [PRO_OUTREACH.md](./PRO_OUTREACH.md)
