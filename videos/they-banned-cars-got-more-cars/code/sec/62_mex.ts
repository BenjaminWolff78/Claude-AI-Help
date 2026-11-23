// =====================================================================================================================
// "They Banned Cars One Day a Week and Got More Cars" (2026-11-21), master prompt v25. Plan: checkpoints/CP2_car_ban_plan.md
// Twelve shot ids in one set (mexset): the avenue + city hall + footbridge, and Memo's street (home base).
// Hard cuts at 839, 1028, 1548, 1692. Dissolves: 334 (the 5 on the day board -> the 5 on Memo's plate), 593 (time jump on
// the street, inside the wreck's smoke), 1098 and 1162 (time jumps in the same framing). No floating words: every number is
// on an object (day rows, plates, the newspaper, the flip counter, the tally counter, the SAT plate, the key tags).
// v25 section 7: people sit in cars behind windscreens, kneel at a plate, lean on a gate / a roof / a rail, sit on a stool,
// a step and a bonnet, stand on ladders, and are seen from behind; nobody stands in a row facing the lens.
const HY = 1.32;
const hd = (p: V3, y = HY): V3 => [p[0], p[1] + y, p[2]];
const TAU = Math.PI * 2;
const fitH = (boxes: Box[], az: number, el: number, fov: number, pct: number, raise = 0, pad = 0.92, side = 0, lift = 0) => {
  const c = fit(boxes, az, el, fov, pad, side, lift), d: V3 = [c.pos[0] - c.look[0], c.pos[1] - c.look[1], c.pos[2] - c.look[2]], L = Math.hypot(...d);
  const D = 0.52 / pct / (2 * Math.tan((fov * Math.PI) / 360) * 0.5625), k = Math.max(1, D / L);
  const dy = raise * Math.tan((fov * Math.PI) / 360) * L * k;
  return { pos: [c.look[0] + d[0] * k, c.look[1] + d[1] * k - dy, c.look[2] + d[2] * k] as V3, look: [c.look[0], c.look[1] - dy, c.look[2]] as V3, fov };
};
/** a solid cartoon exhaust cloud (the puff that wins the race) */
const puffCard = (key: string, pos: V3, w: number, a: number): FxSpec => ({ kind: "card", key: "puff" + key, pos, w, h: w * 0.75, cw: 256, ch: 192, op: Math.max(0, Math.min(1, a)),
  draw: (p) => { const g = p.g; const B: [number, number, number][] = [[70, 118, 52], [118, 86, 62], [170, 104, 56], [206, 128, 40], [128, 132, 50], [44, 140, 30]];
    g.fillStyle = "#2a2630"; for (const [x, y, r] of B) { g.beginPath(); g.arc(x, y, r + 5, 0, 6.3); g.fill(); }
    g.fillStyle = "#6b6468"; for (const [x, y, r] of B) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
    g.fillStyle = "#8a8286"; for (const [x, y, r] of B) { g.beginPath(); g.arc(x - r * 0.2, y - r * 0.25, r * 0.55, 0, 6.3); g.fill(); } } });
