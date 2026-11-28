# Delivery: They Banned Beer, So He Sold It as Bread Syrup

**0 FAIL** on every gate. Nothing below is a gate FAIL; these are the WARNs and kit rows still open:

| Open item | Where |
|---|---|
| G6: face in the caption band, 49 frames, each run under 0.6 s | 6.1, 7.5, 10.0, 24.9-25.5, 29.7, 60.8-61.2 s |
| G6b: over-the-shoulder heads half-cut at the frame edge | grocer 28.5 s, agent 35.4-37.9 s, townsfolk 58-60.6 s |
| G10: a hand target 0.31 m off its card plane (WARN) | 34.0 s |
| Kit, fast moves p90: 12.5 (Rick 14.3-25.4) | |
| Kit, push-in share of moves: 81% (Rick 64-76%) | |
| Kit, saturation: 0.41 (Rick 0.44-0.50) | |
| Kit, animation outside the camera move: 3.0 (Rick 4-5.5) | |
| Kit, length: 66.2 s (Rick's middle half is 46-64 s; v34's limit is 44-67 s) | |
| Kit, hard cuts detected: 6 | real cuts at 14.6, 27.5, 40.3, 41.3 s; false detections at 34.3 s (the door swings open onto the bright kitchen, no cut) and 37.7 s (a caption swap over a flat yellow wall, picture unchanged) |

## Files
- **Video:** `They Banned Beer, So He Sold It as Bread Syrup.mp4` (1080x1920, 30 fps, 66.2 s, 1986 frames).
- **Voice:** `They Banned Beer, So He Sold It as Bread Syrup.mp3`, with the quoted lines in character.
- **Cover:** `cover_They Banned Beer, So He Sold It as Bread Syrup.jpg` (4.9 s: the brewer under the crossed-out BEER sign).
- **Budgets:**
  - vidIQ: 60 of 60 credits (2,878 → 2,818).
  - ElevenLabs: 2 voice takes (the second was needed because the pace was out of range).
  - Effects: 0 ElevenLabs generations. All 26 effects, the 6 ambience beds, the stinger and the score are original synthesis.

## Title, description, pinned comment, tags

**Title:** They Banned Beer, So He Sold It as Bread Syrup (vidIQ 89)

Other options:
- He Sold Bread Syrup and the Whole Town Started Brewing (89)
- Why Breweries Sold Baking Syrup During Prohibition (84)
- The Baking Syrup That Was Secretly Beer (84)
- He Labeled Beer Syrup "For Baking Bread" (83)

**Description:**
> When beer was banned, breweries sold hop-flavoured malt syrup "for baking", and grocery stores quietly sold the whole town a home brewery, one can at a time. Clever loophole, or crime with extra steps?
>
> #shorts #history #prohibition

**Pinned comment:**
> One can of "baking syrup" made about 45 bottles of beer. Who should the agent have arrested: the brewer, the grocer, or his own wife?

**Tags** (each checked against the story):
- prohibition
- prohibition loophole
- malt syrup
- malt extract
- home brewing history
- 1920s history
- bootlegging
- beer history
- history shorts
- loophole

## Final table

### Gates

| Gate | Step | Result |
|---|---|---|
| script_check | 2 | 0 FAIL |
| script_check --words, voice_cuts | 3 | 0 FAIL, 0 cut words |
| plan_check | 4 | 0 FAIL, 0 WARN. S21 now cuts at 41.33 s. The two cuts at 40.30 and 41.02 had been 0.7 s apart, a v34 hard fail. |
| still_check, look-dev | 5 | 0 FAIL |
| previz_guard | 6 | 0 FAIL (WARN G6, G6b, G10) |
| rule_audit | 6 | A-F all PASS |
| mix_check, previz mux | 7 | 0 FAIL |
| sharpness, chunk 0 | 8 | 0.70 OK |
| Blank-frame scan, every frame | 8 | 0 bad |
| Seam check, all 24 seams | 8 | 0 jumps (see checks.json) |
| measure_like_rick, final | 9 | rows below |
| still_check, final.mp4 | 9 | 0 FAIL |
| mix_check, final.mp4 | 9 | 0 FAIL |
| sharpness, final | 9 | 0.70 OK |

**The door fix.** The seam check flagged 1039→1040. Fresh stills proved it was the picture itself, not a render fault: the door leaf slid behind the painted kitchen in 3 frames. The door now hangs in a 0.3 m jamb and swings OUT onto the porch after the agent steps back, revealing the granny behind it. Chunks 960-1359 were re-rendered.

**previz_guard rows:**
- PASS: G0, G1, G1j, G2, G3, G3b, G3c, G3d, G4, G5, G7, G8 (0 of 25 lines short), G9, G11, G12.
- WARN: G6, G6b, G10, as listed at the top.

**rule_audit rows:**

| Check | Result |
|---|---|
| A. A face on screen | 96% of frames |
| B. Empty frames | none |
| C. Hook act + danger | at 0.3 s |
| D. Payoff object | 25%+ of the width for 2.8 s, peak 163% |
| E. Lead colours | 82 deg of hue apart |
| F. Quotes in close-up | 42% and 44% |

**mix_check, final:**

| Row | Ours | Rick |
|---|---|---|
| Stereo width (side/mid) | -21.9 dB | -23.6 to -26.9 |
| Dead air | 0.6% | |
| Final impact | low band +12.3 dB at 64.9 s, on "baking" | |
| Quoted lines vs narration | +48% (agent), -47% (brewer) | |
| Loudness | -14.31 LUFS, true peak -1.25 dBTP | |

