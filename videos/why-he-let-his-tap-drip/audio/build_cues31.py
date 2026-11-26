"""The v31 cue sheet: the v30 cues mapped through the story frames (map_cues.py), then the v31 changes: pans, ambience beds per
place, the shot 10 whip, the ending (steps, the swing, the slam = the biggest hit, the icicles, the snow), no laugh SFX on the acted
'Haha', no night_long one-shots (the beds replace them)."""
import json, numpy as np
s31 = np.array(json.load(open('/home/claude/p13/v31/remap.json'))['story'], float); o31 = np.arange(len(s31))
T = lambda sf: round(float(np.interp(sf, s31, o31)) / 30, 2)
src = json.load(open('cues_mapped.json'))
PAN = {"gate_squeak": -0.4, "plink": 0.1, "plunk": 0.1, "pipe_burst": 0.35, "spray": 0.45, "whoosh_soft": 0.0, "ticks": -0.45, "ratchet": -0.2,
       "tap_squeak": -0.15, "bucket_slide": 0.15, "laugh_small": -0.35, "snow_step": 0.25, "page": 0.0, "thud": -0.3, "crowd_laugh": 0.0,
       "slurp": 0.3, "ice_creak": 0.2, "rattle": 0.1, "taps": 0.0, "splash": -0.3, "wood_crack": -0.2, "squelch": 0.0, "splat": 0.25,
       "stinger": 0.0}
cues = []
for c in src:
    if c['sfx'] in ('night_long',): continue                      # replaced by the beds
    if c['sfx'] == 'laugh_small' and c['story'] > 780: continue   # the voice acts the "Haha"
    if c['sfx'] == 'whoosh_soft' and abs(c['story'] - 786) < 1: c['t'] = T(760)   # the shot 9 -> 10 whip moved to 760-779
    d = {"t": c['t'], "sfx": c['sfx'], "gain_db": c.get('gain_db', 0)}
    if c['sfx'] in PAN and c['sfx'] not in ('crowd_laugh', 'stinger'): d['pan'] = PAN[c['sfx']]
    if c['sfx'] == 'spray' and c['story'] > 1000: d['pan'] = -0.35   # shot 12: his kitchen wall sprays to the left of frame
    cues.append(d)
# the ending (story frames: walk 1862-1886, swing down HIT-5, the slam HIT = 1954)
cues += [{"t": T(1866), "sfx": "snow_step", "gain_db": -9, "pan": -0.3}, {"t": T(1875), "sfx": "snow_step", "gain_db": -8, "pan": -0.2},
         {"t": T(1884), "sfx": "snow_step", "gain_db": -8, "pan": -0.1},
         {"t": T(1948), "sfx": "mallet_swing", "gain_db": -6, "pan": 0.1},
         {"t": T(1954), "sfx": "slam", "gain_db": 11, "pan": 0.0},          # the biggest hit of the video, on "yard"
         {"t": T(1954) + 0.01, "sfx": "snow_poof", "gain_db": -3, "pan": -0.15},
         {"t": T(1954) + 0.02, "sfx": "ice_shatter", "gain_db": 1}]      # stereo: the window icicles
# ambience beds, one per place (output seconds of the shot starts), 0.15 s overlaps so they crossfade
B = [("amb_kitchen_night", 0.0, 2.32, -1), ("amb_thaw", 2.32, 4.46, 0), ("amb_kitchen_night", 4.46, 9.24, -1), ("amb_night_out", 9.24, 15.92, 0),
     ("amb_morning", 15.92, 18.10, -1), ("amb_night_out", 18.10, 20.85, 0), ("amb_kitchen_night", 20.85, 25.32, -1), ("amb_night_out", 25.32, 28.44, 0),
     ("amb_kitchen_night", 28.44, 32.49, 0), ("amb_thaw", 32.49, 57.19, 0), ("amb_night_out", 57.19, 66.0, 1)]
for nm, a, b, g in B:
    t0 = max(0.0, a - 0.15); cues.append({"t": round(t0, 2), "sfx": nm, "amb": True, "dur": round(min(66.0, b + 0.15) - t0, 2), "gain_db": g})
cues.sort(key=lambda c: c['t'])
json.dump(cues, open('/home/claude/p13/audio/cues_v31.json', 'w'), indent=0)
print(len(cues), 'cues; slam at', T(1954))
