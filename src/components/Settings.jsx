import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { TIERS, TIER_IDS } from '../world/quality'

function GearIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

// Quality selector (Auto / Low / Medium / High / Ultra). The choice is saved.
export default function Settings() {
  const [open, setOpen] = useState(false)
  const quality = useStore((s) => s.quality)
  const tier = useStore((s) => s.tier)
  const setQuality = useStore((s) => s.setQuality)
  const setTier = useStore((s) => s.setTier)
  const ambientOn = useStore((s) => s.ambientOn)
  const toggleAmbient = useStore((s) => s.toggleAmbient)
  const choose = (q) => {
    setQuality(q)
    if (q !== 'auto') setTier(q)
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Settings"
        title="Settings"
        className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-night-900/70 px-3 text-sm font-semibold text-gold-200 backdrop-blur-md transition-all duration-150 hover:border-gold-400/40 hover:bg-night-700/70 focus-visible:outline-2 focus-visible:outline-gold-300 active:scale-95"
      >
        <GearIcon />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="glass absolute top-12 right-0 z-40 w-60 rounded-2xl p-3"
          >
            <p className="mb-2 font-display text-sm font-semibold text-gold-200">Quality</p>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Quality">
              {['auto', ...TIER_IDS].map((q) => (
                <button
                  key={q}
                  type="button"
                  role="radio"
                  aria-checked={quality === q}
                  data-quality={q}
                  onClick={() => choose(q)}
                  className={`min-h-10 cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-colors ${
                    quality === q ? 'border-gold-400 bg-gold-400/20 text-gold-200' : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10'
                  }`}
                >
                  {q === 'auto' ? 'Auto' : TIERS[q].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-white/55">In use: {TIERS[tier]?.label || tier}. Auto picks a tier for this device.</p>
            <label className="mt-3 flex min-h-10 cursor-pointer items-center justify-between rounded-lg bg-white/[0.04] px-3 text-sm text-gold-200">
              Ambient sound
              <input type="checkbox" checked={ambientOn} onChange={toggleAmbient} className="h-4 w-4 accent-amber-400" aria-label="Ambient sound" />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
