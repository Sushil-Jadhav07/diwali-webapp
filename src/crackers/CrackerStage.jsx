import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { CRACKER_BY_ID } from './catalog'
import Phuljhadi from './Phuljhadi'
import { AnarModel, Fountain } from './Anar'
import { ChakriModel, Spinner } from './Chakri'
import Rocket, { BottleModel } from './Rocket'
import SkyShot, { SkyShotModel } from './SkyShot'
import AsynkShot, { AsynkShotModel } from './AsynkShot'
import ColorShower, { ColorShowerModel } from './ColorShower'
import Snake, { SnakeSpent } from './Snake'
import Cake, { CakeModel } from './Cake'
import RocketBundle, { BundleStandModel } from './RocketBundle'
import { Bomb, BombScraps } from './Bombs'
import Ladi, { LadiScraps } from './Ladi'
import PopPop, { PopPopScraps } from './PopPop'
import Shells, { ShellBoxModel } from './handlers/Shells'
import CapGun from './handlers/CapGun'
import { fx } from './fx'

// Registry kind -> behaviour handler. Every handler receives { c, cfg }.
const HANDLERS = {
  shells: Shells,
  fountain: Fountain,
  spinner: Spinner,
  bomb: Bomb,
  chain: Ladi,
  capgun: CapGun,
  sparkler: Phuljhadi,
  rocket: Rocket,
  rocketbundle: RocketBundle,
  skyshot: SkyShot,
  cake: Cake,
  asynk: AsynkShot,
  colorshower: ColorShower,
  snake: Snake,
  poppop: PopPop,
}

// Burnt-out leftovers on the ground, by kind.
function Spent({ s }) {
  const def = CRACKER_BY_ID[s.type]
  if (!def) return null
  const p = def.params || {}
  switch (def.kind) {
    case 'fountain':
      return (
        <group scale={p.scale ?? 1}>
          <AnarModel burnt variant={p.variant} />
        </group>
      )
    case 'spinner':
      return p.vertical ? null : (
        <group scale={p.scale ?? 1}>
          <ChakriModel burnt variant={p.variant} />
        </group>
      )
    case 'shells':
      return <ShellBoxModel burnt model={p.model} />
    case 'bomb':
      return <BombScraps spot={s.spot} />
    case 'chain':
      return <LadiScraps spot={s.spot} from={s.from} />
    case 'rocket':
      return <BottleModel />
    case 'rocketbundle':
      return <BundleStandModel burnt />
    case 'skyshot':
      return <SkyShotModel burnt />
    case 'cake':
      return <CakeModel burnt />
    case 'asynk':
      return <AsynkShotModel burnt />
    case 'colorshower':
      return <ColorShowerModel burnt />
    case 'snake':
      return <SnakeSpent spot={s.spot} />
    case 'poppop':
      return <PopPopScraps spot={s.spot} />
    default:
      return null
  }
}

// Renders the running cracker (keyed by sequence id so every run is fresh)
// plus the burnt-out shells left on the ground until "Clear scene".
export default function CrackerStage() {
  const current = useStore((s) => s.current)
  const spent = useStore((s) => s.spent)
  const def = current && CRACKER_BY_ID[current.type]
  const Active = def && HANDLERS[def.kind]

  // Clearing the scene also wipes lingering smoke / sparks.
  useEffect(() => {
    if (spent.length === 0 && !current) fx.clear()
  }, [spent, current])

  return (
    <group>
      {Active && <Active key={current.id} c={current} cfg={def.params} />}
      {spent.map((s) => (
        <group key={s.id} position={[s.spot[0], 0, s.spot[1]]}>
          <Spent s={s} />
        </group>
      ))}
    </group>
  )
}
