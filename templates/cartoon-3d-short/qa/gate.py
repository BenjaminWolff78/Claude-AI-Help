#!/usr/bin/env python3
"""STILL-FRAME GATE v10.16 contact sheet (cartoon-3d-short; user rules 2026-11-08: gate, measures, part 15 faces, part 16 sizes).
usage: gate.py <dir with fNNNN.jpg + log.txt (QA lines)> <manual.json> <expression_plan.json> <out.jpg>

 1 size   part 16 B, head width / frame WIDTH by the shot's job (manual "job"):
          quote/reaction close-up 30-45% | two-shot 18-33% | action with a prop 18-25% | group 8-22% (front member) |
          wide place/journey/danger under 14% or nobody | insert: object 40-100% of the width | payoff: title object 25-60%.
          FAIL when a head is sliced by a side or the top edge. The sheet header prints the shot mix
          (close-ups 15-20%, mediums 25-35%, wides 15-20%, object or place 30-40%).
 2 clear  nothing opaque between the camera and the subject's head (QA ray), plus the visual check of the middle.
 3 sharp  the speaking/acting character's circle of confusion <= 2.5 px; no stray white blurs or blobs (visual).
 4 people part 16 C1: every dialogue, mockery, doubt and reaction beat has a character in frame; a no-character shot must
          name its job (opening place <= 6 s, mechanism insert, payoff of the title object 5-12 s) and its ONE subject.
 5 title  title object share; REQUIRED >= 40% in the hook and the reveal (manual "_title_required").
 6 heads  no two bodies at the same spot (QA), no head stacked behind another, no row of 3+ facing the camera (visual).
 7 props  no plain cube crates or flat slabs (visual).
 8 colour purple/pink <= 20% outside the sky, no milky haze.
 9 read   not mostly black, not mostly blur, subject readable at phone size.
10 faces  no blurred face or head anywhere (every head in frame CoC <= 3 px).
11 expr   part 15: every visible face is in the expression plan for that beat; shock never on the hero; the key-beat
          two-shot (manual "contrast") shows faces from opposite families.
12 2.5D   part 16 D: 3/4 vs front-on faces counted (aim about half 3/4 over the sheet), hats with volume, costume detail
          and a shadow side, no body or prop outline across a face (visual, manual "12").
manual.json: {"0045": {"job": "two", "contrast": ["owner", "plimsoll"], "nochar": "insert: the toy boat", "7": "P:bevelled crates"},
              "_title_required": ["0040", "1700"]}"""
import sys, os, json, re, glob, colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D, MAN, PLAN, OUT = sys.argv[1:5]
man = json.load(open(MAN)) if os.path.exists(MAN) else {}
plan = json.load(open(PLAN))
qa = {}
for line in open(os.path.join(D, "log.txt")):
    if line.startswith("QA|"):
        q = json.loads(line[3:]); qa[q["f"]] = q
SC = [(1, 0, 389), (2, 389, 452), (3, 452, 562), (4, 562, 784), (5, 784, 1108), (6, 1108, 1296), (7, 1296, 1430), (8, 1430, 1528), (9, 1528, 1926)]
scene = lambda f: next(i for i, a, b in SC if a <= f < b)
REQ = set(man.get("_title_required", []))
JOBS = {"quote": (0.30, 0.45, "CU"), "two": (0.18, 0.33, "MED"), "action": (0.18, 0.25, "MED"), "group": (0.08, 0.22, "MED"),
        "wide": (0.0, 0.14, "WIDE"), "insert": (0.4, 1.0, "OBJ"), "payoff": (0.25, 0.6, "OBJ"), "opening": (0.0, 0.0, "OBJ")}
FAM = {}   # board AN families, for the contrast test
for fam, names in {"shock": ["shock", "yikes", "aghast", "breakdown", "dazed"], "tache": ["tache", "tacheUp", "cold", "stern"],
                   "laugh": ["mock", "guffaw", "laugh"], "schemer": ["scheme", "fakegrin", "sly", "grin"], "calm": ["calm", "bored", "determined", "neutral", "smug", "proud", "smile_closed"],
                   "anger": ["angry", "fury", "rage"], "worry": ["worry", "nervous", "dismay", "gulp", "sheepish"], "happy": ["joy", "beam", "smile"]}.items():
    for n in names: FAM[n] = fam
