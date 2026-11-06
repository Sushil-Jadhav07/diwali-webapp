import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { gateArchPoints, WALL as SW, GATE as SG } from './society/layout'
import Marigolds, { swag, hang } from './society/Marigolds'
import Glows from './society/Glows'
import { mulberry32 } from './shared'
import { useStore } from '../store/useStore'
import { translate } from '../i18n/index.js'
import {
  WORLD,
  WALL_H,
  WALL_T,
  GATE,
  SECURITY_CABIN,
  PARKED_CARS,
  SCOOTERS,
  LAMP_POSTS,
  LAMP_H,
  BLOCKS,
  SOCIETY_NAME,
  SOCIETY_NAME_HI,
  WATER_TANK,
} from '../world/layout'

// ---------------------------------------------------------------------------
// Asynk Family Residency dressing: balconies, perimeter wall with lights and
// flower pots, closed decorated gate + arch + plaque + signboard, security
// cabin, Diwali banner, parked cars/scooters, lamp posts, water tank, sky
// lanterns. No scene lights: emissive + bloom; repeated parts are instanced.
// ---------------------------------------------------------------------------

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _e = new THREE.Euler()
const UP = new THREE.Vector3(0, 1, 0)

function Inst({ items, geometry, material, castShadow = false }) {
  const ref = useRef()
  useLayoutEffect(() => {
    items.forEach((it, i) => {
      _e.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0)
      _q.setFromEuler(_e)
      _m.compose(_p.set(...it.p), _q, _s.set(...(it.s || [1, 1, 1])))
      ref.current.setMatrixAt(i, _m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow />
}

const box = new THREE.BoxGeometry(1, 1, 1)
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12)
const MAT = {
  plaster: new THREE.MeshStandardMaterial({ color: '#d9c7ae', roughness: 0.95 }),
  coping: new THREE.MeshStandardMaterial({ color: '#efe4d2', roughness: 0.9 }),
  rail: new THREE.MeshStandardMaterial({ color: '#2b2b33', roughness: 0.5, metalness: 0.6 }),
  slab: new THREE.MeshStandardMaterial({ color: '#cfc2ae', roughness: 0.9 }),
  arch: new THREE.MeshStandardMaterial({ color: '#8a1c2b', roughness: 0.6, emissive: '#3a0610', emissiveIntensity: 0.4 }),
  gold: new THREE.MeshStandardMaterial({ color: '#d4a02c', roughness: 0.35, metalness: 0.7 }),
  pole: new THREE.MeshStandardMaterial({ color: '#2d3038', roughness: 0.55, metalness: 0.6 }),
  lamp: new THREE.MeshBasicMaterial({ color: [3.2, 2.5, 1.5], toneMapped: false }),
  tyre: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 }),
  glass: new THREE.MeshStandardMaterial({ color: '#141a26', roughness: 0.15, metalness: 0.6 }),
  tail: new THREE.MeshBasicMaterial({ color: [1.4, 0.08, 0.06], toneMapped: false }),
  seat: new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.7 }),
  lantern: new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.95 }),
  pot: new THREE.MeshStandardMaterial({ color: '#9a4a22', roughness: 0.9 }),
  bloom: new THREE.MeshStandardMaterial({ roughness: 0.8, emissive: '#6a2600', emissiveIntensity: 0.4 }),
  cabin: new THREE.MeshStandardMaterial({ color: '#c8b89a', roughness: 0.9 }),
  window: new THREE.MeshBasicMaterial({ color: [2.2, 1.7, 1.0], toneMapped: false }),
  tank: new THREE.MeshStandardMaterial({ color: '#4a5060', roughness: 0.7, metalness: 0.3 }),
  khaki: new THREE.MeshStandardMaterial({ color: '#7a6a45', roughness: 0.85 }),
  skin: new THREE.MeshStandardMaterial({ color: '#9c6644', roughness: 0.6, emissive: '#3a160a', emissiveIntensity: 0.15 }),
}

// ---------- canvas boards ----------
function boardTexture(draw, w = 1024, h = 256) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const paint = () => {
    g.clearRect(0, 0, w, h)
    draw(g, w, h)
    t.needsUpdate = true
  }
  paint()
  document.fonts?.ready?.then(paint) // repaint once Fredoka / Baloo 2 are loaded
  return t
}

