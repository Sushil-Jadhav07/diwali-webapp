import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx, rand, randDir } from './fx'
import { COLORS, useCrackerResources } from './common'
import { rig } from '../scene/shared'

const IGNITE = 0.35
const BURN = 9.0

// Sparkler held in the child's right hand (the wire mesh lives in Child.jsx;
// this component emits sparks at rig.sparkTip and owns the light + sound).
export default function Phuljhadi({ c }) {
  const R = useCrackerResources()
  const tip = useMemo(() => new THREE.Vector3(), [])
  const prev = useMemo(() => new THREE.Vector3(), [])
  const d3 = useMemo(() => [0, 0, 0], [])
  const once = useRef(false)

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const rt = c.rt
    if (rt.litAt < 0 || !rig.sparkTip) return
    const tl = state.clock.elapsedTime - rt.litAt
    const F = tl - IGNITE
    if (F < 0) return
    if (F > BURN) {
      if (!rt.done) {
        rt.done = true
        R.stop('crackle', 250)
        R.dropLight()
      }
      return
    }
    rt.fired = true
    rt.burn = F / BURN
    rig.sparkTip.getWorldPosition(tip)
    if (!once.current) {
      once.current = true
      prev.copy(tip)
      R.play('crackle', { volume: 0.5 })
    }
    // hand velocity carries the sparks a little
    const hvx = (tip.x - prev.x) / Math.max(dt, 1e-3)
    const hvy = (tip.y - prev.y) / Math.max(dt, 1e-3)
    const hvz = (tip.z - prev.z) / Math.max(dt, 1e-3)
    prev.copy(tip)

    const I = Math.min(1, F / 0.4) * (F > BURN - 1 ? Math.max(0, BURN - F) : 1)
    R.acc.v += dt * 520 * I
    const gold = COLORS.gold
    while (R.acc.v >= 1) {
      R.acc.v -= 1
      randDir(d3)
      const sp = rand(1.6, 4.2)
      const life = rand(0.14, 0.42)
      fx.spark(tip.x, tip.y, tip.z, d3[0] * sp + hvx * 0.2, d3[1] * sp + hvy * 0.2, d3[2] * sp + hvz * 0.2, life, gold[0] * 1.1, gold[1] * 1.15, gold[2], 0.028, 2.6, 0.35, 0.03)
      // forked branches: the classic star-burst look of a sparkler
      if (Math.random() < 0.28) {
        const off = rand(0.06, 0.2)
        const bx = tip.x + d3[0] * off
        const by = tip.y + d3[1] * off
        const bz = tip.z + d3[2] * off
        for (let k = 0; k < 3; k++) {
          const ex = d3[0] + rand(-0.9, 0.9)
          const ey = d3[1] + rand(-0.9, 0.9)
          const ez = d3[2] + rand(-0.9, 0.9)
          fx.spark(bx, by, bz, ex * 1.4, ey * 1.4, ez * 1.4, rand(0.05, 0.14), 3, 2.4, 1.2, 0.02, 3, 0.2, 0.025)
        }
      }
    }
    // hot glowing tip
    fx.spark(tip.x, tip.y, tip.z, 0, 0, 0, 0.04, 5, 3.8, 2.2, 0.09, 0, 0, 0)
    if (Math.random() < dt * 8) fx.puff(tip.x, tip.y + 0.05, tip.z, rand(-0.05, 0.05), 0.2, rand(-0.05, 0.05), 2.2, 0.08, 1.5, 0.16)

    const l = R.getLight()
    if (l) {
      l.position.copy(tip)
      l.color.setRGB(1, 0.75, 0.42)
      l.intensity = 7 * I * (0.75 + Math.random() * 0.5)
      l.distance = 9
    }
  })
  return null
}
