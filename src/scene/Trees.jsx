import { useMemo } from 'react'
import { mulberry32 } from './shared'

function Tree({ position, seed = 1, scale = 1 }) {
  const blobs = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: 6 }, () => ({
      p: [(r() - 0.5) * 2.2, 3.6 + r() * 1.6, (r() - 0.5) * 2.2],
      s: 0.9 + r() * 0.7,
      c: ['#2b5a34', '#336b3c', '#244d2c'][Math.floor(r() * 3)],
    }))
  }, [seed])
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 3.2, 7]} />
        <meshStandardMaterial color="#3b2a20" roughness={1} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={b.c} roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* raised platform (chabutra) around the trunk */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.4, 10]} />
        <meshStandardMaterial color="#8f7c6b" roughness={0.95} />
      </mesh>
    </group>
  )
}

export default function Trees() {
  return (
    <>
      <Tree position={[-7.6, 0, 7.8]} seed={4} />
      <Tree position={[7.8, 0, -6.6]} seed={9} scale={0.85} />
    </>
  )
}
