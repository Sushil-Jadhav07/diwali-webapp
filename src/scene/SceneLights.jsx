import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { fx } from '../crackers/fx'
import { rig } from './shared'

const SKY = new THREE.Color('#5254a8')
const FOG = new THREE.Color('#14102e')
const GROUND = new THREE.Color('#7a4a24') // warm bounce from string lights

export default function SceneLights() {
  const hemi = useRef()
  const moon = useRef()
  const fill = useRef()
  const scene = useThree((s) => s.scene)
  useFrame(() => {
    // moonlight shadow frustum follows the child (snapped to texels: no shimmer)
    const m = moon.current
    if (m) {
      const snap = 36 / 1024
      const px = Math.round(rig.pos.x / snap) * snap
      const pz = Math.round(rig.pos.z / snap) * snap
      m.position.set(px - 14, 24, pz - 18)
      m.target.position.set(px, 0, pz)
      m.target.updateMatrixWorld()
    }
    if (fill.current) fill.current.position.set(rig.pos.x + 1.5, 2.6, rig.pos.z + 3)
    // firework flash lights the whole scene from above
    const f = fx.flash
    // the night air (fog) picks up a hint of the burst colour too
    if (scene.fog) scene.fog.color.copy(FOG).lerp(fx.flashColor, Math.min(0.5, f * 0.18))
    hemi.current.intensity = 1.85 + f * 0.9
    hemi.current.color.copy(SKY).lerp(fx.flashColor, Math.min(1, f * 0.6))
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={[SKY, GROUND, 1.85]} />
      <directionalLight
        ref={moon}
        position={[-14, 24, -18]}
        color="#9fb0ff"
        intensity={1.15}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      {/* warm glow from the festoons + diyas over the Cracker Ground */}
      <pointLight position={[0, 4.6, -6]} color="#ffa95a" intensity={30} distance={32} decay={1.25} />
      {/* warm fill that follows the child wherever he walks */}
      <pointLight ref={fill} position={[1.5, 2.6, 9]} color="#ffc27a" intensity={11} distance={16} decay={1.4} />
    </>
  )
}
