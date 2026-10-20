"""Move word boundaries onto real acoustic dips (stop closures, weak syllable joins) when a clear dip lies near the
DTW boundary. DP per run: minimize ((t-b)/0.22)^2 - 1.2*min(1,depth/28), t increasing, >=0.07 s apart.
Usage: dip_snap.py in.json out.json"""
import json, sys
import numpy as np
from scipy.io import wavfile
sr, a = wavfile.read('audio2/voice.wav'); a = a.astype(np.float32) / 32768
hop = 240; n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
sm = np.convolve(db, np.ones(3) / 3, mode='same')
D = json.load(open(sys.argv[1]))
# candidate dips
cands = []
for k in range(3, n - 3):
    if sm[k] <= sm[k - 1] and sm[k] < sm[k + 1]:
        ctx = np.percentile(db[max(0, k - 20):k + 21], 80)
        depth = ctx - sm[k]
        if depth >= 10 and sm[k] < -34: cands.append((k * 0.01, depth))
cands = np.array(cands)
# flatten words to runs: a run = consecutive words with gap < 0.12 s
changes = 0
for ln in D['lines']:
    ws = ln['words']
    i = 0
    while i < len(ws):
        j = i
        while j + 1 < len(ws) and ws[j + 1]['start'] - ws[j]['end'] < 0.12: j += 1
        # run words i..j ; boundaries between consecutive words
        m = j - i
        if m >= 1:
            r0, r1 = ws[i]['start'], ws[j]['end']
            b = [ (ws[q]['end'] + ws[q + 1]['start']) / 2 for q in range(i, j) ]
            opts = []
            for bj in b:
                o = [(bj, 0.0)]
                for t, d in cands:
                    if abs(t - bj) <= 0.3 and r0 + 0.07 < t < r1 - 0.07: o.append((t, d))
                opts.append(o)
            cost = [[((t - bj) / 0.22) ** 2 - 1.2 * min(1, d / 28) for t, d in o] for o, bj in zip(opts, b)]
            INF = 1e9
            dp = [[INF] * len(o) for o in opts]; bp = [[0] * len(o) for o in opts]
            dp[0] = list(cost[0])
            for q in range(1, m):
                for x, (t, d) in enumerate(opts[q]):
                    for y, (tp, _) in enumerate(opts[q - 1]):
                        if t - tp >= 0.07 and dp[q - 1][y] + cost[q][x] < dp[q][x]:
                            dp[q][x] = dp[q - 1][y] + cost[q][x]; bp[q][x] = y
            x = int(np.argmin(dp[-1])); sel = [None] * m
            if dp[-1][x] < INF:
                for q in range(m - 1, -1, -1):
                    sel[q] = opts[q][x][0]; x = bp[q][x]
                for q in range(m):
                    t = round(sel[q], 3)
                    if abs(t - b[q]) > 0.005: changes += 1
                    ws[i + q]['end'] = t; ws[i + q + 1]['start'] = t
        i = j + 1
json.dump(D, open(sys.argv[2], 'w'), indent=1)
print('boundaries moved', changes)
