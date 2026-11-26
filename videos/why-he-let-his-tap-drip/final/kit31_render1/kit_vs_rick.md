# Why He Let His Tap Drip All Night in the Freeze.mp4 vs Rick's 27 story Shorts

Frames measured: 1980

| Metric | Ours | Rick typical (middle half) | Rick median | Verdict | Fix |
|---|---|---|---|---|---|
| Camera perfectly still (% of frames) | 3.0 | 4.55 - 12.35 | 8.9 | OK (harmless side) |  |
| Camera drifting slowly (% of frames) | 37.7 | 22.9 - 33.7 | 25.8 | OK (harmless side) |  |
| Camera clearly moving (% of frames) | 59.4 | 53.85 - 71.9 | 64.0 | OK |  |
| Median camera speed (px/frame @720) | 2.4 | 2.21 - 4.1 | 3.29 | OK |  |
| Fast-move speed (p90) (px/frame @720) | 15.31 | 14.29 - 25.36 | 19.96 | OK |  |
| Camera moves per 10 s (count) | 5.6 | 5.6 - 7.5 | 6.9 | OK |  |
| Typical move length (s) | 0.47 | 0.4 - 0.65 | 0.52 | OK |  |
| Ease-in to peak speed (frames) | 6 | 4.0 - 7.0 | 5.0 | OK |  |
| Moves that are mostly push-in/pull-out (%) | 72.7 | 63.9 - 75.9 | 69.4 | OK |  |
| Camera roll per frame (p95) (deg) | 0.5 | 0.31 - 0.67 | 0.39 | OK |  |
| Longest still holds (p90) (s) | 0.49 | 0.25 - 0.54 | 0.38 | OK |  |
| Camera speed in the first 3 s (px/frame) | 5.43 | 3.68 - 7.83 | 6.04 | OK |  |
| Hard cuts (per min) | 4.55 | 0.92 - 4.98 | 1.94 | OK |  |
| Caption changes (per s) | 2.61 | 2.55 - 2.79 | 2.65 | OK |  |
| Brightness (0-255) | 116.3 | 106.5 - 132.2 | 116.7 | OK |  |
| Saturation (0-1) | 0.483 | 0.44 - 0.5 | 0.46 | OK |  |
| Near-black pixels (% (median)) | 1.0 | 0.0 - 1.0 | 1.0 | OK |  |
| Pure white pixels (%) | 0.24 | 0.95 - 3.32 | 2.06 | OK (harmless side) |  |
| Background detail (edge strength) | 11.9 | 14.2 - 19.8 | 17.5 | LOW | Worlds too plain: add texture, props and small geometry. |
| Animation outside camera move (0-255 (median)) | 2.0 | 4.0 - 5.5 | 5.0 | LOW | Characters and world too still: add the life layer and moving props. |
| Blurry frames (detail under 6.5, Rick's 5th percentile) (% of frames) | 1.0 | 0.2 - 5.6 | 2.6 | OK |  |
| Length (s) | 66.0 | 46.1 - 64.35 | 59.5 | HIGH | Longer than most of Rick's Shorts. |
| Shot changes (whips, fast moves, cuts) per 10 s (count) | 5.91 | 4.03 - 6.14 | 5.04 | OK |  |
| Longest calm stretches (p90 time between shot changes) (s) | 3.19 | 3.48 - 5.62 | 4.53 | LOW | No calm stretches: give the key lines a 3-5 s shot with only a slow drift or push-in. |
| Calm stretches of 3 s or more (count) | 5 | 4.0 - 7.0 | 5.0 | OK |  |
| Voice speed (syllables per s) | 4.7 | 4.6 - 4.89 | 4.74 | OK |  |
| Sentence length (words per sentence) | 13.3 | 9.7 - 13.9 | 11.75 | OK |  |
| Very short sentences (4 words or fewer) (% of sentences) | 0.0 | 7.1 - 27.8 | 11.0 | OK (harmless side) |  |

## WHERE (times in s)

- Hard cuts (5): 2.3, 15.5, 32.5, 45.9, 49.0
- Shot changes (39): 1.0, 2.3, 4.3, 4.8, 6.0, 6.6, 8.8, 9.4, 12.8, 14.9, 15.5, 16.5, 18.5, 21.1, 21.6, 24.0, 24.9, 25.4, 28.6, 30.3, 32.5, 34.7, 37.0, 37.5, 41.5, 42.4, 45.9, 47.8, 49.0, 51.1, 52.7, 53.3, 54.3, 58.1, 58.7, 59.9, 61.4, 62.3, 65.3
- Calm stretches of 3 s or more (5): 9.4-12.8, 25.4-28.6, 37.5-41.5, 42.4-45.9, 54.3-58.1
- Blurry stretches of 0.2 s or more (0): none

The detector misses some cuts that land on a similar picture; check the frames around each listed time.
