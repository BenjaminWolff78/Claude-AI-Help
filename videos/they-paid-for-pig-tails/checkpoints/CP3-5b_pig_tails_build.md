# Checkpoints 3-5b: build, style lock, still gate, previz checks — "They Paid for Pig Tails and Got a Pig Farm"

## What was built
- **One connected set (pigset):** the bounty shed (plank walls, rusty corrugated roof, counter window with a propped awning, the tail board, the price board, the BASE HOG CONTROL sign, the PIGS SEEN flip board), the gravel lot with the hunter's pickup, a corn field rooted up in patches, the back yard (the ranger's chalk wall), a ranch fence with the back gate (padlock + chain, lantern), the hillside meadow beyond the gate, and the woods road through the pines.
- **Real Poly Haven assets:** photo ground (grass, forest floor, farm soil, rooted dirt, gravel, muddy track, blended by painted masks with anti-tiling noise), the Poly Haven pine's real trunks and branches wearing alpha needle cards placed at the real twig positions (the 6.8-million-triangle needles were too heavy), impostor cards for the far woods, thinned oaks, grass clumps, nettles, dandelions, shrubs, ferns, barrels, crate, boots, bucket, thermos, picnic table, lantern, bulbs; three HDRIs (farm field, forest grove, dusk).
- **New code:** a 1990s pickup (wheels turn, steering, brake dip, driver door), a reel mower, a padlock and chain, 980 instanced hog tails, young corn, an instanced herd of 420 pig cards (walk cycles from the same drawing as the cast), the chalk "tally marks" that are really a family tree.
- **Cast (all original):** the shed guy (lead), the best hunter (lead, blaze-orange cap and vest), the old ranger "Grandpa" (new campaign hat), the second hunter, four hunters in the queue; wild hogs as a new variant of our pig drawing (dark bristly coat, mane, long snout, upright ears, straight tufted tail; tusks on boars, stripes on piglets). Props: rifle, hog tail, two twenties.
- **Lights:** late afternoon (shots 1-11), dusk with the bulb and the gate lantern on (shots 12-19).

## Render speed (found and fixed)
The first test frames took 16-23 s. Two causes: the bulb and feed-sack glass used Poly Haven "transmission", which makes three.js draw the whole scene twice every frame (fixed for every set: -9 s/frame), and the pine needles (Lambert cards, far pines switch to impostor cards beyond 38 m). Now ~7 s/frame at full size.

## Sharpness plan (v28 6.16 / step 7)
Full 1080x1920 buffer (dpr 1.0), **no lens-blur pass anywhere** (it cost the shoes video 0.17 sharpness), 2048 shadow map. The first render chunk is measured with sharpness.py before the rest is trusted (target median >= 0.64).

## Hard cuts: 4 (limit 4)
724 the ranger's close-up, 766 "But wait" (added: the old glide went through the shed), 986 the WANTED poster, 1141 the dusk time jump. Every other change is a camera move; the woods road is entered by riding along with the pickup; 1078 is a whip pan.

## SAY-SEE table (measured on the previz samples)
| Line (frames) | On screen | Result |
|---|---|---|
| They paid hunters forty bucks a pig tail (0-66) | the hunter at the counter, the shed guy in the window peeling off two twenties | PASS |
| the woods filled up with more pigs than ever (68-139) | sows and piglets trotting out of the trees past the shed | PARTIAL: the pigs are small (about 6% of the frame width) |
| wild hogs were wrecking every field (154-200) | five hogs rooting in torn-up corn, dirt flying | PASS |
| one tail, two twenties (212-280) | he slaps up "1 TAIL = $40" and holds up two twenties | PASS |
| Hunters line up out the door (296-331) | the queue of hunters seen side-on | PASS |
| he nails every tail to the wall (331-386) | hammer strikes, tails appear on the white board | PASS |
| a thousand tails cover it (415-452) | the board fills with tails | PASS |
| The paper calls it the smartest deal in the county (463-532) | the headline, readable | PASS |
| the old ranger... counting something in chalk (535-642) | the ranger drawing marks on the back wall | PASS |
| The hunters laugh, "Grandpa's counting piglets!" (649-722) | the two hunters laughing, lip-synced | PASS |
| He just says, "Count the little ones." (724-766) | the ranger's close-up, lip-synced | PASS |
| if a thousand pigs are gone, why are the woods getting louder? (773-866) | the tail board at the shed's end, the woods behind it, the two turning | PARTIAL: the shaking bushes are small |
| The best hunter only shoots giant boars (866-946) | the ride into the pines, a giant boar, the shot, it flops | PASS |
| because they get you in the paper (946-980) | the selfie with the boar, the flash | PASS |
| the boars have a wanted poster of him (986-1073) | three hogs at a pine with WANTED + his face | PASS |
| He drives right past the mothers with babies (1078-1135) | the pickup roars past, then the sow and her piglets | PASS |
| the shed guy unlocks the back gate (1141-1229) | the brass key on its red string, the padlock opens, the chain drops, the gate swings | PASS |
| A pig. Then another. Then the whole hillside starts to move. (1233-1327) | one pig, another, then hundreds | PASS |
| they only shot the big boars, and boars don't have babies (1330-1416) | a lone tusked boar, then a sow with eight piglets | PASS |
| every one they skipped raised more piglets than ever (1421-1534) | high view: the herd in branching lines of piglets | PASS |
| like mowing the tallest weeds and leaving all the seeds (1538-1622) | the ranger's reel mower cutting the tall weeds, dandelions left | PARTIAL: the drifting seeds are faint |
| An army base really tried this, and the pigs went up (1628-1713) | the BASE HOG CONTROL / PIGS SEEN board flipping 312 -> 845 | PASS |
| Grandpa's chalk marks? They were a family tree. (1713-1787) | the whole chalk family tree, the ranger tapping the top | PASS |
| raises it to fifty bucks a tail (1792-1910) | he paints $50 over $40 | PASS |
**0 FAIL, 3 PARTIAL.**

## Muted twist (8.13)
41-47 s with the sound off: the gate opens on a hillside covered in hogs, then a lone boar next to a sow leading eight piglets. Deviation from the plan: the price board is not in the same frame (the narrow frame could not hold both); the herd itself carries it. PASS.

## Devices (8.14)
The flip board is seen from the front with readable digits, the padlock and key from beside him, the newspaper and the poster face-on.
