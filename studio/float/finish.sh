#!/bin/bash
set -e
cd /home/claude/claude-motion
N=2598
SEQ=out/float/seq0; rm -rf $SEQ; mkdir -p $SEQ
for d in out/float/full/c?????; do for f in $d/*.jpeg; do b=$(basename $f .jpeg); n=$((10#${b#f})); ln -f $f $SEQ/f$(printf %05d $n).jpeg; done; done
echo "frames: $(ls $SEQ | wc -l) of $N"
python3 studio/tools/shutter_plan.py $SEQ $N out/float/plan.json
