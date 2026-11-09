import math
def fit(boxes, az, el, fov=44, pad=0.78, side=0, lift=0):
    a, e = math.radians(az), math.radians(el)
    fw = [-math.sin(a)*math.cos(e), -math.sin(e), -math.cos(a)*math.cos(e)]
    rl = math.hypot(fw[0], fw[2]) or 1; rt = [-fw[2]/rl, 0, fw[0]/rl]
    up = [rt[1]*fw[2]-rt[2]*fw[1], rt[2]*fw[0]-rt[0]*fw[2], rt[0]*fw[1]-rt[1]*fw[0]]
    pts = []
    for (b, y0, y1, w) in boxes:
        for y in (y0, y1):
            for s2 in (-1, 1): pts.append([b[0]+rt[0]*w*s2, b[1]+y, b[2]+rt[2]*w*s2])
    O = [sum(p[i] for p in pts)/len(pts) for i in range(3)]
    dot = lambda u, v: sum(x*y for x, y in zip(u, v))
    rel = [[p[i]-O[i] for i in range(3)] for p in pts]
    xs = [dot(r, rt) for r in rel]; ys = [dot(r, up) for r in rel]
    xc = (min(xs)+max(xs))/2; yc = (min(ys)+max(ys))/2
    c = [O[i]+rt[i]*xc+up[i]*yc for i in range(3)]
    tv = math.tan(math.radians(fov)/2); th = tv*1080/1920
    D = 0.5
    for p in pts:
        r = [p[i]-c[i] for i in range(3)]
        D = max(D, abs(dot(r, rt))/(pad*th) - dot(r, fw), abs(dot(r, up))/(pad*tv) - dot(r, fw))
    look = [c[i]+rt[i]*side+up[i]*lift for i in range(3)]
    pos = [c[i]-fw[i]*D+rt[i]*side+up[i]*lift for i in range(3)]
    return pos, look, fov
def proj(pos, look, fov, p):
    """normalised screen coords (-1..1) of point p"""
    f = [look[i]-pos[i] for i in range(3)]; L = math.sqrt(sum(x*x for x in f)); f = [x/L for x in f]
    r = [-f[2], 0, f[0]]; rl = math.hypot(r[0], r[2]); r = [x/rl for x in r]
    u = [r[1]*f[2]-r[2]*f[1], r[2]*f[0]-r[0]*f[2], r[0]*f[1]-r[1]*f[0]]
    d = [p[i]-pos[i] for i in range(3)]; z = sum(a*b for a, b in zip(d, f))
    tv = math.tan(math.radians(fov)/2); th = tv*1080/1920
    return (sum(a*b for a, b in zip(d, r))/(z*th), -sum(a*b for a, b in zip(d, u))/(z*tv), z)
