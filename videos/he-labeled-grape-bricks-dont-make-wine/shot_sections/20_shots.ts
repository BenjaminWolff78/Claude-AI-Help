
// =====================================================================================================================
// SHOT 1 (0-445) = H1-H4, the press yard at golden morning (home base A). v10.9 holds: H1 0-118 Brick Boy at the press
// (cranks, picks up a fresh brick, shows the WARNING label); G1 118-150 crane up/back; H2 150-229 wide (press yard, the
// road, Hank's half-ripped field; the wine bottle gets its NO stamp on "banned"); G2 229-262 glide down to Hank; H3
// 262-358 Hank yanks a vine, throws it on the heap, laughs, points across: "Nobody's buying a grape brick, Brick Boy";
// hard cut 1 at 358 to Brick Boy's smug close-up; H4 358-445 he lifts the brick on "label", push into the label.
const BB_PRESS = (s: SetDef) => MK(s, "brickPress");
const HANK_Y = (s: SetDef) => MK(s, "hankYank");
const brickAt = (p: V3, rt: [number, number], k = 0.3): V3 => [p[0] + rt[0] * k, 1.36, p[2] + rt[1] * k];
const rtOf = (az: number): [number, number] => { const a = (az * Math.PI) / 180; return [Math.cos(a), -Math.sin(a)]; };
SHOT_CAMS[1] = (s) => {
  const bb = BB_PRESS(s), hk = HANK_Y(s), press = MK(s, "pressTop"), heap = MK(s, "vineHeap");
  const h1 = fit([body(bb, 0, 2.05, 0.45)], 168, 4, 40, 0.8, 0.35, 0.1); void press;
  const h2 = fit([body(bb), body(hk), body(heap, 0, 1.2, 1.0)], 42, 20, 44, 0.9);
  const h3 = fit([body(hk, 0, 2.05, 0.5)], -62, 4, 40, 0.8, 0, 0.1); void heap;
  const h4 = fit([body(bb, 0.95, 2.1, 0.34)], -150, 2, 34, 0.86, 0, 0.12);
  const lab = brickAt(bb, rtOf(-150), 0.44);
  return [
    K(0, F(() => h1, 0, 0.0024, [[52, 0.006, 10]])),
    K(118, F(() => h2, 118, 0.0014), 32),
    K(229, F(() => h3, 229, 0.0022, [[280, 0.006, 10]]), 33),
    K(358, F((f) => { const k = sm(f, 400, 445); return { pos: lerp3(h4.pos, [lab[0] + (h4.pos[0] - lab[0]) * 0.18, lab[1] + 0.05, lab[2] + (h4.pos[2] - lab[2]) * 0.18], k), look: lerp3(h4.look, lab, k), fov: lerp(34, 30, k) }; }, 358, 0.0026), 1, true),
  ];
};
SHOT_ACTS[1] = (f, s) => {
  const bb = BB_PRESS(s), hk = HANK_Y(s), crank = f < 58 ? f / 46 : 58 / 46;
  return {
    ctl: { press: crank, juice: f < 62 ? 1 : 0, bricks: f < 70 ? 20 : 21, agentCar: -1, spread: 0 },
    cast: [
      C("brickBoy", bb, flow(f, [
        [0, { expr: "determined", facing: 1, tilt: 4 + 3 * Math.sin(f * 0.45), armR: AR.crankR, armRFront: true, armL: [[-10, 4], [18, -16]] as A2, armLFront: true }],
        [56, { expr: "calm", facing: -1, armR: AR.downR, armRFront: true }, 8],                                    // lets go, bends to the crate
        [66, { expr: "smug", facing: -1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],    // a fresh brick
        [84, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 10], // WARNING!
        [150, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],
        [358, { expr: "smug", facing: -1, look: -0.4, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }],
        [383, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 3 }, 10],   // "Read the label."
      ]), { idx: 1 }),
      C("hank", hk, flow(f, [
        [0, { expr: "strain", facing: 1, tilt: 10, armR: [[20, 20], [30, 40]] as A2, armRFront: true, armL: [[-6, 24], [16, 40]] as A2, armLFront: true }],
        [236, { expr: "strain", facing: 1, tilt: 14, armR: [[20, 24], [26, 44]] as A2, armRFront: true, armL: [[-4, 26], [14, 44]] as A2, armLFront: true }, 6],
        [252, { expr: "grin", facing: 1, tilt: -4, armR: AR.liftHiR, armRFront: true, propR: "vineYank" }, 3],    // yank (impact timing)
        [266, { expr: "grin", facing: -1, tilt: 4, armR: [[-10, -14], [-34, -30]] as A2, armRFront: true }, 6],   // tosses it on the heap
        [280, { ...laughP(f, 280, 0), facing: 1, armR: AR.hipR, armL: AR.hipL }, 4],                               // "One laughs"
        [299, { expr: "grin", facing: 1, armR: AR.pointR, armRFront: true, mouth: talk(f, 300, 352), headTilt: 3 * Math.sin(f * 0.3) }, 4],
      ]), { idx: 2 }),
    ],
    fx: fxs(
      (() => { const c = camAt(1, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return noWine("nw1", [c.pos[0] + d[0] / L * 7, c.pos[1] + d[1] / L * 7 + 0.9, c.pos[2] + d[2] / L * 7], f, 150, 160, 226); })(),
      f >= 252 && f < 264 ? dustCard("yank", [hk[0] + 0.3, 0.3, hk[2]], 0.9, 0.8 * (1 - (f - 252) / 12), 2) : null,
      f >= 268 && f < 280 ? dustCard("heap", [hk[0] - 1.6, 0.5, hk[2] + 3.6], 1.0, 0.7 * (1 - (f - 268) / 12), 3) : null,
      f >= 383 && f < 400 ? sparkle("lab1", brickAt(bb, rtOf(-150), 0.44), f - 383, 0.28) : null,
    ),
    focus: f < 118 ? [bb[0], 1.2, bb[2]] : f < 229 ? [hk[0] * 0.5 + bb[0] * 0.5, 1, (hk[2] + bb[2]) / 2] : f < 358 ? [hk[0], 1.4, hk[2]] : brickAt(bb, rtOf(-150), 0.44),
    subj: f < 118 ? "brickBoy" : f < 229 ? null : f < 358 ? "hank" : "brickBoy",
  };
};
lens(0, 6, 1); lens(118, 0, 20); lens(229, 5, 20); lens(358, 7, 1);

// =====================================================================================================================
// SHOT 2 (445-582) = H5, the night kitchen (home base B), one slow track: the warning acted out. Opens on the brick over
// the jug (object match from the label), pulls back: Mum drops it in the gallon of water (it turns purple), carries the
// jug to the pantry, puts it in, the calendar above flips 1 -> 21, the doors close (object dissolve on the doors).
const MUM_C = (s: SetDef) => MK(s, "mumCounter");
SHOT_CAMS[2] = (s) => {
  const jug = MK(s, "jug");
  return [
    K(445, F((f) => { const k = sm(f, 445, 486), k2 = sm(f, 496, 540);
      const a = { pos: [jug[0] + 0.35, jug[1] + 0.75, jug[2] + 1.1] as V3, look: [jug[0], jug[1] + 0.45, jug[2]] as V3 };
      const b = { pos: [1.3, 1.5, 2.3] as V3, look: [0.9, 1.25, -1.6] as V3 }, c = { pos: [2.5, 1.8, 2.5] as V3, look: [2.25, 1.8, -1.6] as V3 };
      return { pos: lerp3(lerp3(a.pos, b.pos, k), c.pos, k2), look: lerp3(lerp3(a.look, b.look, k), c.look, k2), fov: lerp(36, 44, k) }; }, 445, 0.0016)),
  ];
};
SHOT_ACTS[2] = (f, s) => {
  const m0 = MUM_C(s), walk = along([m0, [2.25, 0, -1.08]], 0.075, 500, f);
  const carrying = f >= 494 && f < 546;
  return {
    ctl: { jugWater: f < 548 ? 1 : 0, jugFill: sm(f, 458, 490), jugHide: f >= 494 ? 1 : 0, cupboard: sm(f, 528, 540) * (1 - sm(f, 560, 578)), day: dayFlip(f, 546, 574), shelf: 6, jugGlow: 0 },
    cast: [
      C("mum20", walk.p, walk.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 12), facing: 1, armR: AR.carryR, armRFront: true, propR: "jug" }) : flow(f, [
        [445, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick" }],
        [456, { expr: "smug", facing: -1, armR: [[22, 8], [30, 20]] as A2, armRFront: true }, 3],                // drops it in (plop)
        [490, { expr: "smug", facing: 1, armR: AR.carryR, armRFront: true, propR: carrying ? "jug" : undefined }, 8],
        [540, { expr: "calm", facing: 1, armR: [[24, -2], [44, -8]] as A2, armRFront: true, propR: f < 548 ? "jug" : undefined }, 6],   // into the pantry
        [552, { expr: "smug", facing: -1, look: 0.6, armR: AR.downR }, 8],
      ]), { idx: 1 }),
      C("kid20", MK(s, "kidTable"), flow(f, [[445, { expr: "neutral", facing: -1, look: -0.3 }], [500, { expr: "stare", facing: 1, look: 0.4 }, 6]]), { idx: 2 }),
    ],
    fx: fxs(f >= 456 && f < 470 ? sparkle("plop", add3(MK(s, "jug"), 0, 0.5, 0), f - 456, 0.22, "#d8b0f0") : null),
    focus: f < 494 ? add3(MK(s, "jug"), 0, 0.4, 0) : [walk.p[0], 1.4, walk.p[2]],
    subj: f < 480 ? null : "mum20",
  };
};
lens(445, 7, 1); lens(486, 3, 20);

