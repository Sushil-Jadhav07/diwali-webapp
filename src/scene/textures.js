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

// Traditional radial rangoli.
export function makeRangoliTexture(seed = 3) {
  const S = 1024
  const [c, g] = canvas(S)
  const r = mulberry32(seed)
  const cx = S / 2
  const palette = ['#e11d74', '#facc15', '#14b8a6', '#f97316', '#f8fafc', '#22c55e', '#8b5cf6', '#ef4444']
  const pick = () => palette[Math.floor(r() * palette.length)]
  g.translate(cx, cx)
  // outer dotted border
  const rings = [
    { rad: 470, petals: 24, len: 70, w: 34 },
    { rad: 380, petals: 16, len: 90, w: 50 },
    { rad: 270, petals: 12, len: 100, w: 60 },
    { rad: 160, petals: 8, len: 90, w: 60 },
  ]
  g.beginPath()
  g.arc(0, 0, 500, 0, Math.PI * 2)
  g.fillStyle = '#f8fafc'
  g.fill()
  g.beginPath()
  g.arc(0, 0, 490, 0, Math.PI * 2)
  g.fillStyle = '#7c2d12'
  g.fill()
  for (const ring of rings) {
    const col = pick()
    const col2 = pick()
    g.beginPath()
    g.arc(0, 0, ring.rad + 10, 0, Math.PI * 2)
    g.fillStyle = col2
    g.fill()
    for (let i = 0; i < ring.petals; i++) {
      g.save()
      g.rotate((i / ring.petals) * Math.PI * 2)
      g.beginPath()
      g.moveTo(0, ring.rad - ring.len)
      g.quadraticCurveTo(ring.w, ring.rad - ring.len * 0.2, 0, ring.rad + ring.len * 0.15)
      g.quadraticCurveTo(-ring.w, ring.rad - ring.len * 0.2, 0, ring.rad - ring.len)
      g.fillStyle = col
      g.fill()
      g.beginPath()
      g.arc(0, ring.rad - ring.len * 0.15, ring.w * 0.18, 0, Math.PI * 2)
      g.fillStyle = '#f8fafc'
      g.fill()
      g.restore()
    }
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    g.beginPath()
    g.arc(Math.cos(a) * 482, Math.sin(a) * 482, 7, 0, Math.PI * 2)
    g.fillStyle = '#facc15'
    g.fill()
  }
  g.beginPath()
  g.arc(0, 0, 60, 0, Math.PI * 2)
  g.fillStyle = '#facc15'
  g.fill()
  g.beginPath()
  g.arc(0, 0, 30, 0, Math.PI * 2)
  g.fillStyle = '#e11d74'
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
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
