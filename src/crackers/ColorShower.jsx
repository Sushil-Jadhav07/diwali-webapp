import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { COLORS, emitFuse, GroundGlow, MAT, useCrackerResources } from './common'

// ---------------------------------------------------------------------------
// Colour shower fountain: a wide, weeping umbrella of sparks whose colour
// cycles red -> green -> blue -> pink -> gold -> cyan -> violet, with glitter.
// Shape differs from the Anar: lower, wider, long drooping trails.
// ---------------------------------------------------------------------------

const FUSE = 2.8
const RAMP = 1.2
const HOLD_END = 6.2
const FADE = 2.3
const END = HOLD_END + FADE + 1.0
const CYCLE = ['red', 'green', 'blue', 'pink', 'gold', 'cyan', 'violet']
const BAND_COLORS = ['#dc2626', '#16a34a', '#2563eb', '#db2777']

export function ColorShowerModel({ burnt }) {
  return (
    <group>
      {BAND_COLORS.map((col, i) => (
        <mesh key={i} position-y={0.035 + i * 0.07} castShadow={i === 0}>
          <cylinderGeometry args={[0.04, 0.042, 0.07, 16]} />
          {burnt ? <primitive object={MAT.burnt} attach="material" /> : <meshStandardMaterial color={col} roughness={0.65} />}
        </mesh>
      ))}
      <mesh position-y={0.29} material={burnt ? MAT.burnt : MAT.gold}>
        <cylinderGeometry args={[0.03, 0.04, 0.02, 16]} />
      </mesh>
    </group>
  )
}

export default function ColorShower({ c }) {
  const g = useRef()
  const fuse = useRef()
  const glow = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const TOP = 0.3

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - FUSE
    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      fuse.current.scale.y = 1 - Math.min(1, tl / FUSE) * 0.9
      emitFuse(R.acc, dt, x, TOP + 0.03, z)
      const l = R.getLight()
      if (l) {
        l.position.set(x, 0.4, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 2 + Math.random()
        l.distance = 5
      }
      return
    }
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      fuse.current.visible = false
      R.stop('hiss', 120)
      R.play('shower')
    }

    let I
    if (F < RAMP) I = F / RAMP
    else if (F < HOLD_END) I = 1
    else I = Math.max(0, 1 - (F - HOLD_END) / FADE)

    // colour cross-fade between consecutive hues
    const phase = F / 1.1
    const i0 = Math.floor(phase) % CYCLE.length
    const i1 = (i0 + 1) % CYCLE.length
    const frac = phase - Math.floor(phase)
    const ca = COLORS[CYCLE[i0]]
    const cb = COLORS[CYCLE[i1]]

    R.acc.v += dt * 760 * I
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * (0.2 + 0.25 * I)
      const sp = rand(5.2, 7.6) * (0.75 + 0.25 * I)
      const glitter = Math.random() < 0.12
      const col = glitter ? COLORS.silver : Math.random() < frac ? cb : ca
      fx.spark(x, TOP, z, Math.cos(a) * r * sp, sp * (1 - r * 0.6), Math.sin(a) * r * sp, rand(1.5, 2.4), col[0], col[1], col[2], glitter ? 0.045 : 0.06, 1.15, 0.75, 0.07, glitter ? 1 : 0)
    }
    R.acc2.v += dt * (10 * I + 2)
    while (R.acc2.v >= 1 && F < END - 0.5) {
      R.acc2.v -= 1
      fx.puff(x + rand(-0.05, 0.05), TOP + rand(0, 0.4), z + rand(-0.05, 0.05), rand(-0.2, 0.2), rand(0.4, 0.8), rand(-0.2, 0.2), rand(2.5, 4), 0.3, 1.3, 0.2)
    }

    const l = R.getLight()
    if (l) {
      const r = ca[0] * (1 - frac) + cb[0] * frac
      const gg = ca[1] * (1 - frac) + cb[1] * frac
      const b = ca[2] * (1 - frac) + cb[2] * frac
      l.position.set(x, 1.2, z)
      l.color.setRGB(Math.min(1, r / 3 + 0.15), Math.min(1, gg / 3 + 0.15), Math.min(1, b / 3 + 0.15))
      l.intensity = 30 * I * (0.85 + Math.random() * 0.3)
      l.distance = 16
      glow.current.material.color.setRGB(r / 3, gg / 3, b / 3)
    }
    glow.current.material.opacity = 0.7 * I

    if (F > END) {
      R.dropLight()
      glow.current.material.opacity = 0
      rt.done = true
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <ColorShowerModel />
        <mesh ref={fuse} position={[0, 0.32, 0]} material={MAT.fuse}>
          <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
        </mesh>
      </group>
      <GroundGlow ref={glow} radius={2.6} color="#ffffff" />
    </group>
  )
}
