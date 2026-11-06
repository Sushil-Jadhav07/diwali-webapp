// ---------------------------------------------------------------------------
// Quality tiers: Low / Medium / High / Ultra. Auto-detected once from the GPU
// string, CPU cores and screen size; a manual choice is saved in localStorage.
// Each tier caps pixel ratio and sets shadows, post effects and budgets.
// ---------------------------------------------------------------------------
export const TIERS = {
  low: { label: 'Low', dprMax: 1, dprMin: 0.6, shadows: false, shadowMap: 512, bloom: true, bloomLevels: 4, vignette: false, particles: 0.5, npc: 0.55, ambientFx: 0.35, lights: 2 },
  medium: { label: 'Medium', dprMax: 1.25, dprMin: 0.75, shadows: true, shadowMap: 1024, bloom: true, bloomLevels: 6, vignette: true, particles: 0.75, npc: 0.8, ambientFx: 0.7, lights: 3 },
  high: { label: 'High', dprMax: 2, dprMin: 1, shadows: true, shadowMap: 2048, bloom: true, bloomLevels: 8, vignette: true, particles: 1, npc: 1, ambientFx: 1, lights: 3 },
  // Ultra: up to a 4K canvas on strong GPUs (dynamic resolution still applies)
  ultra: { label: 'Ultra', dprMax: 3, dprMin: 1.25, shadows: true, shadowMap: 4096, bloom: true, bloomLevels: 9, vignette: true, particles: 1, npc: 1, ambientFx: 1.4, lights: 3 },
}
export const TIER_IDS = ['low', 'medium', 'high', 'ultra']
const KEY = 'dcp.quality'

export function savedTier() {
  try {
    const v = localStorage.getItem(KEY)
    return TIER_IDS.includes(v) ? v : null
  } catch {
    return null
  }
}
export function saveTier(id) {
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: keep the in-memory choice */
  }
}

// Best-effort hardware guess (no benchmark): integrated GPUs -> medium/low,
// discrete GPUs -> high, big screens + strong GPU -> ultra.
export function detectTier(gl) {
  let gpu = ''
  try {
    const ctx = gl.getContext()
    const ext = ctx.getExtension('WEBGL_debug_renderer_info')
    gpu = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
  } catch {
    /* ignore */
  }
  const g = gpu.toLowerCase()
  const cores = navigator.hardwareConcurrency || 4
  const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  const bigScreen = window.screen && window.screen.width * (window.devicePixelRatio || 1) >= 3000
  if (mobile) return 'low'
  if (/swiftshader|llvmpipe|software/.test(g)) return 'low'
  const discrete = /nvidia|geforce|rtx|gtx|radeon rx|radeon pro|apple m[1-9] (pro|max|ultra)/.test(g)
  if (discrete && bigScreen && cores >= 8) return 'ultra'
  if (discrete) return 'high'
  if (/intel|uhd|iris|mali|adreno|apple/.test(g)) return cores >= 8 ? 'medium' : 'low'
  return 'medium'
}

export function gpuName(gl) {
  try {
    const ctx = gl.getContext()
    const ext = ctx.getExtension('WEBGL_debug_renderer_info')
    return ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown GPU'
  } catch {
    return 'unknown GPU'
  }
}
