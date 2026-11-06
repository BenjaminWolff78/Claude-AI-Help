
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
  const bb = BB_PRESS(s), hk = HANK_Y(s);
  const h1 = fit([body(bb, 0, 2.05, 0.45)], 168, 4, 40, 0.8, 0.12, 0.1);
  const h2 = fit([body(hk, 0, 2.9, 1.1)], -62, 10, 44, 0.86, -0.8, 0.25);      // over Hank's field to Brick Boy's farm across the road
  const h3 = fit([body(hk, 0, 2.05, 0.5)], -62, 8, 40, 0.8, -0.35, 0.15);              // same axis as the wide: the glide is mostly a push
  const h4 = fit([body(bb, 0.95, 2.1, 0.34)], -150, 2, 34, 0.86, 0, 0.12);
  const S1 = F(() => h1, 0, 0.0024, [[52, 0.006, 10]]), S2 = F(() => h2, 118, 0.0016), S3 = F(() => h3, 269, 0.0022, [[280, 0.006, 10]]);
  return [
    K(0, S1),
    K(118, S2, 1, true),                                                       // hard cut 1: "You see," -> the neighbour's field
    K(229, glideTo(S2, 229, S3, 269), 1),                                      // G1 (40 f) in to Hank
    K(358, F((f) => { const k = sm(f, 402, 445); return { pos: lerp3(h4.pos, lerp3(h4.look, h4.pos, 0.8), k), look: h4.look, fov: 34 }; }, 358, 0.0026), 1, true),   // hard cut 2: the smug reaction, push in on "label"
  ];
};
/** remake: two neighbours ripping out vines further back in Hank's field ("His neighbors rip out their vines"), each on
 *  its own irregular strain -> yank -> toss -> bend cycle (a task, not a loop). Placed along the wide's view line. */
let NB1: V3[] | null = null;
/** the wide (cam ~[-11.6, 2.6, 5.9] looking east over Hank's field) only has room in Hank's field on its left edge, between
 *  his fence and the first row: one neighbour rips vines there; the second works further back along the same row */
