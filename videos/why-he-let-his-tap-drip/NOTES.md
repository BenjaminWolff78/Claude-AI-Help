# Dripping-tap video: working notes (survives context compaction)

## State (Nov 26, 12:25 ET) - v31 remake of the dripping tap
- Master prompt v31 is in the skill (saved). The pig video stays as delivered (the user said not to remake it).
- Voice: /home/claude/p13/audio/voice_v31.wav (take H, 4.70 syl/s, 13.3 words per sentence, voice_cuts 0, quotes +46% and +64% in mix_check),
  words: audio/words_v31.json (kit format). Script: script.txt (new last line: the old man slams the Drippy sign into the neighbor's yard).
- Timeline: 1980 frames (66.0 s). v31/remap.json maps output frames to story frames; talk.json is looked up by OUTPUT frame (globalThis.__OUTF).
- The ending (shot 18): pull back from the neighbor's window onto the old man, mallet up, the slam on "yard" (story 1954 = 65.23 s): snow bursts,
  the window icicles fall, the neighbor jumps. The music stops dead on it; the slam is the biggest hit (-6 LU vs the voice).
- Shot 2 (the hook's outcome) restaged on the corner of the neighbor's house: three fat jets arcing across the right half, the old man big at
  left with his mug (a sideways truck that cancels the F() orbit keeps him still in frame), the neighbor behind his fence.
- Sound: audio/mix31.py + cues_v31.json (build_cues31.py) + music/compose_drip31.py + sfx_make31.py (the slam, icicles, snow, mallet and
  four stereo ambience beds). mix_check on the mix: stereo -21.9, dead air 0.2% (2nd pct -20.7), final impact low +14.8 dB at 65.2 s, quotes OK.
- Render: app/scripts/render_chunks.mjs (1980 frames, about 18 frames/min). Then tools/assemble31.sh, the kit, sharpness, mix_check, saysee31.py.

## Lessons for the skill gotchas
- An analytic camera-row estimator (dump cams via esbuild + camrows2.py) predicts the kit's camera rows in 1 minute, with no render. Calibration on the pig render: fast p90 matched (29.4 vs 29.6), shot changes estimated about 1.28x high, calm p90 about 0.4 s low, moving about 3 points low. The estimator counts dissolves as events and misses whips; adjust by hand.
- A long fast glide (> 0.5 s over 15 px/frame) counts as 2-3 shot changes; Rick-length moves (12-16 f) count once.
- Every camera path crossing a fence, vehicle or wall must be checked against the scene: list the crossings with the camera dump.
