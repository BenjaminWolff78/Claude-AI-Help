// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "He Saved His Life by Proving His Masterpiece Was Fake", set-local coordinates,
// absolute frames. Master prompt v10.8: 9 scenes in 10 shot ids; two home bases (A: the potato field, B: the village
// market + pigsty, one valley set), the palace twice; motivated transitions only (ride the motion, position match, dust,
// light, shape match; same-place crossfades only for the field's day -> night -> dawn time jumps), 1 hard cut.
// Acting (v10.8 part 8): talking mouths change every frame from the voice loudness (mouths.json), 3-4 frame blinks at
// irregular 0.5-1.5 s (world.ts), expressions swap instantly 0-3 frames before their word, idle bodies stay still while
// the face stays alive, wind-up ~6 f then the action in 1-3 f, no squash / stretch / overshoot.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF, KICKS } from "./story";
import POSES from "./poses.json";
import MOUTHF from "./mouths.json";
import { getInputProps } from "remotion";
/** thumbnail mode (inputProps.thumb): scene 1 is staged as the cover still */
const THUMB = !!(getInputProps() as { thumb?: boolean }).thumb;
import type { MouthK } from "./toon";
import { boatAt } from "./sets/storm";

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
const F = (g: (f: number) => { pos: V3; look: V3; fov: number }, f0: number, rate = 0.0018, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const c = g(f), k = creep(f, f0, rate, punches);
  return { pos: lerp3(c.look, c.pos, k), look: c.look, fov: c.fov, roll };
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

// ---------------- 2D cartoon effect cards (flat sprites in the 3D scene, plum ink like the characters) ----------------
const INKC = "#241726";
const rnd1 = (i: number, s = 12.9898) => { const x = Math.sin(i * s) * 43758.5453; return x - Math.floor(x); };
/** soft painted dust cloud (ochre, lit top, violet underside), a = opacity 0..1, seed picks the shape */
const dustCard = (key: string, pos: V3, w: number, a: number, seed = 1, rot = 0): FxSpec => ({
  kind: "card", key: "dust" + (seed % 5) + "_" + Math.round(a * 10), pos, w, h: w * 0.72, rot, soft: true, cw: 192, ch: 140,
  draw: (p) => {
    const g = p.g; g.globalAlpha = Math.max(0, Math.min(1, a));
    const blobs: [number, number, number][] = [];
    for (let i = 0; i < 7; i++) blobs.push([36 + 120 * rnd1(i + seed * 7), 52 + 46 * rnd1(i + seed * 3, 78.233), 26 + 22 * rnd1(i + seed, 39.4)]);
    for (const [x, y, r] of blobs) { g.fillStyle = "#b9a48a"; g.beginPath(); g.arc(x, y + 6, r, 0, 6.3); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = "#e3cfa6"; g.beginPath(); g.arc(x, y, r * 0.92, 0, 6.3); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = "#f6e8c8"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.3, r * 0.5, 0, 6.3); g.fill(); }
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
// "He Made Cars Easier to Crush, and It Saved Lives": shared staging helpers. Positions come from the set marks
// (crashhall, showroom, works, backyard, street). Accent safety-cage yellow #F2C230 (on objects only; captions stay white).
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
// =====================================================================================================================
// "Owners Sank Their Own Ships, So He Painted a Line" - 9 scene ids in three places: the Liverpool dock (home base,
// "dock": morning, midday, golden hour, night, bright day), the North Atlantic in a gale ("storm", night) and the House
// of Commons ("commons", day interior). Master prompt v10.14:
//  - a real time of day per scene, neighbours contrast (morning -> storm night -> morning -> midday -> Commons ->
//    golden -> night lamps -> bright payoff);
//  - people in every story beat (the mechanism shot keeps Plimsoll and a soaked sailor in frame);
//  - the comparison is acted in the story world: Plimsoll's toy boat in the dock's rain barrel, his fingers drop the
//    pennies; the 1876 notice and the 1890 circle are put up by hands;
//  - one ending, on the callback ("she'll float" ... she has to), story characters in the last shot;
//  - thin black limbs (fig.ts), staggered groups turned toward the action, hats stay on, camera roll 0.
// Accent signal lime #8BD435 (Plimsoll's paint, his hat band and scarf, the lines).
type CK = { f: number; pos: V3; look: V3; fov: number };
const spline = (ks: CK[]) => (f: number): { pos: V3; look: V3; fov: number } => {
  const n = ks.length; if (f <= ks[0].f) return { pos: ks[0].pos, look: ks[0].look, fov: ks[0].fov };
  if (f >= ks[n - 1].f) return { pos: ks[n - 1].pos, look: ks[n - 1].look, fov: ks[n - 1].fov };
  let i = 0; while (f > ks[i + 1].f) i++;
  const a = ks[i], b = ks[i + 1], h = b.f - a.f, t = (f - a.f) / h, t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const m = (j: number, g: (k: CK) => number) => (j <= 0 || j >= n - 1 ? 0 : (g(ks[j + 1]) - g(ks[j - 1])) / (ks[j + 1].f - ks[j - 1].f));
  const H = (g: (k: CK) => number) => h00 * g(a) + h10 * h * m(i, g) + h01 * g(b) + h11 * h * m(i + 1, g);
  return { pos: [0, 1, 2].map((c) => H((k) => k.pos[c])) as V3, look: [0, 1, 2].map((c) => H((k) => k.look[c])) as V3, fov: H((k) => k.fov) };
};
const LIMEC = "#8bd435";
/** dock geometry (dock.ts): deck top for a sink depth, a point on the quay-side hull (ship-local x, y) */
const DECK = (sy: number) => 0.30 - sy;
const HULLX = 8.47;
const hullPt = (lx: number, ly: number, sy: number): V3 => [HULLX, -1.0 - sy + ly, -6 - lx];
/** a coin / money flash: a gold sparkle */
const goldGlint = (key: string, pos: V3, f: number) => sparkle(key, pos, f % 14, 0.22, "#ffe27a");
const ARF = {
  shieldR: [[22, -20], [8, -44]] as A2, shieldL: [[-22, -20], [-8, -44]] as A2, earR: [[26, -14], [10, -36]] as A2, earL: [[-26, -14], [-10, -36]] as A2,
  crossR: [[20, 18], [-10, 18]] as A2, crossL: [[-20, 18], [10, 18]] as A2, chinR: [[22, 10], [6, -14]] as A2, cheer: [[24, -30], [30, -66]] as A2,
};
/** soft white sea spray (no outline: it is light and water, part 14 E2), a = opacity, seed picks the shape */
const sprayCard = (key: string, pos: V3, w: number, a: number, seed = 1): FxSpec => ({
  kind: "card", key: "spray" + (seed % 4) + "_" + Math.round(a * 10), pos, w, h: w * 0.7, soft: true, cw: 192, ch: 136,
  draw: (p) => {
    const g = p.g;
    for (let i = 0; i < 9; i++) {
      const x = 30 + 132 * rnd1(i + seed * 5), y = 40 + 60 * rnd1(i + seed * 3, 78.233), r = 18 + 26 * rnd1(i + seed, 39.4);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(236,244,250,${0.75 * a})`); gr.addColorStop(1, "rgba(236,244,250,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },
});
const sprayCards = (key: string, A: V3, f: number, a: number, b: number, n = 4, size = 1.2): FxSpec[] => {
  if (f < a || f > b) return [];
  const k = Math.sin(Math.PI * lin(f, a, b));
  return Array.from({ length: n }, (_, i) => sprayCard(key + i, [A[0] + 0.3 * Math.sin(i * 2), A[1] + 0.25 * i * k, A[2] + 0.4 * i - 0.6], size * (0.6 + 0.5 * k), 0.85 * k, i + 2));
};
/** a copper penny falling into the toy boat */
const penny = (key: string, pos: V3): FxSpec => ({ kind: "card", key: "penny", pos, w: 0.06, h: 0.06, cw: 32, ch: 32,
  draw: (p) => { const g = p.g; const gr = g.createRadialGradient(12, 11, 2, 16, 16, 15); gr.addColorStop(0, "#f3b07a"); gr.addColorStop(1, "#a75a26"); g.fillStyle = gr; g.beginPath(); g.ellipse(16, 16, 14, 14, 0, 0, 6.3); g.fill(); } });
/** a fellow ship owner (top hats) laughing on the quay */
const OWN = (who: string, pos: V3, f: number, a: number, i: number, facing: number, extra: P = {}): CastPlace =>
  C(who, pos, pose(null, f >= a ? { ...laughP(f, a, i), facing, armR: [[24, 16], [12, 30]] as A2, armL: [[-26, 14], [-10, 26]] as A2, ...extra } : { expr: "tache", facing, ...extra }), { idx: 30 + i });

/** framing boxes: a standing body from y0 (0.55 = from the knees) to the hat; a seated body; a prop box */
const bod = (p: V3, y0 = 0, y1 = 2.05, w = 0.34): Box => [p, Math.min(y0, 0.1), y1, w];   // gate check 1: frame the whole figure (feet to hat), size by pad
const sitB = (p: V3): Box => [p, -0.05, 1.6, 0.34];
const boxAt = (p: V3, h: number, w: number, y0 = 0): Box => [p, y0, y0 + h, w];
/** a camera key by fit (every box inside the 9:16 frame by construction) */
const FK = (f: number, boxes: Box[], az: number, el: number, fov = 40, pad = 0.82, side = 0, lift = 0): CK => ({ f, ...fit(boxes, az, el, fov, pad, side, lift) });
const HOLD = (k: CK, f: number): CK => ({ ...k, f });
/** a point on PROSPERITY's gangplank (quay foot x 6.0 -> rail x 8.79 at z -7.4) for a sink depth */
const gangAt = (x: number, sy: number): V3 => [x, 0.1 + ((x - 6.0) / 2.79) * (0.26 - sy), -7.4];
/** the face-toward helper for the scene's own camera */
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => faceTo(id, s, f, a, b);
/** the lime stripe (scene 4/7) and the 1890 mark (scene 9) on the quay-side hull */
const stripeBox = (sy: number): Box => [[HULLX, -0.48 - sy, -8.75], 0, 0.3, 0.08];
const markBox = (sy: number): Box => [[HULLX, -0.7 - sy, -5.1], 0, 0.5, 0.26];

// ================================================= SCENE 1 (0-389) MORNING: the hook, "You see," and "She'll float."
// Frame 1: the owner (big, left) grins as the derrick drops one more net of crates onto PROSPERITY behind him; she sits
// low, water slopping at the rail; the insurer at his side waves the fat policy. One continuous camera: the two-shot,
// closer on the policy ("worth more sunk"), up and back over the worried sailors as the cargo piles on, then round to
// the gangplank where the owner pats the rail: "She'll float."
const s1Y = (f: number) => (f < 105 ? lerp(0.32, 0.8, sm(f, 40, 75)) : 0.62 + lerp(0, 0.26, sm(f, 250, 320)));
const S1DECK = (f: number): V3 => [8.95, DECK(s1Y(f)) + 0.02, -8.1];   // the hook: the owner aboard, beside his load line
const S1OWN: V3 = [6.5, 0, -4.2], S1INS: V3 = [5.7, 0, -3.4], S1DOCK: V3 = [4.0, 0, -11.2], S1SA: V3 = [4.7, 0, -8.9], S1SB: V3 = [3.9, 0, -9.8];
const s1OwnPos = (f: number): V3 => {
  const sy = s1Y(f), A: V3 = S1OWN, B: V3 = [6.05, 0.1, -7.4], Cg = gangAt(7.85, sy);
  return f < 105 ? S1DECK(f) : f < 292 ? A : f < 330 ? polyAt([A, [5.75, 0, -5.6], B], sm(f, 292, 330)).p : lerp3(B, Cg, sm(f, 330, 344));   // round the bollard, not through it
};
SHOT_CAMS[1] = () => {
  // HOOK (0-104, cold open): high over the quay edge, PROSPERITY broadside - her lime load line big across the frame,
  // the owner aboard grinning; the derrick drops a net of cargo (56) and the water climbs to the line and over it
  const A0: CK = { f: 0, pos: [4.3, 2.95, -8.8], look: [8.6, 0.15, -8.5], fov: 50 };   // the owner's hat stays inside the top edge
  const A1: CK = { f: 92, pos: [5.2, 2.5, -8.6], look: [8.8, 0.0, -8.3], fov: 46 };
  const hook = spline([A0, HOLD(A0, 46), A1, HOLD(A1, 104)]);
  // "You see," (105): the story starts on the quay - owner + insurer, the policy, the cargo piling on, the pat
  const Bk = FK(105, [bod(S1OWN), bod(S1INS)], 228, 2, 40, 0.68);
  const Cw = FK(300, [bod(S1SA), bod(S1SB), bod(s1OwnPos(310)), bod(s1OwnPos(330)), boxAt([9.6, DECK(0.88), -8.2], 1.9, 0.6)], 285, 12, 46, 0.88);
  // the push-in stays on the quay side (az 300): the old orbit to az 205 swept the camera through the two sailors
  // (a huge sailor cut by the left edge at 346-354); now they slide out of frame left and PROSPERITY's hull sits behind his pat
  const D = FK(362, [bod(s1OwnPos(370), 0, 2.15), boxAt([8.8, DECK(0.88) + 0.1, -7.4], 1.1, 0.25)], 290, 5, 38, 0.64);
  const path = spline([Bk, HOLD(Bk, 215), Cw, HOLD(Cw, 335), D, HOLD(D, 389)]);
  return [K(0, F((f) => hook(f), 0, 0.0008), 24, true), K(105, F((f) => path(f), 105, 0.0008), 0, true)];
};
KICKS.push([56 / 30, 0.2]);
SHOT_ACTS[1] = (f, s) => {
  const sy = s1Y(f), ownPos = s1OwnPos(f);
  const cyc = (g: number) => (g < 40 ? { a: sm(g, 0, 40), h: 3.4, load: 1 } : g < 56 ? { a: 1, h: lerp(3.4, 1.6, sm(g, 40, 56)), load: 1 } : { a: 1 - sm(g, 70, 140), h: lerp(1.6, 3.4, sm(g, 60, 110)), load: 0 });
  const cr = f < 230 ? cyc(f) : cyc(f - 250);
  const cargo = 18 + (f >= 56 ? 4 : 0) + (f >= 306 ? 4 : 0) + Math.floor(lin(f, 260, 320) * 4);
  const fShip = toward(1, s, f, S1OWN, [9.6, 0, -8.2]), fIns = toward(1, s, f, S1OWN, S1INS);
  const fNet = toward(1, s, f, S1DECK(f), [10.4, 0, -8.9]);
  const own: P = f < 105 ? flow(f, [
    [0, { expr: "scheme", facing: fNet, armR: AR.waveR, armRFront: true, armL: AR.hipL, tilt: -3 }],
    [44, { expr: "scheme", facing: fNet, armR: [[26, -20], [44, -50]] as A2, armRFront: true, armL: AR.hipL }, 4],     // wind-up: "bring it down!"
    [52, { expr: "scheme", facing: fNet, armR: AR.pointR, armRFront: true, armL: AR.hipL, tilt: 3 }, 3],               // the drop
    [76, { expr: "tacheUp", facing: -fNet, armR: ARF.cheer, armRFront: true, armL: AR.hipL }, 4],                      // "got rich"
  ]) as P : f < 292 ? flow(f, [
    [0, { expr: "scheme", facing: fShip, tilt: -3, armR: AR.waveR, armRFront: true, armL: AR.hipL }],
    [48, { expr: "scheme", facing: fShip, armR: AR.pointR, armRFront: true, armL: AR.hipL, headTilt: 3 }, 6],
    [76, { expr: "scheme", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL }, 4],   // "rich"
    [150, { expr: "sly", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL, look: -0.5 }, 6],
    [205, { expr: "scheme", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: [[-22, -6], [-34, -22]] as A2, headTilt: -4 }, 6],
    [245, { expr: "scheme", facing: fShip, armR: AR.waveR, armRFront: true, armL: AR.hipL, propR: "moneybag" }, 6],
  ]) as P : f < 344 ? { expr: "scheme", mode: "walk", phase: walkPh(Math.hypot(ownPos[0] - S1OWN[0], ownPos[2] - S1OWN[2]) + Math.max(0, ownPos[0] - 6.05)), facing: toward(1, s, f, ownPos, f < 330 ? [6.05, 0, -7.4] : [8.8, 0, -7.4]), armR: AR.hipR, armL: AR.hipL }
    : flow(f, [
      [344, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: [[24, 10], [40, 8]] as A2, armRFront: true, armL: AR.hipL }],
      [346, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],          // pat
      [352, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: [[30, 6], [52, 6]] as A2, armRFront: true, armL: AR.hipL, tilt: 3 }, 3],
      [358, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],          // pat
      [366, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, headTilt: 4 }, 3],
    ]) as P;
  const fO = toward(1, s, f, S1INS, S1OWN);
  const ins: P = flow(f, [
    [0, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }],
    [70, { expr: "fakegrin", facing: fO, armR: ARMS.reachR, armRFront: true, propR: "moneybag" }, 3],               // hands over the bag on "rich"
    [82, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }, 6],
    [158, { expr: "scheme", facing: fO, armR: AR.liftHiR, armRFront: true, propR: "deed", headTilt: 3 }, 4],       // the policy up: "insured for more than it was worth"
    [228, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }, 6],
  ]) as P;
  const fSh = toward(1, s, f, S1SA, [9.6, 0, -8.2]);
  const sA: P = flow(f, [[0, { expr: "worry", facing: fSh, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }], [304, { expr: "worry", facing: fSh, sweat: 1, armR: ARF.chinR, armRFront: true }, 4]]) as P;
  const sB: P = flow(f, [[0, { expr: "worry", facing: fSh, look: 0.4 }], [304, { expr: "worry", facing: fSh, armR: ARF.earR, armRFront: true }, 3], [340, { expr: "worry", facing: fSh, armR: ARF.earR, armRFront: true }, 6]]) as P;
  const crank = Math.sin(st(f) * 0.5);
  const dk: P = { expr: "strain", facing: toward(1, s, f, S1DOCK, [4.4, 0, -12.6]), armR: [[24, 4 + 8 * crank], [44, -6 - 14 * crank]] as A2, armRFront: true, armL: [[18, 10], [34, 0]] as A2, tilt: -4 };
  return {
    ctl: { shipY: sy, cargo, craneA: cr.a, craneH: cr.h, craneLoad: cr.load, awash: f < 105 ? sm(f, 58, 80) * 0.5 : sm(f, 270, 330) * 0.6, steam: 0.5, gang: 1, punt: 0, line: f < 105 ? 1 : 0, ghost: f < 105 ? 1 : 0 },
    cast: [
      C("owner", ownPos, speak(f, 371, 384, own), { idx: 1, air: f < 105 || f >= 330 }),
      C("insurer", S1INS, pose(null, ins), { idx: 2 }),
      C("docker", S1DOCK, pose(null, dk), { idx: 3 }),
      C("sailorA", f < 105 ? [3.0, 0, -6.4] : S1SA, pose(null, sA), { idx: 4 }),
      C("sailorB", f < 105 ? [2.4, 0, -7.2] : S1SB, pose(null, sB), { idx: 5 }),
    ],
    fx: fxs(...splash("s1a", [9.6, DECK(sy) + 0.2, -8.4], (f - 56) % 250, 1.6), ...splash("s1b", [9.3, DECK(sy) + 0.2, -9.4], (f - 306) % 250, 1.6),
      f >= 72 && f < 100 ? goldGlint("bag", [ownPos[0], 1.75, ownPos[2] + 0.25], f) : null),
    focus: f < 105 ? [HULLX, -0.9, -8.6] : [ownPos[0], ownPos[1] + 1.5, ownPos[2]], subj: "owner",
  };
};

// ================================================= SCENE 2 (389-452) THE GALE, NIGHT: "She doesn't. Insurance pays out."
// Cut on "doesn't": the twin coffin ship ploughs into a sea; lightning; she goes down by the bow while the three
// sailors pull hard in the lifeboat in the foreground; the camera rides the swell beside the boat.
const s2u = (f: number) => 0.1 + 0.9 * lin(f, 389, 452);
SHOT_CAMS[2] = () => [K(389, (f) => {
  const bp = boatAt(f / 30, s2u(f)), away: V3 = [-0.81, 0, 0.58];
  const pos: V3 = [bp[0] + 4.9 * away[0], 2.4 + 0.18 * Math.sin(f * 0.07), bp[2] + 4.9 * away[2]];   // a little higher, looking down into the boat: the rowers sit mid-frame, above the captions
  const look = lerp3([bp[0], bp[1] + 0.15, bp[2]], [0.5, 1.0, -0.4], 0.1);
  return { pos, look, fov: 50, roll: 0 };
}, 24, true)];
KICKS.push([396 / 30, 0.45]);
SHOT_ACTS[2] = (f) => {
  const t = f / 30, bp = boatAt(t, s2u(f));
  const rower = (who: string, dx: number, i: number): CastPlace => {
    const u = Math.sin(t * 4.2 + i * 0.2);
    return C(who, [bp[0] + dx * Math.cos(0.5), bp[1] - 0.15, bp[2] + dx * Math.sin(0.5)], pose(null, { mode: "sit", expr: i === 1 ? "yikes" : "breakdown", facing: 1, tilt: -10 * u, wet: 1, armR: [[26, 10 - 10 * u], [48, 14 - 18 * u]] as A2, armL: [[18, 12 - 10 * u], [40, 18 - 18 * u]] as A2, armRFront: true }), { idx: 10 + i, scale: 0.9, blob: false });
  };
  return {
    ctl: { sink: lerp(0.95, 2.45, sm(f, 396, 450)), flash: Math.max(0, 1 - Math.abs(f - 396) / 5) + 0.6 * Math.max(0, 1 - Math.abs(f - 430) / 4), boatX: s2u(f), spray: 0.7 },
    cast: [rower("sailorA", -0.8, 0), rower("sailorB", 0.15, 1), rower("sailorC", 1.0, 2)],
    focus: [bp[0], bp[1] + 0.7, bp[2]], subj: "sailorB",
  };
};

// ================================================= SCENE 3 (452-562) NEXT MORNING: two more ships; 2,000 sailors to court
// The owner beams over the money bag and points down the quay at GOOD FORTUNE ("he buys two more"); the insurer
// smiles. The camera slides along the quay to her gangplank where the sailors refuse, arms crossed; the constable takes
// one by the collar and marches him off toward the MAGISTRATES' COURT.
const S3OWN: V3 = [5.4, 0, -15.0], S3INS: V3 = [4.6, 0, -15.4];
// v10.14 rule 7 / part 16 A4 (f505 had four in a row facing the camera): staggered for the 305 deg camera - sailorC in
// front on the right (biggest), sailorB in the middle (the one who gets grabbed), sailorA at the back right, the constable
// coming in from the back left and taking sailorB's collar from the open side
const S3SA: V3 = [6.3, 0, -19.7], S3SB: V3 = [4.49, 0, -20.56], S3SC: V3 = [4.01, 0, -19.5], S3COP: V3 = [4.38, 0, -21.77];
const S3GRAB: V3 = [-0.46, 0, -0.66];   // the constable's place beside the sailor (across the camera, never behind him)
const S3MARCH: V3[] = [[4.49, 0, -20.56], [1.2, 0, -18.4]];
SHOT_CAMS[3] = () => {
  const A = FK(452, [bod(S3OWN), bod(S3INS)], 272, 4, 40, 0.64);   // from the quay side: the derrick's rope falls behind them, not across the owner
  const Bk = FK(500, [bod(S3SA, 0.4), bod(S3SB, 0.4), bod(S3SC, 0.4), bod(S3COP, 0.4)], 305, 18, 54, 0.86);   // closer, wider and from above: the front sailor clearly biggest and lowest, the stagger reads   // closer and wider: the front sailor clearly biggest
  const Cc = FK(562, [bod(S3MARCH[1]), bod(add3(S3MARCH[1], S3GRAB[0], 0, S3GRAB[2]))], 70, 4, 42, 0.56);
  const path = spline([A, HOLD(A, 474), Bk, HOLD(Bk, 512), Cc]);
  return [K(452, F((f) => path(f), 452, 0.0008), 24, true)];
};
SHOT_ACTS[3] = (f, s) => {
  const fShip = toward(3, s, f, S3OWN, [11.0, 0, -24]);
  const own: P = flow(f, [
    [452, { expr: "scheme", facing: fShip, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL }],
    [458, { expr: "scheme", facing: fShip, armL: [[-28, -6], [-56, -12]] as A2, armLFront: true, armR: [[22, 4], [30, -18]] as A2, propR: "moneybag", tilt: 3 }, 3],   // "two more"
    [496, { expr: "sly", facing: fShip, armR: [[22, 4], [30, -18]] as A2, propR: "moneybag", armL: AR.hipL, look: 0.6 }, 6],
  ]) as P;
  const ins: P = { expr: "fakegrin", facing: toward(3, s, f, S3INS, S3OWN), armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" };
  const w = walkPath(3, s, S3MARCH, f, 506, 562);
  const fCop = toward(3, s, f, S3COP, S3SB);
  const cop: P = f < 506 ? flow(f, [[452, { expr: "tache", facing: fCop, armR: AR.hipR, armL: AR.hipL }], [488, { expr: "tache", facing: fCop, armR: AR.pointR, armRFront: true, armL: AR.hipL }, 4]]) as P
    : { expr: "tache", mode: "walk", phase: w.phase, facing: w.facing, armR: [[26, -4], [40, -18]] as A2, armRFront: true };
  const fSh = toward(3, s, f, S3SB, S3COP);
  const sB: P = f < 506 ? flow(f, [[452, { expr: "angry", facing: -fSh, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }], [490, { expr: "worry", facing: fSh }, 3]]) as P
    : { expr: "worry", mode: "walk", phase: (w.phase + 0.5) % 1, facing: w.facing, tilt: 6 };
  const copPos: V3 = f < 506 ? lerp3(S3COP, add3(S3SB, S3GRAB[0], 0, S3GRAB[2]), sm(f, 490, 506)) : add3(w.p, S3GRAB[0], 0, S3GRAB[2]);
  const sBpos: V3 = f < 506 ? S3SB : w.p;
  const cross: P = { armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true };
  return {
    ctl: { shipY: 0.25, cargo: 12, craneA: 1, craneH: 3.0, steam: 0.4, gang: 1 },
    cast: [
      C("owner", S3OWN, pose(null, own), { idx: 1 }), C("insurer", S3INS, pose(null, ins), { idx: 2 }),
      C("sailorA", S3SA, pose(null, flow(f, [[452, { expr: "angry", facing: toward(3, s, f, S3SA, S3COP), ...cross }], [508, { expr: "worry", facing: toward(3, s, f, S3SA, sBpos), ...cross }, 4]]) as P), { idx: 4 }),
      C("sailorB", sBpos, pose(null, sB), { idx: 5 }),
      C("sailorC", S3SC, pose(null, flow(f, [[452, { expr: "angry", facing: toward(3, s, f, S3SC, S3COP), armR: [[26, -8], [46, -22]] as A2, armRFront: true, armL: AR.hipL, tilt: -5 }],   // shakes his head and points back at the ship: not going
        [470, { expr: "cold", facing: toward(3, s, f, S3SC, S3COP), armR: [[26, -12], [48, -30]] as A2, armRFront: true, armL: AR.hipL, tilt: -3 }, 4],
        [512, { expr: "worry", facing: toward(3, s, f, S3SC, sBpos), armR: AR.hipR, armL: AR.hipL, tilt: 4 }, 4]]) as P), { idx: 6 }),
      C("constable", copPos, pose(null, cop), { idx: 7 }),
    ],
    fx: fxs(f >= 452 && f < 470 ? goldGlint("bag3", [S3OWN[0], 1.75, S3OWN[2] + 0.25], f) : null),
    focus: f < 495 ? [S3OWN[0], 1.5, S3OWN[2]] : [sBpos[0], 1.5, sBpos[2]], subj: f < 495 ? "owner" : "sailorB",
  };
};

// ================================================= SCENE 4 (562-784) MIDDAY: Plimsoll and his one line of paint
// He strolls up the quay past the owners with a paint pot, hops down into the painter's punt beside PROSPERITY and,
// kneeling, paints one lime stripe along her hull ("One line of paint.") - the brush moves, the stripe grows under it.
// Up on the quay the owners laugh (one, then all) and the owner points: "Paintbrush Plimsoll!"
const S4WALK: V3[] = [[5.7, 0, -10.0], [6.35, 0, -8.0]];
const S4PUNT0: V3 = [7.55, -0.73, -7.95];
const S4PLEND: V3 = [7.55, -0.73, -9.25];
const S4HOWL_AZ = 330;
const S4O1: V3 = [4.6, 0, -10.2], S4O2: V3 = [3.6, 0, -9.8], S4O3: V3 = [5.6, 0, -11.35];   // dealer4 starts inside the bollard line so his walk passes clear of the bollard at (6.2, -9.9)   // staggered front-left to back-right
// while he hops into the punt the owners stroll over to the quay edge to watch him (626-660), then howl down at him
const S4H1: V3 = [5.25, 0, -9.2], S4H2: V3 = [4.46, 0, -8.73], S4H3: V3 = [5.95, 0, -9.45];   // staggered for the 330 deg camera: front (dealer2) biggest, middle (owner), back (dealer4), each 0.45 m apart across the frame   // a row across the camera: no head behind another
const s4Own = (a: V3, b: V3, f: number) => lerp3(a, b, sm(f, 646, 684));
const s4OwnWalk = (a: V3, b: V3, f: number): P => (f > 646 && f < 684 ? { mode: "walk", phase: walkPh(Math.hypot(b[0] - a[0], b[2] - a[2]) * sm(f, 646, 684)) } : {});
const s4Pl = (f: number): V3 => (f < 566 ? S4WALK[0] : f < 624 ? lerp3(S4WALK[0], S4WALK[1], sm(f, 566, 624)) : f < 648 ? lerp3(S4WALK[1], S4PUNT0, sm(f, 630, 648)) : [S4PUNT0[0], S4PUNT0[1], lerp(S4PUNT0[2], -9.25, sm(f, 690, 714))]);
SHOT_CAMS[4] = () => {
  const A = FK(562, [bod(S4WALK[0]), bod(S4O1), bod(S4O2), bod(S4O3), boxAt([8.3, -0.6, -9.6], 2.6, 1.5)], 342, 11, 46, 0.6);   // v10.16 wide place shot: he strolls in along the busy quay beside PROSPERITY (a journey)
  const A2k = FK(620, [bod(S4WALK[1])], 20, 3, 42, 0.46);   // from over the water: the quay bollards stay behind the camera's left
  const Bk = FK(660, [bod([S4PUNT0[0], S4PUNT0[1], -8.0], 0, 1.55, 0.5), bod([S4PUNT0[0], S4PUNT0[1], -9.25], 0, 1.55, 0.5), stripeBox(0.1)], 350, 3, 40, 0.54);
  // the howl (v10.15 rule 4): the owners laughing up on the quay and Plimsoll calm in his punt in ONE frame
  const Cc = FK(730, [body(S4H1, 0.75, 2.1, 0.3), body(S4H2, 0.75, 2.1, 0.3), body(S4H3, 0.75, 2.1, 0.3), body(S4PLEND, 0.7, 1.45, 0.35)], S4HOWL_AZ, 14, 44, 0.9);   // knees up: owners above, his head and shoulders below-right
  const Dk = FK(760, [bod(S4H1), bod(S4H2), bod(S4H3)], 338, 3, 42, 0.54);   // low angle, pushed in on the laughing trio as the owner points down: "Paintbrush Plimsoll!" (the group's mockery)   // low-angle close-up on the owner's quote, the others laughing behind
  const path = spline([A, HOLD(A, 580), A2k, Bk, HOLD(Bk, 708), Cc, HOLD(Cc, 748), Dk, HOLD(Dk, 784)]);
  return [K(562, F((f) => path(f), 562, 0.0008), 24, true)];
};
SHOT_ACTS[4] = (f, s) => {
  const sy = 0.1, lineK = sm(f, 690, 714), plPos = s4Pl(f);
  const wk = walkPh(Math.hypot(plPos[0] - S4WALK[0][0], plPos[2] - S4WALK[0][2]));
  const fHull = toward(4, s, f, plPos, [8.6, -0.5, plPos[2]]);
  const pl: P = f < 624 ? { expr: "determined", mode: f > 566 ? "walk" : "stand", phase: wk, facing: toward(4, s, f, S4WALK[0], S4WALK[1]), propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, propR: "paintBrush", armR: [[24, 20], [16, 36]] as A2, armRFront: true }
    : f < 650 ? { expr: "determined", mode: "hop", lift: 0.45 * bump(lin(f, 630, 648)), facing: fHull, propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, propR: "paintBrush", armR: [[24, 20], [16, 36]] as A2 }
    : flow(f, [
      [650, { ...PZ_KNEEL, expr: "calm", facing: fHull, kneelK: 0.4 }],
      [660, { ...PZ_KNEEL, expr: "calm", facing: fHull, kneelK: 1, headTilt: -3 }, 8],
      [686, { ...PZ_KNEEL, expr: "determined", facing: fHull, kneelK: 1, armR: [[30, 14], [60, 18]] as A2 }, 4],       // wind-up
      [692, { ...PZ_KNEEL, expr: "determined", facing: fHull, kneelK: 1, armR: [[30, 22], [62, 34]] as A2, tilt: 6 }, 3],   // the stroke
      [716, { ...PZ_KNEEL, expr: "bored", facing: fHull, kneelK: 1, armR: [[26, 4], [40, -8]] as A2 }, 6],   // deadpan vs the laughing owners (rule 4)
      [744, { ...PZ_KNEEL, expr: "bored", facing: toward(4, s, f, plPos, S4H1), kneelK: 1, armR: [[26, 4], [40, -8]] as A2, look: 0.6 }, 6],
    ]) as P;
  const fO = (p: V3) => toward(4, s, f, p, plPos);
  const o1 = s4Own(S4O1, S4H1, f), o2 = s4Own(S4O2, S4H2, f), o3 = s4Own(S4O3, S4H3, f);
  const ownA: P = f < 720 ? { expr: "tache", facing: fO(o1), armR: AR.hipR, armL: AR.hipL, ...s4OwnWalk(S4O1, S4H1, f) }
    : f < 729 ? { expr: "mock", facing: fO(o1), armR: AR.hipR, armL: AR.hipL, headBack: 0.15 }
    : f < 746 ? { ...laughP(f, 729, 0), facing: fO(o1) }
    : speak(f, 749, 780, { expr: "mock", facing: fO(o1), armR: AR.pointR, armRFront: true, armL: AR.hipL, tilt: 4 });
  return {
    ctl: { shipY: sy, cargo: 10, line: lineK, punt: 1, puntZ: -8.5, gang: 0, steam: 0.4, craneA: 0.1 },
    cast: [
      C("plimsoll", plPos, pose(null, pl), { idx: 1, air: f >= 630 }),
      C("owner", o1, pose(null, ownA), { idx: 2 }),
      OWN("dealer2", o2, f, 729, 1, fO(o2), f >= 720 && f < 729 ? { expr: "mock", headBack: 0.15 } : s4OwnWalk(S4O2, S4H2, f)),
      OWN("dealer4", o3, f, 729, 2, fO(o3), f >= 720 && f < 729 ? { expr: "mock", headBack: 0.15 } : s4OwnWalk(S4O3, S4H3, f)),
    ],
    fx: fxs(f >= 690 && f <= 716 ? sparkle("lime", [HULLX - 0.06, -0.48 - sy, -7.9 - 1.7 * lineK], (f - 690) % 10, 0.14, "#d8ff9a") : null),
    focus: f < 640 ? [plPos[0], plPos[1] + 1.5, plPos[2]] : f < 712 ? [HULLX, -0.3, -8.6] : f < 748 ? [6.3, 0.9, -9.2] : [S4H1[0], 1.5, S4H1[2]], subj: f < 712 ? "plimsoll" : "owner",
  };
};
const PZ_KNEEL: P = { mode: "kneel", armR: [[30, 20], [62, 30]] as A2, armRFront: true, propR: "paintBrush", propRAng: 1.35, armL: [[-20, 36], [-24, 66]] as A2, propL: "paintPot" };

// ================================================= SCENE 5 (784-1108) THE COMMONS, 1875 (day)
// The Speaker holds up PLIMSOLL'S BILL and drops it in the basket ("drops his law"); the front benches laugh. Plimsoll
// marches up beside the table, shakes his fist in the Speaker's face (the Speaker leans back), turns on the benches:
// "villains!" (they gasp together). He bows stiffly (apologises); the newsboy runs in waving the paper; they cheer.
const SEAT = (side: number, tier: number, z: number): V3 => [side * (2.5 + tier * 1.05 + 0.35), tier * 0.42 + 0.46, z];
const S5SPK: V3 = [0, 0.5, -13.9], S5FIST: V3 = [0.4, 0, -12.25], S5PL1: V3 = [0.35, 0, -12.0], S5WALK: V3[] = [[1.0, 0, -7.9], [1.7, 0, -9.9], S5PL1];   // he waits in the aisle, inside the wide shot
const S5MP: [string, V3, number][] = [["mp1", SEAT(1, 0, -10.2), 1], ["mp2", SEAT(1, 1, -8.6), 1], ["mp3", SEAT(-1, 1, -9.2), -1], ["mp4", SEAT(-1, 0, -9.7), -1]];
const S5BOY: V3[] = [[1.6, 0, -4.4], [1.55, 0, -10.4]];
const s5Pl = (f: number) => polyAt(S5WALK, sm(f, 848, 920)).p;
const BASKET: Box = [[1.15, 0.5, -12.9], 0, 0.45, 0.25];
SHOT_CAMS[5] = () => {
  const Aw: CK = { f: 784, pos: [0.6, 3.2, -3.0], look: [0, 1.0, -13.0], fov: 58 };   // v10.16 wide place shot: down the Commons between the benches to the Speaker, 1875
  const A = FK(822, [sitB(S5SPK), BASKET], 15, 3, 38, 0.6);
  const A2k = FK(838, [sitB(S5MP[0][1])], 290, 6, 40, 0.6);   // one clear subject: the front-bench MP laughing, the rest behind
  const Bk: CK = { f: 872, pos: [1.7, 1.15, -12.4], look: [1.7, 1.35, -7.6], fov: 60 };   // low and wide down the aisle: he marches at us, the benches either side, no MP cut by the edge   // ahead of him: he marches at us, face lit
  const Cc: CK = { f: 926, pos: [2.0, 1.2, -10.9], look: [-0.25, 1.5, -13.2], fov: 56 };   // low two-shot from the aisle: his fist up close on the left, the Speaker recoiling behind on the right (overlapping depths)
  const D: CK = { f: 970, pos: [-2.2, 0.95, -13.0], look: [1.3, 1.4, -11.06], fov: 50 };   // low-angle close-up: Plimsoll shouting at us on the left, the gasping MPs behind him on the right (mp1 centre, mp2 right), not stacked
  const E = FK(1080, [bod(S5FIST), bod(S5BOY[1])], 0, 14, 42, 0.8);
  // final-render review (in-between frames, not only the gate's key frames): the 10-12 frame whips between these keys showed
  // an empty wall (840), swept the camera past Plimsoll's head (961-965) and left the aisle empty while he walked past the lens
  // (894-913). Now: cuts on the words (law/completely 845, "So," 870, "shakes" 922, "calls" 963), a pan with his march to the
  // Speaker, and the D->E orbit keeps its eye on Plimsoll (the room corner was empty at 1053-1066).
  void Bk;
  const path = spline([Aw, HOLD(Aw, 804), A, HOLD(A, 844)]);
  const pl5 = (f: number): V3 => (f < 848 ? S5WALK[0] : f < 920 ? s5Pl(f) : lerp3(S5PL1, S5FIST, sm(f, 914, 926)));
  const mid2: V3 = [0.2, 1.7, -12.8];   // between his head at the table end and the Speaker's
  const pov = (f: number) => { const p = pl5(f); return { pos: [-1.9, 1.7, -8.4] as V3, look: lerp3([p[0], 1.55, p[2]], mid2, sm(f, 898, 918)), fov: 50 }; };   // from the opposite bench end: the camera pans with him past the laughing benches and settles on him and the Speaker
  const DF: CK = { ...D, f: 963, pos: add3(D.pos, 0.05, 0, -0.25), look: add3(D.look, 0.05, 0, -0.25) };   // D moved with him onto S5FIST
  const M5: CK = { f: 1058, pos: [-2.0, 1.7, -10.2], look: [S5FIST[0], 1.45, S5FIST[2]], fov: 46 };   // the orbit keeps ~3 m from him (it swung to 1.9 m: his head filled 63% of the width)
  const orb = spline([DF, HOLD(DF, 1040), M5, E, HOLD(E, 1108)]);
  const plHead: V3 = [S5FIST[0], 1.45, S5FIST[2]];
  const orbit = (f: number) => { const c = orb(f), w = sm(f, 1032, 1044) * (1 - sm(f, 1068, 1080)); return { ...c, look: lerp3(c.look, plHead, w) }; };
  const still = (k: CK) => () => ({ pos: k.pos, look: k.look, fov: k.fov });
  return [K(784, F((f) => path(f), 784, 0.0008), 24, true), K(845, F(still(A2k), 845, 0.0008), 0, true), K(870, F(pov, 870, 0.0008), 0, true),
    K(922, F(still(Cc), 922, 0.0008), 0, true), K(963, F(orbit, 963, 0.0008), 0, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const plPos = f < 848 ? S5WALK[0] : f < 920 ? s5Pl(f) : lerp3(S5PL1, S5FIST, sm(f, 914, 926));   // he stays where he shook his fist (a step back slid him out of the fist shot's left edge); D is framed on this spot   // leans in for the fist, steps back to face the benches
  const w = walkPath(5, s, S5WALK, f, 848, 920);
  const fSpk = toward(5, s, f, plPos, S5SPK), fBench = toward(5, s, f, S5FIST, S5MP[1][1]);
  const pl: P = f < 848 ? { expr: "determined", facing: fSpk, armR: AR.hipR, armL: AR.hipL }
    : f < 920 ? { expr: "determined", mode: "walk", phase: w.phase, facing: w.facing, armR: [[24, 10], [28, 2]] as A2, armL: [[-24, 20], [-14, 34]] as A2 }
    : flow(f, [
      // v10.15 E: the anger builds word by word, never before the phrase: (wind-up held) "shakes" brows drop,
      // "his" teeth grit, "fist" the full fury face; held through "in his face" and the shout of "villains"
      [920, { expr: "determined", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true }],
      [924, { expr: "angry", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],        // "shakes": brows drop, fist shakes
      [930, { expr: "angry", mouthX: "grit", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true, tilt: -2 }, 2],   // "his": teeth grit
      [936, { expr: "fury", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],   // "fist" (937): full fury
      [942, { expr: "fury", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true, tilt: -2 }, 2],
      [948, { expr: "fury", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],
      ...Array.from({ length: 10 }, (_, i): [number, P, number] => [964 + i * 4, { expr: "fury", facing: 0, mouth: i < 9 ? "tOBig" : "tWide", armR: i % 2 ? [[26, -6], [44, -22]] as A2 : [[26, -14], [48, -34]] as A2, armRFront: true, armL: AR.hipL, tilt: i % 2 ? -2 : 2 }, 2]),   // "villains!": at us, fist shaking, mouth wide
      [1005, { expr: "sheepish", facing: fBench, tilt: 0, armR: [[20, 20], [8, 34]] as A2, armL: [[-20, 20], [-8, 34]] as A2 }, 2],   // "He has to": the fury drops off his face
      [1010, { expr: "sheepish", facing: fBench, tilt: 22, armR: [[20, 20], [8, 34]] as A2, armL: [[-20, 20], [-8, 34]] as A2, headTilt: 6 }, 6],   // "apologize" (1016): a stiff bow
      [1034, { expr: "smug", facing: fBench, tilt: 0, armR: AR.hipR, armL: AR.hipL, look: 0.6 }, 6],
      [1080, { expr: "proud", facing: fBench, armR: AR.tipHatR, armRFront: true, armL: AR.hipL }, 4],
    ]) as P;
  const fP = toward(5, s, f, S5SPK, plPos);
  const spk: P = flow(f, [
    [784, { mode: "sit", expr: "tache", facing: fP, armR: AR.liftR, armRFront: true }],
    [824, { mode: "sit", expr: "tacheUp", facing: fP, armR: [[24, 6], [40, 0]] as A2, armRFront: true }, 3],                    // lets it drop
    [866, { mode: "sit", expr: "tache", facing: fP, armR: AR.hipR, look: 0.5 }, 6],
    [922, { mode: "sit", expr: "aghast", facing: fP, tilt: -12, armR: ARF.shieldR, armRFront: true }, 2],                   // the fist
    [1004, { mode: "sit", expr: "tacheUp", facing: fP, tilt: -4, armR: AR.hipR }, 6],
    [1052, { mode: "sit", expr: "tache", facing: fP, armR: AR.hipR, look: 0.6 }, 6],
  ]) as P;
  const mp = (who: string, pos: V3, i: number): CastPlace => {
    const fc = toward(5, s, f, pos, f < 870 ? S5SPK : plPos);
    const o: P = f < 870 ? (f >= 834 ? { ...laughP(f, 834, i), mode: "sit", facing: fc } : { mode: "sit", expr: "tache", facing: fc })
      : f < 982 ? { mode: "sit", expr: "tache", facing: fc }
      : f < 1030 ? { mode: "sit", expr: "aghast", facing: fc, tilt: -8, armR: ARF.shieldR, armRFront: true }               // gasp together on "villains", held ~1.5 s
      : f < 1080 ? { mode: "sit", expr: "tacheUp", facing: fc }                                                               // smug again while he has to apologise
      : { mode: "sit", expr: "worry", facing: fc };                                                                            // "Britain takes his side": the doubters sweat
    return C(who, pos, pose(null, o), { idx: 20 + i });
  };
  const bw = walkPath(5, s, S5BOY, f, 1036, 1074);
  const boy: P = f < 1074 ? { expr: "beam", mode: "run", phase: (f / 8) % 1, facing: bw.facing, propR: "newspaper", armR: [[24, -10], [30, -40]] as A2, armRFront: true }
    : speak(f, 1078, 1100, { expr: "beam", facing: toward(5, s, f, S5BOY[1], S5MP[1][1]), propR: "newspaper", armR: [[24, -10], [30, -40]] as A2, armRFront: true });
  return {
    ctl: { bill: f < 824 ? 1 : 1 - sm(f, 824, 850), billX: 0.42, billY: 1.95, billZ: -13.45 },
    cast: [
      C("speaker", S5SPK, pose(null, spk), { idx: 1 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 2 }),
      ...S5MP.map(([who, pos], i) => mp(who, pos, i)),
      ...(f >= 1036 ? [C("newsboy", f < 1074 ? bw.p : S5BOY[1], pose(null, boy), { idx: 9 })] : []),
    ],
    fx: fxs(f >= 924 && f < 958 ? squiggles("fist", [S5PL1[0] - 0.1, 2.15, S5PL1[2] - 0.5], f, "#ffffff", 0.3) : null),
    focus: f < 845 ? [S5SPK[0], 1.9, S5SPK[2]] : f < 870 ? [S5MP[0][1][0], 1.6, S5MP[0][1][2]] : [plPos[0], 1.5, plPos[2]], subj: f < 845 ? "speaker" : f < 870 ? "mp1" : "plimsoll",
  };
};

// ================================================= SCENE 6 (1108-1296) GOLDEN HOUR, 1876: the law, and the smokestack
// The inspector nails the notice to the post (EVERY SHIP MUST CARRY A LOAD LINE); Plimsoll beams beside it. The owner
// smirks, and up on PROSPERITY's funnel ladder he paints his line round the smokestack; Plimsoll's hand meets his face.
const S6CLERK: V3 = [4.25, 0, -7.25], S6PL: V3 = [2.75, 0, -6.45], S6PL2: V3 = [5.7, 0, -5.15], S6OWN: V3 = [9.15, 1.2, -6.4];
const S6OWNQ: V3 = [4.95, 0, -5.75];   // staggered round the board: the owner in front right (biggest, the reaction), Plimsoll middle left, the inspector at the board behind
const S6RUN: V3[] = [S6OWNQ, [6.05, 0.1, -7.4], gangAt(8.6, 0.12), [9.1, DECK(0.12) + 0.02, -6.9]];
const s6Own = (f: number): V3 => (f < 1180 ? S6OWNQ : f < 1222 ? polyAt(S6RUN, sm(f, 1180, 1222)).p : lerp3(S6RUN[3], S6OWN, sm(f, 1222, 1240)));
const s6Pl = (f: number): V3 => lerp3(S6PL, S6PL2, sm(f, 1186, 1232));
SHOT_CAMS[6] = () => {
  const A = FK(1108, [bod(S6CLERK), bod(S6PL), bod(S6OWNQ), boxAt([3.6, 1.3, -7.5], 0.9, 0.35)], 8, 3, 42, 0.86);
  const Bk = FK(1240, [bod(S6OWN, 0, 2.05, 0.45)], 250, -10, 58, 0.38);
  const Cc: CK = { f: 1264, pos: [3.6, 1.0, -2.2], look: [6.33, 1.8, -5.13], fov: 54 };   // low angle: Plimsoll's calm facepalm in front left, the owner gloating up on the funnel behind right (opposite faces, not stacked)
  const A2 = FK(1138, [body(S6OWNQ, 0.5, 2.15, 0.34)], 15, 2, 42, 0.62);   // "the law passes": in on the owner's shock (reaction close-up)
  const path0 = spline([A, HOLD(A, 1128), A2, HOLD(A2, 1194), Bk, HOLD(Bk, 1263)]);
  const path = (f: number) => { const c = path0(f), o = s6Own(f), w = sm(f, 1184, 1196) * (1 - sm(f, 1228, 1240)); return { ...c, look: lerp3(c.look, [o[0], o[1] + 1.1, o[2]] as V3, w) }; };   // the camera keeps the running owner in frame (the dock was empty at 1203-1210)
  // punchline hard cut on "paints" (1264), same place, new angle (board AE): the old 10-frame whip popped Plimsoll in at 1263
  // and any slower move passes his head right at the lens (blurred face)
  return [K(1108, F((f) => path(f), 1108, 0.0008), 24, true), K(1264, F(() => ({ pos: Cc.pos, look: Cc.look, fov: Cc.fov }), 1264, 0.0008), 0, true)];
};
SHOT_ACTS[6] = (f, s) => {
  const hamm = f >= 1124 && f < 1150 ? Math.abs(Math.sin((f - 1124) * 0.52)) : 0;
  const fN = toward(6, s, f, S6CLERK, [3.6, 0, -7.5]);
  const clerk: P = f >= 1124 && f < 1150
    ? { expr: "tache", facing: fN, armL: [[-20, -10], [-24, -34]] as A2, armLFront: true, armR: [[24, -18 + 14 * hamm], [36, -40 + 30 * hamm]] as A2, armRFront: true, propR: "gavel" }
    : flow(f, [[1108, { expr: "tache", facing: fN, armL: [[-20, -10], [-24, -34]] as A2, armLFront: true, propR: "gavel", armR: AR.liftR }], [1150, { expr: "tache", facing: toward(6, s, f, S6CLERK, S6OWNQ), armR: AR.hipR }, 6]]) as P;
  const plPos = s6Pl(f), w = walkPath(6, s, [S6PL, S6PL2], f, 1186, 1232);
  const fUp = toward(6, s, f, plPos, S6OWN);
  const pl: P = f < 1186 ? flow(f, [
    [1108, { expr: "smile", facing: toward(6, s, f, S6PL, [3.6, 0, -7.5]), armR: AR.hipR, armL: AR.hipL, look: 0.5 }],
    [1150, { expr: "proud", facing: toward(6, s, f, S6PL, [3.6, 0, -7.5]), armR: AR.tipHatR, armRFront: true }, 4],
  ]) as P : f < 1232 ? { expr: "calm", mode: "walk", phase: w.phase, facing: w.facing }
    : flow(f, [
      [1232, { expr: "calm", facing: fUp, look: 0.9 }],
      [1262, { expr: "bored", facing: fUp, look: 0.9 }, 3],
      [1276, { expr: "calm", facing: fUp, armR: [[22, -6], [6, -30]] as A2, armRFront: true, tilt: 6 }, 3],             // facepalm, eyes calmly shut
    ]) as P;
  const fFun = toward(6, s, f, S6OWN, [10.4, 1.5, -6.4]), ownPos = s6Own(f), fNo = toward(6, s, f, S6OWNQ, [3.6, 0, -7.5]);
  const ow = walkPath(6, s, S6RUN, f, 1180, 1222);
  const brushUp: P = { propR: "paintBrush", propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, armRFront: true };
  const own: P = f < 1180 ? flow(f, [
    [1108, { expr: "tacheUp", facing: fNo, armR: AR.hipR, armL: AR.hipL }],                                          // smug: no law will touch him
    [1137, { expr: "shock", facing: fNo, armR: [[24, -4], [30, -26]] as A2, armRFront: true, armL: AR.hipL, hatLift: 0.2 }, 3],   // "passes" (1139): the law passes
    [1160, { expr: "worry", facing: fNo, armR: AR.hipR, armL: AR.hipL, hatLift: 0 }, 8],                             // "every ship needs a line"
    [1172, { expr: "scheme", facing: -fNo, armR: ARF.chinR, armRFront: true, armL: AR.hipL }, 6],                    // he has an idea
  ]) as P : f < 1222 ? { expr: "scheme", mode: "run", phase: ow.phase, facing: ow.facing, ...brushUp, armR: [[24, 14], [36, 24]] as A2 }
    : f < 1240 ? { expr: "scheme", facing: fFun, ...brushUp, armR: [[28, -14 + 8 * Math.sin(f * 0.6)], [40, -40]] as A2, armL: [[-24, -16 - 8 * Math.sin(f * 0.6)], [-30, -42]] as A2 }   // climbing
    : flow(f, [
      [1240, { expr: "scheme", facing: -fFun, ...brushUp, armR: [[24, -10], [34, -30]] as A2 }],
      [1252, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -10], [52, -40]] as A2 }, 6],
      [1262, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -14], [54, -30]] as A2 }, 4],
      [1272, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -6], [52, -46]] as A2 }, 4],
      [1282, { expr: "tacheUp", facing: -fFun, ...brushUp, armR: AR.waveR }, 4],
    ]) as P;
  return {
    ctl: { shipY: 0.12, cargo: 8, notice: f >= 1132 ? 1 : 0, noticeBoard: 1, ladder: 1, funnelLine: sm(f, 1262, 1290), steam: 0.25, gang: 1, punt: 0 },
    cast: [
      C("inspector", S6CLERK, pose(null, clerk), { idx: 1 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 2 }),
      C("owner", ownPos, pose(null, own), { idx: 4, air: f >= 1186 }),
    ],
    fx: fxs(f >= 1126 && f < 1152 ? dustCard("nail" + Math.floor((f - 1126) / 6), [3.62, 2.02, -7.45], 0.22, 0.6 * (1 - ((f - 1126) % 6) / 6), Math.floor((f - 1126) / 6)) : null),
    focus: f < 1128 ? [S6PL[0], 1.5, S6PL[2]] : f < 1264 ? [ownPos[0], ownPos[1] + 1.4, ownPos[2]] : [plPos[0], 1.5, plPos[2]], subj: f < 1128 || f >= 1264 ? "plimsoll" : "owner",
  };
};

// ================================================= SCENE 7 (1296-1430) NIGHT, THE TRICK: heavier = deeper = waves aboard
// Stinger on "Here's the trick." Lamps on. Low over the water along the hull: Plimsoll on the quay edge points as the
// derrick drops load after load and the lime stripe sinks to the black water ("sinks deeper"); then a wave walks over
// the deck and soaks the sailor standing on it.
const s7Y = (f: number) => lerp(0.15, 0.95, sm(f, 1322, 1372));
const S7PL: V3 = [6.45, 0, -8.4];
const s7Sc = (f: number): V3 => [9.25, DECK(s7Y(f)) + 0.02, -7.0];
SHOT_CAMS[7] = () => {
  const A = FK(1296, [bod(S7PL, 0.3), stripeBox(0.55), boxAt([9.3, 0.4, -8.2], 3.2, 1.5)], 20, 12, 46, 0.64);   // v10.16 wide place shot: the overloaded ship at night, the danger; Plimsoll small on the quay pointing at his line (from over the water: no bollard in front)
  const Bk = FK(1392, [bod(s7Sc(1400))], 300, 24, 42, 0.62);   // high: down onto the deck as the wave walks over it, not the black hull side
  return [K(1296, F((f) => spline([A, HOLD(A, 1366), Bk, HOLD(Bk, 1430)])(f), 1296, 0.0008), 24, true)];
};
KICKS.push([1404 / 30, 0.25]);
SHOT_ACTS[7] = (f, s) => {
  const sy = s7Y(f), d = DECK(sy), wv = lin(f, 1394, 1424);
  const fL = toward(7, s, f, S7PL, [HULLX, 0, -8.7]);
  const pl: P = flow(f, [[1296, { expr: "determined", facing: fL, armR: AR.pointR, armRFront: true, armL: AR.hipL }], [1356, { expr: "stern", facing: fL, armR: [[28, 6], [50, 18]] as A2, armRFront: true }, 4], [1402, { expr: "determined", facing: toward(7, s, f, S7PL, s7Sc(f)), armR: AR.pointR, armRFront: true }, 3]]) as P;
  const fW = toward(7, s, f, s7Sc(f), [11, 0, -5.2]);
  const sc: P = flow(f, [[1296, { expr: "worry", facing: fW, sweat: 1 }], [1396, { expr: "shock", facing: fW, armR: ARF.shieldR, armL: ARF.shieldL, armRFront: true, armLFront: true }, 2], [1410, { expr: "breakdown", facing: -fW, wet: 1, armR: AR.shrugR, armL: AR.shrugL }, 4]]) as P;
  return {
    ctl: { shipY: sy, ghost: f < 1390 ? 1 : 0, cargo: Math.round(lerp(10, 30, lin(f, 1316, 1372))), lamps: 1, wave: wv, awash: sm(f, 1404, 1424) * 0.7, craneA: 1, craneH: lerp(3.4, 1.8, sm(f, 1316, 1340)), craneLoad: f < 1342 ? 1 : 0, line: 1, steam: 0.2, gang: 0, rough: 0.6 },
    cast: [
      C("plimsoll", S7PL, pose(null, pl), { idx: 1 }),
      C("sailorC", s7Sc(f), pose(null, sc), { idx: 2, air: true }),
    ],
    fx: fxs(...splash("w7", [9.3, d + 0.3, -6.9], f - 1408, 2.2), ...sprayCards("w7s", [10.6, d + 0.4, -7.2], f, 1396, 1424, 4, 1.4)),
    focus: f < 1380 ? [S7PL[0], 1.5, S7PL[2]] : [s7Sc(f)[0], d + 1.4, -7.0], subj: f < 1380 ? "plimsoll" : "sailorC",
  };
};

// ================================================= SCENE 8 (1430-1528) THE DEMO, same night: the toy boat in the barrel
// Under the lamp, Plimsoll's fingers drop pennies into a toy boat with a lime line; the owner watches, unimpressed,
// then gulps as the water climbs over the line and the toy swamps. The barrel sits mid-frame, above the captions.
const S8PL: V3 = [3.62, 0, -0.32], S8OWN: V3 = [2.3, 0, -0.95];
SHOT_CAMS[8] = () => {
  const A = FK(1430, [bod(S8PL, 1.0), bod(S8OWN, 1.0), boxAt([3.0, 0.85, -0.6], 0.35, 0.5)], 4, 30, 36, 0.86);
  const Ins: CK = { f: 1478, pos: [3.0, 2.75, 0.9], look: [3.0, 1.0, -0.6], fov: 38 };   // v10.16 mechanism insert: the barrel top fills the width, the pennies drop, the water climbs over the toy's line
  const path = spline([A, HOLD(A, 1466), Ins, HOLD(Ins, 1528)]);
  return [K(1430, F((f) => path(f), 1430, 0.0005), 24, true)];
};
SHOT_ACTS[8] = (f, s) => {
  const drops = [1440, 1456, 1472, 1484, 1500, 1512];
  const pen = drops.filter((d) => f >= d).length;
  const dip = drops.reduce((m, d) => Math.max(m, bump((f - d + 4) / 10)), 0);
  const fB = toward(8, s, f, S8PL, [3.0, 0, -0.6]);
  const pl: P = { expr: "smug", facing: fB, armR: [[26, 2 + 6 * dip], [46, 8 + 14 * dip]] as A2, armRFront: true, armL: [[-20, 20], [-10, 34]] as A2, propL: "handful", look: 0.6, tilt: 4 + 3 * dip };
  const fO = toward(8, s, f, S8OWN, [3.0, 0, -0.6]);
  const own: P = flow(f, [[1430, { expr: "tache", facing: fO, armR: AR.hipR, armL: AR.hipL }], [1494, { expr: "worry", facing: fO, armR: AR.hipR, armL: AR.hipL }, 3], [1508, { expr: "gulp", facing: fO, sweat: 1, armR: ARF.chinR, armRFront: true }, 3]]) as P;
  return {
    ctl: { lamps: 1, toyLamp: 1, toy: lerp(0, 1.25, lin(f, 1438, 1522)), pen, line: 1, shipY: 0.9, cargo: 30, gang: 0, rough: 0.4 },
    cast: [C("plimsoll", S8PL, pose(null, pl), { idx: 1 }), C("owner", S8OWN, pose(null, own), { idx: 2 })],
    fx: fxs(...splash("toy", [3.0, 1.12, -0.6], f - 1512, 0.6), ...drops.map((d) => (f >= d - 6 && f < d ? penny("pen" + d, [3.0, lerp(1.5, 1.15, (f - d + 6) / 6), -0.55]) : null))),
    focus: [3.0, 1.1, -0.6], subj: f < 1470 ? "plimsoll" : null,
  };
};

// ================================================= SCENE 9 (1528-1926) BRIGHT DAY, 1890 -> today: the circle, the payoff
// Shape match on the toy's line: the inspector in the punt paints the circle on PROSPERITY's side (hand + brush). The
// owner, loaded as ever, pats his rail from the gangplank - the camera drops to the water: the circle is under ("over
// the line"); the inspector slams NOT SAILING down at the gangplank foot, the owner's hat pops. Dockers swing the cargo
// off, she rises, the circle comes up into the sun, the sailors cheer, Plimsoll smiles. Last: the owner pats the rail
// again, "she'll float" - and she does. One ending, on the callback.
const s9Y = (f: number) => lerp(0.1, 0.56, sm(f, 1680, 1710)) - lerp(0, 0.56, sm(f, 1752, 1830));   // the water reaches the line on "line" (1704), just over it by 1710
const S9PUNT: V3 = [7.55, -0.73, -5.35], S9INSQ: V3 = [5.35, 0, -6.15], S9PL: V3 = [4.4, 0, -4.6], S9PLQ: V3 = [6.6, 0, -5.05], S9PL2: V3 = [6.55, 0, -6.7];
const S9SA: V3 = [3.6, 0, -12.4], S9SB: V3 = [3.0, 0, -13.0], S9SC: V3 = [4.2, 0, -13.4];
const S9OWNQ: V3 = [5.2, 0, -8.9];
const s9Own = (f: number): V3 => (f < 1618 ? S9OWNQ : f < 1632 ? lerp3(S9OWNQ, [6.05, 0.1, -7.4], sm(f, 1618, 1632)) : f < 1648 ? lerp3([6.05, 0.1, -7.4], gangAt(7.75, s9Y(f)), sm(f, 1632, 1648)) : gangAt(7.75, s9Y(f)));
const s9Insp = (f: number): V3 => (f < 1640 ? S9PUNT : f < 1700 ? lerp3(S9PUNT, S9INSQ, sm(f, 1640, 1700)) : S9INSQ);
const s9Pl = (f: number): V3 => (f < 1732 ? S9PL : f < 1764 ? lerp3(S9PL, S9PLQ, sm(f, 1732, 1764)) : lerp3(S9PLQ, S9PL2, sm(f, 1846, 1872)));
SHOT_CAMS[9] = () => {
  const W = FK(1528, [bod(S9PUNT, 0.0, 1.55), markBox(0.1), boxAt([9.0, 0.3, -7.0], 3.4, 1.7)], 332, 14, 48, 0.58);   // v10.16 wide place shot: 1890, the bright dock, the inspector's punt under PROSPERITY's flank
  const A = FK(1560, [bod(S9PUNT, 0.0, 1.55), markBox(0.1)], 350, 3, 40, 0.64);
  const Bk = FK(1650, [bod(gangAt(7.75, 0.1)), boxAt([8.8, DECK(0.1) + 0.1, -7.4], 1.0, 0.25)], 330, 2, 38, 0.44);   // az 330 (was 300): the old angle sat 2 m from Plimsoll, a huge blurred head at the right edge 1642-1673
  const Cc: CK = { f: 1680, pos: [7.08, -0.45, -2.9], look: [8.47, -0.86, -5.2], fov: 58 };   // the reveal: a bright 3/4 close-up of the whole mark (~45% of the width, margins round it), the water climbs to its line
  const E: CK = { f: 1772, pos: [6.95, 0.55, -2.6], look: [8.47, -0.35, -5.3], fov: 50 };   // v10.16 payoff spectacle: the circle rises out of the water into the sun as she is unloaded (mark ~40% of the width, no character)
  const Fe: CK = { f: 1876, pos: [3.7, 1.7, -10.6], look: [7.5, 0.45, -6.4], fov: 54 };   // from the quay: the owner on his plank, Plimsoll, the circle between them above the water
  const M9: CK = { f: 1628, pos: [5.9, 1.9, -1.3], look: [8.1, 0.5, -6.0], fov: 39 };   // up over the quay edge: the low move from the punt passed a bollard right at the lens (black frame at 1623)
  const D2: CK = { f: 1727, pos: [5.6, 1.6, -5.5], look: [7.6, 1.1, -7.2], fov: 52 };   // "stays home": snap in to the owner's breakdown (reaction close-up, ~38%)
  // final-render review: the 7-15 frame snaps here passed Plimsoll's head at the lens (1674, 1758, 1859), a bollard (1724) and
  // empty quay stone (1711). Now cuts on the words: "the water's" 1674, "and" 1712 (straight to the breakdown close-up),
  // "Today," 1748 (time jump to the circle), "Now," 1855.
  const path = spline([W, HOLD(W, 1540), A, HOLD(A, 1612), M9, Bk, HOLD(Bk, 1673)]);
  const still = (k: CK) => () => ({ pos: k.pos, look: k.look, fov: k.fov });
  return [K(1528, F((f) => path(f), 1528, 0.0006), 24, true), K(1674, F(still(Cc), 1674, 0.0006), 0, true), K(1712, F(still(D2), 1712, 0.0006), 0, true),
    K(1748, F(still(E), 1748, 0.0006), 0, true), K(1855, F(still(Fe), 1855, 0.0006), 0, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const sy = s9Y(f), markK = sm(f, 1566, 1612), ownPos = s9Own(f), inspPos = s9Insp(f), plPos = s9Pl(f);
  const fHull = toward(9, s, f, S9PUNT, [9, -0.5, -5.35]);
  const iw = walkPath(9, s, [S9PUNT, S9INSQ], f, 1640, 1700);
  const fSign = toward(9, s, f, S9INSQ, [5.95, 0, -6.7]);
  const insp: P = f < 1614 ? { ...PZ_KNEEL, expr: "tache", facing: fHull, kneelK: 1, armR: [[30, 18 + 8 * Math.sin(markK * 12)], [60, 26 + 10 * Math.cos(markK * 12)]] as A2, tilt: 6 }
    : f < 1640 ? { expr: "tache", facing: toward(9, s, f, S9PUNT, ownPos), propR: "paintBrush", armR: AR.hipR }
    : f < 1700 ? { expr: "tache", mode: f < 1660 ? "hop" : "walk", lift: 0.5 * bump(lin(f, 1640, 1660)), phase: iw.phase, facing: iw.facing }
    : flow(f, [[1700, { expr: "tache", facing: fSign, armR: AR.stampUp, armL: [[-22, -16], [-26, -46]] as A2, armRFront: true, armLFront: true }], [1716, { expr: "tache", facing: fSign, armR: AR.stampUp, armL: [[-22, -16], [-26, -46]] as A2, armRFront: true, armLFront: true }, 3], [1724, { expr: "tache", facing: fSign, armR: AR.stampDown, armL: [[-24, 6], [-30, 20]] as A2, armRFront: true, armLFront: true }, 2], [1760, { expr: "tache", facing: toward(9, s, f, S9INSQ, ownPos), armR: AR.hipR }, 6]]) as P;
  const fRail = toward(9, s, f, ownPos, [9.2, 0, -7.4]);
  const ow = walkPath(9, s, [S9OWNQ, [6.05, 0.1, -7.4], gangAt(7.75, 0.1)], f, 1618, 1648);
  const own: P = f >= 1618 && f < 1648 ? { expr: "tacheUp", mode: "walk", phase: ow.phase, facing: ow.facing, armR: AR.hipR, armL: AR.hipL } : f < 1856 ? flow(f, [
    [1600, { expr: "tacheUp", facing: fRail, armR: AR.hipR, armL: AR.hipL }],
    [1654, { expr: "tacheUp", facing: fRail, armR: ARMS.reachR, armRFront: true, tilt: 4 }, 3],          // pats (1658)
    [1662, { expr: "tacheUp", facing: fRail, armR: [[30, 6], [52, 6]] as A2, armRFront: true, tilt: 3 }, 3],
    [1668, { expr: "tacheUp", facing: fRail, armR: ARMS.reachR, armRFront: true, tilt: 4 }, 3],
    [1690, { expr: "worry", facing: -fRail, look: 0.4 }, 4],
    [1722, { expr: "breakdown", facing: -fRail, tilt: -6, hatLift: 0.25 }, 2],         // NOT SAILING: his hat pops
    [1736, { expr: "worry", facing: -fRail, tilt: 0, hatLift: 0 }, 6],                             // ...and lands back
    [1790, { expr: "sheepish", facing: -fRail, armR: AR.shrugR, armL: AR.shrugL }, 6],
  ]) as P : speak(f, 1883, 1898, flow(f, [
    [1856, { expr: "sheepish", facing: fRail, armR: ARMS.reachR, armRFront: true }],
    [1864, { expr: "smile_closed", facing: fRail, armR: [[30, 6], [52, 6]] as A2, armRFront: true }, 3],
    [1872, { expr: "smile", facing: fRail, armR: ARMS.reachR, armRFront: true }, 3],
    [1900, { expr: "sheepish", facing: -fRail, armR: AR.shrugR, armL: AR.shrugL, sweat: 1 }, 4],    // "she has to"
  ]) as P);
  const pw = f < 1800 ? walkPath(9, s, [S9PL, S9PLQ], f, 1732, 1764) : walkPath(9, s, [S9PLQ, S9PL2], f, 1846, 1872);
  const fPO = toward(9, s, f, plPos, ownPos);
  const pl: P = (f >= 1732 && f < 1764) || (f >= 1846 && f < 1872) ? { expr: "smile", mode: "walk", phase: pw.phase, facing: pw.facing } : flow(f, [
    [1528, { expr: "calm", facing: toward(9, s, f, S9PL, [8.5, 0, -5.1]), look: 0.6, armR: AR.hipR }],
    [1612, { expr: "proud", facing: toward(9, s, f, S9PL, [8.5, 0, -5.1]), armR: AR.tipHatR, armRFront: true }, 4],
    [1640, { expr: "calm", facing: toward(9, s, f, S9PL, ownPos), look: 0.5, armR: AR.hipR }, 6],
    [1724, { expr: "smile_closed", facing: toward(9, s, f, S9PL, ownPos), armR: AR.tipHatR, armRFront: true }, 3],
    [1764, { expr: "proud", facing: toward(9, s, f, S9PLQ, [8.5, 0, -5.1]), armR: AR.tipHatR, armRFront: true }, 4],
    [1800, { expr: "proud", facing: toward(9, s, f, S9PLQ, [8.5, 0, -5.1]), armR: AR.hipR, armL: AR.hipL }, 6],
    [1872, { expr: "smile_closed", facing: fPO, armR: AR.hipR, armL: AR.hipL }],
    [1902, { expr: "smug", facing: fPO, armR: AR.hipR, headTilt: 4 }, 4],
  ]) as P;
  const cheer = (who: string, pos: V3, i: number): CastPlace => {
    const fc = toward(9, s, f, pos, [8.5, 0, -6]);
    return C(who, pos, pose(null, f < 1764 ? { expr: "worry", facing: fc, look: 0.5 }
      : f < 1846 ? { expr: i % 2 ? "joy" : "grin", facing: fc, armR: ARF.cheer, armRFront: true, armL: i === 1 ? [[-24, -30], [-30, -66]] as A2 : AR.hipL }
      : { expr: "smile", facing: fc, armR: AR.hipR, look: 0.4 }), { idx: 40 + i });
  };
  const mk = hullPt(-0.9, 0.55, sy);
  return {
    ctl: { shipY: sy, cargo: Math.round(f < 1680 ? 18 : f < 1752 ? lerp(18, 30, lin(f, 1680, 1706)) : lerp(30, 8, lin(f, 1752, 1830))), line: 1, mark: markK, ghostMark: f >= 1680 && f < 1712 ? 1 : 0, markSun: f >= 1672 && f < 1716 ? sm(f, 1672, 1682) : f >= 1756 && f < 1850 ? sm(f, 1756, 1772) * (1 - sm(f, 1840, 1850)) : 0, punt: 1, puntZ: lerp(-5.0, 1.8, sm(f, 1652, 1676)), gang: 1, stopSign: sm(f, 1716, 1726), steam: 0.3, craneA: f < 1676 ? 0.4 : f < 1752 ? 1 : 1 - lin(f, 1752, 1830), craneH: f < 1706 ? lerp(3.2, 1.8, sm(f, 1676, 1690)) : 2.6, craneLoad: (f >= 1676 && f < 1692) || (f >= 1752 && f < 1830) ? 1 : 0 },
    cast: [
      C("inspector", inspPos, pose(null, insp), { idx: 1, air: f < 1700 }),
      C("owner", ownPos, pose(null, own), { idx: 2, air: f >= 1630 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 3 }),
      cheer("sailorA", S9SA, 0), cheer("sailorB", S9SB, 1), cheer("sailorC", S9SC, 2),
    ],
    fx: fxs(f >= 1566 && f < 1612 ? sparkle("mark", [HULLX - 0.08, mk[1] + 0.2 * Math.cos(markK * 6.28), mk[2] + 0.2 * Math.sin(markK * 6.28)], (f - 1566) % 10, 0.14, "#ffffff") : null),
    focus: f < 1640 ? [inspPos[0], inspPos[1] + 1.2, inspPos[2]] : f < 1674 ? [ownPos[0], ownPos[1] + 1.5, ownPos[2]] : f < 1712 ? mk : f < 1748 ? [ownPos[0], ownPos[1] + 1.5, ownPos[2]] : f < 1855 ? mk : [ownPos[0], ownPos[1] + 1.5, ownPos[2]],
    subj: f < 1640 ? "inspector" : f < 1674 ? "owner" : f < 1712 ? null : f < 1748 ? "owner" : f < 1855 ? null : "owner",
  };
};

// lens (depth of field) per scene: the focus class at each frame
lens3([[0, DOF_MS], [150, DOF_CU, 20], [300, DOF_WS, 20], [360, DOF_CU, 16]]);
lens3([[389, DOF_WS]]);
lens3([[452, DOF_MS], [500, DOF_FS, 20]]);
lens3([[562, DOF_WS], [610, DOF_MS, 16], [740, DOF_FS, 16], [760, DOF_MS, 12]]);
lens3([[784, DOF_WS], [834, DOF_CU, 10], [872, DOF_FS, 16], [924, DOF_MS, 16], [972, DOF_CU, 16]]);
lens3([[1108, DOF_MS], [1130, DOF_CU, 10], [1200, DOF_FS, 20]]);
lens3([[1296, DOF_WS], [1392, DOF_FS, 16]]);
lens3([[1430, DOF_CU], [1470, DOF_MS, 8]]);
lens3([[1528, DOF_WS], [1556, DOF_MS, 16], [1648, DOF_MS, 16], [1716, DOF_FS, 6], [1724, DOF_CU, 6], [1756, DOF_FS, 12], [1872, DOF_MS, 20]]);

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
    o.push(kind === 0 ? { look: 0.55 * sg, headTilt: 2 * sg, tilt: 0 }          // glance
      : kind === 1 ? { look: 0, headTilt: (3 + 2 * r()) * sg, tilt: 0 }           // head tilt
      : kind === 2 ? { look: 0.15 * sg, headTilt: 0, tilt: (1.5 + r()) * sg }    // weight shift
      : { look: 0, headTilt: 0, tilt: 0 });                                      // settle
    x += 21 + Math.floor(r() * 19);                                              // 0.7-1.3 s apart
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
