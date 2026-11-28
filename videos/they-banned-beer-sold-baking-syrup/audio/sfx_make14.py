"""Sounds for "They Banned Beer, So He Sold It as Bread Syrup" (48 kHz, original synthesis, no samples).
Effects (mono unless noted, the mixer pans them): syrup pour, label slap, can clink, barrel gush, can capper, chain + steps,
the agents' laugh with a desk slap, chalk, the count board, can stacking, the hand truck, the rising loaf, three knocks,
the door, the window rattle, the cellar pop (the turn), the chain of pops down the street, water + the yeast cake plop,
the fizz with a burp, the batter froth, the caps blowing off, the bulkhead doors, the final hit, the unlock stinger.
Stereo ambience beds (decorrelated L/R, 13 s seamless loops): brewery, street by day, grocery, town wind, street at night,
cellar."""
import numpy as np, soundfile as sf, os
SR = 48000; R = np.random.default_rng(1427)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx"); os.makedirs(OUT, exist_ok=True)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def tilt(x, lo, hi, slope=1.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); f[0] = 1
    X *= (1 / f ** (slope / 2)) * (f >= lo) * (1 / (1 + (f / hi) ** 4)); return np.fft.irfft(X, len(x))
def put(y, x, t, pan=0.0):
    i = int(t * SR); j = min(len(y), i + len(x))
    if j <= i: return y
    if y.ndim == 1: y[i:j] += x[:j - i]
    else:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); y[i:j, 0] += x[:j - i] * l; y[i:j, 1] += x[:j - i] * r
    return y
def ring(fs, d, dec): c = tt(d); return sum(np.sin(2 * np.pi * f * c) * a for f, a in fs) * np.exp(-c * dec)
def noise(d): return R.normal(0, 1, int(d * SR))
def mx(*xs):
    """add mono arrays of different lengths (zero-padded to the longest)"""
    n = max(len(x) for x in xs); y = np.zeros(n)
    for x in xs: y[:len(x)] += x
    return y
def env(d, a=0.005, r=None):
    c = tt(d); e = np.minimum(1, c / max(a, 1e-4))
    if r: e *= np.minimum(1, np.maximum(0, (d - c) / r))
    return e
def save(name, y, peak=0.7):
    y = y / (np.abs(y).max() + 1e-9) * peak; sf.write(os.path.join(OUT, name + ".wav"), y.astype(np.float32), SR)
def loopify(y, xf=1.0):
    n = int(xf * SR); r = np.linspace(0, 1, n)[:, None]; z = y[n:].copy(); z[-n:] = y[-n:] * (1 - r) + y[:n] * r; return z
def glug(f0=140, d=0.16, amp=1.0):
    """one thick bubble: a falling-then-rising resonance with a soft body"""
    c = tt(d); f = f0 * (1.0 + 0.9 * np.exp(-c * 30)) * (1 + 0.35 * c / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * c / d) ** 1.4 * amp
def tin(f0, d=0.35, dec=16):
    """a tin can's ring: a few inharmonic partials"""
    return ring([(f0, 1), (f0 * 2.31, 0.55), (f0 * 3.9, 0.3), (f0 * 5.2, 0.15)], d, dec)
def wood(d=0.18, f0=180):
    return ring([(f0, 1), (f0 * 2.13, 0.5), (f0 * 3.7, 0.25)], d, 30) * 0.6 + bp(noise(d), 150, 2200) * np.exp(-tt(d) * 45) * 0.7

# ---------------------------------------------------------------- syrup pouring from the spout into a can (thick, slow glugs)
d = 2.6; y = bp(noise(d), 200, 1400) * 0.05 * env(d, 0.1, 0.3)
t = 0.05
while t < d - 0.2:
    put(y, glug(R.uniform(110, 170), R.uniform(0.12, 0.2), R.uniform(0.4, 0.9)), t); t += R.uniform(0.16, 0.3)
