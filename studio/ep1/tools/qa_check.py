"""Automated overlap / clipping check over the QA boxes written by raise-frames.mjs --qa.

Rules (from the brief):
  - no text over a face; captions never over a face or other on-screen text
  - texts don't collide with each other (except listed intentional stamps)
  - tag text stays inside its tag
  - text stays inside the frame and >= 40 px from the edge (warn under 60)
  - text vs. objects (buckets incl. handles) reported
Usage: python3 qa_check.py qa.json [fps=30]
"""
import json
import sys
from collections import defaultdict

data = json.load(open(sys.argv[1]))
FPS = float(sys.argv[2]) if len(sys.argv) > 2 else 30
W, H = 1920, 1080

# Overlaps that are the design (a stamp landing on its sticker, a strike over its word).
ALLOW = {
    frozenset({"text:expired", "tag:extra"}),
    frozenset({"text:expired", "tagtext:extra"}),
    frozenset({"text:expired", "text:end2025"}),
    frozenset({"tag:extra", "text:end2025"}),  # the sticker peels away over its own date
}


def inter(a, b):
    x0, y0 = max(a["x"], b["x"]), max(a["y"], b["y"])
    x1, y1 = min(a["x"] + a["w"], b["x"] + b["w"]), min(a["y"] + a["h"], b["y"] + b["h"])
    return max(0, x1 - x0) * max(0, y1 - y0)


def area(a):
    return a["w"] * a["h"]


def shrink(b, px):
    """Text boxes include line-height padding; shrink a little so touching isn't a hit."""
    return {**b, "x": b["x"] + px, "y": b["y"] + px, "w": max(1, b["w"] - 2 * px), "h": max(1, b["h"] - 2 * px)}


issues = defaultdict(list)
skipped = 0
for fr, boxes in sorted(data.items(), key=lambda kv: int(kv[0])):
    f = int(fr)
    if any(b["y"] < -10000 for b in boxes):  # tab's first layout pass, before Remotion settles the page
        skipped += 1
        continue
    texts = [shrink(b, 6) for b in boxes if b["type"] == "text" and not b["id"].startswith("tagtext:")]
    tagtexts = {b["id"][8:]: b for b in boxes if b["id"].startswith("tagtext:")}
    tags = {b["id"][4:]: b for b in boxes if b["id"].startswith("tag:")}
    faces = [b for b in boxes if b["type"] == "face"]
    caps = [shrink(b, 4) for b in boxes if b["type"] == "caption"]
    objs = [b for b in boxes if b["type"] == "object"]
    lines = [b for b in boxes if b["type"] == "line"]
    for i, a in enumerate(texts):
        for b in texts[i + 1:]:
            if frozenset({a["id"], b["id"]}) in ALLOW or a["id"] == b["id"]:
                continue
            if a.get("scene") != b.get("scene"):
                continue
            ov = inter(a, b)
            if ov > 0.04 * min(area(a), area(b)) and ov > 150:
                issues[("text-text", a["id"], b["id"])].append(f)
        for fc in faces:
            if fc.get("scene") != a.get("scene"):
                continue
            ov = inter(a, fc)
            if ov > 0.03 * area(fc):
                issues[("text-face", a["id"], fc["id"])].append(f)
        for o in objs:
            if o.get("scene") != a.get("scene"):
                continue
            ov = inter(a, o)
            if ov > 0.015 * area(a) and ov > 120:
                issues[("text-object", a["id"], o["id"])].append(f)
        for ln in lines:
            if ln.get("scene") != a.get("scene") or a.get("trans"):
                continue
            if inter(a, ln) > 60:
                issues[("text-line", a["id"], ln["id"])].append(f)
        if a.get("trans"):
            continue
        if a["x"] < 40 or a["y"] < 40 or a["x"] + a["w"] > W - 40 or a["y"] + a["h"] > H - 40:
            kind = "text-clipped" if (a["x"] < 0 or a["y"] < 0 or a["x"] + a["w"] > W or a["y"] + a["h"] > H) else "text-edge"
            issues[(kind, a["id"], "")].append(f)
    for c in caps:
        for fc in faces:
            if inter(c, fc) > 0.02 * area(fc):
                issues[("caption-face", c["id"], fc["id"])].append(f)
        for a in texts:
            if inter(c, a) > 120:
                issues[("caption-text", c["id"], a["id"])].append(f)
    for name, tt in tagtexts.items():
        tg = tags.get(name)
        if tg and (tt["x"] < tg["x"] - 1 or tt["y"] < tg["y"] - 1 or tt["x"] + tt["w"] > tg["x"] + tg["w"] + 1 or tt["y"] + tt["h"] > tg["y"] + tg["h"] + 1):
            issues[("tag-overflow", name, "")].append(f)

if not issues:
    print(f"QA PASS: {len(data) - skipped} frames checked ({skipped} unsettled first-layout frames skipped), no overlaps or clipping.")
    sys.exit(0)
order = ["text-clipped", "caption-face", "text-face", "tag-overflow", "caption-text", "text-text", "text-line", "text-object", "text-edge"]
for kind, a, b in sorted(issues, key=lambda k: (order.index(k[0]), issues[k][0])):
    fr = issues[(kind, a, b)]
    print(f"{kind:13s} {a:22s} {b:22s} {fr[0] / FPS:7.2f}s..{fr[-1] / FPS:7.2f}s  ({len(fr)} frames)")
print(f"\n{len(issues)} issue groups over {len(data)} frames")
sys.exit(1)
