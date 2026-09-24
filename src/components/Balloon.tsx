import styles from './Balloon.module.css'

const SHARDS = [0, 1, 2, 3, 4, 5, 6, 7]

/**
 * One balloon. [data-sway] swings the whole balloon from the bottom of its string (idle, time-based);
 * [data-body] + [data-shard] are the pop. Shards sit under the body, so they only show once it scales away.
 */
export default function Balloon({ color }: { color: string }) {
  return (
    <svg className={styles.balloon} viewBox="0 0 60 130" aria-hidden="true">
      <g data-sway>
        <path data-string d="M30 74 C22 90 40 104 30 128" fill="none" stroke="#8E8E99" strokeWidth="1.2" strokeLinecap="round" />
        {SHARDS.map((i) => (
          <circle key={i} data-shard cx="30" cy="40" r="3" fill={color} />
        ))}
        <g data-body>
          <ellipse cx="30" cy="36" rx="26" ry="32" fill={color} />
          <ellipse cx="20" cy="22" rx="6" ry="10" fill="#fff" opacity=".35" transform="rotate(-20 20 22)" />
          <path d="M30 66 L25 74 L35 74 Z" fill={color} />
        </g>
      </g>
    </svg>
  )
}
