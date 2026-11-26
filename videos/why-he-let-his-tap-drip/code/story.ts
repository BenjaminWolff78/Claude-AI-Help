// Timeline of "Why He Let His Tap Drip All Night in the Freeze" (2026-11-25, master prompt v30). Earlier: "They Paid for Pig Tails and Got a Pig Farm". Earlier: "The Thieves Who Stole 200 Shoes Nobody Can Wear" (2026-11-23).
// cameras + acting in shots.ts (set-local coordinates). One set (pigset): the bounty shed (home base), the woods road, the hillside.
import { getInputProps } from "remotion";
import type { LightName } from "./lights";
export const FPS = 30;
export const TOTAL = 1980; // story frames (v31 voice: 66.0 s output; the story runs to 1976)
/** re-voiced Nov 25 (v30 3.22: no word endings cut): output frame -> story frame through remap.json (a smooth least-squares
 *  map through the shared word starts; the dropped phrase is skipped at the hard cut that already sat there) */
import REMAP from "./remap.json";
const RM = REMAP as { total: number; cut: number; story: number[] };
export const WARP = 1, TOTAL_REAL = RM.total;
export const storyF = (n: number) => { const i = Math.max(0, Math.min(RM.story.length - 1, Math.floor(n))); return RM.story[i]; };
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
  S(1, 0, 72, "dripset", "drNight", "1 HOOK: close on his tap at night, he opens it to a drip, the first drop into the steel bucket, frost creeps"),
  S(2, 72, 139, "dripset", "drThaw", "2 HARD CUT, the flash-forward: the neighbor's walls spray water into the side yard and across the street; his house dry, him with a mug"),
  S(3, 139, 284, "dripset", "drNight", "3 whip into the neighbor's kitchen: the -20 thermometer, pull back: red jacket, he cranks both taps shut with a wrench"),
  S(4, 284, 392, "dripset", "drNight", "4 the ride out of his window, over the fence, to the old man's window: he opens his tap to a drip, slides the bucket under"),
  S(5, 392, 482, "dripset", "drNight", "5 pull back to the fence: the neighbor leans on it and laughs 'You're paying to water a bucket!'"),
  S(6, 482, 546, "dripset", "drMorn", "6 dissolve in place to morning: push in through his window to the bucket, half full"),
  S(7, 546, 628, "dripset", "drNight", "7 night 2: out of the window, crane over the side yard: the street laughs, the DRIPPY sign goes in"),
  S(8, 628, 700, "dripset", "drNight", "8 back in through the window down to the basin: the drip runs down the drain, he sips tea"),
  S(9, 700, 770, "dripset", "drNight", "9 dissolve in place to night 3: push to the spout, the last bead hangs, frosts over, stops"),
  S(10, 770, 850, "dripset", "drNight", "10 whip out of the window to the fence: 'Froze anyway, Drippy!'"),
  S(11, 850, 970, "dripset", "dr3am", "11 whip back in, 3 a.m.: the frozen tap shudders and coughs one fat drop, him asleep, the clock at 3"),
  S(12, 970, 1112, "dripset", "drThaw", "12 HARD CUT, the thaw: the neighbor's kitchen wall bursts under the sink, sprays across his floor"),
  S(13, 1112, 1371, "dripset", "drThaw", "13 YOU SEE: the wall under his sink slices open: the ice plug grows, shoves the water to the shut tap, the pipe splits"),
  S(14, 1371, 1461, "dripset", "drThaw", "14 HARD CUT: a capped ketchup bottle squeezed until the side seam splits"),
  S(15, 1461, 1606, "dripset", "drThaw", "15 HARD CUT: the old man's wall sliced the same way: the squeeze goes out of his open tap, the fat drop"),
  S(16, 1606, 1716, "dripset", "drThaw", "16 up to his window: the plumber outside points at the dripping tap, the neighbor with a mop, the old man raises his mug"),
  S(17, 1716, 1872, "dripset", "drNight", "17 dissolve in place to next winter: across the yard into the neighbor's window, red jacket, he opens his tap to a drip"),
  S(18, 1872, 1980, "dripset", "drNight", "18 THE END (v31 8.11): pull back from his window onto the old man below it, mallet up over the DRIPPY sign: he slams it into the neighbor's yard on \"yard\" - snow bursts, the window icicles shatter down, the neighbor jumps; nothing after"),
];
/** preview mode (style lock / set building): inputProps { preview: { set, light, cam?, pos?, look?, fov?, t?, ctl?, cast? } } */
export type PreviewCast = { who: string; mark?: string; pos?: V3; o?: Record<string, unknown>; scale?: number };
export type Preview = { set: string; light: LightName; cam?: string; pos?: V3; look?: V3; fov?: number; t?: number; ctl?: Record<string, number>; cast?: PreviewCast[]; cInf?: number; focus?: V3 };
export const PREVIEW = (getInputProps() as { preview?: Preview }).preview;
/** test renders: inputProps { only: [ids] } builds only those shots' sets (frames stay absolute) */
const ONLY = (getInputProps() as { only?: number[] }).only;
export const SHOTS: ShotDef[] = PREVIEW ? [S(1, 0, TOTAL, PREVIEW.set, PREVIEW.light, "preview")] : ONLY ? STORY_SHOTS.filter((s) => ONLY.includes(s.id)) : STORY_SHOTS;
/** crossfades (frames) where the place or time changes (6-8 f dissolves, measured) */
export const XFADE: Record<number, number> = { 6: 8, 7: 8, 9: 8, 17: 8 };   // v31 5.16: in-place dissolves, 8 frames max (fix round)   // 11-26: 6 at 16 frames (the night -> morning dissolve at 10 read as a hard cut)   // v30 rule j: dissolves only in place (the same framing, a new time): 6 night -> morning at his window; 9 night 2 -> night 3 at the drain; 17 the thaw -> next winter at his window
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
