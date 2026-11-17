# final.mp4 vs Rick's 27 story Shorts

Frames measured: 1896

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 4.3 | 4.55 - 12.35 | 8.9 | OK (harmless side) |  |
| Camera drifting slowly (% of frames) | 15.6 | 22.9 - 33.7 | 25.8 | LOW | Add slow 0.3-2 px/frame drifts and push-ins between bigger moves. |
| Camera clearly moving (% of frames) | 80.1 | 53.85 - 71.9 | 64.0 | HIGH | Camera too busy: calm some moves into drifts. |
| Median camera speed (px/frame @720) | 3.63 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 38.14 | 14.29 - 25.36 | 19.96 | HIGH (outside all 27) | Big moves are too violent: slow the fastest moves. |
| Camera moves per 10 s (count) | 9.0 | 5.6 - 7.5 | 6.9 | HIGH | Too many moves: merge or drop some. |
| Typical move length (s) | 0.6 | 0.4 - 0.65 | 0.52 | OK |  |
| Ease-in to peak speed (frames) | 9 | 4.0 - 7.0 | 5.0 | HIGH | Moves take too long to get going: reach peak in ~5 frames. |
| Moves that are mostly push-in/pull-out (%) | 80.3 | 63.9 - 75.9 | 69.4 | HIGH | Use more sideways glides and tracking. |
| Camera roll per frame (p95) (deg) | 1.984 | 0.31 - 0.67 | 0.39 | HIGH (outside all 27) | Too much roll: Rick's camera barely rolls. |
| Longest still holds (p90) (s) | 0.21 | 0.25 - 0.54 | 0.38 | OK (harmless side) |  |
| Camera speed in the first 3 s (px/frame) | 5.8 | 3.68 - 7.83 | 6.04 | OK |  |
| Hard cuts (per min) | 15.19 | 0.92 - 4.98 | 1.94 | HIGH | Too many hard cuts: use motivated transitions or camera moves. |
| Caption changes (per s) | 2.48 | 2.55 - 2.79 | 2.65 | LOW | Captions change too slowly: 1-3 words, swap on every word group. |
| Brightness (0-255) | 113.6 | 106.5 - 132.2 | 116.7 | OK |  |
| Saturation (0-1) | 0.504 | 0.44 - 0.5 | 0.46 | HIGH | Colours too saturated. |
| Near-black pixels (% (median)) | 3.0 | 0.0 - 1.0 | 1.0 | HIGH | Too much pure black: lift shadows, thinner/fewer black areas. |
| Pure white pixels (%) | 2.15 | 0.95 - 3.32 | 2.06 | OK |  |
| Background detail (edge strength) | 10.2 | 14.2 - 19.8 | 17.5 | LOW | Worlds too plain: add texture, props and small geometry. |
| Animation outside camera move (0-255 (median)) | 3.0 | 4.0 - 5.5 | 5.0 | LOW | Characters and world too still: add the life layer and moving props. |
| Length (s) | 63.2 | 46.1 - 64.35 | 59.5 | OK |  |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 8.23 | 4.03 - 6.14 | 5.04 | HIGH (outside all 27) | Too many shot changes: let shots run, group quick changes and then calm down. |
| Longest calm stretches (p90 time between shot changes) (s) | 2.67 | 3.48 - 5.62 | 4.53 | LOW | No calm stretches: give the key lines a 3-5 s shot with only a slow drift or push-in. |
| Calm stretches of 3 s or more (count) | 4 | 4.0 - 7.0 | 5.0 | OK |  |
| Voice speed (syllables per s) | 4.74 | 4.6 - 4.89 | 4.74 | OK |  |
| Sentence length (words per sentence) | 12.3 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 10.5 | 7.1 - 27.8 | 11.0 | OK |  |
