# App Store — Checklist (Fixly)

Use with [docs/MOBILE_APP_STORE.md](../docs/MOBILE_APP_STORE.md).

## Base (done in repo)

- [x] Capacitor iOS project (`ios/`)
- [x] `capacitor.config.ts` + `lib/mobile/app-store-config.ts`
- [x] Privacy Policy `/privacy` + Terms `/terms`
- [x] iOS usage strings (camera / photos)
- [x] `PrivacyInfo.xcprivacy` (Apple privacy manifest)
- [x] Mobile UI safe areas + native bootstrap
- [x] `npm run mobile:check`

## Before Archive (you)

- [ ] Apple Developer account ($99/yr)
- [ ] Mac + Xcode 15+
- [ ] Production domain on Vercel + `NEXT_PUBLIC_APP_URL`
- [ ] Icon 1024×1024 in `resources/icon.png` → `npx capacitor-assets generate --ios`
- [ ] 3+ iPhone screenshots (6.7")
- [ ] App Store Connect: app record + bundle `com.fixly.app`
- [ ] Privacy Policy URL = `https://YOUR_DOMAIN/privacy`
- [ ] Test on real device (LAN or production URL)
- [ ] Supabase: Anonymous Auth ON, Realtime on `requests`

## Xcode Archive

```bash
npm run cap:sync:ios
npm run cap:ios
# Product → Archive → Distribute → App Store Connect
```

## TestFlight

- [ ] Internal testing build uploaded
- [ ] Smoke test: login, new request, photo, tracking, language switch
