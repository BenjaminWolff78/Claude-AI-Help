// Per-shot cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "The Rat Poison Gold Medal", set-local coordinates,
// absolute frames. Master prompt v10.5: no two shots in a row with the same subject size and angle; Hicks is centred
// and frontal for at most 30 % of the runtime (three-quarter / profile / over the shoulder); in every place the camera
// TRAVELS to people already there; 2 hard cuts (S14 "poisoning", S19 "dead"), 5 dissolves of 8 f between places;
// every verb is acted with hands or legs; extras already working at different depths; every camera path is checked
// per frame by scripts/qa_run.mjs (collisions, occluders, subject in frame, overlapping bodies).
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

// =====================================================================================================================
// ROAD (light road / roadLate). Runners go toward -z. Zones: well z 98-78, dust z 75-36, orchard (left) z 31-1,
// farm (right) z -6..-52, hill z -40..-125 (car B, the coach's green car). Car A = red officials' car (z 112 -> 26).
import { roadCar, roadSeats, roadRunner, roadX, groundY, roadAt, roadDogLane } from "./sets/road";
type CarW = "A" | "B" | "C";
const cam0 = (c: { pos: V3; look: V3; fov?: number }) => ({ pos: c.pos, look: c.look, fov: c.fov ?? 40 });
/** a camera point relative to a car at u: ahead (along travel), lat (+ = car's left, the runner side), h above the road */
const carPt = (w: CarW, u: number, ahead: number, lat: number, h: number): V3 => {
  const c = roadCar(w, u), d = c.dir, left = [d[2], 0, -d[0]];
  const x = c.pos[0] + d[0] * ahead + left[0] * lat, z = c.pos[2] + d[2] * ahead + left[2] * lat;
  return [x, groundY(x, z) + h, z];
};
const along3 = (w: CarW, u: number, p: V3, ahead: number): V3 => { const d = roadCar(w, u).dir; const x = p[0] + d[0] * ahead, z = p[2] + d[2] * ahead; return [x, groundY(x, z) + (p[1] - groundY(p[0], p[2])), z]; };

// ---------------- the hill: Hicks + the coach's car ----------------
/** car B progress: S01 (hook) and S12-S16 (begging, mixing, the second dose) */
const uHook = (f: number) => 0.3 + 0.00176 * f;
const uHill = (f: number) => 0.18 + 0.0012 * (f - 888);
const hicksAt = (u: number, gap = 1.2): V3 => roadRunner(u, gap);
const seatsB = (u: number) => roadSeats("B", u);
const runO = (f: number, o: P = {}): FigOpts => pose(null, { mode: "run", phase: ph(f, 14), facing: 1, tilt: 4, ...o });

// ---- S01 (0-108) HOOK "A runner won Olympic gold / after his coach kept feeding him / rat poison."
// Frame 1: the coach leans out of the green car and spoons a dark drop from the RAT-B-GONE bottle into Hicks's mouth
// while he runs; Hicks gulps, his eyes pop on "gold"; on "rat poison" the camera pushes onto the skull bottle.
SHOT_CAMS[1] = () => [
  K(0, (f) => { const u = uHook(f); return fit([body(hicksAt(u), 0, 2.1, 0.36), body(seatsB(u).front, -0.1, 1.35, 0.36), body(seatsB(u).driver, 0.3, 1.35, 0.36)], 212, 3, 40, 0.86, 0, 0.05); }),
  K(70, (f) => { const u = uHook(f); return fit([body(hicksAt(u), 1.0, 2.1, 0.3), body(seatsB(u).front, 0.3, 1.35, 0.42)], 205, 6, 38, 0.9, 0.1); }, 26),
];
SHOT_ACTS[1] = (f, s) => {
  const u = uHook(f), H = hicksAt(u), S = seatsB(u), feed = f < 20 ? 1 : 1 - sm(f, 20, 30), gulp = sm(f, 14, 22) * (1 - sm(f, 40, 50)), pop = f >= 29 && f < 60;
  return {
    ctl: { carB: u, dustB: 0.55, hornB: 0, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: pop ? "wired" : gulp > 0.4 ? "gulp" : "strain", sweat: 1, squash: pop ? 0.06 * Math.exp(-(f - 29) / 6) : 0 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: f < 60 ? "determined" : "sly", facing: faceTo(1, s, f, S.front, H),
        armR: [[26, -4], [lerp(46, 30, 1 - feed), lerp(-8, 10, 1 - feed)]] as A2, armRFront: true, propR: "spoon", propK: feed,
        armL: [[-22, 6], [-30, -18]] as A2, armLFront: true, propL: "poisonBottle", mouth: talk(f, 60, 100), tilt: 6 * feed })),
      C("helper", S.driver, pose(null, { mode: "sit", expr: "neutral", facing: faceTo(1, s, f, S.driver, H), armR: [[22, 14], [36, 10]] as A2 }), { idx: 2 }),
      C("fan1", roadAt(-6.4, -73), pose(null, { expr: "shock", facing: 1, armR: ARMS.upR, armRFront: true }), { idx: 3 }),
      C("lady2", roadAt(-6.5, -70.2), pose(null, { expr: "dismay", facing: 1, propR: "parasol2", armR: [[24, -10], [30, -40]] as A2, armRFront: true }), { idx: 4 }),
    ],
    fx: fxs(pop ? bang([H[0], H[1] + 2.25, H[2]], f - 29) : null, sparkle("bottle", [S.front[0], S.front[1] + 1.3, S.front[2]], f - 82, 0.25)),
    focus: f < 70 ? [H[0], H[1] + 1.6, H[2]] : [S.front[0], S.front[1] + 0.9, S.front[2]], subj: "hicks",
  };
};
lens(0, 6, 1); lens(70, 10, 16);

// ---- S05 (327-357) "...well." the map icon dissolves into the real well seen from above; the camera tips down to a
// high angle where six runners shove round the one bucket and one gulps from it.
const W_WELL = roadAt(6.6, 88);
const wellRing = (i: number): V3 => { const a = (i / 6) * Math.PI * 2 + 0.4; return [W_WELL[0] + Math.cos(a) * 1.45, W_WELL[1] + 0.035, W_WELL[2] + Math.sin(a) * 1.45]; };
SHOT_CAMS[5] = (s) => [
  K(327, F(() => cam0(s.cams.wellTop), 327, 0.002)),
  K(333, F(() => cam0(s.cams.wellHigh), 333, 0.002), 24),
];
SHOT_ACTS[5] = (f, s) => ({
  ctl: { bucket: 0.6 + 0.4 * Math.sin(f * 0.08), carA: 0, haze: 1, dog: 0, carB: 0.5 },
  cast: [
    C("runner4", s.marks.wellDrinker, pose(null, { expr: "gulp", facing: 1, armR: [[24, -10], [30, -30]] as A2, armRFront: true, propR: "bucket", tilt: -8 })),
    ...["runner1", "runner2", "dustRunner", "runner5", "runner6"].map((who, i) => C(who, wellRing(i + 1), pose(null, { expr: i % 2 ? "angry" : "strain", facing: i % 2 ? 1 : -1, sweat: 1,
      tilt: 8 * Math.sin(st(f, 2) * 0.9 + i), armR: [[26, 6], [50, 0 + 10 * Math.sin(f * 0.5 + i)]] as A2, armRFront: true }), { idx: 10 + i })),
  ],
  focus: W_WELL, subj: null,
});
lens(327, 0, 1);

