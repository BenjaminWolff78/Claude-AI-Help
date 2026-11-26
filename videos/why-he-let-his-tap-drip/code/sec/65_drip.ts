// =====================================================================================================================
// "Why He Let His Tap Drip All Night in the Freeze" (2026-11-25), master prompt v30. Plan: p13/checkpoints/CP2_dripping_tap_plan.md
// One connected set (dripset): the old man's kitchen (home base), the side yard with the picket fence, the neighbor's kitchen
// 6 m across it, the street. Hard cuts: 72 (the flash-forward), 970 (the thaw), 1371 (the ketchup insert), 1461 (his wall
// sliced). Everything else is one camera move into the next: whips (139, 786, 850), the ride across the side yard through
// both kitchen windows (272-306 and 1730-1790), cranes out of and back into his window; dissolves only in place (482, 546,
// 700, 1716: the same framing, a new time).
const cam3 = (pos: V3, look: V3, fov: number) => ({ pos, look, fov });
const OLD = "drOld", NBR = "drNbr", WOM = "drWoman", SHV = "drShovel", PLB = "drPlumber";
const FL = DR0.FLR, CTt = DR0.CT;
const OLD_AT: V3 = [3.95, FL, -3.62];            // the old man at his sink (faces the window, -x)
const NBR_AT: V3 = [-3.88, FL, -3.55];           // the neighbor at his sink (faces his window, +x)
const NBR_FN: V3 = [-0.42, 0, -2.6];             // the neighbor leaning on the fence (his side)
const TBL_SIT: V3 = [5.4, FL, -4.05];            // the old man sitting at his table (on the chair, facing +z)
const ROCK_SIT: V3 = [DR0.ROCKER[0] - 0.05, FL, DR0.ROCKER[2]];
/** the tip of his tap lever (the hand inserts hold it) */
const leverTip = (k: number): V3 => { const a = 0.9 * k; return [3.12 + 0.15 * Math.sin(a), CTt + 0.2, -3.9 + 0.15 * Math.cos(a)]; };
/** a stick arm for the set (0 or 1): shoulder S, hand H, a small elbow drop */
const armC = (i: number, S: V3, Hh: V3, bend = 0.05): Ctl => ({ [`arm${i}`]: 1, [`arm${i}sx`]: S[0], [`arm${i}sy`]: S[1], [`arm${i}sz`]: S[2], [`arm${i}hx`]: Hh[0], [`arm${i}hy`]: Hh[1], [`arm${i}hz`]: Hh[2], [`arm${i}bend`]: bend });
const sec = (f: number) => f / 30;

/** a smooth camera travel through waypoints (Catmull-Rom, chord-length timed so the speed is even), eased in and out */
const crPt = (pts: V3[], u: number): V3 => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]) || 1e-6), T = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * T, i = 0; while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
  const t = Math.min(1, d / L[i]), p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  return [0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)) as V3;
};
const crMove = (from: (f: number) => Shot, a: number, to: (f: number) => Shot, b: number, W: V3[], Lk: V3[]) => (f: number): Shot => {
  const s0 = from(a), e = to(f), u = sm(f, a, b);
  return { pos: crPt([s0.pos, ...W, e.pos], u), look: crPt([s0.look, ...Lk, e.look], u), fov: lerp(s0.fov ?? 40, e.fov ?? 40, u), roll: 0 };
};
/** a framing frozen at frame f0 (the start of a dissolve in place: both sides of it hold the same picture) */
const frozen = (g: (f: number) => Shot, f0: number) => (_f: number): Shot => g(f0);
/** the night look outside: snowing, frost on the glass */
const NIGHT: Ctl = { snow: 1, frost: 0.6 };
const THAW: Ctl = { snow: 0, frost: 0.05, thaw: 0.7 };

// ================================================= SHOT 1 (0-72) HOOK: close on his tap at night. His hand turns the lever (4-16),
// the first drop lets go at 21 ("drip"), a second at 46, the frost creeps over the window behind (the neighbor's lit window
// across the yard shows through it). The push opens wide on the tap + bucket and lands close on the spout.
const c1o = F(() => cam3([4.6, 1.64, -3.18], [3.36, 1.33, -3.9], 50), 0, 0.001);
const c1 = F(() => cam3([3.98, 1.5, -3.6], [3.38, 1.33, -3.9], 50), 56, 0.0012);
SHOT_CAMS[1] = () => [K(0, c1o, 1, true), K(2, glideTo(c1o, 2, c1, 56), 1), K(56, c1, 1)];
SHOT_ACTS[1] = (f) => {
  const tap = 0.35 * sm(f, 4, 16), tip = leverTip(tap), back = sm(f, 30, 48);
  const hand: V3 = lerp3(tip, [3.75, 1.6, -3.25], back);
  return { cast: [], subj: null, focus: [3.42, 1.45, -3.9],
    ctl: { ...NIGHT, frost: 0.22 + 0.5 * sm(f, 18, 70), tapO: tap, dripO: 1, dripT0: sec(21), dripRate: 1 / 0.85, bucketK: 0.12, ...(back < 0.98 ? armC(0, [3.78, 1.68, -3.22], hand, 0.04) : {}) } };
};
lens(0, DOF_INSERT);

