import { useMemo } from 'react'
import * as THREE from 'three'
import { makeRangoliTexture, makeTileTexture } from './textures'

export default function Ground() {
  const tiles = useMemo(() => {
    const t = makeTileTexture()
    t.repeat.set(26, 26)
    return t
  }, [])
  const rangoli = useMemo(() => makeRangoliTexture(3), [])
  const rangoli2 = useMemo(() => makeRangoliTexture(21), [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={tiles} roughness={0.78} metalness={0.02} color="#c9b6a6" />
      </mesh>
      {/* main rangoli in front of the central houses */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -6.4]} receiveShadow>
        <circleGeometry args={[1.7, 64]} />
        <meshStandardMaterial
          map={rangoli}
          emissiveMap={rangoli}
          emissive="#ffffff"
          emissiveIntensity={0.16}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
      {/* small rangoli by the child's starting spot */}
      <mesh rotation-x={-Math.PI / 2} position={[3.4, 0.012, 3.6]} receiveShadow>
        <circleGeometry args={[0.9, 48]} />
        <meshStandardMaterial
          map={rangoli2}
          emissiveMap={rangoli2}
          emissive="#ffffff"
          emissiveIntensity={0.16}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  )
}

export const RANGOLI_CENTER = new THREE.Vector3(0, 0, -6.4)
