import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import Phuljhadi from './Phuljhadi'
import Anar, { AnarDeluxe, AnarDeluxeModel, AnarModel } from './Anar'
import Chakri, { ChakriDeluxe, ChakriDeluxeModel, ChakriModel } from './Chakri'
import Rocket, { BottleModel } from './Rocket'
import SkyShot, { SkyShotModel } from './SkyShot'
import AsynkShot, { AsynkShotModel } from './AsynkShot'
import ColorShower, { ColorShowerModel } from './ColorShower'
import Snake, { SnakeSpent } from './Snake'
import Cake, { CakeModel } from './Cake'
import RocketBundle, { BundleStandModel } from './RocketBundle'
import { Bijli, BombScraps, Sutli } from './Bombs'
import Ladi, { LadiScraps } from './Ladi'
import PopPop, { PopPopScraps } from './PopPop'
import { fx } from './fx'

const ACTIVE = {
  phuljhadi: Phuljhadi,
  anar: Anar,
  anardeluxe: AnarDeluxe,
  colorshower: ColorShower,
  chakri: Chakri,
  chakrideluxe: ChakriDeluxe,
  snake: Snake,
  asynk: AsynkShot,
  rocket: Rocket,
  rocketbundle: RocketBundle,
  skyshot: SkyShot,
  cake: Cake,
  bijli: Bijli,
  sutli: Sutli,
  ladi: Ladi,
  poppop: PopPop,
}
// Burnt-out shells left on the ground (receive `burnt` and `spot` props).
const SPENT = {
  anar: AnarModel,
  anardeluxe: AnarDeluxeModel,
  colorshower: ColorShowerModel,
  chakri: ChakriModel,
  chakrideluxe: ChakriDeluxeModel,
  snake: SnakeSpent,
  asynk: AsynkShotModel,
  rocket: BottleModel,
  rocketbundle: BundleStandModel,
  skyshot: SkyShotModel,
  cake: CakeModel,
  bijli: BombScraps,
  sutli: BombScraps,
  ladi: LadiScraps,
  poppop: PopPopScraps,
}

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
            <Model burnt spot={s.spot} from={s.from} />
          </group>
        )
      })}
    </group>
  )
}
