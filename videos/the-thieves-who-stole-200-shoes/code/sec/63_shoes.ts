// =====================================================================================================================
// "The Thieves Who Stole 200 Shoes Nobody Can Wear" (2026-11-23), master prompt v27. Plan: p11/checkpoints/CP2_right_shoes_plan.md
// Eleven scene ids in one set (shoeset): the shoe shop (home base) + its street, the garage hideout, the car-door insert.
// Hard cuts at 848 (reaction close-up), 1044 (laugh -> toast), 1490 (insert), 1787 (the callback). Dissolves: 158 (the
// torch light -> the lit clock face, a time jump), 1349 / 1682 (shoe -> shoe shape matches), 1575 (glove -> shoe).
// 740 rides the box tower on the tricycle into the garage; 515 is one camera move under the rising shutter.
const FLr = SH0.FL;
const HY = 1.32;
const hd = (p: V3, y = HY): V3 => [p[0], p[1] + y, p[2]];
const cam3 = (pos: V3, look: V3, fov: number) => ({ pos, look, fov });
const val = (f: number, ks: [number, number][]) => { if (f <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], sm(f, ks[i - 1][0], ks[i][0])); return ks[ks.length - 1][1]; };
const OWN = "shOwner", BOSS = "shBoss", BIG = "shBig", SKIN = "shSkinny", BAKER = "shBaker";
/** the tricycle's rider seat and handlebar for a trike at p with yaw */
const trikeSeat = (p: V3, yaw: number): V3 => [p[0] - 0.27 * Math.cos(yaw), p[1] + 0.97, p[2] + 0.27 * Math.sin(yaw)];
const trikeBar = (p: V3, yaw: number): V3 => [p[0] + 0.12 * Math.cos(yaw), p[1] + 1.05, p[2] - 0.12 * Math.sin(yaw)];
// (inside the shop the camera looks +z, so +x is screen LEFT: the boxes sit to the screen RIGHT of the sweepers)
// (sitting helpers)
/** sitting on a seat surface: the card stands on the floor and the legs reach up to the seat (fig.ts sitLeg) */
const HHM: Record<string, number> = { shSkinny: 2 * 110 * 0.94 * SU, shBoss: 2 * 118 * 0.94 * SU, shBig: 2 * 120 * 0.94 * SU, shOwner: 2 * 120 * 0.94 * SU, shBaker: 2 * 120 * 0.94 * SU };
const legFor = (who: string, h: number) => Math.max(0, h / (HHM[who] ?? 0.48) - 0.25);
const sitC = (who: string, seat: V3, floorY: number, o: FigOpts, extra: Partial<CastPlace> = {}): CastPlace =>
  C(who, [seat[0], floorY, seat[2]], o.mode === "sit" ? { ...o, sitLeg: legFor(who, seat[1] - floorY) } : o, extra);
const armSit = (id: number, s: SetDef, f: number, seat: V3, floorY: number, T: V3, side: 1 | -1, fs: number, who: string): A2 =>
  armTo(id, s, f, [seat[0], floorY, seat[2]], [T[0], T[1] - legFor(who, seat[1] - floorY) * (HHM[who] ?? 0.48), T[2]], side, fs, 1, "sit", 6);
const SWEEP_A: A2 = [[-30, -4], [-56, -8]], SWEEP_A2: A2 = [[6, -2], [-24, -6]];        // arms reaching along the shelf (screen left)
const SWEEP_B: A2 = [[4, -2], [30, -4]], SWEEP_B2: A2 = [[30, -4], [58, -6]];     // arms pulled to the box (screen right)
const CROSS_R: A2 = [[20, 12], [-10, 14]], CROSS_L: A2 = [[-20, 12], [10, 10]];       // arms crossed
const WAVE = (f: number): A2 => [[26, -16], [40 + 8 * Math.sin(f * 0.55), -46]];
const BEER_UP: A2 = [[22, -10], [26, -40]], SIP_R: A2 = [[20, 6], [6, -16]], MUG_R: A2 = [[22, 14], [24, 2]];
/** the front-most shoe of the garage pile (the shape matches at 1349 and 1682 start / end on it) */
const PILE_I = (() => { let b = 0; for (let i = 1; i < 34; i++) if (pileAt(i).p[2] < pileAt(b).p[2] && pileAt(i).p[1] < 0.1) b = i; return b; })();
const PILE_P = pileAt(PILE_I).p;
const PILE_K = Math.floor(((Math.sin((PILE_I * 7 + 3) * 127.1 + 5 * 311.7) * 43758.5453) % 1 + 1) % 1 * 12);
/** the wall shoe the 1349 match lands on: the lowest slot with the same colour as the pile shoe */
const WALL_SHOE = (() => { for (let j = 0; j < 90; j++) { const r = Math.floor(j / 15), c = j % 15; if (wallColIdx(r, c) === PILE_K && c > 1 && c < 13) return { r, c }; } return { r: 0, c: 3 }; })();
const WALL_K = PILE_K;
const WALL_P: V3 = [SH0.COLS[WALL_SHOE.c], SH0.ROWS[WALL_SHOE.r], 4.925];
const lowOn = (p: V3, fov = 44): { pos: V3; look: V3; fov: number } => ({ pos: [p[0] + 0.03, p[1] + 0.09, p[2] - 0.98], look: [p[0], p[1] + 0.07, p[2]], fov });

// ================================================= SHOT 1 (0-158) HOOK: the boss sweeps a shelf into a box (night)
const B1: V3 = [-2.25, FLr, 4.22], SK1: V3 = [-3.45, FLr, 3.05];
const c1a = F(() => cam3([-0.95, 1.62, 1.15], [-2.62, 1.15, 4.4], 50), 0, 0.0028);
const c1b = F(() => cam3([0.05, 1.5, 2.8], [0.4, 1.42, 4.95], 48), 116, 0.0016);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true), K(96, glideTo(c1a, 96, c1b, 128, 0.04), 1)];
SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const gone = val(f, [[0, 0.38], [24, 1.0], [40, 1.0], [66, 2.0]]);
  const ctl: Ctl = { shut: 1, gone, toBox: 0, loot: 0, lootOn: 1, trOn: 0 };
  // the boss: mid-sweep on frame 0, a second sweep (40-62), leans on the box and glances back at the door (76), grabs again (100)
  const swp = (g: number, a: number, b: number) => { const k = sm(g, a, b); return [arcArm(SWEEP_A as unknown as number[][], SWEEP_B as unknown as number[][], k), arcArm(SWEEP_A2 as unknown as number[][], SWEEP_B2 as unknown as number[][], k)] as [A2, A2]; };
  const armsAt = (g: number): [A2, A2] => g < 30 ? swp(g, -4, 22) : g < 40 ? swp(40 - g, 0, 10) : g < 70 ? swp(g, 42, 64) : [[[24, 8], [36, 20]], [[-26, 10], [-40, 18]]];
  const [aR, aL] = armsAt(f);
  cast.push(C(BOSS, B1, { ...flow(f, [[0, { expr: "strain", facing: 0.7, tilt: 9 }], [26, { expr: "scheme", facing: 0.7, tilt: 4 }, 6], [42, { expr: "strain", facing: 0.7, tilt: 9 }, 4], [70, { expr: "scheme", facing: 0.4, tilt: 3, look: -0.6 }, 8], [100, { expr: "sly", facing: 0.6, tilt: 5 }, 8]]),
    armR: aL, armL: aR, armRFront: true, armLFront: true } as FigOpts, { idx: 1 }));
  // the skinny one: the torch on the shelves, nervous glances toward the street
  const tAng = -0.35 + 0.25 * Math.sin(f * 0.05);
  cast.push(C(SKIN, SK1, { ...flow(f, [[0, { expr: "worry", facing: 0.6, look: 0.3 }], [50, { expr: "worry", facing: 0.4, look: -0.7 }, 8], [84, { expr: "nervous", facing: 0.7, look: 0.2 }, 8]]),
    armR: [[26, 2], [44, -2]], armRFront: true, propR: "torch", propK: 1, propRAng: tAng } as FigOpts, { idx: 2 }));
  if (f >= 150) fx.push(glowBurst("torch1", camPt(1, s, f, 1.4, 0.05, -0.05), 0.55, sm(f, 150, 158) * 0.5));
  const focus = follow(f, [[0, hd(B1, 1.35)], [128, [0.4, 1.4, 4.9], 30]]);
  return { ctl, cast, fx, focus, subj: f < 100 ? BOSS : null };
};
lens3([[0, DOF_MS], [100, DOF_MS, 24]]);

