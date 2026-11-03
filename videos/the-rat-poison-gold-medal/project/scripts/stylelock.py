#!/usr/bin/env python3
"""Style-lock sheet: our cast + sets next to Rick's boards, with a pass/fail line per spec item.
usage: python3 scripts/stylelock.py out.jpg spec.json
spec = {"title": str, "rows": [{"label": str, "ours": [paths], "rick": [path or [path, crop_box]], "checks": [[ok(bool), text], ...]}]}
"""
import json, sys
from PIL import Image, ImageDraw, ImageFont

W = 2400
F = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)
G = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", s)
BG, FG, GOOD, BAD, RICK = (17, 17, 20), (238, 238, 238), (120, 230, 140), (255, 120, 120), (255, 214, 90)

def load(x):
    if isinstance(x, list):
        im = Image.open(x[0]).convert("RGB"); return im.crop(tuple(x[1]))
    return Image.open(x).convert("RGB")

def fit_h(im, h):
    return im.resize((max(1, int(im.width * h / im.height)), h), Image.LANCZOS)

def main():
    out, spec = sys.argv[1], json.load(open(sys.argv[2]))
    blocks = []
    for r in spec["rows"]:
        H = r.get("h", 760)
        ours = [fit_h(load(p), H) for p in r["ours"]]
        rick = [fit_h(load(p), H) for p in r.get("rick", [])]
        lines = r.get("checks", [])
        th = 60 + 40 * len(lines) + 20
        b = Image.new("RGB", (W, 60 + H + th), BG); d = ImageDraw.Draw(b)
        d.text((24, 12), r["label"], fill=FG, font=F(34))
        x = 24
        for im in ours:
            if x + im.width > W - 24: break
            b.paste(im, (x, 60)); x += im.width + 12
        if ours: d.text((24, 60 + H + 8), "OURS", fill=GOOD, font=F(26))
        if rick:
            x += 30 if ours else 0; d.rectangle([x - 18, 60, x - 14, 60 + H], fill=(80, 80, 90)); d.text((x, 60 + H + 8), "RICK (reference board)", fill=RICK, font=F(26))
            for im in rick:
                if x + im.width > W - 24: im = im.crop((0, 0, max(1, W - 24 - x), im.height))
                b.paste(im, (x, 60)); x += im.width + 12
        y = 60 + H + 48
        for ok, t in lines:
            d.text((24, y), ("PASS  " if ok else "FAIL  ") + t, fill=GOOD if ok else BAD, font=G(28)); y += 40
        blocks.append(b)
    head = Image.new("RGB", (W, 90), BG); ImageDraw.Draw(head).text((24, 22), spec["title"], fill=RICK, font=F(44))
    total = Image.new("RGB", (W, 90 + sum(b.height for b in blocks)), BG)
    total.paste(head, (0, 0)); y = 90
    for b in blocks: total.paste(b, (0, y)); y += b.height
    total.save(out, quality=88); print(out, total.size)

main()
