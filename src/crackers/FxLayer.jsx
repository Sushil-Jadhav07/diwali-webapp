import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { fx } from './fx'

// Mounts the shared particle pools and pooled lights into the scene, and
// steps them once per frame.
export default function FxLayer() {
  useMemo(() => fx.init(), [])
  const gl = useThree((s) => s.gl)
  useFrame((state, dt) => {
    const cam = state.camera
    // pixels per world unit at distance 1
    const scale = (gl.domElement.height * 0.5) / Math.tan((cam.fov * Math.PI) / 360)
    fx.update(Math.min(dt, 1 / 20), state.clock.elapsedTime, scale)
  })
  return (
    <>
      <primitive object={fx.smoke.points} />
      <primitive object={fx.sparks.lines} />
      <primitive object={fx.sparks.points} />
      {fx.lightPool.lights.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  )
}
