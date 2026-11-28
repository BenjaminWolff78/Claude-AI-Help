"""Sounds for "Why He Took His Car Battery to Bed" (48 kHz, original synthesis, no samples). The helpers are the p14 ones."""
import numpy as np, soundfile as sf, os
SR = 48000
import numpy as np, soundfile as sf, os
SR = 48000; R = np.random.default_rng(1528)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx15"); os.makedirs(OUT, exist_ok=True)
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
def brass(f, dd):
    cc = tt(dd); ph = np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * cc))) / SR; s = sum(np.sin(2 * np.pi * k * ph) / k ** 1.1 for k in range(1, 9))
    return s * np.minimum(1, cc / 0.015) * np.exp(-cc * 3.0)
for f, p in [(174.6, -0.3), (220.0, 0.3), (261.6, -0.1), (349.2, 0.15)]: put(y, brass(f, d) * 0.3, 0.0, p)
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

# ================================================================ p15 effects ("Why He Took His Car Battery to Bed")
# original synthesis, 48 kHz; the mixer pans and levels them. The unlock stinger is the p14 one (copied, not remade).
def crunch(d=0.22, seed=0):
    """one boot in dry -40 snow: a short squeaky crunch"""
    g = np.random.default_rng(seed); c = tt(d); s = bp(g.normal(0, 1, len(c)), 900, 7000) * np.exp(-c * 22) * (1 - np.exp(-c * 300))
    s += np.sin(2 * np.pi * np.cumsum(1300 + 500 * c / d) / SR) * np.exp(-c * 35) * 0.25   # the squeak of very cold snow
    return s
def steps(n, gap, seed, heavy=1.0):
    g = np.random.default_rng(seed); y = np.zeros(int((n * gap + 0.4) * SR))
    for k in range(n): put(y, crunch(0.22, seed * 31 + k) * heavy * g.uniform(0.7, 1.0), k * gap * g.uniform(0.94, 1.06))
    return y
def engine(d, f0=32, rough=0.25, seed=0):
    """an idling engine: a low pulse train with a rattly top"""
    g = np.random.default_rng(seed); c = tt(d); f = f0 * (1 + 0.03 * np.sin(2 * np.pi * 0.7 * c))
    ph = np.cumsum(f) / SR; pulse = np.maximum(0, np.sin(2 * np.pi * ph)) ** 6
    body = bp(pulse, 25, 600) * 1.0 + bp(g.normal(0, 1, len(c)) * pulse, 400, 3000) * rough
    return body
def crank(d=0.9, seed=0, catch=True):
    """a starter motor grinding (rrr-rrr-rrr), then the engine catching with a vroom"""
    c = tt(d); rate = 6.5; grind = np.sin(2 * np.pi * np.cumsum(140 + 30 * np.sin(2 * np.pi * rate * c)) / SR)
    grind = bp(np.sign(grind) * np.abs(grind) ** 0.4, 120, 2500) * (0.55 + 0.45 * np.abs(np.sin(np.pi * rate * c)))
    y = grind * 0.5
    if catch:
        e = engine(1.6, 34, 0.3, seed); k = np.minimum(1, tt(1.6) / 0.08); rev = 1 + 1.2 * np.exp(-tt(1.6) * 3.5)
        e2 = engine(1.6, 34 * 1.9, 0.4, seed + 1) * np.exp(-tt(1.6) * 2.2)
        y = mx(y * env(d, 0.01, 0.05), np.concatenate([np.zeros(int(d * SR) - 400), (e * rev + e2 * 0.8) * k * 0.9]))
    return y
def click(seed=0):
    """an ignition key turning and a relay click (a dead battery)"""
    g = np.random.default_rng(seed); y = np.zeros(int(0.35 * SR))
    put(y, bp(g.normal(0, 1, int(0.03 * SR)), 1500, 7000) * np.exp(-tt(0.03) * 120) * 0.4, 0.0)   # the key in the lock
    put(y, mx(ring([(2400, 1), (3900, 0.5)], 0.06, 90), bp(g.normal(0, 1, int(0.02 * SR)), 2000, 9000) * np.exp(-tt(0.02) * 200)) * 1.0, 0.06)   # the relay: click
    return y
