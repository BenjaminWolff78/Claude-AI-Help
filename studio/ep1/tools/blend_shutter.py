"""Average shutter sub-frames into final frames. Frames without sub-frames are linked to the base render.
Usage: python3 blend_shutter.py plan.json sub_dir base_full_dir out_seq_dir"""
import json, os, sys, glob
import numpy as np
from PIL import Image
plan = json.load(open(sys.argv[1])); sub, base, out = sys.argv[2:5]
os.makedirs(out, exist_ok=True)
frames = {}
for s, lst in plan.items():
    for f in lst: frames.setdefault(f, []).append(s)
def basepath(f):
    ch = f // 600 * 600
    for p in (f'{base}/c{ch:05d}/f{f:04d}.jpeg', f'{base}/c{ch:05d}/f{f-ch:03d}.jpeg'):
        if os.path.exists(p): return p
    raise SystemExit(f'missing base {f}')
n_blend = 0
for f in range(0, 7072):
    dst = f'{out}/f{f:05d}.jpeg'
    if os.path.lexists(dst): os.remove(dst)
    if f in frames:
        acc = None
        for s in frames[f]:
            im = np.asarray(Image.open(f'{sub}/s{s}/f{f:05d}.jpeg')).astype(np.float32)
            acc = im if acc is None else acc + im
        Image.fromarray(np.clip(acc / len(frames[f]) + 0.5, 0, 255).astype(np.uint8)).save(dst, quality=94, subsampling=0)
        n_blend += 1
    else:
        os.symlink(os.path.realpath(basepath(f)), dst)
print('frames', 7072, 'blended', n_blend)
