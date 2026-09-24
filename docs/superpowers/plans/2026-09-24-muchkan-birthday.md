# Muchkan Birthday Scroll Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, mobile-first, scroll-driven birthday page for Muskan ("Muchkan"): a chibi character, balloons that rise and pop, a petal storm, a tappable cake, and a "Happy Birthday, Muskan" finale, deployable to Vercel by tomorrow.

**Architecture:** One tall `<main>` track (700svh) holds a `position: sticky` 100svh stage (native pinning, no ScrollTrigger pin-spacer, so no iOS pin jank). One master GSAP timeline is scrubbed by a single ScrollTrigger over the track; each scene is a small function in `src/scenes.ts` that returns a sub-timeline added at a fixed time (`T.balloons`, `T.pops`, …). Lenis drives scrolling and is synced to ScrollTrigger through `gsap.ticker`. A `prefers-reduced-motion` variant builds a crossfade-only timeline and skips Lenis, confetti and petals. The only non-scroll motion: the intro bounce, the idle blink loop, and the tap-triggered candle blow-out plus its confetti burst.

**Tech Stack:** Vite 7 + React 19 + TypeScript (react-ts template), `gsap` 3.15 (ScrollTrigger, CustomEase), `@gsap/react`, `lenis`, plain CSS with variables and CSS Modules, `@fontsource-variable/fraunces` and `@fontsource-variable/outfit` (woff2 files copied to `public/fonts/`), `@playwright/test` for verification.

**Spec:** `/Users/nischalgupta/Documents/PROJECTS/personal/muchkan/docs/superpowers/specs/2026-09-24-muchkan-birthday-design.md`
**Character reference art:** `/Users/nischalgupta/Documents/PROJECTS/personal/muchkan/.superpowers/brainstorm/78544-1790241612/content/character-v4.html` (`#her`, `#plumeria`, `#bougain` only; `#fingers` and `#steam` are rejected and must not be ported)

## Global Constraints

- Project root: `/Users/nischalgupta/Documents/PROJECTS/personal/muchkan`. All paths below are relative to it unless absolute. It has its own `.git`; commit only the paths named in each task's commit step.
- Vite + React + TypeScript. Plain CSS with CSS variables (`src/styles/tokens.css`) and CSS Modules. **No Tailwind.**
- Animation libs: `gsap`, `@gsap/react`, `lenis` only. **No confetti/animation libraries.** Confetti, pops, petals and stars are hand-built SVG/DOM.
- Lenis synced to ScrollTrigger via `gsap.ticker` with `gsap.ticker.lagSmoothing(0)`.
- One pinned `100svh` stage; one master timeline with `scrollTrigger: { scrub: true }`; scenes appended by per-scene functions.
- Fonts: Fraunces (display) and Outfit (UI/body), self-hosted from `@fontsource-variable/*`. Critical font preloaded, `font-display: swap`. No Inter/Roboto/Arial.
- Animate only `transform` and `opacity` (GSAP `autoAlpha` = opacity + visibility). Never `transition: all`. Custom easings (`CustomEase` "soft" `0.22,1,0.36,1` and "pop" `0.34,1.56,0.64,1`, plus GSAP named `power*`/`back`); never `linear`/`ease-in-out`, with one physics exception: balloon sway and head wiggle use `sine.inOut` because a pendulum is sinusoidal. `will-change` only while animating (confetti sets it in `onStart`, clears in `onComplete`; nothing else sets it).
- Reduced motion: no Lenis, no scrub parallax, scenes crossfade, no confetti or petal storms.
- Touch targets: cake and replay are native `<button>`s ≥ 44px, `:focus-visible` rings, accurate `aria-label`s, `touch-action: manipulation`, styled `-webkit-tap-highlight-color`.
- Viewport: never disable zoom; `100svh`; `env(safe-area-inset-*)`; `overflow-x: clip` on root.
- Semantics: words are real text (`<p>`/`<h2>`), finale is `<h1>`, decorative SVG `aria-hidden="true"`, `<title>` is exactly `Happy Birthday, Muskan`, `translate="no"` on Muchkan/Muskan text.
- `<meta name="theme-color">` updates to match each scene's background (cream `#FBF3E8`, pink `#F7C6D6`, night `#33254F`).
- Typography: `text-wrap: balance` on headings; proper `’` and `…` characters; no emojis; no meta labels like "SECTION 01".
- Testing = `npm run build` (runs `tsc -b`) + Playwright at 390×844, 1440×900 and 2560×1080, screenshots per scene, zero console errors, reduced-motion renders every word. No unit-test suites for animation code.
- Deadline tomorrow: no speculative abstractions; fewest files.
- GSAP tween rule (prevents `immediateRender` clobbering in the scrubbed timeline): a target gets **at most one `fromTo`, and only as its first tween**; every later tween on that target is a `to`. Initial states that are not covered by a `fromTo` are set in `setup()` with `gsap.set`.

## Review Focus

1. **Scrolling before the intro finishes** (thumb moves at t=0.3s): the scrubbed `to` on "hey Muchkan" would record a half-faded start state and scrolling back would show a ghost word. Pinned in Task 6: the ScrollTrigger `onUpdate` completes the intro timeline (`introTl.progress(1)`) as soon as progress > 0.02; the Playwright test in Task 10 scrolls immediately after load and asserts "hey Muchkan" is visible again at progress 0.
2. **Tapping the cake, then scrolling back and forward**: the scrub relights candles via `[data-flame-rise]` while the blow-out animates the inner `[data-flame]`, so they never fight; after a blow-out the candles stay out on re-scroll. Pinned in Task 10: after `click`, scroll to petals and back to cake, assert the button's label is still "Candles out. Wish made".
3. **Double tap on the cake**: must not fire two confetti bursts or re-animate. Pinned in Task 8 (`if (blown) return` guard) and Task 10 (`dblclick` then assert label).
4. **Horizontal overflow on 390px** from off-stage balloons, petals or confetti: root has `overflow-x: clip`, stage `overflow: clip`, confetti container `overflow: clip`. Pinned in Task 10: `scrollWidth <= innerWidth` at every viewport.
5. **Keyboard users**: hidden buttons must not be tab stops. Cake and replay are hidden with `autoAlpha` (visibility hidden removes them from tab order) until their scene. Pinned in Task 10: at progress 0, `Tab` focuses nothing labelled "Blow out the candles" or "Play again".

---

### Task 1: Scaffold, dependencies, fonts, tokens and global CSS

**Files:**
- Create (via scaffold): `package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `public/fonts/fraunces.woff2`, `public/fonts/outfit.woff2`
- Modify: `.gitignore`, `index.html`, `src/main.tsx`
- Delete: `src/App.css`, `src/index.css`, `src/assets/`, `public/vite.svg`

**Interfaces:**
- Produces: CSS custom properties consumed by every later CSS Module (`--bg-cream`, `--bg-pink`, `--bg-night`, `--ink`, `--ink-on-night`, `--lilac`, `--lilac-deep`, `--pink`, `--yellow`, `--blush`, `--font-display`, `--font-ui`, `--step-word`, `--step-title`, `--step-ui`, `--ease-out`, `--ease-bounce`, `--z-bg` … `--z-grain`); font families `'Fraunces Variable'` and `'Outfit Variable'`.

**Quality rules satisfied:** fonts self-hosted + preload + `font-display: swap`, no Inter/Roboto/Arial; `<title>`; `theme-color` meta; zoom never disabled; `overflow-x: clip`; film grain overlay; `text-wrap: balance`; `touch-action: manipulation`; styled tap highlight; `:focus-visible`; no `transition: all`.

- [ ] **Step 1: Scaffold into a scratch dir and copy in (the project dir is not empty; `--overwrite` would delete `docs/` and `.git`)**

```bash
cd /private/tmp/claude-501/-Users-nischalgupta-Documents-PROJECTS-personal-muchkan/74bdd40e-df79-4785-b459-b586f46413ed/scratchpad
rm -rf muchkan-scaffold
npm create vite@latest muchkan-scaffold -- --template react-ts --no-interactive
cat muchkan-scaffold/.gitignore >> /Users/nischalgupta/Documents/PROJECTS/personal/muchkan/.gitignore
rm muchkan-scaffold/.gitignore
cp -Rn muchkan-scaffold/. /Users/nischalgupta/Documents/PROJECTS/personal/muchkan/
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
rm -rf src/App.css src/index.css src/assets public/vite.svg
printf '\ne2e/shots/\ne2e/results/\n' >> .gitignore
ls
```

Expected: `index.html package.json src public tsconfig.json vite.config.ts …` next to `docs/`.

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
npm install
npm install gsap @gsap/react lenis @fontsource-variable/fraunces @fontsource-variable/outfit
npm install -D @playwright/test
npx playwright install chromium
```

