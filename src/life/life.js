// Shared, mutable handle to the resident simulation (written by Residents.jsx,
// read by the life director and NPC events). Not React state.
export const LIFE = {
  people: [], // person objects: { i, x, z, y, mode, kid, task, ... }
  groups: [], // { members: [person index], ... }
  events: [], // active NPC cracker events
}

if (import.meta.env?.DEV && typeof window !== 'undefined') window.__life = LIFE
