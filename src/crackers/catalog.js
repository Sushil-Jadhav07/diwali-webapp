// Metadata for the version-1 crackers. Effects live in src/crackers/<Name>.jsx.
export const CRACKERS = [
  {
    id: 'phuljhadi',
    name: 'Phuljhadi',
    hindi: 'फुलझड़ी',
    blurb: 'Hand-held sparkler',
    held: true, // held in the child's hand instead of placed on the ground
    aerial: false,
    retreat: 0.9, // metres the child steps back
  },
  { id: 'anar', name: 'Anar', hindi: 'अनार', blurb: 'Flowerpot fountain', held: false, aerial: false, retreat: 0 },
  { id: 'chakri', name: 'Chakri', hindi: 'चकरी', blurb: 'Ground spinner', held: false, aerial: false, retreat: 0 },
  { id: 'rocket', name: 'Rocket', hindi: 'रॉकेट', blurb: 'Whistling sky rocket', held: false, aerial: true, retreat: 0 },
  { id: 'skyshot', name: 'Sky Shot', hindi: 'आसमानी गोला', blurb: 'Multi-colour aerial burst', held: false, aerial: true, retreat: 0 },
]

export const CRACKER_BY_ID = Object.fromEntries(CRACKERS.map((c) => [c.id, c]))