// ================================================= SHOT 2 (72-139) HARD CUT, the flash-forward (the thaw): the neighbor's east wall
// sprays into the side yard, the houses across the street spray, the old man's yellow wall is dry and he sips from a mug in his
// yard; the neighbor (red jacket) stares at his wall, back to the lens, then turns. A slow push down the side yard.
const c2 = F(() => cam3([1.55, 1.62, -6.4], [-0.6, 1.2, 6.0], 52), 72, 0.0045);
// the whip back to "now" (132-146): round into the neighbor's kitchen window, onto his -20 thermometer
const c3a = F(() => cam3([-3.62, 2.1, -4.05], [-3.06, 2.15, -4.4], 44), 146, 0.0016);
const whip23 = crMove(c2, 130, c3a, 146, [[-0.6, 1.8, -5.0], [-2.3, 1.95, -4.1]], [[-2.0, 1.6, 0.0], [-3.0, 2.0, -4.6]]);
SHOT_CAMS[2] = () => [K(72, c2, 1, true), K(130, whip23, 1)];
SHOT_ACTS[2] = (f) => {
  const g = f - 72, turn = sm(f, 96, 108);
  const cast: CastPlace[] = [
    C(OLD, [2.05, 0, -1.6], flow(f, [[72, { expr: "calm", facing: -0.6, armR: [[20, 14], [26, -8]], propR: "teaMug" }], [104, { expr: "smug", facing: -0.6, armR: [[18, 6], [14, -28]], propR: "teaMug", headTilt: -4 }, 8], [124, { expr: "smug", facing: -0.5, armR: [[20, 14], [26, -8]], propR: "teaMug" }, 8]]), { idx: 1 }),
    C(NBR, [-1.75, 0, 0.6], flow(f, [[72, { expr: "shock", back: true, facing: 0.4, armR: [[24, -10], [30, -40]], armL: [[-24, -10], [-30, -40]] }], [100, { expr: "aghast", facing: 0.6, armR: [[26, -8], [40, -36]], armL: [[-26, -8], [-40, -36]] }, 8]]), { idx: 2 }),
    C(WOM, [-1.4, 0.06, 16.1], { ...pose(null, { expr: "shock", facing: 0.3, armR: [[18, 10], [10, -12]], propR: "coffeeCup" }) }, { idx: 3 }),
    C(SHV, [1.2, 0.06, 15.8], { ...pose(null, { expr: "shock", facing: -0.3, armR: [[26, 14], [30, 40]], propR: "shovel", propK: 1 }) }, { idx: 4 }),
  ];
  void turn; void g;
  return { cast, subj: null, focus: [-1.5, 1.0, 0.5], ctl: { ...THAW, streetSpray: sm(f, 72, 80), glassN: 1 - sm(f, 134, 140) } };
};
lens(72, DOF_WS, 1);

// ================================================= SHOT 3 (139-284) the neighbor's kitchen at night: the -20 thermometer (146-176,
// "says minus 20"), pull back to him in the red jacket at his sink (176-214); he cranks both taps shut with a pipe wrench, leaning
// into it (232-262, "shuts every tap tight"), and nods. Then the camera rides out of his window (272).
const c3b = FS(() => cam3([-5.1, 1.62, -2.05], [-3.45, 1.3, -3.85], 46), 206, 0.0022, 0.0022);
SHOT_CAMS[3] = () => [K(139, whip23, 1), K(146, c3a, 1), K(176, glideTo(c3a, 176, c3b, 206, 0.15), 1)];
SHOT_ACTS[3] = (f) => {
  const t1 = sm(f, 232, 246), t2 = sm(f, 250, 262), onW = f >= 226 && f < 266;
  const wz = f < 248 ? -4.1 : -3.7, wa = f < 248 ? -1.2 * t1 : -1.2 * t2;
  const cast: CastPlace[] = [C(NBR, NBR_AT, flow(f, [[139, { expr: "determined", facing: 0.7, armR: [[24, 10], [30, 30]] }],
    [222, { expr: "determined", facing: 0.8, tilt: 6, armR: [[30, -4], [52, -10]], armRFront: true }, 8],
    [234, { expr: "strain", facing: 0.8, tilt: 10, armR: [[30, 6], [54, 14]], armL: [[22, 0], [44, 4]], armRFront: true, armLFront: true }, 6],
    [248, { expr: "strain", facing: 0.8, tilt: 9, armR: [[30, 0], [50, 4]], armL: [[22, -4], [42, 0]], armRFront: true, armLFront: true }, 4],
    [264, { expr: "proud", facing: 0.6, tilt: 2, armR: [[22, 12], [28, 30]], headTilt: 5 }, 8]]), { idx: 1 })];
  return { cast, focus: f < 176 ? [-3.06, 2.15, -4.4] : [-3.5, 1.45, -3.85],
    ctl: { ...NIGHT, frost: 0.3, glassN: sm(f, 139, 144), tapN1: t1, tapN2: t2, wrenchN: onW ? 1 : 0, wrenchZ: wz, wrenchA: wa, lampN: 1 } };
};
lens(139, DOF_CU, 6); lens(176, DOF_MS, 30);