const cam3 = (pos: V3, look: V3, fov: number) => ({ pos, look, fov });
const REST_R: A2 = [[22, 10], [28, 26]], REST_L: A2 = [[-22, 10], [-28, 26]];
const WHEEL_R: A2 = [[16, 12], [10, 26]], WHEEL_L: A2 = [[-16, 12], [-10, 26]];   // both hands on the steering wheel
const SEAT = 0.78;   // seated-in-car card scale
/** driver's seat mark of a car at (cx, cz): nose +x (dir 1) or nose -x (dir -1); modern cars sit 0.33 m behind the centre */
const seatOf = (cx: number, cz: number, dir: 1 | -1, modern: boolean, y = 0.5): V3 => [cx + dir * (modern ? -0.33 : -0.03), y, cz - dir * 0.42];
const driver = (who: string, seat: V3, o: P, idx: number): CastPlace => C(who, seat, { mode: "sit", armR: WHEEL_R, armL: WHEEL_L, ...o } as FigOpts, { scale: SEAT, idx, shadow: false, blob: false });
/** a dark smoke puff card (exhaust, a cough) */
const smokeCard = (key: string, pos: V3, w: number, a: number, seed = 1): FxSpec => ({ kind: "card", key: "smk" + key + (seed % 4), pos, w, h: w * 0.8, soft: true, cw: 160, ch: 128, op: Math.max(0, Math.min(1, a)),
  draw: (p) => { const g = p.g; for (let i = 0; i < 6; i++) { const x = 40 + 80 * rnd1(i + seed * 5), y = 44 + 44 * rnd1(i + seed * 3, 78.2), r = 24 + 20 * rnd1(i + seed, 39.4); const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, "rgba(58,52,54,0.95)"); gr.addColorStop(1, "rgba(58,52,54,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); } } });

// ================================================= SHOT 1 (0-142) THE AVENUE CHECKPOINT, smog sunrise
const COP: V3 = [AX - 0.5, 0, -5.3], SEAT1 = seatOf(MX.MEMOAV[0], MX.MEMOAV[2], 1, true);
const c1a = F((f) => { const k = sm(f, 0, 26), j = lin(f, 26, 74); return cam3(lerp3([AX + 5.4, 1.9, -5.3], [AX + 3.0 + 0.25 * j, 1.45, -4.6], k), lerp3([AX - 1.5, 1.2, -4.95], [AX - 1.2, 1.15, -5.05 - 0.08 * j], k), 50); }, 26, 0.0, [[10, 0.006, 7]]);
const c1b = F(() => cam3([AX + 9, 6.6, -0.5], [AX - 46, 0.2, -1.2], 54), 132, 0.0012);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true), K(72, glideTo(c1a, 72, c1b, 132, 0, [0, 0, 0], 0.2, 0.25), 1)];
SUN_REF[1] = 110;
const nearX = (k: number, jam: number) => [AX - 3.6, AX - 8.6, AX - 9.2, AX - 3.9][k] - (1 - smooth(jam)) * (10 + k * 6);
SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const jam = lerp(0.3, 1, sm(f, 66, 136));
  const ctl: Ctl = { avMemo: 1, avNear: 1, bar: sm(f, 3, 10), avShake: f >= 10 && f < 20 ? 1 - (f - 10) / 10 : 0, jam, dens: 1, hole: 1, smog: 1, creep: f * 0.01, kerbCars: 0, tiles: 0, banner: 0, yard: 0 };
  // THE COP: arm up on frame 0, the barrier slams on "banned" (f10), he blows the whistle (34) and jabs a finger at the plate (52)
  const BARP: V3 = [AX - 0.8, lerp(1.9, 0.82, sm(f, 3, 10)), -5.35];
  const cArm = armSeq(f, [[-1, (g) => armTo(1, s, g, COP, [AX - 0.8, lerp(1.9, 0.82, sm(g, 3, 10)), -5.35], -1, -0.5)], [28, fixA([[-20, 0], [-10, -22]]), 6], [46, (g) => armTo(1, s, g, COP, [AX - 1.2, 0.75, -4.6], -1, -0.5), 8], [100, fixA(REST_L), 14]]);
  void BARP;
  cast.push(C("cop", COP, { ...flow(f, [[0, { expr: "determined", facing: -0.6, tilt: -8 }], [10, { expr: "strain", facing: -0.6, tilt: 8 }, 3], [22, { expr: "tache", facing: -0.6, tilt: 2 }, 8], [34, { expr: "angry", facing: -0.6, tilt: -4 }, 6], [52, { expr: "tache", facing: -0.7, tilt: 6, look: -0.5 }, 8]]),
    armL: cArm, armLFront: true, propL: f >= 28 && f < 46 ? "whistle" : undefined, armR: f < 46 ? [[24, 8], [16, 22]] : [[26, 12], [12, 26]], armRFront: true } as FigOpts, { idx: 1 }));
  // MEMO behind the windscreen: jolts when the barrier lands, then slumps over the wheel
  cast.push(driver("memo", SEAT1, flow(f, [[0, { expr: "neutral", facing: 0.15, mode: "sit", armR: WHEEL_R, armL: WHEEL_L }], [11, { expr: "shock", facing: 0, tilt: -6, mode: "sit", armR: [[20, -4], [28, -20]] as A2, armL: [[-20, -4], [-28, -20]] as A2 }, 3], [34, { expr: "bored", facing: 0.3, tilt: 4, mode: "sit", armR: WHEEL_R, armL: WHEEL_L }, 10], [58, { expr: "bored", facing: 0.3, tilt: 7, headTilt: 6, mode: "sit", armR: WHEEL_R, armL: [[-20, 2], [-10, -14]] as A2 }, 12]]), 2));
  cast.push(driver("drv1", seatOf(nearX(0, jam), -6.4, 1, true), flow(f, [[0, { expr: "bored", facing: 0.4, mode: "sit" }], [40, { expr: "angry", facing: 0.2, mode: "sit", armR: [[20, -6], [30, -24]] as A2 }, 8], [70, { expr: "bored", facing: 0.4, mode: "sit" }, 12]]), 3));
  cast.push(driver("drv2", seatOf(nearX(3, jam), -1.3, 1, false), flow(f, [[0, { expr: "worry", facing: -0.4, mode: "sit" }], [50, { expr: "dismay", facing: -0.2, mode: "sit" }, 10]]), 4));
  if (f >= 10 && f < 20) fx.push(dustCard("bar", [AX - 0.8, 0.85, -4.2], 0.5 + (f - 10) * 0.03, 0.5 - (f - 10) / 20, 2));
  const focus = follow(f, [[0, hd(COP, 1.3)], [80, [AX - 6, 1, -3], 16], [128, [AX - 30, 1, -2], 30]]);
  return { ctl, cast, fx, focus, subj: f < 74 ? "cop" : null };
};
lens3([[0, DOF_MS], [74, DOF_WS, 20]]);
KICKS.push([10 / 30, 4]);

// ================================================= SHOT 2 (142-334) CITY HALL BALCONY, brown midday smog
const MAY: V3 = [MX.BALC[0] + 0.1, 4.4, -10.3], CLK: V3 = MX.CLERK;
const rowAt = (k: number): V3 => [MX.TILES[0], MX.TILES[1] + 1.0 - k * 0.6, MX.TILES[2] + 0.1];
const c2a = F(() => cam3([AX + 4.0, 5.7, -6.5], [AX + 3, 5.62, -10.3], 46), 172, 0.0013, [[250, 0.006, 7]]);
const c2b = F(() => cam3([AX + 6.75, 6.45, -5.8], [AX + 6.72, 6.4, -10.9], 46), 270, 0.001);
const c2c = F(() => cam3([AX + 6.345, 7.3, -9.89], [AX + 6.345, 7.3, -10.81], 40), 332, 0.0);
SHOT_CAMS[2] = () => [K(142, c2a, 30), K(258, swing(c2a, 258, c2b, 270), 1), K(314, glideTo(c2b, 314, c2c, 334), 1)];
SUN_REF[2] = 180;
const TILE_F = [272, 281, 290, 300, 310];
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  let tiles = 0; for (const t of TILE_F) tiles += sm(f, t - 5, t + 1);
  const ctl: Ctl = { avMemo: 1, avNear: 1, bar: 1, jam: 1, dens: 1, hole: 1, smog: 1, creep: f * 0.01, kerbCars: 0, tiles, banner: 0, yard: 0 };
  // THE MAYOR behind the lectern: coughs into his fist (150), fans the smog with his speech (175-212), wipes the lectern and
  // looks at his sooty palm (215), slams a fist on "bans" (256)
  const mArm = armSeq(f, [[0, fixA([[22, 8], [16, 20]])], [146, fixA([[18, -6], [4, -30]]), 5], [170, (g) => [[24, -10], [38 + 8 * Math.sin(g * 0.7), -30 + 6 * Math.cos(g * 0.7)]] as A2, 6], [212, fixA([[22, 6], [14, 16]]), 8], [228, fixA([[20, -4], [10, -18]]), 8], [246, fixA([[22, -22], [26, -44]]), 7], [256, fixA([[22, 6], [16, 18]]), 3]]);
  cast.push(C("mayor", MAY, { ...flow(f, [[142, { expr: "worry", facing: 0.35, tilt: 3 }], [149, { expr: "strain", facing: 0.35, tilt: 9 }, 3], [170, { expr: "dismay", facing: 0.4, tilt: -3 }, 8], [215, { expr: "worry", facing: 0.2, tilt: 8, look: -0.3 }, 8], [246, { expr: "angry", facing: 0.3, tilt: -5 }, 6], [256, { expr: "tache", facing: 0.3, tilt: 6 }, 3]]),
    armR: mArm, armRFront: true, propR: f >= 168 && f < 214 ? "notice" : undefined, armL: [[-22, 8], [-16, 20]], armLFront: true } as FigOpts, { idx: 1 }));
  if (f >= 149 && f < 162) fx.push(smokeCard("cough", [MAY[0] + 0.35, 5.75, MAY[2] + 0.45], 0.3 + (f - 149) * 0.03, 0.7 - (f - 149) / 18, 1));
  if (f >= 256 && f < 264) fx.push(dustCard("slam", [MAY[0] + 0.2, 5.62, MX.LECT[2] + 0.1], 0.3, 0.5 - (f - 256) / 16, 3));
  // THE CLERK on the ladder (back to us): hangs the five day rows, one per beat
  let k = 0; for (let i = 0; i < 5; i++) if (f >= TILE_F[i] - 8) k = i;
  const carry = (g: number): V3 => { const t = TILE_F[k], u = sm(g, t - 5, t + 1), r = rowAt(k); return [r[0] + 0.45, r[1] + (1 - u) * 0.3, r[2] + 0.1 + (1 - u) * 0.5]; };
  const kArm = armSeq(f, [[0, fixA(REST_L)], [250, (g) => armTo(2, s, g, CLK, carry(g), -1, 0, 1, "stand", 6), 6], [318, fixA(REST_L), 10]]);
  cast.push(C("clerk", CLK, { ...flow(f, [[142, { expr: "neutral", back: true, tilt: 0 }], [262, { back: true, tilt: -4 }, 6], [290, { back: true, tilt: 3 }, 8], [310, { back: true, tilt: 6 }, 8]]), back: true, armL: kArm, armLFront: true, armR: [[20, 6], [30, -8]], armRFront: true } as FigOpts, { idx: 2 }));
  const focus = follow(f, [[142, hd(MAY, 1.25)], [270, rowAt(1), 12], [334, rowAt(0), 14]]);
  return { ctl, cast, fx, focus, subj: f < 258 ? "mayor" : null };
};
lens3([[142, DOF_WS], [172, DOF_MS, 20], [270, DOF_FS, 10], [330, DOF_INSERT, 12]]);

