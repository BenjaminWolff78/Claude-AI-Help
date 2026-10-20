"""Contact sheet from a raise-frames.mjs output dir rendered with --every N --from S.
Usage: sheet2.py <dir> <from_s> <every_frames> <pick_every> <out.png> [cols=4] [tw=480]"""
import os, re, sys
from PIL import Image, ImageDraw, ImageFont
d, t0, ev, pick, out = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 4
tw = int(sys.argv[7]) if len(sys.argv) > 7 else 480
th = tw * 9 // 16
fs = sorted((f for f in os.listdir(d) if f.endswith('.jpeg')), key=lambda f: int(re.findall(r'\d+', f)[0]))[::pick]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw, rows * th))
for i, f in enumerate(fs):
    idx = int(re.findall(r'\d+', f)[0])
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((tw, th))
    dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 86, 24], fill='black')
    dr.text((4, 2), f'{t0 + idx * ev / 30:6.1f}s', fill='white', font=font)
    sh.paste(im, ((i % cols) * tw, (i // cols) * th))
sh.save(out); print(out, len(fs))
