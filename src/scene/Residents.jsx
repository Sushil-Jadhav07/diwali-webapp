import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { CRACKER_BY_ID } from '../crackers/catalog'
import { fx } from '../crackers/fx'
import { rig, mulberry32, damp } from './shared'
import { LIVE_PEOPLE } from '../world/safety'

// ---------------------------------------------------------------------------
// Residents of the society: 19 low-detail procedural people in small groups.
// One shared rig (hips > spine > neck > head, shoulder > elbow > hand, legs)
// is evaluated in JS per person each frame; every body-part type is ONE
// InstancedMesh across all residents (16 draw calls total), coloured per
// instance. No shadows, no lights, no per-frame allocations.
// ---------------------------------------------------------------------------

const HIP_Y = 0.88
const SHOULDER_Y = 0.5
const NECK_Y = 0.53
const UPPER = 0.29
const FORE = 0.255
const BASE_H = 1.715

// ---------- shared geometry (base adult ~1.71 m, origin at the joint) ----------
const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)
const capsuleDown = (r, len) => {
  const g = new THREE.CapsuleGeometry(r, len, 3, 8)
  g.translate(0, -(len / 2 + r), 0)
  return g
}

const torsoGeo = lathe([
  [0.0, -0.02],
  [0.15, 0.0],
  [0.142, 0.12],
  [0.132, 0.22],
  [0.155, 0.35],
  [0.165, 0.43],
  [0.145, 0.5],
  [0.08, 0.545],
  [0.0, 0.56],
])
torsoGeo.scale(1, 1, 0.72)
// skirt / sari / kurta hem: unit length (0 -> -1), scaled per person
const hemGeo = lathe([
  [0.22, -1.0],
  [0.212, -0.8],
  [0.188, -0.5],
  [0.162, -0.2],
  [0.148, 0.02],
])
hemGeo.scale(1, 1, 0.8)
const legGeo = capsuleDown(0.062, 0.72)
const upperArmGeo = capsuleDown(0.046, 0.2)
const foreArmGeo = capsuleDown(0.038, 0.18)
const handGeo = new THREE.SphereGeometry(0.042, 8, 6)
handGeo.scale(0.9, 1.25, 0.65)
handGeo.translate(0, -0.045, 0)
const footGeo = new THREE.BoxGeometry(0.085, 0.05, 0.2)
footGeo.translate(0, 0.025, 0.04)
const neckGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.1, 8)
neckGeo.translate(0, 0.05, 0)
const headGeo = new THREE.SphereGeometry(0.105, 14, 10)
headGeo.scale(0.9, 1.06, 0.98)
headGeo.translate(0, 0.1, 0)
const hairGeo = new THREE.SphereGeometry(0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56)
hairGeo.scale(0.95, 1.04, 1.04)
hairGeo.translate(0, 0.112, -0.012)
const bunGeo = new THREE.SphereGeometry(0.052, 8, 6)
bunGeo.translate(0, 0.11, -0.115)
const capGeo = new THREE.BoxGeometry(0.19, 0.06, 0.12) // Gandhi topi
capGeo.translate(0, 0.2, -0.005)
const sashGeo = new THREE.BoxGeometry(0.11, 0.6, 0.025) // sari pallu
const shawlGeo = new THREE.BoxGeometry(0.44, 0.11, 0.25) // shawl / dupatta over shoulders
const caneGeo = new THREE.CylinderGeometry(0.012, 0.014, 1, 6)
const eyeGeo = new THREE.SphereGeometry(0.014, 6, 4)

const MATS = {
  cloth: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, side: THREE.DoubleSide }),
  skin: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
  hair: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }),
}

// part key, geometry, material, instances per person
const PARTS = [
  ['torso', torsoGeo, 'cloth', 1],
  ['hem', hemGeo, 'cloth', 1],
  ['leg', legGeo, 'cloth', 2],
  ['foot', footGeo, 'cloth', 2],
  ['upperArm', upperArmGeo, 'cloth', 2],
  ['foreArm', foreArmGeo, 'cloth', 2],
  ['hand', handGeo, 'skin', 2],
  ['neck', neckGeo, 'skin', 1],
  ['head', headGeo, 'skin', 1],
  ['eye', eyeGeo, 'hair', 2],
  ['hair', hairGeo, 'hair', 1],
  ['bun', bunGeo, 'hair', 1],
  ['cap', capGeo, 'cloth', 1],
  ['sash', sashGeo, 'cloth', 1],
  ['shawl', shawlGeo, 'cloth', 1],
  ['cane', caneGeo, 'cloth', 1],
]

