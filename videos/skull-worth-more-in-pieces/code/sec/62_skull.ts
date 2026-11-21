// =====================================================================================================================
// "The Skull That Was Worth More in Pieces" (2026-11-20), master prompt v24. Plan: /home/claude/p8/checkpoints/CP2_skull_plan.md
// Eight story shots in one connected Java set: the station (home base), the riverbank, the shed + village lane, the porch.
// Hard cuts at 300, 760, 1063, 1264; shape-match dissolves at 455 (basket) and 1453 (tray -> plate); the sunrise dissolve at
// 1583. Every line is one physical object: the skull, the hammer, the 12 coins, the sign, the tally board, the two shards at the
// lamp, the 100 bag, the tin, the bicycle, the counting tray, the papaya, the 3000-piece heap and lid, the repainted sign, the
// glued skull. Acting: deliberate moves 10-20 f, reactions 2-4 f, strikes 1-3 f with a smear, hand-offs reach / grip / carry /
// release with the prop on the hand every frame; the life layer (97_life) breathes every frame.
// Framings are solved by fit() (every subject inside the frame by construction) and were checked with tools/pj.py.
const HY = 1.32;   // head-centre height of an adult card
const hd = (p: V3, y = HY): V3 => [p[0], p[1] + y, p[2]];
const TAU = Math.PI * 2;
const SMASH = JV.SMASH, TRAY = JV.TRAY, SIGN = JV.SIGN, LAMP = JV.LAMP;
const SKTOP = (p: V3): V3 => [p[0], p[1] + 0.13, p[2]];
/** a hammer strike: raised arm (wind-up from f0), the blow lands on T at fs over 3 frames, recovers to the side by f1 */
const HAM_UP: A2 = [[24, -34], [34, -66]], HAM_LOW: A2 = [[24, 12], [34, 30]];
const strikeArm = (id: number, s: SetDef, f: number, P: V3, T: V3, f0: number, fs: number, f1: number, face = 0, mode = "stand"): A2 =>
  armSeq(f, [[Math.min(0, f0 - 1), fixA(HAM_LOW)], [f0, fixA(HAM_UP), Math.max(6, Math.min(12, fs - f0 - 5))], [fs, (g) => armTo(id, s, g, P, T, 1, face, 1, mode), 3], [fs + 10, fixA(HAM_LOW), Math.max(8, f1 - fs - 10)]]);
/** repeated hammering (kids, villagers): period n frames, phase offset o; the blow lands at the bottom */
const hamLoop = (id: number, s: SetDef, f: number, P: V3, T: V3, n: number, o: number, mode = "stand", sc = 1): A2 => {
  const u = ((((f + o) % n) + n) % n) / n, down = armTo(id, s, f, P, T, 1, 0, sc, mode);
  const k = u < 0.7 ? Math.sin((u / 0.7) * Math.PI * 0.5) : 1 - (u - 0.7) / 0.3;   // slow lift, fast drop
  return [[lerp(down[0][0], HAM_UP[0][0], k), lerp(down[0][1], HAM_UP[0][1], k)], [lerp(down[1][0], HAM_UP[1][0], k), lerp(down[1][1], HAM_UP[1][1], k)]];
};
/** hammer smear streak during a strike */
const strikeSmear = (key: string, a: V3, b: V3, f: number, fs: number): FxSpec[] => (f >= fs - 3 && f <= fs ? [smear(key + f, a, b, 0.7)] : []);
/** a bone chip card */
const chipCard = (key: string, p: V3, w = 0.05, rot = 0): FxSpec => ({ kind: "card", key, pos: p, w, h: w * 0.7, rot, cw: 32, ch: 24,
  draw: (pp) => { const g = pp.g; g.fillStyle = "#d8c49a"; g.strokeStyle = "#5a3a20"; g.lineWidth = 3; g.beginPath(); g.moveTo(3, 18); g.lineTo(16, 3); g.lineTo(29, 14); g.lineTo(18, 21); g.closePath(); g.fill(); g.stroke(); } });
