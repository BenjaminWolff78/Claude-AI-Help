"""Sync meta.json expression labels with sheets.json (items 0-3 of each character are head + three expressions)."""
import json, sys
AX = sys.argv[1]
d = json.load(open(f"{AX}/sheets.json")); m = json.load(open(f"{AX}/meta.json"))
for s in d:
    by = {}
    for it in s["items"]:
        by.setdefault(it["who"], []).append(it["o"].get("expr", "calm"))
    for who, ex in by.items():
        if who in m["C"]:
            m["C"][who] = [ex[0], ex[1:4]]
json.dump(m, open(f"{AX}/meta.json", "w"))
print("synced", len(m["C"]))
