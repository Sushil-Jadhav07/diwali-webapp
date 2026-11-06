// ---------------------------------------------------------------------------
// Firework safety: live danger zones + placement / retreat validation.
// Plain JS (unit-tested). Used by the player's sequence and by NPC events.
// ---------------------------------------------------------------------------
import { NO_PLACE } from './layout.js'
import { clearance, isFree, AGENT_R } from './collision.js'

// Live positions of residents / NPCs ({x, z}); written by the NPC systems.
export const LIVE_PEOPLE = []

// Active danger zones: { id, x, z, r, owner }
export const dangerZones = []

export function addDanger(id, x, z, r, owner = 'player') {
  removeDanger(id)
  dangerZones.push({ id, x, z, r, owner })
}
export function removeDanger(id) {
  for (let i = dangerZones.length - 1; i >= 0; i--) if (dangerZones[i].id === id) dangerZones.splice(i, 1)
}
export function clearDanger(owner = null) {
  for (let i = dangerZones.length - 1; i >= 0; i--) if (!owner || dangerZones[i].owner === owner) dangerZones.splice(i, 1)
}

// Default safety radius per category (metres).
export const DANGER_R = { handheld: 1.3, toy: 1.1, ground: 3.0, sky: 4.0, sound: 5.0 }
// Clearance from buildings/obstacles needed for a launch spot.
const NEED_CLEAR = { handheld: 0.8, toy: 0.6, ground: 1.6, sky: 3.0, sound: 2.2 }

const inNoPlace = (x, z) => {
  for (const c of NO_PLACE.circles) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return 'decor'
  for (const b of NO_PLACE.boxes) if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return 'busy'
  return null
}

// Why (x, z) is not a valid launch spot, or null if it is.
// people: array of {x, z}; ignore: a danger-zone id to ignore.
export function spotProblem(x, z, category, people = [], ignore = null) {
  if (!isFree(x, z, 0.35)) return 'blocked'
  if (clearance(x, z) < (NEED_CLEAR[category] ?? 1.6)) return 'near-building'
  const np = inNoPlace(x, z)
  if (np) return np
  const myR = DANGER_R[category] ?? 3
  for (const d of dangerZones) {
    if (d.id === ignore) continue
    if (Math.hypot(x - d.x, z - d.z) < d.r + myR * 0.6) return 'other-cracker'
  }
  const keep = Math.max(1.2, myR * 0.8)
  for (const p of people) if (Math.hypot(x - p.x, z - p.z) < keep) return 'people'
  return null
}

export const HINTS = {
  blocked: 'That spot is blocked, so Aarav picked a clear spot nearby.',
  'near-building': 'Too close to a building, so Aarav moved to a more open spot.',
  decor: 'Not on the rangoli or near the mandir, so Aarav moved to a safer spot.',
  busy: 'Too crowded here, so Aarav moved to a safer open spot.',
  'other-cracker': 'Another cracker is burning there, so Aarav moved away from it.',
  people: 'Too close to people, so Aarav moved to a safer spot.',
  none: 'No safe open spot nearby. Walk to the Cracker Ground and try again.',
}

// Find where to put a cracker: desired spot is `ahead` metres in front of
// (x, z, yaw). Returns { x, z, moved, reason } or null if nothing is valid.
export function findPlacement(x, z, yaw, category, people = [], ahead = 1.6) {
  const held = category === 'handheld' || category === 'toy'
  const dx = held ? 0 : Math.sin(yaw) * ahead
  const dz = held ? 0 : Math.cos(yaw) * ahead
  const wx = x + dx
  const wz = z + dz
  const why = spotProblem(wx, wz, category, people)
  if (!why) return { x: wx, z: wz, moved: false, reason: null }
  for (let rad = 0.5; rad <= 22; rad += 0.5) {
    const n = Math.max(10, Math.round((rad * Math.PI * 2) / 0.6))
    let best = null
    let bestD = Infinity
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const px = wx + Math.cos(a) * rad
      const pz = wz + Math.sin(a) * rad
      if (spotProblem(px, pz, category, people)) continue
      // prefer spots closer to the child
      const d = Math.hypot(px - x, pz - z)
      if (d < bestD) {
        bestD = d
        best = { x: px, z: pz }
      }
    }
    if (best) return { ...best, moved: true, reason: why }
  }
  return null
}

// A safe point to watch from: at least (r + 1) from the spot, preferring the
// direction the child came from. Returns {x, z}.
export function findRetreat(spot, from, r) {
  let ux = from.x - spot.x
  let uz = from.z - spot.z
  const L = Math.hypot(ux, uz)
  if (L < 1e-3) {
    ux = 0
    uz = 1
  } else {
    ux /= L
    uz /= L
  }
  const dist = r + 1.2
  const base = Math.atan2(uz, ux)
  for (let k = 0; k < 16; k++) {
    // alternate either side of the preferred direction
    const off = (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.35
    for (const extra of [0, 0.8, 1.6]) {
      const a = base + off
      const px = spot.x + Math.cos(a) * (dist + extra)
      const pz = spot.z + Math.sin(a) * (dist + extra)
      if (isFree(px, pz, AGENT_R + 0.1) && clearance(px, pz) > 0.5) return { x: px, z: pz }
    }
  }
  return { x: spot.x + ux * dist, z: spot.z + uz * dist }
}

// Soft barrier: push a walker out of every danger zone except `ignore`.
export function pushOutOfDanger(p, r = AGENT_R, ignore = null) {
  for (const d of dangerZones) {
    if (d.id === ignore) continue
    const dx = p.x - d.x
    const dz = p.z - d.z
    const rr = d.r + r
    const d2 = dx * dx + dz * dz
    if (d2 < rr * rr) {
      const dd = Math.sqrt(d2) || 1e-4
      p.x = d.x + (dx / dd) * rr
      p.z = d.z + (dz / dd) * rr
    }
  }
  return p
}
