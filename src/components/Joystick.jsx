import { useEffect, useRef, useState } from 'react'
import { input } from '../world/input'

// On-screen virtual joystick + Run toggle for touch devices.
export default function Joystick() {
  const [touch, setTouch] = useState(false)
  const [run, setRun] = useState(false)
  const base = useRef()
  const knob = useRef()
  const pid = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const upd = () => setTouch(mq.matches || window.innerWidth < 768)
    upd()
    mq.addEventListener?.('change', upd)
    window.addEventListener('resize', upd)
    return () => {
      mq.removeEventListener?.('change', upd)
      window.removeEventListener('resize', upd)
    }
  }, [])

  const move = (e) => {
    const r = base.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    let dx = (e.clientX - cx) / (r.width / 2)
    let dy = (e.clientY - cy) / (r.height / 2)
    const L = Math.hypot(dx, dy)
    if (L > 1) {
      dx /= L
      dy /= L
    }
    input.joy.x = dx
    input.joy.y = -dy
    input.joy.active = true
    input.nav = null
    knob.current.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`
  }
  const end = () => {
    pid.current = null
    input.joy.x = 0
    input.joy.y = 0
    input.joy.active = false
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)'
  }

  if (!touch) return null
  return (
    <div className="pointer-events-auto absolute bottom-[150px] left-3 z-30 flex items-end gap-3 md:bottom-6 md:left-[330px]">
      <div
        ref={base}
        className="relative grid h-[112px] w-[112px] touch-none place-items-center rounded-full border border-gold-400/30 bg-night-900/55 backdrop-blur-sm"
        aria-label="Move joystick"
        role="application"
        onPointerDown={(e) => {
          pid.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          move(e)
        }}
        onPointerMove={(e) => pid.current === e.pointerId && move(e)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div ref={knob} className="h-12 w-12 rounded-full bg-gradient-to-b from-gold-300 to-ember-600 shadow-lg transition-transform duration-75" />
      </div>
      <button
        type="button"
        aria-pressed={run}
        onClick={() => {
          input.runToggle = !run
          setRun(!run)
        }}
        className={`h-12 min-w-12 cursor-pointer rounded-xl border px-3 font-display text-sm font-semibold transition-colors ${
          run ? 'border-gold-400 bg-gold-400/25 text-gold-200' : 'border-white/15 bg-night-900/60 text-white/70'
        }`}
      >
        Run
      </button>
    </div>
  )
}
