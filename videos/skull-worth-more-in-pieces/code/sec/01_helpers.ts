
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
// ---------------- v14 r5 framing helpers (subject first: head width % of the frame, screen x %, eyes ~40% down) ----------------
const HEAD_M = 0.52;
/** a camera on one head: yaw (deg, 0 = camera on +z looking -z, 90 = camera on +x looking -x), head width hw (0..1 of the
 *  frame width), head centre at screen x% xp, lens dy metres above the head (looking slightly down), eyes at ~40% height */
const frameOn = (head: V3, yaw: number, hw: number, xp = 50, fov = 52, dy = 0.2, eyeY = 0.4): CamT => {
  const th = Math.tan((fov * Math.PI) / 360), d = HEAD_M / (hw * 2 * 0.5625 * th), a = (yaw * Math.PI) / 180;
  const bx = Math.sin(a), bz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a);          // back vector and screen-right vector
  const pos: V3 = [head[0] + bx * d, head[1] + dy, head[2] + bz * d];
  const off = ((xp - 50) / 50) * th * 0.5625 * d, vy = (0.5 - eyeY) * 2 * th * d;        // lateral shift of the look, vertical
  return { pos, look: [head[0] - rx * off, head[1] - vy + dy * 0.0, head[2] - rz * off], fov, roll: 0 };
};
/** a camera on two heads A (screen x% xa) and B (screen x% xb), from yaw; the lens height dy above the mean head */
const frameTwo = (A: V3, B: V3, yaw: number, xa: number, xb: number, fov = 52, dy = 0.25, eyeY = 0.42): CamT => {
  const a = (yaw * Math.PI) / 180, rx = Math.cos(a), rz = -Math.sin(a), bx = Math.sin(a), bz = Math.cos(a), th = Math.tan((fov * Math.PI) / 360) * 0.5625;
  // lateral separation of the heads along screen-right, and their depth difference along the view axis
  const sep = (B[0] - A[0]) * rx + (B[2] - A[2]) * rz, ddep = -((B[0] - A[0]) * bx + (B[2] - A[2]) * bz);
  // solve for the depth dA of A so that the screen positions land: xA = 50 + 50*(lA/(th*dA)), xB with dB = dA + ddep
  let lo = 0.6, hi = 30; for (let i = 0; i < 50; i++) { const dA = (lo + hi) / 2, dB = dA + ddep, lA = -((50 - xa) / 50) * th * dA, xbN = 50 + 50 * ((lA + sep) / (th * Math.max(0.2, dB)));
    if ((xbN - xa) / (xb - xa) > 1) lo = dA; else hi = dA; }
  const dA = (lo + hi) / 2, lA = -((50 - xa) / 50) * th * dA;
  const cx = A[0] - rx * lA + bx * dA, cz = A[2] - rz * lA + bz * dA, my = (A[1] + B[1]) / 2;
  const D = Math.max(0.8, dA + ddep / 2), vy = (0.5 - eyeY) * 2 * Math.tan((fov * Math.PI) / 360) * D;
  return { pos: [cx, my + dy, cz], look: [cx - bx * D, my - vy, cz - bz * D], fov, roll: 0 };
};
