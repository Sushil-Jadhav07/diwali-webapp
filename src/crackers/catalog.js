// Metadata for every cracker. Effects live in src/crackers/<Name>.jsx and are
// registered in CrackerStage.jsx. `category` groups them in the sidebar.
export const CATEGORIES = [
  { id: 'handheld', label: 'Hand-held', hindi: 'हाथ वाले' },
  { id: 'ground', label: 'Ground', hindi: 'ज़मीन' },
  { id: 'sky', label: 'Sky', hindi: 'आसमान' },
  { id: 'sound', label: 'Sound', hindi: 'धमाके' },
]

const ground = { held: false, aerial: false, retreat: 0 }
const sky = { held: false, aerial: true, retreat: 0 }

export const CRACKERS = [
  // Hand-held
  {
    id: 'phuljhadi',
    name: 'Phuljhadi',
    hindi: 'फुलझड़ी',
    blurb: 'Hand-held sparkler',
    held: true, // held in the child's hand instead of placed on the ground
    aerial: false,
    retreat: 0.9, // metres the child steps back
    category: 'handheld',
  },
  // Ground
  { id: 'anar', name: 'Anar', hindi: 'अनार', blurb: 'Flowerpot fountain', ...ground, category: 'ground' },
  { id: 'anardeluxe', name: 'Anar Deluxe', hindi: 'बड़ा अनार', blurb: 'Big gold, silver and red fountain', ...ground, category: 'ground' },
  { id: 'colorshower', name: 'Colour Shower', hindi: 'रंगीन फव्वारा', blurb: 'Colour-changing weeping fountain', ...ground, category: 'ground' },
  { id: 'chakri', name: 'Chakri', hindi: 'चकरी', blurb: 'Ground spinner', ...ground, category: 'ground' },
  { id: 'chakrideluxe', name: 'Zameen Chakkar', hindi: 'ज़मीन चक्कर', blurb: 'Big colour-changing spinner', ...ground, category: 'ground' },
  { id: 'snake', name: 'Snake Tablet', hindi: 'साँप की गोली', blurb: 'Curling ash snake and smoke', ...ground, category: 'ground' },
  // Sky
  { id: 'asynk', name: 'ASYNK Shot', hindi: 'असिंक शॉट', blurb: 'Writes Happy Diwali from ASYNK in the sky', ...sky, category: 'sky' },
  { id: 'rocket', name: 'Rocket', hindi: 'रॉकेट', blurb: 'Whistling sky rocket', ...sky, category: 'sky' },
  { id: 'rocketbundle', name: 'Rocket Bundle', hindi: 'रॉकेट का गुच्छा', blurb: 'Five screaming rockets in a fan', ...sky, category: 'sky' },
  { id: 'skyshot', name: 'Sky Shot', hindi: 'आसमानी गोला', blurb: 'Multi-colour aerial burst', ...sky, category: 'sky' },
  { id: 'cake', name: 'Multi-shot Cake', hindi: 'मल्टी-शॉट केक', blurb: '16 shells fired in a fan', ...sky, category: 'sky' },
  // Sound
  { id: 'bijli', name: 'Bijli Bomb', hindi: 'बिजली बम', blurb: 'Atom-bomb bang with a shockwave', ...ground, category: 'sound' },
  { id: 'sutli', name: 'Sutli Bomb', hindi: 'सुतली बम', blurb: 'Long fuse, deep thunderous boom', ...ground, category: 'sound' },
  { id: 'ladi', name: 'Ladi', hindi: 'लड़ी', blurb: 'String of 28 rapid bangs', ...ground, category: 'sound' },
  { id: 'poppop', name: 'Pop-Pop', hindi: 'पॉप-पॉप', blurb: 'Tiny snappers that crackle', ...ground, category: 'sound' },
]

export const CRACKER_BY_ID = Object.fromEntries(CRACKERS.map((c) => [c.id, c]))
