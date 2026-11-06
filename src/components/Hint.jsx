import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { ShieldIcon } from './Icons'

// Friendly safety / navigation hint toast (auto-dismisses after ~3.5 s).
export default function Hint() {
  const hint = useStore((s) => s.hint)
  const [shown, setShown] = useState(null)
  useEffect(() => {
    if (!hint) return
    setShown(hint)
    const t = setTimeout(() => setShown(null), 3600)
    return () => clearTimeout(t)
  }, [hint])
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-40 flex justify-center px-3 md:top-24" aria-live="polite">
      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            className="glass flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-gold-200"
            role="status"
          >
            <ShieldIcon className="h-4 w-4 shrink-0 text-gold-400" />
            {shown.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
