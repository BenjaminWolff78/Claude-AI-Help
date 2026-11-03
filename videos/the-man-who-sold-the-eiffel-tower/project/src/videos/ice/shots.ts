// Per-shot cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "The Man Who Sold the Eiffel Tower", set-local coordinates,
// absolute frames. Master prompt v10.4: no two shots in a row with the same subject size and angle; Lustig is centred
// and frontal for at most 30 % of the runtime (three-quarter / profile / seen from behind); in every place the camera
// TRAVELS to people already there; <= 4 hard cuts (S09 "7,000", S15 "trick", S19 "Vienna"); every verb is acted with
// hands or legs; extras already working at different depths; every camera path is checked per frame by
// scripts/qa_run.mjs (collisions, occluders, subject in frame, overlapping bodies).
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF } from "./story";
import POSES from "./poses.json";
import type { MouthK } from "./toon";

// ---------------- helpers ----------------
type P = Partial<FigOpts>;
type A2 = [[number, number], [number, number]];
const PZ = POSES as unknown as Record<string, P>;
const pose = (name: string | null, o: P = {}): FigOpts => ({ ...(name ? PZ[name] : {}), ...o }) as FigOpts;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const sm = (f: number, a: number, b: number) => smooth((f - a) / (b - a));
const lin = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const creep = (f: number, f0: number, rate: number, punches: [number, number, number][] = []) => {
  let s = rate * Math.max(0, f - f0);
  for (const [pf, pr, n] of punches) { const x = f - pf; if (x <= 0) continue; for (let i = 0; i < Math.min(x, n); i++) s += (pr - rate) * Math.max(0, Math.min(1, (i + 0.5) / 6, (n - i - 0.5) / 6)); }
  return Math.exp(-s);
};
/** a framing that keeps creeping in (0.15-0.35 %/f) so a hold never freezes */
const hold = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0022, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const k = creep(f, f0, rate, punches);
  return { pos: lerp3(look, pos, k), look, fov, roll };
};
/** a camera that travels along a path (pos/look functions of frame) and still creeps */
const track = (posF: (f: number) => V3, lookF: (f: number) => V3, fov: number, f0: number, rate = 0.0015) => (f: number): Shot => {
  const k = creep(f, f0, rate), look = lookF(f);
  return { pos: lerp3(look, posF(f), k), look, fov };
};
const K = (f: number, s: (f: number) => Shot, dur = 24, cut = false): Key => ({ f, s, dur, cut });
const ph = (f: number, n = 18) => ((f / n) % 1 + 1) % 1;
/** extras animate "on threes" (their card repaints every 3 frames) */
const st = (f: number, n = 3) => Math.floor(f / n) * n;
const MOUTHS: MouthK[] = ["O", "smile", "o", "dash", "O", "wave", "o", "smileWide"];
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? MOUTHS[Math.floor(f / 4) % MOUTHS.length] : undefined);
const SU = 0.00216;
export const cardPt = (pos: V3, cam: V3, X: number, Y: number, sc = 1): V3 => {
  const yaw = Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
  return [pos[0] + Math.cos(yaw) * (X - 300) * SU * sc, pos[1] + (975 - Y) * SU * sc, pos[2] - Math.sin(yaw) * (X - 300) * SU * sc];
};
const handXY = (side: 1 | -1, off: [number, number], fs = 0): [number, number] => [300 + 3 * 2.36 * fs + side * 75 + off[0] * 2.36, 447 + off[1] * 2.36];
const C = (who: string, pos: V3, o: FigOpts = {}, extra: Partial<CastPlace> = {}): CastPlace => ({ who, pos, o, ...extra });
const dof: { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 }[] = [];
const lens = (f: number, cInf: number, dur = 10, focus?: (f: number) => V3) => dof.push({ f, cInf, dur, focus });


// ---------------- framing by fit: angle in, distance + aim out (every subject inside the frame by construction) ----------------
/** a box to keep in frame: base point, y range above it, half width */
type Box = [V3, number, number, number];
const body = (p: V3, y0 = 0, y1 = 2.05, w = 0.32): Box => [p, y0, y1, w];
/** az: compass of the camera around the subjects (0 = from +z, 90 = from +x), el: degrees above (looking down),
 *  pad: fraction of the half-frame the boxes may use, side: lateral shift of the aim (m, + = subjects move left),
 *  lift: vertical shift of the aim (m, + = subjects move down) */
const fit = (boxes: Box[], az: number, el: number, fov = 44, pad = 0.78, side = 0, lift = 0): { pos: V3; look: V3; fov: number } => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const fw = [-Math.sin(a) * Math.cos(e), -Math.sin(e), -Math.cos(a) * Math.cos(e)];
  const rl = Math.hypot(fw[0], fw[2]) || 1, rt = [-fw[2] / rl, 0, fw[0] / rl];
  const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const pts: number[][] = [];
  for (const [b, y0, y1, w] of boxes) for (const y of [y0, y1]) for (const s2 of [-1, 1]) pts.push([b[0] + rt[0] * w * s2, b[1] + y, b[2] + rt[2] * w * s2]);
  const O = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length, m[2] + p[2] / pts.length], [0, 0, 0]);
  const dot = (u: number[], v: number[]) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const rel = pts.map((p) => [p[0] - O[0], p[1] - O[1], p[2] - O[2]]);
  const xs = rel.map((r) => dot(r, rt)), ys = rel.map((r) => dot(r, up));
  const xc = (Math.min(...xs) + Math.max(...xs)) / 2, yc = (Math.min(...ys) + Math.max(...ys)) / 2;
  const c = [O[0] + rt[0] * xc + up[0] * yc, O[1] + rt[1] * xc + up[1] * yc, O[2] + rt[2] * xc + up[2] * yc];
  const tv = Math.tan((fov * Math.PI) / 360), th = tv * (1080 / 1920);
  let D = 0.5;
  for (const p of pts) { const r = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; D = Math.max(D, Math.abs(dot(r, rt)) / (pad * th) - dot(r, fw), Math.abs(dot(r, up)) / (pad * tv) - dot(r, fw)); }
  const look: V3 = [c[0] + rt[0] * side + up[0] * lift, c[1] + rt[1] * side + up[1] * lift, c[2] + rt[2] * side + up[2] * lift];
  return { pos: [c[0] - fw[0] * D + rt[0] * side + up[0] * lift, c[1] - fw[1] * D + rt[1] * side + up[1] * lift, c[2] - fw[2] * D + rt[2] * side + up[2] * lift], look, fov };
};
/** a framing (static or moving: every argument may depend on the frame) that keeps creeping in */
const F = (g: (f: number) => { pos: V3; look: V3; fov: number }, f0: number, rate = 0.0018, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const c = g(f), k = creep(f, f0, rate, punches);
  return { pos: lerp3(c.look, c.pos, k), look: c.look, fov: c.fov, roll };
};

export const SHOT_CAMS: Record<number, (s: SetDef) => Key[]> = {};
export const SHOT_ACTS: Record<number, (f: number, s: SetDef) => Act> = {};
const camAt = (id: number, s: SetDef, f: number) => run(SHOT_CAMS[id](s), f);
/** screen-right sign of a world xz direction for the shot's camera at frame f */
const screenSide = (id: number, s: SetDef, f: number, dx: number, dz: number) => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]];
  return Math.sign(-d[1] * dx + d[0] * dz) || 1;
};

// ---------------- extras: already working when the camera arrives (v10.4 fix 6) ----------------
const ARM = {
  carryR: [[24, 30], [8, 46]] as A2, carryL: [[-24, 30], [-8, 46]] as A2,
  hang: undefined,
};
/** walks A <-> B carrying a prop (crate / sack / basket / iceblock), facing the way it walks on screen */
const walker = (id: number, s: SetDef, who: string, A: V3, B: V3, f: number, i: number, prop = "crate", speed = 1.0, expr: Face = "neutral"): CastPlace => {
  const L = Math.hypot(B[0] - A[0], B[2] - A[2]), per = Math.max(30, (L / speed) * 30 * 2), g = st(f) + i * 41;
  const u = (((g % per) + per) % per) / per, fwd = u < 0.5, k = fwd ? u * 2 : 2 - u * 2;
  const dx = (B[0] - A[0]) * (fwd ? 1 : -1), dz = (B[2] - A[2]) * (fwd ? 1 : -1);
  const facing = screenSide(id, s, f, dx, dz);
  return C(who, lerp3(A, B, k), pose(null, { expr, mode: "walk", phase: ph(g, 16), facing, armR: ARM.carryR, armRFront: true, propR: prop }), { idx: 50 + i });
};
const sweeper = (who: string, pos: V3, f: number, i: number, facing = 1, prop = "broom"): CastPlace => {
  const u = Math.sin(st(f) * 0.32 + i);
  return C(who, pos, pose(null, { expr: "neutral", facing, tilt: 5 * u, armR: [[18, 30], [8 + 10 * u, 52]], armL: [[-4, 30], [12 + 8 * u, 40]], armRFront: true, armLFront: true, propR: prop, propRAng: 0.35 * u }), { idx: 60 + i });
};
const shoveler = (who: string, pos: V3, f: number, i: number, facing = 1, expr: Face = "neutral"): CastPlace => {
  const u = Math.sin(st(f) * 0.24 + i * 1.7);
  return C(who, pos, pose(null, { expr, facing, tilt: 7 * u, armR: [[28, 20 + 10 * u], [52, 30 - 26 * u]], armL: [[-6, 30], [30, 44 - 10 * u]], armLFront: true, armRFront: true, propR: "shovel", propRAng: -0.5 + 0.7 * u, propK: 1 }), { idx: 70 + i });
};
/** two people chatting: alternating talker, hand gesture, head bob */
const chatter = (who: string, pos: V3, f: number, i: number, facing: number, expr: Face = "smile"): CastPlace => {
  const g = st(f), mine = Math.floor((g + i * 45) / 45) % 2 === 0, u = Math.sin(g * 0.4 + i);
  return C(who, pos, pose(null, { expr: mine ? "grin" : expr, facing, mouth: mine ? MOUTHS[Math.floor(g / 6) % MOUTHS.length] : undefined, headTilt: mine ? 3 * u : 0,
    ...(mine ? { armR: [[26 * facing, 10], [(40 + 8 * u) * facing, -6]] as A2, armRFront: true } : {}) }), { idx: 80 + i });
};
const hauler = (who: string, pos: V3, f: number, i: number, facing = 1): CastPlace => {
  const u = Math.sin(st(f) * 0.3 + i);
  return C(who, pos, pose(null, { expr: "strain", facing, mode: "brace", tilt: -8 * facing + 3 * u, armR: [[30 * facing, 14], [(56 + 8 * u) * facing, 10]], armL: [[18 * facing, 20], [(44 + 8 * u) * facing, 14]], armRFront: true }), { idx: 90 + i });
};
const fanner = (who: string, pos: V3, f: number, i: number, facing = 1, expr: Face = "dismay"): CastPlace =>
  C(who, pos, pose(null, { expr, facing, sweat: 1, armR: [[28, 10], [26 + 8 * Math.sin(st(f, 2) * 0.9 + i), -18]], armRFront: true }), { idx: 100 + i });


