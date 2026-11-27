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

// ================================================= THE STORY STATE (one function of the frame) =================================================
const PY = 1.03;                                   // the peel blade on the oven floor
const BENCH_B: V3 = [1.55, 0.925, 7.92], MOUTH_B: V3 = [0.05, PY, 9.2], IN_B: V3 = [0.05, PY, 8.15], OUT_B: V3 = [0.05, PY, 9.4];
const UP_B: V3 = [0.05, 2.05, 10.0];               // the peel held upright like a staff (blade high), 592-860
const HK0: V3 = [0.05, PY, 9.25], HK1: V3 = [0.05, PY, 8.8], HOOK_D = 0.9;   // the hook: the handle swung 52 deg toward +x (the kid clear of the oven mouth)
/** the peel: blade centre, tilt (rz: -pi/2 = upright, blade high) and the handle's swing off +z (d) */
const peelAt = (f: number): { b: V3; rz: number; d: number } => {
  if (f < 60) return { b: lerp3(HK0, HK1, sm(f, 6, 54)), rz: 0, d: HOOK_D };
  if (f < 508) return { b: BENCH_B, rz: 0, d: 0 };
  if (f < 521) return { b: lerp3(BENCH_B, MOUTH_B, sm(f, 508, 521)), rz: 0, d: 0 };
  if (f < 552) return { b: lerp3(MOUTH_B, IN_B, sm(f, 521, 550)), rz: 0, d: 0 };
  if (f < 570) return { b: lerp3(IN_B, MOUTH_B, sm(f, 552, 570)), rz: 0, d: 0 };
  if (f < 592) return { b: lerp3(MOUTH_B, UP_B, sm(f, 570, 592)), rz: -Math.PI / 2 * sm(f, 570, 592), d: 0 };
  if (f < 860) return { b: UP_B, rz: -Math.PI / 2, d: 0 };
  if (f < 875) return { b: lerp3(UP_B, MOUTH_B, sm(f, 860, 875)), rz: -Math.PI / 2 * (1 - sm(f, 860, 875)), d: 0 };
  if (f < 884) return { b: lerp3(MOUTH_B, IN_B, sm(f, 875, 884)), rz: 0, d: 0 };
  if (f < 898) return { b: lerp3(IN_B, OUT_B, sm(f, 884, 898)), rz: 0, d: 0 };
  return { b: OUT_B, rz: 0, d: 0 };
};
/** the two grips on the handle (front, rear) */
const grips = (f: number): [V3, V3] => {
  const { b, rz, d } = peelAt(f), up = -rz / (Math.PI / 2), dx = Math.sin(d), dz = Math.cos(d);
  const at = (q: number): V3 => [b[0] + (1 - up) * dx * q, b[1] + 0.012 - up * q, b[2] + (1 - up) * dz * q];
  return [at(1.0), at(1.45)];
};
/** where the kid stands while he works the peel: beside its rear grip, on the east side */
const kidAtPeel = (f: number): V3 => {
  const { d } = peelAt(f), [, r] = grips(f);
  if (d > 0) return [r[0] + 0.12 * Math.sin(d), 0, r[2] + 0.12 * Math.cos(d)];
  return [r[0] + 0.38, 0, r[2] + 0.05];
};
// the kid in shot 9: walks round the handle to the blade (898-912), lifts the plate (912-918), holds it up (918-946), heads for the door
const K9: V3[] = [[0.43, 0, 10.9], [0.95, 0, 10.2], [0.62, 0, 9.55]];
const K9_OUT: V3[] = [[0.62, 0, 9.55], [-0.4, 0, 9.0], [-1.25, 0, 8.4], [-2.1, 0, 7.5]];
const kid9 = (f: number): V3 => (f < 898 ? kidAtPeel(f) : f < 912 ? pathAt(K9, f, 898, 912) : f < 946 ? K9[2] : pathAt(K9_OUT, f, 946, 972));
const plate9 = (f: number): V3 => {
  const onPeel: V3 = [OUT_B[0], OUT_B[1] + 0.024, OUT_B[2]];
  const K = kid9(f), held: V3 = [K[0] - 0.42, 1.12, K[2] - 0.08], up: V3 = [K[0] - 0.4, 1.3, K[2] - 0.08];
  if (f < 912) return onPeel;
  if (f < 918) return lerp3(onPeel, held, sm(f, 912, 918));
  if (f < 946) return lerp3(held, up, sm(f, 918, 926) * (1 - 0.3 * sm(f, 938, 946)));
  const dir = pathDir(K9_OUT, f, 946, 972); return [K[0] + dir[0] * 0.38, 1.18, K[2] + dir[2] * 0.38];
};
// the dining room
const KID_T = BS.KID_T, ALT = BS.ALT, ALK_ASIDE: V3 = [-3.5, 0.765, 5.6];
const KT_HAND: V3 = [KID_T[0] - 0.4, 1.0, KID_T[2] - 0.05];
const KID_BACK: V3 = [-2.75, 0, 5.8];
/** the kid at the table: serves from KID_T (960-990), steps back to watch (990-1010) */
const kidT = (f: number): V3 => (f < 990 ? KID_T : lerp3(KID_T, KID_BACK, sm(f, 990, 1010)));
const MENU_P: V3 = [BS.MENU[0], BS.MENU[1], BS.MENU[2]];
// the waiter takes the order at the table and goes to lean in the kitchen doorway (312-340), then back (386-420)
const WALK_ORDER: V3[] = [[-3.05, 0, 5.55], [-2.9, 0, 6.2], [-2.55, 0, 6.7]];
const waiterAt = (f: number): V3 => (f < 312 ? WALK_ORDER[0] : f < 340 ? pathAt(WALK_ORDER, f, 312, 340) : f < 386 ? WALK_ORDER[2] : pathAt([[-2.55, 0, 6.7], [-1.6, 0, 6.2], [-0.6, 0, 5.4]], f, 386, 420));
// the dishwasher: from the dish pit, carrying the bucket along the oven front (630-672), sets it down (672-688), steps back
const DISH0: V3 = [3.45, 0, 8.92], DISH1: V3 = [0.45, 0, 9.02];
const dishAt = (f: number): V3 => (f < 630 ? DISH0 : f < 688 ? lerp3(DISH0, DISH1, 0.92 * sm(f, 630, 672) + 0.08 * sm(f, 672, 688)) : f < 730 ? pathAt([DISH1, [1.4, 0, 9.5], BS.DISH_SPOT], f, 694, 730) : BS.DISH_SPOT);
// the chef: inside the swing door (365-455), walks over to watch the kid (455-490)
const chefAt = (f: number): V3 => (f < 455 ? BS.CHEF_READ : f < 490 ? pathAt([BS.CHEF_READ, [-2.1, 0, 9.35], BS.CH_W], f, 455, 490) : BS.CH_W);
// the second dessert (the finale): the kid brings it out of the kitchen door (1640) to the critic (1712)
const WALK_K16: V3[] = [[-2.15, 0, 6.6], [-2.35, 0, 6.05], [-2.75, 0, 5.6], KID_T];
const kid16 = (f: number): V3 => (f < 1640 ? WALK_K16[0] : f > 1712 ? KID_T : pathAt(WALK_K16, f, 1640, 1712));
const PAN_POUR: V3 = [-3.5, 1.36, 5.1];

