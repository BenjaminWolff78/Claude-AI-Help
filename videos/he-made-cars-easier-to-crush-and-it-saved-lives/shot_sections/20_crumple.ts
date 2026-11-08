// =====================================================================================================================
// "He Made Cars Easier to Crush, and It Saved Lives" - 9 scenes (shot ids), 21 camera shots. Master prompt v10.12:
// hands do the work (pressing, drawing, painting, pulling the lever, opening the door, catching, polishing), process
// verbs are done by the object with a visible cause (the nose folds against the wall); shot changes are cuts on a beat
// or quick 8-frame pushes, every shot 2 s or more; quoted lines use the 4-shape talk mouths (talk.json); close-ups and
// inserts blur the background, medium / wide shots stay deep-ish; the mechanism object is the STOPPING TIME clock.
// Arms are screen-space offsets (x + = screen right) in head-width %; `mx(arm, d)` mirrors an arm for d = -1.
import TALKJ from "./talk.json";
import type { Pen } from "./toon";
const TJ = TALKJ as unknown as { talk: Record<string, string>; stress: number[] };
const mx = (a: A2, d: number): A2 => [[a[0][0] * d, a[0][1]], [a[1][0] * d, a[1][1]]];
const lip = (f: number) => TJ.talk[String(f)] as MouthK | undefined;
const stressK = (f: number) => { let k = 0; for (const s of TJ.stress) k = Math.max(k, bump((f - s + 1) / 9)); return k; };
/** a speaking pose on a quoted line: talk mouth, 1-3 deg head bob, brows up on the stressed syllables */
const speak = (f: number, a: number, b: number, o: P): P => {
  if (f < a || f >= b) return o;
  const k = stressK(f), F0 = faceOf((o.expr as Face) ?? "neutral");
  const sign = (TJ.stress.findIndex((s) => s > f) % 2) ? 1 : -1;
  return { ...o, mouth: lip(f) ?? "tClosed", headTilt: ((o.headTilt as number) ?? 0) + 2.6 * k * sign, brow: [F0.brow[0] - 3.5 * k, F0.brow[1] - 3.5 * k] as [number, number] };
};
const lens3 = (pts: [number, number, number?][]) => { for (const [f, c, d] of pts) lens(f, c, d ?? 1); };
/** water splash: a crown of droplets + a sheet, age in frames (0..16) */
const splash = (key: string, pos: V3, age: number, s = 1): FxSpec[] => {
  if (age < 0 || age > 18) return [];
  const out: FxSpec[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3, sp = 0.05 + 0.045 * age, up = 0.09 * age - 0.006 * age * age;
    out.push({ kind: "card", key: "drop" + (i % 3), pos: [pos[0] + Math.cos(a) * sp * s, pos[1] + up * s * (0.6 + 0.4 * Math.sin(a + 1)), pos[2] + Math.sin(a) * sp * s * 0.5], w: 0.1 * s, h: 0.13 * s, cw: 48, ch: 64,
      draw: (p) => { const g = p.g; g.fillStyle = "#bfe8ff"; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); g.moveTo(24, 4); g.quadraticCurveTo(44, 38, 24, 58); g.quadraticCurveTo(4, 38, 24, 4); g.fill(); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(18, 36, 5, 0, 6.3); g.fill(); } });
  }
  if (age < 9) out.push({ kind: "card", key: "sheet" + Math.min(4, Math.floor(age / 2)), pos: [pos[0], pos[1] + 0.05, pos[2] + 0.05], w: (0.3 + 0.06 * age) * s, h: (0.24 + 0.04 * age) * s, soft: true, cw: 128, ch: 96,
    draw: (p) => { const g = p.g; g.globalAlpha = 1 - age / 9; g.fillStyle = "rgba(190,232,255,0.85)"; g.beginPath(); g.ellipse(64, 54, 58, 38, 0, 0, 6.3); g.fill(); g.globalAlpha = 1; } });
  return out;
};
/** a CLANG burst on metal: a white star + 4 spark lines, age 0..10 */
const clang = (key: string, pos: V3, age: number, s = 0.5): FxSpec | null => {
  if (age < 0 || age > 10) return null;
  const k = Math.sin((age / 10) * Math.PI);
  return { kind: "card", key: "clang" + key + Math.round(k * 5), pos, w: s * (0.6 + 0.6 * k), h: s * (0.6 + 0.6 * k), cw: 128, ch: 128,
    draw: (p) => { const g = p.g; g.strokeStyle = INKC; g.fillStyle = "#fff6c8"; g.lineWidth = 7; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 22 : 58; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); } };
};

/** keep a fitted camera inside the room: slide it toward its aim point until it is inside [x0,x1]x[z0,z1] (and below
 *  y1), widening the lens so the framing keeps its size (max 72 deg). `no` boxes [x0,x1,z0,z1] are solid blocks to keep out of. */
type Room = { x0: number; x1: number; z0: number; z1: number; y1?: number; no?: [number, number, number, number][] };
const inRoom = (c: { pos: V3; look: V3; fov: number }, r: Room): { pos: V3; look: V3; fov: number } => {
  const ok = (p: V3) => p[0] > r.x0 && p[0] < r.x1 && p[2] > r.z0 && p[2] < r.z1 && p[1] < (r.y1 ?? 99) && !(r.no ?? []).some(([a, b, c2, d]) => p[0] > a && p[0] < b && p[2] > c2 && p[2] < d);
  if (ok(c.pos)) return c;
  const D0 = Math.hypot(c.pos[0] - c.look[0], c.pos[1] - c.look[1], c.pos[2] - c.look[2]);
  let k = 1; for (let i = 0; i < 60 && !ok(lerp3(c.look, c.pos, k)); i++) k *= 0.96;
  const fov = Math.min(72, (360 / Math.PI) * Math.atan(Math.tan((c.fov * Math.PI) / 360) / Math.max(0.05, k)));
  return { pos: lerp3(c.look, c.pos, k), look: c.look, fov };
};
const HALL: Room = { x0: -6.7, x1: 6.7, z0: -5.8, z1: 7.7, y1: 6.5, no: [[-2.6, 2.6, -6.5, -4.55]] };
const SHOWIN: Room = { x0: -4.8, x1: 4.8, z0: -3.8, z1: 2.85, y1: 3.8 };
const STREETOUT: Room = { x0: -12, x1: 12, z0: 3.3, z1: 12.3 };
const OFFICE: Room = { x0: -5.9, x1: -1.4, z0: -2.85, z1: 2.85, y1: 3.1 }, FLOOR: Room = { x0: -1.0, x1: 9.8, z0: -4.8, z1: 5.8, y1: 6.2 };
const YARD: Room = { x0: -6.0, x1: 6.0, z0: -4.2, z1: 12 }, STREET9: Room = { x0: -15, x1: 15, z0: 0.3, z1: 10.2 };
// ================================================= SCENE 1 (0-108) HOOK, the crash hall ============================
// The Paper Car stands mid-hall (nose toward the wall). He leans both palms on its soft nose and it dents (first push
// 18-34), straightens, pats it, and on "crush" (89) leans his whole weight in: the dent goes deeper and the hood front
// sags; he grins up at us. A mechanic behind holds his wrench, aghast. One 3.6 s shot, a slow push.
/** sitting cards are scaled so the head stays under the roof (nothing passes through anything) */
const SITK = 0.78;   // seated cards: head top 1.13 m x 0.78 above the seat mark, under the roof (QA roof ray)
const PZ1 = 5.0, carZ = (pz: number) => -2.2 + pz;
SHOT_CAMS[1] = () => {
  const nose = carZ(PZ1) - 2.5, hood: V3 = [0, 0, nose + 0.4];
  const A = inRoom(fit([[hood, 0.35, 1.2, 0.95], body([0.85, 0, nose - 0.3], 0, 2.1, 0.5)], 168, 6, 44, 0.84, 0, -0.1), HALL);
  return [K(0, F(() => A, 0, 0.0016, [[84, 0.005, 12]]), 24, true)];
};
SHOT_ACTS[1] = (f) => {
  const nose = carZ(PZ1) - 2.5, ep: V3 = [0.85, 0, nose - 0.3];
  const push = (a: number): P => ({ expr: "strain", facing: -1, tilt: -16, armR: [[30, 30], [56, 64]] as A2, armRFront: true, armL: [[8, 32], [34, 66]] as A2, armLFront: true });
  return {
    ctl: { pz: PZ1, pdent: 0.55 * sm(f, 18, 32) + 0.45 * sm(f, 80, 92), flood: 1 },
    cast: [
      C("eng", ep, flow(f, [
        [0, { expr: "sly", facing: -1, tilt: -3, armR: [[24, 14], [40, 26]] as A2, armRFront: true }],
        [14, push(14), 6],
        [36, { expr: "grin", facing: 1, tilt: 2, armR: [[26, 14], [44, 22]] as A2, armRFront: true, headTilt: 4 }, 8],        // looks at us: grin
        [56, { expr: "smug", facing: -1, tilt: -2, armR: [[24, 10], [44, 18]] as A2, armRFront: true, headTilt: 3 }, 8],       // pats it
        [76, { ...push(76), tilt: -14, expr: "strain" }, 6],                                                                       // "crush": full weight
        [94, { expr: "grin", facing: 1, tilt: 3, armR: [[26, 18], [46, 30]] as A2, armRFront: true, armL: [[-26, 10], [-40, -6]] as A2, headTilt: 5 }, 8],
      ]), { idx: 1 }),
      C("mechA", [-1.4, 0, nose + 2.4], flow(f, [
        [0, { expr: "blank", facing: 1, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "wrench" }],
        [22, { expr: "aghast", facing: 1, tilt: 4, armR: [[24, 20], [16, 30]] as A2, armRFront: true, propR: "wrench", look: 0.8 }, 6],
        [84, { expr: "shock", facing: 1, tilt: -5, armR: [[24, 20], [16, 30]] as A2, armRFront: true, propR: "wrench", look: 0.8, armL: [[-24, -10], [-20, -40]] as A2 }, 6],
      ]), { idx: 2 }),
    ],
    fx: fxs(f >= 92 ? sparkle("h1", [0.5, 1.05, nose + 0.3], f - 92, 0.25) : null),
    focus: [ep[0], 1.5, ep[2]], subj: "eng",
  };
};
lens3([[0, DOF_MS]]);

