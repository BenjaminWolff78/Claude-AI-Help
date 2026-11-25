# They Paid for Pig Tails and Got a Pig Farm.mp4 vs Rick's 27 story Shorts

Frames measured: 1916

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 0.9 | 4.55 - 12.35 | 8.9 | OK (harmless side) |  |
| Camera drifting slowly (% of frames) | 16.3 | 22.9 - 33.7 | 25.8 | LOW | Add slow 0.3-2 px/frame drifts and push-ins between bigger moves. |
| Camera clearly moving (% of frames) | 82.8 | 53.85 - 71.9 | 64.0 | HIGH | Camera too busy: calm some moves into drifts. |
| Median camera speed (px/frame @720) | 2.58 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 29.62 | 14.29 - 25.36 | 19.96 | HIGH | Big moves are too violent: slow the fastest moves. |
| Camera moves per 10 s (count) | 6.3 | 5.6 - 7.5 | 6.9 | OK |  |
| Typical move length (s) | 0.53 | 0.4 - 0.65 | 0.52 | OK |  |
| Ease-in to peak speed (frames) | 4 | 4.0 - 7.0 | 5.0 | OK |  |
| Moves that are mostly push-in/pull-out (%) | 78.3 | 63.9 - 75.9 | 69.4 | HIGH | Use more sideways glides and tracking. |
| Camera roll per frame (p95) (deg) | 1.243 | 0.31 - 0.67 | 0.39 | HIGH | Too much roll: Rick's camera barely rolls. |
| Longest still holds (p90) (s) | 0 | 0.25 - 0.54 | 0.38 | OK (harmless side) |  |
| Camera speed in the first 3 s (px/frame) | 8.4 | 3.68 - 7.83 | 6.04 | HIGH | Opening camera too frantic. |
| Hard cuts (per min) | 3.76 | 0.92 - 4.98 | 1.94 | OK |  |
| Caption changes (per s) | 2.57 | 2.55 - 2.79 | 2.65 | OK |  |
| Brightness (0-255) | 117.6 | 106.5 - 132.2 | 116.7 | OK |  |
| Saturation (0-1) | 0.451 | 0.44 - 0.5 | 0.46 | OK |  |
| Near-black pixels (% (median)) | 0.0 | 0.0 - 1.0 | 1.0 | OK |  |
| Pure white pixels (%) | 0.22 | 0.95 - 3.32 | 2.06 | OK (harmless side) |  |
| Background detail (edge strength) | 21.8 | 14.2 - 19.8 | 17.5 | HIGH | Picture too busy/noisy. |
| Animation outside camera move (0-255 (median)) | 4.0 | 4.0 - 5.5 | 5.0 | OK |  |
| Blurry frames (detail under 6.5, Rick's 5th percentile) (% of frames) | 0.0 | 0.2 - 5.6 | 2.6 | OK (harmless side) |  |
| Length (s) | 63.9 | 46.1 - 64.35 | 59.5 | OK |  |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 6.74 | 4.03 - 6.14 | 5.04 | HIGH | Too many shot changes: let shots run, group quick changes and then calm down. |
| Longest calm stretches (p90 time between shot changes) (s) | 2.63 | 3.48 - 5.62 | 4.53 | LOW | No calm stretches: give the key lines a 3-5 s shot with only a slow drift or push-in. |
| Calm stretches of 3 s or more (count) | 4 | 4.0 - 7.0 | 5.0 | OK |  |
| Voice speed (syllables per s) | 4.82 | 4.6 - 4.89 | 4.74 | OK |  |
| Sentence length (words per sentence) | 10.7 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 13.0 | 7.1 - 27.8 | 11.0 | OK |  |

## WHERE (times in s)

- Hard cuts (4): 24.1, 25.5, 32.9, 38.0
- Shot changes (43): 1.8, 2.6, 3.3, 4.9, 6.5, 7.0, 9.4, 13.0, 15.4, 16.0, 18.0, 18.5, 19.0, 21.7, 22.3, 24.1, 25.5, 27.7, 28.2, 29.0, 29.6, 30.2, 31.4, 32.9, 36.0, 36.5, 38.0, 39.2, 40.3, 42.7, 43.2, 44.6, 49.4, 51.4, 51.9, 54.3, 54.9, 57.3, 57.8, 58.7, 59.3, 59.8, 60.4
- Calm stretches of 3 s or more (4): 9.4-13.0, 32.9-36.0, 44.6-49.4, 60.4-63.8
- Blurry stretches of 0.2 s or more (0): none

The detector misses some cuts that land on a similar picture; check the frames around each listed time.
