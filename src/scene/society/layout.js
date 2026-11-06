import * as THREE from 'three'
import * as W from '../../world/layout.js'

// Shared scenery layout (mandir, rangoli, boundary wall, gate, lamps).
// Keep-clear zones: |x| < 3.2 for z in [-4.2, 4.8] (child path + cracker spots);
// residents zone |x| in [4.5, 8.8], z in [-6.5, 7.6] (only the mandir + tree there).

export const MANDIR = W.MANDIR // faces the Cracker Ground (world/layout.js)

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

export const RANGOLI_MAIN = W.RANGOLI_MAIN
export const RANGOLI_SMALL = W.RANGOLI_SMALL

// Boundary wall along the front (z = WALL.z) with a centred gate opening.
export const WALL = { z: W.WORLD.maxZ, h: W.WALL_H, t: W.WALL_T, xMax: W.WORLD.maxX, gateX: W.GATE.halfW + 0.36, pillarHalf: 0.36 }
export const GATE = { pillarH: W.GATE.pillarH, archR: W.GATE.halfW + 0.36, archTube: 0.14 }

// Points along the gate arch (semicircle from left pillar top to right pillar top).
export function gateArchPoints(n, lift = 0, out = []) {
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI
    out.push(new THREE.Vector3(Math.cos(a) * GATE.archR, GATE.pillarH + Math.sin(a) * GATE.archR * 0.55 + lift, WALL.z - 0.05))
  }
  return out
}

export const LAMP_POSTS = W.LAMP_POSTS
export const LAMP_H = W.LAMP_H
