import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { BURST_HUES, COLORS, emitFuse, lightColor, MAT, useCrackerResources } from './common'

const FUSE = 2.6
const BURN = 1.55
const END_AFTER_BURST = 3.4

const glassMat = new THREE.MeshStandardMaterial({
  color: '#2f7a4d',
  roughness: 0.08,
  metalness: 0.1,
  transparent: true,
  opacity: 0.45,
})
const bodyMat = new THREE.MeshStandardMaterial({ color: '#d1202a', roughness: 0.6 })
const stickMat = new THREE.MeshStandardMaterial({ color: '#a87a3f', roughness: 0.9 })

// Classic Indian setup: a rocket standing in a glass bottle.
export function BottleModel() {
  return (
    <group>
      <mesh position-y={0.11} material={glassMat} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 16]} />
      </mesh>
      <mesh position-y={0.25} material={glassMat}>
        <cylinderGeometry args={[0.016, 0.05, 0.07, 16]} />
      </mesh>
      <mesh position-y={0.31} material={glassMat}>
        <cylinderGeometry args={[0.017, 0.017, 0.06, 12]} />
      </mesh>
    </group>
  )
}

export function RocketBody() {
  return (
    <group>
      {/* stick goes down into the bottle */}
      <mesh position-y={-0.08} material={stickMat}>
        <cylinderGeometry args={[0.004, 0.004, 0.48, 4]} />
      </mesh>
      <mesh position={[0.016, 0.2, 0]} material={bodyMat} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.11, 10]} />
      </mesh>
      <mesh position={[0.016, 0.275, 0]} material={MAT.gold}>
        <coneGeometry args={[0.016, 0.04, 10]} />
      </mesh>
    </group>
  )
}

export default function Rocket({ c }) {
  const g = useRef()
  const rocket = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const base = 0.36 // rocket sits on the bottle neck
  const st = useMemo(() => {
    const dir = new THREE.Vector3(rand(-0.12, 0.12), 1, rand(-0.22, -0.06)).normalize()
    const hue = BURST_HUES[(Math.random() * BURST_HUES.length) | 0]
    let hue2 = BURST_HUES[(Math.random() * BURST_HUES.length) | 0]
    if (hue2 === hue) hue2 = 'silver'
    return { dir, pos: new THREE.Vector3(x, base, z), speed: 0, hue, hue2 }
  }, [x, z])
  const d3 = useMemo(() => [0, 0, 0], [])

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
      emitFuse(R.acc, dt, x + 0.016, base + 0.13, z)
      const l = R.getLight()
      if (l) {
        l.position.set(x, 0.5, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 1.6 + Math.random()
        l.distance = 4
      }
      return
    }

    if (!R.flags.launched) {
      R.flags.launched = true
      rt.fired = true
      R.stop('hiss', 80)
      R.play('whistle')
      // ignition blast at the bottle mouth
      for (let i = 0; i < 70; i++) {
        randDir(d3)
        const sp = rand(1, 3)
        fx.spark(x, base + 0.1, z, d3[0] * sp, Math.abs(d3[1]) * sp, d3[2] * sp, rand(0.2, 0.5), 2.6, 1.6, 0.5, 0.04, 1.5, 1, 0.03)
      }
      for (let i = 0; i < 6; i++) fx.puff(x, base, z, rand(-0.3, 0.3), rand(0.2, 0.6), rand(-0.3, 0.3), 3, 0.3, 1.5, 0.3)
    }

    if (F < BURN) {
      // accelerate along a slightly wobbly path
      st.speed = Math.min(15.5, st.speed + 30 * dt)
      st.dir.x += Math.sin(F * 13) * 0.02 * dt
      st.dir.normalize()
      st.pos.addScaledVector(st.dir, st.speed * dt)
      rocket.current.position.set(st.pos.x - x, st.pos.y, st.pos.z - z)
      rocket.current.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, st.dir)
      // spark + smoke trail
      R.acc.v += dt * 420
      while (R.acc.v >= 1) {
        R.acc.v -= 1
        randDir(d3)
        const back = rand(2, 5)
        fx.spark(
          st.pos.x - st.dir.x * 0.1,
          st.pos.y - st.dir.y * 0.1,
          st.pos.z - st.dir.z * 0.1,
          -st.dir.x * back + d3[0] * 0.8,
          -st.dir.y * back + d3[1] * 0.8,
          -st.dir.z * back + d3[2] * 0.8,
          rand(0.25, 0.7),
          2.8,
          1.5,
          0.4,
          0.05,
          1.4,
          0.7,
          0.04,
          Math.random() < 0.2 ? 1 : 0,
        )
      }
      R.acc2.v += dt * 45
      while (R.acc2.v >= 1) {
        R.acc2.v -= 1
        fx.puff(st.pos.x, st.pos.y - 0.15, st.pos.z, rand(-0.15, 0.15), rand(-0.1, 0.2), rand(-0.15, 0.15), rand(2, 3.5), 0.22, 1.3, 0.2)
      }
      const l = R.getLight()
      if (l) {
        l.position.copy(st.pos)
        l.color.setRGB(1, 0.65, 0.3)
        l.intensity = 14
        l.distance = 18
      }
      return
    }

    if (!R.flags.burst) {
      R.flags.burst = true
      rocket.current.visible = false
      R.dropLight()
      const p = st.pos
      const c1 = COLORS[st.hue]
      const c2 = COLORS[st.hue2]
      const N = 460
      for (let i = 0; i < N; i++) {
        randDir(d3)
        const sp = rand(6.5, 8.2)
        const col = i % 4 === 0 ? c2 : c1
        fx.spark(p.x, p.y, p.z, d3[0] * sp, d3[1] * sp, d3[2] * sp, rand(1.3, 2.1), col[0], col[1], col[2], 0.13, 1.35, 0.5, 0.075, i % 5 === 0 ? 1 : 0)
      }
      // bright core flash
      for (let i = 0; i < 40; i++) {
        randDir(d3)
        fx.spark(p.x, p.y, p.z, d3[0] * 2, d3[1] * 2, d3[2] * 2, 0.25, 6, 6, 6, 0.5, 3, 0, 0.02)
      }
      const lc = lightColor(c1)
      fx.burstLight(p.x, p.y, p.z, lc, 1400, 1.6, 90)
      fx.skyFlash(lc, 0.55)
      fx.addShake(0.08)
      R.play('boom', { volume: 0.85 })
      for (let i = 0; i < 10; i++) fx.puff(p.x + rand(-1, 1), p.y + rand(-1, 1), p.z + rand(-1, 1), 0, 0, 0, 4, 2.2, 1.0, 0.1)
    }
    if (F > BURN + END_AFTER_BURST) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <BottleModel />
        <group ref={rocket} position={[0, base, 0]}>
          <RocketBody />
        </group>
      </group>
    </group>
  )
}