// ================================================= SHOT 4 (284-392) the ride (272-306): out of the neighbor's window, over the fence,
// to the old man's window; through it he opens his tap to a slow drip (300-318, "opens his kitchen tap") and slides the bucket under
// it (356-378, "right into a bucket"). The window frame frames him.
const c4 = FS(() => cam3([2.1, 1.85, -3.28], [3.95, 1.45, -3.82], 46), 306, 0.0022, -0.0018);
const ride34 = crMove(c3b, 270, c4, 306, [[-4.25, 1.9, -4.3], [-3.0, 1.88, -4.05], [-1.6, 1.98, -3.95], [0.0, 2.05, -3.85], [1.4, 1.92, -3.5]],
  [[-3.0, 1.75, -4.0], [-1.0, 1.7, -3.95], [2.0, 1.6, -3.85], [3.6, 1.5, -3.8], [3.95, 1.46, -3.82]]);
const SC3 = SHOT_CAMS[3];
SHOT_CAMS[3] = (s) => [...SC3(s), K(270, ride34, 1)];
SHOT_CAMS[4] = () => [K(284, ride34, 1), K(306, c4, 1)];
SHOT_ACTS[4] = (f) => {
  const tap = 0.35 * sm(f, 300, 318), slide = 0.36 * (1 - sm(f, 356, 378));
  const cast: CastPlace[] = [C(OLD, OLD_AT, flow(f, [[284, { expr: "calm", facing: -0.5, armR: [[20, 16], [24, 36]] }],
    [296, { expr: "calm", facing: -0.5, tilt: 5, armR: [[26, 4], [44, 14]], armRFront: true }, 8],
    [322, { expr: "smile_closed", facing: -0.5, tilt: 3, armR: [[20, 16], [24, 36]] }, 8],
    [352, { expr: "calm", facing: -0.4, tilt: 6, armL: [[-24, 6], [-42, 18]], armLFront: true }, 8],
    [380, { expr: "smile_closed", facing: -0.5, armL: [[-20, 16], [-24, 36]] }, 8]]), { idx: 1 })];
  // the neighbor, still at his sink as the ride leaves his window
  if (f < 292) cast.push(C(NBR, NBR_AT, pose(null, { expr: "proud", facing: 0.6, armR: [[22, 12], [28, 30]] }), { idx: 2 }));
  return { cast, focus: [3.9, 1.6, -3.7],
    ctl: { ...NIGHT, glassN: 1 - bump((f - 276) / 22), glassO: 1, tapO: tap, dripO: f >= 340 ? 1 : 0, dripT0: sec(342), dripRate: 1 / 0.85, bucketK: 0.02, bucketDz: slide, tapN1: 1, tapN2: 1, lampN: 1 } };
};
lens(284, DOF_MS, 10);

// ================================================= SHOT 5 (392-482) the camera swings round in the side yard (392-406) onto the neighbor
// leaning on the fence: he laughs (400) and calls over "You're paying to water a bucket!" (437-477), pointing at the window behind
// the lens; then it swings back to the old man's window (462-478), where he waves (468)
const c5 = FS(() => cam3([1.5, 1.62, -2.35], [-0.42, 1.55, -2.62], 46), 406, 0.002, 0.0012);
const c5w = F(() => cam3([1.75, 1.8, -3.2], [3.95, 1.5, -3.75], 46), 478, 0.0018);   // his window again (the framing the dissolve holds)
const swing45 = crMove(c4, 392, c5, 406, [[1.9, 1.75, -2.9]], [[2.6, 1.55, -1.4], [0.8, 1.55, -1.5]]);
const swing5w = crMove(c5, 462, c5w, 478, [[1.65, 1.7, -2.8]], [[0.8, 1.55, -1.5], [2.6, 1.55, -1.4]]);
SHOT_CAMS[5] = () => [K(392, swing45, 1), K(406, c5, 1), K(462, swing5w, 1), K(478, c5w, 1)];
SHOT_ACTS[5] = (f) => {
  const lean = { tilt: 12, armR: [[20, 20], [34, 26]] as A2, armL: [[-10, 22], [6, 28]] as A2, armRFront: true, armLFront: true };
  const cast: CastPlace[] = [
    C(NBR, NBR_FN, speak(f, 437, 478, flow(f, [[392, { expr: "mock", facing: -0.3, ...lean }], [400, { ...laughP(f, 400, 0), facing: -0.3, ...lean }, 6],
      [432, { expr: "mock", facing: -0.3, tilt: 8, armR: [[20, 20], [34, 26]], armL: [[-10, 22], [6, 28]], armRFront: true, armLFront: true }, 6],
      [452, { expr: "mock", facing: -0.2, tilt: 6, armR: [[24, -10], [44, -30]], armRFront: true, armL: [[-10, 22], [6, 28]], armLFront: true }, 6]])), { idx: 1 }),
    C(OLD, OLD_AT, flow(f, [[392, { expr: "smile_closed", facing: -0.3 }], [466, { expr: "smile", facing: -0.3, armR: [[22, -14], [34, -44]] }, 8], [480, { expr: "smile_closed", facing: -0.3, armR: [[20, -10], [30, -40]] }, 6]]), { idx: 2 }),
  ];
  return { cast, subj: f < 466 ? NBR : OLD, focus: f < 466 ? [NBR_FN[0], 1.75, NBR_FN[2]] : [3.9, 1.7, -3.7], ctl: { ...NIGHT, dripO: 1, dripT0: sec(342), dripRate: 1 / 0.85, bucketK: 0.06, tapO: 0.35, tapN1: 1, tapN2: 1, lampN: 1 } };
};
lens(392, DOF_MS, 12);

