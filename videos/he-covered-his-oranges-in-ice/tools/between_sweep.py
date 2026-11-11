#!/usr/bin/env python3
"""In-between sweep (added after the final-render review of 2026-11-09): the still-frame gate only measures key frames,
so camera moves BETWEEN keys can still show an empty wall, sweep past a head at the lens or pass a bollard.
usage: between_sweep.py <qa.jsonl> [<qa2.jsonl> ...] [--ok A-B:reason ...]   (rows from scripts/qa_run.mjs, any frame ranges;
       --ok marks a span already reviewed by eye, e.g. a planned no-character insert; it is listed, not failed)
Prints spans of: no character and no title object on screen; the subject out of frame (>= 4 frames); something
between the lens and the subject's head (occ) or right at the lens (near); a head wider than 60% of the frame (a head
passing the camera; the quote close-up tops out at 45%); edge-cut characters (info only, entrances/exits are fine)."""
import sys, json

rows = {}
ok = []
args = sys.argv[1:]
while "--ok" in args:
    i = args.index("--ok"); span, _, why = args[i + 1].partition(":"); a, b = map(int, span.split("-")); ok.append((a, b, why)); del args[i:i + 2]
for p in args:
    for line in open(p):
        line = line[3:] if line.startswith("QA|") else line
        try:
            q = json.loads(line)
        except ValueError:
            continue
        rows[q["f"]] = q


def spans(cond, min_len=1):
    hits = [f for f in sorted(rows) if cond(rows[f]) and not any(a <= f <= b for a, b, _ in ok)]
    out = []
    for f in hits:
        if out and f == out[-1][1] + 1:
            out[-1][1] = f
        else:
            out.append([f, f])
    return [(a, b) for a, b in out if b - a + 1 >= min_len]


vis = lambda q: [s for s in q["sizes"] if s[1] > 0.02]
checks = [
    ("EMPTY (no character, no title object)", lambda q: not vis(q) and q["titleShare"] < 0.1, 1, True),
    ("SUBJECT OUT OF FRAME (>= 4 frames)", lambda q: q["subj"] and not q["inFrame"], 4, True),
    ("OCCLUDER / LENS", lambda q: bool(q["occ"]) or q["near"] > 0, 1, True),
    # only a head whose body is actually visible (a head box can graze the frame from outside it)
    ("HEAD AT THE LENS (a head wider than 60% of the frame)", lambda q: any(len(h) > 3 and h[3] > 0.6 and dict((s[0], s[1]) for s in q["sizes"]).get(h[0], 0) > 0.02 for h in q["heads"]), 1, True),
    ("edge cuts (info)", lambda q: bool(q["cut"]), 1, False),
]
fails = 0
print(f"in-between sweep: {len(rows)} frames ({min(rows)}-{max(rows)})")
for name, cond, n, hard in checks:
    sp = spans(cond, n)
    if hard:
        fails += len(sp)
    print(("FAIL " if hard and sp else "ok   " if hard else "info ") + name + ": " + (", ".join(f"{a}-{b}" for a, b in sp) or "none"))
for a, b, why in ok:
    print(f"reviewed {a}-{b}: {why}")
print("RESULT:", "PASS" if fails == 0 else f"{fails} FAIL spans")
