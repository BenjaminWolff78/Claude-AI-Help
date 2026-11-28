"""The sound cue sheet for "Why He Took His Car Battery to Bed": writes cues15.json (for mix.py) and prints the sheet
(time, what happens, music, effect, pan). Times are output seconds (frame / 30)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
BEDS = [(0.00, 2.50, "amb_bunk", "bunkhouse at night"), (2.50, 5.00, "amb_camp_dawn", "dawn at forty below"),
        (5.00, 12.10, "amb_camp_night", "the camp at night"), (12.10, 18.30, "amb_bunk", "bunkhouse, nights one to three"),
        (18.30, 23.10, "amb_mess", "mess hall at breakfast"), (23.10, 28.00, "amb_camp_day", "the first cold morning"),
        (28.00, 30.40, "amb_camp_night", "the night it hits forty below"), (30.40, 46.40, "amb_camp_dawn", "dawn at forty below"),
        (46.40, 49.30, "amb_mess", "the cook and the honey"), (49.30, 58.40, "amb_camp_dawn", "the foreman's truck"),
        (58.40, 61.50, "amb_camp_day", "by lunch"), (61.50, 65.50, "amb_bunk", "that night")]
FX = [  # (t, sfx, pan, gain_db, what happens, music)
    (0.00, "blanket_tuck", -0.20, -2, "he pulls the blanket up over the battery, tucks it, pats it twice", "the folk-rag starts on frame 1 (G, 120 BPM)"),
    (3.20, "car_start", 0.00, 0, "his little car coughs and catches at forty below", ""),
    (5.40, "steps_snow", 0.10, -4, "he lugs the battery across the lot", ""),
    (9.30, "slurp", -0.30, -3, "the foreman slurps his coffee on the porch", ""),
    (11.00, "laugh_foreman", -0.30, -2, "the foreman laughs after his line", ""),
    (11.15, "door_creak", 0.00, -3, "the door swings open; the hero squeezes in", ""),
    (13.15, "chalk", -0.30, -4, "one chalk mark on the bunk post", ""),
    (13.75, "blanket_flap", 0.00, -2, "night two: the blanket flaps over the battery", ""),
    (17.35, "giggle", -0.30, -3, "the bunkmates giggle at him on the floor", ""),
    (19.30, "laugh_room", 0.00, -1, "the mess hall laughs and points", "a shaker joins"),
    (21.50, "sip", 0.00, -4, "he sips his coffee", ""),
    (23.30, "engines_start", -0.30, -2, "the trucks start one after another", ""),
    (24.50, "truck_pull", 0.40, -3, "the foreman's giant truck starts", ""),
    (25.35, "battery_clunk", 0.10, -3, "he sets the battery in the tray", ""),
    (26.50, "honks", 0.30, 0, "the foreman honks at him all the way past", ""),
    (28.80, "frost_wipe", 0.00, -4, "a glove wipes the frost off the thermometer", "a held E minor"),
    (29.20, "sink", 0.00, -5, "the red line sinks to -40", ""),
    (31.40, "doors_slam", -0.20, -2, "the crew slam their doors", "tiptoe in E minor"),
    (33.37, "key_click", -0.30, 0, "click", ""), (33.90, "key_click", -0.10, 0, "click", ""), (34.17, "key_click", 0.15, 0, "click", ""),
    (34.95, "giant_dies", 0.00, 0, "the giant cranks, coughs once and dies", ""),
    (37.20, "honk_feeble", 0.00, -3, "his forehead hits the horn: a feeble honk", ""),
    (37.30, "door_creak", 0.20, -3, "the bunkhouse door opens on warm light", ""),
    (37.60, "steps_snow", 0.10, -5, "the babysitter walks out with the battery", ""),
    (38.60, "steam", 0.00, -4, "steam curls off the warm battery", ""),
    (40.85, "battery_clunk", 0.10, -3, "the battery goes into the tray", ""),
    (41.00, "clamps", 0.10, -2, "red clamp, black clamp", ""),
    (42.25, "car_roar", 0.00, 2, "the engine roars first try", "the unlock stinger on 'turns' (41.86)"),
    (43.60, "reaction", 0.00, -3, "the battery case slices open: the reaction streams between the plates", "the lift: C, a clarinet tune"),
    (46.45, "fridge", 0.20, -3, "the cook pulls the honey from the fridge", ""),
    (47.20, "squeeze", 0.10, -3, "he squeezes: nothing", ""),
    (48.40, "blob", 0.10, -3, "one slow blob creeps out", ""),
    (49.35, "tester", 0.00, -2, "the tester clips on; the needle swings up and sags into WEAK", ""),
    (52.55, "dipstick", 0.00, -3, "the foreman pulls the dipstick", ""),
    (53.10, "goo", 0.00, -4, "the oil hangs off it like cold honey", ""),
    (54.60, "steps_shuffle", 0.30, -4, "the foreman shuffles over, hat in hand", "softer: F-G7"),
    (58.85, "engines_row", 0.00, 0, "by lunch: engine after engine roars down the row", "full: C-F-G7-C"),
    (60.60, "cheer", 0.00, -2, "the crew cheer", ""),
    (61.55, "steps_boards", 0.30, -4, "the foreman lugs his truck battery across the boards", "thins out, then four beats climb"),
    (63.25, "battery_thump", 0.20, -2, "he lays it on his pillow", ""),
    (63.45, "blanket_tuck", 0.20, -3, "and pulls the blanket up", ""),
    (64.04, "final_hit", 0.00, 8, "FINAL HIT on 'bed': the bunk legs snap, the bunk crashes down", "the music stops dead on the hit"),
]
STING = (41.86, "stinger")
cues = []
for s, e, bed, _ in BEDS: cues.append({"t": s, "sfx": bed, "amb": True, "dur": round(e - s + (0.3 if e < 65.4 else 0), 2), "gain_db": 0})
for t, nm, pan, g, *_ in FX: cues.append({"t": t, "sfx": nm, "pan": pan, "gain_db": g})
cues.append({"t": STING[0], "sfx": STING[1], "gain_db": 0})
cues.sort(key=lambda c: c["t"])
json.dump(cues, open(os.path.join(HERE, "cues15.json"), "w"), indent=0)
print("| time | what happens | music | effect | pan |"); print("|---|---|---|---|---|")
rows = [(t, w, m, nm, f"{pan:+.2f}") for t, nm, pan, g, w, m in FX] + [(STING[0], "'turns the key'", "the unlock stinger", "stinger", "centre")]
for s, e, bed, place in BEDS: rows.append((s, f"bed: {place} until {e:.2f} s", "", bed, "stereo"))
for r in sorted(rows, key=lambda r: r[0]): print(f"| {r[0]:.2f} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |")
print(len(FX), "effects,", len(BEDS), "beds, 1 stinger")
