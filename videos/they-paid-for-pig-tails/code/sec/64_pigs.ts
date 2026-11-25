// =====================================================================================================================
// "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25), master prompt v28. Plan: p12/checkpoints/CP2_pig_tails_plan.md
// One connected set (pigset): the bounty shed + lot + field (home base), the woods road, the hillside beyond the back gate.
// Hard cuts: 724 (the ranger's close-up), 986 (the WANTED poster), 1141 (dusk at the gate). Everything else is one camera
// move into the next (the ride in the pickup takes the camera from the lot into the woods; 1078 is a whip pan).
const P0 = PG0, HY = 1.32;
const hd = (p: V3, y = HY): V3 => [p[0], p[1] + y, p[2]];
const cam3 = (pos: V3, look: V3, fov: number) => ({ pos, look, fov });
const val = (f: number, ks: [number, number][]) => { if (f <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], sm(f, ks[i - 1][0], ks[i][0])); return ks[ks.length - 1][1]; };
const on = (x: number, z: number): V3 => [x, hfPig(x, z), z];
const SHED = "pgShed", HUN = "pgHunter", RAN = "pgRanger", HU2 = "pgHunter2";
const IN: V3 = P0.INSIDE;                        // the shed guy behind the counter (on the raised floor)
const CTR: V3 = [-1.12, 0, -0.74];               // the hunter at the counter (the window's +x half)
const QQ: V3[] = [[-0.05, 0, -1.4], [0.75, 0, -2.0], [1.5, 0, -2.7], [2.25, 0, -3.45]];
const QW = ["pgQ1", "pgQ2", "pgQ3", "pgQ4"];
/** the queue: backs to the camera, shuffling forward a step now and then, a tail in hand */
const queue = (f: number, n = 4, step = 0, walkIn = -1): CastPlace[] => QW.slice(0, n).map((w, i) => {
  const shuf = Math.sin(st(f) * 0.05 + i * 1.7), p = QQ[i], adv = step * 0.6;
  // walkIn: the frame the shot starts; the line walks in from the lot over ~20 f (nobody pops into the frame)
  const k = walkIn < 0 ? 1 : sm(f, walkIn + i * 3, walkIn + 20 + i * 3), off = 1 - k;
  const pos: V3 = [p[0] - adv * 0.8 + 1.4 * off, 0, p[2] + adv * 0.6 - 3.2 * off];
  if (off > 0.02) return C(w, pos, pose(null, { mode: "walk", phase: (f + i * 5) / 14, back: true, facing: 0.35, armR: [[20, 20], [24, 44]], propR: "tail", propK: f / 40 + i } as P), { idx: 30 + i });
  return C(w, pos, pose(null, { back: true, facing: 0.35, tilt: 1.5 * shuf, armR: [[20, 20], [24, 44]], propR: "tail", propK: f / 40 + i } as P), { idx: 30 + i });
});

// ---------------- the pickup's drive (one path, two legs) ----------------
const TP: V3[] = [[7.8, 0, 3.0], [7.8, 0, -4], [6.8, 0, -9.5], [4.0, 0, -13.2], [roadX(-17), 0, -17], [roadX(-21.5), 0, -21.5]];
const TL = polyLen(TP);
const truckAt = (f: number) => {
  if (f < 1000) { const u = sm(f, 852, 902), w = polyAt(TP, u); return { x: w.p[0], z: w.p[2], yaw: Math.atan2(w.d[0], w.d[1]), dist: u * TL, moving: f > 852 && f < 902, brake: bump((f - 897) / 12) }; }
  const t = Math.max(0, f - 1010), s = 0.42 * (t < 20 ? (t * t) / 40 : t - 10), z = -21.5 - s, x = roadX(z), x2 = roadX(z - 0.5);
  return { x, z, yaw: Math.atan2(x2 - x, -0.5), dist: TL + s, moving: t > 0, brake: 0 };
};
/** a point in the truck's frame (local x right = driver side, z forward) to world */
const tPt = (f: number, lx: number, ly: number, lz: number): V3 => { const T = truckAt(f), c = Math.cos(T.yaw), s = Math.sin(T.yaw); return [T.x + lx * c + lz * s, hfPig(T.x, T.z) + ly, T.z - lx * s + lz * c]; };
const truckCtl = (f: number, door = 0): Ctl => { const T = truckAt(f); return { tOn: 1, tx: T.x, tz: T.z, tyaw: T.yaw, tdist: T.dist, tbob: T.moving ? 1 : 0.35, tbrake: T.brake, tdoor: door }; };
const PARKED: Ctl = { tOn: 1, tx: P0.TRUCK[0], tz: P0.TRUCK[2], tyaw: Math.PI, tdist: 0, tbob: 0, tbrake: 0, tdoor: 0 };
const BOAR: V3 = on(roadX(P0.BOAR_Z) - 3.2, P0.BOAR_Z);

/** piglets and two sows trot out of the trees at the west end and on toward the field (from 70); shot 2 keeps them going
 *  (they are still on screen when its crane starts, so nobody vanishes at the scene change) */
const herd1 = (id: number, f: number, s: SetDef): CastPlace[] => {
  const out: CastPlace[] = [], PG: V3[] = [on(-10.0, 9.5), on(-9.4, 6.6), on(-8.4, 2.0), on(-9.4, -3.0), on(-12.5, -7)];
  const herdIn = [[70, "pgSow", 0.85], [75, "pgPiglet", 0.5], [79, "pgPiglet2", 0.5], [84, "pgPiglet", 0.5], [90, "pgSow2", 0.85], [94, "pgPiglet2", 0.5], [98, "pgPiglet", 0.5], [103, "pgPiglet2", 0.5], [108, "pgPiglet", 0.5], [113, "pgSow", 0.85], [118, "pgPiglet2", 0.5], [72, "pgPiglet2", 0.5], [81, "pgPiglet", 0.5], [87, "pgSow2", 0.85], [101, "pgPiglet", 0.5], [111, "pgPiglet2", 0.5]] as [number, string, number][];
  herdIn.forEach(([f0, w, sc], i) => { if (f < f0) return; const g = stroll(id, s, w, PG.map((p) => add3(p, (i % 3 - 1) * 0.5, 0, (i % 2) * 0.4)), sc > 0.6 ? 0.09 : 0.1, f0, f, { mode: "run", phase: (f - f0) / 6 + i * 0.3 }); g.scale = sc; g.idx = 40 + i;
    const up = sm(f, f0, f0 + 10); g.pos = [g.pos[0], g.pos[1] - (1 - up) * 0.8 * sc, g.pos[2]];   // up out of the undergrowth, never popping in
    out.push(g); });
  return out;
};

