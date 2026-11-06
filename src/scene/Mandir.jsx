import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MANDIR, MANDIR_DIYAS } from './society/layout'
import Glows from './society/Glows'
import Marigolds, { hang, swag } from './society/Marigolds'
import { glowTexture, makePlasterTexture } from './textures'
import { fx } from '../crackers/fx'

// ---------------------------------------------------------------------------
// Small nagara-style Indian mandir, modelled procedurally (no reference image
// was provided for img2threejs). Static parts are merged per material so the
// whole temple costs only a handful of draw calls. No lights: the warm glow is
// emissive surfaces + additive halos + bloom.
// Local frame: +Z = temple front, y = up, origin = footprint centre.
// ---------------------------------------------------------------------------

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
function place(geo, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  _e.set(r[0], r[1], r[2])
  _q.setFromEuler(_e)
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]))
  geo.applyMatrix4(_m)
  return geo
}
const box = (w, h, d, p, r) => place(new THREE.BoxGeometry(w, h, d), p, r)
const cyl = (rt, rb, h, seg, p, r) => place(new THREE.CylinderGeometry(rt, rb, h, seg), p, r)

// Curvilinear ribbed shikhara: lathe with a rounded-square cross-section,
// vertical ribs and horizontal bhumi bands.
function shikharaGeo(R, H, top, ribs = 20) {
  const pts = []
  const N = 28
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector2(top + (R - top) * Math.pow(1 - t * t, 0.9), t * H))
  }
  pts.push(new THREE.Vector2(0.001, H))
  const g = new THREE.LatheGeometry(pts, 48)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const th = Math.atan2(x, z)
    const sq = Math.pow(Math.pow(Math.abs(Math.cos(th)), 5) + Math.pow(Math.abs(Math.sin(th)), 5), -1 / 5)
    const t = y / H
    const rib = 0.035 * Math.cos(th * ribs)
    const band = 0.06 * Math.pow(Math.max(0, Math.cos(t * Math.PI * 11)), 12)
    const f = (1 + (sq - 1) * 0.85) * (1 + rib + band)
    pos.setX(i, x * f)
    pos.setZ(i, z * f)
  }
  g.computeVertexNormals()
  return g
}

function amalakaGeo(r) {
  const g = new THREE.SphereGeometry(r, 32, 12)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const f = 1 + 0.09 * Math.cos(Math.atan2(x, z) * 24)
    pos.setXYZ(i, x * f, pos.getY(i) * 0.42, z * f)
  }
  g.computeVertexNormals()
  return g
}

const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)

