import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { emitFuse, MAT, useCrackerResources } from './common'

// ---------------------------------------------------------------------------
// ASYNK Shot: a branded aerial shell that writes "HAPPY DIWALI / FROM ASYNK"
// in sparks. Text is sampled from a canvas; each spark gets the exact velocity
// that makes drag bring it to rest on its letter (x_inf = x0 + v0 / drag).
// ---------------------------------------------------------------------------

const FUSE = 2.8
const RISE = 1.5
const HEIGHT = 16
const DRAG = 3.2
const TEXT_LIFE = 3.6
const DONE_AFTER = RISE + TEXT_LIFE + 2.0
const MAX_POINTS = 1700

const GOLD = [2.9, 1.75, 0.5]
const WHITE = [2.7, 2.6, 2.4]
const ORANGE = [3.3, 1.0, 0.16] // ASYNK brand orange, HDR for bloom

// Sampled text points: [u, v, colourTag] with u, v in "text widths" (u in -0.5..0.5).
let SAMPLES = null
function sampleText() {
  if (SAMPLES) return SAMPLES
  const W = 640
  const H = 230
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const font = (px) => `700 ${px}px Fredoka, "Arial Black", system-ui, sans-serif`
  g.textBaseline = 'middle'
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.font = font(88)
  g.fillText('HAPPY DIWALI', W / 2, 62)
  g.font = font(82)
  const from = 'FROM '
  const brand = 'ASYNK'
  const wF = g.measureText(from).width
  const wB = g.measureText(brand).width
  const x0 = W / 2 - (wF + wB) / 2
  g.textAlign = 'left'
  g.fillText(from, x0, 168)
  g.fillStyle = '#ff0000' // tag the brand word so it gets the orange colour
  g.fillText(brand, x0 + wF, 168)
  const d = g.getImageData(0, 0, W, H).data
  const pts = []
  const step = 4
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const i = (y * W + x) * 4
      if (d[i + 3] < 140) continue
      const tag = y < 115 ? 0 : d[i + 1] < 100 ? 2 : 1
      pts.push([(x - W / 2) / W, (H / 2 - y) / W, tag])
    }
  }
  // keep an even subset if there are too many
  const keep = Math.min(1, MAX_POINTS / pts.length)
  SAMPLES = pts.filter((_, i) => (i * keep) % 1 < keep)
  return SAMPLES
}

