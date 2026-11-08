#!/usr/bin/env python3
"""Part 13 camera checks from qa.jsonl (per-frame camera pos/look of the visible shot).
 - sideways share: frames where the camera travels sideways (lateral component of its translation, perpendicular to the
   view direction, >= LAT m/frame) or circles the action (aim point fixed-ish while the view direction turns with
   travel). Push-ins and pure pans/zooms do not count.
 - camera setups: runs of frames between hard cuts / dissolves (a jump of the camera > 0.6 m in one frame, or a shot id
   change). A setup has a REAL MOVE when, over the setup, it travels sideways / cranes / orbits >= 0.6 m or turns its
   view >= 10 deg while travelling >= 0.3 m (a creep-in alone is not a move).
 - place changes from story.ts (set changes between consecutive shot ids) as cut or dissolve (XFADE).
usage: python3 tools/cam_moves.py qa.jsonl [story.ts]"""
import json, math, sys, re
from collections import defaultdict
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
story = open(sys.argv[2] if len(sys.argv) > 2 else "/home/claude/fire/app/src/videos/ice/story.ts").read()
LAT = 0.003
by = defaultdict(list)
for r in rows: by[r["f"]].append(r)
F = sorted(by); P = {f: max(by[f], key=lambda r: r["id"]) for f in F}
sub = lambda a, b: [x - y for x, y in zip(a, b)]
dot = lambda a, b: sum(x * y for x, y in zip(a, b))
L = lambda a: math.sqrt(dot(a, a))
side, setups, cur = 0, [], [F[0]]
stepL = lambda j: L(sub(P[F[j]]["cam"], P[F[j - 1]]["cam"])) if 0 < j < len(F) else 0.0
for i in range(1, len(F)):
    a, b = P[F[i - 1]], P[F[i]]
    t = sub(b["cam"], a["cam"])
    if b["id"] != a["id"] or (L(t) > 0.3 and L(t) > 4 * max(stepL(i - 1), stepL(i + 1), 0.02)):
        setups.append(cur); cur = [F[i]]; continue
    cur.append(F[i])
    d = sub(a["look"], a["cam"]); D = L(d) or 1; u = [x / D for x in d]
    lat = sub(t, [x * dot(t, u) for x in u]); lat_h = math.hypot(lat[0], lat[2])
    if lat_h >= LAT or abs(lat[1]) >= 2 * LAT: side += 1
setups.append(cur)
def move(fs):
    if len(fs) < 2: return 0, 0, 0
    a, b = P[fs[0]], P[fs[-1]]
    trav = 0; turn = 0
    for i in range(1, len(fs)):
        p, q = P[fs[i - 1]], P[fs[i]]; t = sub(q["cam"], p["cam"])
        d = sub(p["look"], p["cam"]); D = L(d) or 1; u = [x / D for x in d]
        trav += L(sub(t, [x * dot(t, u) for x in u]))
        d2 = sub(q["look"], q["cam"]); turn += math.degrees(math.acos(max(-1, min(1, dot(d, d2) / (D * (L(d2) or 1))))))
    return trav, turn, L(sub(b["cam"], a["cam"]))
real = 0
print("setup  frames      dur   sideways+crane m   turn deg   net m   real move")
for fs in setups:
    trav, turn, net = move(fs)
    ok = trav >= 0.6 or (turn >= 10 and net >= 0.3)
    real += ok
    print(f"{P[fs[0]]['id']:>4}  {fs[0]:>5}-{fs[-1]:<5} {len(fs)/30:5.2f}s   {trav:8.2f}         {turn:7.1f}   {net:6.2f}   {'YES' if ok else 'no'}")
print(f"\nreal-move setups: {real}/{len(setups)} = {100*real/len(setups):.0f}%  (need >= 50%)")
print(f"sideways / crane travel frames: {side}/{len(F)} = {100*side/len(F):.0f}%  (need >= 40%)")
shots = re.findall(r"S\((\d+), (\d+), (\w+), \"(\w+)\"", story)
xf = {int(k): int(v) for k, v in re.findall(r"(\d+): (\d+)", story.split("export const XFADE")[1].split(";")[0])}
pc = [(int(b[0]), a[3], b[3], int(b[1])) for a, b in zip(shots, shots[1:])]
mot = 0
print("\nscene changes (place or time):")
for sid, sa, sb, fr in pc:
    kind = "dissolve (motivated)" if xf.get(sid) else "cut"
    mot += bool(xf.get(sid))
    print(f"  {fr:>5}  scene {sid - 1}->{sid}  {sa} -> {sb}: {kind}")
print(f"motivated: {mot}/{len(pc)} = {100*mot/len(pc):.0f}%  (need >= 33%)")