const CTL = (f: number): Ctl => {
  const c: Ctl = { oven: 1, dial: 500, snowK: 1, melt: sm(f, 431, 900) };
  c.bucket = f < 630 ? 0 : f > 688 ? 1 : 0.92 * sm(f, 630, 672) + 0.08 * sm(f, 672, 688);
  c.bucketY = f > 630 && f < 686 ? 0.16 * sm(f, 630, 640) * (1 - sm(f, 672, 686)) : 0;
  // the swing door (<0 into the kitchen, >0 into the dining room): the waiter leans in (334-394), the kid goes out (962-994), the kid again (1632-1666)
  c.door = -sm(f, 334, 344) * (1 - sm(f, 440, 470)) + sm(f, 962, 970) * (1 - sm(f, 980, 994)) + sm(f, 1632, 1640) * (1 - sm(f, 1652, 1666));
  // the first dessert: heaped on the peel at the bench, into the oven, out, carried, served, cracked, eaten
  const p = peelAt(f);
  c.peelOn = f < 60 || f >= 431 ? 1 : 0; c.peelX = p.b[0]; c.peelY = p.b[1]; c.peelZ = p.b[2]; c.peelRy = -Math.PI / 2 + p.d; c.peelRz = p.rz;
  const onPeel: V3 = [p.b[0], p.b[1] + 0.024, p.b[2]];
  if (f < 60) { c.alKon = 1; [c.alKx, c.alKy, c.alKz] = onPeel; c.alKbake = 0; c.alKheap = 1; }
  else if (f >= 431 && f < 960) {
    c.alKon = 1; c.alKheap = sm(f, 448, 503); c.alKbake = 0.92 * sm(f, 600, 880); c.alKchar = sm(f, 840, 880);
    const P: V3 = f < 552 || (f >= 884 && f < 912) ? onPeel : f < 884 ? [IN_B[0], IN_B[1] + 0.024, IN_B[2]] : plate9(f);
    [c.alKx, c.alKy, c.alKz] = P;
  } else if (f >= 960) {
    c.alKon = 1; c.alKbake = 0.92; c.alKchar = 1; c.alKheap = f >= 1300 ? -1 : 1; c.alKry = 1.1;   // the spooned-out side faces the crack camera (south)
    const P = f < 968 ? lerp3(KT_HAND, ALT, sm(f, 960, 968)) : f < 1696 ? ALT : lerp3(ALT, ALK_ASIDE, sm(f, 1696, 1710));
    [c.alKx, c.alKy, c.alKz] = P;
    if (f >= 1078 && f < 1300) { c.alKcrack = 1; c.alKfrost = 1 - 0.5 * sm(f, 1160, 1270); }
  }
  // the finale dessert: the flash-forward (60-139) and the real thing (1640-1845)
  if (f >= 60 && f < 139) {
    c.alFon = 1; [c.alFx, c.alFy, c.alFz] = ALT; c.alFbake = 0.95; c.alFry = 1.1;
    c.flame = sm(f, 58, 63) * (1 - sm(f, 80, 92)); c.boomK = 0.6 * sm(f, 60, 66) * (1 - sm(f, 72, 86)); c.boomAge = (f - 60) / 30;
    if (f >= 100) { c.alFcrack = 1; c.alFfrost = 1; }
    c.panOn = 1; [c.panX, c.panY, c.panZ] = lerp3(PAN_POUR, [-3.3, 1.12, 5.34], sm(f, 60, 74)); c.panTilt = 0.5 * (1 - sm(f, 60, 72)); c.panRy = 2.9;
  }
  if (f >= 1640) {
    c.alFon = 1; c.alFbake = 0.9;
    const K = kid16(f), dir: V3 = f < 1712 ? pathDir(WALK_K16, f, 1640, 1712) : [-1, 0, 0], side: V3 = [-dir[2], 0, dir[0]];
    const inHand = plus3(plus3(K, sc3(dir, 0.36)), plus3(sc3(side, 0.16), [0, 1.08, 0]));
    const P = f < 1712 ? inHand : f < 1722 ? lerp3(inHand, ALT, sm(f, 1712, 1722)) : ALT;
    [c.alFx, c.alFy, c.alFz] = P;
    c.panOn = 1;
    const panHand = plus3(plus3(K, sc3(dir, 0.3)), plus3(sc3(side, -0.24), [0, 1.04, 0]));
    const panP = f < 1742 ? panHand : f < 1750 ? lerp3(panHand, PAN_POUR, sm(f, 1742, 1750)) : f < 1798 ? PAN_POUR : lerp3(PAN_POUR, [KID_T[0] + 0.05, 1.02, KID_T[2] + 0.28], sm(f, 1798, 1808));
    [c.panX, c.panY, c.panZ] = panP; c.panRy = 2.9;
    const pour = sm(f, 1750, 1760) * (1 - sm(f, 1792, 1800)); c.panTilt = 0.9 * pour; c.rum = pour;
    c.flame = sm(f, 1803, 1810); c.boomAge = f >= 1822 ? (f - 1822) / 30 : -1; c.boomK = sm(f, 1822, 1836);
  }
  if (f >= 830 && f < 945) c.smokeAge = (f - 830) / 30;
  if (f >= 1612 && f < 1845) { c.trayOn = 1; c.trayX = 0.9; c.trayY = 0.78; c.trayZ = 4.6; }
  c.chalk = sm(f, 1636, 1688);
  if (f >= 392 && f < 430) { c.sweat = (f - 392) / 30; c.sweatX = BS.CHEF_READ[0]; c.sweatY = 2.05; c.sweatZ = BS.CHEF_READ[2]; }
  if (f >= 593 && f < 650) c.flare = (f - 593) / 30;
  if (f >= 1271 && f < 1517) { c.heat = sm(f, 1346, 1372); c.crust = 0.25 + 0.75 * sm(f, 1426, 1462); c.frostCut = 1; c.boing = f >= 1290 ? (f - 1290) / 30 : 0; }
  return c;
};
const kidPeelArms = (id: number, s: SetDef, f: number, P: V3, fc: number) => { const [g1, g2] = grips(f); return { armR: armTo(id, s, f, P, g2, 1, fc), armL: armTo(id, s, f, P, g1, -1, fc), armRFront: true, armLFront: true }; };

