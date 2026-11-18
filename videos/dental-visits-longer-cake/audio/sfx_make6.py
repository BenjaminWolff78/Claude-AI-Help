"""New synthesised SFX for the dentist video (48 kHz mono): drill whine, soft polisher hum, egg-timer twist + ticks,
shop-door bell, fireworks pops on the TV, a splash into the cold tub, a polaroid pin, quick footsteps."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(23)
def tt(d): return np.arange(int(d * SR)) / SR
def env(t, a, d): return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
# dental drill: a high whine with a fast pitch wobble and grit, 1.2 s, ramps in and out
t = tt(1.4); f = 3600 + 250 * np.sin(2 * np.pi * 7 * t) + 400 * np.minimum(1, t / 0.15)
ph = 2 * np.pi * np.cumsum(f) / SR; y = 0.6 * np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.15 * bp(R.normal(0, 1, len(t)), 2500, 7000)
y *= np.minimum(1, t / 0.08) * np.minimum(1, (1.4 - t) / 0.2); save("drill", y)
# soft polisher: a low gentle hum (brushy), 1.6 s
t = tt(1.6); ph = 2 * np.pi * np.cumsum(180 + 8 * np.sin(2 * np.pi * 3 * t)) / SR; y = 0.5 * np.sin(ph) + 0.2 * np.sin(2 * ph) + 0.25 * bp(R.normal(0, 1, len(t)), 300, 1600)
y *= np.minimum(1, t / 0.2) * np.minimum(1, (1.6 - t) / 0.4); save("polish", y)
# egg timer: a ratchet twist (12 clicks) then ticking
y = np.zeros(int(1.4 * SR))
for i in range(12): c = tt(0.02); put(y, bp(R.normal(0, 1, len(c)), 2500, 6000) * np.exp(-c * 300) * 0.8, i * 0.028)
for i in range(4): c = tt(0.03); put(y, (np.sin(2 * np.pi * 2600 * c) + 0.5 * bp(R.normal(0, 1, len(c)), 3000, 7000)) * np.exp(-c * 200) * 0.6, 0.5 + i * 0.25)
save("egg_twist", y)
# shop-door bell: two bright dings
y = np.zeros(int(1.2 * SR))
for k, t0 in enumerate([0.0, 0.16]):
    c = tt(1.0); put(y, (np.sin(2 * np.pi * 1760 * c) + 0.4 * np.sin(2 * np.pi * 4520 * c) * np.exp(-c * 4)) * np.exp(-c * 3.5) * (0.8 if k else 1), t0)
save("door_bell", y)
# TV fireworks: three soft pops with crackle tails (from a small speaker: band-limited)
y = np.zeros(int(1.6 * SR))
for t0 in (0.0, 0.35, 0.6):
    c = tt(0.6); put(y, bp(R.normal(0, 1, len(c)), 200, 2400) * np.exp(-c * 18), t0)
    for j in range(14): d = tt(0.01); put(y, bp(R.normal(0, 1, len(d)), 2000, 6000) * 0.3, t0 + 0.08 + R.uniform(0, 0.4))
save("tv_fireworks", y)
# a hand plunged into cold water: a short splash
c = tt(0.6); y = bp(R.normal(0, 1, len(c)), 400, 5000) * env(c, 0.005, 0.12) + 0.4 * np.sin(2 * np.pi * (300 + 600 * np.exp(-c * 20)) * c) * np.exp(-c * 14); save("splash", y)
# a polaroid pinned to cork: a soft thunk + pin click
c = tt(0.25); y = 0.7 * np.sin(2 * np.pi * 140 * c) * np.exp(-c * 30) + 0.4 * bp(R.normal(0, 1, len(c)), 2000, 6000) * np.exp(-c * 120); save("pin", y)
# quick footsteps out of the door (8 steps)
y = np.zeros(int(1.6 * SR))
for i in range(8): c = tt(0.08); put(y, (0.8 * np.sin(2 * np.pi * 110 * c) * np.exp(-c * 50) + 0.3 * bp(R.normal(0, 1, len(c)), 500, 3000) * np.exp(-c * 80)), i * 0.17 + R.uniform(0, 0.02))
save("footsteps", y)
print("ok")