// =====================================================================================================================
// SHOT 3 (582-893) = H6, G3, H7 at day (home base A). H6 582-722: from the brick in Lou's hands (town3) pull back along
// the crowd at the fence (different depths, angled to the yard): they laugh together on "laughs"; town3 reads the brick:
// "Who puts a warning on juice?"; the black sedan rolls in behind them and stops by the gate. G3 715-745 rides the
// agent through the gate. H7 745-893 (fake-out): the agent at the brick table, the crowd lined up at the fence behind
// him grinning; he picks up a brick, reads it out loud, puts it back, tips his hat; the crowd's faces drop.
const CROWD = ["town1", "town2", "town3", "town4", "hank"];
const agentWalk = (s: SetDef): V3[] => [MK(s, "agentOut"), [7.3, 0, -8.8] as V3, MK(s, "agentTable")];
SHOT_CAMS[3] = (s) => {
  const t3 = MK(s, "fence3"), at3 = add3(t3, 0, 1.3, 0), table = MK(s, "agentTable");
  const crowdBoxes = ["fence1", "fence2", "fence3", "fence4", "fence5"].map((k) => body(MK(s, k)));
  const h6 = { pos: [10.4, 2.2, 3.6] as V3, look: [5.8, 1.3, -3.6] as V3, fov: 44 }; void crowdBoxes;
  const h7 = { pos: [11.9, 1.65, -14.4] as V3, look: [8.9, 1.3, -8.9] as V3, fov: 38 }; void table;
  return [
    K(582, F((f) => { const k = sm(f, 584, 626); return { pos: lerp3([at3[0] + 0.9, at3[1] + 0.1, at3[2] + 0.4], h6.pos, k), look: lerp3(at3, h6.look, k), fov: lerp(34, 42, k) }; }, 582, 0.0018)),
    K(715, F((f) => { const w = along(agentWalk(s), 0.075, 702, f).p, k = sm(f, 715, 790); return { pos: lerp3([w[0] + 3.2, 1.5, w[2] + 2.6], h7.pos, k), look: lerp3([w[0], 1.2, w[2]], h7.look, k), fov: 42 }; }, 715, 0.0012), 30),
    K(792, F(() => h7, 792, 0.0026, [[876, 0.006, 10]]), 1),
  ];
};
SHOT_ACTS[3] = (f, s) => {
  const aw = along(agentWalk(s), 0.075, 702, f), carU = f < 668 ? -1 : sm(f, 668, 700) * 0.999 + (f >= 700 ? 0.001 : 0);
  const crowd = CROWD.map((who, i) => {
    const pos = MK(s, "fence" + (i + 1)), ty = MK(s, "agentTable");
    const lookAgent = f >= 700 ? -1 : 1;
    return C(who, pos, flow(f, [
      [582, { expr: "grin", facing: 1, ...(who === "town3" ? { armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1 } : {}) }],
      [592 + i, { ...laughP(f, 592, i), facing: 1, armR: i % 2 ? AR.pointR : AR.hipR, armRFront: true, ...(who === "town3" ? { armR: AR.liftHiR, propR: "grapeBrick", propK: 1 } : {}) }, 3],   // the whole town laughs
      [622, who === "town3" ? { expr: "grin", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, mouth: talk(f, 625, 660) } : { ...laughP(f, 622, i + 2), facing: 1 }, 4],
      [690 + i * 2, { expr: "stare", facing: lookAgent, look: -0.5 }, 6],                                                       // the sedan
      [740 + i, { expr: "grin", facing: 1, look: 0.4 }, 6],                                                                      // here comes the arrest
      [878 + i, { expr: "dismay", facing: 1, sweat: i === 4 ? 1 : 0 }, 4],                                                       // he put it back
    ]), { idx: 10 + i });
    void ty;
  });
  return {
    ctl: { agentCar: carU, bricks: 21, press: 0, juice: 0 },
    cast: [
      ...crowd,
      C("brickBoy", MK(s, "bbTable"), flow(f, [[582, { expr: "calm", facing: -1, armR: AR.hipR, armL: AR.hipL }], [700, { expr: "stare", facing: -1, look: -0.6 }, 6], [880, { expr: "smug", facing: -1, armR: AR.hipR, armL: AR.hipL }, 6]]), { idx: 1 }),
      ...(f >= 700 ? [aw.moving ? C("agent", aw.p, pose(null, { expr: "stern", mode: "walk", phase: ph(f, 11), facing: screenSide(3, s, f, aw.d[0], aw.d[1]) }), { idx: 20 }) : C("agent", aw.p, flow(f, [
        [790, { expr: "stern", facing: 1, armR: AR.downR }],
        [796, { expr: "stern", facing: 1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],                     // picks up a brick
        [814, { expr: "stare", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, mouth: talk(f, 816, 866), headTilt: 4 }, 8],  // reads it out loud
        [868, { expr: "blank", facing: 1, armR: AR.downR, armRFront: true }, 8],                                                    // puts it back
        [882, { expr: "calm", facing: 1, armR: AR.tipHatR, armRFront: true }, 6],                                                   // tips his hat
      ]), { idx: 20 })] : []),
    ],
    fx: fxs(
      f >= 668 && f < 712 ? dustTrail("car", [2.7, 0, 30 - 36 * sm(f, 668, 700)], [0, 1], f, 6, 0.8 * (1 - sm(f, 700, 712)), 0.8) : null,
      f >= 868 && f < 882 ? dustCard("putback", add3(MK(s, "agentTable"), 0.55, 0.95, 0), 0.45, 0.6 * (1 - (f - 868) / 14), 4) : null,
    ),
    focus: f < 626 ? add3(MK(s, "fence3"), 0, 1.3, 0) : f < 715 ? add3(MK(s, "fence3"), 0, 1.2, 0) : [aw.p[0], 1.3, aw.p[2]],
    subj: f < 700 ? "town3" : "agent",
  };
};
lens(582, 7, 1); lens(626, 3, 20); lens(792, 5, 16);

// =====================================================================================================================
// SHOT 4 (893-958) = H8, Washington (hard cut 2): the lawyer winds up and slams LEGAL on the ruling ("legal"), push to
// the paper (object dissolve to the kitchen shelf).
SHOT_CAMS[4] = (s) => { const p = MK(s, "paper");
  return [K(893, F((f) => { const k = sm(f, 934, 958); return { pos: lerp3([0.35, 1.42, 2.3], [p[0] + 0.1, p[1] + 0.9, p[2] + 0.75], k), look: lerp3([0, 1.05, -0.5], p, k), fov: 40 }; }, 893, 0.0026, [[936, 0.007, 10]]), 1, true)]; };
SHOT_ACTS[4] = (f, s) => ({
  ctl: { fan: 1 },
  cast: [C("lawyer", MK(s, "lawyer"), flow(f, [
    [893, { expr: "stern", facing: 1, armR: AR.holdR, armRFront: true, propR: "legalStamp", propK: 1 }],
    [912, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1, tilt: -4 }, 8],   // wind-up (held)
    [934, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1, tilt: 6 }, 2],     // SLAM
  ]), { idx: 1 })],
  fx: fxs(legalMark(add3(MK(s, "paper"), 0, 0.01, 0.05), f, 935), f >= 935 && f < 945 ? bang(add3(MK(s, "paper"), 0.25, 0.25, 0), f - 935) : null),
  focus: f < 934 ? [0, 1.3, -1.05] : MK(s, "paper"),
  subj: "lawyer",
});
KICKS.push([935 / 30, 0.6]); lens(893, 5, 1);