// ================================================= SHOT 1 (0-60) HOOK: "He baked ice cream at five hundred degrees," =========
// From behind the kid's right shoulder (north-east of the oven): the white dome on the long peel slides into the oven's
// roaring mouth (the dial on 500 above it); the kid's face big at the right, the fire in the middle.
const c1 = (f: number): Shot => { const u = clamp01(f / 60); return { pos: lerp3([1.62, 1.36, 12.6], [1.52, 1.26, 11.95], u), look: lerp3([0.74, 1.27, 9.25], [0.78, 1.23, 9.1], u), fov: 52, roll: 0 }; };
SHOT_CAMS[1] = () => [K(0, c1, 1, true)];
SHOT_ACTS[1] = (f, s) => {
  const P = kidAtPeel(f), fc = faceAt(1, s, f, P, [0.05, 1.2, 8.0]);
  const o = flow(f, [[0, { expr: "determined", facing: fc, tilt: -6 }], [34, { expr: "smug", facing: fc, tilt: -3 }, 8]]);
  return { cast: [C(KID, P, { ...o, ...kidPeelArms(1, s, f, P, fc) }, { idx: 1 })], subj: KID, focus: [0.05, 1.2, 8.9], ctl: CTL(f) };
};
lens(0, DOF_MS);

// ================================================= SHOT 2 (60-139) CUT, flash-forward: "set it on fire, and it still came out frozen."
// The finale's framing at the critic's table: the rum flames roll over the dome, then his spoon cracks it: frozen white inside.
const C16: Cam = cam3([-3.2, 1.22, 2.0], [-3.6, 1.15, 5.1], 48);
const c2 = F(() => cam3([-3.22, 1.24, 2.2], [-3.67, 1.12, 5.1], 48), 60, 0.0015, [[96, 0.008, 14]]);
SHOT_CAMS[2] = () => [K(60, c2, 1, true)];
SHOT_ACTS[2] = (f, s) => {
  const fk = faceAt(2, s, f, KID_T, BS.CRITIC);
  const spoon: V3 = f < 88 ? [-3.8, 1.05, 5.0] : lerp3([-3.72, 1.05, 5.0], [-3.66, 0.98, 4.98], sm(f, 92, 100));
  const c = CTL(f);
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[60, { expr: "yikes", mode: "sit", tilt: -10, headBack: 0.4 }], [96, { expr: "stare", mode: "sit", tilt: 4 }, 6], [118, { expr: "shock", mode: "sit", tilt: 2 }, 5]]),
      armR: armTo(2, s, f, BS.CRITIC, spoon, 1, 0, 1, "sit"), armRFront: true, propR: "spoon" }, { idx: 1 }),
    C(KID, KID_T, { expr: f < 96 ? "proud" : "smug", facing: fk, armR: armTo(2, s, f, KID_T, [c.panX + 0.12, c.panY + 0.02, c.panZ], 1, fk), armRFront: true, armL: AR.hipL }, { idx: 2 }),
  ], subj: CRIT, focus: [ALT[0], 1.0, ALT[2]], ctl: c };
};
lens(60, DOF_CU, 1);

// ================================================= SHOT 3 (139-268) CUT, "You see, one bad review can close a restaurant for good,
// and tonight, the meanest critic in town...": the snowy street at night. A passer-by in a red beret reads the one-star review
// taped to the boarded-up restaurant next door and shakes her head; the camera glides west along the shopfronts to our window
// and pushes at it: inside, the critic in his giant mustard puffy coat at his table, the waiter beside him.
const c3a = F(() => cam3([3.3, 1.55, -3.05], [4.2, 1.6, -0.24], 48), 139, 0.002);
const c3b: Cam = cam3([-3.8, 1.6, -1.9], [-4.1, 1.15, 4.0], 48);
const W0: Cam = cam3([-3.8, 1.5, 0.0], [-3.95, 1.12, 4.6], 50);
SHOT_CAMS[3] = () => [K(139, c3a, 1, true), K(192, crMoveG(c3a, 192, still(c3b), 236, [[1.4, 1.62, -2.95], [-1.3, 1.58, -2.55]], [[2.6, 1.5, 0.2], [-2.0, 1.3, 2.0]]), 1), K(236, moveIn(still(c3b), 236, W0, 268), 1)];
const PASSER = (f: number): V3 => (f < 188 ? [3.75, BS.SW, -0.78] : [lerp(3.75, 0.2, clamp01((f - 188) / 80)), BS.SW, -0.78]);
SHOT_ACTS[3] = (f, s) => {
  const P = PASSER(f), reading = f < 188, fc = reading ? faceAt(3, s, f, P, [4.3, 1.7, 0]) : faceAt(3, s, f, P, [P[0] - 1, 0, P[2]]);
  return { cast: [
    C(PASS1, P, { expr: reading ? (f > 166 ? "dismay" : "stare") : "neutral", ...(reading ? {} : { mode: "walk", phase: (f - 188) / 16 }), facing: fc, armR: AR.carryR, armRFront: true, propR: "purse", headTilt: reading && f > 168 ? 7 * Math.sin((f - 168) * 0.55) : 0 }, { idx: 1 }),
    C(CRIT, BS.CRITIC, { expr: "bored", mode: "sit", tilt: 3, facing: faceAt(3, s, f, BS.CRITIC, MENU_P) }, { idx: 2 }),
    C(WAIT, WALK_ORDER[0], { expr: "nervous", facing: faceAt(3, s, f, WALK_ORDER[0], BS.CRITIC), propL: "journal", propR: "pen" }, { idx: 3 }),
    C(DIN1, [-0.4, 0, 2.95], { expr: "smile", mode: "sit", facing: -0.5 }, { idx: 4 }), C(DIN2, [-0.4, 0, 1.85], { expr: "grin", mode: "sit", facing: 0.5 }, { idx: 5 }),
  ], subj: f < 200 ? PASS1 : CRIT, focus: f < 205 ? [4.3, 1.6, -0.24] : [-4.18, 1.0, 5.2], ctl: CTL(f) };
};
lens(139, DOF_MS, 1); lens(226, DOF_FS, 20);

