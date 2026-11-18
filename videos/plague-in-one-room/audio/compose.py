"""Original underscore for "They Put a Plague in One Room and It Took a Whole City" (64.0 s): a small medieval-adventure band in D minor at 108 BPM (lute plucks, frame drum, bass, bells, a soft choir pad). Cue sheet: dark hook (0-3.6), the curse tiptoes (3.6-9.9), the hunt (9.9-14.2), office plinks (14.2-16.7), the market jig (16.7-20.3), almost nothing on the quote (20.3-22.3), the drop (22.4), champion fanfare then the fall (24-26.6), the market falls (26.8-28.7), the question (28.7-31.5), the reveal builds to a full jig (31.6-45.4), the office blips (45.7-54.5), the study in bells (54.7-61.1), a warm tag. Was: (63.3 s): quirky plucked strings in G major, 120 BPM
(harp-like Karplus-Strong plucks, pizzicato, upright bass, shaker, soft bells). Cue sheet (CP2): light hook plucks (0-3.8),
the town that hates the chair tiptoes (3.8-8.0), Hal's plan rag (8.0-12.6), Vance laughs full (12.6-15.2), the quoted line
nearly nothing (15.2-17.0), Doctor Slowpoke and the egg timer rag (17.0-22.8), the scream fake-out tiptoe, near silence
on the scream (22.8-28.8), the question tiptoe (28.8-31.6), the turn builds (31.6-38.9), the trick and the movie full
(39.0-47.4), the study in bells (47.4-53.1), a warm rag to the end. The unlock sting at 39.06 is a separate SFX. No fade:
the mixer cuts the music on the last word."""
import numpy as np, soundfile as sf, sys
SR = 44100; BPM = 105; B = 60 / BPM; L = 65.9
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
Dm, Gm, A7, Bb, F, C = [62, 65, 69], [55, 58, 62], [57, 61, 64, 67], [58, 62, 65], [53, 57, 60], [60, 64, 67]
ROLL = [0, 2, 1, 2, 0, 2, 1, 2]
MEL = [74, 76, 77, 79, 81, 79, 77, 76, 74, 73, 74, 76, 77, 76, 74, 72, 70, 69, 70, 72, 74, 76, 73, 74]
def harp(f, d=0.5): return banjo(f, d, 0.62)
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
section(0.0, 3.7, [Dm, Bb, Gm, A7], "build", 0.9)
add(drum(55, 1.2), 0.0, 0, 0.3); add(pad([midi(n) for n in [38, 50, 53, 57]], 3.4, 1.0), 0.0, 0, 0.12)
section(3.7, 10.19, [Dm, Gm, A7, Dm], "tiptoe", 0.75)
section(10.19, 14.61, [Dm, Bb, C, A7], "rag", 0.85)
section(14.61, 17.18, [F, C, Dm, A7], "light", 0.55)
section(17.18, 20.89, [Dm, C, Bb, A7], "full", 0.85)
section(20.89, 22.94, [Dm, Gm, A7, Dm], "light", 0.3)
add(drum(48, 1.0), 23.1, 0, 0.25); add(pad([midi(n) for n in [38, 45, 50, 53]], 1.4, 0.9), 23.1, 0, 0.09)
section(24.69, 26.34, [F, C, Bb, F], "full", 0.75)
add(drum(50, 0.9), 26.96, 0, 0.22)
section(27.57, 29.53, [Dm, Gm, A7, Dm], "tiptoe", 0.45)
section(29.53, 32.41, [Dm, Gm, A7, Dm], "tiptoe", 0.8)
section(32.51, 39.1, [Bb, F, C, Dm], "build")
section(39.1, 46.71, [Dm, C, Bb, A7], "full", 1.0)
section(47.02, 56.07, [F, C, Dm, A7], "rag", 0.8)
section(56.28, 62.86, [Dm, Bb, Gm, A7], "bells", 0.95)
section(62.86, 66.05, [F, C, Dm, Dm], "light", 0.9)
for i, n in enumerate([86, 89, 93, 98]): add(bell(midi(n)), 64.8 + i * 0.08, 0.3 * (i % 2 * 2 - 1), 0.05)
y = out.copy()
for d, g in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
