import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = sys.argv[2]; frames = [int(x) for x in sys.argv[3].split(',')]; W = int(sys.argv[4]) if len(sys.argv) > 4 else 270
ims = []
for f in frames:
    p = glob.glob(os.path.join(d, f"f{f:04d}", "*.jpeg"))
    if p: ims.append((f, Image.open(p[0]).convert('RGB')))
H = int(W * 16 / 9); cols = min(6, len(ims)); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * W, rows * (H + 18)), 'white'); dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(ims):
    x, y = (i % cols) * W, (i // cols) * (H + 18); S.paste(im.resize((W, H)), (x, y + 18)); dr.text((x + 4, y + 3), f"f{f}  {f/30:.1f}s", fill='black')
S.save(out); print(len(ims))
