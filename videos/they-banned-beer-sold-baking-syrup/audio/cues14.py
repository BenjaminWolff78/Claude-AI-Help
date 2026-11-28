"""The sound cue sheet for "They Banned Beer, So He Sold It as Bread Syrup": writes cues14.json (for mix.py) and prints the
sheet (time, what happens, what the music does, the effect, its pan). Times are output seconds (frame / 30)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
BEDS = [  # (start, end, bed, place)
    (0.00, 15.62, "amb_brewery", "brewery"), (15.62, 19.40, "amb_street_day", "office / street by day"),
    (19.40, 30.44, "amb_grocery", "grocery"), (30.44, 32.66, "amb_town_wind", "aerial over the town"),
    (32.66, 43.32, "amb_night", "street at night"), (43.32, 50.96, "amb_cellar", "granny's cellar"),
    (50.96, 53.52, "amb_grocery", "grocery counter"), (53.52, 58.04, "amb_cellar", "granny's cellar"),
    (58.04, 61.28, "amb_grocery", "grocery"), (61.28, 63.44, "amb_night", "street at night"), (63.44, 66.20, "amb_cellar", "the agent's cellar")]
FX = [  # (t, sfx, pan, gain_db, what happens, music)
    (0.00, "syrup_pour", 0.25, -3, "syrup pours from the kettle spout into a can", "the rag starts on frame 1 (F major, 120 BPM)"),
    (0.10, "label_slap", -0.10, 0, "the brewer slaps the FOR BAKING label on", ""),
    (4.27, "can_clink", -0.20, -2, "the third can tops the pyramid", ""),
    (5.53, "barrel_gush", 0.20, 0, "two agents tip a beer barrel into the drain", ""),
    (8.62, "capper", 0.00, -1, "the brewer caps a can on 'syrup'", ""),
    (9.10, "steps_chain", 0.40, -3, "the agent strides in, the chain on his shoulder", ""),
    (15.65, "laugh_desk", 0.00, -1, "the station laughs, a hand slaps the desk", "drops the brushes"),
    (17.80, "chalk", 0.30, -4, "a kid chalks BAKER on the truck door", ""),
    (20.87, "board_flip", 0.35, -2, "the count board flips to 3", "adds a shaker, F-F7-Bb-C7: the build"),
    (22.33, "board_flip", 0.35, 0, "the board flips to 30", ""),
    (23.45, "can_stack", -0.20, -3, "the grocer stacks cans up the wall", ""),
    (28.90, "hand_truck", 0.25, -1, "the brewer wheels in the yeast tower; the top box is caught", ""),
    (30.60, "loaf_rise", 0.00, 0, "the loaf rises beside the steeple", "a held chord and a low tuba"),
    (33.13, "knocks3", 0.10, 0, "the agent knocks three times", "night: D minor tiptoe, no banjo"),
    (34.43, "door_creak", -0.20, -2, "the door swings in on the granny", ""),
    (39.53, "window_rattle", 0.45, -2, "the cellar window rattles and glows", "thins to tuba and pizzicato"),
    (40.43, "pop_big", 0.40, 2, "the cellar window POPS (the turn)", "the unlock stinger on 'pop' (40.46)"),
    (41.53, "pops_chain", -0.30, 0, "the next houses pop, down the street", "the rag comes back, D minor to F"),
    (44.25, "syrup_pour", 0.00, -3, "the granny pours the can into the crock", "the lift: B-flat, a clarinet tune on top"),
    (46.60, "water_plop", 0.10, -2, "water from the bucket, then the yeast cake plops in (47.73)", ""),
    (48.40, "fizz_burp", 0.00, -2, "the crock fizzes, a foam burp on 'burps' (49.34)", ""),
    (51.00, "batter_froth", -0.15, -3, "pancake batter; the can tapped, beer foam froths (52.2)", ""),
    (54.40, "capper", 0.10, -1, "the granny caps a bottle: clack", ""),
    (56.60, "caps_blow", 0.00, 0, "caps blow off one after another", ""),
    (62.60, "bulkhead", 0.20, -1, "the agent hauls open his cellar doors", "the walk home thins out, then four beats climb"),
    (64.90, "final_hit", 0.00, 8, "FINAL HIT on 'baking': the wife's shelf blows its caps in a chain", "the music stops dead on the hit"),
]
STING = (40.46, "stinger")
cues = []
for s, e, bed, _ in BEDS: cues.append({"t": s, "sfx": bed, "amb": True, "dur": round(e - s + (0.3 if e < 66.19 else 0), 2), "gain_db": 0})
for t, nm, pan, g, *_ in FX: cues.append({"t": t, "sfx": nm, "pan": pan, "gain_db": g})
cues.append({"t": STING[0], "sfx": STING[1], "gain_db": 0})
cues.sort(key=lambda c: c["t"])
json.dump(cues, open(os.path.join(HERE, "cues14.json"), "w"), indent=0)
print("| time | what happens | music | effect | pan |"); print("|---|---|---|---|---|")
rows = [(t, w, m, nm, f"{pan:+.2f}") for t, nm, pan, g, w, m in FX] + [(STING[0], "'pop'", "the unlock stinger", "stinger", "centre")]
for s, e, bed, place in BEDS: rows.append((s, f"bed: {place} until {e:.2f} s", "", bed, "stereo"))
for r in sorted(rows, key=lambda r: r[0]): print(f"| {r[0]:.2f} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |")
print(len(FX), "effects,", len(BEDS), "beds, 1 stinger")
