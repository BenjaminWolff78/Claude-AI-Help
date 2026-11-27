# Checkpoint 2: the plan (They Banned Beer, So He Sold It as Bread Syrup)

**0 FAIL** (plan_check: 0 FAIL, 0 WARN). Voice gate before it: script_check --words 0 FAIL (65.2 s, 4.50 syl/s), voice_cuts 0 hits.

## Voice (step 3)
- Take 1: 237 words, 78.7 s raw, 3.72 syl/s. Take 2 (the 217-word cut): 75.6 s raw and even slower, so it was not used.
- Per your choice: take 1 had 28 pauses shortened to 0.08 s, with word endings kept (a lost 's' in "pops" was caught and fixed), then one whole-file tempo of 1.12.
- Result: 65.2 s, 4.50 syl/s, all 237 words match the script. Cost: 2 takes, 2,596 ElevenLabs credits.

## plan_check.py

| # | Check | Value | Target (Rick) | Verdict | Where |
|---|---|---|---|---|---|
| P1 | Shots tile the timeline, fields valid | 31 shots; gaps/overlaps: 0; bad fields: 0 | no gap or overlap; size, kind, in.type and place from the schema | PASS |  |
| P2 | Shot rhythm | 4.5 set-ups per 10 s; median 2.2 s; under 1 s outside chains: 0; sub-1 s run 1; shots over 4 s without a camera move: 0 | Rick ~3-4.5 set-ups per 10 s (Pink Prison 20 in 65 s), 4-6 per 10 s once moves inside shots are counted; every shot over 4 s has a planned move ("cam"); under 1 s only inside a chain, at most 3 | PASS |  |
| P3 | Shot changes | 2 hard cuts, 10 dissolves, 18 moves | cuts at most 4 and only on a punchline/impact/reaction; a new place or time = a 4-8 frame dissolve or a move that rides/passes through something; whips stay in one place | PASS |  |
| P4 | A readable face at least every 4 s | stretches without a face: 0; inserts over 2.5 s: 0 | never 4 s without a face except inserts (1-2.5 s), a cutaway/aerial/POV or the payoff spectacle | PASS |  |
| P5 | Say-see: every line on screen | 20 lines, 0 misses | who, verb and object of each line in the shot under it; quotes on the speaker in close-up | PASS |  |
| P6 | Hook frame | shot S1: cast ['brewer'], objects ['syrup can', 'kettle', 'label']; hook line ends 5.0 s | frame 1 shows the hook's doer doing the act to the named object, face readable; hook ends by 6 s | PASS |  |
| P7 | Places and home base | 4 places; home base 54% of the runtime in 3 stretches | Rick 3-9 places; home base 40-70% and returned to; every place has one light and time of day | PASS |  |
| P8 | Inserts and in-world text | 2 inserts; 20 painted/printed texts; numbers said but not shown: 0 | Rick: 3-8 object inserts (hands in frame, lit like the set); 6-15 signs/screens/labels naming the key words; each key number (key_numbers) printed on an object when it is said | PASS |  |
| P9 | Ending | event 'the wife's cellar shelf blows its caps in a chain ' at 64.9 s; last shot S31 2.8 s | the video ends ON the payoff event, on the last key word, with the biggest sound hit (Rick: a 1-2 s punch like the rage burst or the fireball); the story object in the last shot | PASS |  |
| P10 | Cast | 7 roles; closest leads: brewer vs agent: 82 deg, lightness 0.06 apart; speakers seen once: none | leads 45+ degrees of hue apart or clearly lighter/darker (two whites only with a different silhouette + hair/hat, declared as "distinct"); everyone who speaks appears in 2+ shots; roles, not names | PASS |  |
| P11 | Shot variety | 17 sizes/kinds/angles; special: ['aerial', 'cutaway']; repeated framings: none | never two shots in a row with the same place, size and subject; 7+ sizes/kinds/angles incl. at least one POV, cutaway or aerial (most Nov Shorts have two) | PASS |  |
| P12 | Calm stretches | 4 shots of 3 s or more | Rick 3-9 (median 5) stretches of 3 s+ where the camera only drifts and people act inside the shot | PASS |  |
| P13 | Story beats | hook@0%, you_see@8%, setup@14%, quote@19%, mock@24%, count@29%, escalation@35%, question@41%, fake_out@55%, turn@57%, mechanism@65%, comparison@77%, real_tag@88%, payoff@93% | hook first; "You see," or a bridge question; a fake-out or turn at 35-75% (Samurai 41%, Instinct 45%, Mine Salting 50%, Pink 66%, Prisoner 67%, Railroads 70%); a quoted doubter; ends on payoff/twist/callback | PASS |  |
| P14 | Comparisons acted by our cast | 1 comparisons; object-only: none | at most 2; each acted by the story's own characters (the cook blows on his soup), the object alone only as a follow-up insert | PASS |  |