/** dust + bone chips at an impact */
const chips = (key: string, p: V3, age: number, n = 8, dust = 1): FxSpec[] => {
  if (age < 0 || age > 12) return [];
  const out: FxSpec[] = dust > 0 ? [dustCard(key + "d", [p[0], p[1] + 0.05, p[2] + 0.05], (0.3 + age * 0.03) * dust, Math.max(0, 0.45 - age / 18), 3)] : [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + 0.3, v = 0.035 + 0.02 * (i % 3), t = age;
    out.push(chipCard("chip" + key + i, [p[0] + Math.cos(a) * v * t, p[1] + 0.06 + 0.05 * t - 0.006 * t * t, p[2] + Math.sin(a) * v * t * 0.5], 0.05, t * 0.6 + i)); }
  return out;
};
/** a coin arcing from a to b over [f0, f0 + n] (a spinning coin card) */
const flipCoin = (key: string, a: V3, b: V3, f: number, f0: number, n = 10): FxSpec[] => {
  if (f < f0 || f > f0 + n) return [];
  const u = (f - f0) / n, p = lerp3(a, b, u); p[1] += 0.25 * Math.sin(Math.PI * u);
  return [{ kind: "card", key: "fc" + key, pos: p, w: 0.07, h: 0.07 * (0.35 + 0.65 * Math.abs(Math.cos(f * 0.8))), cw: 48, ch: 48,
    draw: (pp) => { const g = pp.g; g.fillStyle = "#e2b84a"; g.strokeStyle = "#5a3a10"; g.lineWidth = 4; g.beginPath(); g.ellipse(24, 24, 20, 20, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#fff2b8"; g.beginPath(); g.ellipse(18, 18, 6, 4, 0, 0, TAU); g.fill(); } }];
};
const walkO = (w: { p: V3; facing: number; phase: number; moving: boolean }, o: P = {}): P => ({ ...o, facing: w.facing * 0.7, mode: w.moving ? "walk" : "stand", phase: w.phase });
/** fit() + Rick's size-in-frame (board AP): the camera backs off until a head is `pct` of the frame width at the aim point
 *  (close-up 0.37-0.44, medium two-shot ~0.33, medium 0.22, full two-shot 0.18, group 0.13, wide 0.11) */
const fitH = (boxes: Box[], az: number, el: number, fov: number, pct: number, raise = 0, pad = 0.92, side = 0, lift = 0) => {
  const c = fit(boxes, az, el, fov, pad, side, lift), d: V3 = [c.pos[0] - c.look[0], c.pos[1] - c.look[1], c.pos[2] - c.look[2]], L = Math.hypot(...d);
  const D = 0.52 / pct / (2 * Math.tan((fov * Math.PI) / 360) * 0.5625), k = Math.max(1, D / L);
  // raise: lift the subjects by this fraction of the half-frame (heads above the caption band, the bottom 20% stays for captions)
  const dy = raise * Math.tan((fov * Math.PI) / 360) * L * k;
  return { pos: [c.look[0] + d[0] * k, c.look[1] + d[1] * k - dy, c.look[2] + d[2] * k] as V3, look: [c.look[0], c.look[1] - dy, c.look[2]] as V3, fov };
};
const REST_R: A2 = [[22, 10], [28, 26]], REST_L: A2 = [[-22, 10], [-28, 26]], BASKET_L: A2 = [[-22, 14], [-30, 26]];

// ================================================= STATION LAYOUT (shots 1, 3, 4, 6, 8)
const AGT: V3 = [-0.78, 0, 0.7], RAL: V3 = [0.25, 0, -0.62];
const Q: V3[] = [[0.55, 0, 1.12], [0.8, 0, 1.9], [0.6, 0, 2.7], [0.85, 0, 3.5], [0.65, 0, 4.3], [0.9, 0, 5.1]];   // the queue runs out into the yard
const QW = ["farmer1", "joko", "farmer2", "farmer3", "farmer4", "vil3"];
const COL_A = 0.18, COL_B = -1.0;   // the 12-coin column: Ralph flicks it (100) and it slides the length of the table into Agus's palm

// ================================================= STORY SHOT 1 (0-300) THE STATION, morning: the hook + "You see,"
const c1a = F((f) => { const k = sm(f, 0, 60), b = fitH([body(AGT, 0.6, 2.1, 0.42), [SMASH, -0.05, 0.15, 0.18]], lerp(-15, 2, k), 8, 42, 0.30, 0.3);   // the opening: an arc from the left and a slight drop, eased over 2 s (kit: first 3 s too static)
  return { pos: [b.pos[0], b.pos[1] + 0.5 * (1 - k), b.pos[2]] as V3, look: b.look, fov: b.fov }; }, 54, 0.0014, [[13, 0.004, 7]]);
const c1b = F(() => fitH([body(AGT, 0.7, 2.0, 0.4), [[COL_B, 0.8, 0.38], 0, 0.1, 0.06]], -8, 10, 40, 0.36, 0.3), 96, 0.0012);
const c1c = F(() => fitH([body(RAL, 0.5, 2.1, 0.4), [SIGN, -0.32, 0.32, 0.56]], -20, 6, 46, 0.24), 150, 0.0009);
const c1d = F(() => fitH([body(RAL, 0.4, 2.1, 0.4), body(Q[0], 0.4, 2.0, 0.4), body(Q[1], 0.4, 2.0, 0.4)], 45, 8, 46, 0.22), 232, 0.0008);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true), K(90, glideTo(c1a, 90, c1b, 106), 1), K(150, glideTo(c1b, 150, c1c, 178, 0.1), 1), K(226, glideTo(c1c, 226, c1d, 250, 1.2, [0, 0.3, 0], 0, 0.2), 1)];   // the last glide arcs up over the queue's heads
SUN_REF[1] = 160;
SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const colX = lerp(COL_A, COL_B, sm(f, 100, 126));
  const ctl: Ctl = { skVis: 1, skX: SMASH[0], skY: SMASH[1], skZ: SMASH[2], skRY: -0.5, shatter: f < 15 ? 0 : Math.max(0.001, sm(f, 15, 58)), coins: 0,
    colVis: f >= 92 && f < 134 ? 1 : 0, colX, colZ: 0.38, tally: 2964, repaint: 0, payoff: 0, heapN: 700, papCut: 0 };
  // AGUS: hammer already up at frame 0, the blow lands on "smashed" (f15), the hammer drops to his side; his left palm waits on
  // the table edge for the column (100-126), closes round it (134) and he weighs the coins (140-300), smug
  const aArm = strikeArm(1, s, f, AGT, SKTOP(SMASH), -12, 15, 40, -0.4);   // the hammer is already up on frame 0
  const aArmL = armSeq(f, [[0, fixA(BASKET_L)], [90, (g) => armTo(1, s, g, AGT, [COL_B, 0.84, 0.4], -1, -0.4), 12],
    [134, fixA([[-20, 4], [-14, -14]]), 10], [176, (g) => [[-20, 4 + 2 * Math.sin(g * 0.3)], [-14, -14 - 4 * Math.abs(Math.sin(g * 0.3))]] as A2, 10]]);
  const aw1 = walkPath(1, s, [AGT, [-1.6, 0, 1.25], [-2.8, 0, 1.6]], f, 142, 186);   // pockets the coins and strolls off home (clears Ralph's shot)
  cast.push(C("agus", f < 142 ? AGT : aw1.p, { ...flow(f, [
    [0, { expr: "determined", facing: -0.45, tilt: -6 }],
    [15, { expr: "strain", facing: -0.45, tilt: 7 }, 3],
    [26, { expr: "neutral", facing: -0.45, tilt: 2 }, 8],
    [104, { expr: "smug", facing: -0.6, tilt: 0, headTilt: 4 }, 10],
    [200, { expr: "neutral", facing: -0.3, look: 0.4 }, 12],
    [262, { expr: "smug", facing: 0.4, look: 0.6 }, 12],
  ]), ...(f >= 142 ? walkO(aw1, { expr: "smug" }) : {}), armR: aArm, armRFront: true, propR: "hammer", armL: aArmL, armLFront: true, propL: f >= 134 ? "coin" : undefined } as FigOpts, { idx: 1 }));
  fx.push(...strikeSmear("ag", hd(AGT, 1.75), SKTOP(SMASH), f, 15), ...chips("sk", SMASH, f - 15, 10));
  if (f >= 124 && f < 146) fx.push(...wordCard("x12c", "12 COINS", [AGT[0] - 0.4, 1.12, AGT[2] + 0.3], f - 124, 22, "#f4c430", 0.4));   // "paid twelve times more": the payoff reads on the coins
  if (f >= 15 && f < 23) fx.push(...wordCard("crk", "CRACK!", [SMASH[0] - 0.05, SMASH[1] + 0.45, SMASH[2] + 0.1], f - 15, 8, "#f4c430", 0.3));
  // RALPH: flinches at the blow, pushes the 12-coin column across with two fingers (94-126), pleased; turns to the sign and taps
  // it on "ten cents" (196-222), takes a coin and drops it in farmer 1's palm on "piece" (242), then writes in the ledger
  const rArm = armSeq(f, [[0, fixA(REST_R)], [90, (g) => armTo(1, s, g, RAL, [COL_A + 0.06, 0.86, 0.38], 1, 0.2), 8], [100, fixA([[24, -4], [40, -14]]), 5], [112, fixA(REST_R), 12], [226, (g) => armTo(1, s, g, RAL, [Q[0][0] - 0.12, 1.0, Q[0][2] - 0.6], 1, 0.6), 9], [258, (g) => armTo(1, s, g, RAL, [-0.55, 0.84, -0.12], 1, 0), 12]]);
  const rArmL = armSeq(f, [[0, fixA(REST_L)], [196, (g) => armTo(1, s, g, RAL, [SIGN[0] + 0.32, SIGN[1] - 0.05, SIGN[2] + 0.05], -1, -0.5), 8], [224, fixA(REST_L), 12]]);
  cast.push(C("ralph", RAL, { ...flow(f, [
    [0, { expr: "tache", facing: 0.2, tilt: 3 }],
    [17, { expr: "worry", facing: 0.1, tilt: -5 }, 3],
    [40, { expr: "tache", facing: -0.4 }, 10],
    [126, { expr: "smile", facing: -0.3, headTilt: 4 }, 8],
    [192, { expr: "tache", facing: -0.6, tilt: 3, look: -0.6 }, 8],
    [230, { expr: "smile", facing: 0.6, tilt: 3 }, 8],
    [262, { expr: "neutral", facing: -0.3, tilt: 6, look: 0.5 }, 12],
  ]), armR: rArm, armRFront: true, armL: rArmL, armLFront: f >= 196 && f < 236, propR: f >= 226 && f < 246 ? "coin" : f >= 258 ? "pen" : undefined } as FigOpts, { idx: 2 }));
  if (f >= 203 && f < 216) fx.push(...wordCard("10c", "10¢", [SIGN[0] + 0.1, SIGN[1] + 0.48, SIGN[2] + 0.1], f - 203, 13, "#f4c430", 0.32));
  // THE QUEUE: farmers with baskets of bones, each busy; farmer 1 lays a shard on the table (222-234) and takes the coin on
  // "piece" (244, a joyful bounce); Joko (2nd) mocks Agus from the start, the others crane and chat
  QW.forEach((w, i) => {
    if (i === 0) {
      const f1Arm = armSeq(f, [[0, fixA([[22, 10], [26, 26]])], [222, (g) => armTo(1, s, g, Q[0], [Q[0][0] - 0.28, 0.86, Q[0][2] - 0.72], 1, -0.5), 10],
        [244, (g) => armTo(1, s, g, Q[0], [Q[0][0] - 0.12, 1.0, Q[0][2] - 0.48], 1, -0.5), 6], [262, fixA([[20, 2], [16, -16]]), 12]]);
      cast.push(C(w, Q[0], { ...flow(f, [[0, { expr: "smile", facing: -0.6 }], [244, { expr: "joy", facing: -0.6, tilt: -3 }, 4], [266, { expr: "smile", facing: -0.4, look: 0.3 }, 10]]),
        propL: "boneBasket", armL: BASKET_L, armLFront: true, armR: f1Arm, armRFront: true, propR: f >= 244 ? "coin" : undefined } as FigOpts, { idx: 10 }));
      if (f >= 222 && f < 234) { const h = lerp3(hd(Q[0], 0.95), [Q[0][0] - 0.28, 0.86, Q[0][2] - 0.72], sm(f, 222, 232)); fx.push(chipCard("sh1h", [h[0], h[1] + 0.02, h[2]], 0.09)); }
      if (f >= 234) fx.push(chipCard("sh1", [Q[0][0] - 0.28, 0.83, Q[0][2] - 0.72], 0.09));
      return;
    }
    const u = Math.sin(f * 0.11 + i * 1.7);
    cast.push(C(w, Q[i], { ...flow(f, [[0, { expr: w === "joko" ? "grin" : i % 2 ? "smile" : "neutral", facing: -0.55 - 0.1 * (i % 2), tilt: 1.5 * u, armR: REST_R }],
      [40 + i * 30, { expr: w === "joko" ? "mock" : "smile", facing: -0.5, tilt: -2, look: -0.4, armR: [[22, 4], [30, -10]] as A2 }, 12],
      [110 + i * 25, { expr: w === "joko" ? "grin" : "neutral", facing: -0.7, tilt: 2, look: 0.2, armR: REST_R }, 12]]),
      armRFront: true, propL: "boneBasket", armL: BASKET_L, armLFront: true } as FigOpts, { idx: 10 + i }));
  });
  cast.push(C("rousse", [1.6, 0, 3.0 + 0.15 * Math.sin(f * 0.05)], { facing: Math.sin(f * 0.03) > 0 ? 1 : -1, phase: f / 6 } as FigOpts, { idx: 40, scale: 0.9 }));
  const focus = follow(f, [[0, SMASH], [40, hd(AGT, 1.1), 10], [98, [COL_B, 0.86, 0.4], 8], [150, hd(RAL, 1.2), 24], [196, SIGN, 10], [232, hd(Q[0], 1.1), 16]]);
  return { ctl, cast, fx, focus, subj: f < 150 ? "agus" : f < 232 ? "ralph" : "farmer1" };
};
lens3([[0, DOF_CU], [92, DOF_MS, 8], [150, DOF_MS, 30], [230, DOF_FS, 30]]);
KICKS.push([15 / 30, 4]);

// ================================================= STORY SHOT 2 (300-455) THE RIVERBANK, morning mist
const AGB: V3 = [140.8, 0, -2.55], JKB: V3 = [139.45, 0, -1.7], BSK: V3 = [140.3, 0.95, -3.42], BASKB: V3 = [141.35, 0.13, -2.3];
const holdB = (knee: number): V3 => [AGB[0] - 0.2, lerp(1.0, 0.72, knee), AGB[2] + 0.06];
const c2a = F(() => fitH([body(AGB, 0.0, 1.7, 0.42), [BSK, -0.2, 0.3, 0.25]], 26, 8, 44, 0.27, 0.35), 300, 0.0016, [[343, 0.008, 8]]);
const c2b = F(() => fitH([body(JKB, 0.5, 2.1, 0.42), body(AGB, 0.4, 2.0, 0.42)], -22, 4, 44, 0.28), 372, 0.0014, [[379, 0.007, 7], [430, 0.006, 8]]);
const c2c = F(() => ({ pos: [BASKB[0] - 0.35, 0.95, BASKB[2] + 0.85] as V3, look: [BASKB[0], 0.18, BASKB[2]] as V3, fov: 46 }), 440, 0.003);
SHOT_CAMS[2] = () => [K(300, c2a, 1, true), K(354, glideTo(c2a, 354, c2b, 366), 1), K(438, glideTo(c2b, 438, c2c, 452, 0, [0, 0, 0], 0, 0.3), 1)];
KEY_PUNCH.push(343, 379);
SUN_REF[2] = 320;
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  // the skull: in the bank until Agus wrenches it out (330-346), held at his chest (346-440), lowered into his basket (440-452)
  const pull = sm(f, 330, 346), HB = holdB(1 - sm(f, 346, 364));
  const sk: V3 = f < 330 ? BSK : f < 440 ? lerp3(BSK, HB, pull) : lerp3(HB, [BASKB[0], 0.3, BASKB[2]], sm(f, 440, 452));
  if (f >= 330 && f < 346) sk[1] += 0.06 * Math.sin(Math.PI * pull);
  const ctl: Ctl = { skVis: 1, skX: sk[0], skY: sk[1], skZ: sk[2], skRY: f < 330 ? 0.2 : 0.5 + 0.3 * pull, skRX: f < 330 ? -0.15 : 0, shatter: 0, bkVis: 1, bkX: BASKB[0], bkY: BASKB[1], bkZ: BASKB[2], tally: 2964 };
  // AGUS: kneeling at the bank, both hands in the hole tugging (300-330), one big yank (330-346), rises with the skull at his chest
  // (346-372), calm while Joko laughs, a small smug look (420), lowers the skull into his basket (440-452)
  const knee = 1 - sm(f, 346, 364), md = knee > 0.5 ? "kneel" : "stand";
  const grip = (side: 1 | -1): A2 => armTo(2, s, f, AGB, [sk[0] + side * 0.11, sk[1] - 0.02, sk[2]], side, -0.6, 1, md, 6);
  cast.push(C("agus", AGB, { ...flow(f, [
    [300, { expr: "strain", facing: -0.8, tilt: -10 }],
    [312, { expr: "strain", facing: -0.8, tilt: -4 }, 5], [318, { expr: "strain", facing: -0.8, tilt: -11 }, 5], [324, { expr: "strain", facing: -0.8, tilt: -5 }, 5],
    [330, { expr: "strain", facing: -0.8, tilt: 8 }, 4],
    [346, { expr: "neutral", facing: -0.6, tilt: 0 }, 16],
    [380, { expr: "neutral", facing: -0.7, tilt: -2, headTilt: 3, look: -0.4 }, 10],
    [420, { expr: "smug", facing: -0.6, tilt: 0 }, 10],
  ]), mode: "kneel", kneelK: knee, armR: grip(1), armL: grip(-1), armRFront: true, armLFront: true } as FigOpts, { idx: 1 }));
  if (f >= 330 && f < 346) fx.push(...chips("cl", [BSK[0], BSK[1] - 0.05, BSK[2] + 0.12], f - 330, 7));
  // JOKO: hacking at the bank with his hoe (300-366), turns, laughs hard at the single skull (379-398, body shaking, pointing),
  // the quote with one finger up on "one" (398) and a flat palm flashed on "ten cents" (428-440), then laughs again
  const jHoe = Math.sin(f * 0.42);
  const jFlow = flow(f, [
    [300, { expr: "determined", facing: -0.7, tilt: -6 + 6 * jHoe, propR: "shovel", propRAng: -0.4 + 0.5 * jHoe, armR: [[26, -10 + 10 * jHoe], [40, -20 + 30 * jHoe]] as A2, armL: REST_L }],
    [366, { expr: "grin", facing: 0.8, tilt: 0, propR: "shovel", propRAng: -0.2, armR: REST_R }, 10],
    [379, { ...laughP(f, 379, 0), facing: 0.8, propR: "shovel", armL: [[24, -6], [52, -14]] as A2 }, 4],
    [398, { expr: "mock", facing: 0.8, tilt: 2, propR: "shovel", armL: [[22, -16], [30, -46]] as A2 }, 6],
    [428, { expr: "mock", facing: 0.8, tilt: -2, propR: "shovel", armL: [[30, -10], [50, -30]] as A2 }, 5],
    [442, { ...laughP(f, 442, 1), facing: 0.8, propR: "shovel", armL: REST_L }, 8],
  ]);
  cast.push(C("joko", JKB, speak(f, 396, 458, { ...jFlow, armRFront: true, armLFront: true, headTilt: ((jFlow.headTilt as number) ?? 0) + talkNod(f, 396, 458) } as P) as FigOpts, { idx: 2 }));
  if (f >= 428 && f < 444) fx.push(...wordCard("ten", "10¢", [JKB[0] + 0.05, 2.0, JKB[2]], f - 428, 16, "#f4c430", 0.34));
  const focus = follow(f, [[300, sk], [372, hd(JKB, 1.2), 8], [440, [BASKB[0], 0.25, BASKB[2]], 10]]);
  return { ctl, cast, fx, focus, subj: f < 372 ? "agus" : "joko" };
};
lens3([[300, DOF_MS], [372, DOF_MS, 8], [440, DOF_INSERT, 12]]);