save("syrup_pour", y, 0.6)
# ---------------------------------------------------------------- the label slapped on, then smoothed with a palm
y = np.zeros(int(0.7 * SR))
put(y, bp(noise(0.05), 300, 5000) * np.exp(-tt(0.05) * 90), 0.0); put(y, tin(980, 0.3, 22) * 0.35, 0.002)
put(y, bp(noise(0.35), 1500, 7000) * np.sin(np.pi * tt(0.35) / 0.35) * 0.18, 0.18)
save("label_slap", y)
# ---------------------------------------------------------------- one can set down on another (a dull clink)
y = np.zeros(int(0.5 * SR)); put(y, tin(1150, 0.4, 18), 0.0); put(y, bp(noise(0.02), 800, 6000) * np.exp(-tt(0.02) * 200) * 0.6, 0.0)
save("can_clink", y, 0.6)
# ---------------------------------------------------------------- the barrel tipped: a wooden thud, then beer gushing into the drain
d = 1.9; y = np.zeros(int(d * SR))
put(y, wood(0.3, 95) * 1.2, 0.0)
g = bp(noise(1.6), 250, 6000) * env(1.6, 0.08, 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * tt(1.6)) ** 2)
put(y, g * 0.5, 0.2)
for k in range(26): put(y, glug(R.uniform(160, 320), 0.09, R.uniform(0.2, 0.5)), 0.25 + R.uniform(0, 1.3))
save("barrel_gush", y)
# ---------------------------------------------------------------- the hand capper pressing a lid on: crimp + clack
y = np.zeros(int(0.45 * SR))
put(y, bp(noise(0.06), 600, 5000) * np.exp(-tt(0.06) * 60) * 0.5, 0.0); put(y, tin(760, 0.3, 26) * 0.7, 0.05); put(y, wood(0.12, 240) * 0.5, 0.05)
save("capper", y)
y = np.zeros(int(1.3 * SR)); put(y, np.pad(np.zeros(1), (0, 0)), 0)
for k, t0 in enumerate([0.0, 0.62]):
    put(y, bp(noise(0.06), 600, 5000) * np.exp(-tt(0.06) * 60) * 0.5, t0); put(y, tin(760 + 40 * k, 0.3, 26) * 0.7, t0 + 0.05); put(y, wood(0.12, 240) * 0.5, t0 + 0.05)
save("capper2", y)
# ---------------------------------------------------------------- the agent strides in: heavy steps and a chain jingling on his shoulder
d = 2.2; y = np.zeros(int(d * SR))
for k in range(5):
    t0 = 0.05 + k * 0.42; put(y, wood(0.12, 120) * 0.8, t0)
    for j in range(7): put(y, tin(R.uniform(2400, 4200), 0.08, 60) * R.uniform(0.08, 0.2), t0 + 0.02 + R.uniform(0, 0.12))
save("steps_chain", y)
# ---------------------------------------------------------------- the agents laughing (three voices, "ha"s on a falling pitch) + a desk slap
def voice_ha(f0, n, gap, d0, seed):
    g = np.random.default_rng(seed); y = np.zeros(int((n * gap + 0.5) * SR))
    for k in range(n):
        dd = d0 * g.uniform(0.8, 1.15); c = tt(dd); f = f0 * (1 - 0.18 * k / n) * (1 + 0.06 * np.sin(2 * np.pi * 7 * c)) * (1 - 0.08 * c / dd)
        ph = np.cumsum(f) / SR; src = (np.mod(ph, 1.0) - 0.5) * 2                                   # a buzzy glottal saw
        src = src - np.convolve(src, np.ones(9) / 9, "same") * 0.3
        vow = bp(src, 500, 1100) * 1.0 + bp(src, 1100, 1600) * 0.6 + bp(src, 2300, 3000) * 0.25        # an "ah"
        asp = bp(g.normal(0, 1, len(c)), 900, 4000) * 0.25 * np.exp(-c * 30)                          # the breathy "h"
        e = np.minimum(1, c / 0.02) * np.minimum(1, (dd - c) / 0.05)
        put(y, (vow + asp) * e * g.uniform(0.7, 1.0), k * gap * g.uniform(0.92, 1.08))
    return y
