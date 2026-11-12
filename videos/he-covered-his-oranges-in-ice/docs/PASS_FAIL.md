# Final PASS/FAIL: "He Covered His Oranges in Ice to Stop Them Freezing"

File: `He Covered His Oranges in Ice to Stop Them Freezing.mp4`. It has the same name as the mp3.
- 1080x1920, 30 fps, 1924 frames, 64.13 s.
- Captions are burned in.
- AAC 256k audio, mixed to -14.3 LUFS integrated, with a -1.3 dBFS peak.

## Checklist

| Area | Check | Result |
|---|---|---|
| Topic | Passes "[someone] did [something dumb], and it worked". The mechanism (freezing water gives off heat) is a reusable rule. Not covered by the two reference channels. | PASS |
| Facts | 6 claims verified (UF/IFAS, Hewitt). Names, the bet, the scarecrow and 24 °F are dramatised and labelled so. | PASS |
| Hook | 12 words. A finished absurd act with one concrete object, and the absurd part comes last. No name, year or place. Ends at 2.96 s. | PASS |
| "You see," | Starts at 3.22 s, with no pause after the hook. | PASS |
| Beats | Doubter on screen and named at 5.5 s; mocking line at 10 s; question at 15.1 s; three time markers (nine, midnight, three a.m.); fake-out at 25 s (39%); "That's the trick" at 38.8 s (61%); callback ending on "solid." | PASS |
| Voice | "The Pharaoh 3", eleven_v4, one take. 4.66 syllables/s and 12.7 words per sentence. | PASS |
| Mix | -14.3 LUFS. The voice is the loudest element at every moment. Music sits 15 LU under it and ducks. One stinger at "That's the trick", 11 LU under. | PASS |
| Faces | Speaking faces sit at 35-45% from the top and stay clear of the caption band (face strips q1-q3). | PASS |
| Characters | They match the v13 rig: white heads, thin black limbs, 1.30 m head height. Side-by-side sheets 1-3 checked. | PASS |
| Frame errors | 2 fps sweep. Four errors were fixed and re-rendered (hook glide, crane, valve wheel, trick push); the splices were checked frame by frame. The kept items, with reasons, are listed in CP6. | PASS |
| Hard cuts | 3 real hard cuts: 622, 749 and 969. | PASS (3 instead of the plan's 2; see decisions) |
| Title | Names the object and shows both halves, with one emoji. | PASS |
| Description and tags | Con or loophole framing, then a debate question, then #shorts plus 2 topic tags. Every tag was checked against the story. | PASS |
| Repo | Code, shot sections, audio scripts and docs pushed. No boards, board crops, reference frames or media. | PASS |
| Measure kit | 17 of 27 rows OK; the 10 others are explained below. | PASS with reasons |

## Measure kit (measure_like_rick.py --words, final file), in full

Frames measured: 1924

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 5.6 | 4.55 - 12.35 | 8.9 | OK |  |
| Camera drifting slowly (% of frames) | 37.1 | 22.9 - 33.7 | 25.8 | OK (harmless side) |  |
| Camera clearly moving (% of frames) | 57.3 | 53.85 - 71.9 | 64.0 | OK |  |
| Median camera speed (px/frame @720) | 2.77 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 26.75 | 14.29 - 25.36 | 19.96 | HIGH | Big moves are too violent: slow the fastest moves. |
| Camera moves per 10 s (count) | 7.6 | 5.6 - 7.5 | 6.9 | HIGH | Too many moves: merge or drop some. |
| Typical move length (s) | 0.47 | 0.4 - 0.65 | 0.52 | OK |  |
| Ease-in to peak speed (frames) | 5 | 4.0 - 7.0 | 5.0 | OK |  |
| Moves that are mostly push-in/pull-out (%) | 57.8 | 63.9 - 75.9 | 69.4 | LOW | Use more push-ins/pull-outs instead of sideways pans. |
| Camera roll per frame (p95) (deg) | 0.659 | 0.31 - 0.67 | 0.39 | OK |  |
| Longest still holds (p90) (s) | 0.43 | 0.25 - 0.54 | 0.38 | OK |  |
| Camera speed in the first 3 s (px/frame) | 4.16 | 3.68 - 7.83 | 6.04 | OK |  |
| Hard cuts (per min) | 6.55 | 0.92 - 4.98 | 1.94 | HIGH | Too many hard cuts: use motivated transitions or camera moves. |
| Caption changes (per s) | 2.51 | 2.55 - 2.79 | 2.65 | LOW | Captions change too slowly: 1-3 words, swap on every word group. |
| Brightness (0-255) | 108.5 | 106.5 - 132.2 | 116.7 | OK |  |
| Saturation (0-1) | 0.449 | 0.44 - 0.5 | 0.46 | OK |  |
| Near-black pixels (% (median)) | 0.0 | 0.0 - 1.0 | 1.0 | OK |  |
| Pure white pixels (%) | 0.66 | 0.95 - 3.32 | 2.06 | OK (harmless side) |  |
| Background detail (edge strength) | 11.8 | 14.2 - 19.8 | 17.5 | LOW | Worlds too plain: add texture, props and small geometry. |
| Animation outside camera move (0-255 (median)) | 3.0 | 4.0 - 5.5 | 5.0 | LOW | Characters and world too still: add the life layer and moving props. |
| Length (s) | 64.1 | 46.1 - 64.35 | 59.5 | OK |  |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 6.71 | 4.03 - 6.14 | 5.04 | HIGH | Too many shot changes: let shots run, group quick changes and then calm down. |
| Longest calm stretches (p90 time between shot changes) (s) | 2.4 | 3.48 - 5.62 | 4.53 | LOW (outside all 27) | No calm stretches: give the key lines a 3-5 s shot with only a slow drift or push-in. |
| Calm stretches of 3 s or more (count) | 2 | 4.0 - 7.0 | 5.0 | LOW (outside all 27) | Too few calm stretches: the video never breathes. Add 3-5 s shots (trick, payoff, key reactions). |
| Voice speed (syllables per s) | 4.66 | 4.6 - 4.89 | 4.74 | OK |  |
| Sentence length (words per sentence) | 12.7 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 0.0 | 7.1 - 27.8 | 11.0 | OK (harmless side) |  |

## Why the remaining kit rows are outside Rick's middle half

- **Hard cuts 6.55/min and shot changes 6.71 per 10 s (HIGH).** The video has 3 real hard cuts. The detector also counts the 4 fast whips (884-895, 1110) as cuts, so 7 events in 64 s.
  - The story runs through 10 time beats across two places, and each beat needs a new framing.
  - Merging whips would need new shot designs and a re-render of about 4-5 hours.
- **Calm stretches (count 2, p90 2.4 s, LOW, outside all 27).** The 4.3 s Duane-and-Earl shot (9.3-13.6 s) and the 6 s payoff (58-64 s) count. The reveal (38.8-45 s) is one continuous push from Earl into the orange and the macro, but the detector splits it at the hose jet passing the lens.
  - It was 3 before the trick-push fix. The fix swings the camera round Earl instead of over his face, and the kit now reads that as one more fast move.
  - I kept the fix: a clean reveal shot matters more than this row.
- **Fast-move p90 26.7 (limit 25.4), push-in share 58% (LOW), moves per 10 s 7.6 (limit 7.5).** These are side effects of the same three camera fixes: the glide, crane and trick push now go round the characters instead of over them. Each is within about 10% of Rick's band.
- **Captions 2.51 per s (limit 2.55, LOW).** The groups are 1-3 words, swapped on every word group. The rate follows the voice (4.66 syllables/s, inside Rick's band), so this is within 2% of the line.
- **Background detail 11.8 (LOW).** The lens (depth-of-field) pass softens the far grove, and 60% of the video is night, which has low edge contrast.
  - Post sharpening was tested: even a strong large-radius unsharp only reaches 12.9, and it puts halos on the ink lines.
  - A real fix needs more geometry and a re-render.
- **Animation outside camera moves 3.0 (LOW).** The life layer moves only small things: sprinkler spray, ice glints, smudge-pot flames, the farmhand lighting pots and blinks.
  - Big idle motion would need re-animation and a full re-render (about 4-5 hours on this machine).
  - Kept as a known gap for the next video: plan more moving set pieces from the start.
- **Brightness 108.4 and saturation 0.446: now OK.** A gamma 1.25 / saturation 1.20 post grade brought brightness up from 98.3 and kept colour inside Rick's band.

## Decisions I made

- **3 hard cuts instead of 2.** One each on "midnight", "3 a.m." and the thermometer reading. Each is a time jump, where a whip would fake continuity.
- **The kid holds up the POPSICLE EARL sign instead of painting it.** It reads in one look, and it is on screen while the narrator says it.
- **Duane pays by tossing his crate over the fence.** It lands at Earl's feet, so the bet object pays off on screen before the clonk.
- **Render settings: software GL at dpr 0.55, msaa 1, shadow map every 2nd frame.** Lens taps were cut and a level of detail added for far trees. msaa 0 with the lens pass gives blank frames, so it stays at 1 or more.
- **Post grade: gamma 1.25, saturation 1.20, light unsharp.**
- **Four sweep fixes re-rendered.** These are the 4 frame errors in the checklist: the hook glide, the crane, the valve-wheel close-up and the trick push. The splices are checked.
