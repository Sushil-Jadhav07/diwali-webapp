// ---------------------------------------------------------------------------
// Asynk Family Residency — the single source of truth for world positions.
// Plain JS (no three / React) so it can be unit-tested with node --test.
// Metres; +z is south (the gate side); y is up. Facades: local +z = outward.
// ---------------------------------------------------------------------------

export const SOCIETY_NAME = 'Asynk Family Residency'
export const SOCIETY_NAME_HI = 'असिंक फ़ैमिली रेज़िडेंसी'

// Inner faces of the boundary wall. The player can never leave this box.
export const WORLD = { minX: -36, maxX: 36, minZ: -30, maxZ: 30 }
export const WALL_H = 2.2
export const WALL_T = 0.4

export const START = { x: 0, z: 6, yaw: Math.PI } // facing north, towards the Cracker Ground

export const GATE = { x: 0, z: WORLD.maxZ, halfW: 3.2, pillarH: 3.4 }

// ---------- apartment blocks (expanded into facade segments for Houses.jsx) ----------
// facing: +x | -x | +z | -z (direction of the main facade)
export const BLOCKS = [
  { id: 'A', name: 'Block A', minX: -36, maxX: -25, minZ: -26, maxZ: 2, facing: '+x', floors: 4, color: '#e8b98a' },
  { id: 'B', name: 'Block B', minX: -18, maxX: 18, minZ: -30, maxZ: -21, facing: '+z', floors: 5, color: '#9cc6e8' },
  { id: 'C', name: 'Block C', minX: 25, maxX: 36, minZ: -26, maxZ: 2, facing: '-x', floors: 4, color: '#e59aa4' },
  { id: 'D', name: 'Block D', minX: 14, maxX: 36, minZ: 21, maxZ: 30, facing: '-z', floors: 4, color: '#e8cf7c' },
]

const ROT = { '+z': 0, '+x': Math.PI / 2, '-x': -Math.PI / 2, '-z': Math.PI }
const SEG_W = 5.6

// Facade segments in the {x, z, rot, w, d, floors, color, block} format used by Houses.jsx.
export const SEGMENTS = (() => {
  const out = []
  for (const b of BLOCKS) {
    const alongX = b.facing === '+z' || b.facing === '-z'
    const L = alongX ? b.maxX - b.minX : b.maxZ - b.minZ
    const D = alongX ? b.maxZ - b.minZ : b.maxX - b.minX
    const n = Math.max(1, Math.round(L / SEG_W))
    const w = L / n
    const cx = (b.minX + b.maxX) / 2
    const cz = (b.minZ + b.maxZ) / 2
    for (let i = 0; i < n; i++) {
      const t = (alongX ? b.minX : b.minZ) + w * (i + 0.5)
      // alternate a slightly lighter tone every other segment for rhythm
      out.push({
        x: alongX ? t : cx,
        z: alongX ? cz : t,
        rot: ROT[b.facing],
        w: w + 0.02,
        d: D,
        floors: b.floors,
        color: b.color,
        tone: i % 2,
        block: b.id,
      })
    }
  }
  return out
})()

// ---------- landmarks ----------
export const CRACKER_GROUND = { minX: -16, maxX: 16, minZ: -15, maxZ: 4 }
export const MANDIR = { x: 12.5, z: -16.5, rot: -0.83 } // faces the Cracker Ground
export const RANGOLI_MAIN = { x: -2, z: -17.6, r: 2.6 }
export const RANGOLI_SMALL = { x: 0, z: 22.6, r: 1.3 } // entrance rangoli
export const LAKSHMI = { x: -13, z: -18.6, rot: 0 }
export const WATER_TANK = { x: 31, z: 7, size: 3.2, h: 10 }
export const SECURITY_CABIN = { x: 6.2, z: 27.4, w: 2.6, d: 2.4, h: 2.8 }
export const MAIN_LANE = { minX: -3.5, maxX: 3.5, minZ: 8, maxZ: WORLD.maxZ }
export const CROSS_LANE = { minX: -25, maxX: 25, minZ: 5, maxZ: 9 }
export const BAZAAR = { minX: -32, maxX: -8, minZ: 12, maxZ: 26, laneZ: 19 }
export const PLAY_AREA = { minX: 12, maxX: 34, minZ: 6, maxZ: 18.5 }

