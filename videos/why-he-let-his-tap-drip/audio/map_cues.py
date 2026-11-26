"""Map the v30 cue times (v30 output s) to v31 output s through the story frames: v30 out -> story -> v31 out."""
import json, numpy as np, sys
s30 = np.array(json.load(open('/home/claude/p13/bak/v30/remap.json'))['story'], float)
s31 = np.array(json.load(open('/home/claude/p13/v31/remap.json'))['story'], float)
o30, o31 = np.arange(len(s30)), np.arange(len(s31))
cues = json.load(open('/home/claude/p13/audio/cues_drip.json'))
out = []
for c in cues:
    sf = float(np.interp(c['t'] * 30, o30, s30)); t = float(np.interp(sf, s31, o31)) / 30
    d = dict(c); d['t'] = round(t, 2); d['story'] = round(sf, 1); d['t30'] = c['t']; out.append(d)
json.dump(out, open('cues_mapped.json', 'w'), indent=0)
for d in out: print(f"{d['t30']:6.2f} -> {d['t']:6.2f}  story {d['story']:7.1f}  {d['sfx']:13s} {d.get('gain_db',0)}")
