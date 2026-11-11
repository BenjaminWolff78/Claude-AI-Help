# Character rig: Joe redesign (master prompt v13, boards AV / AV2)

Every character in a Loophole Lou short is drawn with this rig. Joe (the Roulette remake's hero) is the reference: a
new character changes the hat, hair, costume and colours, and keeps every head, face, limb and proportion value below.

## Files
| file | what it is |
|---|---|
| `rig/fig.ts`, `rig/toon.ts` | the redesigned rig (figure(), faces, eyes, mouths, hats, hair, body); drop-in for a video's `src/videos/<name>/` |
| `rig/props68.ts`, `rig/critters68.ts` | unchanged dependencies of fig.ts, included so the folder builds on its own |
| `rig.patch` | the whole change as one unified diff against the Plimsoll video's rig (`videos/owners-sank-their-own-ships-so-he-painted-a-line/project/src/videos/ice/{fig,toon}.ts` on this branch) |
| `joe.ts` | Joe's `Look` and his model-sheet poses |
| `joe_model_sheet.jpg`, `joe_heads.jpg` | the reviewed renders: the target every rebuild must match |
| `tools/sheet.mjs` + `tools/joe_sheet.json` | offline sheet renderer (esbuild + @napi-rs/canvas, no Remotion or browser) |
| `tools/apply_redesign.py`, `tools/fix_open_issues.py` | the exact edit history (each edit asserts a unique match), for provenance |

Checksums: rig/fig.ts `7cbf7985d0b16f6e...`, rig/toon.ts `d18aa5767fbe7265...` (sha256 prefixes). Base it patches:
fig.ts `e81166d6b05959eb...`, toon.ts `61f50da09d206ce3...`.

## Use in a new video
1. Start the project as the skill's Step 0 says, then copy `rig/fig.ts` and `rig/toon.ts` over `src/videos/<name>/fig.ts` and `toon.ts`
   (or `patch -p1 < rig.patch` inside that folder when it still holds the Plimsoll rig; any other base: copy instead).
2. Build every character from `JOE` in `joe.ts`: keep `seed`-driven head shape, change hat / hair / costume / colours.
3. Check: `cd tools && npm i && cd .. && node tools/sheet.mjs rig tools/joe_sheet.json` must reproduce `joe_model_sheet.jpg`
   pixel for pixel; render each new character's sheet the same way (front, both 3/4s, back, walk, the faces it uses).

## The spec (W = head width, u = W/100, HH = head height; measured off Rick's frames)
**Head:** flat bright white (about 245-252), a bean about 1.06 wide : 1 tall with slight asymmetry and tilt; plum outline #241726 about 5% W, thicker on the shadow side.

**Eyes** (solid black, no highlights): half-lid `lid` = a flat-topped bowl 15.2u wide x 8.2u deep under a lid bar 16.8u wide and 4.6u thick (overhang about 1u a side), raised 1.5u; `slit` = the same bowl 4.6u deep; `dot` = 8.8u x 12.4u; `small` = 6.8u x 10u. Eye centres +-14u from the face centre (gap 28% W; Rick 26-31%), +-13u for shock / huge.

**Brows:** always visible, 15u above the eye line, one tapered stroke from 8u inside to 9u outside the eye centre, 5.4u thick tapering to 2.6u; inner / outer heights come from each face's `brow` pair. Shock: an arc 9u x 3u, 6u higher. A cap never hides them.

**Mouths** (one brush stroke, fat in the middle, pointed ends; `brushArc` in toon.ts; centre 20u below the eye line): dash about 13u wide, 3.8u thick, almost flat; smirk 7.5u x 4.6u arc, 15-150 deg, 4.6u thick, one-sided (skew 0.5, fuller at the raised corner), shifted 1.5u; smile 8.5u x 5u, 20-160 deg, 4.6u; smileWide 11.5u x 6.5u, 15-165 deg, 5u; frown 7.5u x 4.5u, 200-340 deg, 4.4u. Gritted grid teeth only for anger, strain or a fake smile.

**3/4 turn (fixed in v13):** per unit of `facing` the eyes slide 28u and the mouth 24u toward the facing side, the eye gap narrows by 30%; the slide stops growing past |facing| 0.75 (`turnK`). At facing 0.7: far eye about +8u, near eye about +31u from the head centre, so both sit in the near half (Rick's 3/4 deadpan). Blush, beard, chops, monocle and a bob's face window slide with it; tuft hair shows only on the far side, 1.55x bigger.

**Flat cap:** band at 20% of the head height below the crown (both brows show); the dome is the skull x1.1 wide, its crown puffs out (x1 + 0.2 sin) and up (x1.75) and leans 0.08 W toward the facing side; 5 panel seams from a top button (radius 0.035 W), a darker band 0.056 HH tall (shade 0.72), a highlight streak, a dark crescent peak 0.36 W x 0.075 HH set 0.13 W toward the face (shade 0.6).

**Hair under a cap (`tufts`):** a shaded crescent 0.12 W x 0.18 HH hugging the skull edge just under the band, with two strand lines; front-on both sides, in 3/4 only the far side, 1.55x bigger. Never ear-like tufts.

**Back view (fixed in v13):** hair from the cap band (from the crown for hatless characters or other hats, which are drawn over it; bald or hairless keep a low fringe) down to the jaw on both sides; only a neck column about 0.38 W wide stays white, with a softly rounded top hairline, running into the collar of the top garment (shade 0.8, with a seam) drawn over the bottom of the head. Never a full-width white crescent (it reads as a grin).

**Body (BUILDS: torso / legs in HH, torso width in W):** adult 1.05 / 1.18 / 0.82 (about 3.3 HH tall); stout 1.1 / 1.1 / 0.94; kid 0.82 / 0.85 / 0.74; tall 1.12 / 1.28 / 0.78; thin 1.08 / 1.24 / 0.66; lanky 1.2 / 1.38 / 0.62; plump 1.08 / 1.02 / 1.06.

**Limbs:** thin ink strokes 5.6u (0.056 W). Hips +-10u (20% W apart), standing feet at +-13u, knees 1.2u outward, so the legs are nearly parallel. Feet: small ovals 6.8u thick, 2u behind to 6.5u ahead (front-on) or 9u (turned). Resting arms: elbow 0.38 HH and hand 0.74 HH below the shoulder (hand at about 3/4 of the torso height), 5-6u outside the torso; ball hands radius 4.8u (9.6% W).

**Walk (fixed in v13):** knees bend toward the facing side (outward only front-on; blended by |facing| x 1.6), never backwards; the lifted foot rises up to 0.28 HH and its knee comes forward 1.5u + 0.45 x the lift.

**Joe's costume:** grey flat cap #7b8793, ginger hair #c4682c (tufts), rust coat #a8502c with a leather yoke #6a4a2c, mustard waistcoat #dfb34a with dark buttons #6b4320, green neckerchief #1c8e5a.
