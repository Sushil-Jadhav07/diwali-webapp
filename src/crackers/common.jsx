import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { audio } from '../audio/audio'
import { glowTexture } from '../scene/textures'
import { mulberry32 } from '../scene/shared'

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
// Allocation-free variant: writes into `out`.
export const setLightColor = (out, c) => out.setRGB(Math.min(1, c[0] / 3), Math.min(1, c[1] / 3), Math.min(1, c[2] / 3))

// Owns sound ids and a pooled light for one cracker; cleans up on unmount.
export function useCrackerResources() {
  const res = useMemo(() => ({ sounds: [], timers: [], light: null, acc: { v: 0 }, acc2: { v: 0 }, acc3: { v: 0 }, flags: {} }), [])
  useEffect(
    () => () => {
      for (const t of res.timers) clearTimeout(t)
      res.timers.length = 0
      for (const [name, id] of res.sounds) audio.stop(name, id)
      res.sounds.length = 0
      if (res.light) fx.releaseLight(res.light)
      res.light = null
    },
    [res],
  )
  // run fn after ms (cancelled automatically when the cracker unmounts / Clear)
  res.later = (ms, fn) => res.timers.push(setTimeout(fn, ms))
  // play a sound from a world position: delayed by distance (speed of sound,
  // so the flash comes first) plus a soft echo off the buildings
  res.playFar = (name, p, cam, { volume = 1, echo = true } = {}) => {
    const d = cam ? Math.hypot(cam.position.x - p.x, cam.position.y - p.y, cam.position.z - p.z) : 20
    const delay = Math.min(450, (d / 343) * 1000)
    const vol = volume * Math.max(0.35, Math.min(1, 28 / (d + 6)))
    res.later(delay, () => res.play(name, { volume: vol }))
    if (echo) res.later(delay + 260 + d * 4, () => res.play(name, { volume: vol * 0.28, rate: 0.9 }))
  }
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

// Standard fuse stage: hiss + fizz + a small warm light. Returns true while the
// fuse is still burning (tl = seconds since lit).
export function fuseStage(R, dt, tl, fuseDur, x, y, z, lightY = 0.3) {
  if (tl >= fuseDur) return false
  if (!R.flags.hiss) {
    R.flags.hiss = true
    R.play('hiss')
  }
  emitFuse(R.acc, dt, x, y, z)
  const l = R.getLight()
  if (l) {
    l.position.set(x, lightY, z)
    l.color.setRGB(1, 0.55, 0.2)
    l.intensity = 1.8 + Math.random() * 1.2
    l.distance = 4
  }
  return true
}

// Ground-level explosion: white-hot flash, burning paper bits, dust ring.
export function blast(x, y, z, power = 1, paper = COLORS.red) {
  const n1 = Math.round(50 * power)
  for (let i = 0; i < n1; i++) {
    randDir(_d)
    const sp = rand(2, 7) * power
    fx.spark(x, y, z, _d[0] * sp, Math.abs(_d[1]) * sp, _d[2] * sp, rand(0.05, 0.16), 7, 6.2, 4.8, 0.2 * power, 5, 0.3, 0.025)
  }
  const n2 = Math.round(36 * power)
  for (let i = 0; i < n2; i++) {
    randDir(_d)
    const sp = rand(1.5, 4.5) * Math.sqrt(power)
    fx.spark(x, y + 0.05, z, _d[0] * sp, Math.abs(_d[1]) * sp * 1.3 + 0.8, _d[2] * sp, rand(0.7, 1.6), paper[0] * 0.35, paper[1] * 0.35, paper[2] * 0.35, 0.035, 1.6, 0.8, 0.02, 1)
  }
  const n3 = Math.round(16 * power)
  for (let i = 0; i < n3; i++) {
    const a = (i / n3) * Math.PI * 2 + Math.random() * 0.3
    const sp = rand(1.2, 2.8) * power
    fx.puff(x + Math.cos(a) * 0.08, y + 0.08, z + Math.sin(a) * 0.08, Math.cos(a) * sp, rand(0.15, 0.6), Math.sin(a) * sp, rand(2.5, 4.5), 0.25 * power, 1.6, 0.32)
  }
}

const _axis = new THREE.Vector3()
const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

// Small/medium aerial shell burst used by the cake and the rocket bundle.
// kind: 'peony' | 'ring' | 'crackle' | 'willow'
export function shellBurst(p, kind, c1, c2, scale = 1) {
  const k = Math.sqrt(scale)
  if (kind === 'ring') {
    _axis.set(rand(-0.6, 0.6), 1, rand(-0.4, 0.4)).normalize()
    _q.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, _axis)
    const n = Math.round(130 * scale)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      _v.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(_q)
      const sp = 8 * k
      fx.spark(p.x, p.y, p.z, _v.x * sp, _v.y * sp, _v.z * sp, rand(1.3, 1.7), c1[0], c1[1], c1[2], 0.13, 1.25, 0.45, 0.08)
    }
    for (let i = 0; i < 60 * scale; i++) {
      randDir(_d)
      const sp = rand(2.5, 4) * k
      fx.spark(p.x, p.y, p.z, _d[0] * sp, _d[1] * sp, _d[2] * sp, rand(1, 1.4), c2[0], c2[1], c2[2], 0.1, 1.3, 0.5, 0.06, 1)
    }
  } else if (kind === 'crackle') {
    for (let i = 0; i < 170 * scale; i++) {
      randDir(_d)
      const sp = rand(5, 6.5) * k
      const col = i % 3 === 0 ? COLORS.silver : c1
      fx.spark(p.x, p.y, p.z, _d[0] * sp, _d[1] * sp, _d[2] * sp, rand(1.1, 1.7), col[0], col[1], col[2], 0.11, 1.4, 0.55, 0.06, 1)
    }
  } else if (kind === 'willow') {
    for (let i = 0; i < 160 * scale; i++) {
      randDir(_d)
      const sp = rand(4.5, 6.5) * k
      fx.spark(p.x, p.y, p.z, _d[0] * sp, _d[1] * sp, _d[2] * sp, rand(2.2, 3.0), 2.3, 1.3, 0.4, 0.08, 1.9, 0.3, 0.15)
    }
  } else {
    for (let i = 0; i < 220 * scale; i++) {
      randDir(_d)
      const sp = rand(6, 7.5) * k
      const col = _d[1] > 0 ? c1 : c2
      fx.spark(p.x, p.y, p.z, _d[0] * sp, _d[1] * sp, _d[2] * sp, rand(1.2, 1.9), col[0], col[1], col[2], 0.12, 1.3, 0.5, 0.075)
    }
  }
  // bright core
  for (let i = 0; i < 18; i++) {
    randDir(_d)
    fx.spark(p.x, p.y, p.z, _d[0] * 1.5, _d[1] * 1.5, _d[2] * 1.5, 0.2, 6, 6, 6, 0.4 * k, 3, 0, 0.02)
  }
}

