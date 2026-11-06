import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { audio } from './audio'
import { useStore } from '../store/useStore'
import { rig } from '../scene/shared'
import { BAZAAR, CRACKER_GROUND } from '../world/layout'
import { LIVE_PEOPLE } from '../world/safety'

// Location-aware ambience: a bazaar bed that swells near the bazaar lane and a
// crowd murmur that follows how many people are near the child. The distant
// cracker bed ("ambience") keeps playing everywhere. All gated by the Ambient
// toggle; volumes updated 4x a second.
export default function AmbientAudio() {
  const st = useRef({ t: 0, ids: null })
  useFrame((_, dt) => {
    const s = st.current
    s.t += dt
    if (s.t < 0.25) return
    s.t = 0
    if (!audio.ready) return
    if (!s.ids) {
      s.ids = { bazaar: audio.play('bazaar', { volume: 0 }), crowd: audio.play('crowd', { volume: 0 }) }
      return
    }
    const on = useStore.getState().ambientOn
    // distance to the bazaar lane rectangle
    const dx = Math.max(BAZAAR.minX - rig.pos.x, 0, rig.pos.x - BAZAAR.maxX)
    const dz = Math.max(BAZAAR.minZ - rig.pos.z, 0, rig.pos.z - BAZAAR.maxZ)
    const dB = Math.hypot(dx, dz)
    const vB = on ? 0.42 * Math.max(0, 1 - dB / 18) : 0
    let near = 0
    for (const p of LIVE_PEOPLE) if (p && (p.x - rig.pos.x) ** 2 + (p.z - rig.pos.z) ** 2 < 100) near++
    const onGround = rig.pos.x > CRACKER_GROUND.minX && rig.pos.x < CRACKER_GROUND.maxX && rig.pos.z > CRACKER_GROUND.minZ && rig.pos.z < CRACKER_GROUND.maxZ
    const vC = on ? Math.min(0.3, near * 0.03 + (onGround ? 0.06 : 0)) : 0
    audio.volume('bazaar', s.ids.bazaar, vB)
    audio.volume('crowd', s.ids.crowd, vC)
  })
  return null
}
