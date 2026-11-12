# Checkpoint 5: pre-render checks

**Video:** "He Covered His Oranges in Ice to Stop Them Freezing"

## Framing: projector check (tools/frame.py, design_cams.py, search2.py)

**Method:** every camera key was solved against the v13 rig's head centre: 1.30 m for adults, 0.85 m sitting, 0.99 m for the kid and 1.38 m for the scarecrow.

**Creep:** creep push-ins add up over long moves. Keys inside long spline shots (scenes 1 and 10) are pre-compensated with COMP() so each key frame shows its designed framing.

**Faces:** speaking and reacting faces sit at 35-45% from the top, above the caption band at 62-78%.

| Shot | Key | Speaking or acting face (x %, y %) | Other faces |
|---|---|---|---|
| 1 | A0 | Earl (68, 40) | - |
| 2 | B2 | Duane (56, 40) | - |
| 3 | C3 | Earl (54, 40), whole body, wheel at (30, 49) | - |
| 4 | D4 | Duane (34, 40) | Earl (70, 39) |
| 5 | E5 | Earl (55, 40) | - |
| 7 | S2B | Earl (26, 38) | farmhands at 49, 63 and 89 |
| 9 | S3B | the kid (46, 46) | 20, 61 and 70 |
| 10 | A | Earl (70, 43) | after the step, Earl at (24-30, 40) |
| 11 | B | Duane (50, 40) | - |
| 12 | DOOR5 | scarecrow (34, 46) | June (71, 42) |
| 14 | B | Duane (56, 40) | - |
| 15 | A | Earl (52, 40) | - |
| 18 | B | June (60, 34) | tub at (39, 90), jar shelf behind her |
| 19 | C2 | Earl (50, 40) | - |
| 20 | A | Duane (50, 40) | - |
| 21 | B | Earl (27, 41) | Duane (69, 41) |
| 22 | C2/C3 | Earl (30, 40) | Duane (78-81, 39) |

## Interpenetration (solids vs marks, computed)

**Why not qa_run.mjs:** the full raycast pass ran at about 7 s per frame on this machine. That is roughly 4 hours, because the grove has thousands of meshes. It was stopped, and the same rules were checked against the set's solids in Python for every mark and walk.

**Rule:** at least 0.2 m from any solid at shin, waist and chest height, and characters at least 0.45 m apart.

**Hits found and fixed:**
1. Duane stood 0.13 m from the bet crate. The crate moved to z 0.05, giving 0.28 m.
2. The scarecrow's legs went through the porch steps. He now stands on the top tread, 0.22 m from the wall.
3. The bough landed on Earl's old mark. He steps back before impact: 0.75 m at frame 806 and 1.09 m once settled.
4. The tossed crate lands 0.26 m from Earl's feet.

**Clearances confirmed:**
- Earl at the valve: 0.37 m from the riser.
- Farmhands: 0.33 m or more from the rails, and 1.05 m or more from each other.
- Townsfolk: 0.75 m or more from the front fence, 0.89 m from the gate panel, and 0.71 m or more from each other.
- June: 0.3 m from the tub rim and the door jamb.
- June inside the door: 0.66 m from the swing of the open door.

## Camera paths (camera-to-solid distance along every move)

| Move | Clearance |
|---|---|
| Scene 1 glide to the iced orange | passes Earl's right shoulder; he leaves the frame edge |
| Scene 3 whip from the hero tree to the gate | the path clears the gate tree's crown by 2.33 m against a crown radius of about 1.9 m |
| Scene 5 swing (lift 3.4 m) | over the crowns |
| Scene 7 swing (lift 0.6 m) | - |
| Door camera | 2.7 m from the gate tree's trunk |
| Crown glide | 3.6 m and more from the hero tree's trunk |

## Continuity

- Duane walks from his pots to the fence while the camera is on Earl (244-280). He is never seen popping between marks.
- June enters the doorway on the door-open frame (899).
- The kid's sign rises on "calls him" (700-716).
- The bet crate is on the ground by Duane from frame 0 to 1800 (it no longer pops in at 276). Duane heaves it over the fence at 1800-1830.

## Face strips, body actions and title-object strip

Every still costs about 65 s in software rendering, and the full render runs about 5-13 s per frame. So these strips are cut from the final render at full resolution instead of a separate preview pass. They go in checkpoint 6:

- the three quoted lines, every 2 frames;
- the title-object frames: 0-96, 454-501, 622-690, 1257-1433 and 1566-1686;
- the body-action table.
