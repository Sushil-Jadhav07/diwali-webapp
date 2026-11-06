import { forwardRef, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { audio } from '../audio/audio'
import { glowTexture } from '../scene/textures'

const _d = [0, 0, 0]

// Fuse: a tiny fizz of orange sparks and smoke at (x, y, z).
export function emitFuse(acc, dt, x, y, z) {
  acc.v += dt * 80
  while (acc.v >= 1) {
    acc.v -= 1
    randDir(_d)
    const s = rand(0.6, 1.6)
    fx.spark(x, y, z, _d[0] * s, Math.abs(_d[1]) * s + 0.6, _d[2] * s, rand(0.12, 0.35), 3, 1.3, 0.35, 0.025, 2, 0.5, 0.02)
  }
  if (Math.random() < dt * 10) fx.puff(x, y + 0.02, z, rand(-0.05, 0.05), 0.25, rand(-0.05, 0.05), 1.4, 0.06, 1.2, 0.18)
}

// Firework colour palette (HDR, >1 for bloom).
export const COLORS = {
  gold: [2.6, 1.5, 0.45],
  silver: [2.2, 2.2, 2.5],
  red: [3.0, 0.35, 0.3],
  green: [0.5, 2.8, 0.6],
  blue: [0.5, 0.9, 3.2],
  pink: [2.8, 0.6, 2.0],
  cyan: [0.5, 2.4, 2.8],
  orange: [3.0, 1.0, 0.25],
  violet: [1.6, 0.6, 3.0],
}
export const BURST_HUES = ['red', 'green', 'blue', 'pink', 'gold', 'cyan', 'violet', 'orange']
export const lightColor = (c) => new THREE.Color(Math.min(1, c[0] / 3), Math.min(1, c[1] / 3), Math.min(1, c[2] / 3))

// Owns sound ids and a pooled light for one cracker; cleans up on unmount.
export function useCrackerResources() {
  const res = useMemo(() => ({ sounds: [], light: null, acc: { v: 0 }, acc2: { v: 0 }, acc3: { v: 0 }, flags: {} }), [])
  useEffect(
    () => () => {
      for (const [name, id] of res.sounds) audio.stop(name, id)
      res.sounds.length = 0
      if (res.light) fx.releaseLight(res.light)
      res.light = null
    },
    [res],
  )
  res.play = (name, opts) => {
    const id = audio.play(name, opts)
    if (id != null) res.sounds.push([name, id])
    return id
  }
  // stop (or fade out) every playing instance of a sound owned by this cracker
  res.stop = (name, fadeMs = 0) => {
    for (let i = res.sounds.length - 1; i >= 0; i--) {
      const [n, id] = res.sounds[i]
      if (n !== name) continue
      if (fadeMs > 0) audio.fadeOut(n, id, fadeMs)
      else audio.stop(n, id)
      res.sounds.splice(i, 1)
    }
  }
  res.getLight = () => {
    if (!res.light) res.light = fx.acquireLight(res)
    return res.light
  }
  res.dropLight = () => {
    if (res.light) fx.releaseLight(res.light)
    res.light = null
  }
  return res
}

// Additive glowing pool of light on the ground under a cracker.
export const GroundGlow = forwardRef(function GroundGlow({ radius = 1.4, color = '#ffa040' }, ref) {
  const tex = glowTexture()
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={3}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
})

export function useLitTime() {
  return useRef({ v: -1 })
}

export const MAT = {
  burnt: new THREE.MeshStandardMaterial({ color: '#1b1612', roughness: 1 }),
  fuse: new THREE.MeshStandardMaterial({ color: '#2f6b2a', roughness: 0.8 }),
  gold: new THREE.MeshStandardMaterial({ color: '#e7b341', roughness: 0.35, metalness: 0.6 }),
  clay: new THREE.MeshStandardMaterial({ color: '#8a4a24', roughness: 0.9 }),
}