const neighboursAt = (s: SetDef): V3[] => {
  if (NB1) return NB1;
  const hk = HANK_Y(s);
  NB1 = [[-6.66, hk[1], 2.6], [-7.2, hk[1], 0.6]];
  return NB1;
};
const ripCycle = (f: number, i: number): FigOpts => {
  const beats: Beat[] = [[0, { expr: "strain", facing: i ? -1 : 1, tilt: 12, armR: [[20, 22], [28, 42]] as A2, armRFront: true, armL: [[-6, 24], [14, 42]] as A2, armLFront: true }]];
  let t = 20 + i * 23;
  for (let k = 0; t < 470; k++) {
    const g = 58 + ((k * 37 + i * 19) % 23);
    beats.push([t, { expr: "strain", facing: i ? -1 : 1, tilt: 15, armR: [[20, 26], [24, 46]] as A2, armRFront: true, armL: [[-4, 26], [12, 44]] as A2, armLFront: true }, 10]);
    beats.push([t + 18, { expr: "grin", facing: i ? -1 : 1, tilt: -5, armR: AR.liftHiR, armRFront: true, propR: "vineYank" }, 3]);          // yank
    beats.push([t + 30, { expr: "grin", facing: i ? 1 : -1, tilt: 3, armR: [[-10, -14], [-34, -30]] as A2, armRFront: true }, 6]);        // toss
    beats.push([t + 44, { expr: "strain", facing: i ? -1 : 1, tilt: 12, armR: [[20, 22], [28, 42]] as A2, armRFront: true, armL: [[-6, 24], [14, 42]] as A2, armLFront: true }, 10]);   // bends to the next vine
    t += g;
  }
  return flow(f, beats);
};
SHOT_ACTS[1] = (f, s) => {
  const bb = BB_PRESS(s), hk = HANK_Y(s), crank = f < 58 ? f / 46 : f < 160 ? 58 / 46 : 58 / 46 + (Math.min(f, 326) - 160) / 46;
  return {
    ctl: { press: crank, juice: f < 62 ? 1 : 0, bricks: f < 70 ? 20 : 21, agentCar: -1, spread: 0 },
    cast: [
      C("brickBoy", bb, flow(f, [
        [0, { expr: "determined", facing: 1, tilt: 4 + 3 * Math.sin(f * 0.45), armR: AR.crankR, armRFront: true, armL: [[-10, 4], [18, -16]] as A2, armLFront: true }],
        [56, { expr: "calm", facing: -1, armR: AR.downR, armRFront: true }, 8],                                    // lets go, bends to the crate
        [66, { expr: "smug", facing: -1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],    // a fresh brick
        [84, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 10], // WARNING!
        [150, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],
        [160, { expr: "determined", facing: 1, tilt: 4 + 3 * Math.sin(f * 0.45), armR: AR.crankR, armRFront: true, armL: [[-10, 4], [18, -16]] as A2, armLFront: true }, 10],   // back to cranking out bricks (far yard)
        [326, { expr: "calm", facing: -1, armR: AR.downR, armRFront: true }, 8],
        [338, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],
        [358, { expr: "smug", facing: -1, look: -0.4, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }],
        [383, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 3 }, 10],   // "Read the label."
      ]), { idx: 1 }),
      C("hank", hk, flow(f, [
        [0, { expr: "strain", facing: 1, tilt: 10 + 4 * Math.max(0, Math.sin(f * 0.38)) ** 2, armR: [[20, 20 + 4 * Math.max(0, Math.sin(f * 0.38)) ** 2], [30, 40 + 5 * Math.max(0, Math.sin(f * 0.38)) ** 2]] as A2, armRFront: true, armL: [[-6, 24], [16, 40]] as A2, armLFront: true, headTilt: -3 * Math.max(0, Math.sin(f * 0.38)) ** 2 }],   // tugs: each pull rocks the whole body
        [236, { expr: "strain", facing: 1, tilt: 14, armR: [[20, 24], [26, 44]] as A2, armRFront: true, armL: [[-4, 26], [14, 44]] as A2, armLFront: true }, 6],
        [252, { expr: "grin", facing: 1, tilt: -4, armR: AR.liftHiR, armRFront: true, propR: "vineYank" }, 3],    // yank (impact timing)
        [266, { expr: "grin", facing: -1, tilt: 4, armR: [[-10, -14], [-34, -30]] as A2, armRFront: true }, 6],   // tosses it on the heap
        [280, { ...laughP(f, 280, 0), facing: 1, armR: AR.hipR, armL: AR.hipL }, 4],                               // "One laughs"
        [299, { expr: "grin", facing: 1, armR: AR.pointR, armRFront: true, mouth: talk(f, 300, 352), headTilt: 3 * Math.sin(f * 0.3) }, 4],
      ]), { idx: 2 }),
      ...(f >= 118 && f < 358 ? neighboursAt(s).map((p, i) => C(i ? "town2" : "town1", p, ripCycle(f, i), { idx: 30 + i })) : []),
    ],
    fx: fxs(
      ...(f >= 118 && f < 358 ? neighboursAt(s).map((p, i) => { const y = (f - 20 - i * 23) % 70; return y >= 18 && y < 28 ? dustCard("nbY" + i, [p[0] + 0.2, 0.3, p[2]], 0.8, 0.6 * (1 - (y - 18) / 10), 2) : null; }) : []),
      (() => { const q = cardNearFocus(1, s, f, [hk[0], 1.4, hk[2]], 6, 0, 1.45); return noWine("nw1", q.pos, f, 140, 150, 226, q.k); })(),
      f >= 252 && f < 264 ? dustCard("yank", [hk[0] + 0.3, 0.3, hk[2]], 0.9, 0.8 * (1 - (f - 252) / 12), 2) : null,
      f >= 268 && f < 280 ? dustCard("heap", [hk[0] - 1.6, 0.5, hk[2] + 3.6], 1.0, 0.7 * (1 - (f - 268) / 12), 3) : null,
      f >= 383 && f < 400 ? sparkle("lab1", brickAt(bb, rtOf(-150), 0.44), f - 383, 0.28) : null,
    ),
    focus: f < 118 ? [bb[0], 1.55, bb[2]]                                                     // H1: his eyes (MS)
      : f < 358 ? follow(f, [[118, [hk[0], 1.4, hk[2]]], [269, [hk[0], 1.55, hk[2]], 40]])       // wide, then the glide in to Hank
      : follow(f, [[358, [bb[0], 1.55, bb[2]]], [445, brickAt(bb, rtOf(-150), 0.44), 43]]),      // CU, then the push lands on the label (insert)
    subj: f < 118 ? "brickBoy" : f < 358 ? "hank" : "brickBoy",
  };
};
lens(0, DOF_MS, 1); lens(118, DOF_WS, 1); lens(229, DOF_MS, 40); lens(358, DOF_CU, 1); lens(402, DOF_INSERT, 43);

