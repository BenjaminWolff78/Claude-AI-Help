import sys, glob
from PIL import Image, ImageDraw
pat, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(glob.glob(pat)); ims = [Image.open(f).convert("RGB") for f in fs]
w = 300; ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]; h = ims[0].height
rows = (len(ims) + cols - 1) // cols; o = Image.new("RGB", (cols * w, rows * h), "#222")
for i, (im, f) in enumerate(zip(ims, fs)):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 70, 18], fill="#000"); d.text((3, 3), f.split("_")[-1].split(".")[0], fill="#ff0")
    o.paste(im, ((i % cols) * w, (i // cols) * h))
o.save(out, quality=85)
