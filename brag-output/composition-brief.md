# Hyperframes Composition Brief: Fixly

## Objective
Create a short launch-style brag video for Fixly.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/workspace`
- Primary files read: `README.md`, `FIXLY_STATUS.md`, `components/home/HomeScreen.tsx`, `lib/i18n/messages/he.ts`, `app/globals.css`, `assets/brand/fixly-icon.svg`
- Product name: Fixly
- Tagline / strongest claim: תיקונים חכמים · איש מקצוע בדרך · כמו Wolt
- Key UI or visual moment to recreate: Home navy hero + category grid + matching wait + en-route tracking
- Copy that must appear verbatim:
  - זקוקים לתיקון?
  - מצא את איש המקצוע המתאים
  - במהירות ובקלות
  - מה צריך לתקן?
  - בקשה מהירה
  - בחרו קטגוריה
  - מחפשים מקצוענים...
  - 3 מקצוענים קיבלו את הבקשה — הראשון שמאשר יקבל
  - איש המקצוע בדרך אליך
  - המיקום מתעדכן בזמן אמת (כמו Wolt)
  - בדרך
  - אחריות Fixly
  - תיקונים חכמים

## Creative Direction
- Tone preset: app-store
- Creative direction: Wolt for home repairs — Hebrew marketplace launch
- Interpretation: Clean feature-card reveals, RTL Heebo, snappy but readable, earnest product film
- Angle: Dinner has live tracking. Plumbing should too. Show Fixly doing that in Hebrew UI.
- Hook: זקוקים לתיקון? on navy hero + בקשה מהירה tap
- Outro / punchline: Fixly logo + תיקונים חכמים
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - LTR layout (must be RTL)

## Visual Identity
- Background: `#F2F4F7`
- Text: `#0F1729`
- Accent: `#F59E0B` / secondary `#F97D10`
- Brand primary: `#123563`
- Display font: Heebo (Google Fonts)
- Body font: Heebo
- Visual references from the project: rounded-2xl cards, navy hero, orange CTA, amber matching card, green guarantee, house+check logo

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook hero — 3.5s — navy hero + בקשה מהירה tap
2. Categories — 4.5s — 4 category cards sequential
3. Matching — 5.0s — amber matching status upgrade
4. En route — 4.0s — map + בדרך + אחריות Fixly
5. Outro — 3.0s — logo + תיקונים חכמים

## Audio
- Audio role: warm bed
- Audio arc: bed under UI; light SFX on cards/tap; success into logo; music fades under outro
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: volume ~0.32; soft fade-in; fade under final logo
- Music cue guidance: bundled preset `.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json` (~120 BPM); lock matching→tracking / בדרך near 16–17s strong cues; category tiles on every-other-beat grid
- Audio-reactive treatment: subtle; hero glow + CTA presence with RMS/bass
- Audio-coupled moments:
  - Scene 1 — simulated CTA tap
  - Scene 2 — category card sequence
  - Scene 3 — matching status change
  - Scene 4 — בדרך success
  - Scene 5 — logo land
- SFX selection guidance: app-store light layer — drops/clicks for cards, soft success for בדרך, logo hit on outro
- SFX analysis guidance: `.agents/skills/brag/assets/sfx/sfx-analysis.md`
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, and `hyperframes-cli`. /brag owns product angle and storyboard; do not enter the hyperframes entry-point intent interview; do not route into generic promo / launch-video workflow. Prefer native Hyperframes conventions.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all Hebrew text readable (hold times per plan).
- Keep the video within 15-25 seconds (target 20s).
- Include planned music/SFX.
- Treat music cues as optional timing hints.
- RTL throughout.
- Run `hyperframes check` before render.
