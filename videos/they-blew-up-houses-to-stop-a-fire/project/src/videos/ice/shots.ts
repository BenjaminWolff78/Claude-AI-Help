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
// =====================================================================================================================
// "They Blew Up Houses to Stop a Fire" - 9 scenes (shot ids 1-9) in three places: London 1666 (one long street set,
// "city"), the backyard domino table (today), the wildfire ridge (today). Master prompt v10.13 part 13:
//  - every boom, collapse, jump, splash and starve the narration names happens on screen with cause and effect and a
//    camera kick; the climax (fuse -> three booms) and the payoff (the fire starves, the mayor's one bucket) run as one
//    continuous moving camera path;
//  - most shots carry a real move (crane, truck, ride the spark, aerial glide, orbit, push past a foreground object);
//  - place changes: dust dissolve (1->2), time-jump dissolve on one continuous camera path (2->3), shape match house row
//    -> domino row (5->6), steam dissolve (8->9), and cuts on the beats (cathedral, the trick + stinger, day three);
//  - hands do the verbs (linstock to the fuse, pushing barrels, pulling ropes, the chalk on the board, the domino flick,
//    the throw); no moustaches; focus on whoever speaks.
// Accent fuse orange-red #E8462A (powder barrels, the Captain's sash, the sparks).
const ST: Room = { x0: -50, x1: 42, z0: -2.55, z1: 2.55, y1: 9.5 };
/** one smooth camera move through several framings (cubic Hermite in time, Catmull-Rom tangents): the camera never stops
 *  between the keys, only at the first and last (so a long flight counts as ONE move, not a chain of stop-and-go glides) */
type CK = { f: number; pos: V3; look: V3; fov: number };
const spline = (ks: CK[]) => (f: number): Shot => {
  const n = ks.length; if (f <= ks[0].f) return { pos: ks[0].pos, look: ks[0].look, fov: ks[0].fov, roll: 0 };
  if (f >= ks[n - 1].f) return { pos: ks[n - 1].pos, look: ks[n - 1].look, fov: ks[n - 1].fov, roll: 0 };
  let i = 0; while (f > ks[i + 1].f) i++;
  const a = ks[i], b = ks[i + 1], h = b.f - a.f, t = (f - a.f) / h, t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const m = (j: number, g: (k: CK) => number) => (j <= 0 || j >= n - 1 ? 0 : (g(ks[j + 1]) - g(ks[j - 1])) / (ks[j + 1].f - ks[j - 1].f));
  const H = (g: (k: CK) => number) => h00 * g(a) + h10 * h * m(i, g) + h01 * g(b) + h11 * h * m(i + 1, g);
  return { pos: [0, 1, 2].map((c) => H((k) => k.pos[c])) as V3, look: [0, 1, 2].map((c) => H((k) => k.look[c])) as V3, fov: H((k) => k.fov), roll: 0 };
};
const sparkCard = (key: string, pos: V3, f: number, s = 0.32): FxSpec[] => fxs(
  glowBurst("sp" + key, pos, s * 2.2, 0.75 + 0.25 * Math.sin(f * 1.9)),
  { kind: "card", key: "spk" + key + (f % 3), pos, w: s, h: s, rot: f * 0.5, soft: true, cw: 96, ch: 96,
    draw: (p) => { const g = p.g; g.fillStyle = "#fff2b0"; g.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + (f % 3), r = i % 2 ? 10 : 44; g.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = "#ff9a3a"; g.beginPath(); g.arc(48, 48, 12, 0, 6.3); g.fill(); } } as FxSpec,
);
/** a run along a polyline between frames a and b: position, screen facing and a run phase (stride ~1.1 m) */
const runPath = (id: number, s: SetDef, pts: V3[], f: number, a: number, b: number, stride = 1.1) => {
  const u = lin(f, a, b), w = polyAt(pts, u), dist = u * polyLen(pts), moving = f > a && f < b;
  return { p: w.p, facing: screenSide(id, s, f, w.d[0], w.d[1]), phase: ((dist / stride) % 1 + 1) % 1, moving };
};
/** a world-fixed rolling dust / steam cloud: cards spread from A toward B, growing and thickening over [a, b] */
const cloudRoll = (key: string, A: V3, B: V3, f: number, a: number, b: number, n = 5, size = 3.2, steam = false): FxSpec[] => {
  if (f < a) return [];
  const k = sm(f, a, b), out: FxSpec[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, p = lerp3(A, B, u * k);
    const card = dustCard(key + i, [p[0] + 0.6 * Math.sin(i * 2.1), p[1] + 0.4 * i * (1 - u) + 0.15 * Math.sin(f * 0.05 + i), p[2] + 0.5 * Math.cos(i * 1.7)], size * (0.6 + 0.6 * k) * (0.8 + 0.4 * u), Math.min(1, k * 1.3) * 0.95, i + (steam ? 3 : 0), 0.2 * Math.sin(i + f * 0.01));
    if (steam) card.key = "st" + card.key, card.draw = ((d) => (p2) => { const g = p2.g; g.save(); g.filter = "saturate(0) brightness(1.25)"; d(p2); g.restore(); })(card.draw!);
    out.push(card);
  }
  return out;
};
/** water flying in an arc from A to B (bucket throw), k 0..1 along the flight */
const waterArc = (key: string, A: V3, B: V3, k: number, s = 1): FxSpec[] => {
  if (k <= 0 || k >= 1) return [];
  const out: FxSpec[] = [];
  for (let i = 0; i < 6; i++) {
    const u = Math.max(0, Math.min(1, k - i * 0.05)), p = lerp3(A, B, u);
    out.push({ kind: "card", key: "wa" + (i % 3), pos: [p[0], p[1] + 0.7 * Math.sin(Math.PI * u) * s, p[2]], w: (0.24 - i * 0.025) * s, h: (0.18 - i * 0.02) * s, cw: 64, ch: 48,
      draw: (pp) => { const g = pp.g; g.fillStyle = "#bfe8ff"; g.strokeStyle = INKC; g.lineWidth = 4; g.beginPath(); g.ellipse(32, 24, 28, 18, 0, 0, 6.3); g.fill(); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(24, 18, 5, 0, 6.3); g.fill(); } });
  }
  return out;
};
/** a flying burning brand (a small cartoon flame + glow), for embers jumping a gap */
const brand = (key: string, pos: V3, f: number, s = 0.9): FxSpec[] => fxs(glowBurst("br" + key, pos, s * 2.4, 0.8),
  { kind: "card", key: "brand" + (f % 4), pos, w: s * 0.7, h: s, rot: 0.25 * Math.sin(f * 0.7), cw: 96, ch: 128,
    draw: (p) => { const g = p.g, w = 1 + 0.08 * Math.sin(f * 1.3); g.lineWidth = 8; g.strokeStyle = INKC;
      const fl = (sc: number, col: string) => { g.beginPath(); g.moveTo(48, 122); g.bezierCurveTo(10 * sc + 38 * (1 - sc), 110, 14, 70 * w, 48, 8 + 30 * (1 - sc)); g.bezierCurveTo(82, 70 * w, 86 * sc + 58 * (1 - sc), 110, 48, 122); g.closePath(); g.fillStyle = col; g.fill(); };
      fl(1, "#ff6a2a"); g.stroke(); fl(0.7, "#ffb43a"); fl(0.4, "#fff2a0"); } } as FxSpec);
const ARF = {
  shieldR: [[22, -20], [8, -44]] as A2, shieldL: [[-22, -20], [-8, -44]] as A2, earR: [[26, -14], [10, -36]] as A2, earL: [[-26, -14], [-10, -36]] as A2,
  crossR: [[20, 18], [-10, 18]] as A2, crossL: [[-20, 18], [10, 18]] as A2, chinR: [[22, 10], [6, -14]] as A2, cheer: [[24, -30], [30, -66]] as A2,
};

