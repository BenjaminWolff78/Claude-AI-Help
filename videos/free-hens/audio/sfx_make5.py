"""New synthesised SFX for the free-hens video (48 kHz mono). Hens are built from formant-shaped pulse trains."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(11)
def tt(d): return np.arange(int(d * SR)) / SR
def env(t, a, d): return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def click(d=0.05, f=3200, k=1.0): t = tt(d); return k * (bp(R.normal(0, 1, len(t)), f * 0.6, f * 1.6) * np.exp(-t * 160) + 0.6 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 120))
def cluck1(f0=520, d=0.11, rough=0.4):
    t = tt(d); f = f0 * (1 + 0.25 * np.exp(-t * 30)) * (1 - 0.15 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR; src = np.sign(np.sin(ph)) * 0.5 + np.sin(ph) + rough * R.normal(0, 1, len(t))
    y = bp(src, 600, 2600) + 0.6 * bp(src, 2600, 4200); return y * env(t, 0.004, d * 0.45)
# a hen clucking: bok, bok, bok-BAWK
y = np.zeros(int(1.3 * SR))
for i, (tt0, f0) in enumerate([(0.0, 480), (0.17, 500), (0.34, 470), (0.55, 560)]): put(y, cluck1(f0, 0.1 if i < 3 else 0.36, 0.5 if i == 3 else 0.35), tt0)
save("cluck", y)
y = np.zeros(int(0.9 * SR)); put(y, cluck1(700, 0.5, 0.8), 0.0); put(y, cluck1(760, 0.25, 0.9), 0.4); save("squawk", y)
y = np.zeros(int(0.5 * SR))
for i in range(4): put(y, cluck1(430 + 20 * i, 0.07, 0.3), i * 0.11)
save("hen_mutter", y)
# wing flaps (a flurry of soft noise bursts)
y = np.zeros(int(0.8 * SR))
for i in range(9): n = int(0.06 * SR); put(y, bp(R.normal(0, 1, n), 200, 2200) * np.hanning(n) * (1 - i / 12), i * 0.075)
save("flap", y)
# truck horn: two detuned square-ish tones
def horn(d=0.55):
    t = tt(d); y = sum(np.tanh(3 * np.sin(2 * np.pi * f * t)) for f in (330, 392, 415)) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.04)
    return bp(y, 200, 3500)
save("horn_long", horn(0.9)); y = np.zeros(int(0.7 * SR)); put(y, horn(0.2), 0); put(y, horn(0.25), 0.3); save("honk2", y)
# hydraulic lift whine
t = tt(1.6); f = 180 + 120 * np.minimum(1, t / 1.2); y = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.minimum(1, t / 0.15) * np.minimum(1, (1.6 - t) / 0.2) + 0.2 * bp(R.normal(0, 1, len(t)), 300, 1200)
save("hydraulic", y)
# bags thudding into the hopper
y = np.zeros(int(1.8 * SR))
for i in range(10): d = 0.25; tt0 = 0.05 + i * 0.12 + R.uniform(0, 0.05); t = tt(d); put(y, np.sin(2 * np.pi * np.cumsum(70 + 40 * np.exp(-t * 20)) / SR) * env(t, 0.002, 0.07) + bp(R.normal(0, 1, len(t)), 300, 2000) * env(t, 0.001, 0.04) * 0.6, tt0)
save("bags_thud", y)
# noon bell (two bongs)
y = np.zeros(int(2.4 * SR))
for k in range(2): t = tt(2.0); put(y, sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dd) for f, a, dd in ((392, 1, 1.2), (784, 0.5, 2), (1046, 0.3, 3), (1568, 0.15, 4))) * env(t, 0.002, 1.5), k * 1.0)
save("bell_noon", y)
# a short scale beep, a soft plop (egg), slurp, whistle tune, gate squeak, peck taps
t = tt(0.12); save("scale_beep", np.sin(2 * np.pi * 2000 * t) * np.minimum(1, t / 0.005) * np.minimum(1, (0.12 - t) / 0.01))
t = tt(0.25); save("plop", np.sin(2 * np.pi * np.cumsum(220 * (1 + 2 * np.exp(-t * 40))) / SR) * env(t, 0.002, 0.05))
t = tt(0.6); f = 900 - 500 * t / 0.6; save("slurp", bp(R.normal(0, 1, len(t)), 500, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR * 0.02)) * np.sin(np.pi * t / 0.6))
y = np.zeros(int(2.4 * SR)); notes = [79, 83, 86, 83, 79, 81, 83]
for i, n in enumerate(notes): t = tt(0.28); fr = 440 * 2 ** ((n - 69) / 12) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t)); put(y, (np.sin(2 * np.pi * np.cumsum(fr) / SR) + 0.05 * R.normal(0, 1, len(t))) * env(t, 0.03, 0.2), i * 0.3)
save("whistle", y)
t = tt(0.5); save("gate_squeak", bp(np.sin(2 * np.pi * np.cumsum(1400 + 400 * np.sin(2 * np.pi * 3 * t)) / SR) * (0.6 + 0.4 * R.random(len(t))), 800, 4000) * np.sin(np.pi * t / 0.5))
y = np.zeros(int(0.6 * SR))
for i in range(5): put(y, click(0.03, 1800 + 150 * i, 0.6), i * 0.11)
save("pecks", y)
# a hollow knock on the plastic bin
y = np.zeros(int(0.5 * SR))
for i in range(2): t = tt(0.25); put(y, (np.sin(2 * np.pi * 180 * t) + 0.5 * np.sin(2 * np.pi * 410 * t)) * env(t, 0.001, 0.06) + click(0.25, 900, 0.5), i * 0.16)
save("knock_hollow", y)
# the light bin flying up: a short rising whoosh
t = tt(0.45); save("whoosh_up", bp(R.normal(0, 1, len(t)), 400, 3000) * np.sin(np.pi * t / 0.45) ** 2 * (0.5 + t))
print("ok")
