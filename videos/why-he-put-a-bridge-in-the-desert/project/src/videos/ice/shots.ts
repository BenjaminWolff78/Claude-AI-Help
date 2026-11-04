// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "Why He Put a Bridge in the Desert", set-local coordinates,
// absolute frames. Master prompt v10.7: 9 scenes = 9 shot ids, each ONE continuous camera path in one place and time;
// two home bases (A: the desert bridge, scenes 1/5/6/9; B: the sales office, scenes 3/7/8); characters never vanish on
// a scene change and every pose change is blended (03_flow.ts); something new happens on every spoken phrase; 5
// dissolves of 8 f (into 2, 3, 4, 5, 7) + 3 hard cuts (6, 8, 9: time jumps); every camera path is checked by qa_run.mjs.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, run, DOF } from "./story";
import POSES from "./poses.json";
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
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? MOUTHS[Math.floor(f / 4) % MOUTHS.length] : undefined);
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
// Every change of pose is BLENDED: numbers and arm offsets interpolate over `blend` frames, discrete fields (expr, mode,
// props) switch at the half-way point, so an action always ends in the pose the next one starts from.
import { ACT } from "./acting";
import { desertBossCar, desertDozer, desertWagon, desertWagonSeats, desertBoat, desertWagonCam } from "./sets/desert";
import { worldmapShip, worldmapBoss, worldmapTrack, SHIP_U } from "./sets/worldmap";
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
  return pose(null, mixO(beats[i - 1][1], beats[i][1], sm(f, beats[i][0], beats[i][0] + bl)));
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
void desertWagon; void desertBoat; void worldmapShip; void worldmapBoss; void worldmapTrack; void SHIP_U; void desertDozer; void desertWagonSeats; void desertBossCar; void ACT;

// =====================================================================================================================
// SCENE 1 (0-316) HOME BASE A, the bridge site + one continuous flight over the town to the sales office.
// "A man put a bridge in the desert, then dug a river under it. You see, he'd built a whole town in the Arizona desert,
//  and the sign said, 'Population: three hundred.' It was so hot his salesmen were selling sand."
// Frame 1: the boss beams beside the dry centre arch while the bulldozer bites the sand under it. On "You see" he walks
// to his red convertible and hops in; the camera rises over the bridge and chases the car past the POPULATION 300 town
// sign (he points at it) and the 110 thermometer to the office, where one salesman pours sand out of his shoe and the
// other offers a jar of sand. The agent runs out waving the newspaper (London's bridge for sale): push into the photo.
const B_ARCH: V3 = [-8.2, 0, -11.5];
const B_DOOR_SIDE: V3 = [-12.85, 0, -9.25];
const carU = (f: number) => lin(f, 136, 256);
const D_OFF = (p: V3): V3 => [40 - p[0], p[1], 110.85 - p[2]]; // office-local -> desert set space
const SALES_A: V3 = D_OFF([-1.6, 0.02, 5.5]), SALES_B: V3 = D_OFF([3.1, 0.02, 5.5]);
/** the boss's walk from his parked car around its nose to the office door (scene 1 end -> scene 2) */
const B_WALK_IN: V3[] = [[35.6, 0.1, 102.7], [38.0, 0.1, 103.5], [38.95, 0.02, 104.9]];
/** the agent runs out of the office door with the newspaper */
const A_OUT: V3[] = [[40.4, 0, 110.6], [39.6, 0, 108.2], [39.75, 0.02, 106.15]];
const boss1 = (f: number, s: SetDef): CastPlace => {
  if (f < 96) {
    return C("boss", B_ARCH, flow(f, [
      [0, { expr: "beam", facing: 1, armR: [[30, 20], [44, 40]], armRFront: true }],
      [16, { expr: "proud", facing: 1, ...PZ.pointRUp }],                        // "...a bridge"
      [44, { expr: "beam", facing: 1, armR: [[30, 20], [44, 40]], armRFront: true }],
      [54, { expr: "sly", facing: 1, ...PZ.pointR, headTilt: -4 }],             // "...dug a river under it"
      [86, { expr: "proud", facing: -1, armR: [[26, 30], [30, 52]] }],
    ]), { idx: 1 });
  }
  if (f < 124) { const w = walkPath(1, s, [B_ARCH, B_DOOR_SIDE], f, 96, 124);
    return C("boss", w.p, pose(null, { mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, expr: "proud" }), { idx: 1 }); }
  const car = desertBossCar(carU(f));
  if (f < 134) { const k = sm(f, 124, 134); // hop over the door into the driver seat
    return C("boss", lerp3([B_DOOR_SIDE[0], 0.25 * Math.sin(k * Math.PI) * 4, B_DOOR_SIDE[2]], car.driver, k), pose(null, { mode: k < 0.6 ? "hop" : "sit", lift: 0.6 * Math.sin(k * Math.PI), expr: "beam", facing: -1 }), { idx: 1, air: true }); }
  if (f < 258) {
    const gest = sm(f, 178, 188) * (1 - sm(f, 212, 222));             // "the sign said, Population 300": points at the town sign
    return C("boss", car.driver, pose(null, { ...ACT.drive, expr: f > 180 && f < 220 ? "sly" : "beam", facing: -1,
      ...(gest > 0.05 ? { armR: [[26 + 10 * gest, 26 - 40 * gest], [30 + 40 * gest, 24 - 70 * gest]] as A2 } : {}), headTilt: 3 * Math.sin(f * 0.2) }), { idx: 1 });
  }
  if (f < 270) { const k = sm(f, 258, 270); // vaults over the passenger door onto the sidewalk
    return C("boss", lerp3(car.driver, B_WALK_IN[0], k), pose(null, { mode: k < 0.7 ? "hop" : undefined, lift: 0.5 * Math.sin(k * Math.PI), expr: "proud", facing: 1 }), { idx: 1, air: true }); }
  if (f < 302) { const w = walkPath(1, s, B_WALK_IN, f, 270, 300);
    const wave = f > 284 && f < 298; // waves the sand jar away
    return C("boss", w.p, pose(null, { mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, expr: wave ? "smug" : "proud",
      ...(wave ? { armL: [[-30, 6], [-50, -18 + 8 * Math.sin(f * 0.9)]] as A2 } : {}) }), { idx: 1 }); }
  return C("boss", B_WALK_IN[2], flow(f, [
    [302, { expr: "proud", facing: 1 }],
    [306, { expr: "stare", facing: 1, armR: [[28, 16], [52, 6]] as A2, armRFront: true }, 8],   // reaches for the paper
  ]), { idx: 1 });
};
const agent1 = (f: number, s: SetDef): CastPlace => {
  if (f < 284) return C("agent", A_OUT[0], pose(null, { expr: "neutral", facing: -1 }), { idx: 7 });
  if (f < 300) { const w = walkPath(1, s, A_OUT, f, 284, 300);
    return C("agent", w.p, pose(null, { ...ACT.paperWave, mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, mouth: talk(f, 286, 320) }), { idx: 7 }); }
  return C("agent", A_OUT[2], flow(f, [
    [300, { ...ACT.paperWave, facing: faceTo(1, s, f, A_OUT[2], B_WALK_IN[2]), mouth: talk(f, 286, 320) }],
    [304, { expr: "eureka", facing: faceTo(1, s, f, A_OUT[2], B_WALK_IN[2]), armR: [[28, 10], [46, -6]] as A2, armRFront: true, propR: "bridgePaper", mouth: talk(f, 286, 320) }, 8], // holds the photo up
  ]), { idx: 7 });
};
const salesmen1 = (f: number, s: SetDef, id: number): CastPlace[] => {
  const pour = f >= 288;
  return [
    C("salesA", SALES_A, flow(f, [
      [0, { expr: "dismay", sweat: 1, facing: -1, armR: [[28, 10], [26 + 6 * Math.sin(st(f, 2) * 0.9), -18]], armRFront: true }],
      [282, { ...ACT.pour, expr: "bored", sweat: 1, facing: -1, propK: pour ? 1 : 0 }],
    ], 8), { idx: 2 }),
    C("salesB", SALES_B, flow(f, [
      [0, { expr: "neutral", sweat: 0.6, facing: 1, armR: [[30, 30], [40, 46]], propR: "sandJar" }],
      [284, { ...ACT.jar, facing: faceTo(id, s, f, SALES_B, B_WALK_IN[1]) }],
      [300, { expr: "dismay", sweat: 0.6, facing: 1, ...PZ.shrug, propR: "sandJar" }],
    ], 8), { idx: 3 }),
  ];
};
SHOT_CAMS[1] = (s) => {
  const f1 = s.cams.frame1;
  const chase = (f: number) => {
    const car = desertBossCar(carU(f)), fw: V3 = [Math.sin(car.yaw), 0, Math.cos(car.yaw)];
    // follows 10 m behind, flies THROUGH arch 1 with the car (low, x -17 under the crown), then climbs over the town
    const back = 10, cz = car.pos[2] - fw[2] * back, low = clamp01(1 - (Math.abs(cz) - 8) / 9);
    const lat = -2.5 * (1 - 0.6 * (1 - low));
    const pos: V3 = [car.pos[0] - fw[0] * back + fw[2] * lat, lerp(6.2, 3.9, low), cz - fw[0] * lat];
    return { pos: [pos[0] - fw[0] * 2 * (1 - low), lerp(8.0, 3.9, low), pos[2] - fw[2] * 2 * (1 - low)] as V3, look: [car.pos[0] + fw[0] * lerp(3.5, 2.5, low), lerp(0.4, 1.6, low), car.pos[2] + fw[2] * lerp(3.5, 2.5, low)] as V3, fov: 42 };
  };
  return [
    K(0, F(() => ({ pos: f1.pos, look: [-4.6, 2.6, -3.5] as V3, fov: 40 }), 0, 0.0011, [[20, 0.003, 8], [66, 0.003, 10]])),
    K(92, F(() => fit([body(B_ARCH, 0, 2.1, 0.4), body(B_DOOR_SIDE, 0, 2.1, 0.4), body([-14.5, 0, -9.5], 0, 1.5, 1.6)], 214, 10, 42, 0.92), 92, 0.0016), 30),
    K(128, chase, 36),
    K(178, F(() => fit([[[22, 0, 36], 0.6, 4.8, 2.4], body(s.marks.painterGround, 0, 2.0, 0.42)], 236, 7, 42, 0.9), 178, 0.0016, [[196, 0.005, 10]]), 20), // the POPULATION 300 sign
    K(228, F(() => ({ pos: [33.2, 2.6, 91.5] as V3, look: [33.6, 2.0, 102.5] as V3, fov: 46 }), 228, 0.0018, [[244, 0.005, 10]]), 24),           // the 110 thermometer, the car pulls up
    K(266, F(() => fit([body(SALES_B, 0, 2.0, 0.42), body(SALES_A, 0, 2.0, 0.42), body(B_WALK_IN[1], 0, 2.0, 0.4)], 188, 5, 40, 0.92), 266, 0.0018, [[288, 0.005, 10]]), 20),
    K(288, (f) => { const p = polyAt(B_WALK_IN, sm(f, 270, 300)).p; return { pos: [p[0] + 0.2, 1.75, p[2] - 3.4] as V3, look: [p[0] + 0.4, 1.45, p[2] + 3] as V3, fov: 42 }; }, 12),
    K(302, F(() => ({ pos: [39.6, 1.7, 103.85] as V3, look: [40.0, 1.78, 106.2] as V3, fov: 38 }), 302, 0.012), 12), // over his shoulder into the photo
  ];
};
SHOT_ACTS[1] = (f, s) => {
  const thermo = f >= 240 && f < 268, sign = f >= 192 && f < 220;
  return {
    ctl: { dig: 0.1, dozer: lerp(0.4, 0.47, sm(f, 0, 90)), dozerBlade: 0, tumble: lerp(0.28, 0.7, lin(f, 8, 84)), bossCar: carU(f), bossDoor: 0, door: 1, fan: 0.6, sweat: 1, site: 1, lamps: 0 },
    cast: [
      boss1(f, s),
      C("dozer", desertDozer(lerp(0.4, 0.47, sm(f, 0, 90)), 0.1).seat, flow(f, [
        [0, { mode: "sit", expr: "determined", facing: -1, ...ACT.drive }],
        [64, { mode: "sit", expr: "grin", facing: -1, armR: [[24, -6], [30, -34]], armRFront: true }],   // thumbs-up on "river"
        [90, { mode: "sit", expr: "determined", facing: -1, ...ACT.drive }],
      ]), { idx: 4 }),
      C("worker1", [2.5, 10.5, -1.5], pose(null, { expr: "neutral", facing: -1, armR: [[18, 30], [8 + 6 * Math.sin(st(f) * 0.3), 52]], armRFront: true, propR: "broom" }), { idx: 5 }),
      C("worker2", [-3.5, 10.5, 2.0], pose(null, { expr: "smile", facing: 1, armR: [[28, 20], [40, 40]], propR: "numStone", propK: 207 }), { idx: 6 }),
      ...salesmen1(f, s, 1),
      agent1(f, s),
      C("painter", s.marks.painterGround, flow(f, [[0, { expr: "bored", facing: -1, sweat: 0.8, armR: [[26, 30], [30, 52]] as A2, propR: "paintPot" }], [192, { expr: "bored", facing: -1, sweat: 0.8, ...PZ.pointRUp }, 8], [222, { expr: "bored", facing: -1, sweat: 0.8, armR: [[26, 30], [30, 52]] as A2, propR: "paintPot" }, 10]]), { idx: 24 }),
    ],
    fx: fxs(thermo ? sparkle("thermo", [31.6, 3.9, 103.0], f - 244, 0.9, "#fff2b0") : null, thermo ? glowBurst("thermo", [31.6, 3.6, 102.9], 2.0, 0.6 * Math.sin(lin(f, 240, 268) * Math.PI), "255,120,80") : null,
      sign ? sparkle("sign300", [21.4, 3.2, 35.4], f - 196, 1.1) : null),
    focus: f < 96 ? [B_ARCH[0], 1.6, B_ARCH[2]] : f < 250 ? desertBossCar(carU(f)).driver : f < 290 ? [SALES_A[0], 1.5, SALES_A[2]] : f < 302 ? [38.6, 1.5, 104.5] : [A_OUT[2][0], 1.5, A_OUT[2][2]],
    subj: f < 250 ? "boss" : f < 292 ? "salesA" : f < 302 ? "boss" : "agent",
  };
};
lens(0, 6, 1); lens(100, 0.5, 24); lens(250, 6, 20); lens(300, 7, 12);

