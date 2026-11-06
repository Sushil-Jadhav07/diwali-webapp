// ---------------------------------------------------------------------------
// Player input singleton: keyboard (WASD / arrows, Shift = run, E = interact),
// on-screen joystick, and click-to-move / auto-walk navigation targets.
// Read every frame by the child; never stored in React state.
// ---------------------------------------------------------------------------
import { findPath } from './collision.js'

export const input = {
  keys: new Set(),
  joy: { x: 0, y: 0, active: false }, // y up = forward
  runToggle: false, // mobile run button
  nav: null, // { path: [{x,z}], i, label }
  interactAt: 0, // time of the last E / tap interaction (performance.now)
  cameraTouchedAt: 0, // last time the user orbited/zoomed
}

const KEYMAP = {
  KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b',
  KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r',
  ShiftLeft: 'run', ShiftRight: 'run',
}

let bound = false
export function bindKeyboard() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const typing = (e) => /input|textarea|select/i.test(e.target?.tagName || '')
  window.addEventListener('keydown', (e) => {
    if (typing(e)) return
    const k = KEYMAP[e.code]
    if (k) {
      input.keys.add(k)
      if (k !== 'run') input.nav = null // manual control cancels auto-walk
      if (e.code.startsWith('Arrow')) e.preventDefault()
    }
    if (e.code === 'KeyE') input.interactAt = performance.now()
  })
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code]
    if (k) input.keys.delete(k)
  })
  window.addEventListener('blur', () => input.keys.clear())
}

// Desired move direction in world XZ (camera-relative). Returns magnitude 0..1.
export function moveIntent(camYaw, out) {
  let f = 0
  let s = 0
  if (input.keys.has('f')) f += 1
  if (input.keys.has('b')) f -= 1
  if (input.keys.has('r')) s += 1
  if (input.keys.has('l')) s -= 1
  if (input.joy.active) {
    f += input.joy.y
    s += input.joy.x
  }
  const mag = Math.min(1, Math.hypot(f, s))
  if (mag < 0.08) {
    out.x = 0
    out.z = 0
    return 0
  }
  // camera forward on the ground plane: (sin(yaw), cos(yaw)) points away from the camera
  const fx = Math.sin(camYaw)
  const fz = Math.cos(camYaw)
  const rx = -fz
  const rz = fx
  const x = fx * f + rx * s
  const z = fz * f + rz * s
  const L = Math.hypot(x, z) || 1
  out.x = x / L
  out.z = z / L
  return mag
}

export const wantsRun = () => input.keys.has('run') || input.runToggle

// Start auto-walking to (x, z) from (fx, fz). Returns false if unreachable.
export function navTo(fx, fz, x, z, label = null) {
  const path = findPath(fx, fz, x, z)
  if (!path || !path.length) return false
  input.nav = { path, i: 0, label }
  return true
}
