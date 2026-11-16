// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "He Made Giant Bricks to Pay Half the Tax",
// set-local coordinates, absolute frames. Master prompt v13: 10 scene ids in two places (the groves, the cellar);
// smooth acting (flow beats with 6-frame face transitions), lip-sync only on the three quoted lines (talk.json),
// a life layer on every character (97_life.ts), 3 hard cuts, calm stretches of 3-5 s.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF, KICKS, SUN_REF } from "./story";
import POSES from "./poses.json";
import MOUTHF from "./mouths.json";
import { getInputProps } from "remotion";
/** thumbnail mode (inputProps.thumb): scene 1 is staged as the cover still */
const THUMB = !!(getInputProps() as { thumb?: boolean }).thumb;
import type { MouthK } from "./toon";
import { YARD } from "./sets/brickyard";
import { VIL } from "./sets/village";
import { OFFICE, INN } from "./sets/rooms";

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
/** v10.8: a speaker's mouth changes on every frame of the line, matched to the voice track (leads it by 1 frame) */
const MF = MOUTHF as unknown as MouthK[];
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? (MF[f] ?? "dash") : undefined);
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
/** v14 r7 (kit: camera too static, 18% of frames clearly moving vs Rick's 54-72%): every held framing also arcs slowly
 *  round its aim point (0.11 deg/frame, the side alternating shot to shot) and creeps in 1.5x faster, capped at 0.3 %/f;
 *  key-word punches (KEY_PUNCH) give it a 6-frame push on the beat. */
const ORBIT = 0.0019, KEY_PUNCH: number[] = [], KEY_NUDGE: number[] = [96, 214, 366, 672, 786, 849, 1182, 1470, 1563, 1600];   // r26b: 1248 -> 1182 (it trucked the scale out of the shed frame; parity kept)
const F = (g: (f: number) => { pos: V3; look: V3; fov: number }, f0: number, rate = 0.0018, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const c = g(f), r2 = Math.min(0.0035, rate * 1.8);
  const auto: [number, number, number][] = KEY_PUNCH.filter((p) => p >= f0 && p <= f + 8 && !punches.some((q) => Math.abs(q[0] - p) < 6)).map((p) => [p - 4, 0.007, 7]);
  const k = creep(f, f0, r2, [...punches, ...auto]);
  const p0 = lerp3(c.look, c.pos, k), side = (Math.floor(f0 / 7) % 2 ? 1 : -1), a = side * 0.12 * Math.tanh(ORBIT * Math.max(0, f - f0) / 0.12);   // saturates at ~4 deg: long holds keep their framing
  const dx = p0[0] - c.look[0], dz = p0[2] - c.look[2], ca = Math.cos(a), sa = Math.sin(a);
  // r17 (kit: too few moves, too many push-ins, long still holds): small sideways trucks on key words, alternating sides
  let tr = 0; KEY_NUDGE.forEach((n, i) => { if (n >= f0 && n <= f + 12) tr += (i % 2 ? 1 : -1) * 0.075 * smooth((f - (n - 4)) / 10); });
  const fl = Math.hypot(dx, dz) || 1, rx = -dz / fl, rz = dx / fl;
  return { pos: [c.look[0] + dx * ca - dz * sa + rx * tr, p0[1], c.look[2] + dx * sa + dz * ca + rz * tr], look: [c.look[0] + rx * tr, c.look[1], c.look[2] + rz * tr], fov: c.fov, roll };
};
/** F plus a slow sideways truck (m/frame, + = screen right): camera and aim slide together for parallax on holds */
const FS = (g: (f: number) => { pos: V3; look: V3; fov: number }, f0: number, rate: number, slide: number, punches: [number, number, number][] = [], c0 = f0) => (f: number): Shot => {
  const s = F(g, f0, rate, punches)(f), dx = s.look[0] - s.pos[0], dz = s.look[2] - s.pos[2], L = Math.hypot(dx, dz) || 1, o = slide * (f - c0);
  const r: V3 = [(-dz / L) * o, 0, (dx / L) * o];
  return { ...s, pos: [s.pos[0] + r[0], s.pos[1], s.pos[2] + r[2]], look: [s.look[0] + r[0], s.look[1], s.look[2] + r[2]] };
};

export const SHOT_CAMS: Record<number, (s: SetDef) => Key[]> = {};
export const SHOT_ACTS: Record<number, (f: number, s: SetDef) => Act> = {};
const camAt = (id: number, s: SetDef, f: number) => run(SHOT_CAMS[id](s), f);
/** screen-right sign of a world xz direction for the shot's camera at frame f */
const screenSide = (id: number, s: SetDef, f: number, dx: number, dz: number) => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]];
  const cr = -d[1] * dx + d[0] * dz, dt = d[0] * dx + d[1] * dz, n = Math.hypot(d[0], d[1]) * Math.hypot(dx, dz) || 1;
  const sg = Math.sign(cr) || 1, lat = Math.abs(cr) / n;
  // v10.16 A1 (board AO): looking across the frame = a full 3/4 turn toward that side; looking at the camera = front-on;
  // looking into the scene = a half turn (cards never show the back of the head)
  return sg * (lat > 0.7 ? 1 : lat > 0.35 ? 0.5 : dt < 0 ? 0 : 0.5);   // ~half the faces end up in full 3/4
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
  const facing = Math.sign(screenSide(id, s, f, dx, dz)) || 1;
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
  const facing = (w.moving ? Math.sign(screenSide(id, s, f, w.d[0], w.d[1])) : screenSide(id, s, f, w.d[0], w.d[1])) || 1;
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
// ---------------- v14 r5 framing helpers (subject first: head width % of the frame, screen x %, eyes ~40% down) ----------------
const HEAD_M = 0.52;
/** a camera on one head: yaw (deg, 0 = camera on +z looking -z, 90 = camera on +x looking -x), head width hw (0..1 of the
 *  frame width), head centre at screen x% xp, lens dy metres above the head (looking slightly down), eyes at ~40% height */
const frameOn = (head: V3, yaw: number, hw: number, xp = 50, fov = 52, dy = 0.2, eyeY = 0.4): CamT => {
  const th = Math.tan((fov * Math.PI) / 360), d = HEAD_M / (hw * 2 * 0.5625 * th), a = (yaw * Math.PI) / 180;
  const bx = Math.sin(a), bz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a);          // back vector and screen-right vector
  const pos: V3 = [head[0] + bx * d, head[1] + dy, head[2] + bz * d];
  const off = ((xp - 50) / 50) * th * 0.5625 * d, vy = (0.5 - eyeY) * 2 * th * d;        // lateral shift of the look, vertical
  return { pos, look: [head[0] - rx * off, head[1] - vy + dy * 0.0, head[2] - rz * off], fov, roll: 0 };
};
/** a camera on two heads A (screen x% xa) and B (screen x% xb), from yaw; the lens height dy above the mean head */
const frameTwo = (A: V3, B: V3, yaw: number, xa: number, xb: number, fov = 52, dy = 0.25, eyeY = 0.42): CamT => {
  const a = (yaw * Math.PI) / 180, rx = Math.cos(a), rz = -Math.sin(a), bx = Math.sin(a), bz = Math.cos(a), th = Math.tan((fov * Math.PI) / 360) * 0.5625;
  // lateral separation of the heads along screen-right, and their depth difference along the view axis
  const sep = (B[0] - A[0]) * rx + (B[2] - A[2]) * rz, ddep = -((B[0] - A[0]) * bx + (B[2] - A[2]) * bz);
  // solve for the depth dA of A so that the screen positions land: xA = 50 + 50*(lA/(th*dA)), xB with dB = dA + ddep
  let lo = 0.6, hi = 30; for (let i = 0; i < 50; i++) { const dA = (lo + hi) / 2, dB = dA + ddep, lA = -((50 - xa) / 50) * th * dA, xbN = 50 + 50 * ((lA + sep) / (th * Math.max(0.2, dB)));
    if ((xbN - xa) / (xb - xa) > 1) lo = dA; else hi = dA; }
  const dA = (lo + hi) / 2, lA = -((50 - xa) / 50) * th * dA;
  const cx = A[0] - rx * lA + bx * dA, cz = A[2] - rz * lA + bz * dA, my = (A[1] + B[1]) / 2;
  const D = Math.max(0.8, dA + ddep / 2), vy = (0.5 - eyeY) * 2 * Math.tan((fov * Math.PI) / 360) * D;
  return { pos: [cx, my + dy, cz], look: [cx - bx * D, my - vy, cz - bz * D], fov, roll: 0 };
};

