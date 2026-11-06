import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { COLORS, emitFuse, GroundGlow, MAT, useCrackerResources } from './common'

const FUSE = 3.0
const RAMP = 2.0
const HOLD = 3.2
const FADE = 2.0
const END = RAMP + HOLD + FADE + 1.2

const bodyMat = new THREE.MeshStandardMaterial({ color: '#c0262d', roughness: 0.75 })

export function AnarModel({ burnt }) {
  return (
    <group>
      <mesh position={[0, 0.095, 0]} material={burnt ? MAT.burnt : bodyMat} castShadow>
        <cylinderGeometry args={[0.032, 0.085, 0.19, 18]} />
      </mesh>
      {!burnt && (
        <>
          <mesh position={[0, 0.06, 0]} material={MAT.gold}>
            <cylinderGeometry args={[0.072, 0.075, 0.025, 18]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} material={MAT.gold}>
            <cylinderGeometry args={[0.051, 0.054, 0.015, 18]} />
          </mesh>
        </>
      )}
      <mesh position={[0, 0.2, 0]} material={burnt ? MAT.burnt : MAT.clay}>
        <cylinderGeometry args={[0.022, 0.032, 0.02, 12]} />
      </mesh>
    </group>
  )
}

export default function Anar({ c }) {
  const g = useRef()
  const fuse = useRef()
  const glow = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const TOP = 0.21

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
      const k = Math.min(1, tl / FUSE)
      fuse.current.scale.y = 1 - k * 0.9
      emitFuse(R.acc, dt, x, TOP + 0.04 * (1 - k), z)
      const l = R.getLight()
      if (l) {
        l.position.set(x, 0.3, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 2 + Math.random() * 1.5
        l.distance = 5
      }
      return
    }

    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      fuse.current.visible = false
      R.stop('hiss', 150)
      R.play('whoosh')
    }

    // intensity envelope: rise ~2 s, hold, fade
    let I
    if (F < RAMP) I = (F / RAMP) ** 0.8
    else if (F < RAMP + HOLD) I = 1
    else I = Math.max(0, 1 - (F - RAMP - HOLD) / FADE)
    I *= 0.9 + 0.1 * Math.sin(F * 23) * Math.sin(F * 7)

    // fountain sparks
    R.acc.v += dt * 950 * I
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      const spread = 0.12 + 0.16 * I
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * spread
      const sp = (3.6 + 4.6 * I) * rand(0.75, 1.08)
      const vx = Math.cos(a) * r * sp
      const vz = Math.sin(a) * r * sp
      const vy = sp * (1 - r * 0.5)
      const silver = Math.random() < 0.3
      const col = silver ? COLORS.silver : COLORS.gold
      fx.spark(
        x,
        TOP,
        z,
        vx,
        vy,
        vz,
        rand(0.7, 1.5) * (0.55 + 0.45 * I),
        col[0],
        col[1],
        col[2],
        silver ? 0.045 : 0.06,
        0.55,
        0.85,
        0.035,
        silver ? 1 : 0,
      )
    }
    // smoke
    R.acc2.v += dt * (14 * I + 2)
    while (R.acc2.v >= 1 && F < END - 0.5) {
      R.acc2.v -= 1
      fx.puff(x + rand(-0.05, 0.05), TOP + rand(0, 0.5), z + rand(-0.05, 0.05), rand(-0.2, 0.2), rand(0.4, 0.9), rand(-0.2, 0.2), rand(2.5, 4), 0.35, 1.3, 0.22)
    }

    const l = R.getLight()
    if (l) {
      l.position.set(x, 1.1, z)
      l.color.setRGB(1, 0.72, 0.38)
      l.intensity = 34 * I * (0.85 + Math.random() * 0.3)
      l.distance = 16
    }
    glow.current.material.opacity = 0.75 * I
    glow.current.scale.setScalar(0.8 + I * 0.5)

    if (F > END) {
      R.dropLight()
      glow.current.material.opacity = 0
      rt.done = true
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <AnarModel />
        <mesh ref={fuse} position={[0, 0.21, 0]} material={MAT.fuse}>
          <cylinderGeometry args={[0.004, 0.004, 0.06, 4]} />
        </mesh>
      </group>
      <GroundGlow ref={glow} radius={2.2} color="#ffb050" />
    </group>
  )
}