// ================================================= SHOT 1 (0-139) HOOK: the tail slapped down, two twenties peeled off
// pull back past the queue to the woods edge, piglets trotting out of the trees on "more pigs than ever"
const c1a = F(() => cam3([-1.45, 1.58, -3.45], [-1.62, 1.45, 0], 42), 0, 0.0016);
const c1b = F(() => cam3([-1.2, 2.3, -6.6], [-8.2, 0.7, 3.0], 48), 100, 0.0012);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true), K(50, glideTo(c1a, 50, c1b, 128, 0.25), 1)];
SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  // the hunter: mid-slap on frame 0 (hand coming down onto the counter), then waits palm up, grabs the bills (46), fans them
  cast.push(C(HUN, CTR, { ...flow(f, [[0, { expr: "scheme", facing: 0.65, tilt: 6, armR: [[26, -10], [40, -30]], propR: "tail" }], [4, { expr: "scheme", facing: 0.65, tilt: 8, armR: [[28, 6], [48, 12]] }, 4],
    [24, { expr: "grin", facing: 0.65, tilt: 6, armR: [[26, 4], [44, 2]] }, 8], [46, { expr: "grin", facing: 0.65, tilt: 3, armR: [[26, 2], [46, -6]], propR: "twenties", propK: 0.2 }, 6],
    [62, { expr: "laugh", facing: 0.4, tilt: -2, armR: [[22, -10], [30, -34]], propR: "twenties", propK: 1 }, 8], [96, { expr: "scheme", facing: 0.2, tilt: 0, armR: [[22, -10], [30, -34]], propR: "twenties", propK: 1 }, 10]]) }, { idx: 1 }));
  // the shed guy: licks his thumb (8), peels two twenties off the stack (18-40), hands them over (42), smug
  const peel = sm(f, 18, 40);
  cast.push(C(SHED, [-2.02, IN[1], 0.55], { ...flow(f, [[0, { expr: "tacheUp", facing: -0.6, armR: [[-22, 10], [-30, -4]], propR: "twenties", propK: 0 }], [8, { expr: "tacheUp", facing: -0.6, armL: [[-14, -6], [-4, -26]] }, 6],
    [18, { expr: "tache", facing: -0.6, armL: [[-24, 4], [-40, -6]] }, 6], [42, { expr: "tacheUp", facing: -0.6, armR: [[-30, 2], [-52, -2]], armL: [[-26, 14], [-14, 26]] }, 6],
    [56, { expr: "proud", facing: -0.4, armR: [[-24, 14], [-8, 24]], armL: [[24, 14], [8, 24]], propR: undefined }, 10]]), propK: f < 42 ? peel : 1 } as FigOpts, { idx: 2 }));
  cast.push(...queue(f));
  cast.push(...herd1(1, f, s));
  return { cast, fx, ctl: { tails: 380, seen: 112, paper: 0, ctrTail: f >= 4 ? 1 : 0, ...PARKED }, focus: f < 60 ? hd(CTR, 1.05) : on(-7.8, 3) };
};

// ================================================= SHOT 2 (139-280) "You see, wild hogs were wrecking every field" (crane over the field)
// then down to the shed: he slaps the "1 TAIL = $40" board onto its nails (230) and holds up two twenties (255)
const c2a = F(() => cam3([-19.0, 4.2, -12.6], [-25.2, 0.5, -3.2], 46), 139, 0.0016);
const c2b = F(() => cam3([0.2, 1.65, -3.6], [0.35, 1.55, 0], 44), 214, 0.0018);
SHOT_CAMS[2] = () => [K(139, c2a, 22), K(186, glideTo(c2a, 186, c2b, 222, 0.6), 1)];
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [];
  // five hogs rooting up the corn rows, dirt flying
  cast.push(...herd1(2, f, s));   // shot 1's piglets keep trotting toward the field
  const HOGS: [V3, string, number, number][] = [[on(-24, -6), "pgSow", 0.85, 1], [on(-27, -2.5), "pgBoar2", 0.95, -1], [on(-22, 1.5), "pgSow2", 0.8, 1], [on(-29, -8.5), "pgPiglet", 0.45, -1], [on(-25.5, 4), "pgSow", 0.85, -1]];
  const fx: FxSpec[] = [];
  HOGS.forEach(([p, w, sc, fc], i) => { const r = Math.sin(st(f) * 0.6 + i * 1.3); cast.push(C(w, add3(p, 0.15 * Math.sin(f * 0.03 + i), 0, 0), { facing: fc, tilt: 18 + 7 * r, mouth: r > 0.2 ? "teeth" : undefined, mode: "stand", phase: f / 20 } as FigOpts, { scale: sc, idx: 10 + i }));
    if (f < 200) fx.push(...dustTrail("dirt" + i, add3(p, fc * 0.6, -0.3, 0), [fc, 0], f + i * 7, 3, 0.55, 0.35)); });
  // the shed guy at the front: lifts the board (204), slaps it on (230), holds up two twenties (255)
  const bk = sm(f, 222, 232);
  cast.push(C(SHED, [0.45, 0, -0.72], { ...flow(f, [[139, { expr: "tacheUp", facing: 0.2, armR: [[24, -6], [30, -34]], armL: [[-24, -6], [-30, -34]] }], [222, { expr: "strain", facing: 0.2, armR: [[22, -22], [26, -52]], armL: [[-22, -22], [-26, -52]] }, 8],
    [234, { expr: "tacheUp", facing: 0, armR: [[24, 6], [30, -8]], armL: [[-24, 6], [-30, -8]] }, 6], [250, { expr: "proud", facing: -0.2, armR: [[22, -14], [30, -42]], armL: [[-24, 10], [-12, 24]], propR: "twenties", propK: 1 }, 8]]) }, { idx: 2 }));
  return { cast, fx, ctl: { tails: 0, seen: 112, paper: 0, board: bk, by: lerp(1.25, 1.4, sm(f, 204, 222)), bz: -0.62, ...PARKED }, focus: f < 200 ? on(-24, -2) : hd([0.45, 0, -0.72], 0.9) };
};

