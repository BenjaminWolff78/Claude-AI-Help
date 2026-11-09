"""Original underscore for "Owners Sank Their Own Ships, So He Painted a Line" (cut at 63.98 s, the end of the last
word). Comedy with a disaster in it: quirky pizzicato strings + a fingerpicked/strummed acoustic guitar, 120 BPM,
D major (a sly D minor for the storm, the fake-out and the trick). No vocals, generated here, nothing borrowed.

Shape (music rules 2026-11-08):
  setup steady (0-12.3) | dip under "She'll float." | storm: low tremolo + ticking + a hit on "doesn't" |
  sly groove (payout, court) | Plimsoll's motif on guitar | dip under "Paintbrush Plimsoll!" |
  FAKE-OUT (law dropped): everything drops to one sad falling pizz line | the march (snare taps, rising) |
  a stab on "villains", rest, sheepish | newspapers: the groove swells | the law passes, full |
  "One catch": stop; smokestack = a deflating slide (second fake-out, dip) |
  THE TURN ("Here's the trick", 43.24): ticking + pizz ostinato in D minor, a layer every two bars |
  CLIMAX (1890 -> "over the line"): tremolo strings, drum pulse, rising chromatic line |
  ONE DEEP BOOM on the payoff ("stays home", 57.60) and 0.6 s of air | resolution: the motif in full, D major |
  thin under the last quote "she'll float," | final stab on "to!" (63.78) | hard cut at 63.98 (no fade-out).
"""
import numpy as np, soundfile as sf
from scipy.signal import lfilter, butter, sosfilt

SR = 44100; BPM = 120; B = 60 / BPM; L = 63.98
N = int(round(L * SR)); out = np.zeros((N, 2)); rng = np.random.default_rng(1876)


def midi(n): return 440 * 2 ** ((n - 69) / 12)


def tt(d): return np.arange(int(d * SR)) / SR


def add(x, t, pan=0.0, g=1.0):
    i = int(round(t * SR)); j = min(N, i + len(x))
    if i >= N or j <= i or i < 0: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype="low", fs=SR, output="sos"), x)


def hp(x, lo, order=2):
    return sosfilt(butter(order, lo, btype="high", fs=SR, output="sos"), x)


def ks(f, d, rho=0.996, bright=0.6, seed=0):
    """Karplus-Strong plucked string (feedback comb + two-point average), C-speed via lfilter."""
    P = max(2, int(round(SR / f))); n = int(d * SR)
    r = np.random.default_rng(seed + int(f * 10))
    burst = r.uniform(-1, 1, P)
    burst = lfilter([bright, 1 - bright], [1], burst)         # softer attack for lower brightness
    x = np.zeros(n); x[:P] = burst
    a = np.zeros(P + 2); a[0] = 1; a[P] = -rho * 0.5; a[P + 1] = -rho * 0.5
    y = lfilter([1], a, x)
    return y / (np.abs(y).max() + 1e-9)


def pizz(f, d=0.35, seed=0):
    """violin/cello pizzicato: short KS + a wooden body resonance, quick decay."""
    y = ks(f, d, rho=0.985, bright=0.45, seed=seed)
    t = tt(d)[:len(y)]
    body = bp(y, 220, 3200) * 0.8 + 0.25 * y
    return body * np.exp(-t * (7 if f < 200 else 10)) * 0.9


def guitar(f, d=0.9, seed=0, bright=0.7):
    """steel-string acoustic: longer KS + body bump around 100-250 Hz + some sparkle."""
    y = ks(f, d, rho=0.9975, bright=bright, seed=seed)
    t = tt(d)[:len(y)]
    body = 0.6 * y + 0.5 * bp(y, 90, 260) + 0.25 * hp(y, 2500)
    return body * np.exp(-t * 2.2) * np.minimum(1, t / 0.002)


def strum(notes, t, g=1.0, down=True, d=0.8, pan=0.0):
    seq = notes if down else notes[::-1]
    for k, n in enumerate(seq): add(guitar(midi(n), d, seed=k + int(t * 7)), t + k * 0.011, pan + 0.05 * k, g * 0.22)


def trem(f, d, rate=13.0, g=1.0):
    """bowed tremolo (low strings): band-limited saw with vibrato and a bow-tremolo amplitude."""
    t = tt(d); v = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t)
    ph = np.cumsum(f * v) / SR
    saw = sum(((-1) ** (k + 1)) * np.sin(2 * np.pi * k * ph) / k for k in range(1, 12))
    am = 0.55 + 0.45 * np.abs(np.sin(np.pi * rate * t))
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.2)
    return lp(saw, 2400) * am * env * 0.075 * g


