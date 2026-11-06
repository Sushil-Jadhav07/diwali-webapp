import * as THREE from 'three'

// Shared scenery layout (mandir, rangoli, boundary wall, gate, lamps).
// Keep-clear zones: |x| < 3.2 for z in [-4.2, 4.8] (child path + cracker spots);
// residents zone |x| in [4.5, 8.8], z in [-6.5, 7.6] (only the mandir + tree there).

export const MANDIR = { x: -6.3, z: -5.4, rot: 0.85 } // faces the courtyard centre

// World point from mandir-local coordinates (local +Z = temple front).
export function mandirPoint(lx, ly, lz, out = new THREE.Vector3()) {
  const c = Math.cos(MANDIR.rot)
  const s = Math.sin(MANDIR.rot)
  return out.set(MANDIR.x + lx * c + lz * s, ly, MANDIR.z - lx * s + lz * c)
}

// Diyas on the mandir steps, plinth edge and porch floor (local coords).
export const MANDIR_DIYAS = [
  [-0.4, 0.15, 1.03],
  [0.4, 0.15, 1.03],
  [-0.4, 0.3, 0.81],
  [0.4, 0.3, 0.81],
  [-0.86, 0.45, 0.6],
  [0.86, 0.45, 0.6],
  [-1.08, 0.45, 0.6],
  [1.08, 0.45, 0.6],
  [-1.08, 0.45, -1.15],
  [1.08, 0.45, -1.15],
  [-0.26, 0.45, 0.34],
  [0.26, 0.45, 0.34],
]
export const MANDIR_KALASH_TIP = [0, 4.62, -0.55] // local
export const MANDIR_PLINTH_CORNERS = [
  [-1.2, 0.45, 0.7],
  [1.2, 0.45, 0.7],
  [-1.2, 0.45, -1.3],
  [1.2, 0.45, -1.3],
]

export const RANGOLI_MAIN = { x: 0, z: -5.75, r: 1.85 }
export const RANGOLI_SMALL = { x: 3.4, z: 3.6, r: 0.9 }

// Boundary wall along the front (z = WALL.z) with a centred gate opening.
export const WALL = { z: 12.5, h: 1.8, t: 0.26, xMax: 15.6, gateX: 2.35, pillarHalf: 0.36 }
export const GATE = { pillarH: 3.0, archR: 2.35, archTube: 0.13 }

// Points along the gate arch (semicircle from left pillar top to right pillar top).
export function gateArchPoints(n, lift = 0, out = []) {
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI
    out.push(new THREE.Vector3(Math.cos(a) * GATE.archR, GATE.pillarH + Math.sin(a) * GATE.archR * 0.55 + lift, WALL.z - 0.05))
  }
  return out
}

// Lamp posts: along x = +/-9 and on the gate pillars.
export const LAMP_POSTS = [-6.6, -1.2, 4.4, 9.6].flatMap((z) => [
  { x: -9.0, z, dir: 1 },
  { x: 9.0, z, dir: -1 },
])
export const LAMP_H = 4.1

// Parking strip (z in [8.2, 11.8]), keep the gate path |x| < 2.5 clear.
export const PARKING_Z = 10.9
