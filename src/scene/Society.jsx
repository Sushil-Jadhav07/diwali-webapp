import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOUSES, housePoint } from './Houses'
import { WALL, GATE, gateArchPoints, LAMP_POSTS, LAMP_H, PARKING_Z } from './society/layout'
import Marigolds, { swag, hang } from './society/Marigolds'
import Glows from './society/Glows'
import { mulberry32 } from './shared'

// ---------------------------------------------------------------------------
// Housing-society dressing: apartment balconies, boundary wall + decorated
// gate with a name board, a Diwali banner, parked cars/scooters, lamp posts,
// fairy lights and rising sky lanterns. No scene lights are added: glows are
// emissive + bloom; repeated parts are instanced.
// ---------------------------------------------------------------------------

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _e = new THREE.Euler()
const UP = new THREE.Vector3(0, 1, 0)

// InstancedMesh filled from a list of { p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz] }.
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
  pole: new THREE.MeshStandardMaterial({ color: '#2d3038', roughness: 0.55, metalness: 0.6 }),
  lamp: new THREE.MeshBasicMaterial({ color: [3.2, 2.5, 1.5], toneMapped: false }),
  tyre: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 }),
  glass: new THREE.MeshStandardMaterial({ color: '#141a26', roughness: 0.15, metalness: 0.6 }),
  tail: new THREE.MeshBasicMaterial({ color: [1.4, 0.08, 0.06], toneMapped: false }),
  seat: new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.7 }),
  lantern: new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.95 }),
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
  // repaint once the Google fonts (Fredoka / Baloo 2) are ready
  document.fonts?.ready?.then(paint)
  return t
}

