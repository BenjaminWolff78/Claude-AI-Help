// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "Why He Wanted His Potatoes Stolen", set-local coordinates,
// absolute frames. Master prompt v10.8: 9 scenes in 10 shot ids; two home bases (A: the potato field, B: the village
// market + pigsty, one valley set), the palace twice; motivated transitions only (ride the motion, position match, dust,
// light, shape match; same-place crossfades only for the field's day -> night -> dawn time jumps), 1 hard cut.
// Acting (v10.8 part 8): talking mouths change every frame from the voice loudness (mouths.json), 3-4 frame blinks at
// irregular 0.5-1.5 s (world.ts), expressions swap instantly 0-3 frames before their word, idle bodies stay still while
// the face stays alive, wind-up ~6 f then the action in 1-3 f, no squash / stretch / overshoot.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF } from "./story";
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
const fxs = (...xs: (FxSpec | FxSpec[] | null | undefined | false)[]): FxSpec[] => xs.flatMap((x) => (!x ? [] : Array.isArray(x) ? x : [x]));

// ---------------- action flow (v10.7 rule 6 + skill "Character continuity") ----------------
// Every change of pose is BLENDED: numbers and arm offsets interpolate over `blend` frames (v10.8: ~6 f wind-ups, 1-3 f
// actions, smoothstep = no overshoot), the FACE (expr, mouth, sweat drop) swaps instantly on the beat's first frame (put the
// beat 0-3 f before its word), other discrete fields (mode, props) switch at the half-way point.
import { ACT } from "./acting";
const HANG = (side: number): [[number, number], [number, number]] => [[side * 30, 45], [side * 33, 96]];
const mixO = (a: P, b: P, k: number): P => {
  if (k >= 1) return { ...b };
  if (k <= 0) return { ...a };
  const o: Record<string, unknown> = { ...b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a as Record<string, unknown>)[key], vb = (b as Record<string, unknown>)[key];
    const arm = key === "armR" || key === "armL";
    const side = key === "armR" ? 1 : -1;
    const A = arm ? (va ?? HANG(side)) : va, B = arm ? (vb ?? HANG(side)) : vb;
    if (arm && Array.isArray(A) && Array.isArray(B)) {
      const aa = A as number[][], bb = B as number[][];
      o[key] = [[lerp(aa[0][0], bb[0][0], k), lerp(aa[0][1], bb[0][1], k)], [lerp(aa[1][0], bb[1][0], k), lerp(aa[1][1], bb[1][1], k)]];
      if (k < 0.5 && va === undefined) o[key] = o[key]; // stays a smooth path from the hanging arm
    } else if (typeof va === "number" && typeof vb === "number" && key !== "facing") o[key] = lerp(va, vb, k);
    else if (typeof va === "number" && vb === undefined && /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/.test(key)) o[key] = lerp(va, 0, k);
    else if (va === undefined && typeof vb === "number" && /^(shake|feetUp|squash|sweat|tilt|headTilt|headBack|lift|monoclePop|wet|look|propK|propRAng|propLAng|hatLift)$/.test(key)) o[key] = lerp(0, vb, k);
    else if (key === "expr" || key === "mouth") o[key] = vb;
    else o[key] = k < 0.5 ? va : vb;
  }
  return o as P;
};
/** a pose timeline: beats [frame, pose]; each beat blends in over `blend` frames from the previous one */
type Beat = [number, P] | [number, P, number];
const flow = (f: number, beats: Beat[], blend = 8): FigOpts => {
  let i = 0;
  for (let j = 0; j < beats.length; j++) if (f >= beats[j][0]) i = j;
  if (i === 0 || f < beats[0][0]) return pose(null, beats[0][1]);
  const bl = beats[i][2] ?? blend;
  const m = mixO(beats[i - 1][1], beats[i][1], sm(f, beats[i][0], beats[i][0] + bl));
  // the face swaps on the beat's first frame (v10.8 B2), never part-way through the body blend
  return pose(null, { ...m, expr: beats[i][1].expr ?? m.expr, mouth: beats[i][1].mouth });
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
void ACT;

// =====================================================================================================================
// SHOT 1 (0-588) = SCENE 1 (field, 0-117) + SCENE 2 (village market, 117-588), one continuous camera path in the valley.
// "A man put armed soldiers around a potato field just so people would steal it. You see, in France back then, everybody
// was sure potatoes were pig food that gave you leprosy. But this guy had survived a war prison eating nothing but
// potatoes. He begged farmers to grow them. Nobody would. One farmer took a whole sack and fed it to his pig. The whole
// town laughed. 'Hey, it's the Pig Doctor!'"
// Frame 1: the hero kneels in the middle of the guarded field polishing a potato like a jewel, the soldiers stand at
// attention round the wall; two villager heads peek over the wall on "steal it"; he tosses the potato and the camera rides
// it down the hill into the pig's trough (ride the motion). Market: the pig gulps it, a woman pinches her nose at the
// PIG FEED crate, a man drops a potato like it's hot on "leprosy", the hero throws his coat open on the old prison shirt
// and crunches a raw potato, kneels to beg the big farmer (arms crossed), the farmer takes the sack and pours it into the
// trough, the whole town laughs on the same word, "Pig Doctor!", and the hero raises a potato (-> the king's head).
const FYv = 4;
const HK: V3 = [-28.6, FYv, -20.8];                                    // hero kneeling in the field (hook)
const RING: Record<string, V3> = { sergeant: [-23.2, FYv, -20.6], sol1: [-33.4, FYv, -26.3], sol2: [-33.6, FYv, -21.0], sol3: [-33.4, FYv, -15.6], sol4: [-30.8, FYv, -26.6], sol5: [-26.4, FYv, -26.7], sol6: [-28.6, FYv, -15.3] };
const PEEK: V3[] = [[-36.0, FYv, -22.4], [-36.0, FYv, -19.6]];
const TRO: V3 = [-7.75, 0.25, -3.4], PIG: V3 = [-9.0, 0, -3.4];
const H1: V3 = [-3.4, 0, -3.0];                                       // hero in the market
const FARM: V3 = [-5.0, 0, -3.65], FARM_POUR: V3 = [-6.75, 0, -3.35];
const V1: V3 = [-4.4, 0, 0.4], V2: V3 = [-1.7, 0, -4.9], F2: V3 = [-0.25, 0, -4.3], F3: V3 = [1.2, 0, -2.4], V3b: V3 = [4.6, 0, -7.55], V4: V3 = [-1.2, 0, 0.9], V5: V3 = [0.6, 0, -0.9];
/** the tossed potato: hand -> arc -> trough, frames 98..121 */
const TOSS0 = 98, TOSS1 = 121;
const tossAt = (f: number): V3 => {
  const u = clamp01((f - TOSS0) / (TOSS1 - TOSS0)), S: V3 = [HK[0] + 0.35, FYv + 1.55, HK[2] + 0.2], E = TRO;
  return [lerp(S[0], E[0], u), lerp(S[1], E[1], u) + 4 * 4.8 * u * (1 - u), lerp(S[2], E[2], u)];
};
const potatoCard = (key: string, pos: V3, s = 0.22, rot = 0): FxSpec => ({ kind: "card", key: "potato_" + key, pos, w: s, h: s * 0.8, rot, cw: 128, ch: 102,
  draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(64, 52, 58, 44, 0.15, 0, 7); g.fill(); g.fillStyle = "#b88552"; g.beginPath(); g.ellipse(64, 52, 50, 36, 0.15, 0, 7); g.fill();
    g.fillStyle = "#9a6a3c"; g.beginPath(); g.ellipse(74, 62, 30, 18, 0.15, 0, 7); g.fill(); g.fillStyle = "#e8c896"; g.beginPath(); g.ellipse(46, 36, 14, 7, -0.3, 0, 7); g.fill();
    g.fillStyle = "#6e4a2a"; for (const [x, y] of [[40, 58], [70, 40], [86, 58], [58, 70]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); } } });