// =====================================================================================================================
// SHOT 5 (958-1485) = H9-H12, the kitchen. H9 958-1104: from the shelf (object match with the stamped paper) the bricks
// pop off one by one ("fly off the shelves"); pull back as the serviceman steps in the door, sets up the jug, steam puff
// (time jump), corks a bottle. G4 1100-1130 glide to Mum. H10 1130-1282 the explanation (deep-blue night): "That's the
// trick" (taps the brick), NO-wine stamp, the 200 GALLONS counter while she counts on her fingers; the kid listens. G5
// 1275-1300 rides Mum to the pantry. H11 1300-1390 doors open on the jugs, the calendar flips to 21, she shrugs.
// Hard cut 3 at 1392: the kid at the stove holds up the CAKE MIX box, winks on "350"; push to the box (object dissolve).
const SVC = (s: SetDef): V3[] => [MK(s, "serviceIn"), [2.4, 0, 0.6], MK(s, "serviceJug")];
const MUM5: V3 = [-0.55, 0, -1.08];
SHOT_CAMS[5] = (s) => {
  const shelf = MK(s, "shelf"), jug = MK(s, "jug");
  const h9 = { pos: [2.6, 1.6, 2.9] as V3, look: [1.3, 1.2, -1.1] as V3, fov: 46 };
  const h10 = { pos: [1.5, 1.5, 1.7] as V3, look: [-0.75, 1.22, -0.9] as V3, fov: 44 };
  const h11 = fit([body([2.3, 0, -1.08]), [[2.7, 0, -1.9], 0, 3.1, 0.75]], 14, 4, 42, 0.86);
  const h12 = { pos: [-0.35, 1.2, 1.35] as V3, look: [-1.85, 1.05, -0.6] as V3, fov: 40 };
  return [
    K(958, F((f) => { const k = sm(f, 990, 1030); return { pos: lerp3([shelf[0] + 0.3, shelf[1] + 0.15, shelf[2] + 1.35], h9.pos, k), look: lerp3(shelf, h9.look, k), fov: lerp(38, 46, k) }; }, 958, 0.0016)),
    K(1100, F(() => h10, 1100, 0.0022, [[1110, 0.006, 10]]), 30),
    K(1275, F(() => h11, 1275, 0.0022), 25),
    K(1392, F((f) => { const k = sm(f, 1450, 1485), bx: V3 = [-1.6, 1.05, -0.5]; return { pos: lerp3(h12.pos, [bx[0] + 0.55, bx[1] + 0.05, bx[2] + 0.6], k), look: lerp3(h12.look, bx, k), fov: 36 }; }, 1392, 0.0024, [[1458, 0.007, 10]]), 1, true),
  ];
  void jug;
};
SHOT_ACTS[5] = (f, s) => {
  const sv = along(SVC(s), 0.06, 1003, f), mw = along([MUM5, [2.3, 0, -1.08]], 0.11, 1277, f);
  const bottle = f >= 1080;
  return {
    ctl: { shelf: f < 964 ? 6 : 6 - Math.min(6, Math.floor((f - 964) / 5)), jugWater: f >= 1030 && f < 1080 ? 1 : 0, jugFill: f >= 1080 ? 0 : sm(f, 1046, 1066), jugHide: f < 1030 || f >= 1080 ? 1 : 0,
      cupboard: f < 1300 ? 0 : sm(f, 1306, 1320), day: f < 1300 ? 1 : dayFlip(f, 1322, 1346), jugGlow: 0 },
    cast: [
      ...(f >= 1000 && f < 1110 ? [sv.moving ? C("service", sv.p, pose(null, { expr: "beam", mode: "walk", phase: ph(f, 12), facing: screenSide(5, s, f, sv.d[0], sv.d[1]), armR: AR.carryR, armRFront: true, propR: "jug" }), { idx: 5 })
        : C("service", sv.p, flow(f, [
          [1030, { expr: "smile", facing: -1, armR: AR.downR, armRFront: true }],
          [1040, { expr: "smile", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick" }, 8],          // drops a brick in
          [1048, { expr: "proud", facing: -1, armR: AR.downR, armRFront: true }, 3],
          [1082, { expr: "beam", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "wineBottle", propK: 1 }, 6],  // later: corked
        ]), { idx: 5 })] : []),
      C("mum20", mw.moving ? mw.p : f >= 1277 ? mw.p : MUM5, mw.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 11), facing: 1 }) : flow(f, [
        [958, { expr: "smile", facing: 1, look: 0.5 }],
        [1104, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 8],
        [1110, { expr: "smug", facing: 1, armR: AR.slapR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 3],          // "That's the trick."
        [1135, { expr: "stern", facing: 1, armR: [[26, -6], [36, -30]] as A2, armRFront: true }, 6],                                  // "bans selling wine"
        [1181, { expr: "eureka", facing: 1, armR: [[24, -10], [30, -40]] as A2, armRFront: true, armL: [[-24, -8], [-26, -36]] as A2, armLFront: true }, 8],   // counts it out
        [1230, { expr: "joy", facing: 1, armR: [[30, -8], [44, -34]] as A2, armRFront: true, armL: [[-30, -8], [-44, -34]] as A2, armLFront: true }, 8],
        [1300, { expr: "sly", facing: 1, armR: [[26, -10], [46, -16]] as A2, armRFront: true }, 6],                                   // opens the doors
        [1362, { expr: "smug", facing: -1, armR: AR.shrugR, armL: AR.shrugL, armRFront: true, armLFront: true, headTilt: 6 }, 8],     // "well, that's your juice"
      ]), { idx: 1 }),
      C("kid20", f < 1392 ? MK(s, "kidTable") : [-2.1, 0, -0.62], f < 1392 ? flow(f, [[958, { expr: "grin", facing: 1 }], [1135, { expr: "stare", facing: 1, look: -0.4 }, 6], [1230, { expr: "grin", facing: 1 }, 6]])
        : flow(f, [[1392, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox" }], [1452, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox", headTilt: 6, look: 0.6 }, 4]]), { idx: 2 }),
    ],
    fx: fxs(
      ...[0, 1, 2, 3, 4, 5].map((i) => { const a = 964 + i * 5; return f >= a && f < a + 12 ? sparkle("sh" + i, [-0.1 + i * 0.22, 1.66, -1.95], f - a, 0.22, "#e8c8ff") : null; }),
      f >= 1070 && f < 1092 ? dustCard("steam", [1.0, 1.3, -1.3], 1.6, 0.85 * Math.sin(Math.PI * (f - 1070) / 22), 5) : null,
      noWine("nw5", [0.45, 1.9, -0.4], f, 1132, 1146, 1178),
      gallons("gal", camPt(5, s, f, 2.2, 0.1, 0.42), f, 1180, 1276),
      f >= 1460 && f < 1474 ? glowBurst("oven" + (f - 1460), MK(s, "oven"), 0.5, 1 - (f - 1460) / 14, "255,170,90") : null,
    ),
    focus: f < 1000 ? MK(s, "shelf") : f < 1100 ? [sv.p[0], 1.3, sv.p[2]] : f < 1277 ? [MUM5[0], 1.3, MUM5[2]] : f < 1392 ? [2.3, 1.3, -1.1] : [-2.0, 1.2, -0.55],
    subj: f < 1000 ? null : f < 1100 ? "service" : f < 1392 ? "mum20" : "kid20",
  };
};
lens(958, 7, 1); lens(1000, 3, 24); lens(1100, 4, 20); lens(1392, 6, 1);

