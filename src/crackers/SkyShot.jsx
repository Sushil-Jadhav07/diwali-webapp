import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { BURST_HUES, COLORS, emitFuse, lightColor, MAT, useCrackerResources } from './common'

const FUSE = 2.8
const RISE = 1.35
// three shells; the last one is the big patterned finale
const SHELLS = [
  { at: 0.0, h: 19, kind: 'peony' },
  { at: 1.9, h: 22, kind: 'ring' },
  { at: 3.9, h: 25, kind: 'finale' },
]
const DONE_AFTER = SHELLS[2].at + RISE + 4.6

const boxMat = new THREE.MeshStandardMaterial({ color: '#5b21b6', roughness: 0.7 })
const labelMat = new THREE.MeshStandardMaterial({ color: '#f5b942', roughness: 0.5, metalness: 0.3 })
const tubeMat = new THREE.MeshStandardMaterial({ color: '#120d08', roughness: 1 })

export function SkyShotModel({ burnt }) {
  return (
    <group>
      <mesh position-y={0.13} material={burnt ? MAT.burnt : boxMat} castShadow>
        <boxGeometry args={[0.24, 0.26, 0.24]} />
      </mesh>
      {!burnt && (
        <mesh position={[0, 0.13, 0.1205]} material={labelMat}>
          <planeGeometry args={[0.18, 0.08]} />
        </mesh>
      )}
      {[
        [-0.055, -0.055],
        [0.055, -0.055],
        [-0.055, 0.055],
        [0.055, 0.055],
      ].map(([a, b], i) => (
        <mesh key={i} position={[a, 0.262, b]} material={tubeMat}>
          <cylinderGeometry args={[0.036, 0.036, 0.006, 12]} />
        </mesh>
      ))}
    </group>
  )
}

export default function SkyShot({ c }) {
  const g = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const d3 = useMemo(() => [0, 0, 0], [])
  const shells = useMemo(
    () =>
      SHELLS.map((s, i) => {
        const hues = [...BURST_HUES].sort(() => Math.random() - 0.5)
        return {
          ...s,
          launched: false,
          burst: false,
          crackled: false,
          drift: new THREE.Vector3(rand(-3, 3), 0, rand(-3, -1)),
          pos: new THREE.Vector3(x, 0.3, z),
          hues: hues.slice(0, 4),
          i,
        }
      }),
    [x, z],
  )

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
      emitFuse(R.acc, dt, x + 0.125, 0.05 + 0.04 * (1 - tl / FUSE), z)
      const l = R.getLight()
      if (l) {
        l.position.set(x + 0.2, 0.3, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 1.8 + Math.random()
        l.distance = 4
      }
      return
    }
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss', 80)
      R.dropLight()
    }

    for (const s of shells) {
      const t = F - s.at
      if (t < 0) continue
      if (!s.launched) {
        s.launched = true
        R.play('thump', { volume: 0.9 })
        // muzzle flash + smoke from the tube
        for (let i = 0; i < 50; i++) {
          randDir(d3)
          const sp = rand(1, 3.5)
          fx.spark(x, 0.28, z, d3[0] * sp * 0.6, Math.abs(d3[1]) * sp + 1, d3[2] * sp * 0.6, rand(0.15, 0.4), 3, 2, 0.8, 0.05, 2, 1, 0.03)
        }
        for (let i = 0; i < 8; i++) fx.puff(x, 0.35, z, rand(-0.3, 0.3), rand(0.5, 1.4), rand(-0.3, 0.3), rand(3, 4.5), 0.35, 1.5, 0.3)
        fx.burstLight(x, 0.6, z, new THREE.Color(1, 0.7, 0.4), 40, 0.25, 10)
      }
      if (t < RISE) {
        // rising comet: decelerates to its apex
        const u = t / RISE
        const e = 1 - (1 - u) * (1 - u)
        const px = x + s.drift.x * e
        const pz = z + s.drift.z * e
        const py = 0.3 + (s.h - 0.3) * e
        const vy = ((s.h - 0.3) * 2 * (1 - u)) / RISE
        s.pos.set(px, py, pz)
        R.acc2.v += dt * 220
        while (R.acc2.v >= 1) {
          R.acc2.v -= 1
          randDir(d3)
          fx.spark(px, py, pz, d3[0] * 0.6, -vy * 0.15 + d3[1] * 0.6, d3[2] * 0.6, rand(0.3, 0.8), 3, 2.2, 1.2, 0.07, 1.5, 0.6, 0.06, 1)
        }
        // bright head
        fx.spark(px, py, pz, 0, vy * 0.02, 0, 0.05, 6, 5, 4, 0.35, 0, 0, 0.0)
        if (Math.random() < dt * 25) fx.puff(px, py - 0.3, pz, 0, 0, 0, 2.5, 0.3, 1.2, 0.14)
        continue
      }
      if (!s.burst) {
        s.burst = true
        burst(s, d3)
        const c1 = COLORS[s.hues[0]]
        const lc = lightColor(c1)
        const big = s.kind === 'finale'
        fx.burstLight(s.pos.x, s.pos.y, s.pos.z, lc, big ? 3400 : 1800, big ? 2.2 : 1.6, 110)
        fx.skyFlash(lc, big ? 1.0 : 0.6)
        fx.addShake(big ? 0.22 : 0.1)
        R.play('boom', { volume: big ? 1 : 0.8 })
      }
      // crackle stage: glittering pops across the burst
      if (s.kind === 'finale' && t > RISE + 1.1) {
        if (!s.crackled) {
          s.crackled = true
          R.play('crackleBurst')
        }
        const ct = t - RISE - 1.1
        if (ct < 2.2) {
          R.acc3.v += dt * 140 * (1 - ct / 2.2)
          while (R.acc3.v >= 1) {
            R.acc3.v -= 1
            randDir(d3)
            const rr = rand(4, 13)
            const px = s.pos.x + d3[0] * rr
            const py = s.pos.y + d3[1] * rr - ct * 3
            const pz = s.pos.z + d3[2] * rr
            for (let k = 0; k < 3; k++) {
              randDir(d3)
              fx.spark(px, py, pz, d3[0] * 2.2, d3[1] * 2.2, d3[2] * 2.2, rand(0.06, 0.14), 6, 5.6, 4.5, 0.22, 2, 0, 0.03)
            }
          }
        }
      }
    }
    if (F > DONE_AFTER) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <SkyShotModel />
      </group>
    </group>
  )
}