def honk(d=0.25, f=392):
    c = tt(d); s = sum(np.sin(2 * np.pi * f * k * c) / k ** 0.8 for k in range(1, 9)) + 0.6 * sum(np.sin(2 * np.pi * f * 1.26 * k * c) / k for k in range(1, 7))
    return bp(np.tanh(s * 1.4), 250, 4500) * env(d, 0.008, 0.03)
def rustle(d, seed=0, lo=500, hi=6000):
    g = np.random.default_rng(seed); c = tt(d); m = np.abs(bp(g.normal(0, 1, len(c)), 3, 18)); m /= m.max() + 1e-9
    return bp(g.normal(0, 1, len(c)), lo, hi) * m * np.sin(np.pi * c / d) ** 0.5
def thud(f0=70, d=0.3, amp=1.0):
    c = tt(d); return (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-c * 30))) / SR) * np.exp(-c * 14) + bp(noise(d), 100, 1500) * np.exp(-c * 40) * 0.5) * amp

# blanket pulled up, tucked, two pats (S1) / flapped and smoothed (S7) / pulled up by the foreman (S26)
y = mx(rustle(0.9, 1), np.zeros(int(1.6 * SR))); put(y, thud(140, 0.12, 0.5), 1.0); put(y, thud(150, 0.12, 0.45), 1.33)
save("blanket_tuck", y, 0.5)
y = mx(rustle(0.35, 2, 200, 3000) * 1.4, np.zeros(int(1.3 * SR))); put(y, rustle(0.8, 3), 0.45)
save("blanket_flap", y, 0.5)
# the hero's little car: a cough, then it catches (S2) / a roar on the first try (S19)
save("car_start", crank(0.55, 3), 0.7)
save("car_roar", mx(crank(0.25, 4), np.zeros(int(2.2 * SR))) if False else crank(0.3, 4), 0.8)
# footsteps carrying 40 lb through the snow (S3-S4, S17), shuffling (S24), the foreman's heavy steps (S26 on boards)
save("steps_snow", steps(9, 0.42, 5), 0.5)
save("steps_shuffle", steps(10, 0.3, 6, 0.6), 0.45)
y = np.zeros(int(3.2 * SR))
for k in range(7): put(y, thud(90, 0.25, 0.8), k * 0.42)
save("steps_boards", y, 0.5)
# the foreman's mug slurp + chuckle (S5), the door creak with a gust of warm room (S5, S17)
d = 0.45; c = tt(d); y = bp(noise(d), 700, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * c)) * np.sin(np.pi * c / d)
save("slurp", y, 0.45)
d = 1.1; c = tt(d); f = 330 + 240 * np.sin(np.pi * c / d) + 25 * np.sin(2 * np.pi * 11 * c)
cr = np.sin(2 * np.pi * np.cumsum(f) / SR); cr = np.sign(cr) * np.abs(cr) ** 0.5
save("door_creak", bp(cr, 250, 3200) * np.sin(np.pi * c / d) * 0.5, 0.5)
# laughter: the foreman's belly laugh (S5, S12), the mess hall roaring (S9), two bunkmates giggling (S8), the crew cheering (S25)
save("laugh_foreman", voice_ha(105, 7, 0.19, 0.13, 11), 0.6)
y = np.zeros((int(2.2 * SR), 2))
for i, (f0, n, gap, d0, p, t0) in enumerate([(150, 8, 0.17, 0.11, -0.5, 0.0), (118, 7, 0.2, 0.13, 0.4, 0.1), (185, 7, 0.15, 0.1, 0.1, 0.25), (135, 6, 0.22, 0.12, -0.2, 0.4), (165, 7, 0.16, 0.1, 0.6, 0.15)]):
    put(y, voice_ha(f0, n, gap, d0, 20 + i), t0, p)
save("laugh_room", y, 0.6)
y = np.zeros((int(1.4 * SR), 2)); put(y, voice_ha(240, 6, 0.12, 0.07, 31) * 0.8, 0.0, -0.3); put(y, voice_ha(210, 5, 0.14, 0.07, 32) * 0.7, 0.18, 0.3)
save("giggle", y, 0.5)
y = np.zeros((int(1.8 * SR), 2))
for i in range(6):
    g = np.random.default_rng(40 + i); f0 = g.uniform(110, 200); dd = g.uniform(0.6, 1.0); cc = tt(dd)
    ph = np.cumsum(f0 * (1 + 0.25 * cc / dd)) / SR; src = (np.mod(ph, 1.0) - 0.5) * 2
    v = (bp(src, 500, 1200) + bp(src, 1200, 2600) * 0.5) * np.minimum(1, cc / 0.05) * np.minimum(1, (dd - cc) / 0.2)
    put(y, v, g.uniform(0, 0.3), g.uniform(-0.8, 0.8))
