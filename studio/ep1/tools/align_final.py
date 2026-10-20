"""Assign every script word to a real speech run (pause-delimited) with a global DP, then place words inside
runs from the per-line DTW (rescaled to the run edges). Breaths/stray runs get no words.
Usage: align_final.py words2.json out.json"""
import json, sys
import numpy as np
from scipy.io import wavfile
sr, a = wavfile.read('audio2/voice.wav'); a = a.astype(np.float32) / 32768
hop = 240; n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
sp = db > -42
runs = []; i = 0
while i < n:
    if sp[i]:
        j = i
        while j < n and any(sp[j:j + 18]): j += 1
        e = j
        while e > i and not sp[e - 1]: e -= 1
        runs.append([i * .01, e * .01]); i = max(j, e)
    else: i += 1
runs = [r for r in runs if r[1] - r[0] > 0.12]
D = json.load(open(sys.argv[1])); old = json.load(open('audio/words.json'))['lines']
# the real voice also says 'dollars' after the taxable income; the placeholder did not
for ln, lo in zip(D['lines'], old):
    if ln['id'] == 'm4' and ln['words'][-1]['w'] != 'dollars':
        ln['words'].append({'w': 'dollars', 'start': ln['words'][-1]['end'], 'end': ln['words'][-1]['end'] + 0.35})
        lo['words'].append({'w': 'dollars', 'start': lo['words'][-1]['end'], 'end': lo['words'][-1]['end'] + 0.4})
        ln['say'] += ' dollars'
words = []
for ln, lo in zip(D['lines'], old):
    for w, wo in zip(ln['words'], lo['words']):
        words.append(dict(line=ln['id'], w=w['w'], s=w['start'], e=w['end'], kw=max(0.08, wo['end'] - wo['start'])))
N, R = len(words), len(runs)
kw = np.array([w['kw'] for w in words]); cs = np.concatenate([[0], np.cumsum(kw)])
ws_ = np.array([w['s'] for w in words]); we_ = np.array([w['e'] for w in words])
ratio = (runs[-1][1] - runs[0][0]) / (cs[-1] + 0.0)  # rough speech-time per Kokoro-word-second (includes pauses) -> recalibrate
tot_run = sum(r[1] - r[0] for r in runs)
ratio = tot_run / cs[-1]
INF = 1e9
# dp[r][i] = best cost placing first i words into first r runs
dp = np.full((R + 1, N + 1), INF); bp = np.zeros((R + 1, N + 1), int)
dp[0, 0] = 0
for r in range(1, R + 1):
    r0, r1 = runs[r - 1]; dur = r1 - r0
    for i in range(0, N + 1):
        # option: empty run (breath / noise)
        best, arg = INF, 0
        if dp[r - 1, i] < INF:
            c = dp[r - 1, i] + (2.0 if dur < 0.75 else 12.0)
            best, arg = c, i
        # option: take words [k, i)
        for k in range(max(0, i - 30), i):
            if dp[r - 1, k] >= INF: continue
            exp = ratio * (cs[i] - cs[k])
            c_len = (np.log(dur / max(exp, 0.05))) ** 2 * 1.5
            c_pos = ((ws_[k] - r0) / 0.5) ** 2 * 0.5 + ((we_[i - 1] - r1) / 0.5) ** 2 * 0.5
            c = dp[r - 1, k] + c_len + c_pos
            if c < best: best, arg = c, k
        dp[r, i] = best; bp[r, i] = arg
assert dp[R, N] < INF
# backtrack
assign = [None] * R; i = N
for r in range(R, 0, -1):
    k = bp[r, i]; assign[r - 1] = (k, i); i = k
print('total cost', round(dp[R, N], 2))
empty = [(r, runs[r]) for r, (k, i) in enumerate(assign) if k == i]
print('empty runs:', [(r, round(x[0], 2), round(x[1], 2)) for r, x in empty])
newt = [None] * N
for r, (k, i) in enumerate(assign):
    if k == i: continue
    r0, r1 = runs[r]
    t0, t1 = ws_[k], we_[i - 1]
    span = max(t1 - t0, 1e-3)
    for q in range(k, i):
        a_ = r0 + (ws_[q] - t0) / span * (r1 - r0); b_ = r0 + (we_[q] - t0) / span * (r1 - r0)
        newt[q] = [a_, b_]
    # enforce min width + monotone gap-free
    for q in range(k + 1, i):
        newt[q][0] = max(newt[q][0], newt[q - 1][0] + 0.05)
    for q in range(k, i - 1):
        mid = (newt[q][1] + newt[q + 1][0]) / 2
        newt[q][1] = max(newt[q][0] + 0.04, mid); newt[q + 1][0] = newt[q][1]
    newt[k][0] = r0; newt[i - 1][1] = r1
assert all(t is not None for t in newt)
# write back per line
out = []; q = 0
for ln in D['lines']:
    nw = []
    for w in ln['words']:
        nw.append({'w': w['w'], 'start': round(newt[q][0], 3), 'end': round(newt[q][1], 3)}); q += 1
    out.append({**ln, 'start': nw[0]['start'], 'end': nw[-1]['end'], 'words': nw})
json.dump({'duration': D['duration'], 'lines': out}, open(sys.argv[2], 'w'), indent=1)
# report lines whose words span >1 run, or lines that share a run
for r, (k, i) in enumerate(assign):
    if k == i: continue
    lines = sorted({words[x]['line'] for x in range(k, i)})
    if len(lines) > 1: print('run', r, round(runs[r][0], 2), round(runs[r][1], 2), 'holds lines', lines)
