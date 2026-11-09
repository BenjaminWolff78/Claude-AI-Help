"""Original underscore for "They Blew Up Houses to Stop a Fire" (64.0 s): a cheeky baroque-folk jig in D minor, 120 BPM
shuffle - plucked lute/harpsichord, a low drone, fiddle-like reed melody, tabor drum. Kept small and ducked for the
story; it RISES only at the turn ("That's the trick", 42.2 s) and the payoff (booms -> the bucket, 50.1-57.4 s), then
settles for today and fades out by 62.4 s."""
import numpy as np, soundfile as sf
SR = 44100; BPM = 120; B = 60 / BPM; L = 64.0
N = int(L * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(1666)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i >= N or j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += x[:j - i] * g * l; out[i:j, 1] += x[:j - i] * g * r
def tt(d): return np.arange(int(d * SR)) / SR
def lute(f, d=0.5):
    t = tt(d); return (np.sin(2*np.pi*f*t) + 0.45*np.sin(4*np.pi*f*t)*np.exp(-t*8) + 0.2*np.sin(6*np.pi*f*t)*np.exp(-t*12)) * np.exp(-t*6) * (1-np.exp(-t*900))
def harpsi(f, d=0.35):
    t = tt(d); return (np.sin(2*np.pi*f*t) + 0.6*np.sin(4*np.pi*f*t) + 0.35*np.sin(6*np.pi*f*t) + 0.2*np.sin(8*np.pi*f*t)) * np.exp(-t*9) * (1-np.exp(-t*1500)) * 0.6
def reed(f, d=0.4):
    t = tt(d); v = 1 + 0.007*np.sin(2*np.pi*5.2*t); ph = 2*np.pi*np.cumsum(f*v)/SR
    y = np.sin(ph) + 0.4*np.sin(2*ph) + 0.25*np.sin(3*ph) + 0.1*np.sin(4*ph); e = np.minimum(1, t/0.04) * np.minimum(1, (d-t)/0.07); return y*e*0.45
def drone(f, d):
    t = tt(d); y = np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*1.5*f*t) + 0.25*np.sin(2*np.pi*2*f*t); return y * np.minimum(1, t/0.5) * np.minimum(1, (d-t)/0.5) * 0.35
def tabor(d=0.25, f0=150):
    t = tt(d); ph = 2*np.pi*np.cumsum(f0*(1+0.8*np.exp(-t*40)))/SR; return (np.sin(ph)*np.exp(-t*14) + 0.5*rng.normal(0,1,len(t))*np.exp(-t*50)) * 0.6
def pluck(f, d=0.25):
    t = tt(d); return (np.sin(2*np.pi*f*t) + 0.3*np.sin(4*np.pi*f*t)) * np.exp(-t*16) * (1-np.exp(-t*600))
def marimba(f, d=0.5):
    t = tt(d); return (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*4*f*t)*np.exp(-t*30)) * np.exp(-t*7) * (1-np.exp(-t*900))
def pad(fs, d, soft=1.0):
    t = tt(d); y = sum(np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2.003*f*t) for f in fs) / len(fs)
    return y * np.minimum(1, t/0.5) * np.minimum(1, (d-t)/0.6) * 0.5 * soft
def shaker(d=0.08):
    n = np.diff(rng.normal(0,1,int(d*SR)), prepend=0); return n*np.exp(-tt(d)*60)*0.5
