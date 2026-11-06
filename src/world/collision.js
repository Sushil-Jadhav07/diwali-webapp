// ---------------------------------------------------------------------------
// Cheap world collision + navigation (plain JS, unit-tested).
// Static colliders come from layout.js: AABB boxes and circles (with heights
// for the camera test). Agents are circles in the XZ plane.
// ---------------------------------------------------------------------------
import { COLLIDERS, WORLD } from './layout.js'

export const AGENT_R = 0.32
const BOXES = COLLIDERS.boxes
const CIRCLES = COLLIDERS.circles

// Keep a circle of radius r inside the boundary wall.
export function clampToBounds(p, r = AGENT_R) {
  if (p.x < WORLD.minX + r) p.x = WORLD.minX + r
  if (p.x > WORLD.maxX - r) p.x = WORLD.maxX - r
  if (p.z < WORLD.minZ + r) p.z = WORLD.minZ + r
  if (p.z > WORLD.maxZ - r) p.z = WORLD.maxZ - r
  return p
}

function pushOutBox(p, r, b) {
  const qx = Math.max(b.minX, Math.min(p.x, b.maxX))
  const qz = Math.max(b.minZ, Math.min(p.z, b.maxZ))
  let dx = p.x - qx
  let dz = p.z - qz
  const d2 = dx * dx + dz * dz
  if (d2 >= r * r) return false
  if (d2 > 1e-10) {
    const d = Math.sqrt(d2)
    p.x = qx + (dx / d) * r
    p.z = qz + (dz / d) * r
  } else {
    // centre is inside the box: leave through the nearest side
    const l = p.x - b.minX
    const rr = b.maxX - p.x
    const t = p.z - b.minZ
    const bt = b.maxZ - p.z
    const m = Math.min(l, rr, t, bt)
    if (m === l) p.x = b.minX - r
    else if (m === rr) p.x = b.maxX + r
    else if (m === t) p.z = b.minZ - r
    else p.z = b.maxZ + r
  }
  return true
}

function pushOutCircle(p, r, c) {
  const dx = p.x - c.x
  const dz = p.z - c.z
  const rr = r + c.r
  const d2 = dx * dx + dz * dz
  if (d2 >= rr * rr) return false
  const d = Math.sqrt(d2) || 1e-6
  const nx = d2 > 1e-12 ? dx / d : 1
  const nz = d2 > 1e-12 ? dz / d : 0
  p.x = c.x + nx * rr
  p.z = c.z + nz * rr
  return true
}

// Resolve a moving circle against statics (+ optional extra circles such as
// danger zones). Mutates and returns p. Two passes handle corners.
export function resolveCircle(p, r = AGENT_R, extra = null) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < BOXES.length; i++) pushOutBox(p, r, BOXES[i])
    for (let i = 0; i < CIRCLES.length; i++) pushOutCircle(p, r, CIRCLES[i])
    if (extra) for (let i = 0; i < extra.length; i++) pushOutCircle(p, r, extra[i])
    clampToBounds(p, r)
  }
  return p
}

export function isFree(x, z, r = AGENT_R) {
  if (x < WORLD.minX + r || x > WORLD.maxX - r || z < WORLD.minZ + r || z > WORLD.maxZ - r) return false
  for (let i = 0; i < BOXES.length; i++) {
    const b = BOXES[i]
    const qx = Math.max(b.minX, Math.min(x, b.maxX))
    const qz = Math.max(b.minZ, Math.min(z, b.maxZ))
    if ((x - qx) ** 2 + (z - qz) ** 2 < r * r) return false
  }
  for (let i = 0; i < CIRCLES.length; i++) {
    const c = CIRCLES[i]
    if ((x - c.x) ** 2 + (z - c.z) ** 2 < (r + c.r) ** 2) return false
  }
  return true
}

// Distance from (x, z) to the nearest static obstacle surface or wall.
export function clearance(x, z) {
  let m = Math.min(x - WORLD.minX, WORLD.maxX - x, z - WORLD.minZ, WORLD.maxZ - z)
  for (const b of BOXES) {
    const qx = Math.max(b.minX, Math.min(x, b.maxX))
    const qz = Math.max(b.minZ, Math.min(z, b.maxZ))
    const inside = x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ
    m = Math.min(m, inside ? 0 : Math.hypot(x - qx, z - qz))
  }
  for (const c of CIRCLES) m = Math.min(m, Math.max(0, Math.hypot(x - c.x, z - c.z) - c.r))
  return m
}