def arco(f, d, g=1.0):
    t = tt(d); v = 1 + 0.005 * np.sin(2 * np.pi * 5.2 * t)
    ph = np.cumsum(f * v) / SR
    saw = sum(((-1) ** (k + 1)) * np.sin(2 * np.pi * k * ph) / k for k in range(1, 10))
    env = np.minimum(1, t / 0.18) * np.minimum(1, (d - t) / 0.25)
    return lp(saw, 3000) * env * 0.06 * g


def tick(d=0.05, hi=True):
    """clock tick: a tiny woodblock click, dry."""
    t = tt(d); n = rng.normal(0, 1, len(t))
    return (bp(n, 2500 if hi else 1500, 6000) * np.exp(-t * 260) + 0.4 * np.sin(2 * np.pi * (2100 if hi else 1500) * t) * np.exp(-t * 180)) * 0.5


def snare_tap(d=0.12):
    t = tt(d); n = rng.normal(0, 1, len(t))
    return (bp(n, 900, 3500) * np.exp(-t * 45) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * 0.35)


def tom(d=0.5, f0=95):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-t * 30))) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.25 * lp(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 30)) * 0.8


def boom(d=2.6):
    """one deep cinematic boom: a sub sine falling 70 -> 34 Hz, a felt-mallet thump, a soft low rumble tail."""
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(34 + 36 * np.exp(-t * 3.2)) / SR
    sub = np.sin(ph) * np.exp(-t * 1.25) * np.minimum(1, t / 0.004)
    thump = lp(rng.normal(0, 1, len(t)), 220, 4) * np.exp(-t * 9) * 2.2
    rumble = lp(rng.normal(0, 1, len(t)), 120, 4) * np.exp(-t * 1.6) * 1.2
    return (sub + thump + rumble) * 0.9


def slide_down(f0, f1, d=1.1):
    """a deflating pizz/glide: plucked string whose pitch sinks (fake-out)."""
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    ph = np.cumsum(f) / SR
    y = sum(((-1) ** (k + 1)) * np.sin(2 * np.pi * k * ph) / k for k in range(1, 8))
    return lp(y, 2600) * np.exp(-t * 1.6) * np.minimum(1, t / 0.01) * 0.35


# ---------------------------------------------------------------- harmony + melody
D, G, A, Bm, Em, A7 = [50, 54, 57], [43, 47, 50], [45, 49, 52], [47, 50, 54], [40, 43, 47], [45, 49, 52, 55]
Dm, Gm, Bb, C, A7m = [50, 53, 57], [43, 46, 50], [46, 50, 53], [48, 52, 55], [45, 49, 52, 55]
GTR = {"D": [50, 57, 62, 66, 69], "G": [43, 47, 50, 55, 59, 67], "A": [45, 52, 57, 61, 64], "Bm": [47, 54, 59, 62, 66],
       "Em": [40, 47, 52, 55, 59, 64], "A7": [45, 52, 55, 61, 64], "Dm": [50, 57, 62, 65], "Bb": [46, 53, 58, 62, 65],
       "C": [48, 52, 55, 60, 64], "Gm": [43, 50, 55, 58, 62]}
# a cheeky hornpipe-ish pizz tune (8th notes, 0 = rest), two bars per row
TUNE = [74, 0, 78, 76, 74, 0, 69, 0, 71, 73, 74, 0, 76, 0, 73, 0,
        74, 0, 78, 76, 74, 0, 81, 0, 79, 78, 76, 73, 74, 0, 0, 0]
HERO = [62, 66, 69, 74, 0, 73, 71, 69, 71, 0, 67, 71, 69, 0, 66, 0]       # Plimsoll's motif (guitar, then the finale)


def groove(t0, t1, prog, g=1.0, tune=True, gtr=True, bass=True, low=False, chop=None):
    """the quirky groove: pizz bass on 1 and 3 (fifth on 3), guitar chops on 2 and 4, pizz tune in 8ths."""
    t = t0; k = 0
    while t < t1 - 0.01:
        bar = int((t - t0) / (4 * B)); ch = prog[bar % len(prog)]
        name = ch; chord = {"D": D, "G": G, "A": A, "Bm": Bm, "Em": Em, "A7": A7, "Dm": Dm, "Gm": Gm, "Bb": Bb, "C": C}[name]
        beat = int(round((t - t0) / B)) % 4
        if bass: add(pizz(midi(chord[0] - 12 + (7 if beat == 2 else 0)), 0.45, seed=k), t, -0.15, 0.55 * g)
        if gtr and beat in (1, 3): strum(GTR[name][-4:], t, 0.8 * g, down=beat == 1, d=0.35, pan=0.25)
        if tune:
            for h in range(2):
                n = TUNE[(k * 2 + h) % len(TUNE)]
                if n: add(pizz(midi(n - (12 if low else 0)), 0.3, seed=k * 2 + h), t + h * B / 2, 0.3, 0.25 * g)
        t += B; k += 1


