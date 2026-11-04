# Build brief: "Why He Put a Bridge in the Desert" (London Bridge -> Lake Havasu, Arizona, 1968-71)

You build part of a 9:16 vertical cartoon short (three.js inside Remotion). The look: 2D white-bean-head characters
with plum outlines standing in an ink-outlined, painted 3D world (measured on a popular cartoon-shorts channel; we copy
the LOOK only, never its characters or shots). The pipeline already exists and works (it made the last three videos);
you add to it. Your workspace is your own copy of the app (given in your task). Work ONLY there.

## The story (62 s narration, for context)
"A man put a bridge in the desert, then dug a river under it. You see, he'd built a whole town in the Arizona desert,
and nobody wanted to live there. It was a hundred and ten degrees, and his salesmen were selling sand. So when his
agent said London was selling its bridge, he laughed. 'That's the craziest idea I've ever heard.' The bridge was
sinking into the river, one inch every eight years. Taking it apart would cost London one point two million dollars.
So he offered double, plus a thousand for every year of his age. Two point four six million dollars. For a used
bridge? Every stone got a number, which made it the world's heaviest jigsaw puzzle. They shipped it across the ocean,
through the Panama Canal, and trucked it into the desert. Then they built it again, stone by stone, on dry sand. But
who crosses a bridge to nowhere? Nobody. So he dug a mile-long ditch under it and flooded it with lake water. That's
the trick. He was never selling a bridge. He was selling the desert around it. Ever pulled off the highway to see a
giant dinosaur? Same thing. People drove in to see the bridge, and while they were there, they bought a lot. The town
grew from a few hundred people to ten thousand. Most towns build a bridge because they have a river. He got a river
because he had a bridge."

## Scenes (each = one place and time, filmed as ONE continuous camera path; the camera glides between characters who
## are already there and keep acting; no character ever pops in or vanishes)
1. 0-10.4 s DESERT TOWN, bright midday. Low angle on the boss beside the dry-sand arch of the rebuilt bridge while a
   bulldozer bites the sand under it; the camera rises over the bridge, flies across the empty street grid (stakes,
   chalk lines, FOR SALE signs on empty lots, a thermometer at 110), down to the sales office where one salesman pours
   sand out of his shoe and another tries to sell a jar of sand to nobody.
2. 10.4-15.5 s SALES OFFICE interior (the camera flies in through the open door): the agent bursts in waving a
   newspaper; the boss, feet up on the desk, laughs, head back, whole body shaking, then stares at the photo.
3. 15.5-28.4 s LONDON, evening fog (deep night blue, warm lamps): the old bridge over the river. Low by the water an
   inspector holds a tall ruler against a pier, the bridge sinks a notch; the camera cranes up the parapet to a deal
   table on the bridge: a bowler-hatted city official with a price board, the boss writes a giant cheque, a birthday
   cake gag for "a thousand for every year of his age", the official's monocle pops on "for a used bridge?".
4. 28.4-32.0 s LONDON, months later: workers paint numbers on stones, stacks of numbered stones, a worker holds a
   jigsaw box lid with the bridge on it, a crane swings a crate.
5. 32.0-35.8 s GIANT FLOOR MAP (scale gag): the boss, tiny, pushes a toy cargo ship across the painted ocean, through
   the canal lock gates, onto a toy truck that rolls into the painted desert.
6. 35.8-48.8 s DESERT bridge site: stones lowered by number onto the dry-land bridge, the boss checks them on a chart;
   a lizard crosses the finished bridge and steps off onto more sand ("bridge to nowhere?"); the camera drops under
   the arch with the bulldozer digging (same view as frame 1), water gushes in under the arches, the boss jumps back
   with wet shoes; then the camera rises to reveal empty lots all around ("He was selling the desert around it").
7. 48.8-54.8 s DESERT HIGHWAY + a lot in town, afternoon: a family station wagon pulls off at a giant roadside dinosaur
   (kids point), drives on past a "SEE THE BRIDGE!" billboard into town; the boss shakes the dad's hand at an empty
   lot, the FOR SALE sign flips to SOLD.
8. 54.8-62.1 s PAYOFF, the brightest light: the bridge over turquoise water, boats under the arches, crowds, the town
   grown, a painter on a ladder repaints the town sign "POP. 300" -> "POP. 10,000"; the camera glides to the boss at
   the parapet who holds the old London ruler against the arch (no sinking), held smile.