function buildTemple() {
  const stone = []
  const trim = []
  const saffron = []
  const gold = []
  const P = 0.45 // plinth top

  // jagati (plinth) with mouldings
  stone.push(box(2.4, P, 2.0, [0, P / 2, -0.3]))
  trim.push(box(2.46, 0.07, 2.06, [0, 0.04, -0.3]))
  trim.push(box(2.46, 0.05, 2.06, [0, P - 0.02, -0.3]))
  saffron.push(box(2.42, 0.06, 2.02, [0, 0.22, -0.3]))
  // steps + side walls
  stone.push(box(1.1, 0.15, 0.22, [0, 0.075, 1.03]))
  stone.push(box(1.1, 0.3, 0.22, [0, 0.15, 0.81]))
  trim.push(box(0.12, 0.5, 0.46, [-0.61, 0.25, 0.92]))
  trim.push(box(0.12, 0.5, 0.46, [0.61, 0.25, 0.92]))

  // garbhagriha (sanctum)
  stone.push(box(1.5, 1.5, 1.4, [0, P + 0.75, -0.55]))
  trim.push(box(1.6, 0.1, 1.5, [0, P + 0.06, -0.55])) // kumbha moulding
  saffron.push(box(1.52, 0.08, 1.42, [0, 1.72, -0.55]))
  trim.push(box(1.64, 0.09, 1.54, [0, 1.95, -0.55])) // cornice
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) trim.push(box(0.14, 1.5, 0.14, [sx * 0.74, P + 0.75, -0.55 + sz * 0.69]))
  // door frame
  saffron.push(box(0.68, 1.08, 0.05, [0, 1.03, 0.17]))
  gold.push(box(0.74, 0.06, 0.07, [0, 1.6, 0.18]))

  // mandapa (porch): 4 pillars + stepped roof
  for (const [x, z] of [
    [-0.62, 0.6],
    [0.62, 0.6],
    [-0.62, 0.24],
    [0.62, 0.24],
  ]) {
    trim.push(box(0.18, 0.12, 0.18, [x, P + 0.06, z]))
    stone.push(cyl(0.065, 0.078, 1.22, 8, [x, P + 0.73, z]))
    gold.push(cyl(0.085, 0.085, 0.05, 8, [x, P + 0.5, z]))
    gold.push(cyl(0.08, 0.08, 0.04, 8, [x, P + 1.05, z]))
    trim.push(box(0.2, 0.1, 0.2, [x, 1.79, z]))
    trim.push(box(0.27, 0.06, 0.27, [x, 1.87, z]))
  }
  stone.push(box(1.52, 0.12, 0.66, [0, 1.96, 0.42]))
  trim.push(box(1.3, 0.1, 0.55, [0, 2.07, 0.42]))
  saffron.push(box(1.02, 0.1, 0.43, [0, 2.17, 0.42]))
  trim.push(box(0.7, 0.08, 0.3, [0, 2.26, 0.42]))
  gold.push(place(lathe([[0.001, 0], [0.05, 0.0], [0.07, 0.04], [0.06, 0.08], [0.03, 0.1], [0.04, 0.12], [0.001, 0.17]], 12), [0, 2.3, 0.42]))

  // shikhara + urushringas (mini towers on each face)
  stone.push(place(shikharaGeo(0.8, 2.0, 0.22), [0, 1.99, -0.55]))
  for (const [x, z] of [
    [0.56, -0.55],
    [-0.56, -0.55],
    [0, -1.11],
    [0, 0.01],
  ])
    stone.push(place(shikharaGeo(0.34, 1.0, 0.09, 12), [x, 1.99, z]))
  saffron.push(box(1.66, 0.06, 1.56, [0, 2.01, -0.55]))
  // amalaka, neck, kalash
  trim.push(cyl(0.15, 0.2, 0.1, 16, [0, 4.0, -0.55]))
  trim.push(place(amalakaGeo(0.31), [0, 4.12, -0.55]))
  gold.push(
    place(
      lathe([[0.001, 0], [0.07, 0.0], [0.12, 0.04], [0.135, 0.09], [0.12, 0.15], [0.07, 0.19], [0.055, 0.21], [0.08, 0.24], [0.03, 0.27], [0.001, 0.29]], 16),
      [0, 4.2, -0.55],
    ),
  )
  gold.push(place(new THREE.ConeGeometry(0.03, 0.14, 8), [0, 4.55, -0.55]))
  // flag pole
  gold.push(cyl(0.012, 0.012, 0.75, 6, [0.17, 4.5, -0.55]))

  const merge = (arr) => {
    const g = mergeGeometries(arr, false)
    g.computeBoundingSphere()
    return g
  }
  return { stone: merge(stone), trim: merge(trim), saffron: merge(saffron), gold: merge(gold) }
}