// ================================================= SHOT 2 (158-515) THE STREET AT 3 A.M. (night)
const TRK_Z = -4.55, TRK_A = 176, TRK_B = 246, TRK_X0 = -10.5, TRK_X1 = -1.1;
const trkX2 = (f: number) => lerp(TRK_X0, TRK_X1, sm(f, TRK_A, TRK_B));
const BIG2: V3 = [2.95, FLr, -0.62], BOSS2: V3 = [0.75, FLr, -1.05];
/** the bolt cutters as a card in the world: grips at GRIP (in the big guy's hands), jaws on the padlock */
const GRIP: V3 = [2.62, SH0.LOCK[1] + 0.0, -0.46];
const bigP = (f: number, hang: number): V3 => [BIG2[0], FLr + 0.0 * hang, BIG2[2]];
const cuttersCard = (f: number, open: number): FxSpec => {
  const a = GRIP, b: V3 = [SH0.LOCK[0] + 0.04, SH0.LOCK[1] + 0.01, SH0.LOCK[2] - 0.05], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
  return { kind: "card", key: "cutters" + Math.round(open * 10), pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], w: L + 0.06, h: 0.16, cw: 512, ch: 112,
    draw: (p) => { const g = p.g, o = Math.max(0, Math.min(1, open)), INKc = "#241726";
      const band = (x0: number, y0: number, x1: number, y1: number, w: number, c: string) => { g.lineCap = "round"; g.strokeStyle = INKc; g.lineWidth = w + 7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      for (const sg of [-1, 1]) { band(14, 56 + sg * 10, 420, 56 + sg * (3 + o * 14), 9, "#6a707c"); band(10, 56 + sg * 12, 96, 56 + sg * 11, 15, "#c8352e"); }
      g.fillStyle = "#3a3e48"; g.strokeStyle = INKc; g.lineWidth = 5;
      for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(420, 56 + sg * (3 + o * 14)); g.lineTo(500, 56 + sg * (2 + o * 22)); g.lineTo(492, 56 + sg * 1); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle = "#9aa0aa"; g.beginPath(); g.arc(420, 56, 10, 0, 6.3); g.fill(); g.stroke(); } };
};
const c2a = F(() => cam3([2.55, 3.25, -5.05], [3.25, 3.55, -2.9], 42), 158, 0.0016);
const c2b = F((f) => { const x = Math.max(trkX2(f), -4.2); return cam3([x - 1.2, 1.62, -9.4], [x + 0.25, 1.3, -4.0], 52); }, 236, 0.0012);
const c2c = F(() => cam3([2.7, 1.02, -3.85], [2.62, 1.06, -0.35], 50), 266, 0.0022, [[268, 0.008, 5], [301, 0.008, 5], [337, 0.006, 8]]);
const c2d = F(() => cam3([0.55, 1.35, -3.3], [0.1, 1.25, 0.1], 52), 440, 0.001);
const c2e = F(() => cam3([0.15, 1.48, 0.95], [-0.35, 1.38, 4.9], 52), 515, 0.0012);
SHOT_CAMS[2] = () => [K(158, c2a, 1, true), K(196, glideTo(c2a, 196, c2b, 236, 0.3), 1), K(250, glideTo(c2b, 250, c2c, 268, 0.05), 1),
  K(418, glideTo(c2c, 418, c2d, 440, 0.06), 1), K(466, glideTo(c2d, 466, c2e, 515, 0.05, [0, 0, 0], 0.0, 0.25), 1)];
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const tx = trkX2(f), tp: V3 = [tx, 0, TRK_Z];
  const snapF = 413, shut = val(f, [[438, 0], [470, 0.74], [486, 1.0]]);
  const ctl: Ctl = { shut, gone: 0, loot: 0, lootOn: 0, trOn: 1, trX: tx, trY: 0, trZ: TRK_Z, trYaw: 0, trRoll: (tx - TRK_X0) / 0.3, snap: f >= snapF ? 1 : 0, lockFall: sm(f, snapF, snapF + 16) };
  // the skinny one pedals the tricycle in, brakes with his feet (238), stays on the seat, looks both ways
  const pedal = (tx - TRK_X0) / (2 * Math.PI * 0.3) * 1.4;
  cast.push(sitC(SKIN, trikeSeat(tp, 0), 0, { ...flow(f, [[158, { expr: "worry", facing: -1, mode: "sit", look: -0.2 }], [246, { expr: "nervous", facing: 0.6, mode: "sit", look: 0.6 }, 8], [300, { expr: "worry", facing: -0.6, mode: "sit", look: -0.5 }, 10], [380, { expr: "worry", facing: -0.8, mode: "sit" }, 8], [413, { expr: "joy", facing: -0.8, mode: "sit" }, 6]]),
    pedal: f < 240 ? pedal : undefined, armR: f < 300 ? armSit(2, s, f, trikeSeat(tp, 0), 0, trikeBar(tp, 0), 1, -0.6, SKIN) : [[20, 6], [34, 16]] as A2, armL: armSit(2, s, f, trikeSeat(tp, 0), 0, trikeBar(tp, 0), -1, -0.6, SKIN), armLFront: true } as FigOpts, { idx: 3 }));
  // the boss and the big guy walk in on the pavement behind it, then take up their places at the shutter
  const wB = walkPath(2, s, [[-9.6, FLr, -2.45], [-1.2, FLr, -2.35], BOSS2], f, 176, 262), wG = walkPath(2, s, [[-10.6, FLr, -2.0], [-0.5, FLr, -1.9], BIG2], f, 172, 266);
  const crossed = f >= 270 && f < 300 || f >= 316 && f < 396;
  cast.push(C(BOSS, f < 262 ? wB.p : f < 418 ? BOSS2 : path3(f, [[418, BOSS2], [436, [0.25, FLr, -0.42]], [478, [0.25, FLr, -0.42]], [508, [1.45, FLr, 1.15]]]), { ...flow(f, [[158, { expr: "sly", facing: wB.facing }], [262, { expr: "tacheUp", facing: -0.8 }, 8], [301, { expr: "angry", facing: -0.8, tilt: -3 }, 6], [318, { expr: "tacheUp", facing: -0.8 }, 8], [413, { expr: "joy", facing: -0.8 }, 5], [436, { expr: "strain", facing: 0, mode: "brace" }, 6], [476, { expr: "scheme", facing: -0.4 }, 8], [480, { expr: "scheme", facing: -0.8, mode: "walk", phase: ph(f, 14) }, 6], [508, { expr: "scheme", facing: -0.6 }, 6]]),
    ...(f < 262 && wB.moving ? { mode: "walk", phase: wB.phase } : {}),
    armR: f >= 436 ? [[26, -10 - 30 * sm(f, 440, 470)], [30, -20 - 50 * sm(f, 440, 470)]] as A2 : crossed ? CROSS_R : undefined, armL: f >= 436 ? [[-26, -10 - 30 * sm(f, 440, 470)], [-30, -20 - 50 * sm(f, 440, 470)]] as A2 : crossed ? CROSS_L : undefined, armRFront: crossed, armLFront: crossed } as FigOpts, { idx: 1 }));
  // the big guy and the bolt cutters: two squeezes clank (268, 301), he hangs off the handles with both feet (337-368), the third bite snaps it (413) and he falls on his back
  const fell = f >= 418;
  const bite = (g: number) => Math.max(bump((g - 262) / 12), bump((g - 295) / 12), bump((g - 390) / 22)) ;
  const hang = sm(f, 334, 340) * (1 - sm(f, 368, 378));
  if (!fell) cast.push(C(BIG, f < 266 ? wG.p : bigP(f, hang), { ...flow(f, [[158, { expr: "neutral", facing: wG.facing }], [262, { expr: "determined", facing: 1 }, 6], [266, { expr: "strain", facing: 1, tilt: 6 }, 4], [276, { expr: "dismay", facing: 1 }, 6], [296, { expr: "strain", facing: 1, tilt: 8 }, 4], [310, { expr: "breakdown", facing: 1 }, 6], [334, { expr: "strain", facing: 1, tilt: 12 }, 4], [392, { expr: "strain", facing: 1, tilt: 10 }, 4]]),
    ...(f < 266 && wG.moving ? { mode: "walk", phase: wG.phase } : hang > 0.05 ? { mode: "hop", lift: 0.55 * hang + 0.15 * hang * Math.sin(f * 0.9), phase: f / 7 } : { mode: "brace", braceK: 0.6 + 0.4 * bite(f) }),
    armR: f < 262 ? undefined : armTo(2, s, f, bigP(f, hang), GRIP, 1, 0.8), armL: f < 262 ? undefined : armTo(2, s, f, bigP(f, hang), [GRIP[0] + 0.12, GRIP[1] - 0.02, GRIP[2]], -1, 0.8), armRFront: true, armLFront: true } as FigOpts, { idx: 2 }));
  if (f >= 262 && !fell) fx.push(cuttersCard(f, 0.55 - 0.55 * bite(f)));
  else cast.push(C(BIG, [BIG2[0] + 0.35 * sm(f, 418, 424), FLr, BIG2[2] - 0.25], { ...flow(f, [[418, { expr: "dizzy", mode: "lie", legsUp: 0.9 }], [450, { expr: "dizzy", mode: "lie", legsUp: 0.4 }, 12], [480, { expr: "joy", mode: "lie", legsUp: 0.3 }, 10]]), propR: "cutters", propK: 0.9, propRAng: 0.4 } as FigOpts, { idx: 2 }));
  // the clanks + the snap
  for (const [a, sz] of [[268, 0.32], [301, 0.32], [413, 0.6]] as [number, number][]) { const c = clang("lock" + a, [SH0.LOCK[0], SH0.LOCK[1] + 0.02, SH0.LOCK[2] - 0.12], f - a, sz); if (c) fx.push(c); }
  fx.push(...sparkleSet("snap", [SH0.LOCK[0], SH0.LOCK[1], SH0.LOCK[2] - 0.1], f - 413));
  if (f >= 418 && f < 440) fx.push(dustCard("fall", [BIG2[0] + 0.4, FLr + 0.2, BIG2[2] - 0.3], 0.6, 0.6 * (1 - (f - 418) / 22), 3));
  // a stray dog by the bakery
  cast.push(C("dog", [6.6, FLr, -1.3], pose(null, { expr: "neutral", facing: f < 400 ? -1 : 1, mode: f > 300 && f < 330 ? "walk" : "stand", phase: ph(f, 14) }), { idx: 9, scale: 0.7 }));
  if (f < 168) fx.push(glowBurst("torch2", [3.25, 3.55, -3.0], 0.6, (1 - sm(f, 158, 168)) * 0.5));
  const focus = follow(f, [[158, [3.25, 3.55, -2.95]], [236, (g) => [trkX2(g) + 0.4, 1.4, TRK_Z], 30], [268, [2.1, 1.15, -0.3], 18], [440, [0.1, 1.3, -0.3], 22], [515, [-0.4, 1.4, 4.9], 40]]);
  return { ctl, cast, fx, focus, subj: f < 236 ? null : f < 418 ? BIG : BOSS };
};
const sparkleSet = (key: string, p: V3, age: number): FxSpec[] => { const out: FxSpec[] = []; for (let i = 0; i < 5; i++) { const a = i * 1.3, sp = sparkle(key + i, [p[0] + Math.cos(a) * 0.04 * age, p[1] + 0.03 * age - 0.002 * age * age, p[2] - 0.02 * age], age - i, 0.14); if (sp) out.push(sp); } return out; };
lens3([[158, DOF_INSERT], [236, DOF_FS, 30], [268, DOF_CU, 18], [440, DOF_MS, 22], [500, DOF_FS, 20]]);
KICKS.push([268 / 30, 3], [301 / 30, 3], [413 / 30, 6]);

