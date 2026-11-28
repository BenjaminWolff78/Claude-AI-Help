#!/usr/bin/env python3
"""framing.py frames.jsonl [shot ...] - per shot, at 4 sample frames: every head's screen x/y (% of frame) and width (% of
frame width), plus the tags in frame. Flags: OUT (centre off frame), CAP (face in the caption band y 60-74%), CUT (sliced)."""
import json, math, sys
import numpy as np
R = [json.loads(l) for l in open(sys.argv[1])]
want = set(sys.argv[2:])
def basis(c):
    p = np.array(c['pos'], float); f = np.array(c['look'], float) - p; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
    th = math.tan(math.radians(c['fov']) / 2); return p, f, r, u, th, th * 9 / 16
def proj(B, q):
    p, f, r, u, th, tw = B; d = np.array(q, float) - p; z = float(d @ f)
    if z <= 0.02: return None
    return 0.5 + 0.5 * float(d @ r) / (z * tw), 0.5 - 0.5 * float(d @ u) / (z * th), z
shots = {}
for x in R: shots.setdefault(x['shot'], []).append(x)
for sh, fr in shots.items():
    if want and sh not in want: continue
    print(f"== {sh} ({fr[0]['f']}-{fr[-1]['f']}) subj={fr[len(fr)//2].get('subj')}")
    for x in [fr[0], fr[len(fr) // 3], fr[2 * len(fr) // 3], fr[-1]]:
        B = basis(x['cam']); out = []
        for c in x['cast']:
            q = proj(B, c['head'])
            if not q: out.append(f"{c['who']}:behind"); continue
            w = c['headW'] / (q[2] * B[5]) * 0.5 * 100
            fl = ''
            if not (0 < q[0] < 1 and 0 < q[1] < 1): fl = ' OUT'
            elif 0.60 <= q[1] <= 0.74: fl = ' CAP'
            if q[0] - w / 200 < 0 or q[0] + w / 200 > 1 or q[1] - w / 200 < 0: fl += ' CUT'
            out.append(f"{c['who']}:x{q[0]*100:.0f} y{q[1]*100:.0f} w{w:.0f}{fl}")
        tg = []
        for t in x.get('tags', []):
            q = proj(B, t['pos'])
            if q and 0 < q[0] < 1 and 0 < q[1] < 1: tg.append(t['name'])
        print(f"  f{x['f']}: " + ' | '.join(out) + ("  [" + ', '.join(sorted(set(tg))) + "]" if tg else ''))
