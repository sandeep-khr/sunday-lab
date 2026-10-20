let ctx: AudioContext | null = null
let muted = typeof window !== 'undefined' && localStorage.getItem('actg-muted') === '1'

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return ctx
  } catch {
    return null
  }
}

export function isMuted(): boolean {
  return muted
}

export function toggleMute(): boolean {
  muted = !muted
  localStorage.setItem('actg-muted', muted ? '1' : '0')
  return muted
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.07, when = 0, slideTo?: number): void {
  if (muted) return
  const c = ac()
  if (!c) return
  const t = c.currentTime + when
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noiseBurst(dur: number, gain = 0.05, when = 0): void {
  if (muted) return
  const c = ac()
  if (!c) return
  const t = c.currentTime + when
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 2400
  src.connect(f).connect(g).connect(c.destination)
  src.start(t)
}

export const sfx = {
  click: () => tone(880, 0.05, 'square', 0.028),
  type: () => tone(1300 + Math.random() * 500, 0.03, 'square', 0.02),
  pag: () => {
    tone(1046, 0.11, 'sine', 0.08)
    tone(1046, 0.11, 'sine', 0.08, 0.17)
    tone(1046, 0.11, 'sine', 0.08, 0.34)
  },
  alarm: () => {
    for (let i = 0; i < 3; i++) {
      tone(740, 0.2, 'sawtooth', 0.045, i * 0.26, 500)
      noiseBurst(0.12, 0.03, i * 0.26)
    }
  },
  success: () => {
    tone(523, 0.09, 'sine', 0.06)
    tone(784, 0.11, 'sine', 0.06, 0.09)
    tone(1046, 0.2, 'sine', 0.06, 0.19)
  },
  fail: () => tone(210, 0.28, 'sawtooth', 0.06, 0, 110),
  unlock: () => {
    tone(392, 0.08, 'triangle', 0.055)
    tone(523, 0.08, 'triangle', 0.055, 0.08)
    tone(659, 0.09, 'triangle', 0.055, 0.16)
    tone(784, 0.24, 'triangle', 0.055, 0.24)
  },
  correct: () => {
    tone(659, 0.08, 'sine', 0.06)
    tone(988, 0.16, 'sine', 0.06, 0.08)
  },
  wrong: () => tone(233, 0.22, 'square', 0.045, 0, 175),
  boot: () => {
    tone(180, 0.4, 'triangle', 0.05, 0, 90)
    noiseBurst(0.2, 0.02, 0.1)
    tone(440, 0.12, 'sine', 0.05, 0.35)
    tone(880, 0.2, 'sine', 0.05, 0.5)
  },
}

export function initAudioOnFirstGesture(): void {
  const handler = () => {
    ac()
    window.removeEventListener('pointerdown', handler)
  }
  window.addEventListener('pointerdown', handler)
}