// =====================================================================================================================
// HOME BASE B, the sales office (scenes 3, 7, 8). Office-local marks -> desert set space with D_OFF (front faces -z).
const O_BOSS: V3 = D_OFF([-1.4, 0, -2.5]), O_SEAT: V3 = D_OFF([-1.4, 0.72, -2.5]);
void O_BOSS;
// ---- SCENE 3 (500-642) "His salesmen laughed. The whole town laughed. Then they gave him a nickname: Mister Nowhere."
// Dissolve from London: the boss is back behind his desk, feet up, hands behind his head, calm. Both salesmen fold up
// laughing beside the desk; the camera backs out through the open door to the street where four townsfolk crowd the
// doorway laughing (he stays calm in the background); it pushes back in to the desk where salesman B slaps a
// "MR. NOWHERE" plate over the PRESIDENT nameplate. The boss glances at it, smiles, says nothing.
const O3_SA: V3 = [42.65, 0, 113.55], O3_SB: V3 = [40.15, 0, 113.65], O3_SB_DESK: V3 = [40.15, 0, 112.15];
const O3_PLATE: V3 = D_OFF([-1.25, 0.9, -1.12]);
const O3_TOWN: V3[] = [[41.95, 0.02, 105.75], [41.15, 0.02, 105.45], [39.35, 0.02, 105.5], [38.55, 0.02, 105.8]];
const O3_OUT_CAM = { pos: [39.2, 1.75, 98.2] as V3, look: [40.6, 1.3, 109.0] as V3, fov: 46 };
/** the "MR. NOWHERE" plate (scene 3 desk, scene 9 parapet): brass frame, cream card, ink letters; k = pop 0..1 */
const plateCard = (key: string, pos: V3, k: number, w = 0.46, rot = 0): FxSpec | null => k <= 0.01 ? null : ({
  kind: "card", key: "plate" + key + "_" + Math.round(k * 12), pos, w: w * k, h: w * 0.34 * k, rot, cw: 300, ch: 102,
  draw: (p) => { const g = p.g; g.fillStyle = "#3a2418"; g.beginPath(); g.roundRect(0, 0, 300, 102, 12); g.fill();
    g.fillStyle = "#d9a743"; g.beginPath(); g.roundRect(7, 7, 286, 88, 9); g.fill();
    g.fillStyle = "#fff4dc"; g.beginPath(); g.roundRect(17, 16, 266, 70, 6); g.fill();
    g.font = "900 46px Georgia"; g.textAlign = "center"; g.fillStyle = "#241726"; g.fillText("MR. NOWHERE", 150, 68, 250); },
});
SHOT_CAMS[3] = () => [
  K(500, F(() => fit([body(O_SEAT, -0.7, 1.25, 0.55), body(O3_SA, 0, 2.05, 0.4), body(O3_SB, 0, 2.05, 0.4)], 210, 6, 46, 0.94), 500, 0.0022, [[504, 0.006, 10]])),
  K(538, F(() => O3_OUT_CAM, 538, 0.0026, [[554, 0.005, 8]]), 30),                                                   // backs out through the door
  K(574, F(() => fit([body(O_SEAT, -0.7, 1.25, 0.5), [O3_PLATE, -0.06, 0.12, 0.3], [[O3_PLATE[0], 0, O3_PLATE[2] - 0.3], 0, 0.1, 0.3]], 196, 4, 40, 0.86), 574, 0.0026, [[613, 0.008, 10]]), 24), // back in to the desk
];
SHOT_ACTS[3] = (f, s) => {
  const plate = sm(f, 610, 616) * (1 + 0.18 * Math.sin(lin(f, 616, 630) * Math.PI));
  const sbWalk = walkPath(3, s, [O3_SB, [39.95, 0, 112.6], O3_SB_DESK], f, 582, 604);
  const laughSA: P = { ...ACT.laugh, facing: faceTo(3, s, f, O3_SA, O_SEAT), phase: ph(f, 12) };
  const laughSB: P = { ...ACT.laugh, facing: faceTo(3, s, f, O3_SB, O_SEAT), phase: ph(f + 5, 12) };
  return {
    ctl: { dig: 0.1, site: 1, door: 1, fan: 0.8, sweat: 1, bossCar: 1, night: 0 },
    cast: [
      C("boss", O_SEAT, flow(f, [
        [500, { ...ACT.feetUp, expr: "calm", facing: -1 }],
        [544, { ...ACT.feetUp, expr: "smug", facing: -1, headTilt: 3 }, 10],
        [616, { ...ACT.feetUp, expr: "sly", facing: -1, headTilt: -6, look: 0.6 }, 6],                     // glances at the plate
        [630, { ...ACT.feetUp, expr: "calm", facing: -1, headTilt: 2 }, 8],                                  // and lets it be
      ]), { idx: 1 }),
      C("salesA", O3_SA, flow(f, [
        [500, { expr: "smug", facing: faceTo(3, s, f, O3_SA, O_SEAT), sweat: 0.6, armR: [[26, 30], [30, 52]] as A2 }],
        [502, laughSA, 6],                                                                                    // "His salesmen laughed."
        [596, { expr: "grin", facing: faceTo(3, s, f, O3_SA, O_SEAT), sweat: 0.6, armR: [[26, 20], [40, 30]] as A2 }, 10],
      ]), { idx: 2 }),
      sbWalk.moving ? C("salesB", sbWalk.p, pose(null, { mode: "stride", phase: sbWalk.phase, facing: sbWalk.facing, expr: "smug", armR: [[28, 20], [46, 18]] as A2, armRFront: true }), { idx: 3 }) :
      C("salesB", f < 590 ? O3_SB : O3_SB_DESK, flow(f, [
        [500, { expr: "grin", facing: faceTo(3, s, f, O3_SB, O_SEAT), armR: [[26, 30], [30, 52]] as A2 }],
        [504, laughSB, 6],
        [604, { expr: "smug", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), armR: [[28, 0], [48, -24]] as A2, armRFront: true }, 6],   // winds up
        [610, { expr: "grin", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), armR: [[28, 30], [52, 46]] as A2, armRFront: true, squash: 0.05 }, 4], // SLAP
        [622, { expr: "smug", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), ...ACT.laugh, phase: ph(f, 12) }, 8],
      ]), { idx: 3 }),
      ...O3_TOWN.map((p, i) => C(["worker1", "painter", "worker2", "dozer"][i], p, flow(f, [
        [500, { expr: "neutral", facing: i < 2 ? 1 : -1 }],
        [536 + i * 3, { ...ACT.laugh, facing: i < 2 ? 1 : -1, phase: ph(f + i * 4, 12) }, 6],               // "The whole town laughed."
        [600, { expr: "grin", facing: i < 2 ? 1 : -1, ...PZ.pointR }, 10],
      ]), { idx: 30 + i })),
    ],
    fx: fxs(f >= 504 && f < 540 ? squiggles("laughA", [O3_SA[0], 2.3, O3_SA[2]], f, "#ffffff", 0.3) : null,
      f >= 506 && f < 540 ? squiggles("laughB", [O3_SB[0], 2.3, O3_SB[2]], f + 1, "#ffffff", 0.3) : null,
      f >= 540 && f < 586 ? squiggles("laughT", [O3_TOWN[1][0], 2.35, O3_TOWN[1][2]], f, "#ffffff", 0.36) : null,
      f >= 543 && f < 586 ? squiggles("laughT2", [O3_TOWN[2][0], 2.35, O3_TOWN[2][2]], f + 2, "#ffffff", 0.36) : null,
      plateCard("desk", O3_PLATE, Math.min(1.18, plate)),
      f >= 612 && f < 626 ? sparkle("plate", [O3_PLATE[0] - 0.2, O3_PLATE[1] + 0.12, O3_PLATE[2] - 0.05], f - 612, 0.3) : null),
    focus: f < 538 ? [O_SEAT[0], 1.5, O_SEAT[2]] : f < 574 ? [O3_TOWN[1][0], 1.5, O3_TOWN[1][2]] : [O3_PLATE[0], 1.1, O3_PLATE[2]],
    subj: f < 538 ? "salesA" : f < 574 ? "worker1" : "boss",
  };
};
lens(500, 6, 1); lens(538, 4, 24); lens(574, 8, 20);