// ================================================= SHOT 3 (515-740) INSIDE: the wave at the camera, the sweep, the tower (night)
const BOSS3: V3 = [2.05, FLr, 1.85];
const c3a = F(() => cam3([3.82, 3.05, 0.35], [2.05, 1.52, 1.85], 50), 540, 0.0005);
const c3b = FS(() => cam3([-2.5, 1.46, 2.45], [-2.05, 1.3, 4.95], 52), 632, 0.0008, -0.024);
const c3c = F(() => cam3([1.25, 1.42, 0.35], [-0.45, 1.2, -1.75], 54), 704, 0.0015);
const trkX3 = (f: number) => lerp(-0.7, 1.55, sm(f, 708, 742));
const c3d = (f: number) => { const x = trkX3(f) + 0.55; return { pos: [x + 0.05, 1.48, -0.9] as V3, look: [x, 1.46, -1.75] as V3, fov: 50, roll: 0 }; };
SHOT_CAMS[3] = () => [K(515, c3a, 26), K(624, glideTo(c3a, 624, c3b, 650, 0.1), 1), K(694, swing(c3b, 694, c3c, 712), 1), K(724, glideTo(c3c, 724, c3d, 740), 1)];
SHOT_ACTS[3] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const out = f >= 700;
  const gone = val(f, [[515, 2], [628, 2], [698, 24]]);
  const tx = trkX3(f), tp: V3 = [tx, FLr, -1.55];
  const ctl: Ctl = { shut: 1, gone, loot: out ? 1 : 0, lootOn: 1, trOn: out ? 1 : 0, trX: tx, trY: FLr, trZ: -1.55, trYaw: 0, trRoll: (tx + 0.7) / 0.3, trWob: out ? 1 : 0, snap: 1, lockFall: 1, fill0: out ? 16 : undefined as unknown as number, fill1: out ? 16 : undefined as unknown as number, fill2: out ? 16 : undefined as unknown as number };
  if (!out) { delete ctl.fill0; delete ctl.fill1; delete ctl.fill2; }
  // the boss walks in under the camera, turns, waves up at it, says his line and takes a mock bow
  if (!out) {
    const bp = path3(f, [[515, [1.45, FLr, 1.15]], [530, BOSS3], [626, BOSS3], [662, [-1.15, FLr, 4.22]]]);
    const swpK = f >= 662 ? (Math.floor((f - 662) / 16) % 2 ? 1 - sm((f - 662) % 16, 0, 12) : sm((f - 662) % 16, 0, 12)) : 0;
    cast.push(C(BOSS, bp, { ...speak(f, 555, 616, flow(f, [[515, { expr: "scheme", facing: -0.4, mode: "walk", phase: ph(f, 14) }], [528, { expr: "mock", facing: 0, look: 0.2, headBack: 0.25 }, 6], [555, { expr: "tacheUp", facing: 0, headBack: 0.2 }, 6], [604, { expr: "smug", facing: 0, tilt: 9, headBack: 0 }, 6], [626, { expr: "scheme", facing: -0.8, mode: "walk", phase: ph(f, 12) }, 6], [662, { expr: "strain", facing: 0.7, tilt: 7 }, 6]])),
      armR: f < 524 ? undefined : f < 600 ? WAVE(f) : f < 662 ? [[24, -2], [14, 18]] as A2 : arcArm(SWEEP_A as unknown as number[][], SWEEP_B as unknown as number[][], swpK),
      armL: f >= 662 ? arcArm(SWEEP_A2 as unknown as number[][], SWEEP_B2 as unknown as number[][], swpK) : f >= 604 && f < 624 ? [[-24, 10], [-6, 24]] as A2 : undefined, armRFront: true, armLFront: f >= 662 } as FigOpts, { idx: 1 }));
    // the big guy (rubbing his back) and the skinny one sweep the far end; the boxes thump on 641 / 664 / 673
    const swpG = Math.floor((f - 600) / 14) % 2 ? 1 - sm((f - 600) % 14, 0, 10) : sm((f - 600) % 14, 0, 10);
    cast.push(C(BIG, [1.35, FLr, 4.25], { ...flow(f, [[515, { expr: "strain", facing: 0.7, tilt: 6 }], [580, { expr: "strain", facing: 0.7, tilt: 8 }, 8], [660, { expr: "joy", facing: 0.6 }, 8]]),
      armR: f < 600 ? [[-10, 10], [-20, 28]] as A2 : arcArm(SWEEP_A as unknown as number[][], SWEEP_B as unknown as number[][], swpG), armL: f < 600 ? [[-24, 10], [-10, 26]] as A2 : arcArm(SWEEP_A2 as unknown as number[][], SWEEP_B2 as unknown as number[][], swpG), armRFront: true, armLFront: true } as FigOpts, { idx: 2 }));
    cast.push(C(SKIN, [0.75, FLr, 3.95], { ...flow(f, [[515, { expr: "worry", facing: -1, look: -0.5 }], [600, { expr: "joy", facing: -0.5 }, 8]]),
      armR: [[24, 4], [42, -2]], armRFront: true, propR: "torch", propK: 1, propRAng: -0.3 } as FigOpts, { idx: 3 }));
    for (const [a, b] of [[641, 0], [664, 1], [673, 2]] as [number, number][]) if (f >= a && f < a + 12) fx.push(dustCard("thump" + b, [SH0.BOX_SPOTS[b][0], 0.75, SH0.BOX_SPOTS[b][2] - 0.25], 0.45, 0.5 * (1 - (f - a) / 12), b + 1));
  } else {
    // the tower: the skinny one pedals the three loaded boxes away, the tower wobbling over his head
    cast.push(sitC(SKIN, trikeSeat(tp, 0), FLr, { ...flow(f, [[700, { expr: "strain", facing: 1, mode: "sit", tilt: -6 }], [720, { expr: "worry", facing: 1, mode: "sit", tilt: 6, look: -0.4 }, 6]]),
      pedal: (tx + 0.7) / 1.9 * 1.4, armR: armSit(3, s, f, trikeSeat(tp, 0), FLr, trikeBar(tp, 0), 1, 0.6, SKIN), armL: armSit(3, s, f, trikeSeat(tp, 0), FLr, trikeBar(tp, 0), -1, 0.6, SKIN), armRFront: true } as FigOpts, { idx: 3 }));
    cast.push(C(BOSS, [-1.9, FLr, -1.1], { ...flow(f, [[700, { expr: "joy", facing: 1 }], [716, { expr: "joy", facing: 1, mode: "walk", phase: (f - 716) / 14 }, 6]]), armR: [[24, -10], [34, -36]] } as FigOpts, { idx: 1 }));
  }
  const focus = follow(f, [[515, hd(BOSS3, 1.38)], [650, [-1.4, 1.3, 4.9], 22], [712, (g) => [trkX3(g) + 0.4, 1.6, -1.6], 18]]);
  return { ctl, cast, fx, focus, subj: f < 628 ? BOSS : f < 700 ? null : SKIN };
};
lens3([[515, DOF_MS], [650, DOF_MS, 20], [712, DOF_MS, 14]]);

