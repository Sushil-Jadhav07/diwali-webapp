import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './shared'
import { fx, rand, randDir } from '../crackers/fx'
import { WORLD } from '../world/layout'

// ---------------------------------------------------------------------------
// Non-interactive world beyond the boundary wall: city skyline with lit
// windows, hills, tree silhouettes and tiny distant fireworks. Unlit (Basic)
// materials + instancing keep it cheap; fog fades it into the night.
// ---------------------------------------------------------------------------

function windowsTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 256
  const g = c.getContext('2d')
  const r = mulberry32(31)
  g.fillStyle = '#0b0d1c'
  g.fillRect(0, 0, 128, 256)
  for (let y = 6; y < 256; y += 14) {
    for (let x = 6; x < 128; x += 12) {
      const lit = r()
      if (lit > 0.55) {
        g.fillStyle = lit > 0.9 ? '#ffd27a' : lit > 0.75 ? '#ff9f43' : '#e9d8a6'
        g.globalAlpha = 0.55 + r() * 0.45
        g.fillRect(x, y, 6, 8)
      }
    }
  }
  g.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1)
boxGeo.translate(0, 0.5, 0)
const coneGeo = new THREE.ConeGeometry(1, 1, 6)
coneGeo.translate(0, 0.5, 0)

function Skyline() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: windowsTexture(), color: '#9aa3c8' }), [])
  const items = useMemo(() => {
    const r = mulberry32(77)
    const out = []
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + r() * 0.05
      const rad = 85 + r() * 55
      out.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, w: 8 + r() * 12, d: 8 + r() * 12, h: 14 + r() * (r() > 0.85 ? 70 : 34), ry: r() * Math.PI })
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    items.forEach((b, i) => {
      m.compose(new THREE.Vector3(b.x, -0.5, b.z), q.setFromAxisAngle(up, b.ry), new THREE.Vector3(b.w, b.h, b.d))
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[boxGeo, mat, items.length]} />
}

function Silhouettes() {
  const hills = useRef()
  const trees = useRef()
  const hillItems = useMemo(() => {
    const r = mulberry32(5)
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + r() * 0.2
      const rad = 210 + r() * 60
      return { x: Math.cos(a) * rad, z: Math.sin(a) * rad, s: 60 + r() * 50, h: 25 + r() * 30 }
    })
  }, [])
  const treeItems = useMemo(() => {
    const r = mulberry32(9)
    const out = []
    for (let i = 0; i < 70; i++) {
      // a ring just outside the wall
      const side = i % 4
      const u = r()
      const off = 3 + r() * 6
      let x
      let z
      if (side === 0) [x, z] = [WORLD.minX + u * (WORLD.maxX - WORLD.minX), WORLD.minZ - off]
      else if (side === 1) [x, z] = [WORLD.minX + u * (WORLD.maxX - WORLD.minX), WORLD.maxZ + off]
      else if (side === 2) [x, z] = [WORLD.minX - off, WORLD.minZ + u * (WORLD.maxZ - WORLD.minZ)]
      else [x, z] = [WORLD.maxX + off, WORLD.minZ + u * (WORLD.maxZ - WORLD.minZ)]
      out.push({ x, z, s: 1.6 + r() * 1.6, h: 6 + r() * 6 })
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    hillItems.forEach((h, i) => {
      m.compose(new THREE.Vector3(h.x, -1, h.z), q, new THREE.Vector3(h.s, h.h, h.s))
      hills.current.setMatrixAt(i, m)
    })
    treeItems.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 0, t.z), q, new THREE.Vector3(t.s, t.h, t.s))
      trees.current.setMatrixAt(i, m)
    })
    for (const r of [hills, trees]) {
      r.current.instanceMatrix.needsUpdate = true
      r.current.computeBoundingSphere()
    }
  }, [hillItems, treeItems])
  return (
    <>
      <instancedMesh ref={hills} args={[coneGeo, null, hillItems.length]}>
        <meshBasicMaterial color="#0c0b1e" />
      </instancedMesh>
      <instancedMesh ref={trees} args={[coneGeo, null, treeItems.length]}>
        <meshBasicMaterial color="#0a1410" />
      </instancedMesh>
    </>
  )
}

const HUES = [
  [3, 0.5, 0.4],
  [0.6, 2.6, 0.8],
  [0.6, 1.0, 3],
  [3, 1.8, 0.5],
  [2.6, 0.7, 2.2],
  [0.7, 2.4, 2.6],
]
const _d = [0, 0, 0]

// Tiny far-away fireworks over the city (skipped when the pool is busy).
function DistantFireworks() {
  const next = useRef(2)
  useFrame(({ clock }) => {
    if (!fx.ready) return
    const t = clock.elapsedTime
    if (t < next.current) return
    next.current = t + rand(1.8, 4.5) / Math.max(0.2, fx.ambientScale ?? 1)
    if (fx.sparks.alive > 3200) return
    const a = Math.random() * Math.PI * 2
    const rad = rand(95, 170)
    const x = Math.cos(a) * rad
    const z = Math.sin(a) * rad
    const y = rand(30, 60)
    const c = HUES[(Math.random() * HUES.length) | 0]
    const n = 70 + ((Math.random() * 60) | 0)
    const sp = rand(5, 8)
    for (let i = 0; i < n; i++) {
      randDir(_d)
      fx.spark(x, y, z, _d[0] * sp, _d[1] * sp, _d[2] * sp, rand(1.0, 1.6), c[0], c[1], c[2], 0.5, 1.4, 0.4, 0.05)
    }
  })
  return null
}

export default function Backdrop() {
  return (
    <group>
      <Skyline />
      <Silhouettes />
      <DistantFireworks />
    </group>
  )
}
