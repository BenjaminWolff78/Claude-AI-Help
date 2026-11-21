"""New synthesised SFX for the skull video (48 kHz mono, original synthesis): bone crack, shard tinkle, coin slide, clay
crumble, shard rattle (a basket poured into a crate), a small fit click, a long coin pour, little hammer taps, tin plink,
knife chop, brush stroke, sap squelch."""
import numpy as np, soundfile as sf
SR = 48000; R = np.random.default_rng(62)
def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def put(y, x, t): i = int(t * SR); j = min(len(y), i + len(x)); y[i:j] += x[:j - i]; return y
def save(name, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; sf.write(f"sfx/{name}.wav", y.astype(np.float32), SR)
def tick(f0, d=0.05, dec=120, g=1.0): c = tt(d); return (np.sin(2 * np.pi * f0 * c) + 0.5 * np.sin(2 * np.pi * 2.7 * f0 * c)) * np.exp(-c * dec) * g
# bone crack: a dry crunch (several micro-cracks) + a low knock, 0.5 s
y = np.zeros(int(0.5 * SR)); c = tt(0.12); put(y, 0.9 * np.sin(2 * np.pi * (180 + 200 * np.exp(-c * 50)) * c) * np.exp(-c * 30), 0.0)
for i in range(7): c = tt(0.05); put(y, bp(R.normal(0, 1, len(c)), 1200 + 400 * i, 7000) * np.exp(-c * (80 + 10 * i)) * (0.9 - 0.08 * i), 0.004 + i * 0.011 + R.uniform(0, 0.004))
save("bone_crack", y)
# shard tinkle: little bone bits landing on wood, 1.2 s
y = np.zeros(int(1.3 * SR))
for i in range(16): put(y, tick(R.uniform(900, 2400), 0.06, R.uniform(90, 160), R.uniform(0.3, 0.8)), 0.05 + i * 0.07 + R.uniform(0, 0.03))
save("tinkle", y)
# coin slide: a stack pushed across wood (scrape + a soft clink at the end), 1.0 s
t = tt(1.0); y = bp(R.normal(0, 1, len(t)), 600, 3500) * np.minimum(1, t / 0.08) * np.clip((0.85 - t) / 0.1, 0, 1) * 0.35
put(y, tick(3100, 0.2, 18, 0.6) + tick(4200, 0.2, 22, 0.4), 0.86); save("coin_slide", y)
# clay crumble: dirt clods falling, 0.8 s
y = np.zeros(int(0.9 * SR))
for i in range(22): c = tt(0.08); put(y, bp(R.normal(0, 1, len(c)), 150, 1500) * np.exp(-c * R.uniform(40, 80)) * R.uniform(0.3, 1.0), R.uniform(0, 0.6))
save("crumble", y)
# shard rattle: a basket of pieces poured into a crate, 1.1 s
y = np.zeros(int(1.2 * SR))
for i in range(60): put(y, tick(R.uniform(700, 2200), 0.05, R.uniform(100, 200), R.uniform(0.2, 0.7)), R.uniform(0.0, 0.9) ** 1.3)
save("rattle", y)
# fit click: two pieces snapping together, 0.25 s
y = np.zeros(int(0.25 * SR)); put(y, tick(1800, 0.06, 150, 1.0), 0.0); put(y, tick(2600, 0.05, 200, 0.6), 0.025); save("click_fit", y)
# coin pour: a long shower of coins into cupped hands, 1.4 s
y = np.zeros(int(1.5 * SR))
for i in range(70): put(y, tick(R.uniform(2600, 4800), 0.12, R.uniform(25, 45), R.uniform(0.2, 0.6)), 0.05 + 1.15 * (i / 70) + R.uniform(0, 0.02))
save("coin_pour", y)
# little hammer taps: four light taps on stone, 1.0 s
y = np.zeros(int(1.0 * SR))
for i in range(5): c = tt(0.07); put(y, (0.7 * np.sin(2 * np.pi * 420 * c) + 0.5 * bp(R.normal(0, 1, len(c)), 1500, 6000)) * np.exp(-c * 70), i * 0.19)
save("taps", y)
# tin plink: a coin dropped into a tin can, 0.5 s
c = tt(0.5); y = (np.sin(2 * np.pi * 2300 * c) + 0.6 * np.sin(2 * np.pi * 3470 * c) + 0.3 * np.sin(2 * np.pi * 5200 * c)) * np.exp(-c * 9) * (1 - np.exp(-c * 3000)); save("plink", y)
# knife chop: four chops through fruit onto a plate, 1.4 s
y = np.zeros(int(1.4 * SR))
for i in range(4): c = tt(0.12); put(y, 0.6 * bp(R.normal(0, 1, len(c)), 800, 5000) * np.exp(-c * 50) + 0.5 * np.sin(2 * np.pi * 900 * c) * np.exp(-c * 60), i * 0.36)
save("chop", y)
# brush stroke: a soft wet brush across a board, 0.6 s
t = tt(0.6); y = bp(R.normal(0, 1, len(t)), 1200, 5000) * np.sin(np.pi * t / 0.6) ** 2 * 0.4; save("brush", y)
# sap squelch: a sticky little squish, 0.4 s
t = tt(0.4); ph = 2 * np.pi * np.cumsum(140 + 120 * np.sin(2 * np.pi * 9 * t)) / SR; y = (0.6 * np.sin(ph) + 0.3 * bp(R.normal(0, 1, len(t)), 300, 2000)) * np.exp(-t * 9) * np.minimum(1, t / 0.02); save("squelch", y)
print("ok")
