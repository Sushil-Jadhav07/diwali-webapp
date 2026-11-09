import { useMemo } from 'react'
import * as THREE from 'three'
import { makeRangoliTexture } from './textures'
import { RANGOLI_MAIN, RANGOLI_SMALL } from './society/layout'
import { WORLD, MAIN_LANE, CROSS_LANE, CRACKER_GROUND, BAZAAR, PLAY_AREA, PLAY_ITEMS } from '../world/layout'
import { mulberry32 } from './shared'
import { useStore } from '../store/useStore'
import { translate } from '../i18n/index.js'
import { pbr, useDetail } from './pbr'

function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  return t
}

const noise = (g, w, h, n, seed, light = '255,255,255', dark = '0,0,0', a = 0.06) => {
  const r = mulberry32(seed)
  for (let k = 0; k < n; k++) {
    g.fillStyle = `rgba(${r() > 0.5 ? light : dark},${a * (0.4 + r())})`
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
  }
}

// Cracker Ground: packed concrete with safety markings and numbered pads.
function crackerGroundTex(lang = 'en') {
  const T = (k) => translate(lang, k)
  const sec = lang === 'en' ? 'hi' : 'en'
  const W = 1024
  const H = Math.round((W * (CRACKER_GROUND.maxZ - CRACKER_GROUND.minZ)) / (CRACKER_GROUND.maxX - CRACKER_GROUND.minX))
  return canvasTex(W, H, (g, w, h) => {
    g.fillStyle = '#5c4b43'
    g.fillRect(0, 0, w, h)
    noise(g, w, h, 9000, 9, '255,240,220', '20,10,5', 0.07)
    g.strokeStyle = 'rgba(250,204,21,0.85)'
    g.lineWidth = 8
    g.setLineDash([28, 18])
    g.strokeRect(14, 14, w - 28, h - 28)
    g.setLineDash([])
    // launch pads in two rows
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    let n = 1
    for (const fy of [0.33, 0.67]) {
      for (const fx of [0.14, 0.32, 0.5, 0.68, 0.86]) {
        const x = fx * w
        const y = fy * h
        g.strokeStyle = 'rgba(255,255,255,0.55)'
        g.lineWidth = 5
        g.beginPath()
        g.arc(x, y, 46, 0, Math.PI * 2)
        g.stroke()
        g.strokeStyle = 'rgba(249,115,22,0.6)'
        g.beginPath()
        g.arc(x, y, 30, 0, Math.PI * 2)
        g.stroke()
        g.fillStyle = 'rgba(255,255,255,0.7)'
        g.font = '700 30px Fredoka, sans-serif'
        g.fillText(String(n++), x, y + 1)
      }
    }
    g.fillStyle = 'rgba(253,233,176,0.8)'
    g.font = '700 44px Fredoka, sans-serif'
    g.font = '700 44px Fredoka, "Baloo 2", sans-serif'
    g.fillText(`${T('sign.groundTitle')}  •  ${translate(sec, 'sign.groundTitle')}`, w / 2, 58)
    g.font = '600 30px Fredoka, sans-serif'
    g.fillStyle = 'rgba(253,233,176,0.65)'
    g.font = '600 30px Fredoka, "Baloo 2", sans-serif'
    g.fillText(`${T('sign.groundSafe')}  •  ${translate(sec, 'sign.groundSafe')}`, w / 2, h - 52)
  })
}

// painted centre dashes on the main lane (the asphalt texture has none)
function LaneDashes() {
  const zs = []
  for (let z = MAIN_LANE.minZ + 1.6; z < MAIN_LANE.maxZ - 1; z += 3.4) zs.push(z)
  return zs.map((z) => (
    <mesh key={z} rotation-x={-Math.PI / 2} position={[(MAIN_LANE.minX + MAIN_LANE.maxX) / 2, 0.009, z]}>
      <planeGeometry args={[0.14, 1.7]} />
      <meshStandardMaterial color="#e9d9a6" roughness={0.7} />
    </mesh>
  ))
}

function Plane({ x, z, w, d, y = 0.004, children }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, y, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      {children}
    </mesh>
  )
}

const rect = (r) => ({ x: (r.minX + r.maxX) / 2, z: (r.minZ + r.maxZ) / 2, w: r.maxX - r.minX, d: r.maxZ - r.minZ })