// ================================================= SHOT 3 (334-593) MEMO'S STREET, Monday morning
const PL5: V3 = [-5.07, 0.56, -2.05], MK3: V3 = [-5.6, 0, -1.1];
const hugoX3 = (f: number) => f < 430 ? lerp(7, -3.4, sm(f, 372, 430)) : f < 508 ? lerp(-3.4, -5.6, sm(f, 430, 508)) : lerp(-5.6, -40, Math.pow(lin(f, 508, 580), 1.6));
const HZ3 = 0.6, hseat3 = (f: number): V3 => { const p = seatOf(hugoX3(f), HZ3, -1, true); return [p[0] + 0.14, p[1], p[2]]; };
const PAPER: V3 = [MX.QUEUE[0][0] + 0.42, 1.02, MX.QUEUE[0][2] + 0.05];
const c3t = F(() => cam3([-5.49, 0.555, -1.84], [-5.07, 0.555, -1.84], 40), 334, 0.0);
const c3a = F(() => cam3([-8.6, 1.05, -2.45], [-5.35, 0.8, -1.55], 52), 352, 0.0012);
const c3b = F((f) => { const h = hseat3(Math.max(f, 430)); return cam3([h[0] + 0.5, 1.45, 2.95], [h[0] + 0.15, 1.2, h[2]], 52); }, 430, 0.0);
const c3c = F((f) => { const h = hseat3(f); return cam3([h[0] + 0.45, 1.38, 2.75], [h[0] + 0.15, 1.27, h[2]], 42); }, 473, 0.0);
const c3d = F(() => cam3([PAPER[0] + 2.3, 1.42, PAPER[2] + 0.75], [PAPER[0] - 0.1, 1.22, PAPER[2] - 0.05], 42), 515, 0.0012, [[518, 0.006, 7]]);
SHOT_CAMS[3] = () => [K(334, c3t, 1, true), K(337, glideTo(c3t, 337, c3a, 352), 1), K(386, glideTo(c3a, 386, c3b, 416, 0.3, [0, 0, 0], 0.3), 1), K(466, glideTo(c3b, 466, c3c, 478), 1), K(499, glideTo(c3c, 499, c3d, 515, 0.1), 1)];
SUN_REF[3] = 440;
SHOT_ACTS[3] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const hx = hugoX3(f), opened = sm(f, 510, 518);
  const ctl: Ctl = { fleet: -1, hugoX: hx, hugoZ: HZ3, hugoBob: 0.2, kerbCars: 1, paper: 0.02 + opened, paperX: PAPER[0], paperY: PAPER[1] - 0.12 * (1 - opened), paperZ: PAPER[2], paperRY: Math.PI / 2 - 0.3, night: 0 };
  // MEMO kneels at his bumper and wipes the plate that ends in 5 (340-380); he watches Hugo roll by, chin on his fist
  const mArm = armSeq(f, [[334, fixA([[-20, 6], [-8, -8]])], [348, (g) => armTo(3, s, g, MK3, [PL5[0] - 0.05, PL5[1] + 0.06 * Math.sin(g * 0.5), PL5[2] + 0.2 + 0.1 * Math.cos(g * 0.5)], -1, -0.6, 1, "stand", 6), 8], [386, fixA([[-20, 6], [-8, -8]]), 10], [470, fixA([[-22, 10], [-26, 24]]), 12]]);
  cast.push(C("memo", MK3, { ...flow(f, [[334, { expr: "neutral", facing: -0.7, tilt: 8, mode: "kneel", kneelK: 1 }], [388, { expr: "bored", facing: 0.5, tilt: 3, mode: "kneel", kneelK: 1 }, 10], [440, { expr: "bored", facing: -0.6, tilt: 0, look: -0.5, mode: "kneel", kneelK: 1 }, 12], [478, { expr: "neutral", facing: -0.7, tilt: -2, mode: "kneel", kneelK: 1 }, 12]]),
    mode: "kneel", kneelK: 1, armL: mArm, armLFront: true, propL: f >= 344 && f < 386 ? "rag" : undefined, armR: [[20, 12], [14, 26]], armRFront: true } as FigOpts, { idx: 1 }));
  // HUGO at the wheel, elbow out of the window: laughs with his whole body (440-473), then the line with a thumb at the bus stop
  if (hx < 12 && hx > -36) {
    const hs = hseat3(f);
    const hArmR = armSeq(f, [[334, fixA([[24, 6], [38, 10]])], [474, fixA([[22, -8], [44, -20]]), 6], [496, fixA([[24, 6], [38, 10]]), 6], [500, fixA([[24, 10], [38, 14]]), 3], [504, fixA([[24, 6], [38, 10]]), 3]]);
    const hp: P = f >= 438 && f < 473 ? laughP(f, 438, 0) : {};
    cast.push(driver("hugo", hs, speak(f, 473, 500, { ...flow(f, [[334, { expr: "smug", facing: -0.7, mode: "sit" }], [438, { expr: "mock", facing: -0.5, mode: "sit", headBack: 0.5 }, 5], [473, { expr: "tacheUp", facing: 0.45, mode: "sit", tilt: 4 }, 5], [512, { expr: "smug", facing: -0.7, mode: "sit" }, 8]]), ...hp, mode: "sit", armL: WHEEL_L, armR: hArmR, armRFront: true }), 2));
  }
  // THE BUS QUEUE: six people, each busy (a paper, a lunch pail, a baby-sized bag, a yawn); the front man snaps the paper open
  const QW = ["paperman", "qa", "qe", "qb", "qc", "qd"];
  QW.forEach((w, i) => {
    const p = MX.QUEUE[i], u = Math.sin(f * 0.09 + i * 1.9);
    if (i === 0) { const o = sm(f, 510, 518); cast.push(C(w, p, { ...flow(f, [[334, { expr: "bored", facing: 0.5, tilt: 2 }], [512, { expr: "dismay", facing: 0.15, tilt: 5 }, 6], [560, { expr: "worry", facing: 0.1, tilt: 7 }, 10]]), armR: [[lerp(16, 26, o), 8], [lerp(8, 30, o), 6]], armRFront: true, armL: [[lerp(-16, -26, o), 8], [lerp(-8, -30, o), 6]], armLFront: true } as FigOpts, { idx: 10 })); return; }
    const step = 0.5 * sm(f, 556, 572);
    cast.push(C(w, [p[0] + step, p[1], p[2]], { ...flow(f, [[334, { expr: i % 2 ? "bored" : "neutral", facing: 0.6, tilt: 1.5 * u }], [500 + i * 9, { expr: i === 2 ? "tache" : "bored", facing: 0.5, tilt: -2, look: 0.4 }, 12], [556, { expr: "neutral", facing: 0.7, mode: f >= 556 && f < 572 ? "walk" : "stand", phase: (f - 556) / 12 }, 4], [574, { expr: i % 2 ? "dismay" : "bored", facing: 0.6 }, 6]]),
      propR: ["", "purse", "cane", "basket", "coffeeCup", "balloon"][i] || undefined, armR: i === 4 ? [[20, 4], [12, -12]] : REST_R, armRFront: true, armL: REST_L } as FigOpts, { idx: 10 + i }));
  });
  if (f >= 500 && f < 560) for (let i = 0; i < 3; i++) { const u = ((f - 500) / 30 + i / 3) % 1; fx.push(smokeCard("hx" + i, [hx + 2.2 + u * 1.4, 0.4 + u * 0.5, HZ3], 0.3 + u * 0.5, 0.3 * (1 - u), i)); }
  // the smoke that carries the time jump (the wreck arrives)
  if (f >= 580) fx.push(smokeCard("jump", camPt(3, s, f, 1.2, 0, 0), 2.6, sm(f, 580, 590), 2));
  const focus = follow(f, [[334, PL5], [430, (g) => hd(hseat3(g), 0.75), 20], [515, PAPER, 12]]);
  return { ctl, cast, fx, focus, subj: f < 362 ? null : f < 388 ? "memo" : f < 424 ? null : f < 500 ? "hugo" : f < 516 ? null : "paperman" };
};
lens3([[334, DOF_INSERT], [364, DOF_MS, 10], [410, DOF_MS, 16], [473, DOF_CU, 6], [515, DOF_MS, 10]]);

