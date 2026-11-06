# PROGRESS — Diwali Cracker Playground

## MASTER PASS — "Asynk Family Residency" (user, 2026-11-06; supersedes earlier upgrade passes)
Plan: docs/superpowers/plans/2026-11-06-master-pass.md (world plan with coordinates, file map, stages).
- [x] Stage 1 — bounded society layout, collision, free movement (WASD / click-to-move A* / joystick), follow camera + collision, minimap, places
  - World: src/world/layout.js (72 x 60 m = 4320 m^2, ~9x the old courtyard), collision.js (AABB/circle colliders, 0.5 m A* grid, camera segment test), safety.js (danger zones, placement/retreat), input.js (keys/joystick/nav). Tests: tests/world.test.mjs (npm test, 10 pass).
  - Scenery re-laid from the layout: 4 apartment blocks (Houses = facade segments), perimeter wall with fairy lights + pots + garlands, closed decorated gate + "Asynk Family Residency" arch + brass plaque + welcome signboard, security cabin + watchman, lanes, Cracker Ground with pads/markings, entrance rangoli, festoon poles, lamp posts, parked cars/scooters, water tank, banner "Happy Diwali from Asynk Family Residency", backdrop (skyline, hills, tree ring, distant fireworks), instanced trees.
  - UI: society name in top bar, Places menu (walk / fast travel), SVG minimap (player, danger zones, people; click to walk), hint toasts, mobile joystick + Run, Ambient toggle, Clear always enabled.
  - Verified (headless Chrome): W/Shift walk+run, strafe, gate/wall stop the child (z <= 29.08) and the camera (clamped inside), auto-walk to mandir arrives, minimap walk arrives, anar from a new spot runs the full phase order, Clear mid-sequence resets (sparks 0, flash 0), all 16 crackers OK, no console errors.
- [x] Stage 2 — character + state machine from any spot (placement validation, danger rings, retreat), Replay disabled while busy, Clear always (+ head look-at at the cracker / nearby people)
- [x] Stage 3 — data-driven cracker registry + engine; Group A sky, B ground, C sound, D toy cap gun
  - src/crackers/registry.js: 46 crackers (22 sky, 14 ground, 8 sound, phuljhadi, toy cap gun), each with hint + unique signature + danger radius + kind/params. Handlers: shells (handlers/Shells.jsx: mortar/rocket/comet/candle/gatling), fountain, spinner (+ vertical wheel), bomb, chain, capgun (handlers/CapGun.jsx), sparkler + original effects. patterns.js: peony, chrysanthemum, willow, palm, ring, doubleRing, spiral, heart, crossette, horsetail, strobe, crackle, pistil, peacock, thunder, bangs, glitterPalm. fx: colour-over-life, wind. Sound: distance-delayed + echo (R.playFar), new thunder/capPop/siren/gatling.
  - Verified: npm test 15 pass (registry: unique ids/signatures, kinds, patterns, sounds, group counts); all 46 crackers through the UI in exact phase order, no console errors.
- [x] Stage 4 — mandir / rangoli / society decoration polish (mandir + rangolis re-placed by the layout, Lakshmi-puja corner src/scene/LakshmiCorner.jsx, light pools, banner, festoons)
- [x] Stage 5 — Diwali Bazaar: src/scene/bazaar/Bazaar.jsx (9 stalls from instanced parts, canopies, EN+HI signboards, props, glows, balloons, chaat steam, safety poster), shopkeepers in Residents (arrange goods, wave at the child, react to bangs), patakha counter: E or tap opens/highlights the cracker menu
- [x] Stage 6 — 44 residents on one instanced rig (19 spectators in 6 chat groups, 9 shopkeepers, 4 bench sitters, 5 balcony watchers, 4 kids at play, 3 bazaar shoppers) with walking legs, A* roaming, danger-zone soft barrier; life director src/life/NpcEvents.jsx (max 2 NPC cracker events, budget-gated, same registry handlers + danger zones; Clear cancels); location-aware ambience (crowd + bazaar beds) gated by the Ambient toggle
- [ ] Stage 7 — performance/quality setting, mobile, loading screen, CREDITS/README, build + verification (DONE so far: quality tiers Low/Medium/High/Ultra auto + saved, dynamic resolution, loading screen, README/CREDITS updated; LEFT: perf pass, mobile check, final full verification)

