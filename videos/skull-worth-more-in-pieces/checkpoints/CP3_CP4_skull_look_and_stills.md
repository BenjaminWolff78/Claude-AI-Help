# CP3 + CP4: "The Skull That Was Worth More in Pieces" (look lock and still gate)

## CP3 style lock (1 round)
The characters use the same locked card system as the last video (fig.ts: white heads, thin black limbs, 3/4 billboard cards, the AN face set). New this time are only costumes: Agus (caping hat, blue batik shirt, green sarong), Joko (peci cap, striped shirt, moustache), Ralph (pith helmet, glasses, khaki coat, red scarf), Sri (bun, teal kebaya), three kids, four farmers, four villagers and an elder. They were checked side by side against boards AX1/AX2 on this machine only. The boards were not uploaded or sent anywhere.

What changed in the look after the lock:
- **Sharpness (your note).**
  - Depth-of-field blur is cut to about half: inserts 7, close-ups 5, mediums 2.5, full shots 1.5, wides 0. The blur cap is 12 px instead of 24.
  - The final render draws the full 1080x1920 buffer (dpr 1.0, cards at 1.0) instead of upscaling 810x1440.
- **Colour.** The Java light presets were pushing everything orange. The light tint is now near neutral (lit about 1.28/1.1/0.88 instead of 1.32/0.9/0.52), with paler sun colours, greyer ground bounce, grey-brown yard clay and a calmer back wall.

## CP4 still gate (40 stills, then fixes)
| Found on the stills | Fix |
|---|---|
| Heads at 60-70% of the frame width (the camera far too close) | Every framing is now solved by fitH() at Rick's sizes from board AP: close-ups 0.38-0.42, two-shots 0.26-0.30, mediums 0.20-0.24, groups 0.17-0.18 |
| The hook's skull was hidden behind Agus | Agus stands at the table's left end and the skull sits clear to his right. The camera is frontal, and the hammer is already up on frame 0 |
| Pendopo posts filled half the frame on two shots | The inner posts moved out to x ±2.6, and the centre posts moved back. Every station camera was checked for post occlusion (tools/pj.py) |
| A foreground farmer covered Ralph and his sign | The queue now runs out into the yard, Agus strolls off before "You see," and the angle is post-free |
| At night the back of the sign blacked out 1 s of frames | Joko's line is now a front two-shot. No camera looks through the sign |
| The lamp covered Ralph's head | Ralph stands left of the lamp |
| The shed roof was see-through from inside, and the tally number was hidden by a villager | A ceiling went under the thatch. The villager moved to the right of the board |
| The papaya read as a brown blob | It was rebuilt as 12 ring slices (orange flesh, yellow-green rim, black seeds) that sit flat and fan apart |
| The sign repaint never showed | The live (re-lit) material is now updated |
| Dust clouds from the kids' taps covered the mat | The dust is smaller, and there is none on the small taps |
| The "12 PIECES = $1.20" card named a currency | Now "12 PIECES = 120¢" |
| Faceted gem-like pebbles | Smooth, flattened stones |