const _axis = new THREE.Vector3()
const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

function burst(s, d3) {
  const p = s.pos
  const H = s.hues.map((h) => COLORS[h])
  if (s.kind === 'peony') {
    // two-colour peony split by hemisphere
    for (let i = 0; i < 520; i++) {
      randDir(d3)
      const sp = rand(8.5, 10)
      const col = d3[1] > 0 ? H[0] : H[1]
      fx.spark(p.x, p.y, p.z, d3[0] * sp, d3[1] * sp, d3[2] * sp, rand(1.4, 2.2), col[0], col[1], col[2], 0.14, 1.3, 0.5, 0.08)
    }
  } else if (s.kind === 'ring') {
    // tilted ring + gold core
    _axis.set(rand(-0.5, 0.5), 1, rand(-0.3, 0.3)).normalize()
    _q.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, _axis)
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * Math.PI * 2
      _v.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(_q)
      const sp = 11
      const col = H[0]
      fx.spark(p.x, p.y, p.z, _v.x * sp, _v.y * sp, _v.z * sp, rand(1.6, 2.0), col[0], col[1], col[2], 0.15, 1.2, 0.45, 0.09)
    }
    for (let i = 0; i < 260; i++) {
      randDir(d3)
      const sp = rand(4, 6)
      const col = COLORS.gold
      fx.spark(p.x, p.y, p.z, d3[0] * sp, d3[1] * sp, d3[2] * sp, rand(1.2, 1.8), col[0], col[1], col[2], 0.11, 1.3, 0.5, 0.07, 1)
    }
  } else {
    // finale: big patterned chrysanthemum, colour bands by azimuth (rainbow wheel)
    for (let i = 0; i < 900; i++) {
      randDir(d3)
      const sp = rand(11, 13)
      const az = Math.atan2(d3[2], d3[0]) + Math.PI
      const band = Math.floor((az / (Math.PI * 2)) * 8) % 4
      const col = H[band]
      fx.spark(p.x, p.y, p.z, d3[0] * sp, d3[1] * sp, d3[2] * sp, rand(1.8, 2.6), col[0], col[1], col[2], 0.16, 1.25, 0.45, 0.1)
    }
    // inner silver ring
    _axis.set(0, 1, 0)
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2
      const sp = 6
      fx.spark(p.x, p.y, p.z, Math.cos(a) * sp, rand(-0.4, 0.4), Math.sin(a) * sp, rand(1.3, 1.7), 2.6, 2.6, 3, 0.13, 1.1, 0.4, 0.07, 1)
    }
    // golden willow drips that hang and fall slowly
    for (let i = 0; i < 260; i++) {
      randDir(d3)
      const sp = rand(5, 8)
      fx.spark(p.x, p.y, p.z, d3[0] * sp, d3[1] * sp, d3[2] * sp, rand(2.8, 3.6), 2.2, 1.2, 0.35, 0.08, 1.9, 0.28, 0.16)
    }
  }
}
