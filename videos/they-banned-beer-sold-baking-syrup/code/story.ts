// Timeline of "He Set the Ice Cream on Fire and It Didn't Melt" (2026-11-27, master prompt v33). One set (bistro).
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1845; // story frames (61.5 s; the voice ends at 61.24 s, the video ends on the flame peak)
/** re-voiced Nov 25 (v30 3.22: no word endings cut): output frame -> story frame through remap.json (a smooth least-squares
 *  map through the shared word starts; the dropped phrase is skipped at the hard cut that already sat there) */
export const WARP = 1, TOTAL_REAL = 1845;
export const storyF = (n: number) => Math.max(0, Math.min(1844, Math.floor(n)));
export const D0 = 0; // build.ts legacy import
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const T = (f: number) => f / FPS;

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number; set: string; light: LightName; name: string };
const S = (id: number, a: number, b: number, set: string, light: LightName, name: string): ShotDef => ({ id, a, b, set, light, name });
const STORY_MAIN: ShotDef[] = [
  S(1, 0, 60, "bistro", "bsKit", "1 HOOK: the kid slides the white dome on the peel into the flaming 500-degree oven"),
  S(2, 60, 139, "bistro", "bsDin", "2 CUT flash-forward: hot rum flames over the dome at the critic's table; the spoon cracks it: frozen inside"),
  S(3, 139, 268, "bistro", "bsSnow", "3 CUT YOU SEE: the snowy street, the boarded-up restaurant with its one-star review; glide to our window"),
  S(4, 268, 365, "bistro", "bsDin", "4 through the glass: the critic orders dessert; follow the waiter past the framed TOO WET review to the kitchen door"),
  S(5, 365, 431, "bistro", "bsKit", "5 through the swing door: the head chef sweating through his hat"),
  S(6, 431, 554, "bistro", "bsKit", "6 the kid heaps meringue on the ice cream block and slides it into the oven"),
  S(7, 554, 700, "bistro", "bsKit", "7 the chef laughs, the cooks laugh, the dishwasher sets a mop bucket under the oven"),
  S(8, 700, 815, "bistro", "bsKit", "8 two-shot: 'Kid, you just made soup!' / 'Three minutes.'"),
  S(9, 815, 960, "bistro", "bsKit", "9 smoke pours out of the oven; the white mountain comes out brown, with black tips; the kid holds it up"),
  S(10, 960, 1040, "bistro", "bsDin", "10 CUT to the critic's table: the kid sets it down; he sniffs, frowns, writes"),
  S(11, 1040, 1170, "bistro", "bsDin", "11 the spoon cracks it open: frozen solid inside; the kid unmoved beside him"),
  S(12, 1170, 1271, "bistro", "bsDin", "12 the bite and the first smile of his life; push into the meringue"),
  S(13, 1271, 1517, "bistro", "bsCut", "13 the cutaway: inside the dessert, the kid and the chef among giant bubbles; heat stalls; the crust browns"),
  S(14, 1517, 1615, "bistro", "bsSnow", "14 CUT the comparison: the critic warm in his puffy coat in the snow"),
  S(15, 1615, 1690, "bistro", "bsDin", "15 back in through the window: diners with baked Alaskas; the chef chalks BAKED ALASKA; the kid brings a second"),
  S(16, 1690, 1845, "bistro", "bsDin", "16 the critic orders another; the kid pours hot rum and sets it on fire: the biggest flame on 'fire'"),
];
/** v34 kit test (inputProps.testScene): a 330-frame scene built natively with the v34 architecture (one act per scene, a
 *  planted-feet walk, a two-handed carry, people sitting ON seats) to run every gate on new code */
export const TEST_SCENE = !!(getInputProps() as { testScene?: boolean }).testScene;
/** v34.1 sit/hold test (inputProps.carTest): Rick's three ways to show a driver, a passing car with its driver, and people
 *  sitting on a bench, a plastic chair and a picnic table (board CB1), each checked by previz_guard before a still is rendered */
