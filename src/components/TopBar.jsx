import { ReplayIcon, TrashIcon, SoundOnIcon, SoundOffIcon } from './Icons'
import { useStore, isBusy, useT } from '../store/useStore'
import { audio } from '../audio/audio'
import BrandLogo from './BrandLogo'
import Places from './Places'
import Settings from './Settings'
import TimeControl from './TimeControl'
import { LANGS } from '../i18n/index.js'

const btn =
  'flex h-10 min-w-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-night-900/70 px-2.5 text-sm font-semibold text-gold-200 backdrop-blur-md transition-all duration-150 hover:border-gold-400/40 hover:bg-night-700/70 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'

function IconButton({ label, onClick, disabled, children, desktopOnly = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`${btn} ${desktopOnly ? 'hidden sm:flex' : ''}`}>
      {children}
    </button>
  )
}

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    {children}
  </svg>
)
const FullIcon = () => (
  <Svg>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
)
const EyeOffIcon = () => (
  <Svg>
    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-3.2 4.2M6.2 6.6C4 8 2.6 10 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.9" />
  </Svg>
)

export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  } catch {
    /* fullscreen not allowed here */
  }
}

// Slim top bar: brand + society name on the left, compact controls on the right.
export default function TopBar() {
  const t = useT()
  const phase = useStore((s) => s.phase)
  const lastType = useStore((s) => s.lastType)
  const soundOn = useStore((s) => s.soundOn)
  const toggleSound = useStore((s) => s.toggleSound)
  const replay = useStore((s) => s.replay)
  const clearScene = useStore((s) => s.clearScene)
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const toggleUi = useStore((s) => s.toggleUi)
  const busy = isBusy(phase)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2.5 md:p-3">
      <div className="glass pointer-events-auto flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1.5">
        <BrandLogo />
        <div className="hidden min-w-0 leading-tight sm:block">
          <h1 className="truncate font-display text-[15px] font-semibold text-gold-200">{t('ui.society')}</h1>
          <p className="truncate font-hindi text-[11px] leading-[1.3] text-gold-400/90">
            {t('ui.subtitle')} · {t('ui.happyDiwali')}
          </p>
        </div>
      </div>
      <nav className="pointer-events-auto flex shrink-0 items-center gap-1.5" aria-label="Scene controls">
        <IconButton
          label={t('ui.replay')}
          onClick={() => {
            audio.unlock()
            replay()
          }}
          disabled={busy || !lastType}
        >
          <ReplayIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label={t('ui.clear')} onClick={clearScene}>
          <TrashIcon className="h-4 w-4" />
        </IconButton>
        <Places />
        <TimeControl />
        <label className={`${btn} hidden sm:flex`} title={t('ui.language')}>
          <span className="sr-only">{t('ui.language')}</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t('ui.language')}
            data-lang-select
            className="cursor-pointer bg-transparent font-hindi text-sm text-gold-200 outline-none"
          >
            {LANGS.map((l) => (
              <option key={l} value={l} className="bg-night-900 text-gold-200">
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
              </option>
            ))}
          </select>
        </label>
        <Settings />
        <IconButton desktopOnly label={t('ui.fullscreen')} onClick={toggleFullscreen}>
          <FullIcon />
        </IconButton>
        <IconButton desktopOnly label={t('ui.hideUi')} onClick={toggleUi}>
          <EyeOffIcon />
        </IconButton>
        <IconButton
          label={soundOn ? t('ui.mute') : t('ui.unmute')}
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