const marigoldBorder = (g, w, h, y1, y2) => {
  for (let x = 30; x < w - 20; x += 34) {
    g.fillStyle = x % 68 === 30 ? '#f97316' : '#facc15'
    g.beginPath()
    g.arc(x, y1, 9, 0, Math.PI * 2)
    g.arc(x, y2, 9, 0, Math.PI * 2)
    g.fill()
  }
}

function bannerDraw(g, w, h, lang = 'en') {
  const T = (k) => translate(lang, k)
  const grd = g.createLinearGradient(0, 0, 0, h)
  grd.addColorStop(0, '#7a0f1f')
  grd.addColorStop(1, '#4a0814')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#f5b942'
  g.lineWidth = 10
  g.strokeRect(10, 10, w - 20, h - 20)
  marigoldBorder(g, w, h, 30, h - 30)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#fde9b0'
  g.font = '700 70px Fredoka, sans-serif'
  g.fillText(lang === 'en' ? 'Happy Diwali from' : T('sign.banner1'), w / 2, h * 0.36)
  g.fillStyle = '#ffb347'
  g.font = '700 78px Fredoka, sans-serif'
  g.font = lang === 'en' ? '700 78px Fredoka, sans-serif' : '700 70px "Baloo 2", "Nirmala UI", sans-serif'
  g.fillText(lang === 'en' ? SOCIETY_NAME : T('ui.society'), w / 2, h * 0.68)
}

function nameBoardDraw(g, w, h, lang = 'en') {
  g.fillStyle = '#fff7e8'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#8a1c2b'
  g.lineWidth = 12
  g.strokeRect(6, 6, w - 12, h - 12)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#8a1c2b'
  g.font = '700 78px Fredoka, sans-serif'
  g.fillText(SOCIETY_NAME.toUpperCase(), w / 2, h * 0.4)
  g.fillStyle = '#b45309'
  g.font = '600 54px "Baloo 2", "Nirmala UI", sans-serif'
  g.fillText(lang === 'en' ? SOCIETY_NAME_HI : translate(lang, 'ui.society'), w / 2, h * 0.76)
}

function signDraw(g, w, h, lang = 'en') {
  const T = (k) => translate(lang, k)
  g.fillStyle = '#14324f'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#f5b942'
  g.lineWidth = 10
  g.strokeRect(8, 8, w - 16, h - 16)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#fde9b0'
  g.font = '700 64px Fredoka, sans-serif'
  g.fillText(SOCIETY_NAME, w / 2, h * 0.24)
  g.font = '600 44px "Baloo 2", "Nirmala UI", sans-serif'
  g.fillStyle = '#f5b942'
  g.fillText(lang === 'en' ? 'स्वागत है  •  Welcome  •  शुभ दीपावली' : T('sign.welcome'), w / 2, h * 0.47)
  g.font = '500 34px Fredoka, sans-serif'
  g.fillStyle = '#e0e7ff'
  g.font = '500 32px Fredoka, "Baloo 2", sans-serif'
  g.fillText(T('sign.places'), w / 2, h * 0.7)
  g.fillText(T('ui.safety'), w / 2, h * 0.86)
}

function plaqueDraw(g, w, h) {
  const grd = g.createLinearGradient(0, 0, w, h)
  grd.addColorStop(0, '#e9c46a')
  grd.addColorStop(1, '#b8872b')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#6b4a10'
  g.lineWidth = 8
  g.strokeRect(10, 10, w - 20, h - 20)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#3a2606'
  g.font = '700 58px Fredoka, sans-serif'
  g.fillText('ASYNK FAMILY', w / 2, h * 0.36)
  g.fillText('RESIDENCY', w / 2, h * 0.62)
}

function cabinDraw(g, w, h, lang = 'en') {
  g.fillStyle = '#1e3a8a'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 64px Fredoka, sans-serif'
  g.font = '700 58px Fredoka, "Baloo 2", sans-serif'
  g.fillText(lang === 'en' ? 'SECURITY  •  सुरक्षा' : `${translate(lang, 'sign.security')}  •  SECURITY`, w / 2, h / 2)
}

