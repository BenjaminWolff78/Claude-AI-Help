#!/usr/bin/env python3
"""v18 previz: the nine scene-graph checks (name, landing, lens, whip, shot-edge, framing, picture, blank, action) + the\nhard-fail list (cuts, pop-ins) from the previz QA log + video, for the dentist video (v21).
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

CUTS = [512, 1027, 1424, 1594, 1751]
DISSOLVES = {}
HG = (2.14, 1.15, -8.38); ABOARD = (0.35, 0.6, -4.5); EGG = (-2.75, 1.15, -9.7); BOOK = (-1.45, 1.06, -9.7); DRAWER = (2.6, 0.98, -11.1)
BOARD = (2.6, 1.85, -11.88); TV = (-0.08, 2.15, -6.9); TUB = (80.75, 1.12, -1.0); THERM = (81.45, 1.32, -1.2); WALL = (-3.6, 1.95, -11.9); BLINDS = (4.0, 1.75, 5.42)
NAMES = {
    "hal": [((240, 270), "char", "hal")],
    "vance": [((330, 400), "char", "vance")],
    "slowpoke": [((560, 600), "obj", ABOARD), ((1840, 1880), "char", "hal")],
    "pratt": [((700, 760), "char", "pratt")],
}
PICTURE = [
    (20, "Hal polishes with the minty brush", "char", "hal"), (95, "the cake handed over", "char", "dot"), (180, "the scarf man flinches at the door", "char", "ache1"),
    (215, "the ice pack", "char", "ache2"), (285, "the hourglass flipped", "obj", HG), (410, "Vance's mask drops", "char", "vance"), (490, "two drills", "char", "vance"),
    (590, "DR. SLOWPOKE chalked", "obj", ABOARD), (660, "the egg timer", "obj", EGG), (770, "Pratt screams", "char", "pratt"), (830, "the waiting room empties", "char", "wait2"),
    (925, "Pratt melts", "char", "pratt"), (1010, "the appointment book", "obj", BOOK), (1070, "the bowling team", "char", "bowl1"), (1150, "Vance alone", "char", "vance"),
    (1180, "the Loophole Key", "obj", DRAWER), (1265, "the scream photo pinned", "obj", BOARD), (1320, "the smile photo pinned", "obj", BOARD), (1370, "the TV ending", "obj", TV),
    (1470, "the hand in the 90 s tub", "obj", TUB), (1545, "14 to 15 degrees", "obj", THERM), (1625, "the wall of smiles", "obj", WALL), (1700, "Hal waves", "char", "hal"),
    (1745, "the blinds snap shut", "obj", BLINDS), (1830, "Vance holding a cake", "char", "vanceEnd"),
]
CHAINS = [(112, 160), (330, 380), (512, 580), (1100, 1135), (1158, 1190), (1690, 1740), (1751, 1790)]   # glides / cranes following one move
# closed boxes the camera must never be inside: the cabinets, the desk, the chair, building masses beyond the offices
BOXES = [(1.0, 4.2, 0, 1.1, -11.95, -11.35), (-3.25, -0.85, 0, 1.08, -10.25, -9.45), (-15, -7, 0, 5, -11.5, -5.5), (7, 15, 0, 4.6, -11.5, -5.5), (-16, -7, 0, 4.4, 5.5, 11.5), (7, 18, 0, 5, 5.5, 13.5)]
PUNCH_HOLDS = [(1860, 1900)]   # the ending: Vance with the cake
STRIKES = [(184, 192), (210, 216), (754, 762), (796, 806), (1392, 1398), (1740, 1748), (1462, 1468)]
HOLDS = [(1860, 1900)]
PERCH = []
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


res = {"name": [], "landing": [], "lens": [], "whip": [], "edge": [], "moves": [], "framing": [], "picture": [], "blank": [], "action": [], "pop": [], "cuts": [], "focus": [], "pierce": [], "screen": [], "props": [], "anim": []}
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

# 12 ANIMATION (v20): rig rows [who#i, pos, mode, phase, armR, armL, tilt, headTilt, headBack, propR, propL, propRAng, propK, facing, air, sx, sy, r, sc, front]
import math
HANGA = {1: [[30, 45], [33, 96]], -1: [[-30, 45], [-33, 96]]}
def angs(arm, side):
    a = arm or HANGA[side]; (ex, ey), (hx, hy) = a
    return [math.degrees(math.atan2(ex, ey)), math.degrees(math.atan2(hx - ex, hy - ey))]
def jv(r):
    return angs(r[4], 1) + angs(r[5], -1) + [r[6], r[7], r[8] * 30, r[13] * 40]
STRIKES = globals().get("STRIKES", [])          # (f0, f1) frames marked as a strike / sudden reaction
HOLDS = globals().get("HOLDS", [])              # (f0, f1) punchline holds
PERCH = globals().get("PERCH", [])              # (who-prefix, f0, f1) animals allowed off the ground (held / perched)
ANIMALS = ("rousse", "neige", "hen", "pigeon", "dog", "cat", "goat", "duck", "cow", "pig", "sheep")
marked = lambda f, L: any(a <= f <= b for a, b in L)
prev = {}; still = {}
for f in fs:
    rows = QA[f].get("rig")
    if rows is None: continue
    cutnow = any(abs(f - c) <= 0 for c in CUTS) or f == 0
    cur = {}
    for r in rows:
        who = r[0]; cur[who] = r
        onscr = r[19] and abs(r[15]) < 1.05 and -1.05 < r[16] < 1.1 and r[17] > 0.004
        p = prev.get(who)
        if p and not cutnow:
            ja, jb = jv(p), jv(r)
            d = max(abs(((b - a) + 180) % 360 - 180) for a, b in zip(ja, jb))
            if d > 25 and not marked(f, STRIKES) and onscr: res["anim"].append([f, who, "pose pop %.0f deg" % d])
            for k, side in ((9, "R"), (10, "L")):
                if p[k] != r[k] and onscr and not marked(f, STRIKES):
                    arm0, arm1 = (p[4], r[4]) if side == "R" else (p[5], r[5])
                    moving = arm0 != arm1
                    if not moving and not (p[k] and r[k]): res["anim"].append([f, who, "prop %s %s->%s with a still hand" % (side, p[k], r[k])])
            dx = math.hypot(r[1][0] - p[1][0], r[1][2] - p[1][2])
            walking = r[2] in ("walk", "run", "stride", "sneak", "tiptoe")
            if r[14] == 0 and not who.split("#")[0].startswith(ANIMALS) and onscr:
                if not walking and r[2] not in ("sit",) and dx > 0.012: res["anim"].append([f, who, "foot slide %.3f m/f (%s)" % (dx, r[2])])
                if walking:
                    dph = abs(r[3] - p[3]); dph = min(dph, 1 - dph) if dph <= 1 else dph
                    if dx > 0.012 and dph < 0.01: res["anim"].append([f, who, "walk without steps %.3f m/f" % dx])
            # frozen
            if onscr:
                dj = max(abs(((b - a) + 180) % 360 - 180) for a, b in zip(ja, jb)) + abs(r[3] - p[3]) * 100 + dx * 100
                s0 = still.get(who, [f, 0.0]); s0[1] += dj
                if s0[1] > 1.0: still[who] = [f, 0.0]
                else:
                    still[who] = s0
                    if f - s0[0] >= 30 and not marked(f, HOLDS): res["anim"].append([f, who, "frozen 30 f"]); still[who] = [f, 0.0]
            else: still[who] = [f, 0.0]
        # unheld animal off the ground
        nm = who.split("#")[0]
        if nm.startswith(ANIMALS) and r[14] == 0 and r[2] not in ("air", "hop") and r[1][1] > 0.25 and onscr:
            if not any(nm.startswith(w) and a <= f <= b for w, a, b in PERCH): res["anim"].append([f, who, "animal off the ground y=%.2f" % r[1][1]])
    prev = cur
json.dump(res, open(outp, "w"), indent=1)
print(f"ANIM     {len(res['anim']):4} rows")
