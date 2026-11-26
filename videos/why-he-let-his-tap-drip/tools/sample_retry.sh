#!/bin/bash
# usage: sample_retry.sh outdir "f1 f2 ..." ; renders missing frames, relaunching after a crash
out=$1; shift; frames="$*"
for try in 1 2 3 4 5 6; do
  todo=""; for f in $frames; do d=$out/f$(printf %04d $f); ls $d/*.jpeg >/dev/null 2>&1 || todo="$todo,$f"; done
  todo=${todo#,}; [ -z "$todo" ] && { echo ALL_DONE; exit 0; }
  echo "try $try: $todo"; timeout 1500 node scripts/sample_list.mjs $out $todo 0.5 >> $out.log 2>&1
done
