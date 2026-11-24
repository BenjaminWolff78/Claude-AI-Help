"""Generic previz scene-graph sweep (shoe video): lists frame ranges for each hit type from the previz QA log."""
import json, glob, sys, collections
QA = {}
for fn in sorted(glob.glob(sys.argv[1] + "/qa_*.jsonl")):
    for ln in open(fn):
        ln = ln.strip()
        if not ln: continue
        try: d = json.loads(ln); QA[int(round(d["f"]))] = d
        except Exception: pass
hits = collections.defaultdict(list)
for f in sorted(QA):
    d = QA[f]; vis = {s[0] for s in d.get("sizes", []) if s[1] > 0}
    if d.get("near"): hits["near-mesh"].append((f, str(d.get("near"))))
    if d.get("occ"): hits["subject-occluded"].append((f, str(d["occ"])[:60]))
    if d.get("cut"): hits["sliced-head"].append((f, str(d["cut"])[:60]))
    if not d.get("inFrame", 1): hits["subject-out"].append((f, d.get("subj")))
    pr = [p for p in d.get("pierce", []) if p.split("@")[0].split(":")[0] in vis]
    if pr: hits["pierce(visible)"].append((f, ",".join(pr)[:60]))
    cr = d.get("cray") or [99, ""]
    if cr[0] < 0.45 and not str(cr[1]).startswith(("shoe", "wall", "insert", "glove", "box", "snk")): hits["centre-ray<0.45m"].append((f, f"{cr[0]} {cr[1]}"))
    if d.get("over"): hits["head-on-head"].append((f, str(d["over"])[:60]))
def ranges(lst):
    out = []; 
    for f, why in lst:
        if out and f - out[-1][1] <= 2: out[-1][1] = f
        else: out.append([f, f, why])
    return out
print("frames checked:", len(QA), min(QA), "-", max(QA))
for k, v in hits.items():
    r = ranges(v); print(f"\n{k}: {len(v)} frames in {len(r)} runs")
    for a, b, why in r[:25]: print(f"  {a}-{b}  {why}")