// ================================================= SHOT 4 (740-848) THE GARAGE AT SUNRISE (ride the tower in)
const trkZ4 = (f: number) => lerp(1.0, 4.35, sm(f, 736, 790));
const c4a = (f: number) => { const z = Math.min(trkZ4(f) + 0.55, 2.1); return { pos: [GX - 0.5, 1.48, z] as V3, look: [GX + 0.5, 1.46, z + 0.02] as V3, fov: 50, roll: 0 }; };
const c4b = F(() => cam3([GX - 1.35, 1.42, 1.55], [GX - 3.5, 1.05, 3.35], 52), 800, 0.0016);
SHOT_CAMS[4] = () => [K(740, c4a, 1, true), K(764, glideTo(c4a, 764, c4b, 806, 0.12, [0, 0, -0.3]), 1)];
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const tz = trkZ4(f), tp: V3 = [GX + 0.1, 0.05, tz], yaw = -Math.PI / 2;
  const ctl: Ctl = { loot: 1, lootOn: 1, fill0: 16, fill1: 16, fill2: 16, trOn: 1, trX: tp[0], trY: 0.05, trZ: tz, trYaw: yaw, trRoll: (tz - 1.0) / 0.3, trWob: 1 - sm(f, 780, 800), pile: 22, table: 12, gdoor: 0.92 };
  cast.push(sitC(SKIN, trikeSeat(tp, yaw), 0.05, { ...flow(f, [[740, { expr: "strain", facing: 1, mode: "sit" }], [792, { expr: "joy", facing: -0.6, mode: "sit" }, 8]]), pedal: f < 792 ? (tz - 1.0) / 1.9 * 1.4 : undefined,
    armR: armSit(4, s, f, trikeSeat(tp, yaw), 0.05, trikeBar(tp, yaw), 1, 0.4, SKIN), armL: armSit(4, s, f, trikeSeat(tp, yaw), 0.05, trikeBar(tp, yaw), -1, 0.4, SKIN), armRFront: true } as FigOpts, { idx: 3 }));
  // the big guy asleep in the chair; the boss on a crate at the bench, licking his thumb and counting the money
  const chair = SH0.G_SEATS[1];
  cast.push(sitC(BIG, [chair[0], 0.5, chair[2]], 0.05, pose(null, { expr: "sleep", mode: "sit", facing: 0.3, headTilt: 14 + 3 * Math.sin(f * 0.12), tilt: 6, armR: [[24, 20], [18, 40]], armL: [[-24, 20], [-18, 40]] }), { idx: 2 }));
  fx.push(...zzz([chair[0] + 0.15, 1.45, chair[2]], f));
  const seat: V3 = [GX - 3.4 + 0.25, 0.55, 3.2 - 0.2];   // front edge of the wooden crate, toward the camera
  const flick = (f - 812) / 6;
  cast.push(sitC(BOSS, seat, 0.05, { ...flow(f, [[740, { expr: "joy", facing: 0.6, mode: "sit" }], [814, { expr: "scheme", facing: 0.5, mode: "sit", look: 0.3 }, 6]]),
    armR: f < 812 ? [[22, 4], [36, -6]] as A2 : [[20, 6], [30 + 4 * Math.sin(flick * Math.PI), -4]] as A2, armL: [[-20, 6], [-6, -2]], armRFront: true, armLFront: true, propL: "wad", propK: f >= 812 ? flick % 1 : 0 } as FigOpts, { idx: 1 }));
  const focus = follow(f, [[740, [GX + 0.1, 1.4, 2.0]], [806, hd(seat, 0.85), 40]]);
  return { ctl, cast, fx, focus, subj: f < 790 ? SKIN : BOSS };
};
lens3([[740, DOF_MS], [806, DOF_MS, 40]]);