const STY_CAM: V3 = [-4.6, 1.45, -0.9];
const PH = 0.42; // potato rest point above the hero's raised hand (scene 2 -> 3 position match)
SHOT_CAMS[1] = (s) => [
  // hook: low inside the field, gliding sideways past the sergeant to the kneeling hero with the soldier ring behind him
  K(0, (f) => { const k = sm(f, 0, 92); return { pos: lerp3([-24.1, FYv + 1.3, -24.0], [-24.3, FYv + 1.45, -17.9], k), look: lerp3([-29.3, FYv + 0.95, -21.2], [-29.6, FYv + 1.0, -21.0], k), fov: 44 }; }),
  // ride the motion: behind the tossed potato, swinging round to the pigsty on landing
  K(95, (f) => { const u = clamp01((f - TOSS0) / (TOSS1 - TOSS0)), P = tossAt(f), dx = TRO[0] - HK[0], dz = TRO[2] - HK[2], L = Math.hypot(dx, dz), d = [dx / L, dz / L];
    const chase: V3 = [P[0] - d[0] * 4.6, P[1] + 1.4, P[2] - d[1] * 4.6], k = sm(u, 0.35, 1);
    return { pos: lerp3(chase, STY_CAM, k), look: lerp3([P[0] + d[0] * 2, P[1] - 0.2, P[2] + d[1] * 2], [TRO[0] - 0.7, 0.45, TRO[2]], sm(u, 0.82, 1)), fov: lerp(46, 40, k) }; }, 7),
  K(122, F(() => ({ pos: STY_CAM, look: [TRO[0] - 0.7, 0.45, TRO[2]] as V3, fov: 40 }), 122, 0.002)),
  // "everybody was sure ... pig food": slide right to the woman pinching her nose at the PIG FEED crate
  // (custom blend: the glide arcs up and to screen-right around the woman instead of passing through her head)
  K(160, (f) => {
    const A = F(() => ({ pos: STY_CAM, look: [TRO[0] - 0.7, 0.45, TRO[2]] as V3, fov: 40 }), 122, 0.002)(f);
    const B = F(() => fit([body(V1, 0, 2.05, 0.4), [[-5.6, 0, -1.0], 0, 1.0, 0.5], body(PIG, 0, 0.9, 0.5)], 28, 8, 40, 0.86), 160, 0.0018, [[182, 0.005, 10]])(f);
    if (f >= 186) return B;
    const t = clamp01((f - 160) / 26), k = sm(f, 160, 186), b = Math.sin(Math.PI * t);
    const p = lerp3(A.pos, B.pos, k);
    return { pos: [p[0] + 1.1 * b, p[1] + 1.25 * b, p[2]] as V3, look: lerp3(A.look, B.look, k), fov: lerp(A.fov, B.fov, k) };
  }, 1),
  // "leprosy": on to the potato stall: the man drops the potato, his neighbour jumps back
  K(214, F(() => fit([body(V2, 0, 2.05, 0.4), body(F2, 0, 2.05, 0.4)], 10, 6, 40, 0.8), 214, 0.002, [[236, 0.006, 10]]), 22),
  // "But this guy": the hero between them, coat thrown open on the prison shirt, crunching a raw potato
  K(252, F(() => fit([body(H1, 0, 2.3, 0.5), body(V2, 0.6, 2.05, 0.3)], 20, 6, 40, 0.78, -0.15), 252, 0.0018, [[282, 0.005, 10]]), 22),
  // "He begged farmers": two-shot from the side, hero kneeling, the big farmer with crossed arms, the pig pen behind
  K(348, F(() => fit([body(H1, 0, 1.6, 0.45), body(FARM, 0, 2.05, 0.45)], 8, 6, 40, 0.8), 348, 0.0018, [[402, 0.005, 10]]), 24),
  // "fed it to his pig": track with the farmer to the trough
  K(432, F((f) => { const fp = lerp3(FARM, FARM_POUR, sm(f, 438, 466)); return fit([body(fp, 0, 2.05, 0.45), body(PIG, 0, 0.9, 0.55), body(H1, 0, 2.1, 0.4)], 24, 9, 40, 0.84); }, 432, 0.0016), 26),
  // "The whole town laughed": pull back and up to the whole square
  K(494, F(() => ({ pos: [-2.4, 6.2, 8.6] as V3, look: [-2.6, 0.7, -2.4] as V3, fov: 60 }), 494, 0.0016), 26),
  // "Hey, it's the Pig Doctor!": the farmer points and shouts, the hero raises a brow
  K(538, F(() => fit([body(FARM_POUR, 0, 2.1, 0.45), body(H1, 0, 2.3, 0.45)], 30, 4, 38, 0.8), 538, 0.0018, [[560, 0.005, 8]]), 18),
  // he raises the potato: push in until it sits on the frame centre at the king-head size (position match into shot 2)
  K(566, (f) => { const h = heroPotato(s), k = sm(f, 566, 586); return { pos: lerp3([h[0] + 4.0 * Math.sin(0.45), h[1] - 0.45, h[2] + 4.0 * Math.cos(0.45)], [h[0] + 2.7 * Math.sin(0.45), h[1] - 0.3, h[2] + 2.7 * Math.cos(0.45)], k), look: [h[0], h[1] - 0.36, h[2]], fov: 38 }; }, 18),
];
/** world point of the potato raised in the hero's right hand at the end of shot 1 (card faces the close-up camera) */
const heroPotato = (_s: SetDef): V3 => [H1[0] + 0.3, 2.36, H1[2] + 0.12];
SHOT_ACTS[1] = (f, s) => {
  const field = f < 116, ph12 = (f / 12) % 1;
  const peekK = sm(f, 82, 90) * (1 - sm(f, 104, 112));
  const pour = sm(f, 472, 482) * (1 - sm(f, 492, 500));
  const chew = (a: number, b: number) => (f >= a && f < b ? (Math.floor(f / 3) % 2 ? "O" : "dash") as MouthK : undefined);
  const fw = walkPath(1, s, [FARM, FARM_POUR], f, 438, 466);
  const cast: CastPlace[] = [];
  if (field) {
    cast.push(C("parm", HK, flow(f, [
      [0, { mode: "kneel", expr: "smug", facing: -1, armR: [[22, 20], [30, 4]] as A2, armRFront: true, propR: "potato", propK: 1, armL: [[-22, 24], [6 + 6 * Math.sin(f * 0.7), 8]] as A2, armLFront: true }],
      [70, { mode: "kneel", expr: "sly", facing: -1, look: -0.6, armR: [[22, 20], [30, 4]] as A2, armRFront: true, propR: "potato", propK: 1 }, 6],
      [89, { mode: "kneel", expr: "determined", facing: -1, armR: [[24, 30], [10, 46]] as A2, propR: "potato", propK: 1 }, 6],      // wind-up
      [96, { mode: "kneel", expr: "smug", facing: -1, armR: [[34, -18], [52, -56]] as A2 }, 2],                                       // the toss
    ]), { idx: 1 }));
    for (const [who, p] of Object.entries(RING)) cast.push(C(who, p, pose(null, { expr: who === "sergeant" ? "stern" : "bored", facing: faceTo(1, s, f, p, HK), look: 0.4, armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }), { idx: 10 + who.length }));
    if (peekK > 0.01) PEEK.forEach((p, i) => cast.push(C(i ? "vil1" : "farmer", [p[0], p[1] - 1.25 * (1 - peekK), p[2]], pose(null, { expr: "sly", facing: 1, look: 0.8 }), { idx: 30 + i })));
  } else {
    cast.push(C("pig", PIG, flow(f, [
      [116, { expr: "neutral", facing: 1, tilt: 0 }],
      [121, { expr: "joy", facing: 1, tilt: 25, mouth: chew(121, 168) }, 3],
      [168, { expr: "joy", facing: 1, tilt: 0 }, 6],
      [486, { expr: "joy", facing: 1, tilt: 25, mouth: chew(486, 548) }, 3],
      [548, { expr: "neutral", facing: 1, tilt: 4, mouth: f >= 558 && f < 570 ? "O" : undefined }, 4],                               // oink
    ]), { idx: 40, scale: 0.78 }));
    // the woman at the PIG FEED crate
    cast.push(C("vil1", V1, flow(f, [
      [116, { expr: "neutral", facing: -1, look: -0.5 }],
      [167, { expr: "dismay", facing: -1, look: -0.6 }, 1],
      [178, { expr: "dismay", facing: -1, armR: [[20, 2], [4, -30]] as A2, armRTop: true, tilt: 6 }, 3],                            // pinches her nose
      [298, { expr: "shock", facing: 1, tilt: -6, armR: [[20, 2], [4, -30]] as A2, armRTop: true }, 3],                                // recoils from the prison shirt
      [330, { expr: "dismay", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
      [501, { expr: "laugh", facing: 1, shake: 1, phase: ph12, headBack: 0.6, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 2],
    ]), { idx: 41 }));
    // the man holding a potato at arm's length, then dropping it like it's hot on "leprosy"
    const hop2 = sm(f, 236, 240) * (1 - sm(f, 240, 246));
    cast.push(C("vil2", lerp3(V2, [V2[0] + 0.35, 0, V2[2] - 0.2], sm(f, 236, 244)), flow(f, [
      [116, { expr: "stare", facing: 1, look: 0.6, armR: [[30, 12], [52, 4]] as A2, armRFront: true, propR: "potato" }],
      [229, { expr: "nervous", facing: 1, sweat: 1, tilt: 5, armR: [[30, 12], [52, 4]] as A2, armRFront: true, propR: "potato" }, 6],       // wind-up: leans in
      [237, { expr: "yikes", facing: 1, sweat: 1, mode: "hop", lift: hop2, armR: [[30, -20], [44, -50]] as A2, armL: [[-30, -20], [-44, -50]] as A2 }, 2],
      [250, { expr: "dismay", facing: 1, sweat: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
      [298, { expr: "shock", facing: 1, tilt: -7 }, 2],
      [404, { expr: "cold", facing: -1, armR: [[24, 30], [-6, 34]] as A2, armL: [[-24, 30], [6, 30]] as A2, armRFront: true, armLFront: true }, 6],
      [502, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[26, 44], [6, 70]] as A2, armL: [[-26, 44], [-6, 70]] as A2, armRFront: true, armLFront: true }, 2],
    ]), { idx: 42 }));
    const hopF = sm(f, 237, 241) * (1 - sm(f, 241, 247));
    cast.push(C("farmer2", lerp3(F2, [F2[0] + 0.5, 0, F2[2] + 0.2], sm(f, 237, 245)), flow(f, [
      [116, { expr: "neutral", facing: -1, look: -0.5 }],
      [236, { expr: "yikes", facing: -1, sweat: 1, mode: "hop", lift: hopF }, 1],
      [250, { expr: "dismay", facing: -1, sweat: 1 }, 6],
      [400, { expr: "cold", facing: -1, headTilt: 9 * Math.sin((f - 400) * 0.45) * (f < 424 ? 1 : 0) }, 2],                             // shakes his head: no
      [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.3, armR: [[40, 18], [88, 8]] as A2 }, 2],                            // points at the hero
    ]), { idx: 43 }));
    cast.push(C("farmer3", F3, flow(f, [
      [116, { expr: "smile", facing: -1, look: -0.3 }],
      [403, { expr: "cold", facing: 1, back: true }, 3],                                                                                // turns his back
      [500, { expr: "guffaw", facing: -1, shake: 1, phase: ph12 + 0.6, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 3],
    ]), { idx: 44 }));
    cast.push(C("vil3", V3b, flow(f, [
      [116, { expr: "smile", facing: -1 }],
      [497, { expr: "laugh", facing: -1, armR: [[30, -14], [40, -40]] as A2 }, 6],                                                       // wind-up
      [503, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[30, 20], [44, 40]] as A2, armRFront: true }, 2],                 // slaps the counter
    ]), { idx: 45 }));
    cast.push(C("vil4", V4, flow(f, [[116, { expr: "smile", facing: -1 }], [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.2, mode: "hop", lift: 0.25 * Math.abs(Math.sin(f * 0.4)) }, 2]]), { idx: 46 }));
    cast.push(C("vil5", V5, flow(f, [[116, { expr: "neutral", facing: -1 }], [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.5, headBack: 0.7, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 2]]), { idx: 47 }));
    // the big farmer
    cast.push(C("farmer", fw.p, fw.moving ? pose(null, { mode: "walk", phase: fw.phase, facing: fw.facing, expr: "smug", armR: [[24, 30], [8, 46]] as A2, armRFront: true, propR: "sack" }) : flow(f, [
      [116, { expr: "neutral", facing: 1, look: 0.4 }],
      [355, { expr: "cold", facing: 1, armR: [[24, 30], [-6, 34]] as A2, armL: [[-24, 30], [6, 30]] as A2, armRFront: true, armLFront: true }, 6],   // arms crossed
      [424, { expr: "sly", facing: 1, armR: [[30, 20], [52, 18]] as A2, armRFront: true }, 6],                                                       // reaches for the sack
      [430, { expr: "smug", facing: 1, armR: [[24, 30], [8, 46]] as A2, armRFront: true, propR: "sack" }, 3],
      [468, { expr: "smug", facing: -1, armR: [[30, -6], [46, -30]] as A2, propR: "sack", propRAng: 0 }, 4],
      [474, { expr: "grin", facing: -1, armR: [[30, -6], [46, -30]] as A2, propR: "sack", propRAng: -2.1 * pour }, 3],                              // pours it into the trough
      [498, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[26, 44], [6, 70]] as A2, armL: [[-26, 44], [-6, 70]] as A2, armRFront: true, armLFront: true }, 4],
      [540, { expr: "angry", facing: 1, mouth: talk(f, 540, 572), armR: [[40, 18], [88, 8]] as A2, headTilt: 4 * Math.sin(f * 0.6) }, 2],          // "Hey, it's the Pig Doctor!"
      [574, { expr: "grin", facing: 1, armR: [[40, 18], [88, 8]] as A2 }, 3],
    ]), { idx: 48 }));
    // the hero (in the market from the landing on)
    const coatOpen = f >= 280 && f < 346;
    cast.push(C(coatOpen ? "parmPrison" : "parm", H1, flow(f, [
      [116, { expr: "calm", facing: -1, look: -0.4 }],
      [258, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 1],
      [273, { expr: "sly", facing: 1, armR: [[18, 26], [4, 22]] as A2, armL: [[-18, 26], [-4, 22]] as A2, armRFront: true, armLFront: true }, 6],     // grabs his lapels
      [280, { expr: "proud", facing: 1, armR: [[34, 10], [62, 6]] as A2, armL: [[-34, 10], [-62, 6]] as A2 }, 2],                                       // throws the coat open
      [306, { expr: "grin", facing: 1, armR: [[22, 16], [8, -20]] as A2, armRFront: true, propR: "potato" }, 3],                                          // raw potato up to the mouth
      [312, { expr: "grin", facing: 1, mouth: chew(312, 338), armR: [[22, 16], [10, -16]] as A2, armRFront: true, propR: "potato" }, 2],               // crunch
      [340, { expr: "smile", facing: 1, armR: [[18, 26], [4, 22]] as A2, armL: [[-18, 26], [-4, 22]] as A2, armRFront: true, armLFront: true }, 4],     // closes the coat
      [356, { expr: "pained", facing: -1, mode: "kneel", armR: [[24, 4], [40, -24]] as A2, armL: [[-24, 4], [-40, -24]] as A2, propR: "potato", propL: "potato" }, 6], // kneels, begging
      [402, { expr: "sheepish", facing: -1, mode: "kneel", armR: [[24, 14], [40, -6]] as A2, armL: [[-24, 14], [-40, -6]] as A2, propR: "potato", propL: "potato" }, 4],
      [416, { expr: "pained", facing: -1, mode: "kneel", armR: [[30, 10], [56, 2]] as A2, armRFront: true, propR: "sack" }, 5],                            // holds up a sack
      [431, { expr: "eureka", facing: -1, mode: "kneel", armR: [[24, 30], [30, 52]] as A2 }, 2],
      [446, { expr: "calm", facing: -1, armR: [[24, 30], [30, 52]] as A2 }, 8],                                                                             // stands up
      [500, { expr: "cold", facing: -1, look: -0.5 }, 1],                                                                                                    // unbothered while they laugh
      [544, { expr: "smug", facing: -1, look: -0.6, headTilt: -4 }, 1],
      [560, { expr: "sly", facing: 1, armR: [[24, -30], [30, -80]] as A2 }, 4],                                                    // raises the potato
    ]), { idx: 1 }));
  }
  const tossing = f >= TOSS0 && f < TOSS1;
  return {
    ctl: { planted: 1, holes: 0, torches: 0, moon: 0, trough: f >= 486 && f < 548 ? 1 : 0, feed: 1, gardens: 0, smoke: 1 },
    cast,
    fx: fxs(
      tossing ? potatoCard("toss" + (Math.floor(f / 2) % 4), tossAt(f), 0.42, f * 0.35) : null,
      tossing && f > TOSS0 + 3 ? speedLines(tossAt(f), f, 4, 0.8, [-(TRO[0] - HK[0]) / 29, -(TRO[2] - HK[2]) / 29]) : null,
      f >= 120 && f < 126 ? sparkle("land", [TRO[0], 0.55, TRO[2]], f - 120, 0.35) : null,
      f >= 238 && f < 252 ? potatoCard("drop", [V2[0] + 0.45, Math.max(0.1, 1.2 - 0.5 * ((f - 238) / 3) ** 2), V2[2] + 0.1], 0.18, (f - 238) * 0.4) : f >= 252 && f < 588 ? potatoCard("dropRest", [V2[0] + 0.45, 0.08, V2[2] + 0.1], 0.18, 0.2) : null,
      f >= 486 && f < 500 ? dustCard("pour", [TRO[0] + 0.1, 0.7, TRO[2]], 0.7, 0.7 * (1 - lin(f, 486, 500)), 2) : null,
      f >= 560 ? potatoCard("raised", lerp3([H1[0] + 0.4, 1.9, H1[2] + 0.12], heroPotato(s), sm(f, 560, 566)), 0.42, 0.15) : null,
      f >= 570 && f < 584 ? sparkle("raised", [heroPotato(s)[0] + 0.18, heroPotato(s)[1] + 0.2, heroPotato(s)[2]], f - 570, 0.22) : null,
      f >= 312 && f < 338 && f % 6 < 3 ? sparkle("crumbs" + (f % 12), [H1[0] + 0.25, 1.75, H1[2] + 0.1], (f % 6), 0.14, "#f4dcb0") : null,
    ),
    focus: field ? [HK[0], FYv + 1.2, HK[2]] : f < 160 ? [TRO[0] - 0.7, 0.5, TRO[2]] : f < 214 ? [V1[0], 1.7, V1[2]] : f < 252 ? [V2[0], 1.7, V2[2]] : f < 494 ? [H1[0], 1.6, H1[2]] : f < 538 ? [-2.4, 1.5, -2.4] : f < 566 ? [FARM_POUR[0], 1.7, FARM_POUR[2]] : heroPotato(s),
    subj: field ? "parm" : f < 160 ? "pig" : f < 214 ? "vil1" : f < 252 ? "vil2" : f < 432 ? "parm" : f < 494 ? "farmer" : f < 538 ? "parm" : f < 566 ? "farmer" : null,
  };
};
lens(0, 4, 1); lens(95, 1, 8); lens(122, 6, 8); lens(160, 5, 20); lens(214, 6, 16); lens(252, 6, 16); lens(348, 5, 20); lens(432, 5, 20); lens(494, 2, 20); lens(538, 6, 14); lens(566, 9, 16);

