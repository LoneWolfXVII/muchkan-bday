import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { listenForBlow, micSupported } from './mic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Muchkan, { Plumeria } from './components/Muchkan'
import Balloon from './components/Balloon'
import Cake from './components/Cake'
import Confetti, { type ConfettiHandle } from './components/Confetti'
import Petals from './components/Petals'
import Stars from './components/Stars'
import {
  AUTO, T, applyFlower, blowCandles, buildReducedTimeline, buildTimeline, intro, laugh, popBalloon,
  resetInteractions, revealPopWord, themeColor, wave,
} from './scenes'
import styles from './App.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const PALETTE = ['#C9B3DB', '#F29B9B', '#F6C343', '#A98FC2', '#F7C6D6']

const POP_BALLOONS = [
  { color: '#C9B3DB', name: 'lilac', left: '4%', top: '24%' },
  { color: '#F6C343', name: 'yellow', left: '72%', top: '20%' },
  { color: '#F29B9B', name: 'pink', left: '62%', top: '52%' },
]

// one balloon per year to pop in the finale: two side columns and a top band, never behind her
const YEARS = 26
const FIELD = Array.from({ length: YEARS }, (_, i) => {
  const row = Math.floor(i / 2)
  const side = i < 20
  return {
    color: PALETTE[i % PALETTE.length],
    left: side ? `${(i % 2 ? 74 : 1) + ((row * 37) % 3) * 6}%` : `${4 + (i - 20) * 16}%`,
    top: side ? `${22 + row * 7.3}%` : `${3 + ((i - 20) % 2) * 7}%`,
    // bounded by height too: a body (1.2× its width) must fit in one 7.3%-tall row
    width: `min(${9 + (i % 3)}vw, ${5 + (i % 3) * 0.5}svh)`,
  }
})

const TITLE_WORDS = ['Happy', 'Birthday,', 'Muskan']