// ================================================= SHOT 5 (848-1044) THE SHOP IN THE MORNING: the empty wall, the laughing neighbour
const OWN5: V3 = [0.3, FLr, 3.05], NB5: V3 = [-0.15, FLr, 2.2];
const c5a = F(() => cam3([0.62, 1.52, 1.15], [0.32, 1.42, 3.05], 46), 848, 0.0016);
const c5b = F(() => cam3([1.55, 1.62, 0.25], [-0.05, 1.32, 4.1], 50), 912, 0.0014);
const c5c = F(() => cam3([2.9, 1.56, 1.12], [0.075, 1.36, 2.625], 54), 968, 0.0016, [[1002, 0.006, 8]]);
SHOT_CAMS[5] = () => [K(848, c5a, 1, true), K(868, glideTo(c5a, 868, c5b, 912, 0.05), 1), K(952, glideTo(c5b, 952, c5c, 976, 0.05), 1)];
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { shut: 1, gone: 30, lootOn: 0, trOn: 0, snap: 1, lockFall: 1 };
  const sip = (a: number) => bump((f - a) / 22);
  cast.push(C(OWN, OWN5, { ...flow(f, [[848, { expr: "calm", facing: 0.15 }], [872, { expr: "calm", facing: -0.4, look: -0.7 }, 10], [940, { expr: "smile_closed", facing: -0.3 }, 8], [985, { expr: "calm", facing: -0.9, look: -0.4 }, 10]]),
    armR: arcArm(MUG_R as unknown as number[][], SIP_R as unknown as number[][], Math.max(sip(922), sip(968))), armRFront: true, propR: "teaMug", armL: [[-24, 14], [-12, 26]], armLFront: true } as FigOpts, { idx: 1 }));
  // the neighbour (the baker) leans in the doorway with his own mug, laughs at the wall with his whole body, points, raises the mug
  if (f >= 940) {
    const enter = path3(f, [[940, [-1.6, FLr, -0.6]], [985, NB5]]), walking = f < 985;
    cast.push(C(BAKER, enter, { ...flow(f, [[940, { expr: "sly", facing: -1 }], [988, { expr: "mock", facing: -0.8, tilt: 4 }, 6], [1000, { ...laughP(f, 1000, 0), facing: -0.8 }, 6], [1030, { expr: "guffaw", facing: -0.9, shake: 0.6, phase: (f - 1000) / 12 }, 6]]),
      ...(walking ? { mode: "walk", phase: ph(f, 14) } : {}), armL: f >= 1024 && f < 1036 ? [[-28, -6], [-56, -12]] as A2 : f >= 975 ? [[-26, -10], [-40, -30]] as A2 : undefined, armLFront: true,
      armR: f >= 1036 ? BEER_UP : [[24, 10], [22, -4]] as A2, armRFront: true, propR: "teaMug" } as FigOpts, { idx: 2 }));
  }
  // morning life outside: a street sweeper on the far pavement
  cast.push(C("nb3", [-3.5 + 0.004 * (f - 848), FLr, -11.6], pose(null, { expr: "neutral", facing: 1, armR: [[18, 30], [8 + 10 * Math.sin(st(f) * 0.3), 52]], armRFront: true, propR: "broom", propRAng: 0.35 * Math.sin(st(f) * 0.3) }), { idx: 30 }));
  const focus = follow(f, [[848, hd(OWN5, 1.38)], [912, [0.0, 1.45, 4.5], 30], [976, hd(OWN5, 1.35), 24]]);
  return { ctl, cast, fx, focus, subj: f < 968 ? OWN : BAKER };
};
lens3([[848, DOF_CU], [912, DOF_MS, 30], [976, DOF_MS, 24]]);

