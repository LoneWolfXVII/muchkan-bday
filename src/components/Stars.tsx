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
