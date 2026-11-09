#!/usr/bin/env python3
"""Motion audit: is everything on screen moving? Camera-compensated residual motion per tile.

For every frame t we fit an affine camera transform between t and t+K (ECC on a downscaled grey frame), warp, and take
the absolute difference. What is left after the camera is removed is motion of the things themselves (characters,
props, effects). Per tile we track how long it has been since that tile last moved. A "textured" tile (one that holds
something: edges, not flat sky or wall) that stays still longer than STILL frames is reported.

usage: python3 scripts/motion_audit.py video.mp4 out_prefix [K=3] [STILL=36]
writes  out_prefix.txt  (per-segment summary + the worst still regions with timestamps)
        out_prefix.png  (a heat strip: one column per frame, share of textured tiles that are still too long)
"""
import sys, cv2, numpy as np

vid, outp = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 3
STILL = int(sys.argv[4]) if len(sys.argv) > 4 else 36
W, H, T = 270, 480, 30                      # analysis size; tiles of 30 px -> 9 x 16
cap = cv2.VideoCapture(vid)
frames = []
while True:
    ok, fr = cap.read()
    if not ok: break
    frames.append(cv2.cvtColor(cv2.resize(fr, (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY))
n = len(frames)
gy, gx = H // T, W // T
# caption band (55-86% of the height) is masked out: captions move by design and say nothing about the scene
cap_rows = set(r for r in range(gy) if 0.55 * H <= (r + 0.5) * T <= 0.86 * H)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-4)
res = np.zeros((n, gy, gx), np.float32)
tex = np.zeros((n, gy, gx), np.float32)
breaks = np.zeros(n, bool)
for t in range(n - K):
    a, b = frames[t].astype(np.float32), frames[t + K].astype(np.float32)
    g = cv2.GaussianBlur(a, (0, 0), 2.5); gb = cv2.GaussianBlur(b, (0, 0), 2.5)   # 2.5 px kills film grain
    full = np.abs(g - gb).mean()
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(g, gb, warp, cv2.MOTION_AFFINE, crit, None, 5)
        bw = cv2.warpAffine(gb, warp, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    except cv2.error:
        bw = gb
    d = cv2.GaussianBlur(np.abs(g - bw), (0, 0), 1.5)
    if full > 12: breaks[t] = True         # a cut or a dissolve frame: no stillness counting across it
    lap = np.abs(cv2.Laplacian(g, cv2.CV_32F))
    for r in range(gy):
        for c in range(gx):
            sl = (slice(r * T, (r + 1) * T), slice(c * T, (c + 1) * T))
            res[t, r, c] = np.percentile(d[sl], 90)
            tex[t, r, c] = lap[sl].mean()
MOVE, TEX = 6.0, 1.2                       # residual (0-255) that counts as motion; texture that counts as "something there"
since = np.zeros((gy, gx), np.int32)
stillfrac = np.zeros(n)
worst = []                                  # (frame, row, col, run)
OV = int(sys.argv[5]) if len(sys.argv) > 5 else 0; ovs = []
for t in range(n - K):
    if breaks[t]: since[:] = 0; continue
    mv = res[t] > MOVE
    since = np.where(mv, 0, since + 1)
    texd = tex[t] > TEX
    for r in cap_rows: texd[r, :] = False
    long_ = (since > STILL) & texd
    stillfrac[t] = long_.sum() / max(1, texd.sum())
    for r, c in zip(*np.nonzero(long_ & (since == STILL + 1))): worst.append((t - STILL, r, c))
    if OV and t % OV == 0:
        col = cv2.cvtColor(frames[t], cv2.COLOR_GRAY2BGR)
        for r, c in zip(*np.nonzero(long_)): cv2.rectangle(col, (c * T + 1, r * T + 1), ((c + 1) * T - 2, (r + 1) * T - 2), (40, 40, 255), 2)
        cv2.putText(col, f"f{t} {stillfrac[t]:.0%}", (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        ovs.append(col)
# runs of still tiles, merged per region and time
lines = [f"MOTION AUDIT {vid}  frames {n}  K={K}  still>{STILL}f  move>{MOVE}  textured>{TEX}"]
thirds = [stillfrac[i * n // 3:(i + 1) * n // 3] for i in range(3)]
lines.append("share of textured tiles still > %d f, mean per third: %s" % (STILL, ", ".join(f"{x.mean():.1%}" for x in thirds)))
lines.append("frames where > 25%% of textured tiles are still: %d (%.0f%%)" % ((stillfrac > 0.25).sum(), 100 * (stillfrac > 0.25).mean()))
# segment table (one row per 1 s)
lines.append("per second: still share (textured tiles idle > %d f)" % STILL)
for s0 in range(0, n, 30):
    seg = stillfrac[s0:s0 + 30]
    lines.append(f"  {s0 / 30:5.1f}s f{s0:5d}  {seg.mean():5.1%}  {'#' * int(seg.mean() * 40)}")
# where: which screen rows / cols go still, grouped by start second
from collections import defaultdict
grp = defaultdict(list)
for t0, r, c in worst: grp[t0 // 15].append((r, c))
lines.append("still regions (start frame: tiles row,col; row 0 = top, 16 rows; col 0 = left, 9 cols)")
for k in sorted(grp):
    tl = grp[k]
    if len(tl) < 3: continue
    rows = sorted(set(r for r, _ in tl)); cols = sorted(set(c for _, c in tl))
    lines.append(f"  f{k * 15:5d} ({k * 0.5:5.1f}s): {len(tl):3d} tiles, rows {rows[0]}-{rows[-1]}, cols {cols[0]}-{cols[-1]}")
open(outp + ".txt", "w").write("\n".join(lines) + "\n")
# heat strip
img = np.zeros((60, n, 3), np.uint8)
for t in range(n):
    h = int(stillfrac[t] * 60)
    img[60 - h:, t] = (60, 60, 230) if stillfrac[t] > 0.25 else (80, 200, 80)
    if breaks[t]: img[:, t] = (200, 200, 200)
cv2.imwrite(outp + ".png", cv2.resize(img, (min(1930, n), 120), interpolation=cv2.INTER_NEAREST))
np.save(outp + "_still.npy", stillfrac)
if ovs:
    for i in range(0, len(ovs), 12):
        row = ovs[i:i + 12]
        while len(row) < 12: row.append(np.zeros_like(ovs[0]))
        cv2.imwrite(f"{outp}_ov{i // 12}.jpg", np.vstack([np.hstack(row[:6]), np.hstack(row[6:])]))
print("\n".join(lines[:4]))