// ================================================= STORY SHOT 3 (455-760) THE SMASH AT THE TABLE -> THE SHED -> THE LANE
// 455 the basket on the table (shape match), the skull rolls out; 478 the blow; 12 pieces into the slots; the whole line laughs
// (529); the column again -> Agus walks off with 12 coins (568-612); "By Friday" the shed: tally 2988 -> 3000, a basket poured
// (669); "the whole village is swinging hammers" in the lane, the chickens scatter (737).
const BK3: V3 = [-0.42, 0.95, 0.36], BKDOWN: V3 = [-1.15, 0.94, 0.28];
const AGW: V3[] = [AGT, [-1.6, 0, 1.2], [-3.4, 0, 1.9]];   // Agus strolls off, clear of the queue
const c3a = F(() => fitH([body(AGT, 0.6, 2.1, 0.42), [SMASH, -0.05, 0.15, 0.2], [slotAt(2), 0, 0.1, 0.12]], -6, 12, 42, 0.28, 0.3), 455, 0.0016, [[478, 0.004, 7]]);
const c3t = F(() => ({ pos: [1.95, 2.35, 1.3] as V3, look: [-0.08, 0.84, 0.16] as V3, fov: 38 }), 494, 0.0012);
const c3b = F(() => fitH([body(Q[1], 0.3, 2.05, 0.42), body(Q[2], 0.3, 2.05, 0.42), body(Q[3], 0.3, 2.05, 0.42)], 70, 6, 46, 0.17), 520, 0.0012, [[529, 0.008, 7], [545, 0.006, 7]]);
const c3c = F((f) => { const w = polyAt(AGW, sm(f, 600, 660)).p; return fitH([body(w, 0.3, 2.05, 0.42), body(RAL, 0.5, 2.1, 0.4)], -20, 6, 46, 0.2); }, 568, 0.0008);
const c3d = F((f) => { const k = sm(f, 612, 640); return { pos: lerp3([9.0, 1.8, 5.0], [9.1, 1.55, 0.9], k), look: lerp3([9.1, 1.35, -1.0], [9.25, 1.3, -3.0], k), fov: lerp(50, 54, k) }; }, 640,   /* starts on the whole shed front, door centred (sweep: the old start was a blank wall) */ 0.0018, [[637, 0.009, 8], [669, 0.007, 7]]);
const c3e = F((f) => { const k = sm(f, 696, 730); return { pos: lerp3([10.6, 1.7, 2.0], [13.0, 1.75, 0.6], k), look: lerp3([14.6, 0.8, 3.6], [17.2, 0.6, 4.0], k), fov: 50 }; }, 730,   /* looks at the hammerers from the start (sweep: an empty lane) */ 0.0014, [[737, 0.009, 7]]);
SHOT_CAMS[3] = () => [K(455, c3a, 1), K(490, glideTo(c3a, 490, c3t, 500), 1), K(518, glideTo(c3t, 518, c3b, 528, 0.1, [0, 0.3, 0], 0, 0.35), 1),
  K(566, glideTo(c3b, 566, c3c, 578, 0.1), 1), K(606, glideTo(c3c, 606, c3d, 618, 0.25, [0, 0.4, 0], 0, 0.5), 1), K(694, c3e, 1, true)];
