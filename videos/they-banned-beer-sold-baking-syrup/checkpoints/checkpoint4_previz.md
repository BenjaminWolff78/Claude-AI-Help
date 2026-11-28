# Checkpoint 4: previz — "They Banned Beer, So He Sold It as Bread Syrup"

**0 FAIL** on every previz gate (previz_guard, rule_audit, plan_check).
Open items, all WARN or kit rows (details below):
- G6 caption band: 49 frames, all under 0.6 s (6.1, 7.5, 10.0, 24.9-25.5, 29.7, 60.8-61.2 s).
- G6b: over-the-shoulder edges.
- plan P3: the S21 cut is not on a punch.
- Kit rows still outside Rick's range on the draft: animation outside the camera move (3.0, Rick 4-5.5), calm p90 5.69 s (5.62), and 6 detected hard cuts (4 real ones plus 2 false detections at 34.6 and 37.7 s).

## 1. previz_guard (frames.jsonl, 1986 frames, every frame)

| Row | Value | Verdict | Where |
|---|---|---|---|
| G0 names | 0 problems | PASS | |
| G1 camera speed | 0 frames over 40 px/frame | PASS | |
| G1j speed jumps | 0 | PASS | |
| G2 blur snaps | 0 | PASS | |
| G3 pops / teleports | 0 | PASS | |
| G3b pose snaps | 0 seam, 0 inside | PASS | |
| G3c props pop | 0 | PASS | |
| G3d feet | 0 | PASS | |
| G4 lens clearance | 0 | PASS | |
| G5 faces covered | 0 | PASS | |
| G6 framing | 0 sliced; 49 frames in the caption band | WARN | 6.10-6.37, 7.47-7.50, 10.00-10.13, 24.93-25.53, 29.73, 60.80-61.23 s |
| G6b half-cut at the edge | 353 frames | WARN | over-the-shoulder foregrounds (grocer 28.5 s, agent 35.4-37.9 s, townsfolk 58-60.6 s) |
| G7 | 0 | PASS | |
| G8 say-see | 0 of 25 lines short | PASS | |
| G9 seats | 0 | PASS | |
| G10 hands reach | 0 short, 0 off-plane | PASS | |
| G11 nothing through anything | 0 | PASS | |
| G12 quotes in close-up | 0 of 2 | PASS | |

## 2. rule_audit

| Check | Ours | Verdict |
|---|---|---|
| A. A readable face on screen | 96% of frames; the only no-face stretch of 2 s+ is the aerial, 30.4-32.7 s | PASS |
| B. No empty frames | 0 | PASS |
| C. Hook: the act with the hero, and the danger | act + hero at 0.3 s; the crossed-out BEER sign at 0.0 s | PASS |
| D. Payoff: the story object big | bottles at 25%+ of the width for 2.8 s, peak 163% | PASS |
| E. Leads in different colours | brewer vs agent: 82 deg of hue apart | PASS |
| F. Quoted line at 12.3 s (agent) | head 42% of the width | PASS |
| F. Quoted line at 14.8 s (brewer) | head 44% of the width | PASS |