d = 1.9; y = np.zeros((int(d * SR), 2))
put(y, voice_ha(150, 7, 0.17, 0.11, 1), 0.0, -0.4); put(y, voice_ha(118, 6, 0.2, 0.13, 2), 0.12, 0.35); put(y, voice_ha(185, 6, 0.15, 0.1, 3), 0.3, 0.05)
put(y, mx(wood(0.2, 140) * 1.4, bp(noise(0.05), 400, 6000) * np.exp(-tt(0.05) * 80) * 0.8), 0.55, 0.2)   # the desk slap
save("laugh_desk", y, 0.6)
# ---------------------------------------------------------------- chalk on a truck door (four strokes)
y = np.zeros(int(1.1 * SR))
for k, (t0, dd) in enumerate([(0.0, 0.2), (0.26, 0.16), (0.46, 0.22), (0.74, 0.25)]):
    c = tt(dd); s = bp(noise(dd), 1800, 9000) * (0.6 + 0.4 * np.sin(2 * np.pi * 47 * c) ** 2) * np.sin(np.pi * c / dd) ** 0.6; put(y, s, t0)
save("chalk", y, 0.5)
# ---------------------------------------------------------------- the count board's wooden number card flipping over and settling
y = np.zeros(int(0.6 * SR)); put(y, wood(0.15, 300) * 0.8, 0.0); put(y, wood(0.18, 260) * 0.5, 0.09); put(y, bp(noise(0.25), 2000, 8000) * np.exp(-tt(0.25) * 20) * 0.08, 0.0)
save("board_flip", y)
# ---------------------------------------------------------------- the grocer stacking cans up the wall (a run of clinks)
d = 2.0; y = np.zeros(int(d * SR))
t = 0.0
while t < 1.7:
    put(y, tin(R.uniform(1000, 1400), 0.3, 20) * R.uniform(0.4, 0.8), t); t += R.uniform(0.18, 0.34)
save("can_stack", y, 0.55)
# ---------------------------------------------------------------- the hand truck: wheels rumbling over floorboards, a creak, the top box caught
d = 1.9; c = tt(d); y = tilt(noise(d), 40, 400, 1.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.5 * c) ** 2) * env(d, 0.15, 0.3)
for k in range(6): put(y, wood(0.1, R.uniform(140, 220)) * 0.25, R.uniform(0.1, 1.5))
put(y, mx(wood(0.22, 200) * 0.9, bp(noise(0.06), 300, 3000) * np.exp(-tt(0.06) * 50) * 0.6), 1.05)        # the box caught
save("hand_truck", y, 0.6)
# ---------------------------------------------------------------- the giant loaf rising: a slow low dough-stretch swell with soft creaks
d = 2.0; c = tt(d); f = 55 + 35 * c / d
y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * c / d) ** 1.2 * 0.8 + tilt(noise(d), 60, 600, 1.4) * np.sin(np.pi * c / d) * 0.25
for k in range(5): put(y, bp(noise(0.25), 200, 900) * np.sin(np.pi * tt(0.25) / 0.25) * 0.25, 0.2 + k * 0.33)
save("loaf_rise", y, 0.6)
# ---------------------------------------------------------------- three knocks on a wooden door (0, 0.3, 0.6 s)
y = np.zeros(int(1.0 * SR))
for k, t0 in enumerate([0.0, 0.3, 0.6]): put(y, mx(wood(0.22, 150) * 1.2, bp(noise(0.03), 200, 4000) * np.exp(-tt(0.03) * 120) * 0.7) * (0.85 + 0.15 * k), t0)
save("knocks3", y)
# ---------------------------------------------------------------- the door swinging in: a hinge creak and the latch
d = 0.9; c = tt(d); f = 420 + 260 * np.sin(np.pi * c / d) + 30 * np.sin(2 * np.pi * 9 * c)
cr = np.sin(2 * np.pi * np.cumsum(f) / SR); cr = np.sign(cr) * np.abs(cr) ** 0.5
y = bp(cr, 300, 3500) * np.sin(np.pi * c / d) * 0.5; put(y, wood(0.08, 520) * 0.4, 0.0)
save("door_creak", y, 0.5)
# ---------------------------------------------------------------- the cellar window rattling in its frame (glass buzz, building)
d = 0.95; c = tt(d); y = np.zeros(len(c))
for k in range(int(d * 22)):
    t0 = k / 22 + R.uniform(0, 0.01); put(y, mx(tin(R.uniform(2200, 3400), 0.05, 80), bp(noise(0.03), 1500, 6000) * 0.3) * (0.2 + 0.8 * t0 / d), t0)