KEY_PUNCH.push(496, 545, 637, 669);
KEY_NUDGE.push(506, 584, 712);
SUN_REF[3] = 500;
const HAMV: [string, V3][] = [["vil1", [13.48, 0, 3.55]], ["farmer4", [14.98, 0, 5.55]], ["vil3", [16.58, 0, 2.85]], ["farmer2", [18.28, 0, 4.95]], ["kidA", [19.88, 0, 3.55]], ["farmer3", [21.48, 0, 5.65]]];   // each kneels just left of his flat stone
SHOT_ACTS[3] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  // the basket tips the skull out onto the table (455-470), Agus sets the basket down at the table's end (470-477)
  const tip = sm(f, 457, 468), bk = f < 470 ? BK3 : lerp3(BK3, BKDOWN, sm(f, 470, 477));
  const skP: V3 = f < 464 ? [BK3[0] + 0.02, BK3[1] + 0.05, BK3[2]] : lerp3([BK3[0] + 0.05, BK3[1], BK3[2]], SMASH, sm(f, 464, 472));
  const ctl: Ctl = { skVis: 1, skX: skP[0], skY: skP[1], skZ: skP[2], skRY: 0.3 + tip, shatter: f < 478 ? 0 : Math.max(0.001, sm(f, 478, 516)),
    bkVis: 1, bkX: bk[0], bkY: bk[1], bkZ: bk[2], bkTilt: f < 470 ? 1.15 * tip : 1.15 * (1 - sm(f, 470, 477)),
    coins: 0, colVis: f >= 572 && f < 598 ? 1 : 0, colX: lerp(COL_A, COL_B, sm(f, 574, 590)), colZ: 0.38,
    tally: Math.round(lerp(2988, 3000, sm(f, 634, 652))), repaint: 0, payoff: 0, heapN: 700 };
  // AGUS at the table: tips the basket (both hands), sets it down (left), draws the hammer from his belt (472), the blow at 478,
  // a calm "there" look; takes the column (584-598), weighs it, turns and walks off home past the shed (600-660)
  const aw = walkPath(3, s, AGW, f, 600, 660);
  const AP = f < 600 ? AGT : aw.p;
  const aR = f < 472 ? armTo(3, s, f, AGT, [bk[0] + 0.12, bk[1] + 0.06, bk[2]], 1, -0.4) : strikeArm(3, s, f, AGT, SKTOP(SMASH), 470, 478, 500, -0.4);
  const aL = armSeq(f, [[455, (g) => armTo(3, s, g, AGT, [BK3[0] - 0.12, BK3[1] + 0.02, BK3[2]], -1, -0.4)], [470, (g) => armTo(3, s, g, AGT, [lerp(BK3[0], BKDOWN[0], sm(g, 470, 477)) - 0.1, 0.98, 0.3], -1, -0.4), 4],
    [480, fixA(BASKET_L), 10], [584, (g) => armTo(3, s, g, AGT, [COL_B, 0.84, 0.4], -1, -0.4), 8], [600, fixA([[-20, 4], [-14, -14]]), 10]]);
  cast.push(C("agus", AP, { ...flow(f, [
    [455, { expr: "calm", facing: -0.45, tilt: -4 }],
    [472, { expr: "determined", facing: -0.45, tilt: -6 }, 4],
    [478, { expr: "strain", facing: -0.45, tilt: 7 }, 2],
    [490, { expr: "smug", facing: -0.5, tilt: 0, headTilt: 4 }, 8],
    [530, { expr: "calm", facing: 0.5, look: 0.6 }, 10],
    [598, { expr: "smug", facing: 0.6 }, 8],
  ]), ...(f >= 600 ? walkO(aw) : {}), armR: f < 600 ? aR : HAM_LOW, armRFront: true, propR: f >= 472 ? "hammer" : undefined, armL: aL, armLFront: true, propL: f >= 596 ? "coin" : undefined } as FigOpts, { idx: 1 }));
  fx.push(...strikeSmear("ag3", hd(AGT, 1.75), SKTOP(SMASH), f, 478), ...chips("sk3", SMASH, f - 478, 10));
  if (f >= 478 && f < 486) fx.push(...wordCard("crk3", "CRACK!", [SMASH[0] - 0.05, SMASH[1] + 0.45, SMASH[2] + 0.1], f - 478, 8, "#f4c430", 0.3));
  if (f >= 496 && f < 512) fx.push(...wordCard("x12", "x12", [slotAt(6)[0], 1.15, TRAY[2] + 0.1], f - 496, 16, "#f4c430", 0.3));
  // RALPH: blinks at the blow, counts the pieces along the slots with a finger on "twelve pieces" (494-516), pushes the column to
  // Agus (570-590), watches him go, worried
  const rR = armSeq(f, [[455, fixA(REST_R)], [494, (g) => armTo(3, s, g, RAL, [slotAt(Math.max(0, Math.min(11, Math.floor((g - 496) / 1.7))))[0], 0.9, TRAY[2]], 1, 0.2), 6],
    [520, fixA(REST_R), 10], [566, (g) => armTo(3, s, g, RAL, [COL_A + 0.06, 0.86, 0.38], 1, 0.2), 6], [574, fixA([[24, -4], [40, -14]]), 4], [594, fixA([[20, -2], [10, -30]]), 12]]);
  cast.push(C("ralph", RAL, { ...flow(f, [
    [455, { expr: "tache", facing: -0.3, tilt: 2 }],
    [479, { expr: "worry", facing: -0.3, tilt: -6 }, 3],
    [494, { expr: "tache", facing: 0.2, tilt: 5, look: 0.5 }, 6],
    [520, { expr: "tacheUp", facing: 0.4, look: 0.6 }, 10],
    [572, { expr: "tache", facing: -0.4 }, 8],
    [600, { expr: "worry", facing: 0.5, look: 0.8 }, 12],
  ]), armR: rR, armRFront: true } as FigOpts, { idx: 2 }));
  // THE LINE LAUGHS (529-572): Joko first (529, pointing at Agus), farmer 2 a beat later, then everyone
  QW.forEach((w, i) => {
    if (f >= 612) return;   // "By Friday": the station empties out of the shot; these farmers are hammering in the lane
    const st = 529 + (i === 1 ? 0 : i === 2 ? 5 : 9 + i * 2), on = f >= st && f < 572;
    const o: P = { ...flow(f, [[455, { expr: i === 1 ? "grin" : "neutral", facing: -0.6 + 0.1 * (i % 2), look: -0.3 }], [490, { expr: i === 1 ? "mock" : "smile", facing: -0.6, look: -0.5 }, 8], [572, { expr: i === 1 ? "grin" : "smile", facing: -0.5 }, 10]]),
      ...(on ? laughP(f, st, i) : {}) };
    const pointL = i === 1 && on;
    cast.push(C(w, Q[i], { ...o, propL: pointL ? undefined : "boneBasket", armL: pointL ? ([[-26, -6], [-52, -14]] as A2) : BASKET_L, armLFront: true, armR: REST_R, armRFront: true } as FigOpts, { idx: 10 + i }));
  });
  // THE SHED (612-700): vil2 chalks the tally up to 3000 (628-652), vil4 pours a basket of pieces into a crate (650-684),
  // kidB brings another basket in (640-700)
  const TALLY = JV.TALLY;
  const v2: V3 = [9.85, 0, -2.5];   // right of the board: the number stays clear
  if (f >= 596 && f < 700) cast.push(C("vil2", v2, { ...flow(f, [[612, { expr: "neutral", facing: -0.8, look: -0.8 }], [634, { expr: "proud", facing: -0.8, look: -0.9 }, 8]]),
    armR: armSeq(f, [[455, fixA(REST_R)], [628, (g) => armTo(3, s, g, v2, [TALLY[0] + 0.42 + 0.08 * sm(g, 634, 652), TALLY[1] - 0.25 + 0.04 * Math.sin(g * 1.3), TALLY[2] + 0.05], 1, -0.6), 8], [656, fixA(REST_R), 10]]),
    armRFront: true, propR: "chalk" } as FigOpts, { idx: 20 }));
  const v4w = walkPath(3, s, [[7.75, 0, -1.2], [7.95, 0, -2.0], [8.05, 0, -2.45]], f, 622, 652)   // left of the board: the 3000 stays clear, v4o = walkPath(3, s, [[9.6, 0, -2.2], [10.0, 0, 0.6], [11.6, 0, 2.6], [13.6, 0, 3.6]], f, 684, 744);
  const v4p = v4w.p, crate: V3 = [8.5, 0.66, -3.05], pourK = sm(f, 660, 672), pouring = f >= 650 && f < 684;
  if (f >= 596 && f < 704) cast.push(C("vil4", v4p, { ...walkO(v4w), expr: f >= 660 && f < 690 ? "proud" : "smile",
    armR: pouring ? armTo(3, s, f, v4p, [crate[0] - 0.12, crate[1] + 0.35 - 0.2 * pourK, crate[2]], 1, 0.4) : REST_R, armRFront: true,
    propR: "boneBasket", propRAng: pouring ? -1.4 * pourK : 0 } as FigOpts, { idx: 21 }));
  if (f >= 662 && f < 680) for (let k = 0; k < 6; k++) { const u = ((f - 662) / 14 + k / 6) % 1; fx.push(chipCard("pr" + k, [crate[0] + 0.05 + 0.03 * Math.sin(k), crate[1] + 0.3 - 0.35 * u, crate[2] + 0.04], 0.06, k + f * 0.4)); }
  const kbw = walkPath(3, s, [[12.5, 0, 3.0], [10.7, 0, 1.6], [10.2, 0, 0.9]], f, 640, 700);
  if (false) cast.push(C("kidB", kbw.p, { ...walkO(kbw), expr: "smile", propL: "boneBasket", armL: BASKET_L, armLFront: true } as FigOpts, { idx: 22, scale: 0.78 }));
  // THE LANE (700-760): six hammerers at their stones, each on its own rhythm; at 737 the chickens burst across the lane
  HAMV.forEach(([w, p], i) => {
    if (f < 690) return; const n = 15 + (i % 3) * 2, o = i * 5, T: V3 = [p[0] + 0.42, 0.14, p[2] + 0.05], kid = w.startsWith("kid");
    cast.push(C(w, p, { expr: i % 2 ? "determined" : "joy", facing: 0.6, mode: "kneel", kneelK: 1, tilt: 4 * Math.sin(((f + o) / n) * TAU),
      armR: hamLoop(3, s, f, p, T, n, o, "kneel", kid ? 0.78 : 1), armRFront: true, propR: "hammerS", armL: armTo(3, s, f, p, [T[0] - 0.1, 0.12, T[2]], -1, 0, kid ? 0.78 : 1, "kneel"), armLFront: true } as FigOpts, { idx: 30 + i, scale: kid ? 0.78 : 1 }));
    const age = ((f + o) % n + n) % n; if (f >= 696 && age < 6) fx.push(...chips("hh" + i, T, age, 5, 0.3));
  });
  const HEN: [string, V3, V3][] = [["neige", [16.2, 0, 3.6], [19.6, 0, 1.4]], ["henBlack", [17.6, 0, 3.9], [15.0, 0, 6.6]], ["henGold", [18.2, 0, 3.2], [21.2, 0, 2.0]]];
  HEN.forEach(([w, a, b], i) => { const u = sm(f, 737 + i * 2, 755 + i * 2), p = lerp3(a, b, u); p[1] = u > 0 && u < 1 ? 0.25 * Math.sin(Math.PI * u) : 0;
    cast.push(C(w, p, { facing: b[0] > a[0] ? 1 : -1, phase: f / (u > 0 && u < 1 ? 2 : 6) } as FigOpts, { idx: 50 + i, scale: 0.9 })); });
  const focus = follow(f, [[455, SMASH], [494, slotAt(5), 8], [520, hd(Q[1], 1.2), 8], [570, hd(AGT, 1.1), 10], [612, TALLY, 18], [700, [17.0, 0.9, 3.4], 20]]);
  return { ctl, cast, fx, focus, subj: f < 494 ? "agus" : f < 520 ? null : f < 568 ? "joko" : f < 612 ? "agus" : f < 700 ? "vil2" : "vil3" };
};
lens3([[455, DOF_MS], [494, DOF_INSERT, 6], [520, DOF_MS, 8], [612, DOF_FS, 16], [700, DOF_FS, 16]]);
KICKS.push([478 / 30, 4]);

