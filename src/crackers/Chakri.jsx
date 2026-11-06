import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { COLORS, emitFuse, GroundGlow, MAT, useCrackerResources } from './common'
import { audio } from '../audio/audio'

const FUSE = 2.8
const SPIN_UP = 1.0
const BURN = 6.0
const END = BURN + 0.8

const coilMat = new THREE.MeshStandardMaterial({ color: '#1f8a3a', roughness: 0.7 })
const coilMat2 = new THREE.MeshStandardMaterial({ color: '#d62839', roughness: 0.7 })

export function ChakriModel({ burnt }) {
  return (
    <group>
      <mesh rotation-x={Math.PI / 2} position-y={0.02} material={burnt ? MAT.burnt : coilMat} castShadow>
        <torusGeometry args={[0.062, 0.018, 8, 24]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.02} material={burnt ? MAT.burnt : coilMat2}>
        <torusGeometry args={[0.035, 0.012, 6, 18]} />
      </mesh>
      <mesh position-y={0.02} material={burnt ? MAT.burnt : MAT.clay}>
        <cylinderGeometry args={[0.018, 0.018, 0.03, 10]} />
      </mesh>
    </group>
  )
}

const MIX = [COLORS.gold, COLORS.gold, COLORS.gold, COLORS.green, COLORS.green, COLORS.red]

export default function Chakri({ c }) {
  const g = useRef()
  const spinner = useRef()
  const fuse = useRef()
  const glow = useRef()
  const R = useCrackerResources()
  const [x0, z0] = c.spot
  const st = useRef({ angle: 0, omega: 0, x: x0, z: z0, whirr: null })

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - FUSE
    const s = st.current

    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      fuse.current.scale.x = 1 - Math.min(1, tl / FUSE) * 0.85
      emitFuse(R.acc, dt, x0 + 0.1, 0.025, z0)
      const l = R.getLight()
      if (l) {
        l.position.set(x0, 0.25, z0)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 1.8 + Math.random() * 1.2
        l.distance = 4
      }
      return
    }
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      fuse.current.visible = false
      R.stop('hiss', 120)
      s.whirr = R.play('whirr', { volume: 0.05, rate: 0.7 })
    }

    let I
    if (F < 0.4) I = F / 0.4
    else if (F < BURN - 1) I = 1
    else I = Math.max(0, (BURN - F) / 1)

    const spinT = Math.min(1, F / SPIN_UP)
    s.omega = (10 + 30 * spinT) * (F < BURN ? 1 : 0.2) * (0.4 + 0.6 * I)
    s.angle += s.omega * dt
    // wobble/drift across the ground like a real chakri
    s.x += Math.sin(F * 1.7) * 0.18 * dt * I
    s.z += Math.cos(F * 1.3) * 0.18 * dt * I
    spinner.current.rotation.y = -s.angle
    spinner.current.position.set(s.x - x0, 0, s.z - z0)

    // sparks spray tangentially from the rim -> spiral trails
    R.acc.v += dt * 760 * I
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      const a = s.angle + Math.random() * 0.3
      const px = s.x + Math.cos(a) * 0.07
      const pz = s.z - Math.sin(a) * 0.07
      // tangent of clockwise (seen from above) rotation
      const tx = -Math.sin(a)
      const tz = -Math.cos(a)
      const sp = rand(2.6, 5.4)
      const col = MIX[(Math.random() * MIX.length) | 0]
      fx.spark(
        px,
        0.035,
        pz,
        tx * sp + rand(-0.4, 0.4),
        rand(0.2, 1.6),
        tz * sp + rand(-0.4, 0.4),
        rand(0.3, 0.75),
        col[0],
        col[1],
        col[2],
        0.05,
        1.1,
        0.9,
        0.05,
      )
    }
    if (Math.random() < dt * 12 * I) fx.puff(s.x, 0.06, s.z, rand(-0.3, 0.3), 0.4, rand(-0.3, 0.3), 2.5, 0.25, 1.4, 0.18)

    // whirr rises in pitch as it spins up
    if (s.whirr != null) {
      audio.rate('whirr', s.whirr, 0.65 + 0.95 * spinT * (0.6 + 0.4 * I))
      audio.volume('whirr', s.whirr, 0.55 * I)
    }

    const l = R.getLight()
    if (l) {
      l.position.set(s.x, 0.28, s.z)
      const greenish = 0.5 + 0.5 * Math.sin(F * 9)
      l.color.setRGB(1, 0.6 + 0.25 * greenish, 0.25)
      l.intensity = 9 * I * (0.8 + Math.random() * 0.4)
      l.distance = 9
    }
    glow.current.position.set(s.x - x0, 0.02, s.z - z0)
    glow.current.material.opacity = 0.45 * I
    glow.current.scale.setScalar(0.9 + 0.3 * Math.sin(F * 30) * I)

    if (F > BURN && !R.flags.stopped) {
      R.flags.stopped = true
      R.stop('whirr', 300)
    }
    if (F > END) {
      R.dropLight()
      glow.current.material.opacity = 0
      rt.done = true
    }
  })

  return (
    <group position={[x0, 0, z0]}>
      <group ref={g} visible={false}>
        <group ref={spinner}>
          <ChakriModel />
          <mesh ref={fuse} position={[0.09, 0.025, 0]} rotation-z={Math.PI / 2} material={MAT.fuse}>
            <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
          </mesh>
        </group>
      </group>
      <GroundGlow ref={glow} radius={1.3} color="#ff9a30" />
    </group>
  )
}