Expected: `package.json` lists `gsap ^3.15`, `@gsap/react ^2.1`, `lenis ^1.3`, both fontsource packages, `@playwright/test ^1.63`.

- [ ] **Step 3: Copy the two woff2 files to `public/fonts/`**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
mkdir -p public/fonts
cp node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2 public/fonts/fraunces.woff2
cp node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2 public/fonts/outfit.woff2
ls -la public/fonts
```

Expected: two files, ~37kB and ~32kB. (The fontsource packages are the source of truth; we serve the files ourselves so `index.html` can preload a stable `/fonts/fraunces.woff2` URL.)

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#FBF3E8" />
    <link rel="preload" href="/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin />
    <title>Happy Birthday, Muskan</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `src/styles/tokens.css`**

```css
:root {
  /* scene backgrounds: the theme-color meta mirrors these (src/scenes.ts themeColor) */
  --bg-cream: #FBF3E8;
  --bg-pink: #F7C6D6;
  --bg-night: #33254F;

  --ink: #3A2620;
  --ink-on-night: #FFF9F0;
  --lilac: #C9B3DB;
  --lilac-deep: #A98FC2;
  --pink: #E35FB0;
  --yellow: #F6C343;
  --blush: #F29B9B;

  --font-display: 'Fraunces Variable', Georgia, serif;
  --font-ui: 'Outfit Variable', system-ui, sans-serif;

  --step-word: clamp(2.5rem, 2rem + 4vw, 5.5rem);
  --step-title: clamp(2.25rem, 1.5rem + 5vw, 6rem);
  --step-ui: clamp(0.95rem, 0.9rem + 0.3vw, 1.1rem);

  /* mirrored in GSAP as CustomEase "soft" and "pop" (src/scenes.ts) */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  --z-bg: 0;
  --z-stars: 1;
  --z-balloons: 2;
  --z-her: 3;
  --z-petals: 4;
  --z-cake: 5;
  --z-words: 6;
  --z-ui: 7;
  --z-confetti: 8;
  --z-grain: 9;
}
```

- [ ] **Step 6: Write `src/styles/global.css`**

```css
@font-face {
  font-family: 'Fraunces Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/fraunces.woff2') format('woff2');
}
@font-face {
  font-family: 'Outfit Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/outfit.woff2') format('woff2');
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }

html {
  overflow-x: clip;
  -webkit-text-size-adjust: 100%;
  background: var(--bg-cream);
}

body {
  overflow-x: clip;
  background: var(--bg-cream);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: var(--step-ui);
  line-height: 1.4;
}

/* film grain */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: var(--z-grain);
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}

h1, h2 { text-wrap: balance; }

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgb(201 179 219 / 0.35);
}

:focus-visible {
  outline: 3px solid var(--lilac-deep);
  outline-offset: 4px;
  border-radius: 8px;
}
```

- [ ] **Step 7: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8: Replace `src/App.tsx` with a placeholder that builds**

```tsx
export default function App() {
  return <main>hey Muchkan</main>
}
```

- [ ] **Step 9: Write the peek script `e2e/peek.mjs`** (serves `dist/`, drives a 390×844 page, prints console errors; used by every later task to look at the work without a foreground `sleep`)

```js
// usage: node e2e/peek.mjs [--reduce] step...
//   step = <t>            scroll to timeline second t (0..6)
//        | click:<name>   click the button with that accessible name
//        | shot:<file>    screenshot to e2e/shots/<file>.png
// run `npm run build` first; run from the project root.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const reduce = args.includes('--reduce')
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
while (!(await fetch('http://localhost:4173').then((r) => r.ok).catch(() => false))) {
  await new Promise((r) => setTimeout(r, 200))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: reduce ? 'reduce' : 'no-preference' })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:4173')
await page.waitForTimeout(1800)

for (const step of args.filter((a) => a !== '--reduce')) {
  if (step.startsWith('click:')) await page.getByRole('button', { name: step.slice(6) }).click()
  else if (step.startsWith('shot:')) await page.screenshot({ path: `e2e/shots/${step.slice(5)}.png` })
  else await page.evaluate((t) => window.scrollTo(0, (t / 6) * (document.documentElement.scrollHeight - innerHeight)), Number(step))
  await page.waitForTimeout(800)
}

console.log({
  errors,
  scrollY: await page.evaluate(() => window.scrollY),
  theme: await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')),
  cake: await page.evaluate(() => document.querySelector('[data-cake]')?.getAttribute('aria-label') ?? null),
})
await browser.close()
server.kill()
```

- [ ] **Step 10: Build and smoke the peek script**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && node e2e/peek.mjs shot:smoke
```

Expected: `tsc -b` silent, `vite build` prints `dist/index.html` and assets; `grep -c 'fonts/fraunces.woff2' dist/index.html` prints `1`; peek prints `{ errors: [], scrollY: 0, theme: '#FBF3E8', cake: null }` and `e2e/shots/smoke.png` shows "hey Muchkan" in Fraunces on cream.

- [ ] **Step 11: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add .gitignore index.html package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js src public e2e/peek.mjs
git commit -m "chore: scaffold Vite React TS app with tokens, fonts, global CSS and peek script"
```

(If the scaffold produced `.oxlintrc.json` instead of `eslint.config.js`, add that file instead.)

---

### Task 2: Muchkan character component

**Files:**
- Create: `src/components/Muchkan.tsx`, `src/components/Muchkan.module.css`
- Modify: `src/App.tsx` (render it so it can be looked at)

**Interfaces:**
- Produces: `<Muchkan />` (no props). Root `<svg data-her>`; animatable groups selectable as `[data-part="hairBack" | "body" | "head" | "bangs" | "eyesClosed" | "eyesOpen" | "glasses" | "mouth" | "plumeria" | "bougain"]`. `head` contains the face, both eye groups, glasses, mouth and both flowers. `eyesOpen` starts at opacity 0. `plumeria`/`bougain` are wrapped in a static placement `<g transform>` so the animated group itself has no transform attribute. Head pivot for GSAP: `svgOrigin: '100 175'` (the neck, in viewBox units).

**Quality rules satisfied:** decorative SVG `aria-hidden`; `transform-box: fill-box` + physically correct `transform-origin` on every animated group; exact colours from the approved art; no arms, hands or cup.

- [ ] **Step 1: Write `src/components/Muchkan.tsx`** (paths and colours copied verbatim from `character-v4.html`)

```tsx
import styles from './Muchkan.module.css'

const PETAL_ANGLES = [0, 72, 144, 216, 288]

