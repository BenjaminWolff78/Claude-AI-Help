// Per-shot cameras (SHOT_CAMS) and acting (SHOT_ACTS), set-local coordinates, absolute frames.
// Rules (user fixes + v10): subject fully in frame, face in the upper-middle, hats with headroom; every hold pushes in
// 0.15-0.35 %/f (0.6 %/f on punch words); glides 18-40 f; never two centred framings in a row; every verb acted out;
// reactions land 0-3 f before their word; blinks come from world.ts; mouths flap ~every 4 f while a line is spoken.
import type { SetDef, Ctl } from "./sets/types";
import type { Act, CastPlace, FxSpec } from "./cams";
import type { FigOpts, Face } from "./fig";
import { Key, Shot, V3, clamp01, smooth, easeOut, glide, run, DOF } from "./story";
import POSES from "./poses.json";
import type { MouthK } from "./toon";

// ---------------- helpers ----------------
type P = Partial<FigOpts>;
const PZ = POSES as unknown as Record<string, P>;
/** pose preset + overrides */
const pose = (name: string | null, o: P = {}): FigOpts => ({ ...(name ? PZ[name] : {}), ...o }) as FigOpts;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** 0..1 between frames a and b, smoothed */
const sm = (f: number, a: number, b: number) => smooth((f - a) / (b - a));
const lin = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
/** hold that creeps in (dolly toward look) at `rate` per frame from f0, with punches [frame, rate, length] */
const creep = (f: number, f0: number, rate: number, punches: [number, number, number][] = []) => {
  let s = rate * Math.max(0, f - f0);
  for (const [pf, pr, n] of punches) { const x = f - pf; if (x <= 0) continue; for (let i = 0; i < Math.min(x, n); i++) s += (pr - rate) * Math.max(0, Math.min(1, (i + 0.5) / 6, (n - i - 0.5) / 6)); }
  return Math.exp(-s);
};
const hold = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0025, punches: [number, number, number][] = [], roll = 0) => (f: number): Shot => {
  const k = creep(f, f0, rate, punches);
  return { pos: lerp3(look, pos, k), look, fov, roll };
};
/** a moving camera that keeps creeping in */
const track = (posF: (f: number) => V3, lookF: (f: number) => V3, fov: number, f0: number, rate = 0.002) => (f: number): Shot => {
  const k = creep(f, f0, rate), look = lookF(f);
  return { pos: lerp3(look, posF(f), k), look, fov };
};
const K = (f: number, s: (f: number) => Shot, dur = 24, cut = false): Key => ({ f, s, dur, cut });
/** walk cycle phase: one stride per `n` frames */
const ph = (f: number, n = 18) => ((f / n) % 1 + 1) % 1;
/** lip flap while a line is spoken (changes every ~4 f, 0.13 s) */
const MOUTHS: MouthK[] = ["O", "smile", "o", "dash", "O", "wave", "o", "smileWide"];
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? MOUTHS[Math.floor(f / 4) % MOUTHS.length] : undefined);
// card geometry (cast.ts SU, fig.ts layout) -> world point of a design-space spot, e.g. a hand
const SU = 0.00216;
export const cardPt = (pos: V3, cam: V3, X: number, Y: number, sc = 1): V3 => {
  const yaw = Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
  return [pos[0] + Math.cos(yaw) * (X - 300) * SU * sc, pos[1] + (975 - Y) * SU * sc, pos[2] - Math.sin(yaw) * (X - 300) * SU * sc];
};
/** adult figure: design-space hand point for an arm preset offset (approximate; fs = facing sign) */
const handXY = (side: 1 | -1, off: [number, number], fs = 0): [number, number] => [300 + 3 * 2.36 * fs + side * 75 + off[0] * 2.36, 447 + off[1] * 2.36];
const C = (who: string, pos: V3, o: FigOpts = {}, extra: Partial<CastPlace> = {}): CastPlace => ({ who, pos, o, ...extra });
// DOF table entries (cInf = blur strength at infinity; 0 = all sharp). ~1/3 of the film focuses on eyes.
const dof: { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 }[] = [];
const lens = (f: number, cInf: number, dur = 10, focus?: (f: number) => V3) => dof.push({ f, cInf, dur, focus });

export const SHOT_CAMS: Record<number, (s: SetDef) => Key[]> = {};
export const SHOT_ACTS: Record<number, (f: number, s: SetDef) => Act> = {};
const camAt = (id: number, s: SetDef, f: number) => run(SHOT_CAMS[id](s), f);

