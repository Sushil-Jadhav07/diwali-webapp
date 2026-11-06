// ---------------------------------------------------------------------------
// Data-driven cracker registry. Every cracker is a config; behaviour comes from
// a small set of engine handlers (`kind`):
//   shells    generic aerial launcher (mortar / rocket / comet / candle / gatling) + patterns.js
//   fountain  ground fountains (Anar.jsx Fountain)      spinner  ground / vertical wheels (Chakri.jsx)
//   bomb      sound bombs (Bombs.jsx)                   chain    ladi strings (Ladi.jsx)
//   capgun    toy cap gun (handlers/CapGun.jsx)         sparkler phuljhadi (Phuljhadi.jsx)
//   rocket | rocketbundle | skyshot | cake | asynk | colorshower | snake | poppop: original hand-tuned effects
// Adding a cracker = adding an entry here (no engine code).
// Fields: id, name, hindi, category, hint, signature (unique one-liner), kind,
// params, handling ('placed' | 'held'), aerial, danger (metres), retreat (held).
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: 'sky', label: 'Sky', hindi: 'आसमान' },
  { id: 'ground', label: 'Ground', hindi: 'ज़मीन' },
  { id: 'handheld', label: 'Hand-held', hindi: 'हाथ वाले' },
  { id: 'sound', label: 'Sound & Bombs', hindi: 'धमाके' },
  { id: 'toy', label: 'Toys', hindi: 'खिलौने' },
]

// ---- fountain / spinner / bomb presets (mirrors Anar.jsx / Chakri.jsx / Bombs.jsx) ----
const F = {
  fuse: 3.0, ramp: 2.0, hold: 3.2, fade: 2.0, rate: 950, speed0: 3.6, speedGain: 4.6, spread0: 0.12, spreadGain: 0.16,
  palette: ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'silver', 'silver', 'silver'],
  light: 34, sound: 'whoosh', scale: 1, glow: 2.2, variant: 'classic',
}
const FD = {
  ...F, fuse: 3.2, ramp: 2.5, hold: 5.0, fade: 2.4, rate: 1300, speed0: 4.4, speedGain: 6.0, spread0: 0.14, spreadGain: 0.2,
  palette: ['gold', 'gold', 'gold', 'silver', 'silver', 'red', 'red'], light: 46, sound: 'whooshBig', scale: 1.55, glow: 2.9, variant: 'deluxe',
}
const S = {
  fuse: 2.8, spinUp: 1.0, burn: 6.0, omega0: 10, omegaGain: 30, rate: 760, rim: 0.07, scale: 1, drift: 0.18, cycle: false,
  sound: 'whirr', rateBase: 0.65, rateGain: 0.95, vol: 0.55, light: 9, glowR: 1.3, variant: 'classic',
}
const SD = { ...S, fuse: 3.0, burn: 8.5, omega0: 12, omegaGain: 36, rate: 1150, rim: 0.11, scale: 1.6, drift: 0.32, cycle: true, sound: 'whirrDeluxe', rateBase: 0.7, rateGain: 0.7, vol: 0.6, light: 12, glowR: 1.9, variant: 'deluxe' }
const RED = [3.0, 0.35, 0.3]
const ORANGE = [3.0, 1.0, 0.25]
const GREEN = [0.5, 2.8, 0.6]

const sky = (o) => ({ category: 'sky', handling: 'placed', aerial: true, danger: 4, ...o })
const ground = (o) => ({ category: 'ground', handling: 'placed', aerial: false, danger: 3, ...o })
const sound = (o) => ({ category: 'sound', handling: 'placed', aerial: false, danger: 5, ...o })

