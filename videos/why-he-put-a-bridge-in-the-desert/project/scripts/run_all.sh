#!/bin/sh
# render the whole film in 60-frame chunks (skips finished ones); safe to re-run
cd /home/claude/bridge/app
a=0
while [ $a -le 1913 ]; do
  b=$((a + 59)); [ $b -gt 1913 ] && b=1913
  node scripts/render_range.mjs $a $b >> out/render_all.log 2>&1
  a=$((a + 60))
done
echo ALLDONE >> out/render_all.log