// ---------------- Eiffel helpers ----------------
/** position along a polyline walked at v m/frame starting at frame f0 (before f0: at the start; after: at the end) */
const along = (pts: V3[], v: number, f0: number, f: number): { p: V3; d: [number, number]; moving: boolean } => {
  let s = Math.max(0, (f - f0) * v);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (s <= L || i === pts.length - 1) { const k = Math.min(1, s / (L || 1)); return { p: lerp3(a, b, k), d: [b[0] - a[0], b[2] - a[2]], moving: f >= f0 && s < L }; }
    s -= L;
  }
  return { p: pts[0], d: [0, 1], moving: false };
};
/** someone walking a polyline (faces the way they walk on screen), then standing with `rest` options */
const stroll = (id: number, s: SetDef, who: string, pts: V3[], v: number, f0: number, f: number, o: P = {}, rest: P = {}, extra: Partial<CastPlace> = {}): CastPlace => {
  const w = along(pts, v, f0, f);
  const facing = screenSide(id, s, f, w.d[0], w.d[1]);
  return C(who, w.p, w.moving ? pose(null, { expr: "neutral", mode: "walk", phase: ph(f + who.length * 7, 14), facing, ...o }) : pose(null, { facing, ...rest }), extra);
};
/** screen facing from a to b */
const faceTo = (id: number, s: SetDef, f: number, a: V3, b: V3) => screenSide(id, s, f, b[0] - a[0], b[2] - a[2]);
const ARMS = {
  wideL: [[-34, -6], [-62, -30]] as A2, wideR: [[34, -6], [62, -30]] as A2,
  shushR: [[16, -2], [2, -34]] as A2, cupR: [[22, -4], [12, -34]] as A2,
  pinchR: [[26, 6], [40, -14]] as A2, upR: [[22, -30], [30, -64]] as A2, upL: [[-22, -30], [-30, -64]] as A2,
  palmL: [[-30, 14], [-46, 4]] as A2, palmR: [[30, 14], [46, 4]] as A2,
  holdR: [[24, 30], [34, 44]] as A2, reachR: [[32, 10], [58, 16]] as A2, knockR: [[26, -6], [48, -22]] as A2,
};
/** a waiter carrying a tray between two points */
const waiterTray = (id: number, s: SetDef, who: string, A: V3, B: V3, f: number, i: number) => walker(id, s, who, A, B, f, i, "tray", 0.9, "smile");
/** a painter brushing (brush arm swings up and down on threes) */
const painter = (who: string, pos: V3, f: number, i: number, facing = 1): CastPlace => {
  const u = Math.sin(st(f) * 0.45 + i * 2);
  return C(who, pos, pose(null, { expr: "neutral", facing, tilt: 3 * u, armR: [[28 * facing, -4], [(44 + 6 * u) * facing, -24 - 16 * u]], armRFront: true, propR: "brush", propRAng: 0.2 * u, mouth: Math.floor(st(f) / 30 + i) % 3 === 0 ? "wave" : undefined }), { idx: 110 + i });
};
/** a citizen / tourist idling (looks around, small weight shifts) */
const idler = (who: string, pos: V3, f: number, i: number, facing = 1, o: P = {}): CastPlace => {
  const u = Math.sin(st(f) * 0.12 + i * 1.3);
  return C(who, pos, pose(null, { expr: "smile", facing, headTilt: 3 * u, tilt: 1.5 * u, ...o }), { idx: 120 + i });
};
const lerp2 = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// =====================================================================================================================
// EIFFEL TOWER base, Champ de Mars (tower). Ground y 0, +z = the Champ de Mars / camera side. The near leg stands at
// x,z 20.6..34.4 (leaning in), the front arch springs at y 7 (crown 23), the first platform at y 31.7. Hero group in
// front of the near leg at z ~39.5; the iron stair climbs along -z from [18.9, 0, 33.4] to the landing [19.1, 7, 23.1];
// painters' plank at y 4.56, z 32.35. Keep-out: TOWER_SOLIDS (piers, chords, stair, plank, kiosk, cart, trees...).
// =====================================================================================================================
const L1: V3 = [5.4, 0, 39.9], P1: V3 = [6.3, 0, 39.2], M1: V3 = [7.2, 0, 39.9];
const PLANK1: V3 = [25.3, 4.56, 32.35], PLANK2: V3 = [27.7, 4.56, 32.35];
/** y on the first stair flight (z 33.4 -> 23.1 rises 0 -> 7) */
const stairY = (z: number) => clamp01((33.4 - z) / 10.3) * 7;
const STAIR = (z: number): V3 => [19.1 - 0.2 * clamp01((33.4 - z) / 10.3) * 0, stairY(z), z];
const towerExtras = (id: number, s: SetDef, f: number, n = 4): CastPlace[] => [
  painter("painter1", PLANK1, f, 0, 1), painter("painter2", PLANK2, f, 1, -1),
  walker(id, s, "paris2", [-2.0, 0, 44.5], [12.0, 0, 46.0], f, 2, "basket", 1.0),
  idler("paris4", [3.0, 0, 23.6], f, 3, 1, { armR: [[22, -10], [28, -40]], armRFront: true }),
  chatter("paris1", [11.0, 0, 31.4], f, 4, 1), chatter("paris3", [11.8, 0, 32.0], f, 5, -1),
].slice(0, 2 + n);