// ---- S06 (357-482) "Cars full of officials drive ahead, / kicking dust / in every runner's face. / 'Keep up, boys!'"
// Start among the coughing pack in the dust bank, the red officials' car rolls past them (dust billows), the camera
// travels forward alongside the car to the official in the back seat, who turns, waves his boater and shouts.
const uA = (f: number) => Math.min(1, 0.40 + 0.0026 * (f - 357));
const PACK = ["runner1", "runner2", "runner3", "runner5"];
const packAt = (i: number, f: number): V3 => { const base = [roadAt(-1.5, 66.8), roadAt(-0.3, 65.2), roadAt(1.0, 66.0), roadAt(0.1, 63.6)][i]; return roadAt(base[0] - roadX(base[2]), base[2] - 0.075 * Math.max(0, f - 357)); };
const packer = (i: number, f: number, cough = 1): CastPlace => {
  const p = packAt(i, f), c = Math.sin(st(f, 2) * 0.8 + i * 1.7);
  return C(PACK[i], p, runO(f + i * 4, { expr: cough && c > 0.2 ? "strain" : "dismay", sweat: 1, armL: cough && i % 2 ? [[-20, -4], [-6 + 10 * c, -26]] as A2 : undefined, armLFront: true, mouth: cough && c > 0.6 ? "O" : undefined }), { idx: 10 + i });
};
SHOT_CAMS[6] = () => [
  K(357, F((f) => { const p = packAt(1, f); return { pos: roadAt(-3.2, 79, 5.2), look: [p[0] + 0.2, p[1] + 1.0, p[2]], fov: 40 }; }, 357, 0.0014), 18),
  K(384, F((f) => { const p = packAt(1, f); return { pos: [roadX(p[2]) - 4.2, p[1] + 1.55, p[2] - 3.4], look: [p[0] + 0.4, p[1] + 1.25, p[2] + 0.6], fov: 40 }; }, 384, 0.0014), 30),
  K(424, (f) => { const u = uA(f), s = roadSeats("A", u).rear; return { pos: carPt("A", u, 2.6, 3.6, 1.9), look: [s[0], s[1] + 0.75, s[2]] as V3, fov: 38 }; }, 34),
];
SHOT_ACTS[6] = (f, s) => {
  const u = uA(f), S = roadSeats("A", u), yell = f >= 456;
  return {
    ctl: { carA: u, dustA: sm(f, 395, 410), dustBank: lerp(0.25, 0.7, sm(f, 400, 420)), haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      ...[0, 1, 2, 3].map((i) => packer(i, f)),
      C("official", S.rear, pose(null, { mode: "sit", expr: yell ? "laugh" : "smug", facing: faceTo(6, s, f, S.rear, packAt(1, f)), mouth: talk(f, 461, 478),
        armR: yell ? [[24, -26], [30 + 6 * Math.sin(f * 0.6), -62]] as A2 : [[24, 10], [34, 20]] as A2, armRFront: true, hatLift: (0.2 + 0.04 * Math.sin(f * 0.6)) * sm(f, 456, 462), headTilt: yell ? 6 : 0 })),
      C("driver", S.driver, pose(null, { mode: "sit", expr: "smug", facing: -1, armR: [[22, 10], [36, 6]] as A2 }), { idx: 2 }),
      C("farmer2", roadAt(-6.5, 63.2), pose(null, { expr: "dismay", facing: 1, armR: [[26, 10], [20, -26]] as A2, armRFront: true }), { idx: 4 }),
    ],
    fx: fxs(f >= 386 ? dustTrail("dA", roadCar("A", u).pos, [roadCar("A", u).dir[0], roadCar("A", u).dir[2]], f, 7, 0.9, 1.1) : null),
    focus: f < 424 ? [packAt(1, f)[0], 1.5, packAt(1, f)[2]] : [S.rear[0], S.rear[1] + 0.8, S.rear[2]], subj: f < 424 ? "runner2" : "official",
  };
};
lens(357, 2, 1); lens(424, 4, 20);

// ---- S07 (482-553) "The dust is so thick / the runners could chew it."
// The camera glides back to a close three-quarter on a runner in the dust: he grabs a fistful of the cloud, bites a
// chunk out of it and chews with a grimace.
SHOT_CAMS[7] = () => [
  K(482, F((f) => fit([body(packAt(2, f), 0.7, 2.15, 0.34)], 228, 3, 38, 0.66, -0.05), 482, 0.0024, [[536, 0.006, 12]]), 30),
];
SHOT_ACTS[7] = (f, s) => {
  const p = packAt(2, f), grab = sm(f, 494, 506), bite = f >= 530, chew = f >= 533;
  const hand: V3 = [p[0] + 0.32, p[1] + 1.5 + 0.15 * grab, p[2] + 0.05];
  return {
    ctl: { carA: uA(f), dustA: 0.25, dustBank: 0.2, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      ...[0, 1, 3].map((i) => packer(i, f)),
      C("runner3", p, runO(f, { expr: chew ? "strain" : grab > 0.5 ? "sly" : "dismay", sweat: 1, mouth: chew ? (Math.floor(f / 4) % 2 ? "teeth" : "o") : bite ? "O" : undefined,
        armR: [[22, -6], [lerp(40, 22, grab), lerp(20, -30, grab)]] as A2, armRFront: true }), { idx: 12 }),
    ],
    fx: fxs(dustCard("chunk", [hand[0], hand[1] + 0.05, hand[2]], bite ? 0.16 : 0.22, 1, 3),
      bite && f < 540 ? sparkle("bite", [hand[0], hand[1] + 0.12, hand[2] - 0.08], f - 530, 0.18, "#f6e8c8") : null,
      null),
    focus: [p[0], p[1] + 1.6, p[2]], subj: "runner3",
  };
};
lens(482, 5, 16);

// ---- S08 (553-626) "One runner / breathes in so much / he nearly dies."
// Low angle from the ditch: a runner takes a giant breath (chest balloons, dust swirls into his mouth), coughs a puff,
// wobbles and keels over into the ditch with his legs up and dizzy stars; a farmer at his wheelbarrow stops and stares.
const D_RUN = roadAt(2.0, 52.6), D_EDGE = roadAt(3.15, 51.3), D_DITCH = roadAt(4.6, 51.0);
const dustManAt = (f: number): V3 => f < 585 ? lerp3(roadAt(1.6, 55.2), D_RUN, sm(f, 553, 572)) : lerp3(D_RUN, D_EDGE, sm(f, 585, 600));
SHOT_CAMS[8] = (s) => [
  K(553, F(() => fit([body(D_RUN, 0, 2.0, 0.35), [D_DITCH, -0.6, 0.6, 1.0]], 255, 24, 40, 0.84), 553, 0.0022, [[604, 0.006, 12]]), 30),
];
SHOT_ACTS[8] = (f, s) => {
  const breathe = sm(f, 566, 578) * (1 - sm(f, 582, 586)), down = f >= 602, p = down ? D_DITCH : dustManAt(f);
  return {
    ctl: { carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      C("dustRunner", p, down
        ? pose(null, { mode: "lie", expr: "dizzy", legsUp: lerp(1, 0.6, sm(f, 604, 616)), facing: 1 })
        : f < 585 ? runO(f, { expr: breathe > 0.3 ? "gulp" : "strain", squash: -0.12 * breathe, sweat: 1 })
          : pose(null, { mode: "stagger", phase: ph(f, 16), expr: "dizzy", facing: 1, tilt: lerp(0, 28, sm(f, 594, 602)) }),
        down ? { roll: Math.PI / 2, blob: false } : {}),
      C("farmer1", s.marks.barrowFarmer, pose(null, { expr: down ? "shock" : "neutral", facing: 1, armR: [[24, 20], [36, 34]] as A2, armL: [[-10, 24], [12, 36]] as A2, armRFront: true }), { idx: 3 }),
      C("fan2", roadAt(6.8, 58), pose(null, { expr: down ? "shock" : "dismay", facing: -1 }), { idx: 4 }),
    ],
    fx: fxs(breathe > 0.2 ? dustCard("inhale", lerp3([p[0] - 0.6, p[1] + 1.7, p[2] + 0.4], [p[0], p[1] + 1.75, p[2]], breathe), 0.5 * (1 - breathe) + 0.15, 0.9, 1) : null,
      f >= 585 && f < 600 ? dustCard("cough", [p[0] + 0.1 + 0.02 * (f - 585), p[1] + 1.8, p[2] - 0.3], 0.3 + 0.03 * (f - 585), 1 - lin(f, 585, 600), 2) : null,
      down ? dizzy([D_DITCH[0], D_DITCH[1] + 0.55, D_DITCH[2]], f, 0.22) : null),
    focus: [p[0], p[1] + 1.2, p[2]], subj: null,
  };
};
lens(553, 6, 16);

// ---- S09 (626-770) "Another, a mailman from Cuba, / gets hungry, / eats rotten apples off a tree, / and lies down for a nap."
// The camera rises over the left fence into the orchard to the mailman, already under an apple tree: his stomach
// growls (he clutches it), he plucks a brown apple and chomps it, his face goes green, and he flops down in the shade
// with his cap over his eyes - Zzz. A farmer picks apples on a ladder behind him; the cow grazes.
const M_EAT = roadAt(-8.0, 20.6), M_NAP = roadAt(-8.4, 19.4);
SHOT_CAMS[9] = (s) => [
  K(626, F(() => ({ pos: roadAt(-3.6, 34, 4.2), look: [M_EAT[0], M_EAT[1] + 1.4, M_EAT[2]], fov: 40 }), 626, 0.001), 34),
  K(662, F(() => fit([body(M_EAT, 0, 2.1, 0.4)], 150, 4, 40, 0.58, 0.25), 662, 0.0022, [[692, 0.005, 12]]), 38),
  K(732, F(() => fit([[M_NAP, 0, 0.6, 1.0]], 140, 18, 40, 0.62), 732, 0.0024), 26),
];
SHOT_ACTS[9] = (f, s) => {
  const growl = f >= 668 && f < 690, reach = sm(f, 688, 696) * (1 - sm(f, 700, 706)), bite = f >= 706, green = sm(f, 712, 722), lie = f >= 740;
  return {
    ctl: { carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      C("mailman", lie ? M_NAP : M_EAT, lie
        ? pose(null, { mode: "lie", expr: "sleep", legsUp: 0.15, facing: 1, sick: 0.5 })
        : pose(null, { expr: green > 0.3 ? "green" : growl ? "dismay" : "neutral", sick: green, facing: faceTo(9, s, f, M_EAT, roadAt(-9.6, 19.5)),
          armL: growl || green > 0 ? [[-14, 24], [6, 34]] as A2 : undefined, armLFront: true,
          armR: [[24, -20], [lerp(32, 30, reach), lerp(-20, -64, reach)]] as A2, armRFront: true, propR: f >= 694 ? "rottenApple" : undefined,
          mouth: bite && f < 716 ? (Math.floor(f / 4) % 2 ? "teeth" : "O") : undefined }),
        lie ? { roll: Math.PI / 2, blob: false } : {}),
      C("farmer2", s.marks.ladderFarmer, pose(null, { expr: "smile", facing: -1, armR: [[24, -24], [30, -58 + 6 * Math.sin(st(f) * 0.5)]] as A2, armRFront: true, propR: "apple" }), { idx: 3 }),
      C("farmKid", roadAt(-13.8, 26.4), pose(null, { expr: lie ? "laugh" : "smile", facing: -1, armR: [[24, 20], [30, 36]] as A2, armRFront: true, propR: "apple" }), { idx: 4 }),
    ],
    fx: fxs(growl ? squiggles("growl", [M_EAT[0] + 0.3, M_EAT[1] + 0.9, M_EAT[2] - 0.2], f, "#ffffff", 0.22) : null, lie ? zzz([M_NAP[0] - 0.6, M_NAP[1] + 0.45, M_NAP[2]], f) : null),
    focus: lie ? [M_NAP[0], M_NAP[1] + 0.4, M_NAP[2]] : [M_EAT[0], M_EAT[1] + 1.5, M_EAT[2]], subj: lie ? null : "mailman",
  };
};
lens(626, 0, 1); lens(662, 7, 20);

