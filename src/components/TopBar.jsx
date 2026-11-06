import { ReplayIcon, TrashIcon, SoundOnIcon, SoundOffIcon } from './Icons'
import { useStore, isBusy } from '../store/useStore'
import { audio } from '../audio/audio'

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
  const spent = useStore((s) => s.spent.length)
  const soundOn = useStore((s) => s.soundOn)
  const toggleSound = useStore((s) => s.toggleSound)
  const replay = useStore((s) => s.replay)
  const clearScene = useStore((s) => s.clearScene)
  const busy = isBusy(phase)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 md:p-4">
      <div className="glass pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2 md:px-4">
        <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
          <path d="M16 3c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#fcd776" />
          <path d="M16 9c1.4 2.4 2.2 3.8 2.2 5.2a2.2 2.2 0 0 1-4.4 0c0-1.4.8-2.8 2.2-5.2z" fill="#fff7e6" />
          <path d="M4 19h24c-1 6-6 10-12 10S5 25 4 19z" fill="#c2410c" />
          <path d="M7 21.5h18" stroke="#fcd776" strokeWidth="1.2" />
        </svg>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-display text-[15px] font-semibold text-gold-200 md:text-lg">
            Diwali Cracker Playground
          </h1>
          <p className="font-hindi text-xs text-gold-400/90" lang="hi">
            शुभ दीपावली · Happy Diwali
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
        <IconButton label="Clear scene" onClick={clearScene} disabled={busy || spent === 0}>
          <TrashIcon className="h-4 w-4" />
          <span className="hidden lg:inline">Clear</span>
        </IconButton>
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
