"""Original underscore for "The Thieves Who Stole 200 Shoes Nobody Can Wear" (63.2 s): a sneaky caper at 120 BPM in E minor
(pizzicato plucks, walking bass, marimba, shaker, a hand drum). Cue sheet in CP2. No fade: the mixer cuts on the last word."""
import numpy as np, soundfile as sf, sys, soundfile as sf, sys
SR = 44100; BPM = 120; B = 60 / BPM; L = 64.0
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(71)
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


Em, C, Am, B7, G, D, Emaj = [64, 67, 71], [60, 64, 67], [57, 60, 64], [59, 63, 66], [55, 59, 62], [62, 66, 69], [64, 68, 71]
Dm, Bb, F, Gm, A = Em, C, G, Am, B7
ROLL = [0, 1, 2, 1, 0, 2, 1, 2]
MEL = [76, 79, 83, 81, 79, 76, 74, 76, 79, 81, 83, 86, 83, 81, 79, 78, 76, 71, 74, 76, 79, 78, 76, 74]
def marimba(f, d=0.9):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.92 * f * t) * np.exp(-t * 5) + 0.25 * np.sin(2 * np.pi * 4.1 * f * t) * np.exp(-t * 9)) * np.exp(-t * 6.5) * (1 - np.exp(-t * 2500))
def gong(f=55, d=3.0):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 1.5 * f * t + 0.3 * np.sin(2 * np.pi * 3 * t)) + 0.2 * np.sin(2 * np.pi * 2.4 * f * t) * np.exp(-t * 1.5)) * np.exp(-t * 0.9) * (1 - np.exp(-t * 400))
def harp(f, d=0.5): return banjo(f, d, 0.6)
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("rag", "full", "light", "hit"):
            if b in (0, 2): add(bass(midi(root - 12 + (7 if b == 2 else 0)), B * 0.9), t, 0, 0.4 * g)
            for e in (0, 1):
                k = ROLL[(beat * 2 + e) % 8]; add(harp(midi(ch[k % len(ch)] + 12), 0.4), t + e * B / 2, 0.2 if e else -0.15, (0.12 if style != "light" else 0.07) * g)
            add(shaker(), t + B / 2, 0.45, 0.03 * g)
            if style in ("full", "hit"):
                add(marimba(midi(MEL[beat % len(MEL)])), t, -0.3, 0.07 * g)
                if b == 0: add(drum(105, 0.3), t, 0, 0.13 * g)
                if b == 2: add(drum(150, 0.18), t, 0.1, 0.08 * g)
        if style == "tiptoe":
            add(pizz(midi(ch[(beat * 2) % 3] + 12)), t, -0.2, 0.12 * g); add(pizz(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.06 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.26 * g)
            if b == 3: add(marimba(midi(MEL[(beat // 2) % len(MEL)]), 0.6), t + B / 2, 0.25, 0.03 * g)
        if style == "bells":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.1 * g)
            if b % 2 == 0: add(marimba(midi(MEL[beat % len(MEL)])), t, 0.3 * (1 if b else -1), 0.06 * g)
            add(harp(midi(ch[beat % 3] + 12), 0.4), t + B / 2, 0.1, 0.05 * g)
        if style == "build":
            k = (t - t0) / max(1e-6, t1 - t0)
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.6 + 0.5 * k), t, 0, 0.1 * g)
            for e in (0, 1):
                kk = ROLL[(beat * 2 + e) % 8]; add(harp(midi(ch[kk % len(ch)] + 12), 0.4), t + e * B / 2, 0.2 if e else -0.15, (0.04 + 0.09 * k) * g)
            if b in (0, 2): add(bass(midi(root - 12), B * 0.9), t, 0, (0.15 + 0.25 * k) * g)
            if b % 2 == 1 and k > 0.4: add(marimba(midi(MEL[beat % len(MEL)]), 0.5), t, 0.2, (0.03 + 0.05 * k) * g)
            if b == 3 and k > 0.5: add(drum(95, 0.25), t + B / 2, 0, 0.08 * g)
        beat += 1; t = t0 + beat * B


# the walking bass under the heist (sneaky caper): quarter notes walking between chord tones
def walk(t0, t1, prog, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        ch = prog[(beat // 4) % len(prog)]; b = beat % 4; r = ch[0] - 24
        n = [r, r + 7, r + 12, r + 10][b]; add(bass(midi(n), B * 0.85), t, -0.05, 0.36 * g)
        if b in (1, 3): add(shaker(0.05), t + B / 2, 0.4, 0.025 * g)
        beat += 1; t = t0 + beat * B
add(drum(70, 0.6), 0.0, 0, 0.18)                                   # frame 0: a low hand-drum hit with the first sweep
section(0.0, 5.2, [Em, C, Am, B7], "tiptoe", 0.8)                  # hook: tense pizz ostinato
walk(5.3, 13.7, [Em, Am, B7, Em], 0.9); section(5.3, 13.7, [Em, Am, B7, Em], "tiptoe", 0.55)   # the street at 3 a.m.
add(drum(110, 0.25), 13.77, 0, 0.16); add(bell(midi(83), 0.8), 13.77, 0.2, 0.06)                 # the snap (413)
walk(13.8, 24.6, [Em, C, Am, B7], 1.0); section(13.8, 24.6, [Em, C, Am, B7], "light", 0.75)     # the shutter, the wave, the sweep
section(24.7, 28.2, [G, D, Em, C], "full", 0.6)                    # sunrise in the garage
section(28.3, 34.7, [Em, C, Am, B7], "bells", 0.55)                # the dip: the calm owner
section(34.8, 37.2, [G, D, Em, C], "rag", 0.85)                    # the toast
section(37.2, 41.0, [Em, Am, B7, Em], "tiptoe", 0.7)               # the neighbour sneaks in
section(41.0, 44.4, [C, D, B7, B7], "build", 1.0)                  # box after box
add(gong(41.2, 3.0), 44.43, 0, 0.32); add(drum(55, 0.9), 44.43, 0, 0.28)                        # the deep boom on the third box (1333)
section(45.0, 49.6, [Em, C, G, D], "bells", 0.7)                   # the cutaway (the explanation)
add(pad([midi(n) for n in [40, 52, 55, 59]], 3.0, 0.8), 49.7, 0, 0.08)                          # the glove insert
section(52.5, 56.0, [Em, C, G, D], "light", 0.65)                  # this is real
section(56.1, 59.5, [Em, Am, B7, Em], "tiptoe", 0.7)               # the boss crams the shoe on
section(59.6, 63.2, [G, D, Em, Em], "full", 0.7)                   # the wave (cut on the last word)
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
