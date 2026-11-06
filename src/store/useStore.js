import { create } from 'zustand'
import { CRACKER_BY_ID } from '../crackers/catalog'
import { rig } from '../scene/shared'
import { findPlacement, findRetreat, addDanger, clearDanger, removeDanger, DANGER_R, HINTS, LIVE_PEOPLE } from '../world/safety'
import { audio } from '../audio/audio'
import { fx } from '../crackers/fx'
import { savedTier, saveTier } from '../world/quality'
import { savedLang, saveLang, translate } from '../i18n/index.js'

// Strict child state machine order.
export const PHASES = ['idle', 'walkingTo', 'placing', 'lighting', 'retreating', 'waiting', 'celebrating']

export const PHASE_LABEL = {
  idle: 'Ready',
  walkingTo: 'Walking over',
  placing: 'Placing it',
  lighting: 'Lighting the fuse',
  retreating: 'Stepping back',
  waiting: 'Watching',
  celebrating: 'Celebrating!',
}

const MAX_SPENT = 8
let nextId = 1
let hintId = 1

export const dangerRadius = (type) => {
  const d = CRACKER_BY_ID[type]
  return d?.danger ?? DANGER_R[d?.category] ?? 3
}

export const useStore = create((set, get) => ({
  phase: 'idle',
  // The running sequence: { id, type, spot:[x,z], approach:[x,z], retreat:[x,z],
  // from:[x,z], danger, rt } — rt is a mutable runtime object shared by the
  // child director and the cracker effect (read in useFrame).
  current: null,
  spent: [], // burnt-out crackers left on the ground: { id, type, spot }
  lastType: null,
  soundOn: true,
  ambientOn: true,
  started: false,
  blocked: 0, // count of ignored clicks while busy (for UI feedback)
  hint: null, // { id, text } friendly safety / navigation hints
  clearSeq: 0, // bumps on every Clear so systems can cancel pending work
  lang: savedLang() || 'en',
  uiHidden: false,
  tod: 0, // time of day 0 = 6 pm sunset .. 1 = late night
  todPlaying: false,
  todTarget: 0.66,
  sidebarOpen: false,
  menuPulse: 0, // bumps when a shop asks the cracker menu to open / highlight
  sceneReady: false,
  quality: savedTier() || 'auto', // 'auto' | 'low' | 'medium' | 'high' | 'ultra'
  tier: 'medium', // resolved tier in use

  // starting the celebration plays the evening from sunset towards night
  start: () => set({ started: true, todPlaying: true, todTarget: 0.66 }),
  setTod: (tod) => set({ tod, todPlaying: false }),
  syncTod: (tod) => set({ tod }),
  playCycle: () => set((s) => ({ todPlaying: true, todTarget: 1, tod: s.tod >= 0.99 ? 0 : s.tod })),
  stopCycle: () => set({ todPlaying: false }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  toggleAmbient: () => set((s) => ({ ambientOn: !s.ambientOn })),
  showHint: (text) => set({ hint: { id: hintId++, text } }),
  openMenu: () => set((s) => ({ menuPulse: s.menuPulse + 1, sidebarOpen: true })),
  setLang: (lang) => {
    saveLang(lang)
    set({ lang })
  },
  toggleUi: () => set((s) => ({ uiHidden: !s.uiHidden })),
  setSidebarOpen: (v) => set((s) => ({ sidebarOpen: typeof v === 'function' ? v(s.sidebarOpen) : v })),
  setSceneReady: () => set({ sceneReady: true }),
  setQuality: (q) => {
    saveTier(q === 'auto' ? null : q)
    set({ quality: q })
  },
  setTier: (tier) => set({ tier }),

  // Request a new sequence from wherever the child is standing. Ignored while
  // one is running: never two at once.
  request: (type) => {
    const s = get()
    const def = CRACKER_BY_ID[type]
    if (!def) return false
    if (s.phase !== 'idle' || s.current) {
      set({ blocked: s.blocked + 1 })
      return false
    }
    const cat = def.category || 'ground'
    const held = !!def.held
    const spot = findPlacement(rig.pos.x, rig.pos.z, rig.yaw, cat, LIVE_PEOPLE)
    if (!spot) {
      s.showHint('hint.none')
      return false
    }
    if (spot.moved) s.showHint(`hint.${HINTS[spot.reason] ? spot.reason : 'blocked'}`)
    const r = dangerRadius(type)
    const from = { x: rig.pos.x, z: rig.pos.z }
    // stand 0.55 m in front of the cracker, on the side the child came from
    let ux = from.x - spot.x
    let uz = from.z - spot.z
    const L = Math.hypot(ux, uz)
    if (L < 1e-3) {
      ux = -Math.sin(rig.yaw)
      uz = -Math.cos(rig.yaw)
    } else {
      ux /= L
      uz /= L
    }
    const approach = held ? [spot.x, spot.z] : [spot.x + ux * 0.55, spot.z + uz * 0.55]
    const ret = held ? { x: spot.x + ux * (def.retreat || 0.9), z: spot.z + uz * (def.retreat || 0.9) } : findRetreat(spot, from, r)
    const id = nextId++
    addDanger(id, spot.x, spot.z, r, 'player')
    set({
      phase: 'walkingTo',
      current: {
        id,
        type,
        spot: [spot.x, spot.z],
        approach,
        retreat: [ret.x, ret.z],
        from: [from.x, from.z],
        danger: r,
        rt: { placed: false, litAt: -1, fired: false, done: false },
      },
      lastType: type,
    })
    return true
  },

  // Only the child director advances phases, and only forward in PHASES order.
  advance: (from) => {
    const s = get()
    if (s.phase !== from) return
    const i = PHASES.indexOf(from)
    if (from === 'celebrating') {
      const c = s.current
      if (c) removeDanger(c.id)
      const keep = c && !CRACKER_BY_ID[c.type]?.held
      const spent = keep ? [...s.spent, { id: c.id, type: c.type, spot: c.spot, from: c.from }].slice(-MAX_SPENT) : s.spent
      set({ phase: 'idle', current: null, spent })
      return
    }
    set({ phase: PHASES[i + 1] })
  },

  replay: () => {
    const s = get()
    if (s.lastType && s.phase === 'idle') s.request(s.lastType)
  },

  // Clear is always available, also mid-sequence: cancel everything and reset.
  clearScene: () => {
    clearDanger()
    audio.stopAll()
    fx.clear()
    set((s) => ({ phase: 'idle', current: null, spent: [], clearSeq: s.clearSeq + 1 }))
  },
}))

export const isBusy = (phase) => phase !== 'idle'

// Dev-only handle for automated verification scripts.
if (import.meta.env?.DEV && typeof window !== 'undefined') window.__store = useStore

// Translate with the current language (re-renders when the language changes).
export function useT() {
  const lang = useStore((s) => s.lang)
  return (key, vars) => translate(lang, key, vars)
}
export const tNow = (key, vars) => translate(useStore.getState().lang, key, vars)
