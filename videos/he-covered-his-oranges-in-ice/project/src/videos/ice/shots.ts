// Per-scene cameras (SHOT_CAMS) and acting (SHOT_ACTS) for "He Covered His Oranges in Ice to Stop Them Freezing",
// set-local coordinates, absolute frames. Master prompt v13: 10 scene ids in two places (the groves, the cellar);
// smooth acting (flow beats with 6-frame face transitions), lip-sync only on the three quoted lines (talk.json),
// a life layer on every character (97_life.ts), 3 hard cuts, calm stretches of 3-5 s.
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
import { GROVE } from "./sets/grove";
import { CELLAR } from "./sets/cellar";

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
// "He Covered His Oranges in Ice to Stop Them Freezing": 10 scene ids in two places. The groves (home base, set
// "grove": dusk, 9 p.m., midnight, 3 a.m., sunrise) and the root cellar under Earl's house (set "cellar").
// Faces: Earl = calm half-lid (neutral / bored), smug only at the trick and the payoff, never shock. Duane = moustache
// mouth (tache) by default, laugh / gloat / worry on his beats. Shocks (4): June at the scarecrow (905), Duane at 24
// (995), Duane at the juice (1692), Duane at the clonk (1900). Hard cuts (3): 622, 749, 969.
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
const HOLD = (k: CK, f: number): CK => ({ ...k, f });
/** pre-compensate a designed key for the creep F() adds from f0 at `rate`, so the key frame shows the designed framing */
const COMP = (k: CK, f0: number, rate: number): CK => { const g = Math.exp(rate * Math.max(0, k.f - f0)); return { ...k, pos: [k.look[0] + (k.pos[0] - k.look[0]) * g, k.look[1] + (k.pos[1] - k.look[1]) * g, k.look[2] + (k.pos[2] - k.look[2]) * g] }; };
const CKf = (f: number, pos: V3, look: V3, fov = 44): CK => ({ f, pos, look, fov });
/** a whip / swing between two framings: the view direction turns through yaw (no look-point collapse), the position
 *  slides (with a lift arc to clear fences and crowns), eased over [f0, f1] */
const dirOf = (c: Shot) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), L }; };
const swing = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0) => (f: number): Shot => {
  const A = from(f0), B = to(f), k = sm(f, f0, f1), da = dirOf(A), db = dirOf(B);
  let dy = db.yaw - da.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  const yaw = da.yaw + dy * k, pitch = lerp(da.pitch, db.pitch, k), L = lerp(da.L, db.L, k);
  const pos = lerp3(A.pos, B.pos, k); pos[1] += lift * Math.sin(Math.PI * k);
  return { pos, look: [pos[0] + Math.sin(yaw) * Math.cos(pitch) * L, pos[1] + Math.sin(pitch) * L, pos[2] + Math.cos(yaw) * Math.cos(pitch) * L], fov: lerp(A.fov ?? 40, B.fov ?? 40, k), roll: 0 };
};
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => faceTo(id, s, f, a, b);
const EYE = 1.3;   // v13 rig: head centre of an adult card 1.30 m above its feet (sitting 0.85, kid 0.99)
const head = (p: V3, y = EYE): V3 => [p[0], p[1] + y, p[2]];
/** the hose nozzle in Earl's fist: the hand sits on the card plane, ~0.4 m to the screen side of the hose arm (left arm =
 *  screen left, it points at the target on the left), the nozzle tip ~1.12 m up (v13 rig) */
const nozzle = (E: V3, T: V3, id?: number, s?: SetDef, f?: number, side = -1): Record<string, number> => {
  if (id !== undefined && s && f !== undefined) { const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1]) || 1, r = [-d[1] / L, d[0] / L];
    return { hx: E[0] + r[0] * side * 0.4, hy: E[1] + 1.12, hz: E[2] + r[1] * side * 0.4 }; }
  const dx = T[0] - E[0], dz = T[2] - E[2], L = Math.hypot(dx, dz) || 1; return { hx: E[0] + (dx / L) * 0.36, hy: E[1] + 1.02, hz: E[2] + (dz / L) * 0.36 }; };
/** extra arms */
const AG = {
  hoseR: [[26, -4], [52, -12]] as A2, hoseUpR: [[26, -10], [50, -26]] as A2, lanternL: [[-22, 18], [-30, 34]] as A2, lanternUpL: [[-24, -2], [-36, -22]] as A2,
  heaveR: [[28, 2], [50, 8]] as A2, heaveL: [[24, 6], [46, 12]] as A2, crossR: [[20, 18], [-10, 18]] as A2, crossL: [[-20, 18], [10, 18]] as A2,
  sipR: [[20, 10], [8, -14]] as A2, cupR: [[22, 18], [26, 4]] as A2, slapDownR: [[30, 10], [52, 18]] as A2, slapUpR: [[28, -14], [46, -34]] as A2,
  torchR: [[26, 4], [46, 20]] as A2, paintUpR: [[24, -18], [40, -42]] as A2, paintDnR: [[26, -6], [44, -20]] as A2, tapR: [[26, 8], [46, 24]] as A2,
  knockUpR: [[24, -20], [36, -50]] as A2, knockDnR: [[30, 8], [52, 26]] as A2, offerR: [[28, 6], [50, -2]] as A2, offerL: [[-28, 6], [-50, -2]] as A2,
  handInR: [[28, 16], [44, 30]] as A2, holdUpR: [[24, -10], [34, -34]] as A2, wagR: [[26, -12], [44, -34]] as A2,
};
const LANTERN = (p: V3, facing: number, k = 1): Record<string, number> => ({ lamp1: k, l1x: p[0] - 0.12 * facing, l1y: p[1] + 0.72, l1z: p[2] + 0.12 });

