// Timeline of "Why Boston Shipped Ice to India": shots timed to the voice (audio/words.json), cameras (CAMS in
// cams.ts, set-local coordinates), kicks, lens table. Camera grammar from the measured reference (motion.md): almost
// no hard cuts, every hold creeps in 0.15-0.35 %/f (0.6 %/f on punch words), glides are symmetric smootherstep moves of
// 18-40 f, place changes dissolve over 6-8 f (XFADE), impacts are 7-frame sign-flipping kicks, rolls of 4-5 deg glided in.
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1941; // 64.7 s
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
  S(1, 0, 132, "boston", "dusk", "S01 hook: hauls the block"),
  S(2, 132, 216, "boston", "dusk", "S02 name + laughing crowd"),
  S(3, 216, 306, "boston", "dusk", "S03 newspaper quote"),
  S(4, 306, 413, "martinique", "tropic", "S04 You see, nobody has seen ice"),
  S(5, 413, 479, "martinique", "tropic", "S05 opens the hold"),
  S(6, 479, 554, "martinique", "tropic", "S06 half a puddle, nobody wants it"),
  S(7, 554, 651, "sea", "sea", "S07 ocean of heat -> soup"),
  S(8, 651, 733, "boston", "golden", "S08 tries again, money lost"),
  S(9, 733, 804, "prison", "night", "S09 debtors' prison"),
  S(10, 804, 867, "lab", "lab", "S10 ice house lab"),
  S(11, 867, 981, "lab", "lab", "S11 rice husks, shavings melt"),
  S(12, 981, 1104, "sawmill", "spring", "S12 sawmill dumping sawdust"),
  S(13, 1104, 1150, "sawmill", "spring", "S13a magnifier"),
  S(14, 1150, 1198, "micro", "micro", "S13b inside the sawdust"),
  S(15, 1198, 1246, "sawmill", "spring", "S14 That's the trick!"),
  S(16, 1246, 1326, "beach", "beach", "S15 cooler gag"),
  S(17, 1326, 1395, "lab", "lab", "S16 sawdust block barely melts"),
  S(18, 1395, 1512, "cabin", "cabin", "S17 Boston to Calcutta map"),
  S(19, 1512, 1575, "voyage", "sea", "S18 four months, equator twice"),
  S(20, 1575, 1620, "calcutta", "golden", "S19a hold opens in India"),
  S(21, 1620, 1702, "calcutta", "golden", "S19b ice slides out (payoff)"),
  S(22, 1702, 1749, "calcutta", "golden", "S20 people line up"),
  S(23, 1749, 1839, "calcutta", "golden", "S21 Ice King"),
  S(24, 1839, TOTAL, "boston", "summer", "S22 callback"),
];
/** preview mode (style lock / set building): inputProps { preview: { set, light, cam?, pos?, look?, fov?, t?, ctl?, cast? } } */
export type PreviewCast = { who: string; mark?: string; pos?: V3; o?: Record<string, unknown>; scale?: number };
export type Preview = { set: string; light: LightName; cam?: string; pos?: V3; look?: V3; fov?: number; t?: number; ctl?: Record<string, number>; cast?: PreviewCast[]; cInf?: number };
export const PREVIEW = (getInputProps() as { preview?: Preview }).preview;
/** test renders: inputProps { only: [ids] } builds only those shots' sets (frames stay absolute) */
const ONLY = (getInputProps() as { only?: number[] }).only;
export const SHOTS: ShotDef[] = PREVIEW ? [S(1, 0, TOTAL, PREVIEW.set, PREVIEW.light, "preview")] : ONLY ? STORY_SHOTS.filter((s) => ONLY.includes(s.id)) : STORY_SHOTS;
/** crossfades (frames) where the place or time changes (6-8 f dissolves, measured) */
export const XFADE: Record<number, number> = PREVIEW ? {} : { 4: 8, 7: 8, 8: 8, 10: 8, 12: 8, 14: 8, 15: 6, 16: 8, 17: 8, 18: 8, 19: 8, 20: 8, 24: 8 };
export const FLASH_AT = 1660; // soft cyan-white flash as the payoff block lands (light change)
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
export const KICKS: [number, number][] = [[25.6, 1.2], [9.4, 0.5], [55.33, 0.8], [16.0, 0.4]];
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
