// Timeline of "The Rat Poison Gold Medal": shots timed to the voice (audio/words.json), cameras (CAMS in
// cams.ts, set-local coordinates), kicks, lens table. Camera grammar from the measured reference (motion.md): almost
// no hard cuts, every hold creeps in 0.15-0.35 %/f (0.6 %/f on punch words), glides are symmetric smootherstep moves of
// 18-40 f, place changes dissolve over 6-8 f (XFADE), impacts are 7-frame sign-flipping kicks, rolls of 4-5 deg glided in.
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1772; // 59.07 s: ends on the last spoken word "car." (v10.4 fix 8)
export const D0 = 0; // build.ts legacy import
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const T = (f: number) => f / FPS;

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number; set: string; light: LightName; name: string };
const S = (id: number, a: number, b: number, set: string, light: LightName, name: string): ShotDef => ({ id, a, b, set, light, name });
export const STORY_SHOTS: ShotDef[] = [
  S(1, 0, 108, "road", "roadLate", "S01 HOOK coach spoons rat poison into the runner"),
  S(2, 108, 201, "stadium", "stadium", "S02 You see, the 1904 marathon is 25 miles of dusty road"),
  S(3, 201, 291, "stadium", "stadium", "S03 90-degree heat, the organizer studies thirst"),
  S(4, 291, 327, "stadium", "stadium", "S04 So there's just one (map push-in)"),
  S(5, 327, 357, "road", "road", "S05 ...well (the real well, top-down)"),
  S(6, 357, 482, "road", "road", "S06 cars full of officials, dust, Keep up boys!"),
  S(7, 482, 553, "road", "road", "S07 dust so thick they could chew it"),
  S(8, 553, 626, "road", "road", "S08 breathes in so much he nearly dies"),
  S(9, 626, 770, "road", "road", "S09 the mailman, rotten apples, nap"),
  S(10, 770, 842, "road", "road", "S10 chased a mile off course by a dog"),
  S(11, 842, 888, "road", "road", "S11 So how does anyone win this?"),
  S(12, 888, 965, "road", "roadLate", "S12 Thomas Hicks begging for water"),
  S(13, 965, 1102, "road", "roadLate", "S13 coach says no, mixes egg, brandy, rat poison"),
  S(14, 1102, 1156, "road", "roadLate", "S14 official yells You're poisoning him!"),
  S(15, 1156, 1202, "road", "roadLate", "S15 the coach shrugs: just a pinch"),
  S(16, 1202, 1243, "road", "roadLate", "S16 then another one"),
  S(17, 1243, 1372, "drugstore", "drugNight", "S17 That's the trick: an energy drink"),
  S(18, 1372, 1436, "drugstore", "drugNight", "S18 so much coffee your hands shake"),
  S(19, 1436, 1510, "drugstore", "drugNight", "S19 one pinch too many and you're dead"),
  S(20, 1510, 1632, "stadium", "finish", "S20 staggers on, carried over the finish line (payoff)"),
  S(21, 1632, 1683, "stadium", "finish", "S21 wins gold, eight pounds lighter"),
  S(22, 1683, TOTAL, "stadium", "finish", "S22 the first guy took a car"),
];
/** preview mode (style lock / set building): inputProps { preview: { set, light, cam?, pos?, look?, fov?, t?, ctl?, cast? } } */
export type PreviewCast = { who: string; mark?: string; pos?: V3; o?: Record<string, unknown>; scale?: number };
export type Preview = { set: string; light: LightName; cam?: string; pos?: V3; look?: V3; fov?: number; t?: number; ctl?: Record<string, number>; cast?: PreviewCast[]; cInf?: number };
export const PREVIEW = (getInputProps() as { preview?: Preview }).preview;
/** test renders: inputProps { only: [ids] } builds only those shots' sets (frames stay absolute) */
const ONLY = (getInputProps() as { only?: number[] }).only;
export const SHOTS: ShotDef[] = PREVIEW ? [S(1, 0, TOTAL, PREVIEW.set, PREVIEW.light, "preview")] : ONLY ? STORY_SHOTS.filter((s) => ONLY.includes(s.id)) : STORY_SHOTS;
/** crossfades (frames) where the place or time changes (6-8 f dissolves, measured) */
export const XFADE: Record<number, number> = PREVIEW ? {} : { 2: 8, 5: 8, 12: 8, 17: 8, 20: 8 };
export const FLASH_AT = 1640; // soft gold flash as the medal goes on (payoff light change)
export const STORY_BY_ID = (id: number) => SHOTS.find((s) => s.id === id) ?? SHOTS[0];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera machinery ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
export const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: subject grows ~rate per frame; `punch` raises it (8 f soft edges) for n frames */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// impact kicks: offset flips sign every frame, decays to 0 in 7 f (t in seconds, gain)
export const KICKS: [number, number][] = [[4.2, 0.4], [20.28, 0.4], [41.5, 0.8], [49.94, 0.5], [53.85, 0.45]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) { const n = Math.floor((t - t0) * FPS + 1e-6); if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const applyKick = (c: Cam, t: number): Cam => {
  const a = kickAt(t); if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1, m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens (filled by cams.ts) ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [{ f: 0, cInf: 0 }];
export const dofAt = (f: number) => {
  if (PREVIEW) return { cInf: PREVIEW.cInf ?? 10, focus: undefined as undefined | ((f: number) => V3) };
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
