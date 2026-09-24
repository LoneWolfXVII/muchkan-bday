import { useEffect, useRef, useState } from 'react'
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

// one balloon per year; deterministic scatter across the night sky
const FIELD = Array.from({ length: 26 }, (_, i) => ({
  color: PALETTE[i % PALETTE.length],
  left: `${(i * 37 + 3) % 94}%`,
  top: `${4 + ((i * 53) % 78)}%`,
  width: `${8 + (i % 3) * 2.5}vw`,
}))

const TITLE_WORDS = ['Happy', 'Birthday,', 'Muskan']

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const confetti = useRef<ConfettiHandle>(null)
  const pops = useRef(0)
  const blownRef = useRef(false)
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

  const q = () => gsap.utils.selector(stage.current)

  const burstAt = (el: Element) => {
    if (reduced()) return
    const r = el.getBoundingClientRect()
    confetti.current?.burst(r.left + r.width / 2, r.top + r.height / 2)
  }

  const pop = (balloon: HTMLButtonElement) => {
    if (!popBalloon(balloon, reduced())) return
    revealPopWord(q(), pops.current++)
    if (!reduced()) laugh(q())
  }

  const giveFlower = () => applyFlower(q(), reduced())

  useGSAP(
    () => {
      const sel = gsap.utils.selector(stage.current)
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!
      const isReduced = reduced()
      const tl = isReduced ? buildReducedTimeline(sel) : buildTimeline(sel)
      const introTl = intro(sel, isReduced)
      let waved = false
      ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isReduced ? true : 0.6, // a short catch-up smooths touch scrolling, which Lenis leaves native
        animation: tl,
        onUpdate: (self) => {
          // Review Focus 1: a thumb that moves during the intro must not leave a half-faded "hey Muchkan"
          if (self.progress > 0.02 && introTl.progress() < 1) introTl.progress(1)
          const t = self.progress * T.end
          // scrolled past without tapping: finish it for her so nothing is skipped
          if (self.direction > 0 && t > AUTO.pop) {
            sel('[data-pop-balloon]')
              .filter((b) => !(b as HTMLButtonElement).disabled)
              .forEach((b, i) => gsap.delayedCall(i * 0.15, () => pop(b as HTMLButtonElement)))
          }
          if (self.direction > 0 && t > AUTO.flower) applyFlower(sel, isReduced)
          if (!isReduced && !waved && t > AUTO.wave) {
            waved = true
            wave(sel)
          }
          if (t < T.finale) waved = false
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
    if (blownRef.current) return // Review Focus 3: no double burst
    const rises = stage.current!.querySelectorAll('[data-flame-rise]')
    if (Number(gsap.getProperty(rises[rises.length - 1], 'scale')) < 1) return // candles not lit yet
    blownRef.current = true
    setBlown(true)
    blowCandles(q(), () => {
      burstAt(stage.current!.querySelector('[data-cake]')!)
      burstAt(stage.current!.querySelector('[data-age-in]')!)
    })
  }

  const replay = () => {
    resetInteractions(q())
    pops.current = 0
    blownRef.current = false
    setBlown(false)
    if (lenis.current) lenis.current.scrollTo(0, { duration: 1.6 })
    else window.scrollTo({ top: 0 })
  }

  return (
    <>
      <main ref={track} className={styles.track}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.bg} data-bg="pink" />
          <div className={styles.bg} data-bg="night" />
          <Stars />
          <div className={styles.field} data-field aria-hidden="true">
            {FIELD.map((b, i) => (
              <span key={i} className={styles.fieldBalloon} data-field-balloon style={{ left: b.left, top: b.top, width: b.width }}>
                <Balloon color={b.color} />
              </span>
            ))}
          </div>
          <div className={styles.her} data-her-wrap>
            <Muchkan />
            {/* inside her wrapper so it always sits just under her shirt, whatever the screen height */}
            <Cake blown={blown} onBlow={blow} />
          </div>
          <Petals />
          {POP_BALLOONS.map((b) => (
            <button
              key={b.name}
              type="button"
              className={styles.popBalloon}
              data-pop-balloon
              style={{ left: b.left, top: b.top }}
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
                make a wish<span className={styles.sub}>tap the cake</span>
              </span>
              <span data-age-in>
                <span className={styles.age}>26</span>
                <span className={styles.sub}>years of you</span>
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
          <button type="button" className={styles.replay} data-replay onClick={replay}>
            Play again
          </button>
        </div>
      </main>
      <Confetti ref={confetti} />
    </>
  )
}
