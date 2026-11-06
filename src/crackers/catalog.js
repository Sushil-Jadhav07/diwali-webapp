// UI/state view over the data-driven registry (src/crackers/registry.js).
import { CATEGORIES, REGISTRY } from './registry.js'

export { CATEGORIES }

export const CRACKERS = REGISTRY.map((r) => ({
  ...r,
  blurb: r.hint,
  held: r.handling === 'held',
  retreat: r.retreat ?? 0,
}))

export const CRACKER_BY_ID = Object.fromEntries(CRACKERS.map((c) => [c.id, c]))
