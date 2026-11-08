#!/usr/bin/env python3
"""Channel art: put the original banner's title text on the new 3D render (same font family, colours and layout as the
original vector banner), and finish the profile picture and the thumbnails.
usage: python3 compose_art.py <render_dir> <out_dir>"""
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
R, O = sys.argv[1], sys.argv[2]
os.makedirs(O, exist_ok=True)
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Montserrat-Black.ttf")
INK, MARI, WHITE = (26, 18, 30), (242, 169, 59), (255, 255, 255)

def text(im, xy_c, s, size, fill, stroke=0.11, shadow=True, anchor="mm", tracking=0):
    f = ImageFont.truetype(FONT, size)
    sw = max(2, int(size * stroke))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
        d.text((xy_c[0] + size * 0.03, xy_c[1] + size * 0.06), s, font=f, fill=(20, 8, 24, 150), anchor=anchor, stroke_width=sw, stroke_fill=(20, 8, 24, 150))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.05)))
    d = ImageDraw.Draw(im)
    d.text(xy_c, s, font=f, fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=INK)
    return d.textbbox(xy_c, s, font=f, anchor=anchor, stroke_width=sw)

# ---- banner 2560 x 1440: LOOPHOLE / LOU / tagline, centred on x = 1371 like the original ----
if os.path.exists(f"{R}/banner.png"):
    b = Image.open(f"{R}/banner.png").convert("RGBA").resize((2560, 1440), Image.LANCZOS)
    text(b, (1371, 626), "LOOPHOLE", 178, WHITE)
    text(b, (1371, 780), "LOU", 164, MARI)
    text(b, (1371, 892), "Weird true stories in 60 seconds", 50, WHITE, stroke=0.16, shadow=False)
    b.convert("RGB").save(f"{O}/banner_2560x1440.png")
    # safe-area check sheet (TV / desktop / mobile crop boxes)
    c = b.copy(); d = ImageDraw.Draw(c)
    for (w, h), col in (((2560, 423), (255, 255, 0)), ((1855, 423), (0, 255, 255)), ((1546, 423), (255, 0, 255))):
        d.rectangle([(2560 - w) // 2, (1440 - h) // 2, (2560 + w) // 2, (1440 + h) // 2], outline=col, width=6)
    c.convert("RGB").resize((1280, 720)).save(f"{O}/banner_safe_check.jpg", quality=88)

# ---- profile picture 800 x 800 ----
if os.path.exists(f"{R}/pp.png"):
    Image.open(f"{R}/pp.png").convert("RGB").resize((800, 800), Image.LANCZOS).save(f"{O}/profile_800.png")

# ---- thumbnails: 1280 x 720 (landscape) and 1080 x 1920 (Shorts cover) ----
if os.path.exists(f"{R}/thumb_wide.png"):
    t = Image.open(f"{R}/thumb_wide.png").convert("RGBA").resize((1280, 720), Image.LANCZOS)
    text(t, (900, 250), "TO STOP", 104, WHITE)
    text(t, (900, 370), "A FIRE...", 104, WHITE)
    text(t, (900, 520), "BLOW IT UP?!", 92, (232, 70, 42))
    t.convert("RGB").save(f"{O}/thumbnail_1280x720.png")
if os.path.exists(f"{R}/thumb_tall.png"):
    t = Image.open(f"{R}/thumb_tall.png").convert("RGBA").resize((1080, 1920), Image.LANCZOS)
    text(t, (540, 300), "TO STOP A FIRE...", 100, WHITE)
    text(t, (540, 430), "BLOW IT UP?!", 118, (232, 70, 42))
    t.convert("RGB").save(f"{O}/thumbnail_short_1080x1920.png")
print("ok")
