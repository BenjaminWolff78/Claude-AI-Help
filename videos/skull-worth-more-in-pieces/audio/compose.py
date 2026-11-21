"""Original underscore for "The Skull That Was Worth More in Pieces" (65.8 s): a small village band at 118 BPM in A minor
pentatonic (plucked kacapi-like strings, saron-like metal mallets, a gong, a hand drum, bass). Cue sheet (CP2): the hook hits
(0-3.4), tiptoe "You see," (3.4-10.1), the riverbank light, nearly nothing under Joko's quote (13.2-15.3), the smash and the
laugh full (15.3-20.4), "By Friday" builds (20.4-25.4), night: sparse, a dip on the lamp (26.2), nearly nothing under the
quote (30.3-32.1), coin sparkle (33.8), the village rag (35.4-42.1), the trick builds from 42.1, the papaya in bells
(48.4-52.8), the payoff: low and tiptoe after the boom (53.5 is a separate SFX), build to the slap (62.0), light under the
last line. No fade: the mixer cuts the music on the last word."""
import numpy as np, soundfile as sf, sys, soundfile as sf, sys
SR = 44100; BPM = 118; B = 60 / BPM; L = 66.2
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(62)
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

Am, F, C, G, Dm, Em = [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [62, 65, 69], [52, 55, 59]
ROLL = [0, 2, 1, 2, 0, 2, 1, 2]
MEL = [76, 79, 81, 79, 76, 74, 72, 74, 76, 81, 84, 81, 79, 76, 74, 72, 69, 72, 74, 76, 79, 76, 74, 72]
def saron(f, d=0.9):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.92 * f * t) * np.exp(-t * 5) + 0.25 * np.sin(2 * np.pi * 4.1 * f * t) * np.exp(-t * 9)) * np.exp(-t * 3.0) * (1 - np.exp(-t * 2500))
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
                add(saron(midi(MEL[beat % len(MEL)])), t, -0.3, 0.07 * g)
                if b == 0: add(drum(105, 0.3), t, 0, 0.13 * g)
                if b == 2: add(drum(150, 0.18), t, 0.1, 0.08 * g)
        if style == "tiptoe":
            add(pizz(midi(ch[(beat * 2) % 3] + 12)), t, -0.2, 0.12 * g); add(pizz(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.06 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.26 * g)
            if b == 3: add(saron(midi(MEL[(beat // 2) % len(MEL)]), 0.6), t + B / 2, 0.25, 0.03 * g)
        if style == "bells":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.1 * g)
            if b % 2 == 0: add(saron(midi(MEL[beat % len(MEL)])), t, 0.3 * (1 if b else -1), 0.06 * g)
            add(harp(midi(ch[beat % 3] + 12), 0.4), t + B / 2, 0.1, 0.05 * g)
        if style == "build":
            k = (t - t0) / max(1e-6, t1 - t0)
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.6 + 0.5 * k), t, 0, 0.1 * g)
            for e in (0, 1):
                kk = ROLL[(beat * 2 + e) % 8]; add(harp(midi(ch[kk % len(ch)] + 12), 0.4), t + e * B / 2, 0.2 if e else -0.15, (0.04 + 0.09 * k) * g)
            if b in (0, 2): add(bass(midi(root - 12), B * 0.9), t, 0, (0.15 + 0.25 * k) * g)
            if b % 2 == 1 and k > 0.4: add(saron(midi(MEL[beat % len(MEL)]), 0.5), t, 0.2, (0.03 + 0.05 * k) * g)
            if b == 3 and k > 0.5: add(drum(95, 0.25), t + B / 2, 0, 0.08 * g)
        beat += 1; t = t0 + beat * B
add(gong(55, 2.6), 0.0, 0, 0.22)
section(0.0, 3.4, [Am, F, C, G], "hit", 0.85)
section(3.4, 10.1, [Am, Dm, Em, Am], "tiptoe", 0.75)
section(10.1, 13.2, [Am, F, G, Am], "light", 0.7)
section(13.2, 15.3, [Am, Dm, Em, Am], "tiptoe", 0.35)
add(gong(55, 2.0), 15.9, 0, 0.18)
section(15.3, 20.4, [Am, F, C, G], "full", 0.9)
section(20.4, 25.4, [F, C, G, Am], "build", 1.0)
add(gong(49, 2.4), 25.35, 0, 0.2)
section(25.4, 26.2, [Am, Dm, Em, Am], "tiptoe", 0.5)
section(26.2, 30.3, [Am, Dm, Em, Am], "tiptoe", 0.4)
add(pad([midi(n) for n in [45, 52, 57, 60]], 2.0, 0.9), 28.6, 0, 0.08)
section(30.3, 32.1, [Am, Dm, Em, Am], "tiptoe", 0.22)
section(32.1, 35.4, [F, C, G, Am], "light", 0.7)
for i, n in enumerate([84, 88, 91, 96, 100]): add(saron(midi(n), 0.6), 33.8 + i * 0.07, 0.3 * (i % 2 * 2 - 1), 0.035)
add(gong(55, 2.0), 35.4, 0, 0.18)
section(35.4, 42.1, [Am, F, C, G], "rag", 0.85)
section(42.1, 48.4, [F, G, Em, Am], "build", 1.0)
section(48.4, 52.8, [C, Am, F, G], "bells", 0.9)
section(53.6, 57.1, [Am, Dm, Em, Am], "tiptoe", 0.55)
section(57.1, 61.9, [F, C, G, Am], "build", 0.85)
section(62.1, 64.7, [Am, F, C, G], "full", 0.75)
section(64.7, 66.2, [Am, Dm, Em, Am], "light", 0.5)
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
