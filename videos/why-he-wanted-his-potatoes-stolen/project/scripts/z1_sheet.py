#!/usr/bin/env python3
"""Board Z1 side-by-side: Rick's 20 frames (1 per second) on top, ours (1 per second over the same span) below, with
the measured camera numbers. usage: python3 scripts/z1_sheet.py out.jpg <frames dir> <first frame> <qa report txt>"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
out, d, f0, rep = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
F = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)
G = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", s)
z1 = Image.open("/home/claude/ice/refs/Z1_shot_variety.jpg").convert("RGB")
rick = z1.crop((0, 0, 1800, 790))  # title + Rick's two rows + his caption
W, cw, ch = 1800, 180, 320
ours = [os.path.join(d, f"f{f:04d}.jpg") for f in range(f0, f0 + 20 * 30, 30)]
ours = [p for p in ours if os.path.exists(p)]
sheet = Image.new("RGB", (W, 790 + 50 + 2 * ch + 260), (17, 17, 20)); dr = ImageDraw.Draw(sheet)
sheet.paste(rick, (0, 0))
dr.text((16, 800), f"OURS - The Man Who Sold the Eiffel Tower ({f0 / 30:.0f}-{f0 / 30 + 19:.0f} s, 1 frame per second, same crop size)", fill=(120, 230, 140), font=F(28))
for i, p in enumerate(ours):
    im = Image.open(p).convert("RGB").resize((cw, ch)); sheet.paste(im, ((i % 10) * cw, 840 + (i // 10) * ch))
y = 840 + 2 * ch + 14
for line in open(rep).read().splitlines()[:6]:
    if line.startswith(("HARD", "CAMERA", "HERO", "LONGEST", "OCCLUDER", "SUBJECT", "OVERLAP")):
        dr.text((16, y), line[:150], fill=(238, 238, 238), font=G(24)); y += 34
sheet.save(out, quality=88); print(out, sheet.size)
