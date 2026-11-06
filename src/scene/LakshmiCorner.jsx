import { useMemo } from 'react'
import * as THREE from 'three'
import { LAKSHMI } from '../world/layout'
import Glows from './society/Glows'
import Marigolds, { swag, hang } from './society/Marigolds'

// ---------------------------------------------------------------------------
// Lakshmi-puja corner beside Block B: a draped chowki (platform) with a framed
// painting (lotus, coins, "शुभ लाभ", footprints), a kalash with mango leaves and
// a coconut, flower bowls, diyas and marigold torans. Emissive + glow sprites.
// ---------------------------------------------------------------------------

function paintingTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 640
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  const paint = () => {
    const grd = g.createRadialGradient(256, 300, 40, 256, 300, 360)
    grd.addColorStop(0, '#fff1c1')
    grd.addColorStop(0.5, '#f6b94a')
    grd.addColorStop(1, '#a3361b')
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 640)
    // halo
    g.strokeStyle = 'rgba(255,255,255,0.8)'
    g.lineWidth = 10
    g.beginPath()
    g.arc(256, 230, 120, 0, Math.PI * 2)
    g.stroke()
    // lotus seat
    g.fillStyle = '#e11d74'
    for (let i = -3; i <= 3; i++) {
      g.beginPath()
      g.ellipse(256 + i * 44, 470, 30, 70, i * 0.25, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#f9a8d4'
    for (let i = -2; i <= 2; i++) {
      g.beginPath()
      g.ellipse(256 + i * 40, 485, 22, 50, i * 0.25, 0, Math.PI * 2)
      g.fill()
    }
    // stylised seated figure (simple, respectful silhouette in red and gold)
    g.fillStyle = '#b91c1c'
    g.beginPath()
    g.moveTo(170, 440)
    g.quadraticCurveTo(256, 250, 342, 440)
    g.closePath()
    g.fill()
    g.fillStyle = '#c68642'
    g.beginPath()
    g.arc(256, 230, 46, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#facc15'
    g.beginPath()
    g.moveTo(216, 200)
    g.lineTo(236, 160)
    g.lineTo(256, 196)
    g.lineTo(276, 160)
    g.lineTo(296, 200)
    g.closePath()
    g.fill()
    // falling gold coins
    g.fillStyle = '#fde047'
    for (let i = 0; i < 9; i++) {
      g.beginPath()
      g.arc(150 + i * 26, 520 + Math.sin(i) * 12, 9, 0, Math.PI * 2)
      g.fill()
    }
    // shubh labh
    g.fillStyle = '#7c2d12'
    g.font = '700 54px "Baloo 2", "Nirmala UI", sans-serif'
    g.textAlign = 'center'
    g.fillText('शुभ', 96, 110)
    g.fillText('लाभ', 416, 110)
    // footprints
    g.fillStyle = '#dc2626'
    for (const x of [216, 296]) {
      g.beginPath()
      g.ellipse(x, 600, 16, 26, 0, 0, Math.PI * 2)
      g.fill()
    }
    t.needsUpdate = true
  }
  paint()
  document.fonts?.ready?.then(paint)
  return t
}

const M = {
  red: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.75 }),
  gold: new THREE.MeshStandardMaterial({ color: '#d4a02c', roughness: 0.35, metalness: 0.75 }),
  wood: new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.8 }),
  brass: new THREE.MeshStandardMaterial({ color: '#c99a2e', roughness: 0.3, metalness: 0.85 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#2f7a32', roughness: 0.7, side: THREE.DoubleSide }),
  coconut: new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.95 }),
  clay: new THREE.MeshStandardMaterial({ color: '#9a4a22', roughness: 0.9 }),
  flame: new THREE.MeshBasicMaterial({ color: [6, 3, 0.8], toneMapped: false }),
}

export default function LakshmiCorner() {
  const tex = useMemo(() => paintingTexture(), [])
  const L = LAKSHMI
  const flowers = useMemo(() => {
    const pts = []
    // toran above the frame + hanging strands
    swag(new THREE.Vector3(-1.2, 2.25, -0.5), new THREE.Vector3(1.2, 2.25, -0.5), 0.3, 0.07, pts)
    for (let k = 0; k < 7; k++) hang(new THREE.Vector3(-1.05 + k * 0.35, 2.15 - Math.sin(((k + 0.5) / 7) * Math.PI) * 0.3, -0.5), 0.3 + (k % 2) * 0.2, 0.06, pts)
    // flowers around the chowki edge
    for (let i = 0; i < 24; i++) pts.push(new THREE.Vector3(-1.2 + (i / 23) * 2.4, 0.62, 0.62))
    return pts.map((p) => p.add(new THREE.Vector3(L.x, 0, L.z)))
  }, [L])
  const diyaPos = useMemo(() => [-1.0, -0.6, 0.6, 1.0].map((x) => [x, 0.64, 0.45]), [])
  const glows = useMemo(
    () => [
      ...diyaPos.map(([x, y, z]) => ({ p: [L.x + x, y + 0.08, L.z + z], size: 0.8, color: [1, 0.6, 0.25], flicker: true })),
      { p: [L.x, 1.4, L.z - 0.4], size: 3.4, color: [1, 0.72, 0.4] },
    ],
    [L, diyaPos],
  )
  return (
    <group>
      <group position={[L.x, 0, L.z]} rotation-y={L.rot}>
        {/* draped chowki */}
        <mesh position={[0, 0.3, 0]} material={M.red} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.6, 1.4]} />
        </mesh>
        <mesh position={[0, 0.605, 0]} material={M.gold}>
          <boxGeometry args={[2.42, 0.02, 1.42]} />
        </mesh>
        {/* framed painting */}
        <mesh position={[0, 1.35, -0.55]} material={M.wood}>
          <boxGeometry args={[1.05, 1.3, 0.06]} />
        </mesh>
        <mesh position={[0, 1.35, -0.515]}>
          <planeGeometry args={[0.92, 1.15]} />
          <meshStandardMaterial map={tex} roughness={0.7} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.35} />
        </mesh>
        {/* kalash with mango leaves and a coconut */}
        <group position={[0.7, 0.61, -0.1]}>
          <mesh position={[0, 0.13, 0]} material={M.brass}>
            <sphereGeometry args={[0.13, 18, 14]} />
          </mesh>
          <mesh position={[0, 0.27, 0]} material={M.brass}>
            <cylinderGeometry args={[0.06, 0.08, 0.08, 16]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[Math.cos((i / 6) * Math.PI * 2) * 0.08, 0.33, Math.sin((i / 6) * Math.PI * 2) * 0.08]} rotation={[0.9, (i / 6) * Math.PI * 2, 0]} material={M.leaf} scale={[0.05, 0.14, 1]}>
              <planeGeometry args={[1, 1]} />
            </mesh>
          ))}
          <mesh position={[0, 0.4, 0]} material={M.coconut} scale={[1, 1.15, 1]}>
            <sphereGeometry args={[0.07, 14, 10]} />
          </mesh>
        </group>
        {/* flower bowls and a brass thali */}
        <mesh position={[-0.7, 0.63, -0.1]} material={M.brass}>
          <cylinderGeometry args={[0.2, 0.18, 0.03, 20]} />
        </mesh>
        {diyaPos.map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh material={M.clay}>
              <cylinderGeometry args={[0.06, 0.04, 0.035, 12]} />
            </mesh>
            <mesh material={M.flame} position={[0, 0.05, 0]} scale={[0.015, 0.035, 0.015]}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
      </group>
      <Marigolds points={flowers} size={0.045} />
      <Glows items={glows} />
    </group>
  )
}