// ================================================= SHOT 3 (280-386) "Hunters line up out the door, and he nails every tail to the wall."
const c3a = F(() => cam3([-5.0, 1.8, -7.0], [1.0, 1.2, -2.3], 46), 280, 0.0016);
const c3b = F(() => cam3([4.3, 1.55, -2.9], [2.55, 1.5, -0.25], 44), 326, 0.0018);
SHOT_CAMS[3] = () => [K(280, glideTo(c2b, 280, c3a, 302, 1.3), 1, true), K(316, glideTo(c3a, 316, c3b, 344, 1.5), 1)];
SHOT_ACTS[3] = (f, s) => {
  const cast: CastPlace[] = [];
  cast.push(C(HUN, add3(CTR, 0.1, 0, 0), { expr: "grin", facing: 0.6, armR: [[24, 6], [40, 0]], propR: "tail", propK: f / 30 } as FigOpts, { idx: 1 }));
  cast.push(...queue(f, 4, sm(f, 300, 314), 280));
  // the shed guy hammers a tail onto the wall (330: hammer up; strikes 340, 352, 364)
  const strike = (f: number) => { for (const a of [340, 352, 364]) if (f >= a - 6 && f < a + 6) return f < a ? sm(f, a - 6, a) : 1 - sm(f, a, a + 6); return 0; };
  const k = strike(f);
  const sw = walkPath(3, s, [[0.45, 0, -0.72], [2.35, 0, -0.62]], f, 282, 306);   // he walks from the price board to the tail board (no jump at the scene change)
  cast.push(C(SHED, sw.p, { ...flow(f, [[280, { expr: "tache", facing: 0.4 }], [326, { expr: "determined", facing: 0.6 }, 6]]), ...(sw.moving ? { mode: "walk", phase: sw.phase, facing: sw.facing } : {}),
    armR: f < 326 ? [[24, 10], [30, 30]] : [[26, -12 + 14 * (1 - k)], [44 - 6 * (1 - k), -40 + 30 * k]], armRFront: true, propR: f < 326 ? undefined : "hammer", propRAng: -0.6 + 1.2 * k,
    armL: [[26, -2], [44, -10]], armLFront: false, propL: "tail" } as FigOpts, { idx: 2 }));
  const fx = fxs([340, 352, 364].map((a) => clang("h" + a, [2.62, 1.66, -0.06], f - a, 0.3)));
  return { cast, fx, ctl: { tails: f < 340 ? 6 : f < 352 ? 7 : f < 364 ? 8 : 9, seen: 112, paper: 0, ctrTail: 1, ...PARKED }, focus: f < 320 ? hd(QQ[1]) : [2.62, 1.6, 0] };
};

// ================================================= SHOT 4 (386-532) "By the end of the month, a thousand tails cover it. The paper calls it..."
// the wall fills (390-430 time-lapse), "1000" on the flip board, the newspaper unfolded (452) and taped up (490)
const c4a = F(() => cam3([2.9, 1.55, -4.6], [2.55, 1.5, 0], 46), 386, 0.0012);
const c4b = F(() => cam3([0.7, 1.3, -2.5], [0.78, 1.1, 0], 44), 470, 0.0024);
SHOT_CAMS[4] = () => [K(386, c4a, 16), K(456, glideTo(c4a, 456, c4b, 486, 0.05), 1)];
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [];
  const n = Math.round(9 + (TAIL_N - 9) * sm(f, 392, 440) ** 0.9);
  // the shed guy steps back to admire it, then unfolds the newspaper (452) and tapes it under the board (490)
  const w4 = f < 420 ? walkPath(4, s, [[2.35, 0, -0.62], [1.9, 0, -1.25]], f, 386, 402) : walkPath(4, s, [[1.9, 0, -1.25], [1.08, 0, -0.55]], f, 436, 452);
  cast.push(C(SHED, w4.p, { ...flow(f, [[386, { expr: "beam", facing: 0.3, armR: [[24, 14], [10, 26]], armL: [[-24, 14], [-10, 26]] }], [430, { expr: "proud", facing: 0.4 }, 8],
    [452, { expr: "tacheUp", facing: -0.5, armR: [[-22, -4], [-34, -26]], propR: "newspaper", armRFront: true }, 6], [488, { expr: "tacheUp", facing: -0.8, armR: [[-26, -6], [-46, -16]], propR: undefined }, 6],
    [506, { expr: "proud", facing: -0.2, armR: [[24, 14], [10, 26]], armL: [[-24, 14], [-10, 26]] }, 8]]), ...(w4.moving ? { mode: "walk", phase: w4.phase, facing: w4.facing } : {}) } as FigOpts, { idx: 2 }));
  if (f < 452) cast.push(...queue(f, 3, 1).map((c) => ({ ...c, pos: add3(c.pos, -1.4, 0, -1.6) })));
  return { cast, ctl: { tails: n, seen: 112, paper: f >= 494 ? 1 : 0, ctrTail: 1, ...PARKED }, focus: f < 456 ? [2.7, 1.5, 0] : [0.51, 0.85, 0] };
};

// ================================================= SHOT 5 (532-649) "Only the old ranger isn't impressed: he's out back, counting something in chalk."
// glide round the shed's west corner (keeping a metre off the wall) to the back wall: the ranger chalks a mark every 14 f
const c5 = F(() => cam3([-3.6, 1.55, 7.3], [-2.25, 1.32, 4.35], 46), 560, 0.0014);
const c5pre = F(() => cam3([-5.6, 1.6, -1.2], [-4.4, 1.5, 3.0], 44), 532, 0.0012);
SHOT_CAMS[5] = () => [K(532, c5pre, 14), K(540, glideTo(c5pre, 540, c5, 574, 0, [-2.6, 0, 0.8]), 1)];
const RANGER_AT: V3 = [-1.95, 0, 4.6];
const chalkN = (f: number) => Math.round(28 + Math.max(0, Math.min(18, (f - 548) / 14)));
SHOT_ACTS[5] = (f, s) => {
  const ph2 = ((f - 548) % 14 + 14) % 14, draw = f >= 548 && f < 600 ? Math.sin((ph2 / 14) * Math.PI) : 0;
  const cast = [C(RAN, RANGER_AT, { ...flow(f, [[532, { expr: "bored", facing: -0.75, tilt: 4 }], [600, { expr: "calm", facing: -0.7, tilt: -2, headTilt: -3 }, 10]]),
    armR: f < 600 ? [[-24, -14], [-40 - 4 * draw, -30 + 10 * draw]] : [[-22, 8], [-30, -2]], armRFront: true, propR: "chalk" } as FigOpts, { idx: 3 })];
  if (f < 580) cast.push(C(SHED, [1.08, 0, -0.55], { expr: "proud", facing: -0.2, armR: [[24, 14], [10, 26]], armL: [[-24, 14], [-10, 26]] } as FigOpts, { idx: 2 }));
  return { cast, ctl: { chalk: Math.min(chalkN(f), 46), tails: TAIL_N, paper: 1, ctrTail: 1, ...PARKED }, focus: hd(RANGER_AT, 0.95) };
};

