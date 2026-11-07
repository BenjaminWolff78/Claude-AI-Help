#!/bin/sh
# render the whole film in 60-frame chunks (skips finished ones); safe to re-run.
# A chunk whose log shows WebGL shader failures (broken GPU state -> white / ungraded frames) is discarded and redone.
cd /home/claude/forger/app
mkdir -p out/old_chunks
a=0; n=0; MAXN=${MAXN:-7}
while [ $a -le 1919 ]; do
  b=$((a + 59)); [ $b -gt 1919 ] && b=1919
  f=out/chunks/c_$(printf %04d $a).mp4
  tries=0
  [ ! -f $f ] && [ $n -ge $MAXN ] && { echo BATCHSTOP >> out/render_all.log; exit 0; }
  [ ! -f $f ] && n=$((n + 1))
  while [ ! -f $f ] && [ $tries -lt 3 ]; do
    node scripts/render_range.mjs $a $b > out/last_chunk.log 2>&1
    cat out/last_chunk.log >> out/render_all.log
    if grep -q "Shader Error" out/last_chunk.log; then
      [ -f $f ] && mv $f out/old_chunks/bad_$(printf %04d $a)_$(date +%s).mp4
      echo "RETRY $a (shader errors)" >> out/render_all.log
    fi
    tries=$((tries + 1))
  done
  a=$((a + 60))
done
echo ALLDONE >> out/render_all.log