function bannerDraw(g, w, h) {
  const grd = g.createLinearGradient(0, 0, 0, h)
  grd.addColorStop(0, '#7a0f1f')
  grd.addColorStop(1, '#4a0814')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#f5b942'
  g.lineWidth = 10
  g.strokeRect(10, 10, w - 20, h - 20)
  for (let x = 30; x < w - 20; x += 34) {
    g.fillStyle = x % 68 === 30 ? '#f97316' : '#facc15'
    g.beginPath()
    g.arc(x, 30, 9, 0, Math.PI * 2)
    g.arc(x, h - 30, 9, 0, Math.PI * 2)
    g.fill()
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#fde9b0'
  g.font = '700 92px "Baloo 2", "Nirmala UI", sans-serif'
  g.fillText('शुभ दीपावली', w / 2, h * 0.43)
  g.fillStyle = '#f5b942'
  g.font = '600 40px Fredoka, sans-serif'
  g.fillText('HAPPY DIWALI  •  SHANTI KUNJ PARIVAR', w / 2, h * 0.76)
}

function nameBoardDraw(g, w, h) {
  g.fillStyle = '#fff7e8'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#8a1c2b'
  g.lineWidth = 12
  g.strokeRect(6, 6, w - 12, h - 12)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#8a1c2b'
  g.font = '700 84px Fredoka, sans-serif'
  g.fillText('SHANTI KUNJ SOCIETY', w / 2, h * 0.4)
  g.fillStyle = '#b45309'
  g.font = '600 58px "Baloo 2", "Nirmala UI", sans-serif'
  g.fillText('शांति कुंज सोसाइटी', w / 2, h * 0.76)
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
        // top rails: front + two sides
        rails.push({ p: housePoint(h, 0, y + 0.92, D - 0.02).toArray(), r: [0, ry, 0], s: [W, 0.045, 0.045] })
        for (const sx of [-1, 1]) rails.push({ p: housePoint(h, (sx * W) / 2, y + 0.92, D / 2).toArray(), r: [0, ry, 0], s: [0.045, 0.045, D] })
        // balusters
        for (let k = 0; k <= 12; k++) bars.push({ p: housePoint(h, -W / 2 + (k * W) / 12, y + 0.48, D - 0.02).toArray(), r: [0, ry, 0], s: [0.018, 0.86, 0.018] })
        for (const sx of [-1, 1])
          for (let k = 1; k < 5; k++) bars.push({ p: housePoint(h, (sx * W) / 2, y + 0.48, (k * D) / 5).toArray(), r: [0, ry, 0], s: [0.018, 0.86, 0.018] })
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

// ---------- boundary wall + gate ----------
function WallAndGate() {
  const parts = useMemo(() => {
    const walls = []
    const copings = []
    const inner = WALL.gateX + WALL.pillarHalf
    const len = WALL.xMax - inner
    for (const sx of [-1, 1]) {
      walls.push({ p: [sx * (inner + len / 2), WALL.h / 2, WALL.z], s: [len, WALL.h, WALL.t] })
      copings.push({ p: [sx * (inner + len / 2), WALL.h + 0.05, WALL.z], s: [len + 0.06, 0.1, WALL.t + 0.1] })
      // side returns up to the side blocks
      walls.push({ p: [sx * WALL.xMax, WALL.h / 2, 11.3], s: [WALL.t, WALL.h, 2.4] })
      copings.push({ p: [sx * WALL.xMax, WALL.h + 0.05, 11.3], s: [WALL.t + 0.1, 0.1, 2.5] })
    }
    const pillars = [-1, 1].map((sx) => ({ p: [sx * WALL.gateX, GATE.pillarH / 2, WALL.z], s: [WALL.pillarHalf * 2, GATE.pillarH, WALL.pillarHalf * 2] }))
    const caps = [-1, 1].map((sx) => ({ p: [sx * WALL.gateX, GATE.pillarH + 0.08, WALL.z], s: [WALL.pillarHalf * 2 + 0.12, 0.16, WALL.pillarHalf * 2 + 0.12] }))
    // open gate leaves (swung inward against the wall), vertical bars
    const bars = []
    const frames = []
    for (const sx of [-1, 1]) {
      const hinge = sx * (WALL.gateX - WALL.pillarHalf)
      const ang = sx * 1.25
      for (let k = 0; k <= 9; k++) {
        const d = 0.08 + k * 0.19
        bars.push({ p: [hinge - sx * Math.cos(1.25) * d, 0.95, WALL.z - Math.sin(1.25) * d], s: [0.022, 1.7, 0.022] })
      }
      for (const y of [0.15, 1.75]) {
        const d = 0.95
        frames.push({ p: [hinge - sx * Math.cos(1.25) * d, y, WALL.z - Math.sin(1.25) * d], r: [0, ang, 0], s: [1.9, 0.07, 0.05] })
      }
    }
    return { walls, copings, pillars, caps, bars, frames }
  }, [])

  const archGeo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gateArchPoints(24)), 48, GATE.archTube, 8), [])
  const nameTex = useMemo(() => boardTexture(nameBoardDraw, 1024, 256), [])
  const flowers = useMemo(() => {
    const pts = []
    // garland draped along the arch
    const arch = gateArchPoints(40, -0.12)
    for (let i = 1; i < arch.length; i++) swag(arch[i - 1], arch[i], 0.03, 0.08, pts)
    // toran across the opening + hanging strands
    const L = new THREE.Vector3(-WALL.gateX + 0.3, GATE.pillarH - 0.15, WALL.z - 0.42)
    const R = new THREE.Vector3(WALL.gateX - 0.3, GATE.pillarH - 0.15, WALL.z - 0.42)
    swag(L, R, 0.45, 0.075, pts)
    for (let k = 0; k < 7; k++) {
      const u = (k + 0.5) / 7
      const top = new THREE.Vector3().lerpVectors(L, R, u)
      top.y -= Math.sin(u * Math.PI) * 0.45
      hang(top, 0.35 + (k % 2) * 0.2, 0.075, pts)
    }
    // pillar spirals
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 34; i++) {
        const a = i * 0.55
        pts.push(new THREE.Vector3(sx * WALL.gateX + Math.cos(a) * 0.4, 0.3 + i * 0.075, WALL.z + Math.sin(a) * 0.4))
      }
    }
    return pts
  }, [])
  const glows = useMemo(() => {
    const items = []
    for (const sx of [-1, 1]) items.push({ p: [sx * WALL.gateX, GATE.pillarH + 0.42, WALL.z], size: 1.6, color: [1, 0.75, 0.4] })
    // fairy lights along the wall coping
    const r = mulberry32(17)
    const cols = [
      [1, 0.7, 0.3],
      [1, 0.3, 0.3],
      [0.4, 1, 0.5],
      [0.5, 0.6, 1],
    ]
    for (let x = WALL.gateX + 0.7; x < WALL.xMax; x += 0.45)
      for (const sx of [-1, 1]) items.push({ p: [sx * x, WALL.h + 0.14, WALL.z - 0.05], size: 0.22, color: cols[Math.floor(r() * 4)], flicker: true })
    return items
  }, [])

  return (
    <group>
      <Inst items={parts.walls} geometry={box} material={MAT.plaster} />
      <Inst items={parts.copings} geometry={box} material={MAT.coping} />
      <Inst items={parts.pillars} geometry={box} material={MAT.coping} />
      <Inst items={parts.caps} geometry={box} material={MAT.plaster} />
      <Inst items={parts.bars} geometry={box} material={MAT.rail} />
      <Inst items={parts.frames} geometry={box} material={MAT.rail} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * WALL.gateX, GATE.pillarH + 0.36, WALL.z]} material={MAT.lamp}>
          <sphereGeometry args={[0.17, 16, 12]} />
        </mesh>
      ))}
      <mesh geometry={archGeo} material={MAT.arch} />
      {/* name board, readable from inside the courtyard */}
      <mesh position={[0, GATE.pillarH + 0.62, WALL.z - 0.12]} rotation-y={Math.PI}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshStandardMaterial map={nameTex} roughness={0.8} emissive="#ffffff" emissiveMap={nameTex} emissiveIntensity={0.25} />
      </mesh>
      <Marigolds points={flowers} size={0.05} />
      <Glows items={glows} />
    </group>
  )
}

