# plague_final.mp4 vs Rick's 27 story Shorts

Frames measured: 1965

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 3.5 | 4.55 - 12.35 | 8.9 | OK (harmless side) |  |
| Camera drifting slowly (% of frames) | 31.3 | 22.9 - 33.7 | 25.8 | OK |  |
| Camera clearly moving (% of frames) | 65.2 | 53.85 - 71.9 | 64.0 | OK |  |
| Median camera speed (px/frame @720) | 2.78 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 10.43 | 14.29 - 25.36 | 19.96 | LOW | Big moves are too timid: make key moves faster. |
| Camera moves per 10 s (count) | 4.3 | 5.6 - 7.5 | 6.9 | LOW | Too few distinct moves: add a new move per sentence. |
| Typical move length (s) | 0.55 | 0.4 - 0.65 | 0.52 | OK |  |
| Ease-in to peak speed (frames) | 5 | 4.0 - 7.0 | 5.0 | OK |  |
| Moves that are mostly push-in/pull-out (%) | 82.0 | 63.9 - 75.9 | 69.4 | HIGH | Use more sideways glides and tracking. |
| Camera roll per frame (p95) (deg) | 0.361 | 0.31 - 0.67 | 0.39 | OK |  |
| Longest still holds (p90) (s) | 0.83 | 0.25 - 0.54 | 0.38 | HIGH | Still holds last too long: keep something moving. |
| Camera speed in the first 3 s (px/frame) | 8.02 | 3.68 - 7.83 | 6.04 | HIGH | Opening camera too frantic. |
| Hard cuts (per min) | 4.58 | 0.92 - 4.98 | 1.94 | OK |  |
| Caption changes (per s) | 2.58 | 2.55 - 2.79 | 2.65 | OK |  |
| Brightness (0-255) | 109.3 | 106.5 - 132.2 | 116.7 | OK |  |
| Saturation (0-1) | 0.527 | 0.44 - 0.5 | 0.46 | HIGH | Colours too saturated. |
| Near-black pixels (% (median)) | 1 | 0.0 - 1.0 | 1.0 | OK |  |
| Pure white pixels (%) | 1.07 | 0.95 - 3.32 | 2.06 | OK |  |
| Background detail (edge strength) | 12.7 | 14.2 - 19.8 | 17.5 | LOW | Worlds too plain: add texture, props and small geometry. |
| Animation outside camera move (0-255 (median)) | 2.0 | 4.0 - 5.5 | 5.0 | LOW | Characters and world too still: add the life layer and moving props. |
| Length (s) | 65.5 | 46.1 - 64.35 | 59.5 | HIGH | Longer than most of Rick's Shorts. |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 4.12 | 4.03 - 6.14 | 5.04 | OK |  |
| Longest calm stretches (p90 time between shot changes) (s) | 5.04 | 3.48 - 5.62 | 4.53 | OK |  |
| Calm stretches of 3 s or more (count) | 8 | 4.0 - 7.0 | 5.0 | HIGH | Too many long calm shots. |
| Voice speed (syllables per s) | 4.81 | 4.6 - 4.89 | 4.74 | OK |  |
| Sentence length (words per sentence) | 11.8 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 0.0 | 7.1 - 27.8 | 11.0 | OK (harmless side) |  |
