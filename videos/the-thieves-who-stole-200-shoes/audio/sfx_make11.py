"""New synthesised SFX for the shoes video (48 kHz mono, original synthesis): the padlock snap, the shutter rolling up,
a door slam, the tricycle's freewheel, a bolt-cutter clank, a soft cardboard drop of shoes."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(1131)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def mixs(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def ring(fs, d, dec): c = tt(d); return sum(np.sin(2 * np.pi * f * c) * a for f, a in fs) * np.exp(-c * dec)
# padlock snap: a hard crack, a bright ring of the shackle, the lock clattering on the pavement
y = np.zeros(int(1.0 * SR)); c = tt(0.02); put(y, bp(R.normal(0, 1, len(c)), 1500, 12000) * np.exp(-c * 300) * 1.5, 0)
put(y, ring([(2350, 1), (3720, 0.6), (5210, 0.3)], 0.5, 9) * 0.6, 0.002)
for k, t0 in enumerate([0.42, 0.55, 0.62]): put(y, mixs(ring([(1650 + 300 * k, 1), (2900, 0.5)], 0.12, 40) * (0.5 - 0.12 * k), bp(R.normal(0, 1, int(0.03 * SR)), 800, 6000) * np.exp(-tt(0.03) * 120) * 0.3), t0)
save("snap", y)
# shutter: a corrugated steel curtain rolling up (fast ribs clattering, a rising whirr, a clunk at the top), 1.3 s
y = np.zeros(int(1.4 * SR)); t = 0.0
while t < 1.15:
    c = tt(0.03); put(y, mixs(bp(R.normal(0, 1, len(c)), 400, 5000) * np.exp(-c * 140) * R.uniform(0.4, 0.8), ring([(R.uniform(500, 900), 1)], 0.03, 120) * 0.3), t); t += 0.028 + 0.02 * (t / 1.15)
c = tt(1.15); put(y, np.sin(2 * np.pi * np.cumsum(90 + 60 * c / 1.15) / SR) * 0.25 * np.minimum(1, c / 0.1), 0)
put(y, mixs(ring([(140, 1), (300, 0.5)], 0.3, 18) * 0.9, bp(R.normal(0, 1, int(0.05 * SR)), 200, 3000) * np.exp(-tt(0.05) * 80) * 0.5), 1.15)
save("shutter", y)
# door slam: a low wooden thud + rattle of the frame
y = np.zeros(int(0.8 * SR)); put(y, mixs(ring([(70, 1), (120, 0.6)], 0.4, 14) * 1.2, bp(R.normal(0, 1, int(0.06 * SR)), 100, 2500) * np.exp(-tt(0.06) * 60)), 0)
for i in range(6): put(y, bp(R.normal(0, 1, int(0.02 * SR)), 1200, 6000) * np.exp(-tt(0.02) * 200) * (0.4 - 0.05 * i), 0.08 + i * 0.035)
save("slam", y)
# freewheel: a bicycle hub ticking (tricycle rolling up), 2.2 s, slowing down
y = np.zeros(int(2.3 * SR)); t = 0.0; dt = 0.035
while t < 2.2: put(y, ring([(3300 + R.uniform(-200, 200), 1), (5100, 0.4)], 0.015, 300) * 0.6, t); t += dt; dt *= 1.012
save("freewheel", y)
# clank: steel jaws slipping off a hardened shackle
y = np.zeros(int(0.6 * SR)); put(y, mixs(ring([(1240, 1), (1870, 0.7), (2990, 0.4), (4410, 0.2)], 0.5, 11), bp(R.normal(0, 1, int(0.02 * SR)), 1000, 9000) * np.exp(-tt(0.02) * 250) * 0.8), 0)
save("clank2", y)
# shoe drop: a handful of sneakers falling into a cardboard box (soft rubbery thumps)
y = np.zeros(int(0.7 * SR))
for i in range(7): c = tt(0.08); put(y, (np.sin(2 * np.pi * R.uniform(140, 260) * c) * 0.8 + bp(R.normal(0, 1, len(c)), 150, 1600) * 0.6) * np.exp(-c * 50) * R.uniform(0.5, 1.0), i * 0.07)
save("shoedrop", y)
print("ok")