save("window_rattle", y, 0.5)
# ---------------------------------------------------------------- the cellar window POP (the turn): a cap pops, the pane cracks, foam sprays
def pop(dd=1.2, big=1.0):
    y = np.zeros(int(dd * SR)); c = tt(0.25)
    put(y, np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-c * 40)) / SR) * np.exp(-c * 14) * 1.1 * big, 0.0)          # the thump
    put(y, bp(noise(0.012), 800, 9000) * np.exp(-tt(0.012) * 300) * 1.0, 0.0)                                        # the cap's crack
    for k in range(int(30 * big)): put(y, tin(R.uniform(3000, 7000), R.uniform(0.04, 0.12), 50) * R.uniform(0.1, 0.4), abs(R.normal(0.02, 0.06)))   # glass bits
    s = bp(noise(dd - 0.05), 1200, 9000) * np.exp(-tt(dd - 0.05) * 3.2) * (1 - np.exp(-tt(dd - 0.05) * 60)) * 0.45 * big
    put(y, s, 0.03); return y                                                                                         # the foam spray
save("pop_big", pop(1.4, 1.0), 0.8)
# ---------------------------------------------------------------- the chain down the street: pops at 0, 0.74, 1.07, 1.40 s (smaller, further off)
y = np.zeros(int(2.4 * SR))
for t0, gk in [(0.0, 0.9), (0.74, 0.7), (1.07, 0.55), (1.40, 0.45)]: put(y, pop(0.9, gk) * gk, t0)
save("pops_chain", y, 0.75)
# ---------------------------------------------------------------- water sloshed in from a bucket, then the yeast cake plops in (1.13 s)
d = 1.7; y = bp(noise(0.9), 200, 5000) * env(0.9, 0.05, 0.4) * 0.4
y = np.concatenate([y, np.zeros(int((d - 0.9) * SR))])
for k in range(12): put(y, glug(R.uniform(260, 420), 0.07, R.uniform(0.2, 0.4)), R.uniform(0.05, 0.8))
c = tt(0.3); put(y, np.sin(2 * np.pi * np.cumsum(180 + 500 * np.exp(-c * 25)) / SR) * np.exp(-c * 12) * 0.8, 1.13)   # the plop
save("water_plop", y, 0.6)
# ---------------------------------------------------------------- the crock fizzing up, with a foam "burp" at 0.94 s
d = 2.6; c = tt(d); y = bp(noise(d), 2500, 12000) * (0.15 + 0.85 * c / d) * 0.18 * env(d, 0.3, 0.3)
for k in range(140): put(y, tin(R.uniform(2500, 6000), 0.02, 160) * R.uniform(0.03, 0.12) * (0.3 + c[min(len(c) - 1, int(k / 140 * len(c)))] / d), R.uniform(0, d - 0.1))
cc = tt(0.4); put(y, mx(glug(95, 0.32, 1.4), bp(noise(0.4), 100, 800) * np.sin(np.pi * cc / 0.4) * 0.4), 0.94)
save("fizz_burp", y, 0.55)
# ---------------------------------------------------------------- the pancake bowl: water in, then beer foam frothing up when he taps the can (1.2 s)
d = 2.3; y = bp(noise(0.8), 300, 5000) * env(0.8, 0.05, 0.3) * 0.35; y = np.concatenate([y, np.zeros(int((d - 0.8) * SR))])
put(y, tin(900, 0.25, 22) * 0.5, 1.2); put(y, tin(900, 0.25, 22) * 0.4, 1.38)
f2 = bp(noise(1.0), 2000, 11000) * env(1.0, 0.05, 0.5) * 0.3
for k in range(60): put(f2, tin(R.uniform(3000, 6500), 0.02, 160) * 0.08, R.uniform(0, 0.9))
put(y, f2, 1.25)
save("batter_froth", y, 0.55)
# ---------------------------------------------------------------- the bottles hissing, then caps blowing off in a run and pinging off the ceiling
d = 1.6; y = bp(noise(d), 3000, 11000) * np.minimum(1, tt(d) / 0.4) * 0.12
for k, t0 in enumerate([0.15, 0.36, 0.52, 0.66, 0.8, 0.95, 1.06]):
    c = tt(0.15); put(y, np.sin(2 * np.pi * np.cumsum(120 + 300 * np.exp(-c * 50)) / SR) * np.exp(-c * 25) * 0.5, t0)
    put(y, bp(noise(0.01), 1000, 9000) * np.exp(-tt(0.01) * 300) * 0.6, t0); put(y, tin(R.uniform(1800, 2600), 0.15, 30) * 0.12, t0 + 0.12)