## QUEUED: FINAL PASS (user, 2026-11-06) — start only after every MASTER PASS stage above is checked
Full spec: docs/superpowers/plans/2026-11-06-final-pass-spec.md
- [ ] F1 full-screen + compact sidebar (64px icons, expands to ~260px), slim top bar, F fullscreen / H hide UI / Tab sidebar, quality tiers Low/Med/High/Ultra (auto + localStorage), language switcher EN/HI/MR (src/i18n)
- [ ] F2 jump (Space / mobile button) with lit-cracker safety block
- [ ] F3 realism pass (CC0 PBR textures, sky, AO, grain, wet ground, detail, characters) + time-of-day slider (sunset -> late night)
- [ ] F4 big central aakash kandil, more kandils/sky lanterns, several rangoli designs
- [ ] F5 always-on ambient sky fireworks (own budget, tier density, toggle)
- [ ] F6 diya lighting game (counter, celebration) + Lakshmi Puja aarti scene at the mandir
- [ ] F7 rangoli making mode (symmetry, templates, undo/redo, save/load)
- [ ] F8 friends & greetings, music/ambience/effects with sliders
- [ ] F9 finale show (countdown, grand sequence) + safety tips (3 languages)
- [ ] F10 final perf pass, README, CREDITS, build + verification

## Milestones
- [x] M1 — Vite + React + Tailwind setup, 3D night scene, sidebar UI, orbit/follow camera
- [x] M2 — Child model, animations, state machine, walking & placing flow
- [x] M3 — 5 crackers (Phuljhadi, Anar, Chakri, Rocket, Sky shot) with particles, lights, bloom, sound
- [x] M4 — Polish, mobile layout, CREDITS.md, README.md, `npm run build` clean, verification
- [x] M5 — img2threejs installed project-locally at .claude/skills/img2threejs (Apache-2.0, user-approved). Its own test suite on Windows: 1416 tests, 7 failures, 3 errors, 64 skipped (upstream says Windows is unsupported). Not used for modelling: the user has not provided a reference image, so the mandir is procedural.

