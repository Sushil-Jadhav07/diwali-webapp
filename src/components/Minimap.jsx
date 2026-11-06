import { useEffect, useRef } from 'react'
import {
  WORLD,
  BLOCKS,
  CRACKER_GROUND,
  MANDIR,
  RANGOLI_MAIN,
  RANGOLI_SMALL,
  LAKSHMI,
  STALLS,
  PLAY_AREA,
  MAIN_LANE,
  CROSS_LANE,
  GATE,
  PLACES,
  SOCIETY_NAME,
  WATER_TANK,
} from '../world/layout'
import { rig } from '../scene/shared'
import { dangerZones, LIVE_PEOPLE } from '../world/safety'
import { navTo } from '../world/input'
import { useStore, useT } from '../store/useStore'

// Top-down SVG minimap in world units (x right, z down). The player arrow,
// danger zones and people are moved with requestAnimationFrame (no React
// re-renders per frame). Clicking the map auto-walks there.
const VB = `${WORLD.minX - 1.5} ${WORLD.minZ - 1.5} ${WORLD.maxX - WORLD.minX + 3} ${WORLD.maxZ - WORLD.minZ + 3}`
const R = (r) => ({ x: r.minX, y: r.minZ, width: r.maxX - r.minX, height: r.maxZ - r.minZ })
const MAX_DANGER = 6
const MAX_PEOPLE = 48

export default function Minimap({ className = '' }) {
  const t = useT()
  const svg = useRef()
  const me = useRef()
  const danger = useRef([])
  const people = useRef([])

  useEffect(() => {
    let raf
    const tick = () => {
      if (me.current) me.current.setAttribute('transform', `translate(${rig.pos.x.toFixed(2)} ${rig.pos.z.toFixed(2)}) rotate(${((-rig.yaw * 180) / Math.PI).toFixed(1)})`)
      for (let i = 0; i < MAX_DANGER; i++) {
        const el = danger.current[i]
        if (!el) continue
        const d = dangerZones[i]
        if (d) {
          el.setAttribute('cx', d.x.toFixed(2))
          el.setAttribute('cy', d.z.toFixed(2))
          el.setAttribute('r', d.r.toFixed(2))
          el.style.display = ''
        } else el.style.display = 'none'
      }
      for (let i = 0; i < MAX_PEOPLE; i++) {
        const el = people.current[i]
        if (!el) continue
        const p = LIVE_PEOPLE[i]
        if (p) {
          el.setAttribute('cx', p.x.toFixed(1))
          el.setAttribute('cy', p.z.toFixed(1))
          el.style.display = ''
        } else el.style.display = 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onClick = (e) => {
    const el = svg.current
    const pt = el.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const w = pt.matrixTransform(el.getScreenCTM().inverse())
    const { phase, showHint } = useStore.getState()
    if (phase !== 'idle') {
      showHint('hint.busyNow')
      return
    }
    if (!navTo(rig.pos.x, rig.pos.z, w.x, w.y, 'map')) showHint('hint.cantReach')
  }

  return (
    <div className={`glass pointer-events-auto rounded-2xl p-2 ${className}`}>
      <p className="mb-1 truncate px-1 font-display text-[11px] font-semibold tracking-wide text-gold-200 uppercase">{t('ui.society')}</p>
      <svg
        ref={svg}
        viewBox={VB}
        className="block h-auto w-full cursor-pointer rounded-lg bg-night-950/80"
        onClick={onClick}
        role="img"
        aria-label={t('ui.mapAria', { name: t('ui.society') })}
      >
        <rect {...R(WORLD)} fill="#1b1830" stroke="#f5b942" strokeOpacity="0.55" strokeWidth="0.6" />
        <rect {...R(MAIN_LANE)} fill="#2b2a33" />
        <rect {...R(CROSS_LANE)} fill="#2b2a33" />
        <rect {...R(PLAY_AREA)} fill="#24452b" />
        <rect {...R(CRACKER_GROUND)} fill="#4a3a33" stroke="#facc15" strokeDasharray="1.2 0.8" strokeWidth="0.35" />
        {BLOCKS.map((b) => (
          <g key={b.id}>
            <rect {...R(b)} fill={b.color} fillOpacity="0.75" />
            <text x={(b.minX + b.maxX) / 2} y={(b.minZ + b.maxZ) / 2 + 1.1} fontSize="3" textAnchor="middle" fill="#0b0a24" fontWeight="700">
              {b.id}
            </text>
          </g>
        ))}
        {STALLS.map((s) => (
          <rect key={s.id} x={s.x - s.w / 2} y={s.z - s.d / 2} width={s.w} height={s.d} fill="#c2410c" fillOpacity="0.8" />
        ))}
        <circle cx={MANDIR.x} cy={MANDIR.z} r="2.2" fill="#f97316" />
        <circle cx={RANGOLI_MAIN.x} cy={RANGOLI_MAIN.z} r={RANGOLI_MAIN.r} fill="#e11d74" fillOpacity="0.8" />
        <circle cx={RANGOLI_SMALL.x} cy={RANGOLI_SMALL.z} r={RANGOLI_SMALL.r} fill="#e11d74" fillOpacity="0.8" />
        <rect x={LAKSHMI.x - 1.3} y={LAKSHMI.z - 0.8} width="2.6" height="1.6" fill="#facc15" />
        <rect x={WATER_TANK.x - 1.6} y={WATER_TANK.z - 1.6} width="3.2" height="3.2" fill="#64748b" />
        <rect x={GATE.x - GATE.halfW} y={GATE.z - 0.6} width={GATE.halfW * 2} height="1.2" fill="#f5b942" />
        {PLACES.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.z} r="0.7" fill="#fde9b0" fillOpacity="0.85">
            <title>{t(`place.${p.id}`)}</title>
          </circle>
        ))}
        {Array.from({ length: MAX_PEOPLE }, (_, i) => (
          <circle key={`p${i}`} ref={(el) => (people.current[i] = el)} r="0.45" fill="#93c5fd" fillOpacity="0.8" style={{ display: 'none' }} />
        ))}
        {Array.from({ length: MAX_DANGER }, (_, i) => (
          <circle key={`d${i}`} ref={(el) => (danger.current[i] = el)} fill="#ef4444" fillOpacity="0.25" stroke="#ef4444" strokeWidth="0.3" style={{ display: 'none' }} />
        ))}
        <g ref={me}>
          <circle r="1.6" fill="#fde047" fillOpacity="0.25" />
          <path d="M0 1.9 L1.2 -1 L0 -0.3 L-1.2 -1 Z" fill="#fde047" stroke="#0b0a24" strokeWidth="0.25" />
        </g>
      </svg>
    </div>
  )
}
