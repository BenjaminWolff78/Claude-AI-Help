"""Original underscore for "He Saved His Life by Proving His Masterpiece Was Fake" (64.0 s): a sly 1930s continental
swing in D minor, 112 BPM - plucked bass, offbeat piano chords, a clarinet line, brushed shaker; music-box plucks for
the studio. Sections follow the scenes: court hook (tiptoe), salt mine (tension), the dock (swing, the laugh), years
earlier studio (night), museum (full, grand), the top Nazi (tension), the request (tiptoe), the trick (night), the test
(tension build), payoff (full swing), ending (music-box, faded out by 62.9 s)."""
import numpy as np, soundfile as sf
SR = 44100; BPM = 112; B = 60 / BPM; L = 64.4
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

def piano(f, d=0.5):
    t = tt(d); return (np.sin(2*np.pi*f*t) + 0.5*np.sin(4*np.pi*f*t)*np.exp(-t*6) + 0.25*np.sin(6*np.pi*f*t)*np.exp(-t*9) + 0.1*np.sin(10*np.pi*f*t)*np.exp(-t*14)) * np.exp(-t*4.5) * (1-np.exp(-t*800))
def clar(f, d=0.4):
    t = tt(d); v = 1 + 0.006*np.sin(2*np.pi*5.5*t); ph = 2*np.pi*np.cumsum(f*v)/SR
    y = np.sin(ph) + 0.35*np.sin(3*ph) + 0.15*np.sin(5*ph); e = np.minimum(1, t/0.03) * np.minimum(1, (d-t)/0.06); return y*e*0.5
Dm, Gm, A7, Bb, F_, C7, E7 = [50, 53, 57], [43, 46, 50], [45, 49, 52, 55], [46, 50, 53], [53, 57, 60], [48, 52, 55, 58], [52, 56, 59, 62]
MEL = [74, 72, 69, 70, 69, 65, 67, 69, 74, 76, 77, 76, 74, 72, 70, 69, 81, 79, 77, 76, 77, 74, 73, 74]
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("rag", "full", "ending"):
            if b in (0, 2): add(bass(midi(root - 12 + (7 if b == 2 else 0)), B * 0.9), t, 0, 0.5 * g)
            if b in (1, 3):
                for n in ch[:3]: add(piano(midi(n + 12), 0.35), t, 0.15, 0.06 * g)
            add(shaker(), t + B / 2, 0.5, 0.04 * g * (0.6 if style == "ending" else 1))
            if style != "ending" or b % 2 == 0:
                m = MEL[beat % len(MEL)]; add(clar(midi(m - 12 + (12 if style == "full" else 0)), B * 0.9), t, -0.25, (0.1 if style != "full" else 0.11) * g)
            if style == "full" and b % 2 == 1: add(piano(midi(MEL[(beat + 5) % len(MEL)] + 12), 0.3), t + B / 2, 0.35, 0.05 * g)
            if b == 0 and style == "full": add(drum(110, 0.3), t, -0.2, 0.16 * g)
        if style == "night":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.16 * g); add(bass(midi(root - 12), B * 3), t, 0, 0.22 * g)
            if b % 2 == 0: add(pluck(midi(MEL[beat % len(MEL)] + 12), 0.5), t, 0.25 * (1 if b % 4 else -1), 0.08 * g)
        if style == "tension":
            if b == 0: add(pad([midi(n - 12) for n in ch[:3]], B * 4, 0.9), t, 0, 0.16 * g)
            if b in (0, 2): add(drum(72, 0.4), t, 0, 0.16 * g)
            add(pluck(midi(ch[b % 3] + 12)), t + B / 2, 0.3 * (1 if b % 2 else -1), 0.08 * g)
        if style == "tiptoe":
            add(pluck(midi(ch[(beat * 2) % 3] + 12), 0.2), t, -0.2, 0.11 * g); add(pluck(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.07 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.3 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 3.2, [Dm, A7], "tiptoe")
section(3.2, 11.3, [Dm, Gm, Dm, A7], "tension", 0.9)
section(11.3, 21.8, [Dm, Gm, A7, Dm], "rag")
section(21.8, 29.2, [Dm, Bb, Gm, A7], "night")
section(29.2, 34.6, [F_, Bb, C7, F_], "full", 0.9)
section(34.6, 38.0, [Dm, E7, Dm, A7], "tension", 0.85)
section(38.0, 41.3, [Dm, A7], "tiptoe")
section(41.3, 49.9, [Dm, Bb, Gm, A7], "night")
section(49.9, 54.8, [Dm, Gm, E7, A7], "tension")
section(54.8, 60.8, [F_, Bb, C7, F_], "full")
section(60.8, 64.4, [Dm, Gm, A7, Dm], "ending", 0.8)
y = out.copy()
for d, g in ((0.08, 0.2), (0.17, 0.14), (0.29, 0.08)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
fade = np.ones(N); a = int(61.0 * SR); b = int(62.9 * SR); fade[a:b] = np.linspace(1, 0, b - a) ** 1.5; fade[b:] = 0
y *= fade[:, None]
sf.write("/home/claude/forger/audio/music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