// =====================================================================================================================
// BOSTON, snowy dusk. Ship FAVORITE moored on the right: deck top y 0.30, centre x 9.4, z -0.5 .. -11.5 (bow toward -z).
// =====================================================================================================================
const DECK = 0.30;
// ---- S01 (0-132) "This man is shipping a frozen pond / to the tropics, / and every dollar he has rides on it."
// Tudor drags the huge block across the deck with a rope over his shoulder (frame 1 = action), points out to sea on
// "tropics", then slaps his purse on the block on "rides" (purse squash, punch-in). Ice big #1.
const WX = 10.35, TEND: V3 = [10.85, DECK, -7.7], HZ = -8.85, HX = 10.25;
const tz01 = (f: number) => lerp(-9.9, -7.4, easeOut(lin(f, 0, 50)) * 0.3 + lin(f, 0, 50) * 0.7);
SHOT_CAMS[1] = () => [
  K(0, track((f) => [10.9, 1.35, tz01(f) + 3.9], (f) => [10.3, 1.3, tz01(f) - 0.6], 42, 0, 0.0018)),
  K(50, hold([9.15, 1.6, -4.6], [11.95, 1.35, -9.8], 44, 50, 0.0025), 24),
  K(86, hold([11.85, 1.8, -3.8], [10.5, 1.4, -8.2], 44, 86, 0.0022, [[108, 0.005, 20]]), 22),
];
SHOT_ACTS[1] = (f, s) => {
  const st = sm(f, 80, 94), T: V3 = f < 80 ? [WX, DECK, tz01(f)] : lerp3([WX, DECK, -7.4], TEND, st);
  const cam = camAt(1, s, f).pos, walking = f < 50;
  const hz = HZ + (tz01(Math.min(f, 50)) + 7.4), hx = f < 50 ? WX : lerp(WX, HX, sm(f, 50, 70));
  let o: FigOpts;
  if (walking) o = pose("haulR", { expr: "strain", mode: "walk", phase: ph(f, 16), tilt: -7, sweat: 0.6 });
  else if (f < 80) o = pose("pointR", { expr: "determined", facing: 1, headTilt: -3 });
  else if (f < 108) o = pose(null, { expr: "determined", facing: -1, mode: f < 94 ? "walk" : "stand", phase: ph(f, 14), armL: [[-30, 20], [lerp(-40, -66, sm(f, 94, 104)), lerp(0, -18, sm(f, 94, 104))]], propL: f < 104 ? "purse" : undefined });
  else o = pose("hips", { expr: "smug", facing: -1, headTilt: -3 });
  const ctl: Ctl = { snow: 1, lamps: 1, heroX: hx, heroY: DECK, heroZ: hz, hero: 1 };
  if (walking) { // rope from the hauling hand (over his shoulder) back to the sled's tow ring
    const [px, py] = handXY(1, [6, 4]); const A = cardPt(T, cam, px, py);
    Object.assign(ctl, { tow: 1, towAx: A[0], towAy: A[1], towAz: A[2], towBx: hx, towBy: DECK + 0.18, towBz: hz + 0.8 });
  }
  if (f >= 102) { const d = clamp01((f - 102) / 6); Object.assign(ctl, { purse: 1, purseX: -0.22, purseY: lerp(1.7, 1.19, d * d), purseZ: 0.2, purseSq: f >= 108 ? 0.35 * Math.exp(-(f - 108) / 3) * Math.cos((f - 108) * 0.9) : 0 }); }
  return { ctl, cast: [C("tudor", T, o, { shadow: true }), ...(f < 80 ? [C("sailor2", [9.0, DECK, -10.4], pose("hips", { expr: "grin", facing: 1 }))] : [])], focus: f < 50 ? [WX, 1.9, T[2]] : undefined };
};
lens(0, 6, 1); lens(50, 0, 14); lens(88, 9, 14);

// ---- S02 (132-216) "His name is Frederic Tudor, / and Boston is laughing."
// Medium close-up: Tudor lifts his top hat to us on his name (proud). Whip-glide to the dock crowd howling and pointing.
SHOT_CAMS[2] = () => [
  K(132, hold([12.35, 2.3, -5.3], [10.75, 1.98, -7.75], 40, 132, 0.0022, [[150, 0.004, 18]])),
  K(172, hold([1.9, 1.5, -3.25], [-2.15, 1.15, -4.75], 44, 172, 0.003, [[196, 0.006, 16]]), 20),
];
SHOT_ACTS[2] = (f) => {
  const tip = sm(f, 146, 154) - sm(f, 166, 174);
  const crowdLaugh = f >= 176;
  const cw = (who: string, p: V3, i: number, name: string, fc: number) => C(who, p, pose(crowdLaugh ? (i % 2 ? "laughBelly" : name) : "hips", { expr: crowdLaugh ? "laugh" : "grin", facing: fc, bob: crowdLaugh ? 3 * Math.sin(f * 0.9 + i) : 0, tilt: crowdLaugh ? 4 * Math.sin(f * 0.45 + i) : 0 }), { idx: i });
  return {
    ctl: { snow: 1, lamps: 1, heroX: HX, heroY: DECK, heroZ: HZ, purse: 1, purseX: -0.22, purseY: 1.19, purseZ: 0.2 },
    cast: [
      C("tudor", TEND, pose("hips", { expr: tip > 0.3 ? "smug" : "determined", facing: -1, hatLift: 0.16 * tip, hatTilt: -12 * tip, ...(tip > 0.05 ? { armR: [[30, -14], [22, -60]] as [[number, number], [number, number]] } : {}) })),
      cw("bos3", [-2.5, 0, -4.75], 0, "pointR", 1), cw("bos1", [-2.0, 0, -5.35], 1, "pointR", 1), cw("bos2", [-3.0, 0, -4.1], 2, "pointR", 1),
      cw("bos4", [-1.45, 0, -4.45], 3, "pointR", 1), C("gazette", [-1.9, 0, -3.65], pose("paper", { expr: crowdLaugh ? "laugh" : "grin", facing: 1 })),
    ],
    focus: f < 172 ? [TEND[0], 1.95, TEND[2]] : undefined,
  };
};
lens(132, 11, 8); lens(172, 4, 12);

// ---- S03 (216-306) "The newspaper jokes, / 'We hope this won't prove a slippery speculation.'"
// The gazette man reads it out (lip-sync), then on "slippery" steps back onto an ice puddle and his feet fly up.
SHOT_CAMS[3] = () => [
  K(216, hold([-0.35, 1.5, -1.45], [-1.95, 1.3, -3.75], 40, 216, 0.0028)),
  K(262, hold([0.9, 1.2, 0.3], [-2.0, 0.9, -3.8], 46, 262, 0.002, [[272, 0.006, 14]]), 16),
];
SHOT_ACTS[3] = (f) => {
  const slip = lin(f, 268, 282), land = f >= 282;
  const gx = -1.9 - 0.25 * sm(f, 258, 268), lift = land ? 0 : 0.42 * Math.sin(Math.PI * slip);
  const g = f < 268
    ? C("gazette", [gx, 0, -3.6], pose("paper", { expr: f < 243 ? "grin" : "smug", mouth: talk(f, 243, 266), facing: 1, headTilt: f < 243 ? 0 : 3 * Math.sin(f * 0.25) }))
    : C("gazette", [gx, lift, -3.6], pose("cheer", { expr: land ? "dazed" : "shock", mode: land ? "sit" : "air", mouth: land ? undefined : "O", ...(land ? { armL: [[-30, 20], [-50, 40]], armR: [[30, 20], [50, 40]] } as P : {}) }), { roll: land ? 0 : -0.8 * Math.sin(Math.PI * slip), air: !land });
  return {
    ctl: { snow: 1, lamps: 1, heroX: HX, heroY: DECK, heroZ: HZ },
    cast: [g, C("bos3", [-2.5, 0, -4.75], pose("laughBelly", { expr: f > 272 ? "shock" : "laugh", facing: 1 })), C("bos4", [-1.45, 0, -4.45], pose(null, { expr: f > 272 ? "shock" : "grin", facing: -1 })),
      C("bos1", [-2.0, 0, -5.35], pose(null, { expr: f > 272 ? "shock" : "smile", facing: 1 })), C("bos2", [-3.0, 0, -4.1], pose("laughBelly", { expr: f > 272 ? "shock" : "laugh", facing: 1 }))],
    fx: f >= 262 ? [{ kind: "card", key: "puddle", pos: [-2.2, 0.01, -3.5], w: 1.0, h: 0.6, flat: true, cw: 128, ch: 128, draw: (p) => p.ell(64, 64, 58, 40, "rgba(160,215,245,0.85)", 3) }] as FxSpec[] : [],
    focus: f < 262 ? [-1.9, 1.55, -3.6] : undefined,
  };
};
lens(216, 10, 8); lens(262, 3, 10);

