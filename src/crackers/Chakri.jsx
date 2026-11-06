import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { COLORS, emitFuse, GroundGlow, MAT, useCrackerResources } from './common'
import { audio } from '../audio/audio'

// Chakri and the bigger colour-changing "Zameen Chakkar" share one effect.
const MIX = [COLORS.gold, COLORS.gold, COLORS.gold, COLORS.green, COLORS.green, COLORS.red]
const CYCLE = [COLORS.gold, COLORS.green, COLORS.red, COLORS.blue, COLORS.pink, COLORS.cyan]

export const SPINNER_BASE = {
  fuse: 2.8,
  spinUp: 1.0,
  burn: 6.0,
  omega0: 10,
  omegaGain: 30,
  rate: 760,
  rim: 0.07,
  scale: 1,
  drift: 0.18,
  cycle: false,
  sound: 'whirr',
  rateBase: 0.65,
  rateGain: 0.95,
  vol: 0.55,
  light: 9,
  glowR: 1.3,
  variant: 'classic',
}
export const SPINNER_DELUXE = {
  ...SPINNER_BASE,
  fuse: 3.0,
  burn: 8.5,
  omega0: 12,
  omegaGain: 36,
  rate: 1150,
  rim: 0.11,
  scale: 1.6,
  drift: 0.32,
  cycle: true,
  sound: 'whirrDeluxe',
  rateBase: 0.7,
  rateGain: 0.7,
  vol: 0.6,
  light: 12,
  glowR: 1.9,
  variant: 'deluxe',
}

const coilMat = new THREE.MeshStandardMaterial({ color: '#1f8a3a', roughness: 0.7 })
const coilMat2 = new THREE.MeshStandardMaterial({ color: '#d62839', roughness: 0.7 })
const deluxeCoil = new THREE.MeshStandardMaterial({ color: '#6d28d9', roughness: 0.65 })
const deluxeCoil2 = new THREE.MeshStandardMaterial({ color: '#e7b341', roughness: 0.4, metalness: 0.5 })

export function ChakriModel({ burnt, variant = 'classic' }) {
  const deluxe = variant === 'deluxe'
  return (
    <group>
      <mesh rotation-x={Math.PI / 2} position-y={0.02} material={burnt ? MAT.burnt : deluxe ? deluxeCoil : coilMat} castShadow>
        <torusGeometry args={[0.062, 0.018, 8, 24]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.02} material={burnt ? MAT.burnt : deluxe ? deluxeCoil2 : coilMat2}>
        <torusGeometry args={[0.035, 0.012, 6, 18]} />
      </mesh>
      <mesh position-y={0.02} material={burnt ? MAT.burnt : MAT.clay}>
        <cylinderGeometry args={[0.018, 0.018, 0.03, 10]} />
      </mesh>
    </group>
  )
}

export function ChakriDeluxeModel({ burnt }) {
  return (
    <group scale={DELUXE.scale}>
      <ChakriModel burnt={burnt} variant="deluxe" />
    </group>
  )
}