// ================================================= SHOT 4 (593-839) MEMO'S STREET, evening: the second car
const RX0 = -34, RXP = MX.RUST[0], rustX4 = (f: number) => lerp(RX0, RXP, 1 - Math.pow(1 - lin(f, 585, 655), 2.2)), rustZ4 = (f: number) => lerp(-0.7, -2.05, sm(f, 628, 655));
const PL8: V3 = [RXP + 2.75, 0.47, -2.05], HG: V3 = [-2.0, 0.14, 3.62], ML: V3 = [-8.7, 0, -0.85];
const c4a = F((f) => { const x = rustX4(f), z = rustZ4(f); return cam3([x + 5.3, 1.2, z + 0.75], [x + 0.2, 1.05, z - 0.25], 40); }, 593, 0.0);
const c4b = F(() => cam3([PL8[0] + 2.3, 0.64, PL8[2] + 0.45], PL8, 40), 656, 0.0014);
const c4c = F(() => cam3([-2.75, 1.5, 1.05], [-2.0, 1.4, 3.62], 40), 716, 0.0013, [[750, 0.006, 7]]);
const c4d = F(() => cam3([-6.5, 1.5, 1.2], [-8.85, 1.22, -1.15], 42), 799, 0.0015, [[822, 0.007, 7]]);
SHOT_CAMS[4] = () => [K(593, c4a, 1, true), K(640, glideTo(c4a, 640, c4b, 660, 0.05), 1), K(702, swing(c4b, 702, c4c, 720, 0.3), 1), K(791, swing(c4c, 791, c4d, 799), 1)];
SUN_REF[4] = 620;
const HUGO_PARK: Ctl = { hugoX: MX.HUGOCARPARK[0], hugoZ: MX.HUGOCARPARK[2], hugoBob: 0 };
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const rx = rustX4(f), rz = rustZ4(f), hubT = f - 688;
  const ctl: Ctl = { fleet: -1, ...HUGO_PARK, kerbCars: 1, rustX: rx, rustZ: rz, rustYaw: 0.1 * bump(lin(f, 628, 655)), rustBob: f < 655 ? 0.9 : 0.25 * Math.max(0, 1 - (f - 655) / 20), rustShake: f >= 600 && f < 606 ? 1 : f >= 655 && f < 664 ? 0.8 : 0, rustSmoke: f < 720 ? 1 : 0.5,
    hub: hubT >= 0 ? 1 : 0, hubX: RXP + 1.6 + Math.min(1.5, Math.max(0, hubT) * 0.07), hubZ: -1.0 + Math.min(0.5, Math.max(0, hubT) * 0.02), hubRoll: Math.min(22, Math.max(0, hubT)) * 0.33, hubTip: 1.45 * sm(f, 708, 716), hubY: lerp(0.21, 0.03, sm(f, 708, 716)), night: 0 };
  // MEMO drives the wreck home: bounces at the wheel, flinches at the backfire (600), brakes (645); then walks round the nose
  // and leans on the roof for "Check the plate." (thumb down at the plate on 822)
  if (f < 692) cast.push(driver("memo", seatOf(rx, rz, 1, false, 0.53), flow(f, [[593, { expr: "determined", facing: 0, mode: "sit", tilt: 3 * Math.sin(f * 0.6) }], [600, { expr: "yikes", facing: 0, mode: "sit", tilt: -6 }, 3], [614, { expr: "determined", facing: 0.2, mode: "sit" }, 8], [645, { expr: "strain", facing: 0, mode: "sit", tilt: 6 }, 4], [662, { expr: "smug", facing: 0.3, mode: "sit" }, 10]]), 1));
  else {
    const w = walkPath(4, s, [[RXP + 3.1, 0.14, -3.2], [RXP + 3.3, 0, -1.3], ML], f, 694, 730);
    const lArm = armSeq(f, [[694, fixA(REST_R)], [800, (g) => armTo(4, s, g, ML, [ML[0] - 0.45, 1.58, ML[2] - 0.25], 1, -0.4), 8], [818, fixA([[22, 10], [34, 30]]), 6], [836, fixA([[22, 10], [30, 26]]), 8]]);
    cast.push(C("memo", w.moving || f < 730 ? w.p : ML, speak(f, 822, 842, { ...flow(f, [[694, { expr: "smug", facing: 0.6 }], [732, { expr: "calm", facing: 0.6, tilt: -4 }, 10], [800, { expr: "calm", facing: 0.55, tilt: -9, headTilt: 3 }, 8], [820, { expr: "smug", facing: 0.5, tilt: -9, headTilt: 5 }, 5]]),
      ...(w.moving ? walkO4(w) : {}), armR: lArm, armRFront: true, armL: f >= 804 ? [[-24, -6], [-40, -20]] : REST_L, armLFront: true }) as FigOpts, { idx: 1 }));
  }
  // HUGO leaning on his gate (the fence in front of him): howls, turns an invisible spit over the smoke, wipes a tear
  const hArm = armSeq(f, [[593, fixA([[20, 8], [10, 18]])], [748, (g) => [[26, -2], [40 + 5 * Math.cos(g * 0.8), -12 + 5 * Math.sin(g * 0.8)]] as A2, 6], [782, fixA([[18, -10], [6, -34]]), 6], [796, fixA([[20, 8], [10, 18]]), 8]]);
  const hp: P = f >= 716 && f < 745 ? laughP(f, 716, 1) : f >= 782 && f < 800 ? { shake: 0.5, phase: (f - 782) / 12 } : {};
  cast.push(C("hugo", HG, speak(f, 745, 799, { ...flow(f, [[593, { expr: "smug", facing: -0.6, tilt: -6 }], [660, { expr: "stare", facing: -0.7, tilt: -8 }, 8], [716, { expr: "guffaw", facing: -0.55, tilt: -8, headBack: 0.6 }, 6], [745, { expr: "mock", facing: -0.5, tilt: -10 }, 5], [800, { expr: "smug", facing: -0.6, tilt: -8 }, 10]]),
    ...hp, armR: hArm, armRFront: true, propR: f >= 746 && f < 784 ? "fork" : undefined, armL: [[-22, 6], [-30, 14]], armLFront: true }) as FigOpts, { idx: 2 }));
  // a neighbour in the next doorway laughs along
  cast.push(C("nb2", [3.4, 0.14, 4.2], { ...flow(f, [[593, { expr: "neutral", facing: -0.7 }], [722, { expr: "mock", facing: -0.6, shake: 1, phase: (f - 722) / 12, headBack: 0.4 }, 6], [790, { expr: "smile", facing: -0.7 }, 10]]), armR: [[20, 2], [8, -20]], armRFront: true, propL: "broom" } as FigOpts, { idx: 5 }));
  if (f < 600) fx.push(smokeCard("jump", camPt(4, s, f, 1.2, 0, 0), 2.6, 1 - sm(f, 593, 600), 2));
  if (f >= 600 && f < 610) fx.push(smokeCard("bang", [rx - 2.9, 0.6, rz], 0.5 + (f - 600) * 0.08, 0.9 - (f - 600) / 11, 3));
  const focus = follow(f, [[593, (g) => hd(seatOf(rustX4(g), rustZ4(g), 1, false, 0.53), 0.75)], [660, PL8, 14], [720, hd(HG, 1.3), 14], [799, hd(ML, 1.3), 8]]);
  return { ctl, cast, fx, focus, subj: f < 640 ? "memo" : f < 716 ? null : f < 792 ? "hugo" : f < 799 ? null : "memo" };
};
const walkO4 = (w: { p: V3; facing: number; phase: number; moving: boolean }): P => ({ facing: w.facing * 0.7, mode: w.moving ? "walk" : "stand", phase: w.phase });
lens3([[593, DOF_MS], [656, DOF_INSERT, 10], [716, DOF_CU, 10], [800, DOF_CU, 8]]);
KICKS.push([600 / 30, 3], [655 / 30, 2]);

// ================================================= SHOT 5 (839-1028) THE AVENUE, a clear morning: the fake-out
const CSW: V3 = [AX + 1.0, 0, -3.0], CK: V3 = MX.COPB, CR: V3 = [MX.COUNTER[0] - 1.1, 0.14, MX.COUNTER[2] - 0.55], SL: V3 = [MX.SLUMP[0], 0, MX.SLUMP[2] - 0.35], CL2: V3 = [AX + 6.1, 4.4, -9.85];
const c5a = F((f) => { const k = sm(f, 839, 900); return cam3(lerp3([AX + 4.6, 1.6, -2.0], [AX + 5.2, 2.3, -1.7], k), [AX + 0.6, 1.2, -3.1], 46); }, 900, 0.0008);
const c5b = F(() => cam3([AX + 5.6, 1.95, 2.9], [AX + 5.7, 1.55, 9.2], 50), 908, 0.0012, [[945, 0.006, 7]]);
const c5c = F(() => cam3([AX + 4.2, 5.75, -6.8], [AX + 3.1, 5.65, -10.3], 40), 978, 0.0015, [[995, 0.007, 7]]);
SHOT_CAMS[5] = () => [K(839, c5a, 1, true), K(893, glideTo(c5a, 893, c5b, 912, 0, [0, 0, 0], 0, 0.3), 1), K(960, glideTo(c5b, 960, c5c, 980, 0.6, [0, 0, 0], 0.4, 0.3), 1)];
SUN_REF[5] = 915;
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { avMemo: 0, avNear: 0, bar: 0, jam: 1, dens: 0.07, hole: 0, smog: 0, creep: f * 0.12, kerbCars: 0, tiles: 5, banner: sm(f, 976, 1002), yard: 1, tow: sm(f, 925, 962), count: 7996 + 4 * sm(f, 903, 916) };
  // one cop sweeps the empty avenue
  cast.push(C("cop", CSW, { ...flow(f, [[839, { expr: "proud", facing: 0.5, tilt: 4 }], [870, { expr: "proud", facing: -0.5, tilt: 4 }, 12]]), propR: "broom", armR: [[22 + 6 * Math.sin(f * 0.25), 12], [34 + 12 * Math.sin(f * 0.25), 30]], armRFront: true, armL: [[-10, 10], [6 + 8 * Math.sin(f * 0.25), 16]], armLFront: true } as FigOpts, { idx: 1 }));
  // the checkpoint cop kneels at a stopped car's plate and blows his whistle (915); his partner cranks the counter to 8,000
  cast.push(C("cop2", CK, { ...flow(f, [[839, { expr: "determined", facing: -0.7, tilt: 8, mode: "kneel", kneelK: 1 }], [913, { expr: "angry", facing: -0.6, tilt: 2, mode: "kneel", kneelK: 1 }, 5], [950, { expr: "proud", facing: 0.5, tilt: 0, mode: "kneel", kneelK: 1 }, 10]]), mode: "kneel", kneelK: 1,
    armL: armSeq(f, [[839, (g) => armTo(5, s, g, CK, [MX.STOPPED[0] + 2.75, 0.5, 6.6], -1, -0.6)], [911, fixA([[-18, -2], [-6, -22]]), 5], [935, fixA(REST_L), 10]]), armLFront: true, propL: f >= 911 && f < 935 ? "whistle" : undefined, armR: REST_R } as FigOpts, { idx: 2 }));
  const crk = (g: number): V3 => { const a = -(7996 + 4 * sm(g, 903, 916)) * 0.9; return [MX.COUNTER[0] - 1.32 - 0.12 * Math.cos(a), 1.5 + 0.22 * Math.cos(a) * 0 + 0.12 * Math.sin(a) + 0.18, MX.COUNTER[2] - 0.06]; };
  cast.push(C("clerk", CR, { ...flow(f, [[839, { expr: "determined", back: true }], [946, { back: true, tilt: -5 }, 6]]), back: true, armR: armSeq(f, [[839, (g) => armTo(5, s, g, CR, crk(g), 1, 0, 1, "stand", 6)], [950, fixA([[22, -20], [30, -48]]), 8]]), armRFront: true, armL: REST_L } as FigOpts, { idx: 3 }));
  cast.push(C("drv1", SL, { ...flow(f, [[839, { expr: "worry", facing: 0.5, mode: "sit", tilt: 8, sweat: 1 }], [930, { expr: "dismay", facing: 0.6, mode: "sit", tilt: 12 }, 10]]), mode: "sit", armR: [[14, 4], [4, -16]], armRFront: true, armL: [[-14, 4], [-4, -16]], armLFront: true } as FigOpts, { idx: 4 }));
  // THE MAYOR behind the balustrade: breathes in with his arms wide (975), thumps his chest (995), coughs one small black puff (1015)
  cast.push(C("mayor", MAY, { ...flow(f, [[839, { expr: "proud", facing: 0.3 }], [973, { expr: "beam", facing: 0.25, tilt: -6, headBack: 0.4 }, 6], [993, { expr: "proud", facing: 0.3, tilt: -2 }, 6], [1013, { expr: "strain", facing: 0.3, tilt: 9 }, 3], [1022, { expr: "sheepish", facing: 0.2, tilt: 3 }, 5]]),
    armR: armSeq(f, [[839, fixA(REST_R)], [973, fixA(ARMS.wideR), 8], [991, fixA([[18, 4], [4, 6]]), 4], [995, fixA([[18, 4], [0, 4]]), 2], [999, fixA([[18, 4], [4, 6]]), 3], [1011, fixA([[18, -6], [4, -30]]), 4]]), armRFront: true, armL: armSeq(f, [[839, fixA(REST_L)], [973, fixA(ARMS.wideL), 8], [993, fixA([[-24, 10], [-12, 22]]), 8]]), armLFront: true } as FigOpts, { idx: 5 }));
  cast.push(C("qc", CL2, { ...flow(f, [[839, { expr: "neutral", facing: -0.5, tilt: 10 }], [1002, { expr: "smile", facing: -0.6, tilt: 6 }, 8]]), armR: [[20, 14], [26, 30]], armRFront: true, armL: [[-20, 14], [-26, 30]], armLFront: true } as FigOpts, { idx: 6 }));
  if (f >= 1013 && f < 1028) fx.push(smokeCard("cough2", [MAY[0] + 0.3, 5.8, MAY[2] + 0.5], 0.25 + (f - 1013) * 0.03, 0.8 - (f - 1013) / 20, 1));
  if (f >= 945 && f < 953) fx.push(dustCard("flip", [MX.COUNTER[0], MX.COUNTER[1] - 0.2, MX.COUNTER[2] - 0.2], 0.4, 0.4 - (f - 945) / 20, 4));
  const focus = follow(f, [[839, hd(CSW, 1.2)], [908, [MX.COUNTER[0], MX.COUNTER[1] - 0.2, MX.COUNTER[2]], 14], [978, hd(MAY, 1.25), 16]]);
  return { ctl, cast, fx, focus, subj: f < 900 ? null : f < 965 ? "cop2" : "mayor" };
};
lens3([[839, DOF_WS], [908, DOF_FS, 10], [978, DOF_CU, 12]]);

