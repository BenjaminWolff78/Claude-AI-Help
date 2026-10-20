"""Build src/raise/timeline.json from the measured word timings.

Every beat is anchored to a spoken word (line id + word text, optional nth
occurrence), so re-timing to a new voice (e.g. ElevenLabs) only needs a new
words.json; nothing in scenes or sound cues is typed by hand.

Usage: python3 build_timeline.py words.json voice.wav out_timeline.json
"""
import json
import re
import sys

import numpy as np
from scipy.io import wavfile

FPS = 30
words = json.load(open(sys.argv[1]))
LINES = {l["id"]: l for l in words["lines"]}


def W(line, text=None, nth=1, at="start", off=0.0):
    ln = LINES[line]
    if text is None:
        return round((ln["start"] if at == "start" else ln["end"]) + off, 3)
    k = 0
    for w in ln["words"]:
        if w["w"].lower().strip("'") == text.lower():
            k += 1
            if k == nth:
                return round(w[at] + off, 3)
    raise SystemExit(f"anchor not found: {line} {text} #{nth}")


B = {
    "cold": dict(bubble=W("c1", "Don't"), less=W("c1", "less"), wrong=W("c2", "Wrong"),
                 mostly=W("c2", "Mostly")),
    "setup": dict(rewind=W("r1"), boss=W("r2", "boss"), raise_=W("r2", "raise"),
                  coworker=W("r3", "coworker"), whispers=W("r3", "whispers"),
                  dont=W("r3", "Don't"), dontEnd=W("r3", at="end"),
                  higher=W("r4", "higher"), bracket=W("r4", "bracket")),
    "claim": dict(start=W("r5"), wrong=W("r5", "wrong"), right=W("r6", "right"),
                  thousands=W("r6", "thousands"), math=W("r7", "math")),
    "maya": dict(start=W("m1"), maya=W("m1", "Maya"), single=W("m2", "single"),
                 salary=W("m2", "sixty"), deduction=W("m3", "standard"),
                 dedAmt=W("m3", "sixteen"), take=W("m4", "Take"), taxable=W("m4", "fifty")),
    "buckets": dict(start=W("b1"), buckets=W("b1", "buckets"), first=W("b2", "twelve"),
                    ten=W("b2", "ten"), everything=W("b3", "Everything"), upTo=W("b3", "fifty"),
                    twelve=W("b3", "twelve"), full=W("b4", "full"), brim=W("b4", "brim"),
                    spills=W("b5", "spills"), twentyTwo=W("b5", "twenty"),
                    coworker=W("b6", "coworker"), scared=W("b6", "scared"), watch=W("b7", "watch"),
                    overflow=W("b8", "overflow"), taxed22=W("b8", "twenty"),
                    lower=W("b9", "lower"), same=W("b9", "same")),
    "math": dict(start=W("k1"), times=W("k1", "times"), result=W("k1", "four"),
                 keeps=W("k2", "fifteen"), payroll=W("k2", "payroll"), total=W("k3", "six"),
                 nine=W("k4", "nine"), not22=W("k4", "Not"), shrink=W("k5", "shrink"),
                 fill=W("k6", "fill"), tip=W("k6", "tip")),
    "pivot": dict(start=W("p1"), almost=W("p1", "almost"), buckets=W("p2", "buckets"),
                  cliffs=W("p3", "cliffs")),
    "dan": dict(start=W("d1"), dan=W("d1", "Dan"), age=W("d2", "sixty"),
                freelance=W("d2", "freelance"), market=W("d2", "marketplace"),
                credit=W("d3", "credit"), premium=W("d3", "premium"), extra=W("d4", "Extra"),
                y2021=W("d4", "twenty", 1), expired=W("d4", "expired"),
                y2025=W("d4", "twenty", 3), old=W("d5", "old"), back=W("d5", "back")),
    "cliff": dict(start=W("f1"), four=W("f1", "four"), zero=W("f1", "zero"),
                  zero2=W("f2", "Zero"), single=W("f3", "single"), line=W("f3", "sixty"),
                  income=W("f4", "sixty"), client=W("f5", "client"), job=W("f5", "One"),
                  now=W("f6", "sixty"), over=W("f6", "Four"), gone=W("f7", "gone")),
    "cost": dict(start=W("n1"), roughly=W("n2", "roughly"), amount=W("n2", "nine"),
                 ten=W("n3", "ten"), poorer=W("n4", "poorer"), yes=W("n4", "Yes"),
                 move=W("n5", "move")),
    "move": dict(start=W("v1"), paycheck=W("v1", "paycheck"), magi=W("v2", "modified"),
                 lower=W("v3", "lower"), ira=W("v4", "traditional"), hsa=W("v4", "health"),
                 slide=W("v4", "slide"), under=W("v4", "under"), job=W("v5", "job"),
                 money=W("v5", "money"), credit=W("v5", "credit")),
    "status": dict(start=W("w1"), moving=W("w1", "moving"), house=W("w2", "House"),
                   senate=W("w2", "Senate"), check=W("w3", "check"), cliff=W("w3", "cliff")),
    "close": dict(start=W("e1"), brackets=W("e1", "Brackets"), never=W("e1", "never"),
                  cliffs=W("e2", "Cliffs"), next=W("e3", "next"), question=W("e3", "question"),
                  bucket=W("e4", "bucket"), cliff=W("e4", "cliff"), end=W("e4", at="end")),
}
voice_end = words["duration"]
# Closing: final action beat -> short hold with sources/disclaimer -> torn-paper loop wipe.
B["end"] = dict(action=round(B["close"]["end"] + 0.15, 3))
B["end"]["hold"] = round(B["end"]["action"] + 2.2, 3)
B["end"]["wipe"] = round(B["end"]["hold"] + 2.0, 3)
duration = round(B["end"]["wipe"] + 0.8, 3)