## Read first
- `src/videos/ice/sets/types.ts` (SetDef contract), `sets/index.ts` (registry), and finished sets as the quality bar:
  `sets/drugstore.ts` (interior), `sets/stadium.ts` + `sets/road.ts` (outdoor, dense, vehicles with ctl),
  `sets/street.ts`, `sets/hotel.ts`, `sets/calcutta.ts`, `sets/autocar.ts` (a reusable vehicle module with an API).
  Kits: `build.ts` (Batch, boxGeo, quad, lam, V), `paint.ts` (stoneHD, beamHD, planksHD, cobbleHD, ctex, rng),
  `setkit.ts` (glow, mist, shaft, lamp, flicker, sign, stencilTex, crate, barrel, sack, rod, waterPlane...),
  `sets/portkit_common.ts` (stringLights, torch, sparkles, puff, gullFlock, stall, fitText, boardTex, stripeTex...),
  `sets/innerkit_b.ts`, `sets/towerkit.ts`. `lights.ts` has the light presets (desert, desertLate, london, mapRoom,
  payoff are first drafts at the end of OVER; tune YOUR presets there).
- Style references (study the look; never copy characters or shots; NEVER upload or publish them anywhere):
  `/home/claude/ice/refs/` boards C, D, E, F, S (world detail level), V (character design), T, Y (show the title thing),
  Z1 (shot variety); `/home/claude/cas/references/frames/*.jpg` and `/home/claude/cas/references/sheets/`.
  Measured look numbers: `/home/claude/cas/references/reports/*.md` (characters.md, lighting.md, textures.md, outlines.md).
- Our last finished video's frames (the quality we reached): `/home/claude/marathon/out/05_final_stills.jpg`.

## Quality bar for every set (master prompt v10.6)
- At least 4 textured materials, at least 2 visible light sources (sun + practical lamps / glows / windows), at least
  10 props, real depth (foreground / mid / background layers and a far background), wear (scuffs, patches, dents).
- Clean vector-painted textures drawn on canvas in code (like the existing sets), soft gradients, never pixelated,
  nothing that looks AI-made. Invented names on signs (never real brands). Text must fit fully inside its sign.
- Hand-painted wood and stone (visible grain, dark gaps between joints). No pure black anywhere; darks are coloured.
- Ambient life is SMALL and slow: flags, heat shimmer, smoke, water ripples, a bird. Background extras are the cast
  builder's job and hold still unless cued; do not build jittery animated crowds into sets (static crowd cards for
  far stands are fine).
- Leave clear, collision-free floor space at the marks you define (characters are about 1.75 m tall bean people;
  a stout one is about 0.7 m wide). Marks are feet positions [x, y, z] in set-local metres.
- `cams`: at least 5 tested framings (9:16 portrait, fov 30-45) with characters at the marks: wide establishing,
  medium two-shot, low angle, high angle, over-the-shoulder.
- Story controls via `c` (Ctl) in pose(), documented at the top of the file.
- List the solid objects the camera must never enter as `export const <NAME>_SOLIDS: [V3, V3][]` (min/max corners,
  set-local). Keep wide camera lanes free where the shots travel (named in your task).
- Shared modules with a FIXED API (stubs exist so everybody can work in parallel; keep the API exactly):
  `sets/oldbridge.ts` (the granite bridge; built by the London builder) and `sets/salesoffice.ts` (the sales office,
  exterior + interior; built by the map/office builder). Read the stub headers.

## Rendering rules (2 cores, 8 GB; ONLY ONE renderer may run at a time on this machine, other agents share it)
- ALWAYS wrap renders in the global lock, from your workspace root:
  `flock /home/claude/rtmp/render.lock node scripts/preview.mjs out/t/spec.json`
  Never run a render without flock, never two at once, never `pkill -f` (use `pkill -x chrome` only to stop your own
  stuck render, and only when you hold the lock). Run renders in the foreground (they take 1-4 minutes).
- Preview spec: `[{ "out": "out/t/x.jpg", "scale": 0.5, "preview": { "set": "<name>", "light": "<preset>",
  "pos": [x,y,z], "look": [x,y,z], "fov": 38, "t": 2.0, "ctl": {...}, "cast": [{ "who": "boss", "mark": "<mark>",
  "o": { "expr": "smug", "facing": 1 } }] } }]`. Put 3-6 stills in one spec (they share one bundle).
  Read `src/videos/ice/Bridge.tsx` for the exact preview props (cast entries, pos override, fx). Until the cast builder
  delivers, use existing looks (e.g. "coach", "official", "farmer1") as stand-ins.
- `scripts/preview.mjs` caches the bundle in /home/claude/rtmp; delete your workspace's bundle marker if your code
  changes are not picked up (read the script).
- Run `npx tsc --noEmit -p .` before rendering (Bridge.tsx has a few known pre-existing errors; ignore those).
- Look at your stills with the Read tool, compare with the refs, fix what looks weak. Keep to about 6-10 render rounds.

## Deliverable
- Your files, registered where needed, plus any tuning to your own light presets (report the final values), and
  3-5 final stills in `out/t/final_*.jpg`.
- A short final report: files, marks (what each is for), cams, ctl controls, SOLIDS, light tweaks, known weak spots.
- Do not edit any file outside the ones your task names.
