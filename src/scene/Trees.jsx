import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from './shared'
import { TREES } from '../world/layout'

// Neem/peepal-style trees on raised chabutras, fully instanced (3 draw calls).
const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 3.2, 7)
trunkGeo.translate(0, 1.6, 0)
const blobGeo = new THREE.IcosahedronGeometry(1, 1)
const baseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.4, 12)
baseGeo.translate(0, 0.2, 0)
const trunkMat = new THREE.MeshStandardMaterial({ color: '#3b2a20', roughness: 1 })
const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true })
const baseMat = new THREE.MeshStandardMaterial({ color: '#8f7c6b', roughness: 0.95 })
const LEAF = ['#2b5a34', '#336b3c', '#244d2c']

export default function Trees() {
  const trunks = useRef()
  const leaves = useRef()
  const bases = useRef()
  const blobs = useMemo(() => {
    const out = []
    TREES.forEach((t, k) => {
      const r = mulberry32(4 + k * 13)
      for (let i = 0; i < 6; i++)
        out.push({
          x: t.x + (r() - 0.5) * 2.2 * t.s,
          y: (3.6 + r() * 1.6) * t.s,
          z: t.z + (r() - 0.5) * 2.2 * t.s,
          s: (0.9 + r() * 0.7) * t.s,
          c: LEAF[Math.floor(r() * 3)],
        })
    })
    return out
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const c = new THREE.Color()
    TREES.forEach((t, i) => {
      m.compose(p.set(t.x, 0, t.z), q, s.setScalar(t.s))
      trunks.current.setMatrixAt(i, m)
      bases.current.setMatrixAt(i, m)
    })
    blobs.forEach((b, i) => {
      m.compose(p.set(b.x, b.y, b.z), q, s.setScalar(b.s))
      leaves.current.setMatrixAt(i, m)
      leaves.current.setColorAt(i, c.set(b.c))
    })
    for (const r of [trunks, bases, leaves]) {
      r.current.instanceMatrix.needsUpdate = true
      r.current.computeBoundingSphere()
    }
    leaves.current.instanceColor.needsUpdate = true
  }, [blobs])

  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeo, trunkMat, TREES.length]} castShadow />
      <instancedMesh ref={bases} args={[baseGeo, baseMat, TREES.length]} receiveShadow />
      <instancedMesh ref={leaves} args={[blobGeo, leafMat, blobs.length]} castShadow />
    </group>
  )
}
