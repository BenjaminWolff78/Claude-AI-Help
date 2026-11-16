#!/usr/bin/env python3
"""Framing check: where heads land on a 9:16 frame for a camera key.
usage (as module): show(name, pos, look, fov, {"earl": (x,y,z), ...}, sit=set())
prints for each figure: head centre (% from left, % from top), feet % from top, head width % of frame width, depth.
Targets (v13): speaking / reacting face eyes at 35-45% from top, never in the caption band (62-78%)."""
import math
HEADY = {'kid': 0.99, 'ftown3': 0.99, 'scarecrow': 1.38}   # head-centre heights (v13 rig: adults 1.30 m)

def basis(pos, look):
    f = [look[i] - pos[i] for i in range(3)]; L = math.sqrt(sum(v * v for v in f)); f = [v / L for v in f]
    r = [-f[2], 0, f[0]]; rl = math.hypot(r[0], r[2]); r = [r[0] / rl, 0, r[2] / rl]
    u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
    return f, r, u

def scr(pos, look, fov, p):
    f, r, u = basis(pos, look)
    d = [p[i] - pos[i] for i in range(3)]; z = sum(d[i] * f[i] for i in range(3))
    if z <= 0.01: return None
    tv = math.tan(math.radians(fov) / 2); th = tv * 9 / 16
    x = sum(d[i] * r[i] for i in range(3)) / z / th; y = sum(d[i] * u[i] for i in range(3)) / z / tv
    return (50 + 50 * x, 50 - 50 * y, z)

def show(name, pos, look, fov, figs, sit=()):
    print(f"{name}: pos {pos} look {look} fov {fov}")
    for k, p in figs.items():
        hy = HEADY.get(k, 0.85 if k in sit else 1.30)
        h = scr(pos, look, fov, (p[0], p[1] + hy, p[2])); ft = scr(pos, look, fov, p); top = scr(pos, look, fov, (p[0], p[1] + (1.25 if k in sit else HEADY.get(k,1.30)+0.38), p[2]))
        if not h: print(f"  {k:9s} behind camera"); continue
        tv = math.tan(math.radians(fov) / 2); th = tv * 9 / 16
        hw = 0.47 / h[2] / th * 50   # head about 0.47 m wide -> % of frame width
        flag = []
        if not (0 < h[0] < 100): flag.append("OUT-X")
        if h[1] < 0 or h[1] > 100: flag.append("OUT-Y")
        if 60 < h[1] < 80: flag.append("CAPTION-BAND")
        if top and top[1] < 0: flag.append("hat-cut-top")
        print(f"  {k:9s} head x {h[0]:5.1f}% y {h[1]:5.1f}%  feet {ft[1] if ft else float('nan'):6.1f}%  hat {top[1] if top else float('nan'):6.1f}%  headW {hw:4.1f}%  d {h[2]:4.1f}  {' '.join(flag)}")

def aim(pos, head, eye_from_top=40, x_from_left=50, fov=44):
    """look point that puts `head` at (x_from_left, eye_from_top) % of the frame from camera `pos`"""
    # iterate: start looking at the head, then rotate so the head lands where wanted
    look = list(head)
    for _ in range(40):
        s = scr(pos, look, fov, head)
        if not s: break
        dx = (s[0] - x_from_left) / 100; dy = (s[1] - eye_from_top) / 100
        f, r, u = basis(pos, look); D = math.dist(pos, look)
        tv = math.tan(math.radians(fov) / 2); th = tv * 9 / 16
        look = [look[i] + r[i] * dx * 2 * th * D + (-u[i]) * (-dy) * 2 * tv * D * -1 for i in range(3)]
    return [round(v, 3) for v in look]
