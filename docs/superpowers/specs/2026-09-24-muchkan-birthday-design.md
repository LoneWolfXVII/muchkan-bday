# Muchkan Birthday Scroll Story: Design Spec

Date: 2026-09-24 · Deadline: 2026-09-25 (her birthday)

## Goal

A mobile-first, scroll-driven animated birthday page for Muskan (nickname "Muchkan"). It's a playful journey with short words and balloons popping. No heartfelt or personal message. The friend receives a link, opens it on her phone and scrolls through with her thumb.

Success means it feels smooth (60fps on a mid-range phone), fun and polished, with no layout jank on iOS Safari, and it can be deployed as a static site by tomorrow.

## Character: "Chibi her"

The approved reference art is in `.superpowers/brainstorm/78544-1790241612/content/character-v4.html` (the `#her`, `#plumeria` and `#bougain` symbols). It's based on her photo:
- Dark brown shoulder-length hair with bangs (`#3A2620`)
- Skin `#E0A988`, with shadow `#C98C6B`
- Thin round silver glasses (`#8E8E99`)
- Happy closed-eye smile arcs, blush `#F29B9B`, nose stud
- A white plumeria (`#FFF9F0`, yellow centre `#F6C343`) on top of her head
- Pink bougainvillea (`#E35FB0`) by her right ear
- Lilac tee (`#C9B3DB`, V-neck `#A98FC2`)
- Shoulders-up bust. **No arms, hands or cup** (explicitly rejected).

It is rebuilt as a React SVG component with separately animatable `<g>` groups: `hairBack`, `body`, `head` (containing the face), `eyesClosed`, `eyesOpen` (for blinks and looking around), `glasses`, `mouth`, `plumeria`, `bougain`, `bangs`. Every animated group gets `transform-box: fill-box` and a physically correct `transform-origin`: the head pivots at the neck and the flowers at their stems.

## Story (scroll-driven, all reversible)

| # | Scene | Animation | Words |
|---|---|---|---|
| 0 | Hello | On load: Muchkan bounces in (squash and stretch), blinks and tilts her head. A bouncing "scroll" hint. | "hey Muchkan" |
| 1 | Balloons rise | Lilac, pink and yellow balloons float up from below, each swaying at its own speed. She looks up. | "look up" |
| 2 | Pop pop pop | Balloons pop one by one as she scrolls: a burst plus scattered confetti bits, each pop revealing a word. | "it's" · "your" · "day" |
| 3 | Petal storm | The plumeria on her head bursts into falling petals; the background goes from cream to pink. | "bloom" |
| 4 | Cake | A cake rises and the candles light one by one as she scrolls. **Tap the cake (a real button) to blow out the candles**: flames go out, then a confetti burst. | "make a wish" |
| 5 | Finale | Background shifts to lilac night with drifting stars and balloons. "Happy Birthday, Muskan" letters bounce in with a stagger; she waves (head wiggle and bounce). Replay button (scrolls to top). | "Happy Birthday, Muskan" |

The only non-scroll motion is the intro bounce, the idle blink loop and the tap-triggered candle blow-out.

## Tech

- Vite, React and TypeScript.
- `gsap`, `@gsap/react` (`useGSAP`), `ScrollTrigger` and `lenis`.
- Lenis drives the scroll and is synced to ScrollTrigger through `gsap.ticker` (with `lagSmoothing(0)`).
- **Architecture:** one tall scroll track (about 700svh) with a pinned full-screen `stage` (`100svh`). There is one master GSAP timeline with `scrollTrigger: { scrub: true }`, and scenes are appended as labelled sub-timelines built by small per-scene functions.
- **Plain CSS with CSS variables** (no Tailwind):
  - `src/styles/tokens.css`: colours, fonts, fluid type through `clamp()`, easing curves and z-layers.
  - CSS Modules per component.
  - GSAP eases are registered with `CustomEase` to match the CSS tokens (or use equivalent named eases).
- **Fonts:** Fraunces (display) and Outfit (UI/body), self-hosted through `@fontsource-variable/*`. The critical font is preloaded with `font-display: swap`. No Inter/Roboto/Arial.
- Confetti, pops, petals and stars are hand-built SVG/DOM pieces animated by GSAP. **No confetti library.**
- Film-grain overlay: a fixed, `pointer-events: none` pseudo-element at about 0.04 opacity.
- **Components:**
  - `Muchkan.tsx`: the character rig.
  - `Balloon.tsx`: colour prop, with a string; sways from its knot.
  - `Cake.tsx`: a button with candles and flames.
  - `Confetti.tsx`: a pool of pieces plus a `burst(x, y)` helper through a ref.
  - `Petals.tsx`, `Stars.tsx`.
  - `App.tsx`: stage, Lenis setup and master timeline.
- Deploy: `npm run build` produces static `dist/`, deployable to Vercel.

## Quality rules (Web Interface Guidelines and taste skills)

- **Animation:**
  - Animate only `transform` and `opacity`; never `transition: all`.
  - Use custom easings, never linear or ease-in-out.
  - Set `will-change` only while an element is animating.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, skip Lenis smoothing and the scrub parallax. Scenes crossfade instead, and there are no confetti or petal storms.
- **Touch targets:** the cake and replay are native `<button>`s, at least 44px, with `:focus-visible` rings and accurate `aria-label`s. Use `touch-action: manipulation` and a styled `-webkit-tap-highlight-color`.
- **Viewport:** never disable zoom. Use `100svh`/`100dvh` (not `h-screen`). Respect `env(safe-area-inset-*)`. No horizontal overflow (`overflow-x: clip` on the root).
- **Semantics:** the words are real text, with `<h1>` for the finale and the rest as `<p>`/`<h2>`. Decorative SVG gets `aria-hidden`. The `<title>` is "Happy Birthday, Muskan". Use `translate="no"` on Muchkan/Muskan.
- **Browser chrome:** the `<meta name="theme-color">` updates to match each scene's background.
- **Typography:** `text-wrap: balance` on headings and a proper "…" character. No emojis and no meta labels like "SECTION 01".
- **Testing:**
  - Playwright at 390×844 (iPhone): scroll through each scene, screenshot each, and check that the console has no errors.
  - Also check 1440×900 and an ultra-wide width.
  - Check reduced-motion mode renders all words.

## Out of scope

Music/audio, a personal message, a CMS, analytics, multiple pages and Tailwind.
