import { useEffect, useState } from 'react'
import { FlameIcon, SpinnerIcon, ShieldIcon } from './Icons'
import { CATEGORIES, CRACKERS } from '../crackers/catalog'
import { useStore, isBusy, useT } from '../store/useStore'
import { crackerName, crackerHint, crackerAltName } from '../i18n/index.js'
import CrackerIcon from './CrackerIcon'
import { audio } from '../audio/audio'

// Compact cracker menu.
// Desktop: a slim 64px glass rail (category tabs + cracker icons) that expands
// to ~272px on hover / click / Tab with names, second-language names and hints.
// It floats over the canvas, so it never shifts the 3D view.
// Mobile: a bottom sheet with category chips and a scrollable row.
const GROUPS = CATEGORIES.map((cat) => ({ ...cat, items: CRACKERS.filter((c) => c.category === cat.id) })).filter((g) => g.items.length)
const CAT_ICON = { sky: 'skyshot', ground: 'anar', handheld: 'phuljhadi', sound: 'laxmi', toy: 'capgun' }

function useLight() {
  const request = useStore((s) => s.request)
  return (id) => {
    audio.unlock()
    request(id)
  }
}

function Row({ c, lang, expanded, busy, active, onLight, t }) {
  const name = crackerName(lang, c.id)
  return (
    <li>
      <button
        type="button"
        disabled={busy}
        onClick={() => onLight(c.id)}
        aria-label={t('ui.light', { name })}
        title={expanded ? undefined : name}
        data-cracker={c.id}
        className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-1.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-gold-300 disabled:cursor-not-allowed ${
          active ? 'border-gold-400/70 bg-gold-400/15' : 'border-transparent hover:border-gold-400/30 hover:bg-white/[0.07] disabled:opacity-50'
        }`}
      >
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-night-950/70 text-gold-300 ring-1 ring-gold-400/20">
          {active ? <SpinnerIcon className="h-6 w-6" /> : <CrackerIcon id={c.id} className="h-7 w-7" />}
        </span>
        {expanded && (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[14px] leading-tight font-semibold text-gold-200">{name}</span>
            <span className="block truncate font-hindi text-[12px] leading-[1.25] text-gold-400/90">{crackerAltName(lang, c.id)}</span>
            <span className="block truncate text-[11px] leading-tight text-white/55">{crackerHint(lang, c.id)}</span>
          </span>
        )}
        {expanded && !busy && <FlameIcon className="h-4 w-4 shrink-0 text-ember-500 opacity-0 transition-opacity group-hover:opacity-100" />}
      </button>
    </li>
  )
}

export default function Sidebar() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const phase = useStore((s) => s.phase)
  const current = useStore((s) => s.current)
  const open = useStore((s) => s.sidebarOpen)
  const setOpen = useStore((s) => s.setSidebarOpen)
  const pulse = useStore((s) => s.menuPulse)
  const busy = isBusy(phase)
  const onLight = useLight()
  const [hover, setHover] = useState(false)
  const [glow, setGlow] = useState(false)
  const [mobileCat, setMobileCat] = useState(GROUPS[0].id)
  const expanded = hover || open

  useEffect(() => {
    if (!pulse) return
    setGlow(true)
    const tm = setTimeout(() => setGlow(false), 1800)
    return () => clearTimeout(tm)
  }, [pulse])

  const jump = (id) => document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const mobileItems = GROUPS.find((g) => g.id === mobileCat)?.items || []

  return (
    <>
      {/* ---------------- desktop rail ---------------- */}
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={t('ui.crackers')}
        className={`glass pointer-events-auto absolute top-20 bottom-3 left-3 z-20 hidden flex-col overflow-hidden rounded-2xl p-2 transition-[width,box-shadow] duration-200 ease-out md:flex ${
          expanded ? 'w-[272px]' : 'w-[64px]'
        } ${glow ? 'ring-2 ring-gold-300 shadow-[0_0_40px_rgb(251_191_36/0.55)]' : ''}`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={expanded}
          aria-label={t('ui.sidebar')}
          title={t('ui.sidebar')}
          className="mb-1.5 flex h-10 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-gold-300"
        >
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${busy ? 'bg-ember-500/25 text-ember-500' : 'bg-emerald-400/15 text-emerald-300'}`} aria-hidden>
            {busy ? '●' : '✓'}
          </span>
          {expanded && (
            <span className="min-w-0">
              <span className="block font-display text-[15px] leading-tight font-semibold text-gold-200">{t('ui.crackers')}</span>
              <span className="block truncate text-[11px] text-white/60" aria-live="polite">
                {busy ? t(`phase.${phase}`) : t('ui.pickOne', { n: CRACKERS.length })}
              </span>
            </span>
          )}
        </button>

        {/* category tabs: icons (labels when expanded) */}
        <nav className={`mb-1.5 flex shrink-0 gap-1 ${expanded ? 'flex-wrap' : 'flex-col'}`} aria-label={t('ui.categories')}>
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => jump(g.id)}
              title={t(`cat.${g.id}`)}
              aria-label={t(`cat.${g.id}`)}
              className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-gold-200 transition-colors hover:border-gold-400/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold-300 ${
                expanded ? 'px-2 text-[11px] font-semibold' : 'w-full justify-center'
              }`}
            >
              <CrackerIcon id={CAT_ICON[g.id]} className="h-5 w-5" />
              {expanded && t(`cat.${g.id}`)}
            </button>
          ))}
        </nav>

        <div className="no-scrollbar -mx-1 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1">
          {GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`cat-${g.id}`} className="mb-2">
              <h3
                id={`cat-${g.id}`}
                className="sticky top-0 z-10 mb-1 truncate rounded-md bg-night-900/90 px-1 py-0.5 text-center font-display text-[10px] font-semibold tracking-[0.1em] text-gold-300/80 uppercase backdrop-blur-sm"
              >
                {expanded ? `${t(`cat.${g.id}`)} · ${g.items.length}` : g.items.length}
              </h3>
              <ul className="flex flex-col gap-1">
                {g.items.map((c) => (
                  <Row key={c.id} c={c} lang={lang} t={t} expanded={expanded} busy={busy} active={current?.type === c.id} onLight={onLight} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p
          className={`mt-1.5 flex shrink-0 items-center gap-2 rounded-lg bg-night-950/60 px-2 py-1.5 text-[11px] text-gold-200/90 ${expanded ? '' : 'justify-center'}`}
          title={t('ui.safety')}
        >
          <ShieldIcon className="h-4 w-4 shrink-0 text-gold-400" />
          {expanded && t('ui.safety')}
        </p>
      </aside>

      {/* ---------------- mobile bottom sheet ---------------- */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:hidden">
        <div className={`glass mx-2 mb-[max(8px,env(safe-area-inset-bottom))] rounded-2xl px-2 pt-2 pb-1.5 ${glow ? 'ring-2 ring-gold-300' : ''}`}>
          <div className="no-scrollbar mb-1.5 flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('ui.categories')}>
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={mobileCat === g.id}
                onClick={() => setMobileCat(g.id)}
                className={`flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold ${
                  mobileCat === g.id ? 'border-gold-400 bg-gold-400/20 text-gold-200' : 'border-white/10 bg-white/[0.04] text-white/70'
                }`}
              >
                <CrackerIcon id={CAT_ICON[g.id]} className="h-4 w-4" />
                {t(`cat.${g.id}`)}
              </button>
            ))}
          </div>
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {mobileItems.map((c) => {
              const name = crackerName(lang, c.id)
              const active = current?.type === c.id
              return (
                <li key={c.id} className="w-[78px] shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onLight(c.id)}
                    aria-label={t('ui.light', { name })}
                    className={`flex h-[84px] w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 transition-all duration-150 active:scale-95 disabled:cursor-not-allowed ${
                      active ? 'border-gold-400/80 bg-gold-400/15' : 'border-white/10 bg-white/[0.04] disabled:opacity-45'
                    }`}
                  >
                    {active ? <SpinnerIcon className="h-7 w-7 text-gold-300" /> : <CrackerIcon id={c.id} className="h-7 w-7 text-gold-300" />}
                    <span className="line-clamp-2 text-center font-display text-[11px] leading-tight font-semibold text-gold-200">{name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-gold-200/80">
            <ShieldIcon className="h-3.5 w-3.5 text-gold-400" />
            {t('ui.safety')}
          </p>
        </div>
      </div>
    </>
  )
}
