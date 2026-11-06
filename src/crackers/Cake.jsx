import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { BURST_HUES, COLORS, fuseStage, MAT, setLightColor, shellBurst, useCrackerResources } from './common'

// ---------------------------------------------------------------------------
// Aerial multi-shot cake: a box of 16 tubes firing small shells in quick
// succession in a left-right fan, rhythmic thumps + bursts.
// ---------------------------------------------------------------------------

const FUSE = 2.8
const SHOTS = 16
const GAP = 0.36
const RISE = 0.9
const KINDS = ['peony', 'crackle', 'ring', 'willow']

const wrapMat = new THREE.MeshStandardMaterial({ color: '#be185d', roughness: 0.7 })
const labelMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.5, metalness: 0.3 })
const tubeMat = new THREE.MeshStandardMaterial({ color: '#120d08', roughness: 1 })

const TUBES = (() => {
  const t = []
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) t.push([(q - 1.5) * 0.075, (r - 1.5) * 0.075])
  return t
})()

export function CakeModel({ burnt }) {
  return (
    <group>
      <mesh position-y={0.1} material={burnt ? MAT.burnt : wrapMat} castShadow>
        <boxGeometry args={[0.34, 0.2, 0.34]} />
      </mesh>
      {!burnt && (
        <mesh position={[0, 0.1, 0.1705]} material={labelMat}>
          <planeGeometry args={[0.26, 0.09]} />
        </mesh>
      )}
      {TUBES.map(([a, b], i) => (
        <mesh key={i} position={[a, 0.202, b]} material={tubeMat}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 10]} />
        </mesh>
      ))}
    </group>
  )
}

const _lc = new THREE.Color()
const _d = [0, 0, 0]

export default function Cake({ c }) {
  const g = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const shells = useMemo(
    () =>
      Array.from({ length: SHOTS }, (_, i) => {
        const sweep = i < 8 ? i / 7 : 1 - (i - 8) / 7
        const ang = (sweep - 0.5) * 0.75
        const h = rand(12, 16.5)
        const tube = TUBES[(i * 5) % TUBES.length]
        return {
          at: i * GAP,
          h,
          ox: tube[0],
          oz: tube[1],
          dx: Math.sin(ang) * h * 0.55,
          dz: -rand(0.6, 1.6),
          kind: KINDS[i % KINDS.length],
          c1: COLORS[BURST_HUES[(i * 3) % BURST_HUES.length]],
          c2: COLORS[BURST_HUES[(i * 3 + 2) % BURST_HUES.length]],
          launched: false,
          burst: false,
          pos: new THREE.Vector3(),
          acc: 0,
          crackleAcc: 0,
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
    if (fuseStage(R, dt, tl, FUSE, x + 0.17, 0.06, z)) return
    const F = tl - FUSE
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss', 80)
      R.dropLight()
    }
    for (const s of shells) {
      const t = F - s.at
      if (t < 0) continue
      const bx = x + s.ox
      const bz = z + s.oz
      if (!s.launched) {
        s.launched = true
        R.play('cakeShot', { rate: rand(0.92, 1.1) })
        for (let i = 0; i < 26; i++) {
          randDir(_d)
          const sp = rand(1, 3)
          fx.spark(bx, 0.22, bz, _d[0] * sp * 0.5, Math.abs(_d[1]) * sp + 1, _d[2] * sp * 0.5, rand(0.12, 0.3), 3, 2, 0.8, 0.04, 2, 1, 0.03)
        }
        fx.puff(bx, 0.3, bz, rand(-0.2, 0.2), rand(0.6, 1.2), rand(-0.2, 0.2), rand(2.5, 3.5), 0.3, 1.5, 0.25)
      }
      if (t < RISE) {
        const u = t / RISE
        const e = 1 - (1 - u) * (1 - u)
        const px = bx + s.dx * e
        const py = 0.25 + (s.h - 0.25) * e
        const pz = bz + s.dz * e
        s.pos.set(px, py, pz)
        s.acc += dt * 160
        while (s.acc >= 1) {
          s.acc -= 1
          randDir(_d)
          fx.spark(px, py, pz, _d[0] * 0.4, _d[1] * 0.4 - 1, _d[2] * 0.4, rand(0.25, 0.55), 3, 2, 1, 0.05, 1.5, 0.5, 0.05, 1)
        }
        fx.spark(px, py, pz, 0, 0, 0, 0.04, 6, 5, 3.5, 0.22, 0, 0, 0)
        continue
      }
      if (!s.burst) {
        s.burst = true
        shellBurst(s.pos, s.kind, s.c1, s.c2, 0.6)
        setLightColor(_lc, s.c1)
        fx.burstLight(s.pos.x, s.pos.y, s.pos.z, _lc, 700, 0.8, 60)
        fx.skyFlash(_lc, 0.22)
        fx.addShake(0.03)
        R.play('burstPop', { volume: 0.55, rate: rand(0.9, 1.15) })
      }
      // crackle shells glitter for a moment after bursting
      if (s.kind === 'crackle' && t > RISE + 0.6 && t < RISE + 1.6) {
        s.crackleAcc += dt * 60
        while (s.crackleAcc >= 1) {
          s.crackleAcc -= 1
          randDir(_d)
          const rr = rand(2, 5)
          fx.spark(s.pos.x + _d[0] * rr, s.pos.y + _d[1] * rr - (t - RISE) * 2, s.pos.z + _d[2] * rr, 0, -0.5, 0, rand(0.06, 0.12), 6, 5.6, 4.5, 0.18, 2, 0, 0.02)
        }
      }
    }
    if (F > (SHOTS - 1) * GAP + RISE + 2.8) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <CakeModel />
        <mesh position={[0.17, 0.04, 0]} rotation-z={Math.PI / 2} material={MAT.fuse}>
          <cylinderGeometry args={[0.003, 0.003, 0.05, 4]} />
        </mesh>
      </group>
    </group>
  )
}