// ================================================= STORY SHOT 4 (760-1063) NIGHT AT THE STATION: the lamp test, "Mr. Hammer", the river
const RAL4: V3 = [0.6, 0, -0.75], AG4: V3 = [-0.25, 0, 0.92], JK4: V3 = [0.55, 0, 1.25];   // Ralph left of the lamp: it never covers his head
const SHA: V3 = [0.5, 1.36, -0.45], SHB: V3 = [0.74, 1.36, -0.45];
const c4a = F(() => fitH([body(RAL4, 0.5, 2.15, 0.42), [LAMP, 0, 0.35, 0.15]], 22, 6, 44, 0.3), 760, 0.0016, [[791, 0.007, 7]]);
const c4i = F(() => fitH([body(RAL4, 0.95, 2.15, 0.42), [lerp3(SHA, SHB, 0.5), -0.1, 0.1, 0.2]], 12, 4, 38, 0.42), 838, 0.0022, [[853, 0.012, 8]]);
const c4b = F(() => fitH([body(JK4, 0.45, 2.05, 0.42), body(AG4, 0.45, 2.05, 0.42)], 15, 5, 46, 0.26), 877, 0.0014, [[893, 0.008, 7], [947, 0.007, 7]]);
const c4c = F(() => fitH([body(RAL4, 0.4, 2.15, 0.42), body(AG4, 0.4, 2.05, 0.42), body(JK4, 0.4, 2.05, 0.42)], 30, 8, 48, 0.18 /* az 30: Ralph clear of Joko (az 5 hid him behind Joko's head) */), 961, 0.0012, [[988, 0.007, 7], [1020, 0.008, 7]]);
SHOT_CAMS[4] = () => [K(760, c4a, 1, true), K(834, glideTo(c4a, 834, c4i, 846), 1), K(866, glideTo(c4i, 866, c4b, 877, 0.05, [0.9, 0, 0]), 1), K(948, glideTo(c4b, 948, c4c, 960, 0.1), 1)];
KEY_PUNCH.push(791, 859, 912, 1013);
KEY_NUDGE.push(831, 932, 982, 1031);
SUN_REF[4] = 780;
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  // the shards: on the table (760-786), lifted to the lamp (786-800), turned (800-850), slid together - they FIT (853-862)
  const lift = sm(f, 786, 800) - sm(f, 962, 974), A0: V3 = [0.48, 0.84, -0.22], B0: V3 = [0.6, 0.84, -0.22];   // after the fit he lays the two joined pieces down (962-974)
  const pA = lerp3(A0, SHA, lift), pB = lerp3(B0, SHB, lift); pA[1] += 0.01 * Math.sin(f * 0.21); pB[1] += 0.01 * Math.sin(f * 0.19 + 1);
  const bagP: V3 = f < 1000 ? [0.95, 0.9, -0.15] : lerp3([0.95, 0.9, -0.15], [0.3, 1.22, 0.32], sm(f, 1000, 1012)), hand: V3 = [-0.02, 1.0, 0.68];
  const ctl: Ctl = { skVis: 0, shVis: 1, shAx: pA[0], shAy: pA[1], shAz: pA[2], shBx: pB[0], shBy: pB[1], shBz: pB[2], shFit: sm(f, 853, 862),
    bagVis: 1, bagX: bagP[0], bagY: bagP[1], bagZ: bagP[2], pour: sm(f, 1013, 1045), handX: hand[0], handY: hand[1], handZ: hand[2], tally: 3000, repaint: 0, payoff: 0, heapN: 700 };
  // RALPH: alone with the lamp - lifts two pieces to the light, turns them, slides them together; they FIT (859): shock. Then the
  // decision: a glance at the river (982, points off left), grinds his fists ("crushed", 988), lifts the "100" bag and pours it
  // into Agus's cupped hands (1013-1045)
  const rR = armSeq(f, [[760, (g) => armTo(4, s, g, RAL4, [B0[0], B0[1] + 0.02, B0[2]], 1, 0.3)], [786, (g) => armTo(4, s, g, RAL4, lerp3(B0, SHB, sm(g, 786, 800)), 1, 0.3), 2],
    [853, (g) => armTo(4, s, g, RAL4, lerp3(lerp3(SHB, [0.65, 1.36, -0.45], sm(g, 853, 862)), [0.62, 0.88, -0.22], sm(g, 962, 974)), 1, 0.3), 2], [976, fixA(REST_R), 8],
    [984, fixA([[16, -6], [6, -12]]), 4], [998, (g) => armTo(4, s, g, RAL4, [bagP[0] + 0.05, bagP[1] + 0.12, bagP[2]], 1, 0.4), 6]]);
  const rL = armSeq(f, [[760, (g) => armTo(4, s, g, RAL4, [A0[0], A0[1] + 0.02, A0[2]], -1, 0.3)], [786, (g) => armTo(4, s, g, RAL4, lerp3(A0, SHA, sm(g, 786, 800)), -1, 0.3), 2],
    [853, (g) => armTo(4, s, g, RAL4, lerp3(lerp3(SHA, [0.59, 1.36, -0.45], sm(g, 853, 862)), [0.56, 0.88, -0.22], sm(g, 962, 974)), -1, 0.3), 2], [976, fixA(REST_L), 8],
    [980, fixA([[-30, -10], [-58, -18]]), 4], [988, fixA([[-14, -6], [-4, -12]]), 4], [1000, fixA(REST_L), 8]]);
  cast.push(C("ralph", RAL4, { ...flow(f, [
    [760, { expr: "tache", facing: 0.4, tilt: 6, look: 0.5 }],
    [791, { expr: "stare", facing: 0.2, tilt: 2, look: 0.3 }, 8],
    [859, { expr: "shock", facing: 0.2, tilt: -8, headBack: 0.6 }, 3],
    [893, { expr: "worry", facing: -0.5, tilt: -2 }, 10],
    [961, { expr: "scheme", facing: -0.6, tilt: 4 }, 10],
    [982, { expr: "tacheUp", facing: -0.8, look: -0.9 }, 6],
    [1013, { expr: "fakegrin", facing: -0.6, tilt: 3 }, 8],
  ]), armR: rR, armL: rL, armRFront: true, armLFront: true } as FigOpts, { idx: 2 }));
  if (f >= 988 && f < 1000) fx.push(...chips("grind", [RAL4[0] - 0.05, 1.25, RAL4[2] + 0.2], f - 988, 4));
  if (f >= 859 && f < 866) fx.push(...wordCard("fit", "FIT!", [0.62, 1.62, -0.45], f - 859, 7, "#f4c430", 0.24));
  // JOKO: grinning (880), leans in to Agus, the quote with a jab of the finger on "done" (921) and a laugh on "Hammer" (947);
  // shock at 1020 when the coins pour. AGUS: calm through it, a slow smug look; cups his hands (1000) for the coins
  const jFlow = flow(f, [
    [760, { expr: "neutral", facing: 0.5, look: 0.6, armR: REST_R }],
    [880, { expr: "grin", facing: -0.6, look: -0.5, tilt: -3 }, 6],
    [912, { expr: "mock", facing: -0.7, tilt: 3, armR: [[24, -6], [46, -18]] as A2 }, 6],
    [921, { expr: "mock", facing: -0.7, tilt: -4, armR: [[26, -10], [52, -22]] as A2 }, 3],
    [947, { ...laughP(f, 947, 0), facing: -0.7, armR: REST_R }, 5],
    [990, { expr: "grin", facing: 0.5, look: 0.6 }, 10],
    [1020, { expr: "shock", facing: 0.5, tilt: -8, headBack: 0.7, armR: [[30, -16], [44, -40]] as A2 }, 3],
  ]);
  cast.push(C("joko", JK4, speak(f, 910, 964, { ...jFlow, armRFront: true, armL: BASKET_L, armLFront: true, propL: "boneBasket", headTilt: ((jFlow.headTilt as number) ?? 0) + talkNod(f, 910, 964) } as P) as FigOpts, { idx: 3 }));
  const aCup = armSeq(f, [[760, fixA(REST_R)], [1000, (g) => armTo(4, s, g, AG4, [hand[0] + 0.06, hand[1], hand[2]], 1, 0.3), 8]]);
  const aCupL = armSeq(f, [[760, fixA(REST_L)], [1000, (g) => armTo(4, s, g, AG4, [hand[0] - 0.06, hand[1], hand[2]], -1, 0.3), 8]]);
  cast.push(C("agus", AG4, { ...flow(f, [
    [760, { expr: "calm", facing: 0.6, look: 0.6 }],
    [912, { expr: "calm", facing: 0.6, look: 0.9, headTilt: 3 }, 10],
    [947, { expr: "smug", facing: 0.6, look: 0.5 }, 8],
    [1013, { expr: "smug", facing: 0.6, look: 0.4, headTilt: 5 }, 8],
  ]), armR: aCup, armL: aCupL, armRFront: true, armLFront: true, propR: f >= 1040 ? "handful" : undefined } as FigOpts, { idx: 1 }));
  for (let k = 0; k < 7; k++) fx.push(...flipCoin("p" + k, [bagP[0], bagP[1] - 0.05, bagP[2]], hand, f, 1013 + k * 4, 8));
  if (f >= 1031 && f < 1045) fx.push(...wordCard("100", "x100", [hand[0] + 0.1, hand[1] + 0.45, hand[2]], f - 1031, 14, "#f4c430", 0.3));
  const focus = follow(f, [[760, hd(RAL4, 1.2)], [786, lerp3(SHA, SHB, 0.5), 8], [877, hd(JK4, 1.2), 10], [961, hd(RAL4, 1.2), 10], [1005, hand, 8]]);
  return { ctl, cast, fx, focus, subj: f < 838 ? "ralph" : f < 877 ? null : f < 961 ? "joko" : "ralph" };
};
lens3([[760, DOF_MS], [838, DOF_INSERT, 8], [877, DOF_MS, 8], [961, DOF_FS, 10]]);

