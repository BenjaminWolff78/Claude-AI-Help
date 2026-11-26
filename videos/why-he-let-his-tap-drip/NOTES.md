# Dripping-tap video: working notes (survives context compaction)

## State (Nov 25, 22:10 ET)
- Pig video: the final render is running (render_chunks.mjs, 1973 frames, about 5 h). Poll with `bash /home/claude/p10/tools/poll.sh`, which relaunches it if it died.
  - Do NOT run whisper, tsc or the sampler while it renders: the memory cgroup is 6 GB and chrome gets OOM-killed. That happened twice tonight.
  - After it finishes:
    1. Run `bash /home/claude/p12/assemble12.sh "curves=all='0/0.03 0.25/0.32 0.5/0.59 0.75/0.815 1/1',eq=saturation=1.88"`.
    2. Run the kit (`python3 -E -s /home/claude/untrusted/kit3/measure_like_rick.py "<mp4>" /home/claude/untrusted/kit3/rick_targets.json --words /home/claude/p12/audio/words_kit_v3.json`), sharpness.py, and voice_cuts on voice_v3.wav with heard words from medium.en (small.en mishears "nails" as "mails").
    3. Write final_checks.md with the gate table, then deliver the mp4, the mp3, the title file and the pinned comment.
  - Estimated camera rows (camrows2.py): moving 63.5%, p90 16.3, opening 5.3, shot changes 4.7 per 10 s, calm p90 3.66 s. The real kit decides.
- Dripping tap: CP1 and CP2 are sent (/home/claude/p13/checkpoints).
  - Voice final: /home/claude/p13/audio/voice_final.wav (take B, T 1.10, 62.5 s). Mapped word timings: words_tB_mapped.json. The script is /home/claude/p13/script.txt (US spelling "neighbor").
  - Next:
    1. words.json from voice_final with medium.en, then voice_cuts (normalize "twenty"/"20").
    2. Build dripset.ts (winter street + two kitchens + cutaway), the cast (old man, neighbor in red jacket, woman with mug, shovel guy, plumber), style lock, the 17 shots, previz, kit, render.
- New Poly Haven assets in public/ph: pipe_wrench, wall_clock, vintage_electric_kettle, Rockingchair_01, ArmChair_01, WoodenTable_02, dining_chair_02, metal_toolbox, modular_pipes, Shelf_01, painted_wooden_cabinet_02, alarm_clock_01; textures snow_02, snow_03, asphalt_snow, weathered_plank_siding, blue_painted_planks, grey_roof_tiles, old_linoleum_flooring_01, concrete_tiles; HDRIs winter_evening, snowy_field, rural_winter_roadside, rogland_moonlit_night. (fir_tree_01 removed: 465 MB.)
- Every remotion bundle copies public/ (about 0.55 GB) into /tmp/remotion-webpack-bundle-*. Clean the old ones (keep the one a running render uses).

## Lessons for the skill gotchas
- An analytic camera-row estimator (dump cams via esbuild + camrows2.py) predicts the kit's camera rows in 1 minute, with no render. Calibration on the pig render: fast p90 matched (29.4 vs 29.6), shot changes estimated about 1.28x high, calm p90 about 0.4 s low, moving about 3 points low. The estimator counts dissolves as events and misses whips; adjust by hand.
- A long fast glide (> 0.5 s over 15 px/frame) counts as 2-3 shot changes; Rick-length moves (12-16 f) count once.
- Every camera path crossing a fence, vehicle or wall must be checked against the scene: list the crossings with the camera dump.
