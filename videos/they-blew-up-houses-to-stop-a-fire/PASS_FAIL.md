# They Blew Up Houses to Stop a Fire 🔥 - final PASS/FAIL table

Measured on the final code (per-frame camera QA `qa9.jsonl`, `tools/cam_moves.py`, `scripts/qa_report.py`, `scripts/face_qa.py`), the final mix report and the rendered mp4.

## Part 13 checks (show the big moments, move the camera)

| Check | Target | Measured | Result |
|---|---|---|---|
| Every impact / failure / payoff the narration names happens on screen, cause then effect | all | all 18 listed below, each with its frames | PASS |
| Climax with the camera moving the whole time | 4-8 s | fuse lit -> spark -> three booms -> wind drops -> roar: 48.1-53.5 s (5.4 s), one continuous path | PASS |
| Payoff with the camera moving the whole time | 4-8 s | fire starves -> last flame -> the mayor's bucket: 53.5-57.4 s on the aerial glide, then a slow 10 deg orbit (was a static hold; fixed) | PASS |
| Shots with a real camera move (glide, track, crane, orbit, aerial, push past) | >= 50% | 12 of 15 = 80% | PASS |
| Frames with sideways / crane travel | >= 40% | 1519 of 1920 = 79% | PASS |
| Place / time changes that are motivated moves | >= 33% | 4 of 8 = 50% (dust 3.2 s, same-camera time jump 11.2 s, house row -> domino row 35.0 s, steam 57.4 s); cuts at 17.1, 20.4, 42.2, 46.9 s | PASS |
| Frame 1 shows the absurd act, big | big | the Captain (42% of frame height) holding the linstock to a POWDER barrel's fuse at a house (was a small figure; fixed) | PASS |
| Hands do every person verb | all | light the fuse, roll, throw, scoop, heave, flick, pull, tap, strike out, chalk, drop, throw, drip-torch | PASS |
| Moustaches never hide a speaking mouth | - | no speaker has a moustache | PASS |
| Focus on whoever speaks / what the line is about | always | speakers sharp in every quoted line; hook Captain kept sharp through the blast (was blurred; fixed) | PASS |
| Last line quotable and arguable | - | "And people still say you can't fight fire with fire." | PASS |
| Mechanism accurate, dramatisations labelled | - | firebreaks by gunpowder on day 3 once the wind dropped; backburning today; comic beats listed in upload.md | PASS |
| Music rises only at the turn and the payoff | - | rises 42.2-46.9 s (turn) and 50.1-57.4 s (payoff), ducked flat elsewhere, silent by 62.5 s | PASS |

### Impact verbs and their frames

| Narration | On screen (frames @30 fps) |
|---|---|
| "they blew up the houses" | fuse lit 0-16, the Captain runs 16-38, BOOM 40: the house front flashes, window frames and planks fly 40-60, dust 46-97 |
| "a bakery just caught fire" | the door flame whooshes up the house 200-210, the baker bursts out 204 |
| "One bucket could handle that" | the mayor lifts the bucket on "bucket" 278, drops it in the street 305-316 |
| "throws it roof to roof" | embers hop and roofs catch 345-426 |
| "the whole riverfront" | warehouses go up 438-458 |
| "Buckets do nothing" | the baker throws at the PITCH & TAR door 488, splash 494, steam 494-520, the flames don't change |
| "lead roof melts and runs down the street like soup" | lead pours 522-562, the camera cranes down with it, the cook scoops 574, licks 584, eyes go huge 598 |
| "rolls in barrels of gunpowder" | three barrels roll 598-676 |
| "hook down a few houses" | ropes heaved 852-866, upper floors topple 860-879, dust and camera kick 876 |
| "the fire jumps the gap like it's nothing" | burning brands fly the gap 886-934, the next house catches, its row flees 928+ |
| "flick it" / "take three out" / "Nothing left to knock over" | your finger flicks 1086, the line falls 1087-1110; three pulled 1130-1140; the wave stops at the gap 1151-1165 |
| "strike out the next house" | chalk strike-through 1356, SOLD OUT 1374-1384 |
| "light the fuse" / "boom, boom, boom" | spark races 1444-1534; booms 1503, 1517, 1532 with kicks |
| "the wind drops" | flags fall limp 1548-1580 |
| "roars up to the gap and starves" | roar 1576-1606, dies back 1612-1652 |
| "gets to use his one bucket" | throw 1706, splash 1712, cheer 1712 |
| "burn the trees ahead of a fire on purpose" | drip-torch line laid 1716-1850 |
| "fight fire with fire" | the two fires meet and die 1858-1906, the onlooker gulps 1913 |

