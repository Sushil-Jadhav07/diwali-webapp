import { Howl, Howler } from 'howler'
import { useStore } from '../store/useStore'
import { renderSound } from './synth'

// name -> { loop, volume }
const SPECS = {
  hiss: { loop: true, volume: 0.32 },
  crackle: { loop: true, volume: 0.5 },
  whoosh: { loop: false, volume: 0.8 },
  whirr: { loop: true, volume: 0.5 },
  whistle: { loop: false, volume: 0.55 },
  boom: { loop: false, volume: 1.0 },
  thump: { loop: false, volume: 0.8 },
  crackleBurst: { loop: false, volume: 0.65 },
  strike: { loop: false, volume: 0.45 },
  ambience: { loop: true, volume: 0.22 },
  bang: { loop: false, volume: 1.0 },
  ladiBang: { loop: false, volume: 0.6 },
  sutliBoom: { loop: false, volume: 1.0 },
  snap: { loop: false, volume: 0.5 },
  snakeFizz: { loop: true, volume: 0.3 },
  shower: { loop: false, volume: 0.75 },
  whirrDeluxe: { loop: true, volume: 0.55 },
  whooshBig: { loop: false, volume: 0.85 },
  cakeShot: { loop: false, volume: 0.7 },
  burstPop: { loop: false, volume: 0.7 },
  screamer: { loop: false, volume: 0.5 },
}

const howls = {}
let unlocked = false

function ensure(name) {
  if (!howls[name]) {
    const spec = SPECS[name]
    howls[name] = new Howl({ src: [renderSound(name)], format: ['wav'], loop: spec.loop, volume: spec.volume })
  }
  return howls[name]
}

export const audio = {
  // Must be called from a user gesture (browser autoplay rule).
  unlock() {
    if (unlocked) return
    unlocked = true
    try {
      Howler.mute(!useStore.getState().soundOn)
      useStore.subscribe((s, prev) => {
        if (s.soundOn !== prev.soundOn) Howler.mute(!s.soundOn)
      })
      // Render the most-used sounds now; the rest lazily on first use.
      ensure('ambience')
      ensure('hiss')
      ensure('strike')
      const amb = howls.ambience.play()
      howls.ambience.fade(0, SPECS.ambience.volume, 2500, amb)
      // Pre-render remaining sounds when the browser is idle.
      const rest = Object.keys(SPECS).filter((n) => !howls[n])
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 60))
      const next = () => {
        const n = rest.shift()
        if (!n) return
        ensure(n)
        idle(next)
      }
      idle(next)
    } catch (e) {
      console.warn('Audio unavailable', e)
    }
  },

  get ready() {
    return unlocked
  },

  play(name, { volume, rate, seek } = {}) {
    if (!unlocked) return null
    try {
      const h = ensure(name)
      const id = h.play()
      if (volume != null) h.volume(volume, id)
      if (rate != null) h.rate(rate, id)
      if (seek != null) h.seek(seek, id)
      return id
    } catch {
      return null
    }
  },

  stop(name, id) {
    if (id == null || !howls[name]) return
    howls[name].stop(id)
  },

  fadeOut(name, id, ms = 400) {
    const h = howls[name]
    if (id == null || !h) return
    const v = h.volume(id)
    h.fade(typeof v === 'number' ? v : SPECS[name].volume, 0, ms, id)
    setTimeout(() => h.stop(id), ms + 30)
  },

  rate(name, id, r) {
    if (id == null || !howls[name]) return
    howls[name].rate(r, id)
  },

  volume(name, id, v) {
    if (id == null || !howls[name]) return
    howls[name].volume(v, id)
  },
}
