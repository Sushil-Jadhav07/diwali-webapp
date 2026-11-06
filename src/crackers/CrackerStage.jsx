import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import Phuljhadi from './Phuljhadi'
import Anar, { AnarModel } from './Anar'
import Chakri, { ChakriModel } from './Chakri'
import Rocket, { BottleModel } from './Rocket'
import SkyShot, { SkyShotModel } from './SkyShot'
import { fx } from './fx'

const ACTIVE = { phuljhadi: Phuljhadi, anar: Anar, chakri: Chakri, rocket: Rocket, skyshot: SkyShot }
const SPENT = { anar: AnarModel, chakri: ChakriModel, rocket: BottleModel, skyshot: SkyShotModel }

// Renders the running cracker (keyed by sequence id so every run is fresh)
// plus the burnt-out shells left on the ground until "Clear scene".
export default function CrackerStage() {
  const current = useStore((s) => s.current)
  const spent = useStore((s) => s.spent)
  const Active = current && ACTIVE[current.type]

  // Clearing the scene also wipes lingering smoke / sparks.
  useEffect(() => {
    if (spent.length === 0 && !current) fx.clear()
  }, [spent, current])

  return (
    <group>
      {Active && <Active key={current.id} c={current} />}
      {spent.map((s) => {
        const Model = SPENT[s.type]
        if (!Model) return null
        return (
          <group key={s.id} position={[s.spot[0], 0, s.spot[1]]}>
            <Model burnt />
          </group>
        )
      })}
    </group>
  )
}
