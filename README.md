# Diwali Cracker Playground

A real-time 3D night scene of an Indian courtyard on Diwali. Pick a cracker from the sidebar and Aarav, a boy in a kurta, walks over and crouches to place it. He lights the fuse, runs back and covers his ears. Then the cracker goes off and he celebrates.

**Light crackers only with an adult nearby.**

## Run it (Windows)

You need Node.js 20 or newer.

```powershell
cd "C:\Asynk clients\diwali cracker\project"
npm install
npm run dev
```

Open **http://localhost:5173** and click **Start the celebration**. That click also turns on audio.

Production build:

```powershell
npm run build
npm run preview
```

Then open **http://localhost:4173**.

## Controls

- **Light it** (sidebar; the bottom bar on phones) runs the full sequence for that cracker. Only one sequence can run at a time, so the buttons are disabled while one is playing and extra clicks are ignored.
- **Replay** runs the last cracker again.
- **Clear** removes the burnt-out crackers from the ground.
- **Sound** turns audio on or off.
- Drag to orbit the camera and scroll (or pinch) to zoom. The camera follows Aarav, then switches to a low, upward view for the rocket and sky shot.

## Crackers (version 1)

| Cracker | Hindi | What happens |
|---|---|---|
| Phuljhadi | फुलझड़ी | A sparkler held in Aarav's hand: forked golden sparks, a warm light on his face, a crackle loop and a wire that burns down |
| Anar | अनार | Fuse hiss, then a golden and silver fountain that rises over about 2 s, holds, and fades into smoke with a whoosh |
| Chakri | चकरी | A ground spinner with a spiral spark trail, a whirr that rises in pitch, and a glowing reflection on the ground |
| Rocket | रॉकेट | Launches from a glass bottle with a whistle, leaves a spark and smoke trail, and bursts in colour with a boom |
| Sky Shot | आसमानी गोला | Three shells: a two-colour peony, a ring, then a large patterned finale with crackle. The sky glow lights the whole scene |

## Project structure

```
src/
  components/   Tailwind UI: TopBar, Sidebar (bottom bar on mobile), StatusBanner, IntroOverlay, icons
  scene/        3D world (Sky, Ground, Houses, StringLights, Diyas, Trees), lights, CameraRig, Child (+ sequence director)
  crackers/     fx.js particle/light engine, FxLayer, CrackerStage, one file per cracker
  store/        zustand store with the strict state machine
  audio/        synth.js (procedural sound design) and audio.js (Howler wrapper and autoplay unlock)
public/assets/  (empty: everything is generated at runtime)
```

## How it works

- **State machine:** `idle → walkingTo → placing → lighting → retreating → waiting → celebrating → idle`. Only `Child.jsx` advances it, using `store.advance(from)`, which steps forward once and only from the expected phase. The two sequences can never overlap.
- **Particles:** Sparks live in a fixed ring buffer of 7,000. Each spark is drawn as an additive streak plus a glow sprite. Smoke uses a separate pool of 700 points. Both have gravity, drag, ground bounce, fade and trails, and allocate nothing per frame.
- **Lights:** Five point lights are created once and handed out to the crackers. The light count never changes, so shaders never recompile. Big bursts also brighten the sky shader and the hemisphere light, and shake the camera.
- **Post-processing:** Bloom, vignette and ACES tone mapping. Pixel ratio is capped at 2, and drei's `PerformanceMonitor` drops it to 1 on slow devices.
- **Audio:** Every sound is synthesised on first use and played through Howler. Audio unlocks on the first click.

See `PROGRESS.md` for decisions and the LATER list, and `CREDITS.md` for licences.
