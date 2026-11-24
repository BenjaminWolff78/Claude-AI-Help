# CP3: style lock for "The Thieves Who Stole 200 Shoes Nobody Can Wear" (master prompt v27, step 4)

Sheet: `CP3_style_lock_sheet.jpg` (our cast and sets only). The side-by-side with core AX1, AX2, BF1 and BG1 was made and reviewed here on the machine and is not sent, because it contains crops of the boards.

## What was built
- **Cast (5):** the owner "Sleepyhead" (grey side tufts, big round glasses, neat moustache, mustard cardigan, mug), the boss thief (dark flat cap, navy-and-cream striped jumper, black gloves, gold watch, handlebar moustache), the big thief (rust baseball cap, stubble, olive jacket, orange vest), the skinny thief (grey-blue hoodie with drawstrings, spiky hair, lanky), the baker next door (white toque, walrus moustache, blue apron, rolled sleeves). All in the approved house style: flat white heads, plum ink, bean bodies, thin ink limbs, dot hands.
- **New pose and prop pieces:** pedalling on a tricycle (feet on a crank), sitting on a high seat with the legs reaching the floor, two RIGHT sneakers crammed on the feet (both toes the same way, the wrong one twisting), side-view right and left sneakers in the hands (right = toe to screen right, left = toe to screen left, the stripe on the outer side), bolt cutters drawn as a card running from the big thief's hands to the padlock, a torch with a beam, beer bottles, a wad of notes.
- **Sets from real CC0 Poly Haven assets at dpr 1.0:** the shoe shop (photo-textured tiles, plaster, slat wall, shutter; models: cash register, security camera on a wall bracket, ceiling lamps, fluorescent tubes, stools, steel shelving), the Andean street (asphalt, pavement, two rows of plaster facades with brick upper floors and rebar, electricity poles with wires, a street lamp, a street clock at 3:00, the bakery next door, hills behind), the back room of shoe boxes, the garage (corrugated iron, concrete, covered car, tool cart, tool chest, tyres, jerrycans, crates, generator, bare bulb, a dusty window with a sun shaft), and a car-door insert. Every sneaker is code-modelled (a lofted upper with an ankle opening, laces, a stripe on the outer side only, a bevelled sole with toe spring), so a left and a right really are mirror images.
- **Light per place:** night (deep blue moonlight, the orange street lamp, warm display spots inside, lit windows), morning (a warm sun about 38 degrees up raking in through the open shutter, dim ceiling lights), the garage (one key: daylight through the west window + the bare bulb).

## PASS/FAIL (sections 6 and 7)
| Item | Result |
|---|---|
| 6.4 sets built from real assets, photo textures, models for most props, HDRI bounce, rendered at dpr 1.0 | PASS |
| 6.1 a real time of day per place, kept on every return; a light you can see in every scene (street lamp, display spots, bulb, sun shaft, the clock face) | PASS |
| 6.1 night looks like night (deep blue, warm pools, lower exposure) | PASS after round 2 (night interior darkened, side walls coloured) |
| 6.2 colour in clear blocks (blue night heist, warm garage sunrise, bright morning payoff), no purple-pink grade | PASS |
| 6.3 real dark shadow, darkest pixels about 15-25 | PASS on the night and garage frames; the morning frames were too flat (round 3), so the sun was raised to clear the buildings opposite and made stronger, and the fill cut |
| 6.9 distance fades (fog tinted to the horizon, the hills paler) | PASS |
| 7.1 heads flat white with plum ink, the house face set, hats as separate shapes | PASS |
| 7.2 every lead in front, 3/4, profile and back views | PASS (sheet rows 1-2) |
| 7.3 contact poses: sitting on crates, a chair and a tricycle seat, kneeling at a box, hanging off the cutters, lying after the fall, on tiptoe at the wall | PASS (sitting was fixed in this step: the legs now reach the floor from the seat instead of the figure standing on it) |
| 7.6 characters take the scene's light; a shade side on heads and bodies | PASS after round 3 (stronger head and body gradients for all three lights) |
| 7.x idle arms not hanging straight and symmetric | PASS after round 3 (relaxed, asymmetric idle arms) |
| No character a strong colour; no prop floating (props are held or on a surface) | PASS |

## Look-match review (a separate reviewer agent that had not seen the work, scoring the side-by-side sheet out of 10)
| Area | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| Colour | 5 | 6.5 | 7 |
| Lighting | 4 | 5.5 | 6.5 |
| Textures and materials | 5 | 5.5 | 6 |
| Characters | 7 | 6.5 | 7.5 |
| Depth | 4 | 5.5 | 6.5 |
| Composition | 6 | 6 | 6.5 |

Fixed between rounds: night exposure about 1.5 stops down with warm pools; saturation up; coloured walls; less ambient fill; a stronger sun key; the cutaway owner pushed in; head and body shade gradients; relaxed idle arms; the two-shot and the toast reframed so nobody is cut by the edge; the street shot now follows the tricycle; the owner's hair changed so his back view no longer reads as a helmet.

**Still under 7 after round 3 (written here as the rule asks), with what was done after the round:**
- Lighting 6.5: the morning sun patch was too weak. After round 3 the sun went from 3.0 to 4.4, the fill from 0.26 to 0.20, the ceiling lights halved and the display spots dimmed in the morning, so the floor patch and the shadows read and the back wall sits darker than the owner.
- Textures 6: the shop floor and slat wall read clean. The tiles were darkened and roughened; the glove now has a fabric texture with a normal map. The floor still has no extra scuff decals.
- Depth 6.5: sharp frames stay (your rule from the skull video: "the video itself should be visible and not really blurry"), so depth comes from light falloff, haze, the sun shaft and foreground layers instead of blur.
- Composition 6.5: the two crops the reviewer flagged (two-shot, toast) and the tiny tricycle in the street shot were reframed after the round.
