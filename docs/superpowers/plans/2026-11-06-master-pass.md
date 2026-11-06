# Master Pass: Asynk Family Residency Implementation Plan

> **For agentic workers:** Execute inline (superpowers:executing-plans style), stage by stage. Each stage ends runnable + committed + PROGRESS.md updated. Steps use checkbox syntax.
> Deviation from the writing-plans template (recorded in PROGRESS.md): full code is written directly into the files, not duplicated here. The plan fixes file ownership, interfaces and checks. Pure logic modules get `node --test` tests first (TDD); visual work is checked with headless-Chrome screenshots that are read back.

**Goal:** Turn the single courtyard into a bounded, walkable "Asynk Family Residency" society (~6-10x larger) with free movement, collision, minimap, a data-driven ~30-cracker registry, bazaar, ambient NPC life and NPC cracker events, at ~60 fps.

**Architecture:** Plain-JS world modules (`src/world/*`: layout, collision + A* grid, safety/danger zones, input) are the single source of truth for positions; React/R3F scene components only render from them. Crackers become registry configs (`src/crackers/registry.js`) run by a generic runner over a small set of behaviour handlers that share the existing fx particle/light/sound engine.

**Tech Stack:** Vite + React (JS), Tailwind v4, three / R3F / drei / postprocessing, zustand, framer-motion, howler. No new runtime deps planned.

---

## World plan (metres; +z is south / gate side; world bounds x [-36, 36], z [-30, 30] = 4320 m^2 vs ~480 before)
- Gate: opening |x| < 3.2 at z = 30 (closed decorated gate = collider), arch "Asynk Family Residency", security cabin (6, 27.5) + watchman, signboard, pillar plaque, entrance rangoli (0, 22.5).
- Main lane x [-3.5, 3.5], z [8, 30]; parking strips x = +/-6; cross lane z [5, 9].
- Cracker Ground x [-16, 16], z [-15, 4] with floor markings.
- Blocks: A west x [-35, -25] z [-26, 2] facing +x; B north x [-18, 18] z [-29, -21] facing +z; C east x [25, 35] z [-26, 2] facing -x; D south-east x [14, 35] z [21, 29] facing -z.
- Mandir (12.5, -16.5) facing the ground; big rangoli (-2, -17.5) r 2.6; Lakshmi-puja corner (-13, -18.5); water tank (31, 7).
- Bazaar lane x [-32, -8], z [12, 26]: 9 stalls (north row z 15 facing +z, south row z 23 facing -z).
- Play area + garden x [12, 34], z [6, 18].
- Backdrop beyond the wall: skyline ring, hills, tree silhouettes, tiny distant fireworks.

## File map
- Create `src/world/layout.js`: all positions + collider list + places (pure JS).
- Create `src/world/collision.js`: colliders, `resolveCircle`, `isFree`, `clampToBounds`, `raycastXZ` / `segmentHit` (camera), 0.5 m grid + A* `findPath` with line-of-sight smoothing, `nearestFree`.
- Create `src/world/safety.js`: danger-zone registry, `findPlacement`, `findRetreat`, `pushOutOfDanger`.
- Create `src/world/input.js`: keyboard / joystick / click-target singleton.
- Create `tests/world.test.mjs`, `tests/registry.test.mjs` (node:test).
- Modify `src/scene/society/layout.js` -> re-export world layout values (keeps Mandir/Ground/Diyas working).
- Modify Houses (blocks -> facade segments), StringLights, Ground, Trees, Society (perimeter, gate, cabin, signs, parking, lamps), SceneLights (shadow follows player, fog), CameraRig (follow + collision + clamp + gentle aerial tilt), Child (free movement + director from any spot), store (placement, Clear always), Residents (zones).
- Create `src/components/Minimap.jsx`, `Places.jsx`, `Joystick.jsx`, `Hint.jsx`, `LoadingScreen.jsx`.
- Stage 3: `src/crackers/registry.js`, `src/crackers/patterns.js`, `src/crackers/handlers/*.js(x)`, `src/crackers/CrackerRunner.jsx`; catalog.js becomes a view over the registry.
- Stage 5: `src/scene/bazaar/*`. Stage 6: `src/life/*` (NPC sim, life director, NPC events), ambient audio.

## Stages
- [ ] 1 World layout, bounds + collision, free movement (WASD/arrows, Shift run, click-to-move A*, mobile joystick), follow camera + collision, minimap, places list (auto-walk / fast travel)
- [ ] 2 Character polish + state machine from any spot (placement validation + hint, danger rings, retreat paths), Replay disabled while busy, Clear always (mid-sequence: cancel, stop audio, clear fx, reset child)
- [ ] 3 Cracker engine + registry; Group A (sky), B (ground), C (sound), D (toy cap gun); signatures unique; tests
- [ ] 4 Mandir/rangoli/society decoration polish at the new layout
- [ ] 5 Diwali Bazaar: 9 stalls + shopkeepers, patakha-shop E/tap interaction
- [ ] 6 25-40 residents on one rig, wandering/benches/balconies, life director + NPC cracker events (budgets), reactions, ambient sound + toggle
- [ ] 7 Performance pass (quality Low/Med/High auto), mobile, loading screen, CREDITS/README, build + full verification

## Verification per stage
- `npm test` (node:test logic tests) and `npm run build` pass.
- Headless Chrome (scratchpad playwright scripts): screenshots read back; console has no errors; stage-specific checks (walking into walls/gate, camera clamp, every registry cracker through the UI, rapid clicks, Replay, Clear mid-sequence, toggles, danger radius, NPC events, fps sample at DPR 1).
