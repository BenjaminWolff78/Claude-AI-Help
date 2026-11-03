#!/usr/bin/env python3
"""Camera / staging QA from the per-frame log of scripts/qa_run.mjs (v10.4 fix 9).
usage: python3 scripts/qa_report.py out/t/qa.jsonl [--quiet]
Prints: hard cuts, longest dissolve, camera translation share, hero centred+frontal share, and every frame with an
occluder between camera and subject (incl. camera inside an object), a near-plane hit, the subject out of frame, or
overlapping bodies, grouped into runs."""
import json, sys, math, re
from collections import defaultdict

rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
quiet = "--quiet" in sys.argv
story = open("src/videos/ice/story.ts").read()
xfade = {int(k): int(v) for k, v in re.findall(r"(\d+): (\d+)", story.split("export const XFADE")[1].split(";")[0])}
by_f = defaultdict(list)
for r in rows: by_f[r["f"]].append(r)
F = sorted(by_f)
# primary row per frame: the newest shot (incoming layer during a dissolve)
prim = {f: max(by_f[f], key=lambda r: r["id"]) for f in F}

def dist(a, b): return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))
cuts, trans, frontal, fast = [], 0, 0, []
for i in range(1, len(F)):
    a, b = prim[F[i - 1]], prim[F[i]]
    dp, dl = dist(a["cam"], b["cam"]), dist(a["look"], b["look"])
    if b["id"] != a["id"] and xfade.get(b["id"]):
        continue  # place change by dissolve
    # a cut = a one-frame jump far bigger than the motion on the frames either side (fast glides are not cuts)
    def step(j):
        if j < 1 or j >= len(F): return 0.0
        return dist(prim[F[j - 1]]["cam"], prim[F[j]]["cam"]) + 0.3 * dist(prim[F[j - 1]]["look"], prim[F[j]]["look"])
    sj = step(i)
    if sj > 0.3 and sj > 4 * max(step(i - 1), step(i + 1), 0.02):
        cuts.append((F[i], a["id"], b["id"], round(dp, 2)))
    if dp > 0.4: fast.append((F[i], b["id"], round(dp, 2)))
    # translation: camera moves sideways/up (not only along its view axis) or its aim travels
    v = [y - x for x, y in zip(a["cam"], b["cam"])]
    d = [y - x for x, y in zip(a["cam"], a["look"])]; L = math.sqrt(sum(x * x for x in d)) or 1; d = [x / L for x in d]
    along = sum(x * y for x, y in zip(v, d)); lat = math.sqrt(max(0.0, sum(x * x for x in v) - along * along))
    if lat > 0.0015 or dl > 0.003: trans += 1
for f in F:
    if prim[f]["frontal"]: frontal += 1
n = len(F)
print(f"frames {n}")
print(f"HARD CUTS {len(cuts)} (target <= 4): " + ", ".join(f"f{f} S{x}->S{y} ({d} m)" for f, x, y, d in cuts))
print(f"FAST CAMERA (> 0.4 m/frame) {len(fast)} frames: " + ", ".join(f"f{f}" for f, _, _ in fast[:30]))
print(f"LONGEST DISSOLVE {max(xfade.values())} f (target <= 8): {xfade}")
print(f"CAMERA TRANSLATION {100 * trans / max(1, n - 1):.0f}% of frames (target >= 50%)")
print(f"HERO CENTRED + FRONTAL {100 * frontal / n:.0f}% of runtime (target <= 30%)")

def runs(pred, label, show):
    out, cur = [], None
    for f in F:
        hit = [r for r in by_f[f] if pred(r)]
        if hit:
            if cur and f == cur[1] + 1: cur[1] = f; cur[2].update(show(h) for h in hit)
            else:
                if cur: out.append(cur)
                cur = [f, f, set(show(h) for h in hit)]
    if cur: out.append(cur)
    print(f"{label}: {sum(b - a + 1 for a, b, _ in out)} frames in {len(out)} runs")
    if not quiet:
        for a, b, s in out[:40]: print(f"   f{a}-{b} ({a / 30:.2f}-{b / 30:.2f}s): " + "; ".join(sorted(s))[:200])
    return out
runs(lambda r: r["occ"], "OCCLUDER BETWEEN CAMERA AND SUBJECT (incl. camera inside an object)", lambda r: f"S{r['id']} " + ",".join(r["occ"]))
runs(lambda r: r["near"] >= 2, "SOMETHING TOUCHING THE LENS (near-plane)", lambda r: f"S{r['id']} near={r['near']}")
runs(lambda r: not r["inFrame"], "SUBJECT OUT OF FRAME", lambda r: f"S{r['id']} head ndc ({r['hx']},{r['hy']})")
runs(lambda r: r.get("cut"), "FACE CUT BY THE FRAME EDGE", lambda r: f"S{r['id']} " + ",".join(r["cut"]))
runs(lambda r: r["over"], "OVERLAPPING BODIES", lambda r: f"S{r['id']} " + ",".join(r["over"]))
