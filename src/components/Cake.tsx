import styles from './Cake.module.css'

// number candles "2" and "6": x is the digit's centre on the top tier
const CANDLES = [
  { digit: '2', x: 44 },
  { digit: '6', x: 72 },
]

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
        <rect x="8" y="80" width="100" height="34" rx="8" fill="#F29B9B" />
        <rect x="18" y="58" width="80" height="26" rx="6" fill="#F7C6D6" />
        <path d="M18 62 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 v-6 H18 z" fill="#FFF9F0" />
        <rect x="8" y="78" width="100" height="6" rx="3" fill="#FFF9F0" />
        {CANDLES.map(({ digit, x }) => (
          <g key={digit}>
            <path d={`M${x} 31 V25`} stroke="#3A2620" strokeWidth="1.4" strokeLinecap="round" />
            <text
              x={x}
              y="59"
              textAnchor="middle"
              fontFamily="'Fraunces Variable', Georgia, serif"
              fontWeight="800"
              fontSize="36"
              fill="#E35FB0"
              stroke="#FFF9F0"
              strokeWidth="2.5"
              paintOrder="stroke"
            >
              {digit}
            </text>
            <g data-flame-rise>
              <g data-flame>
                <ellipse cx={x} cy="17" rx="4.5" ry="8" fill="#F6C343" />
                <ellipse cx={x} cy="19" rx="2" ry="4" fill="#FFF3B0" />
              </g>
            </g>
          </g>
        ))}
      </svg>
    </button>
  )
}
