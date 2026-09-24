import styles from './Petals.module.css'

const COUNT = 14

export default function Petals() {
  return (
    <div className={styles.petals} aria-hidden="true" data-petals>
      {Array.from({ length: COUNT }, (_, i) => (
        <i key={i} data-petal />
      ))}
    </div>
  )
}
