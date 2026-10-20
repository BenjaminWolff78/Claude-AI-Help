"""Tile rendered frames (f<frame>.jpeg) into labelled contact sheets.
Usage: python3 sheet.py <dir> <out_prefix> [cols=4] [per_sheet=12] [tile_w=640]"""
import glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont
d, outp = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
per = int(sys.argv[4]) if len(sys.argv) > 4 else 12
tw = int(sys.argv[5]) if len(sys.argv) > 5 else 640
files = sorted(glob.glob(os.path.join(d, 'f*.jpeg')), key=lambda p: int(re.findall(r'f(\d+)', os.path.basename(p))[0]))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') else ImageFont.load_default()
outs = []
for si in range(0, len(files), per):
    chunk = files[si:si + per]
    th = int(tw * 9 / 16)
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * th), 'black')
    for i, f in enumerate(chunk):
        fr = int(re.findall(r'f(\d+)', os.path.basename(f))[0])
        im = Image.open(f).convert('RGB').resize((tw, th))
        dr = ImageDraw.Draw(im)
        lab = f'{fr/30:6.2f}s'
        dr.rectangle([0, 0, 110, 30], fill='black')
        dr.text((6, 3), lab, fill='white', font=font)
        sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
    o = f'{outp}-{si // per + 1}.png'
    sheet.save(o)
    outs.append(o)
print('\n'.join(outs))
