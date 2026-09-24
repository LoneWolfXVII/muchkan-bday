import { useRef, useState } from 'react'
import Muchkan from './components/Muchkan'
import Balloon from './components/Balloon'
import Cake from './components/Cake'
import Confetti, { type ConfettiHandle } from './components/Confetti'
import Petals from './components/Petals'
import Stars from './components/Stars'
import styles from './App.module.css'

const BALLOONS = [
  { color: '#C9B3DB', left: '12%', top: '10%' },
  { color: '#F29B9B', left: '42%', top: '4%' },
  { color: '#F6C343', left: '70%', top: '12%' },
]

const TITLE_WORDS = ['Happy', 'Birthday,', 'Muskan']

export default function App() {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const confetti = useRef<ConfettiHandle>(null)
  const [blown, setBlown] = useState(false)

  const blow = () => setBlown(true) // replaced in Task 8
  const replay = () => window.scrollTo({ top: 0 }) // replaced in Task 6

  return (
    <>
      <main ref={track} className={styles.track}>
        <div ref={stage} className={styles.stage}>
          <div className={styles.bg} data-bg="pink" />
          <div className={styles.bg} data-bg="night" />
          <Stars />
          {BALLOONS.map((b) => (
            <Balloon key={b.color} color={b.color} style={{ left: b.left, top: b.top }} />
          ))}
          <div className={styles.her} data-her-wrap>
            <Muchkan />
            <Petals />
          </div>
          <Cake blown={blown} onBlow={blow} />

          <div className={styles.words}>
            <p data-word="hello" translate="no">hey Muchkan</p>
            <p data-word="lookup">look up</p>
            <p data-word="pops">
              <span data-pop>it’s</span> <span data-pop>your</span> <span data-pop>day</span>
            </p>
            <p data-word="bloom">bloom</p>
            <p data-word="wish">make a wish</p>
            <h1 data-word="title" translate="no" aria-label="Happy Birthday, Muskan">
              {TITLE_WORDS.map((word, w) => (
                <span key={w}>
                  <span className={styles.titleWord} aria-hidden="true">
                    {word.split('').map((ch, i) => (
                      <span key={i} data-letter>{ch}</span>
                    ))}
                  </span>
                  {w < TITLE_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
          </div>

          <p className={styles.hint} data-hint>scroll</p>
          <button type="button" className={styles.replay} data-replay onClick={replay}>
            Play again
          </button>
        </div>
      </main>
      <Confetti ref={confetti} />
    </>
  )
}