// ================================================= SCENE 2 (108-382) 1955: SHOWROOM + STREET ========================
// 2a 108-196: the IRONCLAD on the turntable under BUILT LIKE A TANK!; the salesman slaps the hood, presents it; the
//             couple inside beam. 2b 196-258 insert: his wrench CLANGS on the fender twice ("Thick steel. Nothing
//             bends."), bounces off, not a mark. 2c 258-320 (ride the motion, outside): the couple drive it out of the
//             door, across the street, into the brick wall on "wall": bricks fly, the car rocks, not a scratch; the
//             salesman runs out after it. 2d 320-382: through the side window: the husband dizzy, nose squashed against
//             the windscreen, stars; the wife dazed.
const TT: V3 = [1.5, 0, -1.2];
const driveK = (f: number) => { const u = clamp01((f - 250) / 33); return u * u * (1.6 - 0.6 * u); };   // accelerates, hits at 283
SHOT_CAMS[2] = (s) => {
  const car = TT, sal = MK(s, "salesman");
  const A = { pos: [-0.6, 1.75, 2.85] as V3, look: [1.2, 1.7, -2.8] as V3, fov: 62 };   // the hanging BUILT LIKE A TANK! banner whole, the salesman left, the car right
  const B = inRoom(fit([[[car[0] - 0.8, 0, car[2] + 1.7], 0.5, 1.4, 0.5]], 40, 14, 38, 0.9, 0.05, 0), SHOWIN);
  const Ct = { pos: [-5.6, 1.55, 6.6] as V3, look: [1.2, 0.9, 9.6] as V3, fov: 50 };   // across the street from the left: the car crosses the frame and hits the wall
  const Dd = inRoom(fit([[[1.5, 0.53, MK(s, "crashCar")[2] - 0.03], 0.3, 1.0, 0.75]], 78, 2, 40, 0.9), STREETOUT);
  const S1 = F(() => A, 108, 0.0008), S2 = F(() => B, 196, 0.0022, [[214, 0.006, 8], [236, 0.006, 8]]), S3 = F(() => Ct, 258, 0.001), S4 = F(() => Dd, 320, 0.0024);
  return [K(108, S1, 24, true), K(196, S2, 24, true), K(258, S3, 24, true), K(320, S4, 24, true)];
};
SHOT_ACTS[2] = (f, s) => {
  const sal = MK(s, "salesman"), dk = driveK(f), carZn = TT[2] + (MK(s, "crashCar")[2] - TT[2]) * dk;
  const hitAge = f - 283, inCar = (dx: number): V3 => [TT[0] + dx, 0.53, carZn - 0.03];   // tank: window 1.04-1.49, roof 1.545
  const out = walkPath(2, s, [sal, add3(sal, 0.6, 0, 3.2), add3(sal, 0.9, 0, 6.6)], f, 286, 318);
  const knock = (n: number): P => ({ expr: "proud", facing: 1, tilt: -3, armR: [[26, -10], [46, -34]] as A2, armRFront: true, propR: "wrench", propRAng: -0.6, headTilt: 3 });
  const strike = (n: number): P => ({ expr: "grin", facing: 1, tilt: 6, armR: [[30, 16], [58, 30]] as A2, armRFront: true, propR: "wrench", propRAng: 0.5 });
  const dizzyHead = hitAge >= 0;
  return {
    ctl: { drive: dk, hit: Math.max(0, hitAge) / 30, tshake: hitAge >= 0 && hitAge < 18 ? 1 - hitAge / 18 : 0 },
    cast: [
      C("cSalesA", f >= 286 ? out.p : sal, f > 286 && f < 318 ? pose(null, { expr: "proud", mode: "walk", phase: out.phase, facing: out.facing, armR: [[26, 10], [40, 0]] as A2, armRFront: true, propR: "wrench" }) : flow(f, [
        [108, { expr: "proud", facing: 1, tilt: -2, armR: [[26, 20], [40, 34]] as A2, armRFront: true, propR: "wrench", armL: [[-24, 14], [-10, 26]] as A2 }],
        [130, { expr: "beam", facing: 1, tilt: 4, armR: [[26, 20], [40, 34]] as A2, armRFront: true, propR: "wrench", armL: [[-30, -10], [-58, -38]] as A2, look: -0.6 }, 10],   // presents the banner
        [166, { expr: "grin", facing: 1, tilt: 5, armR: [[28, 14], [54, 26]] as A2, armRFront: true, propR: "wrench", armL: [[-24, 14], [-10, 26]] as A2 }, 10],          // slaps the hood
        [204, knock(204), 6], [212, strike(212), 3], [226, knock(226), 6], [234, strike(234), 3],
        [246, { expr: "proud", facing: 1, tilt: -3, armR: [[26, 18], [36, 30]] as A2, armRFront: true, propR: "wrench", propRAng: 0.25 * Math.sin((f - 246) * 0.9) * Math.max(0, 1 - (f - 246) / 20), shake: Math.max(0, 1 - (f - 236) / 14), phase: f / 3 }, 4],
        [318, { expr: "shock", facing: 1, tilt: -4, armR: [[26, -6], [36, -36]] as A2, armRFront: true, propR: "wrench" }, 6],
      ]), { idx: 1 }),
      C("buyerM", inCar(0.42), flow(f, [
        [108, { expr: "beam", facing: 0, mode: "sit", armR: [[24, 10], [20, -6]] as A2 }],
        [150, { expr: "proud", facing: 0, mode: "sit", headTilt: 4 }, 8],
        [244, { expr: "determined", facing: 0, mode: "sit", armR: [[22, 14], [14, 0]] as A2, armL: [[-22, 14], [-14, 0]] as A2 }, 8],    // hands on the wheel
        [282, { expr: "dizzy", facing: 0, mode: "sit", tilt: 14, headTilt: -10, squash: 0.6, armR: [[26, 20], [36, 34]] as A2, armL: [[-26, 20], [-36, 34]] as A2 }, 3],     // slams forward
        [300, { expr: "dizzy", facing: 0, mode: "sit", tilt: 8, headTilt: 8 * Math.sin(f * 0.25), squash: 0.3 }, 10],
      ]), { idx: 2, scale: SITK }),
      C("buyerF", inCar(-0.42), flow(f, [
        [108, { expr: "beam", facing: 0, mode: "sit" }],
        [170, { expr: "joy", facing: 0, mode: "sit", headTilt: -3 }, 8],
        [282, { expr: "shock", facing: 0, mode: "sit", tilt: 10 }, 3],
        [300, { expr: "dazed", facing: 0, mode: "sit", tilt: 6, headTilt: -6 * Math.sin(f * 0.2) }, 10],
      ]), { idx: 3, scale: SITK }),
      C("cSalesB", MK(s, "salesman2"), pose(null, { expr: f < 250 ? "smile" : "shock", facing: 1, mode: "stand", armR: [[24, -6], [12, -40]] as A2, armRFront: true, propR: "keys", mouth: f % 40 < 20 && f < 250 ? "o" : undefined }), { idx: 4 }),
      ...(f >= 258 ? [C("passer", [-3.6, 0, 12.0], flow(f, [[258, { expr: "neutral", facing: 1, mode: "walk", phase: ph(f, 14) }], [284, { expr: "shock", facing: 1, tilt: -6, armL: [[-24, -10], [-20, -40]] as A2 }, 4]]), { idx: 5 })] : []),
    ],
    fx: fxs(
      clang("w1", [TT[0] - 0.55, 1.0, TT[2] + 1.65], f - 214, 0.4), clang("w2", [TT[0] - 0.45, 1.0, TT[2] + 1.75], f - 236, 0.4),
      hitAge >= 0 && hitAge < 30 ? dustCard("wd", [TT[0], 0.8 + hitAge * 0.02, 12.2], 1.6 + hitAge * 0.04, 0.9 * (1 - hitAge / 30), 2) : null,
      hitAge >= 18 && hitAge < 40 ? sparkle("fine", [TT[0] + 0.6, 1.2, MK(s, "crashCar")[2] + 1.6], hitAge - 18, 0.35) : null,
      dizzyHead && f >= 300 ? dizzy([TT[0] + 0.42, 1.32, carZn], f, 0.26) : [],
    ),
    focus: f < 196 ? [TT[0], 1.1, TT[2] + 0.6] : f < 258 ? [TT[0] - 0.8, 1.0, TT[2] + 1.7] : f < 320 ? [TT[0], 0.9, carZn + 1.0] : [TT[0] + 0.42, 1.5, carZn],
    subj: f < 258 ? "cSalesA" : f < 320 ? null : "buyerM",
  };
};
lens3([[108, DOF_FS], [196, DOF_INSERT], [258, DOF_WS], [320, DOF_CU]]);

