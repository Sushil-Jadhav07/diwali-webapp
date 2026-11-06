import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from '../fx'
import { COLORS, MAT, emitFuse, lightColor, useCrackerResources } from '../common'
import { burst, crackleField } from '../patterns'

// ---------------------------------------------------------------------------
// Generic aerial handler (registry kind 'shells'). One config drives mortar
// shells, rockets, rising comets, Roman candles, multi-shot cakes and the
// gatling noise maker. cfg:
//   fuse, model {w,h,d,color,band,tubes:[cols,rows], tall}, launcher
//   ('mortar' | 'rocket' | 'comet' | 'candle' | 'gatling'), shots: [...] or
//   gen: { count, gap, h:[a,b], patterns, colors:[[...]], fan, rise, scale,
//          finale: { count, pattern, colors, h, scale, spread } }
// shot: { at, h, pattern, colors, colorEnd, scale, rise, drift:[dx,dz],
//         tail: 'gold'|'glitter'|'color'|'whistle'|'none', whistle, sound,
//         pistil, crackle, bangs, thunder, light, flash, shake, count }
// ---------------------------------------------------------------------------

const D = [0, 0, 0]
const hueOf = (name) => COLORS[name] || COLORS.gold

function buildShots(cfg) {
  if (cfg.shots) return cfg.shots.map((s, i) => ({ i, ...s }))
  const g = cfg.gen
  const out = []
  const fan = g.fan ?? 0.35
  for (let i = 0; i < g.count; i++) {
    const side = (i % 5) - 2
    out.push({
      i,
      at: i * g.gap + rand(0, g.gap * 0.25),
      h: rand(g.h[0], g.h[1]),
      pattern: g.patterns[i % g.patterns.length],
      colors: g.colors[i % g.colors.length],
      scale: g.scale ?? 0.75,
      rise: g.rise ?? 0.85,
      drift: [side * fan * 2.2, rand(-1.5, 0.5)],
      tail: g.tail ?? 'gold',
      sound: g.sound ?? 'burstPop',
      light: g.light ?? 900,
      flash: g.flash ?? 0.3,
      shake: g.shake ?? 0.03,
      count: g.countScale ?? 0.6,
    })
  }
  if (g.finale) {
    const f = g.finale
    const t0 = g.count * g.gap + 0.4
    for (let k = 0; k < f.count; k++) {
      out.push({
        i: out.length,
        at: t0 + k * 0.12,
        h: rand(f.h[0], f.h[1]),
        pattern: f.pattern,
        colors: f.colors[k % f.colors.length],
        scale: f.scale ?? 1,
        rise: 1.0,
        drift: [(k - (f.count - 1) / 2) * (f.spread ?? 2.4), rand(-2, 0)],
        tail: 'glitter',
        sound: 'boom',
        light: 2200,
        flash: 0.8,
        shake: 0.12,
        crackle: k === f.count - 1,
      })
    }
  }
  return out
}

// ---------- launcher models ----------
const tubeTop = new THREE.MeshStandardMaterial({ color: '#120d08', roughness: 1 })
export function ShellBoxModel({ burnt, model = {} }) {
  const { w = 0.26, h = 0.28, d = 0.26, color = '#5b21b6', band = '#f5b942', tubes = [2, 2], tall = false } = model
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), [color])
  const bandMat = useMemo(() => new THREE.MeshStandardMaterial({ color: band, roughness: 0.45, metalness: 0.4 }), [band])
  const H = tall ? h * 2.6 : h
  const holes = []
  for (let a = 0; a < tubes[0]; a++)
    for (let b = 0; b < tubes[1]; b++) holes.push([(a - (tubes[0] - 1) / 2) * (w / tubes[0]), (b - (tubes[1] - 1) / 2) * (d / tubes[1])])
  return (
    <group>
      <mesh position-y={H / 2} material={burnt ? MAT.burnt : body} castShadow>
        <boxGeometry args={[w, H, d]} />
      </mesh>
      {!burnt && (
        <mesh position-y={H * 0.55} material={bandMat}>
          <boxGeometry args={[w + 0.004, H * 0.18, d + 0.004]} />
        </mesh>
      )}
      {holes.map(([x, z], i) => (
        <mesh key={i} position={[x, H + 0.003, z]} material={tubeTop}>
          <cylinderGeometry args={[Math.min(w / tubes[0], d / tubes[1]) * 0.36, Math.min(w / tubes[0], d / tubes[1]) * 0.36, 0.006, 10]} />
        </mesh>
      ))}
    </group>
  )
}

