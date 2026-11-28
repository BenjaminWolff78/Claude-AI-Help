"""Writes plan.json for 'Why He Took His Car Battery to Bed' from words.json + the shot list below."""
import json, re
W = json.load(open('/home/claude/p15/audio/words.json'))
END = 65.5
# (first word index of the line, number of words, kind, (who, verb, object), speaker)
def idx(t):  # word index of the first word starting at or after t
    return next(i for i, w in enumerate(W) if w['s'] >= t - 0.005)
LINES = [
 (0.00, 9,  "hook",       ("hero", "tucks", "battery"), None),
 (2.56, 10, "hook",       ("hero", "starts", "his car"), None),
 (5.08, 16, "setup",      ("hero", "lugs", "battery"), None),
 (9.10, 10, "quote",      ("foreman", "laughs at", "hero"), "foreman"),
 (12.10, 7, "count",      ("battery", "sleeps by", "stove"), None),
 (13.78, 6, "count",      ("battery", "gets", "blanket"), None),
 (15.32, 12, "escalation", ("hero", "sleeps on", "floor"), None),
 (18.30, 10, "mock",      ("crew", "laughs at", "hero"), None),
 (21.62, 4,  "question",  ("hero", "shrugs over", "coffee"), None),
 (23.10, 20, "fake_out",  ("foreman", "honks at", "hero"), None),
 (28.02, 7,  "turn",      ("narrator", "drops to forty below", "thermometer"), None),
 (30.40, 15, "escalation", ("crew", "turn keys in", "trucks"), None),
 (34.66, 9,  "escalation", ("foreman", "cranks", "giant truck"), None),
 (37.54, 19, "reveal",    ("hero", "carries", "battery"), None),
 (42.72, 2,  "reveal",    ("hero", "starts", "his car"), None),
 (43.60, 9,  "you_see",   ("narrator", "opens", "battery"), None),
 (46.48, 10, "comparison", ("cook", "squeezes", "honey")),
 (49.34, 9,  "mechanism", ("hero", "tests", "frozen battery"), None),
 (52.22, 8,  "mechanism", ("foreman", "pulls", "dipstick"), None),
 (54.52, 9,  "quote",     ("foreman", "asks", "hero"), "foreman"),
 (58.46, 9,  "payoff",    ("hero", "jump-starts", "trucks"), None),
 (61.62, 11, "payoff",    ("foreman", "tucks", "truck battery"), None),
]
lines = []
starts = [idx(r[0]) for r in LINES] + [len(W)]
for k, row in enumerate(LINES):
    t, n, kind, (who, verb, obj) = row[:4]; spk = row[4] if len(row) > 4 else None
    i = starts[k]; ws = W[i:starts[k + 1]]
    if len(ws) != n: print('count', t, n, '->', len(ws), ' '.join(w['w'] for w in ws))
    L = {"t0": ws[0]["s"], "t1": ws[-1]["e"], "kind": kind, "text": " ".join(w["w"] for w in ws), "say": {"who": who, "verb": verb, "object": obj}}
    if spk: L["speaker"] = spk
    lines.append(L)

def S(id, t0, t1, place, size, kind, subject, cast, objects, face, intype, action, text=(), cam=None, angle=None, frames=None, **kw):
    d = {"id": id, "t0": t0, "t1": t1, "place": place, "size": size, "kind": kind, "subject": subject, "cast": cast,
         "objects": objects, "face": face, "in": {"type": intype}, "action": action, "text": list(text)}
    if frames: d["in"]["frames"] = frames
    if cam: d["cam"] = cam
    if angle: d["angle"] = angle
    d.update(kw); return d
