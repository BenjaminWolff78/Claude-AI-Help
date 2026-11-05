"""Original underscore for 'Why He Painted Eyes on Cows' Butts' (61.9 s): a light savanna groove in G major, 112 BPM 4/4 -
marimba ostinato, kalimba (thumb piano) melody, shaker, hand drum, plucked bass. Sections follow the scenes: kraal hook
(groove), sunset riverbank (kalimba + pad), kraal morning (groove, playful), night count (pad + sparse kalimba), morning
61 (groove), night climax (low pad, heartbeat drum, tiptoe plucks), tall-grass explanation (pad, low kalimba), kitchen
(tiptoe), payoff (full groove + bright marimba), ending (gentle, faded out by 61.3 s)."""
import numpy as np, soundfile as sf
SR = 44100; BPM = 112; B = 60 / BPM; L = 62.2
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(23)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i >= N or j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r
def tt(d): return np.arange(int(d * SR)) / SR
def marimba(f, d=0.6):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30) + 0.12 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t * 60)) * np.exp(-t * 7) * (1 - np.exp(-t * 900))
def kalimba(f, d=1.2):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 20) + 0.15 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t * 6)) * np.exp(-t * 3.2) * (1 - np.exp(-t * 1500))
def bass(f, d):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3.5) * (1 - np.exp(-t * 300))
def pluck(f, d=0.25):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 16) * (1 - np.exp(-t * 600))
def pad(fs, d, soft=1.0):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.003 * f * t) for f in fs) / len(fs)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5); return y * e * 0.5 * soft
def shaker(d=0.08):
    n = rng.normal(0, 1, int(d * SR)); n = np.diff(n, prepend=0); t = tt(d); return n * np.exp(-t * 60) * 0.5
def drum(f0=110, d=0.35):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (1 + 1.2 * np.exp(-t * 30))) / SR; return np.sin(ph) * np.exp(-t * 9)
G, C, D, Em, Am = [55, 59, 62], [48, 52, 55], [50, 54, 57], [52, 55, 59], [45, 48, 52]
MEL = [74, 71, 74, 76, 74, 71, 67, 69, 71, 74, 72, 71, 69, 67, 69, 71]
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("groove", "full", "ending"):
            if b in (0, 2): add(bass(midi(root - 12), B * 1.6), t, 0, 0.5 * g)
            for h in (0, 0.5):
                n = ch[(b * 2 + int(h * 2)) % 3] + 12; add(marimba(midi(n)), t + h * B, 0.3 * (1 if (b + int(h * 2)) % 2 else -1), 0.13 * g)
                add(shaker(), t + h * B, 0.5, (0.07 if h else 0.045) * g * (0.6 if style == "ending" else 1))
            if b == 0 or (b == 2 and style != "ending"): add(drum(98), t, -0.2, 0.22 * g)
            if b == 3 and style == "full": add(drum(140, 0.2), t + B / 2, 0.2, 0.15 * g)
            if style != "ending" or b % 2 == 0:
                m = MEL[beat % len(MEL)]; add(kalimba(midi(m)), t, -0.25, (0.12 if style != "full" else 0.15) * g)
            if style == "full" and b % 2 == 1: add(kalimba(midi(MEL[(beat + 3) % len(MEL)] + 12), 0.7), t + B / 2, 0.4, 0.06 * g)
        if style in ("sunset", "night", "grass"):
            if b == 0: add(pad([midi(n + (12 if style == "sunset" else 0)) for n in ch], B * 4, 0.8), t, 0, (0.18 if style != "grass" else 0.14) * g); add(bass(midi(root - 12), B * 3), t, 0, 0.26 * g)
            if style == "sunset" or b % 2 == 0: add(kalimba(midi(MEL[beat % len(MEL)] - (12 if style == "grass" else 0))), t, 0.25 * (1 if b % 2 else -1), 0.1 * g)
        if style == "tension":
            if b == 0: add(pad([midi(n - 12) for n in ch], B * 4, 0.9), t, 0, 0.18 * g)
            if b in (0, 1): add(drum(70, 0.4), t, 0, 0.2 * g)   # heartbeat
            add(pluck(midi(ch[b % 3] + 12)), t + B / 2, 0.3 * (1 if b % 2 else -1), 0.09 * g)
        if style == "tiptoe":
            add(pluck(midi(ch[(beat * 2) % 3] + 12), 0.2), t, -0.2, 0.12 * g); add(pluck(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.08 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 7.4, [G, C, D, G], "groove")
section(7.4, 11.4, [Em, C, D, G], "sunset")
section(11.4, 24.0, [G, C, D, G], "groove", 0.95)
section(24.0, 26.1, [Em, C], "night")
section(26.1, 34.4, [G, C, D, G], "groove", 0.95)
section(34.4, 43.2, [Em, Am, Em, D], "tension")
section(43.2, 50.0, [Em, C, Am, D], "grass")
section(50.0, 53.0, [G, D], "tiptoe")
section(53.0, 58.0, [G, C, D, G], "full")
section(58.0, 62.2, [G, C, D, G], "ending", 0.8)
y = out.copy()
for d, g in ((0.08, 0.2), (0.17, 0.14), (0.29, 0.08)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
fade = np.ones(N); a = int(59.4 * SR); b = int(61.3 * SR); fade[a:b] = np.linspace(1, 0, b - a) ** 1.5; fade[b:] = 0
y *= fade[:, None]
sf.write("/home/claude/cows/audio/music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