**plan_check:** 0 FAIL, 1 WARN (P3: the S21 cut is not on a punch; it is the whip to the next house's pop).

## 3. The previz kit table

From `measure_like_rick.py previz3_0.mp4 --words`, at 270x480 with no DOF or bloom. Rows that count on the draft are in bold.

| Row | Ours | Rick (middle half) | Verdict |
|---|---|---|---|
| **Camera clearly moving** | 60.3% | 53.9-71.9 | OK |
| **Fast moves (p90)** | 14.6 px/f | 14.3-25.4 | OK |
| **Opening camera, first 3 s** | 4.29 px/f | 3.68-7.83 | OK (was 1.32) |
| **Shot changes per 10 s** | 4.38 | 4.03-6.14 | OK (was 3.78) |
| **Longest calm stretches (p90)** | 5.69 s | 3.48-5.62 | HIGH by 0.07 s (two punch-ins strengthened since; re-measured on the final) |
| **Calm stretches of 3 s+** | 8 | v34: 3+ | OK |
| **Hard cuts** | 6 detected | at most 4 | 4 real cuts (S7, S14, S20, S21); see the note below |
| **Captions changing** | 2.64/s | 2.55-2.79 | OK (was 2.48) |
| **Animation outside the camera move** | 3.0 | 4.0-5.5 | LOW; re-measured on the full-size final (the 270 px draft loses small life-layer motion) |
| Voice | 4.50 syl/s | v34: 4.45-5.0 | OK |
| Saturation / brightness / detail | 0.41 / 112 / 15.2 | look rows | not counted on the draft |

**The two extra detected cuts are false detections:**
- **34.6 s:** the door swings open on the lit kitchen. The camera keeps moving and there is no cut. The swing is now slower (1033-1058) so the light fades in.
- **37.7 s:** a caption swap over a flat yellow wall where the detector finds too few tiles to track. The picture does not change (frames 1128-1131 are the same image).

## 4. Fixed in this round

From the guard, the kit and the one contact-sheet look:
- **Faces covered:**
  - S15: the brewer stood behind the agent, and the agent walked across him. The brewer now waits beside the doorway and the agent steps to the other side.
  - S19: the agent backed through the line between the lens and the granny. He now tips his hat first and only backs down once the camera has pulled off the porch. The camera ends low on the street at az 192.
  - S31: the agent's head was over the wife. Both moved off the lens line.
- **Pose switch at 34.4 s:** S17 drew the agent's face while the camera was behind him, then S18 showed his back. He is now drawn from behind in both shots.
- **S12:** the queue stood by the door, outside every 9:16 framing, so the wife never appeared before the payoff. The queue now lines up at the syrup wall with the wife at its head, under the grocer on his stool.
- **S13:** the dolly ends close on the FLOUR sacks.
- **S22:** the old crane out to 26 m made the agent 3% wide (an empty frame by rule B). It is now a short push and pan down the street, with the agent 6-8% wide.
- **S30:** a street lamp stood between the lens and the cellar doors. The lamp is removed and the framing tightened; he walks into the frame.
- **S31:** the payoff foam shot up through the ceiling, out of frame. It now sprays at the lens over the wife (65 s).
- **Opening:** S1 starts already panning and pushing in, with the brewer sliding from 67% to 26% of the width.
- **Punch-ins on key words:** "wall", the first knock, "burps", the foam, "wink", "opens", and the final hit.
- **Captions:** a small word said slowly now gets its own caption.
- **Render hygiene:**
  - Concurrency 2 gave white frames at the dissolves (shader VALIDATE_STATUS), so every render now uses one tab.
  - Blank-frame scan: 0 bad.

## 5. Say-see, line by line

From `checkpoint4_contact_1-3.jpg`: 1 frame per second, with the words under each frame.

| # | Time (s) | Line | On screen | Verdict |
|---|---|---|---|---|
| 1 | 0.0-5.0 | They banned beer, so a brewer sold syrup for baking bread... | the brewer labelling cans under BEER crossed out / BAKING SYRUP | yes |
| 2 | 5.4-7.4 | You see, the law says nobody can sell beer, | two agents tip a barrel, foam | yes |
| 3 | 7.5-8.9 | but it says nothing about syrup. | the brewer capping cans | yes |
| 4 | 9.1-12.1 | When the agent comes to padlock the brewery... | the agent strides in with the padlock | yes |
| 5 | 12.3-14.5 | "Syrup? With hops in it?..." | the agent in close-up, sniffing the can | yes |
| 6 | 14.8-15.5 | "It's for baking." | the brewer in close-up, deadpan | yes |
| 7 | 15.6-16.9 | The whole station laughs, | the office through the window, three agents | yes (small) |
| 8 | 17.2-19.3 | ...the whole town calls him the baker. | the street, the brewer, BAKER chalked on the truck | yes |
| 9 | 19.4-23.0 | ...sells 3 cans. The next week, 30. | the count board 3 and then 30, customers | yes |
| 10 | 23.4-27.3 | ...a whole wall, and the flour... | the wall, the grocer on his stool, the queue, then the FLOUR sacks | yes (fixed) |
| 11 | 27.5-28.5 | So where's all the bread? | the agent at the empty BREAD shelf | yes |
| 12 | 28.5-30.3 | Then the brewery sells yeast too, | the brewer and the YEAST tower | yes |
| 13 | 30.4-32.4 | ...a loaf the size of the church. | aerial: the loaf beside the steeple | yes |
| 14 | 32.7-36.1 | So the agent knocks on doors, and a granny answers... | the knocks, then the door, the granny with flour and a rolling pin | yes |
| 15 | 36.3-37.3 | She really is baking. | the pie | yes |
| 16 | 37.6-39.3 | He says sorry, backs down the steps, | the hat tip, then the steps | yes |
| 17 | 39.5-40.8 | and her cellar goes pop. | the cellar window glows, then bursts | yes |
| 18 | 41.0-42.9 | Then the next house pops. Then the whole street. | pops down the street | yes (the pops are small in the wide) |
| 19 | 43.3-46.6 | That syrup is malt extract... | the cellar cutaway: the pour, the PURE MALT EXTRACT label | yes (the granny is small, left) |
| 20 | 47.0-50.7 | Add water and yeast... burps... | the crock close-up: the yeast cake, the burp | yes |
| 21 | 51.0-53.3 | It's like pancake mix... | the grocer, the pancake bowl, the can | yes |
| 22 | 53.5-58.0 | One can makes 45 bottles... caps off. | the bottle shelves, the capper, the caps blowing | yes (the granny is small, left) |
| 23 | 58.0-61.0 | ...grocers sold it with a wink. | the grocer winks | yes |
| 24 | 61.3-63.1 | So the agent heads home, opens his cellar, | his porch, then the cellar doors | yes |
| 25 | 63.4-65.2 | and finds his wife down there, baking. | over his shoulder: the wife, then the foam burst | yes |

**Action strips** (`checkpoint4_strips.jpg`, every 2nd frame):
- **Expression:** the brewer's deadpan shrug (S7).
- **Gesture:** the agent's hat tip (S19).
- **Hand-off:** the can passed to the agent (S5).

**Still weak (list for the final review):**
- The cellar cutaway (S23) and the capping shots (S27, S28) keep the granny small at the left.
- The pops at 41-43 s are small in the wide street.
- The aerial reads pale in the draft (no full light).

## 6. Next
- **Step 7, sound:** an original 120 BPM rag, ambience beds, 26 effects, the stinger at "pop" (40.46 s) and the final hit at 64.90 s. The two quoted lines are pitched into character voices. Then the mix and mix_check.
- **Step 8:** the render in chunks.