// ---- S08 (651-733) golden winter sunset: "He tries again. / More melts. / He borrows money, / loses it,"
SHOT_CAMS[8] = () => [
  K(651, hold([2.9, 1.45, 1.3], [0.05, 1.05, -2.6], 42, 651, 0.0025, [[675, 0.006, 16]])),
  K(694, hold([2.7, 1.6, 1.4], [0.3, 1.2, -2.3], 46, 694, 0.003, [[717, 0.006, 16]]), 20),
];
SHOT_ACTS[8] = (f) => {
  const melt = 0.15 + 0.65 * sm(f, 668, 696);
  const take = f >= 706, torn = f >= 717;
  const T: V3 = [-0.2, 0, -2.0];
  const ctl: Ctl = { snow: 1, lamps: 0, heroX: 0.6, heroY: 0, heroZ: -3.0, heroS: 0.6, heroMelt: melt };
  // coins spill from the torn bag (hand point) and bounce on the planks
  if (torn) {
    for (let i = 0; i < 12; i++) {
      const u = (f - 717) / 30 * (0.8 + (i % 4) * 0.12), a = i * 2.4;
      const x0 = T[0] + 0.3, y0 = 0.95, vx = Math.cos(a) * 0.9, vz = Math.sin(a) * 0.6 + 0.3;
      const y = Math.max(0.012, y0 + 1.2 * u - 6 * u * u);
      ctl["coin" + i] = 1; ctl["coinX" + i] = x0 + vx * Math.min(u, 0.6); ctl["coinY" + i] = y; ctl["coinZ" + i] = T[2] + vz * Math.min(u, 0.6); ctl["coinR" + i] = y > 0.02 ? f * 0.5 + i : Math.PI / 2;
    }
  }
  const tud = f < 694
    ? pose(f < 668 ? "chinThink" : "facepalm", { expr: f < 668 ? "determined" : "dismay", facing: 1 })
    : !take ? pose(null, { expr: "sheepish", facing: 1, armR: [[28, 20], [62, 18]] })
      : pose(null, { expr: torn ? "shock" : "grin", facing: 1, armR: [[26, 26], [40, 40]], armRFront: true, propR: torn ? "moneybagTorn" : "moneybag", propRAng: torn ? 0.6 : 0, armL: torn ? [[-34, 20], [-52, -6]] : undefined });
  const banker = f < 694 ? null : C("banker", [0.85, 0, -2.5], take ? pose("hips", { expr: torn ? "shock" : "smug", facing: -1 }) : pose(null, { expr: "smug", facing: -1, armL: [[-30, 30], [-62, 30]], armLFront: true, propL: "moneybag" }));
  return { ctl, cast: [C("tudor", T, tud, { shadow: true }), ...(banker ? [banker] : [])], focus: f >= 694 ? [0.3, 1.5, -2.4] : undefined };
};
lens(651, 0, 8); lens(694, 8, 12);

// ---- S24 (1839-1941) summer callback: "Not bad for a slippery speculation. / And it all started because..."
// Rich Tudor hands the sweating gazette man a glass of iced lemonade; calm push into Tudor's smug close-up (>= 1.5 s)
// with the glass and the misting block: loops back into frame 1 (the block on the deck).
SHOT_CAMS[24] = () => [
  K(1839, hold([3.0, 1.45, 0.9], [0.4, 1.2, -2.6], 42, 1839, 0.0025, [[1866, 0.005, 14]])),
  K(1886, hold([2.0, 1.75, 0.4], [0.7, 1.55, -2.35], 40, 1886, 0.0015), 30),
];
SHOT_ACTS[24] = (f) => {
  const give = sm(f, 1846, 1858), took = f >= 1862;
  return {
    ctl: { snow: 0, lamps: 0, heroX: 0.3, heroY: 0, heroZ: -3.9, heroMelt: 0 },
    cast: [
      C("tudorKing", [0.75, 0, -2.35], f < 1862 ? pose(null, { expr: "smug", facing: -1, armL: [[-28, 24], [lerp(-40, -66, give), 20]], propL: "glass" })
        : pose(null, { expr: f > 1890 ? "smug" : "grin", facing: -1, headTilt: f > 1890 ? -4 : 0, propL: "icechunk", armL: [[-26, 30], [-14, 2]], armLFront: true, armR: [[30, 40], [4, 74]] }), { shadow: true }),
      C("gazette", [-0.75, 0, -2.45], took ? pose(null, { expr: "sheepish", sweat: 1, facing: 1, armR: [[22, 20], [10, 2]], propR: "glass", armRFront: true }) : pose("reach", { expr: "dismay", sweat: 1, facing: 1 })),
    ],
    focus: f >= 1886 ? [0.75, 1.68, -2.35] : undefined,
  };
};
lens(1839, 4, 8); lens(1886, 12, 24);


