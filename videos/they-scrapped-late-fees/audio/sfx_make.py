"""Synthesised SFX for the library video (48 kHz mono, peak -3 dBFS). The UNLOCK STING is the channel signature
(OUR SIGNATURE, v18 items 11-12): a brass lock click, the bolt sliding back, and a rising three-note pluck - the same
sound at the turn of every video."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(7)
def tt(d): return np.arange(int(d * SR)) / SR
def env(t, a, d): return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def click(d=0.05, f=3200, k=1.0): t = tt(d); return k * (bp(R.normal(0, 1, len(t)), f * 0.6, f * 1.6) * np.exp(-t * 160) + 0.6 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 120))
def pluck(f, d=0.6):
    n = int(d * SR); P = max(2, int(SR / f)); buf = R.uniform(-1, 1, P); y = np.zeros(n)
    for i in range(n): y[i] = buf[i % P]; buf[i % P] = 0.5 * (buf[i % P] + buf[(i + 1) % P]) * 0.997
    return y * env(tt(d), 0.001, 0.35)
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
m = lambda n: 440 * 2 ** ((n - 69) / 12)
# the signature: click, bolt slide, three rising plucks + a bell shimmer
y = np.zeros(int(1.2 * SR)); put(y, click(0.04, 2600, 1.0), 0.0); put(y, click(0.05, 1800, 0.7), 0.06)
sl = tt(0.12); put(y, bp(R.normal(0, 1, len(sl)), 900, 3000) * np.sin(np.pi * sl / 0.12) * 0.25, 0.1)
for i, n in enumerate([72, 76, 79]): put(y, pluck(m(n), 0.7) * 0.8, 0.2 + i * 0.07)
bt = tt(0.9); put(y, (np.sin(2 * np.pi * m(91) * bt) + 0.4 * np.sin(2 * np.pi * m(96) * bt)) * env(bt, 0.005, 0.3) * 0.25, 0.36)
save("unlock", y)
save("key_click", put(np.zeros(int(0.25 * SR)), click(0.05, 2800) + 0.0, 0.0) + put(np.zeros(int(0.25 * SR)), click(0.05, 1900, 0.6), 0.07))
t = tt(0.45); save("tape", bp(R.normal(0, 1, len(t)), 2500, 7000) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t)) * np.minimum(1, t / 0.03) * np.exp(-t * 2.5))
y = np.zeros(int(2.2 * SR)); bt = tt(0.28)
for k in range(4): put(y, np.sign(np.sin(2 * np.pi * 1040 * bt)) * 0.5 * np.minimum(1, bt / 0.01) * np.minimum(1, (0.28 - bt) / 0.01), k * 0.55)
save("beeper", y)
t = tt(2.6); f0 = 52 + 6 * np.sin(2 * np.pi * 0.7 * t); save("engine", (np.sin(2 * np.pi * np.cumsum(f0) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(f0) / SR) + 0.25 * bp(R.normal(0, 1, len(t)), 80, 600)) * np.minimum(1, t / 0.2) * np.minimum(1, (2.6 - t) / 0.3))
y = np.zeros(int(2.4 * SR))
for i in range(70): put(y, (click(0.08, R.uniform(300, 900), R.uniform(0.3, 1.0)) + bp(R.normal(0, 1, int(0.08 * SR)), 1500, 5000) * 0.15), R.uniform(0, 2.0) * (1 - 0.3 * R.random()))
save("avalanche", y)
y = np.zeros(int(0.35 * SR)); put(y, click(0.06, 1400, 0.8), 0); put(y, click(0.05, 900, 0.6), 0.12); save("mail_flap", y)
y = np.zeros(int(0.6 * SR))
for i in range(14): put(y, click(0.03, 2200 + 200 * (i % 3), 0.5), i * 0.025)
save("blinds", y)
t = tt(1.0); save("lid_clang", sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + i)) for i, f in enumerate([420, 1080, 1730, 2650])) * env(t, 0.001, 0.4) + click(1.0, 3000, 0.6))
t = tt(1.0); save("bike_bell", sum(np.sin(2 * np.pi * f * t) for f in [2200, 2650]) * (env(t, 0.002, 0.25) + 0.7 * np.roll(env(t, 0.002, 0.25), int(0.16 * SR))))
t = tt(0.5); save("marker", bp(R.normal(0, 1, len(t)), 1800, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.minimum(1, t / 0.02) * np.minimum(1, (0.5 - t) / 0.05))
y = np.zeros(int(0.3 * SR)); put(y, click(0.05, 1200), 0); put(y, click(0.06, 700, 0.8), 0.05); save("door_click", y)
t = tt(0.6); save("tailgate", (np.sin(2 * np.pi * 160 * t) + 0.6 * np.sin(2 * np.pi * 410 * t) + 0.3 * np.sin(2 * np.pi * 977 * t)) * env(t, 0.002, 0.12) + click(0.6, 2000, 0.8))
y = np.zeros(int(0.5 * SR)); put(y, click(0.12, 600, 1.0), 0); put(y, click(0.1, 1500, 0.7), 0.02)
for i in range(3): put(y, np.sin(2 * np.pi * (3200 + 500 * i) * tt(0.08)) * np.exp(-tt(0.08) * 50) * 0.4, 0.12 + i * 0.09)
save("wood_crack", y)
t = tt(0.5); save("whoosh_soft", bp(R.normal(0, 1, len(t)), 300, 2500) * np.sin(np.pi * t / 0.5) ** 2)
t = tt(0.7); f = 300 * (1 + 0.6 * np.exp(-t * 6)) * (1 + 0.08 * np.sin(2 * np.pi * 14 * t)); save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.25))
t = tt(0.3); save("thump", np.sin(2 * np.pi * np.cumsum(90 * (1 + np.exp(-t * 30))) / SR) * env(t, 0.002, 0.08) + click(0.3, 500, 0.4))
print("ok")