// ================================================= SHOT 6 (649-724) "The hunters laugh, 'Grandpa's counting piglets!'"
// over the ranger's shoulder: the two hunters lean round the shed corner, point and laugh
const H1: V3 = [-4.35, 0, 4.9], H2: V3 = [-4.75, 0, 5.75];
const c6 = F(() => cam3([-0.6, 1.62, 5.9], [-4.3, 1.45, 5.2], 44), 649, 0.0024);
SHOT_CAMS[6] = () => [K(649, c6, 22)];
SHOT_ACTS[6] = (f, s) => {
  const lean = sm(f, 650, 662);
  const cast = [
    C(HUN, add3(H1, 0.3 * (1 - lean), 0, 0), speak(f, 679, 722, { ...flow(f, [[649, { expr: "mock", facing: 0.8, tilt: 8 * lean, armR: [[30, -6], [58, -14]], armRFront: true }], [664, laughP(f, 664, 0)], [679, { expr: "mock", facing: 0.8, tilt: 6, armR: [[30, -6], [58, -14]], armRFront: true }, 4]]) }), { idx: 1 }),
    C(HU2, H2, { ...flow(f, [[649, { expr: "mock", facing: 0.7 }], [660, laughP(f, 660, 1)]]), shake: 1, phase: (f - 649) / 11 } as FigOpts, { idx: 4 }),
    C(RAN, RANGER_AT, { ...flow(f, [[649, { expr: "calm", facing: -0.7, tilt: -2, headTilt: -3, armR: [[-22, 8], [-30, -2]] }], [668, { expr: "bored", facing: -0.75, tilt: 2, armR: [[-24, -14], [-40, -26]] }, 10]]), armRFront: true, propR: "chalk" } as FigOpts, { idx: 3 }),
  ];
  return { cast, ctl: { chalk: 46, tails: TAIL_N, paper: 1, ...PARKED }, focus: hd(H1) };
};

// ================================================= SHOT 7 (724-766) HARD CUT: the ranger's close-up "He just says, 'Count the little ones.'"
const c7 = F(() => cam3([-2.75, 1.78, 6.0], [-1.98, 1.62, 4.6], 44), 724, 0.0026);
SHOT_CAMS[7] = () => [K(724, c7, 1, true)];
SHOT_ACTS[7] = (f, s) => {
  const tap = bump((f - 726) / 8);
  const cast = [C(RAN, RANGER_AT, speak(f, 748, 768, { ...flow(f, [[724, { expr: "calm", facing: 0.55, headTilt: -2 }], [755, { expr: "calm", facing: 0.55, brow: [-3, -1] }, 6]]),
    armR: [[-26, -12], [-44 + 6 * tap, -24]], armRFront: false, propR: "chalk" }), { idx: 3 })];
  return { cast, ctl: { chalk: 46, tails: TAIL_N, paper: 1, ...PARKED }, focus: hd(RANGER_AT, 1.0) };
};

// ================================================= SHOT 8 (766-866) "But wait, if a thousand pigs are gone, why are the woods getting louder?"
// past the tail wall to the woods behind the shed: the bushes shake (780), the two turn (800), the hunter runs for his
// pickup, grabs the rifle out of the bed (842) and jumps in (850-858): the truck pulls away (852)
const c8a = F(() => cam3([5.6, 1.6, -5.5], [4.0, 1.9, 6.0], 58), 766, 0.002);
const c8b = F(() => cam3([6.2, 1.6, -3.4], [7.0, 1.3, 2.6], 50), 836, 0.001);
SHOT_CAMS[8] = () => [K(766, c8a, 1, true), K(826, glideTo(c8a, 826, c8b, 850, 0.1), 1)];
SHOT_ACTS[8] = (f, s) => {
  const SG: V3 = [4.6, 0, 0.6], HG0: V3 = [5.4, 0, 1.2];
  const run1 = walkPath(8, s, [HG0, [6.3, 0, 2.2], [6.75, 0, 3.0]], f, 828, 842);
  const cast: CastPlace[] = [
    C(SHED, SG, flow(f, [[766, { expr: "tacheUp", facing: 0.3 }], [798, { expr: "worry", facing: 0.95, look: 0.9 }, 6], [830, { expr: "gulp", facing: 0.95, look: 0.9, sweat: 1 }, 6]]), { idx: 2 }),
  ];
  if (f < 828) cast.push(C(HUN, HG0, flow(f, [[766, { expr: "grin", facing: -0.3, armR: [[24, -10], [30, -34]], propR: "twenties", propK: 1 }], [802, { expr: "aghast", facing: -0.95, look: -0.9 }, 6], [816, { expr: "determined", facing: 0.8, look: 0.5 }, 6]]), { idx: 1 }));
  else if (f >= 850) cast.push(C(HUN, tPt(f, 0.42, 0.5, 0.15), { expr: "determined", mode: "sit", sitLeg: 0.3, facing: 0.25 } as FigOpts, { idx: 1, scale: 0.92 }));
  if (f >= 828 && f < 850) cast.push(C(HUN, run1.p, { expr: "determined", mode: "run", phase: (f - 828) / 7, facing: run1.facing, ...(f >= 842 ? { propR: "rifle", armR: [[24, 6], [40, 2]] as A2 } : {}) } as FigOpts, { idx: 1 }));
  const fx: FxSpec[] = [];
  const T = truckAt(f); if (f >= 852) fx.push(...dustTrail("tr8", [T.x, 0, T.z], [Math.sin(T.yaw), Math.cos(T.yaw)], f, 5, 0.8, 0.9));
  return { cast, fx, ctl: { tails: TAIL_N, paper: 1, shake: sm(f, 776, 790) * (1 - 0.3 * sm(f, 846, 866)), ...truckCtl(f, f >= 846 && f < 856 ? sm(f, 846, 850) * (1 - sm(f, 852, 856)) : 0) }, focus: f < 826 ? [6.6, 1.8, 11] : [6.8, 1.2, 1.3] };
};