// =====================================================================================================================
// SHOT 2 (445-582) = H5, the night kitchen (home base B), one slow track: the warning acted out. Opens on the brick over
// the jug (object match from the label), pulls back: Mum drops it in the gallon of water (it turns purple), carries the
// jug to the pantry, puts it in, the calendar above flips 1 -> 21, the doors close (object dissolve on the doors).
const MUM_C = (s: SetDef) => MK(s, "mumCounter");
SHOT_CAMS[2] = (s) => {
  const jug = MK(s, "jug"), m0 = MUM_C(s);
  const A = fit([body(m0, 0, 2.0, 0.42), [jug, 0, 0.5, 0.22]], 38, 8, 40, 0.84);            // Mum drops the brick in the gallon
  const C = fit([body([2.25, 0, -1.08], 0, 2.2, 0.55), [MK(s, "calendar"), -0.3, 0.3, 0.35]], 12, 6, 44, 0.86);   // pantry + calendar
  // v10.9 rule 3 (a list): ONE slow track from the jug to the pantry, each item centred 1.2 s+, peak ~20 px/frame
  return [K(445, F((f) => { const k = sm(f, 425, 600); return { pos: lerp3(A.pos, C.pos, k), look: lerp3(A.look, C.look, k), fov: lerp(A.fov, C.fov, k) }; }, 445, 0.0008))];
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
      C("kid20", MK(s, "kidTable"), flow(f, [
        [445, { expr: "neutral", facing: 1, look: 0.3, tilt: 2 }],
        [458, { expr: "stare", facing: 1, look: 0.5, tilt: 6, headTilt: 3 }, 8],            // leans in as the brick fizzes
        [488, { expr: "grin", facing: 1, look: 0.4, tilt: 3, armR: [[22, -2], [34, -20]] as A2, armRFront: true }, 8],   // it turned purple: points
        [506, { expr: "grin", facing: 1, look: 0.7, tilt: 1 }, 10],                           // follows Mum to the pantry
        [550, { expr: "stare", facing: 1, look: 0.8, headTilt: -3 }, 8],                      // the calendar flips
        [572, { expr: "grin", facing: 1, look: 0.5 }, 6],
      ]), { idx: 2 }),
    ],
    fx: fxs(f >= 456 && f < 470 ? sparkle("plop", add3(MK(s, "jug"), 0, 0.5, 0), f - 456, 0.22, "#d8b0f0") : null),
    focus: follow(f, [[445, add3(MK(s, "jug"), 0, 0.4, 0)], [530, (g) => { const w = along([m0, [2.25, 0, -1.08]], 0.075, 500, g); return [w.p[0], 1.5, w.p[2]]; }, 40], [570, add3(MK(s, "calendar"), 0, -0.4, 0), 24]]),   // all inside the one slow track
    subj: "mum20",
  };
};
lens(445, DOF_INSERT, 1); lens(500, DOF_MS, 40);