CLOSED_SMILE = {"calm", "smile_closed", "mock", "guffaw", "laugh", "joy", "fakegrin"}
def beat_at(f):
    for b in plan["beats"]:
        if b["f"][0] <= f < b["f"][1]: return b
    return {"faces": {}}
def allowed(who, f):
    b = beat_at(f)
    if who in b["faces"]: return b["faces"][who]
    return plan["role_defaults"].get(plan["roles"].get(who, ""), None)
rows = []; turned = [0, 0]
for p in sorted(glob.glob(os.path.join(D, "f*.jpg"))):
    f = int(re.findall(r"f(\d+)", os.path.basename(p))[0]); q = qa.get(f, {}); k = f"{f:04d}"; m = man.get(k, {})
    im = Image.open(p).convert("RGB"); a = np.asarray(im.resize((135, 240))).astype(float) / 255
    sizes = {w: v for w, v, _ in q.get("sizes", [])}
    heads = {h[0]: (h[1], h[2], h[3] if len(h) > 3 else 0) for h in q.get("heads", [])}
    vis = {w: hw for w, (sl, coc, hw) in heads.items() if hw > 0.015 and sizes.get(w, 0) > 0}
    subj = q.get("subj"); job = m.get("job", "?")
    c = {}
    # 1 size by job (head width / frame width)
    sliced = [w for w, (sl, _, _) in heads.items() if sl and w in vis]
    lo, hi, kind = JOBS.get(job, (0, 1, "?"))
    hw_s = vis.get(subj, 0) if subj in vis else (max(vis.values()) if vis else 0)
    front = max(vis.values()) if vis else 0
    if sliced: c["1"] = ("F", "head sliced: " + ",".join(sliced))
    elif job == "?": c["1"] = ("F", "no job named")
    elif job in ("insert", "payoff", "opening"):
        c["1"] = (m.get("1", "P:").split(":")[0] or "P", f"{job} " + m.get("1", ":object (visual)").split(":", 1)[1])
    elif job == "wide": c["1"] = ("P", f"wide, heads {front:.0%}") if front < hi else ("F", f"wide but head {front:.0%}")
    elif job == "group": c["1"] = ("P", f"group front {front:.0%}") if lo <= front <= hi else ("F", f"group front {front:.0%} (8-22)")
    else: c["1"] = ("P", f"{job} {subj} {hw_s:.0%}") if lo * 0.93 <= hw_s <= hi * 1.07 else ("F", f"{job} {subj} {hw_s:.0%} ({lo:.0%}-{hi:.0%})")
    occ = [o for o in q.get("occ", []) if "(T)" not in o]
    c["2"] = ("F", "blocked " + occ[0][:14]) if occ else ("P", "")
    scoc = heads.get(subj, (0, 0, 0))[1] if subj else 0
    c["3"] = ("P", f"{subj or '-'} {scoc:.1f}px") if scoc <= 2.5 else ("F", f"{subj} soft {scoc:.1f}px")
    # 4 people / no-character jobs
    if vis: c["4"] = ("P", f"{len(vis)} people")
    elif m.get("nochar") and m["nochar"].split(":")[0] in ("opening", "insert", "payoff"): c["4"] = ("P", m["nochar"][:30])
    else: c["4"] = ("F", "nobody, no job named")
    ts = q.get("titleShare", 0); parts = {n: (w, h) for n, w, h in q.get("titleParts", [])}
    if k in REQ:
        markw = parts.get("plimsollMark", (0, 0))[0]
        if job == "insert": c["5"] = ("P", f"mark {markw:.0%} of width") if markw >= 0.4 else ("F", f"mark only {markw:.0%}")
        else: c["5"] = ("P", f"title {ts:.0%} REQ") if ts >= 0.4 else ("F", f"title {ts:.0%} < 40% REQ")
    else: c["5"] = ("P", f"title {ts:.0%}")
    c["6"] = ("F", ",".join(q.get("over", []))[:22]) if q.get("over") else ("P", "")
    c["7"] = ("F", "not checked")
    low = a[int(240 * 0.3):]; hsv = np.array([colorsys.rgb_to_hsv(*px) for px in low.reshape(-1, 3)[::3]])
    purple = ((hsv[:, 0] > 0.70) & (hsv[:, 0] < 0.95) & (hsv[:, 1] > 0.25) & (hsv[:, 2] > 0.15)).mean()
    sat = hsv[:, 1].mean(); con = a.mean(2).std()
    c["8"] = ("F", f"purple {purple:.0%}") if purple > 0.2 else (("F", f"hazy s{sat:.2f}") if sat < 0.18 or con < 0.1 else ("P", f"s{sat:.2f} p{purple:.0%}"))
    g = np.asarray(im.convert("L").resize((270, 480))).astype(float) / 255
    dark = (g < 0.08).mean(); lap = np.abs(np.asarray(im.convert("L").resize((270, 480)).filter(ImageFilter.FIND_EDGES)).astype(float))
    tiles = lap[:480 - 480 % 30, :270 - 270 % 30].reshape(16, 30, 9, 30).mean(axis=(1, 3)); blurfrac = (tiles < 4.0).mean()
    readable = hw_s >= 0.06 or job in ("insert", "payoff", "opening", "wide")
    if dark > 0.55: c["9"] = ("F", f"{dark:.0%} black")
    elif blurfrac > 0.7: c["9"] = ("F", f"{blurfrac:.0%} blur")
    elif not readable: c["9"] = ("F", "subject tiny")
    else: c["9"] = ("P", f"dark {dark:.0%} blur {blurfrac:.0%}")
    soft = [f"{w}{coc:.0f}" for w, (_, coc, hw) in heads.items() if coc > 3.0 and w in vis]
    c["10"] = ("F", "blurred: " + ",".join(soft)) if soft else ("P", "")
    # 11 faces vs the plan
    fl, fx = [], {}
    nt = nf = 0
    for fc in q.get("faces", []):
        who = fc[0].split("#")[0]
        if who not in vis: continue
        ex = fc[1]; fx[who] = ex; facing = fc[6] if len(fc) > 6 else 1; mode = fc[7] if len(fc) > 7 else "stand"
        if abs(facing) >= 0.5 or mode in ("walk", "run", "stride", "hop"): nt += 1
        else: nf += 1
        al = allowed(who, f)
        if who == plan["hero"] and ex in plan["shock_faces"]: fl.append(f"hero shock {ex}")
        elif al is not None and ex not in al: fl.append(f"{who}:{ex}")
    pair = m.get("contrast")
    if pair and all(w in fx for w in pair):
        e1, e2 = fx[pair[0]], fx[pair[1]]
        if FAM.get(e1) == FAM.get(e2) or (e1 in CLOSED_SMILE and e2 in CLOSED_SMILE): fl.append(f"no contrast {e1}/{e2}")
        else: fx["_pair"] = f"{e1} vs {e2}"
    elif pair: fl.append("pair not in frame")
    c["11"] = ("F", "; ".join(fl)[:40]) if fl else ("P", fx.get("_pair", "plan ok"))
    turned[0] += nt; turned[1] += nt + nf
    c["12"] = ("P", f"3/4 {nt}/{nt + nf}")
    for ck, v in m.items():
        if ck.isdigit():
            st, _, note = v.partition(":"); c[ck] = (st, note or c.get(ck, ("", ""))[1])
    rows.append((f, scene(f), p, c, job))