// ================================================= SHOT 9 (866-986) "The best hunter only shoots giant boars, because they get you in the paper."
// ride with the pickup out of the lot into the pines (motivated place change), brake (902), the rifle out of the window
// (906), BANG (925), the giant boar flops (930); he hops out (940) and poses for a selfie with it: flash on "paper" (970)
// the camera backs away AHEAD of the pickup (it drives toward shot 8's camera, so the move continues the same view: no swing,
// no jump), then circles round its driver side as it brakes to find the boar ahead (one subject, 2-3 m off the cab)
const c9lead = (f: number): Shot => { const g = Math.min(f, 902); return { pos: tPt(g, 1.5, 1.75, 7.2), look: tPt(g, 0.25, 1.15, 0.4), fov: 50, roll: 0 }; };
const c9a = F(() => cam3(tPt(902, 2.3, 1.7, -2.6), BOAR, 44), 902, 0.001);
const c9b = F(() => cam3([BOAR[0] + 2.6, BOAR[1] + 1.5, BOAR[2] + 3.4], [BOAR[0] - 0.2, BOAR[1] + 0.9, BOAR[2] - 0.2], 46), 950, 0.0016);
/** circle round the braking pickup in ITS frame (radius 7.4 m -> 3.5 m, never nearer than ~4.5 m to the cab side) */
const c9orbit = (f: number): Shot => {
  const k = sm(f, 889, 915), g = Math.min(f, 902), end = c9a(f);
  if (k >= 1) return end;
  const a0 = Math.atan2(7.2, 1.5), a1 = Math.atan2(-2.6, 2.3), r0 = Math.hypot(1.5, 7.2), r1 = Math.hypot(2.3, -2.6), a = lerp(a0, a1, k), r = lerp(r0, r1, k);
  const pos = tPt(g, r * Math.cos(a), lerp(1.75, 1.7, k) + 0.35 * Math.sin(Math.PI * k), r * Math.sin(a));
  return { pos: lerp3(pos, end.pos, sm(k, 0.8, 1)), look: lerp3(tPt(g, 0.25, 1.15, 0.4), BOAR, sm(k, 0.12, 0.92)), fov: lerp(50, 44, k), roll: 0 };
};
SHOT_CAMS[9] = () => [K(866, c9lead, 18), K(889, c9orbit, 1), K(936, glideTo(c9a, 936, c9b, 958, 0.2), 1)];
SHOT_ACTS[9] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const T = truckAt(f), drv = tPt(f, 0.42, 0.5, 0.15);
  if (f < 900) cast.push(C(SHED, [4.6, 0, 0.6], { expr: "gulp", facing: 0.95, look: 0.9, sweat: 1 } as FigOpts, { idx: 2 }));
  if (f < 940) cast.push(C(HUN, drv, { expr: f < 906 ? "determined" : f < 925 ? "strain" : "joy", mode: "sit", sitLeg: 0.3, facing: f < 898 ? 0.25 : 0.8,
    ...(f >= 904 ? { propR: "rifle", armR: [[30, -4], [52, -8]] as A2, armRFront: true, propRAng: -0.04 } : {}) } as FigOpts, { idx: 1, scale: 0.92 }));
  else { const w = walkPath(9, s, [tPt(940, 1.6, -0.5, 0.1), add3(BOAR, 1.3, 0, 1.2)], f, 940, 952);
    cast.push(C(HUN, w.p, f < 952 ? { expr: "joy", mode: "run", phase: (f - 940) / 6, facing: w.facing } as FigOpts
      : flow(f, [[952, { expr: "proud", facing: -0.3, armR: [[24, -14], [34, -44]], propR: "camera", armL: [[-24, 10], [-12, 24]] }], [968, { expr: "beam", facing: -0.3, armR: [[24, -14], [34, -44]], propR: "camera", armL: [[-24, 10], [-12, 24]] }, 4]]), { idx: 1 })); }
  // the giant boar: rooting, looks up (912), BANG (925) -> flops onto its side (930-936), cartoon stars
  const flop = f < 925 ? 0 : sm(f, 926, 934);
  cast.push(C("pgBoar", BOAR, { expr: f < 912 ? "neutral" : f < 925 ? "angry" : "dizzy", facing: 1, tilt: f < 912 ? 16 : 0, mouth: f >= 925 ? "O" : undefined } as FigOpts, { scale: 2.1, roll: flop * 1.45 + 0.08 * bump((f - 934) / 8), idx: 5 }));
  if (f >= 925 && f < 945) fx.push(...fxs(dustCard("smk", tPt(925, -0.1, 1.55, 1.6), 0.55 + (f - 925) * 0.04, 1 - (f - 925) / 20, 2)));
  if (f >= 936) fx.push(...dizzy(add3(BOAR, -0.7, 1.0, 0), f, 0.36));
  if (f >= 966 && f < 980) fx.push(glowBurst("flash", add3(BOAR, 1.15, 1.95, 1.0), 1.8, Math.max(0, 1 - Math.abs(f - 970) / 6), "255,255,255"));
  if (T.moving) fx.push(...dustTrail("tr9", [T.x, hfPig(T.x, T.z), T.z], [Math.sin(T.yaw), Math.cos(T.yaw)], f, 6, 0.9, 1.0));
  return { cast, fx, ctl: { tails: TAIL_N, paper: 1, ...truckCtl(f, f >= 936 && f < 946 ? 1 : 0), poster: 0 }, focus: f < 900 ? tPt(f, 0.25, 1.15, 0.4) : BOAR };
};

// ================================================= SHOT 10 (986-1078) HARD CUT: "He's bagged so many, the boars have a wanted poster of him."
// a boar on its hind legs presses the WANTED poster onto a roadside pine, two more nod at it; the pickup passes behind
const POSTER: V3 = [roadX(P0.POSTER_Z) - 4.5 + 0.42, 1.55, P0.POSTER_Z];
const c10 = F(() => cam3([POSTER[0] + 3.4, 1.5, POSTER[2] - 2.4], [POSTER[0] + 0.2, 1.1, POSTER[2] + 0.1], 46), 986, 0.0024);
SHOT_CAMS[10] = () => [K(986, c10, 1, true)];
SHOT_ACTS[10] = (f, s) => {
  const cast = posterBoars(f);
  const T = truckAt(f); if (f >= 1030) { cast.push(C(HUN, tPt(f, 0.42, 0.5, 0.15), { expr: "proud", mode: "sit", sitLeg: 0.3, facing: 1 } as FigOpts, { idx: 1, scale: 0.92 }));
    cast.push(C("pgBoar", tPt(f, 0, 0.92, -1.6), { expr: "dizzy", facing: 1 } as FigOpts, { scale: 1.2, roll: 1.45, idx: 5 })); }
  return { cast, ctl: { tails: TAIL_N, paper: 1, poster: sm(f, 986, 994), ...truckCtl(f), tVis: f >= 1030 ? 1 : 0 }, focus: POSTER };
};
/** the three boars at the WANTED poster (shot 10; shot 11 keeps them while the camera whips away) */
const posterBoars = (f: number): CastPlace[] => {
  const B1 = on(POSTER[0] + 0.82, POSTER[2] - 0.83), press = sm(f, 986, 996), smooth2 = bump((f - 1000) / 14);
  return [
    C("pgBoar2", B1, { expr: "angry", facing: -1, mouth: f > 1004 && f < 1020 ? "teeth" : undefined } as FigOpts, { scale: 0.9, roll: 0.06 * smooth2 * (1 - press * 0), idx: 6 }),
    C("pgBoar", on(POSTER[0] + 0.95, POSTER[2] + 0.35), { expr: "angry", facing: -1, tilt: f > 1030 && f < 1046 ? 10 * bump((f - 1030) / 16) : 0 } as FigOpts, { scale: 1.0, idx: 7 }),
    C("pgSow2", on(POSTER[0] + 1.7, POSTER[2] - 1.55), { expr: "angry", facing: -1, tilt: f > 1036 && f < 1052 ? 10 * bump((f - 1036) / 16) : 0 } as FigOpts, { scale: 0.9, idx: 8 }),
  ];
};

