#!/usr/bin/env python3
"""v18 previz: the nine scene-graph checks (name, landing, lens, whip, shot-edge, framing, picture, blank, action) + the\nhard-fail list (cuts, pop-ins) from the previz QA log + video, for the library video.
usage: python3 sg_checks.py <previz_dir> <words.json> <out.json>
The QA log (one JSON line per frame, inputProps.qa) gives the camera, the cast's head/feet on screen (cast2), the centre
ray hit (cray) and the 9-ray lens test on the subject (occ9). Story objects are world points listed below."""
import json, sys, glob, math, os, subprocess
import numpy as np

pdir, wpath, outp = sys.argv[1], sys.argv[2], sys.argv[3]
QA = {}
for fn in sorted(glob.glob(os.path.join(pdir, "qa_*.jsonl"))):
    for ln in open(fn):
        ln = ln.strip()
        if ln:
            try:
                d = json.loads(ln); QA[d["f"]] = d
            except Exception:
                pass
words = json.load(open(wpath)); words = words["words"] if isinstance(words, dict) else words
W = [(round((w.get("start", w.get("s"))) * 30), (w.get("word", w.get("w")) or "").strip(".,:;!?\"'").lower()) for w in words]

CUTS = [638, 787, 1034, 1498]
DISSOLVES = {}
TX2, TZ2 = -9.35, -1.75
LOCK = (-9.48, 1.16, -12.98); SCALE = (-7.4, 0.72, -9.6); READ = (TX2 - 1.7, 1.75, TZ2 - 1.2); HOPPER = (TX2 - 0.4, 2.7, TZ2)
NAMES = {
    "hens": [((30, 60), "char", "odile")],
    "mayor": [((270, 300), "char", "odile")],
    "bruno": [((360, 380), "char", "bruno"), ((710, 730), "char", "bruno"), ((970, 990), "char", "bruno"), ((1500, 1520), "char", "bruno")],
    "cluck": [((610, 640), "obj", (-4.35, 0.6, 6.05)), ((1610, 1630), "char", "odile")],
}
PICTURE = [
    (20, "the hen in Odile's hands", "char", "odile"), (90, "the NO EATING tag", "char", "luc"), (160, "the TONS readout", "obj", READ),
    (240, "the food third into the hopper", "obj", HOPPER), (330, "Odile and her cart", "char", "odile"), (400, "Bruno laughs on the horn", "char", "bruno"),
    (500, "Bruno's finger and the hen", "char", "bruno"), (620, "MAYOR CLUCK board", "obj", (-4.35, 0.6, 6.05)), (700, "the heaped truck", "obj", (-8.0, 3.0, TZ2)),
    (760, "Odile raises her cup", "char", "odile"), (820, "the hens at the bin", "char", "neige"), (900, "the bin flies", "char", "bruno"),
    (1010, "one finger", "char", "bruno"), (1040, "the key in the coop lock", "obj", LOCK), (1110, "150 g on the scale", "obj", SCALE),
    (1200, "the bowl of scraps", "obj", SCALE), (1285, "the caddy tipped", "char", "luc"), (1365, "the egg", "char", "zoe"),
    (1420, "the pledge", "char", "odile"), (1470, "Luc hangs up the pan", "char", "luc"), (1600, "Bruno begging", "char", "bruno"),
]
# CHECK 10 SCREEN TIME chains (one moving thing followed across short shots): none planned in this video
CHAINS = [(880, 948)]   # the light bin: the camera tilts up with it and back down (one moving thing)
# CHECK 11 closed boxes the camera must never be inside (x0, x1, y0, y1, z0, z1): cottages, café, town hall, coop, crate, walls
BOXES = [(-34, -18, 0, 4.6, -15, -8), (-18, -12, 0, 4.4, -15, -8), (-4, 34, 0, 4.8, -15, -8), (-10, -2, 0, 5.2, 9, 15), (6, 20, 0, 7, 10, 18), (-10.35, -8.85, 0.5, 1.6, -14.15, -13.05), (-7.75, -7.05, 0.12, 0.62, -9.85, -9.35)]
PUNCH_HOLDS = [(1600, 1650)]   # the ending: Bruno beaming with the hen on his head
def proj(d, p):
    P, L, fov = np.array(d["cam"]), np.array(d["look"]), d.get("fov", 50)
    fw = L - P; fw /= np.linalg.norm(fw); rt = np.cross(fw, [0, 1, 0]); rt /= np.linalg.norm(rt); up = np.cross(rt, fw)
    v = np.array(p) - P; dep = v @ fw
    if dep <= 0.05: return None
    t = math.tan(math.radians(fov) / 2)
    return (v @ rt) / (dep * t * 9 / 16), (v @ up) / (dep * t), dep


