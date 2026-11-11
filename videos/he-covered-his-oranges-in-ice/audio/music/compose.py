"""Original underscore for "He Covered His Oranges in Ice to Stop Them Freezing" (64.2 s): an old-timey Florida porch
feel in G major, 118 BPM - Karplus-Strong banjo rolls, boom-chick plucked bass, fiddle-ish pizzicato, brushed shaker,
glassy bells for the ice. Sections follow the scenes: dusk banjo rag (0-16.7), 9 p.m. tiptoe (16.7-20.7), midnight
bells (20.7-24.9), 3 a.m. tension + dip on the snap (24.9-29.4), scarecrow tiptoe (29.4-32.3), Duane's thermometer
tension (32.3-37.0), quiet hold (37.0-38.8), the trick: a rising build from 38.8, cellar bells (47.8-52.2), the sunrise
payoff: full rag + a warm boom on 52.2, a lighter rag to the end. No fade: the mixer cuts it on the last word."""
import numpy as np, soundfile as sf, sys
SR = 44100; BPM = 118; B = 60 / BPM; L = 64.6
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(31)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i >= N or j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r
def tt(d): return np.arange(int(d * SR)) / SR
_ks = {}
def banjo(f, d=0.7, bright=0.5):
    key = (round(f, 1), d, bright)
    if key in _ks: return _ks[key]
    n = int(d * SR); P = max(2, int(SR / f)); buf = rng.uniform(-1, 1, P) * np.hanning(P) ** 0.2; y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % P]; nxt = buf[(i + 1) % P]
        buf[i % P] = (bright * buf[i % P] + (1 - bright) * nxt) * 0.996
    t = tt(d); y *= np.exp(-t * 3.2) * (1 - np.exp(-t * 2000))
    y += 0.25 * np.sin(2 * np.pi * f * t) * np.exp(-t * 12)          # the drum-head "plunk"
    _ks[key] = y; return y
def bass(f, d):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 4.5) * (1 - np.exp(-t * 300))
def pizz(f, d=0.22):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 14) * (1 - np.exp(-t * 900))
def bell(f, d=1.4):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 7)) * np.exp(-t * 2.2) * (1 - np.exp(-t * 3000))
def pad(fs, d, soft=1.0):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.003 * f * t) + 0.15 * np.sin(2 * np.pi * 2.997 * f * t) for f in fs) / len(fs)
    e = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.6); return y * e * 0.5 * soft
def shaker(d=0.07):
    n = rng.normal(0, 1, int(d * SR)); n = np.diff(n, prepend=0); t = tt(d); return n * np.exp(-t * 70) * 0.5
def drum(f0=90, d=0.4):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (1 + 1.4 * np.exp(-t * 28))) / SR; return np.sin(ph) * np.exp(-t * 8)
G, C, D7, Em, Am, B7 = [55, 59, 62], [48, 52, 55], [50, 54, 57, 60], [52, 55, 59], [45, 48, 52], [47, 51, 54, 57]
ROLL = [0, 2, 1, 2, 0, 2, 1, 2]    # forward roll over the chord tones (eighths)
MEL = [74, 71, 74, 76, 74, 71, 67, 69, 71, 74, 72, 71, 69, 67, 69, 71, 79, 78, 76, 74, 76, 74, 71, 69]
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("rag", "full", "light"):
            if b in (0, 2): add(bass(midi(root - 12 + (7 if b == 2 else 0)), B * 0.9), t, 0, 0.42 * g)
            for e in (0, 1):
                k = ROLL[(beat * 2 + e) % 8]; add(banjo(midi(ch[k % len(ch)] + 12), 0.6), t + e * B / 2, 0.2 if e else -0.15, (0.13 if style != "light" else 0.09) * g)
            add(shaker(), t + B / 2, 0.45, 0.035 * g)
            if style == "full":
                if b % 2 == 0: add(banjo(midi(MEL[beat % len(MEL)]), 0.8, 0.35), t, -0.3, 0.12 * g)
                if b == 0: add(drum(100, 0.3), t, 0, 0.14 * g)
        if style == "tiptoe":
            add(pizz(midi(ch[(beat * 2) % 3] + 12)), t, -0.2, 0.12 * g); add(pizz(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.07 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.28 * g)
        if style == "bells":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.12 * g)
            if b % 2 == 0: add(bell(midi(MEL[beat % len(MEL)] + 12)), t, 0.3 * (1 if b else -1), 0.06 * g)
            add(banjo(midi(ch[beat % 3] + 12), 0.5), t + B / 2, 0.1, 0.05 * g)
        if style == "tension":
            if b == 0: add(pad([midi(n - 12) for n in ch[:3]], B * 4, 0.9), t, 0, 0.16 * g)
            if b in (0, 2): add(drum(70, 0.4), t, 0, 0.14 * g)
            add(pizz(midi(ch[b % 3] + 12)), t + B / 2, 0.3 * (1 if b % 2 else -1), 0.08 * g)
        if style == "build":
            k = (t - t0) / max(1e-6, t1 - t0)
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.7 + 0.5 * k), t, 0, 0.12 * g)
            for e in (0, 1):
                kk = ROLL[(beat * 2 + e) % 8]; add(banjo(midi(ch[kk % len(ch)] + 12), 0.5), t + e * B / 2, 0.2 if e else -0.15, (0.03 + 0.09 * k) * g)
            if b in (0, 2): add(bass(midi(root - 12), B * 0.9), t, 0, (0.15 + 0.25 * k) * g)
            if b == 3 and k > 0.5: add(drum(95, 0.25), t + B / 2, 0, 0.08 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 16.7, [G, C, D7, G], "rag")
section(16.7, 20.7, [Em, C, D7, G], "tiptoe", 0.9)
section(20.7, 24.9, [G, Em, C, D7], "bells")
section(24.9, 29.4, [Em, Am, Em, B7], "tension")
section(29.4, 32.3, [G, D7], "tiptoe")
section(32.3, 37.0, [Am, Em, B7, Em], "tension", 0.9)
section(37.0, 38.8, [C, D7], "tiptoe", 0.6)
section(38.8, 47.8, [C, G, Am, D7], "build")
section(47.8, 52.2, [C, G, Am, D7], "bells", 1.0)
section(52.2, 58.0, [G, C, D7, G], "full")
section(58.0, 64.6, [G, C, D7, G], "light", 0.9)
# the stinger at the turn ("That's the trick", 38.8) and a warm boom on the sunrise (52.2)
for n in [55, 59, 62, 67]: add(banjo(midi(n + 12), 1.2, 0.4), 38.76 + (n - 55) * 0.012, 0.1, 0.11)
add(drum(60, 1.2), 52.2, 0, 0.32); [add(pad([midi(n) for n in [43, 55, 59, 62]], 3.0, 1.2), 52.2, 0, 0.14) for _ in [0]]
for i, n in enumerate([79, 83, 86, 91]): add(bell(midi(n)), 52.25 + i * 0.09, 0.3 * (i % 2 * 2 - 1), 0.06)
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