export default function Shells({ c, cfg }) {
  const g = useRef()
  const R = useCrackerResources()
  const [x, z] = c.spot
  const shots = useMemo(() => buildShots(cfg), [cfg])
  const st = useMemo(
    () => ({
      events: [],
      shots: shots.map((s) => ({ ...s, launched: false, burst: false, pos: new THREE.Vector3(x, 0.3, z), vel: new THREE.Vector3(), dir: new THREE.Vector3(rand(-0.12, 0.12), 1, rand(-0.18, 0.05)).normalize() })),
      end: Math.max(...shots.map((s) => s.at + (s.rise ?? 1.3))) + (cfg.linger ?? 3.6),
      gatling: 0,
    }),
    [shots, x, z, cfg.linger],
  )
  const boxH = (cfg.model?.tall ? (cfg.model?.h ?? 0.28) * 2.6 : cfg.model?.h ?? 0.28) + 0.02

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    g.current.visible = rt.placed
    if (rt.litAt < 0) return
    const cam = state.camera
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - cfg.fuse

    if (F < 0) {
      if (!R.flags.hiss) {
        R.flags.hiss = true
        R.play('hiss')
      }
      emitFuse(R.acc, dt, x + (cfg.model?.w ?? 0.26) / 2 + 0.02, 0.05, z)
      const l = R.getLight()
      if (l) {
        l.position.set(x + 0.2, 0.3, z)
        l.color.setRGB(1, 0.55, 0.2)
        l.intensity = 1.8 + Math.random()
        l.distance = 4
      }
      return
    }
    if (!R.flags.fired) {
      R.flags.fired = true
      rt.fired = true
      R.stop('hiss', 80)
      R.dropLight()
      if (cfg.launcher === 'gatling') R.play('gatling')
    }

    // scheduled pattern events (crossette splits, crackle pops, ...)
    const later = (delay, fn) => st.events.push({ t: F + delay, fn })
    for (let i = st.events.length - 1; i >= 0; i--) {
      if (F >= st.events[i].t) {
        const e = st.events[i]
        st.events.splice(i, 1)
        e.fn()
      }
    }

    // gatling: a long stream of tiny pops just above the box
    if (cfg.launcher === 'gatling') {
      const target = Math.min(288, Math.floor(Math.max(0, F) * 31))
      while (st.gatling < target) {
        st.gatling++
        const h = rand(3, 9)
        const px = x + rand(-1.2, 1.2)
        const pz = z + rand(-1.2, 1.2)
        for (let k = 0; k < 5; k++) {
          randDir(D)
          fx.spark(px, h, pz, D[0] * 2, D[1] * 2, D[2] * 2, rand(0.06, 0.14), 6, 5.5, 4.5, 0.22, 2.5, 0, 0.02)
        }
        if (st.gatling % 3 === 0) fx.spark(x, boxH, z, rand(-0.6, 0.6), h * 1.6, rand(-0.6, 0.6), 0.5, 3, 2, 1, 0.06, 1.6, 0.6, 0.04)
        if (st.gatling % 9 === 0) fx.puff(px, h, pz, 0, 0.2, 0, 2, 0.4, 1.4, 0.12)
      }
      if (F > 9.6 && !rt.done) rt.done = true
      return
    }

    for (const s of st.shots) {
      const t = F - s.at
      if (t < 0) continue
      const rise = s.rise ?? 1.3
      if (!s.launched) {
        s.launched = true
        if (cfg.launcher === 'rocket') {
          s.pos.set(x, boxH + 0.2, z)
          R.play(s.whistle === false ? 'cakeShot' : 'whistle', { volume: 0.6 })
        } else if (cfg.launcher === 'candle') {
          R.play('cakeShot', { volume: 0.55 })
          const col = hueOf(s.colors?.[0])
          fx.spark(x, boxH, z, rand(-0.6, 0.6), rand(14, 17), rand(-0.6, 0.6), 1.8, col[0] * 1.2, col[1] * 1.2, col[2] * 1.2, 0.38, 0.55, 0.62, 0.06)
          for (let k = 0; k < 18; k++) fx.spark(x, boxH, z, rand(-1, 1), rand(2, 5), rand(-1, 1), rand(0.2, 0.5), 3, 2, 0.8, 0.05, 1.5, 1, 0.03)
          fx.puff(x, boxH + 0.1, z, 0, 0.8, 0, 3, 0.3, 1.5, 0.25)
          s.burst = true
          continue
        } else {
          R.play(s.whistle ? 'screamer' : 'thump', { volume: s.whistle ? 0.45 : 0.85 })
          for (let k = 0; k < 40; k++) {
            randDir(D)
            const sp = rand(1, 3.5)
            fx.spark(x, boxH, z, D[0] * sp * 0.6, Math.abs(D[1]) * sp + 1, D[2] * sp * 0.6, rand(0.15, 0.4), 3, 2, 0.8, 0.05, 2, 1, 0.03)
          }
          for (let k = 0; k < 6; k++) fx.puff(x, boxH + 0.05, z, rand(-0.3, 0.3), rand(0.5, 1.4), rand(-0.3, 0.3), rand(3, 4.5), 0.35, 1.5, 0.3)
          fx.burstLight(x, 0.6, z, new THREE.Color(1, 0.7, 0.4), 30, 0.25, 10)
        }
      }
      if (s.burst) continue
      if (t < rise) {
        // ----- flight -----
        let px
        let py
        let pz
        let vy
        if (cfg.launcher === 'rocket') {
          const spd = Math.min(15.5, 6 + t * 30)
          s.pos.addScaledVector(s.dir, spd * dt)
          ;({ x: px, y: py, z: pz } = s.pos)
          vy = spd
        } else {
          const u = t / rise
          const e = 1 - (1 - u) * (1 - u)
          px = x + (s.drift?.[0] ?? 0) * e
          pz = z + (s.drift?.[1] ?? 0) * e
          py = boxH + (s.h - boxH) * e
          vy = ((s.h - boxH) * 2 * (1 - u)) / rise
          s.pos.set(px, py, pz)
        }
        const tail = s.tail ?? 'gold'
        R.acc2.v += dt * (tail === 'glitter' || cfg.launcher === 'comet' ? 320 : 200)
        while (R.acc2.v >= 1) {
          R.acc2.v -= 1
          randDir(D)
          const col = tail === 'color' ? hueOf(s.colors?.[0]) : tail === 'glitter' ? [3, 2.6, 1.6] : [3, 2.0, 0.9]
          const life = cfg.launcher === 'comet' ? rand(0.8, 1.6) : rand(0.3, 0.8)
          fx.spark(px, py, pz, D[0] * 0.6, -vy * 0.15 + D[1] * 0.6, D[2] * 0.6, life, col[0], col[1], col[2], 0.07, 1.5, 0.6, 0.06, tail === 'glitter' ? 1 : 0)
        }
        fx.spark(px, py, pz, 0, vy * 0.02, 0, 0.05, 6, 4.5, 3, cfg.launcher === 'comet' ? 0.5 : 0.36, 0, 0, 0)
        if (Math.random() < dt * 22) fx.puff(px, py - 0.3, pz, 0, 0, 0, 2.5, 0.3, 1.2, 0.14)
        continue
      }
      // ----- burst -----
      s.burst = true
      const p = { x: s.pos.x, y: s.pos.y, z: s.pos.z }
      const opts = { colors: s.colors || ['gold'], colorEnd: s.colorEnd, scale: s.scale ?? 1, cam, later, count: s.count ?? 1 }
      const main = hueOf(opts.colors[0])
      if (s.bangs) {
        // sound shell: 2-3 hard flashes and bangs, no colour
        for (let b = 0; b < s.bangs; b++) {
          later(b * 0.38, () => {
            const q = { x: p.x + rand(-1.5, 1.5), y: p.y + rand(-1, 1), z: p.z + rand(-1.5, 1.5) }
            burst('bangs', q, opts)
            fx.burstLight(q.x, q.y, q.z, new THREE.Color(1, 0.95, 0.85), 1400, 0.3, 90)
            fx.skyFlash(new THREE.Color(1, 1, 1), 0.35)
            fx.addShake(0.12)
            R.playFar('bang', q, cam, { volume: 0.9 })
          })
        }
        continue
      }
      if (s.thunder) {
        burst('thunder', p, opts)
        fx.burstLight(p.x, p.y, p.z, new THREE.Color(1, 1, 1), 4200, 0.7, 140)
        fx.skyFlash(new THREE.Color(1, 1, 1), 1.2)
        fx.addShake(0.32)
        R.playFar('thunder', p, cam, { volume: 1 })
        continue
      }
      burst(s.pattern || 'peony', p, opts)
      if (s.pistil) burst('pistil', p, { ...opts, colors: [opts.colors[0], s.pistil] })
      if (s.crackle) {
        crackleField(p, 8 * opts.scale, 120, 1.6, { later })
        later(0.9, () => R.play('crackleBurst', { volume: 0.6 }))
      }
      const lc = lightColor(main)
      fx.burstLight(p.x, p.y, p.z, lc, s.light ?? 1800, 1.6, 110)
      fx.skyFlash(lc, s.flash ?? 0.6)
      fx.addShake(s.shake ?? 0.08)
      R.playFar(s.sound || 'boom', p, cam, { volume: s.volume ?? 0.9 })
    }

    if (F > st.end && !rt.done) rt.done = true
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={g} visible={false}>
        <ShellBoxModel model={cfg.model} />
      </group>
    </group>
  )
}