// ================================================= SHOT 6 (1028-1098) MEMO'S STREET AT NIGHT: Hugo stares
const HB: V3 = [-8.9, 0, -0.15];
const c6a = F(() => cam3([-12.4, 1.72, 1.15], [-6.4, 0.95, -1.5], 46), 1028, 0.0014, [[1055, 0.005, 7]]);
SHOT_CAMS[6] = () => [K(1028, c6a, 1, true)];
SUN_REF[6] = 1030;
const PARKED: Ctl = { fleet: -1, ...HUGO_PARK, rustX: RXP, rustZ: -2.05, kerbCars: 1 };
SHOT_ACTS[6] = (f, s) => {
  const cast: CastPlace[] = [];
  const ctl: Ctl = { ...PARKED, night: 1, rustSmoke: 0.5 };
  const fx: FxSpec[] = []; if (f >= 1089) fx.push(smokeCard("jump", camPt(6, s, f, 1.2, 0, 0), 2.6, sm(f, 1089, 1097), 2));
  // HUGO from behind: scratches his head (1035), counts the two cars on his fingers (1055, 1066), drops his arms (1085)
  cast.push(C("hugo", HB, { ...flow(f, [[1028, { expr: "neutral", back: true, tilt: 0 }], [1035, { back: true, tilt: 7, headTilt: 8 }, 8], [1055, { back: true, tilt: -3, headTilt: -4 }, 8], [1066, { back: true, tilt: -6, headTilt: 5 }, 6], [1085, { back: true, tilt: 2, headTilt: 10 }, 10]]), back: true,
    armR: armSeq(f, [[1028, fixA(REST_R)], [1033, (g) => [[18, -22], [6 + 3 * Math.sin(g * 0.9), -52]] as A2, 7], [1052, (g) => armTo(6, s, g, HB, [RXP + 2.2, 1.3, -1.4], 1, 0), 8], [1063, (g) => armTo(6, s, g, HB, [-4.6, 1.3, -1.4], 1, 0), 6], [1083, fixA(ARMS.palmR), 8]]), armRFront: true, armL: armSeq(f, [[1028, fixA(REST_L)], [1083, fixA(ARMS.palmL), 8]]), armLFront: true } as FigOpts, { idx: 1 }));
  return { ctl, cast, fx, focus: follow(f, [[1028, [RXP + 1, 1.0, -2.05]]]), subj: "hugo" };
};
lens3([[1028, DOF_FS]]);

// ================================================= SHOT 7 (1098-1162) FRIDAY MORNING: three neighbours bring wrecks home
// (the time jump is a dissolve inside the rust car's exhaust; the new framing holds 1.2 s, then eases forward)
const W0: V3 = [1.3, 0, -2.05], W2: V3 = [13, 0, -2.05], W1: V3 = [19, 0, -2.05];
const c7b = F((f) => { const k = sm(f, 1134, 1162); return cam3([-8.5 + 0.9 * k, 1.7, 0.9], [1.3 + 0.9 * k, 0.9, -1.2], 50); }, 1134, 0.0012);
SHOT_CAMS[7] = () => [K(1098, c7b, 1, true)];
SUN_REF[7] = 1125;
const w0x = (f: number) => lerp(-2.4, W0[0], sm(f, 1090, 1136)), w0z = (f: number) => lerp(-0.25, -2.05, sm(f, 1118, 1136));
const w2x = (f: number) => lerp(36, W2[0], sm(f, 1094, 1138)), w2z = (f: number) => lerp(-0.4, -2.05, sm(f, 1124, 1138));
const w1x = (f: number) => lerp(46, W1[0], sm(f, 1104, 1148)), w1z = (f: number) => lerp(-0.4, -2.05, sm(f, 1134, 1148));
const NB1R: V3 = [-1.55, 0, -0.85];
SHOT_ACTS[7] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const hubT = f - 1148;
  const ctl: Ctl = { fleet: -1, rustX: RXP, rustZ: -2.05, kerbCars: 1, night: 0, rustSmoke: 0.3, w0X: w0x(f), w0Z: w0z(f), w0Yaw: -0.12 * bump(lin(f, 1118, 1136)),
    w2X: w2x(f), w2Z: w2z(f), w2Yaw: Math.PI, w2Smoke: f < 1140 ? 1 : 0.3, w2Bob: f < 1138 ? 0.7 : 0, w1X: w1x(f), w1Z: w1z(f), w1Yaw: Math.PI, w1Smoke: 1, w1Bob: f < 1148 ? 0.8 : 0,
    hub: hubT >= 0 ? 1 : 0, hubX: W1[0] - 2.2 - Math.max(0, hubT) * 0.12, hubZ: -0.9, hubRoll: Math.max(0, hubT) * 0.4, hubY: 0.21 };
  // 1 pushes his wreck up the lane and into the kerb (seen from behind), then throws both arms up
  const pushing = f < 1132, px = w0x(f) - 3.0;
  const np: V3 = pushing ? [px, 0, w0z(f)] : lerp3([W0[0] - 3.0, 0, w0z(1132)], NB1R, sm(f, 1132, 1142));
  cast.push(C("nb1", np, { ...flow(f, [[1098, { expr: "strain", back: true, tilt: 14 }], [1134, { expr: "proud", facing: 0.5, tilt: 0 }, 6], [1144, { expr: "joy", facing: 0.4, tilt: -4 }, 6]]),
    back: pushing, mode: f < 1142 ? "walk" : "stand", phase: (f - 1086) / 10,
    armR: pushing ? [[16, -2], [22, -20]] : [[22, -22], [30, -50]], armRFront: true, armL: pushing ? [[-16, -2], [-22, -20]] : [[-22, -22], [-30, -50]], armLFront: true } as FigOpts, { idx: 2 }));
  // 2 and 3 roll in from the far end, one behind the other, and swing into the kerb; the last one loses a hubcap
  cast.push(driver("nb2", seatOf(w2x(f), w2z(f), -1, false, 0.53), flow(f, [[1098, { expr: "determined", facing: -0.5, mode: "sit" }], [1140, { expr: "joy", facing: -0.3, mode: "sit" }, 6]]), 3));
  cast.push(driver("nb3", seatOf(w1x(f), w1z(f), -1, false, 0.53), flow(f, [[1098, { expr: "determined", facing: -0.5, mode: "sit" }], [1150, { expr: "sheepish", facing: -0.2, mode: "sit", tilt: 5 }, 5]]), 4));
  if (f < 1106) fx.push(smokeCard("jump", camPt(7, s, f, 1.2, 0, 0), 2.6, 1 - sm(f, 1098, 1106), 2));
  return { ctl, cast, fx, focus: follow(f, [[1098, (g) => [w0x(g) - 3, 1.0, -0.6]], [1136, [W0[0], 0.9, -1.6], 14]]), subj: "nb1" };
};
lens3([[1098, DOF_FS]]);

