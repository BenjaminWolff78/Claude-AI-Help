#!/usr/bin/env python3
"""v14 STEP 6 previz: the five scene-graph checks (name, landing, lens, whip, shot-edge) from the previz QA log + video.
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

CUTS = [618, 919, 1103, 1181]
DISSOLVES = {480: 8, 1049: 8, 1415: 8, 1713: 8}

# named characters and story objects, by the word's frame (characters by cast name; objects by world point)
NAMES = {  # word -> list of (frame window, kind, target)
    "brick": [((0, 100), "obj", (-0.3, 0.95, 0.08))],
    "amos": [((240, 260), "char", "amos"), ((780, 800), "char", "amos"), ((860, 870), "char", "amos")],
    "amos's": [((510, 530), "char", "amos"), ((1820, 1830), "char", "amos")],
    "clay": [((265, 280), "obj", (0.18, 0.95, 0.06)), ((1240, 1270), "obj", (-0.34, 1.0, 0.2))],
    "moulds": [((280, 292), "obj", (0.18, 0.95, 0.06))],
    "guy": [((320, 330), "char", "silas")],
    "shovel": [((355, 365), "char", "silas")],
    "loaves": [((530, 545), "char", "amos"), ((1085, 1095), "char", "amos"), ((1834, 1845), "obj", (-16.5, 1.5, -4.9))],
    "builders": [((665, 675), "char", "bld2"), ((1068, 1078), "char", "bld1")],
    "taxman": [((710, 720), "char", "tax")],
    "taxman's": [((1125, 1135), "char", "tax"), ((1725, 1735), "char", "tax")],
    "loaf": [((745, 752), "obj", (-0.5, 0.8, 2.7))],
    "ledger": [((845, 852), "char", "tax"), ((1140, 1150), "obj", (0.0, 0.84, -0.55))],
    "builder": [((936, 944), "char", "ned")],
    "wall": [((970, 978), "obj", (19.2, 0.7, -6.2)), ((1285, 1295), "obj", (0.3, 0.96, -0.05))],
    "tea's": [((1014, 1022), "obj", (19.0, 0.95, -4.75))],
    "bricks": [((1220, 1228), "obj", (0.3, 0.96, -0.05))],
    "tax.": [], "tax": [((1396, 1404), "obj", (0.41, 0.95, 0.25))],
    "penny": [((1446, 1454), "obj", (-0.15, 1.115, -1.72))],
    "mug": [((1510, 1518), "obj", (0.0, 1.35, -1.95))],
    "law": [((1546, 1552), "obj", (1.2, 1.15, -1.95))],
    "parliament": [((1614, 1622), "char", "crier")],
    "three": [((1660, 1668), "obj", (3.95, 1.55, -0.3))],
    "house": [((1757, 1765), "obj", (-16.8, 3.0, -4.9))],
}


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


res = {"name": [], "landing": [], "lens": [], "whip": [], "edge": [], "moves": []}
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
json.dump(res, open(outp, "w"), indent=1)
for k in ("name", "landing", "lens", "whip", "edge"):
    hits = [r for r in res[k] if (k not in ("name", "landing")) or r[2] != "OK"]
    print(f"{k.upper():8} {len(res[k]):4} rows, {len(hits)} hits")
print("moves", len(res["moves"]))