// ---------- the residents ----------
// g = group. Positions stay in |x| 4.5..8.8, z -6.5..7.6 (clear of the child's
// path, cracker spots, mandir, tree and small rangoli).
const ROSTER = [
  // right-back: a family
  { g: 0, kind: 'man', outfit: 'kurta', x: 5.7, z: -3.4, h: 1.74, top: '#d69e2e', legs: '#efe6d0', cheer: 'pump', loud: 'flinch', idle: 'hips' },
  { g: 0, kind: 'woman', outfit: 'sari', x: 6.6, z: -3.7, h: 1.58, top: '#d4a017', bottom: '#b0185e', cheer: 'clap', loud: 'flinch', idle: 'folded' },
  { g: 0, kind: 'boy', outfit: 'kurta', x: 5.3, z: -2.5, h: 1.18, top: '#f28c28', legs: '#f3ead6', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  { g: 0, kind: 'girl', outfit: 'lehenga', x: 6.2, z: -2.3, h: 1.12, top: '#e8b923', bottom: '#e0457b', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  // right-middle: elders chatting
  { g: 1, kind: 'elderM', outfit: 'kurta', x: 7.4, z: 0.0, h: 1.64, top: '#f1ece0', legs: '#f1ece0', shawl: '#6b4a32', cap: true, cane: true, cheer: 'watch', loud: 'flinch', idle: 'cane' },
  { g: 1, kind: 'elderF', outfit: 'sari', x: 8.1, z: 0.8, h: 1.52, top: '#8a2c3c', bottom: '#e4d6b8', shawl: '#8c8c8c', cheer: 'clap', loud: 'ears', idle: 'folded' },
  { g: 1, kind: 'man', outfit: 'shirt', x: 6.9, z: 1.2, h: 1.78, top: '#9cc3e6', legs: '#2b2f3a', cheer: 'clap', loud: 'flinch', idle: 'normal' },
  // right-front: young people
  { g: 2, kind: 'man', outfit: 'kurta', x: 6.0, z: 5.2, h: 1.76, top: '#8a2434', legs: '#efe6d0', cheer: 'pump', loud: 'none', idle: 'normal' },
  { g: 2, kind: 'woman', outfit: 'salwar', x: 6.9, z: 5.5, h: 1.62, top: '#2a9d8f', legs: '#f4efe3', shawl: '#e0569a', cheer: 'clap', loud: 'ears', idle: 'folded' },
  { g: 2, kind: 'boy', outfit: 'kurta', x: 5.5, z: 6.1, h: 1.26, top: '#6cc24a', legs: '#f3ead6', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  // left: women chatting
  { g: 3, kind: 'woman', outfit: 'sari', x: -5.8, z: -1.9, h: 1.6, top: '#c0262d', bottom: '#0f7a4f', cheer: 'clap', loud: 'flinch', idle: 'folded' },
  { g: 3, kind: 'woman', outfit: 'salwar', x: -6.6, z: -1.1, h: 1.57, top: '#e8c23a', legs: '#c0262d', shawl: '#c0262d', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  { g: 3, kind: 'woman', outfit: 'sari', x: -6.9, z: -2.3, h: 1.63, top: '#f28c28', bottom: '#1f3fa8', cheer: 'clap', loud: 'none', idle: 'folded' },
  // left-middle: kids
  { g: 4, kind: 'girl', outfit: 'lehenga', x: -5.0, z: 2.0, h: 1.08, top: '#f6d365', bottom: '#d62839', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  { g: 4, kind: 'boy', outfit: 'kurta', x: -5.6, z: 2.9, h: 1.22, top: '#f5c518', legs: '#f3ead6', cheer: 'point', loud: 'ears', idle: 'normal' },
  { g: 4, kind: 'boy', outfit: 'shirt', x: -4.8, z: 3.0, h: 1.15, top: '#3b82f6', legs: '#5b4636', cheer: 'cheer', loud: 'ears', idle: 'normal' },
  // left-front: elder + couple
  { g: 5, kind: 'elderM', outfit: 'kurta', x: -7.2, z: 4.6, h: 1.62, top: '#f3efe6', legs: '#f3efe6', shawl: '#7d7d7d', cheer: 'clap', loud: 'flinch', idle: 'behind' },
  { g: 5, kind: 'man', outfit: 'kurta', x: -6.4, z: 5.3, h: 1.7, top: '#9cc3e6', legs: '#efe6d0', cheer: 'pump', loud: 'none', idle: 'hips' },
  { g: 5, kind: 'woman', outfit: 'sari', x: -7.4, z: 5.7, h: 1.55, top: '#e9c46a', bottom: '#6b2a8f', cheer: 'clap', loud: 'ears', idle: 'folded' },
]

const OUTFIT = {
  kurta: { hemLen: 0.44, flare: 1.05, sleeve: true },
  shirt: { hemLen: 0.12, flare: 0.98, sleeve: true },
  sari: { hemLen: 0.87, flare: 1.32, sleeve: false, sash: true },
  salwar: { hemLen: 0.5, flare: 1.15, sleeve: false },
  lehenga: { hemLen: 0.87, flare: 1.6, sleeve: false },
}
const SKIN = ['#8d5524', '#a86b3c', '#c68642', '#9c6644', '#7a4a2a', '#b5835a']
const SHOES = ['#3a2418', '#1a1614', '#8a6a2a', '#5a1e1e']

const KEYS = ['bodyYaw', 'spineX', 'spineZ', 'headYaw', 'headPitch', 'shLx', 'shLz', 'shRx', 'shRz', 'elLx', 'elLz', 'elRx', 'elRz', 'bounce']
const blank = () => Object.fromEntries(KEYS.map((k) => [k, 0]))
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

function buildPeople() {
  return ROSTER.map((r, i) => {
    const rnd = mulberry32(1000 + i * 7)
    const kid = r.kind === 'boy' || r.kind === 'girl'
    const elder = r.kind === 'elderM' || r.kind === 'elderF'
    const female = r.kind === 'woman' || r.kind === 'girl' || r.kind === 'elderF'
    const o = OUTFIT[r.outfit]
    const hs = kid ? 1.28 : 1
    const skin = SKIN[Math.floor(rnd() * SKIN.length)]
    const hair = elder ? (rnd() > 0.5 ? '#b9b4aa' : '#8f8a82') : rnd() > 0.3 ? '#15100c' : '#2b1a10'
    const top = r.top
    const bottom = r.bottom || top
    // stage-1 layout: spectators stand along the east/west edges of the Cracker Ground
    const x = Math.sign(r.x) * (16.8 + (Math.abs(r.x) - 4.5) * 0.75)
    const z = r.z * 1.3 - 5
    LIVE_PEOPLE[i] = { x, z }
    return {
      ...r,
      x,
      z,
      i,
      kid,
      elder,
      female,
      hs,
      s: r.h / (BASE_H + (hs - 1) * 0.22),
      w: kid ? 0.95 : female ? 0.95 + rnd() * 0.07 : 1.0 + rnd() * 0.1,
      hemLen: r.kind === 'elderM' ? 0.6 : o.hemLen,
      flare: o.flare,
      sash: !!o.sash,
      bun: female,
      stoop: r.kind === 'elderM' ? 0.24 : r.kind === 'elderF' ? 0.16 : 0,
      col: {
        torso: top,
        hem: bottom,
        leg: r.legs || bottom,
        foot: SHOES[Math.floor(rnd() * SHOES.length)],
        upperArm: top,
        foreArm: o.sleeve ? top : skin,
        hand: skin,
        neck: skin,
        head: skin,
        eye: '#120a06',
        hair,
        bun: hair,
        cap: '#f5f2ea',
        sash: bottom,
        shawl: r.shawl || top,
        cane: '#5a3a22',
      },
      ph: rnd() * Math.PI * 2,
      lambda: 5 + rnd() * 4,
      riseRate: 2.5 + rnd() * 4.5,
      delay: rnd() * 0.7,
      sens: 0.7 + rnd() * 0.6,
      thresh: 0.22 + rnd() * 0.2,
      groundLove: kid ? 0.75 + rnd() * 0.25 : elder ? 0.3 + rnd() * 0.2 : 0.4 + rnd() * 0.3,
      watchKid: rnd() < 0.45,
      baseYaw: 0,
      cur: blank(),
      tgt: blank(),
      excite: 0,
      loudStyle: r.loud,
      loudV: 0,
      fireT: 0,
    }
  })
}

function buildGroups(people) {
  const groups = []
  for (const p of people) (groups[p.g] ||= { members: [], cx: 0, cz: 0, speaker: 0, listener: 0, timer: 0 }).members.push(p.i)
  groups.forEach((g, gi) => {
    for (const m of g.members) {
      g.cx += people[m].x / g.members.length
      g.cz += people[m].z / g.members.length
    }
    g.speaker = g.members[0]
    g.listener = g.members[1 % g.members.length]
    g.timer = 1.5 + gi * 0.9
  })
  for (const p of people) {
    const g = groups[p.g]
    const yawCourt = Math.atan2(0 - p.x, -1 - p.z)
    const yawGroup = Math.atan2(g.cx - p.x, g.cz - p.z)
    p.baseYaw = yawCourt + wrap(yawGroup - yawCourt) * 0.45
  }
  return groups
}

// ---------- pose layers ----------
function idlePose(p, T, t) {
  T.spineX = p.stoop
  T.spineZ = Math.sin(t * 0.55 + p.ph) * (p.kid ? 0.05 : 0.025)
  T.headPitch = -p.stoop * 0.8 + Math.sin(t * 0.37 + p.ph * 2) * 0.03
  if (p.kid) T.bounce = Math.max(0, Math.sin(t * 1.7 + p.ph)) ** 8 * 0.03
  switch (p.idle) {
    case 'folded':
      T.shLx = T.shRx = -0.42
      T.shLz = -0.18
      T.shRz = 0.18
      T.elLx = T.elRx = -1.1
      T.elLz = -0.3
      T.elRz = 0.3
      break
    case 'behind':
      T.shLx = T.shRx = 0.42
      T.shLz = 0.12
      T.shRz = -0.12
      T.elLz = -1.25
      T.elRz = 1.25
      break
    case 'hips':
      T.shLz = 0.62
      T.shRz = -0.62
      T.elLz = -1.3
      T.elRz = 1.3
      break
    case 'cane':
      T.shLz = 0.08
      T.elLx = -0.15
      T.shRx = -0.38
      T.shRz = -0.06
      T.elRx = -0.4
      break
    default: {
      const sw = Math.sin(t * 0.9 + p.ph) * 0.04
      T.shLz = 0.09
      T.shRz = -0.09
      T.shLx = sw
      T.shRx = -sw
      T.elLx = T.elRx = -0.15
    }
  }
}

function talkGesture(p, T, t) {
  // gesture with the free hand (left if the right hand holds a cane)
  const a = -0.45 + 0.15 * Math.sin(t * 2.1 + p.ph)
  const e = -1.0 + 0.35 * Math.sin(t * 3.3 + p.ph)
  if (p.cane) {
    T.shLx = a
    T.shLz = 0.1
    T.elLx = e
    T.elLz = 0
  } else {
    T.shRx = a
    T.shRz = -0.1
    T.elRx = e
    T.elRz = 0
  }
  T.headPitch += 0.04 * Math.sin(t * 4 + p.ph)
}

function cheerPose(p, T, t, aerial) {
  const w = t * (p.kid ? 9 : 7) + p.ph
  let style = p.cheer
  if (style === 'point' && !aerial) style = 'cheer'
  switch (style) {
    case 'clap': {
      const c = 0.5 + 0.5 * Math.sin(t * (p.kid ? 24 : 19) + p.ph)
      T.shLx = T.shRx = -0.95
      T.shLz = -0.06 - 0.3 * c
      T.shRz = 0.06 + 0.3 * c
      T.elLx = T.elRx = -0.8
      T.elLz = T.elRz = 0
      break
    }
    case 'cheer':
      T.shLz = 2.45 + 0.25 * Math.sin(w)
      T.shRz = -2.45 - 0.25 * Math.sin(w + 1.3)
      T.shLx = T.shRx = -0.2
      T.elLx = T.elRx = -0.3
      T.elLz = T.elRz = 0
      T.bounce = Math.max(0, Math.sin(t * 8 + p.ph)) * (p.kid ? 0.11 : 0.05)
      break
    case 'pump':
      T.shRz = -2.3 - 0.3 * Math.sin(w)
      T.shRx = -0.3
      T.elRx = -0.5 - 0.4 * Math.max(0, Math.sin(w))
      T.elRz = 0
      break
    case 'point':
      T.shRx = -2.55
      T.shRz = -0.12
      T.elRx = -0.05
      T.elRz = 0
      T.bounce = Math.max(0, Math.sin(t * 6 + p.ph)) * 0.05
      break
    default:
      break // 'watch': keep the idle arms, only look
  }
}

function loudPose(p, T) {
  if (p.loudStyle === 'ears') {
    T.shLz = 2.25
    T.shRz = -2.25
    T.elLz = 2.25
    T.elRz = -2.25
    T.shLx = T.shRx = -0.15
    T.elLx = T.elRx = 0
    T.spineX += 0.1
    T.headPitch += 0.12
    T.bounce = 0
  } else {
    // flinch
    T.spineX += 0.1
    T.headPitch += 0.15
    if (!p.cane) {
      T.shLx = T.shRx = -0.5
      T.elLx = T.elRx = -1.2
      T.shLz = -0.1
      T.shRz = 0.1
      T.elLz = T.elRz = 0
    }
  }
}

// ---------- scratch (no per-frame allocations) ----------
const _m = new THREE.Matrix4()
const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _e = new THREE.Euler()
const _v = new THREE.Vector3()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const mRoot = new THREE.Matrix4()
const mHip = new THREE.Matrix4()
const mSpine = new THREE.Matrix4()
const mNeck = new THREE.Matrix4()
const mHead = new THREE.Matrix4()
const mSh = new THREE.Matrix4()
const mEl = new THREE.Matrix4()
const mHand = new THREE.Matrix4()
const mOut = new THREE.Matrix4()

function local(out, parent, px, py, pz, rx, ry, rz, order = 'XYZ', sx = 1, sy = 1, sz = 1) {
  _p.set(px, py, pz)
  _q.setFromEuler(_e.set(rx, ry, rz, order))
  _s.set(sx, sy, sz)
  _m.compose(_p, _q, _s)
  return out.multiplyMatrices(parent, _m)
}

function writePerson(p, M, t) {
  const c = p.cur
  const i = p.i
  const s = p.s
  _p.set(p.x, c.bounce * s, p.z)
  _q.setFromEuler(_e.set(0, p.baseYaw + c.bodyYaw, 0, 'XYZ'))
  _s.set(s, s, s)
  mRoot.compose(_p, _q, _s)

  // hips: hem hangs from here (does not lean with the spine)
  local(mHip, mRoot, 0, HIP_Y, 0, 0, 0, 0)
  M.hem.setMatrixAt(i, local(mOut, mHip, 0, 0, 0, 0, 0, 0, 'XYZ', p.w * p.flare, p.hemLen, p.w * p.flare))

  // legs + feet
  for (let k = 0; k < 2; k++) {
    const side = k === 0 ? 1 : -1
    const li = i * 2 + k
    M.leg.setMatrixAt(li, local(mOut, mRoot, 0.085 * p.w * side, HIP_Y, 0, 0, 0, 0.03 * side + c.spineZ * 0.3))
    M.foot.setMatrixAt(li, local(mOut, mRoot, (0.09 * p.w + 0.02) * side, 0, 0, 0, 0.12 * side, 0))
  }

  // spine / torso
  local(mSpine, mRoot, 0, HIP_Y, 0, c.spineX, 0, c.spineZ)
  const breath = 1 + 0.012 * Math.sin(t * 1.6 + p.ph)
  M.torso.setMatrixAt(i, local(mOut, mSpine, 0, 0, 0, 0, 0, 0, 'XYZ', p.w, breath, p.w))
  M.sash.setMatrixAt(i, p.sash ? local(mOut, mSpine, -0.01, 0.29, 0.122 * p.w, 0, 0, -0.6) : ZERO)
  M.shawl.setMatrixAt(i, p.shawl ? local(mOut, mSpine, 0, 0.505, -0.005, 0, 0, 0, 'XYZ', p.w, 1, p.w) : ZERO)

  // neck + head
  local(mNeck, mSpine, 0, NECK_Y, 0, c.headPitch * 0.3, c.headYaw * 0.3, 0, 'YXZ')
  M.neck.setMatrixAt(i, mNeck)
  local(mHead, mNeck, 0, 0.085, 0, c.headPitch * 0.7, c.headYaw * 0.7, 0, 'YXZ', p.hs, p.hs, p.hs)
  M.head.setMatrixAt(i, mHead)
  M.hair.setMatrixAt(i, mHead)
  M.bun.setMatrixAt(i, p.bun ? mHead : ZERO)
  M.cap.setMatrixAt(i, p.cap ? mHead : ZERO)
  M.eye.setMatrixAt(i * 2, local(mOut, mHead, 0.034, 0.115, 0.092, 0, 0, 0))
  M.eye.setMatrixAt(i * 2 + 1, local(mOut, mHead, -0.034, 0.115, 0.092, 0, 0, 0))

  // arms
  for (let k = 0; k < 2; k++) {
    const left = k === 0
    const side = left ? 1 : -1
    const ai = i * 2 + k
    local(mSh, mSpine, 0.185 * p.w * side, SHOULDER_Y, 0, left ? c.shLx : c.shRx, 0, left ? c.shLz : c.shRz)
    M.upperArm.setMatrixAt(ai, mSh)
    local(mEl, mSh, 0, -UPPER, 0, left ? c.elLx : c.elRx, 0, left ? c.elLz : c.elRz)
    M.foreArm.setMatrixAt(ai, mEl)
    local(mHand, mEl, 0, -FORE, 0, 0, 0, 0)
    M.hand.setMatrixAt(ai, mHand)
    if (!left) {
      if (p.cane) {
        // walking stick from the right hand straight down to the ground
        _v.setFromMatrixPosition(mHand)
        const hy = Math.max(0.2, _v.y - 0.03)
        _p.set(_v.x, hy * 0.5, _v.z)
        _q.identity()
        _s.set(1, hy, 1)
        M.cane.setMatrixAt(i, mOut.compose(_p, _q, _s))
      } else M.cane.setMatrixAt(i, ZERO)
    }
  }
}

export default function Residents() {
  const meshes = useRef({})
  const people = useMemo(buildPeople, [])
  const groups = useMemo(() => buildGroups(people), [people])
  const N = people.length

  // static per-instance colours (must exist before the first render)
  useLayoutEffect(() => {
    const col = new THREE.Color()
    for (const [key, , , per] of PARTS) {
      const mesh = meshes.current[key]
      if (!mesh) continue
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      for (const p of people) {
        col.set(p.col[key])
        for (let k = 0; k < per; k++) {
          mesh.setColorAt(p.i * per + k, col)
          mesh.setMatrixAt(p.i * per + k, ZERO)
        }
      }
      mesh.instanceColor.needsUpdate = true
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [people])

  useFrame((state, rawDt) => {
    const M = meshes.current
    if (!M.torso) return
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime

    // ---- global signals ----
    const st = useStore.getState()
    const cur = st.current
    const def = cur ? CRACKER_BY_ID[cur.type] : null
    const fired = !!(cur && cur.rt.fired && !cur.rt.done)
    const active = !!cur && st.phase !== 'idle'
    const aerial = !!def?.aerial
    const held = !!def?.held
    const soundy = def?.category === 'sound'
    const loudNow = fx.shake > 0.05 || (fired && soundy)
    const flash = fx.flash
    const tx = fired && !held ? rig.focusPoint.x : rig.pos.x
    const tz = fired && !held ? rig.focusPoint.z : rig.pos.z

    // rotate who is talking in each group
    for (const g of groups) {
      g.timer -= dt
      if (g.timer <= 0) {
        const n = g.members.length
        const prev = g.speaker
        g.speaker = g.members[(g.members.indexOf(prev) + 1 + Math.floor(Math.random() * (n - 1))) % n]
        let l = g.members[Math.floor(Math.random() * n)]
        if (l === g.speaker) l = g.members[(g.members.indexOf(l) + 1) % n]
        g.listener = l
        g.timer = 3 + Math.random() * 4
      }
    }

    for (let i = 0; i < N; i++) {
      const p = people[i]
      const T = p.tgt

      // ---- reaction drives (staggered per person) ----
      p.fireT = fired ? p.fireT + dt : 0
      let ex = 0
      if (fired && p.fireT > p.delay) {
        ex = Math.max(0, (flash - 0.15) * 1.1 * p.sens)
        if (!aerial) ex = Math.max(ex, p.groundLove * (held ? 0.6 : 1) * (0.6 + 0.4 * Math.sin(t * 0.7 + p.ph)))
        ex = Math.min(1, ex)
      }
      if (ex > p.excite) p.excite += (ex - p.excite) * (1 - Math.exp(-p.riseRate * dt))
      else p.excite *= Math.exp(-0.5 * dt)
      if (loudNow) p.loudV += (1 - p.loudV) * (1 - Math.exp(-p.riseRate * 2 * dt))
      else p.loudV *= Math.exp(-0.9 * dt)

      // ---- pose targets ----
      for (let k = 0; k < KEYS.length; k++) T[KEYS[k]] = 0
      idlePose(p, T, t)

      const reactingLoud = p.loudV > 0.4 && p.loudStyle !== 'none'
      const reactingCheer = !reactingLoud && p.excite > p.thresh

      // where to look
      let looking = false
      let lx = 0
      let lz = 0
      if (fired && p.fireT > p.delay * 0.5) {
        looking = true
        lx = tx
        lz = tz
      } else if (active && p.watchKid) {
        looking = true
        lx = rig.pos.x
        lz = rig.pos.z
      }
      const g = groups[p.g]
      if (looking) {
        const rel = wrap(Math.atan2(lx - p.x, lz - p.z) - p.baseYaw)
        T.bodyYaw = clamp(rel * 0.55, -1.1, 1.1)
        T.headYaw = clamp(rel - T.bodyYaw, -0.95, 0.95)
        if (fired && aerial) {
          T.headPitch += -0.55
          T.spineX -= 0.08
        } else T.headPitch += 0.1
      } else {
        // chatting: listeners face the speaker, the speaker faces a listener
        const speaking = g.speaker === i
        const o = people[speaking ? g.listener : g.speaker]
        if (o !== p) {
          const rel = wrap(Math.atan2(o.x - p.x, o.z - p.z) - p.baseYaw)
          T.bodyYaw = clamp(rel * 0.25, -0.5, 0.5)
          T.headYaw = clamp(rel - T.bodyYaw, -0.9, 0.9)
        }
        if (speaking && !reactingCheer && !reactingLoud) talkGesture(p, T, t)
        else T.headPitch += 0.05 * Math.max(0, Math.sin(t * 1.3 + p.ph)) // nod
      }

      if (reactingLoud) loudPose(p, T)
      else if (reactingCheer) cheerPose(p, T, t, aerial && fired)

      // ---- blend ----
      const c = p.cur
      for (let k = 0; k < KEYS.length; k++) {
        const key = KEYS[k]
        c[key] = damp(c[key], T[key], key === 'bounce' ? 18 : p.lambda, dt)
      }
      writePerson(p, M, t)
    }
    for (const [key] of PARTS) M[key].instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {PARTS.map(([key, geo, mat, per]) => (
        <instancedMesh
          key={key}
          ref={(el) => {
            if (el) meshes.current[key] = el
          }}
          args={[geo, MATS[mat], N * per]}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
