# Re-trim the pig video's voice from the RAW take without eating word endings (master prompt v30, 3.22),
# keeping every word's start where the old trim put it (the animation is synced to it):
#  - word edges from the raw take's word timings, refined by energy (an ending lasts until the sound has
#    stayed under the silence level for 30 ms; the same backwards for a start)
#  - only gaps of more than 0.18 s of real silence are shortened; at least 40 ms kept after the ending and
#    30 ms before the next start; joins are 10 ms crossfades inside the pause
#  - how much of each pause is removed is chosen so the next word starts where it started in the old voice;
#    when the restored ending needs more room, the next word moves later (reported) and later pauses absorb it
#  - then the same single R3 tempo pass (1.03)
import json, subprocess, sys, numpy as np
SR = 44100; TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.03; OLD_T = 1.03; R3 = 536870912
D = 'tB'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{D}/raw.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '/tmp/raw44.f32'], check=True)
x = np.fromfile('/tmp/raw44.f32', dtype=np.float32); tot = len(x) / SR
W = json.load(open(f'{D}/raw_words.json'))
keep_old = json.load(open(f'{D}/keep.json'))
hop = int(SR * 0.0025); n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
from scipy.signal import butter, sosfilt
xh = sosfilt(butter(4, 4000, 'hp', fs=SR, output='sos'), x).astype(np.float32)
dbh = 20 * np.log10(np.sqrt((xh[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)          # energy above 4 kHz
speech = float(np.median(db[db > -45])); thr = speech - 34          # end of a sound: under speech-34 dB for 20 ms (a breath in a pause is not part of a word)
F = lambda t: int(round(t / 0.0025)); Tm = lambda i: i * 0.0025
QUIET = 8                                                            # 20 ms
def peak(i): return float(db[F(W[i]['s']):max(F(W[i]['e']), F(W[i]['s']) + 1)].max())
def real_end(i):
    # the word's sound ends where it first falls 30 dB under the word's own peak (or under speech-34);
    # a breath later in the pause is pause, not part of the word
    lv = max(peak(i) - 30, thr); lo = F(max(W[i]["s"] + 0.03, W[i]["e"] - 0.06))
    hi = min(F(W[i + 1]['s'] + 0.10) if i + 1 < len(W) else n - 2, n - 2)
    for k in range(lo, hi):
        # under the level for 5 ms = the end, unless strong sound comes back within 60 ms (a stop closure before an -s,
        # as in "piglets"): a breath later in the pause is weaker and stays pause
        if db[k] < lv and db[k + 1] < lv:
            back = np.where(db[k + 2:k + 24] > peak(i) - 22)[0] + k + 2
            # a fricative (-s, -z, -sh) after the closure is mostly above 4 kHz; a breath is not
            if not len(back) or np.median(dbh[back] - db[back]) < -6: return Tm(k)
    return Tm(hi)
def real_start(j):
    lv = max(peak(j) - 30, thr); hi = F(min(W[j]['e'] - 0.03, W[j]['s'] + 0.06)); lo = max(F(W[j - 1]['e'] - 0.10), 2)
    for k in range(hi, lo, -1):
        if (db[max(0, k - 16):k] < lv).all(): return Tm(k)               # 40 ms under before the start
    return Tm(lo)
def pre_old(t):                                                      # raw time -> old pre-tempo time
    s = 0.0
    for a, b in keep_old:
        if t >= b: s += b - a
        elif t > a: s += t - a
    return s
RE = [real_end(i) for i in range(len(W) - 1)]; RS = [None] + [real_start(j) for j in range(1, len(W))]
pieces = []; cur = 0.0; out = 0.0; XF = 0.010; shifts = []; cutn = 0
for i in range(len(W) - 1):
    a, b = RE[i], RS[i + 1]
    if b - a <= 0.18: continue                                        # short gaps stay whole
    target = pre_old(b) / OLD_T * TEMPO                               # where the next word's real start sat before (final time x new tempo)
    R = (out + (b - cur) - XF) - target                               # how much to remove so it lands there (the join overlaps 10 ms)
    kept_min = 0.075
    if R > (b - a) - kept_min:
        shifts.append((W[i + 1]['w'], (R - ((b - a) - kept_min)) / TEMPO)); R = (b - a) - kept_min
    if R <= XF:                                                      # nothing worth cutting (or it would need padding)
        if R < -0.005: shifts.append((W[i + 1]['w'], R / TEMPO))
        continue
    kept = (b - a) - R; kb = max(0.03, min(0.06, kept * 0.4)); ka = kept - kb
    pieces.append((cur, a + ka)); out += (a + ka - cur) - (XF if pieces[:-1] else 0); cur = b - kb; cutn += 1
end = min(tot, W[-1]['e'] + 0.25)
pieces.append((cur, end))
# assemble with 10 ms linear crossfades at every join
xf = int(XF * SR); y = np.zeros(0, dtype=np.float32)
for p, (a, b) in enumerate(pieces):
    seg = x[int(a * SR):int(b * SR)].copy()
    if p == 0: y = seg; continue
    r = np.linspace(0, 1, xf, dtype=np.float32)
    y[-xf:] = y[-xf:] * (1 - r) + seg[:xf] * r
    y = np.concatenate([y, seg[xf:]])
y.astype(np.float32).tofile('/tmp/pre.f32')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '/tmp/pre.f32',
                '-af', f'rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}', '-ar', '44100', '-ac', '1', 'voice_v2.wav'], check=True)
json.dump(pieces, open('keep_v2.json', 'w'))
big = [s for s in shifts if abs(s[1]) > 0.02]
print(f'speech {speech:.1f} dB; raw {tot:.2f}s -> pre {len(y)/SR:.2f}s -> final {len(y)/SR/TEMPO:.2f}s; {cutn} pauses shortened; '
      f'old final {sum(b-a for a,b in keep_old)/OLD_T:.2f}s')
print('words that could not land on their old start (s, + = later):', [(w, round(d, 3)) for w, d in big])
