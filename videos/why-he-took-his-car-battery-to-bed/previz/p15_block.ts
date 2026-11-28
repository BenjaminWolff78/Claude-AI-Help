// ================================================= p15: "Why He Took His Car Battery to Bed" (2026-11-28, v34) =================================================
// One set (camp) with three places: the truck lot outside the bunkhouse (S2-S5, S11-S20, S22-S25), the bunkhouse inside
// (S1, S6-S8, S26) and the mess hall (S9-S10, S21). Hard cuts: 642 (S10, his calm sip), 1254 (S19, the key), 1305 (S20, the
// cutaway into the battery). Dissolves (6 f) at every new place or time (story.ts XFADE); the rest are camera moves.
// The story state (the batteries, blankets, hoods, engines, frost, the thermometer, the giant truck's drive, the cables, the
// collapse) is ONE function of the frame (CTL15), so nothing jumps at a shot change; shots only override what they hold.
/** hard cuts where people are somewhere else (time ellipsis): a new scene, so the seam ease does not slide them across */
const NEW_SCENE = new Set([16, 19, 20]);
const HERO = "hero", FOR = "foreman", CR1 = "crew1", CR2 = "crew2", CR3 = "crew3", CR4 = "crew4", CR5 = "crew5", COOK = "cook";
const HYC: Record<string, number> = {};
const HY = (who: string) => (HYC[who] ??= headOf(CASTS_T[who] as Look, {}).y);
const HD = (who: string, p: V3): V3 => [p[0], p[1] + HY(who), p[2]];
const SMC: Record<string, number> = {};
const SM = (who: string) => (SMC[who] ??= strideM(CASTS_T[who] as Look, { mode: "stride" } as FigOpts));
/** a planted-feet walk along waypoints between frames a and b (eased); back = walking backwards */
const walkS = (id: number, s: SetDef, who: string, pts: V3[], f: number, a: number, b: number, back = false) => {
  const u = sm(f, a, b), w = polyAt(pts, u), dist = u * polyLen(pts), moving = f > a && f <= b;
  const fc = (Math.sign(screenSide(id, s, f, w.d[0], w.d[1])) || 1) * (back ? -1 : 1);
  return { p: w.p, d: w.d, facing: fc, moving, o: (moving ? { mode: "stride", phase: (back ? -1 : 1) * dist / SM(who) } : {}) as P };
};
/** a fitted camera: the boxes inside the frame from compass az (0 = from +z, 90 = from +x), el deg looking down */
const FIT = (boxes: Box[], az: number, el: number, fov: number, pad = 0.85, side = 0, lift = 0, room?: Room): Cam => { let c = fit(boxes, az, el, fov, pad, side, lift); if (room) c = inRoom(c, room); return cam3(c.pos, c.look, c.fov); };
const still = (c: Cam) => (_f: number): Shot => ({ pos: c.pos, look: c.look, fov: c.fov, roll: 0 });
const ROOM_BUNK: Room = { x0: 96.15, x1: 103.85, z0: -4.35, z1: 2.85, y1: 2.6 }, ROOM_MESS: Room = { x0: 193.2, x1: 206.8, z0: -3.8, z1: 3.85, y1: 2.9 };
/** the porch: the deck (0.45) and its one step; a smooth ramp so a walker climbs it */
const porchY = (x: number, z: number) => (Math.abs(x) < 2.2 ? 0.45 * clamp01((1.3 - z) / 0.62) : 0);
/** car-local (yaw pi) and pickup-local (yaw pi, scale k) to world */
const carW = (l: V3): V3 => [CP.CAR[0] - l[0], CP.CAR[1] + l[1], CP.CAR[2] - l[2]];
const pkW = (base: V3, k: number, l: V3, yaw = Math.PI): V3 => { const c = Math.cos(yaw), sn = Math.sin(yaw); return [base[0] + k * (l[0] * c + l[2] * sn), base[1] + k * l[1], base[2] + k * (-l[0] * sn + l[2] * c)]; };
/** the card scale that keeps a seated head under the roof, and the sitLeg that puts the bottom on the seat */
const fitSeat = (L: Look, seatAboveFeet: number, headroom: number) => {
  const h0 = headOf(L, { mode: "sit", sitLeg: 0, facing: 0.8 } as FigOpts), c0 = seatHeight(L, { mode: "sit", sitLeg: 0 } as FigOpts);
  const sc = Math.min(1, headroom / (h0.y - c0 + 0.47 * h0.w));
  return { sc, sitLeg: sitLegFor(L, seatAboveFeet / sc) };
};
/** a seat mark pulled toward the camera (a card through the seat's middle is cut by the cushion's near half) */
const toCam = (id: number, s: SetDef, f: number, p: V3, k: number): V3 => { const c = camAt(id, s, f), dx = c.pos[0] - p[0], dz = c.pos[2] - p[2], L = Math.hypot(dx, dz) || 1; return [p[0] + dx / L * k, p[1], p[2] + dz / L * k]; };
/** the grip further to screen right goes to the right hand */
const byScreen = (id: number, s: SetDef, f: number, P: V3, a: V3, b: V3): [V3, V3] => {
  const c = camAt(id, s, f), yaw = Math.atan2(c.pos[0] - P[0], c.pos[2] - P[2]), lat = (T: V3) => (T[0] - P[0]) * Math.cos(yaw) - (T[2] - P[2]) * Math.sin(yaw);
  return lat(a) >= lat(b) ? [a, b] : [b, a];
};
/** a battery carried in both hands: in front of the body (walking direction d) and a little toward the lens; grips on its
 *  ends along the camera's right axis; yaw turns the printed label to the lens */
const carryBat = (id: number, s: SetDef, f: number, P: V3, fc: number, d: [number, number] | null, y = 0.8, sz = 1, fwd = 0.14, near = 0.17) => {
  const c = camAt(id, s, f), dx = c.pos[0] - P[0], dz = c.pos[2] - P[2], L = Math.hypot(dx, dz) || 1, cx = dx / L, cz = dz / L;
  const dl = d ? Math.hypot(d[0], d[1]) || 1 : 1, fx = d ? d[0] / dl : 0, fz = d ? d[1] / dl : 0;
  let ox = fx * fwd + cx * near, oz = fz * fwd + cz * near; const on = Math.hypot(ox, oz), cap = Math.max(fwd, near) + 0.04;
  if (on > cap) { ox *= cap / on; oz *= cap / on; }
  const B: V3 = [P[0] + ox, P[1] + y, P[2] + oz];
  const yaw = Math.atan2(cx, cz), Rx = Math.cos(yaw), Rz = -Math.sin(yaw), hw = 0.15 * sz, gy = B[1] + 0.12 * sz;
  const [gR, gL] = byScreen(id, s, f, P, [B[0] + hw * Rx, gy, B[2] + hw * Rz], [B[0] - hw * Rx, gy, B[2] - hw * Rz]);
  return { B, yaw, armR: armTo(id, s, f, P, gR, 1, fc), armL: armTo(id, s, f, P, gL, -1, fc), armRFront: true, armLFront: true };
};
const batCtl = (k: "lb" | "bb" | "fb", B: V3, yaw: number): Record<string, number> => ({ [k + "X"]: B[0], [k + "Y"]: B[1], [k + "Z"]: B[2], [k + "Yaw"]: yaw });
/** arms hugging the chest against the cold (a shiver) */
const HUG = (f: number, i: number): P => ({ armR: [[22, 16], [-6, 8]] as A2, armL: [[-22, 16], [6, 12]] as A2, armRFront: true, armLFront: true, shake: 0.25, phase: f / 5 + i });
/** breath clouds from a mouth (cold air) */
const breath = (key: string, head: V3, f: number, fc: number, every = 40, off = 0): FxSpec[] => [0, 1].map((i) => {
  const age = ((f + off + i * every / 2) % every) / every;
  return steamCard(key + i, [head[0] + fc * (0.18 + 0.22 * age), head[1] - 0.12 + 0.18 * age, head[2] + 0.06], 0.18 + 0.3 * age, 0.55 * (1 - age), i + 3);
});
/** the honk / click / crash word cards are left to the sound; the world reacts instead */

// ---------------- the giant truck's drive (S12, the first cold morning): forward out of the row, a left turn, down the lot ----------------
const GT_PATH: V3[] = [[4.6, 0, 8.0], [4.55, 0, 5.6], [3.9, 0, 3.4], [2.4, 0, 2.75], [-2, 0, 2.7], [-9.5, 0, 2.7]];
const gtAt = (f: number) => {
  if (f < 772 || f >= 900) return { x: CP.GIANT[0], z: CP.GIANT[2], yaw: Math.PI, dist: 0 };
  const L = polyLen(GT_PATH), t = (f - 772) / 68, s = L * (t < 0.3 ? 0.55 * (t / 0.3) ** 2 * 0.3 : 0.165 + (t - 0.3) * 1.19);
  const u = Math.min(1, s / L), w = polyAt(GT_PATH, u);
  const w2 = polyAt(GT_PATH, Math.min(1, u + 0.03)), yaw = Math.atan2(w2.p[0] - w.p[0], w2.p[2] - w.p[2]);
  return { x: w.p[0], z: w.p[2], yaw: Math.abs(w2.p[0] - w.p[0]) + Math.abs(w2.p[2] - w.p[2]) < 1e-4 ? -Math.PI / 2 : yaw, dist: s };
};