// =====================================================================================================================
// PRISON, moonlit night (cold blue moonbeam vs one warm candle). Cell x -1.7..1.8, back wall z -2.5 (door x .35..1.35).
// ---- S09 (733-804) "and in 1813, / he lands in debtors' prison."
// The barred door bangs open, Tudor is flung through it in an arc and LANDS on the straw on "lands" (kick); the guard
// slams the door and turns the key; Tudor sits up dazed, then slumps.
SHOT_CAMS[9] = () => [
  K(733, hold([0.1, 1.5, 2.9], [-0.35, 1.15, -2.0], 52, 733, 0.0025)),
  K(772, hold([0.2, 1.3, 1.5], [-0.75, 1.2, -1.1], 46, 772, 0.0025, [[784, 0.005, 12]]), 18),
];
SHOT_ACTS[9] = (f) => {
  const fly = lin(f, 748, 768), landed = f >= 768;
  const door = f < 740 ? sm(f, 733, 739) : f < 776 ? 1 : 1 - sm(f, 776, 784);
  const A: V3 = [0.85, 0.2, -2.7], B: V3 = [-0.85, 0.3, -1.05];
  const P: V3 = landed ? B : [lerp(A[0], B[0], fly), lerp(A[1], B[1], fly) + 1.1 * Math.sin(Math.PI * fly), lerp(A[2], B[2], fly)];
  const tud = f < 748 ? null : landed
    ? C("tudor", B, pose(null, { expr: f < 786 ? "dazed" : "dismay", mode: "sit", headTilt: f < 786 ? 6 * Math.sin(f * 0.4) : -6, squash: f < 774 ? 0.3 * Math.exp(-(f - 768) / 3) : 0 }), { shadow: true })
    : C("tudor", P, pose("cheer", { expr: "shock", mode: "air", mouth: "O" }), { roll: -1.2 * fly, air: true });
  const guard = C("guard", [1.0, 0, f < 776 ? -2.9 : -3.3], f < 776 ? pose("pushR", { expr: "stern", facing: -1, armR: [[-30, 24], [-70, 24]], armL: [[-20, 30], [-60, 32]] }) : pose(null, { expr: "smug", facing: -1, armL: [[-28, 20], [-46, 4]], propL: "keys" }));
  return { ctl: { door }, cast: [...(tud ? [tud] : []), guard], focus: f >= 772 ? [-0.85, 1.25, -1.05] : undefined };
};
lens(733, 0, 1); lens(772, 10, 14);


// =====================================================================================================================
// LAB: the dim ice house (cool violet-blue, warm lantern pools). Bench along x at z -0.65 (top y ~1.2), Tudor behind it.
// ---- S10 (804-867) "When he gets out, / he turns his ice house into a lab."
// From outside, the barn door frames him as he strides in past the stacked ice; on "lab" he snaps his goggles down.
SHOT_CAMS[10] = () => [
  K(804, hold([1.9, 1.65, -5.6], [0.4, 1.3, -0.6], 50, 804, 0.004)),
  K(838, hold([-0.75, 1.62, 1.75], [0.05, 1.32, -1.5], 46, 838, 0.0028, [[856, 0.006, 12]]), 22),
];
SHOT_ACTS[10] = (f) => {
  const w = sm(f, 806, 846), T: V3 = lerp3([1.2, 0, -2.4], [0.15, 0, -1.55], w), lab = f >= 856;
  const o = f < 846 ? pose(null, { expr: "determined", mode: "walk", phase: ph(f, 15), facing: -1 })
    : pose(lab ? "cheer" : "holdUpR", { expr: lab ? "grin" : "determined", armR: lab ? undefined : [[30, -10], [16, -58]], bob: lab ? 2 * Math.sin(f) : 0 });
  return { ctl: { clock: 2 + f / 300, temp: 0.3 }, cast: [C(lab ? "tudorLab" : "tudor", T, o, { shadow: true })], focus: f >= 838 ? [0.15, 1.55, -1.55] : undefined };
};
lens(804, 0, 1); lens(838, 8, 14);

// ---- S11 (867-981) "He packs blocks in rice husks. / Melted. / Wood shavings, / still melting."
const huskT: V3 = [-1.62, 0, -1.3], shavT: V3 = [-0.72, 0, -1.3];
SHOT_CAMS[11] = () => [
  K(867, hold([-1.95, 1.8, 1.7], [-1.3, 1.45, -1.0], 46, 867, 0.0022, [[922, 0.005, 14]])),
  K(928, hold([-1.9, 1.7, 1.5], [-0.55, 1.42, -1.0], 44, 928, 0.0022, [[958, 0.005, 14]]), 18),
];
SHOT_ACTS[11] = (f) => {
  const husk = sm(f, 900, 922), shav = sm(f, 948, 970), moving = f >= 926 && f < 942;
  const T = lerp3(huskT, shavT, sm(f, 926, 942));
  let o: FigOpts;
  if (f < 898) o = pose(null, { expr: "determined", facing: 1, armR: [[26, 26], [48, 18 + 10 * Math.sin(f * 0.6)]], armRFront: true, propR: "husks", armL: [[-30, 40], [-4, 74]] });
  else if (f < 926) o = pose(f > 918 ? "facepalm" : null, { expr: f > 918 ? "dismay" : "neutral", facing: 1 });
  else if (moving) o = pose(null, { expr: "determined", mode: "walk", phase: ph(f, 12), facing: 1 });
  else if (f < 950) o = pose(null, { expr: "determined", facing: 1, armR: [[26, 26], [48, 18 + 10 * Math.sin(f * 0.6)]], armRFront: true, propR: "handful" });
  else o = pose(f > 958 ? "shrug" : null, { expr: f > 958 ? "angry" : "neutral", facing: 1 });
  return { ctl: { husks: husk, shavings: shav, sawdust: 0, bare: 0, clock: 3 + 9 * husk + 9 * shav, temp: 0.4 + 0.3 * Math.max(husk, shav) }, cast: [C("tudorLab", T, o, { shadow: true })], focus: [T[0], 1.5, T[2]] };
};
lens(867, 9, 10);

