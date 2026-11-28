"""Original underscore for \"Why He Took His Car Battery to Bed\" (65.5 s; the mixer cuts it dead on the final hit at 64.04 s).
A quirky plucked folk-rag at 120 BPM in G: banjo off-beats, a tuba-bass oom-pah, pizzicato, brushes; a tiptoe in E minor at
forty below; at the reveal (43.5 s) it lifts to C with a clarinet tune. Original composition (the p14 instruments)."""
import numpy as np, soundfile as sf, sys
SR = 44100; BPM = 120; B = 60 / BPM; L = 65.5; HIT = 64.04
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(1528)
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
G, Em, C, D7, G7, Am, B7, F, Cm = [55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57, 60], [55, 59, 62, 65], [57, 60, 64], [47, 51, 54, 57], [53, 57, 60], [48, 51, 55]
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
TUNE = [[(0, 0.5, 2), (0.5, 0.5, 1)], [(0, 1.0, 0)], [(0, 0.5, 1), (0.5, 0.5, 2)], [(0, 1.0, 3)],
        [(0, 0.5, 3), (0.5, 0.5, 2)], [(0, 0.5, 1), (0.5, 0.5, 2)], [(0, 1.5, 0)], [(0, 0.5, None)]]
# the timeline (shot starts 2.5 5.0 7.4 9.1 12.1 13.7 15.3 18.3 21.4 23.1 25.6 28.0 30.4 32.5 34.6 37.4 39.9 41.8 43.5 46.4 49.3
# 51.7 54.5 58.4 61.5; the hit 64.04). The bed never drops out; the quiet stretches keep a pad and the bass.
rag(0.0, 12.1, [G, Em, C, D7], 0.9)                                  # the hook, the flash-forward, the camp at night, the foreman
rag(12.1, 18.3, [G, C, G, D7], 0.7, brushes=False)                   # night one, two, three (lighter, no brushes)
rag(18.3, 23.1, [G, G7, C, D7], 1.0, shaker=True)                    # breakfast: the battery babysitter
rag(23.1, 28.0, [C, G, D7, G], 0.95, shaker=True)                    # the first cold morning: every truck starts, the honks
padS(28.0, 30.4, [40, 47, 52, 55, 59], 1.0); add(tuba(n(40), 2.0), 28.0, 0, 0.28)   # "Then one night": forty below (a held E minor)
rag(30.4, 37.4, [Em, B7, Em, B7], 0.6, banjoOn=False)                # dawn: click, click, click; the giant coughs and dies (tiptoe)
rag(37.4, 41.8, [Am, B7], 0.7, banjoOn=False, shaker=True)           # the babysitter walks out, hooks it up (the stinger is an SFX at 41.86)
padS(41.86, 43.5, [48, 55, 60, 64, 67], 0.9)                         # first try: the roar carries it
rag(43.5, 54.5, [C, Am, F, G7], 0.9, shaker=True, lead=TUNE)         # the reveal: the chemistry, the honey, the tester, the dipstick
rag(54.5, 58.4, [F, G7], 0.75, brushes=False)                        # the foreman shuffles over: "got cables?"
rag(58.4, 61.5, [C, F, G7, C], 1.0, shaker=True)                     # by lunch: the whole camp jump-started
t0 = HIT - 4 * B
rag(61.5, t0, [Am, F], 0.7, banjoOn=False, brushes=False)            # that night: the foreman tucks his own battery in
rag(t0, HIT, [F, G7], 1.0, pz=False, tubaOn=False)
for k, m in enumerate([43, 45, 47, 48]): add(tuba(n(m), B * 0.6), t0 + k * B, 0, 0.22)
nr = int(4 * B / 0.05)
for k in range(nr): add(brush(0.05), t0 + k * 0.05, -0.4 if k % 2 else 0.4, 0.02 + 0.07 * (k / nr) ** 2)
# a decorrelated stereo room (width without smearing)
y = out.copy()
for (dl, dr), gg in (((0.061, 0.083), 0.17), ((0.131, 0.167), 0.12), ((0.229, 0.281), 0.08), ((0.37, 0.43), 0.05), ((0.53, 0.61), 0.03)):
    kl, kr = int(dl * SR), int(dr * SR); y[kl:, 0] += out[:-kl, 1] * gg; y[kr:, 1] += out[:-kr, 0] * gg
y[int(HIT * SR):] = 0
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