// ---------------- the story state as one function of the frame ----------------
const CTL15 = (f: number): Ctl => {
  const c: Record<string, number> = {};
  // the porch thermometer: night -22, wiped at 864-874 then the red line falls to -40 ("forty below" 879-892); dawn -40
  c.therm = f < 840 ? 5 : f < 874 ? -22 : f < 912 ? lerp(-22, -40, sm(f, 874, 894)) : -40;
  c.frost = f >= 840 && f < 912 ? (f < 864 ? 1 : f < 876 ? 1 - 0.55 * sm(f, 864, 876) : 0.45) : (f >= 75 && f < 150) || (f >= 912 && f < 1752) ? (f >= 960 && f < 1122 ? 1 - 0.6 * sm(f, 960, 990) : 1) : 0;
  c.snow = f >= 150 && f < 363 ? 1 : f >= 840 && f < 912 ? 1 : 0;
  c.fog = (f >= 75 && f < 150) || (f >= 912 && f < 1752) ? 1 : 0;
  c.bDoor = f >= 273 && f < 363 ? sm(f, 334, 348) : f >= 1110 && f < 1197 ? sm(f, 1110, 1124) * (1 - sm(f, 1176, 1194)) : 0;
  c.tally = f < 363 ? 3 : f < 395 ? 0 : f < 411 ? 1 : f < 459 ? 2 : 3;
  // the hero's battery in the lot (default: in his car's tray); shots that carry it override lb*
  c.lotBat = 1; c.lbX = CP.TRAY_W[0]; c.lbY = CP.TRAY_W[1]; c.lbZ = CP.TRAY_W[2]; c.lbYaw = Math.PI;
  c.lbSteam = f >= 1122 && f < 1305 ? 1 : f >= 1305 && f < 1392 ? 0.5 : 0;
  c.lbCut = f >= 1305 && f < 1392 ? sm(f, 1318, 1346) : 0; c.lbGlow = f >= 1305 && f < 1392 ? sm(f, 1330, 1352) : 0;
  c.carHood = (f >= 693 && f < 840) || (f >= 1122 && f < 1845) ? 1 : 0;
  c.carRun = f >= 75 && f < 150 ? sm(f, 99, 104) : f >= 1254 && f < 1845 ? (f < 1268 ? 0 : sm(f, 1268, 1274)) : 0;
  c.keyTurn = f >= 1254 && f < 1305 ? sm(f, 1258, 1266) : f >= 75 && f < 150 ? sm(f, 92, 99) : 0;
  c.clamps = f >= 1197 && f < 1254 ? (f < 1236 ? 0 : 1) : 1;
  c.carCut = f >= 1254 && f < 1305 ? 1 : 0;
  // the crew trucks and the giant: the first cold morning they all start; at forty below they are dead; by lunch, the cables
  c.crewRun0 = f >= 693 && f < 840 ? sm(f, 700, 704) : f >= 1752 && f < 1845 ? sm(f, 1786, 1790) : 0;
  c.crewRun1 = f >= 693 && f < 840 ? sm(f, 712, 716) : f >= 1752 && f < 1845 ? sm(f, 1806, 1810) : 0;
  c.crewRun2 = f >= 693 && f < 840 ? sm(f, 724, 728) : f >= 1752 && f < 1845 ? sm(f, 1826, 1830) : 0;
  c.crewHood = f >= 1752 && f < 1845 ? 1 : 0;
  const g = gtAt(f); c.gtX = g.x; c.gtZ = g.z; c.gtYaw = g.yaw; c.gtDist = g.dist;
  c.gtRun = f >= 693 && f < 840 ? sm(f, 736, 740) : f >= 1752 && f < 1845 ? sm(f, 1766, 1770) : 0;
  c.gtCough = f >= 1038 && f < 1122 ? bump((f - 1084) / 14) * 0.9 + 0.25 * bump((f - 1050) / 40) : 0;
  c.gtHood = f >= 1479 && f < 1845 ? 1 : 0;
  c.gtDip = f >= 1479 && f < 1845 ? -1 : 0;
  c.cables = f >= 1752 && f < 1845 ? 1 : 0;
  c.tester = 0; c.needle = f < 1495 ? 0 : f < 1508 ? 0.78 * sm(f, 1495, 1508) : lerp(0.78, 0.44, sm(f, 1508, 1532));
  // the bunkhouse
  c.bunkBat = f < 75 || (f >= 363 && f < 549) || f >= 1845 ? 1 : 0;
  const pillowB: V3 = [97.1, 0.6, -1.56], floorB: V3 = [98.6, 0.02, -3.0], matB: V3 = [96.95, 0.56, -0.95];
  const bb = f < 75 || f >= 459 ? pillowB : f < 411 ? floorB : matB;
  c.bbX = bb[0]; c.bbY = bb[1]; c.bbZ = bb[2]; c.bbYaw = f >= 363 && f < 411 ? 0.5 : 0;
  c.blk = f < 75 || (f >= 411 && f < 549) || f >= 1845 ? 1 : 0;
  c.blkA = 0.92; c.blkB = f < 75 ? lerp(-0.26, -0.42, sm(f, 0, 26)) : f < 459 ? lerp(0.6, -0.12, sm(f, 413, 432)) : -0.42;
  c.blkLift = f >= 411 && f < 459 ? 0.18 * bump((f - 411) / 22) + 0.08 * bump((f - 425) / 12) : f < 75 ? 0.05 * bump(f / 26) : 0;
  c.cap = (f >= 459 && f < 549) || f >= 1845 ? 1 : 0;
  c.bag = f >= 459 && f < 549 ? 1 : 0;
  c.fbat = f >= 1845 ? 1 : 0; c.fblk = f >= 1845 ? sm(f, 1900, 1916) : 0; c.collapse = f >= 1921 ? clamp01((f - 1921) / 7) : 0;
  c.fbX = 103.05; c.fbY = 0.6; c.fbZ = -1.55; c.fbYaw = 0;
  // the mess hall: the honey
  c.honey = f >= 1392 && f < 1479 ? 1 : 0; c.blob = f >= 1392 && f < 1479 ? 0.85 * sm(f, 1450, 1478) : 0;
  c.hbX = 205.4; c.hbY = 1.1; c.hbZ = -2.96; c.hbRoll = 0;
  return c as Ctl;
};

// ---------------- the seats (G9) ----------------
type SeatQ = { name: string; top: number; min: [number, number]; max: [number, number] };
const seatBox = (name: string, c: V3, hx: number, hz: number): SeatQ => ({ name, top: c[1], min: [c[0] - hx, c[2] - hz], max: [c[0] + hx, c[2] + hz] });
const SEAT_BUNKS: SeatQ[] = [seatBox("bunk A low", [96.95, 0.54, -0.9], 0.46, 1.0), seatBox("bunk B up", [96.95, 1.66, -3.3], 0.46, 1.0), seatBox("bunk E up", [103.05, 1.66, 1.75], 0.46, 1.0), seatBox("bunk F low", [103.05, 0.54, -0.9], 0.46, 1.0)];
const SEAT_MESS: SeatQ[] = [-1.28, 0.28, 1.52, 3.08].map((z, i) => seatBox("bench " + i, [200, 0.45, z], 4.6, 0.15));
const CAR_SEAT = carW(CABIN.SEAT), FIT_CAR = fitSeat(CASTS_T.hero as Look, CABIN.SEAT[1] - CABIN.FLOOR, CABIN.ROOF_IN - 0.04 - CABIN.SEAT[1]);
const PK_SEAT: V3 = [0.42, 1.0, 0.18], PK_FLOOR = 0.68, PK_ROOF = 1.74;
const pkFit = (who: string, k: number) => fitSeat(CASTS_T[who] as Look, (PK_SEAT[1] - PK_FLOOR) * k, (PK_ROOF - 0.04 - PK_SEAT[1]) * k);
/** a driver in a pickup (base, scale k, yaw), pulled toward the lens; hands on the wheel */
const pkDriver = (id: number, s: SetDef, f: number, who: string, base: V3, k: number, o: P, yaw = Math.PI, pull = 0.1): CastPlace => {
  const fs = pkFit(who, k), seat = pkW(base, k, PK_SEAT, yaw), P0: V3 = [seat[0], base[1] + PK_FLOOR * k, seat[2]], P = toCam(id, s, f, P0, pull);
  const fc = faceAt(id, s, f, P, pkW(base, k, [0.42, 1.2, 3.0], yaw));
  const wh = pkW(base, k, [0.42, 1.3, 0.42], yaw), [gR, gL] = byScreen(id, s, f, P, [wh[0] - 0.12, wh[1], wh[2]], [wh[0] + 0.12, wh[1], wh[2]]);
  return C(who, P, { expr: "neutral", facing: fc, mode: "sit", sitLeg: fs.sitLeg, armR: armTo(id, s, f, P, gR, 1, fc, fs.sc, "sit"), armL: armTo(id, s, f, P, gL, -1, fc, fs.sc, "sit"), armRFront: true, armLFront: true, ...o } as FigOpts, { scale: fs.sc });
};
const pkSeatQ = (name: string, base: V3, k: number, yaw = Math.PI) => seatBox(name, [...pkW(base, k, PK_SEAT, yaw).slice(0, 1), PK_SEAT[1] * k, pkW(base, k, PK_SEAT, yaw)[2]] as V3, 0.3 * k, 0.3 * k);
const SEAT_TRUCKS: SeatQ[] = [...CP.CREW.map((b, i) => pkSeatQ("crew truck " + i, b, 1)), pkSeatQ("giant", CP.GIANT, CP.GK), seatBox("car driver", [CAR_SEAT[0], CAR_SEAT[1], CAR_SEAT[2]], 0.25, 0.25)];
/** the hero in his car's driver seat (S2 through the windshield, S19 the cutaway) */
const carDriver = (id: number, s: SetDef, f: number, o: P, pull = 0.1, keyHand = 0): CastPlace => {
  const P0: V3 = [CAR_SEAT[0], CP.CAR[1] + CABIN.FLOOR, CAR_SEAT[2]], P = toCam(id, s, f, P0, pull), fc = faceAt(id, s, f, P, carW([0.4, 1.0, 3.0]));
  const [g0, g1] = cabinGrips(0).map((g) => carW(g)) as [V3, V3], [gR, gL] = byScreen(id, s, f, P, g0, g1);
  const KEY = carW([0.24, 0.8, 0.09]);
  const armR = keyHand > 0 ? armTo(id, s, f, P, [KEY[0] + 0.02, KEY[1] + 0.03 * keyHand, KEY[2] - 0.02], 1, fc, FIT_CAR.sc, "sit", 10, 80) : armTo(id, s, f, P, gR, 1, fc, FIT_CAR.sc, "sit");
  const armL = keyHand > 0 || id === 19 ? (AR.hipL as A2) : armTo(id, s, f, P, gL, -1, fc, FIT_CAR.sc, "sit");
  return C(HERO, P, { expr: "neutral", facing: fc, mode: "sit", sitLeg: FIT_CAR.sitLeg, armR: id === 19 && keyHand <= 0 ? (AR.hipR as A2) : armR, armL, armRFront: true, armLFront: true,
    sitFoot: [(CP.CAR[2] - CABIN.PEDAL[2] - P[2]) / FIT_CAR.sc * -1, (CABIN.PEDAL[1] - CABIN.FLOOR) / FIT_CAR.sc], ...o } as FigOpts, { scale: FIT_CAR.sc });
};