export const CAR_TEST = !!(getInputProps() as { carTest?: boolean }).carTest;
const CAR_SHOTS: ShotDef[] = [
  S(201, 0, 60, "cartest", "road", "C1 the driver through the side window: door below the chest, hands on the wheel"),
  S(202, 60, 120, "cartest", "road", "C2 the driver through the windshield: dashboard and wheel in front of the chest"),
  S(203, 120, 180, "cartest", "road", "C3 inside the cabin from the passenger side: on the seat, hands on the wheel, a foot on the pedal"),
  S(204, 180, 240, "cartest", "road", "C4 a car drives past with its driver"),
  S(205, 240, 300, "cartest", "road", "C5 on the bench, front view, hands on the seat edge"),
  S(206, 300, 330, "cartest", "road", "C6 on the plastic chair, profile, an arm on the armrest"),
  S(207, 330, 360, "cartest", "road", "C7 at the picnic table, hands on the table"),
];
export const STORY_SHOTS: ShotDef[] = CAR_TEST ? CAR_SHOTS : TEST_SCENE ? [
  S(101, 0, 150, "bistro", "bsDin", "T1 the waiter carries the dessert from the kitchen door to the critic's table"),
  S(102, 150, 240, "bistro", "bsDin", "T2 he sets it down on the table; the critic stares at it"),
  S(103, 240, 330, "bistro", "bsKit", "T3 dissolve: the head chef sits on a stool in the kitchen with a mug"),
] : STORY_MAIN;
/** preview mode (style lock / set building): inputProps { preview: { set, light, cam?, pos?, look?, fov?, t?, ctl?, cast? } } */
export type PreviewCast = { who: string; mark?: string; pos?: V3; o?: Record<string, unknown>; scale?: number };
export type Preview = { set: string; light: LightName; cam?: string; pos?: V3; look?: V3; fov?: number; t?: number; ctl?: Record<string, number>; cast?: PreviewCast[]; cInf?: number; focus?: V3 };
export const PREVIEW = (getInputProps() as { preview?: Preview }).preview;
/** test renders: inputProps { only: [ids] } builds only those shots' sets (frames stay absolute) */
const ONLY = (getInputProps() as { only?: number[] }).only;
export const SHOTS: ShotDef[] = PREVIEW ? [S(1, 0, TOTAL, PREVIEW.set, PREVIEW.light, "preview")] : ONLY ? STORY_SHOTS.filter((s) => ONLY.includes(s.id)) : STORY_SHOTS;
/** crossfades (frames) where the place or time changes (6-8 f dissolves, measured) */
export const XFADE: Record<number, number> = (getInputProps() as { testScene?: boolean }).testScene ? { 103: 6 } : {};   // 11-26: 6 at 16 frames (the night -> morning dissolve at 10 read as a hard cut)   // v30 rule j: dissolves only in place (the same framing, a new time): 6 night -> morning at his window; 9 night 2 -> night 3 at the drain; 17 the thaw -> next winter at his window
export const FLASH_AT = -1000; // no flash in this video
/** light dips (v10.10 rule 7: no crossfade between places with people in them): the frame floods with the light's
 *  colour for ~4 frames, the cut happens under the flood, then it clears over ~6 frames. [shot id] -> colour */
export const DIPS: Record<number, string> = {};
const DIP_K = [0.25, 0.55, 0.8, 0.92, 0.92, 0.78, 0.55, 0.32, 0.15, 0.05]; // from s.a-4 .. s.a+5
export const dipAt = (f: number): { col: string; k: number } | null => {
  for (const s of SHOTS) { const c = DIPS[s.id]; if (c && f >= s.a - 4 && f < s.a + 6) return { col: c, k: DIP_K[Math.round(f - (s.a - 4))] ?? 0 }; }
  return null;
};
export const STORY_BY_ID = (id: number) => SHOTS.find((s) => s.id === id) ?? SHOTS[0];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    const prev = SHOTS[SHOTS.indexOf(s) - 1];
    if (x && prev && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: prev.id, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
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
