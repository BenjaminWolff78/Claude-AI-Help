// Timeline of "He Covered His Oranges in Ice to Stop Them Freezing": 10 scene ids timed to the voice (audio/words.json),
// cameras + acting in shots.ts (set-local coordinates). Home base: Earl's and Duane's groves (dusk, 9 p.m., midnight,
// 3 a.m., sunrise) + the root cellar. Master prompt v13: a real time of day per scene, people in every story beat, the
// comparison in the story world, one ending on the last word.
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1860; // 62.0 s: ends on "...Amos's loaves." (loops into the hook)
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
  S(1, 0, 480, "yard", "yardMorning", "S1 BRICKYARD, GOLDEN MORNING: the hook (the mould comes off a loaf twice as tall as the brick beside it), You see (glide past the drying rows to the taxman at the duty board), Amos pours clay into the deep mould, Silas drops his shovel laughing 'He's baking bread now!', the yard joins in, Amos pulls his cart out"),
  S(2, 480, 618, "village", "streetNoon", "S2 VILLAGE STREET, NOON: the cart rolls through the street, the baker holds his bread beside a loaf, the village laughs; Ned tries to lift one: too heavy"),
  S(3, 618, 919, "yard", "yardGrey", "S3 THE FIRST WEEK, DRIZZLE: the unsold stack grows, builders say too heavy, the taxman counts every loaf, 'A brick's a brick, Amos', stamps; 'Exactly.'"),
  S(4, 919, 1049, "village", "siteSpring", "S4 NED'S SITE, SPRING: Ned lays a loaf, eureka, the wall shoots up, the tea is still hot"),
  S(5, 1049, 1103, "yard", "gateSpring", "S5 BY SPRING: three builders at Amos's cart, Silas peeks in shock"),
  S(6, 1103, 1181, "office", "officeCandle", "S6 BY SUMMER, NIGHT (hard cut, time jump): the taxman behind his ledger; the 1785 total is written: £30 against £60; push to his aghast face on empty"),
  S(7, 1181, 1415, "yard", "shedLantern", "S7 THE TRICK, NIGHT IN THE SHED: same clay on the scale, two same-size walls (8 bricks vs 4 loaves), the slate ticks 8 vs 4, half the coins"),
  S(8, 1415, 1713, "inn", "innEvening", "S8 THE INN: a penny a mug, Amos brings a bucket-sized tankard; Bess measures it and shrugs; the taxman slams the law book; the Act goes up: over 3 inches pays double"),
  S(9, 1713, 1860, "village", "laneSunset", "S9 CHURCH LANE, SUNSET: the taxman's own new house is built of Amos's loaves"),
];
/** preview mode (style lock / set building): inputProps { preview: { set, light, cam?, pos?, look?, fov?, t?, ctl?, cast? } } */
export type PreviewCast = { who: string; mark?: string; pos?: V3; o?: Record<string, unknown>; scale?: number };
export type Preview = { set: string; light: LightName; cam?: string; pos?: V3; look?: V3; fov?: number; t?: number; ctl?: Record<string, number>; cast?: PreviewCast[]; cInf?: number; focus?: V3 };
export const PREVIEW = (getInputProps() as { preview?: Preview }).preview;
/** test renders: inputProps { only: [ids] } builds only those shots' sets (frames stay absolute) */
const ONLY = (getInputProps() as { only?: number[] }).only;
export const SHOTS: ShotDef[] = PREVIEW ? [S(1, 0, TOTAL, PREVIEW.set, PREVIEW.light, "preview")] : ONLY ? STORY_SHOTS.filter((s) => ONLY.includes(s.id)) : STORY_SHOTS;
/** crossfades (frames) where the place or time changes (6-8 f dissolves, measured) */
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 8: 8, 9: 8 };   // v14: cart wheel (shape match), steam (time jump), loaf -> tankard (shape match), the inn door (through it); 618, 919, 1103, 1181 are the 4 hard cuts (time jumps)
export const FLASH_AT = -1000; // no flash in this video
/** light dips (v10.10 rule 7: no crossfade between places with people in them): the frame floods with the light's
 *  colour for ~4 frames, the cut happens under the flood, then it clears over ~6 frames. [shot id] -> colour */
export const DIPS: Record<number, string> = {};
const DIP_K = [0.25, 0.55, 0.8, 0.92, 0.92, 0.78, 0.55, 0.32, 0.15, 0.05]; // from s.a-4 .. s.a+5
export const dipAt = (f: number): { col: string; k: number } | null => {
  for (const s of SHOTS) { const c = DIPS[s.id]; if (c && f >= s.a - 4 && f < s.a + 6) return { col: c, k: DIP_K[f - (s.a - 4)] }; }
  return null;
};
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
export const KICKS: [number, number][] = [];
/** r12 (v14 6.5: the sun stays fixed within a shot): per scene id, the frame whose camera sets the sun direction (default: the scene's first frame) */
export const SUN_REF: Record<number, number> = {};
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
  if (PREVIEW) return { cInf: PREVIEW.cInf ?? 10, focus: (PREVIEW.focus ? () => PREVIEW.focus as V3 : undefined) as undefined | ((f: number) => V3) };
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
