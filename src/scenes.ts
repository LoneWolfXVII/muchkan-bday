import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
CustomEase.create('soft', '0.22,1,0.36,1') // --ease-out
CustomEase.create('pop', '0.34,1.56,0.64,1') // --ease-bounce

export type Q = ReturnType<typeof gsap.utils.selector>

/**
 * Scene start times in timeline seconds; 600svh of scroll is scrubbed over T.end.
 * Everything finishes by 6; the last 0.2s is a hold, because an iOS toolbar collapse after
 * ScrollTrigger measured shortens the real max scroll by a few percent.
 */
export const T = { hello: 0, balloons: 0.6, flower: 2.1, petals: 3.1, cake: 4.1, finale: 5.1, end: 6.2 } as const

/** Scroll past these (timeline seconds) and whatever she didn't tap happens on its own, so nothing is skipped. */
export const AUTO = {
  // scrolling through the balloon scene without tapping pops them one by one, while they (and their words) are on screen
  // (balloons settle at +0.7 and start leaving at +1.2, so the three pops sit in between)
  pops: [T.balloons + 0.75, T.balloons + 0.92, T.balloons + 1.09],
  flower: T.petals - 0.1,
  wave: T.finale + 0.35,
} as const

const CREAM = '#FBF3E8'
const PINK = '#F7C6D6'
const NIGHT = '#33254F'

export function themeColor(progress: number) {
  if (progress >= T.finale / T.end) return NIGHT
  if (progress >= T.petals / T.end) return PINK
  return CREAM
}

/*
 * Ownership, so scroll and taps never record each other's values:
 * - the scrubbed timeline owns scene presence: outer wrappers ([data-pop-balloon], [data-flower],
 *   [data-word=…], [data-cake], [data-field-balloon], backgrounds)
 * - taps own inner state: [data-body]/[data-shard]/[data-string], [data-pop], [data-prompt-in],
 *   [data-flower-fly], [data-flower-ask]/[data-flower-done], the head's plumeria, [data-flame],
 *   [data-wish-in]/[data-age-in]
 * - time-based loops own idle motion: [data-sway], [data-flower-bob], blink, laugh and wave
 * Nothing that oscillates is tied to scroll: a scrubbed wobble flickers with every scroll step.
 */

const HEAD = { svgOrigin: '100 175' } // neck pivot in viewBox units
const KNOT = { svgOrigin: '30 74' } // balloon body pivot (the knot), in the balloon's viewBox
const STRING_END = { svgOrigin: '30 128' } // balloons sway from the bottom of the string

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

