import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CRACKER_BY_ID } from '../crackers/catalog'
import { HANDLERS } from '../crackers/CrackerStage'
import { findPlacement, addDanger, removeDanger, dangerZones, LIVE_PEOPLE } from '../world/safety'
import { useStore } from '../store/useStore'
import { fx } from '../crackers/fx'
import { LIFE } from './life'

// ---------------------------------------------------------------------------
// Life director: residents light their own crackers around the society, using
// the SAME registry handlers, danger zones and safety rules as the player.
// Limits: at most MAX_EVENTS at once, only when the shared particle pool has
// headroom; Clear cancels everything.
// ---------------------------------------------------------------------------
const MAX_EVENTS = 2
const NPC_SET = ['anar', 'chakri', 'minifountain', 'rocket', 'skyshot', 'ladi100', 'cracklingking', 'towerpot', 'aakashtara', 'bijli', 'poppop', 'wheel', 'romancandle', 'jelly', 'shots3', 'laxmi']
let nextId = 100000

export default function NpcEvents() {
  const [events, setEvents] = useState([])
  const live = useRef([])
  const st = useRef({ next: 14, clearSeq: 0 })

  const remove = (e) => {
    removeDanger(e.c.id)
    if (e.lighter) e.lighter.task = null
    for (const m of e.watchers) m.task = null
    live.current = live.current.filter((x) => x !== e)
    setEvents(live.current.slice())
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const now = state.clock.elapsedTime
    const s = st.current
    const store = useStore.getState()
    // Clear cancels all NPC events too
    if (store.clearSeq !== s.clearSeq) {
      s.clearSeq = store.clearSeq
      for (const e of live.current.slice()) remove(e)
      s.next = now + 10
    }

    // ---- schedule a new event ----
    if (now > s.next && live.current.length < MAX_EVENTS && fx.ready && fx.sparks.alive < 2200 && LIFE.groups.length) {
      s.next = now + 16 + Math.random() * 18
      const g = LIFE.groups[(Math.random() * LIFE.groups.length) | 0]
      const members = g.members.map((i) => LIFE.people[i]).filter((p) => p && p.mode === 'group' && !p.task)
      const lighter = members.find((p) => !p.kid) || members[0]
      if (lighter && members.length >= 2) {
        const type = NPC_SET[(Math.random() * NPC_SET.length) | 0]
        const def = CRACKER_BY_ID[type]
        // aim towards the middle of the Cracker Ground, a safe distance from the group
        const yaw = Math.atan2(0 - lighter.x, -5 - lighter.z)
        const others = LIVE_PEOPLE.filter((p, i) => !members.some((m) => m.i === i))
        const spot = findPlacement(lighter.x, lighter.z, yaw, def.category, others, (def.danger ?? 3) + 1.2)
        if (spot && Math.hypot(spot.x - lighter.x, spot.z - lighter.z) < 14) {
          const id = nextId++
          const ux = lighter.x - spot.x
          const uz = lighter.z - spot.z
          const L = Math.hypot(ux, uz) || 1
          const c = { id, type, spot: [spot.x, spot.z], from: [lighter.x, lighter.z], rt: { placed: false, litAt: -1, fired: false, done: false }, npc: true }
          addDanger(id, spot.x, spot.z, def.danger ?? 3, 'npc')
          const e = {
            c,
            def,
            stage: 'walk',
            t: 0,
            lighter,
            home: { x: lighter.x, z: lighter.z },
            watchers: members.filter((m) => m !== lighter),
          }
          lighter.task = { kind: 'goto', x: spot.x + (ux / L) * 0.6, z: spot.z + (uz / L) * 0.6, speed: 1.3, ignore: id }
          for (const m of e.watchers) m.task = { kind: 'watch', x: spot.x, z: spot.z }
          live.current = [...live.current, e]
          setEvents(live.current.slice())
        }
      }
    }

    // ---- advance events ----
    for (const e of live.current.slice()) {
      e.t += dt
      const p = e.lighter
      const sx = e.c.spot[0]
      const sz = e.c.spot[1]
      switch (e.stage) {
        case 'walk':
          if (p.task?.arrived || e.t > 25) {
            e.stage = 'place'
            e.t = 0
            p.task = { kind: 'crouch', x: sx, z: sz, ignore: e.c.id }
          }
          break
        case 'place':
          if (e.t > 0.6) e.c.rt.placed = true
          if (e.t > 1.2) {
            e.stage = 'light'
            e.t = 0
            p.task = { kind: 'light', x: sx, z: sz, ignore: e.c.id }
          }
          break
        case 'light':
          if (e.t > 0.8 && e.c.rt.litAt < 0) e.c.rt.litAt = now
          if (e.t > 1.3) {
            e.stage = 'retreat'
            e.t = 0
            p.task = { kind: 'goto', x: e.home.x, z: e.home.z, speed: 2.8, run: true, ignore: e.c.id }
          }
          break
        case 'retreat':
          if (p.task?.arrived || e.t > 20) {
            e.stage = 'watch'
            e.t = 0
            p.task = { kind: 'watch', x: sx, z: sz }
          }
          break
        case 'watch':
          if (e.c.rt.done || e.t > 45) remove(e)
          break
        default:
          break
      }
    }
    // expose for the minimap / debugging
    LIFE.events = live.current
    void dangerZones
  })

  return (
    <group>
      {events.map((e) => {
        const H = HANDLERS[e.def.kind]
        return H ? <H key={e.c.id} c={e.c} cfg={e.def.params} /> : null
      })}
    </group>
  )
}
