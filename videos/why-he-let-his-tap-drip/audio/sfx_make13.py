"""New synthesised SFX for the dripping-tap video (48 kHz mono, original synthesis): ice creaking in a pipe, the pipe bursting
in the wall, a water spray loop, a ketchup splat, a metal bucket sliding in a porcelain sink, a fat drop plunk, a stiff tap
handle squeak, snow crunching under boots."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(2511)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def ring(fs, d, dec): c = tt(d); return sum(np.sin(2 * np.pi * f * c) * a for f, a in fs) * np.exp(-c * dec)
# ice creak: clusters of tiny dry clicks (stick-slip) with a faint tonal groan, 1.6 s
y = np.zeros(int(1.6 * SR))
for k in range(70):
    t0 = R.uniform(0, 1.5); a = R.uniform(0.2, 1.0) * (0.4 + 0.6 * np.sin(np.pi * t0 / 1.6))
    put(y, bp(R.normal(0, 1, int(0.004 * SR)), 1500, 9000) * np.exp(-tt(0.004) * 900) * a, t0)
c = tt(1.6); g = np.sin(2 * np.pi * np.cumsum(240 + 60 * np.sin(2 * np.pi * 0.7 * c)) / SR) * 0.08 * np.sin(np.pi * c / 1.6) ** 2
save("ice_creak", y + g)
# pipe burst inside the wall: a sharp crack, a metallic ping, then a rushing hiss
y = np.zeros(int(1.4 * SR)); put(y, bp(R.normal(0, 1, int(0.03 * SR)), 300, 9000) * np.exp(-tt(0.03) * 120) * 1.0, 0.0)
put(y, ring([(1240, 1), (2890, 0.5), (4410, 0.25)], 0.5, 9) * 0.35, 0.002)
c = tt(1.3); put(y, bp(R.normal(0, 1, len(c)), 1200, 9000) * (1 - np.exp(-c * 30)) * np.exp(-c * 0.8) * 0.55, 0.03)
save("pipe_burst", y)
# a water spray loop (2.5 s): broadband hiss with a slow splatter flutter
c = tt(2.5); y = bp(R.normal(0, 1, len(c)), 900, 11000) * (0.75 + 0.25 * np.sin(2 * np.pi * 5.3 * c + R.uniform(0, 6)))
for k in range(60): put(y, bp(R.normal(0, 1, int(0.01 * SR)), 300, 3000) * np.exp(-tt(0.01) * 300) * R.uniform(0.3, 1.2), R.uniform(0, 2.45))
y *= np.minimum(1, c / 0.06) * np.minimum(1, (2.5 - c) / 0.15); save("spray", y)
# ketchup splat: a wet low burst with a squishy flutter
c = tt(0.35); y = bp(R.normal(0, 1, len(c)), 120, 2400) * np.exp(-c * 14) * (1 + 0.6 * np.sin(2 * np.pi * 38 * c)); save("splat", y)
# a metal bucket sliding a few cm in a porcelain sink: a scrape with a low steel resonance
c = tt(0.55); y = bp(R.normal(0, 1, len(c)), 600, 5000) * np.sin(np.pi * c / 0.55) ** 0.7 * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * c))
y += ring([(520, 1), (1310, 0.5)], 0.55, 5) * 0.25 * np.sin(np.pi * c / 0.55); save("bucket_slide", y)
# the fat drop: a deep plunk into the bucket (a falling-pitch bubble + a small splash)
c = tt(0.5); f = 380 + 900 * np.exp(-c * 30); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-c * 9) * (1 - np.exp(-c * 2000))
put(y, bp(R.normal(0, 1, int(0.05 * SR)), 1500, 8000) * np.exp(-tt(0.05) * 60) * 0.3, 0.0); save("plunk", y)
# a stiff cross-handle tap squeak (a short rising squeal)
c = tt(0.3); f = 1100 + 700 * c / 0.3; y = np.sin(2 * np.pi * np.cumsum(f) / SR + 0.6 * np.sin(2 * np.pi * 60 * c)) * np.sin(np.pi * c / 0.3) ** 1.5 * 0.6
y += bp(R.normal(0, 1, len(c)), 2000, 7000) * 0.08 * np.sin(np.pi * c / 0.3); save("tap_squeak", y)
# snow crunch under a boot (one step)
c = tt(0.3); y = np.zeros(len(c))
for k in range(45): put(y, bp(R.normal(0, 1, int(0.006 * SR)), 800, 7000) * np.exp(-tt(0.006) * 500) * R.uniform(0.3, 1), R.uniform(0, 0.22))
save("snow_step", y)
print("ok")
