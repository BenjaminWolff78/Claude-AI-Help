# CP5: previz and the 12 scene-graph checks ("The Skull That Was Worth More in Pieces")

Three full previz passes at 270x480 (every frame, from the QA log of the scene graph), then a fourth look pass on full-pipeline stills.

## Scene-graph checks: previz 1 → previz 3
| Check | Previz 1 | Previz 3 | What changed |
|---|---|---|---|
| 1 Name: a named person is on screen at their name | 0 hits | 0 hits | The glides were retimed so Joko, Agus and Ralph are framed on their names |
| 2 Landing: the subject is framed when a move ends | 14 | 11 (5 are object inserts by design) | Rick-size framings and the heads raised above the caption band |
| 3 Lens: rays to the subject's head blocked | 243 | 177 | The sign no longer sits between the lens and Joko. Ralph stands left of the lamp. What is left: the shards Ralph holds up to his own eye (by design), and the crane over the roof beams |
| 4 Whip: an obstacle in the centre of a fast move | 76 | 52 | Glides were rerouted (over the queue, round Joko) |
| 5 Shot edge: brightness jumps | 4 | 0 | |
| 6 Framing: head on head, off the edge, in the captions | 1323 | 925 | Most of what is left are crowd overlaps (the line, the night three-shot) that read fine on the sheets, and off-screen pairs that the check counts anyway |
| 7 Picture: the line's object is visible on its word | 6 | 3 → fixed after previz 3 | The tin box was widened, the shed camera re-aimed and the lane camera lowered |
| 8 Blank frames | 34 (the back of the sign at night) | 0 | |
| 9 Action: no 1.5 s without change | 0 | 0 | |
| 10 Screen time | 35 | 37 | Mostly short segments between glides; no character flashes on for under 1 s |
| 11 Props: the camera inside a closed box | 0 | 0 | |
| 12 Animation: pose pops / foot slides | 240 | 87 | The kneeling tug no longer slides. The rest are the hammer blows, which are strikes by design |
| Hard cuts | 4 (300, 760, 1063, 1264) | 4 | min gap 201 f |
| Pierce (cards through things) | 5 | 6 → fixed | Agus moved off the clay bank face, and the shed villagers were separated |

## Kit on previz 3, and the fixes made before the final render
| Row | Previz 3 | Rick | Fix |
|---|---|---|---|
| Camera speed in the first 3 s | 1.08 (outside all 27) | 3.7-7.8 | An opening swoop: the camera comes in from up-left and lands on Agus by 1.8 s, with the hammer already up on frame 0 |
| Hard cuts per min | 12.8 | 0.9-5.0 | The kit read the strike shakes, a 4-frame glide and the papaya swap as cuts. Kicks were halved, the strike punches softened, every glide is now 12+ frames, and the papaya blends instead of swapping. Real cuts: 4 (3.7/min) |
| Clearly moving / drifting | 90% / 9% | 54-72% / 23-34% | The camera creep was cut from x2.6 to x1.7 |
| Saturation | 0.65 (outside all 27) | 0.44-0.50 | Grade saturation cut (mids 1.7-1.9 → 1.1-1.2) and the world saturation lowered. The look stills measure 0.48-0.58 |
| Brightness | 82 | 107-132 | Ambient light +0.18 and brighter mids. Night: moon 0.35 → 0.9, ambient 0.85. The shed now has a lamp. Look stills: station 110-118, night 90-93 |
| Near-black | 8% (outside all 27) | ≤1% | Lifted shadows, a brighter night, a lit shed and a brighter puzzle lid |
| Voice speed | 4.24 syl/s | 4.6-4.9 | Not fixable without a new voice (reported in CP2) |
| Length | 65.7 s | 46-64 | All six v24 escalation beats are kept (v24 rule 6: don't cut the middle escalation) |

Previz sheets (our frames only) are in previz3/.
