import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { MANDIR_DIYAS, RANGOLI_MAIN, RANGOLI_SMALL, WALL, mandirPoint } from './society/layout'

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
  // ring around the main rangoli (skip the part tucked against the house plinth)
  const R = RANGOLI_MAIN.r + 0.3
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    const z = RANGOLI_MAIN.z + Math.sin(a) * R
    if (z < -7.45) continue
    list.push(new THREE.Vector3(RANGOLI_MAIN.x + Math.cos(a) * R, 0, z))
  }
  // ring around the small rangoli
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    list.push(new THREE.Vector3(RANGOLI_SMALL.x + Math.cos(a) * (RANGOLI_SMALL.r + 0.2), 0, RANGOLI_SMALL.z + Math.sin(a) * (RANGOLI_SMALL.r + 0.2)))
  }
  // along every house plinth
  for (const h of HOUSES) {
    for (const lx of [-2.2, -1.2, 1.2, 2.2]) list.push(housePoint(h, lx, 0.4, 0.3))
  }
  // mandir steps, plinth edge and porch
  for (const [x, y, z] of MANDIR_DIYAS) list.push(mandirPoint(x, y, z))
  // on top of the front boundary wall
  for (let x = 3.3; x <= 9.4; x += 1.25) {
    list.push(new THREE.Vector3(x, WALL.h + 0.08, WALL.z))
    list.push(new THREE.Vector3(-x, WALL.h + 0.08, WALL.z))
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
