import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import BrandLogo from './BrandLogo'
import { SOCIETY_NAME } from '../world/layout'

// Shown until the first 3D frame has rendered (the scene is procedural, so this
// covers shader compilation and texture generation).
export default function LoadingScreen() {
  const ready = useStore((s) => s.sceneReady)
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loading"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="absolute inset-0 z-[60] grid place-items-center bg-night-950"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <BrandLogo size="lg" />
            <p className="font-display text-xl font-semibold text-gold-200">{SOCIETY_NAME}</p>
            <div className="flex items-center gap-3 text-sm text-gold-300/90">
              <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden>
                <span className="absolute h-6 w-6 animate-ping rounded-full bg-gold-400/30" />
                <span className="h-3 w-3 rounded-full bg-gradient-to-b from-gold-300 to-ember-600 shadow-[0_0_12px_rgb(251_191_36/0.9)]" />
              </span>
              Lighting the diyas…
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
