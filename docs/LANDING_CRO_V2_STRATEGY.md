# Fixly Landing V2 — Growth / CRO Strategy

> **Status:** Adopted into `components/marketing/PrelaunchLanding.tsx` (not a parallel V2 file).
> Host split still applies: `fixly.tech` = landing, `*.vercel.app` = product app.

## Goal

The homepage has one job in pre-launch: convert qualified visitors into waitlist signups without pretending Fixly already has marketplace liquidity that does not exist yet.

Primary conversion:
- Customer: completed waitlist signup.
- Professional: completed waitlist signup with category/city when possible.

Secondary signals:
- Hero CTA click.
- Signup started.
- Audience switch.
- Scroll depth.

## Core diagnosis of V1

V1 is clear and technically sound, but it reads like a polite waitlist page. It explains the product, yet does not make the visitor *feel* the pain disappearing.

Main gaps:
1. The hero describes a marketplace instead of dramatizing the before/after experience.
2. The visual is decorative rather than showing the product flow.
3. The page has limited visual rhythm; sections are similar in density and energy.
4. The value proposition competes with generic marketplace language such as “verified pros” and “matching”.
5. The page asks users to believe a future product before showing how the flow will actually feel.
6. There is no persistent mobile conversion affordance.
7. Because this is pre-launch, fake counters/reviews would be harmful; the page needs trust without fabricated proof.

## V2 positioning

### Customer promise
“יש תקלה בבית? שולחים פעם אחת. Fixly ממשיכה משם.”

The positioning is not “another directory of professionals”. The category should be framed as a managed request flow:

problem -> one request -> relevant matching -> visible status -> completion

### Professional promise
“פחות לידים קרים. יותר בקשות רלוונטיות.”

Do not lead with discounts or free leads. Lead with relevance and operational clarity.

## What V2 changes

### 1. Hero becomes a product demo
A live-looking request card demonstrates:
- request submitted
- match found
- professional on the way
- verified professional context

This makes the product understandable before the visitor reads the rest of the page.

### 2. Stronger emotional framing
The copy attacks three pains:
- searching
- repeating the same story on calls
- not knowing what is happening

### 3. Better page rhythm
Alternating light/dark surfaces, large typography, cards, and a contained conversion panel create more visual life without turning the page into an animation demo.

### 4. Trust without fake social proof
Until Fixly has real volume, avoid invented counts, reviews, and “thousands of users” language. Use:
- no credit card
- low signup friction
- explicit pre-launch status
- product-flow transparency

### 5. Mobile sticky CTA
Mobile visitors always have a direct route to the signup form.

### 6. Audience-specific conversion
Customer and professional messaging diverge before the form, then feed the same waitlist API.

## Measurement plan

Keep existing GA4 events and add `variant: landing_v2` to distinguish traffic:
- `waitlist_page_view`
- `waitlist_cta_click`
- `waitlist_signup_started`
- `waitlist_signup_completed`
- `waitlist_form_error`
- `waitlist_scroll_depth`
- `waitlist_audience_switch`

### Funnel metrics

1. Hero CTA CTR = hero CTA clicks / landing views
2. Form-start rate = signup started / landing views
3. Form completion = signup completed / signup started
4. Landing conversion = signup completed / landing views
5. Professional mix = professional signups / all signups
6. Mobile conversion vs desktop conversion
7. Conversion by UTM source / campaign

## Test roadmap

Do not run many tests at once. Fix traffic quality first, then optimize the funnel.

### Test 1 — Hero promise
A: “יש תקלה בבית? שולחים פעם אחת. Fixly ממשיכה משם.”
B: “בעל מקצוע מתאים — בלי להתחיל 10 שיחות.”

Success metric: completed signup rate, not CTR alone.

### Test 2 — Customer CTA
A: “אני רוצה להיות ראשון/ה”
B: “שמרו לי מקום”

### Test 3 — Form friction
A: name + phone + optional city
B: phone only first, collect profile data after confirmation

Run only after enough traffic to measure drop-off.

### Test 4 — Professional offer
A: early-access positioning
B: pilot-priority positioning

Do not promise a fixed number of leads unless the operational supply/demand model can reliably honor it.

## Traffic strategy before paid scale

Paid acquisition should not be the first source of truth. The repo production checklist already requires real supply and a soft launch before paid ads.

Recommended order:
1. Recruit 20+ usable professionals in one pilot geography/category cluster.
2. Drive 20–50 real customer requests from communities, referrals, Bamakor cross-sell, and founder-led outreach.
3. Interview at least 5 customers who completed or abandoned the flow.
4. Replace assumptions on the landing page with real objections and proof.
5. Only then scale Meta / Google campaigns.

## Campaign architecture

### Customers
High-intent pain clusters:
- plumber / leak / blockage
- electrician / outage / socket
- AC repair
- handyman

Creative angle: “Stop searching. Send the problem once.”

### Professionals
Target by trade + geography.
Creative angle: “Relevant requests in your area, not another cold lead list.”

## SEO issue to verify

Public web indexes still surface historical Fixly.tech utility-tool content. The current repo already defines Fixly’s canonical URL and Hebrew metadata, but Search Console / sitemap / indexing should be checked after the correct deployment and domain are confirmed.

Actions:
1. Verify fixly.tech points to the intended Vercel project.
2. Confirm canonical = https://fixly.tech.
3. Submit sitemap in Google Search Console.
4. Request re-indexing of `/` after V2 is live.
5. Check indexed title/description after Google recrawls.

## Decision rule

Do not judge V2 by whether it “looks cooler”. Judge it by:
- more qualified signup completions
- lower form abandonment
- better customer/professional mix in the pilot city
- clearer feedback in user interviews

If those metrics do not improve, revert quickly and test the message before adding more visual complexity.
