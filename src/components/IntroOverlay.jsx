import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { audio } from '../audio/audio'

export default function IntroOverlay() {
  const started = useStore((s) => s.started)
  const start = useStore((s) => s.start)
  const begin = () => {
    audio.unlock()
    start()
  }
  return (
    <AnimatePresence>
      {!started && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="absolute inset-0 z-50 grid place-items-center bg-night-950/55 p-6 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
            className="glass max-w-sm rounded-3xl p-6 text-center"
          >
            <p className="font-hindi text-2xl font-semibold text-gold-300" lang="hi">
              शुभ दीपावली
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-gold-200">Diwali Cracker Playground</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
              Choose a cracker and Aarav will place it, light the fuse and run back to watch the show.
            </p>
            <button
              type="button"
              onClick={begin}
              autoFocus
              className="mt-5 inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-gold-400 to-ember-600 px-6 font-display text-base font-semibold text-night-950 shadow-[0_6px_24px_-6px_rgb(249_115_22/0.8)] transition-all duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 active:scale-95"
            >
              <Sparkles className="h-5 w-5" /> Start the celebration
            </button>
            <p className="mt-4 text-xs text-gold-200/80">Light crackers only with an adult nearby.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
