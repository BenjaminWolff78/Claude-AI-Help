// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "Why He Painted Eyes on Cows' Butts", set-local coordinates,
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
// "He Labeled Grape Bricks 'Don't Make Wine' and Beat Prohibition": shared staging. Positions come from the set marks
// (vineyard = the road set's VINE variant, kitchen, office). Accent grape violet #9B3FD0.
const MK = (s: SetDef, k: string): V3 => (s.marks[k] ?? [0, 0, 0]) as V3;
const add3 = (a: V3, dx: number, dy: number, dz: number): V3 => [a[0] + dx, a[1] + dy, a[2] + dz];
const VIO = "#9b3fd0";
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
/** a wine bottle with a red "no" stamp that lands on frame `hit` (mini animation for "wine just became illegal") */
const noWine = (key: string, pos: V3, f: number, a: number, hit: number, b: number) => popCard(key, pos, 0.9, 0.9, f, a, b, (g) => {
  g.lineJoin = "round"; g.fillStyle = "#24503a"; g.strokeStyle = INKC; g.lineWidth = 12;
  g.beginPath(); g.moveTo(232, 60); g.lineTo(280, 60); g.lineTo(280, 150); g.quadraticCurveTo(340, 190, 340, 250); g.lineTo(340, 450); g.lineTo(172, 450); g.lineTo(172, 250); g.quadraticCurveTo(172, 190, 232, 150); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fbf3dc"; g.fillRect(190, 290, 132, 92); g.strokeRect(190, 290, 132, 92); g.fillStyle = "#6a2c7e"; g.font = "900 40px DejaVu Sans"; g.textAlign = "center"; g.fillText("WINE", 256, 350);
  if (f >= hit) { const s = 1 + 0.6 * (1 - sm(f, hit, hit + 5)); g.save(); g.translate(256, 256); g.scale(s, s); g.strokeStyle = "#e0303a"; g.lineWidth = 38; g.beginPath(); g.arc(0, 0, 190, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-134, -134); g.lineTo(134, 134); g.stroke(); g.restore(); }
});
/** "200 GALLONS": jug icons popping in a row, the counter ticking up to 200 (mini animation) */
const gallons = (key: string, pos: V3, f: number, a: number, b: number) => popCard(key, pos, 0.8, 0.4, f, a, b, (g) => {
  const n = Math.round(200 * sm(f, a + 4, a + 40)), jugs = Math.min(5, Math.floor(sm(f, a + 2, a + 36) * 5.99));
  for (let i = 0; i < jugs; i++) { const x = 40 + i * 92; g.fillStyle = "#d8ecf4"; g.strokeStyle = INKC; g.lineWidth = 7; g.fillRect(x, 70, 70, 96); g.strokeRect(x, 70, 70, 96); g.fillStyle = "#6a1f78"; g.fillRect(x + 6, 110, 58, 52); g.fillStyle = "#c9a27a"; g.fillRect(x + 22, 52, 26, 20); g.strokeRect(x + 22, 52, 26, 20); }
  inkRound(g, 96, 184, 320, 64, 22, VIO, 8); g.fillStyle = "#ffffff"; g.font = "900 46px DejaVu Sans"; g.textAlign = "center"; g.fillText(n + " GALLONS", 256, 232);
}, 512, 256);
/** a big red LEGAL stamp mark on the ruling paper (lands on `hit`) */
const legalMark = (pos: V3, f: number, hit: number): FxSpec | null => f < hit ? null : ({ kind: "card", key: "legalMk" + Math.min(6, f - hit), pos, w: 0.42, h: 0.21, flat: true, cw: 256, ch: 128,
  draw: (p) => { const g = p.g, s = 1 + 0.5 * (1 - sm(f, hit, hit + 4)); g.save(); g.translate(128, 64); g.scale(s, s); g.rotate(-0.12); g.strokeStyle = "#d4252e"; g.lineWidth = 9; g.strokeRect(-104, -44, 208, 88);
    g.fillStyle = "#d4252e"; g.font = "900 64px DejaVu Sans"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LEGAL", 0, 4); g.restore(); } });
/** v10.9 glide (one move, 18-40 f): from the previous framing frozen at f0 to `to` (whose own creep starts at f1), eased over
 *  [f0, f1]. `lift` (m) arcs the path up and `bulge` (world m) sideways, both peaking mid-move; `yLead` 0..1 makes the
 *  height arrive early (to clear a fence or rail right next to the start). Used as K(f0, glideTo(...), 1). */
const glideTo = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0, bulge: V3 = [0, 0, 0], yLead = 0, lookLead = 0) => (f: number): Shot => {
  const a = from(f0), b = to(f), k = sm(f, f0, f1), ky = yLead ? sm(f, f0, f0 + (f1 - f0) * (1 - yLead)) : k, kl = lookLead ? sm(f, f0, f0 + (f1 - f0) * (1 - lookLead)) : k, s = Math.sin(Math.PI * k);
  return { pos: [lerp(a.pos[0], b.pos[0], k) + bulge[0] * s, lerp(a.pos[1], b.pos[1], ky) + (lift + bulge[1]) * s, lerp(a.pos[2], b.pos[2], k) + bulge[2] * s],
    look: lerp3(a.look, b.look, kl), fov: lerp(a.fov ?? 40, b.fov ?? 40, k), roll: 0 };
};
/** the cupboard calendar day for a quick 1 -> 21 flip over [a, b] */
const dayFlip = (f: number, a: number, b: number) => 1 + Math.round(20 * sm(f, a, b));
/** a world point `dist` m in front of the shot's camera, shifted dx right / dy up (m) in screen space (cards that must stay in frame) */
const camPt = (id: number, s: SetDef, f: number, dist: number, dx = 0, dy = 0): V3 => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  const fw = [d[0] / L, d[1] / L, d[2] / L], rl = Math.hypot(fw[0], fw[2]) || 1, rt = [-fw[2] / rl, 0, fw[0] / rl];
  return [c.pos[0] + fw[0] * dist + rt[0] * dx, c.pos[1] + fw[1] * dist + dy, c.pos[2] + fw[2] * dist + rt[2] * dx];
};

// =====================================================================================================================
// SHOT 1 (0-445) = H1-H4, the press yard at golden morning (home base A). v10.9 holds: H1 0-118 Brick Boy at the press
// (cranks, picks up a fresh brick, shows the WARNING label); G1 118-150 crane up/back; H2 150-229 wide (press yard, the
// road, Hank's half-ripped field; the wine bottle gets its NO stamp on "banned"); G2 229-262 glide down to Hank; H3
// 262-358 Hank yanks a vine, throws it on the heap, laughs, points across: "Nobody's buying a grape brick, Brick Boy";
// hard cut 1 at 358 to Brick Boy's smug close-up; H4 358-445 he lifts the brick on "label", push into the label.
const BB_PRESS = (s: SetDef) => MK(s, "brickPress");
const HANK_Y = (s: SetDef) => MK(s, "hankYank");
const brickAt = (p: V3, rt: [number, number], k = 0.3): V3 => [p[0] + rt[0] * k, 1.36, p[2] + rt[1] * k];
const rtOf = (az: number): [number, number] => { const a = (az * Math.PI) / 180; return [Math.cos(a), -Math.sin(a)]; };
SHOT_CAMS[1] = (s) => {
  const bb = BB_PRESS(s), hk = HANK_Y(s);
  const h1 = fit([body(bb, 0, 2.05, 0.45)], 168, 4, 40, 0.8, 0.12, 0.1);
  const h2 = fit([body(hk, 0, 2.9, 1.1)], -62, 10, 44, 0.86, -0.8, 0.25);      // over Hank's field to Brick Boy's farm across the road
  const h3 = fit([body(hk, 0, 2.05, 0.5)], -62, 8, 40, 0.8, -0.35, 0.15);              // same axis as the wide: the glide is mostly a push
  const h4 = fit([body(bb, 0.95, 2.1, 0.34)], -150, 2, 34, 0.86, 0, 0.12);
  const S1 = F(() => h1, 0, 0.0024, [[52, 0.006, 10]]), S2 = F(() => h2, 118, 0.0016), S3 = F(() => h3, 269, 0.0022, [[280, 0.006, 10]]);
  return [
    K(0, S1),
    K(118, S2, 1, true),                                                       // hard cut 1: "You see," -> the neighbour's field
    K(229, glideTo(S2, 229, S3, 269), 1),                                      // G1 (40 f) in to Hank
    K(358, F((f) => { const k = sm(f, 402, 445); return { pos: lerp3(h4.pos, lerp3(h4.look, h4.pos, 0.8), k), look: h4.look, fov: 34 }; }, 358, 0.0026), 1, true),   // hard cut 2: the smug reaction, push in on "label"
  ];
};
SHOT_ACTS[1] = (f, s) => {
  const bb = BB_PRESS(s), hk = HANK_Y(s), crank = f < 58 ? f / 46 : 58 / 46;
  return {
    ctl: { press: crank, juice: f < 62 ? 1 : 0, bricks: f < 70 ? 20 : 21, agentCar: -1, spread: 0 },
    cast: [
      C("brickBoy", bb, flow(f, [
        [0, { expr: "determined", facing: 1, tilt: 4 + 3 * Math.sin(f * 0.45), armR: AR.crankR, armRFront: true, armL: [[-10, 4], [18, -16]] as A2, armLFront: true }],
        [56, { expr: "calm", facing: -1, armR: AR.downR, armRFront: true }, 8],                                    // lets go, bends to the crate
        [66, { expr: "smug", facing: -1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],    // a fresh brick
        [84, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 10], // WARNING!
        [150, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],
        [358, { expr: "smug", facing: -1, look: -0.4, armR: AR.carryR, armRFront: true, propR: "grapeBrick", propK: 0 }],
        [383, { expr: "sly", facing: -1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 3 }, 10],   // "Read the label."
      ]), { idx: 1 }),
      C("hank", hk, flow(f, [
        [0, { expr: "strain", facing: 1, tilt: 10, armR: [[20, 20], [30, 40]] as A2, armRFront: true, armL: [[-6, 24], [16, 40]] as A2, armLFront: true }],
        [236, { expr: "strain", facing: 1, tilt: 14, armR: [[20, 24], [26, 44]] as A2, armRFront: true, armL: [[-4, 26], [14, 44]] as A2, armLFront: true }, 6],
        [252, { expr: "grin", facing: 1, tilt: -4, armR: AR.liftHiR, armRFront: true, propR: "vineYank" }, 3],    // yank (impact timing)
        [266, { expr: "grin", facing: -1, tilt: 4, armR: [[-10, -14], [-34, -30]] as A2, armRFront: true }, 6],   // tosses it on the heap
        [280, { ...laughP(f, 280, 0), facing: 1, armR: AR.hipR, armL: AR.hipL }, 4],                               // "One laughs"
        [299, { expr: "grin", facing: 1, armR: AR.pointR, armRFront: true, mouth: talk(f, 300, 352), headTilt: 3 * Math.sin(f * 0.3) }, 4],
      ]), { idx: 2 }),
    ],
    fx: fxs(
      (() => { const c = camAt(1, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return noWine("nw1", [c.pos[0] + d[0] / L * 6, c.pos[1] + d[1] / L * 6 + 1.45, c.pos[2] + d[2] / L * 6], f, 140, 150, 226); })(),
      f >= 252 && f < 264 ? dustCard("yank", [hk[0] + 0.3, 0.3, hk[2]], 0.9, 0.8 * (1 - (f - 252) / 12), 2) : null,
      f >= 268 && f < 280 ? dustCard("heap", [hk[0] - 1.6, 0.5, hk[2] + 3.6], 1.0, 0.7 * (1 - (f - 268) / 12), 3) : null,
      f >= 383 && f < 400 ? sparkle("lab1", brickAt(bb, rtOf(-150), 0.44), f - 383, 0.28) : null,
    ),
    focus: f < 118 ? [bb[0], 1.2, bb[2]] : f < 358 ? [hk[0], 1.4, hk[2]] : brickAt(bb, rtOf(-150), 0.44),
    subj: f < 118 ? "brickBoy" : f < 358 ? "hank" : "brickBoy",
  };
};
lens(0, 6, 1); lens(118, 2, 1); lens(229, 5, 20); lens(358, 7, 1);

// =====================================================================================================================
// SHOT 2 (445-582) = H5, the night kitchen (home base B), one slow track: the warning acted out. Opens on the brick over
// the jug (object match from the label), pulls back: Mum drops it in the gallon of water (it turns purple), carries the
// jug to the pantry, puts it in, the calendar above flips 1 -> 21, the doors close (object dissolve on the doors).
const MUM_C = (s: SetDef) => MK(s, "mumCounter");
SHOT_CAMS[2] = (s) => {
  const jug = MK(s, "jug"), m0 = MUM_C(s);
  const A = fit([body(m0, 0, 2.0, 0.42), [jug, 0, 0.5, 0.22]], 38, 8, 40, 0.84);            // Mum drops the brick in the gallon
  const C = fit([body([2.25, 0, -1.08], 0, 2.2, 0.55), [MK(s, "calendar"), -0.3, 0.3, 0.35]], 12, 6, 44, 0.86);   // pantry + calendar
  // v10.9 rule 3 (a list): ONE slow track from the jug to the pantry, each item centred 1.2 s+, peak ~20 px/frame
  return [K(445, F((f) => { const k = sm(f, 425, 600); return { pos: lerp3(A.pos, C.pos, k), look: lerp3(A.look, C.look, k), fov: lerp(A.fov, C.fov, k) }; }, 445, 0.0008))];
};
SHOT_ACTS[2] = (f, s) => {
  const m0 = MUM_C(s), walk = along([m0, [2.25, 0, -1.08]], 0.075, 500, f);
  const carrying = f >= 494 && f < 546;
  return {
    ctl: { jugWater: f < 548 ? 1 : 0, jugFill: sm(f, 458, 490), jugHide: f >= 494 ? 1 : 0, cupboard: sm(f, 528, 540) * (1 - sm(f, 560, 578)), day: dayFlip(f, 546, 574), shelf: 6, jugGlow: 0 },
    cast: [
      C("mum20", walk.p, walk.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 12), facing: 1, armR: AR.carryR, armRFront: true, propR: "jug" }) : flow(f, [
        [445, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick" }],
        [456, { expr: "smug", facing: -1, armR: [[22, 8], [30, 20]] as A2, armRFront: true }, 3],                // drops it in (plop)
        [490, { expr: "smug", facing: 1, armR: AR.carryR, armRFront: true, propR: carrying ? "jug" : undefined }, 8],
        [540, { expr: "calm", facing: 1, armR: [[24, -2], [44, -8]] as A2, armRFront: true, propR: f < 548 ? "jug" : undefined }, 6],   // into the pantry
        [552, { expr: "smug", facing: -1, look: 0.6, armR: AR.downR }, 8],
      ]), { idx: 1 }),
      C("kid20", MK(s, "kidTable"), flow(f, [[445, { expr: "neutral", facing: -1, look: -0.3 }], [500, { expr: "stare", facing: 1, look: 0.4 }, 6]]), { idx: 2 }),
    ],
    fx: fxs(f >= 456 && f < 470 ? sparkle("plop", add3(MK(s, "jug"), 0, 0.5, 0), f - 456, 0.22, "#d8b0f0") : null),
    focus: f < 494 ? add3(MK(s, "jug"), 0, 0.4, 0) : [walk.p[0], 1.4, walk.p[2]],
    subj: "mum20",
  };
};
lens(445, 5, 1); lens(486, 3, 20);

// =====================================================================================================================
// SHOT 3 (582-893) = H6, G3, H7 at day (home base A). H6 582-722: from the brick in Lou's hands (town3) pull back along
// the crowd at the fence (different depths, angled to the yard): they laugh together on "laughs"; town3 reads the brick:
// "Who puts a warning on juice?"; the black sedan rolls in behind them and stops by the gate. G3 715-745 rides the
// agent through the gate. H7 745-893 (fake-out): the agent at the brick table, the crowd lined up at the fence behind
// him grinning; he picks up a brick, reads it out loud, puts it back, tips his hat; the crowd's faces drop.
const CROWD = ["town1", "town2", "town3", "town4", "hank"];
/** v10.9: the crowd lines the fence in a tighter, depth-staggered row (world x 5.4..6.6 on the road side of the fence) */
const CROWD_P: V3[] = [[6.5, 0, -4.8], [5.5, 0, -4.0], [6.55, 0, -3.1], [5.4, 0, -2.2], [6.3, 0, -1.3]];
/** "The neighbors line the fence to watch": from 700 they hurry down the road to the fence beside the brick table */
const CROWD_F: V3[] = [[6.7, 0, -11.3], [6.1, 0, -11.9], [6.75, 0, -12.5], [6.15, 0, -13.1], [6.6, 0, -13.7]];
const BB3: V3 = [11.6, 0, -12.1];
const crowdWalk = (i: number, f: number) => along([CROWD_P[i], CROWD_F[i]], 0.14, 712 + i * 3, f);
const agentWalk = (s: SetDef): V3[] => [MK(s, "agentOut"), [7.3, 0, -8.8] as V3, MK(s, "agentTable")];
SHOT_CAMS[3] = (s) => {
  const h6a = fit([body(CROWD_P[1]), body(CROWD_P[2]), body(CROWD_P[3])], 100, 12, 42, 0.86);   // Lou reads the brick, neighbours laugh
  const h6 = fit(CROWD_P.map((p) => body(p)), 100, 14, 44, 0.88);                                    // the whole fence + the sedan behind
  const h7 = fit([body(MK(s, "agentTable"), 0, 2.05, 0.4), body(BB3, 0, 2.05, 0.4)], 92, 8, 50, 0.86);   // fake-out: agent and Brick Boy across the table, the crowd at the fence beyond
  const S6a = F(() => h6a, 582, 0.0018), S6 = F(() => h6, 668, 0.0016), S7 = F(() => h7, 718, 0.0012, [[866, 0.012, 27]]);
  return [K(582, S6a), K(640, glideTo(S6a, 640, S6, 668), 1), K(718, S7, 1, true)];   // hard cut 3 to the table (9 m away); the push on "puts it back" carries into the dissolve
};
SHOT_ACTS[3] = (f, s) => {
  const aw = along(agentWalk(s), 0.075, 702, f), carU = f < 668 ? -1 : sm(f, 668, 700) * 0.999 + (f >= 700 ? 0.001 : 0);
  const crowd = CROWD.map((who, i) => {
    const cw = crowdWalk(i, f), ty = MK(s, "agentTable");
    const lookAgent = f >= 700 ? -1 : 1;
    if (cw.moving) return C(who, cw.p, pose(null, { expr: "grin", mode: "walk", phase: ph(f + i * 3, 8), facing: screenSide(3, s, f, cw.d[0], cw.d[1]), ...(who === "town3" ? { armR: AR.carryR, armRFront: true, propR: "grapeBrick" } : {}) }), { idx: 10 + i });
    return C(who, cw.p, flow(f, [
      [582, { expr: "grin", facing: 1, ...(who === "town3" ? { armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1 } : {}) }],
      [592 + i, { ...laughP(f, 592, i), facing: 1, armR: i % 2 ? AR.pointR : AR.hipR, armRFront: true, ...(who === "town3" ? { armR: AR.liftHiR, propR: "grapeBrick", propK: 1 } : {}) }, 3],   // the whole town laughs
      [622, who === "town3" ? { expr: "grin", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, mouth: talk(f, 625, 660) } : { ...laughP(f, 622, i + 2), facing: 1 }, 4],
      [690 + i * 2, { expr: "stare", facing: lookAgent, look: -0.5 }, 6],                                                       // the sedan
      [790 + i, { expr: "grin", facing: -1, look: -0.4, ...(i % 2 ? { armR: AR.hipR, armL: AR.hipL } : {}) }, 4],                    // here comes the arrest
      [878 + i, { expr: "dismay", facing: -1, sweat: i === 4 ? 1 : 0 }, 4],                                                       // he put it back
    ]), { idx: 10 + i });
    void ty;
  });
  return {
    ctl: { agentCar: carU, bricks: 21, press: 0, juice: 0 },
    cast: [
      ...crowd,
      C("brickBoy", BB3, flow(f, [[582, { expr: "calm", facing: -1, armR: AR.hipR, armL: AR.hipL }], [700, { expr: "stare", facing: -1, look: -0.6 }, 6], [880, { expr: "smug", facing: -1, armR: AR.hipR, armL: AR.hipL }, 6]]), { idx: 1 }),
      ...(f >= 700 ? [aw.moving ? C("agent", aw.p, pose(null, { expr: "stern", mode: "walk", phase: ph(f, 11), facing: screenSide(3, s, f, aw.d[0], aw.d[1]) }), { idx: 20 }) : C("agent", aw.p, flow(f, [
        [790, { expr: "stern", facing: 1, armR: AR.downR }],
        [796, { expr: "stern", facing: 1, armR: AR.liftR, armRFront: true, propR: "grapeBrick", propK: 0 }, 10],                     // picks up a brick
        [814, { expr: "stare", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "grapeBrick", propK: 1, mouth: talk(f, 816, 866), headTilt: 4 }, 8],  // reads it out loud
        [868, { expr: "blank", facing: 1, armR: AR.downR, armRFront: true }, 8],                                                    // puts it back
        [882, { expr: "calm", facing: 1, armR: AR.tipHatR, armRFront: true }, 6],                                                   // tips his hat
      ]), { idx: 20 })] : []),
    ],
    fx: fxs(
      f >= 668 && f < 712 ? dustTrail("car", [2.7, 0, 30 - 36 * sm(f, 668, 700)], [0, 1], f, 6, 0.8 * (1 - sm(f, 700, 712)), 0.8) : null,
      f >= 868 && f < 882 ? dustCard("putback", add3(MK(s, "agentTable"), 0.55, 0.95, 0), 0.45, 0.6 * (1 - (f - 868) / 14), 4) : null,
    ),
    focus: f < 718 ? add3(CROWD_P[2], 0, 1.3, 0) : [aw.p[0], 1.3, aw.p[2]],
    subj: f < 718 ? "town3" : "agent",
  };
};
lens(582, 5, 1); lens(640, 3, 24); lens(718, 5, 30);

// =====================================================================================================================
// SHOT 4 (893-958) = H8, Washington (hard cut 2): the lawyer winds up and slams LEGAL on the ruling ("legal"), push to
// the paper (object dissolve to the kitchen shelf).
SHOT_CAMS[4] = (s) => { const p = MK(s, "paper");
  void p; return [K(889, F(() => ({ pos: [0.35, 1.42, 2.3] as V3, look: [0, 1.0, -0.4] as V3, fov: 40 }), 889, 0.002, [[936, 0.02, 22]]))]; };   // object dissolve in (table bricks -> the ruling), axial push on the slam
SHOT_ACTS[4] = (f, s) => ({
  ctl: { fan: 1 },
  cast: [C("lawyer", MK(s, "lawyer"), flow(f, [
    [893, { expr: "stern", facing: 1, armR: AR.holdR, armRFront: true, propR: "legalStamp", propK: 1 }],
    [912, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1, tilt: -4 }, 8],   // wind-up (held)
    [934, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1, tilt: 6 }, 2],     // SLAM
  ]), { idx: 1 })],
  fx: fxs(legalMark(add3(MK(s, "paper"), 0, 0.01, 0.05), f, 935), f >= 935 && f < 945 ? bang(add3(MK(s, "paper"), 0.25, 0.25, 0), f - 935) : null),
  focus: f < 934 ? [0, 1.3, -1.05] : MK(s, "paper"),
  subj: "lawyer",
});
KICKS.push([935 / 30, 0.6]); lens(893, 5, 1);

