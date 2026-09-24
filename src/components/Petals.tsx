import styles from './Petals.module.css'

const COUNT = 16

/** Plumeria petals that drift down across the whole stage in the bloom scene. */
export default function Petals() {
  return (
    <div className={styles.petals} aria-hidden="true" data-petals>
      {Array.from({ length: COUNT }, (_, i) => (
        <i key={i} data-petal style={{ left: `${(i * 37 + 5) % 96}%` }} />
      ))}
    </div>
  )
}