// ================================================= S1 (0-75) "He tucked his car battery into bed every night,": the hero already
// pulling the red wool blanket up over the battery lying on his pillow; he tucks it and pats it twice; two bunkmates on the top
// bunk behind lean out to stare (one with playing cards).
const H1: V3 = [97.64, 0, -1.3];
const c1 = FIT([body(H1, 0.2, 1.6, 0.3), body([97.1, 0, -1.56], 0.5, 0.85, 0.2), body([96.95, 1.66, -2.5], 0.2, 0.9, 0.3)], 30, 8, 50, 0.84, 0, 0, ROOM_BUNK);
SHOT_CAMS[1] = () => [K(0, glideTo(still(cam3(add3(c1.pos, 0.25, 0.05, 0.45), c1.look, c1.fov + 3)), -24, F(() => c1, 0, 0.0018), 70), 1, true)];
const bunkmates = (id: number, s: SetDef, f: number, f0: number, giggle: boolean): CastPlace[] => {
  const lean = sm(f, f0, f0 + 12), B1: V3 = [96.72, 1.12, -2.42], B2: V3 = [97.22, 1.12, -2.55];
  const k1 = sitLegFor(CASTS_T[CR1] as Look, 0.56), k2 = sitLegFor(CASTS_T[CR2] as Look, 0.56);
  const f1 = faceAt(id, s, f, B1, [97.8, 0.6, -0.5]), f2 = faceAt(id, s, f, B2, [97.8, 0.6, -0.5]);
  return [
    C(CR1, B1, { ...(giggle && f > f0 + 10 ? { ...laughP(f, f0, 1), expr: "smile_closed", shake: 0.45, headBack: 0.15 } : { expr: f > f0 + 6 ? "stare" : "neutral" }), mode: "sit", sitLeg: k1, facing: f1, tilt: 8 * lean, armR: [[22, 10], [30, -10]] as A2, armRFront: true, propR: "card", armL: AR.hipL } as FigOpts),
    C(CR2, B2, { ...(giggle && f > f0 + 14 ? { ...laughP(f, f0, 2), expr: "laugh", shake: 0.5, headBack: 0.2 } : { expr: f > f0 + 8 ? "stare" : "neutral" }), mode: "sit", sitLeg: k2, facing: f2, tilt: 10 * lean, armR: AR.hipR, armL: [[-22, 12], [-10, 30]] as A2 } as FigOpts),
  ];
};
SHOT_ACTS[1] = (f, s) => {
  const fc = faceAt(1, s, f, H1, [96.95, 0.6, -1.4]), ctl = CTL15(f);
  const edgeZ = -0.9 + ctl.blkB, pat = f >= 30 && f < 52 ? bump((f - 30) / 10) + bump((f - 41) / 10) : 0;
  const tuck: [V3, V3] = [[97.34, 0.66, edgeZ + 0.03], [97.14, 0.66, edgeZ + 0.03]];
  const [gR, gL] = byScreen(1, s, f, H1, tuck[0], tuck[1]);
  const top: V3 = [97.24, 0.8 + 0.06 * (1 - pat), -1.46];
  const kn = (o: P): P => ({ mode: "kneel", kneelK: 0.85, ...o });
  const arms = f < 28 ? { armR: armTo(1, s, f, H1, gR, 1, fc, 1, "kneel", 10, 80), armL: armTo(1, s, f, H1, gL, -1, fc, 1, "kneel", 10, 80) } : f < 54 ? { armR: armTo(1, s, f, H1, top, 1, fc, 1, "kneel", 10, 80), armL: armTo(1, s, f, H1, gL, -1, fc, 1, "kneel", 10, 80) } : { armR: AR.hipR, armL: AR.hipL };
  const o = flow(f, [[0, kn({ expr: "calm", facing: fc, tilt: 8 })], [30, kn({ expr: "smile_closed", facing: fc, tilt: 6 }), 8], [56, kn({ expr: "smile_closed", facing: fc, tilt: 2 }), 10]]);
  return { cast: [C(HERO, H1, { ...o, ...arms, armRFront: true, armLFront: true } as FigOpts), ...bunkmates(1, s, f, 46, false)], subj: HERO, focus: [97.2, 0.9, -1.35], ctl,
    qa: { seats: SEAT_BUNKS } } as Act;
};
lens(0, DOF_MS);