### Kit table: measure_like_rick on final.mp4

| Row | Ours | Rick (middle half) | Verdict |
|---|---|---|---|
| Camera clearly moving | 62.7% | 53.9-71.9 | OK |
| Median camera speed | 2.6 | 2.2-4.1 | OK |
| Fast moves (p90) | 12.5 | 14.3-25.4 | LOW |
| Moves per 10 s | 5.6 | 5.6-7.5 | OK |
| Push-in share of moves | 81% | 64-76 | HIGH |
| Opening camera, first 3 s | 4.8 | 3.7-7.8 | OK |
| Hard cuts detected | 6 (4 real) | at most 4 | see the top |
| Shot changes per 10 s | 4.53 | 4.0-6.1 | OK |
| Calm stretches (p90) | 5.03 s | 3.5-5.6 | OK |
| Calm stretches of 3 s+ | 8 | v34: 3+ | OK |
| Captions | 2.61/s | 2.55-2.79 | OK |
| Brightness | 113.5 | 106-132 | OK |
| Saturation | 0.41 | 0.44-0.50 | LOW |
| Detail | 17.8 | 14.2-19.8 | OK |
| Blurry frames | 1.0% | 0.2-5.6 | OK |
| Animation outside the camera move | 3.0 | 4.0-5.5 | LOW |
| Voice | 4.50 syl/s | v34: 4.45-5.0 | OK |
| Length | 66.2 s | v34: 44-67 | OK |

### Say-see

25 lines, all on screen (G8 0 short, plan P5 0 misses). The line-by-line table is in checkpoint 4. After it, line 18 ("Then the next house pops") gained 0.3 s of the burst window before the cut at 41.33 s.

### Signature

| Beat | Time | What happens |
|---|---|---|
| Hook | 0-5.0 s | the crossed-out BEER sign, the brewer labelling syrup cans |
| "You see," | 5.36 s | |
| Doubter quote | 12.3 s | |
| Fake-out | 36.3 s | "She really is baking." |
| Turn and unlock sting | 40.46 s | "pop" |
| Mechanism | 43.3 s | |
| Comparison | 51.0 s | |
| Real tag | 58.0 s | |
| Payoff and final hit | 64.90 s | "baking" |

**Mute test:** with the sound off, the payoff still reads. The agent opens his own cellar and finds his wife among bottles and crocks, and the shelf blows foam over her. The PURE MALT EXTRACT label and the 45 chalked on the beam carry the mechanism.

### Music and sound cue sheet
See `cue_sheet.md`. In brief:
- **Music:** an original 120 BPM rag (banjo, tuba, pizzicato, brushes). It turns into a D minor tiptoe at night and lifts to B-flat with a clarinet tune at the reveal (43.32 s). It stops dead on the final hit.
- **Beds:** 6 ambience types (11 placements) that never drop out.
- **Effects:** 26, each on its action and panned to its source.
- **Stinger:** at "pop".

### Self-review: our video next to Rick's (one round, frames every 4 s next to CA1 and AX)

**Script.** The structure is Rick's:
- the hook act at frame 1;
- "You see," at 5.4 s;
- a quoted doubter;
- the count escalation 3 → 30 → a wall;
- a fake-out at 55%;
- the turn on "pop";
- the mechanism at 65%;
- an acted comparison;
- the twist on the last word.

Misses:
- 23% of sentences are 4 words or fewer (Rick median 7%; info row).
- At 66.2 s it is longer than most of Rick's Shorts.

**Picture.** Lit, dense sets (detail 17.8, flat area 15%), white egg heads with hats as separate shapes, costume gradients. Misses:

| Time | Miss |
|---|---|
| 0-2.6 s | The brewer's hands are hidden behind the canning table, so the labelling act reads through the cans and the sign rather than his hands. |
| 32.7-34.4 s | The knock is seen from behind him: no face for 1.8 s. |
| 41-43 s | The pops are small in the wide street. |
| 43-47 s and 53-58 s | The granny sits small at frame-left in the cellar cutaway. |
| 30-32 s | The aerial is pale and flat (still_check flags single frames there; the median passes). |
| whole video | Saturation is 0.41 against Rick's 0.44-0.50. |

**Characters.** Style lock passed at step 5. Expressions change on the beats (strips in checkpoint 4). The agent, brewer, grocer, granny and wife are distinct in colour and silhouette.

**Camera.** The opening moves from frame 1 (4.8 px/f), and there are punch-ins on key words. Misses: too many push-ins (81%) and moves that are a little timid (p90 12.5).

**Acting.** Walks are on planted feet, hands reach what they hold (G10 0 short), and no pose snaps. Miss: life motion outside the camera move measures 3.0 (Rick 4-5.5).

**Sound.** The bed never drops out, effects sit on their actions, the stinger lands on "pop", the final hit lands on "baking", and the quoted lines are pitched into character voices. Width is -21.9 dB: mix_check passes it, but it is slightly wider than Rick and the v34 text range of -22 to -30.

**Note on the quoted lines.** To pass mix_check's quote row, the agent's line is pitched up 4.5 semitones and the brewer's down 4, with formants kept. You found whole-voice pitch shifts weird before. If these two lines sound off, a remux without them takes a minute.
