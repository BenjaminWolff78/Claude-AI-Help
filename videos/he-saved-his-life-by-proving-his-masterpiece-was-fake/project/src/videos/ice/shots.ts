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
// "He Saved His Life by Proving His Masterpiece Was Fake": shared staging helpers. Positions come from the set marks
// (court, mine, studio, museum, hall). Accent oven-ember orange #F05A28.
const MK = (s: SetDef, k: string): V3 => (s.marks[k] ?? [0, 0, 0]) as V3;
const add3 = (a: V3, dx: number, dy: number, dz: number): V3 => [a[0] + dx, a[1] + dy, a[2] + dz];
const EMBER = "#f05a28";
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
// "He Saved His Life by Proving His Masterpiece Was Fake" - 11 shots = 11 scenes. v10.10: the calm camera holds (part 9)
// stay and the subject performs inside every hold; quoted lines use per-syllable talk mouths (talk.json, 8 shapes,
// 40-50 % of the face) with head bobs + brow lifts on stressed syllables; listeners hold props; the title object (the
// painting) is big in the hook and the reveal and its baking process plays on screen (shot 8).
// Arms are screen-space offsets (x + = screen right) in head-width %; `mx(arm, d)` mirrors an arm for d = -1.
import TALKJ from "./talk.json";
import type { Pen } from "./toon";
const TJ = TALKJ as unknown as { talk: Record<string, string>; stress: number[] };
const mx = (a: A2, d: number): A2 => [[a[0][0] * d, a[0][1]], [a[1][0] * d, a[1][1]]];
const lip = (f: number) => TJ.talk[String(f)] as MouthK | undefined;
/** speech accent from the stressed syllables: 0..1 bump peaking 2 frames after each stress frame */
const stressK = (f: number) => { let k = 0; for (const s of TJ.stress) k = Math.max(k, bump((f - s + 1) / 9)); return k; };
/** a speaking pose on a quoted line: talk mouth, 1-3 deg head bob, brows up on the stressed syllables */
const speak = (f: number, a: number, b: number, o: P): P => {
  if (f < a || f >= b) return o;
  const k = stressK(f), F0 = faceOf((o.expr as Face) ?? "neutral");
  const sign = (TJ.stress.findIndex((s) => s > f) % 2) ? 1 : -1;
  return { ...o, mouth: lip(f) ?? "tClosed", headTilt: ((o.headTilt as number) ?? 0) + 2.6 * k * sign, brow: [F0.brow[0] - 3.5 * k, F0.brow[1] - 3.5 * k] as [number, number] };
};
const hold3 = (who: string, pos: V3, o: FigOpts, idx: number, scale?: number): CastPlace => C(who, pos, o, { idx, ...(scale ? { scale } : {}) });
const lens3 = (pts: [number, number, number?][]) => { for (const [f, c, d] of pts) lens(f, c, d ?? 1); };