// ================================================= STORY SHOT 5 (1063-1264) EARLY MORNING IN THE VILLAGE: kids, the tin, the elder, the bike
const MAT = JV.MAT, TIN: V3 = [JV.TIN[0], 0.1, JV.TIN[2]], PILE = JV.PILE, BIKE = JV.BIKE;
const KIDS: [string, V3][] = [["kidA", [16.25, 0, 6.05]], ["kidB", [17.15, 0, 6.55]], ["kidC", [16.7, 0, 5.55]]];
const SRI5: V3 = [15.55, 0, 6.6], ELD: V3 = [23.05, 0, 2.95], AG5: V3 = [25.75, 0, 4.85], BELL: V3 = [26.9, 1.02, 4.45];
const c5a = F(() => fitH([body(KIDS[0][1], 0.0, 1.45, 0.34), body(KIDS[1][1], 0.0, 1.45, 0.34), body(KIDS[2][1], 0.0, 1.45, 0.34), [TIN, 0, 0.2, 0.4]], -172, 10, 46, 0.27, 0.2), 1063, 0.0016, [[1094, 0.008, 7], [1150, 0.007, 6]]);
const c5b = F(() => fitH([body(ELD, 0.0, 1.75, 0.42), [PILE, 0, 0.4, 0.4]], -160, 8, 46, 0.25), 1180, 0.0014, [[1199, 0.008, 7]]);
const c5c = F(() => fitH([body(AG5, 0.3, 2.1, 0.42), [BELL, -0.25, 0.1, 0.35]], -150, 6, 44, 0.26), 1220, 0.0014, [[1245, 0.009, 7]]);
SHOT_CAMS[5] = () => [K(1063, c5a, 1, true), K(1172, glideTo(c5a, 1172, c5b, 1188, 0.2, [0, 0, 0], 0, 0.6), 1), K(1212, glideTo(c5b, 1212, c5c, 1228, 0.1), 1)];
KEY_PUNCH.push(1090, 1150, 1225);
KEY_NUDGE.push(1106, 1168, 1245);
SUN_REF[5] = 1080;
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { tally: 3000, repaint: 0, payoff: 0, heapN: 700, papCut: 0 };
  // THE KIDS: kneeling at the mat, hammering bones on the flat stones (each its own rhythm); one coin each into the "10¢" tin on
  // "ten cents a pop" (1150, 1160, 1168): the kid sits up, flips the coin in, back to work
  const drops = [1150, 1160, 1168];
  KIDS.forEach(([w, p], i) => {
    const n = 13 + i * 2, o = i * 4, T: V3 = [p[0] + 0.3, 0.1, p[2] - 0.05], d = drops[i], dropping = f >= d - 8 && f < d + 6;
    cast.push(C(w, p, { ...flow(f, [[1063, { expr: i === 1 ? "joy" : "determined", facing: 0.6 - i * 0.5 }], [d - 8, { expr: "beam", facing: 0.6 }, 4], [d + 6, { expr: "determined", facing: 0.5 }, 6]]),
      mode: "kneel", kneelK: 1, tilt: dropping ? -4 : 4 * Math.sin(((f + o) / n) * TAU), armR: dropping ? armTo(5, s, f, p, [TIN[0], 0.35, TIN[2]], 1, 0, 0.78, "kneel") : hamLoop(5, s, f, p, T, n, o, "kneel", 0.78), armRFront: true,
      propR: dropping && f < d ? "coin" : "hammerS", armL: armTo(5, s, f, p, [T[0] - 0.1, 0.1, T[2]], -1, 0, 0.78, "kneel"), armLFront: true } as FigOpts, { idx: 10 + i, scale: 0.78 }));
    fx.push(...flipCoin("k" + i, [TIN[0] - 0.1, 0.4, TIN[2]], [TIN[0], 0.16, TIN[2]], f, d - 4, 6));
    if (f >= d + 2 && f < d + 8) fx.push(...wordCard("plk" + i, "PLINK", [TIN[0], 0.55, TIN[2]], f - d - 2, 6, "#f4c430", 0.2));
    const age = ((f + o) % n + n) % n; if (!dropping && age < 5) fx.push(...chips("kk" + i, T, age, 4, 0));
  });
  // SRI: ladles rice into bowls at the edge of the mat, a sigh at the noise, a smile at the coins (1168)
  cast.push(C("sri", SRI5, { ...flow(f, [[1063, { expr: "neutral", facing: 0.6, tilt: 5 }], [1110, { expr: "bored", facing: 0.6, headTilt: -4 }, 8], [1168, { expr: "smile", facing: 0.7 }, 8]]),
    mode: "kneel", kneelK: 1, armR: armTo(5, s, f, SRI5, [SRI5[0] + 0.35, 0.18 + 0.12 * Math.max(0, Math.sin(f * 0.18)), SRI5[2] - 0.1], 1, 0, 1, "kneel"), armRFront: true, propR: "ladleRice" } as FigOpts, { idx: 15 }));
  // THE ELDER on "vandalism" (1199): kneels by his bone pile shaking a fist at the noise - then quietly hammers a bone too (1214)
  const eHit = f >= 1214;
  cast.push(C("elder", ELD, { ...flow(f, [[1063, { expr: "stern", facing: -0.6, armL: REST_L }], [1192, { expr: "angry", facing: -0.7, tilt: -4, armL: [[-26, -12], [-34, -40]] as A2 }, 4], [1212, { expr: "sly", facing: 0.6, tilt: 3, armL: REST_L }, 8]]),
    mode: "kneel", kneelK: 1, armR: eHit ? hamLoop(5, s, f, ELD, [ELD[0] + 0.32, 0.12, ELD[2]], 17, 0, "kneel") : REST_R, armRFront: true, armLFront: true, propR: "hammerS" } as FigOpts, { idx: 16 }));
  // AGUS by his brand-new bicycle (1220-1264): polishes the handlebar, rings the bell twice on "raise" (1238, 1246), grinning
  const ring = (f >= 1238 && f < 1244) || (f >= 1246 && f < 1252);
  cast.push(C("agus", AG5, { ...flow(f, [[1063, { expr: "smug", facing: 0.6, tilt: 4, look: 0.6 }], [1225, { expr: "proud", facing: 0.5, tilt: -3 }, 6], [1240, { expr: "joy", facing: 0.5 }, 4]]),
    armR: armTo(5, s, f, AG5, [BELL[0] - (ring ? 0.0 : 0.04), BELL[1] + (ring ? 0.02 * Math.sin(f * 3) : 0), BELL[2]], 1, 0.4), armRFront: true,
    armL: armTo(5, s, f, AG5, [BIKE[0] + 0.1 + 0.08 * Math.sin(f * 0.25), 0.95, BIKE[2] + 0.05], -1, 0.4), armLFront: true } as FigOpts, { idx: 1 }));
  if (ring) fx.push(...wordCard("ring" + (f < 1246 ? 1 : 2), "RING!", [BELL[0], BELL[1] + 0.35, BELL[2]], f < 1246 ? f - 1238 : f - 1246, 6, "#f4c430", 0.24));
  cast.push(C("rousse", [21.0 + 0.4 * Math.sin(f * 0.02), 0, 4.2], { facing: Math.cos(f * 0.02) > 0 ? 1 : -1, phase: f / 6 } as FigOpts, { idx: 40, scale: 0.9 }));
  const focus = follow(f, [[1063, [MAT[0], 0.5, MAT[2]]], [1180, hd(ELD, 0.8), 14], [1220, hd(AG5, 1.1), 12]]);
  return { ctl, cast, fx, focus, subj: f < 1180 ? "kidA" : f < 1220 ? "elder" : "agus" };
};
lens3([[1063, DOF_FS], [1180, DOF_FS, 12], [1220, DOF_MS, 12]]);

// ================================================= STORY SHOT 6 (1264-1453) NOON: THE TRICK on the counting tray, then the crane up
// "isn't paying for skulls" = a whole skull in slot 1 -> ONE coin (1310); "he's paying for pieces" = the same skull shatters ->
// TWELVE coins (1343-1372); "whatever you pay for, people make more of" = crane up: the queue now snakes past the shed.
const c6r = F(() => fitH([body(RAL, 0.5, 2.15, 0.42), [TRAY, 0, 0.15, 0.95]], 10, 14, 46, 0.24), 1264, 0.0016, [[1275, 0.008, 7], [1298, 0.008, 7]]);
const c6a = F(() => ({ pos: [1.75, 2.45, 1.35] as V3, look: [-0.28, 0.84, 0.15] as V3, fov: 40 }), 1306, 0.0016, [[1343, 0.009, 7]]);
const c6b = F((f) => {   // pull back under the eaves first (z), then rise (y): the crane never passes through the roof
  const kz = sm(f, 1384, 1418), ky = sm(f, 1404, 1444), k = sm(f, 1384, 1440);
  return { pos: [lerp(1.75, 3.6, kz), lerp(2.45, 5.2, ky), lerp(1.35, 7.4, kz)] as V3, look: lerp3([-0.28, 0.84, 0.15], [1.6, 0.9, 2.2], k), fov: lerp(40, 54, k) }; }, 1440, 0.0008);
