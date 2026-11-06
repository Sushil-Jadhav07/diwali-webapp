// ---------------------------------------------------------------------------
// Aerial burst pattern library. Every pattern emits into the shared fx pools.
// burst(kind, p, o):
//   p  = {x, y, z} burst centre
//   o  = { colors: [hue names], scale, cam (THREE.Camera), later(delay, fn),
//          colorEnd: [hue names] (colour-changing stars), count (multiplier) }
// The particle budget scales counts down automatically when the pool is busy.
// ---------------------------------------------------------------------------
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { COLORS } from './common'

const D = [0, 0, 0]
const _r = new THREE.Vector3()
const _u = new THREE.Vector3()
const _f = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

const C = (name) => COLORS[name] || COLORS.gold
const pick = (arr) => arr[(Math.random() * arr.length) | 0]

// fewer sparks when the shared pool is already busy (player + NPC crackers)
export function budget() {
  if (!fx.ready) return 1
  const load = fx.sparks.alive / fx.sparks.n
  return Math.max(0.35, 1 - Math.max(0, load - 0.35) * 1.3) * (fx.tierScale ?? 1)
}

// camera-facing plane basis for planar patterns (heart, spiral, peacock, text)
function faceBasis(p, cam) {
  if (cam) _f.set(cam.position.x - p.x, cam.position.y - p.y, cam.position.z - p.z).normalize()
  else _f.set(0, -0.5, 1).normalize()
  _r.crossVectors(UP, _f).normalize()
  _u.crossVectors(_f, _r)
}

function star(p, vx, vy, vz, life, col, size, drag, grav, trail, tw = 0, end = null) {
  const i = fx.spark(p.x, p.y, p.z, vx, vy, vz, life, col[0], col[1], col[2], size, drag, grav, trail, tw)
  if (end) fx.sparkEnd(i, end[0], end[1], end[2])
  return i
}

const sphere = (p, o, n, spMin, spMax, life, size, drag, grav, trail, tw, colFn) => {
  for (let i = 0; i < n; i++) {
    randDir(D)
    const sp = rand(spMin, spMax) * o.scale
    const col = colFn(i)
    const end = o.colorEnd ? C(pick(o.colorEnd)) : null
    star(p, D[0] * sp, D[1] * sp, D[2] * sp, rand(life[0], life[1]), col, size, drag, grav, trail, tw && Math.random() < tw ? 1 : 0, end)
  }
}