// ---- S10 (770-842) "A third / gets chased / a mile off course / by a dog."
// The camera flies low over the farm fence to the dog lane: the farm dog bursts after a runner, who sprints off the
// course into the corn past a "COURSE ->" sign pointing the other way; the farmer's kid points and laughs.
const dogU = (f: number) => lin(f, 790, 842) * 0.7;
SHOT_CAMS[10] = () => [
  K(770, F(() => ({ pos: roadAt(-2.5, -4, 5.0), look: roadAt(3, -26, 1.0), fov: 40 }), 770, 0.001), 36),
  K(794, F((f) => { const r = roadDogLane(Math.min(1, dogU(f) + 0.14)), c = roadAt(0.6, -23.8, 1.45); return { pos: c, look: [lerp(r[0], c[0], 0.15), r[1] + 0.9, lerp(r[2], c[2], 0.15)], fov: 30 }; }, 794, 0.0014), 22),
  K(830, F(() => ({ pos: roadAt(-3, -14, 20), look: roadAt(-3, 26, 0), fov: 40 }), 830, 0.0016), 46),
];
SHOT_ACTS[10] = (f, s) => {
  const r = roadDogLane(Math.min(1, dogU(f) + 0.14)), started = f >= 788;
  return {
    ctl: { dog: started ? Math.max(0.001, dogU(f)) : 0, carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, bucket: 1 },
    cast: [
      C("dogRunner", started ? r : roadAt(1.2, -24), started ? runO(f, { expr: "shock", sweat: 1, facing: 1, tilt: 8, armR: ARMS.upR }) : runO(f, { expr: "determined" })),
      C("farmKid", roadAt(4.6, -21.6), pose(null, { expr: started ? "laugh" : "smile", facing: 1, armR: [[24, -6], [50, -12]] as A2, armRFront: true }), { idx: 3 }),
      C("farmer1", s.marks.farmYard, pose(null, { expr: started ? "shock" : "neutral", facing: 1, armR: ARMS.upR }), { idx: 4 }),
    ],
    fx: fxs(started ? speedLines(r, f, 4, 0.9, [0.6, 0.8]) : null, started ? bang([r[0], r[1] + 2.2, r[2]], f - 790) : null),
    focus: [r[0], r[1] + 1.2, r[2]], subj: started ? "dogRunner" : null,
  };
};
lens(770, 0, 1); lens(796, 4, 16);

// ---- S11 (842-888) "So how does anyone win this?" High crane over the whole course: the ditch, the napper, the dog
// chase, the dust cloud - then the 8 f dissolve to the hill in the late sun.
SHOT_CAMS[11] = () => [
  K(842, F(() => ({ pos: roadAt(-3, -14, 20), look: roadAt(-3, 26, 0), fov: 40 }), 842, 0.0016), 34),
];
SHOT_ACTS[11] = (f, s) => ({
  ctl: { dog: 0.95, carA: 0.95, dustA: 1, dustBank: 0.3, haze: 1, carB: 0.5, carBHide: 1, bucket: 1 },
  cast: [
    C("dustRunner", D_DITCH, pose(null, { mode: "lie", expr: "dizzy", legsUp: 0.6, facing: 1 }), { roll: Math.PI / 2, blob: false }),
    C("mailman", M_NAP, pose(null, { mode: "lie", expr: "sleep", legsUp: 0.15, facing: 1 }), { roll: Math.PI / 2, blob: false, idx: 2 }),
    C("dogRunner", roadDogLane(1), runO(f, { expr: "shock" }), { idx: 3 }),
    ...[0, 1, 2, 3].map((i) => C(PACK[i], packAt(i, f - 200), runO(f + i * 4, { expr: "strain" }), { idx: 10 + i })),
  ],
  fx: fxs(zzz([M_NAP[0] - 0.6, M_NAP[1] + 0.5, M_NAP[2]], f)),
  focus: roadAt(0, 30, 0), subj: null,
});
lens(842, 0, 1);

// ---- S12 (888-965) "It's Thomas Hicks, / who's begging his coach for water."
// Dissolve to the hill in the late sun: Hicks jogs up beside the green car, hands clasped, tongue out, begging; the
// coach in the passenger seat holds the water jug. Crane down onto Hicks, then over the coach's shoulder.
SHOT_CAMS[12] = () => [
  K(888, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 6.5, 4.4, lerp(4.2, 2.1, sm(f, 888, 920))), look: [H[0], H[1] + 1.35, H[2]], fov: 40 }; }),
  K(922, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: [S[0] - 0.25, S[1] + 0.85, S[2] + 0.0].map((v, i) => v + roadCar("B", u).dir[i] * -0.7) as V3, look: [H[0], H[1] + 1.45, H[2]], fov: 40 }; }, 28),
];
const hillExtras = (f: number): CastPlace[] => [
  C("fan3", roadAt(-6.5, -70.2), pose(null, { expr: "smile", facing: 1, armR: [[24, -20], [30, -50 + 6 * Math.sin(st(f) * 0.6)]] as A2, armRFront: true }), { idx: 20 }),
  C("lady1", roadAt(-6.4, -73), pose(null, { expr: "smile", facing: 1, propR: "parasol", armR: [[24, -10], [30, -40]] as A2, armRFront: true }), { idx: 21 }),
  C("farmer2", roadAt(-8.0, -71.6), pose(null, { expr: "neutral", facing: 1, armR: [[24, 20], [36, 30]] as A2, armRFront: true, propR: "jug" }), { idx: 22 }),
];
SHOT_ACTS[12] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), beg = f >= 916;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: beg ? "dismay" : "strain", sweat: 1, mouth: beg ? "O" : undefined, armR: beg ? [[18, -4], [10, -20]] as A2 : undefined, armL: beg ? [[-18, -4], [-8, -20]] as A2 : undefined, armRFront: true, armLFront: true })),
      C("coach", S.front, pose(null, { mode: "sit", expr: "smug", facing: faceTo(12, s, f, S.front, H), back: f >= 940, armR: [[26, 10], [36, -6]] as A2, armRFront: true, propR: "jug" })),
      ...(f < 922 ? [C("helper", S.driver, pose(null, { mode: "sit", expr: "neutral", facing: -1 }), { idx: 2 })] : []),
      ...hillExtras(f),
    ],
    fx: fxs(beg ? sweatDrops(H, f) : null),
    focus: [H[0], H[1] + 1.5, H[2]], subj: "hicks",
  };
};
const sweatDrops = (H: V3, f: number): FxSpec[] => [0, 1].map((i) => ({ kind: "card", key: "sweat" + i, pos: [H[0] + (i ? 0.28 : -0.26), H[1] + 2.0 - 0.02 * ((f + i * 7) % 14), H[2]], w: 0.07, h: 0.1, cw: 32, ch: 48,
  draw: (p) => { const g = p.g; g.fillStyle = "#bfe8ff"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.beginPath(); g.moveTo(16, 2); g.quadraticCurveTo(30, 30, 16, 44); g.quadraticCurveTo(2, 30, 16, 2); g.fill(); g.stroke(); } } as FxSpec));
lens(888, 6, 1); lens(922, 9, 20);

