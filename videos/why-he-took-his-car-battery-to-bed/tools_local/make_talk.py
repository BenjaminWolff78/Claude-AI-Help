#!/usr/bin/env python3
"""talk.json for the quoted lines: per-frame talking mouths (board AG shapes) + stressed-syllable frames.
Mouth per frame from the letters of the word being spoken: m/b/p onsets close the lips for 2 frames, o/u -> tO,
a/e/i/y -> tWide (tE on e/i every other syllable), l/th/n/d/t -> tTongue for 1 frame, the rest tSmall; between words
tSmall if the gap is under 4 frames else tClosed."""
import json, re, sys
words = json.load(open(sys.argv[1])); out = sys.argv[2]
# p14: frames of voice_final (65.2 s); the first "syrup"/"it's" after the quote starts
import re as _re
_n = lambda w: _re.sub(r"[^a-z']", '', w.lower())
def _span(a, b):
    i0 = [i for i, w in enumerate(words) if _n(w['w']) == a][0]; i1 = [i for i, w in enumerate(words) if _n(w['w']) == b and i >= i0][0]
    return (round(words[i0]['s'] * 30), round(words[i1]['e'] * 30))
QUOTES = [(round(10.18 * 30), round(11.78 * 30)), (round(56.48 * 30), round(58.02 * 30))]   # p15: the foreman "Gonna read it a bedtime story too?" + "Hey, babysitter, got cables?"
print('quotes', QUOTES)
talk, stress = {}, []
for a, b in QUOTES:
    ws = [w for w in words if a <= round(w['s'] * 30) < b]
    for i, w in enumerate(ws):
        s, e = round(w['s'] * 30), max(round(w['s'] * 30) + 2, round(w['e'] * 30))
        txt = re.sub(r"[^a-z]", "", w['w'].lower())
        vow = re.findall(r"[aeiouy]+", txt) or ["a"]
        n = e - s; seq = []
        if txt[:1] in "mbp": seq += ["tClosed", "tClosed"]
        elif txt[:2] == "th" or txt[:1] in "ltdn": seq += ["tTongue"]
        for j, v in enumerate(vow):
            m = "tO" if v[0] in "ou" else ("tE" if (v[0] in "ei" and j % 2) else "tWide")
            seq += [m] * 3 + ["tSmall"]
        k = [seq[min(len(seq) - 1, int(t * len(seq) / max(1, n)))] for t in range(n)]
        for t, m in enumerate(k): talk[str(s + t)] = m
        if len(txt) >= 4 or w['w'][:1].isupper() or w['w'].endswith(('!', '.')): stress.append(s + 1)
        nx = ws[i + 1] if i + 1 < len(ws) else None
        gap_end = round(nx['s'] * 30) if nx else e + 3
        for t in range(e, gap_end): talk[str(t)] = "tSmall" if gap_end - e < 4 else "tClosed"
json.dump({"talk": talk, "stress": stress}, open(out, "w"))
print(len(talk), "frames", "stress", stress)
