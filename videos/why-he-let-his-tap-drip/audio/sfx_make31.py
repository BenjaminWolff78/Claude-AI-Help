"""v31 sounds for the dripping-tap video (48 kHz, original synthesis).
Hits: the sign slam (the biggest hit of the video: a sub thump, a wooden stake crack and packed snow), the window icicles
shattering, a snow poof, a heavy mallet swing.
Stereo ambience beds (decorrelated L/R, seamless 12 s loops): a night wind outside, a kitchen at night (room tone + a wall
clock), the thaw outside (drips off the eaves, a few birds, light wind), a quiet morning kitchen (birds through the glass)."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(3111)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def tilt(x, lo, hi, slope=1.0):
    """band-limit with a soft 1/f^slope roll-off (pink-ish) - smoother than a brick wall for beds"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); f[0] = 1
    X *= (1 / f ** (slope / 2)) * (f >= lo) * (1 / (1 + (f / hi) ** 4)); return np.fft.irfft(X, len(x))
def put(y, x, t, pan=0.0):
    i = int(t * SR); j = min(len(y), i + len(x))
    if y.ndim == 1: y[i:j] += x[:j - i]
    else:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); y[i:j, 0] += x[:j - i] * l; y[i:j, 1] += x[:j - i] * r
    return y
def ring(fs, d, dec): c = tt(d); return sum(np.sin(2 * np.pi * f * c) * a for f, a in fs) * np.exp(-c * dec)
def save(name, y, peak=0.7):
    y = y / (np.abs(y).max() + 1e-9) * peak; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def loopify(y, xf=1.0):
    """make a stereo bed loop seamlessly: crossfade the last xf seconds into the start"""
    n = int(xf * SR); r = np.linspace(0, 1, n)[:, None]; z = y[n:].copy(); z[-n:] = y[-n:] * (1 - r) + y[:n] * r; return z

# ---------------------------------------------------------------- the slam (centre; the ending's one big hit)
c = tt(1.4); f = 46 + 70 * np.exp(-c * 22)
sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-c * 5.5) * (1 - np.exp(-c * 900))           # the stake driving into the frozen yard
knock = bp(R.normal(0, 1, len(c)), 90, 900) * np.exp(-c * 30) * 0.9                                 # the mallet on the sign's wooden post
crack = np.zeros(len(c)); put(crack, bp(R.normal(0, 1, int(0.025 * SR)), 1200, 9000) * np.exp(-tt(0.025) * 160) * 0.7, 0.004)
wood = ring([(196, 1), (412, 0.6), (733, 0.35)], 1.4, 14) * 0.35                                     # the post's body
snow = np.zeros(len(c))
for k in range(90): put(snow, bp(R.normal(0, 1, int(0.008 * SR)), 500, 6000) * np.exp(-tt(0.008) * 400) * R.uniform(0.2, 0.8) * np.exp(-k / 40), R.uniform(0.0, 0.35))
save("slam", sub * 1.7 + knock * 0.8 + crack + wood + snow * 0.45, 0.85)

# ---------------------------------------------------------------- the window icicles snapping and shattering (stereo spread)
y = np.zeros((int(1.3 * SR), 2))
for k in range(150):
    t0 = abs(R.normal(0.05, 0.18)); f0 = R.uniform(2600, 7800); d = R.uniform(0.05, 0.25)
    put(y, (ring([(f0, 1), (f0 * 1.51, 0.5), (f0 * 2.33, 0.25)], d, R.uniform(18, 45)) + bp(R.normal(0, 1, int(d * SR)), 3000, 12000) * np.exp(-tt(d) * 90) * 0.5) * R.uniform(0.2, 1.0) * np.exp(-t0 * 2.5), t0, R.uniform(-0.8, 0.8))
save("ice_shatter", y)

# ---------------------------------------------------------------- a snow poof (packed snow thrown up)
c = tt(0.6); save("snow_poof", tilt(R.normal(0, 1, len(c)), 150, 3500) * np.exp(-c * 7) * (1 - np.exp(-c * 300)))

