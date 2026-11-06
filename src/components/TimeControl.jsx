import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, useT } from '../store/useStore'
import { TOD_MARKS, todClock } from '../world/env'

const SunMoon = ({ night }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    {night ? <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /> : <><circle cx="12" cy="14" r="4" /><path d="M12 5v2M5 14H3M21 14h-2M6.3 8.3l1.4 1.4M17.7 8.3l-1.4 1.4M3 19h18" /></>}
  </svg>
)

// Evening clock: slider from 6 pm sunset to late night, plus "Play day cycle".
export default function TimeControl() {
  const t = useT()
  const tod = useStore((s) => s.tod)
  const playing = useStore((s) => s.todPlaying)
  const setTod = useStore((s) => s.setTod)
  const playCycle = useStore((s) => s.playCycle)
  const stopCycle = useStore((s) => s.stopCycle)
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('ui.time')}
        title={t('ui.time')}
        data-time-button
        className="flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-night-900/70 px-2.5 text-sm font-semibold text-gold-200 backdrop-blur-md transition-all duration-150 hover:border-gold-400/40 hover:bg-night-700/70 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95"
      >
        <SunMoon night={tod > 0.4} />
        <span className="hidden tabular-nums lg:inline">{todClock(tod)}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="glass absolute top-12 right-0 z-40 w-72 rounded-2xl p-3"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-display text-sm font-semibold text-gold-200">{t('ui.time')}</p>
              <p className="tabular-nums text-xs text-gold-300">{todClock(tod)}</p>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={tod}
              onChange={(e) => setTod(parseFloat(e.target.value))}
              aria-label={t('ui.time')}
              data-tod-slider
              className="w-full accent-amber-400"
            />
            <div className="mt-1 grid grid-cols-4 gap-1">
              {TOD_MARKS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setTod(m.tod)}
                  className={`min-h-9 cursor-pointer rounded-lg px-1 text-[10px] leading-tight ${Math.abs(tod - m.tod) < 0.08 ? 'bg-gold-400/20 text-gold-200' : 'text-white/60 hover:bg-white/10'}`}
                >
                  {t(`ui.${m.key}`)}
                  <span className="block tabular-nums text-white/45">{m.time}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => (playing ? stopCycle() : playCycle())}
              data-play-cycle
              className="mt-2 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold-400/40 bg-gold-400/10 text-sm font-semibold text-gold-200 hover:bg-gold-400/20"
            >
              {playing ? t('ui.pauseCycle') : t('ui.playCycle')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
