/**
 * WordBloom Neurodiversity-Friendly Sound Synthesizer (Web Audio API)
 * 
 * Provides soft, organic, tactile wooden marimba sound effects.
 * Carefully tuned for children with sensory sensitivities, autism, and ADHD:
 * - Uses pure sine harmonics and lowpass resonance (zero harsh clicks or high-frequency piercing tones).
 * - Gentle attack (soft felt mallet) and natural exponential wooden bar decay.
 * - Calibrated volume (comfortably gentle, never startling).
 */

let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch (e) {
    return null
  }
}

/**
 * Plays a single warm wooden marimba strike at a given frequency and time.
 * Real rosewood marimba bars exhibit a warm fundamental with an overtone at ~3.9x fundamental.
 */
function playMarimbaStrike(
  audioCtx: AudioContext,
  freq: number,
  startTime: number,
  volume = 0.22,
  decaySeconds = 0.42
) {
  try {
    const oscFundamental = audioCtx.createOscillator()
    const oscOvertone = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    const filter = audioCtx.createBiquadFilter()

    // Warm wooden bar lowpass filter: rounds off harsh transients
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(freq * 3.2, startTime)
    filter.frequency.exponentialRampToValueAtTime(freq * 1.4, startTime + decaySeconds * 0.8)

    // Fundamental (sine)
    oscFundamental.type = 'sine'
    oscFundamental.frequency.setValueAtTime(freq, startTime)

    // Overtone (wooden bar 4th harmonic resonance at ~3.9x fundamental)
    oscOvertone.type = 'sine'
    oscOvertone.frequency.setValueAtTime(freq * 3.9, startTime)

    // Soft felt mallet strike: 4ms smooth rise, dual exponential decay
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.35, startTime + 0.12)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decaySeconds)

    // Subtly softer overtone volume
    const overtoneGain = audioCtx.createGain()
    overtoneGain.gain.setValueAtTime(0.18, startTime)

    oscFundamental.connect(filter)
    oscOvertone.connect(overtoneGain)
    overtoneGain.connect(filter)

    filter.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscFundamental.start(startTime)
    oscOvertone.start(startTime)

    oscFundamental.stop(startTime + decaySeconds + 0.05)
    oscOvertone.stop(startTime + decaySeconds + 0.05)
  } catch (err) {
    console.debug('Marimba sound playback suppressed:', err)
  }
}

/**
 * Plays a soft, delightful 4-note ascending marimba chime when a candy is won.
 * Notes: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
 */
export function playCandyRewardSound(volume = 0.20) {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [
    { freq: 523.25, time: 0.00 }, // C5
    { freq: 659.25, time: 0.08 }, // E5
    { freq: 783.99, time: 0.16 }, // G5
    { freq: 1046.5, time: 0.25 }, // C6
  ]

  notes.forEach(({ freq, time }) => {
    playMarimbaStrike(ctx, freq, now + time, volume, 0.45)
  })
}

/**
 * Plays a single playful marimba note when a child taps a candy in the counter.
 * Uses a gentle pentatonic scale so every tap sounds musical and harmonic!
 */
export function playCandyTapSound(index = 0, volume = 0.18) {
  const ctx = getAudioContext()
  if (!ctx) return

  // C Major Pentatonic: C5, D5, E5, G5, A5, C6
  const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]
  const noteFreq = pentatonic[Math.abs(index) % pentatonic.length]

  playMarimbaStrike(ctx, noteFreq, ctx.currentTime, volume, 0.38)
}

/**
 * Celebratory soft marimba cascade when the child reaches their full Candy Goal!
 * Joyous, uplifting, and sensory-soothing.
 */
export function playGoalCelebrationSound(volume = 0.24) {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const arpeggio = [
    { freq: 523.25, time: 0.00 }, // C5
    { freq: 659.25, time: 0.10 }, // E5
    { freq: 783.99, time: 0.20 }, // G5
    { freq: 1046.5, time: 0.32 }, // C6
    { freq: 1318.5, time: 0.44 }, // E6
    { freq: 1567.9, time: 0.58 }, // G6
  ]

  arpeggio.forEach(({ freq, time }) => {
    playMarimbaStrike(ctx, freq, now + time, volume, 0.55)
  })

  // Final resonant warm chord blooming at 0.72s
  setTimeout(() => {
    const chordCtx = getAudioContext()
    if (!chordCtx) return
    const chordTime = chordCtx.currentTime
    playMarimbaStrike(chordCtx, 523.25, chordTime, volume * 0.6, 0.8)
    playMarimbaStrike(chordCtx, 783.99, chordTime, volume * 0.5, 0.8)
    playMarimbaStrike(chordCtx, 1046.5, chordTime, volume * 0.6, 0.8)
  }, 720)
}
