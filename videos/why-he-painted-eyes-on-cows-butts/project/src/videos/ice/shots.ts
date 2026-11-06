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
// "Why He Painted Eyes on Cows' Butts": shared cast for the kraal (home base). One persistent herd that every kraal shot
// reads from (characters never vanish on a shot change), cows drawn in their REAR view whenever the camera is behind
// them (the painted eyes stare at the camera), otherwise in profile facing the way they stand on screen.
type Cow = { who: string; pos: V3; hd: number; painted: boolean };
const HERD: Cow[] = [
  { who: "cow0", pos: [-0.6, 0, 5.4], hd: Math.PI, painted: true },     // the hook cow: rump to the gate (camera side)
  { who: "cow1", pos: [3.0, 0, 3.4], hd: Math.PI / 2, painted: false },
  { who: "cow2", pos: [1.0, 0, 0.4], hd: -Math.PI / 2, painted: false },
  { who: "cow3", pos: [-3.6, 0, 3.0], hd: Math.PI, painted: true },
  { who: "cow4", pos: [-5.4, 0, -1.0], hd: Math.PI / 2, painted: false },
  { who: "cow5", pos: [2.6, 0, -3.4], hd: Math.PI, painted: false },
  { who: "cow6", pos: [5.4, 0, 0.4], hd: Math.PI, painted: true },
  { who: "cow7", pos: [-1.8, 0, -4.6], hd: Math.PI / 2, painted: false },
  { who: "cow8", pos: [5.2, 0, 4.8], hd: -Math.PI / 2, painted: false },
  { who: "cow9", pos: [-6.4, 0, 1.6], hd: Math.PI / 2, painted: true },  // the lion's cow: rump to the west fence / tall grass
  { who: "cow10", pos: [0.4, 0, -6.4], hd: -Math.PI / 2, painted: false },
  { who: "cow11", pos: [-3.2, 0, -2.8], hd: Math.PI, painted: false },
];
const herdOf = (who: string) => HERD.find((c) => c.who === who)!;
/** a cow card: rear view when the camera is behind her (within ~55 deg), else profile facing her heading on screen */
const cowC = (id: number, s: SetDef, f: number, cw: Cow, o: P = {}, extra: Partial<CastPlace> = {}, pos?: V3): CastPlace => {
  const p0 = pos ?? cw.pos, c = camAt(id, s, f), hx = Math.sin(cw.hd), hz = Math.cos(cw.hd);
  const vx = c.pos[0] - p0[0], vz = c.pos[2] - p0[2], L = Math.hypot(vx, vz) || 1, dt = (hx * vx + hz * vz) / L;
  const back = dt < -0.57;
  return C(cw.who, p0, pose(null, { expr: "neutral", ...o, back, facing: back ? (o.facing ?? 1) : screenSide(id, s, f, hx, hz) }), { idx: 200 + HERD.indexOf(cw), scale: 1.7, ...extra });
};
/** the whole herd (minus `skip`), each with a slow idle (grazing heads dip in and out on their own timers) */
const herdCast = (id: number, s: SetDef, f: number, skip: string[] = [], over: Record<string, P> = {}, paint: Record<string, number> = {}): CastPlace[] =>
  HERD.filter((c) => !skip.includes(c.who)).map((c, i) => {
    const g = (f + i * 53) % 180, graze = c.hd === Math.PI ? 0 : 25 * (sm(g, 20, 34) * (1 - sm(g, 110, 124)));
    return cowC(id, s, f, c, { tilt: graze, paintK: paint[c.who] ?? (c.painted ? 1 : 0), ...(over[c.who] ?? {}) });
  });
// the pole fence the farmers sit on: top rail y = 1.02 at z = 10.6. Sitting cards stand 0.1 m in front of the rail.
const RAIL_Y = 0.92, RAIL_Z = 10.75;
const FENCE: Record<string, V3> = { fmBig: [-6.4, RAIL_Y, RAIL_Z], fmThin: [-4.9, RAIL_Y, RAIL_Z], fmAunt: [-3.4, RAIL_Y, RAIL_Z], fmTall: [-1.9, RAIL_Y, RAIL_Z] };
const BOARD_P: V3 = [4.4, 1.55, 9.03];
/** chalk number on the tally board (a card on the slate face) */
const boardNum = (n: string, a = 1): FxSpec => ({ kind: "card", key: "bd" + n + "_" + Math.round(a * 10), pos: [BOARD_P[0], BOARD_P[1] - 0.27, BOARD_P[2] + 0.12], w: 0.8, h: 0.5, flat: false, cw: 320, ch: 200,
  draw: (p) => { const g = p.g; g.globalAlpha = a; g.font = "900 150px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(250,248,240,0.95)"; g.fillText(n, 160, 104);
    g.strokeStyle = "rgba(250,248,240,0.5)"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40 + i * 8, 186 - i * 3); g.lineTo(80 + i * 8, 190 - i * 3); g.stroke(); } g.globalAlpha = 1; } });
/** a white smoke puff from a rifle shot (age in frames) */
const shotPuff = (pos: V3, age: number): FxSpec[] => age < 0 || age > 26 ? [] : [0, 1, 2].map((i) => ({ kind: "card", key: "smk" + i + "_" + Math.round(age / 2), pos: [pos[0] + i * 0.18 + age * 0.01, pos[1] + age * 0.012 + i * 0.05, pos[2]], w: 0.3 + age * 0.03 + i * 0.1, h: 0.3 + age * 0.03 + i * 0.1, soft: true, cw: 96, ch: 96,
  draw: (p) => { const g = p.g; g.globalAlpha = Math.max(0, 1 - age / 26); g.fillStyle = "#f4f2ee"; g.beginPath(); g.arc(48, 52, 36, 0, 7); g.fill(); g.fillStyle = "#d8d6e0"; g.beginPath(); g.arc(40, 62, 22, 0, 7); g.fill(); g.globalAlpha = 1; } }) as FxSpec);
void herdOf;