// ================================================= S2 (75-150) dissolve "...and his was the only engine in camp that started.": dawn at
// forty below, the frosted row: the crew stamp and hug themselves; in the middle his small car coughs to life (headlights,
// exhaust), he grins at the wheel; the crew turn to stare.
const c2a = cam3([-0.7, 1.35, 1.3], [0.05, 1.05, 7.4], 50), c2b = cam3([-0.45, 1.3, 2.3], [0.0, 1.05, 7.4], 46);
SHOT_CAMS[2] = () => [K(75, glideTo(still(c2a), 75, still(c2b), 152), 1, true)];
const stamp = (f: number, i: number, P: V3, fc: number, look: number): P => ({ ...HUG(f, i), expr: f < look ? "cold" : "stare", facing: fc, mode: "hop", lift: 0.12 * bump(((f + i * 9) % 18) / 18), tilt: f < look ? 0 : 3 });
SHOT_ACTS[2] = (f, s) => {
  const A: V3 = [-2.3, 0, 4.4], B: V3 = [2.35, 0, 4.2], D: V3 = [-5.6, 0, 5.0];
  const car: V3 = [0, 1.2, 6.8], look = 128;
  const fa = faceAt(2, s, f, A, f < look ? [A[0] + 1, 1, A[2] - 1] : car), fb = faceAt(2, s, f, B, f < look ? [B[0] - 1, 1, B[2] - 1] : car), fd = faceAt(2, s, f, D, f < look ? [D[0] + 1, 1, D[2] - 1] : car);
  const drv = carDriver(2, s, f, { expr: f < 118 ? "determined" : "grin" }, 0.12);
  return { cast: [drv, C(CR1, A, stamp(f, 0, A, fa, look) as FigOpts), C(CR3, B, stamp(f, 1, B, fb, look + 4) as FigOpts), C(CR4, D, stamp(f, 2, D, fd, look + 8) as FigOpts)],
    subj: HERO, focus: [0, 1.2, 7.4], ctl: CTL15(f), fx: [...breath("b2a", HD(CR1, A), f, fa), ...breath("b2b", HD(CR3, B), f, fb, 40, 13)],
    qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(75, DOF_WS);

// ================================================= S3 (150-222) dissolve "Every night at the logging camp,": night, high over the camp
// in the pines (CAMP 9 on the mess hall roof): the hero, small, crosses the lot from his car with the battery in his arms.
const PATH3: V3[] = [[1.15, 0, 5.4], [0.8, 0, 3.4], [0.45, 0, 1.45]];
const PATH5: V3[] = [[0.45, 0, 1.45], [0.55, 0.45, 0.62], [0.55, 0.45, 0.12]];
const c3a = cam3([3.6, 10.0, 17.0], [-0.3, 1.0, 1.2], 48);
const c3m = cam3([1.9, 3.3, 8.6], [0.25, 1.2, 0.6], 50), c4 = cam3([1.35, 2.05, 5.5], [0.15, 1.2, 0.0], 50);
const g3 = glideTo(still(c3a), 150, still(c3m), 232), g4 = glideTo(still(c3m), 232, F(() => c4, 280, 0.0016), 280);
const g34 = (f: number) => (f < 232 ? g3(f) : g4(f));
SHOT_CAMS[3] = () => [K(150, g34, 1, true)];
/** the hero's walk with the battery from his car to the porch (S3-S5): one function of the frame */
const heroToPorch = (id: number, s: SetDef, f: number) => {
  const w = f < 262 ? walkS(id, s, HERO, PATH3, f, 152, 262) : walkS(id, s, HERO, PATH5, f, 262, 298);
  const P: V3 = [w.p[0], porchY(w.p[0], w.p[2]), w.p[2]];
  const hitch = bump((f - 248) / 10);
  const cb = carryBat(id, s, f, P, w.facing, w.moving ? w.d : [0, -1], 0.78 + 0.1 * hitch);
  return { P, w, cb, hitch };
};
SHOT_ACTS[3] = (f, s) => {
  const { P, w, cb } = heroToPorch(3, s, f);
  return { cast: [C(HERO, P, { expr: "strain", facing: w.facing, ...w.o, tilt: -6, armR: cb.armR, armL: cb.armL, armRFront: true, armLFront: true } as FigOpts),
    C(FOR, FM5, { expr: "smug", facing: faceAt(3, s, f, FM5, P), armR: [[22, 4], [20, -14]] as A2, armRFront: true, propR: "steamCup", armL: AR.hipL } as FigOpts)], subj: null, focus: [0, 0.5, 5], ctl: { ...CTL15(f), ...batCtl("lb", cb.B, cb.yaw) } as Ctl };
};
lens(150, DOF_WS);

// ================================================= S4 (222-273) "...the new guy lugs all forty pounds of it inside.": the hero steps
// toward the porch, leaning back with the weight (40 LB on the label, BUNKHOUSE over the door); on "inside" he hitches his grip.
SHOT_CAMS[4] = () => [K(222, g34, 1, true)];
SHOT_ACTS[4] = (f, s) => {
  const { P, w, cb, hitch } = heroToPorch(4, s, f);
  const ff = faceAt(4, s, f, FM5, P);
  return { cast: [C(HERO, P, { expr: f < 246 ? "strain" : "determined", facing: w.facing, ...w.o, tilt: -7 + 4 * hitch, sweat: 0.4, armR: cb.armR, armL: cb.armL, armRFront: true, armLFront: true } as FigOpts),
    C(FOR, FM5, { expr: "smug", facing: ff, armR: [[22, 4], [20, -14]] as A2, armRFront: true, propR: "steamCup", armL: AR.hipL, shake: 0.2, phase: f / 8 } as FigOpts)],
    subj: HERO, focus: [cb.B[0], 1.2, cb.B[2]], ctl: { ...CTL15(f), ...batCtl("lb", cb.B, cb.yaw) } as Ctl, fx: breath("b4", HD(HERO, P), f, w.facing, 30) };
};
lens(222, DOF_FS);

// ================================================= S5 (273-363) "The foreman laughs, \"Gonna read it a bedtime story too?\"": the
// foreman on the porch with a steaming mug, blocking the door, chuckling; on the quote he throws his arms out (the mug sloshes)
// and laughs; the hero, 3/4 away with a sweat drop, squeezes past him into the warm doorway.
const FM5: V3 = [-0.72, 0.45, -0.52], FM5b: V3 = [-1.2, 0.45, -0.3];
const c5 = cam3([0.85, 1.6, 3.3], [-0.05, 1.32, -0.45], 46);
SHOT_CAMS[5] = () => [K(273, F(() => c5, 318, 0.0012, [[322, 0.004, 8]]), 45)];
SHOT_ACTS[5] = (f, s) => {
  const fw = walkS(5, s, FOR, [FM5, FM5b], f, 326, 340), fm = fw.p;
  const hw = f < 340 ? heroToPorch(5, s, f) : null;
  const sq = walkS(5, s, HERO, [[0.55, 0.45, 0.12], [0.3, 0.45, -0.62], [0.06, 0.45, -1.3], [0.0, 0.45, -1.95]], f, 340, 374);
  const P = hw ? hw.P : sq.p, fcH = hw ? (f < 300 ? hw.w.facing : faceAt(5, s, f, P, fm)) : sq.facing;
  const dir: [number, number] | null = hw ? (hw.w.moving ? hw.w.d : [-0.6, -0.8]) : sq.d;
  const cb = carryBat(5, s, f, P, fcH, dir, 0.8);
  const ff = faceAt(5, s, f, fm, P);
  const o = flow(f, [
    [273, { expr: "smug", facing: ff, armR: [[22, 4], [20, -14]] as A2, armL: AR.hipL, tilt: 2, shake: 0.3, phase: f / 8 }],
    [312, { expr: "mock", facing: ff, armR: ARMS.wideR, armL: ARMS.wideL, tilt: -2, headBack: 0.25 }, 7],
    [336, { ...laughP(f, 336, 1), facing: ff, armR: [[30, -4], [44, -26]] as A2, armL: ARMS.wideL }, 6],
  ]);
  const heroO = flow(f, [[273, { expr: "strain", facing: fcH }], [312, { expr: "nervous", facing: fcH, sweat: 1 }, 8], [340, { expr: "nervous", facing: fcH, sweat: 1, back: true }, 4]]);
  const slosh = bump((f - 314) / 10) + 0.6 * bump((f - 338) / 10);
  return { cast: [
    C(FOR, fm, { ...speak(f, 305, 352, o), ...(fw.moving ? fw.o : {}), propR: "steamCup", propRAng: 25 * slosh } as FigOpts),
    C(HERO, P, { ...heroO, ...(hw ? hw.w.o : sq.o), facing: fcH, armR: cb.armR, armL: cb.armL, armRFront: true, armLFront: true } as FigOpts),
  ], subj: f < 340 ? FOR : HERO, focus: HD(FOR, fm), ctl: { ...CTL15(f), ...batCtl("lb", cb.B, cb.yaw) } as Ctl,
    fx: fxs(steamCard("mug5", [fm[0] + 0.28, fm[1] + 1.25, fm[2] + 0.1], 0.22, 0.5, 2), f >= 314 && f < 330 ? steamCard("slosh5", [fm[0] + 0.42, fm[1] + 1.4, fm[2] + 0.1], 0.16, 0.7 * bump((f - 314) / 16), 5) : null) };
};
lens(273, DOF_MS);

// ================================================= S6 (363-411) dissolve "Night one, it sleeps by the stove.": the battery on the floor
// by the glowing stove; the hero crouched beside it warming his hands; then he chalks one mark on his bunk's head post.
const H6: V3 = [98.15, 0, -2.42], H6b: V3 = [97.64, 0, -2.02], POST: V3 = [97.43, 1.05, -1.9];
const c6 = FIT([body(H6, 0.1, 1.8, 0.3), body([98.6, 0, -3.0], 0, 0.3, 0.2), body([99.3, 0, -3.85], 0.2, 1.0, 0.3), body(POST, -0.1, 0.25, 0.08)], 72, 8, 50, 0.84, 0, 0, ROOM_BUNK);
SHOT_CAMS[6] = () => [K(363, F(() => c6, 363, 0.0018), 1, true)];
SHOT_ACTS[6] = (f, s) => {
  const st = walkS(6, s, HERO, [H6, H6b], f, 384, 396), P = st.p, fc = st.moving ? st.facing : faceAt(6, s, f, P, f < 386 ? [99.3, 0.6, -3.8] : POST);
  const chalk = f >= 394 && f < 404 ? bump((f - 394) / 10) : 0;
  const warm = f < 386 ? { armR: ARMS.palmR, armL: ARMS.palmL, armRFront: true, armLFront: true, propR: "chalk" }
    : f < 396 ? { armR: AR.hipR, armL: AR.hipL, propR: "chalk" } : { armR: armTo(6, s, f, P, [POST[0] + 0.05, POST[1] + 0.12 - 0.2 * chalk, POST[2] + 0.02], 1, fc, 1, "stand", 10, 80), armRFront: true, propR: "chalk", armL: AR.hipL };
  const o = flow(f, [[363, { expr: "calm", facing: fc, mode: "kneel", kneelK: 0.85 }], [384, { expr: "calm", facing: fc, mode: "kneel", kneelK: 0 }, 10], [396, { expr: "smile_closed", facing: fc }, 6]]);
  return { cast: [C(HERO, P, { ...o, ...warm, ...(st.moving ? { ...st.o, mode: "stride" } : {}) } as FigOpts)], subj: HERO, focus: [98.4, 0.6, -2.7], ctl: CTL15(f) };
};
lens(363, DOF_MS);

// ================================================= S7 (411-459) dissolve "Night two, it gets a blanket.": looking down on the mattress:
// his hands flap the red blanket over the battery and smooth it down; two chalk marks on the post at the frame edge.
const H7: V3 = [97.62, 0, -0.95];
const c7 = cam3([97.0, 1.22, 0.55], [96.98, 0.5, -1.0], 46);
SHOT_CAMS[7] = () => [K(411, F(() => c7, 411, 0.0014), 1, true)];
SHOT_ACTS[7] = (f, s) => {
  const ctl = CTL15(f), fc = faceAt(7, s, f, H7, [96.9, 0.6, -1.0]);
  const edge = -0.9 + ctl.blkB, sm7 = f >= 436 ? 0.03 * Math.sin((f - 436) * 0.5) : 0;
  const [gR, gL] = byScreen(7, s, f, H7, [97.32, 0.64 + 1.2 * ctl.blkLift, -0.75 + sm7], [97.32, 0.64 + 1.2 * ctl.blkLift, -1.12 - sm7]);
  void edge;
  return { cast: [C(HERO, H7, { expr: "calm", facing: fc, back: true, mode: "kneel", kneelK: 0.85, tilt: 6, armR: armTo(7, s, f, H7, gR, 1, fc, 1, "kneel", 10, 80), armL: armTo(7, s, f, H7, gL, -1, fc, 1, "kneel", 10, 80), armRFront: true, armLFront: true } as FigOpts)],
    subj: null, focus: [96.95, 0.62, -1.0], ctl };
};
lens(411, DOF_INSERT);

// ================================================= S8 (459-549) dissolve "Night three, it gets his pillow, and he sleeps on the floor.":
// the battery on his pillow under the blanket with a little knit cap; tilt down to the hero curled on the floor in a sleeping
// bag; on "floor" the bunkmates lean out over the top bunk behind, giggling.
const H8: V3 = [97.95, 0.12, -1.62];
const c8a = cam3([98.95, 1.55, 0.95], [97.3, 0.82, -1.68], 54), c8b = cam3([98.95, 1.5, 0.95], [97.45, 0.68, -1.75], 54);
SHOT_CAMS[8] = () => [K(459, glideTo(still(c8a), 466, F(() => c8b, 500, 0.0012), 500), 1, true)];
SHOT_ACTS[8] = (f, s) => {
  const fc = faceAt(8, s, f, H8, [97.0, 0.7, -1.6]);
  return { cast: [C(HERO, H8, { expr: f < 528 ? "sleep" : "smile_closed", facing: fc, mode: "lie", legsUp: 0, phase: f / 40 } as FigOpts), ...bunkmates(8, s, f, 516, true)],
    subj: f < 500 ? null : HERO, focus: f < 500 ? [96.95, 0.75, -1.56] : HD(HERO, H8), ctl: CTL15(f), fx: f >= 466 ? zzz([H8[0] + 0.25, 0.75, H8[2] + 0.1], f) : [],
    qa: { seats: SEAT_BUNKS } } as Act;
};
lens(459, DOF_MS);

// ================================================= S9 (549-642) dissolve "By breakfast, the whole camp calls him the battery babysitter.":
// the mess hall at three depths, pancakes everywhere; heads turn as the hero carries his tray in; they point and laugh, the cook
// laughs behind the counter; the camera finds the chalk board: BATTERY BABYSITTER with an arrow.
const LEG = (who: string) => sitLegFor(CASTS_T[who] as Look, 0.45);
const c9a = cam3([205.9, 1.85, 3.55], [200.2, 1.0, -0.9], 56), c9b = cam3([203.4, 1.8, 2.5], [196.9, 1.5, -3.2], 50);
SHOT_CAMS[9] = () => [K(549, glideTo(F(() => c9a, 549, 0.0012), 596, still(c9b), 640), 1, true)];
const messCrew = (id: number, s: SetDef, f: number, t0: number, hero: V3): CastPlace[] => {
  const seats: [string, V3, number][] = [[CR1, [197.2, 0, -1.28], 0], [CR2, [202.6, 0, -1.28], 1], [CR3, [198.0, 0, 0.28], 2], [CR4, [199.8, 0, 3.08], 3], [CR5, [202.3, 0, 3.08], 4]];
  return seats.map(([who, seat, i]) => {
    const P = toCam(id, s, f, seat, 0.18), fc = faceAt(id, s, f, P, f < t0 + i * 3 ? [200, 0.8, seat[2] < 0 ? -0.5 : 2.3] : hero);
    const laughing = f >= t0 + 10 + i * 4;
    return C(who, P, { ...(laughing ? laughP(f, t0, i) : { expr: f < t0 + i * 3 ? "neutral" : "stare" }), mode: "sit", sitLeg: LEG(who), facing: fc,
      armR: laughing && i % 2 === 0 ? AR.pointR : AR.hipR, armL: laughing && i % 2 ? [[-26, 30], [-6, 26]] as A2 : AR.hipL, armRFront: laughing } as FigOpts);
  });
};
const cookLaugh = (id: number, s: SetDef, f: number, P: V3, t0: number): CastPlace => C(COOK, P, { ...(f >= t0 ? laughP(f, t0, 3) : { expr: "smile" }), facing: faceAt(id, s, f, P, [201, 1, 0.5]), armR: AR.hipR, armL: AR.hipL } as FigOpts);
SHOT_ACTS[9] = (f, s) => {
  const w = walkS(9, s, HERO, [[206.3, 0, 0.9], [203.4, 0, 0.9], [201.08, 0, 0.44]], f, 553, 614);
  const sit = sm(f, 616, 632), P = w.p;
  const fc = w.moving ? w.facing : faceAt(9, s, f, P, [201.0, 0.8, -0.5]);
  const tray: V3 = [P[0] - 0.05, 0.98 - 0.2 * sit, P[2] + 0.12];
  const hero = C(HERO, P, { expr: f < 600 ? "calm" : "smug", facing: fc, ...(w.moving ? w.o : {}), ...(sit > 0.5 ? { mode: "sit", sitLeg: LEG(HERO) } : {}), armR: armTo(9, s, f, P, [tray[0] + 0.12, tray[1], tray[2]], 1, fc, 1, sit > 0.5 ? "sit" : "stand"), armL: armTo(9, s, f, P, [tray[0] - 0.12, tray[1], tray[2]], -1, fc, 1, sit > 0.5 ? "sit" : "stand"), armRFront: true, armLFront: true, propR: "tray" } as FigOpts);
  return { cast: [hero, ...messCrew(9, s, f, 578, HD(HERO, P)), cookLaugh(9, s, f, [199.8, 0, -3.62], 590)], subj: f < 600 ? HERO : null, focus: f < 600 ? HD(HERO, P) : [196.4, 1.95, -3.9], ctl: CTL15(f),
    qa: { seats: SEAT_MESS } } as Act;
};
lens(549, DOF_WS); lens(600, 1.5, 30, () => [196.4, 1.95, -3.9]);

// ================================================= S10 (642-693) CUT "Why? He won't say.": the hero in close-up across the table, half-lid
// calm, sips his coffee; on "won't say" a one-shoulder shrug with his eyes closed; the crew laugh behind him.
const P10: V3 = [201.0, 0, 0.44];
const c10 = FIT([body(P10, 0.72, 1.55, 0.26)], 182, 2, 40, 0.78, 0, 0.04, ROOM_MESS);
SHOT_CAMS[10] = () => [K(642, F(() => c10, 642, 0.0016), 1, true)];
SHOT_ACTS[10] = (f, s) => {
  const fc = faceAt(10, s, f, P10, [201.0, 1.0, -1.0]), sip = sm(f, 646, 654) * (1 - sm(f, 662, 670));
  const cup: V3 = [P10[0] + 0.1, 0.9 + 0.32 * sip, P10[2] - 0.16];
  const o = flow(f, [[642, { expr: "calm", facing: fc, mode: "sit", sitLeg: LEG(HERO) }], [664, { expr: "smile_closed", facing: fc, mode: "sit", sitLeg: LEG(HERO), tilt: -3, headTilt: -6, armL: AR.shrugL }, 6], [682, { expr: "calm", facing: fc, mode: "sit", sitLeg: LEG(HERO), armL: AR.hipL }, 8]]);
  return { cast: [C(HERO, P10, { ...o, armR: armTo(10, s, f, P10, cup, 1, fc, 1, "sit", 10, 80), armRFront: true, propR: "steamCup" } as FigOpts),
    ...messCrew(10, s, f, 600, HD(HERO, P10)).filter((c) => c.who === CR4 || c.who === CR5)], subj: HERO, focus: HD(HERO, P10), ctl: CTL15(f), qa: { seats: SEAT_MESS } } as Act;
};
lens(641, DOF_CU, 1);
KICKS.push([642 / 30, 0.04]);

// ================================================= S11 (693-768) dissolve "The first cold morning, every truck starts just fine,": day, high
// and wide over the lot: truck after truck starts (exhaust puffs, the drivers in their cabs); the hero walks to his open hood with
// the battery and lowers it into the tray.
const c11a = cam3([-10.0, 5.0, 0.5], [1.8, 1.0, 6.4], 50), c11b = cam3([-3.6, 1.75, 4.5], [0.4, 1.2, 5.0], 50);
SHOT_CAMS[11] = () => [K(693, glideTo(still(c11a), 693, still(c11b), 780), 1, true)];
const heroToCar = (id: number, s: SetDef, f: number, pts: V3[], a: number, b: number, down0: number, down1: number) => {
  const w = walkS(id, s, HERO, pts, f, a, b), P = w.p, fc = w.moving ? w.facing : faceAt(id, s, f, P, [P[0], 1, P[2] + 2]);
  const cb = carryBat(id, s, f, P, fc, w.moving ? w.d : [0, 1], 0.8, 1, 0.18, w.moving ? 0.17 : 0.05);
  const k = sm(f, down0, down1), B = lerp3(cb.B, CP.TRAY_W, k), yaw = lerp(cb.yaw, Math.PI, k);
  const arms = k <= 0 ? { armR: cb.armR, armL: cb.armL } : { armR: armTo(id, s, f, P, [B[0] + 0.12, B[1] + 0.14, B[2] - 0.05], 1, fc, 1, "stand", 10, 80), armL: armTo(id, s, f, P, [B[0] - 0.12, B[1] + 0.14, B[2] - 0.05], -1, fc, 1, "stand", 10, 80) };
  return { P, w, fc, B, yaw, arms, k };
};
SHOT_ACTS[11] = (f, s) => {
  const h = heroToCar(11, s, f, [[0.9, 0, 3.0], [0.45, 0, 4.25], CP.HERO_HOOD], 693, 742, 746, 764);
  const drivers = [pkDriver(11, s, f, CR2, CP.CREW[0], 1, { expr: "smile" }), pkDriver(11, s, f, CR3, CP.CREW[1], 1, { expr: "smile" }), pkDriver(11, s, f, FOR, CP.GIANT, CP.GK, { expr: "smug" })];
  return { cast: [C(HERO, h.P, { expr: "calm", facing: h.fc, ...h.w.o, tilt: 10 * h.k, ...h.arms, armRFront: true, armLFront: true } as FigOpts), ...drivers],
    subj: null, focus: [0, 0.6, 5], ctl: { ...CTL15(f), ...batCtl("lb", h.B, h.yaw) } as Ctl, qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(693, DOF_WS);

// ================================================= S12 (768-840) "...and the foreman honks at him all the way to work.": the hero bent
// over his open hood; the foreman's giant red truck pulls out of the row and rolls past behind him, the foreman leaning out of
// his window honking and laughing; the hero straightens, deadpan.
const c12 = cam3([-3.2, 1.5, 4.8], [0.5, 1.2, 5.0], 50);
SHOT_CAMS[12] = () => [K(768, F(() => c12, 800, 0.0012), 32)];
SHOT_ACTS[12] = (f, s) => {
  const P = CP.HERO_HOOD, fc = faceAt(12, s, f, P, [0.3, 0.8, 6.0]), up = sm(f, 815, 826);
  const work = Math.sin(f * 0.35) * (1 - up);
  const hands: [V3, V3] = [[0.3, 0.84 + 0.03 * work, 5.55], [0.06, 0.84 - 0.03 * work, 5.55]];
  const [gR, gL] = byScreen(12, s, f, P, hands[0], hands[1]);
  const hero = C(HERO, P, { expr: f < 815 ? "calm" : "bored", facing: fc, tilt: 24 * (1 - up), back: f < 815,
    armR: up < 1 ? armTo(12, s, f, P, gR, 1, fc, 1, "stand", 10, 80) : AR.hipR, armL: up < 1 ? armTo(12, s, f, P, gL, -1, fc, 1, "stand", 10, 80) : AR.hipL, armRFront: true, armLFront: true } as FigOpts);
  const g = gtAt(f), base: V3 = [g.x, 0, g.z];
  const fs = pkFit(FOR, CP.GK), win = pkW(base, CP.GK, [0.72, PK_FLOOR, 0.18], g.yaw);
  const ffc = faceAt(12, s, f, win, P), honk = f >= 795 ? bump(((f - 795) % 10) / 10) : 0;
  const foreman = C(FOR, win, { ...(f >= 800 ? laughP(f, 800, 1) : { expr: "smug" }), facing: ffc, mode: "sit", sitLeg: fs.sitLeg, tilt: -8 * sm(f, 790, 800), armR: f >= 792 ? ([[30, -6], [50, -18 - 6 * honk]] as A2) : AR.hipR, armL: AR.hipL, armRFront: true } as FigOpts, { scale: fs.sc });
  return { cast: [hero, foreman], subj: f < 800 ? HERO : FOR, focus: f < 800 ? HD(HERO, P) : HD(FOR, win), ctl: CTL15(f), qa: { seats: [seatBox("giant moving", pkW(base, CP.GK, PK_SEAT, g.yaw), 0.6, 0.6)] } } as Act;
};
lens(768, DOF_MS);

// ================================================= S13 (840-912) dissolve "Then one night, it hits forty below.": night, the porch
// thermometer frosted over; a gloved hand wipes the glass: the red line sinks to -40; the hand carries the battery up past it.
const H13: V3 = [-1.62, 0, 1.05];
const c13 = cam3([-2.28, 1.25, 1.5], [-2.06, 1.22, 0.64], 36);
SHOT_CAMS[13] = () => [K(840, F(() => c13, 840, 0.0016), 1, true)];
SHOT_ACTS[13] = (f, s) => {
  const fc = faceAt(13, s, f, H13, [-2.06, 1.25, 0.64]), wipe = f >= 862 && f < 878 ? (f - 862) / 16 : -1;
  const go = walkS(13, s, HERO, [H13, [-0.95, 0, 1.05], [-0.55, 0.45, 0.5]], f, 890, 934), P = f < 890 ? H13 : [go.p[0], porchY(go.p[0], go.p[2]), go.p[2]] as V3;
  const T: V3 = wipe >= 0 ? [-2.0 - 0.08 * Math.sin(wipe * Math.PI * 2), 1.32 - 0.14 * wipe, 0.72] : [-2.02, 1.2, 0.74];
  const cb = carryBat(13, s, f, P, f < 890 ? fc : go.facing, f < 890 ? [1, 0] : go.d, 0.95, 1, 0.12, 0.2);
  const arms = f < 880 ? { armR: armTo(13, s, f, P, T, 1, fc, 1, "stand", 10, 80), armRFront: true, armL: armTo(13, s, f, P, [P[0] - 0.05, 1.0, P[2] + 0.2], -1, fc), armLFront: true } : { armR: cb.armR, armL: cb.armL, armRFront: true, armLFront: true };
  const holdB = f >= 880 ? cb.B : ([P[0] + 0.02, 0.8, P[2] + 0.2] as V3);
  return { cast: [C(HERO, P, { expr: "cold", facing: f < 890 ? fc : go.facing, ...(f >= 890 ? go.o : {}), ...arms } as FigOpts)], subj: null, focus: [-2.06, 1.24, 0.64], ctl: { ...CTL15(f), ...batCtl("lb", holdB, cb.yaw) } as Ctl };
};
lens(840, DOF_INSERT);

// ================================================= S14 (912-975) dissolve "At six, the whole crew turns their keys,": dawn at forty below,
// ice fog over the frosted row, the mess hall clock at 6:00; the crew trudge out in clouds of breath to the trucks; the foreman
// heads for his giant; the drivers already in their cabs.
const c14a = cam3([-3.4, 1.6, 0.2], [-3.1, 1.5, 10.3], 56), c14b = cam3([-1.3, 2.05, 3.6], [-6.4, 1.6, 8.6], 50);
SHOT_CAMS[14] = () => [K(912, F(() => c14a, 912, 0.0016), 1, true)];
/** the two crewmen trudging to the far trucks (S14, carrying on through S15) */
const trudgers = (id: number, s: SetDef, f: number) => {
  const w1 = walkS(id, s, CR1, [[-2.9, 0, 3.5], [-7.0, 0, 4.6], [-16.3, 0, 6.6]], f, 912, 1030), w4 = walkS(id, s, CR4, [[-4.4, 0, 3.4], [-9.8, 0, 4.2], [-18.6, 0, 5.4]], f, 912, 1036);
  const walker = (who: string, w: ReturnType<typeof walkS>, i: number) => C(who, w.p, { ...HUG(f, i), expr: "cold", facing: w.facing, ...w.o, tilt: 4 } as FigOpts);
  void w1; return { cast: [walker(CR4, w4, 1)], fx: breath("b14b", HD(CR4, w4.p), f, w4.facing, 30, 11) };
};
SHOT_ACTS[14] = (f, s) => {
  const wf = walkS(14, s, FOR, [[1.4, 0, 1.3], [2.8, 0, 3.8], [3.3, 0, 6.9]], f, 920, 980), tr = trudgers(14, s, f);
  return { cast: [pkDriver(14, s, f, CR2, CP.CREW[0], 1, { expr: "cold" }), ...tr.cast, C(FOR, wf.p, { expr: "smug", facing: wf.facing, ...wf.o, armR: AR.hipR, armL: AR.hipL } as FigOpts),
    pkDriver(14, s, f, CR3, CP.CREW[1], 1, { expr: "cold" })],
    subj: null, focus: [-2.5, 1.2, 6.5], ctl: CTL15(f), fx: tr.fx, qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(912, DOF_WS, 18);

// ================================================= S15 (975-1038) "...and the lot goes click, click, click.": tracking along the
// windshields: each driver turns his key: click... click... click, and the third slumps onto his wheel.
const c15 = (f: number): Shot => { const u = gl(f, 975, 63); return { pos: [lerp(-1.0, -1.7, u), 2.05, lerp(5.6, 5.3, u)], look: [-5.6, 1.6, 7.8], fov: 48, roll: 0 }; };
SHOT_CAMS[15] = () => [K(975, c15, 1, true)];
SHOT_ACTS[15] = (f, s) => {
  const drv = (who: string, base: V3, i: number, kf: number) => {
    const turn = sm(f, kf - 4, kf), dead = f >= kf + 2, slump = i === 2 ? sm(f, kf + 2, kf + 10) : 0;
    const o: P = { expr: dead ? (i === 2 ? "dazed" : "aghast") : "determined", tilt: 18 * slump };
    const c = pkDriver(15, s, f, who, base, 1, o, Math.PI, 0.1);
    if (!dead || i === 2) { const key = pkW(base, 1, [0.25, 1.28, 0.4]); c.o = { ...c.o, armR: armTo(15, s, f, c.pos, [key[0], key[1] + 0.03 * turn, key[2]], 1, (c.o as FigOpts).facing ?? 1, c.scale ?? 1, "sit", 10, 80) } as FigOpts; }
    return c;
  };
  const tr = trudgers(15, s, f);
  return { cast: [drv(CR2, CP.CREW[0], 0, 1003), drv(CR3, CP.CREW[1], 1, 1019), drv(CR5, CP.CREW[2], 2, 1027), ...tr.cast], fx: tr.fx, subj: CR2, focus: [-5.6, 1.8, 7.8], ctl: CTL15(f), qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(975, DOF_MS, 12);

// ================================================= S16 (1038-1122) "Even the foreman's giant truck just coughs and dies.": through the
// giant truck's windshield: the foreman turns his key, smug; the truck shudders, coughs once, dies; his moustache droops and his
// forehead drops onto the wheel (a feeble honk).
const c16 = cam3([4.12, 1.95, 5.55], [4.08, 2.02, 7.75], 38);
SHOT_CAMS[16] = () => [K(1038, F(() => c16, 1038, 0.0016), 1, true)];
SHOT_ACTS[16] = (f, s) => {
  const ctl = CTL15(f), shud = (ctl.gtCough as number) * Math.sin(f * 2.3);
  const drop = sm(f, 1110, 1116), turn = sm(f, 1046, 1052);
  const o = flow(f, [[1038, { expr: "smug" }], [1084, { expr: "yikes" }, 4], [1108, { expr: "dismay", tilt: 6 }, 4], [1112, { expr: "dazed", tilt: 26, headTilt: 8 }, 4]]);
  const c = pkDriver(16, s, f, FOR, CP.GIANT, CP.GK, { ...o, tilt: ((o as FigOpts).tilt ?? 0) + 2 * shud } as P, Math.PI, 0.12);
  if (f < 1060) { const key = pkW(CP.GIANT, CP.GK, [0.25, 1.28, 0.4]); c.o = { ...c.o, armR: armTo(16, s, f, c.pos, [key[0], key[1] + 0.04 * turn, key[2]], 1, (c.o as FigOpts).facing ?? 1, c.scale ?? 1, "sit", 10, 80) } as FigOpts; }
  void drop;
  return { cast: [c], subj: FOR, focus: HD(FOR, [c.pos[0], c.pos[1] + 0.2, c.pos[2]]), ctl: { ...ctl, frost: 0.3 } as Ctl, qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(1037, DOF_MS, 1);
KICKS.push([1105 / 30, 0.05]);

// ================================================= S17 (1122-1197) "Then the babysitter walks out with his battery steaming in his
// arms,": low, from the dead row: the bunkhouse door swings open on warm light, the hero walks out with the battery steaming in
// his arms; two crewmen in the foreground watch him come.
const PATH17: V3[] = [[0.0, 0.45, -1.35], [0.22, 0.45, 0.35], [0.32, 0, 1.55], [0.2, 0, 4.0], CP.HERO_HOOD];
const c17a = cam3([2.3, 0.9, 6.3], [0.0, 1.3, -0.6], 46), c17b = cam3([2.3, 0.95, 6.3], [0.3, 0.95, 5.15], 48);
SHOT_CAMS[17] = () => [K(1122, glideTo(still(c17a), 1122, still(c17b), 1204), 1, true)];
const heroOut = (id: number, s: SetDef, f: number) => {
  const w = walkS(id, s, HERO, PATH17, f, 1124, 1206), P: V3 = [w.p[0], porchY(w.p[0], w.p[2]), w.p[2]];
  return { w, P };
};
SHOT_ACTS[17] = (f, s) => {
  const { w, P } = heroOut(17, s, f), cb = carryBat(17, s, f, P, w.facing, w.moving ? w.d : [0, 1], 0.82);
  const A: V3 = [-1.2, 0, 5.4], B: V3 = [-2.3, 0, 3.9];
  const fa = faceAt(17, s, f, A, P), fb = faceAt(17, s, f, B, P);
  return { cast: [C(HERO, P, { expr: f < 1150 ? "determined" : "smug", facing: w.facing, ...w.o, armR: cb.armR, armL: cb.armL, armRFront: true, armLFront: true } as FigOpts),
    C(CR1, A, { ...HUG(f, 0), expr: f < 1140 ? "cold" : "stare", facing: fa, back: true } as FigOpts), C(CR4, B, { ...HUG(f, 1), expr: f < 1146 ? "cold" : "aghast", facing: fb } as FigOpts)],
    subj: HERO, focus: HD(HERO, P), ctl: { ...CTL15(f), ...batCtl("lb", cb.B, cb.yaw) } as Ctl, fx: breath("b17", HD(CR4, B), f, fb, 34) };
};
lens(1122, DOF_FS, 14);

// ================================================= S18 (1197-1254) "...hooks it up,": over his shoulder at the open hood: he lowers the
// steaming battery into the tray (COLD CRANKING AMPS on its label), hooks the red clamp, then the black.
const c18 = cam3([2.2, 1.25, 6.2], [0.3, 0.85, 5.55], 50);
SHOT_CAMS[18] = () => [K(1197, F(() => c18, 1240, 0.0012), 42)];
SHOT_ACTS[18] = (f, s) => {
  const { w } = heroOut(18, s, f), P: V3 = [w.p[0], 0, w.p[2]];
  const fc = w.moving ? w.facing : faceAt(18, s, f, P, [0.4, 0.8, 6.0]), cb = carryBat(18, s, f, P, fc, [0, 1], 0.82, 1, 0.18, 0.05);
  const k = sm(f, 1206, 1226), B = lerp3(cb.B, CP.TRAY_W, k), yaw = lerp(cb.yaw, 1.29, k);
  const red: V3 = [CP.TRAY_W[0] - 0.12, 0.84, CP.TRAY_W[2] - 0.08], blk: V3 = [CP.TRAY_W[0] + 0.02, 0.84, CP.TRAY_W[2] - 0.08];
  const hook = f < 1228 ? null : f < 1236 ? red : blk;
  const arms = k < 1 ? { armR: armTo(18, s, f, P, [B[0] + 0.12, B[1] + 0.14, B[2] - 0.04], 1, fc, 1, "stand", 10, 80), armL: armTo(18, s, f, P, [B[0] - 0.12, B[1] + 0.14, B[2] - 0.04], -1, fc, 1, "stand", 10, 80) }
    : { armR: armTo(18, s, f, P, hook ?? red, 1, fc, 1, "stand", 10, 80), armL: armTo(18, s, f, P, [P[0] + 0.25, 0.88, P[2] + 0.4], -1, fc, 1, "stand", 10, 80) };
  const A: V3 = [-1.2, 0, 5.4];
  return { cast: [C(HERO, P, { expr: f < 1230 ? "determined" : "smug", facing: fc, tilt: 20 * k, ...(w.moving ? w.o : {}), ...arms, armRFront: true, armLFront: true } as FigOpts),
    C(CR1, A, { ...HUG(f, 0), expr: "stare", facing: faceAt(18, s, f, A, P), back: true } as FigOpts), C(CR4, [-2.3, 0, 3.9], { ...HUG(f, 1), expr: "aghast", facing: faceAt(18, s, f, [-2.3, 0, 3.9], P) } as FigOpts)],
    subj: HERO, focus: [CP.TRAY_W[0], 0.8, CP.TRAY_W[2]], ctl: { ...CTL15(f), ...batCtl("lb", B, yaw) } as Ctl };
};
lens(1197, DOF_MS);

// ================================================= S19 (1254-1305) CUT "...and turns the key. First try.": inside his car (cutaway, the
// passenger side gone): he turns the brass key on its red string; the engine roars first try; he smirks.
const c19 = cam3([1.32, 1.12, 7.82], [-0.32, 1.03, 7.8], 46);
SHOT_CAMS[19] = () => [K(1254, F(() => c19, 1254, 0.0012), 1, true)];
SHOT_ACTS[19] = (f, s) => {
  const roar = f >= 1268 ? bump((f - 1268) / 18) : 0;
  const o = flow(f, [[1254, { expr: "determined" }], [1270, { expr: "glow", tilt: -3 }, 4], [1282, { expr: "smug", tilt: 0 }, 6]]);
  return { cast: [carDriver(19, s, f, { ...o, tilt: ((o as FigOpts).tilt ?? 0) + 1.5 * roar * Math.sin(f * 2.1) } as P, 0.22, f < 1272 ? 1 + sm(f, 1258, 1266) : 0)],
    subj: HERO, focus: [CAR_SEAT[0], 1.2, CAR_SEAT[2]], ctl: CTL15(f), qa: { seats: SEAT_TRUCKS } } as Act;
};
lens(1253, DOF_CU, 1);
KICKS.push([1270 / 30, 0.05]);

// ================================================= S20 (1305-1392) CUT "You see, a battery makes power with a chemical reaction,": the
// camera pushes into the running engine bay; the battery case slices open: plates in acid with the reaction streaming bright
// between them; the hero leans in over the fender, watching.
const c20a = cam3([0.82, 1.18, 4.42], [0.46, 0.66, 5.87], 42), c20b = cam3([0.56, 0.86, 5.08], [0.46, 0.66, 5.7], 36);
SHOT_CAMS[20] = () => [K(1305, glideTo(still(c20a), 1305, still(c20b), 1362), 1, true), K(1362, F(() => c20b, 1362, 0.0008), 1)];
SHOT_ACTS[20] = (f, s) => {
  const P: V3 = [-0.78, 0, 5.5], fc = faceAt(20, s, f, P, CP.TRAY_W), lean = sm(f, 1336, 1350);
  return { cast: [C(HERO, P, { expr: lean > 0.5 ? "glow" : "calm", facing: fc, tilt: 16 * lean, armR: AR.hipR, armL: AR.hipL } as FigOpts)], subj: null, focus: [CP.TRAY_W[0], 0.7, CP.TRAY_W[2]], ctl: CTL15(f) };
};
lens(1305, DOF_INSERT);

// ================================================= S21 (1392-1479) dissolve "...and the cold slows it down like honey from the fridge.": the
// cook pulls the honey bottle out of the old fridge and squeezes it over a stack of pancakes: nothing; both hands, face straining;
// one slow blob creeps out.
const c21 = FIT([body(CP.COOK, 0.4, 1.6, 0.32), body(CP.FRIDGE, 0.3, 1.7, 0.4), body(CP.HONEY_STACK, 0, 0.15, 0.12)], 350, 6, 48, 0.86, 0, 0, ROOM_MESS);
SHOT_CAMS[21] = () => [K(1392, F(() => c21, 1392, 0.0018, [[1452, 0.004, 10]]), 1, true)];
SHOT_ACTS[21] = (f, s) => {
  const P = CP.COOK, ctl = CTL15(f);
  const out = sm(f, 1394, 1412), H0: V3 = [205.3, 1.12, -3.0], H1: V3 = [CP.HONEY_STACK[0] + 0.04, 1.22, CP.HONEY_STACK[2] - 0.04];
  const bottle = lerp3(H0, H1, out), roll = Math.PI * sm(f, 1404, 1414), squeeze = f >= 1416 ? bump(((f - 1416) % 12) / 12) : 0, both = f >= 1430;
  const B: V3 = [bottle[0], bottle[1] - 0.004 * squeeze, bottle[2]];
  const fc = faceAt(21, s, f, P, f < 1408 ? CP.FRIDGE : CP.HONEY_STACK);
  const grip = (dx: number): V3 => [B[0] + dx, B[1] - 0.06, B[2]];
  const o = flow(f, [[1392, { expr: "smile", facing: fc }], [1416, { expr: "stare", facing: fc }, 6], [1432, { expr: "strain", facing: fc, sweat: 1, tilt: 4 }, 6], [1458, { expr: "aghast", facing: fc, sweat: 1 }, 6]]);
  const W: V3 = [203.3, 0, -2.3], fw = faceAt(21, s, f, W, P);
  return { cast: [C(COOK, P, { ...o, armR: armTo(21, s, f, P, grip(0.04), 1, fc, 1, "stand", 10, 80), armL: both ? armTo(21, s, f, P, grip(-0.04), -1, fc, 1, "stand", 10, 80) : AR.hipL, armRFront: true, armLFront: both, shake: both ? 0.3 : 0, phase: f / 4 } as FigOpts),
    C(CR3, W, { expr: f < 1440 ? "neutral" : "bored", facing: fw, armR: [[22, 14], [30, 4]] as A2, armRFront: true, propR: "tray", armL: AR.hipL } as FigOpts)],
    subj: COOK, focus: [CP.HONEY_STACK[0] + 0.3, 1.2, CP.HONEY_STACK[2]], ctl: { ...ctl, hbX: B[0], hbY: B[1], hbZ: B[2], hbRoll: roll } as Ctl };
};
lens(1392, DOF_MS);

// ================================================= S22 (1479-1551) dissolve "At forty below, it loses more than half its power,": from inside
// the giant truck's open bay: the hero, leaning over the grille, clips the tester onto the frosted battery; the needle swings
// up, then sags into WEAK; the foreman leans in behind; the porch thermometer far behind.
const H22: V3 = [3.0, 0, 4.85], F22: V3 = [3.45, 0, 4.05];
const c22 = cam3([2.2, 2.1, 3.6], [3.6, 1.2, 5.25], 46);
SHOT_CAMS[22] = () => [K(1479, F(() => c22, 1479, 0.0016), 1, true)];
SHOT_ACTS[22] = (f, s) => {
  const fc = faceAt(22, s, f, H22, CP.GTRAY), fl = walkS(22, s, FOR, [[4.2, 0, 3.3], F22], f, 1520, 1536), lean = sm(f, 1522, 1534), Pf = fl.p, ff = fl.moving ? fl.facing : faceAt(22, s, f, Pf, CP.GTRAY);
  const T: V3 = [3.25, 1.16, 4.98];   // the tester in both hands (its leads clipped to the posts)
  return { cast: [C(HERO, H22, { expr: "calm", facing: fc, tilt: 14, armR: armTo(22, s, f, H22, [T[0] + 0.05, T[1] + 0.02, T[2]], 1, fc, 1, "stand", 10, 80), armL: armTo(22, s, f, H22, [T[0] - 0.05, T[1] - 0.04, T[2]], -1, fc, 1, "stand", 10, 80), armRFront: true, armLFront: true } as FigOpts),
    C(FOR, Pf, { expr: f < 1528 ? "smug" : "worry", facing: ff, ...(fl.moving ? fl.o : {}), tilt: 12 * lean, armR: AR.hipR, armL: AR.hipL } as FigOpts)],
    subj: null, focus: T, ctl: { ...CTL15(f), ...dipIn(f), tester: 1, tsX: T[0], tsY: T[1] - 0.09, tsZ: T[2], tsYaw: Math.PI } as Ctl };
};
lens(1479, DOF_INSERT);

// ================================================= S23 (1551-1635) "...just when a frozen engine needs twice as much.": the foreman at his
// truck's fender pulls the oil dipstick; the oil hangs off it like cold honey and won't drip; his face falls.
const F23: V3 = [3.18, 0, 5.15], DIP_IN: V3 = [3.5, 1.24, 5.34], DIP_REST: V3 = [3.42, 1.3, 5.45], H24: V3 = [0.95, 0, 5.35];
const c23 = cam3([1.95, 1.75, 3.75], [3.2, 1.25, 5.1], 46);
SHOT_CAMS[23] = () => [K(1551, F(() => c23, 1621, 0.0012), 70)];
SHOT_ACTS[23] = (f, s) => {
  const fwk = walkS(23, s, FOR, [F22, [3.25, 0, 4.6], F23], f, 1560, 1578), PF = fwk.p;
  const fc = fwk.moving ? fwk.facing : faceAt(23, s, f, PF, f < 1600 ? CP.GDIP : [3.9, 2.0, 6.1]), pull = sm(f, 1580, 1598);
  const held: V3 = [3.3, 1.28, 5.1], hand = f < 1580 ? DIP_IN : f < 1620 ? lerp3(DIP_IN, held, pull) : lerp3(held, DIP_REST, sm(f, 1620, 1632));
  const o = flow(f, [[1551, { expr: "worry" }], [1590, { expr: "stare" }, 6], [1610, { expr: "dismay", tilt: 4 }, 8]]);
  const goo = 0.3 + 0.7 * sm(f, 1590, 1630), letGo = f >= 1632;
  const hw = walkS(23, s, HERO, [H22, [2.0, 0, 5.1], H24], f, 1556, 1620), fh = hw.moving ? hw.facing : faceAt(23, s, f, hw.p, F23);
  const tb = carryBat(23, s, f, hw.p, fh, hw.moving ? hw.d : [1, -0.3], 1.0, 0.45, 0.12, 0.15);
  const holding = f >= 1578 && !letGo;
  return { cast: [C(FOR, PF, { ...o, ...(fwk.moving ? fwk.o : {}), facing: fc, armR: holding ? armTo(23, s, f, PF, hand, 1, fc, 1, "stand", 10, 80) : AR.hipR, armRFront: true, armL: AR.hipL } as FigOpts),
    C(HERO, hw.p, { expr: "smug", facing: fh, ...hw.o, armR: tb.armR, armL: tb.armL, armRFront: true, armLFront: true } as FigOpts)],
    subj: f < 1578 ? null : FOR, focus: HD(FOR, F23),
    ctl: { ...CTL15(f), tester: 1, leads: f < 1560 ? 1 : 0, ...(() => { const k = sm(f, 1551, 1566), T0: V3 = [3.25, 1.07, 4.98]; return { tsX: lerp(T0[0], tb.B[0], k), tsY: lerp(T0[1], tb.B[1], k), tsZ: lerp(T0[2], tb.B[2], k), tsYaw: lerp(Math.PI, tb.yaw, k) }; })(), hdip: 1, dsX: hand[0], dsY: hand[1] - 0.02, dsZ: hand[2], dsRoll: f >= 1620 ? 1.45 * sm(f, 1620, 1632) : 0.08 * Math.sin(f * 0.2), goo } as Ctl };
};
lens(1551, DOF_MS);

// ================================================= S24 (1635-1752) "So the foreman shuffles over, \"Hey, babysitter, got cables?\"": the
// foreman shuffles over, his hat in his hands, to the hero by his idling car; fake grin, sweat drop; the hero raises one eyebrow.
const F24: V3 = [2.08, 0, 4.92];
const c24a = cam3([-0.4, 1.5, 6.45], [2.6, 1.15, 4.7], 44), c24b = FIT([body(H24, 0.4, 1.65, 0.28), body(F24, 0.4, 1.7, 0.32)], 192, 3, 46, 0.86);
SHOT_CAMS[24] = () => [K(1635, F(() => c24b, 1635, 0.0014, [[1734, 0.004, 8]]), 1, true)];
void c24a;
SHOT_ACTS[24] = (f, s) => {
  const w = walkS(24, s, FOR, [[3.9, 0, 4.2], [3.0, 0, 4.7], F24], f, 1638, 1690), Pf = w.p, ff = w.moving ? w.facing : faceAt(24, s, f, Pf, H24);
  const fh = faceAt(24, s, f, H24, Pf);   // the foreman shuffles in from his truck
  const hat: P = { noHat: true, armR: [[24, 20], [2, 22]] as A2, armL: [[-24, 20], [-2, 24]] as A2, armRFront: true, armLFront: true };
  const o = flow(f, [[1635, { expr: "sheepish", facing: ff, ...hat }], [1694, { expr: "fakegrin", facing: ff, sweat: 1, ...hat, tilt: -3 }, 6]]);
  const ho = flow(f, [[1635, { expr: "calm", facing: fh }], [1734, { expr: "sly", facing: fh, headTilt: 5 }, 6]]);
  const tb = carryBat(24, s, f, H24, fh, [1, -0.3], 1.0, 0.45, 0.12, 0.15);
  return { cast: [C(FOR, Pf, { ...speak(f, 1694, 1741, o), ...(w.moving ? { ...w.o, facing: w.facing } : {}) } as FigOpts), C(HERO, H24, { ...ho, armR: tb.armR, armL: tb.armL, armRFront: true, armLFront: true } as FigOpts)],
    subj: f < 1734 ? FOR : HERO, focus: f < 1734 ? HD(FOR, Pf) : HD(HERO, H24), ctl: { ...CTL15(f), tester: 1, leads: 0, tsX: tb.B[0], tsY: tb.B[1], tsZ: tb.B[2], tsYaw: tb.yaw, hdip: 1, dsX: DIP_REST[0], dsY: DIP_REST[1] - 0.02, dsZ: DIP_REST[2], dsRoll: 1.45, goo: 1 } as Ctl };
};
/** the dipstick sits in its tube from the tester insert on (the built-in one is hidden): one object, no pop */
const dipIn = (f: number) => (f >= 1479 && f < 1551 ? { hdip: 1, dsX: DIP_IN[0], dsY: DIP_IN[1] - 0.02, dsZ: DIP_IN[2], dsRoll: 0, goo: 0.3 } : {});
const _unused24 = () => {
};
lens(1635, DOF_MS, 12);

// ================================================= S25 (1752-1845) dissolve "By lunch, the babysitter has jump-started the whole camp.":
// high over the lot by day: jumper cables run from his little car to truck after truck; the engines roar one by one, exhaust down
// the row; the crew cheer.
const c25a = cam3([6.8, 14.5, -5.5], [-4.2, 0.4, 7.2], 48), c25b = cam3([5.4, 11.5, -3.6], [-4.4, 0.6, 7.0], 50);
SHOT_CAMS[25] = () => [K(1752, glideTo(still(c25a), 1752, still(c25b), 1850), 1, true)];
SHOT_ACTS[25] = (f, s) => {
  const cheer = (who: string, P: V3, t0: number, i: number) => C(who, P, f >= t0 ? { expr: "joy", facing: i % 2 ? 1 : -1, armR: ARMS.upR, armL: ARMS.upL, armRFront: true, armLFront: true, mode: "hop", lift: 0.5 * bump(((f - t0 + i * 5) % 16) / 16) } as FigOpts : { expr: "stare", facing: i % 2 ? 1 : -1, ...HUG(f, i) } as FigOpts);
  return { cast: [C(HERO, [0.95, 0, 5.0], { expr: "smug", facing: 1, armR: AR.hipR, armL: AR.hipL } as FigOpts), C(FOR, [3.1, 0, 4.4], { expr: f < 1770 ? "sheepish" : "joy", facing: -1, armR: AR.hipR, armL: AR.hipL } as FigOpts),
    cheer(CR1, [-4.0, 0, 4.9], 1790, 0), cheer(CR2, [-7.6, 0, 4.9], 1810, 1), cheer(CR3, [-11.2, 0, 4.9], 1818, 2), cheer(CR4, [-2.2, 0, 3.6], 1818, 3)],
    subj: null, focus: [-3, 0.6, 6], ctl: CTL15(f) };
};
lens(1752, DOF_WS);

// ================================================= S26 (1845-1965) dissolve "And that night, the foreman tucks his own battery into bed.":
// night, from the foot of the foreman's bunk (right next to the hero's): the foreman lugs his giant truck battery round to the
// head of his bunk, lays it on his pillow and pulls the blanket up to its terminals while the camera creeps in under the top
// bunk; on "bed" the bunk legs snap: CRASH, the battery and the bunk drop, the foreman's face.
const HL26: V3 = [97.1, 0.6, -0.05], FP26: V3[] = [[102.75, 0, -0.65], [102.2, 0, -2.0], [103.05, 0, -2.3]];
const FPILLOW: V3 = [103.05, 0.6, -1.55];
const c26a = cam3([103.0, 1.5, 1.95], [103.05, 0.85, -1.6], 50), c26b = cam3([103.05, 1.12, 0.3], [103.05, 0.78, -1.7], 42);
SHOT_CAMS[26] = () => [K(1845, glideTo(F(() => c26a, 1845, 0.0012), 1868, F(() => c26b, 1921, 0.0, [[1921, 0.01, 8]]), 1921), 1, true)];
SHOT_ACTS[26] = (f, s) => {
  const ctl = CTL15(f), w = walkS(26, s, FOR, FP26, f, 1846, 1884), P = w.p;
  const lay = sm(f, 1884, 1898), fc = w.moving ? w.facing : faceAt(26, s, f, P, [98.95, 1.0, 0.3]);
  const carry = carryBat(26, s, f, P, fc, w.moving ? w.d : [0, 1], 0.8, 1.28, 0.04, 0.2);
  const drop = 0.36 * sm(f, 1921, 1926), B0 = lerp3(carry.B, FPILLOW, lay), B: V3 = [B0[0], B0[1] - drop, B0[2]], fyaw = lerp(carry.yaw, 0, lay);
  const blanket = sm(f, 1900, 1916), crash = f >= 1921;
  const arms = lay <= 0 ? { armR: carry.armR, armL: carry.armL }
    : lay < 1 ? { armR: armTo(26, s, f, P, [B[0] + 0.14, B[1] + 0.2, B[2] - 0.12], 1, fc, 1, "stand", 10, 80), armL: armTo(26, s, f, P, [B[0] - 0.14, B[1] + 0.2, B[2] - 0.12], -1, fc, 1, "stand", 10, 80) }
    : f < 1918 ? { armR: armTo(26, s, f, P, [B[0] + 0.2, 0.74, -1.72 + 0.12 * blanket], 1, fc, 1, "stand", 10, 80), armL: armTo(26, s, f, P, [B[0] - 0.2, 0.74, -1.72 + 0.12 * blanket], -1, fc, 1, "stand", 10, 80) } : { armR: ARMS.wideR, armL: ARMS.wideL };
  const fo = crash ? { expr: "shock" as Face, tilt: -6, headBack: 0.3 } : { expr: (f < 1900 ? "strain" : "smile_closed") as Face, tilt: 10 * lay };
  void 0;
  return { cast: [C(FOR, P, { ...fo, facing: fc, ...w.o, ...arms, armRFront: true, armLFront: true } as FigOpts), C(HERO, HL26, { mode: "lie", legsUp: 0, facing: 1, expr: "sleep", phase: f / 40 } as FigOpts), ...bunkmates(26, s, f, 1923, false)],
    subj: FOR, focus: [B[0], 0.8, B[2]], ctl: { ...ctl, ...batCtl("fb", B, fyaw) } as Ctl, fx: crash ? fxs(dustCard("crash26", [103.05, 0.3, -0.9], 1.4, 1 - clamp01((f - 1921) / 30), 3)) : [],
    qa: { seats: SEAT_BUNKS } } as Act;
};
lens(1845, DOF_MS);
KICKS.push([1921 / 30, 0.08]);
