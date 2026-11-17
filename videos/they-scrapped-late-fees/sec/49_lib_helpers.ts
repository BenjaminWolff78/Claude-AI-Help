// ================= library video: staging helpers (swing, toward, head, arm presets) carried over from the brick video
type CamT = { pos: V3; look: V3; fov: number; roll: number };
type CK = { f: number; pos: V3; look: V3; fov: number };
const CKf = (f: number, pos: V3, look: V3, fov = 44): CK => ({ f, pos, look, fov });
const dirOf = (c: Shot) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), L }; };
/** a whip / swing between two framings: the view direction turns through yaw, the position slides, eased over [f0, f1] */
const swing = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0) => (f: number): Shot => {
  const A = from(f0), B = to(f), k = sm(f, f0, f1), da = dirOf(A), db = dirOf(B);
  let dy = db.yaw - da.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  const yaw = da.yaw + dy * k, pitch = lerp(da.pitch, db.pitch, k), L = lerp(da.L, db.L, k);
  const pos = lerp3(A.pos, B.pos, k); pos[1] += lift * Math.sin(Math.PI * k);
  return { pos, look: [pos[0] + Math.sin(yaw) * Math.cos(pitch) * L, pos[1] + Math.sin(pitch) * L, pos[2] + Math.cos(yaw) * Math.cos(pitch) * L], fov: lerp(A.fov ?? 40, B.fov ?? 40, k), roll: 0 };
};
/** r9: a clear 3/4 turn toward the partner (at least 0.72) whenever the partner is off to one side on screen */
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => { const v = faceTo(id, s, f, a, b); return Math.abs(v) < 0.02 ? 0 : Math.sign(v) * Math.max(0.72, Math.min(1, Math.abs(v))); };
const EYE = 1.3;
const head = (p: V3, y = EYE): V3 => [p[0], p[1] + y, p[2]];
const box = (p: V3, y0: number, y1: number, w: number): Box => [p, y0, y1, w];
/** reference blur levels (v14: insert 14, close-up 13, full 8, wide 5, medium 8 or less) */
const B_INS = 14, B_CU = 13, B_MS = 7, B_FS = 6, B_WS = 4;
/** v14 arm set for the brick video */
const AB = {
  slamR: [[24, 10], [40, 30]] as A2, slamL: [[-24, 10], [-40, 30]] as A2, liftUpR: [[22, -24], [26, -58]] as A2, liftUpL: [[-22, -24], [-26, -58]] as A2,
  patR: [[26, 14], [44, 30]] as A2, holdOutR: [[26, 6], [46, 0]] as A2, carryR: [[22, 12], [36, 4]] as A2, carryL: [[-22, 12], [-36, 4]] as A2,
  quillR: [[24, 4], [40, -12]] as A2, ledgerL: [[-22, 12], [-34, 0]] as A2, stampUpR: [[22, -20], [30, -48]] as A2, stampDnR: [[24, 8], [34, 18]] as A2,
  pointR: [[28, -8], [58, -16]] as A2, pointL: [[-28, -8], [-58, -16]] as A2, leanR: [[24, 14], [36, 34]] as A2, handleR: [[26, 18], [42, 34]] as A2, handleL: [[-26, 18], [-42, 34]] as A2,
  heaveR: [[26, 4], [40, -14]] as A2, heaveL: [[-26, 4], [-40, -14]] as A2, backR: [[20, 14], [-6, 24]] as A2, sipR: [[20, 10], [8, -14]] as A2,
};

// ================================================= SCENE 1 (0-480) BRICKYARD, GOLDEN MORNING