// ================================================= SHOT 11 (1078-1141) "He drives right past the mothers with babies." (whip pan)
const SOW: V3 = on(roadX(P0.SOW_Z) + 3.6, P0.SOW_Z);
const c11 = F(() => cam3([POSTER[0] + 2.1, 1.5, POSTER[2] - 1.6], [SOW[0] - 0.4, SOW[1] + 0.45, SOW[2]], 24), 1078, 0.0012);
SHOT_CAMS[11] = () => [K(1078, glideTo(c10, 1078, c11, 1094, 0, [0, 0, 0], 0, 0.2), 1)];
SHOT_ACTS[11] = (f, s) => {
  const T = truckAt(f);
  const cast: CastPlace[] = [C(HUN, tPt(f, 0.42, 0.5, 0.15), { expr: "proud", mode: "sit", sitLeg: 0.3, facing: -1, look: -0.6 } as FigOpts, { idx: 1, scale: 0.92 }),
    C("pgBoar", tPt(f, 0, 0.92, -1.6), { expr: "dizzy", facing: -1 } as FigOpts, { scale: 1.2, roll: -1.45, idx: 5 }),
    C("pgSow", SOW, { expr: f > 1100 && f < 1124 ? "shock" : "neutral", facing: -1, tilt: f < 1096 ? 14 : 0 } as FigOpts, { scale: 0.9, idx: 9 })];
  if (f < 1100) cast.push(...posterBoars(f));
  for (let i = 0; i < 8; i++) { const a = i * 0.8, scat = bump((f - 1100) / 30); const p = on(SOW[0] - 0.4 + Math.cos(a) * (0.9 + 0.4 * scat) + 0.2 * Math.sin(f * 0.05 + i), SOW[2] + 0.6 + Math.sin(a) * (0.6 + 0.4 * scat));
    cast.push(C(i % 2 ? "pgPiglet" : "pgPiglet2", p, { facing: i % 2 ? 1 : -1, mode: scat > 0.2 ? "run" : "walk", phase: f / 7 + i * 0.37 } as FigOpts, { scale: 0.42, idx: 60 + i })); }
  const fx: FxSpec[] = [];
  return { cast, fx, ctl: { tails: TAIL_N, paper: 1, poster: 1, ...truckCtl(f) }, focus: SOW };
};

// ================================================= SHOT 12 (1141-1233) HARD CUT, DUSK: "One evening, the shed guy unlocks the back gate to count what's left."
// he walks up to the gate (bulb + lantern lit), push in to the padlock: the brass key turns (the unlock sting at 1195), the
// chain drops (1210), he pushes the gate open (1225)
const GATE_IN: V3 = [8.35, 0, -3.25];
const c12a = F(() => cam3([3.2, 1.7, -4.6], [8.4, 1.3, -4.6], 46), 1141, 0.0012);
const c12b = F(() => cam3([7.3, 1.45, -2.2], [8.75, 1.2, -3.3], 40), 1176, 0.0024);
const c12c = F(() => cam3([5.7, 1.95, -2.3], [13, 1.6, -4.4], 46), 1212, 0.0015);
SHOT_CAMS[12] = () => [K(1141, c12a, 1, true), K(1164, glideTo(c12a, 1164, c12b, 1182, 0.05), 1), K(1204, glideTo(c12b, 1204, c12c, 1226, 0.15), 1)];
SHOT_ACTS[12] = (f, s) => {
  const w = walkPath(12, s, [[6.4, 0, -7.4], GATE_IN], f, 1141, 1168);
  const turn = sm(f, 1186, 1196);
  const cast = [C(SHED, w.p, f < 1168 ? { expr: "tacheUp", mode: "walk", phase: w.phase, facing: w.facing, propR: "loopKey", armR: [[22, 10], [30, 0]] } as FigOpts
    : flow(f, [[1168, { expr: "tache", facing: 0.9, armR: [[26, -2], [44, -6]], armRFront: true, propR: "loopKey", propRAng: -0.4 * turn }], [1198, { expr: "tacheUp", facing: 0.9, armR: [[26, -2], [44, -6]], propR: "loopKey" }, 4],
      [1214, { expr: "tache", facing: 0.9, back: true, armR: [[30, -2], [54, -6]], armL: [[26, -2], [50, -6]], armRFront: true }, 6]]), { idx: 2 }), ...hillPigs(f)];
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, lockO: sm(f, 1192, 1200), lockD: sm(f, 1206, 1216), gate: sm(f, 1222, 1250), herd: 0 }, focus: f < 1170 ? hd(w.p, 0.9) : f < 1206 ? [9.06, 1.0, -3.24] : [14, 1, -4.4] };
};

/** the two near pigs on the hill: rooting from shot 12 on; one lifts its head at 1235, the other at 1249 (they stay after) */
const hillPigs = (f: number): CastPlace[] => [
  C("pgSow", on(14.2, -5.4), { facing: -1, tilt: f < 1235 ? 18 : 18 * (1 - sm(f, 1235, 1242)) } as FigOpts, { scale: 0.85, idx: 20 }),
  C("pgSow2", on(16.6, -2.6), { facing: -1, tilt: f < 1249 ? 18 : 18 * (1 - sm(f, 1249, 1256)) } as FigOpts, { scale: 0.85, idx: 21 })];
/** the lone boar and the sow with eight piglets (shot 14's comparison): they walk in from off frame while the herd stands
 *  up (1263-1325) and stay on the hill through shot 17, so no card pops at a scene change */
