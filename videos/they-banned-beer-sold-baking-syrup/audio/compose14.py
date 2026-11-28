"""Original underscore for "They Banned Beer, So He Sold It as Bread Syrup" (66.2 s; the mixer cuts it dead on the final
hit at 64.90 s). A 1920s speakeasy rag at 120 BPM: banjo on the off-beats, a tuba oom-pah, pizzicato, brushes; a tiptoe
in D minor at night; at the reveal (43.32 s) it lifts to B-flat with a clarinet tune on top. Original composition."""
import numpy as np, soundfile as sf, sys
SR = 44100; BPM = 120; B = 60 / BPM; L = 66.2; HIT = 64.90
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(1427)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i >= N or j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r
_ks = {}
def banjo(f, d=0.5, bright=0.5):
    key = (round(f, 1), d, bright)
    if key in _ks: return _ks[key]
    n = int(d * SR); P = max(2, int(SR / f)); buf = rng.uniform(-1, 1, P) * np.hanning(P) ** 0.2; y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % P]; nxt = buf[(i + 1) % P]; buf[i % P] = (bright * buf[i % P] + (1 - bright) * nxt) * 0.996
    t = tt(d); y *= np.exp(-t * 4.0) * (1 - np.exp(-t * 2000)); y += 0.22 * np.sin(2 * np.pi * f * t) * np.exp(-t * 14)
    _ks[key] = y; return y
def tuba(f, d):
    t = tt(d); ph = 2 * np.pi * f * t
    y = (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph) + 0.1 * np.sin(4 * ph))
    return y * np.minimum(1, t / 0.03) * np.exp(-t * 2.4) * np.minimum(1, np.maximum(0, (d - t) / 0.06))
def pizz(f, d=0.22):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 14) * (1 - np.exp(-t * 900))
def clar(f, d):
    t = tt(d); vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.25)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + 0.55 * np.sin(3 * ph) + 0.25 * np.sin(5 * ph) + 0.1 * np.sin(7 * ph)
    return y * np.minimum(1, t / 0.04) * np.minimum(1, np.maximum(0, (d - t) / 0.08)) * (0.85 + 0.15 * np.exp(-t * 3))
def pad(fs, d, soft=1.0):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.003 * f * t) for f in fs) / len(fs)
    return y * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.6) * 0.5 * soft
def brush(d=0.1):
    x = rng.normal(0, 1, int(d * SR)); t = tt(d); return np.diff(x, prepend=0) * np.exp(-t * 32) * 0.4
def wood(d=0.06):
    t = tt(d); return (np.sin(2 * np.pi * 1200 * t) * 0.6 + rng.normal(0, 1, len(t)) * 0.2) * np.exp(-t * 90)