Dm, Gm, A7, Bb, C, F = [50,53,57], [43,46,50], [45,49,52,55], [46,50,53], [48,52,55], [41,45,48]
MEL = [62,64,65,67, 69,67,65,64, 62,64,65,62, 61,57,61,64, 65,67,69,70, 69,67,65,64, 65,64,62,61, 62,57,62,69]
def section(t0, t1, prog, style, g=1.0):
    beat = 0; t = t0
    while t < t1 - 0.01:
        bar = beat // 4; ch = prog[bar % len(prog)]; b = beat % 4; root = ch[0]
        if style in ("jig", "rise", "payoff"):
            add(lute(midi(root - 12 + [0, 7, 12, 7][b]), B*0.9), t, -0.1, 0.32*g)                                                # walking lute bass
            for k, n in enumerate(ch[:3]): add(harpsi(midi(n + 12), 0.25), t + B*0.5 + k*0.012, 0.2, 0.05*g)                     # off-beat chords
            add(shaker(), t + B*0.66, 0.45, 0.03*g)
            if style != "jig" or b % 2 == 0:
                m = MEL[beat % len(MEL)]; add(reed(midi(m + (12 if style == "payoff" else 0)), B*0.88), t, -0.25, (0.07 if style == "jig" else 0.1)*g)
            if style in ("rise", "payoff") and b in (0, 2): add(tabor(), t, 0.1, 0.16*g)
            if style == "payoff": add(tabor(0.18, 220), t + B*0.5, -0.1, 0.08*g)
            if b == 0 and style != "jig": add(drone(midi(root - 12), B*4), t, 0, 0.12*g)
        if style == "night":
            if b == 0: add(pad([midi(n) for n in ch[:3]], B*4, 0.8), t, 0, 0.14*g); add(drone(midi(root - 24), B*4), t, 0, 0.1*g)
            if b % 2 == 0: add(pluck(midi(MEL[beat % len(MEL)] + 12), 0.45), t, 0.25*(1 if b % 4 else -1), 0.07*g)
        if style == "tension":
            if b == 0: add(pad([midi(n - 12) for n in ch[:3]], B*4, 0.9), t, 0, 0.14*g)
            add(tabor(0.22, 90), t, 0, 0.1*g); add(pluck(midi(ch[b % 3] + 12)), t + B/2, 0.3*(1 if b % 2 else -1), 0.07*g)
        if style == "sunny":
            add(marimba(midi(ch[beat % 3] + 24), 0.4), t, 0.2*(1 if b % 2 else -1), 0.1*g)
            if b % 2 == 0: add(lute(midi(root), B*1.6), t, 0, 0.22*g)
            add(shaker(), t + B/2, 0.4, 0.025*g)
        beat += 1; t = t0 + beat*B
section(0.0, 3.2, [Dm, A7], "tension", 0.8)              # hook: fuse + boom
section(3.2, 11.2, [Dm, Gm, A7, Dm], "night", 0.8)       # 1666 night: the bakery, the mayor
section(11.2, 20.4, [Dm, Bb, C, A7], "tension", 0.75)    # morning: roof to roof, buckets, the cathedral
section(20.4, 35.0, [Dm, C, Bb, A7], "jig", 0.7)         # day two: powder, the street, "Captain Kaboom", hooks
section(35.0, 42.2, [F, C, Bb, C], "sunny", 0.75)        # you + dominoes
section(42.2, 46.9, [Dm, Bb, C, A7], "rise", 1.05)       # THE TURN: "That's the trick"
section(46.9, 50.1, [Dm, A7], "tension", 0.9)            # day three: the fuse
section(50.1, 57.4, [Dm, Bb, C, F, Gm, A7, Dm, A7], "payoff", 1.15)  # PAYOFF: booms -> starves -> the bucket
section(57.4, 64.0, [F, C, Bb, C], "sunny", 0.6)         # today
y = out.copy()
for d, g in ((0.08, 0.2), (0.17, 0.14), (0.29, 0.08)):
    k = int(d*SR); y[k:] += out[:-k]*g
y /= np.abs(y).max()*1.12
fade = np.ones(N); a = int(60.6*SR); b = int(62.4*SR); fade[a:b] = np.linspace(1, 0, b - a)**1.5; fade[b:] = 0
y *= fade[:, None]
sf.write("/home/claude/fire/audio/music.wav", y, SR, subtype="PCM_24"); print("ok", len(y)/SR)
