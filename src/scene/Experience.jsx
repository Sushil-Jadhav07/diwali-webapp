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
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { TIERS } from '../world/quality'
import { fx } from '../crackers/fx'
import Backdrop from './Backdrop'
import ClickToMove from './ClickToMove'
import Bazaar from './bazaar/Bazaar'
import LakshmiCorner from './LakshmiCorner'
import NpcEvents from '../life/NpcEvents'
import AmbientAudio from '../audio/AmbientAudio'
import SceneReady from './SceneReady'
import TimeOfDay from './TimeOfDay'
import DangerRings from './DangerRings'
import LightPools from './LightPools'
import { START } from '../world/layout'

export default function Experience() {
  // Quality tier sets the resolution range; PerformanceMonitor scales within
  // it (dynamic resolution). Ultra may supersample up to a 4K-wide canvas.
  const tierId = useStore((s) => s.tier)
  const T = TIERS[tierId] || TIERS.medium
  const devDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const maxDpr = tierId === 'ultra' ? Math.min(T.dprMax, 3840 / Math.max(1, typeof window !== 'undefined' ? window.innerWidth : 1920)) : Math.min(T.dprMax, Math.max(1, devDpr))
  const minDpr = Math.min(T.dprMin, maxDpr)
  const [dpr, setDpr] = useState(1)
  useEffect(() => setDpr(Math.min(maxDpr, Math.max(minDpr, 1))), [maxDpr, minDpr])
  useEffect(() => {
    fx.tierScale = T.particles
    fx.ambientScale = T.ambientFx
  }, [T])
  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      camera={{ position: [START.x, 3.0, START.z + 6.2], fov: 50, near: 0.1, far: 700 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onCreated={(state) => {
        const { scene } = state
        if (import.meta.env.DEV) window.__r3f = state
        scene.background = new THREE.Color('#0b0a24')
        scene.fog = new THREE.FogExp2('#14102e', 0.0105)
      }}
    >
      <PerformanceMonitor
        factor={0}
        flipflops={4}
        onChange={({ factor }) => setDpr(Math.round((minDpr + (maxDpr - minDpr) * factor) * 4) / 4)}
        onFallback={() => setDpr(minDpr)}
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
        <Backdrop />
        <ClickToMove />
        <Bazaar />
        <LakshmiCorner />
        <NpcEvents />
        <AmbientAudio />
        <SceneReady />
        <TimeOfDay />
        <DangerRings />
        <LightPools />
        <Society />
        <Mandir />
        <Residents />
        <Child />
        <CrackerStage />
        <FxLayer />
        <CameraRig />
      </Suspense>
      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom mipmapBlur levels={T.bloomLevels} intensity={1.05} luminanceThreshold={0.95} luminanceSmoothing={0.25} radius={0.78} />
        <Vignette offset={0.28} darkness={T.vignette ? 0.72 : 0.0} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