export default function Muchkan() {
  return (
    <svg className={styles.her} viewBox="30 20 140 220" aria-hidden="true" data-her>
      <g data-part="hairBack">
        <path
          d="M100 30 C150 30 165 70 162 110 C160 140 168 155 158 170 C150 177 140 167 136 172 L64 172 C60 167 50 177 42 170 C32 155 40 140 38 110 C35 70 50 30 100 30 Z"
          fill="#3A2620"
        />
      </g>

      <g data-part="body">
        <path d="M46 240 C46 204 58 184 100 180 C142 184 154 204 154 240 Z" fill="#C9B3DB" />
        <rect x="90" y="145" width="20" height="30" fill="#D69D7C" />
        <path d="M86 176 L100 192 L114 176" fill="#D69D7C" stroke="#A98FC2" strokeWidth="3" strokeLinejoin="round" />
      </g>

      <g data-part="head">
        <ellipse cx="100" cy="102" rx="50" ry="52" fill="#E0A988" />
        <g data-part="bangs">
          <path
            d="M50 100 C52 58 78 46 100 46 C132 45 152 62 151 96 C140 74 122 68 110 74 C100 64 78 64 68 80 C60 84 55 92 50 100 Z"
            fill="#3A2620"
          />
          <path
            d="M51 92 C45 118 49 140 56 152 C58 130 57 110 60 96 Z M149 92 C155 118 151 140 144 152 C142 130 143 110 140 96 Z"
            fill="#3A2620"
          />
        </g>
        <path d="M72 94 L86 93 M114 93 L128 94" stroke="#3A2620" strokeWidth="2.5" strokeLinecap="round" />
        <g data-part="eyesClosed">
          <path
            d="M73 110 Q80 103 87 110 M113 110 Q120 103 127 110"
            stroke="#2A1A16"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g data-part="eyesOpen" opacity="0">
          <circle cx="80" cy="109" r="3.2" fill="#2A1A16" />
          <circle cx="120" cy="109" r="3.2" fill="#2A1A16" />
        </g>
        <g data-part="glasses">
          <rect x="64" y="96" width="32" height="27" rx="11" fill="#fff" fillOpacity=".18" stroke="#8E8E99" strokeWidth="2.5" />
          <rect x="104" y="96" width="32" height="27" rx="11" fill="#fff" fillOpacity=".18" stroke="#8E8E99" strokeWidth="2.5" />
          <path d="M96 105 Q100 101 104 105" stroke="#8E8E99" strokeWidth="2.5" fill="none" />
        </g>
        <ellipse cx="72" cy="130" rx="7" ry="4" fill="#F29B9B" opacity=".6" />
        <ellipse cx="128" cy="130" rx="7" ry="4" fill="#F29B9B" opacity=".6" />
        <path d="M99 118 Q102 124 98 126" stroke="#C98C6B" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="96" cy="124" r="1.4" fill="#DADAE3" />
        <g data-part="mouth">
          <path d="M88 136 Q100 145 112 136" stroke="#8A4A3E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>

        <g transform="translate(92 44) rotate(-15)">
          <g data-part="plumeria">
            <g stroke="#E9D9C4" strokeWidth="1" fill="#FFF9F0">
              {PETAL_ANGLES.map((a) => (
                <ellipse key={a} cx="0" cy="-11" rx="6.5" ry="12" transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r="5" fill="#F6C343" />
          </g>
        </g>

        <g transform="translate(150 98)">
          <g data-part="bougain">
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#E35FB0" />
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#EE7CC4" transform="rotate(120)" />
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#D94FA4" transform="rotate(240)" />
            <circle r="1.6" fill="#FFF3B0" />
          </g>
        </g>
      </g>
    </svg>
  )
}
```

- [ ] **Step 2: Write `src/components/Muchkan.module.css`**

```css
.her {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

/* GSAP passes transformOrigin/svgOrigin per tween; these cover the same pivots for anything CSS-driven */
.her [data-part] { transform-box: fill-box; }
.her [data-part='head'] { transform-origin: 50% 100%; }
.her [data-part='plumeria'],
.her [data-part='bougain'],
.her [data-part='eyesClosed'],
.her [data-part='eyesOpen'] { transform-origin: 50% 50%; }
```

- [ ] **Step 3: Render it in `src/App.tsx`**

```tsx
import Muchkan from './components/Muchkan'

export default function App() {
  return (
    <main style={{ width: 'min(66vw, 44svh)', margin: '10vh auto' }}>
      <Muchkan />
    </main>
  )
}
```

- [ ] **Step 4: Build and look at it**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && node e2e/peek.mjs shot:muchkan
```

Read `e2e/shots/muchkan.png`. Expected: the same portrait as the card in `character-v4.html` — dark hair, glasses, closed-eye smile, plumeria on top, pink bougainvillea by the right ear, lilac tee. No arms, no cup.

- [ ] **Step 5: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/components/Muchkan.tsx src/components/Muchkan.module.css src/App.tsx
git commit -m "feat: Muchkan character SVG with animatable groups"
```

---

### Task 3: Balloon and Cake components

**Files:**
- Create: `src/components/Balloon.tsx`, `src/components/Balloon.module.css`, `src/components/Cake.tsx`, `src/components/Cake.module.css`

**Interfaces:**
- Produces: `<Balloon color={string} style={CSSProperties} />` → root `<svg data-balloon>` (absolutely positioned; the caller passes `left`/`top` via `style`). Inside: `[data-string]`, `[data-shard]` ×8 (drawn under the body so they only show once the body has scaled away), `[data-body]` (pivot for sway/pop: `transformOrigin: '50% 100%'` = the knot).
- Produces: `<Cake blown={boolean} onBlow={() => void} />` → `<button data-cake>` with `aria-label` `"Blow out the candles"` / `"Candles out. Wish made"`. Inside: five candles, each with `[data-flame-rise]` (scrub-controlled, scale 0 → 1 as candles light) wrapping `[data-flame]` (tap-controlled, scale 1 → 0 on blow-out). Both pivot `transformOrigin: '50% 100%'`.

**Quality rules satisfied:** decorative SVG `aria-hidden`; cake is a native `<button>` ≥ 44px with an accurate `aria-label` and `aria-pressed`; `env(safe-area-inset-bottom)`; only transform/opacity will be animated.

- [ ] **Step 1: Write `src/components/Balloon.tsx`**

```tsx
import type { CSSProperties } from 'react'
import styles from './Balloon.module.css'

const SHARDS = [0, 1, 2, 3, 4, 5, 6, 7]

type Props = { color: string; style?: CSSProperties }

export default function Balloon({ color, style }: Props) {
  return (
    <svg className={styles.balloon} viewBox="0 0 60 130" aria-hidden="true" data-balloon style={style}>
      <path
        data-string
        d="M30 74 C22 90 40 104 30 128"
        fill="none"
        stroke="#8E8E99"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {SHARDS.map((i) => (
        <circle key={i} data-shard cx="30" cy="40" r="3" fill={color} />
      ))}
      <g data-body>
        <ellipse cx="30" cy="36" rx="26" ry="32" fill={color} />
        <ellipse cx="20" cy="22" rx="6" ry="10" fill="#fff" opacity=".35" transform="rotate(-20 20 22)" />
        <path d="M30 66 L25 74 L35 74 Z" fill={color} />
      </g>
    </svg>
  )
}
```

- [ ] **Step 2: Write `src/components/Balloon.module.css`**

```css
.balloon {
  position: absolute;
  z-index: var(--z-balloons);
  width: clamp(64px, 16vw, 120px);
  height: auto;
  overflow: visible;
  pointer-events: none;
}
```

- [ ] **Step 3: Write `src/components/Cake.tsx`**

```tsx
import styles from './Cake.module.css'

const CANDLE_X = [22, 40, 58, 76, 94]

type Props = { blown: boolean; onBlow: () => void }

export default function Cake({ blown, onBlow }: Props) {
  return (
    <button
      type="button"
      className={styles.cake}
      data-cake
      onClick={onBlow}
      aria-pressed={blown}
      aria-label={blown ? 'Candles out. Wish made' : 'Blow out the candles'}
    >
      <svg viewBox="0 0 116 120" aria-hidden="true">
        <rect x="8" y="80" width="100" height="34" rx="8" fill="#C9B3DB" />
        <rect x="18" y="58" width="80" height="26" rx="6" fill="#F7C6D6" />
        <path d="M18 62 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 v-6 H18 z" fill="#FFF9F0" />
        <rect x="8" y="78" width="100" height="6" rx="3" fill="#FFF9F0" />
        {CANDLE_X.map((x) => (
          <g key={x}>
            <rect x={x - 3} y="36" width="6" height="24" rx="2" fill="#FFF9F0" stroke="#E35FB0" strokeWidth="1.5" />
            <g data-flame-rise>
              <g data-flame>
                <ellipse cx={x} cy="28" rx="4.5" ry="8" fill="#F6C343" />
                <ellipse cx={x} cy="30" rx="2" ry="4" fill="#FFF3B0" />
              </g>
            </g>
          </g>
        ))}
      </svg>
    </button>
  )
}
```

- [ ] **Step 4: Write `src/components/Cake.module.css`**

```css
.cake {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 6svh);
  translate: -50% 0; /* GSAP animates `transform` (y); the CSS translate composes with it */
  z-index: var(--z-cake);
  width: clamp(160px, 42vw, 280px);
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
}

.cake svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.cake [data-flame-rise],
.cake [data-flame] {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npx tsc -b
```

Expected: no output, exit 0. (Components are not rendered yet; Task 5 places them.)

- [ ] **Step 6: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/components/Balloon.tsx src/components/Balloon.module.css src/components/Cake.tsx src/components/Cake.module.css
git commit -m "feat: Balloon and Cake components"
```

---

### Task 4: Confetti, Petals and Stars components

**Files:**
- Create: `src/components/Confetti.tsx`, `src/components/Confetti.module.css`, `src/components/Petals.tsx`, `src/components/Petals.module.css`, `src/components/Stars.tsx`, `src/components/Stars.module.css`

**Interfaces:**
- Produces: `Confetti` (forwardRef) with `export type ConfettiHandle = { burst: (x: number, y: number) => void }` — `x`,`y` in viewport px. Fixed full-screen container, 48 pooled `<i>` pieces, hidden at rest. Non-scrubbed (only the cake tap calls it).
- Produces: `<Petals />` → `<div data-petals>` containing 14 `<i data-petal>` at the plumeria's position inside the character wrapper (left 44%, top 11%); hidden at rest.
- Produces: `<Stars />` → `<div data-stars>` (hidden at rest) containing 24 `<i data-star>` at deterministic positions.

**Quality rules satisfied:** hand-built confetti/petals/stars (no library); `will-change` only while the burst runs; `aria-hidden`; `pointer-events: none`; `overflow: clip` so nothing widens the page.

- [ ] **Step 1: Write `src/components/Confetti.tsx`**

```tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import gsap from 'gsap'
import styles from './Confetti.module.css'

export type ConfettiHandle = { burst: (x: number, y: number) => void }

const COUNT = 48

const Confetti = forwardRef<ConfettiHandle>(function Confetti(_, ref) {
  const root = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      const pieces = Array.from(root.current!.children)
      gsap.killTweensOf(pieces)
      gsap.set(pieces, { x, y, scale: 1, rotation: 0, autoAlpha: 1, willChange: 'transform' })
      gsap.to(pieces, {
        x: (i: number) => x + Math.cos((i / COUNT) * Math.PI * 2) * gsap.utils.random(60, 240),
        rotation: () => gsap.utils.random(-540, 540),
        scale: () => gsap.utils.random(0.5, 1.2),
        duration: 1.6,
        ease: 'power3.out',
        stagger: { each: 0.004, from: 'random' },
      })
      gsap.to(pieces, {
        y: (i: number) => y + Math.sin((i / COUNT) * Math.PI * 2) * gsap.utils.random(40, 140) + 260,
        autoAlpha: 0,
        duration: 1.6,
        ease: 'power2.in',
        onComplete: () => gsap.set(pieces, { willChange: 'auto' }),
      })
    },
  }), [])

  return (
    <div ref={root} className={styles.confetti} aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  )
})

export default Confetti
```

- [ ] **Step 2: Write `src/components/Confetti.module.css`**

```css
.confetti {
  position: fixed;
  inset: 0;
  z-index: var(--z-confetti);
  pointer-events: none;
  overflow: clip;
}

.confetti i {
  position: absolute;
  top: -6px;
  left: -4px;
  width: 8px;
  height: 12px;
  border-radius: 2px;
  background: var(--pink);
  visibility: hidden;
  opacity: 0;
}
.confetti i:nth-child(3n) { background: var(--yellow); }
.confetti i:nth-child(3n + 1) { background: var(--lilac-deep); }
.confetti i:nth-child(4n) { border-radius: 50%; background: var(--blush); }
```

- [ ] **Step 3: Write `src/components/Petals.tsx`**

```tsx
import styles from './Petals.module.css'

const COUNT = 14

export default function Petals() {
  return (
    <div className={styles.petals} aria-hidden="true" data-petals>
      {Array.from({ length: COUNT }, (_, i) => (
        <i key={i} data-petal />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/Petals.module.css`**

```css
/* anchored at the plumeria: viewBox (92,44) inside "30 20 140 220" → 44% across, 11% down */
.petals {
  position: absolute;
  left: 44%;
  top: 11%;
  width: 0;
  height: 0;
  z-index: var(--z-petals);
  pointer-events: none;
}

.petals i {
  position: absolute;
  left: -7px;
  top: -12px;
  width: 14px;
  height: 24px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: #FFF9F0;
  box-shadow: inset 0 0 0 1px #E9D9C4;
  visibility: hidden;
  opacity: 0;
}
```

- [ ] **Step 5: Write `src/components/Stars.tsx`**

```tsx
import styles from './Stars.module.css'

const STARS = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 70}%`,
  size: 2 + (i % 3),
}))

export default function Stars() {
  return (
    <div className={styles.stars} aria-hidden="true" data-stars>
      {STARS.map((s, i) => (
        <i key={i} data-star style={{ left: s.left, top: s.top, width: s.size, height: s.size }} />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Write `src/components/Stars.module.css`**

```css
.stars {
  position: absolute;
  inset: 0;
  z-index: var(--z-stars);
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}

.stars i {
  position: absolute;
  border-radius: 50%;
  background: #FFF9F0;
  box-shadow: 0 0 6px 1px rgb(255 249 240 / 0.6);
}
```

- [ ] **Step 7: Type-check**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npx tsc -b
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/components/Confetti.tsx src/components/Confetti.module.css src/components/Petals.tsx src/components/Petals.module.css src/components/Stars.tsx src/components/Stars.module.css
git commit -m "feat: Confetti burst pool, Petals and Stars"
```

---

### Task 5: Stage layout, words and buttons (static)

**Files:**
- Create: `src/App.module.css`
- Modify: `src/App.tsx` (full rewrite)

**Interfaces:**
- Consumes: all components from Tasks 2–4.
- Produces the DOM the scenes query (all selectors scoped to the stage element):
  - `[data-bg="pink"]`, `[data-bg="night"]` fixed background layers (opacity 0)
  - `[data-balloon]` ×3 (lilac, blush, yellow), `[data-her-wrap]` (character wrapper containing `<Muchkan />` and `<Petals />`), `[data-cake]`, `[data-stars]`
  - words: `[data-word="hello"]`, `[data-word="lookup"]`, `[data-word="pops"]` containing `[data-pop]` ×3 (`it’s`, `your`, `day`), `[data-word="bloom"]`, `[data-word="wish"]`, `[data-word="title"]` (`<h1>`) containing `[data-letter]` spans
  - `[data-hint]`, `[data-replay]`
- Produces: `blow()` / `replay()` handlers are wired in Task 6 and Task 8; this task renders everything visible with no-op handlers.

**Quality rules satisfied:** `100svh` stage, `overflow-x: clip`, safe-area insets, zoom untouched; words are real text (`<p>`, `<h1>`); `translate="no"` on Muchkan/Muskan; replay is a native `<button>` ≥ 44px; proper `’`; no emojis or meta labels; `text-wrap: balance`.

- [ ] **Step 1: Write `src/App.tsx`**

```tsx
import { useRef, useState } from 'react'
import Muchkan from './components/Muchkan'
import Balloon from './components/Balloon'
import Cake from './components/Cake'
import Confetti, { type ConfettiHandle } from './components/Confetti'
import Petals from './components/Petals'
import Stars from './components/Stars'
import styles from './App.module.css'

const BALLOONS = [
  { color: '#C9B3DB', left: '12%', top: '10%' },
  { color: '#F29B9B', left: '42%', top: '4%' },
  { color: '#F6C343', left: '70%', top: '12%' },
]

const TITLE_WORDS = ['Happy', 'Birthday,', 'Muskan']

export default function App() {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const confetti = useRef<ConfettiHandle>(null)
  const [blown, setBlown] = useState(false)

  const blow = () => setBlown(true) // replaced in Task 8
  const replay = () => window.scrollTo({ top: 0 }) // replaced in Task 6

  return (
    <>
      <main ref={track} className={styles.track}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.bg} data-bg="pink" />
          <div className={styles.bg} data-bg="night" />
          <Stars />
          {BALLOONS.map((b) => (
            <Balloon key={b.color} color={b.color} style={{ left: b.left, top: b.top }} />
          ))}
          <div className={styles.her} data-her-wrap>
            <Muchkan />
            <Petals />
          </div>
          <Cake blown={blown} onBlow={blow} />

          <div className={styles.words}>
            <p data-word="hello" translate="no">hey Muchkan</p>
            <p data-word="lookup">look up</p>
            <p data-word="pops">
              <span data-pop>it’s</span> <span data-pop>your</span> <span data-pop>day</span>
            </p>
            <p data-word="bloom">bloom</p>
            <p data-word="wish">make a wish</p>
            <h1 data-word="title" translate="no" aria-label="Happy Birthday, Muskan">
              {TITLE_WORDS.map((word, w) => (
                <span key={w}>
                  <span className={styles.titleWord} aria-hidden="true">
                    {word.split('').map((ch, i) => (
                      <span key={i} data-letter>{ch}</span>
                    ))}
                  </span>
                  {w < TITLE_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
          </div>

          <p className={styles.hint} data-hint>scroll</p>
          <button type="button" className={styles.replay} data-replay onClick={replay}>
            Play again
          </button>
        </div>
      </main>
      <Confetti ref={confetti} />
    </>
  )
}
```

- [ ] **Step 2: Write `src/App.module.css`**

```css
.track {
  height: 700svh; /* 600svh of scroll = 6 timeline seconds (src/scenes.ts T) */
}

.stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: clip;
  isolation: isolate;
}

.bg {
  position: fixed; /* covers the dynamic viewport even when iOS chrome collapses */
  inset: 0;
  z-index: var(--z-bg);
  opacity: 0;
  pointer-events: none;
}
.bg[data-bg='pink'] { background: var(--bg-pink); }
.bg[data-bg='night'] { background: var(--bg-night); }

.her {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -42%;
  z-index: var(--z-her);
  width: min(66vw, 44svh);
}

.words {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 7svh);
  left: 16px;
  right: 16px;
  z-index: var(--z-words);
  display: grid;
  justify-items: center;
  text-align: center;
  pointer-events: none;
}
.words > * {
  grid-area: 1 / 1;
  font-family: var(--font-display);
  font-size: var(--step-word);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}
.words h1 {
  font-size: var(--step-title);
  color: var(--ink-on-night);
}
.words [data-pop] { display: inline-block; }
.titleWord { display: inline-block; white-space: nowrap; }
.words [data-letter] { display: inline-block; }

.hint {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 24px);
  translate: -50% 0;
  z-index: var(--z-ui);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  animation: bob 1.3s var(--ease-bounce) infinite alternate;
}
@keyframes bob {
  to { transform: translateY(-8px); }
}
@media (prefers-reduced-motion: reduce) {
  .hint { animation: none; }
}

.replay {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 28px);
  translate: -50% 0;
  z-index: var(--z-ui);
  min-height: 48px;
  padding: 12px 26px;
  border-radius: 999px;
  border: 2px solid var(--ink-on-night);
  background: transparent;
  color: var(--ink-on-night);
  font-weight: 500;
}
```

- [ ] **Step 3: Build and look at the static stage**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && node e2e/peek.mjs shot:stage
```

Read `e2e/shots/stage.png`. Expected: cream page; three balloons at the top; every word stacked on top of each other at the top (fine, they're separated by the timeline next); Muchkan centred; cake at the bottom; "scroll" hint and "Play again" button. Nothing overflows horizontally.

- [ ] **Step 4: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/App.tsx src/App.module.css
git commit -m "feat: stage layout with words, balloons, cake and buttons"
```

---

### Task 6: Lenis, ScrollTrigger, master timeline skeleton, intro and theme-color

**Files:**
- Create: `src/scenes.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces (in `src/scenes.ts`):
  - `type Q = ReturnType<typeof gsap.utils.selector>` (a stage-scoped selector)
  - `export const T = { hello: 0, balloons: 0.6, pops: 1.6, petals: 3.1, cake: 4.1, finale: 5.1, end: 6 }` — scene start times in timeline seconds. The ScrollTrigger scrubs 600svh over `T.end`, so 1s ≈ 100svh.
  - `export function themeColor(progress: number): string`
  - `export function intro(q: Q): gsap.core.Timeline` — bounce-in + head tilt + idle blink loop
  - `export function buildTimeline(q: Q): gsap.core.Timeline` — master timeline, full motion
  - `export function buildReducedTimeline(q: Q): gsap.core.Timeline` — crossfade variant (Task 9)
  - helpers `show(tl, targets, at)` and `hide(tl, targets, at)` used by every scene
  - CustomEase `soft` and `pop` registered at module load
- Consumes: DOM from Task 5.

**Quality rules satisfied:** Lenis ↔ ScrollTrigger via `gsap.ticker` + `lagSmoothing(0)`; one scrubbed master timeline; custom eases matching the CSS tokens; transform/opacity only; theme-color follows the scene; reduced motion skips Lenis and the intro bounce.

- [ ] **Step 1: Write `src/scenes.ts` with the skeleton, hello scene and intro**

```ts
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
CustomEase.create('soft', '0.22,1,0.36,1') // --ease-out
CustomEase.create('pop', '0.34,1.56,0.64,1') // --ease-bounce

export type Q = ReturnType<typeof gsap.utils.selector>

/** Scene start times in timeline seconds. 600svh of scroll is scrubbed over T.end, so 1s ≈ 100svh. */
export const T = { hello: 0, balloons: 0.6, pops: 1.6, petals: 3.1, cake: 4.1, finale: 5.1, end: 6 } as const

const CREAM = '#FBF3E8'
const PINK = '#F7C6D6'
const NIGHT = '#33254F'

export function themeColor(progress: number) {
  if (progress >= T.finale / T.end) return NIGHT
  if (progress >= T.petals / T.end) return PINK
  return CREAM
}

const HEAD = { svgOrigin: '100 175' } // neck pivot in viewBox units

// Word reveal/hide. `show` is the one fromTo a word gets; every later tween on it is a `to`.
function show(tl: gsap.core.Timeline, targets: gsap.TweenTarget, at: number) {
  return tl.fromTo(
    targets,
    { autoAlpha: 0, y: 24, scale: 0.9 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, ease: 'pop', stagger: 0.08 },
    at,
  )
}
function hide(tl: gsap.core.Timeline, targets: gsap.TweenTarget, at: number) {
  return tl.to(targets, { autoAlpha: 0, y: -30, duration: 0.2, ease: 'soft' }, at)
}

export function intro(q: Q) {
  const tl = gsap.timeline()
  tl.from(q('[data-her]'), {
    y: 80, scaleX: 1.25, scaleY: 0.7, autoAlpha: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'pop',
  })
    .from(q('[data-word="hello"]'), { y: 24, autoAlpha: 0, duration: 0.6, ease: 'soft' }, '-=0.4')
    .to(q('[data-part="head"]'), { rotation: -7, ...HEAD, duration: 0.5, ease: 'soft' }, '-=0.2')
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.7, ease: 'pop' })

  // idle blink: squeezes the closed-eye arcs (scaleY). No scene touches scaleY on this group, so nothing fights.
  gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.6 }).to(q('[data-part="eyesClosed"]'), {
    scaleY: 0.25, transformOrigin: '50% 50%', duration: 0.09, yoyo: true, repeat: 1, ease: 'soft',
  })
  return tl
}

/** Initial states not covered by a scene's first fromTo. */
function setup(q: Q) {
  gsap.set(q('[data-balloon]'), { y: () => window.innerHeight * 1.15 })
  gsap.set(q('[data-cake]'), { y: () => window.innerHeight * 0.6, autoAlpha: 0 })
  gsap.set(q('[data-flame-rise]'), { scale: 0, transformOrigin: '50% 100%' })
  gsap.set(q('[data-word="title"]'), { autoAlpha: 0 })
}

function sceneHello(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-hint]'), { autoAlpha: 0, duration: 0.25, ease: 'soft' }, 0)
  hide(tl, q('[data-word="hello"]'), 0.3)
  return tl
}

export function buildTimeline(q: Q) {
  setup(q)
  const tl = gsap.timeline({ defaults: { ease: 'soft' } })
  tl.add(sceneHello(q), T.hello)
  // Task 7: .add(sceneBalloons(q), T.balloons).add(scenePops(q), T.pops)
  // Task 8: .add(scenePetals(q), T.petals).add(sceneCake(q), T.cake)
  // Task 9: .add(sceneFinale(q), T.finale)
  return tl
}

export function buildReducedTimeline(q: Q) {
  // Task 9 fills this in; until then the reduced variant is the same skeleton without the intro
  setup(q)
  const tl = gsap.timeline({ defaults: { ease: 'soft' } })
  tl.add(sceneHello(q), T.hello)
  return tl
}
```

- [ ] **Step 2: Wire Lenis, ScrollTrigger and the timeline in `src/App.tsx`**

Replace the imports, hooks and handlers (keep the JSX from Task 5 unchanged):

```tsx
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Muchkan from './components/Muchkan'
import Balloon from './components/Balloon'
import Cake from './components/Cake'
import Confetti, { type ConfettiHandle } from './components/Confetti'
import Petals from './components/Petals'
import Stars from './components/Stars'
import { buildReducedTimeline, buildTimeline, intro, themeColor } from './scenes'
import styles from './App.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const BALLOONS = [
  { color: '#C9B3DB', left: '12%', top: '10%' },
  { color: '#F29B9B', left: '42%', top: '4%' },
  { color: '#F6C343', left: '70%', top: '12%' },
]

const TITLE_WORDS = ['Happy', 'Birthday,', 'Muskan']

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const confetti = useRef<ConfettiHandle>(null)
  const [blown, setBlown] = useState(false)

  // Lenis drives the scroll; ScrollTrigger listens to it through gsap.ticker.
  useEffect(() => {
    if (reduced()) return
    const l = new Lenis()
    l.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => l.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    lenis.current = l
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
      lenis.current = null
    }
  }, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(stage.current)
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!
      const isReduced = reduced()
      const tl = isReduced ? buildReducedTimeline(q) : buildTimeline(q)
      const introTl = isReduced ? null : intro(q)
      ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        animation: tl,
        onUpdate: (self) => {
          // Review Focus 1: a thumb that moves during the intro must not leave a half-faded "hey Muchkan"
          if (introTl && self.progress > 0.02 && introTl.progress() < 1) introTl.progress(1)
          const c = themeColor(self.progress)
          if (meta.content !== c) meta.content = c
        },
      })
    },
    { scope: stage },
  )

  const blow = () => setBlown(true) // replaced in Task 8

  const replay = () => {
    if (lenis.current) lenis.current.scrollTo(0, { duration: 1.6 })
    else window.scrollTo({ top: 0 })
  }

  return (
    /* JSX unchanged from Task 5 */
  )
}
```

- [ ] **Step 3: Build**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build
```

Expected: exit 0. If `tsc` rejects `'lenis/dist/lenis.css'`, that is a missing `vite/client` types include — confirm `src/vite-env.d.ts` has `/// <reference types="vite/client" />`.

- [ ] **Step 4: Check the intro and the hello scene in a browser**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && node e2e/peek.mjs shot:intro 0.5 shot:hello-out 0 shot:hello-back
```

Read the three PNGs in `e2e/shots/`. Expected: `intro.png` shows Muchkan settled with "hey Muchkan" and the "scroll" hint; `hello-out.png` shows word and hint gone; `hello-back.png` shows them back (reversible); output `errors: []`, `theme: '#FBF3E8'`, `cake: 'Blow out the candles'`.

- [ ] **Step 5: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/scenes.ts src/App.tsx
git commit -m "feat: Lenis + ScrollTrigger master timeline, intro and hello scene"
```

---

### Task 7: Scenes 1–2, balloons rise and pop

**Files:**
- Modify: `src/scenes.ts`

**Interfaces:**
- Consumes: `show`, `hide`, `HEAD`, `T`, `Q` from Task 6; `[data-balloon]`, `[data-body]`, `[data-string]`, `[data-shard]`, `[data-part="head"|"eyesClosed"|"eyesOpen"]`, `[data-word="lookup"]`, `[data-pop]`.
- Produces: `sceneBalloons(q)` (1.0s) and `scenePops(q)` (1.5s) added to the master timeline.

**Quality rules satisfied:** transform/opacity only; custom/named eases (sway is the documented `sine.inOut` pendulum exception); fully reversible scrub; pops are hand-built (shards inside the Balloon SVG).

- [ ] **Step 1: Add the two scene functions to `src/scenes.ts` (above `buildTimeline`)**

```ts
function sceneBalloons(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-balloon]'), { y: 0, duration: 0.7, stagger: 0.1, ease: 'soft' }, 0)
  // each balloon sways from its knot at its own speed (pendulum → sine)
  q('[data-body]').forEach((body, i) => {
    tl.fromTo(
      body,
      { rotation: -6 },
      { rotation: 6, duration: 0.18 - i * 0.03, repeat: 5 + i, yoyo: true, ease: 'sine.inOut', transformOrigin: '50% 100%' },
      0,
    )
  })
  // she looks up
  tl.to(q('[data-part="head"]'), { rotation: -8, ...HEAD, duration: 0.3, ease: 'soft' }, 0.15)
    .to(q('[data-part="eyesClosed"]'), { autoAlpha: 0, duration: 0.1 }, 0.15)
    .to(q('[data-part="eyesOpen"]'), { autoAlpha: 1, y: -3, duration: 0.1 }, 0.15)
  show(tl, q('[data-word="lookup"]'), 0.25)
  hide(tl, q('[data-word="lookup"]'), 0.8)
  return tl
}

function scenePops(q: Q) {
  const tl = gsap.timeline()
  const words = q('[data-pop]')
  q('[data-balloon]').forEach((balloon, i) => {
    const at = i * 0.45
    const body = balloon.querySelector('[data-body]')!
    const string = balloon.querySelector('[data-string]')!
    const shards = balloon.querySelectorAll('[data-shard]')
    tl.to(body, { scale: 1.2, duration: 0.06, ease: 'soft', transformOrigin: '50% 100%' }, at)
      .to(body, { scale: 0, duration: 0.04, ease: 'power4.in' }, at + 0.06)
      .to(string, { autoAlpha: 0, duration: 0.05 }, at + 0.06)
      .fromTo(
        shards,
        { x: 0, y: 0, autoAlpha: 1 },
        {
          x: (k: number) => Math.cos((k * Math.PI) / 4) * 34,
          y: (k: number) => Math.sin((k * Math.PI) / 4) * 34 + 18,
          autoAlpha: 0, duration: 0.3, ease: 'soft', stagger: 0.01,
        },
        at + 0.08,
      )
    show(tl, words[i], at + 0.1)
  })
  hide(tl, words, 1.4)
  return tl
}
```

- [ ] **Step 2: Add them to the master timeline in `buildTimeline`**

```ts
  tl.add(sceneHello(q), T.hello)
    .add(sceneBalloons(q), T.balloons)
    .add(scenePops(q), T.pops)
```

- [ ] **Step 3: Build and eyeball the scenes**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && node e2e/peek.mjs 1.2 shot:balloons 1.85 shot:pop1 2.9 shot:pop3 1.2 shot:back-balloons
```

Read the PNGs in `e2e/shots/`. Expected: `balloons.png` three balloons up, she looks up, "look up" visible; `pop1.png` first balloon gone with shards, "it’s"; `pop3.png` all three popped, "it’s your day"; `back-balloons.png` identical to `balloons.png` (reversible). `errors: []`.

- [ ] **Step 4: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/scenes.ts
git commit -m "feat: balloons rise and pop scenes"
```

---

### Task 8: Scenes 3–4, petal storm and cake with tap-to-blow

**Files:**
- Modify: `src/scenes.ts`, `src/App.tsx`

**Interfaces:**
- Consumes: `[data-bg="pink"]`, `[data-part="plumeria"|"head"|"eyesOpen"|"eyesClosed"]`, `[data-petal]`, `[data-word="bloom"|"wish"]`, `[data-cake]`, `[data-flame-rise]`, `[data-flame]`, `[data-her-wrap]`, `ConfettiHandle.burst`.
- Produces: `scenePetals(q)` (1.0s), `sceneCake(q)` (1.0s); the real `blow()` handler in App.

**Quality rules satisfied:** cake is a real `<button>` with an accurate, state-dependent `aria-label`; confetti burst is the hand-built pool; no burst under reduced motion; transform/opacity only; double-tap guard (Review Focus 3); scrub vs. tap use different elements so they never fight (Review Focus 2).

- [ ] **Step 1: Add the scene functions to `src/scenes.ts`**

```ts
function scenePetals(q: Q) {
  const tl = gsap.timeline()
  const plumeria = q('[data-part="plumeria"]')
  tl.to(q('[data-bg="pink"]'), { autoAlpha: 1, duration: 0.5 }, 0)
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.3 }, 0)
    .to(q('[data-part="eyesOpen"]'), { autoAlpha: 0, duration: 0.1 }, 0)
    .to(q('[data-part="eyesClosed"]'), { autoAlpha: 1, duration: 0.1 }, 0)
    .to(plumeria, { scale: 1.6, rotation: 40, duration: 0.08, ease: 'pop', transformOrigin: '50% 50%' }, 0.05)
    .to(plumeria, { scale: 0, duration: 0.05, ease: 'power4.in' }, 0.13)
    .fromTo(
      q('[data-petal]'),
      { autoAlpha: 1, x: 0, y: 0, rotation: 0 },
      {
        x: (i: number) => (i % 2 ? 1 : -1) * (30 + i * 14),
        y: (i: number) => window.innerHeight * (0.55 + (i % 4) * 0.1),
        rotation: (i: number) => (i % 2 ? 1 : -1) * (180 + i * 40),
        autoAlpha: 0, duration: 0.8, ease: 'soft', stagger: 0.015,
      },
      0.13,
    )
  show(tl, q('[data-word="bloom"]'), 0.25)
  hide(tl, q('[data-word="bloom"]'), 0.95)
  return tl
}

function sceneCake(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-cake]'), { y: 0, autoAlpha: 1, duration: 0.4, ease: 'pop' }, 0)
    .to(q('[data-her-wrap]'), { y: () => -window.innerHeight * 0.08, scale: 0.85, duration: 0.4, transformOrigin: '50% 50%' }, 0)
    .to(q('[data-flame-rise]'), { scale: 1, duration: 0.12, stagger: 0.08, ease: 'pop', transformOrigin: '50% 100%' }, 0.4)
  show(tl, q('[data-word="wish"]'), 0.5)
  return tl
}
```

And extend `buildTimeline`:

```ts
    .add(scenePops(q), T.pops)
    .add(scenePetals(q), T.petals)
    .add(sceneCake(q), T.cake)
```

- [ ] **Step 2: Replace the `blow` handler in `src/App.tsx`**

```tsx
  const blow = () => {
    if (blown) return // Review Focus 3: no double burst
    setBlown(true)
    const btn = stage.current!.querySelector<HTMLButtonElement>('[data-cake]')!
    gsap.to(btn.querySelectorAll('[data-flame]'), {
      scale: 0,
      transformOrigin: '50% 100%',
      duration: 0.35,
      stagger: 0.06,
      ease: 'power2.in',
      onComplete: () => {
        if (reduced()) return
        const r = btn.getBoundingClientRect()
        confetti.current?.burst(r.left + r.width / 2, r.top)
      },
    })
  }
```

- [ ] **Step 3: Build and eyeball**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && node e2e/peek.mjs 3.7 shot:petals 4.9 shot:cake "click:Blow out the candles" shot:blow 3.7 4.9 shot:cake-again
```

Read the PNGs in `e2e/shots/`. Expected: `petals.png` pink background, plumeria gone from her head, petals falling, "bloom"; `cake.png` cake up with five lit candles and "make a wish"; `blow.png` flames out and confetti mid-air; `cake-again.png` candles still out (Review Focus 2); output `theme: '#F7C6D6'`, `cake: 'Candles out. Wish made'`, `errors: []`.

- [ ] **Step 4: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/scenes.ts src/App.tsx
git commit -m "feat: petal storm and cake scenes with tap-to-blow confetti"
```

---

### Task 9: Finale scene, replay, and the reduced-motion timeline

**Files:**
- Modify: `src/scenes.ts`

**Interfaces:**
- Consumes: `[data-bg="night"]`, `[data-stars]`, `[data-star]`, `[data-body]`, `[data-string]`, `[data-balloon]`, `[data-cake]`, `[data-her-wrap]`, `[data-her]`, `[data-part="head"]`, `[data-word="title"]`, `[data-letter]`, `[data-replay]`, `[data-word="wish"]`.
- Produces: `sceneFinale(q)` (0.9s); the full `buildReducedTimeline(q)`.

**Quality rules satisfied:** `<h1>` finale with staggered letters that keep an accessible name; replay is a ≥ 44px native `<button>` hidden from the tab order until the finale (Review Focus 5); reduced motion = crossfades only, no confetti/petals/stars drift, no Lenis; theme-color reaches night.

- [ ] **Step 1: Add `sceneFinale` to `src/scenes.ts`**

```ts
function sceneFinale(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-bg="night"]'), { autoAlpha: 1, duration: 0.4 }, 0)
  hide(tl, q('[data-word="wish"]'), 0)
  tl.to(q('[data-cake]'), { y: () => window.innerHeight * 0.6, autoAlpha: 0, duration: 0.3 }, 0)
    .to(q('[data-her-wrap]'), { y: 0, scale: 1, duration: 0.4 }, 0)
    // stars
    .fromTo(q('[data-stars]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.1)
    .fromTo(q('[data-star]'), { y: 30 }, { y: -40, duration: 0.7, ease: 'soft', stagger: { each: 0.02, from: 'random' } }, 0.1)
    // balloons re-inflate and drift
    .to(q('[data-body]'), { scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.06, ease: 'pop', transformOrigin: '50% 100%' }, 0.15)
    .to(q('[data-string]'), { autoAlpha: 1, duration: 0.2 }, 0.2)
    .to(q('[data-balloon]'), { y: () => -window.innerHeight * 0.05, duration: 0.6, stagger: 0.05 }, 0.2)
    // title letters bounce in
    .to(q('[data-word="title"]'), { autoAlpha: 1, duration: 0.01 }, 0.25)
    .fromTo(
      q('[data-letter]'),
      { autoAlpha: 0, y: 40, scale: 0.6 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, stagger: 0.015, ease: 'pop' },
      0.25,
    )
    // she waves: head wiggle + bounce
    .to(q('[data-part="head"]'), { rotation: -8, ...HEAD, duration: 0.05 }, 0.3)
    .to(q('[data-part="head"]'), { rotation: 8, ...HEAD, duration: 0.1, repeat: 4, yoyo: true, ease: 'sine.inOut' }, 0.35)
    .to(q('[data-her]'), { y: -14, duration: 0.12, repeat: 5, yoyo: true, ease: 'pop' }, 0.3)
    .fromTo(q('[data-replay]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.7)
  return tl
}
```

Extend `buildTimeline`:

```ts
    .add(sceneCake(q), T.cake)
    .add(sceneFinale(q), T.finale)
```

- [ ] **Step 2: Replace `buildReducedTimeline` in `src/scenes.ts`**

```ts
/** prefers-reduced-motion: crossfades only. No parallax, pops, petals, confetti or drifting. */
export function buildReducedTimeline(q: Q) {
  gsap.set(q('[data-balloon]'), { autoAlpha: 0 })
  gsap.set(q('[data-cake]'), { autoAlpha: 0 })
  gsap.set(q('[data-flame-rise]'), { scale: 0, transformOrigin: '50% 100%' })
  gsap.set(q('[data-word="lookup"], [data-pop], [data-word="bloom"], [data-word="wish"], [data-word="title"], [data-replay]'), { autoAlpha: 0 })

  const tl = gsap.timeline({ defaults: { ease: 'soft', duration: 0.3 } })
  const fade = (sel: string, at: number, on = true, stagger = 0) =>
    tl.to(q(sel), { autoAlpha: on ? 1 : 0, stagger }, at)

  fade('[data-hint]', 0, false)
  fade('[data-word="hello"]', 0.3, false)

  fade('[data-balloon]', T.balloons)
  fade('[data-word="lookup"]', T.balloons + 0.2)
  fade('[data-word="lookup"]', T.pops - 0.3, false)

  fade('[data-pop]', T.pops + 0.2, true, 0.3)
  fade('[data-pop]', T.petals - 0.15, false)
  fade('[data-balloon]', T.petals - 0.15, false)

  fade('[data-bg="pink"]', T.petals)
  fade('[data-word="bloom"]', T.petals + 0.2)
  fade('[data-word="bloom"]', T.cake - 0.3, false)

  fade('[data-cake]', T.cake)
  tl.to(q('[data-flame-rise]'), { scale: 1, stagger: 0.08, transformOrigin: '50% 100%' }, T.cake + 0.3)
  fade('[data-word="wish"]', T.cake + 0.2)
  fade('[data-word="wish"]', T.finale - 0.1, false)
  fade('[data-cake]', T.finale - 0.1, false)

  fade('[data-bg="night"]', T.finale)
  fade('[data-stars]', T.finale + 0.2)
  fade('[data-word="title"]', T.finale + 0.3)
  fade('[data-replay]', T.finale + 0.6)
  return tl
}
```

- [ ] **Step 3: Build and eyeball both variants**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build
node e2e/peek.mjs 6 shot:finale "click:Play again" 
node e2e/peek.mjs --reduce 1.2 shot:r-balloons 2.9 shot:r-pops 3.7 shot:r-petals 4.9 shot:r-cake 6 shot:r-finale "click:Play again"
```

(The `click:Play again` step waits 800ms; Lenis' replay scroll takes 1.6s, so in full mode expect `scrollY` well below 6000 and falling, in reduced mode `scrollY: 0`.)

Read the PNGs in `e2e/shots/`. Expected: `finale.png` and `r-finale.png` show the night background, stars, balloons, "Happy Birthday, Muskan" in cream and "Play again"; the `r-*` frames show the right word per scene with static balloons, no petals, no confetti; theme after replay heading back to `#FBF3E8`; `errors: []` both runs.

- [ ] **Step 4: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add src/scenes.ts
git commit -m "feat: finale scene, replay and reduced-motion crossfade timeline"
```

---

### Task 10: Playwright verification suite

**Files:**
- Create: `playwright.config.ts`, `e2e/story.spec.ts`
- Modify: `package.json` (add `"test": "playwright test"` to scripts)

**Interfaces:**
- Consumes: the built site via `vite preview` on port 4173; `T` values duplicated as fractions (the spec file must not import `src/`).

**Quality rules satisfied:** the spec's Testing section in full — 390×844, 1440×900, 2560×1080, screenshot per scene, zero console errors, reduced motion renders all words — plus the five Review Focus checks, the ≥ 44px hit targets, `<title>`, theme-color and no horizontal overflow.

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/results',
  timeout: 90_000,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4173' },
})
```

- [ ] **Step 2: Add the script to `package.json`**

In `"scripts"`, add `"test": "playwright test"`.

- [ ] **Step 3: Write `e2e/story.spec.ts`**

```ts
import { test, expect, type Page } from '@playwright/test'

// Scene start times from src/scenes.ts T (end = 6), sampled a little inside each scene.
const SCENES = [
  { name: '0-hello', t: 0, text: 'hey Muchkan' },
  { name: '1-balloons', t: 1.2, text: 'look up' },
  { name: '2-pops', t: 2.9, text: 'day' },
  { name: '3-petals', t: 3.7, text: 'bloom' },
  { name: '4-cake', t: 4.9, text: 'make a wish' },
  { name: '5-finale', t: 6, heading: 'Happy Birthday, Muskan' },
]
const CAKE_T = 4.9
const END = 6

const VIEWPORTS = [
  { name: 'iphone', width: 390, height: 844 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 2560, height: 1080 },
]

async function scrollTo(page: Page, t: number) {
  await page.evaluate((p) => {
    window.scrollTo(0, p * (document.documentElement.scrollHeight - window.innerHeight))
  }, t / END)
  await page.waitForTimeout(800) // lenis + scrub settle
}

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    if (reduced && vp.name !== 'iphone') continue
    const label = `${vp.name}${reduced ? '-reduced' : ''}`

    test(`story at ${label}`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(e.message))

      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await page.goto('/')
      await expect(page).toHaveTitle('Happy Birthday, Muskan')

      // Review Focus 5: hidden buttons are not tab stops at the start
      await page.keyboard.press('Tab')
      const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '')
      expect(focusedLabel).not.toMatch(/Blow out the candles|Play again/)

      // Review Focus 1: scroll during the intro, then back to the top
      await page.waitForTimeout(300)
      await scrollTo(page, 1.2)
      await scrollTo(page, 0)
      await expect(page.getByText('hey Muchkan', { exact: true })).toBeVisible()
      await page.waitForTimeout(1200)

      for (const s of SCENES) {
        await scrollTo(page, s.t)
        if (s.text) await expect(page.getByText(s.text, { exact: true })).toBeVisible()
        if (s.heading) await expect(page.getByRole('heading', { level: 1, name: s.heading })).toBeVisible()
        await page.screenshot({ path: `e2e/shots/${label}/${s.name}.png` })
        // Review Focus 4: nothing widens the page
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      }

      expect(await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'))).toBe('#33254F')
      const replay = page.getByRole('button', { name: 'Play again' })
      await expect(replay).toBeVisible()
      const replayBox = (await replay.boundingBox())!
      expect(Math.min(replayBox.width, replayBox.height)).toBeGreaterThanOrEqual(44)

      // cake: hit target, tap, double tap, and survives a re-scroll (Review Focus 2 and 3)
      await scrollTo(page, CAKE_T)
      const cake = page.getByRole('button', { name: 'Blow out the candles' })
      await expect(cake).toBeVisible()
      const box = (await cake.boundingBox())!
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
      await cake.dblclick()
      const blownCake = page.getByRole('button', { name: 'Candles out. Wish made' })
      await expect(blownCake).toBeVisible()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `e2e/shots/${label}/4b-blown.png` })
      await scrollTo(page, 3.7)
      await scrollTo(page, CAKE_T)
      await expect(blownCake).toBeVisible()

      // replay
      await scrollTo(page, END)
      await replay.click()
      await page.waitForTimeout(2200)
      expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5)

      expect(errors).toEqual([])
    })
  }
}
```

- [ ] **Step 4: Run the suite**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm test
```

Expected: `4 passed` (iphone, iphone-reduced, laptop, ultrawide). `ls e2e/shots/iphone` lists `0-hello.png … 5-finale.png 4b-blown.png`.

- [ ] **Step 5: Read every screenshot in `e2e/shots/iphone/` and `e2e/shots/iphone-reduced/`**

Use the Read tool on each PNG. Expected per scene: 0 cream + "hey Muchkan" + Muchkan; 1 balloons + "look up" + eyes open looking up; 2 popped balloons + "it’s your day"; 3 pink + petals + "bloom" + no plumeria; 4 cake with flames + "make a wish"; 4b flames out; 5 night + stars + balloons + cream title + "Play again". Reduced: same words per scene, balloons static, no petals, no confetti. If any frame is wrong, fix the scene function, rerun `npm test`, re-read.

- [ ] **Step 6: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add playwright.config.ts e2e/story.spec.ts package.json package-lock.json
git commit -m "test: Playwright story verification at three viewports and reduced motion"
```

---

### Task 11: Guidelines review pass and production build

**Files:**
- Modify: whatever the review finds (expect small CSS/ARIA edits only)

**Interfaces:** none new.

**Quality rules satisfied:** this task is the explicit audit of every line in the spec's "Quality rules" section against the shipped code.

- [ ] **Step 1: Load the `web-interface-guidelines` skill** (Skill tool, `skill: "web-interface-guidelines"`) and walk its MUST/NEVER items against `src/`. Fix violations inline.

- [ ] **Step 2: Run this spec checklist with grep, each line must hold**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
grep -rn 'transition: all' src && echo FAIL-transition || echo ok-transition
grep -rnE "ease: *'(none|linear|power[0-9]\.inOut)'" src && echo FAIL-ease || echo ok-ease   # only sine.inOut pendulum allowed
grep -rn 'will-change' src --include='*.css' && echo FAIL-willchange || echo ok-willchange   # only set by Confetti at runtime
grep -rnE 'Inter|Roboto|Arial' src index.html && echo FAIL-fonts || echo ok-fonts
grep -rnE 'h-screen|100vh' src && echo FAIL-vh || echo ok-vh
grep -n 'user-scalable\|maximum-scale' index.html && echo FAIL-zoom || echo ok-zoom
grep -c 'overflow-x: clip' src/styles/global.css   # ≥ 1
grep -c 'safe-area-inset' src/App.module.css src/components/Cake.module.css   # ≥ 1 each
grep -n "it's\|\.\.\." src/App.tsx && echo FAIL-typography || echo ok-typography   # must use ’ and …
grep -rn 'translate="no"' src/App.tsx | wc -l   # 2 (hello + title)
grep -rn 'aria-hidden="true"' src/components | wc -l   # ≥ 6 (every decorative SVG/div)
grep -n '<title>Happy Birthday, Muskan</title>' index.html
grep -n 'text-wrap: balance' src/styles/global.css
LC_ALL=C grep -rn $'\xF0\x9F' src && echo FAIL-emoji || echo ok-emoji   # 4-byte UTF-8 lead byte = emoji
grep -rniE 'section 0[0-9]' src && echo FAIL-metalabel || echo ok-metalabel
```

- [ ] **Step 3: Taste checklist (read the iphone screenshots once more with these eyes)**

- Words sit on a single grid cell so no scene shifts layout when text changes.
- Only Fraunces for words, Outfit for the hint and the button; weights 500/600, tight tracking on display sizes.
- Backgrounds are flat cream → pink → night with grain, no gradients or drop shadows added.
- Every bounce uses `pop`, every settle uses `soft`; nothing linear except the pendulums.
- The cake and replay hit areas are ≥ 44px and the focus ring is visible on `Tab` (check with `npx playwright screenshot` after pressing Tab at the finale if unsure).
- Nothing reads as a template: no "SECTION 01", no emojis, no lorem, no placeholder copy.

- [ ] **Step 4: Full verification**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan && npm run build && npm test
```

Expected: build exit 0 with `dist/` containing `index.html`, `assets/*.js`, `assets/*.css`, `fonts/fraunces.woff2`, `fonts/outfit.woff2`; `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/nischalgupta/Documents/PROJECTS/personal/muchkan
git add -A src index.html
git commit -m "polish: guidelines review pass"
```

- [ ] **Step 6: Deploy note (do not run)**

Vercel auto-detects Vite: framework "Vite", build `npm run build`, output `dist`. No `vercel.json` needed. Deploy with `npx vercel --prod` from the project root when the user asks.

---

## Self-review notes

- **Spec coverage:** character rig (Task 2), every scene 0–5 (Tasks 6–9), all six word sets (Task 5 DOM, Tasks 6–9 reveals), Lenis + ticker sync (Task 6), pinned 100svh stage + master scrub timeline (Tasks 5–6), tokens/CSS Modules/fonts/preload/grain (Task 1), Confetti/Balloon/Cake/Petals/Stars components (Tasks 3–4), reduced motion (Task 9), theme-color (Task 6), replay (Task 6/9), touch targets and ARIA (Tasks 3, 5), Playwright at three widths + reduced motion (Task 10), deploy build (Task 11). "Pinned" is implemented with `position: sticky` (native, no pin-spacer) rather than ScrollTrigger `pin`; the ScrollTrigger only scrubs.
- **Type consistency:** `Q`, `T`, `themeColor`, `intro`, `buildTimeline`, `buildReducedTimeline`, `show`, `hide`, `HEAD` are defined once in Task 6 and used with the same names in Tasks 7–9; `ConfettiHandle.burst(x, y)` (Task 4) is called with viewport px in Task 8; `data-*` hooks match between Task 5 JSX and the scene selectors.
- **GSAP tween rule** (Global Constraints): each target's `fromTo` is its first tween — words via `show`, shards, petals, stars, letters, replay, balloon bodies' sway. Everything else on those targets is a `to`. The head wave in the finale deliberately uses `to` chains.