function makeDoorTexture() {
  const W = 256
  const H = 448
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#b8541b'
  g.fillRect(0, 0, W, H)
  // arched opening
  const arch = () => {
    g.beginPath()
    g.moveTo(34, H - 10)
    g.lineTo(34, 150)
    g.quadraticCurveTo(34, 40, W / 2, 30)
    g.quadraticCurveTo(W - 34, 40, W - 34, 150)
    g.lineTo(W - 34, H - 10)
    g.closePath()
  }
  arch()
  const grd = g.createRadialGradient(W / 2, H * 0.72, 10, W / 2, H * 0.6, H * 0.6)
  grd.addColorStop(0, '#fff3c4')
  grd.addColorStop(0.25, '#ffc35a')
  grd.addColorStop(0.6, '#e06a1a')
  grd.addColorStop(1, '#6e1a08')
  g.fillStyle = grd
  g.fill()
  g.lineWidth = 10
  g.strokeStyle = '#f2c14e'
  g.stroke()
  // Om symbol
  g.fillStyle = '#7a1206'
  g.font = 'bold 120px "Nirmala UI", "Mangal", "Baloo 2", serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('ॐ', W / 2, H * 0.47)
  // two diya flames on the floor
  for (const x of [W * 0.3, W * 0.7]) {
    g.fillStyle = '#7a3412'
    g.beginPath()
    g.ellipse(x, H - 40, 22, 9, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff1a8'
    g.beginPath()
    g.moveTo(x, H - 82)
    g.quadraticCurveTo(x + 12, H - 52, x, H - 46)
    g.quadraticCurveTo(x - 12, H - 52, x, H - 82)
    g.fill()
  }
  // toran dots along the top
  for (let i = 0; i < 9; i++) {
    g.fillStyle = i % 2 ? '#ffd21f' : '#ff7a12'
    g.beginPath()
    g.arc(46 + i * 20.5, 70 + Math.sin((i / 8) * Math.PI) * 26, 7, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function garlandPoints() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const pts = []
  // porch front scallops + hanging strings at the pillars
  swag(V(-0.68, 1.88, 0.69), V(0, 1.88, 0.69), 0.16, 0.07, pts)
  swag(V(0, 1.88, 0.69), V(0.68, 1.88, 0.69), 0.16, 0.07, pts)
  hang(V(-0.7, 1.86, 0.7), 0.45, 0.07, pts)
  hang(V(0.7, 1.86, 0.7), 0.45, 0.07, pts)
  // garland around the sanctum door
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI
    pts.push(V(Math.cos(a) * 0.37, 1.5 + Math.sin(a) * 0.16, 0.22))
  }
  hang(V(-0.37, 1.48, 0.22), 0.9, 0.075, pts)
  hang(V(0.37, 1.48, 0.22), 0.9, 0.075, pts)
  // swags around the shikhara base
  const c = [
    [-0.82, -1.33],
    [0.82, -1.33],
    [0.82, 0.23],
    [-0.82, 0.23],
  ]
  for (let i = 0; i < 4; i++) {
    const a = c[i]
    const b = c[(i + 1) % 4]
    swag(V(a[0], 2.05, a[1] - 0.0), V(b[0], 2.05, b[1]), 0.22, 0.08, pts)
  }
  // plinth front edge
  for (let k = 0; k < 3; k++) swag(V(-1.2 + k * 0.8, 0.44, 0.72), V(-0.4 + k * 0.8, 0.44, 0.72), 0.1, 0.07, pts)
  return pts
}

const pennantGeo = (() => {
  const g = new THREE.PlaneGeometry(0.55, 0.32, 10, 1)
  g.translate(0.275, 0, 0)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / 0.55
    pos.setY(i, pos.getY(i) * (1 - u * 0.92))
  }
  return g
})()

export default function Mandir() {
  const geos = useMemo(buildTemple, [])
  const plaster = useMemo(() => {
    const t = makePlasterTexture()
    t.repeat.set(2, 2)
    return t
  }, [])
  const mats = useMemo(
    () => ({
      stone: new THREE.MeshStandardMaterial({ color: '#f1e6d3', map: plaster, roughness: 0.82, emissive: '#3a1f0a', emissiveIntensity: 0.18 }),
      trim: new THREE.MeshStandardMaterial({ color: '#d7b07a', roughness: 0.75, emissive: '#2a1405', emissiveIntensity: 0.15 }),
      saffron: new THREE.MeshStandardMaterial({ color: '#e0661c', roughness: 0.6, emissive: '#7a2a05', emissiveIntensity: 0.35 }),
      gold: new THREE.MeshStandardMaterial({ color: '#d9a43a', roughness: 0.32, metalness: 0.75, emissive: '#4a2a00', emissiveIntensity: 0.3 }),
      bell: new THREE.MeshStandardMaterial({ color: '#c9962e', roughness: 0.28, metalness: 0.85, side: THREE.DoubleSide }),
      flag: new THREE.MeshStandardMaterial({ color: '#ff7a12', roughness: 0.8, side: THREE.DoubleSide, emissive: '#7a2a00', emissiveIntensity: 0.4 }),
      door: new THREE.MeshBasicMaterial({ map: makeDoorTexture(), toneMapped: false, color: new THREE.Color(1.55, 1.4, 1.25) }),
    }),
    [plaster],
  )
  const garland = useMemo(garlandPoints, [])
  const glowItems = useMemo(
    () => [
      { p: [0, 1.05, 0.5], size: 2.8, color: [0.85, 0.42, 0.14], flicker: true },
      { p: [0, 1.0, 0.25], size: 1.1, color: [1.0, 0.7, 0.3], flicker: true },
      ...MANDIR_DIYAS.map((d) => ({ p: [d[0] + 0.035, d[1] + 0.07, d[2]], size: 0.55, color: [1.0, 0.55, 0.18], flicker: true })),
      { p: [0, 4.4, -0.55], size: 0.9, color: [0.6, 0.42, 0.12], flicker: false },
    ],
    [],
  )
  const bell = useRef()
  const flag = useRef()
  const pool = useRef()
  const base = useMemo(() => Float32Array.from(pennantGeo.attributes.position.array), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // bell swings a little more when a big cracker shakes the courtyard
    if (bell.current) bell.current.rotation.z = Math.sin(t * 1.7) * (0.05 + fx.shake * 0.8)
    // pennant waves
    if (flag.current) {
      const pos = flag.current.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3]
        const u = x / 0.55
        pos.setZ(i, Math.sin(u * 6 - t * 5) * 0.05 * u)
      }
      pos.needsUpdate = true
    }
    if (pool.current) pool.current.material.opacity = 0.32 + 0.05 * Math.sin(t * 7.3) * Math.sin(t * 3.1)
  })

  return (
    <group position={[MANDIR.x, 0, MANDIR.z]} rotation-y={MANDIR.rot}>
      <mesh geometry={geos.stone} material={mats.stone} castShadow receiveShadow />
      <mesh geometry={geos.trim} material={mats.trim} receiveShadow />
      <mesh geometry={geos.saffron} material={mats.saffron} />
      <mesh geometry={geos.gold} material={mats.gold} />
      <mesh material={mats.door} position={[0, 1.03, 0.197]}>
        <planeGeometry args={[0.54, 0.95]} />
      </mesh>
      {/* bell hanging under the porch */}
      <group ref={bell} position={[0, 1.9, 0.45]}>
        <mesh material={mats.gold} position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.22, 4]} />
        </mesh>
        <mesh material={mats.bell} position={[0, -0.47, 0]}>
          <latheGeometry
            args={[
              [
                [0.001, 0.26],
                [0.05, 0.255],
                [0.075, 0.22],
                [0.082, 0.16],
                [0.095, 0.09],
                [0.12, 0.03],
                [0.135, 0.0],
              ].map(([x, y]) => new THREE.Vector2(x, y)),
              20,
            ]}
          />
        </mesh>
        <mesh material={mats.gold} position={[0, -0.45, 0]}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      </group>
      {/* saffron pennant on the shikhara */}
      <mesh ref={flag} geometry={pennantGeo} material={mats.flag} position={[0.17, 4.75, -0.55]} rotation-y={-0.6} />
      <Marigolds points={garland} size={0.036} />
      {/* warm pool of light on the ground in front of the steps */}
      <mesh ref={pool} rotation-x={-Math.PI / 2} position={[0, 0.025, 1.7]} renderOrder={3}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshBasicMaterial
          map={glowTexture()}
          color="#ff9a3c"
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Glows items={glowItems} />
    </group>
  )
}