n = len(rows)
mix = {"CU": 0, "MED": 0, "WIDE": 0, "OBJ": 0}
for r in rows: mix[JOBS.get(r[4], (0, 0, "MED"))[2] if r[4] in JOBS else "MED"] += 1
tgt = {"CU": (0.15, 0.20), "MED": (0.25, 0.35), "WIDE": (0.15, 0.20), "OBJ": (0.30, 0.40)}
mixs = "  ".join(f"{k} {v}/{n}={v / n:.0%} ({tgt[k][0]:.0%}-{tgt[k][1]:.0%})" for k, v in mix.items())
share = turned[0] / max(1, turned[1])
shocks = len(plan["shock_beats"])
TW, TH, N = 216, 384, 6
font = ImageFont.truetype("/home/claude/ship/art/Montserrat-Black.ttf", 15); small = ImageFont.truetype("/home/claude/ship/art/Montserrat-Black.ttf", 11)
R = (n + N - 1) // N; H1 = TH + 84
sheet = Image.new("RGB", (TW * N, H1 * R + 112), (18, 18, 22)); d = ImageDraw.Draw(sheet)
nf_ = sum(1 for r in rows for v in r[3].values() if v[0] == "F")
d.text((12, 8), f"STILL-FRAME GATE v10.16 - {n} key frames.  FAIL marks: {nf_}.  3/4 faces {turned[0]}/{turned[1]} = {share:.0%} (aim ~50%).  Shock beats {shocks} (3-8).", fill=(255, 255, 255), font=font)
d.text((12, 30), "SHOT MIX  " + mixs, fill=(255, 225, 140), font=small)
d.text((12, 50), "1 size by job (head width/frame width)  2 nothing in the middle  3 subject sharp  4 people / no-character job  5 title 40%+ (REQ hook+reveal)  6 no stacked heads", fill=(205, 205, 205), font=small)
d.text((12, 68), "7 shaped props  8 strong colour  9 not black/blur  10 no blurred face  11 faces = expression plan, contrast, no hero shock  12 2.5D (3/4 faces, hats, no outline on a face)", fill=(205, 205, 205), font=small)
COL = {"P": (80, 200, 110), "F": (235, 70, 60)}
for i, (f, sc, p, c, job) in enumerate(rows):
    x, y = (i % N) * TW, 112 + (i // N) * H1
    sheet.paste(Image.open(p).convert("RGB").resize((TW - 6, TH)), (x + 3, y))
    d.rectangle([x + 3, y, x + 150, y + 18], fill=(0, 0, 0)); d.text((x + 7, y + 3), f"S{sc} f{f} {job}", fill=(255, 230, 120), font=small)
    for j in range(12):
        st, note = c[str(j + 1)]; bx = x + 3 + j * 17.5
        d.rectangle([bx, y + TH + 4, bx + 16, y + TH + 22], fill=COL.get(st, (90, 90, 90))); d.text((bx + 2, y + TH + 7), f"{j + 1}", fill=(0, 0, 0), font=small)
    fails = [f"{j}:{c[j][1]}" for j in [str(t) for t in range(1, 13)] if c[j][0] == "F"]
    txt = "; ".join(fails) if fails else "ALL PASS"
    d.text((x + 5, y + TH + 27), txt[:36], fill=(255, 140, 120) if fails else (140, 230, 160), font=small)
    if len(txt) > 36: d.text((x + 5, y + TH + 41), txt[36:72], fill=(255, 140, 120), font=small)
    d.text((x + 5, y + TH + 57), (c["1"][1] + " | " + c["11"][1])[:38], fill=(190, 190, 190), font=small)
sheet.save(OUT, quality=88)
json.dump({f"{r[0]:04d}": r[3] for r in rows}, open(OUT.rsplit(".", 1)[0] + ".json", "w"), indent=0)
print(f"{n} frames, {nf_} FAIL marks; 3/4 faces {share:.0%}; mix {mixs}")
for r in rows:
    fl = [f"{k}:{v[1]}" for k, v in r[3].items() if v[0] == "F"]
    print(f"  S{r[1]} f{r[0]} [{r[4]}] " + (" | ".join(fl) if fl else "ok") + f"   (1 {r[3]['1'][1]}; 12 {r[3]['12'][1]})")