// Expanding ground shockwave ring + blinding flash sprite.
// `trigger` is a ref whose `.current` holds the clock time of the blast (-1 = idle).
export function ShockFX({ trigger, radius = 4, duration = 0.7, flashSize = 3 }) {
  const ring = useRef()
  const flash = useRef()
  const tex = glowTexture()
  useFrame((state) => {
    const t0 = trigger.current
    if (t0 < 0) {
      ring.current.visible = false
      flash.current.visible = false
      return
    }
    const age = state.clock.elapsedTime - t0
    const u = age / duration
    ring.current.visible = u < 1
    if (u < 1) {
      const e = 1 - (1 - u) ** 3
      ring.current.scale.setScalar(0.2 + radius * e)
      ring.current.material.opacity = (1 - u) ** 2 * 0.9
    }
    const fu = age / 0.22
    flash.current.visible = fu < 1
    if (fu < 1) {
      flash.current.scale.setScalar(flashSize * (0.4 + fu))
      flash.current.material.opacity = (1 - fu) ** 1.5
    }
  })
  return (
    <>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.04} visible={false} renderOrder={4}>
        <ringGeometry args={[0.82, 1, 72]} />
        <meshBasicMaterial
          color={[3, 2.4, 1.6]}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <sprite ref={flash} position-y={0.35} visible={false} renderOrder={7}>
        <spriteMaterial map={tex} color={[8, 7, 5.5]} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </>
  )
}

// Burnt paper scraps left on the ground after a bang (deterministic per spot).
const scrapGeo = new THREE.CircleGeometry(1, 5)
export function Scraps({ spot = [0, 0], count = 9, spread = 0.35, color = '#2a1a14' }) {
  const items = useMemo(() => {
    const r = mulberry32(Math.floor((spot[0] + 10) * 977 + (spot[1] + 10) * 131))
    return Array.from({ length: count }, () => ({
      p: [(r() - 0.5) * 2 * spread, 0.006 + r() * 0.003, (r() - 0.5) * 2 * spread],
      s: 0.012 + r() * 0.02,
      rz: r() * Math.PI,
    }))
  }, [spot, count, spread])
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} geometry={scrapGeo} position={it.p} rotation={[-Math.PI / 2, 0, it.rz]} scale={it.s}>
          <meshStandardMaterial color={i % 3 === 0 ? '#5a1d16' : color} roughness={1} />
        </mesh>
      ))}
    </group>
  )
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