// =====================================================================================================================
// SHOT 2 (588-719) = SCENE 3, the throne room (cool marble + gold). In by a POSITION-MATCH dissolve: the hero's raised
// potato -> the king's round white head on the same spot and size; the camera cranes back to the hero bowing at the
// foot of the dais. "So he asked the king for a field and a few soldiers. Soldiers? To guard pig food?" He unrolls a
// field plan and counts "a few" on his fingers; the two guards look at each other; the king lowers his goblet, raises
// a brow, palm up; then STAMPS the decree in a puff of gold dust (the dust dissolve into the field).
// SHOT 7 (1375-1470) = SCENE 6, the corridor (shape match from the hut door): "Ever wanted to open a door just because it
// said 'Staff only'? Same thing." A noble lady tiptoes to the STAFF ONLY door, sweat drop, both hands on the knob, peeks in
// with a huge grin as warm light floods out (the light dissolve into the village).
// SHOT 9 (1552-1794) = SCENE 8, the banquet PAYOFF in the brightest gold (shape match: the potato flower in the hero's
// hand). "Then he gave the king a potato flower, and the king wore it on his coat. Suddenly every noble wanted one. Today
// French menus still name potato dishes after him." The king pins it on, the nobles mob the hero holding up flowers,
// the servants lift the cloches off mountains of potatoes, the menu turns round: HACHIS PARMENTIER; petals, gold light.
const KING: V3 = [0, 1.12, -12.15], KHEAD: V3 = [0, 2.18, -12.05], HT: V3 = [0.2, 0, -7.4], GL: V3 = [-1.55, 0, -9.0], GR: V3 = [1.55, 0, -9.0];
const MATCH_D = 2.7, MATCH_UP = 0.36; // same framing as the raised potato at the end of shot 1
SHOT_CAMS[2] = () => [
  K(584, F(() => ({ pos: [KHEAD[0] + MATCH_D * Math.sin(0.12), KHEAD[1] - 0.3, KHEAD[2] + MATCH_D * Math.cos(0.12)] as V3, look: [KHEAD[0], KHEAD[1] - MATCH_UP, KHEAD[2]] as V3, fov: 38 }), 584, 0.0012)),
  K(596, F(() => fit([body(KING, 0, 1.4, 0.55), body(HT, 0, 2.2, 0.45), body(GL, 0, 2.2, 0.4), body(GR, 0, 2.2, 0.4)], 8, 8, 42, 0.9), 596, 0.0016, [[640, 0.005, 10]]), 30),
  K(660, F(() => fit([body(GL, 0, 2.3, 0.45), body(KING, 0, 1.4, 0.55), body(GR, 0, 2.3, 0.45)], 350, 4, 42, 0.92), 660, 0.0018, [[668, 0.006, 8]]), 18),
  K(688, F(() => fit([body(KING, 0.2, 1.45, 0.6)], 336, 22, 38, 0.66, 0, -0.05), 688, 0.0018, [[706, 0.006, 8]]), 16),
];
SHOT_ACTS[2] = (f) => {
  const stamp = sm(f, 705, 708);
  return {
    ctl: { lamps: 1 },
    cast: [
      C("king", KING, flow(f, [
        [584, { mode: "sit", expr: "stern", look: 0.3, armR: [[24, 14], [30, -6]] as A2, propR: "goblet" }],
        [640, { mode: "sit", expr: "cold", look: 0.4, armR: [[24, 14], [30, -6]] as A2, propR: "goblet" }, 1],
        [683, { mode: "sit", expr: "smug", headTilt: -6, mouth: talk(f, 685, 706), armR: [[26, 30], [34, 40]] as A2, propR: "goblet", armL: [[-30, 14], [-46, 4]] as A2 }, 4], // brow up, palm up
        [699, { mode: "sit", expr: "determined", armR: [[26, -10], [30, -40]] as A2 }, 6],                                                           // wind-up
        [705, { mode: "sit", expr: "proud", armR: [[30, 20], [40, 40]] as A2, armRFront: true }, 2],                                                  // STAMP
      ]), { idx: 60 }),
      C("parm", HT, flow(f, [
        [584, { expr: "calm", facing: -1, tilt: 18, armR: [[24, 30], [30, 52]] as A2 }],                                                                              // bows
        [598, { expr: "smile", facing: 1, armR: [[30, 10], [46, 4]] as A2, armRFront: true, propR: "scroll" }, 6],                                                    // unrolls the field plan
        [628, { expr: "pitch", facing: 1, mouth: talk(f, 628, 650), armR: [[30, 10], [46, 4]] as A2, armRFront: true, propR: "scroll", armL: [[-30, -10], [-40, -40 + 6 * Math.sin(f * 0.8)]] as A2 }, 4], // counts on his fingers
        [664, { expr: "smile", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
        [700, { expr: "eureka", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 1],
      ]), { idx: 1 }),
      C("pguard1", GL, flow(f, [[584, { expr: "stern", facing: 1, ...PZ.hips }], [665, { expr: "shock", facing: 1, look: 0.9 }, 1], [690, { expr: "laugh", facing: 1, shake: 0.6, phase: (f / 12) % 1 }, 2]]), { idx: 61 }),
      C("pguard2", GR, flow(f, [[584, { expr: "stern", facing: -1, ...PZ.hips }], [666, { expr: "shock", facing: -1, look: -0.9 }, 1], [691, { expr: "laugh", facing: -1, shake: 0.6, phase: (f / 12) % 1 + 0.4 }, 2]]), { idx: 62 }),
    ],
    fx: fxs(
      f >= 706 ? dustCard("stamp1", [KING[0] + 0.3, 1.55, KING[2] + 0.8], 0.6 + 3.2 * lin(f, 706, 719), Math.min(1, 1.5 * lin(f, 705, 710)), 1) : null,
      f >= 708 ? dustCard("stamp2", [KING[0] - 0.4, 1.9, KING[2] + 1.6], 0.5 + 3.6 * lin(f, 708, 719), Math.min(1, 1.5 * lin(f, 707, 712)), 3) : null,
      f >= 706 && f < 716 ? sparkle("stamp", [KING[0] + 0.3, 1.6, KING[2] + 0.6], f - 706, 0.4) : null,
    ),
    focus: f < 596 ? KHEAD : f < 660 ? [HT[0], 1.6, HT[2]] : KHEAD,
    subj: f < 660 ? "parm" : "king",
  };
};
lens(584, 7, 1); lens(596, 4, 30); lens(660, 5, 18); lens(688, 8, 16);

// ---------------- 7: the STAFF ONLY corridor ----------------
const LDOOR: V3 = [18.75, 0, -3.45], LSTART: V3 = [18.55, 0, -0.5];
SHOT_CAMS[7] = () => [
  K(1371, F(() => ({ pos: [18.75, 1.3, -0.25] as V3, look: [18.75, 1.3, -3.45] as V3, fov: 44 }), 1371, 0.0016)),                         // the lady at the door, back to us (position match with the hero in the hut doorway)
  K(1384, F(() => fit([body(LDOOR, 0, 2.4, 0.6)], 24, 4, 42, 0.8), 1384, 0.0018, [[1440, 0.005, 10]]), 22),
  K(1452, (f) => { const k = sm(f, 1452, 1470); return { pos: lerp3([18.95, 1.45, -1.6], [18.85, 1.35, -3.0], k), look: [18.75, 1.3, -4.0] as V3, fov: 40 }; }, 10),
];
SHOT_ACTS[7] = (f, s) => {
  const w = { p: LDOOR, moving: false, phase: 0, facing: 1 }; void LSTART; void s;
  return {
    ctl: { lamps: 1, door: sm(f, 1456, 1468) },
    cast: [C("lady18", w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase * 0.7, facing: w.facing, expr: "sly", sweat: 1, tilt: 6, armR: [[16, -2], [2, -34]] as A2, armRTop: true })
      : flow(f, [
        [1371, { expr: "sly", back: true }],
        [1384, { expr: "sly", facing: -1, look: -0.8, armR: [[16, -2], [2, -34]] as A2, armRTop: true }, 3],        // glances back: anyone looking?
        [1412, { expr: "sly", facing: 1, sweat: 1, look: 0.4 }, 4],
        [1436, { expr: "nervous", facing: 1, sweat: 1, armR: [[30, 20], [50, 18]] as A2, armL: [[-10, 22], [40, 20]] as A2, armRFront: true, armLFront: true }, 6],   // both hands on the knob
        [1455, { expr: "joy", facing: 1, tilt: 14, armR: [[30, 20], [50, 18]] as A2, armL: [[-10, 22], [40, 20]] as A2, armRFront: true, armLFront: true }, 2],      // peeks in, huge grin
      ]), { idx: 70 })],
    fx: fxs(f >= 1456 ? glowBurst("door" + Math.round(sm(f, 1456, 1470) * 10), [18.75, 1.3, -3.9], 1 + 4 * sm(f, 1456, 1470), 0.4 + 0.6 * sm(f, 1458, 1470), "255,236,200") : null),
    focus: [LDOOR[0], 1.6, LDOOR[2]],
    subj: "lady18",
  };
};
lens(1371, 3, 1); lens(1380, 5, 20); lens(1452, 5, 10);

// ---------------- 9: the banquet payoff ----------------
const HB: V3 = [0.5, 0, 2.5], KB: V3 = [-0.5, 0, 2.5];
const NOB: [string, V3, V3][] = [["noble1", [-1.75, 0, 2.1], [-1.2, 0, 1.75]], ["noble2", [1.75, 0, 2.1], [1.3, 0, 1.8]], ["noble3", [-2.1, 0, 3.4], [-1.55, 0, 3.15]], ["noble4", [2.1, 0, 3.4], [1.6, 0, 3.2]], ["lady18", [-1.15, 0, 1.25], [-0.65, 0, 1.15]]];
const FL9 = (): V3 => [HB[0] - 0.28, 2.34, HB[2] - 0.12];
SHOT_CAMS[9] = () => [
  K(1548, F(() => { const h = FL9(); return { pos: [h[0] + 3.0 * Math.sin(Math.PI + 0.3), h[1] - 0.45, h[2] + 3.0 * Math.cos(Math.PI + 0.3)] as V3, look: [h[0], h[1] - 0.8, h[2]] as V3, fov: 38 }; }, 1548, 0.0012)),
  K(1562, FS(() => fit([body(HB, 0, 2.3, 0.45), body(KB, 0, 2.3, 0.45)], 196, 6, 40, 0.8), 1562, 0.0018, 0.003, [[1630, 0.005, 10]]), 24),
  K(1650, F(() => fit([body(HB, 0, 2.3, 0.4), body(KB, 0, 2.3, 0.4), ...NOB.map((n) => body(n[2], 0, 2.1, 0.35))], 192, 10, 44, 0.9), 1650, 0.0018, [[1660, 0.006, 10]]), 20),
  K(1700, F(() => ({ pos: [3.6, 5.2, -1.4] as V3, look: [0.8, 0.9, 5.6] as V3, fov: 46 }), 1700, 0.0016), 34),       // crane up over the banquet + menu
  K(1748, F(() => fit([[[0, 0.8, 5.0], 0, 1.6, 0.95], body(HB, 0, 2.3, 0.4), body(KB, 0, 2.3, 0.4)], 196, 16, 42, 0.92), 1748, 0.0018, [[1770, 0.005, 10]]), 26),   // down to the mountains of potatoes, the king tasting one
];
SHOT_ACTS[9] = (f, s) => {
  const ph12 = (f / 12) % 1, pinned = f >= 1630;
  const crowd = sm(f, 1652, 1664);
  const s1 = walkPath(9, s, [[-0.8, 0, 13.3], [-1.45, 0, 7.6]], f, 1700, 1745), s2 = walkPath(9, s, [[0.8, 0, 13.3], [1.45, 0, 6.3]], f, 1706, 1748);
  return {
    ctl: { lamps: 1, doors: sm(f, 1696, 1712), dishes: lin(f, 1714, 1762), menu: sm(f, 1736, 1752) },
    cast: [
      C("parm", HB, flow(f, [
        [1548, { expr: "smug", facing: -1, armR: [[24, -30], [30, -80]] as A2 }],
        [1560, { expr: "smile", facing: -1, armR: [[30, 10], [52, 6]] as A2, armRFront: true, propR: "potatoFlower" }, 6],                                    // offers the flower
        [1578, { expr: "proud", facing: -1, armR: [[24, 30], [30, 52]] as A2 }, 4],
        [1652, { expr: "shock", facing: -1, sweat: 1, tilt: -5, armR: [[30, -20], [44, -50]] as A2, armL: [[-30, -20], [-44, -50]] as A2 }, 2],              // mobbed
        [1700, { expr: "joy", facing: -1, armR: [[34, -6], [62, -30]] as A2, armL: [[-34, -6], [-62, -30]] as A2 }, 8],
      ]), { idx: 1 }),
      C(pinned ? "kingFlower" : "king", KB, flow(f, [
        [1548, { expr: "stern", facing: 1, look: 0.6 }],
        [1574, { expr: "eureka", facing: 1, armR: [[30, 10], [52, 6]] as A2, armRFront: true, propR: "potatoFlower" }, 4],                                     // takes it
        [1606, { expr: "smug", facing: 1, armR: [[22, 16], [4, 10]] as A2, armRFront: true, propR: "potatoFlower" }, 6],                                       // pins it on his coat
        [1630, { expr: "proud", facing: 1, armR: [[30, 30], [4, 74]] as A2, armL: [[-30, 30], [-4, 74]] as A2, tilt: -4 }, 3],                                  // admires it
        [1770, { expr: "joy", facing: 1, mouth: f % 6 < 3 ? "O" : "dash", armR: [[22, 16], [10, -16]] as A2, armRFront: true, propR: "potato" }, 3],           // tastes one
      ]), { idx: 60 }),
      ...NOB.map(([who, a, b], i) => C(who, lerp3(a, b, crowd), flow(f, [
        [1548, { expr: "neutral", facing: a[0] < 0 ? 1 : -1, look: a[0] < 0 ? 0.5 : -0.5 }],
        [1630, { expr: "eureka", facing: a[0] < 0 ? 1 : -1, look: a[0] < 0 ? 0.6 : -0.6 }, 1],
        [1652 + (i % 2), { expr: "joy", facing: a[0] < 0 ? 1 : -1, tilt: a[0] < 0 ? 8 : -8, armR: [[30, -10], [48, -40]] as A2, propR: "potatoFlower" }, 3],          // flowers held up
        [1702, { expr: i % 2 ? "laugh" : "joy", facing: a[0] < 0 ? 1 : -1, shake: 0.5, phase: ph12 + i * 0.2, armR: [[30, -10], [48, -40]] as A2, propR: "potatoFlower" }, 6],
      ]), { idx: 71 + i })),
      C("servant1", s1.p, s1.moving ? pose(null, { mode: "walk", phase: s1.phase, facing: s1.facing, expr: "proud", armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }) : pose(null, { expr: "proud", facing: 1, armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }), { idx: 80 }),
      C("servant2", s2.p, s2.moving ? pose(null, { mode: "walk", phase: s2.phase, facing: s2.facing, expr: "proud", armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }) : pose(null, { expr: "proud", facing: -1, armR: [[26, 4], [34, -20]] as A2, propR: "potatoTray", propK: f / 10 }), { idx: 81 }),
    ],
    fx: fxs(
      f < 1556 ? flowerCard(FL9(), 0.42) : null,
      f >= 1712 ? potatoMountain([0, 0.86, 5.0], 2.4 * sm(f, 1712, 1726), f) : null,
      f >= 1630 && f < 1644 ? sparkle("pin", [KB[0] + 0.1, 1.45, KB[2]], f - 1630, 0.3) : null,
      f >= 1740 ? glowBurst("pay" + Math.round(sm(f, 1740, 1760) * 10), [0.4, 2.2, 6.0], 6, 0.35 * sm(f, 1740, 1760)) : null,
      f >= 1700 ? Array.from({ length: 14 }, (_, i) => { const t = ((f - 1700) * 0.012 + i * 0.071) % 1; return { kind: "card", key: "petal" + (i % 3), pos: [-2.6 + (i * 0.43) % 5.2 + 0.3 * Math.sin(f * 0.05 + i), 5.6 - 5.4 * t, 1.2 + (i * 0.77) % 8] as V3, w: 0.16, h: 0.12, rot: f * 0.05 + i, cw: 64, ch: 48,
        draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(32, 24, 26, 16, 0, 0, 7); g.fill(); g.fillStyle = i % 2 ? "#c9b4f6" : "#ece4ff"; g.beginPath(); g.ellipse(32, 24, 21, 12, 0, 0, 7); g.fill(); } } as FxSpec; }) : null,
    ),
    focus: f < 1562 ? FL9() : f < 1700 ? [0, 1.8, 2.5] : [0.4, 1.2, 6.0],
    subj: f < 1562 ? null : f < 1700 ? "king" : null,
  };
};
lens(1548, 8, 1); lens(1562, 5, 24); lens(1650, 4, 20); lens(1700, 2, 30);

