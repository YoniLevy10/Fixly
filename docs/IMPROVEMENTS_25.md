# 25 Product Improvements — Implemented

| # | Feature | Location |
|---|---------|----------|
| 1 | Language toggle in header | `LanguageToggle`, Home + DesktopHeader |
| 2 | Browser language on first visit | `locale-provider.tsx` |
| 3 | Direction transition | `globals.css` |
| 4 | Localized price/phone format | `format-locale.ts` |
| 5 | Offline banner | `OfflineBanner.tsx` |
| 6 | Pull to refresh | `use-pull-to-refresh.ts`, MyRequests, ProDashboard |
| 7 | Push stub | `notifications-stub.ts`, `NativeBootstrap` |
| 8 | Deep links | `deep-link.ts`, Capacitor `appUrlOpen` |
| 9 | Request progress bar | `TrackingScreen.tsx` |
| 10 | Share request | `ShareRequestButton.tsx` |
| 11 | Reviews rating filter | `ReviewsList.tsx` |
| 12 | Available today badge | `AvailableTodayBadge.tsx` |
| 13 | Quick request | `/request/quick` |
| 14 | Price estimate | `price-estimate.ts`, `NewRequestForm` |
| 15 | Request draft autosave | `request-draft.ts` |
| 16 | Repeat request link | `TrackingScreen.tsx` |
| 17 | Pending badge on profile nav | `use-pending-requests-count.ts`, `BottomNav` |
| 18 | Pro reply templates | `ProDashboardScreen.tsx` |
| 19 | Business hours display | `ProListCard.tsx` |
| 20 | Pro join waitlist | `/pro/join`, `/api/pro/waitlist` |
| 21 | Referral capture `?ref=` | `ReferralCapture.tsx` |
| 22 | Seasonal categories | `seasonal-categories.ts`, `HomeScreen` |
| 23 | About page | `/about` |
| 24 | Analytics stub | `lib/analytics/track.ts` |
| 25 | Feature flags | `lib/feature-flags.ts` |

## Scalability extras (same release)

- Filtered Realtime (`customer_id` / `professional_id`)
- Paginated requests API (`limit` / `offset`)
- Cache headers on categories & professionals APIs

Toggle flags via `.env`:

```env
NEXT_PUBLIC_FF_ANALYTICS=true
NEXT_PUBLIC_FF_PUSH=true
```