export function lineClear(ax, az, bx, bz, r = AGENT_R) {
  const d = Math.hypot(bx - ax, bz - az)
  const n = Math.max(1, Math.ceil(d / 0.25))
  for (let i = 0; i <= n; i++) {
    const u = i / n
    if (!isFree(ax + (bx - ax) * u, az + (bz - az) * u, r)) return false
  }
  return true
}

// Nearest free point to (x, z) within maxR (spiral rings). Returns {x,z} or null.
export function nearestFree(x, z, r = AGENT_R, maxR = 12, test = null) {
  const ok = (px, pz) => isFree(px, pz, r) && (!test || test(px, pz))
  if (ok(x, z)) return { x, z }
  for (let rad = 0.4; rad <= maxR; rad += 0.4) {
    const n = Math.max(8, Math.round((rad * Math.PI * 2) / 0.4))
    let best = null
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const px = x + Math.cos(a) * rad
      const pz = z + Math.sin(a) * rad
      if (ok(px, pz)) {
        best = { x: px, z: pz }
        break
      }
    }
    if (best) return best
  }
  return null
}

// ---------- navigation grid + A* ----------
export const CELL = 0.5
const GW = Math.round((WORLD.maxX - WORLD.minX) / CELL)
const GH = Math.round((WORLD.maxZ - WORLD.minZ) / CELL)
let GRID = null

function grid() {
  if (GRID) return GRID
  GRID = new Uint8Array(GW * GH)
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const x = WORLD.minX + (i + 0.5) * CELL
      const z = WORLD.minZ + (j + 0.5) * CELL
      GRID[j * GW + i] = isFree(x, z, AGENT_R + 0.05) ? 1 : 0
    }
  }
  return GRID
}

const cellOf = (x, z) => [
  Math.max(0, Math.min(GW - 1, Math.floor((x - WORLD.minX) / CELL))),
  Math.max(0, Math.min(GH - 1, Math.floor((z - WORLD.minZ) / CELL))),
]
const centre = (i, j) => ({ x: WORLD.minX + (i + 0.5) * CELL, z: WORLD.minZ + (j + 0.5) * CELL })

// Binary min-heap of node indices keyed by f.
class Heap {
  constructor() {
    this.a = []
    this.f = []
  }
  push(n, f) {
    const a = this.a
    const F = this.f
    a.push(n)
    F.push(f)
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (F[p] <= F[i]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      ;[F[p], F[i]] = [F[i], F[p]]
      i = p
    }
  }
  pop() {
    const a = this.a
    const F = this.f
    const top = a[0]
    const ln = a.pop()
    const lf = F.pop()
    if (a.length) {
      a[0] = ln
      F[0] = lf
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < a.length && F[l] < F[m]) m = l
        if (r < a.length && F[r] < F[m]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        ;[F[m], F[i]] = [F[i], F[m]]
        i = m
      }
    }
    return top
  }
  get size() {
    return this.a.length
  }
}