# Scene windows: a scene owns [start, next start). Components draw a little past
# their window so neighbours overlap instead of cutting to empty frames.
ORDER = ["cold", "setup", "claim", "maya", "buckets", "math", "pivot", "dan", "cliff",
         "cost", "move", "status", "close"]
first_line = {}
for l in words["lines"]:
    first_line.setdefault(l["scene"], l["start"])
scenes = {}
for i, name in enumerate(ORDER):
    s = 0.0 if i == 0 else round(first_line[name] - 0.35, 3)
    scenes[name] = {"start": s}
for i, name in enumerate(ORDER):
    scenes[name]["end"] = scenes[ORDER[i + 1]]["start"] if i + 1 < len(ORDER) else duration

# ---- captions: display tokens (digits) aligned to spoken words ------------------
norm = lambda s: re.sub(r"[^a-z]", "", s.lower())


def align(text, spoken):
    disp = text.replace('"', "").replace("“", "").replace("”", "").split()
    out, j = [], 0
    for i, d in enumerate(disp):
        if j >= len(spoken):
            out.append((d, out[-1][1] if out else 0, out[-1][2] if out else 0))
            continue
        nd = norm(d)
        if nd and nd == norm(spoken[j]["w"]) and not re.search(r"\d", d):
            out.append((d, spoken[j]["start"], spoken[j]["end"]))
            j += 1
            continue
        nxt = norm(disp[i + 1]) if i + 1 < len(disp) else None
        k = j + 1
        while k < len(spoken) and (nxt is None or norm(spoken[k]["w"]) != nxt):
            k += 1
        k = max(k, j + 1)
        out.append((d, spoken[j]["start"], spoken[k - 1]["end"]))
        j = k
    return out


captions = []
for l in words["lines"]:
    toks = align(l["text"], l["words"])
    chunk = []
    for idx, (d, s, e) in enumerate(toks):
        if re.search(r"\d", d) and len(chunk) >= 2:
            captions.append({"line": l["id"], "start": chunk[0]["start"], "words": chunk})
            chunk = []
        chunk.append({"w": d, "start": s, "end": e})
        brk = d[-1] in ".,?!:" or len(chunk) == 4 or idx == len(toks) - 1
        if len(chunk) == 4 and d[-1] not in ".,?!:" and idx + 1 < len(toks):
            brk = True
        if brk:
            captions.append({"line": l["id"], "start": chunk[0]["start"], "words": chunk})
            chunk = []
for i, c in enumerate(captions):
    nxt = captions[i + 1]["start"] if i + 1 < len(captions) else c["words"][-1]["end"] + 0.4
    c["end"] = round(min(nxt, c["words"][-1]["end"] + 0.6), 3)

# ---- voice amplitude per frame (mouths) -----------------------------------------
sr, a = wavfile.read(sys.argv[2])
a = a.astype(np.float32) / 32768
hop = sr // FPS
n = int(duration * FPS) + 1
amp = []
for f in range(n):
    seg = a[f * hop:(f + 1) * hop]
    amp.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
amp = np.array(amp)
amp = np.clip(amp / (np.percentile(amp[amp > 0.01], 95) + 1e-6), 0, 1)

tl = {"fps": FPS, "width": 1920, "height": 1080, "duration": duration,
      "voiceEnd": voice_end, "scenes": scenes, "beats": B,
      "lines": [{"id": l["id"], "scene": l["scene"], "start": l["start"], "end": l["end"],
                 "text": l["text"]} for l in words["lines"]],
      "captions": captions, "amp": [round(float(x), 2) for x in amp]}
json.dump(tl, open(sys.argv[3], "w"), separators=(",", ":"))
print("duration", duration, "captions", len(captions), "frames", n)
for c in captions[:12]:
    print(round(c["start"], 2), " ".join(w["w"] for w in c["words"]))
