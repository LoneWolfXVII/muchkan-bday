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
    // the intro animates an inner span; the scrub owns the outer <p>, so the two never record each other's values
    .from(q('[data-hello-in]'), { y: 24, autoAlpha: 0, duration: 0.6, ease: 'soft' }, '-=0.4')
    .to(q('[data-part="head"]'), { rotation: -7, ...HEAD, duration: 0.5, ease: 'soft' }, '-=0.2')
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.7, ease: 'pop' })

  // idle blink: squeezes the closed-eye arcs (scaleY). No scene touches scaleY on this group, so nothing fights.
  gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.6 }).to(q('[data-part="eyesClosed"]'), {
    scaleY: 0.25, transformOrigin: '50% 50%', duration: 0.09, yoyo: true, repeat: 1, ease: 'soft',
  })
  return tl
}

// GSAP folds the CSS `translate` property into its own transform but drops a percentage y,
// so the character is centred only here (no CSS translate). useGSAP runs before first paint.
function centre(q: Q) {
  gsap.set(q('[data-her-wrap]'), { xPercent: -50, yPercent: -42 })
}

/** Initial states not covered by a scene's first fromTo. */
function setup(q: Q) {
  centre(q)
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

function scenePetals(q: Q) {
  const tl = gsap.timeline()
  const plumeria = q('[data-part="plumeria"]')
  tl.to(q('[data-bg="pink"]'), { autoAlpha: 1, duration: 0.5 }, 0)
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.3 }, 0)
    .to(q('[data-part="eyesOpen"]'), { autoAlpha: 0, duration: 0.1 }, 0)
    .to(q('[data-part="eyesClosed"]'), { autoAlpha: 1, duration: 0.1 }, 0)
    .to(plumeria, { scale: 1.6, rotation: 40, duration: 0.08, ease: 'pop', transformOrigin: '50% 50%' }, 0.05)
    .to(plumeria, { scale: 0, duration: 0.05, ease: 'power4.in' }, 0.13)
    // petals start hidden (fromTo renders its from-state immediately and on reverse), pop in, fly, then fade
    .fromTo(q('[data-petal]'), { autoAlpha: 0, x: 0, y: 0, rotation: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.13)
    .to(
      q('[data-petal]'),
      {
        x: (i: number) => (i % 2 ? 1 : -1) * (30 + i * 14),
        y: (i: number) => window.innerHeight * (0.55 + (i % 4) * 0.1),
        rotation: (i: number) => (i % 2 ? 1 : -1) * (180 + i * 40),
        duration: 0.8, ease: 'soft', stagger: 0.015,
      },
      0.13,
    )
    .to(q('[data-petal]'), { autoAlpha: 0, duration: 0.3, stagger: 0.015 }, 0.6)
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

function sceneFinale(q: Q) {
  const tl = gsap.timeline()
  tl.to(q('[data-bg="night"]'), { autoAlpha: 1, duration: 0.4 }, 0)
  hide(tl, q('[data-word="wish"]'), 0)
  tl.to(q('[data-cake]'), { y: () => window.innerHeight * 0.6, autoAlpha: 0, duration: 0.3 }, 0)
    .to(q('[data-her-wrap]'), { y: 0, scale: 1, duration: 0.4 }, 0)
    // stars
    .fromTo(q('[data-stars]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.1)
    .fromTo(q('[data-star]'), { y: 30 }, { y: -40, duration: 0.5, ease: 'soft', stagger: { each: 0.01, from: 'random' } }, 0.1)
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
    .to(q('[data-her]'), { y: -14, duration: 0.12, repeat: 3, yoyo: true, ease: 'pop' }, 0.3)
    .to(q('[data-part="head"]'), { rotation: 0, ...HEAD, duration: 0.05 }, 0.85)
    // the plumeria that burst into petals grows back
    .to(q('[data-part="plumeria"]'), { scale: 1, rotation: 0, duration: 0.2, ease: 'pop' }, 0.4)
    .fromTo(q('[data-replay]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.7)
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
    .add(scenePops(q), T.pops)
    .add(scenePetals(q), T.petals)
    .add(sceneCake(q), T.cake)
    .add(sceneFinale(q), T.finale)
  return pinLength(tl)
}

/** prefers-reduced-motion: crossfades only. No parallax, pops, petals, confetti or drifting. */
export function buildReducedTimeline(q: Q) {
  centre(q)
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
  return pinLength(tl)
}
