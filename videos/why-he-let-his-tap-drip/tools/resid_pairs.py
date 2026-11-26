"""resid_pairs.py dir f1 f2 ... : the kit's 'animation outside camera move' (mean per-tile best-match SAD, 9 tiles at 360x640)
between each rendered frame f and f+1 (both must exist as dir/fNNNN/*.jpeg). Uses the kit's own tile code."""
import sys, glob, numpy as np
sys.path.insert(0, '/home/claude/untrusted/kit4')
import rickcore as rc
from PIL import Image
def L(d, f):
    p = glob.glob(f'{d}/f{f:04d}/*.jpeg')[0]; im = np.asarray(Image.open(p).convert('RGB').resize((rc.W, rc.H), Image.BILINEAR)); return rc.luma(im)
d = sys.argv[1]; out = []
for f in map(int, sys.argv[2:]):
    a, b = L(d, f), L(d, f + 1); ts = [rc.tile_shift(a, b, x, y) for x, y in rc.TILES]
    r = sum(t['sad'] for t in ts) / len(ts); out.append(r); print(f, round(r, 2), [round(t['sad'], 1) for t in ts])
print('mean', round(float(np.mean(out)), 2))
