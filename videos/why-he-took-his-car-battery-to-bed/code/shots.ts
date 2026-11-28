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
import { CP } from "./sets/camp";

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

// ================================================= p15 BLOCK START
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
// ================================================= p15 BLOCK END

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
  if (last && prev && prev.set === sh.set && prev.light === sh.light && prev.b === sh.a && !XF[sh.id] && !NEW_SCENE.has(sh.id)) { last.shots.push(sh.id); last.b = sh.b; }   // p14: a dissolve is a new time = a new scene (the seam ease slid the grocery queue across the S11 -> S12 dissolve)
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
