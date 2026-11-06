# PROGRESS — Diwali Cracker Playground

## Milestones
- [x] M1 — Vite + React + Tailwind setup, 3D night scene, sidebar UI, orbit/follow camera
- [x] M2 — Child model, animations, state machine, walking & placing flow
- [x] M3 — 5 crackers (Phuljhadi, Anar, Chakri, Rocket, Sky shot) with particles, lights, bloom, sound
- [x] M4 — Polish, mobile layout, CREDITS.md, README.md, `npm run build` clean, verification
- [ ] M5 (user request, added mid-run) — install img2threejs skill project-locally and use it to rebuild one cracker prop from a CC0/CC-BY reference photo

## In progress
M5 — img2threejs (see below)

## Next step
Copy img2threejs checkout into project/.claude/skills/img2threejs (project-local, NOT ~/.claude), run its python unittest suite, find a CC0/CC-BY anar/flowerpot photo, run forge/state.py init + forge/next.py gates, port resulting model into src/crackers/Anar.jsx AnarModel.

## Verification log (M4, 2026-11-06)
- `npm run build`: passes (single ~1.4 MB JS chunk, 0 errors).
- Dev server + headless Chrome (real Intel UHD 630 GPU via ANGLE/D3D11): all 5 crackers fired through real UI clicks; each ran walkingTo>placing>lighting>retreating>waiting>celebrating>idle exactly; 15+ forced clicks on other buttons + Replay during each sequence did not change the running sequence; buttons disabled while busy and re-enabled after; Replay, Clear (5 -> 0) and sound toggle (Howler mute/unmute, AudioContext running) verified.
- Console: no errors; only the THREE.Clock deprecation warning emitted inside @react-three/fiber.
- Mobile 390x844: all 5 cards fit in the bottom bar, no horizontal page overflow, 64 deg FOV in portrait.
- Performance: idle 52-60 fps at DPR 1 on Intel UHD 630 after cuts (MSAA off, light count 11 -> 5, light pool 5 -> 3). DPR starts at 1 and PerformanceMonitor raises it toward min(2, devicePixelRatio) only with headroom.
- Production `vite preview` build loads and fires crackers with no errors; dev-only window.__store absent.
- Audio checked offline: all 10 synthesised sounds render (no NaN, peaks 0.5-0.85, <=121 ms each to generate). Not listened to by ear (headless).

## Known bugs
- claude-mem MCP worker was unreachable on 2026-11-06 ("worker could not complete this request"), so session notes live only in this file.
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
- Performance (Intel iGPU baseline): EffectComposer multisampling 0; one courtyard glow light + one porch light + 3 pooled FX lights + hemisphere + shadowed moon light.
- lucide-react removed; UI icons are original SVGs in src/components/Icons.jsx (keeps all chosen deps MIT).
- Only one sequence at a time: clicks while busy are ignored (counted, shows a hint) and buttons are disabled.

## LATER (version 2 — do not build now)
- Bijli (electric cracker), Ladi (cracker chain), Snake tablet
- Free-play mode: place several crackers then light them in sequence
