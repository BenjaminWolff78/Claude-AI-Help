"""New synthesised SFX for the pig-tail video (48 kHz mono, original synthesis): hog grunts and a piglet squeal, a hammer
on a nail, bushes rustling, a rifle crack in the pines, the herd rumble, the reel mower, a chain dropping, and the one
stinger: the brass key's lock-click with a low hit under it (the turn at 39.8 s)."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(1225)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def ring(fs, d, dec): c = tt(d); return sum(np.sin(2 * np.pi * f * c) * a for f, a in fs) * np.exp(-c * dec)
def grunt1(f0=95, d=0.28, rough=0.7):
    c = tt(d); env = np.sin(np.pi * np.minimum(1, c / d)) ** 0.6
    ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(2 * np.pi * 3 * c)) + rough * 40 * R.normal(0, 1, len(c))) / SR
    v = np.sign(np.sin(ph)) * 0.5 + np.sin(ph) * 0.5          # buzzy glottal tone
    nz = bp(R.normal(0, 1, len(c)), 200, 2500) * 0.5             # the snout's breath
    return bp(v, 80, 1800) * env + nz * env * 0.6
# grunts: three snorty grunts (rooting hogs)
y = np.zeros(int(1.3 * SR))
for k, (t0, f0, d) in enumerate([(0.0, 90, 0.25), (0.32, 110, 0.18), (0.6, 82, 0.34)]): put(y, grunt1(f0, d) * (1 - 0.15 * k), t0)
save("grunts", y)
# one short snort (a boar)
save("snort", np.concatenate([grunt1(70, 0.32, 1.0), np.zeros(int(0.1 * SR))]))
# a piglet squeal: a rising, wavering whistle-y tone with noise
c = tt(0.5); f = 900 + 700 * np.minimum(1, c / 0.2) - 300 * np.maximum(0, c - 0.3) / 0.2 + 60 * np.sin(2 * np.pi * 14 * c)
ph = 2 * np.pi * np.cumsum(f) / SR; y = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.sin(np.pi * c / 0.5) ** 0.5 + bp(R.normal(0, 1, len(c)), 1500, 6000) * 0.15
save("squeal", y)
# hammer on a nail: a bright metallic tick + the wooden knock of the wall
y = np.zeros(int(0.5 * SR)); put(y, ring([(3150, 1), (5200, 0.5), (7400, 0.25)], 0.12, 60) * 0.7, 0)
put(y, ring([(180, 1), (320, 0.6), (510, 0.3)], 0.3, 22), 0.001); put(y, bp(R.normal(0, 1, int(0.02 * SR)), 1000, 8000) * np.exp(-tt(0.02) * 200), 0)
save("hammer", y)
# bushes rustling hard (the woods getting louder), 1.6 s with a swell
c = tt(1.6); y = bp(R.normal(0, 1, len(c)), 900, 9000) * (0.3 + 0.7 * np.sin(np.pi * c / 1.6)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 7.3 * c)))
for t0 in np.sort(R.uniform(0, 1.5, 18)): put(y, bp(R.normal(0, 1, int(0.05 * SR)), 2000, 9000) * np.exp(-tt(0.05) * 70) * 1.2, t0)
save("rustle", y)
# a rifle crack in the pines: an N-wave crack, a low boom, and two echoes off the trees
y = np.zeros(int(1.8 * SR)); c = tt(0.012); put(y, bp(R.normal(0, 1, len(c)), 800, 16000) * np.exp(-c * 400) * 2.5, 0)
put(y, ring([(65, 1), (110, 0.6)], 0.6, 7) * 0.9, 0.004); put(y, bp(R.normal(0, 1, int(0.25 * SR)), 100, 2500) * np.exp(-tt(0.25) * 18) * 0.6, 0.004)
for t0, g in ((0.28, 0.35), (0.55, 0.18)): put(y, bp(R.normal(0, 1, int(0.3 * SR)), 300, 3000) * np.exp(-tt(0.3) * 12) * g, t0)
save("rifle", y)
# the herd: a low rumble of hooves + many overlapping grunts, 2.8 s, swelling
c = tt(2.8); y = bp(R.normal(0, 1, len(c)), 30, 220) * np.minimum(1, c / 1.2) * 1.6
for t0 in np.sort(R.uniform(0.2, 2.6, 26)): put(y, grunt1(R.uniform(80, 140), R.uniform(0.12, 0.25), 0.9) * R.uniform(0.2, 0.5) * min(1, t0 / 1.2), t0)
for t0 in np.sort(R.uniform(0.8, 2.6, 7)): put(y, bp(np.sin(2 * np.pi * np.cumsum(1100 + 400 * np.sin(np.linspace(0, 3, int(0.25 * SR)))) / SR), 600, 5000) * np.sin(np.linspace(0, np.pi, int(0.25 * SR))) * 0.18, t0)
save("herd", y)
# the reel mower: the whirring reel clicking past the bed knife, 2.8 s
c = tt(2.8); y = bp(R.normal(0, 1, len(c)), 2000, 9000) * 0.15
t0 = 0.0
while t0 < 2.75: put(y, ring([(4200, 1), (6100, 0.5)], 0.03, 120) * 0.35 + bp(R.normal(0, 1, int(0.03 * SR)), 1500, 8000) * np.exp(-tt(0.03) * 150) * 0.3, t0); t0 += 0.045
y += np.sin(2 * np.pi * np.cumsum(np.full(len(c), 55.0)) / SR) * 0.08
save("mower", y)
# a chain slithering off the post and dropping in the grass
y = np.zeros(int(0.9 * SR))
for i in range(14): put(y, ring([(R.uniform(2500, 4200), 1), (R.uniform(5000, 7000), 0.4)], 0.06, 60) * (0.6 - 0.03 * i), 0.02 + i * 0.03 + R.uniform(0, 0.01))
put(y, bp(R.normal(0, 1, int(0.12 * SR)), 300, 3000) * np.exp(-tt(0.12) * 30) * 0.5, 0.45)
save("chain", y)
# THE STINGER: the brass key turning (two clicks) and the lock springing open, with a low hit + a short bright ring under it
uk, sru = sf.read("sfx/unlock.wav"); uk = uk if uk.ndim == 1 else uk.mean(1)
if sru != SR: uk = np.interp(np.arange(int(len(uk) * SR / sru)) / SR, np.arange(len(uk)) / sru, uk)
y = np.zeros(int(1.6 * SR)); put(y, uk / (np.abs(uk).max() + 1e-9) * 0.9, 0.0)
put(y, ring([(55, 1), (82, 0.5)], 1.4, 3.0) * 0.9, 0.05); put(y, ring([(1320, 0.4), (1980, 0.25), (2640, 0.15)], 1.2, 4.0) * 0.35, 0.06)
save("stinger", y)
print("ok")
