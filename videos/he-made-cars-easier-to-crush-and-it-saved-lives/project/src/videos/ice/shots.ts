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
  return { p: w.p, facing: screenSide(id, s, f, w.d[0], w.d[1]), phase: walkPh(dist), moving };
};
void ACT; void talkNod;

// =====================================================================================================================
// "He Made Cars Easier to Crush, and It Saved Lives": shared staging helpers. Positions come from the set marks
// (crashhall, showroom, works, backyard, street). Accent safety-cage yellow #F2C230 (on objects only; captions stay white).
const MK = (s: SetDef, k: string): V3 => (s.marks[k] ?? [0, 0, 0]) as V3;
const add3 = (a: V3, dx: number, dy: number, dz: number): V3 => [a[0] + dx, a[1] + dy, a[2] + dz];
const CAGE = "#f2c230";
/** a laugh that shakes the body (phase advances ~2.5 shakes a second), head back */
const laughP = (f: number, a: number, i: number): P => ({ expr: i % 2 ? "guffaw" : "laugh", shake: 1, phase: (f - a) / 12 + i * 0.3, headBack: 0.5, tilt: -4 + 2 * Math.sin((f - a) * 0.7 + i) });
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
      C("mechB", MK(s, "painter"), flow(f, [
        [572, { expr: "sly", facing: 1, tilt: -3, armR: [[28, -6], [50, -10]] as A2, armRFront: true, propR: "paintBrush", armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }],
        [606, { expr: "grin", facing: 1, tilt: -6 + 3 * sp, armR: [[30, 0], [56 + 4 * sp, 4 - 10 * sp]] as A2, armRFront: true, propR: "paintBrush", propRAng: 0.3 * sp, armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }, 6],
        [656, { expr: "laugh", facing: -1, tilt: 3, armR: [[26, 10], [40, -4]] as A2, armRFront: true, propR: "paintBrush", armL: [[-22, 24], [-8, 38]] as A2, armLFront: true, propL: "paintPot" }, 8],
      ]), { idx: 5 }),
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
// 5b 830-925: the folded nose + steam, then a quick move to the gallery as they all laugh on "Everybody laughs" (883):
//    the boss slaps his knee, the salesmen double over; the engineer stays calm.
// 5c 925-1030: he walks to the driver's door and opens it on "door" (956): the dummy is just sitting there, upright,
//    blank, fine; the laughter stops behind (the gallery's faces drop) on "Fine" (1026).
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
  const S1 = F(() => A, 728, 0.0012), S2 = F(() => B, 830, 0.0016), S2b = F(() => Bg, 876, 0.0016), S3 = F(() => Cc, 925, 0.0014, [[1000, 0.003, 14]]);
  return [K(728, S1, 24, true), K(830, S2, 24, true), K(866, glideTo(S2, 866, S2b, 876), 1), K(925, S3, 24, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const engPath = walkPath(5, s, [MK(s, "gallery3"), [-2.65, 0, -1.4], ENG5], f, 882, 944);   // round the lever post; he walks off calmly as they laugh
  const laugh = f >= 881 && f < 1018;
  const g = (k: string, i: number, d: number, prop?: string): CastPlace => C(k, MK(s, ["gallery1", "gallery2", "gallery3", "gallery4"][i]), laugh ? pose(null, { ...laughP(f, 881, i), facing: d, ...(prop ? { armR: [[24, 20], [16, -6]] as A2, armRFront: true, propR: prop } : {}) })
    : f >= 1018 ? flow(f, [[1018, { expr: "blank", facing: d, ...(prop ? { armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: prop } : {}) }], [1022, { expr: "gulp", facing: d, tilt: 3 }, 6]])
    : pose(null, { expr: f < 811 ? "smug" : "grin", facing: d, look: 0.6, ...(prop ? { armR: [[24, 26], [12, 40]] as A2, armRFront: true, propR: prop } : {}) }), { idx: 10 + i });
  const doorK = sm(f, 946, 956);
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
        [944, { expr: "calm", facing: 1, tilt: 4, armR: [[26, 6], [46, 8]] as A2, armRFront: true }, 3],                                                  // reaches the handle
        [947, { expr: "calm", facing: 1, tilt: -6, armR: [[24, 10], [36, 20]] as A2, armRFront: true }, 9],                                                // pulls it open
        [962, { expr: "sly", facing: -1, tilt: 2, armR: [[26, 10], [44, -2]] as A2, armRFront: true, headTilt: 4 }, 10],                                     // presents the dummy
        [1020, { expr: "smug", facing: -1, tilt: 2, armR: [[26, 10], [44, -2]] as A2, armRFront: true, headTilt: 6 }, 8],
      ]), { idx: 2 }),
      g("cBoss", 0, 1, "stopwatch"), g("cSalesA", 1, 1, "clipboard"), C("cSalesB", MK(s, "gallery4"), laugh ? pose(null, { ...laughP(f, 885, 2), facing: -1 }) : pose(null, { expr: f >= 1018 ? "gulp" : "smug", facing: -1 }), { idx: 13 }),
      C("mechC", [-4.4, 0, 3.8], pose(null, { expr: laugh ? "laugh" : "neutral", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera", shake: laugh ? 0.6 : 0, phase: f / 12 }), { idx: 14 }),
      C("dummy", [-0.42, 0.49, carZ(pz5(f)) + 0.03], pose(null, { expr: "blank", mode: "sit", facing: f >= 960 ? -1 : 0, tilt: f >= 811 && f < 826 ? 10 * (1 - (f - 811) / 15) : 0 }), { idx: 20, scale: SITK }),
    ],
    fx: fxs(f >= 811 && f < 840 ? dustCard("cr", [0, 0.9, -4.5], 1.4, 0.8 * (1 - (f - 811) / 29), 3) : null, f >= 1026 ? sparkle("fine", [-0.42, 1.32, carZ(-1) + 0.1], f - 1026, 0.3) : null),
    focus: f < 830 ? [0, 0.9, carZ(pz5(f)) - 1.6] : f < 866 ? [0, 0.9, -4.3] : f < 925 ? MK(s, "gallery2") as V3 : f < 960 ? [-1.6, 1.5, -2.8] : [-0.42, 1.4, carZ(-1)],
    subj: f < 830 ? null : f < 866 ? null : f < 925 ? "cBoss" : f < 960 ? "eng" : "dummy",
  };
};
lens3([[728, DOF_WS], [830, DOF_INSERT], [866, DOF_FS, 10], [925, DOF_MS]]);

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
  const soft = (k: number): P => ({ expr: "determined", facing: 1, tilt: -4 * k, mode: k > 0.2 ? "brace" : "stand", armR: [[28 - 6 * k, 6 + 10 * k], [54 - 26 * k, 4 + 20 * k]] as A2, armRFront: true, armL: [[20 - 4 * k, 8 + 10 * k], [44 - 22 * k, 8 + 20 * k]] as A2, armLFront: true, ...(f >= 1142 ? { propR: "balloon", propK: 0.5 * Math.sin((f - 1142) * 0.6) * Math.max(0, 1 - (f - 1142) / 40) } : {}) });
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
        [1162, { expr: "beam", facing: 1, tilt: 2, armR: [[24, 20], [20, 8]] as A2, armRFront: true, propR: "balloon", propK: 0.2 * Math.sin(f * 0.5), wet: 1, hatTilt: -12 } as P, 8],
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

// PLACEHOLDER cameras until the scene files land (one static framing per shot id).
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) if (!SHOT_CAMS[id]) {
  SHOT_CAMS[id] = (s) => [K(0, F(() => s.cams.main ?? { pos: [0, 2, 10] as V3, look: [0, 1, 0] as V3, fov: 40 }, 0, 0.0018))];
  SHOT_ACTS[id] = () => ({ ctl: {}, cast: [], fx: [], focus: [0, 1, 0], subj: null } as unknown as Act);
}

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
