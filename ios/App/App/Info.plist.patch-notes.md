# Info.plist — App Store keys

After `npx cap sync ios`, verify these keys remain (Capacitor may not overwrite custom keys):

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `ITSAppUsesNonExemptEncryption` = false

If missing, re-add from this repo version of `Info.plist`.
