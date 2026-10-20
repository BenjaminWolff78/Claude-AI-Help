"""Pick the frames that get motionmaxxing shutter blur, by measuring motion in the base render.

Usage: python3 studio/tools/shutter_plan.py <base_frames_dir> <n_frames> <out_plan.json>

Motion score per frame = mean absolute difference (grey, 1/4 size) to its neighbours. Stepped layers
(line boil on threes, characters on twos, grain) put a floor under the score everywhere, so the
thresholds are set above that floor: frames well above it are fast smooth motion (camera moves,
drops, crashes, page turns) and get a 180-degree shutter of 4 samples; the fastest get 8.
Sub-frame offset 0 is the base render itself, so it is not re-rendered.
"""
import json
import sys

import numpy as np
from PIL import Image

src, n, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]


def load(f):
    im = Image.open(f'{src}/f{f:05d}.jpeg').convert('L').resize((480, 270), Image.BILINEAR)
    return np.asarray(im, dtype=np.float32)


prev = load(0)
d = np.zeros(n)
for f in range(1, n):
    cur = load(f)
    d[f] = np.abs(cur - prev).mean()
    prev = cur
score = np.maximum(d, np.r_[d[1:], 0])
floor = float(np.median(score))
t4 = max(3.2, floor * 2.2)
t8 = max(8.0, floor * 5.0)
four = [int(f) for f in range(n) if score[f] > t4]
eight = [int(f) for f in range(n) if score[f] > t8]
plan = {}
for s in ('0.125', '0.25', '0.375'):
    plan[s] = four
for s in ('0.0625', '0.1875', '0.3125', '0.4375'):
    plan[s] = eight
json.dump(plan, open(out, 'w'))
print(json.dumps({'frames': n, 'median_score': round(floor, 2), 't4': round(t4, 2), 't8': round(t8, 2), 'n4': len(four), 'n8': len(eight), 'subframes': 3 * len(four) + 4 * len(eight)}))
