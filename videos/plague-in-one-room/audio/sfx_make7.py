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
# ---- plague video SFX (original synthesis) ----
# orb hum: a low pulsing magic drone, 2.4 s
t = tt(2.4); y = (0.6 * np.sin(2 * np.pi * 65 * t) + 0.3 * np.sin(2 * np.pi * 131 * t + 0.4 * np.sin(2 * np.pi * 5 * t))) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.5 * t)) * np.minimum(1, t / 0.3) * np.minimum(1, (2.4 - t) / 0.5); save("orb_hum", y)
# curse zap: a short descending sparkle + crackle, 0.45 s
t = tt(0.45); ph = 2 * np.pi * np.cumsum(2200 * np.exp(-t * 5) + 300) / SR; y = 0.5 * np.sin(ph) * np.exp(-t * 7) + 0.35 * bp(R.normal(0, 1, len(t)), 3000, 9000) * np.exp(-t * 14); save("zap", y)
# rune shimmer: soft rising glassy tones, 0.9 s
y = np.zeros(int(1.0 * SR))
for i, f0 in enumerate([880, 1175, 1480, 1760]): c = tt(0.6); put(y, np.sin(2 * np.pi * f0 * c) * np.exp(-c * 6) * (1 - np.exp(-c * 400)) * 0.5, i * 0.07)
save("shimmer", y)
# countdown ticks: 10 quick wood ticks, 1.0 s
y = np.zeros(int(1.05 * SR))
for i in range(10): c = tt(0.03); put(y, (np.sin(2 * np.pi * 1900 * c) + 0.4 * bp(R.normal(0, 1, len(c)), 2500, 7000)) * np.exp(-c * 220) * 0.7, i * 0.1)
save("ticks", y)
# wolf growl: a low rough rumble, 0.8 s
t = tt(0.8); y = bp(R.normal(0, 1, len(t)), 90, 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)) * np.minimum(1, t / 0.05) * np.minimum(1, (0.8 - t) / 0.2); save("growl", y)
# shrink into the stone: a quick downward glassy sweep + tiny click, 0.6 s
t = tt(0.6); ph = 2 * np.pi * np.cumsum(1400 * np.exp(-t * 4) + 200) / SR; y = 0.5 * np.sin(ph) * np.minimum(1, t / 0.02) * np.exp(-t * 3); c = tt(0.04); put(y, bp(R.normal(0, 1, len(c)), 3000, 8000) * np.exp(-c * 150), 0.55); save("shrink", y)
# crystal crack + pop out: a bright crack and a soft pop, 0.5 s
y = np.zeros(int(0.5 * SR)); c = tt(0.08); put(y, bp(R.normal(0, 1, len(c)), 2500, 9000) * np.exp(-c * 60), 0.0); c = tt(0.25); put(y, 0.7 * np.sin(2 * np.pi * (260 + 500 * np.exp(-c * 30)) * c) * np.exp(-c * 16), 0.06); save("pop", y)
# body thud on cobbles (cartoon fall), 0.4 s
c = tt(0.4); y = 0.8 * np.sin(2 * np.pi * (70 + 40 * np.exp(-c * 30)) * c) * np.exp(-c * 12) + 0.3 * bp(R.normal(0, 1, len(c)), 200, 1800) * np.exp(-c * 40); save("thud", y)
# armour clank (champion), 0.6 s
c = tt(0.6); y = (np.sin(2 * np.pi * 1250 * c) + 0.6 * np.sin(2 * np.pi * 2710 * c) + 0.4 * np.sin(2 * np.pi * 3890 * c)) * np.exp(-c * 9) * 0.5 + 0.3 * bp(R.normal(0, 1, len(c)), 2000, 7000) * np.exp(-c * 50); save("clank", y)
# healing chime: a warm arpeggio, 1.2 s
y = np.zeros(int(1.3 * SR))
for i, f0 in enumerate([523, 659, 784, 1047, 1319]): c = tt(0.8); put(y, (np.sin(2 * np.pi * f0 * c) + 0.3 * np.sin(4 * np.pi * f0 * c)) * np.exp(-c * 4) * (1 - np.exp(-c * 300)) * 0.4, i * 0.09)
save("heal", y)
# sneeze: a breathy "ah" swell + noise burst "choo", 0.7 s
t = tt(0.7); y = bp(R.normal(0, 1, len(t)), 500, 3000) * np.minimum(1, t / 0.3) * (t < 0.36) * 0.3; c = tt(0.25); put(y, bp(R.normal(0, 1, len(c)), 800, 6000) * np.exp(-c * 14) * 0.9, 0.38); save("sneeze", y)
# lever clunk + power-down whir, 1.0 s
y = np.zeros(int(1.0 * SR)); c = tt(0.12); put(y, 0.8 * np.sin(2 * np.pi * 120 * c) * np.exp(-c * 40) + 0.4 * bp(R.normal(0, 1, len(c)), 800, 4000) * np.exp(-c * 60), 0.0)
c = tt(0.8); put(y, 0.35 * np.sin(2 * np.pi * np.cumsum(400 * np.exp(-c * 3) + 60) / SR) * np.exp(-c * 2), 0.12); save("lever", y)
# restart beeps: three rising computer beeps, 0.6 s
y = np.zeros(int(0.7 * SR))
for i, f0 in enumerate([660, 880, 1320]): c = tt(0.12); put(y, np.sign(np.sin(2 * np.pi * f0 * c)) * 0.25 * np.minimum(1, (0.12 - c) / 0.02), i * 0.16)
save("beeps", y)
# rewind: a quick tape-rewind chatter (soft), 1.1 s
t = tt(1.1); y = bp(R.normal(0, 1, len(t)), 1500, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * (18 + 30 * t) * t)) * np.minimum(1, t / 0.1) * np.minimum(1, (1.1 - t) / 0.2) * 0.4; save("rewind", y)
