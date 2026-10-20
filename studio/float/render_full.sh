#!/bin/bash
# FloatVideo at 1920x1080 in 520-frame chunks, resumable with .ok markers
cd /home/claude/claude-motion
TOTAL=2598
OUT=out/float/full
mkdir -p $OUT
for ((s=0; s<TOTAL; s+=520)); do
  e=$((s+519)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  d=$OUT/c$(printf %05d $s)
  [ -f $d.ok ] && continue
  rm -rf $d
  node scripts/raise-frames.mjs --id FloatVideo --out $d --every 1 --from $(python3 -c "print($s/30)") --to $(python3 -c "print($e/30)") --scale 1 2>&1 | grep -v "QA|\|emory" | tail -1
  n=$(ls $d | wc -l); echo "chunk $s-$e: $n frames $(date +%T)"; touch $d.ok
done
echo ALL_CHUNKS_DONE
