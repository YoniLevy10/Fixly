# Fixly — לוגו ואייקונים

## קבצי מקור

| קובץ | שימוש |
|------|--------|
| `assets/brand/fixly-icon.svg` | אייקון אפליקציה (בית + וי כתום) |
| `assets/brand/fixly-logo.svg` | לוגו אופקי עם טקסט (אתר, מצגות) |

צבעי מותג: כחול `#123563`, כתום `#F59E0B`.

## ייצור PNG ל-iOS ו-PWA

```bash
npm install
npm run icons:generate
```

נוצרים:

- `ios/.../AppIcon-512@2x.png` — **1024×1024** ל-App Store / Apple Icon
- `public/icons/icon-512.png`, `icon-192.png`, `apple-touch-icon.png`
- Splash ממותג ב-`ios/.../Splash.imageset/`

אחר כך:

```bash
npm run cap:sync:ios
npm run cap:ios
```

ב-Xcode: **App** → **General** → **App Icons** צריך להצביע על `AppIcon`.

## App Store Connect

בהעלאה לחנות, העלה את אותו קובץ 1024×1024 (או צילום מסך מהסימולטור) בשדה **App Icon**.
