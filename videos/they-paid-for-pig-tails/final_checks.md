# Final checks: "They Paid $40 a Pig Tail and Got More Pigs" (master prompt v30, delivered Nov 26)

## DELIVERY GATE
| Gate item | Result |
|---|---|
| Hard cuts (kit) | **4** (limit 4): 2.2 s the hillside flash-forward, 26.6 s "But wait", 34.2 s the WANTED poster, 38.3 s dusk at the gate. The kit lists exactly these four. |
| Camera row: moving | **66.8%** (limit 72; Rick 53.9-71.9) PASS |
| Camera row: fast-move p90 | **13.7 px/frame** (limit 25) PASS (the kit calls it a little timid next to Rick's 14.3-25.4) |
| Camera row: shot changes | **4.41 per 10 s** (limit 6.1; Rick 4.03-6.14) PASS |
| Camera row: calm p90 | **3.50 s** (target 3.5; Rick 3.48-5.62) PASS; 6 calm stretches of 3 s+ (Rick 4-7) |
| Camera row: opening | **3.73 px/frame** in the first 3 s (Rick 3.7-7.8) PASS |
| SAY-SEE FAILs | **0** (2 PARTIAL, below) |
| Muted twist | **PASS** (41-47 s: the gate opens on a hillside full of hogs, then a lone boar next to a sow leading eight piglets) |
| voice_cuts.py (voice stem) | **0 cut/gap hits**; word diffs are spellings only ("forty" -> 40, "fifty" -> 50, "pig tail" -> pigtail, "every one" -> everyone) plus small.en hearing "nails" as "mails" (medium.en hears "nails") |
| Sharpness (kit sharpness.py) | **0.728** median (target 0.64; Rick on YouTube 0.68) |
| Loudness | **-14.3 LUFS** integrated, peak -1.3 dBFS, LRA 2.5 |
| Mute test (signature) | the brass Loophole Key on its red string is on screen at the gate unlock (40.5 s, the trick); the lock-click unlock sting is the one stinger (40.3 s) |

## What changed in this last pass (my decisions)
1. **The three issues from your message.** The voice is the v3 take re-trimmed from the raw recording (word edges from the audio energy, so no endings are clipped): voice_cuts reads 0. The first 4.5 s: the curly tail fills the frame as it's slapped on the counter and two twenties slide back, then a cut to the hillside full of pigs for about 1.9 s, then a whip pan back to the shed for "You see,". Title and pinned comment are in title_description_tags.md.
2. **The kit's first measure of the finished render found 7 hard cuts, not 4.** Three were false: the camera that leads the pickup jumped where the road bends (the truck's heading changed in one frame), the 8-frame whip onto the ranger, and his talking mouth in a face that filled the whole frame. Fixed: the pickup now turns smoothly through the bend, the whip is 12 frames and the close-up is a little wider.
3. **Calm stretches.** The tails-wall glide (3 s at about 24 px/frame) counted as three shot changes, and the move round the shed with a pan after it counted as four. Now the tails wall is a calm hold with one quick move onto the newspaper, the move round the shed is a single 15-frame whip, and the ranger walks into the framing (he's on screen 0.7 s after his name). The hillside reveal glide is slower, so it's no longer a shot change. 3 renders of 3-4 chunks each.
4. Light pass on the joined video as before (a curves lift plus saturation x1.88). The file is 303 MB at crf 18 (the grass and pine detail needs the bitrate; YouTube re-encodes it anyway).

## PASS/FAIL
| Check | Result | Number |
|---|---|---|
| Format | PASS | 1080x1920, 30 fps, 65.77 s, h264 + AAC 48 kHz; the mp4 has the same name as the mp3 |
| Brightness / saturation / near-black | PASS | 120 / 0.44 / 0% |
| Blurry frames | PASS | 0.0% |
| Voice | PASS | 4.61 syllables/s, 10.5 words per sentence, 13% short sentences |
| Captions | LOW (not a gate row) | 2.46 changes/s (Rick 2.55-2.79) |

## Kit rows not OK (not gate rows)
| Row | Ours | Rick | Why |
|---|---|---|---|
| Moves mostly push/pull | 79.3% | 63.9-75.9 | many slow push-ins on holds |
| Camera roll p95 | 0.86 deg | 0.31-0.67 | kit artefact: the camera never rolls (up is fixed); it reads roll in fast moves |
| Fast-move p90 | 13.7 (LOW) | 14.3-25.4 | the fast moves are now short whips the kit can't track (n/a), so the tracked moves are mostly slower |
| Background detail | 21.8 | 14.2-19.8 | photo grass, pine needles and forest floor at full resolution |
| Caption changes | 2.46/s | 2.55-2.79 | a few 3-word groups |
| Length | 65.8 s | 46.1-64.4 | the re-voiced take is 1.4 s longer |

## SAY-SEE (measured on the final render)
All rows from the last check still PASS, with these changes:
| Line | On screen | Result |
|---|---|---|
| a thousand tails cover it (14.4-15.6 s) | a calm hold on the board full of tails | PASS |
| The paper calls it the smartest deal in the county (16.0-18.2 s) | the newspaper taped up beside him, headline readable from "smartest" | PASS |
| Only the old ranger isn't impressed (18.4-19.9 s) | the whip round the shed on "ranger", he walks into frame at 19.6 s | PARTIAL: 0.7 s after his name |
| He just says, "Count the little ones." (25.0-26.4 s) | his close-up beside the chalk tallies, lip-synced | PASS |
| The best hunter only shoots giant boars (30.6-32.6 s) | the pickup with the hunter at the wheel, turning smoothly through the bend | PASS |
| why are the woods getting louder? | the dark woods, hogs rising out of the brush | PARTIAL (as before: the shaking bushes are small) |
