import { WORLD } from '../world/layout'
import { input, navTo } from '../world/input'
import { rig } from './shared'
import { useStore } from '../store/useStore'

// Invisible floor that turns a click/tap (not an orbit drag) into an A* walk.
export default function ClickToMove() {
  const w = WORLD.maxX - WORLD.minX
  const d = WORLD.maxZ - WORLD.minZ
  const onClick = (e) => {
    if (e.delta > 6) return // that was an orbit drag
    e.stopPropagation()
    const { phase, showHint } = useStore.getState()
    if (phase !== 'idle') return
    if (!navTo(rig.pos.x, rig.pos.z, e.point.x, e.point.z, 'click')) showHint('hint.cantReach')
  }
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(WORLD.minX + WORLD.maxX) / 2, 0.02, (WORLD.minZ + WORLD.maxZ) / 2]} onClick={onClick}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export { input }
