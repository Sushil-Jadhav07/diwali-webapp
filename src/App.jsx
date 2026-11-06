import Experience from './scene/Experience'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StatusBanner from './components/StatusBanner'
import IntroOverlay from './components/IntroOverlay'

export default function App() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-night-950 select-none">
      <div className="absolute inset-0">
        <Experience />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <TopBar />
        <Sidebar />
        <StatusBanner />
        <p className="absolute right-4 bottom-4 z-10 hidden text-[11px] text-white/45 md:block">
          Drag to orbit · Scroll to zoom
        </p>
      </div>
      <IntroOverlay />
    </main>
  )
}