/** the payoff's mountain of roast potatoes on a silver platter (a painted card like the effects), steaming */
const potatoMountain = (pos: V3, w: number, f: number): FxSpec => ({ kind: "card", key: "mountain" + Math.floor(f / 3) % 4, pos: [pos[0], pos[1] + w * 0.36, pos[2]], w: Math.max(0.01, w), h: Math.max(0.01, w * 0.78), cw: 512, ch: 400,
  draw: (p) => { const g = p.g, r = (i: number) => { const x = Math.sin(i * 91.7) * 43758.5; return x - Math.floor(x); };
    g.fillStyle = INKC; g.beginPath(); g.ellipse(256, 352, 250, 46, 0, 0, 7); g.fill(); g.fillStyle = "#dfe3ea"; g.beginPath(); g.ellipse(256, 348, 238, 38, 0, 0, 7); g.fill();
    g.fillStyle = "#b8bec8"; g.beginPath(); g.ellipse(256, 352, 200, 22, 0, 0, 7); g.fill();
    for (let row = 0; row < 7; row++) { const cnt = 10 - row; for (let j = 0; j < cnt; j++) {
      const x = 256 + (j - (cnt - 1) / 2) * 38 + (r(row * 13 + j) - 0.5) * 8, y = 326 - row * 31 - (r(row * 7 + j) - 0.5) * 6;
      g.fillStyle = INKC; g.beginPath(); g.ellipse(x, y, 24, 18, r(j + row) * 2, 0, 7); g.fill(); g.fillStyle = r(j * 3 + row) > 0.5 ? "#e0a24a" : "#cf8a38"; g.beginPath(); g.ellipse(x, y, 19, 13, r(j + row) * 2, 0, 7); g.fill();
      g.fillStyle = "#f6d28c"; g.beginPath(); g.ellipse(x - 6, y - 5, 7, 4, -0.4, 0, 7); g.fill(); } }
    g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 9; g.lineCap = "round";
    for (let j = 0; j < 3; j++) { const ph = (f / 9 + j) % 3; g.beginPath(); g.moveTo(190 + j * 66, 120 - ph * 8); g.bezierCurveTo(170 + j * 66, 80 - ph * 8, 214 + j * 66, 60 - ph * 8, 194 + j * 66, 20 - ph * 8); g.stroke(); }
    g.fillStyle = "#2f7a3a"; for (const [x, y] of [[200, 160], [300, 190], [250, 120], [330, 250], [170, 260]]) { g.beginPath(); g.ellipse(x, y, 8, 4, 0.6, 0, 7); g.fill(); } } });

