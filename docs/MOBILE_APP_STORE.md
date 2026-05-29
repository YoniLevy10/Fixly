# Fixly — מובייל ו-App Store

מסמך זה מתאר את **שלב 1**: עטיפה native (Capacitor) סביב האפליקציה הקיימת ב-Next.js על Vercel.

## בסיס שהוקם בפרויקט (Foundation)

| רכיב | מיקום |
|------|--------|
| קונפיגורציה מרכזית | `lib/mobile/app-store-config.ts` |
| Capacitor | `capacitor.config.ts`, `ios/` |
| מדיניות פרטיות | `/privacy` |
| תנאי שימוש | `/terms` |
| מניפסט פרטיות Apple | `ios/App/App/PrivacyInfo.xcprivacy` |
| הרשאות מצלמה/גלריה | `ios.infoPlist` ב-Capacitor |
| צ'קליסט + metadata | `app-store/CHECKLIST.md`, `metadata.template.json` |
| בדיקה | `npm run mobile:check` |

## אסטרטגיה

| שלב | מה | למה |
|-----|-----|-----|
| **1 (עכשיו)** | Capacitor iOS + WebView → `https://fixly.vercel.app` | שומרים על API routes, Auth, Realtime בלי לשכתב |
| **2** | אייקונים, Splash, הרשאות מצלמה/גלריה | דרישות App Store |
| **3** | Google / Apple Sign-In + deep links (`Fixly://`) | חוויית התחברות native |
| **4 (אופציונלי)** | קריאות ישירות ל-Supabase מהאפליקציה | אפשרות offline / ביצועים |

> **חשוב:** בניית `.ipa` והעלאה ל-App Store דורשת **Mac + Xcode + חשבון Apple Developer** ($99/שנה).

---

## דרישות מקומיות

- Node 20+
- **Mac** (לבניית iOS) — על Windows אפשר להכין את הקוד ו-CI; הארכוב רק על Mac
- [Apple Developer Program](https://developer.apple.com/programs/)
- Xcode 15+

---

## התקנה (פעם ראשונה)

```bash
npm install
npx cap add ios
npx cap sync ios
```

פתיחה ב-Xcode:

```bash
npm run cap:ios
```

---

## פיתוח על מכשיר אמיתי (LAN)

1. הרץ את Next.js על הרשת המקומית:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
2. מצא את IP המחשב (למשל `192.168.1.42`).
3. הגדר והרץ sync:
   ```bash
   set CAPACITOR_SERVER_URL=http://192.168.1.42:3000
   npx cap sync ios
   npm run cap:ios
   ```

ב-`Info.plist` (דרך Xcode) אפשר להוסיף `NSAppTransportSecurity` ל-HTTP בפיתוח בלבד.

---

## פרודקשן (לפני שליחה ל-App Store)

1. עדכן `NEXT_PUBLIC_APP_URL` ב-Vercel לדומיין הסופי.
2. ב-`capacitor.config.ts` ה-WebView טוען את אותו URL.
3. ב-Supabase → **Authentication → URL Configuration** הוסף:
   - `https://YOUR_DOMAIN/**`
   - `com.fixly.app://**` (לשלב OAuth עתידי)
4. הרץ:
   ```bash
   npx cap sync ios
   ```
5. ב-Xcode: **Product → Archive → Distribute App → App Store Connect**.

---

## אייקונים ו-Splash (חובה ל-App Store)

כרגע יש `public/icons/icon.svg`. ל-iOS נדרשים PNG:

| קובץ | גודל |
|------|------|
| App Store | 1024×1024 |
| iPhone | 180×180, 120×120 |

מומלץ:

```bash
npm install -D @capacitor/assets
# שים קובץ מקור 1024x1024 ב- resources/icon.png
npx capacitor-assets generate --ios
```

---

## צ'קליסט App Store Connect

- [ ] שם אפליקציה, תיאור בעברית, קטגוריה (Utilities / Lifestyle)
- [ ] צילומי מסך iPhone 6.7" ו-6.5" (מינימום 3)
- [ ] מדיניות פרטיות (URL ציבורי)
- [ ] גיל/תוכן — ללא תשלומים בשלב זה
- [ ] בדיקת Sign in (אורח + אימייל)
- [ ] בדיקת מצלמה / העלאת תמונה בבקשה חדשה

---

## סקריפטים ב-package.json

| סקריפט | פעולה |
|--------|--------|
| `npm run cap:sync` | מעתיק web + config לפרויקט iOS |
| `npm run cap:ios` | פותח Xcode |
| `npm run cap:copy` | העתקה מהירה בלי עדכון plugins |

---

## CI (עתיד)

GitHub Actions על `macos-latest` יכול להריץ `xcodebuild` + TestFlight — ראה שלב 2 בפרויקט.

---

## רשימת השקה (Release)

1. [ ] חשבון [Apple Developer](https://developer.apple.com/programs/)
2. [ ] `npm run mobile:prepare` — בדיקות + sync iOS
3. [ ] אייקון 1024×1024 + צילומי מסך (6.7", 6.5")
4. [ ] Xcode: Archive → Distribute → App Store Connect
5. [ ] TestFlight לבטא (10–20 משתמשים)
6. [ ] הגשה ל-Review — קישורים ל-`/privacy` ו-`/terms`
7. [ ] `NEXT_PUBLIC_APP_URL` מצביע ל-production ב-Vercel

ראה גם `app-store/CHECKLIST.md` ו-`docs/ROADMAP_LAUNCH.md`.

---

## קבצים שנוספו

- `capacitor.config.ts` — מזהה `com.fixly.app`, URL שרת
- `lib/native/platform.ts` — זיהוי native
- `components/native/NativeBootstrap.tsx` — status bar, splash
- `components/layout/NativeAwareMain.tsx` — safe areas
- `docs/MOBILE_APP_STORE.md` — מסמך זה