// ---- S13 (965-1102) "His coach says no / and mixes him something else: / raw egg, / brandy, / and a pinch / of rat poison."
// The coach wags a finger "no" and tucks the jug away; then (high angle onto his hands) cracks an egg into a tumbler,
// glugs in brandy and taps in a pinch from the RAT-B-GONE tin (sparkle); tilt up to Hicks's worried face.
SHOT_CAMS[13] = () => [
  K(965, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 2.6, 3.3, 1.75), look: lerp3([S[0], S[1] + 0.8, S[2]], [H[0], H[1] + 1.5, H[2]], 0.5), fov: 40 }; }, 20),
  K(1022, (f) => { const u = uHill(f), S = seatsB(u).front; return { pos: carPt("B", u, 1.1, 1.95, 2.35), look: [S[0], S[1] + 0.55, S[2]] as V3, fov: 38 }; }, 24),
  K(1086, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 1.9, 2.6, 2.0), look: lerp3([S[0], S[1] + 0.7, S[2]], [H[0], H[1] + 1.55, H[2]], 0.65), fov: 40 }; }, 16),
];
SHOT_ACTS[13] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), no = f >= 970 && f < 996, egg = f >= 1026 && f < 1046, brandy = f >= 1046 && f < 1064, pinch = f >= 1064, wag = Math.sin(f * 0.8);
  const fill = sm(f, 1032, 1040) * 0.4 + sm(f, 1050, 1060) * 0.35 + sm(f, 1072, 1080) * 0.1;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: f > 1080 ? "shock" : no ? "dismay" : "strain", sweat: 1 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: no ? "smug" : pinch ? "sly" : "determined", facing: faceTo(13, s, f, S.front, H), mouth: talk(f, 972, 990),
        armR: no ? [[24, -20], [30 + 6 * wag, -48]] as A2 : egg ? [[24, -6], [36, -14 + 6 * Math.sin(f * 0.5)]] as A2 : brandy ? [[24, -12], [30, -26]] as A2 : pinch ? [[24, -10], [32, -22 + 4 * Math.sin(f * 1.2)]] as A2 : [[24, 10], [34, 20]] as A2,
        armRFront: true, propR: no ? undefined : egg ? "egg" : brandy ? "brandy" : pinch ? "poisonTin" : undefined, propRAng: brandy ? 1.2 : pinch ? 0.9 : 0,
        armL: [[-20, 10], [-14, 0]] as A2, armLFront: true, propL: f >= 996 ? "tumbler" : "jug", propK: fill })),
      ...(f < 1022 || f >= 1086 ? [C("helper", S.driver, pose(null, { mode: "sit", expr: f > 1060 ? "dismay" : "neutral", facing: -1 }), { idx: 2 })] : []),
      ...hillExtras(f),
    ],
    fx: fxs(sparkle("pinch", [S.front[0], S.front[1] + 0.75, S.front[2]], f - 1080, 0.22), egg ? sparkle("egg", [S.front[0], S.front[1] + 0.75, S.front[2]], f - 1034, 0.14, "#ffffff") : null),
    focus: f < 1022 || f >= 1086 ? [H[0], H[1] + 1.5, H[2]] : [S.front[0], S.front[1] + 0.6, S.front[2]], subj: f < 1022 || f >= 1086 ? "hicks" : null,
  };
};
lens(965, 6, 1); lens(1022, 11, 16); lens(1086, 7, 14);

// ---- S14 (1102-1156) "An official yells, / 'You're poisoning him!'" A race official at the MILE 19 post sees the
// tumbler go to Hicks's lips; HARD CUT 1 on "poisoning": low angle on the official, megaphone up, pointing, yelling.
const OFF19 = roadAt(-4.4, -82);
SHOT_CAMS[14] = () => [
  K(1102, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 5.5, 5.2, 1.6), look: lerp3([H[0], H[1] + 1.3, H[2]], [OFF19[0], OFF19[1] + 1.4, OFF19[2]], 0.35), fov: 40 }; }, 20),
  K(1128, F(() => ({ pos: [OFF19[0] + 1.3, OFF19[1] + 0.45, OFF19[2] - 1.3], look: [OFF19[0] - 0.1, OFF19[1] + 1.75, OFF19[2] + 0.1], fov: 40 }), 1128, 0.003, [[1130, 0.006, 12]]), 1, true),
];
SHOT_ACTS[14] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), yell = f >= 1126;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: "dismay", sweat: 1, armR: [[18, -10], [8, -26]] as A2, armRFront: true, propR: "tumbler", propK: 0.85 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: "smug", facing: faceTo(14, s, f, S.front, H) })),
      C("organizer", OFF19, pose(null, { expr: yell ? "angry" : "shock", facing: faceTo(14, s, f, OFF19, H), mouth: talk(f, 1130, 1146), sweat: yell ? 1 : 0,
        armR: [[22, -10], [16, -30]] as A2, armRFront: true, propR: "megaphone", propRAng: -0.4, armL: yell ? [[-26, -10], [-56, -16]] as A2 : undefined, squash: yell ? 0.06 * Math.exp(-(f - 1128) / 5) : 0 }), { idx: 5 }),
      ...hillExtras(f),
    ],
    fx: fxs(yell ? bang([OFF19[0], OFF19[1] + 2.3, OFF19[2]], f - 1128) : null),
    focus: f < 1128 ? [H[0], H[1] + 1.5, H[2]] : [OFF19[0], OFF19[1] + 1.6, OFF19[2]], subj: f < 1128 ? "hicks" : "organizer",
  };
};
lens(1102, 5, 1); lens(1128, 8, 1);

// ---- S15 (1156-1202) "The coach shrugs. / 'Just a pinch.'" Profile two-shot alongside the car: a big shrug
// (shoulders, palms and brows up), then he holds up a tiny pinch between finger and thumb.
SHOT_CAMS[15] = () => [
  K(1156, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 0.9, 4.6, 1.75), look: lerp3([S[0], S[1] + 0.8, S[2]], [H[0], H[1] + 1.5, H[2]], 0.4), fov: 38 }; }, 22),
];
SHOT_ACTS[15] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), shrug = sm(f, 1162, 1170) * (1 - sm(f, 1180, 1186)), pinch = f >= 1182;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: "dismay", sweat: 1 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: pinch ? "sly" : shrug > 0.3 ? "sheepish" : "smug", facing: faceTo(15, s, f, S.front, [OFF19[0], 0, OFF19[2] + 6]), mouth: talk(f, 1183, 1194),
        armR: pinch ? ARMS.pinchR : [[30, lerp(10, -12, shrug)], [lerp(40, 52, shrug), lerp(16, -10, shrug)]] as A2, armL: [[-30, lerp(10, -12, shrug)], [lerp(-40, -52, shrug), lerp(16, -10, shrug)]] as A2,
        armRFront: true, armLFront: true, squash: 0.05 * shrug, headTilt: 6 * shrug })),
      C("helper", S.driver, pose(null, { mode: "sit", expr: "dismay", facing: -1 }), { idx: 2 }),
      ...hillExtras(f),
    ],
    fx: fxs(pinch ? sparkle("pinch2", [S.front[0] + 0.2, S.front[1] + 1.15, S.front[2]], f - 1186, 0.16) : null),
    focus: [S.front[0], S.front[1] + 0.9, S.front[2]], subj: "coach",
  };
};
lens(1156, 6, 16);

// ---- S16 (1202-1243) "Then he gives him another one." Hicks gulps the second tumbler; his hair stands up, his eyes go
// wired, and he zooms ahead of the car with speed lines and a burst of dust; 8 f dissolve to the drugstore (night).
SHOT_CAMS[16] = () => [
  K(1202, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 3.6, 3.8, 1.55), look: [H[0], H[1] + 1.4, H[2]], fov: 40 }; }, 20),
];
SHOT_ACTS[16] = (f, s) => {
  const u = uHill(f), S = seatsB(u), hand = sm(f, 1206, 1214), gulp = sm(f, 1214, 1226), zoom = f >= 1228;
  const H = along3("B", u, hicksAt(u), zoom ? 0.12 * (f - 1228) ** 1.4 : 0);
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(zoom ? f * 2 : f, { expr: zoom ? "wired" : gulp > 0.2 ? "gulp" : "dismay", sweat: zoom ? 0 : 1, tilt: zoom ? 18 : 4, hatLift: 0,
        armR: gulp > 0 && !zoom ? [[18, -10], [8, -30]] as A2 : undefined, armRFront: true, propR: hand > 0.5 && !zoom ? "tumbler" : undefined, propK: 0.85 * (1 - gulp), propRAng: -1.0 * gulp })),
      C("coach", S.front, pose(null, { mode: "sit", expr: zoom ? "eureka" : "sly", facing: faceTo(16, s, f, S.front, H), armR: [[26, -4], [lerp(36, 50, hand), lerp(10, -10, hand)]] as A2, armRFront: true, propR: hand < 0.5 ? "tumbler" : undefined, propK: 0.85 })),
      ...hillExtras(f),
    ],
    fx: fxs(zoom ? speedLines(H, f, 6, 1.4, [-roadCar("B", u).dir[0], -roadCar("B", u).dir[2]]) : null, zoom ? dustCard("burst", along3("B", u, H, -0.8), 1.1, 0.9 * (1 - lin(f, 1228, 1243)), 4) : null,
      sparkle("zap", [H[0], H[1] + 2.2, H[2]], f - 1226, 0.35, "#ffe95a")),
    focus: [H[0], H[1] + 1.5, H[2]], subj: "hicks",
  };
};
lens(1202, 6, 1);

