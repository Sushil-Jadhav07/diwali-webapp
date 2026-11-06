import * as THREE from 'three'
import { mulberry32 } from './shared'

// ---------------------------------------------------------------------------
// Aarav's body: soft lathe/capsule shapes, cloth with folds, juti, fingers and
// an expressive face. Purely visual — the joint names/offsets match Child.jsx.
// Lathe profiles are listed bottom -> top so normals face outward.
// ---------------------------------------------------------------------------

export const THIGH = 0.28
export const SHIN = 0.28
export const FOOT_H = 0.05

// ---------- cloth textures ----------
function clothTexture({ base, thread, motif, seed = 1, size = 256 }) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const r = mulberry32(seed)
  g.fillStyle = base
  g.fillRect(0, 0, size, size)
  // fine weave
  g.globalAlpha = 0.08
  g.fillStyle = thread
  for (let y = 0; y < size; y += 2) g.fillRect(0, y, size, 1)
  g.globalAlpha = 0.05
  for (let x = 0; x < size; x += 2) g.fillRect(x, 0, 1, size)
  g.globalAlpha = 1
  for (let k = 0; k < 900; k++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.04})`
    g.fillRect(r() * size, r() * size, 1 + r() * 2, 1)
  }
  if (motif) {
    // small block-printed "buti" flowers
    for (let y = 0; y < size; y += 32) {
      for (let x = (y / 32) % 2 ? 16 : 0; x < size; x += 32) {
        g.fillStyle = motif
        for (let p = 0; p < 4; p++) {
          const a = (p / 4) * Math.PI * 2
          g.beginPath()
          g.ellipse(x + 8 + Math.cos(a) * 3, y + 8 + Math.sin(a) * 3, 2.4, 1.3, a, 0, Math.PI * 2)
          g.fill()
        }
        g.beginPath()
        g.arc(x + 8, y + 8, 1.2, 0, Math.PI * 2)
        g.fillStyle = '#fff1c4'
        g.fill()
      }
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

const kurtaTex = clothTexture({ base: '#d65a1f', thread: '#7a2a08', motif: '#f2b33d', seed: 3 })
kurtaTex.repeat.set(5, 3)
const pyjamaTex = clothTexture({ base: '#efe7d4', thread: '#9c8e72', seed: 8 })
pyjamaTex.repeat.set(3, 3)

export const M = {
  // warm emissive term fakes subsurface scattering so skin never goes grey at night
  skin: new THREE.MeshStandardMaterial({ color: '#b9784f', roughness: 0.55, emissive: '#4a1d0e', emissiveIntensity: 0.14 }),
  lip: new THREE.MeshStandardMaterial({ color: '#94403a', roughness: 0.5 }),
  cheek: new THREE.MeshStandardMaterial({ color: '#e0907a', roughness: 0.6, transparent: true, opacity: 0.28, depthWrite: false }),
  hair: new THREE.MeshStandardMaterial({ color: '#140c08', roughness: 0.42 }),
  kurta: new THREE.MeshStandardMaterial({ map: kurtaTex, roughness: 0.72 }),
  trim: new THREE.MeshStandardMaterial({ color: '#e7b13c', roughness: 0.35, metalness: 0.6 }),
  pyjama: new THREE.MeshStandardMaterial({ map: pyjamaTex, roughness: 0.9 }),
  juti: new THREE.MeshStandardMaterial({ color: '#7a1426', roughness: 0.78 }),
  sole: new THREE.MeshStandardMaterial({ color: '#3b2414', roughness: 0.9 }),
  eyeWhite: new THREE.MeshStandardMaterial({ color: '#f4efe8', roughness: 0.25 }),
  iris: new THREE.MeshStandardMaterial({ color: '#3b2314', roughness: 0.2 }),
  pupil: new THREE.MeshBasicMaterial({ color: '#050302' }),
  glint: new THREE.MeshBasicMaterial({ color: [2.2, 2.2, 2.2], toneMapped: false }),
  lash: new THREE.MeshBasicMaterial({ color: '#0b0604' }),
  mouthIn: new THREE.MeshBasicMaterial({ color: '#3a0f0c' }),
  tilak: new THREE.MeshStandardMaterial({ color: '#d1122f', roughness: 0.5 }),
  stick: new THREE.MeshStandardMaterial({ color: '#3a2316', roughness: 0.9 }),
  ember: new THREE.MeshBasicMaterial({ color: [5, 1.4, 0.3], toneMapped: false }),
  wire: new THREE.MeshStandardMaterial({ color: '#8a8f99', roughness: 0.35, metalness: 0.8 }),
  wireCoat: new THREE.MeshStandardMaterial({ color: '#5b5750', roughness: 0.9 }),
}

// ---------- geometry helpers ----------
const smoothProfile = (pts, n = 20) => new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n)

// Lathe with radial cloth folds and an elliptical (flattened) cross-section.
function clothLathe(pts, { segs = 28, flattenZ = 1, fold = () => 0, freq = 9, freq2 = 15, rings = () => 0 } = {}) {
  const g = new THREE.LatheGeometry(smoothProfile(pts), segs)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 1e-5) continue
    const th = Math.atan2(z, x)
    const d = fold(y) * (Math.sin(th * freq) + 0.5 * Math.sin(th * freq2 + 1.3)) + rings(y)
    const r2 = r + d
    p.setXYZ(i, Math.cos(th) * r2, y, Math.sin(th) * r2 * flattenZ)
  }
  g.computeVertexNormals()
  return g
}

const capsule = (r, len, translateY) => {
  const g = new THREE.CapsuleGeometry(r, len, 6, 12)
  g.translate(0, translateY, 0)
  return g
}

export const G = {
  // torso (spine space, y -0.03 .. 0.47): chest, waist, rounded shoulders
  kurtaTop: clothLathe(
    [
      [0.15, -0.03],
      [0.148, 0.04],
      [0.14, 0.14],
      [0.148, 0.26],
      [0.152, 0.34],
      [0.14, 0.41],
      [0.1, 0.45],
      [0.055, 0.47],
    ],
    { flattenZ: 0.76, fold: (y) => 0.002 + 0.005 * Math.max(0, 0.3 - y), freq: 7, freq2: 13 },
  ),
  // loose kurta skirt (hips space) with deep folds towards the hem
  kurtaHem: clothLathe(
    [
      [0.205, -0.33],
      [0.2, -0.3],
      [0.18, -0.18],
      [0.16, -0.06],
      [0.15, 0.04],
    ],
    { flattenZ: 0.8, fold: (y) => 0.004 + 0.014 * Math.max(0, -y) / 0.33, freq: 9, freq2: 16 },
  ),
  hemBorder: clothLathe(
    [
      [0.212, -0.335],
      [0.208, -0.3],
    ],
    { flattenZ: 0.8, fold: () => 0.018, freq: 9, freq2: 16 },
  ),
  collar: new THREE.CylinderGeometry(0.056, 0.062, 0.04, 20, 1, true),
  // churidar pyjama: tapered, gathered at the ankle
  thigh: clothLathe(
    [
      [0.05, -THIGH],
      [0.055, -0.2],
      [0.062, -0.09],
      [0.066, 0.0],
    ],
    { segs: 16, fold: () => 0.0015, freq: 5, freq2: 9 },
  ),
  shin: clothLathe(
    [
      [0.037, -SHIN],
      [0.039, -0.22],
      [0.045, -0.12],
      [0.05, 0.0],
    ],
    { segs: 16, rings: (y) => (y < -0.14 ? 0.0032 * Math.sin(y * 150) : 0), fold: () => 0.001, freq: 5, freq2: 7 },
  ),
  knee: new THREE.SphereGeometry(0.052, 14, 10),
  // sleeves to the wrist (kurta), soft shoulder and elbow
  upperArm: clothLathe(
    [
      [0.043, -0.2],
      [0.046, -0.12],
      [0.05, -0.03],
      [0.05, 0.0],
    ],
    { segs: 16, fold: (y) => 0.002 + 0.002 * Math.max(0, -y) / 0.2, freq: 5, freq2: 8 },
  ),
  shoulder: new THREE.SphereGeometry(0.047, 14, 10),
  elbow: new THREE.SphereGeometry(0.044, 12, 8),
  foreArm: clothLathe(
    [
      [0.037, -0.17],
      [0.039, -0.1],
      [0.042, 0.0],
    ],
    { segs: 16, fold: () => 0.002, freq: 4, freq2: 7 },
  ),
  cuff: new THREE.CylinderGeometry(0.039, 0.039, 0.018, 16),
  wrist: new THREE.CylinderGeometry(0.022, 0.024, 0.03, 10),
  palm: (() => {
    const g = new THREE.SphereGeometry(1, 14, 10)
    g.scale(0.016, 0.033, 0.029)
    return g
  })(),
  finger: capsule(0.0072, 0.022, -0.018),
  fingerShort: capsule(0.0066, 0.016, -0.015),
  thumb: capsule(0.0078, 0.018, -0.016),
  // juti with an upturned pointed toe
  jutiUpper: (() => {
    const g = new THREE.SphereGeometry(1, 18, 12)
    g.scale(0.043, 0.032, 0.098)
    g.translate(0, -0.022, 0.035)
    return g
  })(),
  jutiSole: (() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 18)
    g.scale(0.046, 0.012, 0.104)
    g.translate(0, -0.044, 0.035)
    return g
  })(),
  jutiToe: (() => {
    const g = new THREE.ConeGeometry(0.014, 0.05, 10)
    g.rotateX(Math.PI / 2 - 0.55)
    g.translate(0, -0.02, 0.135)
    return g
  })(),
  jutiBand: new THREE.TorusGeometry(0.036, 0.006, 6, 18),
  // head
  skull: (() => {
    const g = new THREE.SphereGeometry(0.104, 28, 20)
    g.scale(0.94, 1.06, 1.0)
    return g
  })(),
  jaw: (() => {
    const g = new THREE.SphereGeometry(0.083, 24, 16)
    g.scale(0.95, 0.82, 0.92)
    return g
  })(),
  neck: capsule(0.038, 0.06, 0),
  ear: (() => {
    const g = new THREE.SphereGeometry(0.026, 12, 10)
    g.scale(0.38, 1, 0.72)
    return g
  })(),
  eyeWhite: (() => {
    const g = new THREE.SphereGeometry(0.0165, 16, 12)
    g.scale(1.15, 1, 0.55)
    return g
  })(),
  iris: new THREE.CircleGeometry(0.0098, 18),
  pupil: new THREE.CircleGeometry(0.0048, 14),
  glint: new THREE.CircleGeometry(0.0024, 8),
  lash: new THREE.TorusGeometry(0.0175, 0.0024, 5, 14, Math.PI),
  brow: new THREE.TorusGeometry(0.024, 0.0042, 6, 14, 1.9),
  nose: (() => {
    const g = new THREE.SphereGeometry(0.016, 14, 10)
    g.scale(0.75, 0.95, 0.85)
    return g
  })(),
  smile: new THREE.TorusGeometry(0.021, 0.0048, 8, 16, Math.PI),
  mouthOpen: (() => {
    const g = new THREE.CircleGeometry(0.016, 18)
    g.scale(1, 0.75, 1)
    return g
  })(),
  cheek: new THREE.CircleGeometry(0.016, 14),
  hairCap: (() => {
    const g = new THREE.SphereGeometry(0.113, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)
    g.scale(0.97, 1.0, 1.04)
    return g
  })(),
  hairBack: (() => {
    const g = new THREE.SphereGeometry(0.098, 20, 14)
    g.scale(1.0, 0.85, 0.8)
    return g
  })(),
  hairLock: (() => {
    const g = new THREE.SphereGeometry(1, 12, 8)
    g.scale(0.028, 0.016, 0.05)
    return g
  })(),
}

const FRINGE = [
  // [x, y, z, rotX, rotY, rotZ, scale] swept to the left (side parting)
  [0.045, 0.19, 0.075, 0.6, 0.35, -0.5, 1.05],
  [0.015, 0.2, 0.085, 0.65, 0.2, -0.35, 1.15],
  [-0.02, 0.198, 0.084, 0.62, 0.05, -0.15, 1.1],
  [-0.055, 0.185, 0.07, 0.55, -0.2, 0.2, 0.95],
  [-0.08, 0.16, 0.045, 0.4, -0.55, 0.5, 0.85],
  [0.08, 0.165, 0.045, 0.4, 0.6, -0.6, 0.85],
]

// ---------- parts ----------
export function Torso({ set }) {
  return (
    <group>
      <mesh ref={set('chest')} geometry={G.kurtaTop} material={M.kurta} castShadow />
      {/* embroidered placket + buttons */}
      <mesh material={M.trim} position={[0, 0.33, 0.112]} rotation-x={-0.08}>
        <boxGeometry args={[0.024, 0.2, 0.006]} />
      </mesh>
      {[0.4, 0.35, 0.3].map((y) => (
        <mesh key={y} material={M.trim} position={[0.0, y, 0.117]}>
          <sphereGeometry args={[0.0055, 8, 6]} />
        </mesh>
      ))}
      {/* mandarin collar */}
      <mesh geometry={G.collar} material={M.kurta} position={[0, 0.475, 0]} />
      <mesh material={M.trim} position={[0, 0.495, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.056, 0.005, 6, 20]} />
      </mesh>
      <mesh geometry={G.neck} material={M.skin} position={[0, 0.5, 0]} />
    </group>
  )
}

export function Hem({ hemRef }) {
  return (
    <mesh ref={hemRef} geometry={G.kurtaHem} material={M.kurta} castShadow>
      <mesh geometry={G.hemBorder} material={M.trim} />
    </mesh>
  )
}

export function Leg({ side, set }) {
  const s = side === 1 ? 'L' : 'R'
  return (
    <group ref={set('thigh' + s)} position={[0.075 * side, 0, 0]}>
      <mesh geometry={G.thigh} material={M.pyjama} castShadow />
      <group ref={set('knee' + s)} position={[0, -THIGH, 0]}>
        <mesh geometry={G.knee} material={M.pyjama} />
        <mesh geometry={G.shin} material={M.pyjama} castShadow />
        <group position={[0, -SHIN, 0]}>
          <mesh geometry={G.jutiUpper} material={M.juti} castShadow />
          <mesh geometry={G.jutiSole} material={M.sole} />
          <mesh geometry={G.jutiToe} material={M.juti} />
          <mesh geometry={G.jutiBand} material={M.trim} position={[0, -0.003, 0.0]} rotation-x={Math.PI / 2 - 0.15} />
        </group>
      </group>
    </group>
  )
}

const FINGER_Z = [0.0135, 0.0045, -0.0045, -0.0135] // index -> little (front -> back)

function Hand({ side, set }) {
  const s = side === 1 ? 'L' : 'R'
  return (
    <group>
      <mesh geometry={G.wrist} material={M.skin} position={[0, 0.006, 0]} />
      <mesh geometry={G.palm} material={M.skin} position={[0, -0.028, 0]} castShadow />
      {FINGER_Z.map((z, i) => (
        <group key={i} ref={set(`f${s}${i}`)} position={[-side * 0.003, -0.056, z]}>
          <mesh geometry={i === 3 ? G.fingerShort : G.finger} material={M.skin} />
        </group>
      ))}
      <group ref={set(`th${s}`)} position={[-side * 0.008, -0.022, 0.022]} rotation={[0.55, 0, -side * 0.45]}>
        <mesh geometry={G.thumb} material={M.skin} />
      </group>
    </group>
  )
}

export function Arm({ side, set, onHand, children }) {
  const s = side === 1 ? 'L' : 'R'
  return (
    <group ref={set('sh' + s)} position={[0.165 * side, 0.4, 0]}>
      <mesh geometry={G.shoulder} material={M.kurta} />
      <mesh geometry={G.upperArm} material={M.kurta} castShadow />
      <group ref={set('el' + s)} position={[0, -0.2, 0]}>
        <mesh geometry={G.elbow} material={M.kurta} />
        <mesh geometry={G.foreArm} material={M.kurta} castShadow />
        <mesh geometry={G.cuff} material={M.trim} position={[0, -0.163, 0]} />
        <group ref={onHand} position={[0, -0.19, 0]}>
          <Hand side={side} set={set} />
          {children}
        </group>
      </group>
    </group>
  )
}

export function Head({ set }) {
  return (
    <group>
      <mesh geometry={G.skull} material={M.skin} position={[0, 0.112, -0.004]} castShadow />
      <mesh geometry={G.jaw} material={M.skin} position={[0, 0.066, 0.012]} />
      {/* ears */}
      {[1, -1].map((s) => (
        <group key={s} position={[0.099 * s, 0.098, -0.004]} rotation-y={0.25 * s}>
          <mesh geometry={G.ear} material={M.skin} />
          <mesh geometry={G.ear} material={M.lip} position={[0.003 * s, 0, 0.002]} scale={[0.5, 0.6, 0.55]} />
        </group>
      ))}
      {/* hair: cap, nape volume, side-parted fringe */}
      <mesh geometry={G.hairCap} material={M.hair} position={[0, 0.135, -0.02]} rotation-x={-0.5} />
      <mesh geometry={G.hairBack} material={M.hair} position={[0, 0.105, -0.04]} />
      {FRINGE.map(([x, y, z, rx, ry, rz, sc], i) => (
        <mesh key={i} geometry={G.hairLock} material={M.hair} position={[x, y, z]} rotation={[rx, ry, rz]} scale={sc} />
      ))}
      {/* eyes (group scales for blinks / squints) */}
      <group ref={set('eyes')} position={[0, 0.115, 0]}>
        {[1, -1].map((s) => (
          <group key={s} position={[0.039 * s, 0, 0.087]} rotation-y={0.18 * s}>
            <mesh geometry={G.eyeWhite} material={M.eyeWhite} />
            <group position={[0, -0.001, 0.0092]}>
              <mesh geometry={G.iris} material={M.iris} />
              <mesh geometry={G.pupil} material={M.pupil} position={[0, 0, 0.0004]} />
              <mesh geometry={G.glint} material={M.glint} position={[0.004, 0.004, 0.0008]} />
            </group>
            <mesh geometry={G.lash} material={M.lash} position={[0, 0.002, 0.006]} rotation-x={-0.3} />
          </group>
        ))}
      </group>
      {/* brows */}
      {[1, -1].map((s) => (
        <mesh key={s} ref={set('brow' + (s === 1 ? 'L' : 'R'))} geometry={G.brow} material={M.hair} position={[0.04 * s, 0.128, 0.098]} rotation={[-0.2, 0.15 * s, Math.PI / 2 - 0.95 + (s === 1 ? 0 : 0)]} scale={[1, 0.8, 1]} />
      ))}
      <mesh geometry={G.nose} material={M.skin} position={[0, 0.088, 0.1]} />
      {/* mouth: smile, and an open "O" for cheering / wow */}
      <mesh ref={set('smile')} geometry={G.smile} material={M.lip} position={[0, 0.054, 0.094]} rotation={[0.2, 0, Math.PI]} />
      <mesh ref={set('mouthOpen')} geometry={G.mouthOpen} material={M.mouthIn} position={[0, 0.05, 0.0955]} rotation-x={-0.15} scale={[1, 0.001, 1]} />
      <mesh material={M.tilak} position={[0, 0.152, 0.1]} scale={[0.6, 1.3, 0.5]}>
        <sphereGeometry args={[0.0062, 8, 6]} />
      </mesh>
    </group>
  )
}
