"""Writes plan.json for 'They Banned Beer, So He Sold It as Bread Syrup' from words.json + the shot list below."""
import json
W = json.load(open('/home/claude/p14/audio/words.json'))
lines_txt = [l.strip() for l in open('/home/claude/p14/script.txt') if l.strip()]
END = 66.2
# per line: kind, say(who, verb, object), speaker
LINEMETA = [
 ("hook", ("brewer", "labels", "syrup can"), None),
 ("you_see", ("agent", "dumps", "beer barrel"), None),
 ("setup", ("agent", "brings", "padlock"), None),
 ("quote", ("agent", "sniffs", "syrup can"), "agent"),
 ("quote", ("brewer", "shrugs", "syrup can"), "brewer"),
 ("mock", ("agents", "laugh", "syrup can"), None),
 ("count", ("grocer", "sells", "syrup can"), None),
 ("escalation", ("grocer", "stacks", "syrup wall"), None),
 ("question", ("agent", "squints", "bread shelf"), None),
 ("escalation", ("brewer", "wheels in", "yeast boxes"), None),
 ("setup", ("agent", "knocks", "door"), None),
 ("fake_out", ("granny", "shows", "pie"), None),
 ("turn", ("agent", "jumps", "cellar window"), None),
 ("escalation", ("agent", "spins", "cellar window"), None),
 ("mechanism", ("granny", "pours", "syrup can"), None),
 ("mechanism", ("granny", "drops", "yeast cake"), None),
 ("comparison", ("grocer", "pours", "pancake mix"), None),
 ("count", ("granny", "caps", "bottles"), None),
 ("real_tag", ("grocer", "winks", "syrup can"), None),
 ("payoff", ("wife", "bakes", "bottles"), None),
]
lines = []; i = 0
for txt, (kind, (who, verb, obj), spk) in zip(lines_txt, LINEMETA):
    n = len(txt.split()); ws = W[i:i + n]; i += n
    L = {"t0": ws[0]["s"], "t1": ws[-1]["e"], "kind": kind, "text": txt, "say": {"who": who, "verb": verb, "object": obj}}
    if spk: L["speaker"] = spk
    lines.append(L)
# p14 previz round 2: three sentences span two shots that show different things; each half gets its own say-see line
# (line index, words in the first half, kind/say of the second half)
SPLITS = [(19, 8, "payoff", ("wife", "bakes", "bottles")), (12, 7, "turn", ("agent", "jumps", "cellar window")), (9, 6, "escalation", ("narrator", "shows", "giant loaf")), (5, 4, "escalation", ("brewer", "is called", "truck")), (1, 9, "setup", ("brewer", "caps", "syrup can"))]   # last line first (each split shifts the later indexes)
for li, na, kind2, (w2, v2, o2) in SPLITS:
    L = lines[li]; i0 = sum(len(t.split()) for t in lines_txt[:li]); ws = W[i0:i0 + len(L["text"].split())]
    A = dict(L, t1=ws[na - 1]["e"], text=" ".join(L["text"].split()[:na]))
    B = {"t0": ws[na]["s"], "t1": ws[-1]["e"], "kind": kind2, "text": " ".join(L["text"].split()[na:]), "say": {"who": w2, "verb": v2, "object": o2}}
    if li == 19: A["kind"] = "setup"; A["say"] = {"who": "agent", "verb": "opens", "object": "cellar door"}
    if li == 12: A["say"] = {"who": "agent", "verb": "says sorry to", "object": "granny"}   # "He says sorry, backs down the steps," / "and her cellar goes pop."
    lines[li:li + 1] = [A, B]
# the comparison line is split so the pancake mix shot carries it; the hook's split etc. handled by shots
def S(id, t0, t1, place, size, kind, subject, cast, objects, face, intype, action, text=(), cam=None, angle=None, frames=None, **kw):
    d = {"id": id, "t0": t0, "t1": t1, "place": place, "size": size, "kind": kind, "subject": subject, "cast": cast,
         "objects": objects, "face": face, "in": {"type": intype}, "action": action, "text": list(text)}
    if frames: d["in"]["frames"] = frames
    if cam: d["cam"] = cam
    if angle: d["angle"] = angle
    d.update(kw); return d
