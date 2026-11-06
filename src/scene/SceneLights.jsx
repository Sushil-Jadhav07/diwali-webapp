import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx } from '../crackers/fx'
import { DiyaLights } from './Diyas'

const SKY = new THREE.Color('#3a3a8a')
const GROUND = new THREE.Color('#2a160c')

export default function SceneLights() {
  const hemi = useRef()
  const moon = useRef()
  useFrame(() => {
    // firework flash lights the whole scene from above
    const f = fx.flash
    hemi.current.intensity = 0.55 + f * 0.9
    hemi.current.color.copy(SKY).lerp(fx.flashColor, Math.min(1, f * 0.6))
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={[SKY, GROUND, 0.55]} />
      <directionalLight
        ref={moon}
        position={[-14, 24, -18]}
        color="#9fb0ff"
        intensity={0.55}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      {/* soft warm glow from the string lights over the courtyard */}
      <pointLight position={[0, 5.2, -1]} color="#ffb260" intensity={14} distance={22} decay={1.4} />
      {/* warm porch lamp near the child's home spot */}
      <pointLight position={[1.5, 2.6, 7.2]} color="#ffc27a" intensity={6} distance={10} decay={1.5} />
      <DiyaLights />
    </>
  )
}