// ================================================= SHOT 4 (268-365) through the glass: "...just ordered dessert. This guy once
// called a soup too wet," The push carries on into the room: the critic jabs a finger at DESSERT on the menu card, the waiter
// scribbles and hurries to the kitchen's swing door; the camera follows him past the framed TOO WET review on the wall (the
// critic's own, one star) and on through the doorway over his shoulder as he leans in to call the order.
const c4a = F(() => cam3([-3.58, 1.32, 2.4], [-3.75, 1.1, 5.3], 50), 309, 0.002);
const c4b: Cam = cam3([-2.35, 1.32, 4.1], [-2.85, 1.3, 7.1], 56);
const DOOR_W: Cam = cam3([-1.95, 1.62, 7.0], [-2.1, 1.5, 9.0], 50);
SHOT_CAMS[4] = () => [K(268, moveOut(W0, 268, c4a, 309), 1), K(309, c4a, 1), K(314, crMoveG(c4a, 314, still(c4b), 342, [[-2.95, 1.35, 3.2]], [[-3.2, 1.25, 6.3]]), 1), K(342, moveIn(still(c4b), 342, DOOR_W, 365), 1)];
SHOT_ACTS[4] = (f, s) => {
  const W = waiterAt(f), walking = f >= 312 && f < 340, fcW = walking ? faceAt(4, s, f, W, WALK_ORDER[2]) : faceAt(4, s, f, W, BS.CRITIC);
  const point = sm(f, 282, 290) * (1 - sm(f, 310, 320));
  const armR = lerpA2([[24, 14], [14, 30]], armTo(4, s, f, BS.CRITIC, MENU_P, 1, 0, 1, "sit"), point);
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[268, { expr: "bored", mode: "sit", tilt: 3 }], [280, { expr: "stern", mode: "sit", tilt: -4 }, 6], [312, { expr: "smug", mode: "sit", tilt: 2 }, 8]]), facing: faceAt(4, s, f, BS.CRITIC, MENU_P), armR, armRFront: true }, { idx: 2 }),
    C(WAIT, W, walking ? { expr: "nervous", mode: "walk", phase: (f - 312) / 12, facing: fcW, propL: "journal" }
      : f < 312 ? { expr: "nervous", facing: fcW, propL: "journal", propR: "pen", armR: [[20, 10], [14, -4 + 4 * Math.sin(f * 1.3)]], armRFront: true }
      : { expr: "yikes", facing: fcW, tilt: 14, armR: [[26, -10], [20, -40]], armRFront: true, propL: "journal" }, { idx: 3 }),
    C(DIN1, [-0.4, 0, 2.95], { expr: "smile", mode: "sit", facing: -0.5 }, { idx: 4 }), C(DIN2, [-0.4, 0, 1.85], { expr: "grin", mode: "sit", facing: 0.5 }, { idx: 5 }),
  ], subj: f < 314 ? CRIT : WAIT, focus: f < 314 ? [-4.18, 1.0, 5.2] : f < 350 ? BS.CLIP : [-2.3, 1.5, 9.0], ctl: CTL(f) };
};
lens(268, DOF_MS, 18);

// ================================================= SHOT 5 (365-431) "...so the head chef is sweating through his hat." Just inside
// the door: the head chef, hearing the order, sweats so hard the drops fly off his toque; the line cook behind him freezes.
const c5 = F(() => cam3([-2.06, 1.6, 7.55], [-2.3, 1.55, 9.0], 46), 392, 0.0022, [[410, 0.008, 10]]);
SHOT_CAMS[5] = () => [K(365, moveOut(DOOR_W, 365, c5, 392), 1), K(392, c5, 1)];
SHOT_ACTS[5] = (f, s) => {
  const P = chefAt(f), fc = faceAt(5, s, f, P, [-2.1, 1.6, 7.2]);
  return { cast: [
    C(CHEF, P, { ...flow(f, [[365, { expr: "worry", facing: fc, tilt: 4 }], [374, { expr: "dismay", facing: fc, tilt: 9 }, 6], [400, { expr: "yikes", facing: fc, tilt: 7 }, 6]]),
      armL: f > 396 && f < 424 ? [[-24, -12], [-8, -44]] as A2 : AR.hipL, armR: [[22, 10], [12, 26]], armRFront: true }, { idx: 1 }),
    C(COOK1, BS.COOK1, { expr: f < 390 ? "neutral" : "stare", facing: 0.5, armR: [[22, 20], [36, 30 + 6 * Math.sin(f * 0.4)]], armRFront: true, propR: "ladle" }, { idx: 3 }),
  ], subj: CHEF, focus: [P[0], 1.55, P[2]], ctl: CTL(f) };
};
lens(365, DOF_CU, 18);

// ================================================= SHOT 6 (431-554) "Then the new kid buries a block of ice cream in whipped egg
// whites and slides it into the oven." High over the pastry bench: three big spatula heaps over the block on the peel; then
// the kid swings the peel to the oven and slides it into the fire, the camera dropping to the fire's level from the north-west.
const c6a = FS(() => cam3([-1.6, 2.3, 10.6], [2.0, 1.0, 7.8], 50), 462, 0.0015, 0.004);
const c6b = F(() => cam3([-2.6, 1.5, 12.4], [0.0, 1.1, 8.8], 56), 534, 0.002);
SHOT_CAMS[6] = () => [K(431, crMoveG(c5, 431, c6a, 462, [[-1.0, 1.95, 8.95]], [[0.6, 1.3, 8.4]]), 1), K(462, c6a, 1), K(504, glideTo(c6a, 504, c6b, 534), 1), K(534, c6b, 1)];
SHOT_ACTS[6] = (f, s) => {
  const atBench = f < 506, P: V3 = atBench ? BS.KID_BENCH : f < 521 ? lerp3(BS.KID_BENCH, kidAtPeel(521), sm(f, 506, 521)) : kidAtPeel(f);
  const fc = faceAt(6, s, f, P, atBench ? [1.55, 1, 7.9] : [0.05, 1, 8.0]);
  const heapPh = Math.max(0, Math.sin(clamp01((f - 446) / 58) * Math.PI * 3));
  const [g1, g2] = grips(f);
  const armR = atBench ? armTo(6, s, f, P, [1.6, 1.08 + 0.22 * heapPh, 8.05 - 0.05 * heapPh], 1, fc) : armTo(6, s, f, P, g2, 1, fc);
  const armL = atBench ? armTo(6, s, f, P, [2.05, 0.98, 8.0], -1, fc) : armTo(6, s, f, P, g1, -1, fc);
  // the chef keeps facing the door (as at the end of shot 5) until the camera has left his close-up, then turns to the kid
  const PC = chefAt(f), fcC = f < 452 ? faceAt(6, s, f, PC, [-2.1, 1.6, 7.2]) : faceAt(6, s, f, PC, P), chefWalk = f >= 455 && f < 490;
  return { cast: [
    C(KID, P, { ...flow(f, [[431, { expr: "determined", facing: fc, tilt: -5 }], [508, { expr: "calm", facing: fc, tilt: -3 }, 8], [540, { expr: "smug", facing: fc }, 8]]), ...(f >= 506 && f < 521 ? { mode: "walk", phase: (f - 506) / 10 } : {}), armR, armL, armRFront: true, armLFront: true, propR: atBench ? "trowel" : undefined }, { idx: 2 }),
    C(CHEF, PC, { ...flow(f, [[431, { expr: "yikes", facing: fcC, tilt: 7 }], [470, { expr: "stare", facing: fcC, tilt: 4 }, 8], [520, { expr: "aghast", facing: fcC }, 6]]), ...(f < 452 ? { armL: AR.hipL, armR: [[22, 10], [12, 26]] as A2, armRFront: true } : {}), ...(chefWalk ? { mode: "walk", phase: (f - 455) / 15 } : {}) }, { idx: 1 }),
    C(DISH, DISH0, { expr: "neutral", facing: -0.5, armR: [[22, 18], [30, 30 + 5 * Math.sin(f * 0.5)]], armRFront: true }, { idx: 3 }),
  ], subj: KID, focus: atBench ? [1.55, 1.0, 8.0] : [0.1, 1.2, 9.0], ctl: CTL(f) };
};
lens(431, DOF_MS, 18);

