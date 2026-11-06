import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STALLS } from '../../world/layout'
import { mulberry32, rig } from '../shared'
import Glows from '../society/Glows'
import Marigolds, { hang } from '../society/Marigolds'
import { input } from '../../world/input'
import { useStore } from '../../store/useStore'
import { fx, rand } from '../../crackers/fx'

// ---------------------------------------------------------------------------
// Diwali Bazaar: nine stalls along the bazaar lane, built from shared,
// instanced parts (posts, counters, shelves, props) plus one canopy and one
// signboard texture per stall. Shop lights are emissive + glow sprites (no
// scene lights). The patakha shop counter opens the cracker menu (E or tap).
// ---------------------------------------------------------------------------

export const STALL_INFO = {
  patakha: { en: 'Patakha Shop', hi: 'पटाखा दुकान', a: '#b91c1c', b: '#facc15' },
  mithai: { en: 'Mithai Bhandar', hi: 'मिठाई भंडार', a: '#be185d', b: '#fde7f3' },
  diya: { en: 'Diya & Pottery', hi: 'दीये और मिट्टी', a: '#9a3412', b: '#fed7aa' },
  rangolicolours: { en: 'Rangoli Colours', hi: 'रंगोली के रंग', a: '#6d28d9', b: '#fef08a' },
  phool: { en: 'Phool & Garlands', hi: 'फूल और माला', a: '#ea580c', b: '#fef9c3' },
  kandil: { en: 'Kandil & Lights', hi: 'कंदील और लाइट', a: '#1d4ed8', b: '#fde68a' },
  gift: { en: 'Gifts & Dry Fruits', hi: 'उपहार और मेवे', a: '#047857', b: '#fef3c7' },
  chaat: { en: 'Chaat Corner', hi: 'चाट कॉर्नर', a: '#c2410c', b: '#ecfccb' },
  toys: { en: 'Balloons & Toys', hi: 'गुब्बारे और खिलौने', a: '#0e7490', b: '#fbcfe8' },
}

const rot = (s) => (s.facing === '-z' ? Math.PI : 0)
// stall-local (lx along front, ly up, lz towards the lane) -> world
export function stallPoint(s, lx, ly, lz) {
  const r = rot(s)
  const c = Math.cos(r)
  const sn = Math.sin(r)
  return [s.x + lx * c + lz * sn, ly, s.z - lx * sn + lz * c]
}

function stripeTexture(a, b) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? b : a
    g.fillRect(i * 32, 0, 32, 64)
  }
  // scalloped valance edge
  g.fillStyle = a
  for (let i = 0; i < 16; i++) {
    g.beginPath()
    g.arc(i * 16 + 8, 60, 8, 0, Math.PI)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function signTexture(info) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  const paint = () => {
    g.fillStyle = info.a
    g.fillRect(0, 0, 512, 128)
    g.strokeStyle = '#facc15'
    g.lineWidth = 6
    g.strokeRect(5, 5, 502, 118)
    g.fillStyle = '#fff7e6'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = '700 44px Fredoka, sans-serif'
    g.fillText(info.en, 256, 44)
    g.font = '600 36px "Baloo 2", "Nirmala UI", sans-serif'
    g.fillStyle = '#fde68a'
    g.fillText(info.hi, 256, 94)
    t.needsUpdate = true
  }
  paint()
  document.fonts?.ready?.then(paint)
  return t
}

function posterTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 340
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const paint = () => {
    g.fillStyle = '#fffbeb'
    g.fillRect(0, 0, 256, 340)
    g.fillStyle = '#15803d'
    g.fillRect(0, 0, 256, 56)
    g.fillStyle = '#fff'
    g.font = '700 26px Fredoka, sans-serif'
    g.textAlign = 'center'
    g.fillText('CRACKER SAFETY', 128, 36)
    g.fillStyle = '#1f2937'
    g.font = '600 19px Fredoka, sans-serif'
    g.textAlign = 'left'
    ;['Adults must supervise', 'Keep a bucket of water', 'Light at arm’s length', 'Step back after lighting', 'Never relight a dud', 'Wear cotton clothes'].forEach((line, i) => {
      g.fillText('• ' + line, 16, 92 + i * 38)
    })
    t.needsUpdate = true
  }
  paint()
  document.fonts?.ready?.then(paint)
  return t
}

const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cone: new THREE.ConeGeometry(1, 1, 12),
  oct: new THREE.OctahedronGeometry(1, 0),
}
const propMat = new THREE.MeshStandardMaterial({ roughness: 0.6 })
const glowMat = new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.9, toneMapped: false })
const woodMat = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.85 })
const postMat = new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.9 })
const glassMat = new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false })
const steelMat = new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: 0.25, metalness: 0.9 })

