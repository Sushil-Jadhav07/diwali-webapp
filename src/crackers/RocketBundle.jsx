import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { BURST_HUES, COLORS, fuseStage, MAT, setLightColor, shellBurst, useCrackerResources } from './common'
import { RocketBody } from './Rocket'

// ---------------------------------------------------------------------------
// Rocket bundle: five rockets in a wooden stand, launched one after another in
// a fan with screaming whistles, each ending in its own coloured burst.
// ---------------------------------------------------------------------------

const FUSE = 2.6
const COUNT = 5
const GAP = 0.55
const BURN = 1.25
const KINDS = ['peony', 'ring', 'crackle', 'peony', 'willow']

const standMat = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.85 })

export function BundleStandModel({ burnt }) {
  return (
    <group>
      <mesh position-y={0.05} material={burnt ? MAT.burnt : standMat} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0, 0.012, 0]} material={burnt ? MAT.burnt : standMat}>
        <boxGeometry args={[0.38, 0.024, 0.18]} />
      </mesh>
    </group>
  )
}

const _lc = new THREE.Color()
const _d = [0, 0, 0]

export default function RocketBundle({ c }) {
  const g = useRef()
  const rockets = useRef([])
  const R = useCrackerResources()
  const [x, z] = c.spot
  const sims = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const lean = (i - (COUNT - 1) / 2) * 0.16
        const dir = new THREE.Vector3(Math.sin(lean), Math.cos(lean), rand(-0.18, -0.06)).normalize()
        const hue = BURST_HUES[(i * 3 + 1) % BURST_HUES.length]
        const hue2 = BURST_HUES[(i * 3 + 4) % BURST_HUES.length]
        return {
          at: i * GAP,
          dir,
          lean,
          ox: (i - (COUNT - 1) / 2) * 0.06,
          pos: new THREE.Vector3(),
          speed: 0,
          launched: false,
          burst: false,
          kind: KINDS[i],
          c1: COLORS[hue],
          c2: COLORS[hue2],
          acc: 0,
        }
      }),
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    if (fuseStage(R, dt, tl, FUSE, x - 0.15, 0.08, z)) return
    const F = tl - FUSE
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss', 80)
    }
    let flying = null
    sims.forEach((s, i) => {
      const t = F - s.at
      const mesh = rockets.current[i]
      if (t < 0 || !mesh) return
      if (!s.launched) {
        s.launched = true
        s.pos.set(x + s.ox, 0.1, z)
        R.play('screamer', { rate: 0.85 + i * 0.08, volume: 0.45 })
        for (let k = 0; k < 40; k++) {
          randDir(_d)
          const sp = rand(1, 3)
          fx.spark(s.pos.x, 0.12, z, _d[0] * sp, Math.abs(_d[1]) * sp, _d[2] * sp, rand(0.2, 0.45), 2.6, 1.6, 0.5, 0.04, 1.5, 1, 0.03)
        }
        fx.puff(s.pos.x, 0.15, z, rand(-0.2, 0.2), rand(0.3, 0.6), rand(-0.2, 0.2), 3, 0.3, 1.5, 0.28)
      }
      if (t < BURN) {
        s.speed = Math.min(14, s.speed + 28 * dt)
        s.pos.addScaledVector(s.dir, s.speed * dt)
        mesh.position.set(s.pos.x - x, s.pos.y, s.pos.z - z)
        mesh.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, s.dir)
        s.acc += dt * 300
        while (s.acc >= 1) {
          s.acc -= 1
          randDir(_d)
          const back = rand(2, 4.5)
          fx.spark(s.pos.x, s.pos.y, s.pos.z, -s.dir.x * back + _d[0] * 0.7, -s.dir.y * back + _d[1] * 0.7, -s.dir.z * back + _d[2] * 0.7, rand(0.25, 0.6), 2.8, 1.5, 0.4, 0.05, 1.4, 0.7, 0.04, Math.random() < 0.2 ? 1 : 0)
        }
        if (Math.random() < dt * 30) fx.puff(s.pos.x, s.pos.y - 0.1, s.pos.z, 0, 0, 0, rand(2, 3), 0.2, 1.3, 0.18)
        flying = s
        return
      }
      if (!s.burst) {
        s.burst = true
        mesh.visible = false
        shellBurst(s.pos, s.kind, s.c1, s.c2, 0.85)
        setLightColor(_lc, s.c1)
        fx.burstLight(s.pos.x, s.pos.y, s.pos.z, _lc, 1000, 1.1, 80)
        fx.skyFlash(_lc, 0.35)
        fx.addShake(0.05)
        R.play('burstPop', { volume: 0.75, rate: rand(0.85, 1.05) })
      }
    })
    // one owned light rides along with the rocket currently in flight
    const l = R.getLight()
    if (l) {
      if (flying) {
        l.position.copy(flying.pos)
        l.color.setRGB(1, 0.65, 0.3)
        l.intensity = 12
        l.distance = 16
      } else l.intensity = 0
    }
    if (F > (COUNT - 1) * GAP + BURN + 3.0) {
      R.dropLight()
      rt.done = true
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <BundleStandModel />
        {sims.map((s, i) => (
          <group key={i} ref={(el) => (rockets.current[i] = el)} position={[s.ox, 0.1, 0]} rotation-z={-s.lean}>
            <RocketBody />
          </group>
        ))}
        <mesh position={[-0.16, 0.06, 0]} rotation-z={Math.PI / 2} material={MAT.fuse}>
          <cylinderGeometry args={[0.003, 0.003, 0.05, 4]} />
        </mesh>
      </group>
    </group>
  )
}