// Generic spinner handler (registry kind 'spinner'). cfg.vertical = a wheel on
// a stake spinning in the vertical plane (hub at cfg.hubY).
export function Spinner({ c, cfg }) {
  const g = useRef()
  const spinner = useRef()
  const fuse = useRef()
  const glow = useRef()
  const R = useCrackerResources()
  const [x0, z0] = c.spot
  const st = useRef({ angle: 0, omega: 0, x: x0, z: z0, whirr: null })
  const END = cfg.burn + 0.8

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - cfg.fuse
    const s = st.current

    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      fuse.current.scale.x = 1 - Math.min(1, tl / cfg.fuse) * 0.85
      emitFuse(R.acc, dt, x0 + 0.1 * cfg.scale, 0.025, z0)
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
      s.whirr = R.play(cfg.sound, { volume: 0.05, rate: 0.7 })
    }

    let I
    if (F < 0.4) I = F / 0.4
    else if (F < cfg.burn - 1) I = 1
    else I = Math.max(0, (cfg.burn - F) / 1)

    const spinT = Math.min(1, F / cfg.spinUp)
    s.omega = (cfg.omega0 + cfg.omegaGain * spinT) * (F < cfg.burn ? 1 : 0.2) * (0.4 + 0.6 * I)
    s.angle += s.omega * dt
    // wobble/drift across the ground like a real chakri
    if (!cfg.vertical) {
      s.x += Math.sin(F * 1.7) * cfg.drift * dt * I
      s.z += Math.cos(F * 1.3) * cfg.drift * dt * I
    }
    if (cfg.vertical) spinner.current.rotation.z = -s.angle
    else spinner.current.rotation.y = -s.angle
    spinner.current.position.set(s.x - x0, 0, s.z - z0)

    // colour phase for the deluxe variant
    const ci = Math.floor(F / 1.5) % CYCLE.length
    const hue = CYCLE[ci]

    // sparks spray tangentially from the rim -> spiral trails
    R.acc.v += dt * cfg.rate * I
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      const a = s.angle + Math.random() * 0.3
      if (cfg.vertical) {
        // wheel in the XY plane: sparks fly off tangentially and fall
        const sp = rand(3, 6)
        const col = cfg.cycle ? (Math.random() < 0.75 ? hue : COLORS.gold) : MIX[(Math.random() * MIX.length) | 0]
        const ca = Math.cos(-a)
        const sa = Math.sin(-a)
        fx.spark(s.x + ca * cfg.rim, cfg.hubY + sa * cfg.rim, s.z, -sa * sp, ca * sp, rand(-0.5, 0.5), rand(0.4, 0.9), col[0], col[1], col[2], 0.05, 1.0, 0.9, 0.05)
        continue
      }
      const px = s.x + Math.cos(a) * cfg.rim
      const pz = s.z - Math.sin(a) * cfg.rim
      const tx = -Math.sin(a)
      const tz = -Math.cos(a)
      const sp = rand(2.6, 5.4) * (cfg.cycle ? 1.15 : 1)
      const col = cfg.cycle ? (Math.random() < 0.75 ? hue : COLORS.gold) : MIX[(Math.random() * MIX.length) | 0]
      fx.spark(px, 0.035, pz, tx * sp + rand(-0.4, 0.4), rand(0.2, 1.6), tz * sp + rand(-0.4, 0.4), rand(0.3, 0.75), col[0], col[1], col[2], 0.05, 1.1, 0.9, 0.05)
    }
    if (Math.random() < dt * 12 * I) fx.puff(s.x, 0.06, s.z, rand(-0.3, 0.3), 0.4, rand(-0.3, 0.3), 2.5, 0.25 * cfg.scale, 1.4, 0.18)

    // whirr rises in pitch as it spins up
    if (s.whirr != null) {
      audio.rate(cfg.sound, s.whirr, cfg.rateBase + cfg.rateGain * spinT * (0.6 + 0.4 * I))
      audio.volume(cfg.sound, s.whirr, cfg.vol * I)
    }

    const l = R.getLight()
    if (l) {
      l.position.set(s.x, 0.28, s.z)
      if (cfg.cycle) l.color.setRGB(Math.min(1, hue[0] / 3 + 0.2), Math.min(1, hue[1] / 3 + 0.15), Math.min(1, hue[2] / 3 + 0.1))
      else {
        const greenish = 0.5 + 0.5 * Math.sin(F * 9)
        l.color.setRGB(1, 0.6 + 0.25 * greenish, 0.25)
      }
      l.intensity = cfg.light * I * (0.8 + Math.random() * 0.4)
      l.distance = 9
    }
    glow.current.position.set(s.x - x0, 0.02, s.z - z0)
    glow.current.material.opacity = 0.45 * I
    if (cfg.cycle) glow.current.material.color.setRGB(hue[0] / 3, hue[1] / 3, hue[2] / 3)
    glow.current.scale.setScalar(0.9 + 0.3 * Math.sin(F * 30) * I)

    if (F > cfg.burn && !R.flags.stopped) {
      R.flags.stopped = true
      R.stop(cfg.sound, 300)
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
        {cfg.vertical && (
          <mesh position={[0, cfg.hubY / 2, -0.03]} material={MAT.clay}>
            <cylinderGeometry args={[0.012, 0.015, cfg.hubY, 6]} />
          </mesh>
        )}
        <group ref={spinner} position-y={cfg.vertical ? cfg.hubY : 0}>
          <group scale={cfg.scale} rotation-x={cfg.vertical ? Math.PI / 2 : 0} position-y={cfg.vertical ? -0.02 : 0}>
            <ChakriModel variant={cfg.variant} />
            <mesh ref={fuse} position={[0.09, 0.025, 0]} rotation-z={Math.PI / 2} material={MAT.fuse}>
              <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
            </mesh>
          </group>
        </group>
      </group>
      <GroundGlow ref={glow} radius={cfg.glowR} color="#ff9a30" />
    </group>
  )
}

export default function Chakri({ c }) {
  return <Spinner c={c} cfg={SPINNER_BASE} />
}

export function ChakriDeluxe({ c }) {
  return <Spinner c={c} cfg={SPINNER_DELUXE} />
}
