import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { ENV, computeEnv } from '../world/env'
import { LIT_WIN_MAT } from './Houses'
import { FLAME_MAT } from './Diyas'
import { GLOW_GAIN } from './society/Glows'

// Drives the evening clock: plays from sunset towards night (or the full cycle),
// eases to the slider value otherwise, and updates shared emissives each frame.
const CYCLE_SECONDS = 180 // sunset -> late night when playing the full cycle
export default function TimeOfDay() {
  const st = useRef({ tod: useStore.getState().tod, sync: 0, was: false })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const s = st.current
    const store = useStore.getState()
    if (store.todPlaying && !s.was) s.tod = store.tod // adopt the starting point (e.g. restart at sunset)
    s.was = store.todPlaying
    if (store.todPlaying) {
      s.tod = Math.min(store.todTarget, s.tod + dt / CYCLE_SECONDS)
      s.sync += dt
      if (s.sync > 0.25) {
        s.sync = 0
        store.syncTod(s.tod)
      }
      if (s.tod >= store.todTarget - 1e-4) {
        store.syncTod(s.tod)
        store.stopCycle()
      }
    } else {
      s.tod += (store.tod - s.tod) * (1 - Math.exp(-4 * dt))
    }
    computeEnv(s.tod)
    LIT_WIN_MAT.emissiveIntensity = 1.15 * ENV.windows
    const d = ENV.diya
    FLAME_MAT.color.setRGB(6 * d, 3 * d, 0.8 * d)
    GLOW_GAIN.value = ENV.glow
  })
  return null
}
