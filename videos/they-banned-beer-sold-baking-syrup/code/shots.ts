// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "He Set the Ice Cream on Fire and It Didn't Melt" (2026-11-27),
// set-local coordinates, absolute frames. Master prompt v13: 10 scene ids in two places (the groves, the cellar);
// smooth acting (flow beats with 6-frame face transitions), lip-sync only on the three quoted lines (talk.json),
// a life layer on every character (97_life.ts), 3 hard cuts, calm stretches of 3-5 s.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF, KICKS, SUN_REF, STORY_SHOTS as SHOT_LIST, XFADE as XF, TEST_SCENE, CAR_TEST } from "./story";
import { CABIN, cabinGrips } from "./sets/cabincar";
import { CT, ctTrafficZ } from "./sets/cartest";
import POSES from "./poses.json";
import MOUTHF from "./mouths.json";
import { getInputProps } from "remotion";
/** thumbnail mode (inputProps.thumb): scene 1 is staged as the cover still */
const THUMB = !!(getInputProps() as { thumb?: boolean }).thumb;
import type { MouthK } from "./toon";
import { BS } from "./sets/bistro";
import { BR } from "./sets/beer";

// ---------------- helpers ----------------
type P = Partial<FigOpts>;
type CamT = { pos: V3; look: V3; fov: number; roll: number };
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
// v34.1 (Nov 27): armTo aims from the rig's REAL shoulder. armTo itself does not know who the arm belongs to, so it tags its
// result with the target (card canvas px) and C() re-aims every tagged arm from shoulderOf(the character, its final pose)
// and rewrites the reach log, so previz_guard G10 measures the hand the renderer really draws. (armTo's old fixed guess put
// standing hands 5-19 cm below their targets and seated hands at sitLeg 0.7 19-24 cm above them.)
type Aim = { X: number; Yt: number; side: 1 | -1; bend: number; sc: number; key: string; dep: number; maxL: number };
const aimOf = (a: unknown) => (a ? (a as { __aim?: Aim }).__aim : undefined);
const lerpOf = (a: unknown) => (a ? (a as { __lerp?: [A2, A2, number] }).__lerp : undefined);
export const AIM_STATS = { made: 0, fixed: 0 };
const lerpRaw = (a: A2, b: A2, k: number): A2 => [[a[0][0] + (b[0][0] - a[0][0]) * k, a[0][1] + (b[0][1] - a[0][1]) * k], [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k]];
const fixArm = (A: unknown, look: Look, o: FigOpts, gaps: Map<string, { gap: number; depth: number }>): A2 | undefined => {
  if (!A) return A as undefined;
  const L = lerpOf(A); if (L) return lerpRaw(fixArm(L[0], look, o, gaps)!, fixArm(L[1], look, o, gaps)!, L[2]);
  const m = aimOf(A); if (!m) return A as A2;
  AIM_STATS.fixed++;
  const S = shoulderOf(look, o), sh = m.side > 0 ? S.R : S.L;
  const hx = (m.X - sh[0]) / S.u, hy = (m.Yt - sh[1]) / S.u, Ln = Math.hypot(hx, hy), k = Ln > m.maxL ? m.maxL / Ln : 1;
  const gap = Math.max(0, Ln - m.maxL) * S.u * SU * m.sc, prev = gaps.get(m.key);
  gaps.set(m.key, { gap: Math.max(gap, prev ? prev.gap : 0), depth: prev && Math.abs(prev.depth) > Math.abs(m.dep) ? prev.depth : m.dep });
  const h: [number, number] = [hx * k, hy * k];
  return [[h[0] * 0.5 + m.side * m.bend, h[1] * 0.5 + m.bend], h];
};
const C = (who: string, pos: V3, o: FigOpts = {}, extra: Partial<CastPlace> = {}): CastPlace => {
  const look = CASTS_T[who] as Look | undefined;
  if (look && !(look as { species?: string }).species && (aimOf(o.armR) || lerpOf(o.armR) || aimOf(o.armL) || lerpOf(o.armL))) {
    const gaps = new Map<string, { gap: number; depth: number }>();
    o = { ...o, armR: fixArm(o.armR, look, o, gaps), armL: fixArm(o.armL, look, o, gaps) };
    for (const [key, g] of gaps) REACH_LOG.set(key, g);   // replaces the entry armTo wrote from the old guess
  }
  return { who, pos, o, ...extra };
};
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
const ORBIT = 0.0008, KEY_PUNCH: number[] = [], KEY_NUDGE: number[] = [];
/** creep multiplier: 1.7 since the skull previz (too static); pig video kit (BI2): camera moving on 83% of frames (Rick 54-72%) -> 1.0 */
const CREEP_K = 1.5;   // library video: filled by the shot files
const F = (g: (f: number) => { pos: V3; look: V3; fov: number }, f0: number, rate = 0.0018, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const c = g(f), r2 = Math.min(0.0035, rate * CREEP_K);   // Rick study 2026-11-16 (x2.6); skull previz kit 2026-11-20: 90% of frames "clearly moving" (Rick 54-72%) -> x1.7
  const auto: [number, number, number][] = KEY_PUNCH.filter((p) => p >= f0 && p <= f + 8 && !punches.some((q) => Math.abs(q[0] - p) < 6)).map((p) => [p - 4, 0.007, 7]);
  const k = creep(f, f0, r2, [...punches, ...auto]);
  const p0 = lerp3(c.look, c.pos, k), side = (Math.floor(f0 / 7) % 2 ? 1 : -1), a = side * 0.2 * Math.tanh(ORBIT * Math.max(0, f - f0) / 0.2);   // saturates at ~4 deg: long holds keep their framing
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
// 11-26 v2: camAt includes the continuity glide out of the previous shot (as cams.ts camFor does); without it, arms aimed with
// armTo during a shot's opening move were solved for the shot's own framing, not the camera actually rendering
const camAt = (id: number, s: SetDef, f: number) => {
  let keys = SHOT_CAMS[id](s);
  const me = SHOT_LIST.find((q) => q.id === id), prev = SHOT_LIST.find((q) => q.id === id - 1);
  if (me && prev && prev.set === me.set && !XF[id] && SHOT_CAMS[prev.id] && !keys[0].cut) {
    const end = run(SHOT_CAMS[prev.id](s), prev.b - 1);
    keys = [{ f: me.a, s: () => end }, { ...keys[0], f: me.a, dur: keys[0].dur ?? 24, cut: false }, ...keys.slice(1)];
  }
  return run(keys, f);
};
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
import { faceOf, strideM, sitLegFor, shoulderOf, headOf, seatHeight } from "./fig";
import type { Look } from "./fig";
import { CAST as CASTS_T } from "./casts";
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
/** v20/v21 (boards BA, BC3): deliberate moves overshoot a little and settle (no pose snaps): smootherstep plus a late
 *  bump that peaks ~3-5 % past the target near the end of the blend and returns to exactly 1 at its end */
const osE = (u: number, amp: number) => { const x = clamp01(u), w = clamp01((x - 0.6) / 0.4); return glide(x) + (x < 1 ? amp * Math.sin(Math.PI * w) ** 2 : 0); };
const OS_ARM = 0.12, OS_BODY = 0.07;
const mixO = (a: P, b: P, f: number, s = 0, bl = 1): P => {
  const uH = (f - (s - 2)) / Math.max(1, bl), uT = (f - s) / Math.max(1, bl), uA = (f - (s + 1)) / Math.max(1, bl + 3);
  const kH = gl(f, s - 2, bl), kT = gl(f, s, bl), kA = gl(f, s + 1, bl + 3);
  const big = bl >= 6;   // only real moves overshoot (snaps and face-only beats stay clean)
  const kAo = big ? osE(uA, OS_ARM) : kA, kTo = big ? osE(uT, OS_BODY) : kT, kHo = big ? osE(uH, OS_BODY) : kH;
  if (uA >= 1 && uH >= 1) return { ...b };
  const o: Record<string, unknown> = { ...b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a as Record<string, unknown>)[key], vb = (b as Record<string, unknown>)[key];
    const arm = key === "armR" || key === "armL";
    const osk = /^(tilt|headTilt|headBack|lean)$/.test(key);
    const k = arm ? kAo : osk ? (HEAD.test(key) ? kHo : kTo) : HEAD.test(key) ? kH : LIMB.test(key) ? kA : kT;
    const side = key === "armR" ? 1 : -1;
    const A = arm ? (va ?? HANG(side)) : va, B = arm ? (vb ?? HANG(side)) : vb;
    if (arm && Array.isArray(A) && Array.isArray(B)) o[key] = uA >= 1 ? B : k <= 0 ? A : arcArm(A as number[][], B as number[][], k);
    else if (typeof va === "number" && typeof vb === "number" && key !== "facing") o[key] = lerp(va, vb, k);
    else if (typeof va === "number" && vb === undefined && NUMS.test(key)) o[key] = lerp(va, 0, k);
    else if (va === undefined && typeof vb === "number" && NUMS.test(key)) o[key] = lerp(0, vb, k);
    else if (key === "expr" || key === "mouth") o[key] = vb;
    else if (key === "facing") o[key] = typeof va === "number" && typeof vb === "number" ? lerp(va, vb, kH) : kH < 0.5 ? va : vb; // v20: the turn is animated on the rig (no flip)
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
// 2026-11-20 (user: "the video itself should be visible and not really blurry"): Rick's frames are sharp front to back except a light
// softness behind close-ups and inserts; blur radii cut to about half (inserts 7, CU 5, MS 2.5, full 1.5, wide 0 = off)
const DOF_INSERT = 7, DOF_CU = 5, DOF_MS = 2.5, DOF_FS = 1.5, DOF_WS = 0;
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
const lip = (f: number) => TJ.talk[String(Math.round(f))] as MouthK | undefined;
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
// "He Set the Ice Cream on Fire and It Didn't Melt" (2026-11-27), master prompt v33. One connected set (bistro): the
// restaurant (kitchen + dining room), the snowy street out front and the cutaway inside the dessert.
// Hard cuts: 60 (the flash-forward), 139 (back to the story, outside), 960 (kitchen -> the critic's table), 1517 (the
// comparison outside). Everything else is one camera move: through the window (268), the swing door (365), into the
// meringue (1271, a matched white switch), back in through the window (1615).
// The story state (dessert, peel, bucket, door, smoke, flames, chalk) is ONE function of the frame (CTL), so nothing
// jumps at a shot change (11r). Staging: the oven mouth faces +z; the kid works the peel from its east side; the chef
// watches from the west (CH_W); the dishwasher parks by the bench (DISH_SPOT). In the dining room the critic sits on the
// west side of T1 facing east, the kid serves from the east side (KID_T), the framed TOO WET review hangs behind them.
type Cam = { pos: V3; look: V3; fov: number; roll: number };
const cam3 = (pos: V3, look: V3, fov: number): Cam => ({ pos, look, fov, roll: 0 });
const KID = "bsKid", CHEF = "bsChefS", CRIT = "bsCritic", WAIT = "bsWaiter", DISH = "bsDish", COOK1 = "bsCook1", COOK2 = "bsCook2";
const PASS1 = "bsDiner3", DIN1 = "bsDiner1", DIN2 = "bsDiner2", DIN4 = "bsDiner4";
const glideF = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const eIn = (x: number) => clamp01(x) ** 2, eOut = (x: number) => 1 - (1 - clamp01(x)) ** 2;
const crPt = (pts: V3[], u: number): V3 => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]) || 1e-6), T = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * T, i = 0; while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
  const t = Math.min(1, d / L[i]), p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  return [0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)) as V3;
};
/** a walk through waypoints (Catmull-Rom, chord-timed), eased with smootherstep between frames a and b */
const pathAt = (pts: V3[], f: number, a: number, b: number) => crPt(pts, glideF((f - a) / (b - a)));
/** the walking direction (unit, xz) along such a path */
const pathDir = (pts: V3[], f: number, a: number, b: number): V3 => {
  const g = Math.min(b - 0.5, Math.max(a + 0.5, f)), p = pathAt(pts, g + 0.5, a, b), q = pathAt(pts, g - 0.5, a, b);
  let dx = p[0] - q[0], dz = p[2] - q[2], n = Math.hypot(dx, dz);
  if (n < 1e-5) { const m = pts.length; dx = pts[m - 1][0] - pts[m - 2][0]; dz = pts[m - 1][2] - pts[m - 2][2]; n = Math.hypot(dx, dz) || 1; }
  return [dx / n, 0, dz / n];
};
const crMoveG = (from: (f: number) => Shot, a: number, to: (f: number) => Shot, b: number, W: V3[], Lk: V3[]) => (f: number): Shot => {
  const s0 = from(a), e = to(f), u = glideF((f - a) / (b - a));
  return { pos: crPt([s0.pos, ...W, e.pos], u), look: crPt([s0.look, ...Lk, e.look], u), fov: lerp(s0.fov ?? 40, e.fov ?? 40, u), roll: 0 };
};
/** straight moves that carry on through glass or a doorway at full speed: eased in to the crossing, eased out after it */
const moveIn = (from: (f: number) => Shot, a: number, to: Shot, b: number) => (f: number): Shot => {
  const s0 = from(a), u = eIn((f - a) / (b - a));
  return { pos: lerp3(s0.pos, to.pos, u), look: lerp3(s0.look, to.look, u), fov: lerp(s0.fov ?? 40, to.fov ?? 40, u), roll: 0 };
};
const moveOut = (from: Shot, a: number, to: (f: number) => Shot, b: number) => (f: number): Shot => {
  const e = to(f), u = eOut((f - a) / (b - a));
  return { pos: lerp3(from.pos, e.pos, u), look: lerp3(from.look, e.look, u), fov: lerp(from.fov ?? 40, e.fov ?? 40, u), roll: 0 };
};
const still = (s: Shot) => () => s;
const lerpA2 = (a: A2, b: A2, k: number): A2 => {
  const r: A2 = [[lerp(a[0][0], b[0][0], k), lerp(a[0][1], b[0][1], k)], [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)]];
  if (aimOf(a) || aimOf(b) || lerpOf(a) || lerpOf(b)) (r as unknown as { __lerp: [A2, A2, number] }).__lerp = [a, b, k];   // C() re-aims the armTo end
  return r;
};
const SHOULDER_DY: Record<string, number> = { sit: 205, kneel: 150 };
/** v34 HOLD CHECK: every armTo call that cannot reach its target (the arm is 62 rig units long) or whose target sits far in
 *  front of or behind the card's plane (the hand only touches it from one exact viewpoint) is logged here per frame and card
 *  position; the scene dump writes it per cast member as pose.reach and previz_guard G10 fails it while on screen
 *  (a held prop floating beside the hand, a hand stopping short of a door handle) */
export const REACH_LOG = new Map<string, { gap: number; depth: number }>();
const armTo = (id: number, s: SetDef, f: number, P: V3, T: V3, side: 1 | -1, fs = 0, sc = 1, mode = "stand", bend = 10, maxL = 62): A2 => {   // maxL (u): 62 = a comfortable reach; up to ~80 for a hand RESTING on a seat edge, armrest or knee (the arm is 88 u long)
  const c = camAt(id, s, f), yaw = Math.atan2(c.pos[0] - P[0], c.pos[2] - P[2]);
  const lat = (T[0] - P[0]) * Math.cos(yaw) - (T[2] - P[2]) * Math.sin(yaw);
  const dep = (T[0] - P[0]) * Math.sin(yaw) + (T[2] - P[2]) * Math.cos(yaw);   // + toward the camera
  const X = 300 + lat / (SU * sc), Y = 975 - (T[1] - P[1]) / (SU * sc) - (SHOULDER_DY[mode] ?? 0);
  const hx = (X - 300 - 3 * 2.36 * fs - side * 75) / 2.36, hy = (Y - 447) / 2.36;
  const L = Math.hypot(hx, hy), k = L > maxL ? maxL / L : 1;
  { const key = f + "|" + P.map((v) => v.toFixed(2)).join(","), gap = Math.max(0, L - maxL) * 2.36 * SU * sc, prev = REACH_LOG.get(key);
    const pd = prev ? prev.depth : 0;
    REACH_LOG.set(key, { gap: Math.max(gap, prev ? prev.gap : 0), depth: Math.abs(dep) >= Math.abs(pd) ? dep : pd });
    if (REACH_LOG.size > 20000) REACH_LOG.clear(); }
  const h: [number, number] = [hx * k, hy * k];
  const out: A2 = [[h[0] * 0.5 + side * bend, h[1] * 0.5 + bend], h];
  AIM_STATS.made++;
  (out as unknown as { __aim: Aim }).__aim = { X, Yt: Y + (SHOULDER_DY[mode] ?? 0), side, bend, sc, key: f + "|" + P.map((v) => v.toFixed(2)).join(","), dep, maxL };
  return out;
};
/** the facing toward a world point (cards turn 3/4 toward what they deal with) */
const faceAt = (id: number, s: SetDef, f: number, P: V3, T: V3) => screenSide(id, s, f, T[0] - P[0], T[2] - P[2]);
const plus3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

