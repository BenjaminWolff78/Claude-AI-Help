import sys, json, subprocess, re
from PIL import Image, ImageDraw
# usage: saysee31.py video.mp4 words.json out.png -> one frame per key word (at the word's start + 0.12 s), labelled
KEYS = [('tap', 1, 'tap'), ('drip', 1, 'drip'), ('burst', 1, 'street burst'), ('twenty', 1, 'minus twenty'), ('shuts', 1, 'red jacket shuts'),
        ('opens', 1, 'opens his tap'), ('bucket', 1, 'into a bucket'), ('water', 1, 'paying to water'), ('full', 1, 'half full'),
        ('drippy', 1, 'calls him Drippy'), ('drain', 1, 'drain all night?'), ('stops', 1, 'drip stops'), ('froze', 1, 'Haha, froze anyway'),
        ('three', 1, 'three in the morning'), ('drop', 1, 'last fat drop'), ('bursts', 1, 'wall bursts'), ('floor', 1, 'across the floor'),
        ('grows', 1, 'ice grows'), ('tap', 5, 'toward the tap'), ('shut', 1, 'tap shut'), ('nowhere', 1, 'nowhere to go'), ('splits', 1, 'pipe splits'),
        ('ketchup', 1, 'ketchup'), ('open', 2, 'open tap (key)'), ('squeeze', 1, 'squeeze out'), ('pushing', 1, 'ice pushing'),
        ('plumbers', 1, 'plumbers'), ('farthest', 1, 'farthest tap'), ('twenty', 2, 'minus twenty'), ('jacket', 2, 'red jacket'),
        ('dripping', 2, 'first one dripping'), ('slams', 1, 'slams'), ('sign', 1, 'Drippy sign'), ('yard', 1, 'yard (the hit)')]
v, wj, out = sys.argv[1], sys.argv[2], sys.argv[3]
W_ = json.load(open(wj)); norm = lambda w: re.sub(r"[^a-z']", '', w.lower())
ROWS = []
for k, nth, lab in KEYS:
    hits = [w for w in W_ if norm(w['word']) == k]
    t = hits[nth - 1]['start'] + 0.12; ROWS.append((t, lab))
W, H = 216, 384; cols = 9; rows = (len(ROWS) + cols - 1) // cols
S = Image.new('RGB', (W * cols, (H + 22) * rows), 'white'); d = ImageDraw.Draw(S)
for i, (t, lab) in enumerate(ROWS):
    p = '/tmp/ss_%02d.png' % i
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '%.3f' % t, '-i', v, '-frames:v', '1', '-vf', 'scale=%d:%d' % (W, H), '-update', '1', p], check=True)
    x = (i % cols) * W; y = (i // cols) * (H + 22); S.paste(Image.open(p), (x, y + 22)); d.text((x + 4, y + 4), '%.2f %s' % (t, lab), fill='black')
S.save(out); print(len(ROWS), 'frames')