save("cheer", y, 0.55)
# chalk on the bunk post (S6), coffee sip (S10)
y = np.zeros(int(0.5 * SR)); c2 = tt(0.3); put(y, bp(noise(0.3), 1800, 9000) * (0.6 + 0.4 * np.sin(2 * np.pi * 47 * c2) ** 2) * np.sin(np.pi * c2 / 0.3) ** 0.6, 0.05)
save("chalk", y, 0.45)
d = 0.5; c = tt(d); save("sip", bp(noise(d), 900, 6000) * np.sin(np.pi * c / d) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * c)), 0.35)
# the first cold morning: four engines start one after another (S11) and the giant truck pulls out
y = np.zeros((int(2.0 * SR), 2))
for k, (t0, p) in enumerate([(0.0, -0.6), (0.4, -0.35), (0.8, -0.1)]): put(y, crank(0.35, 10 + k) * 0.6, t0, p)
save("engines_start", y, 0.6)
y = np.zeros(int(3.0 * SR)); e = engine(3.0, 40, 0.35, 12); r = np.minimum(1, tt(3.0) / 0.3) * (1 + 0.8 * np.minimum(1, tt(3.0) / 1.2)); y += e * r
save("truck_pull", y, 0.6)
y = np.zeros(int(1.4 * SR))
for k, t0 in enumerate([0.0, 0.33, 0.62, 0.95]): put(y, honk(0.22 if k < 3 else 0.32, 392), t0)
save("honks", y, 0.6)
# the battery set into its tray (S11, S18) and the clamps (S18)
y = mx(thud(95, 0.3, 1.0), tin(900, 0.15, 30) * 0.2); save("battery_clunk", y, 0.6)
y = np.zeros(int(0.7 * SR)); put(y, mx(ring([(2900, 1), (4300, 0.5)], 0.05, 80), bp(noise(0.03), 2000, 9000) * np.exp(-tt(0.03) * 150)), 0.0)
put(y, mx(ring([(2700, 1), (4100, 0.5)], 0.05, 80), bp(noise(0.03), 2000, 9000) * np.exp(-tt(0.03) * 150)), 0.3); save("clamps", y, 0.5)
# the night it hits -40: a frost wipe squeak (S13), the red line sinking (a soft descending glide)
d = 0.55; c = tt(d); y = np.sin(2 * np.pi * np.cumsum(1700 + 600 * np.sin(2 * np.pi * 4 * c)) / SR) * 0.3 * np.sin(np.pi * c / d) + bp(noise(d), 2000, 8000) * 0.4 * np.sin(np.pi * c / d)
save("frost_wipe", y, 0.4)
d = 1.0; c = tt(d); save("sink", np.sin(2 * np.pi * np.cumsum(900 * np.exp(-c * 1.3)) / SR) * np.exp(-c * 1.8) * (1 - np.exp(-c * 80)), 0.35)
# doors slamming at dawn (S14), key clicks (S15), the giant's crank, cough and death (S16), a feeble honk
y = np.zeros((int(1.2 * SR), 2))
for k, (t0, p) in enumerate([(0.0, -0.5), (0.3, 0.2), (0.6, -0.2)]): put(y, mx(thud(80, 0.35, 1.0), tin(600, 0.2, 20) * 0.3) * (0.9 - 0.1 * k), t0, p)
save("doors_slam", y, 0.6)
save("key_click", click(13), 0.5)
y = np.zeros(int(2.6 * SR)); put(y, crank(1.1, 14, catch=False) * 0.9, 0.0)
cough = engine(0.5, 30, 0.5, 15) * np.sin(np.pi * tt(0.5) / 0.5) ** 0.7 * 1.3; put(y, cough, 1.15)
put(y, crank(0.6, 16, catch=False) * np.linspace(1, 0.2, int(0.6 * SR)) * 0.6, 1.7)   # winds down and dies
save("giant_dies", y, 0.7)
save("honk_feeble", honk(0.5, 300) * np.linspace(1, 0.4, int(0.5 * SR)) * 0.6, 0.4)
# the steaming battery (S17-S18: a soft hiss)
d = 2.0; c = tt(d); save("steam", bp(noise(d), 2500, 9000) * np.sin(np.pi * c / d) ** 0.8 * (0.7 + 0.3 * np.sin(2 * np.pi * 1.3 * c)), 0.3)
# the cutaway (S20): the chemical reaction fizzing and an electric hum swelling
d = 2.8; c = tt(d); y = bp(noise(d), 1500, 9000) * 0.25 * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3 * c))) * env(d, 0.3, 0.6)
y += (np.sin(2 * np.pi * 120 * c) * 0.25 + np.sin(2 * np.pi * 240 * c) * 0.1) * np.minimum(1, c / 1.2) * env(d, 0.3, 0.6)
for k in range(30): put(y, glug(R.uniform(700, 1400), 0.05, 0.15), R.uniform(0.2, d - 0.3))
save("reaction", y, 0.5)
# the honey (S21): the fridge door, a squeeze that wheezes air, a strain, the slow blob
y = np.zeros(int(0.8 * SR)); put(y, thud(110, 0.2, 0.8), 0.0); put(y, bp(noise(0.15), 300, 2000) * np.exp(-tt(0.15) * 20) * 0.4, 0.05); save("fridge", y, 0.5)
y = np.zeros(int(1.8 * SR))
for k, t0 in enumerate([0.0, 0.4, 0.8, 1.2]):
    dd = 0.28; cc = tt(dd); put(y, bp(noise(dd), 800, 5000) * np.sin(np.pi * cc / dd) * 0.4 + np.sin(2 * np.pi * np.cumsum(600 + 300 * cc) / SR) * 0.08 * np.sin(np.pi * cc / dd), t0)
