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

// ---------- upgrade-pass sounds ----------

// Shared fountain roar with a ramp/hold/fade envelope (used by bigger fountains).
function fountainRoar(dur, ramp, holdEnd, fade, roar, pops, bright = 0.35) {
  const b = buffer(dur)
  let lp = 0
  let lp2 = 0
  const env = (t) => (t < ramp ? (t / ramp) ** 1.2 : t < holdEnd ? 1 : Math.max(0, 1 - (t - holdEnd) / fade) ** 1.4)
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const e = env(t)
    const w = rnd()
    lp += (w - lp) * (0.07 + 0.28 * e)
    lp2 += (lp - lp2) * 0.035
    b[i] = (lp * 0.5 + (w - lp) * bright + lp2 * roar) * e * (0.86 + 0.14 * Math.sin(t * 31))
  }
  addPops(b, pops, { gain: 0.5, density: (u) => env(u * dur), minLen: 18, maxLen: 150 })
  return fadeEdges(normalize(reverb(b, 0.2), 0.85), 40)
}

// Bijli / atom bomb: blinding crack, chest thump and a long courtyard echo.
function bang() {
  const dur = 3.6
  const b = buffer(dur)
  let lp = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const crack = t < 0.022 ? w * Math.sqrt(1 - t / 0.022) * 1.7 : 0
    lp += (w - lp) * (0.04 + 0.6 * Math.exp(-t * 30))
    const f = 55 + 140 * Math.exp(-t * 14)
    ph += (2 * Math.PI * f) / SR
    b[i] = crack + Math.sin(ph) * Math.exp(-t * 6) * 1.1 + lp * Math.exp(-t * 3.5) * 2.4
  }
  return fadeEdges(normalize(reverb(b, 0.45, 0.88), 0.97), 60)
}

// One cracker of a ladi: short sharp bang.
function ladiBang() {
  const dur = 0.55
  const b = buffer(dur)
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * (0.08 + 0.7 * Math.exp(-t * 60))
    b[i] = (t < 0.008 ? w * 1.4 : 0) + lp * Math.exp(-t * 18) * 2
  }
  return fadeEdges(normalize(reverb(b, 0.3, 0.75), 0.9), 20)
}

// Sutli bomb: deep, heavy boom with a rolling rumble.
function sutliBoom() {
  const dur = 4.6
  const b = buffer(dur)
  let lp = 0
  let lp2 = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const crack = t < 0.016 ? w * (1 - t / 0.016) * 1.1 : 0
    lp += (w - lp) * (0.015 + 0.35 * Math.exp(-t * 20))
    lp2 += (lp - lp2) * 0.05
    const f = 30 + 72 * Math.exp(-t * 5)
    ph += (2 * Math.PI * f) / SR
    b[i] = crack + Math.sin(ph) * Math.exp(-t * 2.2) * 1.3 + lp2 * Math.exp(-t * 1.6) * 7 + lp * Math.exp(-t * 2.6) * 1.6
  }
  return fadeEdges(normalize(reverb(b, 0.5, 0.9), 0.97), 80)
}

// Pop-pop snapper: tiny bright snap.
function snap() {
  const b = buffer(0.25)
  let prev = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const hp = w - prev
    prev = w
    b[i] = hp * Math.exp(-t * 90) * (t < 0.003 ? 2 : 1)
  }
  return fadeEdges(normalize(reverb(b, 0.15, 0.6), 0.75), 10)
}

// Snake tablet: quiet bubbling fizz (loopable, 2 s).
function snakeFizz() {
  const b = buffer(2.0)
  let lp = 0
  let lp2 = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * 0.2
    lp2 += (lp - lp2) * 0.2
    const bubbles = 0.6 + 0.4 * Math.sin(t * 2 * Math.PI * 7) * Math.sin(t * 2 * Math.PI * 3)
    b[i] = (lp - lp2) * bubbles
  }
  addPops(b, 30, { gain: 0.25, minLen: 40, maxLen: 200 })
  return fadeEdges(normalize(b, 0.6), 4)
}

// Colour shower: brighter sizzling shower with dense glitter crackle.
function shower() {
  const dur = 8.5
  const b = buffer(dur)
  let lp = 0
  let lp2 = 0
  const env = (t) => (t < 1.2 ? t / 1.2 : t < 6.2 ? 1 : Math.max(0, 1 - (t - 6.2) / 2.3))
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const e = env(t)
    const w = rnd()
    lp += (w - lp) * 0.45
    lp2 += (lp - lp2) * 0.12
    b[i] = ((lp - lp2) * (0.8 + 0.2 * Math.sin(t * 2 * Math.PI * 17)) + (w - lp) * 0.15) * e
  }
  addPops(b, 1400, { gain: 0.35, density: (u) => env(u * dur), minLen: 8, maxLen: 60 })
  return fadeEdges(normalize(reverb(b, 0.2), 0.8), 40)
}

// Zameen chakkar deluxe: deeper buzzing spin (loopable, 1 s).
function whirrDeluxe() {
  const b = buffer(1.0)
  let lp = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * 0.18
    const spin = Math.abs(Math.sin(Math.PI * 16 * t)) ** 2
    ph += (2 * Math.PI * 220) / SR
    const tone = Math.sin(ph) * 0.4 + Math.sin(ph * 2) * 0.18 + Math.sin(ph * 3) * 0.08
    b[i] = (lp * 0.9 + (w - lp) * 0.2 + tone * 0.7) * (0.3 + 0.7 * spin)
  }
  addPops(b, 80, { gain: 0.45, minLen: 15, maxLen: 90 })
  return fadeEdges(normalize(b, 0.75), 3)
}

