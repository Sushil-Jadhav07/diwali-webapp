import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { glowTexture } from './textures'
import { LAMP_POSTS, STALLS, GATE, MANDIR, LAKSHMI, FESTOON_POLES, SECURITY_CABIN } from '../world/layout'
import { HOUSES, housePoint } from './Houses'

// Fake light: warm additive pools on the ground under lamps, stalls, doors,
// the gate, the mandir and the Lakshmi corner. One instanced draw call, no
// scene lights, so dark corners glow without costing frame rate.
export default function LightPools() {
  const ref = useRef()
  const pools = useMemo(() => {
    const out = []
    const warm = [1.0, 0.62, 0.3]
    const add = (x, z, r, c = warm, k = 1) => out.push({ x, z, r, c: [c[0] * k, c[1] * k, c[2] * k], ph: Math.random() * 10 })
    for (const l of LAMP_POSTS) add(l.x + l.dir * 0.6, l.z, 5.2, [1, 0.72, 0.42], 0.9)
    for (const s of STALLS) add(s.x, s.z + (s.facing === '-z' ? -2.2 : 2.2), 4.2, warm, 0.95)
    for (const h of HOUSES) {
      const p = housePoint(h, 0, 0, 1.4)
      add(p.x, p.z, 3.4, warm, 0.7)
    }
    for (const f of FESTOON_POLES) add(f.x, f.z, 4.5, [1, 0.7, 0.4], 0.6)
    add(GATE.x, GATE.z - 2.4, 6.5, [1, 0.7, 0.4], 0.95)
    add(SECURITY_CABIN.x, SECURITY_CABIN.z - 2, 3.5, [1, 0.8, 0.5], 0.7)
    add(MANDIR.x - Math.sin(-MANDIR.rot) * 2.5, MANDIR.z + Math.cos(MANDIR.rot) * 2.5, 6.5, [1, 0.6, 0.25], 1.1)
    add(LAKSHMI.x, LAKSHMI.z + 1.6, 4.5, [1, 0.6, 0.28], 1.0)
    return out
  }, [])
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2), [])
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    const c = new THREE.Color()
    pools.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, 0.025, p.z), q, new THREE.Vector3(p.r, p.r, 1))
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.setRGB(...p.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [pools])
  // a slow, gentle flicker like real lamps and diyas
  useFrame(({ clock }) => {
    mat.opacity = 0.66 + Math.sin(clock.elapsedTime * 1.7) * 0.03
  })
  return <instancedMesh ref={ref} args={[geo, mat, pools.length]} renderOrder={1} />
}
