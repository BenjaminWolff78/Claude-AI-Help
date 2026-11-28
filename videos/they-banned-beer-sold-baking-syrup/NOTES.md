# p14: They Banned Beer, So He Sold It as Bread Syrup (master prompt v34)
- Started Nov 27 from he-set-the-ice-cream-on-fire_code_v34.zip (app/src/videos/ice = code/, scripts, tools, camdump), kit v6 in ./kit.
- node_modules -> /home/claude/proj/app/node_modules; public -> /home/claude/p10/app/public (shared Poly Haven store).
- Step 1 done: 60/60 vidIQ credits (2878 -> 2818). Every bank topic was already a Short (see checkpoints/checkpoint1_topic_script.md).
  Pick: Prohibition malt syrup sold "for baking" (sibling of Grape Bricks 27k). Title: They Banned Beer, So He Sold It as Bread Syrup (89).
- Step 2 done: script.txt (237 words; the take-1 text). script_tB_217.txt = the trimmed version used for take 2 (not used).
- Step 3 done (user chose: trim + light tempo, Nov 27 ~18:00 ET): take 1 (tA) trimmed (pauses >0.11 s -> 0.08 s,
  trailing fricatives kept) + rubberband tempo 1.12 -> audio/voice_final.wav 65.2 s, 4.50 syl/s; voice_cuts 0 hits.
  words: audio/words.json (script spelling, s/e), audio/words_vc.json (word/start/end for voice_cuts).
  Tools: tools_local/trim.py <tempo> <take> <gap_to> <mingap>, tools_local/map_words.py, tools_local/rawwords.py (small.en).
  ElevenLabs: 2 takes (1343 + 1253 credits), flow HaErauBWoqYI0QUKal4z; take 2 (217 words) came out slower (75.6 s raw), unused.
- Step 4 done: plan/plan.json (31 shots, 4 places: brewery, grocery, mainstreet day/night, cellar), plan_check 0 FAIL/0 WARN.
  plan/make_plan.py regenerates it. Checkpoints 1 and 2 sent.
- Step 5 done (checkpoint 3 sent): sets/beer.ts + sets/beerkit.ts, cast block at the END of CAST (casts.ts), grades brewG/grocG/stDayG/stNightG/cellarG
  (grade.ts, lights.ts point at them), still_check 0 FAIL on look/k_S*.jpg. New fig props: syrupCan, padlock, rollingPin, pie, capper.
  Crate carry = {carry2: true, armRFront: true, armLFront: true, propR: "crate"} (without the front arms a 2nd crate draws at the hip).
  Preview stills default cInf 10 (heavy blur): pass cInf (0 wides, 2-3 close). preview.mjs now merges spec.props into preview runs.
  S23/S31 now 6-frame dissolves (plan_check 0/0). S26 pancake demo sits at the counter's left end (x 98).
  Framings found in look-dev: S16 aerial cam [200,20,-10] look [234,5,13] fov 40; S18 OTS cam [197.4,2.05,6.3] look granny [196.9,1.95,8.35] fov 50,
  agent [197.5,0.6,7.45] back; S8 office from the street cam [187.2,1.7,4.6] look [187.2,1.75,10.5] fov 46.
  Repo: BenjaminWolff78/claude-ai-help branch they-banned-beer-sold-baking-syrup (worktree /home/claude/cah-beer), folder videos/they-banned-beer-sold-baking-syrup.
- Step 6 done (Nov 27 ~20:00 ET): 31 shots in story.ts/shots.ts (beer block between the p14 marker and "carry-over (11r)").
  Loop: extract block -> work/editsN.py (R(old,new) exact-once) -> python3 -I work/edit_block.py -> splice -> tsc -> esbuild camdump/dump_v2.ts
  -> node dump.mjs 1 > work/frames.jsonl -> kit/previz_guard.py (0 FAIL; WARN G6 16 frames, G6b OTS shoulders) + tools_local/speeds.py.
  tools_local/guardfull/previz_guard_full.py = the guard with the G5 note list untruncated (local copy, not committed).
  rule_audit: work/audit_config.json (payoff range = the whole S31 shot 1903-1986), A-F PASS. plan_check 0 FAIL, 1 WARN (S21 cut not on a punch).
  Fixes worth remembering: S19 is a pull-back from S18's OTS (c18 squarer at x 197.2), the agent only backs down from 1150, c19 az 192 el 0;
  S22 no longer cranes out to z -20 (the agent fell under 5% width: rule B empty frame); S15 brewer stands at tower+0.3 and the agent
  steps to x 101.2 (the other side); S31 agent x 221.95 / wife x 220.4 (off the lens-to-wife line); turn line split ("He says sorry," / "pop").
  Disk: only ~7 GB free; Remotion bundles land in REMOTION_TMP (use /home/claude/rtmp/<name>, delete that named folder after).
- Step 6 closed: checkpoint 4 sent (0 FAIL; kit: calm p90 5.69, animation 3.0, 2 false cut detections at 34.6/37.7 s).
  One look round fixed S12 (queue at the wall, the wife visible), S13, S17 back view, S22, S30 (lamp at x 218 removed), S31 foam.
  Previz renders: scripts/previz_render.mjs (RANGES="0-1985" CONC=1; two tabs gave white dissolve frames). tools_local/blankscan.py, contact.py.
- Step 7 done: audio/sfx_make14.py (original synthesis, 26 effects + 6 beds + stinger), compose14.py (120 BPM rag, tuba at F2 so the sub
  band is free for the hit), quote_pitch.py (agent +4.5 st, brewer -4 st, formants kept), cues14.py -> cues14.json, mix.py (p13 mixer).
  mix_final.wav: -14.31 LUFS, TP -1.25; mix_check on the previz mux: width -21.9, dead air 0.5%, final impact low band +12.4 dB, quotes +70%/-54%.
- Step 8 running: scripts/render_chunks.mjs 0 1985 (TOTAL 1986, 80-frame chunks, ~160 s each), log p14/render.log; chunk 0 sharpness 0.70.
- Step 8-10 done (Nov 28 ~00:15 ET): render 25 chunks (~18.5 frames/min); door fix (swings OUT from a 0.3 m jamb after the agent steps
  back; the inward leaf slid behind the painted kitchen in 3 frames) and the S21 cut moved to 1240 (S20/S21 cuts were 0.7 s apart);
  chunks 960-1359 re-rendered. Final: still_check 0 FAIL, mix_check 0 FAIL, sharpness 0.70, kit rows open: fast p90 12.5, push-in 81%,
  saturation 0.41, animation 3.0, 6 detected cuts (4 real). Delivered final/They Banned Beer, So He Sold It as Bread Syrup.mp4 + .mp3 + cover,
  final_checks.md, cue_sheet.md. Remotion bundles land in /tmp (not REMOTION_TMP): delete each by its listed name.
