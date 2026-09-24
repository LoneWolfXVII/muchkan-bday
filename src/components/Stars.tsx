import styles from './Stars.module.css'

const GLOW = 4 // px of soft glow around each dot (matches the old 6px-blur, 1px-spread box-shadow)

const STARS = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 70}%`,
  size: 2 + (i % 3),
}))

export default function Stars() {
  return (
    <div className={styles.stars} aria-hidden="true" data-stars>
      {STARS.map((s, i) => {
        const r = s.size / 2
        const box = s.size + GLOW * 2
        return (
          <i
            key={i}
            data-star
            style={{
              left: s.left,
              top: s.top,
              width: box,
              height: box,
              margin: -GLOW,
              // dot, then the glow fading out: drawn as a gradient, cheap to paint, same look as the old shadow
              background: `radial-gradient(circle closest-side, #FFF9F0 ${(r / (box / 2)) * 100}%, rgb(255 249 240 / 0.45) ${((r + 1) / (box / 2)) * 100}%, transparent 100%)`,
            }}
          />
        )
      })}
    </div>
  )
}