shots = [
 S("S1", 0.0, 2.5, "bunk", "MS", "story", "hero", ["hero", "crew"], ["battery", "bunk", "blanket", "stove"], True, "open",
   ["0.0 the hero already pulling a red wool blanket up over the car battery lying on his bunk pillow (the battery ~40% of the width, red and black terminal caps, label readable)",
    "0.9 he tucks the blanket edge under it and pats it twice", "1.6 two bunkmates on the top bunk across lean out to stare, one with playing cards"],
   ["40 LB on the battery label"], cam="push in from MS to MCU, eased, already moving at frame 1"),
 S("S2", 2.5, 5.0, "lot", "WS", "story", "hero", ["hero", "crew"], ["his car", "trucks", "exhaust"], True, "dissolve",
   ["2.5 flash-forward: dawn at forty below, a row of frosted dead trucks, crew stamping their feet beside them",
    "3.3 in the middle the hero's small old car coughs to life: headlights snap on, a puff of exhaust", "4.1 the hero at the wheel through the windshield grins; the crew turn to stare"],
   ["HALVORSEN TIMBER on the truck doors"], cam="slow push along the row toward his running car", frames=6, time_jump=True),
 S("S3", 5.0, 7.4, "lot", "EWS", "aerial", "hero", ["hero"], ["battery", "bunkhouse", "trucks"], False, "dissolve",
   ["5.0 night, high over the logging camp in the pines: the bunkhouse with warm windows, the mess hall, the truck lot under one yard light, log piles, light snow",
    "6.0 the hero, small, crosses the lot from his car to the bunkhouse with the battery in his arms"],
   ["CAMP 9 on the bunkhouse roof"], cam="crane down toward the bunkhouse porch, eased", frames=6, angle=["high"], time_jump=True),
 S("S4", 7.4, 9.1, "lot", "FS", "story", "hero", ["hero"], ["battery", "bunkhouse"], True, "move",
   ["7.4 the hero steps up toward the porch, the battery in both hands at his waist, leaning back with the weight", "8.4 he shifts his grip, breath clouding"],
   ["40 LB on the battery label", "BUNKHOUSE sign over the door"]),
 S("S5", 9.1, 12.1, "lot", "MS", "story", "foreman", ["foreman", "hero"], ["battery", "bunkhouse"], True, "move",
   ["9.1 the foreman on the porch with a steaming mug, blocking the door, already chuckling", "10.2 'Gonna read it a bedtime story too?' arms out, mug sloshing, laughing", "11.3 the hero, 3/4 away, sweat drop, squeezes past him"],
   [], cam="glide from the hero onto a profile two-shot on the porch, then creep", angle=["profile"]),
 S("S6", 12.1, 13.7, "bunk", "MS", "story", "hero", ["hero"], ["battery", "stove", "tally"], True, "dissolve",
   ["12.1 night one: the battery sits on the floor by the glowing wood stove; the hero crouches and warms his hands beside it", "13.0 he chalks one mark on the bunk post"],
   ["I chalked on the bunk post"], frames=6),
 S("S7", 13.7, 15.3, "bunk", "CU", "insert", "hero", ["hero"], ["battery", "blanket", "tally"], False, "dissolve",
   ["13.7 night two, looking down on the mattress: the hero's hands flap a red wool blanket over the battery", "14.6 they smooth it down; the bunk post with two chalk marks at the edge"],
   ["II chalked on the bunk post"], frames=6, time_jump=True),
 S("S8", 15.3, 18.3, "bunk", "MS", "story", "hero", ["hero", "crew"], ["battery", "pillow", "floor", "tally"], True, "dissolve",
   ["15.3 night three: the battery on his pillow under the blanket, a little knit cap on it", "16.4 tilt down: the hero curled on the floor in a sleeping bag", "17.4 bunkmates lean over the top bunk, giggling"],
   ["III chalked on the bunk post"], cam="tilt down from the pillow to the floor, eased", frames=6, time_jump=True),
 S("S9", 18.3, 21.4, "mess", "WS", "story", "crew", ["crew", "hero", "cook"], ["chalkboard", "tables"], True, "dissolve",
   ["18.3 breakfast: long tables of loggers at three depths, plates of pancakes; heads turn as the hero carries his tray in", "19.4 they point and laugh together; the cook laughs behind the counter", "20.4 the chalkboard on the wall: BATTERY BABYSITTER with an arrow"],
   ["BATTERY BABYSITTER chalked on the menu board", "PANCAKES on the menu board"], cam="push along the table toward the hero, eased", frames=6),
 S("S10", 21.4, 23.1, "mess", "CU", "reaction", "hero", ["hero", "crew"], ["coffee"], True, "cut",
   ["21.5 the hero, half-lid calm, sips his coffee", "22.2 'He won't say': a one-shoulder shrug, eyes closed"], [], punch=True),
 S("S11", 23.1, 25.6, "lot", "WS", "story", "crew", ["crew", "hero"], ["trucks", "exhaust", "battery"], True, "dissolve",
   ["23.1 the first cold morning: trucks starting one after another, headlights, exhaust puffs", "24.3 the hero walks to his car with the battery in his arms"],
   ["HALVORSEN TIMBER on the truck doors"], frames=6, time_jump=True, angle=["high"]),
 S("S12", 25.6, 28.0, "lot", "MS", "story", "foreman", ["foreman", "hero"], ["giant truck", "his car", "battery"], True, "move",
   ["25.6 the foreman's giant red truck rolls past the hero bent over his open hood", "26.5 the foreman leans out of the window, honking, laughing", "27.3 the hero straightens, deadpan"],
   [], cam="pan with the truck, then settle on the hero", fast=["foreman"]),
 S("S13", 28.0, 30.4, "lot", "CU", "insert", "hero", ["hero"], ["thermometer"], False, "dissolve",
   ["28.0 night: the porch thermometer, frost creeping over its glass", "28.8 a gloved hand wipes the frost: the red line drops to -40", "29.7 the hand lifts the battery past it to the door"],
   ["-40 on the thermometer"], frames=6, time_jump=True),
 S("S14", 30.4, 32.5, "lot", "WS", "story", "crew", ["crew", "foreman"], ["trucks", "clock"], True, "dissolve",
   ["30.4 dawn at forty below: ice fog, frosted trucks, the crew trudging out in clouds of breath", "31.4 they climb into the cabs, doors slam"],
   ["6:00 on the mess hall clock"], frames=6, time_jump=True),
 S("S15", 32.5, 34.6, "lot", "MS", "story", "crew", ["crew"], ["trucks", "keys"], True, "dissolve",
   ["32.5 tracking along the windshields: a driver turns his key: click, the dash lights dim", "33.4 the next one: click", "34.0 the next: click, he slumps"],
   [], cam="track sideways along the row of windshields", angle=["profile"], frames=6, time_jump=True),
 S("S16", 34.6, 37.4, "lot", "MCU", "story", "foreman", ["foreman"], ["giant truck", "steering wheel"], True, "cut",
   ["34.7 through the giant truck's windshield: the foreman turns the key, smug", "35.6 the truck shudders, one cough of exhaust, dies; his moustache droops", "36.6 his forehead drops onto the wheel: a feeble honk"],
   [], cam="push in through the windshield", angle=["low"], punch=True),
 S("S17", 37.4, 39.9, "lot", "FS", "story", "hero", ["hero", "crew"], ["battery", "bunkhouse"], True, "dissolve",
   ["37.5 the bunkhouse door opens, warm light: the hero walks out with the battery in both arms", "38.6 steam curls off the warm battery in the cold", "39.3 behind him the crew watch from their dead trucks"],
   [], cam="low, tracking backward ahead of him", angle=["low"], frames=6, time_jump=True),
 S("S18", 39.9, 41.8, "lot", "MS", "story", "hero", ["hero", "crew"], ["battery", "his car"], True, "move",
   ["39.9 at his car, hood up: he lowers the steaming battery in", "41.0 hooks the red clamp, then the black"],
   ["COLD CRANKING AMPS on the battery label"], cam="push over his shoulder into the engine bay", angle=["ots"]),
 S("S19", 41.8, 43.5, "lot", "MCU", "story", "hero", ["hero"], ["key", "his car"], True, "cut",
   ["41.9 inside the cabin (cutaway): he turns the brass key on its red string", "42.7 the engine roars first try, the dash lights blaze; he smirks"],
   [], punch=True),
 S("S20", 43.5, 46.4, "lot", "CU", "cutaway", "hero", ["hero"], ["battery", "his car"], True, "cut",
   ["43.5 push into the running engine bay; the battery case slices open: plates and acid, bright reaction streaming between them", "44.8 the hero leans in over the hood, watching"],
   ["COLD CRANKING AMPS on the battery label"], cam="push in, then the slice opens"),
 S("S21", 46.4, 49.3, "mess", "MS", "story", "cook", ["cook", "crew"], ["honey", "fridge", "pancakes"], True, "dissolve",
   ["46.5 the cook pulls a honey bottle out of the fridge and squeezes it over a stack of pancakes", "47.4 nothing comes out: he squeezes with both hands, face straining", "48.4 one slow blob creeps out"],
   ["HONEY on the bottle"], frames=6),
 S("S22", 49.3, 51.7, "lot", "CU", "insert", "hero", ["hero", "foreman"], ["frozen battery", "gauge", "thermometer"], True, "dissolve",
   ["49.4 the hero presses a battery tester onto the foreman's frosted battery", "50.2 the needle swings up and sags below half into WEAK", "51.0 the foreman leans in behind it"],
   ["WEAK / GOOD on the tester dial", "-40 on the porch thermometer behind"], frames=6),
 S("S23", 51.7, 54.5, "lot", "MCU", "story", "foreman", ["foreman", "hero"], ["dipstick", "giant truck"], True, "move",
   ["51.9 the foreman pulls the oil dipstick from his truck", "52.8 the oil hangs off it like cold honey and won't drip", "53.6 his face falls"],
   [], cam="tilt up from the engine to his face"),
 S("S24", 54.5, 58.4, "lot", "MS", "story", "foreman", ["foreman", "hero"], ["his car"], True, "dissolve",
   ["54.5 the foreman shuffles over, hat in his hands", "56.5 'Hey, babysitter, got cables?' fake grin, sweat drop", "57.8 the hero, by his idling car, raises one eyebrow"],
   [], cam="over the hero's shoulder, slow push", angle=["ots"], frames=6, time_jump=True),
 S("S25", 58.4, 61.5, "lot", "EWS", "aerial", "hero", ["hero", "crew"], ["trucks", "cables", "his car"], True, "dissolve",
   ["58.4 by lunch, high over the lot: jumper cables run from his little car to truck after truck", "59.4 engines roar one by one, exhaust puffs down the row", "60.6 the crew cheer"],
   [], frames=6, time_jump=True, angle=["high"], cam="crane down along the cable chain"),
 S("S26", 61.5, 65.5, "bunk", "MS", "payoff", "foreman", ["foreman", "hero", "crew"], ["truck battery", "bunk"], True, "dissolve",
   ["61.6 night: in front, the hero on his bunk beside his tucked battery; behind, the foreman in long johns lugs a giant truck battery to his bunk",
    "62.8 he lays it on his pillow and pulls the blanket up", "64.0 on 'bed' the bunk legs snap: CRASH, the bunk drops, bunkmates jolt up; the hero opens one eye"],
   [], cam="slow push past the hero toward the foreman's bunk", frames=6),
]
plan = {
 "title": "Why He Took His Car Battery to Bed", "fps": 30, "length_s": END, "hero": "hero",
 "home_base": ["lot"], "key_numbers": ["40"],
 "places": {
  "lot": {"desc": "a logging camp in snowy pines: a gravel truck lot under a yard light, a row of crew pickups with HALVORSEN TIMBER doors, the foreman's giant red truck, the hero's small old car, a snowplow, the plank bunkhouse with a porch, a thermometer on the post, the mess hall with a clock, log piles, fuel drums, a sawhorse",
          "light": "night: blue moonlight + one warm yard light + warm windows; day: crisp low winter sun; dawn at forty below: low pink-orange sun through ice fog", "time": "night 5-12 s and 28-30 s; day 23-28 s and 58-61 s; dawn 2.5-5 s and 30-58 s"},
  "bunk": {"desc": "a plank bunkhouse: double bunks with wool blankets, a glowing wood stove with a kettle, long johns and socks drying on a line, boots, a card table with a lantern, a frosted window, axes and a calendar on the wall",
           "light": "warm firelight from the stove + one hanging bulb, cool blue from the window", "time": "night"},
  "mess": {"desc": "the mess hall: long plank tables, benches, plates of pancakes, coffee urn, the cook's counter and an old fridge, a chalk menu board, antlers, windows onto snow",
           "light": "cool morning window light + warm pendant lamps", "time": "morning"},
 },
 "cast": {
  "hero": {"role": "the new guy (hero)", "body": "#e0761f", "look": "orange quilted puffy parka with a zipper, chest pocket and a reflective patch; blue knit beanie with a pompom; brass key on a red string", "lead": True},
  "foreman": {"role": "the foreman (doubter)", "body": "#2e6b3a", "look": "green-and-black buffalo plaid mackinaw, red trapper hat with ear flaps, big grey moustache, suspenders, a steaming mug", "lead": True},
  "crew": {"role": "the loggers / bunkmates", "body": "#7a5a3a", "look": "canvas and wool work jackets, beanies, beards", "lead": False},
  "cook": {"role": "the camp cook", "body": "#c8c2b5", "look": "white apron with a red trim over a striped shirt, paper cap, bald with a beard", "lead": False},
 },
 "lines": lines, "shots": shots,
 "ending": {"event": "the foreman's bunk collapses under his giant truck battery with a crash, the hero watching from his bunk in front", "t": 64.04, "objects": ["truck battery", "bunk"]},
}
json.dump(plan, open('/home/claude/p15/plan/plan.json', 'w'), indent=1)
print(len(lines), 'lines', len(shots), 'shots')