// ================================================= p14: "They Banned Beer, So He Sold It as Bread Syrup" (2026-11-27, v34) =================================================
// One set (beer) with four places: the brewery (S1-S7), Main Street by day (S8-S9, S16) and by night (S17-S22, S30), the
// grocery (S10-S15, S26, S29) and the cellars under the houses (granny: S23-S25, S27-S28; the agent's: S31).
// Hard cuts: 438 (S7, "It's for baking."), 824 (S14, the agent's squint), 1209 (S20, the first cellar pops). Dissolves
// (6 f) at every new place or time (story.ts XFADE). Everything else is one camera move out of the shot before.
// The story state (cans, barrel, wall, board, yeast tower, loaf, pops, crock, caps, doors) is ONE function of the frame
// (CTLB), so nothing jumps at a shot change.
const BRW = "brewer", AGT = "agent", AGS = "agents", AGB = "agentB", GRO = "grocer", GRA = "granny", WIF = "wife", TFK = "townsfolk", TMN = "townsman", KDC = "kid";
const HYC: Record<string, number> = {};
const HY = (who: string) => (HYC[who] ??= headOf(CASTS_T[who] as Look, {}).y);
const HD = (who: string, p: V3): V3 => [p[0], p[1] + HY(who), p[2]];
const LZ = 9.0, TT = 0.92;                                  // the canning line (z) and its table top
const B0: V3 = [0.05, 0, 9.25], B2: V3 = [1.2, 0, 9.25];    // the brewer at the spout / under the wall sign at the pyramid (card plane 0.25 m behind the cans)
const AST: V3 = [0.3, 0, 8.55];                            // the agent's mark across the line from the brewer (5 cm in front of the table edge)
/** metres per stride phase unit (planted feet: previz_guard G3d) */
const SMC: Record<string, number> = {};
const SM = (who: string) => (SMC[who] ??= strideM(CASTS_T[who] as Look, { mode: "stride" } as FigOpts));
/** a planted-feet walk along waypoints between frames a and b (eased); back = walking backwards */
const walkS = (id: number, s: SetDef, who: string, pts: V3[], f: number, a: number, b: number, back = false) => {
  const u = sm(f, a, b), w = polyAt(pts, u), dist = u * polyLen(pts), moving = f > a && f <= b;   // the end frame still strides (its last step lands there)
  const fc = (Math.sign(screenSide(id, s, f, w.d[0], w.d[1])) || 1) * (back ? -1 : 1);
  return { p: w.p, facing: fc, moving, o: (moving ? { mode: "stride", phase: (back ? -1 : 1) * dist / SM(who) } : {}) as P };
};
const POUR_PH = (f: number) => ((f % 28) + 28) % 28;        // the brewer's canning loop (28 f): slap 0-6, slide 8-20
/** a fitted camera: the boxes (body(p, y0, y1, half width)) inside the frame from compass az (0 = from +z, 90 = from +x), el deg looking down */
const FIT = (boxes: Box[], az: number, el: number, fov: number, pad = 0.85, side = 0, lift = 0, room?: Room): Cam => { let c = fit(boxes, az, el, fov, pad, side, lift); if (room) c = inRoom(c, room); return cam3(c.pos, c.look, c.fov); };
/** rooms the fitted cameras stay inside (they backed out through the shop front: the front wall and the bread rack in front of the lens) */
const ROOM_BREW: Room = { x0: -5.5, x1: 5.5, z0: 0.45, z1: 11.6, y1: 5.2 }, ROOM_GROC: Room = { x0: 96.3, x1: 103.7, z0: 0.6, z1: 6.4, y1: 3.2 };
const SPOUT: V3 = [-1.05, 0, 9.0];