// =====================================================================================================================
// STADIUM (start: light "stadium"; finish: light "finish"). Track home straight along x (z -4.5..4.5), runners leave
// toward +x (gate at x 60), arrive at the finish from +x (tape at x -8). Map board face z 9.75 (x 39.4..44.6, y 1..7),
// well icon on it at about [41.69, 5.2, 9.69]. Thermometer [46.8, 0, 9.4], organizer's table [49.4, 0, 7.2].
import { STADIUM_WELL } from "./sets/stadium";
const ST_STARTER: V3 = [34.9, 1.0, 6.9], ST_ORG: V3 = [49.05, 0, 8.12], ST_THIRSTY: V3 = [49.72, 0, 6.22], ST_JUG: V3 = [49.75, 0.78, 6.98];
const ST_FAN: V3 = [45.6, 0, 8.0], ST_POINTER: V3 = [43.9, 0, 8.7], ST_THERMO_TOP: V3 = [46.8, 4.2, 9.2];
const ST_RUNNERS: [string, V3][] = [["runner1", [33, 0, -3.6]], ["dustRunner", [33, 0, -1.8]], ["mailman", [33, 0, 0]], ["hicks", [33, 0, 1.8]], ["runner2", [33, 0, 3.6]],
  ["lorz", [31.5, 0, -3.6]], ["runner3", [31.5, 0, -1.8]], ["dogRunner", [31.5, 0, 0]], ["runner4", [31.5, 0, 1.8]], ["runner5", [31.5, 0, 3.6]]];
const GUN = 126; // "1904" - the pistol fires
const startRunX = (x0: number, i: number, f: number) => x0 + (f < GUN + 2 ? 0 : 0.5 * 0.0026 * Math.min(f - GUN - 2, 50) ** 2 + 0.13 * Math.max(0, f - GUN - 52)) * (0.92 + 0.02 * (i % 5));

// ---- S02 (108-201) "You see, / the 1904 marathon / is 25 miles / of dusty road"
// Dissolve in on a low angle: the starter on his stand raises the pistol over the crouching runners and fires on "1904"
// (smoke puff, kick); the runners burst off the line. The camera cranes up over them to the course map, where an
// official traces the long dusty road with his pointer on "25 miles".
SHOT_CAMS[2] = () => [
  K(108, F(() => fit([body(ST_STARTER, 0, 2.1, 0.4)], 120, -9, 40, 0.5, 0.35, 0.25), 108, 0.0022, [[GUN, 0.006, 10]])),
  K(140, F((f) => ({ pos: [lerp(40.4, 41.9, sm(f, 140, 200)), 3.3, -3.4], look: [41.9, 4.1, 9.7], fov: 42 }), 140, 0.0018), 36),
];
SHOT_ACTS[2] = (f, s) => {
  const fired = f >= GUN, aim = sm(f, 108, 118), trace = sm(f, 160, 196);
  return {
    ctl: { smoke: fired ? lin(f, GUN, GUN + 46) : 0, temp: 0.2, crowd: fired ? 0.35 + 0.3 * Math.exp(-(f - GUN) / 20) : 0.2, wellGlow: 0, tape: 0, confetti: 0 },
    cast: [
      C("starter", ST_STARTER, pose(null, { expr: fired ? "eureka" : "determined", facing: -1, armR: fired ? [[22, -26], [26, lerp(-66, -58, Math.exp(-(f - GUN) / 4))]] as A2 : [[22, -20], [lerp(30, 26, aim), lerp(-30, -62, aim)]] as A2, armRFront: true, propR: "pistol", propRAng: -1.4,
        armL: [[-20, -12], [-14, -34]] as A2, squash: fired ? 0.08 * Math.exp(-(f - GUN) / 4) : 0 })),
      ...ST_RUNNERS.map(([who, p], i) => {
        const x = startRunX(p[0], i, f), go = f >= GUN + 2;
        return C(who, [x, 0, p[2]], pose(null, go ? { mode: "run", phase: ph(f + i * 5, 12), expr: "determined", facing: 1 } : { expr: "determined", facing: 1, tilt: 10, armR: [[20, 20], [34, 30]] as A2, armL: [[-10, 24], [10, 36]] as A2 }), { idx: 10 + i });
      }),
      C("fan3", ST_POINTER, pose(null, { expr: "talk", facing: 1, mouth: talk(f, 160, 196), armR: [[24, -20], [lerp(40, 54, trace), lerp(-40, -30, trace) + 10 * Math.sin(f * 0.3) * trace]] as A2, armRFront: true }), { idx: 30 }),
      C("organizer", ST_ORG, pose(null, { expr: "smug", facing: -1, armR: [[22, 10], [30, -10]] as A2, armRFront: true, propR: "clipboard" }), { idx: 31 }),
    ],
    fx: fxs(sparkle("gun", [ST_STARTER[0] - 0.1, 3.0, ST_STARTER[2] - 0.6], f - GUN, 0.5, "#fff1c4")),
    focus: f < 140 ? [ST_STARTER[0], 2.2, ST_STARTER[2]] : [41.8, 4.4, 9.7], subj: null,
  };
};
lens(108, 8, 1); lens(140, 0, 24);

// ---- S03 (201-291) "in 90-degree heat, / and the organizer wants to study thirst."
// The camera travels along the wall to the giant thermometer: the mercury shoots up to 90 and the top shimmers, a fan
// fans himself. Then it travels on, over the shoulder of a thirsty runner, to the organizer at his THIRST STUDY table:
// he sips water, notes something on his clipboard, and wags a finger at the runner reaching for the jug.
SHOT_CAMS[3] = () => [
  K(201, F(() => ({ pos: [44.6, 1.6, 3.4], look: [46.4, 3.0, 9.2], fov: 42 }), 201, 0.002, [[221, 0.006, 12]]), 28),
  K(244, F(() => fit([body(ST_ORG, 0.3, 2.15, 0.36), body(ST_THIRSTY, 0.3, 2.0, 0.32)], 292, 5, 40, 0.86), 244, 0.0022, [[272, 0.005, 12]]), 30),
];
SHOT_ACTS[3] = (f, s) => {
  const sip = sm(f, 252, 258) * (1 - sm(f, 264, 270)), wag = f >= 270 ? Math.sin((f - 270) * 0.7) : 0, reach = sm(f, 256, 268);
  return {
    ctl: { temp: lerp(0.2, 1, sm(f, 210, 228)), crowd: 0.2, smoke: 1, wellGlow: 0, tape: 0, confetti: 0 },
    cast: [
      C("fan2", f < 240 ? ST_FAN : [44.4, 0, 9.3], pose(null, { expr: f > 222 ? "dismay" : "neutral", facing: 1, sweat: sm(f, 218, 230), armR: [[26, 6], [30 + 8 * Math.sin(st(f, 2) * 0.9), -20]] as A2, armRFront: true, headTilt: 4 * Math.sin(f * 0.05) })),
      C("organizer", ST_ORG, pose(null, { expr: f > 270 ? "smug" : sip > 0.5 ? "joy" : "neutral", facing: faceTo(3, s, f, ST_ORG, ST_THIRSTY), mouth: talk(f, 272, 290),
        armR: f < 270 ? [[20, 8], [lerp(30, 12, sip), lerp(16, -34, sip)]] as A2 : [[24, -10], [40 + 6 * wag, -40]] as A2, armRFront: true, propR: f < 270 ? "glass" : undefined,
        armL: [[-22, 12], [-30, 4]] as A2, armLFront: true, propL: "clipboard" })),
      C("runner3", ST_THIRSTY, pose(null, { expr: "dismay", facing: faceTo(3, s, f, ST_THIRSTY, ST_ORG), sweat: 1, mouth: "O",
        armR: [[26, 10], [lerp(30, 54, reach), lerp(20, 4, reach)]] as A2, armRFront: true, tilt: 6 * reach })),
      C("starter", ST_STARTER, pose(null, { expr: "neutral", facing: 1 }), { idx: 30 }),
    ],
    fx: fxs(f < 250 ? squiggles("heat", [ST_THERMO_TOP[0] + 0.1, ST_THERMO_TOP[1] + 0.5, ST_THERMO_TOP[2] - 0.2], f, "#ffd36b", 0.5) : null),
    focus: f < 244 ? [46.8, 2.8, 9.3] : [ST_ORG[0], 1.6, ST_ORG[2]], subj: f < 244 ? null : "organizer",
  };
};
lens(201, 3, 16); lens(244, 7, 20);

