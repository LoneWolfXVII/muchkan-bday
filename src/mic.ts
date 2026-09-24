/**
 * Listen for a blow on the microphone. Nothing is recorded or sent: we only read the
 * loudness (RMS) of each audio frame, on the device.
 *
 * Blowing on a mic is a loud, sustained broadband rush; talking is quieter and bursty.
 * ponytail: plain RMS threshold + hold time. If speech ever false-triggers, add a
 * spectral-flatness check (noise is flat, voice is peaky).
 */
const THRESHOLD = 0.08 // RMS of a float [-1, 1] signal; a phone mic without auto-gain reads a real blow well above
const HOLD_MS = 220 // how long it must stay above the threshold
// a steady breath that isn't strong enough: nudge her to blow harder
const WEAK = 0.025
const WEAK_HOLD_MS = 350

export const micSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined'

type Handlers = {
  /** 0..1, for flickering the flames with her breath */
  onLevel: (level: number) => void
  /** return false to keep listening (e.g. the candles aren't lit yet) */
  onBlow: () => boolean
  /** a sustained breath under the threshold */
  onWeak: () => void
}

/**
 * Must be called from a tap: iOS only lets an AudioContext start inside a user gesture,
 * so it is created before the permission prompt is awaited. Resolves to a stop function;
 * rejects if permission is denied or there is no microphone.
 */
export async function listenForBlow({ onLevel, onBlow, onWeak }: Handlers): Promise<() => void> {
  const ctx = new AudioContext()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // raw signal: the browser's voice processing would squash exactly the noise we want
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch (err) {
    ctx.close()
    throw err
  }
  await ctx.resume()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Float32Array(analyser.fftSize)

  let raf = 0
  let above = 0
  let weak = 0
  let last = performance.now()
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    stream.getTracks().forEach((t) => t.stop()) // turns off the browser's mic indicator
    ctx.close()
    onLevel(0)
  }
  const tick = (now: number) => {
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (const v of buf) sum += v * v
    const rms = Math.sqrt(sum / buf.length)
    onLevel(Math.min(1, rms / THRESHOLD))
    above = rms > THRESHOLD ? above + (now - last) : 0
    weak = rms > WEAK && rms <= THRESHOLD ? weak + (now - last) : 0
    last = now
    if (weak >= WEAK_HOLD_MS) {
      weak = 0
      onWeak()
    }
    if (above >= HOLD_MS) {
      if (onBlow()) return stop()
      above = 0
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return stop
}