// ================================================= SHOT 1 (0-96) HOOK, the court ===================================
// He finishes the PROOF painting in front of the court (brush strokes rock his body), steps back on "proving", presents
// it with a sweep of the arm on "fake!"; the guard behind him gapes, the judge leans over the bench. Push into the
// canvas from 58 (object dissolve into the mine at 96).
SHOT_CAMS[1] = (s) => {
  const pp = MK(s, "proofPainter"), cv = MK(s, "proof");
  const A = fit([body(pp, 0, 2.15, 0.36), [[cv[0], 0, cv[2]], 0.9, 1.88, 0.42]], 26, 5, 40, 0.84, 0.05, 0.05);
  const Z = fit([[[cv[0], 0, cv[2]], 0.94, 1.82, 0.37]], 31, 2, 38, 0.99);
  const S1 = F(() => A, 0, 0.0016, [[80, 0.006, 10]]), S2 = F(() => Z, 96, 0.001);
  return [K(0, S1), K(58, glideTo(S1, 58, S2, 96), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  const pp = MK(s, "proofPainter"), cv = MK(s, "proof"), d = -1;   // he faces left to the canvas
  const stroke = Math.sin(f * 0.42), back = walkPath(1, s, [pp, add3(pp, 0.55, 0, 0.25)], f, 60, 76);
  return {
    ctl: { proofOn: 1, proof: 0.86 + 0.14 * sm(f, 0, 60), fans: 1 },
    cast: [
      C("forger", back.p, flow(f, [
        [0, { expr: "determined", facing: d, tilt: -3 + 3 * stroke, armR: mx([[30, -6], [58 + 6 * stroke, -26 - 10 * stroke]], d), armRFront: true, propR: "paintBrush", propRAng: 0.3 * stroke, armL: [[-24, 30], [-8, 44]] as A2, armLFront: true, propL: "paintPot" }],
        [44, { expr: "smug", facing: d, tilt: 4, armR: mx([[28, -10], [50, -40]], d), armRFront: true, propR: "paintBrush", headTilt: 4 }, 10],                 // last dab... the flourish
        [62, { expr: "smug", facing: 1, tilt: -3, armR: [[24, 4], [16, 26]] as A2, armRFront: true, propR: "paintBrush", armL: [[-34, -4], [-66, -20]] as A2, look: -0.6 }, 10],  // steps back, presents it
        [80, { expr: "sly", facing: 1, tilt: -5, armR: [[24, 4], [16, 26]] as A2, armRFront: true, propR: "paintBrush", armL: [[-36, -10], [-70, -34]] as A2, headTilt: 5, look: -0.8 }, 8], // "fake!"
      ]), { idx: 1 }),
      C("guardA", [cv[0] + 1.75, 0, cv[2] - 1.6], flow(f, [
        [0, { expr: "blank", facing: -1, armR: [[24, 30], [-6, 34]] as A2, armRFront: true, armL: [[-24, 30], [6, 36]] as A2, armLFront: true }],
        [70, { expr: "aghast", facing: -1, tilt: 4, armR: [[24, 30], [-6, 34]] as A2, armRFront: true, armL: [[-24, 30], [6, 36]] as A2, armLFront: true, look: -1 }, 8],
      ]), { idx: 2 }),
      C("judge", MK(s, "judge"), flow(f, [[0, { expr: "stern", facing: -1, look: -0.6 }], [60, { expr: "shock", facing: -1, tilt: -6, look: -1 }, 10]]), { idx: 3 }),
    ],
    fx: fxs(f >= 80 ? sparkle("hk1", [cv[0] + 0.25, cv[1] + 0.3, cv[2] + 0.1], f - 80, 0.3) : null, f >= 84 ? sparkle("hk2", [cv[0] - 0.22, cv[1] - 0.1, cv[2] + 0.1], f - 84, 0.22) : null),
    focus: f < 58 ? [pp[0], 1.75, pp[2]] : follow(f, [[58, [pp[0], 1.75, pp[2]]], [96, cv, 38]]),
    subj: "forger",
  };
};
lens3([[0, DOF_MS], [58, DOF_INSERT, 38]]);

// ================================================= SHOT 2 (96-340) THE SALT MINE ====================================
// Opens on the painting held up out of the crate (match), pulls back: two soldiers hold it up, the officer raises his
// lantern, crates down the tunnel ("a top Nazi's stash"). They flip it on "Guess who sold it?": the SOLD BY slip with
// his photo; the officer jabs at it on "treason"; push in onto the photo (photo -> face dissolve at 340).
SHOT_CAMS[2] = (s) => {
  const P = MK(s, "painting"), of = OFF2(s);
  const A = fit([[[P[0], 0, P[2] + 0.2], 1.0, 2.1, 0.5]], 0, 2, 38, 0.97);
  const B = fit([body(S2A(s)), body(S2B(s)), body(of), [[P[0], 0, P[2] + 0.2], 1.0, 2.1, 0.55]], 2, 6, 50, 0.84, 0, 0.15);
  // from the left, so the officer (now forward) stands clear right of the slip instead of over its last line
  const Cc = fit([[[P[0], 0, P[2] + 0.25], 1.15, 2.0, 0.45], body(of, 1.3, 2.2, 0.3)], -12, 2, 38, 0.9, 0.1);
  // push right in until the seller's photo face fills the frame, centred (it becomes his real face at 340)
  const Z = fit([[[P[0] + 0.005, 0, P[2] + 0.25], 1.627 - 0.07, 1.627 + 0.07, 0.075]], 0, 0, 36, 0.98);
  const S1 = F(() => A, 96, 0.0008), S2 = F(() => B, 158, 0.0016), S3 = F(() => Cc, 280, 0.0018, [[300, 0.006, 10]]), S4 = F(() => Z, 340, 0.001);
  return [K(96, S1), K(126, glideTo(S1, 126, S2, 158), 1), K(254, glideTo(S2, 254, S3, 280), 1), K(316, glideTo(S3, 316, S4, 340), 1)];
};
// the officer stands forward of the crate (bigger, nearer the lens) and soldier B back to the right, so nobody hides
// anybody in the wide
const OFF2 = (s: SetDef): V3 => add3(MK(s, "crate"), 0.6, -0.62, 1.45);
// the soldiers stand a little wide of the painting so the opening close-up shows only their hands on the frame (no
// half-cut faces at the edges)
const S2A = (s: SetDef): V3 => add3(MK(s, "crate"), -0.84, -0.62, 0.3), S2B = (s: SetDef): V3 => add3(MK(s, "crate"), 1.2, -0.62, 0.1);
SHOT_ACTS[2] = (f, s) => {
  const s1 = S2A(s), s2 = S2B(s), of = OFF2(s);
  const hold = (d: number): P => ({ armR: mx([[30, -8], [62, -30]], d), armRFront: true, armL: mx([[18, 6], [54, -10]], d), armLFront: true });
  return {
    ctl: { lid: 1, lift: 1, flip: sm(f, 238, 256), bulbs: 1 },
    cast: [
      // on the photo he recoils and backs off a step (out of the slip framing, so nobody is cut by the frame edge)
      C("soldierA", f >= 266 ? walkPath(2, s, [s1, add3(s1, -0.7, 0, 0.25)], f, 266, 284).p : s1, f > 266 && f < 284 ? pose(null, { expr: "shock", mode: "walk", phase: -walkPath(2, s, [s1, add3(s1, -0.7, 0, 0.25)], f, 266, 284).phase, facing: 1, look: 0.8 }) : flow(f, [
        [96, { expr: "eureka", facing: 1, tilt: -3, ...hold(1) }],
        [150, { expr: "grin", facing: 1, tilt: -4, ...hold(1), headTilt: 4 }, 10],
        [236, { expr: "strain", facing: 1, tilt: 4, ...hold(1) }, 8],                    // turns it round
        [258, { expr: "shock", facing: 1, tilt: -2, ...hold(1), look: 0.6 }, 6],         // the photo!
        [284, { expr: "aghast", facing: 1, tilt: 3, armR: [[26, 24], [8, 36]] as A2, armRFront: true, armL: [[-26, 24], [-8, 36]] as A2, armLFront: true, look: 1 }, 8],
      ]), { idx: 1 }),
      C("soldierB", s2, flow(f, [
        [96, { expr: "joy", facing: -1, tilt: 3, ...hold(-1) }],
        [170, { expr: "grin", facing: -1, tilt: 4, ...hold(-1), headTilt: -4 }, 10],
        [236, { expr: "strain", facing: -1, tilt: -4, ...hold(-1) }, 8],
        [262, { expr: "gulp", facing: -1, ...hold(-1), look: -0.6 }, 8],
      ]), { idx: 2 }),
      C("officer", of, flow(f, [
        [96, { expr: "stern", facing: -1, armR: [[30, -24], [40, -56]] as A2, propR: "lantern", look: -0.5 }],
        [160, { expr: "eureka", facing: -1, tilt: -3, armR: [[30, -30], [44, -62]] as A2, propR: "lantern", look: -0.8 }, 10],     // "masterpiece"
        [228, { expr: "determined", facing: -1, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-30, 6], [-58, -4]] as A2, armLFront: true }, 10],  // "turn it round"
        [262, { expr: "angry", facing: -1, tilt: 6, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-34, -6], [-66, -16]] as A2, armLFront: true }, 6], // jabs at the slip
        [296, { expr: "angry", facing: -1, tilt: 8, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-34, 2], [-62, 8]] as A2, armLFront: true, headTilt: -4 }, 8], // "treason"
      ]), { idx: 3 }),
    ],
    fx: fxs(f >= 266 && f < 280 ? bang([of[0], 2.45, of[2]], f - 266) : null),
    focus: f < 126 ? MK(s, "painting") : f < 254 ? follow(f, [[126, MK(s, "painting")], [158, [s1[0] + 0.6, 1.7, s1[2]], 32]]) : follow(f, [[254, [s1[0] + 0.6, 1.7, s1[2]]], [280, add3(MK(s, "slip"), 0, 0, 0.1), 26]]),
    subj: null,
  };
};
lens3([[96, DOF_INSERT], [126, DOF_FS, 32], [254, DOF_MS, 26], [316, DOF_INSERT, 24]]);

