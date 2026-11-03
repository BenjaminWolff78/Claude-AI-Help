# Build brief: "The Rat Poison Gold Medal" (St. Louis Olympic marathon, August 1904)

You build part of a 9:16 vertical cartoon short (three.js inside Remotion). The look: 2D white-bean-head characters
with plum outlines standing in an ink-outlined, painted 3D world (measured on a popular cartoon-shorts channel; we copy
the LOOK only, never its characters or shots). The pipeline already exists and works (it made the last two videos);
you add to it. Your workspace is your own copy of the app (given in your task). Work ONLY there.

## The story (59 s narration, for context)
"A runner won Olympic gold after his coach kept feeding him rat poison. You see, the 1904 marathon is 25 miles of dusty
road in 90-degree heat, and the organizer wants to study thirst. So there's just one well. Cars full of officials drive
ahead, kicking dust in every runner's face. 'Keep up, boys!' The dust is so thick the runners could chew it. One runner
breathes in so much he nearly dies. Another, a mailman from Cuba, gets hungry, eats rotten apples off a tree, and lies
down for a nap. A third gets chased a mile off course by a dog. So how does anyone win this? It's Thomas Hicks, who's
begging his coach for water. His coach says no and mixes him something else: raw egg, brandy, and a pinch of rat poison.
An official yells, 'You're poisoning him!' The coach shrugs. 'Just a pinch.' Then he gives him another one. That's the
trick. In 1904, a tiny dose of rat poison was an energy drink. Ever had so much coffee your hands started shaking? It's
that. But one pinch too many, and you're dead. So Hicks staggers on, seeing things, and his team carries him over the
finish line. He wins gold, eight pounds lighter. But he wasn't the first man across. The first guy took a car."

## Read first
- `src/videos/ice/sets/types.ts` (SetDef contract), `sets/index.ts` (registry), and finished sets as the quality bar:
  `sets/street.ts` + `sets/limo.ts` (outdoor, dense, a vehicle with ctl), `sets/calcutta.ts`, `sets/hotel.ts` and
  `sets/ministry.ts` (interiors). Kits you can reuse: `build.ts` (Batch, boxGeo, quad, lam, V), `paint.ts` (stoneHD,
  beamHD, planksHD, cobbleHD, ctex, rng), `setkit.ts` (glow, mist, shaft, lamp, flicker, sign, stencilTex, crate,
  barrel, sack, rod...), `sets/portkit_common.ts` (stringLights, torch, sparkles, puff, gullFlock, stall, fitText,
  boardTex, stripeTex...), `sets/innerkit_b.ts` (leafTex, birds, over, boardsV/H, paperTex, candle, flame, bars...),
  `sets/towerkit.ts`. `lights.ts` has the light presets (yours are named in your task; they are first drafts, tune them).
- Style references (study the look; never copy characters or shots; NEVER upload or publish them anywhere):
  `/home/claude/ice/refs/` boards C, D, E, F, S (world detail level), V (character design), T, Y (show the title thing),
  Z1 (shot variety); `/home/claude/cas/references/frames/*.jpg` and `/home/claude/cas/references/sheets/`.
  Measured look numbers: `/home/claude/cas/references/reports/*.md` (characters.md, lighting.md, textures.md, outlines.md).
- Our previous finished frames (the quality we reached): `/home/claude/eiffel/out/stills.jpg`.

## Quality bar for every set (master prompt v10.5)
- At least 4 textured materials, at least 2 visible light sources (sun + practical lamps / glows / windows), at least
  10 props, real depth (foreground / mid / background layers and a far background), wear (scuffs, patches, dents).
- Clean vector-painted textures drawn on canvas in code (like the existing sets), soft gradients, never pixelated,
  nothing that looks AI-made. Invented names on signs (never real brands). Text must fit fully inside its sign.
- Hand-painted wood and stone (visible grain, dark gaps between planks). No pure black anywhere; darks are coloured.
- Everything ambient moves a little in pose(t, c): flags, bunting, smoke, heat shimmer, birds, swaying leaves, etc.
- Leave clear, collision-free floor space at the marks you define (characters are about 1.75 m tall bean people;
  a stout one is about 0.7 m wide). Marks are feet positions [x, y, z] in set-local metres.
- `cams`: at least 5 tested framings (9:16 portrait, fov 30-45) with characters at the marks: wide establishing,
  medium two-shot, low angle, high angle, over-the-shoulder.
- Story controls via `c` (Ctl) in pose(), documented at the top of the file.
- List the solid objects the camera must never enter as `export const <NAME>_SOLIDS: [V3, V3][]` (min/max corners,
  set-local). Keep wide camera lanes free where the shots travel (named in your task).

## Rendering rules (2 cores, 8 GB; ONLY ONE renderer may run at a time on this machine, other agents share it)
- ALWAYS wrap renders in the global lock, from your workspace root:
  `flock /home/claude/rtmp/render.lock node scripts/preview.mjs out/t/spec.json`
  Never run a render without flock, never two at once, never `pkill -f` (use `pkill -x chrome` only to stop your own
  stuck render, and only when you hold the lock). Run renders in the foreground (they take 1-4 minutes).
- Preview spec: `[{ "out": "out/t/x.jpg", "scale": 0.5, "preview": { "set": "<name>", "light": "<preset>",
  "pos": [x,y,z], "look": [x,y,z], "fov": 38, "t": 2.0, "ctl": {...}, "cast": [{ "who": "lustig", "mark": "<mark>",
  "o": { "expr": "smug", "facing": 1 } }] } }]`. Put 3-6 stills in one spec (they share one bundle).
  Read `src/videos/ice/Bridge.tsx` for the exact preview props (cast entries, pos override, fx).
- Run `npx tsc --noEmit -p .` before rendering (Bridge.tsx has a few known pre-existing errors; ignore those).
- Look at your stills with the Read tool, compare with the refs, fix what looks weak. Keep to about 6-10 render rounds.

## Deliverable
- Your files, registered where needed, plus any tuning to your own light presets (report the final values), and
  3-5 final stills in `out/t/final_*.jpg`.
- A short final report: files, marks (what each is for), cams, ctl controls, SOLIDS, light tweaks, known weak spots.
- Do not edit any file outside the ones your task names.
