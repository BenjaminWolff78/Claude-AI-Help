"""Labeled contact sheet of rendered frames in numeric order. Usage: sheet.py dir out.png [cols] [width]"""
import sys, os, re
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
fs = sorted([f for f in os.listdir(d) if f.endswith('.jpeg')], key=lambda f: int(re.findall(r'\d+', f)[0]))
ims = []
for f in fs:
    im = Image.open(os.path.join(d, f)).convert('RGB')
    im = im.resize((tw, int(tw * im.height / im.width)))
    dr = ImageDraw.Draw(im); n = int(re.findall(r'\d+', f)[0])
    dr.rectangle((0, 0, 92, 22), fill=(0, 0, 0)); dr.text((4, 4), f'{n/30:.1f}s', fill=(255, 255, 255))
    ims.append(im)
rows = -(-len(ims) // cols); h = ims[0].height
S = Image.new('RGB', (cols * tw, rows * h), 'white')
for i, im in enumerate(ims): S.paste(im, ((i % cols) * tw, (i // cols) * h))
S.save(out)
