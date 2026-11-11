#!/bin/sh
# mirror this video's code (no media, no reference frames) into the repo folder
set -e
R=/home/claude/repo/videos/owners-sank-their-own-ships-so-he-painted-a-line; F=/home/claude/ship
mkdir -p $R/shot_sections $R/project/src $R/project/scripts $R/tools $R/audio $R/channel_art
cp $F/sec/*.ts $R/shot_sections/
cd $F/app/src && find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) | while read p; do mkdir -p "$R/project/src/$(dirname "$p")"; cp "$p" "$R/project/src/$p"; done
cp $F/app/scripts/*.mjs $F/app/scripts/*.py $F/app/scripts/*.sh $R/project/scripts/ 2>/dev/null || true
for t in cam_moves.py fitpy.py proj.py camcheck.py gate.py between_sweep.py expression_plan.json qa_report.py final_mux.sh final_sheets.sh stills_by_scene.sh sync_repo.sh; do [ -f $F/tools/$t ] && cp $F/tools/$t $R/tools/; done
cp $F/audio/*.py $F/audio/cues.json $F/audio/words.json $R/audio/
[ -d $F/audio/synth ] && mkdir -p $R/audio/synth && cp $F/audio/synth/*.py $R/audio/synth/ 2>/dev/null || true
[ -d $F/audio/music ] && mkdir -p $R/audio/music && cp $F/audio/music/*.py $R/audio/music/ 2>/dev/null || true
cp $F/art/*.py $F/art/*.json $R/channel_art/ 2>/dev/null || true
cp "$F/storyboard.md" $F/upload.md $F/build_shots.sh $R/
[ -f $F/script.md ] && cp $F/script.md $R/ || true
[ -f $F/expression_plan.md ] && cp $F/expression_plan.md $R/ || true
[ -f $F/audio/cue_sheet.md ] && cp $F/audio/cue_sheet.md $R/ || true
[ -f $F/PASS_FAIL.md ] && cp $F/PASS_FAIL.md $R/ || true
echo synced
