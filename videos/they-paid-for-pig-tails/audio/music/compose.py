"""Original underscore for "They Paid for Pig Tails and Got a Pig Farm" (63.9 s): a country caper at 118 BPM in E minor -> G
(banjo rolls, walking bass, pizzicato, marimba, shaker, a hand drum). Cue sheet in CP2. No fade: the mixer cuts on the last word."""
import numpy as np, soundfile as sf, sys, soundfile as sf, sys
SR = 44100; BPM = 118; B = 60 / BPM; L = 64.2
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
add(drum(80, 0.5), 0.0, 0, 0.2)                                    # frame 0: the tail slapped on the counter
section(0.0, 4.7, [Em, C, D, B7], "rag", 0.85)                      # hook: the banjo caper starts on frame 0
walk(4.75, 21.6, [Em, Am, D, G, C, Am, B7, Em], 0.95); section(4.75, 21.6, [Em, Am, D, G, C, Am, B7, Em], "light", 0.8)   # the deal, the queue, the wall, the paper, the ranger
section(21.6, 25.6, [Am, Em, Am, B7], "bells", 0.45)                # dip under the two quoted lines
section(25.8, 37.9, [Em, C, Am, B7], "tiptoe", 0.8); walk(28.9, 37.9, [Em, C, Am, B7], 0.8)   # the woods get louder, the ride, the shot, the poster
add(drum(120, 0.2), 30.83, 0, 0.12)                                 # a small accent on the shot (the rifle SFX carries it)
add(pad([midi(n) for n in [40, 47, 52, 55]], 3.2, 0.9), 38.0, 0, 0.1)   # dusk at the gate: a low drone (the stinger at 39.83 is an SFX)
section(41.1, 42.75, [Em, C], "build", 1.0)                          # a pig, another...
add(gong(41.2, 3.0), 42.77, 0, 0.32); add(drum(55, 0.9), 42.77, 0, 0.28)   # the deep boom on "the whole hillside"
section(43.2, 51.1, [Em, C, G, D], "bells", 0.7)                     # the explanation: boars don't have babies, the family branches
section(51.25, 54.1, [G, D, Em, C], "light", 0.7)                     # the mower comparison
section(54.2, 59.6, [Em, Am, B7, Em], "tiptoe", 0.75)               # the army base, the chalk family tree
section(59.7, 63.9, [G, D, C, G], "rag", 0.85)                        # he raises it to fifty (cut on "tail")
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