// ================================================= SCENE 1 (0-95) HOOK: the Captain blows up a house the fire hasn't reached
// Frame 1: a kneeling soldier holds his smoking linstock to the short fuse of a POWDER barrel at a tidy timber house;
// the street burns further down (east). He scrambles up and runs toward us; BOOM (40): the house bursts, chunks fly,
// the camera kicks; he ducks, then grins. The camera trucks left, then cranes up and back as the dust rolls at us
// (the dust carries the dissolve into the night bakery).
const S1CAP: V3 = [-4.0, 0, -1.95], S1RUN: V3 = [-6.7, 0, -0.7], S1F0: V3 = [-3.62, 0.08, -2.42], S1F1: V3 = [-3.25, 0.5, -2.82];
SHOT_CAMS[1] = () => {
  // frame 1 close and big: the kneeling Captain (42% of the frame) holds the linstock to the barrel's fuse, the house
  // front beside him; as he scrambles at us the camera backs off to a wider view with the whole house in frame for the
  // BOOM (40), then cranes up and back over the dust and the new gap
  const A0 = { pos: [-7.4, 1.25, -0.85] as V3, look: [-3.85, 1.05, -2.45] as V3, fov: 44 };
  const A1 = { pos: [-10.5, 1.6, 1.4] as V3, look: [-4.6, 2.4, -2.6] as V3, fov: 46 };
  const B = { pos: [-15.5, 5.4, 1.4] as V3, look: [2.0, 3.0, -1.6] as V3, fov: 46 };
  const S0 = F(() => A0, 0, 0.0010), S1 = FS(() => A1, 36, 0.0012, -0.006), S2 = FS(() => B, 92, 0.0006, 0.004);
  return [K(0, S0, 24, true), K(12, glideTo(S0, 12, S1, 36, 0.2), 1), K(56, glideTo(S1, 56, S2, 97, 0.5), 1)];
};
KICKS.push([40 / 30, 0.9]);
SHOT_ACTS[1] = (f, s) => {
  const r = runPath(1, s, [S1CAP, S1RUN], f, 16, 38, 1.2);
  const kneel = (k: number): P => ({ mode: "kneel", kneelK: k, expr: "determined", facing: -1, tilt: -6, armL: [[-26, 8], [-50, 16]] as A2, armLFront: true, propL: "linstock", propLAng: -0.9, propK: f * 0.3, armR: [[22, 20], [12, 34]] as A2 });
  const cap: P = f < 16 ? flow(f, [[0, kneel(1)], [6, { ...kneel(1), expr: "sly", headTilt: 4 }, 6], [8, { ...kneel(0.8), expr: "blank", headTilt: 2 }, 2], [10, { ...kneel(0.4), expr: "yikes", armL: [[-20, 4], [-30, -10]] as A2 }, 6]]) as P
    : f < 38 ? { mode: "run", phase: r.phase, facing: r.facing, expr: "yikes", tilt: 8, propL: "linstock", propLAng: -0.4, propK: f * 0.3, armL: [[-22, -6], [-30, -28]] as A2, hatLift: 0.2 }
    : flow(f, [
      [38, { expr: "yikes", facing: -1, tilt: 4, propL: "linstock", propLAng: -0.4, armL: [[-22, -6], [-30, -28]] as A2, look: -0.6 }],
      [41, { expr: "shock", facing: -1, tilt: 12, armR: ARF.shieldR, armL: ARF.shieldL, armRFront: true, armLFront: true, propL: "linstock", hatLift: 0.7, hatTilt: -10 }, 3],
      [58, { expr: "grin", facing: 1, tilt: 2, armR: [[24, 10], [40, -2]] as A2, armRFront: true, armL: [[-22, 20], [-12, 34]] as A2, propL: "linstock", propLAng: -0.2, hatLift: 0.15, headTilt: 5 }, 10],
      [80, { expr: "proud", facing: -1, tilt: 0, armR: [[26, 14], [10, 26]] as A2, armL: [[-22, 20], [-12, 34]] as A2, propL: "linstock", propLAng: -0.2, look: -0.7 }, 10],
    ]) as P;
  const capPos = f < 16 ? S1CAP : f < 38 ? r.p : S1RUN;
  const sold: P = flow(f, [
    [0, { expr: "nervous", facing: -1, mode: "kneel", kneelK: 0.6, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true, sweat: 1 }],
    [40, { expr: "yikes", facing: -1, mode: "kneel", kneelK: 0.8, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true, tilt: 10, hatLift: 0.5 }, 3],
    [62, { expr: "dazed", facing: 1, mode: "kneel", kneelK: 0.6, armR: [[22, 20], [12, 34]] as A2, armL: ARF.earL, armLFront: true }, 10],
  ]) as P;
  const sp = lerp3(S1F0, S1F1, lin(f, 4, 40));
  const cam95 = camAt(1, s, 95).pos;
  return {
    ctl: { front: 8.4, shell: 17, barrels: 1, wind: 1, b1n: (f - 40) / 30, hook: 1, hookAge: 99 },
    cast: [C("capt", capPos, pose(null, cap), { idx: 1 }), C("sold1", [-5.6, 0, -2.9], pose(null, sold), { idx: 2 })],
    fx: fxs(f < 40 ? sparkCard("s1", sp, f, 0.28) : null, f >= 40 && f < 49 ? glowBurst("bm1", [-4.2, 2.5, -3.2], 4.5, 1 - (f - 40) / 9, "255,210,120") : null,   // a burst at the house, not a frame wash
      cloudRoll("d1", [-4.4, 1.0, -2.4], [cam95[0] + 3.2, 1.6, cam95[2] - 0.9], f, 66, 97, 5, 2.6)),
    // focus stays on the Captain through the blast (never a blurred foreground character over a sharp background)
    focus: f < 16 ? [S1CAP[0], 1.0, S1CAP[2]] : [capPos[0], 1.5, capPos[2]],
    subj: f < 70 ? "capt" : null,
  };
};
lens3([[0, DOF_FS], [46, DOF_WS, 30]]);

// ================================================= SCENE 2 (95-337) 1666, NIGHT: the bakery catches, the mayor shrugs
// One continuous camera path: out of the dust, a crane down over the night roofs (the cat on the ridge, lit windows) to
// the bakery door, where a small flame licks the shop front; "caught fire" (202-209): it whooshes up the whole house
// and the baker bursts out flapping a rag (making it worse), runs a panicked loop and flaps at his burning door. A glide
// along the street to a depth two-shot: the mayor (nightcap, candle, ONE BUCKET) waddles into the foreground, squints:
// "One bucket could handle that" (lip-sync 270-302, the bucket lifted on "bucket") while the baker freezes behind him and
// stares (the reactor). He sets the bucket down in the street, yawns, pads off; the baker runs for water; the lone
// bucket holds the frame into the time-jump dissolve (same camera on into scene 3).
const MAY_STOP: V3 = [33.95, 0, -2.25], BAK_STOP: V3 = [32.4, 0, -2.8];
// mayor right and near (3.4 m), baker left and deeper (4.8 m) by his door: no overlap, faces in the upper third
const S2CC = { pos: [35.8, 2.1, 0.8] as V3, look: [33.3, 0.9, -2.55] as V3, fov: 48 };
// slow push-in on the two; once the mayor has gone, a crane down onto the lone bucket (lifts it clear of the Shorts UI)
const S2HOLD = (f: number): Shot => {
  const b = FS(() => S2CC, 252, 0.0008, -0.001)(f), k = sm(f, 314, 338), T: V3 = [33.5, 0.2, -1.94];
  return { ...b, pos: [b.pos[0] - 0.25 * k, b.pos[1] - 0.7 * k, b.pos[2] - 0.2 * k], look: [lerp(b.look[0], T[0], 0.4 * k), b.look[1] - 0.75 * k, lerp(b.look[2], T[2], 0.4 * k)] };
};
SHOT_CAMS[2] = () => {
  // high over the street looking east along the night roofs to the bakery end ("London's made of wood"), then down to its door
  const A = { pos: [25.0, 8.2, 0.4] as V3, look: [35.5, 3.6, -2.6] as V3, fov: 50 };
  const B = { pos: [30.2, 1.25, 2.55] as V3, look: [32.7, 2.45, -3.6] as V3, fov: 44 };
  return [K(95, spline([{ f: 95, ...A }, { f: 196, ...B }, { f: 252, ...S2CC }]), 24, true), K(252, S2HOLD, 1)];
};
SHOT_ACTS[2] = (f, s) => {
  const door = MK(s, "bakerDoor");
  const bk = runPath(2, s, [[door[0], 0, -2.75], [31.7, 0, -1.9], [32.8, 0, -1.9], BAK_STOP], f, 204, 234, 1.0);
  const bo = runPath(2, s, [BAK_STOP, [31.0, 0, -1.9], [28.8, 0, -0.6]], f, 318, 340, 1.0);
  const flap = Math.sin(st(f, 2) * 0.9);
  const flapP: P = { expr: "yikes", facing: -1, tilt: 3, propR: "rag", armR: [[28, -14 + 12 * flap], [46, -40 + 26 * flap]] as A2, armRFront: true, sweat: 1 };
  const baker: P = f < 234 ? { mode: "run", phase: bk.phase, facing: bk.facing, expr: "yikes", tilt: 6, propR: "rag", armR: [[26, -16 + 10 * flap], [40, -46 + 24 * flap]] as A2, armRFront: true, sweat: 1 }
    : f >= 318 ? { mode: "run", phase: bo.phase, facing: bo.facing, expr: "determined", tilt: 8, propR: "rag", armR: [[26, -10], [40, -36]] as A2, armRFront: true, sweat: 1 }
    : f < 266 ? flapP
    : flow(f, [
      [266, flapP],
      [268, { expr: "aghast", facing: 1, tilt: 0, propR: "rag", armR: [[22, 14], [16, 30]] as A2, armRFront: true, sweat: 1, look: 0.3 }, 3],   // freezes, stares at the mayor
      [303, { expr: "blank", facing: 1, tilt: 4, propR: "rag", armR: [[22, 14], [16, 30]] as A2, armRFront: true, sweat: 1, look: -0.6 }, 4], // looks down at the bucket
      [312, { expr: "determined", facing: -1, tilt: 6, propR: "rag", armR: [[26, -10], [40, -36]] as A2, armRFront: true, sweat: 1 }, 4],      // turns to run
    ]) as P;
  const mw = walkPath(2, s, [[41.5, 0, 0.2], [36.6, 0, -1.0], [35.0, 0, -1.9], MAY_STOP], f, 140, 252);
  const mo = walkPath(2, s, [MAY_STOP, [34.9, 0, -2.6], [36.4, 0, -2.3]], f, 314, 372);   // off to the right along the houses
  const BUCK = "bucket";
  // the bucket in his LEFT hand (screen left, toward the baker) so he sets it down away from his exit; candle in the right
  const mayIdle: P = { expr: "bored", facing: -1, propL: BUCK, armL: [[-22, 26], [-26, 42]] as A2, armLFront: true, propR: "candle", armR: [[24, 6], [22, -14]] as A2, armRFront: true, propK: f, hatTilt: 6 };
  const mayor: P = f < 252 ? { ...mayIdle, mode: "walk", phase: mw.phase, facing: mw.facing, expr: "sleep" }
    : f >= 314 ? { ...mayIdle, mode: "walk", phase: mo.phase, facing: mo.facing, expr: "sleep", propL: undefined, armL: undefined }
    : speak(f, 270, 302, flow(f, [
      [252, { ...mayIdle, expr: "sleep" }],
      [254, { ...mayIdle, expr: "bored", tilt: -10, headTilt: -4, look: -0.5 }, 8],                                                       // leans in, squints
      [266, { ...mayIdle, expr: "smug", tilt: -2, armL: [[-22, -4], [-30, -24]] as A2 }, 6],                                                  // lifts the bucket
      [278, { ...mayIdle, expr: "smug", tilt: 0, armL: [[-24, -14], [-34, -40]] as A2, headTilt: 4 }, 3],                                    // "bucket": up
      [290, { ...mayIdle, expr: "bored", tilt: -2, armL: [[-24, -4], [-32, -22]] as A2, headTilt: -3 }, 8],
      [297, { ...mayIdle, expr: "bored", tilt: -6, armL: [[-28, 6], [-54, 10]] as A2, look: -0.4 }, 6],                                    // holds it out to the side...
      [305, { ...mayIdle, expr: "sleep", tilt: -2, propL: undefined, armL: [[-28, 4], [-54, 4]] as A2 }, 2],                                 // ...and lets it drop
      [309, { ...mayIdle, expr: "sleep", tilt: 0, propL: undefined, armL: [[-18, 26], [-10, 42]] as A2 }, 4],
      [307, { ...mayIdle, expr: "sleep", tilt: 4, mouth: "O", propL: undefined, armL: [[-24, -30], [-28, -60]] as A2, armR: [[26, -24], [30, -52]] as A2, headBack: 0.6 }, 4], // yawn + stretch
    ]) as P);
  const mayPos = f < 252 ? mw.p : f >= 314 ? mo.p : MAY_STOP;
  const bak = sm(f, 186, 200) * 0.45 + 0.05;
  return {
    ctl: { night: 1, wind: 0.55, bakery: f < 200 ? 0.22 + bak * 0.5 : 0.5 + 0.5 * sm(f, 200, 210), bakDoorOff: lin(f, 201, 205), bucket: f >= 305 ? 1 : 0, bucketY: f < 305 ? 0 : Math.max(0, 0.62 - 4.9 * ((f - 305) / 30) ** 2) },
    cast: [
      ...(f >= 204 ? [C("baker", f < 234 ? bk.p : f >= 318 ? bo.p : BAK_STOP, pose(null, baker), { idx: 1 })] : []),
      C("mayor", mayPos, pose(null, f >= 305 && f < 314 ? { ...mayor, propL: undefined } : mayor), { idx: 2 }),   // the bucket leaves his hand as it lands
      C("neighbour", [30.2, 0, 2.7], flow(f, [[95, { expr: "sleep", facing: 1, propR: "lantern", armR: [[22, 10], [26, -8]] as A2, armRFront: true, propK: f }], [205, { expr: "shock", facing: 1, propR: "lantern", armR: [[22, -6], [28, -30]] as A2, armRFront: true, propK: f, tilt: -4 }, 4]]), { idx: 3 }),
      C("granny", [36.4, 0, 2.75], flow(f, [[95, { expr: "neutral", facing: -1, propR: "candle", armR: [[22, 10], [20, -8]] as A2, armRFront: true, propK: f }], [205, { expr: "aghast", facing: -1, propR: "candle", armR: [[22, 10], [20, -8]] as A2, armRFront: true, propK: f, armL: [[-22, -6], [-12, -30]] as A2 }, 4], [304, { expr: "dismay", facing: -1, propR: "candle", armR: [[22, 10], [20, -8]] as A2, armRFront: true, propK: f, look: 0.5 }, 8]]), { idx: 4 }),
    ],
    fx: fxs(f >= 200 && f < 212 ? glowBurst("wh", [32.5, 2.2, -3.2], 2.6, 0.6 * (1 - (f - 200) / 12)) : null, ...splash("bk2", [33.5, 0.22, -1.94], f - 316, 0.35)),
    focus: follow(f, [[110, [33.2, 4.0, -3.6]], [214, [door[0], 1.4, -3.0], 60], [252, () => [mayPos[0], 1.85, mayPos[2]], 22], [318, [33.5, 0.3, -1.94], 20]]),
    subj: f < 242 || f >= 318 ? null : "mayor",
  };
};
lens3([[95, DOF_WS], [188, DOF_FS, 40], [252, DOF_MS, 20]]);

