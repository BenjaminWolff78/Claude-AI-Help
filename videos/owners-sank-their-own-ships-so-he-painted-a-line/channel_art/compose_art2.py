#!/usr/bin/env python3
"""Channel art v2 (real look): the original banner's title over the new render, the profile picture, and a 150x150
watermark (Lou's face in a round badge, transparent outside the circle).  usage: compose_art2.py <render_dir> <out_dir>"""
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
R, O = sys.argv[1], sys.argv[2]; os.makedirs(O, exist_ok=True)
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Montserrat-Black.ttf")
INK, MARI, WHITE = (26, 18, 30), (242, 169, 59), (255, 255, 255)
def text(im, xy, s, size, fill, stroke=0.11, shadow=True):
    f = ImageFont.truetype(FONT, size); sw = max(2, int(size * stroke))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
        d.text((xy[0] + size * 0.03, xy[1] + size * 0.06), s, font=f, fill=(20, 12, 8, 150), anchor="mm", stroke_width=sw, stroke_fill=(20, 12, 8, 150))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.05)))
    ImageDraw.Draw(im).text(xy, s, font=f, fill=fill, anchor="mm", stroke_width=sw, stroke_fill=INK)
b = Image.open(f"{R}/banner.png").convert("RGBA").resize((2560, 1440), Image.LANCZOS)
text(b, (1371, 626), "LOOPHOLE", 178, WHITE); text(b, (1371, 780), "LOU", 164, MARI)
text(b, (1371, 892), "Weird true stories in 60 seconds", 50, WHITE, stroke=0.16, shadow=False)
b.convert("RGB").save(f"{O}/banner_2560x1440.png")
c = b.copy(); d = ImageDraw.Draw(c)
for (w, h), col in (((2560, 423), (255, 255, 0)), ((1855, 423), (0, 255, 255)), ((1546, 423), (255, 0, 255))):
    d.rectangle([(2560 - w) // 2, (1440 - h) // 2, (2560 + w) // 2, (1440 + h) // 2], outline=col, width=6)
c.convert("RGB").resize((1280, 720)).save(f"{O}/banner_safe_check.jpg", quality=88)
pp = Image.open(f"{R}/pp.png").convert("RGB").resize((800, 800), Image.LANCZOS); pp.save(f"{O}/profile_800.png")
# watermark: the centre of the avatar (Lou's head on the navy disc) in a circle with a marigold ring, 150 x 150
S = 600; crop = pp.crop((100, 40, 700, 640)).resize((S, S), Image.LANCZOS).convert("RGBA")
mask = Image.new("L", (S, S), 0); ImageDraw.Draw(mask).ellipse([12, 12, S - 12, S - 12], fill=255)
wm = Image.new("RGBA", (S, S), (0, 0, 0, 0)); wm.paste(crop, (0, 0), mask)
ImageDraw.Draw(wm).ellipse([8, 8, S - 8, S - 8], outline=MARI + (255,), width=22)
wm.resize((150, 150), Image.LANCZOS).save(f"{O}/watermark_150.png")
print("ok")
