"""New synthesised SFX for the car-ban video (48 kHz mono, original synthesis): a cough, a ratchet wrench, a sputtering old
engine, a hubcap that rolls and settles, a key hung on a hook, a counter flip."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(71)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def tick(f0, d=0.05, dec=120, g=1.0): c = tt(d); return (np.sin(2 * np.pi * f0 * c) + 0.5 * np.sin(2 * np.pi * 2.7 * f0 * c)) * np.exp(-c * dec) * g
# cough: two short breathy bursts with a chesty formant
y = np.zeros(int(0.6 * SR))
for k, (t0, g) in enumerate([(0.0, 1.0), (0.24, 0.7)]):
    c = tt(0.17); n = bp(R.normal(0, 1, len(c)), 250, 2600) * np.exp(-c * 22) * (1 - np.exp(-c * 500))
    n += 0.5 * np.sin(2 * np.pi * (150 - 40 * c / 0.17) * c) * np.exp(-c * 25); put(y, n * g, t0)
save("cough", y)
# ratchet: fast metal clicks in two pulls
y = np.zeros(int(1.0 * SR))
for pull in (0.0, 0.5):
    for i in range(9): put(y, tick(2600 + R.uniform(-150, 150), 0.03, 260, 0.8) + 0.5 * bp(R.normal(0, 1, int(0.03 * SR)), 3000, 9000) * np.exp(-tt(0.03) * 200), pull + i * 0.04)
save("ratchet", y)
# sputter: an old engine misfiring (low pulses at an uneven rate + exhaust noise), 1.6 s
y = np.zeros(int(1.6 * SR)); t = 0.0
while t < 1.5:
    c = tt(0.09); p = np.sin(2 * np.pi * (70 + R.uniform(-8, 8)) * c) * np.exp(-c * 30) + 0.5 * bp(R.normal(0, 1, len(c)), 200, 1800) * np.exp(-c * 45)
    put(y, p * R.uniform(0.6, 1.0), t); t += R.uniform(0.055, 0.11)
save("sputter", y)
# hubcap: a ringing metal disc that rolls and rattles down, 1.3 s
t = tt(1.3); rate = 6 + 26 * (t / 1.3) ** 2; ph = 2 * np.pi * np.cumsum(rate) / SR
y = (np.sin(2 * np.pi * 1850 * t) + 0.6 * np.sin(2 * np.pi * 2930 * t) + 0.3 * np.sin(2 * np.pi * 4400 * t)) * (0.5 + 0.5 * np.sign(np.sin(ph))) * np.exp(-t * 1.6) * np.clip((1.3 - t) / 0.25, 0, 1)
put(y, tick(1500, 0.25, 14, 1.2), 0.0); save("hubcap", y)
# key hung on a hook: two small jingles and a tap
y = np.zeros(int(0.5 * SR)); put(y, tick(4200, 0.12, 40, 0.6), 0.0); put(y, tick(5100, 0.1, 50, 0.5), 0.05); put(y, tick(3300, 0.2, 22, 0.8), 0.13); put(y, tick(600, 0.05, 90, 0.5), 0.13)
save("key_hang", y)
# counter flip: four split-flap clacks
y = np.zeros(int(0.6 * SR))
for i in range(4): c = tt(0.05); put(y, bp(R.normal(0, 1, len(c)), 900, 5000) * np.exp(-c * 120) + tick(1200, 0.05, 150, 0.5), i * 0.11)
save("flip", y)
print("ok")
