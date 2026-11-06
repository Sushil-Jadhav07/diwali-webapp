import { useMemo } from 'react'
import * as THREE from 'three'
import { makeRangoliTexture, makeTileTexture } from './textures'
import { RANGOLI_MAIN, RANGOLI_SMALL } from './society/layout'

export default function Ground() {
  const tiles = useMemo(() => {
    const t = makeTileTexture()
    t.repeat.set(26, 26)
    return t
  }, [])
  const rangoli = useMemo(() => makeRangoliTexture(3, { size: 2048, variant: 'main' }), [])
  const rangoli2 = useMemo(() => makeRangoliTexture(21, { size: 1024, variant: 'small' }), [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={tiles} roughness={0.78} metalness={0.02} color="#c9b6a6" />
      </mesh>
      {/* main rangoli in front of the central houses */}
      <mesh rotation-x={-Math.PI / 2} position={[RANGOLI_MAIN.x, 0.012, RANGOLI_MAIN.z]} receiveShadow>
        <circleGeometry args={[RANGOLI_MAIN.r, 96]} />
        <meshStandardMaterial
          map={rangoli}
          emissiveMap={rangoli}
          emissive="#ffffff"
          emissiveIntensity={0.24}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
      {/* small rangoli by the child's starting spot */}
      <mesh rotation-x={-Math.PI / 2} position={[RANGOLI_SMALL.x, 0.012, RANGOLI_SMALL.z]} receiveShadow>
        <circleGeometry args={[RANGOLI_SMALL.r, 64]} />
        <meshStandardMaterial
          map={rangoli2}
          emissiveMap={rangoli2}
          emissive="#ffffff"
          emissiveIntensity={0.24}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  )
}

export const RANGOLI_CENTER = new THREE.Vector3(RANGOLI_MAIN.x, 0, RANGOLI_MAIN.z)
