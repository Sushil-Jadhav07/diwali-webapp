import { AnimatePresence, motion } from 'framer-motion'
import { SparkleIcon } from './Icons'
import { useStore, useT } from '../store/useStore'
import { audio } from '../audio/audio'
import BrandLogo from './BrandLogo'

export default function IntroOverlay() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
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
            <BrandLogo size="lg" className="mb-4" />
            <p className="font-hindi text-2xl font-semibold text-gold-300" lang="hi">
              {t('ui.happyDiwali')}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-gold-200">{t('ui.society')}</h2>
            <p className="font-hindi text-sm text-gold-300/90">{t('ui.subtitle')}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
              {t('ui.intro')}
            </p>
            <button
              type="button"
              onClick={begin}
              autoFocus
              className="mt-5 inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-gold-400 to-ember-600 px-6 font-display text-base font-semibold text-night-950 shadow-[0_6px_24px_-6px_rgb(249_115_22/0.8)] transition-all duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 active:scale-95"
            >
              <SparkleIcon className="h-5 w-5" /> {t('ui.start')}
            </button>
            <p className="mt-4 text-xs text-gold-200/80">{t('ui.safety')}</p>
            <div className="mt-3 flex justify-center gap-1.5">
              {['en', 'hi', 'mr'].map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`min-h-9 cursor-pointer rounded-lg border px-3 font-hindi text-sm ${lang === l ? 'border-gold-400 bg-gold-400/20 text-gold-200' : 'border-white/10 text-white/70 hover:bg-white/10'}`}>
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