// Bazaar stalls: front edge faces the lane.
export const STALLS = [
  { id: 'patakha', x: -29.4, z: 14.4, w: 4.8, d: 3.0, facing: '+z' },
  { id: 'mithai', x: -24.2, z: 14.4, w: 4.4, d: 2.8, facing: '+z' },
  { id: 'diya', x: -19.4, z: 14.4, w: 4.4, d: 2.8, facing: '+z' },
  { id: 'rangolicolours', x: -14.6, z: 14.4, w: 4.4, d: 2.8, facing: '+z' },
  { id: 'phool', x: -9.8, z: 14.4, w: 4.0, d: 2.8, facing: '+z' },
  { id: 'kandil', x: -28.2, z: 23.6, w: 4.4, d: 2.8, facing: '-z' },
  { id: 'gift', x: -22.6, z: 23.6, w: 4.4, d: 2.8, facing: '-z' },
  { id: 'chaat', x: -17.0, z: 23.6, w: 4.4, d: 2.8, facing: '-z' },
  { id: 'toys', x: -11.4, z: 23.6, w: 4.0, d: 2.8, facing: '-z' },
]

export const PLAY_ITEMS = [
  { id: 'swing', x: 16, z: 10.2, w: 4.2, d: 1.8, h: 2.6 },
  { id: 'slide', x: 21.5, z: 10.2, w: 1.2, d: 4.2, h: 2.2 },
  { id: 'seesaw', x: 26.5, z: 10.2, w: 4.2, d: 0.7, h: 0.8 },
  { id: 'sandpit', x: 31, z: 11.5, w: 3, d: 3, h: 0 }, // walkable, decorative
]
export const BENCHES = [
  { x: 15, z: 16.6, rot: Math.PI },
  { x: 20, z: 16.6, rot: Math.PI },
  { x: 25, z: 16.6, rot: Math.PI },
  { x: 30, z: 16.6, rot: Math.PI },
  { x: -18, z: -12.2, rot: 0 },
  { x: 18.5, z: -8, rot: -Math.PI / 2 },
]

export const TREES = [
  { x: 14, z: 14, s: 1 },
  { x: 19, z: 13.2, s: 0.9 },
  { x: 24, z: 14, s: 1.05 },
  { x: 29, z: 13.4, s: 0.95 },
  { x: 33, z: 8.6, s: 0.9 },
  { x: 33.2, z: 17, s: 1 },
  { x: -21, z: -4, s: 1.1 },
  { x: 21, z: -4, s: 1 },
  { x: -20.5, z: 8, s: 0.9 },
  { x: 9.5, z: 10.5, s: 0.85 },
  { x: -9.5, z: 27.6, s: 0.9 },
  { x: 11.5, z: 27.4, s: 0.9 },
]

export const PARKED_CARS = [
  { x: -6, z: 13, color: '#e8e6e1' },
  { x: -6, z: 18.6, color: '#b3202a' },
  { x: -6, z: 24.2, color: '#2d4f8a' },
  { x: 6, z: 13, color: '#8e959e' },
  { x: 6, z: 18.6, color: '#1f1f24' },
]
export const SCOOTERS = [
  { x: 14.6, z: 19.6, ry: 0.2, color: '#1f5fae' },
  { x: 15.7, z: 19.6, ry: 0.1, color: '#e8e6e1' },
  { x: 16.8, z: 19.6, ry: 0.25, color: '#c0392b' },
  { x: 9.2, z: 25.6, ry: -0.3, color: '#2c2c34' },
  { x: 10.3, z: 25.8, ry: -0.2, color: '#d4a017' },
]

export const LAMP_POSTS = [
  ...[11, 17, 23, 28].flatMap((z) => [
    { x: -4.3, z, dir: 1 },
    { x: 4.3, z, dir: -1 },
  ]),
  { x: -17, z: -16, dir: 1 },
  { x: 17, z: -16, dir: -1 },
  { x: -17, z: 4.6, dir: 1 },
  { x: 17, z: 4.6, dir: -1 },
  { x: -23.5, z: -10, dir: -1 },
  { x: 23.5, z: -10, dir: 1 },
  { x: -32.6, z: 19, dir: 1 },
  { x: -7.2, z: 19, dir: -1 },
  { x: 23, z: 19.8, dir: 1 },
]
export const LAMP_H = 4.4

// Bamboo festoon poles around the Cracker Ground (string-light anchors).
export const FESTOON_POLES = [
  { x: -16.6, z: -15.6 }, { x: 0, z: -15.6 }, { x: 16.6, z: -15.6 },
  { x: 16.6, z: -5.5 }, { x: 16.6, z: 4.6 }, { x: 6.5, z: 4.6 },
  { x: -16.6, z: 4.6 }, { x: -16.6, z: -5.5 },
]
export const FESTOON_H = 5.2

