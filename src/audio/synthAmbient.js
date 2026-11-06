// Procedural ambient beds (original work, no samples): crowd murmur and a
// bazaar bed with soft bells. Loopable, rendered once on first use.
const SR = 44100
const rnd = () => Math.random() * 2 - 1

function norm(b, peak) {
  let m = 0
  for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i]))
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m
  return b
}
function loopFade(b, ms = 300) {
  // crossfade the tail into the head so the loop is seamless
  const n = Math.floor((ms / 1000) * SR)
  for (let i = 0; i < n; i++) {
    const g = i / n
    b[i] = b[i] * g + b[b.length - n + i] * (1 - g)
  }
  return b.subarray(0, b.length - n)
}

// Many overlapping "voices": band-limited noise with slow syllable-rate
// amplitude modulation at speech-like formant bands.
export function crowd() {
  const dur = 8.3
  const b = new Float32Array(Math.floor(dur * SR))
  const voices = 14
  for (let v = 0; v < voices; v++) {
    let lp = 0
    let lp2 = 0
    const cut = 0.04 + Math.random() * 0.06
    const rate = 2.5 + Math.random() * 3 // syllables per second
    const ph = Math.random() * 10
    const gain = 0.3 + Math.random() * 0.7
    for (let i = 0; i < b.length; i++) {
      const t = i / SR
      lp += (rnd() - lp) * cut
      lp2 += (lp - lp2) * cut * 0.5
      const band = lp - lp2
      const syll = Math.max(0, Math.sin(t * rate * Math.PI * 2 + ph)) ** 2 * (0.6 + 0.4 * Math.sin(t * 0.7 + ph))
      b[i] += band * syll * gain
    }
  }
  return loopFade(norm(b, 0.5))
}

// Bazaar: a softer crowd plus occasional small brass bells and a tawa sizzle.
export function bazaar() {
  const base = crowd()
  const b = new Float32Array(base.length)
  b.set(base)
  for (let i = 0; i < b.length; i++) b[i] *= 0.7
  const bells = 6
  for (let k = 0; k < bells; k++) {
    const at = Math.floor(Math.random() * (b.length - SR))
    const f = 1800 + Math.random() * 900
    for (let i = 0; i < SR * 0.9 && at + i < b.length; i++) {
      const t = i / SR
      b[at + i] += (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.exp(-t * 5) * 0.25
    }
  }
  // gentle sizzle
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const w = rnd()
    lp += (w - lp) * 0.6
    b[i] += (w - lp) * 0.025
  }
  return norm(b, 0.5)
}
