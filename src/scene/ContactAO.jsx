import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { STALLS, TREES, PARKED_CARS, MANDIR, LAKSHMI, BLOCKS } from '../world/layout'

// Baked-looking ambient occlusion without an AO pass: soft dark strips along
// every facade base and dark pools under stalls, cars, trees, the mandir and
// the Lakshmi corner. Two instanced draw calls.
function gradientTexture(radial) {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const grd = radial ? g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2) : g.createLinearGradient(0, S, 0, 0)
  grd.addColorStop(0, 'rgba(0,0,0,0.85)')
  grd.addColorStop(radial ? 0.55 : 0.35, 'rgba(0,0,0,0.35)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(c)
}

function Inst({ items, tex }) {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false }), [tex])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    items.forEach((it, i) => {
      e.set(-Math.PI / 2, 0, it.rot || 0, 'YXZ')
      e.set(-Math.PI / 2, 0, 0)
      q.setFromEuler(new THREE.Euler(0, it.rot || 0, 0)).multiply(new THREE.Quaternion().setFromEuler(e))
      m.compose(new THREE.Vector3(it.x, 0.016, it.z), q, new THREE.Vector3(it.w, it.d, 1))
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} renderOrder={1} />
}

export default function ContactAO() {
  const lin = useMemo(() => gradientTexture(false), [])
  const rad = useMemo(() => gradientTexture(true), [])
  const strips = useMemo(() => {
    const out = []
    // facade bases: the dark edge sits against the wall (plane +y maps to the wall side)
    for (const h of HOUSES) {
      const p = housePoint(h, 0, 0, 0.75)
      out.push({ x: p.x, z: p.z, w: h.w, d: 1.5, rot: h.rot + Math.PI })
    }
    // block side walls
    for (const b of BLOCKS) {
      const cx = (b.minX + b.maxX) / 2
      const cz = (b.minZ + b.maxZ) / 2
      if (b.facing === '+z' || b.facing === '-z') {
        out.push({ x: b.minX - 0.6, z: cz, w: b.maxZ - b.minZ, d: 1.2, rot: Math.PI / 2 })
        out.push({ x: b.maxX + 0.6, z: cz, w: b.maxZ - b.minZ, d: 1.2, rot: -Math.PI / 2 })
      } else {
        out.push({ x: cx, z: b.minZ - 0.6, w: b.maxX - b.minX, d: 1.2, rot: 0 })
        out.push({ x: cx, z: b.maxZ + 0.6, w: b.maxX - b.minX, d: 1.2, rot: Math.PI })
      }
    }
    return out
  }, [])
  const pools = useMemo(() => {
    const out = []
    for (const s of STALLS) out.push({ x: s.x, z: s.z, w: s.w + 1.6, d: s.d + 1.6 })
    for (const t of TREES) out.push({ x: t.x, z: t.z, w: 3.2 * t.s, d: 3.2 * t.s })
    for (const c of PARKED_CARS) out.push({ x: c.x, z: c.z, w: 2.6, d: 5.0 })
    out.push({ x: MANDIR.x, z: MANDIR.z, w: 6.5, d: 6.5 })
    out.push({ x: LAKSHMI.x, z: LAKSHMI.z, w: 3.8, d: 2.8 })
    return out
  }, [])
  return (
    <group>
      <Inst items={strips} tex={lin} />
      <Inst items={pools} tex={rad} />
    </group>
  )
}
