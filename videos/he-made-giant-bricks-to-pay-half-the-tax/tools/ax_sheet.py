#!/usr/bin/env python3
"""AX1/AX2 character style-lock sheet: each character's 8 check rows next to the matching AX row strip, with PASS/FAIL.
usage: python3 -I ax_sheet.py <axdir> <verdicts.json|-> <outdir>"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
AX, VER, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(f"{AX}/meta.json")); order = meta["order"]
ver = json.load(open(VER)) if VER != "-" else {}
F = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)
F2 = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", s)
CW, CH = 4800 / 7, 1085.7
LIT = {"amos": ("yardMorning", 0, 5), "silas": ("yardMorning", 1, 2), "tax": ("laneSunset", 0, 3), "ned": ("siteSpring", 0, 1), "bess": ("innEvening", 1, 5),
       "crier": ("innEvening", 2, 5), "bld1": ("gateSpring", 0, 3), "bld2": ("gateSpring", 1, 3), "bld3": ("gateSpring", 2, 3), "bv1": ("streetNoon", 0, 5), "bv2": ("streetNoon", 1, 5),
       "bv3": ("streetNoon", 2, 5), "bv4": ("streetNoon", 3, 5), "bv5": ("laneSunset", 2, 3), "drk1": ("innEvening", 3, 5), "drk2": ("innEvening", 4, 5), "bkr": ("streetNoon", 4, 5)}
WOMEN = {"bess", "bv1", "bv4", "bv3"}
KIDS = {"bv3"}
TALLHAT = {"crier": 0.12, "tax": 0.13, "ned": 0.1, "drk1": 0.14, "bkr": 0.12, "bv2": 0.1, "bv5": 0.07}   # r68b: the topper and the baker's cap were cut by the cell top
WIDEHAT = {"crier", "tax", "drk1", "bv2", "bv5"}   # r68b: tricorn tips were cut by the head-crop sides
ROWS = [("head", "Head and face", "head"), ("expr", "Three expressions", "expr"), ("hat", "Hat or hair", "hat"), ("body", "Body and costume", "body"),
        ("limbs", "Limbs holding prop", "limbs"), ("views", "3/4 view", "views"), ("acting", "Acting pose", "acting"), ("light", "Scene light", "light")]
RH, LW, CWD = 430, 360, 300
def cell(who, c, full=True):
    k = order.index(who); sh = Image.open(f"{AX}/render/s{k // 2}.jpg"); r = k % 2
    x, y = c * CW, r * CH
    k0 = 0.31 if who in KIDS else TALLHAT.get(who, 0.2)   # the kid's head sits lower on the card; r60: tall hats start higher (tricorns and Ned's bowler were cut by the cell top)
    box = (x, y + CH * (0.0 if who == "drk1" else 0.04 if who in TALLHAT else 0.12), x + CW, y + CH * 0.99) if full else ((x + CW * 0.12, y + CH * 0.08, x + CW * 0.88, y + CH * 0.5) if who in ("bkr", "bld2", "bld3", "bv1") else (x + CW * 0.08, y + CH * 0.015, x + CW * 0.92, y + CH * 0.48) if who == "bv5" else (x + CW * 0.13, y + CH * k0, x + CW * 0.87, y + CH * (k0 + 0.37)) if who in WIDEHAT else (x + CW * 0.2, y + CH * k0, x + CW * 0.8, y + CH * (k0 + 0.3)))
    return sh.crop(tuple(int(v) for v in box))
def fit(im, w, h, bg=(40, 36, 44)):
    s = min(w / im.width, h / im.height); im2 = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s)))); out = Image.new("RGB", (w, h), bg); out.paste(im2, ((w - im2.width) // 2, (h - im2.height) // 2)); return out
for who in order:
    d, exprs = meta["C"][who]
    stripW = 1500; W = LW + 3 * (CWD + 10) + stripW + 30
    page = Image.new("RGB", (W, 90 + RH * len(ROWS)), (24, 22, 28)); g = ImageDraw.Draw(page)
    v = ver.get(who, {})
    npass = sum(1 for r in ROWS if v.get(r[0], ["?"])[0] == "PASS")
    g.text((20, 20), f"{who.upper()}  -  AX1/AX2 character style lock  ({npass}/8 PASS)", font=F(44), fill=(255, 226, 150))
    for i, (key, label, ax) in enumerate(ROWS):
        y = 90 + i * RH
        g.rectangle([10, y + 6, W - 10, y + RH - 6], outline=(70, 64, 80), width=2)
        verdict, note = v.get(key, ["?", ""])
        col = (120, 220, 120) if verdict == "PASS" else (240, 110, 100) if verdict == "FAIL" else (200, 200, 200)
        g.text((24, y + 20), label, font=F(30), fill=(235, 232, 240)); g.text((24, y + 62), verdict, font=F(46), fill=col)
        words, line, yy = note.split(), "", y + 124
        for wd in words:
            if g.textlength(line + " " + wd, font=F2(20)) > LW - 40: g.text((24, yy), line, font=F2(20), fill=(210, 206, 216)); yy += 26; line = wd
            else: line = (line + " " + wd).strip()
        if line: g.text((24, yy), line, font=F2(20), fill=(210, 206, 216))
        x = LW
        if key == "expr": ims = [cell(who, 1, False), cell(who, 2, False), cell(who, 3, False)]; caps = exprs
        elif key == "head": ims = [cell(who, 0, False)]; caps = [d]
        elif key == "hat": ims = [cell(who, 4, False)]; caps = ["3/4 head"]
        elif key == "body": ims = [cell(who, 0)]; caps = ["front"]
        elif key == "limbs": ims = [cell(who, 5)]; caps = ["prop"]
        elif key == "views": ims = [cell(who, 4)]; caps = ["facing 0.8"]
        elif key == "acting": ims = [cell(who, 6)]; caps = ["pose"]
        else:
            li = LIT[who][0]; L = Image.open(f"{AX}/lit1/{who}.jpg")
            ims = [L.crop((0, int(L.height * 0.04), L.width, int(L.height * 0.96)))]; caps = [li]
        for im, cp in zip(ims, caps):
            page.paste(fit(im, CWD, RH - 50), (x, y + 10)); g.text((x + 6, y + RH - 38), cp, font=F2(20), fill=(200, 196, 210)); x += CWD + 10
        axk = "women" if (key == "body" and who in WOMEN) else ax
        strip = Image.open(f"{AX}/ax_{axk}.jpg"); xs = LW + (3 if key == "expr" else 1) * (CWD + 10) + 10
        page.paste(fit(strip, stripW, RH - 40, (24, 22, 28)), (xs, y + 14)); g.text((xs, y + RH - 30), f"Rick's Clips reference: AX row '{axk}'", font=F2(18), fill=(160, 156, 170))
    page.save(f"{OUT}/AX_{who}.jpg", quality=88)
print("ok", len(order))