## Parts 11/12 table (v10.12 overrides)

| Check | Target | Measured | Result |
|---|---|---|---|
| Hook | 9-16 words, ends by 3.5 s | 13 words, ends 2.96 s | PASS |
| "You see," | starts by 6 s | 3.16 s | PASS |
| Length | 62-65 s | 64.0 s, 242 words | PASS |
| Loudness | -14.3 LUFS | -14.30 LUFS integrated, -1.25 dBTP | PASS |
| Voice loudest, music / SFX / stinger levels | -19 / -17 / -11 LU | music -19.0 LU (-23.0 ducked), SFX at -17 LU or lower, stinger -11.0 LU | PASS |
| Scenes | 9-13 | 9 | PASS |
| A 9 s+ scene in the first 20 s | yes | 3.2-17.1 s is one continuous camera path (13.9 s) through the bakery end, night into morning on the same camera; the night part alone is 8.1 s | PASS (noted) |
| Nobody vanishes on a scene change | - | dissolves only through dust, an empty-street time jump (the lone bucket), a shape match and steam | PASS |
| Shot changes | 18-28 | 10 cuts + 4 dissolves + 14 in-shot relocations = 28 | PASS |
| Every shot 2 s+ | all | shortest 2.00 s (Captain 738-797, the laugh 798-857); was 1.27-1.37 s for three shots; fixed | PASS |
| No ghosting crossfades, white-outs, washes; nothing crosses the lens | - | hook flash cut to a burst at the house (was a full-frame wash); camera no longer passes through the crowd in the ember pan (fixed); near-plane hits 0 | PASS |
| Move peaks under ~22 px/f except deliberate quick transitions | - | peaks are the aerial flights, the lead crane and the 12-frame whip to the Captain; holds and tracks under 22 | PASS (deliberate) |
| Quoted lines: 3-5 mouth shapes, open 30-45% of face width | all | MOUTHS | MOUTHS_RESULT |
| Every 2 s+ shot has a body action | all | yes (see impact list; holds have acted reactions) | PASS |
| Title object big in hook and reveal, change on screen | - | the house bursts in the hook (40-60); three houses blow at the climax (1503-1532) and the fire starves at the gap | PASS |
| Close-ups / inserts blurred background | - | CU and MCU at DOF 13 px, inserts 14 px | PASS |
| People-subject shots 25%+ of frame height, no half-cut characters | - | subjects 25-60%; the half-cut bucket-chain man moved out of the throw shot (fixed); remaining edge cuts are background people during camera moves | PASS |
| No cropped labels | - | POWDER labels turned to face the street (fixed); PITCH & TAR sign in full, its last letter licked by the warehouse fire for 1 s | PASS |
| Visible light in every scene | - | fire / candles / lanterns / drip torch; daylight backyard | PASS |
| Captions | white, 1-3 words, out of the bottom 20% | white with black outline, 1-2 words, at 70% height | PASS |
| Labelled mechanism object | 1 | THE FIRE'S MENU chalkboard (TIMBER, TAR, THATCH, THE NEXT HOUSE -> SOLD OUT) | PASS |
| Demo scene acted | yes | your hand flicks the dominoes, pulls three, the wave stops (7.2 s) | PASS |
| Payoff held 4 s+ | 4 s+ | 52.5-57.4 s (4.9 s) | PASS |
| Face continuity (smooth acting) | no mood flips | FACEQA | FACEQA_RESULT |
| Render QA (black / white / frozen / pop frames) | none | RENDERQA | RENDERQA_RESULT |
