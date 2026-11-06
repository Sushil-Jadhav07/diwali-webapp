# PROGRESS — Diwali Cracker Playground

## Milestones
- [x] M1 — Vite + React + Tailwind setup, 3D night scene, sidebar UI, orbit/follow camera
- [x] M2 — Child model, animations, state machine, walking & placing flow
- [ ] M3 — 5 crackers (Phuljhadi, Anar, Chakri, Rocket, Sky shot) with particles, lights, bloom, sound
- [ ] M4 — Polish, mobile layout, CREDITS.md, README.md, `npm run build` clean, verification

## In progress
M3 — the 5 cracker effects (replace placeholder src/crackers/CrackerStage.jsx)

## Next step
Write Phuljhadi, Anar, Chakri, Rocket, SkyShot components in src/crackers and wire them in CrackerStage.

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
- Only one sequence at a time: clicks while busy are ignored (counted, shows a hint) and buttons are disabled.

## LATER (version 2 — do not build now)
- Bijli (electric cracker), Ladi (cracker chain), Snake tablet
- Free-play mode: place several crackers then light them in sequence