// ---------------- 2D cartoon effect cards (flat sprites in the 3D scene, plum ink like the characters) ----------------
const INKC = "#241726";
const rnd1 = (i: number, s = 12.9898) => { const x = Math.sin(i * s) * 43758.5453; return x - Math.floor(x); };
/** soft painted dust cloud (ochre, lit top, violet underside), a = opacity 0..1, seed picks the shape */
const dustCard = (key: string, pos: V3, w: number, a: number, seed = 1, rot = 0): FxSpec => ({
  kind: "card", key: "dust" + (seed % 5), pos, w, h: w * 0.72, rot, soft: true, cw: 192, ch: 140, op: Math.max(0, Math.min(1, a)),
  draw: (p) => {
    const g = p.g; g.globalAlpha = 1;
    const blobs: [number, number, number][] = [];
    for (let i = 0; i < 7; i++) blobs.push([36 + 120 * rnd1(i + seed * 7), 52 + 46 * rnd1(i + seed * 3, 78.233), 26 + 22 * rnd1(i + seed, 39.4)]);
    for (const [x, y, r] of blobs) { g.fillStyle = "#b9a48a"; g.beginPath(); g.arc(x, y + 6, r, 0, 6.3); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = "#e3cfa6"; g.beginPath(); g.arc(x, y, r * 0.92, 0, 6.3); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = "#f6e8c8"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.3, r * 0.5, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
  },
});
/** v14 5.13 time-jump steam: a soft white cloud card (the yard side of the tea-steam dissolve opens inside it and it clears) */
const steamCard = (key: string, pos: V3, w: number, a: number, seed = 1): FxSpec => ({
  kind: "card", key: "steam" + (seed % 5), pos, w, h: w * 0.8, rot: 0, soft: true, cw: 192, ch: 154, op: Math.max(0, Math.min(1, a)),
  draw: (p) => {
    const g = p.g; g.globalAlpha = 1;
    const blobs: [number, number, number][] = [];
    for (let i = 0; i < 14; i++) blobs.push([20 + 152 * rnd1(i + seed * 7), 22 + 110 * rnd1(i + seed * 3, 78.233), 34 + 26 * rnd1(i + seed, 39.4)]);
    for (const [x, y, r] of blobs) { g.fillStyle = "#cfd6dc"; g.beginPath(); g.arc(x, y + 5, r, 0, 6.3); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = "#eef2f4"; g.beginPath(); g.arc(x, y, r * 0.9, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
  },
});
/** a trail of dust clouds behind a point moving along dir (dx,dz), growing with age */
const dustTrail = (key: string, base: V3, dir: [number, number], f: number, n = 7, amt = 1, spread = 1): FxSpec[] => {
  const out: FxSpec[] = []; const L = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / L, uz = dir[1] / L;
  for (let i = 0; i < n; i++) {
    const age = ((f * 0.9 + i * 9) % (n * 9)) / (n * 9);
    const back = 0.4 + age * 6 * spread, side = (rnd1(i + 3) - 0.5) * 1.6 * age * spread;
    out.push(dustCard(key + i, [base[0] - ux * back - uz * side, 0.35 + age * 1.3, base[2] - uz * back + ux * side], (0.9 + age * 2.6) * spread, amt * (1 - age) ** 0.7 * 0.95, i, age * 0.6));
  }
  return out;
};
/** "Z z z" floating up from a sleeper */
const zzz = (pos: V3, f: number): FxSpec[] => [0, 1, 2].map((i) => {
  const t = ((f + i * 14) % 42) / 42;
  return { kind: "card", key: "zzz" + i + "_" + Math.round(Math.sin(t * Math.PI) * 8), pos: [pos[0] + 0.15 * i + 0.1 * Math.sin(t * 6), pos[1] + 0.2 + t * 0.7, pos[2]], w: 0.18 + 0.1 * i, h: 0.18 + 0.1 * i, cw: 96, ch: 96,
    draw: (p) => { const g = p.g; g.globalAlpha = Math.sin(t * Math.PI); g.font = "900 78px Georgia"; g.lineWidth = 9; g.strokeStyle = INKC; g.fillStyle = "#ffffff"; g.strokeText("Z", 20, 78); g.fillText("Z", 20, 78); g.globalAlpha = 1; } } as FxSpec;
});
/** little stars / birds circling a dizzy head */
const dizzy = (head: V3, f: number, r = 0.32): FxSpec[] => [0, 1, 2, 3].map((i) => {
  const a = f * 0.18 + (i * Math.PI) / 2;
  return { kind: "card", key: "dstar" + (i % 2), pos: [head[0] + Math.cos(a) * r, head[1] + 0.06 * Math.sin(a * 2), head[2] + Math.sin(a) * r * 0.6], w: 0.16, h: 0.16, cw: 64, ch: 64,
    draw: (p) => { const g = p.g; g.fillStyle = i % 2 ? "#ffd84a" : "#ffffff"; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath();
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? 12 : 28, aa = (k * Math.PI) / 5 - Math.PI / 2; g.lineTo(32 + Math.cos(aa) * rr, 32 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke(); } } as FxSpec;
});
/** speed lines streaming behind a runner (screen-facing cards) */
const speedLines = (pos: V3, f: number, n = 5, len = 1.1, back: [number, number] = [-1, 0]): FxSpec[] => {
  const out: FxSpec[] = [];
  for (let i = 0; i < n; i++) {
    const y = 0.5 + 1.2 * rnd1(i + 11), off = ((f * 0.35 + i * 0.37) % 1);
    out.push({ kind: "card", key: "spd" + (i % 3), pos: [pos[0] + back[0] * (0.5 + off * len), pos[1] + y, pos[2] + back[1] * (0.5 + off * len)], w: 0.7, h: 0.07, cw: 160, ch: 16,
      draw: (p) => { const g = p.g; const gr = g.createLinearGradient(0, 0, 160, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,0.95)"); g.fillStyle = gr; g.beginPath(); g.roundRect(0, 4, 160, 8, 4); g.fill(); } });
  }
  return out;
};
/** a 4-point sparkle that pops and fades (age in frames) */
const sparkle = (key: string, pos: V3, age: number, size = 0.3, col = "#fff6c8"): FxSpec | null => {
  if (age < 0 || age > 14) return null;
  const k = Math.sin((age / 14) * Math.PI);
  return { kind: "card", key: "spk" + key, pos, w: size * k, h: size * k, rot: age * 0.08, soft: true, cw: 96, ch: 96,
    draw: (p) => { const g = p.g; g.fillStyle = col; g.beginPath(); g.moveTo(48, 0); g.quadraticCurveTo(54, 42, 96, 48); g.quadraticCurveTo(54, 54, 48, 96); g.quadraticCurveTo(42, 54, 0, 48); g.quadraticCurveTo(42, 42, 48, 0); g.fill(); } };
};
/** wavy "growl" / "steam" lines (3 short squiggles) */
const squiggles = (key: string, pos: V3, f: number, col = "#ffffff", s = 0.28): FxSpec => ({
  kind: "card", key: "sq" + key + (Math.floor(f / 3) % 3), pos, w: s, h: s, cw: 96, ch: 96,
  draw: (p) => { const g = p.g; g.strokeStyle = INKC; g.lineCap = "round";
    for (let i = 0; i < 3; i++) { const ph0 = (Math.floor(f / 3) % 3) * 0.8 + i; g.lineWidth = 11; g.beginPath(); for (let y = 10; y <= 86; y += 4) g.lineTo(22 + i * 26 + 7 * Math.sin(y * 0.12 + ph0), y); g.stroke();
      g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); for (let y = 10; y <= 86; y += 4) g.lineTo(22 + i * 26 + 7 * Math.sin(y * 0.12 + ph0), y); g.stroke(); g.strokeStyle = INKC; } },
});
/** "seeing things": candy-coloured swirls, stars and a smiling sun floating round the head */
const visions = (head: V3, f: number): FxSpec[] => {
  const out: FxSpec[] = [];
  const kinds = ["swirl", "sun", "swirl", "star", "fish"];
  kinds.forEach((kd, i) => {
    const a = f * 0.07 + (i * 2 * Math.PI) / kinds.length, r = 0.55 + 0.08 * Math.sin(f * 0.1 + i);
    const pos: V3 = [head[0] + Math.cos(a) * r, head[1] + 0.25 + 0.2 * Math.sin(a * 1.5), head[2] + Math.sin(a) * r * 0.5];
    out.push({ kind: "card", key: "vis" + kd + i, pos, w: 0.26, h: 0.26, rot: kd === "swirl" ? f * 0.15 : 0.15 * Math.sin(f * 0.2 + i), cw: 96, ch: 96,
      draw: (p) => {
        const g = p.g; g.strokeStyle = INKC; g.lineWidth = 6;
        const cols = ["#ff7ab6", "#7ad8ff", "#ffd84a", "#9cff7a", "#c69cff"];
        if (kd === "swirl") { g.lineWidth = 9; g.beginPath(); for (let t = 0; t < 14; t += 0.2) g.lineTo(48 + Math.cos(t) * t * 2.8, 48 + Math.sin(t) * t * 2.8); g.stroke(); g.strokeStyle = cols[i]; g.lineWidth = 5; g.beginPath(); for (let t = 0; t < 14; t += 0.2) g.lineTo(48 + Math.cos(t) * t * 2.8, 48 + Math.sin(t) * t * 2.8); g.stroke(); }
        else if (kd === "sun") { g.fillStyle = "#ffd84a"; for (let k = 0; k < 8; k++) { const aa = (k * Math.PI) / 4; g.beginPath(); g.moveTo(48 + Math.cos(aa) * 28, 48 + Math.sin(aa) * 28); g.lineTo(48 + Math.cos(aa + 0.2) * 44, 48 + Math.sin(aa + 0.2) * 44); g.lineTo(48 + Math.cos(aa - 0.2) * 44, 48 + Math.sin(aa - 0.2) * 44); g.closePath(); g.fill(); g.stroke(); }
          g.beginPath(); g.arc(48, 48, 26, 0, 6.3); g.fill(); g.stroke(); g.fillStyle = INKC; g.beginPath(); g.arc(40, 44, 3, 0, 6.3); g.arc(56, 44, 3, 0, 6.3); g.fill(); g.beginPath(); g.arc(48, 52, 10, 0.2, 2.9); g.stroke(); }
        else if (kd === "star") { g.fillStyle = cols[i]; g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 16 : 40, aa = (k * Math.PI) / 5 - Math.PI / 2; g.lineTo(48 + Math.cos(aa) * rr, 48 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke(); }
        else { g.fillStyle = "#ff9d4a"; g.beginPath(); g.ellipse(42, 48, 28, 18, 0, 0, 6.3); g.fill(); g.stroke(); g.beginPath(); g.moveTo(68, 48); g.lineTo(90, 32); g.lineTo(90, 64); g.closePath(); g.fill(); g.stroke(); g.fillStyle = INKC; g.beginPath(); g.arc(30, 44, 4, 0, 6.3); g.fill(); }
      } } as FxSpec);
  });
  return out;
};
/** a soft round glow burst (payoff light, lamp flare), k = 0..1 */
const glowBurst = (key: string, pos: V3, size: number, k: number, col = "255,226,140"): FxSpec => ({
  kind: "card", key: "glow" + key + "_" + Math.round(Math.max(0, Math.min(1, k)) * 20), pos, w: size, h: size, soft: true, cw: 128, ch: 128,
  draw: (p) => { const g = p.g; const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, `rgba(${col},${0.9 * k})`); gr.addColorStop(0.5, `rgba(${col},${0.35 * k})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); },
});
/** an "!" pop over a head */
const bang = (pos: V3, age: number): FxSpec | null => {
  if (age < 0 || age > 24) return null;
  const k = Math.min(1, age / 4) * (age > 18 ? (24 - age) / 6 : 1);
  return { kind: "card", key: "bang", pos: [pos[0], pos[1] + 0.05 * Math.min(1, age / 4), pos[2]], w: 0.24 * k, h: 0.36 * k, cw: 64, ch: 96,
    draw: (p) => { const g = p.g; g.font = "900 92px Georgia"; g.lineWidth = 12; g.strokeStyle = INKC; g.fillStyle = "#ff5a36"; g.strokeText("!", 16, 86); g.fillText("!", 16, 86); } };
};
/** r20: a cartoon stream of ale from a jug (top) into a mug (bottom): amber band, plum ink, a wobble */
const aleStream = (key: string, top: V3, bot: V3, f: number): FxSpec => ({
  kind: "card", key: "ale" + key + (f % 3), pos: [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2], w: 0.07, h: Math.abs(top[1] - bot[1]), cw: 48, ch: 160,
  draw: (p) => { const g = p.g, ph = (f % 3) * 2.1; const path = () => { g.beginPath(); for (let y = 0; y <= 160; y += 8) g.lineTo(24 + (6 + y * 0.02) * Math.sin(y * 0.06 + ph) * 0.5, y); };
    g.lineCap = "round"; g.strokeStyle = INKC; g.lineWidth = 17; path(); g.stroke(); g.strokeStyle = "#e0a238"; g.lineWidth = 11; path(); g.stroke(); g.strokeStyle = "#ffe08a"; g.lineWidth = 3; g.beginPath(); for (let y = 8; y <= 150; y += 8) g.lineTo(21 + 3 * Math.sin(y * 0.06 + ph), y); g.stroke(); },
});
const fxs = (...xs: (FxSpec | (FxSpec | null)[] | null | undefined | false)[]): FxSpec[] => xs.flatMap((x) => (!x ? [] : Array.isArray(x) ? x : [x])).filter((x): x is FxSpec => !!x);

// ---------------- smooth acting (user rule after "Potatoes Stolen", supersedes v10.8 B2 "instant swaps") ----------------
// FACES never jump: every expression change is a 6-frame transition that LANDS on the beat (put the beat 0-3 f before
// its word): brows glide, the eyes swap inside a blink (half / shut / half), the mouth passes through an in-between
// shape, and the head gives a small take. Opposite moods (sad <-> happy, angry <-> smug) route through a 4-frame
// "realising" face (open eyes, raised brows, small mouth) over 10 frames, so a sad face never sits next to a happy one.
// BODIES move like people: smootherstep easing (no overshoot, no squash), the head leads (2 f early), the torso follows,
// the arms trail (1 f late, 3 f longer) and swing on arcs around the shoulder and elbow instead of sliding in straight
// lines. Discrete fields (mode, props) switch when the arm blend is half-way.
import { ACT } from "./acting";
import { faceOf } from "./fig";
import WORDS from "./words.json";
const HANG = (side: number): [[number, number], [number, number]] => [[side * 30, 45], [side * 33, 96]];
/** reference ease: symmetric smootherstep (eases in and out, no overshoot) */
const glide = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const gl = (f: number, a: number, d: number) => glide((f - a) / Math.max(1, d));
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
/** mood of each face: +1 pleased, -1 upset, 0 neutral */
const VAL: Record<string, number> = {
  grin: 1, laugh: 1, relief: 1, relief_open: 1, smile: 1, smile_closed: 1, lick: 1, smug: 1, eureka: 1, sly: 1, joy: 1, guffaw: 1, beam: 1, proud: 1, pitch: 1,
  stern: -1, nervous: -1, shock: -1, dazed: -1, pained: -1, dismay: -1, sheepish: -1, strain: -1, angry: -1, cold: -1, gulp: -1, wired: -1, dead: -1,
  yikes: -1, aghast: -1, green: -1, dizzy: -1,
};
const OPEN: Record<string, number> = { dash: 0, smirk: 0.05, frown: 0.05, wave: 0.1, smile: 0.2, lick: 0.2, o: 0.4, smileWide: 0.4, content: 0.15, flat: 0,
  grin: 0.55, teeth: 0.5, beam: 0.6, O: 0.9, laugh: 0.9, guffaw: 1, teethWide: 0.6, queasy: 0.1, puff: 0, tongue: 0.4 };
/** an in-between mouth: half-way open, in the mood of the face it is heading to */
const midMouth = (ma: string, mb: string, vb: number) => {
  const o = ((OPEN[ma] ?? 0.2) + (OPEN[mb] ?? 0.2)) / 2;
  return vb > 0 ? (o < 0.25 ? "smile" : o < 0.6 ? "smileWide" : "grin") : vb < 0 ? (o < 0.25 ? "wave" : "o") : o < 0.3 ? "dash" : "o";
};
const BRIDGE_BROW: [number, number] = [-5, -4];
const lerpB = (a: [number, number], b: [number, number], k: number): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
type FaceState = { expr?: Face; brow?: [number, number]; swapLid?: number; mouthX?: string; headTake?: number };
/** the face at frame f for a swap from A to B landing on frame s */
const faceSwap = (f: number, A: Face, B: Face, s: number, room = 99): FaceState | null => {
  if (A === B) return null;
  // opposite moods need about 12 f since the last face change for the "realising" in-between; closer beats use a blink swap
  const FA = faceOf(A), FB = faceOf(B), va = VAL[A] ?? 0, vb = VAL[B] ?? 0, flip = va * vb < 0 && room >= 12;
  const lid = (c: number) => (f === c - 1 || f === c + 1 ? 0.5 : f === c ? 1 : 0); // a 3-frame blink centred on c
  // brows never move more than ~2.4 units a frame: big differences (shock -> angry) glide longer
  const bd = (a: [number, number], b: [number, number]) => Math.max(6, Math.ceil(Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) * 0.82));
  if (!flip) {
    const d = bd(FA.brow, FB.brow);
    if (f < s - 4 || f > Math.max(s + 2, s - 4 + d)) return null;
    const st: FaceState = { expr: f < s - 1 ? A : B, brow: lerpB(FA.brow, FB.brow, gl(f, s - 4, d)), swapLid: lid(s - 1), headTake: 2.5 * bump((f - (s - 4)) / 7) };
    if (f === s - 2 || f === s - 1) st.mouthX = va * vb < 0 ? "dash" : midMouth(FA.mouth, FB.mouth, vb);
    return st;
  }
  // opposite moods: A -> blink -> "realising" face (open eyes, raised brows, small mouth) -> half-lid -> B
  const d1 = bd(FA.brow, BRIDGE_BROW), d2 = bd(BRIDGE_BROW, FB.brow), a0 = s - 7 - d1;
  if (f < Math.min(s - 10, a0) || f > Math.max(s + 2, s - 3 + d2)) return null;
  const st: FaceState = { swapLid: Math.max(lid(s - 7), f === s - 1 ? 0.5 : 0), headTake: 4 * bump((f - (s - 10)) / 13) };
  if (f < s - 7) { st.expr = A; st.brow = lerpB(FA.brow, BRIDGE_BROW, gl(f, a0, d1)); }
  else if (f < s) { st.expr = "neutral"; st.brow = f < s - 3 ? BRIDGE_BROW : lerpB(BRIDGE_BROW, FB.brow, gl(f, s - 3, d2)); st.mouthX = vb > 0 ? "o" : "dash"; }
  else { st.expr = B; st.brow = lerpB(BRIDGE_BROW, FB.brow, gl(f, s - 3, d2)); }
  return st;
};
/** polar blend of an arm (elbow around the shoulder, hand around the elbow): limbs swing on arcs */
const arcArm = (A: number[][], B: number[][], k: number): [[number, number], [number, number]] => {
  const pol = (x: number, y: number) => [Math.hypot(x, y), Math.atan2(y, x)];
  const ang = (a: number, b: number) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const [ra, ta] = pol(A[0][0], A[0][1]), [rb, tb] = pol(B[0][0], B[0][1]);
  const [ha, hta] = pol(A[1][0] - A[0][0], A[1][1] - A[0][1]), [hb, htb] = pol(B[1][0] - B[0][0], B[1][1] - B[0][1]);
  const r = lerp(ra, rb, k), t = ang(ta, tb), e: [number, number] = [r * Math.cos(t), r * Math.sin(t)];
  const hr = lerp(ha, hb, k), ht = ang(hta, htb);
  return [e, [e[0] + hr * Math.cos(ht), e[1] + hr * Math.sin(ht)]];
};
const NUMS = /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/;
const HEAD = /^(look|headTilt|headBack|hatLift)$/, LIMB = /^(armR|armL|propK|propRAng|propLAng)$/;
/** per-part blend: head leads by 2 f, torso on the beat, arms 1 f late and 3 f longer (overlapping action) */
const mixO = (a: P, b: P, f: number, s = 0, bl = 1): P => {
  const kH = gl(f, s - 2, bl), kT = gl(f, s, bl), kA = gl(f, s + 1, bl + 3);
  if (kA >= 1 && kH >= 1) return { ...b };
  const o: Record<string, unknown> = { ...b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a as Record<string, unknown>)[key], vb = (b as Record<string, unknown>)[key];
    const k = HEAD.test(key) ? kH : LIMB.test(key) ? kA : kT;
    const arm = key === "armR" || key === "armL";
    const side = key === "armR" ? 1 : -1;
    const A = arm ? (va ?? HANG(side)) : va, B = arm ? (vb ?? HANG(side)) : vb;
    if (arm && Array.isArray(A) && Array.isArray(B)) o[key] = k >= 1 ? B : k <= 0 ? A : arcArm(A as number[][], B as number[][], k);
    else if (typeof va === "number" && typeof vb === "number" && key !== "facing") o[key] = lerp(va, vb, k);
    else if (typeof va === "number" && vb === undefined && NUMS.test(key)) o[key] = lerp(va, 0, k);
    else if (va === undefined && typeof vb === "number" && NUMS.test(key)) o[key] = lerp(0, vb, k);
    else if (key === "expr" || key === "mouth") o[key] = vb;
    else if (key === "facing") o[key] = kH < 0.5 ? va : vb; // the head turns first, the body follows
    else o[key] = kA < 0.5 ? va : vb;
  }
  return o as P;
};
/** a pose timeline: beats [frame, pose(, blend)]; bodies blend per part, faces swap through a short transition */
type Beat = [number, P] | [number, P, number];
const flow = (f: number, beats: Beat[], blend = 8): FigOpts => {
  let i = 0;
  for (let j = 0; j < beats.length; j++) if (f >= beats[j][0]) i = j;
  if (f < beats[0][0]) i = 0;
  const cur = beats[i][1];
  // each beat blends from wherever the previous blend had got to (no jump when beats overlap)
  const stateAt = (j: number, g: number): P => (j === 0 ? { ...beats[0][1] } : mixO(stateAt(j - 1, beats[j][0]), beats[j][1], g, beats[j][0], beats[j][2] ?? blend));
  let m: P = stateAt(i, f);
  const nx = beats[i + 1]; // the head leads into the coming beat
  if (nx && f >= nx[0] - 2) m = mixO(m, nx[1], f, nx[0], nx[2] ?? blend);
  // faces: the transition into the next beat starts before it, the one from the last beat ends after it
  const exprAt = (j: number): Face => { for (let q = j; q >= 0; q--) if (beats[q][1].expr) return beats[q][1].expr as Face; return "neutral"; };
  let fs: FaceState | null = null;
  for (const j of [i + 1, i]) if (j > 0 && j < beats.length && !fs) fs = faceSwap(f, exprAt(j - 1), exprAt(j), beats[j][0], beats[j][0] - beats[j - 1][0]);
  const out: P = { ...m, expr: exprAt(i), mouth: cur.mouth };
  if (fs) {
    if (fs.expr) out.expr = fs.expr;
    if (fs.brow) out.brow = fs.brow;
    if (fs.swapLid) out.swapLid = fs.swapLid;
    if (fs.mouthX && !cur.mouth) out.mouthX = fs.mouthX;
    if (fs.headTake) out.headTilt = ((out.headTilt as number) ?? 0) + fs.headTake * ((((out.facing as number) ?? 1) >= 0) ? 1 : -1);
  }
  return pose(null, out);
};
/** speech accents: a small head nod (2-3 deg, 7 f) on each word onset inside [a, b) - add it to headTilt of the speaker */
const WF = (WORDS as { w: string; s: number }[]).map((w) => Math.round(w.s * 30));
const talkNod = (f: number, a: number, b: number, amp = 2.5) => {
  let n = 0;
  WF.forEach((o, i) => { if (o >= a && o < b && /[A-Z!?,.]/.test((WORDS as { w: string }[])[i].w)) n += (i % 2 ? 1 : -1) * amp * bump((f - o + 2) / 8); });
  return n;
};
/** walking speed helper: stride card moves ~0.52 m per phase unit for the boss */
const walkPh = (dist: number, k = 0.52) => ((dist / k) % 1 + 1) % 1;
/** position along a polyline by fraction u (0..1) */
const polyAt = (pts: V3[], u: number): { p: V3; d: [number, number] } => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const s = clamp01(u) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) if (s <= L[i] || i === pts.length - 1) { const k = clamp01((s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1])); return { p: lerp3(pts[i - 1], pts[i], k), d: [pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]] }; }
  return { p: pts[0], d: [0, 1] };
};
const polyLen = (pts: V3[]) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]); return L; };
/** a walk along a polyline between frames a and b (eased start/stop), returning position, screen facing, walk phase */
const walkPath = (id: number, s: SetDef, pts: V3[], f: number, a: number, b: number) => {
  const u = sm(f, a, b), w = polyAt(pts, u), dist = u * polyLen(pts), moving = f > a && f < b;
  return { p: w.p, facing: Math.sign(screenSide(id, s, f, w.d[0], w.d[1])) || 1, phase: walkPh(dist), moving };   // walkers stay in profile-3/4
};
void ACT; void talkNod;

// =====================================================================================================================
// shared staging helpers (marks, laughs, arm presets, glides, focus).
const MK = (s: SetDef, k: string): V3 => (s.marks[k] ?? [0, 0, 0]) as V3;
const add3 = (a: V3, dx: number, dy: number, dz: number): V3 => [a[0] + dx, a[1] + dy, a[2] + dz];
const CAGE = "#f2c230";
/** a laugh that shakes the body (phase advances ~2.5 shakes a second), head back */
const laughP = (f: number, a: number, i: number): P => ({ expr: i % 2 ? "guffaw" : "mock", shake: 1, phase: (f - a) / 12 + i * 0.3, headBack: 0.5, tilt: -4 + 2 * Math.sin((f - a) * 0.7 + i) });
/** arm presets (shoulder-relative elbow, hand) */
const AR = {
  liftR: [[22, -2], [30, -26]] as A2, liftHiR: [[22, -10], [34, -38]] as A2, pointR: [[28, -6], [56, -12]] as A2, crankR: [[24, -8], [46, -30]] as A2,
  carryR: [[24, 26], [12, 40]] as A2, holdR: [[20, 14], [30, 2]] as A2, shrugR: [[30, 4], [40, -10]] as A2, shrugL: [[-30, 4], [-40, -10]] as A2,
  downR: [[18, 26], [30, 40]] as A2, slapR: [[26, 6], [44, 10]] as A2, hipR: [[26, 14], [10, 26]] as A2, hipL: [[-26, 14], [-10, 26]] as A2,
  tipHatR: [[22, -18], [8, -54]] as A2, waveR: [[26, -16], [40, -46]] as A2, stampUp: [[22, -16], [26, -46]] as A2, stampDown: [[24, 6], [30, 20]] as A2,
};
/** an illustration card (mini animation) that pops in with a 6 f ease and fades out; draw() gets the 2D context */
const popCard = (key: string, pos: V3, w: number, h: number, f: number, a: number, b: number, draw: (g: CanvasRenderingContext2D, k: number) => void, cw = 512, ch = 512): FxSpec | null => {
  if (f < a || f > b) return null;
  const kin = sm(f, a, a + 6), kout = 1 - sm(f, b - 6, b), k = Math.min(kin, kout), q = Math.round(k * 10) / 10;
  return { kind: "card", key: key + "_" + q + "_" + Math.floor((f - a) / 3), pos, w: w * (0.7 + 0.3 * kin), h: h * (0.7 + 0.3 * kin), flat: false, cw, ch,
    draw: (p) => { const g = p.g; g.globalAlpha = k; draw(g, (f - a) / Math.max(1, b - a)); g.globalAlpha = 1; } };
};
const inkRound = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, lw = 10) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = INKC; g.stroke();
};
/** v10.9 glide (one move, 18-40 f): from the previous framing frozen at f0 to `to` (whose own creep starts at f1), eased over
 *  [f0, f1]. `lift` (m) arcs the path up and `bulge` (world m) sideways, both peaking mid-move; `yLead` 0..1 makes the
 *  height arrive early (to clear a fence or rail right next to the start). Used as K(f0, glideTo(...), 1). */
const glideTo = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0, bulge: V3 = [0, 0, 0], yLead = 0, lookLead = 0) => (f: number): Shot => {
  const a = from(f0), b = to(f), k = sm(f, f0, f1), ky = yLead ? sm(f, f0, f0 + (f1 - f0) * (1 - yLead)) : k, kl = lookLead ? sm(f, f0, f0 + (f1 - f0) * (1 - lookLead)) : k, s = Math.sin(Math.PI * k);
  return { pos: [lerp(a.pos[0], b.pos[0], k) + bulge[0] * s, lerp(a.pos[1], b.pos[1], ky) + (lift + bulge[1]) * s, lerp(a.pos[2], b.pos[2], k) + bulge[2] * s],
    look: lerp3(a.look, b.look, kl), fov: lerp(a.fov ?? 40, b.fov ?? 40, k), roll: 0 };
};
/** a world point `dist` m in front of the shot's camera, shifted dx right / dy up (m) in screen space (cards that must stay in frame) */
const camPt = (id: number, s: SetDef, f: number, dist: number, dx = 0, dy = 0): V3 => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  const fw = [d[0] / L, d[1] / L, d[2] / L], rl = Math.hypot(fw[0], fw[2]) || 1, rt = [-fw[2] / rl, 0, fw[0] / rl];
  return [c.pos[0] + fw[0] * dist + rt[0] * dx, c.pos[1] + fw[1] * dist + dy, c.pos[2] + fw[2] * dist + rt[2] * dx];
};
/** FOCUS (remake 2026-11-06, references: depth report on 539 frames of 20 reference Shorts, boards G, T, V, W, X, Y).
 *  The references never pull focus inside a held shot. Focus sits on the subject's eyes, or on the story object in an insert,
 *  and it only moves while the camera moves (a glide or a push) or at a cut. So `follow` lists [frame the focus ARRIVES,
 *  target, frames it takes] and each change is timed to ride an existing camera move. Targets may be functions of the
 *  frame (a walking subject). */
type FT = V3 | ((f: number) => V3);
const follow = (f: number, pulls: ([number, FT] | [number, FT, number])[]): V3 => {
  const at = (x: FT) => (typeof x === "function" ? x(f) : x);
  let i = 0; for (let j = 1; j < pulls.length; j++) if (f >= pulls[j][0] - (pulls[j][2] ?? 1)) i = j;
  if (i === 0) return at(pulls[0][1]);
  const d = pulls[i][2] ?? 1;
  return lerp3(at(pulls[i - 1][1]), at(pulls[i][1]), glide((f - (pulls[i][0] - d)) / d));
};
/** reference blur levels (radius at infinity, px at 1080x1920): inserts / CU / MS 12-14, full shots 8, wides 5 */
const DOF_INSERT = 14, DOF_CU = 13, DOF_MS = 12, DOF_FS = 8, DOF_WS = 5;
/** an illustration card placed just in front of the focus plane (0.9 x the subject's distance), scaled so it keeps the
 *  size it had at `dist0` m: with the reference DOF levels the card stays sharp instead of blurring as a near object */
const cardNearFocus = (id: number, s: SetDef, f: number, subj: V3, dist0: number, dx: number, dy: number) => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  const D = 0.9 * Math.max(1, ((subj[0] - c.pos[0]) * d[0] + (subj[1] - c.pos[1]) * d[1] + (subj[2] - c.pos[2]) * d[2]) / L), k = D / dist0;
  return { pos: camPt(id, s, f, D, dx * k, dy * k), k };
};
// Shared shot helpers (from the crumple-zone video): talk mouths for quoted lines, lens keys, splash / clang cards, inRoom.
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
  const m0 = lip(f) ?? "tClosed", happy = ["mock", "guffaw", "laugh", "joy", "beam", "grin", "scheme", "smug", "tacheUp", "smile", "smile_closed", "proud"].includes(o.expr as string);
  return { ...o, mouth: happy && m0 === "tClosed" ? "tSmile" : m0, headTilt: ((o.headTilt as number) ?? 0) + 2.6 * k * sign, brow: [F0.brow[0] - 3.5 * k, F0.brow[1] - 3.5 * k] as [number, number] };
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
    draw: (p) => { const g = p.g; const star = (n: number, ri: number, ro: number, rot: number) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + rot, r = i % 2 ? ri : ro; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); };
      /* r25: two-tone burst (orange rim, pale core) with a soft glow: it read as a flat white cut-out */
      const gl = g.createRadialGradient(64, 64, 8, 64, 64, 62); gl.addColorStop(0, "rgba(255,236,170,0.55)"); gl.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gl; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = INKC; g.lineWidth = 6; g.fillStyle = "#ffa83a"; star(8, 24, 60, 0); g.fill(); g.stroke(); g.fillStyle = "#fff4c0"; star(8, 12, 34, 0.2); g.fill(); } };
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
// =====================================================================================================================
// "He Made Giant Bricks to Pay Half the Tax": scenes 1-3 (brickyard golden morning, the village street, the first week).
// Faces: Amos = calm half-lid (neutral / bored / calm), smug on the hook, "Exactly." and the trick; never shock.
// Percival the taxman = moustache mouth (tache) by default, tacheUp gloat on the sneer, fury in the inn, shock at the end.
// Silas = grin -> mock laugh -> yell. Ned = strain -> worry, then the eureka (shock 1). Hard cuts (3): 618, 919, 1180.
type CamT = { pos: V3; look: V3; fov: number; roll: number };
type CK = { f: number; pos: V3; look: V3; fov: number };
const CKf = (f: number, pos: V3, look: V3, fov = 44): CK => ({ f, pos, look, fov });
const dirOf = (c: Shot) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), L }; };
/** a whip / swing between two framings: the view direction turns through yaw, the position slides, eased over [f0, f1] */
const swing = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0) => (f: number): Shot => {
  const A = from(f0), B = to(f), k = sm(f, f0, f1), da = dirOf(A), db = dirOf(B);
  let dy = db.yaw - da.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  const yaw = da.yaw + dy * k, pitch = lerp(da.pitch, db.pitch, k), L = lerp(da.L, db.L, k);
  const pos = lerp3(A.pos, B.pos, k); pos[1] += lift * Math.sin(Math.PI * k);
  return { pos, look: [pos[0] + Math.sin(yaw) * Math.cos(pitch) * L, pos[1] + Math.sin(pitch) * L, pos[2] + Math.cos(yaw) * Math.cos(pitch) * L], fov: lerp(A.fov ?? 40, B.fov ?? 40, k), roll: 0 };
};
/** r9: a clear 3/4 turn toward the partner (at least 0.72) whenever the partner is off to one side on screen */
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => { const v = faceTo(id, s, f, a, b); return Math.abs(v) < 0.02 ? 0 : Math.sign(v) * Math.max(0.72, Math.min(1, Math.abs(v))); };
const EYE = 1.3;
const head = (p: V3, y = EYE): V3 => [p[0], p[1] + y, p[2]];
const box = (p: V3, y0: number, y1: number, w: number): Box => [p, y0, y1, w];
/** reference blur levels (v14: insert 14, close-up 13, full 8, wide 5, medium 8 or less) */
const B_INS = 14, B_CU = 13, B_MS = 7, B_FS = 6, B_WS = 4;
/** v14 arm set for the brick video */
const AB = {
  slamR: [[24, 10], [40, 30]] as A2, slamL: [[-24, 10], [-40, 30]] as A2, liftUpR: [[22, -24], [26, -58]] as A2, liftUpL: [[-22, -24], [-26, -58]] as A2,
  patR: [[26, 14], [44, 30]] as A2, holdOutR: [[26, 6], [46, 0]] as A2, carryR: [[22, 12], [36, 4]] as A2, carryL: [[-22, 12], [-36, 4]] as A2,
  quillR: [[24, 4], [40, -12]] as A2, ledgerL: [[-22, 12], [-34, 0]] as A2, stampUpR: [[22, -20], [30, -48]] as A2, stampDnR: [[24, 8], [34, 18]] as A2,
  pointR: [[28, -8], [58, -16]] as A2, pointL: [[-28, -8], [-58, -16]] as A2, leanR: [[24, 14], [36, 34]] as A2, handleR: [[26, 18], [42, 34]] as A2, handleL: [[-26, 18], [-42, 34]] as A2,
  heaveR: [[26, 4], [40, -14]] as A2, heaveL: [[-26, 4], [-40, -14]] as A2, backR: [[20, 14], [-6, 24]] as A2, sipR: [[20, 10], [8, -14]] as A2,
};

// ================================================= SCENE 1 (0-480) BRICKYARD, GOLDEN MORNING
const A1: V3 = [0.03, 0, -0.6], S1: V3 = YARD.SILAS, T1: V3 = [2.1, 0, 3.5], BRD: V3 = YARD.BOARD;
const SH1: V3 = [-3.25, 0, 0.5], SH2: V3 = [-3.7, 0, -2.4];
const AC: V3 = [2.5, 0, 4.0];                 // Amos at the cart handles (the cart points at the gate)
const BENCH_PAIR: Box = box([-0.06, 0, 0.07], 0.84, 1.08, 0.38);
const SH_1: CamT = { pos: [0.07, 1.3, 0.88], look: [0.07, 1.18, -0.6], fov: 56, roll: 0 };   /* r76i: in close - the bench front out of frame, its dressed top the bottom band */   /* r76i: from just above the bench - its top a thin band (the bottom quarter was bare planks) */   /* r76i: back a little - the brick and loaf pair above the caption, whole */   /* r76h: tipped down ~7 deg - his eyes at ~40 % and the held loaf above the caption band (it sat under "making") */   /* r76f: level from chest height - the roof leaves the top, the bench top is a thin band (dead roof 20 % and table 25 %) */   /* r76d: (the bench-pair restage hid him behind the blocks) back to the held pair, a touch wider so the brick clears the left edge */   /* r76c: in on the pair (roof and bench squeezed him into the middle half) */   /* r76: centred, a touch tighter and lower (roof 25 % top, empty planks 19 % bottom) */   /* r70: lens at bench height (reviewers: a static eye-level hook) */   /* r69: wider so the bricks held out to the sides stay in frame */   /* r61: a LOW hero angle on the hook (reviewer: every shot at eye level) */   /* r58: a touch left (the held brick met the left edge) */   /* r57: in and a touch lower (the roof beam took the top 15 %, the bench the bottom 25 %) */   /* r51: closer (the hook head was 34 % wide under a dark roof band) */   /* r49: Amos on the left third, the loaf raised high on the right, the brick low (dead-centre T-pose) */   /* r48: a touch wider and centred on Amos (the held loaf ran to 10 px from the right edge, under the Shorts buttons) */   // r42: lower and a touch tighter (the roof beam and the bench slab took 42 % of the frame)   // r36: a little wider (the raised pair spanned 84 %)   // r35: Amos straightens up 0.22 m with the brick and the loaf (31-44): the camera rides up with him, the bench drops to the bottom fifth   // r26g: a touch wider (the held brick and loaf reach out from the hands)   // r26: closer and level: Amos big, the bench only the bottom quarter   // r22: waist-up on Amos, the brick and the loaf in his hands at chest height   // r21: frontal (both bricks at one depth), the bricks above the caption band   // r20: Amos centred (57 %), the normal brick and the loaf side by side under him   // r5: the CP3 yard lock (head ~41%, loaf + brick on the bench, legs under it)
const SH_2 = frameOn(head(T1), -14, 0.3, 24, 52, 0.15, 0.42);   // r5: the taxman left (head 32%), the duty board right of him
const SH_3 = frameOn(head(A1), 15, 0.36, 58, 52, 0.2, 0.4);   // r5: Amos at the deep mould (head 36%)
const SH_4 = frameOn(head(S1), 60, 0.38, 50, 52, 0.15, 0.4);   // r5: Silas over his wall (head 38%)
const SH_4W = fit([body(AC, 0, 1.8, 0.3), body(S1, 0.6, 1.85, 0.3), body(SH1, 0.6, 1.85, 0.3)], 30, 7, 50, 0.84, 0, 0);
const SH_4C: CK = CKf(468, [AC[0] + 0.6, 1.0, AC[2] + 2.6], [AC[0] - 0.6, 0.7, AC[2] - 0.4], 50);
SHOT_CAMS[1] = () => {
  // r7 (kit: opening too static): the hook opens on a fast push down onto the bench (0-22, ease-out), then creeps
  // r13: after the opening push and the punch on "brick", a slow drift back (the hook holds to 4.9 s; a creep-in put the brim off the edge)
  const s1c = F(() => SH_1, 0, -0.0008, [[57, 0.012, 8]]);
  // r17 (kit: opening too static): a bigger, longer opening move - from 2.1x away and off to the side, 0-50
  const s1 = (f: number): Shot => { const c = s1c(f); if (f >= 50) return c; const k = 1 - Math.pow(1 - f / 50, 3), far = lerp3(c.look, c.pos, 2.1); return { ...c, pos: lerp3([far[0] + 0.55, far[1] + 0.35, far[2]], c.pos, k) }; };
  const s2 = F(() => SH_2, 160, 0.0016);
  const s3 = F(() => SH_3, 246, 0.0018);
  const s4 = F(() => SH_4, 326, 0.0015);
  const s4w = F(() => SH_4W, 440, -0.0012);                 // slow pull back: the yard joins in
  // r7: the shape match into the street: the camera ends looking down into the cart bed of loaves (only loaves in frame,
  // nobody), riding with the cart; the street opens on the same cart bed from the same height and pulls up into the track
  const bedY = (f: number): V3 => { const ck = 0.11 * sm(f, 462, 490); return [YARD.CART[0] + ck * 4.4, 0, YARD.CART[2] + ck * 3.7]; };
  const s4c = (f: number): Shot => { const c = bedY(f); return { pos: [c[0] + 0.05, 2.05, c[2] + 0.28], look: [c[0], 0.85, c[2]], fov: 50, roll: 0 }; };
  return [K(0, s1, 1, true),
    // r13: hold the hook to 4.9 s, then a 12-frame whip to the taxman (lands on "king" 164; the glide crossed an empty yard)
    K(146, swing(s1, 146, s2, 158, 0.3), 1),
    K(236, swing(s2, 236, s3, 246, 0.2), 1),
    K(316, swing(s3, 316, s4, 326, 0.1), 1),
    K(418, swing(s4, 418, s4w, 440, 0.25), 1),
    K(456, glideTo(s4w, 456, s4c, 470, 0.2, [0, 0, 0]), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  // --- Amos: the hook at the bench (0-97), the clay (238-316), then at the cart (418-480)
  const fCam = toward(1, s, f, A1, [A1[0], 0, A1[2] + 3]), fBench = toward(1, s, f, A1, [0, 0, 0.05]), fSilas = toward(1, s, f, A1, S1);
  const amosBench = flow(f, [
    [0, { expr: "determined", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 7 }],                 // mid-slam on frame 0
    [10, { expr: "calm", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 3 }, 6],
    [16, { expr: "calm", facing: fBench, armR: [[22, -10], [34, -40]] as A2, armL: [[-22, -10], [-34, -40]] as A2, armRFront: true, propR: "mould", propRAng: -0.15, tilt: -2 }, 6], // lifts the mould off
    // r22: the gag in his hands: the mould goes down at the bench's right end (24-30), he picks up the loaf and a normal
    // brick (30-36) and holds them side by side at chest height through "every brick twice as tall" (37-90)
    [20, { expr: "calm", facing: fBench, armR: [[22, 12], [34, 26]] as A2, armRFront: true, propR: "mould", propRAng: 0.1, armL: [[-22, 14], [-30, 30]] as A2, armLFront: true, tilt: 3 }, 6],
    [25, { expr: "calm", facing: fBench, armR: [[22, 12], [28, 28]] as A2, armRFront: true, armL: [[-22, 12], [-28, 28]] as A2, armLFront: true, tilt: 4 }, 4],
    [30, { expr: "calm", facing: Math.max(fBench, 0.6), tilt: 7, headTilt: 6, armR: [[6, 18], [-23, 32]] as A2, armRFront: true, propR: "loaf", armL: [[-6, 18], [23, 32]] as A2, armLFront: true }, 6],   /* r63: carried on both palms (balanced on one corner dot it floated) */   /* r59: only the loaf in his hand; the two bricks beside a loaf on the bench make the comparison (the held brick hung off the left edge) */
    // r36: he raises the pair to shoulder height with the arms showing (at the hips they read as glued on, no arms)
    /* r69: brick and loaf held out to the sides by their near ends, both arms showing (r68b: the arms hid behind them and they floated like ears) */
    /* r76i (both reviewers): a normal brick and a loaf side by side at the chest, bases level on one dot each - the loaf exactly twice the height (apart on the bench the pair never compared) */
    [33, { expr: "pitch", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true }, 6],
    [57, { expr: "pitch", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true, headTilt: 3 }, 5],
    [66, { expr: "smug", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true, headTilt: 4 }, 6],
    [90, { expr: "calm", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true }, 8],
    [150, { expr: "calm", facing: fCam, armR: AR.hipR, armL: AR.hipL, headTilt: -3 }, 10],
    // the clay (shot 3): lifts a clot overhead, slams it into the deep mould (265), strikes it off (286), glances at Silas
    [236, { expr: "calm", facing: fBench, armR: AB.carryR, armL: AB.carryL, armRFront: true, propR: "clay" }],
    [250, { expr: "determined", facing: fBench, armR: AB.liftUpR, armL: AB.liftUpL, propR: "clay", tilt: -5, headBack: 0.3 }, 8],
    [262, { expr: "strain", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 9 }, 3],
    [272, { expr: "calm", facing: fBench, armR: [[26, 10], [36, 24]] as A2, armRFront: true, propR: "trowel", propRAng: 1.4, armL: AR.hipL, tilt: 4 }, 8],
    [284, { expr: "calm", facing: fBench, armR: [[26, 10], [52, 24]] as A2, armRFront: true, propR: "trowel", propRAng: 1.4, armL: AR.hipL, tilt: 5 }, 6],   // strike-off
    [298, { expr: "bored", facing: fSilas, armR: AR.hipR, armL: AR.hipL }, 10],
  ]) as P;
  const fGate = toward(1, s, f, AC, YARD.GATE), fSil2 = toward(1, s, f, AC, S1);
  const amosCart = flow(f, [
    [418, { expr: "calm", facing: fSil2, armR: AB.carryR, armL: AB.carryL, armRFront: true, propR: "loaf", tilt: 2 }],            // loads the last loaf
    [440, { expr: "bored", facing: fSil2, armR: AB.patR, armRFront: true, armL: AR.hipL }, 8],
    [456, { expr: "calm", facing: fGate, armR: AB.handleR, armL: AB.handleL, armRFront: true, armLFront: true, mode: "brace", braceK: 0.4 }, 8],
  ]) as P;
  const pullK = sm(f, 462, 490), cart = 0.11 * pullK;
  const acPos: V3 = [AC[0] + 0.48 * cart / 0.11 * 0.11 * 4.4, 0, AC[2] + cart * 3.7];
  const lift1 = 0.22 * (sm(f, 31, 44) - sm(f, 147, 157));   // r35: he stands up straight with the pair (the bench filled the lower third); back down inside the whip to the taxman
  const amos = f < 418 ? C("amos", [A1[0], lift1, A1[2]], amosBench, { idx: 1 }) : C("amos", f < 462 ? AC : acPos, f < 462 ? amosCart : pose(null, { ...amosCart, mode: "walk", phase: (f - 462) / 13 }), { idx: 1 });
  // --- the taxman at the duty board (shot 2): counts the drying row with his quill, taps "2s 6d PER 1000" on "crown"
  const fRow = toward(1, s, f, T1, [3.4, 0, 2.0]), fBoard = toward(1, s, f, T1, BRD);
  const tax = flow(f, [
    [98, { expr: "stern", facing: fRow, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }],
    [128, { expr: "tache", facing: fRow, armR: [[24, 0], [42, -6]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, headTilt: 3 }, 6],
    [146, { expr: "tache", facing: fRow, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, headTilt: -2 }, 6],
    [164, { expr: "tache", facing: fBoard, armR: [[24, -8], [36, -30]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, look: 0.3 }, 8],   // "king": looks up at the crest
    [206, { expr: "tacheUp", facing: fBoard, armR: [[26, -14], [50, -40]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 6],
    [214, { expr: "tacheUp", facing: fBoard, armR: [[26, -12], [54, -34]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: 3 }, 2],  // tap on "crown"
    [222, { expr: "tacheUp", facing: fBoard, armR: [[26, -14], [50, -40]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 5],
  ]) as P;
  // count bobs: a small head dip per brick he counts (130-160, every 7 f)
  const bob = f > 128 && f < 162 ? 3 * Math.sin(((f - 128) / 7) * Math.PI) : 0;
  // --- Silas over the wall: watches (shot 3), leans on his shovel grinning, drops it (352), laughs, yells, points
  const fA = toward(1, s, f, S1, A1);
  const silas = flow(f, [
    [236, { expr: "grin", facing: fA, armR: AB.leanR, armRFront: true, propR: "shovel", propRAng: 0.15, tilt: 4 }],
    [326, { expr: "grin", facing: fA, armR: AB.leanR, armRFront: true, propR: "shovel", propRAng: 0.2, tilt: 6, headTilt: 5 }, 8],
    [344, { expr: "laugh", facing: fA, armR: [[30, 10], [52, 20]] as A2, armRFront: true, propR: "shovel", propRAng: 0.9, tilt: -3 }, 6],   // lets go
    [356, { expr: "mock", facing: fA, armR: [[26, 6], [40, -4]] as A2, armL: [[-26, 6], [-40, -4]] as A2, shake: 1, phase: 0, tilt: -4, headBack: 0.4 }, 4],
    [384, { expr: "guffaw", facing: fA, armR: AB.pointR, armRFront: true, armL: [[-24, 14], [-12, 26]] as A2, shake: 0.5, phase: 0, headBack: 0.2 }, 4],   // yells, pointing
    [418, { expr: "mock", facing: fA, armR: [[26, 6], [40, -4]] as A2, armL: [[-26, 6], [-40, -4]] as A2, shake: 1, phase: 0, tilt: -4, headBack: 0.5 }, 6],
  ]) as P;
  const silasO: P = f >= 356 && f < 384 ? { ...silas, phase: (f - 356) / 11 } : f >= 418 ? { ...silas, phase: (f - 418) / 11 } : silas;
  const silasQ = speak(f, 386, 416, silasO);
  // --- Silas's two hands: working (shovelling clay), then laughing together on "joins in" (463)
  const hand = (who: string, p: V3, i: number): CastPlace => {
    const fh = toward(1, s, f, p, A1);
    if (f < 440) return shoveler(who, p, f, i, fh);
    return C(who, p, pose(null, { ...laughP(f, 440 + i * 5, i), facing: fh }), { idx: 30 + i });
  };
  const cast: CastPlace[] = [];
  if (f < 418 || f >= 418) cast.push(amos);
  if (f >= 90 && f < 240) cast.push(C("tax", T1, { ...tax, headTilt: ((tax.headTilt as number) ?? 0) + bob } as FigOpts, { idx: 3 }));
  cast.push(C("silas", S1, silasQ as FigOpts, { idx: 2 }));
  if (f >= 400) { cast.push(hand("sh1", SH1, 0)); cast.push(hand("sh2", SH2, 1)); }
  // hook controls: the mould is on the loaf and slams down on frame 0, lifts away at 16 (into Amos's hands)
  const ctl: Ctl = {
    mouldOn: f < 16 ? 1 : 0, mouldY: f < 4 ? 0.05 * (1 - f / 4) : 0, mouldAside: f >= 25 && f < 236 ? 1 : 0, loaf: f < 31 ? 1 : 0, brick: f < 31 ? 1 : 0, mini: f < 146 ? 0 : 1,   /* r76i (reviewer): no bench miniatures in the hook - only the held pair compares */   /* r76i: he lifts the brick with the loaf */   /* r59: the normal brick stays on the bench (he no longer picks it up) */
    clay: f >= 236 && f < 418 ? (f < 262 ? 0.15 : lerp(0.15, 1.0, sm(f, 262, 270))) : 0, strike: f >= 284 && f < 296 ? lin(f, 284, 296) : 0,
    normMould: f < 146 ? 0 : 1, strikeOn: f < 236 ? 0 : 1, brick: f < 146 ? 0 : 1,   /* r76: the bench clear in the hook (he holds the pair) */ cart: f < 462 ? 0 : cart, lantern: 0,
  };
  const fx = fxs(f < 12 ? dustCard("hook", [0.18, 0.92, 0.12], 0.32 + 0.03 * f, 1 - f / 12, 2) : null,
    f >= 262 && f < 274 ? dustCard("slap", [0.18, 1.05, 0.1], 0.3, 1 - (f - 262) / 12, 3) : null,
    f >= 356 && f < 368 ? dustCard("shovel", [S1[0] + 0.35, 1.0, S1[2] + 0.2], 0.35, 1 - (f - 356) / 12, 4) : null,
    f >= 470 ? dustTrail("cart", [acPos[0] - 1.4, 0, acPos[2] - 1.2], [0.77, 0.64], f, 4, 0.5, 0.35) : []);
  const focus: V3 = f < 30 ? [0.05, 1.05, -0.2] : f < 150 ? [0.03, 1.15 + lift1, -0.6] : f < 236 ? head(T1) : f < 316 ? head(A1) : f < 418 ? head(S1) : f < 462 ? head(AC) : [acPos[0] - 0.8, 0.8, acPos[2] - 0.6];
  return { ctl, cast, fx, focus, subj: f < 150 ? "amos" : f < 236 ? "tax" : f < 316 ? "amos" : f < 418 ? "silas" : f < 456 ? "amos" : null };
};
KICKS.push([2 / 30, 0.35], [263 / 30, 0.2]);
KEY_PUNCH.push(110, 164, 214, 262, 312, 344, 386, 452, 537, 607, 650, 695, 749, 836, 890);
lens3([[0, 2.6], [146, B_FS, 12], [160, B_MS, 10], [240, B_MS, 8], [320, B_CU, 8], [420, B_WS, 20], [462, B_FS, 16]]);

// ================================================= SCENE 2 (480-618) VILLAGE STREET, NOON
// the cart rolls east along the street (cart: x = -10 + 20 ck, handles to +x, Amos at x + 1.7); the baker at his stall,
// a woman and a kid laugh, Ned tries a loaf at 551-618
const cartX = (ck: number) => -10 + 20 * ck;
const ckAt = (f: number) => lerp(0.33, 0.46, sm(f, 470, 548));
const V_BAKER: V3 = [-1.25, 0, -0.85],   /* r76i (both reviewers): both laughers nearer (4.2-4.8 m against Amos 3.2 m) - their heads read at 3/4 of his */   /* r76i: the baker nearer - his bread gag readable */   /* r76i: the baker in the street shot, bread held up beside a loaf (both reviewers: nothing said "loaves", one laugher was not "the village") */ V_WOMAN: V3 = [1.4, 0, -3.7], V_KID: V3 = [2.4, 0, -3.3], V_MAN: V3 = [-0.4, 0, 3.75], V_NED: V3 = [-1.0, 0, 1.95];
SHOT_CAMS[2] = () => {
  // shot 5: tracking alongside the cart from the south pavement, the bakery and the villagers behind
  // r5: the track keeps Amos's head at ~34% width, 36% across (the cart and the laughing villagers ahead of him on the right)
  const TK = (f: number) => frameOn(head([cartX(ckAt(f)) + 1.62, 0, 1.0]), 60, 0.24, 44, 52, -0.7, 0.5);   /* r76i (both reviewers): wider - the loaded cart reads on "Amos's loaves" (it was cut at the left edge) */   /* r76i: the figures lower, less bare cobble at the foot of the frame */   /* r76i: Amos a little smaller and left, room for the baker and the woman */   /* r76: Amos at 55 % from further round, so two laughing villagers stand clear on the right (reviewers: the street was empty on "the village calls them") */   /* r66: LOW tracking, lens near the cobbles (reviewers: eye level) */   /* r54: head lower in frame (a quarter of bare cobbles under him) */   /* r53: wider and lower: the whole cart left of Amos, less bare cobble under him */   /* r50: back a little: the whole cart and the laughing villager inside the frame */   /* r49: Amos left of centre (his brim was 5 px from the right edge, under the Shorts buttons) */   /* r47: tilted up (the cobbles filled the lower third) */   // r44b: (in to the knees pushed the laugher off the left edge)   // r42: a touch closer and higher: the laugher stands clear above the cart bed, less road under Amos   // r40: Amos a little right: the laughers clear of his head   // r35: tighter (the cobbles filled the lower quarter)   // r26: closer and lower (the road filled the lower third)   // ahead of Amos, looking back past him at the cart of loaves and the villagers trailing it
  const s5 = track((f) => TK(f).pos, (f) => TK(f).look, 52, 480, 0.0008);
  // the wheel match: the camera starts low on the cart wheel (472-486) and rises into the track
  const w0 = (f: number): Shot => { const x = cartX(ckAt(f)); return { pos: [x + 0.05, 2.05, 1.28], look: [x, 0.85, 1.0], fov: 50, roll: 0 }; };   // r7: the same view down into the cart bed
  // shot 6: quick push to Ned at the cart (lands on "who" 554)
  const SH6 = frameOn(head(V_NED), -50, 0.34, 38, 52, 0.2, 0.4);   /* r76i: further round, so the two nearer laughers stay out of Ned's frame */   // r7: from the left, clear of the lamp post; the cart of loaves right of Ned
  const s6 = F(() => SH6, 556, 0.0018);
  return [K(472, w0, 1, true), K(502, glideTo(w0, 502, s5, 516, 0), 1), K(546, glideTo(s5, 546, s6, 556, 0.1), 1)];
};
SUN_REF[2] = 530;   // r12: sun fixed from the street track (not the top-down cart bed)
SHOT_ACTS[2] = (f, s) => {
  const ck = ckAt(f), ax = cartX(ck) + 1.62, AV: V3 = [ax, 0, 1.0], walking = f < 548;   /* r44: right at the handle ends */
  const HR: A2 = [[-6, 14], [-24, 20]] as A2,   /* r76g: back on the shaft end (drawn in front low it floated beside the load) */ HL: A2 = [[-17, 13], [-29, 19]] as A2;   /* r48: (points are shoulder-relative) the near hand ON the near shaft end, the far hand behind him on the far shaft */   /* r47: the near hand up ON the shaft end, the far hand back behind him on the other shaft (one hand hung loose: the cart read parked) */   // r46: the cart is tipped up on its wheels so the shaft ends meet his hands   // r44: each hand on its shaft end (they hung beside the shafts)   // r44: hands down at the shafts (at chest height they gripped air)
  const fE = toward(2, s, f, AV, [AV[0] + 3, 0, AV[2]]), fNed = toward(2, s, f, AV, V_NED);
  const amos = walking ? pose(null, { expr: f >= 500 ? "determined" : "calm",   /* r76i (reviewer: the same deadpan in four shots): set-jawed as they laugh */ facing: fE >= 0 ? 1 : -1, look: 0,   /* r48: faces the way he walks, pulling (turned to the laughers he read as standing beside a parked cart) */   /* r39: he turns to the laughers, deadpan (he faced away from them) */   /* r38: a sideways glance at the laughers (he ignored them) */ armR: HR, armL: HL, armRFront: false, armLFront: true, mode: "walk", phase: (f - 459) / 13, tilt: 7 * (fE >= 0 ? 1 : -1), noAutoTilt: true })   /* r73: leaning into the pull */   /* r51: full stride on the review beat (frac ~0.7; at 0.25 the legs cross) */
    : flow(f, [[548, { expr: "calm", facing: fE, armR: AB.handleR, armL: AB.handleL, armRFront: true, armLFront: true }], [566, { expr: "bored", facing: fNed, armR: AR.hipR, armL: AR.hipL }, 10]]);
  const fA = (p: V3) => toward(2, s, f, p, AV);
  const baker = flow(f, [
    [470, { expr: "grin", facing: fA(V_BAKER), armR: [[26, -10], [36, -32]] as A2, armRFront: true, propR: "loaf", armL: [[-20, 14], [-26, 26]] as A2, armLFront: true, propL: "bread" }],   /* r76i: Amos's loaf held up high beside his head, his own bread low - the gag reads above the caption */
    [508, { expr: "laugh", facing: fA(V_BAKER), armR: [[26, -12], [36, -36]] as A2, armRFront: true, propR: "loaf", armL: [[-20, 14], [-26, 26]] as A2, armLFront: true, propL: "bread", shake: 0.6, phase: 0 }, 6],   /* the loaf out at shoulder height (raised, it covered the woman's face) */
  ]);
  const bakerO: P = f >= 508 ? { ...baker, phase: (f - 508) / 12 } : baker;
  // r5: the villagers trail the cart down the road behind it (in the track's background), laughing and pointing at the loaves
  const TR = (dx: number, dz: number): V3 => [ax + dx, 0, dz];
  const X520 = cartX(ckAt(520)) + 1.62; void TR; const wP: V3 = [-1.8, 0, -2.2],   /* r76i: behind and right of the baker - three head spans clear of each other */   /* r76h: both laughers at 5-6 m, 81 % and 93 % of the frame on "Amos's" (at 10 m their heads were specks) */   /* r76b: both laughers further back on the far pavement, clear of each other and the edge as the track drifts */   /* r68b: the two laughers stand back down the street, out of the track (behind the cart their heads peeked over the loaves) */   /* r42: further back on the far side of the street, clear above the cart bed (behind it she was half hidden) */ kP = TR(-7.2, -0.7),   /* r42: back in, left of the woman and clear of Amos (the street read empty) */   /* r40: the kid further back, clear of the woman and of Amos */   /* r35: closer behind the cart (they read small and hidden) */ mP: V3 = [-3.48, 0, -1.81]   /* r76i: the man further back and left, clear of her head (they overlapped) */, bP = TR(-2.4, -2.3);   // r6: heads clear of Amos's (no stacking)
  const woman = C("bv1", wP, pose(null, { ...laughP(f, 496, 0), facing: fA(wP), armL: [[-24, -4], [-42, -16]] as A2, armLFront: true, armR: AR.hipR }), { idx: 41 });   /* r76b: she points at the cart */
  const kid = C("bv3", kP, pose(null, { expr: f < 515 ? "grin" : "laugh", facing: fA(kP), armR: [[22, 14], [8, 22]] as A2, armRFront: true,   /* r36: hand on his belly (the pointing arm crossed his face) */ tilt: -3 + 2 * Math.sin(f * 0.3), mode: walking ? "walk" : undefined, phase: (f - 466) / 11 }), { idx: 42 });
  const man = C("bv2", mP, pose(null, { ...laughP(f, 505, 1), facing: fA(mP) }), { idx: 43 });
  // Ned (from 540): walks up, bends, heaves a loaf off the cart (572-600), strains, drops it back (600), worry, head shake (607)
  const fC = toward(2, s, f, V_NED, [V_NED[0] + 0.3, 0, 1.0]);
  const ned = flow(f, [
    [540, { expr: "neutral", facing: fC, armR: AR.hipR, armL: AR.hipL }],
    [560, { expr: "neutral", facing: fC, armR: [[26, 20], [36, 44]] as A2, armL: [[-26, 20], [-36, 44]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.8, tilt: 10 }, 8],
    [572, { expr: "strain", facing: fC, armR: AB.heaveR, armL: AB.heaveL, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, tilt: -4, sweat: 1 }, 6],
    [588, { expr: "strain", facing: fC, armR: [[26, 10], [38, 4]] as A2, armL: [[-26, 10], [-38, 4]] as A2, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, tilt: 6, sweat: 1 }, 6],
    [600, { expr: "worry", facing: fC, armR: AR.hipR, armL: AR.hipL, mode: "brace", braceK: 0, sweat: 0.6 }, 5],                       // drops it back: thunk
    [604, { expr: "worry", facing: fNed * -1 || 1, armR: AR.shrugR, armL: AR.shrugL, headTilt: 6 }, 6],
    [610, { expr: "worry", facing: fNed * -1 || 1, armR: AR.shrugR, armL: AR.shrugL, headTilt: -6 }, 5],                            // shakes his head on "heavy"
  ]) as P;
  const cast: CastPlace[] = [C("amos", AV, amos, { idx: 1 })];
  // r37: a third laugher in a doorway behind Amos (the street read as two people)
  const dP = TR(-3.9, -3.5), door = C("bv4", dP, pose(null, { ...laughP(f, 492, 2), facing: fA(dP) }), { idx: 44 });
  void door; void kid; void man; void woman; cast.push(C("bkr", V_BAKER, bakerO, { idx: 45 }));   /* r76i (both reviewers: heads touching, his loaf over her face): the baker alone - Amos's loaf held high beside his own bread */   /* r76i (both reviewers): one big laugher only - the second head kept landing behind hers */   /* r76: two laughers back on, on the right of Amos at two depths (projection-placed, heads clear of his) */   /* r71: no trailing laughers in the track (wherever they stood they came out as a blurred cream figure at the cart's edge) */   /* r54: two villagers laugh (the wider track had one lone laugher) */   // r42b: the kid stood on her head   // r40: the woman alone, big and clear (the kid kept landing behind Amos's brim)   // r37b: (the doorway laugher stood behind Amos's big head: dropped)   // r10: the baker dropped from the track (his head touched Amos's brim)   // r7: the baker holds only his bread up; the far man dropped (off frame)
  if (f >= 540) cast.push(C("ned", f < 556 ? lerp3([V_NED[0] - 1.4, 0, V_NED[2] + 0.6], V_NED, sm(f, 540, 556)) : V_NED, f < 556 ? pose(null, { expr: "neutral", facing: 1, mode: "walk", phase: (f - 540) / 12 }) : ned, { idx: 5 }));
  return { ctl: { cart: ck, cartTilt: 0.14, wallH: 0, tea: 0, spring: 0, stick: 0 }, cast,
    fx: fxs(walking ? dustTrail("vcart", [cartX(ck) - 0.3, 0, 1.0], [1, 0], f, 3, 0.35, 0.3) : [], f >= 600 && f < 610 ? dustCard("ned", [V_NED[0] + 0.3, 0.75, 1.1], 0.3, 1 - (f - 600) / 10, 1) : null),
    focus: f < 548 ? head(AV) : head(V_NED), subj: f < 548 ? "amos" : "ned" };
};
lens3([[472, 8, 1], [506, 6.5, 20], [550, 7, 8]]);   /* r76i (reviewer): the street behind softer - depth separation */   /* r76: less blur so the laughing villagers read */   // r25: more depth (the street facades soft); r8: the trailing villagers' faces stay sharp

// ================================================= SCENE 3 (618-919) THE FIRST WEEK, DRIZZLE
// the unsold stack at YARD.STACK (-0.5, 0, 2.7) grows; Amos sits on an upturned barrow beside it; two builders pass with
// hods of normal bricks, one tries a loaf and rubs his back; the taxman counts every loaf, sneers, stamps; "Exactly."
const G_TAXX = 0.05; void G_TAXX;
const G_AMOS: V3 = [YARD.STACK[0] + 0.24, 0,   /* r76i (reviewer): sat ON the top of a four-course stack, its top face under him (on a front step he read pasted on the stack face) */   /* r43: further along the stack (the tricorn tip touched his arm) */ YARD.STACK[2] + 0.58],   /* r76i: on the front edge, legs down the front face */   /* r42: feet lower, his legs hang down the stack's face (sitLeg 0.4; tucked they did not read as sitting on it) */   /* r39: a hand clear of the stack face (its corner hid his legs) */   /* r38: he sits ON TOP of his unsold stack, legs over the front (on a low seat he read as standing) */ G_TAX: V3 = [0.2, 0, 4.95], G_B1: V3 = [1.6, 0, 1.4], G_B2: V3 = [1.55, 0, 3.85];   // r5: the CP3 grey lock staging
SHOT_CAMS[3] = () => {
  const SH7: CamT = { pos: [2.2, 3.2, 7.6], look: [0.4, 0.5, 2.9], fov: 52, roll: 0 };   // r7: HIGH medium-wide: the stack, Amos on his seat, the builder straining (heads above the caption band)
  const s7 = F(() => SH7, 618, 0.0016);
  // r5: the CP3 grey lock two-shot: the taxman in front (head ~36%), Amos on his loaf seat behind (3/4 to each other), the stack between
  const SH8: CamT = { pos: [1.45, 2.95, 7.5], look: [-1.66, 0.05, 2.6], fov: 55, roll: 0 };   /* r76i (reviewer: the caption sat on the taxman's chin): tilted down - his head above the caption band, less busy yard on top */   /* r76i (reviewer): aimed a little higher - less bare paving at the foot */   /* r76i (reviewer): pushed in, aimed higher - less bare paving at the foot */   /* r72: a HIGH angle down on the sneer (reviewers: every frame at eye height) */   /* r68b: wider - the taxman's shoes and Amos's hand inside the frame */   /* r62: a touch left (the ledger was cut by the left edge); (low, the loaf stack blocked the lens) */   /* r48: a touch right (the boater brim touched the right edge) */   /* r46: the ledger clear of the left edge */   /* r44: in to the knees (the wet paving took the lower 30 %) */   /* r42: panned left a touch (the ledger was cut by the left edge) */   // r40: a medium two-shot (the full figure left a quarter of wet floor)   // r26d: tilted up, less wet ground below the feet   // r25: Amos's brim clear of the right edge   // r10: a little wider: the tricorn and Amos clear of the edges   // r6: tilted down: eyes at 42% / 46%, wet ground in front
  const s8 = F(() => SH8, 716, 0.0009);
  // "and Amos just nods": a slow glide in on Amos (22 f) landing before "Exactly." (890)
  const AMQ = frameOn([G_AMOS[0], G_AMOS[1] + 1.04, G_AMOS[2]], 14, 0.4, 52, 52, 0.25, 0.42);
  const sQ = F(() => AMQ, 884, 0.0016);
  return [K(618, s7, 1, true), K(704, glideTo(s7, 704, s8, 716, 0.15), 1), K(862, glideTo(s8, 862, sQ, 884, 0), 1)];
};
SHOT_ACTS[3] = (f, s) => {
  const fT = f < 700 ? toward(3, s, f, G_AMOS, G_TAX) : -0.6,   /* r56: Amos turns to the taxman (screen-left) for the sneer and his nod */ fStack = toward(3, s, f, G_TAX, YARD.STACK), fA0 = toward(3, s, f, G_TAX, G_AMOS), fA = 1; void fA0;   /* r56: Amos sits screen-right of him in this two-shot: face right (+1 measured right in a lit preview) */   /* r53: a clear three-quarter turn to Amos for the sneer (he read as playing to the lens) */
  const amos = flow(f, [
    [618, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4 }],   /* r76i (both reviewers): he stands arms folded in front of his unsold stack (sat on it he read as a statue on a plinth) */   /* r76f: hands on his knees (spread, they touched nothing) */   // r38: hands on the loaves either side of him   // r24: the empty first week reads on his face (patient, unbothered)
    [860, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4, headTilt: 6 }, 6],   // nods (883)
    [880, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4, headTilt: -4 }, 5],
    [889, { expr: "smug", facing: fT, armR: [[26, -4], [40, -20]] as A2, armRFront: true, armL: AR.hipL, headTilt: 3 }, 5],
  ]) as P;
  const amosQ = speak(f, 889, 918, amos);
  const tax = flow(f, [
    [700, { expr: "tache", facing: fStack, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }],
    [728, { expr: "stern", facing: fStack, armR: [[24, 2], [44, -2]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 6],
    [768, { expr: "tacheUp", facing: fA, tilt: -4, armR: [[14, 0], [-16, -6]] as A2,   /* r76: the stamp in his hand from the sneer (the line says stamping; he held a quill) */   /* r61: leans back, superior (leaning in, his tricorn touched Amos) */ armRFront: true, propR: "stamp",   /* r58: tucked in (it still crossed Amos) */   /* r54: raised, wagging (pointed out it crossed Amos's apron) */   /* r53: the quill pointed at Amos on "A brick's a brick, Amos" */   /* r38b: hand on his hip for the sneer (the quill crossed Amos on the stack) */ armL: [[-28, 16], [-36, 2]] as A2, armLFront: true, propL: "ledger", propK: 1, propsOver: true, headTilt: -5 }, 6],   /* r61: the upper arm shows beside the ledger (the book hid the whole arm) */   // sneers (r42: ledger nearer his body) (ledger held low, clear of his face)
    [826, { expr: "tacheUp", facing: fA, armR: AB.stampUpR, propR: "stamp", armRFront: true, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: -3 }, 6],
    [834, { expr: "tacheUp", facing: fA, armR: AB.stampDnR, armRFront: true, propR: "stamp", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: 4 }, 2],            // STAMP (836)
    [846, { expr: "tache", facing: fA, armR: AR.hipR, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 0 }, 8],
    [892, { expr: "tache", facing: fA, armR: AR.hipR, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 0, look: 0.2 }, 6],
  ]) as P;
  const cbob = f > 728 && f < 768 ? 3.5 * Math.sin(((f - 728) / 6.5) * Math.PI) : 0;   // a nod per loaf counted
  const taxQ0 = speak(f, 772, 810, { ...tax, headTilt: ((tax.headTilt as number) ?? 0) + cbob });
  // r35: a sneer, not a shout: the wide-open talk mouths become narrow ones on his line, chin up
  const SNEER: Record<string, string> = { tOBig: "tE", tO: "tSmall", tWide: "tE", tTongue: "tSmall" };
  const taxQ = f >= 772 && f < 810 ? { ...taxQ0, mouth: SNEER[taxQ0.mouth as string] ?? taxQ0.mouth, headBack: 0.15 } : taxQ0;
  // builders: bld1 walks past with a hod of normal bricks; bld2 tries a loaf off the stack, strains, rubs his back (695)
  const b1p = lerp3([2.8, 0, 0.6], [-0.2, 0, 1.0], lin(f, 618, 720));
  const bld1 = C("bld1", b1p, pose(null, { expr: f < 672 ? "neutral" : "stern", facing: toward(3, s, f, b1p, f < 672 ? [-1, 0, 1] : YARD.STACK), mode: "walk", phase: (f - 618) / 13, armR: AB.carryR, armRFront: true, propR: "brick", headTilt: f > 680 && f < 700 ? 6 * Math.sin((f - 680) * 0.6) : 0 }), { idx: 51 });
  const fS2 = toward(3, s, f, G_B2, YARD.STACK);
  const bld2 = C("bld2", G_B2, flow(f, [
    [618, { expr: "neutral", facing: fS2, armR: AR.hipR, armL: AR.hipL }],
    [646, { expr: "strain", facing: fS2, armR: AB.heaveR, armL: AB.heaveL, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, sweat: 1 }, 8],
    [672, { expr: "worry", facing: fS2, armR: AR.hipR, armL: AR.hipL, mode: "brace", braceK: 0.3 }, 6],
    [688, { expr: "tache", facing: -fS2 || 1, armR: AB.backR, armL: AR.hipL, tilt: -6 }, 8],   // rubs his back: "too heavy"
  ]), { idx: 52 });
  const cast: CastPlace[] = [C("amos", G_AMOS, amosQ as FigOpts, { idx: 1 })];
  if (f < 760) cast.push(bld1, bld2);
  if (f >= 690) cast.push(C("tax", f < 712 ? lerp3([-2.6, 0, 4.4], G_TAX, sm(f, 690, 712)) : G_TAX, f < 712 ? pose(null, { ...tax, mode: "walk", phase: (f - 690) / 12 }) : (taxQ as FigOpts), { idx: 3 }));
  return { ctl: { rain: 1, stack: 1, lantern: 0, cart: 0, cartOn: 0, loaf: 0, clay: 0, mouldOn: 0 }, cast,
    fx: fxs(f >= 836 && f < 846 ? clang("stamp", [G_TAX[0] - 0.25, 1.15, G_TAX[2] + 0.1], f - 836, 0.3) : null),
    focus: f < 712 ? [YARD.STACK[0], 0.9, YARD.STACK[2]] : f < 860 ? head(G_TAX) : head(G_AMOS, 1.14), subj: f < 712 ? null : f < 860 ? "tax" : "amos" };
};
KICKS.push([836 / 30, 0.18]);
lens3([[618, 9, 1], [704, 9, 12]]);   /* r76i (reviewer: the yard as sharp as the taxman): softer still */   /* r76i: the yard behind the pair softer */   // r9: the ground in front of the two-shot stays sharp
// =====================================================================================================================
// scenes 4-6: Ned's site in spring (the turn), the yard by spring (the queue), the office by summer (the ledger).

// ================================================= SCENE 4 (919-1049) NED'S SITE, SPRING
// Ned lays loaves at the east end of his wall (he stands past the end, x 19.95, and works along it); the plank with his
// mug of tea is in front of the wall's end. The wall shoots up 974-1006; the mug insert lands on "tea's" (1018) and its
// steam thickens until it fills the frame (1040-1053) for the dissolve into the yard.
const N_W: V3 = [18.85, 0, -5.88]   /* r44: right at the wall, so the loaf he lowers sits on its top course */   /* r35: Ned stands in front of his wall near its end (it read as two loose columns at the frame edge) */, WALL_TOP = (k: number) => 0.215 * 12 * k;
const MUGP: V3 = VIL.MUG;
const INS4: CamT = { pos: [MUGP[0] + 0.12, MUGP[1] + 0.28, MUGP[2] + 0.62], look: [MUGP[0], MUGP[1] + 0.16, MUGP[2]], fov: 40, roll: 0 };
/** r7: the tea steam closes over the lens (1036-1047) so the dissolve to the yard happens inside steam on both sides */
const steam4 = (f: number) => { if (f < 1024) return null; const c = INS4, d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]);
  const a = sm(f, 1024, 1050), out: FxSpec[] = []; for (let i = 0; i < 3; i++) { const k = 0.28 + 0.08 * i; out.push(steamCard("st4" + i, [c.pos[0] + d[0] / L * k + (i - 1) * 0.05, c.pos[1] + d[1] / L * k + 0.02 * (f - 1034) / 10, c.pos[2] + d[2] / L * k], 0.42 + 0.1 * i, a, i + 1)); } return out; };
SHOT_CAMS[4] = () => {
  // r5: the CP3 site lock (Ned ~35%, mug + wall end left), then a crane up and back with the wall (974-1004)
  const SH9: CamT = { pos: [20.15, 1.22, -3.05], look: [18.73, 0.98, -6.31], fov: 47, roll: 0 };   /* r76i: tilted up - the sunlit dirt and a loose brick at the bottom-left corner out of frame */   /* r76: panned right onto the tea on its plank past the wall end; higher, looking down (the top half was bare sky and scaffold poles) */   /* r62: less sky (a third of the frame), Ned's feet off the bottom edge */   /* r61: LOW, up at Ned over his wall (reviewer: every shot at eye level) */   // r40: a medium on Ned and the wall top (the full figure left a quarter of bare dirt)   // r35: three-quarter along the wall: its courses run off left behind Ned   // r26i: Ned's loaf clear of the right edge   // r26c: the loaf in his hand clear of the right edge   // r26b: closer and lower (less bare ground)   // r25: face-on to the wall: its end and courses fill the left, Ned right; the trestle and mug sit off right until the insert
  const s9 = F(() => SH9, 919, 0.0016);
  const CR1: CamT = { pos: [19.9, 2.4, -1.4], look: [19.25, 0.85, -6.1], fov: 54, roll: 0 };
  const crane = (f: number): CamT => { const k = sm(f, 974, 1004); return { pos: lerp3(SH9.pos, CR1.pos, k), look: lerp3(SH9.look, CR1.look, k), fov: lerp(52, 54, k), roll: 0 }; };
  // the mug insert: mug ~45% of the frame width, its steam rising above it
  const INS = INS4;
  const sIns = F(() => INS, 1018, 0.0025);
  return [K(919, s9, 1, true), K(970, glideTo(s9, 970, crane, 980, 0), 1), K(1006, glideTo(crane, 1006, sIns, 1018, 0.1), 1)];
};
SHOT_ACTS[4] = (f, s) => {
  const fW = -0.75;   /* r43: three-quarter toward the wall end where he lays the loaf (he stared into the lens) */ void toward;
  // a lay cycle: lift a loaf from the pile (beside him), swing it onto the course, tap it down (every 10 f while it rises)
  const cyc = (g: number, per: number) => { const u = ((g % per) + per) % per / per; return u < 0.45 ? 0 : u < 0.7 ? (u - 0.45) / 0.25 : 1; };
  let ned: P;
  if (f < 974) ned = flow(f, [
    [919, { expr: "neutral", facing: fW, armR: AR.hipR, armL: AR.hipL, pocketsOut: true, tilt: 3 }],   /* r76i: pockets turned out from the start of "one broke builder" */
    // r13: carries the heavy loaf in front of his chest (overhead it crossed the back of his head)
    [932, { expr: "worry", facing: fW, armR: AR.shrugR, armL: AR.shrugL, pocketsOut: true, tilt: -3, sweat: 0.6, headTilt: 6 }, 6],   /* r76i (both reviewers: the torn purse read as a yellow octagon): empty pockets, an empty-handed shrug */
    // r39: on 945 he lowers the first loaf with his LEFT hand onto the wall top beside him (screen-left, where the wall runs);
    // the loaf course appears just after (946-952)
    // r42: the loaf level and resting ON the wall top (it hovered, tipped, in front of the wall's end), his body upright
    [939, { expr: "worry", sweat: 1, facing: fW, armR: AR.shrugR, armL: AR.shrugL, pocketsOut: true, tilt: 3, headTilt: -5 }, 5],
    [950, { expr: "smile", facing: fW, armL: [[-30, 26], [-46, 62]] as A2, armLFront: true, armR: [[22, 10], [4, 26]] as A2, armRFront: true, tilt: 0, noAutoTilt: true, mode: "brace", braceK: 0.45 }, 3],
    [958, { expr: "eureka", facing: fW, armR: [[30, -4], [52, -14]] as A2, armL: AR.hipL, headTilt: -6, tilt: -4 }, 4],                       // SHOCK 1: it's done already?
    [968, { expr: "eureka", facing: -fW || 1, armR: AB.carryR, armRFront: true, propR: "loaf", armL: AR.hipL }, 6],
  ]) as P;
  else if (f < 1006) { const c = cyc(f - 974, 10), up = Math.sin(c * Math.PI);
    ned = pose(null, { expr: "joy", facing: fW, armR: [[26, 8 - 22 * up], [44 + 10 * c, -8 - 30 * up]] as A2, armRFront: true, propR: c < 0.9 ? "loaf" : undefined, armL: [[-24, 10], [-36, 0]] as A2, tilt: 4 - 6 * up, headTilt: 3 * Math.sin(f * 0.6) }); }
  else ned = flow(f, [[1006, { expr: "joy", facing: -fW || 1, armR: AR.hipR, armL: AR.hipL, headBack: 0.3 }], [1014, { expr: "beam", facing: -fW || 1, armR: [[26, -10], [36, -34]] as A2, armL: AR.hipL }, 8]]) as P;
  const wallH = f < 974 ? lerp(0.34, 0.42, sm(f, 946, 952)) : lerp(0.42, 1, lin(f, 974, 1004));   // r24: four courses up already, so his wall reads at 945
  const tea = 1 + 1.6 * sm(f, 1030, 1049);
  return { ctl: { wallH, tea, spring: 1, cart: 0, stick: 1, cartX: 23.6, cartZ: -4.4, cartRot: 2.4 },
    cast: [C("ned", N_W, ned as FigOpts, { idx: 5 })],
    fx: fxs(steam4(f), f < 1018 ? [0, 1, 2, 3, 4].map((i) => { const ph = ((f * 0.018 + i / 5) % 1); return steamCard("mugS" + i, [MUGP[0] + 0.025 * Math.sin(f * 0.12 + i * 1.7) * ph, MUGP[1] + 0.12 + 0.3 * ph, MUGP[2]], 0.04 + 0.07 * ph, 0.5 * Math.min(1, ph * 6) * (1 - ph), i + 1); })   /* r76i (both reviewers): rising, fading wisps (one big card read as a blocky white smear) */ : null,   /* r76c: the tea steams in the medium (no steam read) */ f >= 947 && f < 957 ? dustCard("lay", [18.7, 1.0, -6.05], 0.25, 1 - (f - 947) / 10, 2) : null,
      f >= 974 && f < 1006 && (f - 974) % 10 < 6 ? dustCard("lay" + Math.floor((f - 974) / 10), [lerp(17.0, 19.0, ((f - 974) * 37 % 100) / 100), WALL_TOP(lerp(0.25, 1, lin(f, 974, 1004))) - 0.05, -6.0], 0.22, 0.8 - ((f - 974) % 10) / 8, 3) : null),
    focus: f < 1008 ? head(N_W) : [MUGP[0], MUGP[1] + 0.1, MUGP[2]], subj: f < 1008 ? "ned" : null };
};
KICKS.push([948 / 30, 0.12]);
KEY_PUNCH.push(958, 1001, 1159);
lens3([[919, 3.5, 1], [974, B_FS, 10], [1008, B_INS, 12]]);   /* r53: less blur on the site (the leaf clusters broke into a cyan pixel mosaic) */   /* r50: the site background less mushy in the medium shot */

// ================================================= SCENE 5 (1049-1109) THE YARD BY SPRING
// three builders queue at Amos's cart (coins, a barrow, pointing), Amos hands one a loaf, Silas peeks over his wall in
// shock, the taxman at the side sweats over his open ledger; push to the ledger (1088-1104) for the page dissolve.
// r13: a receding queue at four depths (screen x 18/40/56/71/89 %, no head on a head), seen from over the yard fence; Silas is not in this shot
const Q_AMOS: V3 = [1.6, 0, 3.5], Q_B1: V3 = [0.25, 0, 4.12], Q_B2: V3 = [0.66, 0, 2.0], Q_B3: V3 = [1.12, 0, 3.62],   /* r76i: the back builder between the two front heads, clear of both and of the loaf stack */   /* r76b: B3 in from the right edge, B1 off the loose brick */   /* r76: front-left / back-centre / middle-right under a higher lens, so the heads stagger up the frame (they stood in a row, two heads touching) */   /* r68b: staggered in depth, front / back-left / middle-right (the three heads overlapped in one row) */   /* r60: the two outer builders a step in, coins at the chest (raised, both coin hands were cut by the edges) */   /* r58: the third builder comes round the cart's right end (behind the first one his face was covered) */   /* r53: the builders crowd round the cart, Amos hands loaves across it (in a line the cart was off-frame and the heads overlapped) */ Q_B4: V3 = [-2.6, 0, 1.6], Q_SIL: V3 = [-2.45, 0, 3.0], Q_TAX: V3 = [-0.55, 0, 1.45];   /* r50: the line runs across the frame, stepping back (seen end-on the heads stacked like a totem, the third one behind the wall) */   /* r47: a real line in depth, one behind the other (it read as a cluster); the taxman in the gap, watching it */   // r44: THREE builders in one diagonal line back from the cart (narration: "three builders want loaves"; four in two files read as a crowd)
// r13: fit the queue + the taxman only (Silas peeks from the left edge): the builders read ~2x larger
const SH11: CamT = { pos: [0.66, 2.4, 6.9], look: [0.62, 0.86, 2.6], fov: 58, roll: 0 };   /* r76f: the queue higher in frame, the loaf clear of the caption */   /* r76e: in tighter (the lower quarter was empty paving) */   /* r76: a high angle down on the queue */   /* r69: tilted down (a third of the frame was sky) */   /* r68: inside the yard fence (its top rail was a dark blurred band across the bottom) */   /* r66: lower, a touch up at the coins and faces (fully low, the cart and beam hid their bodies) */   /* r57: lower and a touch tighter (a third of the frame was bare paving) */   /* r54: right a touch (Amos's brim met the right edge) and lower (less bare paving) */   /* r53: square on to the cart, the loaves in the middle of the frame */   /* r49: wider (Amos sat under the Shorts buttons, the corner props were cut) */   /* r48: panned left (the back of the line was cut by the left edge) */   /* r47 */   // r44: the line of three, heads stepping up and back   // r41: square on to the line, at eye height   // r36: higher, looking down the queue (two files, heads clear of each other)   // r26d: tilted up (less bare ground)   // r25: a little higher so the back heads clear the front ones
SHOT_CAMS[5] = () => {
  // opens inside the steam (the tea-steam dissolve, 8 f), holds while it clears (1.2 s), then a slow glide in on Amos handing a loaf
  const s11 = F(() => SH11, 1045, 0.0016);
  return [K(1045, s11, 1, true)];
};
/** the steam card in front of the scene-5 lens: thick through the dissolve, gone by 1066 */
const steam5 = (f: number) => { if (f > 1072) return null; const c = SH11 as Shot, d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]);
  // r13: clears by 1068 so "three builders" (1067) shows the queue
  const a = 1 - sm(f, 1050, 1068), out: FxSpec[] = [];
  for (let i = 0; i < 3; i++) { const k = 0.9 + 0.25 * i, dx = (i - 1) * 0.18 + 0.02 * (f - 1045) * (i - 1); out.push(steamCard("st5" + i, [c.pos[0] + d[0] / L * k + dx, c.pos[1] + d[1] / L * k + 0.04 * (f - 1045) / 10, c.pos[2] + d[2] / L * k], 1.5 + 0.3 * i, a, i + 2)); }
  return out; };
SHOT_ACTS[5] = (f, s) => {
  const fA = (p: V3) => { const v = toward(5, s, f, p, Q_AMOS); return Math.sign(v || 1) * Math.max(0.7, Math.abs(v)); };   /* r43: a clear three-quarter turn to Amos (coins held up to the lens) */
  const amos = flow(f, [
    [1045, { expr: "smile", facing: toward(5, s, f, Q_AMOS, Q_B1), armL: [[-24, -2], [-44, -8]] as A2, armLFront: true, armR: AR.hipR, headTilt: 3 }],   /* r56: an open palm (the coin on it read as a cream bun) */   /* r55: he takes the coins, palm out over the cart (narration: "three builders want loaves"; a hand-over read as pointing at the stack) */   // hands it over (r21: pleased, not smug)
  ]) as P;
  const b1 = pose(null, { expr: "beam", facing: 0.6, armR: [[26, -12], [38, -36]] as A2, armRFront: true, propR: "loaf", armL: AR.hipL, tilt: 3, headTilt: -4 }) as P;   /* r76h: his loaf level on both hands */   /* r56: both arms round the loaf at his belly (a hug, not a loaf floating over the cart) */   /* r55: the first builder already hugs his loaf */
  const coinUp = (side: number, ph: number): A2 => [[side * 26, -4], [side * 48, -14 - 3 * Math.sin(f * 0.25 + ph)]] as A2;   // r44: coins held out toward Amos (held up by the face they were offered to the lens)
  const b2 = pose(null, { expr: "eureka", facing: -0.5, armR: [[16, 14], [12, 26 - 2 * Math.sin(f * 0.25)]] as A2,   /* r76c: coins in the hand away from the front builder (they hovered over his cap) */ armRFront: true, propR: "coin", armL: AR.hipL, tilt: 2 * Math.sin(f * 0.2) });   /* r71: coins raised on a visible arm (they floated at his side) */   /* r59: coins in his outer hand (between the heads they were wedged against the cap) */   /* r56: coins held high, clear of every head */
  const b3 = pose(null, { expr: "proud", facing: 0.5, armR: [[16, 14], [12, 26 - 2 * Math.sin(f * 0.25 + 1.3)]] as A2, armRFront: true, propR: "coin", armL: AR.hipL, headTilt: -4 });   /* r76i: coins nearer his body (the frame edge cut them) */   /* r76i: coins on his open side (on the left they touched the front builder's cap) */   /* r76h: coins held out on the open right side (on the left his hand hid behind the front builder's cap and the coins floated) */   /* r71: coins held up close by his head on his outer arm (behind the front builder the inner arm vanished) */   /* r69: coins in his inner hand (in the outer one they met the right edge) */   /* r55: an empty hand up, "me next" (his coins over the loaves read as a cream bun) */
  void Q_B4; const b4 = pose(null, { expr: "joy", facing: fA(Q_B4), armR: coinUp(1, 2.4), armRFront: true, propR: "coin", headTilt: -3, tilt: 2 * Math.sin(f * 0.17 + 1) });
  const silas = flow(f, [[1045, { expr: "neutral", facing: fA(Q_SIL), armR: [[26, 16], [40, 30]] as A2, armL: [[-26, 16], [-40, 30]] as A2 }], [1066, { expr: "shock", facing: fA(Q_SIL), armR: [[26, 16], [40, 30]] as A2, armL: [[-26, 16], [-40, 30]] as A2, hatLift: 0.6 }, 4]]) as P;   // SHOCK 2
  const tax = flow(f, [[1045, { expr: "worry", facing: fA(Q_TAX), armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, armR: AB.quillR, armRFront: true, propR: "quill", sweat: 1 }],
    [1084, { expr: "dismay", facing: toward(5, s, f, Q_TAX, [Q_TAX[0], 0, Q_TAX[2] + 3]), armL: [[-20, 8], [-28, -10]] as A2, armLFront: true, propL: "ledger", propK: 1, armR: AB.quillR, armRFront: true, propR: "quill", sweat: 1, headTilt: 6 }, 8]]) as P;
  void tax; void Q_TAX; void amos;
  return { ctl: { spring: 1, cart: 0, cartOn: 1, stack: 0, rain: 0, lantern: 0, loaf: 0, brick: 0, clay: 0, qfg: 0 },
    cast: [C("bld1", Q_B1, b1 as FigOpts, { idx: 51 }), C("bld2", Q_B2, b2, { idx: 52 }), C("bld3", Q_B3, b3, { idx: 53 })],   /* r58: the three builders and the cart fill the frame (with Amos four heads were packed into 60 % of the width) */   /* r53: the taxman left out (he was a tiny head behind the queue; the next shot is his ledger) */
    fx: fxs(steam5(f)),
    focus: head(Q_B1), subj: "bld1" };
};
lens3([[1045, 5, 1]]);   /* r47: the taxman behind readable (his sweat and blank ledger were soft) */   // r26b: the back of the queue soft (everything read equally sharp)

// ================================================= SCENE 6 (1109-1181) THE OFFICE BY SUMMER, NIGHT
// opens on the ledger spread (the page dissolve), the 1785 total is written on "half" (1159): £30 under £60; pull back
// to the taxman's face: worry -> dismay (shock 3) on "empty" (1166), the quill drops.
SHOT_CAMS[6] = () => {
  // hard cut 1103 (time jump "and by summer"): the taxman behind his desk (eyes ~40%), the open ledger below him; a quick
  // crane over the desk to the 1785 page lands on "ledger" (1146); the £30 total appears on "half" (1159); an 8-frame push
  // up to his face lands on "empty" (1166)
  // r15: centred on the ledger (it spans x -0.5..0.5; the 1785 page is the right half)
  const DESK: CamT = { pos: [0.1, 1.68, 0.56], look: [0.06, 1.05, -1.3], fov: 56, roll: 0 };   /* r76i (both reviewers): the ledger and its 1784 TOTAL above the caption band */   /* r76i: back a touch and tilted up - less desk, the ledger under 70 % */   /* r59: tilted up and in (the bottom fifth was bare desk) */   /* r53: in a little (a band of empty desk filled the bottom fifth) */   // r44: less empty desk front   // r26b: low, the sloped ledger faces the lens (48-70 %), the taxman behind it   // r26: pushed in (the desk front filled the lower third)   // r25: the ledger above the caption band   // r20: over the desk: the ledger fills the lower third (63-88 %), the inkwell fully out   // r12: higher, the whole ledger in frame (29-91 %)
  const PAGE: CamT = { pos: [0.15, 1.907, -0.426], look: [0.15, 1.02, -0.97], fov: 44, roll: 0 };   // r26c: the smaller ledger   // r26b: square to the sloped page   // r25: follows the ledger back on the desk   // r24: follows the smaller ledger's 1785 page
  const FACE: CamT = { pos: [0.05, 1.62, 0.25], look: [0.0, 1.3, -1.45], fov: 52, roll: 0 };
  const sD = F(() => DESK, 1103, 0.0008), sP = F(() => PAGE, 1146, 0.0012), sF = F(() => FACE, 1166, 0.002, [[1166, 0.006, 6]]);
  return [K(1103, sD, 1, true), K(1136, glideTo(sD, 1136, sP, 1146, 0.15), 1), K(1158, glideTo(sP, 1158, sF, 1166, 0), 1)];
};
SHOT_ACTS[6] = (f, s) => {
  const fC = toward(6, s, f, OFFICE.DESK, [0, 0, 2]);
  const tax = flow(f, [
    [1103, { expr: "worry", facing: fC, armR: [[24, 6], [38, 4]] as A2, armRFront: true, propR: "quill", armL: [[-22, 8], [-30, 14]] as A2, armLFront: true }],
    [1126, { expr: "worry", facing: fC, armR: [[24, 8], [36, 10]] as A2, armRFront: true, propR: "quill", armL: [[-24, 14], [-36, 30]] as A2, armLFront: true, headTilt: 4, sweat: 0.5 }, 8],   // writes
    [1152, { expr: "dismay", facing: fC, armR: [[24, 8], [36, 10]] as A2, armRFront: true, propR: "quill", armL: [[-24, 14], [-36, 30]] as A2, armLFront: true, sweat: 1, headTilt: 6 }, 6],
    [1163, { expr: "aghast", facing: fC, armR: [[26, 4], [40, 10]] as A2, armRFront: true, armL: [[-26, 4], [-40, 10]] as A2, sweat: 1, headBack: 0.3 }, 3],   // SHOCK 3: the quill drops
  ]) as P;
  return { ctl: { ledger: 1, coins: 1, candle: 1 },   /* r43: this year's £30 total shows from the start (the half-empty page read as unfinished) */   // r42: this year's stack stays at half (it grew back from 6 to 9 coins on "half")
    cast: [C("tax", [0, 0, -1.45], tax as FigOpts, { idx: 3 })],
    fx: fxs(f >= 1163 && f < 1173 ? sparkle("quill", [0.25, 0.9, -0.7], f - 1163, 0.15, "#ffffff") : null),
    focus: f >= 1140 && f < 1160 ? [0.15, 1.02, -0.97] : f < 1140 ? [0, 1.0, -0.98] : [0, 1.3, -1.45], subj: f >= 1140 && f < 1160 ? null : "tax" };
};
lens3([[1103, 9, 1], [1138, B_INS, 8], [1158, B_CU, 8]]);   // r44: the bookshelves soft behind the ledger   // r26c: the coins and the taxman both readable around the ledger
// =====================================================================================================================
// scenes 7-9: the trick in the shed at night, the inn comparison and the Act, the payoff on Church Lane at sunset.

// ================================================= SCENE 7 (1181-1415) THE TRICK, NIGHT IN THE SHED
// Amos behind the bench under the lantern. 1181-1290: the scale "SAME CLAY": he sets one lump (the beam tips, 1236),
// then the other ("Same clay", 1262): level. 1290-1410: glide along the two same-size model walls; the chalk ticks 8
// under the normal wall (1300-1345) and 4 under the loaves (1350-1372); half-crowns drop 8 then 4 (1380-1400).
// 1400-1415: he lifts a loaf toward the lens (the shape match into the inn's tankard).
const AS: V3 = YARD.AMOS.slice() as V3; AS[0] = -0.03; AS[2] = -0.62;   // r20: a step left, nearer the (moved) scale
SHOT_CAMS[7] = () => {
  const SC: CamT = { pos: [-0.48, 1.42, 1.6], look: [-0.4, 1.28, -0.4], fov: 55, roll: 0 };   // r26b: the whole (bigger) scale in frame, left pan clear of the edge   // r26: lower and closer: Amos and the raised scale fill the frame, the bench only the bottom quarter   // r20: scale left (14-47 %), Amos 65 %, the model walls out right (solved with the orbit and the 1248 truck)   // r20: the whole scale, Amos and the whole slate in one frame   // r12: closer + level: the bench underside drops out (<15 %), Amos at 65 %, the lantern top-left            // r5: the CP3 shed lock (Amos, scale, slate, walls, the lantern)
  const sSC = F(() => SC, 1183, 0.0004);   // r20: f0 1183 turns the slow orbit the other way: the scale drifts away from the left edge, the model walls stay out right   // r12: a gentler creep keeps the scale and its sign whole
  const WL: CamT = { pos: [0.79, 1.0, 1.3], look: [0.68, 1.2, -0.05], fov: 51, roll: 0 };   /* r76: level, not looking up (the top quarter was empty ceiling) */   /* r59: lower and tilted up (the bench top was the bottom 27 %) */   /* r53: lower (a band of bare table filled the bottom fifth) */   /* r51: the tower bases above the bottom band */   /* r49: in (empty ceiling over the slate, a table band under the towers) */   // r44: the towers ~70 % wide (80 % at 48 deg)   // r38: only 6 deg off square (at 20 deg the loaf tower stood nearer and read taller)   // r36: turned 20 deg and pulled back (the head-on towers spanned 85 % and read as a diagram)   // r35: pushed in and tilted up: the towers stand on the bottom fifth   // r25: low, the bench top foreshortened (it filled the lower half)   // r25: the two towers 63 % wide, 29-62 % high, the chalk 8 and 4 above them   // r20: the walls 76 % wide above the caption, the slate over them            // the two model walls
  const SL: CamT = { pos: [0.64, 1.7, 1.25], look: [0.64, 1.66, -0.36], fov: 54, roll: 0 };   /* r55: follows the raised slate */   // r25: the raised slate, ~70 % wide         // the slate
  const COIN: CamT = { pos: [0.64, 1.12, 1.35], look: [0.64, 1.1, -0.05], fov: 48, roll: 0 };   // r25: low, the bench top foreshortened (it filled the lower half)            // r5: steep from above, Amos's head stays out of the top
  const LANT: CamT = { pos: [-0.23, 1.5, 1.7], look: [-0.48, 1.45, -0.8], fov: 52, roll: 0 };   // r12: follows the moved lantern (same 45 % / 25 % as the inn match)          // r5: the lantern (Amos has walked off right): matches the inn's lantern
  // r26b: the scale insert on "not clay / Same clay" (1238-1288): the whole balance ~65 % wide, the loaf against the two bricks
  const SINS: CamT = { pos: [-0.5, 1.0, 1.1], look: [-0.64, 1.2, -0.1], fov: 62, roll: 0 };   /* r76i (both reviewers): in on the pans (~70 % wide) and tilted down off the empty rafters */   /* r76i: past the bench's near edge (its blurred front took the lower quarter) */   /* r76i (both reviewers): back to ~62 % wide and lower (80 % broke the 70 % rule) */   /* r76i (both reviewers): in closer, the balance fills the bottom (blurred table and the mould box took the lower quarter) */   /* r76: back 13 % (the balance spanned 78 %) */   /* r59: low and closer (28 % bare bench under the balance) */   /* r55: the balance ~65 % wide (75 % at 49) */   /* r54: lower (30 % bare table), the lantern mostly out */   /* r53: the balance ~68 % wide (83 % at fov 45) */   /* r51: a slight angle, the lantern out of the top, the right pan clear of the Shorts buttons */   /* r48: the lantern out of the top (its bloom pulled the eye) */   /* r47: in on the pans (each was only ~20 % of the width) */   // r46b: (at table height the bench's front panel filled the lower third)   // r44: the balance ~67 % wide (at 46 deg it spanned 81 %)   // r42: pushed in on the pans (the crate and the empty table took the lower 30 %, the loaf and bricks only ~20 % wide each)   // r38: a touch wider (the pans spanned 76 %, the lantern cap clipped)   // r35: level with the pans, the crate at 80 % (the empty tabletop filled the lower third)   // r26j: the wider pans ~70 %, the spare loaf and bricks above the caption   // r26i: the lantern wholly out of the top   // r26e: the lantern off the top edge
  const sIns = F(() => SINS, 1250, 0.0012);
  return [K(1181, sSC, 1, true),
    K(1238, glideTo(sSC, 1238, sIns, 1250, 0.1), 1),
    K(1288, glideTo(sIns, 1288, F(() => WL, 1300, 0.0015), 1300, 0), 1),
    K(1312, glideTo(F(() => WL, 1300, 0.0015), 1312, F(() => SL, 1326, 0.0015), 1326, 0), 1),
    K(1374, glideTo(F(() => SL, 1326, 0.0015), 1374, F(() => COIN, 1384, 0.0015), 1384, 0), 1),
    K(1398, glideTo(F(() => COIN, 1384, 0.0015), 1398, F(() => LANT, 1408, 0.001), 1408, 0), 1)];
};
SHOT_ACTS[7] = (f, s) => {
  const fC = toward(7, s, f, AS, [AS[0], 0, AS[2] + 3]), fS = toward(7, s, f, AS, YARD.SCALE), fW = toward(7, s, f, AS, YARD.WALLS), fSl = toward(7, s, f, AS, YARD.SLATE);
  const amos = flow(f, [
    [1181, { expr: "calm", facing: fC, armR: AR.hipR, armL: AR.hipL }],
    [1204, { expr: "calm", facing: fS, armL: [[-30, 8], [-56, 16]] as A2, armLFront: true, propL: "loaf", armR: AR.hipR, tilt: 4 }, 8],
    [1214, { expr: "calm", facing: fS, armL: [[-30, 14], [-58, 28]] as A2, armLFront: true, armR: AR.hipR, tilt: 6 }, 5],            // lump 1 on (1236)
    [1226, { expr: "calm", facing: fS, armR: [[26, 8], [10, 18]] as A2, armRFront: true, propR: "brick", armL: AR.hipL, tilt: 3 }, 8],
    [1230, { expr: "calm", facing: fS, armR: [[-10, 14], [-40, 28]] as A2, armRFront: true, armL: AR.hipL, tilt: 5 }, 4],              // lump 2 on (1262): level
    [1252, { expr: "smile", facing: fS, armR: AR.hipR, armL: [[-28, -2], [-54, -6]] as A2, armLFront: true, headTilt: 4 }, 8],   // r26: turns to the level scale (he ignored it)   // r21: presents the level scale on "Same clay" (1262)
    [1296, { expr: "calm", facing: fW, armR: AB.pointR, armRFront: true, armL: AR.hipL }, 8],
    [1318, { expr: "calm", facing: fSl, armL: [[-26, -6], [-46, -16]] as A2, armLFront: true, armR: AR.hipR }, 8],                    // chalks on the slate
    [1376, { expr: "proud", facing: fC, armR: [[26, 6], [44, 16]] as A2, armRFront: true, armL: AR.hipL }, 8],                        // drops the coins
  ]) as P;
  // r5: he pockets the coins and walks off right (1396-1410) so the lantern match into the inn carries nobody
  // r12: he steps left out of the wall/slate insert (1284-1298), then walks off right behind it (1396-1410)
  const baseX = lerp(AS[0], 0.52, sm(f, 1238, 1252))   /* r39: clear of the widened scale insert (his arm poked in at the edge) */, stepX = lerp(baseX, -0.85, sm(f, 1284, 1298))   /* r36: further left (the turned tower insert caught his face at the edge) */,   /* r26b: he steps right, out of the scale insert */ exitK = sm(f, 1396, 1410), AS2: V3 = [lerp(stepX, 1.9, exitK), 0, AS[2]];
  const chalkL = Math.min(8, Math.floor(lin(f, 1300, 1346) * 8.99)), chalkR = Math.min(4, Math.floor(lin(f, 1350, 1373) * 4.99));
  const coinL = lerp(0, 8, lin(f, 1380, 1392)), coinR = lerp(0, 4, lin(f, 1392, 1400));
  const tip = f < 1218 ? 0 : f < 1233 ? -sm(f, 1218, 1226) : -1 + sm(f, 1233, 1246);   // r21: one lump on "taxed" (1218) tips it, the second on "not clay" (1240) levels it before "Same clay"
  return { ctl: { night: 1, lantern: 1, trick: 1, chalkL, chalkR, coinL, coinR, lumpL: f >= 1218 ? 1 : 0, lumpR: f >= 1233 ? 1 : 0, scaleTip: tip,
      demoLoaf: 0, lift: 0, loaf: 0, brick: 0, normMould: 0, cartOn: 0, clay: 0, mouldOn: 0 },
    cast: [C("amos", AS2, (f >= 1396 ? pose(null, { expr: "calm", facing: 1, mode: "walk", phase: (f - 1396) / 12 }) : amos) as FigOpts, { idx: 1 })],
    fx: fxs(f >= 1380 && f < 1400 && (f - 1380) % 3 === 0 ? sparkle("coin" + f, [YARD.WALLS[0] + (f < 1392 ? -0.15 : 0.15), 0.95, 0.12], 2, 0.12, "#fff2c8") : null),
    focus: f < 1238 ? [-0.38, 1.15, -0.2] : f < 1290 ? [-0.62, 1.17, -0.1] : f < 1314 ? [0.64, 1.08, -0.05] : f < 1376 ? [0.64, 1.62, -0.36] : f < 1398 ? [0.64, 1.0, 0.0] : [-0.55, 2.08, -0.8],
    subj: f < 1290 ? "amos" : null };
};
lens3([[1181, B_MS, 1], [1240, 12, 10], [1290, 10, 10], [1398, B_CU, 10]]);   // r44: depth falloff behind the scale and the towers (the shelves were as sharp as the subject)   // r26e: the moulds in front of the towers stay readable   // r24: the model walls stay crisp in their insert

// ================================================= SCENE 8 (1415-1713) THE INN, EVENING
// 1415-1524: the giant tankard (shape match), pull back to Amos at the bar, Bess, "ALE 1d A MUG"; Amos slaps a penny
// (1450); Bess pours and keeps pouring (1476-1514), smile -> worry; a drinker laughs at the back.
// 1524-1606: Bess measures the tankard with a yardstick and shrugs (1549); the taxman, furious, flips "EXCISE ACTS" and
// slams it shut (1600). 1606-1713: the crier pins the Act on the post (1636), the Act insert (1645-1690), the taxman
// gloats (1691) and walks out of the door into the sunset (1700-1713).
const I_AMOS: V3 = [-0.7, 0, -1.17],   /* r42: a step left, his brim clear of the tankard handle */ I_BESS: V3 = [0.97, 0.31, -2.63]   /* r71: her step lowered with the counter */   /* r47: in from the bar-shot edge */, I_TAX: V3 = [1.25, 0, -1.25], I_DRK: V3 = [-2.3, 0, 0.9], I_CRIER: V3 = [3.62, 0, -0.62], I_CRIER2: V3 = [3.3, 0, -1.6], I_DOOR: V3 = [3.75, 0, 1.2], I_OUT: V3 = [5.2, 0, 1.2], I_TAX2: V3 = [1.9, 0, -0.4];   // r5: the CP3 inn lock staging
SHOT_CAMS[8] = () => {
  // r5: opens on the inn's lantern (the lantern match from the shed) with the bar below it: hold; Amos walks in and slaps a
  // penny (1450); a glide back to the CP3 inn two-shot (1455-1478); the giant tankard goes on the bar (1507); Bess pours.
  const OPEN: CamT = { pos: [-0.1, 1.75, 0.6], look: [-0.35, 1.7, -1.9], fov: 52, roll: 0 };
  const BAR: CamT = { pos: [-1.45, 1.72, 0.4], look: [-0.3, 1.0, -2.2], fov: 60, roll: 0 };   /* r76i: from higher - the bar TOP with its mugs is the lower band, not the plank front */   /* r76i (reviewer): in close - Amos fills the frame to its foot (the bar front and floor took the lower 43 %) */   /* r76i (reviewer): pushed in - Amos 35 % wide, the floor out of frame (his head was 27 % under the mug and sign) */   /* r76f: from higher (the bar front was the lower third) and left (Amos was cut at the edge) */   /* r76e: in on Amos, the giant mug and Bess (empty ceiling above, bare bar front below) */   /* r76c: back a step and up (Bess was cut at the right edge, the bar front filled the lower quarter) */   /* r76b: tilted up and in (the floor and bar front were the lower 40 %) */   /* r67: up a touch (the bottom 40 % was bare planks), Bess further in from the edge */   /* r51: in a little (Amos read small) */   /* r47: back a little (the boater brim touched the left edge, the barmaid's shoulder the right) */   // r46: the boater clear of the left edge   // r44: in a little (the plank floor took the lower quarter)   // r42: a touch left (the boater touched the left edge after Amos stepped clear of the tankard)   // r35: Bess wholly inside the right edge, the boater inside the left   // r26b: lower and level (the floor filled the lower quarter)   // r25: wider: the boater clear of the tankard handle, Bess clear of the right edge   // r12: lower: less empty floor   // r6: higher, looking down: eyes at ~44%, less bar front
  const sOpen = F(() => OPEN, 1411, 0.0012), sBar = F(() => BAR, 1490, 0.0012);
  const DEB = frameTwo(head(I_TAX), [I_BESS[0], I_BESS[1] + 1.3, I_BESS[2]], -15, 64, 32);
  const sDeb = F(() => DEB, 1530, 0.0014);
  const POST = frameOn(head(I_CRIER), -70, 0.34, 40, 52, 0.15, 0.4);
  const ACT: CamT = { pos: [2.05, 1.6, 0.3], look: [3.95, 1.55, -0.3], fov: 40, roll: 0 };   // r10: the whole notice, about 60% of the width
  const GLOAT = frameOn(head(I_TAX2), -45, 0.34, 40, 52, 0.2, 0.4);   // r7: the camera path from the Act insert stays clear of him
  const DOORV: CamT = { pos: [2.5, 1.6, 1.2], look: [4.9, 1.45, 1.2], fov: 52, roll: 0 };
  return [K(1411, sOpen, 1, true),
    K(1452, glideTo(sOpen, 1452, sBar, 1490, 0.05), 1),   // a slow 38-frame travel (part of the calm comparison stretch 1411-1518)
    K(1518, glideTo(sBar, 1518, sDeb, 1530, 0.1), 1),
    K(1606, glideTo(sDeb, 1606, F(() => POST, 1618, 0.0015), 1618, 0.1), 1),
    K(1640, glideTo(F(() => POST, 1618, 0.0015), 1640, F(() => ACT, 1648, 0.0012), 1648, 0), 1),
    K(1678, glideTo(F(() => ACT, 1648, 0.0012), 1678, F(() => GLOAT, 1696, 0.0012), 1696, 0.05), 1),
    K(1698, glideTo(F(() => GLOAT, 1694, 0.0012), 1698, F(() => DOORV, 1708, 0.001), 1708, 0), 1)];
};
SHOT_ACTS[8] = (f, s) => {
  const fBess = toward(8, s, f, I_AMOS, I_BESS), fAm = toward(8, s, f, I_BESS, I_AMOS), fTx = toward(8, s, f, I_BESS, I_TAX);
  // Amos walks in after the lantern dissolve (1422-1442), slaps a penny (1450), heaves the giant tankard onto the bar (1494-1507)
  const aIn = sm(f, 1422, 1442), I_ABAR: V3 = [-0.8, 0, -1.6], aPos: V3 = f < 1508 ? lerp3([-1.9, 0, -0.85], I_AMOS, aIn) : lerp3(I_AMOS, I_ABAR, sm(f, 1508, 1515));   /* r62: after the thump he steps up to the bar and leans on his tankard (from the reaction angle he stood apart from it) */
  const amos = f < 1442 ? pose(null, { expr: "calm", facing: 1, mode: "walk", phase: (f - 1422) / 12 }) : flow(f, [
    [1442, { expr: "calm", facing: fBess, armR: [[26, 4], [44, 8]] as A2, armRFront: true, armL: AR.hipL }],
    [1446, { expr: "calm", facing: fBess, armR: [[26, -12], [40, -30]] as A2, armRFront: true, propR: "cash", armL: AR.hipL }, 3],
    [1450, { expr: "determined", facing: fBess, armR: AB.slamR, armRFront: true, armL: AR.hipL, tilt: 4 }, 2],                   // SLAP the penny
    [1470, { expr: "calm", facing: fBess, armR: [[26, 4], [44, 8]] as A2, armRFront: true, armL: AR.hipL, headTilt: 3 }, 8],
    [1490, { expr: "strain", facing: fBess, armR: [[24, 18], [34, 34]] as A2, armRFront: true, armL: [[-24, 18], [-34, 34]] as A2, armLFront: true, mode: "brace", braceK: 0.8 }, 4],   // grabs it from below
    [1500, { expr: "strain", facing: fBess, armR: [[24, -4], [38, -16]] as A2, armRFront: true, armL: [[-24, -4], [-38, -16]] as A2, armLFront: true, sweat: 0.6 }, 5],             // heaves it up
    [1507, { expr: "proud", facing: fBess, armR: [[28, -24], [52, -46]] as A2, armRFront: true, armL: AR.hipL, tilt: 9, headTilt: 5 }, 2],   /* r60: leans on his tankard */
    [1508, { expr: "proud", facing: fBess, mode: "walk", phase: (f - 1508) / 8, armR: AR.hipR, armL: AR.hipL }, 2],   /* r62: a step to the bar */
    [1512, { expr: "smug", facing: fBess, armR: [[34, -18], [58, -34]] as A2,   /* r76i (reviewers): an open hand presenting the tankard beside it, not over it */   /* r76i: the dot hand just short of the handle, in view (inside the loop the 3D handle hid it) */   /* r76c: up into the loop (it touched only the handle's bottom tip) */   /* r76: the dot inside the handle loop (it touched the outside of the handle) */   /* r72: reaching out past his brim to the handle (the hand hid behind his head) */   /* r69: the dot hand ON the handle (it sat on the tankard below it) */ armRFront: true, armL: AR.hipL, tilt: 9, headTilt: 6 }, 3],   /* r62: leaning on the bar, his hand on the tankard handle */   /* r38: hand up on the tankard (lower, it read as pointing away) */                                                           // THUNK on the bar, his hand stays on it (r20)                                                           // THUNK on the bar
    [1542, { expr: "calm", facing: toward(8, s, f, I_AMOS, I_TAX), armR: AR.hipR, armL: AR.hipL }, 10],   /* r62: later (he holds the tankard through "mug.") */
  ]) as P;
  const bess = flow(f, [
    [1411, { expr: "smile", facing: fAm, armR: AR.hipR, armL: AR.hipL }],
    [1512, { expr: "aghast", blink: 0, tilt: -8, headBack: 0.4, facing: fAm, armR: [[20, -2], [8, -22]] as A2, armRFront: true, armL: [[-22, 10], [-34, -6]] as A2, armLFront: true }, 5],   /* r76i: a shock recoil, hand to her cheek (a raised arm poked up behind the tankard like an antenna) */   /* r68: BOTH hands thrown up above her head (the near hand hid behind the tankard, the other only reached her chest) */   /* r59: a hand up to her cheek (the shock reads; her hip elbow was cut by the right edge) */   /* r56: she stops and stares at the giant tankard, jug at her side (the pour landed in a small mug, not his) */    // pours into it
    [1530, { expr: "worry", facing: fAm, armL: [[-26, -20], [-30, -52]] as A2, armLFront: true, armR: [[26, -20], [30, -52]] as A2, armRFront: true, sweat: 0.8 }, 4],   /* r59: the shock holds through "mug." (the swap blink to worry landed on 1520) */ // keeps pouring
    [1534, { expr: "neutral", facing: fAm, armR: [[-24, -10], [-36, -36]] as A2, armRFront: true, propR: "yardstick", armL: AR.hipL }, 8],            // measures it
    [1546, { expr: "calm", facing: fTx, armR: AR.shrugR, armL: AR.shrugL, headTilt: 5 }, 6],                                                            // shrugs (1549)
  ]) as P;
  const fBk = toward(8, s, f, I_TAX, INN.BOOK);
  const tax = flow(f, [
    [1520, { expr: "angry", facing: fBk, armR: [[26, 10], [40, 20]] as A2, armRFront: true, armL: AR.hipL }],
    [1556, { expr: "fury", facing: fBk, armR: [[26, 6], [44, 12]] as A2, armRFront: true, armL: [[-26, 6], [-44, 12]] as A2, armLFront: true, tilt: 5, sweat: 0.6 }, 6],   // flips the pages
    [1594, { expr: "fury", facing: fBk, armR: AB.stampUpR, armL: AB.stampUpR.map((p) => [-p[0], p[1]]) as A2, tilt: -3 }, 5],
    [1600, { expr: "fury", facing: fBk, armR: AB.slamR, armRFront: true, armL: AB.slamL, armLFront: true, tilt: 6 }, 2],                                            // SLAM
    [1612, { expr: "angry", facing: toward(8, s, f, I_TAX, I_CRIER), armR: AR.hipR, armL: AR.hipL }, 10],
    [1684, { expr: "tacheUp", facing: toward(8, s, f, I_TAX2, [0, 0, 0]), armR: [[26, -10], [36, -34]] as A2, armL: AR.hipL, headTilt: 4 }, 6],                   // gloats
  ]) as P;
  const shakeFury = f >= 1556 && f < 1606 ? 2.5 * Math.sin(f * 2.1) : 0;
  const crier = flow(f, [
    [1606, { expr: "stern", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armL: [[-24, -6], [-40, -20]] as A2, armLFront: true, propL: "notice", armR: AR.hipR }],
    [1628, { expr: "strain", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armR: AB.stampUpR, propR: "hammer", armL: [[-26, -8], [-44, -24]] as A2, armLFront: true }, 6],
    [1636, { expr: "proud", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armR: [[26, -6], [46, -14]] as A2, armRFront: true, propR: "hammer", armL: AR.hipL }, 2],   // BANG
  ]) as P;
  // the taxman crosses to the door side while we read the Act (1644-1680, off screen), gloats (1684-1694), hurries out (1694-1708)
  const tPos: V3 = f < 1644 ? I_TAX : f < 1684 ? lerp3(I_TAX, I_TAX2, sm(f, 1644, 1680)) : f < 1692 ? I_TAX2 : f < 1704 ? lerp3(I_TAX2, I_DOOR, sm(f, 1692, 1704)) : lerp3(I_DOOR, I_OUT, sm(f, 1704, 1709));
  const tWalk = (f >= 1644 && f < 1680) || (f >= 1692 && f < 1709);
  const cPos: V3 = f < 1638 ? I_CRIER : lerp3(I_CRIER, I_CRIER2, sm(f, 1638, 1648));
  const cast: CastPlace[] = [];
  if (f >= 1422 && f < 1606) cast.push(C("amos", aPos, amos as FigOpts, { idx: 1 }));
  if (f < 1606) cast.push(C("bess", I_BESS, bess as FigOpts, { idx: 7 }));
  if (f >= 1518 && f < 1709) { const tIn = lerp3([2.7, 0, -0.4], I_TAX, sm(f, 1518, 1532)); cast.push(C("tax", f < 1532 ? tIn : tPos, f < 1532 || tWalk ? pose(null, { expr: f < 1532 ? "angry" : "tacheUp", facing: f < 1532 ? -1 : toward(8, s, f, tPos, f < 1694 ? I_TAX2 : I_OUT), mode: "walk", phase: (f - 1518) / 11 }) : { ...tax, tilt: ((tax.tilt as number) ?? 0) + shakeFury } as FigOpts, { idx: 3 })); }
  if (f >= 1600) cast.push(C("crier", cPos, (f >= 1638 ? pose(null, { expr: "proud", facing: -1, mode: "walk", phase: (f - 1638) / 12, propR: "hammer" }) : crier) as FigOpts, { idx: 8 }));
  return { ctl: { bigMug: 1, bigLift: f < 1494 ? -1 : sm(f, 1494, 1507), penny: f >= 1450 ? 1 : 0, ale: f > 1516 ? 1 : 0, act: f < 1636 ? 0 : sm(f, 1634, 1640), book: f >= 1556 && f < 1600 ? 1 : 0, door: sm(f, 1694, 1704) },
    fx: fxs(f >= 1450 && f < 1458 ? sparkle("penny", [INN.BIGMUG[0] - 0.15, 1.14, -1.72], f - 1450, 0.12, "#fff2c8") : null,
      f >= 1507 && f < 1517 ? dustCard("thunk", [INN.BIGMUG[0], 1.15, -1.8], 0.3, 1 - (f - 1507) / 10, 3) : null,
      f >= 1600 && f < 1610 ? clang("slam", [INN.BOOK[0], 1.2, INN.BOOK[2]], f - 1600, 0.35) : null, f >= 1636 && f < 1646 ? clang("bang", [INN.NOTICE[0] - 0.05, INN.NOTICE[1] + 0.2, INN.NOTICE[2]], f - 1636, 0.35) : null),
    cast, focus: f < 1455 ? [-0.25, 1.4, -1.85] : f < 1518 ? head(I_AMOS) : f < 1606 ? head(I_TAX) : f < 1640 ? head(I_CRIER) : f < 1684 ? [INN.NOTICE[0], INN.NOTICE[1], INN.NOTICE[2]] : head(I_TAX2),
    subj: f < 1455 ? null : f < 1518 ? "amos" : f < 1606 ? "tax" : f < 1640 ? "crier" : f < 1684 ? null : f < 1700 ? "tax" : null };
};
KICKS.push([1450 / 30, 0.12], [1507 / 30, 0.18], [1600 / 30, 0.3], [1636 / 30, 0.3]);
KEY_PUNCH.push(1218, 1233, 1366, 1400, 1450, 1480, 1507, 1549, 1600, 1636, 1679);
lens3([[1411, B_FS, 1], [1455, B_MS, 20], [1520, B_MS, 8], [1606, B_MS, 8], [1644, B_INS, 8], [1688, B_MS, 8], [1700, B_FS, 8]]);

// ================================================= SCENE 9 (1713-1860) CHURCH LANE, SUNSET (the payoff)
// out of the door's glare: one slow crane round to the taxman's new house of loaves beside the old cottage (house 1761);
// he walks to his door, holds his new 3-inch stick against one of his own bricks (1790-1820): the brick is twice the
// stick. SHOCK 4 on "Amos's loaves" (1825); Amos smirks on his cart by the cottage.
const L_TAX0: V3 = [-12.6, 0, -1.6], L_TAX1: V3 = [-15.2, 0, -3.06],   /* r60: a step off the wall foot (his feet were lost in the tufts and pebbles there) */ L_AMOS: V3 = [-16.1, 0, -2.96];   /* r72: a little further from the taxman (the boater brim touched his face) */   // r43: a step further from the taxman (his loaf covered the taxman's chin, the brims nearly touched)   // r38d: Amos a step nearer the lens than the taxman, so what he holds out draws in front of him   // r35: a step further from the taxman (the hat brims nearly touched)   // r26: in front of the gate (the pickets hid him), level with the taxman   // r12: Amos waits at the gate (in front of the pickets), nearer the lens   // r9: Amos waits by the taxman's door; the taxman stops in front of his garden wall   // r5: Amos waits by the tax house; the taxman arrives at his own wall
SHOT_CAMS[9] = () => {
  // r5: the CP3 lane-wide lock (the tax house of loaves + the old cottage, sunset) with a slow crane up (calm, 1717-1795),
  // then a glide in (1795-1815) to the two of them at the wall, landing 10 frames before "Amos's" (1825)
  // r7: starts on the taxman walking up (head above the caption band on "taxman's"), then rises and pulls back over the lane to the whole house by "house" (1761)
  const W0: CamT = { pos: [-11.2, 1.62, 0.3], look: [-13.4, 1.36, -2.0], fov: 52, roll: 0 }   /* r35: the taxman walks into the frame centre (he was jammed against the left edge) */   /* r20: closer, tilted up: less road */, W1: CamT = { pos: [-10.8, 1.05, -2.1], look: [-17.0, 1.72, -4.0], fov: 64, roll: 0 }   /* r76i (reviewer): the taxman at 40 % with the door and its plate at 79 % (he was squeezed to the left edge) */   /* r76d: down the lane, the new front raking away on the right, the cottage and the sunset sky beyond (it filled the frame square-on) */   /* r76b: back and narrower (the wide lens stretched the taxman's legs at the frame foot) */   /* r48: turned right: he walks toward his own door in the middle of the frame (he sat in the right-hand UI column) */   /* r47: in ~15 % (the taxman read small in the lower right over empty cobbles) */   /* r42: low behind his shoulder: he walks in big from the right (head ~18 % wide at 74 %, clear of the caption) and the whole loaf front towers over him (the far wide made him a speck under the caption) */   /* r41: a low three-quarter on the whole house with the old cottage beyond and the sunset sky behind (square-on read as a billboard) */   /* r40: tilted down: the taxman's face above the caption band, less bare sky */   /* r39: square on the whole new house - roof, 1785, sky and the lane (the angled crop cut the roof and the right side) */;   /* r53: tilted up and back a touch: the roofline and the sky over the house (the top third was bare facade) */   // r23: the crane ends on the seam where the old cottage (normal courses) meets the new house (loaf courses, two to one)
  const s0 = (f: number): Shot => { const k = sm(f, 1730, 1772); return { pos: lerp3(W0.pos, W1.pos, k), look: lerp3(W0.look, W1.look, k), fov: lerp(52, 40, k), roll: 0 }; };   // r76i: tighter on the taxman at his house   /* r76c: tighter at the end of the crane (the taxman was a fifth of the width) */   // r12: wider at the top so the low sun shows left of the house
  // r14: a medium on the taxman (head ~28 %, 64 %), Amos smaller at his door step (28 %), the EXCISE plaque between them
  const END: CamT = { pos: [-13.36, 1.0, -0.48], look: [-15.595, 1.36, -3.387], fov: 55, roll: 0 };   /* r62: LOW payoff two-shot, the house of loaves towering behind them */   /* r59: 0.4 m back and a touch left (Amos's brim at the left edge) */   /* r58: wider (both hats met the edges in turn) */   /* r54: half way back (r53 pushed Amos's brim off the left edge) */   /* r51: closer on the payoff faces */   // r38d: faces ~27 % wide, Amos nearer the lens than the taxman   // r38: pushed in and tilted down (faces ~30 % wide, less bare facade on top)   // r35: the raised loaf clear of the left edge   // r26f: tilted up (a blurred kerb filled the bottom)   // r20: closer and level: knees-up, less road   // r12: frameTwo(Amos 28 %, taxman 72 %), heads ~18 %, the EXCISE plaque between them   // r9: taxman right (front), EXCISE plaque between, Amos left by the door   // r7: the two heads 45% apart   // r6: Amos in front of the garden wall, the taxman inside it
  // r35: the crane wide holds to 1774, then glides down to the two of them (lands 1792 on "built"): Amos strolls in big, not a speck in the corner
  const sEnd = F(() => END, 1790, 0.0012, [[1825, 0.003, 6]]);   /* r53: a gentler push on "Amos's" */
  // r42: the insert on "entirely of" (1800-1824): his new 3-inch rule stood against the top loaf of his own garden wall - the
  // loaf ~57 % of the frame width, the rule reaching only three fifths of the way up it, both above the caption band
  const INS: CamT = { pos: [-14.40, 0.42, -2.72], look: [-14.79, 0.31, -3.815], fov: 47, roll: 0 };   /* r76i (both reviewers): one whole loaf beside the rule, both above the caption line (the frame split two loaves) */   /* r76i (reviewer): turned ~28 deg so the wall recedes, less ground */   /* r76i: the whole rule in frame */   /* r76i (both reviewers): pulled back - the whole loaf ~60 % wide with the loaf-tall rule (it filled 74 %, cut on every side) */   /* r76b: in a little - the loaf ~80 %, the broader rule ~40 % */   /* r76: wider - the whole loaf about 60 % with the rule, its neighbours soft (it filled 83 %) */   /* r62: closer and wider (the kerb near the lens was a grey slab in the corner) */   /* r60: further down (the strip was the house's stone sill behind the wall) */   /* r55: back out (at 33 the loaf filled 86 %) */   /* r54: tight on the loaf and the rule (they were a 28 % band) */   /* r49: a touch back up (the setts poked in at the bottom); r48: tilted down (a blank pale band ran across the top) */   // r46: the whole loaf (68 %) with the gauge block over its left half (31 %)   // r44: the whole loaf (~63 % wide) with the rule standing against its left end (cut by the edge it failed the insert rule)   // r43: in close: the rule ~27 % of the frame height and ~18 % wide, the loaf towering from 8 % to 50 % (at 57 % wide the rule was a sliver)
  const sIns = F(() => INS, 1800, 0.0009);
  /* r76i (both reviewers: "on 'built entirely of Amos's loaves' we need to see the whole house"): the whole house of loaves
   *  from the far pavement - roof ridge to garden wall, the pair small at the door - in place of the rule insert */
  const HOUSE: CamT = { pos: [-11.8, 1.1, 2.2], look: [-16.8, 4.0, -4.9], fov: 62, roll: 0 };   /* low, looking up: Amos above the caption band, less sky */   /* nearer and lower: the house fills the frame down to the caption band */
  const sHouse = F(() => HOUSE, 1800, 0.0012); void sIns;
  const WIDE: CamT = { pos: [-14.25, 1.0, -0.6], look: [-15.95, 1.3, -3.62], fov: 58, roll: 0 };   /* r76i (both reviewers): from the right - the TAX MAN plate on the door shows between the two heads (behind the taxman it read X MAN) */   /* r76d: from further down the lane - the front rakes away behind them (square-on it was a backdrop) */   /* r76b: higher and narrower, the pair nearer the frame centre (fov 74 at the cobbles stretched their legs into stilts) */   /* r76: panned left (Amos was jammed against the left edge, his arm cut) */   /* r70: a lens near the cobbles three metres off - heads about a sixth of the frame width at 40 %, the caption below their chests, the house of loaves towering behind (r69: the pair still read small over a band of road) */ /* r69: LOW 3/4 from the lane - the pair about a fifth of the frame at his wall, the house of loaves towering over them, the cottage beyond (r68b raised 3/4: the pair tiny over a blurred empty road) */ /* r68b: a raised 3/4 from the east end of the lane - the house of loaves fills the frame with the ordinary-brick cottage beyond it, the pair about 15 % tall at the wall (r68 high wide: 30 % bare road, the pair tiny) */   /* r67: HIGH and wide - the whole front, roof to pavement, the pair small below the caption band */   /* r66: the payoff pulls back low and wide - the whole house of loaves over the pair (reviewers: it was never shown whole) */
  const sWide = F(() => WIDE, 1838, -0.0008);
  return [K(1709, s0, 1, true), K(1772, glideTo(s0, 1772, sEnd, 1790, 0.12), 1), K(1800, sHouse, 1, true), K(1824, sEnd, 1, true), K(1826, glideTo(sEnd, 1826, sWide, 1838, 0.05), 1)];   // calm crane 1709-1774
};
SUN_REF[9] = 1713;   // r12: the sun is fixed from the opening camera (light ~170 deg world, raking the house front from the west)
SHOT_ACTS[9] = (f, s) => {
  const P_ST: V3 = [-14.55, 0, -3.06];   /* r76e: clear of the downpipe in the down-lane view */   /* r61: off the kerb onto the road (one foot read on the 8 cm kerb, the other lost behind it) */   /* r57: a step toward the door (his elbow met the right edge) */   /* r55: he stops beside his own door (clear of the PERCIVAL plaque) and shows the house off, 1752-1774 */
  const walking = f < 1786, standing = f >= 1752 && f < 1774;
  const tp: V3 = f < 1752 ? lerp3(L_TAX0, P_ST, lin(f, 1718, 1752)) : f < 1774 ? P_ST : f < 1786 ? lerp3(P_ST, L_TAX1, lin(f, 1774, 1786)) : L_TAX1;
  const fH = toward(9, s, f, L_TAX1, [-18.2, 0, -4.9]), fA = toward(9, s, f, L_TAX1, L_AMOS); const fAm0 = toward(9, s, f, L_AMOS, L_TAX1), fAm = Math.sign(fAm0 || 1) * Math.max(0.7, Math.abs(fAm0));   /* r76i: the pair turned 3/4 to each other */
  const tax = walking ? (standing ? pose(null, { expr: "proud", facing: 0.6, armR: [[26, 2], [48, 2]] as A2, armRFront: true, armL: [[-20, 8], [-28, 14]] as A2, armLFront: true, propL: "ledger", propK: 1, propsOver: true, tilt: -3, headBack: 0.15 })   /* r76i (reviewer): his excise ledger under the other arm - the tax man's own house */   /* r76f: turned to his house, presenting it (he pointed at empty air away from it) */   /* r76c: an open hand presenting his house (the raised arm repeated the same pose four times) */ : pose(null, { expr: "proud", facing: -1, mode: "walk", phase: (f - 1709) / 12 }))   /* r55: (the back view read as a grille face) */   /* r54: seen from behind, heading up to his own door (frontal he read as walking away from it) */   /* r47: full profile, mid-stride on the review beat (he still read as standing) */   /* r46: in profile toward his house (frontal he read as standing still) */
    : flow(f, [
      // r37: the rule goes down against his garden wall of loaves at his side (held up by his ear it never measured anything)
      // r38: the rule laid flat along the top of his garden wall of loaves (upright by his ear it measured nothing)
      // r40: the rule goes up against the loaf Amos holds out (at his belly it measured nothing): the loaf is twice the rule
      // r41: the 3-inch rule stands on the top loaf of his own garden wall, in his right hand: the loaf is twice the rule (in the
      // air by Amos's loaf it was longer than the loaf and read backwards)
      // r42: he bends and stands the rule against his own wall loaf (1790-1799); the insert shows it there (1800-1824); back on
      // the two-shot he has snatched it up again and stares at it
      [1786, { expr: "tacheUp", facing: fH, armR: [[24, 18], [32, 42]] as A2, armRFront: true, propR: "stick", armL: AR.hipL }],
      [1792, { expr: "tache", facing: fH, armR: [[24, 22], [36, 50]] as A2, armRFront: true, propR: f < 1799 ? "stick" : undefined, armL: AR.hipL, tilt: 10, headTilt: 10, mode: "brace", braceK: 0.6 }, 6],   // stands the rule on his own loaf
      [1820, { expr: "stare", facing: fH, armR: [[24, 10], [38, 22]] as A2, armRFront: true, propR: "stick", armL: AR.hipL, tilt: 4, headTilt: 6 }, 2],
      [1825, { expr: "aghast", facing: fA, armR: [[26, -20], [32, -46]] as A2, armRFront: true, propR: undefined,   /* r47: the rule flies out of his hand on the BOOM (held, it ended up a sliver by the frame edge) */ armL: [[-14, 20], [-16, 44]] as A2, sweat: 1, hatLift: 0.2, headBack: 0.2 }, 3],   // SHOCK 4
      [1829, { expr: "aghast", facing: Math.sign(fA || -1) * Math.max(0.7, Math.abs(fA)), armR: [[22, 16], [18, 36]] as A2, armRFront: true, propR: undefined, armL: [[-14, -2], [-4, -28]] as A2, armLFront: true, tilt: 8,   /* r76i (both reviewers): turned 3/4 to Amos, one hand up in shock, the other at his hip - both arms read */   /* r76h: arms hanging straight at his sides (one crossed his brass door plate) */   /* r76f: slumped, arms hanging (the raised arm read as a cheerful wave on "Too late") */   /* r76b: hand on his hip (the raised hand hid behind his head, a stub) */   /* r74: the near hand up by his own head, clear of Amos; r73: both hands thrown up (the pointing hand floated by Amos's hip) */   /* r55: the pointing hand stops short of the loaf (it ended inside it) */   /* r50: the far hand up by his face in shock (hanging it ran off the right edge) */   /* r48: he points at the loaf (his arm pointed off-frame at nothing) */ sweat: 1, hatLift: 0 }, 6],   /* r38: his near arm hangs (on the hip it crossed the loaf) */
    ]) as P;   /* r47: at 1834 the rule comes in against his coat (held out it was a sliver at the right edge) */
  // r21: Amos holds up one normal brick beside the taxman's wall of loaves (the size reads at a glance), then tips his hat
  // r26c: Amos strolls over from the cottage (1760-1806) instead of standing tiny in the corner of the crane wide
  const A_FROM: V3 = [-17.0, 0, -3.0], aPos: V3 = f < 1772 ? A_FROM : lerp3(A_FROM, L_AMOS, sm(f, 1772, 1794));   // r37: he walks in from the left edge of the two-shot (in the reveal wide he was a speck under the caption)
  // r26i: the payoff loaf is held UP beside his face on the side away from the taxman (it hid behind his coat), lit and clear
  // r36: the loaf rides in his RIGHT hand, held out toward the taxman against the brick wall (on the left it ran off the
  // frame edge, across the chest it vanished into his apron); the left hand tips the hat
  const HOLD: A2 = [[22, 2], [32, -6]] as A2, SHOW: A2 = [[22, -12], [30, -30]] as A2;   /* r50: the payoff loaf up against the sunlit wall (at chest height it sat on the dark door) */   // r38c: held up overhead, above the gap between the two hats (at the shoulder it touched the taxman's face)   // r38: shoulder height in the gap, the lit brick wall behind it (low, it sat on the dark door)   // r37: low and close, in the gap between them (raised, it went behind the taxman's head)
  const amosF = flow(f, [[1709, { expr: "calm", facing: toward(9, s, f, L_AMOS, tp), armR: AR.hipR, armL: AR.hipL }],
    [1794, { expr: "smile", facing: toward(9, s, f, L_AMOS, L_TAX1), armR: HOLD,   /* r39: from the end of his walk (at 1800 the loaf blinked out for six frames) */ armRFront: true, propR: "loaf", armL: AR.hipL }, 1],
    [1806, { expr: "smile", facing: toward(9, s, f, L_AMOS, L_TAX1), armR: AR.hipR, armL: AR.hipL }, 8],   /* r57: (during the insert) the loaf is on the wall now */
    [1826, { expr: "beam", facing: fAm, armL: AR.hipL, armR: [[18, 16], [6, 26]] as A2, armRFront: true, headTilt: 6, headBack: 0.4, tilt: -5 }, 6],   /* r76g: his near hand on his belly (it met the taxman's hand on a railing spike) */   /* r76c: both fists on his hips, leaning back smug (his raised arm mirrored the taxman's) */   /* r74: his near arm points straight up at the house (the far arm ran off the left edge) */   /* r73: pointing straight up at the house (out to the side it reached the frame edge) */   /* r70: his free hand points up at the house (the hip ring crossed the railing spikes) */   /* r57: hands on hips, the loaf put down (held, it read half the size of his wall and floated; the raised hand met the left edge) */   /* r51: the loaf comes down to his chest, clear of the taxman's face (raised it sat behind his head in the closer shot) */   // tips his hat
    [1846, { expr: "smile", facing: fAm, armL: AR.hipL, armR: [[18, 16], [6, 26]] as A2, armRFront: true, headTilt: 6, headBack: 0.4, tilt: -4 }, 8]]) as P;
  const amos = f >= 1772 && f < 1794 ? pose(null, { expr: "calm", facing: toward(9, s, f, A_FROM, L_AMOS), mode: "walk", phase: (f - 1772) / 12, armR: HOLD, armRFront: true, propR: "loaf", armL: AR.hipL }) : amosF;
  return { ctl: { stick: 0, pile: 0,   /* r70: no lane pallet (its corner was a stray brown block at the edge of f_1766) */ rule: 0,   /* r76i: no rule insert any more (the whole-house wide takes 1800-1824) */ ruleTilt: 0.14 * (1 - sm(f, 1799, 1808)), lamps: 0, cartX: -40, cartZ: -3.3, cartRot: 0.3, spring: 0, wallH: 1, tea: 0 },   /* r68b: Amos's cart of loaves parked in the lane foreground of the closing wide (the near road was a bare blurred band) */
    cast: [...(f >= 1717 && !(f >= 1800 && f < 1824) ? [C("tax", tp, tax as FigOpts, { idx: 3 })] : []),   /* r42: off the insert (his hand poked in at its top-left) */ ...(f >= 1772 ? [C("amos", aPos, amos as FigOpts, { idx: 1 })] : []),
      C("bv5", lerp3([-26.5, 0, -0.9], [-19.0, 0, -0.15], lin(f, 1709, 1860)),   /* r68: keeps strolling through the reveal wide (she stopped at 1810 and walked on the spot) */ pose(null, { expr: "smile", facing: 1, mode: "walk", phase: (f - 1709) / 14 }), { idx: 71 })],   // r10: a villager strolling far down the lane
    fx: fxs(f >= 1825 && f < 1836 ? clang("boom", [L_TAX1[0] - 0.4, 1.95, L_TAX1[2] + 0.05], f - 1825, 0.42) : null),
    // r18: focus on the walking taxman in the opening (the wall was sharper than him), the house in the crane wide, then him again
    focus: f < 1778 ? head(tp) : f >= 1800 && f < 1824 ? [-14.7, 0.5, -3.81] : f >= 1832 ? [-15.6, 1.9, -3.6] : head(L_TAX1), subj:   /* r67: the reveal focuses on the house front */ f < 1778 ? "tax" : f >= 1800 && f < 1824 ? null : "tax" };
};
KICKS.push([1825 / 30, 0.35]);
KEY_PUNCH.push(1838);
lens3([[1709, 13, 1], [1734, 5, 16], [1778, 13, 14], [1800, 3.5, 1], [1824, 13, 1], [1828, 3.5, 8]]);   /* r69: the closing wide nearly sharp (at 13 it read as a tilt-shift miniature with a blurred road band) */   // r42: the rule insert sharp on the loaf, the house behind soft   // r40: the A wall soft behind the two-shot   // r35: the wall soft behind the walking taxman (it was as sharp as his face)   // r26i: the busy A wall soft behind the actors   // r26f: the A wall behind the payoff stays readable   // r26: some depth in the crane wide (it was sharp everywhere)   // r12: the crane wide keeps the low sun crisp   // r8: the wide stays sharp to the near ground

// r42: held fired bricks and loaves a shade darker in the bright day scenes, where the card lift pushed them to orange
// (measured 234,98,56 held against 138,64,59 on the bench in the hook)
const PROP_DIM_BY_SCENE: Record<number, number> = { 1: 0.12, 4: 0.0 };   /* r53: the held loaves read near-black (the cards now lose 20% in daylight and the faces lost their mauve tint) */
for (const [k, d] of Object.entries(PROP_DIM_BY_SCENE)) { const id = +k, fn = SHOT_ACTS[id]; if (!fn) continue; SHOT_ACTS[id] = (f, s) => { const r = fn(f, s); return { ...r, cast: (r.cast ?? []).map((c) => ({ ...c, o: { ...c.o, propDim: d } })) }; }; }

// =====================================================================================================================
// LIFE LAYER (user rule 2026-11-06, "make sure all of the objects/characters are in motion"; boards X and AD). On top of
// the scripted acting, every character on screen does a small purposeful move at irregular 0.7-1.3 s intervals: a glance
// (eyes + a 2 deg head turn), a 3-5 deg head tilt, a 1.5-2.5 deg weight shift, or a settle back to neutral. Each move is
// eased over 10 frames (smootherstep) and then held: no loops, no bobbing, no sway. A micro-move is skipped when the
// character is busy with a scripted change around it (gesture, expression, facing, prop, walk), so scripted acting reads
// clean. Seeded per character (who#idx): two people never twitch in sync, and every render is identical.
const LIFE_SKIP = /^(dog|pigeon|cat)/;
const lifeHash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const lifeRng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
type LifeOff = { look: number; headTilt: number; tilt: number };
const LIFE0: LifeOff = { look: 0, headTilt: 0, tilt: 0 };
/** the micro-move schedule of one character: beat times (frames) and their target offsets */
const lifeSched = new Map<string, { t: number[]; o: LifeOff[] }>();
const schedFor = (key: string) => {
  let sc = lifeSched.get(key);
  if (sc) return sc;
  const r = lifeRng(lifeHash(key)), t: number[] = [], o: LifeOff[] = [];
  let x = Math.floor(r() * 24), last = 0;
  for (let n = 0; x < 2100; n++) {
    t.push(x);
    // a "settle" every other move keeps the character near the scripted pose; the moves in between vary
    const kind = n % 2 === 1 ? 3 : Math.floor(r() * 3) === last ? (last + 1) % 3 : Math.floor(r() * 3);
    last = kind;
    const sg = r() < 0.5 ? -1 : 1;
    o.push(kind === 0 ? { look: 0.65 * sg, headTilt: 3.5 * sg, tilt: 0.8 * sg }          // glance (r7: bigger, the kit read the cast as too still)
      : kind === 1 ? { look: 0, headTilt: (5 + 3 * r()) * sg, tilt: 0.8 * sg }           // head tilt
      : kind === 2 ? { look: 0.15 * sg, headTilt: 1.5 * sg, tilt: (2.6 + 1.4 * r()) * sg }    // weight shift
      : { look: 0, headTilt: 0, tilt: 0 });                                      // settle
    x += 16 + Math.floor(r() * 14);                                              // r7: 0.5-1.0 s apart
  }
  sc = { t, o }; lifeSched.set(key, sc); return sc;
};
const ACT_MEMO = new Map<string, Act>();
const LIFE_RAW: Record<number, (f: number, s: SetDef) => Act> = {};
const rawAct = (id: number, f: number, s: SetDef): Act => {
  const k = id + ":" + f; let a = ACT_MEMO.get(k);
  if (!a) { a = LIFE_RAW[id](f, s); ACT_MEMO.set(k, a); if (ACT_MEMO.size > 4000) ACT_MEMO.clear(); }
  return a;
};
const castKey = (c: CastPlace) => c.who + "#" + (c.idx ?? 0);
/** is this character in the middle of a scripted change (or walking / absent) around frame t? */
const lifeBusy = (id: number, s: SetDef, key: string, t: number) => {
  const A = rawAct(id, t - 6, s).cast.find((c) => castKey(c) === key), B = rawAct(id, t + 12, s).cast.find((c) => castKey(c) === key);
  if (!A || !B) return true;
  const a = (A.o ?? {}) as FigOpts & Record<string, unknown>, b = (B.o ?? {}) as FigOpts & Record<string, unknown>;
  if (a.mode === "walk" || b.mode === "walk" || a.mode === "run" || b.mode === "run") return true;
  if (a.expr !== b.expr || (a.facing ?? 1) !== (b.facing ?? 1) || a.propR !== b.propR || a.mode !== b.mode) return true;
  if (JSON.stringify(a.armR ?? null) !== JSON.stringify(b.armR ?? null) || JSON.stringify(a.armL ?? null) !== JSON.stringify(b.armL ?? null)) return true;
  if (Math.abs((a.tilt ?? 0) - (b.tilt ?? 0)) > 1.2 || Math.abs((a.headTilt ?? 0) - (b.headTilt ?? 0)) > 1.5 || Math.abs((a.look ?? 0) - (b.look ?? 0)) > 0.15) return true;
  if (Math.hypot(A.pos[0] - B.pos[0], A.pos[2] - B.pos[2]) > 0.05) return true;
  return false;
};
const lifeAt = (id: number, s: SetDef, key: string, f: number): LifeOff => {
  const sc = schedFor(key);
  let n = -1; for (let i = 0; i < sc.t.length && sc.t[i] <= f; i++) n = i;
  // the last two micro-moves that were not skipped
  const eff: number[] = [];
  for (let i = n; i >= 0 && eff.length < 2 && f - sc.t[i] < 240; i--) if (!lifeBusy(id, s, key, sc.t[i])) eff.push(i);
  if (!eff.length) return LIFE0;
  const cur = sc.o[eff[0]], prev = eff.length > 1 ? sc.o[eff[1]] : LIFE0, k = glide((f - sc.t[eff[0]]) / 10);
  return { look: lerp(prev.look, cur.look, k), headTilt: lerp(prev.headTilt, cur.headTilt, k), tilt: lerp(prev.tilt, cur.tilt, k) };
};
for (const id of Object.keys(SHOT_ACTS).map(Number)) {
  LIFE_RAW[id] = SHOT_ACTS[id];
  SHOT_ACTS[id] = (f: number, s: SetDef): Act => {
    const a = rawAct(id, f, s);
    return { ...a, cast: a.cast.map((c) => {
      const o = (c.o ?? {}) as FigOpts;
      if (LIFE_SKIP.test(c.who) || o.mode === "walk" || o.mode === "run" || c.air) return c;
      const L = lifeAt(id, s, castKey(c), f);
      if (!L.look && !L.headTilt && !L.tilt) return c;
      return { ...c, o: { ...o, look: Math.max(-1, Math.min(1, (o.look ?? 0) + L.look)), headTilt: (o.headTilt ?? 0) + L.headTilt, tilt: (o.tilt ?? 0) + L.tilt } };
    }) };
  };
}

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
