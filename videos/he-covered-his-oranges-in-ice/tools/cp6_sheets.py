#!/usr/bin/env python3
"""CP6 side-by-side review: our frame every 2 s (row 1) next to the board crops (row 2), three sheets.
The board crops are private reference: these sheets are never pushed or published.
usage: python3 tools/cp6_sheets.py "<final mp4>" <out dir>"""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont

mp4, out = sys.argv[1], sys.argv[2]
fr = os.path.join(out, "frames"); os.makedirs(fr, exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp4, "-vf", "select='not(mod(n\\,60))',scale=360:640", "-vsync", "0",
                os.path.join(fr, "f_%02d.jpg")], check=True)
frames = sorted(f for f in os.listdir(fr) if f.startswith("f_"))
REF = "/home/claude/proj/stylelock/rick/"
groups = [(frames[0:11], ["c_golden.jpg", "ak_night.jpg", "c_night.jpg"]),
          (frames[11:22], ["c_night.jpg", "ak_night.jpg", "c_interior.jpg"]),
          (frames[22:], ["c_interior.jpg", "c_golden.jpg", "c_night.jpg"])]
H = 480
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except OSError:
    font = ImageFont.load_default()

def row(ims, labels=None):
    ims = [im.resize((round(im.width * H / im.height), H), Image.LANCZOS) for im in ims]
    r = Image.new("RGB", (sum(i.width for i in ims) + 6 * (len(ims) - 1), H), "white"); x = 0
    for k, im in enumerate(ims):
        r.paste(im, (x, 0))
        if labels:
            d = ImageDraw.Draw(r); d.rectangle([x, 0, x + 92, 30], fill="black"); d.text((x + 6, 3), labels[k], fill="yellow", font=font)
        x += im.width + 6
    return r

for gi, (fs, refs) in enumerate(groups, 1):
    ours = [Image.open(os.path.join(fr, f)).convert("RGB") for f in fs]
    labels = [f"{(int(f[2:4]) - 1) * 2} s" for f in fs]
    r1 = row(ours, labels)
    r2 = row([Image.open(REF + p).convert("RGB") for p in refs])
    sheet = Image.new("RGB", (max(r1.width, r2.width), H * 2 + 10), "white"); sheet.paste(r1, (0, 0)); sheet.paste(r2, (0, H + 10))
    sheet.save(os.path.join(out, f"CP6_side_by_side_{gi}.jpg"), quality=85)
    print("sheet", gi, sheet.size)