// Fast-travel / auto-walk destinations (the spot in front of each place).
export const PLACES = [
  { id: 'gate', name: 'Main Gate', hindi: 'मुख्य द्वार', x: 0, z: 25.5 },
  { id: 'ground', name: 'Cracker Ground', hindi: 'पटाखा मैदान', x: 0, z: -2 },
  { id: 'mandir', name: 'Mandir', hindi: 'मंदिर', x: 9.6, z: -12.6 },
  { id: 'rangoli', name: 'Rangoli', hindi: 'रंगोली', x: -2, z: -13.6 },
  { id: 'lakshmi', name: 'Lakshmi Puja', hindi: 'लक्ष्मी पूजा', x: -13, z: -15.9 },
  { id: 'bazaar', name: 'Diwali Bazaar', hindi: 'दिवाली बाज़ार', x: -19, z: 19 },
  { id: 'play', name: 'Play Area', hindi: 'खेल का मैदान', x: 22, z: 14.6 },
]

// ---------- colliders ----------
// boxes: { minX, maxX, minZ, maxZ, h }   circles: { x, z, r, h }
const box = (cx, cz, w, d, h, tag) => ({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, h, tag })

export const COLLIDERS = (() => {
  const boxes = []
  const circles = []
  for (const b of BLOCKS) boxes.push({ minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ, h: b.floors * 3 + 0.6, tag: 'block' })
  // closed, decorated main gate between the pillars
  boxes.push(box(GATE.x, GATE.z - 0.15, GATE.halfW * 2 + 1.2, 0.9, GATE.pillarH, 'gate'))
  boxes.push(box(SECURITY_CABIN.x, SECURITY_CABIN.z, SECURITY_CABIN.w, SECURITY_CABIN.d, SECURITY_CABIN.h, 'cabin'))
  boxes.push(box(WATER_TANK.x, WATER_TANK.z, WATER_TANK.size, WATER_TANK.size, WATER_TANK.h, 'tank'))
  boxes.push(box(LAKSHMI.x, LAKSHMI.z, 2.6, 1.6, 1.6, 'lakshmi'))
  for (const s of STALLS) {
    const alongX = s.facing === '+z' || s.facing === '-z'
    boxes.push(box(s.x, s.z, alongX ? s.w : s.d, alongX ? s.d : s.w, 3.2, 'stall'))
  }
  for (const p of PLAY_ITEMS) if (p.h > 0) boxes.push(box(p.x, p.z, p.w, p.d, p.h, 'play'))
  for (const c of PARKED_CARS) boxes.push(box(c.x, c.z, 1.9, 4.1, 1.5, 'car'))
  circles.push({ x: MANDIR.x, z: MANDIR.z, r: 2.4, h: 5, tag: 'mandir' })
  for (const t of TREES) circles.push({ x: t.x, z: t.z, r: 0.95 * t.s, h: 6, tag: 'tree' })
  for (const s of SCOOTERS) circles.push({ x: s.x, z: s.z, r: 0.55, h: 1.1, tag: 'scooter' })
  for (const b of BENCHES) circles.push({ x: b.x, z: b.z, r: 0.75, h: 0.9, tag: 'bench' })
  for (const l of LAMP_POSTS) circles.push({ x: l.x, z: l.z, r: 0.22, h: LAMP_H, tag: 'lamp' })
  for (const f of FESTOON_POLES) circles.push({ x: f.x, z: f.z, r: 0.2, h: FESTOON_H, tag: 'pole' })
  return { boxes, circles }
})()

// Walkable but cracker placement is not allowed here (decor, crowds, shops, play).
export const NO_PLACE = {
  circles: [
    { x: RANGOLI_MAIN.x, z: RANGOLI_MAIN.z, r: RANGOLI_MAIN.r + 0.8 },
    { x: RANGOLI_SMALL.x, z: RANGOLI_SMALL.z, r: RANGOLI_SMALL.r + 0.8 },
    { x: MANDIR.x, z: MANDIR.z, r: 4.2 },
    { x: LAKSHMI.x, z: LAKSHMI.z, r: 2.8 },
  ],
  boxes: [
    { minX: BAZAAR.minX - 1, maxX: BAZAAR.maxX + 1, minZ: BAZAAR.minZ - 1, maxZ: BAZAAR.maxZ + 1 },
    { minX: PLAY_AREA.minX - 1, maxX: PLAY_AREA.maxX + 1, minZ: PLAY_AREA.minZ - 1, maxZ: PLAY_AREA.maxZ + 1 },
    { minX: -9, maxX: 9, minZ: 21, maxZ: WORLD.maxZ }, // gate + parking + cabin
  ],
}
