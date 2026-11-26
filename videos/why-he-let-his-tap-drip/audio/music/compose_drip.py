"""Original underscore for \"Why He Let His Tap Drip All Night in the Freeze\" (63.4 s)."""
import numpy as np, soundfile as sf, sys, soundfile as sf, sys
SR = 44100; BPM = 100; B = 60 / BPM; L = 63.4
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(1125)
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


def marimba(f, d=0.9):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.92 * f * t) * np.exp(-t * 5) + 0.25 * np.sin(2 * np.pi * 4.1 * f * t) * np.exp(-t * 9)) * np.exp(-t * 6.5) * (1 - np.exp(-t * 2500))
def gong(f=55, d=3.0):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 1.5 * f * t + 0.3 * np.sin(2 * np.pi * 3 * t)) + 0.2 * np.sin(2 * np.pi * 2.4 * f * t) * np.exp(-t * 1.5)) * np.exp(-t * 0.9) * (1 - np.exp(-t * 400))
def harp(f, d=0.5): return banjo(f, d, 0.6)

# ---- "Why He Let His Tap Drip All Night in the Freeze": a wintry tiptoe caper at 100 BPM in D minor -> F major. Celesta
# drips on the off-beats (the tap), pizzicato, a plucked harp, upright bass, brushes. It thins to a low pad and nothing
# but the clock when the drip stops and at 3 a.m., comes back with the thaw, brightens to F at the trick (48.8 s) and ends
# on the last word (the mixer cuts it there). Original composition.
def n(x): return midi(x)
Dm, Bb, C, A7, F, Gm, Am = [62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64], [53, 57, 60], [55, 58, 62], [57, 60, 64]
DRIP = [81, 77, 74, 77, 81, 84, 81, 77]          # the celesta "drip" figure (A5 F5 D5 F5 ...)
def brush(d=0.12):
    x = rng.normal(0, 1, int(d * SR)); t = tt(d); return np.diff(x, prepend=0) * np.exp(-t * 30) * 0.4
def celesta(f, d=0.9): return bell(f, d)
def harpP(f, d=0.5): return banjo(f, d, 0.62)
def caper(t0, t1, prog, g=1.0, drips=True, harp=True, bassOn=True, brushes=True):
    beat = 0; t = t0
    while t < t1 - 0.01:
        ch = prog[(beat // 4) % len(prog)]; b = beat % 4; r = ch[0]
        if bassOn and b in (0, 2): add(bass(n(r - 24 + (7 if b == 2 else 0)), B * 0.9), t, 0, 0.36 * g)
        if harp: add(harpP(n(ch[(beat * 2) % 3] + 12), 0.45), t, -0.2, 0.08 * g); add(harpP(n(ch[(beat * 2 + 1) % 3] + 12), 0.4), t + B / 2, 0.2, 0.06 * g)
        add(pizz(n(ch[beat % 3])), t + B / 4, 0.1, 0.06 * g)
        if drips and b in (1, 3): add(celesta(n(DRIP[(beat // 2) % len(DRIP)]), 0.8), t + B / 2, 0.35, 0.05 * g)
        if brushes: add(brush(), t + B / 2, -0.3, 0.035 * g)
        beat += 1; t = t0 + beat * B
def padS(t0, t1, ch, g=1.0): add(pad([n(x) for x in ch], t1 - t0, 0.8), t0, 0, 0.1 * g)
# the hook: one celesta drop on the first drip, then the caper
add(celesta(n(86), 1.2), 1.0, 0.3, 0.09)
caper(0.0, 2.4, [Dm, Dm], 0.6, drips=False, brushes=False)
# the flash-forward (2.4-4.6): a low bass hit and a held minor pad under the sprays
add(bass(n(38), 1.2), 2.42, 0, 0.5); padS(2.4, 4.6, [50, 57, 62, 65], 0.8)
caper(4.6, 16.2, [Dm, Bb, C, A7], 0.9)                       # the forecast, the wrench, the drip, the bucket
caper(16.2, 20.8, [F, C, Dm, A7], 0.8, brushes=False)        # morning, the street laughs
caper(20.8, 23.3, [Gm, A7], 0.6, harp=False)                 # "why pour water down the drain?"
padS(23.3, 28.2, [50, 57, 60, 65], 0.7)                      # the drip stops: a held pad (the quoted line on top)
add(celesta(n(77), 1.4), 25.3, 0.3, 0.05)
padS(28.3, 32.3, [45, 52, 57, 60], 0.5)                      # 3 a.m.: low and still (the clock ticks are SFX)
add(celesta(n(74), 1.6), 31.8, 0.3, 0.08)                    # the fat drop
caper(32.4, 37.0, [Dm, Bb, Gm, A7], 0.95)                    # the thaw, the wall bursts
caper(37.1, 45.7, [Dm, C, Bb, A7], 0.7, harp=False)          # the explanation: pizz, celesta, bass
caper(45.7, 48.7, [Gm, A7], 0.6, drips=False)                # the ketchup bottle
caper(48.8, 57.2, [F, C, Dm, Bb], 0.85)                      # the trick: F major (the unlock sting is an SFX at 48.8)
caper(57.2, 63.4, [F, C, Bb, F], 0.8)                        # next winter: the neighbor drips first
y = out.copy()
for dd, gg in ((0.07, 0.18), (0.15, 0.12), (0.27, 0.07), (0.41, 0.04)):
    k = int(dd * SR); y[k:] += out[:-k] * gg
y /= np.abs(y).max() * 1.12
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", y, SR, subtype="PCM_24"); print("ok", len(y) / SR)