// ---- S01 (0-62) "This man is selling / the Eiffel Tower,"
// Frame 1 is already moving: Lustig, three-quarter, sweeps his arm up the tower like a showman while Poisson and his
// wife crane their necks; the camera trucks along the group, then cranes down low and tilts up so the near leg, the
// arch and the platform tower over them (title #1). Painters brush on their plank, tourists stroll.
SHOT_CAMS[1] = () => [
  K(0, F((f) => fit([body(L1), body(P1)], lerp(30, 16, sm(f, 0, 40)), 3, 40, 0.86, 0.1, 0.05), 0, 0.0016)),
  K(30, (f) => { const k = sm(f, 30, 62); return { pos: [lerp(4.3, 3.9, k), lerp(0.75, 0.55, k), lerp(46.4, 47.6, k)], look: [lerp(7.4, 8.2, k), lerp(2.2, 4.6, k), lerp(31.0, 30.0, k)], fov: 46 }; }, 28),
];
const lustigSell = (f: number, k = 1): P => {
  const up = sm(f, -6, 12);
  return { expr: "grin", facing: -1, mouth: talk(f, 0, 44), armR: [lerp2([24, 20], ARMS.upR[0], up), lerp2([30, 40], [44, -58], up)] as A2, armRFront: true, headTilt: -4 * k, bob: 1.5 * Math.sin(f * 0.3) };
};
SHOT_ACTS[1] = (f, s) => ({
  ctl: { rust: 1, fair: 0, glow: 0 },
  cast: [C("lustig", L1, pose(null, { ...lustigSell(f), facing: faceTo(1, s, f, L1, P1) }), { shadow: true }),
    C("poisson", P1, pose(null, { expr: "eureka", facing: faceTo(1, s, f, P1, [20, 0, 30]), headTilt: -8, mouth: "O" })),
    C("mmePoisson", M1, pose(null, { expr: "neutral", facing: faceTo(1, s, f, M1, L1), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
    ...towerExtras(1, s, f)],
  focus: [6.3, 1.5, 39.5],
});
lens(0, 4, 1);

// ---- S02 (62-140) "and the buyer / is about to hand him / a suitcase of cash."
// Poisson heaves a fat suitcase up with both hands and steps in; the camera glides down to over Lustig's shoulder
// (back view) so Poisson, the suitcase and the leg of the tower fill the frame; Lustig's fingers wiggle toward the
// handle; the camera keeps arcing round until Lustig's greedy profile shows.
const P2: V3 = [6.0, 0, 39.45];
SHOT_CAMS[2] = () => [
  K(62, F((f) => fit([body(L1, 0, 2.05, 0.3), body(lerp3(P1, P2, sm(f, 74, 92)), 0, 2.05, 0.4)], lerp(-40, -20, sm(f, 70, 140)), 5, 40, 0.78, 0.05, 0.05), 62, 0.0018), 32),
];
SHOT_ACTS[2] = (f, s) => {
  const heave = sm(f, 64, 78), P = lerp3(P1, P2, sm(f, 74, 92)), wig = f > 100 ? Math.sin(f * 0.9) * 4 : 0, back = false;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", L1, pose(null, back ? { back: true, armR: [[26, 4], [lerp(34, 50, sm(f, 96, 106)), lerp(24, 4, sm(f, 96, 106)) + wig]] as A2, armRFront: true }
        : { expr: "joy", facing: faceTo(2, s, f, L1, P), armR: [[26, 4], [50, 4 + wig]] as A2, armRFront: true, mouth: f > 118 ? "smileWide" : undefined }), { shadow: true }),
      C("poisson", P, pose(null, { expr: f < 96 ? "strain" : "grin", facing: faceTo(2, s, f, P, L1), mode: f >= 74 && f < 92 ? "walk" : "stand", phase: ph(f, 12), tilt: -5 * heave,
        armR: [[26, lerp(30, -2, heave)], [lerp(16, 40, heave), lerp(52, 10, heave)]] as A2, armL: [[-20, lerp(30, 0, heave)], [lerp(-6, 22, heave), lerp(52, 12, heave)]] as A2, armRFront: true, armLFront: true, propR: "suitcase", sweat: heave * 0.6 })),
      C("mmePoisson", M1, pose(null, { expr: "dismay", facing: faceTo(2, s, f, M1, P), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
      ...towerExtras(2, s, f)],
    focus: [6.0, 1.4, 39.4], subj: "poisson",
  };
};
lens(62, 6, 16);

// ---- S05 (306-430) 1889 World's Fair: "You see, it was built for a world's fair, / and it was only meant to stand
// for 20 years."  Fresh paint, bunting, the EXPOSITION 1889 banner, crowds with baskets and kids. A: from the crowd
// the camera cranes up the near leg to the arch and its banner (title #3). B: it glides back down and across to a
// fair official holding the permit board, who flips it from 1889 to 1909 on "20 years" with a tap of his cane.
const OFF: V3 = [9.6, 0, 40.4];
SHOT_CAMS[5] = () => [
  K(306, (f) => { const k = sm(f, 306, 372); return { pos: [lerp(2.2, 3.4, k), lerp(1.5, 2.6, k), lerp(49, 50.5, k)], look: [lerp(6.5, 13, k), lerp(1.8, 15, k), lerp(36, 26, k)], fov: lerp(42, 46, k) }; }),
  K(352, F(() => fit([body(OFF, 0, 2.05, 0.3), [OFF, 1.2, 2.4, 0.55]], 38, 4, 40, 0.74, 0.25, 0.1), 352, 0.0018, [[402, 0.005, 14]]), 62),
];
SHOT_ACTS[5] = (f, s) => {
  const flip = sm(f, 400, 408);
  const crowd: CastPlace[] = [
    walker(5, s, "paris2", [0.5, 0, 42.5], [11.5, 0, 44.0], f, 0, "basket", 1.1),
    walker(5, s, "paris4", [12.5, 0, 36.0], [3.0, 0, 37.5], f, 1, "basket", 1.0),
    chatter("paris1", [5.0, 0, 39.6], f, 2, 1), chatter("paris3", [5.8, 0, 40.3], f, 3, -1),
    C("newsboy", [7.4, 0, 43.0], pose("cheer", { expr: "joy", facing: 1, bob: 4 * Math.abs(Math.sin(st(f, 2) * 0.5)) }), { idx: 70 }),
    idler("buyer", [12.8, 0, 42.2], f, 4, -1, { expr: "grin" }),
    painter("painter1", PLANK1, f, 5, 1), painter("painter2", PLANK2, f, 6, -1),
  ];
  return {
    ctl: { fair: 1, rust: 0, glow: 0 },
    cast: [C("clerk2", OFF, pose(null, { expr: f > 404 ? "smug" : "neutral", facing: -1, armR: [[26, 6], [50, 4]], armRFront: true, armL: f > 398 && f < 410 ? [[-22, -4], [10, 6]] as A2 : [[-24, 20], [-30, 40]] as A2, armLFront: true, mouth: talk(f, 404, 416) }), { idx: 1 }), ...crowd],
    fx: [{ kind: "card", key: "permit" + (flip > 0.5 ? "B" : "A"), pos: [OFF[0] + 0.42, 1.3, OFF[2] - 0.2], w: 0.6 * Math.max(0.08, Math.abs(1 - 2 * flip)), h: 0.42, cw: 256, ch: 176,
      draw: (p) => { const g = p.g; g.fillStyle = "#f6ead0"; g.strokeStyle = "#241726"; g.lineWidth = 10; g.beginPath(); g.roundRect(8, 8, 240, 160, 14); g.fill(); g.stroke();
        g.fillStyle = "#7a2a3a"; g.font = "900 34px Georgia, serif"; g.textAlign = "center"; g.fillText("PERMIS", 128, 58);
        g.fillStyle = "#241726"; g.font = "900 64px Georgia, serif"; g.fillText(flip > 0.5 ? "1909" : "1889", 128, 132); } }] as FxSpec[],
    focus: f < 368 ? undefined : [OFF[0], 1.5, OFF[2]], subj: f < 400 ? null : "clerk2",
  };
};
lens(306, 0, 1); lens(368, 6, 20);

// ---- S11 (893-956) "and lets them climb it / like he owns the place."
// Low up the iron stair: the dealers puff up the first flight (Poisson sweating), Lustig waits on the landing, pats a
// girder like a landlord and waves them up; the camera cranes up alongside the climbers.
const climb = (z0: number, f: number, f0 = 893, v = 0.022, zmin = 24.2): V3 => { const z = Math.max(zmin, z0 - (f - f0) * v); return STAIR(z); };
const LAND: V3 = STAIR(25.3);
const climberStill = (who: string, f: number) => C(who, climb(27.6, Math.min(f, 950), 893, 0.022, 26.6), pose(null, { expr: "joy", facing: -1, armR: ARMS.upR, armRFront: true }), { idx: 12 });
SHOT_CAMS[11] = () => [
  K(893, (f) => { const k = sm(f, 893, 956); return { pos: [19.0, lerp(9.25, 8.85, k), lerp(22.75, 22.95, k)], look: [19.1, lerp(3.4, 4.6, k), lerp(29.8, 28.2, k)], fov: 42 }; }),
];
SHOT_ACTS[11] = (f, s) => {
  const pat = f > 925 ? Math.sin((f - 925) * 0.7) : 0;
  const climber = (who: string, z0: number, i: number, o: P = {}) => { const zm = 26.6 + i * 1.2, p = climb(z0, f, 893, 0.022, zm); return C(who, p, pose(null, { expr: "strain", mode: p[2] > zm + 0.01 ? "walk" : "stand", phase: ph(f + i * 4, 16), facing: i % 2 ? 1 : -1, tilt: 6, sweat: 0.6, ...o }), { idx: 10 + i }); };
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", LAND, pose(null, f < 922 ? { expr: "grin", facing: -1, armR: [[22, -10], [30 + 8 * Math.sin(f * 0.5), -52]] as A2, armRFront: true }
        : { expr: "smug", facing: 1, armR: [[30, 0], [54, -6 + 4 * pat]] as A2, armRFront: true, headTilt: 5 }), { shadow: true }),
      climber("dealer2", 28.0, 0, { expr: "joy" }), climber("dealer3", 29.8, 1), climber("dealer4", 31.6, 2),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1)],
    focus: [19.1, 5.4, 26.6], subj: null,
  };
};
lens(893, 6, 1);

// ---- S12 (956-1058) "One dealer, André Poisson, / wants it badly, / but his wife isn't sure."
// On the landing Poisson hugs a girder with starry eyes (sparkles); the camera tracks along the railing past him to
// his wife one step below, arms folded, giving him the side-eye.
const PL: V3 = [13.7, 0, 29.4], WL: V3 = [14.9, 0, 30.0];
SHOT_CAMS[12] = () => [
  K(956, F((f) => fit([body(PL, 0, 2.05, 0.4)], lerp(22, 30, sm(f, 956, 1004)), 4, 40, 0.66, 0, 0), 956, 0.0014)),
  K(1000, F((f) => fit([body(PL, 0, 2.05, 0.4), body(WL)], lerp(34, 38, sm(f, 1000, 1058)), 4, 40, 0.82, 0, 0), 1000, 0.0014), 30),
];
SHOT_ACTS[12] = (f, s) => {
  const hug = sm(f, 960, 972), fold = f > 1020;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("poisson", PL, pose(null, { expr: "joy", facing: faceTo(12, s, f, PL, [20, 0, 26]), headTilt: -6 * hug, armR: [[22, 6], [lerp(30, 6, hug), lerp(30, 4, hug)]] as A2, armL: [[-22, 6], [lerp(-30, -6, hug), lerp(30, 4, hug)]] as A2, armRFront: true, armLFront: true, mouth: talk(f, 990, 1004), bob: 1.5 * Math.sin(f * 0.4) }), { idx: 1 }),
      C("mmePoisson", WL, pose(null, { expr: fold ? "dismay" : "neutral", facing: faceTo(12, s, f, WL, PL), headTilt: fold ? 6 : 0, armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true }), { idx: 2 }),
      climberStill("dealer2", f),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1)],
    fx: f < 1030 ? [{ kind: "card", key: "starEyes" + st(f, 3), pos: [PL[0], 1.95, PL[2] + 0.1], w: 0.7, h: 0.5, soft: true, cw: 128, ch: 96,
      draw: (p) => { const g = p.g; for (let i = 0; i < 5; i++) { const a = (st(f, 2) * 0.2 + i * 1.3) % 6.28, x = 64 + Math.cos(a) * 44, y = 48 + Math.sin(a) * 30; g.fillStyle = i % 2 ? "#ffd166" : "#fff3c4"; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10, b = (k * Math.PI) / 5; g.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } g.fill(); } } }] as FxSpec[] : [],
    focus: f < 1004 ? [PL[0], 1.5, PL[2]] : [14.3, 1.5, 29.7], subj: f < 1000 ? "poisson" : f < 1016 ? null : "mmePoisson",
  };
};
lens(956, 6, 1);

// ---- S13 (1058-1111) "Why would a minister / meet us in a hotel?"  Profile two-shot drifting sideways: the wife
// wags her finger at Poisson (lip-sync); he shrinks.
SHOT_CAMS[13] = () => [K(1058, F((f) => fit([body(PL, 0, 2.05, 0.4), body(WL)], lerp(34, 28, sm(f, 1058, 1111)), 3, 36, 0.8, lerp(0.1, -0.1, sm(f, 1058, 1111)), 0), 1058, 0.002))];
SHOT_ACTS[13] = (f, s) => {
  const wag = Math.sin(f * 0.8) * 10;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("mmePoisson", WL, pose(null, { expr: "angry", facing: faceTo(13, s, f, WL, PL), mouth: talk(f, 1060, 1102), armR: [[24, -6], [36 + wag * 0.3, -40 + wag]] as A2, armRFront: true, headTilt: 3 * Math.sin(f * 0.3) }), { idx: 2 }),
      C("poisson", PL, pose(null, { expr: "sheepish", facing: faceTo(13, s, f, PL, WL), squash: 0.1 * sm(f, 1066, 1080), headTilt: -5, armL: [[-20, 20], [-6, 40]], armR: [[20, 20], [6, 40]] }), { idx: 1 }),
      painter("painter1", PLANK1, f, 4, 1)],
    focus: [14.3, 1.5, 29.7], subj: "mmePoisson",
  };
};
lens(1058, 7, 1);

