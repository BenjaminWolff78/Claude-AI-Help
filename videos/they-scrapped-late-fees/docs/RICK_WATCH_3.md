# Three of Rick's newest story Shorts, watched in full (2026-11-16)

I picked three of his newest story Shorts and left out his oldest animated ones:
- "How One Cart Stopped an Entire Army" (67 s, 8.3M views)
- "How Mine Salting Worked" (62 s, 4.8M views)
- "Why Drivers Started Filming The Road" (63 s, 4.6M views)

**How I watched:**
- Each video was watched end to end with vidIQ's video watcher, which wrote a shot-by-shot walkthrough of the words, the picture, the focus, the camera and the motion.
- I checked the walkthroughs against 18-20 frames I pulled from each video myself.
- I measured motion and focus across the whole video, one sample every 0.5 s, about 125 samples per video.
- The watcher sometimes over-describes. It called a spark burst a "mushroom cloud", and the frames show sparks. So the frames win wherever the two disagree.

## Measured (whole video, every 0.5 s, 54×96 greyscale)
| | Cart army | Mine salting | Dashcam | **Our Giant Bricks** |
|---|---|---|---|---|
| Change from one frame to the next (median) | 14.6 | 10.0 | 8.8 | **3.6** |
| Quietest 10% of samples | – | 2.3 | 1.1 | 1.2 |
| Near-still samples (<0.6) | 2% | 2% | 5% | 2% |
| Centre sharpness ÷ edge sharpness | 2.1 | 3.3 | 2.4 | 2.8 |

The YouTube frames were pulled by seeking, so a pair sometimes lands two frames apart instead of one. Treat his numbers as probably 10-30% high.

**What the numbers say:**
- Even allowing for that, his frames change about 2.5-3× more than ours.
- Our quiet moments are as quiet as his.
- Our *busy* moments are much calmer than his.
- Our focus matches his: subject sharp, edges soft.

## What he does, and what changes for this video
1. **Each phrase gets its own picture, almost word for word, and numbers become objects.**
   - Examples: a counter ticks to "82", a tape measure reads "10 FT", a sign says "Days since… 0", a dashcam screen shows "REC" with the speed dropping.
   - *This video:*
     - "owe ten bucks" shows the pink $10.40 slip;
     - "+240%" is drawn on the tally;
     - "1994" is the DUE MAY 03 1994 card in close-up;
     - new: "three weeks later" shows a desk calendar flipping in the return room.
2. **The hook is one hero, big (head 30-45% of the width), already in the middle of the act with the object, and lit apart from the background.**
   - Examples: a spotlight in a dark mine; a close-up of a face hitting the brakes.
   - *This video:* shot 1 goes from a 26% head to **32%**, with a low sun rim behind Marge and the sign.
3. **Cameras go inside things:**
   - a driver's-seat close-up and a dashcam screen;
   - a view through a magnifying glass;
   - a macro on a drill tip that pulls out into a crane;
   - a ride along a burning fuse.
   - *This video:*
     - shot 13 already looks down into the bin;
     - new: shot 21 ends **inside the bin, looking up at the slot** as Gary's book pushes the flap in;
     - shot 22 rides the book down the chute.
4. **Something moves in every part of the frame, nearly all the time.** On top of the main action there is always something secondary moving:
   - woodchips, sparks, grinder sparks, rain, swinging lanterns, steam from a mug;
   - flying cash, dust kicked up by tyres, flags.

   Camera moves are bigger and faster: whips, cranes over roofs, tracks alongside cars. *This video:*
   - **Secondary motion in every shot:**
     - steam off Gary's coffee;
     - dust motes in every window shaft;
     - leaves blowing past the bin;
     - pages fluttering on the falling books;
     - flag and tree sway outside;
     - the pendant lamps swaying slightly;
     - TV flicker in the apartment;
     - a cyclist and a dog walker in the street.
   - **Faster, longer moves:** the hook whip, the crane up the steps, the dive into the bin and the chute ride all travel 30-50% further in the same time.
   - **Target, checked with tools/motion_focus.py on the previz:** a median of **at least 7.0** (our last video: 3.6). Calm stretches stay as planned.
5. **Focus stays on the story object or the speaker's eyes.** Backgrounds go soft, and there is haze in the distance outdoors.
   - *This video:* keep the follow-focus plan, and add light haze to the street sets (libMorning, libDay, libDusk).
6. **The world is realistic but simple:**
   - real textures (rough stone, wood grain, brass);
   - warm practical lights (lanterns, torches, porch lights, a phone glow) that throw coloured rim light onto the flat characters;
   - real cast shadows;
   - a set dense with props.

   *This video:*
   - a banker lamp or pendant within 2 m of every inside speaker, for a warm rim;
   - the TV and floor lamp light Dwayne from two sides;
   - the dusk scene keeps its lamp posts in frame.
7. **Side characters always react:** the buddy sips tea while deadpan, the two scammers nod nervously, the clerk looks suspicious. *This video:*
   - Denise and Harold react in every board shot;
   - a reader at a table looks up at the truck noise;
   - the clerk at the next desk peeks during the stamp.
8. **Endings hold calm on the hero.** The deadpan driver stays still, and only small things keep moving (rain, a blinking light). This already matches the plan: Marge's smirk with the mug, dust in the shaft.

**Cuts.** The watcher put his share of hard cuts at 40-60%. That is a guess, and master prompt v18 caps us at 4 hard cuts, so the cap stays. His energy comes from whips and cranes between framings, which is what we use.
