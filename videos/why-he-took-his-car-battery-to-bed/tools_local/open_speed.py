"""open_speed.py frames.jsonl plan.json [f0 f1] - mean camera speed (px/frame at 720 wide, the speeds.py measure) over a frame
range (default the first 3 s), skipping cut/dissolve frames: the kit's 'camera speed in the first 3 s' row (Rick ~6)."""
import json, sys, math
import numpy as np
sys.argv += [] ; R = [json.loads(l) for l in open(sys.argv[1])]; P = json.load(open(sys.argv[2]))
a, b = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, 89)
cuts = {round(s['t0'] * 30) for s in P['shots'] if s['in']['type'] in ('cut', 'dissolve')}
def basis(c):
    p = np.array(c['pos'], float); f = np.array(c['look'], float) - p; f /= np.linalg.norm(f); th = math.tan(math.radians(c['fov']) / 2); return p, f, th * 9 / 16
def spd(A, B):
    pa, fa, twa = basis(A); pb, fb, _ = basis(B)
    ang = math.degrees(math.acos(max(-1, min(1, float(fa @ fb))))); hfov = math.degrees(2 * math.atan(twa)); rot = ang / hfov * 720
    dist = max(0.3, float(np.linalg.norm(np.array(A['look']) - pa))); dp = pb - pa; lat = float(np.linalg.norm(dp - (dp @ fa) * fa))
    return rot + lat / (2 * dist * twa) * 720 + abs(B['fov'] - A['fov']) / A['fov'] * 360 + abs(float(dp @ fa)) / dist * 360
byf = {r['f']: r for r in R}
v = [spd(byf[f - 1]['cam'], byf[f]['cam']) for f in range(max(1, a), b + 1) if f in byf and f - 1 in byf and f not in cuts]
print(f"frames {a}-{b}: mean {np.mean(v):.2f} px/f, median {np.median(v):.2f}, max {np.max(v):.1f}")
