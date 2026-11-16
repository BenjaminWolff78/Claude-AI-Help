#!/usr/bin/env python3
"""Measure style-lock frames: mean L*, darkest-5% L*, share of pixels under L*30, blue share, shadow hue.
usage: python3 measure_lock.py frame.jpg [...]   (caption band rows 52-64% excluded)"""
import sys
import numpy as np
from PIL import Image


def lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return L, a, b


for p in sys.argv[1:]:
    im = np.asarray(Image.open(p).convert("RGB").resize((270, 480)), dtype=np.float64)
    keep = np.ones(480, bool); keep[int(0.52 * 480):int(0.64 * 480)] = False
    L, a, b = lab(im[keep].reshape(-1, 3))
    p5 = np.percentile(L, 5)
    dark = (L < 30).mean() * 100
    blue = ((b < -8) & (L > 15)).mean() * 100
    sh = L < np.percentile(L, 20)
    hue = np.degrees(np.arctan2(b[sh].mean(), a[sh].mean())) % 360
    print(f"{p.split('/')[-1]:<16} meanL {L.mean():5.1f}  p5 {p5:5.1f}  <L30 {dark:4.1f}%  blue {blue:4.1f}%  shadowHue {hue:5.0f}  shadowChroma {np.hypot(a[sh].mean(), b[sh].mean()):4.1f}")