// ---- S18 (1512-1573) gold sun (light change): "Poisson pays the bribe / and the price."
// The biggest view of the tower: low, gold-lit, sunburst and sparkles behind it; the camera tilts down the leg to
// the handover: Poisson slips over the envelope, then heaves the suitcase over; Lustig hands him a deed.
SHOT_CAMS[18] = () => [
  K(1512, (f) => { const c = fit([body(L1), body(P1, 0, 2.05, 0.4)], -18, 1, 40, 0.8, 0, -0.1); return { pos: [c.pos[0], c.pos[1] - 0.25, c.pos[2]], look: [lerp(8.5, 7.0, sm(f, 1512, 1524)), lerp(42, 30, sm(f, 1512, 1524)), lerp(18, 24, sm(f, 1512, 1524))], fov: 46 }; }),
  K(1518, F(() => fit([body(L1), body(P1, 0, 2.05, 0.4)], -18, 1, 40, 0.8, 0, -0.1), 1518, 0.002, [[1552, 0.005, 12]]), 26),
];
SHOT_ACTS[18] = (f, s) => {
  const env = sm(f, 1536, 1542) - sm(f, 1547, 1550), cs = sm(f, 1552, 1560);
  return {
    ctl: { rust: 1, fair: 0, glow: 1 },
    cast: [C("lustig", L1, pose(null, { expr: cs > 0.5 ? "joy" : "sly", facing: faceTo(18, s, f, L1, P1), armR: [[26, 6], [lerp(34, 52, Math.max(env, cs)), lerp(30, 10, Math.max(env, cs))]] as A2, armRFront: true, propR: cs > 0.6 ? "suitcase" : f >= 1541 && env > 0.3 ? "envelope" : undefined,
        armL: f > 1556 ? [[-26, 4], [-46, -4]] as A2 : undefined, propL: f > 1556 ? "deed" : undefined }), { shadow: true }),
      C("poisson", P1, pose(null, { expr: cs > 0.2 ? "strain" : "grin", facing: faceTo(18, s, f, P1, L1), armR: [[26, 6], [lerp(30, 52, Math.max(env, 1 - cs)), 10]] as A2, armRFront: true, propR: cs < 0.6 && f > 1546 ? "suitcase" : f < 1541 && env > 0.3 ? "envelope" : undefined, tilt: -5 * cs })),
      C("mmePoisson", M1, pose(null, { expr: "dismay", facing: faceTo(18, s, f, M1, P1), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
      ...towerExtras(18, s, f, 2)],
    focus: f < 1526 ? undefined : [6.0, 1.5, 39.5], subj: f < 1540 ? null : undefined,
  };
};
lens(1512, 0, 1); lens(1526, 5, 14);

// ---- S21 (1741-1836) bright morning: "So a month later, / Lustig comes back to Paris, / and guess what he's selling?"
// Lustig strolls back in with his suitcase past three NEW dealers waiting by the leg; he sets the suitcase down beside
// the FOR SALE placard, his fedora slips over one eye, he pushes it back and holds a sly grin at them (1.0 s), ending on
// "selling?" - which loops into frame 1 ("This man is selling the Eiffel Tower").
const LE0: V3 = [16.3, 0, 43.4], LE1: V3 = [13.5, 0, 41.0];
const NEWD: [string, V3][] = [["dealer4", [12.5, 0, 38.3]], ["buyer", [13.4, 0, 37.9]], ["clerk2", [11.6, 0, 38.8]]];
const lusS21 = (f: number) => along([LE0, LE1], 0.05, 1741, f);
SHOT_CAMS[21] = () => [
  K(1741, (f) => { const p = lusS21(f).p, k = sm(f, 1741, 1790); return { pos: [p[0] + lerp(2.6, 1.6, k), lerp(1.7, 1.5, k), p[2] + lerp(4.6, 4.4, k)], look: [p[0] - 0.7, 1.35, p[2] - 1.8], fov: 40 }; }),
  K(1790, F(() => fit([body(LE1, 0, 2.15, 0.36)], 20, -9, 40, 0.62, -0.18, -0.12), 1790, 0.0018), 28),
];
SHOT_ACTS[21] = (f, s) => {
  const L = lusS21(f), down = sm(f, 1786, 1794), slip = sm(f, 1794, 1798), push = sm(f, 1800, 1806);
  let lo: P;
  if (L.moving) lo = { expr: "smug", mode: "walk", phase: ph(f, 16), facing: screenSide(21, s, f, L.d[0], L.d[1]), propR: "suitcase", armR: ARMS.holdR, armRFront: true };
  else if (f < 1800) lo = { expr: slip > 0.5 ? "sheepish" : "smug", facing: faceTo(21, s, f, L.p, NEWD[0][1]), tilt: 10 * down * (1 - slip), propR: down < 0.9 ? "suitcase" : undefined, armR: [[24, 20], [30, lerp(44, 60, down)]] as A2, armRFront: true, hatTilt: 22 * slip, hatLift: -0.05 * slip };
  else lo = { expr: "sly", facing: faceTo(21, s, f, L.p, NEWD[0][1]), hatTilt: 22 * (1 - push), hatLift: -0.05 * (1 - push), armL: push < 1 ? [[-24, -12], [-20, -58]] as A2 : [[-24, 30], [-10, 52]] as A2, armR: [[26, 20], [34, 50]] as A2, headTilt: 3, mouth: f > 1826 ? "smirk" as MouthK : undefined };
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }),
      ...NEWD.map(([who, p], i) => C(who, p, pose(null, { expr: f > 1800 ? "grin" : "talk", facing: faceTo(21, s, f, p, L.p), bob: f > 1800 ? 2 * Math.sin(f * 0.5 + i) : 0, armR: i === 1 ? ARMS.holdR : undefined, propR: i === 1 ? "moneybag" : undefined, armRFront: true }), { idx: 30 + i })),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1), walker(21, s, "paris2", [8, 0, 44.5], [16, 0, 46.5], f, 6, "basket", 1.0)],
    fx: f >= 1792 ? [{ kind: "card", key: "caseDown", pos: [LE1[0] + 0.42, 0.21, LE1[2] + 0.12], w: 0.5, h: 0.42, cw: 160, ch: 128,
      draw: (p) => { p.poly([[14, 40], [146, 40], [150, 122], [10, 122]], "#9a5a2c", 6); p.band([[60, 40], [60, 22], [100, 22], [100, 40]], "#5a3a1e", 9, 3, "round"); p.poly([[40, 56], [52, 56], [52, 72], [40, 72]], "#f2c230", 3); p.poly([[108, 56], [120, 56], [120, 72], [108, 72]], "#f2c230", 3); } }] as FxSpec[] : [],
    focus: [L.p[0], 1.6, L.p[2]],
  };
};
lens(1741, 5, 1); lens(1790, 8, 20);

// =====================================================================================================================
// PARIS BOULEVARD (street). Carriageway x -8.5..8.5 (y 0), sidewalks raised to y 0.14 (SWK), facades x +-16. The tower
// stands at [0, 0, -420] at the end of the axis (-z). Kiosk + "LA TOUR ROUILLE!" board on the left at z -3..-4.5, the
// Café du Boulon on the right (z -6..9), the police station on the left at z 26..41. Car lane x 4 (c.car: z = 72 - 190u).
// Keep-out: STREET_SOLIDS.
// =====================================================================================================================
const SWK = 0.14;
const carZ = (u: number) => 72 - 190 * u;
const NEWS: V3 = [-10.35, SWK, -2.4], LK: V3 = [-9.45, SWK, -1.1], BOARD: V3 = [-10.55, SWK, -4.55];
const streetExtras = (id: number, s: SetDef, f: number): CastPlace[] => [
  chatter("paris1", [-11.9, SWK, 2.6], f, 0, 1), chatter("paris3", [-11.2, SWK, 3.3], f, 1, -1),
  walker(id, s, "paris2", [-12.6, SWK, 12], [-12.6, SWK, -9], f, 2, "basket", 1.1),
  waiterTray(id, s, "waiter", [15.0, SWK, -1.5], [12.4, SWK, 1.4], f, 3),
  walker(id, s, "paris4", [11.8, SWK, -16], [11.8, SWK, 4], f, 4, "basket", 1.0),
];

// ---- S03 (140-196) "It's Paris, / 1925,"
// From high over the boulevard with the tower at the end of the axis (title #2), the camera cranes down past the plane
// trees to the newsstand, where the newsboy is already waving the paper; a limousine rolls past, a couple chats.
SHOT_CAMS[3] = () => [
  K(140, F((f) => { const k = sm(f, 140, 198); return { pos: lerp3([-2.6, 8.6, 20.5], [-6.3, 1.95, 8.6], k), look: lerp3([0, 8.5, -150], [-10.4, 1.55, -2.2], sm(f, 146, 198)), fov: lerp(40, 42, k) }; }, 140, 0.0004)),
];
const newsboy = (f: number, give = 0): CastPlace => {
  const wave = Math.sin(st(f) * 0.55);
  return C("newsboy", NEWS, pose(null, { expr: "laugh", facing: 1, mouth: MOUTHS[Math.floor(st(f, 4) / 4) % MOUTHS.length], propR: "newspaper",
    armR: give > 0.05 ? [[26, 0], [lerp(30, 54, give), lerp(-30, -6, give)]] as A2 : [[24, -10], [30 + 6 * wave, -46 - 6 * wave]] as A2, armRFront: true, bob: 2 * Math.abs(wave) }), { idx: 5 });
};
SHOT_ACTS[3] = (f, s) => ({
  ctl: { car: lerp(0.262, 0.35, lin(f, 140, 196)) },
  cast: [newsboy(f), C("lustig", LK, pose(null, { expr: "neutral", facing: faceTo(3, s, f, LK, BOARD), headTilt: 3 }), { shadow: true }), ...streetExtras(3, s, f)],
  focus: f < 176 ? undefined : [-10.2, 1.4, -2.0], subj: null,
});
lens(140, 0, 1); lens(176, 6, 20);

