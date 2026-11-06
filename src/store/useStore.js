import { create } from 'zustand'

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

// Ground spots (x, z) where crackers get placed, cycled in order.
export const SPOTS = [
  [0, -1.4],
  [-2.4, -0.9],
  [2.4, -0.9],
  [-1.3, -3.4],
  [1.5, -3.4],
]

const MAX_SPENT = 6

let nextId = 1

export const useStore = create((set, get) => ({
  phase: 'idle',
  // The running sequence: { id, type, spot:[x,z], rt } — rt is a mutable runtime
  // object shared by the child director and the cracker effect (read in useFrame).
  current: null,
  spent: [], // burnt-out crackers left on the ground: { id, type, spot }
  lastType: null,
  spotIndex: 0,
  soundOn: true,
  started: false,
  blocked: 0, // count of ignored clicks while busy (for UI feedback)

  start: () => set({ started: true }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

  // Request a new sequence. Ignored while one is running: never two at once.
  request: (type) => {
    const s = get()
    if (s.phase !== 'idle' || s.current) {
      set({ blocked: s.blocked + 1 })
      return false
    }
    const spot = SPOTS[s.spotIndex % SPOTS.length]
    // a spent cracker on the same spot is swept away to make room
    const spent = s.spent.filter((c) => c.spot !== spot).slice(-MAX_SPENT + 1)
    set({
      phase: 'walkingTo',
      current: {
        id: nextId++,
        type,
        spot,
        rt: { placed: false, litAt: -1, fired: false, done: false },
      },
      spent,
      lastType: type,
      spotIndex: s.spotIndex + 1,
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
      const spent = c && c.type !== 'phuljhadi' ? [...s.spent, { id: c.id, type: c.type, spot: c.spot }] : s.spent
      set({ phase: 'idle', current: null, spent })
      return
    }
    set({ phase: PHASES[i + 1] })
  },

  replay: () => {
    const s = get()
    if (s.lastType) s.request(s.lastType)
  },

  clearScene: () => {
    if (get().phase !== 'idle') return
    set({ spent: [] })
  },
}))

export const isBusy = (phase) => phase !== 'idle'
