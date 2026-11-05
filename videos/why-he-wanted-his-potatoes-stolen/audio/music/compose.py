"""Original underscore for 'Why He Wanted His Potatoes Stolen' (63.8 s): a French village musette waltz (two detuned
accordion reeds, plucked bass, brushed snare) in D major at 150 BPM 3/4. Sections follow the scenes: field + market
(bright musette), throne room (harpsichord minuet), field by day (musette), nights (soft pizzicato + low pad, D minor),
dawn reveal (rising), guard hut (night pad, music box), corridor (tiptoe pizzicato), gardens (musette), banquet payoff
(full, harpsichord + accordion + glockenspiel), ending (gentle, faded out by 63.2 s)."""
import numpy as np, soundfile as sf
SR = 44100; BPM = 150; B = 60 / BPM; L = 64.0
N = int(L * SR); out = np.zeros((N, 2))
rng = np.random.default_rng(11)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i >= N or j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r
def env(n, a=0.02, rel=0.08):
    t = np.arange(n) / SR; d = n / SR
    return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / rel))
def reed(f, dur):  # musette accordion: two reeds ~8 cents apart, soft square-ish tone, gentle bellows vibrato
    n = int(dur * SR); t = np.arange(n) / SR; v = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t)
    y = 0
    for det in (0.996, 1.004):
        ph = 2 * np.pi * f * det * v * t
        y = y + np.sin(ph) + 0.45 * np.sin(3 * ph) / 1.5 + 0.25 * np.sin(5 * ph) / 2 + 0.3 * np.sin(2 * ph)
    return y * env(n, 0.03, 0.1) * 0.25
def ks(f, dur, damp=0.996):
    n = int(dur * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); y = np.zeros(n)
    for k in range(n):
        y[k] = buf[k % p]; buf[k % p] = 0.5 * (buf[k % p] + buf[(k + 1) % p]) * damp
    return y * np.linspace(1, 0, n) ** 0.6
def harpsi(f, dur=0.5):
    a = ks(f, dur, 0.998); b2 = ks(2 * f, dur * 0.6, 0.995); a[:len(b2)] += 0.4 * b2; return a
def pizz(f, dur=0.3):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 14) * (1 - np.exp(-t * 600))
def bass(f, dur):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 4.5) * (1 - np.exp(-t * 300))
def glock(f, dur=0.9):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 6)) * np.exp(-t * 3.5) * (1 - np.exp(-t * 900))
def pad(fs, dur, soft=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t + 0.4 * np.sin(2 * np.pi * 0.25 * t)) + 0.15 * np.sin(4 * np.pi * f * t) for f in fs)
    return y * env(n, 0.5, 0.6) / len(fs) * soft
def brush(dur=0.12):
    n = int(dur * SR); x = rng.normal(0, 1, n); x = np.convolve(x, np.ones(6) / 6, "same")
    return x * np.exp(-np.arange(n) / SR * 28)
D, G, A7, Bm, Em, Dm, Gm, A, F = [62, 66, 69], [55, 59, 62], [57, 61, 64, 67], [59, 62, 66], [52, 55, 59], [62, 65, 69], [55, 58, 62], [57, 61, 64], [53, 57, 60]
MEL = [9, 7, 6, 4, 6, 7, 9, 11, 9, 7, 6, 2]  # waltz tune, scale steps above the chord root (D major degrees)
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 3; ch = prog[bar % len(prog)]; b = beat % 3; root = ch[0]
        if style in ("musette", "full", "ending"):
            if b == 0: add(bass(midi(root - 12), B * 1.6), t, 0, 0.5 * g)
            else: add(reed(midi(ch[1]), B * 0.55) + reed(midi(ch[2]), B * 0.55), t, 0.25, 0.12 * g)
            add(brush(), t, -0.3, (0.05 if b == 0 else 0.03) * g)
            if style != "ending" or b == 0:
                m = MEL[beat % len(MEL)]; add(reed(midi(root + 12 + m - 9 + 12 * 0), B * (1.0 if b == 0 else 0.9)), t, -0.15, (0.15 if style != "ending" else 0.08) * g)
        if style in ("minuet", "full"):
            add(harpsi(midi(ch[b % len(ch)] + 12), B * 1.2), t, 0.3, 0.12 * g)
            if b == 0: add(harpsi(midi(root - 12), B * 2), t, -0.2, 0.14 * g)
        if style == "full" and b == 0: add(glock(midi(ch[2] + 24)), t, 0.4, 0.06 * g)
        if style in ("night", "hut"):
            if b == 0: add(pad([midi(n) for n in ch], B * 3, 0.8), t, 0, 0.16 * g); add(bass(midi(root - 12), B * 2.5), t, 0, 0.3 * g)
            add(pizz(midi(ch[b % len(ch)] + 12)), t, 0.3 * (1 if b % 2 else -1), 0.1 * g)
            if style == "hut" and b == 1: add(glock(midi(ch[2] + 24), 0.6), t, 0.35, 0.05 * g)
        if style == "dawn":
            add(pizz(midi(ch[b % len(ch)] + 12 + 2 * (beat % 6))), t, 0.2, 0.11 * g)
            if b == 0: add(pad([midi(n + 12) for n in ch], B * 3, 0.6), t, 0, 0.12 * g)
        if style == "tiptoe":
            add(pizz(midi(ch[(beat * 2) % len(ch)] + 12), 0.22), t, -0.2, 0.12 * g)
            add(pizz(midi(ch[(beat * 2 + 1) % len(ch)] + 19), 0.18), t + B / 2, 0.3, 0.08 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 19.6, [D, G, A7, D], "musette")
section(19.6, 24.0, [D, A, D, G], "minuet")
section(24.0, 27.3, [D, G, A7, D], "musette", 0.9)
section(27.3, 34.0, [Dm, Gm, A, Dm], "night")
section(34.0, 38.7, [Dm, F, Gm, A], "dawn")
section(38.7, 45.8, [Dm, Gm, A, Dm], "hut")
section(45.8, 49.0, [D, Em, A, D], "tiptoe")
section(49.0, 51.7, [D, G, A7, D], "musette")
section(51.7, 59.8, [D, G, A7, D], "full")
section(59.8, 64.0, [D, G, A7, D], "ending", 0.8)
y = out.copy()
for d, g in ((0.07, 0.22), (0.15, 0.16), (0.26, 0.1)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
fade = np.ones(N); a = int(61.0 * SR); b = int(63.2 * SR); fade[a:b] = np.linspace(1, 0, b - a) ** 1.5; fade[b:] = 0
y *= fade[:, None]
sf.write("/home/claude/potato/audio/music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