// ---- S04 (196-306) "and the newspapers say / the tower is rusting / and costs a fortune / to paint."
// Lustig pays the newsboy (coin), takes the paper and snaps it open under the LA TOUR ROUILLE! board; on "paint" he
// lowers it slowly: narrowed, scheming eyes. The camera settles low by the kiosk, then trucks round him to a closer
// three-quarter with the headline board and the tower far down the street behind.
const PAPER_DIR: [number, number] = [Math.sin((62 * Math.PI) / 180), Math.cos((62 * Math.PI) / 180)];
const paperCam = (d: number, y: number, ly: number): { pos: V3; look: V3; fov: number } => ({ pos: [LK[0] + PAPER_DIR[0] * d, y, LK[2] + PAPER_DIR[1] * d], look: [LK[0], ly, LK[2]], fov: 38 });
SHOT_CAMS[4] = () => [
  K(196, hold([-7.25, 0.62, 4.2], [-10.2, 2.0, -3.2], 40, 196, 0.002), 30),
  K(240, F((f) => paperCam(lerp(1.8, 1.62, sm(f, 240, 282)), 1.42, 1.34), 240, 0.0015), 20),
  K(282, F(() => paperCam(2.3, 1.6, 1.55), 282, 0.002, [[294, 0.005, 10]]), 22),
];
SHOT_ACTS[4] = (f, s) => {
  const pay = sm(f, 198, 206) - sm(f, 210, 216), give = sm(f, 206, 214) - sm(f, 218, 222), read = sm(f, 216, 224), lower = sm(f, 286, 296);
  let lo: P;
  if (f < 216) lo = { expr: "neutral", facing: faceTo(4, s, f, LK, NEWS), armR: [[26, 4], [lerp(34, 56, pay), lerp(24, 4, pay)]] as A2, armRFront: true, propR: f > 212 ? "newspaper" : "purse" };
  else lo = pose("paper", { expr: f < 286 ? (f > 262 ? "shock" : "neutral") : "sly", facing: -1, headTilt: lower > 0 ? 4 * lower : 0,
    armR: [[22, lerp(-4, 22, lower)], [26, lerp(-30, 26, lower)]] as A2, armL: [[-22, lerp(-4, 22, lower)], [-26, lerp(-30, 26, lower)]] as A2, armRFront: true, propR: "newspaper", propRAng: 0.05 * read });
  return {
    ctl: { car: lerp(0.35, 0.53, lin(f, 196, 306)) },
    cast: [C("lustig", LK, pose(null, lo), { shadow: true }), newsboy(f, give), ...streetExtras(4, s, f)],
    fx: f >= 222 ? [{ kind: "card", key: "frontPage", pos: [LK[0] + PAPER_DIR[0] * 0.2, lerp(1.32, 0.98, lower), LK[2] + PAPER_DIR[1] * 0.2], w: lerp(0.6, 0.5, lower), h: lerp(0.76, 0.62, lower) * lerp(1, 0.9, sm(f, 222, 226)), rot: 0.04 * Math.sin(f * 0.07), cw: 300, ch: 380,
      draw: (p) => { const g = p.g; g.fillStyle = "#f3ead2"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, 284, 364, 10); g.fill(); g.stroke();
        g.fillStyle = "#241726"; g.textAlign = "center"; g.font = "900 26px Georgia, serif"; g.fillText("LA VOIX DU MATIN", 150, 52); g.fillRect(26, 64, 248, 5);
        g.fillStyle = "#b8352e"; g.font = "900 46px Georgia, serif"; g.fillText("LA TOUR", 150, 116); g.fillText("ROUILLE !", 150, 162);
        g.strokeStyle = "#6b4a2f"; g.lineWidth = 6; g.beginPath(); g.moveTo(150, 186); g.lineTo(108, 330); g.moveTo(150, 186); g.lineTo(192, 330); g.moveTo(124, 270); g.lineTo(176, 270); g.moveTo(134, 228); g.lineTo(166, 228); g.stroke();
        g.fillStyle = "#c8672e"; for (const [x, y] of [[118, 300], [182, 292], [140, 248], [165, 310]]) { g.beginPath(); g.ellipse(x, y, 9, 6, 0.4, 0, 6.3); g.fill(); }
        g.fillStyle = "#6e6458"; for (let i = 0; i < 6; i++) { g.fillRect(28, 196 + i * 22, 62, 6); g.fillRect(210, 196 + i * 22, 62, 6); } } }] as FxSpec[] : [],
    focus: f >= 240 && f < 284 ? [LK[0] + PAPER_DIR[0] * 0.2, 1.32, LK[2] + PAPER_DIR[1] * 0.2] : [LK[0], 1.6, LK[2]], subj: f >= 236 && f < 290 ? null : undefined,
  };
};
lens(196, 6, 10);

// ---- S10 (807-893) "Then he rents a fancy car, / drives them to the tower,"
// Riding the motion: the camera tracks the limousine from behind-left as it rolls down the boulevard toward the tower;
// Lustig drives, Poisson beside him, two dealers stand on the running board waving their hats. The camera climbs and
// swings wider so the tower grows ahead of them.
const carU10 = (f: number) => lerp(0.3, 0.45, lin(f, 800, 900));
const CARX = 4.0;
SHOT_CAMS[10] = () => [
  K(807, (f) => { const z = carZ(carU10(f)), k = sm(f, 807, 893); return { pos: [CARX - lerp(2.4, 1.2, k), lerp(2.1, 3.0, k), z + lerp(8.2, 9.4, k)], look: [CARX + lerp(0.9, 0.2, k), lerp(1.6, 2.5, k), z - lerp(6, 14, k)], fov: 40 }; }),
];
SHOT_ACTS[10] = (f, s) => {
  const z = carZ(carU10(f)), b = 0.025 * Math.sin(f * 1.7);
  const wave = (i: number) => Math.sin(st(f, 2) * 0.7 + i * 1.6);
  return {
    ctl: { car: carU10(f) },
    cast: [
      C("lustig", [CARX + 0.36, 0.96 + b, z + 0.05], pose(null, { expr: "smug", mode: "sit", facing: -1, armR: [[22, 8], [40, 0]], armL: [[-14, 8], [14, 0]], armRFront: true, armLFront: true, hatTilt: 4 }), { shadow: false }),
      C("poisson", [CARX - 0.38, 0.96 + b, z + 0.12], pose(null, { expr: "joy", mode: "sit", facing: -1, armL: ARMS.upL, armLFront: true, mouth: talk(f, 830, 860) })),
      C("dealer2", [CARX - 1.0, 0.42 + b, z + 0.95], pose(null, { expr: "grin", facing: -1, hatLift: 0.14, armL: [[-26, -14], [-24 + 6 * wave(0), -60]] as A2, armR: [[24, 4], [30, -14]] as A2, armRFront: true })),
      C("dealer3", [CARX, 2.08 + b, z + 1.5], pose(null, { expr: "joy", mode: "sit", facing: 1, armR: [[24, -10], [30 + 6 * wave(1), -48]] as A2, armRFront: true, tilt: -4, hatLift: 0.1 })),
      walker(10, s, "paris2", [-12.4, SWK, z + 8], [-12.4, SWK, z - 12], f, 1, "basket", 1.1),
      walker(10, s, "paris4", [12.6, SWK, z - 16], [12.6, SWK, z - 2], f, 2, "basket", 1.0),
      chatter("paris1", [-11.6, SWK, z - 24], f, 3, 1), chatter("paris3", [-11.0, SWK, z - 23.3], f, 4, -1),
    ],
    focus: [CARX, 1.3, z], subj: "lustig",
  };
};
lens(807, 4, 1);

// ---- S20 (1657-1741) lavender dusk: "And Poisson / is too embarrassed / to tell the police."
// Tracking alongside: Poisson marches up to the police station, raises his fist to knock on "embarrassed", freezes,
// pulls his cap down over his eyes and tiptoes away; the gendarme on the step raises an eyebrow, a lamplighter works.
const PB: V3 = [-12.7, SWK, 33.8], GEND: V3 = [-15.35, SWK + 0.68, 31.9];
const poisS20 = (f: number) => f < 1722 ? along([[-11.4, SWK, 37.4], PB], 0.11, 1657, f) : along([PB, [-10.2, SWK, 36.8]], 0.035, 1722, f);
SHOT_CAMS[20] = () => [
  K(1657, (f) => { const p = poisS20(Math.min(f, 1690)).p; return { pos: [-6.1, 1.5, p[2] + 1.2 - 0.6 * sm(f, 1660, 1700)], look: [p[0] - 0.4, 1.45, p[2] - 0.4], fov: 38 }; }),
  K(1694, F((f) => fit([body(poisS20(f).p, 0, 2.05, 0.4), body(GEND, 0, 2.0, 0.3)], 68, 2, 38, 0.82, 0.15, 0.05), 1694, 0.0022), 26),
];
SHOT_ACTS[20] = (f, s) => {
  const P0 = poisS20(f), knock = sm(f, 1690, 1698), cap = sm(f, 1710, 1720);
  let po: P;
  if (f < 1690) po = { expr: "angry", mode: "walk", phase: ph(f, 10), facing: screenSide(20, s, f, P0.d[0], P0.d[1]), armR: [[20, 6], [26, -10]], armRFront: true };
  else if (f < 1710) po = { expr: f < 1700 ? "angry" : "sheepish", facing: faceTo(20, s, f, P0.p, GEND), armR: [[26, -6], [lerp(30, 46, knock), lerp(-8, -24, knock) + (f > 1700 ? 3 * Math.sin(f) : 0)]] as A2, armRFront: true, sweat: f > 1700 ? 0.8 : 0 };
  else if (f < 1722) po = { expr: "sheepish", facing: faceTo(20, s, f, P0.p, GEND), hatTilt: 18 * cap, hatLift: -0.06 * cap, armR: [[22, -10], [lerp(30, 14, cap), lerp(-24, -58, cap)]] as A2, armRFront: true, sweat: 1 };
  else po = { expr: "sheepish", mode: "walk", phase: ph(f, 20), facing: screenSide(20, s, f, P0.d[0], P0.d[1]), hatTilt: 18, hatLift: -0.06, tilt: -4, sweat: 1, armL: [[-20, 10], [-34, 0]], armR: [[20, 10], [34, 0]] };
  const brow = f > 1700 ? "sly" : "neutral";
  return {
    ctl: { lamps: 1 },
    cast: [C("poisson", P0.p, pose(null, po), { shadow: true }), C("gendarme", GEND, pose("hips", { expr: brow as Face, facing: faceTo(20, s, f, GEND, P0.p), headTilt: f > 1702 ? 5 : 0 })),
      walker(20, s, "painter2", [-12.9, SWK, 46], [-12.9, SWK, 38.5], f, 1, "broom", 0.8),
      chatter("paris1", [-11.2, SWK, 26.5], f, 2, 1), chatter("paris3", [-10.6, SWK, 27.2], f, 3, -1)],
    focus: [P0.p[0], 1.6, P0.p[2]], subj: "poisson",
  };
};
lens(1657, 6, 1);

