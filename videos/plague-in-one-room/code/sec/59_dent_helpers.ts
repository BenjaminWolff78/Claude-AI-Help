// ================= dentist video (2026-11-17): staging helpers (swing, toward, head, arm presets) carried over from the hens video
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

// ---------------- v20/v21 hand-off helpers ----------------
/** shoulder height on the card (design px) by build and mode: standing figures keep the shoulder at y 447 (handXY);
 *  sitting drops the torso by about a quarter of the body */
const SHOULDER_DY: Record<string, number> = { sit: 205 };
/** an arm (elbow, hand) that puts the hand on world point T for a figure at P seen from the shot camera at frame f.
 *  side 1 = right arm (screen right of the body), -1 = left. The elbow bends outward/down by `bend`. Used for every
 *  grip and release so the prop changes owner where both hands are (board BA: reach, grip, carry, release). */
const armTo = (id: number, s: SetDef, f: number, P: V3, T: V3, side: 1 | -1, fs = 0, sc = 1, mode = "stand", bend = 10): A2 => {
  const c = camAt(id, s, f), yaw = Math.atan2(c.pos[0] - P[0], c.pos[2] - P[2]);
  const lat = (T[0] - P[0]) * Math.cos(yaw) - (T[2] - P[2]) * Math.sin(yaw);
  const X = 300 + lat / (SU * sc), Y = 975 - (T[1] - P[1]) / (SU * sc) - (SHOULDER_DY[mode] ?? 0);
  const hx = (X - 300 - 3 * 2.36 * fs - side * 75) / 2.36, hy = (Y - 447) / 2.36;
  const L = Math.hypot(hx, hy), k = L > 62 ? 62 / L : 1;   // arms never stretch past ~62 units
  const h: [number, number] = [hx * k, hy * k];
  return [[h[0] * 0.5 + side * bend, h[1] * 0.5 + bend], h];
};
/** where a hand at arm offset `h` would be in the world (inverse of armTo; the prop is drawn there) */
const handAt = (id: number, s: SetDef, f: number, P: V3, h: [number, number], side: 1 | -1, fs = 0, sc = 1, mode = "stand"): V3 => {
  const c = camAt(id, s, f), [X, Y] = handXY(side, h, fs);
  return cardPt(P, c.pos, X, Y + (SHOULDER_DY[mode] ?? 0), sc);
};
/** a reclined patient in the dental chair: a sitting card rolled back (k 0 = sitting up, 1 = fully reclined) */
const RECL = (k: number): { pos: V3; roll: number } => ({ pos: [lerp(3.45, 4.03, k), lerp(0.47, 0.58, k), -8.6], roll: lerp(0.12, 0.95, k) });
/** a smear streak (BC3: a 2-4 frame strike shows every frame, with a streak behind the hand) */
const smear = (key: string, a: V3, b: V3, op = 0.8): FxSpec => ({ kind: "card", key: "smear" + key, pos: lerp3(a, b, 0.5), w: Math.max(0.12, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])), h: 0.07, rot: Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])), soft: true, cw: 128, ch: 32, op,
  draw: (p) => { const g = p.g, gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(250,246,236,0.9)"); g.fillStyle = gr; g.beginPath(); g.ellipse(64, 16, 62, 10, 0, 0, 6.3); g.fill(); } });
/** comic sound cards: BZZ (a drill whine), AAAH (Pratt), the key's unlock sting, a wake-up "!" */
const wordCard = (key: string, txt: string, pos: V3, age: number, life: number, col: string, w = 0.6): FxSpec[] => {
  if (age < 0 || age > life) return [];
  const k = Math.min(1, age / 3) * (1 - Math.max(0, (age - life + 4) / 4)), wob = 0.08 * Math.sin(age * 1.7);
  return [{ kind: "card", key: key + Math.round(k * 6) + (age % 4 < 2 ? "a" : "b"), pos, w: w * (0.7 + 0.3 * Math.min(1, age / 3)), h: w * 0.45, rot: wob, cw: 256, ch: 116, op: Math.max(0, k),
    draw: (p) => { const g = p.g; g.font = "900 78px Arial Black, Arial"; { const tw = g.measureText(txt).width; if (tw > 214) g.font = `900 ${Math.floor(78 * 214 / tw)}px Arial Black, Arial`; } g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 14; g.strokeStyle = INKC; g.lineJoin = "round"; g.strokeText(txt, 128, 60); g.fillStyle = col; g.fillText(txt, 128, 60);
      g.strokeStyle = col; g.lineWidth = 6; for (const [x0, y0, x1, y1] of [[14, 30, 2, 18], [14, 90, 2, 102], [242, 30, 254, 18], [242, 90, 254, 102]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } } }];
};
const bzz = (pos: V3, age: number) => wordCard("bzz", "BZZZ", pos, age, 12, "#7ad0f0", 0.55);
const shout = (pos: V3, age: number) => wordCard("aah", "AAAH!", pos, age, 36, "#f4c430", 0.75);
const zzzPop = (pos: V3, age: number) => wordCard("wake", "!", pos, age, 16, "#f4c430", 0.3);
/** the Loophole Key signature: a gold glint ring + 6 sparkle rays at the lock (age 0..16), with the unlock sting on the mix */
const unlockSting = (pos: V3, age: number): FxSpec[] => {
  if (age < 0 || age > 16) return [];
  const k = Math.sin((age / 16) * Math.PI);
  return [{ kind: "card", key: "sting" + Math.round(k * 8), pos, w: 0.25 + 0.3 * k, h: 0.25 + 0.3 * k, cw: 128, ch: 128, soft: true,
    draw: (p) => { const g = p.g, gr = g.createRadialGradient(64, 64, 4, 64, 64, 60); gr.addColorStop(0, "rgba(255,236,160,0.9)"); gr.addColorStop(1, "rgba(255,200,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#ffd45a"; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + age * 0.08; g.beginPath(); g.moveTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22); g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); g.stroke(); } } }];
};
/** an arm timeline with no jumps: segments [start frame, arm function (frame) -> A2, blend frames]; each segment eases
 *  in from the previous one over its blend (arc blend, overshoot + settle), so a hand never teleports (board BA) */
type ArmSeg = [number, (g: number) => A2, number?];
const armSeq = (f: number, segs: ArmSeg[]): A2 => {
  let i = 0; for (let j = 0; j < segs.length; j++) if (f >= segs[j][0]) i = j;
  const cur = segs[i][1](f); if (i === 0) return cur;
  const bl = segs[i][2] ?? 10, u = (f - segs[i][0]) / bl;
  if (u >= 1) return cur;
  return arcArm(armSeq(f, segs.slice(0, i)) as unknown as number[][], cur as unknown as number[][], osE(u, bl >= 6 ? OS_ARM : 0));
};
const fixA = (a: A2) => (_g: number) => a;
/** a continuous world-point path through keyed points (eased between keys); values may follow moving things */
type PK = [number, V3 | ((g: number) => V3)];
const path3 = (f: number, keys: PK[]): V3 => {
  const at = (k: PK) => (typeof k[1] === "function" ? (k[1] as (g: number) => V3)(f) : (k[1] as V3));
  if (f <= keys[0][0]) return at(keys[0]);
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerp3(at(keys[i - 1]), at(keys[i]), sm(f, keys[i - 1][0], keys[i][0]));
  return at(keys[keys.length - 1]);
};