def char_ok(d, who):
    for c in d.get("cast2", []):
        if c[0] == who:
            _, x, y, fy, r, dep = c
            if dep <= 0: return False, "behind the lens"
            inside = (x - 0.6 * r > -1) and (x + 0.6 * r < 1) and y < 0.97
            above = y > -0.04
            big = r >= 0.05
            if not inside: return False, f"head off the edge (x {x:.2f}, r {r:.2f})"
            if not above: return False, f"head in/below the caption band (y {y:.2f})"
            if not big: return False, f"too small (head {100 * r:.0f}% of the width)"
            return True, f"head {100 * r:.0f}% at ({50 + 50 * x:.0f}%, {50 - 50 * y:.0f}%)"
    return False, "not in the cast"


def obj_ok(d, p):
    q = proj(d, p)
    if q is None: return False, "behind the lens"
    x, y, dep = q
    if abs(x) > 0.85 or abs(y) > 0.95: return False, f"off frame ({50 + 50 * x:.0f}%, {50 - 50 * y:.0f}%)"
    if -0.28 < y < -0.04: return True, f"in the caption band ({50 + 50 * x:.0f}%, {50 - 50 * y:.0f}%) - check it reads"
    return True, f"at ({50 + 50 * x:.0f}%, {50 - 50 * y:.0f}%)"


res = {"name": [], "landing": [], "lens": [], "whip": [], "edge": [], "moves": [], "framing": [], "picture": [], "blank": [], "action": [], "pop": [], "cuts": [], "focus": [], "pierce": [], "screen": [], "props": []}
# 1 NAME
for f0, w in W:
    for (a, b), kind, tgt in NAMES.get(w, []):
        if a <= f0 <= b:
            d = QA.get(f0)
            if not d: res["name"].append([f0, w, "no QA frame"]); continue
            ok, why = char_ok(d, tgt) if kind == "char" else obj_ok(d, tgt)
            res["name"].append([f0, w, "OK" if ok else "HIT", why])
# camera motion per frame -> moves (shot changes) and whip frames
fs = sorted(QA)
ang, spd = {}, {}
for i in range(1, len(fs)):
    a, b = QA[fs[i - 1]], QA[fs[i]]
    if fs[i] - fs[i - 1] != 1: continue
    da = np.array(a["look"]) - np.array(a["cam"]); db = np.array(b["look"]) - np.array(b["cam"])
    c = float(np.clip(da @ db / np.linalg.norm(da) / np.linalg.norm(db), -1, 1))
    ang[fs[i]] = math.degrees(math.acos(c)); spd[fs[i]] = float(np.linalg.norm(np.array(b["cam"]) - np.array(a["cam"])))
fast = {f for f in ang if (ang[f] > 0.9 or spd[f] > 0.06) and f not in CUTS}
# group fast frames into moves
mv, cur = [], []
for f in sorted(fast):
    if cur and f - cur[-1] > 2: mv.append(cur); cur = []
    cur.append(f)
if cur: mv.append(cur)
for m in mv:
    s0, s1 = m[0], m[-1]; res["moves"].append([s0, s1, round(max(ang.get(f, 0) for f in m), 2), round(max(spd.get(f, 0) for f in m), 3)])
    # 2 LANDING: the frame after the move ends shows the subject
    land = s1 + 1; d = QA.get(land)
    if d and d.get("subj"):
        ok, why = char_ok(d, d["subj"]); res["landing"].append([land, d["subj"], "OK" if ok else "HIT", why])
    elif d:
        res["landing"].append([land, "(object)", "CHECK", "no character subject: check the still"])
    # 4 WHIP: centre ray on every in-between frame
    for f in m:
        d = QA.get(f)
        if not d or (ang.get(f, 0) < 2.0 and spd.get(f, 0) < 0.15): continue   # whip / fast-move frames only
        dist, name = d.get("cray", [99, ""])
        P0, L0 = np.array(d["cam"]), np.array(d["look"]); dv = (L0 - P0) / np.linalg.norm(L0 - P0); hy = P0[1] + dv[1] * dist
        if hy < 0.08: continue   # the centre ray lands on the ground: not an obstacle
        if dist < 3.0 and not any(k in (name or "") for k in ("card", "fig", "cast", "actor")):
            res["whip"].append([f, round(dist, 2), name])