SHOT_CAMS[6] = () => [K(1264, c6r, 1, true), K(1298, glideTo(c6r, 1298, c6a, 1312), 1), K(1376, glideTo(c6a, 1376, c6b, 1392), 1)];
KEY_PUNCH.push(1275, 1326, 1363);
KEY_NUDGE.push(1310, 1401, 1432);
SUN_REF[6] = 1270;
const Q6: V3[] = Array.from({ length: 12 }, (_, i) => [1.7 + i * 0.78, 0, 1.12 + i * 0.62 + (i > 6 ? (i - 6) * 0.3 : 0)] as V3);
const Q6W = ["farmer1", "farmer2", "kidA", "farmer3", "vil1", "farmer4", "vil2", "kidC", "vil3", "elder", "vil4", "kidB"];
SHOT_ACTS[6] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const s1 = slotAt(0), skP: V3 = lerp3([s1[0] + 0.3, 1.15, s1[2] + 0.15], [s1[0] + 0.08, s1[1] + 0.13, s1[2]], sm(f, 1282, 1298));
  const coins = f < 1310 ? 0 : f < 1343 ? 1 : 1 + 11 * sm(f, 1343, 1372);
  const ctl: Ctl = { skVis: 1, skX: skP[0], skY: skP[1], skZ: skP[2], skRY: -0.6, shatter: f < 1336 ? 0 : Math.max(0.001, sm(f, 1336, 1360)), coins, coinStack: 1 + 5 * sm(f, 1400, 1440),
    tally: 3000, repaint: 0, payoff: 0, heapN: Math.round(lerp(0, 700, sm(f, 1392, 1445))) };
  if (f >= 1310 && f < 1326) fx.push(...wordCard("one", "1 SKULL = 10¢", [s1[0] + 0.3, 1.2, s1[2] + 0.1], f - 1310, 16, "#f4c430", 0.5));
  if (f >= 1363 && f < 1382) fx.push(...wordCard("twelve", "12 PIECES = 120¢", [slotAt(6)[0], 1.2, TRAY[2] + 0.1], f - 1363, 19, "#f4c430", 0.62));
  if (f >= 1336 && f < 1344) fx.push(...wordCard("crk6", "CRACK!", [s1[0] + 0.1, 1.25, s1[2] + 0.1], f - 1336, 8, "#f4c430", 0.36));
  fx.push(...chips("sk6", [s1[0] + 0.08, s1[1] + 0.12, s1[2]], f - 1336, 9));
  // RALPH (seen from 1384 on the crane): pays, pays, pays - a coin along the slots, mopping his brow
  cast.push(C("ralph", RAL, { ...flow(f, [[1264, { expr: "tache", facing: 0.3, tilt: 4 }], [1400, { expr: "worry", facing: 0.4, tilt: 6, look: 0.5 }, 10]]),
    armR: armSeq(f, [[1264, (g) => armTo(6, s, g, RAL, [skP[0] + 0.06, skP[1] + 0.1, skP[2]], 1, 0.2)], [1304, fixA(REST_R), 10], [1384, (g) => armTo(6, s, g, RAL, [TRAY[0] + 0.75 * Math.sin(g * 0.07), 0.9, TRAY[2] + 0.2], 1, 0.2), 10]]), armRFront: true, armL: f > 1420 ? ([[-20, -4], [-8, -30]] as A2) : REST_L, armLFront: true } as FigOpts, { idx: 2 }));
  // THE QUEUE, now twelve deep and snaking past the shed: everyone carries a basket of pieces, chats, shifts, cranes to see
  Q6W.forEach((w, i) => { const u = Math.sin(f * 0.1 + i * 1.3);
    cast.push(C(w, Q6[i], { expr: i % 3 === 0 ? "joy" : i % 3 === 1 ? "smile" : "proud", facing: -0.6, tilt: 2 * u, look: -0.3 + 0.2 * u, propL: "boneBasket", armL: BASKET_L, armLFront: true } as FigOpts, { idx: 10 + i, scale: w.startsWith("kid") ? 0.78 : 1 })); });
  const focus = follow(f, [[1264, hd(RAL, 1.1)], [1300, [s1[0] + 0.1, 0.95, s1[2]], 8], [1343, slotAt(5), 10], [1384, [1.0, 1.0, 1.0], 30]]);
  return { ctl, cast, fx, focus, subj: f < 1300 ? "ralph" : f < 1384 ? null : "ralph" };
};
lens3([[1264, DOF_MS], [1300, DOF_INSERT, 8], [1384, DOF_WS, 30]]);

// ================================================= STORY SHOT 7 (1453-1583) DAWN ON AGUS'S PORCH: the papaya
const PLATE = JV.PLATE, SRI7: V3 = [20.55, 0, 0.32], KA7: V3 = [21.55, 0, 1.05], KB7: V3 = [21.95, 0, 0.75];
const c7box = () => fitH([body(SRI7, 0.0, 1.75, 0.42), [PLATE, 0, 0.15, 0.2], body(KA7, 0.0, 1.5, 0.34)], 8, 10, 44, 0.26);
const c7a = F(() => c7box(), 1453, 0.0016, [[1484, 0.008, 7], [1540, 0.008, 7]]);
const c7p = F(() => ({ pos: [PLATE[0] + 0.12, PLATE[1] + 0.95, PLATE[2] + 0.62] as V3, look: [PLATE[0], PLATE[1] + 0.05, PLATE[2]] as V3, fov: 40 }), 1480, 0.002, [[1484, 0.008, 6]]);
const c7q = F(() => ({ pos: [PLATE[0] + 0.12, PLATE[1] + 0.95, PLATE[2] + 0.62] as V3, look: [PLATE[0], PLATE[1] + 0.05, PLATE[2]] as V3, fov: 40 }), 1536, 0.002, [[1540, 0.008, 6]]);
const c7sUnused = F((f) => { const k = sm(f, 1558, 1583); return { pos: [PLATE[0] + 0.12, PLATE[1] + 0.95 + 0.3 * k, PLATE[2] + 0.62 + 0.4 * k] as V3, look: [PLATE[0] - 0.3 * k, PLATE[1] + 0.05 + 3.0 * k, PLATE[2] - 2.4 * k] as V3, fov: 40 + 6 * k }; }, 1583, 0.0005);
SHOT_CAMS[7] = () => [K(1453, c7a, 1), K(1474, glideTo(c7a, 1474, c7p, 1488), 1), K(1508, glideTo(c7p, 1508, c7a, 1520), 1), K(1530, glideTo(c7a, 1530, c7q, 1542), 1)]   // ends on the whole papaya (the old tilt-up met the house wall);
KEY_PUNCH.push(1466, 1517);
KEY_NUDGE.push(1493, 1561);
SUN_REF[7] = 1460;
SHOT_ACTS[7] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const cut = f < 1540 ? lerp(0.15, 1, sm(f, 1457, 1505)) : 1 - sm(f, 1540, 1561);
  const ctl: Ctl = { papCut: cut, tally: 3000, repaint: 0, payoff: 0, heapN: 700 };
  // SRI: knife strokes on "cut" (1457-1500), fans the slices; on "still one papaya" she pushes the slices back together with both
  // hands (1540-1561) and raises an eyebrow at the kids
  const stroke = (g: number): V3 => { const u = ((g - 1457) % 11) / 11; return [PLATE[0] - 0.05 + 0.1 * u, PLATE[1] + 0.2 - 0.18 * Math.sin(Math.PI * u), PLATE[2] + 0.02]; };
  const sR = armSeq(f, [[1453, (g) => armTo(7, s, g, SRI7, [PLATE[0], PLATE[1] + 0.2, PLATE[2]], 1, 0.3, 1, "sit")], [1457, (g) => armTo(7, s, g, SRI7, g < 1500 ? stroke(g) : [PLATE[0] + 0.12, PLATE[1] + 0.1, PLATE[2]], 1, 0.3, 1, "sit"), 3],
    [1536, (g) => armTo(7, s, g, SRI7, [PLATE[0] + 0.12 - 0.1 * sm(g, 1540, 1561), PLATE[1] + 0.06, PLATE[2]], 1, 0.3, 1, "sit"), 6]]);
  const sL = armSeq(f, [[1453, (g) => armTo(7, s, g, SRI7, [PLATE[0] - 0.14, PLATE[1] + 0.05, PLATE[2]], -1, 0.3, 1, "sit")], [1536, (g) => armTo(7, s, g, SRI7, [PLATE[0] - 0.12 + 0.08 * sm(g, 1540, 1561), PLATE[1] + 0.06, PLATE[2]], -1, 0.3, 1, "sit"), 6]]);
  cast.push(C("sri", SRI7, { ...flow(f, [[1453, { expr: "calm", facing: 0.6, tilt: 6, look: 0.6 }], [1505, { expr: "sly", facing: 0.7, look: 0.9 }, 8], [1540, { expr: "smug", facing: 0.7, tilt: 3, headTilt: 5 }, 8]]),
    mode: "sit", armR: sR, armL: sL, armRFront: true, armLFront: true, propR: f < 1536 ? "knife" : undefined } as FigOpts, { idx: 3 }));
  // THE KIDS: lean in, eyes wide at twelve slices (1517-1527, "looks like more"), deflate when it's one papaya again (1561)
  ([["kidA", KA7], ["kidB", KB7]] as [string, V3][]).forEach(([w, p], i) => {
    cast.push(C(w, p, { ...flow(f, [[1453, { expr: "neutral", facing: -0.6, tilt: 2, armR: REST_R }], [1484 + i * 3, { expr: "joy", facing: -0.6, tilt: -4 }, 4], [1517 + i * 2, { expr: "beam", facing: -0.6, tilt: -6, armR: [[24, -12], [30, -36]] as A2 }, 3],
      [1561 + i * 3, { expr: "dismay", facing: -0.5, tilt: 4, armR: REST_R }, 4]]), armRFront: true } as FigOpts, { idx: 10 + i, scale: 0.78 }));
  });
  if (f >= 1517 && f < 1530) fx.push(...wordCard("x12p", "12 SLICES!", [PLATE[0] + 0.15, 1.15, PLATE[2] + 0.1], f - 1517, 13, "#f4c430", 0.4));
  if (f >= 1556 && f < 1578) fx.push(...wordCard("still1", "STILL ONE", [PLATE[0] + 0.08, PLATE[1] + 0.2, PLATE[2] + 0.12], f - 1556, 22, "#f4c430", 0.2));
  cast.push(C("henGold", [19.4 + 0.3 * Math.sin(f * 0.03), 0, 1.4], { facing: Math.cos(f * 0.03) > 0 ? 1 : -1, phase: f / 6 } as FigOpts, { idx: 40, scale: 0.9 }));
  const focus = follow(f, [[1453, [PLATE[0], PLATE[1] + 0.1, PLATE[2]]]]);
  return { ctl, cast, fx, focus, subj: (f >= 1478 && f < 1512) || f >= 1534 ? null : "sri" };
};
lens3([[1453, DOF_MS], [1478, DOF_INSERT, 8], [1510, DOF_MS, 8], [1534, DOF_INSERT, 8]]);

