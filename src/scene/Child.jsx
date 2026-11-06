// Placeholder (M1). Replaced by the procedural child in M2.
export default function Child() {
  return (
    <mesh position={[0, 0.6, 4.2]} castShadow>
      <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
      <meshStandardMaterial color="#f2d7a8" />
    </mesh>
  )
}
