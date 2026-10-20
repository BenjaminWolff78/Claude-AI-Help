#!/bin/bash
# Render RaiseVideo at 1920x1080 in 600-frame chunks (resumable via .ok markers), then encode + mux.
cd /home/claude/claude-motion
TOTAL=$(python3 -c "import json;print(round(json.load(open('src/raise/timeline.json'))['duration']*30))")
OUT=out/raise/full
mkdir -p $OUT
for ((s=0; s<TOTAL; s+=600)); do
  e=$((s+599)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  d=$OUT/c$(printf %05d $s)
  [ -f $d.ok ] && continue
  rm -rf $d
  node scripts/raise-frames.mjs --out $d --every 1 --from $(python3 -c "print($s/30)") --to $(python3 -c "print($e/30)") --scale 1 2>&1 | grep -v "QA|" | tail -1
  n=$(ls $d | wc -l); echo "chunk $s-$e: $n frames"; touch $d.ok
done
echo ALL_CHUNKS_DONE