// ---------- apartment balconies on every upper floor ----------
function Balconies() {
  const { slabs, rails, bars } = useMemo(() => {
    const slabs = []
    const rails = []
    const bars = []
    const W = 1.5
    const D = 0.62
    for (const h of HOUSES) {
      for (let f = 1; f < h.floors; f++) {
        const y = f * 3 + 0.05
        const ry = h.rot
        slabs.push({ p: housePoint(h, 0, y, D / 2).toArray(), r: [0, ry, 0], s: [W, 0.09, D] })
        rails.push({ p: housePoint(h, 0, y + 0.92, D - 0.02).toArray(), r: [0, ry, 0], s: [W, 0.045, 0.045] })
        for (const sx of [-1, 1]) rails.push({ p: housePoint(h, (sx * W) / 2, y + 0.92, D / 2).toArray(), r: [0, ry, 0], s: [0.045, 0.045, D] })
        for (let k = 0; k <= 10; k++) bars.push({ p: housePoint(h, -W / 2 + (k * W) / 10, y + 0.48, D - 0.02).toArray(), r: [0, ry, 0], s: [0.02, 0.86, 0.02] })
        for (const sx of [-1, 1])
          for (let k = 1; k < 4; k++) bars.push({ p: housePoint(h, (sx * W) / 2, y + 0.48, (k * D) / 4).toArray(), r: [0, ry, 0], s: [0.02, 0.86, 0.02] })
      }
    }
    return { slabs, rails, bars }
  }, [])
  return (
    <>
      <Inst items={slabs} geometry={box} material={MAT.slab} />
      <Inst items={rails} geometry={box} material={MAT.rail} />
      <Inst items={bars} geometry={box} material={MAT.rail} />
    </>
  )
}

// ---------- perimeter wall with fairy lights and flower pots ----------
function PerimeterWall() {
  const { walls, copings, pots, flowers, glows } = useMemo(() => {
    const walls = []
    const copings = []
    const H = WALL_H
    const T = WALL_T
    const { minX, maxX, minZ, maxZ } = WORLD
    const gx = SW.gateX + SW.pillarHalf
    const seg = (x0, x1, z0, z1) => {
      const cx = (x0 + x1) / 2
      const cz = (z0 + z1) / 2
      const w = Math.abs(x1 - x0) || T
      const d = Math.abs(z1 - z0) || T
      walls.push({ p: [cx, H / 2, cz], s: [w, H, d] })
      copings.push({ p: [cx, H + 0.06, cz], s: [w + 0.1, 0.12, d + 0.1] })
    }
    seg(minX - T, -gx, maxZ + T / 2, maxZ + T / 2)
    seg(gx, maxX + T, maxZ + T / 2, maxZ + T / 2)
    seg(minX - T, maxX + T, minZ - T / 2, minZ - T / 2)
    seg(minX - T / 2, minX - T / 2, minZ, maxZ)
    seg(maxX + T / 2, maxX + T / 2, minZ, maxZ)
    // terracotta pots with marigolds along the inside of the front wall and the lane
    const pots = []
    const flowers = []
    const potAt = (x, z) => {
      pots.push({ p: [x, 0.22, z], s: [0.26, 0.44, 0.26] })
      flowers.push({ p: [x, 0.52, z], s: [0.3, 0.2, 0.3] })
    }
    for (let x = gx + 0.8; x < 13.5; x += 1.6) {
      potAt(x, maxZ - 0.5)
      potAt(-x, maxZ - 0.5)
    }
    for (let z = 9; z < 21; z += 2.4) {
      potAt(3.9, z)
      potAt(-3.9, z)
    }
    // fairy lights all around the coping
    const glows = []
    const r = mulberry32(17)
    const cols = [
      [1, 0.7, 0.3],
      [1, 0.3, 0.3],
      [0.4, 1, 0.5],
      [0.5, 0.6, 1],
    ]
    const y = H + 0.18
    const step = 0.7
    for (let x = minX; x <= maxX; x += step) {
      if (Math.abs(x) > gx + 0.2) glows.push({ p: [x, y, maxZ + 0.05], size: 0.24, color: cols[Math.floor(r() * 4)], flicker: true })
      glows.push({ p: [x, y, minZ - 0.05], size: 0.24, color: cols[Math.floor(r() * 4)], flicker: true })
    }
    for (let z = minZ; z <= maxZ; z += step) {
      glows.push({ p: [minX - 0.05, y, z], size: 0.24, color: cols[Math.floor(r() * 4)], flicker: true })
      glows.push({ p: [maxX + 0.05, y, z], size: 0.24, color: cols[Math.floor(r() * 4)], flicker: true })
    }
    return { walls, copings, pots, flowers, glows }
  }, [])
  const flowerGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])
  const potGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 0.7, 1, 10)
    return g
  }, [])
  const bloomMat = useMemo(() => {
    const m = MAT.bloom.clone()
    m.color.set('#f97316')
    return m
  }, [])
  // marigold swags along the front wall near the gate
  const garland = useMemo(() => {
    const pts = []
    const y = WALL_H - 0.15
    const z = WORLD.maxZ - 0.25
    for (let x = SW.gateX + 0.6; x < 14; x += 2) {
      swag(new THREE.Vector3(x, y, z), new THREE.Vector3(x + 2, y, z), 0.35, 0.09, pts)
      swag(new THREE.Vector3(-x, y, z), new THREE.Vector3(-x - 2, y, z), 0.35, 0.09, pts)
    }
    return pts
  }, [])
  return (
    <group>
      <Inst items={walls} geometry={box} material={MAT.plaster} />
      <Inst items={copings} geometry={box} material={MAT.coping} />
      <Inst items={pots} geometry={potGeo} material={MAT.pot} />
      <Inst items={flowers} geometry={flowerGeo} material={bloomMat} />
      <Marigolds points={garland} size={0.045} />
      <Glows items={glows} />
    </group>
  )
}

