"""Snap word boundaries to the real pauses: each pause inside a line gets the word boundary nearest to it
(within 0.4 s); the word before ends where the pause starts and the next begins where it ends."""
import json, sys
import numpy as np
from scipy.io import wavfile
sr, a = wavfile.read('audio2/voice.wav'); a = a.astype(np.float32) / 32768
hop = 240; n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
sp = db > -42
# speech runs, merging gaps < 0.18 s
runs = []; i = 0
while i < n:
    if sp[i]:
        j = i
        while j < n and any(sp[j:j + 18]): j += 1
        # trim trailing silence inside the lookahead
        e = j
        while e > i and not sp[e - 1]: e -= 1
        runs.append([i * .01, e * .01]); i = max(j, e)
    else: i += 1
runs = [r for r in runs if r[1] - r[0] > 0.12]
D = json.load(open(sys.argv[1]))
flags = []
for ln in D['lines']:
    inside = [r for r in runs if r[0] > ln['start'] - 0.05 and r[1] < ln['end'] + 0.05]
    ws = ln['words']
    for r0, r1 in zip(inside[:-1], inside[1:]):
        pa, pb = r0[1], r1[0]                      # pause from pa to pb
        mid = (pa + pb) / 2
        best, bk = 9, None
        for k in range(len(ws) - 1):
            b = (ws[k]['end'] + ws[k + 1]['start']) / 2
            if abs(b - mid) < best: best, bk = abs(b - mid), k
        if bk is None: continue
        if best > 0.4:
            flags.append((ln['id'], round(mid, 2), round(best, 2), ws[bk]['w'], ws[bk + 1]['w'])); continue
        ws[bk]['end'] = round(pa, 3); ws[bk + 1]['start'] = round(pb, 3)
    # keep monotone
    for k in range(1, len(ws)):
        if ws[k]['start'] < ws[k - 1]['start'] + 0.03: ws[k]['start'] = round(ws[k - 1]['start'] + 0.03, 3)
        if ws[k - 1]['end'] > ws[k]['start']: ws[k - 1]['end'] = ws[k]['start']
json.dump(D, open(sys.argv[2], 'w'), indent=1)
print('flags', len(flags))
for f in flags: print(f)