for c in CUTS:
    d = QA.get(c + 1)
    if d and d.get("subj"):
        ok, why = char_ok(d, d["subj"]); res["landing"].append([c, d["subj"] + " (cut)", "OK" if ok else "HIT", why])
# 3 LENS: rays to the subject; near-lens; foreground share is checked on stills
for f in fs:
    d = QA[f]
    occ = [o for o in d.get("occ9", []) if o.split(":")[0] in ("1.3", "1.62")]   # head rays only (a body behind a bench or bar is staging)
    if occ: res["lens"].append([f, d.get("subj"), "rays blocked: " + ", ".join(occ[:3])])
    if d.get("near", 0) > 0: res["lens"].append([f, d.get("subj"), f"something within 0.35 m of the lens ({d['near']} rays)"])
# 5 SHOT-EDGE: brightness jumps at the first 2 / last 2 frames of every shot, from the previz video
vids = sorted(glob.glob(os.path.join(pdir, "p_*.mp4")))
means = {}
for v in vids:
    a0 = int(os.path.basename(v)[2:6])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-f", "rawvideo", "-pix_fmt", "gray", "-s", "135x240", "-"], capture_output=True).stdout
    arr = np.frombuffer(raw, np.uint8).reshape(-1, 240, 135)
    for k, fr in enumerate(arr): means[a0 + k] = float(fr.mean())
bounds = sorted(set(CUTS) | set(DISSOLVES) | {m[0] for m in mv} | {m[-1] + 1 for m in mv})
for s in bounds:
    for f in (s - 2, s - 1, s, s + 1):
        if f in means and f + 1 in means and f not in (c - 1 for c in CUTS):
            m0, m1 = means[f], means[f + 1]
            if abs(m1 - m0) / max(m1, m0, 1) > 0.2: res["edge"].append([f, f + 1, round(m0), round(m1), "brightness jump > 20%"])
# WRONG FOCUS TARGET: focus more than 0.5 m off the subject's head for 8+ frames outside camera moves
movef = set(f for m in mv for f in range(m[0] - 4, m[-1] + 6))
def runs_of(pred):
    out, a, last = [], None, None
    for f in fs:
        if pred(f):
            if a is None: a = f
            last = f
        elif a is not None: out.append((a, last)); a = None
    if a is not None: out.append((a, last))
    return out
for a, b in runs_of(lambda f: QA[f].get("focusErr", 0) > 0.5 and f not in movef):
    if b - a >= 7: res["focus"].append([a, b, QA[a].get("subj"), "focus off the subject by up to %.2f m" % max(QA[f]["focusErr"] for f in range(a, b + 1) if f in QA)])
for a, b in runs_of(lambda f: bool(QA[f].get("pierce"))):
    res["pierce"].append([a, b, sorted(set(x for f in range(a, b + 1) if f in QA for x in QA[f]["pierce"]))[:4]])
# 6 FRAMING: head-on-head (two heads overlapping on screen) and the subject's head clipped by the frame
for f in fs:
    d = QA[f]; cs = [c for c in d.get("cast2", []) if c[5] > 0]
    for i in range(len(cs)):
        for j in range(i + 1, len(cs)):
            a, b = cs[i], cs[j]
            if math.hypot((a[1] - b[1]) * 9 / 16, a[2] - b[2]) < 0.7 * (a[4] + b[4]) * 9 / 16 and min(a[4], b[4]) > 0.04:
                res["framing"].append([f, a[0] + "/" + b[0], "head on head"])
    if d.get("subj"):
        ok, why = char_ok(d, d["subj"])
        if not ok and "not in the cast" not in why: res["framing"].append([f, d["subj"], why])
# 7 PICTURE: the picture-sentence object on screen at its word
for f0, label, kind, tgt in PICTURE:
    d = QA.get(f0)
    if not d: res["picture"].append([f0, label, "no QA frame"]); continue
    ok, why = char_ok(d, tgt) if kind == "char" else obj_ok(d, tgt)
    res["picture"].append([f0, label, "OK" if ok else "HIT", why])
# 8 BLANK: white-out / black-out frames
for f, m in sorted(means.items()):
    if m < 18 or m > 238: res["blank"].append([f, round(m), "black-out" if m < 18 else "white-out"])
# POP-IN: a cast member appearing mid-frame (not at an edge, not at a cut / dissolve)
prev = {}
for f in fs:
    cur = {c[0]: c for c in QA[f].get("cast2", []) if c[5] > 0 and abs(c[1]) < 1.1}
    near_cut = any(abs(f - c) <= 1 for c in CUTS) or any(abs(f - s) <= DISSOLVES[s] for s in DISSOLVES)
    if prev and not near_cut:
        for w, c in cur.items():
            if w not in prev and abs(c[1]) < 0.75 and c[4] > 0.05: res["pop"].append([f, w, f"appears at x {c[1]:.2f}"])
    prev = cur