// ---------- Diwali banner on the back block ----------
function Banner() {
  const tex = useMemo(() => boardTexture(bannerDraw, 1024, 256), [])
  return (
    <group position={[0, 3.12, -7.74]}>
      <mesh>
        <planeGeometry args={[4.6, 1.15]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* tie ropes */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 2.36, 0, 0]} material={MAT.rail} scale={[0.02, 1.2, 0.02]}>
          <cylinderGeometry args={[1, 1, 1, 4]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- parked cars and scooters ----------
const CARS = [
  { x: -8.4, color: '#e8e6e1' },
  { x: -5.9, color: '#b3202a' },
  { x: 6.2, color: '#8e959e' },
]
const SCOOTERS = [
  { x: -3.7, ry: 0.25, color: '#1f5fae' },
  { x: 3.55, ry: -0.3, color: '#e8e6e1' },
  { x: 8.55, ry: 0.2, color: '#c0392b' },
  { x: 9.35, ry: 0.15, color: '#2c2c34' },
]

function Car({ x, color }) {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 }), [color])
  const z = PARKING_Z - 0.9
  return (
    <group position={[x, 0, z]}>
      <mesh material={paint} position={[0, 0.55, 0]}>
        <boxGeometry args={[1.7, 0.55, 3.6]} />
      </mesh>
      <mesh material={MAT.glass} position={[0, 1.06, 0.15]}>
        <boxGeometry args={[1.5, 0.5, 1.85]} />
      </mesh>
      <mesh material={paint} position={[0, 1.33, 0.15]}>
        <boxGeometry args={[1.52, 0.06, 1.7]} />
      </mesh>
      {/* tail lights face the courtyard */}
      {[-0.62, 0.62].map((lx) => (
        <mesh key={lx} material={MAT.tail} position={[lx, 0.66, -1.81]}>
          <boxGeometry args={[0.32, 0.1, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

function Vehicles() {
  const wheels = useMemo(() => {
    const w = []
    for (const c of CARS)
      for (const lx of [-0.82, 0.82]) for (const lz of [-1.15, 1.15]) w.push({ p: [c.x + lx, 0.32, PARKING_Z - 0.9 + lz], r: [0, 0, Math.PI / 2], s: [0.32, 0.22, 0.32] })
    for (const s of SCOOTERS)
      for (const lz of [-0.55, 0.55]) {
        const dx = Math.sin(s.ry) * lz
        const dz = Math.cos(s.ry) * lz
        w.push({ p: [s.x + dx, 0.2, PARKING_Z + dz], r: [0, s.ry, Math.PI / 2], s: [0.2, 0.09, 0.2] })
      }
    return w
  }, [])
  return (
    <group>
      {CARS.map((c) => (
        <Car key={c.x} {...c} />
      ))}
      {SCOOTERS.map((s) => (
        <Scooter key={s.x} {...s} />
      ))}
      <Inst items={wheels} geometry={cyl} material={MAT.tyre} />
    </group>
  )
}

function Scooter({ x, ry, color }) {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }), [color])
  return (
    <group position={[x, 0, PARKING_Z]} rotation-y={ry}>
      <mesh material={paint} position={[0, 0.42, -0.2]}>
        <boxGeometry args={[0.36, 0.32, 0.75]} />
      </mesh>
      <mesh material={MAT.seat} position={[0, 0.64, -0.22]}>
        <boxGeometry args={[0.3, 0.09, 0.6]} />
      </mesh>
      {/* front apron + handlebar */}
      <mesh material={paint} position={[0, 0.62, 0.42]} rotation-x={-0.25}>
        <boxGeometry args={[0.34, 0.7, 0.1]} />
      </mesh>
      <mesh material={MAT.rail} position={[0, 1.0, 0.5]}>
        <boxGeometry args={[0.62, 0.04, 0.04]} />
      </mesh>
      <mesh material={MAT.glass} position={[0, 0.88, 0.56]}>
        <boxGeometry args={[0.16, 0.1, 0.03]} />
      </mesh>
      <mesh material={paint} position={[0, 0.3, 0.32]}>
        <boxGeometry args={[0.32, 0.12, 0.22]} />
      </mesh>
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

// ---------- string lights from the gate to the blocks ----------
function GateStrings() {
  const items = useMemo(() => {
    const out = []
    const top = new THREE.Vector3(0, GATE.pillarH + GATE.archR * 0.55, WALL.z - 0.1)
    const cols = [
      [1, 0.75, 0.35],
      [1, 0.35, 0.3],
      [0.45, 1, 0.5],
      [0.5, 0.6, 1],
      [1, 0.4, 0.85],
    ]
    let k = 0
    for (const sx of [-1, 1]) {
      const end = new THREE.Vector3(sx * 9.55, 5.6, 9.6)
      const n = 30
      for (let i = 1; i < n; i++) {
        const u = i / n
        const p = new THREE.Vector3().lerpVectors(top, end, u)
        p.y -= Math.sin(u * Math.PI) * 1.1
        out.push({ p: p.toArray(), size: 0.26, color: cols[k++ % cols.length], flicker: true })
      }
    }
    return out
  }, [])
  return <Glows items={items} />
}

// ---------- rising sky lanterns ----------
const N_LANTERNS = 14
function SkyLanterns() {
  const ref = useRef()
  const geo = useMemo(() => new THREE.CylinderGeometry(0.26, 0.2, 0.5, 10), [])
  const data = useMemo(() => {
    const r = mulberry32(23)
    return Array.from({ length: N_LANTERNS }, () => ({
      x: -26 + r() * 52,
      z: -40 + r() * 30,
      y: 6 + r() * 36,
      v: 0.35 + r() * 0.35,
      ph: r() * 10,
    }))
  }, [])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    for (let i = 0; i < N_LANTERNS; i++) ref.current.setColorAt(i, c.setRGB(3, 1.35, 0.35))
    ref.current.instanceColor.needsUpdate = true
  }, [])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const arr = ref.current.instanceColor.array
    for (let i = 0; i < N_LANTERNS; i++) {
      const L = data[i]
      L.y += L.v * Math.min(dt, 0.1)
      L.x += 0.18 * Math.min(dt, 0.1) // gentle breeze
      if (L.y > 46) {
        L.y = 6
        L.x = -26 + ((i * 7.3) % 52)
      }
      const sway = Math.sin(t * 0.7 + L.ph) * 0.4
      _m.compose(_p.set(L.x + sway, L.y, L.z), _q.setFromAxisAngle(UP, t * 0.2 + L.ph), _s.set(1, 1, 1))
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
      <WallAndGate />
      <Banner />
      <Vehicles />
      <LampPosts />
      <GateStrings />
      <SkyLanterns />
    </group>
  )
}
