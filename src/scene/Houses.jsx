import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from './shared'
import { makePlasterTexture } from './textures'
import { SEGMENTS } from '../world/layout'

// Apartment blocks of Asynk Family Residency, expanded into facade segments
// (world/layout.js). Each segment: { x, z, rot, w, d, floors, color, tone }.
export const HOUSES = SEGMENTS

const FLOOR_H = 3

// world-space point at house-local coordinates (lx along facade, ly up, lz out of facade)
export function housePoint(h, lx, ly, lz, out = new THREE.Vector3()) {
  const c = Math.cos(h.rot)
  const s = Math.sin(h.rot)
  // local +z is the facade normal; rotate around Y
  out.set(h.x + lx * c + (h.d / 2 + lz) * s, ly, h.z - lx * s + (h.d / 2 + lz) * c)
  return out
}

export default function Houses() {
  const plaster = useMemo(() => makePlasterTexture(), [])
  const rnd = useMemo(() => mulberry32(5), [])

  // Build instance transforms for windows (lit / dark), doors, chajjas, kandils.
  const layout = useMemo(() => {
    const litWin = []
    const darkWin = []
    const doors = []
    const chajja = []
    const kandil = []
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const sc = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    for (const h of HOUSES) {
      q.setFromAxisAngle(up, h.rot)
      const cols = 3
      for (let f = 0; f < h.floors; f++) {
        for (let k = 0; k < cols; k++) {
          const lx = (k - (cols - 1) / 2) * (h.w / cols)
          if (f === 0 && k === 1) {
            housePoint(h, lx, 1.1, 0.03, p)
            m.compose(p, q, sc.set(1.2, 2.2, 1))
            doors.push(m.clone())
            continue
          }
          const ly = f * FLOOR_H + 1.6
          housePoint(h, lx, ly, 0.02, p)
          m.compose(p, q, sc.set(0.95, 1.25, 1))
          ;(rnd() > 0.35 ? litWin : darkWin).push(m.clone())
          housePoint(h, lx, ly + 0.85, 0.2, p)
          m.compose(p, q, sc.set(1.35, 0.08, 0.45))
          chajja.push(m.clone())
        }
        if (f > 0 && rnd() > 0.35) {
          housePoint(h, (rnd() - 0.5) * h.w * 0.6, f * FLOOR_H + 0.6, 0.55, p)
          kandil.push(p.clone())
        }
      }
    }
    return { litWin, darkWin, doors, chajja, kandil }
  }, [rnd])

  return (
    <group>
      {HOUSES.map((h, i) => (
        <HouseBody key={i} h={h} plaster={plaster} />
      ))}
      <Instances mats={layout.litWin} geometry="plane">
        <meshStandardMaterial color="#2a1608" emissive="#ff9440" emissiveIntensity={1.15} toneMapped={false} />
      </Instances>
      <Instances mats={layout.darkWin} geometry="plane">
        <meshStandardMaterial color="#141a33" roughness={0.3} metalness={0.4} />
      </Instances>
      <Instances mats={layout.doors} geometry="plane">
        <meshStandardMaterial color="#6b3a1e" roughness={0.7} />
      </Instances>
      <Instances mats={layout.chajja} geometry="box" castShadow>
        <meshStandardMaterial color="#d9cbb8" roughness={0.9} />
      </Instances>
      {layout.kandil.map((p, i) => (
        <Kandil key={i} position={p} hue={i} />
      ))}
    </group>
  )
}

function HouseBody({ h, plaster }) {
  const height = h.floors * FLOOR_H
  const tex = useMemo(() => {
    const t = plaster.clone()
    t.repeat.set(h.w / 2, height / 2)
    t.needsUpdate = true
    return t
  }, [plaster, h.w, height])
  return (
    <group position={[h.x, 0, h.z]} rotation-y={h.rot}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[h.w, height, h.d]} />
        <meshStandardMaterial color={h.tone ? new THREE.Color(h.color).offsetHSL(0, -0.04, 0.05) : h.color} map={tex} roughness={0.92} />
      </mesh>
      {/* parapet */}
      <mesh position={[0, height + 0.25, 0]} castShadow>
        <boxGeometry args={[h.w + 0.2, 0.5, h.d + 0.2]} />
        <meshStandardMaterial color="#efe4d2" roughness={0.9} />
      </mesh>
      {/* floor band / plinth */}
      <mesh position={[0, 0.2, h.d / 2 + 0.25]} receiveShadow castShadow>
        <boxGeometry args={[h.w, 0.4, 0.5]} />
        <meshStandardMaterial color="#9c8a7a" roughness={0.95} />
      </mesh>
      {Array.from({ length: h.floors - 1 }, (_, f) => (
        <mesh key={f} position={[0, (f + 1) * FLOOR_H, h.d / 2 + 0.04]}>
          <boxGeometry args={[h.w + 0.05, 0.14, 0.1]} />
          <meshStandardMaterial color="#efe4d2" roughness={0.9} />
        </mesh>
      ))}
      {/* toran over the door: marigold string */}
      <Toran y={2.35} z={h.d / 2 + 0.08} />
    </group>
  )
}

const marigoldGeo = new THREE.IcosahedronGeometry(0.07, 0)
function Toran({ y, z }) {
  const ref = useRef()
  const n = 15
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      const x = (u - 0.5) * 1.5
      const sag = Math.sin(u * Math.PI) * 0.22
      m.makeTranslation(x, y - sag, z)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(i % 3 === 0 ? '#facc15' : '#f97316'))
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [y, z])
  return (
    <instancedMesh ref={ref} args={[marigoldGeo, null, n]}>
      <meshStandardMaterial roughness={0.8} emissive="#7a2c00" emissiveIntensity={0.25} />
    </instancedMesh>
  )
}

const planeGeo = new THREE.PlaneGeometry(1, 1)
const boxGeo = new THREE.BoxGeometry(1, 1, 1)

function Instances({ mats, geometry, children, castShadow }) {
  const ref = useRef()
  useLayoutEffect(() => {
    mats.forEach((m, i) => ref.current.setMatrixAt(i, m))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [mats])
  if (!mats.length) return null
  return (
    <instancedMesh
      ref={ref}
      args={[geometry === 'box' ? boxGeo : planeGeo, null, mats.length]}
      castShadow={castShadow}
      receiveShadow
    >
      {children}
    </instancedMesh>
  )
}

const kandilColors = ['#ff6a2a', '#ff2d6f', '#ffc23a', '#ff7b00']
function Kandil({ position, hue }) {
  const col = kandilColors[hue % kandilColors.length]
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 1, 4]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={2.2} toneMapped={false} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.3, 5]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
