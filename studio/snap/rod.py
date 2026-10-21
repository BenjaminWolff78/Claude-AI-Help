"""Planar elastic rod, clamped at both ends, bent until it breaks; records the cascade.
Explicit symplectic Euler with stretch springs, discrete bending, light damping.
Usage: python3 rod.py <out.json> [--twist]
"""
import json, sys, os
import numpy as np

N = 121
L = 1.0
h = L / (N - 1)
m = 1.0 / N
KB = 500.0          # bending stiffness (per node)
KS = 2.0e5           # stretch stiffness
DAMP = float(os.environ.get("DMP", 1.5))
TH_C = 0.0195         # breaking turning angle (curvature * h)
twist = '--twist' in sys.argv
import os
rng = np.random.default_rng(int(os.environ.get('SEED', 3)))
weak = 1 + float(os.environ.get('FLAW', 0.12)) * rng.random(N)   # tiny flaws, like a real stick
weak *= 1 + float(os.environ.get('GRAD', 0.0)) * (np.abs(np.linspace(-1, 1, N))) ** 2
weak[N // 2 - 3:N // 2 + 4] = 0.97
weak[:14] = 9; weak[-14:] = 9  # the part held in the fingers can't break  # the middle is bent most when the ends come together
x = np.stack([np.linspace(0, L, N), np.zeros(N)], 1)
v = np.zeros_like(x)
rest = np.full(N - 1, h)
alive_edge = np.ones(N - 1, bool)     # edge i joins node i and i+1
alive_bend = np.ones(N, bool); alive_bend[[0, N - 1]] = False

def G(e):
    n2 = (e ** 2).sum(1, keepdims=True)
    return np.stack([-e[:, 1], e[:, 0]], 1) / n2

def forces(x):
    f = np.zeros_like(x)
    e = x[1:] - x[:-1]
    ln = np.linalg.norm(e, axis=1)
    s = (KS * (ln - rest) / ln)[:, None] * e * alive_edge[:, None]
    f[:-1] += s; f[1:] -= s
    e0, e1 = e[:-1], e[1:]
    th = np.arctan2(e0[:, 0] * e1[:, 1] - e0[:, 1] * e1[:, 0], (e0 * e1).sum(1))
    ok = alive_bend[1:-1] & alive_edge[:-1] & alive_edge[1:]
    th = th * ok
    g0, g1 = G(e0), G(e1)
    c = (-KB * th)[:, None]
    f[2:] += c * g1
    f[1:-1] += c * (-g1 - g0)
    f[:-2] += c * g0
    return f, th

def clamp_pose(t):
    # both clamps rotate inward and slide together: phi up to 1.2 rad over T_LOAD
    k = min(1.0, t / T_LOAD)
    phi = 1.25 * k + 1e-6
    gap = L * np.sin(phi) / phi * (1 - 0.06 * k)
    return phi, gap

T_LOAD = 3.0
dt = 1.0e-5
fps_slow = 1500   # samples per sim-second recorded after the first break
frames, breaks = [], []
t = 0.0
first = None
rec_every_load = int(0.05 / dt)
rec_every = int(1 / fps_slow / dt)
step = 0
while True:
    phi, gap = clamp_pose(t)
    cx = L / 2
    lx, rx = cx - gap / 2, cx + gap / 2
    # clamp the two end nodes of each side (until that side's piece is held)
    x[0] = [lx, 0.0]; x[1] = [lx + h * np.cos(phi), h * np.sin(phi)]
    x[N - 1] = [rx, 0.0]; x[N - 2] = [rx - h * np.cos(phi), h * np.sin(phi)]
    f, th = forces(x)
    dmp = 30.0 if first is None else DAMP
    if twist and first is not None and t - first < 0.004:
        dmp = 20000.0  # model: the unwinding twist wave carries the snap-back energy away
    v += dt * (f / m - dmp * v)
    v[[0, 1, N - 2, N - 1]] = 0
    x += dt * v
    # fracture
    # macro curvature: average turning over 7 nodes, so node-scale ringing can't count as a crack
    ths = np.convolve(np.abs(th), np.ones(7) / 7, mode='same')
    over = np.where(ths > TH_C * weak[1:-1])[0] + 1
    if len(over):
        i = over[np.argmax(ths[over - 1])]
        alive_edge[i] = False
        alive_bend[i] = alive_bend[i + 1] = False
        breaks.append({'t': t, 'node': int(i)})
        if first is None:
            first = t
            pass
    if first is None:
        if step % rec_every_load == 0:
            frames.append({'t': t, 'x': x.round(5).tolist()})
    else:
        if (t - first < 0.003) or step % rec_every == 0:
            frames.append({'t': t, 'x': x.round(5).tolist(), 'edges': alive_edge.astype(int).tolist()})
        if t - first > 0.35:
            break
    t += dt; step += 1
    if t > T_LOAD + 2:
        break
print('breaks', [(round(b['t'] - (first or 0), 5), b['node']) for b in breaks], 'frames', len(frames))
json.dump({'N': N, 'breaks': breaks, 'first': first, 'frames': frames}, open(sys.argv[1], 'w'))
