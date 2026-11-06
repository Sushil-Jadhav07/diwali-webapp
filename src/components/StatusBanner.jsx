import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, PHASES, useT } from '../store/useStore'
import { crackerName, crackerAltName } from '../i18n/index.js'
import { CRACKER_BY_ID } from '../crackers/catalog'

export default function StatusBanner() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const phase = useStore((s) => s.phase)
  const current = useStore((s) => s.current)
  const blocked = useStore((s) => s.blocked)
  const [showBlocked, setShowBlocked] = useState(false)
  const step = PHASES.indexOf(phase)
  const c = current && CRACKER_BY_ID[current.type]

  useEffect(() => {
    if (!blocked) return
    setShowBlocked(true)
    const t = setTimeout(() => setShowBlocked(false), 1800)
    return () => clearTimeout(t)
  }, [blocked])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[140px] z-20 flex justify-center px-3 md:bottom-6 md:left-[316px]">
      <AnimatePresence>
        {c && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass rounded-2xl px-4 py-2.5 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="font-display text-sm font-semibold text-gold-200">
              {crackerName(lang, c.id)}{' '}
              <span className="font-hindi text-gold-400/90" lang="hi">
                ({crackerAltName(lang, c.id)})
              </span>{' '}
              · {t(`phase.${phase}`)}
            </p>
            <div className="mt-1.5 flex justify-center gap-1.5" aria-hidden>
              {PHASES.slice(1).map((p, i) => (
                <span
                  key={p}
                  className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                    i + 1 < step ? 'bg-gold-400' : i + 1 === step ? 'bg-ember-500' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
            {showBlocked && <p className="mt-1 text-[11px] text-white/65">{t('ui.oneAtATime')}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