// ================================================= SHOT 8 (1162-1287) CHRISTMAS DUSK: the smoke wins the race
// (a time-jump dissolve in the same framing, held 1.2 s, then the camera drops to the chalk line)
const KF: V3 = [2.3, 0, 0.95];
const w3x = (f: number) => lerp(-12.5, -4.5, lin(f, 1162, 1272)), puffX = (f: number) => lerp(w3x(f) - 3.1, 3.0, sm(f, 1212, 1266));
const c8a = F(() => { const c = c7b(1162); return cam3(c.pos, c.look, 50); }, 1162, 0.0012);
const c8b = F(() => cam3([5.5, 1.3, 1.15], [0.5, 0.8, -0.1], 56), 1240, 0.0012, [[1262, 0.006, 7]]);
SHOT_CAMS[8] = () => [K(1162, c8a, 1, true), K(1200, glideTo(c8a, 1200, c8b, 1240, 0.3, [0, 0, 0], 0, 0.3), 1), K(1280, (f: number) => g89(f), 1)];
SUN_REF[8] = 1170;
const STREET8: Ctl = { fleet: -1, rustX: RXP, rustZ: -2.05, kerbCars: 1, w0X: W0[0], w0Z: -2.05, w1X: W1[0], w1Z: -2.05, w1Yaw: Math.PI, w2X: W2[0], w2Z: -2.05, w2Yaw: Math.PI, xmas: 1, night: 0.55 };
SHOT_ACTS[8] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { ...STREET8, w3X: w3x(f), w3Z: -0.3, w3Smoke: 1, w3Bob: 0.8, race: f >= 1204 ? 1 : -1, raceX: puffX(f), raceZ: -0.3, rustSmoke: 0.3, w0Smoke: 0.3, w2Smoke: 0.3, bulb: 1 };
  cast.push(driver("nb2", seatOf(w3x(f), -0.3, 1, false, 0.53), flow(f, [[1162, { expr: "determined", facing: 0.4, mode: "sit" }], [1240, { expr: "worry", facing: 0.3, mode: "sit", tilt: 4, look: 0.5 }, 8], [1264, { expr: "dismay", facing: 0.2, mode: "sit", tilt: 8 }, 5]]), 1));
  // nb1 leans on his parked wreck and watches; the kid waves the finish flag as the smoke puff crosses the chalk line first
  cast.push(C("nb1", NB1R, { ...flow(f, [[1162, { expr: "smile", facing: -0.6, tilt: -6 }], [1262, { expr: "mock", facing: -0.5, tilt: -6, headBack: 0.4 }, 5]]), armR: [[22, 6], [30, 14]], armRFront: true, armL: [[-24, -4], [-40, -14]], armLFront: true } as FigOpts, { idx: 3 }));
  cast.push(C("kid", KF, { ...flow(f, [[1162, { expr: "joy", facing: 0.6 }], [1262, { expr: "guffaw", facing: 0.5, headBack: 0.5 }, 4]]), propR: "pennant", armR: [[22, -22 + 6 * Math.sin(f * 0.5)], [34 + 10 * Math.sin(f * 0.5), -52]], armRFront: true, armL: REST_L, ...(f >= 1262 ? { mode: "hop", lift: bump(((f - 1262) % 12) / 12) } : {}) } as FigOpts, { idx: 2 }));
  void s;
  if (f >= 1204) { const px = puffX(f); fx.push(puffCard("race", [px, 0.8 + 0.1 * Math.sin(f * 0.5), -0.3], 1.7 + 0.12 * Math.sin(f * 0.7), 1)); fx.push(smokeCard("race2", [px - 1.1, 0.6, -0.3], 1.3, 0.8, 3)); }
  return { ctl, cast, fx, focus: follow(f, [[1162, [W0[0], 0.9, -1.6]], [1240, (g) => [w3x(g) + 2.4, 0.8, -0.3], 20]]), subj: f < 1238 ? null : "kid" };
};
lens3([[1162, DOF_FS], [1240, DOF_MS, 16]]);

// ================================================= SHOT 9 (1287-1427) MEMO'S CARPORT: the week board
const MS: V3 = [MX.STOOL[0], 0.14, MX.STOOL[2]], WK = MX.WEEK;
const TOY_F: [number, number][] = [[1308, 1321], [1368, 1379], [1390, 1397], [1397, 1404], [1404, 1411]];
const toyU = (k: number, f: number) => sm(f, TOY_F[k][0], TOY_F[k][1]);
const c9a = F(() => cam3([5.3, 1.5, -7.15], [5.25, 1.42, -9.3], 50), 1296, 0.0014, [[1321, 0.006, 7]]);
const c9b = F(() => fitH([body(MS, 0.1, 1.7, 0.42), [WK, -0.55, 0.5, 0.98]], 12, 4, 50, 0.27, 0.15), 1384, 0.0012);
const c9w = F((f) => { const k = sm(f, 1376, 1416); return cam3(lerp3([4.65, 1.45, -6.3], [5.6, 1.45, -5.4], k), lerp3([4.8, 1.45, -9.3], [5.6, 1.45, -9.3], k), 46 - 2 * k); }, 1300, 0.0);
const g89 = glideTo(c8b, 1280, c9w, 1300, 0.3, [0, 0, 0], 0.3);
SHOT_CAMS[9] = () => [K(1287, g89, 1), K(1416, (f: number) => g910(f), 1)];
SUN_REF[9] = 1300;
SHOT_ACTS[9] = (f, s) => {
  const cast: CastPlace[] = [];
  const ctl: Ctl = { ...STREET8, bulb: 1, w0X: 24.5, w3X: -4.5, w3Z: -0.3, w3Smoke: 0.4 };
  for (let k = 0; k < 5; k++) ctl["toy" + k] = toyU(k, f);
  // MEMO on the stool: taps the MON row (1299), carries the rust toy car into MON (1308-1321), taps his own chest on "driver"
  // (1357), sets the green car under TUE (1379), then fills WED-FRI in one sweep and leans back with his arms crossed (1415)
  let hold = -1; for (let k = 0; k < 5; k++) if (f >= TOY_F[k][0] - 6 && f <= TOY_F[k][1] + 2) hold = k;
  const hand = (g: number): V3 => { if (hold >= 0) { const p = toyAt(hold, toyU(hold, g)); return [p[0] - 0.02, p[1] + 0.1, p[2] + 0.04]; } return [WK[0] - 1.0, 1.05, WK[2] + 0.4]; };
  const mArm = armSeq(f, [[1287, fixA([[22, 14], [34, 22]])], [1294, (g) => armTo(9, s, g, MS, [WK[0] - 0.74, WK[1] + 0.2, WK[2] + 0.08], 1, 0.6, 1, "sit", 6), 6], [1302, (g) => armTo(9, s, g, MS, hand(g), 1, 0.6, 1, "sit", 6), 6], [1326, fixA([[22, 14], [34, 22]]), 8], [1352, fixA([[16, 4], [2, 2]]), 6], [1362, (g) => armTo(9, s, g, MS, hand(g), 1, 0.6, 1, "sit", 6), 6], [1413, fixA([[14, 6], [-10, 8]]), 8]]);
  cast.push(C("memo", MS, { ...flow(f, [[1287, { expr: "sly", facing: 0.7, mode: "sit", tilt: -4 }], [1321, { expr: "smug", facing: 0.7, mode: "sit", tilt: -6 }, 6], [1352, { expr: "sly", facing: 0.35, mode: "sit", tilt: 0 }, 8], [1368, { expr: "determined", facing: 0.7, mode: "sit", tilt: -6 }, 8], [1413, { expr: "smug", facing: 0.4, mode: "sit", tilt: 6 }, 8]]),
    mode: "sit", sitLeg: 0.85, armR: mArm, armRFront: true, armL: f >= 1413 ? [[-14, 6], [10, 8]] : [[-20, 12], [-14, 26]], armLFront: f >= 1413 } as FigOpts, { idx: 1 }));
  return { ctl, cast, fx: [], focus: follow(f, [[1287, [WK[0] - 0.6, WK[1], WK[2] + 0.4]]]), subj: f < 1300 ? null : "memo" };
};
lens3([[1287, DOF_MS]]);
KEY_PUNCH.push(1299);

