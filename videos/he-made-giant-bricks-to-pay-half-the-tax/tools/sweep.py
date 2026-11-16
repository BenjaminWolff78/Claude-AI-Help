#!/usr/bin/env python3
"""Frame-error sweep: pull frames at 2 fps from the render into contact sheets of 18 (6 x 3), labelled with time.
usage: sweep.py <video.mp4> <outdir>"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
vid, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
tmp = os.path.join(out, "fr"); os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", vid, "-vf", "fps=2,scale=270:480", os.path.join(tmp, "s_%04d.jpg")], check=True)
files = sorted(f for f in os.listdir(tmp) if f.startswith("s_"))
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
for k in range(0, len(files), 18):
    batch = files[k:k + 18]
    sheet = Image.new("RGB", (6 * 270, 3 * 480), (16, 16, 18)); d = ImageDraw.Draw(sheet)
    for i, f in enumerate(batch):
        im = Image.open(os.path.join(tmp, f)); x, y = (i % 6) * 270, (i // 6) * 480
        sheet.paste(im, (x, y)); t = (int(f[2:6]) - 1) / 2
        d.rectangle([x, y, x + 92, y + 24], fill=(0, 0, 0)); d.text((x + 4, y + 2), f"{t:5.1f}s", fill=(255, 220, 90), font=F)
    p = os.path.join(out, f"sweep_{k // 18 + 1:02d}.jpg"); sheet.save(p, quality=85); print(p)
