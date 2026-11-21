#!/bin/bash
# wait for the running chunk render (pre-fix bundle) to finish c_0000 + c_0880,
# then retire the chunks touched by the sweep fixes and relaunch with a fresh bundle
cd /home/claude/p8/app
while pgrep -f render_chunks.mjs >/dev/null; do sleep 30; done
for c in 0560 0640 0720 1120 1520; do
  src=out/chunks/c_$c.mp4
  [ -f "$src" ] || continue
  v=1; while [ -f out/old/c_${c}_v$v.mp4 ]; do v=$((v+1)); done
  mv "$src" out/old/c_${c}_v$v.mp4
done
pkill -f chrome
(timeout 7100 node scripts/render_chunks.mjs >> /home/claude/p8/render.log 2>&1 &)
echo "chain relaunched $(date +%T)" >> /home/claude/p8/render.log
