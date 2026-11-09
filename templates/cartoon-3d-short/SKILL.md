---
name: "cartoon-3d-short"
description: "Make a Rick's Clips-style vertical story short (2D cartoon characters with thin black stick limbs in a realistic, lit, textured 3D world) with three.js + Remotion, using the mromidev/claude-animated-shorts pipeline."
---

## STILL-FRAME GATE (user rule, 2026-11-08; read first; run on one key frame of every shot BEFORE rendering; fix every FAIL)
1. Medium shots: the main character fills 35-70% of the frame height. Close-ups (head and shoulders) may go bigger, in up to 1 in 4 shots. A shot counts as wide only when the main character is under 25% of the frame height; at most 1 in 4 shots are wide. Legs cropped by the bottom edge are fine. FAIL only when a head or face is sliced by a side edge or the top edge.
2. Nothing in the middle of the frame between the camera and the subject: no pole, bollard, sign or barrel across the frame or a face. Foreground framing only in the outer 20%.
3. The speaking or acting character is in sharp focus; never a blurred face. No stray white blurs, smudges or blobs anywhere.
4. A character is in every story beat, reacting (crews on sinking ships, crowds at disasters). Object-only inserts 2 s max, except the mechanism explanation.
5. The title object fills 40%+ of the frame in the hook and the reveal, and its change is shown happening (for a load line: the water rises to the line as cargo goes on, then past it). REQUIRED in the hook and at the reveal; evaluate it, never leave it blank.
6. No heads stacked directly behind other heads; no characters standing on odd spots (smokestacks, roofs) unless the story says so.
7. Props have shape: bevelled crates, rounded barrels, planks and rivets on hulls, varied building shapes. No plain cubes or flat slabs. Evaluate it on every frame, never leave it blank: any plain cube crate or flat slab is a FAIL. Crates vary in size and carry lids, rope and wear instead of plain stacked cubes.
8. Colour is strong and clear: real time of day, no milky haze, no outlines on the world, purple only in a sunset sky.
9. No frame is mostly black or mostly blur; the subject is readable at phone size.
10. No blurred face or head anywhere in the frame, foreground included.

Print a contact sheet of the key frames with PASS/FAIL for each of the 10 checks before you render, and show it to the user.

## Before anything else
- Read the section "MASTER PROMPT v10.14 (full text)" at the end of this file, in full, and the "v10.14 overrides", "v10.13 overrides" and "v10.12 overrides" sections below. It is the skill's MASTER_PROMPT.md, kept inside this file because the skill is saved as one file.
- Look at every board image the user has attached in the chat (A-Y, Z-Z2, AA, AB, AC, AD, AE, AF, AG, AH, AI, AJ, AK, AL, AM). Their written summaries are in "Boards" below. For acting, study A, B, X, AC/AD and AG in particular; for focus, objects and detail, AH; for hands doing the work, AI; for showing the big moments, AJ; for the lit, textured world, time of day and fire, AK (with S); for characters in groups, AL; for people in every beat, the in-world demo and one ending, AM.
- Where they disagree with this file, the master prompt wins. A newer master prompt pasted or attached in the chat wins over both.
- Exception: the "Smooth acting" section below is a newer user rule (2026-11-05). It wins over master prompt v10.10 and earlier where they disagree (instant expression swaps, 1-3 frame actions). A newer master prompt overrides it only if it says so explicitly.
- Exception: the "Channel data" section below is a newer user rule (2026-11-05). Its title, description, tags, topic-priority and length rules win over master prompt v10.10 and over "Script length".
- Exception: the "Voice" section below is a newer user rule (2026-11-05, updated 2026-11-07: no pitch shift). It wins over master prompt v10.10 part 1d (the whole-file atempo) and over every earlier voice rule.
- The "Nothing passes through anything" section below (2026-11-07) applies to every video: characters, their limbs and props, and thrown things never go through objects or other characters.
- Do not use the old "User rules" section of the cloned repo's SKILL.md. Instead:
  - Captions are on.
  - Output is 1080x1920 at 30 fps.
  - -14.3 LUFS with the voice loudest; music about 15 dB under the voice (v10.14 music rules: ducked under quoted lines, cut on the last spoken word, no fade-out) and SFX about 17 dB under.
  - The 15 dB music level and the no-fade ending are for these Rick's Clips-style videos only (a test, from 2026-11-08: report how it sounds after each video). Every other channel keeps music about 19 dB under the voice with the fade-out before the end.
  - The mp4 has the same name as the mp3.