// =====================================================================================================================
// HOTEL DU LYS salon. Room x -4.6..4.6, z -4.2 (windows) .. 5.6 (doors). Table x -0.62..0.62, z -1.5..1.9 (top 0.78),
// chairs x +-0.65..1.25; the tower model at [0.3, 0.78, -0.95]. Head of the table [0, 0, -2.3]; whisper corner
// [2.45 / 3.2, 0, -2.9]. Keep-out: HOTEL_SOLIDS.
// =====================================================================================================================
const HV = 0.06; // arrival walking speed (m/frame)
const ARRIVE: { who: string; f0: number; path: V3[] }[] = [
  { who: "dealer3", f0: 500, path: [[-0.55, 0, 6.0], [-0.55, 0, 4.4], [-1.62, 0, 2.6], [-1.62, 0, -0.85]] },
  { who: "dealer2", f0: 500, path: [[0.55, 0, 6.0], [0.55, 0, 4.4], [1.62, 0, 2.6], [1.62, 0, -0.85]] },
  { who: "poisson", f0: 520, path: [[-1.8, 0, 6.7], [-0.3, 0, 5.2], [-0.55, 0, 4.4], [-1.62, 0, 2.6], [-1.62, 0, 0.75]] },
  { who: "dealer4", f0: 524, path: [[1.8, 0, 6.7], [0.3, 0, 5.2], [0.55, 0, 4.4], [1.62, 0, 2.6], [1.62, 0, 0.75]] },
];
const HEAD: V3 = [0, 0, -2.3], MODEL_P: V3 = [0.3, 0.78, -0.95], BYMODEL: V3 = [0.98, 0, -1.62], CORD: V3 = [1.3, 0, -3.3];
const dealerAt = (who: string, f: number) => { const a = ARRIVE.find((x) => x.who === who)!; return along(a.path, HV, a.f0, f).p; };
/** the arriving / seated-round-the-table dealers (shared by S07-S09) */
const dealers = (id: number, s: SetDef, f: number, mood: (who: string, i: number) => P = () => ({})): CastPlace[] =>
  ARRIVE.map((a, i) => {
    const w = along(a.path, HV, a.f0, f), toL = faceTo(id, s, f, w.p, f < 640 ? HEAD : BYMODEL);
    const invite = f < 620 ? { propR: "invite", armR: [[24, -8], [(34 + 6 * Math.sin(st(f) * 0.5 + i)) , -30]] as A2, armRFront: true } : {};
    if (w.moving) return C(a.who, w.p, pose(null, { expr: "grin", mode: "walk", phase: ph(f + i * 5, 14), facing: screenSide(id, s, f, w.d[0], w.d[1]), ...invite }), { idx: 10 + i });
    return C(a.who, w.p, pose(null, { expr: "smile", facing: toL, ...invite, ...mood(a.who, i) }), { idx: 10 + i });
  });
const hotelCtl = (f: number, extra: Ctl = {}): Ctl => ({ doors: sm(f, 480, 496), curtain: 0, night: 0, ...extra });
const salonExtras = (id: number, s: SetDef, f: number): CastPlace[] => [
  waiterTray(id, s, "waiter", [3.3, 0, 2.9], [2.4, 0, 4.0], f, 0),
  sweeper("paris4", [-3.45, 0, 1.6], f, 1, 1, "broom"),
];

// ---- S07 (510-606) "and invites the city's biggest scrap dealers / to a fancy hotel."
// The double doors swing open and the dealers walk in waving their invitations; the camera trucks along the left side
// of the room with them (they pass it in three-quarter), then swings round to Lustig already waiting at the head of
// the table, who throws his arms wide on "fancy hotel".
const groupLook = (f: number): V3 => {
  const ps = ARRIVE.map((a) => dealerAt(a.who, f)).filter((p) => p[2] < 5.4);
  if (!ps.length) return [0, 1.3, 4.6];
  const c = ps.reduce((m, p) => [m[0] + p[0] / ps.length, 0, m[2] + p[2] / ps.length], [0, 0, 0]);
  return [c[0], 1.3, c[2]];
};
SHOT_CAMS[7] = () => [
  K(510, (f) => { const k = sm(f, 510, 566); return { pos: [lerp(-0.75, -1.3, k), lerp(2.25, 2.1, k), lerp(-3.65, -3.4, k)], look: [lerp(0.15, 0.3, k), lerp(1.35, 1.25, k), lerp(4.2, 2.0, k)], fov: 50 }; }),
  K(548, F((f) => fit([body(HEAD), body(dealerAt("dealer3", f))], -22, 14, 46, 0.84, 0, 0), 548, 0.0016), 46),
];
SHOT_ACTS[7] = (f, s) => {
  const wide = sm(f, 578, 586);
  const lo: P = wide > 0.05
    ? { expr: "grin", armL: [[-30, 20], lerp2([-8, 58], ARMS.wideL[1], wide)] as A2, armR: [[30, 20], lerp2([8, 58], ARMS.wideR[1], wide)] as A2, mouth: talk(f, 584, 594), headTilt: 4 * wide }
    : { expr: "smug", armR: ARMS.reachR, armRFront: true };
  return {
    ctl: hotelCtl(f),
    cast: [C("lustig", HEAD, pose(null, { ...lo, back: f < 566, facing: f < 566 ? 0 : faceTo(7, s, f, HEAD, [-1.6, 0, 2]) }), { shadow: true }), ...dealers(7, s, f), ...salonExtras(7, s, f)],
    focus: f < 566 ? groupLook(f) : [0, 1.5, -2.3], subj: f < 545 ? "dealer3" : f < 590 ? null : undefined,
  };
};
lens(510, 5, 1);

// ---- S08 (606-667) "But how do you sell / something you don't own?"
// Lustig strolls to the model and lays his hand on the tower like an owner (title #4); the dealers lean in. The camera
// glides down to a low angle just over the table top, the model big in the foreground, and keeps drifting right.
const lustigS08 = (f: number) => along([HEAD, [0.75, 0, -2.0], BYMODEL], 0.05, 612, f);
SHOT_CAMS[8] = () => [
  K(606, F((f) => fit([[MODEL_P, 0, 0.55, 0.28], body(lustigS08(f).p)], lerp(8, -2, sm(f, 606, 667)), 5, 42, 0.8, 0, 0.05), 606, 0.0018), 34),
];
SHOT_ACTS[8] = (f, s) => {
  const L = lustigS08(f), pat = f >= 642 ? Math.sin((f - 642) * 0.5) * (f < 662 ? 1 : 0) : 0;
  const lo: P = L.moving ? { expr: "smug", mode: "walk", phase: ph(f, 14), facing: screenSide(8, s, f, L.d[0], L.d[1]) }
    : { expr: f < 650 ? "smug" : "sly", facing: faceTo(8, s, f, L.p, MODEL_P), armR: [[30, 8], [lerp(40, 62, sm(f, 636, 642)), 18 + 4 * pat]] as A2, armRFront: true, headTilt: 3 };
  return {
    ctl: hotelCtl(f),
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }), ...dealers(8, s, f, (who, i) => ({ expr: "talk", tilt: 6 * faceTo(8, s, f, dealerAt(who, f), MODEL_P) * sm(f, 640, 652), mouth: f > 646 && i === 2 ? "O" : undefined })), ...salonExtras(8, s, f)],
    focus: [MODEL_P[0], 1.05, MODEL_P[2]],
  };
};
lens(606, 7, 14);

// ---- S09 (667-807) "First, he tells them it's top secret, / 7,000 tons of iron, / going to the highest bidder."
// A: over Poisson's shoulder (back view): Lustig puts a finger to his lips, hurries to the window and yanks the curtain
// shut on "secret" (the room darkens). HARD CUT 1 on "7,000": a low reverse from the window end, the dealers' eyes pop;
// "highest bidder": hands shoot up, one dealer hops; the camera cranes up and trucks left along them.
const lustigS09 = (f: number) => along([BYMODEL, [1.4, 0, -2.6], CORD], 0.1, 690, f);
SHOT_CAMS[9] = () => [
  K(667, F((f) => { const L = lustigS09(f).p; return fit([body(L), body(dealerAt("poisson", f), 0, 2.05, 0.4)], -35, 7, 44, 0.86, 0.15, 0); }, 667, 0.0012), 26),
  K(733, F((f) => fit([body([1.62, 0, -0.85]), body([1.62, 0, 0.75])], lerp(152, 140, sm(f, 740, 807)), lerp(6, 10, sm(f, 750, 807)), 44, 0.86, 0, 0), 733, 0.0016, [[733, 0.006, 10]]), 1, true),
];
SHOT_ACTS[9] = (f, s) => {
  const L = lustigS09(f), yank = sm(f, 706, 714);
  let lo: P;
  if (f < 690) lo = { expr: "sly", facing: faceTo(9, s, f, L.p, dealerAt("poisson", f)), armR: ARMS.shushR, armRFront: true, headTilt: -3 };
  else if (L.moving) lo = { expr: "determined", mode: "walk", phase: ph(f, 10), facing: screenSide(9, s, f, L.d[0], L.d[1]) };
  else lo = { expr: "smug", facing: faceTo(9, s, f, L.p, [0, 0, 0]), armR: [[24, -10], [30, lerp(-50, -10, yank)]] as A2, armRFront: false };
  const pop = f >= 733, bid = f >= 778;
  const mood = (who: string, i: number): P => {
    if (!pop) return { expr: f > 712 ? "dismay" : "talk", back: who === "poisson" && f < 733 };
    if (!bid) return { expr: "shock", squash: f < 740 ? 0.25 * Math.exp(-(f - 733) / 3) : 0, bob: 0 };
    const hop = who === "dealer2" ? Math.abs(Math.sin((f - 778) * 0.35)) * 6 : 0;
    return { expr: i % 2 ? "joy" : "grin", armR: ARMS.upR, armRFront: true, propR: "invite", bob: -hop, mouth: MOUTHS[(Math.floor(f / 4) + i) % MOUTHS.length] };
  };
  return {
    ctl: hotelCtl(f, { curtain: yank }),
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }), ...dealers(9, s, f, mood), ...salonExtras(9, s, f)],
    focus: f < 733 ? [L.p[0], 1.6, L.p[2]] : [1.62, 1.5, -0.05], subj: f < 733 ? undefined : "dealer2",
  };
};
lens(667, 6, 1); lens(733, 3, 1);