// ---- S17 (1326-1395) "Packed tight in sawdust, / his ice barely melts."  Down the bench: the bare block slumps into a
// puddle in front while the sawdust-packed block behind stays perfect (clock spinning). Ice big.
SHOT_CAMS[17] = () => [K(1326, hold([0.15, 1.7, 1.7], [0.1, 1.35, -1.0], 50, 1326, 0.0025, [[1366, 0.005, 14]]))];
SHOT_ACTS[17] = (f) => {
  const pack = f < 1350, T: V3 = [-0.38, 0, -1.5];
  const o = pack ? pose(null, { expr: "determined", facing: 1, armR: [[26, 26], [44, 22 + 12 * Math.sin(f * 0.7)]], propR: "handful" }) : pose("hips", { expr: f > 1370 ? "smug" : "grin", facing: 1, headTilt: f > 1370 ? 4 : 0 });
  return { ctl: { husks: 1, shavings: 1, sawdust: 0.04 * sm(f, 1350, 1390), bare: sm(f, 1346, 1385), clock: 4 + 20 * sm(f, 1346, 1388), temp: 0.75 }, cast: [C("tudorLab", T, o, { shadow: true })], focus: [0.0, 1.4, -1.0] };
};
lens(1326, 7, 10);

// =====================================================================================================================
// SAWMILL, spring morning (fresh greens, blue river). River along z at x 1.5..6.5; path on the left bank.
// ---- S12 (981-1104) "Then he passes a sawmill / dumping mountains of sawdust in the river, / because it's worthless."
const tzMill = (f: number) => lerp(3.2, -1.6, lin(f, 981, 1066));
SHOT_CAMS[12] = () => [
  K(981, track((f) => [-2.6, 1.6, tzMill(f) + 2.9], (f) => [0.1, 1.5, tzMill(f) - 0.9], 46, 981, 0.0015)),
  K(1016, hold([8.2, 1.8, 4.2], [-0.4, 3.6, -6.8], 58, 1016, 0.002), 26),
  K(1062, hold([-0.4, 1.5, -0.2], [1.25, 1.2, -3.5], 44, 1062, 0.003, [[1070, 0.006, 14]]), 22),
];
const shovel = (f: number, k: number): FigOpts => { const u = Math.sin(f * 0.22 + k); return { armR: [[28, 20 + 10 * u], [52, 30 - 26 * u]], armL: [[-6, 30], [30, 44 - 10 * u]], armLFront: true, armRFront: true, propR: "shovel", propRAng: -0.5 + 0.7 * u, propK: 1, tilt: 6 * u } as FigOpts; };
SHOT_ACTS[12] = (f) => {
  const walking = f < 1066, T: V3 = [-0.3, 0, tzMill(f)];
  const tud = walking ? pose(null, { expr: "neutral", mode: "walk", phase: ph(f, 16), facing: 1, look: 1 }) : pose(null, { expr: "neutral", facing: 1, headTilt: 4 });
  const worthless = f >= 1066;
  return {
    cast: [C("tudor", T, tud, { shadow: true }),
      C("mill1", [1.15, 0, -3.25], worthless && f < 1092 ? pose("shrug", { expr: "smug", facing: -1 }) : pose(null, { expr: "grin", facing: 1, ...shovel(f, 0) })),
      C("mill2", [2.35, 0, -5.0], pose(null, { expr: "neutral", facing: 1, ...shovel(f, 1.7) }))],
    focus: f >= 1062 ? [1.15, 1.5, -3.25] : undefined,
  };
};
lens(981, 3, 1); lens(1016, 0, 12); lens(1062, 9, 14);

// ---- S13 (1104-1150) "Sawdust is full of tiny air pockets,"  He scoops a handful and peers through his magnifier.
SHOT_CAMS[13] = () => [K(1104, hold([-0.75, 1.5, 0.15], [-0.3, 1.35, -2.3], 44, 1104, 0.003, [[1124, 0.007, 16]]))];
SHOT_ACTS[13] = (f) => ({
  cast: [C("tudor", [-0.25, 0, -2.3], pose(null, { expr: f < 1122 ? "neutral" : "shock", facing: 0, armL: [[-24, 22], [-20, -6]], armLFront: true, propL: "handful", armR: [[26, 6], [8, -30]], armRFront: true, propR: "magnifier", headTilt: -4 }), { shadow: true }),
    C("mill1", [1.15, 0, -3.25], pose(null, { expr: "neutral", facing: -1, ...shovel(f, 0) }))],
  focus: [-0.25, 1.5, -2.3],
});
lens(1104, 12, 8);

// ---- S15 (1198-1246) "That's the trick!"  Eureka: he leaps with both fists up (stinger), low angle with a 4 deg roll.
SHOT_CAMS[15] = () => [K(1198, hold([-1.15, 0.7, -0.05], [-0.25, 1.6, -2.3], 48, 1198, 0.002, [[1206, 0.005, 16]], 0.07))];
SHOT_ACTS[15] = (f) => {
  const j = lin(f, 1205, 1221), y = 0.45 * Math.sin(Math.PI * j);
  return {
    cast: [C("tudor", [-0.25, y, -2.3], pose("cheer", { expr: f < 1204 ? "shock" : "eureka", mode: j > 0 && j < 1 ? "air" : "stand", hatLift: 0.12 * Math.sin(Math.PI * j), squash: f > 1221 && f < 1228 ? 0.25 : 0 }), { shadow: true, air: j > 0 && j < 1 }),
      C("mill1", [1.15, 0, -3.25], pose(null, { expr: f > 1210 ? "shock" : "neutral", facing: -1 }))],
    focus: [-0.25, 1.6, -2.3],
  };
};
lens(1198, 6, 6);

// ---- S14 (1150-1198) micro: "and trapped air barely carries heat."  Through the magnifier ring into the sawdust.
SHOT_CAMS[14] = () => [
  K(1150, hold([0, 0, 3.4], [0, 0, -8], 45, 1150, 0.002)),
  K(1158, hold([0.15, 0.1, 4.5], [0, 0, -8], 50, 1158, 0.004), 24),
];
SHOT_ACTS[14] = (f) => ({ ctl: { ring: f < 1172 ? 1 + 2.5 * sm(f, 1152, 1172) : 0 }, cast: [] });
lens(1150, 0, 1);