// ---- S04 (291-327) "So there's just one... (well)": the camera rises and travels back to the map; the single well
// icon glows and the camera pushes into it until it fills the frame; then the 8 f dissolve to the real well.
SHOT_CAMS[4] = () => [
  K(291, F(() => ({ pos: [44.2, 6.2, 0.6], look: STADIUM_WELL, fov: 40 }), 291, 0.0025), 26),
  K(311, F((f) => ({ pos: [STADIUM_WELL[0], STADIUM_WELL[1], STADIUM_WELL[2] - lerp(1.6, 0.62, sm(f, 311, 330))], look: STADIUM_WELL, fov: 32 }), 311, 0.001), 14),
];
SHOT_ACTS[4] = (f) => ({
  ctl: { temp: 1, wellGlow: sm(f, 298, 308), crowd: 0.2, smoke: 1, tape: 0, confetti: 0 },
  cast: [C("fan3", ST_POINTER, pose(null, { expr: "eureka", facing: 1, armR: [[24, -20], [54, -46]] as A2, armRFront: true, mouth: talk(f, 300, 320) }), { idx: 30 })],
  fx: fxs(sparkle("well", [STADIUM_WELL[0] + 0.25, STADIUM_WELL[1] + 0.2, STADIUM_WELL[2] - 0.05], f - 304, 0.3)),
  focus: STADIUM_WELL, subj: null,
});
lens(291, 0, 10);

// =====================================================================================================================
// FINISH (payoff, light "finish"). Tape at x -8 (FIN_X), runners arrive from +x. carPark [-12, 0, -10.5] (infield).
const FIN_X0 = -8;
/** Hicks: staggers in (0.07 m/f) until 1576, then is carried by his two handlers (0.26 m/f) through the tape */
const hicksFinX = (f: number) => (f < 1576 ? 6.2 - 0.07 * (f - 1510) : Math.max(FIN_X0 - 1.0, 6.2 - 0.07 * 66 - 0.26 * (f - 1576)));
const HZ = 0.3;
// ---- S20 (1510-1632) "So Hicks staggers on, / seeing things, / and his team carries him / over the finish line."
SHOT_CAMS[20] = () => [
  K(1510, F((f) => { const x = hicksFinX(f); return { pos: [x - 1.6, 1.3, HZ - 5.6], look: [x - 0.35, 1.25, HZ + 0.6], fov: 42 }; }, 1510, 0.0012)),
  K(1596, F((f) => { const x = hicksFinX(f); return { pos: [x - 3.2, 1.0, HZ - 5.2], look: [x + 0.2, 1.55, HZ + 1.4], fov: 42 }; }, 1596, 0.0016, [[1614, 0.006, 12]]), 20),
];
const finishCrowd = (f: number, k: number): CastPlace[] => [
  C("official", [FIN_X0 + 2.2, 0, 6.3], pose(null, { expr: k > 0.5 ? "joy" : "eureka", facing: -1, armR: [[24, -30], [30, -64 + 8 * Math.sin(st(f) * 0.6)]] as A2, armRFront: true, propR: "stopwatch" }), { idx: 40 }),
  C("starter", [FIN_X0 - 2.7, 0, 6.4], pose(null, { expr: "joy", facing: 1, armR: ARMS.upR, armL: ARMS.upL, armRFront: true, squash: 0.06 * Math.abs(Math.sin(st(f) * 0.4)) * k }), { idx: 41 }),
  C("lady1", [FIN_X0 - 4.0, 0, 5.8], pose(null, { expr: "joy", facing: 1, armR: [[24, -20], [28, -50 + 6 * Math.sin(st(f) * 0.7)]] as A2, armRFront: true, propR: "parasol" }), { idx: 42 }),
  C("fan1", [FIN_X0 + 4.4, 0, 5.4], pose(null, { expr: "eureka", facing: -1, armR: ARMS.upR, hatLift: 0.6 * k * Math.abs(Math.sin(st(f) * 0.3)) }), { idx: 43 }),
];
SHOT_ACTS[20] = (f, s) => {
  const x = hicksFinX(f), carried = f >= 1576, grab = sm(f, 1566, 1578), tape = sm(f, 1612, 1630);
  const H: V3 = [x, carried ? 0.18 : 0, HZ];
  const hx = (o: number) => x + 0.2 + (carried ? 0 : (1 - grab) * (2.8 + o)), handlerRun = f >= 1548;
  return {
    ctl: { tape, confetti: sm(f, 1614, 1632), crowd: lerp(0.35, 1, sm(f, 1590, 1616)), temp: 1, smoke: 1, wellGlow: 0 },
    cast: [
      C("hicks", carried ? [x, 0, HZ] : H, pose(null, carried
        ? { mode: "carried", phase: ph(f, 10), expr: f > 1612 ? "joy" : "dizzy", facing: -1, tilt: -4 }
        : { mode: "stagger", phase: ph(f, 20), expr: "dizzy", facing: -1, tilt: 6 * Math.sin(f * 0.11), sweat: 1 }), { air: carried }),
      C("coach", [hx(0.4), 0, HZ - 0.55], pose(null, handlerRun ? { mode: carried ? "run" : "run", phase: ph(f + 3, 12), expr: "strain", facing: -1, armR: carried ? [[24, -8], [36, -20]] as A2 : undefined, armRFront: true } : { expr: "dismay", facing: -1 })),
      C("helper", [hx(1.0), 0, HZ + 0.55], pose(null, handlerRun ? { mode: "run", phase: ph(f + 9, 12), expr: "strain", facing: -1, armL: carried ? [[-24, -8], [-36, -20]] as A2 : undefined } : { expr: "dismay", facing: -1 }), { idx: 2 }),
      ...finishCrowd(f, sm(f, 1600, 1616)),
    ],
    fx: fxs(f >= 1540 && f < 1610 ? visions([x, 2.1 + (carried ? 0.18 : 0), HZ], f) : null, tape > 0 && f < 1626 ? sparkle("tape", [FIN_X0, 1.2, HZ], f - 1614, 0.6) : null),
    focus: [x, 1.6, HZ], subj: "hicks",
  };
};
lens(1510, 6, 1); lens(1596, 3, 20);

// ---- S21 (1632-1683) "He wins gold, / eight pounds lighter." PAYOFF: low hero angle, the medal official hangs the
// gold medal on Hicks and he lifts it toward the lens (it fills half the frame, light burst + confetti); on "eight
// pounds lighter" he deflates thin with a big exhale and the coach props him up.
const WIN: V3 = [FIN_X0 - 1.0, 0, HZ];
const MEDAL_CARD = (key: string, pos: V3, w: number, rot: number, shine: number): FxSpec => ({
  kind: "card", key: "bigMedal" + key + "_" + Math.round(shine * 16), pos, w, h: w * 1.45, rot, cw: 320, ch: 464,
  draw: (p) => {
    const g = p.g, ink = "#241726";
    // ribbon: red / white / blue V straps
    const strap = (x0: number, x1: number) => { g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 70, 0); g.lineTo(x1 + 36, 250); g.lineTo(x1 - 34, 250); g.closePath(); };
    for (const [x0, x1] of [[40, 130], [210, 190]] as [number, number][]) {
      strap(x0, x1); const gr = g.createLinearGradient(x0, 0, x0 + 70, 0); gr.addColorStop(0, "#c8352e"); gr.addColorStop(0.33, "#c8352e"); gr.addColorStop(0.34, "#f6f0e2"); gr.addColorStop(0.66, "#f6f0e2"); gr.addColorStop(0.67, "#26386a"); gr.addColorStop(1, "#26386a");
      g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = ink; g.stroke();
    }
    // the gold disc
    const cx = 160, cy = 320, R = 130;
    g.beginPath(); g.arc(cx, cy, R, 0, 6.3); const gd = g.createRadialGradient(cx - 40, cy - 50, 10, cx, cy, R); gd.addColorStop(0, "#fff3b0"); gd.addColorStop(0.45, "#f5c542"); gd.addColorStop(1, "#c98a1c");
    g.fillStyle = gd; g.fill(); g.lineWidth = 10; g.strokeStyle = ink; g.stroke();
    g.beginPath(); g.arc(cx, cy, R - 22, 0, 6.3); g.lineWidth = 6; g.strokeStyle = "#b5781a"; g.stroke();
    // laurel dots round the rim
    g.fillStyle = "#b5781a"; for (let i = 0; i < 18; i++) { const a = Math.PI * 0.62 + (i / 17) * Math.PI * 1.76; g.beginPath(); g.ellipse(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40), 8, 4, a + 1.2, 0, 6.3); g.fill(); }
    // star + year
    g.fillStyle = "#fff6c8"; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 18 : 42, aa = (k * Math.PI) / 5 - Math.PI / 2; g.lineTo(cx + Math.cos(aa) * rr, cy - 22 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke();
    g.font = "900 54px Georgia"; g.textAlign = "center"; g.lineWidth = 8; g.strokeStyle = "#8a5a12"; g.strokeText("1904", cx, cy + 66); g.fillStyle = "#fff3b0"; g.fillText("1904", cx, cy + 66);
    // shine sweep
    g.save(); g.beginPath(); g.arc(cx, cy, R - 6, 0, 6.3); g.clip(); g.globalAlpha = 0.55 * shine; g.fillStyle = "#ffffff"; g.translate(cx - R + shine * 2 * R, cy); g.rotate(0.5); g.fillRect(-14, -R * 1.5, 28, R * 3); g.restore();
  },
});
// The official holds the big gold medal up to the lens (it fills about half the frame, light burst, confetti),
// Hicks beams behind it; on "eight pounds lighter" the camera eases back: the medal is on him and he deflates thin
// with a big exhale while the coach props him up.
SHOT_CAMS[21] = () => [
  K(1632, F(() => ({ pos: [WIN[0] + 0.2, 1.22, WIN[2] - 1.6], look: [WIN[0] + 0.02, 1.3, WIN[2]], fov: 40 }), 1632, 0.0026, [[1640, 0.006, 14]]), 16),
  K(1656, F(() => fit([body(WIN, 0, 2.1, 0.4), body([WIN[0] + 0.75, 0, WIN[2] + 0.45], 0.6, 2.0, 0.3)], 170, 2, 40, 0.84, -0.1), 1656, 0.0024), 20),
];
SHOT_ACTS[21] = (f, s) => {
  const rise = easeOut(lin(f, 1632, 1642)), hang = sm(f, 1650, 1658), thin = sm(f, 1662, 1672), card = f < 1656;
  const onto = sm(f, 1646, 1656);
  const mpos: V3 = [lerp(WIN[0] + 0.14, WIN[0], onto), lerp(lerp(0.9, 1.22, rise) + 0.01 * Math.sin(f * 0.2), 1.02, onto), lerp(WIN[2] - 0.92, WIN[2] - 0.12, onto)];
  return {
    ctl: { tape: 1, confetti: 1, crowd: 1, temp: 1, smoke: 1, wellGlow: 0 },
    cast: [
      C("hicks", WIN, pose(null, { expr: thin > 0.5 ? "dizzy" : "joy", facing: 1, medal: !card, squash: -0.14 * thin, tilt: 4 * thin, mouth: thin > 0.2 && thin < 0.9 ? "O" : undefined, headTilt: card ? 4 : 0 })),
      C("official", [WIN[0] - 0.75, 0, WIN[2] + 0.7], pose(null, { expr: "joy", facing: 1, armR: [[24, -8], [lerp(40, 30, hang), lerp(-20, 0, hang)]] as A2, armRFront: true }), { idx: 4 }),
      C("coach", [WIN[0] + 0.75, 0, WIN[2] + 0.45], pose(null, { expr: thin > 0.5 ? "dismay" : "joy", facing: -1, armL: [[-24, 6], [lerp(-40, -52, thin), lerp(0, -6, thin)]] as A2, armLFront: true }), { idx: 5 }),
    ],
    fx: fxs(card ? MEDAL_CARD("A", mpos, lerp(0.36, 0.13, onto), 0.06 * (1 - onto) * Math.sin(f * 0.15), lin(f, 1640, 1652)) : null,
      glowBurst("medal", [mpos[0], mpos[1] - 0.05, mpos[2] - 0.05], 0.9, card ? (0.7 * Math.exp(-Math.max(0, f - 1640) / 10) + 0.15) * (1 - onto) : 0),
      card ? sparkle("m1", [mpos[0] + 0.12, mpos[1] + 0.02, mpos[2] - 0.06], f - 1642, 0.14) : null, card ? sparkle("m2", [mpos[0] - 0.1, mpos[1] - 0.12, mpos[2] - 0.06], f - 1648, 0.11) : null),
    focus: card ? mpos : [WIN[0], 1.5, WIN[2]], subj: card ? null : "hicks",
  };
};
lens(1632, 10, 1); lens(1656, 4, 16);