// ---- S14 (1111-1231) night blue: "So Lustig leans in and whispers, / he's a poor official, / and he'd like a little bribe."
// A: over Poisson's shoulder (back view) in the lamp-lit window corner, the lit tower outside: Lustig leans in with a
// cupped hand. B (poor official): the camera drifts round to a profile two-shot; he turns out an empty pocket, then
// pinches his fingers on "little bribe" while Poisson's eyes narrow. A waiter clears glasses behind them.
const WA: V3 = [2.45, 0, -2.95], WB: V3 = [3.2, 0, -2.8];
SHOT_CAMS[14] = () => [
  K(1111, hold([4.0, 1.78, -1.25], [2.45, 1.5, -3.05], 38, 1111, 0.0015)),
  K(1158, F(() => fit([body(WA), body(WB, 0, 2.05, 0.4)], 8, 2, 34, 0.8, 0, 0), 1158, 0.0022, [[1200, 0.0045, 18]]), 34),
];
SHOT_ACTS[14] = (f, s) => {
  const lean = sm(f, 1118, 1130) - sm(f, 1156, 1164);
  let lo: P;
  if (f < 1160) lo = { expr: "sly", facing: faceTo(14, s, f, WA, WB), tilt: 9 * lean, armR: ARMS.cupR, armRFront: true, mouth: talk(f, 1130, 1156) };
  else if (f < 1196) lo = { expr: "sheepish", facing: faceTo(14, s, f, WA, WB), armL: ARMS.palmL, armR: ARMS.palmR, armLFront: true, armRFront: true, mouth: talk(f, 1164, 1180), headTilt: -4 };
  else lo = { expr: "sly", facing: faceTo(14, s, f, WA, WB), tilt: 5, armR: ARMS.pinchR, armRFront: true, mouth: talk(f, 1200, 1216) };
  const po: P = f < 1158 ? { back: true, expr: "neutral", headTilt: -6 * lean }
    : { expr: f < 1196 ? "dismay" : "sly", facing: faceTo(14, s, f, WB, WA), armR: f >= 1205 ? [[20, 14], [16, -12]] as A2 : undefined, armRFront: true, headTilt: f >= 1205 ? 4 : 0 };
  return {
    ctl: { night: 1, curtain: 0, doors: 0 },
    cast: [C("lustig", WA, pose(null, lo), { shadow: true }), C("poisson", WB, pose(null, po)),
      C("waiter", [1.15, 0, -3.15], pose(null, { expr: "neutral", facing: -1, armR: [[24, 20], [30 + 6 * Math.sin(st(f) * 0.4), 34]], armRFront: true, propR: "tray" }), { idx: 40 })],
    focus: [2.8, 1.5, -2.9],
  };
};
lens(1111, 7, 1);

// ---- S15 (1231-1260) "That's the trick!"  HARD CUT 2: low angle with a 4 deg roll: Poisson's face lights up, he
// snaps his fingers and points at Lustig; the table lamp flares (glow card).
SHOT_CAMS[15] = () => [K(1231, hold([2.55, 0.72, -1.35], [3.05, 1.62, -2.85], 40, 1231, 0.0035, [[1236, 0.008, 10]], 0.07), 1, true)];
SHOT_ACTS[15] = (f, s) => ({
  ctl: { night: 1, curtain: 0, doors: 0 },
  cast: [C("poisson", WB, pose(null, { expr: "eureka", facing: faceTo(15, s, f, WB, WA), armR: f < 1238 ? [[22, -6], [26, -40]] as A2 : ARMS.reachR, armRFront: true, squash: f < 1240 ? 0.2 * Math.exp(-(f - 1233) / 3) : 0 })),
    C("lustig", WA, pose(null, { expr: "smug", facing: faceTo(15, s, f, WA, WB), armR: ARMS.pinchR, armRFront: true }))],
  fx: [{ kind: "card", key: "lampFlare", pos: [3.78, 1.25, -3.6], w: 1.4 * (1 + 0.6 * Math.exp(-Math.max(0, f - 1233) / 6)), h: 1.4 * (1 + 0.6 * Math.exp(-Math.max(0, f - 1233) / 6)), soft: true, cw: 128, ch: 128,
    draw: (p) => { const g = p.g.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, "rgba(255,226,150,0.95)"); g.addColorStop(1, "rgba(255,190,90,0)"); p.g.fillStyle = g; p.g.fillRect(0, 0, 128, 128); } }] as FxSpec[],
  focus: [3.2, 1.6, -2.8], subj: "poisson",
});
lens(1231, 4, 1);

// =====================================================================================================================
// MINISTERE DES POSTES at night. Counter along x (public face z -0.2, top 1.05, grille to 2.4), clerks behind at
// z -1.62 (x -2.4 / 0 / 2.4); queue lane x 0, z 0.42..3.0; Lustig at the end [0, 0, 3.85]. Keep-out: MINISTRY_SOLIDS.
// =====================================================================================================================
// ---- S16 (1260-1376) "In Paris, real officials took bribes, / so asking for one / made him look real."
// A: a long lateral track along the counter from behind the queue: at each window a citizen slides an envelope under
// the grille, the clerk palms it into his drawer, the middle clerk thumps the APPROVE stamp. B (asking for one): the
// camera cranes down to the end of the queue, where Lustig stands among the citizens and tips his hat to the clerk,
// who nods back: he fits right in.
const CLK: V3[] = [[-2.4, 0, -1.62], [0, 0, -1.62], [2.4, 0, -1.62]], CIT: V3[] = [[-2.4, 0, 0.42], [0, 0, 0.42], [2.4, 0, 0.42]];
const LQ: V3 = [0.45, 0, 3.9];
SHOT_CAMS[16] = () => [
  K(1260, track((f) => [lerp(-3.1, -1.3, sm(f, 1286, 1316)), 1.85, 2.7], (f) => [lerp(-2.35, -0.05, sm(f, 1292, 1304)), 1.38, -1.1], 38, 1260, 0.0012)),
  K(1316, F(() => fit([body(LQ, 0, 2.1, 0.34), body([0, 0, 3.0])], -40, 4, 44, 0.8, 0, 0), 1316, 0.002, [[1355, 0.004, 14]]), 30),
];
SHOT_ACTS[16] = (f, s) => {
  const hand = (i: number) => { const a = 1266 + i * 16; return { give: sm(f, a, a + 6) - sm(f, a + 12, a + 16), take: sm(f, a + 8, a + 12) - sm(f, a + 16, a + 22) }; };
  const cit = ["paris3", "paris2", "paris1"].map((who, i) => {
    const h = hand(i);
    return C(who, CIT[i], pose(null, { expr: "sly", facing: faceTo(16, s, f, CIT[i], CLK[i]), armR: [[26, 10], [lerp(34, 60, h.give), lerp(30, 4, h.give)]] as A2, armRFront: true, propR: h.give > 0.2 ? "envelope" : undefined, headTilt: -3 * h.give }), { idx: 20 + i });
  });
  const clk = ["clerk1", "clerk2", "clerk3"].map((who, i) => {
    const h = hand(i), nod = i === 1 && f > 1350 ? Math.sin((f - 1350) * 0.4) * Math.exp(-(f - 1350) / 20) : 0;
    const stampArm = i === 1 && f >= 1294 && f < 1310 ? { armL: [[-20, -8], [-26, lerp(-30, 10, sm(f, 1296, 1301)) + lerp(0, -30, sm(f, 1302, 1308))]] as A2, armLFront: true } : {};
    return C(who, CLK[i], pose(null, { expr: h.take > 0.3 ? "smug" : i === 1 && f > 1350 ? "smug" : "neutral", facing: faceTo(16, s, f, CLK[i], i === 1 && f > 1340 ? LQ : CIT[i]), armR: [[26, 6], [lerp(30, 54, h.take), lerp(20, 2, h.take)]] as A2, armRFront: true, propR: h.take > 0.4 ? "envelope" : undefined, headTilt: 5 * nod, ...stampArm }), { idx: 30 + i });
  });
  const tip = sm(f, 1352, 1360) - sm(f, 1368, 1374);
  return {
    ctl: { drawers: sm(f, 1282, 1330), stamp: lin(f, 1296, 1306) },
    cast: [C("lustig", LQ, pose(null, { expr: f > 1345 ? "smug" : "neutral", facing: faceTo(16, s, f, LQ, CLK[1]), hatLift: 0.16 * tip, hatTilt: -10 * tip, ...(tip > 0.05 ? { armL: [[-30, -14], [-22, -62]] as A2 } : { armR: ARMS.holdR, propR: "envelope", armRFront: true }) }), { shadow: true }),
      ...cit, ...clk,
      idler("buyer", [0, 0, 1.3], f, 1, -1, { expr: "neutral" }), idler("newsboy", [0, 0, 2.15], f, 2, 1, { expr: "smile" }), idler("paris4", [0, 0, 3.0], f, 3, -1, { expr: "neutral", propR: "envelope", armR: ARMS.holdR, armRFront: true })],
    focus: f < 1318 ? [lerp(-2.35, -0.05, sm(f, 1292, 1304)), 1.5, -1.0] : [0, 1.6, 3.85], subj: f < 1340 ? null : undefined,
  };
};
lens(1260, 5, 1); lens(1318, 7, 16);

// =====================================================================================================================
// STUDY (Lustig's attic, night). Round window (centre [0, 1.6, -2.8]) with Paris and the lit tower outside; the press
// bench runs front-to-back at x 0.45..1.3 (lever on its -x side); writing desk left. Keep-out: STUDY_SOLIDS.
// =====================================================================================================================
const PRESS: V3 = [-0.02, 0, -1.48];
// ---- S06 (430-510) "So con man Victor Lustig / prints fake government letters"
// Low and drifting sideways along the bench: Lustig, in profile against the moonlit window, hauls the press lever down
// with both hands (thunk + kick), peels out the fresh sheet and holds it up: an official crest. The camera rises to a
// high angle onto the forged letters; a neighbour waters her plant in the lit dormer across the street.
SHOT_CAMS[6] = () => [
  K(430, (f) => { const k = sm(f, 430, 484); return { pos: [lerp(-0.95, -0.5, k), lerp(0.62, 0.78, k), lerp(0.8, 0.6, k)], look: [-0.02, 1.42, -1.5], fov: 44 }; }),
  K(484, F(() => ({ pos: [-0.45, 2.4, -0.05], look: [0.2, 1.2, -1.45], fov: 42 }), 484, 0.0022), 22),
];
SHOT_ACTS[6] = (f, s) => {
  const pull = sm(f, 470, 479) - sm(f, 482, 492), peel = sm(f, 492, 500), show = sm(f, 498, 506);
  let lo: P;
  if (f < 466) lo = { expr: f > 452 ? "smug" : "sly", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), headTilt: f > 452 ? -3 : 0, armR: [[24, 10], [40, 0]], armRFront: true, mouth: undefined };
  else if (f < 492) lo = { expr: "strain", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), tilt: 8 * pull, armR: [[26, lerp(-14, 10, pull)], [44, lerp(-36, 22, pull)]] as A2, armL: [[18, lerp(-10, 12, pull)], [40, lerp(-34, 22, pull)]] as A2, armRFront: true, armLFront: true, squash: f > 478 && f < 486 ? 0.06 : 0 };
  else lo = { expr: show > 0.5 ? "sly" : "determined", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), armR: [[24, lerp(10, -10, show)], [lerp(44, 36, show), lerp(10, -40, show)]] as A2, armRFront: true, propR: peel > 0.4 ? "letter" : undefined, headTilt: 4 * show };
  return {
    ctl: { press: pull, sheet: peel, stamp: 0, lamp: 1 },
    cast: [C("lustig", PRESS, pose(null, lo), { shadow: true }),
      idler("paris4", s.marks.neighbour ?? [0.55, -0.85, -8.02], f, 1, -1, { armR: [[22, 10], [34 + 4 * Math.sin(st(f) * 0.3), 4]] as A2, armRFront: true, expr: "smile" })],
    focus: [0.1, 1.4, -1.48],
  };
};
lens(430, 5, 1);

