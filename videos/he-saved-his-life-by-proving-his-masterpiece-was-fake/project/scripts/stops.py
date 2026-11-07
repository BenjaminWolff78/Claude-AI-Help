#!/usr/bin/env python3
"""v10.9 camera stops from qa.jsonl. Per frame: image motion = view rotation + sideways travel seen from the aim distance
converted to px/frame across the 1080 px width (about 44 px per degree at our ~42 deg vertical fov; a straight push-in
scores ~0). A move = motion above TH px/frame (skill: 4); hard cuts and place dissolves split stops.
usage: python3 scripts/stops.py out/t/qa.jsonl [TH_px=4]"""
import json, math, sys, re
from collections import defaultdict
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
PXD = 1080 / 24.4; TH = (float(sys.argv[2]) if len(sys.argv) > 2 else 4.0) / PXD
story = open("src/videos/ice/story.ts").read()
xfade = {int(k): int(v) for k, v in re.findall(r"(\d+): (\d+)", story.split("export const XFADE")[1].split(";")[0])}
by = defaultdict(list)
for r in rows: by[r["f"]].append(r)
F = sorted(by); P = {f: max(by[f], key=lambda r: r["id"]) for f in F}
def sub(a, b): return [x - y for x, y in zip(a, b)]
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def L(a): return math.sqrt(dot(a, a))
def step(j):
    if j < 1 or j >= len(F): return 0.0
    a, b = P[F[j - 1]], P[F[j]]; return L(sub(a["cam"], b["cam"])) + 0.3 * L(sub(a["look"], b["look"]))
mot, brk = [0.0], [True]
for i in range(1, len(F)):
    a, b = P[F[i - 1]], P[F[i]]
    if len(by[F[i]]) > 1 or (b["id"] != a["id"] and xfade.get(b["id"])): mot.append(0); brk.append(True); continue   # dissolve frames are not stops
    sj = step(i)
    if sj > 0.3 and sj > 4 * max(step(i - 1), step(i + 1), 0.02): mot.append(0); brk.append(True); continue
    d0, d1 = sub(a["look"], a["cam"]), sub(b["look"], b["cam"]); D = L(d0) or 1
    rot = math.degrees(math.acos(max(-1, min(1, dot(d0, d1) / (D * (L(d1) or 1))))))
    t = sub(b["cam"], a["cam"]); u = [x / D for x in d0]; lat = sub(t, [x * dot(t, u) for x in u])
    mot.append(rot + math.degrees(math.atan2(L(lat), D))); brk.append(False)
# a burst of motion shorter than 8 frames (an impact kick, a one-frame wobble) is not a relocation: it stays part of the stop
ism = [(mot[i] > TH and not brk[i]) for i in range(len(F))]
i = 0
while i < len(F):
    if ism[i]:
        j = i
        while j < len(F) and ism[j]: j += 1
        if j - i < 8:
            for k in range(i, j): ism[k] = False
        i = j
    else: i += 1
stops, moves, cur, inm, peak, mlen, mpk = [], [], 0, False, 0.0, [], []
for i, f in enumerate(F):
    if brk[i]:
        if cur: stops.append((F[i - cur], cur))
        cur = 0 if len(by[f]) > 1 else 1; inm = False; continue
    if ism[i]:
        peak = max(peak, mot[i])
        if not inm: moves.append(f); mlen.append(0); mpk.append(0.0); inm = True
        mlen[-1] += 1; mpk[-1] = max(mpk[-1], mot[i])
        if cur: stops.append((F[i - cur], cur)); cur = 0
    else: inm = False; cur += 1
if cur: stops.append((F[len(F) - cur], cur))
n = sorted(x for _, x in stops); med = n[len(n) // 2] / 30; short = [(f, x) for f, x in stops if x < 36]
print(f"CAMERA STOPS {len(n)}: median {med:.2f} s (target >= 2), under 1.2 s {len(short)} = {100 * len(short) / len(n):.0f}% (target <= 10%), shortest {n[0] / 30:.2f} s, longest {n[-1] / 30:.2f} s")
print("  stops (start frame: s): " + ", ".join(f"{f}:{x / 30:.1f}" for f, x in stops))
print("  under 1.2 s: " + ", ".join(f"f{f} {x / 30:.2f}s" for f, x in short))
print(f"CAMERA MOVES {len(moves)}: " + ", ".join(f"f{f}({m}f, peak {pk * PXD:.0f}px/f)" for f, m, pk in zip(moves, mlen, mpk)))
print(f"  peak image motion over all moves {peak * PXD:.0f} px/frame (target < 22)")
print("  breaks (hard cuts + dissolves): " + ", ".join(str(F[i]) for i in range(1, len(F)) if brk[i]))