// =====================================================================================================================
// SHOTS 3-5 (719-1160) = SCENE 4: home base A, the royal field from day through two nights to dawn.
// "He planted every row and told the guards, 'Guard them like gold.' The first night, nothing. The second night,
// nothing. The soldiers started taking bets on how dumb this was. Even they called him the Pig Doctor. The third night,
// they came back at sunrise, and the whole field was picked clean. That's the trick."
// 3 (day, in through the royal stamp's dust): he digs, the rows grow in behind him, the soldiers snap to attention, he
//   holds a potato up to the sergeant like a jewel, the sergeant salutes deadpan.
// 4 (night, a same-place crossfade from the same framing): torches, moon; a crow lands on the wall, looks, leaves; a
//   soldier yawns; three soldiers kneel round the drum throwing dice; one pushes his nose up into a snout and they all
//   laugh at once while the hero walks past with his lantern, unbothered; push into a torch flame.
// 5 (dawn, the dissolve hidden in the flame -> the low sun): the soldiers march back in through the gate yawning, the
//   camera swings to the field: all holes; jaws drop, a hat pops off; the hero by the hut winks ("That's the trick.").
import { vH } from "./sets/valley";
const FYf = 4, TAU = Math.PI * 2;
const MK = { hero: [-24.6, FYf, -21.6] as V3, serg: [-23.2, FYf, -20.6] as V3, gate: [-22.2, FYf, -18.3] as V3, drum: [-24.3, FYf, -25.9] as V3 };
const RING3: [string, V3][] = [["sol1", [-33.4, FYf, -26.3]], ["sol2", [-33.6, FYf, -21.0]], ["sol3", [-33.4, FYf, -15.6]], ["sol4", [-30.8, FYf, -26.6]], ["sol5", [-26.4, FYf, -26.7]], ["sol6", [-28.6, FYf, -15.3]]];
const ringAt = (who: string) => RING3.find((r) => r[0] === who)![1];
const DICE: Record<string, V3> = { sergeant: [-24.3, FYf, -24.8], sol5: [-23.2, FYf, -25.7], sol4: [-25.4, FYf, -26.05] };
const HERO_WALK: V3[] = [[-23.6, FYf, -19.4], [-23.4, FYf, -22.6], [-25.6, FYf, -27.0]];
const HERO_DAWN: V3 = [-31.8, FYf, -19.4];
const torchGlow = (key: string, pos: V3, size: number, a: number): FxSpec => glowBurst(key, pos, size, a, "255,190,110");
const shoulder = (o: P = {}): P => ({ armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket", ...o });
const atEase = (o: P = {}): P => ({ armR: [[26, 34], [30, 56]] as A2, propR: "musket", propRAng: 0.3, ...o });

// ---------------- 3: day ----------------
SHOT_CAMS[3] = () => [
  K(719, F(() => ({ pos: [-20.4, FYf + 3.3, -20.5] as V3, look: [-27.4, FYf + 0.6, -22.5] as V3, fov: 44 }), 719, 0.0016), 1),
  K(768, F(() => fit([body(MK.hero, 0, 2.3, 0.45), body(MK.serg, 0, 2.3, 0.45)], -15, 6, 42, 0.8), 768, 0.0016, [[788, 0.005, 10]]), 22),
];
SHOT_ACTS[3] = (f) => {
  const dig = (f - 719) / 14, dk = 0.5 + 0.5 * Math.sin(dig * TAU), dug = f < 772;
  const snap = sm(f, 754, 757);
  return {
    ctl: { planted: lerp(0.05, 1, sm(f, 721, 776)), holes: 0, torches: 0, moon: 0, trough: 0, gardens: 0, smoke: 1 },
    cast: [
      C("parm", MK.hero, dug ? pose(null, { expr: "determined", facing: -1, tilt: 12 * dk, armR: [[28, 18 + 10 * dk], [50, 30 - 22 * dk]] as A2, armL: [[-6, 30], [28, 42 - 10 * dk]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: -0.6 + 0.8 * dk, propK: 1 })
        : flow(f, [
          [772, { expr: "calm", facing: 1, armR: [[24, 30], [30, 52]] as A2 }],
          [781, { expr: "proud", facing: 1, armR: [[26, 6], [36, -18]] as A2, armL: [[-26, 6], [10, -18]] as A2, armRFront: true, armLFront: true, propR: "potato", propK: 1 }, 5], // holds it up like a jewel
          [787, { expr: "proud", facing: 1, mouth: talk(f, 787, 804), armR: [[26, 6], [36, -18]] as A2, armL: [[-26, 6], [10, -18]] as A2, armRFront: true, armLFront: true, propR: "potato", propK: 1, headTilt: 3 * Math.sin(f * 0.5) }, 1],
          [806, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2, propR: "lantern" }, 6],
        ]), { idx: 1 }),
      C("sergeant", MK.serg, flow(f, [
        [719, { expr: "bored", facing: -1, look: -0.5, ...atEase() }],
        [754, { expr: "stern", facing: -1, ...shoulder() }, 3],
        [792, { expr: "stern", facing: -1, armR: [[30, -10], [16, -46]] as A2, armRTop: true }, 3],                                 // salutes, deadpan
        [812, { expr: "stern", facing: -1, ...shoulder() }, 4],
      ]), { idx: 10 }),
      ...RING3.map(([who, p], i) => C(who, p, snap < 0.5 ? pose(null, { expr: "bored", facing: i < 3 ? 1 : -1, ...atEase() }) : pose(null, { expr: "stern", facing: i < 3 ? 1 : -1, ...shoulder() }), { idx: 11 + i })),
    ],
    fx: fxs(
      f < 736 ? dustCard("in1", [-22.4, FYf + 2.0, -26.2], 3.4, 1 - lin(f, 719, 736), 1) : null,
      f < 734 ? dustCard("in2", [-23.2, FYf + 1.4, -24.8], 2.6, 1 - lin(f, 719, 734), 3) : null,
      dug && dk > 0.85 ? dustCard("dig", [MK.hero[0] - 0.5, FYf + 0.35, MK.hero[2] + 0.2], 0.5, 0.8, 2) : null,
      f >= 788 && f < 804 ? sparkle("gold", [MK.hero[0] + 0.45, FYf + 1.95, MK.hero[2]], f - 788, 0.32) : null,
    ),
    focus: f < 760 ? [MK.hero[0], FYf + 1.2, MK.hero[2]] : [-23.9, FYf + 1.6, -21],
    subj: "parm",
  };
};
lens(719, 3, 1); lens(760, 6, 24);

// ---------------- 4: nights one and two ----------------
const crowAt = (f: number): { p: V3; fly: boolean } => {
  const A: V3 = [-31.0, FYf + 5.5, -33], B: V3 = [-28.2, FYf + 0.86, -28.25], E: V3 = [-24.5, FYf + 6.5, -33.5];
  if (f < 834) { const u = sm(f, 822, 834); return { p: lerp3(A, B, u), fly: true }; }
  if (f < 848) return { p: B, fly: false };
  return { p: lerp3(B, E, sm(f, 848, 862)), fly: true };
};
SHOT_CAMS[4] = () => [
  K(819, F(() => fit([body(MK.hero, 0, 2.3, 0.45), body(MK.serg, 0, 2.3, 0.45)], -15, 6, 42, 0.8), 819, 0.0016)),
  K(824, F(() => ({ pos: [-21.0, FYf + 3.6, -15.2] as V3, look: [-28.0, FYf + 0.9, -24.0] as V3, fov: 46 }), 824, 0.0014), 30),         // the whole field at night
  K(876, F(() => fit([body(MK.drum, 0, 0.7, 0.5), body(DICE.sergeant, 0, 1.6, 0.4), body(DICE.sol5, 0, 1.6, 0.4), body(DICE.sol4, 0, 1.6, 0.4)], 52, 12, 40, 0.82), 876, 0.0018, [[920, 0.005, 10]]), 30),
  K(958, F(() => fit([body(DICE.sergeant, 0, 2.0, 0.4), body(DICE.sol5, 0, 2.0, 0.4), body(DICE.sol4, 0, 2.0, 0.4), body([-23.5, FYf, -23.0], 0, 2.1, 0.4)], 62, 8, 40, 0.86), 958, 0.0018, [[982, 0.006, 8]]), 18),
  K(1004, (f) => { const k = sm(f, 1004, 1021); return { pos: lerp3([-19.2, FYf + 2.2, -25.5], [-21.4, FYf + 2.45, -27.3], k), look: [-22.6, FYf + 2.5, -28.2] as V3, fov: 40 }; }, 6),   // into the corner torch's flame
];
SHOT_ACTS[4] = (f, s) => {
  const crow = crowAt(f), ph12 = (f / 12) % 1;
  const go = (who: string, a: number, b: number) => walkPath(4, s, [who === "sergeant" ? MK.serg : ringAt(who), DICE[who]], f, a, b);
  const dicers = ["sergeant", "sol5", "sol4"];
  const hw = walkPath(4, s, HERO_WALK, f, 958, 1012);
  const cast: CastPlace[] = [
    C("parm", hw.p, hw.moving ? pose(null, { mode: "walk", phase: hw.phase, facing: hw.facing, expr: "smug", armR: [[26, 20], [30, 36]] as A2, propR: "lantern" })
      : f < 958 ? pose(null, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2, propR: "lantern" }) : pose(null, { expr: "smug", facing: -1, look: -0.4, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }), { idx: 1 }),
    ...RING3.filter(([w]) => !dicers.includes(w)).map(([who, p], i) => C(who, p, flow(f, [
      [819, { expr: "stern", facing: i < 3 ? 1 : -1, ...shoulder() }],
      [852 + i * 4, { expr: "bored", facing: i < 3 ? 1 : -1, ...atEase() }, 8],
    ]), { idx: 11 + i })),
  ];
  for (const [j, who] of dicers.entries()) {
    const w = go(who, 858 + j * 4, 900 + j * 2), at = DICE[who];
    cast.push(C(who, w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase, facing: w.facing, expr: "grin", ...atEase() }) : f < 858 ? flow(f, [
      [819, { expr: "stern", facing: -1, ...shoulder() }],
      [853, { expr: who === "sol5" ? "laugh" : "bored", facing: -1, mouth: who === "sol5" && f < 872 ? "O" : undefined, ...(who === "sol5" ? { armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2 } : atEase()) }, 5], // the yawn
    ]) : flow(f, [
      [900, { expr: "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[26, 24], [40, 30]] as A2, armRFront: true }],
      [914 + j * 6, { expr: "eureka", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[30, -6], [44, -24]] as A2, armRFront: true, propR: j === 0 ? "dice" : undefined }, 6],   // wind-up
      [922 + j * 6, { expr: j === 1 ? "smug" : "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[34, 18], [60, 26]] as A2, armRFront: true }, 2],                        // throw
      ...(who === "sol5" ? [[968, { expr: "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[24, 4], [8, -30]] as A2, armRTop: true }, 5]] as Beat[] : []),            // pushes his nose up: snout
      [982, { expr: "guffaw", mode: "kneel", shake: 1, phase: ph12 + j * 0.3, facing: faceTo(4, s, f, at, MK.drum), armR: [[26, 44], [6, 70]] as A2, armRFront: true, ...(who === "sol4" ? { armR: [[40, 18], [88, 8]] as A2 } : {}) }, 2],
    ]), { idx: 20 + j }));
  }
  if (f >= 819 && f < 864) cast.push(C("crow", crow.p, pose(null, { mode: crow.fly ? "air" : "stand", phase: (f / 6) % 1, expr: "neutral", facing: crow.fly ? 1 : f < 841 ? 1 : -1, tilt: !crow.fly && f > 838 && f < 844 ? 30 : 0 }), { idx: 30, scale: 0.45, air: crow.fly }));
  return {
    ctl: { planted: 1, holes: 0, torches: 1, moon: 1, trough: 0, gardens: 0, smoke: 0 },
    cast,
    fx: fxs(
      f >= 922 && f < 990 ? [0, 1, 2].map((i) => ({ kind: "card", key: "coin" + i, pos: [MK.drum[0] + 0.12 * (i - 1), FYf + 0.66, MK.drum[2] + 0.08 * i] as V3, w: 0.1, h: 0.07, cw: 64, ch: 44,
        draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(32, 22, 30, 20, 0, 0, 7); g.fill(); g.fillStyle = "#f2c24a"; g.beginPath(); g.ellipse(32, 22, 25, 15, 0, 0, 7); g.fill(); } } as FxSpec)) : null,
      f >= 924 && f < 936 ? sparkle("dice", [MK.drum[0], FYf + 0.8, MK.drum[2]], f - 924, 0.24) : null,
      f >= 1004 ? torchGlow("into" + Math.round(sm(f, 1004, 1021) * 8), [-22.6, FYf + 2.55, -28.2], 0.6 + 2.4 * sm(f, 1006, 1021), 0.4 + 0.6 * sm(f, 1006, 1021)) : null,
    ),
    focus: f < 876 ? [-28, FYf + 1.4, -24] : f < 1004 ? [MK.drum[0], FYf + 1.0, MK.drum[2]] : [-22.6, FYf + 2.5, -28.2],
    subj: f < 864 ? "crow" : f < 1004 ? "sol5" : null,
  };
};
lens(819, 6, 1); lens(824, 2, 24); lens(876, 6, 24); lens(1004, 4, 10);

// ---------------- 5: dawn ----------------
const IN_PATH = (i: number): V3[] => { const sx = -18.2 - 0.9 * i, z = -18.3 + 0.45 * (i % 2 ? 1 : -1); return [[sx, vH(sx, z), z], [-22.2, FYf, z], [-24.2 - 0.85 * i, FYf, -18.6 - 0.7 * i]]; };
const MARCH = ["sergeant", "sol1", "sol2", "sol3", "sol4", "sol5", "sol6"];
SHOT_CAMS[5] = () => [
  K(1021, F(() => ({ pos: [-29.4, FYf + 1.3, -19.0] as V3, look: [-20.0, FYf + 1.5, -18.4] as V3, fov: 44 }), 1021, 0.0014)),          // toward the low sun: they march in
  K(1080, F(() => fit([body([-24.5, FYf, -19.4], 0, 2.1, 0.5), body([-28.4, FYf, -22.6], 0, 2.1, 0.5), body(HERO_DAWN, 0, 2.2, 0.4), [[-28.5, FYf, -21], 0, 0.2, 2.4]], 112, 14, 44, 0.9), 1080, 0.0016, [[1102, 0.006, 10]]), 24), // the holes
  K(1128, F(() => fit([body(HERO_DAWN, 0.9, 2.3, 0.36)], 70, 4, 38, 0.62, -0.06), 1128, 0.002, [[1136, 0.006, 8]]), 1, true),                   // "That's the trick." (cut on the punch)
  K(1148, (f) => { const k = sm(f, 1148, 1160); const L: V3 = [HERO_DAWN[0] + 0.45, FYf + 1.35, HERO_DAWN[2] + 0.1]; return { pos: lerp3([L[0] + 2.0 * Math.sin(1.22), L[1] + 0.3, L[2] + 2.0 * Math.cos(1.22)], [L[0] + 0.7 * Math.sin(1.22), L[1] + 0.1, L[2] + 0.7 * Math.cos(1.22)], k), look: L, fov: 38 }; }, 8),
];
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = MARCH.map((who, i) => {
    const w = walkPath(5, s, IN_PATH(i), f, 1026 + i * 4, 1074 + i * 3), drop = who === "sol6" ? sm(f, 1106, 1112) : 0;
    return C(who, w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase, facing: w.facing, expr: i % 2 ? "bored" : "sleep", ...atEase() }) : flow(f, [
      [1070, { expr: "bored", facing: -1, mouth: i % 3 === 0 && f < 1090 ? "O" : undefined, ...atEase() }],
      [1100 + (i % 3), { expr: "shock", facing: -1, tilt: -6, hatLift: who === "sol6" ? 0.9 * drop : 0, ...atEase({ armL: [[-30, -20], [-44, -50]] as A2 }) }, 2],   // jaws drop; a hat pops off
      [1118, { expr: "aghast", facing: -1, look: -0.8, hatLift: who === "sol6" ? 0.9 : 0, ...atEase() }, 6],
    ]), { idx: 10 + i });
  });
  cast.push(C("parm", HERO_DAWN, flow(f, [
    [1021, { expr: "calm", facing: 1, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }],
    [1100, { expr: "smug", facing: 1, look: 0.6, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }, 1],
    [1134, { expr: "sly", facing: 1, blink: f >= 1138 && f < 1146 ? 1 : 0, headTilt: 6, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }, 1],   // the wink
    [1146, { expr: "smug", facing: 1, armR: [[26, 6], [40, -10]] as A2, armRFront: true, propR: "lantern" }, 4],                                     // lifts the lantern
  ]), { idx: 1 }));
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: 0, smoke: 1 },
    cast,
    fx: fxs(
      f < 1034 ? torchGlow("out" + Math.round(lin(f, 1021, 1034) * 8), [-19.5, FYf + 1.8, -18.4], 3.2 - 2.4 * lin(f, 1021, 1034), 1 - 0.8 * lin(f, 1021, 1034)) : null,
      f >= 1106 && f < 1118 ? sparkle("hat", [-29.3, FYf + 2.4, -23.8], f - 1106, 0.3) : null,
      f >= 1148 ? torchGlow("lant" + Math.round(sm(f, 1148, 1160) * 8), [HERO_DAWN[0] + 0.45, FYf + 1.35, HERO_DAWN[2] + 0.1], 0.3 + 1.2 * sm(f, 1150, 1160), 0.5 + 0.5 * sm(f, 1150, 1160)) : null,
    ),
    focus: f < 1080 ? [-24, FYf + 1.6, -18.6] : [HERO_DAWN[0], FYf + 1.7, HERO_DAWN[2]],
    subj: f < 1080 ? "sergeant" : "parm",
  };
};
lens(1021, 2, 1); lens(1080, 3, 24); lens(1128, 7, 1); lens(1148, 8, 8);