// =====================================================================================================================
// BEACH (modern, hot turquoise afternoon). ---- S16 (1246-1326) "It's why a cooler keeps your drinks cold. / The cold can't leak out."
SHOT_CAMS[16] = () => [
  K(1246, hold([0.45, 1.2, 3.3], [0.25, 1.0, -0.2], 48, 1246, 0.0028)),
  K(1286, hold([1.1, 1.2, 3.0], [0.3, 0.85, 0.2], 46, 1286, 0.0025, [[1296, 0.005, 14]]), 20),
];
SHOT_ACTS[16] = (f) => {
  const lid = f < 1258 ? 0 : f < 1296 ? sm(f, 1258, 1266) : 1 - sm(f, 1296, 1302);
  const got = f >= 1274;
  const o = f < 1258 ? pose(null, { expr: "smug", mode: "sit", armR: [[24, 20], [40, 34]] })
    : !got ? pose(null, { expr: "shock", mode: "sit", armR: [[30, 22], [62, 30]], armRFront: true })
      : pose(null, { expr: f < 1296 ? "cold" : "smug", mode: "sit", armR: [[24, 10], [16, -18]], armRFront: true, propR: "soda", armL: f >= 1294 && f < 1304 ? [[-6, 30], [40, 40]] : undefined, armLFront: true });
  return { ctl: { lid }, cast: [C("beachKid", [-0.15, 0, 0.05], o, { shadow: true })], focus: [0.4, 0.9, 0.3] };
};
lens(1246, 6, 6);

// =====================================================================================================================
// CABIN (lamplit amber). ---- S18 (1395-1512) "So, in 1833, / he tries the craziest trip yet: / Boston to Calcutta."
SHOT_CAMS[18] = () => [
  K(1395, hold([0, 1.62, 2.15], [0, 1.25, -0.8], 50, 1395, 0.0025, [[1446, 0.006, 16]])),
  K(1470, hold([0, 2.2, 0.32], [0, 0.85, 0], 64, 1470, 0.002), 20),
];
SHOT_ACTS[18] = (f) => {
  const slam = f >= 1444 && f < 1452;
  return {
    ctl: { route: sm(f, 1488, 1512), month: 0 },
    cast: [C("captain", [-0.48, 0, -1.3], pose(f > 1446 ? "shrug" : null, { expr: f > 1446 ? "shock" : "neutral", facing: 1, mouth: f > 1446 ? "O" : undefined })),
      C("tudor", [0.48, 0, -1.3], pose(f > 1430 && f < 1470 ? null : "hips", { expr: f > 1430 ? "grin" : "determined", facing: -1, squash: slam ? 0.15 : 0, ...(f > 1430 && f < 1470 ? { armL: [[-24, 30], [-46, slam ? 60 : 40]] as [[number, number], [number, number]], armLFront: true } : {}) }))],
    focus: f < 1470 ? [0, 1.45, -1.3] : undefined,
  };
};
lens(1395, 7, 8); lens(1470, 0, 10);


// =====================================================================================================================
// MARTINIQUE, blazing noon (turquoise sea, coral plaster). FAVORITE moored left, deck top y 0.65, dock toward -z.
// ---- S04 (306-413) "You see, it's 1806, / and nobody in the tropics / has ever seen ice."
// Crane down onto the sweltering market; locals fan and mop; the kid shrugs at the word "ice" ("?" pops).
SHOT_CAMS[4] = () => [
  K(306, hold([0.6, 4.6, 8.0], [-4.0, 3.4, -9], 50, 306, 0.002)),
  K(312, hold([0.6, 2.3, 8.0], [-4.0, 2.5, -9], 50, 312, 0.0022), 36),
  K(352, hold([1.5, 1.5, 1.3], [-3.0, 1.2, -5.5], 40, 352, 0.003, [[380, 0.006, 14]]), 24),
];
const fan = (f: number, k = 0): FigOpts => ({ armR: [[28, 10], [26 + 8 * Math.sin(f * 0.9 + k), -18]], armRFront: true, sweat: 1 });
const LOC: Record<string, V3> = { l1: [-2.9, 0, -3.9], l2: [-1.9, 0, -4.9], l3: [-3.3, 0, -6.3], l4: [-2.1, 0, -7.2] };
SHOT_ACTS[4] = (f) => ({
  ctl: { hatch: 0, gush: 0, puddle: 0, melt: 0.5 },
  cast: [
    C("marketWoman", LOC.l1, pose(null, { expr: "dismay", facing: 1, ...fan(f) })),
    C("islandMan", LOC.l2, pose(null, { expr: "cold", facing: -1, sweat: 1, armL: [[-26, 10], [-14, -22]], armLFront: true, headTilt: 3 * Math.sin(f * 0.2) })),
    C("islandKid", LOC.l3, pose(f >= 378 ? "shrug" : null, { expr: f >= 378 ? "blank" : "neutral", facing: 1, ...(f < 378 ? { propR: "mango", armR: [[22, 30], [30, 52]] as [[number, number], [number, number]] } : {}) })),
    C("islandMan2", LOC.l4, pose(null, { expr: "dismay", facing: 1, ...fan(f, 2) })),
  ],
  fx: f >= 380 ? [{ kind: "card", key: "qmark", pos: [LOC.l3[0], 1.62 + 0.08 * easeOut(lin(f, 380, 388)), LOC.l3[2]], w: 0.45 * easeOut(lin(f, 380, 386)), h: 0.45 * easeOut(lin(f, 380, 386)), cw: 128, ch: 128,
    draw: (p) => { p.ell(64, 64, 56, 56, "#ffffff", 7); p.g.fillStyle = "#1a1418"; p.g.font = "900 92px Arial Black, sans-serif"; p.g.textAlign = "center"; p.g.textBaseline = "middle"; p.g.fillText("?", 64, 70); } }] : [],
  focus: f >= 352 ? [LOC.l3[0], 1.2, LOC.l3[2]] : undefined,
});
lens(306, 0, 1); lens(352, 6, 14);