# ---------------------------------------------------------------- a heavy mallet swung down (a low, short air rush; not a whoosh FX)
c = tt(0.42); env = np.sin(np.pi * np.minimum(1, c / 0.42)) ** 2
save("mallet_swing", tilt(R.normal(0, 1, len(c)), 120, 1600) * env * (0.6 + 0.4 * c / 0.42))

# ---------------------------------------------------------------- beds (12 s stereo loops)
L = 13.0; c = tt(L)
def gusts(seed, rate=0.13, depth=0.45):
    g = np.random.default_rng(seed); ph = g.uniform(0, 6, 3)
    return 1 - depth + depth * (0.5 + 0.5 * (0.6 * np.sin(2 * np.pi * rate * c + ph[0]) + 0.3 * np.sin(2 * np.pi * rate * 2.7 * c + ph[1]) + 0.1 * np.sin(2 * np.pi * rate * 6.1 * c + ph[2])))
def windch(seed):
    g = np.random.default_rng(seed); w = tilt(g.normal(0, 1, len(c)), 60, 900, 1.2)
    w2 = bp(g.normal(0, 1, len(c)), 700, 2600) * 0.12 * gusts(seed + 9, 0.21, 0.8) ** 3   # a faint whistle in the gusts
    return (w / np.abs(w).std() + w2 / (np.abs(w2).std() + 1e-9) * 0.25) * gusts(seed)
night = np.stack([windch(11), windch(12)], 1)
for k in range(10): put(night, bp(R.normal(0, 1, int(0.08 * SR)), 2500, 9000) * np.exp(-tt(0.08) * 40) * 0.25, R.uniform(0, L - 0.2), R.uniform(-0.9, 0.9))   # snow ticking on the siding
save("amb_night_out", loopify(night), 0.6)

def room(seed):
    g = np.random.default_rng(seed); x = tilt(g.normal(0, 1, len(c)), 40, 500, 1.6); return x / x.std()
kit = np.stack([room(21), room(22)], 1) * 0.5
kit += (np.sin(2 * np.pi * 60 * c) * 0.05 + np.sin(2 * np.pi * 120 * c) * 0.03)[:, None] * np.array([0.8, 1.0])   # a fridge hum, slightly right
for k in range(int(L)):                                                                                              # the wall clock, left
    put(kit, ring([(3100, 1), (5200, 0.4)], 0.03, 220) * (0.9 if k % 2 else 0.7), k + 0.12, -0.55)
save("amb_kitchen_night", loopify(kit), 0.5)

def chirp(f0, f1, d):
    cc = tt(d); f = np.linspace(f0, f1, len(cc)) * (1 + 0.04 * np.sin(2 * np.pi * 38 * cc)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * cc / d) ** 1.5
thaw = np.stack([windch(31), windch(32)], 1) * 0.35
for k in range(60):                                                                                                  # drips off the eaves into slush
    d = 0.12; cc = tt(d); f = 900 + 1400 * np.exp(-cc * 60)
    put(thaw, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-cc * 40) * R.uniform(0.2, 0.7), R.uniform(0, L - 0.2), R.uniform(-0.9, 0.9))
for k in range(7):                                                                                                   # a few birds, far off
    t0 = R.uniform(0.3, L - 1.2); p = R.uniform(-0.9, 0.9); b = R.uniform(2600, 3600)
    for j in range(R.integers(2, 5)): put(thaw, chirp(b, b * R.uniform(1.2, 1.5), 0.07) * 0.25, t0 + j * 0.11, p)
save("amb_thaw", loopify(thaw), 0.55)

morn = np.stack([room(41), room(42)], 1) * 0.45
for k in range(9):
    t0 = R.uniform(0.3, L - 1.2); p = R.uniform(-0.7, 0.7); b = R.uniform(2400, 3400)
    for j in range(R.integers(2, 6)): put(morn, chirp(b, b * R.uniform(1.15, 1.45), 0.08) * 0.22, t0 + j * 0.12, p)
for k in range(int(L)): put(morn, ring([(3100, 1), (5200, 0.4)], 0.03, 220) * 0.5, k + 0.12, -0.55)
save("amb_morning", loopify(morn), 0.5)
print("ok")
