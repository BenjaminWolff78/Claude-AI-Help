#!/bin/sh
# mirror this video's code and docs into the repo (no media, no boards, no board crops, no reference frames, no jpgs)
set -e
R=/home/claude/claude-ai-help/videos/he-covered-his-oranges-in-ice; F=/home/claude/proj
mkdir -p $R/shot_sections $R/project/src $R/project/scripts $R/tools $R/audio/music $R/docs
cp $F/sec/*.ts $R/shot_sections/
cd $F/app/src && find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) | while read p; do mkdir -p "$R/project/src/$(dirname "$p")"; cp "$p" "$R/project/src/$p"; done
cp $F/app/scripts/*.mjs $F/app/scripts/*.py $R/project/scripts/ 2>/dev/null || true
cp $F/app/scripts/*.sh $R/project/scripts/ 2>/dev/null || true
for t in $F/tools/*.py $F/tools/*.sh $F/tools/*.json; do [ -f "$t" ] && cp "$t" $R/tools/; done
cp $F/audio/*.py $F/audio/cues.json $F/audio/words.json $F/audio/words_kit.json $R/audio/
cp $F/audio/music/*.py $R/audio/music/ 2>/dev/null || true
cp $F/build_shots.sh $R/
for d in CP1_topic_script_voice CP2_plan CP3_style_lock CP4_still_frame_gate CP5_pre_render CP6_review CP6_body_actions upload PASS_FAIL; do
  [ -f $F/checkpoints/$d.md ] && cp $F/checkpoints/$d.md $R/docs/; done
cp "$F/qa_out/He Covered His Oranges in Ice to Stop Them Freezing_vs_rick.md" $R/docs/measure_vs_rick.md
cp $F/tools/progress.py /home/claude/claude-ai-help/templates/cartoon-3d-short/tools/progress.py
echo synced
