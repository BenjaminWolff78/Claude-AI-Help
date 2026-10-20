# Almost Right — NOTE (Oct 20, 2026)

Educational short (86.6 s, 1920x1080, 30 fps): why a computer says 0.1 + 0.2 = 0.30000000000000004, and the
Vancouver Stock Exchange index (Jan 1982 – Nov 1983) that lost half its value to chopped decimals.
This note says what was checked; it does not certify the film as good.

## Tools that actually processed something
- ElevenLabs: voice "Luis – Chill, Warm, Conversational", eleven_v4, 4 takes; take 3 (85.3 s) used (file `content.mp3`);
  word timings from eleven_scribe_v1 on the same take. Onsets of the delivered mp3 match the timings within ~0.07 s.
- Figma (file VhoPC4sh4GgyotuLE4hwxb): scissors halves, beetle, North Shore mountains + city built with boolean
  union/subtract and exported as SVG paths (`src/float/assets.ts`).
- Remotion 4.0.529: every frame (2,598) rendered in 5 chunks (`render_full.sh`).
- motionmaxxing: shutter plan from measured motion (163 frames x 4 samples, 3 x 8; 501 sub-frames), blended by
  `studio/tools/finalize_mm.py`; gates run with look.py.
- Sound: repo sfx engine, `sfx/cues/float.py` (music key of C 96 BPM, foley from on-screen objects, one sting on "Unless").
- Adobe: not used to process anything (uploads from this sandbox are blocked; nothing was sent to Adobe).

## Numbers
- Final: 86.61 s, h264 1920x1080 30 fps, AAC 48 kHz; integrated -14.2 LUFS, true peak -2.2 dBFS (small copy).
- look.py: G0 PASS, G2 PASS (no run > 3 flat frames, longest static 0.07 s), G3 PASS (end hold 0.00 s, ends in motion).
  Mean frame-to-frame luma change 3.2/255, below the 4.4–9.8 human band: large paper areas move little even while
  the camera travels; every beat has a moving object, but the frame is calmer than a typical edit.
- Loop: last frame vs first frame mean luma difference 10.5/255 (grain reseeds each printed frame); same layout by eye.

## Facts (sources)
- 0.1 + 0.2 = 0.30000000000000004 in IEEE-754 doubles; 1/10 in binary = 0.000110011… (checked in Python).
- Vancouver index: started at 1,000 in Jan 1982, updated ~3,000 times a day, truncated to three decimals,
  read 524.811 on the Friday before Nov 25–28, 1983; corrected to 1,098.892 (Wikipedia, citing WSJ Nov 8 1983 and
  Toronto Star Nov 29 1983). The chart's in-between path is illustrative; only its endpoints are data.

## Five weakest things
1. Mean motion is below the human band; some beats (41–42 s zoom-out, 46–47 s) are mostly empty paper in transit.
2. The number-line zoom (39–41 s) uses a 9x camera push; the hair is a tiny squiggle and reads only because of the voice.
3. The print head's arm is a plain bar; it carries the film but is not a designed object.
4. The "true market" blue line is shape-only between two real values; a viewer could read it as real monthly data.
5. Captions are small (41 px) for phones.