save("caps_blow", y, 0.6)
# ---------------------------------------------------------------- the slanted cellar doors hauled up: a long creak and a thud as they drop open
d = 1.4; c = tt(0.8); f = 260 + 120 * np.sin(np.pi * c / 0.8)
cr = np.sin(2 * np.pi * np.cumsum(f) / SR); cr = np.sign(cr) * np.abs(cr) ** 0.6
y = np.zeros(int(d * SR)); put(y, bp(cr, 200, 2500) * np.sin(np.pi * c / 0.8) * 0.45, 0.0)
put(y, mx(wood(0.4, 85) * 1.5, bp(noise(0.06), 100, 2000) * np.exp(-tt(0.06) * 40)), 0.75)
save("bulkhead", y, 0.6)
# ---------------------------------------------------------------- THE FINAL HIT (64.9 s): a deep boom under a crash of caps and glass, a foam roar
d = 1.3; y = np.zeros((int(d * SR), 2)); c = tt(1.2)
boom = np.sin(2 * np.pi * np.cumsum(46 + 90 * np.exp(-c * 18)) / SR) * np.exp(-c * 7.0) * (1 - np.exp(-c * 900))   # short and deep: a big low-band peak for little loudness
put(y, boom * 6.0, 0.0, 0.0); put(y, np.sin(2 * np.pi * 40 * c) * np.exp(-c * 14) * (1 - np.exp(-c * 600)) * 3.0, 0.0, 0.0);
put(y, bp(noise(0.25), 4500, 14000) * np.exp(-tt(0.25) * 14) * 0.7, 0.0, -0.15); put(y, bp(noise(0.25), 4500, 14000) * np.exp(-tt(0.25) * 14) * 0.7, 0.0, 0.15)   # the glass crackle on top   # a deep body under the crash (mix_check: the low band must jump 12 dB+) put(y, bp(noise(0.03), 600, 10000) * np.exp(-tt(0.03) * 150) * 1.0, 0.0, 0.0)
for k in range(160):
    t0 = abs(R.normal(0.05, 0.25)); put(y, tin(R.uniform(2500, 8000), R.uniform(0.05, 0.2), R.uniform(20, 50)) * R.uniform(0.05, 0.25) * np.exp(-t0 * 2), t0, R.uniform(-0.7, 0.7))
roar = bp(noise(1.2), 400, 9000) * np.exp(-c * 2.2) * (1 - np.exp(-c * 40)) * 0.5
put(y, roar * 0.4, 0.02, -0.2); put(y, bp(noise(1.2), 400, 9000) * np.exp(-c * 2.2) * (1 - np.exp(-c * 40)) * 0.2, 0.02, 0.2)
save("final_hit", y, 0.9)
# ---------------------------------------------------------------- the unlock stinger at "pop": a short brass-and-banjo stab with a timpani
d = 1.3; y = np.zeros((int(d * SR), 2)); c = tt(d)
def brass(f, dd):
    cc = tt(dd); ph = np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * cc))) / SR; s = sum(np.sin(2 * np.pi * k * ph) / k ** 1.1 for k in range(1, 9))
    return s * np.minimum(1, cc / 0.015) * np.exp(-cc * 3.0)
for f, p in [(174.6, -0.3), (220.0, 0.3), (261.6, -0.1), (349.2, 0.15)]: put(y, brass(f, d) * 0.3, 0.0, p)
put(y, np.sin(2 * np.pi * np.cumsum(88 + 40 * np.exp(-c * 20)) / SR) * np.exp(-c * 4) * 0.9, 0.0, 0.0)
save("stinger", y, 0.8)

