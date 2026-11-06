# Diwali Cracker Playground — Asynk Family Residency

A real-time 3D Diwali night inside a walled housing society, **Asynk Family Residency**. Walk Aarav, a boy in a kurta, anywhere inside the society. Pick a cracker from the sidebar and he finds a safe open spot, places it, lights the fuse, runs back to a safe distance and watches the show. Residents chat, shop at the Diwali Bazaar, sit on benches, watch from balconies, and light their own crackers too.

**Light crackers only with an adult nearby.**

## Run it (Windows)

You need Node.js 20 or newer.

```powershell
cd "C:\Asynk clients\diwali cracker\project"
npm install
npm run dev
```

Open **http://localhost:5173** and click **Start the celebration**. That click also turns on the audio.

Production build:

```powershell
npm run build
npm run preview
```

Then open **http://localhost:4173**.

Logic tests (world collision and pathfinding, safety rules, cracker registry): `npm test`.

## Controls

- **Walk:** WASD or the arrow keys. Hold **Shift** to run.
- **Click-to-move:** Click the ground, or click a spot on the **minimap**, and Aarav walks there with A* pathfinding around obstacles.
- **Places:** **Places** auto-walks or fast-travels (⚡) to the Gate, Cracker Ground, Mandir, Rangoli, Lakshmi Puja, Diwali Bazaar and Play Area.
- **Camera:** Drag to orbit and scroll to zoom. The camera follows Aarav without resetting your chosen angle, and never goes through walls or leaves the society.
- **Lighting a cracker:** Click **Light it** in the sidebar, or press **E** at the patakha shop counter to open the menu. Aarav lights it from where he stands; if that spot is unsafe, he moves to the nearest valid spot and a hint explains why.
- **Replay and Clear:** **Replay** repeats the last cracker (disabled while one is running). **Clear** always works, even mid-sequence: it cancels the sequence, stops sounds, clears particles, lights, flash and shake, and resets Aarav.
- **Sound:** One toggle for all sound, one for the ambient sound.
- **Mobile:** A bottom bar for the crackers, a virtual joystick and a Run button.

## Safety rules in the world

- Every lit cracker gets a pulsing danger ring on the ground, also shown on the minimap. Aarav and the residents are gently kept out of it.
- Crackers are placed only on open spots: not next to buildings, not on the rangoli or near the mandir, not in the bazaar, play area or gate area, not near people, and not inside another cracker's ring.

## Crackers

The registry (`src/crackers/registry.js`) holds 46 crackers. Each is a config with a name, Hindi name, category, hint, danger radius, a unique one-line signature, and a `kind` with `params` that a shared engine handler runs.

- **Sky:** ASYNK Shot, Whistling Rocket, Bomb Rocket, Rocket Bundle, Sky Shot, 9 Colour Sky Shot, Mega Sky Shot, Peacock Feather, Sky Thunder, 7 Shots, 3 Shots, Shine Starfire, Willow Waterfall, Crossette, Strobe Glitter, Heart & Double Ring, Aakash Tara, Roman Candle, Cake 16, Cake 30 + Finale, Cake 120 Mega and the Gatling Noise Maker.
- **Ground:** Anar, Mini Fountain, Tower Pot, Crackling King, Big Flower Pot, Siren Fountain, Jelly Fancy Fountain, Rung Fusion Comets, Colour Shower, Chakri, Zameen Chakkar, Vertical Wheel, Snake Tablet and Pop-Pop.
- **Hand-held:** Phuljhadi.
- **Sound and bombs:** Bijli, Laxmi Bomb, Sutli Bomb, Atom Bomb, Ladi 100, Ladi 1000, Mirchi Bomb and Murga Chaap.
- **Toys:** A toy cap gun. It's a bright plastic toy pointed at the sky, never at people, that makes small click-pops.

The burst patterns (`src/crackers/patterns.js`) are peony, chrysanthemum, willow, palm, ring, double ring, spiral, heart, crossette, horsetail, strobe, crackle, pistil, peacock, thunder, bangs and glitter palm.

## Project structure

```
src/
  world/        layout.js (the society plan), collision.js (colliders, A* grid, camera test),
                safety.js (danger zones, placement), input.js (keys/joystick/nav), quality.js
  scene/        Sky, Ground, Houses (apartment blocks), Society (wall, gate, cabin, signs, parking),
                Mandir, LakshmiCorner, StringLights, Diyas, Trees, Backdrop, Residents, Child (+ director),
                CameraRig, DangerRings, ClickToMove, bazaar/
  crackers/     registry.js, catalog.js, patterns.js, fx.js (particles + pooled lights), handlers/, effects
  life/         life director + NPC cracker events
  audio/        procedural sound design (synth.js, synthAmbient.js), Howler wrapper, ambience
  components/   Tailwind UI: TopBar, Sidebar, Minimap, Places, Hint, Joystick, StatusBanner, overlays
tests/          node:test logic tests
docs/           plans and specs
```

See `PROGRESS.md` for status and decisions, and `CREDITS.md` for licences.
