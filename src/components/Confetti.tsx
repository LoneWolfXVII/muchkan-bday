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