# ---------------------------------------------------------------- the score
# A. setup, steady (0 - 12.3): starts on frame 1, already moving
groove(0.0, 12.0, ["D", "G", "A7", "D"], 1.0)
add(pizz(midi(69), 0.3), 12.0, 0.2, 0.3); add(pizz(midi(73), 0.3), 12.25, 0.2, 0.25)
# dip under "She'll float." (12.38-12.74): only a held low D on the cello, softly
add(arco(midi(38), 0.8, 0.5), 12.25)
# B. the storm (12.9 - 15.0): low tremolo in D minor + fast ticking, a tom hit on "doesn't" (13.12)
add(trem(midi(38), 2.2, g=0.85), 12.95); add(trem(midi(45), 2.2, g=0.55), 12.95, 0.2)
for i in range(16): add(tick(hi=i % 2 == 0), 12.95 + i * B / 4, 0.35, 0.15)
add(tom(0.9, 70), 13.12, 0, 0.45)
# C. sly groove (15.0 - 18.8): payout, two more ships, the court - lower tune
groove(15.0, 18.8, ["D", "Bm", "G", "A7"], 0.85, low=True)
# D. Plimsoll (18.8 - 24.9): his motif on the guitar over a light pizz bass; a little run on "One line of paint"
t = 18.8
for i in range(24):
    n = HERO[i % len(HERO)]
    if n: add(guitar(midi(n), 0.6, seed=i, bright=0.8), t + i * B / 2, -0.2, 0.42)
for i, ch in enumerate(["D", "G", "Bm", "A", "D", "G"]):
    add(pizz(midi({"D": 38, "G": 43, "Bm": 47, "A": 45}[ch]), 0.5), 18.8 + i * 2 * B, -0.1, 0.5)
    add(pizz(midi({"D": 45, "G": 50, "Bm": 54, "A": 52}[ch]), 0.4), 18.8 + i * 2 * B + B, -0.1, 0.35)
for i, n in enumerate([62, 66, 69, 74]): add(pizz(midi(n + 12), 0.3), 23.06 + i * 0.11, 0.3, 0.32)
groove(23.8, 24.9, ["D"], 0.6, tune=False)
# dip under "Paintbrush Plimsoll!" (24.96 - 25.96): one sly low pizz and a guitar harmonic, then the floor drops
add(pizz(midi(40), 0.5), 24.96, -0.1, 0.35); add(guitar(midi(81), 1.0, bright=0.95), 25.3, 0.3, 0.12)
# E. FAKE-OUT (26.1 - 29.4): the law is dropped - a sad falling pizz line in D minor, one low cello note
for i, n in enumerate([69, 67, 65, 64, 62, 61, 62, 0, 57, 0, 53, 0]):
    if n: add(pizz(midi(n), 0.45, seed=i), 26.2 + i * B / 2, 0.15, 0.19)
add(arco(midi(38), 3.0, 0.4), 26.2)
add(pizz(midi(38), 0.6), 28.25, -0.1, 0.45)                                   # "completely." - a dull thud
# F. the march (29.4 - 33.2): snare taps in 8ths, pizz staccato climbing on each beat
for i in range(int((32.84 - 29.38) / (B / 2))):
    add(snare_tap(), 29.38 + i * B / 2, 0.1, 0.11 + 0.04 * (i % 2 == 0))
for i, n in enumerate([50, 52, 54, 55, 57, 59, 61, 62]):
    add(pizz(midi(n), 0.3, seed=i), 29.38 + i * B * 0.86, -0.2, 0.45); add(pizz(midi(n - 12), 0.4, seed=i), 29.38 + i * B * 0.86, 0.2, 0.4)
add(tom(0.5, 110), 30.8, 0, 0.22); add(tom(0.5, 110), 31.24, 0, 0.22)          # "shakes his fist"
# a stab on "villains" (32.84), then a rest
strum(GTR["Bb"], 32.84, 0.9, d=0.4); add(pizz(midi(46 - 12), 0.4), 32.84, 0, 0.5); add(tom(0.6, 80), 32.84, 0, 0.35)
# G. sheepish (33.5 - 34.4), newspapers love it (34.5 - 36.9): the groove swells back
for i, n in enumerate([62, 0, 61, 0, 59, 0]):
    if n: add(pizz(midi(n), 0.3), 33.5 + i * B / 2, 0.2, 0.25)
groove(34.48, 36.9, ["G", "A7", "D", "D"], 0.95)
# H. the law passes (36.9 - 40.0): full - guitar strums every beat + tune
groove(36.9, 40.0, ["D", "G", "A7", "D"], 1.45)
for i in range(6): strum(GTR[["D", "G", "A7", "D", "D", "D"][i]], 36.9 + i * B, 0.9, down=i % 2 == 0, d=0.4, pan=-0.25)
# "One catch." (39.94): stop. Owners paint it wherever (40.6-42): sneaky low pizz walk
for i, n in enumerate([38, 0, 41, 0, 43, 0, 44, 0, 45, 0, 44, 0]):
    if n: add(pizz(midi(n), 0.4, seed=i), 40.62 + i * B / 2, -0.1, 0.42)