export const REGISTRY = [
  // ------------------------------- A. Sky shots and rockets -------------------------------
  sky({ id: 'asynk', name: 'ASYNK Shot', hindi: 'असिंक शॉट', hint: 'Writes Happy Diwali from ASYNK in the sky', signature: 'sparks spell HAPPY DIWALI / FROM ASYNK in gold, white and brand orange', kind: 'asynk' }),
  sky({ id: 'rocket', name: 'Whistling Rocket', hindi: 'सीटी रॉकेट', hint: 'Seeti rocket from a bottle', signature: 'single rocket from a glass bottle with a rising whistle and one coloured peony', kind: 'rocket' }),
  sky({
    id: 'bombrocket', name: 'Bomb Rocket', hindi: 'धमाका रॉकेट', hint: '2/3 sound rocket: bangs, no colour',
    signature: 'rocket that ends in three hard white bangs with no colour', kind: 'shells',
    params: { fuse: 2.4, launcher: 'rocket', model: { w: 0.16, h: 0.3, d: 0.16, color: '#7f1d1d', band: '#facc15', tubes: [1, 1] }, shots: [{ at: 0, rise: 1.45, bangs: 3, tail: 'gold' }], linger: 2.4 },
  }),
  sky({ id: 'rocketbundle', name: 'Rocket Bundle', hindi: 'रॉकेट का गुच्छा', hint: 'Five screaming rockets in a fan', signature: 'five rockets leave a wooden stand one after another and burst in a fan', kind: 'rocketbundle' }),
  sky({ id: 'skyshot', name: 'Sky Shot', hindi: 'आसमानी गोला', hint: 'Peony, ring, then a patterned finale', signature: 'three mortar shells: two-colour peony, tilted ring, rainbow chrysanthemum finale with crackle', kind: 'skyshot' }),
  sky({
    id: 'multicolour', name: '9 Colour Sky Shot', hindi: 'नौ रंग शॉट', hint: 'Stars that change colour as they fall',
    signature: 'peonies whose stars shift from one colour to another mid-air (9 colours)', kind: 'shells',
    params: {
      fuse: 2.8, launcher: 'mortar', model: { color: '#0f766e', band: '#f472b6', tubes: [3, 3] },
      shots: [
        { at: 0, h: 20, pattern: 'peony', colors: ['red', 'gold', 'green'], colorEnd: ['blue', 'pink', 'cyan'] },
        { at: 1.4, h: 23, pattern: 'peony', colors: ['violet', 'cyan', 'orange'], colorEnd: ['gold', 'red', 'green'] },
        { at: 2.8, h: 25, pattern: 'chrysanthemum', colors: ['pink', 'blue', 'gold'], colorEnd: ['green', 'violet', 'red'], scale: 1.1 },
      ],
    },
  }),
  sky({
    id: 'mega', name: 'Mega Sky Shot', hindi: 'मेगा शॉट', hint: 'Huge chrysanthemum with a thunder boom',
    signature: 'one enormous long-trailed chrysanthemum with a silver pistil core and a thunder boom', kind: 'shells', danger: 5,
    params: { fuse: 3.2, launcher: 'mortar', model: { w: 0.4, h: 0.4, d: 0.4, color: '#1e1b4b', band: '#f59e0b', tubes: [1, 1] }, shots: [{ at: 0, h: 27, rise: 1.6, pattern: 'chrysanthemum', colors: ['gold', 'orange'], pistil: 'silver', scale: 1.4, sound: 'thunder', light: 3400, flash: 1.0, shake: 0.24 }], linger: 4 },
  }),
  sky({
    id: 'peacock', name: 'Peacock Feather', hindi: 'मोरपंख', hint: 'Feather fans with eye-like tips, three times',
    signature: 'camera-facing fan of green-gold feathers ending in blue/violet eyes, repeated three times', kind: 'shells',
    params: { fuse: 2.8, launcher: 'mortar', model: { color: '#065f46', band: '#38bdf8', tubes: [3, 1] }, shots: [0, 1.8, 3.6].map((at, i) => ({ at, h: 19 + i * 2, pattern: 'peacock', colors: ['green', 'blue'], scale: 0.95 })) },
  }),
  sky({
    id: 'thunder', name: 'Sky Thunder', hindi: 'आसमानी गड़गड़ाहट', hint: 'White flash, shockwave ring, rolling thunder',
    signature: 'blinding white sky flash with an expanding shockwave ring and long rolling thunder', kind: 'shells', danger: 5,
    params: { fuse: 3.0, launcher: 'mortar', model: { color: '#111827', band: '#e5e7eb', tubes: [1, 1] }, shots: [{ at: 0, h: 22, thunder: true }], linger: 5 },
  }),
  sky({
    id: 'shots7', name: '7 Shots', hindi: 'सात शॉट', hint: 'Seven quick shells in a fan',
    signature: 'seven fast mortar shells fanning left to right in alternating peony / ring / double ring', kind: 'shells',
    params: { fuse: 2.6, launcher: 'mortar', model: { color: '#9f1239', band: '#fde047', tubes: [7, 1], w: 0.4, d: 0.14 }, gen: { count: 7, gap: 0.5, h: [17, 22], patterns: ['peony', 'ring', 'peony', 'doubleRing'], colors: [['red', 'gold'], ['green'], ['blue', 'silver'], ['pink', 'cyan']], fan: 0.5, rise: 0.95, scale: 0.85, countScale: 0.8, sound: 'boom', light: 1300, flash: 0.45, shake: 0.06 } },
  }),
  sky({
    id: 'shots3', name: '3 Shots', hindi: 'तीन शॉट', hint: 'Three heavy gold palms',
    signature: 'three slow, heavy gold palm shells with thick fronds', kind: 'shells',
    params: { fuse: 2.6, launcher: 'mortar', model: { color: '#78350f', band: '#fbbf24', tubes: [3, 1], w: 0.3, d: 0.12 }, shots: [0, 1.1, 2.2].map((at, i) => ({ at, h: 20 + i, pattern: 'palm', colors: [['orange', 'red', 'green'][i]], tail: 'glitter' })) },
  }),
  sky({
    id: 'starfire', name: 'Shine Starfire', hindi: 'शाइन स्टारफायर', hint: 'A stream of whistling glitter comets',
    signature: 'eight whistling glitter comets streaming up and popping into tiny glitter palms', kind: 'shells',
    params: { fuse: 2.6, launcher: 'comet', model: { color: '#312e81', band: '#c4b5fd', tubes: [4, 2] }, shots: Array.from({ length: 8 }, (_, i) => ({ at: i * 0.45, h: 14 + (i % 4) * 2, rise: 1.4, whistle: true, tail: 'glitter', pattern: 'glitterPalm', drift: [(i % 2 ? 1 : -1) * (1 + (i % 3)), -1], sound: 'burstPop', light: 600, flash: 0.15, shake: 0.01 })) },
  }),
  sky({
    id: 'willow', name: 'Willow Waterfall', hindi: 'विलो झरना', hint: 'Golden willow that hangs and drips',
    signature: 'dim gold willow branches that hang for seconds and slowly drip down', kind: 'shells',
    params: { fuse: 2.8, launcher: 'mortar', model: { color: '#422006', band: '#facc15', tubes: [2, 1] }, shots: [{ at: 0, h: 25, pattern: 'willow', colors: ['gold'], light: 1400, flash: 0.45 }, { at: 2.2, h: 23, pattern: 'willow', colors: ['gold'], light: 1400, flash: 0.45 }], linger: 5 },
  }),
  sky({
    id: 'crossette', name: 'Crossette Sky', hindi: 'क्रॉसेट', hint: 'Stars that split into crosses',
    signature: 'big white lead stars that each split into a four-way coloured cross', kind: 'shells',
    params: { fuse: 2.8, launcher: 'mortar', model: { color: '#1d4ed8', band: '#fde047', tubes: [2, 1] }, shots: [{ at: 0, h: 21, pattern: 'crossette', colors: ['cyan', 'gold'] }, { at: 1.8, h: 23, pattern: 'crossette', colors: ['red', 'green'] }] },
  }),
  sky({
    id: 'strobe', name: 'Strobe Glitter', hindi: 'स्ट्रोब चमक', hint: 'White stars blinking on and off',
    signature: 'slow white strobing stars that blink on and off like glitter', kind: 'shells',
    params: { fuse: 2.8, launcher: 'mortar', model: { color: '#374151', band: '#f8fafc', tubes: [2, 1] }, shots: [{ at: 0, h: 22, pattern: 'strobe', colors: ['silver'], sound: 'burstPop' }, { at: 1.6, h: 20, pattern: 'strobe', colors: ['silver'], sound: 'burstPop' }], linger: 4.5 },
  }),
  sky({
    id: 'heart', name: 'Heart & Double Ring', hindi: 'दिल और दोहरी रिंग', hint: 'A pink heart, then two crossed rings',
    signature: 'a pink heart drawn facing you, followed by two crossed rings in blue and gold', kind: 'shells',
    params: { fuse: 2.8, launcher: 'mortar', model: { color: '#be185d', band: '#fbcfe8', tubes: [2, 1] }, shots: [{ at: 0, h: 21, pattern: 'heart', colors: ['pink'] }, { at: 1.8, h: 23, pattern: 'doubleRing', colors: ['blue', 'gold'] }] },
  }),
  sky({
    id: 'aakashtara', name: 'Aakash Tara', hindi: 'आकाश तारा', hint: 'Slow coloured comets (Ganga) with long tails',
    signature: 'slow red/green/blue comets climbing with long coloured tails and no burst', kind: 'shells',
    params: { fuse: 2.6, launcher: 'comet', model: { color: '#0e7490', band: '#a5f3fc', tubes: [3, 2] }, shots: ['red', 'green', 'blue', 'gold', 'pink'].map((c, i) => ({ at: i * 0.7, h: 16 + i * 1.5, rise: 2.3, tail: 'color', colors: [c], pattern: 'none', drift: [(i - 2) * 1.6, -1], sound: 'cakeShot', volume: 0.3, light: 200, flash: 0.05, shake: 0 })) },
  }),
  sky({
    id: 'romancandle', name: 'Roman Candle', hindi: 'रोमन कैंडल', hint: 'Eight fireballs puffed up one by one',
    signature: 'a tall tube puffs eight big coloured fireballs straight up, one at a time', kind: 'shells',
    params: { fuse: 2.4, launcher: 'candle', model: { w: 0.07, h: 0.32, d: 0.07, color: '#b91c1c', band: '#fef08a', tubes: [1, 1], tall: true }, shots: ['red', 'green', 'gold', 'blue', 'pink', 'cyan', 'orange', 'violet'].map((c, i) => ({ at: i * 0.7, colors: [c] })), linger: 2.4 },
  }),
  sky({ id: 'cake', name: 'Cake 16', hindi: 'केक 16', hint: '16 shells fired in a fan', signature: 'sixteen small shells (peony, crackle, ring, willow) fanned from one box', kind: 'cake' }),
  sky({
    id: 'cake30', name: 'Cake 30 + Finale', hindi: 'केक 30', hint: '30 shots then a 5-shell finale',
    signature: 'thirty rapid mixed shells (spiral, peony, ring, horsetail) and a five-shell glitter finale', kind: 'shells', danger: 4.5,
    params: { fuse: 2.8, launcher: 'mortar', model: { w: 0.44, h: 0.26, d: 0.3, color: '#7c2d12', band: '#fde047', tubes: [6, 5] }, gen: { count: 30, gap: 0.3, h: [15, 21], patterns: ['spiral', 'peony', 'ring', 'horsetail', 'peony'], colors: [['red', 'gold'], ['green', 'silver'], ['blue'], ['gold'], ['pink', 'cyan']], fan: 0.55, rise: 0.8, scale: 0.7, countScale: 0.5, finale: { count: 5, pattern: 'chrysanthemum', colors: [['gold'], ['red', 'gold'], ['silver'], ['green', 'gold'], ['blue', 'silver']], h: [22, 26], scale: 1.05 } } },
  }),
  sky({
    id: 'cake120', name: 'Cake 120 Mega', hindi: 'केक 120', hint: '120 rapid shots with a finale',
    signature: 'a 120-shot barrage of tiny peonies and crackles at low height, then a seven-shell finale', kind: 'shells', danger: 5,
    params: { fuse: 3.0, launcher: 'mortar', model: { w: 0.6, h: 0.3, d: 0.5, color: '#4c1d95', band: '#f97316', tubes: [10, 8] }, gen: { count: 120, gap: 0.09, h: [10, 15], patterns: ['peony', 'crackle', 'peony', 'strobe'], colors: [['red'], ['gold'], ['green'], ['blue'], ['pink'], ['cyan']], fan: 0.7, rise: 0.6, scale: 0.45, countScale: 0.22, sound: 'burstPop', light: 500, flash: 0.12, shake: 0.01, finale: { count: 7, pattern: 'peony', colors: [['gold'], ['red'], ['green'], ['blue'], ['pink'], ['silver'], ['orange']], h: [20, 25], scale: 1 } } },
  }),
  sky({
    id: 'gatling', name: 'Gatling Noise Maker', hindi: 'गैटलिंग', hint: '288 rapid crackling pops',
    signature: 'a box that rattles out 288 rapid white pops just above it for ten seconds', kind: 'shells', danger: 3.5,
    params: { fuse: 2.4, launcher: 'gatling', model: { w: 0.34, h: 0.2, d: 0.34, color: '#18181b', band: '#ef4444', tubes: [12, 12] }, shots: [{ at: 0 }] },
  }),

  // ------------------------------- B. Ground and fountains -------------------------------
  ground({ id: 'anar', name: 'Anar', hindi: 'अनार', hint: 'Classic flowerpot fountain', signature: 'red clay pot, gold-and-silver fountain rising over 2 s', kind: 'fountain', params: F }),
  ground({ id: 'minifountain', name: 'Mini Fountain', hindi: 'मिनी फव्वारा', hint: 'Small low pure-gold fountain', signature: 'small, knee-high, pure gold fountain', kind: 'fountain', danger: 2.2, params: { ...F, scale: 0.62, rate: 560, speed0: 2.2, speedGain: 2.4, hold: 2.6, palette: ['gold'], light: 18, glow: 1.4 } }),
  ground({ id: 'towerpot', name: 'Tower Pot', hindi: 'टावर पॉट', hint: 'Tall pot that changes red, green, blue', signature: 'tall fountain cycling red, then green, then blue every two seconds', kind: 'fountain', danger: 3.5, params: { ...FD, scale: 1.3, cycle: [['red', 'red', 'gold'], ['green', 'green', 'gold'], ['blue', 'blue', 'silver']], cycleT: 2.2, lightColor: [1, 0.6, 0.6] } }),
  ground({ id: 'cracklingking', name: 'Crackling King', hindi: 'क्रैकलिंग किंग', hint: 'Gold fountain full of crackling pops', signature: 'gold fountain whose plume pops with white crackle flashes', kind: 'fountain', params: { ...F, scale: 1.15, crackle: 28, palette: ['gold', 'gold', 'orange', 'silver'] } }),
  ground({ id: 'anardeluxe', name: 'Big Flower Pot', hindi: 'बड़ा अनार', hint: 'Big gold, silver and red fountain', signature: 'big green pot, very tall gold/silver/red fountain for eight seconds', kind: 'fountain', danger: 3.5, params: FD }),
  ground({ id: 'siren', name: 'Siren Fountain', hindi: 'सायरन फव्वारा', hint: 'Silver fountain with a wailing whistle', signature: 'mostly silver fountain with a rising-and-falling siren whistle', kind: 'fountain', params: { ...F, siren: 'siren', palette: ['silver', 'silver', 'silver', 'gold'], light: 30, lightColor: [0.85, 0.9, 1] } }),
  ground({ id: 'jelly', name: 'Jelly Fancy Fountain', hindi: 'जेली फव्वारा', hint: 'Soft glowing pastel jelly blobs', signature: 'low fountain throwing soft, slow pastel blobs of pink, cyan and violet', kind: 'fountain', params: { ...F, rate: 360, speed0: 2.0, speedGain: 2.6, jelly: 42, palette: ['pink', 'cyan', 'violet', 'green'], lightColor: [0.9, 0.6, 1] } }),
  ground({ id: 'rungfusion', name: 'Rung Fusion Comets', hindi: 'रंग फ्यूज़न', hint: 'Fountain firing coloured comets high', signature: 'colour fountain that keeps firing glittering comets 6 m up', kind: 'fountain', danger: 3.5, params: { ...F, rate: 420, comets: 4.5, palette: ['red', 'green', 'blue', 'gold'] } }),
  ground({ id: 'colorshower', name: 'Colour Shower', hindi: 'रंगीन फव्वारा', hint: 'Colour-changing weeping fountain', signature: 'slim tube with a weeping, colour-cycling shower', kind: 'colorshower' }),
  ground({ id: 'chakri', name: 'Chakri', hindi: 'चकरी', hint: 'Ground spinner', signature: 'small green coil spinning on the ground with a gold spiral of sparks', kind: 'spinner', params: S }),
  ground({ id: 'chakrideluxe', name: 'Zameen Chakkar', hindi: 'ज़मीन चक्कर', hint: 'Big colour-changing spinner', signature: 'big purple spinner that wanders and changes colour every 1.5 s', kind: 'spinner', params: SD }),
  ground({ id: 'wheel', name: 'Vertical Wheel', hindi: 'घूमता पहिया', hint: 'Wheel on a stake spinning upright', signature: 'upright wheel on a stake throwing a vertical ring of colour sparks', kind: 'spinner', params: { ...SD, vertical: true, hubY: 1.0, drift: 0, scale: 1.3, rim: 0.12, rate: 900 } }),
  ground({ id: 'snake', name: 'Snake Tablet', hindi: 'साँप की गोली', hint: 'Growing ash snake with thin smoke', signature: 'a dark tablet grows a curling grey ash snake with thin smoke and no flame', kind: 'snake', danger: 1.5 }),
  ground({ id: 'poppop', name: 'Pop-Pop', hindi: 'पॉप-पॉप', hint: 'Little snapping balls', signature: 'a handful of tiny paper balls that snap with tiny white flashes', kind: 'poppop', danger: 1.6 }),

  // ------------------------------- C. Sound patakas -------------------------------
  sound({ id: 'bijli', name: 'Bijli', hindi: 'बिजली', hint: 'Small, sharp crack', signature: 'thin green stick, small sharp crack and a puff', kind: 'bomb', danger: 3, params: { fuse: 2.4, power: 0.7, ring: 2.2, ringDur: 0.45, flash: 2, light: 160, sky: 0.2, shake: 0.14, sound: 'ladiBang', paper: GREEN, end: 2.0, model: 'bijli' } }),
  sound({ id: 'laxmi', name: 'Laxmi Bomb', hindi: 'लक्ष्मी बम', hint: 'Red bomb, loud sharp bang', signature: 'red-and-gold Laxmi bomb: loud sharp bang, red paper bits, medium shockwave', kind: 'bomb', params: { fuse: 3.0, power: 1.2, ring: 3.8, ringDur: 0.6, flash: 3, light: 240, sky: 0.4, shake: 0.32, sound: 'bang', paper: RED, end: 2.6, model: 'laxmi', fuseTop: 0.14 } }),
  sound({ id: 'sutli', name: 'Sutli Bomb', hindi: 'सुतली बम', hint: 'Long fuse, deep boom', signature: 'twine-wrapped ball, long fuse, deep boom and a tall dust column', kind: 'bomb', danger: 5.5, params: { fuse: 4.6, power: 1.9, ring: 6.5, ringDur: 0.9, flash: 4.5, light: 330, sky: 0.65, shake: 0.55, sound: 'sutliBoom', paper: ORANGE, end: 3.4, model: 'sutli', fuseTop: 0.13, dust: true } }),
  sound({ id: 'atom', name: 'Atom Bomb', hindi: 'एटम बम', hint: 'Biggest bang: shockwave and shake', signature: 'biggest bang: huge shockwave ring, strong screen shake and a rising smoke mushroom', kind: 'bomb', danger: 7, params: { fuse: 4.2, power: 2.5, ring: 8.5, ringDur: 1.0, flash: 6, light: 420, sky: 0.9, shake: 0.7, sound: 'sutliBoom', paper: GREEN, end: 4.2, model: 'atom', fuseTop: 0.18, dust: true, mushroom: true } }),
  sound({ id: 'ladi100', name: 'Ladi 100', hindi: 'लड़ी 100', hint: 'A string of bangs in a row', signature: 'a 60-cracker string laid on the ground going off in a quick row', kind: 'chain', params: { n: 60, gap: [0.05, 0.1], spacing: 0.04 } }),
  sound({ id: 'ladi1000', name: 'Ladi 1000', hindi: 'लड़ी 1000', hint: 'Very long, machine-fast string', signature: 'a very long 160-cracker string bursting machine-gun fast', kind: 'chain', danger: 6, params: { n: 160, gap: [0.018, 0.04], spacing: 0.034, wiggle: 0.22 } }),
  sound({ id: 'mirchi', name: 'Mirchi Bomb', hindi: 'मिर्ची बम', hint: 'Slow, spaced-out chilli chain', signature: 'short chain of chilli crackers banging slowly one by one', kind: 'chain', danger: 4, params: { n: 24, gap: [0.16, 0.3], spacing: 0.07, wiggle: 0.05 } }),
  sound({ id: 'murga', name: 'Murga Chaap', hindi: 'मुर्गा छाप', hint: 'Rooster-brand medium string', signature: 'medium 90-cracker rooster-brand string in a zig-zag, steady rhythm', kind: 'chain', params: { n: 90, gap: [0.035, 0.06], spacing: 0.04, wiggle: 0.3 } }),

  // ------------------------------- Hand-held and D. Toys -------------------------------
  { id: 'phuljhadi', name: 'Phuljhadi', hindi: 'फुलझड़ी', category: 'handheld', handling: 'held', aerial: false, danger: 1.3, retreat: 0.9, hint: 'Hand-held sparkler', signature: 'hand-held wire sparkler with forked golden sparks that lights the face', kind: 'sparkler' },
  { id: 'capgun', name: 'Toy Cap Gun', hindi: 'टॉय कैप गन', category: 'toy', handling: 'held', aerial: false, danger: 1.1, retreat: 0.6, hint: 'Bright toy with a red paper cap roll', signature: 'bright plastic toy pointed at the sky: 6-10 tiny click-pops with grey puffs', kind: 'capgun', params: { pulls: [6, 10], gap: [0.45, 0.75] } },
]

export const KINDS = ['shells', 'fountain', 'spinner', 'bomb', 'chain', 'capgun', 'sparkler', 'rocket', 'rocketbundle', 'skyshot', 'cake', 'asynk', 'colorshower', 'snake', 'poppop']
export const REGISTRY_BY_ID = Object.fromEntries(REGISTRY.map((r) => [r.id, r]))
