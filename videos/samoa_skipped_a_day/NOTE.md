# Samoa deleted a whole day — NOTE (motionmaxxing)

**Title:** The Country That Deleted Friday 📅
**Files:** `samoa_skipped_a_day.mp4` (named after the voice file `samoa_skipped_a_day.mp3`), 1080×1920, 30 fps, 36.3 s.

## The one idea
One carried object performs the story: the torn-off **FRIDAY 30** calendar page. It is ripped off on "deleted", sinks into the sea on "never happened", is thrown back out by the island's landing splash, gets stamped PAID, and the pad loops back to it at the end. Turquoise (#19D3C5, new accent) means one thing only: the missing day / the date line.

## World
A pastel miniature diorama: Samoa is a cut-out slice of ocean (water wall, fish, sand strata) with an island on top. One key light upper-left, soft shadows, grain 0.03, smooth clock with real shutter blur (180°, 8 sub-frames per frame, tmix-averaged). Font: Nunito Black, chosen via Adobe Fonts. Storyboard in FigJam: https://www.figma.com/board/ehxIQ8fwidPe8PIB0KSdQ0

## Beats
| t | beat | what it buys |
|---|---|---|
| 0–3.1 | night beach, FRIDAY page ripped off | hook: a day gets deleted on frame 1 |
| 3.1–10.2 | Samoa diorama: lights off on "bed", moon whips away, sun up, THU flips to a torn stub then SAT | proof with real dates |
| 10.2–12.8 | the page sinks underwater; a "?" bubble pops | the turn ("never happened. Why?") |
| 12.8–18.3 | map (real lon/lat outlines), ships, AU/NZ rise with flags, date line flickers on, clock sweeps 315° | why: neighbours almost a day ahead |
| 18.3–22.6 | split along the date line: Sydney worker typing (MONDAY) / Samoa hammock (SUNDAY) | concrete version of "a day apart" |
| 22.6–25.1 | **HERO:** the island hops over the glowing line; calendar THU 29 → SAT 31 on landing | the screenshot frame |
| 25.1–28.6 | the page lands in a WAGES envelope, PAID stamp, coins | paid anyway |
| 28.6–33.8 | stinger on "But", twist spin into sepia 1892 chart; island hops the opposite way | twist |
| 33.8–36.3 | JULY 4 1892 page flips to… JULY 4 again, ×2, fireworks; iris back to frame 1 | payoff + seamless loop |

## Facts (verified)
Samoa (and Tokelau) moved from UTC−11 to UTC+13 at the end of 29 Dec 2011; Friday 30 Dec was skipped. Reason: trade with Australia/NZ (Samoa was ~21 h behind Sydney). Workers were paid for the missing day. In 1892 Samoa moved the other way to align with US/California trade, so Monday 4 July 1892 happened twice. Weekdays checked (29 Dec 2011 = Thursday, 4 Jul 1892 = Monday). Map outlines are real but distances are compressed for 9:16 (illustrative).

## Gates (quoted)
- **look.py:** G0 PASS (36.27 s vs 36.30 expected, audio present) · G2 PASS (no run > 3 flat frames) · G3 PASS (end hold 0.03 s — ends mid-motion on purpose for the loop; final shot 7 %). No frozen stretch ≥ 0.6 s; longest static-ish 0.40 s. Shot length mean 4.03 s (min 2.47, max 7.03).
- **Audio:** integrated −14.3 LUFS, true peak −1.5 dBFS, LRA 1.9. Stems relative to voice (−14.4): SFX −17.0 dB, stinger −11.0 dB, music −19 dB before ducking (−23 dB integrated after −5.5 dB ducking under speech), music fades out from 34.8 s.
- **Cut sync:** 3 of 8 cuts within ±80 ms of an onset (38 %; pros ~35 %).
- **lint.mjs (G5 no page chrome):** PASS, all FAIL rules clean. D1 WARN ×13: the karaoke captions reserve space for unspoken words, so a partly-revealed line sits left of centre for under ~1 s. Kept on purpose (standard Shorts caption reveal).
- **G1/G4 by eye on look/sheet.jpg:** every frame has one hero (pad, island, map land, split characters, envelope, July pad); all text ≥ 4 % H.
- **Motion:** mean luma change 2.9/255, below the 4.4–9.8 human band. Partly the large flat sky/sea areas (luma barely changes even while waves, fish, stars, flags and palms move every frame); the taste file prefers calm and legible over frantic. Something moves on every frame.

## Sound
All foley synthesized from noise/plucks (no stock): paper tear and flutter, splash with bubble blips, boing for the hop, stamp thump, a few short damped coin clinks (kept few, per "fewer tings"), clock ticks, neon buzz, typing, hammock creak, crickets/waves that return at the loop. Music: Karplus-Strong ukulele strums + log drums (pate) + bass, 100 BPM, muffled underwater, "gramophone" band-pass with crackle for 1892, break at the stinger. No loud swooshes.

## What I'd still improve
Lift the motion number a little with a slow camera drift in the map and July shots; make the 1892 island pop in on "In 1892" with a bigger arrival.