// ================================================= SCENE 3 (337-513) BY MORNING: roof to roof -> the riverfront -> buckets
// The same camera, dawn now (a time-jump dissolve on the same path): flames hop roof to roof westward (embers), the
// camera rises and pulls back over the south row ("The bakery." ablaze, "The street." burning end to end), swings up
// over the street to the warehouses on the quay (PITCH & TAR) going up ("The whole riverfront."), then dives over the
// warehouses down to a bucket chain on the quay: the baker throws a bucket at a burning warehouse door, it hisses to
// steam, the flames don't even flicker ("Buckets do nothing.").
// the baker at the PITCH & TAR door (door centre x 23.6, front z 12.66), the chain running off to the east
const CH: V3[] = [[24.2, 0, 13.35], [25.75, 0, 14.15], [26.5, 0, 14.7], [27.3, 0, 15.25]];   // the chain stays just out of the throw shot
SHOT_CAMS[3] = () => {
  const h = S2HOLD(339), A = { pos: h.pos, look: h.look, fov: h.fov ?? 48 };   // = scene 2's camera at the dissolve (no double image)
  const B = { pos: [25.4, 14.0, 1.2] as V3, look: [30.8, 7.2, -6.4] as V3, fov: 50 };
  const Cc = { pos: [21.0, 15.5, 5.6] as V3, look: [31.0, 4.5, -3.0] as V3, fov: 50 };
  const D = { pos: [13.5, 9.5, 25.0] as V3, look: [24.0, 3.2, 11.0] as V3, fov: 50 };
  const E = { pos: [23.3, 2.1, 19.4] as V3, look: [23.65, 1.95, 12.66] as V3, fov: 46 };   // whole PITCH & TAR sign, door left, baker right: throw, hiss, nothing
  const SE = FS(() => E, 472, 0.0008, 0.0025);
  return [K(337, spline([{ f: 339, ...A }, { f: 398, ...B }, { f: 426, ...Cc }, { f: 452, ...D }, { f: 472, ...E }]), 24, true), K(472, SE, 1)];
};
SHOT_ACTS[3] = (f, s) => {
  const front = f < 398 ? lerp(31.2, 26.2, sm(f, 345, 398)) : f < 432 ? lerp(26.2, 21.4, sm(f, 400, 432)) : lerp(21.4, 20.4, sm(f, 432, 480));
  const swing = (i: number) => Math.sin(st(f) * 0.32 + i * 1.6);
  const passer = (i: number): P => ({ expr: "determined", facing: i % 2 ? 1 : -1, tilt: 6 * swing(i), propR: "bucket", armR: [[24 + 8 * swing(i), 10], [36 + 16 * swing(i), 22 - 10 * swing(i)]] as A2, armRFront: true, sweat: 1 });
  const thrower: P = flow(f, [
    [466, { expr: "determined", facing: -1, tilt: 0, propR: "bucket", armR: [[22, 20], [20, 36]] as A2, armRFront: true, sweat: 1 }],
    [480, { expr: "strain", facing: -1, tilt: 12, propR: "bucket", armR: [[26, 10], [44, 24]] as A2, armRFront: true, sweat: 1 }, 6],                    // wind-up
    [488, { expr: "strain", facing: -1, tilt: -14, propR: "bucket", propRAng: -1.6, armR: [[-24, -12], [-50, -24]] as A2, armRFront: true, sweat: 1 }, 3], // throw
    [500, { expr: "blank", facing: -1, tilt: -4, propR: "bucket", propRAng: -2.6, armR: [[-22, -6], [-40, -14]] as A2, armRFront: true, sweat: 1 }, 6],
    [506, { expr: "dismay", facing: 1, tilt: 0, propR: "bucket", propRAng: -2.8, armR: [[22, 4], [30, -14]] as A2, armRFront: true, sweat: 1, look: 0.6 }, 8],
  ]) as P;
  return {
    ctl: { night: 0, front, shell: 38, wharf: sm(f, 438, 458), wind: 1, bucket: 1, ...(f < 440 ? {} : { lx: 22, lz: 10, lk: 1 }) },
    cast: f < 466 ? [] : [
      C("baker", CH[0], pose(null, thrower), { idx: 1 }),
      C("cit1", CH[1], pose(null, passer(1)), { idx: 2 }), C("cit3", CH[2], pose(null, passer(2)), { idx: 3 }), C("cit4", CH[3], pose(null, passer(3)), { idx: 4 }),
    ],
    fx: fxs(waterArc("w3", [23.95, 1.5, 13.2], [23.35, 1.4, 12.75], lin(f, 488, 494), 0.8), splash("sp3", [23.35, 1.3, 12.72], f - 494, 1.1),
      f >= 494 ? cloudRoll("stm3", [23.3, 1.3, 12.75], [22.8, 3.6, 12.7], f, 494, 520, 3, 1.1, true) : null),
    focus: follow(f, [[337, [33.6, 1.6, -3.0]], [398, [31.0, 7.0, -4.5], 50], [428, [31.0, 5.0, -3.0], 30], [452, [24.0, 3.2, 11.0], 26], [472, [CH[0][0], 1.6, CH[0][2]], 20]]),
    subj: f < 480 ? null : "baker",
  };
};
lens3([[337, DOF_MS], [345, DOF_WS, 30], [466, DOF_FS, 20]]);

