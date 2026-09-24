import styles from './Muchkan.module.css'

const PETAL_ANGLES = [0, 72, 144, 216, 288]

/** The white plumeria from her photo, centred on (0,0), about 46 units across. Also used by the flower gift button. */
export function Plumeria() {
  return (
    <>
      <g stroke="#E9D9C4" strokeWidth="1" fill="#FFF9F0">
        {PETAL_ANGLES.map((a) => (
          <ellipse key={a} cx="0" cy="-11" rx="6.5" ry="12" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r="5" fill="#F6C343" />
    </>
  )
}

export default function Muchkan() {
  return (
    <svg className={styles.her} viewBox="30 20 140 220" aria-hidden="true" data-her>
      <g data-part="hairBack">
        <path
          d="M100 30 C150 30 165 70 162 110 C160 140 168 155 158 170 C150 177 140 167 136 172 L64 172 C60 167 50 177 42 170 C32 155 40 140 38 110 C35 70 50 30 100 30 Z"
          fill="#3A2620"
        />
      </g>

      <g data-part="body">
        <path d="M46 240 C46 204 58 184 100 180 C142 184 154 204 154 240 Z" fill="#C9B3DB" />
        <rect x="90" y="145" width="20" height="36" fill="#D69D7C" />
        <path d="M86 176 L100 192 L114 176" fill="#D69D7C" stroke="#A98FC2" strokeWidth="3" strokeLinejoin="round" />
      </g>

      <g data-part="head">
        <ellipse cx="100" cy="102" rx="50" ry="52" fill="#E0A988" />
        <g data-part="bangs">
          <path
            d="M50 100 C52 58 78 46 100 46 C132 45 152 62 151 96 C140 74 122 68 110 74 C100 64 78 64 68 80 C60 84 55 92 50 100 Z"
            fill="#3A2620"
          />
          <path
            d="M51 92 C45 118 49 140 56 152 C58 130 57 110 60 96 Z M149 92 C155 118 151 140 144 152 C142 130 143 110 140 96 Z"
            fill="#3A2620"
          />
        </g>
        <path d="M72 94 L86 93 M114 93 L128 94" stroke="#3A2620" strokeWidth="2.5" strokeLinecap="round" />
        <g data-part="eyesClosed">
          <path
            d="M73 110 Q80 103 87 110 M113 110 Q120 103 127 110"
            stroke="#2A1A16"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g data-part="eyesOpen" opacity="0">
          <circle cx="80" cy="109" r="3.2" fill="#2A1A16" />
          <circle cx="120" cy="109" r="3.2" fill="#2A1A16" />
        </g>
        <g data-part="glasses">
          <rect x="64" y="96" width="32" height="27" rx="11" fill="#fff" fillOpacity=".18" stroke="#8E8E99" strokeWidth="2.5" />
          <rect x="104" y="96" width="32" height="27" rx="11" fill="#fff" fillOpacity=".18" stroke="#8E8E99" strokeWidth="2.5" />
          <path d="M96 105 Q100 101 104 105" stroke="#8E8E99" strokeWidth="2.5" fill="none" />
        </g>
        <g data-part="blush" opacity=".6">
          <ellipse cx="72" cy="130" rx="7" ry="4" fill="#F29B9B" />
          <ellipse cx="128" cy="130" rx="7" ry="4" fill="#F29B9B" />
        </g>
        <path d="M99 118 Q102 124 98 126" stroke="#C98C6B" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="104" cy="123" r="1.4" fill="#DADAE3" />
        <g data-part="mouth">
          <path d="M88 136 Q100 145 112 136" stroke="#8A4A3E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>

        <g transform="translate(92 44) rotate(-15)">
          <g data-part="plumeria">
            <Plumeria />
          </g>
        </g>

        <g transform="translate(150 98)">
          <g data-part="bougain">
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#E35FB0" />
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#EE7CC4" transform="rotate(120)" />
            <ellipse cx="0" cy="-6" rx="4" ry="7" fill="#D94FA4" transform="rotate(240)" />
            <circle r="1.6" fill="#FFF3B0" />
          </g>
        </g>
      </g>
    </svg>
  )
}