// =====================================================================================================================
// SHOT 6 (1485-1810) = H13-H15, the payoff at golden light (home base A). H13 1485-1552: from a grape cluster (object
// match with the cake-mix box) crane up: new vine rows rise out of every field ("almost double"). G6 1545-1575 down to
// Hank; H14 1575-1640 he kneels and plants a vine back. G7 1630-1665 rides the lawyer's walk to the gate. H15 1665-1810:
// she stands beside Brick Boy, stamps LEGAL on his brick on "lawyer"; the debate line; he lifts the brick until it fills
// half the frame (sparkle + glint); object dissolve to the glowing jug.
const LAW_W: V3[] = [[4.0, 0, -3.0], [6.0, 0, -8.6], [7.69, 0, -9.0]];
SHOT_CAMS[6] = (s) => {
  const row: V3 = [8.75, 0, 2.0], hk = HANK_Y(s), bb = MK(s, "bbGate"), lw = MK(s, "lawyerGate");
  const h14 = fit([body(hk, 0, 1.6, 0.4)], 70, 8, 40, 0.84, 0, 0.1);
  const h15 = { pos: [13.3, 1.75, -10.3] as V3, look: [8.2, 1.25, -9.75] as V3, fov: 42 }; void lw;
  const brick: V3 = [bb[0], 1.27, bb[2] - 0.32];
  return [
    K(1485, F((f) => { const k = sm(f, 1490, 1546); return { pos: lerp3([row[0] - 1.1, 1.05, row[2] + 0.2], [-4, 15, 22], k), look: lerp3([row[0] - 0.3, 0.92, row[2]], [8, 0, -14], k), fov: lerp(36, 46, k) }; }, 1485, 0.0012)),
    K(1545, F(() => h14, 1545, 0.0022), 30),
    K(1630, F((f) => { const w = along(LAW_W, 0.085, 1590, f).p, k = sm(f, 1660, 1700); return { pos: lerp3([w[0] + 0.5, 1.6, w[2] + 4.2], h15.pos, k), look: lerp3([w[0], 1.2, w[2]], h15.look, k), fov: 40 }; }, 1630, 0.0012), 1, true),   // hard cut 4: the lawyer walks in
    K(1750, F((f) => { const k = sm(f, 1750, 1800); return { pos: lerp3(h15.pos, [brick[0] + 1.45, brick[1] + 0.12, brick[2] + 0.1], k), look: lerp3(h15.look, brick, k), fov: lerp(40, 34, k) }; }, 1750, 0.0016), 1),
  ];
};
SHOT_ACTS[6] = (f, s) => {
  const lwk = along(LAW_W, 0.085, 1590, f), bb = MK(s, "bbGate");
  return {
    ctl: { spread: sm(f, 1495, 1548), bricks: 21, agentCar: 1, press: 0 },
    cast: [
      C("hank", HANK_Y(s), flow(f, [
        [1485, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank" } as P],
        [1588, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[18, 28], [20, 54]] as A2, armRFront: true, propR: "vineYank", tilt: 8 } as P, 10],   // pushes it in
        [1612, { expr: "pained", facing: -1, mode: "kneel", kneelK: 1, armR: AR.hipR, sweat: 1 } as P, 8],
      ]), { idx: 2 }),
      C("brickBoy", bb, flow(f, [
        [1485, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick" }],
        [1700, { expr: "proud", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 8],
        [1752, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 12],   // lifts it to us
      ]), { idx: 1 }),
      lwk.moving ? C("lawyer", lwk.p, pose(null, { expr: "proud", mode: "walk", phase: ph(f, 11), facing: screenSide(6, s, f, lwk.d[0], lwk.d[1]), armR: AR.carryR, armRFront: true, propR: "legalStamp" }), { idx: 3 })
        : C("lawyer", f < 1600 ? LAW_W[0] : lwk.p, flow(f, [
          [1600, { expr: "proud", facing: 1, armR: AR.carryR, armRFront: true, propR: "legalStamp" }],
          [1682, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1 }, 8],
          [1700, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1 }, 2],   // stamps his brick
          [1730, { expr: "smug", facing: 1, armR: AR.hipR, armL: AR.hipL }, 8],
        ]), { idx: 3 }),
    ],
    fx: fxs(
      f >= 1700 && f < 1712 ? bang([bb[0] - 0.3, 1.5, bb[2] + 0.1], f - 1700) : null,
      f >= 1770 && f < 1792 ? sparkle("glint", [bb[0], 1.38, bb[2] - 0.32], f - 1770, 0.4) : null,
      f >= 1772 ? glowBurst("pay" + Math.round(lin(f, 1772, 1810) * 6), [bb[0] - 0.1, 1.27, bb[2] - 0.32], 1.2, 0.5 * lin(f, 1772, 1790), "255,226,170") : null,
    ),
    focus: f < 1545 ? [8.5, 0.9, 2.0] : f < 1640 ? add3(HANK_Y(s), 0, 1.0, 0) : f < 1690 ? [along(LAW_W, 0.085, 1590, f).p[0], 1.4, along(LAW_W, 0.085, 1590, f).p[2]] : f < 1750 ? add3(bb, -0.5, 1.4, 0.4) : [bb[0], 1.27, bb[2] - 0.32],
    subj: f < 1545 ? null : f < 1640 ? "hank" : "brickBoy",
  };
};
lens(1485, 7, 1); lens(1520, 0, 24); lens(1545, 4, 20); lens(1750, 6, 24);

