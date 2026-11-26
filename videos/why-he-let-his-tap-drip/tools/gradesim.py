"""Offline copy of grade.ts GradeEffect: undo the preset a still was rendered with, apply a candidate preset,
and measure kit-style luma / saturation.  usage: python3 -I gradesim.py  (edits CANDIDATES below)"""
import sys, glob, json, os, numpy as np
from PIL import Image

KX = np.array([0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0])
E_CB = np.array([0.0, -0.18733, 1.8556]); E_CR = np.array([1.5748, -0.46813, 0.0])
W = np.array([0.2126, 0.7152, 0.0722])

def tint(cb, cr): return cb * E_CB + cr * E_CR

def mono(ky):
    n = len(KX); h = np.diff(KX); d = np.diff(ky) / h; m = np.zeros(n); m[0] = d[0]; m[-1] = d[-1]
    for k in range(1, n - 1):
        if d[k - 1] * d[k] <= 0: m[k] = 0; continue
        w1 = 2 * h[k] + h[k - 1]; w2 = h[k] + 2 * h[k - 1]; m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k])
    return m

def curve(v, ky):
    ky = np.asarray(ky, float); m = mono(ky); v = np.clip(v, 0, 1); out = np.zeros_like(v)
    for k in range(6):
        x0, x1 = KX[k], KX[k + 1]; sel = (v >= x0) & ((v < x1) | (k == 5))
        hh = x1 - x0; t = (v[sel] - x0) / hh; t2 = t * t; t3 = t2 * t
        out[sel] = (2*t3 - 3*t2 + 1) * ky[k] + (t3 - 2*t2 + t) * hh * m[k] + (-2*t3 + 3*t2) * ky[k+1] + (t3 - t2) * hh * m[k+1]
    return out

def ss(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def zones(y):
    wS = (1 - ss(0.04, 0.68, y)) * ss(0.12, 0.26, y); wH = ss(0.55, 1.0, y); wM = 1 - wS - wH
    return wS, wM, wH

def vig(shape, k, r0):
    H, Wd = shape; yy, xx = np.mgrid[0:H, 0:Wd]; u = (xx + 0.5) / Wd * 2 - 1; v = (yy + 0.5) / H * 2 - 1
    r = np.sqrt(u * u + v * v) * 0.70710678; return 1 - k * ss(r0, 1.0, r)

def forward(src, P):
    c = np.stack([curve(src[..., i], P['ky']) for i in range(3)], -1); y = c @ W
    wS, wM, wH = zones(y); sat = P['sat']
    s = sat[1] + (sat[0] - sat[1]) * wS + (sat[2] - sat[1]) * wH; s = 1 + (s - 1) * ss(0.08, 0.2, y)
    c = y[..., None] + s[..., None] * (c - y[..., None])
    c = c + wS[..., None] * tint(*P['tintS']) + wM[..., None] * tint(*P['tintM']) + wH[..., None] * tint(*P['tintH'])
    c = c * vig(src.shape[:2], *P['vig'])[..., None]
    return np.clip(c, 0, 1)

def inverse(out, P):
    V = vig(out.shape[:2], *P['vig'])[..., None]; c = out / V; y = c @ W
    wS, wM, wH = zones(y); sat = P['sat']
    s = sat[1] + (sat[0] - sat[1]) * wS + (sat[2] - sat[1]) * wH; s = 1 + (s - 1) * ss(0.08, 0.2, y)
    c = c - (wS[..., None] * tint(*P['tintS']) + wM[..., None] * tint(*P['tintM']) + wH[..., None] * tint(*P['tintH']))
    c = y[..., None] + (c - y[..., None]) / s[..., None]
    xs = np.linspace(0, 1, 4097); ys = curve(xs, P['ky'])
    return np.clip(np.stack([np.interp(c[..., i], ys, xs) for i in range(3)], -1), 0, 1)

def kit(img):
    f = np.round(img * 255).astype(np.int32); l = (54*f[..., 0] + 183*f[..., 1] + 19*f[..., 2]) >> 8
    mx = f.max(2); mn = f.min(2)
    return l.mean(), np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean(), 100 * (l < 14).mean()

OFFICE = dict(ky=[0.04, 0.31, 0.66, 0.875, 0.95, 0.968, 0.975], sat=[1.0, 0.9, 1.05], tintS=[0.09, -0.05], tintM=[0.06, -0.04], tintH=[-0.02, 0.02], vig=[0.26, 0.36])
DAWN = dict(ky=[0.045, 0.27, 0.56, 0.84, 0.95, 0.963, 0.97], sat=[1.0, 1.12, 1.0], tintS=[0.036, -0.044], tintM=[0.008, -0.01], tintH=[-0.012, 0.006], vig=[0.12, 0.42])
