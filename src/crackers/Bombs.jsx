import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand } from './fx'
import { blast, COLORS, fuseStage, MAT, Scraps, ShockFX, useCrackerResources } from './common'

// ---------------------------------------------------------------------------
// Bijli bomb (atom bomb) and Sutli bomb: fuse, blinding flash, loud bang,
// expanding ground shockwave, dust and burning paper bits, strong shake.
// ---------------------------------------------------------------------------

const greenPaper = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.75 })
const thread = new THREE.MeshStandardMaterial({ color: '#f1ece2', roughness: 0.9 })

export function BijliModel() {
  return (
    <group position-y={0.04}>
      <mesh material={greenPaper} scale={[1, 0.82, 1]} castShadow>
        <sphereGeometry args={[0.045, 18, 12]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={thread} rotation={[Math.PI / 2, (i * Math.PI) / 3, 0]} scale={[1, 1, 0.82]}>
          <torusGeometry args={[0.0455, 0.0025, 4, 28]} />
        </mesh>
      ))}
    </group>
  )
}

// jute twine texture for the sutli bomb
let twineTex
function twineTexture() {
  if (twineTex) return twineTex
  const S = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const g = cv.getContext('2d')
  g.fillStyle = '#9c7a4a'
  g.fillRect(0, 0, S, S)
  for (let y = 0; y < S; y += 4) {
    g.fillStyle = y % 8 === 0 ? '#c9a46a' : '#7b5a32'
    g.fillRect(0, y, S, 2)
  }
  for (let k = 0; k < 400; k++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '230,200,150' : '60,40,20'},0.25)`
    g.fillRect(Math.random() * S, Math.random() * S, 2, 1)
  }
  twineTex = new THREE.CanvasTexture(cv)
  twineTex.colorSpace = THREE.SRGBColorSpace
  twineTex.wrapS = twineTex.wrapT = THREE.RepeatWrapping
  twineTex.repeat.set(3, 2)
  return twineTex
}

export function SutliModel() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: twineTexture(), roughness: 1 }), [])
  return (
    <group position-y={0.055}>
      <mesh material={mat} castShadow>
        <sphereGeometry args={[0.058, 20, 14]} />
      </mesh>
      <mesh material={mat} rotation-z={Math.PI / 2} scale={[1, 1, 1]}>
        <torusGeometry args={[0.058, 0.006, 5, 28]} />
      </mesh>
    </group>
  )
}

export const BOMBS = {
  bijli: { fuse: 3.0, power: 1.3, ring: 4.2, ringDur: 0.65, flash: 3.2, light: 260, sky: 0.45, shake: 0.38, sound: 'bang', paper: COLORS.red, end: 2.6 },
  sutli: { fuse: 4.6, power: 1.9, ring: 6.5, ringDur: 0.9, flash: 4.5, light: 330, sky: 0.65, shake: 0.55, sound: 'sutliBoom', paper: COLORS.orange, end: 3.4 },
}

const _white = new THREE.Color(1, 0.88, 0.7)

const laxmiRed = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.65 })
const laxmiGold = new THREE.MeshStandardMaterial({ color: '#e7b341', roughness: 0.35, metalness: 0.6 })
function LaxmiModel() {
  return (
    <group>
      <mesh position-y={0.06} material={laxmiRed} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.12, 14]} />
      </mesh>
      <mesh position-y={0.06} material={laxmiGold}>
        <cylinderGeometry args={[0.0335, 0.0335, 0.04, 14]} />
      </mesh>
    </group>
  )
}
export function BombModel({ model = 'bijli' }) {
  if (model === 'sutli') return <SutliModel />
  if (model === 'atom')
    return (
      <group scale={1.4}>
        <SutliModel />
      </group>
    )
  if (model === 'laxmi') return <LaxmiModel />
  return <BijliModel />
}

// Generic bomb handler (registry kind 'bomb'). cfg: fuse, power, ring, ringDur,
// flash, light, sky, shake, sound, paper, end, model, fuseTop, dust, mushroom.
export function Bomb({ c, kind, cfg: given }) {
  const cfg = given || BOMBS[kind]
  const g = useRef()
  const fuse = useRef()
  const shock = useRef(-1)
  const R = useCrackerResources()
  const [x, z] = c.spot
  const fuseTop = cfg.fuseTop ?? (kind === 'sutli' ? 0.13 : 0.1)
  const model = cfg.model || kind

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed && !R.flags.fired
    if (rt.litAt < 0) return
    const now = state.clock.elapsedTime
    const tl = now - rt.litAt
    if (fuseStage(R, dt, tl, cfg.fuse, x + 0.01, fuseTop * (1 - (tl / cfg.fuse) * 0.6), z)) {
      fuse.current.scale.y = Math.max(0.1, 1 - tl / cfg.fuse)
      return
    }
    const F = tl - cfg.fuse
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss')
      R.dropLight()
      R.play(cfg.sound)
      shock.current = now
      blast(x, 0.06, z, cfg.power, cfg.paper)
      fx.burstLight(x, 0.6, z, _white, cfg.light, 0.45, 30)
      fx.skyFlash(_white, cfg.sky)
      fx.addShake(cfg.shake)
      if (cfg.dust || kind === 'sutli') {
        // tall dust column + twine fragments
        for (let i = 0; i < 22; i++) fx.puff(x + rand(-0.2, 0.2), rand(0.1, 1.2), z + rand(-0.2, 0.2), rand(-0.4, 0.4), rand(0.6, 1.6), rand(-0.4, 0.4), rand(3.5, 5.5), 0.45, 1.8, 0.3)
      }
    }
    // atom bomb: a rising mushroom of smoke
    if (cfg.mushroom && F < 2.2 && Math.random() < dt * 30) {
      const h = Math.min(4.5, F * 3.2)
      fx.puff(x + rand(-0.3, 0.3), h, z + rand(-0.3, 0.3), rand(-0.6, 0.6), rand(0.2, 0.8), rand(-0.6, 0.6), rand(4, 6), 0.7, 2.2, 0.28)
    }
    // lingering smoke curling up from the crater
    if (F < 1.6 && Math.random() < dt * 10) fx.puff(x + rand(-0.1, 0.1), 0.08, z + rand(-0.1, 0.1), rand(-0.1, 0.1), rand(0.3, 0.6), rand(-0.1, 0.1), 3, 0.3, 1.5, 0.2)
    if (F > cfg.end) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <BombModel model={model} />
        <mesh ref={fuse} position={[0.01, fuseTop - 0.02, 0]} material={MAT.fuse}>
          <cylinderGeometry args={[0.003, 0.003, model === 'sutli' || model === 'atom' ? 0.08 : 0.05, 4]} />
        </mesh>
      </group>
      <ShockFX trigger={shock} radius={cfg.ring} duration={cfg.ringDur} flashSize={cfg.flash} />
    </group>
  )
}

export function Bijli({ c }) {
  return <Bomb c={c} kind="bijli" />
}

export function Sutli({ c }) {
  return <Bomb c={c} kind="sutli" />
}

export function BombScraps({ spot }) {
  return <Scraps spot={spot} count={10} spread={0.45} />
}
