import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Points along a sagging garland between a and b.
export function swag(a, b, sag, spacing, out = []) {
  const len = a.distanceTo(b)
  const n = Math.max(2, Math.round(len / spacing))
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = new THREE.Vector3().lerpVectors(a, b, u)
    p.y -= Math.sin(u * Math.PI) * sag
    out.push(p)
  }
  return out
}

// Straight vertical string of flowers from top point downwards.
export function hang(top, length, spacing, out = []) {
  const n = Math.max(1, Math.round(length / spacing))
  for (let i = 0; i <= n; i++) out.push(new THREE.Vector3(top.x, top.y - i * spacing, top.z))
  return out
}

const flowerGeo = new THREE.IcosahedronGeometry(1, 0)
const flowerMat = new THREE.MeshStandardMaterial({ roughness: 0.85, emissive: '#6a2600', emissiveIntensity: 0.45 })
const ORANGE = new THREE.Color('#ff7a12')
const YELLOW = new THREE.Color('#ffc21a')
const RED = new THREE.Color('#e2341d')

// Instanced marigold flowers (one draw call per garland set).
export default function Marigolds({ points, size = 0.045 }) {
  const ref = useRef()
  const n = points.length
  useLayoutEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const e = new THREE.Euler()
    points.forEach((p, i) => {
      const k = size * (0.85 + ((i * 37) % 10) / 40)
      e.set(i * 1.3, i * 2.1, 0)
      q.setFromEuler(e)
      m.compose(p, q, s.set(k, k, k))
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, i % 7 === 3 ? RED : i % 3 === 0 ? YELLOW : ORANGE)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [points, size])
  const args = useMemo(() => [flowerGeo, flowerMat, n], [n])
  if (!n) return null
  return <instancedMesh ref={ref} args={args} />
}