// ================================================= SCENE 4 (513-613) THE CATHEDRAL'S LEAD ROOF MELTS LIKE SOUP
// Cut (a new place, a beat): low under the burning cathedral; molten lead pours out of the gutter spouts (530-560) and
// the camera cranes down with the falling stream to the street, where it runs past a cook kneeling with his soup bowl;
// he scoops (575), lifts a shiny silver dollop, licks his lips ("like soup", 587)... and his eyes go huge (592).
const SOUP: V3 = [-46.9, 0, -2.6];
SHOT_CAMS[4] = () => {
  const A = { pos: [-44.5, 1.3, 8.6] as V3, look: [-55.0, 15.0, -1.5] as V3, fov: 54 };
  const B = fit([body(SOUP, 0, 1.55, 0.42), [[-46.4, 0.1, -1.6], 0, 0.3, 0.4]], 38, 6, 36, 0.82, -0.1, 0.05);
  const SA = FS(() => A, 513, 0.0006, 0.004), SB = FS(() => B, 578, 0.0008, 0.008);
  // one shot: the camera cranes down with the falling lead ("runs down the street") onto the cook, no cut
  return [K(513, SA, 24, true), K(556, glideTo(SA, 556, SB, 578, 0, [0, 0, 0], 0, 0.25), 1)];
};
SHOT_ACTS[4] = (f, s) => {
  const kn = (o: P): P => ({ mode: "kneel", kneelK: 1, facing: 1, ...o });
  const cook: P = flow(f, [
    [513, kn({ expr: "neutral", propR: "soupBowl", propK: 0, armR: [[24, 16], [34, 22]] as A2, armRFront: true, look: -0.6, headBack: 0.3 })],
    [530, kn({ expr: "shock", propR: "soupBowl", propK: 0, armR: [[24, 16], [34, 22]] as A2, armRFront: true, look: -0.6, headBack: 0.5 }), 4],
    [574, kn({ expr: "sly", tilt: -14, propR: "soupBowl", propK: 0, armR: [[20, 30], [10, 56]] as A2, armRFront: true, look: 0 }), 6],                    // scoops
    [584, kn({ expr: "joy", tilt: -2, propR: "soupBowl", propK: 1, armR: [[22, 6], [26, -12]] as A2, armRFront: true, mouth: "lick" }), 5],                // lifts: "soup!"
    [598, kn({ expr: "yikes", tilt: 6, propR: "soupBowl", propK: 1, armR: [[22, 6], [30, -10]] as A2, armRFront: true, sweat: 1, hatLift: 0.4 }), 3],      // eyes huge
  ]) as P;
  return {
    ctl: { cath: 1, lead: sm(f, 522, 562), front: -44, shell: -30, wind: 0.6 },
    cast: [C("soupGuy", SOUP, pose(null, cook), { idx: 1 }),
      C("cit2", [-47.8, 0, 2.2], flow(f, [[513, { expr: "aghast", facing: -1, armR: [[22, -10], [12, -34]] as A2, armL: [[-22, -10], [-12, -34]] as A2, headBack: 0.6 }], [592, { expr: "yikes", facing: -1, armR: [[22, -10], [12, -34]] as A2, armL: [[-22, -10], [-12, -34]] as A2, look: -0.4 }, 6]]), { idx: 2 })],
    fx: fxs(f >= 584 && f < 604 ? sparkle("lead", [SOUP[0] + 0.35, 1.0, SOUP[2] + 0.25], f - 586, 0.22, "#ffffff") : null),
    focus: follow(f, [[513, [-51.3, 13.0, -2.2]], [574, [SOUP[0], 1.0, SOUP[2]], 16]]),
    subj: f < 570 ? null : "soupGuy",
  };
};
lens3([[513, DOF_WS], [566, DOF_CU, 12]]);