// ---- S22 (1683-1772) "But he wasn't the first man across. / The first guy / took a car."
// The camera glides off Hicks across the infield to Lorz, lounging in a parked motor car with a laurel wreath, waving
// to the crowd. On "first guy" he squeezes the brass horn; then a calm close three-quarter: a sly grin held for 1 s,
// ending on "car." (loops into "A runner won Olympic gold...").
import { STADIUM_CAR_SEATS } from "./sets/stadium";
const LORZ_SEAT: V3 = STADIUM_CAR_SEATS.front;
SHOT_CAMS[22] = () => [
  K(1683, F(() => ({ pos: [WIN[0] + 0.6, 1.5, WIN[2] - 2.6], look: [WIN[0] - 0.2, 1.35, WIN[2]], fov: 40 }), 1683, 0.001), 10),
  K(1690, F(() => fit([body(WIN, 0, 2.1, 0.36), body(LORZ_SEAT, -0.4, 1.45, 0.42)], 22, 5, 40, 0.86), 1690, 0.0016), 22),
  K(1722, F(() => fit([body(LORZ_SEAT, -0.4, 1.45, 0.42)], 335, 4, 38, 0.62, 0.05, -0.05), 1722, 0.0022, [[1748, 0.005, 12]]), 26),
];
SHOT_ACTS[22] = (f, s) => {
  const honk = sm(f, 1736, 1740) * (1 - sm(f, 1744, 1750)), wave = f < 1730 ? Math.sin(f * 0.35) : 0;
  return {
    ctl: { tape: 1, confetti: lerp(1, 0.4, sm(f, 1683, 1730)), crowd: 0.6, temp: 1, smoke: 1, wellGlow: 0, horn: honk },
    cast: [
      C("hicks", WIN, pose(null, { expr: f > 1700 ? "dismay" : "joy", facing: faceTo(22, s, f, WIN, LORZ_SEAT), medal: true, squash: -0.1 })),
      C("coach", [WIN[0] + 0.75, 0, WIN[2] + 0.45], pose(null, { expr: "angry", facing: faceTo(22, s, f, [WIN[0] + 0.75, 0, WIN[2] + 0.45], LORZ_SEAT), armR: [[24, -10], [48, -20]] as A2, armRFront: true }), { idx: 5 }),
      C("lorzWreath", LORZ_SEAT, pose(null, { mode: "sit", expr: f > 1744 ? "sly" : "joy", facing: faceTo(22, s, f, LORZ_SEAT, WIN), headTilt: f > 1750 ? 5 : 0,
        armR: f < 1730 ? [[24, -20], [30 + 8 * wave, -56]] as A2 : [[26, 10], [lerp(36, 44, honk), lerp(8, 2, honk)]] as A2, armRFront: true,
        armL: [[-24, 14], [-36, 24]] as A2 })),
      C("driver", STADIUM_CAR_SEATS.driver, pose(null, { mode: "sit", expr: "smile", facing: 1 }), { idx: 6 }),
    ],
    fx: fxs(sparkle("horn", [LORZ_SEAT[0] + 0.5, 1.2, LORZ_SEAT[2] - 0.6], f - 1738, 0.3, "#ffffff")),
    focus: f < 1700 ? [WIN[0], 1.5, WIN[2]] : [LORZ_SEAT[0], 1.5, LORZ_SEAT[2]], subj: f < 1728 ? null : "lorzWreath",
  };
};
lens(1683, 6, 18);