// ================================================= SHOT 7 (554-700) "The chef laughs, the cooks laugh, and the dishwasher quietly
// sets a mop bucket under the oven." From the west: the head chef doubles over laughing (the kid calm behind him, the peel up
// like a staff); the camera pans to the two line cooks at the stove laughing (a pan flares); then cranes round to the oven,
// where the dishwasher carries the yellow mop bucket along the oven front and parks it under the mouth.
const C2S: Cam = cam3([-3.8, 1.38, 9.75], [-0.6, 1.2, 9.5], 46);       // the two-shot (shots 7 and 8)
const c7b: Cam = cam3([-3.75, 1.45, 9.6], [-0.1, 1.36, 12.05], 46);
const c7c = F(() => cam3([-2.6, 1.55, 12.05], [0.45, 1.1, 9.25], 56), 640, 0.0015);
SHOT_CAMS[7] = () => [K(554, glideTo(c6b, 554, still(C2S), 578), 1), K(578, F(() => C2S, 578, 0.001), 1), K(586, glideTo(still(C2S), 586, still(c7b), 606), 1), K(606, still(c7b), 1),
  K(612, crMoveG(still(c7b), 612, c7c, 640, [[-3.2, 1.55, 11.0]], [[-0.2, 1.2, 10.6]]), 1), K(640, c7c, 1)];
SHOT_ACTS[7] = (f, s) => {
  const PC = BS.CH_W, PK = kidAtPeel(f), D = dishAt(f), carrying = f >= 630 && f < 672;
  const fcC = faceAt(7, s, f, PC, PK), fk = faceAt(7, s, f, PK, PC);
  const cook = (who: string, P: V3, i: number, a: number) => C(who, P, f < a ? { expr: "neutral", facing: faceAt(7, s, f, P, [P[0], 1, 13.4]), armR: [[22, 20], [36, 30]], armRFront: true, propR: i ? "tongs" : "ladle" }
    : { ...laughP(f, a, i), facing: faceAt(7, s, f, P, PK), armR: [[22, 20], [30, 34]], armRFront: true, propR: i ? "tongs" : "ladle" }, { idx: 10 + i });
  return { cast: [
    C(CHEF, PC, f < 562 ? { expr: "smug", facing: fcC } : { ...laughP(f, 562, 0), facing: fcC, armR: AR.hipR, armL: [[-26, 10], [-34, 24]] }, { idx: 1 }),
    cook(COOK1, BS.COOK1, 0, 586), cook(COOK2, BS.COOK2, 1, 590),
    C(KID, PK, { expr: "calm", facing: fk, ...kidPeelArms(7, s, f, PK, fk) }, { idx: 2 }),
    C(DISH, D, carrying ? { expr: "bored", mode: "walk", phase: (f - 630) / 15, facing: faceAt(7, s, f, D, [0, 0, 9.0]), armR: armTo(7, s, f, D, [D[0] - 0.32, 0.5, D[2] - 0.1], 1), armRFront: true }
      : { expr: f > 640 ? "calm" : "neutral", facing: faceAt(7, s, f, D, [0, 0, 9.0]), ...(f >= 672 && f < 692 ? { tilt: -12 * Math.sin(clamp01((f - 672) / 20) * Math.PI), armR: armTo(7, s, f, D, [0.12, 0.55, 8.95], 1) as A2, armRFront: true } : {}) }, { idx: 3 }),
  ], subj: f < 586 ? CHEF : f < 612 ? COOK1 : DISH, focus: f < 586 ? [PC[0], 1.5, PC[2]] : f < 612 ? [-0.1, 1.45, 12.05] : [D[0], 1.0, D[2]], ctl: CTL(f) };
};
lens(554, DOF_MS, 1);

// ================================================= SHOT 8 (700-815) the mock and the reply in ONE two-shot (11t): the head chef big
// near the lens, leaning in and pointing, "Kid, you just made soup!"; the kid behind at the oven, peel up like a staff,
// "Three minutes." (holds up three fingers; the oven timer ticks).
const c8 = F(() => C2S, 724, 0.0008, [[727, 0.006, 8], [803, 0.007, 8]]);
// the reply: the camera eases past the chef's shoulder onto the kid (the chef's big shoulder stays in the left foreground)
const c8k = F(() => cam3([-3.3, 1.36, 9.9], [-0.2, 1.2, 9.75], 42), 816, 0.001);
SHOT_CAMS[8] = () => [K(700, glideTo(c7c, 700, c8, 724), 1), K(724, c8, 1), K(792, glideTo(c8, 792, c8k, 812), 1), K(812, c8k, 1)];
SHOT_ACTS[8] = (f, s) => {
  const PC = BS.CH_W, PK = kidAtPeel(f), fcC = faceAt(8, s, f, PC, PK), fk = faceAt(8, s, f, PK, PC), [g1, g2] = grips(f);
  const lean = sm(f, 712, 728) * (1 - sm(f, 772, 790));
  const oC = speak(f, 727, 772, { expr: f < 727 ? "smug" : "mock", facing: fcC, tilt: 10 * lean * Math.sign(fcC || 1), armR: lerpA2(AR.hipR, AR.pointR, lean) as A2, armRFront: true, armL: AR.hipL });
  const three = sm(f, 797, 805);
  const oK = speak(f, 803, 817, { expr: f < 797 ? "calm" : "smug", facing: fk, tilt: -3, armR: armTo(8, s, f, PK, g2, 1, fk), armRFront: true,
    armL: lerpA2(armTo(8, s, f, PK, g1, -1, fk), [[-22, -14], [-14, -46]], three), armLFront: true });
  return { cast: [C(CHEF, PC, oC, { idx: 1 }), C(KID, PK, oK, { idx: 2 }), C(DISH, dishAt(f), { expr: "calm", facing: faceAt(8, s, f, dishAt(f), PC) }, { idx: 3 })],
    subj: f < 790 ? CHEF : KID, focus: f < 790 ? [PC[0], 1.55, PC[2]] : [PK[0], 1.5, PK[2]], ctl: { ...CTL(f), timer: (f - 700) / 600 } };
};
lens(700, DOF_MS, 1);

