// Procedural sound design for every cracker. Each sound is rendered once into a
// Float32Array (mono, 44.1 kHz), encoded to a WAV blob and handed to Howler.
// No external audio files are needed, so the app can never be blocked on assets.

const SR = 44100

const rnd = () => Math.random() * 2 - 1
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

function buffer(seconds) {
  return new Float32Array(Math.floor(seconds * SR))
}

function normalize(buf, peak = 0.9) {
  let m = 0
  for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i]))
  if (m > 0) {
    const k = peak / m
    for (let i = 0; i < buf.length; i++) buf[i] *= k
  }
  return buf
}

// Short de-click fade-in (keeps attack transients) and a longer fade-out.
function fadeEdges(buf, ms = 8) {
  const nOut = Math.min(buf.length >> 1, Math.floor((ms / 1000) * SR))
  const nIn = Math.min(nOut, Math.floor(0.002 * SR))
  for (let i = 0; i < nIn; i++) buf[i] *= i / nIn
  for (let i = 0; i < nOut; i++) buf[buf.length - 1 - i] *= i / nOut
  return buf
}

// Small Schroeder reverb (4 combs + 2 allpasses) for outdoor-courtyard space.
function reverb(buf, mix = 0.3, room = 0.82) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d, b: new Float32Array(d), i: 0, lp: 0 }))
  const aps = [225, 556].map((d) => ({ d, b: new Float32Array(d), i: 0 }))
  const out = new Float32Array(buf.length)
  for (let n = 0; n < buf.length; n++) {
    const x = buf[n]
    let s = 0
    for (const c of combs) {
      const y = c.b[c.i]
      c.lp = y * 0.7 + c.lp * 0.3 // damping
      c.b[c.i] = x + c.lp * room
      c.i = (c.i + 1) % c.d
      s += y
    }
    s *= 0.25
    for (const a of aps) {
      const y = a.b[a.i]
      const v = s + y * 0.5
      a.b[a.i] = v
      a.i = (a.i + 1) % a.d
      s = y - v * 0.5
    }
    out[n] = x * (1 - mix) + s * mix
  }
  return out
}

// Sparse crackle "pops": short bright noise bursts.
function addPops(buf, count, { from = 0, to = 1, gain = 0.8, minLen = 30, maxLen = 260, density = null } = {}) {
  const n = buf.length
  for (let k = 0; k < count; k++) {
    let t = from + Math.random() * (to - from)
    if (density) {
      // rejection sample so pops follow an envelope
      let tries = 0
      while (Math.random() > density(t) && tries++ < 20) t = from + Math.random() * (to - from)
    }
    const start = Math.floor(t * n)
    const len = Math.floor(minLen + Math.random() * (maxLen - minLen))
    const amp = gain * (0.3 + Math.random() * 0.7)
    let hp = 0
    let prev = 0
    for (let i = 0; i < len && start + i < n; i++) {
      const env = Math.exp((-6 * i) / len)
      const w = rnd()
      hp = w - prev // crude high-pass for brightness
      prev = w
      buf[start + i] += hp * amp * env
    }
  }
  return buf
}

// ---------- individual sounds ----------

function fuseHiss() {
  const b = buffer(1.6)
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const w = rnd()
    lp += (w - lp) * 0.35
    const hp = w - lp
    const flutter = 0.75 + 0.25 * Math.sin((i / SR) * Math.PI * 2 * 12.5)
    b[i] = hp * 0.35 * flutter
  }
  addPops(b, 40, { gain: 0.5, minLen: 15, maxLen: 80 })
  return fadeEdges(normalize(b, 0.7), 4)
}

function sparklerCrackle() {
  const b = buffer(2.0)
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const w = rnd()
    lp += (w - lp) * 0.5
    b[i] = (w - lp) * 0.12
  }
  addPops(b, 520, { gain: 0.9, minLen: 12, maxLen: 140 })
  return fadeEdges(normalize(b, 0.8), 4)
}

function anarWhoosh() {
  const dur = 7.5
  const b = buffer(dur)
  let lp = 0
  let lp2 = 0
  const env = (t) => (t < 2 ? (t / 2) ** 1.3 : t < 5.2 ? 1 : Math.max(0, 1 - (t - 5.2) / 2.3) ** 1.5)
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const e = env(t)
    const w = rnd()
    const cut = 0.08 + 0.3 * e
    lp += (w - lp) * cut
    lp2 += (lp - lp2) * 0.04 // low roar
    const hiss = w - lp
    b[i] = (lp * 0.55 + hiss * 0.35 + lp2 * 1.2) * e * (0.85 + 0.15 * Math.sin(t * 37))
  }
  addPops(b, 700, { gain: 0.55, density: (u) => env(u * dur), minLen: 20, maxLen: 160 })
  return fadeEdges(normalize(reverb(b, 0.18), 0.85), 30)
}