# smokestack (42.62): a deflating slide (second fake-out; music thin underneath)
add(slide_down(midi(69), midi(57), 1.0), 42.55, 0.2, 0.3)
# I. THE TURN (43.24 - 50.9): ticking + D minor pizz ostinato, a layer every two bars
OST = [62, 69, 65, 69, 62, 69, 64, 69]
t0 = 43.24
for i in range(int((50.9 - t0) / (B / 2))):
    t = t0 + i * B / 2; bar = int((t - t0) / (4 * B))
    add(tick(hi=i % 2 == 0), t, 0.4, 0.2 + 0.03 * bar)
    add(pizz(midi(OST[i % 8] - 12), 0.28, seed=i), t, -0.25, 0.3 + 0.04 * bar)
    if bar >= 1 and i % 4 == 0: add(pizz(midi([38, 38, 41, 43][(i // 8) % 4]), 0.5), t, 0, 0.5)
    if bar >= 2 and i % 8 == 0: add(trem(midi([50, 50, 53, 55][(i // 8) % 4]), 4 * B, g=0.5), t, 0.3)
    if bar >= 3 and i % 2 == 0: add(tom(0.3, 90), t, 0, 0.18)
add(tom(0.8, 75), 46.46, 0, 0.3)                                              # the wave walks aboard
# J. CLIMAX (50.9 - 57.6): 1890 -> "the water's over the line": tremolo strings, drum pulse, chromatic rise
t0 = 50.9
for i in range(int((57.55 - t0) / (B / 2))):
    t = t0 + i * B / 2; k = (t - t0) / (57.6 - t0)
    add(tick(hi=i % 2 == 0), t, 0.4, 0.17 + 0.06 * k)
    add(pizz(midi(OST[i % 8] - 12 + int(k * 5)), 0.26, seed=i), t, -0.25, 0.4 + 0.15 * k)
    if i % 2 == 0: add(tom(0.3, 85 + 20 * k), t, 0, 0.22 + 0.2 * k)
    if i % 4 == 0: add(pizz(midi(38 + int(k * 6)), 0.5), t, 0, 0.55)
for j, n in enumerate([50, 51, 52, 53, 54, 55, 56, 57]):
    add(trem(midi(n), 0.9, g=0.55 + 0.08 * j), 50.9 + j * 0.83, 0.25)
    add(trem(midi(n - 12), 0.9, g=0.5 + 0.06 * j), 50.9 + j * 0.83, -0.25)
for i in range(8): add(snare_tap(), 56.0 + i * B / 4, 0.1, 0.08 + 0.012 * i)  # roll into the payoff
# ONE DEEP BOOM on the payoff "stays home" (57.60); 0.6 s of air after it
add(boom(), 57.6, 0, 0.32)
# K. resolution (58.2 - 63.98): Plimsoll's motif in full, D major, guitar strums + pizz
t = 58.2
for i in range(int((62.7 - t) / (B / 2))):
    n = HERO[i % len(HERO)]
    if n: add(pizz(midi(n + 12), 0.3, seed=i), t + i * B / 2, 0.3, 0.36); add(guitar(midi(n), 0.5, seed=i, bright=0.8), t + i * B / 2, -0.2, 0.3)
for i in range(9):
    ch = ["D", "D", "G", "G", "Bm", "A", "G", "A", "D"][i]
    strum(GTR[ch], 58.2 + i * B, 0.75, down=i % 2 == 0, d=0.45, pan=-0.2)
    add(pizz(midi({"D": 38, "G": 43, "Bm": 47, "A": 45}[ch]), 0.5), 58.2 + i * B, 0, 0.5)
# thin under the last quote "she'll float," (62.76-63.24): one soft guitar chord
strum(GTR["G"], 62.7, 0.45, d=0.8)
# the final stab on "to!" (63.78): a full D chord + low D; the cut at 63.98 lands on its attack
strum(GTR["D"], 63.76, 1.2, d=0.3); add(pizz(midi(38), 0.3), 63.78, 0, 0.7); add(pizz(midi(74), 0.25), 63.78, 0.3, 0.5)

# ---------------------------------------------------------------- master: gentle glue, cut clean at the last word
out = np.tanh(out * 1.2) / 1.2
out /= np.abs(out).max() / 0.89
nf = int(0.012 * SR); out[-nf:] *= np.linspace(1, 0, nf)[:, None]                   # 12 ms de-click, not a fade-out
sf.write("/home/claude/ship/audio/music.wav", out.astype(np.float32), SR, subtype="PCM_24")
print("music.wav", N / SR, "s")