// ================================================= SHOT 6 (1044-1349) THE GARAGE: the toast, the neighbour sneaks in, the boxes
// crate sitters sit on the crate's FRONT edge (card 0.32 m toward the camera): with the card at the crate's centre the
// crate hid the hips and the legs showed through the mesh, so they read as standing inside the crates (2026-11-24)
const SEAT_B: V3 = [SH0.G_SEATS[0][0], 0.65, SH0.G_SEATS[0][2] - 0.32], SEAT_G: V3 = [SH0.G_SEATS[1][0], 0.5, SH0.G_SEATS[1][2]], SEAT_S: V3 = [SH0.G_SEATS[2][0], 0.65, SH0.G_SEATS[2][2] - 0.32];
const NB6a: V3 = [GX + 5.6, 0.05, 6.45], NB6b: V3 = [GX + 1.9, 0.05, 4.95], KNEEL: V3 = [GX - 1.0, 0.05, 4.75], DUMPER: V3 = [GX + 1.15, 0.05, 5.0];
const c6a = F(() => cam3([GX - 0.9, 1.4, -0.25], [GX - 0.9, 1.05, 3.4], 52), 1044, 0.0018, [[1052, 0.006, 6], [1069, 0.005, 8]]);
const nbPath6 = (f: number): V3 => path3(f, [[1120, [GX + 5.6, 0.05, 6.45]], [1186, [GX + 1.9, 0.05, 4.95]], [1236, [GX + 1.9, 0.05, 4.95]], [1250, [GX + 0.45, 0.05, 4.7]]]);
const c6b = F((f) => { const n = nbPath6(Math.max(1140, Math.min(f, 1200))); return cam3([n[0] - 1.55, 1.5, n[2] - 2.75], [n[0] + 0.1, 1.15, n[2]], 52); }, 1150, 0.0012);
// high over the seated crew's heads (they stay below/beside the frame), looking down at the kneeling boss, the boxes and the pile
const c6c = F(() => cam3([GX - 0.75, 2.3, 3.0], [GX - 1.1, 0.5, 5.35], 50), 1240, 0.0016, [[1258, 0.005, 6], [1291, 0.005, 6], [1324, 0.008, 8]]);
const c6d = F(() => lowOn(PILE_P), 1349, 0.0);
SHOT_CAMS[6] = () => [K(1044, c6a, 1, true), K(1112, glideTo(c6a, 1112, c6b, 1150, 0.1), 1), K(1214, glideTo(c6b, 1214, c6c, 1240, 0.06), 1), K(1336, glideTo(c6c, 1336, c6d, 1349, 0, [0, 0, 0], 0.3), 1)];
SHOT_ACTS[6] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const pileN = f < 1258 ? 0 : f < 1324 ? Math.min(14, Math.floor((f - 1258) / 5) + 1) : Math.round(lerp(14, 34, sm(f, 1324, 1334)));
  const ctl: Ctl = { loot: 2, lootOn: 1, fill0: f < 1270 ? 16 : 10, fill1: f < 1300 ? 16 : 9, fill2: 16 - Math.round(10 * sm(f, 1324, 1334)), pile: pileN, table: 12, trOn: 1, trX: GX + 2.9, trY: 0.05, trZ: 1.4, trYaw: -1.2, trRoll: 0, gdoor: 0.92,
    side: val(f, [[1118, 0], [1130, 1], [1176, 1], [1188, 0.2]]), dump: sm(f, 1316, 1330) };
  // the toast: three bottles clink (1052), the boss says the line (1069-1111), the big guy slaps the crate
  const toastK = bump((f - 1044) / 18);
  if (f < 1200) {
    cast.push(sitC(BOSS, SEAT_B, 0.05, { ...speak(f, 1069, 1112, flow(f, [[1044, { expr: "joy", facing: -0.7, mode: "sit" }], [1066, { expr: "tacheUp", facing: -0.3, mode: "sit", headBack: 0.15 }, 6], [1120, { expr: "scheme", facing: -0.8, mode: "sit" }, 8], [1192, { expr: "scheme", facing: -0.9, mode: "sit", look: -0.4 }, 6]])),
      armR: f < 1066 ? arcArm([[24, -4], [30, -26]], [[26, -10], [40 - 8 * toastK, -40]], toastK) : f < 1112 ? [[22, 4], [32, -18]] as A2 : [[22, 12], [26, 2]] as A2, armRFront: true, propR: "beer", propK: f < 1060 ? 1 : 0, armL: [[-22, 14], [-14, 30]] } as FigOpts, { idx: 1 }));
  } else {
    // the boss gets up, grins at the cash, drags box 1 out and kneels at it
    const bp = path3(f, [[1200, [SEAT_B[0], 0.05, SEAT_B[2]]], [1232, KNEEL]]), walking = f < 1232;
    const pull = (a: number) => sm(f, a, a + 8) * (1 - sm(f, a + 30, a + 40));
    cast.push(C(BOSS, bp, { ...flow(f, [[1200, { expr: "scheme", facing: 0.7, mode: "walk", phase: ph(f, 14) }], [1232, { expr: "joy", facing: 0.4, mode: "kneel", kneelK: 1 }, 6], [1268, { expr: "neutral", facing: 0.3, mode: "kneel", kneelK: 1 }, 8], [1300, { expr: "dismay", facing: 0.2, mode: "kneel", kneelK: 1 }, 8], [1333, { expr: "shock", facing: 0.05, mode: "kneel", kneelK: 0.7, headBack: 0.2 }, 4]]),
      ...(walking ? {} : {}), armR: f < 1250 ? [[24, 10], [40, 20]] as A2 : arcArm([[24, 12], [40, 30]], [[26, -8], [42, -30]], Math.max(pull(1252), f >= 1290 ? 1 : 0)), armRFront: true, propR: f >= 1256 ? "snkR" : undefined, propK: WALL_K,
      armL: f < 1262 ? [[-22, 12], [-30, 28]] as A2 : arcArm([[-24, 12], [-36, 30]], [[-26, -8], [-42, -30]], Math.max(pull(1262), f >= 1290 ? 1 : 0)), armLFront: true, propL: f >= 1264 ? "snkR" : undefined } as FigOpts, { idx: 1 }));
  }
  // the big guy (toast, then dumps box 3: 1316-1330, all rights pour out) and the skinny one
  cast.push((f < 1290 ? (o: FigOpts, e: Partial<CastPlace>) => sitC(BIG, SEAT_G, 0.05, o, e) : (o: FigOpts, e: Partial<CastPlace>) => C(BIG, path3(f, [[1290, [SEAT_G[0], 0.05, SEAT_G[2]]], [1300, [GX + 0.2, 0.05, 3.2]], [1314, DUMPER]]), o, e))({ ...flow(f, [[1044, { expr: "laugh", facing: 0.2, mode: "sit" }], [1076, { expr: "guffaw", facing: 0.1, mode: "sit", shake: 0.6, phase: (f - 1076) / 12 }, 6], [1112, { expr: "joy", facing: 0.4, mode: "sit" }, 8], [1290, { expr: "determined", facing: -0.6, mode: "walk", phase: ph(f, 14) }, 6], [1314, { expr: "strain", facing: 0.7, tilt: 10 }, 4], [1333, { expr: "shock", facing: 0.3 }, 4]]),
    armR: f < 1112 ? arcArm([[22, -4], [26, -24]], [[22, -10], [16, -42]], toastK) : f >= 1314 && f < 1334 ? [[20, -4], [40, 6]] as A2 : undefined, armRFront: true, propR: f < 1112 ? "beer" : undefined, propK: 1,
    armL: f >= 1314 && f < 1334 ? [[30, -4], [52, 4]] as A2 : undefined, armLFront: true } as FigOpts, { idx: 2 }));
  cast.push(sitC(SKIN, SEAT_S, 0.05, { ...flow(f, [[1044, { expr: "joy", facing: 0.6, mode: "sit" }], [1120, { expr: "worry", facing: -0.8, mode: "sit", look: -0.6 }, 8], [1200, { expr: "nervous", facing: -0.6, mode: "sit" }, 8], [1333, { expr: "shock", facing: -0.1, mode: "sit" }, 4]]),
    armL: f < 1112 ? arcArm([[-22, -4], [-26, -24]], [[-22, -10], [-14, -44]], toastK) : [[-22, 14], [-14, 28]] as A2, armLFront: true, propL: f < 1112 ? "beer" : undefined, propK: 1 } as FigOpts, { idx: 3 }));
  // the neighbour sneaks in through the side door (1120-1185), waves his cash (1195), then waits at the boxes; fury at 1333
  if (f >= 1112) {
    const np = nbPath6(f);
    const tip = f < 1186 && f >= 1120;
    cast.push(C(BAKER, np, { ...flow(f, [[1112, { expr: "sly", facing: 1 }], [1190, { expr: "sly", facing: 0.8 }, 6], [1240, { expr: "smile", facing: 0.6 }, 8], [1300, { expr: "dismay", facing: 0.5 }, 8], [1333, { expr: "fury", facing: 0.4, tilt: -5 }, 4]]),
      ...(tip ? { mode: "walk", phase: ph(f, 22), bobK: 0.09, tilt: 10 } : {}), armR: f >= 1190 && f < 1236 ? [[22, -12], [26, -44]] as A2 : tip ? [[24, -6], [36, -18]] as A2 : undefined, armRFront: true, propR: f >= 1186 && f < 1240 ? "wad" : undefined,
      armL: tip ? [[-24, -6], [-36, -18]] as A2 : f >= 1333 ? [[-28, -6], [-44, -24]] as A2 : undefined } as FigOpts, { idx: 4 }));
  }
  for (const a of [1052]) { const c = sparkle("clink", [GX - 0.85, 1.55, 3.3], f - a, 0.3); if (c) fx.push(c); }
  if (f >= 1324 && f < 1340) fx.push(dustCard("dump", [GX + 0.2, 0.35, 5.0], 0.7, 0.55 * (1 - (f - 1324) / 16), 2));
  const bg = bang(hd(KNEEL, 1.35), f - 1333); if (bg) fx.push(bg);
  const focus = follow(f, [[1044, hd(SEAT_B, 0.85)], [1150, (g) => hd(nbPath6(g), 1.3), 38], [1240, [GX - 0.5, 0.55, 5.1], 26], [1349, [PILE_P[0], PILE_P[1] + 0.07, PILE_P[2]], 13]]);
  return { ctl, cast, fx, focus, subj: f < 1112 ? BOSS : f < 1214 ? BAKER : BOSS };
};
lens3([[1044, DOF_MS], [1150, DOF_MS, 38], [1240, DOF_MS, 26], [1336, DOF_INSERT, 13]]);
KICKS.push([1324 / 30, 3], [1333 / 30, 4]);

