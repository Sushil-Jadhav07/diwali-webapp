import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { Scraps, useCrackerResources } from './common'
import { mulberry32 } from '../scene/shared'

// ---------------------------------------------------------------------------
// Pop-pop snappers: a handful of tiny paper twists that snap one after another
// with tiny flashes. (No long fuse: they go off moments after being lit.)
// ---------------------------------------------------------------------------

const N = 12
const twistGeo = (() => {
  const g = new THREE.SphereGeometry(0.012, 8, 6)
  g.scale(1, 1.25, 1)
  return g
})()
const twistMat = new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.85 })

function scatter(spot) {
  const r = mulberry32(Math.floor((spot[0] + 10) * 733 + (spot[1] + 10) * 197))
  return Array.from({ length: N }, () => {
    const a = r() * Math.PI * 2
    const d = 0.05 + r() * 0.3
    return new THREE.Vector3(Math.cos(a) * d, 0.012, Math.sin(a) * d)
  })
}

const _d = [0, 0, 0]

export default function PopPop({ c }) {
  const g = useRef()
  const inst = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const pts = useMemo(() => scatter(c.spot), [c.spot])
  const times = useMemo(() => Array.from({ length: N }, () => rand(0, 2.4)).sort((a, b) => a - b), [])
  const st = useMemo(() => ({ next: 0, m: new THREE.Matrix4() }), [])
  const DELAY = 1.0

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < N; i++) {
      m.makeTranslation(pts[i].x, pts[i].y, pts[i].z)
      inst.current.setMatrixAt(i, m)
    }
    inst.current.instanceMatrix.needsUpdate = true
    inst.current.computeBoundingSphere()
  }, [pts])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const F = state.clock.elapsedTime - rt.litAt - DELAY
    if (F < 0) return
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
    }
    let changed = false
    while (st.next < N && F >= times[st.next]) {
      const i = st.next++
      const px = x + pts[i].x
      const pz = z + pts[i].z
      for (let k = 0; k < 10; k++) {
        randDir(_d)
        const sp = rand(0.8, 2.2)
        fx.spark(px, 0.02, pz, _d[0] * sp, Math.abs(_d[1]) * sp, _d[2] * sp, rand(0.05, 0.14), 5, 4.6, 3.6, 0.06, 4, 0.4, 0.015)
      }
      fx.puff(px, 0.03, pz, 0, 0.2, 0, 1.6, 0.06, 1.4, 0.18)
      fx.burstLight(px, 0.15, pz, new THREE.Color(1, 0.9, 0.7), 6, 0.08, 4)
      R.play('snap', { rate: rand(0.85, 1.3), volume: rand(0.4, 0.7) })
      st.m.makeScale(0, 0, 0)
      inst.current.setMatrixAt(i, st.m)
      changed = true
    }
    if (changed) inst.current.instanceMatrix.needsUpdate = true
    if (st.next >= N && F > times[N - 1] + 1.2) rt.done = true
    void dt
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <instancedMesh ref={inst} args={[twistGeo, twistMat, N]} castShadow />
      </group>
    </group>
  )
}

export function PopPopScraps({ spot }) {
  return <Scraps spot={spot} count={8} spread={0.3} color="#cfc8bb" />
}