## UPGRADE PASS (user, 2026-11-06) — priority order
- [x] Logo: ASYNK wordmark (public/assets/logomain.png, provided by user) on a light plate in the top bar + welcome card (src/components/BrandLogo.jsx)
- [x] ASYNK Shot (user top priority): sky shell writing "HAPPY DIWALI / FROM ASYNK" in sparks (src/crackers/AsynkShot.jsx), registered in the Sky category
- [x] 1 Character: refined procedural Aarav (src/scene/childBody.jsx + Child.jsx). No CC0 rigged kid with these animations could be fetched unattended, so the procedural one was upgraded.
- [x] 2 People: 19 residents (4 men, 6 women, 4 boys, 2 girls, 3 elders) in src/scene/Residents.jsx, instanced per body part. (Commit c04ae14's message says 16; the real count is 19.)
- [x] 3 Mandir: procedural temple at (-6.3, -5.4), src/scene/Mandir.jsx + src/scene/society/{layout,Glows,Marigolds}.js(x)
- [x] 4 Rangoli: detailed mandalas (textures.js, Ground.jsx)
- [x] 5 Society look (src/scene/Society.jsx): railed balconies on every upper floor, boundary wall with fairy lights, gate pillars with lamp globes, arch with "Shanti Kunj Society" board, marigold toran + hanging strands + pillar spirals, open gate leaves, "शुभ दीपावली / Happy Diwali" banner on the back block, 3 parked cars + 4 scooters, 8 lamp posts, string lights from the gate, 14 rising sky lanterns. No lights added; society meshes cast no shadows (perf).
- [x] 6 More crackers: 16 total in the sidebar (phuljhadi, anar, anardeluxe, colorshower, chakri, chakrideluxe, snake, asynk, rocket, rocketbundle, skyshot, cake, bijli, sutli, ladi, poppop), categorised scrollable sidebar (Hand-held, Ground, Sky, Sound)

## In progress
MASTER PASS stage 7 (perf pass, mobile check, final verification). Then the queued FINAL PASS.

## Next step
Optional polish only (see LATER). If continuing, run the scratchpad-style UI verification again after any change (fire every [data-cracker] button, check the phase order via a store subscription, hammer buttons, check Replay/Clear/sound).

## Verification log (upgrade pass, 2026-11-06)
- Build passes. Full UI run on the dev server: all 16 sidebar crackers ran walkingTo>placing>lighting>retreating>waiting>celebrating>idle; forced clicks on every button + Replay during each run changed nothing; Replay, Clear (5 -> 0) and sound toggle OK; no console errors (only the R3F THREE.Clock warning); idle ~54 fps at DPR 1 on Intel UHD 630 with residents + mandir mounted.
- Offline audio: all 21 synthesised sounds render with no NaN and peaks 0.5-0.97.
- Final run after item 5: `npm run build` passes; all 16 crackers OK through the real UI; no console errors; idle 52-55 fps at DPR 1 on Intel UHD 630 (two fresh runs) after removing shadow casting from society props (it was 44 fps before).
- Screenshots read back: gate + name board + toran + vehicles; banner + balconies; ASYNK text readable in the sky (gold HAPPY DIWALI, white FROM, orange ASYNK); Aarav close-up (face, kurta folds, juti); mandir; residents covering ears on a Bijli bang; categorised sidebar; mobile bar grouped by category with no page overflow.

## Verification log (M4, 2026-11-06)
- `npm run build`: passes (single ~1.4 MB JS chunk, 0 errors).
- Dev server + headless Chrome (real Intel UHD 630 GPU via ANGLE/D3D11): all 5 crackers fired through real UI clicks; each ran walkingTo>placing>lighting>retreating>waiting>celebrating>idle exactly; 15+ forced clicks on other buttons + Replay during each sequence did not change the running sequence; buttons disabled while busy and re-enabled after; Replay, Clear (5 -> 0) and sound toggle (Howler mute/unmute, AudioContext running) verified.
- Console: no errors; only the THREE.Clock deprecation warning emitted inside @react-three/fiber.
- Mobile 390x844: all 5 cards fit in the bottom bar, no horizontal page overflow, 64 deg FOV in portrait.
- Performance: idle 52-60 fps at DPR 1 on Intel UHD 630 after cuts (MSAA off, light count 11 -> 5, light pool 5 -> 3). DPR starts at 1 and PerformanceMonitor raises it toward min(2, devicePixelRatio) only with headroom.
- Production `vite preview` build loads and fires crackers with no errors; dev-only window.__store absent.
- Audio checked offline: all 10 synthesised sounds render (no NaN, peaks 0.5-0.85, <=121 ms each to generate). Not listened to by ear (headless).

## Known bugs
- User feedback 2026-11-06 fixed: sky show camera restored, faster walk/run, brighter society.
- Perf: idle 35-41 fps at DPR 1 on Intel UHD 630 in the 9x world (was 52-55). To fix in stage 7 (string-light/diya/balcony instancing costs, shadows, quality setting).
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

## LATER
- Free-play mode: place several crackers, then light them in sequence
- Optional: a CC0 rigged character (Quaternius/Kenney) if a kurta outfit can be authored; the procedural Aarav is used for now
- Optional: use img2threejs on a user-supplied mandir photo to replace the procedural mandir

## LATER (original v2 list; bijli, ladi and snake tablet are now built)
- Bijli (electric cracker), Ladi (cracker chain), Snake tablet
- Free-play mode: place several crackers then light them in sequence
