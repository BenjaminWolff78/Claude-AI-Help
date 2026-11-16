"""Summarise qa.jsonl: pass-through hits (pierce), half-cut characters (cut), overlaps (over), camera occluders/near-lens,
grouped into frame ranges per item.  usage: python3 qa_report.py qa.jsonl"""
import json, sys, collections
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
def ranges(fr):
    fr = sorted(fr); out = []; a = b = None
    for f in fr:
        if a is None: a = b = f
        elif f == b + 1: b = f
        else: out.append((a, b)); a = b = f
    if a is not None: out.append((a, b))
    return out
for key in ("pierce", "cut", "over"):
    d = collections.defaultdict(list)
    for r in rows:
        for x in r.get(key, []): d[x.split("@")[0]].append(r["f"])
    print(f"== {key}: {sum(len(v) for v in d.values())} hits")
    for k, v in sorted(d.items(), key=lambda kv: kv[1][0]):
        print(f"   {k:28s} {len(v):4d} f  " + ", ".join(f"{a}-{b}" for a, b in ranges(v)[:8]))
near = [r["f"] for r in rows if r.get("near")]; occ = [r["f"] for r in rows if r.get("occ")]
print("== near-lens frames:", ", ".join(f"{a}-{b}" for a, b in ranges(near)[:20]))
print("== subject occluded frames:", ", ".join(f"{a}-{b}" for a, b in ranges(occ)[:20]))
print("frames:", len(rows))