// ---------- the closed, decorated main gate ----------
function MainGate() {
  const Z = WORLD.maxZ
  const parts = useMemo(() => {
    const pillars = [-1, 1].map((sx) => ({ p: [sx * SW.gateX, SG.pillarH / 2, Z], s: [SW.pillarHalf * 2, SG.pillarH, SW.pillarHalf * 2] }))
    const caps = [-1, 1].map((sx) => ({ p: [sx * SW.gateX, SG.pillarH + 0.08, Z], s: [SW.pillarHalf * 2 + 0.12, 0.16, SW.pillarHalf * 2 + 0.12] }))
    // two closed leaves meeting in the middle
    const bars = []
    const frames = []
    const inner = SW.gateX - SW.pillarHalf
    for (let x = -inner + 0.12; x < inner - 0.05; x += 0.16) bars.push({ p: [x, 1.05, Z - 0.05], s: [0.025, 1.9, 0.025] })
    for (const y of [0.2, 1.05, 1.95]) frames.push({ p: [0, y, Z - 0.05], s: [inner * 2, 0.07, 0.06] })
    frames.push({ p: [0, 1.05, Z - 0.05], s: [0.08, 1.9, 0.07] })
    return { pillars, caps, bars, frames }
  }, [Z])
  const archGeo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gateArchPoints(24)), 48, SG.archTube, 8), [])
  const lang = useStore((s) => s.lang)
  const nameTex = useMemo(() => boardTexture((g, w, h) => nameBoardDraw(g, w, h, lang), 1024, 256), [lang])
  const plaqueTex = useMemo(() => boardTexture(plaqueDraw, 512, 256), [])
  const flowers = useMemo(() => {
    const pts = []
    const arch = gateArchPoints(40, -0.12)
    for (let i = 1; i < arch.length; i++) swag(arch[i - 1], arch[i], 0.03, 0.08, pts)
    const L = new THREE.Vector3(-SW.gateX + 0.3, SG.pillarH - 0.15, Z - 0.42)
    const R = new THREE.Vector3(SW.gateX - 0.3, SG.pillarH - 0.15, Z - 0.42)
    swag(L, R, 0.5, 0.075, pts)
    for (let k = 0; k < 9; k++) {
      const u = (k + 0.5) / 9
      const top = new THREE.Vector3().lerpVectors(L, R, u)
      top.y -= Math.sin(u * Math.PI) * 0.5
      hang(top, 0.35 + (k % 2) * 0.25, 0.075, pts)
    }
    // garlands across the closed gate leaves
    swag(new THREE.Vector3(-SW.gateX + 0.4, 1.95, Z - 0.12), new THREE.Vector3(SW.gateX - 0.4, 1.95, Z - 0.12), 0.35, 0.08, pts)
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 40; i++) {
        const a = i * 0.55
        pts.push(new THREE.Vector3(sx * SW.gateX + Math.cos(a) * 0.4, 0.3 + i * 0.075, Z + Math.sin(a) * 0.4))
      }
    }
    return pts
  }, [Z])
  const glows = useMemo(() => [-1, 1].map((sx) => ({ p: [sx * SW.gateX, SG.pillarH + 0.42, Z], size: 1.6, color: [1, 0.75, 0.4] })), [Z])
  return (
    <group>
      <Inst items={parts.pillars} geometry={box} material={MAT.coping} />
      <Inst items={parts.caps} geometry={box} material={MAT.plaster} />
      <Inst items={parts.bars} geometry={box} material={MAT.gold} />
      <Inst items={parts.frames} geometry={box} material={MAT.gold} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * SW.gateX, SG.pillarH + 0.36, Z]} material={MAT.lamp}>
          <sphereGeometry args={[0.17, 16, 12]} />
        </mesh>
      ))}
      <mesh geometry={archGeo} material={MAT.arch} />
      <mesh position={[0, SG.pillarH + 0.7, Z - 0.12]} rotation-y={Math.PI}>
        <planeGeometry args={[3.4, 0.85]} />
        <meshStandardMaterial map={nameTex} roughness={0.8} emissive="#ffffff" emissiveMap={nameTex} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, SG.pillarH + 0.7, Z + 0.12]}>
        <planeGeometry args={[3.4, 0.85]} />
        <meshStandardMaterial map={nameTex} roughness={0.8} emissive="#ffffff" emissiveMap={nameTex} emissiveIntensity={0.3} />
      </mesh>
      {/* brass plaque on the left pillar */}
      <mesh position={[-SW.gateX, 1.5, Z - SW.pillarHalf - 0.01]} rotation-y={Math.PI}>
        <planeGeometry args={[0.62, 0.31]} />
        <meshStandardMaterial map={plaqueTex} roughness={0.35} metalness={0.5} />
      </mesh>
      <Marigolds points={flowers} size={0.05} />
      <Glows items={glows} />
    </group>
  )
}

