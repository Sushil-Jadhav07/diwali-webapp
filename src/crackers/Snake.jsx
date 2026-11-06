import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { fuseStage, useCrackerResources } from './common'
import { mulberry32 } from '../scene/shared'

// ---------------------------------------------------------------------------
// Snake tablet (saanp ki goli): a dark ash "snake" grows out of the tablet,
// rises, flops over and curls along the ground, with smoke and a quiet fizz.
// Rendered as one instanced mesh of overlapping spheres along a procedural path.
// ---------------------------------------------------------------------------

const N = 150
const segGeo = new THREE.SphereGeometry(1, 10, 7)
const ashMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 })
const tabletMat = new THREE.MeshStandardMaterial({ color: '#3a2a1c', roughness: 0.9 })

function seedOf(spot) {
  return Math.floor((spot[0] + 10) * 541 + (spot[1] + 10) * 89)
}

// Deterministic path so the spent snake left on the ground matches the live one.
function snakePath(seed) {
  const r = mulberry32(seed)
  const pts = []
  const radii = []
  let x = 0
  let y = 0.016
  let z = 0
  let yaw = r() * Math.PI * 2
  for (let i = 0; i < N; i++) {
    const u = i / N
    pts.push(new THREE.Vector3(x, y, z))
    radii.push(0.011 + 0.008 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u * 0.35))
    let dx
    let dy
    let dz
    if (u < 0.13) {
      // coil upward out of the tablet
      yaw += 0.55
      const rad = 0.006 + u * 0.05
      dx = Math.cos(yaw) * rad * 8
      dz = Math.sin(yaw) * rad * 8
      dy = 1
    } else {
      // bend over and curl along the ground
      yaw += 0.16 + 0.12 * Math.sin(i * 0.09 + r() * 0.5)
      dx = Math.cos(yaw)
      dz = Math.sin(yaw)
      dy = (0.03 - y) * 8
    }
    const L = Math.hypot(dx, dy, dz) || 1
    const step = 0.0085
    x += (dx / L) * step
    y = Math.max(0.016, y + (dy / L) * step)
    z += (dz / L) * step
  }
  return { pts, radii }
}

function useSnakeInstances(ref, seed) {
  const { pts, radii } = useMemo(() => snakePath(seed), [seed])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const c = new THREE.Color()
    const r = mulberry32(seed + 7)
    for (let i = 0; i < N; i++) {
      s.setScalar(radii[i])
      m.compose(pts[i], q, s)
      ref.current.setMatrixAt(i, m)
      const v = 0.07 + r() * 0.1
      ref.current.setColorAt(i, c.setRGB(v * 1.05, v, v * 0.92))
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [ref, pts, radii, seed])
  return pts
}

export function SnakeSpent({ spot = [0, 0] }) {
  const ref = useRef()
  useSnakeInstances(ref, seedOf(spot))
  return (
    <group>
      <mesh material={tabletMat} position-y={0.005}>
        <cylinderGeometry args={[0.022, 0.024, 0.01, 14]} />
      </mesh>
      <instancedMesh ref={ref} args={[segGeo, ashMat, N]} castShadow />
    </group>
  )
}

const IGNITE = 1.2
const GROW = 6.5
const END = GROW + 1.2

export default function Snake({ c }) {
  const g = useRef()
  const inst = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const pts = useSnakeInstances(inst, seedOf(c.spot))

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) {
      inst.current.count = 0
      return
    }
    const tl = state.clock.elapsedTime - rt.litAt
    if (fuseStage(R, dt, tl, IGNITE, x, 0.02, z, 0.15)) {
      inst.current.count = 0
      return
    }
    const F = tl - IGNITE
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss', 100)
      R.play('snakeFizz')
    }
    const g01 = 1 - (1 - Math.min(1, F / GROW)) ** 1.6
    const count = Math.max(1, Math.floor(g01 * N))
    inst.current.count = count
    const growing = F < GROW
    // glowing embers + smoke at the base while it grows; smoke from the head too
    if (growing) {
      if (Math.random() < dt * 30) fx.spark(x + rand(-0.01, 0.01), 0.02, z + rand(-0.01, 0.01), rand(-0.2, 0.2), rand(0.2, 0.5), rand(-0.2, 0.2), rand(0.15, 0.35), 2.2, 0.8, 0.2, 0.025, 2, 0.2, 0.01)
      R.acc2.v += dt * 16
      while (R.acc2.v >= 1) {
        R.acc2.v -= 1
        const h = pts[count - 1]
        const atHead = Math.random() < 0.5
        fx.puff(x + (atHead ? h.x : 0), (atHead ? h.y : 0.02) + 0.02, z + (atHead ? h.z : 0), rand(-0.08, 0.08), rand(0.25, 0.5), rand(-0.08, 0.08), rand(2.2, 3.5), 0.12, 1.6, 0.26)
      }
    }
    const l = R.getLight()
    if (l) {
      l.position.set(x, 0.12, z)
      l.color.setRGB(1, 0.45, 0.15)
      l.intensity = growing ? 2 + Math.random() * 1.2 : Math.max(0, l.intensity - dt * 4)
      l.distance = 3
    }
    if (!growing && !R.flags.quiet) {
      R.flags.quiet = true
      R.stop('snakeFizz', 600)
    }
    if (F > END) {
      R.dropLight()
      rt.done = true
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <mesh material={tabletMat} position-y={0.006} castShadow>
          <cylinderGeometry args={[0.022, 0.024, 0.012, 14]} />
        </mesh>
        <instancedMesh ref={inst} args={[segGeo, ashMat, N]} castShadow frustumCulled={false} />
      </group>
    </group>
  )
}