// =====================================================================================================================
// SHOT 5 (958-1485) = H9-H12, the kitchen. H9 958-1104: from the shelf (object match with the stamped paper) the bricks
// pop off one by one ("fly off the shelves"); pull back as the serviceman steps in the door, sets up the jug, steam puff
// (time jump), corks a bottle. G4 1100-1130 glide to Mum. H10 1130-1282 the explanation (deep-blue night): "That's the
// trick" (taps the brick), NO-wine stamp, the 200 GALLONS counter while she counts on her fingers; the kid listens. G5
// 1275-1300 rides Mum to the pantry. H11 1300-1390 doors open on the jugs, the calendar flips to 21, she shrugs.
// Hard cut 3 at 1392: the kid at the stove holds up the CAKE MIX box, winks on "350"; push to the box (object dissolve).
const SVC = (s: SetDef): V3[] => [MK(s, "serviceIn"), [2.4, 0, 0.6], MK(s, "serviceJug")];
const MUM5: V3 = [-0.55, 0, -1.08];
const MUM_P: V3 = [1.5, 0, -1.08], KID5: V3 = [-1.25, 0, -0.45], KIDC: V3 = [1.95, 0, -0.72];
SHOT_CAMS[5] = (s) => {
  const shelf = MK(s, "shelf"), SJ = MK(s, "serviceJug");
  const h9a = fit([[shelf, -0.05, 0.25, 0.75], body(MUM5, 0.9, 2.0, 0.3)], 10, 4, 40, 0.86);                         // bricks fly off the shelf
  const h12 = fit([body(SJ), body(MUM5), body(KID5, 0, 1.6, 0.3)], 8, 8, 46, 0.88);                                  // the serviceman, Mum, the kid
  const h13 = fit([body(MUM5, 0, 2.0, 0.4), body(KID5, 0, 1.6, 0.4)], 15, 6, 42, 0.82);                              // explanation two-shot
  const h11 = fit([body(MUM_P), body(KIDC, 0, 1.6, 0.32), [[2.7, 0, -1.9], 0, 2.95, 0.75]], -6, 4, 42, 0.86);         // pantry + calendar, the kid walks in
  const bx: V3 = [KIDC[0] + 0.2, 1.0, KIDC[2] + 0.15];
  const S9a = F(() => h9a, 958, 0.0018), S12 = F(() => h12, 1040, 0.0014), S13 = F(() => h13, 1140, 0.0011), S11 = F(() => h11, 1315, 0.0012);
  return [
    K(958, S9a),
    K(1000, glideTo(S9a, 1000, S12, 1040), 1),          // pull back as the serviceman comes in (mostly axial)
    K(1100, glideTo(S12, 1100, S13, 1140), 1),          // ease in to Mum and the kid
    K(1275, glideTo(S13, 1275, S11, 1315), 1),          // follow Mum to the pantry
    K(1452, glideTo(S11, 1452, () => { const e = S11(1452); return { pos: lerp3(bx, e.pos, 0.42), look: bx, fov: e.fov ?? 42 }; }, 1490), 1),   // push (mostly axial) to the cake-mix box
  ];
};
SHOT_ACTS[5] = (f, s) => {
  const sv0 = along(SVC(s), 0.09, 1003, f), sv1 = along([MK(s, "serviceJug"), [2.4, 0, 0.6], [3.6, 0, 1.3], [5.8, 0, 1.3]], 0.065, 1104, f), sv = f < 1104 ? sv0 : sv1, mw = along([MUM5, MUM_P], 0.11, 1277, f), kw = along([KID5, KIDC], 0.05, 1330, f);
  const bottle = f >= 1080;
  return {
    ctl: { shelf: f < 964 ? 6 : 6 - Math.min(6, Math.floor((f - 964) / 5)), jugWater: f >= 1030 && f < 1080 ? 1 : 0, jugFill: f >= 1080 ? 0 : sm(f, 1046, 1066), jugHide: f < 1030 || f >= 1080 ? 1 : 0,
      cupboard: f < 1300 ? 0 : sm(f, 1306, 1320), day: f < 1300 ? 1 : dayFlip(f, 1322, 1346), jugGlow: 0 },
    cast: [
      ...(f >= 1000 && f < 1200 ? [sv.moving ? C("service", sv.p, pose(null, { expr: "beam", mode: "walk", phase: ph(f, 12), facing: screenSide(5, s, f, sv.d[0], sv.d[1]), ...(f < 1104 ? { armR: AR.carryR, armRFront: true, propR: "jug" } : { armR: AR.carryR, armRFront: true, propR: "wineBottle", propK: 1 }) }), { idx: 5 })   // walks in with the jug, out with the bottle
        : C("service", sv.p, flow(f, [
          [1030, { expr: "smile", facing: -1, armR: AR.downR, armRFront: true }],
          [1040, { expr: "smile", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick" }, 8],          // drops a brick in
          [1048, { expr: "proud", facing: -1, armR: AR.downR, armRFront: true }, 3],
          [1082, { expr: "beam", facing: 1, armR: AR.liftHiR, armRFront: true, propR: "wineBottle", propK: 1 }, 6],  // later: corked
        ]), { idx: 5 })] : []),
      C("mum20", mw.moving ? mw.p : f >= 1277 ? mw.p : MUM5, mw.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 11), facing: 1 }) : flow(f, [
        [958, { expr: "smile", facing: 1, look: 0.5 }],
        [1104, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 8],
        [1110, { expr: "smug", facing: 1, armR: AR.slapR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 3],          // "That's the trick."
        [1135, { expr: "stern", facing: 1, armR: [[26, -6], [36, -30]] as A2, armRFront: true }, 6],                                  // "bans selling wine"
        [1181, { expr: "eureka", facing: 1, armR: [[24, -10], [30, -40]] as A2, armRFront: true, armL: [[-24, -8], [-26, -36]] as A2, armLFront: true }, 8],   // counts it out
        [1230, { expr: "joy", facing: 1, armR: [[30, -8], [44, -34]] as A2, armRFront: true, armL: [[-30, -8], [-44, -34]] as A2, armLFront: true }, 8],
        [1300, { expr: "sly", facing: 1, armR: [[26, -10], [46, -16]] as A2, armRFront: true }, 6],                                   // opens the doors
        [1362, { expr: "smug", facing: -1, armR: AR.shrugR, armL: AR.shrugL, armRFront: true, armLFront: true, headTilt: 6 }, 8],     // "well, that's your juice"
      ]), { idx: 1 }),
      C("kid20", kw.p, kw.moving ? pose(null, { expr: "sly", mode: "walk", phase: ph(f, 10), facing: screenSide(5, s, f, kw.d[0], kw.d[1]), armR: AR.holdR, armRFront: true, propR: "cakeBox" }) : f < 1392 ? flow(f, [[958, { expr: "grin", facing: 1 }], [1135, { expr: "stare", facing: 1, look: -0.4 }, 6], [1230, { expr: "grin", facing: 1 }, 6]])
        : flow(f, [[1392, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox" }], [1463, { expr: "sly", facing: 1, armR: AR.holdR, armRFront: true, propR: "cakeBox", headTilt: 6, look: 0.6 }, 4]]), { idx: 2 }),
    ],
    fx: fxs(
      ...[0, 1, 2, 3, 4, 5].map((i) => { const a = 964 + i * 5; return f >= a && f < a + 12 ? sparkle("sh" + i, [-0.1 + i * 0.22, 1.66, -1.95], f - a, 0.22, "#e8c8ff") : null; }),
      f >= 1070 && f < 1092 ? dustCard("steam", [1.0, 1.3, -1.3], 1.6, 0.85 * Math.sin(Math.PI * (f - 1070) / 22), 5) : null,
      noWine("nw5", camPt(5, s, f, 2.6, 0.3, 0.62), f, 1132, 1146, 1178),
      gallons("gal", camPt(5, s, f, 2.2, 0.1, 0.42), f, 1180, 1276),
      f >= 1466 && f < 1484 ? sparkle("box350", [KIDC[0] + 0.2, 1.05, KIDC[2] + 0.2], f - 1466, 0.25, "#ffd27a") : null,
    ),
    focus: f < 1000 ? MK(s, "shelf") : f < 1100 ? [SVC(s)[2][0], 1.3, SVC(s)[2][2]] : f < 1277 ? [MUM5[0], 1.3, MUM5[2]] : f < 1392 ? [MUM_P[0], 1.3, MUM_P[2]] : [KIDC[0], 1.1, KIDC[2]],
    subj: f < 1000 ? "mum20" : f < 1100 ? "service" : f < 1405 ? "mum20" : "kid20",
  };
};
lens(958, 6, 1); lens(1000, 3, 30); lens(1100, 4, 30); lens(1275, 4, 30); lens(1458, 6, 20);

// =====================================================================================================================
// SHOT 6 (1485-1810) = H13-H15, the payoff at golden light (home base A). H13 1485-1552: from a grape cluster (object
// match with the cake-mix box) crane up: new vine rows rise out of every field ("almost double"). G6 1545-1575 down to
// Hank; H14 1575-1640 he kneels and plants a vine back. G7 1630-1665 rides the lawyer's walk to the gate. H15 1665-1810:
// she stands beside Brick Boy, stamps LEGAL on his brick on "lawyer"; the debate line; he lifts the brick until it fills
// half the frame (sparkle + glint); object dissolve to the glowing jug.
const LAW_W: V3[] = [[4.0, 0, -3.0], [6.0, 0, -8.6], [7.69, 0, -9.0]];
SHOT_CAMS[6] = (s) => {
  const row: V3 = [8.75, 0, 2.0], hk = HANK_Y(s), bb = MK(s, "bbGate");
  void row; const h13 = fit([[hk, 0.2, 1.45, 0.55]], 120, 20, 40, 0.86);                // close on Hank's hands and the vine (object match with the box)
  const h14 = fit([body(hk, 0, 1.6, 0.85)], 120, 20, 42, 0.86);                       // high over Hank replanting, new rows all round
  const h15 = { pos: [13.3, 1.75, -10.3] as V3, look: [8.2, 1.25, -9.75] as V3, fov: 42 };
  const brick: V3 = [bb[0], 1.27, bb[2] - 0.32], endLook: V3 = [bb[0] - 0.05, 1.45, bb[2] - 0.22];
  const S13 = F(() => h13, 1485, 0.001), S14 = F(() => h14, 1552, 0.0022), S15 = F(() => h15, 1630, 0.0012);
  void brick;
  return [
    K(1485, S13),
    K(1512, glideTo(S13, 1512, S14, 1552), 1),                                             // pull straight back: new rows rise all round
    K(1630, S15, 1, true),                                                                 // hard cut 4: the gate, the lawyer walks in
    K(1752, glideTo(S15, 1752, () => ({ pos: [endLook[0] + 2.1, endLook[1] + 0.1, endLook[2] - 0.05] as V3, look: endLook, fov: 36 }), 1808), 1),   // push to Brick Boy + the brick
  ];
};
SHOT_ACTS[6] = (f, s) => {
  const lwk = along(LAW_W, 0.085, 1560, f), bb = MK(s, "bbGate");
  return {
    ctl: { spread: sm(f, 1495, 1548), bricks: 21, agentCar: 1, press: 0 },
    cast: [
      C("hank", HANK_Y(s), flow(f, [
        [1485, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[20, 20], [24, 44]] as A2, armRFront: true, propR: "vineYank" } as P],
        [1588, { expr: "sheepish", facing: -1, mode: "kneel", kneelK: 1, armR: [[18, 28], [20, 54]] as A2, armRFront: true, propR: "vineYank", tilt: 8 } as P, 10],   // pushes it in
        [1612, { expr: "pained", facing: -1, mode: "kneel", kneelK: 1, armR: AR.hipR, sweat: 1 } as P, 8],
      ]), { idx: 2 }),
      C("brickBoy", bb, flow(f, [
        [1485, { expr: "smug", facing: -1, armR: AR.carryR, armRFront: true, propR: "grapeBrick" }],
        [1700, { expr: "proud", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1 }, 8],
        [1752, { expr: "sly", facing: -1, armR: AR.holdR, armRFront: true, propR: "grapeBrick", propK: 1, headTilt: 4 }, 12],   // lifts it to us
      ]), { idx: 1 }),
      lwk.moving ? C("lawyer", lwk.p, pose(null, { expr: "proud", mode: "walk", phase: ph(f, 11), facing: screenSide(6, s, f, lwk.d[0], lwk.d[1]), armR: AR.carryR, armRFront: true, propR: "legalStamp" }), { idx: 3 })
        : C("lawyer", lwk.p, flow(f, [
          [1600, { expr: "proud", facing: 1, armR: AR.carryR, armRFront: true, propR: "legalStamp" }],
          [1682, { expr: "determined", facing: 1, armR: AR.stampUp, armRFront: true, propR: "legalStamp", propK: 1 }, 8],
          [1700, { expr: "proud", facing: 1, armR: AR.stampDown, armRFront: true, propR: "legalStamp", propK: 1 }, 2],   // stamps his brick
          [1730, { expr: "smug", facing: 1, armR: AR.hipR, armL: AR.hipL }, 8],
        ]), { idx: 3 }),
    ],
    fx: fxs(
      f >= 1700 && f < 1712 ? bang([bb[0] - 0.3, 1.5, bb[2] + 0.1], f - 1700) : null,
      f >= 1770 && f < 1792 ? sparkle("glint", [bb[0], 1.38, bb[2] - 0.32], f - 1770, 0.4) : null,
      f >= 1772 ? glowBurst("pay" + Math.round(lin(f, 1772, 1810) * 6), [bb[0] - 0.1, 1.27, bb[2] - 0.32], 1.2, 0.5 * lin(f, 1772, 1790), "255,226,170") : null,
    ),
    focus: f < 1630 ? add3(HANK_Y(s), 0, 0.9, 0) : f < 1752 ? add3(bb, -0.5, 1.4, 0.4) : [bb[0], 1.35, bb[2] - 0.3],
    subj: f < 1630 ? "hank" : f < 1662 ? "brickBoy" : f < 1752 ? "lawyer" : "brickBoy",
  };
};
lens(1485, 7, 1); lens(1512, 3, 40); lens(1630, 5, 1); lens(1752, 6, 30);

// =====================================================================================================================
// SHOT 7 (1810-1930) = H16, the ending (calm, callback prop): the pantry jugs glow purple, the calendar reads 21, Mum
// pours herself a glass and sips with a calm smile; the camera pushes into the glowing jug on "And it all started...".
const MUM7: V3 = [1.1, 0, -1.05];
SHOT_CAMS[7] = (s) => {
  const h16 = fit([body(MUM7, 0, 2.0, 0.4), [[2.7, 0, -1.9], 0.1, 2.3, 0.7]], -10, 4, 42, 0.86), j: V3 = [2.7, 0.95, -1.9];
  const S16 = F(() => h16, 1810, 0.0018);
  return [K(1810, S16), K(1852, glideTo(S16, 1852, () => ({ pos: [j[0] - 0.25, j[1] + 0.12, j[2] + 0.75] as V3, look: j, fov: 40 }), 1930), 1)];   // push into the glowing jug
};
SHOT_ACTS[7] = (f, s) => ({
  ctl: { cupboard: 1, jugGlow: 0.6 + 0.4 * sm(f, 1810, 1860), day: 21, shelf: 0, jugHide: 1 },
  cast: [C("mum20", MUM7, flow(f, [
    [1810, { expr: "calm", facing: 1, armR: [[22, 10], [34, -6]] as A2, armRFront: true, propR: "juiceGlass" }],
    [1858, { expr: "smile_closed", facing: 1, armR: [[26, -4], [16, -30]] as A2, armRFront: true, armRTop: true, propR: "juiceGlass", headBack: 0.3 }, 10],   // sips
    [1884, { expr: "smug", facing: 1, armR: [[22, 10], [34, -6]] as A2, armRFront: true, propR: "juiceGlass", look: 0.4 }, 10],
  ]), { idx: 1 })],
  fx: [],
  focus: f < 1866 ? [MUM7[0], 1.4, MUM7[2]] : [2.7, 0.95, -1.9],
  subj: f < 1880 ? "mum20" : null,
});
lens(1810, 5, 1);

// PLACEHOLDER cameras until the scene files land (one static framing per shot id).
for (const id of [1, 2, 3, 4, 5, 6, 7]) if (!SHOT_CAMS[id]) {
  SHOT_CAMS[id] = (s) => [K(0, F(() => s.cams.main ?? { pos: [0, 2, 10] as V3, look: [0, 1, 0] as V3, fov: 40 }, 0, 0.0018))];
  SHOT_ACTS[id] = () => ({ ctl: {}, cast: [], fx: [], focus: [0, 1, 0], subj: null } as unknown as Act);
}

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
