import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { blast, COLORS, fuseStage, Scraps, useCrackerResources } from './common'
import { HOME } from '../scene/shared'

// ---------------------------------------------------------------------------
// Ladi: a woven string of small red crackers laid on the ground. The fuse end
// is at the spot (next to the child); the bangs race along the chain.
// ---------------------------------------------------------------------------

const N = 28
const crackerGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.055, 8)
const redPaper = new THREE.MeshStandardMaterial({ color: '#c81e1e', roughness: 0.7 })
const fuseMat = new THREE.MeshStandardMaterial({ color: '#6b5b3e', roughness: 0.9 })

// chain layout (local to the spot): points running away from HOME
function layout(spot) {
  const dx = spot[0] - HOME.x
  const dz = spot[1] - HOME.z
  const L = Math.hypot(dx, dz) || 1
  const ux = dx / L
  const uz = dz / L
  const px = -uz
  const pz = ux
  const pts = []
  for (let i = 0; i < N; i++) {
    const along = 0.05 + i * 0.045
    const side = Math.sin(i * 0.45) * 0.12
    pts.push(new THREE.Vector3(ux * along + px * side, 0.012, uz * along + pz * side))
  }
  return { pts, yaw: Math.atan2(ux, uz) }
}

export function LadiModel({ spot = [0, 0], hidden }) {
  const ref = useRef()
  const { pts, yaw } = useMemo(() => layout(spot), [spot])
  const fuseGeo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.004, 4, false), [pts])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3(1, 1, 1)
    for (let i = 0; i < N; i++) {
      // crackers lie flat, woven alternately across the fuse
      e.set(Math.PI / 2, 0, yaw + (i % 2 ? 0.7 : -0.7) + Math.PI / 2, 'YXZ')
      e.set(0, yaw + (i % 2 ? 0.7 : -0.7), Math.PI / 2, 'YXZ')
      q.setFromEuler(e)
      m.compose(pts[i], q, hidden && hidden[i] ? s.set(0, 0, 0) : s.set(1, 1, 1))
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [pts, yaw, hidden])
  return (
    <group>
      <instancedMesh ref={ref} args={[crackerGeo, redPaper, N]} castShadow />
      <mesh geometry={fuseGeo} material={fuseMat} />
    </group>
  )
}

export default function Ladi({ c }) {
  const g = useRef()
  const inst = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const { pts, yaw } = useMemo(() => layout(c.spot), [c.spot])
  const fuseGeo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.004, 4, false), [pts])
  const FUSE = 2.6
  const times = useMemo(() => {
    const t = []
    let acc = 0
    for (let i = 0; i < N; i++) {
      acc += rand(0.07, 0.14)
      t.push(acc)
    }
    return t
  }, [])
  const st = useMemo(() => ({ next: 0, m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), zero: new THREE.Vector3(0, 0, 0) }), [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const one = new THREE.Vector3(1, 1, 1)
    for (let i = 0; i < N; i++) {
      e.set(0, yaw + (i % 2 ? 0.7 : -0.7), Math.PI / 2, 'YXZ')
      q.setFromEuler(e)
      m.compose(pts[i], q, one)
      inst.current.setMatrixAt(i, m)
    }
    inst.current.instanceMatrix.needsUpdate = true
    inst.current.computeBoundingSphere()
  }, [pts, yaw])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    if (fuseStage(R, dt, tl, FUSE, x + pts[0].x, 0.02, z + pts[0].z)) return
    const F = tl - FUSE
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss')
    }
    const l = R.getLight()
    let changed = false
    while (st.next < N && F >= times[st.next]) {
      const i = st.next++
      const p = pts[i]
      const bx = x + p.x
      const bz = z + p.z
      blast(bx, 0.03, bz, 0.32, COLORS.red)
      R.play('ladiBang', { rate: rand(0.85, 1.25), volume: rand(0.45, 0.75) })
      fx.addShake(0.025)
      if (l) {
        l.position.set(bx, 0.35, bz)
        l.color.setRGB(1, 0.8, 0.55)
        l.intensity = 55
        l.distance = 10
      }
      // hide this cracker
      inst.current.getMatrixAt(i, st.m)
      st.m.makeScale(0, 0, 0)
      inst.current.setMatrixAt(i, st.m)
      changed = true
    }
    if (changed) inst.current.instanceMatrix.needsUpdate = true
    if (l) l.intensity *= Math.exp(-dt * 22)
    if (st.next >= N && F > times[N - 1] + 1.4) {
      R.dropLight()
      rt.done = true
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <instancedMesh ref={inst} args={[crackerGeo, redPaper, N]} castShadow />
        <mesh geometry={fuseGeo} material={fuseMat} />
      </group>
    </group>
  )
}

export function LadiScraps({ spot }) {
  // scraps scattered along the chain
  const { pts } = useMemo(() => layout(spot), [spot])
  const mid = pts[Math.floor(N / 2)]
  return (
    <group position={[mid.x, 0, mid.z]}>
      <Scraps spot={spot} count={16} spread={0.6} color="#4a1410" />
    </group>
  )
}