0 FAIL, 0 WARN

## Shot list

| Shot | Time | Place | Size/kind | In | Who and what |
|---|---|---|---|---|---|
| S1 | 0.0-2.6 | brewery | MS story | open | 0.0 brewer already slapping a red FOR BAKING label on a can as thick brown syrup pours from the kettle spout into the next can / 1.2 he slides the labelled can down the line and grabs the next / 2.0 steam rolls past; text: FOR BAKING on the can |
| S2 | 2.6-5.4 | brewery | MCU story | move | 2.6 glide right and up past the brewer to the big wall sign: BEER crossed out in red paint, BAKING SYRUP lettered under it / 3.6 the brewer, below, stacks three cans into a pyramid / 4.6 he taps the top can, deadpan; text: BAKING SYRUP wall sign, HOLLOW CREEK BREWING CO. |
| S3 | 5.4-7.5 | brewery | WS story high | move | 5.4 two agents tip a beer barrel over the floor drain, foam gushing / 6.4 the lead agent stands over them, padlock and chain on his shoulder / 7.0 the brewer at the back keeps filling cans; text: CLOSED BY ORDER notice on the big door |
| S4 | 7.5-9.1 | brewery | MS story | move | 7.5 glide past the barrels onto the brewer filling cans at the kettle, calm / 8.6 he caps a can on 'syrup'; text: FOR BAKING on the can |
| S5 | 9.1-12.3 | brewery | MS story profile | move | 9.1 the agent strides in with the padlock and chain / 10.3 he stops beside the brewer, who doesn't look up / 11.6 the brewer keeps canning; the agent picks up a can; text: HOPS on the sacks behind |
| S6 | 12.3-14.6 | brewery | CU story ots | move | 12.3 over the brewer's shoulder: the agent sniffs the open can, brows up / 12.9 he plucks a hop cone off the lid on 'hops' / 13.6 'Who bakes with hops?' arms out, mocking grin; text: FOR BAKING on the can |
| S7 | 14.6-15.6 | brewery | CU reaction | cut | 14.7 the brewer, half-lid deadpan, shrugs one shoulder: 'It's for baking.' |
| S8 | 15.6-17.2 | mainstreet | MS story | dissolve 6f | 15.6 through the office window: three agents laughing, one slaps the desk, the lead agent holds up the can; text: PROHIBITION AGENTS painted on the window |
| S9 | 17.2-19.4 | mainstreet | FS story | move | 17.2 glide along the sidewalk with the brewer carrying a crate of cans / 18.0 a kid chalks BAKER on his truck door; townsfolk point and laugh / 18.8 the brewer tips his cap, deadpan; text: BAKER chalked on the truck |
| S10 | 19.4-21.9 | grocery | MS story | dissolve 6f | 19.4 the grocer puts 3 cans on the shelf / 20.6 a woman buys one; the board on the wall reads SYRUP SOLD 3; text: SYRUP SOLD 3 on the board |
| S11 | 21.9-23.4 | grocery | MS story | dissolve 6f | 21.9 same framing, a week later: the board flips to 30, three customers with cans; text: SYRUP SOLD 30 on the board |
| S12 | 23.4-25.6 | grocery | WS story low | dissolve 6f | 23.4 a whole wall of syrup cans to the ceiling, the grocer up a ladder stacking / 24.4 a queue of customers with baskets; a woman in a teal dress (the agent's wife) loads her basket; text: MALT SYRUP FOR BAKING sign over the wall |
| S13 | 25.6-27.5 | grocery | CU insert | move | 25.6 glide right to the flour sacks next to the wall: dusty, a cobweb, a spider walks across FLOUR; text: FLOUR on the sacks |
| S14 | 27.5-28.5 | grocery | CU reaction | move | 27.5 the agent in the doorway, squinting at the empty bread shelf, notepad up |
| S15 | 28.5-30.4 | grocery | MS story | move | 28.5 the brewer himself wheels in a tower of YEAST boxes on a hand truck / 29.5 the grocer catches the wobbling top box; text: YEAST FOR BREAD on the boxes, HOLLOW CREEK BREWING on the hand truck |
| S16 | 30.4-32.7 | mainstreet | EWS aerial high | dissolve 6f | 30.4 high over the town: a loaf of bread as big as the church rises beside the steeple / 31.5 tiny townsfolk stare up |
| S17 | 32.7-34.4 | mainstreet | MS story profile | dissolve 6f | 32.7 night: the agent on a porch knocks hard three times, street lamp behind |
| S18 | 34.4-37.6 | mainstreet | MS story ots | move | 34.4 the door opens: a granny with flour on her hands and a rolling pin / 35.6 over the agent's shoulder, she holds up a fresh pie, proud / 36.8 push past her: a kitchen with loaves cooling |
| S19 | 37.6-40.3 | mainstreet | FS story low | move | 37.6 the agent backs down the steps tipping his hat, sweat drop / 38.8 the granny waves, the brass key on a red string at her neck / 39.6 the cellar window by the steps glows and rattles |
| S20 | 40.3-41.0 | mainstreet | MS story | cut | 40.4 the cellar window bursts: a cap pings off, foam sprays the glass; the agent jumps, hat up |
| S21 | 41.0-42.1 | mainstreet | FS story | whip | 41.0 whip right: the next house's cellar window pops, foam; the agent spins |
| S22 | 42.1-43.3 | mainstreet | WS story high | move | 42.1 crane up: down the whole street cellar windows pop one after another, foam fountains, lights coming on / 42.8 the agent turning in the middle |
| S23 | 43.3-46.6 | cellar | MS cutaway | through | 43.3 the camera sinks through the sidewalk into the sliced-open cellar: the granny pours a can into a crock / 44.2 the can turns to the lens: PURE MALT EXTRACT / 45.5 the syrup ribbons thick and slow; text: PURE MALT EXTRACT on the can |
| S24 | 46.6-48.4 | cellar | CU insert top | move | 46.6 top-down: water sloshes in from a bucket / 47.7 a yeast cake drops in with her hand; text: YEAST on the cake wrapper |
| S25 | 48.4-51.0 | cellar | MCU story | move | 48.4 the crock starts to fizz, bubbles rising, a burp of foam on 'burps' / 49.8 foam crowns the rim; the granny leans in, sniffs, delighted |
| S26 | 51.0-53.5 | grocery | MS story | dissolve 6f | 51.0 at the counter the grocer pours water into a PANCAKE MIX box bowl: batter / 52.2 he holds the syrup can up beside it and taps it: beer foam froths out of his jug; text: PANCAKE MIX JUST ADD WATER on the box |
| S27 | 53.5-55.5 | cellar | MS story | dissolve 6f | 53.5 shelves of brown bottles, a chalk 45 on the beam / 54.4 the granny caps a bottle with a hand capper: clack; text: 45 chalked on the beam |
| S28 | 55.5-58.0 | cellar | MCU story | move | 55.5 she caps another; the bottles behind her start to hiss / 56.6 caps blow off one after another and ping off the ceiling, foam / 57.4 she ducks under her rolling pin |
| S29 | 58.0-61.3 | grocery | MCU story | dissolve 6f | 58.0 the grocer hands a can across the counter / 59.6 he leans in and winks on 'wink'; behind him a poster of a winking grocer; text: poster: MALT SYRUP FOR BAKING with a winking grocer |
| S30 | 61.3-63.4 | mainstreet | MS story | dissolve 6f | 61.3 night: the agent trudges up to his own house / 62.5 he hauls open the slanted cellar doors; the brass key on its red string swings in the lock; light spills up |
| S31 | 63.4-66.2 | cellar | MS payoff ots | through | 63.4 down the steps past the agent's shoulder: his wife among crocks and bottles, flour on her cheek, rolling pin up, beaming / 64.9 on 'baking' the whole shelf blows its caps in a chain, foam fountains over her; the agent's hat flies off |

## Scenes and places

| Place | Light | Screen time |
|---|---|---|
| brewery | warm amber from the kettle lamps plus low morning sun shafts through the windows | 15.6 s (24%) |
| grocery (home base) | warm daylight through the front window plus hanging pendant lamps | 16.8 s (25%) |
| mainstreet (home base) | day: sunny late morning; night: blue moonlight with warm windows and street lamps | 18.8 s (28%) |
| cellar | one bare bulb, warm, with cool spill from the steps | 14.9 s (23%) |
The home bases are the grocery and Main Street: 53% of the runtime together, returned to 3 times. The brewery carries the opening scene (0-15.6 s), and the cellar carries the mechanism and the ending.

## Signature
- **Loophole key:** the granny wears a brass key on a red string. It is on screen at the turn (S19, 38.8 s) and again in the agent's own cellar lock (S30, 62.5 s).
- **Unlock sting:** on her cellar's "pop" at 40.46 s.

## Expression plan
| Character | Default | Beats |
|---|---|---|
| brewer | calm half-lid | smug side-smirk while labelling (0-5 s); bored deadpan "It's for baking." (14.7); tips his cap at the mocking town (18.8); quiet pride wheeling in the yeast (28.5) |
| agent | moustache disapproval (tache) | stern at the barrels (5.4); mocking grin with arms out on "Who bakes with hops?" (13.6); guffaw at the office window (15.6); suspicious squint at the bread shelf (27.5); sheepish when the granny shows her pie (35.6), with a sweat drop backing down (37.6); shock circle eyes at the first pop (40.4) and aghast at the whole street (42.1); dread opening his own cellar (62.5); shock + hat pop on "baking" (64.9) |
| agents | mock laugh | guffaw, body shaking (15.6) |
| grocer | smug | busy smile while stacking; a wink with a closed eye and a grin (52.2 at the pancake mix, 60.7 on "wink") |
| granny | proud smile | beams with her pie (35.6); delighted sniff at the foam (49.8); startled duck as the caps blow (56.6) |
| wife | happy, closed-eye smile | innocent beam among the crocks (63.4); the grin stays as the foam fountains over her (64.9) |
| townsfolk | laugh, pointing | jeer at the brewer (18.0); stare up at the giant loaf (31.5) |

## First sound cue sheet
| Time | What happens | Music | Effect (pan) |
|---|---|---|---|
| 0.0 | label slap, syrup pours | jaunty 1920s ragtime: honky-tonk piano + banjo + tuba, ~120 BPM, starts on frame 1 | label slap (C), syrup glug (R), kettle steam hiss (bed) |
| 5.4 | beer barrel dumped | | barrel tip + beer gush into the drain (L) |
| 9.1 | the agent with the chain | | chain clank (L to C), footsteps |
| 12.3 | sniff, hop pluck | music dips 3 dB under the quotes | can lid pop, sniff (C) |
| 14.7 | "It's for baking." | 1-beat stop | none (deadpan) |
| 15.6 | the station laughs | back in | muffled laughter through glass + desk slap (C) |
| 17.2 | Main Street | street ambience (horse cart, a car horn, chatter) | chalk scrape (R) |
| 19.4-25.6 | grocery count | | register ding at 3 (C), board flip at 30 (L), ladder creak (R) |
| 25.6 | flour, spider | music thins | tiny dust puff |
| 28.5 | yeast tower | | hand-truck wheels, box wobble |
| 30.4 | giant loaf | music swell | soft crowd "ooh" |
| 32.7 | night street | night bed: crickets, distant dog | three door knocks (C), door creak |
| 40.46 | first cellar pop (THE TURN) | music stops | **unlock sting**, then a cork-pop + glass rattle + foam hiss (R) |
| 41.0-43.3 | pops down the street | music back, faster | pops panned R to L, foam, a dog barks |
| 43.3 | through into the cellar | music lighter, plucked | whoosh down, syrup glug |
| 46.6-51.0 | water, yeast, fizz | | water slosh, yeast plop, rising fizz + a "burp" bubble on "burps" |
| 51.0 | pancake comparison | | water pour, beer foam froth |
| 53.5-58.0 | capping, caps blow | | capper clack ×2, then a chain of cap pops + pings off the ceiling (L/R) |
| 58.0 | the wink | | register ding |
| 61.3 | the agent home | night bed | creak of the cellar doors, bulb hum |
| 64.9 | **final hit** on "baking": the shelf blows | music ends on a hit | big chain of cap pops + glass clink + foam whoosh (low thump under it), nothing after |