shots = [
 S("S1", 0.0, 2.6, "brewery", "MS", "story", "brewer", ["brewer"], ["syrup can", "kettle", "label"], True, "open",
   ["0.0 brewer already slapping a red FOR BAKING label on a can as thick brown syrup pours from the kettle spout into the next can",
    "1.2 he slides the labelled can down the line and grabs the next", "2.0 steam rolls past"],
   ["FOR BAKING on the can"], cam="push in from MS to MCU, eased, already moving at frame 1"),
 S("S2", 2.6, 5.36, "brewery", "MCU", "story", "brewer", ["brewer"], ["syrup can", "wall sign"], True, "move",
   ["2.6 glide right and up past the brewer to the big wall sign: BEER crossed out in red paint, BAKING SYRUP lettered under it",
    "3.6 the brewer, below, stacks three cans into a pyramid", "4.6 he taps the top can, deadpan"],
   ["BAKING SYRUP wall sign", "HOLLOW CREEK BREWING CO."], cam="glide right 0.5 m and tilt up, then settle back on the brewer"),
 S("S3", 5.36, 7.52, "brewery", "WS", "story", "agent", ["agent", "agents", "brewer"], ["beer barrel", "floor drain", "padlock"], True, "move",
   ["5.4 two agents tip a beer barrel over the floor drain, foam gushing", "6.4 the lead agent stands over them, padlock and chain on his shoulder",
    "7.0 the brewer at the back keeps filling cans"],
   ["CLOSED BY ORDER notice on the big door"], cam="pull back from the brewer into the wide, eased, high angle", angle=["high"]),
 S("S4", 7.52, 9.10, "brewery", "MS", "story", "brewer", ["brewer", "agent"], ["syrup can", "kettle"], True, "move",
   ["7.5 glide past the barrels onto the brewer filling cans at the kettle, calm", "8.6 he caps a can on 'syrup'"],
   ["FOR BAKING on the can"], cam="glide left 0.6 m from the barrel to the brewer"),
 S("S5", 9.10, 12.32, "brewery", "MS", "story", "agent", ["agent", "brewer"], ["padlock", "syrup can", "hop sacks"], True, "move",
   ["9.1 the agent strides in with the padlock and chain", "10.3 he stops beside the brewer, who doesn't look up", "11.6 the brewer keeps canning; the agent picks up a can"],
   ["HOPS on the sacks behind"], cam="truck with the agent's walk, then settle on the two-shot, profile", angle=["profile"]),
 S("S6", 12.32, 14.60, "brewery", "CU", "story", "agent", ["agent", "brewer"], ["syrup can", "hop sacks"], True, "move",
   ["12.3 over the brewer's shoulder: the agent sniffs the open can, brows up", "12.9 he plucks a hop cone off the lid on 'hops'", "13.6 'Who bakes with hops?' arms out, mocking grin"],
   ["FOR BAKING on the can"], cam="slow push from the profile two-shot round to his face, the brewer canning behind him, then creep"),
 S("S7", 14.60, 15.62, "brewery", "CU", "reaction", "brewer", ["brewer"], ["syrup can"], True, "cut",
   ["14.7 the brewer, half-lid deadpan, shrugs one shoulder: 'It's for baking.'"], [], punch=True),
 S("S8", 15.62, 17.16, "mainstreet", "MS", "story", "agents", ["agent", "agents"], ["syrup can", "office window"], True, "dissolve",
   ["15.6 through the office window: three agents laughing, one slaps the desk, the lead agent holds up the can"],
   ["PROHIBITION AGENTS painted on the window"], frames=6),
 S("S9", 17.16, 19.40, "mainstreet", "FS", "story", "brewer", ["brewer", "townsfolk"], ["syrup crate", "truck"], True, "dissolve",
   ["17.2 dissolve to the street, days later: the brewer walks the sidewalk carrying a crate of cans", "18.0 a kid chalks BAKER on his truck door; townsfolk point and laugh", "18.8 the brewer tips his cap, deadpan"],
   ["BAKER chalked on the truck"], cam="a slow truck along the sidewalk with the brewer, eased", frames=6, time_jump=True),
 S("S10", 19.40, 21.94, "grocery", "MS", "story", "grocer", ["grocer", "townsfolk"], ["syrup can", "count board"], True, "dissolve",
   ["19.4 the grocer puts 3 cans on the shelf", "20.6 a woman buys one; the board on the wall reads SYRUP SOLD 3"],
   ["SYRUP SOLD 3 on the board"], frames=6),
 S("S11", 21.94, 23.38, "grocery", "MS", "story", "grocer", ["grocer", "townsfolk"], ["syrup can", "count board"], True, "dissolve",
   ["21.9 same framing, a week later: the board flips to 30, three customers with cans"], ["SYRUP SOLD 30 on the board"], frames=6, time_jump=True),
 S("S12", 23.38, 25.58, "grocery", "WS", "story", "grocer", ["grocer", "townsfolk", "wife"], ["syrup wall"], True, "dissolve",
   ["23.4 a whole wall of syrup cans to the ceiling, the grocer up a ladder stacking", "24.4 a queue of customers with baskets; a woman in a teal dress (the agent's wife) loads her basket"],
   ["MALT SYRUP FOR BAKING sign over the wall"], frames=6, time_jump=True, angle=["low"]),
 S("S13", 25.58, 27.46, "grocery", "CU", "insert", None, [], ["flour sacks", "spider"], False, "move",
   ["25.6 glide right to the flour sacks next to the wall: dusty, a cobweb, a spider walks across FLOUR"], ["FLOUR on the sacks"]),
 S("S14", 27.46, 28.50, "grocery", "CU", "reaction", "agent", ["agent"], ["bread shelf"], True, "cut",
   ["27.5 the agent in the doorway, squinting at the empty bread shelf, notepad up"], []),
 S("S15", 28.50, 30.44, "grocery", "MS", "story", "brewer", ["brewer", "grocer"], ["yeast boxes"], True, "move",
   ["28.5 the brewer himself wheels in a tower of YEAST boxes on a hand truck", "29.5 the grocer catches the wobbling top box"],
   ["YEAST FOR BREAD on the boxes", "HOLLOW CREEK BREWING on the hand truck"]),
 S("S16", 30.44, 32.66, "mainstreet", "EWS", "aerial", "townsfolk", ["townsfolk"], ["giant loaf", "church"], False, "dissolve",
   ["30.4 high over the town: a loaf of bread as big as the church rises beside the steeple", "31.5 tiny townsfolk stare up"], [], frames=6, angle=["high"]),
 S("S17", 32.66, 34.42, "mainstreet", "MS", "story", "agent", ["agent"], ["door"], True, "dissolve",
   ["32.7 night: from the street behind him, the agent on granny's porch knocks hard three times"], [], frames=6, time_jump=True),
 S("S18", 34.42, 37.64, "mainstreet", "MS", "story", "granny", ["granny", "agent"], ["door", "pie", "flour"], True, "move",
   ["34.4 the door opens: a granny with flour on her hands and a rolling pin", "35.6 over the agent's shoulder, she holds up a fresh pie, proud", "36.8 push past her: a kitchen with loaves cooling"],
   [], cam="over-shoulder, then a slow push past the granny into the kitchen", angle=["ots"]),
 S("S19", 37.64, 40.30, "mainstreet", "FS", "story", "agent", ["agent", "granny"], ["steps", "cellar window"], True, "move",
   ["37.6 the agent backs down the steps tipping his hat, sweat drop", "38.8 the granny waves, the brass key on a red string at her neck", "39.6 the cellar window by the steps glows and rattles"],
   [], cam="pull back and down to a low street angle as he backs down", angle=["low"]),
 S("S20", 40.30, 41.02, "mainstreet", "MS", "story", "agent", ["agent"], ["cellar window", "foam"], True, "cut",
   ["40.4 the cellar window bursts: a cap pings off, foam sprays the glass; the agent jumps, hat up"], [], punch=True, chain=True),
 S("S21", 41.02, 42.08, "mainstreet", "FS", "story", "agent", ["agent"], ["cellar window", "foam"], True, "cut",
   ["41.0 whip right: the next house's cellar window pops, foam; the agent spins"], [], chain=True),
 S("S22", 42.08, 43.32, "mainstreet", "WS", "story", "agent", ["agent", "townsfolk"], ["cellar window", "foam"], True, "move",
   ["42.1 crane up: down the whole street cellar windows pop one after another, foam fountains, lights coming on", "42.8 the agent turning in the middle"],
   [], chain=True, angle=["high"]),
 S("S23", 43.32, 46.56, "cellar", "MS", "cutaway", "granny", ["granny"], ["syrup can", "crock"], True, "dissolve",
   ["43.3 dissolve down into the sliced-open cellar under the street: the granny pours a can into a crock", "44.2 the can turns to the lens: PURE MALT EXTRACT", "45.5 the syrup ribbons thick and slow"],
   ["PURE MALT EXTRACT on the can"], cam="settle down into the cellar cutaway, then creep", frames=6),
 S("S24", 46.56, 48.36, "cellar", "CU", "insert", "granny", ["granny"], ["crock", "yeast cake", "water"], True, "move",
   ["46.6 looking down into the crock over the rim, the granny above it: water sloshes in from her bucket", "47.7 a yeast cake drops in from her hand"], ["YEAST on the cake wrapper"], angle=["high"]),
 S("S25", 48.36, 50.96, "cellar", "MCU", "story", "granny", ["granny"], ["crock", "bubbles"], True, "move",
   ["48.4 the crock starts to fizz, bubbles rising, a burp of foam on 'burps'", "49.8 foam crowns the rim; the granny leans in, sniffs, delighted"], []),
 S("S26", 50.96, 53.52, "grocery", "MS", "story", "grocer", ["grocer"], ["pancake mix", "syrup can", "water jug"], True, "dissolve",
   ["51.0 at the counter the grocer pours water into a PANCAKE MIX box bowl: batter", "52.2 he holds the syrup can up beside it and taps it: beer foam froths out of his jug"],
   ["PANCAKE MIX JUST ADD WATER on the box"], frames=6),
 S("S27", 53.52, 55.50, "cellar", "MS", "story", "granny", ["granny"], ["bottles", "capper"], True, "dissolve",
   ["53.5 shelves of brown bottles, a chalk 45 on the beam", "54.4 the granny caps a bottle with a hand capper: clack"], ["45 chalked on the beam"], frames=6),
 S("S28", 55.50, 58.04, "cellar", "MCU", "story", "granny", ["granny"], ["bottles", "caps"], True, "move",
   ["55.5 she caps another; the bottles behind her start to hiss", "56.6 caps blow off one after another and ping off the ceiling, foam", "57.4 she ducks under her rolling pin"],
   [], cam="push in slowly as the caps start popping"),
 S("S29", 58.04, 61.28, "grocery", "MCU", "story", "grocer", ["grocer", "townsfolk"], ["syrup can", "wink poster"], True, "dissolve",
   ["58.0 the grocer hands a can across the counter", "59.6 he leans in and winks on 'wink'; behind him a poster of a winking grocer"],
   ["poster: MALT SYRUP FOR BAKING with a winking grocer"], frames=6, cam="slow push in"),
 S("S30", 61.28, 63.44, "mainstreet", "MS", "story", "agent", ["agent"], ["cellar door", "key"], True, "dissolve",
   ["61.3 night: the agent trudges up to his own house", "62.5 he hauls open the slanted cellar doors; the brass key on its red string swings in the lock; light spills up"],
   [], frames=6, cam="follow him in, then tilt down to the cellar doors"),
 S("S31", 63.44, 66.20, "cellar", "MS", "payoff", "wife", ["wife", "agent"], ["bottles", "crocks", "foam"], True, "dissolve",
   ["63.4 dissolve to the foot of the cellar steps, over the agent's shoulder: his wife among crocks and bottles, flour on her cheek, rolling pin up, beaming",
    "64.9 on 'baking' the whole shelf blows its caps in a chain, foam fountains over her; the agent's hat flies off"],
   [], cam="dissolve to the bottom of the steps behind the agent, settle on the over-shoulder, creep", angle=["ots"], frames=6),
]
plan = {
 "title": "They Banned Beer, So He Sold It as Bread Syrup", "fps": 30, "length_s": END, "hero": "brewer",
 "home_base": ["grocery", "mainstreet"], "key_numbers": ["3", "30", "45"],
 "places": {
  "brewery": {"desc": "a red-brick 1920s brewhouse: a big copper kettle with a spout over a canning line, stacked barrels, hop sacks, pipes and gauges, tall arched windows, a big BEER wall sign crossed out and relettered BAKING SYRUP, a floor drain, the big street door with a federal CLOSED notice", "light": "warm amber from the kettle lamps plus low morning sun shafts through the windows", "time": "day"},
  "grocery": {"desc": "a small-town 1920s grocery: wooden counter with a brass register, shelves of tins and jars, a whole wall of syrup cans, flour sacks, a bread shelf, a chalk count board, hanging lamps, a big front window onto Main Street", "light": "warm daylight through the front window plus hanging pendant lamps", "time": "day"},
  "mainstreet": {"desc": "a small-town main street: brick shops with awnings, the Prohibition agents' office window, row houses with porches, steps and cellar windows at the sidewalk, street lamps, a white church with a steeple at the end", "light": "day: sunny late morning; night: blue moonlight with warm windows and street lamps", "time": "day; night from 32.7 s"},
  "cellar": {"desc": "a stone cellar under a house: shelves of brown bottles, crocks with cloth covers, a hand capper, a bucket, a bare bulb, steps up to slanted doors; seen as a cutaway slice under the street at 43 s", "light": "one bare bulb, warm, with cool spill from the steps", "time": "night"}
 },
 "cast": {
  "brewer": {"role": "the brewer (hero)", "body": "#2f6b45", "look": "flat cap, thick moustache, green rubber apron over a mustard shirt, sleeve garters, bow tie", "lead": True, "distinct": "stout, flat cap, green apron"},
  "agent": {"role": "the Prohibition agent (doubter)", "body": "#2b3550", "look": "navy three-piece suit, grey fedora with a black band, badge on the lapel, pencil moustache, notepad", "lead": True, "distinct": "tall and thin, fedora, navy suit"},
  "agents": {"role": "the other agents", "body": "#3d3f46", "look": "grey suits, a bowler and a cap", "lead": False},
  "grocer": {"role": "the grocer", "body": "#8a2d2d", "look": "maroon vest over a red-striped shirt, centre-parted hair, handlebar moustache, sleeve garters", "lead": False},
  "granny": {"role": "a granny", "body": "#8f7ab8", "look": "lilac dress, white-trimmed apron dusted with flour, grey hair bun, round glasses, brass key on a red string", "lead": False},
  "wife": {"role": "the agent's wife", "body": "#1f8a8a", "look": "teal dress, red bob, apron", "lead": False},
  "townsfolk": {"role": "townsfolk", "body": "#7a6a55", "look": "1920s coats and hats", "lead": False}
 },
 "lines": lines, "shots": shots,
 "ending": {"event": "the wife's cellar shelf blows its caps in a chain and foam fountains over her, the agent's hat flies off", "t": 64.9, "objects": ["bottles", "foam"]}
}
json.dump(plan, open('/home/claude/p14/plan/plan.json', 'w'), indent=1)
print(len(lines), 'lines', len(shots), 'shots')
