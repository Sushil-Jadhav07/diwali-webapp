import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import Sky from './Sky'
import Ground from './Ground'
import Houses from './Houses'
import StringLights from './StringLights'
import Diyas from './Diyas'
import Trees from './Trees'
import Residents from './Residents'
import Mandir from './Mandir'
import Society from './Society'
import SceneLights from './SceneLights'
import CameraRig from './CameraRig'
import Child from './Child'
import FxLayer from '../crackers/FxLayer'
import CrackerStage from '../crackers/CrackerStage'
import { useState } from 'react'

export default function Experience() {
  // Start at 1x and raise resolution only when the GPU has headroom (cap 2).
  const maxDpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const [dpr, setDpr] = useState(1)
  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      camera={{ position: [0, 2.7, 9.6], fov: 50, near: 0.1, far: 600 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onCreated={(state) => {
        const { scene } = state
        if (import.meta.env.DEV) window.__r3f = state
        scene.background = new THREE.Color('#0b0a24')
        scene.fog = new THREE.FogExp2('#14102e', 0.022)
      }}
    >
      <PerformanceMonitor
        factor={0}
        flipflops={4}
        onChange={({ factor }) => setDpr(Math.round((1 + (maxDpr - 1) * factor) * 4) / 4)}
        onFallback={() => setDpr(1)}
      />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <SceneLights />
        <Sky />
        <Ground />
        <Houses />
        <StringLights />
        <Diyas />
        <Trees />
        <Society />
        <Mandir />
        <Residents />
        <Child />
        <CrackerStage />
        <FxLayer />
        <CameraRig />
      </Suspense>
      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.95} luminanceSmoothing={0.25} radius={0.78} />
        <Vignette offset={0.28} darkness={0.72} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
