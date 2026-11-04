
// =====================================================================================================================
// SCENE 2 (316-500) LONDON, deep night-blue fog with warm lamps. "So when London put its old bridge up for sale, he said
// two words: 'Buy it.' The thing was sinking an inch every eight years."
// Dissolve from the newspaper photo to the real arches in fog; a red bus rumbles over. The camera glides to the deal
// table on the deck while the FOR SALE banner unrolls down the river face on "for sale" (the city man points); the boss
// raises a finger on "two words", then slaps his giant cheque on the table on "Buy it" (the monocle pops). The camera
// cranes down the bridge face to the river landing: the bridge drops a notch on "sinking" (crunch), the inspector peers
// over his glasses at the tall ruler and shows "an inch"; a duck paddles by.
const L_INSP: V3 = [-27.05, 0.35, 10.2], L_BOSS: V3 = [-19.5, 10.5, 5.72], L_CITY: V3 = [-21.5, 10.5, 5.72], L_TABLE: V3 = [-20.5, 10.5, 5.1];
const L_RAIL: V3 = [-20.45, 10.5, 6.25]; // the city man at the parapet, right over the banner
const city2 = (f: number, s: SetDef): CastPlace => {
  const w = walkPath(2, s, [L_RAIL, L_CITY], f, 376, 388);
  if (w.moving) return C("cityman", w.p, pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "smug", armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }), { idx: 10 });
  return C("cityman", f < 376 ? L_RAIL : L_CITY, flow(f, [
  [316, { expr: "smug", facing: -1, tilt: 6, armR: [[34, -2], [52, 10]] as A2, armRFront: true, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }], // holds the rolled banner over the parapet
  [356, { expr: "beam", facing: -1, armR: [[30, -40], [46, -70]] as A2, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 6],            // "up" - lets it drop
  [366, { expr: "smug", facing: 1, ...PZ.pointR, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8],                                    // "for sale" (points down at it)
  [390, { expr: "pitch", facing: 1, armR: [[30, 4], [52, -10]] as A2, armRFront: true, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8], // presents it to the boss
  [416, { expr: "aghast", facing: 1, monoclePop: 1, squash: -0.06, armR: [[26, 20], [40, 0]] as A2, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8], // "Buy it."
  [436, { expr: "shock", facing: 1, monoclePop: 1, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 10],
]), { idx: 10 });
};
const boss2 = (f: number): CastPlace => C("boss", L_BOSS, flow(f, [
  [316, { expr: "calm", facing: -1, armR: [[26, 30], [30, 52]] as A2 }],                                  // watches the banner go down
  [374, { expr: "sly", facing: -1, armR: [[24, 10], [30, -14]] as A2, headTilt: 4 }, 8],                    // looks at the board
  [386, { expr: "calm", facing: -1, ...PZ.pointRUp }, 8],                                                     // "two words"
  [404, { ...ACT.cheque, expr: "calm", facing: -1, lift: 0.04 }, 8],                                          // lifts the cheque...
  [414, { ...ACT.cheque, expr: "smug", facing: -1, squash: 0.07 }, 4],                                       // ...SLAPS it down: "Buy it."
  [424, { ...ACT.cheque, expr: "calm", facing: -1, headTilt: 5 }, 8],
]), { idx: 1 });
const insp2 = (f: number): CastPlace => C("inspector", L_INSP, flow(f, [
  [316, { ...ACT.inspect, expr: "neutral" }],
  [440, { ...ACT.inspect, expr: "shock", squash: 0.05 }, 3],                     // the bridge drops a notch: "sinking"
  [450, { ...ACT.inspect, expr: "stare", headTilt: -6 }],                         // peers over his glasses
  [457, { ...ACT.inspect, expr: "smug", armL: [[-26, 10], [-44, -12]] as A2 }],   // "an inch"
  [476, { ...ACT.inspect, expr: "neutral", headTilt: 5, armL: [[-24, -6], [-40, -30]] as A2 }, 8],  // "every eight years": a slow tick-tock finger
]), { idx: 11 });
SHOT_CAMS[2] = () => [
  K(316, F(() => ({ pos: [-20.1, 12.0, 15.0] as V3, look: [-20.1, 10.5, 7.0] as V3, fov: 40 }), 316, 0.0024, [[360, 0.006, 10]])),       // the city man drops the FOR SALE banner
  K(374, F(() => fit([body(L_BOSS, 0.4, 2.2, 0.45), body(L_CITY, 0.4, 2.2, 0.45), [L_TABLE, 0.5, 1.1, 0.5]], 10, 42, 40, 0.86), 374, 0.0018, [[416, 0.007, 10]]), 22), // cranes up over the parapet
  K(428, F(() => fit([body(L_INSP, 0, 2.5, 0.55)], 56, -6, 40, 0.72, 0.1), 428, 0.0018, [[440, 0.007, 10]]), 26),
];
SHOT_ACTS[2] = (f, s) => ({
  ctl: { banner: lin(f, 358, 370) ** 0.7, bus: lin(f, 318, 372), sink: sm(f, 438, 444), lamps: 1, dismantle: 0, numbered: 0, later: 0, crate: 0, ruler: 0 },
  cast: [insp2(f), boss2(f), city2(f, s),
    C("duck", [-23.5 - 0.02 * (f - 316), 0.02, 13.2], pose(null, { facing: -1, phase: ph(f, 22) }), { scale: 0.75, idx: 12 }),
    C("lady", [-6.4, 10.5, 5.5], pose(null, { expr: "smile", facing: -1, armR: [[24, -10], [30, -40]] as A2, propR: "umbrellaOpen", propK: 1 }), { idx: 13 }),
    C("bobby", [-18.5, 10.5, -5.3], pose(null, { expr: "neutral", facing: 1, ...PZ.hips }), { idx: 14 }),
    C("gent", [6.5, 10.5, -5.0], pose(null, { expr: "neutral", facing: -1, armR: [[24, 30], [34, 40]] as A2, armRFront: true, propR: "newspaper" }), { idx: 15 }),
  ],
  fx: fxs(
    f >= 415 && f < 430 ? sparkle("cheque", [L_TABLE[0] + 0.4, 11.9, L_TABLE[2] + 0.3], f - 415, 0.5) : null,
    f >= 438 && f < 454 ? dustCard("sink", [-26.9, 0.6, 9.6], 0.9, 0.7 * (1 - lin(f, 438, 454)), 2) : null),
  focus: f < 374 ? [L_RAIL[0], 11.6, L_RAIL[2]] : f < 428 ? [L_TABLE[0], 11.6, L_TABLE[2] + 0.5] : [L_INSP[0], 1.9, L_INSP[2]],
  subj: f < 428 ? "boss" : "inspector",
});
lens(316, 5, 1); lens(428, 6, 26);