// ================================================= SHOT 3 (340-654) THE DOCK =========================================
// CU of his face (matching the photo) gulps on "death" while the judge's gavel lands; pull back to a medium: "Relax.
// It's not old. I painted it." (talk mouths, palms-up shrug, head shake, thumb to his chest). The guards burst out
// laughing (coffee slops), the judge laughs and bangs the bench (same frame, behind him); glide right to the press
// benches: reporters hold up DUMBEST EXCUSE OF THE WAR, a flashbulb pops; push into the paper (shape match at 654).
const GA3: V3 = [-1.1, 0, -0.3], GB3: V3 = [0.8, 0, 1.0], RP1: V3 = [1.75, 0, 2.35], RP2: V3 = [2.45, 0, 1.55], RP3: V3 = [3.1, 0, 0.6];
SHOT_CAMS[3] = (s) => {
  const D = MK(s, "dock"), r1 = RP1, r2 = RP2;
  // his face fills the frame, centred, the same spot and size as the photo face it dissolves from (subject-position match)
  const A = fit([[[D[0], 0, D[2]], 1.2, 1.85, 0.3]], 16, 2, 34, 0.9);
  const B = fit([body(D, 0.95, 2.35, 0.42)], 14, 3, 36, 0.86, 0, -0.28); // face in the upper-middle, the caption sits on his chest, never on the mouth
  const W3 = fit([body(D, 0, 2.35, 0.42), body(GA3), body(GB3)], 20, 6, 46, 0.88, 0, 0.1);
  const rt15: V3 = [0.966, 0, -0.259], pc: V3 = [r1[0] + rt15[0] * 0.42, 0, r1[2] + rt15[2] * 0.42];
  const R = fit([body(r1, 0.4, 2.45, 0.42), [pc, 1.0, 2.0, 0.3]], 15, 3, 40, 0.88, 0, 0.05);
  const Z = fit([[pc, 1.05, 1.95, 0.26]], 15, 1, 36, 0.98);
  const SA = F(() => A, 340, 0.0012), SB = F(() => B, 396, 0.0014, [[428, 0.005, 10]]), SW = F(() => W3, 470, 0.0012), SR = F(() => R, 548, 0.0014), SZ = F(() => Z, 654, 0.001);
  return [K(340, SA), K(372, glideTo(SA, 372, SB, 396), 1), K(452, glideTo(SB, 452, SW, 476), 1), K(520, glideTo(SW, 520, SR, 552), 1), K(612, glideTo(SR, 612, SZ, 654), 1)];
};
SHOT_ACTS[3] = (f, s) => {
  const D = MK(s, "dock"), J = MK(s, "judge"), r1 = RP1, r2 = RP2, r3 = RP3;
  const sip = st(f, 2);
  const forger = flow(f, [
    [340, { expr: "gulp", facing: 0, sweat: 1, armR: [[24, 30], [10, 46]] as A2, armL: [[-24, 30], [-10, 46]] as A2 }],
    [372, { expr: "calm", facing: 0, armR: [[24, 30], [10, 46]] as A2, armL: [[-24, 30], [-10, 46]] as A2 }, 10],
    [395, { expr: "smug", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: 3 }, 10],      // "Relax." palms up
    [410, { expr: "sly", facing: 0, armR: [[32, 22], [40, 30]] as A2, armL: [[-34, 14], [-50, -8]] as A2, headTilt: -4 }, 8],      // "it's not old" one hand wags
    [426, { expr: "smug", facing: 0, armR: [[26, 6], [4, -2]] as A2, armRFront: true, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 5 }, 8], // "I painted it" thumb to his chest
    [452, { expr: "smug", facing: 0, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true }, 10],
    [500, { expr: "sheepish", facing: 0, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true, look: -0.4 }, 10],
    [585, { expr: "sly", facing: 0, armR: [[28, 16], [-6, 22]] as A2, armRFront: true, armL: [[-28, 16], [6, 24]] as A2, armLFront: true, headTilt: 4 }, 10],   // arms crossed, unbothered
  ]);
  return {
    ctl: { fans: 1 },
    cast: [
      C("forger", D, pose(null, speak(f, 392, 450, forger as P)), { idx: 1 }),
      C("guardA", GA3, flow(f, [
        [340, { expr: "stern", facing: 1, armR: [[24, 30], [10, 44]] as A2, propR: "keys", look: 0.6 }],
        [456, { ...laughP(f, 456, 0), facing: 1, armR: [[24, 40], [6, 66]] as A2, armRFront: true, armL: [[-24, 40], [-6, 66]] as A2, armLFront: true }, 4],
        [560, { expr: "grin", facing: 1, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }, 10],
      ]), { idx: 2 }),
      C("guardB", GB3, flow(f, [
        [340, { expr: "blank", facing: -1, armR: [[24, 20], [26, -4 + 6 * Math.max(0, Math.sin(sip * 0.08))]] as A2, armRFront: true, propR: "coffeeCup", look: -0.6 }],
        [458, { ...laughP(f, 458, 1), facing: -1, armR: [[26, 10], [40, -10]] as A2, propR: "coffeeCup", propRAng: 0.5 }, 4],
        [560, { expr: "grin", facing: -1, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup" }, 10],
      ]), { idx: 3 }),
      C("judge", J, flow(f, [
        [340, { expr: "angry", facing: 0, armR: [[22, -14], [30, -44]] as A2, propR: "gavel", propRAng: -0.4 }],
        [356, { expr: "angry", facing: 0, armR: [[24, 4], [40, 10]] as A2, propR: "gavel", propRAng: 1.0 }, 3],   // BANG on "death"
        [380, { expr: "stern", facing: 0, armR: [[24, 30], [10, 44]] as A2, propR: "gavel" }, 10],
        [484, { ...laughP(f, 484, 0), facing: 0, armR: [[24, -14 + 14 * Math.max(0, Math.sin(st(f) * 0.5))], [36, -30 + 30 * Math.max(0, Math.sin(st(f) * 0.5))]] as A2, propR: "gavel" }, 4],  // laughs, raps the gavel
        [580, { expr: "grin", facing: 0, armR: [[24, 30], [10, 44]] as A2, propR: "gavel" }, 10],
      ]), { idx: 4 }),
      C("rep1", r1, flow(f, [
        [340, { expr: "smug", facing: -1, armR: [[24, 20], [30, 4]] as A2, armRFront: true, propR: "notebook" }],
        [512, { expr: "grin", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 0, headTilt: -4 }, 8],   // "the newspapers"
      ]), { idx: 5 }),
      C("rep2", r2, flow(f, [
        [340, { expr: "neutral", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera" }],
        [530, { expr: "laugh", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera", shake: 0.6, phase: f / 12 }, 8],
      ]), { idx: 6 }),
      C("rep3", r3, flow(f, [[340, { expr: "smile", facing: -1, armR: [[24, 20], [30, 4]] as A2, armRFront: true, propR: "notebook" }], [520, { expr: "laugh", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 0 }, 8]]), { idx: 7 }),
    ],
    fx: fxs(
      f >= 357 && f < 368 ? dustCard("gavel", [J[0] + 0.5, 1.62, J[2] + 0.3], 0.5, 0.7 * (1 - (f - 357) / 11), 2) : null,
      f >= 357 ? sparkle("gv", [J[0] + 0.55, 1.75, J[2] + 0.35], f - 357, 0.3) : null,
      f >= 540 && f < 552 ? glowBurst("flash3", [r2[0] - 0.25, 2.25, r2[2] + 0.1], 1.2, 1 - (f - 540) / 12, "255,255,240") : null,
      f >= 462 && f < 476 ? squiggles("cof", [GB3[0] + 0.45, 1.95, GB3[2]], f, "#c8a070", 0.22) : null,
    ),
    focus: f < 452 ? [D[0], 1.95, D[2]] : f < 520 ? follow(f, [[452, [D[0], 1.95, D[2]]], [476, [D[0], 1.9, D[2] - 0.6], 24]]) : follow(f, [[520, [D[0], 1.9, D[2] - 0.6]], [552, [r1[0], 1.8, r1[2]], 32], [654, [r1[0] + 0.4, 1.5, r1[2] - 0.1], 42]]),
    subj: f < 520 ? "forger" : "rep1",
  };
};
KICKS.push([356 / 30, 0.8]);
lens3([[340, DOF_CU], [372, DOF_MS, 24], [452, DOF_FS, 24], [520, DOF_MS, 32], [612, DOF_INSERT, 42]]);

// ================================================= SHOT 4 (654-875) YEARS EARLIER, the studio =========================
// Opens on the review in his hands (shape match from the court paper), pulls back: he scowls, crumples it, lobs it into
// the bin (arc) on "originality"; on "So he stopped being original" he turns to the easel with a sly grin and pulls the
// cloth off a scraped old canvas; "He paints a lost old masterpiece": brush strokes, the picture builds stroke by
// stroke; push into the finished canvas (object dissolve into the museum at 875).
SHOT_CAMS[4] = (s) => {
  const R = MK(s, "read"), P = MK(s, "paint"), cv = MK(s, "canvas");
  const Z0 = fit([body(add3(R, 0.1, 0, 0.12), 0.95, 1.7, 0.26)], 8, 0, 36, 0.7, 0, -0.19); // whole page in frame, above the caption band (same size/spot as the court paper it dissolves from)
  const A = fit([body(R, 0, 2.1, 0.45), [MK(s, "bin"), 0, 0.5, 0.25]], 10, 5, 40, 0.84, 0, 0.08);
  const B = fit([body(P, 0, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 18, 4, 40, 0.84, 0, 0.05);
  const Z = fit([[[cv[0], 0, cv[2] + 0.05], 0.94, 1.82, 0.37]], 0, 1, 38, 0.99);
  const S0 = F(() => Z0, 654, 0.0008), SA = F(() => A, 712, 0.0014), SB = F(() => B, 806, 0.0016), SZ = F(() => Z, 875, 0.001);
  return [K(654, S0), K(680, glideTo(S0, 680, SA, 712), 1), K(782, glideTo(SA, 782, SB, 808), 1), K(846, glideTo(SB, 846, SZ, 875), 1)];
};
SHOT_ACTS[4] = (f, s) => {
  const R = MK(s, "read"), P = MK(s, "paint"), cv = MK(s, "canvas"), bin = MK(s, "bin");
  const walk = walkPath(4, s, [R, P], f, 790, 812);
  // last stroke at 850, then he steps back out of frame right to admire it, so the push + dissolve carry no people
  const OUT4: V3 = [1.1, 0, -0.55], back = walkPath(4, s, [P, OUT4], f, 852, 870);
  const stroke = Math.sin(f * 0.5);
  const at = f >= 852 ? back.p : walk.moving || f >= 812 ? walk.p : R;
  return {
    ctl: { paint: sm(f, 816, 850), blank: 1 - sm(f, 800, 816), wet: f > 816 ? 1 : 0, review: 0, cv: 0, clock: 23 + f / 1800 },
    cast: [
      C("forger", at, back.moving ? pose(null, { expr: "smug", mode: "walk", phase: back.phase, facing: back.facing, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush" }) : walk.moving ? pose(null, { expr: "sly", mode: "walk", phase: walk.phase, facing: walk.facing }) : flow(f, [
        [654, { expr: "neutral", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1 }],
        [700, { expr: "dismay", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1, headTilt: -3 }, 10],     // reads it
        [728, { expr: "angry", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1, tilt: 4 }, 8],
        [748, { expr: "angry", facing: -1, tilt: 6, armR: [[20, 20], [6, 30]] as A2, armRFront: true, propR: "paperBall", propK: sm(f, 754, 764), armL: [[-20, 20], [-6, 30]] as A2, armLFront: true }, 8], // crumples it
        [764, { expr: "angry", facing: -1, tilt: -4, armR: [[-14, -16], [-40, -34]] as A2, armRFront: true, propR: "paperBall", propK: 1 }, 4],      // wind-up with the ball
        [768, { expr: "angry", facing: -1, tilt: -2, armR: [[-6, -20], [-20, -44]] as A2, armRFront: true }, 2],                                    // lob! (ball leaves the hand)
        [780, { expr: "sly", facing: -1, armR: [[24, 30], [10, 44]] as A2 }, 8],
        [812, { expr: "sly", facing: -1, tilt: 3, armL: [[-30, -10], [-56, -24]] as A2, armLFront: true, armR: [[24, 30], [10, 44]] as A2 }, 6],    // whips the cloth off
        [822, { expr: "determined", facing: -1, tilt: -3 + 3 * stroke, armR: mx([[30, -6], [58 + 6 * stroke, -26 - 10 * stroke]], -1), armRFront: true, propR: "paintBrush", propRAng: 0.3 * stroke, armL: [[-24, 30], [-8, 44]] as A2, armLFront: true }, 8],
      ]), { idx: 1 }),
    ],
    fx: fxs(
      ...(f >= 769 && f < 784 ? (() => { const k = (f - 769) / 15, a = add3(R, 0.2, 1.3, 0.15), c = add3(R, 0.3, 2.95, 0.1), b = add3(bin, 0, 0.42, 0), w0 = (1 - k) ** 2, w1 = 2 * k * (1 - k), w2 = k * k; const p: V3 = [w0 * a[0] + w1 * c[0] + w2 * b[0], w0 * a[1] + w1 * c[1] + w2 * b[1], w0 * a[2] + w1 * c[2] + w2 * b[2]]; // over the shoulder, never across the face
        return [{ kind: "card", key: "ball", pos: p, w: 0.16, h: 0.16, rot: f * 0.5, cw: 64, ch: 64, draw: (q: Pen) => { const g = q.g; g.fillStyle = "#efe6cc"; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 9; i++) { const aa = (i / 9) * 6.28, rr = 22 + (i % 2) * 6; g.lineTo(32 + Math.cos(aa) * rr, 32 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke(); } } as FxSpec]; })() : []),
      f >= 784 && f < 796 ? dustCard("binP", add3(bin, 0, 0.5, 0), 0.4, 0.6 * (1 - (f - 784) / 12), 3) : null,
      f >= 812 && f < 824 ? dustCard("cloth", [cv[0], 1.4, cv[2] + 0.2], 0.7, 0.5 * (1 - (f - 812) / 12), 1) : null,
    ),
    focus: f < 680 ? add3(R, 0.1, 1.35, 0.15) : f < 782 ? follow(f, [[680, add3(R, 0.1, 1.35, 0.15)], [712, [R[0], 1.8, R[2]], 32]]) : follow(f, [[782, [R[0], 1.8, R[2]]], [808, [P[0], 1.8, P[2]], 26], [875, cv, 29]]),
    subj: f < 852 ? "forger" : null,
  };
};
lens3([[654, DOF_INSERT], [680, DOF_MS, 32], [846, DOF_INSERT, 29]]);

// ================================================= SHOT 5 (875-1040) THE MUSEUM ======================================
// Opens on the masterpiece on the gallery wall (match), pulls back: the top expert peers through his magnifier, gasps,
// throws his arms up on "masterpiece of the century" (sparkles); the director hands our painter a fat money bag on "pays
// a fortune"; porters carry in two more fakes and hang them either side on "another... and another" (he winks).
SHOT_CAMS[5] = (s) => {
  const P = MK(s, "painting"), ex = MK(s, "expert"), di = MK(s, "director"), pm = MK(s, "painterM");
  const Z = fit([[[P[0], 0, P[2] + 0.1], P[1] - 0.92, P[1] + 0.92, 0.75]], 0, 1, 38, 0.99);
  const A = fit([body(ex), [[P[0], 0, P[2] + 0.1], P[1] - 0.9, P[1] + 0.9, 0.75]], 12, 4, 40, 0.86, 0, 0.05);
  const B = fit([body(ex), body(di), body(pm), [MK(s, "hang2"), -0.6, 0.6, 0.5], [MK(s, "hang3"), -0.6, 0.6, 0.5]], 0, 5, 46, 0.88, 0, 0.1);
  const SZ = F(() => Z, 875, 0.0008), SA = F(() => A, 925, 0.0016, [[930, 0.006, 10]]), SB = F(() => B, 985, 0.0012);
  return [K(875, SZ), K(895, glideTo(SZ, 895, SA, 925), 1), K(958, glideTo(SA, 958, SB, 985), 1)];
};
SHOT_ACTS[5] = (f, s) => {
  const ex = MK(s, "expert"), di = MK(s, "director"), pm = MK(s, "painterM"), P = MK(s, "painting");
  const pa = (k: number, i: number): CastPlace => { const h = i ? MK(s, "hang3") : MK(s, "hang2"), door = MK(s, "door"), a: V3 = [door[0] - 0.4, 0, door[2] - 0.2], m: V3 = [h[0] + (i ? -0.3 : 0.3) + (i ? 0.6 : -0.6), 0, h[2] + 0.95];
    const u1 = sm(k, 0, 0.75), p = lerp3(a, m, u1), moving = k > 0 && k < 0.75;
    return C(i ? "porterB" : "porterA", p, moving ? pose(null, { expr: "strain", mode: "walk", phase: ph(f, 12), facing: faceTo(5, s, f, a, m), armR: [[30, -10], [40, -36]] as A2, armL: [[-30, -10], [-40, -36]] as A2 })
      : pose(null, { expr: k >= 0.75 ? "grin" : "strain", facing: i ? 1 : -1, armR: [[30, -14], [40, -44]] as A2, armL: [[-30, -14], [-40, -44]] as A2 }), { idx: 10 + i }); };
  const h2 = sm(f, 990, 1024), h3 = sm(f, 1004, 1038);
  return {
    ctl: { hang2: h2, hang3: h3 },
    cast: [
      C("expert", ex, flow(f, [
        [875, { expr: "stare", facing: -1, tilt: 10, armR: [[24, -10], [34, -40]] as A2, armRFront: true, propR: "magnifier", look: -0.8 }],
        [905, { expr: "stare", facing: -1, tilt: 13, armR: [[24, -14], [30, -48]] as A2, armRFront: true, propR: "magnifier", look: -1, headTilt: -3 }, 10],
        [922, { expr: "eureka", facing: -1, tilt: -6, armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2, propR: "magnifier", headBack: 0.4 }, 6],    // masterpiece of the century!
        [970, { expr: "joy", facing: 1, armR: [[26, 30], [8, 40]] as A2, armRFront: true, propR: "magnifier", armL: [[-30, 10], [-50, -8]] as A2 }, 10],
      ]), { idx: 1 }),
      C("director", di, flow(f, [
        [875, { expr: "smug", facing: -1, armR: [[24, 30], [12, 44]] as A2, propR: "moneybag" }],
        [930, { expr: "eureka", facing: -1, tilt: -4, armR: [[24, 30], [12, 44]] as A2, propR: "moneybag", look: -1 }, 8],
        [956, { expr: "beam", facing: 1, armR: [[30, 10], [60, 4]] as A2, armRFront: true, propR: "moneybag" }, 10],      // pays a fortune
        [980, { expr: "proud", facing: 1, armR: [[24, 30], [12, 44]] as A2 }, 10],
      ]), { idx: 2 }),
      C("forger", pm, flow(f, [
        [875, { expr: "smug", facing: -1, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true }],
        [958, { expr: "sly", facing: -1, armL: [[-30, 10], [-56, 2]] as A2, armLFront: true }, 8],
        [972, { expr: "smug", facing: -1, armL: [[-26, 30], [-12, 44]] as A2, propL: "moneybag", headTilt: 4 }, 8],     // takes it
        [1010, { expr: "sly", facing: 1, armL: [[-26, 30], [-12, 44]] as A2, propL: "moneybag", armR: [[26, -10], [12, -34]] as A2, armRFront: true, headTilt: -5 }, 8],  // wink at the camera
      ]), { idx: 3 }),
      ...(f >= 985 ? [pa((f - 985) / 40, 0), pa((f - 999) / 40, 1)] : []),
    ],
    fx: fxs(f >= 924 ? sparkle("mc1", [P[0] - 0.4, P[1] + 0.5, P[2] + 0.2], f - 924, 0.4) : null, f >= 930 ? sparkle("mc2", [P[0] + 0.5, P[1] - 0.2, P[2] + 0.2], f - 930, 0.3) : null, f >= 960 ? sparkle("mb", [lerp(di[0], pm[0], 0.5), 1.4, di[2] + 0.3], f - 960, 0.3, "#ffe28a") : null),
    focus: f < 895 ? P : f < 958 ? follow(f, [[895, P], [925, [ex[0], 1.75, ex[2]], 30]]) : follow(f, [[958, [ex[0], 1.75, ex[2]]], [985, [di[0], 1.75, di[2]], 27]]),
    subj: f < 895 ? null : f < 958 ? "expert" : "director",
  };
};
lens3([[875, DOF_INSERT], [895, DOF_MS, 30], [958, DOF_WS, 27]]);

// ================================================= SHOT 6 (1040-1140) THE TOP NAZI (hard cut 1) =======================
// He beams at the fake on its easel, rubs his hands, pats the frame; behind, a worker shoves the cart piled with 137 real
// paintings out toward the door (tag 137). One hold with a slow push.
SHOT_CAMS[6] = (s) => {
  const o = MK(s, "official"), P = MK(s, "painting"), cp = MK(s, "cart");
  // hold A on him + the fake (camera swung left so the cart by the door stays out of frame), then on "137" a sideways
  // glide round to an end-on view of the cart: the 137 tag faces the lens and the cart rolls away out the door
  const A = fit([body(o, 0, 2.15, 0.5), [[P[0], 0, P[2]], 0.95, 2.15, 0.55]], -15, 7, 44, 0.86, 0.05, 0.05);
  const B = fit([[cp, 0.2, 2.7, 0.6], body([cp[0] - 1.0, 0, cp[2] - 0.85], 0, 2.05, 0.35)], -75, 8, 44, 0.85, 0, 0);
  const SA = F(() => A, 1040, 0.0018, [[1056, 0.005, 10]]), SB = F(() => B, 1090, 0.0012);
  return [K(1040, SA), K(1066, glideTo(SA, 1066, SB, 1090), 1)];
};
const CART6 = (f: number): V3 => { const k0 = sm(f, 1082, 1136), k = k0 * k0 * (3 - 2 * k0); return [lerp(3.3, 6.4, k), 0, lerp(1.9, 1.75, k)]; };
SHOT_ACTS[6] = (f, s) => {
  const o = MK(s, "official"), cart = sm(f, 1082, 1136), cp = CART6(f), pp: V3 = [cp[0] - 1.0, 0, cp[2] - 0.85];
  const rolling = f >= 1084 && f < 1134;
  return {
    ctl: { cart },
    cast: [
      C("nazi", o, flow(f, [
        [1040, { expr: "beam", facing: 1, armR: [[22, 10], [4, 4]] as A2, armRFront: true, armL: [[-22, 10], [-4, 6]] as A2, armLFront: true, tilt: 3 * Math.sin(f * 0.6) }],   // rubs his hands
        [1054, { expr: "smug", facing: 1, armR: [[30, -6], [58, -14]] as A2, armRFront: true, headTilt: 5 }, 8],      // pats the frame on "trades"
        [1068, { expr: "beam", facing: 1, armR: [[30, -30], [60, -46]] as A2, armL: [[-26, 2], [-40, -14]] as A2, look: 0.6, tilt: 4 }, 7],   // flicks the cart off toward the door
      ]), { idx: 1 }),
      C("porterB", pp, rolling ? pose(null, { expr: "strain", mode: "push", phase: ph(f, 11), facing: 1, tilt: 8, armR: [[30, -6], [60, -4]] as A2, armL: [[24, -2], [54, 2]] as A2, armLFront: true })
        : flow(f, [
          [1040, { expr: "neutral", facing: 1, armR: [[30, 0], [50, 10]] as A2, armL: [[-26, 6], [-30, 30]] as A2 }],
          [1066, { expr: "strain", facing: 1, tilt: -6, armR: [[30, -6], [56, -6]] as A2, armL: [[24, -2], [50, 0]] as A2, armLFront: true }, 6],   // wind-up: braces, leans back
          [1078, { expr: "strain", facing: 1, tilt: 9, armR: [[30, -6], [60, -4]] as A2, armL: [[24, -2], [54, 2]] as A2, armLFront: true }, 3],   // heave on "137"
          [1134, { expr: "grin", facing: 1, tilt: 4, armR: [[30, 0], [50, 10]] as A2, armL: [[24, 4], [40, 24]] as A2 }, 6],
        ]), { idx: 2 }),
    ],
    fx: fxs(rolling && (f % 12) < 2 ? dustCard("cartD" + Math.floor(f / 12), [cp[0] - 1.1, 0.2, cp[2]], 0.5, 0.5, 2) : null),
    focus: f < 1072 ? [o[0], 1.75, o[2]] : [cp[0] - 1.3, 1.0, cp[2]],
    subj: f < 1072 ? "nazi" : "porterB",
  };
};
lens3([[1040, DOF_FS], [1066, DOF_MS, 24]]);

// ================================================= SHOT 7 (1140-1238) THE REQUEST (hard cut 2) ========================
// Back in the dock: "Fine. Give me paint, a canvas... and an oven." - a grudging eye-roll on "Fine", then he counts on
// his fingers (one, two, three), the guard's eyebrows climb; a slow push with a punch on "oven"; a wink on "That's the
// trick" and the oven's glow floods the frame (light dissolve into the studio at 1238).
SHOT_CAMS[7] = (s) => {
  const D = MK(s, "dock");
  const A = fit([body(D, 0.9, 2.35, 0.42), body(GB3, 1.0, 2.2, 0.3)], 18, 3, 38, 0.86, 0.12, -0.2); // faces above the caption band
  return [K(1140, F(() => A, 1140, 0.0016, [[1204, 0.007, 12], [1222, 0.005, 10]]), 1, true)];
};
SHOT_ACTS[7] = (f, s) => {
  const D = MK(s, "dock");
  const f7 = flow(f, [
    [1140, { expr: "bored", facing: 0, armR: [[28, 16], [-6, 22]] as A2, armRFront: true, armL: [[-28, 16], [6, 24]] as A2, armLFront: true, look: 0.4 }],
    [1158, { expr: "bored", facing: 0, armR: [[34, 18], [52, -6]] as A2, armL: [[-34, 18], [-52, -6]] as A2, headTilt: -4 }, 8],                 // "Fine." shrug
    [1172, { expr: "smug", facing: 0, armR: [[30, -4], [44, -34]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 2 }, 6],                  // one finger: paint
    [1187, { expr: "smug", facing: 0, armR: [[30, -6], [46, -38]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: -2 }, 6],                 // two: a canvas
    [1204, { expr: "sly", facing: 0, armR: [[32, -10], [50, -44]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 5, tilt: -3 }, 6],         // three: an oven
    [1222, { expr: "smug", facing: 0, armR: [[26, -10], [8, -34]] as A2, armRFront: true, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 6, swapLid: 0 }, 6],  // "That's the trick" wink
  ]);
  const wink = f >= 1224 && f < 1236 ? 1 : 0;
  return {
    ctl: { fans: 1 },
    cast: [
      C("forger", D, pose(null, { ...speak(f, 1157, 1218, f7 as P), ...(wink ? { expr: "sly" as Face } : {}) }), { idx: 1 }),
      C("guardB", GB3, flow(f, [
        [1140, { expr: "smile", facing: -1, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup" }],
        [1200, { expr: "shock", facing: -1, tilt: -4, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup", look: -0.8 }, 8],     // an oven?!
      ]), { idx: 2 }),
    ],
    fx: fxs(f >= 1226 ? glowBurst("ovenFlash", camPt(7, s, f, 1.2, 0, -0.1), 2.2, sm(f, 1226, 1242), "255,170,90") : null,
      f >= 1206 ? sparkle("fing", [D[0] + 0.45, 2.2, D[2] + 0.1], f - 1206, 0.22) : null),
    focus: [D[0], 1.95, D[2]],
    subj: "forger",
  };
};
lens3([[1140, DOF_MS]]);

// ================================================= SHOT 8 (1238-1497) THE TRICK, studio night blue ====================
// "Old paint is rock hard": he pokes the fresh canvas, it's wet - finger sticks, shakes it. "mixes plastic into his": the
// RESIN bottle pours into his paint pot. "bakes the canvas like cookies": door down, the canvas slides in beside the
// cookie tray, door up, the glow, the clock hands spin. "rolls it over a pipe": out, up onto the pipe, tipped over it -
// the cracks run across the picture. "rubs ink in the cracks": back on the easel, the rag wipes black ink in. "300
// years in one afternoon": the varnish yellows, clock spins to five, he bites a cookie; push into the aged canvas.
SHOT_CAMS[8] = (s) => {
  const P = MK(s, "paint"), cv = MK(s, "canvas"), oven = MK(s, "oven"), roll = MK(s, "roll"), pipe = MK(s, "pipe");
  const A = fit([body(P, 0, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 14, 4, 40, 0.84, 0, 0.05);
  const B = fit([body(oven, 0, 2.15, 0.35), [MK(s, "ovenDoor"), -0.45, 0.6, 0.6], [[pipe[0], 0, pipe[2]], 0.5, 1.6, 0.5], body(roll, 0, 2.15, 0.3)], 8, 6, 50, 0.88, 0, 0.1);
  const Cc = fit([body(P, 0.4, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 10, 3, 38, 0.86);
  const Z = fit([[[cv[0], 0, cv[2] + 0.05], 0.94, 1.82, 0.37]], 0, 1, 38, 0.99);
  const SA = F(() => A, 1238, 0.0014), SB = F(() => B, 1328, 0.0012, [[1380, 0.005, 10]]), SC = F(() => Cc, 1424, 0.0016), SZ = F(() => Z, 1497, 0.001);
  return [K(1238, SA), K(1300, glideTo(SA, 1300, SB, 1330), 1), K(1402, glideTo(SB, 1402, SC, 1426), 1), K(1476, glideTo(SC, 1476, SZ, 1497), 1)];
};
SHOT_ACTS[8] = (f, s) => {
  const P = MK(s, "paint"), oven = MK(s, "oven"), roll = MK(s, "roll");
  // where he stands: easel -> oven door -> roller -> easel
  // ...then, cookie in hand, he strolls out of frame right (an acted exit) so the push into the canvas and the dissolve
  // into the courtroom carry no people
  const EXIT8: V3 = [1.25, 0, -0.3];
  const legs: [number, number, V3[]][] = [[1300, 1318, [P, oven]], [1360, 1374, [oven, roll]], [1400, 1416, [roll, P]], [1452, 1476, [P, [0.6, 0, -0.55], EXIT8]]];
  let at: V3 = P, walking: { facing: number; phase: number } | null = null;
  for (const [a, b, path] of legs) { if (f >= b) at = path[path.length - 1]; else if (f >= a) { const w = walkPath(8, s, path, f, a, b); at = w.p; walking = { facing: w.facing, phase: w.phase }; } }
  const cv = f < 1318 ? 0 : f < 1340 ? lerp(0, 2, sm(f, 1318, 1340)) : f < 1360 ? 2 : f < 1376 ? lerp(2, 3, sm(f, 1360, 1376)) : f < 1400 ? lerp(3, 4, sm(f, 1376, 1400)) : f < 1414 ? lerp(4, 5, sm(f, 1400, 1414)) : 5;
  const scrub = Math.sin(f * 0.9);
  return {
    ctl: {
      paint: 1, wet: f < 1340 ? 1 : 1 - sm(f, 1340, 1356), cv, door: sm(f, 1312, 1322) * (1 - sm(f, 1338, 1348)) + sm(f, 1356, 1364) * (1 - sm(f, 1376, 1386)),
      heat: sm(f, 1336, 1350) * (1 - sm(f, 1376, 1420)), crack: sm(f, 1380, 1402), ink: sm(f, 1414, 1438), age: sm(f, 1444, 1478),
      clock: 13 + 2 * sm(f, 1340, 1366) + 2 * sm(f, 1446, 1476), shine: 0.6 * bump((f - 1340) / 24), review: 0, lamp: 0.85,
    },
    cast: [
      C("forger", at, walking ? pose(null, f >= 1452 ? { expr: "smug", mode: "walk", phase: walking.phase, facing: walking.facing, armR: [[24, -6], [10, -30]] as A2, armRFront: true, propR: "cookie", propK: 1 } : { expr: "determined", mode: "walk", phase: walking.phase, facing: walking.facing }) : flow(f, [
        [1238, { expr: "smug", facing: -1, armR: [[26, 30], [8, 40]] as A2 }],
        [1248, { expr: "smug", facing: -1, tilt: 4, armL: [[-30, -6], [-58, -12]] as A2, armLFront: true }, 6],              // pokes the canvas
        [1262, { expr: "dismay", facing: -1, tilt: -2, armL: [[-30, -10], [-44, -34 + 8 * Math.sin(f * 1.6)]] as A2, armLFront: true }, 6],   // sticky! shakes the finger
        [1284, { expr: "sly", facing: -1, armR: [[28, -6], [46, -34]] as A2, armRFront: true, propR: "resinBottle", propRAng: -0.4, armL: [[-24, 20], [-30, 34]] as A2, armLFront: true, propL: "paintPot" }, 8],
        [1292, { expr: "sly", facing: -1, armR: [[28, -10], [38, -38]] as A2, armRFront: true, propR: "resinBottle", propRAng: -2.2, propK: 1, armL: [[-24, 20], [-30, 34]] as A2, armLFront: true, propL: "paintPot", headTilt: 4 }, 6], // pours
        [1318, { expr: "determined", facing: 1, tilt: -4, armR: [[34, 4], [62, -4]] as A2, armL: [[24, 6], [56, 0]] as A2, armRFront: true, armLFront: true }, 6],   // slides it into the oven
        [1342, { expr: "smug", facing: 1, armR: [[24, 30], [10, 44]] as A2, armL: [[-30, 10], [-50, -10]] as A2, headTilt: 3 }, 8],      // "like cookies"
        [1374, { expr: "strain", facing: -1, tilt: 6, armR: [[-24, -4], [-50, -24]] as A2, armL: [[-30, 0], [-56, -14]] as A2, armRFront: true, armLFront: true }, 6],   // pulls it over the pipe
        [1392, { expr: "strain", facing: -1, tilt: 10, armR: [[-24, 10], [-52, 18]] as A2, armL: [[-30, 14], [-56, 24]] as A2, armRFront: true, armLFront: true }, 8],
        [1416, { expr: "determined", facing: -1, tilt: 3 + 3 * scrub, armR: mx([[30, -4], [54 + 6 * scrub, -20 - 8 * scrub]], -1), armRFront: true, propR: "rag" }, 6],   // rubs the ink in
        [1440, { expr: "proud", facing: 0, armR: [[24, -10], [8, -36]] as A2, armRFront: true, propR: "cookie", headTilt: 4 }, 10],   // 300 years... a cookie
        [1446, { expr: "calm", facing: 0, armR: [[22, -14], [4, -40]] as A2, armRFront: true, propR: "cookie", propK: 1, headTilt: -3 }, 5],   // bite
      ]), { idx: 1 }),
    ],
    fx: fxs(
      f >= 1340 && f < 1380 ? squiggles("heat", [oven[0] + 0.55, 1.5, oven[2] - 0.2], f, "#ffb070", 0.32) : null,
      ...(f >= 1380 && f < 1404 ? [sparkle("cr1", add3(MK(s, "pipe"), -0.2, 0.55, 0.3), f - 1380, 0.22, "#ffffff"), sparkle("cr2", add3(MK(s, "pipe"), 0.25, 0.3, 0.4), f - 1386, 0.18, "#ffffff")] : []),
      f >= 1470 && f < 1490 ? sparkle("age", add3(MK(s, "canvas"), 0.2, 0.3, 0.1), f - 1470, 0.3, "#ffe28a") : null,
    ),
    focus: f < 1300 ? [P[0], 1.8, P[2]] : f < 1402 ? follow(f, [[1300, [P[0], 1.8, P[2]]], [1330, MK(s, "ovenDoor"), 30], [1376, MK(s, "pipe"), 16]]) : follow(f, [[1402, MK(s, "pipe")], [1426, [P[0], 1.7, P[2]], 24], [1497, MK(s, "canvas"), 29]]),
    subj: f < 1462 ? "forger" : null,
  };
};
lens3([[1238, DOF_MS], [1300, DOF_FS, 30], [1402, DOF_MS, 24], [1476, DOF_INSERT, 21]]);

// ================================================= SHOT 9 (1497-1645) THE TEST, court ================================
// Opens on the old fake (the evidence painting, match), pulls back to the experts' table: the scientist scrapes a flake,
// heats it over the spirit burner, a puff of smoke - PLASTIC (he jolts); the second one slams open the book: PLASTIC,
// INVENTED 1907 (readable); in the dock our painter buffs his nails, smug. Flashbulb dissolve at 1645.
SHOT_CAMS[9] = (s) => {
  const EV = MK(s, "painting"), A1 = MK(s, "sciA"), B1 = MK(s, "sciB"), L = MK(s, "lab");
  const Z = fit([[[EV[0], 0, EV[2]], EV[1] - 0.65, EV[1] + 0.65, 0.58]], 31, 1, 38, 0.98);
  const A = fit([body(A1), body(B1), [[L[0], 0, L[2]], 0.85, 1.2, 0.7]], 50, 6, 44, 0.88, 0, 0.1);
  const Bk = fit([body(B1, 0.9, 2.25, 0.42), [[B1[0] + 0.25, 0, B1[2] + 0.2], 0.75, 1.4, 0.34]], 18, 2, 36, 0.8, 0, -0.24); // lifted so the captions sit under the book // she holds the book open in front of her: whole PLASTIC / INVENTED 1907 spread in frame
  const SZ = F(() => Z, 1497, 0.0008), SA = F(() => A, 1540, 0.0016, [[1566, 0.006, 10]]), SB = F(() => Bk, 1622, 0.0012);
  return [K(1497, SZ), K(1510, glideTo(SZ, 1510, SA, 1540), 1), K(1596, glideTo(SA, 1596, SB, 1622), 1)];
};
SHOT_ACTS[9] = (f, s) => {
  const A1 = MK(s, "sciA"), B1 = MK(s, "sciB"), L = MK(s, "lab"), D = MK(s, "dock");
  return {
    ctl: { labOn: 1, fans: 1 },
    cast: [
      C("sciA", A1, flow(f, [
        [1497, { expr: "determined", facing: -1, tilt: 8, armR: mx([[30, -4], [56, -22]], -1), armRFront: true, propR: "scraper" }],                 // scrapes a flake
        [1534, { expr: "determined", facing: -1, tilt: 6, armR: [[-20, 10], [-40, 6]] as A2, armRFront: true, propR: "testTube", propK: 0 }, 8],          // over the burner
        [1556, { expr: "shock", facing: 0, tilt: -6, armR: [[24, -14], [34, -48]] as A2, propR: "testTube", propK: sm(f, 1556, 1580), headBack: 0.3 }, 5],  // PLASTIC!
        [1600, { expr: "aghast", facing: 1, armR: [[24, -14], [34, -48]] as A2, propR: "testTube", propK: 1, look: 1 }, 10],
      ]), { idx: 1 }),
      C("sciB", B1, flow(f, [
        [1497, { expr: "stare", facing: 1, armR: [[24, 30], [10, 44]] as A2, armL: [[-22, 20], [-10, 34]] as A2, armLFront: true, propL: "notebook" }],
        [1560, { expr: "shock", facing: 1, tilt: -4, armR: [[24, 30], [10, 44]] as A2, look: 1 }, 6],
        [1596, { expr: "eureka", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "plasticBook", headTilt: 3, armL: [[-26, 40], [-6, 62]] as A2, armLFront: true }, 8],         // slams the book open: 1907
      ]), { idx: 2 }),
      C("forger", D, flow(f, [
        [1497, { expr: "smug", facing: -1, armR: [[24, 10], [6, -6]] as A2, armRFront: true, look: -0.5 }],
        [1570, { expr: "sly", facing: -1, armR: [[24, 10], [10, -10]] as A2, armRFront: true, headTilt: 4, look: -0.8 }, 8],   // buffs his nails on his smock
      ]), { idx: 3 }),
      C("guardA", [-0.6, 0, -0.38], flow(f, [[1497, { expr: "stern", facing: -1, look: -0.8, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }], [1570, { expr: "aghast", facing: -1, look: -1, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }, 8]]), { idx: 4 }),
    ],
    fx: fxs(
      f >= 1556 && f < 1590 ? glowBurst("puff", [A1[0] + 0.25, 2.35, A1[2] + 0.1], 0.6, 1 - (f - 1556) / 34, "240,240,250") : null,
      f >= 1558 ? bang([A1[0] - 0.1, 2.6, A1[2]], f - 1558) : null,
      f >= 1634 ? glowBurst("flash9", camPt(9, s, f, 1.4, 0.2, 0.3), 2.4, sm(f, 1634, 1648), "255,255,240") : null,
    ),
    focus: f < 1510 ? MK(s, "painting") : f < 1596 ? follow(f, [[1510, MK(s, "painting")], [1540, [A1[0], 1.75, A1[2]], 30]]) : follow(f, [[1596, [A1[0], 1.75, A1[2]]], [1622, [B1[0], 1.6, B1[2] + 0.1], 26]]),
    subj: f < 1596 ? "sciA" : "sciB",
  };
};
lens3([[1497, DOF_INSERT], [1510, DOF_MS, 30]]);

// ================================================= SHOT 10 (1645-1824) THE PAYOFF, court ============================
// The flash clears on a cheering court: streamers rain down, the public jumps and waves, flashbulbs pop; he stands on the
// dock's rail beside the old fake (which fills the left of the frame), arms up. "the country ranks him its second
// favourite man": a reporter thrusts the poll page at the camera (2. THE PAINTER). "So, con man or war hero?": he
// shrugs, palms up, with a grin; a slow push in.
SHOT_CAMS[10] = (s) => {
  const EV = MK(s, "painting"), pf = PF10(s), r2 = R10(s);
  // the reporter now stands at his side (not in front of him), so the wide shows painting + painter + reporter; the
  // poll beat frames the reporter and the WHOLE page (the painter cleanly out of frame left)
  const A = fit([[[EV[0], 0, EV[2]], EV[1] - 0.66, EV[1] + 0.66, 0.6], body(pf, 0, 2.3, 0.45), body(r2, 0, 2.45, 0.42)], 30, 6, 44, 0.9, 0.1, 0.05);
  const rt = [Math.cos(24 * Math.PI / 180), 0, -Math.sin(24 * Math.PI / 180)], pp: V3 = [r2[0] + rt[0] * 0.62, 0, r2[2] + rt[2] * 0.62];
  const R = fit([body(r2, 1.2, 2.3, 0.36), [pp, 1.1, 2.0, 0.44]], 24, 3, 38, 0.9, 0, -0.32); // reporter's head + the whole poll page, big and above the caption band
  const Cc = fit([body(pf, 1.05, 2.35, 0.42)], 22, 2, 34, 0.88, 0, -0.24); // face upper-middle, caption on the chest
  const SA = F(() => A, 1645, 0.0014, [[1660, 0.005, 10]]), SR = F(() => R, 1736, 0.0012), SC = F(() => Cc, 1784, 0.0016, [[1800, 0.006, 10]]);
  return [K(1645, SA), K(1712, glideTo(SA, 1712, SR, 1738), 1), K(1764, glideTo(SR, 1764, SC, 1786), 1)];
};
const PF10 = (s: SetDef): V3 => add3(MK(s, "painting"), 1.25, -MK(s, "painting")[1], 0.75);
const R10 = (s: SetDef): V3 => add3(PF10(s), 0.95, 0, -0.25);
SHOT_ACTS[10] = (f, s) => {
  const pf = PF10(s), r2 = R10(s);
  const pubs = ["pubA", "pubB", "pubC", "pubD", "pubE", "pubF"].map((w, i) => {
    const p = MK(s, "pub" + (i + 1)), j = Math.max(0, Math.sin((f - 1645) * 0.35 + i * 1.3));
    return C(w, p, pose(null, { expr: i % 2 ? "joy" : "laugh", facing: p[0] > pf[0] ? -1 : 1, tilt: 3 * Math.sin(st(f) * 0.4 + i), armR: [[30, -30 - 6 * j], [36, -80 - 10 * j]] as A2, armL: i % 3 ? [[-30, -30], [-36, -80 + 8 * j]] as A2 : [[-24, 30], [-10, 44]] as A2, headTilt: 4 * Math.sin(f * 0.3 + i) }), { idx: 20 + i });
  });
  return {
    ctl: { payoff: 1, fans: 1.6, labOn: 0 },
    cast: [
      C("forger", pf, flow(f, [
        [1645, { expr: "joy", facing: 1, armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2, headBack: 0.3 }],                     // cheers
        [1690, { expr: "beam", facing: -1, armL: [[-34, -10], [-66, -26]] as A2, armR: [[30, -30], [36, -80]] as A2, headTilt: -4 }, 8],                  // points at the fake
        [1740, { expr: "proud", facing: 1, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true, look: 0.8 }, 10],
        [1782, { expr: "sly", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: 5 }, 8],                        // con man or war hero? shrug
        [1806, { expr: "smug", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: -4 }, 8],
      ]), { idx: 1 }),
      C("rep2", r2, flow(f, [
        [1645, { expr: "laugh", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera" }],
        [1720, { expr: "grin", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 2, headTilt: 4 }, 8],              // the poll
        [1744, { expr: "laugh", facing: 1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 2, headTilt: -4, armL: [[-30, -10], [-50, -30]] as A2 }, 6],   // jabs the page: "second favourite"
        [1768, { expr: "grin", facing: -1, armR: [[26, 30], [12, 44]] as A2, propR: "paperHead", propK: 2, armL: [[-30, -30], [-36, -80]] as A2 }, 8],       // lowers it, cheers
      ]), { idx: 2 }),
      ...pubs,
      C("guardB", [1.6, 0, -1.2], pose(null, { expr: "laugh", facing: -1, armR: [[30, -30], [36, -80]] as A2, propR: "coffeeCup", shake: 0.5, phase: f / 12 }), { idx: 3 }),   // off to the right, out of every payoff frame
    ],
    fx: fxs(
      ...[0, 1, 2].map((i) => { const t0 = 1650 + i * 37; return f >= t0 && f < t0 + 10 ? glowBurst("pf" + i, [pf[0] + 1.6 - i * 1.1, 2.4 + 0.3 * i, pf[2] + 1.2 - i * 0.4], 1.0, 1 - (f - t0) / 10, "255,255,240") : null; }),
      f >= 1648 ? sparkle("po1", add3(MK(s, "painting"), 0.3, 0.45, 0.15), (f - 1648) % 30, 0.32, "#ffe28a") : null,
      f >= 1812 ? glowBurst("flash10", camPt(10, s, f, 1.3, 0, 0.2), 2.4, sm(f, 1812, 1826), "255,255,240") : null,
    ),
    focus: f < 1712 ? [pf[0], 1.95, pf[2]] : f < 1764 ? follow(f, [[1712, [pf[0], 1.95, pf[2]]], [1738, [r2[0], 1.7, r2[2]], 26]]) : follow(f, [[1764, [r2[0], 1.7, r2[2]]], [1786, [pf[0], 2.0, pf[2]], 22]]),
    subj: "forger",
  };
};
lens3([[1645, DOF_FS], [1712, DOF_MS, 26], [1764, DOF_CU, 22]]);

// ================================================= SHOT 11 (1824-1920) ENDING, the studio ==========================
// Calm close shot: the review pinned on his corkboard; he steps into frame, taps it with his brush on "originality",
// a content smile (changed face), then turns back to his easel - looping into the hook.
const PF11: V3 = [-0.82, 0, -2.15];
SHOT_CAMS[11] = (s) => {
  const rv = MK(s, "review");
  // near straight on and a little high, him just right of the review: the canvas stays out of frame right (it hid
  // him at az 18), the wardrobe door stays left of the review, and the desk lamp sits below it (visible light source)
  const A = fit([body(PF11, 1.0, 2.2, 0.33), [[rv[0], 0, rv[2]], rv[1] - 0.32, rv[1] + 0.32, 0.26]], -8, 8, 36, 0.88);
  return [K(1824, F(() => A, 1824, 0.0016, [[1876, 0.004, 12]]))];
};
SHOT_ACTS[11] = (f, s) => {
  const rv = MK(s, "review");
  return {
    ctl: { paint: 1, age: 1, crack: 1, ink: 1, cv: 0, review: 1, clock: 17, wardR: 0.15 },
    cast: [C("forger", PF11, flow(f, [
      [1824, { expr: "smug", facing: -1, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush" }],
      [1834, { expr: "smug", facing: -1, armR: [[-24, -10], [-50, -24]] as A2, armRFront: true, propR: "paintBrush", tilt: 4 }, 8],         // taps the review
      [1862, { expr: "calm", facing: -1, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush", headTilt: 3, look: -0.6 }, 10],              // a content smile
      [1890, { expr: "calm", facing: 1, armR: [[24, 20], [30, 0]] as A2, propR: "paintBrush", look: 0.8 }, 10],                               // back to the easel
    ]), { idx: 1 })],
    fx: fxs(f >= 1842 ? sparkle("rv", [rv[0] + 0.15, rv[1] + 0.2, rv[2] + 0.05], f - 1842, 0.22, "#ffe28a") : null),
    focus: f < 1860 ? rv : [PF11[0], 1.95, PF11[2]],
    subj: "forger",
  };
};
lens3([[1824, DOF_MS]]);

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
