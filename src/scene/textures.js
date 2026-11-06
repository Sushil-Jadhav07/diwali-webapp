import * as THREE from 'three'
import { mulberry32 } from './shared'

function canvas(size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')]
}

// Sandstone courtyard slabs.
export function makeTileTexture() {
  const S = 512
  const [c, g] = canvas(S)
  const r = mulberry32(7)
  g.fillStyle = '#3b3029'
  g.fillRect(0, 0, S, S)
  const n = 4
  const s = S / n
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const l = 44 + r() * 14
      g.fillStyle = `hsl(${24 + r() * 10}, ${18 + r() * 10}%, ${l}%)`
      g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6)
      // speckle
      for (let k = 0; k < 220; k++) {
        g.fillStyle = `rgba(${r() > 0.5 ? '255,240,220' : '40,25,15'},${0.05 + r() * 0.08})`
        g.fillRect(x * s + r() * s, y * s + r() * s, 2, 2)
      }
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Lime-plaster wall grain (greyscale, tinted by material colour).
export function makePlasterTexture() {
  const S = 256
  const [c, g] = canvas(S)
  const r = mulberry32(11)
  g.fillStyle = '#d8d8d8'
  g.fillRect(0, 0, S, S)
  for (let k = 0; k < 2600; k++) {
    const v = 180 + r() * 75
    g.fillStyle = `rgba(${v},${v},${v},0.35)`
    g.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Detailed symmetrical rangoli mandala (lotus rings, chevrons, paisleys,
// pulli dots, powder grain). variant: 'main' (2048 px) | 'small'.
const RANGOLI_PALETTES = {
  main: {
    base: '#4a0b18',
    colors: ['#e3176f', '#ff8a00', '#ffd31a', '#12bfb0', '#2459d6', '#21a84a', '#8e3fd0', '#ff5fa2', '#e23131'],
  },
  small: {
    base: '#14245e',
    colors: ['#ffd31a', '#e3176f', '#21c4b0', '#ff8a00', '#9b5de5', '#ff5fa2', '#21a84a', '#fff1c1', '#e23131'],
  },
}

export function makeRangoliTexture(seed = 3, { size = 2048, variant = 'main' } = {}) {
  const S = size
  const [c, g] = canvas(S)
  const R = (S / 2) * 0.985
  const pal = RANGOLI_PALETTES[variant] || RANGOLI_PALETTES.main
  const C = pal.colors
  const W = '#fff6ea'
  const rnd = mulberry32(seed)
  const lw = S * 0.0022
  g.translate(S / 2, S / 2)

  const circle = (rad, fill) => {
    g.beginPath()
    g.arc(0, 0, rad, 0, Math.PI * 2)
    g.fillStyle = fill
    g.fill()
  }
  const ring = (rad, w, col) => {
    g.beginPath()
    g.arc(0, 0, rad, 0, Math.PI * 2)
    g.lineWidth = w
    g.strokeStyle = col
    g.stroke()
  }
  const dots = (rad, n, dr, col, off = 0) => {
    g.fillStyle = col
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2
      g.beginPath()
      g.arc(Math.cos(a) * rad, Math.sin(a) * rad, dr, 0, Math.PI * 2)
      g.fill()
    }
  }
  const around = (n, off, fn) => {
    for (let i = 0; i < n; i++) {
      g.save()
      g.rotate(((i + off) / n) * Math.PI * 2)
      fn(i)
      g.restore()
    }
  }
  const petalPath = (r0, r1, w) => {
    const d = r1 - r0
    g.beginPath()
    g.moveTo(0, r0)
    g.bezierCurveTo(w, r0 + d * 0.25, w * 0.9, r0 + d * 0.75, 0, r1)
    g.bezierCurveTo(-w * 0.9, r0 + d * 0.75, -w, r0 + d * 0.25, 0, r0)
    g.closePath()
  }
  const petal = (r0, r1, w, fill, stroke, inner, tip) => {
    petalPath(r0, r1, w)
    g.fillStyle = fill
    g.fill()
    if (stroke) {
      g.lineWidth = lw
      g.strokeStyle = stroke
      g.stroke()
    }
    if (inner) {
      const d = r1 - r0
      petalPath(r0 + d * 0.2, r0 + d * 0.78, w * 0.5)
      g.fillStyle = inner
      g.fill()
    }
    if (tip) {
      g.beginPath()
      g.arc(0, r1 + R * 0.012, R * 0.0095, 0, Math.PI * 2)
      g.fillStyle = tip
      g.fill()
    }
  }
  const tri = (a, b, tipR, fill) => {
    g.beginPath()
    g.moveTo(-a, b)
    g.lineTo(a, b)
    g.lineTo(0, tipR)
    g.closePath()
    g.fillStyle = fill
    g.fill()
  }

  // base disc + outer pulli dots
  circle(R, W)
  circle(R * 0.988, pal.base)
  dots(R * 0.968, variant === 'main' ? 120 : 64, R * 0.0085, W)

  if (variant === 'main') {
    // chevron band
    around(48, 0, (i) => tri(R * 0.058, R * 0.875, R * 0.945, i % 2 ? C[0] : C[1]))
    around(48, 0.5, () => tri(R * 0.058, R * 0.945, R * 0.875, C[2]))
    ring(R * 0.873, lw * 1.6, W)
    ring(R * 0.948, lw * 1.6, W)
    // outer lotus (24) with leaves between
    around(24, 0, (i) => petal(R * 0.6, R * 0.862, R * 0.085, i % 2 ? C[3] : C[0], W, i % 2 ? C[2] : C[7], W))
    around(24, 0.5, () => petal(R * 0.7, R * 0.83, R * 0.03, C[5], null, null, C[2]))
    // beaded ring
    circle(R * 0.606, C[2])
    circle(R * 0.578, pal.base)
    dots(R * 0.592, 72, R * 0.0072, C[8])
    // paisley (kairi) ring
    around(16, 0, (i) => {
      g.rotate(0.32)
      petal(R * 0.4, R * 0.562, R * 0.052, i % 2 ? C[5] : C[6], W, i % 2 ? C[2] : C[1], null)
      g.beginPath()
      g.arc(0, R * 0.445, R * 0.017, 0, Math.PI * 2)
      g.fillStyle = W
      g.fill()
    })
    dots(R * 0.49, 16, R * 0.011, C[2], 0.5)
    circle(R * 0.396, W)
    circle(R * 0.386, C[1])
    circle(R * 0.372, pal.base)
  } else {
    // small rangoli: 16-petal lotus
    around(16, 0, (i) => petal(R * 0.45, R * 0.9, R * 0.13, i % 2 ? C[0] : C[1], W, C[i % 2 ? 2 : 7], W))
    around(16, 0.5, () => petal(R * 0.6, R * 0.82, R * 0.045, C[6], null, null, C[2]))
    circle(R * 0.47, C[2])
    circle(R * 0.44, pal.base)
    dots(R * 0.455, 40, R * 0.009, C[1])
  }

  // mid lotus: back layer + front layer
  const mR = variant === 'main' ? 1 : 1.18
  around(12, 0.5, () => petal(R * 0.2 * mR, R * 0.368 * mR, R * 0.075 * mR, C[0], W, C[8], null))
  around(12, 0, () => petal(R * 0.2 * mR, R * 0.345 * mR, R * 0.055 * mR, C[2], W, C[1], C[8]))
  // turquoise band with dots
  circle(R * 0.205 * mR, C[3])
  dots(R * 0.193 * mR, 28, R * 0.0065, W)
  circle(R * 0.18 * mR, pal.base)
  // 8-point star with petals
  around(8, 0, () => tri(R * 0.036, R * 0.07, R * 0.178 * mR, C[0]))
  around(8, 0.5, () => petal(R * 0.07, R * 0.16 * mR, R * 0.028, W, null, C[2], null))
  // centre bindu
  circle(R * 0.075, C[2])
  circle(R * 0.055, C[8])
  circle(R * 0.034, W)
  circle(R * 0.016, C[1])

  // powder grain so it reads like coloured rangoli powder
  const n = Math.floor(S * S * 0.006)
  for (let k = 0; k < n; k++) {
    const a = rnd() * Math.PI * 2
    const rr = Math.sqrt(rnd()) * R * 0.99
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
    g.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, 2, 2)
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Window glass: lit (warm room, curtains, mullions) or dark (night glass).
export function makeWindowTexture(lit) {
  const W = 64
  const H = 96
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  if (lit) {
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#fff0c8')
    grd.addColorStop(0.6, '#ffc874')
    grd.addColorStop(1, '#e8903e')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    // curtains with folds
    for (const side of [0, 1]) {
      const x0 = side ? W - 17 : 3
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k % 2 ? 'rgba(170,50,40,0.85)' : 'rgba(205,80,55,0.85)'
        g.fillRect(x0 + k * 3.5, 4, 3.5, H - 8)
      }
    }
  } else {
    const grd = g.createLinearGradient(0, 0, W, H)
    grd.addColorStop(0, '#2a3358')
    grd.addColorStop(0.5, '#141a33')
    grd.addColorStop(1, '#0c1024')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
  }
  // frame + mullions
  g.strokeStyle = lit ? '#5a3418' : '#3b3f52'
  g.lineWidth = 4
  g.strokeRect(2, 2, W - 4, H - 4)
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(W / 2, 2)
  g.lineTo(W / 2, H - 2)
  g.moveTo(2, H * 0.36)
  g.lineTo(W - 2, H * 0.36)
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Soft radial glow for halos and ground light pools.
export function makeGlowTexture() {
  const S = 128
  const [c, g] = canvas(S)
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.08)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, S, S)
  const t = new THREE.CanvasTexture(c)
  return t
}

let glowTex
export const glowTexture = () => (glowTex ||= makeGlowTexture())
