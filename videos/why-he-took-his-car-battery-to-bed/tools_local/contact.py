"""contact.py previz.mp4 words.json outdir  - the v34 step-6c look: contact sheets of the previz at 1 frame per second with the
words spoken in that second under each frame (22 frames a sheet, <= 1600 px wide), plus action strips at every 2nd frame.
Strips: name:first_frame:count (default three: an expression change, a gesture, a prop hand-off)."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
src, wpath, outd = sys.argv[1:4]
strips = [a.split(":") for a in sys.argv[4:]] or [["expression_S7_shrug", "440", "10"], ["gesture_S19_hat_tip", "1142", "10"], ["handoff_S5_can", "336", "10"]]
os.makedirs(outd, exist_ok=True)
W = json.load(open(wpath))
def grab(f, w=140):
    p = os.path.join(outd, f"_f{f}.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select=eq(n\\,{f}),scale={w}:-2", "-frames:v", "1", p], check=True)
    im = Image.open(p).convert("RGB"); os.remove(p); return im
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11); big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
except Exception: font = big = ImageFont.load_default()
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
secs = list(range(int(dur)))
def words_in(t0, t1): return " ".join(w["w"] for w in W if t0 <= w["s"] < t1)
def wrap(txt, n=22):
    out, line = [], ""
    for w in txt.split():
        if len(line) + len(w) + 1 > n: out.append(line); line = w
        else: line = (line + " " + w).strip()
    if line: out.append(line)
    return out[:4]
PER = 22; COLS = 11; CW, CH, TXT = 140, 249, 62
for si in range(0, len(secs), PER):
    chunk = secs[si:si + PER]; rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * (CW + 4) + 4, rows * (CH + TXT + 4) + 4), (24, 24, 28)); d = ImageDraw.Draw(sheet)
    for k, s in enumerate(chunk):
        f = min(int(s * 30 + 15), int(dur * 30) - 1); im = grab(f, CW); x = 4 + (k % COLS) * (CW + 4); y = 4 + (k // COLS) * (CH + TXT + 4)
        sheet.paste(im, (x, y)); d.text((x + 3, y + 3), f"{s}s", font=big, fill=(255, 230, 80))
        for j, ln in enumerate(wrap(words_in(s, s + 1))): d.text((x + 2, y + CH + 2 + j * 14), ln, font=font, fill=(235, 235, 235))
    p = os.path.join(outd, f"contact_{si // PER + 1}.jpg"); sheet.save(p, quality=88); print(p, sheet.size)
for name, f0, n in strips:
    f0, n = int(f0), int(n); ims = [grab(f0 + 2 * k, 150) for k in range(n)]
    st = Image.new("RGB", (n * 154 + 4, ims[0].height + 24), (24, 24, 28)); d = ImageDraw.Draw(st)
    for k, im in enumerate(ims): st.paste(im, (4 + k * 154, 20)); d.text((6 + k * 154, 3), f"f{f0 + 2 * k}", font=font, fill=(255, 230, 80))
    p = os.path.join(outd, f"strip_{name}.jpg"); st.save(p, quality=88); print(p, st.size)