/** Time-based: the opening bounce, plus the idle loops (blink, balloon sway, flower bob). */
export function intro(q: Q, reduced: boolean) {
  const tl = gsap.timeline()
  if (reduced) return tl
  tl.from(q('[data-her]'), {
    y: 80, scaleX: 1.25, scaleY: 0.7, autoAlpha: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'pop',
  })
    // the intro animates an inner span; the scrub owns the outer <p>, so the two never record each other's values
    .from(q('[data-hello-in]'), { y: 24, autoAlpha: 0, duration: 0.6, ease: 'soft' }, '-=0.4')
    .to(q('[data-part="head"]'), { rotation: -7, ...HEAD, duration: 0.5, ease: 'soft' }, '-=0.2')
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.7, ease: 'pop' })

  // idle blink: squeezes the closed-eye arcs about their centre
  gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.6 }).to(q('[data-part="eyesClosed"]'), {
    scaleY: 0.25, transformOrigin: '50% 50%', duration: 0.09, yoyo: true, repeat: 1, ease: 'soft',
  })
  // pendulum sway (sine is the physics exception to the no-ease-in-out rule)
  q('[data-sway]').forEach((sway, i) => {
    gsap.fromTo(
      sway,
      { rotation: -4, ...STRING_END },
      { rotation: 4, ...STRING_END, duration: 1.5 + (i % 5) * 0.25, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -i * 0.4 },
    )
  })
  gsap.to(q('[data-flower-bob]'), { y: -10, rotation: 8, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  gsap.to(q('[data-flower-glow]'), { scale: 1.25, opacity: 0.35, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  return tl
}

// GSAP folds the CSS `translate` property into its own transform but drops a percentage y,
// so the character is centred only here (no CSS translate). useGSAP runs before first paint.
function centre(q: Q) {
  gsap.set(q('[data-her-wrap]'), { xPercent: -50, yPercent: -42 })
}

/** Tap-owned state back to the start: balloons whole, no flower in her hair, candles lit, words unrevealed. */
export function resetInteractions(q: Q) {
  gsap.killTweensOf(q('[data-body], [data-shard], [data-string], [data-pop], [data-prompt-in], [data-flower-fly], [data-flower-ask], [data-flower-done], [data-part="plumeria"], [data-part="blush"], [data-flame], [data-wish-in], [data-age-in]'))
  gsap.set(q('[data-body]'), { scale: 1, autoAlpha: 1, ...KNOT })
  gsap.set(q('[data-string]'), { autoAlpha: 1 })
  gsap.set(q('[data-shard]'), { x: 0, y: 0, autoAlpha: 1 })
  gsap.set(q('[data-pop], [data-flower-done], [data-age-in]'), { autoAlpha: 0 })
  gsap.set(q('[data-prompt-in], [data-flower-ask], [data-wish-in]'), { autoAlpha: 1, y: 0, scale: 1 })
  gsap.set(q('[data-flower-fly]'), { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1 })
  gsap.set(q('[data-flower-glow]'), { clearProps: 'visibility' }) // inherit: an explicit 'visible' would show through the hidden button
  gsap.set(q('[data-part="plumeria"]'), { scale: 0, rotation: 0, transformOrigin: '50% 50%' })
  gsap.set(q('[data-part="blush"]'), { opacity: 0.6 })
  restFace(q)
  gsap.set(q('[data-flame]'), { scale: 1, rotation: 0, transformOrigin: '50% 100%' })
  q('[data-pop-balloon], [data-field-balloon], [data-flower]').forEach((b) => ((b as HTMLButtonElement).disabled = false))
}

/** Initial states not covered by a scene's first fromTo. */
function setup(q: Q) {
  centre(q)
  resetInteractions(q)
  gsap.set(q('[data-pop-balloon]'), { y: () => window.innerHeight * 0.9, autoAlpha: 0 })
  gsap.set(q('[data-flower]'), { x: 60, y: -40, autoAlpha: 0 })
  gsap.set(q('[data-field]'), { autoAlpha: 0 }) // hidden until the finale, so its buttons aren't tab stops
  gsap.set(q('[data-field-balloon]'), { y: () => window.innerHeight * 1.1 })
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

function sceneBalloons(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-pop-balloon]'), { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: 'soft' }, 0)
  show(tl, q('[data-word="prompt"]'), 0.2)
  show(tl, q('[data-word="pops"]'), 0.2)
  tl.to(q('[data-pop-balloon]'), { y: () => -window.innerHeight * 0.6, autoAlpha: 0, duration: 0.3, stagger: 0.05 }, 1.2)
  hide(tl, q('[data-word="prompt"], [data-word="pops"]'), 1.25)
  return tl
}

function sceneFlower(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-flower]'), { x: 0, y: 0, autoAlpha: 1, duration: 0.35, ease: 'soft' }, 0)
  show(tl, q('[data-word="flower"]'), 0.15)
  tl.to(q('[data-flower]'), { autoAlpha: 0, duration: 0.15 }, 0.85)
  hide(tl, q('[data-word="flower"]'), 0.8)
  return tl
}

const petalDelay = (_: number, el: Element) => Number((el as HTMLElement).dataset.delay)

function scenePetals(q: Q) {
  const tl = gsap.timeline()
  const petals = q('[data-petal]')
  tl.to(q('[data-bg="pink"]'), { autoAlpha: 1, duration: 0.4 }, 0)
    // petals start hidden (fromTo renders its from-state immediately and on reverse), appear, fall, fade.
    // Each petal carries its own delay / fall / drift / spin (components/Petals), so the three tweens agree.
    .fromTo(petals, { autoAlpha: 0, x: 0, y: 0, rotation: 0 }, { autoAlpha: 1, duration: 0.05, stagger: petalDelay }, 0.05)
    .to(
      petals,
      {
        y: (_: number, el: HTMLElement) => window.innerHeight * Number(el.dataset.fall),
        x: (_: number, el: HTMLElement) => Number(el.dataset.drift),
        rotation: (_: number, el: HTMLElement) => Number(el.dataset.spin),
        duration: 0.6, ease: 'none', stagger: petalDelay,
      },
      0.05,
    )
    .to(petals, { autoAlpha: 0, duration: 0.1, stagger: petalDelay }, 0.6)
  show(tl, q('[data-word="bloom"]'), 0.15)
  hide(tl, q('[data-word="bloom"]'), 0.9)
  return tl
}

function sceneCake(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-cake]'), { y: 0, autoAlpha: 1, duration: 0.4, ease: 'pop' }, 0)
    // shrink from her feet so her head drops and leaves room for the big 26 above it
    .to(q('[data-her-wrap]'), { scale: 0.8, duration: 0.4, transformOrigin: '50% 100%' }, 0)
    .to(q('[data-flame-rise]'), { scale: 1, duration: 0.12, stagger: 0.1, ease: 'pop', transformOrigin: '50% 100%' }, 0.35)
  show(tl, q('[data-word="wish"]'), 0.45)
  return tl
}

function sceneFinale(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-bg="night"]'), { autoAlpha: 1, duration: 0.4 }, 0)
  hide(tl, q('[data-word="wish"]'), 0)
  tl.to(q('[data-cake]'), { y: () => window.innerHeight * 0.6, autoAlpha: 0, duration: 0.3 }, 0)
    .to(q('[data-her-wrap]'), { y: 0, scale: 1, duration: 0.4 }, 0)
    .fromTo(q('[data-stars]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.1)
    .fromTo(q('[data-star]'), { y: 30 }, { y: -40, duration: 0.5, ease: 'soft', stagger: { each: 0.01, from: 'random' } }, 0.1)
    // 26 balloons, one per year, float up into the sky for her to pop
    .to(q('[data-field]'), { autoAlpha: 1, duration: 0.05 }, 0.05)
    .to(q('[data-field-balloon]'), { y: 0, duration: 0.55, ease: 'soft', stagger: { each: 0.012, from: 'random' } }, 0.05)
    .to(q('[data-word="title"]'), { autoAlpha: 1, duration: 0.01 }, 0.25)
    .fromTo(
      q('[data-letter]'),
      { autoAlpha: 0, y: 40, scale: 0.6 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, stagger: 0.015, ease: 'pop' },
      0.25,
    )
    .fromTo(q('[data-replay], [data-counter]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.7)
  return tl
}

// ScrollTrigger maps the whole scroll onto the timeline's duration, so it must be exactly T.end
// or every scene drifts earlier. A trailing no-op pins the end; overrunning is a bug.
function pinLength(tl: gsap.core.Timeline) {
  tl.to({}, { duration: 0 }, T.end)
  if (tl.duration() > T.end + 1e-6) console.error(`timeline overruns T.end: ${tl.duration()}s`)
  return tl
}

export function buildTimeline(q: Q) {
  setup(q)
  const tl = gsap.timeline({ defaults: { ease: 'soft' } })
  tl.add(sceneHello(q), T.hello)
    .add(sceneBalloons(q), T.balloons)
    .add(sceneFlower(q), T.flower)
    .add(scenePetals(q), T.petals)
    .add(sceneCake(q), T.cake)
    .add(sceneFinale(q), T.finale)
  return pinLength(tl)
}

/** prefers-reduced-motion: crossfades only. No parallax, flights, petals, confetti or drifting. */
export function buildReducedTimeline(q: Q) {
  centre(q)
  resetInteractions(q)
  gsap.set(q('[data-pop-balloon], [data-flower], [data-cake], [data-field]'), { autoAlpha: 0 })
  gsap.set(q('[data-flame-rise]'), { scale: 0, transformOrigin: '50% 100%' })
  gsap.set(q('[data-word="prompt"], [data-word="pops"], [data-word="flower"], [data-word="bloom"], [data-word="wish"], [data-word="title"], [data-replay], [data-counter]'), { autoAlpha: 0 })

  const tl = gsap.timeline({ defaults: { ease: 'soft', duration: 0.3 } })
  const fade = (sel: string, at: number, on = true) => tl.to(q(sel), { autoAlpha: on ? 1 : 0 }, at)

  fade('[data-hint]', 0, false)
  fade('[data-word="hello"]', 0.3, false)

  fade('[data-pop-balloon], [data-word="prompt"], [data-word="pops"]', T.balloons)
  fade('[data-pop-balloon], [data-word="prompt"], [data-word="pops"]', T.flower - 0.3, false)

  fade('[data-flower], [data-word="flower"]', T.flower)
  fade('[data-flower], [data-word="flower"]', T.petals - 0.3, false)

  fade('[data-bg="pink"]', T.petals)
  fade('[data-word="bloom"]', T.petals + 0.2)
  fade('[data-word="bloom"]', T.cake - 0.3, false)

  fade('[data-cake]', T.cake)
  tl.to(q('[data-flame-rise]'), { scale: 1, stagger: 0.08, transformOrigin: '50% 100%' }, T.cake + 0.1) // lit before the cake can be tapped
  fade('[data-word="wish"]', T.cake + 0.2)
  fade('[data-word="wish"], [data-cake]', T.finale - 0.1, false)

  fade('[data-bg="night"]', T.finale)
  fade('[data-stars], [data-field]', T.finale + 0.2)
  fade('[data-word="title"]', T.finale + 0.3)
  fade('[data-replay], [data-counter]', T.finale + 0.6)
  return pinLength(tl)
}

// ---- tap reactions (time-based) ----

/** Pop one balloon; returns false if it was already popped. */
export function popBalloon(balloon: HTMLButtonElement, reduced: boolean) {
  if (balloon.disabled) return false
  balloon.disabled = true // popped balloons stop being buttons (and tab stops)
  const body = balloon.querySelector('[data-body]')!
  const string = balloon.querySelector('[data-string]')!
  if (reduced) {
    gsap.to([body, string, ...balloon.querySelectorAll('[data-shard]')], { autoAlpha: 0, duration: 0.3 })
    return true
  }
  gsap.timeline()
    .to(body, { scale: 1.25, ...KNOT, duration: 0.08, ease: 'soft' })
    .to(body, { scale: 0, ...KNOT, duration: 0.06, ease: 'power4.in' })
    .to(string, { autoAlpha: 0, duration: 0.1 }, '<')
    .to(
      balloon.querySelectorAll('[data-shard]'),
      {
        x: (k: number) => Math.cos((k * Math.PI) / 4) * 40,
        y: (k: number) => Math.sin((k * Math.PI) / 4) * 40 + 20,
        autoAlpha: 0, duration: 0.5, ease: 'soft',
      },
      '<',
    )
  return true
}

/** Reveal the n-th pop word; the first pop also retires the "pop the balloons" prompt. */
export function revealPopWord(q: Q, n: number) {
  if (n === 0) gsap.to(q('[data-prompt-in]'), { autoAlpha: 0, y: -20, duration: 0.25, ease: 'soft' })
  gsap.fromTo(q('[data-pop]')[n], { autoAlpha: 0, y: 24, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'pop', delay: 0.1 })
}

const FACE = '[data-part="mouth"], [data-part="mouthLaugh"], [data-part="mouthWow"], [data-part="eyesClosed"], [data-part="eyesOpen"], [data-part="brows"]'
let face: gsap.core.Timeline | null = null

/** Her resting face: closed happy eyes, soft smile, brows down. */
function restFace(q: Q) {
  face?.kill()
  gsap.set(q('[data-part="mouthLaugh"], [data-part="mouthWow"], [data-part="eyesOpen"]'), { autoAlpha: 0, scale: 1 })
  gsap.set(q('[data-part="mouth"], [data-part="eyesClosed"]'), { autoAlpha: 1 })
  gsap.set(q('[data-part="brows"]'), { y: 0 })
}

/**
 * She reacts to a pop. Every pop gets a hop; the face changes only now and then:
 * pops that land while a reaction is showing join it, otherwise about a third of pops
 * pick a laugh or a wide-eyed "wow" at random. `force` guarantees one (first/last pop).
 */
export function laugh(q: Q, force?: 'laugh' | 'wow') {
  gsap.fromTo(q('[data-her]'), { y: 0 }, { y: -14, duration: 0.14, yoyo: true, repeat: 1, ease: 'soft' })
  if (!force && (face?.isActive() || Math.random() > 0.35)) return
  react(q, force ? force === 'wow' : Math.random() < 0.5)
}

function react(q: Q, wow: boolean) {
  restFace(q)
  const mouth = q(wow ? '[data-part="mouthWow"]' : '[data-part="mouthLaugh"]')
  face = gsap.timeline()
    .set(q('[data-part="mouth"]'), { autoAlpha: 0 })
    .fromTo(mouth, { autoAlpha: 1, scale: 0.4 }, { scale: 1, transformOrigin: '50% 0%', duration: 0.25, ease: 'pop' }, 0)
    .to(q('[data-part="brows"]'), { y: wow ? -6 : -3, duration: 0.2, ease: 'pop' }, 0)
  if (wow) {
    face
      .set(q('[data-part="eyesClosed"]'), { autoAlpha: 0 }, 0)
      .fromTo(q('[data-part="eyesOpen"]'), { autoAlpha: 1, scale: 0.5 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.25, ease: 'pop' }, 0)
  }
  face
    .to(q('[data-part="brows"]'), { y: 0, duration: 0.3, ease: 'soft' }, 1.3)
    .set(q(FACE), { autoAlpha: 0 }, 1.4)
    .set(q('[data-part="mouth"], [data-part="eyesClosed"], [data-part="brows"]'), { autoAlpha: 1 }, 1.4)
  gsap.fromTo(q('[data-part="blush"]'), { opacity: 1 }, { opacity: 0.6, duration: 0.8, ease: 'soft' })
}

/** The flower flies from the gift button into her hair. Returns false if already applied. */
export function applyFlower(q: Q, reduced: boolean) {
  const button = q('[data-flower]')[0] as HTMLButtonElement
  if (button.disabled) return false
  button.disabled = true
  const fly = q('[data-flower-fly]')[0]
  const plumeria: Element = q('[data-part="plumeria"]')[0]
  const done = () => {
    gsap.set(fly, { autoAlpha: 0 })
    gsap.set(q('[data-flower-glow]'), { visibility: 'hidden' }) // its opacity belongs to the idle pulse
    gsap.fromTo(plumeria, { scale: reduced ? 1 : 0.5 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.5, ease: 'pop' })
    gsap.to(q('[data-flower-ask]'), { autoAlpha: 0, y: -16, duration: 0.25, ease: 'soft' })
    gsap.fromTo(q('[data-flower-done]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'pop', delay: 0.1 })
    gsap.to(q('[data-part="blush"]'), { opacity: 1, duration: 0.4, ease: 'soft' })
  }
  if (reduced) {
    done()
    return true
  }
  // the plumeria is scaled to 0, so its rect is a point at its centre: that is where the flower lands
  const from = fly.getBoundingClientRect()
  const to = plumeria.getBoundingClientRect()
  const her = q('[data-her]')[0].getBoundingClientRect()
  const landed = (her.width * 46) / 140 / from.width // plumeria is ~46 units across in a 140-unit-wide viewBox
  gsap.to(fly, {
    x: to.left - (from.left + from.width / 2),
    y: to.top - (from.top + from.height / 2),
    scale: landed,
    rotation: -15,
    duration: 0.7,
    ease: 'soft',
    onComplete: done,
  })
  return true
}

/** Candles out, then the big 26. */
export function blowCandles(q: Q, onOut: () => void) {
  gsap.to(q('[data-flame]'), {
    scale: 0,
    transformOrigin: '50% 100%',
    duration: 0.35,
    stagger: 0.08,
    ease: 'power2.in',
    onComplete: () => {
      gsap.to(q('[data-wish-in]'), { autoAlpha: 0, y: -16, duration: 0.25, ease: 'soft' })
      gsap.fromTo(q('[data-age-in]'), { autoAlpha: 0, y: 40, scale: 0.6 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'pop' })
      onOut()
    },
  })
}

/** Finale: she waves (head wiggle and hops), time-based so it never flickers with the scroll. */
export function wave(q: Q) {
  gsap.timeline()
    .to(q('[data-part="head"]'), { rotation: -8, ...HEAD, duration: 0.15, ease: 'soft' })
    .to(q('[data-part="head"]'), { rotation: 8, ...HEAD, duration: 0.3, repeat: 3, yoyo: true, ease: 'sine.inOut' })
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.3, ease: 'pop' })
  gsap.fromTo(q('[data-her]'), { y: 0 }, { y: -16, duration: 0.3, repeat: 3, yoyo: true, ease: 'soft' })
}