## v10.14 overrides (user rule 2026-11-08; master prompt part 14 and boards AK, AL, AM; wins over every rule below, including the v10.13 and v10.12 overrides, where they disagree)
Deleted from this file and from the master prompt below: "shadows light and blue-violet", violet or purple shadows at golden hour or sunset, ink lines on the 3D world, "effects are flat 2D cartoon sprites", the night-blue look at "You see," (now only where the story's time of day changes), and the camera-hold, relocation and camera-travel number targets. The colour grade has no purple tint.
1. **Time of day per scene.** Day: blue sky with clouds, a white sun, soft neutral shadows. Golden hour: an orange sun and long shadows; the only purple is in the sky. Night: deep blue with warm pools of lamp and fire light. Shadows are neutral by day and deep blue at night; purple appears only in a sunset sky. Neighbouring scenes contrast. Print a colour strip of the render (one sample every 2 s) next to board AK: purple or pink at most 20%, and at least 4 scenes with a different time of day or light.
2. **A real 3D world.** MeshStandardMaterial everywhere with generated canvas textures and roughness variation: wood grain, brick, plaster, cobbles, thatch, roof tiles. A sky dome with clouds. The sun is a DirectionalLight with PCF soft shadows, plus a HemisphereLight. ACES filmic tone mapping. Bloom only on lamps, windows, fire and sparks. Fog in the horizon colour. No ink or outline pass on the world; characters keep their own outline. Check set stills against boards AK and S before animating.
3. **Fire is a light.** Animated flames flickering at 8-12 fps, in varied sizes, coming out of windows and roofs (never rows of identical cards). Each fire has a warm flickering PointLight that lights walls, ground and faces, plus embers and a dark grey smoke column above it. Smoke never covers more than half the frame, or any face, for more than 0.5 s. Explosion smoke is grey-brown with debris, and the hero stays visible.
4. **People in every story beat.** Setup, mockery, fake-out, climax (above all) and payoff each have a character in frame, reacting. Object-only shots are inserts of 2 s at most; only the mechanism explanation may run longer without a person.
5. **Explain inside the story world.** The everyday comparison is acted by the story's characters in the story's place and period (no modern kid, no new set). The demo object sits at 25-55% of the frame height, above the caption, and a hand makes every change (chalk line, stamp, domino, lever).
6. **One ending**, on the callback or the payoff, with a story character in the last shot. A modern tie-in, if any, is one sentence said over the story's own characters before the callback, never a new place with new people.
7. **Characters.** Every character, hero included, has thin black stick arms and legs (about 0.055 of the head width). Never 3 or more side by side at one depth facing the camera: stagger them front, middle and back, turn them three-quarter toward each other and give each a verb (point, pull a sleeve, shake a fist, whisper). When a line names someone, that person is in the shot. Hats stay on: a shock hat pop arcs up and lands back within 0.5 s and never freezes in mid-air.
8. **Camera.** The amount of camera movement is right now: no hold-length, relocation or travel-share targets. Moves are smooth and follow a character or the action. Camera roll (horizon tilt) never beyond 5 degrees.
9. **Music and sound (every video).** (a) One instrumental track for the whole video: no vocals, no popular songs, royalty-free or generated only. (b) Match the story's mood: tense cinematic plucked strings with ticking for mysteries and disasters; quirky plucked strings or acoustic guitar for comedy; banjo or acoustic guitar for old-timey stories; medium tempo, about 115-125 BPM. (c) Shape it to the story: steady under the setup; dip under every quoted line and at the fake-out; build at the turn and the climax; one deep boom on the payoff; cut cleanly on the last spoken word, no fade-out. (d) Clearly audible but under the voice: about 15 dB below the voice (was 19), still ducked under quoted lines; listen to check. (e) A sound effect on every on-screen action, about 12-18 per video (clinks, creaks, crowd laughs, crackling fire, rumbles), plus one big impact on the payoff; soft whooshes only and few ringing sounds. (f) Print a music and sound cue sheet: time, what happens on screen, what the music does, which sound effect plays.
10. **Keep** (part 14 A): the paradox hook with the act happening at frame 1, "You see," early, painted signs, a mocking quote, a nickname, a fake-out and a doubter line, the callback, big moments on screen, mouth shapes on the right syllables.
11. **Final check:** before delivering, print every line of part 14 F with PASS or FAIL after the earlier tables, and fix every FAIL: the colour strip next to board AK (purple or pink 20% or less, 4+ scenes with a different time of day or light); set stills next to board AK (textures, sky, sun shadows, bloom, no ink on the world); every fire lights its surroundings and no smoke covers over half the frame or a face for over 0.5 s; every stretch without a character listed (none in story beats, inserts 2 s or less); the demo uses the story's characters, sits above the caption and is done by a hand; one ending with a story character in the last shot; thin black limbs, no row of 3+ facing the camera, no floating hats, roll 5 degrees or less; the music and sound cue sheet.

## v10.13 overrides (user rule 2026-11-07; master prompt part 13 and board AJ; wins over every rule below, including the v10.12 overrides, where they disagree)
1. **Show every big moment on screen, with cause and effect.** Every impact, failure, transformation or payoff the narration names happens in frame: the cause arrives, contact lands on the word, then the effect (a jolt, dust, crumpling metal, a camera shake that decays over about 7 frames, the occupant thrown forward, a head popping off and landing). Never cut away just before the contact or open on the aftermath. The climax and the payoff each get one 4-8 s stretch with the camera moving the whole time (Rick's Railroads climax: low glide along the rail, aerial over the bridge, head-on push at the train, 6 s).
2. **Move the camera.** At least half the shots contain a real camera move (glide, track, crane, orbit, aerial, push past a foreground object), not only a push-in. At least a third of the place changes are motivated moves (ride a motion, through a window or object, shape match); cuts are for beats, punchlines and reaction close-ups. (v10.14: no travel-share or hold-length target; moves follow the action, roll 5 degrees or less.)
3. **Hook frame:** frame 1 shows the absurd act being done, big (the engineer stomps on the car's nose and it folds), not a character standing beside the object.
4. **Repeat offenders:** the pencil (brush, pen) tip travels along every line as it appears; a hand pulls every door open in a frame where the door is visible from the camera (check the hinge side in a still); moustaches ride the jaw and never cover a speaking mouth (in talking close-ups lift or shrink the moustache); focus is on whoever speaks or whatever the line is about - never a blurred foreground speaker in front of a sharp background.
5. **From Rick's numbers (vidIQ, 7 Nov 2026):** write the last line to be quoted and argued with (Japan Job's "nobody can do nothing forever" drew 15x the comment rate); for everyday topics put the viewer in the story ("Imagine you're...", "Ever...?") with an avatar; keep the mechanism accurate and treat dramatised details as dramatised; music rises only at the turn and at the payoff and stays ducked flat everywhere else.
6. **Final PASS/FAIL table additions:** every impact or payoff verb in the script with the frames where it happens on screen; the share of shots with a real camera move; every place change listed as cut or motivated move.
7. **Keep from the crumple-zone video:** a mechanism topic; story text painted on objects; one labelled dial-like mechanism object (STOPPING TIME); a second-person demo acted as its own scene (the water balloon); the title object physically transforming on screen (the paper car crumpling); a quotable two-line ending exchange ("They don't build them like they used to." "Exactly.").

## v10.12 overrides (user rule 2026-11-07; master prompt parts 11 and 12; wins over every rule below where they disagree)
1. **Hands do the work.** Every person verb (paint, mix, pour, lift, carry, slide into the oven, roll, rub, stamp, sign, hammer) is done on screen by the character's hands and body, with wind-up, action and settle; or in a close insert where the object moves as if held and a hand or sleeve enters the frame. Painting = a brush on the canvas with strokes appearing under it. Process verbs (shrink, expand, buckle, crack, rise, ripple) are done by the object itself with a visible cause (heat glow, thermometer, flipping calendar). Objects never move by themselves while the person who should move them stands idle.
2. **Shot changes: 18-28 per 60-65 s** (replaces "at most 4 hard cuts" and "at most 2 whips"). Every shot holds at least 2 s. Changes are quick 6-12 frame pushes or whips with motion blur, very short dissolves, or straight cuts on a beat. Never: a ghosting crossfade between places with people, a white-out, a flash or colour wash as a transition, anything passing in front of the lens. (The forger video's light dips count as washes: do not use them.)
3. **Captions:** plain white, bold rounded sans-serif, thick black outline, 1-3 words, lower third (above the bottom 20%), no coloured keywords. All other text is painted on objects in the world; at most one floating graphic, for the mechanism.
4. **One labelled mechanism object** per video (a padlock engraved "LABOR LAW", a breaker panel with switches "HOPE / WORK / FRIENDS", a caliper with a coin in May and a sheet of paper in July). The everyday comparison is its own short acted scene (about 5-9 s). The payoff is held 4 s or more.
5. **Focus:** shallow depth of field on close-ups and object inserts (and soft foreground frames); medium and wide shots may be deep focus. **Mouths on quoted lines:** move on every syllable, 3-5 shapes (closed/grin, half open, wide open with teeth, round O), open shapes 30-45% of the face width, also in medium shots (replaces "8 or more shapes, 40-50%"). Narration is never lip-synced; faces react.
6. **People readable:** when the line is about people they fill at least 25-30% of the frame height; extreme wides only for a big object, a crowd as a mass or a place, 2 s or less. Background characters do small story actions; every scene has small environmental details (dust motes in beams, a cat, cables, a figurine). A visible practical light in every interior or night scene, and the light changes at the turn.
7. **Story objects look real** (an old painting has brush texture, dark varnish and cracks; a document has creases, stamps, handwriting).
8. **Topic and title:** mechanism over anecdote - the reveal explains a reusable rule ("why X always does Y"); lanes: incentives that backfire, everyday physics that looks stupid until heat/speed/pressure arrives, body vs brain shortcuts, money and law loopholes with a visual demo. Title names the familiar object and implies the hidden rule, short, one emoji. Script: present-tense cold open after the hook, one second-person bridge ("Imagine you're..." / "Ever...?"), "You see," early, end on irony, never a moral. A "you" line follows a specific viewer avatar.
9. **Final PASS/FAIL table before delivering** (part 11 C7 as updated by part 12 D): hook 9-16 words ending by 3.5 s, "You see," by 6 s; length 62-65 s (44-50 s one-trick), -14.3 LUFS; 9-13 scenes, one of 9 s+ in the first 20 s, nobody vanishes; shot changes 18-28, every shot 2 s+, transitions 6-12 frames or cuts on a beat, no ghosting crossfades/white-outs/washes, nothing crosses the lens; move peaks under about 22 px/frame except the deliberate quick transitions; quoted lines 3-5 shapes, open 30-45%; every shot of 2 s+ has a body action; person verbs by hands, process verbs by the object with a visible cause; title object big in hook and reveal with its change on screen; close-ups and inserts blurred; people-subject shots 25%+ of frame height, no half-cut characters, no cropped labels; a visible light in every scene; white 1-3 word captions, other text on objects, at most one floating graphic; one labelled mechanism object; the demo scene acted; payoff held 4 s+. Fix every FAIL before delivering.
10. **Learned on the forger video (keep):** frame faces in the upper-middle (eyes about 35-45%) and key signs above about 62% so the 70%-height captions never sit on a mouth or key text; check a full-frame contact sheet every 1.5 s of the render for it. Hand props far from the body get clipped by the character card canvas. A prop changing state animates at its own size (page -> crumpled sheet -> ball); thrown things start at the hand and arc over the shoulder.

## Key rules (v10.10; never skip; v10.12 overrides above win)
**Script**
- Built on one sentence that sounds stupid but is true.
- A 9-16 word hook under 3.5 s, then "You see," by 6 s.
- A fake-out at 30-45% of the runtime.
- 47-65 s (multi-beat stories 60-65 s, about 225-250 words; see "Channel data").

**Scenes**
- 9-13 per video, built around one or two home-base places.
- One scene of 9-17 s in the first 20 s.
- No montage.
- No character vanishes on a scene change.

**Acting**
- Talking mouths change on every frame of the line, matched to the voice. Drive them from the voice track's per-frame loudness, leading the sound by 0-1 frame.
- Blinks: 3-4 frames (half, shut line, half), every 0.5-1.5 s at irregular times.
- Expressions never jump from one frame to the next. Each change is a short transition (about 6 frames; 10 frames between opposite moods, through a "realising" face) that finishes 0-3 frames before the word. See "Smooth acting".
- The character the line is about acts. Everyone else keeps a still body but faces the action with a readable face: no breathing bob, sway or looping wave.
- Held poses are extreme (squeezed eyes, puffed cheeks, whole-body lean) and end with one small change (one eye opens, a brow lifts).
- Group reactions happen together on the same word.
- Bodies move like real people: eased in and out, with the head leading, the torso following and the arms trailing on arcs. Gestures take 8-14 frames. Only impacts and strikes use a 6-frame held wind-up, a 1-3 frame strike, contact on the word and a 4-5 frame effect. Walks are 9-12 frames per step with planted feet.
- No squash, stretch or overshoot.
- Every spoken line has a hand gesture (point, lift, wave, count).

**Transitions (pick by situation, board AE)**
- Object to person: subject-position match dissolve. The new subject fades in on the same spot and size, then the camera reveals the place.
- Time passes or a disaster: a dissolve hidden inside smoke, dust, steam or light.
- The story's object exists: go through it (mirror, lens, window, map, painting, newspaper photo).
- Two places share a shape: shape-match dissolve.
- Something moves from A to B: ride the motion.
- Same place with a new angle, or a punchline: hard cut.
- Everything else: a camera move that carries the character into the next place.
- Plain crossfades only for a time jump in the same place, with characters in the same screen positions.
- At most 4 hard cuts.
- (v10.14: no camera-travel target; camera roll 5 degrees or less.)

**Camera holds (v10.9, board AF; corrects part 7 rule 9)**
- The new event on every phrase happens INSIDE the shot (the subject acts, a prop changes, an effect fires, someone walks in). The camera does not move to a new subject on every phrase.
- The hook image, mockery, fake-out, climax and explanation each get one shot of 4-8 s where the subject keeps acting (v10.14: no hold-length target).
- Camera moves are eased glides that follow a character or the action, peak speed under about 22 px per frame at 1080 wide (v10.14: no relocation budget).
- Lists: one wider shot where the items act one after another, or one slow track with each item centred at least 1.2 s.
- Nothing crosses the lens during a move (cull or move fence posts, poles, trees, people). Groups stand at different depths and angles facing the action, never a straight row facing the camera.
- Plain crossfades only for a time jump in the same place; dissolves between places are object-to-object matches with no bodies on screen.
- Shot list: every shot gets its subject, start, end, length (2 s or more) and the action during it, plus the glide into the next. Before animating, print the number of shots under 2 s and the number of camera moves. After rendering, print the peak speed of each move, the largest camera roll (5 degrees or less) and any lens-crossing frame.

**Acting inside the shot, mouths, focus, objects and details (v10.10, boards AG and AH; user rule 2026-11-06)**
Keep the calm camera holds above; the subject now performs during each hold.
1. **Whole-body action in every hold.** Every shot of 2 s or more has at least one whole-body action (reach, lift, lean, walk, throw, point, shrug, sit, stand, flinch) plus face changes. Nobody stands arms-down for more than 2 s unless the deadpan is the joke. Characters in wide shots stay at least about 25% of the frame height.
2. **Lip-sync on quoted lines.** At least 8 mouth shapes (closed, small open, wide open with teeth, open with tongue, round O, wide E, smile-talk, frown-talk), picked per syllable from the voice track.
   - The mouth is 40-50% of the face width, with a dark inside and teeth.
   - The jaw and head bob 1-3 degrees on stressed words; brows rise on questions and emphasis; the face's mood shows in the talking mouth (sneer-talk, laugh-talk).
   - A moustache never hides the mouth; it moves with the jaw.
   - Never hold one shape (a tongue-out held 1.5 s reads as licking). Narrator lines are not lip-synced.
3. **Listeners** hold a prop and use it (eat, write, polish, hold the brick), and react with a face on the line about them.
4. **The title object** is big (at least 40% of the frame) in the hook and at the reveal. The process the story depends on happens physically on screen in 3-6 s (e.g. the brick drops into the jug, dissolves into purple clouds, the jug bubbles and darkens while the calendar flips).
5. **Real objects, not stickers.** Show information with in-world objects (a newspaper headline, a poster, a crate stamp, a ledger, a sign), never floating icons or labels in the air.
6. **Focus.** Close and medium shots: the subject is sharp and the background clearly blurred (its detail unreadable); a foreground object near the lens is blurred; wide shots may be deep focus. Focus and the frame centre sit on whoever or whatever the line is about. A story event is never smaller than about 25% of the frame height or hidden behind another character.
7. **Framing.** Labels and signs are fully in frame and readable for at least 1 s. Check that no cropped word reads as another word (the grape-brick label cropped to "RAPE RICK"). No character is cut in half by the frame edge unless it is a deliberate over-the-shoulder foreground.
8. **Light.** Every scene has at least one light source you can see (sun through a window, a lamp, a lantern, string lights, the moon) with its glow on the characters. Night and interiors use warm practical lights against cool shadows.
9. **Small details.** Every main character has 2-3 costume details (patch, badge, pocket, buttons, tie, moustache, hat band) and a prop that fits their job. Every set has 3-5 readable story props or signs and at least one small moving detail (steam, a fly, a swinging sign, a flickering lamp).
10. **Transitions.** No crossfade between different places with people in them; use the AE choices.

**Pre-render checkpoint (user rule, 2026-11-06).** Before rendering, send the user, as files:
- a face strip for every quoted line (every 2 frames, with the count of distinct mouth shapes; 8 or more, following the syllables);
- the body action in every shot of 2 s or more (a table: shot, time, subject, action);
- the frames where the title object changes (a strip with timestamps).
Then keep working: start the render and apply any correction they send.

**QA additions (print them)**
- The mouth moves on every frame of every spoken line.
- Blinks and expression swaps (with times) for every character on screen longer than 1.5 s. Flag any face unchanged for more than 2 s while its character is being talked about.
- Face QA (`scripts/face_qa.py`): 0 mood flips, 0 bare swaps, 0 brow jumps. Also a frame-by-frame preview strip of 3 expression changes and 2 gestures, checked by eye.
- Every crossfade, with the place before and after.
- The sideways-travel share and the hard-cut count.
- Word count, length and the fake-out timestamp.
- v10.10 (part 11 C11): the face strip per quoted line with its mouth-shape count; the body action in every shot of 2 s or more; the title-object change frames; one full-size frame per scene checked for background blur in close shots, cropped labels and half-cut characters; the crossfade list with the places on each side.

## Channel data (user rule, 2026-11-05, from vidIQ data on our 8 Shorts; every new video; wins over master prompt v10.10 where they disagree)
1. **Title = the dumb act + the smart payoff, both halves visible.**
   - Winners: "They Paid for Rat Tails and Got a Rat Farm" (34.7k), "He Was Dying Mid-Race, Then Won Gold" (12k in a day).
   - Never hide the payoff behind "Why..." or a vague line. These underperformed: "Why He Put a Bridge in the Desert" and "Her Crew Begged Her to Turn Back. She Didn't."
   - Short, with one emoji at the end.
   - Write 5 title options and pick the one that shows both halves most clearly. Show all 5 and the pick in the script checkpoint.
   - This replaces master prompt 1a's "curiosity question" titles. The mp4 is still named exactly like the mp3.
2. **Description:**
   - 1-2 sentences that frame the story as a con, a loophole or a genius move. Never use a dry framing like "landscape engineering".
   - Then one debate question that sparks comments (e.g. "Genius or criminal?").
   - Hashtags: #shorts plus 1-2 topic tags.
3. **Tags:** only tags that match the story and its audience.
   - Never use auto-generated or unrelated tags. The Bridge video got "baby songs" and "nursery rhymes"; never again.
   - Check every tag against the story before handing them over, and say they were checked.
4. **Topic priority:**
   - a. Incentives that backfired (cobra effect): the cobra bounty in India, the sparrow campaign, the Florida python bounty, Prohibition loopholes.
   - b. Genius cons that look stupid: selling a landmark twice, faking a country to get a loan.
   - c. "Everyone said it would fail, then it won" in sport, survival or expeditions.
   - Verify every fact from sources.
   - Check the topic isn't already covered by Rick's Clips or zackdfilms (search both channels) before writing.
5. **Length:** stay within 47-65 s; our best two are 47 s and 60 s.
   - Multi-beat stories: aim for 60-65 s.
   - Single-trick stories: 47-52 s.
   - This replaces the old 62-65 s / 40-68 s numbers everywhere in this file, and master prompt 1d's 56-66 s.
6. **Debate line:** the script includes one line viewers will want to argue about in the comments (who was right, was it fair, would you have done it).
7. **Delivery:** with the final mp4, give the picked title, the description and the checked tags.

## Voice (user rule, 2026-11-05; updated 2026-11-07; every video; wins over master prompt v10.10 part 1d)
**Update 2026-11-07: NO PITCH SHIFT.** The user said the voices of the grape-brick and masterpiece videos (+5 and +3.5 semitones) "sounded kinda weird". From now on keep The Pharaoh 3 at its natural pitch (median F0 about 180-185 Hz is fine): run `build_voice_r3.py TEMPO 0` (semitones 0 = pitch 1.0), so the one R3 pass only does the speed-up (tempo about 1.12-1.18). Ignore the F0 200-220 Hz target and the semitone steps below; everything else (one take, pause trim, one R3 pass, word timings from the final file) stays.
Original note (2026-11-05): the user approved "The Pharaoh 3" raised 3.5 semitones with a clean, formant-preserving shift. Their complaint about pitch shifts is that they usually sound robotic, so the method below is part of the rule, not a suggestion.
- Voice: "The Pharaoh 3" (Qziuou6kCJ2R3w53L2Zs) on eleven_v4, the whole script in one take (no stitched clips), default settings.
- Trim every pause longer than 0.10 s down to about 0.10 s (no gaps in the voice).
- Then exactly ONE processing pass that does both the speed-up and the pitch raise: ffmpeg `rubberband=tempo=T:pitch=1.224054:formant=preserved:channels=536870912`.
  - pitch 1.224054 = +3.5 semitones. T is about 1.22-1.28, chosen so the script lands at the target length ("Channel data": 60-65 s multi-beat, 47-52 s one trick).
  - `channels=536870912` sets Rubber Band's R3 "finer" engine flag (0x20000000; librubberband 3.x). The default R2 engine smears the upper harmonics, and that smear is the robotic sound.
  - `formant=preserved` keeps the voice's own tone, so it does not turn into a chipmunk.
  - Never run atempo first and a separate pitch shift after it (two passes double the artifacts). Never use the default engine, and never shift without formant preservation.
- Template: `templates/cartoon-3d-short/audio/build_voice_r3.py TEMPO` in the user's repo (trim, the one R3 pass, an F0 check, then word timings on the final file).
- Checks before using the voice:
  - Median F0 about 200-220 Hz (Rick's narrator measured about 205 Hz; the plain Pharaoh 3 is about 166-180 Hz). If it falls outside 195-225 Hz, change the shift in 0.5-semitone steps. Takes differ: the grape-brick take read lower and needed +5 semitones (202.6 Hz) where +3.5 gave only 186 Hz, so always measure; never assume +3.5.
  - Compare a 2 s spectrogram of the shifted voice with the unshifted one: the harmonics must stay crisp, with no smear in the upper bands.
  - Word timings (words.json) are always made from the final shifted file.
- Rick's own narrator is not any public ElevenLabs voice (checked on 2026-11-05 against 329 library voices with speaker embeddings: best match 0.83, while a true match scores 0.94+). Do not search for it again, and never clone it from his videos.

## Smooth acting (user rule, 2026-11-05; wins over master prompt v10.10 where they disagree)
The user's notes after "Why He Wanted His Potatoes Stolen":
- Facial and body animation must be smooth.
- Faces must flow into each other: never a sad face on one frame and a happy face on the next.
- Characters must move like real people.

This section replaces v10.9 part 8 B2 ("expressions swap instantly, 1 frame") and the "action in 1-3 frames" timing for everything except impacts. It keeps "no squash, stretch or overshoot", talking mouths that change every frame, irregular blinks, still listener bodies and planted feet.

Study these boards before acting a scene: A (faces), B (lip-sync and head turns, 0.134 s apart), X (whole-body acting) and AC/AD (idle and reactions). In B, the soldier's head turns over about 4 frames while the face slides round the head and the body leans in.

**Faces: never a one-frame jump**
- An expression change is a transition that finishes on its beat. Put the beat 0-3 frames before the word, so the new face is fully readable on the word. The transition runs from 4 frames before the beat (s-4) to 2 frames after it (s+2):
  - The brows glide from the old face to the new one with an ease in and out.
  - The eyes swap inside a 3-frame blink: half at s-2, shut at s-1, half at s.
  - The mouth shows an in-between shape for 2 frames (s-2, s-1): half-way open and already in the new mood, e.g. smirk -> smile -> laugh.
  - The head gives a small take of 2-3 degrees.
- Opposite moods (pleased <-> upset, e.g. sad -> happy, smug -> scared) take 10 frames and pass through a "realising" face:
  - The brows lift while the old face is still on.
  - A blink at s-7 swaps to open eyes, raised brows and a small mouth: "o" when heading to pleased, flat when heading to upset.
  - That face holds about 5 frames.
  - A half-lid at s-1 brings in the new face on the beat, with a 4-degree head take across the whole move.
- If the previous face change was less than 12 frames earlier, skip the realising face. The swap still hides inside a blink, with a flat in-between mouth.
- Every expression change goes through a beat in `flow()`. Never switch `expr` with a ternary or per-frame condition, because that bypasses the transition.
- Talking mouths still change every frame and override the in-between mouth. That is speech, not an expression change.
- A held extreme face still ends with one small change (one eye opens, a brow lifts), eased over 4-6 frames.

**Bodies: move like real people**
- Ease every move in and out with smootherstep. No linear moves, and no squash, stretch or overshoot.
- Overlapping action: the eyes and head lead by 2 frames, the torso moves on the beat, and the arms and props follow 1 frame late and finish 3 frames later.
- Arms swing on arcs: blend the elbow in polar coordinates around the shoulder and the hand around the elbow. Never slide the joint positions in a straight line.
- Gestures (point, lift, wave, shrug, reach, pick up, sit, stand) take 8-14 frames.
- Only impacts and strikes (a hit, a slam, a throw, a jump take-off) use the fast timing: a wind-up held about 6 frames, the strike in 1-3 frames, contact on the word, then a 4-5 frame effect.
- Turns: the head turns first and the body follows about 2 frames later. A facing flip happens when the head blend is half-way, never mid-camera-move without a blend.
- Speakers nod lightly on stressed words (2-3 degrees, about 8 frames, alternating direction) and point or gesture on the key word.
- Effortful actions rock the whole body with each stroke and bob the head (board X: the sawing worker).
- Walks:
  - Start by easing into the first step and stop with a settle step.
  - Steps take 9-12 frames, with a body bob of 3-7% and a lean of 1-7 degrees.
  - The stance foot stays planted.
  - The head turns toward where the character is going before the body does.
- Listeners: the body stays still, but the head and eyes turn toward the speaker or the object, eased over 6-8 frames, and the face reacts with transitions.
- A character holding one pose for more than 3 s may shift weight once: a lean of 1-2 degrees eased over 12-18 frames, then held. Never loop it, sway or breathe-bob.
- Each new beat blends from wherever the previous blend had got to, so there is no jump when beats come close together.

**Implementation** (tested in the potato project; a copy lives in the user's repo BenjaminWolff78/Claude-AI-Help on branch `why-he-wanted-his-potatoes-stolen`, folder `templates/cartoon-3d-short/acting/`: `flow_smooth.ts`, `fig.patch`, `world.patch`, `face_qa.py`. If that repo can't be reached, use the code below.)
1. **Figure drawer** (`fig.ts` in our pipeline; the matching face and figure code in the repo template's `toon.ts` / `cast.ts`):
   - Add `brow?: [number, number]; swapLid?: number; mouthX?: string;` to FigOpts.
   - Export `faceOf`.
   - In the figure, call the face with `Math.max(blink, opts.swapLid ?? 0)` as the lid, `(opts.mouth ?? opts.mouthX)` as the mouth, and `opts.brow` as a new last argument `browOv`.
   - In `face()`, use `F = browOv ? { ...F0, brow: browOv } : F0`.
2. **World** (where each cast entry gets `blink: lidAt(...)`): after building `o`, add `if (p.o && p.o.blink === undefined && p.o.swapLid) { o.blink = Math.max(o.blink ?? 0, p.o.swapLid); delete o.swapLid; }`. In QA mode, add `faces: [[who#idx, expr, mouth ?? mouthX, brow, lid, back]]` for every cast entry to the per-frame QA line.
3. **Shot header:** replace `mixO` and `flow` with this code. It needs `lerp`, `clamp01`, `pose`, `P`, `Face`, `FigOpts` and `words.json`. Use `talkNod(f, a, b)` by adding it to a speaker's `headTilt` during their line.
```ts
const HANG = (side: number): [[number, number], [number, number]] => [[side * 30, 45], [side * 33, 96]];
/** reference ease: symmetric smootherstep (eases in and out, no overshoot) */
const glide = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const gl = (f: number, a: number, d: number) => glide((f - a) / Math.max(1, d));
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
/** mood of each face: +1 pleased, -1 upset, 0 neutral */
const VAL: Record<string, number> = {
  grin: 1, laugh: 1, relief: 1, relief_open: 1, smile: 1, smile_closed: 1, lick: 1, smug: 1, eureka: 1, sly: 1, joy: 1, guffaw: 1, beam: 1, proud: 1, pitch: 1,
  stern: -1, nervous: -1, shock: -1, dazed: -1, pained: -1, dismay: -1, sheepish: -1, strain: -1, angry: -1, cold: -1, gulp: -1, wired: -1, dead: -1,
  yikes: -1, aghast: -1, green: -1, dizzy: -1,
};
const OPEN: Record<string, number> = { dash: 0, smirk: 0.05, frown: 0.05, wave: 0.1, smile: 0.2, lick: 0.2, o: 0.4, smileWide: 0.4, content: 0.15, flat: 0,
  grin: 0.55, teeth: 0.5, beam: 0.6, O: 0.9, laugh: 0.9, guffaw: 1, teethWide: 0.6, queasy: 0.1, puff: 0, tongue: 0.4 };
/** an in-between mouth: half-way open, in the mood of the face it is heading to */
const midMouth = (ma: string, mb: string, vb: number) => {
  const o = ((OPEN[ma] ?? 0.2) + (OPEN[mb] ?? 0.2)) / 2;
  return vb > 0 ? (o < 0.25 ? "smile" : o < 0.6 ? "smileWide" : "grin") : vb < 0 ? (o < 0.25 ? "wave" : "o") : o < 0.3 ? "dash" : "o";
};
const BRIDGE_BROW: [number, number] = [-5, -4];
const lerpB = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
type FaceState = { expr?: Face; brow?: [number, number]; swapLid?: number; mouthX?: string; headTake?: number };
/** the face at frame f for a swap from A to B landing on frame s */
const faceSwap = (f: number, A: Face, B: Face, s: number, room = 99): FaceState | null => {
  if (A === B) return null;
  // opposite moods need about 12 f since the last face change for the "realising" in-between; closer beats use a blink swap
  const FA = faceOf(A), FB = faceOf(B), va = VAL[A] ?? 0, vb = VAL[B] ?? 0, flip = va * vb < 0 && room >= 12;
  const lid = (c: number) => (f === c - 1 || f === c + 1 ? 0.5 : f === c ? 1 : 0); // a 3-frame blink centred on c
  if (!flip) {
    if (f < s - 4 || f > s + 2) return null;
    const st: FaceState = { expr: f < s - 1 ? A : B, brow: lerpB(FA.brow, FB.brow, gl(f, s - 4, 6)), swapLid: lid(s - 1), headTake: 2.5 * bump((f - (s - 4)) / 7) };
    if (f === s - 2 || f === s - 1) st.mouthX = va * vb < 0 ? "dash" : midMouth(FA.mouth, FB.mouth, vb);
    return st;
  }
  // opposite moods: A -> blink -> "realising" face (open eyes, raised brows, small mouth) -> half-lid -> B
  if (f < s - 10 || f > s + 2) return null;
  const st: FaceState = { swapLid: Math.max(lid(s - 7), f === s - 1 ? 0.5 : 0), headTake: 4 * bump((f - (s - 10)) / 13) };
  if (f < s - 7) { st.expr = A; st.brow = lerpB(FA.brow, BRIDGE_BROW, gl(f, s - 10, 6)); }
  else if (f < s) { st.expr = "neutral"; st.brow = f < s - 3 ? BRIDGE_BROW : lerpB(BRIDGE_BROW, FB.brow, gl(f, s - 3, 5)); st.mouthX = vb > 0 ? "o" : "dash"; }
  else { st.expr = B; st.brow = lerpB(BRIDGE_BROW, FB.brow, gl(f, s - 3, 5)); }
  return st;
};
/** polar blend of an arm (elbow around the shoulder, hand around the elbow): limbs swing on arcs */
const arcArm = (A: number[][], B: number[][], k: number): [[number, number], [number, number]] => {
  const pol = (x: number, y: number) => [Math.hypot(x, y), Math.atan2(y, x)];
  const ang = (a: number, b: number) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const [ra, ta] = pol(A[0][0], A[0][1]), [rb, tb] = pol(B[0][0], B[0][1]);
  const [ha, hta] = pol(A[1][0] - A[0][0], A[1][1] - A[0][1]), [hb, htb] = pol(B[1][0] - B[0][0], B[1][1] - B[0][1]);
  const r = lerp(ra, rb, k), t = ang(ta, tb), e: [number, number] = [r * Math.cos(t), r * Math.sin(t)];
  const hr = lerp(ha, hb, k), ht = ang(hta, htb);
  return [e, [e[0] + hr * Math.cos(ht), e[1] + hr * Math.sin(ht)]];
};
const NUMS = /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/;
const HEAD = /^(look|headTilt|headBack|hatLift)$/, LIMB = /^(armR|armL|propK|propRAng|propLAng)$/;
/** per-part blend: head leads by 2 f, torso on the beat, arms 1 f late and 3 f longer (overlapping action) */
const mixO = (a: P, b: P, f: number, s = 0, bl = 1): P => {
  const kH = gl(f, s - 2, bl), kT = gl(f, s, bl), kA = gl(f, s + 1, bl + 3);
  if (kA >= 1 && kH >= 1) return { ...b };
  const o: Record<string, unknown> = { ...b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a as Record<string, unknown>)[key], vb = (b as Record<string, unknown>)[key];
    const k = HEAD.test(key) ? kH : LIMB.test(key) ? kA : kT;
    const arm = key === "armR" || key === "armL";
    const side = key === "armR" ? 1 : -1;
    const A = arm ? (va ?? HANG(side)) : va, B = arm ? (vb ?? HANG(side)) : vb;
    if (arm && Array.isArray(A) && Array.isArray(B)) o[key] = k >= 1 ? B : k <= 0 ? A : arcArm(A as number[][], B as number[][], k);
    else if (typeof va === "number" && typeof vb === "number" && key !== "facing") o[key] = lerp(va, vb, k);
    else if (typeof va === "number" && vb === undefined && NUMS.test(key)) o[key] = lerp(va, 0, k);
    else if (va === undefined && typeof vb === "number" && NUMS.test(key)) o[key] = lerp(0, vb, k);
    else if (key === "expr" || key === "mouth") o[key] = vb;
    else if (key === "facing") o[key] = kH < 0.5 ? va : vb; // the head turns first, the body follows
    else o[key] = kA < 0.5 ? va : vb;
  }
  return o as P;
};
/** a pose timeline: beats [frame, pose(, blend)]; bodies blend per part, faces swap through a short transition */
type Beat = [number, P] | [number, P, number];
const flow = (f: number, beats: Beat[], blend = 8): FigOpts => {
  let i = 0;
  for (let j = 0; j < beats.length; j++) if (f >= beats[j][0]) i = j;
  if (f < beats[0][0]) i = 0;
  const cur = beats[i][1];
  // each beat blends from wherever the previous blend had got to (no jump when beats overlap)
  const stateAt = (j: number, g: number): P => (j === 0 ? { ...beats[0][1] } : mixO(stateAt(j - 1, beats[j][0]), beats[j][1], g, beats[j][0], beats[j][2] ?? blend));
  let m: P = stateAt(i, f);
  const nx = beats[i + 1]; // the head leads into the coming beat
  if (nx && f >= nx[0] - 2) m = mixO(m, nx[1], f, nx[0], nx[2] ?? blend);
  // faces: the transition into the next beat starts before it, the one from the last beat ends after it
  const exprAt = (j: number): Face => { for (let q = j; q >= 0; q--) if (beats[q][1].expr) return beats[q][1].expr as Face; return "neutral"; };
  let fs: FaceState | null = null;
  for (const j of [i + 1, i]) if (j > 0 && j < beats.length && !fs) fs = faceSwap(f, exprAt(j - 1), exprAt(j), beats[j][0], beats[j][0] - beats[j - 1][0]);
  const out: P = { ...m, expr: exprAt(i), mouth: cur.mouth };
  if (fs) {
    if (fs.expr) out.expr = fs.expr;
    if (fs.brow) out.brow = fs.brow;
    if (fs.swapLid) out.swapLid = fs.swapLid;
    if (fs.mouthX && !cur.mouth) out.mouthX = fs.mouthX;
    if (fs.headTake) out.headTilt = ((out.headTilt as number) ?? 0) + fs.headTake * ((((out.facing as number) ?? 1) >= 0) ? 1 : -1);
  }
  return pose(null, out);
};
/** speech accents: a small head nod (2-3 deg, 7 f) on each word onset inside [a, b) - add it to headTilt of the speaker */
const WF = (WORDS as { w: string; s: number }[]).map((w) => Math.round(w.s * 30));
const talkNod = (f: number, a: number, b: number, amp = 2.5) => {
  let n = 0;
  WF.forEach((o, i) => { if (o >= a && o < b && /[A-Z!?,.]/.test((WORDS as { w: string }[])[i].w)) n += (i % 2 ? 1 : -1) * amp * bump((f - o + 2) / 8); });
  return n;
};
```
4. **Face QA** (`scripts/face_qa.py <qa.jsonl>`, run on the qa_run output). It flags, per character:
   - MOOD FLIP: pleased on one frame and upset on the next. This must be 0.
   - BARE SWAP: an expression change with no blink on either frame. This must be 0, except for the back of the head.
   - BROW JUMP: more than 2.5 units in one frame. This must be 0.
```python
"""Face continuity QA (smooth-acting rule). Usage: python3 scripts/face_qa.py qa.jsonl
Reads the per-frame QA lines (faces: [who, expr, mouth, brow, lid, back]) and flags, per character:
  MOOD FLIP  - a pleased face on one frame and an upset face on the next (always a fail)
  BARE SWAP  - the expression changes between two frames with no blink (lid < 0.5 on both)
  BROW JUMP  - a brow moves more than 2.5 units in one frame
Talking mouths are expected to change every frame and are not checked here."""
import json, sys
VAL = {k: 1 for k in "grin laugh relief relief_open smile smile_closed lick smug eureka sly joy guffaw beam proud pitch".split()}
VAL.update({k: -1 for k in "stern nervous shock dazed pained dismay sheepish strain angry cold gulp wired dead yikes aghast green dizzy".split()})
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
rows.sort(key=lambda r: r["f"])
prev, flips, bare, brow, swaps = {}, [], [], [], 0
for r in rows:
    f = r["f"]
    for who, expr, mouth, br, lid, back in r.get("faces", []):
        p = prev.get(who)
        if p and p[0] == f - 1 and not back and not p[5] and not r.get("cut"):
            _, e0, m0, b0, l0, _ = p
            if e0 != expr:
                swaps += 1
                if VAL.get(e0, 0) * VAL.get(expr, 0) < 0: flips.append((f, who, e0, expr))
                if max(l0, lid) < 0.5: bare.append((f, who, e0, expr))
            if b0 and br and max(abs(b0[0] - br[0]), abs(b0[1] - br[1])) > 2.5: brow.append((f, who, b0, br))
        prev[who] = (f, expr, mouth, br, lid, back)
print(f"FACE QA frames {len(rows)}; expression changes {swaps}")
print(f"MOOD FLIP (fail) {len(flips)}: {flips[:30]}")
print(f"BARE SWAP {len(bare)}: {bare[:30]}")
print(f"BROW JUMP {len(brow)}: {brow[:30]}")
```
5. **Visual check:** before the full render, preview every frame (not every 5th) across 3 expression changes, including one opposite-mood change, and 2 gestures. Check that each face reads as one continuous change and that the arms arc.

## Everything moves, focus lands (user rule, 2026-11-06, "make sure all of the objects/characters are in motion and figure out when/what you should focus on"; every video)
Learned on the "Grape Bricks" remake. It wins over boards AC/AD where they say bystanders stay completely still. It keeps AD's ban on looping sways and bobs.

**Characters**
- **Life layer.** Wrap every shot's act function (`sec/97_life.ts` in the grape project, copied into the repo's shot_sections) so every character on screen gets small purposeful moves:
  - a glance (eyes plus a 2-degree head turn), a 3-5 degree head tilt or a 1.5-2.5 degree weight shift;
  - spaced 21-39 frames apart at irregular times, with a settle back to neutral on every other beat;
  - each eased over 10 frames and then held, never looped;
  - seeded per character, so two people never move in sync;
  - skipped while the character is busy with a scripted change (gesture, expression, facing, prop, walk), so the acting stays clean;
  - animals keep their own idles.
- **Long holds get a real task**, not just the life layer. A background worker keeps working (cranking, restacking, patting soil), and a listener reacts with a beat on the line about them (lean in, point, clap, nod, sniff). Lines naming a group ("neighbours") show the group doing it.

**Objects and sets.** Each set has at least three ambient moves, all subtle and purposeful:
- Foliage sways with a vertex offset, and the ink normal pass applies the same offset (`sway.ts`, `material.userData.sway`). Otherwise the outlines slide off the leaves.
- Cloth flutters (bunting, flags, curtains, calendar pages, loose papers). The flutter must move in the picture plane: a bunting tip that only swings along the rope's normal moves in depth for a camera facing the rope and reads as frozen. Sway the tips along the rope and lift them slightly as well, as a ripple down the line (about 0.7 Hz, tip travel about 0.1 m; `flutterV` in the grape remake's road.ts). Check two stills 8 frames apart.
- Machines idle (car body shake plus exhaust behind the rear bumper; check the car's forward axis).
- Light flickers (stove glow) and steam or smoke rises.
- Hanging things swing slightly (lamps, a pendulum clock).
- Liquids bubble. Put the bubbles on the front surface of the container as NOINK sprites, or the opaque liquid hides them.

**Focus (from the depth report and the boards)**
- **Never pull focus inside a held shot.** Focus changes only while the camera is already moving (glide or push) or on a cut. Use `follow(f, [[frame, target, glideFrames], ...])` synced to the camera move.
- Focus goes on the subject's eyes or on the story object. A beat about an object becomes an insert of that object.
- Blur level (`lens()` cInf) by shot size: insert 14, close-up 13, medium 12, full 8, wide 5, establishing almost sharp.
- On-screen cards sit just in front of the focus plane (`cardNearFocus`) so they stay sharp, and above heads, never across a face.
- Check stills at every focus target: a target that is a few metres off leaves the character the line is about blurred.

**Motion audit (run on every render, `scripts/motion_audit.py video.mp4 prefix 3 36 45`)**
- It removes camera motion (ECC affine), then reports 30-px tiles with texture that stay still for more than 36 frames. The caption band is masked.
- Read the overlay frames, not just the number. Buildings, hills and walls never move in the references either, so idle tiles on architecture are fine. Any idle tile on a character, a prop the line names or foliage is a fail.
- Report the before and after figures with the delivery.
- The audit misses motion smaller than a tile (small bubbles in a jug). Check those by eye in two zoomed stills a few frames apart before calling them idle.
- Realistic target: under 20% of frames with a quarter of the textured picture idle. The rest is architecture, which stays still in the references too.

## Boards (written summaries; the images live in the chat attachments)
- **A:** character close-ups.
  - Egg heads with a heavy ink outline, dot or lidded eyes, tapered brows and small mouths, plus blush.
  - Noodle arms with ball hands.
  - The face carries the acting: a sly squint, a squeezed-eye grin, a deadpan.
- **B:** acting and lip-sync sampled every 0.134 s (4 frames).
  - The mouth shape changes on every sample.
  - The head turns over a few frames, with the face sliding round it and the body leaning in.
  - Expressions progress through the line (neutral -> open -> smirk) instead of jumping between opposite moods.
- **X:** Rick moves the whole body and face.
  - The sawing worker rocks with every stroke, his head bobs and his face changes almost every sample (smirk, eyes closed, grin, wink, squint).
  - Ours held one frozen face for 2.4 s with no struggle.
- **O:** side-by-side of an earlier video vs Rick.
  - Characters act from frame 1 and heads fill about 45% of the frame in close-ups.
  - Reaction close-ups have a big face, a sweat drop and coloured light.
  - The final beat is a quiet close-up with a changed face.

- **AA:** scene lengths (one bar = one place and time with one continuous camera path).
  - Rick: 10-13 scenes per 65 s, median about 4.5 s, shortest about 2 s (single punch images only). The opening scene is one continuous camera path of 11.7-12.3 s (hook + "You see," + setup), and 1-2 more long scenes of 9-12 s carry the big moments.
  - Ours (Rat Poison): 16 scenes in 59 s; a 29 s montage of 13 places at the start; the hook characters vanish until 29.4 s.
- **AB:** scene lengths in five of Rick's Shorts (Jar, Railroads, Storm Oil, Mirror, Button) vs Rat Poison.
  - 9-13 scenes each, with a 9 s+ scene in the first 20 s.
  - Long scenes sit in a home-base place the story returns to; short 2.5-4 s scenes are time jumps or punch images.
  - The explanation is 4-7 s in its own place; the climax is long.
- **AC:** character acting and idle, Rick vs Bridge in the Desert.
  - Rick: the speaker's mouth changes every frame and the listener is completely still with a deadpan face and one blink.
  - Ours: one frozen face through whole lines, a frozen laughing group, and plain crossfades between unrelated rooms (ghost bodies).
- **AD:** acting in six kinds of scenes.
  1. A group reacts together on one word.
  2. A character talks down at someone with a new face on every phrase while the second character only smiles (one actor, one reactor).
  3. Idle with one cue action: a still smug sit, then one lift of the object on the key word.
  4. An expression on every phrase (sweat drop, fake cry, smug grin), with the body barely moving.
  5. A whole-body pose (a 40-degree tilt to look under something) while the background character stands still facing the action.
  6. A held extreme pose (puffed cheeks, squeezed eyes, whole-body lean) that ends with one eye opening.
- **AF:** camera holds, "Why He Painted Eyes on Cows' Butts" vs "The Pink Prison Cell Experiment" (optical flow on every frame). Cows: median stop 1.0 s, 61% of stops under 1.2 s, 39 relocations in 62 s at 45-90 px per frame, fence posts sweeping across the lens, ghost crossfades, farmers in a row facing the camera. Rick: stops of 2-5 s (median about 2.3 s), big beats as one 4-8 s shot where the subject keeps acting, 16-20 relocations in 46 s, glides of about 23 frames.
- **AG:** mouths on quoted lines, Rick's Pink Prison guard ("Barbie's going to love it in here", every 0.1 s) vs our grape-brick farmer and agent. Rick: about 10 shapes in 1.5 s, one per syllable (closed smile under the moustache, wide open with both rows of teeth, open with tongue, round, flat grin); the mouth is 40-50% of the face width with a dark inside; the head tilts and the moustache rides the jaw; the listener lifts a snack, bites, chews and goes smile, smirk, squint-laugh. Ours: the farmer cycles 4 small shapes about 25% of the face width, half hidden by the moustache, with eyes, brows and head frozen; the agent holds one tongue-out shape for 1.5 s (reads as licking) then snaps shut.
- **AH:** focus, small details and changing objects, Rick's Roller Coaster vs grape bricks. Rick: close shots blur the background (the empty wallet; the rival before a soft ring of string lights); every character holds a prop; overalls with patches and stitches, lanterns, banners, a moonlit set with fairy lights; the title object is huge and physically changes (the loop is bent, hammered wide, squeezed tall). Ours: the brick label cropped to "RAPE RICK", the house as sharp as the face, the agents tiny at the edge, the agent reading the label small behind the hero, the kitchen wide with characters at about 20% of frame height in flat light; floating icons (wine bottle in the sky, GALLONS labels) instead of objects; the brick never dissolves and the juice never turns to wine on screen.
- **AI:** hands doing the work, our Masterpiece video vs Rick. Ours: the painting appears from a puff of smoke while the painter stands still; the canvas flies into the oven, tips over the pipe and cracks by itself while he stands beside it arms-down. Rick: the hero raises the hammer, bends into the swing and grabs it off the stump; the scientist lifts the cup; in the close insert the can is tipped and stirred as if held by a hand just out of frame.
- **AJ:** show the big moment, move the camera - Rick's Railroads climax vs our crumple-zone video. Rick (58.4-64.7 s, every 0.42 s): the camera moves the whole time (a low glide along the rail, an aerial over the bridge, a head-on push at the train), the rail bends into an S, the train leaves the track, falls and explodes, and the hero reacts in the corner; the payoff is the picture, not a sentence. Ours: "Crash one into a wall and the car's fine" - the car rolls in and stops with no impact; "they crash the tank car" - it is already stopped and the dummy flying and its head popping are never shown; "draws the opposite" - the lines appear while the pencil hand stays by his face; "opens the door" - the door is never seen opening; 18 hard cuts and sideways camera travel in only 4% of frames (zoom-only elsewhere), so it plays like a slideshow.
- **AK:** colour and world, Rick vs "They Blew Up Houses to Stop a Fire". Rick gives every scene a real time of day (warm day setup, deep-blue night or storm, bright payoff) and builds rich, textured, lit 3D sets: brick, plaster, wood, cloud skies, sun shadows, and lamps and fires that glow and light the ground and the people. Ours: one purple-pink grade on every scene (39% of samples purple-magenta against Rick's 11-30%, mostly sunset skies), flat colour boxes with ink outlines, rows of identical flat flames that light nothing, cream cloud banks over the frame, and an olive second ending.
- **AL:** characters in groups. Rick's characters stand at different depths, overlap and touch, turn three-quarter toward each other, and have thin black limbs and textured costumes. Ours: the Captain's thick cream tube legs, flat rows of three facing the camera with arms down, the named Captain missing from the shot, and a beret frozen in mid-air above a head at 20.1 s.
- **AM:** people, the demo and the ending. Rick explains in-world with the same characters, keeps object inserts short (Storm Oil: two inserts, 2.5 s in all) and ends on the payoff. Ours: a modern kid's domino demo on a lawn under the caption, an empty setup street, a 7.4 s climax with no person, the chalk line and SOLD OUT stamp appearing by themselves, and a second modern ending with new people.
- **AE:** transitions that fit any story: subject-position match dissolve, smoke/dust/light dissolve, through the story object, shape-match dissolve, plus "pick by situation" (see the transitions rules above).

# Cartoon 3D story short (installed from github.com/mromidev/claude-animated-shorts, MIT)

This skill wraps the free pipeline from Mr omi's video "How to Make Viral Animated Shorts Using Claude". Its author had Claude measure 20 of Rick's Clips' Shorts at 30 fps. Then it built a three.js + Remotion renderer for the look: card-lit 2D characters, lens blur, a grade and camera glides, plus an ink pass on the 3D world that v10.14 switches off.

## Step 0: get the files (every new session)
1. `git clone --depth 1 https://github.com/mromidev/claude-animated-shorts.git` into a fresh folder in the working directory (e.g. `./cas`).
2. Read, in full: `cas/SKILL.md` (pipeline, final look values, gotchas, readability traps) and `cas/references/STYLE_BIBLE.md`.
3. Read the reports in `cas/references/reports/`. Read `characters.md`, `motion.md`, `outlines.md` and `lighting.md` before building, and `depth.md`, `grade.md` and `textures.md` before the look pass. They hold the measured numbers.
4. Look at the reference frames in `cas/references/frames/` and sheets in `cas/references/sheets/` before drawing anything.
5. Set up Remotion with @remotion/three, @react-three/fiber, @react-three/postprocessing and postprocessing. Use the versions listed in `cas/references/reports/CONTEXT.md`. Copy `cas/templates/bridge/` to `src/videos/<name>/` and `cas/templates/scripts/` to `scripts/`. The Kenney CC0 props (`public/bridge/kenney/*.glb`) are not in the repo: get them from kenney.nl if the network allows, otherwise model the props in code (the loader skips missing files).

## Precedence
- The master prompt wins over this skill and over the repo's SKILL.md. Ignore the repo's "User rules" section (see "Before anything else"), and also use 1-2 word captions in a white heavy font with a black outline at about 70% of frame height, one stinger about 11 dB under the voice, few ringing sounds and no loud swooshes.
- Keep the tested look values here and in templates/ (light, colour, lens blur, grade, camera glides, character drawing) unless the master prompt changes them. v10.14 replaces the world look: real lit, textured 3D, no ink pass on the world, no purple grade. v10.8-v10.10 change the acting, transitions, camera holds and v10.10's acting inside the hold, mouths, focus and detail (no squash, stretch or overshoot; still idles).
- Story, characters, names and shots are always original. Never copy Rick's characters or shots, never upload or publish the repo's reference frames or boards containing Rick's frames, and never say the channel's name in the video.
- Make every decision yourself; tell the user what you decided.

## Pipeline (summary; details in cas/SKILL.md)
1. Topic and facts (topic priority from "Channel data", every fact verified, Rick's Clips and zackdfilms checked; 5 titles showing the dumb act + the payoff, best one picked) -> hook workshop (6 scored candidates, shown to the user) -> script ("You see," by 6 s, everyday analogy, callback ending; about 3.8 words/s). Follow "Script length" and "Script craft".
2. Voice (see "Voice": The Pharaoh 3, gaps trimmed, one Rubber Band R3 pass with the speed-up and +3.5 semitones) and word timings (words.json) from the final file; everything is timed to the words.
3. Scene table (shown to the user before animating), then the shot plan in `story.ts` (SHOTS, XFADE, CAMS, KICKS, DOF, FOREGROUND). Reactions and expression changes finish their transition 0-3 frames before their word ("Smooth acting").
4. World (`lights.ts`, `shade.ts`, `build.ts`, `paint.ts`, `world.ts`), characters (`toon.ts`, `cast.ts`, `cardshade.ts`), post (`Bridge.tsx`, `ink.ts`, `lensblur.ts`, `grade.ts`).
5. Style lock before animating: render stills and make side-by-side sheets with `scripts/sbs_sheet.py` against the reference frames and the user's boards. Fix until the characters and sets match.
6. Look-match loop: score colour, lighting, ink, textures, characters, depth and composition out of 10 from the side-by-side sheets, with a numbered fix list. Repeat until every area is at least 7.
7. Sound (`cas/templates/audio/`), using the user's levels.
8. Render, mux with `-map 0:v:0 -map 1:a:0`, then run the checks:
   - `scripts/short_qa.py` (black, white, frozen and pop frames, loudness).
   - The per-frame camera QA (collisions, occluders, subject out of frame, faces cut by the edge, overlaps).
   - The v10.10 QA additions.
   Fix everything they find.
9. Send the user progress checkpoints as files as soon as each is ready (script, style-lock sheet, storyboard, first side-by-side review, and before rendering the v10.10 pre-render checkpoint: face strips for each quoted line, the body action in every shot, the title-object change frames), then the final mp4.

## Script length (user rule, every video; updated 2026-11-05 by "Channel data")
- Stay within 47-65 s. Multi-beat stories: 60-65 s (about 225-250 words at 3.8 words/s). One-trick stories: 47-52 s (about 180-200 words).
- Hard limits: never under 47 s or over 65 s.
- Length comes from the three escalating beats and the fake-out, never from extra setup. Better 58 s with every line pulling its weight than 65 s with filler.

## Script craft (user rule, every video, master prompt v10.10)
1. Fake-out at 30-45% of the runtime: one beat where the hero's plan seems to fail and the doubters look right, then the real payoff.
2. The hero never explains himself: cryptic one-liners only ("Trust the oil."). The viewer learns the reason at the reveal, together with the doubters.
3. Mockery escalates: one person laughs, then a group, then the whole town or room.
4. The doubters give the hero a mocking nickname, and it comes back at the payoff.
5. Plant one specific detail early (a number, an object, a story) that returns changed at the end (47 scratches become 48).
6. Use a rule of three where the third beat breaks the pattern.
7. Replace adjectives with one concrete picture ("not even a ripple in the emperor's wine").
8. Casual spoken words ("goes", "pretty sure", "a guy"). Quoted lines under 10 words; no sentence over 25 words.
9. The real mechanism takes 2-3 sentences at most, then straight back to the story.
10. Write the last sentence so it runs into the hook when the Short loops.
11. One debate line viewers will want to argue about in the comments (who was right, was it fair, would you have done it). See "Channel data".

## Nothing passes through anything (user rule, 2026-11-07; every video)
Characters never go through objects at all: not through a car body or door, a desk, a wall, a railing, a fence, a crate, a bench, a tree, or another character. This applies to the whole body card, the feet, the arms and the props they hold.
- **Plan with solids.** Every set exports its solid footprints (walls, furniture, vehicles at their animated positions, rails, posts) as boxes. Every mark and every walk path keeps a clearance of at least the character's half width (about 0.3 m) from them. Walks go round obstacles with extra path points, never through them. Cars that move carry their box with them, and a character standing by a car keeps 0.15 m from its body even when a door swings open (stand outside the door's arc).
- **Sitting in vehicles.** A sitting card goes on a SEATS mark inside the cabin. Check it in a still from the shot's camera: the head must be below the roof and the body inside the glass, with no limbs poking through the doors or the windscreen. If the card is too big for the cabin, scale the sitter, never let it clip. Measured on the crumple-zone video: a seated adult card's head top is 1.13 m x scale above its mark, the chin 0.65 m x scale. Use scale 0.78 and put the mark so the head sits inside the window opening: about 0.49 m in a 1.46 m-roof car, 0.53 m in a 1.56 m-roof car. Stars, boings and sparkles around a seated head go at about mark + 0.8 m, inside the cabin, never above the roof.
- **Hands touch, never sink.** A hand that presses, knocks, paints or opens something stops at the surface. Aim the arm offsets at the surface point projected into the shot camera, and keep held props (wrench, brush, cane, pointer) in front of or on the surface, never inside it.
- **Thrown and flying things** (balloons, a popped head, bricks) travel on arcs that clear every solid and bounce off the floor, never through a wall or a person.
- **Characters never overlap each other:** 0.6 m apart at the feet, more when they gesture toward each other.
- **QA (print it):** a per-frame interpenetration check over the whole render range. For every cast card and fx object on screen, test the footprint (feet circle 0.3 m) and the body box against the set's solids and the other cards. Print every frame with an overlap (who, what, how deep) and fix every hit before rendering. Then check stills at the start, middle and end of every walk, door-open and vehicle move.
  - The tested version (repo templates/cartoon-3d-short/qa/world_qa_pierce.ts.snippet): in World.qa(), 8 horizontal rays of 0.2 m x scale out of each standing card at shin, waist and chest height (2+ hits = pierce); one ray up from each seated card's mark to its head top (1.15 m x scale - 0.12); any two cards closer than 0.45 m = pierce. Run it with qa_run.mjs (low res, about 14 min for 1900 frames) and summarise with qa_report.py (pierce / cut / over / near-lens / occluded frame ranges).
  - Call root.updateMatrixWorld(true) at the top of qa(). The set is posed that frame, so without it the raycasts use last frame's matrices and report false hits on the first frame of a set and while cars move fast.
  - Faces cut by the frame edge are allowed only while a character walks in or out, and during the 6-12 frame quick moves. Every other cut is a fix.

## Character continuity (user rule, every video)
- **Actions flow into each other.** When a character goes from one action to the next (running -> stumbling -> falling -> lying down, standing -> sitting, walking -> stopping), play every in-between beat: the wind-up, the transition action itself and the settle.
  - Never switch pose modes from one frame to the next (e.g. a `run` pose on frame N and a `lie` pose on frame N+1). Play a transition action (trip, stagger, sit-down, collapse) that hands off to the new mode.
  - Gestures follow the "Smooth acting" timing: 8-14 frames, eased, with overlapping parts. Only impacts use the 6-frame wind-up and 1-3 frame strike.
- **Characters stay in the scene.** Within one set, every character who is in the story at that moment exists on every frame and keeps their position and state across shot boundaries.
  - A new shot reframes the camera; it never removes and re-adds characters, and nobody blinks out for a few frames.
  - Keep one persistent per-set cast list (positions and states as functions of the global frame) that all shots in the set read from, instead of separate casts per shot.
- **Characters only leave by acting it:** walking out of frame, being driven or carried off, or the scene changing place through a motivated transition.
- **QA:**
  - Before rendering, run a continuity check over every frame. For each set, list any character present on frame N and absent on N+1 (or the reverse) without an exit or entrance action, and any pose-mode change between consecutive frames without a transition. Fix every hit.
  - Then check the rendered video for one-frame pose jumps at each shot boundary.

## Framing people in 9:16 (lessons from the crumple-zone video)
- Place people and cameras with a projector (repo templates/cartoon-3d-short/qa/proj.py: world point -> screen x, y and depth for a pos/look/fov) before rendering any still. Include the camera's push-in: a slow push of k per frame narrows the frame by k x the shot's frame count, so a face at x 0.75 on the first frame ends cut.
- A 9:16 medium shot fits about three heads side by side without overlap. Heads at the same depth sit in one row, so a fourth person, or one standing behind another, hides a face. Use a 62-66 deg lens for a group with an object, drop a person out of frame, or give the extra person their own shot.
- Painted text on an object (a door, a sign) needs a clear line of sight. No body box between the camera and the letters, and the person doing the painting stands at the end of the text, not in front of it.
- Wall signs and plates: size them to sit fully inside the widest shot of the set (two lines beat one long line), or high enough to leave the frame in the low shots. A plate under an object must clear any nearby block or wall edge, or oblique cameras hide its first letters.
- Lights on stands and other props go in corners, out of every shot's line of sight to its subject. A glow sprite between the camera and an insert's subject reads as a white blob.
- In-scene moves that count as shot changes take 6-12 frames. Longer glides between two framings fail the v10.12 check.
- Never put code after a // comment on the same line. The crash hall's floodlight stands were silently commented out that way.

## Gotchas
- A held prop can vanish behind a set piece next to the character (a door edge, a shelf) or behind the head on a hand-to-mouth pose. Check one still on every prop beat (sip, lift, stamp) and use the arm's Top flag for hand-to-mouth so the prop draws over the face.
- Remotion bundles copy `public/` into the temp folder every time; point TEMP/TMP at a roomy folder and clean old bundles when done.
- The world gets no ink pass (v10.14). Character cards still go on the NOINK layer and keep their own drawn outline.
- Every hold needs a slow push-in, or QA reads it as a freeze.
- Effect-card textures are cached by key: any card whose drawing changes over time (fade, glow strength, shine sweep) must put the changing value, quantised, into its key, or it freezes on its first drawing.
- The full render takes about 6 hours and each background job stops at 2 hours: render in resumable chunks and relaunch until every chunk exists. A chunk moved away after the loop has passed it is only redone on the next run.
- Never wait on a render with `pgrep -f <script name>`: the wait loop matches its own command line and never ends. Wait for a chunk file or a log line instead.
- A camera key built from a helper that calls screenSide()/walkPath() for the same shot recurses forever; compute positions with polyAt() inside SHOT_CAMS.
- Check stills in the middle of long camera blends and cranes, not only at the keys: a crane can pass through a wall or bridge face and leave frames with no character.
- **Learned on the forger video (2026-11-06):**
  - `render_range.mjs` caches the bundle URL in `rtmp/bundle_ok_<name>`. Delete that file after ANY code change, or re-rendered chunks silently use the old code.
  - Check every `fit()` camera position against the room bounds before rendering (a Python port of fit() plus a per-set "inside the room" test). In 9:16 a wide group or a long object seen broadside forces the camera metres away and through a wall: shoot long objects (a cart, a table) end-on, and tighten the group or change the az instead.
  - Also project the other characters and big props into each hold: a cart or worker parked "off to the side" can sit right in front of the lens for a different az.
  - Arm offsets are screen-space (x+ = screen right) and are not mirrored by `facing`. A paper or sign held up in front of the face needs `armRTop` (or `armLTop`), or it draws behind the head.
  - Lip-sync: build per-frame visemes from words.json with a grapheme-to-viseme map spread over the voiced frames, plus mood overrides on key words (smile, frown, wide). Check that each quoted line reaches 8 distinct shapes with a face strip cropped from a cast-sheet render before animating.
  - v10.10 rule 7 in practice: replace a crossfade that has people on both sides with a light dip (the frame floods with the scene's light colour for about 4 frames, the cut happens under it, then it clears over about 6). Before a push into an object that dissolves to another place, have the character walk out of frame (an acted exit) so the dissolve carries nobody.
  - Signs the camera pushes into: lay them out as whole lines above and below a centred focal point (photo, number), so the push trims whole lines off the top and bottom instead of cutting words at the sides ("SOLD 1943" cropped to "OLD 1943"). Draw any texture the camera gets close to at 4-5x resolution.
  - Pinned notes and posters: check them in the final framing for occluders between the lens and the wall (open wardrobe doors, the hero's hat). A cropped "EVERY" read as "VERY".
- **Camera holds in practice (learned on the grape-brick video, 2026-11-06):**
  - Measure with `scripts/stops.py out/t/qa.jsonl` after the per-frame QA run (copy it from the grape-brick project). It prints every stop, the median, the share under 1.2 s, each move with its peak px/frame (about 44 px per degree of image motion), and the breaks. Dissolve frames count as breaks, not stops.
  - 22 px/frame peak means a 30-40 frame glide may change the view by only about 10-13 degrees. Relocate by pushing or pulling along the same axis (wide shot to subject, subject to object), not by swinging around. Any relocation over about 15 m (across a road, to another building) is a hard cut, and those count toward the 4-cut limit. Plan which 4 relocations get them before animating.
  - Write glides as `K(f0, glideTo(prevShot, f0, nextShot, f1, lift, bulge, yLead, lookLead), 1)` so they start exactly where the previous framing (including its creep) ended. A `K(f, ..., 1)` without that is a one-frame jump that QA reads as a hard cut.
  - Never start a move right on a dissolve: open every shot on a hold of at least 1.2 s.
  - Long holds: keep the creep at 0.0012 or less for holds over 4 s, or the push crops the people at the frame edges.
  - In 9:16, two people standing side by side force fit() to put the camera far away, because the width is the binding limit. Stagger them in depth instead (about 1 m sideways, 1.5-2 m in depth). Check where fit() puts the camera against the set's solids (barn, house, walls) with a quick port of fit() before rendering stills.
  - A group framed from along a fence line puts the posts across the lens. Film straight across the fence from a raised camera, so the rails sit below every face.
  - Clear the camera paths of props that sit between two characters (a stacked table, a doghouse). Stills at the start, middle and end of every hold catch them.

## Gotchas learned on the crumple-zone video (2026-11-07)
- A character card reaching toward a surface that recedes from the camera (a door, a wall) is hidden by that surface wherever the surface is nearer the lens than the card plane. Move the mark nearer the lens along the camera ray and scale the card down (CastPlace.scale) so it reads the same size; solve the hand path with tools/proj.py against the surface's world coordinates.
- Pose-mode switches (stand to brace, stand to kneel) inside a flow() blend snap in one frame. Use the continuous controls instead: mode "kneel" with kneelK, mode "brace" with braceK (0 = standing legs, 1 = full brace), and keep the mode string the same on both sides of the blend.
- After killing a render batch, kill orphaned Chromium processes (parent PID 1, a gpu-process at 100% CPU); one doubled every later chunk's render time.
- Diff the caption words (words.json) against the script before rendering: the aligner wrote "salesman" for the spoken "salesmen".
- After any retime, re-run the per-frame QA on the changed range before reading stops.py; stale QA logs hide new short holds. Run stops.py from the app folder.

## Gotchas learned on the fire video (2026-11-08)
- Changing shot or set code while a chunked render runs leaves chunks rendered with the old code. Move every chunk rendered before the change aside, delete the bundle marker so the next chunk rebuilds, and re-render them.
- Per-frame QA can miss the camera passing through a character in a pan. Compute the camera-to-character distances along every move (tools/fitpy.py) and keep at least the near-plane margin.
- Build the cover pose as a THUMB branch of the first shot (`getInputProps().thumb`), so frame 1 and the cover show the same moment.
- Progress bar in the chat: when the render-progress mod is on, write /home/claude/.render-progress.json (title, stage prep/rendering/paused/finishing/done, framesDone, totalFrames, framesPerMin, capFrames = last frame of the running batch, tailMin, etaMin, updatedAt) when the render starts and after every chunk; the bar reads it every 10 s.

## MASTER PROMPT v10.14 (full text, as given by the user on 2026-11-08, with the rules part 14 D deletes taken out and the music rules added as part 14 G; replaces v10.13 and earlier)
(Where part 8 B2 and B4 say expressions swap instantly and actions take 1-3 frames, the "Smooth acting" section above overrides it, except for impacts. Where it gives title, length or voice rules, the "Channel data" and "Voice" sections above override it.)

RICK'S CLIPS MASTER PROMPT v10 (COMPLETE). This one document REPLACES v4, v5, v6, v7 and every add-on (characters, universal rules, camera/focus, act-out, v8, v9). Do not use any earlier prompt or add-on. Reference images: A-O (Rick frames), P-U (transitions, detail, objects, acting), V-Y (characters, camera flow, acting, showing the title thing). The pictures are the spec; where words and pictures disagree, the pictures win. Make every decision yourself and tell me what you decided.

PRIORITY when two rules seem to conflict: 1 characters look like Rick, 2 the story's thing is shown clearly, 3 acting and camera flow, 4 sets and colour, 5 everything else. Numbers in this prompt are checks, not goals. A video can pass every number and still look wrong; your side-by-side review (step 5) decides.

THE WORKFLOW (all five steps, in order, every video)

STEP 1. TOPIC AND SCRIPT
a. Title first: a curiosity question or strange claim the viewer cannot answer from the title ("Why Perfect Railroads Don't Work", "Why Sailors Carried Storm Oil", "The Burglar Who Only Moved Furniture"). Real, checkable fact with a human twist. Do not reuse the last three formats or settings.
b. Hook (first sentence, at most 5.6 s): one strange concrete action plus a stake, already happening at frame 1.
c. Structure: hook, a doubter or problem by 10 s, a spoken open question by 20 s, three escalating beats, the trick named at 60-72% of the runtime, one everyday comparison, the payoff, a callback ending. Every sentence has one concrete thing we can picture.
d. Length 56-66 s (aim 62), 200-245 words, voice "The Pharaoh 3" (Qziuou6kCJ2R3w53L2Zs) on eleven_v4, one take, one whole-file atempo about 1.28, no gaps in the voice. (Overridden by the "Voice" section: instead of atempo, one Rubber Band R3 pass with the speed-up only, no pitch shift.)

STEP 2. STYLE LOCK (before any animation)
a. Build the cast and one frame of every set first.
b. Render a side-by-side sheet: each of our characters next to a Rick character from board V at the same size, and each set frame next to a Rick set from boards S and A-O.
c. Check each pair against the CHARACTER SPEC and SET SPEC below and write pass or fail per item. Redraw and re-render until every item passes. Only then animate. Keep the approved kit and reuse it in later videos.

STEP 3. STORYBOARD
For every shot write: the words, the subject, the action the subject does, the camera move, how the shot connects to the next one, and the Rick reference it copies in technique (for example "W: Storm Oil slow push-in to the two-shot", "P: ride the motion", "X: sawing rock"). No shot without a Rick reference.

STEP 4. ANIMATE AND RENDER

STEP 5. SIDE-BY-SIDE REVIEW (two rounds minimum)
Render one frame every 2 s of our video next to the matching Rick reference frame from the storyboard. For each pair list every visible difference (head colour and size, outline, face, pose, body action, light, detail, colour, framing). Fix and render again. Then run the QA list at the end.

CHARACTER SPEC (board V, plus A-O)
1. Heads are WHITE or off-white for every character, never skin-coloured, tan or pink. No blush, no coloured ears.
2. Head is a big round egg, about 35-45% of the whole figure height (hat included), widest near the eye line, with a thick black outline that wobbles slightly like a brush line. Never boxy, flat-topped, wide-jawed or pointed. It may squash and stretch a little with strong expressions.
3. Face: small black oval or dot eyes (wide circles with pupils only when shocked), short thick eyebrow strokes that do most of the acting, a small mouth line or simple open mouth with teeth. Sweat drops and ^^ eyes for jokes. Faces change on almost every spoken phrase.
4. Hair, beards, hats, caps sit ON the egg as separate shapes with their own outline and pattern (striped cap, bowler, top hat, chef hat).
5. Body: a small rounded bean or capsule, shorter than or about as tall as the head, with a lot of costume detail (vest, buttons, watch chain, scarf, apron, stripes, collar).
6. Arms and legs: thin black noodles, often bent, ball or mitten hands, small feet.
7. Each character is recognisable by silhouette (hat shape plus costume colour). Costume colours contrast with the background.

ACTING (board X, T)
1. Every verb in the narration is acted by the whole body, not just the face: sawing rocks the whole body with every stroke; "gets stuck" means kicking legs, arms pushing, the object pressing down, a strained face; "laughs" means the body shakes and the head tips back; "shrugs" means both shoulders up, palms up, brows up.
2. Use anticipation (a short move the other way), a fast action, a small overshoot, follow-through (hat, cloth, hair, dust, sparks), then a held reaction face.
3. Nobody stands still. Speakers move head and brows on stressed words; listeners blink, squint or lean at least every 0.5-1 s.
4. Action and danger share the frame when the story allows (board X: he saws while the train light grows behind him).

CAMERA FLOW AND TRANSITIONS (boards W, P, Q, R)
1. Every place is already full of people doing things. When the story moves to another character, the camera travels TO them where they already stand (W: Storm Oil 5.8-11.3 s, one slow push-in of about 5 s from far to a two-shot, no cut; Railroads 43.6-46.1 s, from the prop up to the two characters standing behind it).
2. One continuous move may carry 2-3 lines. Hold each composition at least 1.5 s; most moves last 2-5 s, slow, eased in and out.
3. Between places use a motivated transition: ride the motion, push through a window or door, into an object, shape or texture match dissolve, fly-through, slide-dissolve, walk into the lens. A hard cut is for a new angle in the same place, a punchline or a time jump.
4. Never an empty frame: every frame shows a character or the object the narration names (no plain wall, no empty scaffolding, no wardrobe filling the frame).
5. Never cut off a face at the frame edge. Faces sit in the upper-middle of the frame, above the caption line.
6. Foreground pieces (a cat, a hull, a lamp) frame the edge and cover at most 15% of the frame. No big blobs, trees or poles across the frame or across a face.
7. No camera roll, shake or sway.

SHOW THE STORY (boards Y, T)
1. The title thing is on screen at least 4 times, exaggerated so a child sees it in half a second, and it is the biggest thing in the payoff shot. (Leaning Houses never showed a house leaning.) Show it next to a normal version for comparison when it is a difference (a leaning house next to a straight one or a plumb line).
2. Explain by changing the object itself (the rail turns yellow as the calendar goes from MAY to JULY; a caliper measures the gap). In-world diagrams only: a cutaway, a model, a board, a top-down view.
3. The noun in each line is on screen while it is said. Each joke has its own small, full set (the rival in a deck chair under a striped umbrella with a drink and a sweat drop).

SET SPEC AND COLOUR (boards S, A-O)
1. Each set has at least 4 textured materials, at least 2 visible light sources with glow and shadow, at least 10 props, depth (a window, a door, a street behind), and wear.
2. Colour script: each scene has its own dominant colour key, and neighbouring scenes contrast (Railroads: red canyon under a blue sky, a brick station in sun, a red and blue carriage). A whole video in one orange-brown key is a fail.
3. Particles only when the place calls for it (snow outdoors in winter, dust in a sun beam, sparks from metal). Never weather indoors, never particles over a face.

CAPTIONS AND AUDIO
1-2 words per caption (at most 3), white heavy font with a black outline, about 68-72% of the frame height, on the spoken word, never lagging. Nothing important in the bottom 20%. -14.3 LUFS integrated, voice loudest, music about 15 dB under the voice and ducked under quoted lines (part 14 G), sound effects about 17 dB under, one stinger at the pivot about 11 dB under. Few ringing sounds, no loud swooshes. The mp4 has the same name as the mp3.

QA BEFORE DELIVERY (print all of it; fix every fail, do not just report it)
a. The style-lock sheet with pass or fail for each character and set item.
b. The storyboard table with the Rick reference for each shot.
c. Both side-by-side review rounds and what was fixed.
d. Frame scan: no frame darker than 15 or brighter than 245 mean; no near-empty frame (very low contrast for more than 0.3 s); no face cut by an edge.
e. Motion sanity: each third of the video has median motion of at least 15 (Leaning Houses' middle third was 7.3); no stretch longer than 1.5 s where both camera and characters are still, except a held reaction of at most 1 s.
f. Title-thing count and the timestamps where it is shown.
g. Length, words, trick position, loudness.
Delivery message: put any failed item in the first line, then the decisions, then the numbers.

DETAILS THAT MAKE IT SHINE (part of v10; check every one in QA, they are easy to lose)
1. Look: the sets are lit 3D worlds with soft shadows, warm and cool light, and a slightly soft background (depth of field). The characters are drawn 2D shapes living inside them: they take the scene's light and colour, cast a soft shadow on the ground, and the background behind them is a little blurred.
2. Frame 1: no logo, no title card, no fade-in, no black frame. The hook subject is already moving and fills at least 25% of the frame height.
3. Script voice: Rick uses "You see," once, right before the explanation of the setup ("You see, two companies..."). Include one short quoted line from a doubter or rival ("We're about to get boarded and you're making soup?").
4. Lip-sync: while the narrator describes a character talking or reacting, that character's mouth changes shape about every 0.13 s and the head bobs on stressed words.
5. Living world: each shot has one main mover plus two small ambient loops (smoke, flags, water, steam, birds, swaying lamps). Background extras do small things (walk, point, chat) instead of standing like statues.
6. Variety: at least 10 sets or lighting setups and at least 6 shot types per video (wide with depth, medium acting shot, big reaction face, prop close-up, top-down, cutaway or diorama, through a window or frame). No shot longer than 5 s.
7. Objects travel and never pop in or vanish: thrown things fly in an arc, falling things bounce and settle, lifted things swing on their rope.
8. Lasting changes stay visible: soot, wet clothes, dents, mud, a broken plank stay for the rest of the scene.
9. Props have invented names and signs (FIRST LINE IN GETS IT ALL!, VANDERGOLD, STORM OIL). Text always fits inside its sign or tag. No real brands. The only other text on screen is the caption: no small text at the top, no labels floating in the air.
10. Scale gags: once or twice per video, show something at a funny scale (people crawling on a giant map, a tiny model house next to the real one).
11. Payoff: the biggest, brightest, most detailed shot of the video. The title thing fills at least half the frame, with particles and a strong light change, for at least 2.5 s, followed by one quick reaction shot.
12. Ending: a calm close-up of at least 1.5 s with a changed expression and the callback prop, no fireworks in the last 2 s, and a last line that loops smoothly into the first line.
13. Change the accent colour (caption highlight, key props) from the previous video.
14. Title: short and curious, with one emoji at the end.

PROGRESS CHECKPOINTS (do not stop and wait; send and keep working)
As soon as each is ready, send it to me as a file in the chat so I can catch problems early: (1) the script with the title, (2) the style-lock sheet (our cast and sets next to Rick's), (3) the storyboard table, (4) the first side-by-side review sheet. If I reply with a correction, apply it before going further.

PIPELINE AND MEASURED LOOK (part of v10; where this disagrees with anything above, this wins)
Source: the free skill github.com/mromidev/claude-animated-shorts (MIT). Its author had Claude measure 20 of Rick's Shorts at 30 fps and then built a working three.js + Remotion pipeline that copies the look. Use it as the starting point instead of building a renderer from scratch.
A. Clone the repo. Read SKILL.md, references/STYLE_BIBLE.md and the seven reports in references/reports/ (motion, depth, textures, characters, lighting, outlines, grade); they hold the measured numbers. Start the renderer from templates/bridge/ (lens blur, grade, card-lit 2D characters, camera glides; switch its ink pass off and replace its flat painted textures with the real materials of part 14 E2) and templates/scripts/ (stills, side-by-side sheets, frame QA). Replace the story, sets and characters with ours.
B. Ignore the skill's own "user rules": we DO use captions, 1080x1920 output, our audio levels (voice loudest, music about 15 dB under (part 14 G), SFX about 17 dB under, -14.3 LUFS) and our voice. Story, characters and shots stay original. Never upload or publish the reference frames in that repo. The Kenney CC0 3D props it loads are not in the repo; download them from kenney.nl if the network allows, otherwise model the props yourself.
C. No ink on the 3D world (deleted in part 14 D). Characters carry their own dark outline, thicker on the shadow side.
D. Light: lit side warm; shadows neutral grey-blue by day and deep blue at night (never brown), about 3.5:1 lit to shadow. Day sun from the side and frozen per shot. Golden hour is backlit by a low orange sun with a peach horizon and long shadows; the only purple is in the sky. Characters are lit by the scene (no glow, no emissive), with a soft contact shadow under the feet.
E. Depth: lens blur on about one third of screen time (close-ups, medium shots, inserts), focus on the eyes; wide shots stay sharp. Fog colour equals the horizon colour, so distant things fade toward the sky.
F. Colour: saturated, never crushed black (no black materials; darks are coloured). Day sky deep blue at the top, pale at the horizon.
G. Characters (refines the character spec): about 3.5 head-heights tall (head 1 : torso 1.1 : legs 1.4); bean head about 0.94 high per width, slightly tapered with a little asymmetry and tilt, never a perfect circle; stick limbs about 0.055 of the head width; ink-dot hands; no blush and no eye highlights; blink every 0.5-2.3 s; walking bobs 3-7% and leans 1-7 degrees with planted feet.
H. Camera (CORRECTS my earlier shot-rate rules; this was measured frame by frame on 20 Shorts): hard cuts are rare, 0-1 per video in most of them. About 80% of frames the camera holds, and every hold slowly pushes in (0.15-0.35% per frame, 0.6% on punch words), so nothing is ever frozen. Moves are smooth glides of 18-40 frames that ease in and out. Changes of place use camera moves, follow an object, a fly-through a window, a whip with motion blur, or a 6-8 frame dissolve. Rolls of 4-5 degrees only on emphasis beats, glided in; short shakes that decay over 7 frames on impacts; no hand-held float or whole-frame sway. This replaces "18-26 shot changes per minute", "no shot longer than 5 s" and "no camera roll".
I. Effects: fire, smoke, splashes and sparks are animated, lit effects (part 14 E3); small dust puffs, speed lines and stars may stay as cards.
J. Look-match loop (how the skill's author got close): measure the reference by topic, change one area at a time, render stills, and have a fresh reviewer score each area out of 10 (colour, lighting, ink, textures, characters, depth, composition) from side-by-side sheets against the reference frames, with a numbered fix list. Repeat until every area scores at least 7.

LESSONS FROM THE TUTORIAL VIDEO (part of v10; where this disagrees with anything above, this wins)
From "How to Make Viral Animated Shorts Using Claude (Full Workflow)" by Mr omi, the author of the skill above, who trained Claude on Rick's style.
1. MEASURE, DON'T OPINE. Never judge Rick's videos or ours by "what you think". Look at every frame at 30 fps (sampling a few frames misses the micro-animations, tiny camera moves, shading and light changes that make it look real). Turn every 2 s into one 60-frame contact sheet, track the camera frame to frame (phase correlation), and measure brightness, contrast and saturation. Compare numbers, then fix the biggest gap.
2. HEAD SHAPE CORRECTION. Measured on 38 of Rick's heads: they are ROUND, slightly wider than tall (height about 0.94 of the width), with a little taper and asymmetry. They are not tall eggs. Where the character spec says "egg", read "round bean, slightly wider than tall". Bodies are 3.5 heads tall; arms and legs are thin single strokes (the author's first version had limbs 5 times too thick and bodies under 3 heads tall).
3. CAMERA CORRECTION. The camera is moving in about 65% of frames, mostly very slow push-ins that a quick look misses. It is almost never fully still. A move from one spot to another glides over about 23 frames, slow in and slow out, never a snap of 3 frames.
4. LIGHT FOLLOWS THE STORY'S TIME OF DAY. Each scene is lit for a real time of day, and the light changes where the story's time changes (a night-blue look at the explanation only if the story's time of day changes there).
5. COLOUR. No ink lines on the 3D world. No pure black anywhere in the picture. Shadows are neutral by day and deep blue at night, never brown. Wood and stone have real texture: visible grain and dark gaps between planks.
6. TOPIC CHECK. Before writing, check Rick's channel titles. If he already covered the topic or the same experiment, pick another one.
7. FACTS MAKE JOKES. Check every fact (dates, numbers, depths). A precise fact often becomes the best joke, e.g. the deadpan double line "Luckily, the river was only 2 ft deep. Unluckily, the river was only 2 ft deep."
8. CHECK STILLS BEFORE RENDERING VIDEO. Typical faults the author found: the camera stuck inside a building, free 3D assets in the wrong colour (teal trees), a chain or prop in front of faces, a camera push that flies past the character. Fix them in stills first.
9. WORK AS A TEAM WHEN THE LOOK IS OFF. Seven analysts (colour, ink lines, light and shadow, textures, characters, depth and framing, motion) each put our frames next to Rick's and measure the gap; one handles sound. Then four builders (camera, world, characters, final look), each with its own copy of the project and its own files, merged back file by file. Split the files, not just the jobs.
10. GIVE IT TIME. The author gave Claude about 10 hours to learn the style and finish one video. Do not rush the look-match rounds.

FIXES FROM "WHY BOSTON SHIPPED ICE TO INDIA" (part of v10; where this disagrees with anything above, this wins; reference images Z1, Z2)
What worked and must stay: the cartoon-3d-short look (white heads, bean bodies, scene light on characters), the topic, the hook line, "You see," at the pivot, the beach-cooler comparison, the sawdust air-pocket close-up, the map and calendar beats, the India crowd behind ropes, the jump on "That's the trick!", the fall into the debtors' prison, -14.3 LUFS, 64.7 s.
1. SHOT VARIETY (biggest gap, board Z1). The hero stood centred, facing the camera, at the same size for most of the video; the camera only pushed in (zooming in 94% of frames, travelling sideways in 32%). Rule: no two shots in a row with the same subject size and angle. Rotate: over-the-shoulder, low angle, high angle, profile two-shot, extreme close-up of a prop or face, wide with a foreground framing piece, view from behind the character, tracking alongside a walking character. Characters face three-quarter or in profile at least half the time, looking at each other or at the object, not at the camera.
2. THE CAMERA TRAVELS THROUGH THE SCENE. In every place, at least one move per scene carries the camera from one character or object to another that is already there (pan, track or crane across the set, landing on the next subject on its word). Holds still creep in, but a scene longer than 4 s may not be one push-in on one person.
3. HARD CUTS. This video had 14 hard cuts and about 11 dissolves. Target: at most 4 hard cuts, used only for punchlines and impacts. Every change of place is a camera move (follow an object, through a window or door, into an object, fly-through, whip with blur) or a dissolve of at most 8 frames. The 1.2 s ghost dissolve at 26.8-28.0 s must never happen.
4. CAMERA COLLISION CHECK (board Z2). Run a per-frame check on every camera path: the camera never passes through or ends inside a character, a prop or a wall (55.2 s inside the ice block, 28.2 s through crates, 57.6-57.9 s through the rope line); no translucent object over the subject (17.1 s hatch); the named subject is in frame on its word (15.2 s empty deck while "he opens"); characters never overlap or interpenetrate (9.2 s). Fix with near-plane culling, sight-line culling and path changes, then re-render stills.
5. EVERY VERB IS ACTED, WITH HANDS AND LEGS. Missing in this video: "he tries again" and "more melts" (he stands still), "he packs blocks in rice husks" (the ice is already packed, his hands never move), "he passes a sawmill" (he never walks; legs must walk with planted feet), "dumping mountains of sawdust" (nothing is dumped), "people line up just to touch it" (show hands touching the ice). Each verb gets a visible body action of at least 0.6 s, starting 0-3 frames before the word.
6. BACKGROUND LIFE. Every set has 3-8 extras already doing something (loading crates, rowing, sweeping, chatting, carrying sacks), at different depths, so the camera can travel to them. In the tropics dock the people stood in a line facing the camera; give them work and reactions instead.
7. LIGHT ARC. Warm, bright light for the setup and a bright payoff; a night-blue look at the explanation only if the story's time of day changes there.
8. ENDING. The final shot (61.4-64.7 s) is 3.3 s of one push-in on the hero. Keep the callback, but give it a small action (he places the last ice block, the crown slips) and a held reaction of 1-1.5 s, and end on the last spoken word.
9. QA additions: print the camera translation share (target at least 50% of frames, not only zoom), the hard-cut count (at most 4), the longest dissolve (at most 8 frames), the number of shots where the hero is centred and frontal (at most 30% of runtime), and the collision check results.

HOOK AND SCRIPT FORMULA, MEASURED ON 17 OF RICK'S SHORTS (part of v10; where this disagrees with anything above, this wins)
Study only: learn the pattern, never copy his lines, stories or characters.

A. WHAT THE 17 SHORTS SHOW
Hook (sentence 1), and when "You see," starts:
- "He saw gaps into a railroad every 39 ft." (9 words) -> "You see," at 3 s. 14M views.
- "They buried a man alive with a bell tied to his finger." (12) -> "You see," at 3 s, and again for the final twist. 11M.
- "He put a bronze ball in a dragon's mouth and told the emperor, 'If this ever falls out, run.'" (19) -> one reaction line ("The whole court burst out laughing."), then "You see," at 5 s. 31M.
- "A knight paid a priest to forgive a crime he hadn't committed yet." (12) -> "You see," at 3 s.
- "He sold his happiest memory to a stranger behind a counter." (11) -> "You see," at 3 s.
- "It's impossible to get fired in Japan, but companies found something way worse." (13) -> "Imagine..." 16M.
- "Gambling is illegal in Japan. Yet, there's a gambling hall on almost every street." (14) 13M.
- "He bet his life savings on the slowest horse in the race." (12)
- "A man snuck into a family's house every night and moved every single thing one inch to the left." (19)
- "The fastest gun in the west had one rule. Never draw first." (12)
- "There's a button in the middle of town and nobody's allowed to press it." (14)
- "If your ship got hit by a cannonball, you'd actually be one of the lucky ones." (16)
Patterns:
1. The hook is ONE sentence of 9-16 words (median 12), spoken in 3.5 s or less. It states a finished, absurd act or a rule that contradicts common sense, as plain fact. It is never a scene description, never a question, never "Did you know".
2. The subject is anonymous: He / A man / They / A knight / There's a... No names, years or places in sentence 1 (names and dates come later, if at all; first names only for invented people: Eddie, Gary, Jerry).
3. Past tense in the hook, present tense for the story after it ("He saw gaps... You see, two companies ARE racing...").
4. The absurd part comes LAST in the sentence ("...a crime he hadn't committed yet", "...one inch to the left", "...tied to his finger").
5. "Sounds stupid, is actually smart" (or the reverse): the act sounds dumb on its own, and a real reason makes it clever. That gap is what makes people watch to the end.
6. Two places for "You see,":
   EARLY (5 of 17, including two of his three biggest): sentence 2, starting 2.5-6 s in, with no pause after the hook. It explains the world or the rule that makes the hook possible, and the setting (time, place) lives inside this sentence.
   LATE (9 of 17): at 60-80% of the runtime it reveals the mechanism or the twist. Some videos use both.
   When "You see" is not used, the bridge is "Imagine you're...", "But how? Well, picture...", "Wait, X? Well,...".
7. Inside the story: 1-2 short in-character lines of mockery in quotes ("You're wrecking my railroad!", "Hey, it's the toy guy."); 1-2 exaggeration jokes ("That horse lost a race to the milk cart, and it was pulling the milk cart."); odd specific numbers (39 ft, 47 scratches, 3:00 a.m.); escalation with time markers (the first night / by the end of the week / by the end of the month); one spoken question at 15-35 s ("How is that possible?", "Wait, practiced?"); an everyday comparison that starts with "Ever...?", "Think about the last time..." or "Picture...".
8. The last sentence is the twist or the callback, short, ending on its key word. No moral, no summary, no "and that's why".
9. Pace 3.6-4.1 words per second with no pauses; sentences are short, linked by "So", "But", "Then".

B. OUR DEFAULT FORMULA (use for most videos; the user wants this one)
0.0-3.5 s HOOK: one paradox sentence as in A1-A5.
3.0-6.0 s "You see," + the rule of the world that makes the hook make sense, with the setting folded in. No sentence of plain scene-setting before it.
6-20 s the plan or the problem, plus one mocking line in quotes.
15-35 s one spoken question that deepens the mystery.
Escalation in three beats with time markers and one exaggeration joke.
60-75% the real reason ("That's the trick." or a second "You see,") plus one everyday comparison.
Last 3-6 s the twist or callback, ending on the key word, looping into the hook if possible.
Use the late-only "You see" or "Imagine you're..." for at most 1 in 4 videos, for variety.

C. HOOK WORKSHOP (do it every time, print it)
1. Write 6 hook candidates. Score each 0-1 on: 9-16 words; finished absurd act or contradiction; one concrete object (a bell, a gap, a button, a suitcase); the absurd part at the end; no name, year or place; a stranger would ask "wait, why?". Keep the best (6/6).
2. Read the hook plus the "You see," sentence aloud at 3.8 words per second: the hook must end by 3.5 s and "You see," must start by 6 s.
3. Then cut the whole script: every sentence must raise a question, escalate or pay off. Delete scene-setting sentences that do none of these.

D. EXAMPLE, REWRITING "THE MAN WHO SOLD THE EIFFEL TOWER"
Ours: "This man is selling the Eiffel Tower, and the buyer is about to hand him a suitcase of cash. It's Paris, 1925, and the newspapers say the tower is rusting and costs a fortune to paint. You see, it was built for a world's fair..." ("You see" at 10.4 s; the hook is a scene, not a paradox; 6 s of setting before "You see").
Rick-style: "A man sold the Eiffel Tower, and the buyer paid him extra to be robbed. You see, in 1925 the tower was rusting, it cost a fortune to paint, and Paris was quietly talking about tearing it down." ("You see" at about 4 s; the paradox is "paid extra to be robbed", which the bribe trick explains at 67%.)
Add one exaggeration joke ("a hotel so fancy the doorman had a doorman") and one mocking line from a rival dealer.

E. TOPIC TEST (stupid but interesting)
The topic must survive this sentence: "[Someone] did [something that sounds dumb or impossible], and it [worked / was the smartest move / ruined them]." True, checkable examples in this shape (verify before scripting): a soldier who kept fighting for 29 years after his war ended because nobody told him (Hiroo Onoda); a state senator who sued God, and the case was thrown out because God could not be served (Ernie Chambers, Nebraska 2007-08); a man who ate an entire airplane over two years (Michel Lotito, Cessna 150); a plan to set off a nuclear bomb on the Moon to impress the world (Project A119). Fictional "what if" stories in Rick's style (the memory shop, the button town) are fine when labelled as stories.

MOTION FIXES FROM "THE MAN WHO SOLD THE EIFFEL TOWER" (keep everything else; it measured well: 61.2 s, 3.82 words/s, no voice gaps, -14.3 LUFS, 6 hard cuts, camera travelling in 74% of frames, no frozen frames, trick named at 67%)
1. Hook frame: show the absurd act itself, big, at frame 1 (the handshake over a deed with the tower behind, the suitcase of cash opening). Main characters at least 30% of frame height; not a row of people facing the camera.
2. Dissolves: about 13 in this video, several with half-transparent people in the middle of the frame (4.6, 14.2, 26.8, 37.0, 52.4, 55.2, 58.0 s). At most 5 per video, 6-8 frames each, only between places, ideally shape-matched; all other changes are camera moves.
3. No shot of 2 s or more without a character or a moving prop (10.2-13.2 s was 3 s of bare tower lattice). Put life in it (a painter on a rope, fair crowds, the "20 years" permit held by someone).
4. Two-shots longer than 3 s need gestures from both people (34-37 s: the wife stands still with arms down; give her crossed arms, a raised eyebrow, a point at the letter) and a small camera travel.
5. Over-the-shoulder foreground heads cover at most 25% of the frame and must read as a person (hat brim, ear, collar), not a featureless blob (22.8-24.2 s).
6. Keep the collision check: the camera skims the table flowers at 18.8-19.0 s.
7. Keep: the money burst on the train, the scratch sparkle, the newspaper headline, the permit signs, the "guess what he's selling?" callback.

SCENE STRUCTURE AND FLOW (part of v10; for the NEXT video and every one after; where this disagrees with anything above, this wins; reference images AA and AB)
Measured frame by frame (0.5 s sheets plus a 0.1 s colour-change scan) on five of Rick's Shorts: The Ancient Jar That Warned an Empire (31M, his biggest), Why Perfect Railroads Don't Work (14M), Why Sailors Carried Storm Oil (12M), How a Mirror Rigged a Horse Race (4.8M) and The Town Built Around a Button (3.3M), then checked on the skill's reference sheets. A SCENE = one place and one time. The timings below are a pattern, not a template: the script and topic decide the exact lengths.
A. WHAT RICK DOES
- 9-13 scenes per 64-65 s. Most scenes 3-7 s. Scenes of 2-3 s are only time jumps (that night, the next morning) or a single punch image (a beam, a number, a jaw snapping).
- Every one of the five has a long scene (9 s or more) inside the first 20 s, carrying the hook, "You see," or the setup: Jar 0-13.5 s (throne hall), Railroads 0-11.7 s (one camera flight from tunnel to station), Button 0-12.3 s (guards, whole town, back to the button), Storm Oil 6-23 s (17 s on the ship's deck after a 6 s opening flight from the cook to the pirate ship), Mirror 3.5-12.7 s (the betting room after a 3.5 s hook).
- Long scenes (9-17 s) happen in a HOME-BASE place the story keeps returning to: the betting room appears 4 times in Mirror, the deck carries most of Storm Oil, the palace carries the start of Jar. Each return to the home base is again 5-8 s long.
- Inside a long scene the camera may change angle (close-up, two-shot, reverse), but the place, the light and the people stay, and everyone keeps acting. Railroads and Button do it as one unbroken camera move; Jar and Storm Oil cut between angles inside the same room or deck. Both are fine; jumping to a new place is not.
- The explanation gets its own place (the galley, the inside of the jar, the telegraph room), 4-7 s. The climax spectacle is long: Storm Oil 12.1 s, Railroads 7.2 s, Jar 6.5 s.
- Characters are never lost: the hook's worker is back at 13.6 s; the betting-room regulars are there every time we return.
B. WHAT "THE RAT POISON GOLD MEDAL" DID
- 16 scenes in 59 s. The first 29 s is a montage of 13 places averaging 2.3 s each (car, starter, map, thermometer, organiser, well, road, runner 15, the runner who nearly dies, mailman, dog, road).
- Hicks and his coach, the hook characters, vanish at 3.5 s and do not return until 29.4 s.
- Empty frames on scene changes: 38.3-38.7 s (the camera swings off the official to empty sky), 46.0-46.6 s (an empty drugstore before anyone appears), the bare grass at 12.0 s and the bare road at 21.2 s.
- The second half is already right: car 11.8 s, drugstore 8.9 s, stadium 6.3 s, each one continuous path with the characters acting throughout. Keep that.
C. RULES
1. Plan 9-13 scenes for 60-65 s (7-10 for 45-55 s). Print a scene table before animating: start, end, length, place, the camera path or angles in one line, characters present at the start and at the end, and the events inside.
2. Pick one or two HOME-BASE places for the story (where the hero and the doubters are) and return to them. At least one scene of 9-17 s must fall in the first 20 s; it carries the hook, "You see," or the setup in one place. A short 3-6 s opening flight or hook shot before it is fine.
3. 2-3 scenes of 9 s or more in total, the climax spectacle 6-12 s, the explanation 4-7 s in its own place, other scenes 3-7 s. A scene under 3 s only for a time jump or a single punch image; never 3 scenes under 3 s in a row; no montage stretch. Let the script decide: a beat with dialogue, mockery or a plan in one place gets a long scene; a jump in time gets a short one.
4. A list in the script (several runners, several problems, several steps) is shown in ONE scene: the camera travels along the road, the line or the room from one example to the next, and each example is already there acting. Do not give each item its own place.
5. CHARACTER CONTINUITY. No character vanishes on a scene change. The main characters either travel with the camera into the next place (walk, ride, get carried), or the next scene opens on them already there; if the story leaves them, show them leaving (walk off, door shuts, car drives away). The hook's characters are back on screen within 12 s.
6. ACTION FLOW. Each character's action ends in the pose the next action starts from (no pose snaps across a cut or a dissolve). Actions overlap: one character starts reacting while the other is still finishing. A scene change starts on a motion that continues into the next scene in the same direction and speed.
7. Every frame of a scene change shows a character or the named object. No empty sky, empty room, bare grass or bare road, even for 0.3 s.
8. QA: print the scene table with real timings from the render; the count of scenes under 3 s; the length of the long scene in the first 20 s and of each home-base scene; for every scene change, who is on screen in the last frame before and the first frame after; and any frame without a character.
9. CONSTANT ACTION INSIDE EVERY SCENE (a long scene is never a long hold). What Rick's long scenes contain, from the frame sheets:
   - Railroads opening (11.7 s): the worker saws with his whole body, the train's light grows behind him, the train bursts past, the camera rides it over the canyon, smoke pours out, the camera drops to the desert floor, and a station full of people under a "FIRST LINE IN GETS IT ALL" banner swings into view. That is a new visible event about every 1.5 s.
   - The gambling hall prize counter (about 14 s, skill sheet short16): the clerk hands over cookies, then chocolate, then shampoo, then tokens, one item per spoken word, while the hero's face reacts to each.
   - The Burglar living room (skill sheet short10): he pushes the couch, the ruler shows one inch, the light changes to morning, the fridge has slid, the dad stares, each on its line.
   Rule: inside a scene, something new and visible happens on every spoken phrase, about every 1-1.5 s: a character starts an action, a prop changes or moves, a second character walks into frame, an effect fires (dust, sparkles, sweat drops, music notes); the camera itself stays on each subject at least 2 s (part 9). The main action is tied to the words; a character who just spoke reacts while the next one acts.
   This is NOT everyone moving all the time: background extras hold still or do one small loop and only act on cue (the skill's motion report measured Rick's background crowds as frozen except on cue), and the camera keeps its slow creep. Busy, jittery extras look cheap; one clear new event per phrase looks alive.
   QA: in every scene of 6 s or longer, list the events with their times; flag any gap of more than 2 s with no new event.

CHARACTER ACTING, IDLE AND TRANSITIONS, PLUS SCRIPT CRAFT AND LENGTH (part of v10; where this disagrees with anything above, this wins; reference images AC, AD (acting and idle in six kinds of scenes) and AE (transitions picked by situation), with P, Q, R)
Measured on Rick's Shorts frame by frame (Storm Oil 6.5-7.9 s at 0.2 s steps, Railroads sawing at 0.25 s steps) and in the skill's references/reports/motion.md and characters.md (20 Shorts measured at 30 fps). This part REPLACES the squash, overshoot and "nobody stands still / listeners lean every 0.5-1 s" wording in the earlier parts: Rick uses no squash and stretch, no overshoot frames and no wobbling idles.

A. WHAT "WHY HE PUT A BRIDGE IN THE DESERT" DID (keep everything else; it measured well: 63.8 s, -14.3 LUFS, Lake Mirage sign callback, Mr. Nowhere nickname, map gag, visitor counter)
- Characters hold one pose and one face through whole lines: the hero at 33.6-35.1 s on "So what's a bridge with no river for?" (no mouth, brow, blink or hand), the laughing salesmen at 16.9-18.4 s (one frozen laugh face, bodies still, the hero does not react). The hero keeps the same smug half-lidded face for most of the video.
- About 9 plain 6-8 frame crossfades between unrelated rooms (office to London 10.2 s, nickname to map 21.0 s, map to bridge 26.8 s, lake to office 39.9 s), so a half-transparent hero floats over another room; plus 12 hard cuts. The camera travels sideways in only 34% of frames (Eiffel Tower: 74%); the rest is push-in only.

B. HOW RICK'S CHARACTERS ACT (measured)
1. Speech: a character who speaks (in quotes or "he goes...") moves the mouth on every frame of the line, matched to the voice (line, open with teeth, round O, wide), with brows and moustache moving on stressed words. The mouth leads the sound by 0-1 frame.
2. Expressions swap instantly (1 frame), 0-3 frames BEFORE the word that causes them, and a blink often hides the swap. Each character changes expression on almost every phrase that concerns them: smug, shocked (big white eyes with small pupils), deadpan lidded, squint-laugh, angry V brows, sweat drop, panic.
3. Blinks: 3-4 frames (half, shut as a line, half), every 0.5-1.5 s (Rick: 6-7 blinks in 4 s on a face in close-up), irregular, never on a fixed timer.
4. Actions are fast and sharp: a short wind-up held for about 6 frames, then the action in 1-3 frames, contact exactly on the word, an effect (dust, spark, splash, impact star) for 4-5 frames. No squash and stretch, no overshoot, no rubbery smears. Walks: 9-12 frames per step, body bob 3-7%, lean 1-7 degrees, feet planted.
5. Body turns take 1-4 frames with the face sliding round the head; never a sudden flip during a camera move.
6. WHEN A CHARACTER HAS NOTHING TO DO: the body is completely still (no breathing bob, no swaying, no looping wave). What keeps it alive is the face: blinks, the eyes looking at whoever is speaking or at the object being talked about, and an instant expression swap on each line about them. The stillness is often the joke (the cook's deadpan while the captain yells). Only motivated idles move: a sleeper's head lolls, a bored guard taps a foot once.
7. Reactions overlap: while one character finishes an action, the other's face has already changed. A line about a group ("his salesmen laughed", "the whole town laughed") is shown as a group acting together: bodies shake, heads tip back, someone points at the hero or slaps the desk, and the hero reacts with a face (unbothered smirk, eye-roll).
8. Every question or claim a character makes gets a hand: points, palms up, counts on fingers, taps the map, holds up the object.

C. TRANSITIONS (fixes the plain crossfades)
1. Between places, use a motivated move (boards P, Q, R): ride a motion (a car, a boat, a thrown object, a walking character carries the camera into the next place), push through a window, door or frame, dive into an object, or a shape-match dissolve (the toy bridge on the desk dissolves into the real bridge; the drawn lake on the map into the real lake; the sign's number into the next sign).
2. A plain crossfade is allowed only for a time jump in the SAME place (the same lot by day and then years later), 6-8 frames, with characters standing in the same screen positions so nothing ghosts.
3. Never crossfade between two shots that both have a character in a different screen position (no ghost bodies). If a transition would ghost a body, change it to a motivated move or a hard cut on a punch word.
4. Hard cuts: at most 4, only for punchlines, impacts and reaction close-ups.
5. Keep the camera travelling sideways or around the action in at least half the frames; a hold is a slow push-in of 0.15-0.35% per frame, not a static frame and not the only move.

D. SCRIPT CRAFT (from 17 transcripts)
1. A fake-out at 30-45%: one beat where the hero's plan seems to fail and the doubters look right (a ball falls and nothing happens; the gaps shrink and the boss gloats). Then the real payoff.
2. The hero never explains himself; only cryptic one-liners ("Trust the oil.", "Attack and find out."). The viewer learns the reason at the reveal, together with the doubters.
3. Mockery escalates: one person laughs, then a group, then the whole town or room ("the regulars are betting on whether he'll bet").
4. The doubters give the hero a mocking nickname, and it returns at the payoff (Bridge did this well with Mr. Nowhere).
5. Plant one specific detail early that returns changed at the end (47 scratches become 48; Bridge's POP. 300 becoming 10,000 is a good example).
6. Rule of three with the third beat breaking the pattern ("Then one night a ball dropped. Then another. Then all eight at once.").
7. One concrete picture instead of an adjective ("not even a ripple in the emperor's wine").
8. Casual spoken words ("goes", "pretty sure", "a guy", "Pal"); quoted lines under 10 words; no sentence over 25 words.
9. The real mechanism takes 2-3 sentences, then straight back to the story.
10. Write the last sentence so it runs into the hook when the Short loops (Rick: "We'll build our town right..." loops into "There's a button in the middle of town").

E. LENGTH
Aim for 62-65 s (about 235-250 words at 3.8 words per second); Rick's biggest Shorts are 63.5-65.5 s. A story with only one trick: 44-50 s (170-190 words). Never under 40 s or over 68 s. Get the length from escalating beats and the fake-out, not from extra setup.

F. QA ADDITIONS
a. For every shot with a speaking character: confirm the mouth moves on every frame of the line.
b. For every character on screen longer than 1.5 s: list the blinks and expression swaps with times; flag any face unchanged for more than 2 s while its character is being talked about.
c. List every crossfade with the place before and after; flag any between different places or with a ghosted body.
d. Print the camera sideways-travel share (at least 50%) and the hard-cut count (at most 4).
e. Print the word count, the length and the fake-out timestamp.
G. PICKING ACTING AND TRANSITIONS FOR ANY STORY (boards AD and AE)
Acting: the character the line is about acts; everyone else is still but faces the action. A new face on every phrase about that character, with a blink between. Idle = a still body with a readable face, never a looping sway. A held pose must be extreme (squeezed eyes, puffed cheeks, whole-body lean) and ends with one small change (one eye opens, a brow lifts). Group reactions happen together on the same word. Every spoken line has a hand.
Transitions: object to person = subject-position match dissolve (the new subject fades in on the same spot and size, then the camera reveals the place). Time passes or a disaster = dissolve inside smoke, dust, steam or light. The story's object exists = go through it (mirror, lens, window, map, painting, newspaper photo). Two places share a shape = shape-match dissolve. Something moves from A to B = ride the motion. Same place, new angle, or a punchline = hard cut. Everything else = a camera move that carries the character into the next place.

CAMERA HOLDS: HOW LONG THE CAMERA STAYS ON EACH SUBJECT (part of v10; where this disagrees with anything above, this wins; reference image AF)
Measured frame by frame on "Why He Painted Eyes on Cows' Butts" (optical flow on every frame) and on Rick's "The Pink Prison Cell Experiment" (3.7M, frame sheets every 0.5 s), checked against the Shorts measured earlier (Ancient Jar, Railroads, Storm Oil, Mirror Race, Button) and the skill's motion report.

A. WHAT "WHY HE PAINTED EYES ON COWS' BUTTS" DID
Keep: the hook ("A guy saved a bunch of lions by painting eyes on cows' butts!", "You see," at 3.3 s), the "Butt Picasso" nickname, the farmers falling off the fence laughing, the 62 to 61 night count, "Trust the eyes", the lion explanation, the cookie-jar comparison, the 0 vs 15 scoreboard, the village lining up for a job, 61.9 s, -14.3 LUFS, 6 hard cuts.
Problems:
- Inside a "continuous" scene the camera lands on a subject for well under a second and whips to the next one. Measured: the camera stays on one subject for a median of 1.0 s, and 61% of its stops last under 1.2 s. There are 39 camera relocations in 62 s (one every 1.6 s), with peak speeds of 45-90 px per frame (1080 wide), 2-4 times faster than Rick's glides. Examples: 3.75-7.5 s shows hero, cows, farmers, shooting and the lion in under 4 s; 12.5-16.25 s shows cow face, hero, herd, a fence post, a tiny hero and farmers; 34.5-38.25 s shows hero, a ghost dissolve, cows, farmers, a row of farmers and the lion.
- Fence posts sweep across the lens during moves (14.75 s, 31.0 s).
- Ghost crossfades between different places at 7.25, 11.25, 34.25 and 43.0 s.
- Farmers stand in a straight row facing the camera (16-20 s, 37 s).
- Cause: the earlier rule "something new happens on every phrase... a new character is reached by the camera" was read as "move the camera to a new subject every 1-1.5 s". It is corrected below.

B. WHAT RICK DOES (measured)
- The camera stays on each subject 2-5 s; the median stop is about 2.3 s and almost none are under 1.5 s. Big beats are one shot of 4-8 s (Pink Prison: the inmate laughing at the pink walls while cracks spread, 4.8 s; the arm wrestle, 7.8 s; the aerial flight over the country, 4.8 s).
- While the camera is on a subject, the subject DOES something: the prisoner walks in and comes back out, the scientist lifts the stopwatch, the inmate flexes, the cracks spread. That is where the "new event every phrase" comes from.
- The camera relocates only when the sentence moves to a new subject: about 16-20 relocations in 46 s, roughly one every 2.5-3 s.
- Each relocation is a glide of about 18-40 frames (typically 23) with slow in and slow out; between relocations the camera creeps with a slow push-in (0.15-0.35% per frame).

C. RULES
1. CORRECTION TO PART 7 RULE 9: the new event on every phrase happens INSIDE the shot (the subject acts, a prop changes, an effect fires, a second character walks into frame). The camera does not move to a new subject on every phrase.
2. HOLD LENGTH (target deleted in part 14 B). The hook image, the mockery moment, the fake-out, the climax and the explanation each get one shot of 4-8 s.
3. RELOCATION BUDGET: deleted in part 14 B.
4. HOW TO RELOCATE: a glide of 18-40 frames with ease in and ease out, peak speed under about 22 px per frame at 1080 wide (about 2% of the frame width per frame). No whip pans, except at most 2 deliberate whip transitions on a punch word per video.
5. LISTS AND GROUPS: when the script lists several things (lions eating cows, farmers shooting lions), frame them together in one wider shot and let them act one after another, or make one slow track past them with each item centred for at least 1.2 s. Never whip from item to item.
6. NOTHING CROSSES THE LENS: no fence post, pole, tree or character passes between the camera and the subject during a move; cull or move occluders.
7. GROUPS AT DIFFERENT DEPTHS: crowds and doubters stand at different distances and angles, turned toward the action, never a straight row facing the camera.
8. PLAN IT: the shot list gives every shot its subject, start, end, length (2 s or more), the action the subject does during it, and the glide into the next shot (frames). Before animating, print the count of shots under 2 s and the relocation count.
9. QA from the render: print the peak speed of each move, the largest camera roll (5 degrees or less), and any frame where an object crosses the lens.

ACTING INSIDE THE SHOT, MOUTHS, FOCUS, OBJECTS AND SMALL DETAILS (part of v10; where this disagrees with anything above, this wins; reference images AG and AH)
Measured frame by frame on "He Labeled Grape Bricks 'Don't Make Wine' and Beat Prohibition" (optical flow on every frame, face crops every 1/15 s, full-size frames) and compared with Rick's "This Shape Saved Roller Coasters" (2.4M), "The Pink Prison Cell Experiment" (3.7M) and "The Ancient Jar That Warned an Empire" (31M): frame sheets, face crops every 0.1 s, and a scene-by-scene craft breakdown of each from vidIQ, plus the boards made earlier (A, B, X, AC, AD).

A. WHAT "GRAPE BRICKS" DID
Keep: the calmer camera (stops now last a median of 2.4 s, only 12% under 1.2 s - part 9 worked), 5 hard cuts, the hook and "You see," at 4.0 s, the 21-day calendar, the agent who reads the warning and puts the brick back, the cake-mix comparison, the lawyer callback, 64.3 s, -14.3 LUFS.
Problems:
1. The action inside the shot disappeared. Characters stand straight with their arms at their sides in nearly every shot; measured in-frame motion is half of the Cow Butts video. Examples: the hook (0-3.9 s) where the hero only turns; the neighbours in a row behind the fence (19.5-24 s); the kitchen wide shots (32-37 s, 43-48 s) with small, still characters; the woman standing with closed eyes for 5 s (43-48 s).
2. Mouths (board AG): the farmer's "Nobody's buying a grape brick, boy" cycles 4 small shapes, about 25% of the face width and half hidden by the moustache, while his eyes, brows and head never move. The agent "reading the warning out loud" repeats one tongue-out shape for 1.5 s, which reads as licking, then snaps shut. Neither follows the syllables.
3. Focus (board AH): in close shots the background is as sharp as the face (the hero at 12-14.5 s with the house behind him). Story events happen small or half hidden: the federal agents arrive tiny at the frame edge (22.7-23.9 s); the agent reading the label is small and behind the hero (26.5-29 s).
4. The title object never changes on screen: the brick is never dropped into water, never dissolves, the jug never bubbles or darkens. Instead there are flat floating icons (a wine-bottle sticker in the sky at 4.75-7.5 s; bottle, ban sign and "GALLONS" labels at 37.75-42.5 s).
5. The brick's label is cut by the frame edge so it reads "RAPE RICK" (12.75-14.5 s). This must never happen.
6. Ghost crossfades between different places with people in them are back: 14.75, 19.25, 31.75, 49.5 and 60.25 s.
7. Characters cut in half by the frame edge (the left farmer 4-8 s, the boy 34-37 s, the man at the table 27-28 s).
8. Flat, even light in most shots; no light source you can see.
9. Plain costumes and empty hands; few props and little set dressing.

B. WHAT RICK DOES (measured)
1. MOUTHS: the guard saying "Barbie's going to love it in here" shows about 10 different mouth shapes in 1.5 s, one per syllable: closed smile, wide open with top and bottom teeth, open with tongue, round, flat grin. The mouth is big (about 40-50% of the face width), dark inside with teeth and tongue; the head tilts and the moustache moves with the jaw. Rick's narrator lines are not lip-synced; only quoted lines are.
2. LISTENERS ARE BUSY: while the guard talks, the other guard lifts a snack, bites, chews and goes smile, smirk, squint-laugh on the joke.
3. EVERY BEAT IS A WHOLE-BODY ACTION: heaving on a lever with bent legs, swinging a hammer again and again with sparks on each hit, a palms-up shrug on "Not really", tiptoeing behind a sleeping man with a wrench, flexing and stomping until cracks spread, an arm-wrestle slam, being thrown out of a gate face-first, pulling a cart up a hill, sprinting and grabbing gate bars, leaning over a wall to point and mock.
4. OBJECTS CHANGE ON SCREEN: the coaster loop bends, is hammered wide, then squeezed tall; red paint pours and swirls into white; cracks spread across the walls; the bench is ripped from the floor; the scarf unspools; the jar turns and its pendulum swings into a rod. The title object is big and its change is the picture.
5. FOCUS: close and medium shots have a soft background (the empty-wallet close-up; the rival laughing in front of a blurred ring of string lights; the wine cup seen from above). Wide shots are mostly deep focus. The focus is always on whoever or whatever the line is about.
6. LIGHT YOU CAN SEE: a full moon, string lights, a lantern on a tripod, torch sconces, sunbeams through barred windows, a pink glow spilling out of a cell door.
7. SMALL DETAILS: overalls with patches, stitches and buttons; cap badges, belts, ties, moustaches; props in hands (wallet, hammer, telescope, lantern, stopwatch, sandwich, paint roller); signs and banners ("GRAND OPENING TOMORROW", "P-618 BAKER-MILLER PINK"); effects (sparks, sweat drops, "Zzz", dust).

C. RULES
1. ACT INSIDE THE HOLD: the calm camera from part 9 stays, and the subject performs during it. Every shot of 2 s or more contains at least one whole-body action (reach, lift, lean, walk, throw, point, shrug, sit, stand, flinch) plus face changes. Nobody stands with arms hanging for more than 2 s unless the stillness is the joke (deadpan).
2. LIP-SYNC: a character speaking a quoted line uses at least 8 mouth shapes (closed, small open, wide open with teeth, open with tongue, round O, wide E, smile-talk, frown-talk), picked per syllable from the voice track, with the mouth 40-50% of the face width, a dark inside and teeth. The jaw and head bob 1-3 degrees on stressed words, brows rise on questions and emphasis, and the face's mood shows in the mouth (sneering talk, laughing talk). Mouths never hide behind a moustache; the moustache moves with the jaw. Narrator lines are not lip-synced.
3. LISTENERS: while one character talks, the listener does something with a prop (eats, writes, polishes, holds the brick) and reacts with a face on the line about them.
4. TITLE OBJECT: the object in the title is big (at least 40% of the frame) in the hook and at the reveal, and the process the story depends on happens physically on screen in 3-6 s (for Grape Bricks: the brick drops into the jug, dissolves into purple clouds, the jug bubbles and darkens while the calendar pages flip).
5. REAL OBJECTS, NOT STICKERS: show information with objects in the world (a newspaper headline, a poster on a wall, a crate stamp, a ledger, a sign) instead of floating icons and labels.
6. FOCUS: close and medium shots keep the subject sharp and blur the background clearly (background detail unreadable); a foreground object near the lens is blurred; wide shots may be deep focus. The focus and the frame centre sit on whoever or whatever the line is about; a story event is never smaller than about 25% of the frame height or hidden behind another character.
7. FRAMING: labels and signs fully inside the frame and readable for at least 1 s; check that no cropped word reads as another word. No character cut in half by the frame edge unless it is a deliberate foreground over-the-shoulder.
8. LIGHT: every scene has at least one light source you can see (sun through a window, a lamp, a lantern, string lights, the moon) and its glow on the characters; night and interiors use warm practical lights against cool shadows.
9. SMALL DETAILS: every main character has 2-3 costume details (patch, badge, pocket, buttons, tie, moustache, hat band) and a prop that fits their job; every set has 3-5 readable story props or signs and at least one small moving detail (steam, a fly, a swinging sign, a flickering lamp).
10. TRANSITIONS: no crossfade between different places with people in them (part 8 C2-C3 still applies); use the AE choices.
11. QA from the render: for each quoted line, a face strip every 2 frames (count the mouth shapes: 8 or more, and check they follow the syllables); for every shot of 2 s or more, the body action in it; the frames where the title object changes; one full-size frame per scene checked for background blur in close shots, cropped labels and half-cut characters; and the list of crossfades with the places on each side.

HANDS DO THE WORK, AND A FINAL CHECK AGAINST EVERY TARGET (part of v10; where this disagrees with anything above, this wins; reference image AI)
Measured frame by frame on "He Saved His Life by Proving His Masterpiece Was Fake" (optical flow on every frame, face crops every 1/15 s, full-size frames), compared with Rick's Roller Coaster (0-2.1 s and 15.6-18.4 s), Pink Prison (4.1-7.6 s) and the earlier boards and vidIQ breakdowns.

A. WHAT IMPROVED (keep all of it)
- The title object is big in the hook and at the reveal (the painting), and the story is told with real objects: the K-33 crate, the "SOLD BY / SOLD 1943" note, the "DUMBEST EXCUSE OF THE WAR" and "EVERY VIRTUE EXCEPT ORIGINALITY" headlines, the "137 PAINTINGS" cart, the "PLASTIC INVENTED 1907" book, the guard's coffee cup.
- Close-up lip-sync is now good: on "Relax, it's not old, I painted it" (12.9-14.5 s) the mouth uses 6-7 shapes about 40% of the face width with teeth and tongue, and the eyes and brows change with it.
- Shape-match dissolves: the painting into the museum painting (28.75 s) and into the court exhibit (49.75 s).
- Light you can see: desk lamps, window beams, the oven glow.
- Script: 12-word hook, "You see," at 3.25 s, the spoken question at 19-21 s, "That's the trick" at 64%, the cookie comparison, the headline callback ending; 64.0 s, -14.3 LUFS, 4 hard cuts; in-frame motion up from 1.9 to 3.35.

B. WHAT IS STILL WRONG
1. Objects do the work instead of hands (board AI). "He paints a lost old masterpiece" (26.8-28.7 s): the picture appears out of a puff of smoke while he stands still. "Mixes plastic into his paint, bakes the canvas, rolls it over a pipe, rubs ink in the cracks" (42.8-48 s): the painting flies into the oven, tips over the pipe and cracks by itself while he stands beside it with his arms down. Rick's hero raises the hammer, bends into the swing and grabs it off the stump; the scientist lifts the cup, and in the close insert the can is tipped and stirred as if held by a hand just out of frame.
2. Camera stops slipped back: median 1.65 s, 31% under 1.2 s (part 9 target: median 2 s or more, at most 10% under 1.2 s), moves peaking at 56 px per frame around 50.5 s and 55-59 s.
3. Glitch frames: an 8-frame white-out at 54.7-54.95 s followed by a giant face passing in front of the lens (55.1-55.2 s); an orange wash crossfading the courtroom into the studio with people in both (41.0-41.3 s); ghost crossfades at 11.0-11.5, 21.5-21.75 and 60.5-60.75 s.
4. No background blur in medium close-ups: at 13.3 s the judge's face and the lamp behind the hero are as sharp as the hero (part 10 C6).
5. People-subject wide shots are tiny: the museum at 32.5-34.5 s (characters about 10% of the frame height), the laughing guards at 15.5-17.5 s, the celebration at 55.25-57 s. Tiny figures are right only when the subject is a big object (Rick's loop being hammered wide at night).
6. Medium-shot mouths are still small (the courtroom line "Fine, give me paint, a canvas and an oven" at 38-41 s: about 25% of the face width).
7. Bodies still hold arms-down poses through whole holds (11.25-15 s, 25-28 s, 42.8-48 s).
8. Captions use red and orange keyword highlights; Rick's captions are plain white with a black outline.
9. Story objects look like cartoons of cartoons: the "300-year-old masterpiece" should read as an old oil painting (brush texture, dark varnish, gold frame wear, fine cracks after baking).
10. No exaggeration joke in the script (part 6 A7 asks for 1-2).

C. RULES
1. HANDS DO THE WORK: every process verb in the script (paint, mix, pour, lift, carry, slide into the oven, roll, rub, stamp, sign, hammer) is done on screen by the character's hands and body, with the wind-up, the action and the settle; or in a close insert where the object moves as if held and a hand or sleeve enters the frame. Objects never move by themselves while the person who should move them stands idle. Painting means a brush on the canvas, with strokes appearing under it.
2. NO GLITCH TRANSITIONS: no white-outs, colour washes or flashes as transitions; no crossfade between places with people in them; nothing passes between the camera and the subject.
3. PEOPLE AT A READABLE SIZE: when the line is about people, they fill at least 25-30% of the frame height; extreme wide shots are only for showing a big object, a crowd as a mass, or a place for 2 s or less.
4. MEDIUM-SHOT MOUTHS: in medium shots the speaking mouth is still at least 35-40% of the face width, and the camera favours a medium close-up for quoted lines.
5. WHITE CAPTIONS: plain white captions with a black outline, no coloured keywords.
6. STORY OBJECTS LOOK REAL: the object the story is about gets real-world texture and wear (an old painting has brush texture, dark varnish and cracks; a document has creases, stamps and handwriting).
7. FINAL CHECK AGAINST EVERY TARGET (this is where earlier fixes keep slipping): before delivering, measure the render and print this table with PASS or FAIL for each line, and fix every FAIL first:
   - hook 9-16 words, ends by 3.5 s; "You see," starts by 6 s
   - length 62-65 s (or 44-50 s for a one-trick story); -14.3 LUFS
   - 9-13 scenes; a scene of 9 s or more in the first 20 s; no character vanishes on a scene change
   - move peaks under about 22 px per frame; camera roll 5 degrees or less (camera-stop and relocation targets deleted in part 14 B)
   - hard cuts at most 4; crossfades only for a time jump in the same place; no white-outs or washes; nothing crosses the lens
   - every quoted line: 8 or more mouth shapes, mouth 35-50% of the face
   - every shot of 2 s or more: a body action; every process verb done by hands
   - title object big in the hook and reveal, and its change shown on screen
   - close and medium shots: background clearly blurred
   - people-subject shots: characters at least 25% of frame height; no half-cut characters; no cropped labels
   - a visible light source in every scene; plain white captions

WHAT RICK'S TOP SHORTS DO, WITH CORRECTIONS (part of v10; where this disagrees with anything above, including part 11's table, this wins)
Sources: vidIQ craft audits of seven of Rick's top Shorts (The Ancient Jar That Warned an Empire 32.5M, Why Perfect Railroads Don't Work 26.0M, The Job Nobody Wants in Japan 17.0M, Why Sailors Carried Storm Oil 14.9M, The Window That Breaks Japan's Gambling Law 14.6M, The Pink Prison Cell Experiment 6.3M, This Shape Saved Roller Coasters 4.1M), a frame check of Railroads captions, the 0.1 s colour-change scan of Railroads, and vidIQ's channel comparison of Loophole Lou and Ricks Clips.

A. CORRECTIONS TO EARLIER PARTS
1. SHOT CHANGES: Rick changes shot about 18-28 times in 60-65 s (average shot 2.3-3.5 s; vidIQ counted 24 in Railroads, 21 in Japan Job, 18 in Storm Oil, 12 in the 46 s Gambling Window). In the 0.1 s scan most of these changes take 0.2-0.4 s (a fast push or whip with motion blur, or a very short dissolve), and some are straight cuts on a beat. This replaces "at most 4 hard cuts" and "at most 2 whip transitions". What stays: every shot holds at least 2 s, so the change count follows from the holds; no crossfade that ghosts people between different places; no white-outs or colour washes; nothing passes in front of the lens.
2. MOUTHS: Rick's lip-sync is simple. On quoted lines the mouth always moves, with about 3-5 shapes (closed or grin, half open, wide open with teeth, round O); open shapes are about 30-45% of the face width. Narration is never lip-synced; faces react instead. This replaces "8 or more shapes, 40-50%". Masterpiece's close-up (6-7 shapes, about 40%) already meets it; medium-shot mouths must still open to at least 30%.
3. FOCUS: shallow depth of field is used on close-ups and object inserts (the red "FIRE EMPLOYEE" button, the phone screen, the "LABOR LAW" padlock, the caliper and coin, the wine cup), and as a soft foreground frame. Medium and wide shots are mostly deep focus (Storm Oil is almost all deep focus). This replaces "close and medium shots blur the background".
4. WHO MOVES THINGS: verbs a person does are done by hands and bodies (saw, pour, grab, point, turn the wheel, blow on the soup, slide the tokens, flick the switches, bake, roll, rub). Verbs of a physical process (shrink, expand, buckle, crack, rise, ripple) are done by the object itself, with a visible cause (heat glow on the rail, a thermometer, a flipping calendar).

B. MORE THINGS THE TOP SHORTS ALL DO
5. TEXT: captions are plain white, bold rounded sans-serif with a thick black outline, 1-3 words at a time, lower third, no coloured keywords (checked on Railroads frames and confirmed in all seven audits). Every other piece of text is painted on an object in the world: signs ("FIRST LINE IN GETS IT ALL!"), newspapers ("THE CLICKETY CLACK LINE!"), labels, calendars, clipboards ("PATROL LOG / GAMBLING: NONE"), phone screens ("+$6,850 Deposited", "Inbox (0)"). A floating graphic is used at most once, for the mechanism (Storm Oil's white flow lines over the wave).
6. THE MECHANISM AS A LABELLED OBJECT: the hidden rule becomes a physical thing with a label: a fire alarm locked with a padlock engraved "LABOR LAW"; a breaker panel whose switches read "HOPE", "WORK", "FRIENDS", flicked off one by one; a caliper on the rail gap with a coin in May and only a sheet of paper in July. Use one such object per video.
7. DEMO AND PAYOFF HOLD: the everyday comparison is its own short scene, acted out (the cook blows on a bowl of soup and the oily spots stay smooth, about 9 s), then back to the story. The payoff is held: Railroads holds each heat stage 2-4 s; Storm Oil's wave payoff runs about 11 s; the Gambling Window token-for-cash swap is one 4 s shot.
8. "YOU" SCENES: when the narration says "you", the viewer is a specific avatar the camera follows (an orange hoodie with a camera round the neck; a light-blue shirt with a lanyard).
9. BACKGROUND AND MICRO-DETAILS: background characters do small story actions (coworkers stop typing and turn their heads together; patrons stay glued to their machines; a man balances a tower of ball trays; veteran engineers eat lunch on a girder). Every scene has small environmental details: dust motes in light beams, puddle reflections of neon, a cat by a bicycle, cables and AC units, a lucky-cat figurine and desk lamp in a booth window.
10. LIGHT TELLS THE STORY: warm interiors against cool exteriors, a visible practical light in every interior or night scene, and a light change at the turn (Storm Oil goes from sunny to storm-blue, to a warm galley for the explanation, then back to the storm).

C. TOPIC, TITLE AND SCRIPT (from vidIQ's channel comparison)
11. MECHANISM OVER ANECDOTE: Rick's biggest Shorts reveal a reusable rule (a seismometer, thermal expansion, a labour-law loophole, oil on waves, the three-shop gambling loophole). Pick stories whose reveal explains a rule anyone can reuse ("why X always does Y"). If the story is a one-off anecdote, the reveal must explain the rule underneath it.
12. TOPIC LANES: incentives that backfire; everyday physics that looks stupid until heat, speed or pressure arrives; body versus brain shortcuts; money and law loopholes with a visual demo.
13. TITLES: name the familiar object and imply the hidden rule ("Why Perfect Railroads Don't Work", "Why Sailors Carried Storm Oil", "The Window That Breaks Japan's Gambling Law"). The object is always named and instantly visual. Keep the title short.
14. SCRIPT: a present-tense cold open; one second-person bridge ("Imagine you're...", "Ever...?"); the early "You see," from part 6 stays the default; end on irony, never a moral.
15. Not adopted from vidIQ: "slow down 5% before 'You see'". Rick's measured delivery has no pauses.

D. UPDATED FINAL CHECK (replaces the matching lines of part 11's table)
- shot changes 18-28 per 60-65 s, every shot at least 2 s; transitions of 6-12 frames or cuts on a beat; no ghosting crossfades between places with people, no white-outs or washes, nothing crosses the lens
- quoted lines: the mouth moves on every syllable, 3-5 shapes, open shapes 30-45% of the face width
- close-ups and inserts have a blurred background; medium and wide shots may be deep focus
- person verbs done by hands; process verbs done by the object with a visible cause
- captions white with a black outline, 1-3 words, no coloured keywords; all other text painted on objects; at most one floating mechanism graphic
- one labelled mechanism object; the demo scene acted out; the payoff held 4 s or more

SHOW THE BIG MOMENTS, MOVE THE CAMERA, AND WHAT RICK'S NUMBERS SAY (part of v10; where this disagrees with anything above, this wins; reference image AJ)
Measured frame by frame on "He Made Cars Easier to Crush and It Saved Lives" (optical flow on every frame, strips every 1/7.5 s at the crashes, face crops every 1/15 s) and compared with Rick's Railroads climax (58.4-64.7 s) and the vidIQ research on Ricks Clips (channel growth, top-3 transcripts, top comments).

A. WHAT IMPROVED (keep all of it)
- A mechanism topic (crumple zones) with a 11-word hook, "You see," at 3.75 s, plain white captions, and story text painted on objects ("BUILT LIKE A TANK!", "PAPER CAR", "CRASH TEST No. 1 1959", the "STOPPING TIME" dial as the labelled mechanism object).
- The water-balloon demo acted out as its own 8 s scene in second person ("Stiff hands... your hands back").
- The paper car crumpling on screen (27-29.5 s), the mocking nickname, and a quotable ending exchange ("They don't make them like they used to." "Exactly.").
- Camera stops: median 2.5 s, only 8% under 1.2 s; 63.3 s; -14.3 LUFS; no white-outs or ghost crossfades.

B. WHAT IS WRONG
1. The big moments happen off screen. "Crash one into a wall, and the car's fine" (8.9-10.6 s): the car rolls in and stops, with no impact. "They crash the tank car. Not a scratch on it. The dummy flies into the wheel so hard its head pops off" (51-56.5 s): the car is already stopped, and the dummy and the head are never shown. Rick's climax (Railroads 58.4-64.7 s) shows the rail bending into an S, the train leaving the track, falling and exploding, for about 6 s with the camera moving the whole time.
2. The camera is locked off. There are 18 hard cuts, and the camera travels sideways in only 4% of frames (zoom-only in the rest), so the video plays like a slideshow. The Eiffel Tower video travelled in 74% of frames; Rick glides, cranes, flies and tracks in most shots. Part 12's correction allowed cuts; it did not mean "only cuts".
3. Hands still do not do the work. "So this guy draws the opposite" (13-16 s): the lines appear while his pencil hand stays by his face. "Then somebody opens the door" (31.5-33 s): the door never opens.
4. The hook shows no absurd act: the engineer stands beside a car for 3.5 s. Rick's roller-coaster hook shows him bending the loop.
5. The boss's mouth is hidden by his moustache for most of "You want our cars to fold?" (16.8-18.8 s).
6. Wrong focus: at 56.75-57.5 s the old man in the foreground (who delivers the final line) is blurred while the background is sharp.
7. No scene of 9 s or more in the first 20 s (the longest is 6.25 s).

C. RULES
1. SHOW EVERY BIG MOMENT: every impact, failure, transformation or payoff the narration names is shown happening on screen with cause and effect (the car hits the wall: a jolt, dust, crumpling metal, a camera shake, the occupant thrown forward; the dummy flies into the wheel and its head pops off). The climax and the payoff each get 4-8 s with the camera moving.
2. MOVE THE CAMERA: at least half the shots contain a real camera move (glide, track, crane, orbit, aerial, push past a foreground object), not only a zoom (the 40% travel target is deleted in part 14 B). At least a third of the place changes are motivated moves (ride a motion, through a window or object, shape match) instead of cuts. Cuts are for beats, punchlines and reaction close-ups.
3. HOOK FRAME: frame 1 shows the absurd act being done (the engineer stomps on the car's nose and it folds; he hands a crumpled car to a horrified boss).
4. HANDS, MOUTHS AND FOCUS (repeat offenders): the pencil hand moves along every line it draws, and a hand pulls every door open. Moustaches move with the jaw and never hide a speaking mouth. Focus is on whoever speaks or whatever the line is about.
5. FROM RICK'S NUMBERS AND COMMENTS (vidIQ, 7 Nov 2026):
   a. Write the last line to be quoted and argued with. Japan Job's last line, "because nobody can do nothing forever", produced its top comment ("challenge accepted", 73,847 likes) and 15 times the Jar's comment rate. This video's "Exactly." ending is the right idea.
   b. For everyday topics, put the viewer in the story ("Imagine you're..."), as this video's balloon demo does.
   c. Keep the real mechanism accurate, and treat dramatised details as dramatised. Rick's biggest video drew a 16.8k-like correction and many "AI slop / wrong history" comments.
   d. Shape the music as part 14 G says: steady under the setup, dips under quoted lines and the fake-out, builds at the turn and the climax, one deep boom on the payoff. YouTube's auto-captions tag "[music]" 2-3 times in Rick's videos, mostly in the second half.
6. FINAL CHECK additions: list every impact or payoff verb in the script and the frames where it happens on screen; print the share of shots with a real camera move; list place changes as cut or motivated move.


THE LOOK, KEEPING PEOPLE ON SCREEN, AND THE RULES TO DELETE (part of v10; where this disagrees with anything above, this wins; reference images AK, AL, AM)
Measured on "They Blew Up Houses to Stop a Fire" (every frame, a 2-s colour strip, face crops every 1/15 s) and compared with four of Rick's Shorts measured the same way in the browser (Drivers Filming the Road, his newest at 1.7M views in its first 12 hours; Ancient Jar; Storm Oil; Railroads), plus vidIQ walkthroughs of Drivers, Storm Oil and Grave Bell.

A. WHAT WORKED (keep all of it)
13-word paradox hook in 3.1 s with the act already happening at frame 1; "You see," at 3.2 s; 64.0 s; 3.80 words/s; -14.3 LUFS; captions; painted signs (POWDER, PITCH & TAR, CLOTH, PIES, FIRE'S MENU). A mocking quote, a nickname, a fake-out and a doubter line ("See, pointless."). The one-bucket callback (set up at 8.6 s, paid off at 56.5 s). Big moments shown on screen: soldiers roll the barrels, hooks pull a house down, the Captain lights the fuse with his hand, the explosions fill the frame. Mouths pass: the Captain's "no house, no fire" has 5 shapes in 1.2 s, on the right syllables.

B. CORRECTION: THE CAMERA IS NO LONGER A GAP
Measured the same way, the share of time the camera moves fast (over 4 px per frame) is 27-57% in Rick's videos (Drivers 27, Jar 40, Storm Oil 45, Railroads 57) and 47% in ours. Whip-speed moves: Rick 11-37%, ours 31%. Delete the "camera stops 2.3-3.5 s" target from part 9 and the "travel in 40% of frames" target from part 13. Keep only: moves are smooth and follow a character or the action, and no camera roll beyond 5 degrees (11-15.6 s here spins over the roofs with the horizon tilted about 30 degrees).

C. WHAT IS WRONG (biggest first)
1. One purple-pink grade on every scene (board AK). 39% of the video's samples have a purple-magenta average colour (the Bridge video: 41%), against 11-30% for Rick, whose purple is mostly a sunset sky. "By morning" (11.6 s) is still purple. Rick's colour changes in clear blocks: warm setup, deep blue night or storm, bright payoff.
2. The world looks flat. Our sets are plain colour boxes with ink outlines on every edge. Rick's newest sets are realistic, lit 3D: textured materials, glossy cars, grass blades, cloud skies, sun rays, and lamps, braziers and headlights that light the ground and the people.
3. Fire and smoke. Fire is rows of identical flat flame cards that light nothing. Cream cloud banks cover the whole frame at 1.4-3.0 s (hiding the hook's explosion and the hero), 29.4-31.2 s and 51-52.8 s.
4. No people in story beats (board AM). About 20 of 64 s has no character on screen: the setup street (3.2-6.8 s), roof to roof (11-15.6 s), the cathedral (17.2-18.8 s) and the whole climax (48.6-56.0 s, 7.4 s). vidIQ: Drivers has no shot without a character; Storm Oil has two inserts totalling 2.5 s; in Ancient Jar the object-only time is the mechanism cutaway.
5. The domino comparison (35-42 s) cuts to a modern kid in a hoodie on a lawn, outside the 1666 story. The dominoes are a thin row right under the caption, they fall from a sparkle, and the three "pulled out" are just in his hand. The FIRE'S MENU line and the SOLD OUT stamp (42.2-46.6 s) also appear by themselves.
6. Two endings. After the bucket callback (56.5 s), 6.5 s of a new modern scene with two new characters in a muddy olive grade; the crew member is small, about a fifth of the frame height.
7. Characters (board AL). The Captain's legs are thick cream tubes (0.5 s, 48 s, 46 s) while everyone else has thin dark legs. Groups stand in a flat row facing the camera with their arms down (23-24.4 s, 26.6-28.4 s), and the Captain is not in the shot while they name him. The beret hangs frozen above the man's head at 20.0-20.2 s, the same bug as the first thumbnail.

D. RULES TO DELETE (they caused C1-C3)
- Part "Pipeline and measured look" D: "shadows light and blue-violet", "Golden hour ... violet shadows". Tutorial lesson 5: "At sunset the shadows are purple". Shadows are neutral grey-blue by day and deep blue at night.
- Pipeline C and tutorial lesson 5: ink lines on the 3D world. Characters keep their outline; the world gets no outline pass.
- Pipeline I: "Effects are flat 2D cartoon sprites". Fire, smoke and splashes are animated, lit effects (rule E3).
- Tutorial lesson 4 and the Boston fix 7 (night-blue look when the explanation begins) become "only if the story's time of day changes there".

E. RULES
1. TIME OF DAY PER SCENE: choose a real time of day and light it that way. Day: blue sky with clouds, white sun, soft shadows. Golden hour: orange sun, long shadows, the only purple is in the sky. Night: deep blue with warm pools of lamp and fire light. Neighbouring scenes contrast. Print a 2-s colour strip of the render next to board AK's Rick strips; no more than 20% of it may be purple or pink.
2. A REAL 3D WORLD (three.js): MeshStandardMaterial everywhere, with generated canvas textures and roughness variation (wood grain, brick, plaster, cobbles, thatch, roof tiles). A sky dome with clouds. A sun as a DirectionalLight with PCF soft shadows, plus a hemisphere light. ACES filmic tone mapping. Bloom (UnrealBloomPass) on lamps, windows, fire and sparks. Fog in the horizon colour. Turn off the ink pass on the world. Check stills against boards AK and S before animating.
3. FIRE IS A LIGHT: animated flames (8-12 fps flicker) in varied sizes, coming out of windows and roofs. Each fire has a warm flickering PointLight that lights walls, ground and faces, plus embers and a dark grey smoke column rising above it. Smoke never covers more than half the frame or any face for more than 0.5 s. Explosion smoke is grey-brown, with debris, and the hero stays visible in a corner.
4. PEOPLE IN EVERY STORY BEAT: setup, mockery, fake-out, climax and payoff each have a character in frame, reacting. Object-only shots are inserts of at most 2 s, or the mechanism explanation. The climax shows the Captain, the doubter and the crowd reacting to the explosions.
5. EXPLAIN IN THE STORY WORLD: the everyday comparison is acted by the story's characters in the story's world (the Captain stands dominoes up on a tavern table and pulls three out with his fingers; better still, the houses fall like dominoes and stop at the blown gap). The demo object sits at 25-55% of the frame height, never under the caption. A hand makes every change (chalk line, stamp, domino).
6. ONE ENDING: end on the callback or the payoff. A modern tie-in, if any, is one sentence said over the story's own characters before the callback, never a new place with new people.
7. CHARACTERS: every character, hero included, has thin black stick arms and legs (about 0.055 of the head width). Never 3 or more characters side by side at one depth facing the camera: stagger them front, middle and back, turn them three-quarter toward each other, and give each a verb (point, pull a sleeve, shake a fist, whisper). When a line names someone, that person is in the shot. Hats stay on: a shock "hat pop" arcs up and lands back within 0.5 s.
8. SOUND (from vidIQ, check by ear): Rick's videos carry 12-17 sound effects, each on an on-screen action (pour, grab, creak, clank, cash flutter, crash, splash, bell), under continuous upbeat music that dips under the lines and swells at the payoff. Print a sound cue sheet: action, time, sound.

F. FINAL CHECK (add to the table; print each line with PASS or FAIL)
- Colour strip next to Rick's; purple or pink share 20% or less; a different time of day or light in at least 4 scenes.
- Still frames of every set next to board AK: textured materials, sky, sun shadows, bloom on lights; no ink outlines on the world.
- Every fire lights its surroundings; no smoke covering more than half the frame or a face for over 0.5 s.
- List every stretch without a character: none in a story beat, inserts 2 s or less.
- The comparison demo uses the story's characters, sits above the caption, and is done by a hand.
- One ending; the last shot has a story character.
- Every character has thin black limbs; no row of 3+ facing the camera; no floating hats; camera roll 5 degrees or less.
- The sound cue sheet.

G. MUSIC FOR EVERY VIDEO (added by the user on 2026-11-08 as part of v10.14; wins over earlier music rules)
1. One instrumental track for the whole video, no vocals, no popular songs: royalty-free or generated only.
2. Match it to the story's mood: tense cinematic plucked strings with ticking for mysteries and disasters (like the fire video), quirky plucked strings or acoustic guitar for comedy, banjo or acoustic guitar for old-timey stories. Medium tempo, about 115-125 BPM.
3. Shape it to the story: steady under the setup; dip under every quoted line and at the fake-out; build at the turn and the climax; one deep boom on the payoff; cut cleanly on the last spoken word. No fade-out.
4. Keep the music clearly audible but under the voice: about 15 dB below the voice instead of 19, still ducked under quoted lines, and listen to check.
5. Put a sound effect on every on-screen action (about 12-18 per video: clinks, creaks, crowd laughs, crackling fire, rumbles), and one big impact on the payoff. Keep the old rule: soft whooshes, few ringing sounds.
6. Print a music and sound cue sheet: time, what happens on screen, what the music does, which sound effect plays.