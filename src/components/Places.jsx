import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PLACES } from '../world/layout'
import { rig } from '../scene/shared'
import { navTo, input } from '../world/input'
import { useStore, useT } from '../store/useStore'
import { PinIcon, BoltIcon } from './Icons'

// "Places" menu: walk (A* auto-walk) or fast-travel (teleport) to a landmark.
export function goToPlace(place, mode = 'walk') {
  const { phase, showHint } = useStore.getState()
  if (phase !== 'idle') {
    showHint('hint.busyNow')
    return false
  }
  if (mode === 'teleport') {
    input.nav = null
    rig.pos.x = place.x
    rig.pos.z = place.z
    rig.snapCamera = true
    return true
  }
  if (!navTo(rig.pos.x, rig.pos.z, place.x, place.z, place.id)) {
    showHint('hint.cantReach')
    return false
  }
  return true
}

export default function Places() {
  const [open, setOpen] = useState(false)
  const t = useT()
  const lang = useStore((s) => s.lang)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('ui.placesAria')}
        className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-night-900/70 px-3 text-sm font-semibold text-gold-200 backdrop-blur-md transition-all duration-150 hover:border-gold-400/40 hover:bg-night-700/70 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95"
      >
        <PinIcon className="h-4 w-4" />
        <span className="hidden lg:inline">{t('ui.places')}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="glass absolute top-12 right-0 z-40 w-64 rounded-2xl p-2"
          >
            {PLACES.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <button
                  type="button"
                  data-place={p.id}
                  onClick={() => goToPlace(p, 'walk') && setOpen(false)}
                  className="flex min-h-11 flex-1 cursor-pointer flex-col items-start rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold-300"
                >
                  <span className="font-display text-sm font-semibold text-gold-200">{t(`place.${p.id}`)}</span>
                  <span className="font-hindi text-xs text-gold-400/90" lang="hi">
                    {lang === 'en' ? p.hindi : p.name}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t('ui.fastTravel', { name: t(`place.${p.id}`) })}
                  title="Fast travel"
                  data-teleport={p.id}
                  onClick={() => goToPlace(p, 'teleport') && setOpen(false)}
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg text-gold-300 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold-300"
                >
                  <BoltIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
