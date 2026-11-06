# Credits and licences

## External assets

**None.** This project ships with no downloaded models, textures, HDRIs or sound files.

| Item | How it is made | Licence |
|---|---|---|
| Child character "Aarav" (kurta, pyjama, mojari) and all his animations | Built from three.js primitives with procedural poses in `src/scene/Child.jsx` | Original work for this project |
| Houses, string lights, diyas, kandils, toran, trees | Procedural geometry in `src/scene/` | Original work for this project |
| Courtyard tiles, plaster, rangoli, glow textures | Drawn on `<canvas>` at runtime in `src/scene/textures.js` | Original work for this project |
| Sky gradient, moon | Shader and mesh in `src/scene/Sky.jsx` | Original work for this project |
| All sounds (fuse hiss, sparkler crackle, anar whoosh, chakri whirr, rocket whistle, boom, thump, crackle, match strike, night ambience) | Synthesised in the browser in `src/audio/synth.js`, encoded to WAV and played by Howler | Original work for this project |
| Cracker icons and UI icons | Hand-written inline SVG in `src/components/CrackerIcon.jsx` and `src/components/Icons.jsx` | Original work for this project |
| Asynk Family Residency world: blocks, perimeter wall, gate, security cabin, signboards, parking, water tank, lamp posts, festoons, backdrop skyline/hills | Procedural geometry and canvas textures in `src/scene/` and `src/world/layout.js` | Original work for this project |
| Diwali Bazaar (9 stalls, props, canopies, signboards, safety poster), Lakshmi-puja corner (painting drawn on a canvas) | `src/scene/bazaar/Bazaar.jsx`, `src/scene/LakshmiCorner.jsx` | Original work for this project |
| Residents, shopkeepers, watchman | Procedural instanced rig in `src/scene/Residents.jsx` | Original work for this project |
| Extra sounds: thunder, toy cap pop, siren whistle, gatling pops, crowd murmur, bazaar bed with bells | Synthesised in `src/audio/synth.js` and `src/audio/synthAmbient.js` | Original work for this project |
| Collision, A* pathfinding, safety placement, burst patterns, cracker registry | `src/world/*.js`, `src/crackers/patterns.js`, `src/crackers/registry.js` | Original work for this project |

No Pixabay or Mixamo content is used, as the project rules require.

| Item | Source | Licence |
|---|---|---|
| ASYNK logo (`public/assets/logomain.png`) | Supplied by the user (their company brand) | Owned by ASYNK; used with the user's permission |

## Fonts (loaded from Google Fonts, not bundled)

| Font | Source | Licence |
|---|---|---|
| Fredoka | https://fonts.google.com/specimen/Fredoka | SIL Open Font License 1.1 |
| Nunito | https://fonts.google.com/specimen/Nunito | SIL Open Font License 1.1 |
| Baloo 2 (Devanagari) | https://fonts.google.com/specimen/Baloo+2 | SIL Open Font License 1.1 |

The fonts are loaded at runtime from Google Fonts, not redistributed. If they fail to load, the CSS falls back to system fonts (`Nirmala UI` / `Mangal` for Hindi).

## npm packages

Versions are as installed. Licences were read from each package's `package.json`.

| Package | Version | Licence | Source |
|---|---|---|---|
| react, react-dom | 19.3.1 | MIT | https://github.com/facebook/react |
| three | 0.187.0 | MIT | https://github.com/mrdoob/three.js |
| @react-three/fiber | 9.8.2 | MIT | https://github.com/pmndrs/react-three-fiber |
| @react-three/drei | 10.7.9 | MIT | https://github.com/pmndrs/drei |
| @react-three/postprocessing | 3.2.2 | MIT | https://github.com/pmndrs/react-postprocessing |
| postprocessing (dependency of @react-three/postprocessing; only its `ToneMappingMode` enum is imported) | 6.39.6 | Zlib | https://github.com/pmndrs/postprocessing |
| zustand | 5.0.16 | MIT | https://github.com/pmndrs/zustand |
| framer-motion | 14.9.1 | MIT | https://github.com/motiondivision/motion |
| howler | 2.2.4 | MIT | https://github.com/goldfire/howler.js |
| tailwindcss, @tailwindcss/vite | 4.3.4 | MIT | https://github.com/tailwindlabs/tailwindcss |
| vite | 8.3.6 | MIT | https://github.com/vitejs/vite |
| @vitejs/plugin-react | 6.2.1 | MIT | https://github.com/vitejs/vite-plugin-react |

`lucide-react` (ISC) was tried briefly and then removed, so that every dependency we chose ourselves is MIT.

## Development tools (not shipped in the app)

| Tool | Source | Licence | Notes |
|---|---|---|---|
| img2threejs skill | https://github.com/img2threejs/img2threejs (commit 0c0c49b) | Apache-2.0 (licence kept in `.claude/skills/img2threejs/LICENSE`) | Installed project-locally at `.claude/skills/img2threejs`. The user explicitly approved Apache-2.0 for this tool. Nothing from it is bundled into the web app. |

## Design guidance

The UI direction came from the local **ui-ux-pro-max** Claude Code skill, which recommended the Fredoka/Nunito pairing, SVG icons rather than emoji, 44 px touch targets, visible focus rings and reduced-motion support. The skill was used as guidance only. None of its files are shipped.
