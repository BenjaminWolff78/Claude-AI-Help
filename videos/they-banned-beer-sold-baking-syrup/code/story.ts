// Timeline of "They Banned Beer, So He Sold It as Bread Syrup" (2026-11-27, master prompt v34). One set (beer), four places.
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1986; // story frames (66.2 s; the voice ends at 65.18 s, the video ends on the caps blowing over the wife)
/** re-voiced Nov 25 (v30 3.22: no word endings cut): output frame -> story frame through remap.json (a smooth least-squares
 *  map through the shared word starts; the dropped phrase is skipped at the hard cut that already sat there) */
export const WARP = 1, TOTAL_REAL = 1986;
export const storyF = (n: number) => Math.max(0, Math.min(1985, Math.floor(n)));
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
  S(1, 0, 78, "beer", "brew", "1 0.0 brewer already slapping a red FOR BAKING label on a can as thick brown syrup pours fro"),
  S(2, 78, 161, "beer", "brew", "2 2.6 glide right and up past the brewer to the big wall sign: BEER crossed out in red paint"),
  S(3, 161, 226, "beer", "brew", "3 5.4 two agents tip a beer barrel over the floor drain, foam gushing"),
  S(4, 226, 273, "beer", "brew", "4 7.5 glide past the barrels onto the brewer filling cans at the kettle, calm"),
  S(5, 273, 370, "beer", "brew", "5 9.1 the agent strides in with the padlock and chain"),
  S(6, 370, 438, "beer", "brew", "6 12.3 over the brewer's shoulder: the agent sniffs the open can, brows up"),
  S(7, 438, 469, "beer", "brew", "7 14.7 the brewer, half-lid deadpan, shrugs one shoulder: 'It's for baking.'"),
  S(8, 469, 515, "beer", "stDay", "8 15.6 through the office window: three agents laughing, one slaps the desk, the lead agent "),
  S(9, 515, 582, "beer", "stDay", "9 17.2 glide along the sidewalk with the brewer carrying a crate of cans"),
  S(10, 582, 658, "beer", "groc", "10 19.4 the grocer puts 3 cans on the shelf"),
  S(11, 658, 701, "beer", "groc", "11 21.9 same framing, a week later: the board flips to 30, three customers with cans"),
  S(12, 701, 767, "beer", "groc", "12 23.4 a whole wall of syrup cans to the ceiling, the grocer up a ladder stacking"),
  S(13, 767, 824, "beer", "groc", "13 25.6 glide right to the flour sacks next to the wall: dusty, a cobweb, a spider walks acro"),
  S(14, 824, 855, "beer", "groc", "14 27.5 the agent in the doorway, squinting at the empty bread shelf, notepad up"),
  S(15, 855, 913, "beer", "groc", "15 28.5 the brewer himself wheels in a tower of YEAST boxes on a hand truck"),
  S(16, 913, 980, "beer", "stDay", "16 30.4 high over the town: a loaf of bread as big as the church rises beside the steeple"),
  S(17, 980, 1033, "beer", "stNight", "17 32.7 night: the agent on a porch knocks hard three times, street lamp behind"),
  S(18, 1033, 1129, "beer", "stNight", "18 34.4 the door opens: a granny with flour on her hands and a rolling pin"),
  S(19, 1129, 1209, "beer", "stNight", "19 37.6 the agent backs down the steps tipping his hat, sweat drop"),
  S(20, 1209, 1240, "beer", "stNight", "20 40.4 the cellar window bursts: a cap pings off, foam sprays the glass; the agent jumps, ha"),
  S(21, 1240, 1262, "beer", "stNight", "21 41.0 whip right: the next house's cellar window pops, foam; the agent spins"),
  S(22, 1262, 1300, "beer", "stNight", "22 42.1 crane up: down the whole street cellar windows pop one after another, foam fountains,"),
  S(23, 1300, 1397, "beer", "cellar", "23 43.3 dissolve down into the sliced-open cellar under the street: the granny pours a can in"),
  S(24, 1397, 1451, "beer", "cellar", "24 46.6 top-down: water sloshes in from a bucket"),
  S(25, 1451, 1529, "beer", "cellar", "25 48.4 the crock starts to fizz, bubbles rising, a burp of foam on 'burps'"),
  S(26, 1529, 1606, "beer", "groc", "26 51.0 at the counter the grocer pours water into a PANCAKE MIX box bowl: batter"),
  S(27, 1606, 1665, "beer", "cellar", "27 53.5 shelves of brown bottles, a chalk 45 on the beam"),
  S(28, 1665, 1741, "beer", "cellar", "28 55.5 she caps another; the bottles behind her start to hiss"),
  S(29, 1741, 1838, "beer", "groc", "29 58.0 the grocer hands a can across the counter"),
  S(30, 1838, 1903, "beer", "stNight", "30 61.3 night: the agent trudges up to his own house"),
  S(31, 1903, 1986, "beer", "cellar", "31 63.4 dissolve to the foot of the cellar steps, over the agent's shoulder: his wife among c"),
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
export const XFADE: Record<number, number> = (getInputProps() as { testScene?: boolean }).testScene ? { 103: 6 } : { 8: 6, 9: 6, 10: 6, 11: 6, 12: 6, 16: 6, 17: 6, 23: 6, 26: 6, 27: 6, 29: 6, 30: 6, 31: 6 };   // p14 plan: 6-frame dissolves at every place / time change (plan_check P3)
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
