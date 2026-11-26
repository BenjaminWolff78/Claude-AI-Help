# Output frame (v31 voice) -> story frame (the animation built on the v30 voice). Anchors: the word starts both voices
# share; "Haha," (new) is anchored just before "froze" at speed 1 so the quote keeps its lip sync; after "dripping."
# the story runs on at speed 1 into the new ending (shot 18). Smooth least squares (speed changes penalised), the
# quoted words weighted 25x.
import json, re, difflib, numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl
FPS = 30
old = json.load(open('/home/claude/p13/audio/words_final_kit.json')); new = json.load(open('/home/claude/p13/audio/words_v31.json'))
norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower().replace('twenty', '20').replace('three', '3'))
sm = difflib.SequenceMatcher(a=[norm(w['word']) for w in old], b=[norm(w['word']) for w in new], autojunk=False)
anc = []; newidx = {}
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(a1 - a0): anc.append((new[b0 + k]['start'] * FPS, old[a0 + k]['start'] * FPS, b0 + k))
    else: print('unmatched', tag, [w['word'] for w in old[a0:a1]], [w['word'] for w in new[b0:b1]])
ih = [i for i, w in enumerate(new) if norm(w['word']) == 'haha'][0]
fz_new = new[ih + 1]['start'] * FPS; fz_old = [o for n, o, i in anc if i == ih + 1][0]
anc.append((new[ih]['start'] * FPS, fz_old - (fz_new - new[ih]['start'] * FPS), ih))
# the old voice had no room for the laugh (story 789 -> 808 for output 774 -> 816): the whip to the fence moves earlier in
# story time (760-779) so it lands on "neighbor", and the laugh plays at ~0.7 speed while he is on screen
ineb = [i for i, w in enumerate(new) if norm(w['word']) == 'neighbor' and 760 < w['start'] * FPS < 790][0]
anc = [x for x in anc if not (norm(new[x[2]]['word']) == 'grins' or x[2] in (ineb - 1, ineb, ih))]
anc += [(new[ineb]['start'] * FPS, 779.0, ineb), (new[ih]['start'] * FPS, 795.0, ih)]
anc.sort()
anc.sort()
idrip = [i for i, w in enumerate(new) if norm(w['word']) == 'dripping'][-1]
lastn, lasto = [(n, o) for n, o, i in anc if i == idrip][0]
TOTAL = 1980                                                     # 66.0 s: the hit on "yard" at 1957, 0.77 s after it
quoted = set()
for qa, qb in (('you\'re', 'bucket'), ('haha', 'drippy')):
    i0 = [i for i, w in enumerate(new) if norm(w['word']) == qa][0]; i1 = [i for i, w in enumerate(new) if norm(w['word']) == qb and i >= i0][0]
    quoted.update(range(i0, i1 + 1))
pts = [(n, o, (25.0 if i in quoted else 1.0)) for n, o, i in anc if n <= lastn + 0.01]
# speed 1 after "dripping": extra anchors every 10 frames
for n in np.arange(lastn + 10, TOTAL + 1, 10): pts.append((float(n), lasto + (n - lastn), 4.0))
N = TOTAL + 1; LAM = 400.0
rows, cols, vals, rhs, wts = [], [], [], [], []
for r, (n, o, w) in enumerate(pts):
    i0 = min(int(np.floor(n)), N - 2); fr = n - i0
    rows += [r, r]; cols += [i0, i0 + 1]; vals += [1 - fr, fr]; rhs.append(o); wts.append(w)
A = sp.csr_matrix((vals, (rows, cols)), shape=(len(pts), N)); Wm = sp.diags(wts)
D = sp.diags([1.0, -2.0, 1.0], [0, 1, 2], shape=(N - 2, N))
M = (A.T @ Wm @ A + LAM * (D.T @ D)).tolil(); b = A.T @ Wm @ np.array(rhs)
M[0, :] = 0; M[0, 0] = 1; b[0] = 0.0
G = spl.spsolve(M.tocsr().tocsc(), b)
G = np.maximum.accumulate(np.maximum(G, 0))
err = max(abs(np.interp(n, np.arange(N), G) - o) for n, o, w in pts if w > 1.5 and n <= lastn)
spd = np.diff(G)
json.dump({'total': TOTAL, 'cut': -1, 'story': [round(float(x), 3) for x in G[:TOTAL]]}, open('/home/claude/p13/v31/remap.json', 'w'))
# words in story time (for talk.json and the story's own uses) and in output time (captions)
inv = lambda n: float(np.interp(n, np.arange(N), G))
ws = [{'w': w['word'], 's': round(inv(w['start'] * FPS) / FPS, 3), 'e': round(inv(w['end'] * FPS) / FPS, 3)} for w in new]
json.dump(ws, open('/home/claude/p13/v31/words_story.json', 'w'), indent=0)
json.dump([{'w': w['word'], 's': w['start'], 'e': w['end']} for w in new], open('/home/claude/p13/v31/words_out.json', 'w'), indent=0)
print(f'{len(pts)} anchors, total {TOTAL} output frames, story end {G[TOTAL-1]:.1f}; max weighted error {err:.2f} f; speed {spd.min():.3f}-{spd.max():.3f}')
for w in ws:
    if norm(w['w']) in ('haha', 'froze', 'drippy', "you're", 'bucket', 'dripping', 'and', 'old', 'slams', 'yard'): print(w['w'], round(w['s'] * 30, 1), round(w['e'] * 30, 1))