// Anar deluxe: longer, heavier fountain roar.
const whooshBig = () => fountainRoar(10.8, 2.5, 7.8, 2.5, 1.9, 1200)

// Multi-shot cake: punchy mortar thump with a short lift-off whoosh.
function cakeShot() {
  const dur = 0.9
  const b = buffer(dur)
  let ph = 0
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const f = 70 + 160 * Math.exp(-t * 30)
    ph += (2 * Math.PI * f) / SR
    lp += (w - lp) * (0.05 + 0.5 * Math.exp(-t * 35))
    const whoosh = t > 0.03 ? (w - lp) * Math.exp(-t * 5) * 0.25 : 0
    b[i] = Math.sin(ph) * Math.exp(-t * 12) + lp * Math.exp(-t * 14) * 1.2 + whoosh
  }
  return fadeEdges(normalize(reverb(b, 0.3), 0.85), 20)
}

// Small aerial shell burst: crack + short boom + crackle tail.
function burstPop() {
  const dur = 1.8
  const b = buffer(dur)
  let lp = 0
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * (0.03 + 0.5 * Math.exp(-t * 25))
    const f = 60 + 90 * Math.exp(-t * 9)
    ph += (2 * Math.PI * f) / SR
    b[i] = (t < 0.01 ? w * 1.1 : 0) + Math.sin(ph) * Math.exp(-t * 5) * 0.6 + lp * Math.exp(-t * 4) * 1.6
  }
  addPops(b, 50, { from: 0.05, to: 0.6, gain: 0.25, minLen: 20, maxLen: 120, density: (u) => Math.exp(-u * 4) })
  return fadeEdges(normalize(reverb(b, 0.38, 0.84), 0.9), 40)
}

// Rocket-bundle screamer: wobbling, falling-then-rising scream.
function screamer() {
  const dur = 1.6
  const b = buffer(dur)
  let ph = 0
  let lp = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 2200 - 900 * (t / dur) + 250 * Math.sin(t * 2 * Math.PI * 5.5)
    ph += (2 * Math.PI * f) / SR
    const w = rnd()
    lp += (w - lp) * 0.3
    const att = clamp(t / 0.05, 0, 1)
    const rel = clamp((dur - t) / 0.4, 0, 1)
    b[i] = (Math.sin(ph) * 0.5 + Math.sin(ph * 2) * 0.18 + Math.sin(ph * 3) * 0.07 + (w - lp) * 0.35) * att * rel
  }
  return fadeEdges(normalize(reverb(b, 0.22), 0.7), 10)
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

// Rolling sky thunder: a sharp crack, then a long low rumble with bumps.
function thunder() {
  const dur = 5.5
  const b = buffer(dur)
  let lp = 0
  let lp2 = 0
  const bumps = [0, 0.55, 1.2, 1.9, 2.7]
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    lp += (w - lp) * 0.03
    lp2 += (lp - lp2) * 0.08
    let env = Math.exp(-t * 0.65)
    for (const at of bumps) if (t > at) env += 0.5 * Math.exp(-(t - at) * 3) * (t - at < 0.05 ? (t - at) / 0.05 : 1)
    const crack = t < 0.02 ? w * (1 - t / 0.02) * 1.4 : 0
    b[i] = lp2 * env * 5 + crack
  }
  return fadeEdges(normalize(reverb(b, 0.45, 0.88), 0.95), 120)
}

// Toy cap: a tiny dry click-snap (paper cap), deliberately not a gunshot.
function capPop() {
  const dur = 0.22
  const b = buffer(dur)
  let prev = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const w = rnd()
    const hp = w - prev
    prev = w
    const click = t < 0.004 ? (1 - t / 0.004) : 0
    b[i] = hp * Math.exp(-t * 90) * 0.9 + click * 0.6 + Math.sin(t * 2 * Math.PI * 1900) * Math.exp(-t * 120) * 0.25
  }
  return fadeEdges(normalize(b, 0.7), 4)
}

// Siren fountain: a rising-and-falling whistle (loopable, 2 s).
function siren() {
  const dur = 2.0
  const b = buffer(dur)
  let ph = 0
  for (let i = 0; i < b.length; i++) {
    const t = i / SR
    const f = 1500 + 700 * Math.sin((t / dur) * Math.PI * 2 - Math.PI / 2)
    ph += (2 * Math.PI * f) / SR
    b[i] = Math.sin(ph) * 0.55 + Math.sin(ph * 2.02) * 0.1 + rnd() * 0.08
  }
  return fadeEdges(normalize(b, 0.6), 6)
}

// Gatling noise maker: a long rapid stream of small pops (~32 per second).
function gatling() {
  const dur = 9.5
  const b = buffer(dur)
  const n = b.length
  for (let k = 0; k < 288; k++) {
    const at = 0.15 + (k / 288) * 8.8 + rand01() * 0.02
    const start = Math.floor(at * SR)
    const len = 260 + Math.floor(rand01() * 200)
    let prev = 0
    for (let i = 0; i < len && start + i < n; i++) {
      const w = rnd()
      const hp = w - prev
      prev = w
      b[start + i] += hp * Math.exp((-7 * i) / len) * (0.55 + rand01() * 0.45)
    }
  }
  return fadeEdges(normalize(reverb(b, 0.3, 0.8), 0.85), 60)
}
const rand01 = () => Math.random()

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
  bang,
  ladiBang,
  sutliBoom,
  snap,
  snakeFizz,
  shower,
  whirrDeluxe,
  whooshBig,
  cakeShot,
  burstPop,
  screamer,
  thunder,
  capPop,
  siren,
  gatling,
}

export function renderSound(name) {
  return toWavUrl(SOUND_BUILDERS[name]())
}
