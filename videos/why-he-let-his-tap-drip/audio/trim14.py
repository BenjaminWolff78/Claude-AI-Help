# Voice for the dripping-tap video (v30 3.22-3.23): word edges from the raw take's word timings refined by energy;
# pauses over 0.18 s shortened to 0.11 s (>= 40 ms after an ending, 40-50 ms before a start), 10 ms crossfades; one R3 tempo pass.
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
SR = 44100; TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.05; R3 = 536870912
D = sys.argv[2] if len(sys.argv) > 2 else 'tB'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{D}/raw.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '/tmp/raw44_14.f32'], check=True)
x = np.fromfile('/tmp/raw44_14.f32', dtype=np.float32); tot = len(x) / SR
W = json.load(open(f'{D}/raw_words.json'))
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
RE = [real_end(i) for i in range(len(W) - 1)]; RS = [None] + [real_start(j) for j in range(1, len(W))]
GAP_TO = 0.11; XF = 0.010; pieces = []; cur = 0.0; n_cut = 0
for i in range(len(W) - 1):
    a, b = max(RE[i], W[i]['e'] - 0.03), min(RS[i + 1], W[i + 1]['s'])   # 11-26: never start later than the aligner's word start (a quiet P of "Plumbers" was cut)
    if b - a <= 0.18: continue
    soft = W[i + 1]['w'].lower().lstrip('"\u201c')[:1] in set('aeiouywhnmlrsfvz')
    kb = 0.05 if soft else 0.04; ka = GAP_TO + XF - kb                   # >= 40 ms after the ending, 40-50 ms before the start
    pieces.append((cur, a + ka)); cur = b - kb; n_cut += 1
pieces.append((cur, min(tot, W[-1]['e'] + 0.25)))
pieces[0] = (max(0.0, W[0]['s'] - 0.05), pieces[0][1])
xf = int(XF * SR); y = None
for a, b in pieces:
    seg = x[int(a * SR):int(b * SR)].copy()
    if y is None: y = seg; continue
    r = np.linspace(0, 1, xf, dtype=np.float32); y[-xf:] = y[-xf:] * (1 - r) + seg[:xf] * r; y = np.concatenate([y, seg[xf:]])
y.astype(np.float32).tofile('/tmp/pre14.f32')
out = f'voice14_{D}_{TEMPO}.wav'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '/tmp/pre14.f32', '-af',
                f'rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}', '-ar', '44100', '-ac', '1', out], check=True)
json.dump({'pieces': pieces, 'tempo': TEMPO, 'take': D}, open(f'keep14_{D}_{TEMPO}.json', 'w'))
print(f'{D} T {TEMPO}: {n_cut} pauses shortened; raw {tot:.2f}s -> pre {len(y)/SR:.2f}s -> final {len(y)/SR/TEMPO:.2f}s -> {out}')