// =====================================================================================================================
// SCENE 2 (316-500) LONDON, deep night-blue fog with warm lamps. "So when London put its old bridge up for sale, he said
// two words: 'Buy it.' The thing was sinking an inch every eight years."
// Dissolve from the newspaper photo to the real arches in fog; a red bus rumbles over. The camera glides to the deal
// table on the deck while the FOR SALE banner unrolls down the river face on "for sale" (the city man points); the boss
// raises a finger on "two words", then slaps his giant cheque on the table on "Buy it" (the monocle pops). The camera
// cranes down the bridge face to the river landing: the bridge drops a notch on "sinking" (crunch), the inspector peers
// over his glasses at the tall ruler and shows "an inch"; a duck paddles by.
const L_INSP: V3 = [-27.05, 0.35, 10.2], L_BOSS: V3 = [-19.5, 10.5, 5.72], L_CITY: V3 = [-21.5, 10.5, 5.72], L_TABLE: V3 = [-20.5, 10.5, 5.1];
const L_RAIL: V3 = [-20.45, 10.5, 6.25]; // the city man at the parapet, right over the banner
const city2 = (f: number, s: SetDef): CastPlace => {
  const w = walkPath(2, s, [L_RAIL, L_CITY], f, 376, 388);
  if (w.moving) return C("cityman", w.p, pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "smug", armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }), { idx: 10 });
  return C("cityman", f < 376 ? L_RAIL : L_CITY, flow(f, [
  [316, { expr: "smug", facing: -1, tilt: 6, armR: [[34, -2], [52, 10]] as A2, armRFront: true, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }], // holds the rolled banner over the parapet
  [356, { expr: "beam", facing: -1, armR: [[30, -40], [46, -70]] as A2, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 6],            // "up" - lets it drop
  [366, { expr: "smug", facing: 1, ...PZ.pointR, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8],                                    // "for sale" (points down at it)
  [390, { expr: "pitch", facing: 1, armR: [[30, 4], [52, -10]] as A2, armRFront: true, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8], // presents it to the boss
  [416, { expr: "aghast", facing: 1, monoclePop: 1, squash: -0.06, armR: [[26, 20], [40, 0]] as A2, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 8], // "Buy it."
  [436, { expr: "shock", facing: 1, monoclePop: 1, armL: [[-26, 30], [-30, 52]] as A2, propL: "umbrella" }, 10],
]), { idx: 10 });
};
const boss2 = (f: number): CastPlace => C("boss", L_BOSS, flow(f, [
  [316, { expr: "calm", facing: -1, armR: [[26, 30], [30, 52]] as A2 }],                                  // watches the banner go down
  [374, { expr: "sly", facing: -1, armR: [[24, 10], [30, -14]] as A2, headTilt: 4 }, 8],                    // looks at the board
  [386, { expr: "calm", facing: -1, ...PZ.pointRUp }, 8],                                                     // "two words"
  [404, { ...ACT.cheque, expr: "calm", facing: -1, lift: 0.04 }, 8],                                          // lifts the cheque...
  [414, { ...ACT.cheque, expr: "smug", facing: -1, squash: 0.07 }, 4],                                       // ...SLAPS it down: "Buy it."
  [424, { ...ACT.cheque, expr: "calm", facing: -1, headTilt: 5 }, 8],
]), { idx: 1 });
const insp2 = (f: number): CastPlace => C("inspector", L_INSP, flow(f, [
  [316, { ...ACT.inspect, expr: "neutral" }],
  [440, { ...ACT.inspect, expr: "shock", squash: 0.05 }, 3],                     // the bridge drops a notch: "sinking"
  [450, { ...ACT.inspect, expr: "stare", headTilt: -6 }],                         // peers over his glasses
  [457, { ...ACT.inspect, expr: "smug", armL: [[-26, 10], [-44, -12]] as A2 }],   // "an inch"
  [476, { ...ACT.inspect, expr: "neutral", headTilt: 5, armL: [[-24, -6], [-40, -30]] as A2 }, 8],  // "every eight years": a slow tick-tock finger
]), { idx: 11 });
SHOT_CAMS[2] = () => [
  K(316, F(() => ({ pos: [-20.1, 12.0, 15.0] as V3, look: [-20.1, 10.5, 7.0] as V3, fov: 40 }), 316, 0.0024, [[360, 0.006, 10]])),       // the city man drops the FOR SALE banner
  K(374, F(() => fit([body(L_BOSS, 0.4, 2.2, 0.45), body(L_CITY, 0.4, 2.2, 0.45), [L_TABLE, 0.5, 1.1, 0.5]], 10, 42, 40, 0.86), 374, 0.0018, [[416, 0.007, 10]]), 22), // cranes up over the parapet
  K(428, F(() => fit([body(L_INSP, 0, 2.5, 0.55)], 56, -6, 40, 0.72, 0.1), 428, 0.0018, [[440, 0.007, 10]]), 26),
];
SHOT_ACTS[2] = (f, s) => ({
  ctl: { banner: lin(f, 358, 370) ** 0.7, bus: lin(f, 318, 372), sink: sm(f, 438, 444), lamps: 1, dismantle: 0, numbered: 0, later: 0, crate: 0, ruler: 0 },
  cast: [insp2(f), boss2(f), city2(f, s),
    C("duck", [-23.5 - 0.02 * (f - 316), 0.02, 13.2], pose(null, { facing: -1, phase: ph(f, 22) }), { scale: 0.75, idx: 12 }),
    C("lady", [-6.4, 10.5, 5.5], pose(null, { expr: "smile", facing: -1, armR: [[24, -10], [30, -40]] as A2, propR: "umbrellaOpen", propK: 1 }), { idx: 13 }),
    C("bobby", [-18.5, 10.5, -5.3], pose(null, { expr: "neutral", facing: 1, ...PZ.hips }), { idx: 14 }),
    C("gent", [6.5, 10.5, -5.0], pose(null, { expr: "neutral", facing: -1, armR: [[24, 30], [34, 40]] as A2, armRFront: true, propR: "newspaper" }), { idx: 15 }),
  ],
  fx: fxs(
    f >= 415 && f < 430 ? sparkle("cheque", [L_TABLE[0] + 0.4, 11.9, L_TABLE[2] + 0.3], f - 415, 0.5) : null,
    f >= 438 && f < 454 ? dustCard("sink", [-26.9, 0.6, 9.6], 0.9, 0.7 * (1 - lin(f, 438, 454)), 2) : null),
  focus: f < 374 ? [L_RAIL[0], 11.6, L_RAIL[2]] : f < 428 ? [L_TABLE[0], 11.6, L_TABLE[2] + 0.5] : [L_INSP[0], 1.9, L_INSP[2]],
  subj: f < 428 ? "boss" : "inspector",
});
lens(316, 5, 1); lens(428, 6, 26);

// =====================================================================================================================
// SCENE 4 (642-811) the GIANT FLOOR MAP (scale gag), warm lamp light. "They numbered every stone, shipped the world's
// heaviest jigsaw puzzle across the ocean, and rebuilt it on dry sand."
// Dissolve from the inspector to the boss kneeling at toy London, painting numbers on the toy ship's granite blocks (a
// sparkle per number); he gets up and pushes the ship across the painted Atlantic (side track), a "10,000 PIECES"
// jigsaw piece pops over the cargo on "jigsaw puzzle"; the ship slips through the toy canal and up the coast; the blocks
// hop onto the toy truck, which rolls into the orange desert with the boss jogging behind to the toy bridge on toy sand.
const shipU4 = (f: number) => f < 722 ? lerp(0, SHIP_U.canalIn, sm(f, 684, 722)) : f < 740 ? lerp(SHIP_U.canalIn, SHIP_U.canalOut, lin(f, 722, 740)) : lerp(SHIP_U.canalOut, 1, sm(f, 740, 764));
const truckU4 = (f: number) => sm(f, 772, 800);
const M4_PAINT = (): V3 => { const b = worldmapBoss(0); return [b[0], b[1], b[2]]; };
const boss4 = (f: number, s: SetDef): CastPlace => {
  if (f < 676) return C("boss", M4_PAINT(), flow(f, [
    [642, { ...ACT.kneelPaint, expr: "determined", facing: screenSide(4, s, f, -1, 0), propRAng: 1.35 + 0.25 * Math.sin(f * 0.5) }],
  ]), { idx: 1 });
  if (f < 764) {
    const u = shipU4(f), p = worldmapBoss(u), sp = worldmapShip(u), fast = f >= 722;
    return C("boss", p, flow(f, [
      [676, { ...ACT.kneelPaint, expr: "determined", facing: screenSide(4, s, f, sp.dir[0], sp.dir[1]) }],
      [680, { ...ACT.push, facing: screenSide(4, s, f, sp.dir[0], sp.dir[1]), phase: ph(f, fast ? 8 : 12), expr: f >= 726 && f < 740 ? "strain" : "determined", sweat: fast ? 1 : 0.3 }, 6],
    ]), { idx: 1 });
  }
  const a = worldmapBoss(1), b = s.marks.bossTruckEnd, w = walkPath(4, s, [a, b], f, 770, 802);
  return C("boss", w.p, w.moving ? pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "proud", sweat: 0.5 }) : flow(f, [
    [764, { expr: "proud", facing: w.facing, sweat: 0.5 }],
    [802, { expr: "calm", facing: faceTo(4, s, f, b, s.marks.toyBridge), ...PZ.pointR }, 8],              // "...on dry sand"
  ]), { idx: 1 });
};
/** the jigsaw piece that pops over the cargo on "jigsaw puzzle" (k = 0..1 scale) */
const jigsawCard = (pos: V3, k: number): FxSpec | null => k <= 0.02 ? null : ({
  kind: "card", key: "jig_" + Math.round(k * 12), pos, w: 0.75 * k, h: 0.6 * k, rot: 0.12 * Math.sin(k * 6), cw: 250, ch: 200,
  draw: (p) => { const g = p.g; g.lineJoin = "round";
    const piece = () => { g.beginPath(); g.moveTo(30, 40); g.lineTo(95, 40); g.arc(125, 34, 24, Math.PI * 0.85, Math.PI * 0.15, false); g.lineTo(220, 40); g.lineTo(220, 85);
      g.arc(228, 112, 22, -Math.PI * 0.6, Math.PI * 0.6, false); g.lineTo(220, 180); g.lineTo(30, 180); g.lineTo(30, 135); g.arc(38, 108, 22, Math.PI * 0.6, -Math.PI * 0.6, true); g.closePath(); };
    piece(); g.fillStyle = "#241726"; g.lineWidth = 16; g.strokeStyle = "#241726"; g.stroke();
    piece(); g.fillStyle = "#ff9b3d"; g.fill();
    g.fillStyle = "#fff6e0"; g.font = "900 40px Georgia"; g.textAlign = "center"; g.fillText("10,000", 125, 112); g.font = "900 28px Georgia"; g.fillText("PIECES", 125, 150); },
});
SHOT_CAMS[4] = (s) => [
  K(642, F(() => fit([body(M4_PAINT(), 0, 1.3, 0.5), [worldmapShip(0).pos, 0, 0.35, 0.7]], 150, 18, 40, 0.82), 642, 0.0026, [[650, 0.004, 8], [662, 0.004, 8]])),
  K(678, (f) => worldmapTrack(shipU4(f), 4.1, 1.7), 22),
  K(764, F(() => fit([body(worldmapBoss(1), 0, 2.0, 0.42), body(s.marks.bossTruckEnd, 0, 2.0, 0.42), [s.marks.truckEnd, 0, 0.5, 0.6]], 0, 22, 42, 0.9), 764, 0.002), 20),
  K(796, F(() => fit([body(s.marks.bossTruckEnd, 0, 2.0, 0.4), [s.marks.toyBridge, 0, 0.18, 0.45]], 34, 26, 40, 0.86), 796, 0.0035), 14),
];
SHOT_ACTS[4] = (f, s) => {
  const sp = worldmapShip(shipU4(f));
  const jig = sm(f, 710, 718) * (1 + 0.15 * Math.sin(lin(f, 718, 730) * Math.PI)) * (1 - sm(f, 744, 752));
  return {
    ctl: { ship: shipU4(f), locks: sm(f, 724, 738), cargo: sm(f, 764, 776), truck: truckU4(f) },
    cast: [boss4(f, s)],
    fx: fxs(...[650, 662, 672].map((a, i) => sparkle("num" + i, [sp.pos[0] + 0.12 * (i - 1), sp.pos[1] + 0.32, sp.pos[2]], f - a, 0.22)),
      jigsawCard([sp.pos[0], sp.pos[1] + 0.95, sp.pos[2]], jig),
      f >= 722 && f < 764 ? speedLines([worldmapBoss(shipU4(f))[0], -0.2, worldmapBoss(shipU4(f))[2]], f, 4, 0.9, [-sp.dir[0], -sp.dir[1]]) : null,
      f >= 800 && f < 814 ? sparkle("toyBridge", [s.marks.toyBridge[0], 0.25, s.marks.toyBridge[2]], f - 800, 0.3) : null),
    focus: f < 764 ? sp.pos : f < 796 ? s.marks.truckEnd : s.marks.toyBridge,
    subj: "boss",
  };
};
lens(642, 7, 1); lens(678, 5, 20); lens(764, 5, 16); lens(796, 6, 12);

// =====================================================================================================================
// SCENE 5 (811-1108) HOME BASE A, the finished bridge on DRY sand (the fake-out). "And nobody came. Not a car. Not a
// tourist. Just one lizard crossing to nowhere. 'Pretty sure he's lost it,' the salesmen said. So what's a bridge with
// no river for? He just said, 'Get me a bulldozer.'"
// Dissolve from the toy bridge on toy sand to the real one (same angle): the boss alone on the deck waving a welcome
// pennant. Deck level: a tumbleweed rolls down the empty roadway ("not a car"); the salesmen hold up brochures to an
// empty road ("not a tourist"); the camera drops to lizard height: one lizard scuttles across and the boss bows it
// through like a doorman. The salesmen whisper and snicker. He leans on the parapet looking down at the dry sand (the
// question), straightens and, calm, points down: the bulldozer roars in below.
const B5: V3 = [-3.6, 10.5, 4.9], SA5: V3 = [6.2, 10.5, -4.2], SB5: V3 = [7.5, 10.5, -3.5];
const LIZ5: V3[] = [[5.5, 10.5, 1.9], [-11, 10.5, 2.3]];
const liz5 = (f: number) => polyAt(LIZ5, lin(f, 884, 952)).p;
const dozer5 = (f: number) => lerp(0, 0.16, sm(f, 1082, 1106));
const dozCam5 = (f: number) => desertDozer(dozer5(f), 0).pos;
SHOT_CAMS[5] = () => [
  K(811, F(() => ({ pos: [31, 22, 44] as V3, look: [0, 8.5, 0] as V3, fov: 40 }), 811, 0.0028)),
  K(815, F(() => fit([body(B5, 0, 2.3, 0.6)], 35, 12, 40, 0.62, -0.15), 815, 0.0022), 11),                       // push in on the boss waving: "And nobody came."
  K(832, F(() => ({ pos: [-8.5, 12.4, 5.3] as V3, look: [8, 11.0, 2.6] as V3, fov: 42 }), 832, 0.0016), 1, true),    // "Not a car." down the empty roadway
  K(858, F(() => ({ pos: [1.5, 12.0, -2.4] as V3, look: [7.0, 11.3, -4.0] as V3, fov: 42 }), 858, 0.0018), 1, true),  // "Not a tourist."
  K(882, F((f) => { const p = liz5(f); return { pos: [p[0] + 1.35, 10.78, p[2] - 0.55] as V3, look: [p[0] - 0.6, 10.7, p[2] + 0.35] as V3, fov: 38 }; }, 882, 0.0008), 1, true), // lizard height
  K(940, F(() => ({ pos: [11.8, 12.0, -2.0] as V3, look: [6.8, 11.3, -4.0] as V3, fov: 42 }), 940, 0.002, [[944, 0.005, 8]]), 1, true), // "Pretty sure he's lost it"
  K(1002, F(() => fit([body(B5, 0, 2.3, 0.6)], 14, 12, 42, 0.56, -0.4), 1002, 0.0018, [[1078, 0.005, 10]]), 1, true), // leans on the parapet over the dry riverbed
  K(1087, F((f) => fit([body(dozCam5(f), 0, 3.2, 1.7)], 62, 6, 40, 0.62, 0, 0.4), 1087, 0.0016), 1, true),       // the bulldozer roars in below
];
SHOT_ACTS[5] = (f, s) => {
  const lp = liz5(f), lizOn = f > 884 && f < 952;
  return {
    ctl: { dig: 0, water: 0, built: 1, numbered: 1, site: 0, dozerShow: f >= 1076 ? 1 : 0, dozer: dozer5(f), dozerBlade: 1, ...(f < 884 ? { tumbleDeck: lin(f, 828, 872) } : {}), bossCar: 0, lamps: 0, truck: 1 },
    cast: [
      C("boss", B5, flow(f, [
        [811, { ...ACT.pennant, expr: "beam", facing: 1, propRAng: 0.25 * Math.sin(f * 0.35) }],             // welcome!
        [836, { ...ACT.pennant, expr: "neutral", facing: 1, propRAng: 0.08 * Math.sin(f * 0.2) }, 12],       // ...nobody
        [862, { expr: "calm", facing: 1, armR: [[26, 30], [30, 52]] as A2, propR: "pennant" }, 10],
        [900, { expr: "beam", facing: 1, tilt: 10, armR: [[30, 10], [56, 20]] as A2, armRFront: true, propR: "pennant" }, 10], // bows the lizard through
        [936, { expr: "calm", facing: 1, armR: [[26, 30], [30, 52]] as A2, propR: "pennant" }, 10],
        [1004, { expr: "stare", facing: 1, tilt: 8, headTilt: 10, armR: [[26, 30], [30, 52]] as A2, armL: [[-26, 30], [-30, 52]] as A2 }, 12], // leans on the parapet, looks down
        [1060, { expr: "calm", facing: -1, armR: [[26, 30], [30, 52]] as A2 }, 10],                         // straightens, turns
        [1076, { expr: "sly", facing: -1, armR: [[26, 20], [40, 36]] as A2, armRFront: true, mouth: talk(f, 1076, 1102) }, 8], // "Get me a bulldozer."
      ]), { idx: 1 }),
      C("salesA", SA5, flow(f, [
        [811, { ...ACT.brochure, expr: "pitch", facing: 1, sweat: 0.6 }],
        [858, { expr: "pitch", facing: 1, sweat: 0.6, armR: [[30, -14], [44, -46]] as A2, propR: "brochure" }, 8], // holds it up to the empty road
        [884, { expr: "bored", facing: 1, sweat: 0.6, armR: [[26, 30], [30, 52]] as A2, propR: "brochure" }, 10],
        [942, { expr: "smug", facing: 1, sweat: 0.6, tilt: 8, armL: [[-20, 10], [-34, -18]] as A2, mouth: talk(f, 942, 986) }, 8], // whispers
        [1088, { expr: "shock", facing: 1, sweat: 0.6, squash: -0.05 }, 6],
      ]), { idx: 2 }),
      C("salesB", SB5, flow(f, [
        [811, { ...ACT.jar, expr: "pitch", facing: 1 }],
        [862, { ...ACT.jar, expr: "pitch", facing: 1, armR: [[34, -6], [60, -22]] as A2 }, 8],
        [884, { expr: "dismay", facing: 1, ...PZ.shrug, propR: "sandJar" }, 10],
        [952, { expr: "grin", facing: -1, armR: [[22, 0], [10, -26]] as A2, armRFront: true, propL: "sandJar", phase: ph(f, 10), shake: 0.5 }, 8], // snickers
        [1088, { expr: "shock", facing: -1, squash: -0.05 }, 6],
      ]), { idx: 3 }),
      C("lizard", lp, pose(null, { mode: lizOn ? "walk" : undefined, phase: ph(f, 5), facing: -1, headTilt: f > 952 ? 10 * Math.sin((f - 952) * 0.3) : 0 }), { scale: 0.6, idx: 19 }),
      C("dozer", desertDozer(dozer5(f), 0).seat, pose(null, { mode: "sit", expr: "grin", facing: -1, ...ACT.drive }), { idx: 4 }),
    ],
    fx: fxs(f >= 1084 && f < 1108 ? dustTrail("dozerIn", desertDozer(dozer5(f), 0).pos, [0, -1], f, 5, 0.8, 0.8) : null,
      f >= 900 && f < 914 ? sparkle("bow", [B5[0] + 0.6, 11.6, B5[2]], f - 900, 0.25) : null),
    focus: f < 815 ? [0, 9, 0] : f < 858 ? [B5[0], 11.6, B5[2]] : f < 882 ? [SA5[0], 11.6, SA5[2]] : f < 940 ? lp : f < 1002 ? [SA5[0], 11.6, SA5[2]] : f < 1087 ? [B5[0], 11.8, B5[2]] : [dozCam5(f)[0], dozCam5(f)[1] + 1.6, dozCam5(f)[2]],
    subj: f < 882 ? "boss" : f < 940 ? "lizard" : f < 1002 ? "salesA" : f < 1087 ? "boss" : "dozer",
  };
};
lens(811, 0.5, 1); lens(815, 4, 16); lens(832, 5, 1); lens(858, 6, 1); lens(882, 9, 1); lens(940, 6, 1); lens(1002, 4, 1); lens(1087, 5, 1);

// =====================================================================================================================
// SCENE 6 (1108-1203, hard cut = days later) HOME BASE A, the frame-1 view. "He dug a mile-long ditch under it and
// flooded it with lake water." The bulldozer cuts the ditch under the centre arch past the boss (dust); on "flooded" the
// lake bursts through the sand plug and the foam front races in under the arches; the boss hops back with wet shoes.
const B6: V3 = [-6.6, 0, -13.4], B6_BACK: V3 = [-8.4, 0, -14.8];
const dozer6 = (f: number) => lerp(0.3, 0.62, sm(f, 1108, 1160));
SHOT_CAMS[6] = () => [
  K(1108, F(() => fit([body(B6, 0, 2.2, 0.5), [[0, 0, -2], 0, 4.2, 2.4]], 214, 7, 42, 0.92), 1108, 0.0022), 1, true),
  K(1150, F(() => fit([body(B6, 0, 2.2, 0.5), body(B6_BACK, 0, 2.2, 0.5)], 205, 14, 40, 0.8), 1150, 0.0016, [[1162, 0.006, 10]]), 22), // boss large beside the ditch as the lake rushes in
];
SHOT_ACTS[6] = (f) => {
  const dig = lerp(0.1, 0.5, sm(f, 1108, 1150)), water = lerp(0, 0.16, sm(f, 1156, 1198));
  const hop = sm(f, 1172, 1184), wetK = sm(f, 1174, 1182);
  return {
    ctl: { dig, water, dozer: dozer6(f), dozerBlade: 0, built: 1, numbered: 1, site: 0, dozerShow: 1, bossCar: 0, lamps: 0, truck: 1 },
    cast: [
      C("boss", lerp3(B6, B6_BACK, hop), flow(f, [
        [1108, { expr: "proud", facing: 1, ...PZ.pointR }],                                                        // "He dug..."
        [1140, { expr: "sly", facing: 1, armR: [[26, 30], [30, 52]] as A2 }, 8],
        [1160, { expr: "beam", facing: 1, ...PZ.pointRUp }, 8],                                                    // "...flooded it"
        [1172, { ...ACT.yikes, facing: -1, lift: 0.9 * Math.sin(hop * Math.PI) }, 4],                             // the water rushes in
        [1184, { expr: "beam", facing: 1, wet: 0.7 * wetK, sweat: 0.4 }, 8],
      ]), { idx: 1, air: f >= 1172 && f < 1184 }),
      C("dozer", desertDozer(dozer6(f), dig).seat, pose(null, { mode: "sit", expr: f > 1166 ? "shock" : "determined", facing: -1, ...ACT.drive }), { idx: 4 }),
    ],
    fx: fxs(f >= 1166 && f < 1200 ? dustCard("splash", [-3.5, 0.6, -14.5], 1.8, 0.8 * (1 - lin(f, 1166, 1200)), 4) : null),
    focus: [B6[0], 1.2, B6[2]],
    subj: "boss",
  };
};
lens(1108, 4, 1); lens(1150, 4, 20);

// =====================================================================================================================
// SCENE 7 (1203-1409) HOME BASE B at NIGHT (deep blue, the green desk lamp): the explanation in its own time and light.
// "That's the trick. He was never selling a bridge. He was selling the desert around it. Ever pulled off the highway to
// see a giant dinosaur? Same thing." The boss holds the tiny model bridge over his tabletop town (stinger on "trick"),
// sets it down at the centre; the tiny lots light up and flip to SOLD outward from it while he spreads his arms; the agent
// leans in, amazed. The camera dips to model level along the tiny highway: a tiny car pulls off at the tiny dinosaur and
// then drives on into the tiny town; the boss gives a sly wink on "Same thing".
const M_BOSS: V3 = D_OFF([-2.4, 0, 0.22]), M_AGENT: V3 = D_OFF([-0.95, 0, 0.42]), M_BRIDGE: V3 = D_OFF([-2.4, 0.94, 1.05]);
SHOT_CAMS[7] = () => [
  K(1203, F(() => ({ pos: D_OFF([-1.0, 1.55, 3.3]), look: D_OFF([-2.4, 1.1, 1.0]), fov: 38 }), 1203, 0.0022, [[1215, 0.006, 10]])),
  K(1265, F(() => ({ pos: D_OFF([-1.15, 2.55, 2.85]), look: D_OFF([-2.4, 0.95, 0.95]), fov: 42 }), 1265, 0.0016, [[1289, 0.005, 10]]), 36),
  K(1321, F(() => ({ pos: D_OFF([-3.7, 1.16, 3.0]), look: D_OFF([-2.6, 1.35, 0.6]), fov: 42 }), 1321, 0.0018), 30), // model level inside the room, along the tiny highway past the tiny dinosaur to the boss
  K(1381, F(() => fit([body(M_BOSS, 0.9, 2.2, 0.42)], 200, 6, 38, 0.6), 1381, 0.002, [[1391, 0.006, 8]]), 18),
];
SHOT_ACTS[7] = (f) => ({
  ctl: { night: 1, door: 0, fan: 0.4, sweat: 0.2, modelBridge: sm(f, 1241, 1257), modelLots: sm(f, 1281, 1317), modelCars: lerp(0, 0.62, sm(f, 1325, 1403)), dig: 1, water: 1, grow: 0.15, site: 0, bossCar: 1, bossCarHide: 1, lamps: 1 },
  cast: [
    C("boss", M_BOSS, flow(f, [
      [1203, { expr: "sly", facing: 1, armR: [[26, 26], [40, 36]] as A2, armL: [[-26, 26], [-40, 36]] as A2, armRFront: true, armLFront: true }],   // holds the tiny bridge
      [1241, { expr: "determined", facing: 1, armR: [[26, 34], [40, 50]] as A2, armL: [[-26, 34], [-40, 50]] as A2, armRFront: true, armLFront: true }], // sets it down
      [1273, { expr: "beam", facing: 1, armR: ARMS.wideR, armL: ARMS.wideL }, 10],                                                                  // "...the desert around it"
      [1321, { expr: "sly", facing: 1, look: 0.6, armR: [[26, 30], [46, 42]] as A2, armRFront: true }],                                              // points at the tiny highway
      [1389, { expr: "sly", facing: -1, headTilt: 8, armR: [[26, 30], [30, 50]] as A2 }, 6],                                                       // "Same thing." wink
    ]), { idx: 1 }),
    C("agent", M_AGENT, flow(f, [
      [1203, { expr: "neutral", facing: -1, armR: [[26, 30], [30, 50]] as A2 }],
      [1279, { expr: "eureka", facing: -1, tilt: -6, squash: -0.04 }, 10],                    // leans in, amazed
      [1355, { expr: "smile", facing: -1, tilt: -3 }],
    ]), { idx: 7 }),
  ],
  fx: fxs(f >= 1255 && f < 1271 ? sparkle("seat", [M_BRIDGE[0], M_BRIDGE[1] + 0.12, M_BRIDGE[2]], f - 1256, 0.3) : null),
  focus: f < 1321 ? [M_BRIDGE[0], 1.2, M_BRIDGE[2]] : f < 1381 ? D_OFF([-2.6, 0.95, 1.6]) : [M_BOSS[0], 1.8, M_BOSS[2]],
  subj: "boss",
});
lens(1203, 7, 1); lens(1265, 6, 24); lens(1321, 10, 20); lens(1381, 7, 16);

// =====================================================================================================================
// SCENE 8 (1409-1615, hard cut = the next morning) HOME BASE B by day: "The first week, a few cars stopped to look. Three
// years later, almost two million people a year. And while they were there, they bought a lot."
// Ride alongside the family station wagon down Main Street; the kids point back at the bridge; it pulls up at the office.
// The camera rises to the office front: the boss beams in the doorway while the VISITORS board on the storefront spins
// up to 2,000,000 and the town fills in behind (new houses, palms, bunting). Salesman A hurries out with the lot map and,
// on "lot", stamps SOLD on it against the car door.
const wagU8 = (f: number) => lerp(0.86, 1, sm(f, 1409, 1454));
const SA_KERB: V3 = [39.6, 0, 99.25], BOSS_DOOR: V3 = [39.1, 0.02, 105.65];
const COUNTER: V3 = [39.0, 2.85, 103.95];
const visitors = (f: number) => Math.round(2000000 * (1 - (1 - lin(f, 1470, 1534)) ** 3) / 1000) * 1000;
const counterCard = (f: number): FxSpec => {
  const n = f < 1470 ? 0 : visitors(f), txt = n.toLocaleString("en-US");
  return { kind: "card", key: "visitors_" + n, pos: COUNTER, w: 2.0, h: 0.83, cw: 360, ch: 150,
    draw: (p) => { const g = p.g; g.fillStyle = "#241726"; g.beginPath(); g.roundRect(0, 0, 360, 150, 14); g.fill(); g.fillStyle = "#1f6f78"; g.beginPath(); g.roundRect(8, 8, 344, 134, 10); g.fill();
      g.fillStyle = "#ffe7a6"; g.font = "900 30px Georgia"; g.textAlign = "center"; g.fillText("VISITORS", 180, 46);
      g.fillStyle = "#ffffff"; g.font = "900 62px Georgia"; g.fillText(txt, 180, 118, 330); } };
};
SHOT_CAMS[8] = () => [
  K(1409, (f) => { const w = desertWagon(wagU8(f)), c = Math.cos(w.yaw), sn = Math.sin(w.yaw); return { pos: [w.pos[0] + c * 6.5 + sn * 1.5, 2.3, w.pos[2] - sn * 6.5 + c * 1.5] as V3, look: [w.pos[0] + sn * 0.8, 1.1, w.pos[2] + c * 0.8] as V3, fov: 40 }; }, 1, true),
  K(1460, F(() => fit([body([38.6, 0, 100.95], 0, 1.5, 2.6), body(BOSS_DOOR, 0, 2.1, 0.42), [COUNTER, -0.35, 0.35, 0.8]], 192, 24, 40, 0.92), 1460, 0.0018, [[1498, 0.005, 10]]), 26),
  K(1548, F(() => fit([body([38.6, 0, 100.95], 0, 1.5, 2.0), body(SA_KERB, 0, 2.0, 0.4), body(BOSS_DOOR, 0, 2.1, 0.42)], 196, 22, 40, 0.94), 1548, 0.0018, [[1590, 0.006, 8]]), 22),
];
SHOT_ACTS[8] = (f, s) => {
  const seats = desertWagonSeats(wagU8(f), 0), sa = walkPath(8, s, [SALES_A, [42.9, 0.1, 102.7], [42.4, 0, 99.6], SA_KERB], f, 1546, 1580);
  const stamp = sm(f, 1586, 1592) * (1 - sm(f, 1592, 1598));
  return {
    ctl: { wagon: wagU8(f), wagon2: 0, wagonDoor: 0, dig: 1, water: 1, grow: lerp(0.3, 0.8, sm(f, 1470, 1534)), site: 0, bossCar: 1, bossCarHide: 1, door: 1, night: 0, fan: 0.6, sweat: 0.6, numbered: 1 },
    cast: [
      C("dad", seats.driver, pose(null, { ...ACT.drive, expr: f > 1454 ? "beam" : "smile", facing: 1 }), { idx: 20 }),
      C("mom", seats.front, pose(null, { ...ACT.seat, expr: f > 1460 ? "eureka" : "smile", facing: 1 }), { idx: 21 }),
      C("kidBoy", seats.rearL, flow(f, [[1409, { ...ACT.seat, expr: "smile", facing: 1 }], [1424, { ...ACT.seatPoint, facing: -1 }]]), { idx: 22 }),
      C("kidGirl", seats.rearR, flow(f, [[1409, { ...ACT.seat, expr: "smile", facing: 1 }], [1432, { ...ACT.seatPoint, facing: -1 }]]), { idx: 23 }),
      C("salesA", sa.p, sa.moving ? pose(null, { mode: "stride", phase: sa.phase, facing: sa.facing, expr: "pitch", propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }) : flow(f, [
        [1409, { expr: "eureka", facing: -1, propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }],
        [1578, { expr: "pitch", facing: -1, propR: "brochure", armR: [[28, 10], [40, -6]] as A2, armRFront: true }],
        [1584, { expr: "beam", facing: -1, armR: [[28, -10], [40, -40 + 34 * stamp]] as A2, armRFront: true, armL: [[-28, 20], [-40, 20]] as A2, armLFront: true }, 4],
      ]), { idx: 2 }),
      C("boss", BOSS_DOOR, flow(f, [[1409, { expr: "beam", facing: -1, ...PZ.hips }], [1500, { expr: "beam", facing: -1, armR: [[30, -14], [46, -50 + 8 * Math.sin(f * 0.5)]] as A2 }, 10]]), { idx: 1 }),
      C("salesB", SALES_B, flow(f, [[1409, { expr: "neutral", facing: 1, armR: [[30, 30], [40, 46]] as A2, propR: "sandJar" }], [1500, { expr: "eureka", facing: 1, ...PZ.cheer }, 10]]), { idx: 3 }),
    ],
    fx: fxs(counterCard(f),
      f >= 1534 && f < 1548 ? sparkle("counter", [COUNTER[0] - 0.5, COUNTER[1] + 0.3, COUNTER[2] - 0.1], f - 1534, 0.4) : null,
      f >= 1592 ? { kind: "card", key: "soldStamp", pos: [39.0, 1.1, 99.7], w: 0.55, h: 0.3, cw: 220, ch: 120,
      draw: (p) => { const g = p.g; g.save(); g.translate(110, 60); g.rotate(-0.18); g.strokeStyle = "#d8302a"; g.lineWidth = 9; g.strokeRect(-96, -44, 192, 88); g.font = "900 64px Georgia"; g.textAlign = "center"; g.fillStyle = "#d8302a"; g.fillText("SOLD", 0, 22); g.restore(); } } : null,
      f >= 1592 && f < 1606 ? sparkle("sold", [39.0, 1.35, 99.6], f - 1592, 0.45) : null),
    focus: f < 1460 ? desertWagon(wagU8(f)).pos.map((v, i) => v + [0, 1.2, 0][i]) as V3 : f < 1548 ? [COUNTER[0], 1.6, COUNTER[2]] : [39.2, 1.4, 99.8],
    subj: f < 1460 ? "dad" : f < 1548 ? "boss" : "salesA",
  };
};
lens(1409, 4, 1); lens(1460, 5, 20); lens(1548, 5, 16);

// =====================================================================================================================
// SCENE 9 (1615-1914) HOME BASE A, the PAYOFF in the brightest light (hard cut = three years later). "Boats went under
// it. Tourists went over it. And the salesmen finally stopped selling sand. The sign got repainted: 'Population: ten
// thousand.' That's ten thousand people living in Nowhere. All because..."
// Water level on the town side: motorboats run out under the arches toward camera. The camera cranes up the bridge face
// to the deck: the family strolls over it. The two salesmen at the parapet: salesman B tips his jar of sand into the
// river and both lean back with ice creams. A glide to the town sign: the painter turns "POP. 300" into "10,000". The
// camera rises over the busy town, then settles on the boss at the parapet: on "Nowhere" he sets the MR. NOWHERE plate
// on the stone, and a calm, held smile carries "All because..." back into frame 1.
const P_BOSS: V3 = [2.2, 10.5, 5.8], P_SA: V3 = [5.6, 10.5, 5.75], P_SB: V3 = [6.9, 10.5, 5.6];
const FAM: { who: string; a: V3; b: V3; idx: number }[] = [
  { who: "dad", a: [17.5, 10.5, 2.6], b: [10.4, 10.5, 2.9], idx: 20 },
  { who: "mom", a: [18.7, 10.5, 3.4], b: [11.5, 10.5, 3.6], idx: 21 },
  { who: "kidBoy", a: [16.2, 10.5, 3.7], b: [9.3, 10.5, 4.0], idx: 22 },
  { who: "kidGirl", a: [19.6, 10.5, 2.4], b: [12.5, 10.5, 2.6], idx: 23 },
];
const SIGN9: V3 = [22, 0, 36];
const boats9 = (f: number) => lerp(0.6, 1.0, lin(f, 1615, 1914));
const plateP = (f: number): V3 => lerp3([P_BOSS[0] + 0.32, 11.55, P_BOSS[2] + 0.1], [P_BOSS[0] + 0.62, 11.78, 6.72], sm(f, 1862, 1872));
SHOT_CAMS[9] = (s) => [
  K(1615, F(() => ({ pos: [3.0, 2.6, -46] as V3, look: [1.2, 2.6, -8] as V3, fov: 42 }), 1615, 0.0018), 1, true),               // "Boats went under it."
  K(1640, F(() => ({ pos: [3.5, 12.4, 1.6] as V3, look: [14, 11.3, 3.2] as V3, fov: 42 }), 1640, 0.0016), 26),                       // "Tourists went over it." (they stroll toward us)
  K(1668, F(() => fit([body(P_SA, 0, 2.1, 0.42), body(P_SB, 0, 2.1, 0.42), [[P_SB[0], 7.5, P_SB[2] + 1.0], 0, 2.5, 0.6]], 18, 24, 40, 0.88), 1668, 0.0018, [[1704, 0.005, 10]]), 22),
  K(1736, F(() => fit([body(s.marks.painterSign, 0, 2.0, 0.42), [SIGN9, 1.2, 5.2, 2.6]], 236, 6, 40, 0.9), 1736, 0.0018, [[1786, 0.006, 10]]), 30), // the sign
  K(1818, F(() => ({ pos: [52, 30, 70] as V3, look: [6, 4, 8] as V3, fov: 42 }), 1818, 0.0014), 30),                      // "ten thousand people"
  K(1852, F(() => fit([body(P_BOSS, 0.55, 2.25, 0.5), [[P_BOSS[0] + 0.62, 11.6, 6.72], 0, 0.3, 0.3]], 14, 16, 38, 0.66, 0.1), 1852, 0.0016, [[1868, 0.004, 10]]), 26), // the plate, the calm smile
];
SHOT_ACTS[9] = (f, s) => {
  const tip = sm(f, 1696, 1708) * (1 - sm(f, 1716, 1726));
  return {
    ctl: { dig: 1, water: 1, grow: 1, boats: boats9(f), site: 0, popPaint: lerp(0.15, 1, sm(f, 1746, 1800)), wagon2: 1, bossCar: 1, bossCarHide: 1, lamps: 0, numbered: 0 },
    cast: [
      C("boss", P_BOSS, flow(f, [
        [1615, { expr: "proud", facing: 1, armR: [[26, 30], [30, 52]] as A2 }],
        [1622, { expr: "beam", facing: 1, armL: [[-30, -14], [-46, -50 + 8 * Math.sin(f * 0.4)]] as A2 }, 10],   // waves to a boat
        [1690, { expr: "smile", facing: 1, armR: [[26, 30], [30, 52]] as A2 }, 10],
        [1846, { expr: "calm", facing: 1, armR: [[26, 26], [44, 30]] as A2, armRFront: true }, 10],               // takes out the plate
        [1862, { expr: "calm", facing: 1, armR: [[28, 20], [56, 26]] as A2, armRFront: true }, 10],               // sets it on the stone
        [1876, { expr: "calm", facing: 1, headTilt: 4, armR: [[26, 30], [30, 52]] as A2 }, 12],                   // "All because..."
      ]), { idx: 1 }),
      C("salesA", P_SA, flow(f, [
        [1615, { ...ACT.brochure, expr: "pitch", facing: 1 }],
        [1676, { expr: "neutral", facing: -1, armR: [[26, 30], [30, 52]] as A2, propR: "brochure" }, 10],
        [1712, { ...ACT.iceCream, facing: -1, tilt: -6 }, 10],                                                      // "...finally stopped"
      ]), { idx: 2 }),
      C("salesB", P_SB, flow(f, [
        [1615, { ...ACT.jar, expr: "pitch", facing: 1 }],
        [1680, { expr: "neutral", facing: 1, armR: [[30, 30], [40, 46]] as A2, propR: "sandJar" }, 8],
        [1696, { expr: "grin", facing: 1, armR: [[30, -10], [52, -22]] as A2, armRFront: true, propR: "sandJar", propRAng: -1.4 * tip }, 10], // tips the sand into the river
        [1724, { ...ACT.iceCream, facing: -1, tilt: -6 }, 10],
      ]), { idx: 3 }),
      ...FAM.map((m, i) => { const w = walkPath(9, s, [m.a, m.b], f, 1626 + i * 3, 1676 + i * 3);
        return C(m.who, w.p, w.moving ? pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "beam" }) :
          i === 0 ? pose(null, { ...ACT.photo, expr: "beam", facing: 1 }) : i === 2 ? pose(null, { expr: "eureka", facing: 1, ...PZ.pointRUp }) : i === 3 ? pose(null, { ...ACT.iceCream, facing: -1 }) : pose(null, { expr: "smile", facing: 1, armR: [[24, 30], [30, 50]] as A2 }), { idx: m.idx }); }),
      C("painter", s.marks.painterSign, flow(f, [[1615, { ...ACT.paintUp, expr: "determined", facing: 1 }], [1802, { expr: "beam", facing: -1, ...PZ.cheer }, 10]]), { idx: 24 }),
      ...[0, 1].map((i) => { const b = desertBoat(i, boats9(f)); return C("boater", [b.pos[0], b.pos[1] + 0.42, b.pos[2]], pose(null, { mode: "sit", expr: "beam", facing: i ? 1 : -1, armR: [[30, -14], [44, -50]] as A2 }), { idx: 27 + i }); }),
      C("tourist1", [-5.5, 10.5, -4.6], pose(null, { ...ACT.photo, expr: "smile", facing: 1 }), { idx: 25 }),
      C("tourist2", [-4.2, 10.5, -5.0], pose(null, { expr: "beam", facing: 1, ...PZ.pointRUp }), { idx: 26 }),
    ],
    fx: fxs(...[0, 1, 2, 3].map((i) => sparkle("w" + i, [-10 + i * 7, -0.3, 12 + (i % 2) * 5], ((f - 1615 + i * 9) % 22), 0.9)),
      f >= 1700 && f < 1730 ? dustCard("sandpour", [P_SB[0] + 0.5, lerp(11.2, 4, lin(f, 1700, 1730)), P_SB[2] + 1.2], 0.7, 0.8 * (1 - lin(f, 1716, 1730)), 3) : null,
      f >= 1800 && f < 1814 ? sparkle("pop", [SIGN9[0], 3.6, SIGN9[2]], f - 1800, 1.0) : null,
      f >= 1846 ? plateCard("para", plateP(f), 1, 0.5) : null,
      f >= 1870 && f < 1884 ? sparkle("plate9", [P_BOSS[0] + 0.62, 11.95, 6.72], f - 1870, 0.35) : null),
    focus: f < 1640 ? [1.5, 0.5, -28] : f < 1668 ? [FAM[0].b[0], 11.6, FAM[0].b[2]] : f < 1736 ? [P_SA[0], 11.6, P_SA[2]] : f < 1818 ? [SIGN9[0], 3.2, SIGN9[2]] : f < 1852 ? [6, 6, 8] : [P_BOSS[0], 12, P_BOSS[2]],
    subj: f < 1640 ? null : f < 1668 ? "dad" : f < 1736 ? "salesB" : f < 1818 ? "painter" : f < 1852 ? null : "boss",
  };
};
lens(1615, 3, 1); lens(1640, 4, 24); lens(1668, 6, 20); lens(1736, 4, 24); lens(1818, 0.5, 24); lens(1852, 8, 24);

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
