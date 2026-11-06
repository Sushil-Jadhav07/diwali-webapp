# PROGRESS — Diwali Cracker Playground

## Milestones
- [x] M1 — Vite + React + Tailwind setup, 3D night scene, sidebar UI, orbit/follow camera
- [ ] M2 — Child model, animations, state machine, walking & placing flow
- [ ] M3 — 5 crackers (Phuljhadi, Anar, Chakri, Rocket, Sky shot) with particles, lights, bloom, sound
- [ ] M4 — Polish, mobile layout, CREDITS.md, README.md, `npm run build` clean, verification

## In progress
M2 — procedural child + state machine

## Next step
Write src/scene/Child.jsx (procedural kurta boy, pose blending, sequence director).

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
- Only one sequence at a time: clicks while busy are ignored (counted, shows a hint) and buttons are disabled.

## LATER (version 2 — do not build now)
- Bijli (electric cracker), Ladi (cracker chain), Snake tablet
- Free-play mode: place several crackers then light them in sequence
