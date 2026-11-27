0 FAIL

# Checkpoint 3: look-dev (step 5): They Banned Beer, So He Sold It as Bread Syrup

Images that go with this file: checkpoint3_stills.jpg (13 graded stills at the planned shot framings) and checkpoint3_cast.jpg (model sheet + prop sheets).

## Gates

| Gate | Result |
|---|---|
| still_check on 13 graded stills (S2, S5, S7, S8, S9, S10, S12, S16, S18, S22, S26, S28, S31) | 0 FAIL: detail 13.2 (Rick median 13.8), flat 28.7 %, brightness 116, dark 8.6 %, white 4.7 %, saturation 0.38 |
| plan_check after the S23/S31 change | 0 FAIL, 0 WARN |
| Style lock vs AX1, AX2, CA1, CB1 | all rows PASS after round 2 (table below) |

Single stills outside a range (the gate judges the median; these get fixed at the framing in step 6):
- S2 and S5 are bright: the cream wall sign fills a lot of the frame. Its paint is now toned down (#d6bf8c).
- S16 (the aerial) has a lot of sky.
- S18 (night porch) was dark at the old framing. The new over-the-shoulder framing is in the sheet.

## Grades: fitted per light with kit/grade_fit.py on grade-off stills

| Light | Grade | Raw (grade off) | After the grade |
|---|---|---|---|
| brew (brewery) | brewG (fitted) | brightness 64-79, white 0-0.9 % | 111-122, white 2.6-4.2 %, head 239-252 |
| groc (grocery) | grocG (fitted) | 75-90, dark 28-39 % | 120-129, dark 2.2-4.4 %, head 240-242 |
| stDay (Main Street, day) | stDayG (hand-set) | 123-182 | gentle S-curve. The fit crushed the shade side (0.07 at 0.1), so I set a milder curve |
| stNight (Main Street, night) | stNightG (fitted) | 45-71, dark 61-78 % | 78-102, dark 26 % |
| cellar | cellarG (fitted) | 54-57, dark 44-53 % | 95-104, dark 5-17 % |

## Style lock (one row each, AX1/AX2/CA1/CB1 at the same head size)

| Row | Round 1 | Round 2 |
|---|---|---|
| AX1 1, head/ink/face (white bean, plum ink, half-lid eyes, brows, smirk) | PASS | PASS |
| AX1 2, expressions (shock circles, laugh arcs, worry, smug) | PASS | PASS |
| AX1 3, hats and hair (flat cap, fedora, bowler, cloche, straw hat, grey bun, red bob) | PASS | PASS |
| AX2 4, bodies (bean torso, 3.5 heads tall, 2-4 costume details, gradient) | PASS | PASS |
| AX2 5, women, kids, elders (granny: glasses, bun, dress to the shins; kid: shorter body) | PASS | PASS |
| AX2 6 / CB1, held props | FAIL: padlock too small, crate carried one-handed at the hip, wife's raised rolling pin hidden behind her hair | PASS: padlock 1.9x with a chain loop, can 1.4x, crate carried in front with both hands (`carry2` + both arms front), pin drawn in front |
| AX2 7, views (3/4 both ways, back, walk) | PASS | PASS |
| CA1 1, drawn cast, lit and textured | PASS | PASS |

Cast (7 roles, P10 limit 8):
- brewer: flat cap, mustard coat, green apron, red scarf.
- agent: fedora, navy suit.
- office agents (2): bowler, and flat cap with glasses.
- grocer: striped shirt, cream apron.
- granny: lilac, grey bun, glasses.
- wife: teal, red bob, yellow apron.
- townsfolk extras: cloche woman, straw-hat man, kid.

New drawn props: syrupCan, padlock (with chain), rollingPin, pie, capper (the other props were already in the rig).

## Sets (one world, four places)

- **Brewery:**
  - copper kettle, a canning line with moving cans
  - the wall sign: HOLLOW CREEK BREWING CO. / BEER struck out in red / BAKING SYRUP
  - the barrel tip over the drain, with gush and foam
  - hop sacks, crates, the can pyramid
  - enamel pendant lamps
  - a chalkboard reading TODAY: SYRUP
- **Grocery:**
  - tin ceiling, counter, register
  - the syrup wall (fills on cue) under its MALT SYRUP ~ FOR BAKING sign
  - flour sacks with a cobweb
  - the count board (3, 30)
  - the yeast tower on a hand truck
  - the pancake demo: mix box, bowl, jug, can
  - the wink poster
- **Main Street (day and night):**
  - the agents' office: gold lettering on the window, a RAIDS THIS WEEK: 0 board, a wanted poster, evidence barrels, a shelf of seized jugs
  - five houses with porches and cellar windows that pop foam in a chain
  - the truck with BAKER chalked on its door
  - the church with steeple, cross and the giant loaf beside it
  - shops, street lamps
  - the bulkhead doors with the brass key on its red string
- **Cellars (granny's and the agent's):**
  - stone walls, bottle racks whose caps blow in a chain
  - stoneware crocks with a blue 5 (gallon mark)
  - a chalk 45 on the beam
  - a bulb, steps

## Fixed during look-dev

- The brewery wall sign rendered blank: it sat inside its own backing board. It is moved out and lowered under the pipe run.
- Glow sprites floated with no lamp: the caged lamp model didn't read. It is replaced by modelled enamel pendants with lit bulbs.
- Wall gauges overlapped the lowered sign. They are moved aside.
- The office window shot was bare plaster: it is dressed, and the middle mullion that cut through the lead agent is removed.
- The giant loaf's score marks stuck out as white tubes. They now lie flat on the crust; a cross was added to the steeple. The aerial is framed from the west (steeple, church, loaf, a house in front).
- Preview stills defaulted to heavy background blur (cInf 10), which caused the edge FAIL in round 1. Stills now use the blur the video will use: 0 on wides, 2-3 on close shots.

## Decided

- S23 and S31 come in on a 6-frame dissolve instead of a camera move "through" the street or the cellar doors. A through-move would cross two light presets in one move. plan_check re-run: 0 FAIL.
- S26 (the pancake comparison) is framed at the left end of the counter, where the demo sits.

## Next

Step 6: build the 31 shots in story.ts/shots.ts → dump → previz_guard, rule_audit → previz contact sheet → checkpoint 4.