// =====================================================================================================================
// SHOT 3 (582-893) = H6, G3, H7 at day (home base A). H6 582-722: from the brick in Lou's hands (town3) pull back along
// the crowd at the fence (different depths, angled to the yard): they laugh together on "laughs"; town3 reads the brick:
// "Who puts a warning on juice?"; the black sedan rolls in behind them and stops by the gate. G3 715-745 rides the
// agent through the gate. H7 745-893 (fake-out): the agent at the brick table, the crowd lined up at the fence behind
// him grinning; he picks up a brick, reads it out loud, puts it back, tips his hat; the crowd's faces drop.
const CROWD = ["town1", "town2", "town3", "town4", "hank"];
/** v10.9: the crowd lines the fence in a tighter, depth-staggered row (world x 5.4..6.6 on the road side of the fence) */
const CROWD_P: V3[] = [[6.5, 0, -4.8], [5.5, 0, -4.0], [6.55, 0, -3.1], [5.4, 0, -2.2], [6.3, 0, -1.3]];
/** "The neighbors line the fence to watch": from 700 they hurry down the road to the fence beside the brick table */
const CROWD_F: V3[] = [[6.7, 0, -11.3], [6.1, 0, -11.9], [6.75, 0, -12.5], [6.15, 0, -13.1], [6.6, 0, -13.7]];
const BB3: V3 = [11.6, 0, -12.1];
const crowdWalk = (i: number, f: number) => along([CROWD_P[i], CROWD_F[i]], 0.14, 712 + i * 3, f);
const agentWalk = (s: SetDef): V3[] => [MK(s, "agentOut"), [7.3, 0, -8.8] as V3, MK(s, "agentTable")];
SHOT_CAMS[3] = (s) => {
  const h6a = fit([body(CROWD_P[1]), body(CROWD_P[2]), body(CROWD_P[3])], 100, 12, 42, 0.86);   // Lou reads the brick, neighbours laugh
  const h6 = fit(CROWD_P.map((p) => body(p)), 100, 14, 44, 0.88);                                    // the whole fence + the sedan behind
  const h7 = fit([body(MK(s, "agentTable"), 0, 2.05, 0.4), body(BB3, 0, 2.05, 0.4)], 92, 8, 50, 0.86);   // fake-out: agent and Brick Boy across the table, the crowd at the fence beyond
  const S6a = F(() => h6a, 582, 0.0018), S6 = F(() => h6, 668, 0.0016), S7 = F(() => h7, 718, 0.0012, [[866, 0.012, 27]]);
  return [K(582, S6a), K(640, glideTo(S6a, 640, S6, 668), 1), K(718, S7, 1, true)];   // hard cut 3 to the table (9 m away); the push on "puts it back" carries into the dissolve
};
SHOT_ACTS[3] = (f, s) => {
  const aw = along(agentWalk(s), 0.075, 702, f), carU = f < 668 ? -1 : sm(f, 668, 700) * 0.999 + (f >= 700 ? 0.001 : 0);
  const crowd = CROWD.map((who, i) => {
    const cw = crowdWalk(i, f), ty = MK(s, "agentTable");
    const lookAgent = f >= 700 ? -1 : 1;
    if (cw.moving) return C(who, cw.p, pose(null, { expr: "grin", mode: "walk", phase: ph(f + i * 3, 8), facing: screenSide(3, s, f, cw.d[0], cw.d[1]), ...(who === "town3" ? { armR: AR.carryR, armRFront: true, propR: "grapeBrick" } : {}) }), { idx: 10 + i });
    return C(who, cw.p, flow(f, [
      [582, { expr: "grin", facing: 1, ...(who === "town3" ? { armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1 } : {}) }],
      [592 + i, { ...laughP(f, 592, i), facing: 1, armR: i % 2 ? AR.pointR : AR.hipR, armRFront: true, ...(who === "town3" ? { armR: AR.liftHiR, propR: "grapeBrick", propK: 1 } : {}) }, 3],   // the whole town laughs
      [622, who === "town3" ? { expr: "grin", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, mouth: talk(f, 625, 660) } : { ...laughP(f, 622, i + 2), facing: 1 }, 4],
      [690 + i * 2, { expr: "stare", facing: lookAgent, look: -0.5 }, 6],                                                       // the sedan
      [772 + i * 2, i === 4 ? { expr: "grin", facing: -1, look: -0.3, armR: AR.pointR, armRFront: true } : i % 2 ? { expr: "grin", facing: -1, tilt: 4 * (i === 1 ? 1 : -1), headTilt: 4 } : { ...laughP(f, 772, i), facing: -1 }, 6],   // "...get arrested": Hank points, the others nudge and snicker
      [790 + i, { expr: "grin", facing: -1, look: -0.4, ...(i % 2 ? { armR: AR.hipR, armL: AR.hipL } : {}) }, 4],                    // here comes the arrest
      [878 + i, { expr: "dismay", facing: -1, sweat: i === 4 ? 1 : 0 }, 4],                                                       // he put it back
    ]), { idx: 10 + i });
    void ty;
  });
  return {
    ctl: { agentCar: carU, bricks: 21, press: 0, juice: 0 },
    cast: [
      ...crowd,
      C("brickBoy", BB3, flow(f, [
        [582, { expr: "calm", facing: -1, armR: AR.hipR, armL: AR.hipL }],
        [700, { expr: "stare", facing: -1, look: -0.6 }, 6],
        // remake: he keeps working while the agent walks up (restacks the bricks: reach, lift, set down), cool as ever
        [720, { expr: "calm", facing: -1, armR: AR.downR, armRFront: true }, 10],
        [734, { expr: "calm", facing: -1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],
        [748, { expr: "calm", facing: -1, armR: [[24, 12], [40, 18]] as A2, armRFront: true, propR: "grapeBrick", propK: 0, tilt: 4 }, 10],
        [760, { expr: "sly", facing: -1, look: -0.5, armR: AR.downR, armRFront: true }, 8],
        [776, { expr: "sly", facing: -1, look: -0.5, armR: AR.hipR, armL: AR.hipL, headTilt: 3 }, 10],
        [836, { expr: "calm", facing: -1, look: -0.6, armR: AR.hipR, armL: AR.hipL, headTilt: -3 }, 8],
        [880, { expr: "smug", facing: -1, armR: AR.hipR, armL: AR.hipL }, 6],
      ]), { idx: 1 }),
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
    focus: f < 718 ? follow(f, [[582, add3(CROWD_P[2], 0, 1.5, 0)], [668, add3(CROWD_P[2], 0, 1.4, 0), 28]])   // Lou (MS), then the whole fence (FS)
      : follow(f, [[718, add3(lerp3(BB3, MK(s, "agentTable"), 0.4), 0, 1.5, 0)], [893, add3(MK(s, "brickStack"), 0, 0.1, 0), 27]]),   // Brick Boy (near) and the agent across the table both read; the push lands on the bricks   // the agent; the push on "puts it back" lands on the bricks
    subj: f < 718 ? "town3" : "agent",
  };
};
lens(582, DOF_MS, 1); lens(640, DOF_FS, 28); lens(718, 6, 1); lens(866, DOF_MS, 27);

// =====================================================================================================================
// SHOT 4 (893-958) = H8, Washington (hard cut 2): the lawyer winds up and slams LEGAL on the ruling ("legal"), push to
// the paper (object dissolve to the kitchen shelf).
SHOT_CAMS[4] = (s) => { const p = MK(s, "paper");
  void p; return [K(889, F(() => ({ pos: [0.35, 1.42, 2.3] as V3, look: [0, 1.0, -0.4] as V3, fov: 40 }), 889, 0.002, [[936, 0.02, 22]]))]; };   // object dissolve in (table bricks -> the ruling), axial push on the slam
SHOT_ACTS[4] = (f, s) => ({
  ctl: { fan: 1 },
  cast: [C("lawyer", MK(s, "lawyer"), flow(f, [
    [893, { expr: "stern", facing: 1, armR: AR.holdR, armRFront: true, propR: "legalStamp", propK: 1 }],
    [912, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1, tilt: -4 }, 8],   // wind-up (held)
    [934, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1, tilt: 6 }, 2],     // SLAM
  ]), { idx: 1 })],
  fx: fxs(legalMark(add3(MK(s, "paper"), 0, 0.01, 0.05), f, 935), f >= 935 && f < 945 ? bang(add3(MK(s, "paper"), 0.25, 0.25, 0), f - 935) : null),
  focus: follow(f, [[893, [0, 1.5, -1.05]], [950, MK(s, "paper"), 14]]),   // her eyes; the push on the slam lands on the ruling
  subj: "lawyer",
});
KICKS.push([935 / 30, 0.6]); lens(893, DOF_MS, 1); lens(936, DOF_INSERT, 14);

