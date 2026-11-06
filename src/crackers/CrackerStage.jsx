// M2 placeholder: shows the placed cracker and finishes 4 s after lighting.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

export default function CrackerStage() {
  const current = useStore((s) => s.current)
  return current && current.type !== 'phuljhadi' ? <Temp key={current.id} c={current} /> : current ? <TempHeld key={current.id} c={current} /> : null
}

function Temp({ c }) {
  const ref = useRef()
  useFrame((s) => {
    ref.current.visible = c.rt.placed
    if (c.rt.litAt > 0 && s.clock.elapsedTime - c.rt.litAt > 4) c.rt.done = true
  })
  return (
    <mesh ref={ref} position={[c.spot[0], 0.1, c.spot[1]]} visible={false}>
      <cylinderGeometry args={[0.05, 0.08, 0.2, 10]} />
      <meshStandardMaterial color="#c2410c" />
    </mesh>
  )
}
function TempHeld({ c }) {
  useFrame((s) => {
    if (c.rt.litAt > 0) c.rt.burn = Math.min(1, (s.clock.elapsedTime - c.rt.litAt) / 4)
    if (c.rt.litAt > 0 && s.clock.elapsedTime - c.rt.litAt > 4) c.rt.done = true
  })
  return null
}
