"""Original underscore for "They Gave Away Free Hens and the Garbage Vanished" (55.0 s): a barnyard rag in G major,
116 BPM - banjo-like plucks (Karplus-Strong), upright bass, shaker, pizzicato, soft bells. Cue sheet (CP2): setup rag (0-9.2),
the hens handed out + Bruno's laugh (9.2-15.4), under the quoted line nearly nothing (15.4-18.3), Mayor Cluck (18.3-21.3),
the first-week fake-out barely there (21.3-26.2), the question tiptoe (26.2-28.6), the bins get lighter build (28.6-34.4),
the trick full rag (35.0-46.0) with one low boom on "eggs" (45.6), the ban in bells (46.1-49.9), a light rag to the end.
The unlock sting at 34.48 is a separate SFX (the channel signature). No fade: the mixer cuts it on the last word."""
import numpy as np, soundfile as sf, sys
SR = 44100; BPM = 116; B = 60 / BPM; L = 55.6
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
F, Bb, C7, Dm, Gm, A7 = [67, 71, 74], [60, 64, 67], [62, 66, 69, 72], [64, 67, 71], [57, 60, 64], [59, 63, 66, 69]   # (names kept) G, C, D7, Em, Am, B7
ROLL = [0, 2, 1, 2, 0, 2, 1, 2]
MEL = [79, 78, 76, 74, 76, 79, 83, 81, 79, 78, 74, 76, 78, 81, 79, 76, 74, 79, 83, 86, 83, 81, 79, 78]
def harp(f, d=0.5): return banjo(f, d, 0.72)
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("rag", "full", "light"):
            if b in (0, 2): add(bass(midi(root - 12 + (7 if b == 2 else 0)), B * 0.9), t, 0, 0.4 * g)
            for e in (0, 1):
                k = ROLL[(beat * 2 + e) % 8]; add(harp(midi(ch[k % len(ch)] + 12), 0.45), t + e * B / 2, 0.2 if e else -0.15, (0.12 if style != "light" else 0.08) * g)
            add(shaker(), t + B / 2, 0.45, 0.03 * g)
            if style == "full":
                if b % 2 == 0: add(pizz(midi(MEL[beat % len(MEL)]), 0.3), t, -0.3, 0.16 * g)
                if b == 0: add(drum(100, 0.3), t, 0, 0.12 * g)
        if style == "tiptoe":
            add(pizz(midi(ch[(beat * 2) % 3] + 12)), t, -0.2, 0.12 * g); add(pizz(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.07 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.26 * g)
        if style == "bells":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.11 * g)
            if b % 2 == 0: add(bell(midi(MEL[beat % len(MEL)])), t, 0.3 * (1 if b else -1), 0.05 * g)
            add(harp(midi(ch[beat % 3] + 12), 0.4), t + B / 2, 0.1, 0.05 * g)
        if style == "build":
            k = (t - t0) / max(1e-6, t1 - t0)
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.6 + 0.5 * k), t, 0, 0.1 * g)
            for e in (0, 1):
                kk = ROLL[(beat * 2 + e) % 8]; add(harp(midi(ch[kk % len(ch)] + 12), 0.4), t + e * B / 2, 0.2 if e else -0.15, (0.04 + 0.09 * k) * g)
            if b in (0, 2): add(bass(midi(root - 12), B * 0.9), t, 0, (0.15 + 0.25 * k) * g)
            if b == 3 and k > 0.5: add(drum(95, 0.25), t + B / 2, 0, 0.08 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 9.2, [F, Bb, C7, F], "rag")
section(9.2, 15.4, [F, Dm, Bb, C7], "full", 0.85)
section(15.4, 18.3, [F, Bb, C7, F], "light", 0.6)
section(18.3, 21.3, [F, Dm, Bb, C7], "full", 0.9)
section(21.3, 26.2, [Dm, Gm, A7, Dm], "tiptoe", 0.35)
section(26.2, 28.6, [Dm, Gm, A7, Dm], "tiptoe", 0.8)
section(28.6, 34.4, [Bb, F, C7, F], "build")
section(35.0, 46.0, [F, Bb, C7, F], "full", 1.0)
section(46.1, 49.9, [Dm, Bb, Gm, A7], "bells", 0.9)
section(49.9, 55.6, [F, Bb, C7, F], "rag", 0.95)
add(drum(55, 1.3), 45.6, 0, 0.32); add(pad([midi(n) for n in [43, 55, 59, 62]], 1.8, 1.2), 45.6, 0, 0.12)
for i, n in enumerate([91, 95, 98, 103]): add(bell(midi(n)), 45.65 + i * 0.09, 0.3 * (i % 2 * 2 - 1), 0.05)
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