const CTLB = (f: number): Ctl => {
  const c: Record<string, number> = {};
  c.line = 1; c.pour = 1;
  c.pyrN = f < 128 ? 2 : 3;
  c.tip = sm(f, 166, 188); c.gush = sm(f, 178, 190) * (1 - 0.45 * sm(f, 300, 370));
  c.wallN = f < 588 ? 0 : f < 596 ? 1 : f < 604 ? 2 : f < 664 ? 3 : f < 701 ? 30 : 999;
  c.board = f < 626 ? 0 : f < 670 ? 3 : 30;
  c.yeast = f >= 824 ? 1 : 0;
  if (f >= 824) { const u = sm(f, 866, 896); c.yeastX = lerp(102.25, 101.7, u); c.yeastZ = lerp(-1.4, 1.95, u); c.yeastR = 0.35 + 0.15 * u; }
  c.pancakeOn = f >= 1529 && f < 1606 ? 1 : 0; c.pancake = f < 1560 ? 0.4 * sm(f, 1538, 1556) : 0.4 + 0.6 * sm(f, 1584, 1600);
  c.chalk = sm(f, 534, 562);
  c.loaf = f >= 913 ? Math.max(0.02, sm(f, 918, 968)) : 0;
  const pop = (t0: number) => (f >= t0 ? (f - t0) / 30 : -1);
  c.pop1 = pop(1213); c.pop2 = pop(1246); c.pop3 = pop(1268); c.pop4 = pop(1278); c.pop5 = pop(1288);
  c.glow1 = f >= 1180 && f < 1215 ? sm(f, 1180, 1196) : 0;
  c.door1 = f < 1020 ? 0 : sm(f, 1020, 1036);   // swings out onto the porch once the agent has stepped back (end of S17)
  c.cut1 = 1;
  c.crockFill = f < 1328 ? 0.08 : f < 1400 ? lerp(0.08, 0.5, sm(f, 1328, 1392)) : f < 1460 ? lerp(0.5, 0.82, sm(f, 1404, 1436)) : 0.85;
  c.crockFoam = f < 1460 ? 0 : 0.35 * sm(f, 1462, 1478) + 0.25 * bump((f - 1476) / 12) + 0.65 * sm(f, 1484, 1504);
  c.capAge = f >= 1700 && f < 1800 ? (f - 1700) / 30 : -1;
  c.wifeAge = f >= 1946 ? (f - 1946) / 30 : -1;
  c.bulk = sm(f, 1878, 1898);
  return c as Ctl;
};
/** a thick syrup ribbon (dark amber, slow wobble) from a can mouth (top) to the crock (bottom) */
const syrupStream = (key: string, top: V3, bot: V3, f: number, w = 0.06): FxSpec => ({
  kind: "card", key: "syr" + key + (Math.floor(f / 4) % 3), pos: [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2], w, h: Math.abs(top[1] - bot[1]), cw: 48, ch: 160,
  draw: (p) => { const g = p.g, ph2 = (Math.floor(f / 4) % 3) * 2.1; const path = () => { g.beginPath(); for (let y = 0; y <= 160; y += 8) g.lineTo(24 + 3 * Math.sin(y * 0.04 + ph2), y); };
    g.lineCap = "round"; g.strokeStyle = INKC; g.lineWidth = 19; path(); g.stroke(); g.strokeStyle = "#7a3e12"; g.lineWidth = 13; path(); g.stroke(); g.strokeStyle = "#c27a2e"; g.lineWidth = 3; g.beginPath(); for (let y = 8; y <= 150; y += 8) g.lineTo(21 + 2 * Math.sin(y * 0.05 + ph2), y); g.stroke(); },
});
/** a water stream (pale blue) */
const waterStream = (key: string, top: V3, bot: V3, f: number): FxSpec => ({
  kind: "card", key: "wat" + key + (f % 3), pos: [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2], w: 0.07, h: Math.max(0.05, Math.abs(top[1] - bot[1])), cw: 48, ch: 160,
  draw: (p) => { const g = p.g, ph2 = (f % 3) * 2.1; const path = () => { g.beginPath(); for (let y = 0; y <= 160; y += 8) g.lineTo(24 + 5 * Math.sin(y * 0.08 + ph2), y); };
    g.lineCap = "round"; g.strokeStyle = INKC; g.lineWidth = 15; path(); g.stroke(); g.strokeStyle = "#9fd4f2"; g.lineWidth = 9; path(); g.stroke(); g.strokeStyle = "#ffffff"; g.lineWidth = 2.5; g.beginPath(); for (let y = 8; y <= 150; y += 10) g.lineTo(21 + 3 * Math.sin(y * 0.08 + ph2), y); g.stroke(); },
});
/** rising bubbles over a crock mouth (k 0..1 how many) */
const bubbles = (key: string, at: V3, f: number, k: number, r = 0.13): FxSpec[] => {
  const out: FxSpec[] = []; const n = Math.round(7 * k);
  for (let i = 0; i < n; i++) {
    const per = 22 + (i % 3) * 5, age = ((f + i * 7) % per) / per, a = i * 2.4;
    out.push({ kind: "card", key: "bub" + key + (i % 3), pos: [at[0] + Math.cos(a) * r * (0.3 + 0.5 * rnd1(i)), at[1] + 0.02 + 0.22 * age, at[2] + Math.sin(a) * r * 0.4], w: 0.035 + 0.02 * (i % 2), h: 0.035 + 0.02 * (i % 2), cw: 48, ch: 48,
      draw: (p) => { const g = p.g; g.strokeStyle = INKC; g.lineWidth = 5; g.fillStyle = "rgba(255,236,190,0.85)"; g.beginPath(); g.arc(24, 24, 18, 0, 6.3); g.fill(); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(17, 17, 5, 0, 6.3); g.fill(); } });
  }
  return out;
};
/** the label of the syrup can, big: an illustration card beside the can (the drawn prop is too small to read) */
const labelCard = (pos: V3, f: number, a: number, b: number, w = 0.42) => popCard("canLabel", pos, w, w * 1.25, f, a, b, (g) => {
  g.fillStyle = INKC; g.fillRect(0, 0, 512, 640); g.fillStyle = "#efe0b8"; g.fillRect(14, 14, 484, 612);
  g.fillStyle = "#b3261e"; g.fillRect(14, 70, 484, 46); g.fillRect(14, 524, 484, 46);
  g.fillStyle = "#3a1e10"; g.textAlign = "center"; g.font = "900 54px Georgia"; g.fillText("HOLLOW CREEK", 256, 200);
  g.font = "900 78px Georgia"; g.fillStyle = "#7a3e12"; g.fillText("PURE MALT", 256, 320); g.fillText("EXTRACT", 256, 400);
  g.font = "800 44px Georgia"; g.fillStyle = "#3a1e10"; g.fillText("~ for baking ~", 256, 478);
}, 512, 640);
/** a bottle cap pinging off (grey disc with crimp ticks), age in frames */
const capFly = (key: string, from: V3, dir: [number, number], age: number, s = 0.07): FxSpec | null => {
  if (age < 0 || age > 22) return null;
  const t = age / 30;
  return { kind: "card", key: "cap" + key + (age % 2), pos: [from[0] + dir[0] * 1.6 * t, from[1] + 2.4 * t - 4.9 * t * t, from[2] + dir[1] * 1.6 * t], w: s, h: s, rot: age * 0.7, cw: 48, ch: 48,
    draw: (p) => { const g = p.g; g.fillStyle = "#c8ccd2"; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 16; i++) { const an = (i / 16) * 6.283, r = i % 2 ? 19 : 22; g.lineTo(24 + Math.cos(an) * r, 24 + Math.sin(an) * r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#b3261e"; g.beginPath(); g.arc(24, 24, 9, 0, 6.3); g.fill(); } };
};

// ================================================= S1 (0-78) HOOK: "They banned beer, so a brewer sold syrup for baking bread,"
// The brewer at the canning line, the kettle's syrup ribbon pouring into the next can at screen right; he slaps a FOR BAKING
// label on each can (the label appears as the can passes his hand) and slides it on down the line, deadpan. A slow push in.
const P1TH = -0.16, P1BACK = 0.5, P1SIDE = -0.25;   // S1 opening: pan (rad), pull back (m), truck (m)
const H1 = FIT([body(B0, 0.45, 1.8, 0.3), body(SPOUT, 0.95, 1.35, 0.08)], 192, 4, 48, 0.82, 0, 0, ROOM_BREW);
const panned = (sh: Shot, th: number, back: number, side: number): Shot => {   // the same shot turned th rad about the lens, moved back and sideways
  const dx = sh.look[0] - sh.pos[0], dz = sh.look[2] - sh.pos[2], L = Math.hypot(dx, dz), fx = dx / L, fz = dz / L;
  const p: V3 = [sh.pos[0] - fx * back - fz * side, sh.pos[1] + 0.06 * back, sh.pos[2] - fz * back + fx * side], c = Math.cos(th), si = Math.sin(th);
  return { pos: p, look: [p[0] + dx * c - dz * si, sh.look[1], p[2] + dx * si + dz * c], fov: sh.fov, roll: 0 };
};
const c1 = glideTo(() => panned(H1, P1TH, P1BACK, P1SIDE), -30, F(() => H1, 0, 0.0018), 78);   // v34 kit: Rick's camera is already travelling on frame 1 (~6 px/f)
SHOT_CAMS[1] = () => [K(0, c1, 1, true)];
const brewerCanning = (id: number, s: SetDef, f: number, P: V3, expr: Face = "bored", extra: P = {}): FigOpts => {
  const fc = faceAt(id, s, f, P, [P[0], 1.2, 6.0]), q = POUR_PH(f);
  const slap = q < 6 ? bump(q / 6) : 0, slide = q >= 8 && q < 20 ? sm(q, 8, 20) : q >= 20 ? 1 : 0;
  const T: V3 = [P[0] - 0.12 + 0.16 * slide, TT + 0.22 - 0.06 * slap, LZ];
  return { expr, facing: fc, tilt: 2 + 2 * slap, armR: armTo(id, s, f, P, T, 1, fc), armRFront: true, armL: AR.hipL, ...extra } as FigOpts;
};
SHOT_ACTS[1] = (f, s) => ({ cast: [C(BRW, B0, brewerCanning(1, s, f, B0, "bored"))], subj: BRW, focus: HD(BRW, B0), ctl: CTLB(f) });
lens(0, 2);

// ================================================= S2 (78-161) "...and the whole town started brewing. You see,": glide up to the wall
// sign (BEER struck out, BAKING SYRUP), then down onto the brewer who has walked to the line's end: he stacks a third can on
// the pyramid and taps it, deadpan.
const c2a = cam3([0.95, 1.6, 5.95], [0.95, 1.25, 11.9], 54), c3 = FIT([body([3.2, 0, 4.95], 0.4, 1.8, 0.3), body([2.25, 0, 4.95], 0.4, 1.8, 0.3), body([1.9, 0, 4.2], 0.4, 1.85, 0.3), body([2.7, 0, 3.35], 0, 0.9, 0.5), body(B0, 0.4, 1.75, 0.3)], 156, 18, 58, 0.88, 0, 0, ROOM_BREW), c4 = FIT([body(B0, 0.45, 1.8, 0.3), body(SPOUT, 0.95, 1.35, 0.08)], 140, 10, 46, 0.85, 0, 0, ROOM_BREW);
const c2F = F(() => c2a, 78, 0.0014), c3F = F(() => c3, 186, 0.0008), c4F = F(() => c4, 262, 0.0016);
const g23 = glideTo(c2F, 142, c3F, 204), g34 = glideTo(c3F, 208, c4F, 272);
SHOT_CAMS[2] = () => [K(78, c2F, 64), K(142, g23, 1)];

SHOT_ACTS[2] = (f, s) => {
  if (f < 84) return { cast: [C(BRW, B0, brewerCanning(2, s, f, B0, "bored")), ...agentsAt(2, s, f)], subj: BRW, focus: [0.9, 2.4, 11.9], ctl: CTLB(f) };
  const w = walkS(2, s, BRW, [B0, B2], f, 84, 110), P = w.p, fc = faceAt(2, s, f, P, [P[0], 1.2, 6.0]);
  const top: V3 = [0.895, TT + 0.25, 9.15], held = f < 128;
  const tap = f >= 138 ? bump((f - 138) / 6) + bump((f - 146) / 6) : 0;
  const armR = f < 112 ? AR.carryR : f < 128 ? armTo(2, s, f, P, lerp3([1.0, 1.25, 9.12], top, sm(f, 112, 126)), 1, fc) : armTo(2, s, f, P, [0.93, TT + 0.3 + 0.04 * (1 - tap), 9.13], 1, fc);
  const o = flow(f, [[84, { expr: "bored", facing: fc }], [130, { expr: "smug", facing: fc, tilt: 2 }, 8]]);
  return { cast: [C(BRW, P, { ...o, ...(w.moving ? { ...w.o, facing: w.facing } : {}), armR, armRFront: true, propR: held ? "syrupCan" : undefined, armL: AR.hipL } as FigOpts), ...agentsAt(2, s, f)], subj: BRW, focus: [0.9, 2.4, 11.9], ctl: CTLB(f) };
};
lens(78, 0);

// ================================================= S3 (161-226) "...the law says nobody can sell beer,": high and wide from the
// street door: two agents tip a beer barrel over the floor drain (foam gushes), the lead agent stands over them with his
// padlock and chain on his shoulder; at the back the brewer has gone back to filling cans.
SHOT_CAMS[3] = () => [K(161, g23, 1, true), K(208, g34, 1)];   // "cut" key = no re-glide: the crane is already running across the seam
/** the three agents at the barrel (S2 keeps them in the world behind the camera, S3 shows them tipping it) */
const agentsAt = (id: number, s: SetDef, f: number): CastPlace[] => {
  const push = sm(f, 164, 182), heave = Math.sin(f * 0.5) * (1 - push) * 1.5;
  const A1: V3 = [3.2, 0, 4.95], A2: V3 = [2.25, 0, 4.95], L: V3 = [1.9, 0, 4.2];
  const f1 = faceAt(id, s, f, A1, BR.BARREL), f2 = faceAt(id, s, f, A2, BR.BARREL), fl = faceAt(id, s, f, L, BR.BARREL);
  const pushArm = (P: V3, side: 1 | -1, fc: number) => { const dx = BR.BARREL[0] - P[0], dz = BR.BARREL[2] - P[2], n = Math.hypot(dx, dz) || 1; return armTo(id, s, f, P, [P[0] + (dx / n) * 0.28, 1.0 - 0.12 * push, P[2] + (dz / n) * 0.28], side, fc); };
  return [
    C(AGS, A1, { expr: f < 182 ? "strain" : "guffaw", facing: f1, tilt: -6 * (1 - push) + heave, armR: pushArm(A1, 1, f1), armL: pushArm(A1, -1, f1), armRFront: true, armLFront: true }),
    C(AGB, A2, { expr: f < 182 ? "strain" : "laugh", facing: f2, tilt: -6 * (1 - push) - heave, armR: pushArm(A2, 1, f2), armL: pushArm(A2, -1, f2), armRFront: true, armLFront: true }),
    C(AGT, L, { ...flow(f, [[78, { expr: "smug", facing: fl, tilt: -2 }], [190, { expr: "tacheUp", facing: fl, tilt: -3 }, 8]]), armR: [[22, -10], [8, -30]] as A2, propR: "padlock", armL: AR.hipL }),
  ];
};
const AGENT_PATH: V3[] = [[1.9, 0, 4.2], [1.25, 0, 6.5], AST];
const agentWalk = (id: number, s: SetDef, f: number) => {
  if (f < 262) return { p: AGENT_PATH[0], o: {} as P };
  const w = walkS(id, s, AGT, AGENT_PATH, f, 262, 330);
  return { p: w.p, o: (w.moving ? { ...w.o, facing: w.facing } : {}) as P };
};
SHOT_ACTS[3] = (f, s) => {
  const bw = walkS(3, s, BRW, [B2, B0], f, 200, 226), PB = bw.p;
  return { cast: [
    ...agentsAt(3, s, f),
    C(BRW, PB, bw.moving ? ({ expr: "bored", ...bw.o, facing: bw.facing, armR: AR.carryR, armRFront: true } as FigOpts) : brewerCanning(3, s, f, PB, "bored")),
  ], subj: AGT, focus: [2.5, 1.0, 4.6], ctl: CTLB(f) };
};
lens(161, 0);
KICKS.push([186 / 30, 0.05]);

// ================================================= S4 (226-273) "...but it says nothing about syrup.": glide past the barrels onto
// the brewer at the spout, calm; on "syrup" he presses a lid onto a can (a clack). The agent starts toward him behind.
SHOT_CAMS[4] = () => [K(226, g34, 1, true)];
SHOT_ACTS[4] = (f, s) => {
  const fc = faceAt(4, s, f, B0, [0.5, 1.2, 6.5]), cap = f >= 254 && f < 268 ? bump((f - 254) / 12) : 0;
  const o = f >= 250 && f < 270 ? { expr: "smug" as Face, facing: fc, armR: armTo(4, s, f, B0, [B0[0] - 0.05, TT + 0.26 - 0.1 * cap, LZ], 1, fc), armRFront: true, armL: armTo(4, s, f, B0, [B0[0] + 0.12, TT + 0.2, LZ], -1, fc), armLFront: true } : brewerCanning(4, s, f, B0, "bored");
  const ag = agentWalk(4, s, f);
  return { cast: [C(BRW, B0, o as FigOpts), ...agentsAt(4, s, f).filter((c) => c.who !== AGT), C(AGT, ag.p, { expr: "smug", facing: faceAt(4, s, f, ag.p, B0), ...ag.o, armR: [[22, -10], [8, -30]] as A2, propR: "padlock" })],
    subj: BRW, focus: HD(BRW, B0), ctl: CTLB(f), fx: fxs(clang("cap4", [B0[0] - 0.05, TT + 0.3, LZ - 0.05], f - 259, 0.22)) };
};
lens(226, 2, 20);

// ================================================= S5 (273-370) "When the agent comes to padlock the brewery, the brewer is canning it.":
// profile from the east along the line: the agent strides in with his padlock and chain and stops beside the brewer, who
// never looks up; he picks a can off the line and squints at it.
const c5 = FIT([body(B0, 0.45, 1.8, 0.3), body(AST, 0.45, 1.85, 0.3)], 116, 6, 50, 0.85, 0, 0, ROOM_BREW);
SHOT_CAMS[5] = () => [K(273, F(() => c5, 341, 0.0016), 68)];
SHOT_ACTS[5] = (f, s) => {
  const ag = agentWalk(5, s, f), fa = faceAt(5, s, f, ag.p, B0);
  const HAND: V3 = [0.18, TT + 0.16, 8.9];                                       // the hand-off point over the line
  const offer = f >= 336 && f < 352, took = f >= 350;
  const armR = f < 330 ? ([[22, -10], [8, -30]] as A2) : f < 342 ? AR.hipR : f < 356 ? armTo(5, s, f, ag.p, HAND, 1, fa, 1, "stand", 10, 80) : ([[22, 6], [26, -16]] as A2);
  const o = flow(f, [[273, { expr: "smug", facing: fa }], [332, { expr: "tacheUp", facing: fa, tilt: -3 }, 8], [356, { expr: "stare", facing: fa, tilt: 2, headTilt: 4 }, 8]]);
  const fb = faceAt(5, s, f, B0, [B0[0], 1.2, 6.0]);
  const brewer = offer ? { ...brewerCanning(5, s, f, B0, "bored"), armL: armTo(5, s, f, B0, HAND, -1, fb, 1, "stand", 10, 80), armLFront: true, propL: f < 350 ? "syrupCan" : undefined } : brewerCanning(5, s, f, B0, "bored");
  return { cast: [
    C(BRW, B0, brewer as FigOpts),
    C(AGT, ag.p, { ...o, ...ag.o, armR, armRFront: f >= 330, propR: f < 330 ? "padlock" : took ? "syrupCan" : undefined, armL: f >= 330 ? ([[-22, -10], [-8, -30]] as A2) : AR.hipL, propL: f >= 330 ? "padlock" : undefined } as FigOpts),
  ], subj: AGT, focus: HD(AGT, AST), ctl: CTLB(f) };
};
lens(273, 2);

// ================================================= S6 (370-438) "\"Syrup? With hops in it? Who bakes with hops?\"": over the brewer's
// shoulder (his back at the left edge): the agent sniffs the open can, plucks a hop cone off the lid on "hops", then throws
// both arms out with a mocking grin. Lip-sync on the quote (talk.json).
const c6 = FIT([body(AST, 0.9, 1.75, 0.3), body(B0, 0.9, 1.7, 0.28)], 122, 5, 46, 0.9, 0, -0.12, ROOM_BREW);
SHOT_CAMS[6] = () => [K(370, F(() => c6, 418, 0.0016, [[425, 0.005, 8]]), 48)];
SHOT_ACTS[6] = (f, s) => {
  const fa = faceAt(6, s, f, AST, [2.3, 1.6, 7.3]);
  const o = flow(f, [
    [370, { expr: "stare", facing: fa, armR: [[18, -4], [6, -26]] as A2, armRFront: true, armL: [[-22, -10], [-8, -30]] as A2, tilt: 3, headTilt: 4 }],
    [386, { expr: "aghast", facing: fa, armR: [[22, -14], [30, -46]] as A2, armL: [[-22, -10], [-8, -30]] as A2, tilt: 1 }, 6],
    [404, { expr: "mock", facing: fa, armR: ARMS.wideR, armL: ARMS.wideL, tilt: -2, headBack: 0.3 }, 7],
    [426, { expr: "mock", facing: fa, armR: ARMS.wideR, armL: ARMS.wideL, tilt: -4, headBack: 0.5, shake: 1, phase: 0.4 }, 6],
  ]);
  return { cast: [
    C(AGT, AST, { ...speak(f, 370, 435, o), propR: "syrupCan", propL: "padlock" } as FigOpts),
    C(BRW, B0, brewerCanning(6, s, f, B0, "bored")),
  ], subj: AGT, focus: HD(AGT, AST), ctl: CTLB(f) };
};
lens(370, 2.5, 12);

// ================================================= S7 (438-469) CUT: "\"It's for baking.\"" The brewer in close-up, half-lid deadpan;
// he shrugs one shoulder on "baking".
const c7 = F(() => { const h = HD(BRW, B0); const c = frameOn(h, 198, 0.42, 50, 44, 0.1, 0.4); return { pos: c.pos, look: c.look, fov: c.fov }; }, 438, 0.0016);
SHOT_CAMS[7] = () => [K(438, c7, 1, true)];
SHOT_ACTS[7] = (f, s) => {
  const fc = faceAt(7, s, f, B0, AST);
  const o = flow(f, [[438, { expr: "smug", facing: fc, armL: AR.hipL, armR: AR.carryR }], [452, { expr: "smug", facing: fc, tilt: -3, headTilt: -5, armL: AR.shrugL, armR: AR.carryR }, 6], [462, { expr: "smug", facing: fc, tilt: 0, headTilt: -2, armL: AR.hipL, armR: AR.carryR }, 8]]);
  return { cast: [C(BRW, B0, speak(f, 443, 464, o) as FigOpts)], subj: BRW, focus: HD(BRW, B0), ctl: CTLB(f) };
};
lens(437, 3, 1);
KICKS.push([438 / 30, 0.04]);

// ================================================= S8 (469-515) dissolve: "The whole station laughs,": through the agents' office window
// (PROHIBITION AGENTS in gold on the glass): three agents laughing, one slaps the desk, the lead agent holds the can up.
const c8 = F(() => cam3([187.2, 1.7, 4.6], [187.2, 1.75, 10.5], 46), 469, 0.0018);
SHOT_CAMS[8] = () => [K(469, c8, 1, true)];
const OFF_A: V3 = [187.2, 0.1, 10.75], OFF_S: V3 = [186.3, 0.1, 10.85], OFF_B: V3 = [188.1, 0.1, 10.95];
SHOT_ACTS[8] = (f, s) => {
  const slap = f >= 486 && f < 500 ? bump((f - 486) / 8) : 0;
  return { cast: [
    C(AGT, OFF_A, { ...laughP(f, 469, 0), armR: [[22, -12], [34, -52]] as A2, propR: "syrupCan", armL: AR.hipL }),
    C(AGS, OFF_S, { ...laughP(f, 472, 1), facing: 0.5, armR: f >= 482 ? armTo(8, s, f, OFF_S, [186.45, 0.9 + 0.12 * (1 - slap), 10.6], 1, 0.5, 1, "stand", 10, 80) : AR.hipR, armRFront: true }),
    C(AGB, OFF_B, { ...laughP(f, 475, 2), facing: -0.5, armL: AR.hipL, armR: AR.hipR }),
  ], subj: AGT, focus: HD(AGT, OFF_A), ctl: CTLB(f) };
};
lens(469, 0);

// ================================================= S9 (515-582) "...and soon the whole town calls him the baker.": glide along the
// sidewalk with the brewer carrying a crate of cans; a kid chalks BAKER on his truck door; two townsfolk point and laugh;
// the brewer swings the crate to his hip and tips his cap, deadpan.
const c9 = FIT([body([190.0, 0.15, 5.3], 0.4, 1.8, 0.3), body([190.9, 0.15, 4.8], 0.4, 1.8, 0.3), body([191.9, 0, 3.55], 0.3, 1.35, 0.3), body([193.9, 0.15, 5.6], 0.4, 1.8, 0.3)], 294, 6, 52, 0.86);
SHOT_CAMS[9] = () => [K(515, FS(() => c9, 515, 0.0012, 0.004), 1, true)];
const BRW9: V3[] = [[190.0, 0.15, 5.3], [190.9, 0.15, 4.8]];
SHOT_ACTS[9] = (f, s) => {
  const w = walkS(9, s, BRW, BRW9, f, 515, 552), P = w.p, fc = w.moving ? w.facing : faceAt(9, s, f, P, [P[0] - 1, 1, 6.5]);
  const carry2 = f < 552;
  const o = flow(f, [[515, { expr: "bored", facing: fc }], [562, { expr: "smug", facing: fc, tilt: -2 }, 8]]);
  const brewer = C(BRW, P, { ...o, ...w.o,
    ...(carry2 ? { carry2: true, propR: "crate", armR: [[24, 40], [14, 58]] as A2, armL: [[-24, 40], [-14, 58]] as A2, armRFront: true, armLFront: true }
      : { propL: "crate", armL: [[-24, 28], [-34, 44]] as A2, armLFront: true, armR: f >= 562 && f < 578 ? AR.tipHatR : AR.hipR, hatLift: f >= 564 && f < 576 ? 0.25 * bump((f - 564) / 12) : 0 }) } as FigOpts);
  const K9: V3 = [191.9, 0, 3.55], fk = faceAt(9, s, f, K9, [191.9, 1, 3.3]), wob = Math.sin(f * 0.9);
  const kid = C(KDC, K9, { expr: f < 548 ? "grin" : "laugh", facing: fk, back: f < 548, armR: f >= 530 && f < 566 ? armTo(9, s, f, K9, [191.95 + 0.1 * wob * (f < 562 ? 1 : 0), 0.95 + 0.04 * Math.cos(f * 0.9), 3.4], 1, fk) : AR.hipR, armRFront: true, propR: "chalk" });
  const T1: V3 = [193.9, 0.15, 5.6], T2: V3 = [194.7, 0.15, 5.9];
  const ft1 = faceAt(9, s, f, T1, P), ft2 = faceAt(9, s, f, T2, P);
  return { cast: [brewer, kid,
    C(TFK, T1, { ...laughP(f, 548, 0), facing: ft1, armR: f >= 544 ? AR.pointR : AR.hipR, armRFront: true, armL: [[-22, 8], [-30, -8]] as A2, armLFront: true, propL: "syrupCan" }),
    C(TMN, T2, { ...laughP(f, 552, 1), facing: ft2, armL: AR.hipL, armR: AR.hipR }),
  ], subj: BRW, focus: HD(BRW, P), ctl: CTLB(f) };
};
lens(515, 0);

// ================================================= S10 (582-658) dissolve: "But the first week, the grocery sells 3 cans.": the grocer
// stacks 3 cans on the empty syrup shelf, comes back to the counter and hands one to a customer; the board over the
// counter reads SYRUP SOLD 3.
const GC0: V3 = [99.4, 0, 3.92], CW0: V3 = [98.75, 0, 2.75];
const c10 = (f0: number) => F(() => FIT([body(GC0, 0.45, 1.8, 0.3), body(CW0, 0.45, 1.8, 0.3), body([99.05, 0, 3.42], 1.85, 2.65, 0.42), body([99.85, 0, 6.6], 1.0, 1.7, 0.25)], 176, 5, 54, 0.8, 0, 0, ROOM_GROC), f0, 0.0008);
SHOT_CAMS[10] = () => [K(582, c10(582), 1, true)];
const GW: V3 = [99.85, 0, 6.25], GC: V3 = GC0;
SHOT_ACTS[10] = (f, s) => {
  const back = f < 612, w = walkS(10, s, GRO, [GW, [99.6, 0, 5.2], GC], f, 612, 630), P = back ? GW : w.p;
  const fc = back ? 0 : faceAt(10, s, f, P, [99, 1, 2.6]);
  const stack = f >= 584 && f < 610 ? (((f - 584) % 8) / 8) : 0;
  const grocer = C(GRO, P, back ? { expr: "smile", back: true, armR: [[20, -8], [30 - 20 * stack, -30]] as A2, propR: f < 606 ? "syrupCan" : undefined }
    : { ...w.o, expr: f < 636 ? "smile" : "grin", facing: fc, armR: f >= 634 && f < 650 ? armTo(10, s, f, P, [99.12, 1.12, 3.66], 1, fc) : AR.hipR, armRFront: true, propR: f >= 632 && f < 646 ? "syrupCan" : undefined });
  const CW: V3 = CW0, fw = faceAt(10, s, f, CW, GC);
  const cust = C(TFK, CW, { expr: f < 646 ? "smile" : "smile_closed", facing: fw, armR: f >= 640 ? armTo(10, s, f, CW, f < 648 ? [98.95, 1.12, 3.0] : [98.88, 1.0, 2.8], 1, fw, 1, "stand", 10, 80) : AR.hipR, armRFront: true, propR: f >= 646 ? "syrupCan" : undefined });
  return { cast: [grocer, cust], subj: GRO, focus: HD(GRO, GC), ctl: CTLB(f) };
};
lens(582, 1.5);

// ================================================= S11 (658-701) dissolve, same framing a week later: "The next week, 30.": the board flips
// to 30, three customers with cans, the grocer handing out another.
const c11 = F(() => FIT([body(GC0, 0.45, 1.8, 0.3), body([98.72, 0, 2.75], 0.45, 1.8, 0.3), body([99.98, 0, 2.62], 0.45, 1.8, 0.3), body([99.42, 0, 1.95], 0.3, 1.35, 0.3), body([99.05, 0, 3.42], 1.85, 2.65, 0.42)], 178, 6, 56, 0.88, 0, 0, ROOM_GROC), 658, 0.0012);
SHOT_CAMS[11] = () => [K(658, c11, 1, true)];
SHOT_ACTS[11] = (f, s) => {
  const fc = faceAt(11, s, f, GC, [99.4, 1, 2.0]);
  const Q1: V3 = [98.72, 0, 2.75], Q2: V3 = [99.98, 0, 2.62], Q3: V3 = [99.42, 0, 1.95];
  return { cast: [
    C(GRO, GC, { expr: "grin", facing: fc, armR: armTo(11, s, f, GC, [99.25, 1.12 + 0.03 * Math.sin(f * 0.3), 3.66], 1, fc), armRFront: true, propR: "syrupCan", armL: AR.hipL }),
    C(TFK, Q1, { expr: "smile_closed", facing: faceAt(11, s, f, Q1, GC), armR: [[22, 8], [30, -8]] as A2, armRFront: true, propR: "syrupCan" }),
    C(TMN, Q2, { expr: "grin", facing: faceAt(11, s, f, Q2, GC), armL: [[-22, 8], [-30, -8]] as A2, armLFront: true, propL: "syrupCan" }),
    C(KDC, Q3, { expr: "joy", facing: faceAt(11, s, f, Q3, GC), back: true, armR: [[22, -10], [26, -40]] as A2, propR: "syrupCan" }),
  ], subj: GRO, focus: HD(GRO, GC), ctl: CTLB(f) };
};

// ================================================= S12 (701-767) dissolve: "By month's end, it's a whole wall,": low and wide: the syrup
// wall full to the top, the grocer on his stool stacking the top shelf, a queue with baskets; the agent's wife (teal) loads hers.
const c12 = FIT([body([101.05, 0, 5.7], 0.4, 1.8, 0.3), body([99.9, 0, 6.0], 0.4, 1.8, 0.3), body([102.7, 0.45, 6.15], 0.4, 1.85, 0.3), body([101.6, 0, 6.78], 0.5, 3.0, 1.9)], 178, -2, 60, 0.9, 0, 0, ROOM_GROC);
SHOT_CAMS[12] = () => [K(701, F(() => c12, 701, 0.0016, [[741, 0.14, 8]]), 1, true)];   // punch in on "wall"
const GS: V3 = [102.7, 0.45, 6.15], QW: V3 = [101.05, 0, 5.7], QA: V3 = [100.45, 0, 5.85], QB: V3 = [99.9, 0, 6.0];   // a queue along the wall, the wife at its head
const act12 = (f: number, s: SetDef): Act => {
  const lift = Math.sin(f * 0.22), load = f >= 726 && f < 752 ? sm(f, 726, 740) * (1 - sm(f, 742, 752)) : 0, fw = faceAt(12, s, f, QW, [101.6, 1.4, 2.0]);
  return { cast: [
    C(GRO, GS, { expr: "grin", back: true, armR: [[22, -24], [26 + 6 * lift, -58]] as A2, propR: "syrupCan", armL: [[-20, -10], [-24, -36]] as A2 }),
    C(WIF, QW, { expr: f < 740 ? "smile_closed" : "smile", facing: fw, armL: [[-24, 36], [-30, 56]] as A2, propL: "basket", armLFront: true, armR: [[24, 10 + 16 * load], [14, -6 + 40 * load]] as A2, armRFront: true, propR: f < 746 ? "syrupCan" : undefined }),
    C(TFK, QA, { expr: "smile", facing: faceAt(12, s, f, QA, [101.6, 1.4, 2.0]), armL: [[-24, 36], [-30, 56]] as A2, propL: "basket" }),
    C(TMN, QB, { expr: "grin", facing: faceAt(12, s, f, QB, [101.6, 1.4, 2.0]), armR: [[24, 36], [30, 56]] as A2, propR: "basket" }),
  ], subj: WIF, focus: HD(WIF, QW), ctl: CTLB(f) };
};
SHOT_ACTS[12] = act12;
lens(701, 0);

// ================================================= S13 (767-824) "...and the flour next to it hasn't sold a bag.": glide right along
// the wall to the flour sacks: dusty, a cobweb, a spider walking over FLOUR (an insert: no faces).
const FL: V3 = [103.42, 0.85, 5.5], c13 = cam3(lerp3(c12.pos, [102.55, 1.3, 3.9], 0.62), FL, 46);   // a dolly toward the flour, in front of the queue   // a dolly from the S12 lens onto the flour (no swing)
SHOT_CAMS[13] = () => [K(767, F(() => c13, 823, 0.0008), 56)];
SHOT_ACTS[13] = (f, s) => ({ cast: act12(766, s).cast, subj: null, focus: [103.45, 0.9, 5.55], ctl: CTLB(f) });   // the queue stays put (held at S12's last frame), out of the insert's line of sight
lens(767, 2, 30);

// ================================================= S14 (824-855) CUT: "So where's all the bread?": the agent in the shop doorway, notepad
// up, squinting at the empty bread rack.
const AD: V3 = [102.15, 0, 0.75];
const c14 = F(() => FIT([body(AD, 0.45, 1.85, 0.3), body([101.25, 0, 0.3], 0.9, 2.15, 0.46)], 8, 4, 46, 0.86, 0, 0, ROOM_GROC), 824, 0.002);
SHOT_CAMS[14] = () => [K(824, c14, 1, true)];
SHOT_ACTS[14] = (f, s) => {
  const fa = faceAt(14, s, f, AD, [BR.BREAD[0], 1.2, BR.BREAD[2]]);
  return { cast: [C(AGT, AD, flow(f, [[824, { expr: "stern", facing: fa, armR: [[22, -4], [16, -26]] as A2, armRFront: true, propR: "clipboard", headTilt: 5 }], [838, { expr: "stare", facing: fa, armR: [[22, -4], [16, -26]] as A2, armRFront: true, propR: "clipboard", headTilt: -3, tilt: 3 }, 6]]))],
    subj: AGT, focus: HD(AGT, AD), ctl: CTLB(f) };
};
{ const a14 = SHOT_ACTS[14]; SHOT_ACTS[14] = (f, s) => { const a = a14(f, s), c = CTLB(f); return { ...a, cast: [...a.cast, C(BRW, [(c.yeastX ?? 102.25) + 0.3, 0, (c.yeastZ ?? -1.4) + 0.45], { expr: "bored", facing: 0.5, armR: AR.hipR, armL: AR.hipL })] }; }; }
lens(823, 3, 1);

// ================================================= S15 (855-913) "Then the brewery sells yeast too,": pull back from the agent over the
// grocer's shoulder: the brewer wheels a tower of YEAST boxes in on a hand truck; the grocer reaches up to steady the top box.
const c15 = FIT([body([101.7, 0, 1.95], 0.8, 2.6, 0.25), body([102.0, 0, 2.4], 0.4, 1.8, 0.3), body([101.2, 0, 0.95], 0.45, 1.85, 0.3)], 15, 6, 56, 0.86, 0, 0, ROOM_GROC);
SHOT_CAMS[15] = () => [K(855, F(() => c15, 901, 0.0014), 46)];
const G15: V3 = [101.55, 0, 3.55];
SHOT_ACTS[15] = (f, s) => {
  const c = CTLB(f), tower: V3 = [c.yeastX ?? 101.7, 0, c.yeastZ ?? 1.95];
  const PB: V3 = [tower[0] + 0.3, 0, tower[2] + 0.45], moving = f > 866 && f <= 896, fb = faceAt(15, s, f, PB, [102.4, 1.5, 4.2]);   // pulls the hand truck in, walking backwards ahead of it
  const dist = Math.hypot(102.25 - (c.yeastX ?? 101.7), -1.4 - (c.yeastZ ?? 1.95));
  const catchK = sm(f, 880, 888);
  const aw = walkS(15, s, AGT, [AD, [101.2, 0, 0.95]], f, 862, 880), AD2 = aw.p;   // steps away from the doorway, to the side the brewer is not on
  return { cast: [
    C(BRW, PB, { expr: f < 896 ? "bored" : "smug", facing: fb, ...(moving ? { mode: "stride", phase: -dist / SM(BRW) } : {}), armR: armTo(15, s, f, PB, [tower[0] + 0.2, 1.12, tower[2] + 0.3], 1, fb, 1, "stand", 10, 80), armL: armTo(15, s, f, PB, [tower[0] + 0.34, 1.12, tower[2] + 0.3], -1, fb, 1, "stand", 10, 80) } as FigOpts),
    C(GRO, G15, { expr: f < 884 ? "shock" : "relief", back: true, armR: [[22, -20 - 6 * catchK], [26, -50 - 14 * catchK]] as A2, armL: [[-22, -20 - 6 * catchK], [-26, -50 - 14 * catchK]] as A2, tilt: 3 * catchK }),
    C(AGT, AD2, { expr: "stern", facing: aw.moving ? aw.facing : faceAt(15, s, f, AD2, tower), ...aw.o, armR: [[22, -4], [16, -26]] as A2, armRFront: true, propR: "clipboard" } as FigOpts),
  ], subj: f < 868 ? AGT : BRW, focus: HD(BRW, PB), ctl: c };
};
lens(855, 2, 10);

// ================================================= S16 (913-980) dissolve: "...enough to raise a loaf the size of the church.": high over
// the town from the west: the giant loaf rises beside the church steeple; tiny townsfolk stare up.
const c16 = (f: number): Shot => { const u = sm(f, 913, 980); return { pos: lerp3([200, 19.5, -10], [202.5, 21, -9.2], u), look: lerp3([234, 4.6, 13], [234, 5.6, 13], u), fov: 40, roll: 0 }; };
SHOT_CAMS[16] = () => [K(913, c16, 1, true)];
SHOT_ACTS[16] = (f, s) => {
  const up = { expr: "aghast" as Face, headBack: 0.8, tilt: -4 };
  return { cast: [
    C(TFK, [231.2, 0.15, 5.3], { ...up, facing: 0.5 }), C(TMN, [232.4, 0.15, 5.0], { ...up, facing: -0.5, armR: AR.pointR }), C(KDC, [233.4, 0.15, 5.4], { ...up, facing: 0.5 }),
  ], subj: null, focus: [230, 4, 14], ctl: CTLB(f) };
};
lens(913, 0);

// ================================================= S17 (980-1033) dissolve: "So the agent knocks on doors,": night, granny's porch in
// profile: the agent hammers on the door three times (knock stars on the wood).
const KN2: V3 = [197.5, 0.6, 7.45], KM: V3 = [197.45, 0.6, 7.68];   // KM: where he waits while the door swings out
const KN: V3 = [197.25, 0.6, 7.9], GD: V3 = [196.9, 0.6, 8.34], GIN: V3 = [197.1, 0.6, 8.4];   // GIN: behind the closed leaf in the jamb; the leaf swings out past him once he has stepped back
const c17 = cam3([197.6, 2.05, 5.35], [197.15, 1.85, 8.3], 46);   // further back: he steps back toward the lens after the knocks
SHOT_CAMS[17] = () => [K(980, F(() => c17, 980, 0.0012), 1, true)];   // no punch: he steps back toward the lens at the end
const KNOCKS = [994, 1003, 1012];
SHOT_ACTS[17] = (f, s) => {
  const fa = faceAt(17, s, f, KN, [197.25, 1.9, 8.5]);
  let hit = 0; for (const k of KNOCKS) hit = Math.max(hit, bump((f - k + 4) / 8));
  const aw = walkS(17, s, AGT, [KN, KM], f, 1014, 1030, true), P = aw.p;   // he steps back off the door after the third knock, then it swings out
  const knockArm = f < 1022 ? armTo(17, s, f, P, [197.05, 1.95, 8.14 + 0.03 * hit], 1, fa) : AR.hipR;   // (no reach target once the arm is down)
  const arm = flow(f, [[980, { armR: knockArm, armRFront: true }], [1016, { armR: AR.hipR, armRFront: false }, 6]]);
  return { cast: [C(GRA, GIN, { expr: "smile", facing: 0, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "rollingPin", armL: [[-24, 30], [-28, 44]] as A2, armLFront: true, propL: "pie" }), C(AGT, P, { expr: "stern", back: true, facing: -0.3, tilt: 2 * hit, ...aw.o, ...arm, armL: AR.hipL } as FigOpts)],
    subj: AGT, focus: HD(AGT, KN), ctl: CTLB(f), fx: fxs(...KNOCKS.map((k, i) => clang("kn" + i, [197.12, 1.95, 8.16], f - k, 0.32))) };
};
lens(980, 2);
for (const k of KNOCKS) KICKS.push([k / 30, 0.035]);

// ================================================= S18 (1033-1129) "...and a granny answers with flour on her hands. She really is
// baking.": the door swings in on her lit kitchen; over the agent's shoulder she stands with her rolling pin, then holds up a
// fresh pie, proud; a slow push in on "baking".
const c18 = cam3([197.3, 2.05, 6.3], [196.92, 1.95, 8.35], 50);   // over his shoulder but squarer on her: the S19 pull-back turns less
SHOT_CAMS[18] = () => [K(1033, F(() => c18, 1072, 0.0012), 40)];
SHOT_ACTS[18] = (f, s) => {
  const aw = walkS(18, s, AGT, [KM, KN2], f, 1036, 1050, true), P = aw.p, fg = faceAt(18, s, f, GD, [197.5, 1.9, 7.3]);
  const g = flow(f, [
    [1033, { expr: "smile", facing: fg, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "rollingPin", armL: [[-24, 30], [-28, 44]] as A2, armLFront: true, propL: "pie" }],
    [1066, { expr: "proud", facing: fg, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "rollingPin", armL: [[-22, 6], [-26, -12]] as A2, armLFront: true, propL: "pie", tilt: -2 }, 8],
    [1100, { expr: "beam", facing: fg, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "rollingPin", armL: [[-22, 4], [-26, -16]] as A2, armLFront: true, propL: "pie", tilt: -3, headTilt: 4 }, 8],
  ]);
  const cast: CastPlace[] = [C(AGT, P, { expr: f < 1070 ? "stare" : "worry", back: true, facing: -0.3, ...aw.o, sweat: sm(f, 1080, 1100), armL: AR.hipL, armR: AR.hipR } as FigOpts)];
  const gIn: V3 = lerp3(GIN, GD, sm(f, 1034, 1048));   // steps out of her lit kitchen as the door swings in
  cast.push(C(GRA, gIn, g));
  return { cast, subj: f >= 1040 ? GRA : AGT, focus: HD(GRA, GD), ctl: CTLB(f) };
};
lens(1033, 3, 12);

// ================================================= S19 (1129-1209) "He says sorry, backs down the steps, and her cellar goes...": low
// from the street: the agent backs down the porch steps tipping his hat, sweating; the granny waves with the brass key on its
// red string; the cellar window beside the steps starts to glow and rattle.
const c19 = FIT([body([197.35, 0.6, 7.1], 0.4, 1.85, 0.3), body([197.9, 0.15, 5.75], 0.4, 1.85, 0.3), body(GD, 0.4, 1.75, 0.3), body([199.3, 0, 8.39], 0.05, 0.45, 0.4)], 192, 0, 56, 0.86);
SHOT_CAMS[19] = () => [K(1129, F(() => c19, 1209, 0.0012), 80)];   // pulls back off the porch first; he only starts backing down once the lens is clear of her
const BACK19: V3[] = [KN2, [197.35, 0.6, 7.1], [197.3, 0.15, 6.4], [197.9, 0.15, 5.75]];
const AJ: V3 = [197.9, 0.15, 5.75];
SHOT_ACTS[19] = (f, s) => {
  const w = walkS(19, s, AGT, BACK19, f, 1150, 1204, true), P = w.p, fa = faceAt(19, s, f, P, GD);
  const a = flow(f, [[1129, { expr: "worry", facing: fa, sweat: 1, armR: AR.hipR, armL: AR.hipL }], [1142, { expr: "fakegrin", facing: fa, sweat: 1, armR: AR.tipHatR, armL: AR.hipL }, 6], [1172, { expr: "worry", facing: fa, sweat: 1, armR: AR.hipR, armL: AR.hipL }, 8]]);
  const fg = faceAt(19, s, f, GD, P), wave = Math.sin((f - 1160) * 0.45);
  const g = flow(f, [[1129, { expr: "beam", facing: fg, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "rollingPin", armL: [[-24, 30], [-28, 44]] as A2, armLFront: true, propL: "pie" }], [1162, { expr: "smile_closed", facing: fg, armR: [[24, -14], [34 + 8 * wave, -46]] as A2, propR: "rollingPin", armL: [[-24, 30], [-28, 44]] as A2, armLFront: true, propL: "pie" }, 8]]);
  const cw: V3 = [199.3, 0.24, 8.3];
  return { cast: [C(AGT, P, { ...a, ...w.o, hatLift: f >= 1146 && f < 1168 ? 0.2 * bump((f - 1146) / 22) : 0 } as FigOpts), C(GRA, GD, g)],
    subj: f < 1150 ? GRA : AGT, focus: HD(AGT, P), ctl: CTLB(f), fx: fxs(f >= 1186 ? squiggles("rattle", [cw[0], cw[1] + 0.32, cw[2] - 0.12], f, "#ffe2a0", 0.34) : null) };
};
lens(1129, 1.5);

// ================================================= S20 (1209-1231) CUT: "...pop.": the cellar window bursts, a cap pings off, foam sprays;
// the agent jumps, his hat flying up.

const c20 = FIT([body(AJ, 0.4, 2.15, 0.3), body([199.3, 0, 8.39], 0.05, 0.45, 0.4)], 148, 0, 52, 0.85);
SHOT_CAMS[20] = () => [K(1209, F(() => c20, 1209, 0.0025), 1, true)];
SHOT_ACTS[20] = (f, s) => {
  const fa = faceAt(20, s, f, AJ, [199.3, 0.3, 8.3]), j = f >= 1214 ? bump((f - 1214) / 14) : 0;
  return { cast: [C(AGT, AJ, { expr: f < 1214 ? "worry" : "aghast", facing: fa, mode: j > 0 ? "hop" : undefined, lift: j, hatLift: f >= 1214 ? Math.min(1, (f - 1214) / 8) : 0, armR: f >= 1214 ? ARMS.upR : AR.hipR, armL: f >= 1214 ? ARMS.upL : AR.hipL, sweat: 1 } as FigOpts)],
    subj: AGT, focus: HD(AGT, AJ), ctl: CTLB(f), fx: fxs(capFly("c20", [199.3, 0.3, 8.25], [-0.3, -0.6], f - 1214), clang("pop20", [199.3, 0.3, 8.2], f - 1213, 0.4)) };
};
lens(1208, 2, 1);
KICKS.push([1214 / 30, 0.09]);

// ================================================= S21 (1231-1262) whip right: "Then the next house pops.": the camera whips to the next
// house's cellar window as it bursts; the agent spins and stumbles after it.
const c21 = FIT([body([205.3, 0, 8.39], 0.05, 0.45, 0.4), body([200.6, 0.15, 6.1], 0.4, 1.85, 0.3), body(AJ, 0.4, 1.85, 0.3)], 200, 6, 60, 0.85);
SHOT_CAMS[21] = () => [K(1240, F(() => c21, 1240, 0.0016), 1, true)];   // the cut moved from 1231 to 1240: S20's cut was only 0.7 s before (v34 hard fail: two cuts within 1 s)
SHOT_ACTS[21] = (f, s) => {
  const w = walkS(21, s, AGT, [AJ, [199.6, 0.15, 6.2], [200.6, 0.15, 6.1]], f, 1246, 1260)   /* starts after the 8-frame seam ease of the 1240 cut */, P = w.p, fa = w.moving ? w.facing : faceAt(21, s, f, P, [205.3, 0.3, 8.3]);
  return { cast: [C(AGT, P, { expr: f < 1246 ? "aghast" : "shock", facing: fa, sweat: 1, ...w.o, hatLift: 1, armR: ARMS.upR, armL: AR.hipL } as FigOpts)],
    subj: AGT, focus: [204.5, 0.6, 8.2], ctl: CTLB(f), fx: fxs(capFly("c21", [205.3, 0.3, 8.25], [0.2, -0.6], f - 1246), clang("pop21", [205.3, 0.3, 8.2], f - 1246, 0.4)) };
};
lens(1240, 0);
KICKS.push([1246 / 30, 0.07]);

// ================================================= S22 (1262-1300) "Then the whole street.": crane up and back: down the whole street the
// cellar windows burst one after another, foam fountains; the agent turning in the middle of it.
const c22 = cam3([198.4, 3.0, -5.4], [206.2, 0.9, 7.0], 50);   // a short push and pan down the street: the agent stays big in front while the cellars pop beyond him
SHOT_CAMS[22] = () => [K(1262, F(() => c22, 1299, 0.0006), 37)];
SHOT_ACTS[22] = (f, s) => {
  const w = walkS(22, s, AGT, [[200.6, 0.15, 6.1], [202.6, 0.15, 5.7]], f, 1270, 1292), P = w.p, turn = Math.sin((f - 1292) * 0.2) * sm(f, 1290, 1296);
  const T3: V3 = [209.3, 0.6, 7.8], T4: V3 = [215.2, 0.6, 7.8];
  return { cast: [C(AGT, P, { expr: "aghast", facing: w.moving ? w.facing : turn, sweat: 1, ...w.o, hatLift: 1, armR: ARMS.upR, armL: ARMS.upL, tilt: 4 * turn } as FigOpts),
    C(TFK, T3, { expr: "aghast", facing: 0.5, armR: ARMS.upR }), C(TMN, T4, { expr: "shock", facing: -0.5, armL: ARMS.upL })],
    subj: AGT, focus: [208, 0.6, 8.2], ctl: CTLB(f), fx: fxs(...[1268, 1278, 1288].map((t, i) => clang("pop22" + i, [211.3 + 6 * i, 0.3, 8.2], f - t, 0.5))) };
};
lens(1262, 0);

// ================================================= S23 (1300-1397) dissolve: "That syrup is malt extract, the barley sugar, already cooked.":
// the cellar under granny's house, sliced open: she pours a can into the crock (a thick ribbon); the can's label pops up big
// beside it: PURE MALT EXTRACT.
const CK: V3 = [196.8, -1.88, 10.95], GR: V3 = [196.72, -2.5, 11.22];
const c23 = FIT([body(GR, 0.4, 1.75, 0.3), body(CK, 0, 0.45, 0.25), body([195.35, -2.5, 12.45], 0.4, 2.0, 1.2)], 172, 6, 50, 0.9);
SHOT_CAMS[23] = () => [K(1300, F(() => c23, 1300, 0.0016, [[1326, 0.005, 10]]), 1, true)];
SHOT_ACTS[23] = (f, s) => {
  const fg = faceAt(23, s, f, GR, [197.3, -1.4, 7.5]), pour = sm(f, 1308, 1320);
  const hand: V3 = [CK[0] + 0.12, -1.32, CK[2] + 0.06];
  const o = flow(f, [[1300, { expr: "smile_closed", facing: fg }], [1340, { expr: "proud", facing: fg, tilt: -2 }, 8]]);
  const mouth: V3 = [CK[0] + 0.04, -1.38, CK[2]];
  return { cast: [C(GRA, GR, { ...o, armR: armTo(23, s, f, GR, hand, 1, fg, 1, "stand", 10, 80), armRFront: true, propR: f < 1392 ? "syrupCan" : undefined, propRAng: 1.9 * pour, armL: armTo(23, s, f, GR, [CK[0] - 0.16, -1.5, CK[2] + 0.01], -1, fg, 1, "stand", 10, 80), armLFront: true } as FigOpts)],
    subj: GRA, focus: HD(GRA, GR), ctl: CTLB(f),
    fx: fxs(pour > 0.6 ? syrupStream("p23", mouth, [CK[0] + 0.02, -1.5, CK[2] - 0.05], f, f > 1360 ? 0.075 : 0.06) : null, labelCard([CK[0] - 0.55, -1.15, CK[2] - 0.25], f, 1326, 1366)) };
};
lens(1300, 2.5);

// ================================================= S24 (1397-1451) "Add water and yeast,": straight down into the crock: water splashes
// in, then a cake of yeast drops in.
const c24 = FIT([body(GR, 0.8, 1.7, 0.3), body(CK, 0.1, 0.45, 0.25)], 171, 14, 46, 0.86);
SHOT_CAMS[24] = () => [K(1397, F(() => c24, 1450, 0.0014), 53)];
SHOT_ACTS[24] = (f, s) => {
  const sur: V3 = [CK[0], -1.62, CK[2]], water = f >= 1404 && f < 1428, fg = faceAt(24, s, f, GR, [196.95, -1.0, 9.95]);
  const pourK = sm(f, 1400, 1406) * (1 - sm(f, 1426, 1432)), drop = f >= 1424 && f < 1434;
  const gran = C(GRA, GR, { expr: f < 1431 ? "smile_closed" : "proud", facing: fg, tilt: 4,
    armL: armTo(24, s, f, GR, [CK[0] - 0.2, -1.3, CK[2] + 0.02], -1, fg, 1, "stand", 10, 80), armLFront: true, propL: f < 1432 ? "bucket" : undefined, propLAng: 0.9 * pourK,
    armR: drop ? armTo(24, s, f, GR, [CK[0] + 0.06, -1.3, CK[2] + 0.02], 1, fg, 1, "stand", 10, 80) : AR.hipR, armRFront: true } as FigOpts);
  const yA = f - 1431, cake = yA >= 0 && yA < 12 ? popCard("yeastCake", lerp3([CK[0] + 0.02, -1.0, CK[2] + 0.02], sur, yA / 12), 0.11 - 0.05 * (yA / 12), 0.08 - 0.035 * (yA / 12), f, 1431, 1443, (g) => {
    g.fillStyle = INKC; g.fillRect(0, 0, 256, 180); g.fillStyle = "#f2d860"; g.fillRect(10, 10, 236, 160); g.fillStyle = "#b3261e"; g.fillRect(10, 10, 236, 34); g.fillStyle = "#3a1e10"; g.font = "900 64px Georgia"; g.textAlign = "center"; g.fillText("YEAST", 128, 130); }, 256, 180) : null;
  return { cast: [gran], subj: GRA, focus: sur, ctl: CTLB(f),
    fx: fxs(water ? waterStream("w24", [CK[0] - 0.18, -1.22, CK[2] - 0.05], [CK[0] - 0.05, -1.58, CK[2]], f) : null, splash("s24", sur, f - 1406, 0.5), cake, splash("s24b", sur, f - 1443, 0.35)) };
};
lens(1397, 3, 16);

// ================================================= S25 (1451-1529) "...and the yeast eats it and burps out alcohol and bubbles.": rise out
// of the crock onto the granny: bubbles climb, the foam burps on "burps" and crowns the rim; she leans in, sniffs, delighted.
const c25 = FIT([body(GR, 0.4, 1.75, 0.3), body(CK, 0, 0.6, 0.25)], 174, 6, 44, 0.86);
SHOT_CAMS[25] = () => [K(1451, F(() => c25, 1499, 0.0016, [[1476, 0.09, 8]]), 48)];   // punch in on "burps"
SHOT_ACTS[25] = (f, s) => {
  const fg = faceAt(25, s, f, GR, [197.1, -1.4, 9.3]);
  const o = flow(f, [[1451, { expr: "stare", facing: fg }], [1478, { expr: "shock", facing: fg, tilt: -4, headBack: 0.3 }, 5], [1494, { expr: "joy", facing: fg, tilt: 9, headTilt: 5 }, 10]]);
  return { cast: [C(GRA, GR, { ...o, armL: AR.hipL, armR: AR.hipR } as FigOpts)], subj: GRA, focus: HD(GRA, GR), ctl: CTLB(f),
    fx: fxs(bubbles("b25", [CK[0], -1.47, CK[2] - 0.1], f, sm(f, 1455, 1475)), f >= 1478 && f < 1500 ? squiggles("burp", [CK[0] + 0.05, -1.1, CK[2] - 0.15], f, "#fff2d0", 0.3) : null) };
};
lens(1451, 3, 12);

// ================================================= S26 (1529-1606) dissolve: "It's like pancake mix, except it only makes beer.": the grocer
// at the counter: water from a jug into the PANCAKE MIX bowl (batter); then he holds up a syrup can and taps his jug: beer foam.
const PG: V3 = [98.1, 0, 3.88];
const c26 = FIT([body(PG, 0.45, 1.8, 0.3), body([97.75, 0.95, 3.62], 0, 0.3, 0.12), body([98.6, 0.95, 3.62], 0, 0.3, 0.1)], 180, 8, 48, 0.86, 0, 0, ROOM_GROC);
SHOT_CAMS[26] = () => [K(1529, F(() => c26, 1529, 0.0016, [[1563, 0.14, 8]]), 1, true)];   // punch in as the foam froths
SHOT_ACTS[26] = (f, s) => {
  const fc = faceAt(26, s, f, PG, [98.05, 1.4, 2.3]), pourK = sm(f, 1536, 1542) * (1 - sm(f, 1556, 1562));
  const tap = f >= 1584 && f < 1600 ? bump((f - 1584) / 8) + bump((f - 1592) / 8) : 0;
  const o = flow(f, [[1529, { expr: "smile", facing: fc }], [1564, { expr: "grin", facing: fc }, 8], [1590, { expr: "scheme", facing: fc, tilt: -2 }, 8]]);
  return { cast: [C(GRO, PG, { ...o,
    armR: f < 1566 ? armTo(26, s, f, PG, [98.0, 1.18 - 0.04 * pourK, 3.62], 1, fc) : AR.hipR, armRFront: true, propR: f < 1566 ? "jug" : undefined, propRAng: 1.2 * pourK,
    armL: f < 1564 ? AR.hipL : armTo(26, s, f, PG, [98.3 + 0.02 * tap, 1.28 - 0.06 * tap, 3.64], -1, fc), armLFront: true, propL: f >= 1564 ? "syrupCan" : undefined } as FigOpts)],
    subj: GRO, focus: [98.1, 1.1, 3.5], ctl: CTLB(f), fx: fxs(pourK > 0.5 ? waterStream("w26", [97.98, 1.12, 3.61], [98.03, 1.0, 3.62], f) : null) };
};
lens(1529, 3, 1);

// ================================================= S27 (1606-1665) dissolve: "One can makes 45 bottles,": granny's cellar: shelves of brown
// bottles, 45 chalked on the beam; she pulls the capper's lever down on a bottle: clack.
const GK: V3 = [196.22, -2.5, 11.3];
const c27 = FIT([body(GK, 0.4, 1.75, 0.3), body([195.4, -0.15, 12.68], 0, 0.3, 0.3), body([195.35, -2.5, 12.45], 0.3, 2.0, 1.3)], 172, 2, 54, 0.8);
SHOT_CAMS[27] = () => [K(1606, F(() => c27, 1606, 0.0012), 1, true)];   // no punch: a push sliced her head
SHOT_ACTS[27] = (f, s) => {
  const fg = faceAt(27, s, f, GK, [196.4, -1.3, 8.4]), press = f >= 1626 && f < 1644 ? bump((f - 1626) / 18) : 0;
  return { cast: [C(GRA, GK, { expr: f < 1632 ? "determined" : "proud", facing: fg, armL: armTo(27, s, f, GK, [196.42, -1.5 - 0.14 * press, 11.07], -1, fg, 1, "stand", 10, 80), armLFront: true, armR: [[24, 30], [28, 44]] as A2, armRFront: true, propR: "rollingPin", tilt: 3 * press } as FigOpts)],
    subj: GRA, focus: HD(GRA, GK), ctl: CTLB(f), fx: fxs(clang("cap27", [196.3, -1.82, 11.03], f - 1634, 0.24)) };
};
lens(1606, 1.5);
KICKS.push([1634 / 30, 0.03]);

// ================================================= S28 (1665-1741) "...and cap them too soon, the bubbles blow the caps off.": closer: she
// caps another; the bottles behind her hiss, then the caps blow off one after another and ping off the ceiling, foam; she
// ducks under her rolling pin.
const c28 = FIT([body(GK, 0.5, 1.8, 0.32), body([195.6, -2.5, 12.45], 1.0, 1.9, 0.6)], 168, 4, 46, 0.86);
SHOT_CAMS[28] = () => [K(1665, F(() => c28, 1690, 0.0018), 26)];   // no punch: a push sliced her head
SHOT_ACTS[28] = (f, s) => {
  const fg = faceAt(28, s, f, GK, [196.6, -1.4, 9.4]), press = f >= 1668 && f < 1684 ? bump((f - 1668) / 16) : 0;
  const o = flow(f, [
    [1665, { expr: "proud", facing: fg, armL: armTo(28, s, f, GK, [196.42, -1.5 - 0.14 * press, 11.07], -1, fg, 1, "stand", 10, 80), armLFront: true, armR: [[24, 30], [28, 44]] as A2, armRFront: true, propR: "rollingPin" }],
    [1690, { expr: "stare", facing: fg, armR: [[24, 30], [28, 44]] as A2, armRFront: true, propR: "rollingPin", armL: AR.hipL, headTilt: 6 }, 8],
    [1704, { expr: "yikes", facing: fg, armR: [[22, -26], [10, -58]] as A2, armL: [[-22, -26], [-10, -58]] as A2, tilt: 8, propR: "rollingPin" }, 6],
    [1730, { expr: "joy", facing: fg, armR: [[22, -26], [10, -58]] as A2, armL: [[-22, -26], [-10, -58]] as A2, tilt: 3, propR: "rollingPin" }, 8],
  ]);
  const shelf: V3 = [195.3, -1.2, 12.4];
  return { cast: [C(GRA, GK, o)], subj: GRA, focus: HD(GRA, GK), ctl: CTLB(f), fx: fxs(f >= 1688 && f < 1704 ? squiggles("hiss", shelf, f, "#ffffff", 0.36) : null) };
};
lens(1665, 2.5, 12);
KICKS.push([1700 / 30, 0.06]);

// ================================================= S29 (1741-1838) dissolve: "Breweries really did this, and grocers sold it with a wink.":
// over a customer's shoulder: the grocer hands a can across the counter, leans in and winks on "wink"; behind him the
// poster of a winking grocer.
const G29: V3 = [98.4, 0, 3.92], CU29: V3 = [98.95, 0, 2.75];
const c29 = FIT([body(G29, 0.45, 1.8, 0.3), body([98.0, 0, 6.93], 1.6, 2.5, 0.4)], 172, 4, 46, 0.86, 0, -0.16, ROOM_GROC);   // lift: his face above the caption band
SHOT_CAMS[29] = () => [K(1741, F(() => c29, 1741, 0.0012, [[1818, 0.1, 8]]), 1, true)];   // punch in on "wink"
SHOT_ACTS[29] = (f, s) => {
  const fc = faceAt(29, s, f, G29, [98.8, 1.5, 1.6]);
  const o = flow(f, [
    [1741, { expr: "smile", facing: fc, armR: [[24, 20], [28, 36]] as A2, armRFront: true }],
    [1756, { expr: "grin", facing: fc, armR: [[22, -6], [30, -34]] as A2, armRFront: true, tilt: 2 }, 10],
    [1788, { expr: "scheme", facing: fc, tilt: 6, armR: [[22, -6], [30, -34]] as A2, armRFront: true }, 10],
    [1820, { expr: "wink", facing: fc, tilt: 7, headTilt: 6, armR: [[22, -6], [30, -34]] as A2, armRFront: true }, 4]]);
  return { cast: [
    C(GRO, G29, { ...o, propR: "syrupCan", armL: AR.hipL } as FigOpts),
    C(TFK, CU29, { expr: "smile", back: true, facing: -0.3, armR: AR.hipR, armL: [[-24, 36], [-30, 56]] as A2, propL: "basket" }),
  ], subj: GRO, focus: HD(GRO, G29), ctl: CTLB(f) };
};
lens(1741, 2.5);

// ================================================= S30 (1838-1903) dissolve: "So the agent heads home, opens his cellar,": night outside his
// own house: he trudges up and hauls the slanted cellar doors open; the brass key on its red string swings in the lock; light
// spills up.
const c30 = FIT([body([219.5, 0.15, 7.17], 0.4, 1.85, 0.3), body(BR.BULK, 0, 0.6, 0.7)], 200, 8, 52, 0.8);
SHOT_CAMS[30] = () => [K(1838, F(() => c30, 1838, 0.0016, [[1871, 0.09, 8]]), 1, true)];   // punch in on "opens"
SHOT_ACTS[30] = (f, s) => {
  const w = walkS(30, s, AGT, [[218.1, 0.15, 6.55], [218.8, 0.15, 6.9], [219.5, 0.15, 7.17]], f, 1838, 1868), P = w.p, fa = w.moving ? w.facing : faceAt(30, s, f, P, BR.BULK);
  const haul = sm(f, 1880, 1898), crouch = sm(f, 1873, 1880) * (1 - 0.6 * haul);
  const o = flow(f, [[1838, { expr: "bored", facing: fa, tilt: 4 }], [1874, { expr: "strain", facing: fa, tilt: 10 }, 6], [1898, { expr: "stare", facing: fa, tilt: 2 }, 8]]);
  return { cast: [C(AGT, P, { ...o, ...w.o,
    ...(crouch > 0.01 ? { mode: "kneel", kneelK: crouch } : {}),
    armR: f >= 1874 ? armTo(30, s, f, P, [219.28, 0.85 + 0.45 * haul, 7.36], 1, fa, 1, crouch > 0.3 ? "kneel" : "stand", 10, 80) : AR.hipR, armRFront: true,
    armL: f >= 1874 ? armTo(30, s, f, P, [219.72, 0.85 + 0.45 * haul, 7.36], -1, fa, 1, crouch > 0.3 ? "kneel" : "stand", 10, 80) : AR.hipL, armLFront: true } as FigOpts)],
    subj: AGT, focus: HD(AGT, P), ctl: CTLB(f), fx: fxs(f >= 1884 ? glowBurst("spill", [219.7, 0.55, 7.95], 1.2 * sm(f, 1884, 1898), sm(f, 1884, 1898)) : null) };
};
lens(1838, 1.5);

// ================================================= S31 (1903-1986) dissolve: "...and finds his wife down there, baking.": over the agent's
// shoulder at the foot of his cellar steps: his wife among crocks and bottles, rolling pin up, beaming; on "baking" the whole
// shelf blows its caps in a chain and foam fountains over her; the agent's hat flies off.
const A31: V3 = [221.95, -2.5, 10.3], W31: V3 = [220.4, -2.5, 11.6];   // the agent's head off the lens-to-wife line
const c31 = cam3([222.25, -0.9, 8.9], [220.55, -1.35, 12.0], 56);
SHOT_CAMS[31] = () => [K(1903, F(() => c31, 1903, 0.0007, [[1944, 0.06, 8]]), 1, true)];   // punch in on the final hit
SHOT_ACTS[31] = (f, s) => {
  const fw = faceAt(31, s, f, W31, [221.45, -1.2, 9.6]);
  const w = flow(f, [[1903, { expr: "beam", facing: fw, armR: [[22, -26], [10, -58]] as A2, propR: "rollingPin", armL: AR.hipL }], [1948, { expr: "joy", facing: fw, armR: [[22, -26], [10, -58]] as A2, propR: "rollingPin", armL: ARMS.upL, tilt: -3, headBack: 0.4 }, 6]]);
  return { cast: [
    C(AGT, A31, { expr: f < 1946 ? "stare" : "aghast", back: true, facing: -0.3, hatLift: f >= 1948 ? Math.min(1, (f - 1948) / 10) : 0, armR: f >= 1948 ? ARMS.upR : AR.hipR, armL: f >= 1948 ? ARMS.upL : AR.hipL } as FigOpts),
    C(WIF, W31, w),
  ], subj: WIF, focus: HD(WIF, W31), ctl: CTLB(f) };
};
lens(1903, 2.5);
KICKS.push([1947 / 30, 0.1]);

// ---------------- carry-over (11r): when a shot starts with a camera move out of the previous one, everyone the previous shot had
// on screen stays in the world for that move (by name), at the previous shot's acting on its last frame.
const ORIG_ACTS: Record<number, (f: number, s: SetDef) => Act> = { ...SHOT_ACTS };
for (const sh of SHOT_LIST) {
  const prev = SHOT_LIST.find((q) => q.id === sh.id - 1), act = ORIG_ACTS[sh.id];
  if (!prev || !act || XF[sh.id] || prev.light !== sh.light) continue;
  const keys0 = SHOT_CAMS[sh.id]?.(null as unknown as SetDef); if (!keys0 || keys0[0].cut) continue;
  const prevAct = ORIG_ACTS[prev.id], win = Math.max(26, (keys0[0].dur ?? 24) + 4);
  if (!prevAct) continue;
  let held: CastPlace[] | null = null;
  SHOT_ACTS[sh.id] = (f, s) => {
    const a = act(f, s); if (f < sh.a || f >= sh.a + win) return a;
    if (!held) held = prevAct(prev.b - 1, s).cast;
    const have = new Set(a.cast.map((c) => c.who));
    return { ...a, cast: [...a.cast, ...held.filter((c) => !have.has(c.who)).map((c) => ({ ...c, idx: (c.idx ?? 0) + 200 }))] };
  };
}

// =====================================================================================================================
// ================================================= v34 KIT TEST SCENE (inputProps.testScene; story.ts TEST_SCENE) =================
// Written the v34 way: ONE act per scene (101+102 share sceneT1), the walk with planted feet (strideWalk, kit/templates/walk.ts),
// the dessert carried in two hands at reachable grips, the critic and the chef sitting ON their seats (sitLegFor + seatCard).
{
  const clampT = (x: number) => Math.min(1, Math.max(0, x)), ease = (x: number) => { const u = clampT(x); return u * u * (3 - 2 * u); };
  const strideWalk = (f: number, f0: number, from: V3, to: V3, perPhase: number, framesPerStep = 10) => {
    const dx = to[0] - from[0], dz = to[2] - from[2], dist = Math.hypot(dx, dz), steps = Math.max(1, Math.round((dist / perPhase) * 2)), P = steps / 2;
    const dur = steps * framesPerStep * 1.25, u = clampT((f - f0) / dur), ph = P * ease(u), k = ph / P;
    return { pos: [from[0] + dx * k, from[1], from[2] + dz * k] as V3, end: f0 + dur, moving: f >= f0 && u < 1, ph, stride: dist / P / 2 / 0.00216 };
  };
  const seatCard = (c: V3, half: number, cam: V3): V3 => { const dx = cam[0] - c[0], dz = cam[2] - c[2], L = Math.hypot(dx, dz) || 1; return [c[0] + (dx / L) * (half + 0.03), c[1], c[2] + (dz / L) * (half + 0.03)]; };
  const camA = cam3([-1.25, 1.55, 3.3], [-2.35, 1.05, 6.05], 50), camB = cam3([-2.1, 1.45, 2.7], [-3.68, 1.0, 5.35], 50), camC = cam3([-2.6, 1.35, 3.4], [-3.95, 0.95, 5.3], 50);   // found by a projection search: the critic and the dessert he stares at both in frame (9:16 is narrow: two people 1 m apart at 2 m do not fit)
  const camD = cam3([2.4, 1.25, 10.9], [-1.0, 0.8, 10.5], 46);   // 3.4 m away: at 1.6 m the seated chef's head filled 60-70% of the frame and its top was cut (G6)
  SHOT_CAMS[101] = () => [K(0, glideTo(still(camA), 8, still(camB), 104), 1, true), K(104, F(() => camB, 104, 0.0012), 1)];
  SHOT_CAMS[102] = () => [K(150, glideTo(F(() => camB, 104, 0.0012), 150, still(camC), 172), 1), K(172, F(() => camC, 172, 0.0012), 1)];   // starts from 101's camera INCLUDING its creep (from still(camB) it jumped 132 px: previz_guard G1)
  SHOT_CAMS[103] = () => [K(240, F(() => camD, 240, 0.0015), 1, true)];
  if (TEST_SCENE) { dof.length = 0; KICKS.length = 0; lens(0, DOF_WS, 0); lens(150, DOF_WS, 0); lens(240, DOF_MS, 0); }   // the main story's lens and kick keys are by frame: drop them in the test
  const P0: V3 = [-2.15, 0, 6.35], P1: V3 = [-3.12, 0, 5.32], SET: V3 = [-3.42, 0.765, 5.25];
  const CHAIR: V3 = [-4.18, 0, 5.2], CRIT_P = seatCard(CHAIR, 0.24, [-2.4, 1.4, 3.4]), CRIT_LEG = sitLegFor(CASTS_T.bsCritic, 0.454);
  const STOOL: V3 = [-1.0, 0, 10.5], CHEF_P = seatCard(STOOL, 0.24, camD.pos), CHEF_LEG = sitLegFor(CASTS_T.bsChefS, 0.44);
  const perW = strideM(CASTS_T.bsWaiter);
  const sceneT1 = (f: number, s: SetDef): Act => {
    const w0 = strideWalk(f, 12, P0, P1, perW, 10), t0 = w0.end + 6, kD = ease((f - t0) / 30);
    // setting it down he shifts his weight 14 cm toward the table (move the person, not the arm: the table point was 7 cm
    // beyond the arm's reach, previz_guard G10); 0.005 m per frame is a lean, not a skate (G3d limit 0.012)
    const toSet = Math.hypot(SET[0] - P1[0], SET[2] - P1[2]), lean = 0.2 * ease((f - t0) / 28);
    const PL: V3 = [P1[0] + (SET[0] - P1[0]) / toSet * lean, 0, P1[2] + (SET[2] - P1[2]) / toSet * lean];
    // then he walks back to the kitchen door (planted stride), out of the critic's shot (a half face at the frame edge: G6b)
    const fx = t0 + 44, wx = strideWalk(f, fx, [P1[0] + (SET[0] - P1[0]) / toSet * 0.2, 0, P1[2] + (SET[2] - P1[2]) / toSet * 0.2], [-2.3, 0, 6.7], perW, 10);
    const w = f < t0 ? w0 : f < fx ? { ...w0, pos: PL, moving: false } : { ...wx, pos: wx.pos }, Pw = w.pos;
    const id = f < 150 ? 101 : 102;
    // the dessert: carried in front of the waiter at chest height, then set down on the table over 30 frames, then left there
    // carried at waist height (at chest height the 0.45 m dome covered his face: previz_guard G5)
    const carry: V3 = [w0.pos[0], 0.88, w0.pos[2] - 0.1];
    const D: V3 = f < t0 ? carry : [carry[0] + (SET[0] - carry[0]) * kD, carry[1] + (SET[1] - carry[1]) * kD, carry[2] + (SET[2] - carry[2]) * kD];
    const holding = f < t0 + 34, fw = faceAt(id, s, f, Pw, f < w0.end ? [P1[0] - 1, 1, P1[2] - 0.6] : f < fx ? SET : [-2.3, 1, 6.7]);
    // the two grips sit on the dessert's sides ALONG THE CAMERA'S RIGHT AXIS (the card's plane), not along world x: off-axis
    // grips came out 7 cm short on a diagonal camera (previz_guard G10)
    const cw = camAt(id, s, f), yw = Math.atan2(cw.pos[0] - Pw[0], cw.pos[2] - Pw[2]), Rx = Math.cos(yw), Rz = -Math.sin(yw);
    const gR: V3 = [D[0] + 0.13 * Rx, D[1] + 0.02, D[2] + 0.13 * Rz], gL: V3 = [D[0] - 0.13 * Rx, D[1] + 0.02, D[2] - 0.13 * Rz];
    const armsW = holding ? { armR: armTo(id, s, f, Pw, gR, 1, fw), armL: armTo(id, s, f, Pw, gL, -1, fw), armRFront: true, armLFront: true }
      : { armR: lerpA2(AR.carryR, AR.hipR, ease((f - t0 - 34) / 10)), armL: AR.hipL };
    const fc = faceAt(id, s, f, CRIT_P, f < 120 ? [-2.6, 1.2, 6.4] : D);
    // (the subject changes as the glide reaches the critic at 160, not on the shot change at 150: G6)
    return { cast: [
      C("bsWaiter", Pw, { expr: f < t0 + 30 ? "nervous" : "smile_closed", facing: fw, ...(w.moving ? { mode: "stride", phase: w.ph, stride: w.stride } : {}), ...armsW }),
      C("bsCritic", CRIT_P, { ...flow(f, [[0, { expr: "bored", mode: "sit", facing: fc }], [128, { expr: "stare", mode: "sit", facing: fc }, 6], [200, { expr: "smug", mode: "sit", facing: fc }, 8]]), sitLeg: CRIT_LEG,
        armR: armTo(id, s, f, CRIT_P, [CRIT_P[0] + 0.28, 0.86, CRIT_P[2] - 0.05], 1, fc, 1, "sit"), armRFront: true, propR: "spoon" }),
    ], ctl: { alFon: 1, alFx: D[0], alFy: D[1], alFz: D[2], alFbake: 0.9, alFry: 0.6 } as Ctl, subj: f < fx ? "bsWaiter" : "bsCritic", focus: f < 150 ? [Pw[0], 1.4, Pw[2]] : [CRIT_P[0], 0.95, CRIT_P[2]] };
  };
  SHOT_ACTS[101] = sceneT1; SHOT_ACTS[102] = sceneT1;
  SHOT_ACTS[103] = (f, s) => {
    const fc = faceAt(103, s, f, CHEF_P, [0.6, 1, 10.5]);
    return { cast: [C("bsChefS", CHEF_P, { ...flow(f, [[240, { expr: "calm", mode: "sit", facing: fc }], [290, { expr: "smile_closed", mode: "sit", facing: fc }, 8]]), sitLeg: CHEF_LEG,
      armR: [[22, 10], [40, -20]] as A2, armRFront: true, propR: "mug" })], ctl: {} as Ctl, subj: "bsChefS", focus: [CHEF_P[0], 0.95, CHEF_P[2]] };
  };
}
// ================================================= v34.1 SIT / HOLD TEST (inputProps.carTest; story.ts CAR_TEST) ==================
// Rick's three ways to show a driver (board CB1) in a car with a real cabin (sets/cabincar.ts), a passing car with its driver,
// and people sitting on a bench, a plastic chair and a picnic table. Every seat height comes from the measured seat top
// (sitLegFor), every hand from armTo (re-aimed from the real shoulder in C()), the driver's size from the cabin's headroom.
if (CAR_TEST) {
  dof.length = 0; KICKS.length = 0; lens(0, DOF_WS, 0);
  const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const rotY = (p: V3, yaw: number): V3 => [p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw), p[1], -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw)];
  /** the card scale that keeps the head 4 cm under the roof, and the sitLeg that puts the bottom on the seat at that scale */
  const fitSeat = (L: Look, seatAboveFeet: number, headroom: number) => {
    const h0 = headOf(L, { mode: "sit", sitLeg: 0, facing: 0.8 } as FigOpts), c0 = seatHeight(L, { mode: "sit", sitLeg: 0 } as FigOpts);
    const sc = Math.min(1, headroom / (h0.y - c0 + 0.47 * h0.w));
    return { sc, sitLeg: sitLegFor(L, seatAboveFeet / sc) };
  };
  /** the grip further to screen right goes to the right hand (arm offsets are screen space) */
  const byScreen = (id: number, s: SetDef, f: number, P: V3, a: V3, b: V3): [V3, V3] => {
    const c = camAt(id, s, f), yaw = Math.atan2(c.pos[0] - P[0], c.pos[2] - P[2]), lat = (T: V3) => (T[0] - P[0]) * Math.cos(yaw) - (T[2] - P[2]) * Math.sin(yaw);
    return lat(a) >= lat(b) ? [a, b] : [b, a];
  };
  const seatBox = (name: string, c: V3, hx: number, hz: number) => ({ name, top: c[1], min: [c[0] - hx, c[2] - hz], max: [c[0] + hx, c[2] + hz] });
  const camC1 = cam3([3.9, 1.3, -0.05], [1.7, 1.12, -0.1], 40), camC2 = cam3([1.76, 1.35, 3.0], [1.72, 1.08, -0.15], 34), camC3 = cam3([-0.25, 1.15, -0.25], [1.7, 0.85, -0.25], 60)   // r3 CUTAWAY: the passenger door and seat are hidden (ctl.cut) and the camera stands where they were: a profile of the driver on his seat, hands on the wheel, foot on the pedal (inside a 1.7 m cabin a big-headed card is always too close: G4/G6)   // inside the cabin: our heads are ~0.46 m wide, so a 78 deg lens at 1.1 m (64 deg sliced the head: G6);
  const camC4 = cam3([3.0, 1.4, 3.0], [-2.0, 1.0, 20.0], 50), camC5 = cam3([2.4, 1.15, 3.4], [5.0, 0.95, 3.4], 46), camC6 = cam3([4.9, 1.15, 10.0], [5.0, 0.85, 7.2], 46), camC7 = cam3([3.6, 1.35, 11.4], [6.3, 0.95, 11.4], 46);
  ([[201, camC1, 0], [202, camC2, 60], [203, camC3, 120], [204, camC4, 180], [205, camC5, 240], [206, camC6, 300], [207, camC7, 330]] as [number, Cam, number][])
    .forEach(([id, cm, a]) => { SHOT_CAMS[id] = () => [K(a, F(() => cm, a, id === 203 ? 0.0002 : 0.0005), 1, true)]; });   // 203: a wide lens close to a big head; the creep grew it past the edge (G6)
  // ---- the driver (one position for the three views: over the seat, a little toward the door and the wheel) ----
  const DRV = CASTS_T.bsWaiter, CAR = CT.CAR, fitD = fitSeat(DRV, CABIN.SEAT[1] - CABIN.FLOOR, CABIN.ROOF_IN - 0.04 - CABIN.SEAT[1]);
  // the card goes over the seat on the CAMERA'S side (seatCard): from beside or in front, a card through the seat's middle
  // is cut by the cushion's near half (r2 inside view: he looked like he stood behind his seat). The mark changes only at
  // a cut; through the windshield the dash hides the seat, so a small shift keeps the wheel in front of the chest.
  const seatW = add3(CAR, CABIN.SEAT), shiftFor: Record<number, number> = { 201: 0.05, 202: 0.12, 203: 0.27 };   // through the side window the door hides the seat: no shift needed
  const markFor = (id: number, cm: Cam): V3 => { const dx = cm.pos[0] - seatW[0], dz = cm.pos[2] - seatW[2], L = Math.hypot(dx, dz) || 1, k = shiftFor[id]; return [seatW[0] + dx / L * k, CAR[1] + CABIN.FLOOR, seatW[2] + dz / L * k]; };
  const driverAct = (f: number, s: SetDef): Act => {
    const id = f < 60 ? 201 : f < 120 ? 202 : 203, PD = markFor(id, id === 201 ? camC1 : id === 202 ? camC2 : camC3), fd = faceAt(id, s, f, PD, [PD[0], 1.0, PD[2] + 3]);
    const [g0, g1] = cabinGrips(0).map((g) => add3(CAR, g)) as [V3, V3], [gR, gL] = byScreen(id, s, f, PD, g0, g1);
    const o = { expr: f % 60 < 34 ? "neutral" : "smug", mode: "sit", facing: fd, sitLeg: fitD.sitLeg, armRFront: true, armLFront: true,
      armR: armTo(id, s, f, PD, gR, 1, fd, fitD.sc, "sit"), armL: armTo(id, s, f, PD, gL, -1, fd, fitD.sc, "sit"),
      sitFoot: [(CAR[2] + CABIN.PEDAL[2] - PD[2]) / fitD.sc, (CABIN.PEDAL[1] - CABIN.FLOOR) / fitD.sc] } as FigOpts;
    return { cast: [C("bsWaiter", PD, o, { scale: fitD.sc })], ctl: { idle: 0.15, cut: id === 203 ? 1 : 0 } as Ctl, subj: "bsWaiter", focus: [PD[0], 1.2, PD[2]],
      qa: { tags: [{ name: "blue car", pos: [CAR[0], 0.8, CAR[2]], size: 4.1, vehicle: true }], seats: [seatBox("driver seat", seatW, 0.25, 0.25)] } } as Act;
  };
  SHOT_ACTS[201] = driverAct; SHOT_ACTS[202] = driverAct; SHOT_ACTS[203] = driverAct;
  // ---- a car drives past with its driver (the card rides the car: one function of the frame for both) ----
  const L2 = CASTS_T.bsCritic, fit2 = fitSeat(L2, CABIN.SEAT[1] - CABIN.FLOOR, CABIN.ROOF_IN - 0.04 - CABIN.SEAT[1]);
  SHOT_ACTS[204] = (f, s) => {
    const c = { traffic: Math.max(0, f - 180) * 0.14 } as Ctl, carP: V3 = [CT.CAR2_X, 0, ctTrafficZ(c)], yaw = Math.PI;
    const seat2 = add3(carP, rotY(CABIN.SEAT, yaw)), cw = camAt(204, s, f), rl = Math.hypot(cw.pos[0] - seat2[0], cw.pos[2] - seat2[2]) || 1;
    const P: V3 = [seat2[0] + (cw.pos[0] - seat2[0]) / rl * 0.1, CABIN.FLOOR, seat2[2] + (cw.pos[2] - seat2[2]) / rl * 0.1], fd = faceAt(204, s, f, P, [P[0], 1, P[2] - 3]);   // 0.1 m toward the camera: the grips sat 0.30 m off the card's plane (G10)
    const [g0, g1] = cabinGrips(0).map((g) => add3(carP, rotY(g, yaw))) as [V3, V3], [gR, gL] = byScreen(204, s, f, P, g0, g1);
    return { cast: [C("bsCritic", P, { expr: "bored", mode: "sit", facing: fd, sitLeg: fit2.sitLeg, armRFront: true, armLFront: true,
      armR: armTo(204, s, f, P, gR, 1, fd, fit2.sc, "sit"), armL: armTo(204, s, f, P, gL, -1, fd, fit2.sc, "sit") } as FigOpts, { scale: fit2.sc })],
      ctl: c, subj: null, focus: [P[0], 1.1, P[2]],   // the subject is the car going past (a place shot): the driver drives in from the edge
      qa: { tags: [{ name: "red car", pos: [carP[0], 0.8, carP[2]], size: 4.1, vehicle: true }], seats: [seatBox("red car seat", seat2, 0.25, 0.25)] } } as Act;
  };
  // ---- the bench, front view: bottom on the seat, hands resting on its front edge (a resting hand may reach 80 u) ----
  SHOT_ACTS[205] = (f, s) => {
    const L = CASTS_T.bsChefS, top: V3 = [CT.BENCH[0], CT.BENCH[1] + CT.BENCH_TOP, CT.BENCH[2]], P: V3 = [CT.BENCH[0] - 0.2, CT.BENCH[1], CT.BENCH[2]];
    const fc = faceAt(205, s, f, P, [P[0] - 3, 1, P[2]]), edgeX = CT.BENCH[0] - 0.22;
    const [gR, gL] = byScreen(205, s, f, P, [edgeX, top[1] + 0.01, P[2] + 0.26], [edgeX, top[1] + 0.01, P[2] - 0.26]);
    return { cast: [C("bsChefS", P, { expr: "calm", mode: "sit", facing: fc, sitLeg: sitLegFor(L, CT.BENCH_TOP), armRFront: true, armLFront: true,
      armR: armTo(205, s, f, P, gR, 1, fc, 1, "sit", 10, 80), armL: armTo(205, s, f, P, gL, -1, fc, 1, "sit", 10, 80) } as FigOpts)],
      ctl: {} as Ctl, subj: "bsChefS", focus: [P[0], 1.2, P[2]], qa: { seats: [seatBox("bench", top, 0.25, 0.58)] } } as Act;
  };
  // ---- the plastic chair in profile: on its camera side, an arm on the near armrest, the other hand on the knee ----
  SHOT_ACTS[206] = (f, s) => {
    const L = CASTS_T.bsKid, top: V3 = [CT.CHAIR[0], CT.CHAIR[1] + CT.CHAIR_TOP, CT.CHAIR[2]], P: V3 = [CT.CHAIR[0], CT.CHAIR[1], CT.CHAIR[2] + 0.23];
    const fc = faceAt(206, s, f, P, [P[0] - 3, 1, P[2]]);
    return { cast: [C("bsKid", P, { expr: "smile_closed", mode: "sit", facing: fc, sitLeg: sitLegFor(L, CT.CHAIR_TOP), armRFront: true, armLFront: true,
      armL: armTo(206, s, f, P, [CT.CHAIR[0] - 0.08, CT.CHAIR[1] + 0.63, CT.CHAIR[2] + 0.3], -1, fc, 1, "sit", 10, 80),
      armR: armTo(206, s, f, P, [CT.CHAIR[0] - 0.18, top[1] + 0.14, P[2]], 1, fc, 1, "sit", 10, 80) } as FigOpts)],   // the hand on the thigh, not the knee: a kid's arm is short
      ctl: {} as Ctl, subj: "bsKid", focus: [P[0], 1.0, P[2]], qa: { seats: [seatBox("plastic chair", top, 0.25, 0.25)] } } as Act;
  };
  // ---- the picnic table: on the far bench facing us, both hands on the table top ----
  SHOT_ACTS[207] = (f, s) => {
    const L = CASTS_T.bsCritic, bx = CT.TABLE[0] + CT.TABLE_BENCH_X, top: V3 = [bx, CT.TABLE[1] + CT.TABLE_BENCH, CT.TABLE[2]], P: V3 = [CT.TABLE[0] + 0.55, CT.TABLE[1], CT.TABLE[2]];   // r2: the card plane just inside the table's edge, so the hands land ON the top and the top hides the legs (0.2 m behind the edge the hands hid behind it)
    const fc = faceAt(207, s, f, P, [P[0] - 3, 1, P[2]]), ty = CT.TABLE[1] + CT.TABLE_TOP + 0.03, tx = CT.TABLE[0] + 0.48;
    const [gR, gL] = byScreen(207, s, f, P, [tx, ty, P[2] + 0.18], [tx, ty, P[2] - 0.18]);
    return { cast: [C("bsCritic", P, { expr: "smug", mode: "sit", facing: fc, sitLeg: sitLegFor(L, CT.TABLE_BENCH), armRFront: true, armLFront: true,
      armR: armTo(207, s, f, P, gR, 1, fc, 1, "sit"), armL: armTo(207, s, f, P, gL, -1, fc, 1, "sit") } as FigOpts)],
      ctl: {} as Ctl, subj: "bsCritic", focus: [P[0], 1.0, P[2]], qa: { seats: [seatBox("picnic bench", top, 0.17, 1.45)] } } as Act;
  };
}
// LIFE LAYER (user rule 2026-11-06, "make sure all of the objects/characters are in motion"; boards X and AD). On top of
// the scripted acting, every character on screen does a small purposeful move at irregular 0.7-1.3 s intervals: a glance
// (eyes + a 2 deg head turn), a 3-5 deg head tilt, a 1.5-2.5 deg weight shift, or a settle back to neutral. Each move is
// eased over 10 frames (smootherstep) and then held: no loops, no bobbing, no sway. A micro-move is skipped when the
// character is busy with a scripted change around it (gesture, expression, facing, prop, walk), so scripted acting reads
// clean. Seeded per character (who#idx): two people never twitch in sync, and every render is identical.
const LIFE_SKIP = /^(dog|pigeon|cat|rousse|neige|hen)/;   // animals keep their own loops
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
// ---------------- v34 CONTINUITY ARCHITECTURE (retrofit, 2026-11-27): SCENES OWN THE PEOPLE, SHOTS OWN THE CAMERA ----------------
// A scene = consecutive shots in one place and light. Every shot of a scene reads ONE act: the scene's, at the global frame
// (the shot whose range holds f supplies the raw acting), with STABLE keys (who#0, or #1.. only for real duplicates in one
// cast) and ONE life-layer schedule seeded by scene + who. Before this, each shot had its own idx (the kid #2 -> #1 at 815:
// the guard saw him vanish and pop) and the life layer judged "busy" with the shot's own act, so micro-moves re-seeded at
// every shot change (the critic's eyes snapped 0.65 at 1040; his body 4.8 deg at 1170). The schedule itself is seeded by who
// only, so micro-moves also continue through a move / ride / through change between scenes (same people, same time).
type SceneDef = { id: string; shots: number[]; a: number; b: number };
const SCENES: SceneDef[] = [];
for (const sh of SHOT_LIST) {
  const last = SCENES[SCENES.length - 1], prev = last && SHOT_LIST.find((x) => x.id === last.shots[last.shots.length - 1]);
  if (last && prev && prev.set === sh.set && prev.light === sh.light && prev.b === sh.a && !XF[sh.id]) { last.shots.push(sh.id); last.b = sh.b; }   // p14: a dissolve is a new time = a new scene (the seam ease slid the grocery queue across the S11 -> S12 dissolve)
  else SCENES.push({ id: "sc" + sh.id, shots: [sh.id], a: sh.a, b: sh.b });
}
const SCENE_OF: Record<number, SceneDef> = {};
for (const sc of SCENES) for (const id of sc.shots) SCENE_OF[id] = sc;
/** the shot of a scene that supplies the raw acting at global frame f (clamped to the scene's first/last shot) */
const shotAtScene = (sc: SceneDef, f: number) => {
  for (const id of sc.shots) { const d = SHOT_LIST.find((x) => x.id === id)!; if (f < d.b) return id; }
  return sc.shots[sc.shots.length - 1];
};
/** stable keys: one per who, numbered only when the same who appears more than once in a cast */
const stableKeys = (a: Act): Act => {
  const n: Record<string, number> = {};
  return { ...a, cast: a.cast.map((c) => { const i = n[c.who] ?? 0; n[c.who] = i + 1; return { ...c, idx: i }; }) };
};
/** SEAM EASE (safety net): inside a scene, the first SEAM_EASE frames of a shot blend every NUMBER of each person's acting
 *  (position, tilt, head tilt, look, arm angles) from the previous shot's code to this shot's, so two shots' hand-written
 *  values never snap (Alaska 700 / 815 / 1040 / 1170: body tilt jumped 2-3 deg at the shot change). Words (expr, mode, props)
 *  switch at once; faces already glide inside the rig. A NEW scene starts clean (cut / dissolve). */
const SEAM_EASE = 8;
const mixNum = (a: unknown, b: unknown, k: number): unknown => {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * k;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return b.map((v, i) => mixNum(a[i], v, k));
  return b;
};
const blendAct = (A: Act, B: Act, k: number): Act => ({ ...B, cast: B.cast.map((c) => {
  const p = A.cast.find((q) => q.who === c.who && (q.idx ?? 0) === (c.idx ?? 0)); if (!p) return c;
  const po = (p.o ?? {}) as Record<string, unknown>, co = (c.o ?? {}) as Record<string, unknown>, o: Record<string, unknown> = { ...co };
  for (const key of Object.keys(co)) if (key in po) o[key] = mixNum(po[key], co[key], k);
  for (const key of ["tilt", "headTilt", "look"]) if (key in po || key in co) o[key] = mixNum(po[key] ?? 0, co[key] ?? 0, k);   // unset = 0
  return { ...c, pos: mixNum(p.pos, c.pos, k) as V3, o: o as FigOpts };
}) });
const ACT_MEMO = new Map<string, Act>();
const LIFE_RAW: Record<number, (f: number, s: SetDef) => Act> = {};
for (const id of Object.keys(SHOT_ACTS).map(Number)) LIFE_RAW[id] = SHOT_ACTS[id];
/** the scene's raw act (no life layer) at global frame f */
const rawScene = (sc: SceneDef, f: number, s: SetDef): Act => {
  const k = sc.id + ":" + f; let a = ACT_MEMO.get(k);
  if (!a) {
    const id = shotAtScene(sc, f), i = sc.shots.indexOf(id), d = SHOT_LIST.find((x) => x.id === id)!;
    a = stableKeys(LIFE_RAW[id](f, s));
    if (i > 0 && f >= d.a && f < d.a + SEAM_EASE) a = blendAct(stableKeys(LIFE_RAW[sc.shots[i - 1]](f, s)), a, smooth(clamp01((f - d.a) / SEAM_EASE)));
    ACT_MEMO.set(k, a); if (ACT_MEMO.size > 4000) ACT_MEMO.clear();
  }
  return a;
};
const castKey = (c: CastPlace) => c.who + "#" + (c.idx ?? 0);
/** is this character in the middle of a scripted change (or walking / absent) around frame t? (judged on the SCENE's act) */
/** the act ON SCREEN at global frame t (the scene of the shot that holds t): life beats are judged on it, so a person's
 *  micro-moves are a function of (who, frame) only and continue through every move / ride / through change */
const rawShown = (t: number, s: SetDef) => {
  const d = SHOT_LIST.find((x) => t < x.b) ?? SHOT_LIST[SHOT_LIST.length - 1];
  return rawScene(SCENE_OF[d.id] ?? { id: "sc" + d.id, shots: [d.id], a: d.a, b: d.b }, Math.max(0, t), s);
};
const lifeBusy = (_sc: SceneDef, s: SetDef, key: string, t: number) => {
  const A = rawShown(t - 6, s).cast.find((c) => castKey(c) === key), B = rawShown(t + 12, s).cast.find((c) => castKey(c) === key);
  if (!A || !B) return true;
  const a = (A.o ?? {}) as FigOpts & Record<string, unknown>, b = (B.o ?? {}) as FigOpts & Record<string, unknown>;
  if (a.mode === "walk" || b.mode === "walk" || a.mode === "run" || b.mode === "run") return true;
  if (a.expr !== b.expr || (a.facing ?? 1) !== (b.facing ?? 1) || a.propR !== b.propR || a.mode !== b.mode) return true;
  if (JSON.stringify(a.armR ?? null) !== JSON.stringify(b.armR ?? null) || JSON.stringify(a.armL ?? null) !== JSON.stringify(b.armL ?? null)) return true;
  if (Math.abs((a.tilt ?? 0) - (b.tilt ?? 0)) > 1.2 || Math.abs((a.headTilt ?? 0) - (b.headTilt ?? 0)) > 1.5 || Math.abs((a.look ?? 0) - (b.look ?? 0)) > 0.15) return true;
  if (Math.hypot(A.pos[0] - B.pos[0], A.pos[2] - B.pos[2]) > 0.05) return true;
  return false;
};
const lifeAt = (sc: SceneDef, s: SetDef, key: string, f: number): LifeOff => {
  const sched = schedFor(key);   // seeded by WHO only (global time): a scene-seeded schedule snapped everyone at the street -> dining "move" (268)
  let n = -1; for (let i = 0; i < sched.t.length && sched.t[i] <= f; i++) n = i;
  // the last two micro-moves that were not skipped
  const eff: number[] = [];
  for (let i = n; i >= 0 && eff.length < 2 && f - sched.t[i] < 600; i--) if (!lifeBusy(sc, s, key, sched.t[i])) eff.push(i);
  if (!eff.length) return LIFE0;
  const cur = sched.o[eff[0]], prev = eff.length > 1 ? sched.o[eff[1]] : LIFE0, k = glide((f - sched.t[eff[0]]) / 10);
  // AGE FADE: a character busy for a long stretch (no free beat) glides back to neutral after ~7 s instead of snapping
  // to 0 when the last beat leaves a hard 240-frame window (the kid's head snapped 7 deg at 57.7 s)
  const ageK = 1 - smooth(clamp01((f - sched.t[eff[0]] - 200) / 40));
  return { look: lerp(prev.look, cur.look, k) * ageK, headTilt: lerp(prev.headTilt, cur.headTilt, k) * ageK, tilt: lerp(prev.tilt, cur.tilt, k) * ageK };
};
for (const id of Object.keys(SHOT_ACTS).map(Number)) {
  const sc = SCENE_OF[id] ?? { id: "sc" + id, shots: [id], a: 0, b: 1e9 };
  SHOT_ACTS[id] = (f: number, s: SetDef): Act => {
    const a = rawScene(sc, f, s);
    return { ...a, cast: a.cast.map((c) => {
      const o0 = (c.o ?? {}) as FigOpts;
      if (LIFE_SKIP.test(c.who) || c.air) return c;
      // SNAP FILTER: body tilt, head tilt and eye look pass a 5-frame triangle filter of the raw acting, so a value that
      // jumps in one frame (the waiter's 14.6 deg lean at 340, a head snapping back to 0) becomes a 4-frame move
      const key = castKey(c), win = [-2, -1, 0, 1, 2], wt = [1, 2, 3, 2, 1];
      const nb = win.map((d) => (d === 0 ? c : rawScene(sc, f + d, s).cast.find((q) => castKey(q) === key)));
      const filt = (k: "tilt" | "headTilt" | "look") => { let sum = 0, n = 0; nb.forEach((q, i) => { if (q) { sum += wt[i] * (((q.o ?? {}) as FigOpts)[k] ?? 0); n += wt[i]; } }); return n ? sum / n : (o0[k] ?? 0); };
      const o = { ...o0, tilt: filt("tilt"), headTilt: filt("headTilt"), look: filt("look") } as FigOpts;
      // WALK FADE: the life offsets and breathing fade out over the frames around a walk instead of vanishing in one frame
      // (they used to drop to 0 on the walk's first frame and jump back on its last: Diner3 at 188, the waiter at 312)
      let wk = 0; for (let d = -6; d <= 6; d++) { const q = d === 0 ? c : rawScene(sc, f + d, s).cast.find((x) => castKey(x) === key); const m = ((q?.o ?? {}) as FigOpts).mode; if (m === "walk" || m === "run") wk++; }
      const lifeK = 1 - smooth(wk / 13);
      if (lifeK <= 0.001) return { ...c, o };
      const L0 = lifeAt(sc, s, key, f), L = { look: L0.look * lifeK, headTilt: L0.headTilt * lifeK, tilt: L0.tilt * lifeK };
      // v20 (board BA: nobody is ever frozen): breathing (a slow 0.8 deg sway + head bob) and a small arm drift on every
      // frame, seeded per character so no two breathe in sync (global frame: continuous across shots)
      const sd = (lifeHash(castKey(c)) % 1000) / 159.2, br = Math.sin((2 * Math.PI * f) / 62 + sd), br2 = Math.sin((2 * Math.PI * f) / 83 + sd * 1.7);
      const drift = (a: unknown, side: number): A2 => { const A = (Array.isArray(a) ? a : side > 0 ? [[30, 40], [31, 86]] : [[-26, 42], [-15, 82]]) as number[][];   /* shoes video (CP3 review): relaxed, asymmetric hanging arms */ return [[A[0][0] + 2.4 * side * br2, A[0][1] + 2.0 * br], [A[1][0] + 4.0 * side * br2, A[1][1] + 3.6 * br]]; };
      const busyArms = o.mode === "sit" && false;
      if (o.mode === "walk" || o.mode === "run") return { ...c, o: { ...o, look: Math.max(-1, Math.min(1, (o.look ?? 0) + L.look)), headTilt: (o.headTilt ?? 0) + L.headTilt + 2.2 * br2 * lifeK, tilt: (o.tilt ?? 0) + L.tilt + 1.5 * br * lifeK } };
      return { ...c, o: { ...o, look: Math.max(-1, Math.min(1, (o.look ?? 0) + L.look)), headTilt: (o.headTilt ?? 0) + L.headTilt + 2.2 * br2 * lifeK, tilt: (o.tilt ?? 0) + L.tilt + 1.5 * br * lifeK,
        ...(busyArms ? {} : { armR: drift(o.armR, 1), armL: drift(o.armL, -1) }) } };
    }) };
  };
}
// (the old 5 -> 6 chef patch is gone: the kitchen scene's single act already carries him across the change)
DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
