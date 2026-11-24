# Final checks: "The Thieves Who Stole 200 Shoes Nobody Can Wear"

**Still failing / outside Rick's range after 2 re-measures:** the camera is busier than Rick's (fast moves, shot changes, calm stretches), the kit counts 5.7 hard cuts a minute (4 planned cuts, plus a hidden wipe at 24.7 s and a foreground reveal at 57.5 s it reads as cuts), background animation 3.0 (Rick 4-5.5), and one expression swap at 23.3 s hidden inside a whip pan. Details below; none is a broken frame.

## Decisions I made
1. **Render speed.** The full-quality render was heading for about 16 hours. The 3D canvas was redrawing the whole scene about 10 times per video frame while each frame was captured; it now draws once per frame. Same picture, about 6 s per frame, so the whole video rendered at full quality (dpr 1.0, MSAA 4, 4096 shadow map, depth of field, bloom).
2. **A lighting bug found in the render:** after every dissolve, the next shot could light with a blank environment map (shot 10 came out at half brightness until 58.7 s). The environment cache is now per canvas, and the 7 affected chunks were re-rendered.
3. **Staging fixes before the render:** crate sitters moved to the crates' front edge (they looked like they stood inside the crates), the covered car moved out of the neighbour's path, the box shot raised over the crew's heads and centred on the boss, the pull-back from the pile lifted over the chair, a rounded glove with a fine weave.
4. **After the first measure:** the opening now trucks left while it pushes in (camera speed in the first 3 s: 2.97 -> 4.08, OK), the three fastest glides were lengthened (111 -> 52 px/frame at the worst), the boss stands up over 6 frames instead of popping, and the owner side-steps along the wall instead of jumping 0.39 m.
5. **Light pass** on the joined video (curves lift + saturation 1.5): brightness 95 -> 113, saturation 0.36 -> 0.44, both now in Rick's range.
6. The mp3 is the finished voice (take B, pauses tightened); the mp4 has exactly the same name.

## PASS/FAIL
| Check | Result | Number |
|---|---|---|
| Format | PASS | 1080x1920, 30 fps, 63.2 s, h264 + AAC 48 kHz |
| Loudness | PASS | -14.3 LUFS integrated, peak -1.3 dBFS, LRA 1.8 |
| Sharp picture (no blur) | PASS | dpr 1.0 at full size; background detail 15.4 (Rick 14.2-19.8) |
| Brightness / saturation | PASS | 112.7 (106.5-132.2) / 0.441 (0.44-0.50) |
| Black, white, frozen frames | PASS | none; frame means 48-186 |
| Pops | PASS | all 11 are planned: 4 cuts, clank sparks and punch-ins (302-377), the box-face wipe (740), the tower passing the lens (760), the chair reveal (1725) |
| Motion audit (idle picture) | PASS | 7% of frames with a quarter of the picture idle (aim under 20%) |
| Face QA | FAIL (1) | 0 brow jumps; 2 mood flips at frame 700, both inside the whip pan from the shop to the street (the thieves change place during the whip) |
| Captions | PASS | 2.64 changes/s (2.55-2.79) |
| Voice | PASS | 4.74 syllables/s (4.6-4.89), 13.4 words per sentence |
| Camera speed in first 3 s | PASS | 4.08 px/frame (3.68-7.83) |
| Hard cuts | FAIL | kit 5.69/min; real cuts: 4 planned + the hidden box-face wipe at 740 (5 vs the limit of 4) |
| Camera pacing | FAIL | fast moves p90 29.9 (<=25.4), shot changes 7.4 per 10 s (<=6.1), calm stretches p90 3.0 s (>=3.5), moves 7.6 per 10 s (<=7.5) |
| Camera roll | PASS (kit artefact) | kit 1.14 deg p95; the camera never rolls (up fixed at 0,1,0), the kit reads roll in fast glides, same as the car-ban video |
| Animation outside camera moves | FAIL | 3.0 (Rick 4-5.5; the car-ban video read 2.0) |
| Calm stretches of 3 s+ | PASS | 6 (4-7) |
| Blurry frames | PASS | 8.2% under detail 6.5 (Rick median 2.6%, max 10.7%): the glove insert and the dissolves |