// ================================================= SCENE 5 (613-1050) DAY TWO: powder, mockery, the hooks fail
// 5a+b 613-742 (one move): the Captain and two soldiers roll POWDER barrels up the street toward the fire (truck along);
//      the camera keeps going past them to the street: everyone turns on "street" (685) and the wife shouts "You're
//      blowing up our houses?!" (lip-sync 700-738, finger jabbing at the barrels).
// 5c+d 742-847: cut to the Captain: pats a barrel, "No house, no fire." (758-794, deadpan, one finger up); the camera
//      swings to the street laughing: the kid booms his arms "Kaboom!" (827) and the crowd laughs together.
// 5e+f 847-945: cut to the hooks: the baker and a neighbour haul two ropes on a fire-hook, the house's upper floors
//      topple into the street (862-880, dust, kick); the camera pans with embers that jump the gap (884-936) and the next
//      house catches.
// 5g+h 945-1050: cut to the wife, arms crossed: "See? Pointless." (950-980); the camera glides to the Captain (he looks
//      at the gap, hand to chin) and past him down to a low view along the house row (shape match into the dominoes).
const ROLL = (f: number) => 5.4 * sm(f, 598, 676);
const barrelAt = (k: number, f: number): V3 => [2 - k * 1.4 + ROLL(f), 0, 0.6 + (k - 1) * 0.9];
const CAP5: V3 = [barrelAt(0, 999)[0] - 0.62, 0, -0.3];
const CROWD5 = { neighbour: [9.4, 0, 2.95] as V3, wife: [10.5, 0, 2.6] as V3, kid66: [11.3, 0, 1.8] as V3, cit2: [12.2, 0, 3.0] as V3, cit3: [9.0, 0, -2.85] as V3, cit1: [10.0, 0, -2.5] as V3, granny: [11.2, 0, -2.75] as V3 };
SHOT_CAMS[5] = (s) => {
  const grp = (f: number): V3 => barrelAt(1, f);
  const A = (f: number) => { const g = grp(f); return { pos: [g[0] - 6.4, 2.05, 2.5] as V3, look: [g[0] + 3.2, 1.25, -0.45] as V3, fov: 46 }; };   // all three pushers well inside the frame
  // a little higher (el 9): the burning upper floors sit above the heads instead of on them
  const Bw = inRoom(fit([body(CROWD5.wife, 0.9, 2.1, 0.4), body(CROWD5.neighbour, 0.9, 2.1, 0.3), body(CROWD5.kid66, 0.6, 1.5, 0.3)], -104, 9, 40, 0.86, 0.1), ST);
  const Cc = { pos: [9.75, 1.72, 0.95] as V3, look: [CAP5[0], 1.62, CAP5[2]] as V3, fov: 36 };
  const Dd = { pos: [10.9, 1.6, -2.3] as V3, look: [11.15, 1.15, 2.6] as V3, fov: 56 };   // the kid booming between the wife and cit2
  // the hook: a low angle from the middle of the street (in front of the onlookers, never among them) up at the pullers
  // and the hooked upper floors; then a pan up and left with the embers as they jump the gap onto the north row
  const E = { pos: [9.2, 1.5, 1.6] as V3, look: [16.5, 2.2, -1.5] as V3, fov: 62 };   // braced faces at ~60% height, above the captions
  const Fj = (f: number) => { const u = sm(f, 886, 946); return { pos: [lerp(9.2, 8.8, u), lerp(1.5, 1.8, u), lerp(1.6, 0.9, u)] as V3, look: [lerp(16.5, 12.6, u), lerp(2.2, 5.2, u), lerp(-1.5, -3.4, u)] as V3, fov: lerp(62, 54, u) }; };
  // the wife: a slow orbit around her (she stays put, the street turns behind her)
  const Gw = (f: number) => inRoom(fit([body(CROWD5.wife, 0.95, 2.15, 0.42)], lerp(-122, -116, lin(f, 940, 990)), 3, 34, 0.8, -0.12), ST);
  const Hc = fit([body(CAP5, 0.6, 2.2, 0.4)], -47, 3, 40, 0.72, -0.15);   // the Captain left of frame, the burning row behind him
  const Iend = { pos: [7.6, 3.4, 1.4] as V3, look: [20.0, 3.6, -4.0] as V3, fov: 44 };
  const SA = F(A, 613, 0.0004), SB = FS(() => Bw, 694, 0.0008, 0.0025), SC = FS(() => Cc, 738, 0.0008, -0.0025), SD = FS(() => Dd, 798, 0.0006, -0.005);
  const SE = FS(() => E, 858, 0.0008, -0.006, [[874, 0.004, 12]]), SF = F(Fj, 886, 0.0002), SG = F(Gw, 940, 0.0010), SH = FS(() => Hc, 1002, 0.0008, 0.012), SI = F(() => Iend, 1046, 0.0006);
  // shots: barrels->crowd glide 613-738 | Captain 738-798 | laugh 798-858 | hook + embers 858-940 | wife, then a quick
  // whip-glide to the Captain and on up the house row 940-1050 (every shot 2 s or more; cuts on beats)
  return [K(613, SA, 24, true), K(666, glideTo(SA, 666, SB, 694, 1.6, [0, 0, 0], 0.35), 1), K(738, SC, 24, true), K(798, SD, 24, true),
    K(858, SE, 24, true), K(884, glideTo(SE, 884, SF, 894), 1), K(940, SG, 24, true), K(990, glideTo(SG, 990, SH, 1002), 1), K(1018, glideTo(SH, 1018, SI, 1046, 0, [0, 0, 0], 0.4), 1)];
};
KICKS.push([876 / 30, 0.6]);
SHOT_ACTS[5] = (f, s) => {
  const rolling = f < 676;
  const pusher = (k: number, who: string): CastPlace => {
    const b = barrelAt(k, f), p: V3 = [b[0] - 0.62, 0, b[2]];
    const o: P = rolling ? { mode: "push", facing: 1, expr: k === 0 ? "determined" : "strain", phase: ph(f + k * 5, 12), tilt: 4, sweat: k ? 1 : 0 }
      : flow(f, [[676, { mode: "push", facing: 1, expr: "determined", tilt: 4 }], [684, { expr: k === 0 ? "calm" : "nervous", facing: 1, tilt: 0, armR: [[22, 20], [12, 34]] as A2, look: 0.4 }, 8]]) as P;
    return C(who, p, pose(null, o), { idx: 10 + k });
  };
  // the Captain after the roll: 5c pats the barrel and speaks; 5d deadpan while they laugh; 5h hand to chin, looking at the gap
  const capt: CastPlace = f < 742 ? pusher(0, "capt") : C("capt", CAP5, pose(null, speak(f, 758, 794, flow(f, [
    [742, { expr: "smug", facing: 1, tilt: 0, armR: [[24, 20], [44, 30]] as A2, armRFront: true }],
    [748, { expr: "smug", facing: 1, tilt: 3, armR: [[26, 18], [48, 34]] as A2, armRFront: true }, 3],                                   // pats the barrel
    [756, { expr: "smug", facing: 1, tilt: 0, armR: [[26, 4], [40, -22]] as A2, armRFront: true, headTilt: 2 }, 6],                     // one finger up: "no house"
    [776, { expr: "smug", facing: 1, tilt: 0, armR: [[28, 2], [46, -16]] as A2, armRFront: true, headTilt: -3 }, 6],                    // "no fire"
    [800, { expr: "bored", facing: -1, tilt: 0, armR: [[22, 20], [12, 34]] as A2, look: -0.3 }, 8],
    [990, { expr: "determined", facing: 1, tilt: 2, armR: ARF.chinR, armRFront: true, look: 0.7 }, 10],                                     // looks at the gap, hand to chin
  ]) as P)), { idx: 10 });
  // the north-side neighbours flee when the fire jumps onto their row (granny's house catches): run west past the soldiers
  const flee = (who: keyof typeof CROWD5, i: number, base: P, laughAt: number): CastPlace => {
    const lane = -2.9 + 0.55 * (i - 3), pts: V3[] = [CROWD5[who], [CROWD5[who][0] - 2, 0, lane], [-1 - 1.2 * (i - 3), 0, lane]], a0 = 928 + (i - 3) * 6, r = runPath(5, s, pts, f, a0, a0 + Math.round((polyLen(pts) / 4.2) * 30), 1.2);
    if (f < a0) return stage(who, i, base, laughAt);
    return C(who, r.p, pose(null, r.moving || f < a0 + 6 ? { mode: "run", phase: r.phase, facing: r.facing, expr: "yikes", tilt: 8, hatLift: 0.2, armR: [[24, -10], [36, -36]] as A2 } : { expr: "yikes", facing: 1, look: 0.6 }), { idx: 20 + i });
  };
  const stage = (who: keyof typeof CROWD5, i: number, base: P, laughAt: number): CastPlace => C(who, CROWD5[who], pose(null, flow(f, [
    [613, { ...base, expr: base.expr ?? "neutral" }],
    [683, { ...base, expr: "aghast", look: -0.5 }, 4],                                                                  // "The street goes": all turn together
    [laughAt, { ...base, ...laughP(f, laughAt, i), armR: [[22, 16], [10, 30]] as A2 }, 4],                             // "Kaboom" laugh
    [870, { ...base, expr: "shock", look: 0.5 }, 6],
    [948, { ...base, expr: "smug", armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }, 8],
  ]) as P), { idx: 20 + i });
  const wife = C("wife", CROWD5.wife, pose(null, speak(f, 700, 738, speak(f, 950, 980, flow(f, [
    [613, { expr: "neutral", facing: -1, armR: [[22, 20], [12, 34]] as A2, look: 0.3 }],
    [683, { expr: "aghast", facing: -1, armL: [[-24, -10], [-14, -34]] as A2 }, 4],
    [698, { expr: "angry", facing: -1, tilt: -6, armL: [[-28, -4], [-56, -12]] as A2, armLFront: true }, 6],                       // jabs a finger at the barrels
    [716, { expr: "angry", facing: -1, tilt: -8, armL: [[-28, -2], [-58, -6]] as A2, armLFront: true, headTilt: -3 }, 3],
    [742, { expr: "stern", facing: -1, tilt: 0, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }, 8],
    [827, { ...laughP(f, 827, 0), facing: -1 }, 4],
    [868, { expr: "shock", facing: 1, look: 0.4 }, 6],
    [946, { expr: "smug", facing: -1, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true, headTilt: 4 }, 6],    // "See? Pointless."
    [962, { expr: "smug", facing: -1, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true, headTilt: -5, headBack: 0.3 }, 4],
  ]) as P))), { idx: 20 });
  const kid = C("kid66", CROWD5.kid66, pose(null, flow(f, [
    [613, { expr: "neutral", facing: -1, look: 0.2 }], [683, { expr: "shock", facing: -1 }, 4],
    [820, { expr: "grin", facing: -1, tilt: 4, armR: [[16, 10], [6, 16]] as A2, armL: [[-16, 10], [-6, 16]] as A2, armRFront: true, armLFront: true }, 6],          // wind-up: fists together
    [826, { expr: "guffaw", facing: -1, tilt: -4, armR: [[30, -20], [56, -50]] as A2, armL: [[-30, -20], [-56, -50]] as A2, headBack: 0.5 }, 2],               // "KABOOM!" arms burst
    [846, { ...laughP(f, 846, 3), facing: -1 }, 6], [870, { expr: "shock", facing: 1 }, 6],
  ]) as P), { idx: 26 });
  // the hook pullers (baker + cit4): braced on the ropes from 613, heave 852-866, let go and scramble back 866-880
  const pull = (who: string, at: V3, run: V3, i: number): CastPlace => {
    // they let go as the floors come down and scramble clear, straight on west out of the street (lane clear of the Captain)
    const pts: V3[] = [at, run, [run[0] - 1.5, 0, -1.25], [-6.5, 0, -1.25]], r = runPath(5, s, pts, f, 866, 866 + Math.round((polyLen(pts) / 4.4) * 30), 1.2);
    const heave = Math.sin(st(f) * 0.5 + i) * (f > 850 && f < 866 ? 1 : 0.3);
    const o: P = f < 846 ? flow(f, [[613, { expr: "neutral", facing: -1, look: -0.4 }], [683, { expr: "aghast", facing: -1 }, 4], [829, { ...laughP(f, 829, i + 6), facing: -1 }, 4], [840, { expr: "determined", facing: -1, look: -0.3 }, 4]]) as P
      : f < 866 ? { mode: "brace", braceK: sm(f, 846, 852), facing: -1, expr: "strain", tilt: 14 + 6 * heave, armR: [[26, -4], [48, -10]] as A2, armL: [[20, 2], [44, -2]] as A2, armRFront: true, sweat: 1 }
      : r.moving || f < 872 ? { mode: "run", phase: r.phase, facing: r.facing, expr: "yikes", tilt: 8, hatLift: 0.3, armR: [[24, -10], [36, -36]] as A2 }
      : { expr: "yikes", facing: 1, look: 0.6 };   // same face on arrival (no bare swap)
    return C(who, f < 866 ? at : r.p, pose(null, o), { idx: 30 + i });
  };
  const hk = sm(f, 860, 879);
  // sold1 backs off to the powder cart while nobody is looking (keeps him out of the lens in the Captain's shot)
  const S1A: V3 = [barrelAt(1, 999)[0] - 0.62, 0, 0.6], s1w = walkPath(5, s, [S1A, [3.2, 0, 1.0]], f, 872, 920);
  return {
    ctl: { night: 0, front: 19.2, shell: 29, wind: 1, roll: f < 742 ? ROLL(f) : 5.4, hookPole: f >= 846 ? 1 : 0, hook: hk, hookAge: (f - 876) / 30, jump: lin(f, 886, 934) * 1.15, bucket: 1 },
    cast: [
      capt, ...(f < 742 ? [pusher(1, "sold1"), pusher(2, "sold2")] : [C("sold1", f < 872 ? S1A : s1w.p, pose(null, f >= 872 && f < 920 ? { mode: "walk", phase: s1w.phase, facing: s1w.facing, expr: "sheepish" } : flow(f, [[742, { expr: "nervous", facing: 1 }], [827, { expr: "sheepish", facing: 1, look: 0.5 }, 6], [920, { expr: "nervous", facing: 1, look: 0.4 }, 6]])), { idx: 11 }), C("sold2", [barrelAt(2, 999)[0] - 0.62, 0, 1.5], pose(null, flow(f, [[742, { expr: "neutral", facing: 1 }], [827, { expr: "sheepish", facing: 1 }, 6]])), { idx: 12 })]),
      wife, kid,
      stage("neighbour", 1, { expr: "neutral", facing: -1, hatTilt: 4 }, 829),
      stage("cit2", 2, { expr: "neutral", facing: -1 }, 828),
      flee("cit3", 3, { expr: "neutral", facing: 1 }, 830),
      flee("cit1", 4, { expr: "neutral", facing: 1 }, 827),
      flee("granny", 5, { expr: "neutral", facing: 1, armR: [[22, 20], [12, 34]] as A2 }, 831),
      pull("baker", MK(s, "pull1"), [12.3, 0, -1.7], 1), pull("cit4", MK(s, "pull2"), [13.2, 0, -2.5], 2),
    ],
    fx: fxs(
      ...[0, 1, 2].map((i) => { const u = lin(f, 886 + i * 6, 930 + i * 4); return u > 0 && u < 1 ? brand("j" + i, [lerp(20.6, 12.8, u), 6.2 + 3.2 * Math.sin(Math.PI * u) - i * 0.4, -4.2 + i * 0.5], f + i * 7, 1.1 - i * 0.2) : null; })),
    focus: follow(f, [[613, (g) => [barrelAt(1, g)[0], 1.0, 0.6]], [702, [CROWD5.wife[0], 1.85, CROWD5.wife[2]], 26], [738, [CAP5[0], 1.9, CAP5[2]]], [798, [11.1, 1.4, 2.1]],
      [858, [14.3, 1.6, -0.3]], [884, [16.8, 4.5, -3.0], 12], [936, [12.6, 5.0, -3.6], 4], [940, [CROWD5.wife[0], 1.85, CROWD5.wife[2]]], [1000, [CAP5[0], 1.95, CAP5[2]], 8], [1046, [14.0, 3.0, -3.6], 30]]),
    subj: f < 680 ? "capt" : f < 738 ? "wife" : f < 798 ? "capt" : f < 858 ? "kid66" : f < 884 ? "baker" : f < 940 ? null : f < 994 ? "wife" : f < 1016 ? "capt" : null,
  };
};
lens3([[613, DOF_FS], [706, DOF_MS, 20], [738, DOF_CU], [798, DOF_MS], [858, DOF_FS], [940, DOF_CU], [992, DOF_MS, 8], [1016, DOF_FS, 30]]);