const VIVID = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']

// Build every prop of every stall as instance lists, by geometry.
function buildProps() {
  const r = mulberry32(91)
  const lists = { box: [], sphere: [], cyl: [], cone: [], glowOct: [], glowSphere: [] }
  const add = (kind, s, lx, ly, lz, sx, sy, sz, color, ry = 0) => {
    const p = stallPoint(s, lx, ly, lz)
    lists[kind].push({ p, s: [sx, sy, sz], c: color, ry: ry + rot(s) })
  }
  const glows = []
  const flowers = []
  for (const s of STALLS) {
    const W = s.w
    const D = s.d
    const front = D / 2 - 0.3
    const back = -D / 2 + 0.22
    // shelves (three boards) behind the counter
    for (const y of [0.55, 1.05, 1.55]) add('box', s, 0, y, back, W - 0.4, 0.04, 0.36, '#7a4e2d')
    switch (s.id) {
      case 'patakha': {
        for (let i = 0; i < 14; i++) add('box', s, -W / 2 + 0.4 + (i % 7) * 0.42, 1.01 + Math.floor(i / 7) * 0.13, front - 0.05 + rand(-0.04, 0.04), 0.34, 0.12, 0.22, VIVID[(r() * 8) | 0])
        for (const y of [0.6, 1.1, 1.6]) for (let i = 0; i < 9; i++) add('box', s, -W / 2 + 0.45 + i * 0.47, y + 0.11, back, 0.36, 0.18, 0.26, VIVID[(r() * 8) | 0])
        for (let i = 0; i < 6; i++) add('cyl', s, W / 2 - 0.5 - (i % 3) * 0.17, 1.12 + Math.floor(i / 3) * 0.32, front - 0.15, 0.075, 0.3, 0.075, VIVID[(i * 3) % 8])
        // rocket bundle display: a jar with a fan of sticks
        add('cyl', s, -W / 2 + 0.35, 1.05, front - 0.18, 0.08, 0.2, 0.08, '#9ca3af')
        for (let i = 0; i < 9; i++) add('box', s, -W / 2 + 0.35 + (i - 4) * 0.02, 1.35, front - 0.18, 0.012, 0.6, 0.012, '#a87a3f', (i - 4) * 0.12)
        // hanging ladis (not lit) from the canopy front
        for (let k = 0; k < 5; k++) for (let j = 0; j < 12; j++) add('cyl', s, -W / 2 + 0.5 + k * ((W - 1) / 4), 2.45 - j * 0.07, D / 2 - 0.05, 0.012, 0.05, 0.012, '#dc2626')
        // price tags
        for (let i = 0; i < 7; i++) add('box', s, -W / 2 + 0.4 + i * 0.42, 1.19, front + 0.06, 0.12, 0.06, 0.005, '#ffffff')
        break
      }
      case 'mithai': {
        for (let tray = 0; tray < 3; tray++) {
          const lx = -W / 2 + 0.75 + tray * ((W - 1.5) / 2)
          add('box', s, lx, 0.98, front - 0.1, 0.9, 0.03, 0.45, '#d4d4d8')
          for (let i = 0; i < 14; i++) {
            const px = lx - 0.36 + (i % 7) * 0.12
            const pz = front - 0.22 + Math.floor(i / 7) * 0.2
            if (tray === 0) add('sphere', s, px, 1.03, pz, 0.045, 0.045, 0.045, '#f59e0b')
            else if (tray === 1) add('box', s, px, 1.02, pz, 0.08, 0.035, 0.08, i % 2 ? '#a7f3d0' : '#fbcfe8')
            else add('cyl', s, px, 1.01, pz, 0.05, 0.015, 0.05, '#fb923c')
          }
        }
        break
      }
      case 'diya': {
        for (let i = 0; i < 24; i++) add('cyl', s, -W / 2 + 0.4 + (i % 8) * 0.48, 0.99 + Math.floor(i / 8) * 0.0, front - 0.05 - Math.floor(i / 8) * 0.16, 0.06, 0.035, 0.06, '#9a4a22')
        for (let i = 0; i < 8; i++) glows.push({ p: stallPoint(s, -W / 2 + 0.4 + i * 0.48, 1.06, front - 0.05), size: 0.35, color: [1, 0.65, 0.25], flicker: true })
        for (const y of [0.6, 1.1, 1.6]) for (let i = 0; i < 6; i++) add('sphere', s, -W / 2 + 0.6 + i * 0.6, y + 0.16, back, 0.14, 0.16, 0.14, i % 2 ? '#8b4513' : '#a0522d')
        break
      }
      case 'rangolicolours': {
        for (let i = 0; i < 12; i++) {
          const lx = -W / 2 + 0.4 + (i % 6) * 0.62
          const lz = front - 0.05 - Math.floor(i / 6) * 0.28
          add('cyl', s, lx, 0.98, lz, 0.13, 0.05, 0.13, '#e5e7eb')
          add('cone', s, lx, 1.05, lz, 0.11, 0.09, 0.11, VIVID[i % 8])
        }
        break
      }
      case 'phool': {
        for (let i = 0; i < 6; i++) {
          const top = stallPoint(s, -W / 2 + 0.4 + i * ((W - 0.8) / 5), 2.45, D / 2 - 0.1)
          hang(new THREE.Vector3(...top), 0.9 + (i % 2) * 0.3, 0.06, flowers)
        }
        for (let i = 0; i < 3; i++) {
          add('cyl', s, -W / 2 + 0.7 + i * 1.2, 1.0, front - 0.1, 0.24, 0.12, 0.24, '#a16207')
          for (let k = 0; k < 10; k++) add('sphere', s, -W / 2 + 0.7 + i * 1.2 + rand(-0.15, 0.15), 1.1, front - 0.1 + rand(-0.15, 0.15), 0.06, 0.05, 0.06, k % 2 ? '#f97316' : '#facc15')
        }
        break
      }
      case 'kandil': {
        for (let i = 0; i < 6; i++) add('glowOct', s, -W / 2 + 0.45 + i * ((W - 0.9) / 5), 2.1 + (i % 2) * 0.15, D / 2 - 0.2, 0.2, 0.26, 0.2, VIVID[(i + 1) % 8])
        for (let i = 0; i < 26; i++) glows.push({ p: stallPoint(s, -W / 2 + 0.3 + (i % 13) * 0.3, 0.75 + Math.floor(i / 13) * 0.5, back + 0.2), size: 0.2, color: [[1, 0.4, 0.3], [0.4, 1, 0.5], [0.5, 0.6, 1], [1, 0.8, 0.3]][i % 4], flicker: true })
        break
      }
      case 'gift': {
        for (let i = 0; i < 10; i++) {
          const lx = -W / 2 + 0.4 + (i % 5) * 0.8
          const ly = 1.04 + Math.floor(i / 5) * 0.2
          const col = VIVID[(i * 3) % 8]
          add('box', s, lx, ly, front - 0.1, 0.32, 0.18, 0.26, col)
          add('box', s, lx, ly, front - 0.1, 0.33, 0.19, 0.04, '#fde047')
        }
        for (let i = 0; i < 4; i++) {
          add('cyl', s, -W / 2 + 0.6 + i * 1.05, 0.66, back, 0.2, 0.1, 0.2, '#a16207')
          for (let k = 0; k < 12; k++) add('sphere', s, -W / 2 + 0.6 + i * 1.05 + rand(-0.12, 0.12), 0.74, back + rand(-0.1, 0.1), 0.03, 0.025, 0.03, ['#92400e', '#fef3c7', '#65a30d', '#7c2d12'][i])
        }
        break
      }
      case 'chaat': {
        add('cyl', s, -W / 2 + 0.6, 1.12, front - 0.15, 0.24, 0.3, 0.24, '#c8ccd4')
        for (let i = 0; i < 4; i++) {
          add('cyl', s, 0.2 + i * 0.4, 0.99, front - 0.1, 0.13, 0.04, 0.13, '#e5e7eb')
          for (let k = 0; k < 6; k++) add('sphere', s, 0.2 + i * 0.4 + rand(-0.06, 0.06), 1.04, front - 0.1 + rand(-0.06, 0.06), 0.03, 0.025, 0.03, '#e8c27a')
        }
        add('box', s, W / 2 - 0.4, 1.4, back + 0.05, 0.6, 0.8, 0.04, '#1f2937')
        break
      }
      case 'toys': {
        for (let i = 0; i < 10; i++) add('box', s, -W / 2 + 0.4 + (i % 5) * 0.7, 1.04, front - 0.08 - Math.floor(i / 5) * 0.22, 0.2, 0.14, 0.14, VIVID[(i * 5) % 8])
        for (let i = 0; i < 4; i++) add('cyl', s, W / 2 - 0.4, 1.25 + i * 0.12, front - 0.1, 0.1, 0.01, 0.1, VIVID[(i * 2 + 1) % 8], Math.PI / 2)
        break
      }
      default:
        break
    }
    // canopy bulbs + stall lamp glow
    for (let k = 0; k <= 10; k++) glows.push({ p: stallPoint(s, -W / 2 + (k * W) / 10, 2.55, D / 2 + 0.25), size: 0.26, color: k % 2 ? [1, 0.75, 0.35] : [1, 0.5, 0.25], flicker: true })
    glows.push({ p: stallPoint(s, 0, 2.3, 0.2), size: 2.4, color: [1, 0.72, 0.42] })
  }
  return { lists, glows, flowers }
}

