#!/usr/bin/env python3
"""Thumbnails for 'They Blew Up Houses to Stop a Fire' from two clean (caption-free) final-render frames:
the hook (the Captain, hat blown off, as the house goes up) and the climax (the three powder blasts).
usage: python3 thumb.py <hook_frame.jpg> <blast_frame.jpg> <out_dir>"""
import sys, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont
H, B, O = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(O, exist_ok=True)
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Montserrat-Black.ttf")
INK, WHITE, ACC = (26, 18, 30), (255, 255, 255), (232, 70, 42)
def text(im, xy, s, size, fill, stroke=0.12, anchor="mm"):
    f = ImageFont.truetype(FONT, size); sw = max(2, int(size * stroke))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.text((xy[0] + size * 0.03, xy[1] + size * 0.07), s, font=f, fill=(20, 8, 24, 170), anchor=anchor, stroke_width=sw, stroke_fill=(20, 8, 24, 170))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.05)))
    ImageDraw.Draw(im).text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=INK)
hook, blast = Image.open(H).convert("RGBA"), Image.open(B).convert("RGBA")
# ---- Shorts cover 1080 x 1920: the hook frame, headline over the facade above his hat ----
t = hook.copy()
text(t, (540, 250), "TO STOP A FIRE...", 96, WHITE)
text(t, (540, 385), "BLOW IT UP?!", 126, ACC)
t.convert("RGB").save(f"{O}/thumbnail_short_1080x1920.png")
# ---- landscape 1280 x 720: the Captain left, the blasts right, split by a jagged blast edge ----
W, Hh = 1280, 720
L = hook.crop((330, 400, 330 + 700, 400 + 788)).resize((640, 720), Image.LANCZOS)
R = blast.crop((0, 760, 1080, 760 + 1080)).resize((760, 760), Image.LANCZOS).crop((0, 20, 760, 740))
c = Image.new("RGBA", (W, Hh)); c.paste(R, (W - 760, 0)); 
m = Image.new("L", (W, Hh), 0); d = ImageDraw.Draw(m)
pts = [(0, 0)]
for i in range(13):
    y = i * Hh / 12; x = 600 + (34 if i % 2 else -10) + 18 * math.sin(i * 1.7)
    pts.append((x, y))
pts += [(0, Hh)]
d.polygon(pts, fill=255)
c.paste(L, (0, 0), m.crop((0, 0, 640, 720)))
edge = Image.new("RGBA", (W, Hh), (0, 0, 0, 0)); de = ImageDraw.Draw(edge)
de.line(pts[1:-1], fill=INK + (255,), width=14, joint="curve"); de.line(pts[1:-1], fill=ACC + (255,), width=6, joint="curve")
c.alpha_composite(edge)
text(c, (955, 140), "TO STOP A FIRE...", 58, WHITE)
text(c, (955, 240), "BLOW IT UP?!", 76, WHITE, stroke=0.14)
c.convert("RGB").save(f"{O}/thumbnail_1280x720.png")
print("ok")
