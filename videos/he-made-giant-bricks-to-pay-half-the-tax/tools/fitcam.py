#!/usr/bin/env python3
"""fit a 9:16 camera to a set of points: look = centroid (y = ly), camera on a ray at yaw (deg, 0 = looking -z,
90 = looking -x), at height cy, pulled back until every point is inside [m, 100 - m] % horizontally."""
import math, sys
sys.path.insert(0, "/home/claude/p3/tools")
from frame import scr
def fit(pts, yaw, cy=1.45, ly=1.15, fov=50, m=14, dmin=1.5, dmax=40):
    cx = sum(p[0] for p in pts.values()) / len(pts); cz = sum(p[2] for p in pts.values()) / len(pts)
    look = (cx, ly, cz); a = math.radians(yaw); back = (math.sin(a), 0, math.cos(a))
    d = dmin
    while d < dmax:
        pos = (cx + back[0] * d, cy, cz + back[2] * d)
        ok = all((s := scr(pos, look, fov, p)) and m <= s[0] <= 100 - m and 5 <= s[1] <= 95 for p in pts.values())
        if ok: break
        d += 0.05
    pos = (round(cx + back[0] * d, 2), cy, round(cz + back[2] * d, 2))
    return pos, (round(cx, 2), ly, round(cz, 2)), {k: tuple(round(v, 1) for v in scr(pos, look, fov, p)) for k, p in pts.items()}
if __name__ == "__main__":
    import json; a = json.loads(sys.argv[1]); print(fit({k: tuple(v) for k, v in a["pts"].items()}, a["yaw"], a.get("cy", 1.45), a.get("ly", 1.15), a.get("fov", 50), a.get("m", 14)))

def place(pos, look, fov, xpct, depth, ground=0.0):
    """world feet point at screen x% and camera depth `depth` (m along the view axis), on the ground plane"""
    from frame import basis
    f, r, u = basis(pos, look)
    tv = math.tan(math.radians(fov) / 2); th = tv * 9 / 16
    x = (xpct - 50) / 50 * th * depth
    p = [pos[i] + f[i] * depth + r[i] * x for i in range(3)]
    return (round(p[0], 2), ground, round(p[2], 2))
