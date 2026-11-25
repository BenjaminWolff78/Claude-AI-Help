# Final checks: "They Paid for Pig Tails and Got a Pig Farm"

## DELIVERY GATE (v28 section 15)
| Gate item | Result |
|---|---|
| Sharpness (kit sharpness.py, median of 10 frames) | **0.714** on the delivered file (target 0.64; first render chunk 0.692) |
| Hard cuts | **4** (limit 4): 24.1 s the ranger's close-up, 25.5 s "But wait", 32.9 s the WANTED poster, 38.0 s dusk at the gate. The kit lists exactly these four. |
| Kit rows not OK | **9**, all camera pacing plus picture detail (table below). None is a broken frame. |
| SAY-SEE FAILs | **0** (3 PARTIAL, listed below) |
| Muted twist | **PASS** (41-47 s: the gate opens on a hillside full of hogs, then a lone boar next to a sow leading eight piglets) |

Stayed-to-watch: the hook is "They paid hunters forty bucks a pig tail, and the woods filled up with more pigs than ever." Frame 1 shows the hunter slapping a tail on the counter while the shed guy peels off two twenties. There's no logo and no fade-in.

## What changed after the last checkpoint (my decisions)
1. **Pops at scene changes.** I rendered the frame pair on each side of all 14 glide scene changes. 13 of them popped: piglets, the shed guy, the poster boars and the near pigs vanished; the ranger flipped to his back; the gate snapped open; the herd lost its family-tree layout; the mowed weeds grew back; the counter jumped from 845 to 312. Every one now carries across (shared cast helpers, people walk instead of being re-placed, settings carry forward). I checked the pairs again and they're identical apart from the motion.
2. **Nothing pops in mid-shot.** The hook's piglets come up out of the undergrowth. The 420-pig herd stands up out of the grass instead of appearing. The second pig on the hill is there from the start. The lone boar and the sow's family walk in. The shed guy pockets the two twenties instead of losing them.
3. **The ride into the woods.** This was a one-frame jump at 28.9 s. Now the camera backs away ahead of the pickup as it comes at us, so you see the hunter at the wheel on "The best hunter". Then it circles the cab as the truck brakes, to find the boar.
4. **The kit's first measure found 10 hard cuts**, not 4. Two camera moves round the shed passed 1 m from the counter, a door, the PIGS SEEN board and the side wall. The selfie flash also whited out the sky. Both moves now travel through open ground, at least 3 m from every wall. On his name, the ranger walks round the side of the shed into the back, so he's on screen from "ranger" (18.4 s). The flash is now a small pop at the phone. On the second measure the kit counted exactly the 4 planned cuts.
5. **Render crash.** One 80-frame stretch of the tail-wall time-lapse ran out of memory at the same frame every time (the machine's 6 GB limit). I rendered it in two halves.
6. **Light pass** on the joined video (a curves lift plus saturation x1.88). Brightness went from 104 to 117.6, saturation from 0.31 to 0.451, and near-black pixels from 2.0% to 0%, all now in Rick's range. Sharpness after the pass is 0.714.
7. The file is 305 MB (crf 18). The grass and pine detail needs the bitrate, and YouTube re-encodes it anyway.

## PASS/FAIL
| Check | Result | Number |
|---|---|---|
| Format | PASS | 1080x1920, 30 fps, 63.87 s, h264 + AAC 48 kHz; the mp4 has the same name as the mp3 |
| Loudness | PASS | -14.3 LUFS integrated, true peak -1.3 dBFS, LRA 2.3 |
| Sharp picture | PASS | 0.714 (target 0.64; Rick on YouTube 0.68) |
| Brightness / saturation / near-black | PASS | 117.6 / 0.451 / 0.0% |
| Black, white, frozen frames | PASS | frame luma 52-191, no frame under 20 or over 235 |
| Blurry frames | PASS | 0.0% |
| Hard cuts | PASS | 4, never two within 1 s |
| Pops at scene changes | PASS | all 14 glide boundaries checked as frame pairs |
| Captions | PASS | 2.57 changes/s (2.55-2.79) |
| Voice | PASS | 4.82 syllables/s, 10.7 words per sentence, 13% short sentences |
| Calm stretches of 3 s+ | PASS | 4 (4-7) |
| Camera pacing | FAIL (not a hard fail) | see the kit rows below |

## Kit rows not OK (9)
| Row | Ours | Rick | Why |
|---|---|---|---|
| Camera drifting slowly | 16.3% | 22.9-33.7 | the story moves through 3 places with long travel moves |
| Camera clearly moving | 82.8% | 53.9-71.9 | same cause |
| Fast-move speed p90 | 29.6 px/f | 14.3-25.4 | the two moves round the shed (about 24 m in 2 s each) and the ride into the woods |
| Moves mostly push/pull | 78.3% | 63.9-75.9 | many slow push-ins on holds |
| Camera roll p95 | 1.24 deg | 0.31-0.67 | kit artefact: the camera never rolls (up is fixed); it reads roll in fast moves, same as the last three videos |
| Camera speed in the first 3 s | 8.4 px/f | 3.7-7.8 | the hook's pull-back from the counter to the woods edge |
| Background detail | 21.8 | 14.2-19.8 | photo grass, pine needles and forest floor at full resolution (this is also why the picture is sharp) |
| Shot changes per 10 s | 6.74 | 4.0-6.1 | the ride, the orbit and the whip pan at 36 s count as changes |
| Longest calm stretches p90 | 2.63 s | 3.5-5.6 | the ranger's walk now replaces the old calm hold at 17.8-21.7 s |

## SAY-SEE (8.12), measured on the final render
| Line (frames) | On screen | Result |
|---|---|---|
| They paid hunters forty bucks a pig tail (0-66) | the hunter slaps a tail on the counter, the shed guy peels off two twenties | PASS |
| the woods filled up with more pigs than ever (68-139) | sows and piglets come out of the trees past the PIGS SEEN board | PARTIAL: the pigs are small |
| wild hogs were wrecking every field (154-200) | five hogs rooting in torn-up corn, dirt flying | PASS |
| one tail, two twenties (212-280) | he puts up "1 TAIL = $40" and holds up two twenties | PASS |
| Hunters line up out the door (296-331) | the queue walks in from the lot and lines up | PASS |
| he nails every tail to the wall (331-386) | hammer strikes, tails appear on the white board | PASS |
| a thousand tails cover it (415-452) | the board fills with tails | PASS |
| The paper calls it the smartest deal in the county (463-532) | the headline, readable | PASS |
| Only the old ranger isn't impressed (535-583) | the ranger walks round the shed into the back | PASS |
| he's out back, counting something in chalk (587-642) | the ranger tallies marks on the back wall | PASS |
| The hunters laugh, "Grandpa's counting piglets!" (649-722) | the two hunters laughing, lip-synced | PASS |
| He just says, "Count the little ones." (724-766) | the ranger's close-up, lip-synced | PASS |
| why are the woods getting louder? (773-866) | the woods behind the shed, the two turning | PARTIAL: the shaking bushes are small |
| The best hunter only shoots giant boars (866-946) | the hunter driving toward us, a giant boar, the shot, it flops | PASS |
| because they get you in the paper (946-980) | the selfie with the boar, the flash at the phone | PASS |
| the boars have a wanted poster of him (986-1073) | three hogs at a pine with WANTED and his face | PASS |
| He drives right past the mothers with babies (1078-1135) | the pickup roars past, then the sow and her piglets | PASS |
| the shed guy unlocks the back gate (1141-1229) | the brass key on its red string, the padlock opens, the chain drops, the gate swings | PASS |
| A pig. Then another. Then the whole hillside starts to move. (1233-1327) | one pig lifts its head, another, then hundreds stand up out of the grass | PASS |
| they only shot the big boars, and boars don't have babies (1330-1416) | a lone tusked boar, then a sow with eight piglets | PASS |
| every one they skipped raised more piglets than ever (1421-1534) | high view: the herd in branching lines of piglets | PASS |
| like mowing the tallest weeds and leaving all the seeds (1538-1622) | the ranger's reel mower cuts the tall weeds, the dandelions stay | PARTIAL: the drifting seeds are faint |
| An army base really tried this, and the pigs went up (1628-1713) | the PIGS SEEN board flipping 312 -> 845 | PASS |
| Grandpa's chalk marks? They were a family tree. (1713-1787) | round the corner to the whole chalk family tree, the ranger taps the top | PASS |
| raises it to fifty bucks a tail (1792-1910) | he paints $50 over $40 | PASS |

**0 FAIL, 3 PARTIAL.**

## Devices (8.14)
The PIGS SEEN flip board is seen from the front with readable digits. The padlock and the brass key on its red string are shown beside his hand at the unlock (the lock-click sting at 39.8 s). The newspaper and the WANTED poster are shown face-on.
