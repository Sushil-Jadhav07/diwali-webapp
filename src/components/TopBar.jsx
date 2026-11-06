import { ReplayIcon, TrashIcon, SoundOnIcon, SoundOffIcon, MusicIcon, MusicOffIcon } from './Icons'
import Places from './Places'
import { SOCIETY_NAME } from '../world/layout'
import { useStore, isBusy } from '../store/useStore'
import { audio } from '../audio/audio'
import BrandLogo from './BrandLogo'

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-night-900/70 px-3 text-sm font-semibold text-gold-200 backdrop-blur-md transition-all duration-150 hover:border-gold-400/40 hover:bg-night-700/70 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export default function TopBar() {
  const phase = useStore((s) => s.phase)
  const lastType = useStore((s) => s.lastType)
  const soundOn = useStore((s) => s.soundOn)
  const toggleSound = useStore((s) => s.toggleSound)
  const replay = useStore((s) => s.replay)
  const clearScene = useStore((s) => s.clearScene)
  const ambientOn = useStore((s) => s.ambientOn)
  const toggleAmbient = useStore((s) => s.toggleAmbient)
  const busy = isBusy(phase)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 md:p-4">
      <div className="glass pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-2xl px-2.5 py-2 md:gap-3 md:px-3">
        <BrandLogo />
        <span className="hidden h-8 w-px shrink-0 bg-gold-400/25 sm:block" aria-hidden="true" />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-display text-[15px] font-semibold text-gold-200 md:text-lg">
            {SOCIETY_NAME}
          </h1>
          <p className="truncate font-hindi text-xs text-gold-400/90" lang="hi">
            Diwali Cracker Playground · शुभ दीपावली
          </p>
        </div>
      </div>
      <nav className="pointer-events-auto flex shrink-0 gap-1.5 md:gap-2" aria-label="Scene controls">
        <IconButton
          label="Replay last cracker"
          onClick={() => {
            audio.unlock()
            replay()
          }}
          disabled={busy || !lastType}
        >
          <ReplayIcon className="h-4 w-4" />
          <span className="hidden lg:inline">Replay</span>
        </IconButton>
        <IconButton label="Clear scene" onClick={clearScene}>
          <TrashIcon className="h-4 w-4" />
          <span className="hidden lg:inline">Clear</span>
        </IconButton>
        <IconButton
          label={ambientOn ? 'Turn ambient sound off' : 'Turn ambient sound on'}
          onClick={() => {
            audio.unlock()
            toggleAmbient()
          }}
        >
          {ambientOn ? <MusicIcon className="h-4 w-4" /> : <MusicOffIcon className="h-4 w-4" />}
        </IconButton>
        <Places />
        <IconButton
          label={soundOn ? 'Mute sound' : 'Turn sound on'}
          onClick={() => {
            audio.unlock()
            toggleSound()
          }}
        >
          {soundOn ? <SoundOnIcon className="h-4 w-4" /> : <SoundOffIcon className="h-4 w-4" />}
        </IconButton>
      </nav>
    </header>
  )
}