// ================================================= SHOT 7 (1349-1490) THE CUTAWAY: the wall sliced open, the left shoes in the back room
const OWN7: V3 = [-0.12, FLr, 5.85];
const c7a = F(() => cam3([WALL_P[0] + 0.03, WALL_P[1] + 0.09, 3.95], [WALL_P[0], WALL_P[1] + 0.07, 4.925], 44), 1349, 0.0012);
const c7b = F(() => cam3([-0.35, 1.58, 2.35], [-0.25, 1.36, 6.3], 54), 1432, 0.0014);
SHOT_CAMS[7] = () => [K(1349, c7a, 1, true), K(1386, glideTo(c7a, 1386, c7b, 1432, 0.12, [0, 0, -0.4]), 1)];
SHOT_ACTS[7] = (f) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { shut: 1, gone: 0, lootOn: 0, trOn: 0, snap: 1, lockFall: 1, cut: sm(f, 1392, 1432) * 0.62, cutX: 0.55, backLid: sm(f, 1436, 1446), backOn: 1 };
  // the owner in the back room: lifts the lid (1443), takes out the LEFT shoe and holds it up beside the right one (1460)
  const lift = sm(f, 1446, 1462);
  cast.push(C(OWN, OWN7, { ...flow(f, [[1349, { expr: "calm", back: true }], [1440, { expr: "calm", back: true }], [1452, { expr: "smile_closed", facing: -0.6 }, 8], [1466, { expr: "smug", facing: -0.4 }, 8]]),
    armR: f < 1446 ? [[22, 6], [34, 10]] as A2 : arcArm([[22, 10], [34, 18]], [[16, -24], [10, -58]], lift), armRFront: f >= 1446, propR: f >= 1446 ? "snkLx" : undefined, propK: WALL_K, propRAng: -0.1 * lift,
    armL: [[-22, 14], [-12, 26]], armLFront: true } as FigOpts, { idx: 1 }));
  const focus = follow(f, [[1349, [WALL_P[0], WALL_P[1] + 0.06, 4.93]], [1432, hd(OWN7, 1.35), 40]]);
  return { ctl, cast, fx, focus, subj: f < 1400 ? null : OWN };
};
lens3([[1349, DOF_INSERT], [1432, DOF_MS, 40]]);

// ================================================= SHOT 8 (1490-1575) INSERT: one lonely glove in a car door pocket
const GLOVE: V3 = [IX - 0.1, 0.25 + 0.3, -5.0 - 0.12];
const c8a = F(() => cam3([GLOVE[0] + 0.1, GLOVE[1] + 0.22, GLOVE[2] - 0.85], [GLOVE[0], GLOVE[1] + 0.12, GLOVE[2]], 46), 1490, 0.0032);
SHOT_CAMS[8] = () => [K(1490, c8a, 1, true)];
SHOT_ACTS[8] = (f) => ({ ctl: { ins: 1, shut: 1, gone: 30, lootOn: 0, trOn: 0, glFlop: sm(f, 1540, 1562) }, cast: [], fx: [], focus: GLOVE, subj: null });
lens3([[1490, DOF_INSERT]]);

// ================================================= SHOT 9 (1575-1682) THE OWNER PUTS OUT LEFT SHOES (morning)
const LEFT_START = 12, LEFT_END = 44;
const leftsAt = (f: number) => Math.floor(lerp(LEFT_START, LEFT_END, lin(f, 1580, 1676)));
const slotP = (n: number): V3 => { const { r, c } = LEFT_ORDER(n); return [SH0.COLS[c], SH0.ROWS[r], 4.925]; };
const S9: V3 = slotP(8);
const ownX9 = (f: number) => SH0.COLS[Math.min(14, Math.floor(leftsAt(f) / 6))] + 0.55;
const c9a = F(() => cam3([S9[0] + 0.03, S9[1] + 0.07, 3.97], [S9[0], S9[1] + 0.05, 4.95], 44), 1575, 0.0012);
const c9b = (f: number) => { const x = ownX9(f); return { pos: [x + 0.6, 1.58, 2.25] as V3, look: [x - 0.25, 1.3, 4.95] as V3, fov: 54, roll: 0 }; };
const LP = (f: number) => slotP(Math.max(0, leftsAt(f) - 1));
const c9c = (f: number) => { const p = slotP(LEFT_END - 1); return { pos: [p[0] + 0.03, p[1] + 0.07, 3.97] as V3, look: [p[0], p[1] + 0.05, 4.95] as V3, fov: 44, roll: 0 }; };
SHOT_CAMS[9] = () => [K(1575, c9a, 1, true), K(1612, glideTo(c9a, 1612, c9b, 1640, 0.08), 1), K(1662, glideTo(c9b, 1662, c9c, 1682), 1)];
SHOT_ACTS[9] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const nl = leftsAt(f);
  const ctl: Ctl = { shut: 1, gone: 30, lootOn: 0, trOn: 0, snap: 1, lockFall: 1, lefts: nl };
  // the owner, on tiptoe, hangs one left shoe per beat, walking along the wall (back three-quarter to the camera)
  const OW: V3 = [ownX9(f), FLr, 4.42], hang = (f % 14) / 14, tgt = slotP(nl);
  cast.push(C(OWN, OW, { ...flow(f, [[1575, { expr: "calm", back: true }], [1620, { expr: "smile_closed", back: true }, 10]]),
    armR: armTo(9, s, f, OW, [tgt[0] + 0.1 * (1 - hang), tgt[1] + 0.12, tgt[2] - 0.1], 1, -0.6, 1, "stand", 8), armRFront: true, propR: hang < 0.7 ? "snkL" : undefined, propK: wallColIdx(LEFT_ORDER(nl).r, LEFT_ORDER(nl).c),
    armL: [[-22, 10], [-30, 24]], armLFront: true, tilt: -3 + 3 * Math.sin(f * 0.45) } as FigOpts, { idx: 1 }));
  const focus = follow(f, [[1575, S9], [1640, hd(OW, 1.35), 28], [1682, LP(f), 20]]);
  return { ctl, cast, fx, focus, subj: f < 1612 || f > 1665 ? null : OWN };
};
lens3([[1575, DOF_INSERT], [1640, DOF_MS, 28], [1682, DOF_INSERT, 20]]);