// ================================================= SHOT 6 (482-546) dissolve in place (the fence framing, night -> morning), push in
// through his window to the bucket, half full (488-520, "the bucket's half full"); he reads the paper at his table behind
const c6 = F(() => cam3([3.0, 1.78, -3.72], [3.42, 1.05, -3.92], 50), 512, 0.0016);
const c5end = frozen(c5w, 481);
SHOT_CAMS[6] = () => [K(482, c5end, 1, true), K(492, glideTo(c5end, 492, c6, 512, 0.1), 1)];
SHOT_ACTS[6] = (f) => ({
  cast: [C(OLD, TBL_SIT, pose(null, { expr: "calm", mode: "sit", facing: 0.3, armR: [[18, 8], [20, -14]], armL: [[-18, 8], [-20, -14]], propR: "newspaper", armRFront: true }), { idx: 1 })],
  subj: null, focus: [3.42, 1.1, -3.92], ctl: { snow: 0, frost: 0.3, glassO: 1 - sm(f, 508, 516), dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 0.5, tapO: 0.35, tapN1: 1, tapN2: 1 },
});
lens(482, DOF_MS, 1); lens(500, DOF_INSERT, 20);

// ================================================= SHOT 7 (546-628) dissolve in place (the bucket, morning -> night 2), then the camera
// cranes out of the window and up over the side yard, turning to the street: the shovel guy plants a DRIPPY sign at the front of
// his yard (570-592), the woman on the sidewalk with her mug and the neighbor at the fence laugh ("the whole street calls him Drippy")
const c7 = F(() => cam3([0.9, 3.1, -4.6], [0.4, 0.9, 4.0], 50), 578, 0.002);
const c6end = frozen(c6, 545);
const crane67 = crMove(c6end, 552, c7, 578, [[2.3, 2.0, -3.95], [1.5, 2.6, -4.3]], [[2.6, 1.3, -3.0], [1.2, 1.2, 0.5]]);
SHOT_CAMS[7] = () => [K(546, c6end, 1, true), K(552, crane67, 1), K(578, c7, 1)];
const SIGN_AT: V3 = [1.45, 0, 2.35];
SHOT_ACTS[7] = (f) => {
  const plant = sm(f, 574, 590);
  const cast: CastPlace[] = [
    C(SHV, [1.75, 0, 2.7], flow(f, [[546, { expr: "grin", facing: -0.5, armR: [[22, -6], [30, -30]], armL: [[-20, -6], [-28, -30]] }], [574, { expr: "grin", facing: -0.5, tilt: 8, armR: [[22, 4], [30, 10]], armL: [[-20, 4], [-28, 10]] }, 8],
      [594, { ...laughP(f, 594, 1), facing: -0.5 }, 8]]), { idx: 1 }),
    C(WOM, [-1.1, 0.06, 7.8], flow(f, [[546, { expr: "grin", facing: 0.4, armR: [[18, 10], [10, -12]], propR: "coffeeCup" }], [576, { ...laughP(f, 576, 2), facing: 0.4, armR: [[18, 10], [10, -12]], propR: "coffeeCup" }, 8]]), { idx: 2 }),
    C(NBR, [-0.75, 0, 0.6], flow(f, [[546, { expr: "mock", facing: 0.6, armR: [[26, -4], [52, -12]], armRFront: true }], [596, { ...laughP(f, 596, 3), facing: 0.6 }, 8]]), { idx: 3 }),
  ];
  return { cast, subj: SHV, focus: SIGN_AT, ctl: { ...NIGHT, glassO: sm(f, 556, 566), dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 0.8, tapO: 0.35, tapN1: 1, tapN2: 1,
    sign: f < 574 ? 0.3 : 0.5 + 0.5 * plant, signX: SIGN_AT[0], signZ: SIGN_AT[2] } };
};
lens(546, DOF_INSERT, 1); lens(560, DOF_WS, 20);