// ================================================= SHOT 9 (815-960) "Then smoke pours out of the oven door, and the white mountain
// comes out brown, with black tips." Smoke rolls out of the mouth and everyone leans back; the kid lowers the peel, slides it in
// and pulls the dessert out: browned, its peaks charred black, big in front of us. He lifts the plate and holds it up, then
// heads for the dining room.
const c9a = F(() => cam3([-3.4, 1.5, 10.6], [-0.6, 1.1, 9.4], 60), 842, 0.0018);
const c9b = F(() => cam3([-1.5, 1.5, 11.05], [0.2, 1.28, 9.5], 46), 894, 0.0012, [[920, 0.006, 10]]);
SHOT_CAMS[9] = () => [K(815, glideTo(c8k, 815, c9a, 842), 1), K(842, c9a, 1), K(870, crMoveG(c9a, 870, c9b, 894, [], []), 1), K(894, c9b, 1)];
SHOT_ACTS[9] = (f, s) => {
  const PK = kid9(f), PC = BS.CH_W, D = BS.DISH_SPOT;
  const fk = faceAt(9, s, f, PK, f < 912 ? [0.05, 1, 8.5] : f < 946 ? [-0.8, 1.4, 10.8] : [-2.1, 0, 7.5]), fcC = faceAt(9, s, f, PC, [0.05, 1.2, 8.8]);
  const back = sm(f, 832, 846) * (1 - sm(f, 862, 876));
  const P9 = plate9(f);
  const kidArms = f < 898 ? kidPeelArms(9, s, f, PK, fk)
    : f < 912 ? { armR: AR.hipR, armL: AR.hipL }
    : { armR: armTo(9, s, f, PK, [P9[0] + 0.13, P9[1] - 0.02, P9[2]], 1, fk), armL: armTo(9, s, f, PK, [P9[0] - 0.13, P9[1] - 0.02, P9[2]], -1, fk), armRFront: true, armLFront: true };
  const walking = (f >= 898 && f < 912) || f >= 946;
  return { cast: [
    C(KID, PK, { expr: f < 870 ? "calm" : f < 918 ? "determined" : "proud", facing: fk, tilt: -8 * back, ...(walking ? { mode: "walk", phase: (f - 898) / 11 } : {}), ...kidArms }, { idx: 1 }),
    C(CHEF, PC, flow(f, [[815, { expr: "smug", facing: fcC }], [834, { expr: "aghast", facing: fcC, tilt: -10 }, 5], [900, { expr: "yikes", facing: fcC, armR: [[22, -14], [6, -50]], armL: [[-22, -14], [-6, -50]], armRFront: true, armLFront: true }, 6]]), { idx: 2 }),
    C(DISH, D, flow(f, [[815, { expr: "calm", facing: faceAt(9, s, f, D, [0, 1, 8.7]) }], [836, { expr: "shock", facing: faceAt(9, s, f, D, [0, 1, 8.7]), tilt: -8 }, 5], [904, { expr: "stare", facing: faceAt(9, s, f, D, [0, 1, 9.4]) }, 6]]), { idx: 3 }),
  ], subj: KID, focus: f < 880 ? [0.05, 1.3, 8.8] : P9, ctl: CTL(f) };
};
lens(815, DOF_MS, 1); lens(894, DOF_CU, 10);

// ================================================= SHOT 10 (960-1040) CUT to the critic's table: "The critic sniffs it, frowns, and
// starts writing." The kid sets the plate down in front of him and steps back; he leans in to sniff, frowns, and writes.
const c10 = F(() => cam3([-3.25, 1.26, 2.15], [-3.62, 1.05, 5.1], 50), 960, 0.0012, [[995, 0.005, 8]]);
SHOT_CAMS[10] = () => [K(960, c10, 1, true)];
SHOT_ACTS[10] = (f, s) => {
  const fk = faceAt(10, s, f, KID_T, BS.CRITIC);
  const sniff = sm(f, 970, 980) * (1 - sm(f, 990, 1000)), write = sm(f, 1016, 1022);
  const pen: V3 = [-3.98 + 0.04 * Math.sin(f * 1.7) * write, 0.84, 5.32 + 0.02 * Math.cos(f * 2.3) * write];
  const setK = 1 - sm(f, 966, 976);
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[960, { expr: "bored", mode: "sit", tilt: 2 }], [970, { expr: "stare", mode: "sit" }, 4], [994, { expr: "stern", mode: "sit" }, 5], [1014, { expr: "stern", mode: "sit", tilt: 4 }, 5]]),
      facing: faceAt(10, s, f, BS.CRITIC, ALT), tilt: -16 * sniff, armR: write > 0.5 ? armTo(10, s, f, BS.CRITIC, pen, 1, 0, 1, "sit") : AR.hipR, armRFront: true, propR: write > 0.5 ? "pen" : undefined,
      armL: [[-24, 14], [-8, 26]], armLFront: true, propL: "journal" }, { idx: 1 }),
    C(KID, kidT(f), { expr: f < 990 ? "calm" : "smug", facing: fk, ...(f >= 990 && f < 1010 ? { mode: "walk", phase: (f - 990) / 10 } : {}), armR: setK > 0.02 ? lerpA2(AR.hipR, armTo(10, s, f, KID_T, [ALT[0] + 0.1, 0.8, ALT[2]], 1, fk), setK) : AR.hipR, armRFront: true,
      armL: setK > 0.02 ? lerpA2(AR.hipL, armTo(10, s, f, KID_T, [ALT[0] + 0.1, 0.8, ALT[2] + 0.12], -1, fk), setK) : AR.hipL, armLFront: true }, { idx: 2 }),
  ], subj: CRIT, focus: [-4.0, 1.0, 5.2], ctl: CTL(f) };
};
lens(960, DOF_MS, 1);

// ================================================= SHOT 11 (1040-1170) "But when he cracks it open with his spoon, the ice cream inside
// is still frozen solid." The dessert big in front (40 %+), his face above it; the spoon cracks the brown shell and frosty white
// ice cream shows; the kid beside him doesn't even blink.
const c11 = F(() => cam3([-3.4, 1.35, 3.2], [-3.86, 0.98, 5.08], 48), 1064, 0.0008, [[1080, 0.006, 10], [1135, 0.004, 8]]);
SHOT_CAMS[11] = () => [K(1040, glideTo(c10, 1040, c11, 1064), 1), K(1064, c11, 1)];
SHOT_ACTS[11] = (f, s) => {
  const spoon: V3 = f < 1070 ? lerp3([-3.9, 1.12, 5.08], [-3.72, 1.08, 5.0], sm(f, 1046, 1066)) : lerp3([-3.72, 1.08, 5.0], [-3.66, 0.98, 4.98], sm(f, 1070, 1080));
  const fk = faceAt(11, s, f, KID_BACK, BS.CRITIC);
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[1040, { expr: "stern", mode: "sit", tilt: 2 }], [1080, { expr: "stare", mode: "sit", tilt: -6 }, 4], [1135, { expr: "shock", mode: "sit", tilt: -2, headBack: 0.3 }, 5]]),
      facing: faceAt(11, s, f, BS.CRITIC, ALT), armR: armTo(11, s, f, BS.CRITIC, spoon, 1, 0, 1, "sit"), armRFront: true, propR: "spoon", armL: [[-24, 14], [-8, 26]], armLFront: true }, { idx: 1 }),
    C(KID, KID_BACK, { expr: f < 1135 ? "calm" : "smug", facing: fk, armR: [[26, 4], [-10, 16]], armL: [[-26, 4], [10, 16]], armRFront: true, armLFront: true }, { idx: 2 }),
  ], subj: CRIT, focus: [ALT[0], 0.95, ALT[2]], ctl: CTL(f) };
};
lens(1040, DOF_CU, 18);
KICKS.push([1080 / 30, 0.05]);