n = midi
F, Dm, Gm, C7, F7, Bb, Bbm, A7, Eb, Gm7 = [53, 57, 60], [50, 53, 57], [55, 58, 62], [48, 52, 55, 58], [53, 57, 60, 63], [58, 62, 65], [58, 61, 65], [57, 61, 64], [51, 55, 58], [55, 58, 62, 65]
def rag(t0, t1, prog, g=1.0, banjoOn=True, tubaOn=True, pz=True, brushes=True, shaker=False, lead=None):
    beat = 0; t = t0
    while t < t1 - 0.01:
        ch = prog[(beat // 4) % len(prog)]; b = beat % 4; r = ch[0]
        if tubaOn and b in (0, 2): add(tuba(n(r - 12 + (7 if b == 2 else 0)), B * 0.85), t, 0, 0.24 * g)   # F2, not F1: the sub band is kept for the final hit
        if banjoOn and b in (1, 3):
            for k, x in enumerate(ch[:3]): add(banjo(n(x + 12), 0.4), t + k * 0.012, -0.45, 0.07 * g)
        if banjoOn and b in (0, 2): add(banjo(n(ch[1] + 12), 0.3, 0.55), t + B / 2, -0.45, 0.04 * g)
        if pz: add(pizz(n(ch[(beat + 1) % len(ch)] + 12)), t + B / 2, 0.45, 0.05 * g)
        if brushes: add(brush(), t, 0.3, 0.03 * g); add(brush(0.06), t + B / 2, 0.3, 0.018 * g)
        if shaker: add(brush(0.05), t + B / 4, -0.2, 0.015 * g); add(brush(0.05), t + 3 * B / 4, -0.2, 0.015 * g)
        if lead is not None:
            ph = lead[beat % len(lead)]
            for (off, dur, deg) in ph:
                if deg is None: continue
                add(clar(n(ch[deg % len(ch)] + 24 + (12 if deg >= len(ch) else 0) - 12), dur * B), t + off * B, 0.25, 0.055 * g)
        beat += 1; t = t0 + beat * B
def padS(t0, t1, ch, g=1.0):
    fs = [n(x) for x in ch]; add(pad(fs[::2], t1 - t0, 0.8), t0, -0.6, 0.12 * g); add(pad(fs[1::2], t1 - t0, 0.8), t0, 0.6, 0.12 * g)
# a two-bar clarinet figure (per beat: (offset in beats, length in beats, chord-tone index))
TUNE = [[(0, 0.5, 2), (0.5, 0.5, 1)], [(0, 1.0, 0)], [(0, 0.5, 1), (0.5, 0.5, 2)], [(0, 1.0, 3)],
        [(0, 0.5, 3), (0.5, 0.5, 2)], [(0, 0.5, 1), (0.5, 0.5, 2)], [(0, 1.5, 0)], [(0, 0.5, None)]]
# the timeline (shot starts 2.6, 5.36, 7.52, 9.1, 12.32, 14.6, 15.62, 17.16, 19.4, 21.94, 23.38, 25.58, 27.46, 28.5, 30.44,
# 32.66, 34.42, 37.64, 40.3, 41.02, 42.08, 43.32, 46.56, 48.36, 50.96, 53.52, 55.5, 58.04, 61.28, 63.44; the hit 64.90).
# The bed never drops out; the quiet stretches keep a pad and the tuba.
rag(0.0, 15.62, [F, Dm, Gm, C7], 0.95)                              # the brewer cans "syrup"; the agents; the padlock; the quotes
rag(15.62, 19.4, [F, Dm, Gm, C7], 0.8, brushes=False)               # the station laughs; "the baker"
rag(19.4, 30.44, [F, F7, Bb, C7], 1.0, shaker=True)                 # 3 cans, 30, a whole wall, the flour, the yeast
padS(30.44, 32.66, [53, 60, 65, 69, 72], 1.0); add(tuba(n(41), 2.0), 30.44, 0, 0.3)   # the loaf the size of the church
rag(32.66, 37.64, [Dm, A7, Dm, A7], 0.7, banjoOn=False, brushes=True)   # night: the knock, the granny, "she really is baking"
rag(37.64, 40.30, [Gm, A7], 0.6, banjoOn=False, pz=True)            # he backs down the steps (the stinger is an SFX at 40.46)
rag(40.46, 43.32, [Dm, F, Gm, A7], 0.9, shaker=True)                # the pops down the street
rag(43.32, 61.28, [Bb, Gm, Eb, F7], 0.95, shaker=True, lead=TUNE)   # the reveal: malt extract, the mechanism, 45 bottles, the wink
# the end: the walk home thins out, then four beats climb into the hit
t0 = HIT - 4 * B
rag(61.28, t0, [Bb, Gm7], 0.7, banjoOn=False, brushes=False)
rag(t0, HIT, [Eb, F7], 1.0, pz=False, tubaOn=False)
for k, m in enumerate([39, 41, 43, 45]): add(tuba(n(m), B * 0.6), t0 + k * B, 0, 0.22)   # the climb an octave up and short: the low band stays clear for the hit
nr = int(4 * B / 0.05)
for k in range(nr): add(brush(0.05), t0 + k * 0.05, -0.4 if k % 2 else 0.4, 0.02 + 0.07 * (k / nr) ** 2)
# a decorrelated stereo room (width without smearing)
y = out.copy()
for (dl, dr), gg in (((0.061, 0.083), 0.17), ((0.131, 0.167), 0.12), ((0.229, 0.281), 0.08), ((0.37, 0.43), 0.05), ((0.53, 0.61), 0.03)):
    kl, kr = int(dl * SR), int(dr * SR); y[kl:, 0] += out[:-kl, 1] * gg; y[kr:, 1] += out[:-kr, 0] * gg
y[int(HIT * SR):] = 0
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
