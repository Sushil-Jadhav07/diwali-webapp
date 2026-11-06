import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dangerZones } from '../world/safety'

// Pulsing safety rings on the ground for every active danger zone (player and
// NPC crackers). A small fixed pool: no allocations, no re-renders.
const POOL = 8

function ringTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.translate(S / 2, S / 2)
  // dashed outer ring
  g.strokeStyle = 'rgba(255,255,255,1)'
  g.lineWidth = 10
  g.setLineDash([22, 14])
  g.beginPath()
  g.arc(0, 0, S / 2 - 8, 0, Math.PI * 2)
  g.stroke()
  // soft inner fill fading to the edge
  const grd = g.createRadialGradient(0, 0, S * 0.1, 0, 0, S / 2 - 12)
  grd.addColorStop(0, 'rgba(255,255,255,0)')
  grd.addColorStop(1, 'rgba(255,255,255,0.22)')
  g.fillStyle = grd
  g.beginPath()
  g.arc(0, 0, S / 2 - 12, 0, Math.PI * 2)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  return t
}

export default function DangerRings() {
  const refs = useRef([])
  const tex = useMemo(() => ringTexture(), [])
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2), [])
  const mats = useMemo(
    () =>
      Array.from(
        { length: POOL },
        () =>
          new THREE.MeshBasicMaterial({
            map: tex,
            color: new THREE.Color(1.6, 0.45, 0.2),
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [tex],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < POOL; i++) {
      const m = refs.current[i]
      if (!m) continue
      const d = dangerZones[i]
      m.visible = !!d
      if (!d) continue
      m.position.set(d.x, 0.03, d.z)
      m.scale.setScalar(d.r)
      m.rotation.z = t * 0.25
      m.material.opacity = 0.45 + 0.25 * Math.sin(t * 4 + i)
    }
  })
  return (
    <group>
      {mats.map((mat, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geo} material={mat} rotation-x={-Math.PI / 2} visible={false} renderOrder={2} />
      ))}
    </group>
  )
}