// ---------- welcome signboard + security cabin with a watchman ----------
function SignAndCabin() {
  const lang = useStore((s) => s.lang)
  const signTex = useMemo(() => boardTexture((g, w, h) => signDraw(g, w, h, lang), 1024, 512), [lang])
  const cabinTex = useMemo(() => boardTexture((g, w, h) => cabinDraw(g, w, h, lang), 1024, 160), [lang])
  const watchman = useRef()
  const c = SECURITY_CABIN
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (watchman.current) watchman.current.rotation.y = Math.PI + Math.sin(t * 0.3) * 0.6
  })
  return (
    <group>
      {/* signboard on two posts, facing the courtyard */}
      <group position={[-7.4, 0, 27.2]} rotation-y={Math.PI}>
        {[-1.05, 1.05].map((x) => (
          <mesh key={x} position={[x, 1, 0]} material={MAT.pole}>
            <boxGeometry args={[0.08, 2, 0.08]} />
          </mesh>
        ))}
        <mesh position={[0, 1.75, 0]}>
          <planeGeometry args={[2.4, 1.2]} />
          <meshStandardMaterial map={signTex} roughness={0.7} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={0.28} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* cabin */}
      <group position={[c.x, 0, c.z]}>
        <mesh position={[0, c.h / 2, 0]} material={MAT.cabin} castShadow>
          <boxGeometry args={[c.w, c.h, c.d]} />
        </mesh>
        <mesh position={[0, c.h + 0.08, 0]} material={MAT.coping}>
          <boxGeometry args={[c.w + 0.5, 0.16, c.d + 0.5]} />
        </mesh>
        <mesh position={[0, 1.5, -c.d / 2 - 0.01]} rotation-y={Math.PI} material={MAT.window}>
          <planeGeometry args={[1.4, 0.7]} />
        </mesh>
        <mesh position={[0, c.h - 0.25, -c.d / 2 - 0.02]} rotation-y={Math.PI}>
          <planeGeometry args={[2.2, 0.34]} />
          <meshBasicMaterial map={cabinTex} />
        </mesh>
      </group>
      {/* watchman in khaki with a cap, standing by the cabin */}
      <group ref={watchman} position={[c.x - 1.9, 0, c.z - 1.2]}>
        <mesh position={[0, 0.45, 0]} material={MAT.khaki}>
          <cylinderGeometry args={[0.14, 0.12, 0.9, 10]} />
        </mesh>
        <mesh position={[0, 1.18, 0]} material={MAT.khaki}>
          <capsuleGeometry args={[0.2, 0.42, 4, 10]} />
        </mesh>
        <mesh position={[0, 1.62, 0]} material={MAT.skin}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
        <mesh position={[0, 1.74, 0]} material={MAT.khaki}>
          <cylinderGeometry args={[0.13, 0.14, 0.07, 12]} />
        </mesh>
        <mesh position={[0.26, 0.85, 0.05]} rotation-z={0.15} material={MAT.pole}>
          <cylinderGeometry args={[0.015, 0.015, 1.3, 6]} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Diwali banner on Block B ----------
