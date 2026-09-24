import { Plumeria } from './Muchkan'
import styles from './Petals.module.css'

// deterministic scatter (same shower every visit): a tiny hash, not Math.random
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

type Kind = 'white' | 'pink' | 'flower'

const PETALS = Array.from({ length: 60 }, (_, i) => {
  const start = 0.05 + rnd(i + 100) * 0.45 // how far above the stage it starts, as a fraction of its height
  return {
    back: i % 3 === 0, // a third fall behind her: smaller, for depth
    kind: (i % 7 === 0 ? 'flower' : i % 3 === 1 ? 'pink' : 'white') as Kind,
    left: rnd(i) * 100,
    top: -start * 100,
    size: 0.7 + rnd(i + 200) * 0.8,
    delay: rnd(i + 300) * 0.3, // timeline seconds: they arrive in a random order, not in rows
    fall: 1.15 + start + rnd(i + 400) * 0.3, // viewport heights to fall: varied speeds, all clear the bottom
    drift: (rnd(i + 500) - 0.5) * 160,
    spin: (rnd(i + 600) - 0.5) * 900,
  }
})

/** The bloom shower: plumeria and bougainvillea petals plus a few whole flowers, in a back and a front layer. */
export default function Petals({ layer }: { layer: 'back' | 'front' }) {
  return (
    <div className={`${styles.petals} ${styles[layer]}`} aria-hidden="true" data-petals>
      {PETALS.filter((p) => p.back === (layer === 'back')).map((p, i) => (
        <i
          key={i}
          data-petal
          data-delay={p.delay}
          data-fall={p.fall}
          data-drift={p.drift}
          data-spin={p.spin}
          className={styles[p.kind]}
          style={{ left: `${p.left}%`, top: `${p.top}%`, ['--s' as string]: p.size * (p.back ? 0.65 : 1) }}
        >
          {p.kind === 'flower' && (
            <svg viewBox="-24 -24 48 48">
              <Plumeria />
            </svg>
          )}
        </i>
      ))}
    </div>
  )
}
