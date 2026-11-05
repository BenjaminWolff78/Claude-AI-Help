"""Face continuity QA (smooth-acting rule). Usage: python3 scripts/face_qa.py qa.jsonl
Reads the per-frame QA lines (faces: [who, expr, mouth, brow, lid, back]) and flags, per character:
  MOOD FLIP  - a pleased face on one frame and an upset face on the next (always a fail)
  BARE SWAP  - the expression changes between two frames with no blink (lid < 0.5 on both)
  BROW JUMP  - a brow moves more than 2.5 units in one frame
Talking mouths are expected to change every frame and are not checked here."""
import json, sys
VAL = {k: 1 for k in "grin laugh relief relief_open smile smile_closed lick smug eureka sly joy guffaw beam proud pitch".split()}
VAL.update({k: -1 for k in "stern nervous shock dazed pained dismay sheepish strain angry cold gulp wired dead yikes aghast green dizzy".split()})
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
rows.sort(key=lambda r: r["f"])
prev, flips, bare, brow, swaps = {}, [], [], [], 0
for r in rows:
    f = r["f"]
    for who, expr, mouth, br, lid, back in r.get("faces", []):
        p = prev.get(who)
        if p and p[0] == f - 1 and not back and not p[5] and not r.get("cut"):
            _, e0, m0, b0, l0, _ = p
            if e0 != expr:
                swaps += 1
                if VAL.get(e0, 0) * VAL.get(expr, 0) < 0: flips.append((f, who, e0, expr))
                if max(l0, lid) < 0.5: bare.append((f, who, e0, expr))
            if b0 and br and max(abs(b0[0] - br[0]), abs(b0[1] - br[1])) > 2.5: brow.append((f, who, b0, br))
        prev[who] = (f, expr, mouth, br, lid, back)
print(f"FACE QA frames {len(rows)}; expression changes {swaps}")
print(f"MOOD FLIP (fail) {len(flips)}: {flips[:30]}")
print(f"BARE SWAP {len(bare)}: {bare[:30]}")
print(f"BROW JUMP {len(brow)}: {brow[:30]}")
