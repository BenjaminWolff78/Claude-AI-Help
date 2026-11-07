#!/bin/sh
# usage: stills_by_scene.sh <outdir> "id:f,f" "id:f,f" ...   (one bundle per scene; builds only that scene's set)
out=$1; shift
cd /home/claude/crumple/app
for spec in "$@"; do id=${spec%%:*}; fr=${spec#*:}; ONLY=$id REMOTION_TMP=/home/claude/rtmp timeout 2400 node scripts/bridge-stills.mjs $out/s${id}_ $fr 0.35 2>&1 | grep "^still"; done
echo DONE