// ---- S05 (413-479) "When his ship docks in Martinique, / he opens the hold."  A sailor hauls the mooring line tight at
// the gangway, the locals crowd round; on "opens" Tudor heaves the hatch lid up and cold mist rolls out.
SHOT_CAMS[5] = () => [
  K(413, hold([-1.0, 0.95, 0.4], [-4.0, 1.7, -3.8], 44, 413, 0.0025)),
  K(450, hold([-2.0, 2.5, -1.2], [-6.6, 1.5, -5.0], 42, 450, 0.0028, [[460, 0.005, 14]]), 22),
];
SHOT_ACTS[5] = (f) => {
  const lid = sm(f, 460, 470);
  return {
    ctl: { hatch: lid, gush: 0, puddle: 0.1, melt: 0.5 },
    cast: [
      C("tudor", [-7.0, 0.65, -4.6], f < 456 ? pose("pointR", { expr: "determined", facing: 1 })
        : pose(null, { expr: f < 466 ? "strain" : "grin", facing: 1, tilt: f < 466 ? 8 : 0, armR: [[30, 26], [56, 30 - 40 * lid]], armL: [[-10, 36], [20, 40 - 30 * lid]], armRFront: true, armLFront: true }), { shadow: true }),
      ...(f < 452 ? [C("sailor1", [-3.4, 0, -2.6], pose(null, { expr: "strain", facing: -1, mode: "brace", tilt: -8, armL: [[-26, 24], [-50, 30 + 6 * Math.sin(f * 0.5)]], armR: [[-6, 30], [-36, 34 + 6 * Math.sin(f * 0.5)]], armRFront: true }))] : []),
      C("marketWoman", LOC.l1, pose(null, { expr: f > 440 ? "shock" : "neutral", facing: -1, sweat: 1 })),
      C("islandMan", LOC.l2, pose(null, { expr: "neutral", facing: -1, sweat: 1 })),
      C("islandKid", LOC.l3, pose(f > 440 ? "pointR" : null, { expr: f > 440 ? "grin" : "neutral", facing: -1, ...(f > 440 ? { armR: undefined, armL: [[-40, 18], [-88, 8]] as [[number, number], [number, number]] } : {}) })),
    ],
    focus: f >= 450 ? [-7.0, 2.2, -4.6] : undefined,
  };
};
lens(413, 0, 1); lens(450, 6, 12);

// ---- S06 (479-554) "Half the ice is a puddle, / and nobody wants the rest."  Ice #2: close on the slumped block in its
// spreading puddle (dashed outline = what it used to be), water gushing out; then the locals wave it off and leave.
SHOT_CAMS[6] = () => [
  K(479, hold([-5.15, 1.3, -3.45], [-6.0, 1.07, -5.35], 40, 479, 0.0028, [[488, 0.005, 14]])),
  K(512, hold([1.5, 1.5, 1.3], [-2.6, 1.2, -5.8], 42, 512, 0.0025), 22),
];
SHOT_ACTS[6] = (f) => {
  const off = sm(f, 528, 554);
  const away = (who: string, p: V3, i: number) => C(who, [p[0] + (i % 2 ? 0.9 : -0.9) * off, 0, p[2] - 1.6 * off], f < 518 ? pose(null, { expr: "dismay", facing: 1, sweat: 1 })
    : f < 528 ? pose("shrug", { expr: "blank", facing: 1 }) : pose(null, { expr: "blank", mode: "walk", phase: ph(f + i * 5, 15), facing: i % 2 ? 1 : -1 }), { idx: i });
  return {
    ctl: { hatch: 1, gush: sm(f, 479, 500), puddle: 0.6 + 0.4 * sm(f, 479, 520), melt: 0.72 },
    cast: [away("marketWoman", LOC.l1, 0), away("islandMan", LOC.l2, 1), away("islandKid", LOC.l3, 2), away("islandMan2", LOC.l4, 3)],
  };
};
lens(479, 10, 6); lens(512, 3, 12);

// =====================================================================================================================
// SEA (deep blue, hot sun). Ship on a pivot rig, bow +x, deck y 1.25.
// ---- S07 (554-651) "So how do you carry ice / across an ocean of heat / without it turning into soup?"
SHOT_CAMS[7] = () => [
  K(554, hold([17, 4, 25], [0, 4.2, 0], 36, 554, 0.0025)),
  K(592, hold([0.65, 2.35, 5.0], [0.45, 2.0, 0.5], 40, 592, 0.0018, [[634, 0.004, 12]]), 34),
];
SHOT_ACTS[7] = (f) => {
  const soup = sm(f, 600, 638);
  return {
    ctl: { soup, spout: 0.5 + 0.5 * Math.sin(f * 0.05) },
    cast: [
      C("tudor", [0, 1.25, 0.6], pose(soup > 0.6 ? "facepalm" : null, { expr: soup > 0.3 ? "dismay" : "determined", facing: 1, sweat: 1 }), { shadow: true }),
      C("sailor2", [1.6, 1.25, -0.35], pose(null, { expr: soup > 0.5 ? "grin" : "neutral", facing: -1, sweat: 1, armL: soup > 0.5 ? [[-24, 26], [-44, 30 + 8 * Math.sin(f * 0.4)]] : undefined, armLFront: true })),
    ],
    focus: f >= 592 ? [1.0, 1.9, 0.6] : undefined,
  };
};
lens(554, 0, 1); lens(592, 7, 20);

