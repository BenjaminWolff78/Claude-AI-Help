# Rick measure kit

Measures our render frame by frame with the exact method used on Rick's Clips' 27 animated story Shorts, then prints a gap table against his numbers.

Files
- `measure_like_rick.py`: run `python3 measure_like_rick.py our_video.mp4` (needs ffmpeg and numpy). Writes `<name>_vs_rick.md` (gap table) and `<name>_frames.csv` (same columns as each per-video sheet in Ricks_Clips_frame_data.xlsx) into the current folder. About 35 s per 60 s video.
- `rickcore.py`: the measurement (ported from the browser code used on Rick's Shorts; per-frame camera, colour and caption values were checked against the browser version on the same clip).
- `rick_targets.json`: Rick's ranges per metric (p25 / median / p75 / min / max over the 27 Shorts) plus each Short's own numbers.
- `example_Owners_Sank_Their_Own_Ships_vs_rick.md`: the gap table for our latest video, as a starting point.

What Rick's numbers say (median, middle half in brackets)
- Camera is almost never dead still: still on 9% of frames (5-12%), and still stretches last ~0.15 s (90% are under 0.4 s). There is always a slow drift or push-in under a held shot.
- About 7 distinct camera moves per 10 s (5.6-7.5). A move lasts ~0.5 s (0.4-0.65), reaches peak speed in ~5 frames, peaks around 10 px/frame at 720 wide.
- ~70% of moves are mostly push-in/pull-out, not sideways pans. Roll stays under ~0.4 deg per frame.
- The camera is already moving in the first 3 s (~6 px/frame average).
- Hard cuts: ~2 per video (1-4.5). Scene changes ride camera moves and motivated transitions instead.
- Captions change ~2.65 times per second (2.55-2.79).
- Brightness ~117/255 (107-132), saturation 0.46 (0.44-0.50), near-black pixels ~1% (0-1), pure white ~2%.
- Background detail 17.5 (14-20) edge strength; animation outside the camera move 5 (4-5.5).

These are checks, not goals: the side-by-side review against the reference boards still decides.

## New in v13 (after the Roulette video)
- Three pacing rows: shot changes per 10 s (whips, fast moves and cuts together), the longest calm stretches (90th percentile of the time between shot changes) and the count of calm stretches of 3 s or more. Rick: about 5 per 10 s, 4.5 s, and 5 per video (never under 3).
- Voice rows with `--words words.json`: syllables per second (Rick 4.6-4.9), words per sentence (9.7-13.9) and the share of sentences of 4 words or fewer (median 11%). These speech targets come from 4 Shorts (Railroads, Grave Bell, Japan, Drivers) timed from YouTube captions, so they are approximate (about +-5%); the verdict text "outside all 27" on these rows means outside those 4.
- Usage: `python3 measure_like_rick.py render.mp4 rick_targets.json --words words.json`

## New in v14 (after the Oranges in Ice video)
- A blurry-frames row: the share of frames whose detail (edge strength) is under 6.5, the 5th percentile of all of Rick's frames. Rick: median 2.6% per video (0.2-5.6%, never over 10.7%). The Oranges video measured 6.5%, almost all of it inside the tree crowns and in the jar-to-grove crossfade.
- A WHERE list at the end of the report: the time of every hard cut, shot change, calm stretch of 3 s or more and blurry stretch of 0.2 s or more, so each LOW or HIGH row points at frames. The hard-cut detector misses cuts that land on a similar picture (it missed the Oranges cut at 56.2 s), so look at the frames around every listed shot change.
- Run it on the previz (step 6 of the master prompt) as well as the final render.
- example_Oranges_vs_rick.md is the Oranges in Ice report.

## sharpness.py (new in v2, Nov 22 2026)
python3 kit/sharpness.py render.mp4
Prints the median sharpness ratio of 10 frames (top 60% of the frame, captions left out):
mean pixel step at full size / mean pixel step after 2x2 averaging. A sharp photo reads ~1.0;
a picture rendered at 0.55 of full size and scaled up reads ~0.61 at best.
Rick on YouTube: median 0.68 (51 frames from 17 Shorts, lowest 0.59). Ours on YouTube: 0.54-0.62.
The Cars video before upload: 0.54-0.55. YouTube's re-encode adds about 0.02-0.03.
Target for our final mp4: median 0.64 or more. Sharpening filters raise the number without adding
detail, so never sharpen to pass it: render at dpr 1.0 with real textures and models instead.
