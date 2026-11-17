# CP5: previz and the v18 checks — "They Scrapped Late Fees and Got a Truckload of Books Back"

## How the checks were run
- **Previz r1** (270×480): stopped part-way through, once its chunks had shown the staging problems. It was used only for contact sheets.
- **Previz r2:** the full 1,896 frames, rendered once.
- **Scripted checks:** tools/sg_checks18.py ran the nine scene-graph checks plus the hard-fail list on r2.
- **What I looked at:** only the tables and hit lists, plus small contact sheets where a hit was listed.
- **Shots changed after r2:** re-checked with 16 full-quality stills, one per changed shot, not a third previz.
- **Ledger:** checks.json.

## Hard-fail list (v18): what I will not deliver
| Hard fail | r2 result | Status |
|---|---|---|
| More than 4 hard cuts, or two within 1 s | 3 cuts (679, 1420, 1631), at least 211 frames apart | PASS |
| White-out or black-out | none (no frame with a mean below 18 or above 238) | PASS |
| A piece popping in | 7 rows. Gary appearing at the doors (f1000) and the board seated late (f271) were real; both fixed (he walks out of the doors; the board is in place from f200). The other 5 happen inside whips. | FIXED |
| Framing or head-on-head hit | head-on-head: the reader in the hall over Marge's walk (moved to the far table), Gary and Dwayne in the old desk two-shot (re-angled side-on) | FIXED |
| Wrong focus target | 3 short runs (f160 desk, f940 grandma, f1408 window). The desk run is fixed by the new angle; the window shot now has the blinds as its subject; the grandma pull rides the slow glide. | FIXED / OK |
| Missing picture-sentence object | 9 hits. Fixed: the book wave (truck moved clear of the bin), the ledger drop (medium framing with the wastebasket), FREE-FOR-ALL MARGE (camera pulled back), the truck (camera beside the cab), +240% (a new whip to Kevin at the chart), "shovel" (Gary's whip moved after the word), the envelope (tilts down with it), the closet (the whip lands before it bursts). | FIXED (re-checked on stills) |
| Held pose over 1.5 s that is not a punchline | 0 stretches with no visible change for 1.5 s | PASS |

## The nine checks (r2)
| Check | Rows | Hits | Notes |
|---|---|---|---|
| 1 Name (the named character or object on screen at its word) | 18 | 5 | grandma f965 (close-up, head 75%), Gary f1664, "1994" f1748: framing fixed; "nothing" f1619: Mr. Pruitt at the edge as the lid snaps (kept) |
| 2 Landing (subject in frame after each move) | 37 | 16 | 9 are inserts with no character (checked on stills). Fixed: Marge f314, the Kevin subject f633, Dwayne in the truck f1017/f1081. Dwayne f1396 is the intended back-of-head shot. |
| 3 Lens (rays to the subject's head blocked) | 77 | 77 | Mostly the old desk two-shot (fixed) and inside the bin (no subject). f12-17: the sign passes her face as she pulls (intended). |
| 4 Whip (centre ray on whip frames) | 150 | 150 | Interior whips pass close to walls. Spot-checked; no whip crosses a solid object on screen. |
| 5 Shot edge (brightness jump >20%) | 5 | 5 | All at intended light changes (into the bin, the dissolves, the crane into the hall) |
| 6 Framing | 640 | 640 | Mostly the back-of-head foregrounds (Dwayne at the desk, Gary's sneak); real hits fixed (see above) |
| 7 Picture sentence | 30 | 9 | Fixed (see above) |
| 8 Blank | 0 | 0 | PASS |
| 9 Action (new action every 1.5 s) | 0 | 0 | PASS |

## Motion (the Rick study target)
- **Measure:** the median change from one frame to the next across the whole previz.
- **Target:** at least 7. Rick's measured 8.8-14.6, read from YouTube frames, so probably 10-30% high.
- **Results:**
  - Our last video: 3.6.
  - Previz r2: 4.8.
- **Change after r2:** every held framing now orbits further (up to about 11°, was 7°) and creeps in faster, and new whips were added (to the tally, back to Marge).
- **Status:** I'll measure it again on the final video, once, with tools/motion_focus.py.

## Performance fix found while rendering (kept for every video)
- **Problem:** the set had 20 point lights. Software GL shades every visible light on every pixel, so frames took about 3× longer.
- **Fix:** each scene now switches on only the lights it uses (`pm`, `bk` and `rr` in the set's controls).
- **Result:** full quality is now about 10-11 s per frame on 2 cores.