// =====================================================================================================================
// SHOT 6 (1160-1375) = SCENE 5, the EXPLANATION in its own place and light: the guard hut at night (deep blue + a warm
// candle), in by a LIGHT dissolve (the hero's lantern -> the candle flame). "Nobody wants pig food. But if the king's
// soldiers guard it, it must be worth stealing. And every night at sundown, he quietly sent the guards to bed."
// From the candle the camera finds the window: outside, two villagers crouch behind the field wall; one shrugs at the
// potato rows; a soldier marches past on patrol; their eyes go huge and they rub their hands as the rows sparkle. The
// camera slides back across the bunks: the soldiers snore in bed, the hero tiptoes in with a finger to his lips, pulls a
// blanket over the last one, and slips out of the door (shape match into the STAFF ONLY door).
const THA: V3 = [0.55, 0, -5.7], THB: V3 = [1.55, 0, -5.75], PA: V3 = [-2.6, 0, -8.6], PB: V3 = [4.6, 0, -8.6];
const BUNKS: [string, V3][] = [["sergeant", [-2.56, 0.48, -0.6]], ["sol1", [-2.56, 1.5, -0.6]], ["sol2", [-2.56, 0.48, 0.4]], ["sol3", [-2.56, 1.5, 0.4]]];
const CANDLE: V3 = [1.42, 0.76, -1.18], HDOOR: V3 = [2.35, 0, 0.9];
SHOT_CAMS[6] = () => [
  K(1156, (f) => ({ pos: [CANDLE[0] + 0.55, CANDLE[1] + 0.3, CANDLE[2] + 0.75] as V3, look: [CANDLE[0], CANDLE[1] + 0.18, CANDLE[2]] as V3, fov: 40 + 0 * f })),
  K(1166, FS(() => ({ pos: [0.9, 1.45, 0.4] as V3, look: [1.0, 1.05, -7.0] as V3, fov: 40 }), 1166, 0.0022, -0.0018, [[1265, 0.006, 10]], 1225), 26),       // through the window
  K(1284, F(() => ({ pos: [2.6, 1.8, 2.25] as V3, look: [-2.2, 1.0, -0.4] as V3, fov: 50 }), 1284, 0.0016), 30),                            // slide back across the bunks
  K(1352, (f) => { const k = sm(f, 1344, 1372); return { pos: lerp3([-1.95, 2.1, -1.15], [-1.0, 1.65, 0.35], k), look: lerp3([1.4, 1.0, 1.2], [2.4, 1.25, 0.9], k), fov: 44 }; }, 1, true), // hard cut as he turns for the door: high behind him, clear of his path
];
SHOT_ACTS[6] = (f, s) => {
  const pat = walkPath(6, s, [PA, PB], f, 1196, 1262);
  const hw = walkPath(6, s, [HDOOR, [-1.5, 0, 0.0]], f, 1290, 1326), out = walkPath(6, s, [[-1.5, 0, 0.0], [2.4, 0, 0.9]], f, 1342, 1362);
  const tuck = sm(f, 1330, 1338) * (1 - sm(f, 1340, 1346));
  const zz = Math.floor(f / 40) % 4;
  return {
    ctl: { candle: 1, smoke: 0, moon: 1, door: sm(f, 1288, 1296) * (1 - sm(f, 1300, 1310)) },
    cast: [
      C("farmer", THA, flow(f, [
        [1156, { mode: "kneel", expr: "bored", facing: 1, look: 0.4 }],
        [1168, { mode: "kneel", expr: "bored", facing: 1, armR: [[34, 20], [52, -6]] as A2, armL: [[-34, 20], [-52, -6]] as A2 }, 5],      // shrugs at the rows: pig food
        [1200, { mode: "kneel", expr: "stare", facing: 1, look: -0.8 }, 4],
        [1262, { mode: "kneel", expr: "shock", facing: 1, armR: [[22, 30], [8, 34]] as A2, armL: [[-22, 30], [-8, 34]] as A2, armRFront: true, armLFront: true }, 2],    // eyes huge
        [1272, { mode: "kneel", expr: "sly", facing: 1, armR: [[22, 30], [6 + 4 * Math.sin(f * 0.9), 32]] as A2, armL: [[-22, 30], [-6 - 4 * Math.sin(f * 0.9), 32]] as A2, armRFront: true, armLFront: true }, 3], // rubs his hands
      ]), { idx: 48 }),
      C("vil1", THB, flow(f, [
        [1156, { mode: "kneel", expr: "neutral", facing: -1, look: -0.4 }],
        [1202, { mode: "kneel", expr: "stare", facing: -1, look: -0.8 }, 4],
        [1263, { mode: "kneel", expr: "eureka", facing: -1, armR: [[22, 30], [8, 34]] as A2, armL: [[-22, 30], [-8, 34]] as A2, armRFront: true, armLFront: true }, 2],
        [1273, { mode: "kneel", expr: "sly", facing: -1, armR: [[22, 30], [6 - 4 * Math.sin(f * 0.9), 32]] as A2, armL: [[-22, 30], [-6 + 4 * Math.sin(f * 0.9), 32]] as A2, armRFront: true, armLFront: true }, 3],
      ]), { idx: 41 }),
      C("sol5", pat.p, pat.moving ? pose(null, { mode: "walk", phase: pat.phase, facing: pat.facing, expr: "stern", armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }) : pose(null, { expr: "stern", facing: pat.facing, armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }), { idx: 20 }),
      ...BUNKS.map(([who, p], i) => C(who, [p[0], p[1] + 0.27, p[2]], pose(null, { expr: "sleep", mouth: zz === i ? "o" : undefined, armR: [[24, 30], [10, 56]] as A2, armL: [[-24, 30], [-10, 56]] as A2, armRFront: true, armLFront: true }), { idx: 30 + i, roll: -Math.PI / 2, blob: false })),
      C("parm", f < 1326 ? hw.p : out.p, (hw.moving || (out.moving && f < 1360)) ? pose(null, { mode: "walk", phase: (f < 1326 ? hw.phase : out.phase) * 0.6, facing: f < 1326 ? hw.facing : out.facing, expr: "sly", tilt: 8, armR: [[16, -2], [2, -34]] as A2, armRTop: true })
        : f < 1290 ? pose(null, { expr: "sly", facing: -1 }) : flow(f, [
          [1326, { expr: "sly", facing: -1, armR: [[16, -2], [2, -34]] as A2, armRTop: true }],
          [1330, { expr: "smile", facing: -1, tilt: 14, armR: [[34, 20], [64, 30 + 10 * tuck]] as A2, armRFront: true }, 4],                 // pulls the blanket up
          [1342, { expr: "smug", facing: 1, armR: [[16, -2], [2, -34]] as A2, armRTop: true }, 3],
          [1362, { expr: "smug", back: true, armR: [[30, -6], [44, -20]] as A2 }, 3],                                                        // at the door, back to us
        ]), { idx: 1, scale: f < 1288 ? 0.001 : 1 }),
    ],
    fx: fxs(
      f < 1176 ? glowBurst("cand" + Math.round(lin(f, 1156, 1176) * 8), [CANDLE[0], CANDLE[1] + 0.2, CANDLE[2]], 1.6 - 1.2 * lin(f, 1156, 1176), 1 - 0.6 * lin(f, 1156, 1176), "255,200,120") : null,
      f >= 1266 && f < 1286 ? [0, 1, 2].map((i) => sparkle("row" + i, [-0.6 + i * 1.4, 0.5, -10 - i * 2], (f - 1266 + i * 4) % 14, 0.45)) : null,
      f >= 1284 ? zzz([BUNKS[zz][1][0] + 0.1, BUNKS[zz][1][1] + 0.6, BUNKS[zz][1][2] - 1.0], f) : null,
    ),
    focus: f < 1166 ? CANDLE : f < 1284 ? [1.0, 0.8, -5.7] : [-1.8, 1.2, -0.2],
    subj: f < 1166 ? null : f < 1284 ? "farmer" : "parm",
  };
};
lens(1156, 6, 1); lens(1166, 3, 26); lens(1284, 4, 24); lens(1352, 4, 12);

