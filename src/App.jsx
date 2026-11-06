import { useEffect } from 'react'
import Experience from './scene/Experience'
import Sidebar from './components/Sidebar'
import TopBar, { toggleFullscreen } from './components/TopBar'
import StatusBanner from './components/StatusBanner'
import IntroOverlay from './components/IntroOverlay'
import Minimap from './components/Minimap'
import Hint from './components/Hint'
import Joystick from './components/Joystick'
import LoadingScreen from './components/LoadingScreen'
import { bindKeyboard } from './world/input'
import { useStore, useT } from './store/useStore'

// Full-screen 3D canvas with floating UI. Keys: F fullscreen, H hide UI, Tab menu.
export default function App() {
  const t = useT()
  const uiHidden = useStore((s) => s.uiHidden)
  const lang = useStore((s) => s.lang)
  useEffect(() => bindKeyboard(), [])
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : lang
  }, [lang])
  useEffect(() => {
    const onKey = (e) => {
      if (/input|textarea|select/i.test(e.target?.tagName || '')) return
      const st = useStore.getState()
      if (e.code === 'KeyF') toggleFullscreen()
      else if (e.code === 'KeyH') st.toggleUi()
      else if (e.code === 'Tab') {
        e.preventDefault()
        st.setSidebarOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="fixed inset-0 h-dvh w-dvw overflow-hidden bg-night-950 select-none">
      <div className="absolute inset-0">
        <Experience />
      </div>
      {!uiHidden && (
        <div className="pointer-events-none absolute inset-0">
          <TopBar />
          <Sidebar />
          <StatusBanner />
          <Hint />
          <Joystick />
          <Minimap className="absolute top-16 right-2.5 z-20 w-[116px] md:top-[72px] md:right-3 md:w-[180px]" />
          <p className="absolute right-3 bottom-3 z-10 hidden max-w-[60vw] text-right text-[11px] text-white/45 lg:block">{t('ui.controls')} · F · H · Tab</p>
        </div>
      )}
      {uiHidden && (
        <button
          type="button"
          onClick={() => useStore.getState().toggleUi()}
          className="absolute top-3 right-3 z-40 h-10 cursor-pointer rounded-xl border border-white/10 bg-night-900/50 px-3 text-xs text-gold-200/80 backdrop-blur-md hover:bg-night-700/70"
        >
          {t('ui.showUi')}
        </button>
      )}
      <IntroOverlay />
      <LoadingScreen />
    </main>
  )
}
