# skull_previz3.mp4 vs Rick's 27 story Shorts

Frames measured: 1972

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 0.7 | 4.55 - 12.35 | 8.9 | OK (harmless side) |  |
| Camera drifting slowly (% of frames) | 9.1 | 22.9 - 33.7 | 25.8 | LOW | Add slow 0.3-2 px/frame drifts and push-ins between bigger moves. |
| Camera clearly moving (% of frames) | 90.3 | 53.85 - 71.9 | 64.0 | HIGH | Camera too busy: calm some moves into drifts. |
| Median camera speed (px/frame @720) | 3.29 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 17.94 | 14.29 - 25.36 | 19.96 | OK |  |
| Camera moves per 10 s (count) | 6.1 | 5.6 - 7.5 | 6.9 | OK |  |
| Typical move length (s) | 0.77 | 0.4 - 0.65 | 0.52 | HIGH | Moves too long: make moves shorter and punchier. |
| Ease-in to peak speed (frames) | 5 | 4.0 - 7.0 | 5.0 | OK |  |
| Moves that are mostly push-in/pull-out (%) | 84.7 | 63.9 - 75.9 | 69.4 | HIGH | Use more sideways glides and tracking. |
| Camera roll per frame (p95) (deg) | 1.089 | 0.31 - 0.67 | 0.39 | HIGH | Too much roll: Rick's camera barely rolls. |
| Longest still holds (p90) (s) | 0.13 | 0.25 - 0.54 | 0.38 | OK (harmless side) |  |
| Camera speed in the first 3 s (px/frame) | 1.08 | 3.68 - 7.83 | 6.04 | LOW (outside all 27) | Opening is too static: move the camera from frame 1. |
| Hard cuts (per min) | 12.78 | 0.92 - 4.98 | 1.94 | HIGH | Too many hard cuts: use motivated transitions or camera moves. |
| Caption changes (per s) | 2.48 | 2.55 - 2.79 | 2.65 | LOW | Captions change too slowly: 1-3 words, swap on every word group. |
| Brightness (0-255) | 82.3 | 106.5 - 132.2 | 116.7 | LOW | Too dark overall. |
| Saturation (0-1) | 0.652 | 0.44 - 0.5 | 0.46 | HIGH (outside all 27) | Colours too saturated. |
| Near-black pixels (% (median)) | 8.0 | 0.0 - 1.0 | 1.0 | HIGH (outside all 27) | Too much pure black: lift shadows, thinner/fewer black areas. |
| Pure white pixels (%) | 1.02 | 0.95 - 3.32 | 2.06 | OK |  |
| Background detail (edge strength) | 17.3 | 14.2 - 19.8 | 17.5 | OK |  |
| Animation outside camera move (0-255 (median)) | 4.0 | 4.0 - 5.5 | 5.0 | OK |  |
| Length (s) | 65.7 | 46.1 - 64.35 | 59.5 | HIGH | Longer than most of Rick's Shorts. |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 5.33 | 4.03 - 6.14 | 5.04 | OK |  |
| Longest calm stretches (p90 time between shot changes) (s) | 3.67 | 3.48 - 5.62 | 4.53 | OK |  |
| Calm stretches of 3 s or more (count) | 5 | 4.0 - 7.0 | 5.0 | OK |  |
| Voice speed (syllables per s) | 4.24 | 4.6 - 4.89 | 4.74 | LOW (outside all 27) | Voice too slow. |
| Sentence length (words per sentence) | 11.4 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 15.8 | 7.1 - 27.8 | 11.0 | OK |  |