function Banner() {
  const lang = useStore((s) => s.lang)
  const tex = useMemo(() => boardTexture((g, w, h) => bannerDraw(g, w, h, lang), 1024, 256), [lang])
  const B = BLOCKS.find((b) => b.id === 'B')
  return (
    <group position={[0, 3.15, B.maxZ + 0.22]}>
      <mesh>
        <planeGeometry args={[7.2, 1.8]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ---------- parked cars and scooters ----------
function Car({ x, z, color }) {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 }), [color])
  return (
    <group position={[x, 0, z]}>
      <mesh material={paint} position={[0, 0.55, 0]}>
        <boxGeometry args={[1.7, 0.55, 3.8]} />
      </mesh>
      <mesh material={MAT.glass} position={[0, 1.06, 0.15]}>
        <boxGeometry args={[1.5, 0.5, 1.95]} />
      </mesh>
      <mesh material={paint} position={[0, 1.33, 0.15]}>
        <boxGeometry args={[1.52, 0.06, 1.8]} />
      </mesh>
      {[-0.62, 0.62].map((lx) => (
        <mesh key={lx} material={MAT.tail} position={[lx, 0.66, -1.91]}>
          <boxGeometry args={[0.32, 0.1, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

function Scooter({ x, z, ry, color }) {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }), [color])
  return (
    <group position={[x, 0, z]} rotation-y={ry}>
      <mesh material={paint} position={[0, 0.42, -0.2]}>
        <boxGeometry args={[0.36, 0.32, 0.75]} />
      </mesh>
      <mesh material={MAT.seat} position={[0, 0.64, -0.22]}>
        <boxGeometry args={[0.3, 0.09, 0.6]} />
      </mesh>
      <mesh material={paint} position={[0, 0.62, 0.42]} rotation-x={-0.25}>
        <boxGeometry args={[0.34, 0.7, 0.1]} />
      </mesh>
      <mesh material={MAT.rail} position={[0, 1.0, 0.5]}>
        <boxGeometry args={[0.62, 0.04, 0.04]} />
      </mesh>
      <mesh material={paint} position={[0, 0.3, 0.32]}>
        <boxGeometry args={[0.32, 0.12, 0.22]} />
      </mesh>
    </group>
  )
}

function Vehicles() {
  const wheels = useMemo(() => {
    const w = []
    for (const c of PARKED_CARS)
      for (const lx of [-0.82, 0.82]) for (const lz of [-1.2, 1.2]) w.push({ p: [c.x + lx, 0.32, c.z + lz], r: [0, 0, Math.PI / 2], s: [0.32, 0.22, 0.32] })
    for (const s of SCOOTERS)
      for (const lz of [-0.55, 0.55]) w.push({ p: [s.x + Math.sin(s.ry) * lz, 0.2, s.z + Math.cos(s.ry) * lz], r: [0, s.ry, Math.PI / 2], s: [0.2, 0.09, 0.2] })
    return w
  }, [])
  return (
    <group>
      {PARKED_CARS.map((c, i) => (
        <Car key={i} {...c} />
      ))}
      {SCOOTERS.map((s, i) => (
        <Scooter key={i} {...s} />
      ))}
      <Inst items={wheels} geometry={cyl} material={MAT.tyre} />
    </group>
  )
}

// ---------- lamp posts ----------
function LampPosts() {
  const { poles, arms, heads, glows } = useMemo(() => {
    const poles = []
    const arms = []
    const heads = []
    const glows = []
    for (const l of LAMP_POSTS) {
      poles.push({ p: [l.x, LAMP_H / 2, l.z], s: [0.06, LAMP_H, 0.06] })
      arms.push({ p: [l.x + l.dir * 0.32, LAMP_H - 0.05, l.z], s: [0.65, 0.05, 0.05] })
      heads.push({ p: [l.x + l.dir * 0.6, LAMP_H - 0.16, l.z], s: [0.3, 0.12, 0.2] })
      glows.push({ p: [l.x + l.dir * 0.6, LAMP_H - 0.25, l.z], size: 1.9, color: [1, 0.78, 0.5] })
    }
    return { poles, arms, heads, glows }
  }, [])
  return (
    <group>
      <Inst items={poles} geometry={cyl} material={MAT.pole} />
      <Inst items={arms} geometry={box} material={MAT.pole} />
      <Inst items={heads} geometry={box} material={MAT.lamp} />
      <Glows items={glows} />
    </group>
  )
}

// ---------- overhead water tank ----------
function WaterTank() {
  const t = WATER_TANK
  const legs = useMemo(
    () =>
      [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ p: [t.x + sx * (t.size / 2 - 0.2), (t.h - 2.4) / 2, t.z + sz * (t.size / 2 - 0.2)], s: [0.25, t.h - 2.4, 0.25] }))),
    [t],
  )
  return (
    <group>
      <Inst items={legs} geometry={box} material={MAT.plaster} />
      <mesh position={[t.x, t.h - 1.2, t.z]} material={MAT.tank} castShadow>
        <cylinderGeometry args={[t.size / 2 + 0.2, t.size / 2 + 0.2, 2.4, 20]} />
      </mesh>
      <mesh position={[t.x, t.h + 0.05, t.z]} material={MAT.slab}>
        <cylinderGeometry args={[0.4, t.size / 2 + 0.25, 0.3, 20]} />
      </mesh>
    </group>
  )
}

// ---------- rising sky lanterns (kandil) ----------
const N_LANTERNS = 18
function SkyLanterns() {
  const ref = useRef()
  const geo = useMemo(() => new THREE.CylinderGeometry(0.26, 0.2, 0.5, 10), [])
  const data = useMemo(() => {
    const r = mulberry32(23)
    return Array.from({ length: N_LANTERNS }, () => ({ x: -70 + r() * 140, z: -80 + r() * 50, y: 8 + r() * 40, v: 0.35 + r() * 0.35, ph: r() * 10 }))
  }, [])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    for (let i = 0; i < N_LANTERNS; i++) ref.current.setColorAt(i, c.setRGB(3, 1.35, 0.35))
    ref.current.instanceColor.needsUpdate = true
  }, [])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const arr = ref.current.instanceColor.array
    const k = Math.min(dt, 0.1)
    for (let i = 0; i < N_LANTERNS; i++) {
      const L = data[i]
      L.y += L.v * k
      L.x += 0.2 * k
      if (L.y > 52) {
        L.y = 8
        L.x = -70 + ((i * 17.3) % 140)
      }
      _m.compose(_p.set(L.x + Math.sin(t * 0.7 + L.ph) * 0.4, L.y, L.z), _q.setFromAxisAngle(UP, t * 0.2 + L.ph), _s.set(1, 1, 1))
      ref.current.setMatrixAt(i, _m)
      const f = 0.85 + 0.15 * Math.sin(t * 9 + L.ph * 3)
      arr[i * 3] = 3 * f
      arr[i * 3 + 1] = 1.35 * f
      arr[i * 3 + 2] = 0.35 * f
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, MAT.lantern, N_LANTERNS]} frustumCulled={false} />
}

export default function Society() {
  return (
    <group>
      <Balconies />
      <PerimeterWall />
      <MainGate />
      <SignAndCabin />
      <Banner />
      <Vehicles />
      <LampPosts />
      <WaterTank />
      <SkyLanterns />
    </group>
  )
}

export { GATE }
