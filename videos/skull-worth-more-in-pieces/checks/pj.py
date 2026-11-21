"""Quick framing check: where world points land in a 9:16 frame. x -1 left .. +1 right, y -1 bottom .. +1 top.
usage: from pj import shot; shot(cam, look, fov, {"agus": (x,y,z,h)}) prints feet/head positions (h = card top height)."""
import math
def proj(cam, look, fov, p):
    f = [look[i] - cam[i] for i in range(3)]; L = math.sqrt(sum(v * v for v in f)); f = [v / L for v in f]
    r = [-f[2], 0, f[0]]; rl = math.hypot(r[0], r[2]); r = [r[0] / rl, 0, r[2] / rl]
    u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
    d = [p[i] - cam[i] for i in range(3)]; z = sum(d[i] * f[i] for i in range(3))
    tv = math.tan(math.radians(fov) / 2); th = tv * 9 / 16
    return sum(d[i] * r[i] for i in range(3)) / z / th, sum(d[i] * u[i] for i in range(3)) / z / tv, z
def shot(name, cam, look, fov, pts):
    print(name)
    for k, p in pts.items():
        x, y, z = proj(cam, look, fov, p[:3])
        h = p[3] if len(p) > 3 else None
        s = f"  {k:9s} x {x:+.2f} y {y:+.2f} d {z:.2f}"
        if h is not None:
            _, yt, _ = proj(cam, look, fov, (p[0], p[1] + h, p[2])); s += f"  top {yt:+.2f}  height {(yt - y) / 2 * 100:.0f}%"
        print(s)
def fit(boxes, az, el, fov=44, pad=0.78, side=0, lift=0):
    a = math.radians(az); e = math.radians(el)
    fw = [-math.sin(a) * math.cos(e), -math.sin(e), -math.cos(a) * math.cos(e)]
    rl = math.hypot(fw[0], fw[2]) or 1; rt = [-fw[2] / rl, 0, fw[0] / rl]
    up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]]
    pts = []
    for (b, y0, y1, w) in boxes:
        for y in (y0, y1):
            for s2 in (-1, 1): pts.append([b[0] + rt[0] * w * s2, b[1] + y, b[2] + rt[2] * w * s2])
    O = [sum(p[i] for p in pts) / len(pts) for i in range(3)]
    dot = lambda u, v: u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
    rel = [[p[i] - O[i] for i in range(3)] for p in pts]
    xs = [dot(r, rt) for r in rel]; ys = [dot(r, up) for r in rel]
    xc = (min(xs) + max(xs)) / 2; yc = (min(ys) + max(ys)) / 2
    c = [O[i] + rt[i] * xc + up[i] * yc for i in range(3)]
    tv = math.tan(math.radians(fov) / 2); th = tv * 1080 / 1920
    D = 0.5
    for p in pts:
        r = [p[i] - c[i] for i in range(3)]
        D = max(D, abs(dot(r, rt)) / (pad * th) - dot(r, fw), abs(dot(r, up)) / (pad * tv) - dot(r, fw))
    look = [c[i] + rt[i] * side + up[i] * lift for i in range(3)]
    pos = [c[i] - fw[i] * D + rt[i] * side + up[i] * lift for i in range(3)]
    return pos, look, fov
def body(p, y0=0, y1=2.05, w=0.32): return (p, y0, y1, w)
def fshot(name, boxes, az, el, fov, pad, pts, side=0, lift=0):
    pos, look, fov = fit(boxes, az, el, fov, pad, side, lift)
    shot(name + f"  pos {[round(v,2) for v in pos]} look {[round(v,2) for v in look]}", pos, look, fov, pts)
    return pos, look
def fitH(boxes, az, el, fov, pct, pad=0.92, side=0, lift=0):
    pos, look, fov = fit(boxes, az, el, fov, pad, side, lift)
    d = [pos[i] - look[i] for i in range(3)]; L = math.sqrt(sum(v * v for v in d))
    D = 0.52 / pct / (2 * math.tan(math.radians(fov) / 2) * 0.5625); k = max(1, D / L)
    return [look[i] + d[i] * k for i in range(3)], look, fov
POSTS = [(x, z) for x in (-4.2, -2.6, 2.6, 4.2) for z in (-4.8, 1.2)] + [(x, z) for x in (-1.6, 1.6) for z in (-3.6, -2.2)]
def hshot(name, boxes, az, el, fov, pct, pts, side=0, lift=0, posts=POSTS):
    pos, look, fov = fitH(boxes, az, el, fov, pct, 0.92, side, lift)
    shot(name + f"  pos {[round(v,2) for v in pos]} look {[round(v,2) for v in look]}", pos, look, fov, pts)
    for (x, z) in posts:
        X, Y, Dp = proj(pos, look, fov, (x, 1.3, z))
        if Dp > 0 and abs(X) < 1.0: print(f"    POST ({x},{z}) in frame at x {X:+.2f} depth {Dp:.2f}")
    return pos, look