// ================================================= SHOT 8 (628-700) back down through his window into the basin: the full bucket is slid
// aside, the drip runs down the drain ("pour water down the drain all night?"); he sips tea at his table (660)
const c8 = F(() => cam3([3.02, 1.72, -3.6], [3.45, 1.02, -3.95], 50), 660, 0.0024);
const crane78 = crMove(c7, 632, c8, 660, [[1.5, 2.6, -4.3], [2.3, 2.0, -3.85]], [[1.2, 1.2, 0.5], [2.8, 1.25, -3.4]]);
SHOT_CAMS[7] = ((g) => (s: SetDef) => [...g(s), K(622, crane78, 1)])(SHOT_CAMS[7]);
SHOT_CAMS[8] = () => [K(628, crane78, 1), K(660, c8, 1)];
SHOT_ACTS[8] = (f) => ({
  cast: [C(OLD, TBL_SIT, flow(f, [[628, { expr: "calm", mode: "sit", facing: 0.3, armR: [[18, 10], [16, -4]], propR: "teaMug" }], [656, { expr: "smile_closed", mode: "sit", facing: 0.3, armR: [[16, -2], [8, -34]], propR: "teaMug", headTilt: -4 }, 8], [676, { expr: "calm", mode: "sit", facing: 0.3, armR: [[18, 10], [16, -4]], propR: "teaMug" }, 8]]), { idx: 1 })],
  subj: null, focus: [3.42, 1.0, -3.92], ctl: { ...NIGHT, glassO: 1 - sm(f, 650, 660), dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 1, bucketDz: 0.33, tapO: 0.35, tapN1: 1, tapN2: 1 },
});
lens(628, DOF_WS, 1); lens(650, DOF_INSERT, 14);

// ================================================= SHOT 9 (700-786) dissolve in place (night 2 -> night 3 at the basin), push to the
// spout: the last bead hangs (702), frosts over (740-768), stops ("his drip stops"); he leans in to look, behind the tap
const c9 = F(() => cam3([3.05, 1.66, -3.78], [3.42, 1.55, -3.9], 46), 740, 0.0024);
const c8end = frozen(c8, 699);
SHOT_CAMS[9] = () => [K(700, c8end, 1, true), K(706, glideTo(c8end, 706, c9, 740, 0.05), 1)];
SHOT_ACTS[9] = (f) => ({
  cast: [C(OLD, OLD_AT, flow(f, [[700, { expr: "calm", facing: -0.3 }], [750, { expr: "nervous", facing: -0.2, tilt: 12, headTilt: 6 }, 10]]), { idx: 1 })],
  subj: null, focus: [3.42, 1.56, -3.9], ctl: { ...NIGHT, frost: 0.85, glassO: 0, dripO: 1, dripT0: 0, dripRate: 1 / 1.2, dripFrozen: sm(f, 742, 768), bucketK: 0.3, tapO: 0.35, tapN1: 1, tapN2: 1 },
});
lens(700, DOF_INSERT, 1);

// ================================================= SHOT 10 (786-850) whip out of the window (786-800, a 180 deg swing) to the fence:
// the neighbor grins (790) and calls "Froze anyway, Drippy!" (815-846), pointing at the window
const c10 = FS(() => cam3([2.1, 1.7, -3.45], [-0.45, 1.5, -2.65], 44), 800, 0.0022, 0.002);
const whip910 = crMove(c9, 786, c10, 800, [[2.9, 1.7, -3.7]], [[3.5, 1.58, -3.2], [2.6, 1.55, -2.4], [0.8, 1.5, -2.6]]);
SHOT_CAMS[9] = ((g) => (s: SetDef) => [...g(s), K(784, whip910, 1)])(SHOT_CAMS[9]);
SHOT_CAMS[10] = () => [K(786, whip910, 1), K(800, c10, 1)];
SHOT_ACTS[10] = (f) => {
  const lean = { tilt: 12, armR: [[20, 20], [34, 26]] as A2, armL: [[-10, 22], [6, 28]] as A2, armRFront: true, armLFront: true };
  return { cast: [C(NBR, NBR_FN, speak(f, 815, 847, flow(f, [[786, { expr: "grin", facing: 0.8, ...lean }], [812, { expr: "mock", facing: 0.8, tilt: 6, armR: [[28, -4], [56, -12]], armRFront: true, armL: [[-10, 22], [6, 28]], armLFront: true }, 6],
    [840, { ...laughP(f, 840, 0), facing: 0.8, ...lean }, 6]])), { idx: 1 })],
    subj: NBR, focus: [NBR_FN[0], 1.75, NBR_FN[2]], ctl: { ...NIGHT, glassO: sm(f, 794, 800), dripO: 1, dripFrozen: 1, bucketK: 0.3, tapO: 0.35, tapN1: 1, tapN2: 1, lampN: 1 } };
};
lens(786, DOF_MS, 12);