// ================================================= SCENE 3 (382-667) THE WORKS ======================================
// 3a 382-504: over his shoulder at the drafting board: the pencil draws the car outline, the SOFT nose pleats, the SOFT
//             tail, then he swaps to a yellow pencil and boxes in the STEEL CAGE. The boss walks in behind (492).
// 3b 504-572: the boss leans over the board: "You want our cars to fold?" (MCU, talk mouths), folding his hands like a
//             closing book on "fold"; the engineer nods, pencil in hand.
// 3c 572-667 (quick push through the glass): the factory floor: the salesmen laugh by the prototype; a mechanic
//             brushes PAPER CAR onto its door in red; a welder sparks at the back.
SHOT_CAMS[3] = (s) => {
  const bd = MK(s, "board"), eng: V3 = [-3.0, 0, -0.3], boss: V3 = [-2.55, 0, 0.7];
  const A = inRoom(fit([[[bd[0], 0, bd[2]], 0.75, 1.85, 0.72], body(eng, 0.6, 2.05, 0.36)], 62, 10, 42, 0.86, -0.22), OFFICE);
  const B = inRoom(fit([body(boss, 1.0, 2.15, 0.34), body(eng, 1.1, 2.1, 0.3)], 52, 3, 38, 0.9, -0.12, -0.08), OFFICE);
  const car = MK(s, "car");
  const Cc = { pos: [0.2, 1.75, 4.0] as V3, look: [2.0, 1.0, -0.2] as V3, fov: 66 };   // salesmen left, the painter at the door's front end, PAPER CAR clear on the door (right of him)
  const S1 = F(() => A, 382, 0.0014), S2 = F(() => B, 504, 0.0018), S3 = F(() => Cc, 580, 0.0004);
  return [K(382, S1, 24, true), K(504, S2, 24, true), K(572, glideTo(S2, 572, S3, 580), 1)];
};
// the painter (scene 3c): a kneeling sign-writer whose red brush tip rides the reveal edge of the door lettering.
// He stands 0.6 m nearer the lens than before (so the door can never hide his brush: card depth 3.96 m, the door at the
// last letter 4.14 m) and is drawn at 0.85 scale so he reads the same size as before. Hand path solved with tools/proj.py
// against the letter panel (world x 2.425, y 0.61, z -0.155..0.595): hand u from the shoulder, lean 0 -> 18 deg.
const PKK = 0.5, PSC = 0.85;
const PNT = (s: SetDef): V3 => add3(MK(s, "painter"), -0.34, 0, 0.64);
const paintP = (f: number): P => {
  const pk = sm(f, 606, 656), wig = Math.sin(f * 0.9);
  const hx = 4 + 38 * pk + 14 * pk * pk, hy = 5 + 3 * pk + 2 * wig;
  return { mode: "kneel", kneelK: PKK, expr: "grin", facing: 1, tilt: 18 * pk, armR: [[12 + 0.5 * hx, 20 - 0.2 * hx], [hx, hy]] as A2, armRFront: true, propR: "signBrushRed", propRAng: 1.75 - 0.25 * pk + 0.05 * wig, armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" } as P;
};
const drawK = (f: number) => f < 382 ? 0 : f < 420 ? 0.34 * lin(f, 382, 420) : f < 436 ? 0.36 + 0.14 * lin(f, 420, 436) : f < 458 ? 0.5 + 0.12 * lin(f, 440, 458) : f < 466 ? 0.62 + 0.08 * lin(f, 458, 466) : Math.min(1, 0.7 + 0.3 * lin(f, 466, 500));
SHOT_ACTS[3] = (f, s) => {
  const eng: V3 = [-3.0, 0, -0.3], bossP: V3 = [-2.55, 0, 0.7];
  const bossW = walkPath(3, s, [MK(s, "officeDoor"), add3(MK(s, "officeDoor"), -0.4, 0, -0.9), bossP], f, 470, 504);
  const scribble = Math.sin(f * 0.9) * 6, sweep = 18 * Math.sin(f * 0.11);
  const drawP = (penCol: string): P => ({ expr: "determined", facing: -1, tilt: -6, armR: mx([[30, -4], [52 + sweep * 0.3, -14 + scribble]], -1), armRFront: true, propR: "pen", propRAng: 0.2, armL: [[-20, 20], [-32, 8]] as A2 });
  const car = MK(s, "car"), sp = Math.sin(f * 0.6);
  return {
    ctl: { draw: drawK(f), paint: sm(f, 606, 656), weld: 1 },
    cast: [
      C("eng", eng, flow(f, [
        [382, drawP("grey")],
        [462, { expr: "eureka", facing: -1, tilt: -2, armR: mx([[28, -10], [44, -30]], -1), armRFront: true, propR: "pen", headTilt: 4 }, 6],      // the yellow pencil
        [468, drawP("yellow")],
        [504, { expr: "proud", facing: 1, tilt: 2, armR: [[24, 20], [30, 6]] as A2, armRFront: true, propR: "pen", headTilt: 3, look: 0.6 }, 8],     // turns to the boss
        [556, { expr: "smug", facing: 1, tilt: 3, armR: [[24, 20], [30, 6]] as A2, armRFront: true, propR: "pen", headTilt: -4, look: 0.6 }, 6],    // nods: yes.
      ]), { idx: 1 }),
      C("cBoss", f < 504 ? bossW.p : bossP, f > 470 && f < 504 ? pose(null, { expr: "stern", mode: "walk", phase: bossW.phase, facing: bossW.facing, armR: [[24, 26], [12, 40]] as A2, propR: "stopwatch" }) : pose(null, speak(f, 527, 570, flow(f, [
        [504, { expr: "stern", facing: -1, tilt: 5, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "stopwatch", look: -0.6 }],
        [530, { expr: "smug", facing: -1, tilt: 6, armR: [[26, 6], [40, -10]] as A2, armRFront: true, armL: [[-26, 6], [-40, -10]] as A2, look: -0.6 }, 8],        // hands open
        [552, { expr: "laugh", facing: -1, tilt: 4, armR: [[22, 8], [10, -6]] as A2, armRFront: true, armL: [[-22, 8], [-10, -6]] as A2, look: -0.6 }, 4],       // "fold?" hands clap shut like a book
      ]) as P)), { idx: 2 }),
      // the factory floor: the salesmen laugh (on threes), the painter brushes the letters, the welder sparks
      C("cSalesA", MK(s, "sales1"), pose(null, f >= 572 ? { ...laughP(f, 572, 0), facing: 1, armR: [[24, 20], [16, -6]] as A2, armRFront: true, propR: "clipboard" } : { expr: "smile", facing: 1 }), { idx: 3 }),
      C("cSalesB", MK(s, "sales2"), pose(null, f >= 578 ? { ...laughP(f, 578, 1), facing: 1, armL: [[-26, 10], [-50, -6]] as A2 } : { expr: "smile", facing: 1 }), { idx: 4 }),
      // the painter kneels at the door and the red brush tip rides the reveal edge of the letters (pk = the same
      // progress the door texture uses), leaning in as the word runs away from him: the hand does the painting
      C("mechB", PNT(s), flow(f, [
        [572, { expr: "sly", facing: 1, tilt: -3, armR: [[28, -6], [50, -10]] as A2, armRFront: true, propR: "signBrushRed", armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }],
        [588, { mode: "kneel", kneelK: 0, expr: "sly", facing: 1, tilt: -3, armR: [[28, -6], [50, -10]] as A2, armRFront: true, propR: "signBrushRed", armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }],
        [590, { ...paintP(590), expr: "determined" }, 12],
        [606, paintP(f), 4],
        [656, { mode: "kneel", kneelK: PKK, expr: "laugh", facing: -1, tilt: 3, armR: [[26, 10], [40, -4]] as A2, armRFront: true, propR: "signBrushRed", armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }, 8],
      ]), { idx: 5, scale: PSC }),
      C("mechA", MK(s, "welder"), pose(null, { expr: "determined", facing: 1, tilt: 4 + 2 * Math.sin(st(f) * 0.5), armR: [[26, 10], [44, 14 + 6 * Math.sin(st(f))]] as A2, armRFront: true, propR: "wrench" } as P), { idx: 6 }),
    ],
    fx: fxs(f >= 572 ? [0, 1, 2].map((i) => sparkle("wl" + i, [7.95 + 0.1 * i, 1.0 + 0.15 * Math.sin(f + i), -3.05], (f + i * 5) % 14, 0.2, "#cfeeff")) : []),
    focus: f < 504 ? [-3.4, 1.4, -1.0] : f < 572 ? [bossP[0], 1.75, bossP[2]] : [2.45, 0.8, 0.2],
    subj: f < 504 ? "eng" : f < 572 ? "cBoss" : "mechB",
  };
};
lens3([[382, DOF_MS], [504, DOF_CU], [572, DOF_FS, 8]]);

// ================================================= SCENE 4 (667-728) NIGHT, alone with the prototype =================
// The floor is dark blue; one work lamp over the car. He polishes the yellow cage pillar with a rag (two strokes), stops,
// lays his palm on the roof and looks at it: "So why build a car that crumples?"
SHOT_CAMS[4] = (s) => {
  const e = MK(s, "nightEng"), car = MK(s, "car");
  const A = inRoom(fit([body(e, 0.4, 2.1, 0.32), [[car[0] - 0.6, 0, car[2] - 0.2], 0.6, 1.6, 0.6]], -40, 6, 40, 0.88, 0, -0.05), FLOOR);
  return [K(667, F(() => A, 667, 0.0016), 24, true)];
};
SHOT_ACTS[4] = (f, s) => {
  const e = MK(s, "nightEng"), u = Math.sin((f - 667) * 0.35);
  return {
    ctl: { night: 1, paint: 1, draw: 1, weld: 0 },
    cast: [C("eng", e, flow(f, [
      [667, { expr: "calm", facing: 1, tilt: -4, armR: [[28, -10], [46 + 8 * u, -26 - 6 * u]] as A2, armRFront: true, propR: "rag" }],
      [698, { expr: "neutral", facing: 1, tilt: -2, armR: [[26, -4], [44, -10]] as A2, armRFront: true, headTilt: 5, look: 0.4 }, 10],   // palm on the roof
      [712, { expr: "sly", facing: 1, tilt: -2, armR: [[26, -4], [44, -10]] as A2, armRFront: true, headTilt: 7, look: 0.4 }, 8],
    ]), { idx: 1 })],
    focus: [e[0], 1.6, e[2]], subj: "eng",
  };
};
lens3([[667, DOF_MS]]);

// ================================================= SCENE 5 (728-1030) CRASH TEST No.1, 1959 =========================
// 5a 728-830 wide: the mechanic hauls the lever (734), the Paper Car rolls down the rail and hits the wall on "wall"
//    (811): the nose folds up like a can over 811-842 (the car keeps moving 1 m while it folds), steam.
// 5b 811-954 (v10.12: every shot >= 2 s): cut on "wall." to the nose insert as it hits and folds (811-880, 2.3 s), then a
//    10-frame quick move leading into "Everybody" (884) to the gallery laughing (890-954, 2.1 s): the boss slaps his knee, the salesmen
//    double over; the engineer walks off calmly.
// 5c 954-1030: cut on "door": he is at the driver's door and pulls it open (954-962): the dummy is just sitting there,
//    upright, blank, fine; the laughter stops behind (the gallery's faces drop) on "Fine" (1026).
const ENG5: V3 = [-1.5, 0, -2.4], ENG7: V3 = [-1.35, 0, -2.25], BOSS7: V3 = [-2.5, 0, -1.9];   // clear of the door's swing (rear edge ends at x -1.8, z -3.7)
const pz5 = (f: number) => f < 736 ? 4.6 : f < 811 ? 4.6 * (1 - Math.pow(clamp01((f - 736) / 75), 1.7)) : -1.0 * sm(f, 811, 842);
const crush5 = (f: number) => sm(f, 811, 842);
SHOT_CAMS[5] = (s) => {
  const g = MK(s, "gallery3");
  const A = { pos: [-2.4, 2.6, 7.4] as V3, look: [0.2, 1.2, -2.6] as V3, fov: 56 };   // from the back: the lever man, the rail, the car, the wall + CRASH TEST No.1 - 1959
  const nz = -4.7 + 0.2;
  const B = { pos: [3.5, 1.45, -2.0] as V3, look: [0.1, 0.8, -4.2] as V3, fov: 46 };   // the folded nose against the wall, from the side
  const Bg = { pos: [0.0, 1.6, 5.4] as V3, look: [-3.0, 1.4, 2.4] as V3, fov: 52 };
  const doorC: V3 = [-0.95, 0, -3.15];
  const Cc = inRoom(fit([[[-0.42, 0, -3.17], 0.6, 1.8, 0.55], body(ENG5, 0.6, 2.05, 0.3)], -96, 4, 44, 0.8), HALL);
  const S1 = F(() => A, 728, 0.0012), S2 = F(() => B, 811, 0.0016), S2b = F(() => Bg, 890, 0.0016), S3 = F(() => Cc, 925, 0.0014, [[1000, 0.003, 14]]);
  return [K(728, S1, 24, true), K(811, S2, 24, true), K(880, glideTo(S2, 880, S2b, 890), 1), K(954, S3, 24, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const engPath = walkPath(5, s, [MK(s, "gallery3"), [-2.65, 0, -1.4], ENG5], f, 882, 944);   // round the lever post; he walks off calmly as they laugh
  const laugh = f >= 881 && f < 1018;
  const g = (k: string, i: number, d: number, prop?: string): CastPlace => C(k, MK(s, ["gallery1", "gallery2", "gallery3", "gallery4"][i]), laugh ? pose(null, { ...laughP(f, 881, i), facing: d, ...(prop ? { armR: [[24, 20], [16, -6]] as A2, armRFront: true, propR: prop } : {}) })
    : f >= 1018 ? flow(f, [[1018, { expr: "blank", facing: d, ...(prop ? { armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: prop } : {}) }], [1022, { expr: "gulp", facing: d, tilt: 3 }, 6]])
    : pose(null, { expr: f < 811 ? "smug" : "grin", facing: d, look: 0.6, ...(prop ? { armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: prop } : {}) }), { idx: 10 + i });
  const doorK = sm(f, 954, 962);
  return {
    ctl: { pz: pz5(f), pcrush: crush5(f), psteam: sm(f, 820, 850), pshake: f >= 811 && f < 830 ? 1 - (f - 811) / 19 : 0, pdoor: doorK, lever: sm(f, 732, 740), hand: 0, flood: 1 },
    cast: [
      C("mechA", MK(s, "lever"), flow(f, [
        [728, { expr: "determined", facing: -1, tilt: -4, armR: [[-6, -26], [-20, -56]] as A2, armRFront: true }],
        [732, { expr: "strain", facing: -1, tilt: 10, armR: [[-14, -6], [-30, -10]] as A2, armRFront: true }, 6],     // hauls it down
        [760, { expr: "grin", facing: -1, tilt: 2, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "wrench" }, 10],
      ]), { idx: 1 }),
      C("eng", f < 882 ? MK(s, "gallery3") : engPath.p, f > 882 && f < 944 ? pose(null, { expr: "calm", mode: "walk", phase: engPath.phase, facing: engPath.facing }) : flow(f, [
        [728, { expr: "calm", facing: -1, armR: [[22, 16], [-8, 20]] as A2, armRFront: true, armL: [[-22, 16], [8, 22]] as A2, armLFront: true }],       // arms crossed
        [944, { expr: "calm", facing: 1, tilt: 2, armR: [[24, 20], [16, 6]] as A2, armRFront: true }, 6],                                                  // arrives at the door
        [950, { expr: "calm", facing: 1, tilt: 4, armR: [[26, 6], [46, 8]] as A2, armRFront: true }, 3],                                                  // reaches the handle
        [954, { expr: "calm", facing: 1, tilt: -6, armR: [[24, 10], [36, 20]] as A2, armRFront: true }, 8],                                                // pulls it open on "door"
        [966, { expr: "sly", facing: -1, tilt: 2, armR: [[26, 10], [44, -2]] as A2, armRFront: true, headTilt: 4 }, 10],                                     // presents the dummy
        [1020, { expr: "smug", facing: -1, tilt: 2, armR: [[26, 10], [44, -2]] as A2, armRFront: true, headTilt: 6 }, 8],
      ]), { idx: 2 }),
      g("cBoss", 0, 1, "stopwatch"), g("cSalesA", 1, 1, "clipboard"), C("cSalesB", MK(s, "gallery4"), laugh ? pose(null, { ...laughP(f, 885, 2), facing: -1 }) : pose(null, { expr: f >= 1018 ? "gulp" : "smug", facing: -1 }), { idx: 13 }),
      C("mechC", [-4.4, 0, 3.8], pose(null, { expr: laugh ? "laugh" : "neutral", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera", shake: laugh ? 0.6 : 0, phase: f / 12 }), { idx: 14 }),
      C("dummy", [-0.42, 0.49, carZ(pz5(f)) + 0.03], pose(null, { expr: "blank", mode: "sit", facing: f >= 962 ? -1 : 0, tilt: f >= 811 && f < 826 ? 10 * (1 - (f - 811) / 15) : 0 }), { idx: 20, scale: SITK }),
    ],
    fx: fxs(f >= 811 && f < 840 ? dustCard("cr", [0, 0.9, -4.5], 1.4, 0.8 * (1 - (f - 811) / 29), 3) : null, f >= 1026 ? sparkle("fine", [-0.42, 1.32, carZ(-1) + 0.1], f - 1026, 0.3) : null),
    focus: f < 811 ? [0, 0.9, carZ(pz5(f)) - 1.6] : f < 880 ? [0, 0.9, -4.3] : f < 954 ? MK(s, "gallery2") as V3 : f < 966 ? [-1.6, 1.5, -2.8] : [-0.42, 1.4, carZ(-1)],
    subj: f < 880 ? null : f < 954 ? "cBoss" : f < 966 ? "eng" : "dummy",
  };
};
lens3([[728, DOF_WS], [811, DOF_INSERT], [880, DOF_FS, 10], [954, DOF_MS]]);

// ================================================= SCENE 6 (1030-1282) THE DEMO: water balloons =====================
// 6a 1030-1110: YOU (green hoodie) hold your hands out stiff; the friend lobs a balloon (release 1062); it hits your stiff
//    hands on "bursts" (1094-1096): splash, you're soaked, cap knocked crooked, a puddle. 6b 1110-1185: second balloon
//    (release 1118); you pull your hands back as it lands (1140-1160), knees bend: it survives on "survives" (1162).
// 6c 1185-1282: MCU: you hold it up, wobbling; the friend shrugs ("Same balloon. Same speed."); you toss it up gently and
//    catch it soft again on "more time to stop" (1247-1265), grinning.
SHOT_CAMS[6] = (s) => {
  const y = MK(s, "you"), fr = MK(s, "friend");
  const A = { pos: [-1.7, 1.4, 4.5] as V3, look: [-0.2, 1.1, 0.6] as V3, fov: 54 };
  const B = { pos: [-2.6, 1.3, 3.6] as V3, look: [0.9, 1.2, -0.4] as V3, fov: 54 };   // over YOUR shoulder toward the friend
  const Cc = inRoom(fit([body(y, 0.9, 2.15, 0.42)], 18, 3, 38, 0.92, 0, -0.08), YARD);
  return [K(1030, F(() => A, 1030, 0.0014), 24, true), K(1110, F(() => B, 1110, 0.0016), 24, true), K(1185, F(() => Cc, 1185, 0.002), 24, true)];
};
SHOT_ACTS[6] = (f, s) => {
  const y = MK(s, "you"), fr = MK(s, "friend"), hands = MK(s, "youHands");
  const k1 = f < 1062 ? -1 : clamp01((f - 1062) / 32), k2 = f < 1120 ? -1 : f < 1142 ? (f - 1120) / 22 : 1.01;
  const pop = sm(f, 1094, 1099), soaked = f >= 1095;
  const stiff: P = { expr: "determined", facing: 1, tilt: 0, armR: [[30, 0], [58, 0]] as A2, armRFront: true, armL: [[22, 4], [46, 4]] as A2, armLFront: true };
  const soft = (k: number): P => ({ expr: "determined", facing: 1, tilt: -4 * k, mode: "brace", braceK: k, armR: [[28, 6 + 18 * k], [54 - 28 * k, 4 + 38 * k]] as A2, armRFront: true, armL: [[20, 8 + 18 * k], [44 - 24 * k, 8 + 38 * k]] as A2, armLFront: true, ...(f >= 1142 ? { propR: "balloon", propK: 0.5 * Math.sin((f - 1142) * 0.6) * Math.max(0, 1 - (f - 1142) / 40) } : {}) });
  const throwP = (rel: number): Beat[] => [[rel - 14, { expr: "grin", facing: -1, tilt: 6, armR: [[24, -10], [10, -46]] as A2, armRFront: true, propR: "balloon" }, 8], [rel, { expr: "sly", facing: -1, tilt: -6, armR: [[-28, -4], [-56, 6]] as A2, armRFront: true }, 3], [rel + 12, { expr: "grin", facing: -1, tilt: 0, armR: [[24, 26], [12, 40]] as A2 }, 10]];
  const tossK = f >= 1240 && f < 1266 ? Math.sin(((f - 1240) / 26) * Math.PI) : 0;
  return {
    ctl: { b1: k1, b1pop: pop, b2: k2, wet: soaked ? 1 : 0 },
    cast: [
      C("you", y, f < 1110 ? flow(f, [
        [1030, { expr: "smile", facing: 1, armR: [[24, 20], [16, 6]] as A2, armRFront: true, headTilt: 3 }],
        [1046, stiff, 8],
        [1095, { expr: "dismay", facing: 1, tilt: -8, armR: [[30, -4], [56, -14]] as A2, armRFront: true, armL: [[22, 0], [46, -10]] as A2, armLFront: true, hatTilt: -12, wet: 1 } as P, 3],
        [1102, { expr: "sheepish", facing: 1, tilt: -4, armR: [[26, 20], [30, 36]] as A2, armL: [[-26, 20], [-30, 36]] as A2, hatTilt: -12, wet: 1 } as P, 8],
      ]) : f < 1185 ? flow(f, [
        [1110, { ...soft(0), wet: 1, hatTilt: -12 } as P],
        [1140, { ...soft(1), wet: 1, hatTilt: -12 } as P, 18],
        [1162, { expr: "beam", mode: "brace", braceK: 0, facing: 1, tilt: 2, armR: [[26, 22], [24, 40]] as A2, armRFront: true, propR: "balloon", propK: 0.2 * Math.sin(f * 0.5), wet: 1, hatTilt: -12 } as P, 8],
      ]) : pose(null, { expr: f < 1240 ? "beam" : f < 1266 ? "calm" : "grin", facing: 1, tilt: 2, armR: [[24, 10 - 20 * tossK], [22, -8 - 40 * tossK]] as A2, armRFront: true, propR: "balloon", propK: 0.25 * Math.sin(f * 0.45) - 0.3 * (f >= 1262 && f < 1272 ? 1 : 0), wet: 1, hatTilt: -12, headTilt: 3 * Math.sin(f * 0.05) } as P), { idx: 1 }),
      C("friend", fr, f < 1185 ? flow(f, [
        [1030, { expr: "sly", facing: -1, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "balloon" }],
        ...throwP(1062),
        [1096, laughP(f, 1096, 1) as P, 6],
        [1110, { expr: "grin", facing: -1, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "balloon" }, 6],
        ...throwP(1118),
        [1162, { expr: "shock", facing: -1, tilt: -4, armL: [[-24, -10], [-20, -40]] as A2 }, 6],
      ]) : flow(f, [[1185, { expr: "neutral", facing: -1, armR: AR.shrugR, armL: AR.shrugL, tilt: 2 }], [1206, { expr: "sly", facing: -1, armR: AR.shrugR, armL: AR.shrugL, tilt: -2, headTilt: 5 }, 8]]), { idx: 2 }),
    ],
    fx: fxs(f >= 1094 ? splash("s1", hands, f - 1094, 1.4) : [], f >= 1162 ? sparkle("ok", add3(hands, 0.05, 0.3, 0), f - 1162, 0.25) : null),
    focus: f < 1185 ? [(y[0] + fr[0]) / 2, 1.4, (y[2] + fr[2]) / 2] : [y[0], 1.6, y[2]],
    subj: "you",
  };
};
lens3([[1030, DOF_FS], [1185, DOF_CU]]);

// ================================================= SCENE 7 (1282-1527) THE TRICK, night blue ========================
// 7a 1282-1370: beside the folded nose he cups his hands like a catch and pulls them back on "pulling back" (1350).
// 7b 1370-1450: the STOPPING TIME clock: he flicks the hand to a blink of a stop (red OUCH) on "sudden stop" (1397), then
//    walks it slowly round into SAFE on "slow squeeze" (1419-1440) with a long pointer.
// 7c 1450-1527: at the open door he pushes the dummy's chest with one finger on "pushed" (1483): it rocks back softly;
//    the boss punches his own palm on "punched" (1511) and winces.
SHOT_CAMS[7] = (s) => {
  const nz = -4.7;
  const A = { pos: [3.6, 1.5, -0.8] as V3, look: [0.2, 0.55, -3.9] as V3, fov: 58 };   // the dummy in its seat left, him centre, the folded nose right (clear of him)   // him right, the folded nose centre, the dummy in its seat left
  const clk = MK(s, "clock");
  const B = inRoom(fit([[[clk[0], 0, clk[2]], clk[1] - 1.45, clk[1] + 1.0, 1.0], body(MK(s, "clockFoot"), 1.0, 2.1, 0.3)], -20, -6, 40, 0.9, 0, 0), HALL);
  const Cc = { pos: [-6.2, 1.75, -3.3] as V3, look: [-1.2, 1.2, -2.4] as V3, fov: 60 };
  return [K(1282, F(() => A, 1282, 0.0008), 24, true), K(1370, F(() => B, 1370, 0.0014), 24, true), K(1450, F(() => Cc, 1450, 0.0006), 24, true)];
};
SHOT_ACTS[7] = (f, s) => {
  const hd = f < 1392 ? 0 : f < 1400 ? 0.05 * sm(f, 1392, 1398) : f < 1414 ? 0.05 * (1 - sm(f, 1404, 1412)) : 0.82 * sm(f, 1416, 1446);
  const catchK = sm(f, 1343, 1360);
  return {
    ctl: { pz: -1.0, pcrush: 1, pdoor: 1, psteam: 0.3, dusk: 1, flood: 0.35, hand: hd, lever: 1 },
    cast: [
      C("eng", f < 1370 ? [1.35, 0, -2.75] : f < 1450 ? MK(s, "clockFoot") : ENG7, f < 1370 ? flow(f, [
        [1282, { expr: "sly", facing: 1, tilt: 2, armR: [[24, 20], [16, 6]] as A2, armRFront: true, look: 0.6 }],
        [1300, { expr: "determined", facing: 1, tilt: -6, armR: [[30, -4], [56, -6]] as A2, armRFront: true, armL: [[22, 0], [48, -2]] as A2, armLFront: true }, 10],    // hands out
        [1343, { expr: "calm", facing: 1, tilt: 6 * catchK, armR: [[26, 10], [24, 18]] as A2, armRFront: true, armL: [[18, 10], [16, 18]] as A2, armLFront: true }, 16],   // pulls them back
        [1360, { expr: "smug", facing: -1, tilt: 3, armR: [[26, 10], [24, 18]] as A2, armRFront: true, armL: [[18, 10], [16, 18]] as A2, armLFront: true, headTilt: 4 }, 8],
      ]) : f < 1450 ? flow(f, [
        [1370, { expr: "determined", facing: 1, tilt: -4, armR: [[24, -20], [30, -50]] as A2, armRFront: true, propR: "ruler", propK: 0.4, look: 0.8 }],
        [1392, { expr: "yikes", facing: 1, tilt: 4, armR: [[24, -22], [34, -54]] as A2, armRFront: true, propR: "ruler", propK: 0.42, look: 0.8 }, 4],
        [1416, { expr: "calm", facing: 1, tilt: -2, armR: [[26, -30], [40, -58]] as A2, armRFront: true, propR: "ruler", propK: 0.45, look: 0.8 }, 20],
        [1440, { expr: "smug", facing: -1, tilt: 2, armR: [[26, -30], [40, -58]] as A2, armRFront: true, propR: "ruler", propK: 0.45, headTilt: 4 }, 8],
      ]) : flow(f, [
        [1450, { expr: "calm", facing: 1, tilt: 0, armR: [[24, 20], [16, 6]] as A2, armRFront: true }],
        [1476, { expr: "smile", facing: 1, tilt: 4, armR: [[28, 0], [52, 2]] as A2, armRFront: true }, 6],            // one finger: push
        [1494, { expr: "smug", facing: 1, tilt: 1, armR: [[24, 14], [30, 10]] as A2, armRFront: true }, 8],
        [1508, { expr: "yikes", facing: -1, tilt: -3, look: -0.8 }, 4],
      ]), { idx: 1 }),
      C("dummy", [-0.42, 0.49, carZ(-1) + 0.03], pose(null, { expr: "blank", mode: "sit", facing: -1, tilt: f >= 1483 ? -9 * Math.exp(-(f - 1483) / 12) * Math.cos((f - 1483) * 0.35) : 0 }), { idx: 20, scale: SITK }),
      C("cBoss", BOSS7, flow(f, [
        [1450, { expr: "stern", facing: 1, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "stopwatch" }],
        [1500, { expr: "angry", facing: 1, tilt: -4, armR: [[24, -6], [36, -20]] as A2, armRFront: true, armL: [[-10, 10], [14, 0]] as A2, armLFront: true }, 6],      // wind-up
        [1509, { expr: "angry", facing: 1, tilt: 6, armR: [[20, 6], [14, 2]] as A2, armRFront: true, armL: [[-10, 10], [14, 0]] as A2, armLFront: true }, 2],          // punch!
        [1514, { expr: "pained", facing: 1, tilt: 2, armR: [[22, 14], [16, 22]] as A2, armRFront: true, armL: [[-24, 14], [-10, 26]] as A2, sweat: 1 }, 6],
      ]), { idx: 3 }),
    ],
    fx: fxs(f >= 1509 ? clang("pn", add3(BOSS7, 0.25, 1.35, 0.1), f - 1509, 0.3) : null),
    focus: f < 1370 ? [1.35, 1.5, -2.75] : f < 1450 ? [MK(s, "clock")[0], MK(s, "clock")[1] - 0.4, MK(s, "clock")[2]] : [-1.2, 1.4, -2.9],
    subj: f < 1370 ? "eng" : f < 1450 ? null : "eng",
  };
};
lens3([[1282, DOF_MS], [1370, DOF_INSERT], [1450, DOF_MS]]);

// ================================================= SCENE 8 (1527-1700) PAYOFF: the tank car ========================
// One 5.8 s shot. The crumpled Paper Car is parked aside; the IRONCLAD sits on the rail. The mechanic hauls the lever
// (1532), it rolls and hits the wall on "car" (1562): CLANG, everything rattles, the clock hand barely flicks (OUCH).
// "Not a scratch on it": the boss buffs its chrome with his hanky, a sparkle. The camera pushes in to the driver's window
// (1600-1630): the dummy is slumped on the wheel; on "pops off" (1682) its head pops off with a boing, flies out of the
// window in an arc, bounces and rolls to the boss's shoes; he gapes.
const tz8 = (f: number) => f < 1536 ? 3.2 : f < 1562 ? 3.2 * (1 - Math.pow(clamp01((f - 1536) / 26), 1.8)) : 0;
SHOT_CAMS[8] = (s) => {
  const cz = -4.7 + 2.55;
  const A = { pos: [-3.4, 2.2, 5.4] as V3, look: [0.4, 1.15, -3.0] as V3, fov: 52 };   // the rail from the left back corner (the folded Paper Car is parked right): tank car, wall, the boss
  const B = { pos: [-3.6, 1.7, -4.6] as V3, look: [-1.2, 1.0, -1.8] as V3, fov: 68 };   // from the front-left: the driver's window left, the boss right, where the head lands
  const S1 = F(() => A, 1527, 0.0006), S2 = F(() => B, 1612, 0.0006);
  return [K(1527, S1, 24, true), K(1600, glideTo(S1, 1600, S2, 1612), 1)];
};
SHOT_ACTS[8] = (f, s) => {
  const cz = -4.7 + 2.55, imp = f - 1562, tz = tz8(f), carC = -4.7 + tz + 2.55;
  const bossP: V3 = [-1.75, 0, -2.1], headK = clamp01((f - 1684) / 16);
  const hu = clamp01((headK - 0.35) / 0.65);   // straight out through the window opening (1.04-1.49), then an arc to the floor at his shoes
  const head: V3 = headK < 0.35 ? [-0.42 - 0.63 * (headK / 0.35), 1.25 + 0.12 * (headK / 0.35), cz + 0.25 * (headK / 0.35)] : [-1.05 - 0.45 * hu, 1.37 + 0.5 * Math.sin(Math.PI * hu) - 1.17 * hu * hu, cz + 0.25 + 0.35 * hu];
  return {
    ctl: { paside: 1, pz: -1.0, pcrush: 1, pdoor: 0.3, tside: 0, tz, tshake: imp >= 0 && imp < 20 ? 1 - imp / 20 : 0, lever: sm(f, 1530, 1538), hand: imp >= 0 ? 0.02 * Math.sin(clamp01(imp / 6) * Math.PI) : 0, flood: 1 },
    cast: [
      C("mechA", MK(s, "lever"), flow(f, [
        [1527, { expr: "determined", facing: -1, tilt: -4, armR: [[-6, -26], [-20, -56]] as A2, armRFront: true }],
        [1530, { expr: "strain", facing: -1, tilt: 10, armR: [[-14, -6], [-30, -10]] as A2, armRFront: true }, 6],
        [1566, { expr: "shock", facing: -1, tilt: -6, armL: [[-24, -10], [-20, -40]] as A2 }, 4],
      ]), { idx: 1 }),
      C("cBoss", bossP, flow(f, [
        [1527, { expr: "proud", facing: 1, armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: "stopwatch" }],
        [1563, { expr: "beam", facing: 1, tilt: -3, armR: [[26, -10], [40, -36]] as A2, armRFront: true, propR: "stopwatch" }, 4],
        [1576, { expr: "proud", facing: 1, tilt: 8, armR: [[28, 10], [50 + 6 * Math.sin(f * 0.8), 16]] as A2, armRFront: true, propR: "rag" }, 8],           // buffs the chrome
        [1612, { expr: "smug", facing: 1, tilt: 2, armR: [[24, 20], [16, 6]] as A2, armRFront: true, propR: "rag", headTilt: 4 }, 8],
        [1688, { expr: "aghast", facing: 1, tilt: -6, armR: [[24, 20], [16, 6]] as A2, armRFront: true, propR: "rag", look: 0.6 }, 4],
      ]), { idx: 2 }),
      C("dummy", [-0.42, 0.53, carC + 0.03], pose(null, f < 1562 ? { expr: "blank", mode: "sit", facing: 0 } : { expr: "blank", mode: "sit", facing: -1, tilt: 32 + 4 * Math.max(0, 1 - (f - 1562) / 10), headTilt: 12, noHead: f >= 1684 } as P), { idx: 20, scale: SITK }),
      C("eng", MK(s, "bay"), pose(null, { expr: f < 1562 ? "calm" : f < 1688 ? "sly" : "smug", facing: 1, armR: [[22, 16], [-8, 20]] as A2, armRFront: true, armL: [[-22, 16], [8, 22]] as A2, armLFront: true }), { idx: 3 }),
    ],
    fx: fxs(
      clang("tk", [0, 1.0, -4.6], imp, 0.9), imp >= 0 && imp < 24 ? dustCard("tk", [0, 0.8, -4.4], 1.5, 0.7 * (1 - imp / 24), 4) : null,
      f >= 1590 ? sparkle("chr", [-0.3, 0.55, cz + 2.65], (f - 1590) % 30, 0.3) : null,
      f >= 1684 ? { kind: "card", key: "dhead", pos: head, w: 0.42, h: 0.42, rot: (f - 1684) * 0.4, cw: 128, ch: 128,
        draw: (p: Pen) => { const g = p.g; g.fillStyle = "#f4f1ea"; g.strokeStyle = INKC; g.lineWidth = 8; g.beginPath(); g.ellipse(64, 64, 52, 54, 0, 0, 6.3); g.fill(); g.stroke(); for (const [x, y] of [[34, 40], [94, 40]]) for (let q = 0; q < 4; q++) { g.fillStyle = q % 2 ? "#f2c230" : "#26222c"; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 12, (q * Math.PI) / 2, ((q + 1) * Math.PI) / 2); g.fill(); } g.fillStyle = INKC; g.beginPath(); g.ellipse(50, 66, 4, 6, 0, 0, 6.3); g.ellipse(78, 66, 4, 6, 0, 0, 6.3); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(52, 90); g.lineTo(76, 90); g.stroke(); } } as FxSpec : null,
      f >= 1682 && f < 1694 ? squiggles("boing", [-0.42, 1.42, carC], f, "#ffffff", 0.3) : null,
    ),
    focus: f < 1600 ? [0, 1.0, carC + 1.0] : f < 1684 ? [-0.6, 1.3, carC] : head,
    subj: f < 1600 ? null : "dummy",
  };
};
lens3([[1527, DOF_WS], [1600, DOF_MS, 12]]);

// ================================================= SCENE 9 (1700-1900) TODAY ========================================
// 9a 1700-1765: a red hatchback drives past, the camera lands on the teal wreck at the bollard: nose crumpled, cabin fine,
//    door open; its driver stands beside it, fine, sipping a coffee; the old man arrives with his cane.
// 9b 1765-1900: MCU the old man shakes his head at the crumpled nose: "They don't build them like they used to." (talk
//    mouths), cane pointing; "Exactly." (1870): behind him the driver raises her coffee to us and grins; he squints.
SHOT_CAMS[9] = (s) => {
  const w = MK(s, "wreck"), om = MK(s, "oldMan"), dr = MK(s, "driver");
  const A = { pos: [4.8, 1.65, 8.9] as V3, look: [-0.4, 0.95, 6.0] as V3, fov: 52 };
  const B = inRoom(fit([body(om, 0.9, 2.15, 0.38), [[0.4, 0, 5.9], 0.5, 1.2, 0.4]], 112, 3, 40, 0.9, -0.05, -0.12), STREET9);
  return [K(1700, F(() => A, 1700, 0.0014), 24, true), K(1765, F(() => B, 1765, 0.0012, [[1868, 0.003, 20]]), 24, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const om = MK(s, "oldMan"), dr = MK(s, "driver");
  const arrive = walkPath(9, s, [add3(om, 1.6, 0, 0.3), om], f, 1700, 1740);
  return {
    ctl: { pass: clamp01((f - 1696) / 60), steam: 0.35, wdoor: 0.55 },
    cast: [
      C("oldMan", f < 1740 ? arrive.p : om, f > 1700 && f < 1740 ? pose(null, { expr: "stern", mode: "walk", phase: arrive.phase, facing: arrive.facing, armR: [[24, 26], [30, 44]] as A2, armRFront: true, propR: "cane" }) : pose(null, speak(f, 1821, 1870, flow(f, [
        [1740, { expr: "stern", facing: -1, tilt: 4, armR: [[24, 26], [30, 44]] as A2, armRFront: true, propR: "cane", look: -0.7 }],
        [1790, { expr: "stern", facing: -1, tilt: 6, armR: [[26, 6], [50, -4]] as A2, armRFront: true, propR: "cane", propRAng: -1.3, look: -0.7, headTilt: -4 }, 10],   // points the cane at the nose
        [1822, { expr: "stern", facing: 1, tilt: 2, armR: [[24, 26], [30, 44]] as A2, armRFront: true, propR: "cane", headTilt: 5 * Math.sin((f - 1822) * 0.3) }, 8],            // grumbles at us, head shaking
        [1872, { expr: "dismay", facing: -1, tilt: -2, armR: [[24, 26], [30, 44]] as A2, armRFront: true, propR: "cane", look: -0.8 }, 10],                                         // "Exactly." - squints at her
      ]) as P)), { idx: 1 }),
      C("cDriver", dr, flow(f, [
        [1700, { expr: "calm", facing: 1, armR: [[24, 6], [22, -18]] as A2, armRFront: true, propR: "coffeeCup", propK: f * 0.2 }],
        [1790, { expr: "smile", facing: 1, armR: [[24, 10], [24, -6]] as A2, armRFront: true, propR: "coffeeCup", propK: f * 0.2, headTilt: 4 }, 10],
        [1866, { expr: "grin", facing: -1, tilt: -3, armR: [[26, -10], [36, -40]] as A2, armRFront: true, propR: "coffeeCup", propK: f * 0.2, headTilt: 6 }, 6],              // raises the cup: exactly
      ]), { idx: 2 }),
      C("passer", [MK(s, "walker")[0] + 0.012 * (f - 1700), 0.14, MK(s, "walker")[2]], pose(null, { expr: "smile", facing: 1, mode: "walk", phase: ph(f, 14) }), { idx: 3 }),
    ],
    fx: fxs(f >= 1866 ? sparkle("ex", add3(dr, 0.3, 2.0, 0), f - 1866, 0.25) : null),
    focus: f < 1765 ? [MK(s, "wreck")[0], 1.0, MK(s, "wreck")[2] + 1.0] : [om[0], 1.75, om[2]],
    subj: f < 1765 ? null : "oldMan",
  };
};
lens3([[1700, DOF_FS], [1765, DOF_CU]]);