function chakriWhirr() {
  const dur = 1.0 // loopable; pitch rises via playback rate
  const b = buffer(dur)
  let lp = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * 0.22
    const spin = Math.abs(Math.sin(Math.PI * 22 * t)) ** 2.5 // 22 rotations per second
    ph += (2 * Math.PI * 330) / SR
    const tone = Math.sin(ph) * 0.35 + Math.sin(ph * 2) * 0.12
    b[i] = (lp * 0.8 + (w - lp) * 0.25 + tone * 0.6) * (0.35 + 0.65 * spin)
  }
  addPops(b, 50, { gain: 0.4, minLen: 15, maxLen: 70 })
  return fadeEdges(normalize(b, 0.75), 3)
}

function rocketWhistle() {
  const dur = 1.9
  const b = buffer(dur)
  let ph = 0
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 1300 + 1500 * (t / dur) ** 0.8 + Math.sin(t * 2 * Math.PI * 9) * 40
    ph += (2 * Math.PI * f) / SR
    const att = clamp(t / 0.06, 0, 1)
    const rel = clamp((dur - t) / 0.45, 0, 1)
    const w = rnd()
    lp += (w - lp) * 0.3
    const breath = (w - lp) * 0.45
    b[i] = (Math.sin(ph) * 0.6 + Math.sin(ph * 2.01) * 0.12 + breath) * att * rel * (1 - 0.3 * (t / dur))
  }
  return fadeEdges(normalize(reverb(b, 0.2), 0.75), 10)
}

function boom() {
  const dur = 3.8
  const b = buffer(dur)
  let lp = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const cut = 0.02 + 0.5 * Math.exp(-t * 18)
    lp += (w - lp) * cut
    const f = 40 + 70 * Math.exp(-t * 6)
    ph += (2 * Math.PI * f) / SR
    const body = Math.sin(ph) * Math.exp(-t * 3.2) * 0.9
    const rumble = lp * Math.exp(-t * 2.2) * 2.2
    const crack = t < 0.012 ? w * (1 - t / 0.012) * 1.2 : 0
    b[i] = body + rumble + crack
  }
  return fadeEdges(normalize(reverb(b, 0.42, 0.86), 0.95), 40)
}

function thump() {
  const dur = 1.4
  const b = buffer(dur)
  let ph = 0
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 50 + 110 * Math.exp(-t * 22)
    ph += (2 * Math.PI * f) / SR
    const w = rnd()
    lp += (w - lp) * (0.05 + 0.4 * Math.exp(-t * 40))
    b[i] = Math.sin(ph) * Math.exp(-t * 7) + lp * Math.exp(-t * 9) * 1.6 + (t < 0.006 ? w * 0.8 : 0)
  }
  return fadeEdges(normalize(reverb(b, 0.35), 0.9), 30)
}

function crackleBurst() {
  const dur = 3.2
  const b = buffer(dur)
  addPops(b, 260, {
    from: 0,
    to: 0.8,
    gain: 1,
    minLen: 40,
    maxLen: 380,
    density: (u) => Math.exp(-u * 2.5),
  })
  return fadeEdges(normalize(reverb(b, 0.35, 0.8), 0.85), 40)
}

function strike() {
  const dur = 0.7
  const b = buffer(dur)
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * 0.12
    const scratch = t < 0.09 ? (w - lp) * (1 - t / 0.09) : 0
    const flare = t > 0.05 ? lp * Math.exp(-(t - 0.05) * 6) * 1.4 : 0
    b[i] = scratch * 0.8 + flare
  }
  return fadeEdges(normalize(b, 0.6), 6)
}

// Distant Diwali-night ambience: far-off booms and crackle, loopable.
function ambience() {
  const dur = 9
  const b = buffer(dur)
  const events = [0.6, 2.1, 3.0, 4.7, 6.2, 7.9]
  for (const at of events) {
    let lp = 0
    const start = Math.floor(at * SR)
    const amp = 0.4 + Math.random() * 0.6
    for (let i = 0; i < SR * 1.2 && start + i < b.length; i++) {
      const t = i / SR
      lp += (rnd() - lp) * 0.025
      b[start + i] += lp * Math.exp(-t * 4) * amp * 3
    }
  }
  addPops(b, 160, { gain: 0.12, minLen: 30, maxLen: 200 })
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    lp += (rnd() - lp) * 0.01
    b[i] += lp * 0.15 // night air
  }
  return fadeEdges(normalize(reverb(b, 0.4), 0.5), 200)
}

// ---------- WAV encoding ----------

function toWavUrl(samples) {
  const n = samples.length
  const ab = new ArrayBuffer(44 + n * 2)
  const v = new DataView(ab)
  const w = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
  }
  w(0, 'RIFF')
  v.setUint32(4, 36 + n * 2, true)
  w(8, 'WAVE')
  w(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, SR, true)
  v.setUint32(28, SR * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  w(36, 'data')
  v.setUint32(40, n * 2, true)
  let o = 44
  for (let i = 0; i < n; i++, o += 2) v.setInt16(o, clamp(samples[i], -1, 1) * 0x7fff, true)
  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }))
}

export const SOUND_BUILDERS = {
  hiss: fuseHiss,
  crackle: sparklerCrackle,
  whoosh: anarWhoosh,
  whirr: chakriWhirr,
  whistle: rocketWhistle,
  boom,
  thump,
  crackleBurst,
  strike,
  ambience,
}

export function renderSound(name) {
  return toWavUrl(SOUND_BUILDERS[name]())
}
