import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from '../fx'
import { useCrackerResources } from '../common'
import { rig } from '../../scene/shared'

// ---------------------------------------------------------------------------
// Toy cap gun (registry kind 'capgun'). The bright plastic toy lives in the
// child's hand (Child.jsx draws it and exposes rig.capPoint). Pointed up at the
// sky, never at people. Each trigger pull: a small paper-cap click-pop, a tiny
// spark and a puff of grey smoke; the red cap roll shows a burnt spot.
// cfg: { pulls: [min, max], gap: [min, max] }
// ---------------------------------------------------------------------------
const P = new THREE.Vector3()
const D = [0, 0, 0]

export default function CapGun({ c, cfg = {} }) {
  const R = useCrackerResources()
  const plan = useMemo(() => {
    const [a, b] = cfg.pulls ?? [6, 10]
    const n = a + Math.floor(Math.random() * (b - a + 1))
    const [g0, g1] = cfg.gap ?? [0.45, 0.75]
    const times = []
    let t = 0.4
    for (let i = 0; i < n; i++) {
      times.push(t)
      t += rand(g0, g1)
    }
    return { n, times, end: t + 0.9 }
  }, [cfg.pulls, cfg.gap])

  useFrame((state) => {
    const rt = c.rt
    if (rt.litAt < 0) return
    const F = state.clock.elapsedTime - rt.litAt
    rt.pulls ??= 0
    while (rt.pulls < plan.n && F >= plan.times[rt.pulls]) {
      rt.pulls++
      rt.fired = true
      rt.pullAt = state.clock.elapsedTime
      R.play('capPop', { volume: 0.55 })
      if (rig.capPoint) rig.capPoint.getWorldPosition(P)
      else P.set(rig.pos.x, 1.2, rig.pos.z)
      for (let k = 0; k < 7; k++) {
        randDir(D)
        fx.spark(P.x, P.y, P.z, D[0] * 1.2, D[1] * 1.2 + 0.4, D[2] * 1.2, rand(0.05, 0.12), 5, 3.6, 1.6, 0.03, 3, 0.2, 0.02)
      }
      fx.puff(P.x, P.y + 0.02, P.z, rand(-0.05, 0.05), 0.25, rand(-0.05, 0.05), 1.8, 0.06, 1.6, 0.22)
    }
    rt.burn = rt.pulls / plan.n
    if (F > plan.end && !rt.done) rt.done = true
  })
  return null
}
