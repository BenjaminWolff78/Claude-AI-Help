"""v10.10 lip-sync for quoted lines: per-syllable mouth shapes picked from the words (graphemes -> visemes) and timed by
the word timings + the voice loudness. Output: talk.json {frame: shape} for every frame inside the quoted ranges, and
stress frames (loudness peaks) for head bobs + brow raises.  usage: visemes.py voice.wav words.json out.json a-b [a-b ...]"""
import json, sys, re, numpy as np, soundfile as sf
wav, wj, out = sys.argv[1:4]; ranges = [tuple(map(int, r.split('-'))) for r in sys.argv[4:]]
x, sr = sf.read(wav); x = x.mean(1) if x.ndim > 1 else x
N = int(np.ceil(len(x) / sr * 30)) + 2
rms = np.array([np.sqrt(np.mean(x[int(i * sr / 30):int((i + 1) * sr / 30)] ** 2) + 1e-12) if int(i * sr / 30) < len(x) else 1e-6 for i in range(N)])
db = 20 * np.log10(rms); ref = np.percentile(db[db > -50], 90)
W = json.load(open(wj))
DIG = [("oo", "tSmall"), ("ou", "tO"), ("ow", "tO"), ("ee", "tE"), ("ea", "tE"), ("ai", "tWide"), ("ay", "tWide"), ("th", "tTongue"), ("sh", "tSmall"), ("ch", "tSmall"), ("ph", "tE")]
ONE = {"a": "tWide", "e": "tE", "i": "tE", "y": "tE", "o": "tO", "u": "tSmall", "m": "tClosed", "b": "tClosed", "p": "tClosed", "f": "tE", "v": "tE",
       "l": "tTongue", "t": "tTongue", "d": "tTongue", "n": "tTongue", "s": "tE", "z": "tE", "c": "tSmall", "k": "tSmall", "g": "tSmall", "q": "tSmall",
       "x": "tE", "r": "tO", "w": "tO", "h": "tSmall", "j": "tSmall"}
VOW = set("aeiouy")
def visemes(word):
    w = re.sub(r"[^a-z]", "", word.lower()); out = []; i = 0
    while i < len(w):
        d = w[i:i + 2]; hit = next((v for g, v in DIG if g == d), None)
        if hit: out.append((hit, 2 if d[0] in VOW else 1)); i += 2; continue
        out.append((ONE.get(w[i], "tSmall"), 2 if w[i] in VOW else 1)); i += 1
    q = []
    for v, wt in out:
        if q and q[-1][0] == v: q[-1] = (v, q[-1][1] + wt)
        else: q.append((v, wt))
    return q or [("tSmall", 1)]
MOOD = {"relax": "tSmile", "not": "tFrown", "painted": "tSmile", "fine": "tFrown", "canvas": "tSmile", "paint": "tSmile"}
res, stress = {}, []
for a, b in ranges:
    ws = [w for w in W if a - 6 <= round(w["s"] * 30) < b]
    d = lambda f: db[min(N - 1, f + 1)] - ref   # leads the sound by one frame
    voiced = [f for f in range(a, b) if d(f) > -16]
    seq = []
    for w in ws:
        key = re.sub(r"[^a-z]", "", w["w"].lower()); md = MOOD.get(key)
        first = True
        for v, wt in (visemes(w["w"]) if key != "i" else [("tWide", 2)]):
            if md and (v in ("tWide", "tE") or (first and wt == 2)): v = md; first = False
            seq.append((v, wt))
    tot = sum(wt for _, wt in seq); acc = 0.0; k = 0
    for f in range(a, b): res[f] = "tClosed"
    bounds = []
    for v, wt in seq: acc += wt; bounds.append(acc / tot)
    for i, f in enumerate(voiced):
        u = (i + 0.5) / len(voiced)
        while k < len(bounds) - 1 and u > bounds[k]: k += 1
        res[f] = seq[k][0]
    # unvoiced frames inside the line: half-closed (small) between words, closed at the ends
    for f in range(a, b):
        if f not in voiced and voiced and voiced[0] < f < voiced[-1]: res[f] = "tSmall" if d(f) > -30 else "tClosed"
    run, prev = 0, None
    alt = {"tWide": "tSmile", "tE": "tWide", "tO": "tSmall", "tSmall": "tO", "tTongue": "tWide", "tSmile": "tE", "tClosed": "tSmall", "tFrown": "tSmall"}
    for f in range(a, b):
        run = run + 1 if res[f] == prev else 0
        if run >= 3 and res[f] != "tClosed": res[f] = alt[res[f]]; run = 0
        prev = res[f]
    seg = [d(f) for f in range(a, b)]
    for i in range(1, len(seg) - 1):
        if seg[i] > seg[i - 1] and seg[i] >= seg[i + 1] and seg[i] > -6 and (not stress or a + i - stress[-1] > 7): stress.append(a + i)
json.dump({"talk": res, "stress": stress}, open(out, "w"))
for a, b in ranges:
    shapes = [res[f] for f in range(a, b)]
    print(f"{a}-{b}: {len(set(shapes))} distinct shapes, changes {sum(1 for i in range(1, len(shapes)) if shapes[i] != shapes[i - 1])}, seq {' '.join(s[1:] for s in shapes)}")
print("stress", stress)