// ================================================= SHOT 10 (1682-1787) THE GARAGE: the neighbour storms out, the boss crams two right shoes on
const BOSS10: V3 = [GX - 1.6, 0.65, 3.75 - 0.32], NB10: V3 = [GX + 0.6, 0.05, 4.7];
const c10a = F(() => lowOn(PILE_P), 1682, 0.0012);
const c10b = F(() => cam3([BOSS10[0] + 0.55, 1.42, 1.35], [BOSS10[0] + 0.05, 0.98, BOSS10[2]], 54), 1730, 0.0016, [[1736, 0.005, 8], [1778, 0.008, 8]]);
// the camera rises first (yLead 0.5) so the pull-back from the pile clears the monobloc chair and the crates (it flew through the chair)
SHOT_CAMS[10] = () => [K(1682, c10a, 1, true), K(1720, glideTo(c10a, 1720, c10b, 1744, 0.3, [0, 0, 0], 0.5), 1)];
SHOT_ACTS[10] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { loot: 2, lootOn: 1, fill0: 10, fill1: 9, fill2: 6, dump: 1, pile: 34, pileHide: f >= 1720 ? PILE_I : -1, table: 12, trOn: 1, trX: GX + 2.9, trY: 0.05, trZ: 1.4, trYaw: -1.2, gdoor: 0.92, side: val(f, [[1700, 0], [1704, 1], [1708, 1], [1712, 0]]) };
  // the boss: holds a right shoe up (the match), sits, shoves it onto his LEFT foot (1736-1772), stands and hops in pain (1778)
  const cram = sm(f, 1740, 1768), up = f >= 1772;
  cast.push(sitC(BOSS, up ? [BOSS10[0], 0.05, BOSS10[2]] : BOSS10, 0.05, { ...flow(f, [[1682, { expr: "determined", facing: 0.3, mode: "sit" }], [1736, { expr: "strain", facing: 0.4, mode: "sit", tilt: -10 }, 6], [1772, { expr: "strain", facing: 0.2 }, 6], [1778, { expr: "breakdown", facing: 0.1, mode: "hop", lift: 0.6 + 0.3 * Math.sin((f - 1778) * 0.7), phase: (f - 1778) / 6 }, 4]]),
    armR: f < 1720 ? [[24, 20], [30, 44]] as A2 : f < 1736 ? [[24, -6], [34, -30]] as A2 : !up ? [[20, 20], [8 + 10 * cram, 54]] as A2 : [[30, -10], [52, -26]] as A2, armRFront: true, propR: f >= 1720 && f < 1736 ? "snkR" : undefined, propK: WALL_K,
    armL: f >= 1736 && !up ? [[-14, 22], [0 + 6 * Math.sin(f * 0.9), 52]] as A2 : up ? [[-30, -10], [-52, -26]] as A2 : undefined, armLFront: true,
    snkFeet: f >= 1736 ? "#2a5a9a" : undefined, snkSame: f >= 1736 ? -1 : undefined, snkWrong: f >= 1736 ? cram : undefined } as FigOpts, { idx: 1 }));
  // the neighbour storms out through the side door and slams it (1712)
  if (f < 1716) { const np = path3(f, [[1682, NB10], [1708, [GX + 5.2, 0.05, 6.45]]]);
    cast.push(C(BAKER, np, { ...flow(f, [[1682, { expr: "fury", facing: -1, mode: "walk", phase: ph(f, 12) }]]), armR: [[26, 10], [40, 24]], armL: [[-26, 10], [-40, 24]] } as FigOpts, { idx: 4 })); }
  if (f >= 1712 && f < 1730) fx.push(dustCard("slam", [GX + 4.8, 1.0, 6.45], 0.8, 0.6 * (1 - (f - 1712) / 18), 4));
  cast.push(C(BIG, [GX + 0.2, 0.05, 5.2], { ...flow(f, [[1682, { expr: "dismay", facing: -0.6 }], [1740, { expr: "worry", facing: -0.8 }, 8]]), armR: [[22, -10], [12, -36]] } as FigOpts, { idx: 2 }));
  cast.push(sitC(SKIN, SEAT_S, 0.05, { ...flow(f, [[1682, { expr: "worry", facing: -0.6, mode: "sit" }], [1745, { expr: "worry", facing: -0.8, mode: "sit" }, 8]]), armL: [[-20, -12], [-4, -40]], armLFront: true } as FigOpts, { idx: 3 }));
  if (f >= 1778) { const bg = bang(hd(BOSS10, 1.1), f - 1778); if (bg) fx.push(bg); }
  const focus = follow(f, [[1682, [PILE_P[0], PILE_P[1] + 0.07, PILE_P[2]]], [1744, hd(BOSS10, 0.9), 24]]);
  return { ctl, cast, fx, focus, subj: f < 1700 ? null : BOSS };
};
lens3([[1682, DOF_INSERT], [1728, DOF_MS, 30]]);
KICKS.push([1712 / 30, 4], [1778 / 30, 2]);

// ================================================= SHOT 11 (1787-1897) THE CALLBACK: a single left shoe held up to the security camera
const OWN11: V3 = [1.25, FLr, 2.55];
const c11a = F(() => cam3([3.72, 3.0, 0.5], [1.25, 1.55, 2.55], 46), 1787, 0.0034, [[1840, 0.006, 12]]);
SHOT_CAMS[11] = () => [K(1787, c11a, 1, true)];
SHOT_ACTS[11] = (f) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { shut: 1, gone: 30, lootOn: 0, trOn: 0, snap: 1, lockFall: 1, lefts: 90 };
  const up = sm(f, 1838, 1852);
  cast.push(C(OWN, OWN11, { ...flow(f, [[1787, { expr: "calm", facing: -0.3, look: -0.4 }], [1795, { expr: "calm", facing: 0, headBack: 0.25 }, 8], [1850, { expr: "smile_closed", facing: 0, headBack: 0.2 }, 8], [1880, { expr: "smile", facing: 0, headBack: 0.2 }, 6]]),
    armR: arcArm([[22, 10], [30, 22]], [[22, -24], [26, -60]], up), armRFront: true, propR: "snkLx", propK: WALL_K,
    armL: f < 1868 ? [[-22, 14], [-12, 26]] as A2 : WAVE(f).map(([x, y]) => [-x, y]) as unknown as A2, armLFront: true, propL: f < 1868 ? "teaMug" : undefined } as FigOpts, { idx: 1 }));
  // a morning walker passes outside
  cast.push(C("qa", [-3.0 + 0.03 * (f - 1787), FLr, -2.2], pose(null, { expr: "neutral", mode: "walk", phase: ph(f, 14), facing: 1 }), { idx: 30 }));
  return { ctl, cast, fx, focus: hd(OWN11, 1.38), subj: OWN };
};
lens3([[1787, DOF_MS]]);