/** Per-balloon CSS sway timing (Balloon.module.css), so no two swing in step. */
const sway = (i: number) => ({ '--sway-dur': `${1.5 + (i % 5) * 0.25}s`, '--sway-delay': `${-i * 0.4}s` }) as CSSProperties

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const scroller = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const confetti = useRef<ConfettiHandle>(null)
  const pops = useRef(0)
  const blownRef = useRef(false)
  const [blown, setBlown] = useState(false)
  const wipe = useRef<HTMLDivElement>(null)
  const introTl = useRef<gsap.core.Timeline | null>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const replaying = useRef(false)
  const years = useRef(0)
  const stopMic = useRef<(() => void) | null>(null)
  const [mic, setMic] = useState<'idle' | 'listening' | 'off'>(() => (micSupported() ? 'idle' : 'off'))
  const counter = useRef<HTMLSpanElement>(null)

  // Lenis drives the scroll; ScrollTrigger listens to it through gsap.ticker.
  useEffect(() => {
    if (reduced()) return
    // syncTouch: finger scrolling is smoothed and inertial too (by default Lenis leaves touch native)
    const l = new Lenis({ wrapper: scroller.current!, content: track.current!, syncTouch: true })
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

  useEffect(() => () => stopMic.current?.(), [])

  const endMic = (next: 'idle' | 'off') => {
    stopMic.current?.()
    stopMic.current = null
    setMic(next)
  }

  const q = () => gsap.utils.selector(stage.current)

  const burstAt = (el: Element) => {
    if (reduced()) return
    const r = el.getBoundingClientRect()
    confetti.current?.burst(r.left + r.width / 2, r.top + r.height / 2)
  }

  /** `quiet`: popped for her after she scrolled past the scene; the word still shows, but she doesn't react */
  const pop = (balloon: HTMLButtonElement, quiet = false) => {
    if (!popBalloon(balloon, reduced())) return
    if (!reduced() && !quiet) laugh(q(), pops.current === 0 ? 'laugh' : undefined)
    revealPopWord(q(), pops.current++)
  }

  const giveFlower = () => applyFlower(q(), reduced())

  const popYear = (balloon: HTMLButtonElement) => {
    if (!popBalloon(balloon, reduced())) return
    const left = YEARS - ++years.current
    counter.current!.textContent = left ? `${left} left` : `all ${YEARS}. happy birthday!`
    if (!reduced()) laugh(q(), years.current === 1 ? 'laugh' : left ? undefined : 'laugh') // first and last always react
    if (left) return
    // the last one: confetti everywhere, then the story starts again on its own
    ;[0.2, 0.5, 0.8].forEach((fx, i) =>
      gsap.delayedCall(i * 0.25, () => !reduced() && confetti.current?.burst(innerWidth * fx, innerHeight * (0.3 + i * 0.1))),
    )
    gsap.delayedCall(2.2, () => replay(stage.current!.querySelector('[data-her]')!))
  }

  useGSAP(
    () => {
      const sel = gsap.utils.selector(stage.current)
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!
      const isReduced = reduced()
      const tl = isReduced ? buildReducedTimeline(sel) : buildTimeline(sel)
      const introAnim = intro(sel, isReduced)
      introTl.current = introAnim
      let waved = false
      trigger.current = ScrollTrigger.create({
        scroller: scroller.current,
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true, // Lenis already smooths wheel and touch; a second catch-up here would lag behind the finger
        animation: tl,
        onUpdate: (self) => {
          // Review Focus 1: a thumb that moves during the intro must not leave a half-faded "hey Muchkan"
          if (self.progress > 0.02 && introAnim.progress() < 1) introAnim.progress(1)
          const t = self.progress * T.end
          // scrolled past without tapping: finish it for her so nothing is skipped
          if (self.direction > 0) {
            // each threshold she scrolls past pops the next balloon she hasn't tapped
            const due = AUTO.pops.filter((at) => t > at).length
            const left = sel('[data-pop-balloon]').filter((b) => !(b as HTMLButtonElement).disabled)
            // flung past the scene: pop the rest quietly (no reaction off-screen)
            const quiet = t > T.flower - 0.2
            left.slice(0, Math.max(0, due - (3 - left.length))).forEach((b, i) =>
              gsap.delayedCall(i * 0.15, () => pop(b as HTMLButtonElement, quiet)),
            )
          }
          if (self.direction > 0 && t > AUTO.flower) applyFlower(sel, isReduced)
          if (!isReduced && !waved && t > AUTO.wave) {
            waved = true
            wave(sel)
          }
          if (t < T.finale) waved = false
          if (stopMic.current && (t < T.cake || t >= T.finale)) endMic('idle') // mic off as soon as she leaves the cake
          const c = themeColor(self.progress)
          if (meta.content !== c) {
            meta.content = c
            document.documentElement.style.background = c // iOS rubber-band overscroll shows the html background
          }
        },
      })
    },
    { scope: stage },
  )

  const blow = () => {
    if (blownRef.current) return false // Review Focus 3: no double burst
    const rises = stage.current!.querySelectorAll('[data-flame-rise]')
    if (Number(gsap.getProperty(rises[rises.length - 1], 'scale')) < 1) return false // candles not lit yet
    blownRef.current = true
    setBlown(true)
    endMic('off')
    blowCandles(q(), () => {
      burstAt(stage.current!.querySelector('[data-cake]')!)
      burstAt(stage.current!.querySelector('[data-age-in]')!)
    })
    return true
  }

  // blow on the phone: the flames lean with her breath, a real blow puts them out
  const startMic = async () => {
    if (mic !== 'idle') return
    setMic('listening')
    const flames = Array.from(stage.current!.querySelectorAll('[data-flame]'))
    const lean = flames.map((f) => gsap.quickTo(f, 'rotation', { duration: 0.12, ease: 'soft' }))
    try {
      stopMic.current = await listenForBlow({
        onLevel: (level) => lean.forEach((to, i) => to((i % 2 ? -1 : 1) * level * (22 + Math.random() * 14))),
        onBlow: blow,
      })
    } catch {
      endMic('off') // denied, no microphone, or unsupported: tapping the cake still works
    }
  }

  // "start over": a circle whooshes out of the button and covers the screen; behind it everything
  // resets and jumps to the top; then it whooshes away and she bounces in again like the first load.
  const replay = (origin: Element) => {
    if (replaying.current) return
    endMic(micSupported() ? 'idle' : 'off')
    replaying.current = true
    const w = wipe.current!
    const r = origin.getBoundingClientRect()
    const cover = Math.hypot(innerWidth, innerHeight) * 2.2 // diameter that covers the screen from any origin
    const restart = () => {
      resetInteractions(q())
      pops.current = 0
      years.current = 0
      counter.current!.textContent = `pop all ${YEARS} to start again`
      blownRef.current = false
      setBlown(false)
      if (lenis.current) lenis.current.scrollTo(0, { immediate: true, force: true })
      else scroller.current!.scrollTo({ top: 0 })
      ScrollTrigger.update()
      if (trigger.current?.getTween()) trigger.current.getTween().progress(1) // skip the scrub catch-up (none when scrub is `true`)
      introTl.current?.restart() // under cover, so the reveal shows her bouncing in
    }
    const done = () => {
      replaying.current = false
    }
    if (reduced()) {
      gsap.timeline({ onComplete: done })
        .set(w, { x: innerWidth / 2, y: innerHeight / 2, width: cover, height: cover, xPercent: -50, yPercent: -50, scale: 1, autoAlpha: 0 })
        .to(w, { autoAlpha: 1, duration: 0.25, ease: 'soft' })
        .call(restart)
        .to(w, { autoAlpha: 0, duration: 0.25, ease: 'soft' }, '+=0.1')
      return
    }
    gsap.timeline({ onComplete: done })
      .set(w, { x: r.left + r.width / 2, y: r.top + r.height / 2, width: cover, height: cover, xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 1 })
      .to(w, { scale: 1, duration: 0.65, ease: 'expo.in' }) // whoosh out
      .call(restart)
      .set(w, { x: innerWidth / 2, y: innerHeight * 0.1 }, '+=0.15') // recentre while fully covered
      .to(w, { scale: 0, duration: 0.7, ease: 'expo.out' }) // whoosh away, towards where "hey Muchkan" appears
      .set(w, { autoAlpha: 0 })
  }

  return (
    <>
      <div ref={scroller} className={styles.scroller} data-scroller>
        <main ref={track} className={styles.track}>
          <div ref={stage} className={styles.stage}>
            <div className={styles.bg} data-bg="pink" />
            <div className={styles.bg} data-bg="night" />
            <Stars />
            <div className={styles.field} data-field>
              {FIELD.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.fieldBalloon}
                  data-field-balloon
                  style={{ left: b.left, top: b.top, width: b.width, ...sway(i) }}
                  aria-label={`Pop balloon ${i + 1} of ${YEARS}`}
                  onClick={(e) => popYear(e.currentTarget)}
                >
                  <Balloon color={b.color} />
                </button>
              ))}
            </div>
            <Petals layer="back" />
            <div className={styles.her} data-her-wrap>
              <Muchkan />
              {/* inside her wrapper so it always sits just under her shirt, whatever the screen height */}
              <Cake blown={blown} onBlow={blow} />
            </div>
            <Petals layer="front" />
            {POP_BALLOONS.map((b, i) => (
              <button
                key={b.name}
                type="button"
                className={styles.popBalloon}
                data-pop-balloon
                style={{ left: b.left, top: b.top, ...sway(i + 7) }}
                aria-label={`Pop the ${b.name} balloon`}
                onClick={(e) => pop(e.currentTarget)}
              >
                <Balloon color={b.color} />
              </button>
            ))}
            <button type="button" className={styles.flower} data-flower aria-label="Wear the flower" onClick={giveFlower}>
              <span className={styles.flowerGlow} data-flower-glow />
              <span className={styles.flowerBob} data-flower-bob>
                <svg data-flower-fly viewBox="-24 -24 48 48" aria-hidden="true">
                  <Plumeria />
                </svg>
              </span>
            </button>

            <div className={styles.words}>
              <p data-word="hello" translate="no"><span data-hello-in>hey Muchkan</span></p>
              <p data-word="prompt">
                <span data-prompt-in>
                  pop the balloons<span className={styles.sub}>tap them</span>
                </span>
              </p>
              <p data-word="pops">
                <span data-pop>it’s</span> <span data-pop>your</span> <span data-pop>day</span>
              </p>
              <p data-word="flower" className={styles.swap}>
                <span data-flower-ask>
                  a flower for you<span className={styles.sub}>tap to wear it</span>
                </span>
                <span data-flower-done>there. perfect.</span>
              </p>
              <p data-word="bloom">bloom</p>
              <div data-word="wish" className={styles.swap}>
                <span data-wish-in>
                  make a wish
                  <span className={styles.micArea} aria-live="polite">
                    {mic === 'off' && <span className={styles.sub}>tap the cake</span>}
                    {mic === 'listening' && <span className={styles.sub}>listening… blow on your phone</span>}
                    {mic === 'idle' && (
                      <>
                        <span className={styles.sub}>blow on your phone</span>
                        <button
                          type="button"
                          className={styles.micButton}
                          onClick={startMic}
                          aria-label="Blow with the microphone"
                        >
                          use mic
                        </button>
                        <span className={`${styles.sub} ${styles.subQuiet}`}>or tap the cake</span>
                      </>
                    )}
                  </span>
                </span>
                <span data-age-in>
                  <span className={styles.age}>26</span>
                  <span className={styles.sub}>years young</span>
                </span>
              </div>
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
            <p className={styles.counter} data-counter aria-live="polite">
              <span ref={counter}>pop all {YEARS} to start again</span>
            </p>
            <button type="button" className={styles.replay} data-replay onClick={(e) => replay(e.currentTarget)}>
              or start over now
            </button>
          </div>
        </main>
      </div>
      <Confetti ref={confetti} />
      <div ref={wipe} className={styles.wipe} aria-hidden="true" />
    </>
  )
}