// =====================================================================================================================
// SHOT 1 (0-222) = SCENE 1, the kraal at golden morning, one continuous camera path (hook + "You see," + the problem):
// "A guy saved a bunch of lions by painting eyes on cows' butts. You see, in Botswana, lions kept eating the cows, so the
// farmers kept shooting the lions." Frame 1: low two-shot, the hero mid-stroke on the second giant eye of cow0's rump
// while she looks back over her shoulder; the eye is finished on "butts". "You see": the camera cranes up and back over
// the thorn ring (huts, acacias, the farmers on the fence); a lion slinks out of the tall grass toward the west fence and
// the cows there shuffle away; "shooting": the big farmer on the fence swings his rifle up, BANG (smoke), the lion bolts
// back into the grass. Ends looking west into the low sun (light dissolve into the sunset riverbank).
const HERO1: V3 = [0.12, 0, 6.05];
const LION1 = (f: number) => {
  if (f < 140) return { p: [-16.5, 0, -1.6] as V3, mode: "stride", ph: 0, facing: 1, expr: "sly" as Face };
  if (f < 197) { const k = sm(f, 140, 196); return { p: lerp3([-16.5, 0, -1.6], [-10.6, 0, 0.9], k), mode: "stride", ph: ((f - 140) / 26) % 1, facing: 1, expr: "sly" as Face }; }
  const k = sm(f, 200, 222); return { p: lerp3([-10.6, 0, 0.9], [-17.5, 0, -2.6], k), mode: f < 200 ? "stride" : "walk", ph: ((f - 200) / 9) % 1, facing: -1, expr: "shock" as Face };
};
SHOT_CAMS[1] = () => [
  K(0, FS(() => ({ pos: [0.1, 1.3, 10.6] as V3, look: [-0.15, 1.2, 5.6] as V3, fov: 40 }), 0, 0.0024, 0.0016, [[84, 0.006, 10]])),
  K(100, F((f) => { const k = sm(f, 100, 150); return { pos: lerp3([1.6, 3.2, 15.4], [2.6, 5.0, 17.4], k), look: lerp3([-1.0, 1.2, 3.0], [-3.0, 0.8, 1.0], k), fov: 44 }; }, 100, 0.0012), 50),
  K(146, F((f) => { const k = sm(f, 146, 196), lp = LION1(f).p; return { pos: lerp3([-0.6, 4.2, 15.0], [-3.2, 3.0, 13.8], k), look: [lp[0] + 2.4, 0.9, lp[2] + 1.6] as V3, fov: 42 }; }, 146, 0.0014), 40),
  K(182, F((f) => { const k = sm(f, 182, 222); return { pos: lerp3([-4.0, 4.4, 15.8], [-4.6, 4.2, 15.6], k), look: lerp3([-8.6, -0.6, 4.4], [-10.0, -0.4, 2.8], k), fov: 44 }; }, 182, 0.0018), 22),
];
SHOT_ACTS[1] = (f, s) => {
  const stroke = Math.sin(f * 0.42), lion = LION1(f);
  const scat = (who: string, dx: number) => { const c = herdOf(who), k = sm(f, 150, 176); return cowC(1, s, f, c, { ...flow(f, [[0, { expr: "neutral" }], [149, { expr: "aghast" }, 2]]), mode: f > 150 && f < 176 ? "walk" : "stand", phase: ((f - 150) / 14) % 1 }, {}, [c.pos[0] + dx * k, 0, c.pos[2]]); };
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(1, s, f, ["cow0", "cow9", "cow4"]),
      scat("cow9", 2.2), scat("cow4", 1.8),
      cowC(1, s, f, herdOf("cow0"), flow(f, [
        [0, { expr: "neutral", paintK: 0.5, facing: -1 }],
        [62, { expr: "sheepish", paintK: 0.5, facing: -1 }],                       // she feels the second eye going on
        [80, { expr: "sheepish", paintK: 1, facing: -1 }, 2],
      ])),
      C("picasso", HERO1, flow(f, [
        [0, { expr: "determined", facing: -1, tilt: 6, armL: [[-28, 4 + 3 * stroke], [-52, 6 + 10 * stroke]] as A2, armLFront: true, propL: "paintbrush", propK: 1, propLAng: -0.3 + 0.25 * stroke, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }],
        [84, { expr: "smug", facing: -1, tilt: 0, headTilt: 6, armL: [[-22, 4], [-26, -26]] as A2, armLFront: true, propL: "paintbrush", propK: 1, propLAng: -0.2, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }, 10],   // steps back, admires it
        [176, { expr: "nervous", facing: -1, look: -0.8, armL: [[-22, 4], [-26, -26]] as A2, armLFront: true, propL: "paintbrush", propK: 1, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }, 8],
      ]), { idx: 1 }),
      C("fmBig", FENCE.fmBig, flow(f, [
        [0, { mode: "sit", expr: "bored", facing: -1, look: -0.4, armR: [[20, 20], [34, 30]] as A2, armRFront: true, propR: "rifle", propK: 0 }],
        [150, { mode: "sit", expr: "angry", facing: -1, look: -1, armR: [[20, 20], [34, 30]] as A2, armRFront: true, propR: "rifle", propK: 0 }],
        [178, { mode: "sit", expr: "strain", facing: -1, tilt: -6, armL: [[-24, 4], [-40, 0]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI, armR: [[-16, 10], [-34, 6]] as A2, armRFront: true }, 10], // aims
        [198, { mode: "sit", expr: "shock", facing: -1, tilt: 4, armL: [[-22, -2], [-36, -10]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI + 0.25 }, 2],          // BANG (kick)
        [206, { mode: "sit", expr: "angry", facing: -1, armL: [[-24, 4], [-40, 0]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI }, 6],
      ]), { idx: 10 }),
      C("fmThin", FENCE.fmThin, flow(f, [[0, { mode: "sit", expr: "neutral", facing: -1, look: -0.6 }], [152, { mode: "sit", expr: "shock", facing: -1, look: -1 }], [200, { mode: "sit", expr: "aghast", facing: -1, armR: [[16, -6], [8, -30]] as A2 }, 4]]), { idx: 11 }),
      C("fmAunt", FENCE.fmAunt, flow(f, [[0, { mode: "sit", expr: "smile", facing: -1, look: -0.5 }], [152, { mode: "sit", expr: "nervous", facing: -1, look: -1 }], [200, { mode: "sit", expr: "shock", facing: -1, armR: [[14, 4], [6, -20]] as A2, armRFront: true }, 4]]), { idx: 12 }),
      C("fmTall", FENCE.fmTall, flow(f, [[0, { mode: "sit", expr: "bored", facing: -1, look: -0.5 }], [154, { mode: "sit", expr: "stare", facing: -1, look: -1 }], [201, { mode: "sit", expr: "yikes", facing: -1 }, 4]]), { idx: 13 }),
      C("lion", lion.p, { ...flow(f, [[0, { expr: "sly" }], [199, { expr: "shock", sweat: 1 }, 2]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 80 && f < 96 ? sparkle("eye1", [-0.25, 1.0, 5.6], f - 80, 0.34) : null,
      shotPuff([-7.4, 1.35, 10.6], f - 198),
      f >= 198 && f < 210 ? glowBurst("muz" + (f - 198), [-7.3, 1.32, 10.65], 0.6, 1 - (f - 198) / 12, "255,236,180") : null,
      f > 200 ? dustTrail("ld", [lion.p[0], 0, lion.p[2]], [-1, -0.4], f, 5, 0.9, 0.6) : null,
      f >= 212 ? glowBurst("sun1_" + Math.round(lin(f, 212, 222) * 8), [-28, 4.5, -6], 14 * lin(f, 212, 222) + 2, lin(f, 212, 222), "255,214,150") : null,
    ),
    focus: f < 100 ? [0, 1.1, 5.6] : f < 186 ? [-9, 0.8, 1.5] : [-6.4, 1.4, 10.6],
    subj: f < 100 ? "picasso" : f < 186 ? "lion" : "fmBig",
  };
};
KICKS.push([198 / 30, 0.8]);
lens(0, 7, 1); lens(100, 0, 30); lens(190, 4, 14);

// =====================================================================================================================
// SHOT 2 (222-342) = SCENE 2, the riverbank at sunset (light dissolve in the sun glare): "Then one evening, he sees an
// antelope spot a sneaking lion, and the lion just quits." The hero sits on a termite mound with binoculars (right, near);
// the camera slides along the reeds to the impala grazing and the lion creeping up behind it; "spot": the impala's head
// comes up and turns to stare straight back at the lion; the lion freezes mid-step, sits, sighs and slinks away; the
// hero lowers the binoculars (eureka). The camera pushes into the impala's staring eye (shape match into the painted eye).
const MOUND: V3 = [-42.5, 1.32, -29.5];
const IMP: V3 = [-55.0, 0, -39.0];
const LION2 = (f: number) => {
  if (f < 290) { const k = sm(f, 222, 290); return { p: lerp3([-47.6, 0, -34.4], [-51.6, 0, -37.0], k), mode: "stride", ph: ((f - 222) / 24) % 1, facing: -1, expr: "sly" as Face }; }
  if (f < 316) return { p: [-51.6, 0, -37.0] as V3, mode: f < 300 ? "stride" : "sit", ph: 0.32, facing: -1, expr: (f < 300 ? "shock" : "dismay") as Face };
  const k = sm(f, 318, 342); return { p: lerp3([-51.6, 0, -37.0], [-48.8, 0, -33.6], k), mode: "walk", ph: ((f - 318) / 12) % 1, facing: 1, expr: "dismay" as Face };
};
SHOT_CAMS[2] = () => [
  K(222, F((f) => { const k = sm(f, 222, 300); return { pos: lerp3([-39.6, 2.9, -25.6], [-45.4, 2.0, -30.2], k), look: lerp3([-47.6, 1.2, -35.0], [-52.8, 0.9, -37.6], k), fov: 44 }; }, 222, 0.0012)),
  K(318, (f) => { const k = sm(f, 318, 342); return { pos: lerp3([-50.6, 1.3, -34.8], [-54.35, 1.18, -38.25], k), look: [IMP[0] + 0.04, 1.16, IMP[2]] as V3, fov: lerp(38, 26, k) }; }, 18),
];
SHOT_ACTS[2] = (f, s) => {
  const lion = LION2(f);
  return {
    ctl: { night: 0, fire: 0, smoke: 0 },
    cast: [
      C("picasso", MOUND, flow(f, [
        [222, { mode: "sit", expr: "stare", facing: -1, armR: [[-14, -14], [-6, -40]] as A2, armRTop: true, armL: [[-26, -10], [-14, -40]] as A2, armLTop: true, propR: "binoculars" }],
        [300, { mode: "sit", expr: "shock", facing: -1, armR: [[-14, -14], [-6, -40]] as A2, armRTop: true, armL: [[-26, -10], [-14, -40]] as A2, armLTop: true, propR: "binoculars" }, 4],
        [326, { mode: "sit", expr: "eureka", facing: -1, armR: [[-24, 6], [-34, -26]] as A2, armRFront: true, propR: "binoculars", armL: [[-20, 20], [-10, 40]] as A2 }, 8], // lowers them, finger up
      ]), { idx: 1 }),
      C("impala", IMP, flow(f, [
        [222, { expr: "neutral", facing: -1, tilt: 25 }],
        [266, { expr: "neutral", facing: -1, tilt: 0 }, 6],
        [273, { expr: "stare", facing: -1, look: -1 }, 4],                 // spots the lion: stares straight back
      ]), { idx: 31, scale: 1.25 }),
      C("lion", lion.p, { ...flow(f, [[222, { expr: "sly" }], [276, { expr: "aghast", sweat: 1 }, 2], [302, { expr: "dismay", sweat: 0 }, 6]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f < 232 ? glowBurst("sun2_" + Math.round(lin(f, 222, 232) * 8), [-60, 4, -48], 16 - 12 * lin(f, 222, 232), 1 - lin(f, 222, 232), "255,190,120") : null,
      f >= 300 && f < 314 ? squiggles("sigh", [lion.p[0] - 0.3, 1.5, lion.p[2]], f, "#ffffff", 0.3) : null,
      f >= 328 && f < 342 ? sparkle("idea", [MOUND[0] - 0.45, MOUND[1] + 2.1, MOUND[2]], f - 328, 0.3) : null,
    ),
    focus: f < 318 ? [-51, 1, -37] : [IMP[0], 1.16, IMP[2]],
    subj: f < 300 ? "lion" : "impala",
  };
};
lens(222, 3, 10); lens(318, 9, 16);

// =====================================================================================================================
// SHOT 3 (342-720) = SCENE 3, the kraal on a bright morning (home base, the long scene): "So he grabs a paintbrush and
// paints giant eyes on the butt of every third cow. "He's giving the cows makeup!" One farmer laughs, then the whole fence
// laughs, and by lunch he's Butt Picasso. Even the cows look embarrassed. But why would a lion care about a butt?"
// Opens on the fresh painted eye (shape match from the impala's eye), pulls back to the hero finishing cow3's second eye,
// trucks along the herd (a painted rump every third cow), swings out to the farmers on the fence: the big farmer points
// and shouts, laughs alone, then the whole fence + the kids laugh together; the aunt holds up a BUTT PICASSO sign; the
// painted cows look back over their shoulders, embarrassed (sweat); ends framing the tally board where the hero now
// stands, thinking, with the tall grass far behind (time-jump crossfade into the same framing at night).
const HERO3A: V3 = [-4.3, 0, 3.75], HERO_GATE: V3 = [0.7, 0, 8.6], HERO_BOARD: V3 = [3.55, 0, 9.65];
const KIDS: Record<string, V3> = { kid1: [-0.3, 0, 11.9], kid2: [0.5, 0, 12.15] };
const heroWalk3 = (f: number) => {
  if (f < 432) return { p: HERO3A, moving: false, d: [1, 0] as [number, number] };
  if (f < 640) { const w = along([HERO3A, [-0.6, 0, 7.0], HERO_GATE], 0.11, 432, f); return { p: w.p, moving: w.moving, d: w.d }; }
  const w = along([HERO_GATE, HERO_BOARD], 0.07, 640, f); return { p: w.p, moving: w.moving, d: w.d };
};
SHOT_CAMS[3] = () => [
  K(342, (f) => ({ pos: [-3.28, 0.95, 4.05] as V3, look: [-3.28, 0.92, 3.0] as V3, fov: 26 + 0 * f })),
  K(348, F(() => ({ pos: [-3.2, 1.5, 6.9] as V3, look: [-4.0, 1.15, 2.6] as V3, fov: 42 }), 348, 0.0014), 50),
  K(408, FS(() => ({ pos: [2.6, 1.8, 10.6] as V3, look: [1.8, 1.0, 2.4] as V3, fov: 46 }), 408, 0.0012, 0.004, [], 430), 40),
  K(452, FS(() => ({ pos: [0.2, 1.8, 16.8] as V3, look: [-4.9, 1.35, 10.3] as V3, fov: 46 }), 452, 0.0016, -0.0022, [[505, 0.005, 10], [544, 0.006, 12]], 520), 36),
  K(584, F(() => ({ pos: [-1.2, 1.7, 14.3] as V3, look: [-3.3, 1.75, 10.6] as V3, fov: 40 }), 584, 0.002, [[598, 0.006, 10]]), 18),
  K(614, FS(() => ({ pos: [-0.9, 1.45, 9.9] as V3, look: [-2.0, 1.0, 3.9] as V3, fov: 42 }), 614, 0.0018, 0.003, [], 640), 22),
  K(656, F(() => ({ pos: [7.6, 1.75, 14.2] as V3, look: [2.6, 1.25, 8.0] as V3, fov: 42 }), 656, 0.0018), 40),
];
const laughFace = (f: number, a: number, who: number): P => ({ expr: "laugh", shake: 1, tilt: -6 + 3 * Math.sin((f - a) * 0.9 + who), headBack: 0.6 });
SHOT_ACTS[3] = (f, s) => {
  const hw = heroWalk3(f), stroke = Math.sin(f * 0.42);
  const sitF = (who: string, beats: [number, P, number?][], idx: number) => C(who, FENCE[who], flow(f, beats.map(([a, o, b]) => [a, { mode: "sit", facing: -1, ...o }, ...(b ? [b] : [])] as Beat)), { idx });
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(3, s, f, ["cow3", "cow0"], {}, {}),
      cowC(3, s, f, herdOf("cow3"), flow(f, [[342, { expr: "neutral", paintK: 0.5 }], [392, { expr: "stare", paintK: 0.5 }], [400, { expr: "stare", paintK: 1 }, 2], [624, { expr: "sheepish", paintK: 1, sweat: 1 }, 4]])),
      cowC(3, s, f, herdOf("cow0"), flow(f, [[342, { expr: "neutral", facing: -1 }], [624, { expr: "sheepish", facing: -1, sweat: 1 }, 4]])),
      C("picasso", hw.p, hw.moving ? pose(null, { mode: "walk", phase: ph(f, 14), facing: screenSide(3, s, f, hw.d[0], hw.d[1]), expr: f < 640 ? "proud" : "smug", armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }) : flow(f, [
        [342, { expr: "determined", facing: 1, tilt: -5, armR: [[26, -6 + 4 * stroke], [44, -14 + 12 * stroke]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.3 - 0.25 * stroke, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }],
        [362, { expr: "determined", facing: 1, tilt: -10, armR: [[14, 20], [10, 44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 8],  // dips the brush
        [380, { expr: "determined", facing: 1, tilt: -5, armR: [[26, -6 + 4 * stroke], [44, -14 + 12 * stroke]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.3 - 0.25 * stroke, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 8],
        [402, { expr: "proud", facing: 1, tilt: 0, headTilt: -5, armR: [[20, 8], [26, -24]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 10],
        [640, { expr: "smug", facing: 1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }, 8],
        [672, { expr: "calm", facing: -1, look: -0.8, armR: [[18, 4], [10, -22]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }, 10],   // looks out at the herd, thinking
      ]), { idx: 1 }),
      sitF("fmBig", [
        [342, { expr: "bored", look: -0.6 }],
        [462, { expr: "grin", mouth: talk(f, 463, 492), headTilt: 4 * Math.sin(f * 0.5), armR: [[-26, -4], [-50, -18]] as A2, armRFront: true }, 6],   // "He's giving the cows makeup!"
        [503, { ...laughFace(f, 503, 0) }, 4],                                                                                                       // one farmer laughs
        [598, { expr: "joy", armR: [[-24, 10], [-36, 30]] as A2 }, 8],
      ], 10),
      sitF("fmThin", [[342, { expr: "neutral", look: -0.6 }], [470, { expr: "smile", look: -0.6 }], [542, { ...laughFace(f, 542, 1) }, 4], [600, { expr: "grin" }, 8]], 11),
      sitF("fmAunt", [[342, { expr: "smile", look: -0.6 }], [470, { expr: "sly", look: -0.6 }], [542, { ...laughFace(f, 542, 2) }, 4],
        [588, { expr: "joy", armR: [[18, -30], [10, -66]] as A2, propR: "picassoSign", armL: [[-18, -30], [-10, -66]] as A2 }, 8]], 12),        // holds up BUTT PICASSO
      sitF("fmTall", [[342, { expr: "bored", look: -0.6 }], [470, { expr: "stare", look: -0.6 }], [543, { ...laughFace(f, 543, 3), expr: "guffaw" }, 4], [600, { expr: "grin" }, 8]], 13),
      ...Object.entries(KIDS).map(([who, p], i) => C(who, p, flow(f, [[342, { expr: "smile", facing: -1 }], [547, { ...laughFace(f, 547, 4 + i), armR: [[-20, -10], [-40, -24]] as A2, armRFront: true }, 4], [604, { expr: "grin", facing: -1 }, 8]]), { idx: 20 + i })),
      C("lion", [-14.2, 0, 1.0], pose(null, { mode: "kneel", expr: "sly", facing: 1 }), { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 400 && f < 416 ? sparkle("eye3", [-3.28, 0.95, 3.1], f - 400, 0.34) : null,
      f >= 588 && f < 604 ? sparkle("sign", [-3.4, 3.05, 10.8], f - 588, 0.3, "#ffffff") : null,
    ),
    focus: f < 408 ? [-3.4, 1.0, 3.2] : f < 452 ? [1.8, 1.0, 2.4] : f < 614 ? [-3.9, 1.6, 10.6] : f < 660 ? [-1.8, 1.0, 4.4] : [3.6, 1.5, 9.6],
    subj: f < 408 ? "picasso" : f < 452 ? null : f < 614 ? "fmThin" : f < 660 ? null : "picasso",
  };
};
lens(342, 9, 1); lens(348, 5, 40); lens(408, 1, 20); lens(452, 4, 20); lens(614, 6, 16); lens(660, 3, 24);

// =====================================================================================================================
// SHOT 4 (720-783) = SCENE 4, the same framing at night (time-jump crossfade): "Every night, he counts the herd. Sixty-two."
// Lantern in hand, he counts the cows with a finger, then chalks 62 on the tally board; the camera pushes onto the board.
SHOT_CAMS[4] = () => [
  K(720, F(() => ({ pos: [7.6, 1.75, 14.2] as V3, look: [2.6, 1.25, 8.0] as V3, fov: 42 }), 656, 0.0018)),
  K(762, (f) => { const k = sm(f, 762, 783); return { pos: lerp3([6.6, 1.7, 12.9], [5.5, 1.62, 11.5], k), look: lerp3([3.6, 1.35, 8.6], [4.4, 1.38, 9.0], k), fov: lerp(40, 34, k) }; }, 14),
];
SHOT_ACTS[4] = (f, s) => ({
  ctl: { night: 1, fire: 1, smoke: 0.6 },
  cast: [
    ...herdCast(4, s, f, ["cow1"]),
    C("cow1", herdOf("cow1").pos, pose(null, { expr: "sleep", facing: 1 }), { idx: 201, scale: 1.7 }),
    C("picasso", HERO_BOARD, flow(f, [
      [720, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, -2], [-48, -12]] as A2, armRFront: true }],
      [744, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, -6], [-48, -20]] as A2, armRFront: true }, 4],   // counting: the finger moves on
      [752, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, 2], [-46, -2]] as A2, armRFront: true }, 4],
      [760, { expr: "smile", facing: 1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }, 6], // chalks 62
    ]), { idx: 1 }),
    ...["fmBig", "fmThin", "fmAunt", "fmTall"].map((w, i) => C(w, [FENCE[w][0], 0, 12.4 + 0.3 * i] as V3, pose(null, { expr: "sleep", facing: -1, mode: "sit" }), { idx: 10 + i })).slice(0, 0),
  ],
  fx: fxs(f >= 764 ? boardNum("62", lin(f, 764, 770)) : null, zzz([3.0, 1.9, 3.4], f)),
  focus: [4.0, 1.5, 9.3],
  subj: f < 762 ? "picasso" : null,
});
lens(720, 3, 1); lens(762, 6, 16);

// =====================================================================================================================
// SHOT 5 (783-1032) = SCENE 5, the kraal next morning (through the board: 62 -> 61): "Then one morning, sixty-one. The
// farmers fall off the fence laughing. "Nice work, Picasso!" He just walks over and checks. The missing cow had no eyes.
// "Trust the eyes."" The board: he wipes the 2 and chalks 61; the camera swings to the fence: all four topple backwards off
// the rail, laughing, legs in the air; the big farmer points from the ground; the hero walks into the kraal to the empty
// spot (cow1, a plain cow, is gone), kneels, checks his notebook; the plain cows go nervous; he stands and lifts a finger.
const HERO5_SPOT: V3 = [3.55, 0, 4.7];
const fallOff = (who: string, f: number, a: number, idx: number, talkA = 0, talkB = 0): CastPlace => {
  const base = FENCE[who], k = sm(f, a, a + 12), land: V3 = [base[0] + 0.15, 0, base[2] + 0.95];
  const p = lerp3(base, land, k);
  const body: P = f < a ? { mode: "sit", facing: -1, shake: 1, headBack: 0.6, tilt: -6 + 3 * Math.sin((f - a) * 0.9 + idx) }
    : { mode: "sit", facing: -1, tilt: -78 * sm(f, a, a + 9), feetUp: sm(f, a, a + 9), shake: f > a + 9 ? 1 : 0, headBack: 0.6 };     // tips back off the rail
  const face = flow(f, [[783, { expr: "laugh" }], [a, { expr: "eureka" }, 2], [a + 10, { expr: "guffaw", mouth: talkB ? talk(f, talkA, talkB) : undefined }, 4]]);
  return C(who, p, { ...face, ...body, mouth: face.mouth }, { idx });
};
SHOT_CAMS[5] = () => [
  K(783, F(() => ({ pos: [5.5, 1.62, 11.5] as V3, look: [4.4, 1.38, 9.0] as V3, fov: 34 }), 783, 0.0014)),
  K(812, FS(() => ({ pos: [0.2, 1.8, 16.8] as V3, look: [-4.9, 1.15, 10.6] as V3, fov: 46 }), 812, 0.0016, -0.002, [[836, 0.006, 10]], 860), 30),
  K(908, F((f) => { const k = sm(f, 908, 950); return { pos: lerp3([7.0, 1.75, 13.6], [0.8, 1.6, 8.4], k), look: lerp3([2.4, 1.1, 7.0], [3.4, 0.9, 4.6], k), fov: 42 }; }, 908, 0.0014), 30),
  K(952, FS(() => ({ pos: [0.6, 1.35, 7.0] as V3, look: [3.5, 0.95, 4.5] as V3, fov: 40 }), 952, 0.0022, 0.0015, [[1008, 0.007, 10]], 990), 24),
];
/** hero kneel window [a, b): eases down over 9 f, back up over the last 10 f; returns the fields to merge into the pose */
const kneelIn = (f: number, a: number, b: number): Partial<FigOpts> | null =>
  f >= a && f < b ? { mode: "kneel", kneelK: Math.min(sm(f, a, a + 9), 1 - sm(f, b - 10, b)) } : null;
SHOT_ACTS[5] = (f, s) => {
  const walk = along([HERO_BOARD, [2.9, 0, 7.0], HERO5_SPOT], 0.12, 912, f);
  const nervous = (who: string): P => ({ ...flow(f, [[783, { expr: "neutral" }], [982 + who.length, { expr: "nervous", sweat: 1 }, 4]]) });
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(5, s, f, ["cow1"], { cow2: nervous("cow2"), cow8: nervous("cow8"), cow5: nervous("cow5") }),
      C("picasso", f < 912 ? HERO_BOARD : walk.p, { ...(f >= 912 && walk.moving ? pose(null, { mode: "walk", phase: ph(f, 14), facing: screenSide(5, s, f, walk.d[0], walk.d[1]), expr: "stare", armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "notebook" }) : flow(f, [
        [783, { expr: "calm", facing: 1, armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }],
        [792, { expr: "calm", facing: 1, armR: [[26, -6], [50, -14]] as A2, armRFront: true, propR: "chalk" }, 5],     // wipes the 2
        [799, { expr: "stare", facing: 1, armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }, 4],    // chalks 61
        [912, { expr: "stare", facing: -1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "notebook" }, 6],
        [952, { expr: "stare", facing: -1, mode: "kneel", look: -0.4, armR: [[16, 10], [10, -12]] as A2, armRFront: true, propR: "notebook" }, 8],   // kneels at the empty spot
        [980, { expr: "smug", facing: -1, mode: "kneel", armR: [[16, 10], [10, -12]] as A2, armRFront: true, propR: "notebook" }, 4],                 // no eyes
        [998, { expr: "smug", facing: 1, mode: "stand", armR: [[20, -16], [12, -46]] as A2, armRFront: true, armL: [[-18, 20], [-26, 40]] as A2, propL: "notebook" }, 10],   // stands, finger up
        [1006, { expr: "sly", facing: 1, mode: "stand", mouth: talk(f, 1007, 1030), armR: [[20, -16], [12, -46]] as A2, armRFront: true, armL: [[-18, 20], [-26, 40]] as A2, propL: "notebook" }, 3], // "Trust the eyes."
      ])), ...kneelIn(f, 955, 1006) }, { idx: 1 }),
      fallOff("fmBig", f, 834, 10, 873, 905), fallOff("fmThin", f, 838, 11), fallOff("fmAunt", f, 842, 12), fallOff("fmTall", f, 846, 13),
      ...Object.entries(KIDS).map(([who, p], i) => C(who, p, flow(f, [[783, { expr: "smile", facing: -1 }], [826, { ...laughFace(f, 826, 4 + i) }, 4], [900, { expr: "grin", facing: -1 }, 8]]), { idx: 20 + i })),
    ],
    fx: fxs(
      boardNum(f < 796 ? "62" : f < 800 ? "6" : "61", f >= 796 && f < 800 ? 1 : 1),
      f >= 800 && f < 814 ? sparkle("chalk", [BOARD_P[0] + 0.2, BOARD_P[1] - 0.1, BOARD_P[2] + 0.05], f - 800, 0.22, "#ffffff") : null,
      [0, 1, 2, 3].flatMap((i) => f >= 842 + i * 4 && f < 870 + i * 4 ? [dustCard("fall" + i, [FENCE[["fmBig", "fmThin", "fmAunt", "fmTall"][i]][0], 0.25, 11.9], 1.1, 0.8 * (1 - (f - 842 - i * 4) / 28), i)] : []),
      f >= 982 && f < 1000 ? bang([3.2, 2.5, 4.2], f - 982) : null,
    ),
    focus: f < 812 ? [4.4, 1.4, 9.0] : f < 908 ? [-3.9, 0.8, 11.2] : [3.4, 0.9, 4.6],
    subj: f < 812 ? null : f < 908 ? "fmThin" : "picasso",
  };
};
lens(783, 6, 1); lens(812, 3, 24); lens(952, 6, 20);

// =====================================================================================================================
// SHOT 6 (1032-1296) = SCENE 6, the kraal at night, the climax (time-jump crossfade, same framing as the end of shot 5):
// "The next night, another plain cow disappears. The farmers stop laughing. Then a lion creeps up on a painted cow, sees
// two huge eyes staring back, and slowly backs away." The hero keeps watch with a lantern; behind him a plain cow (cow7)
// is yanked off backwards through the west gap into the dark (dust). The farmers at the fence with lanterns: grins drop.
// The camera glides west: the lion creeps out of the grass through the gap toward cow9's rump; over the lion's shoulder
// the two painted eyes fill the frame; hard cut to the lion's face: eyes go huge, sweat; it backs away step by step into
// the grass and the camera rides with it (dissolve hidden in the grass blades into the explanation).
const LION6 = (f: number) => {
  if (f < 1140) return { p: [-15.5, 0, 0.9] as V3, mode: "kneel", ph: 0, facing: 1, expr: "sly" as Face, sweat: 0, lift: 0 };
  if (f < 1196) { const k = sm(f, 1140, 1196); return { p: lerp3([-15.5, 0, 0.9], [-9.6, 0, 1.4], k), mode: "stride", ph: ((f - 1140) / 30) % 1, facing: 1, expr: "sly" as Face, sweat: 0, lift: 0 }; }
  if (f < 1262) return { p: [-9.6, 0, 1.4] as V3, mode: "kneel", ph: 0, facing: 1, expr: (f < 1214 ? "sly" : "shock") as Face, sweat: f >= 1222 ? 1 : 0, lift: 0 };
  const k = sm(f, 1262, 1296); return { p: lerp3([-9.6, 0, 1.4], [-14.6, 0, 1.0], k), mode: "stride", ph: 1 - (((f - 1262) / 34) % 1), facing: 1, expr: "shock" as Face, sweat: 1, lift: 0 };
};
/** 1 = full crouch, 0 = stalking (only read in stride mode) */
const LION6_CK = (f: number) => f < 1196 ? Math.max(1 - sm(f, 1140, 1150), sm(f, 1186, 1196)) : 1 - sm(f, 1262, 1272);
const COW9_RUMP: V3 = [herdOf("cow9").pos[0], 0, herdOf("cow9").pos[2]];
SHOT_CAMS[6] = () => [
  K(1032, F(() => ({ pos: [0.6, 1.35, 7.0] as V3, look: [3.5, 0.95, 4.5] as V3, fov: 40 }), 952, 0.0022)),
  K(1046, FS(() => ({ pos: [1.4, 1.8, 7.3] as V3, look: [-3.0, 0.9, -3.0] as V3, fov: 46 }), 1046, 0.0012, -0.002, [], 1070), 30),
  K(1092, FS(() => ({ pos: [0.2, 1.8, 16.6] as V3, look: [-4.9, 1.35, 10.6] as V3, fov: 46 }), 1092, 0.0018, 0.002, [[1109, 0.006, 10]], 1110), 22),
  K(1136, F((f) => { const lp = LION6(f).p; return { pos: [lp[0] + 1.6, 1.25, lp[2] + 5.4] as V3, look: [lp[0] + 0.9, 0.75, lp[2]] as V3, fov: 42 }; }, 1136, 0.0012), 1, true),   // "Then, a lion" (hard cut 2 f before "Then,"; the old 30 f blend flew through the farmers)
  K(1196, F(() => ({ pos: [-12.3, 1.05, 1.9] as V3, look: [-6.0, 0.95, 1.6] as V3, fov: 40 }), 1196, 0.0026, [[1228, 0.007, 12]]), 1, true),   // over the lion's shoulder (hard cut: the blend crossed the thorn fence)
  K(1216, F(() => ({ pos: [-11.8, 1.1, 4.8] as V3, look: [-9.4, 0.95, 1.4] as V3, fov: 34 }), 1216, 0.0028), 1, true),       // reaction close-up (hard cut)
  K(1260, F((f) => { const k = sm(f, 1260, 1296); return { pos: lerp3([-7.0, 1.3, 4.6], [-11.4, 1.0, 4.4], k), look: lerp3([-9.8, 0.8, 1.4], [-14.6, 0.7, 0.9], k), fov: 42 }; }, 1260, 0.0012), 14),
];
SHOT_ACTS[6] = (f, s) => {
  const lion = LION6(f), yank = sm(f, 1074, 1084);
  const c7 = herdOf("cow7"), c7p = lerp3(c7.pos, [-10.6, 0, -0.3], yank);
  const lanternF = (who: string, i: number): CastPlace => C(who, [FENCE[who][0] + 0.2 * i, 0, 11.35 + 0.15 * (i % 2)] as V3, flow(f, [
    [1032, { expr: "grin", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern" }],
    [1080 + i, { expr: "shock", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern" }, 3],
    [1106 + i, { expr: "dismay", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern", sweat: 1 }, 4],   // they stop laughing
    [1150, { expr: "stare", facing: -1, look: -1, armR: [[18, 4], [28, -12]] as A2, armRFront: true, propR: "lantern" }, 8],
  ]), { idx: 10 + i });
  return {
    ctl: { night: 1, fire: 1, smoke: 0.6 },
    cast: [
      ...herdCast(6, s, f, ["cow1", "cow7", "cow9"], { cow2: { expr: "nervous", sweat: 1 }, cow5: { expr: "nervous", sweat: 1 } }),
      ...(f < 1084 ? [cowC(6, s, f, c7, { ...flow(f, [[1032, { expr: "sleep" }], [1071, { expr: "aghast" }, 2]]), mode: f > 1072 ? "walk" : "stand", phase: ((f - 1072) / 6) % 1 }, {}, c7p)] : []),
      cowC(6, s, f, herdOf("cow9"), flow(f, [[1032, { expr: "sleep" }], [1200, { expr: "neutral" }], [1252, { expr: "smug" }]])),   // she never even woke up properly
      C("picasso", HERO5_SPOT, flow(f, [
        [1032, { expr: "calm", facing: 1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[20, 20], [26, 40]] as A2 }],
        [1078, { expr: "stare", facing: -1, look: -1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern" }, 6],
      ]), { idx: 1 }),
      lanternF("fmBig", 0), lanternF("fmThin", 1), lanternF("fmAunt", 2), lanternF("fmTall", 3),
      C("lion", lion.p, { ...flow(f, [[1032, { expr: "sly" }], [1214, { expr: "aghast", sweat: 1 }, 2]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing, crouchK: LION6_CK(f) }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 1076 && f < 1100 ? [0, 1].map((i) => dustCard("yank" + i, [c7.pos[0] - 3 - i * 1.5, 0.6, c7.pos[2] - 0.6], 1.6, 0.9 * (1 - (f - 1076) / 24), i + 2)) : null,
      f >= 1226 && f < 1252 ? bang([-9.4, 2.55, 1.4], f - 1226) : null,
    ),
    focus: f < 1092 ? [3.4, 1.0, 4.6] : f < 1136 ? [-3.9, 1.5, 11.2] : f < 1196 ? lion.p : f < 1216 ? COW9_RUMP : [-9.4, 1.25, 1.4],
    subj: f < 1046 ? "picasso" : f < 1092 ? null : f < 1136 ? "fmBig" : null,
  };
};
lens(1032, 6, 1); lens(1046, 2, 20); lens(1092, 4, 16); lens(1136, 3, 1); lens(1196, 7, 12); lens(1216, 9, 1); lens(1260, 4, 20);

// =====================================================================================================================
// SHOT 7 (1296-1500) = SCENE 7, the explanation in its own place and light: the tall grass at deep-blue night (the camera
// came in with the backing lion). "That's the trick. A lion is an ambush hunter, and it only attacks something that isn't
// looking. The second it thinks it's been spotted, the hunt is over." The camera slides low through the grass: the lion
// crouched at the edge of a clearing, sly, tail flicking; an impala grazes with its back to it; the lion creeps one step;
// the impala's head snaps round and stares; the lion freezes mid-step, one paw in the air; its face drops (paw frozen,
// position match into the kid's frozen hand).
const L7A: V3 = [-16.4, 0, -1.2], L7B: V3 = [-17.4, 0, -1.9], IMP7: V3 = [-21.6, 0, -4.4];
SHOT_CAMS[7] = () => [
  K(1296, F((f) => { const k = sm(f, 1296, 1360); return { pos: lerp3([-11.4, 1.4, 4.6], [-12.2, 1.7, 2.6], k), look: lerp3([-15.6, 0.7, -0.6], [-19.6, 0.9, -3.4], k), fov: 42 }; }, 1296, 0.0012)),
  K(1372, FS(() => ({ pos: [-12.4, 1.7, 2.4] as V3, look: [-19.8, 0.9, -3.6] as V3, fov: 44 }), 1372, 0.0016, -0.002, [], 1420), 30),
  K(1438, F((f) => { const k = sm(f, 1438, 1500); return { pos: lerp3([-14.4, 1.35, 1.8], [-14.9, 1.15, 0.9], k), look: lerp3([-18.4, 0.85, -2.6], [-17.6, 0.75, -1.9], k), fov: lerp(42, 34, k) }; }, 1438, 0.002, [[1475, 0.006, 10]]), 22),
];
SHOT_ACTS[7] = (f) => {
  const step = sm(f, 1392, 1430), lp = lerp3(L7A, L7B, step), rise = f >= 1386 && f < 1400;
  return {
    ctl: { night: 1, fire: 0, smoke: 0 },
    cast: [
      C("lion", lp, { ...flow(f, [
        [1296, { mode: "kneel", expr: "sly", facing: -1 }],
        [1340, { mode: "kneel", expr: "sly", facing: -1, tilt: 3 }, 8],                         // ambush hunter: low, still, tail flicking
        [1390, { mode: "stride", expr: "sly", facing: -1, phase: 0.1 + 0.5 * step }, 8],       // creeps one step
        [1436, { mode: "stride", expr: "shock", facing: -1, phase: 0.6, lift: 1 }, 3],         // spotted: freezes, paw in the air
        [1474, { mode: "stride", expr: "dismay", facing: -1, phase: 0.6, lift: 1, sweat: 1 }, 6],  // the hunt is over
      ]), ...(rise ? { mode: "stride" as FigOpts["mode"], crouchK: 1 - sm(f, 1386, 1398) } : {}) }, { idx: 30, scale: 1.75 }),
      C("impala", IMP7, flow(f, [
        [1296, { expr: "neutral", facing: -1, tilt: 25 }],
        [1432, { expr: "neutral", facing: -1, tilt: 0 }, 4],
        [1437, { expr: "stare", facing: -1, look: -1 }, 3],
      ]), { idx: 31, scale: 1.25 }),
    ],
    fx: fxs(f >= 1438 && f < 1460 ? bang([-21.4, 2.2, -4.4], f - 1438) : null),
    focus: f < 1438 ? lp : [-17.3, 0.7, -1.8],
    subj: null,
  };
};
lens(1296, 6, 1); lens(1372, 4, 20); lens(1438, 7, 24);

// =====================================================================================================================
// SHOT 8 (1500-1590) = SCENE 8, the kitchen (position match: the lion's frozen paw -> the kid's frozen hand): "Ever try to
// sneak a cookie while your mom's staring right at you? Same thing." The kid on the stool, hand at the cookie jar, sly;
// mum steps into the doorway and stares; the kid freezes (sweat), then slowly pulls the hand back with a guilty grin.
const KID: V3 = [0.6, 0.42, -1.18], MUM: V3 = [2.2, 0, 1.0];
SHOT_CAMS[8] = () => [
  K(1500, F(() => ({ pos: [0.2, 1.85, 0.45] as V3, look: [0.45, 1.7, -1.6] as V3, fov: 34 }), 1500, 0.0016)),
  K(1512, FS(() => ({ pos: [1.5, 1.62, 4.9] as V3, look: [1.5, 1.3, -0.5] as V3, fov: 48 }), 1512, 0.0018, 0.0016, [[1546, 0.007, 10]], 1550), 30),
];
SHOT_ACTS[8] = (f) => {
  const mw = along([[3.9, 0, 1.3], MUM], 0.05, 1526, f);
  return {
    ctl: {},
    cast: [
      C("pjKid", KID, flow(f, [
        [1500, { expr: "sly", facing: -1, armR: [[10, -30], [14, -68]] as A2, armRFront: true, look: -0.6 }],
        [1544, { expr: "shock", facing: 1, look: 1, armR: [[10, -30], [14, -68]] as A2, armRFront: true, sweat: 1 }, 2],    // caught
        [1572, { expr: "sheepish", facing: 1, look: 1, armR: [[10, -10], [4, -30]] as A2, armRFront: true, sweat: 1 }, 10], // slowly pulls back
      ]), { idx: 40 }),
      C("mum", mw.p, mw.moving ? pose(null, { mode: "walk", phase: ph(f, 13), facing: -1, expr: "neutral" }) : flow(f, [
        [1528, { expr: "neutral", facing: -1 }],
        [1538, { expr: "stare", facing: -1, armR: [[-16, 12], [4, 28]] as A2, armL: [[16, 12], [-4, 28]] as A2, armRFront: true, armLFront: true }, 6],  // arms crossed, staring
        [1576, { expr: "stern", facing: -1, armR: [[-16, 12], [4, 28]] as A2, armL: [[16, 12], [-4, 28]] as A2, armRFront: true, armLFront: true, headTilt: -6 }, 6],
      ]), { idx: 41 }),
    ],
    fx: [],
    focus: f < 1530 ? [0.6, 1.9, -1.5] : [1.6, 1.5, -0.2],
    subj: "pjKid",
  };
};
lens(1500, 7, 1); lens(1512, 4, 24);

// =====================================================================================================================
// SHOT 9 (1590-1740) = SCENE 9, the payoff (hard cut on "Four years"): "Four years and two thousand cows later, the painted
// ones lost to lions? Zero. The plain ones? Fifteen." Bright day on the open plain: a giant painted rump fills the right
// half of the frame, then the camera cranes up over a sea of cows walking away, every rump eye staring back at us, to the
// lion sulking on a kopje; down to the hero holding up a slate: 0 (painted eyes) with a burst of light, and the big farmer
// beside him: 15 (plain cow).
const PAY_HERO: V3 = [40.2, 0, -4.4], PAY_BIG: V3 = [41.4, 0, -6.2];
/** a big chalk slate card held over the head (readable from the payoff framing), pops in over 8 frames */
const slateCard = (n: string, eyes: boolean, pos: V3, k: number): FxSpec => ({ kind: "card", key: "slate" + n + "_" + Math.round(k * 8), pos: [pos[0], pos[1] + 0.1 * (1 - k), pos[2]], w: 0.95 * (0.6 + 0.4 * k), h: 0.8 * (0.6 + 0.4 * k), cw: 300, ch: 252,
  draw: (p) => { const g = p.g; g.globalAlpha = Math.min(1, k * 1.5); g.fillStyle = "#8a5a32"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, 284, 236, 18); g.fill(); g.stroke();
    g.fillStyle = "#2e3a38"; g.fillRect(30, 30, 240, 192); g.font = "900 120px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fbf8f0"; g.fillText(n, eyes ? 112 : 108, 128);
    if (eyes) { for (const x of [205, 245]) { g.fillStyle = "#fbf8f0"; g.beginPath(); g.ellipse(x, 120, 18, 12, 0, 0, 7); g.fill(); g.fillStyle = "#19b7b0"; g.beginPath(); g.arc(x, 121, 7, 0, 7); g.fill(); } }
    else { g.fillStyle = "#c8875a"; g.beginPath(); g.ellipse(225, 128, 32, 20, 0, 0, 7); g.fill(); g.fillStyle = "#fbf8f0"; g.fillRect(190, 140, 70, 6); }
    g.globalAlpha = 1; } });
const PAYHERD: { who: string; p: V3; painted: boolean; ph: number }[] = (() => {
  const out: { who: string; p: V3; painted: boolean; ph: number }[] = []; let i = 0;
  for (let x = 44; x <= 92; x += 3.6) for (let z = -16; z <= 16; z += 3.4) { const j = rnd1(i * 7.1), k = rnd1(i * 3.3, 41.7);
    if (Math.abs(z - 9) < 4 && Math.abs(x - 66) < 5) { i++; continue; }
    out.push({ who: "cow" + (i % 12), p: [x + (j - 0.5) * 2.2, 0, z + (k - 0.5) * 2.2], painted: rnd1(i, 91.3) < 0.72, ph: rnd1(i, 17.1) }); i++; }
  return out;
})();
SHOT_CAMS[9] = () => [
  K(1590, F(() => ({ pos: [34.2, 1.15, 1.4] as V3, look: [44.0, 1.35, 0.6] as V3, fov: 44 }), 1590, 0.0022), 1, true),
  K(1608, F((f) => { const k = sm(f, 1608, 1680); return { pos: lerp3([34.0, 2.2, 1.0], [33.0, 10.5, -2.0], k), look: lerp3([46.0, 1.4, 0.6], [62.0, 0.8, 6.0], k), fov: 46 }; }, 1608, 0.001), 40),
  K(1680, FS(() => ({ pos: [36.6, 1.7, -9.6] as V3, look: [40.9, 1.5, -4.9] as V3, fov: 40 }), 1686, 0.0018, 0.0022, [[1696, 0.008, 12], [1728, 0.007, 10]], 1712), 24),
];
SHOT_ACTS[9] = (f, s) => {
  const big: CastPlace = C("cow0", [37.4, 0, 1.6], pose(null, { back: true, facing: -1, expr: "smug", paintK: 1 }), { idx: 299, scale: 1.7 });
  return {
    ctl: { night: 0, fire: 0, smoke: 0, dust: 1 },
    cast: [
      big,
      ...PAYHERD.map((c, i) => { const walk = rnd1(i, 5.5) < 0.4; const dx = walk ? 0.04 * (f - 1590) : 0;
        return C(c.who, [c.p[0] + dx, 0, c.p[2]], pose(null, { back: true, facing: i % 2 ? 1 : -1, expr: "neutral", paintK: c.painted ? 1 : 0, mode: walk ? "walk" : "stand", phase: walk ? ((f + c.ph * 30) / 16) % 1 : 0 }), { idx: 300 + i, scale: 1.7 }); }),
      C("lion", [66.2, 1.6, 9.0], flow(f, [[1590, { mode: "lie", expr: "dismay", facing: -1 }], [1700, { mode: "lie", expr: "sheepish", facing: -1, sweat: 1 }, 6]]), { idx: 30, scale: 1.75 }),
      C("picasso", PAY_HERO, flow(f, [
        [1590, { expr: "smug", facing: 1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }],
        [1690, { expr: "proud", facing: 1, armR: [[18, -18], [20, -50]] as A2, armL: [[-18, -18], [-20, -50]] as A2 }, 8],      // Zero. (slate card above)
      ]), { idx: 1 }),
      C("fmBig", PAY_BIG, flow(f, [
        [1590, { expr: "stare", facing: -1, look: 0.6 }],
        [1708, { expr: "sheepish", facing: -1, sweat: 1, armR: [[18, -18], [20, -50]] as A2, armL: [[-18, -18], [-20, -50]] as A2 }, 8],   // Fifteen. (slate card above)
      ]), { idx: 10 }),
    ],
    fx: fxs(
      f >= 1694 && f < 1716 ? glowBurst("zero" + Math.round(lin(f, 1694, 1716) * 10), [PAY_HERO[0] + 0.2, 2.3, PAY_HERO[2]], 2.8, Math.sin(lin(f, 1694, 1716) * Math.PI), "255,246,200") : null,
      f >= 1696 ? [0, 1, 2, 3].map((i) => sparkle("z" + i, [PAY_HERO[0] - 0.6 + i * 0.4, 2.0 + 0.4 * (i % 2), PAY_HERO[2] + 0.2], (f - 1696 - i * 3) % 18, 0.3)) : null,
      f >= 1690 ? slateCard("0", true, [PAY_HERO[0], 2.55, PAY_HERO[2] + 0.05], lin(f, 1690, 1698)) : null,
      f >= 1708 ? slateCard("15", false, [PAY_BIG[0], 2.5, PAY_BIG[2] + 0.05], lin(f, 1708, 1716)) : null,
      f >= 1722 ? [0, 1].map((i) => dustCard("dd" + i, [44 + i * 3, 0.8, -1 + i * 2], 3.4, lin(f, 1722, 1740) * 0.9, i + 1)) : null,
    ),
    focus: f < 1608 ? [37.4, 1.0, 1.6] : f < 1686 ? [60, 1, 4] : [41.0, 1.6, -3.4],
    subj: f < 1686 ? null : "picasso",
  };
};
lens(1590, 4, 1); lens(1608, 0, 30); lens(1686, 4, 20);

// =====================================================================================================================
// SHOT 10 (1740-1857) = SCENE 10, the ending at the kraal in golden afternoon light (dissolve inside the herd's dust):
// "And Butt Picasso? Now the whole village is lining up for a paint job." The farmers (the big one first) queue at the gate,
// each leading a plain cow; the big farmer hands over his cow's rope, sheepish; the hero, proud, lifts the brush -> a calm
// close-up of his changed face with the next rump ready (loops into the hook).
const Q: V3[] = [[0.0, 0, 11.3], [-1.7, 0, 11.9], [-3.4, 0, 12.5], [-5.1, 0, 13.1]];
SHOT_CAMS[10] = () => [
  K(1740, F((f) => { const k = sm(f, 1740, 1790); return { pos: lerp3([5.8, 4.4, 23.0], [4.8, 2.4, 18.6], k), look: lerp3([-0.6, 1.0, 10.6], [0.0, 1.2, 10.6], k), fov: 44 }; }, 1740, 0.0012)),
  K(1796, FS(() => ({ pos: [3.15, 1.45, 13.0] as V3, look: [1.85, 1.35, 9.5] as V3, fov: 36 }), 1796, 0.0022, 0.0012, [[1819, 0.005, 10]], 1826), 30),
];
SHOT_ACTS[10] = (f, s) => {
  const lead = (who: string, cow: string, i: number): CastPlace[] => {
    const p = Q[i], cp: V3 = [p[0] - 0.5, 0, p[2] + 1.1];
    return [
      C(who, p, flow(f, [
        [1740, { expr: "sheepish", facing: 1, armL: [[-20, 14], [-36, 22]] as A2, armLFront: true, sweat: i === 0 ? 1 : 0 }],
        [1760 + i * 4, { expr: i === 0 ? "sheepish" : "smile", facing: 1, armR: [[20, 10], [40, 6]] as A2, armRFront: true, sweat: i === 0 ? 1 : 0 }, 10],  // offers the rope
      ]), { idx: 10 + i }),
      C(cow, cp, pose(null, { expr: i === 0 ? "sheepish" : "neutral", facing: 1, tilt: i % 2 ? 0 : 6 }), { idx: 240 + i, scale: 1.7 }),
    ];
  };
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(10, s, f, ["cow1", "cow7", "cow2", "cow5", "cow8", "cow10"]),
      ...lead("fmBig", "cow2", 0), ...lead("fmThin", "cow5", 1), ...lead("fmAunt", "cow8", 2), ...lead("fmTall", "cow10", 3),
      C("picasso", [1.75, 0, 9.55], flow(f, [
        [1740, { expr: "smug", facing: -1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }],
        [1792, { expr: "smile", facing: -1, armR: [[22, -10], [24, -44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }, 10],   // lifts the brush
        [1816, { expr: "proud", facing: -1, headTilt: 6, armR: [[22, -10], [24, -44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.15, armL: [[-10, 30], [4, 46]] as A2, propL: "paintPot" }, 6],
      ]), { idx: 1 }),
    ],
    fx: fxs(
      f < 1754 ? [0, 1].map((i) => dustCard("dd" + i, [3 + i * 2.5, 0.8, 12 + i], 2.4, (1 - lin(f, 1740, 1754)) * 0.85, i + 1)) : null,
      f >= 1819 && f < 1835 ? sparkle("brush", [2.35, 2.55, 9.7], f - 1819, 0.3) : null,
    ),
    focus: f < 1796 ? [3.6, 1.2, 10.6] : [1.8, 1.6, 9.6],
    subj: f < 1796 ? null : "picasso",
  };
};
lens(1740, 2, 1); lens(1796, 6, 24);

// PLACEHOLDER cameras until the scene files land (one static framing per shot id).
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) if (!SHOT_CAMS[id]) {
  SHOT_CAMS[id] = (s) => [K(0, F(() => s.cams.main ?? { pos: [0, 2, 10] as V3, look: [0, 1, 0] as V3, fov: 40 }, 0, 0.0018))];
  SHOT_ACTS[id] = () => ({ ctl: {}, cast: [], fx: [], focus: [0, 1, 0], subj: null } as unknown as Act);
}

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
