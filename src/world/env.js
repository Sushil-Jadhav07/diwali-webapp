// ---------------------------------------------------------------------------
// Time of day: tod 0 = 6:00 pm golden-hour sunset, 0.33 = dusk, 0.66 = 9:00 pm
// night, 1 = late night. computeEnv(tod, out) fills a plain object every frame;
// sky, lights, fog, windows, diyas, string lights and glows read ENV.
// No full daytime: this is a Diwali evening.
// ---------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
// keyframes at tod 0, 0.33, 0.66, 1
const KEY = [0, 0.33, 0.66, 1]
const SKY_TOP = [[0.16, 0.2, 0.46], [0.06, 0.06, 0.2], [0.012, 0.012, 0.05], [0.006, 0.006, 0.03]]
const SKY_MID = [[0.62, 0.36, 0.5], [0.26, 0.13, 0.33], [0.06, 0.05, 0.19], [0.035, 0.03, 0.12]]
const SKY_HOR = [[1.05, 0.55, 0.26], [0.62, 0.25, 0.27], [0.3, 0.13, 0.2], [0.18, 0.08, 0.14]]
const FOG = [[0.42, 0.26, 0.32], [0.2, 0.12, 0.22], [0.078, 0.063, 0.18], [0.05, 0.04, 0.13]]
const HEMI_SKY = [[0.78, 0.62, 0.7], [0.48, 0.42, 0.72], [0.32, 0.33, 0.66], [0.25, 0.26, 0.55]]

function key3(arr, tod, out) {
  let i = 0
  while (i < KEY.length - 2 && tod > KEY[i + 1]) i++
  const t = clamp01((tod - KEY[i]) / (KEY[i + 1] - KEY[i]))
  out[0] = lerp(arr[i][0], arr[i + 1][0], t)
  out[1] = lerp(arr[i][1], arr[i + 1][1], t)
  out[2] = lerp(arr[i][2], arr[i + 1][2], t)
  return out
}

export const ENV = {
  tod: 0,
  night: 0,
  skyTop: [0, 0, 0],
  skyMid: [0, 0, 0],
  skyHor: [0, 0, 0],
  fog: [0, 0, 0],
  fogDensity: 0.0105,
  hemiSky: [0, 0, 0],
  hemi: 1.85,
  sunAmt: 0, // sun disc + horizon glow strength
  sunElev: 0, // radians above the horizon
  dirColor: [0.62, 0.69, 1],
  dirInt: 1.15,
  stars: 1,
  windows: 1, // lit-window emissive factor
  diya: 1, // diya flame brightness
  strings: 1, // string-light brightness
  glow: 1, // glow sprite gain
  pools: 1, // fake light-pool opacity factor
}

export function computeEnv(tod, out = ENV) {
  tod = clamp01(tod)
  out.tod = tod
  out.night = smooth(0.12, 0.72, tod)
  key3(SKY_TOP, tod, out.skyTop)
  key3(SKY_MID, tod, out.skyMid)
  key3(SKY_HOR, tod, out.skyHor)
  key3(FOG, tod, out.fog)
  key3(HEMI_SKY, tod, out.hemiSky)
  out.fogDensity = lerp(0.0075, 0.0105, out.night)
  // the sun sets: +5 degrees at 6 pm, gone below the horizon by dusk
  out.sunElev = lerp(0.09, -0.12, smooth(0, 0.36, tod))
  out.sunAmt = clamp01(1 - smooth(0.0, 0.4, tod))
  // ambient: brighter golden hour, dimmer late night
  out.hemi = lerp(2.5, 1.85, smooth(0, 0.6, tod)) - 0.35 * smooth(0.7, 1, tod)
  // key light: warm low sun -> cool moonlight
  const m = smooth(0.15, 0.55, tod)
  out.dirColor[0] = lerp(1.0, 0.62, m)
  out.dirColor[1] = lerp(0.62, 0.69, m)
  out.dirColor[2] = lerp(0.36, 1.0, m)
  out.dirInt = lerp(1.6, 1.15, m) - 0.25 * smooth(0.75, 1, tod)
  out.stars = smooth(0.25, 0.6, tod)
  // artificial lights: partly on at sunset, fully on once it is dark
  const on = 0.35 + 0.65 * smooth(0.0, 0.5, tod)
  out.windows = on
  out.diya = 0.55 + 0.45 * smooth(0, 0.45, tod)
  out.strings = 0.4 + 0.6 * smooth(0, 0.5, tod)
  out.glow = 0.5 + 0.5 * smooth(0, 0.5, tod)
  out.pools = 0.25 + 0.75 * smooth(0.05, 0.55, tod)
  return out
}

export const TOD_MARKS = [
  { tod: 0, key: 'evening', time: '6:00 pm' },
  { tod: 0.33, key: 'dusk', time: '7:15 pm' },
  { tod: 0.66, key: 'night', time: '9:00 pm' },
  { tod: 1, key: 'lateNight', time: '11:30 pm' },
]
const MARK_MINS = [18 * 60, 19 * 60 + 15, 21 * 60, 23 * 60 + 30]
export function todClock(tod) {
  tod = clamp01(tod)
  let i = 0
  while (i < KEY.length - 2 && tod > KEY[i + 1]) i++
  const u = (tod - KEY[i]) / (KEY[i + 1] - KEY[i])
  const mins = Math.round(MARK_MINS[i] + (MARK_MINS[i + 1] - MARK_MINS[i]) * u)
  const h = Math.floor(mins / 60)
  const mm = String(mins % 60).padStart(2, '0')
  const h12 = h > 12 ? h - 12 : h
  return `${h12}:${mm} pm`
}

computeEnv(0)
