import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { mulberry32 } from './shared'
import { FESTOON_POLES, FESTOON_H, LAMP_POSTS, LAMP_H, BAZAAR } from '../world/layout'

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

    // festoons around the Cracker Ground, pole to pole, plus two crossing strands
    const P = FESTOON_POLES.map((f) => V(f.x, FESTOON_H - 0.1, f.z))
    for (let i = 0; i < P.length; i++) strand(catenary(P[i], P[(i + 1) % P.length], 0.7, 0.4, []), 'chase', (k) => MULTI[(k + i) % MULTI.length])
    strand(catenary(P[0], P[4], 2.2, 0.42, []), 'warm', () => WARM)
    strand(catenary(P[2], P[6], 2.2, 0.42, []), 'warm', () => WARM)
    // zig-zag over the main lane between lamp posts
    const lane = LAMP_POSTS.filter((l) => Math.abs(l.x) < 5).sort((a, b) => a.z - b.z || a.x - b.x)
    for (let i = 0; i + 1 < lane.length; i++) {
      const A = lane[i]
      const B = lane[i + 1]
      strand(catenary(V(A.x, LAMP_H - 0.3, A.z), V(B.x, LAMP_H - 0.3, B.z), 0.5, 0.36, []), 'twinkle', () => WARM)
    }
    // across the bazaar lane, canopy to canopy
    for (let x = BAZAAR.minX + 1.4; x < BAZAAR.maxX - 1; x += 2.8)
      strand(catenary(V(x, 3.5, BAZAAR.laneZ - 3.1), V(x + 1.2, 3.5, BAZAAR.laneZ + 3.1), 0.45, 0.34, []), 'chase', (k) => MULTI[k % MULTI.length])

    // curtain (jhalar) lights + parapet chasers on every block segment
    for (const h of HOUSES) {
      const top = h.floors * 3 + 0.05
      for (let k = 0; k < 7; k++) {
        const lx = (k / 6 - 0.5) * (h.w - 0.8)
        const len = 2.2 + r() * 0.8
        const pts = []
        for (let j = 0; j * 0.28 < len; j++) pts.push(housePoint(h, lx, top - j * 0.28, 0.16))
        strand(pts, 'twinkle', () => WARM)
      }
      const pts = []
      for (let k = 0; k <= 14; k++) pts.push(housePoint(h, (k / 14 - 0.5) * h.w, top + 0.05, 0.14))
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
      <Poles />
      <lineSegments geometry={wireGeo}>
        <lineBasicMaterial color="#120c08" />
      </lineSegments>
    </group>
  )
}

const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, FESTOON_H, 6)
poleGeo.translate(0, FESTOON_H / 2, 0)
const poleMat = new THREE.MeshStandardMaterial({ color: '#a07a44', roughness: 0.9 })
function Poles() {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    FESTOON_POLES.forEach((f, i) => ref.current.setMatrixAt(i, m.makeTranslation(f.x, 0, f.z)))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [])
  return <instancedMesh ref={ref} args={[poleGeo, poleMat, FESTOON_POLES.length]} />
}