const LB: V3 = on(14.0, -8.6), LS: V3 = on(14.6, -1.2);
const fam14 = (f: number): CastPlace[] => {
  if (f < 1263) return [];
  const k = sm(f, 1263, 1325), walking = k < 0.995, bz = lerp(-12.8, LB[2], k), sz = lerp(2.4, 0, k);
  const out: CastPlace[] = [C("pgBoar", on(LB[0], bz), { expr: "angry", facing: -1, mouth: f > 1362 && f < 1372 ? "teeth" : undefined, ...(walking ? { mode: "walk", phase: f / 9 } : {}) } as FigOpts, { scale: 1.3, idx: 22 }),
    C("pgSow", on(LS[0] + 0.4 * Math.sin(f * 0.04), LS[2] + sz), { facing: -1, mode: "walk", phase: f / 9 } as FigOpts, { scale: 0.9, idx: 23 })];
  for (let i = 0; i < 8; i++) out.push(C(i % 2 ? "pgPiglet" : "pgPiglet2", on(LS[0] + 0.6 + (i % 4) * 0.42 + 0.4 * Math.sin(f * 0.04), LS[2] + sz - 0.55 + Math.floor(i / 4) * 0.7 + (i % 2) * 0.2), { facing: -1, mode: "walk", phase: f / 7 + i * 0.3 } as FigOpts, { scale: 0.42, idx: 70 + i }));
  return out;
};

// ================================================= SHOT 13 (1233-1330) "A pig. Then another. Then the whole hillside starts to move."
// over his shoulder at the open gate: one pig lifts its head, another, then the whole hill of backs (crane up 2 m)
const c13a = F(() => cam3([5.6, 2.0, -2.2], [15.5, 1.4, -4.6], 44), 1233, 0.0012);
const c13b = F(() => cam3([6.2, 3.9, -2.2], [24, 4.4, -4.4], 50), 1290, 0.0012);
SHOT_CAMS[13] = () => [K(1233, c13a, 12), K(1270, glideTo(c13a, 1270, c13b, 1316, 0.2), 1)];
SHOT_ACTS[13] = (f, s) => {
  const cast: CastPlace[] = [
    C(SHED, GATE_IN, flow(f, [[1233, { expr: "tache", facing: 0.9, back: true, armR: [[30, -2], [54, -6]], armL: [[26, -2], [50, -6]], armRFront: true }], [1240, { expr: "tache", facing: 0.9, back: true }, 10], [1290, { expr: "shock", facing: 0.6, look: 0.4, armR: [[24, 14], [10, 26]] }, 6]]), { idx: 2 }),
  ];
  // the hunter walks up beside him from the lot (1262-1290) and gapes
  const hw = walkPath(13, s, [[5.6, 0, -6.0], [7.9, 0, -4.9]], f, 1258, 1286);
  cast.push(C(HUN, hw.p, f < 1286 ? { expr: "grin", mode: "walk", phase: hw.phase, facing: hw.facing, propR: "tail" } as FigOpts : flow(f, [[1286, { expr: "grin", facing: 0.7 }], [1296, { expr: "aghast", facing: 0.7, propR: "tail", armR: [[20, 20], [26, 44]] }, 4]]), { idx: 1 }));
  // the first two pigs (cards, near): one lifts its head at 1235, another at 1249
  cast.push(...hillPigs(f), ...fam14(f));
  const herd = f < 1263 ? 0 : sm(f, 1263, 1322) ** 1.4;
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, lockD: 1, gate: sm(f, 1222, 1250), herd, herdWalk: 1 }, focus: f < 1262 ? on(14.2, -5.4) : on(22, -4) };
};

// ================================================= SHOT 14 (1330-1421) "You see, they only shot the big boars, and boars don't have babies."
// a lone boar (left) and a sow leading eight piglets (right), side by side on the slope; the camera glides from one to the other
const c14a = F(() => cam3([10.2, 1.55, -9.4], [14.0, 1.0, -8.0], 44), 1330, 0.0014);
const c14b = F(() => cam3([10.4, 1.65, -3.8], [14.2, 0.95, -3.2], 46), 1384, 0.0014);
SHOT_CAMS[14] = () => [K(1330, c14a, 20), K(1366, glideTo(c14a, 1366, c14b, 1396, 0.1), 1)];
SHOT_ACTS[14] = (f, s) => {
  const cast: CastPlace[] = [...fam14(f), ...hillPigs(f)];
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, lockD: 1, gate: 1, herd: 1, herdWalk: 1 }, focus: f < 1380 ? LB : LS };
};

// ================================================= SHOT 15 (1421-1538) "The mothers do, and every one they skipped raised more piglets than ever."
// crane up to a high view of the hill: the herd sorts itself into one sow's family, trails branching up the slope
const c15a = F(() => cam3([9.5, 3.5, -10.5], [16, 1.5, -4.4], 46), 1421, 0.001);
const c15b = F(() => cam3([6.5, 22, -4.4], [26, 7, -4.4], 50), 1500, 0.0008);
SHOT_CAMS[15] = () => [K(1421, glideTo(c14b, 1421, c15a, 1440, 0.2), 1), K(1444, glideTo(c15a, 1444, c15b, 1500, 1.5), 1)];
SHOT_ACTS[15] = (f, s) => ({ cast: [...fam14(f), ...hillPigs(f)], ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, lockD: 1, gate: 1, herd: 1, herdWalk: 0.5, treeK: sm(f, 1446, 1510) }, focus: on(20, -4.4) });

// ================================================= SHOT 16 (1538-1628) "It's like mowing the tallest weeds and leaving all the seeds."
// down to the fence inside the lot: the ranger pushes the reel mower; the tall weeds fall, the short dandelions puff seeds
const c16 = F(() => cam3([4.9, 1.75, -10.2], [8.0, 0.75, -8.6], 48), 1556, 0.0014);
SHOT_CAMS[16] = () => [K(1538, glideTo(c15b, 1538, c16, 1560, 0.5), 1)];
SHOT_ACTS[16] = (f, s) => {
  const mz = val(f, [[1540, -6.0], [1622, -11.4]]), mx = 7.95;
  const cast = [C(RAN, [mx, 0, mz + 0.95], { expr: f < 1590 ? "calm" : "smile", mode: "walk", phase: (f - 1540) / 18, facing: screenSide(16, s, f, 0, -1), tilt: 8, armR: [[22, -4], [36, -10]], armL: [[18, -2], [32, -8]], armRFront: true, armLFront: true } as FigOpts, { idx: 3 }), ...fam14(f), ...hillPigs(f)];
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, lockD: 1, gate: 1, herd: 1, treeK: 1, mowOn: 1, mowX: mx, mowZ: mz, mowSpin: f * 0.6, seeds: sm(f, 1590, 1625) }, focus: [mx, 0.4, mz - 0.6] };
};