// =====================================================================================================================
// SHOT 8 (1470-1552) = SCENE 7, home base B, bright morning (time jump, the dissolve hidden in the door's light):
// "Stolen potatoes ended up in a hundred gardens." The camera glides high over the village: potato patches sprout in every
// backyard, the big farmer secretly munches a baked potato in his, a neighbour hoes; down to the hero, who picks a potato
// flower and holds it up (shape match into the banquet).
// SHOT 10 (1794-1914) = SCENE 9, the pigsty at golden evening (hard cut on the punchline): "Not bad for the Pig Doctor.
// The pigs, though, never got another potato." The farmer tips his hat to the hero (flower in his buttonhole) as he
// passes; slow push to the pig at its empty trough: a sad nudge, one ear twitch, a calm held close-up -> loops to frame 1.
const GA: V3 = [-12.5, 0, 13.5], GB: V3 = [6.8, 0, 13.6], GC: V3 = [12.8, 0, -9.6];
const HERO8: V3 = [4.6, 0, 12.0];
const FLOWER = (): V3 => [HERO8[0] + 0.28, 2.34, HERO8[2] + 0.12];
const flowerCard = (pos: V3, s: number): FxSpec => ({ kind: "card", key: "pflower", pos, w: s, h: s, cw: 160, ch: 160,
  draw: (p) => { const g = p.g; g.strokeStyle = INKC; g.lineWidth = 7; g.fillStyle = "#4f8a3a"; g.beginPath(); g.moveTo(80, 150); g.lineTo(80, 92); g.stroke();
    g.beginPath(); g.ellipse(102, 118, 20, 9, -0.5, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.fillStyle = i % 2 ? "#c9b4f6" : "#ece4ff"; g.beginPath(); g.ellipse(80 + Math.cos(a) * 30, 62 + Math.sin(a) * 30, 24, 17, a, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = "#f6c430"; g.beginPath(); g.arc(80, 62, 14, 0, 7); g.fill(); g.stroke(); } });
SHOT_CAMS[8] = () => [
  K(1470, F((f) => { const k = sm(f, 1470, 1528); return { pos: lerp3([-0.5, 10.5, 14.8], [2.6, 4.4, 15.8], k), look: lerp3([-5.0, 0.2, 6.5], [4.4, 0.8, 11.2], k), fov: 48 }; }, 1470, 0.0012)),
  K(1526, (f) => { const h = FLOWER(), k = sm(f, 1526, 1550); return { pos: lerp3([h[0] + 3.8 * Math.sin(0.4), h[1] - 0.3, h[2] + 3.8 * Math.cos(0.4)], [h[0] + 3.0 * Math.sin(0.4), h[1] - 0.45, h[2] + 3.0 * Math.cos(0.4)], k), look: [h[0], h[1] - 0.8, h[2]], fov: 38 }; }, 18),
];
SHOT_ACTS[8] = (f) => {
  const hoe = 0.5 + 0.5 * Math.sin(((f - 1470) / 13) * Math.PI * 2);
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: sm(f, 1474, 1522), smoke: 1 },
    cast: [
      C("farmer", [GA[0] + 1.6, 0, GA[2] - 1.9], flow(f, [
        [1470, { expr: "sly", facing: -1, look: -0.8, sweat: 1, armR: [[22, 16], [10, -14]] as A2, armRFront: true, propR: "bakedPotato" }],
        [1494, { expr: "joy", facing: -1, sweat: 1, mouth: f % 6 < 3 ? "O" : "dash", armR: [[22, 16], [8, -18]] as A2, armRFront: true, propR: "bakedPotato" }, 2],          // munch, munch
        [1516, { expr: "nervous", facing: 1, look: 0.9, sweat: 1, armR: [[24, 34], [-6, 50]] as A2, armRFront: true, propR: "bakedPotato" }, 2],                           // hides it behind his back
      ]), { idx: 48 }),
      C("vil1", [GB[0] + 2.4, 0, GB[2] - 1.5], pose(null, { expr: "smile", facing: -1, tilt: 12 * hoe, armR: [[28, 18 + 10 * hoe], [50, 30 - 22 * hoe]] as A2, armL: [[-6, 30], [28, 42 - 10 * hoe]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: -0.6 + 0.8 * hoe, propK: 1 }), { idx: 41 }),
      C("vil2", [GC[0] - 1.8, 0, GC[2] + 1.6], pose(null, { expr: "joy", facing: 1, mode: "kneel", armR: [[26, 24], [40, 30]] as A2, armRFront: true, propR: "potato" }), { idx: 42 }),
      C("vil4", [-4.0, 0, 9.6], pose(null, { expr: "joy", facing: 1, armR: [[30, -14], [44, -46]] as A2, propR: "potato" }), { idx: 46 }),
      C("parm", HERO8, flow(f, [
        [1470, { expr: "smile", facing: 1, look: 0.6, armR: [[24, 30], [30, 52]] as A2 }],
        [1524, { expr: "calm", facing: 1, tilt: 18, armR: [[30, 30], [50, 46]] as A2, armRFront: true }, 6],                       // bends to the plant
        [1532, { expr: "smug", facing: 1, armR: [[24, -30], [30, -80]] as A2 }, 4],                                                // holds the flower up
      ]), { idx: 1 }),
      C("pig", [-9.0, 0, -3.4], pose(null, { expr: "dismay", facing: 1, tilt: 4 }), { idx: 40, scale: 0.78 }),
    ],
    fx: fxs(
      f < 1486 ? glowBurst("in8_" + Math.round(lin(f, 1470, 1486) * 8), [-2.0, 7.5, 21.0], 9 - 6 * lin(f, 1470, 1486), 1 - lin(f, 1470, 1486), "255,236,200") : null,
      f >= 1532 ? flowerCard(lerp3([HERO8[0] + 0.45, 1.5, HERO8[2] + 0.1], FLOWER(), sm(f, 1532, 1538)), 0.42) : null,
      f >= 1540 && f < 1552 ? sparkle("fl", [FLOWER()[0] + 0.2, FLOWER()[1] + 0.2, FLOWER()[2]], f - 1540, 0.22) : null,
    ),
    focus: f < 1526 ? [GA[0], 1.2, GA[2]] : FLOWER(),
    subj: f < 1526 ? "farmer" : null,
  };
};
lens(1470, 1, 1); lens(1526, 8, 14);

// ---------------- 10: ending ----------------
const PIGE: V3 = [-9.0, 0, -3.4], FARM10: V3 = [-6.6, 0, -1.4];
SHOT_CAMS[10] = () => [
  K(1794, F(() => fit([body(FARM10, 0, 2.1, 0.45), body([-4.4, 0, -0.2], 0, 2.3, 0.45)], 34, 6, 40, 0.8), 1794, 0.0018), 1, true),
  K(1826, FS(() => ({ pos: [-8.65, 1.72, -0.55] as V3, look: [-8.65, 0.36, -3.45] as V3, fov: 40 }), 1826, 0.0016, -0.002, [], 1870), 26),
];
SHOT_ACTS[10] = (f, s) => {
  const hw = walkPath(10, s, [[-1.6, 0, 1.4], [-4.4, 0, -0.2]], f, 1794, 1818);
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: 1, smoke: 1 },
    cast: [
      C("parmFlower", hw.p, hw.moving ? pose(null, { mode: "walk", phase: hw.phase, facing: hw.facing, expr: "smile" }) : flow(f, [
        [1818, { expr: "smile", facing: -1, armR: [[24, 30], [30, 52]] as A2 }],
        [1822, { expr: "proud", facing: -1, headTilt: 6, armR: [[30, -10], [16, -46]] as A2, armRTop: true }, 4],                  // touches his hat back
        [1836, { expr: "smile", facing: -1, look: -0.8, armR: [[24, 30], [30, 52]] as A2 }, 6],
      ]), { idx: 1 }),
      C("farmer", FARM10, flow(f, [
        [1794, { expr: "neutral", facing: 1, look: 0.6 }],
        [1806, { expr: "smile", facing: 1, hatLift: 0.35, armR: [[30, -10], [16, -50]] as A2, armRTop: true }, 6],                  // tips his hat: respect
        [1830, { expr: "smile", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 8],
      ]), { idx: 48 }),
      C("pig", PIGE, flow(f, [
        [1794, { expr: "neutral", facing: 1, phase: 0 }],
        [1832, { expr: "dismay", facing: 1, tilt: 6 }, 1],
        [1846, { expr: "dismay", facing: 1, tilt: 22 }, 6],                                                                          // nudges the empty trough
        [1862, { expr: "dismay", facing: 1, tilt: 8, phase: lin(f, 1870, 1880) * 0.4 }, 8],                                          // one ear twitch, then still
      ]), { idx: 40, scale: 0.78 }),
    ],
    fx: [],
    focus: f < 1826 ? [-5.5, 1.5, -0.8] : [PIGE[0] + 0.5, 0.6, PIGE[2]],
    subj: f < 1826 ? "farmer" : "pig",
  };
};
lens(1794, 4, 1); lens(1826, 9, 24);

// PLACEHOLDER cameras until the scene files land (one static framing per shot id).
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) if (!SHOT_CAMS[id]) {
  SHOT_CAMS[id] = (s) => [K(0, F(() => s.cams.main ?? { pos: [0, 2, 10] as V3, look: [0, 1, 0] as V3, fov: 40 }, 0, 0.0018))];
  SHOT_ACTS[id] = () => ({ ctl: {}, cast: [], fx: [], focus: [0, 1, 0], subj: null } as unknown as Act);
}

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
