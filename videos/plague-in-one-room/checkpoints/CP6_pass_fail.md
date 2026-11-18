# CP6: "They Put a Plague in One Room and It Took a Whole City" (65.5 s, 1080x1920, 30 fps)

## Delivery
- **Files:** `They Put a Plague in One Room and It Took a Whole City.mp4` and `.mp3`, named the same.
- **Title:** They Put a Plague in One Room and It Took a Whole City. It scored 98 on vidIQ, the top of 5. It's 12 words and 54 characters, with no emoji, and it doesn't start with "This".
- **Description and tags:** in `description.md`. Every tag was checked against the story.
- **Code:** pushed to `BenjaminWolff78/Claude-AI-Help`, branch `corrupted-blood-plague`. No media is in the repo.
- **Original visuals only:** no game logos, characters, map or interface. The game look comes from invented health bars, a curse sigil, level tags and a pet stone.

## Check budget used
| Check | Used |
|---|---|
| Style lock | 2 of 3 rounds |
| Side-by-side vs BA | 1 of 1 |
| Kit | Measure 1 (previz 1), re-measures 2 of 2 (previz 2 and the final) |
| 1 fps sweep | 1 of 1 (on the final) |
| Scripted checks | Every frame, on previz 1, 2 and 3 |

The full record is in `checks.json`.

## PASS / FAIL
| Rule | Result |
|---|---|
| Length 62-66 s (never over 67) | PASS (65.5 s) |
| Voice 4.6-4.9 syllables per second | PASS (4.81) |
| Sentence flow: 10-14 words per sentence, few fragments | PASS (11.8 words, 0% fragments) |
| Hook under 3.5 s, "You see," by 6 s | PASS (hook ends at 3.4 s; "You see," at 3.7 s) |
| Loudness -14.3 LUFS, voice loudest, music about 15 LU under | PASS (-14.3) |
| Brightness 106-132 | PASS (109.3) |
| White under 3.3% | PASS (1.07%) |
| No blue interiors | PASS. The boss room is red-lit, the study is warm and the office is neutral grey (RGB about 132/136/146). Blue appears only on the knights' tunics and the banners. |
| Every line has one physical object | PASS (table in CP1/CP2; scripted picture checks) |
| No pose switches; props stay in the hand; hand-offs are reach, grip, carry, release | PASS (15 fps side-by-side vs BA) |
| Nothing slides; nothing hangs in the air; round things are round | PASS (walk cycles on every move; loaves and orbs use 24+ segments) |
| Nothing passes through anything | PASS (runners, the queue and the strollers were rerouted after the previz checks) |
| Text cards fit their text | PASS (auto-fit tags and title cards) |
| Characters readable, faces never hidden | PASS after the sweep fix. The 1 fps sweep found the two office workers standing one behind the other at 53-56 s, which hid one face for about 3 s. While checking that fix I also found one walking through the other at 53 s. I moved them apart, routed the walk in front, moved the paper to the open side, and re-rendered those chunks. |
| No broken frames | PASS. One re-rendered chunk came back with 11 frames missing the world (a render glitch). I re-rendered it and checked every frame's brightness. |
| Camera moving / drifting / still | PASS (65.2% / 31.3% / 3.5%) |
| Camera median speed, ease-in, move length, roll | PASS (2.78 / 5 f / 0.55 s / 0.36°) |
| Hard cuts per min, shot changes per 10 s, longest calm stretches | PASS (4.58 / 4.12 / 5.04 s) |
| Caption changes per second | PASS (2.58) |
| Fast-move p90 | OPEN: 10.4 vs Rick's 14-25. The big glides are gentler than his. |
| Camera moves per 10 s | OPEN: 4.3 vs 5.6-7.5 |
| Push-in share | OPEN: 82% vs 64-76%. More sideways glides are needed. |
| Longest still holds (p90) | OPEN: 0.83 s vs 0.25-0.54 s |
| Opening camera speed (first 3 s) | OPEN: 8.0 vs 3.7-7.8, slightly fast |
| Saturation | OPEN: 0.53 vs 0.44-0.50. The red boss room and the game colours push it up. |
| Background detail | OPEN: 12.7 vs 14.2-19.8 |
| Animation outside the camera | OPEN: 2.0 vs 4.0-5.5 |
| Calm stretches of 3 s or more | OPEN: 8 vs 4-7 |

The open rows are within the check budget's limits: the kit re-measures are used up, so these go to the next video as fixes rather than another round on this one.
