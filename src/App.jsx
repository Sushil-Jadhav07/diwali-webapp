import { useEffect } from 'react'
import Experience from './scene/Experience'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StatusBanner from './components/StatusBanner'
import IntroOverlay from './components/IntroOverlay'
import Minimap from './components/Minimap'
import Hint from './components/Hint'
import Joystick from './components/Joystick'
import { bindKeyboard } from './world/input'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  useEffect(() => bindKeyboard(), [])
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-night-950 select-none">
      <div className="absolute inset-0">
        <Experience />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <TopBar />
        <Sidebar />
        <StatusBanner />
        <Hint />
        <Joystick />
        <Minimap className="absolute top-20 right-3 z-20 w-[118px] md:top-24 md:right-4 md:w-[190px]" />
        <p className="absolute right-4 bottom-4 z-10 hidden text-[11px] text-white/45 md:block">
          WASD / arrows to walk · Shift to run · click the ground to walk there · drag to orbit · scroll to zoom
        </p>
      </div>
      <IntroOverlay />
      <LoadingScreen />
    </main>
  )
}