// =====================================================================================================================
// DRUGSTORE, night blue (the explanation). Marks: pharmScale [-1.45,0,-1.85], pharmTonic [-4.05,0,-1.85],
// customer [-1.3,0,0.05], coffee [3.9,0.76,-0.12] (seated), rat [-0.84,1.02,-0.8]. ctl: scale, rattle, door, bolt.
const D_PT: V3 = [-4.05, 0, -1.85], D_PS: V3 = [-1.45, 0, -1.85], D_CU: V3 = [-1.3, 0, 0.05], D_CF: V3 = [3.9, 0.46, -0.12], D_RAT: V3 = [-0.84, 1.02, -0.8];
const D_POSTER: V3 = [-5.3, 2.6, -2.7], D_SCALE: V3 = [-1.45, 1.02, -0.95], D_CUPS: V3 = [4.6, 1.02, -0.98];
/** pharmacist walks from the tonic display to the scale between 1286 and 1312 (behind the counter) */
const pharmPos = (f: number): V3 => lerp3(D_PT, D_PS, sm(f, 1278, 1304));
// ---- S17 (1243-1372) "That's the trick. / In 1904, / a tiny dose / of rat poison / was an energy drink."
// Dissolve in on the PEP-O-LIGHTNING poster: the pharmacist (already at the tonic display) raises a tonic bottle as the
// bolt flashes on "trick" (stinger). The camera travels with him along the counter to the scale; on "tiny dose" he
// holds up a pinch, on "rat poison" it falls onto the pan (tiny dip + sparkle); on "energy drink" the customer at the
// counter gulps a tonic and his hair zaps up (wired face, speed squiggles).
SHOT_CAMS[17] = () => [
  K(1243, F(() => fit([body(D_PT, 0, 2.1, 0.4), [D_POSTER, -1.0, 0.9, 0.7]], 38, 6, 40, 0.86, 0, 0), 1243, 0.0024, [[1245, 0.006, 14]])),
  K(1276, F((f) => fit([body(pharmPos(f), 0.6, 2.1, 0.35), [D_SCALE, 0, 0.7, 0.3]], 28, 12, 40, 0.8), 1276, 0.0016), 30),
  K(1330, F(() => ({ pos: [-0.62, 1.78, -2.05], look: [-1.3, 1.42, 0.3], fov: 40 }), 1330, 0.002, [[1341, 0.006, 12]]), 22),
];
SHOT_ACTS[17] = (f, s) => {
  const raise = sm(f, 1244, 1252), pinchUp = sm(f, 1300, 1310), drop = sm(f, 1320, 1328), gulp = sm(f, 1338, 1346), zap = f >= 1346;
  const pp = pharmPos(f), walking = f >= 1278 && f < 1304;
  return {
    ctl: { bolt: Math.max(sm(f, 1244, 1250) * (1 - sm(f, 1262, 1280)), 0.6 * sm(f, 1342, 1348) * (1 - sm(f, 1360, 1372))), scale: 0.5 * drop, rattle: 0.15, door: 0 },
    cast: [
      C("pharmacist", pp, pose(null, walking
        ? { mode: "walk", phase: ph(f, 14), expr: "smug", facing: faceTo(17, s, f, D_PT, D_PS) }
        : f < 1278
          ? { expr: raise > 0.5 ? "eureka" : "smug", facing: faceTo(17, s, f, D_PT, D_CU), armR: [[24, -10], [lerp(30, 34, raise), lerp(10, -40, raise)]] as A2, armRFront: true, propR: "tonic", mouth: talk(f, 1246, 1262), headTilt: 4 * raise }
          : { expr: drop > 0.5 ? "sly" : "determined", facing: faceTo(17, s, f, D_PS, D_CU), armR: [[26, -6], [lerp(40, 46, pinchUp), lerp(10, -26, pinchUp) + 24 * drop]] as A2, armRFront: true,
              armL: [[-20, 20], [-10, 34]] as A2, mouth: talk(f, 1300, 1330) })),
      C("fan1", D_CU, pose(null, f < 1338
        ? { expr: "talk", facing: faceTo(17, s, f, D_CU, D_PS), look: 1, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "tonic", blink: (f % 47) < 3 ? 1 : 0 }
        : { expr: zap ? "wired" : "gulp", facing: faceTo(17, s, f, D_CU, D_PS), squash: zap ? 0.12 * Math.exp(-(f - 1346) / 6) : 0, hatLift: zap ? 0.5 * Math.exp(-(f - 1346) / 8) : 0,
            armR: [[20, -6], [lerp(30, 14, gulp), lerp(30, -30, gulp)]] as A2, armRFront: true, propR: "tonic", propRAng: -1.2 * gulp })),
      C("rat", D_RAT, pose(null, { expr: "neutral", facing: -1, phase: ph(f, 10) }), { scale: 0.36, idx: 34 }),
      C("clerk3", [3.2, 0, -1.9], pose(null, { expr: "neutral", facing: 1, armR: [[24, 10], [40, -4 + 6 * Math.sin(st(f) * 0.5)]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 30 }),
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: "smile", facing: -1, armR: [[22, 14], [30, 6]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 31 }),
    ],
    fx: fxs(sparkle("bolt", [D_POSTER[0] + 0.3, D_POSTER[1] + 0.2, D_POSTER[2] + 0.3], f - 1245, 0.6),
      sparkle("pinch", [D_SCALE[0] + 0.22, D_SCALE[1] + 0.25, D_SCALE[2]], f - 1326, 0.22),
      zap && f < 1366 ? squiggles("zap", [D_CU[0] - 0.05, 2.15, D_CU[2]], f, "#ffe95a", 0.42) : null),
    focus: f < 1290 ? [D_PT[0], 1.6, D_PT[2]] : f < 1332 ? [pp[0], 1.4, pp[2] + 0.6] : [D_CU[0], 1.6, D_CU[2]], subj: null,
  };
};
lens(1243, 9, 1); lens(1290, 6, 20); lens(1332, 7, 16);

// ---- S18 (1372-1436) "Ever had so much coffee / your hands started shaking?"
// The camera keeps travelling down the customer lane to the soda fountain, where the coffee customer (already there,
// on his ninth cup) lifts a cup: his hands start to shake, the cup rattles on the saucer, the cup tower rattles too.
SHOT_CAMS[18] = () => [
  K(1372, F((f) => fit([body(D_CF, -0.46, 1.7, 0.36), [D_CUPS, 0, 0.55, 0.25]], lerp(18, 8, sm(f, 1372, 1436)), 6, 40, 0.84, 0, -0.05), 1372, 0.0024, [[1420, 0.006, 14]]), 34),
];
SHOT_ACTS[18] = (f, s) => {
  const lift = sm(f, 1394, 1404), shake = sm(f, 1404, 1422), j = Math.sin(f * 2.1) * (2 + 6 * shake);
  return {
    ctl: { scale: 0.5, rattle: 0.2 + 0.8 * shake, bolt: 0, door: 0 },
    cast: [
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: shake > 0.6 ? "wired" : "smile", facing: -1, sweat: shake, tilt: 0.6 * j * shake,
        armR: [[22, 8], [lerp(30, 24, lift) + j, lerp(6, -14, lift) + 0.6 * j]] as A2, armRFront: true, propR: "coffeeCup",
        armL: [[-20, 10], [-28 - j, 4 + 0.5 * j]] as A2, armLFront: true, mouth: shake > 0.3 ? "teeth" : undefined })),
      C("clerk3", [3.2, 0, -1.9], pose(null, { expr: "dismay", facing: 1, armR: [[24, 10], [40, -4]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 30 }),
      C("pharmacist", D_PS, pose(null, { expr: "smug", facing: 1 }), { idx: 32 }),
      C("fan1", D_CU, pose(null, { expr: "wired", facing: 1, propR: "tonic", armR: [[24, 20], [30, 40]] as A2, armRFront: true, tilt: 4 * Math.sin(f * 0.9) }), { idx: 33 }),
    ],
    fx: fxs(shake > 0.2 ? squiggles("shake", [D_CF[0] + 0.45, 1.75, D_CF[2] + 0.2], f, "#ffffff", 0.3) : null),
    focus: [D_CF[0], 1.6, D_CF[2]], subj: null,
  };
};
lens(1372, 6, 20);

// ---- S19 (1436-1510) "It's that. / But one pinch too many, / and you're dead."
// The camera glides back along the counter to the scale: the pharmacist tips in one pinch too many, the pan crashes
// down in a powder puff; the rat sniffing the pan freezes - HARD CUT 2 on "dead": counter-top level, the rat keels over,
// legs up, dizzy stars. Then the 8 f dissolve to the stadium finish (bright gold).
SHOT_CAMS[19] = () => [
  K(1436, F(() => fit([body(D_PS, 0.7, 2.1, 0.35), [D_SCALE, 0, 0.75, 0.32], [D_RAT, 0, 0.25, 0.12]], 30, 14, 40, 0.82, 0, 0.05), 1436, 0.002, [[1472, 0.006, 12]]), 30),
  K(1496, F(() => ({ pos: [-0.36, 1.14, -0.36], look: [-1.02, 1.1, -0.84], fov: 40 }), 1496, 0.003), 1, true),
];
SHOT_ACTS[19] = (f, s) => {
  const pinch = sm(f, 1462, 1474), crash = sm(f, 1476, 1486), dead = sm(f, 1494, 1500);
  return {
    ctl: { scale: lerp(0.5, 1, crash), rattle: 0.2, bolt: 0, door: 0 },
    cast: [
      C("pharmacist", D_PS, pose(null, { expr: crash > 0.5 ? "shock" : "determined", facing: faceTo(19, s, f, D_PS, D_CU), armR: [[26, -6], [lerp(40, 50, pinch), lerp(-26, 6, pinch)]] as A2, armRFront: true, propR: pinch > 0.1 && crash < 0.5 ? "poisonTin" : undefined,
        mouth: talk(f, 1440, 1460), squash: 0.1 * crash * Math.exp(-Math.max(0, f - 1486) / 6) })),
      C("rat", D_RAT, pose(null, dead > 0
        ? { expr: "dead", mode: "lie", facing: -1, squash: 0.15 * dead * Math.exp(-Math.max(0, f - 1500) / 5) }
        : { expr: crash > 0.5 ? "shock" : "neutral", facing: -1, phase: ph(f, 8), sweat: crash }), { scale: 0.36, idx: 34 }),
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: "wired", facing: -1, tilt: 3 * Math.sin(f * 1.7), propR: "coffeeCup", armR: [[22, 8], [24, -14]] as A2, armRFront: true }), { idx: 31 }),
    ],
    fx: fxs(dead > 0.5 ? dizzy([D_RAT[0], D_RAT[1] + 0.12, D_RAT[2]], f, 0.07).map((d) => ({ ...d, w: 0.045, h: 0.045 })) : null,
      crash > 0.5 && f < 1496 ? dustCard("puffScale", [D_SCALE[0] + 0.25, D_SCALE[1] + 0.25 + 0.01 * (f - 1486), D_SCALE[2]], 0.5 + 0.02 * (f - 1486), 0.8 * (1 - lin(f, 1486, 1496)), 2) : null),
    focus: f < 1496 ? [D_SCALE[0], D_SCALE[1] + 0.3, D_SCALE[2]] : [D_RAT[0], D_RAT[1] + 0.1, D_RAT[2]], subj: null,
  };
};
lens(1436, 6, 16); lens(1496, 12, 1);

DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