// ================================================= SHOT 10 (1427-1548) MEMO'S FRONT STEP: the sneakers and the old boots
const KS: V3 = [1.1, 0.14, -4.42], MD: V3 = [-0.2, 0.14, -4.6], BT: V3 = [1.55, 0.3, -4.7];
const KW: V3[] = [[1.1, 0.14, -4.4], [1.05, 0.14, -3.7], [0.9, 0.14, -3.2]];
const kidAt = (f: number) => polyAt(KW, lin(f, 1497, 1546)).p;
const c10a = F((f) => { const k = sm(f, 1438, 1548); return cam3([0.5, 1.0, -1.3 - 0.2 * k], [0.5, 0.95, -5.0], 58); }, 1438, 0.0);
const c10b = F((f) => { const p = kidAt(f); return cam3([p[0] + 3.0, 0.9, p[2] + 1.4], [p[0] - 0.2, 0.75, p[2]], 50); }, 1500, 0.0);
const g910 = swing(c9w, 1416, c10a, 1438, 0.1);
SHOT_CAMS[10] = () => [K(1427, g910, 1)]; void c10b;
SUN_REF[10] = 1440;
SHOT_ACTS[10] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const TAGP: V3 = [MX.SHELF[0] + 0.02, 0.98, MX.SHELF[2] + 0.13];
  const tagAt = (g: number): V3 => lerp3([MD[0] + 0.3, 1.0, MD[2] + 0.1], TAGP, sm(g, 1430, 1440));
  const booted = f >= 1482;
  const ctl: Ctl = { ...STREET8, bulb: 1, w0X: 24.5, w3X: -2.2, w3Z: 2.2, w3Smoke: 0.3, toy0: 1, toy1: 1, toy2: 1, toy3: 1, toy4: 1, tag: 1, tagX: tagAt(f)[0], tagY: tagAt(f)[1], tagZ: tagAt(f)[2], boots: booted ? 0 : 1, bootX: lerp(BT[0], KS[0] + 0.05, sm(f, 1462, 1478)), bootY: lerp(0.3, 0.16, sm(f, 1462, 1478)), bootZ: lerp(BT[2], KS[2] + 0.42, sm(f, 1462, 1478)) };
  // MEMO hangs the NOT ON MONDAYS tag on the sneakers (1430-1440), then leans on the wall with one hand and watches
  cast.push(C("memo", MD, { ...flow(f, [[1427, { expr: "determined", facing: 0.6, tilt: -4 }], [1442, { expr: "smug", facing: 0.6, tilt: -8 }, 8], [1484, { expr: "neutral", facing: 0.7, tilt: -6, look: 0.4 }, 10], [1500, { expr: "dismay", facing: 0.8, tilt: -3 }, 5], [1524, { expr: "smile", facing: 0.8, tilt: -6 }, 12]]),
    armR: armSeq(f, [[1427, (g) => armTo(10, s, g, MD, [tagAt(g)[0], tagAt(g)[1] + 0.02, tagAt(g)[2]], 1, 0.6)], [1446, fixA([[24, -8], [40, -26]]), 10]]), armRFront: true, armL: [[-24, 12], [-12, 24]], armLFront: true } as FigOpts, { idx: 1 }));
  // THE KID sits on the step, drags the old boots over (1458-1478), pulls them on (1478-1492), jumps up and stomps out (1497-1548)
  const seated = f < 1494;
  const bootHand = (g: number): V3 => [lerp(BT[0], KS[0] + 0.05, sm(g, 1462, 1478)) + 0.1, lerp(0.56, 0.42, sm(g, 1462, 1478)), lerp(BT[2], KS[2] + 0.42, sm(g, 1462, 1478))];
  const kArm = armSeq(f, [[1427, fixA([[16, 16], [12, 30]])], [1452, (g) => armTo(10, s, g, KS, bootHand(g), 1, 0.4, 0.82, "sit", 6), 8], [1480, (g) => [[14, 22], [8 + 3 * Math.sin(g * 0.9), 40 - 4 * Math.abs(Math.sin(g * 0.9))]] as A2, 4], [1492, fixA([[20, 2], [30, -16]]), 4]]);
  const kp = seated ? KS : kidAt(f);
  const hop = f >= 1494 && f < 1500 ? bump((f - 1494) / 6) : 0;
  cast.push(C(booted ? "kidB" : "kid", [kp[0], kp[1] + (seated ? 0 : 0), kp[2]], { ...flow(f, [[1427, { expr: "bored", facing: -0.5, tilt: 6 }], [1452, { expr: "sly", facing: 0.6, tilt: 10 }, 8], [1480, { expr: "strain", facing: 0.3, tilt: 14 }, 4], [1494, { expr: "determined", facing: 0.8, tilt: -4 }, 3], [1528, { expr: "joy", facing: 0.8, tilt: -4 }, 6]]),
    mode: seated ? "sit" : hop > 0 ? "hop" : "walk", lift: hop, phase: seated ? 0 : (f - 1497) / 9.5, facing: seated ? undefined : 0.25, bob: 0.07, armR: kArm, armRFront: true, armL: seated ? [[-16, 16], [-12, 30]] : undefined } as FigOpts, { idx: 2 }));
  if (!seated) for (const st of [1503, 1512, 1522, 1531]) if (f >= st && f < st + 8) { const p = kidAt(st); fx.push(dustCard("stomp" + st, [p[0], p[1] + 0.06, p[2] + 0.1], 0.3 + (f - st) * 0.03, 0.5 - (f - st) / 16, st % 5)); }
  return { ctl, cast, fx, focus: follow(f, [[1427, [MX.SHELF[0], 1.0, MX.SHELF[2]]], [1456, hd(KS, 0.75), 12]]), subj: f < 1450 ? "memo" : f < 1500 ? "kid" : "memo" };
};
lens3([[1427, DOF_MS]]);
KICKS.push([1503 / 30, 1.5], [1512 / 30, 1.5], [1522 / 30, 1.5], [1531 / 30, 1.5]);

// ================================================= SHOT 11 (1548-1692) THE FOOTBRIDGE, smog sunset: 325,000
const EC: V3 = [AX + 26.7, 5.2, 1.0], TC: V3 = [AX + 27.22, 6.3, 0.72];
const c11a = F((f) => { const k = sm(f, 1548, 1619); return cam3([TC[0] + 1.95 - 0.3 * k, 6.5, 1.12], [AX + 26.9, 6.44, 0.88], 40); }, 1548, 0.0);
const c11b = F(() => cam3([AX + 29.4, 6.6, 1.5], [AX + 26.75, 6.48, 0.92], 40), 1606, 0.0014);
const c11c = F((f) => { const k = sm(f, 1619, 1688); return cam3(lerp3([AX + 31, 7.6, 2.2], [AX + 37, 10.4, 3.6], k), lerp3([AX + 20, 5.5, 0], [AX - 24, 1.2, -2.6], k), 52); }, 1688, 0.0);
SHOT_CAMS[11] = () => [K(1548, c11a, 1, true), K(1619, glideTo(c11a, 1619, c11c, 1640), 1)]; void c11b;
SUN_REF[11] = 1650;
SHOT_ACTS[11] = (f, s) => {
  const cast: CastPlace[] = [];
  const n = 324997 + (f >= 1553 ? 1 : 0) + (f >= 1561 ? 1 : 0) + (f >= 1569 ? 1 : 0);
  const press = Math.max(bump((f - 1550) / 6), bump((f - 1558) / 6), bump((f - 1566) / 6));
  const ctl: Ctl = { avMemo: 0, avNear: 0, bar: 0, jam: 1, dens: 1, hole: 0, smog: 1, smogOrd: 1, fleetX: 118, creep: f * 0.03, kerbCars: 0, tiles: 5, banner: 0, yard: 0, air: 0, airJit: 1, tc: 1, tcX: TC[0], tcY: TC[1] - 0.01 * press, tcZ: TC[2], tcRY: Math.PI / 2 - 0.25, tcN: n };
  // THE ECONOMIST leans on the rail, clicks the tally counter three times, pushes his glasses up, then stares at the jam
  cast.push(C("econ", EC, { ...flow(f, [[1548, { expr: "neutral", facing: 0.5, tilt: 8 }], [1572, { expr: "shock", facing: 0.4, tilt: 2 }, 4], [1600, { expr: "dismay", facing: 0.3, tilt: 5 }, 10], [1640, { expr: "worry", facing: -0.6, tilt: 3, look: -0.5 }, 12]]),
    armR: armSeq(f, [[1548, (g) => armTo(11, s, g, EC, [TC[0] - 0.02, TC[1] - 0.1, TC[2] + 0.05], 1, 0.4)], [1640, fixA([[22, 10], [34, 16]]), 12]]), armRFront: true, propL: "clipboard", armL: armSeq(f, [[1548, fixA([[-20, 10], [-26, 22]])], [1582, fixA([[-16, -10], [-2, -34]]), 7], [1596, fixA([[-20, 10], [-26, 22]]), 8]]), armLFront: true } as FigOpts, { idx: 1 }));
  return { ctl, cast, fx: [], focus: follow(f, [[1548, TC], [1640, [AX + 6, 1, -2], 20]]), subj: f < 1625 ? "econ" : null };
};
lens3([[1548, DOF_CU], [1640, DOF_WS, 18]]);


