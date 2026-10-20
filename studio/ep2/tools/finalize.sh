#!/bin/bash
set -e
cd /home/claude/claude-motion
N=The_Medicare_Cliff; D=/home/claude/work/ep2/deliver
python3 - <<'P'
import json, os
plan = json.load(open('/tmp/plan_ep2.json')); frames = {}
for s, l in plan.items():
    for f in l: frames.setdefault(f, []).append(s)
import numpy as np
from PIL import Image
S = 'out/ep2/seq0'; O = 'out/ep2/seq_mm'; os.makedirs(O, exist_ok=True)
nb = 0
for f in range(6599):
    dst = f'{O}/f{f:05d}.jpeg'
    if os.path.lexists(dst): os.remove(dst)
    if f in frames:
        acc = None
        for s in frames[f]:
            im = np.asarray(Image.open(f'out/ep2/sub/s{s}/f{f:05d}.jpeg')).astype(np.float32)
            acc = im if acc is None else acc + im
        Image.fromarray(np.clip(acc / len(frames[f]) + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=94, subsampling=0); nb += 1
    else:
        os.symlink(os.path.realpath(f'{S}/f{f:05d}.jpeg'), dst)
print('blended', nb)
P
ffmpeg -y -loglevel error -framerate 30 -i out/ep2/seq_mm/f%05d.jpeg -i out/ep2/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -tune animation -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest $D/$N.mp4
ffmpeg -y -loglevel error -i $D/$N.mp4 -c:v libx264 -preset medium -b:v 850k -maxrate 1100k -bufsize 2200k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart $D/${N}_small.mp4
ls -l $D/*.mp4
for f in $D/$N.mp4 $D/${N}_small.mp4; do echo "== $f"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of compact $f; ffmpeg -nostats -i $f -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:"; done
echo FIN_DONE