// Path from (sx, sz) to (tx, tz) as smoothed waypoints [{x,z}, ...] (excluding
// the start), or null if unreachable. An unwalkable target snaps to the
// nearest walkable point.
export function findPath(sx, sz, tx, tz) {
  const G = grid()
  const goalP = isFree(tx, tz) ? { x: tx, z: tz } : nearestFree(tx, tz, AGENT_R + 0.05, 10)
  if (!goalP) return null
  if (lineClear(sx, sz, goalP.x, goalP.z)) return [goalP]
  let [si, sj] = cellOf(sx, sz)
  const [gi, gj] = cellOf(goalP.x, goalP.z)
  if (!G[sj * GW + si]) {
    // start is not on a walkable cell (tight spot): use the nearest walkable cell
    let best = -1
    let bd = Infinity
    for (let dj = -8; dj <= 8; dj++)
      for (let di = -8; di <= 8; di++) {
        const ni = si + di
        const nj = sj + dj
        if (ni < 0 || nj < 0 || ni >= GW || nj >= GH || !G[nj * GW + ni]) continue
        const d = di * di + dj * dj
        if (d < bd) {
          bd = d
          best = nj * GW + ni
        }
      }
    if (best < 0) return null
    si = best % GW
    sj = (best - si) / GW
  }
  const N = GW * GH
  const g = new Float32Array(N).fill(Infinity)
  const from = new Int32Array(N).fill(-1)
  const closed = new Uint8Array(N)
  const start = sj * GW + si
  const goal = gj * GW + gi
  const h = (i, j) => {
    const dx = Math.abs(i - gi)
    const dz = Math.abs(j - gj)
    return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz)
  }
  const open = new Heap()
  g[start] = 0
  open.push(start, h(si, sj))
  let found = false
  let iter = 0
  while (open.size && iter++ < 60000) {
    const cur = open.pop()
    if (cur === goal) {
      found = true
      break
    }
    if (closed[cur]) continue
    closed[cur] = 1
    const ci = cur % GW
    const cj = (cur - ci) / GW
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue
        const ni = ci + di
        const nj = cj + dj
        if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue
        const nIdx = nj * GW + ni
        if (!G[nIdx] || closed[nIdx]) continue
        // no corner cutting
        if (di && dj && (!G[cj * GW + ni] || !G[nj * GW + ci])) continue
        const cost = g[cur] + (di && dj ? Math.SQRT2 : 1)
        if (cost < g[nIdx]) {
          g[nIdx] = cost
          from[nIdx] = cur
          open.push(nIdx, cost + h(ni, nj))
        }
      }
    }
  }
  if (!found) return null
  const cells = []
  for (let c = goal; c !== -1 && c !== start; c = from[c]) cells.push(c)
  cells.reverse()
  const pts = cells.map((c) => {
    const i = c % GW
    return centre(i, (c - i) / GW)
  })
  pts[pts.length - 1] = goalP
  // string-pull: skip waypoints while there is line of sight
  const out = []
  let ax = sx
  let az = sz
  let k = 0
  while (k < pts.length) {
    let far = k
    for (let m = pts.length - 1; m > k; m--) {
      if (lineClear(ax, az, pts[m].x, pts[m].z)) {
        far = m
        break
      }
    }
    out.push(pts[far])
    ax = pts[far].x
    az = pts[far].z
    k = far + 1
  }
  return out
}

// ---------- camera: first hit along a 3D segment ----------
// Returns t in [0, 1] (1 = nothing hit) for the segment a -> b against box
// colliders (with heights) and circle colliders (as vertical cylinders).
export function segmentHit(ax, ay, az, bx, by, bz, pad = 0.25) {
  let tMin = 1
  const dx = bx - ax
  const dy = by - ay
  const dz = bz - az
  for (const b of BOXES) {
    let t0 = 0
    let t1 = 1
    const lo = [b.minX - pad, -1, b.minZ - pad]
    const hi = [b.maxX + pad, b.h + pad, b.maxZ + pad]
    const o = [ax, ay, az]
    const d = [dx, dy, dz]
    let hit = true
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-9) {
        if (o[k] < lo[k] || o[k] > hi[k]) {
          hit = false
          break
        }
      } else {
        let ta = (lo[k] - o[k]) / d[k]
        let tb = (hi[k] - o[k]) / d[k]
        if (ta > tb) [ta, tb] = [tb, ta]
        t0 = Math.max(t0, ta)
        t1 = Math.min(t1, tb)
        if (t0 > t1) {
          hit = false
          break
        }
      }
    }
    if (hit && t0 < tMin) tMin = t0
  }
  for (const c of CIRCLES) {
    if (c.r < 0.5) continue // lamp posts etc. are too thin to matter
    const fx = ax - c.x
    const fz = az - c.z
    const A = dx * dx + dz * dz
    if (A < 1e-9) continue
    const B = 2 * (fx * dx + fz * dz)
    const C = fx * fx + fz * fz - (c.r + pad) ** 2
    const disc = B * B - 4 * A * C
    if (disc < 0) continue
    const t = (-B - Math.sqrt(disc)) / (2 * A)
    if (t >= 0 && t < tMin && ay + dy * t < c.h) tMin = t
  }
  // the outer wall: treat leaving the bounds as a hit
  for (const [lo, hi, o, d] of [
    [WORLD.minX + 0.3, WORLD.maxX - 0.3, ax, dx],
    [WORLD.minZ + 0.3, WORLD.maxZ - 0.3, az, dz],
  ]) {
    if (Math.abs(d) < 1e-9) continue
    const tl = (lo - o) / d
    const th = (hi - o) / d
    for (const t of [tl, th]) if (t > 0 && t < tMin) tMin = t
  }
  return Math.max(0, tMin)
}

export function _debugGrid() {
  return { G: grid(), GW, GH }
}
