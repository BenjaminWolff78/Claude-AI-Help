# Why He Let His Tap Drip All Night in the Freeze - delivery gate (v31)

Final render: 1980 frames, 1080x1920, 30 fps, 66.0 s. The mp4 and the mp3 share the name "Why He Let His Tap Drip All Night in the Freeze".

## Gate numbers (section 15)

| Check | Ours | Needed | Verdict |
|---|---|---|---|
| Sharpness median (kit/sharpness.py) | 0.69 | 0.64 or more | OK |
| Hard cuts | 4 (2.3, 32.5, 45.9, 49.0 s) | 4 or fewer | OK |
| Camera clearly moving | 56.1% | 72% or less | OK |
| Fast moves (p90) | 17.4 px/frame | 25 or less | OK |
| Shot changes per 10 s | 5.76 | 6.1 or less | OK |
| Longest calm stretches (p90) | 3.53 s | 3.5 s or more | OK |
| Opening camera speed (first 3 s) | 4.43 px/frame | 7.8 or less | OK |
| **Animation outside camera move** | **3.0** | **3.5 or more (Rick 4.0-5.5)** | **FAIL** |
| Length | 66.0 s | 47-67 s (Rick's middle half 46-64) | HIGH, inside the limit |
| Calm stretches of 3 s or more | 8 | Rick 4-7 | HIGH (harmless side) |
| Camera perfectly still / drifting | 3.7% / 40.1% | | harmless side |
| Pure white pixels | 0.23% | | harmless side |
| Very short sentences | 0% | at most 1 in 4 | harmless side |
| Voice | 4.70 syl/s, 13.3 words/sentence | 4.6-4.9, 10-14 | OK |
| voice_cuts.py on the final voice stem | 0 hits, 0 word diffs | 0 | OK |
| SAY-SEE (34 key words, two contact sheets) | 0 FAIL (5 fixed: "paying to water", "drain", "drip stops", "Plumbers", "minus twenty") | 0 | OK |
| Muted twist (sound off) | PASS: the bursting walls, the shut taps, the cutaway plug and split, the ketchup, his open tap with the Loophole Key, the neighbor dripping next winter, the sign slammed into his yard | PASS | OK |

## mix_check.py

| Row | Ours | Rick | Verdict |
|---|---|---|---|
| Stereo width (side/mid) | -21.9 dB | -23.6 to -26.9 | OK |
| Dead air | 0.2% (2nd pct -20.8 dB) | 0.3-0.7% (-20.3 to -20.9) | OK |
| Final impact | low band +14.8 dB at 65.3 s (the slam on "yard") | 3 of 3 | OK |
| Quoted line "You're paying to water a bucket!" | +46% vs narration | +60/+40% | OK |
| Quoted line "Haha, froze anyway, Drippy!" | +64% vs narration | +60/+40% | OK |
| Narrator pitch | 160 Hz | 205-211 Hz | info |

Loudness -14.30 LUFS integrated, true peak -1.25 dBTP. The one stinger is the unlock sting on "His open tap" (49.1 s), with the Loophole Key hooked on his tap.

## The one open hard fail: the animation row (3.0, needs 3.5)

- Where: the kit measures 9 fixed tiles. The night exteriors read 4-6 (falling snow), but the thaw kitchens and the cutaways (30-57 s) read 1-2: bright, clean interiors where only the camera drifts.
- What I tried: stronger surface detail on every wall, counter and cabinet (background detail 11.9 -> 14.2, now inside Rick's range) and a dressed back yard. That moved the row from 2.0 to 3.0. A YouTube-bitrate copy measures the same, so it is not a compression effect.
- What would close it: a life pass on those stretches (idle breathing and sway on everyone, steam, drips off the eaves, water moving inside the cutaway pipes, more parallax in the camera), then a full re-render (about 2 h). Expected gain about +0.5-1.0, so it may still fall short.
