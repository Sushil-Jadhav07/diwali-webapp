import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { COLORS, emitFuse, GroundGlow, MAT, useCrackerResources } from './common'

// Anar (flowerpot) and its big "Anar Deluxe" variant share one config-driven effect.
const BASE = {
  fuse: 3.0,
  ramp: 2.0,
  hold: 3.2,
  fade: 2.0,
  rate: 950,
  speed0: 3.6,
  speedGain: 4.6,
  spread0: 0.12,
  spreadGain: 0.16,
  palette: ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'silver', 'silver', 'silver'],
  light: 34,
  sound: 'whoosh',
  scale: 1,
  glow: 2.2,
  variant: 'classic',
}
const DELUXE = {
  ...BASE,
  fuse: 3.2,
  ramp: 2.5,
  hold: 5.0,
  fade: 2.4,
  rate: 1300,
  speed0: 4.4,
  speedGain: 6.0,
  spread0: 0.14,
  spreadGain: 0.2,
  palette: ['gold', 'gold', 'gold', 'silver', 'silver', 'red', 'red'],
  light: 46,
  sound: 'whooshBig',
  scale: 1.55,
  glow: 2.9,
  variant: 'deluxe',
}

const bodyMat = new THREE.MeshStandardMaterial({ color: '#c0262d', roughness: 0.75 })
const deluxeMat = new THREE.MeshStandardMaterial({ color: '#16733a', roughness: 0.7 })
const deluxeBand = new THREE.MeshStandardMaterial({ color: '#d1202a', roughness: 0.6 })

export function AnarModel({ burnt, variant = 'classic' }) {
  const deluxe = variant === 'deluxe'
  return (
    <group>
      <mesh position={[0, 0.095, 0]} material={burnt ? MAT.burnt : deluxe ? deluxeMat : bodyMat} castShadow>
        <cylinderGeometry args={[0.032, 0.085, 0.19, 18]} />
      </mesh>
      {!burnt && (
        <>
          <mesh position={[0, 0.06, 0]} material={MAT.gold}>
            <cylinderGeometry args={[0.072, 0.075, 0.025, 18]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} material={deluxe ? deluxeBand : MAT.gold}>
            <cylinderGeometry args={[0.051, 0.054, 0.015, 18]} />
          </mesh>
          {deluxe && (
            <mesh position={[0, 0.03, 0]} material={MAT.gold}>
              <cylinderGeometry args={[0.083, 0.086, 0.012, 18]} />
            </mesh>
          )}
        </>
      )}
      <mesh position={[0, 0.2, 0]} material={burnt ? MAT.burnt : MAT.clay}>
        <cylinderGeometry args={[0.022, 0.032, 0.02, 12]} />
      </mesh>
    </group>
  )
}

export function AnarDeluxeModel({ burnt }) {
  return (
    <group scale={DELUXE.scale}>
      <AnarModel burnt={burnt} variant="deluxe" />
    </group>
  )
}

function Fountain({ c, cfg }) {
  const g = useRef()
  const fuse = useRef()
  const glow = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const TOP = 0.21 * cfg.scale
  const END = cfg.ramp + cfg.hold + cfg.fade + 1.2

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - cfg.fuse

    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      const k = Math.min(1, tl / cfg.fuse)
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
      R.play(cfg.sound)
    }

    // intensity envelope: rise, hold, fade
    let I
    if (F < cfg.ramp) I = (F / cfg.ramp) ** 0.8
    else if (F < cfg.ramp + cfg.hold) I = 1
    else I = Math.max(0, 1 - (F - cfg.ramp - cfg.hold) / cfg.fade)
    I *= 0.9 + 0.1 * Math.sin(F * 23) * Math.sin(F * 7)

    // fountain sparks
    R.acc.v += dt * cfg.rate * I
    const pal = cfg.palette
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      const spread = cfg.spread0 + cfg.spreadGain * I
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * spread
      const sp = (cfg.speed0 + cfg.speedGain * I) * rand(0.75, 1.08)
      const vx = Math.cos(a) * r * sp
      const vz = Math.sin(a) * r * sp
      const vy = sp * (1 - r * 0.5)
      const name = pal[(Math.random() * pal.length) | 0]
      const silver = name === 'silver'
      const col = COLORS[name]
      fx.spark(x, TOP, z, vx, vy, vz, rand(0.7, 1.5) * (0.55 + 0.45 * I), col[0], col[1], col[2], silver ? 0.045 : 0.06, 0.55, 0.85, 0.035, silver ? 1 : 0)
    }
    // smoke
    R.acc2.v += dt * (14 * I + 2)
    while (R.acc2.v >= 1 && F < END - 0.5) {
      R.acc2.v -= 1
      fx.puff(x + rand(-0.05, 0.05), TOP + rand(0, 0.5), z + rand(-0.05, 0.05), rand(-0.2, 0.2), rand(0.4, 0.9), rand(-0.2, 0.2), rand(2.5, 4), 0.35 * cfg.scale, 1.3, 0.22)
    }

    const l = R.getLight()
    if (l) {
      l.position.set(x, 1.1 * cfg.scale, z)
      l.color.setRGB(1, 0.72, 0.38)
      l.intensity = cfg.light * I * (0.85 + Math.random() * 0.3)
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
        <group scale={cfg.scale}>
          <AnarModel variant={cfg.variant} />
          <mesh ref={fuse} position={[0, 0.21, 0]} material={MAT.fuse}>
            <cylinderGeometry args={[0.004, 0.004, 0.06, 4]} />
          </mesh>
        </group>
      </group>
      <GroundGlow ref={glow} radius={cfg.glow} color="#ffb050" />
    </group>
  )
}

export default function Anar({ c }) {
  return <Fountain c={c} cfg={BASE} />
}

export function AnarDeluxe({ c }) {
  return <Fountain c={c} cfg={DELUXE} />
}
