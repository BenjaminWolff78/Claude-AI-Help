#!/bin/bash
cd /home/claude/claude-motion
TOTAL=2262
OUT=out/snap/full
mkdir -p $OUT
for ((s=0; s<TOTAL; s+=460)); do
  e=$((s+459)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  d=$OUT/c$(printf %05d $s)
  [ -f $d.ok ] && continue
  rm -rf $d
  node scripts/raise-frames.mjs --id SnapVideo --out $d --every 1 --from $(python3 -c "print($s/30)") --to $(python3 -c "print($e/30)") --scale 1 2>&1 | grep -v "QA|\|emory\|webpack\|while" | tail -1
  n=$(ls $d | wc -l); echo "chunk $s-$e: $n frames $(date +%T)"; touch $d.ok
done
echo ALL_CHUNKS_DONE