# HARD CUTS: count and spacing
res["cuts"] = [len(CUTS), min(b - a for a, b in zip(CUTS, CUTS[1:])) if len(CUTS) > 1 else 999]
# 9 ACTION: no 1.5 s stretch without visible change (frame-to-frame motion from the previz video), except punchline holds
mot = {}
for v in vids:
    a0 = int(os.path.basename(v)[2:6])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-f", "rawvideo", "-pix_fmt", "gray", "-s", "54x96", "-"], capture_output=True).stdout
    arr = np.frombuffer(raw, np.uint8).reshape(-1, 96, 54).astype(np.float32)
    for k in range(1, len(arr)): mot[a0 + k] = float(np.abs(arr[k] - arr[k - 1]).mean())
quiet = [f for f in sorted(mot) if mot[f] < 0.35]
run0 = None
for i, f in enumerate(quiet + [10 ** 9]):
    if run0 is None: run0 = last = f; continue
    if f == last + 1: last = f; continue
    if last - run0 >= 45 and not any(a <= run0 and last <= b for a, b in PUNCH_HOLDS): res["action"].append([run0, last, "no visible change for %.1f s" % ((last - run0 + 1) / 30)])
    run0 = last = f
vals = np.array(list(mot.values())) if mot else np.zeros(1)
res["motion"] = {"median": round(float(np.median(vals)), 2), "p10": round(float(np.percentile(vals, 10)), 2)}
json.dump(res, open(outp, "w"), indent=1)
for k in ("name", "landing", "lens", "whip", "edge", "framing", "picture", "blank", "action", "pop", "focus", "pierce"):
    hits = [r for r in res[k] if (k not in ("name", "landing", "picture")) or r[2] != "OK"]
    print(f"{k.upper():8} {len(res[k]):4} rows, {len(hits)} hits")
print("moves", len(res["moves"]), "| hard cuts", res["cuts"][0], "min gap", res["cuts"][1], "f | previz motion", res["motion"])

# 10 SCREEN TIME: shots between shot changes (cuts + fast moves); a shot under 1.5 s is a hit unless inside a CHAIN;
# a character on screen (head >= 5% wide, inside the frame) for under 1 s outside camera moves is a hit
chg = sorted(set(CUTS) | {m[0] for m in mv})
segs = []
prev_end = 0
for m in mv: pass
edges = sorted(set([0, max(fs) + 1] + list(CUTS) + [m[0] for m in mv] + [m[-1] + 1 for m in mv]))
for a, b in zip(edges, edges[1:]):
    inmove = any(m[0] <= a <= m[-1] for m in mv)
    if inmove: continue
    dur = (b - a) / 30
    if dur < 1.5 and not any(c0 <= a < c1 for c0, c1 in CHAINS): res["screen"].append([a, b, round(dur, 2), "hold shorter than 1.5 s"])
seen = {}
for f in fs:
    if f in movef: continue
    for c in QA[f].get("cast2", []):
        if c[5] > 0 and abs(c[1]) < 0.95 and c[4] >= 0.05 and -0.3 < c[2] < 0.97: seen.setdefault(c[0], []).append(f)
for who, frs in seen.items():
    run0 = last = frs[0]
    for f in frs[1:] + [10 ** 9]:
        if f - last <= 2: last = f; continue
        if last - run0 + 1 < 30 and not any(abs(run0 - c) <= 2 or abs(last - c) <= 2 for c in CUTS): res["screen"].append([run0, last, who, "on screen %.2f s outside a move" % ((last - run0 + 1) / 30)])
        run0 = last = f
# 11 PROPS: the camera inside a closed box (scripted); held props are drawn on the hand by construction (fig.ts drawProp),
# prop-through-face is checked on the contact sheet of the prop-at-head frames
for f in fs:
    p = QA[f]["cam"]
    for x0, x1, y0, y1, z0, z1 in BOXES:
        if x0 < p[0] < x1 and y0 < p[1] < y1 and z0 < p[2] < z1: res["props"].append([f, "camera inside a closed box", [x0, x1, z0, z1]]); break
json.dump(res, open(outp, "w"), indent=1)
print(f"SCREEN   {len(res['screen']):4} rows | PROPS {len(res['props']):4} rows")
