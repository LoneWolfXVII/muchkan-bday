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

  const replay = () => {
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
          {BALLOONS.map((b) => (
            <Balloon key={b.color} color={b.color} style={{ left: b.left, top: b.top }} />
          ))}
          <div className={styles.her} data-her-wrap>
            <Muchkan />
            <Petals />
          </div>
          <Cake blown={blown} onBlow={blow} />

          <div className={styles.words}>
            <p data-word="hello" translate="no"><span data-hello-in>hey Muchkan</span></p>
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