save("squeeze", y, 0.45)
d = 0.9; c = tt(d); save("blob", np.sin(2 * np.pi * np.cumsum(180 * (1 + 0.8 * c / d)) / SR) * np.sin(np.pi * c / d) ** 2 * 0.6, 0.45)
# the tester (S22): two clips, the needle swinging up with a whir, then sagging
y = np.zeros(int(2.2 * SR)); put(y, click(17) * 0.6, 0.0); put(y, click(18) * 0.6, 0.18)
d = 1.6; c = tt(d); put(y, np.sin(2 * np.pi * np.cumsum(500 + 700 * np.sin(np.pi * np.minimum(1, c / 0.5) / 2) - 450 * np.maximum(0, c - 0.5)) / SR) * 0.12 * env(d, 0.05, 0.3), 0.45)
save("tester", y, 0.5)
# the dipstick (S23): a metal scrape up out of the tube, then a stretchy squelch of cold oil
d = 0.7; c = tt(d); y = bp(noise(d), 1500, 8000) * 0.4 * np.sin(np.pi * c / d) + np.sin(2 * np.pi * np.cumsum(2200 + 900 * c) / SR) * 0.08 * np.sin(np.pi * c / d)
save("dipstick", y, 0.45)
d = 1.4; c = tt(d); save("goo", np.sin(2 * np.pi * np.cumsum(120 * (1 + 0.4 * np.sin(np.pi * c / d))) / SR) * np.sin(np.pi * c / d) ** 1.5 * 0.5 + bp(noise(d), 300, 1200) * 0.1 * np.sin(np.pi * c / d), 0.4)
# lunch (S25): the engines roar one by one down the row (four catches)
y = np.zeros((int(3.2 * SR), 2))
for k, (t0, p) in enumerate([(0.0, 0.5), (0.67, 0.1), (1.33, -0.25), (2.0, -0.55)]): put(y, crank(0.3, 20 + k) * 0.55, t0, p)
save("engines_row", y, 0.65)
# the foreman sets the truck battery on his pillow (S26): a heavy thump on the mattress, a grunt
y = mx(thud(75, 0.35, 1.0), bp(noise(0.3), 150, 900) * np.exp(-tt(0.3) * 12) * 0.3); save("battery_thump", y, 0.6)
# THE FINAL HIT (64.04 s): the bunk legs snap: a big wood crack, the deck slams down, a low boom
d = 1.4; y = np.zeros((int(d * SR), 2)); c = tt(1.3)
boom = np.sin(2 * np.pi * np.cumsum(44 + 85 * np.exp(-c * 18)) / SR) * np.exp(-c * 6.5) * (1 - np.exp(-c * 900))
put(y, boom * 6.0, 0.0, 0.0); put(y, np.sin(2 * np.pi * 38 * c) * np.exp(-c * 12) * (1 - np.exp(-c * 600)) * 3.0, 0.0, 0.0)
for k, (t0, p) in enumerate([(0.0, -0.3), (0.02, 0.3), (0.05, 0.0)]):
    snap = bp(noise(0.18), 600, 9000) * np.exp(-tt(0.18) * 30) * 1.4; put(y, snap, t0, p); put(y, wood(0.3, 120 + 40 * k) * 1.6, t0 + 0.01, p)