// ================================================= STORY SHOT 8 (1583-1972) DAWN AT THE STATION: the payoff
const RAL8: V3 = [0.12, 0, -0.72], RALS: V3 = [0.22, 0, -0.95], AG8: V3 = [0.55, 0, 0.95], GSK: V3 = [0.25, 0.95, 0.3];
const LID: V3 = [0.75, 0.97, -0.28];
const ralP = (f: number): V3 => (f < 1716 ? RAL8 : f < 1736 ? lerp3(RAL8, RALS, sm(f, 1716, 1736)) : RALS);
const c8a = F(() => fitH([body(RAL8, 0.5, 2.1, 0.42), [[0, 0.82, 0], 0, 0.15, 0.9]], 14, 16, 46, 0.24), 1583, 0.0016, [[1604, 0.01, 7]]);
const c8b = F(() => ({ pos: [0.5, 1.42, 1.05] as V3, look: [LID[0] - 0.08, LID[1] - 0.05, LID[2]] as V3, fov: 42 }), 1650, 0.0024, [[1653, 0.008, 7], [1706, 0.008, 7]]);
const c8c = F(() => fitH([body(RALS, 0.5, 2.15, 0.42), [SIGN, -0.32, 0.32, 0.56]], 16, 6, 46, 0.24), 1714, 0.0014, [[1738, 0.007, 7], [1796, 0.008, 7]]);
const c8d = F(() => fitH([body(AG8, 0.3, 2.1, 0.42), body(RALS, 0.4, 2.15, 0.42), [GSK, -0.05, 0.15, 0.2]], -25, 8, 46, 0.2, 0.25), 1826, 0.0014, [[1859, 0.005, 6]]);
const c8e = F(() => fitH([body(AG8, 0.7, 2.1, 0.42), [GSK, -0.05, 0.15, 0.18]], -18, 6, 40, 0.38, 0.35), 1935, 0.0022, [[1944, 0.008, 6]]);
SHOT_CAMS[8] = () => [K(1583, c8a, 1), K(1644, glideTo(c8a, 1644, c8b, 1656), 1), K(1710, glideTo(c8b, 1710, c8c, 1724, 0.15), 1), K(1820, glideTo(c8c, 1820, c8d, 1836, 0.1), 1), K(1928, glideTo(c8d, 1928, c8e, 1940), 1)];
KEY_PUNCH.push(1604, 1653, 1738, 1944);
KEY_NUDGE.push(1634, 1680, 1778, 1885, 1921);
SUN_REF[8] = 1600;
SHOT_ACTS[8] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  // the glued skull: carried in Agus's right hand as he walks in (1826-1852), raised (1852-1856), slapped on the table at 1859
  const aw = walkPath(8, s, [[1.6, 0, 3.4], [0.4, 0, 2.0], AG8], f, 1826, 1852);
  const carry: V3 = [aw.p[0] - 0.2, 1.02, aw.p[2] + 0.05], up: V3 = [GSK[0] - 0.02, 1.32, GSK[2] + 0.05];
  const gP: V3 = f < 1852 ? carry : f < 1856 ? lerp3(carry, up, sm(f, 1852, 1856)) : lerp3(up, GSK, Math.min(1, (f - 1856) / 3));
  const ctl: Ctl = { payoff: 1, heapN: 700, tally: 3000, repaint: sm(f, 1740, 1808), gVis: f >= 1820 ? 1 : 0, gX: gP[0], gY: gP[1], gZ: gP[2], gRY: -0.4, skVis: 0, papCut: 0 };
  // RALPH: hunched over the heap with a magnifier and tweezers (1583-1604), the shock on "notices" (1604), slumps at the lid
  // (1660-1706); walks to the sign (1716-1736), paints over "PER PIECE" -> "WHOLE SKULLS ONLY" (1740-1808), proud; the slap
  // (1859) makes him jump; he stares at the glued skull (1880-1972)
  const rp = ralP(f), rw = f >= 1716 && f < 1736;
  const brush = (g: number): V3 => { const u = sm(g, 1740, 1808); return [SIGN[0] + 0.3 + 0.18 * Math.sin(u * 9), SIGN[1] + 0.12 - 0.22 * u + 0.04 * Math.sin(g * 0.9), SIGN[2] + 0.06]; };   // long-handled brush strokes across the right of the board
  const rR = armSeq(f, [[1583, (g) => armTo(8, s, g, RAL8, [0.08 * Math.sin(g * 0.13), 0.9, 0.05], 1, 0.3)], [1604, fixA([[28, -16], [40, -40]]), 3], [1626, (g) => armTo(8, s, g, RAL8, [0.1, 0.9, 0.0], 1, 0.3), 10],
    [1716, fixA(REST_R), 8], [1860, fixA([[30, -18], [42, -44]]), 3], [1876, fixA([[22, 6], [26, 20]]), 12]]);
  cast.push(C("ralph", rp, { ...flow(f, [
    [1583, { expr: "stare", facing: 0.2, tilt: 14, look: 0.3 }],
    [1604, { expr: "shock", facing: 0.2, tilt: -8, headBack: 0.7 }, 3],
    [1626, { expr: "worry", facing: 0.1, tilt: 10 }, 10],
    [1680, { expr: "breakdown", facing: 0.1, tilt: 14 }, 10],
    [1738, { expr: "determined", facing: -0.7, tilt: 3, look: -0.9 }, 8],
    [1810, { expr: "proud", facing: 0.5, tilt: -2 }, 8],
    [1860, { expr: "shock", facing: 0.6, tilt: -8, headBack: 0.7 }, 3],
    [1880, { expr: "stare", facing: 0.6, tilt: 4, look: 0.5 }, 10],
  ]), ...(rw ? { mode: "walk", phase: (f - 1716) / 10 } : {}), armR: rR, armRFront: true, propR: f < 1716 ? "tweezers" : undefined,
    armL: armSeq(f, [[1583, fixA([[-24, -8], [-30, -32]])], [1716, fixA(REST_L), 8], [1736, (g) => armTo(8, s, g, RALS, brush(g), -1, -0.5), 6], [1812, fixA(REST_L), 10]]), armLFront: true,
    propL: f < 1716 ? "magnifier" : f >= 1724 && f < 1812 ? "brush" : undefined, propLAng: f >= 1736 && f < 1812 ? -0.6 : 0 } as FigOpts, { idx: 2 }));
  if (f >= 1604 && f < 1616) fx.push(...wordCard("3000", "3000 PIECES", [0.1, 1.3, 0.2], f - 1604, 12, "#f4c430", 0.62));
  // AGUS: walks in with the glued skull (1826-1852), raises it (1852-1856), SLAMS it down (1859) - sap still dripping; leans on
  // the table, smug; the callback in close-up: "One piece, pal." (1944-1966), a slow blink at the end
  const aL = f < 1852 ? armTo(8, s, f, aw.p, carry, -1, 0.2) : armTo(8, s, f, AG8, [gP[0] - 0.02, gP[1] + 0.12, gP[2]], -1, 0.2);
  const aF = flow(f, [[1820, { expr: "smug", facing: -0.6 }], [1856, { expr: "determined", facing: -0.5, tilt: -5 }, 3], [1859, { expr: "smug", facing: -0.5, tilt: 6 }, 2],
    [1900, { expr: "smug", facing: -0.4, headTilt: 5, look: 0.4 }, 10], [1944, { expr: "smug", facing: -0.3, tilt: -2, headTilt: 6 }, 6], [1966, { expr: "smug", facing: -0.3 }, 4]]);
  if (f >= 1820) cast.push(C("agus", f < 1852 ? aw.p : AG8, speak(f, 1942, 1970, { ...aF, ...(f < 1852 ? walkO(aw, { expr: "smug" }) : {}), armL: aL, armLFront: true,
    armR: f >= 1862 ? armTo(8, s, f, AG8, [AG8[0] + 0.3, 0.84, 0.45], 1, 0.2) : REST_R, armRFront: true, headTilt: ((aF.headTilt as number) ?? 0) + talkNod(f, 1942, 1970) } as P) as FigOpts, { idx: 1 }));
  if (f >= 1859 && f < 1867) fx.push(...wordCard("slap", "SLAP!", [GSK[0], 1.35, GSK[2] + 0.1], f - 1859, 8, "#f4c430", 0.36), ...chips("sap", GSK, f - 1859, 6));
  if (f >= 1859 && f < 1880) fx.push(dustCard("slapd", [GSK[0], 0.85, GSK[2] + 0.1], 0.6 + (f - 1859) * 0.03, Math.max(0, 0.6 - (f - 1859) / 20), 4));
  const focus = follow(f, [[1583, hd(RAL8, 1.1)], [1646, LID, 8], [1712, hd(RALS, 1.2), 12], [1826, GSK, 10], [1930, hd(AG8, 1.2), 8]]);
  return { ctl, cast, fx, focus, subj: f < 1646 ? "ralph" : f < 1712 ? null : f < 1848 ? "ralph" : "agus" };
};
lens3([[1583, DOF_MS], [1646, DOF_INSERT, 8], [1712, DOF_MS, 10], [1826, DOF_FS, 10], [1930, DOF_CU, 8]]);
KICKS.push([1859 / 30, 5]);
void c7sUnused;
