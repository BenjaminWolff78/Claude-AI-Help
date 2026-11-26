# Voice v3 for the pig video, by the book (master prompt v30, 3.22-3.23), no timing constraint:
# word edges from the raw take's word timings refined by each word's own decay (retrim.py); every pause with more
# than 0.18 s of real silence shortened to 0.11 s (>= 40 ms kept after the ending, >= 30 ms before the next start),
# joined with 10 ms crossfades; then ONE R3 rubberband pass at the natural pitch with tempo T.
# The animation is re-timed to this voice afterwards (story-frame remap), so nothing has to fit an old timeline.
import json, subprocess, sys, numpy as np
TEMPO_ARG = float(sys.argv[1]) if len(sys.argv) > 1 else 1.06
exec(open('retrim.py').read().split("pieces = []")[0].replace("TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.03", f"TEMPO = {TEMPO_ARG}"))
GAP_TO = 0.11; XF = 0.010; pieces = []; cur = 0.0; n_cut = 0
# phrases dropped to keep the video under 67 s at the 1.10 tempo cap (3.19/3.23: cut words, never squeeze); whole
# phrases between pauses only, never a word inside running speech
DROP_AFTER = {'paper.': ["He's", 'bagged', 'so', 'many,']}
drop = set()
for i, w in enumerate(W):
    seq = DROP_AFTER.get(w['w'])
    if seq and [q['w'] for q in W[i + 1:i + 1 + len(seq)]] == seq: drop.update(range(i + 1, i + 1 + len(seq)))
print('dropping', ' '.join(W[k]['w'] for k in sorted(drop)))
keepw = [i for i in range(len(W)) if i not in drop]
for i, j in zip(keepw, keepw[1:]):
    a, b = RE[i], RS[j]
    if j != i + 1: b = max(b, RE[j - 1] + 0.05 + 0.045)                      # a dropped phrase: cut through its own ending
    if b - a <= 0.18 and j == i + 1: continue
    soft = W[j]['w'].lower().lstrip('"“')[:1] in set('aeiouywhnmlrsfvz')
    kb = 0.05 if soft else 0.04; ka = GAP_TO + XF - kb                   # >= 40 ms after the ending; 45-60 ms before the start (soft starts get more)
    pieces.append((cur, a + ka)); cur = b - kb; n_cut += 1
pieces.append((cur, min(tot, W[-1]['e'] + 0.25)))
pieces[0] = (max(0.0, W[0]['s'] - 0.05), pieces[0][1])                    # lead-in as before
xf = int(XF * SR); y = None
for a, b in pieces:
    seg = x[int(a * SR):int(b * SR)].copy()
    if y is None: y = seg; continue
    r = np.linspace(0, 1, xf, dtype=np.float32); y[-xf:] = y[-xf:] * (1 - r) + seg[:xf] * r; y = np.concatenate([y, seg[xf:]])
y.astype(np.float32).tofile('/tmp/pre3.f32')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '/tmp/pre3.f32', '-af',
                f'rubberband=tempo={TEMPO}:pitch=1.0:formant=preserved:channels={R3}', '-ar', '44100', '-ac', '1', 'voice_v3.wav'], check=True)
json.dump({'pieces': pieces, 'tempo': TEMPO}, open('keep_v3.json', 'w'))
print(f'T {TEMPO}: {n_cut} pauses shortened; pre {len(y)/SR:.2f}s -> final {len(y)/SR/TEMPO:.2f}s')
