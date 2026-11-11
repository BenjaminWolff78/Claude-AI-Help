#!/usr/bin/env python3
"""Camera key design for the ice video (v13 rig: adult head centre 1.30 m). Prints the framing of every key and the
TS literal to paste. Trees: Earl x=-3.2 (rows z 8, -4, -10 ...; (−3.2, 2) removed), Duane x=4.0 (rows 8.5, 2.5, -3.5),
crowns radius ~1.9 m from 0.8 to 3.5 m high. Fence x=0 (posts 1.1 m, top rail 0.92)."""
import math, sys
sys.path.insert(0, "/home/claude/proj/tools")
from frame import show, aim, scr

TREES = [(-3.2, 8), (-3.2, -4), (-3.2, -10), (-8.7, 2), (-8.7, -4), (4.0, 8.5), (4.0, 2.5), (4.0, -3.5), (9.5, 2.5), (9.5, -3.5)]
def in_crown(p):
    return [t for t in TREES if math.hypot(p[0] - t[0], p[2] - t[1]) < 2.0 and 0.75 < p[1] < 3.6]

KEYS = {}
def key(name, pos, figs, target=None, fov=44, look=None, sit=()):
    """target = (who, x%, y%) puts that head there; or give look directly"""
    if look is None:
        who, xp, yp = target; p = figs[who]; hy = 0.85 if who in sit else {"kid": 0.99, "ftown3": 0.99, "scarecrow": 1.38}.get(who, 1.30)
        look = aim(pos, (p[0], p[1] + hy, p[2]), yp, xp, fov)
    show(name, pos, look, fov, figs, sit)
    c = in_crown(pos)
    if c: print("   !! camera inside a crown", c)
    KEYS[name] = (pos, look, fov)
    return pos, look, fov

def lit(name):
    p, l, f = KEYS[name]; r = lambda v: "[" + ", ".join(f"{x:.2f}" for x in v) + "]"
    return f"{r(p)}, {r(l)}, {f}"

if __name__ == "__main__":
    E1H = (-0.95, 0, -2.2); E1V = (-0.72, 0, 2.95); D1P = (2.55, 0, 1.15); D1F = (0.48, 0, 0.62)
    print("===== SCENE 1")
    key("A0", [-0.1, 1.15, 0.6], {"earl": E1H}, ("earl", 68, 40), 46)
    key("A1", [-1.3, 2.0, -1.8], {"earl": E1H}, look=[-1.68, 1.9, -3.28], fov=40)
    key("B1", [-0.6, 2.75, 0.2], {"duane": D1P, "earl": E1H}, look=[3.6, 1.35, -0.3], fov=48)
    key("B2", [0.55, 1.45, 4.3], {"duane": D1P}, ("duane", 56, 40), 46)
    key("C3", [-0.25, 1.3, 6.4], {"earl": E1V}, ("earl", 46, 40), 48)
    key("D4", [1.75, 1.32, -0.55], {"duane": D1F, "earl": E1V}, ("duane", 36, 40), 46)
    key("D4b", [1.6, 1.3, -0.3], {"duane": D1F, "earl": E1V}, ("duane", 38, 40), 44)
    key("E5", [-2.35, 1.3, 1.45], {"earl": E1V}, ("earl", 52, 40), 44)
