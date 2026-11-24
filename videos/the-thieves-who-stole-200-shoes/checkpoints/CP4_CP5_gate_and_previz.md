# CP4 + CP5b: still gate and previz checks ("The Thieves Who Stole 200 Shoes Nobody Can Wear")

Sheet: `CP4_still_gate_sheet.jpg` (one key frame per shot beat, 21 frames; the 6 marked "fixed" were re-rendered after the fixes below).

## CP4 still gate (12 checks x 11 shots)
| Check | 1 hook | 2 street | 3 sweep | 4 garage | 5 owner | 6 garage | 7 cutaway | 8 glove | 9 restock | 10 garage | 11 wave |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 size / faces / framing | PASS | PASS | PASS | PASS (fixed) | PASS | PASS (fixed) | PASS | PASS (object) | PASS | PASS | PASS |
| 2 nothing crossing the lens | PASS | PASS | PASS | PASS | PASS | PASS (fixed: car moved, crew out of frame edge) | PASS | PASS | PASS | PASS (fixed: pull-back flew through the chair) | PASS |
| 3 actor sharp, no blurred face | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 4 a character in every reaction beat | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS (named object: the glove comparison) | PASS | PASS | PASS |
| 5 picture sentence readable | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 6 planned view, facing the task | PASS | PASS | PASS | PASS | PASS | PASS | PASS (back view) | n/a | PASS (back view) | PASS | PASS |
| 7 world (light, shadow, texture, ground) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 8 props held/resting, no flat stand-ins | PASS | PASS (cutters) | PASS | PASS | PASS | PASS | PASS | PASS (fixed: rounded glove) | PASS | PASS | PASS |
| 9 faces match the plan | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | PASS | PASS |
| 10 character design | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | PASS | PASS |
| 11 caption band clear, signs whole | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 12 camera height, level horizon | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## Fixes made from the gate and the previz (all before the final render)
1. **Crate sitters looked like they stood inside the crates** (toast 1044-1200, boss counting 806-848, boss cramming shoes 1682-1787): the cards sat at the crate's centre, so the crate hid their hips and the legs showed through the mesh. They now sit on the front edge (card 0.32 m toward the camera) with the legs hanging in front.
2. **The neighbour's sneak-in (1140-1200) was hidden behind the covered car**, and his path from the side door walked through it: the car moved to the back-right corner, where it is now background.
3. **The box shot (1240-1336)**: the camera stood between the seated crew, so the skinny thief's head filled the left edge and the kneeling boss was cut at the right. It is now high over the crew's heads, centred on the boss pulling shoes out, with the boxes and the growing pile.
4. **The big thief's walk to dump box 3** went through the old camera spot; he now steps around the chair.
5. **The pull-back from the pile at 1720-1744 flew through the monobloc chair**: the camera now rises first (clears the chair and crates).
6. **The glove insert (1490-1575)** read as a chocolate bar (pointed polygon + a large grid texture): rounded fingers and thumb, a fine fabric weave, tan work-glove colour.

## CP5b previz (whole video at 270x480, frameloop fixed)
Scene-graph sweep over all 1897 frames (generic checker, `qa/sg_generic.py`):
| Hit type | Before fixes | Where | After |
|---|---|---|---|
| subject occluded | 1112-1165 (covered car) | shot 6 follow | fixed (car moved) |
| subject out of frame | 1214-1344 (boss in the box shot) | shot 6 | fixed (new camera) |
| centre ray < 0.45 m | 1727 (chair at 0.07 m) | shot 10 pull-back | fixed (camera rises first) |
| sliced head | 1223-1328 (baker/skinny at the edge) | shot 6 | fixed; the remaining runs are the planned close-ups (padlock 300-420, tower ride 725-790) where the shot's subject is the object, not the face |
| near mesh | 1678-1721 | shot 10 opening on the pile | planned: the low shoe-level camera on the pile (the shoe-to-shoe dissolve) |
| pierce | seated characters vs their seats | 790-847, 1044-1317 | the card-seat contact of sitting; reduced by fix 1 |

Render speed note: the final render was going to take about 16 hours. The cause was the 3D canvas redrawing the whole scene about 10 times per video frame (its default "always" render loop kept running while each frame was captured). It now draws exactly once per frame, at full quality (dpr 1.0, MSAA 4, 4096 shadow map, depth of field, bloom): about 5 s per frame, about 2.7 hours for the video.