// ================================================= SHOT 12 (1692-1943) MEMO'S STREET, dusk to blue hour: Saturdays too
const MB: V3 = [-1.9, 0, -1.05], H3: V3 = [-2.2, 0, 2.0], HH: V3 = [0.25, 0, 0.8], WKR: V3 = [10.55, 1.25, -2.85], SATP: V3 = [10.98, 3.12, -3.36], MR: V3 = [2.15, 0.14, -4.65], HOOK3: V3 = [2.89, 1.44, -5.1];
const c12a = F((f) => { const k = sm(f, 1692, 1784); return cam3([-4.95 + 0.2 * k, 1.5, -0.2], [0, 1.2, -0.34], 68); }, 1692, 0.0);
const c12b = F(() => cam3([-1.5, 1.45, -0.2], [0.55, 1.15, 2.1], 46), 1760, 0.0012);
const c12c = F(() => cam3([10.2, 1.9, 3.0], [10.12, 3.0, -3.4], 54), 1800, 0.001, [[1828, 0.005, 7]]);
const c12d = F(() => cam3([4.3, 1.5, -2.5], [2.42, 1.44, -4.9], 48), 1906, 0.0015, [[1921, 0.007, 7]]);
SHOT_CAMS[12] = () => [K(1692, c12a, 1, true), K(1784, swing(c12a, 1784, c12c, 1804, 0.5), 1), K(1884, glideTo(c12c, 1884, c12d, 1908, 0, [0, 0, 0], 0.3, 0.3), 1)];
SUN_REF[12] = 1700;
SHOT_ACTS[12] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const satU = sm(f, 1820, 1846), satP = lerp3([WKR[0] + 0.3, 2.35, WKR[2] + 0.1], SATP, satU);
  const ctl: Ctl = { ...STREET8, xmas: 0, night: lerp(0.55, 1, sm(f, 1780, 1900)), w0X: 24.5, w3X: H3[0], w3Z: H3[2], w3Smoke: 0.5, rustSmoke: 0, w0Smoke: 0, w2Smoke: 0, bulb: 1, toy0: 1, toy1: 1, toy2: 1, toy3: 1, toy4: 1, tag: 1, ladder: 1, sat: f >= 1806 ? 1 : 0, satX: satP[0], satY: satP[1], satZ: satP[2], key2: f >= 1921 ? 1 : 0 };
  // MEMO sits on his bonnet with a bread roll: a bite (1700), a shrug with both palms on "cheater" (1739); later he walks to the
  // key rack and hangs the third key on "too" (1921), then smirks
  if (f < 1800) cast.push(C("memo", MB, { ...flow(f, [[1692, { expr: "calm", facing: 0.5, mode: "sit", tilt: 3 }], [1700, { expr: "smile", facing: 0.5, mode: "sit", tilt: 6 }, 5], [1737, { expr: "calm", facing: 0.3, mode: "sit", tilt: -3 }, 6], [1760, { expr: "calm", facing: 0.6, mode: "sit", look: 0.5 }, 10]]),
    mode: "sit", sitLeg: 1.1, propR: "bread", armR: armSeq(f, [[1692, fixA([[20, 8], [26, 14]])], [1696, fixA([[18, -2], [6, -18]]), 5], [1710, fixA([[20, 8], [26, 14]]), 8], [1735, fixA(AR.shrugR), 6], [1752, fixA([[20, 8], [26, 14]]), 8]]), armRFront: true, armL: armSeq(f, [[1692, fixA([[-20, 12], [-26, 22]])], [1735, fixA(AR.shrugL), 6], [1752, fixA([[-20, 12], [-26, 22]]), 8]]), armLFront: true } as FigOpts, { idx: 1 }));
  else {
    const w = walkPath(12, s, [[1.0, 0.14, -3.6], [1.7, 0.14, -4.3], MR], f, 1880, 1904);
    cast.push(C("memo", w.p, { ...flow(f, [[1800, { expr: "bored", facing: 0.7 }], [1906, { expr: "determined", facing: 0.7, tilt: -4 }, 8], [1921, { expr: "smug", facing: 0.45, tilt: -6, headTilt: 4 }, 5]]), ...(w.moving ? walkO4(w) : {}),
      armR: armSeq(f, [[1800, fixA([[20, 6], [28, 4]])], [1908, (g) => armTo(12, s, g, MR, HOOK3, 1, 0.6), 10], [1924, fixA(AR.hipR), 8]]), armRFront: true, propR: f < 1921 ? "keys" : undefined, armL: f >= 1924 ? AR.hipL : REST_L, armLFront: true } as FigOpts, { idx: 1 }));
  }
  // HUGO bent over the hood of his own wreck with a fork: turns a sausage, counts on his fingers, glances over at Memo
  cast.push(C("hugo", HH, { ...flow(f, [[1692, { expr: "determined", facing: 0.6, tilt: 14 }], [1771, { expr: "worry", facing: 0.4, tilt: 10 }, 8], [1782, { expr: "sheepish", facing: -0.6, tilt: 4, look: -0.5 }, 8]]),
    propR: "fork", armR: armSeq(f, [[1692, (g) => [[22, 14], [32 + 4 * Math.sin(g * 0.4), 28]] as A2], [1769, fixA([[20, -4], [28, -22]]), 6], [1782, fixA([[22, 14], [32, 28]]), 8]]), armRFront: true, propL: "drumstick", armL: [[-20, 12], [-30, 24]], armLFront: true } as FigOpts, { idx: 2 }));
  // THE CITY WORKER on the ladder (back to us): lifts the SAT plate into place (1820-1846) and bolts it on with a wrench (1872-1900)
  cast.push(C("worker", WKR, { ...flow(f, [[1692, { expr: "neutral", back: true }], [1846, { back: true, tilt: -5 }, 8], [1872, { back: true, tilt: 4 }, 8]]), back: true,
    armR: armSeq(f, [[1692, fixA([[20, 4], [30, -2]])], [1806, (g) => { const u = sm(g, 1820, 1846), p = lerp3([WKR[0] + 0.3, 2.35, WKR[2] + 0.1], SATP, u); return armTo(12, s, g, WKR, [p[0], p[1] - 0.2, p[2] + 0.06], 1, 0, 1, "stand", 6); }, 8], [1866, (g) => { const a = g * 0.55; return armTo(12, s, g, WKR, [SATP[0] + 0.1 * Math.cos(a), SATP[1] + 0.22 + 0.06 * Math.sin(a), SATP[2] + 0.08], 1, 0, 1, "stand", 6); }, 6], [1902, fixA([[20, 4], [30, -2]]), 10]]), armRFront: true, propR: f >= 1866 && f < 1902 ? "wrench" : undefined,
    armL: [[-20, -10], [-24, -34]], armLFront: true } as FigOpts, { idx: 3 }));
  void fx;
  return { ctl, cast, fx, focus: follow(f, [[1692, hd(MB, 1.3)], [1760, hd(HH, 1.2), 20], [1804, SATP, 16], [1908, hd(MR, 1.3), 16]]), subj: f < 1784 ? "memo" : f < 1900 ? null : "memo" };
};
void c12b;
lens3([[1692, DOF_FS], [1804, DOF_FS, 14], [1908, DOF_CU, 14]]);