// ================================================= SHOT 11 (850-970) whip back in (850-866), 3 a.m.: past the frozen spout the old man
// sleeps in his rocker, the clock behind him at 3:00; the tap shudders (918-944), coughs out one fat drop (944, "fat drop"), plunk
const c11 = F(() => cam3([3.0, 1.84, -3.6], [4.6, 1.45, -3.98], 48), 866, 0.0024);
const c11b = F(() => cam3([2.92, 1.45, -3.72], [3.42, 1.3, -3.9], 54), 914, 0.002);   // the snap (904-914, "coughs out"): spout and bucket
const whip1011 = crMove(c10, 850, c11, 866, [[2.9, 1.68, -3.7]], [[0.8, 1.5, -2.6], [2.6, 1.55, -2.4], [3.6, 1.55, -3.3]]);
SHOT_CAMS[10] = ((g) => (s: SetDef) => [...g(s), K(848, whip1011, 1)])(SHOT_CAMS[10]);
SHOT_CAMS[11] = () => [K(850, whip1011, 1), K(866, c11, 1), K(903, glideTo(c11, 903, c11b, 915, 0), 1)];
SHOT_ACTS[11] = (f) => ({
  cast: [C(OLD, ROCK_SIT, pose(null, { expr: "sleep", mode: "sit", facing: 0.2, headTilt: 10 + 2 * Math.sin(f / 22), armR: [[16, 20], [10, 34]], armL: [[-16, 20], [-10, 34]] }), { idx: 1 })],
  subj: null, focus: f < 900 ? [3.42, 1.56, -3.9] : [3.42, 1.4, -3.9],
  ctl: { snow: 0.6, frost: 0.9, glassO: sm(f, 858, 866), dripO: 1, dripFrozen: 1, fatT: sec(f - 944), bucketK: 0.3, tapO: 0.35, tapN1: 1, tapN2: 1, clockH: 3.0 + (f - 850) / 30 / 3600, lampO: 0.25 },
});
lens(850, DOF_INSERT, 14);

// ================================================= SHOT 12 (970-1112) HARD CUT, the thaw: the neighbor's kitchen by day, he stands at his
// sink with a coffee; the wall under the sink cracks (1028) and bursts (1031, "bursts open"), spraying across his floor (1055-1098);
// he jumps back (1034-1050), the coffee flies
const c12 = F(() => cam3([-5.55, 1.5, -2.25], [-3.3, 0.95, -3.95], 46), 970, 0.0022);
const c12b = FS(() => cam3([-5.15, 1.38, -2.5], [-3.25, 0.85, -3.95], 46), 1037, 0.0016, 0.0016);   // the punch on "bursts" (1031-1037)
SHOT_CAMS[12] = () => [K(970, c12, 1, true), K(1031, glideTo(c12, 1031, c12b, 1037, 0), 1)];
SHOT_ACTS[12] = (f) => {
  const jump = sm(f, 1034, 1050), pos: V3 = lerp3([-4.25, FL, -3.25], [-4.95, FL, -2.8], jump);
  const cast: CastPlace[] = [C(NBR, pos, flow(f, [[970, { expr: "calm", facing: 0.8, armR: [[18, 10], [10, -12]], propR: "coffeeCup" }],
    [1030, { expr: "shock", facing: 0.8, mode: "hop", lift: 0.8, armR: [[26, -14], [40, -46]], armL: [[-26, -14], [-40, -46]] }, 4],
    [1050, { expr: "aghast", facing: 0.8, tilt: -6, armR: [[26, -8], [40, -36]], armL: [[-26, -8], [-40, -36]] }, 8]]), { idx: 1 })];
  return { cast, subj: NBR, focus: [-3.4, 0.9, -3.9], ctl: { ...THAW, burstN: sm(f, 1028, 1040), wetN: sm(f, 1040, 1104), tapN1: 1, tapN2: 1 } };
};
lens(970, DOF_MS, 1);

// ================================================= SHOT 13 (1112-1371) YOU SEE: the camera whips up and out through his window (1104-1128)
// and turns round in the side yard to face his wall: the clapboard under his window slices away (1128-1144) and shows the pipe in
// the wall, him at his sink through the window above. A frozen plug grows up the pipe from the cold bottom (1129-1150 "grows"),
// shoves the water ahead toward the shut tap (1165-1220); "With the tap shut" (1229-1239) a quick tilt up to his shut handles
// through the glass; "nowhere to go" (1262-1272) back down: the pipe swells (1262-1306) and splits (1310-1322), spraying out
const c13 = FS(() => cam3([-0.55, 1.2, -3.9], [-3.0, 1.12, -3.9], 52), 1128, 0.0012, 0.0012);
const whip1213 = crMove(c12b, 1104, c13, 1128, [[-4.25, 1.72, -3.55], [-3.0, 1.86, -3.95], [-1.9, 1.78, -4.35]], [[-2.4, 1.5, -3.85], [-1.6, 1.45, -2.3], [-2.4, 1.3, -2.9]]);
const c13t = FS(() => cam3([-1.35, 1.6, -3.85], [-3.15, 1.5, -3.9], 44), 1239, 0.002, 0.002);
const c13d = FS(() => cam3([-1.15, 0.95, -3.85], [-3.0, 0.7, -3.95], 46), 1272, 0.0014, -0.0012);
SHOT_CAMS[12] = ((g) => (s: SetDef) => [...g(s), K(1104, whip1213, 1)])(SHOT_CAMS[12]);
SHOT_CAMS[13] = () => [K(1112, whip1213, 1), K(1128, c13, 1), K(1229, glideTo(c13, 1229, c13t, 1239, 0), 1), K(1262, glideTo(c13t, 1262, c13d, 1272, 0), 1)];
SHOT_ACTS[13] = (f) => {
  const ice = 0.08 + 0.5 * sm(f, 1129, 1150) + 0.32 * sm(f, 1165, 1220);
  return { cast: [C(NBR, NBR_AT, flow(f, [[1112, { expr: "aghast", facing: -0.3, armR: [[26, -8], [40, -36]], armL: [[-26, -8], [-40, -36]] }], [1140, { expr: "worry", facing: -0.2, armR: [[22, 8], [30, 24]], armL: [[-22, 8], [-30, 24]] }, 10],
    [1314, { expr: "shock", facing: -0.2, tilt: -8, armR: [[26, -14], [40, -46]], armL: [[-26, -14], [-40, -46]] }, 4]]), { idx: 1 })],
    subj: null, focus: f >= 1229 && f < 1262 ? [-3.12, 1.4, -3.9] : [-3.0, 0.72, -3.98],
    ctl: { ...THAW, burstN: 1 - sm(f, 1104, 1116), wetN: 0.8, glassN: 1 - bump((f - 1108) / 12), cutN: sm(f, 1128, 1144), iceN: ice, splitN: sm(f, 1262, 1306) * 0.6 + sm(f, 1310, 1322) * 0.4, tapN1: 1, tapN2: 1 } };
};
lens(1112, DOF_FS, 20);