export default function Ground() {
  // CC0 Poly Haven PBR sets (1K); normal/roughness maps are dropped on the Low tier
  const paving = useMemo(() => pbr('patterned_paving', [(WORLD.maxX - WORLD.minX) / 2.6, (WORLD.maxZ - WORLD.minZ) / 2.6]), [])
  const laneM = useMemo(() => pbr('asphalt_02', [(MAIN_LANE.maxX - MAIN_LANE.minX) / 3.5, (MAIN_LANE.maxZ - MAIN_LANE.minZ) / 3.5]), [])
  const laneC = useMemo(() => pbr('asphalt_02', [(CROSS_LANE.maxX - CROSS_LANE.minX) / 3.5, (CROSS_LANE.maxZ - CROSS_LANE.minZ) / 3.5]), [])
  const grass = useMemo(() => pbr('leafy_grass', [(PLAY_AREA.maxX - PLAY_AREA.minX) / 2.2, (PLAY_AREA.maxZ - PLAY_AREA.minZ) / 2.2]), [])
  const bazaarFloor = useMemo(() => pbr('patterned_paving', [(BAZAAR.maxX - BAZAAR.minX) / 2, 6.4 / 2], ['nor', 'rough']), [])
  const pavingRef = useDetail(paving)
  const laneMRef = useDetail(laneM)
  const laneCRef = useDetail(laneC)
  const grassRef = useDetail(grass)
  const bazaarRef = useDetail(bazaarFloor)
  const lang = useStore((s) => s.lang)
  const groundTex = useMemo(() => crackerGroundTex(lang), [lang])
  const rangoli = useMemo(() => makeRangoliTexture(3, { size: 2048, variant: 'main' }), [])
  const rangoli2 = useMemo(() => makeRangoliTexture(21, { size: 1024, variant: 'small' }), [])
  const inner = rect(WORLD)
  const sand = PLAY_ITEMS.find((p) => p.id === 'sandpit')

  return (
    <group>
      {/* earth beyond the wall (backdrop) */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.03}>
        <planeGeometry args={[520, 520]} />
        <meshStandardMaterial color="#17120f" roughness={1} />
      </mesh>
      {/* society paving */}
      {/* paving: slightly glossy (evening dew) so lamps and fireworks sheen on it */}
      <Plane {...inner} y={0}>
        <meshStandardMaterial ref={pavingRef} map={paving.map} roughness={0.78} metalness={0.02} color="#e6d2c0" />
      </Plane>
      <Plane {...rect(MAIN_LANE)} y={0.006}>
        <meshStandardMaterial ref={laneMRef} map={laneM.map} roughness={0.85} color="#8a8790" />
      </Plane>
      <LaneDashes />
      <Plane {...rect(CROSS_LANE)} y={0.005}>
        <meshStandardMaterial ref={laneCRef} map={laneC.map} roughness={0.85} color="#8a8790" />
      </Plane>
      <Plane x={(BAZAAR.minX + BAZAAR.maxX) / 2} z={BAZAAR.laneZ} w={BAZAAR.maxX - BAZAAR.minX} d={6.4} y={0.006}>
        <meshStandardMaterial ref={bazaarRef} color="#7a5642" roughness={0.9} />
      </Plane>
      <Plane {...rect(PLAY_AREA)} y={0.006}>
        <meshStandardMaterial ref={grassRef} map={grass.map} roughness={1} color="#a8b88e" />
      </Plane>
      {sand && (
        <Plane x={sand.x} z={sand.z} w={sand.w} d={sand.d} y={0.012}>
          <meshStandardMaterial color="#c9a46a" roughness={1} />
        </Plane>
      )}
      <Plane {...rect(CRACKER_GROUND)} y={0.008}>
        <meshStandardMaterial map={groundTex} roughness={0.92} emissive="#ffffff" emissiveMap={groundTex} emissiveIntensity={0.05} />
      </Plane>
      {/* main rangoli in front of Block B */}
      <mesh rotation-x={-Math.PI / 2} position={[RANGOLI_MAIN.x, 0.014, RANGOLI_MAIN.z]} receiveShadow>
        <circleGeometry args={[RANGOLI_MAIN.r, 96]} />
        <meshStandardMaterial
          map={rangoli}
          emissiveMap={rangoli}
          emissive="#ffffff"
          emissiveIntensity={0.26}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
      {/* entrance rangoli */}
      <mesh rotation-x={-Math.PI / 2} position={[RANGOLI_SMALL.x, 0.014, RANGOLI_SMALL.z]} receiveShadow>
        <circleGeometry args={[RANGOLI_SMALL.r, 64]} />
        <meshStandardMaterial
          map={rangoli2}
          emissiveMap={rangoli2}
          emissive="#ffffff"
          emissiveIntensity={0.26}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  )
}

export const RANGOLI_CENTER = new THREE.Vector3(RANGOLI_MAIN.x, 0, RANGOLI_MAIN.z)
