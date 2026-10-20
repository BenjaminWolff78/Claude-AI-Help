"""Hybrid word placement inside each run: average of the DTW boundary and a phoneme-length prior, then snap to
acoustic dips. Usage: hybrid.py words6.json out.json"""
import json, sys, importlib.util
import numpy as np
from scipy.io import wavfile
argv = sys.argv; sys.argv = ['x']
spec = importlib.util.spec_from_file_location('tts', 'tools/tts.py'); tts = importlib.util.module_from_spec(spec); spec.loader.exec_module(tts)
sys.argv = argv
VOW = set("aeiouAIOWYɪʊɛæʌɑɔəɜɚᵻᵊ")
STOP = set("ptkbdgʔ")
def pweight(word):
    try: ph, _ = tts.g2p(word)
    except SystemExit: return 0.5 + 0.45 * len(word)
    w = 0.5; prev_stress = False
    for ch in ph:
        if ch in "ˈ": prev_stress = True; continue
        if ch in "ˌ .,?!;:": continue
        if ch in VOW: w += 1.7 + (0.9 if prev_stress else 0.0); prev_stress = False
        elif ch in STOP: w += 0.7
        else: w += 1.0
    return w
sr, a = wavfile.read('audio2/voice.wav'); a = a.astype(np.float32) / 32768
hop = 240; n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
sm = np.convolve(db, np.ones(3) / 3, mode='same')
cands = []
for k in range(3, n - 3):
    if sm[k] <= sm[k - 1] and sm[k] < sm[k + 1]:
        ctx = np.percentile(db[max(0, k - 20):k + 21], 80); depth = ctx - sm[k]
        if depth >= 10 and sm[k] < -34: cands.append((k * 0.01, depth))
cands = np.array(cands)
D = json.load(open(argv[1]))
moved = 0
for ln in D['lines']:
    ws = ln['words']; i = 0
    while i < len(ws):
        j = i
        while j + 1 < len(ws) and ws[j + 1]['start'] - ws[j]['end'] < 0.12: j += 1
        m = j - i
        if m >= 1:
            r0, r1 = ws[i]['start'], ws[j]['end']
            wt = np.array([pweight(ws[q]['w']) for q in range(i, j + 1)]); cw = np.cumsum(wt) / wt.sum()
            b = [0.5 * ((ws[q]['end'] + ws[q + 1]['start']) / 2) + 0.5 * (r0 + cw[q - i] * (r1 - r0)) for q in range(i, j)]
            opts = []
            for bj in b:
                o = [(bj, 0.0)]
                for t, d in cands:
                    if abs(t - bj) <= 0.2 and r0 + 0.06 < t < r1 - 0.06: o.append((t, d))
                opts.append(o)
            cost = [[((t - bj) / 0.14) ** 2 - 1.2 * min(1, d / 28) for t, d in o] for o, bj in zip(opts, b)]
            INF = 1e9
            dp = [[INF] * len(o) for o in opts]; bp = [[0] * len(o) for o in opts]
            dp[0] = list(cost[0])
            for q in range(1, m):
                for x, (t, d) in enumerate(opts[q]):
                    for y, (tp, _) in enumerate(opts[q - 1]):
                        if t - tp >= 0.06 and dp[q - 1][y] + cost[q][x] < dp[q][x]:
                            dp[q][x] = dp[q - 1][y] + cost[q][x]; bp[q][x] = y
            x = int(np.argmin(dp[-1]))
            if dp[-1][x] < INF:
                sel = [None] * m
                for q in range(m - 1, -1, -1):
                    sel[q] = opts[q][x][0]; x = bp[q][x]
                for q in range(m):
                    t = round(float(sel[q]), 3); moved += 1
                    ws[i + q]['end'] = t; ws[i + q + 1]['start'] = t
        i = j + 1
json.dump(D, open(argv[2], 'w'), indent=1)
print('boundaries placed', moved)