function InstGroup({ items, geometry, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    const up = new THREE.Vector3(0, 1, 0)
    items.forEach((it, i) => {
      q.setFromAxisAngle(up, it.ry || 0)
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s))
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(it.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />
}

// Structure: posts, counters, back walls (instanced across all stalls).
function Structures() {
  const parts = useMemo(() => {
    const posts = []
    const counters = []
    const backs = []
    const glass = []
    for (const s of STALLS) {
      const W = s.w
      const D = s.d
      for (const [lx, lz] of [
        [-W / 2 + 0.06, D / 2 - 0.06],
        [W / 2 - 0.06, D / 2 - 0.06],
        [-W / 2 + 0.06, -D / 2 + 0.06],
        [W / 2 - 0.06, -D / 2 + 0.06],
      ])
        posts.push({ p: stallPoint(s, lx, 1.3, lz), s: [0.06, 2.6, 0.06], c: '#4a3020' })
      counters.push({ p: stallPoint(s, 0, 0.47, D / 2 - 0.3), s: [W - 0.2, 0.94, 0.55], c: '#7c4a2a', ry: rot(s) })
      backs.push({ p: stallPoint(s, 0, 1.2, -D / 2 + 0.03), s: [W, 2.4, 0.06], c: '#3b2416', ry: rot(s) })
      if (s.id === 'mithai') glass.push({ p: stallPoint(s, 0, 1.12, D / 2 - 0.32), s: [W - 0.4, 0.32, 0.5], c: '#ffffff', ry: rot(s) })
    }
    return { posts, counters, backs, glass }
  }, [])
  return (
    <>
      <InstGroup items={parts.posts} geometry={geo.cyl} material={postMat} />
      <InstGroup items={parts.counters} geometry={geo.box} material={woodMat} />
      <InstGroup items={parts.backs} geometry={geo.box} material={woodMat} />
      <InstGroup items={parts.glass} geometry={geo.box} material={glassMat} />
    </>
  )
}

function Canopies() {
  const items = useMemo(
    () =>
      STALLS.map((s) => {
        const info = STALL_INFO[s.id]
        return { s, info, stripe: stripeTexture(info.a, info.b), sign: signTexture(info) }
      }),
    [],
  )
  return (
    <>
      {items.map(({ s, stripe, sign }) => (
        <group key={s.id} position={[s.x, 0, s.z]} rotation-y={rot(s)}>
          {/* sloping striped canopy + front valance */}
          <mesh position={[0, 2.62, 0.15]} rotation-x={-Math.PI / 2 + 0.18}>
            <planeGeometry args={[s.w + 0.4, s.d + 0.6]} />
            <meshStandardMaterial map={stripe} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 2.46, s.d / 2 + 0.44]}>
            <planeGeometry args={[s.w + 0.4, 0.3]} />
            <meshStandardMaterial map={stripe} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* signboard on top */}
          <mesh position={[0, 3.12, s.d / 2 + 0.2]}>
            <planeGeometry args={[Math.min(3.6, s.w * 0.85), 0.62]} />
            <meshStandardMaterial map={sign} roughness={0.7} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Balloon bunch bobbing above the toy stall.
function Balloons() {
  const s = STALLS.find((x) => x.id === 'toys')
  const ref = useRef()
  const N = 14
  const base = useMemo(() => {
    const r = mulberry32(5)
    return Array.from({ length: N }, () => ({ lx: rand(-0.6, 0.6), ly: 3.0 + r() * 0.8, lz: rand(-0.4, 0.3), ph: r() * 6 }))
  }, [])
  const strings = useMemo(() => {
    const pts = []
    const hand = new THREE.Vector3(...stallPoint(s, s.w / 2 - 0.2, 1.4, s.d / 2 + 0.6))
    for (const b of base) {
      pts.push(hand.clone(), new THREE.Vector3(...stallPoint(s, s.w / 2 - 0.2 + b.lx, b.ly - 0.18, s.d / 2 + 0.6 + b.lz)))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [base, s])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    base.forEach((_, i) => ref.current.setColorAt(i, c.set(VIVID[i % 8])))
    ref.current.instanceColor.needsUpdate = true
  }, [base])
  const m = useMemo(() => new THREE.Matrix4(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const sc = useMemo(() => new THREE.Vector3(0.16, 0.2, 0.16), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    base.forEach((b, i) => {
      const [x, y, z] = stallPoint(s, s.w / 2 - 0.2 + b.lx + Math.sin(t * 0.9 + b.ph) * 0.05, b.ly + Math.sin(t * 1.3 + b.ph) * 0.06, s.d / 2 + 0.6 + b.lz)
      m.compose(v.set(x, y, z), q, sc)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh ref={ref} args={[geo.sphere, propMat, N]} frustumCulled={false} />
      <lineSegments geometry={strings}>
        <lineBasicMaterial color="#e5e7eb" />
      </lineSegments>
    </group>
  )
}

// The patakha shop counter: walk up and press E (or tap it) to open the menu.
function PatakhaCounter() {
  const s = STALLS.find((x) => x.id === 'patakha')
  const front = useMemo(() => stallPoint(s, 0, 0, s.d / 2 + 0.9), [s])
  const last = useRef(0)
  const hinted = useRef(false)
  const poster = useMemo(() => posterTexture(), [])
  const open = () => {
    const st = useStore.getState()
    st.openMenu()
    st.showHint('Patakha Shop: pick any cracker from the menu, then Aarav will light it on an open spot.')
  }
  useFrame(() => {
    const d = Math.hypot(rig.pos.x - front[0], rig.pos.z - front[2])
    const near = d < 2.4
    if (near && !hinted.current) {
      hinted.current = true
      useStore.getState().showHint('Press E (or tap the counter) to see the crackers.')
    }
    if (!near) hinted.current = false
    if (near && input.interactAt > last.current) {
      last.current = input.interactAt
      open()
    }
  })
  return (
    <group>
      <mesh position={stallPoint(s, 0, 0.5, s.d / 2 - 0.28)} rotation-y={rot(s)} onClick={(e) => (e.stopPropagation(), open())}>
        <boxGeometry args={[s.w - 0.1, 1.0, 0.62]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* safety poster on the side post */}
      <mesh position={stallPoint(s, s.w / 2 + 0.01, 1.45, s.d / 2 - 0.6)} rotation-y={rot(s) + Math.PI / 2}>
        <planeGeometry args={[0.5, 0.66]} />
        <meshStandardMaterial map={poster} roughness={0.8} emissive="#ffffff" emissiveMap={poster} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

// Steam above the chaat pot.
function ChaatSteam() {
  const s = STALLS.find((x) => x.id === 'chaat')
  const p = useMemo(() => stallPoint(s, -s.w / 2 + 0.6, 1.32, s.d / 2 - 0.45), [s])
  useFrame((_, dt) => {
    if (fx.ready && Math.random() < dt * 3) fx.puff(p[0] + rand(-0.08, 0.08), p[1], p[2] + rand(-0.08, 0.08), 0, 0.25, 0, 2.2, 0.12, 1.5, 0.14)
  })
  return null
}

export default function Bazaar() {
  const props = useMemo(() => buildProps(), [])
  return (
    <group>
      <Structures />
      <Canopies />
      <InstGroup items={props.lists.box} geometry={geo.box} material={propMat} />
      <InstGroup items={props.lists.sphere} geometry={geo.sphere} material={propMat} />
      <InstGroup items={props.lists.cyl} geometry={geo.cyl} material={propMat} />
      <InstGroup items={props.lists.cone} geometry={geo.cone} material={propMat} />
      <InstGroup items={props.lists.glowOct} geometry={geo.oct} material={glowMat} />
      <Glows items={props.glows} />
      <Marigolds points={props.flowers} size={0.045} />
      <Balloons />
      <PatakhaCounter />
      <ChaatSteam />
      <mesh position={stallPoint(STALLS.find((x) => x.id === 'chaat'), -STALLS.find((x) => x.id === 'chaat').w / 2 + 0.6, 1.12, STALLS.find((x) => x.id === 'chaat').d / 2 - 0.45)} material={steelMat}>
        <cylinderGeometry args={[0.24, 0.22, 0.3, 16]} />
      </mesh>
    </group>
  )
}