// ================================================= SCENE 6 (1050-1267) YOU + DOMINOES (today, a backyard picnic table)
// Shape match from the house row: a low 3/4 view along the domino line. YOUR hand sets the last domino at the start
// (1062-1072) and flicks it (1086): the whole line goes (truck along it with the wave). Then you pull three out of the
// middle of the second line (1133-1144, they stay fanned in your hand), flick it (1150): the wave stops at the gap
// (1166). Push in on you holding the three: "Same dominoes. Same push. Nothing left to knock over."
SHOT_CAMS[6] = (s) => {
  const A0 = MK(s, "domA0"), you = MK(s, "domYou");
  // a low view along the line (matches the house row it dissolves from), then up to a 3/4 front view that holds YOU and all ten
  const A = (f: number) => { const u = sm(f, 1046, 1084); return { pos: [lerp(-0.4, 0.6, u), lerp(1.0, 1.7, u), lerp(1.55, 2.8, u)] as V3, look: [lerp(1.25, 0.6, u), lerp(0.86, 1.2, u), lerp(0.15, -0.1, u)] as V3, fov: lerp(38, 44, u) }; };
  const B = { pos: [0.75, 1.55, 2.5] as V3, look: [0.55, 1.1, -0.1] as V3, fov: 42 };
  const Cc = inRoom(fit([body(you, 0.95, 2.12, 0.46)], 8, 4, 34, 0.8, 0, 0.05), { x0: -6, x1: 6, z0: -4, z1: 8 });
  const SA = FS(A, 1084, 0.0006, 0.002), SB = FS(() => B, 1142, 0.0008, -0.0025), SC = FS(() => Cc, 1206, 0.0008, 0.0025);
  return [K(1050, SA, 24, true), K(1124, glideTo(SA, 1124, SB, 1142), 1), K(1184, glideTo(SB, 1184, SC, 1206), 1)];
};
SHOT_ACTS[6] = (f, s) => {
  const you = MK(s, "domYou");
  const o: P = flow(f, [
    [1046, { expr: "sly", facing: 0, armR: [[22, 20], [12, 34]] as A2, armL: [[-22, 20], [-12, 34]] as A2, look: 0 }],
    [1060, { expr: "determined", facing: -1, tilt: -10, armL: [[-26, 18], [-50, 38]] as A2, armLFront: true }, 8],                                   // sets the first domino
    [1074, { expr: "sly", facing: 0, tilt: -6, armL: [[-26, 16], [-46, 30]] as A2, armLFront: true }, 6],
    [1080, { expr: "sly", facing: 0, tilt: -8, armL: [[-26, 16], [-50, 34]] as A2, armLFront: true }, 6],                                            // wind-up: finger to it
    [1086, { expr: "grin", facing: 0, tilt: -8, armL: [[-26, 14], [-44, 30]] as A2, armLFront: true }, 2],                                           // flick
    [1100, { expr: "joy", facing: 1, tilt: 0, armL: [[-22, 20], [-12, 34]] as A2, look: 0.7 }, 8],                                                    // watches the wave go
    [1130, { expr: "determined", facing: 0, tilt: -10, armR: [[24, 18], [36, 38]] as A2, armRFront: true }, 6],                                    // pulls three out
    [1142, { expr: "sly", facing: 0, tilt: -2, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes" }, 6],
    [1146, { expr: "sly", facing: 0, tilt: -8, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes", armL: [[-26, 16], [-48, 34]] as A2, armLFront: true }, 4],
    [1150, { expr: "grin", facing: 0, tilt: -8, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes", armL: [[-26, 14], [-42, 30]] as A2, armLFront: true }, 2],
    [1170, { expr: "smug", facing: 0, tilt: 0, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes", headTilt: 4 }, 8],              // it stops
    [1188, { expr: "grin", facing: 0, tilt: 0, armR: [[24, -10], [32, -38]] as A2, armRFront: true, propR: "dominoes" }, 6],                          // "same dominoes": holds them up
    [1210, { expr: "sly", facing: 0, tilt: 2, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes", armL: [[-26, 2], [-46, -6]] as A2, armLFront: true }, 6], // "same push": a poke
    [1230, { expr: "smug", facing: 0, tilt: -3, armR: [[24, 6], [34, -10]] as A2, armRFront: true, propR: "dominoes", armL: [[-24, 12], [-44, 26]] as A2, armLFront: true, look: -0.4 }, 8], // points at the gap
    [1250, { expr: "smug", facing: 0, tilt: 0, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true, propR: undefined, headTilt: 5 }, 8],
  ]) as P;
  return {
    ctl: { placed: f >= 1071 ? 1 : 0, domA: f < 1087 ? 0 : 10.4 * lin(f, 1087, 1110), domB: f < 1151 ? 0 : 5 * lin(f, 1151, 1165), pulled: f >= 1140 ? 1 : 0 },
    cast: [C("you2", you, pose(null, f >= 1250 && f < 1258 ? { ...o, propR: "dominoes" } : o), { idx: 1 })],
    fx: fxs(f >= 1086 && f < 1100 ? sparkle("fl", [MK(s, "domA0")[0], 0.98, MK(s, "domA0")[2]], f - 1086, 0.16) : null, f >= 1150 && f < 1164 ? sparkle("fl2", [MK(s, "domB0")[0], 0.98, MK(s, "domB0")[2]], f - 1150, 0.16) : null),
    focus: follow(f, [[1050, [MK(s, "domA0")[0] + 0.4, 0.86, 0.36]], [1082, [0.6, 1.0, 0.0], 30], [1210, [you[0], 1.75, you[2]], 26]]),
    subj: f < 1124 ? null : "you2",
  };
};
lens3([[1050, DOF_INSERT], [1150, DOF_MS, 24], [1210, DOF_CU, 24]]);

// ================================================= SCENE 7 (1267-1406) THAT'S THE TRICK: the tavern's chalk board
// Cut + stinger. Night, the tavern THE LEAKY BUCKET; the Captain with a chalk at the FIRE'S MENU board (TIMBER, TAR,
// THATCH, THE NEXT HOUSE). "Fire can only eat what it can reach": he taps down the list; "Make the gap too wide": he
// strikes out THE NEXT HOUSE; "and it starves": SOLD OUT. A slow orbit past the lantern.
const BOARD: V3 = [-10.9, 1.2, -2.7], CAPT7: V3 = [-10.12, 0, -2.53];
SHOT_CAMS[7] = () => {
  const at = (az: number, r: number, y: number) => ({ pos: [BOARD[0] + r * Math.sin((az * Math.PI) / 180), y, BOARD[2] + r * Math.cos((az * Math.PI) / 180)] as V3, look: [BOARD[0] + 0.26, 1.2, BOARD[2] + 0.08] as V3, fov: 42 });
  const O = (f: number) => { const u = lin(f, 1267, 1406); return at(lerp(32, 14, u), lerp(4.6, 4.4, u), lerp(1.6, 1.55, u)); };
  return [K(1267, F(O, 1267, 0.0004), 24, true)];
};
SHOT_ACTS[7] = (f) => {
  // board-relative hand targets (screen space, left of him): items at heights 1.55 (TIMBER) .. 0.95 (THE NEXT HOUSE)
  const tap = (y: number): A2 => [[-36, 2 + y * 0.4], [-80, -6 + y]];
  const o: P = flow(f, [
    [1262, { expr: "sly", facing: -1, tilt: 0, propL: "chalk", armL: [[-22, 18], [-26, 4]] as A2, armLFront: true, look: 0.8 }],
    [1276, { expr: "calm", facing: -1, tilt: -4, propL: "chalk", armL: tap(-30), armLFront: true }, 6],                    // "Fire can only eat": TIMBER
    [1302, { expr: "calm", facing: -1, tilt: -4, propL: "chalk", armL: tap(-18), armLFront: true }, 4],                    // TAR
    [1314, { expr: "calm", facing: -1, tilt: -5, propL: "chalk", armL: tap(-6), armLFront: true }, 4],                     // THATCH
    [1328, { expr: "sly", facing: -1, tilt: -6, propL: "chalk", armL: tap(8), armLFront: true }, 4],                      // THE NEXT HOUSE ("reach")
    [1350, { expr: "determined", facing: -1, tilt: -6, propL: "chalk", armL: [[-30, 6], [-50, 4]] as A2, armLFront: true }, 6], // wind-up
    [1356, { expr: "determined", facing: -1, tilt: -10, propL: "chalk", armL: [[-36, 10], [-84, 14]] as A2, armLFront: true }, 3], // strike!
    [1366, { expr: "determined", facing: -1, tilt: -8, propL: "chalk", armL: [[-26, 14], [-44, 22]] as A2, armLFront: true }, 6],
    [1374, { expr: "smug", facing: -1, tilt: -8, propL: "chalk", armL: [[-34, 22 + 6 * Math.sin(f * 1.1)], [-70 - 10 * Math.sin(f * 0.9), 34]] as A2, armLFront: true }, 4], // writes SOLD OUT
    [1388, { expr: "smug", facing: 1, tilt: 2, propL: "chalk", armL: [[-22, 18], [-26, 4]] as A2, armLFront: true, headTilt: 5, look: 0.2 }, 8],
  ]) as P;
  return {
    ctl: { night: 1, front: 30, shell: 999, wind: 0.6, menu: f < 1360 ? 1 : f < 1384 ? 2 : 3, bucket: 1 },
    cast: [C("capt", CAPT7, pose(null, o), { idx: 1 })],
    fx: fxs(f >= 1360 && f < 1372 ? sparkle("ch1", [BOARD[0] + 0.05, 0.98, BOARD[2] + 0.12], f - 1360, 0.2) : null, f >= 1384 && f < 1398 ? sparkle("ch2", [BOARD[0] + 0.0, 0.72, BOARD[2] + 0.12], f - 1384, 0.24) : null),
    focus: [BOARD[0] + 0.2, 1.3, BOARD[2] + 0.1],
    subj: "capt",
  };
};
lens3([[1267, DOF_MS]]);

// ================================================= SCENE 8 (1406-1723) DAY THREE: the fuse, three booms, the fire starves
// One continuous camera path (the climax + the payoff, 10.6 s): a high wide over the street (the gap houses with their
// POWDER barrels, the fire wall up the street, soldiers and crowd behind the Captain) cranes down to him kneeling at
// the fuse; "blows" (1445): linstock to fuse; the camera rides the racing spark low along the cobbles, pulls up and
// back as BOOM (1503) BOOM (1517) BOOM (1532) march down the street (kicks, chunks, dust); the flags drop as the wind
// dies; an aerial glide along the fire wall as it roars up to the gap and starves (1576-1650); down to the last little
// flame in the rubble: the mayor strides in with his ONE BUCKET and puts it out (1708-1712, steam); the crowd cheers.
const FUSE_PTS: V3[] = [[-11, 0.04, 0.4], [-6.5, 0.04, 0.1], [-3.2, 0.04, -2.6], [-2, 0.04, 0.2], [1.0, 0.04, -2.7], [2.2, 0.04, 0.2], [5.2, 0.04, -2.7], [5.6, 0.04, 2.7]];
const fuseK = (f: number) => f < 1447 ? 0 : f < 1503 ? (2 / 7) * lin(f, 1447, 1503) : f < 1517 ? 2 / 7 + (2 / 7) * lin(f, 1503, 1517) : f < 1532 ? 4 / 7 + (2 / 7) * lin(f, 1517, 1532) : Math.min(1, 6 / 7 + (1 / 7) * lin(f, 1532, 1536));
/** the spark position on the fuse (CatmullRom by segment, linear here: close enough for the camera ride) */
const sparkAt = (f: number): V3 => { const k = fuseK(f) * 7, i = Math.min(6, Math.floor(k)), u = k - i; return lerp3(FUSE_PTS[i], FUSE_PTS[i + 1], u); };
const CAPF: V3 = [-11.7, 0, 0.75], MAY8A: V3 = [-15.0, 0, -1.9], MAY8: V3 = [4.55, 0, 0.12], LAST: V3 = [5.6, 0.55, -0.6];
SHOT_CAMS[8] = () => {
  const A = { pos: [-23.5, 8.0, 1.6] as V3, look: [-2.0, 2.4, -0.9] as V3, fov: 46 };
  const B = { pos: [-15.4, 1.55, 2.35] as V3, look: [-11.2, 0.95, 0.3] as V3, fov: 40 };
  const R = (f: number) => { const p = sparkAt(Math.min(f, 1494)); return { pos: [p[0] - 2.4, 0.72, lerp(2.2, 1.6, lin(f, 1446, 1494))] as V3, look: [p[0] + 2.4, 0.42, p[2] * 0.4 - 0.4] as V3, fov: 44 }; };
  const Cb = (f: number) => ({ pos: [lerp(-11.8, -11.2, lin(f, 1506, 1548)), lerp(3.6, 3.9, lin(f, 1506, 1548)), 1.9] as V3, look: [lerp(-0.5, 0.6, lin(f, 1506, 1548)), 2.4, -0.7] as V3, fov: 50 });
  const D = (f: number) => { const u = lin(f, 1584, 1652); return { pos: [lerp(-7.5, -6.6, u), 15.5, lerp(1.0, 1.15, u)] as V3, look: [lerp(7.5, 7.7, u), lerp(2.3, 2.2, u), -0.8] as V3, fov: 46 }; };
  // the payoff keeps moving: a slow orbit (10 deg) around the last flame while the mayor runs in and throws his bucket
  const E = (f: number) => { const u = sm(f, 1652, 1723), a = ((34 - 10 * u) * Math.PI) / 180, r = lerp(4.85, 4.55, u); return { pos: [5.08 + r * Math.cos(a), 1.56, -0.32 + r * Math.sin(a)] as V3, look: [5.08, 0.95, -0.32] as V3, fov: 40 }; };
  const SA = F(() => A, 1406, 0.0004), SB = FS(() => B, 1444, 0.001, 0.003), SR = F(R, 1446, 0.0001), SC = F(Cb, 1506, 0.0002), SD = F(D, 1584, 0.0002), SE = F(E, 1652, 0.0004);
  return [K(1406, SA, 24, true), K(1406, glideTo(SA, 1406, SB, 1444, 0, [0, 0.6, 0]), 1), K(1444, glideTo(SB, 1444, SR, 1466, 0, [0, 0, 0], 0, 0.2), 1),
    K(1482, glideTo(SR, 1482, SC, 1506, 0.3), 1), K(1546, glideTo(SC, 1546, SD, 1584, 0.4), 1), K(1652, SE, 24, true)];
};
for (const t of [1503, 1517, 1532]) KICKS.push([t / 30, 0.95]);
SHOT_ACTS[8] = (f, s) => {
  const kn = (k: number, o: P): P => ({ mode: "kneel", kneelK: k, facing: 1, ...o });
  const cap: P = flow(f, [
    [1406, kn(1, { expr: "determined", propR: "linstock", propK: f * 0.3, armR: [[24, 6], [34, -10]] as A2, armRFront: true, look: 0.6 })],
    [1438, kn(1, { expr: "sly", propR: "linstock", propK: f * 0.3, armR: [[24, 4], [36, -14]] as A2, armRFront: true, headTilt: 4 }), 6],             // wind-up
    [1444, kn(1, { expr: "determined", tilt: 10, propR: "linstock", propRAng: 1.1, propK: f * 0.3, armR: [[26, 20], [44, 40]] as A2, armRFront: true }), 3], // "blows": touches the fuse
    [1460, kn(1, { expr: "grin", tilt: 2, propR: "linstock", propRAng: 0.3, propK: f * 0.3, armR: [[24, 10], [36, 2]] as A2, armRFront: true, look: 0.8 }), 8],
    [1498, kn(0.6, { expr: "nervous", propR: "linstock", propK: f * 0.3, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }), 6],
    [1503, kn(0.8, { expr: "yikes", tilt: -8, propR: "linstock", propK: f * 0.3, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true, hatLift: 0.5 }), 2],
    [1540, kn(0.2, { expr: "proud", tilt: 0, propR: "linstock", propK: f * 0.3, armR: [[24, 10], [36, 2]] as A2, armRFront: true, look: 0.7 }), 10],
    [1600, { mode: "kneel", kneelK: 0, expr: "calm", facing: 1, propR: "linstock", propK: f * 0.3, armR: [[22, 20], [12, 34]] as A2, look: 0.7 }, 10],
    [1714, { mode: "kneel", kneelK: 0, expr: "grin", facing: 1, propR: "linstock", propK: f * 0.3, armR: ARF.cheer, armRFront: true, headTilt: 5 }, 4],
  ]) as P;
  // crowd behind (west): flinch together on the first boom, cheer together on the splash
  const crowd = (who: string, at: V3, i: number, face: number): CastPlace => C(who, at, pose(null, flow(f, [
    [1406, { expr: "nervous", facing: face, look: 0.5, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }],
    [1503, { expr: "yikes", facing: face, tilt: -6, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }, 2],
    [1560, { expr: "stare", facing: face, armR: [[22, 20], [12, 34]] as A2, look: 0.6 }, 10],
    [1712, { expr: i % 2 ? "joy" : "beam", facing: face, armR: ARF.cheer, armL: [[-24, -30], [-30, -66]] as A2, armRFront: true, headBack: 0.4 }, 3],
  ]) as P), { idx: 40 + i });
  const mw = runPath(8, s, [MAY8A, [-12, 0, -2.5], [-8, 0, -0.6], [0.2, 0, 1.0], MAY8], f, 1548, 1690, 1.15);
  const mayor: P = f < 1548 ? flow(f, [[1406, { expr: "bored", facing: 1, propR: "bucket", armR: [[22, 26], [26, 42]] as A2, armRFront: true, hatTilt: 6 }], [1503, { expr: "yikes", facing: 1, propR: "bucket", armR: [[22, 26], [26, 42]] as A2, armRFront: true, hatLift: 0.4 }, 2], [1530, { expr: "determined", facing: 1, propR: "bucket", armR: [[22, 26], [26, 42]] as A2, armRFront: true, hatTilt: 6, look: 0.6 }, 8]]) as P
    : f < 1694 ? { mode: "run", phase: mw.phase, facing: mw.facing, expr: "determined", tilt: 6, propR: "bucket", armR: [[22, 20], [30, 34]] as A2, armRFront: true, hatTilt: 6 }
    : flow(f, [
      [1694, { expr: "determined", facing: 1, propR: "bucket", armR: [[22, 26], [26, 42]] as A2, armRFront: true, hatTilt: 6 }],
      [1700, { expr: "strain", facing: 1, tilt: -8, propR: "bucket", armR: [[-6, 16], [-24, 30]] as A2, armRFront: true, hatTilt: 6 }, 5],                  // wind-up
      [1706, { expr: "determined", facing: 1, tilt: 10, propR: "bucket", propRAng: 1.6, armR: [[26, 0], [52, -8]] as A2, armRFront: true, hatTilt: 6 }, 2], // throw
      [1716, { expr: "proud", facing: 1, tilt: 0, propR: "bucket", propRAng: 2.6, armR: [[24, 4], [36, -10]] as A2, armRFront: true, hatTilt: 10, headTilt: 5 }, 8],
    ]) as P;
  const B = (t0: number) => (f - t0) / 30;
  return {
    ctl: { front: 8.4, shell: 17, barrels: 1, hook: 1, hookAge: 99, fuse: fuseK(f), b1n: B(1503), b1s: B(1504), b2n: B(1517), b2s: B(1518), b3n: B(1532), b3s: B(1534),
      wind: 1 - sm(f, 1548, 1580), roar: sm(f, 1576, 1606) * (1 - sm(f, 1618, 1650)), die: sm(f, 1612, 1652), last: f < 1630 ? 0 : sm(f, 1630, 1642), splash: (f - 1712) / 30, bucket: 0 },
    cast: [
      C("capt", CAPF, pose(null, cap), { idx: 1 }),
      C("sold1", [-13.4, 0, -1.3], pose(null, flow(f, [[1406, { expr: "nervous", facing: 1, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }], [1503, { expr: "yikes", facing: 1, tilt: -6, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true, hatLift: 0.4 }, 2], [1560, { expr: "beam", facing: 1, armR: [[22, 20], [12, 34]] as A2 }, 10], [1712, { expr: "joy", facing: 1, armR: ARF.cheer, armRFront: true }, 3]]) as P), { idx: 2 }),
      C("sold2", [-15.3, 0, 0.6], pose(null, flow(f, [[1406, { expr: "nervous", facing: 1, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }], [1503, { expr: "yikes", facing: 1, tilt: -6, armR: ARF.earR, armL: ARF.earL, armRFront: true, armLFront: true }, 2], [1560, { expr: "stare", facing: 1, armR: [[22, 20], [12, 34]] as A2 }, 10], [1712, { expr: "beam", facing: 1, armR: ARF.cheer, armL: [[-24, -30], [-30, -66]] as A2, armRFront: true }, 3]]) as P), { idx: 3 }),
      crowd("wife", [-16.2, 0, 2.2], 1, 1), crowd("neighbour", [-17.3, 0, -1.1], 2, 1), crowd("kid66", [-16.8, 0, -0.2], 3, 1), crowd("granny", [-18.6, 0, 1.0], 4, 1), crowd("cit1", [-17.9, 0, 2.6], 5, 1),
      C("mayor", f < 1694 ? mw.p : MAY8, pose(null, mayor), { idx: 8 }),
    ],
    fx: fxs(f >= 1447 && f < 1536 ? sparkCard("f8", [sparkAt(f)[0], 0.18, sparkAt(f)[2]], f, 0.3) : null,
      f >= 1444 && f < 1452 ? sparkle("lit", [CAPF[0] + 0.7, 0.12, CAPF[2] - 0.3], f - 1444, 0.3) : null,
      waterArc("w8", [MAY8[0] + 0.45, 1.25, MAY8[2]], [LAST[0], 0.6, LAST[2]], lin(f, 1706, 1713), 1.0), splash("sp8", [LAST[0], 0.55, LAST[2] + 0.1], f - 1712, 1.2),
      f >= 1712 ? cloudRoll("stm8", [LAST[0], 0.6, LAST[2]], [7.6, 1.6, 1.8], f, 1712, 1727, 4, 2.2, true) : null),
    focus: follow(f, [[1408, [-4.0, 2.0, -1.0]], [1440, [CAPF[0] + 0.3, 0.9, CAPF[2]], 30], [1462, () => sparkAt(f), 16], [1506, [-1.0, 2.2, -1.0], 12], [1584, [6.0, 3.0, -1.0], 30], [1652, [LAST[0], 0.8, LAST[2]]], [1700, [MAY8[0], 1.6, MAY8[2]], 12]]),
    subj: f < 1446 ? "capt" : f < 1660 ? null : "mayor",
  };
};
lens3([[1406, DOF_WS], [1444, DOF_FS, 20], [1482, DOF_WS, 16], [1652, DOF_FS]]);

// ================================================= SCENE 9 (1723-1920) TODAY: the backburn, and the last line
// Out of the steam: a golden-dusk fire road; a wildfire crew member walks the verge with a drip torch, laying a line of
// flame ON PURPOSE (it follows the torch), the wildfire wall on the ridge behind; the camera trucks along with her,
// passing an onlooker behind the tape. Cut to him (MCU, the fires in the background): thumb over his shoulder, "you
// can't fight fire with fire" (lip-sync 1862-1912), smug; behind him the two fires meet and both die down; he glances
// back, gulps. The crew member's deadpan behind him.
const FF0: V3 = [-3.0, 0, -1.4], FF1: V3 = [6.0, 0, -1.4], ONL: V3 = [1.2, 0, 3.0];
SHOT_CAMS[9] = () => {
  const A = (f: number) => { const x = lerp(FF0[0], FF1[0], sm(f, 1716, 1850)) + 0.2; return { pos: [x - 0.6, 2.5, 6.6] as V3, look: [x - 0.4, 1.0, -1.8] as V3, fov: 40 }; };
  const B = { pos: [0.95, 1.6, 6.5] as V3, look: [1.22, 1.55, 3.0] as V3, fov: 31 };
  return [K(1723, F(A, 1723, 0.0002), 24, true), K(1842, FS(() => B, 1842, 0.0012, -0.003), 24, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const w = walkPath(9, s, [FF0, FF1], f, 1716, 1850);
  const ffx = f < 1850 ? w.p[0] : FF1[0];
  const ff: P = f < 1850 ? { mode: "walk", phase: w.phase, facing: w.facing, expr: "calm", propR: "dripTorch", propK: f, propRAng: 0.5, armR: [[24, 16], [40, 28]] as A2, armRFront: true }
    : flow(f, [[1850, { expr: "calm", facing: -1, propR: "dripTorch", propK: f, armR: [[22, 20], [16, 36]] as A2, armRFront: true }], [1880, { expr: "bored", facing: -1, propR: "dripTorch", propK: f, armR: [[22, 20], [16, 36]] as A2, armRFront: true, look: -0.5 }, 8]]) as P;
  const onl: P = speak(f, 1862, 1912, flow(f, [
    [1723, { expr: "smug", facing: -1, propR: "phone", armR: [[22, -4], [26, -30]] as A2, armRFront: true, look: 0.4 }],
    [1842, { expr: "smug", facing: 0, propR: "phone", armR: [[22, 10], [24, -6]] as A2, armRFront: true }, 6],
    [1856, { expr: "smug", facing: 0, propR: "phone", armR: [[22, 10], [24, -6]] as A2, armRFront: true, armL: [[-24, -10], [-6, -36]] as A2, armLFront: true, headTilt: 4 }, 6], // thumb over the shoulder
    [1884, { expr: "sly", facing: 0, propR: "phone", armR: [[22, 10], [24, -6]] as A2, armRFront: true, armL: [[-24, -2], [-30, -20]] as A2, headTilt: -3 }, 6],
    [1906, { expr: "neutral", facing: -1, propR: "phone", armR: [[22, 10], [24, -6]] as A2, armRFront: true, look: -0.8 }, 4],                                  // glances back
    [1913, { expr: "gulp", facing: 0, propR: "phone", armR: [[22, 10], [24, -6]] as A2, armRFront: true, sweat: 1 }, 3],
  ]) as P);
  return {
    ctl: { burnTo: f < 1850 ? ffx - 0.4 : 5.6, wild: 1, meet: sm(f, 1858, 1906), wind: 0.4 },
    cast: [C("ffighter", f < 1850 ? w.p : FF1, pose(null, ff), { idx: 1 }), C("onlooker", ONL, pose(null, onl), { idx: 2 })],
    fx: fxs(f < 1736 ? cloudRoll("stm9", [0.2, 1.4, 4.4], [2.4, 1.6, 2.0], 3455 - f, 1719, 1736, 4, 2.6, true) : null),
    focus: f < 1842 ? [ffx, 1.5, FF0[2]] : [ONL[0], 1.85, ONL[2]],
    subj: f < 1842 ? "ffighter" : "onlooker",
  };
};
lens3([[1723, DOF_FS], [1842, DOF_CU]]);

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