// ================================================= SHOT 14 (1371-1461) HARD CUT: a capped ketchup bottle on his table, two hands squeeze it
// (1378-1422, "squeezing a ketchup bottle"), "with the cap screwed on" the cap holds, the side seam splits (1440)
const c14 = F(() => cam3([5.62, 1.26, -2.9], [5.2, 1.17, -3.3], 42), 1371, 0.0024);
const c14c = F(() => cam3([5.43, 1.32, -3.08], [5.2, 1.24, -3.3], 40), 1436, 0.0022);   // "with the cap screwed on" (1428-1436): close on the cap and the seam
SHOT_CAMS[14] = () => [K(1371, c14, 1, true), K(1426, glideTo(c14, 1426, c14c, 1437, 0), 1)];
SHOT_ACTS[14] = (f) => {
  const sq = sm(f, 1378, 1422), rt: V3 = [0.707, 0, -0.707], K0 = DR0.KETCHUP, hw = 0.07 - 0.02 * sq, hy = K0[1] + 0.1;
  const hR: V3 = [K0[0] + rt[0] * hw, hy, K0[2] + rt[2] * hw], hL: V3 = [K0[0] - rt[0] * hw, hy, K0[2] - rt[2] * hw];
  return { cast: [], subj: null, focus: [K0[0], K0[1] + 0.1, K0[2]],
    ctl: { ...THAW, ketchup: sq, ketchupSplit: sm(f, 1436, 1448), ...armC(0, [5.55, 1.62, -3.7], hR, 0.08), ...armC(1, [4.82, 1.62, -2.95], hL, 0.08) } };
};
lens(1371, DOF_INSERT, 1);

// ================================================= SHOT 15 (1461-1606) HARD CUT: his wall from the side yard, sliced the same way (1461-1476):
// the same plug grows (1477-1545), but his tap is open - through the window the drops come quicker ("let the squeeze out"), the camera
// snaps up to the spout (1522-1534) and "that last fat drop" lets go at 1553: the ice pushing through. He stands at his sink, calm.
const c15 = FS(() => cam3([0.55, 1.2, -3.9], [3.0, 1.12, -3.9], 52), 1461, 0.0016, -0.0016);
const c15b = F(() => cam3([1.62, 1.66, -3.82], [3.42, 1.48, -3.9], 40), 1534, 0.0022);   // "that last fat drop": the spout through the glass
const c15c = FS(() => cam3([0.7, 1.15, -3.9], [3.0, 1.0, -3.92], 50), 1600, 0.0016, 0.0016);   // back down to the sliced wall ("the ice pushing through")
SHOT_CAMS[15] = () => [K(1461, c15, 1, true), K(1522, glideTo(c15, 1522, c15b, 1534, 0), 1), K(1562, glideTo(c15b, 1562, c15c, 1600, 0), 1)];
SHOT_ACTS[15] = (f) => ({
  cast: [C(OLD, OLD_AT, flow(f, [[1461, { expr: "calm", facing: 0.2, armR: [[18, 10], [12, -10]], propR: "teaMug" }], [1556, { expr: "smile_closed", facing: 0.2, armR: [[18, 4], [12, -22]], propR: "teaMug", headTilt: -4 }, 8]]), { idx: 1 })],
  subj: null, focus: f >= 1522 && f < 1570 ? [3.42, 1.5, -3.9] : [3.0, 0.75, -3.95],
  ctl: { ...THAW, cutO: sm(f, 1461, 1476), iceO: 0.08 + 0.75 * sm(f, 1477, 1545), dripO: 1, dripT0: 0, dripRate: f > 1487 && f < 1515 ? 2.6 : 1.2, dripFrozen: f >= 1511 ? 1 : 0, fatT: sec(f - 1553), bucketK: 0.4, tapO: 0.35 },
});
lens(1461, DOF_FS, 1); lens(1522, DOF_MS, 12); lens(1562, DOF_FS, 30);