// ================================================= SCENE 1 (0-501) DUSK: hook, "You see,", the valve, the bet, "Ice keeps 'em warm."
const E1H: V3 = [-0.95, 0, -2.2], E1V: V3 = [-1.05, 0, 2.6],   // E1V: beside the valve wheel (wheel 0.45 m to his -x)
  D1P: V3 = [2.55, 0, 1.15], D1F: V3 = [0.48, 0, 0.62];
const HOSE_T: V3 = [-1.72, 2.0, -3.18];
const ORANGE_K = (f: number, pos: V3, look: V3, fov = 38): CK => CKf(f, pos, look, fov);
const OR_CLOSE = ORANGE_K(0, [-1.16, 1.98, -2.62], [-1.62, 1.86, -3.32], 36);   // the hero orange (shots 6, 7 start, 17)
SHOT_CAMS[1] = (s) => {
  // shot 1 (0-96): Earl hosing his tree (right third, eyes 40%), 0.93-2.27 s glide past his shoulder to the oranges; hold
  const A0 = CKf(0, [-0.1, 1.15, 0.6], [-1.195, 1.052, -2.139], 46);
  const A1 = CKf(68, [-0.56, 2.12, -2.15], [-1.612, 1.791, -3.312], 40);   // 1.6 m off the iced hero orange (the macro's angle), the jet landing top left
  // shot 2 (96-236): one calm crane up and over the fence (horizon in the top fifth), landing on Duane lighting his pots
  const B1 = CKf(150, [-0.5, 2.6, -0.2], [2.647, 1.359, 0.986], 50);
  const B2 = CKf(188, [0.55, 1.45, 4.3], [2.453, 0.983, 1.104], 46);
  const cA1 = COMP(A1, 0, 0.0007), cB1 = COMP(B1, 0, 0.0007), cB2 = COMP(B2, 0, 0.0007);
  const p1 = spline([A0, HOLD(A0, 27), cA1, HOLD(cA1, 96), cB1, cB2, HOLD(cB2, 236)]);
  // shot 3 (236-276): whip to Earl heaving the valve wheel (whole body), the sprinklers burst on behind him (262)
  const C3 = CKf(244, [0.0, 1.28, 5.9], [-1.116, 0.992, 2.619], 48);   // whole body, the wheel left of him
  const c3 = F(() => C3, 244, 0.0016);
  // shot 4 (276-406): Duane big front-left laughing, Earl at the valve back-right across the fence; glide on "crate"
  const D4 = CKf(284, [1.3, 1.33, -2.0], [0.281, 1.066, 0.555], 46), D4b = CKf(360, [1.2, 1.32, -1.7], [0.302, 1.103, 0.563], 44);
  const cD4b = COMP(D4b, 284, 0.0012), d4 = spline([D4, HOLD(D4, 345), cD4b, HOLD(cD4b, 406)]);
  // shot 5 (406-454): Earl CU from his side (the fire pots behind): "Ice keeps 'em warm."
  const E5 = CKf(414, [-2.6, 1.3, 1.0], [-1.014, 1.12, 2.565], 44);
  // shot 6 (454-501): whip round on his look and push into the hero orange
  const F6 = OR_CLOSE;
  return [K(0, F((f) => p1(f), 0, 0.0007), 24, true),
    K(236, swing((f) => F((g) => p1(g), 0, 0.0007)(f), 236, c3, 244, 0.35), 1),
    K(276, swing(c3, 276, (f) => F((g) => d4(g), 284, 0.0012)(f), 286, 0.45), 1),
    K(406, swing((f) => F((g) => d4(g), 284, 0.0012)(f), 406, F(() => E5, 414, 0.0022), 414, 0.4), 1),
    K(454, swing(F(() => E5, 414, 0.0022), 454, F(() => F6, 466, 0.0022), 466, 0.25), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  const ice = f < 96 ? lerp(0.35, 0.72, sm(f, 0, 90)) : lerp(0.72, 0.82, sm(f, 262, 500));
  const potsN = f < 182 ? 0 : 1 + 4 * lin(f, 205, 300) + 15 * lin(f, 300, 420);
  // Earl: hook at the tree (hose), then at the valve
  const atValve = f >= 236;
  const fT = toward(1, s, f, E1H, HOSE_T), fWheel = toward(1, s, f, E1V, [-1.5, 0, 2.6]), fDuane = toward(1, s, f, E1V, D1F), fTree = toward(1, s, f, E1V, [-1.6, 0, -1.5]);
  const sweep = Math.sin(f * 0.07) * 4;
  const earl: P = !atValve ? flow(f, [
    [0, { expr: "neutral", facing: fT, armL: [[-26, -6 + sweep], [-52, -16 + sweep]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -3 }],
    [40, { expr: "neutral", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -2, headTilt: 3 }, 10],
    [70, { expr: "bored", facing: fT, armL: [[-26, -4], [-52, -12]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -3 }, 10],
  ]) as P : flow(f, [
    [236, { expr: "neutral", facing: fWheel, armL: [[-28, 2], [-50, 8]] as A2, armR: [[-24, 6], [-46, 12]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.2 }],
    [244, { expr: "strain", facing: fWheel, armL: [[-28, -6], [-46, -16]] as A2, armR: [[-24, 0], [-42, -8]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 1, tilt: 6 }, 6],   // heave
    [256, { expr: "determined", facing: fWheel, armL: [[-28, 8], [-48, 18]] as A2, armR: [[-24, 12], [-44, 22]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.6, tilt: -4 }, 5], // wheel turned
    [270, { expr: "neutral", facing: fWheel, armL: [[-28, 2], [-50, 8]] as A2, armLFront: true, mode: "brace", braceK: 0 }, 10],
    [300, { expr: "bored", facing: fDuane, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, mode: "brace", braceK: 0 }, 10],          // listening to the laugh
    [360, { expr: "bored", facing: fDuane, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, headTilt: -4, mode: "brace", braceK: 0 }, 10],
    [408, { expr: "neutral", facing: fTree, armR: AR.shrugR, armL: AR.shrugL, headTilt: 5, mode: "brace", braceK: 0 }, 8],             // "shrugs"
    [426, { expr: "smug", facing: fTree, armR: [[26, -8], [6, -40]] as A2, armL: AR.hipL, headTilt: 3, mode: "brace", braceK: 0 }, 8],   // thumb at his tree: "Ice keeps 'em warm."
    [452, { expr: "bored", facing: fTree, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, mode: "brace", braceK: 0 }, 10],
  ]) as P;
  // Duane: lights the fire pots with a drip torch, then at the fence: laughs, gloats, slaps the bet crate
  const atFence = f >= 244;
  const dPos: V3 = !atFence ? D1P : f < 280 ? lerp3(D1P, D1F, sm(f, 244, 280)) : D1F;
  const fPot = toward(1, s, f, D1P, [2.0, 0, 0.4]), fE = toward(1, s, f, D1F, E1V);   // the bet crate is on the top rail by him
  const duane: P = !atFence ? flow(f, [
    [96, { expr: "smug", facing: fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", tilt: 4 }],
    [176, { expr: "smug", facing: fPot, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 10 }, 8],   // tips the torch into the pot
    [186, { expr: "proud", facing: fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", tilt: 2 }, 6],                   // whoomp: it lights
    [214, { expr: "smug", facing: -fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", armL: AR.hipL }, 10],
  ]) as P : flow(f, [
    [244, { expr: "tache", facing: fE, armL: AR.hipL, armR: AR.hipR, mode: "walk", phase: (f - 244) / 9 }],
    [284, { ...laughP(f, 284, 0), facing: fE, armL: AR.hipL, armR: [[26, 6], [40, 14]] as A2, mode: "stand" }, 4],               // "laughs"
    [300, { expr: "tacheUp", facing: fE, armR: [[28, -6], [56, -12]] as A2, armRFront: true, armL: AR.hipL, headBack: 0.3 }, 5],   // "He's making popsicles!"
    [338, { expr: "scheme", facing: fE, armR: AG.slapUpR, armRFront: true, armL: AR.hipL }, 6],
    [352, { expr: "scheme", facing: fE, armR: AG.slapDownR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],                       // slap on the crate: "crate"
    [372, { expr: "tacheUp", facing: fE, armR: [[24, 10], [44, 8]] as A2, armRFront: true, armL: AR.hipL, headTilt: -3 }, 8],      // "dead by morning"
    [430, { expr: "tache", facing: fE, armR: AR.hipR, armL: AR.hipL }, 10],
  ]) as P;
  const laughing = f >= 284 && f < 300;
  const hands = [C("hand1", [6.2, 0, 3.3], flow(f, [[96, { expr: "neutral", facing: 1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }], [200, { expr: "neutral", facing: 1, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 8 }, 8], [214, { expr: "neutral", facing: -1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }, 10]]), { idx: 11 }),
    C("hand2", [7.4, 0, -2.6], flow(f, [[96, { expr: "neutral", facing: -1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }], [222, { expr: "neutral", facing: -1, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 8 }, 8], [236, { expr: "neutral", facing: 1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }, 10]]), { idx: 12 })];
  const hose = f < 100 ? 1 : 0;
  return {
    ctl: { ice, frost: lerp(0.12, 0.42, lin(f, 0, 500)), spray: sm(f, 256, 266), valve: sm(f, 244, 262), pots: 1, potsN, house: 1, shedLamp: 1, etemp: 33, temp: 31, crate: 1,
      hose, ...nozzle(E1H, HOSE_T, 1, s, f), tx: HOSE_T[0], ty: HOSE_T[1], tz: HOSE_T[2], drops: f >= 454 ? 1 : 0, glint: (f >= 40 && f < 110) || f >= 456 ? 0.2 : 1 },
    cast: [
      C("earl", atValve ? E1V : E1H, speak(f, 425, 452, earl), { idx: 1 }),
      C("duane", dPos, speak(f, 299, 333, laughing ? { ...duane, mouth: undefined } : duane), { idx: 2 }),
      ...hands,
    ],
    focus: f < 28 ? head(E1H) : f < 96 ? HOSE_T : f < 236 ? head(D1P) : f < 276 ? head(E1V) : f < 406 ? head(D1F) : f < 454 ? head(E1V) : GROVE.HERO_ORANGE,
    subj: f < 28 ? "earl" : f < 96 ? null : f < 236 ? "duane" : f < 276 ? "earl" : f < 406 ? "duane" : f < 454 ? "earl" : null,
  };
};

// ================================================= SCENE 2 (502-621) BY NINE: the glazed leaves, the farmhands laugh
const E2: V3 = [-2.0, 0.5, 3.75], H2: V3[] = [[0.45, 0, 3.2], [0.5, 0, 4.25], [1.55, 0, 3.45]];   // farmhands lean on the fence (Duane's side)
SHOT_CAMS[2] = () => {
  // one calm 4 s move: from the glazed orange, pull back and turn along the fence to the farmhands and Earl on his crate
  const A = HOLD(OR_CLOSE, 502), A2 = CKf(530, [-1.0, 2.05, -2.15], [-1.7, 1.9, -3.2], 42);
  const B = CKf(596, [-4.5, 1.38, 5.0], [-0.66, 0.91, 3.63], 48);   // Earl on his crate left, the farmhands across the fence right
  const sw = (f: number) => { const x: Shot = f < 530 ? spline([A, A2])(f) : swing(() => A2, 530, () => B, 596, 0.25)(f); return { pos: x.pos, look: x.look, fov: x.fov ?? 40 }; };
  return [K(502, F((f) => sw(f), 596, 0.0012), 24, true)];
};
SHOT_ACTS[2] = (f, s) => {
  const fE = toward(2, s, f, E2, H2[0]), sip = f > 545 && f < 575;
  const earl = flow(f, [
    [502, { expr: "bored", mode: "sit", facing: fE, armR: AG.cupR, armRFront: true, propR: "steamCup", armL: AR.hipL }],
    [548, { expr: "calm", mode: "sit", facing: fE, armR: AG.sipR, armRFront: true, propR: "steamCup", armL: AR.hipL, headTilt: -4 }, 10],   // sips
    [576, { expr: "bored", mode: "sit", facing: fE, armR: AG.cupR, armRFront: true, propR: "steamCup", armL: AR.hipL }, 10],
  ]);
  void sip;
  const laugh = (i: number, extra: P = {}): P => (f >= 562 ? { ...laughP(f, 562, i), facing: toward(2, s, f, H2[i], E2), ...extra } : { expr: "mock", facing: toward(2, s, f, H2[i], E2), ...extra });
  return {
    ctl: { ice: lerp(0.82, 0.92, lin(f, 502, 620)), frost: 0.55, spray: 1, pots: 1, potsN: 99, house: 1, shedLamp: 1, crate: 1, ...LANTERN([E2[0] + 0.3, 0, E2[2] - 0.1], 1, 1), l1y: 0.95, drops: f < 530 ? 1 : 0, glint: f < 545 ? 0.2 : 1 },
    cast: [
      C("earl", E2, earl, { idx: 1 }),
      C("hand1", H2[0], pose(null, laugh(0, { armR: [[28, -6], [56, -12]] as A2, armRFront: true })), { idx: 11 }),
      C("hand2", H2[1], pose(null, laugh(1, { armR: [[30, 10], [44, 24]] as A2, armRFront: true })), { idx: 12 }),        // slaps his knee
      C("hand3", H2[2], pose(null, laugh(2, { armR: AR.hipR, armL: AR.hipL })), { idx: 13 }),
    ],
    focus: f < 540 ? GROVE.HERO_ORANGE : head(E2, 0.85), subj: f < 560 ? null : "earl",
  };
};

// ================================================= SCENE 3 (622-748) BY MIDNIGHT: glass balls, the town at the gate
const T3: V3[] = [[-2.05, 0, 15.3], [-3.3, 0, 15.5], [-2.6, 0, 14.85], [-4.5, 0, 16.2]];   // ftown1, ftown2, the kid (ftown3), ftown4
SHOT_CAMS[3] = () => {
  // hard cut on "midnight": glide along the iced crown of the gate tree, then carry round through the gate to the town
  const A = CKf(622, [-0.45, 2.5, -1.3], [-2.2, 2.3, -3.7], 46), A2 = CKf(684, [-0.3, 2.35, -2.9], [-2.25, 2.2, -4.6], 46);   // glide along the moonlit face of the iced hero tree (46 glass-ball oranges)
  const B = CKf(704, [-1.0, 1.38, 10.4], [-2.688, 0.813, 14.803], 50);   // the whip path clears the gate tree's crown
  const sw = (f: number) => { const x: Shot = f < 684 ? spline([A, A2])(f) : swing(() => A2, 684, () => B, 704, 1.2)(f); return { pos: x.pos, look: x.look, fov: x.fov ?? 40 }; };
  return [K(622, F((f) => sw(f), 704, 0.0014), 24, true)];
};
SHOT_ACTS[3] = (f, s) => {
  const AT: V3 = [-2.4, 0, 12.0];   // they laugh at the grove (Earl, off screen)
  const lt = (i: number, extra: P = {}): P => (f >= 699 ? { ...laughP(f, 699, i), facing: toward(3, s, f, T3[i], AT), ...extra } : { expr: "grin", facing: toward(3, s, f, T3[i], AT), ...extra });
  // the kid lifts the POPSICLE EARL board over his head on "calls him" (704-716) and bobs it
  const up = sm(f, 700, 716), bob = 0.03 * Math.sin((f - 700) * 0.35) * up, K3 = T3[2];
  const kid = pose(null, { expr: f >= 716 ? "laugh" : "grin", facing: toward(3, s, f, K3, AT), armR: [[lerp(24, 26, up), lerp(16, -55, up)], [lerp(22, 30, up), lerp(30, -105, up)]] as A2, armL: [[lerp(-24, -26, up), lerp(16, -55, up)], [lerp(-22, -30, up), lerp(30, -105, up)]] as A2, armRFront: true, armLFront: true });
  return {
    ctl: { ice: 1, frost: 0.7, spray: 1, pots: 1, potsN: 99, house: 1, truck: 1, moon: 1, stars: 1, sign: 1, glint: 1.2,
      sgOn: 1, sgx: K3[0], sgy: lerp(0.75, 1.62, up) + bob, sgz: K3[2] - 0.1, sgYaw: -0.33, sgRoll: 0.04 * Math.sin((f - 700) * 0.21) * up },
    cast: [
      C("ftown1", T3[0], pose(null, lt(0, { armR: [[28, -6], [56, -12]] as A2, armRFront: true })), { idx: 21 }),   // points at the grove
      C("ftown2", T3[1], pose(null, lt(1, { armR: [[24, 10], [16, -4]] as A2 })), { idx: 22 }),
      C("ftown3", K3, kid, { idx: 23 }),
      C("ftown4", T3[3], pose(null, lt(3, { armL: AG.lanternL, propL: "lantern" })), { idx: 24 }),
    ],
    focus: f < 690 ? [-1.9, 2.25, -3.2] : head(T3[2], 0.99), subj: f < 690 ? null : "ftown3",
  };
};

// ================================================= SCENE 4 (749-883) 3 A.M.: the bough snaps; "Told ya, popsicles!"
const E4: V3 = [-1.25, 0, -1.25], E4b: V3 = [-1.65, 0, -0.5], D4: V3 = [0.82, 0, -0.85];
const snapU = (f: number) => f < 773 ? 0 : f < 790 ? 0.15 * lin(f, 773, 790) : f < 806 ? lerp(0.15, 0.62, lin(f, 790, 806)) : lerp(0.62, 1, lin(f, 806, 846));
SHOT_CAMS[4] = (s) => {
  const A = CKf(749, [-1.0, 0.9, 1.75], [-1.56, 1.06, -0.89], 58);   // low, Earl right under the iced bough (tip top right)
  const B = CKf(830, [1.75, 1.0, -2.45], [0.806, 1.127, -0.826], 50);  // Duane low-angle CU
  void s;
  return [K(749, F(() => A, 749, 0.0018, [[806, 0.006, 14]]), 24, true), K(822, swing(F(() => A, 749, 0.0018, [[806, 0.006, 14]]), 822, F(() => B, 830, 0.0024, [[864, 0.007, 12]]), 830, 0.7), 1)];
};
KICKS.push([806 / 30, 0.45]);
SHOT_ACTS[4] = (f, s) => {
  const ePos: V3 = f < 796 ? E4 : lerp3(E4, E4b, sm(f, 796, 812));
  const fUp = toward(4, s, f, E4, [-1.2, 0, -1.6]), fD = toward(4, s, f, D4, [-1.0, 0, -1.2]);
  const earl = flow(f, [
    [749, { expr: "neutral", facing: fUp, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, headBack: 0.4 }],
    [780, { expr: "neutral", facing: fUp, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, headBack: 0.6, sweat: 1 }, 8],   // creak: he looks up
    [796, { expr: "neutral", facing: -fUp, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[26, -10], [40, -30]] as A2, mode: "walk", phase: (f - 796) / 8, sweat: 1 }, 4], // steps back
    [812, { expr: "bored", facing: fUp, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR, sweat: 0.6 }, 6],
  ]);
  const duane = flow(f, [
    [800, { expr: "tache", facing: fD, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR }],
    [826, { expr: "tacheUp", facing: fD, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[28, -6], [56, -12]] as A2, armRFront: true }, 5],
    [850, { expr: "tacheUp", facing: fD, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: [[28, -12], [58, -24]] as A2, armRFront: true, headBack: 0.25 }, 4],
  ]);
  const shout = f >= 849 ? speak(f, 849, 886, { ...duane, mouth: undefined } as P) : duane;
  return {
    ctl: { ice: 1, frost: 0.85, spray: 1, pots: 0.75, potsN: 99, house: 1, snap: snapU(f), ...LANTERN(ePos, 1, 1), lamp2: f >= 815 ? 1 : 0, l2x: D4[0] + 0.15, l2y: 0.72, l2z: D4[2] + 0.1, glint: 1 },
    cast: [C("earl", ePos, earl, { idx: 1 }), ...(f >= 815 ? [C("duane", D4, shout as FigOpts, { idx: 2 })] : [])],
    focus: f < 822 ? head(ePos) : head(D4), subj: f < 822 ? "earl" : "duane",
  };
};

// ================================================= SCENE 5 (884-968) THE SCARECROW at the back door
const SC5: V3 = [-7.98, 0.4, 10.0], J5: V3 = [-8.42, 0.62, 9.42];   // the scarecrow on the top step (hinge side), June in the opening
const DOOR5 = CKf(896, [-5.75, 1.6, 7.0], [-8.236, 1.641, 9.818], 50);   // clear of the gate tree's crown
SHOT_CAMS[5] = (s) => {
  const end4 = (f: number) => camAt(4, s, Math.min(f, 883));
  return [K(884, swing(end4, 883, F(() => DOOR5, 896, 0.0022, [[905, 0.005, 12]]), 896, 3.4), 1, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const fDoor = toward(5, s, f, SC5, J5), fOut = toward(5, s, f, J5, SC5);
  const knock = f < 905 ? Math.sin((f - 884) * 0.75) : 0;
  const scare = flow(f, [
    [884, { expr: "worry", facing: fDoor, armR: [[26, -8 + 10 * knock], [46, -20 + 14 * knock]] as A2, armRFront: true, sweat: 1, tilt: 3 * knock }],
    [905, { expr: "worry", facing: fDoor, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, shake: 0.7, phase: (f - 905) / 4, sweat: 1 }, 6],  // shivers
    [940, { expr: "worry", facing: fDoor, armR: [[24, 4], [40, -12]] as A2, armRFront: true, armL: AG.crossL, shake: 0.5, phase: (f - 905) / 4, sweat: 1, headTilt: 6 }, 8], // "asks to come in"
  ]);
  const june = flow(f, [
    [898, { expr: "neutral", facing: fOut, armR: [[24, 4], [34, -10]] as A2, armRFront: true }],
    [905, { expr: "shock", facing: fOut, armR: [[24, -10], [12, -36]] as A2, armRFront: true, sweat: 1 }, 4],
    [935, { expr: "worry", facing: fOut, armR: [[24, 4], [34, -10]] as A2, armRFront: true }, 10],
  ]);
  return {
    ctl: { ice: 1, frost: 0.9, spray: 1, pots: 0.6, house: 1, door: sm(f, 898, 908), glint: 1 },
    cast: [C("scarecrow", SC5, scare, { idx: 31 }), ...(f >= 899 ? [C("june", J5, june, { idx: 32 })] : [])],
    fx: fxs(f >= 905 && f < 960 ? [0, 1].map((i) => ({ kind: "card" as const, key: "breath" + (Math.floor((f + i * 9) / 4) % 4), pos: [SC5[0] - 0.12, SC5[1] + 1.5 + 0.06 * (((f + i * 9) % 18) / 18), SC5[2] - 0.2] as V3, w: 0.22, h: 0.16, soft: true,
      draw: (p: Pen) => { const g = p.g; g.fillStyle = "rgba(235,245,255,0.55)"; g.beginPath(); g.ellipse(64, 50, 40 + ((f + i * 9) % 18), 26, 0, 0, 6.3); g.fill(); } })) : null),
    focus: [SC5[0], SC5[1] + 1.38, SC5[2]], subj: "scarecrow",
  };
};

// ================================================= SCENE 6 (969-1109) DUANE'S THERMOMETER: 24, the pots gutter, frost
const D6: V3 = [0.72, 0, -3.12];
SHOT_CAMS[6] = () => {
  const A = CKf(969, [0.68, 1.16, -2.46], [0.13, 1.15, -2.5], 40);   // square-on to the plate
  const B = CKf(1080, [1.85, 1.42, -0.75], [0.657, 1.077, -3.079], 46);
  const p = spline([A, HOLD(A, 1012), B]);
  return [K(969, F((f) => p(f), 1080, 0.0012), 24, true)];
};
SHOT_ACTS[6] = (f, s) => {
  const fT = toward(6, s, f, D6, [0.13, 0, -2.5]);
  const duane = flow(f, [
    [969, { expr: "tache", facing: fT, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR, headTilt: 4 }],
    [1018, { expr: "shock", facing: fT, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[22, -10], [12, -36]] as A2, armRFront: true, sweat: 1 }, 4],   // sees 24
    [1050, { expr: "worry", facing: -fT, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, sweat: 1, headTilt: -4 }, 10],  // turns to his frosting trees
    [1090, { expr: "worry", facing: -fT, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: [[24, 4], [14, -24]] as A2, sweat: 1 }, 10],
  ]);
  return {
    ctl: { ice: 1, frost: 0.92, spray: 1, crate: 1, pots: 1, potsN: 99, potsOut: lerp(0, 4, lin(f, 1030, 1095)), dFrost: lerp(0.15, 0.85, lin(f, 1016, 1100)), temp: lerp(27, 24, sm(f, 975, 1000)), lamp2: 1, l2x: D6[0] + 0.15, l2y: 0.72, l2z: D6[2] + 0.1, glint: 1 },
    cast: [C("duane", D6, duane, { idx: 2 })],
    focus: f < 1015 ? GROVE.DTHERMO : head(D6), subj: f < 1015 ? null : "duane",
  };
};

// ================================================= SCENE 7 (1110-1433) THE TRICK: the water stays on; drops freeze; 32
const E7: V3 = [-0.6, 0, -2.15];
const MAC_O = CKf(1290, [-1.2, 1.96, -2.86], [-1.62, 1.86, -3.32], 34), MAC_T = CKf(1378, [-1.02, 1.66, -3.36], [-1.5, 1.6, -3.78], 34);
SHOT_CAMS[7] = (s) => {
  const end6 = (f: number) => camAt(6, s, Math.min(f, 1109));
  const A = CKf(1124, [0.25, 1.35, 0.0], [-0.619, 1.104, -2.138], 46);
  const B = CKf(1236, [-1.12, 1.94, -2.52], [-1.58, 1.76, -3.5], 40);
  const p = spline([A, HOLD(A, 1162), B, HOLD(B, 1257), MAC_O, HOLD(MAC_O, 1360), MAC_T, HOLD(MAC_T, 1412), { ...MAC_O, f: 1433, fov: 40 }]);
  return [K(1110, swing(end6, 1109, F((f) => p(f), 1124, 0.0010), 1124, 0.6), 1, true)];
};
SHOT_ACTS[7] = (f, s) => {
  const fT = toward(7, s, f, E7, HOSE_T), sweep = Math.sin(f * 0.07) * 3;
  const earl = flow(f, [
    [1110, { expr: "neutral", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: [[22, 18], [30, 34]] as A2, propR: "lantern" }],
    [1150, { expr: "smug", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: [[24, -2], [36, -22]] as A2, armRFront: true, propR: "lantern", headTilt: 3 }, 10], // "off"
  ]);
  return {
    ctl: { ice: 1, frost: 0.92, spray: 1, pots: 0.3, potsOut: 4, dFrost: 0.85, hose: f < 1250 ? 1 : 0, ...nozzle(E7, HOSE_T, 7, s, f), tx: HOSE_T[0], ty: HOSE_T[1], tz: HOSE_T[2],
      drops: f >= 1180 ? 1 : 0, heat: f < 1214 ? 0 : sm(f, 1214, 1243) * (f > 1400 ? 1 - sm(f, 1400, 1430) * 0.5 : 1), etemp: 32, ...LANTERN(E7, -1, 1), glint: f > 1180 ? 0.2 : 1 },
    cast: [C("earl", E7, earl, { idx: 1 })],
    focus: f < 1162 ? head(E7) : f < 1360 ? GROVE.HERO_ORANGE : f < 1412 ? GROVE.ETHERMO : GROVE.HERO_ORANGE, subj: f < 1162 ? "earl" : null,
  };
};

// ================================================= SCENE 8 (1434-1565) THE CELLAR: the tub freezes, the jars don't
const J8: V3 = [0.25, 0, -0.62], J8s: V3 = [-0.3, 0, -1.3], J8x: V3 = [2.4, 0, 1.4];   // June behind the tub, the jar shelf behind her
SHOT_CAMS[8] = () => {
  const A = CKf(1434, [0.02, 2.24, 0.14], [0, 0.27, 0.1], 40);
  const B = CKf(1490, [0.15, 1.65, 1.95], [0.116, 0.915, -0.573], 50);
  const C2 = CKf(1556, [-0.4, 1.22, -1.08], [-0.22, 1.12, -1.86], 36);
  const p = spline([A, HOLD(A, 1446), B, HOLD(B, 1522), C2]);
  return [K(1434, F((f) => p(f), 1490, 0.0012), 24, true)];
};
SHOT_ACTS[8] = (f, s) => {
  const walk1 = walkPath(8, s, [J8, [-0.05, 0, -1.0], J8s], f, 1524, 1538), walk2 = walkPath(8, s, [J8s, [1.1, 0, -0.9], J8x], f, 1540, 1560);
  const pos: V3 = f < 1524 ? J8 : f < 1540 ? walk1.p : walk2.p;
  const fTub = toward(8, s, f, J8, [0, 0, 0.1]);
  const june = f < 1524 ? flow(f, [
    [1434, { expr: "smile_closed", facing: fTub, armR: [[24, 10], [36, 0]] as A2, armRFront: true, propR: "ladle" }],
    [1496, { expr: "neutral", facing: fTub, armR: [[24, -18], [36, -40]] as A2, armRFront: true, propR: "ladle", tilt: -3 }, 6],   // wind-up
    [1505, { expr: "smile_closed", facing: fTub, armR: [[26, 14], [44, 34]] as A2, armRFront: true, propR: "ladle", tilt: 6 }, 2],  // tap! "the tub freezes"
    [1514, { expr: "smile_closed", facing: fTub, armR: [[24, 10], [36, 0]] as A2, armRFront: true, propR: "ladle" }, 8],
  ]) : pose(null, { expr: "smile_closed", mode: f < 1538 || (f > 1540 && f < 1560) ? "walk" : "stand", phase: f < 1540 ? walk1.phase : walk2.phase, facing: f < 1540 ? walk1.facing : walk2.facing,
    armR: f >= 1538 ? [[24, 10], [34, 0]] as A2 : [[24, 10], [36, 0]] as A2, armRFront: true, propR: f >= 1538 ? "jar" : "ladle" });
  return {
    ctl: { tubIce: lerp(0.15, 1, sm(f, 1440, 1512)), wallFrost: lerp(0.1, 0.9, lin(f, 1440, 1540)), jarOut: f >= 1538 ? 1 : 0, hatch: 0.55 },   // cold moonlight down the stairs: a cool fill against the lamp
    cast: f < 1561 ? [C("june", pos, june, { idx: 32 })] : [],
    fx: fxs(f >= 1505 && f < 1516 ? clang("tap", [0.12, 0.33, 0.25], f - 1505, 0.25) : null),
    focus: f < 1450 ? [0, 0.27, 0.1] : f < 1522 ? head(J8) : [-0.22, 1.12, -1.86], subj: f < 1450 || f > 1540 ? null : "june",
  };
};

// ================================================= SCENE 9 (1566-1685) SUNRISE: the ice slides off; full of juice
const E9: V3 = [-0.85, 0, -1.95];
SHOT_CAMS[9] = () => {
  const A = CKf(1566, [-0.6, 7.6, 9.5], [-3.0, 3.6, -6.0], 52);
  const B = CKf(1630, [-0.5, 3.3, 2.6], [-2.2, 2.0, -3.5], 50);
  const C2 = CKf(1662, [-0.45, 1.42, 0.65], [-0.848, 1.077, -1.94], 46);   // Earl's side of the fence (no post across him)
  const p = spline([A, B, C2]);
  return [K(1566, F((f) => p(f), 1662, 0.0016), 24, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const fC = toward(9, s, f, E9, [0, 0, 0]);
  const earl = flow(f, [
    [1566, { expr: "calm", facing: -fC, armR: [[26, -12], [40, -36]] as A2, armRFront: true, propR: "orange" }],
    [1630, { expr: "smug", facing: fC, armR: [[26, -12], [40, -36]] as A2, armRFront: true, propR: "orangeHalf", armL: [[-24, 14], [-30, 2]] as A2, armLFront: true, propL: "juiceGlass" }, 10],
    [1652, { expr: "smug", facing: fC, armR: [[24, -18], [30, -38]] as A2, armRFront: true, propR: "orangeHalf", armL: [[-24, 14], [-30, 2]] as A2, armLFront: true, propL: "juiceGlass", tilt: -3 }, 6],   // squeeze: "full of juice"
  ]);
  const jx = E9[0] + 0.02, juice = f >= 1656 ? [0, 1, 2, 3].map((i) => ({ kind: "card" as const, key: "juice" + (Math.floor(f / 3 + i) % 3), pos: [jx + 0.05, 1.18 - i * 0.07, E9[2] + 0.12] as V3, w: 0.05, h: 0.08,
    draw: (p: Pen) => { const g = p.g; g.fillStyle = "#ffb43a"; g.strokeStyle = INKC; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 64, 22, 34, 0, 0, 6.3); g.fill(); g.stroke(); } })) : [];
  return {
    ctl: { ice: 1, melt: sm(f, 1588, 1650), juice: sm(f, 1600, 1660), frost: lerp(0.6, 0.15, lin(f, 1566, 1680)), dFrost: 0.9, spray: 1 - sm(f, 1570, 1600), pots: 0, glint: 1.3 },
    cast: [C("earl", E9, earl, { idx: 1 })],
    fx: juice,
    focus: f < 1630 ? GROVE.HERO : head(E9), subj: f < 1630 ? null : "earl",
  };
};

// ================================================= SCENE 10 (1686-1923) THE BET: "it doesn't count", frozen solid
const D10: V3 = [0.6, 0, 0.62], E10: V3 = [-0.45, 0, 1.45];
SHOT_CAMS[10] = (s) => {
  const end9 = (f: number) => camAt(9, s, Math.min(f, 1685));
  const A = CKf(1694, [-1.7, 1.36, 1.3], [0.595, 1.106, 0.621], 44);               // Duane over the fence, between two posts (top rail at his chest)
  const B = CKf(1750, [-0.5, 1.38, 5.5], [0.07, 0.94, 1.04], 48);                  // the two-shot along the fence: Earl left, Duane right
  const C2 = CKf(1820, [-1.0, 1.36, 4.1], [-0.199, 1.069, 1.507], 46), C3 = CKf(1900, [-1.0, 1.36, 3.78], [-0.24, 1.1, 1.507], 46);   // Earl left, Duane right, the crate at Earl's feet: the clonk on the rail
  const R10 = 0.0011, cB = COMP(B, 1694, R10), cC2 = COMP(C2, 1694, R10), cC3 = COMP(C3, 1694, R10);
  const p = spline([A, HOLD(A, 1742), cB, HOLD(cB, 1810), cC2, cC3]);
  return [K(1686, swing(end9, 1685, F((f) => p(f), 1694, R10, [[1898, 0.006, 14]]), 1694, 0.3), 1, true)];
};
KICKS.push([1898 / 30, 0.25]);
SHOT_ACTS[10] = (f, s) => {
  const fE = toward(10, s, f, D10, E10), fD = toward(10, s, f, E10, D10);
  const duane = flow(f, [
    [1686, { expr: "tache", facing: fE, armR: AR.hipR, armL: AR.hipL }],
    [1692, { expr: "shock", facing: fE, armR: AR.hipR, armL: AR.hipL, sweat: 1 }, 4],                         // sees the juice
    [1712, { expr: "tache", facing: fE, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, headTilt: 5 }, 8],   // "doesn't count"
    [1726, { expr: "tache", facing: fE, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, headTilt: -5 }, 8],
    [1748, { expr: "tache", facing: fE, armR: AG.wagR, armRFront: true, armL: AR.hipL }, 6],                   // "technically"
    [1760, { expr: "tache", facing: fE, armR: [[26, -12], [48, -30]] as A2, armRFront: true, armL: AR.hipL }, 6],
    [1776, { expr: "tacheUp", facing: fE, armR: AG.wagR, armRFront: true, armL: AR.hipL }, 6],                 // "Earl froze his first"
    [1798, { expr: "dismay", facing: fE, armR: [[24, 4], [40, -10]] as A2, armL: [[-24, 4], [-40, -10]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.6 }, 6],   // heaves the crate up
    [1812, { expr: "dismay", facing: fE, armR: [[26, -16], [40, -44]] as A2, armL: [[-26, -16], [-40, -44]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0, tilt: 6 }, 5],   // tosses it over the fence
    [1845, { expr: "dismay", facing: fE, armR: AR.hipR, armL: AR.hipL }, 10],
    [1900, { expr: "breakdown", facing: fE, armR: AR.hipR, armL: AR.hipL, sweat: 1 }, 3],                      // his own oranges: rocks
  ]);
  const earl = flow(f, [
    [1686, { expr: "smug", facing: fD, armR: AG.sipR, armRFront: true, propR: "juiceGlass", armL: AR.hipL }],
    [1760, { expr: "smug", facing: fD, armR: AG.sipR, armRFront: true, propR: "juiceGlass", armL: AR.hipL, headTilt: -4 }, 8],
    [1850, { expr: "neutral", facing: fD, armR: [[30, 22], [48, 52]] as A2, armRFront: true, armL: AR.hipL, tilt: 8 }, 8],   // bends to the crate at his feet
    [1862, { expr: "neutral", facing: fD, armR: AG.holdUpR, armRFront: true, propR: "frozenOrange", armL: AR.hipL }, 8],
    [1888, { expr: "bored", facing: fD, armR: [[30, -24], [44, -56]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: -3 }, 6],   // wind-up
    [1898, { expr: "bored", facing: fD, armR: [[36, 2], [70, 8]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: 6 }, 2],  // CLONK on the crate on "solid"
    [1906, { expr: "bored", facing: fD, armR: [[34, 2], [62, 6]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: 3 }, 8],
  ]);
  // Duane heaves his crate up (1800-1812) and tosses it over the fence; it lands at Earl's feet (1830)
  const up = sm(f, 1800, 1812), toss = lin(f, 1812, 1830);
  const crateX = f < 1812 ? GROVE.CRATE_POST[0] : lerp(GROVE.CRATE_POST[0], -0.2, toss), crateZ = f < 1812 ? GROVE.CRATE_POST[2] : lerp(GROVE.CRATE_POST[2], 2.0, toss);
  const crateY = f < 1812 ? 0.7 * up : 0.7 * (1 - toss) + 1.1 * Math.sin(Math.PI * toss) * (1 - 0.3 * toss), crateRot = f < 1812 ? 0 : 0.5 * Math.sin(Math.PI * toss);
  return {
    ctl: { ice: 1, melt: 1, juice: 1, frost: 0.1, dFrost: 0.9, pots: 0, crate: 1, cx: crateX, cy: Math.max(0, crateY), cz: crateZ, crot: crateRot, chip: f >= 1898 ? lin(f, 1898, 1916) : 0, chx: 0.0, chy: 0.99, chz: 1.42 },
    cast: [C("duane", D10, duane, { idx: 2 }), C("earl", E10, earl, { idx: 1 })],
    fx: fxs(f >= 1898 && f < 1909 ? clang("clonk", [-0.02, 1.0, 1.42], f - 1898, 0.42) : null),
    focus: f < 1742 ? head(D10) : f < 1810 ? [0.07, 1.3, 1.04] : head(E10), subj: f < 1742 ? "duane" : "earl",
  };
};

// lens (depth of field): CU / inserts soft behind, mediums gentle, wides almost sharp
lens3([[0, DOF_MS], [40, DOF_INSERT, 20], [100, DOF_WS, 24], [180, DOF_FS, 16], [240, DOF_FS, 8], [280, DOF_MS, 8], [410, DOF_CU, 8], [458, DOF_INSERT, 12],
  [530, DOF_FS, 30], [622, DOF_INSERT, 1], [690, DOF_WS, 16], [749, DOF_FS, 1], [826, DOF_CU, 8], [884, DOF_FS, 10], [969, DOF_INSERT, 1], [1030, DOF_FS, 30],
  [1124, DOF_FS, 14], [1180, DOF_INSERT, 30], [1434, DOF_INSERT, 1], [1460, DOF_FS, 24], [1530, DOF_INSERT, 24], [1566, DOF_WS, 1], [1640, DOF_FS, 20],
  [1694, DOF_CU, 8], [1742, DOF_FS, 14], [1820, DOF_MS, 14]]);

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
