import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { detectTier, TIERS } from '../world/quality'

// Marks the scene ready after the first rendered frames (hides the loading
// screen) and resolves the quality tier ('auto' -> detected from the GPU).
export default function SceneReady() {
  const gl = useThree((s) => s.gl)
  const frames = useRef(0)
  useFrame(() => {
    frames.current++
    if (frames.current === 3) {
      const st = useStore.getState()
      const tier = st.quality === 'auto' ? detectTier(gl) : st.quality
      st.setTier(TIERS[tier] ? tier : 'medium')
      st.setSceneReady()
    }
  })
  return null
}
