"""Original underscore for "He Made Cars Easier to Crush, and It Saved Lives" (63.3 s): a bouncy 1950s boogie shuffle
in G, 136 BPM - walking bass, piano offbeats, handclaps, clarinet; tiptoe plucks for the works, tension for the test
run, sunny marimba for the backyard, a night pad for the trick, full band for the payoff, faded out by 62.4 s."""
import numpy as np, soundfile as sf
SR = 44100; BPM = 136; B = 60 / BPM; L = 63.6
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(59)
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
G, C, D7, Em, A7, E7, Bm = [55, 59, 62], [48, 52, 55], [50, 54, 57, 60], [52, 55, 59], [45, 49, 52, 55], [52, 56, 59, 62], [47, 50, 54]
MEL = [67, 71, 74, 71, 72, 71, 69, 67, 74, 76, 74, 71, 72, 69, 67, 66, 79, 78, 76, 74, 76, 74, 71, 69]
def clap(d=0.12):
    n = rng.normal(0, 1, int(d * SR)); t = tt(d); return (n * np.exp(-t * 45) + 0.6 * np.roll(n, 200) * np.exp(-t * 60)) * 0.4
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        sw = B * 0.62 if beat % 2 else 0  # shuffle feel on the off-eighths
        if style in ("boogie", "full", "ending"):
            walk = [0, 4, 7, 9][b]; add(bass(midi(root - 12 + walk), B * 0.85), t, 0, 0.5 * g)                     # walking boogie bass
            if b in (1, 3): [add(piano(midi(n + 12), 0.28), t, 0.15, 0.06 * g) for n in ch[:3]]
            if b in (1, 3) and style != "ending": add(clap(), t, -0.3, 0.05 * g)
            add(shaker(), t + B * 0.62, 0.5, 0.035 * g)
            if style != "ending" or b % 2 == 0:
                m = MEL[beat % len(MEL)]; add(clar(midi(m - 12 + (12 if style == "full" else 0)), B * 0.85), t, -0.25, (0.09 if style != "full" else 0.1) * g)
            if b == 0 and style == "full": add(drum(110, 0.3), t, -0.2, 0.16 * g)
        if style == "night":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B * 4, 0.8), t, 0, 0.16 * g); add(bass(midi(root - 12), B * 3), t, 0, 0.22 * g)
            if b % 2 == 0: add(pluck(midi(MEL[beat % len(MEL)] + 12), 0.5), t, 0.25 * (1 if b % 4 else -1), 0.08 * g)
        if style == "tension":
            if b == 0: add(pad([midi(n - 12) for n in ch[:3]], B * 4, 0.9), t, 0, 0.16 * g)
            add(drum(72, 0.25), t, 0, 0.12 * g)
            add(pluck(midi(ch[b % 3] + 12)), t + B / 2, 0.3 * (1 if b % 2 else -1), 0.08 * g)
        if style == "tiptoe":
            add(pluck(midi(ch[(beat * 2) % 3] + 12), 0.2), t, -0.2, 0.11 * g); add(pluck(midi(ch[(beat * 2 + 1) % 3] + 19), 0.18), t + B / 2, 0.3, 0.07 * g)
            if b == 0: add(bass(midi(root - 12), B * 1.5), t, 0, 0.3 * g)
        if style == "sunny":
            add(marimba(midi(ch[beat % 3] + 12), 0.4), t, 0.2 * (1 if b % 2 else -1), 0.12 * g)
            if b % 2 == 0: add(bass(midi(root - 12), B * 1.6), t, 0, 0.3 * g)
            add(shaker(), t + B / 2, 0.4, 0.03 * g)
        beat += 1; t = t0 + beat * B
section(0.0, 3.6, [G, C], "tiptoe")                      # hook: he presses the nose
section(3.6, 12.7, [G, C, D7, G], "boogie")             # 1955 showroom, the crash into the wall
section(12.7, 22.2, [Em, C, D7, Bm], "tiptoe", 1.0)      # the works: drawing, the boss, the laugh
section(22.2, 24.3, [Em, C], "night", 0.9)              # night: why build a car that crumples?
section(24.3, 27.6, [Em, A7, Em, D7], "tension")         # the test run
section(27.6, 34.3, [G, C, D7, G], "boogie", 0.9)       # everybody laughs... the dummy is fine
section(34.3, 42.7, [C, G, D7, G], "sunny")              # backyard balloons
section(42.7, 50.9, [Em, C, D7, Bm], "night")            # the trick, night blue
section(50.9, 56.7, [G, C, D7, E7], "full")              # payoff
section(56.7, 63.6, [G, C, D7, G], "ending", 0.8)        # today
y = out.copy()
for d, g in ((0.08, 0.2), (0.17, 0.14), (0.29, 0.08)):
    k = int(d * SR); y[k:] += out[:-k] * g
y /= np.abs(y).max() * 1.12
fade = np.ones(N); a = int(60.6 * SR); b = int(62.4 * SR); fade[a:b] = np.linspace(1, 0, b - a) ** 1.5; fade[b:] = 0
y *= fade[:, None]
sf.write("/home/claude/fire/audio/music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