// =====================================================================================================================
// SHOT 5 (958-1485) = H9-H12, the kitchen. H9 958-1104: from the shelf (object match with the stamped paper) the bricks
// pop off one by one ("fly off the shelves"); pull back as the serviceman steps in the door, sets up the jug, steam puff
// (time jump), corks a bottle. G4 1100-1130 glide to Mum. H10 1130-1282 the explanation (deep-blue night): "That's the
// trick" (taps the brick), NO-wine stamp, the 200 GALLONS counter while she counts on her fingers; the kid listens. G5
// 1275-1300 rides Mum to the pantry. H11 1300-1390 doors open on the jugs, the calendar flips to 21, she shrugs.
// Hard cut 3 at 1392: the kid at the stove holds up the CAKE MIX box, winks on "350"; push to the box (object dissolve).
const SVC = (s: SetDef): V3[] => [MK(s, "serviceIn"), [2.4, 0, 0.6], MK(s, "serviceJug")];
const MUM5: V3 = [-0.55, 0, -1.08];
const MUM_P: V3 = [1.5, 0, -1.08], KID5: V3 = [-1.25, 0, -0.45], KIDC: V3 = [1.95, 0, -0.72];
SHOT_CAMS[5] = (s) => {
  const shelf = MK(s, "shelf"), SJ = MK(s, "serviceJug");
  const h9a = fit([[shelf, -0.05, 0.25, 0.75], body(MUM5, 0.9, 2.0, 0.3)], 10, 4, 40, 0.86);                         // bricks fly off the shelf
  const h12 = fit([body(SJ), body(MUM5), body(KID5, 0, 1.6, 0.3)], 8, 8, 46, 0.88);                                  // the serviceman, Mum, the kid
  const h13 = fit([body(MUM5, 0, 2.0, 0.4), body(KID5, 0, 1.6, 0.4)], 15, 6, 42, 0.82);                              // explanation two-shot
  const h11 = fit([body(MUM_P), body(KIDC, 0, 1.6, 0.32), [[2.7, 0, -1.9], 0, 2.95, 0.75]], -6, 4, 42, 0.86);         // pantry + calendar, the kid walks in
  const bx: V3 = [KIDC[0] + 0.2, 1.0, KIDC[2] + 0.15];
  const S9a = F(() => h9a, 958, 0.0018), S12 = F(() => h12, 1040, 0.0014), S13 = F(() => h13, 1140, 0.0011), S11 = F(() => h11, 1315, 0.0012);
  return [
    K(958, S9a),
    K(1000, glideTo(S9a, 1000, S12, 1040), 1),          // pull back as the serviceman comes in (mostly axial)
    K(1100, glideTo(S12, 1100, S13, 1140), 1),          // ease in to Mum and the kid
    K(1275, glideTo(S13, 1275, S11, 1315), 1),          // follow Mum to the pantry
    K(1452, glideTo(S11, 1452, () => { const e = S11(1452); return { pos: lerp3(bx, e.pos, 0.42), look: bx, fov: e.fov ?? 42 }; }, 1490), 1),   // push (mostly axial) to the cake-mix box
  ];
};
SHOT_ACTS[5] = (f, s) => {
  const sv0 = along(SVC(s), 0.09, 1003, f), sv1 = along([MK(s, "serviceJug"), [2.4, 0, 0.6], [3.6, 0, 1.3], [5.8, 0, 1.3]], 0.065, 1104, f), sv = f < 1104 ? sv0 : sv1, mw = along([MUM5, MUM_P], 0.11, 1277, f), kw = along([KID5, KIDC], 0.05, 1330, f);
  const bottle = f >= 1080;
  return {
    ctl: { shelf: f < 964 ? 6 : 6 - Math.min(6, Math.floor((f - 964) / 5)), jugWater: f >= 1030 && f < 1080 ? 1 : 0, jugFill: f >= 1080 ? 0 : sm(f, 1046, 1066), jugHide: f < 1030 || f >= 1080 ? 1 : 0,
      cupboard: f < 1300 ? 0 : sm(f, 1306, 1320), day: f < 1300 ? 1 : dayFlip(f, 1322, 1346), jugGlow: 0 },
    cast: [
      ...(f >= 1000 && f < 1200 ? [sv.moving ? C("service", sv.p, pose(null, { expr: "beam", mode: "walk", phase: ph(f, 12), facing: screenSide(5, s, f, sv.d[0], sv.d[1]), ...(f < 1104 ? { armR: AR.carryR, armRFront: true, propR: "jug" } : { armR: AR.carryR, armRFront: true, propR: "wineBottle", propK: 1 }) }), { idx: 5 })   // walks in with the jug, out with the bottle
        : C("service", sv.p, flow(f, [
          [1030, { expr: "smile", facing: -1, armR: AR.downR, armRFront: true }],
          [1040, { expr: "smile", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick" }, 8],          // drops a brick in
          [1048, { expr: "proud", facing: -1, armR: AR.downR, armRFront: true }, 3],
          [1082, { expr: "beam", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "wineBottle", propK: 1 }, 6],  // later: corked
        ]), { idx: 5 })] : []),
      C("mum20", mw.moving ? mw.p : f >= 1277 ? mw.p : MUM5, mw.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 11), facing: 1 }) : flow(f, [
        [958, { expr: "joy", facing: 1, look: 0.6, headTilt: -5 }],                                      // watches the bricks fly off the shelf
        [974, { expr: "joy", facing: 1, look: 0.85, headTilt: -2 }, 10],
        [988, { expr: "grin", facing: 1, look: 0.6, armR: [[22, -4], [10, -22]] as A2, armRFront: true, armL: [[-22, -4], [-10, -22]] as A2, armLFront: true }, 8],   // claps once: sold out
        [1006, { expr: "smile", facing: 1, look: 0.9 }, 10],                                           // the serviceman comes in
        [1050, { expr: "smile", facing: 1, look: 0.8, headTilt: 5 }, 8],                               // nods along: "set up the jug"
        [1084, { expr: "smile_closed", facing: 1, look: 0.7, headBack: 0.3 }, 8],                      // smells the bottle
        [1104, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 8],
        [1110, { expr: "smug", facing: 1, armR: AR.slapR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 3],          // "That's the trick."
        [1135, { expr: "stern", facing: 1, armR: [[26, -6], [36, -30]] as A2, armRFront: true }, 6],                                  // "bans selling wine"
        [1181, { expr: "eureka", facing: 1, armR: [[24, -10], [30, -40]] as A2, armRFront: true, armL: [[-24, -8], [-26, -36]] as A2, armLFront: true }, 8],   // counts it out
        [1230, { expr: "joy", facing: 1, armR: [[30, -8], [44, -34]] as A2, armRFront: true, armL: [[-30, -8], [-44, -34]] as A2, armLFront: true }, 8],
        [1300, { expr: "sly", facing: 1, armR: [[26, -10], [46, -16]] as A2, armRFront: true }, 6],                                   // opens the doors
        [1362, { expr: "smug", facing: -1, armR: AR.shrugR, armL: AR.shrugL, armRFront: true, armLFront: true, headTilt: 6 }, 8],     // "well, that's your juice"
      ]), { idx: 1 }),
      C("kid20", kw.p, kw.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 10), facing: screenSide(5, s, f, kw.d[0], kw.d[1]), armR: AR.holdR, armRFront: true, propR: "cakeBox" }) : f < 1392 ? flow(f, [
          [958, { expr: "stare", facing: 1, look: 0.7, headTilt: -5 }],                                  // looks up at the flying bricks
          [976, { expr: "grin", facing: 1, look: 0.8, headTilt: -2 }, 8],
          [990, { expr: "grin", facing: 1, look: 0.6, armR: [[24, -10], [30, -40]] as A2, armRFront: true }, 8],   // cheers
          [1006, { expr: "stare", facing: 1, look: 0.9 }, 10],                                           // the stranger with the jug
          [1056, { expr: "stare", facing: 1, look: 0.9, tilt: 5 }, 10],                                  // leans in to see
          [1086, { expr: "grin", facing: 1, look: 0.8, armR: AR.pointR, armRFront: true }, 8],           // the bottle!
          [1135, { expr: "stare", facing: 1, look: -0.4 }, 6],
          [1196, { expr: "eureka", facing: 1, look: 0.5, armR: [[24, -10], [30, -40]] as A2, armRFront: true }, 8],   // counts along
          [1230, { expr: "grin", facing: 1 }, 6]])
        : flow(f, [[1392, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox" }], [1463, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox", headTilt: 6, look: 0.6 }, 4]]), { idx: 2 }),
    ],
    fx: fxs(
      ...[0, 1, 2, 3, 4, 5].map((i) => { const a = 964 + i * 5; return f >= a && f < a + 12 ? sparkle("sh" + i, [-0.1 + i * 0.22, 1.66, -1.95], f - a, 0.22, "#e8c8ff") : null; }),
      f >= 1070 && f < 1092 ? dustCard("steam", [1.0, 1.3, -1.3], 1.6, 0.85 * Math.sin(Math.PI * (f - 1070) / 22), 5) : null,
      (() => { const q = cardNearFocus(5, s, f, [MUM5[0], 1.5, MUM5[2]], 2.6, 0.36, 0.7); return noWine("nw5", q.pos, f, 1132, 1146, 1178, q.k * 0.85); })(),
      (() => { const q = cardNearFocus(5, s, f, [MUM5[0], 1.5, MUM5[2]], 2.2, 0.1, 0.6); return gallons("gal", q.pos, f, 1180, 1276, q.k); })(),
      f >= 1466 && f < 1484 ? sparkle("box350", [KIDC[0] + 0.2, 1.05, KIDC[2] + 0.2], f - 1466, 0.25, "#ffd27a") : null,
    ),
    focus: follow(f, [
      [958, lerp3(MK(s, "shelf"), [MUM5[0], 1.5, MUM5[2]], 0.5)],                                                        // the shelf and Mum in front of it both read
      [1040, (g) => { const w = along(SVC(s), 0.09, 1003, g); return [w.p[0], 1.5, w.p[2]]; }, 40],                     // pull back to the serviceman
      [1140, [MUM5[0], 1.5, MUM5[2]], 40],                                                                               // ease in to Mum (explanation)
      [1315, (g) => { const w = along([MUM5, MUM_P], 0.11, 1277, g); return [w.p[0], 1.5, w.p[2]]; }, 40],              // follow her to the pantry
      [1490, [KIDC[0] + 0.2, 1.0, KIDC[2] + 0.15], 38],                                                                  // the push lands on the cake-mix box
    ]),
    subj: f < 1000 ? "mum20" : f < 1100 ? "service" : f < 1405 ? "mum20" : "kid20",
  };
};
lens(958, 9, 1); lens(1000, DOF_FS, 40); lens(1100, DOF_MS, 40); lens(1275, DOF_MS, 40); lens(1452, DOF_INSERT, 38);

