"""Blend shutter sub-frames over the base render and write the finished sequence.

Usage: python3 studio/tools/finalize_mm.py <base_dir> <sub_root> <plan.json> <n_frames> <out_dir>
Frames in the plan are the float average of the base frame (offset 0) and their sub-frames;
all others are hard links to the base frame.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

base, subr, planp, n, out = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5]
plan = json.load(open(planp))
per = {}
for s, fl in plan.items():
    for f in fl:
        per.setdefault(f, []).append(s)
os.makedirs(out, exist_ok=True)
nb = 0
for f in range(n):
    dst = f'{out}/f{f:05d}.jpeg'
    if os.path.lexists(dst):
        os.remove(dst)
    b = f'{base}/f{f:05d}.jpeg'
    if f in per:
        acc = np.asarray(Image.open(b), dtype=np.float32)
        k = 1
        for s in per[f]:
            acc += np.asarray(Image.open(f'{subr}/s{s}/f{f:05d}.jpeg'), dtype=np.float32)
            k += 1
        Image.fromarray(np.clip(acc / k + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=94, subsampling=0)
        nb += 1
    else:
        os.link(b, dst)
print('blended', nb, 'of', n)