// =====================================================================================================================
// VOYAGE (cutaway diorama: amber hold, cool sea, red dashed equator at x = 0).
// ---- S19 (1512-1575) "Four months, / across the equator / twice."  Calendar flips JUN..SEP while the ship crosses.
SHOT_CAMS[19] = () => [
  K(1512, hold([6, 3, 22], [0, 2.6, -2], 44, 1512, 0.0025)),
  K(1550, hold([2.35 + 1.5, 1.4, 8.0], [2.35 + 1.5, 1.15, -0.6], 42, 1550, 0.003), 20),
];
SHOT_ACTS[19] = (f) => {
  const x = lerp(-5, 1.5, lin(f, 1512, 1575));
  return {
    ctl: { shipX: x, month: 3 * sm(f, 1515, 1560) },
    cast: [C("sailor1", [x + 1.0, 1.25, -0.85], pose(f > 1556 ? "cheer" : null, { expr: f > 1556 ? "joy" : "grin", facing: 1 })), C("sailor2", [x + 3.25, 1.25, -0.9], pose(f > 1546 ? "pointR" : null, { expr: "grin", facing: -1 }))],
    fx: f >= 1556 ? [{ kind: "card", key: "x2", pos: [0, 2.2 + 0.1 * easeOut(lin(f, 1556, 1564)), -4.6], w: 1.1 * easeOut(lin(f, 1556, 1562)), h: 0.75 * easeOut(lin(f, 1556, 1562)), cw: 256, ch: 176,
      draw: (p) => { const g = p.g; g.fillStyle = "#7fe3ff"; g.strokeStyle = "#141018"; g.lineWidth = 10; g.beginPath(); g.roundRect(8, 8, 240, 160, 36); g.fill(); g.stroke(); g.fillStyle = "#141018"; g.font = "900 112px Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("x2", 128, 94); } }] : [],
  };
};
lens(1512, 0, 1);

// =====================================================================================================================
// CALCUTTA ghat, golden hour (peach palaces, violet shade, cyan ice). TUSCANY moored at x -4, ramp foot [-2.1, 0, 0.6].
const CAL = ["cal1", "cal2", "cal3", "cal4", "cal5", "cal6"];
const CROWD: V3[] = [[2.75, 0, 4.0], [3.72, 0, 4.3], [4.7, 0, 4.58], [5.66, 0, 4.92], [6.54, 0, 5.42], [7.33, 0, 6.06], [7.47, 0, 6.97], [6.75, 0, 7.68], [5.84, 0, 8.12], [4.83, 0, 8.23], [3.81, 0, 8.23], [2.79, 0, 8.27]];
const crowd = (f: number, n: number, ex: (i: number) => Face, poseName: (i: number) => string | null = () => null) =>
  CROWD.slice(0, n).map((p, i) => C(CAL[i % 6], p, pose(poseName(i), { expr: ex(i), facing: i % 3 === 0 ? -1 : 1, bob: 2 * Math.sin(f * 0.3 + i) }), { idx: i }));
// ---- S20 (1575-1620) "When the hold opens in India,"
SHOT_CAMS[20] = () => [
  K(1575, hold([4.5, 6.8, 21.5], [-0.8, 2.6, -8], 52, 1575, 0.003)),
  K(1592, hold([10.5, 2.4, 13.8], [-1.8, 1.5, -4.5], 46, 1592, 0.0025), 26),
];
SHOT_ACTS[20] = (f) => ({ ctl: { hatch: sm(f, 1596, 1610), slide: 0, ships: 0 }, cast: crowd(f, 10, () => (f > 1606 ? "shock" : "neutral")) });
lens(1575, 0, 1);
// ---- S21 (1620-1702) PAYOFF "a hundred tons of Boston ice / slide out, / still frozen solid."  Low hero angle: the
// first giant block swings out and thunders down the ramp straight at us (fills > half the frame for 2.5 s), mist
// burst + flash on the landing (kick), then the crowd's gasp.
SHOT_CAMS[21] = () => [
  K(1620, hold([-1.66, 0.36, 2.9], [-2.16, 1.2, -4.5], 44, 1620, 0.0025, [[1656, 0.006, 16]])),
  K(1680, hold([0.6, 1.5, 7.2], [3.6, 1.2, 4.2], 44, 1680, 0.003), 16),
];
SHOT_ACTS[21] = (f) => ({ ctl: { hatch: 1, slide: f < 1660 ? lerp(0.12, 0.4, lin(f, 1620, 1660)) : lerp(0.4, 1.0, lin(f, 1660, 1702)), ships: 0 },
  cast: crowd(f, 8, (i) => (f > 1664 ? (i % 2 ? "shock" : "eureka") : "neutral"), (i) => (f > 1664 && i % 3 === 1 ? "cheer" : null)) });
lens(1620, 0, 1);
// ---- S22 (1702-1749) "People line up / just to touch it."  The queue winds to the block; a kid touches it and shivers with delight.
SHOT_CAMS[22] = () => [K(1702, hold([-1.7, 3.0, 0.9], [5.4, 1.0, 6.8], 48, 1702, 0.002)), K(1724, hold([4.6, 1.4, 6.6], [2.1, 1.05, 3.5], 44, 1724, 0.003, [[1738, 0.005, 12]]), 20)];
SHOT_ACTS[22] = (f) => {
  const touch = f >= 1738;
  return { ctl: { hatch: 1, slide: 1, ships: 0 },
    cast: [C("cal4", [2.35, 0, 3.7], pose(null, { expr: touch ? "cold" : "grin", facing: -1, armL: [[-24, 18], [touch ? -50 : -40, 22]], bob: touch ? 3 * Math.sin(f * 1.7) : 0 }), { idx: 30 }),
      ...crowd(f, 12, (i) => (i % 2 ? "grin" : "smile")).slice(1)] };
};
lens(1702, 0, 1); lens(1724, 9, 12);
// ---- S23 (1749-1839) "Tudor becomes the Ice King, / shipping ice around the world."  Crane up the ice throne: crown,
// scepter raised on "King", the TUDOR ICE CO. board's ships sail their routes, crowd cheering in front.
SHOT_CAMS[23] = () => [
  K(1749, hold([9.9, 1.1, 7.4], [10.2, 1.8, 0.6], 46, 1749, 0.003)),
  K(1772, hold([10.0, 2.1, 6.4], [10.4, 2.25, 0.6], 46, 1772, 0.0025, [[1778, 0.005, 14]]), 30),
];
SHOT_ACTS[23] = (f) => ({ ctl: { hatch: 1, slide: 1, ships: sm(f, 1796, 1835) },
  cast: [C("tudorKing", [10.52, 0.35, 0.95], pose(f >= 1776 ? null : "hips", { expr: f >= 1776 ? "joy" : "smug", ...(f >= 1776 ? { armR: [[30, -14], [34, -58]] as [[number, number], [number, number]], propR: "scepter" } : {}) }), { shadow: true }),
    ...[[8.5, 0, 3.0], [12.3, 0, 3.2], [9.1, 0, 3.9], [11.9, 0, 4.1]].map((p, i) => C(CAL[i], p as V3, pose(f > 1778 ? "cheer" : null, { expr: f > 1778 ? "joy" : "grin", facing: i % 2 ? -1 : 1, bob: f > 1778 ? 4 * Math.abs(Math.sin(f * 0.35 + i)) : 0 }), { idx: 40 + i }))],
  focus: [10.52, 2.0, 0.95] });
lens(1749, 6, 1); lens(1772, 0, 14);

// ---------------- publish the lens table ----------------
DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
export const __unused = { glide, add, Face: null as unknown as Face };