// =====================================================================================================================
// SHOT 6 (1485-1810) = H13-H15, the payoff at golden light (home base A). H13 1485-1552: from a grape cluster (object
// match with the cake-mix box) crane up: new vine rows rise out of every field ("almost double"). G6 1545-1575 down to
// Hank; H14 1575-1640 he kneels and plants a vine back. G7 1630-1665 rides the lawyer's walk to the gate. H15 1665-1810:
// she stands beside Brick Boy, stamps LEGAL on his brick on "lawyer"; the debate line; he lifts the brick until it fills
// half the frame (sparkle + glint); object dissolve to the glowing jug.
const LAW_W: V3[] = [[4.0, 0, -3.0], [6.0, 0, -8.6], [7.69, 0, -9.0]];
SHOT_CAMS[6] = (s) => {
  const row: V3 = [8.75, 0, 2.0], hk = HANK_Y(s), bb = MK(s, "bbGate");
  void row; const h13 = fit([[hk, 0.2, 1.45, 0.55]], 120, 20, 40, 0.86);                // close on Hank's hands and the vine (object match with the box)
  const h14 = fit([body(hk, 0, 1.6, 0.85)], 120, 20, 42, 0.86);                       // high over Hank replanting, new rows all round
  const h15 = { pos: [13.3, 1.75, -10.3] as V3, look: [8.2, 1.25, -9.75] as V3, fov: 42 };
  const brick: V3 = [bb[0], 1.27, bb[2] - 0.32], endLook: V3 = [bb[0] - 0.05, 1.45, bb[2] - 0.22];
  const S13 = F(() => h13, 1485, 0.001), S14 = F(() => h14, 1552, 0.0022), S15 = F(() => h15, 1630, 0.0012);
  void brick;
  return [
    K(1485, S13),
    K(1512, glideTo(S13, 1512, S14, 1552), 1),                                             // pull straight back: new rows rise all round
    K(1630, S15, 1, true),                                                                 // hard cut 4: the gate, the lawyer walks in
    K(1752, glideTo(S15, 1752, () => ({ pos: [endLook[0] + 2.1, endLook[1] + 0.1, endLook[2] - 0.05] as V3, look: endLook, fov: 36 }), 1808), 1),   // push to Brick Boy + the brick
  ];
};
SHOT_ACTS[6] = (f, s) => {
  const lwk = along(LAW_W, 0.085, 1560, f), bb = MK(s, "bbGate");
  return {
    ctl: { spread: sm(f, 1495, 1548), bricks: 21, agentCar: 1, press: 0 },
    cast: [
      C("hank", HANK_Y(s), flow(f, [
        [1485, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank" } as P],
        // remake: he tucks the soil round the new vine (pat, pat, pat) before he pushes it in on "back"
        [1532, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank", armL: [[-14, 22], [-4, 48]] as A2, armLFront: true, tilt: 6 } as P, 8],
        [1546, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank", armL: [[-14, 16], [-6, 36]] as A2, armLFront: true, tilt: 4 } as P, 8],
        [1558, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank", armL: [[-14, 22], [-4, 48]] as A2, armLFront: true, tilt: 6 } as P, 8],
        [1572, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank", armL: [[-14, 16], [-6, 36]] as A2, armLFront: true, tilt: 4 } as P, 8],
        [1588, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[18, 28], [20, 54]] as A2, armRFront: true, propR: "vineYank", tilt: 8 } as P, 10],   // pushes it in
        [1612, { expr: "pained", facing: -1, mode: "kneel", kneelK: 1, armR: [[18, -20], [6, -46]] as A2, armRFront: true, sweat: 1 } as P, 10],   // wipes his brow
        [1626, { expr: "pained", facing: -1, mode: "kneel", kneelK: 1, armR: AR.hipR, sweat: 1 } as P, 8],
      ]), { idx: 2 }),
      C("brickBoy", bb, flow(f, [
        [1485, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick" }],
        [1650, { expr: "smug", facing: -1, look: -0.5, armR: AR.carryR, armRFront: true, propR: "grapeBrick", armL: [[-22, -18], [-8, -54]] as A2, armLFront: true }, 10],   // tips his hat to the lawyer
        [1666, { expr: "smug", facing: -1, look: -0.4, armR: AR.carryR, armRFront: true, propR: "grapeBrick" }, 10],
        [1684, { expr: "proud", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 10],                       // holds it out for the stamp
        [1744, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1, armL: AR.shrugL, armLFront: true, headTilt: 5 }, 8],   // "a criminal?" shrug
        [1764, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 12],   // lifts it to us
        [1784, { expr: "smug", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1, armL: [[-12, 0], [14, -8]] as A2, armLFront: true, headTilt: 4 }, 8],   // taps the label: "read the law"
      ]), { idx: 1 }),
      lwk.moving ? C("lawyer", lwk.p, pose(null, { expr: "proud", mode: "walk", phase: ph(f, 11), facing: screenSide(6, s, f, lwk.d[0], lwk.d[1]), armR: AR.carryR, armRFront: true, propR: "legalStamp" }), { idx: 3 })
        : C("lawyer", lwk.p, flow(f, [
          [1600, { expr: "proud", facing: 1, armR: AR.carryR, armRFront: true, propR: "legalStamp" }],
          [1682, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1 }, 8],
          [1700, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1 }, 2],   // stamps his brick
          [1730, { expr: "smug", facing: 1, armR: [[16, -14], [4, -40]] as A2, armRFront: true, propR: "legalStamp", propK: 1, mouth: f >= 1736 && f < 1748 ? "o" : undefined }, 8],   // blows on the stamp
          [1756, { expr: "smug", facing: 1, armR: AR.carryR, armRFront: true, propR: "legalStamp", armL: AR.hipL }, 10],
        ]), { idx: 3 }),
    ],
    fx: fxs(
      f >= 1700 && f < 1712 ? bang([bb[0] - 0.3, 1.5, bb[2] + 0.1], f - 1700) : null,
      f >= 1770 && f < 1792 ? sparkle("glint", [bb[0], 1.38, bb[2] - 0.32], f - 1770, 0.4) : null,
      f >= 1772 ? glowBurst("pay" + Math.round(lin(f, 1772, 1810) * 6), [bb[0] - 0.1, 1.27, bb[2] - 0.32], 1.2, 0.5 * lin(f, 1772, 1790), "255,226,170") : null,
    ),
    focus: f < 1630 ? follow(f, [[1485, add3(HANK_Y(s), 0, 0.9, 0)], [1552, add3(HANK_Y(s), 0, 1.2, 0), 40]])        // his hands and the vine (insert), then the pull back
      : follow(f, [[1630, (g) => { const w = along(LAW_W, 0.085, 1560, g); return [w.p[0], 1.5, w.p[2]]; }], [1808, [bb[0], 1.35, bb[2] - 0.3], 56]]),   // the lawyer walks in; the push lands on the brick
    subj: f < 1630 ? "hank" : f < 1662 ? "brickBoy" : f < 1752 ? "lawyer" : "brickBoy",
  };
};
lens(1485, DOF_INSERT, 1); lens(1512, DOF_WS, 40); lens(1552, DOF_FS, 30); lens(1630, DOF_MS, 1); lens(1752, DOF_INSERT, 56);

// =====================================================================================================================
// SHOT 7 (1810-1930) = H16, the ending (calm, callback prop): the pantry jugs glow purple, the calendar reads 21, Mum
// pours herself a glass and sips with a calm smile; the camera pushes into the glowing jug on "And it all started...".
const MUM7: V3 = [1.1, 0, -1.05];
SHOT_CAMS[7] = (s) => {
  const h16 = fit([body(MUM7, 0, 2.0, 0.4), [[2.7, 0, -1.9], 0.1, 2.3, 0.7]], -10, 4, 42, 0.86), j: V3 = [2.7, 0.95, -1.9];
  const S16 = F(() => h16, 1810, 0.0018);
  return [K(1810, S16), K(1852, glideTo(S16, 1852, () => ({ pos: [j[0] - 0.25, j[1] + 0.12, j[2] + 0.75] as V3, look: j, fov: 40 }), 1930), 1)];   // push into the glowing jug
};
SHOT_ACTS[7] = (f, s) => ({
  ctl: { cupboard: 1, jugGlow: 0.6 + 0.4 * sm(f, 1810, 1860), day: 21, shelf: 0, jugHide: 1 },
  cast: [C("mum20", MUM7, flow(f, [
    [1810, { expr: "calm", facing: 1, armR: [[22, 10], [34, -6]] as A2, armRFront: true, propR: "juiceGlass" }],
    [1858, { expr: "smile_closed", facing: 1, armR: [[26, -4], [16, -30]] as A2, armRFront: true, armRTop: true, propR: "juiceGlass", headBack: 0.3 }, 10],   // sips
    [1884, { expr: "smug", facing: 1, armR: [[22, 10], [34, -6]] as A2, armRFront: true, propR: "juiceGlass", look: 0.4 }, 10],
  ]), { idx: 1 })],
  fx: [],
  focus: follow(f, [[1810, [MUM7[0], 1.5, MUM7[2]]], [1930, [2.7, 0.95, -1.9], 78]]),   // Mum; the push into the glowing jug carries the focus with it
  subj: f < 1880 ? "mum20" : null,
});
lens(1810, DOF_MS, 1); lens(1852, DOF_INSERT, 78);
