# PROGRESS — Diwali Cracker Playground

## Milestones
- [x] M1 — Vite + React + Tailwind setup, 3D night scene, sidebar UI, orbit/follow camera
- [x] M2 — Child model, animations, state machine, walking & placing flow
- [x] M3 — 5 crackers (Phuljhadi, Anar, Chakri, Rocket, Sky shot) with particles, lights, bloom, sound
- [ ] M4 — Polish, mobile layout, CREDITS.md, README.md, `npm run build` clean, verification

## In progress
M4 — polish, mobile layout check, replace lucide-react with own SVG icons, CREDITS.md, README.md, final verification

## Next step
Swap lucide-react for src/components/Icons.jsx; mobile screenshot check at 390x844; write CREDITS.md + README.md; npm run build; final verification run.

## Known bugs
- Console warning "THREE.Clock deprecated" comes from inside @react-three/fiber 9 (not our code); harmless.

## Decisions
- Project scaffolded by hand (no interactive create-vite) so it runs unattended.
- Tailwind CSS v4 via @tailwindcss/vite plugin (no tailwind.config.js needed).
- Design via ui-ux-pro-max: Fredoka (display) + Nunito (body) + Baloo 2 (Devanagari); SVG icons (lucide-react, ISC) not emoji; gold/ember on indigo glass panels.
- All audio is synthesised in-browser (src/audio/synth.js -> WAV blobs -> Howler). No downloaded sound files, so nothing can block on assets.
- Scenery is procedural (canvas textures for tiles, plaster, rangoli; no HDRI) to keep bundle small and avoid downloads.
- Single FX engine (src/crackers/fx.js): ring-buffer spark streaks + glow points, smoke points, 5 pooled point lights that always exist (no shader recompiles).
- Child is named "Aarav" in UI copy.
- Child: no free CC0 rigged kid with walk/run/crouch was downloadable unattended, so Aarav is a procedural low-poly boy (kurta, pyjama, mojari) built from primitives with joint hierarchy + procedural gait/crouch/cover-ears/celebrate poses, damped pose blending and foot-on-ground hip height (src/scene/Child.jsx).
- Child.jsx is also the sequence DIRECTOR: the only code that advances phases (store.advance(from) only moves forward one step from the expected phase).
- Asset policy (user rule): NO Pixabay / Mixamo. Only Quaternius / Kenney / Poly Haven (CC0) or Freesound CC0/CC-BY. Currently zero external assets are used.
- Package policy (user rule): extras must be well-known, maintained, licence-checked. Extras so far: lucide-react (ISC). postprocessing (Zlib) is a dependency of approved @react-three/postprocessing, imported only for ToneMappingMode.
- Crackers (src/crackers/*.jsx): each owns its model, fuse (hiss + fizz sparks + small light), effect timeline, pooled light and sounds; cleanup on unmount stops sounds and releases lights. Burnt shells stay on the ground until Clear scene.
- Aerial shows (rocket, sky shot): CameraRig switches to a low wide "show camera" looking up (temporarily relaxes OrbitControls maxPolarAngle), then glides back to the user's previous offset.
- Burst heights scaled to 18-26 m (not real-world 40 m+) so the courtyard stays in frame.
- Sparkler: child turns to face the camera so the sparkler light falls on his face.
- Only one sequence at a time: clicks while busy are ignored (counted, shows a hint) and buttons are disabled.

## LATER (version 2 — do not build now)
- Bijli (electric cracker), Ladi (cracker chain), Snake tablet
- Free-play mode: place several crackers then light them in sequence
