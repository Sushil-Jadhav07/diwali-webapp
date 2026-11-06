import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { mulberry32 } from './shared'

const WARM = [1.0, 0.72, 0.32]
const MULTI = [
  [1.0, 0.25, 0.2],
  [0.25, 1.0, 0.35],
  [0.3, 0.45, 1.0],
  [1.0, 0.85, 0.25],
  [1.0, 0.3, 0.75],
]

function catenary(a, b, sag, spacing, out) {
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

export default function StringLights() {
  const data = useMemo(() => {
    const r = mulberry32(99)
    const bulbs = [] // { p, col, mode, phase }
    const wires = []
    const strand = (pts, mode, colorFn) => {
      for (let i = 0; i < pts.length; i++) {
        bulbs.push({ p: pts[i], col: colorFn(i), mode, phase: r() * Math.PI * 2, idx: i })
        if (i > 0) wires.push(pts[i - 1], pts[i])
      }
    }
    const V = (x, y, z) => new THREE.Vector3(x, y, z)

    // across the courtyard, side-house to side-house
    for (const z of [-3.2, 1.0, 5.2]) strand(catenary(V(-9.55, 5.7, z), V(9.55, 5.7, z), 1.5, 0.36, []), 'warm', () => WARM)
    // diagonals from the back houses
    const diag = [
      [V(-6, 5.8, -7.95), V(-9.55, 5.4, 3.5)],
      [V(6, 5.8, -7.95), V(9.55, 5.4, 3.5)],
      [V(0, 5.9, -7.95), V(-9.55, 5.2, -0.8)],
      [V(0, 5.9, -7.95), V(9.55, 5.2, -0.8)],
    ]
    for (const [a, b] of diag) strand(catenary(a, b, 1.2, 0.4, []), 'chase', (i) => MULTI[i % MULTI.length])

    // curtain (jhalar) lights hanging from the back-row parapets
    for (const h of HOUSES.filter((h) => h.rot === 0)) {
      const top = h.floors * 3 + 0.05
      for (let k = 0; k < 9; k++) {
        const lx = (k / 8 - 0.5) * (h.w - 0.6)
        const len = 2.2 + r() * 0.8
        const pts = []
        for (let j = 0; j * 0.26 < len; j++) pts.push(housePoint(h, lx, top - j * 0.26, 0.16))
        strand(pts, 'twinkle', () => WARM)
      }
    }
    // parapet edge lights on the side houses
    for (const h of HOUSES.filter((h) => h.rot !== 0)) {
      const y = h.floors * 3 + 0.1
      const pts = []
      for (let k = 0; k <= 16; k++) pts.push(housePoint(h, (k / 16 - 0.5) * h.w, y, 0.14))
      strand(pts, 'chase', (i) => MULTI[(i + 2) % MULTI.length])
    }
    return { bulbs, wires }
  }, [])

  const ref = useRef()
  const geo = useMemo(() => new THREE.SphereGeometry(0.05, 6, 4), [])
  const wireGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(data.wires), [data])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const c = new THREE.Color(1, 1, 1)
    data.bulbs.forEach((b, i) => {
      m.makeTranslation(b.p.x, b.p.y, b.p.z)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [data])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const arr = ref.current.instanceColor.array
    const bulbs = data.bulbs
    for (let i = 0; i < bulbs.length; i++) {
      const b = bulbs[i]
      let k
      if (b.mode === 'warm') k = 0.85 + 0.15 * Math.sin(t * 1.5 + b.phase)
      else if (b.mode === 'twinkle') k = 0.45 + 0.55 * Math.max(0, Math.sin(t * 2.2 + b.phase)) ** 3
      else k = ((b.idx + Math.floor(t * 4)) % 3 === 0 ? 1.0 : 0.3)
      const s = 2.4 * k
      arr[i * 3] = b.col[0] * s
      arr[i * 3 + 1] = b.col[1] * s
      arr[i * 3 + 2] = b.col[2] * s
    }
    ref.current.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={ref} args={[geo, null, data.bulbs.length]}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={wireGeo}>
        <lineBasicMaterial color="#120c08" />
      </lineSegments>
    </group>
  )
}
