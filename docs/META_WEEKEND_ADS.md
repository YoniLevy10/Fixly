# Meta Weekend Ads — ₪100 budget (paid only)

Goal: drive waitlist signups on **https://fixly.tech** with a single Meta (Facebook + Instagram) campaign. No organic posting required.

**Honest expectation:** 100 signups for ₪100 (≈ ₪1 CPL) is a stretch. Typical Israeli waitlist CPL on Meta is often much higher. This run maximizes conversion + post-signup WhatsApp share amplification. Measure CPL after ₪50 and decide whether to continue.

---

## 0) Before you spend (5 minutes)

1. Create a **Meta Pixel** in [Events Manager](https://business.facebook.com/events_manager2) → Data sources → Pixel → copy the Pixel ID (numbers only).
2. In **Vercel** → Project → Settings → Environment Variables (Production):
   - `NEXT_PUBLIC_META_PIXEL_ID` = your Pixel ID
   - `NEXT_PUBLIC_FF_ANALYTICS=true` (optional but recommended with GA4)
   - Redeploy after saving.
3. Open https://fixly.tech → Events Manager → Test events → confirm **PageView**.
4. Submit a test waitlist entry → confirm **CompleteRegistration** (and custom `waitlist_signup_completed`).

Do **not** run ads until PageView + CompleteRegistration appear.

---

## 1) Where to put the ₪100 (exact)

| Field | Value |
|-------|--------|
| Platform | **Meta Ads Manager** only (Facebook + Instagram) |
| Objective | **Sales** or **Leads** → optimize for **CompleteRegistration** (fallback: Landing page views if Pixel is new / learning) |
| Budget | **₪100 lifetime** (or ₪50/day × 2 days) |
| Destination URL | See UTM link below |
| Placements | Advantage+ placements (FB Feed + IG Feed/Stories/Reels) |
| Geo | **Israel** |
| Language | Hebrew |
| Age | **25–55** |
| Gender | All |
| Audience | Start with **Advantage+ / broad** in Israel + Hebrew. If too expensive after ₪40, add interest stack: home improvement, DIY, real estate, parenting, local services — keep one ad set only. |
| Creative | 1 image or short video + Hebrew primary text (below) |
| CTA button | **Sign up** / **Learn more** |

### Destination URL (copy-paste)

```
https://fixly.tech/?utm_source=meta&utm_medium=paid&utm_campaign=weekend_waitlist&utm_content=feed_v1
```

Use `utm_content=stories_v1` / `reels_v1` if you duplicate the ad for placement-specific creatives.

---

## 2) Creative copy (Hebrew)

**Primary text (option A — customers):**

```
יש תקלה בבית? די עם עשרות טלפונים.

Fixly — בקשה אחת, התאמה לבעל מקצוע מאומת, ומעקב עד סיום.

הצטרפו בחינם להרשמה המוקדמת לפני הפתיחה.
```

**Primary text (option B — pros, 30% of budget max):**

```
בעלי מקצוע: פחות לידים קרים, יותר בקשות רלוונטיות לפי אזור ותחום.

נרשמים לפיילוט של Fixly — עדיפות בכניסה + 3 לידים ראשונים.
```

**Headline:** `Fixly — הצטרפו בחינם`  
**Description:** `הרשמה מוקדמת · בלי כרטיס אשראי`

**Image tip:** Clean photo of a home repair / tools / sink fix — no fake “1,000 joined” badges. Brand mark “Fixly.” visible. Square 1080×1080 + 9:16 crop for Stories/Reels.

Spend split recommendation: **70% customers / 30% pros** (two ads in one ad set, or two ad sets sharing the ₪100).

---

## 3) Campaign checklist in Ads Manager

1. Create campaign → objective Sales/Leads → turn **off** Advantage campaign budget if you want a hard ₪100 cap on one ad set.
2. Ad set: Israel, Hebrew, 25–55, budget ₪100 lifetime, end date +2–3 days.
3. Conversion event: **CompleteRegistration** (Pixel).
4. Ad: paste destination URL with UTMs, upload creative, paste Hebrew text, CTA Sign up.
5. Publish → wait for review.

---

## 4) What the product already tracks

| Event | When |
|-------|------|
| `PageView` | Pixel load |
| `ViewContent` | Waitlist landing view |
| `InitiateCheckout` | First focus / start on form |
| `CompleteRegistration` | Successful waitlist POST |
| Custom `waitlist_*` | Same funnel (Events Manager custom) |
| Post-signup WhatsApp share | Amplifies paid traffic (not organic posting by you) |

Attribution lands in waitlist rows via stored UTMs (`utm_source=meta`, etc.).

---

## 5) During the run

- After ~₪40–50: check CPL = spend ÷ CompleteRegistration.
- If CPL > ₪15 and volume is tiny: pause, tighten creative (stronger problem line), keep broad Israel.
- Do not open a second platform with this ₪100 — keep learning on Meta only.

---

## 6) Ops env reminder

```
NEXT_PUBLIC_META_PIXEL_ID=<pixel id>
NEXT_PUBLIC_APP_URL=https://fixly.tech
NEXT_PUBLIC_FF_PRELAUNCH=true
```