# ---------------------------------------------------------------- beds (13 s stereo loops)
L = 13.0; c = tt(L)
def gusts(seed, rate=0.13, depth=0.45):
    g = np.random.default_rng(seed); ph = g.uniform(0, 6, 3)
    return 1 - depth + depth * (0.5 + 0.5 * (0.6 * np.sin(2 * np.pi * rate * c + ph[0]) + 0.3 * np.sin(2 * np.pi * rate * 2.7 * c + ph[1]) + 0.1 * np.sin(2 * np.pi * rate * 6.1 * c + ph[2])))
def windch(seed):
    g = np.random.default_rng(seed); w = tilt(g.normal(0, 1, len(c)), 60, 900, 1.2); return w / w.std() * gusts(seed)
def room(seed, lo=40, hi=500):
    g = np.random.default_rng(seed); x = tilt(g.normal(0, 1, len(c)), lo, hi, 1.6); return x / x.std()
def chirp(f0, f1, d):
    cc = tt(d); f = np.linspace(f0, f1, len(cc)) * (1 + 0.04 * np.sin(2 * np.pi * 38 * cc)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * cc / d) ** 1.5
# the brewery: a big room, the kettle's boiler hum, a slow hiss of steam, an odd drip in the drain
b = np.stack([room(51), room(52)], 1) * 0.5
b += (np.sin(2 * np.pi * 55 * c) * 0.06 + np.sin(2 * np.pi * 110 * c) * 0.03)[:, None] * np.array([1.0, 0.8])
b += np.stack([bp(R.normal(0, 1, len(c)), 3000, 9000), bp(R.normal(0, 1, len(c)), 3000, 9000)], 1) * 0.04 * gusts(53, 0.09, 0.7)[:, None]
for k in range(9): put(b, ring([(1300, 1), (2100, 0.4)], 0.12, 40) * 0.12, R.uniform(0, L - 0.3), R.uniform(0.2, 0.7))
save("amb_brewery", loopify(b), 0.5)
# the street by day: light wind, far-off hooves and a cart, birds
s = np.stack([windch(61), windch(62)], 1) * 0.3 + np.stack([room(63, 80, 700), room(64, 80, 700)], 1) * 0.3
for k in range(14): put(s, wood(0.06, 400) * 0.08, 2.0 + k * 0.26 + R.uniform(0, 0.03), -0.6 + k * 0.06)   # a horse passing far off
for k in range(8):
    t0 = R.uniform(0.3, L - 1.2); p = R.uniform(-0.8, 0.8); bb = R.uniform(2600, 3500)
    for j in range(R.integers(2, 5)): put(s, chirp(bb, bb * R.uniform(1.2, 1.45), 0.07) * 0.2, t0 + j * 0.11, p)
save("amb_street_day", loopify(s), 0.5)
# the grocery: a small shop (room tone), the street muffled through the glass, a floorboard now and then
gr = np.stack([room(71, 60, 450), room(72, 60, 450)], 1) * 0.5 + np.stack([room(73, 150, 1200), room(74, 150, 1200)], 1) * 0.15
for k in range(6): put(gr, bp(R.normal(0, 1, int(0.3 * SR)), 300, 1500) * np.sin(np.pi * tt(0.3) / 0.3) * 0.12, R.uniform(0, L - 0.5), R.uniform(-0.6, 0.6))
save("amb_grocery", loopify(gr), 0.5)
# high over the town: wind
save("amb_town_wind", loopify(np.stack([windch(81), windch(82)], 1)), 0.55)
# the street at night: crickets, a light wind
n_ = np.stack([windch(91), windch(92)], 1) * 0.35
for k in range(70):
    t0 = R.uniform(0, L - 0.3); p = R.uniform(-0.9, 0.9); fc = R.uniform(4200, 4800)
    for j in range(3): put(n_, ring([(fc, 1)], 0.018, 90) * 0.12, t0 + j * 0.035, p)
save("amb_night", loopify(n_), 0.5)
# a cellar: close, low, a slow drip, the street far above
ce = np.stack([room(101, 30, 300), room(102, 30, 300)], 1) * 0.55
for k in range(6): put(ce, ring([(1500, 1), (2400, 0.3)], 0.1, 45) * 0.1, R.uniform(0, L - 0.3), R.uniform(-0.5, 0.5))
save("amb_cellar", loopify(ce), 0.5)
print("ok")