const PATTERNS = {
  peony(p, o, n) {
    const cs = o.colors.map(C)
    sphere(p, o, n(420), 8.5, 10, [1.4, 2.1], 0.14, 1.3, 0.5, 0.08, 0, (i) => cs[i % cs.length])
  },
  chrysanthemum(p, o, n) {
    const cs = o.colors.map(C)
    sphere(p, o, n(480), 9.5, 11.5, [1.8, 2.5], 0.12, 1.15, 0.45, 0.17, 0.3, (i) => cs[i % cs.length])
  },
  willow(p, o, n) {
    sphere(p, o, n(320), 5, 7.2, [3.0, 3.8], 0.09, 1.75, 0.26, 0.19, 0.2, () => [2.3, 1.25, 0.32])
  },
  palm(p, o, n) {
    const fronds = 7
    const per = Math.round(n(300) / fronds)
    const hue = C(o.colors[0])
    for (let f = 0; f < fronds; f++) {
      const a = (f / fronds) * Math.PI * 2
      const el = rand(0.25, 0.75)
      const dx = Math.cos(a) * Math.cos(el)
      const dy = Math.sin(el)
      const dz = Math.sin(a) * Math.cos(el)
      for (let k = 0; k < per; k++) {
        const sp = rand(3.5, 11.5) * o.scale
        const col = k % 3 ? [2.6, 1.5, 0.4] : hue
        star(p, dx * sp + rand(-0.3, 0.3), dy * sp + rand(-0.3, 0.3), dz * sp + rand(-0.3, 0.3), rand(1.6, 2.3), col, 0.13, 1.0, 0.55, 0.13)
      }
    }
  },
  ring(p, o, n) {
    _q.setFromUnitVectors(UP, _v.set(rand(-0.5, 0.5), 1, rand(-0.3, 0.3)).normalize())
    const N = n(200)
    const col = C(o.colors[0])
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      _v.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(_q)
      const sp = 11 * o.scale
      star(p, _v.x * sp, _v.y * sp, _v.z * sp, rand(1.6, 2.0), col, 0.15, 1.2, 0.45, 0.09)
    }
  },
  doubleRing(p, o, n) {
    const N = n(170)
    for (let r = 0; r < 2; r++) {
      _q.setFromUnitVectors(UP, _v.set(r ? 0.8 : -0.8, 1, rand(-0.2, 0.2)).normalize())
      const col = C(o.colors[r % o.colors.length])
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2
        _v.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(_q)
        const sp = (r ? 8.5 : 11.5) * o.scale
        star(p, _v.x * sp, _v.y * sp, _v.z * sp, rand(1.6, 2.0), col, 0.14, 1.2, 0.45, 0.09)
      }
    }
  },
  spiral(p, o, n) {
    faceBasis(p, o.cam)
    const arms = 5
    const per = Math.round(n(320) / arms)
    for (let a = 0; a < arms; a++) {
      const col = C(o.colors[a % o.colors.length])
      for (let k = 0; k < per; k++) {
        const t = k / per
        const ang = (a / arms) * Math.PI * 2 + t * 3.2
        const sp = (2.5 + t * 9) * o.scale
        const cx = Math.cos(ang) * sp
        const cy = Math.sin(ang) * sp
        star(p, _r.x * cx + _u.x * cy, _r.y * cx + _u.y * cy, _r.z * cx + _u.z * cy, rand(1.5, 1.9), col, 0.13, 1.3, 0.3, 0.07)
      }
    }
  },
  heart(p, o, n) {
    faceBasis(p, o.cam)
    const N = n(220)
    const col = C(o.colors[0] || 'pink')
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2
      const hx = 16 * Math.sin(t) ** 3
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      const k = 0.62 * o.scale
      const cx = hx * k
      const cy = hy * k
      star(p, _r.x * cx + _u.x * cy, _r.y * cx + _u.y * cy, _r.z * cx + _u.z * cy, rand(1.9, 2.3), col, 0.15, 1.6, 0.12, 0.05)
    }
  },
  crossette(p, o, n) {
    const N = Math.max(6, Math.round(n(12)))
    const cs = o.colors.map(C)
    const leads = []
    for (let i = 0; i < N; i++) {
      randDir(D)
      const sp = 9 * o.scale
      leads.push(star(p, D[0] * sp, D[1] * sp * 0.8 + 1, D[2] * sp, 0.75, [3, 2.6, 2], 0.24, 1.0, 0.4, 0.1))
    }
    o.later?.(0.6, () => {
      const pos = fx.sparks.pos
      for (let j = 0; j < leads.length; j++) {
        const i3 = leads[j] * 3
        const q = { x: pos[i3], y: pos[i3 + 1], z: pos[i3 + 2] }
        const col = cs[j % cs.length]
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + j
          star(q, Math.cos(a) * 6, rand(-1, 1), Math.sin(a) * 6, rand(0.9, 1.2), col, 0.13, 1.2, 0.5, 0.1)
        }
      }
    })
  },
  horsetail(p, o, n) {
    const N = n(260)
    for (let i = 0; i < N; i++) {
      randDir(D)
      const sp = rand(2.5, 5) * o.scale
      star(p, D[0] * sp, Math.abs(D[1]) * sp * 0.8, D[2] * sp, rand(2.4, 3.2), [2.6, 1.6, 0.5], 0.1, 0.35, 1.15, 0.22, Math.random() < 0.3 ? 1 : 0)
    }
  },
  strobe(p, o, n) {
    sphere(p, o, n(180), 4.5, 7, [2.2, 3.0], 0.16, 1.4, 0.25, 0.02, 1, () => [3, 3, 3.2])
  },
  crackle(p, o, n) {
    sphere(p, o, n(220), 7, 9, [0.9, 1.2], 0.11, 1.4, 0.5, 0.07, 0, () => [2.6, 1.6, 0.5])
    const R = 8 * o.scale
    o.later?.(0.95, () => crackleField(p, R, n(140), 1.6, o))
  },
  pistil(p, o, n) {
    const col = C(o.colors[1] || 'silver')
    sphere(p, o, n(150), 3, 4.2, [1.1, 1.4], 0.12, 1.3, 0.4, 0.04, 0.2, () => col)
  },
  peacock(p, o, n) {
    // fan of feathers in a camera-facing plane, each ending in an "eye"
    faceBasis(p, o.cam)
    const F = 7
    const per = Math.round(n(320) / F)
    for (let f = 0; f < F; f++) {
      const ang = Math.PI / 2 + (f / (F - 1) - 0.5) * 2.2
      const dx = Math.cos(ang)
      const dy = Math.sin(ang)
      for (let k = 0; k < per; k++) {
        const sp = (2 + (k / per) * 10) * o.scale
        const col = k / per > 0.85 ? C('blue') : k % 2 ? [2.2, 1.4, 0.4] : C('green')
        const vx = dx * sp + rand(-0.25, 0.25)
        const vy = dy * sp + rand(-0.25, 0.25)
        star(p, _r.x * vx + _u.x * vy, _r.y * vx + _u.y * vy, _r.z * vx + _u.z * vy, rand(1.7, 2.1), col, 0.12, 1.25, 0.32, 0.07)
      }
      // the eye: a small ring at the feather tip
      const tip = 12 * o.scale
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2
        const vx = dx * tip + Math.cos(a) * 1.4
        const vy = dy * tip + Math.sin(a) * 1.4
        star(p, _r.x * vx + _u.x * vy, _r.y * vx + _u.y * vy, _r.z * vx + _u.z * vy, 1.9, k % 2 ? C('cyan') : C('violet'), 0.15, 1.25, 0.32, 0.03)
      }
    }
  },
  thunder(p, o) {
    // blinding white flash + an expanding shockwave ring in the sky (no colour)
    for (let i = 0; i < 30; i++) {
      randDir(D)
      star(p, D[0] * 2, D[1] * 2, D[2] * 2, 0.12, [9, 9, 9], 1.4, 3, 0, 0)
    }
    faceBasis(p, o.cam)
    for (let i = 0; i < 140; i++) {
      const a = (i / 140) * Math.PI * 2
      const vx = Math.cos(a) * 22
      const vy = Math.sin(a) * 22
      star(p, _r.x * vx + _u.x * vy, _r.y * vx + _u.y * vy, _r.z * vx + _u.z * vy, 0.45, [3, 3, 3.2], 0.22, 3.2, 0, 0.04)
    }
    for (let i = 0; i < 12; i++) fx.puff(p.x + rand(-1.5, 1.5), p.y + rand(-1.5, 1.5), p.z + rand(-1.5, 1.5), 0, 0, 0, 5, 2.6, 1.0, 0.14)
  },
  bangs(p, o) {
    // a sound shell: hard white flash, a few sparks, smoke
    for (let i = 0; i < 24; i++) {
      randDir(D)
      star(p, D[0] * 4, D[1] * 4, D[2] * 4, 0.18, [7, 7, 6.5], 0.6, 3, 0, 0.02)
    }
    for (let i = 0; i < 6; i++) fx.puff(p.x + rand(-0.6, 0.6), p.y + rand(-0.6, 0.6), p.z + rand(-0.6, 0.6), 0, 0, 0, 4, 1.4, 1.0, 0.12)
  },
  glitterPalm(p, o, n) {
    // small glittering palm used at the top of comets (Aakash Tara, Starfire)
    sphere(p, o, n(90), 3, 5, [1.2, 1.8], 0.1, 1.2, 0.6, 0.12, 1, () => [2.8, 2.2, 1.2])
  },
  none() {},
}

// Delayed glittering pops across a sphere (crackle / finale tails).
export function crackleField(p, R, count, duration, o) {
  for (let k = 0; k < count; k++) {
    o.later?.(Math.random() * duration, () => {
      randDir(D)
      const r = rand(0.3, 1) * R
      const q = { x: p.x + D[0] * r, y: p.y + D[1] * r - 1.5, z: p.z + D[2] * r }
      for (let j = 0; j < 3; j++) {
        randDir(D)
        star(q, D[0] * 2.2, D[1] * 2.2, D[2] * 2.2, rand(0.06, 0.14), [6, 5.6, 4.5], 0.2, 2, 0, 0.03)
      }
    })
  }
}

export const PATTERN_NAMES = Object.keys(PATTERNS)

export function burst(kind, p, o = {}) {
  const opts = { colors: ['gold'], scale: 1, ...o }
  const k = budget() * (opts.count ?? 1)
  const n = (base) => Math.max(8, Math.round(base * k))
  ;(PATTERNS[kind] || PATTERNS.peony)(p, opts, n)
}
