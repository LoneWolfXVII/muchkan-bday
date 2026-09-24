import styles from './Cake.module.css'

const CANDLE_X = [22, 40, 58, 76, 94]

type Props = { blown: boolean; onBlow: () => void }

export default function Cake({ blown, onBlow }: Props) {
  return (
    <button
      type="button"
      className={styles.cake}
      data-cake
      onClick={onBlow}
      aria-label={blown ? 'Candles out. Wish made' : 'Blow out the candles'}
    >
      <svg viewBox="0 0 116 120" aria-hidden="true">
        <rect x="8" y="80" width="100" height="34" rx="8" fill="#C9B3DB" />
        <rect x="18" y="58" width="80" height="26" rx="6" fill="#F7C6D6" />
        <path d="M18 62 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 v-6 H18 z" fill="#FFF9F0" />
        <rect x="8" y="78" width="100" height="6" rx="3" fill="#FFF9F0" />
        {CANDLE_X.map((x) => (
          <g key={x}>
            <rect x={x - 3} y="36" width="6" height="24" rx="2" fill="#FFF9F0" stroke="#E35FB0" strokeWidth="1.5" />
            <g data-flame-rise>
              <g data-flame>
                <ellipse cx={x} cy="28" rx="4.5" ry="8" fill="#F6C343" />
                <ellipse cx={x} cy="30" rx="2" ry="4" fill="#FFF3B0" />
              </g>
            </g>
          </g>
        ))}
      </svg>
    </button>
  )
}
