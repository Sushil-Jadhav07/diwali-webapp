import { motion } from 'framer-motion'
import { FlameIcon, SpinnerIcon, ShieldIcon } from './Icons'
import { CATEGORIES, CRACKERS } from '../crackers/catalog'
import { useStore, isBusy, PHASE_LABEL } from '../store/useStore'
import CrackerIcon from './CrackerIcon'
import { audio } from '../audio/audio'

const GROUPS = CATEGORIES.map((cat) => ({ ...cat, items: CRACKERS.filter((c) => c.category === cat.id) })).filter(
  (g) => g.items.length > 0,
)

function useLight() {
  const request = useStore((s) => s.request)
  return (id) => {
    audio.unlock()
    request(id)
  }
}

function CardDesktop({ c, busy, active, onLight, i }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(0.6, 0.035 * i), duration: 0.25, ease: 'easeOut' }}
      className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors duration-200 ${
        active
          ? 'border-gold-400/70 bg-gold-400/10'
          : 'border-white/5 bg-white/[0.03] hover:border-gold-400/30 hover:bg-white/[0.06]'
      }`}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-night-950/70 text-gold-300 ring-1 ring-gold-400/20">
        <CrackerIcon id={c.id} className="h-9 w-9" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[16px] leading-tight font-semibold text-gold-200">{c.name}</p>
        <p className="font-hindi text-[14px] leading-tight text-gold-400/90" lang="hi">
          {c.hindi}
        </p>
        <p className="truncate text-xs text-white/55">{c.blurb}</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => onLight(c.id)}
        aria-label={`Light ${c.name}`}
        data-cracker={c.id}
        className="flex h-11 min-w-[80px] cursor-pointer items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-gold-400 to-ember-600 px-3 font-display text-sm font-semibold text-night-950 shadow-[0_4px_18px_-4px_rgb(249_115_22/0.7)] transition-all duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 active:scale-95 disabled:cursor-not-allowed disabled:from-white/15 disabled:to-white/10 disabled:text-white/45 disabled:shadow-none"
      >
        {active ? <SpinnerIcon className="h-4 w-4" /> : <FlameIcon className="h-4 w-4" />}
        {active ? 'Busy' : 'Light it'}
      </button>
    </motion.li>
  )
}

function CardMobile({ c, busy, active, onLight }) {
  return (
    <li className="w-[74px] shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={() => onLight(c.id)}
        aria-label={`Light ${c.name}`}
        className={`flex h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95 disabled:cursor-not-allowed ${
          active ? 'border-gold-400/80 bg-gold-400/15' : 'border-white/10 bg-white/[0.04] disabled:opacity-45'
        }`}
      >
        {active ? (
          <SpinnerIcon className="h-8 w-8 text-gold-300" />
        ) : (
          <CrackerIcon id={c.id} className="h-8 w-8 text-gold-300" />
        )}
        <span className="text-center font-display text-[11.5px] leading-tight font-semibold text-gold-200">{c.name}</span>
        <span className="text-center font-hindi text-[11px] leading-[1.15] text-gold-400/90" lang="hi">
          {c.hindi}
        </span>
      </button>
    </li>
  )
}

export default function Sidebar() {
  const phase = useStore((s) => s.phase)
  const current = useStore((s) => s.current)
  const busy = isBusy(phase)
  const onLight = useLight()
  let n = 0

  return (
    <>
      {/* Desktop / tablet: left sidebar, scrollable, grouped by category */}
      <aside className="glass pointer-events-auto absolute top-24 bottom-4 left-4 z-20 hidden w-[300px] flex-col rounded-2xl p-4 md:flex">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-gold-200">Crackers</h2>
            <p className="text-xs text-white/60">
              {CRACKERS.length} to try. Pick one and Aarav lights it.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
              busy ? 'bg-ember-500/20 text-ember-500' : 'bg-emerald-400/15 text-emerald-300'
            }`}
            aria-live="polite"
          >
            {busy ? PHASE_LABEL[phase] : 'Ready'}
          </span>
        </div>
        <nav className="mb-2 flex gap-1 overflow-x-auto no-scrollbar" aria-label="Cracker categories">
          {GROUPS.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => document.getElementById(`cat-${grp.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="min-h-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-gold-200 transition-colors hover:border-gold-400/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold-300"
            >
              {grp.label}
            </button>
          ))}
        </nav>
        <div className="no-scrollbar -mx-1 flex-1 overflow-y-auto overscroll-contain px-1 pb-1">
          {GROUPS.map((grp) => (
            <section key={grp.id} aria-labelledby={`cat-${grp.id}`} className="mb-3 last:mb-0">
              <h3
                id={`cat-${grp.id}`}
                className="sticky top-0 z-10 -mx-1 mb-1.5 flex items-baseline gap-2 rounded-md bg-night-900/90 px-1.5 py-1 font-display text-[12px] font-semibold tracking-[0.12em] text-gold-300 uppercase backdrop-blur-sm"
              >
                {grp.label}
                <span className="font-hindi text-[12px] tracking-normal text-gold-400/70 normal-case" lang="hi">
                  {grp.hindi}
                </span>
                <span className="ml-auto text-[10px] tracking-normal text-white/40">{grp.items.length}</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {grp.items.map((c) => (
                  <CardDesktop key={c.id} c={c} i={n++} busy={busy} active={current?.type === c.id} onLight={onLight} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-night-950/60 px-3 py-2 text-xs text-gold-200/90">
          <ShieldIcon className="h-4 w-4 shrink-0 text-gold-400" />
          Light crackers only with an adult nearby.
        </p>
      </aside>

      {/* Mobile: bottom bar, horizontal scroll grouped by category */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:hidden">
        <div className="glass mx-2 mb-[max(8px,env(safe-area-inset-bottom))] rounded-2xl px-2 pt-2 pb-1.5">
          <div className="no-scrollbar flex gap-2 overflow-x-auto overscroll-x-contain">
            {GROUPS.map((grp) => (
              <div key={grp.id} className="flex shrink-0 items-stretch gap-1.5" role="group" aria-label={grp.label}>
                <span
                  className="flex w-4 shrink-0 items-center justify-center text-[10px] font-bold tracking-wider text-gold-400/80 uppercase [writing-mode:vertical-rl]"
                  style={{ transform: 'rotate(180deg)' }}
                  aria-hidden
                >
                  {grp.label}
                </span>
                <ul className="flex gap-1.5">
                  {grp.items.map((c) => (
                    <CardMobile key={c.id} c={c} busy={busy} active={current?.type === c.id} onLight={onLight} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-gold-200/80">
            <ShieldIcon className="h-3.5 w-3.5 text-gold-400" />
            Light crackers only with an adult nearby.
          </p>
        </div>
      </div>
    </>
  )
}