// ================================================= SHOT 16 (1606-1716) the camera rises from his wall to the window (1606-1640): inside, the
// plumber stands at the sink beside him and points at the dripping spout ("Plumbers really tell you..."), the old man raises his mug
// (1648); a push toward the glass on "the farthest tap dripping" (1640-1690)
const c16 = FS(() => cam3([0.75, 1.72, -3.78], [3.0, 1.62, -3.9], 48), 1640, 0.0022, 0.0012);
SHOT_CAMS[16] = () => [K(1606, glideTo(c15c, 1605, c16, 1640, 0.05), 1)];
const act16 = (f: number, night = 0): Act => {
  const cast: CastPlace[] = [C(OLD, [3.95, FL, -3.42], flow(f, [[1606, { expr: "calm", facing: 0.3, armR: [[18, 10], [12, -10]], propR: "teaMug" }], [1646, { expr: "smile", facing: 0.3, armR: [[22, -14], [26, -46]], propR: "teaMug" }, 8], [1684, { expr: "smile", facing: 0.3, armR: [[18, 10], [12, -10]], propR: "teaMug" }, 8]]), { idx: 1 })];
  if (!night) cast.push(C(PLB, [3.92, FL, -4.3], flow(f, [[1606, { expr: "stern", facing: 0.4, armR: [[24, 18], [20, 40]] }], [1614, { expr: "stern", facing: 0.5, armR: [[26, 4], [50, 16]], armRFront: true }, 8], [1690, { expr: "smile_closed", facing: 0.5, armR: [[26, 4], [50, 16]], armRFront: true }, 8]]), { idx: 2 }));
  return { cast, subj: null, focus: [3.42, 1.55, -3.9], ctl: night ? { ...NIGHT, dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 0.2, tapO: 0.35 } : { ...THAW, dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 0.45, tapO: 0.35 } };
};
SHOT_ACTS[16] = (f) => act16(f);
lens(1606, DOF_MS, 30);

// ================================================= SHOT 17 (1716-1890) dissolve in place (his window from the side yard, the thaw -> next
// winter's night, snowing; he is gone, the tap still drips), then the camera whips round (1734-1756) and rides across the yard to the
// neighbor's window, the -20 thermometer on his glass in frame ("says minus 20", 1765-1778); through the window, red jacket on, he
// reaches for his taps (1802-1822) and opens them to a drip (1832-1850); the camera pushes in to his spout (1832-1876) and his first
// drop falls (1862, "dripping") - the hook's tap shape: the loop
const c16end = frozen(c16, 1715);
const c17m = F(() => cam3([-0.7, 1.95, -3.7], [-3.0, 1.95, -4.25], 46), 1756, 0.0035);
const c17a = F(() => cam3([-2.12, 1.86, -3.72], [-3.95, 1.5, -3.62], 46), 1800, 0.0024);
const c17b = F(() => cam3([-2.8, 1.62, -3.78], [-3.3, 1.45, -3.9], 46), 1876, 0.0012);
const ride17 = crMove(c16end, 1734, c17m, 1756, [[0.6, 1.85, -3.4], [0.2, 1.95, -3.3]], [[1.6, 1.6, -1.6], [-1.2, 1.7, -2.4]]);
const ride17b = glideTo(c17m, 1756, c17a, 1800, 0);
SHOT_CAMS[17] = () => [K(1716, c16end, 1, true), K(1734, ride17, 1), K(1756, ride17b, 1), K(1800, c17a, 1), K(1832, glideTo(c17a, 1832, c17b, 1876, 0), 1)];
SHOT_ACTS[17] = (f) => {
  const op = sm(f, 1832, 1850);
  const cast: CastPlace[] = [C(NBR, NBR_AT, flow(f, [[1716, { expr: "determined", facing: -0.2, armR: [[22, 12], [28, 30]] }],
    [1804, { expr: "determined", facing: -0.2, tilt: 6, armR: [[26, 4], [44, 14]], armRFront: true }, 8],
    [1834, { expr: "proud", facing: -0.2, tilt: 5, armR: [[26, 2], [46, 10]], armRFront: true }, 8],
    [1856, { expr: "proud", facing: -0.2, tilt: 2, armR: [[22, 12], [28, 30]] }, 10]]), { idx: 1 })];
  return { cast, subj: null, focus: f < 1800 ? [-3.06, 2.15, -4.4] : [-3.3, 1.5, -3.9],
    ctl: { ...NIGHT, glassN: 1 - sm(f, 1846, 1856), lampN: 1, tapN1: 1 - 0.45 * op, tapN2: 1, dripN: f >= 1852 ? 1 : 0, dripNT0: sec(1852), dripO: 1, dripT0: 0, dripRate: 1 / 0.85, bucketK: 0.2, tapO: 0.35, lampO: 0.6 } };
};
lens(1716, DOF_MS, 1); lens(1838, DOF_INSERT, 30);
