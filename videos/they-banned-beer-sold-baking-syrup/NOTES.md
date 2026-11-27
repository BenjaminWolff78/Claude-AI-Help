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
- Step 5 (look-dev) next: sets brewery/grocery/mainstreet/cellar, cast brewer/agent/agents/grocer/granny/wife/townsfolk.