for k in range(40): put(y, wood(0.12, R.uniform(200, 700)) * R.uniform(0.1, 0.4) * np.exp(-k * 0.05), abs(R.normal(0.15, 0.2)), R.uniform(-0.7, 0.7))
put(y, bp(noise(1.0), 200, 3000) * np.exp(-tt(1.0) * 3) * 0.35, 0.08, -0.2); put(y, bp(noise(1.0), 200, 3000) * np.exp(-tt(1.0) * 3) * 0.35, 0.08, 0.2)
save("final_hit", y, 0.9)

# ---------------------------------------------------------------- beds (13 s stereo loops)
L = 13.0; c = tt(L)
# the bunkhouse at night: the stove crackling, the wind outside the walls, a creak
b = np.stack([room(51, 40, 400), room(52, 40, 400)], 1) * 0.35 + np.stack([windch(53), windch(54)], 1) * 0.12
for k in range(70): put(b, bp(R.normal(0, 1, int(0.02 * SR)), 1500, 8000) * np.exp(-tt(0.02) * 150) * R.uniform(0.05, 0.25), R.uniform(0, L - 0.1), R.uniform(-0.5, 0.1))
for k in range(3): put(b, bp(R.normal(0, 1, int(0.4 * SR)), 200, 1200) * np.sin(np.pi * tt(0.4) / 0.4) * 0.08, R.uniform(0, L - 0.5), R.uniform(-0.6, 0.6))
save("amb_bunk", loopify(b), 0.5)
# the camp at night: wind in the pines, snow hiss
n_ = np.stack([windch(61), windch(62)], 1) * 0.45 + np.stack([bp(R.normal(0, 1, len(c)), 3000, 9000), bp(R.normal(0, 1, len(c)), 3000, 9000)], 1) * 0.03
save("amb_camp_night", loopify(n_), 0.5)
# the first cold morning by day: light wind, a crow, far engines idling
dd_ = np.stack([windch(71), windch(72)], 1) * 0.3 + np.stack([room(73, 30, 200), room(74, 30, 200)], 1) * 0.15
for k in range(3):
    t0 = R.uniform(0.5, L - 1.5); p = R.uniform(-0.8, 0.8)
    for j in range(2): put(dd_, bp(chirp(900, 700, 0.22) * 2, 500, 3000) * 0.15, t0 + j * 0.35, p)
save("amb_camp_day", loopify(dd_), 0.5)
# dawn at forty below: near silence, an ice tick now and then, the faintest wind
dw = np.stack([windch(81), windch(82)], 1) * 0.15
for k in range(10): put(dw, ring([(R.uniform(2000, 4000), 1)], 0.05, 70) * 0.08, R.uniform(0, L - 0.2), R.uniform(-0.8, 0.8))
save("amb_camp_dawn", loopify(dw), 0.45)
# the mess hall: room tone, murmur, cutlery
me = np.stack([room(91, 80, 700), room(92, 80, 700)], 1) * 0.35
for k in range(16): put(me, ring([(R.uniform(2500, 5000), 1), (R.uniform(5000, 7000), 0.4)], 0.08, 50) * 0.1, R.uniform(0, L - 0.2), R.uniform(-0.8, 0.8))
murm = np.stack([bp(R.normal(0, 1, len(c)), 200, 900), bp(R.normal(0, 1, len(c)), 200, 900)], 1) * (0.5 + 0.5 * gusts(93, 0.8, 0.6))[:, None] * 0.25
save("amb_mess", loopify(me + murm), 0.5)
print("ok")
