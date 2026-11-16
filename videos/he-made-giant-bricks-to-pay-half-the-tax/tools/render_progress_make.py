#!/usr/bin/env python3
"""Update the "make" bar of the render-progress plugin (the orange bar) and print the bars' state.
usage: python3 -I render_progress_make.py <pct> "<step>" <etaMin>
Running it through Bash puts the plugin's two bars in the chat under this call (its command matches render_progress)."""
import json, sys, datetime
P = "/home/claude/.render-progress.json"
pct, step, eta = float(sys.argv[1]), sys.argv[2], float(sys.argv[3])
try:
    d = json.load(open(P))
except Exception:
    d = {"title": "He Made Giant Bricks to Pay Half the Tax", "stage": "prep", "framesDone": 0, "totalFrames": 1860}
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
d["make"] = {"pct": pct, "step": step, "etaMin": eta, "updatedAt": now}
d["updatedAt"] = now
if d.get("stage") not in ("rendering", "paused", "finishing", "done"):
    d["stage"] = "prep"
tmp = P + ".tmp"
json.dump(d, open(tmp, "w"))
import os
os.replace(tmp, P)
print(f"made {pct:.0f}%  ({step}, about {eta:.0f} min to go)  |  render: {d.get('stage')} {d.get('framesDone', 0)}/{d.get('totalFrames', 0)} frames")
