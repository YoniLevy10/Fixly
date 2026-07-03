# Info.plist — App Store keys

After `npx cap sync ios`, verify these keys remain (Capacitor merges `ios.infoPlist` from `capacitor.config.ts` but custom URL types should stay in this file):

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `CFBundleURLTypes` — `fixly://` and `com.fixly.app://` (deep links + OAuth)
- `ITSAppUsesNonExemptEncryption` = false

If missing, re-add from this repo version of `Info.plist` and run `npm run mobile:check`.