// =====================================================================================================================
// SHOT 7 (1810-1930) = H16, the ending (calm, callback prop): the pantry jugs glow purple, the calendar reads 21, Mum
// pours herself a glass and sips with a calm smile; the camera pushes into the glowing jug on "And it all started...".
SHOT_CAMS[7] = (s) => [K(1810, F((f) => { const k = sm(f, 1860, 1930), j: V3 = [2.7, 0.95, -1.9]; return { pos: lerp3([2.1, 1.45, 1.0], [j[0] - 0.15, j[1] + 0.1, j[2] + 0.55], k), look: lerp3([2.5, 1.35, -1.6], j, k), fov: 40 }; }, 1810, 0.0018))];
SHOT_ACTS[7] = (f, s) => ({
  ctl: { cupboard: 1, jugGlow: 0.6 + 0.4 * sm(f, 1810, 1860), day: 21, shelf: 0, jugHide: 1 },
  cast: [C("mum20", [2.05, 0, -1.02], flow(f, [
    [1810, { expr: "calm", facing: 1, armR: AR.liftR, armRFront: true, propR: "glass" }],
    [1838, { expr: "smile_closed", facing: 1, armR: [[22, -10], [10, -40]] as A2, armRFront: true, propR: "glass", headBack: 0.3 }, 10],   // sips
    [1872, { expr: "smug", facing: 1, armR: AR.liftR, armRFront: true, propR: "glass", look: 0.4 }, 10],
  ]), { idx: 1 })],
  fx: [],
  focus: f < 1860 ? [2.05, 1.4, -1.02] : [2.7, 0.95, -1.9],
  subj: "mum20",
});
lens(1810, 5, 1);
