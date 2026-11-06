import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'

// Clay diya bowl profile (lathe).
const bowlGeo = (() => {
  const pts = [
    [0, 0],
    [0.05, 0.0],
    [0.075, 0.018],
    [0.085, 0.04],
    [0.07, 0.042],
    [0.055, 0.026],
    [0, 0.024],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 12)
})()
const flameGeo = (() => {
  const g = new THREE.SphereGeometry(1, 8, 6)
  g.translate(0, 1, 0)
  return g
})()

export const DIYA_POSITIONS = (() => {
  const list = []
  // ring around the main rangoli
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    list.push(new THREE.Vector3(Math.cos(a) * 1.95, 0, -6.4 + Math.sin(a) * 1.95))
  }
  // ring around the small rangoli
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    list.push(new THREE.Vector3(3.4 + Math.cos(a) * 1.1, 0, 3.6 + Math.sin(a) * 1.1))
  }
  // along every house plinth
  for (const h of HOUSES) {
    for (const lx of [-2.2, -1.2, 1.2, 2.2]) list.push(housePoint(h, lx, 0.4, 0.3))
  }
  return list
})()

export default function Diyas() {
  const bowls = useRef()
  const flames = useRef()
  const n = DIYA_POSITIONS.length
  const phases = useMemo(() => DIYA_POSITIONS.map(() => Math.random() * 100), [])
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const s = useMemo(() => new THREE.Vector3(), [])
  const p = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    DIYA_POSITIONS.forEach((pos, i) => {
      m.makeTranslation(pos.x, pos.y, pos.z)
      bowls.current.setMatrixAt(i, m)
    })
    bowls.current.instanceMatrix.needsUpdate = true
    bowls.current.computeBoundingSphere()
  }, [m])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < n; i++) {
      const pos = DIYA_POSITIONS[i]
      const ph = phases[i]
      const f = 0.85 + 0.15 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph * 2)
      p.set(pos.x + 0.035, pos.y + 0.035, pos.z)
      s.set(0.016, 0.032 * f, 0.016)
      m.compose(p, q, s)
      flames.current.setMatrixAt(i, m)
    }
    flames.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bowls} args={[bowlGeo, null, n]} castShadow>
        <meshStandardMaterial color="#9a4a22" roughness={0.85} emissive="#5a1e05" emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh ref={flames} args={[flameGeo, null, n]} frustumCulled={false}>
        <meshBasicMaterial color={[6, 3.0, 0.8]} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

// A few flickering warm lights representing diya clusters.
export function DiyaLights() {
  const refs = useRef([])
  const spots = useMemo(
    () => [
      [0, 0.45, -6.4, 7],
      [3.4, 0.4, 3.6, 4],
    ],
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((l, i) => {
      if (!l) return
      l.intensity = spots[i][3] * (0.85 + 0.15 * Math.sin(t * 11 + i * 3) * Math.sin(t * 5.7 + i))
    })
  })
  return spots.map(([x, y, z, k], i) => (
    <pointLight key={i} ref={(el) => (refs.current[i] = el)} position={[x, y, z]} color="#ff9a3c" intensity={k} distance={7} decay={1.6} />
  ))
}