// ---------- model: dark box with an orange band and the ASYNK logo label ----------
let logoTex = null
const getLogo = () => {
  if (!logoTex) {
    logoTex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/logomain.png`)
    logoTex.colorSpace = THREE.SRGBColorSpace
    logoTex.anisotropy = 4
  }
  return logoTex
}
const boxMat = new THREE.MeshStandardMaterial({ color: '#17151c', roughness: 0.6 })
const bandMat = new THREE.MeshStandardMaterial({ color: '#ff6a1a', roughness: 0.5, emissive: '#ff6a1a', emissiveIntensity: 0.15 })
const plateMat = new THREE.MeshStandardMaterial({ color: '#fff8ee', roughness: 0.7 })
const tubeMat = new THREE.MeshStandardMaterial({ color: '#120d08', roughness: 1 })

export function AsynkShotModel({ burnt }) {
  const logoMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getLogo(), transparent: true, roughness: 0.7 }),
    [],
  )
  return (
    <group>
      <mesh position-y={0.15} material={burnt ? MAT.burnt : boxMat} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
      </mesh>
      {!burnt && (
        <>
          <mesh position-y={0.27} material={bandMat}>
            <boxGeometry args={[0.305, 0.04, 0.305]} />
          </mesh>
          <mesh position={[0, 0.14, 0.1515]} material={plateMat}>
            <planeGeometry args={[0.26, 0.1]} />
          </mesh>
          <mesh position={[0, 0.14, 0.1525]} material={logoMat}>
            <planeGeometry args={[0.24, 0.074]} />
          </mesh>
        </>
      )}
      <mesh position={[0, 0.302, 0]} material={tubeMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.006, 16]} />
      </mesh>
    </group>
  )
}

export default function AsynkShot({ c }) {
  const g = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const d3 = useMemo(() => [0, 0, 0], [])
  const st = useMemo(
    () => ({
      pos: new THREE.Vector3(x, 0.3, z),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      width: 12,
      launched: false,
      burst: false,
      crackled: false,
    }),
    [x, z],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - FUSE

    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      emitFuse(R.acc, dt, x + 0.155, 0.06 + 0.05 * (1 - tl / FUSE), z)
      const l = R.getLight()
      if (l) {
        l.position.set(x + 0.2, 0.3, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 1.8 + Math.random()
        l.distance = 4
      }
      return
    }

    if (!st.launched) {
      st.launched = true
      rt.fired = true
      R.stop('hiss', 80)
      R.dropLight()
      R.play('thump', { volume: 0.95 })
      for (let i = 0; i < 60; i++) {
        randDir(d3)
        const sp = rand(1, 3.5)
        fx.spark(x, 0.32, z, d3[0] * sp * 0.6, Math.abs(d3[1]) * sp + 1, d3[2] * sp * 0.6, rand(0.15, 0.4), 3.2, 1.2, 0.3, 0.05, 2, 1, 0.03)
      }
      for (let i = 0; i < 8; i++) fx.puff(x, 0.4, z, rand(-0.3, 0.3), rand(0.5, 1.4), rand(-0.3, 0.3), rand(3, 4.5), 0.35, 1.5, 0.3)
      fx.burstLight(x, 0.6, z, new THREE.Color(1, 0.55, 0.25), 40, 0.25, 10)
    }

    if (F < RISE) {
      // orange comet rising and slowing towards its apex
      const u = F / RISE
      const e = 1 - (1 - u) * (1 - u)
      const py = 0.3 + (HEIGHT - 0.3) * e
      const vy = ((HEIGHT - 0.3) * 2 * (1 - u)) / RISE
      st.pos.set(x, py, z)
      R.acc2.v += dt * 240
      while (R.acc2.v >= 1) {
        R.acc2.v -= 1
        randDir(d3)
        fx.spark(x, py, z, d3[0] * 0.6, -vy * 0.15 + d3[1] * 0.6, d3[2] * 0.6, rand(0.3, 0.8), ORANGE[0], ORANGE[1] + 0.6, ORANGE[2] + 0.3, 0.07, 1.5, 0.6, 0.06, 1)
      }
      fx.spark(x, py, z, 0, vy * 0.02, 0, 0.05, 6, 4, 2.5, 0.38, 0, 0, 0)
      if (Math.random() < dt * 25) fx.puff(x, py - 0.3, z, 0, 0, 0, 2.5, 0.3, 1.2, 0.14)
      return
    }

    if (!st.burst) {
      st.burst = true
      const p = st.pos
      // orient the text plane to face the camera so it reads correctly
      const cam = state.camera
      st.fwd.subVectors(cam.position, p).normalize()
      st.right.crossVectors(THREE.Object3D.DEFAULT_UP, st.fwd).normalize()
      st.up.crossVectors(st.fwd, st.right)
      const dist = cam.position.distanceTo(p)
      const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect
      st.width = THREE.MathUtils.clamp(visW * 0.72, 5, 15)

      const pts = sampleText()
      const W = st.width
      for (let i = 0; i < pts.length; i++) {
        const [u, v, tag] = pts[i]
        const tx = st.right.x * u * W + st.up.x * v * W
        const ty = st.right.y * u * W + st.up.y * v * W
        const tz = st.right.z * u * W + st.up.z * v * W
        const col = tag === 0 ? GOLD : tag === 1 ? WHITE : ORANGE
        const jitter = rand(0.985, 1.0) // near-exact so letters stay crisp
        fx.spark(
          p.x,
          p.y,
          p.z,
          tx * DRAG * jitter,
          ty * DRAG * jitter,
          tz * DRAG * jitter,
          TEXT_LIFE + rand(0, 0.5),
          col[0],
          col[1],
          col[2],
          tag === 2 ? 0.2 : 0.17,
          DRAG,
          0.03,
          0.025,
          i % 7 === 0 ? 1 : 0,
        )
      }
      // golden ring framing the message
      for (let i = 0; i < 220; i++) {
        const a = (i / 220) * Math.PI * 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const sp = 15
        fx.spark(
          p.x,
          p.y,
          p.z,
          (st.right.x * ca + st.up.x * sa * 0.62) * sp,
          (st.right.y * ca + st.up.y * sa * 0.62) * sp,
          (st.right.z * ca + st.up.z * sa * 0.62) * sp,
          rand(1.6, 2.1),
          GOLD[0],
          GOLD[1],
          GOLD[2],
          0.12,
          1.3,
          0.35,
          0.08,
        )
      }
      for (let i = 0; i < 50; i++) {
        randDir(d3)
        fx.spark(p.x, p.y, p.z, d3[0] * 2, d3[1] * 2, d3[2] * 2, 0.25, 7, 6, 5, 0.6, 3, 0, 0.02)
      }
      const lc = new THREE.Color(1, 0.55, 0.2)
      fx.burstLight(p.x, p.y, p.z, lc, 2600, 2.2, 110)
      fx.skyFlash(lc, 0.85)
      fx.addShake(0.13)
      R.play('boom', { volume: 0.95 })
    }

    // glitter pops across the letters once the message has formed
    const t = F - RISE
    if (t > 1.3 && t < TEXT_LIFE) {
      if (!st.crackled) {
        st.crackled = true
        R.play('crackleBurst', { volume: 0.55 })
      }
      R.acc3.v += dt * 70
      const pts = sampleText()
      const W = st.width
      const p = st.pos
      while (R.acc3.v >= 1) {
        R.acc3.v -= 1
        const [u, v] = pts[(Math.random() * pts.length) | 0]
        const px = p.x + st.right.x * u * W + st.up.x * v * W
        const py = p.y + st.right.y * u * W + st.up.y * v * W - t * 0.08
        const pz = p.z + st.right.z * u * W + st.up.z * v * W
        for (let k = 0; k < 3; k++) {
          randDir(d3)
          fx.spark(px, py, pz, d3[0] * 1.4, d3[1] * 1.4, d3[2] * 1.4, rand(0.06, 0.13), 6, 5.6, 4.6, 0.16, 2.5, 0, 0.02)
        }
      }
    }

    if (F > DONE_AFTER) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <AsynkShotModel />
      </group>
    </group>
  )
}
