#!/usr/bin/env python3
"""CP5 face strip: every 2nd frame of a quoted line, the speaker's head cropped from the previz (QA cast2 gives the head
on screen), labelled with the frame, the word under way and the mouth shape the QA log reports.
usage: python3 face_strip.py <previz_dir> <words.json> <who> <f0> <f1> <out.jpg>"""
import json, sys, glob, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

pdir, wpath, who, f0, f1, outp = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
QA = {}
for fn in glob.glob(os.path.join(pdir, "qa_*.jsonl")):
    for ln in open(fn):
        if ln.strip():
            try: d = json.loads(ln); QA[d["f"]] = d
            except Exception: pass
words = json.load(open(wpath)); words = words["words"] if isinstance(words, dict) else words
W = [(round(w.get("start", w.get("s")) * 30), round(w.get("end", w.get("e", w.get("start", 0) + 0.3)) * 30), w.get("word", w.get("w"))) for w in words]
frames = {}
for v in sorted(glob.glob(os.path.join(pdir, "p_*.mp4"))):
    a0 = int(os.path.basename(v)[2:6])
    if a0 > f1 or a0 + 120 < f0: continue
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    arr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270, 3)
    for k, fr in enumerate(arr): frames[a0 + k] = fr
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 11)
tiles, shapes = [], []
for f in range(f0, f1 + 1, 2):
    d, fr = QA.get(f), frames.get(f)
    if d is None or fr is None: continue
    c = next((x for x in d.get("cast2", []) if x[0] == who), None)
    face = next((x for x in d.get("faces", []) if x[0].startswith(who + "#")), None)
    if not c: continue
    _, x, y, fy, r, dep = c
    cx, cy, half = (x + 1) / 2 * 270, (1 - y) / 2 * 480, max(18, r * 270 * 1.15)
    im = Image.fromarray(fr).crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half))).resize((120, 120))
    mouth = face[2] if face else ""; shapes.append(mouth)
    wd = next((w for a, b, w in W if a <= f <= b), "")
    t = Image.new("RGB", (120, 150), (20, 20, 24)); t.paste(im, (0, 0)); dr = ImageDraw.Draw(t)
    dr.text((3, 122), f"{f} {wd}", font=F, fill=(240, 240, 240)); dr.text((3, 136), f"m:{mouth or 'auto'}", font=F, fill=(255, 214, 90))
    tiles.append(t)
cols = 10; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 120, rows * 150 + 24), (12, 12, 14)); dr = ImageDraw.Draw(sheet)
dr.text((6, 5), f"{who} {f0}-{f1}: {len(tiles)} frames, mouth shapes used: {len(set(shapes))} ({', '.join(sorted(set(s or 'auto' for s in shapes)))})", font=F, fill=(255, 255, 255))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 120, 24 + (i // cols) * 150))
sheet.save(outp, quality=88); print(outp, len(tiles), sorted(set(shapes)))
