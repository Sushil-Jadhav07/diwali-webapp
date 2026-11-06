import { Vector3 } from 'three'
import { START } from '../world/layout.js'

// Where the child starts (in front of the Cracker Ground, facing north).
export const HOME = new Vector3(START.x, 0, START.z)

// Mutable, per-frame shared state between the child, crackers and camera.
// Never put this in React state; it is read and written inside useFrame.
export const rig = {
  pos: HOME.clone(),
  yaw: Math.PI, // facing -Z
  handR: null, // Object3D attached to the right hand (sparkler holder)
  stickTip: null, // Object3D at the tip of the incense stick
  focusMode: 'child', // 'child' | 'cracker' | 'sky'
  focusPoint: new Vector3(0, 0, 0), // cracker spot when focusMode !== 'child'
}

// Seeded RNG for deterministic scenery layout.
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))

// Dev-only handle for automated verification scripts.
if (import.meta.env?.DEV && typeof window !== 'undefined') window.__rig = rig