// =====================================================================================================================
// CAR LOT (modern, night). Hero car side-on at [0, 0, 0.4] (x -2..2, front +x), scratch on its +z front door, rear
// bumper at x -2.05. Keep-out: CARLOT_SOLIDS.
// =====================================================================================================================
const SAL: V3 = [-0.3, 0, 1.75], BUY: V3 = [1.2, 0, 1.95];
// ---- S17 (1376-1512) "It's like a salesman who admits his car has a scratch. / Suddenly, you believe everything else."
// The camera cranes down past the bulb strings to the salesman, who leans in with a magnifier and points out a tiny
// scratch (it sparkles); it tracks along the door to the scratch, then pulls back as the buyer lights up, nods and
// pumps his hand - while behind them the rear bumper sags and drops off. A mechanic and a couple browse the lot.
SHOT_CAMS[17] = () => [
  K(1376, (f) => { const k = sm(f, 1376, 1412); return { pos: [lerp(1.6, 0.6, k), lerp(5.2, 1.55, k), lerp(9.2, 5.6, k)], look: [lerp(0.4, 0.45, k), lerp(0.4, 1.15, k), lerp(-1.0, 1.6, k)], fov: 42 }; }),
  K(1410, F(() => ({ pos: [0.75, 1.05, 3.05], look: [0.35, 0.78, 1.35], fov: 34 }), 1410, 0.003, [[1428, 0.006, 12]]), 26),
  K(1438, F(() => fit([body(SAL), body(BUY), [[-2.05, 0, 0.6], 0, 0.6, 0.3]], -24, 5, 40, 0.88, 0, 0.05), 1438, 0.0016), 56),
];
SHOT_ACTS[17] = (f, s) => {
  const point = sm(f, 1400, 1412), shake = f > 1468 ? Math.sin((f - 1468) * 0.9) * 6 : 0, lit = f >= 1452;
  return {
    ctl: { scratchGlow: sm(f, 1418, 1432) - 0.6 * sm(f, 1460, 1480), bumper: lin(f, 1462, 1492) },
    cast: [
      C("salesman", SAL, pose(null, { expr: f < 1452 ? "sheepish" : "grin", facing: faceTo(17, s, f, SAL, BUY), mouth: talk(f, 1392, 1440), tilt: 8 * point * (f < 1452 ? 1 : 0),
        armR: f < 1466 ? [[26, 8], [lerp(34, 50, point), lerp(26, 22, point)]] as A2 : [[26, 8], [44, 6 + shake]] as A2, armRFront: true, propR: f < 1464 ? "magnifier" : undefined })),
      C("buyer", BUY, pose(null, { expr: lit ? (f > 1466 ? "joy" : "eureka") : "neutral", facing: faceTo(17, s, f, BUY, f < 1440 ? [0.4, 0, 1.3] : SAL), tilt: f < 1446 ? -6 * point : 0, headTilt: f > 1468 ? 5 * Math.sin(f * 0.5) : 0,
        armL: f > 1466 ? [[-26, 8], [-44, 6 - shake]] as A2 : undefined, armLFront: true })),
      C("mechanic", [-2.6, 0, -7.1], pose(null, { expr: "neutral", facing: 1, tilt: 4 * Math.sin(st(f) * 0.3), armR: [[24, 20], [34 + 6 * Math.sin(st(f) * 0.4), 40]] as A2, armRFront: true, propR: "tongs" }), { idx: 60 }),
      chatter("paris1", [2.35, 0, -2.15], f, 1, 1), chatter("paris3", [3.0, 0, -2.3], f, 2, -1),
      C("dealer4", [-1.2, 0, -3.25], pose(null, { expr: "neutral", mode: "kick", facing: 1, phase: ph(f, 24) }), { idx: 61 }),
    ],
    focus: f < 1410 ? [0.45, 1.2, 1.8] : f < 1450 ? [0.4, 0.75, 1.35] : [0.4, 1.3, 1.8], subj: f < 1410 ? "salesman" : f < 1472 ? null : "buyer",
  };
};
lens(1376, 4, 1); lens(1410, 9, 12); lens(1450, 5, 14);

// =====================================================================================================================
// TRAIN compartment at golden dusk (runs along +x; window wall z -1.15, corridor partition z +1.15). Lustig sits on
// bench A (x -0.84), the suitcase on the seat beside him at [-0.78, 0.66, 0]. Keep-out: TRAIN_SOLIDS.
// =====================================================================================================================
const LSIT: V3 = [-0.84, 0.36, -0.78], CASE_TOP: V3 = [-0.78, 0.7, 0.0];
/** the payoff: banknotes burst out of the case and flutter round the compartment (fx cards, no ink) */
const notes = (f: number, f0: number, n = 46): FxSpec[] => {
  const out: FxSpec[] = [];
  for (let i = 0; i < n; i++) {
    const t = f - (f0 + i * 0.55); if (t < 0) continue;
    const r1 = Math.sin(i * 12.9898) * 43758.5453 % 1, r2 = Math.sin(i * 78.233) * 12345.678 % 1, r3 = Math.sin(i * 39.425) * 9876.54 % 1;
    const a = Math.abs(r1), b = Math.abs(r2), c = Math.abs(r3);
    const e = 1 - Math.exp(-t / 9);
    const y = Math.max(0.05, CASE_TOP[1] + (0.8 + 1.1 * a) * e - 0.008 * t + 0.04 * Math.sin(t * 0.25 + i));
    out.push({ kind: "card", key: "note" + (i % 3), pos: [CASE_TOP[0] + (-0.15 + 1.5 * b) * e + 0.05 * Math.sin(t * 0.2 + i), y, CASE_TOP[2] + (-0.9 + 1.7 * c) * e], w: 0.2, h: 0.1, rot: t * (i % 2 ? 0.16 : -0.13) + i, cw: 96, ch: 48,
      draw: (p) => { const g = p.g; g.fillStyle = ["#bfe3a6", "#e9d9a8", "#a8cce8"][i % 3]; g.strokeStyle = "#241726"; g.lineWidth = 5; g.beginPath(); g.roundRect(4, 4, 88, 40, 5); g.fill(); g.stroke();
        g.fillStyle = "rgba(36,23,38,0.55)"; g.beginPath(); g.ellipse(48, 24, 10, 10, 0, 0, 6.3); g.fill(); g.font = "900 16px Georgia"; g.fillText("100", 12, 22); } });
  }
  return out;
};
// ---- S19 (1573-1657) PAYOFF: "Within an hour, Lustig is on a train / to Vienna, / counting cash."
// A: three-quarter on Lustig at the window with the countryside streaming past; he snaps the suitcase open and the
// banknotes burst up and fill the compartment (gold flash, half the frame for 2.2 s); the passenger opposite lowers
// his newspaper. HARD CUT 3 on "Vienna": a low closer angle inside the storm of notes, Lustig licks his thumb and counts.
SHOT_CAMS[19] = () => [
  K(1573, F((f) => ({ pos: [lerp(0.55, 0.35, sm(f, 1573, 1625)), lerp(1.95, 1.7, sm(f, 1573, 1625)), lerp(1.0, 0.8, sm(f, 1573, 1625))], look: [-0.5, 1.0, -0.6], fov: 44 }), 1573, 0.0012)),
  K(1625, F(() => ({ pos: [0.2, 1.38, 0.15], look: [-0.84, 1.3, -0.78], fov: 40 }), 1625, 0.0025), 1, true),
];
SHOT_ACTS[19] = (f, s) => {
  const open = sm(f, 1584, 1592), count = f >= 1630;
  const lo: P = !count
    ? { mode: "sit", expr: open > 0.5 ? "joy" : "sly", facing: faceTo(19, s, f, LSIT, CASE_TOP), armR: [[26, 10], [lerp(36, 50, open), lerp(30, 0, open)]] as A2, armRFront: true, headTilt: 4 * open, mouth: open > 0.5 ? "laugh" : undefined }
    : { mode: "sit", expr: "smug", facing: faceTo(19, s, f, LSIT, lerp3(CASE_TOP, [0.5, 1.2, 0.5], sm(f, 1630, 1640))), propL: "cash", armL: [[-22, 10], [lerp(-40, -14, sm(f, 1630, 1637)), lerp(10, -6, sm(f, 1630, 1637))]] as A2, armLFront: true,
      armR: [[lerp(26, 22, sm(f, 1630, 1637)), lerp(10, 4, sm(f, 1630, 1637))], [lerp(50, lerp(10, 18, Math.abs(Math.sin((f - 1630) * 0.6))), sm(f, 1630, 1637)), lerp(0, lerp(-30, -8, Math.abs(Math.sin((f - 1630) * 0.6))), sm(f, 1630, 1637))]] as A2, armRFront: true, mouth: f < 1636 ? "lick" : talk(f, 1638, 1657) };
  const pp: P = f < 1596 ? { mode: "sit", expr: "neutral", facing: -1, propR: "newspaper", armR: [[22, 0], [26, -24]] as A2, armRFront: true }
    : { mode: "sit", expr: "shock", facing: -1, propR: "newspaper", armR: [[22, 14], [26, 22]] as A2, armRFront: false, squash: f < 1602 ? 0.15 : 0 };
  return {
    ctl: { case: open, lean: 0.4 * Math.sin(f * 0.07), door: 0 },
    cast: [C("lustig", LSIT, pose(null, lo), { shadow: false }), C("dealer3", [0.84, 0.36, -0.78], pose(null, pp), { idx: 2 }),
      C("clerk2", [0.84, 0.36, 0.75], pose(null, { mode: "sit", expr: "blank", facing: -1, headTilt: 10 + 2 * Math.sin(f * 0.1) }), { idx: 3 })],
    fx: notes(f, 1589),
    focus: [-0.8, 1.15, -0.7], subj: null,
  };
};
lens(1573, 6, 1); lens(1625, 5, 1);

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