// ================================================= SHOT 12 (1170-1271) "He takes a bite, and for the first time in his life, he
// smiles." Close on the critic: the bite, the chew, then a huge slow smile; then the camera pushes into the cracked meringue
// until its bubbles fill the frame.
const c12 = F(() => cam3([-3.55, 1.3, 3.65], [-4.0, 0.98, 5.12], 44), 1192, 0.0015);
const c12in = (f: number): Shot => { const u = sm(f, 1246, 1271); return { pos: lerp3([-3.52, 1.25, 3.9], [-3.58, 1.0, 4.6], u), look: lerp3([-3.75, 0.97, 5.05], [-3.6, 0.95, 4.88], u), fov: lerp(44, 28, u), roll: 0 }; };
SHOT_CAMS[12] = () => [K(1170, glideTo(c11, 1170, c12, 1192), 1), K(1192, c12, 1), K(1234, glideTo(c12, 1234, c12in, 1250), 1), K(1250, c12in, 1)];
SHOT_ACTS[12] = (f, s) => {
  const bite = sm(f, 1172, 1186) * (1 - sm(f, 1194, 1206));
  const spoon = lerp3([-3.66, 0.98, 4.98], [-4.02, 1.2, 5.15], bite);
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[1170, { expr: "stare", mode: "sit" }], [1188, { expr: "calm", mode: "sit", tilt: 2 }, 6], [1226, { expr: "beam", mode: "sit", tilt: -4, headBack: 0.2 }, 18]]),
      facing: faceAt(12, s, f, BS.CRITIC, ALT), armR: armTo(12, s, f, BS.CRITIC, spoon, 1, 0, 1, "sit"), armRFront: true, propR: "spoon" }, { idx: 1 }),
    C(KID, KID_BACK, { expr: "smug", facing: faceAt(12, s, f, KID_BACK, BS.CRITIC), armR: [[26, 4], [-10, 16]], armL: [[-26, 4], [10, 16]], armRFront: true, armLFront: true }, { idx: 2 }),
  ], subj: CRIT, focus: f < 1240 ? [-4.18, 1.05, 5.2] : [ALT[0], 0.93, ALT[2]], ctl: CTL(f) };
};
lens(1170, DOF_CU, 1);

// ================================================= SHOT 13 (1271-1517) the cutaway: "Because whipped egg white is mostly tiny bubbles of
// air, and air is terrible at carrying heat. So the outside browns, and the heat never reaches the ice cream." Inside the
// dessert at giant scale: the kid and the chef stand among man-sized meringue bubbles on the frozen ice cream. The kid taps
// a bubble; orange heat waves come down from the browning crust and stall in the bubbles; down on the ice cream the chef
// shivers with frost on his moustache.
const CX = BS.CX, CI = BS.CUT_ICE;
const PC15: V3 = [-1.5, 0, 6.02];   // the chef writes on the specials board from its west side (the kid passes behind him from the door)
const PK13: V3 = [CX - 0.6, CI, 2.6], PC13: V3 = [CX + 0.7, CI, 2.6];
const c13a = (f: number): Shot => { const u = sm(f, 1271, 1312); return { pos: lerp3([CX - 0.7, CI + 1.9, 3.6], [CX - 0.05, CI + 2.1, 6.6], u), look: lerp3([CX - 0.85, CI + 1.85, 2.0], [CX + 0.02, CI + 1.85, 1.0], u), fov: lerp(30, 56, u), roll: 0 }; };
const c13b = F(() => cam3([CX - 0.05, CI + 2.1, 6.6], [CX + 0.02, CI + 1.85, 1.0], 56), 1312, 0.0005);
const c13c = F(() => cam3([CX + 1.1, CI + 1.6, 5.0], [CX + 0.7, CI + 1.45, 2.6], 48), 1490, 0.002);
SHOT_CAMS[13] = () => [K(1271, c13a, 1, true), K(1312, c13b, 1), K(1462, glideTo(c13b, 1462, c13c, 1490), 1), K(1490, c13c, 1)];
SHOT_ACTS[13] = (f, s) => {
  const tap = Math.max(0, Math.sin(clamp01((f - 1282) / 14) * Math.PI));
  const shiver = f > 1468 ? 2.2 * Math.sin(f * 2.6) : 0;
  return { cast: [
    C(KID, PK13, { ...flow(f, [[1271, { expr: "smug", facing: 0.5 }], [1350, { expr: "proud", facing: 0.3 }, 8], [1430, { expr: "smile_closed", facing: 0.5 }, 8]]),
      armR: lerpA2([[24, 10], [28, -10]], [[26, -10], [44, -34]], tap), armRFront: true, propR: "trowel", armL: AR.hipL }, { idx: 1 }),
    C(CHEF, PC13, { ...flow(f, [[1271, { expr: "stare", facing: -0.5 }], [1380, { expr: "dismay", facing: -0.5 }, 8], [1466, { expr: "cold", facing: -0.3 }, 6]]), tilt: shiver, armR: [[20, 8], [-6, 18]], armL: [[-20, 8], [6, 18]], armRFront: true, armLFront: true }, { idx: 2 }),
  ], subj: f < 1460 ? KID : CHEF, focus: f < 1460 ? [PK13[0], CI + 1.5, PK13[2]] : [PC13[0], CI + 1.5, PC13[2]], ctl: CTL(f) };
};
lens(1271, DOF_WS, 1);

// ================================================= SHOT 14 (1517-1615) CUT, the comparison: "It's why that giant puffy coat kept the
// critic warm in the snow." Earlier that evening on the snowy sidewalk: the critic strolls along in the giant mustard puffer,
// snow piling on his shoulders, cosy and smug, breath puffing; the camera walks backwards in front of him, then turns away to
// our window and pushes through the glass into tonight's dining room.
const PCW = (f: number): V3 => [lerp(-8.6, -6.4, clamp01((f - 1517) / 93)), BS.SW, -1.45];
const c14 = (f: number): Shot => { const P = PCW(f), push = 0.25 * sm(f, 1560, 1596); return { pos: [P[0] + 2.2 - 0.6 * push, 1.42, -2.95 + 0.9 * push], look: [P[0] + 0.1, 1.32, -1.45], fov: 44, roll: 0 }; };
const W1: Cam = cam3([-2.0, 1.55, 0.0], [-1.3, 1.4, 4.0], 50);
SHOT_CAMS[14] = () => [K(1517, c14, 1, true), K(1592, moveIn(c14, 1592, W1, 1615), 1)];
const steamPuff = (P: V3, age: number): FxSpec => ({ kind: "card", key: "breath" + Math.min(5, Math.floor(age / 5)), pos: [P[0] + 0.32 + age * 0.008, P[1] + 1.5 + age * 0.004, P[2] - 0.2], w: 0.12 + age * 0.008, h: 0.1 + age * 0.006, soft: true, cw: 96, ch: 80,
  draw: (p) => { const g = p.g; g.globalAlpha = 0.55 * (1 - age / 34); g.fillStyle = "#eef4ff"; g.beginPath(); g.ellipse(48, 40, 40, 30, 0, 0, 6.3); g.fill(); g.globalAlpha = 1; } });
