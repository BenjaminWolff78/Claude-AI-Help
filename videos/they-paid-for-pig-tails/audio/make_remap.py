# Story-frame remap for the re-voiced pig video: output frame (new voice) -> story frame (the animation as built
# for the old voice). Anchors are the word starts both voices share; the dropped phrase ("He's bagged so many,") is
# skipped at the hard cut that already sits there (old frame 986), so nothing jumps on screen. The anchors are
# thinned (Douglas-Peucker, 1.5-frame tolerance) so the animation speed changes smoothly, never word by word.
import json, difflib, re
FPS = 30
old = json.load(open('words.json')); new = json.load(open('words_v3.json'))
norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower())
sm = difflib.SequenceMatcher(a=[norm(w['w']) for w in old], b=[norm(w['w']) for w in new], autojunk=False)
anc = []
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(a1 - a0): anc.append((new[b0 + k]['s'] * FPS, old[a0 + k]['s'] * FPS, old[a0 + k]['w']))
    else: print('unmatched', tag, [w['w'] for w in old[a0:a1]], [w['w'] for w in new[b0:b1]])
# the cut: old shot 10 starts at 986 on "He's"; in the new voice the cut sits 3 frames after "paper." ends and
# shot 10 resumes at the story frame that keeps "the boars" where it was relative to the cut
ip = [i for i, w in enumerate(new) if w['w'] == 'paper.' and w['s'] > 30][0]
CUT_NEW = round(new[ip]['e'] * FPS) + 3
the_new = new[ip + 1]['s'] * FPS; the_old = [w for w in old if norm(w['w']) == 'the' and 1015 <= w['s'] * FPS <= 1030][0]['s'] * FPS
resume_old = the_old - (the_new - CUT_NEW)
def clean(pts):                                                   # strictly increasing in both (a word pair that
    out = []                                                     # the aligner gave the same start is merged)
    for n, o in sorted(pts):
        if out and (n <= out[-1][0] + 0.5 or o <= out[-1][1] + 0.3): continue
        out.append((n, o))
    return out
pre = clean([(n, o) for n, o, _ in anc if n < CUT_NEW - 2]); post = clean([(n, o) for n, o, _ in anc if n > CUT_NEW + 1])
pre.append((CUT_NEW - 1, min(985.0, pre[-1][1] + (CUT_NEW - 1 - pre[-1][0]))))
post.insert(0, (CUT_NEW, resume_old))
def dp(pts, tol):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    best, bi = 0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]; yl = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        if abs(y - yl) > best: best, bi = abs(y - yl), i
    if best <= tol: return [pts[0], pts[-1]]
    return dp(pts[:bi + 1], tol)[:-1] + dp(pts[bi:], tol)
start = [(0.0, 0.0)]
knots = dp(start + pre, 1.5) + dp(post, 1.5)
TOTAL = round(new[-1]['e'] * FPS) + 6
OLD_TOTAL = 1916
lastn, lasto = knots[-1]
knots.append((float(TOTAL), lasto + (TOTAL - lastn)))
# report: speed range and the error at every anchor
def g(n):
    for (a, b), (c, d) in zip(knots, knots[1:]):
        if a <= n <= c: return b + (d - b) * (n - a) / max(1e-9, c - a)
    return knots[-1][1]
err = max(abs(g(n) - o) for n, o, _ in anc if not (CUT_NEW - 2 <= n <= CUT_NEW + 1))
sl = [(d - b) / (c - a) for (a, b), (c, d) in zip(knots, knots[1:]) if c - a > 1]
json.dump({'total': TOTAL, 'cut': CUT_NEW, 'knots': [[round(a, 3), round(b, 3)] for a, b in knots]}, open('remap.json', 'w'))
print(f'{len(knots)} knots, total {TOTAL} frames ({TOTAL/FPS:.2f} s), cut at {CUT_NEW} -> story {resume_old:.1f}; '
      f'max anchor error {err:.2f} f; story speed {min(sl):.3f}-{max(sl):.3f}')

# ---- smooth version: least squares through the anchors with a penalty on speed changes (second differences),
# quoted lines weighted 25x so their lip sync stays within ~1 frame; solved separately before and after the cut
import numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl, sys
LAM = float(sys.argv[1]) if len(sys.argv) > 1 else 400.0
quoted = set()                                                    # the two quoted (lip-synced) lines
toks = [norm(w['w']) for w in new]
for seq in (["grandpa's", 'counting', 'piglets'], ['count', 'the', 'little', 'ones']):
    for i in range(len(toks) - len(seq) + 1):
        if toks[i:i + len(seq)] == seq: quoted.update(round(new[i + k]['s'] * FPS, 2) for k in range(len(seq)))
def solve(pts, n0, n1, fix0=None):
    N = n1 - n0 + 1; rows, cols, vals, rhs, wts = [], [], [], [], []
    for r, (n, o) in enumerate(pts):
        u = n - n0; i0 = min(int(np.floor(u)), N - 2); fr = u - i0
        rows += [r, r]; cols += [i0, i0 + 1]; vals += [1 - fr, fr]; rhs.append(o); wts.append(25.0 if round(n, 2) in quoted else 1.0)
    A = sp.csr_matrix((vals, (rows, cols)), shape=(len(pts), N)); Wm = sp.diags(wts)
    D = sp.diags([1.0, -2.0, 1.0], [0, 1, 2], shape=(N - 2, N))
    M = A.T @ Wm @ A + LAM * (D.T @ D); b = A.T @ Wm @ np.array(rhs)
    if fix0 is not None:                                          # pin the first value (frame 0 -> story 0)
        M = M.tolil(); M[0, :] = 0; M[0, 0] = 1; b[0] = fix0; M = M.tocsr()
    return spl.spsolve(M.tocsc(), b)
xa = solve([(0.0, 0.0)] + pre, 0, CUT_NEW - 1, fix0=0.0)
xb = solve(post, CUT_NEW, TOTAL)
xa = np.minimum(xa, 985.0)
G = np.concatenate([xa, xb])
spd = np.diff(G); spd_a, spd_b = spd[:CUT_NEW - 1], spd[CUT_NEW:]
def gi(n): i = int(np.floor(n)); return G[i] + (G[min(i + 1, len(G) - 1)] - G[i]) * (n - i)
errs = [(abs(gi(n) - o), n, w) for n, o, w in anc if not (CUT_NEW - 2 <= n <= CUT_NEW + 1)]
qerr = max(e for e, n, w in errs if round(n, 2) in quoted)
print(f'LAM {LAM}: anchor error max {max(errs)[0]:.2f} f (p90 {np.percentile([e for e,_,_ in errs], 90):.2f}), quoted max {qerr:.2f} f; '
      f'speed {min(spd_a.min(), spd_b.min()):.3f}-{max(spd_a.max(), spd_b.max()):.3f}; story end {G[-1]:.1f}')
json.dump({'total': TOTAL, 'cut': CUT_NEW, 'story': [round(float(v), 3) for v in G]}, open('remap.json', 'w'))
