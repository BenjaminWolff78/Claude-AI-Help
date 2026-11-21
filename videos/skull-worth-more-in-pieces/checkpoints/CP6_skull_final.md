# CP6: final check ("The Skull That Was Worth More in Pieces")

**Verdict: PASS, with 4 known gaps** (listed at the end). The video is 65.7 s, 1080x1920, 30 fps, -14.3 LUFS (peak -1.3 dBFS). The mp4 has the same name as the mp3.

## v24 rules
| Rule | Result | Where |
|---|---|---|
| One-sentence test printed | PASS | CP1: "A farmer smashed a million-year-old skull with a hammer, and got paid twelve times more for the pieces." |
| Real money or body stakes with a physical object | PASS | Ten cents a piece, coins, the skull and the hammer are all on screen |
| Hook states the act and its opposite result, with a number | PASS | "...smashed a million-year-old skull with a hammer and got paid twelve times more." ("twelve" at 3.4 s) |
| First escalation number at 13-18 s | PASS | "twelve" pieces at 16.5 s, with the 12 COINS card |
| Biggest number before 20 s | **MISS by 1.4 s** | The tally board starts counting at 20.4 s (2,988), and "three thousand" is spoken at 21.4 s. The script had it at about 19 s, but the voice reads at 4.24 syllables a second, so everything after the hook lands late |
| The doubter has a first name and laughs on screen | PASS | Joko laughs on his name at 12.3-13.0 s, shaking and pointing; the whole line laughs at 18.2 s |
| Don't cut the middle escalation | PASS | Friday 3,000, one night 100, end of the month: all kept. Two other lines were cut instead (CP2) |

## The user's note: visible, not blurry
PASS. The depth of field was halved, the lens blur is capped (maxCoC 12), and the final is rendered at full 1080x1920 (dpr 1.0, cardK 1.0). In the local side-by-side, our frames are as sharp as the reference frames, and the characters read at the same size.

## Checks and budget
| Item | Used | Result |
|---|---|---|
| Style lock | 1 of 3 | Locked at CP3 |
| Still gate | 1 pass (40 stills) + 2 look passes | All fixed before previz (checks.json) |
| Scene-graph checks (12) | 3 previz passes | Table in CP5 |
| Kit | measure 1 (previz 3) + re-measure 2 of 2 | Table below |
| 1 fps sweep | 1 of 1 | 4 problems found and fixed (below) |
| Side-by-side with the reference frames | 1 of 1 | Viewed locally only, never uploaded |

## 1 fps sweep: what it found, and the fixes
| Time | Problem | Fix |
|---|---|---|
| 20 s | A near-blank shed wall halfway through the whip into the shed | The shed camera starts on the whole shed front with the door centred, and the glide leads with the look |
| 23 s | A wall, then an empty lane, on the shed-to-lane whip | A hard cut on "because" (frame 694), straight to the hammerers |
| 32 s | A seam at the 960 chunk boundary (two different bundles) | Chunk 880 re-rendered from the same bundle |
| 39 s | An empty yard halfway through the glide from the kids to the elder | The glide leads with the look and lands 2 frames sooner |
| 52 s | The STILL ONE card cut to "TILL ONE" at the left edge | Card moved 8 cm screen-right and made slightly smaller; it stays fully in frame |

Chunks 0, 560, 640, 720, 880, 1120 and 1520 were re-rendered. Each fix was checked with low-res stills before the render, then on the new chunks.

## Kit: the first final → the fixed final (re-measure 2 of 2)
| Row | First final | Fixed final | Rick (middle half) | Verdict |
|---|---|---|---|---|
| Brightness | 98.2 | **107.2** | 106.5-132.2 | LOW → OK (a gentle shadow lift in the final pass; whites untouched) |
| Near-black pixels | 2.0% | **0.0%** | 0-1% | HIGH → OK |
| Saturation | 0.498 | 0.461 | 0.44-0.50 | OK |
| Still / drifting / moving | 0.9 / 27.2 / 71.8% | 0.6 / 27.7 / 71.7% | 4.6-12.4 / 22.9-33.7 / 53.9-71.9 | OK |
| Speed, move length, ease, push-in, detail, white | | | | OK |
| Shot changes per 10 s / calm stretches / sentences | 5.48 / 3.7 s / 11.4 words | 5.18 / 3.69 s / 11.4 words | | OK |
| Camera roll (p95) | 0.91° | 0.77° | 0.31-0.67 | HIGH (closer) |
| Opening speed (first 3 s) | 1.68 | 1.87 | 3.7-7.8 | LOW |
| Fast moves (p90) | 13.1 | 9.4 | 14.3-25.4 | LOW (the shed whip became a cut) |
| Camera moves per 10 s | 5.2 | 4.9 | 5.6-7.5 | LOW |
| Hard cuts per min | 5.48 | 5.48 | 0.9-5.0 | HIGH (the seam is gone, and the lane cut was added) |
| Captions per s | 2.40 | 2.42 | 2.55-2.79 | LOW |
| Animation outside camera moves | 3.0 | 3.0 | 4.0-5.5 | LOW |
| Length | 65.7 s | 65.7 s | 46.1-64.4 | HIGH (v24 rule 6) |
| Voice speed | 4.24 syl/s | 4.24 | 4.6-4.9 | LOW (outside all 27) |

## Side-by-side with the reference frames (local only)
- **Match:** the character design (white heads, thin black limbs, thick outlines), the character size, the caption style, and the sharpness.
- **Gap:** colour variety. About 70% of our runtime sits in warm wood and late sun (station, shed, puzzle room). Rick changes the palette from scene to scene: cool night blues, purples, bright interiors. Next video: give each setting its own colour key.

## Known gaps (reported, not fixed)
1. **Voice speed is 4.24 syllables a second** (Rick: 4.6-4.9). This is why the video is 65.7 s and why the biggest number lands at 21.4 s instead of before 20 s. The fix is a faster take, which means a new voice track and a full re-time.
2. **The spoken question line was cut** ("Wait, how does a genius fall for a hammer?") to keep the length under 66 s (CP2).
3. **Camera rows:** the opening is slow (1.87), there are too few fast moves and too many cuts, roll is high, and there is too little animation outside camera moves. Each would need re-blocked shots and a full re-render.
4. **vidIQ:** 10 calls were used for the topic pick (the rule says about 4-6).