SHOT_ACTS[14] = (f, s) => {
  const P = PCW(f), fc = faceAt(14, s, f, P, [P[0] + 1, 0, P[2] - 0.6]);
  const hug = sm(f, 1540, 1552);
  return { cast: [C(CRIT, P, { expr: f < 1560 ? "smug" : "calm", mode: "walk", phase: (f - 1517) / 18, facing: fc, armR: lerpA2([[22, 20], [10, 34]], [[24, 4], [-8, 14]], hug), armL: lerpA2([[-22, 20], [-10, 34]], [[-24, 4], [8, 14]], hug), armRFront: true, armLFront: true }, { idx: 1 })],
    subj: CRIT, focus: [P[0], 1.4, P[2]], ctl: CTL(f), fx: f > 1566 && f < 1600 ? [steamPuff(P, f - 1566)] : [] };
};
lens(1517, DOF_MS, 1);

// ================================================= SHOT 15 (1615-1690) through the window, "Chefs really make this, and it's called a
// baked Alaska." The diners at the next table beam over their own little baked Alaskas; the humbled head chef chalks BAKED
// ALASKA on the specials board, letter by letter; the kid comes out of the kitchen door with a second dome and the copper pan.
const c15 = F(() => cam3([-1.0, 1.42, 3.1], [-1.4, 1.2, 6.3], 52), 1650, 0.0012);
SHOT_CAMS[15] = () => [K(1615, moveOut(W1, 1615, c15, 1650), 1), K(1650, c15, 1)];
SHOT_ACTS[15] = (f, s) => {
  const PC: V3 = PC15, fcC = faceAt(15, s, f, PC, BS.CHALK), chalkH: V3 = [-1.05 + 0.16 * Math.sin(f * 0.6), 1.5 - 0.25 * clamp01((f - 1636) / 52), 6.38];
  const PK = kid16(f), fk = faceAt(15, s, f, PK, KID_T), c = CTL(f);
  return { cast: [
    C(CHEF, PC, { expr: f < 1650 ? "sheepish" : "proud", facing: fcC, armR: armTo(15, s, f, PC, chalkH, 1, fcC), armRFront: true, propR: "chalk", armL: AR.hipL }, { idx: 1 }),
    ...(f >= 1636 ? [C(KID, PK, { expr: "proud", mode: "walk", phase: (f - 1640) / 16, facing: fk, armR: armTo(15, s, f, PK, [c.panX + 0.12, c.panY, c.panZ], 1, fk), armL: armTo(15, s, f, PK, [c.alFx, c.alFy - 0.03, c.alFz], -1, fk), armRFront: true, armLFront: true }, { idx: 2 })] : []),
    C(DIN4, [0.9, 0, 5.15], { expr: "beam", mode: "sit", facing: faceAt(15, s, f, [0.9, 0, 5.15], [0.9, 0, 4.6]) }, { idx: 3 }),
    C(DIN1, [0.35, 0, 4.6], { expr: "joy", mode: "sit", facing: faceAt(15, s, f, [0.35, 0, 4.6], [0.9, 0, 4.6]) }, { idx: 4 }),
  ], subj: CHEF, focus: [-0.85, 1.35, 6.4], ctl: c };
};
lens(1615, DOF_MS, 1);

// ================================================= SHOT 16 (1690-1845) "So the critic orders another one, and this time, the kid pours
// on hot rum and sets it on fire." The critic pushes his empty plate aside and holds up one finger just as the kid sets the second
// dome down; the kid pours the hot rum from the copper pan and lights it: the flame rolls up between them on "fire". The kid
// stands calm on one side, the critic lit orange and delighted on the other. The video ends on the peak.
const c16 = F(() => C16, 1716, 0.0007);
const c16b = (f: number): Shot => { const s0 = c16(1816), u = sm(f, 1816, 1842); return { pos: lerp3(s0.pos, [-4.5, 1.45, 3.0], u), look: lerp3(s0.look, [-3.76, 1.3, 5.2], u), fov: s0.fov ?? 52, roll: 0 }; };
SHOT_CAMS[16] = () => [K(1690, glideTo(c15, 1690, c16, 1716), 1), K(1716, c16, 1), K(1816, c16b, 1)];
SHOT_ACTS[16] = (f, s) => {
  const PK = kid16(f), walking = f < 1712, fk = faceAt(16, s, f, PK, walking ? KID_T : BS.CRITIC);
  const c = CTL(f);
  const finger = sm(f, 1704, 1712) * (1 - sm(f, 1736, 1746)), push = sm(f, 1694, 1700) * (1 - sm(f, 1710, 1716));
  const boom = sm(f, 1822, 1834), light = sm(f, 1796, 1802) * (1 - sm(f, 1806, 1814));
  return { cast: [
    C(CRIT, BS.CRITIC, { ...flow(f, [[1690, { expr: "beam", mode: "sit" }], [1700, { expr: "smug", mode: "sit", tilt: 3 }, 6], [1752, { expr: "stare", mode: "sit" }, 6], [1822, { expr: "joy", mode: "sit", tilt: -10, headBack: 0.4 }, 4]]),
      facing: faceAt(16, s, f, BS.CRITIC, ALT), armR: push > 0.01 ? armTo(16, s, f, BS.CRITIC, [ALT[0] - 0.05, 0.82, ALT[2] - 0.15], 1, 0, 1, "sit") : finger > 0.01 ? lerpA2(AR.hipR, [[24, -16], [18, -48]], finger) : AR.hipR, armRFront: true }, { idx: 1 }),
    C(KID, PK, { expr: f < 1800 ? "calm" : "proud", ...(walking ? { mode: "walk", phase: (f - 1640) / 16 } : {}), facing: fk, tilt: -6 * boom,
      armR: armTo(16, s, f, PK, [c.panX + 0.12, c.panY + 0.03, c.panZ], 1, fk), armRFront: true,
      armL: f < 1722 ? armTo(16, s, f, PK, [c.alFx, c.alFy - 0.03, c.alFz], -1, fk) : light > 0.01 ? lerpA2(AR.hipL, armTo(16, s, f, PK, [ALT[0] + 0.12, 1.02, ALT[2] + 0.05], -1, fk), light) : AR.hipL, armLFront: true }, { idx: 2 }),
  ], subj: f < 1800 ? CRIT : KID, focus: f < 1745 ? [-4.18, 1.05, 5.2] : [ALT[0], 1.0, ALT[2]], ctl: c };
};
lens(1690, DOF_MS, 1);
KICKS.push([1823 / 30, 0.11]);

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
  if (last && prev && prev.set === sh.set && prev.light === sh.light && prev.b === sh.a) { last.shots.push(sh.id); last.b = sh.b; }
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