// ================================================= SHOT 17 (1628-1713) "An army base really tried this, and the pigs went up."
// the BASE HOG CONTROL sign and the PIGS SEEN flip board: he flips it up card by card (1665, 1680, 1695)
const c17 = F(() => cam3([-4.55, 1.72, -3.7], [-4.72, 1.58, -0.8], 46), 1628, 0.0022);
SHOT_CAMS[17] = () => [K(1628, glideTo(c16, 1628, c17, 1650, 0.8, [0, 0, -2]), 1)];
/** what the lot looks like after the mowing (shots 17-19 keep it, so nothing snaps back) */
const AFTER_MOW = { herd: 1, treeK: 1, mowOn: 1, mowX: 7.95, mowZ: -11.4, mowSpin: 1622 * 0.6, seeds: 1 };
const SEEN_AT = (f: number) => f < 1665 ? 312 : f < 1680 ? 412 : f < 1695 ? 645 : 845;
SHOT_ACTS[17] = (f, s) => {
  const flipK = [1665, 1680, 1695].reduce((m, a) => Math.max(m, f >= a - 6 && f < a ? (f - (a - 6)) / 6 : 0), 0);
  const reach = [1665, 1680, 1695].reduce((m, a) => Math.max(m, bump((f - (a - 8)) / 14)), 0);
  const cast = [C(SHED, [-4.42, 0, -1.55], { ...flow(f, [[1628, { expr: "worry", facing: -0.7 }], [1690, { expr: "dismay", facing: -0.6, sweat: 1 }, 6]]), armR: [[-24, -10 - 10 * reach], [-40, -24 - 16 * reach]], armRFront: true } as FigOpts, { idx: 2 }), ...fam14(f), ...hillPigs(f)];
  if (f < 1660) cast.push(C(RAN, [7.95, 0, -10.45], { expr: "smile", facing: -0.5, tilt: 4, armR: [[22, -4], [36, -10]], armL: [[18, -2], [32, -8]], armRFront: true, armLFront: true } as FigOpts, { idx: 3 }));
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, seen: SEEN_AT(f), flipK, lockD: 1, gate: 1, ...AFTER_MOW }, focus: [-5.0, 1.62, -0.8] };
};

// ================================================= SHOT 18 (1713-1792) "And Grandpa's chalk marks? They were a family tree."
// a fast push round the west corner to the back wall: the ranger taps the top mark (1719), tilt down the branches
const c18a = F(() => cam3([-1.75, 1.95, 7.1], [-1.85, 1.75, 4.1], 50), 1720, 0.0012);
const c18b = F(() => cam3([-1.55, 1.65, 9.5], [-1.55, 1.25, 4.1], 54), 1752, 0.0012);
SHOT_CAMS[18] = () => [K(1713, glideTo(c17, 1713, c18a, 1724, 0.3, [-2.2, 0, 1.0]), 1), K(1740, glideTo(c18a, 1740, c18b, 1772), 1)];
SHOT_ACTS[18] = (f, s) => {
  const tap = bump((f - 1716) / 8);
  const cast = [C(RAN, [-2.15, 0, 4.62], { ...flow(f, [[1713, { expr: "smug", facing: 0.6, armR: [[26, -22], [36 + 4 * tap, -52]], armRFront: true, propR: "chalk" }], [1760, { expr: "smug", facing: 0.4, armR: [[22, 8], [30, -4]], propR: "chalk" }, 10]]) }, { idx: 3 }),
    C(SHED, [-4.42, 0, -1.55], { expr: "dismay", facing: -0.6, sweat: 1, armR: [[-24, -10], [-40, -24]], armRFront: true } as FigOpts, { idx: 2 })];
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, chalk: 999, seen: 845, lockD: 1, gate: 1, ...AFTER_MOW }, focus: [-1.55, 1.5, 4.12] };
};

// ================================================= SHOT 19 (1792-1916) "So the shed guy does the sensible thing and raises it to fifty bucks a tail."
// round the corner to the front: he paints 50 over 40 (1820-1880) with piglets round his boots; the hunter waits with a tail
const c19 = F(() => cam3([1.05, 1.5, -3.4], [0.85, 1.3, 0], 52), 1812, 0.0016);
SHOT_CAMS[19] = () => [K(1792, glideTo(c18b, 1792, c19, 1814, 0.6, [-7.5, 0, -3.0]), 1)];
SHOT_ACTS[19] = (f, s) => {
  const strokeK = Math.sin(st(f, 2) * 0.7) * (f >= 1818 && f < 1880 ? 1 : 0);
  const cast: CastPlace[] = [
    C(SHED, [1.28, 0, -0.6], { ...flow(f, [[1792, { expr: "tache", facing: -0.4 }], [1816, { expr: "tacheUp", facing: -0.7, armR: [[24, -18], [30, -46]], armRFront: true, propR: "paintbrush" }, 6], [1884, { expr: "proud", facing: -0.2, armR: [[24, 14], [10, 26]], propR: "paintbrush" }, 8]]),
      ...(f >= 1818 && f < 1880 ? { armR: [[24, -18 + 4 * strokeK], [30 + 6 * strokeK, -48 + 6 * strokeK]] as A2 } : {}) } as FigOpts, { idx: 2 }),
  ];
  if (f < 1816) cast.push(C(RAN, [-2.15, 0, 4.62], { expr: "smug", facing: 0.4, armR: [[22, 8], [30, -4]], propR: "chalk" } as FigOpts, { idx: 3 }));
  for (let i = 0; i < 7; i++) { const a = f * 0.03 + i * 0.9; cast.push(C(i % 2 ? "pgPiglet" : "pgPiglet2", on(1.15 + Math.cos(a) * (0.55 + 0.15 * (i % 3)), -0.85 - Math.abs(Math.sin(a)) * 0.6), { facing: Math.cos(a + 1.57) > 0 ? 1 : -1, mode: "walk", phase: f / 6 + i * 0.4 } as FigOpts, { scale: 0.42, idx: 80 + i })); }
  return { cast, ctl: { tails: TAIL_N, paper: 1, ...PARKED, tVis: 0, price: sm(f, 1820, 1880), chalk: 999, seen: 845, lockD: 1, gate: 1, ...AFTER_MOW }, focus: P0.PRICE };
};
