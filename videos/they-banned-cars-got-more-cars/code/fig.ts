// Our cast for "Why Boston Shipped Ice to India", built on toon.ts's measured primitives (characters.md):
// bean heads (H/W .94, crown/jaw exponents, chin taper, side bulge, tilt), plum thick-thin ink (5 % W, x3 on the shadow
// side), 3.5 head-heights, single-stroke limbs ~.055 W, ink-dot hands, short stroke feet, crescent/gradient shading.
// Master prompt v10 overrides: heads are WHITE / off-white (never skin-coloured), no blush, hats/hair sit ON the head as
// separate outlined shapes, bodies are beans with costume detail, every arm pose is free so every verb can be acted.
import {
  Pen, INK, P2, Blob, blobPts, headBlob, thickAngle, mul, shade, mix, rad, clamp, rnd, rotPts, lerp2, curve, ellPts, taper,
  SH_SKIN, SH_CLOTH, SH_FELT, FACE, eye, eyeKind, lidOf, mouth, dmouth, footStroke, Expr, EyeK, MouthK,
} from "./toon";
import { drawProp68 } from "./props68";
import { brickFaceTex } from "./sets/brickyard";
import { critter68, henDraw } from "./critters68";

export const HEAD = "#fbf8f3"; // off-white head (v10 character spec 1)
const WHITE = "#ffffff";

export type HatK = "toque" | "tophat" | "bowler" | "beanie" | "stripecap" | "flatcap" | "straw" | "madras" | "turban" | "bicorne" | "tricorn" | "crown" | "bonnet" | "fedora" | "kepi" | "cloche" | "beret" | "hood" | "helm" | "horns" | "jester"
  | "headband" | "mailcap" | "laurel" | "picture"
  // ---- 1968 bridge additions ----
  | "cowboy" | "hardhat" | "custodian" | "trilby" | "headscarf" | "baseball" | "sunhat" | "bucket" | "nightcap" | "none"
  // ---- 1937 Java (skull video) ----
  | "caping" | "pith" | "peci";
export type Look = {
  coat: string; lapel?: string; vest?: string; vestStripe?: string; scarf?: string; collar?: string; buttons?: string; chain?: boolean;
  apron?: string; stripes?: string; belt?: string; sash?: string; cape?: string; kurta?: boolean; drape?: string; dress?: string; suspenders?: string;
  legs?: string; boots?: string; hat?: HatK; hatCol?: string; /** r76i: lift the hat by this many head-heights */ hatUp?: number; band?: string; jewel?: string;
  hair?: string; hairStyle?: "tufts" | "bun" | "topknot" | "cowlick" | "short" | "bald" | "parted" | "curl" | "bob" | "pigtails" | "slick" | "spiky";
  /** hoodie: two drawstrings in this colour from the neck + a kangaroo pocket + soft rib lines (coat = the hoodie colour) */ hoodie?: string;
  /** surgical mask colour (FigOpts.maskDrop 0 on the face .. 1 dangling from the right ear) */ mask?: string;
  moustache?: string; beard?: string; glasses?: boolean; monocle?: boolean; shades?: boolean; goggles?: boolean;
  build?: "adult" | "stout" | "kid" | "tall" | "thin" | "lanky" | "plump"; seed: number;
  // ---- 1968 bridge additions (all optional) ----
  /** grey sideburns down the cheeks; moustache shape (neat = outlined bar, handlebar = curled tips, walrus = big droop) */
  sideburns?: string; moStyle?: "neat" | "handlebar" | "walrus";
  /** bolo tie with this stone colour; necktie colour (+ diagonal stripe colour, loosened knot) */
  bolo?: string; tie?: string; tieStripe?: string; tieLoose?: boolean;
  /** shirt pocket with a plastic pocket protector + pens; pencil tucked behind the ear; wristwatch on the left wrist */
  pocketPro?: string; pencilEar?: boolean; watch?: boolean;
  /** work gloves (big outlined hands in this colour); short sleeves (bare ink forearms); sweat patches + drops */
  gloves?: string; shortSleeve?: boolean; sweaty?: boolean;
  /** tool belt (pouches + hammer); leather shoulder yoke (donkey jacket); Hawaiian / sundress flower print colour */
  toolbelt?: string; patches?: string; hawaii?: string;
  /** camera hanging on a neck strap; capri trousers colour (bare calves); tall boots colour; mini dress (legs show) */
  camStrap?: boolean; capri?: string; tallBoots?: string; mini?: boolean;
  /** big round glasses; cat-eye sunglasses frame colour; lapel carnation; pocket square; paint splats on the clothes */
  bigGlasses?: boolean; catEye?: string; carnation?: string; pocketSq?: string; splats?: boolean;
  /** pigtail bows / hair-band colour; police collar badges + whistle chain */
  bow?: string; police?: boolean; /** open jacket lapels over a shirt V (no waistcoat) + shirt colour */ lapels?: boolean; shirt?: string; /** gold cord from the monocle to the lapel (needed for FigOpts.monoclePop) */ monoCord?: boolean;
  // ---- 1904 marathon additions (all optional) ----
  /** sleeveless athletic vest: the torso bean in this colour with a scooped neck + armholes; arms become bare ink noodles */
  singlet?: string; /** horizontal band across the chest (singlet stripe) */ chestStripe?: string;
  /** short trousers in this colour (bare ink-noodle legs below); `ragged` cuts the trousers (`shorts` ?? `legs`) with a zig-zag hem */
  shorts?: string; ragged?: boolean; /** long socks on the lower legs */ socks?: string; /** light shoes (outlined foot strokes) */ shoes?: string;
  /** race number on a white cloth bib pinned to the stomach (text auto-fits) */ bib?: string; bibCol?: string;
  /** gold medal on a ribbon around the neck (also FigOpts.medal) */ medal?: boolean;
  /** leather mail satchel worn across the body (strap over the chest, bag at the hip): its colour */ mailbag?: string;
  /** shirt sleeves rolled to the elbow (bare ink forearms) */ rolled?: boolean;
  /** vertical blazer stripes / plaid shirt check / checked waistcoat (colours over the coat / vest) */ vstripes?: string; plaid?: string; vestCheck?: string;
  /** bow tie colour; mutton-chop side whiskers colour */ bowtie?: string; chops?: string;
  /** crash-test dummy: black/yellow quadrant target decals on the temples and the chest */ dummy?: boolean;
  /** 1937 Java: batik print colour on the shirt (kawung rings + parang waves); sarong colour over the legs (checked) */ batik?: string; sarong?: string;
  /** non-human cast member drawn by creature(): fur / patch colours */ species?: "dog" | "rat" | "lizard" | "duck" | "pigeon" | "pig" | "cow" | "lion" | "impala" | "hen"; fur?: string; patch?: string; /** cow: big painted eyes on the rump */ painted?: boolean;
};
// our extra faces on top of toon.ts FACE (eyes [back, front], brows [inner, outer] in u, mouth)
export type Face = Expr | "smug" | "dismay" | "sheepish" | "strain" | "eureka" | "sly" | "joy" | "angry" | "determined" | "cold" | "blank" | "talk"
  | "dizzy" | "green" | "sleep" | "gulp" | "wired" | "dead"
  // ---- 1968 bridge additions ----
  | "guffaw" | "beam" | "glow" | "stare" | "yikes" | "calm" | "aghast" | "pitch" | "bored" | "proud"
  // ---- v10.15 board AN (the eight faces): moustache mouth, gloating curl, fake polite grin, fury, purple rage + steam,
  // breakdown, schemer's toothy grin, mocking laugh (closed arcs + open mouth + blush), worry ----
  | "tache" | "tacheUp" | "fakegrin" | "fury" | "rage" | "breakdown" | "scheme" | "mock" | "worry";
type XEye = EyeK | "x" | "huge" | "closed" | "stare";
type XMouth = MouthK | "queasy" | "puff" | "teethWide" | "tongue" | "beam" | "guffaw" | "content" | "flat" | "tache" | "tacheUp" | "grit" | TalkK;
/** v10.10 lip-sync shapes (board AG): big talking mouths, 40-50 % of the face width, dark inside, teeth + tongue.
 *  tClosed lips together (m/b/p) | tSmall small open | tWide wide open, both rows of teeth | tTongue open with tongue
 *  (l/t/d/n/th) | tO round O (o/w) | tE wide flat with clenched teeth (e/i/s) | tSmile smile-talk | tFrown frown-talk */
export type TalkK = "tClosed" | "tSmall" | "tWide" | "tTongue" | "tO" | "tE" | "tSmile" | "tFrown" | "tOBig";   // tOBig: a shocked open O, ~37% of the face width
const TALK: Record<string, [number, number, number, number, number, number]> = {
  // half width, depth, upper-lip curve (+ = corners down), top teeth, bottom teeth, tongue (all in u)
  tSmall: [15, 9.5, 0.5, 0, 0, 0], tWide: [22, 16, -1, 3.6, 3.2, 0], tTongue: [19, 13, 0, 3.4, 0, 1], tE: [23, 8.5, 0, 3.4, 3.2, 0],
  tSmile: [22, 12.5, 3, 3.6, 0, 1], tFrown: [20, 9, -3.5, 0, 3.2, 0],
};
const talkMouth = (p: Pen, k: TalkK, mx: number, top: number, u: number) => {
  const INKM = "#241726", DARK = "#4a1420", TEETH = "#fbf8f0", TONG = "#e0646e";
  if (k === "tClosed") { const pts: P2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 6 - 1; pts.push([mx + t * 17 * u, top + 3 * u - 3.2 * u * (1 - t * t)]); } p.stroke(pts, 4.2 * u, INKM); return; }
  if (k === "tOBig") { p.ell(mx, top + 16 * u, 17.5 * u, 20 * u, DARK, 3.8 * u); p.clip(ellPts(mx, top + 16 * u, 17.5 * u, 20 * u), () => p.ell(mx, top + 31 * u, 10 * u, 7 * u, TONG, 0)); p.ell(mx, top + 16 * u, 17.5 * u, 20 * u, null, 3.8 * u); return; }
  if (k === "tO") { p.ell(mx, top + 11 * u, 10 * u, 12.5 * u, DARK, 3.4 * u); p.clip(ellPts(mx, top + 11 * u, 10 * u, 12.5 * u), () => p.ell(mx, top + 21 * u, 6 * u, 4 * u, TONG, 0)); p.ell(mx, top + 11 * u, 10 * u, 12.5 * u, null, 3.4 * u); return; }
  const [w, h, uc, tt, bt, tg] = TALK[k];
  const up: P2[] = [], lo: P2[] = [];
  for (let i = 0; i <= 14; i++) { const t = i / 7 - 1; up.push([mx + t * w * u, top + uc * u * t * t - uc * u * 0.5 + (k === "tFrown" ? -uc * u * (1 - t * t) * 0.6 : 0)]); }
  for (let i = 14; i >= 0; i--) { const t = i / 7 - 1; const yU = up[i][1]; lo.push([mx + t * w * u, yU + h * u * Math.pow(Math.max(0, 1 - t * t), 0.75)]); }
  const shape = [...up, ...lo];
  p.poly(shape, DARK, 0);
  p.clip(shape, () => {
    if (tg) p.ell(mx + 2 * u, top + h * u * 0.95, w * 0.45 * u, h * 0.35 * u, TONG, 0);
    if (tt) p.poly([[mx - w * u, top - 6 * u], [mx + w * u, top - 6 * u], [mx + w * u, top + tt * u + Math.abs(uc) * 0.4 * u], [mx - w * u, top + tt * u + Math.abs(uc) * 0.4 * u]], TEETH, 0);
    if (bt) p.poly([[mx - w * u, top + h * u - bt * u], [mx + w * u, top + h * u - bt * u], [mx + w * u, top + h * u + 4 * u], [mx - w * u, top + h * u + 4 * u]], TEETH, 0);
  });
  p.poly(shape, null, 3.4 * u);
};
const XFACE: Record<string, { eye: [XEye, XEye]; brow: [number, number]; mouth: XMouth }> = {
  smug: { eye: ["lid", "lid"], brow: [-1, -3], mouth: "smirk" },
  sly: { eye: ["slit", "slit"], brow: [3, -2], mouth: "smirk" },
  dismay: { eye: ["small", "small"], brow: [-5, 2], mouth: "frown" },
  sheepish: { eye: ["small", "small"], brow: [-4, 2], mouth: "wave" },
  strain: { eye: ["squeeze", "squeeze"], brow: [4, -2], mouth: "teeth" },
  eureka: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "grin" },
  joy: { eye: ["happy", "happy"], brow: [-4, -4], mouth: "laugh" },
  angry: { eye: ["dot", "dot"], brow: [5, -3], mouth: "frown" },
  determined: { eye: ["lid", "lid"], brow: [4, -1], mouth: "smirk" },
  cold: { eye: ["squeeze", "squeeze"], brow: [-3, 2], mouth: "teeth" },
  blank: { eye: ["dot", "dot"], brow: [-1, -1], mouth: "dash" },
  talk: { eye: ["dot", "dot"], brow: [-2, -3], mouth: "O" },
  dizzy: { eye: ["spiral", "spiral"], brow: [-4, 3], mouth: "wave" },
  green: { eye: ["slit", "slit"], brow: [-4, 3], mouth: "queasy" },
  sleep: { eye: ["closed", "closed"], brow: [1, 1], mouth: "o" },
  gulp: { eye: ["shock", "shock"], brow: [-6, -2], mouth: "puff" },
  wired: { eye: ["huge", "huge"], brow: [-9, -8], mouth: "teethWide" },
  dead: { eye: ["x", "x"], brow: [-2, 2], mouth: "tongue" },
  // 1968: guffaw = laugh with the head tipped back (features slide up, huge open mouth); beam = big proud grin;
  // stare = wide flat eyes (white discs, lids level) at the paper; yikes = jump-scare; calm = small content smile
  guffaw: { eye: ["squeeze", "squeeze"], brow: [-7, -7], mouth: "guffaw" },
  beam: { eye: ["happy", "happy"], brow: [-6, -5], mouth: "beam" },
  glow: { eye: ["happy", "happy"], brow: [-5, -4], mouth: "smile" },   // r76i: joy as a closed-mouth beam with blush (laugh keeps the open grin)
  stare: { eye: ["stare", "stare"], brow: [-2, -2], mouth: "flat" },
  yikes: { eye: ["huge", "huge"], brow: [-10, -8], mouth: "teethWide" },
  calm: { eye: ["lid", "lid"], brow: [-1, 0], mouth: "dash" },   // r12: the deadpan is a flat mouth (smirks only when he knows something)   // r6: calm = half-lid deadpan (the hero never closes his eyes to smile)
  aghast: { eye: ["shock", "shock"], brow: [-8, -4], mouth: "o" },   /* v15 AX1 row 2: shock keeps a small o (the open tongue mouth was not Rick) */
  pitch: { eye: ["dot", "dot"], brow: [-4, -5], mouth: "smileWide" },
  bored: { eye: ["slit", "slit"], brow: [1, 1], mouth: "flat" },
  proud: { eye: ["lid", "lid"], brow: [-3, -4], mouth: "smile" },
  // v10.15 (board AN)
  tache: { eye: ["lid", "lid"], brow: [1, -4], mouth: "tache" },          // 2 disapproval / authority: half-lids, wide downturned curl-ended mouth
  tacheUp: { eye: ["lid", "lid"], brow: [-1, -4], mouth: "tacheUp" },    // 2 curled UP = smug, gloating
  fakegrin: { eye: ["happy", "happy"], brow: [-2, -2], mouth: "grit" },  // 4 polite fake smile: closed arcs + gritted rectangle
  fury: { eye: ["slit", "slit"], brow: [8, -4], mouth: "grit" },         // 6 anger: sharp V brows, line eyes, gritted grid teeth
  rage: { eye: ["slit", "slit"], brow: [9, -5], mouth: "grit" },         // 6 escalated: + purple face + steam (drawn below)
  breakdown: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "grit" }, // 1 variant: circle eyes + gritted teeth + sweat
  scheme: { eye: ["lid", "lid"], brow: [5, -4], mouth: "grin" },         // 4 schemer: half-lid squint, raised brow, wide toothy grin
  mock: { eye: ["happy", "happy"], brow: [-6, -5], mouth: "laugh" },     // 3 mocking laugh: closed arcs, mouth wide open with teeth, blush
  worry: { eye: ["dot", "dot"], brow: [-5, 3], mouth: "wave" },          // 7 worry: brows up in the middle, wavy mouth, sweat
};
/** features slide up by this much (u) for expressions that tip the head back */
const FACE_UP: Record<string, number> = { guffaw: 9, proud: 3 };
/** v10.16 A2: heads tilt 5-20 deg on emotion and listening: a lean toward whoever they face, plus a cock of the head by mood */
const TILT_EXPR: Record<string, number> = { smug: -8, scheme: -7, tacheUp: -7, sly: -8, tache: -4, worry: 9, nervous: 9, sheepish: 11, dismay: 8, shock: -6, aghast: -6, yikes: -5, breakdown: 6, mock: 0, guffaw: 0, angry: 5, fury: 6, determined: 4, bored: -5, calm: 5, proud: -6, stare: 3, gulp: 7, beam: 6, glow: 6, joy: 6, fakegrin: 7 };
const autoTilt = (expr: string, facing: number) => { const d = Math.sign(facing) || 1; return Math.round(5 * facing + d * (TILT_EXPR[expr] ?? 4)); };
const NEW_TILT_OFF = (mode: string) => mode === "lie" || mode === "stagger" || mode === "carried";
export const faceOf = (e: Face) => (FACE as Record<string, typeof XFACE[string]>)[e] ?? XFACE[e] ?? FACE.neutral;

export type Arm = [P2, P2]; // elbow, hand: offsets in u from the shoulder (+x = screen right, +y = down)
export type FigOpts = {
  expr?: Face; facing?: number; look?: number; blink?: number; tilt?: number; headTilt?: number;
  /** surgical mask: 0 worn .. 1 slipped off, hanging from the right ear loop */ maskDrop?: number;
  mode?: "stand" | "walk" | "sit" | "brace" | "air" | "kick" | "run" | "stagger" | "lie" | "carried"
    | "stride" | "kneel" | "push" | "hop"; phase?: number; bob?: number;
  // ---- 1968 bridge additions ----
  /** 0..1 laugh shake: upper body rocks + bounces, head wobbles, driven by `phase` (1 phase unit = one shake cycle;
   *  advance phase ~2-3 per second). Feet stay planted. */
  shake?: number;
  /** 0..1 head tipped back (features slide up, chin up); expr "guffaw" implies 1 */ headBack?: number;
  /** v10.16: switch off the automatic head tilt (A2) */ noAutoTilt?: boolean;
  /** mode "sit": 0 = feet on the floor, 1 = legs stretched out level toward the facing side (feet up on a desk) */ feetUp?: number; /** r42: mode "sit": extra shin length (head heights) so the legs hang down over a ledge */ sitLeg?: number;
  /** mode "hop": 0..1 height of the jump (1 = feet 0.3 head-heights off the ground) */ lift?: number;
  /** mode "kneel": 0 = standing, 1 = full kneel (in-between for kneeling down / standing up). Lion: crouchK, mode "stride": 0 = stalk, 1 = crouch */
  kneelK?: number; crouchK?: number;
  /** mode "brace": 0 = plain standing legs, 1 = full wide knees-bent brace (default 1); blend it to bend the knees smoothly */ braceK?: number;
  /** mode "stride": step length in design units (default 0.55 HH ~ 120); bobK = vertical bob, fraction of the height
   *  (peak-to-peak, default 0.05). Feet are planted: move the card forward strideM() metres per phase unit. */
  stride?: number; bobK?: number;
  /** 0..1 monocle pops off the eye (0-0.35 flies up), drops and dangles on its cord (0.35-1, damped swing) */ monoclePop?: number;
  armL?: Arm; armR?: Arm; armLFront?: boolean; armRFront?: boolean;
  propL?: string; propR?: string; propLAng?: number; propRAng?: number; propK?: number; /** r68: a held brick/loaf gripped by its outer end (the dot hand on the end, mid-height) instead of carried on the hand */ gripEnd?: boolean; /** r76i: -1..1 which leg takes the weight (default from the seed) */ weight?: number; /** r76i: both held props drawn over the arms, dots on top */ propsOver?: boolean; /** r76h: a brick/loaf carried level on BOTH dot hands under its base, arms behind it */ carry2?: boolean; /** r76i: both trouser pockets pulled inside out - the universal "broke" */ pocketsOut?: boolean; /** r42: 0..1 darker held bricks */ propDim?: number;
  /** smooth-acting overrides: brow [inner, outer] in u (eases between faces), extra eyelid 0..1 for a swap blink, an in-between mouth */
  brow?: [number, number]; swapLid?: number; mouthX?: string;
  /** cow: how far the rump eyes are painted (0 none, 0.5 one eye, 1 both); default from Look.painted */ paintK?: number;
  mouth?: MouthK | TalkK; sweat?: number; wet?: number; hatLift?: number; hatTilt?: number; squash?: number; light?: number;
  noHat?: boolean;
  /** the head is gone (the dummy's popped off): a neck bolt instead */ noHead?: boolean;
  /** draw this arm and its prop over the head (camera at the eye, paper up to the nose) */ armLTop?: boolean; armRTop?: boolean;
  /** seen from behind: no face, back of the hair, plain coat back (over-the-shoulder / walking-away shots) */
  back?: boolean;
  /** gold medal around the neck (same as Look.medal) */ medal?: boolean;
  /** 0..1 faint green tint on the head (expr "green" implies 0.5) */ sick?: number;
  /** 0..1 purple rage face (expr "rage" implies 1, with steam from the ears) */ purple?: number;
  /** v10.15 E (board AN2): 0..1 purple filling the egg from the chin up like a thermometer (0.2 s on the word "goes"); 1 = full purple */ purpleFill?: number;
  /** 0..1 steam puffs from the ears popping in (the key word "purple"); expr "rage" implies 1 */ steam?: number;
  /** mode "lie": 0 = legs flat on the ground, 1 = legs straight up in the air (default 0.35) */ legsUp?: number;
  /** rotate (deg) / scale the whole drawing about the card point (300, 600): 2D sheets and insets only */ turn?: number; zoom?: number;
};
// v13 (Rick measured, board AT / AL / J full bodies): legs ~1.18 head heights, torso ~1.05 head heights and ~0.82 head widths
const BUILDS = { adult: { a: 118, torso: 1.05, legs: 1.18, tw: 0.82 }, stout: { a: 120, torso: 1.1, legs: 1.1, tw: 0.94 },
  kid: { a: 112, torso: 0.82, legs: 0.85, tw: 0.74 }, tall: { a: 116, torso: 1.12, legs: 1.28, tw: 0.78 },
  thin: { a: 114, torso: 1.08, legs: 1.24, tw: 0.66 }, lanky: { a: 110, torso: 1.2, legs: 1.38, tw: 0.62 },
  plump: { a: 120, torso: 1.08, legs: 1.02, tw: 1.06 } };
/** metres the card must travel per phase unit in mode "stride" (feet planted), at CastPlace scale 1 */
export const strideM = (o: Look, opts: FigOpts = {}) => { const Bd = BUILDS[o.build ?? "adult"], HH = 2 * Bd.a * 0.94; return 2 * (opts.stride ?? 0.55 * HH) * 0.00216; };

/** text that fits a box (design units) centred on c, rotated by ang (+ the Pen's body rotation) */
export const SANS = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif', CONDENSED = '"DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans", sans-serif';
export const ptext = (p: Pen, s: string, c: P2, maxW: number, maxH: number, ang = 0, col: string = INK, weight = 800, fam = SANS) => {
  const g = p.g, [x, y] = p.P(c[0], c[1]), a = ang + (p.rot ? p.rot[0] : 0);
  g.save(); g.font = `${weight} 100px ${fam}`;
  const w100 = g.measureText(s).width || 1, size = Math.min((100 * maxW) / w100, maxH / 0.73);
  g.font = `${weight} ${size}px ${fam}`; g.translate(x, y); g.rotate(a);
  g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(s, 0, 0.365 * size);
  g.restore();
};
type RotFn = (pts: P2[]) => P2[];
/** tiny skull + crossbones (poison labels), centre (x, y) in prop units */
const skull = (p: Pen, R: RotFn, u: number, x: number, y: number, k: number) => {
  for (const s of [-1, 1]) p.band(R([[x - 6 * k * s, y - 4 * k], [x + 6 * k * s, y + 6 * k]]), "#f6f1e4", 1.6 * k * u, 0.7 * u, "round");
  p.poly(R(ellPts(x, y - 2 * k, 5 * k, 4.6 * k)), "#f6f1e4", 1.1 * u);
  p.poly(R([[x - 2.8 * k, y + 1.6 * k], [x + 2.8 * k, y + 1.6 * k], [x + 2.2 * k, y + 4.2 * k], [x - 2.2 * k, y + 4.2 * k]]), "#f6f1e4", 1.1 * u);
  for (const s of [-1, 1]) { const [e] = R([[x + s * 2 * k, y - 2.2 * k]]); p.dot(e[0], e[1], 1.3 * k * u); }
};
/** shiny gold medal disc with a star, radius r (design units) */
const medalDisc = (p: Pen, c: P2, r: number, u: number) => {
  p.ell(c[0], c[1], r, r, "#f2c230", 2.4 * u);
  p.ell(c[0], c[1], r * 0.72, r * 0.72, "#e0a81c", 1.1 * u);
  const st: P2[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = (i % 2 ? 0.22 : 0.5) * r; st.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  p.poly(st, "#fbe27a", 0.9 * u);
  p.arc(c[0], c[1], r * 0.8, r * 0.8, 200, 250, 1.8 * u, "rgba(255,255,255,0.9)");
};
/** tapered tube along a polyline (tails), widths w0 -> w1, outlined */
const tube = (p: Pen, pts: P2[], w0: number, w1: number, fill: string, ol: number) => {
  const L: P2[] = [], Rr: P2[] = [], n = pts.length;
  pts.forEach((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([q[0] - (dy / l) * w, q[1] + (dx / l) * w]); Rr.push([q[0] + (dy / l) * w, q[1] - (dx / l) * w]); });
  p.poly([...L, ...Rr.reverse()], fill, ol);
};

/** hand-held props, drawn around the hand point h (design coords, before the Pen's body rotation) */
/** r76i: flat held sheets and books - the forearm is drawn across their front so the hand reads as gripping them */
const BOOKS = new Set(["ledger", "newspaper", "notice", "lawbook", "letter", "deed", "invite", "clipboard", "envelope", "libBook", "coffeeBook", "comic", "card", "overdue"]);
export const drawProp = (p: Pen, name: string, h: P2, u: number, ang = 0, k = 0) => {
  const R = (pts: P2[]) => rotPts(pts.map(([x, y]) => [h[0] + x * u, h[1] + y * u] as P2), ang, h[0], h[1]);
  const E = (x: number, y: number, rx: number, ry: number, fill: string | null, ol: number) => { const [c] = R([[x, y]]); p.ell(c[0], c[1], rx * u, ry * u, fill, ol * u, 0, 360, (ang * 180) / Math.PI); };
  const ow = 2.6;
  switch (name) {
    case "tongs": // iron ice tongs: handles up, two curved jaws down
      p.band(R([[0, -8], [0, 30]]), "#4a4f5c", 3.4 * u, 1.1 * u, "round");
      for (const s of [-1, 1]) p.band(R(curve([0, 30], [s * 22, 50], [s * 8, 74] as P2, 8)), "#4a4f5c", 3.2 * u, 1.1 * u, "round");
      E(0, 30, 3.4, 3.4, "#7d838f", 1.2);
      break;
    case "newspaper": {
      const pg = R([[-46, -66], [44, -70], [46, 2], [-44, 6]]);
      p.poly(pg, "#f1e9d2", ow * u);
      p.stroke(R([[-38, -54], [38, -57]]), 2 * u, "#2a2228"); // masthead rule
      p.poly(R([[-38, -48], [36, -50], [36, -40], [-38, -38]]), "#2a2228", 0); // headline bar (text is drawn by the cast layer)
      p.poly(R([[-38, -32], [-6, -33], [-6, -8], [-38, -7]]), "#e8dcc0", 1.2 * u); // engraving panel: a little tower
      p.poly(R([[-22, -31], [-28, -9], [-24, -9], [-22, -16], [-20, -9], [-16, -9]]), "#6b4a2f", 0.9 * u);
      for (let i = 0; i < 4; i++) p.stroke(R([[0, -30 + i * 7], [36, -31 + i * 7]]), 1.6 * u, "#8a8070");
      break;
    }
    case "moneybag": case "moneybagTorn": {
      const bag = R([[-6, -4], [-30, 16], [-28, 44], [0, 54], [28, 44], [30, 16], [6, -4]]);
      p.poly(bag, "#c99a5a", ow * u);
      p.band(R([[-9, 2], [9, 2]]), "#7a5426", 2.4 * u, 0.8 * u, "round");
      p.stroke(R([[-4, 26], [4, 22], [-4, 34], [4, 38]]), 2 * u, "#6a4a22"); // $ squiggle
      if (name === "moneybagTorn") p.poly(R([[-12, 50], [-6, 40], [0, 52], [6, 41], [12, 50]]), INK, 0);
      break;
    }
    case "glass": { // tall glass of iced lemonade with a straw
      p.poly(R([[-12, -40], [12, -40], [10, 4], [-10, 4]]), "rgba(214,240,252,0.75)", ow * u);
      p.poly(R([[-11, -24], [11, -24], [10, 3], [-10, 3]]), "#f2bd4e", 0);
      for (const [x, y] of [[-4, -28], [5, -20], [-3, -12]] as P2[]) p.poly(R([[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]]), "#eafaff", 1.2 * u);
      p.band(R([[6, -50], [2, -18]]), "#e2483c", 1.6 * u, 0.6 * u, "round");
      break;
    }
    case "juiceGlass": { // short tumbler of fresh orange juice
      p.poly(R([[-18, -46], [18, -46], [15, 5], [-15, 5]]), "rgba(214,240,252,0.75)", ow * u);
      p.poly(R([[-16, -27], [16, -27], [14, 4], [-14, 4]]), "#f59a1c", 0);
      p.poly(R([[-16, -27], [16, -27], [16, -22], [-16, -22]]), "#ffc04a", 0);
      p.stroke(R([[-11, -38], [-9, -8]]), 2.8 * u, "rgba(255,255,255,0.7)");
      break;
    }
    case "magnifier":
      p.band(R([[0, 6], [0, -34]]), "#7a4a24", 4.6 * u, 1.2 * u, "round");
      E(0, -58, 26, 26, "rgba(200,238,255,0.35)", 0); E(0, -58, 26, 26, null, 5.5); E(0, -58, 23, 23, null, 1.2);
      p.stroke(R([[-14, -70], [-6, -78]]), 2.4 * u, "rgba(255,255,255,0.85)");
      break;
    case "shovel":
      /* r76f (AX row 5): a full-size shovel, the blade down by the feet (a toy trowel at the hip) */
      p.band(R([[0, -50], [0, 132]]), "#9a6a3a", 3.6 * u, 1.1 * u, "round");
      p.band(R([[-7, -52], [7, -52]]), "#9a6a3a", 3.4 * u, 1.1 * u, "round");
      p.poly(R([[-13, 132], [13, 132], [11, 160], [0, 167], [-11, 160]]), "#9aa3ad", ow * u);
      if (k > 0) E(0, 36, 13, 6 * k + 2, "#e2b25c", 1.2);
      break;
    case "soda":
      p.poly(R([[-8, -26], [8, -26], [8, 2], [-8, 2]]), "#d9352f", 2 * u);
      p.poly(R([[-8, -17], [8, -17], [8, -12], [-8, -12]]), WHITE, 0);
      E(0, -26, 7, 2, "#c9ced4", 1.2);
      for (const [x, y] of [[-4, -6], [4, -20], [2, -2]] as P2[]) E(x, y, 1.6, 2.2, "rgba(255,255,255,0.85)", 0);
      break;
    case "scepter":
      p.band(R([[0, 18], [0, -58]]), "#d9a520", 3.4 * u, 1.1 * u, "round");
      p.poly(R([[0, -84], [10, -66], [0, -54], [-10, -66]]), "#c8f1ff", ow * u);
      break;
    case "icechunk":
      p.poly(R([[-16, -18], [14, -21], [18, 8], [-13, 12]]), "#bfefff", ow * u);
      p.stroke(R([[-9, -12], [6, -14]]), 2.4 * u, WHITE);
      E(9, 16 + 8 * k, 2.2, 3, "#7fd0f0", 0.8);
      break;
    case "mango": E(0, -4, 9, 7, "#f2a43a", 1.6); E(4, -10, 3, 2, "#5aa344", 1); break;
    case "handful": E(0, -6, 14, 7, "#e2b25c", 1.6); for (let i = 0; i < 5; i++) { const [c] = R([[-9 + i * 4.5, -9 + (i % 2) * 4]]); p.dot(c[0], c[1], 1.1 * u, "#b98a3e"); } break;
    case "husks": E(0, -6, 14, 7, "#d9c27a", 1.6); break;
    case "keys": E(0, 6, 7, 7, null, 2.2); p.band(R([[4, 12], [6, 28]]), "#c9a227", 2 * u, 0.6 * u); break;
    // ---- oranges-in-ice video ----
    case "hose": { // brass nozzle in the fist, green garden hose hanging down out of the hand
      p.band(R(curve([0, 8], [-14, 40], [-6, 90] as P2, 10)), "#2f7a3a", 5 * u, 1.3 * u, "round");
      p.poly(R([[-4, 8], [4, 8], [3, -18], [-3, -18]]), "#d8a83a", 1.6 * u); E(0, -19, 3.4, 2, "#a8781e", 1);
      break;
    }
    case "orange": E(0, -6, 9, 9, "#f28a1e", 1.6); E(-3, -10, 3, 2.2, "#ffc27a", 0); E(3, -15, 3.2, 1.8, "#4f8f3a", 1); break;
    case "frozenOrange": E(0, -7, 12, 12, "#d8f0fb", 1.6); E(0, -6, 8.4, 8.4, "#e8963c", 1.0); E(-5, -12, 3, 2, "#ffffff", 0); break;
    case "orangeHalf": { E(0, -6, 10, 10, "#f28a1e", 1.6); E(0, -6, 8, 8, "#ffcf6a", 0.8); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.stroke(R([[0, -6], [Math.cos(a) * 7.5, -6 + Math.sin(a) * 7.5]]), 0.8 * u, "#f2a43a"); } break; }
    case "thermos": { const b = R([[-6, -30], [6, -30], [6, 10], [-6, 10]]); p.poly(b, "#3f6fa8", ow * u); p.poly(R([[-7, -36], [7, -36], [7, -29], [-7, -29]]), "#c8352e", 1.6 * u); p.stroke(R([[-5, -10], [5, -10]]), 1.4 * u, "#e8dcc0"); break; }
    case "steamCup": { const b = R([[-8, -16], [8, -16], [6, 2], [-6, 2]]); p.poly(b, "#c8352e", ow * u); E(0, -16, 8, 2.4, "#f2a43a", 1); break; }
    case "ladle": p.band(R([[0, -40], [0, 20]]), "#9aa2ac", 2.6 * u, 0.9 * u, "round"); E(0, 26, 8, 6, "#9aa2ac", 1.6); break;
    case "jar": { const b = R([[-9, -26], [9, -26], [10, 6], [-10, 6]]); p.poly(b, "#f08a26", ow * u); p.poly(R([[-10, -32], [10, -32], [10, -25], [-10, -25]]), "#e8c14a", 1.4 * u); p.poly(R([[-7, -16], [7, -16], [7, -6], [-7, -6]]), "#f6ead2", 1 * u); break; }
    case "lantern":
      p.stroke(R([[0, 0], [0, 10]]), 1.4 * u);
      p.poly(R([[-8, 10], [8, 10], [8, 30], [-8, 30]]), "#ffd36a", 2 * u);
      break;
    case "crate": { const b = R([[-24, -34], [24, -34], [24, 8], [-24, 8]]); p.poly(b, "#b07a45", ow * u); for (const y of [-20, -6]) p.stroke(R([[-22, y], [22, y]]), 1.6 * u, "#6e4422"); p.stroke(R([[-22, -32], [22, 6]]), 1.6 * u, "#6e4422"); break; }
    case "sack": { const D = 36, b = R([[-6, -40 + D], [6, -40 + D], [20, -24 + D], [22, 4 + D], [0, 10 + D], [-22, 4 + D], [-20, -24 + D]]);   /* r76b (AX row 5): hung from its tied neck in the dot (the dot sat on the middle of the bag) */
      p.poly(R([[-5, -40 + D], [-7, -46 + D], [0, -50 + D], [7, -46 + D], [5, -40 + D]]), "#d8bf86", ow * u); p.poly(b, "#d8bf86", ow * u); p.band(R([[-7, -36 + D], [7, -36 + D]]), "#8a6a3a", 2.6 * u, 0.8 * u, "round"); break; }
    case "broom": p.band(R([[0, -60], [0, 140]]), "#9a6a3a", 3.2 * u, 1.1 * u, "round"); p.poly(R([[-12, 140], [12, 140], [19, 168], [-19, 168]]), "#e2c06a", ow * u); break;   /* r76f: full-size, bristles down by the feet */
    case "oar": p.band(R([[0, -40], [0, 60]]), "#a8783e", 3.2 * u, 1.1 * u, "round"); p.poly(R([[-7, 60], [7, 60], [8, 92], [0, 98], [-8, 92]]), "#c99a5a", ow * u); break;
    case "basket": { E(0, -4, 22, 12, "#c9954a", 2.2); E(0, -10, 20, 6, "#7a5426", 1.4); for (let i = -2; i <= 2; i++) E(i * 7, -12, 3, 3, i % 2 ? "#e8622c" : "#f2c230", 1); break; }
    case "iceblock": { const b = R([[-26, -46], [26, -46], [26, 4], [-26, 4]]); p.poly(b, "#bfeeff", ow * u); p.stroke(R([[-20, -38], [10, -38]]), 2.6 * u, WHITE); p.stroke(R([[-20, -38], [-20, -10]]), 2.2 * u, WHITE); break; }
    case "suitcase": { // brown leather case, brass latches, handle up (hand holds the handle)
      p.band(R([[-10, 2], [-10, -6], [10, -6], [10, 2]]), "#5a3a1e", 3 * u, 1 * u, "round");
      const b = R([[-40, 2], [40, 2], [42, 52], [-42, 52]]); p.poly(b, "#9a5a2c", ow * u);
      p.stroke(R([[-40, 14], [40, 14]]), 1.8 * u, "#6a3a18");
      for (const x of [-24, 24]) { const q = R([[x - 4, 8], [x + 4, 8], [x + 4, 18], [x - 4, 18]]); p.poly(q, "#f2c230", 1.2 * u); }
      for (const x of [-36, 36]) p.stroke(R([[x, 4], [x, 50]]), 1.6 * u, "#c8935a");
      break;
    }
    case "envelope": { const b = R([[-20, -14], [20, -14], [20, 12], [-20, 12]]); p.poly(b, "#f4ead2", 2 * u); p.stroke(R([[-20, -14], [0, 2], [20, -14]]), 1.6 * u, "#8a7a60"); E(0, 2, 4, 4, "#c8352e", 1); break; }
    case "letter": { const b = R([[-24, -44], [24, -44], [24, 20], [-24, 20]]); p.poly(b, "#fbf6e8", 2.2 * u); E(0, -32, 7, 7, "#c9a227", 1.2); for (let i = 0; i < 5; i++) p.stroke(R([[-16, -18 + i * 7], [16, -18 + i * 7]]), 1.3 * u, "#9a8f80"); E(12, 12, 5, 5, "#c8352e", 1); break; }
    case "deed": { const b = R([[-30, -40], [30, -40], [30, 20], [-30, 20]]); p.poly(b, "#f6ecd0", 2.2 * u); E(-30, -10, 5, 30, "#e8d8b0", 1.6); E(30, -10, 5, 30, "#e8d8b0", 1.6);
      p.poly(R([[-6, -30], [-14, 4], [-9, 4], [-6, -6], [-3, 4], [2, 4]]), "#6b4a2f", 0.9 * u); E(16, 8, 6, 6, "#c8352e", 1.2); break; }
    case "cash": { for (let i = 0; i < 4; i++) { const a = -0.5 + i * 0.32; const q = rotPts([[-14, -40], [14, -40], [14, 6], [-14, 6]].map(([x, y]) => [h[0] + x * u, h[1] + y * u] as P2), ang + a, h[0], h[1]); p.poly(q, i % 2 ? "#a8d58e" : "#bfe3a6", 1.6 * u); } E(0, 0, 6, 5, "#f2d2b6", 1.2); break; }
    case "brush": p.band(R([[0, -36], [0, 10]]), "#b07a45", 3 * u, 1 * u, "round"); p.poly(R([[-6, -36], [6, -36], [7, -52], [-7, -52]]), "#6b4a2f", ow * u); p.poly(R([[-6, -52], [6, -52], [4, -60], [-4, -60]]), "#8a3a22", 1.2 * u); break;
    case "tray": { E(0, -6, 30, 6, "#d9d4c8", 2); for (const x of [-14, 0, 14]) { p.poly(R([[x - 4, -10], [x + 4, -10], [x + 3, -26], [x - 3, -26]]), "#dff3ff", 1.4 * u); } break; }
    case "invite": { const b = R([[-18, -26], [18, -26], [18, 8], [-18, 8]]); p.poly(b, "#fbf3dc", 2 * u); p.stroke(R([[-14, -20], [14, -20]]), 2 * u, "#c9a227"); E(0, -6, 5, 5, "#c8352e", 1); break; }
    case "wheel": E(0, 0, 22, 22, null, 3); E(0, 0, 4, 4, "#2a2228", 1); p.stroke(R([[-20, 0], [20, 0]]), 2 * u, "#2a2228"); break;
    case "purse": E(0, 8, 10, 11, "#b88446", 2); p.band(R([[-4, -2], [4, -2]]), "#7a5426", 2 * u, 0.6 * u, "round"); break;
    // ---------------- 1904 marathon props ----------------
    case "poisonBottle": { // dark green glass, cork, paper label: skull + RAT-B-GONE
      const body = R([[-16, -48], [-16, 2], [-12, 6], [12, 6], [16, 2], [16, -48], [10, -56], [6, -60], [6, -70], [-6, -70], [-6, -60], [-10, -56]]);
      p.poly(body, "#2f5a3e", ow * u);
      p.poly(R([[-6.5, -70], [6.5, -70], [5.5, -80], [-5.5, -80]]), "#c99a62", 1.8 * u);
      p.stroke(R([[-11, -44], [-11, -2]]), 2.6 * u, "rgba(220,255,230,0.35)");
      p.poly(R([[-14, -42], [14, -42], [14, -6], [-14, -6]]), "#efe3c0", 1.4 * u);
      skull(p, R, u, 0, -31, 1);
      ptext(p, "RAT-B-GONE", R([[0, -13]])[0], 25 * u, 6 * u, ang, "#3a1f24", 800, CONDENSED);
      break;
    }
    case "poisonTin": { // squat round tin, red with a cream band: skull + RAT-B-GONE
      E(0, -2, 20, 5, "#8e2a22", ow); p.poly(R([[-20, -24], [20, -24], [20, -2], [-20, -2]]), "#b8352a", 0);
      p.stroke(R([[-20, -24], [-20, -2]]), ow * u); p.stroke(R([[20, -24], [20, -2]]), ow * u);
      p.poly(R([[-20, -19], [20, -19], [20, -7], [-20, -7]]), "#f1e4c2", 1.2 * u);
      skull(p, R, u, -13, -13, 0.62);
      ptext(p, "RAT-B-GONE", R([[4, -13]])[0], 25 * u, 6.2 * u, ang, "#3a1f24", 800, CONDENSED);
      E(0, -24, 20, 5, "#d24a3a", ow * 0.8); E(0, -24, 13, 2.6, null, 1);
      break;
    }
    case "spoon": // a teaspoon with a dark drop in the bowl
      p.band(R([[0, 8], [0, -29]]), "#c9ced6", 2.4 * u, 0.9 * u, "round");
      E(0, -36, 9.5, 7, "#d6dbe2", 2.2); E(0.5, -35.5, 5, 3.6, "#2b2a22", 0); E(-1.5, -37, 1.6, 1, "rgba(255,255,255,0.75)", 0);
      if (k > 0) E(0, -24 + 10 * k, 2.2, 3, "#2b2a22", 0);
      break;
    case "tumbler": { // short drinking glass; k = fill level of the raw-egg mix (0 = empty)
      const gl = R([[-13, -36], [13, -36], [10.5, 2], [-10.5, 2]]);
      p.poly(gl, "rgba(214,240,252,0.55)", 0);
      if (k > 0) { const y = 2 - 37 * Math.min(1, k), x = 10.5 + 2.5 * (2 - y) / 38; p.poly(R([[-x, y], [x, y], [10.5, 2], [-10.5, 2]]), "#efc94e", 0); E(0, y, x, 2.4, "#f7e08a", 0); E(3, y + 9, 4.6, 4, "#f2a52a", 1); }
      p.poly(gl, null, ow * u); E(0, -36, 13, 2.6, null, 1.4);
      p.stroke(R([[-9, -30], [-7.5, -4]]), 2.2 * u, "rgba(255,255,255,0.75)");
      break;
    }
    case "egg": E(0, -9, 8, 10.5, "#f7f0e2", 2.2); E(-2.5, -13, 2.2, 3, "#ffffff", 0); break;
    case "brandy": { // pewter hip flask with a leather band and screw cap
      const fl = R([[-14, -40], [-6, -46], [6, -46], [14, -40], [15, -6], [10, 0], [-10, 0], [-15, -6]]);
      p.poly(fl, "#bfc5ce", ow * u);
      p.poly(R([[-15, -28], [15, -28], [15, -16], [-15, -16]]), "#7a4a24", 1.4 * u);
      p.poly(R([[-4, -46], [4, -46], [4, -53], [-4, -53]]), "#8a919c", 1.6 * u);
      p.stroke(R([[-10, -38], [-10, -32]]), 2.4 * u, "rgba(255,255,255,0.8)");
      break;
    }
    case "jug": { // white earthenware water jug with a blue band, hand on the handle
      const RJ = (pts: P2[]) => R(pts.map(([x, y]) => [x - 1, y + 24] as P2));   /* r76b (AX row 5): the dot inside the handle loop (it sat under the handle) */
      const b = RJ([[8, -46], [36, -46], [40, -38], [44, -20], [42, -2], [6, -2], [4, -20], [8, -38]]);
      p.band(RJ(curve([8, -38], [-6, -24], [6, -8], 8)), "#e9e3d6", 4 * u, 1.2 * u, "round");
      p.poly(b, "#ece6da", ow * u);
      p.poly(RJ([[36, -46], [48, -52], [42, -40]]), "#ece6da", 1.8 * u);
      p.clip(b, () => p.poly(RJ([[0, -30], [50, -30], [50, -22], [0, -22]]), "#3d6fa8", 0));
      p.stroke(RJ([[13, -36], [12, -10]]), 2.4 * u, "rgba(255,255,255,0.8)");
      if (Math.abs(ang) >= 0.9) { const sp = RJ([[48, -52]])[0]; p.band([sp, [sp[0] - 2 * u, sp[1] + 40 * u], [sp[0] + 1 * u, sp[1] + 105 * u]], "#e0a238", 6.4 * u, 1.4 * u, "round");   /* r54: a longer, thicker stream (reviewers saw no pour) */ p.stroke([[sp[0] - 0.8 * u, sp[1] + 6 * u], [sp[0] - 1.6 * u, sp[1] + 40 * u]], 1.2 * u, "rgba(255,236,170,0.8)"); }   // r21: the ale stream leaves the spout (tilted for a pour)
      E(23, -22, 14, 2.6, "#8fc6e8", 1.2);
      break;
    }
    case "apple": E(0, -9, 10, 9, "#d63a2e", 2.2); E(-3.5, -13, 2.4, 2, "rgba(255,255,255,0.75)", 0); p.stroke(R([[0, -17], [1.5, -23]]), 1.8 * u, "#5a3a1a"); E(5, -22, 4, 2, "#5aa344", 1); break;
    case "rottenApple": { // brown-green, mottled, a worm poking out
      E(0, -9, 10, 9, "#8c7a38", 2.2);
      for (const [x, y, r] of [[-4, -6, 2.6], [3, -12, 2], [4, -4, 1.6]] as [number, number, number][]) E(x, y, r, r * 0.8, "#5a4620", 0);
      p.stroke(R([[0, -17], [-1, -22]]), 1.8 * u, "#4a3418");
      const wm = R(curve([5, -11], [12, -20], [18, -14], 8));
      p.stroke(wm, 5.5 * u, INK); p.stroke(wm, 3.4 * u, "#eb9aa2");
      const [we] = R([[18, -14]]); p.dot(we[0], we[1], 0.9 * u);
      break;
    }
    case "pistol": { // starter's revolver, barrel along +x; k = muzzle smoke puff
      p.poly(R([[-4, -12], [26, -12], [26, -6], [-4, -6]]), "#4a4f5c", 2 * u);
      E(4, -6, 6, 5, "#5a606c", 1.8);
      p.poly(R([[-6, -8], [2, -8], [4, 8], [-6, 8]]), "#7a4a24", 2 * u);
      p.stroke(R([[2, -2], [6, 4]]), 1.6 * u);
      p.stroke(R([[-1, -13], [0, -16]]), 2 * u);
      if (k > 0) for (const [x, y, r] of [[32, -10, 5], [38, -14, 6], [42, -6, 4.5]] as [number, number, number][]) E(x + 6 * k, y - 4 * k, r * (0.6 + 0.6 * k), r * (0.6 + 0.6 * k), "#ece8e0", 1.2);
      break;
    }
    // ---- "He Made Giant Bricks to Pay Half the Tax" (100 u = one head width ~0.53 m) ----
    case "bread": { E(0, -16, 26, 17, "#c98a3e", ow); E(-6, -22, 16, 9, "rgba(240,190,110,0.7)", 0); for (const x of [-12, 0, 12]) p.stroke(R([[x - 4, -26], [x + 4, -8]]), 2 * u, "#8a5420"); break; }
    case "mould": { // Amos's deep brick mould, empty, held by one end handle: a wooden box frame open top and bottom
      p.band(R([[-4, -2], [8, -2]]), "#7a5232", 4 * u, 1.1 * u, "round");
      p.poly(R([[8, -30], [84, -30], [84, 16], [8, 16]]), "#9a6a40", ow * u);
      p.poly(R([[14, -24], [78, -24], [78, 10], [14, 10]]), "#4a3020", 1.2 * u);
      p.stroke(R([[8, -26], [84, -26]]), 1.4 * u, "rgba(255,230,190,0.5)");
      p.band(R([[84, -2], [94, -2]]), "#7a5232", 4 * u, 1.1 * u, "round");
      break;
    }
    case "clay": E(0, -12, 18, 14, "#a8774e", ow); E(-5, -17, 8, 5, "rgba(230,180,130,0.6)", 0); break;
    case "quill": { // r10: a curved feather (vane with barbs on one side of the shaft), not a white blade
      p.poly(R([[0, 2], [3, -10], [10, -26], [12, -40], [8, -54], [2, -60], [-1, -48], [-2, -30], [-1, -12]]), "#efe6d0", 1.4 * u);
      for (let k = 0; k < 6; k++) { const y = -14 - k * 7; p.stroke(R([[0, y + 2], [7 + (k % 2) * 2, y - 3]]), 0.9 * u, "#b9ad94"); }
      p.stroke(R([[0, 6], [0, -56]]), 1.3 * u, "#8a7c62"); p.stroke(R([[0, 6], [0, 0]]), 1.8 * u, "#2a2420"); break; }
    case "yardstick": { p.poly(R([[-3, -110], [3, -110], [3, 6], [-3, 6]]), "#e8d098", 1.8 * u); for (let i = 0; i < 12; i++) p.stroke(R([[-3, -104 + i * 9], [i % 3 === 0 ? 2 : -1, -104 + i * 9]]), 1 * u, INK); break; }
    case "lawbook": { p.poly(R([[-24, -62], [24, -62], [24, 2], [-24, 2]]), "#3a2418", ow * u); p.poly(R([[-24, -62], [-18, -62], [-18, 2], [-24, 2]]), "#2a180e", 0);
      p.poly(R([[-14, -48], [20, -48], [20, -30], [-14, -30]]), "#c8a04a", 1.2 * u); ptext(p, "EXCISE", R([[3, -39]])[0], 30 * u, 8 * u, ang, "#2a1a10", 900, "Georgia, serif"); break; }
    case "brick": case "loaf": case "greenLoaf": { // a normal brick (68 x 19) or Amos's loaf (68 x 38), held from below
      const H = name === "brick" ? 17 : 38, X = 28.5,   /* r68b: with the 4u top faces 21 vs 42 = exactly 2x */   /* r68: exactly two brick heights (reviewer: the hook pair read alike) */   /* r44: brick 17 / loaf 40 (with the top faces the pair read only 1.5x) */ col = name === "greenLoaf" ? "#d39a62" : "#b05e3a", dk = name === "greenLoaf" ? "#9a6438" : "#74361f";   // r26f: the same fired clay as the 3D loaves   // r26: one clay colour for brick and loaf, lighter (the brick read near-black)
      // r26: the hand grips the block from the front (its lower edge 8u below the hand) instead of sitting under it like a wheel
      const RB = (pts: P2[]) => R(pts.map(([x, y]) => [x, y + 1] as P2));   /* r52: the dot hand overlaps the lower edge */   /* r51 (AX2 row 6): carried on the dot hand under the middle (held by one corner it read as floating) */   // r20: darker (the lit card pushed it to a glowing orange)
      // r12: a fired-clay block with volume (lit top face, darker end), sand speckle and a recessed stamp (matches the 3D loaves)
      if (name !== "greenLoaf") {
        /* r26h: the held brick or loaf is painted with the SAME fired-clay face texture as the 3D loaves (pressed A, pores,
         *  chipped edges): a lit top and a shaded end, a hair-thin edge line - the flat cel box read as another material */
        const img = brickFaceTex(name === "loaf" ? "firedA0" : "firedB0", true, name === "loaf" ? "A" : "")   /* r35: "firedB0" has the same seed and clay as "firedA0", without the A (the held brick read darker than the loaf) */.image as HTMLCanvasElement;
        const g = p.g, imgB = brickFaceTex("firedB0", true, "").image as HTMLCanvasElement;   /* r42: the top and end faces without the stamp (the A's apex showed on the top as a stray ^) */
        const face = (q: P2[], tint: string | null, im: HTMLCanvasElement = img) => { const [tl, tr, , bl] = [p.P(q[0][0], q[0][1]), p.P(q[1][0], q[1][1]), null, p.P(q[3][0], q[3][1])];   /* r39: through the pen's rotation too (a leaning body drew the faces off their outline) */ p.clip(q, () => { g.save(); { const S = im.width || 256; g.transform((tr[0] - tl[0]) / S, (tr[1] - tl[1]) / S, (bl[0] - tl[0]) / S, (bl[1] - tl[1]) / S, tl[0], tl[1]); } g.drawImage(im, 0, 0); g.restore(); if (tint) { g.fillStyle = tint; g.fillRect(-1e4, -1e4, 2e4, 2e4); } }); };
        p.poly(RB([[-X + 5, -H - 4], [X + 5, -H - 4], [X, -H], [-X, -H]]), "#c27650", 0); p.poly(RB([[X, -H], [X + 5, -H - 4], [X + 5, -4], [X, 0]]), "#7a3c24", 0);   // solid under the textures (a thin top face read see-through)
        face(RB([[-X + 5, -H - 4], [X + 5, -H - 4], [X, -H], [-X, -H]]), "rgba(255,214,180,0.22)", imgB);
        face(RB([[X, -H], [X + 5, -H - 4], [X + 5, -4], [X, 0]]), "rgba(40,14,6,0.24)", imgB);
        face(RB([[-X, -H], [X, -H], [X, 0], [-X, 0]]), "rgba(255,196,150,0.1)");   /* r52: the held loaf as bright as the 3D loaves (the 0.46 mauve tint read near-black on the cards: f_945, f_1840) */
        if (PROP_DIM > 0) for (const q of [RB([[-X + 5, -H - 4], [X + 5, -H - 4], [X, -H], [-X, -H]]), RB([[X, -H], [X + 5, -H - 4], [X + 5, -4], [X, 0]]), RB([[-X, -H], [X, -H], [X, 0], [-X, 0]])]) p.poly(q, `rgba(52,22,22,${PROP_DIM})`, 0);   // r39/r38: duller and darker, matched to the lit 3D loaves (measured 197,107,50 held vs 163,92,67 on the bench)
        p.poly(RB([[-X, 0], [-X, -H], [-X + 5, -H - 4], [X + 5, -H - 4], [X + 5, -4], [X, 0]]), null, ow * u * 0.22);
        break;
      }
      p.poly(RB([[-X, -H], [-X + 5, -H - 4], [X + 5, -H - 4], [X, -H]]), name === "greenLoaf" ? "#e4b282" : "#be7650", ow * u * 0.32);   // top face (r22: 57 wide: brick 3:1, loaf 1.5:1)
      p.poly(RB([[X, -H], [X + 5, -H - 4], [X + 5, -4], [X, 0]]), dk, ow * u * 0.32);                                                          // end face
      p.poly(RB([[-X, -H], [X, -H], [X, 0], [-X, 0]]), col, ow * u * 0.32);
      for (let i = 0; i < Math.round(70 * H / 38); i++) { const sx = -X + 2 + ((i * 37.3) % (2 * X - 4)), sy = -H + 2 + ((i * 53.7) % Math.max(1, H - 4));   /* r26b: grain density by face area (the small brick face came out darker) */ const [qx, qy] = RB([[sx, sy]])[0]; p.dot(qx, qy, 0.45 * u, i % 3 ? "rgba(40,14,8,0.28)" : "rgba(255,210,170,0.22)"); }   // r25: fine sand-struck grain
      for (let i = 0; i < 0; i++) { const sx = -31 + ((i * 37) % 62), sy = -H + 3 + ((i * 53) % Math.max(1, H - 6)); const [qx, qy] = RB([[sx, sy]])[0]; p.dot(qx, qy, (0.9 + (i % 3) * 0.45) * u, i % 2 ? "rgba(60,20,10,0.32)" : "rgba(255,214,170,0.28)"); }
      p.poly(RB([[-X + 3, -6], [X - 3, -6], [X - 3, -2], [-X + 3, -2]]), "rgba(80,24,12,0.35)", 0);
      /* r26d: worn arrises: pale chips on the front edges and corners (the clean box read as plastic) */
      for (const [cx, cy, w2, h2] of [[-X + 1, -H + 1, 6, 4], [X - 8, -H + 1, 7, 3], [-X + 1, -5, 4, 5], [X - 5, -4, 5, 4], [-6, -H + 1, 5, 2.5]] as const) p.poly(RB([[cx, cy], [cx + w2, cy], [cx + w2 * 0.4, cy + h2]]), "rgba(236,190,150,0.55)", 0);
      if ((name as string) !== "brick") { p.poly(RB([[-14, -H + 7], [14, -H + 7], [14, -7], [-14, -7]]), "rgba(70,20,10,0.32)", 0); const c = RB([[0, -H / 2]])[0]; ptext(p, "A", c, 15 * u, 15 * u, ang, dk, 900, "Georgia, serif"); }
      break;
    }
    case "ledger": { // the taxman's excise ledger: closed (k < 0.5) dark red book with a gold label, open (k >= 0.5) spread
      if (k < 0.5) { p.poly(R([[-20, -56], [20, -56], [20, 2], [-20, 2]]), "#6a2a1e", ow * u); p.poly(R([[-20, -56], [-14, -56], [-14, 2], [-20, 2]]), "#4a1a12", 0); p.poly(R([[-10, -40], [16, -40], [16, -28], [-10, -28]]), "#e8c14a", 1.2 * u); break; }
      p.poly(R([[-46, -40], [0, -36], [46, -40], [46, 2], [0, 6], [-46, 2]]), "#6a2a1e", ow * u);
      p.poly(R([[-42, -36], [-1, -32], [-1, 2], [-42, -1]]), "#e8d6ae", 1.2 * u); p.poly(R([[1, -32], [42, -36], [42, -1], [1, 2]]), "#e8d6ae", 1.2 * u);
      /* r62: an inked page - a red year heading, tally marks and pound entries, a gutter shadow (it read as a flat white card) */
      p.poly(R([[-4, -33], [-1, -32], [-1, 2], [-4, 1.5]]), "#c8b48a", 0); p.poly(R([[1, -32], [4, -33], [4, 1.5], [1, 2]]), "#c8b48a", 0);
      p.stroke(R([[-34, -30], [-14, -29]]), 2.2 * u, "#8a2a1e"); p.stroke(R([[12, -29], [32, -30]]), 2.2 * u, "#8a2a1e");
      for (let i = 0; i < 4; i++) { p.stroke(R([[-36, -22 + i * 6.5], [-6, -20 + i * 6.5]]), 1.0 * u, "#9a8c74"); if (i < 3) { for (let q = 0; q < 4; q++) p.stroke(R([[-34 + q * 2.6, -25 + i * 6.5], [-34 + q * 2.6, -20 + i * 6.5]]), 1.1 * u, "#3a2a1c"); p.stroke(R([[-35, -21 + i * 6.5], [-24, -24 + i * 6.5]]), 1.1 * u, "#3a2a1c"); p.stroke(R([[-16, -23 + i * 6.5], [-9, -23 + i * 6.5]]), 1.6 * u, "#2a2018"); }
        if (i < 2) { p.stroke(R([[8, -20 + i * 6.5], [36, -22 + i * 6.5]]), 1.0 * u, "#9a8c74"); p.stroke(R([[28, -24 + i * 6.5], [35, -24 + i * 6.5]]), 1.6 * u, "#2a2018"); } }
      break;
    }
    case "stick": { // r47: the same boxwood 3-inch rule as the insert - brass ends, 0-3 marks, a red "3 IN" stripe (the slim yellow ruler broke continuity)
      p.poly(R([[-11, -38], [11, -38], [11, 4], [-11, 4]]), "#e4c890", ow * u * 0.7);
      p.poly(R([[-11, -38], [11, -38], [11, -35], [-11, -35]]), "#c49a48", 0); p.poly(R([[-11, 1], [11, 1], [11, 4], [-11, 4]]), "#c49a48", 0);
      p.poly(R([[5, -30], [9, -30], [9, -6], [5, -6]]), "#b8201e", 0);
      for (let i = 0; i < 4; i++) p.stroke(R([[-11, 1 - i * 12], [i % 3 === 0 ? 0 : -4, 1 - i * 12]]), 1.5 * u, "#2a1a10");
      break;
    }
    case "coin": { // r35: a gold coin held up between finger and thumb (builders paying at the cart)
      /* r36: a fan of three flat coins, edge-on rims showing (one round gold disc read as another ball hand) */
      /* r51: half as big again (the coins read as 25 px gold blobs) */ for (const [dx, dy, k] of [[-13, -17, 0], [13, -17, 1], [0, -25, 2]] as const) { E(dx, dy + 4, 16, 11, "#b07a10", 1.8); E(dx, dy, 16, 11, k === 2 ? "#ffd83a" : "#f6c62a", 1.8);   /* r56: a richer gold (the day grade turned it cream: "bread rolls") */ E(dx, dy, 9.5, 6.2, "rgba(150,104,24,0.55)", 0); E(dx - 6, dy - 3.5, 4.4, 2, "#fff4c4", 0); }
      break;
    }
    case "trowel": p.band(R([[0, -2], [0, -16]]), "#8a5a34", 4 * u, 1.1 * u, "round"); p.stroke(R([[0, -16], [0, -22]]), 1.6 * u); p.poly(R([[0, -22], [-12, -30], [0, -58], [12, -30]]), "#b8c0c8", ow * u); break;
    case "tankard": case "bigTankard": { // pewter tankard (bigTankard = the drinker's own giant one), ale foam on top
      const s = name === "bigTankard" ? 2.3 : 1, w = 11 * s, h = 30 * s, ox = name === "tankard" ? -(w + 5) : 0, oy = name === "tankard" ? h * 0.52 : 0;   /* r76i (AX row 5): the hand grips through the handle (perched on one dot it read as balanced, not held) */
      const RT = (pts: P2[]) => R(pts.map(([x, y]) => [x + ox, y + oy] as P2));
      p.band(RT(curve([w - 1, -h * 0.85], [w + 11 * s, -h * 0.55], [w - 1, -h * 0.2], 8)), "#a8aab0", 3.2 * u * Math.min(s, 1.6), 1.1 * u, "round");
      p.poly(RT([[-w, -h], [w, -h], [w * 1.08, 0], [-w * 1.08, 0]]), "#b8bac0", ow * u);
      p.stroke(RT([[-w * 0.6, -h * 0.9], [-w * 0.6, -h * 0.1]]), 2.4 * u * Math.min(s, 1.6), "rgba(255,255,255,0.5)");
      E(ox, -h - 1 + oy, w * 1.05, 4 * s, "#fbf6ea", 1.6);
      break;
    }
    case "teaMug": p.band(R(curve([9, -20], [18, -14], [9, -6], 8)), "#3a6aa8", 3 * u, 1 * u, "round"); p.poly(R([[-10, -24], [10, -24], [9, 0], [-9, 0]]), "#3a6aa8", ow * u); E(0, -24, 10, 2.6, "#7a4a24", 1.2);
      for (const sx of [-1, 1]) p.stroke(R(curve([sx * 3, -30], [sx * 8, -40], [sx * 2, -52], 10)), 3 * u, "rgba(255,255,255,0.85)"); break;
    // ---- free-hens video (2026-11-17) ----
    case "hen": case "henW": case "henB": { // a live hen held under the belly, body along the forearm, head forward; k = flap/wriggle 0..1
      const [x, y] = p.P(h[0], h[1]), [x1] = p.P(h[0] + 1, h[1]), sx = x1 >= x ? 1 : -1, a = ang + (p.rot ? p.rot[0] : 0), g = p.g;
      g.save(); g.translate(x, y); g.rotate(a); g.scale(sx * 0.8 * (u / 2.36), 0.8 * (u / 2.36)); g.translate(-300, -930);
      henDraw(new Pen(g), { seed: name === "hen" ? 911 : 913, fur: name === "hen" ? "#b8562a" : name === "henW" ? "#f2efe6" : "#3a3236", coat: "#000" } as Look,
        { mode: k > 0.05 ? "air" : "carried", phase: k * 3, lift: 0, expr: k > 0.5 ? "shock" : "neutral", mouth: k > 0.3 ? "O" : undefined } as FigOpts, 0.6);
      g.restore(); break; }
    case "fork": { // a big dinner fork, tines up
      p.band(R([[0, 10], [0, -30]]), "#c9ced6", 3 * u, 1 * u, "round");
      p.poly(R([[-6, -30], [6, -30], [6, -36], [-6, -36]]), "#c9ced6", 1.2 * u);
      for (const xx of [-5, -1.7, 1.7, 5]) p.band(R([[xx, -36], [xx, -50]]), "#c9ced6", 1.6 * u, 0.6 * u, "round");
      break; }
    case "henTag": { // the red NO EATING tag on a loop of string, pinched between finger and thumb
      p.stroke(R([[0, 0], [0, 10]]), 1.4 * u, "#f2efe6");
      const b = R([[-16, 10], [16, 10], [16, 30], [-16, 30]]); p.poly(b, "#d8282a", 1.8 * u);
      ptext(p, "NO EATING", R([[0, 21]])[0], 26 * u, 9 * u, ang, "#ffffff", 900); break; }
    case "drumstick": { // a roast drumstick: bone end in the hand, the meaty end up
      p.band(R([[0, 6], [0, -10]]), "#f4ecd8", 4 * u, 1.1 * u, "round"); E(-2, 8, 3, 3, "#f4ecd8", 1); E(2, 8, 3, 3, "#f4ecd8", 1);
      E(0, -24, 11, 15, "#b8642a", 2.2); E(-3, -28, 4, 5, "rgba(255,210,150,0.6)", 0); break; }
    case "baguette": { // a long baguette held at one end, pointing up and out
      const bg = R([[-4, 8], [4, 8], [6, -78], [0, -84], [-6, -78]]); p.poly(bg, "#d8963a", 2.2 * u);
      for (let i = 0; i < 4; i++) p.stroke(R([[-3, -10 - i * 18], [3, -18 - i * 18]]), 1.6 * u, "#f2d29a"); break; }
    case "roastPan": { // an empty black roasting pan by one handle
      p.poly(R([[4, -2], [58, -2], [54, 14], [8, 14]]), "#2e2a2e", ow * u); E(31, -2, 27, 3.4, "#4a464e", 1.4);
      p.band(R([[-6, 0], [6, 0]]), "#2e2a2e", 4 * u, 1 * u, "round"); p.stroke(R([[12, 4], [48, 4]]), 1.2 * u, "rgba(255,255,255,0.35)"); break; }
    case "caddy": case "caddyFull": { // a small green kitchen caddy by its handle; full = peels and crusts heaped on top
      p.stroke(R(curve([-15, 10], [0, -10], [15, 10], 10)), 2 * u, "#3a3a40");
      const b = R([[-17, 10], [17, 10], [15, 40], [-15, 40]]); p.poly(b, "#3f8a4a", ow * u);
      if (name === "caddyFull") { E(-6, 9, 8, 4, "#f28a1e", 1); E(6, 8, 8, 4, "#c27a34", 1); E(0, 6, 5, 3, "#e8d070", 0.8); }
      p.stroke(R([[-12, 18], [12, 18]]), 1.2 * u, "rgba(255,255,255,0.35)"); break; }
    case "scrapBucket": { // a steel bucket heaped with scraps, held by the bail
      p.stroke(R(curve([-19, 16], [0, -8], [19, 16], 12)), 2 * u, "#9aa0aa");
      const b = R([[-21, 14], [21, 14], [17, 48], [-17, 48]]); p.poly(b, "#b8bec8", ow * u);
      E(-8, 12, 10, 5, "#f28a1e", 1); E(7, 11, 10, 5, "#c27a34", 1); E(0, 8, 7, 4, "#e8d070", 0.8); E(12, 9, 5, 3, "#8ac04a", 0.8); break; }
    case "pledge": { // the signed pledge sheet held up in both hands' worth by one: big title, two lines, rows of signatures
      const b = R([[-34, -78], [34, -78], [34, 6], [-34, 6]]); p.poly(b, "#fbf6e8", ow * u);
      ptext(p, "WE WON'T", R([[0, -64]])[0], 58 * u, 13 * u, ang, "#c8282a", 900);
      ptext(p, "EAT OUR HENS", R([[0, -50]])[0], 60 * u, 11 * u, ang, "#c8282a", 900);
      ptext(p, "2 YEARS", R([[0, -38]])[0], 34 * u, 9 * u, ang, "#2a3a6a", 900);
      for (let i = 0; i < 5; i++) p.stroke(R(curve([-26, -26 + i * 6.4], [-6, -29 + i * 6.4], [26, -24 + i * 6.4], 8)), 1.3 * u, "#3a4a8a");
      break; }
    case "toyTruck": { // a little green toy garbage truck held by its roof
      const b = R([[-22, 6], [10, 6], [10, 22], [-22, 22]]); p.poly(b, "#3f8a4a", ow * u);
      p.poly(R([[10, 10], [22, 10], [24, 22], [10, 22]]), "#e8e4dc", 1.6 * u); E(-14, 24, 5, 5, "#2c2a2e", 1.2); E(14, 24, 5, 5, "#2c2a2e", 1.2); break; }
    // ---- library video (2026-11-16) ----
    case "loopKey": { // the Loophole Key: a red string loop over the hand, the brass key hanging below it (swings with ang)
      u *= 1.8;
      p.stroke(R(curve([-4, 2], [-10, -16], [0, -24], 8)), 2.2 * u, "#c8282a"); p.stroke(R(curve([0, -24], [10, -16], [4, 2], 8)), 2.2 * u, "#c8282a");
      p.stroke(R([[0, 4], [0, 14]]), 2 * u, "#c8282a"); E(0, 19, 6, 6, "#e0b040", 1.6); E(0, 19, 2.4, 2.4, "#7a5a1a", 0.6);
      p.poly(R([[-1.6, 25], [1.6, 25], [1.6, 44], [-1.6, 44]]), "#e0b040", 1.3 * u); p.poly(R([[1.6, 36], [6, 36], [6, 40], [1.6, 40]]), "#e0b040", 1.1 * u); p.poly(R([[1.6, 41], [5, 41], [5, 44], [1.6, 44]]), "#e0b040", 1.1 * u);
      p.stroke(R([[-0.5, 27], [-0.5, 42]]), 0.9 * u, "rgba(255,246,200,0.8)"); break; }
    case "libBook": case "coffeeBook": { // a library hardback, cover to the lens: spine band, title bars, the due-date card in its pocket
      p.poly(R([[-18, -30], [18, -30], [18, 18], [-18, 18]]), "#2c5a8a", ow * u); p.poly(R([[-18, -30], [-12, -30], [-12, 18], [-18, 18]]), "#22476e", 1 * u);
      p.poly(R([[-8, -24], [13, -24], [13, -19], [-8, -19]]), "#f2e2b0", 0.6 * u); p.poly(R([[-5, -16], [10, -16], [10, -13], [-5, -13]]), "#f2e2b0", 0.4 * u);
      p.poly(R([[-6, -6], [12, -6], [12, 14], [-6, 14]]), "#f2ead0", 1 * u); ptext(p, "1994", R([[3, 6]])[0], 15 * u, 7 * u, ang, "#b8282a", 900);
      if (name === "coffeeBook") { E(4, -12, 11, 10, null, 0); p.stroke(R(curve([-6, -14], [4, -24], [14, -12], 10)), 2.6 * u, "rgba(110,60,24,0.85)"); p.stroke(R(curve([14, -12], [6, -1], [-6, -10], 10)), 2.6 * u, "rgba(110,60,24,0.85)"); E(-10, 10, 5, 3, "rgba(110,60,24,0.5)", 0); }
      break; }
    case "comic": { p.poly(R([[-16, -28], [16, -28], [16, 14], [-16, 14]]), "#f6d23a", ow * u); p.poly(R([[-12, -24], [12, -24], [12, -14], [-12, -14]]), "#c8282a", 0.8 * u); ptext(p, "POW!", R([[0, -18]])[0], 22 * u, 8 * u, ang, "#fff6d8", 900);
      E(-2, 0, 9, 9, "#3a6ad8", 1.2); E(-4, -3, 3, 3, "#ffffff", 0); break; }
    case "card": { p.poly(R([[-14, -9], [14, -9], [14, 9], [-14, 9]]), "#f4f0e2", 2 * u); p.poly(R([[-14, -9], [14, -9], [14, -3], [-14, -3]]), "#2f7a86", 0.6 * u); p.stroke(R([[-9, 2], [9, 2]]), 1.5 * u, "#8a8478"); p.stroke(R([[-9, 5.5], [4, 5.5]]), 1.5 * u, "#8a8478"); break; }
    case "overdue": { p.poly(R([[-22, -14], [22, -14], [22, 12], [-22, 12]]), "#f4a0b4", 2 * u); p.stroke(R([[-22, -14], [0, 0], [22, -14]]), 1.4 * u, "#9a3a52"); ptext(p, "$10.40", R([[0, 6]])[0], 26 * u, 8 * u, ang, "#7a1a2a", 900); break; }
    case "cashbox": { p.poly(R([[-22, -20], [22, -20], [22, 8], [-22, 8]]), "#6a7a8a", ow * u); p.poly(R([[-22, -20], [22, -20], [18, -27], [-18, -27]]), "#7e8e9e", 1.6 * u); p.poly(R([[-14, -14], [14, -14], [14, -4], [-14, -4]]), "#f4f0e2", 1 * u); ptext(p, "FINES", R([[0, -9]])[0], 24 * u, 8 * u, ang, "#2a2a3a", 900); E(0, 2, 2.6, 2.6, "#d8ac4a", 0.8); break; }
    case "marker": { p.poly(R([[-2.6, -26], [2.6, -26], [2.6, 6], [-2.6, 6]]), "#2a4ab0", 1.4 * u); p.poly(R([[-2.6, -26], [2.6, -26], [1.2, -32], [-1.2, -32]]), "#1a2a6a", 1 * u); p.poly(R([[-2.8, -4], [2.8, -4], [2.8, 6], [-2.8, 6]]), "#e8e8ec", 1 * u); break; }
    case "cookie": { E(0, -6, 10, 9, "#c8904a", 1.6); for (const [x, y] of [[-4, -9], [3, -3], [5, -10], [-3, -1]] as P2[]) E(x, y, 1.8, 1.6, "#5a3418", 0); break; }
    case "tape": { E(0, -8, 10, 10, "#e8dcc0", 1.8); E(0, -8, 4.5, 4.5, "#c8b890", 1); p.poly(R([[6, -2], [22, 2], [22, 6], [6, 2]]), "rgba(240,236,220,0.9)", 0.8 * u); break; }
    case "signLate": { p.poly(R([[-34, -54], [34, -54], [34, -4], [-34, -4]]), "#f4efe2", ow * u); p.poly(R([[-30, -50], [30, -50], [30, -8], [-30, -8]]), null, 2.4 * u); ptext(p, "LATE FEES", R([[0, -36]])[0], 56 * u, 16 * u, ang, "#a8282a", 900); ptext(p, "10¢ A DAY", R([[0, -18]])[0], 50 * u, 11 * u, ang, "#2a2a3a", 900); break; }
    case "stamp": // r76: the excise stamp - a turned handle with a knob above the dot, a brass die block below it
      p.band(R([[0, 2], [0, -13]]), "#6a3e20", 4 * u, 1.1 * u, "round"); E(0, -17, 6.5, 5.5, "#7a4a26", 1.4);
      p.poly(R([[-10, 2], [10, 2], [10, 9], [-10, 9]]), "#b8892e", ow * u); p.poly(R([[-11, 9], [11, 9], [11, 12.5], [-11, 12.5]]), "#3a2418", ow * u * 0.8); break;
    case "bell": { // r76: the crier's handbell - a turned wooden handle above the dot, a flared brass cup hanging below it, clapper showing
      p.band(R([[0, 2], [0, -16]]), "#7a4a26", 3.6 * u, 1.1 * u, "round"); p.dot(R([[0, -17]])[0][0], R([[0, -17]])[0][1], 3.4 * u, "#7a4a26");
      p.poly(R([[-5, 3], [5, 3], [8, 10], [11, 20], [15, 27], [-15, 27], [-11, 20], [-8, 10]]), "#d8a83a", ow * u);
      p.stroke(R([[-3, 8], [-6, 22]]), 2.2 * u, "rgba(255,240,190,0.7)"); E(0, 27, 15, 3.4, "#a8781e", 1.4); p.dot(R([[0, 30]])[0][0], R([[0, 30]])[0][1], 3 * u, "#4a3a2a"); break; }
    case "boneBasket": { E(0, -4, 22, 12, "#c9954a", 2.2); E(0, -10, 20, 6, "#7a5426", 1.4); for (let i = -3; i <= 3; i++) E(i * 5.5, -12 - (i % 2) * 2, 4.2, 2.6, i % 3 ? "#e2cc9e" : "#c8aa78", 1); for (let i = -2; i <= 2; i++) p.stroke(R([[-18 + i * 2, 4], [18 + i * 2, 4]]), 0.8 * u, "#8a6430"); break; }
    case "knife": p.band(R([[0, 8], [0, -10]]), "#6a4024", 4.2 * u, 1.1 * u, "round"); p.poly(R([[-3.2, -10], [3.2, -10], [2.2, -40], [-1.5, -44]]), "#d8dde2", ow * u); p.stroke(R([[1.2, -14], [0.6, -38]]), 1 * u, "rgba(255,255,255,0.8)"); break;
    case "tweezers": p.stroke(R([[-1.5, 6], [-3, -26]]), 1.8 * u, "#b8bcc4"); p.stroke(R([[1.5, 6], [2.4, -26]]), 1.8 * u, "#9ca0a8"); break;
    case "hammerS": p.band(R([[0, 6], [0, -26]]), "#a87a44", 2.6 * u, 1 * u, "round"); p.poly(R([[-8, -32], [8, -32], [8, -25], [-8, -25]]), "#6a6e76", ow * u); break;
    case "ladleRice": p.band(R([[0, 6], [0, -30]]), "#8a5a34", 2.6 * u, 1 * u, "round"); E(0, -36, 10, 6, "#f4f0e6", 1.4); break;
    case "hammer": p.band(R([[0, 8], [0, -40]]), "#9a6a3a", 3.4 * u, 1.1 * u, "round"); p.poly(R([[-12, -48], [12, -48], [12, -38], [-12, -38]]), "#5a5e66", ow * u); break;
    case "notice": { // the Act, rolled flat in the hand: GR + three lines
      /* r76d (AX row 5): pinched at the middle of its near edge (it balanced on the dot at its bottom edge) */
      p.poly(R([[-3, -34], [41, -34], [41, 30], [-3, 30]]), "#f2e6c8", ow * u);
      ptext(p, "ACT", R([[19, -22]])[0], 30 * u, 10 * u, ang, "#2a1a10", 900, "Georgia, serif");
      for (let i = 0; i < 4; i++) p.stroke(R([[3, -6 + i * 8], [35, -6 + i * 8]]), 2 * u, i === 3 ? "#b8322a" : "#5a4a3a");
      break;
    }
    case "clipboard": {
      p.poly(R([[-17, -50], [17, -50], [17, 2], [-17, 2]]), "#b5834a", ow * u);
      p.poly(R([[-13, -44], [13, -44], [13, -3], [-13, -3]]), "#fbf6e8", 1.2 * u);
      for (let i = 0; i < 5; i++) p.stroke(R([[-9, -34 + i * 6.5], [i % 2 ? 4 : 9, -34 + i * 6.5]]), 1.3 * u, "#8a8070");
      p.poly(R([[-7, -54], [7, -54], [7, -45], [-7, -45]]), "#c9ced6", 1.6 * u);
      break;
    }
    case "medal": { // held up by the ribbon: hand pinches the ribbon, the disc hangs below
      p.poly(R([[-5, -2], [5, -2], [6, 18], [-6, 18]]), "#c8352e", 1.4 * u);
      p.poly(R([[-1.5, -2], [1.5, -2], [1.8, 18], [-1.8, 18]]), "#f4efe6", 0);
      medalDisc(p, R([[0, 29]])[0], 12 * u, u);
      break;
    }
    case "coffeeCup": { // cup + saucer + steam; k = splash drops (shaking hands)
      E(0, -3, 18, 4, "#f4f1ea", 2);
      p.band(R(curve([10, -20], [19, -16], [9, -9], 8)), "#f4f1ea", 2.4 * u, 1 * u, "round");
      p.poly(R([[-11, -24], [11, -24], [8, -6], [-8, -6]]), "#f6f3ec", 2.2 * u);
      p.stroke(R([[-10.4, -20], [10.4, -20]]), 1.6 * u, "#3d6fa8");
      E(0, -24, 11, 2.6, "#6b3f22", 1.4);
      for (const s of [-1, 1]) { const st = R(curve([s * 4, -30], [s * 8, -40], [s * 2, -52], 10)); p.stroke(st, 3 * u, "rgba(255,255,255,0.8)"); }
      if (k > 0) for (const [x, y] of [[-16, -30], [16, -34], [-20, -18], [21, -22]] as P2[]) E(x * (0.8 + 0.3 * k), y - 4 * k, 1.8, 2.4, "#6b3f22", 0.8);
      break;
    }
    case "tonic": { // tall cobalt patent-medicine bottle: PEP-O / LIGHTNING with a bolt
      const b = R([[-13, -62], [-13, 2], [-10, 5], [10, 5], [13, 2], [13, -62], [7, -70], [5, -82], [-5, -82], [-7, -70]]);
      p.poly(b, "#2f4fa0", ow * u);
      p.poly(R([[-5.5, -82], [5.5, -82], [5, -90], [-5, -90]]), "#d8352c", 1.6 * u);
      p.stroke(R([[-9, -58], [-9, -4]]), 2.4 * u, "rgba(220,235,255,0.4)");
      p.poly(R([[-11, -56], [11, -56], [11, -8], [-11, -8]]), "#fbf1d0", 1.4 * u);
      p.poly(R([[2, -53], [-6, -38], [-1, -38], [-4, -27], [6, -42], [1, -42], [4, -53]]), "#f2c230", 1.1 * u);
      ptext(p, "PEP-O", R([[0, -21]])[0], 19 * u, 6 * u, ang, "#2a2a5a", 800, CONDENSED);
      ptext(p, "LIGHTNING", R([[0, -13]])[0], 20 * u, 5 * u, ang, "#2a2a5a", 800, CONDENSED);
      break;
    }
    case "bucket": { // wooden well bucket hanging from the hand by a rope handle
      p.stroke(R(curve([-19, 16], [0, -8], [19, 16], 12)), 2.2 * u, "#c9a46a");
      const b = R([[-21, 14], [21, 14], [17, 50], [-17, 50]]);
      p.poly(b, "#a8743e", ow * u);
      p.clip(b, () => { for (let i = -3; i <= 3; i++) p.stroke(R([[i * 6.5, 14], [i * 5.3, 50]]), 1.2 * u, "#7a4f26"); });
      for (const y of [20, 43]) p.band(R([[-21 + (y - 14) * 0.11, y], [21 - (y - 14) * 0.11, y]]), "#5a5e68", 2.6 * u, 0.8 * u);
      E(0, 14, 21, 4, "#5aa0c8", ow * 0.8);
      break;
    }
    case "megaphone": { // tin cone pointing along +x, hand on the grip under the narrow end
      p.band(R([[0, 2], [2, -8]]), "#5a3a1e", 3.4 * u, 1 * u, "round");
      const cone = R([[-8, -14], [36, -26], [36, 6], [-8, -6]]);
      p.poly(cone, "#c8352e", ow * u);
      p.stroke(R([[0, -11], [32, -21]]), 2.2 * u, "rgba(255,255,255,0.45)");
      E(36, -10, 4.5, 16, "#9c241e", ow * 0.8);
      p.poly(R([[-12, -13], [-8, -14], [-8, -6], [-12, -7]]), "#4a4f5c", 1.4 * u);
      break;
    }
    // ---- "He Made Dental Visits Longer" (2026-11-17) props ----
    case "bow": { // plague video: a hunter's longbow held at the grip, string toward the body
      p.band(R(curve([0, -92], [26, 0], [0, 92], 14)), "#8a5a34", 4.2 * u, 1.2 * u, "round");
      p.stroke(R([[0, -90], [0, 90]]), 1.3 * u, "#e8e0cc"); E(0, 0, 4, 9, "#4a3020", 1.2); break; }
    case "axe": { // plague video: a woodsman's axe, handle down from the fist, head up
      p.band(R([[0, 40], [0, -70]]), "#9a6a3e", 5 * u, 1.3 * u, "round");
      p.poly(R([[2, -78], [34, -92], [40, -66], [34, -42], [2, -54]]), "#b8c0c8", ow * u); p.stroke(R([[36, -88], [38, -46]]), 2.2 * u, "rgba(255,255,255,0.6)"); break; }
    case "staff": { // plague video: the healer's staff with a glowing orb (k = glow 0..1)
      p.band(R([[0, 60], [0, -110]]), "#c9a46a", 4.6 * u, 1.3 * u, "round");
      if (k > 0) E(0, -122, 24 + 10 * k, 24 + 10 * k, `rgba(255,236,150,${0.25 * k})`, 0);
      E(0, -122, 14, 14, k > 0 ? "#fff3b0" : "#d8e0c0", 1.6); p.band(R(curve([0, -108], [-10, -118], [-4, -134], 8)), "#c9a46a", 3 * u, 1 * u, "round"); break; }
    case "sword": { // plague video: a knight's sword held up
      p.poly(R([[-5, -10], [5, -10], [6, -118], [0, -132], [-6, -118]]), "#d6dde4", ow * u); p.stroke(R([[0, -14], [0, -120]]), 1.4 * u, "rgba(80,90,100,0.6)");
      p.band(R([[-20, -8], [20, -8]]), "#c8a03a", 5 * u, 1.2 * u); p.band(R([[0, -6], [0, 20]]), "#5a3a24", 5 * u, 1.2 * u); E(0, 24, 5, 5, "#c8a03a", 1.2); break; }
    case "petStone": { // plague video: the glowing pet stone the wolf is tucked into (k = glow)
      p.poly(R([[0, -26], [14, -10], [10, 10], [-10, 10], [-14, -10]]), "#5ad0c8", ow * u); p.poly(R([[0, -20], [7, -9], [0, 4], [-6, -8]]), "#c8fff8", 0.6 * u);
      if (k > 0) E(0, -8, 26 * (0.8 + 0.2 * k), 26 * (0.8 + 0.2 * k), `rgba(120,240,230,${0.22 * k})`, 0); break; }
    case "scrollCode": { // plague video: a long code printout; one blank line circled in red
      p.poly(R([[-60, -100], [60, -100], [60, 70], [-60, 70]]), "#f4f0e2", ow * u);
      for (let i = 0; i < 14; i++) { const y = -88 + i * 11; if (i === 8) continue; const w = 30 + ((i * 37) % 60); p.band(R([[-50 + (i % 3) * 6, y], [-50 + (i % 3) * 6 + w, y]]), i % 4 === 0 ? "#3a6aa0" : "#4a4a52", 3.4 * u, 0); }
      E(-6, -88 + 8 * 11, 44, 9, null, 0); p.stroke(R(ellPts(-6, -88 + 8 * 11, 46, 10, 0, 360)), 3 * u, "#d8352e"); break; }
    case "signBack": { // plague video: a hand-painted TURN BACK sign on a stick
      p.band(R([[0, 40], [0, -60]]), "#8a5a34", 5 * u, 1.3 * u, "round");
      p.poly(R([[-58, -120], [58, -116], [56, -58], [-56, -62]]), "#e8d4a8", ow * u);
      { const [c] = R([[0, -90]]); const g = p.g; g.save(); g.translate(c[0], c[1]); g.rotate(ang); g.fillStyle = "#c8352e"; g.font = `900 ${Math.round(24 * u)}px Arial Black, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TURN", 0, -11 * u); g.fillText("BACK!", 0, 13 * u); g.restore(); } break; }
    case "journal": { // plague video: a medical journal with a red sigil on the cover
      p.poly(R([[-44, -70], [44, -70], [44, 50], [-44, 50]]), "#2f5d9a", ow * u); p.band(R([[-44, -50], [44, -50]]), "#f4f0e2", 6 * u, 0);
      E(0, -6, 20, 20, "#c8352e", 1.6); p.stroke(R([[-10, -6], [10, -6]]), 3 * u, "#f8e0d8"); p.stroke(R([[0, -16], [0, 4]]), 3 * u, "#f8e0d8"); break; }
    case "whistle": E(0, -6, 9, 6, "#c8a03a", 1.6); p.band(R([[8, -6], [22, -6]]), "#c8a03a", 4 * u, 1 * u); break;
    case "cake": { // a pink round cake on a plate, held flat from below (k = how much is eaten, unused)
      E(0, 2, 84, 13, "#e8e2d6", 2.2); E(0, 0, 76, 10, "#f2ede2", 1.0);
      p.poly(R([[-64, -2], [64, -2], [64, -66], [-64, -66]]), "#ee9ab2", ow * u);
      p.poly(R([[-64, -30], [64, -30], [64, -20], [-64, -20]]), "#f6e8d2", 0.8 * u);
      p.stroke(R([[-56, -8], [-56, -58]]), 3 * u, "rgba(255,255,255,0.18)");
      E(0, -66, 64, 13, "#f6dfe6", ow);
      for (let i = 0; i < 9; i++) { const x = -56 + i * 14; p.poly(R([[x - 6, -62], [x + 6, -62], [x + 4, -50 - (i % 3) * 4], [x, -46 - (i % 3) * 4], [x - 4, -50 - (i % 3) * 4]]), "#f6dfe6", 0.8 * u); }
      for (const [x, y] of [[-30, -70], [0, -74], [30, -70]] as P2[]) { E(x, y - 4, 7, 7, "#d8283a", 1.6); p.stroke(R([[x, y - 10], [x + 4, y - 18]]), 1.4 * u, "#3a7a3a"); }
      break; }
    case "drill": case "mintBrush": { // a dental handpiece: handle in the fist, angled head at the top; mintBrush has a soft green polishing cup
      p.band(R([[0, 18], [0, -46]]), "#c9ced6", 9 * u, 1.6 * u, "round");
      p.band(R([[0, -46], [12, -60]]), "#c9ced6", 7 * u, 1.4 * u, "round");
      p.stroke(R([[-4.5, -14], [4.5, -14]]), 3 * u, name === "drill" ? "#2f6fd1" : "#3aa36a");
      p.stroke(R([[-3, 10], [-3, -40]]), 1.6 * u, "rgba(255,255,255,0.5)");
      if (name === "drill") { p.stroke(R([[14, -62], [22, -60]]), 2.2 * u, "#9aa0aa"); E(23, -60, 2, 2, "#e8e4dc", 0.8); }
      else { E(17, -64, 9, 7, "#5ac08a", 1.6); E(18, -66, 5, 3.4, "#bff0d6", 0.6); }
      break; }
    case "hourglass": { // a 3-minute sand timer, k = share of the sand still in the top bulb
      p.poly(R([[-24, -62], [24, -62], [24, -54], [-24, -54]]), "#a8743e", ow * u); p.poly(R([[-24, 6], [24, 6], [24, -2], [-24, -2]]), "#a8743e", ow * u);
      for (const s of [-1, 1]) p.band(R([[s * 20, -54], [s * 20, -2]]), "#8a5a34", 3 * u, 1 * u, "round");
      const top = R([[-16, -54], [16, -54], [3, -30], [-3, -30]]), bot = R([[-3, -26], [3, -26], [16, -2], [-16, -2]]);
      p.poly(top, "rgba(220,236,240,0.85)", 1.6 * u); p.poly(bot, "rgba(220,236,240,0.85)", 1.6 * u);
      const kk = Math.max(0, Math.min(1, k)), ht = 22 * kk;
      if (kk > 0.02) p.poly(R([[-3 - 13 * (ht / 22), -30 - ht], [3 + 13 * (ht / 22), -30 - ht], [3, -30], [-3, -30]]), "#e8c06a", 0.6 * u);
      const hb = 22 * (1 - kk); if (hb > 0.5) p.poly(R([[-16 + 13 * (1 - hb / 22) * 0, -2], [16, -2], [4 + 12 * (hb / 22), -2 - hb], [-4 - 12 * (hb / 22), -2 - hb]]), "#e8c06a", 0.6 * u);
      if (kk > 0.02 && kk < 0.98) p.stroke(R([[0, -30], [0, -2 - hb]]), 1.1 * u, "#e8c06a");
      break; }
    case "pasteTube": { // a mint toothpaste tube, cap down
      p.poly(R([[-12, -44], [12, -44], [9, 10], [-9, 10]]), "#e4efe8", ow * u); p.poly(R([[-13, -48], [13, -48], [13, -42], [-13, -42]]), "#cfdcd4", 1.4 * u);
      p.poly(R([[-10, -26], [10, -26], [10, -14], [-10, -14]]), "#3aa36a", 0.6 * u); p.poly(R([[-6, 10], [6, 10], [6, 20], [-6, 20]]), "#3aa36a", 1.6 * u);
      break; }
    case "eggTimer": { // a cream kitchen egg timer, red dial band on top (k = dial turn 0..1)
      E(0, -22, 24, 28, "#f2e6c8", ow); p.poly(R([[-22, -34], [22, -34], [20, -26], [-20, -26]]), "#d8352e", 1.2 * u);
      for (let i = 0; i < 8; i++) { const x = -18 + i * 5.2 + ((k * 40) % 5.2); if (x < 18) p.stroke(R([[x, -34], [x, -30]]), 0.9 * u, "#f6ecd8"); }
      E(0, -50, 4, 3, "#d8352e", 1.2); p.stroke(R([[-10, -8], [-4, -2]]), 1.6 * u, "rgba(255,255,255,0.45)");
      break; }
    case "pen": { p.band(R([[0, 20], [0, -30]]), "#2f5fb8", 5 * u, 1.2 * u, "round"); p.poly(R([[-2.5, 20], [2.5, 20], [0, 28]]), "#e8e4dc", 1 * u); p.stroke(R([[3, -28], [3, -12]]), 1.6 * u, "#c9ced6"); break; }
    case "chalk": { p.band(R([[0, 4], [0, -22]]), "#f2efe6", 6 * u, 1.2 * u, "round"); break; }
    case "instCam": { // an instant camera with a rainbow stripe and a big lens
      p.poly(R([[-34, -40], [34, -40], [34, 6], [-34, 6]]), "#2e2c34", ow * u); p.poly(R([[-34, -24], [34, -24], [34, -18], [-34, -18]]), "#d8352e", 0.4 * u);
      p.poly(R([[-34, -18], [34, -18], [34, -12], [-34, -12]]), "#f4c430", 0.4 * u); p.poly(R([[-34, -12], [34, -12], [34, -6], [-34, -6]]), "#3aa36a", 0.4 * u);
      E(0, -18, 14, 14, "#4a4a52", 2); E(0, -18, 9, 9, "#1a1a22", 1.2); E(-3, -21, 3, 3, "rgba(255,255,255,0.55)", 0);
      p.poly(R([[18, -38], [30, -38], [30, -32], [18, -32]]), "#e8e4dc", 0.8 * u);
      break; }
    case "photoA": case "photoB": { // a polaroid of Pratt: A = screaming (orange), B = blissful (mint)
      p.poly(R([[-24, -56], [24, -56], [24, 4], [-24, 4]]), "#f4efe2", ow * u);
      p.poly(R([[-19, -51], [19, -51], [19, -10], [-19, -10]]), name === "photoA" ? "#f08a4a" : "#8ad8b4", 0.8 * u);
      E(0, -30, 12, 13, "#fbf6ea", 1.4); p.stroke(R([[-12, -40], [12, -40]]), 3 * u, "#d8352e");
      if (name === "photoA") { E(-5, -33, 2.2, 3, INK, 0); E(5, -33, 2.2, 3, INK, 0); E(0, -23, 5, 6, "#3a1414", 1.2); }
      else { p.stroke(R(curve([-7, -33], [-4.5, -35], [-2, -33], 4)), 1.2 * u); p.stroke(R(curve([2, -33], [4.5, -35], [7, -33], 4)), 1.2 * u); p.stroke(R(curve([-6, -25], [0, -20], [6, -25], 6)), 1.5 * u); }
      break; }
    case "bowlBag": { // a bowling bag by its two handles
      for (const s of [-1, 1]) p.stroke(R(curve([s * 12, 6], [s * 6, -8], [s * 0, 6], 6)), 2.4 * u, "#2a2a30");
      p.poly(R([[-34, 6], [34, 6], [38, 44], [-38, 44]]), "#e8762a", ow * u); p.poly(R([[-36, 22], [36, 22], [37, 30], [-37, 30]]), "#2a2a30", 0.6 * u);
      break; }
    case "icePack": { // a blue ice pack wrapped in a checked towel, pressed to the cheek
      E(0, -8, 18, 14, "#7ab8e8", ow); p.stroke(R([[-12, -14], [12, -2]]), 1.4 * u, "rgba(255,255,255,0.55)"); E(0, 6, 14, 5, "#d8d2c4", 1.4); break; }
    case "mag": { p.poly(R([[-20, -34], [20, -34], [20, 16], [-20, 16]]), "#3aa3b8", ow * u); ptext(p, "SMILE", R([[0, -24]])[0], 34 * u, 9 * u, ang, "#fff6d8", 900); E(0, -2, 10, 8, "#f6ecd8", 1); break; }
    case "stopwatch": {
      E(0, -27, 3, 3, "#c9ced6", 1.4); p.stroke(R([[0, -30], [0, -26]]), 2 * u, INK);
      E(0, -13, 12.5, 12.5, "#c9ced6", 2.4); E(0, -13, 10, 10, "#fbf8ef", 1.2);
      for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; p.stroke(R([[Math.sin(a) * 8, -13 - Math.cos(a) * 8], [Math.sin(a) * 9.4, -13 - Math.cos(a) * 9.4]]), 0.9 * u); }
      p.stroke(R([[0, -13], [Math.sin(k * 6.283) * 7.5, -13 - Math.cos(k * 6.283) * 7.5]]), 1.4 * u, "#c8352e");
      E(0, -13, 1.4, 1.4, INK, 0);
      break;
    }
    case "mailbag": { // leather satchel carried by its strap
      p.stroke(R([[-14, 18], [0, 0], [14, 18]]), 2.6 * u, "#5a3a1e");
      const b = R([[-22, 16], [22, 16], [22, 48], [-22, 48]]);
      p.poly(b, "#8a5a2c", ow * u);
      p.poly(R([[-22, 16], [22, 16], [20, 32], [-20, 32]]), "#9c6a36", 1.6 * u);
      E(0, 31, 3.4, 3.4, "#e8c14a", 1);
      ptext(p, "CORREO", R([[0, 23]])[0], 28 * u, 5.5 * u, ang, "#f1e2c0", 800, CONDENSED);
      break;
    }
    case "parasol": case "parasol2": { // lady's lace parasol held up
      const col = name === "parasol" ? "#f2b4c4" : "#cdbbe6";
      p.band(R([[0, 8], [0, -96]]), "#6b4a2f", 2.2 * u, 0.8 * u, "round");
      const top: P2[] = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; top.push([Math.cos(a) * 48, -84 + Math.sin(a) * 30]); }
      const scal: P2[] = []; for (let i = 0; i <= 8; i++) scal.push([48 - i * 12, -84 + (i % 2 ? 6 : 0)]);
      const cp = R([...top, ...scal.slice(1)]);
      p.poly(cp, col, ow * u);
      for (const x of [-24, 0, 24]) p.stroke(R([[x * 0.4, -113], [x, -82]]), 1.2 * u, shade(col, 0.75));
      p.stroke(R(scal), 2.4 * u, "#fbf6ee");
      E(0, -116, 2.6, 2.6, "#6b4a2f", 1);
      break;
    }
    default: drawProp68(p, name, h, u, ang, k); // 1968 bridge props (props68.ts)
  }
};

/** two-bone leg/arm: knee for hip a, foot b, bone lengths l1, l2, bending toward +bend (1 = knee to the canvas-angle-minus side).
 *  Returns [knee, foot] (foot pulled in when out of reach). */
const ik = (a: P2, b: P2, l1: number, l2: number, bend: number): [P2, P2] => {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  const mx = (l1 + l2) * 0.999; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const t = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx), an = base - bend * t;
  return [[a[0] + Math.cos(an) * l1, a[1] + Math.sin(an) * l1], [a[0] + dx, a[1] + dy]];
};
const CAPS = new Set(["flatcap", "beanie", "stripecap", "mailcap", "nightcap"]);

/** a figure, front / three-quarter view, in the 600 x 1000 design space, soles at y = 975.
 *  New modes: run / stagger / carried are phase-driven like walk; lie draws the figure on its back for a card rolled
 *  +90 deg (CastPlace roll: Math.PI / 2; the ground is the card's centre line x = 300, the soles end at the mark and the
 *  head lies ~1.7 m toward screen-left; with mirror: true use roll: -Math.PI / 2 so the head goes right). */
let MASKK = 0;
export const figure = (p: Pen, o0: Look, opts: FigOpts) => {
  MASKK = Math.max(0, Math.min(1, opts.maskDrop ?? 0));
  const g0 = p.g, wrap = !!opts.turn || (opts.zoom !== undefined && opts.zoom !== 1);
  if (wrap) { g0.save(); g0.translate(300, 600); g0.rotate(rad(opts.turn ?? 0)); g0.scale(opts.zoom ?? 1, opts.zoom ?? 1); g0.translate(-300, -600); }
  if (o0.species) creature(p, o0, opts); else person(p, o0, opts);
  if (wrap) g0.restore();
};

/** r42: extra darkening of held fired bricks/loaves for brightly lit scenes (the card lift turned them bright orange) */
let PROP_DIM = 0;
const person = (p: Pen, o0: Look, opts: FigOpts) => {
  PROP_DIM = opts.propDim ?? 0;
  const BK = !!opts.back;
  const o: Look = BK ? { ...o0, vest: undefined, vestStripe: undefined, apron: undefined, chain: false, scarf: undefined, collar: undefined, lapel: undefined, glasses: false, monocle: false, shades: false, goggles: false, moustache: undefined, beard: undefined, kurta: false, sash: undefined, drape: undefined,
    bib: undefined, medal: false, chestStripe: undefined, bowtie: undefined, chops: undefined, vestCheck: undefined } : o0;
  const { expr = "neutral", look = 0, blink = 0, tilt = 0, mode = "stand", phase = 0, bob = 0,
    sweat = 0, wet = 0, hatLift = 0, hatTilt = 0, squash = 0 } = opts;
  const LIE = mode === "lie", RUN = mode === "run", STAG = mode === "stagger", CARR = mode === "carried", NEW = LIE || RUN || STAG || CARR;
  const STRIDE = mode === "stride", KNEEL = mode === "kneel", PUSH = mode === "push", HOP = mode === "hop";
  const KK = KNEEL ? clamp(opts.kneelK ?? 1, 0, 1) : 0;
  const facing0 = LIE && !opts.facing ? 1 : opts.facing ?? 0;
  const facing = mode === "walk" || RUN || STRIDE || HOP ? Math.sign(facing0) || 1 : facing0;   // locomotion stays in profile-3/4
  const light = (opts.light ?? rad(-120)) + (LIE ? Math.PI / 2 : 0);
  const shake = clamp(opts.shake ?? 0, 0, 1), shT = Math.PI * 2 * phase;
  const headTilt = (opts.headTilt ?? (LIE ? -6 : STAG ? 7 * Math.sin(Math.PI * 2 * phase - 1.1) : CARR ? 6 * Math.sin(Math.PI * 2 * phase * 0.5) : 0))
    + (NEW_TILT_OFF(mode) || opts.noAutoTilt ? 0 : autoTilt(expr, facing))
    + shake * 6 * Math.sin(2 * shT + 0.8);
  const Bd = BUILDS[o.build ?? "adult"], seed = o.seed, two = Math.PI * 2;
  const fs = Math.sign(facing) as -1 | 0 | 1; const tkA = LIE ? 0 : Math.abs(turnK(facing));   /* r76g (AX row 6): how far the whole body turns */
  const H0 = headBlob(seed, Bd.a, fs);
  const H: Blob = { ...H0, a: H0.a * (1 - 0.06 * squash), b: H0.b * (1 + 0.1 * squash) };
  const W = 2 * H0.a, HH = 2 * H0.b, u = W / 100, sole = 975;
  const tall = (1 + Bd.torso + Bd.legs) * HH;
  const walkBob = mode === "walk" ? 0.025 * tall * Math.cos(2 * two * phase) : 0;
  const LtotA = (Bd.legs + 0.12) * HH;
  const strideBob = STRIDE ? 0.5 * (opts.bobK ?? 0.05) * tall * Math.cos(2 * two * phase) : 0; // low at each heel strike
  const drop = RUN ? 0.07 * HH + 0.06 * HH * Math.sin(two * phase) ** 2 : STAG ? 0.13 * HH + 0.035 * HH * Math.sin(two * phase) ** 2
    : CARR ? -0.34 * HH + 0.02 * HH * Math.sin(two * phase)
    : KNEEL ? KK * (Bd.legs * HH - 0.5 * LtotA) : PUSH ? 0.12 * HH : HOP ? -0.3 * HH * clamp(opts.lift ?? 0.6, 0, 1.2) - 0.08 * HH
    : STRIDE ? 0.04 * HH + strideBob : 0;
  const shakeBob = shake * 0.035 * HH * Math.sin(4 * shT);
  const torsoBot = (mode === "sit" ? sole - (0.25 + (opts.sitLeg ?? 0)) * HH : sole - Bd.legs * HH * (mode === "brace" ? 1 - 0.12 * clamp(opts.braceK ?? 1, 0, 1) : 1)) + walkBob + bob * u + drop + shakeBob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  // r13: outline ~15 % thinner (reviewer: heavier than Rick's)
  const thick = thickAngle(light), ow = 4.3 * u;
  const bare = !!o.shorts || !!o.ragged;
  // v10.14 rule 7 (board AL): every character, hero included, has thin black stick arms and legs (trouser colours are ignored)
  const legCol = INK, armCol = INK, footCol = o.shoes ?? o.boots ?? INK; void bare;
  const legW = 5.6 * u, footW = 6.8 * u;
  const Ta = ((Bd.tw / 2) * W) / 1.06, Ltot = (Bd.legs + 0.12) * HH;
  // lying on the back: the whole drawing slides right so the back rests on the card's centre line (the ground)
  const lieDx = LIE ? 300 + 2 * u + 0.5 * ow - (300 + 3 * u * fs - Ta) : 0;
  if (LIE) { p.g.save(); p.g.translate(lieDx, 0); }
  p.rot = null;
  // ---- legs ----
  const dress = !!o.dress || !!o.drape;
  const legs: { hip: P2; pts: P2[] }[] = [];
  for (const side of [-1, 1]) {
    let k: P2, f: P2; const hx = 300 + side * 10 * u; let toe: P2 | null = null;
    if (NEW) {
      const th = two * (phase + (side > 0 ? 0.5 : 0)), hip: P2 = [hx, hipY];
      let tgt: P2, bend = fs || side;
      if (RUN) {
        const lift = clamp((0.35 - Math.sin(th)) / 1.35, 0, 1), R = 0.3 * HH;
        tgt = fs ? [300 + side * 5 * u + fs * R * Math.cos(th), sole - 4 * u - lift * 0.5 * HH] : [hx + side * 3 * u, sole - 4 * u - lift * 0.4 * HH];
        const pitch = 0.9 * lift * (Math.cos(th) < 0 ? 1 : 0.4); toe = fs ? [fs * Math.cos(pitch), Math.sin(pitch)] : [side, 0];
      } else if (STAG) {
        const lift = Math.max(0, -Math.sin(th));
        tgt = [hx + side * 5 * u + (fs ? fs * 0.1 * HH * Math.cos(th) : 0), sole - 4 * u - lift * 0.07 * HH];
        bend = fs || side; // wobbly bow legs when seen from the front
      } else if (CARR) {
        const lift = Math.max(0, -Math.sin(th));
        tgt = [hx + (fs ? fs * 0.2 * HH * Math.cos(th) : side * 3 * u), hipY + Ltot * 0.97 - lift * 0.24 * HH];
        const pitch = 0.5 + 0.3 * lift; toe = fs ? [fs * Math.cos(pitch), Math.sin(pitch)] : [side * 0.6, 0.8];
      } else { // LIE
        const up = clamp(opts.legsUp ?? 0.35, 0, 1), be = rad(up * 92 + side * 7 + 5 * Math.sin(two * phase + side)), reach = 0.86 * Ltot;
        const gx = 300 + 3 * u * fs - Ta; // the ground line before the slide
        tgt = [gx + 9 * u + Math.sin(be) * reach, hipY + Math.cos(be) * reach]; bend = 1;
        toe = [Math.cos(be), -Math.sin(be)];
      }
      [k, f] = ik(hip, tgt, Ltot / 2, Ltot / 2, bend);
    }
    else if (mode === "sit") {
      k = [300 + side * 32 * u, hipY + 0.18 * HH]; f = [300 + side * 40 * u, sole - 6 * u];
      const fu = clamp(opts.feetUp ?? 0, 0, 1);
      if (fu > 0) { const d = fs || 1; // legs stretched out level toward the facing side (feet up on a desk)
        const k2: P2 = [300 + d * 0.36 * Ltot + side * 4 * u, hipY - 0.03 * HH + side * 3 * u], f2: P2 = [300 + d * 0.72 * Ltot + side * 6 * u, hipY - 0.1 * HH + side * 5 * u];
        k = lerp2(k, k2, fu); f = lerp2(f, f2, fu); toe = [lerp2([d, 0], [0.25 * d, -1], fu)[0], lerp2([d, 0], [0.25 * d, -1], fu)[1]]; }
    }
    else if (STRIDE || KNEEL || PUSH || HOP) {
      const d = fs || 1, hip: P2 = [hx, hipY];
      if (STRIDE) { // planted feet: the stance foot slides back at a constant rate, the swing foot arcs forward
        const S = opts.stride ?? 0.55 * HH, ph = ((phase + (side > 0 ? 0.5 : 0)) % 1 + 1) % 1;
        const st = ph < 0.5, t = st ? ph / 0.5 : (ph - 0.5) / 0.5;
        const x = st ? S / 2 - S * t : -S / 2 + S * (0.5 - 0.5 * Math.cos(Math.PI * t)), up = st ? 0 : Math.sin(Math.PI * t) * 0.2 * HH;
        f = fs ? [300 + side * 4 * u + d * x, sole - 4 * u - up] : [300 + side * 20 * u, sole - 4 * u - up * 0.7];
        [k, f] = ik(hip, f, Ltot / 2, Ltot / 2, fs ? d : side);
        toe = fs ? [d * Math.cos(st ? 0 : 0.35 * Math.sin(Math.PI * t)), -Math.sin(st ? 0 : 0.35 * Math.sin(Math.PI * t))] : null;
      } else if (KNEEL) { // one knee on the ground, the other foot planted in front
        const front = fs ? side === d : side > 0;
        if (front) { k = fs ? [hx + d * 0.46 * Ltot, hipY + 0.02 * HH] : [hx + 4 * u, hipY + 0.3 * HH]; f = fs ? [k[0] + d * 2 * u, sole - 4 * u] : [hx + 8 * u, sole - 4 * u]; }
        else { k = fs ? [hx - d * 0.04 * Ltot, sole - 6 * u] : [hx - 4 * u, sole - 5 * u]; f = fs ? [k[0] - d * 0.44 * Ltot, sole - 7 * u] : [hx - 8 * u, sole - 0.14 * HH]; toe = fs ? [-d * 0.3, 0.95] : [side, 0]; }
        if (KK < 1) { const f0: P2 = [300 + side * 22 * u, sole - 4 * u], k0: P2 = [(hx + f0[0]) / 2 + side * 1.5 * u, (hipY + f0[1]) / 2]; k = lerp2(k0, k, KK); f = lerp2(f0, f, KK); if (KK < 0.5) toe = null; }
      } else if (PUSH) { // lunge: front knee bent under the push, back leg straight behind
        const front = side === d;
        f = front ? [300 + d * 0.5 * HH, sole - 4 * u] : [300 - d * 0.85 * HH, sole - 4 * u];
        [k, f] = ik(hip, f, Ltot / 2, Ltot / 2, front ? d : -d * 0.2);
        toe = front ? [d, 0] : [d * 0.8, 0.3];
      } else { // HOP: knees pulled up, feet tucked (jump back with wet shoes)
        f = [300 + side * 26 * u - d * (fs ? 10 * u : 0), hipY + 0.62 * Ltot]; k = [300 + side * 40 * u + (fs ? d * 8 * u : 0), hipY + 0.34 * Ltot];
        toe = [side * 0.7, 0.7];
      }
    }
    else if (mode === "brace") { const bk = clamp(opts.braceK ?? 1, 0, 1); f = [300 + side * (22 + 24 * bk) * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * (1.5 + 8.5 * bk) * u, (hipY + f[1]) / 2]; }
    else if (mode === "air") { f = [300 + side * 40 * u, hipY + 0.9 * HH]; k = [300 + side * 46 * u, hipY + 0.45 * HH]; }
    else if (mode === "kick") { const ph = phase * two + (side > 0 ? 2 : 0); f = [300 + side * 34 * u + Math.sin(ph) * 20 * u, hipY + 1.0 * HH - Math.abs(Math.cos(ph)) * 30 * u]; k = [300 + side * 44 * u, hipY + 0.5 * HH]; }
    else if (mode === "walk") {
      const up = Math.max(0, Math.sin(two * (phase + (side > 0 ? 0.5 : 0)))) * 0.28 * HH;
      f = [300 + side * 13 * u + Math.sin(two * (phase + (side > 0 ? 0.5 : 0))) * 8 * u * fs, sole - 4 * u - up];
      // v13 (AV2 fix): the knee bends FORWARD, toward the facing side (a leg never kinks backwards); front-on it bows outward
      const kd = Math.sign(fs) * Math.min(1, Math.abs(fs) * 1.6) + side * Math.max(0, 1 - Math.abs(fs) * 1.6);
      k = [(hx + f[0]) / 2 + kd * (1.5 * u + up * 0.45), (hipY + f[1]) / 2 - up * 0.08];
    } else { f = [300 + side * 13 * u * (1 - 0.3 * tkA) + fs * tkA * (side === fs ? 9 : -3) * u, sole - 4 * u + (fs && tkA > 0.2 ? (side === fs ? 4 : -3) * u * tkA : 0)];   /* r76i (AX views): the near foot steps forward, the far one back */ k = [(hx + f[0]) / 2 + side * 1.2 * u, (hipY + f[1]) / 2];
      /* r76i (both reviewers): weight on one leg - the free leg's knee bends and its foot eases in onto the toe (every figure stood locked, legs parallel) */
      const WT = opts.weight ?? ((((seed * 7) % 5) - 2) / 2) * 0.7, free = side === -Math.sign(WT || 1);
      if (Math.abs(WT) > 0.05) { const a = Math.abs(WT); if (free) { f = [f[0] - side * 3 * u * a, f[1] - 3 * u * a]; k = [k[0] + side * 5 * u * a + fs * 3 * u * a, k[1] - 2 * u * a]; } else f = [f[0] + side * 1.5 * u * a, f[1]]; } }   /* r76g: in a turn the stance narrows and the near foot steps toward the facing side */
    let lp: P2[] = [];
    if (dress && !o.mini && mode !== "sit" && !NEW && !STRIDE && !KNEEL && !PUSH && !HOP) { f = [300 + side * 12 * u, sole - 4 * u]; lp = [[f[0], torsoBot + 0.08 * HH], [f[0], (torsoBot + 0.08 * HH + f[1]) / 2], f];   /* r76g (AX row 4): the legs run from the hem (stubs from 0.4 HH read as a potato) */ p.stroke(lp, legW, o.capri || o.tallBoots ? INK : legCol); lp = []; }
    else { lp = curve([hx, hipY], k, f); p.stroke(lp, legW, o.capri || (o.tallBoots && !o.legs) ? INK : legCol); }
    if (o.socks && lp.length) p.band(lp.slice(6), o.socks, legW, 1.2 * u, "round");
    if (o.capri && lp.length) p.band(lp.slice(0, 7), o.capri, legW * 1.6, 1.1 * u, "round");
    if (o.tallBoots) { const lb = lp.length ? lp.slice(6) : [[f[0], sole - 0.3 * HH], f] as P2[]; p.band(lb, o.tallBoots, legW * 1.5, 1.2 * u, "round"); }
    legs.push({ hip: [hx, hipY], pts: lp });
    const dir = fs || side;
    if (toe) footStroke(p, [f[0] - toe[0] * 2 * u, f[1] - toe[1] * 2 * u], [f[0] + toe[0] * 9 * u, f[1] + toe[1] * 9 * u], footW, footCol);
    else footStroke(p, [f[0] - dir * 2 * u, f[1]], [f[0] + dir * (fs ? 9 : 6.5) * u, f[1] + 0.5 * u], footW, footCol);
  }
  // ---- 1937 Java sarong: a checked cloth tube from the hips to mid-shin that follows both legs ----
  if (o.sarong && legs.length === 2 && legs.every((l) => l.pts.length > 4)) {
    const at = (l: { pts: P2[] }, t: number) => l.pts[Math.min(l.pts.length - 1, Math.round(t * (l.pts.length - 1)))];
    const L0 = legs[0].hip[0] < legs[1].hip[0] ? legs[0] : legs[1], R0 = L0 === legs[0] ? legs[1] : legs[0];
    const a = at(L0, 0.62), b2 = at(R0, 0.62);
    const sh: P2[] = [[L0.hip[0] - 11 * u, hipY - 0.1 * HH], [R0.hip[0] + 11 * u, hipY - 0.1 * HH], [R0.hip[0] + 12 * u, hipY + 0.12 * HH], [b2[0] + 8 * u, b2[1]], [(a[0] + b2[0]) / 2, Math.max(a[1], b2[1]) + 2 * u], [a[0] - 8 * u, a[1]], [L0.hip[0] - 12 * u, hipY + 0.12 * HH]];
    p.poly(sh, o.sarong, 1.6 * u);
    p.clip(sh, () => { const dk = shade(o.sarong!, 0.7), lt = shade(o.sarong!, 1.25);
      for (let i = -6; i <= 6; i++) { p.band([[300 + i * 7 * u, hipY - 0.2 * HH], [300 + i * 7 * u + 4 * u, hipY + 0.9 * HH]], i % 2 ? dk : lt, 1.4 * u, 0); }
      for (let j = 0; j < 8; j++) p.band([[200, hipY - 0.06 * HH + j * 0.08 * HH], [400, hipY - 0.06 * HH + j * 0.08 * HH]], j % 2 ? dk : lt, 1.2 * u, 0);
      p.band([[200, hipY - 0.04 * HH], [400, hipY - 0.04 * HH]], shade(o.sarong!, 0.55), 0.05 * HH, 0); });
  }
  // ---- shorts (running shorts, or trousers cut ragged): one piece per thigh + the seat, outlined as one shape ----
  if (bare && legs.every((l) => l.pts.length)) {
    const sc = o.shorts ?? o.legs ?? mix(o.coat, INK, 0.6);
    const pieces: P2[][] = [];
    for (const [i, l] of legs.entries()) {
      const side = i ? 1 : -1, a = l.hip, m = l.pts[o.ragged ? 4 : 3], dx = m[0] - a[0], dy = m[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const wt = 10 * u, wh = 8.6 * u, a0: P2 = [a[0] - (dx / L) * 6 * u, a[1] - (dy / L) * 6 * u];
      const hem: P2[] = [];
      const n = o.ragged ? 5 : 1;
      for (let j = 0; j <= n; j++) { const t = j / n, s = -1 + 2 * t, z = o.ragged && j % 2 ? 3.4 * u : 0; hem.push([m[0] + nx * wh * s + (dx / L) * z, m[1] + ny * wh * s + (dy / L) * z]); }
      pieces.push([[a0[0] - nx * wt, a0[1] - ny * wt], ...hem, [a0[0] + nx * wt, a0[1] + ny * wt]]);
      void side;
    }
    const seat: P2[] = [[legs[0].hip[0] - 9 * u, hipY - 0.08 * HH], [legs[1].hip[0] + 9 * u, hipY - 0.08 * HH], [legs[1].hip[0] + 4 * u, hipY + 0.1 * HH], [300, hipY + 0.14 * HH], [legs[0].hip[0] - 4 * u, hipY + 0.1 * HH]];
    pieces.push(seat);
    for (const pc of pieces) p.poly(pc, sc, ow * 1.3);
    for (const pc of pieces) p.poly(pc, sc, 0);
    for (const [i, l] of legs.entries()) { // a fold line on each leg + a stitched hem on proper shorts
      const m = l.pts[3], a = l.hip;
      p.stroke([[a[0] + (m[0] - a[0]) * 0.35 + (i ? -1 : 1) * 3 * u, a[1] + (m[1] - a[1]) * 0.35], [a[0] + (m[0] - a[0]) * 0.8 + (i ? -1 : 1) * 4 * u, a[1] + (m[1] - a[1]) * 0.8]], 1.3 * u, shade(sc, 0.72));
      if (o.ragged) { const q = l.pts[4]; p.stroke([[q[0] - 2 * u, q[1]], [q[0] - 3 * u, q[1] + 5 * u]], 1.2 * u); p.stroke([[q[0] + 4 * u, q[1] + u], [q[0] + 5 * u, q[1] + 5 * u]], 1.2 * u); }
    }
  }
  // ---- upper body rotates about the hips ----
  const lean = RUN ? fs * 13 + 1.5 * Math.sin(2 * two * phase) : STAG ? fs * 5 + 7 * Math.sin(two * phase) + 2.5 * Math.sin(3 * two * phase + 1) : CARR ? fs * 4 + 3 * Math.sin(two * phase) : 0;
  const lean2 = PUSH ? (fs || 1) * 17 : KNEEL ? (fs || 0) * 4 * KK : HOP ? -(fs || 0) * 6 : STRIDE ? (fs || 0) * 3 : 0;
  const sway = mode === "walk" || STRIDE ? 1.4 * Math.sin(two * phase) : 0, A = tilt + sway + lean + lean2 + shake * 4.5 * Math.sin(2 * shT);
  p.rot = A ? [rad(A), 300, hipY] : null;
  const LD = dress && mode !== "sit" && !KNEEL && !STRIDE && !PUSH && !HOP && !LIE, hem = LD ? torsoBot + 0.42 * HH : torsoBot;   /* r76i (reviewer, AX row 4): women in slim A-line dresses to mid-shin (the male bean stopped at the hip) */
  const T: Blob = { a: Ta * (LD ? 0.8 : 1) * (1 - 0.2 * tkA),   /* r76i (AX views): a clearer 3/4 - the torso 0.8 wide in the turn */ b: 0.5 * (hem - (chin - 0.25 * HH)),   /* r76g: the torso narrows as it turns */ nTop: 2.2, nBot: dress ? 1.9 : 2.6, egg: dress ? 0.42 : o.build === "stout" ? 0.17 : 0.12,   /* r76h (AX row 4): dresses flare to an A-line hem (the plain egg read as a potato) */
    asym: 0.04 * fs, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * fs, tcy = hem - T.b, tp0 = blobPts(tcx, tcy, T);
  /* r76i (AX row 4, reviewer B): the long dress is a real A-line - narrower shoulders, a waist, then a skirt that flares out to a flat hem at mid-shin (the egg read as the men's bean) */
  /* r76i (AX row 4, reviewer B): the standing long dress is a real A-line built from half-widths - a rounded bodice, a
   * waist, then a skirt flaring to a wide, nearly flat hem at mid-shin (the egg read as the men's bean); in a 3/4 turn the
   * near side is wider and the far side tucks in */
  const hemPts: P2[] = [];
  const alinePts = (): P2[] => {
    const top = hem - 2 * T.b, yS = chin + 0.05 * HH, wstY = chin + 0.42 * HH, wB = 0.72 * Ta, wW = 0.6 * Ta, hW = 1.12 * Ta, N = 40;
    const hw = (y: number) => y < yS ? wB * Math.pow(Math.max(0, 1 - Math.pow((yS - y) / (yS - top), 2.2)), 1 / 2.2) : y < wstY ? wB - (wB - wW) * Math.pow((y - yS) / (wstY - yS), 1.4) : wW + (hW - wW) * Math.pow((y - wstY) / (hem - wstY), 0.95);
    const kN = 1 + 0.12 * tkA, kF = 1 - 0.22 * tkA, kR = fs > 0 ? kN : fs < 0 ? kF : 1, kL = fs < 0 ? kN : fs > 0 ? kF : 1;
    const R: P2[] = [], L: P2[] = [];
    for (let i = 0; i <= N; i++) { const y = top + (hem - 3 * u - top) * i / N, w = hw(y); R.push([tcx + w * kR, y]); L.push([tcx - w * kL, y]); }
    const H: P2[] = []; for (let i = 1; i < 12; i++) { const s2 = 1 - 2 * i / 12; H.push([tcx + (s2 > 0 ? s2 * hW * kR : s2 * hW * kL), hem + 2 * u * (1 - s2 * s2)]); }
    for (const q of H) hemPts.push([q[0] + (tcx - q[0]) * 0.03, q[1] - 6 * u]);
    return [...R, ...H, ...L.reverse()];
  };
  const tp = LD ? alinePts() : tp0;
  /* r76 (AX row views): the costume (buttons, apron, tie, collar) slides toward the facing side, so a 3/4 body turns with the head (it stayed front-on) */ const tsh = 0.34 * T.a * turnK(facing);
  const sh = (side: number): P2 => [tcx + 0.5 * tsh + side * 0.85 * T.a * (fs && side !== fs ? 1 - 0.38 * tkA : 1), chin + 0.12 * HH];   /* r76g: the far shoulder tucks in behind the turned torso */
  const La = 0.46 * HH / u, Lf = 0.42 * HH / u, sx0 = 0.27 * T.a / u;
  const hangArm = (side: number): Arm => {
    if (RUN) { // pumping bent arms, opposite to the legs
      const ta = two * (phase + (side > 0 ? 0 : 0.5)), al = 0.75 * Math.cos(ta);
      if (fs) { const e: P2 = [fs * La * Math.sin(al) + side * 2, La * Math.cos(al)], be = al + 1.75; return [e, [e[0] + fs * Lf * Math.sin(be), e[1] + Lf * Math.cos(be)]]; }
      const e: P2 = [side * (sx0 + 9), La * 0.8]; return [e, [side * (sx0 + 3), La * 0.8 - Lf * (0.55 + 0.35 * Math.cos(ta))]];
    }
    if (STAG) { const lag = Math.sin(two * phase - 0.8); return [[side * (sx0 + 5) + fs * 4 + lag * 3, 0.5 * HH / u], [side * (sx0 + 6) + fs * 10 + lag * 8, 1.12 * HH / u]]; }
    if (CARR) return [[side * 0.4 * HH / u, 0.05 * HH / u], [side * 0.5 * HH / u + 2 * Math.sin(two * phase + side), 0.46 * HH / u]];
    if (LIE) return side < 0 ? [[-4, -34], [-6, -72]] : [[16, 32], [2, 58]];
    if (HOP) return [[side * (sx0 + 20), -0.1 * HH / u], [side * (sx0 + 30), -0.52 * HH / u]]; // arms fly up
    if (PUSH) { const d = fs || 1; return [[d * 0.36 * HH / u + side * 3, 0.16 * HH / u], [d * 0.78 * HH / u + side * 2, 0.14 * HH / u]]; }
    if (STRIDE && fs) { const sw2 = Math.sin(two * phase) * side; return [[fs * 6 * sw2 + side * 3, 0.48 * HH / u], [fs * 16 * sw2 + side * 4, 1.0 * HH / u - Math.abs(sw2) * 6]]; }
    const sw = mode === "walk" || STRIDE ? Math.sin(two * phase) * side : 0;
    const dX = o.dress ? (fs !== 0 && side !== fs && tkA > 0.3 ? -4 : 15) : 0;   /* r76i: the far arm of a turned dress hangs behind her, only the hand edge showing */   /* r72 (AX row 4): further out - at 9 the hanging arms still ran along the dress outline */   /* r61 (AX row 4): arms clear of a dress's flare (they hugged its outline and vanished) */
    return [[side * (0.27 * T.a / u + 5 + dX * 0.6), 0.38 * HH / u], [side * (0.27 * T.a / u + 6 + dX) - side * 6 * sw, 0.74 * HH / u - Math.abs(sw) * 7]];
  };
  const armL = opts.armL ?? hangArm(-1), armR = opts.armR ?? hangArm(1);
  const farTuck = (side: number) => fs !== 0 && side !== fs && tkA > 0.3;   /* r76i (AX views): in a 3/4 turn the far hanging arm goes behind the dress, so the turn reads */
  const armRFront = opts.armRFront ?? ((LIE && !opts.armR) || (!!o.dress && !opts.armR && !farTuck(1)));   /* r61 (AX row 4/6): a dress hid both hanging arms; they hang in front of it */
  const armLFront = opts.armLFront ?? (!!o.dress && !opts.armL && !farTuck(-1));
  const toAbs = (side: number, a: Arm): [P2, P2, P2] => { const S = sh(side); return [S, [S[0] + a[0][0] * u, S[1] + a[0][1] * u], [S[0] + a[1][0] * u, S[1] + a[1][1] * u]]; };
  const AL = toAbs(-1, armL), AR = toAbs(1, armR);
  if (opts.carry2 && (opts.propR === "loaf" || opts.propR === "brick")) { const mx = (AL[2][0] + AR[2][0]) / 2, my = (AL[2][1] + AR[2][1]) / 2; AL[2] = [mx - 25 * u, my]; AR[2] = [mx + 25 * u, my]; }   /* r76i (AX row 5): a two-hand carry puts the dots exactly under the block's bottom corners, the arms running into them */
  const drawArm = (a: [P2, P2, P2], prop?: string, ang = 0, side = 1) => {
    const ap = curve(a[0], a[1], a[2]);
    const limb = () => { p.stroke(ap, 5.2 * u, armCol);
      if (o.rolled) { p.stroke(ap.slice(5), 5.2 * u, INK); p.band(ap.slice(4, 6), mix(o.coat, "#ffffff", 0.2), 6.8 * u, 1.1 * u, "butt"); }
      if (o.shortSleeve) { p.stroke(ap.slice(3), 5.2 * u, INK); p.band(ap.slice(0, 4), o.coat, 9 * u, 1.2 * u, "round"); p.band(ap.slice(3, 5), shade(o.coat, 0.92), 9.4 * u, 1.2 * u, "butt"); } };
    limb();
    if (o.watch && side < 0) { const q = ap[ap.length - 3], r = ap[ap.length - 2], dx = r[0] - q[0], dy = r[1] - q[1], l = Math.hypot(dx, dy) || 1;
      p.band([[q[0] - (dy / l) * 4 * u, q[1] + (dx / l) * 4 * u], [q[0] + (dy / l) * 4 * u, q[1] - (dx / l) * 4 * u]], "#5a3a22", 3.4 * u, 0.9 * u, "butt");
      p.ell(q[0], q[1], 3.6 * u, 3.6 * u, "#e8c14a", 1.2 * u); p.ell(q[0], q[1], 2.2 * u, 2.2 * u, "#fbf8ef", 0); }
    /* r26f: a brick or loaf is held by its inner end (the arm reaches it, the hand wraps the end) instead of a dot mid-face */
    const blk = prop === "brick" || prop === "loaf" || prop === "greenLoaf", dir = Math.sign(a[2][0] - a[0][0]) || side;
    const gH = prop === "brick" ? 17 : 38, grip = blk && !!opts.gripEnd;
    if (prop) drawProp(p, prop, grip ? [a[2][0] + dir * 11 * u, a[2][1] + 1.5 * u] as P2 : blk ? [a[2][0] + dir * 2 * u * Math.cos(ang), a[2][1] + dir * 2 * u * Math.sin(ang)] as P2 : a[2], u, grip ? 0 : ang, opts.propK ?? 0);
    if ((blk || BOOKS.has(prop ?? "")) && !grip) limb();   /* r70: an end grip carries the block on the dot hand under its NEAR end (the dot overlaps its lower edge) - the whole arm shows and the block runs on outward; r69 (behind the block the arm vanished; across its face it read as a skewer) */   /* r52 (AX2 row 6): the whole arm in front of the brick, the dot hand on its lower edge (the brick hid the arm and floated above the hand) */
    if (o.gloves) { const q = ap[ap.length - 3]; p.band([q, a[2]], shade(o.gloves, 0.9), 8 * u, 1.2 * u, "round"); p.ell(a[2][0], a[2][1], 7 * u, 6.5 * u, o.gloves, 1.4 * u); p.stroke([[a[2][0] - 3 * u, a[2][1] - 1 * u], [a[2][0] + 2 * u, a[2][1] + 3 * u]], 1.1 * u, shade(o.gloves, 0.7)); }
    else p.dot(a[2][0], a[2][1], 4.8 * u);
  };
  // cape behind
  if (o.cape) {
    const cp: P2[] = [[tcx - 0.8 * T.a, chin + 0.05 * HH], [tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 0.8 * T.a, chin + 0.05 * HH]];
    p.gradFill(cp, o.cape, mul(o.cape, SH_CLOTH), light); p.inkRing(cp, ow * 0.8, thick, 0.3);
    p.poly([[tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.45 * T.a, sole - 0.09 * HH], [tcx - 1.45 * T.a, sole - 0.09 * HH]], "#f7f3ea", 1.6 * u);
    for (let i = 0; i < 7; i++) p.dot(tcx - 1.2 * T.a + i * 0.4 * T.a, sole - 0.135 * HH, 1.6 * u);
  }
  if (!armLFront && !opts.armLTop) drawArm(AL, opts.propL, opts.propLAng, -1);
  if (!armRFront && !opts.armRTop) drawArm(AR, opts.propR, opts.propRAng, 1);
  // ---- torso / dress ----
  const body = o.mini && !NEW ? (() => { // A-line mini dress: ends just below the hips, legs show
    const bot = torsoBot + 0.2 * HH, D: Blob = { a: Ta * 1.08, b: 0.5 * (bot - (chin - 0.22 * HH)), nTop: 2.0, nBot: 3.2, egg: 0.3, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(tcx, bot - D.b, D);
  })() : LD && !o.drape ? tp   /* r76i: the standing long dress is the A-line tp (the slim r76h egg below never flared) */
  : dress && !NEW && !STRIDE && !KNEEL && !PUSH && !HOP ? (() => {
    const D: Blob = { a: 0.5 * W * 0.9, b: 0.5 * ((sole - 0.8 * HH) - (chin - 0.2 * HH)), nTop: 2.2, nBot: 2.6, egg: 0.2, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };   /* r76h (AX row 4): a slim knee-length dress, the legs a full head long below it (a bell to the ankles read as a potato) */
    return blobPts(300, sole - 0.8 * HH - D.b, D);
  })() : dress && !NEW ? (() => { // seated / kneeling / striding dress: skirt to the knees
    const bot = torsoBot + 0.16 * HH, D: Blob = { a: Ta * 0.92,   /* r76e (AX row 4): a shorter, slimmer dress so the stick legs show (the bell read as a potato) */ b: 0.5 * (bot - (chin - 0.22 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.3, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(tcx, bot - D.b, D);
  })() : tp;
  const base = o.singlet ?? o.dress ?? o.coat;
  p.gradFill(body, base, mul(base, SH_CLOTH), light);
  if (LD && body === tp && hemPts.length > 2) p.stroke(hemPts, 2.6 * u, shade(base, 0.68));   /* r76i: a hem band so the skirt reads as cloth */
  p.clip(body, () => {
    const ax = tcx + 2 * u * fs + tsh, top = chin - 0.1 * HH, bot = torsoBot;
    if (o.stripes) for (let i = 0; i < 12; i++) p.poly([[tcx - 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH + 0.05 * HH], [tcx - 2 * T.a, top + i * 0.11 * HH + 0.05 * HH]], o.stripes, 0);
    if (o.vstripes) for (let i = -8; i <= 8; i++) { const x = ax + i * 0.24 * T.a; p.poly([[x, top - HH], [x + 0.09 * T.a, top - HH], [x + 0.09 * T.a, bot + HH], [x, bot + HH]], o.vstripes, 0); }
    if (o.plaid) { p.g.save();   /* r48: a soft tartan - wide pale bands with one fine line each (fine even bars read as graph paper) */
      for (let i = -5; i <= 5; i++) { const x = ax + i * 0.52 * T.a; p.g.globalAlpha = 0.22; p.poly([[x, top - HH], [x + 0.2 * T.a, top - HH], [x + 0.2 * T.a, bot + HH], [x, bot + HH]], o.plaid, 0); p.g.globalAlpha = 0.55; p.poly([[x + 0.34 * T.a, top - HH], [x + 0.36 * T.a, top - HH], [x + 0.36 * T.a, bot + HH], [x + 0.34 * T.a, bot + HH]], o.plaid, 0); }
      for (let i = 0; i < 7; i++) { const y = top + i * 0.22 * HH; p.g.globalAlpha = 0.22; p.poly([[tcx - 2 * T.a, y], [tcx + 2 * T.a, y], [tcx + 2 * T.a, y + 0.085 * HH], [tcx - 2 * T.a, y + 0.085 * HH]], o.plaid, 0); p.g.globalAlpha = 0.55; p.poly([[tcx - 2 * T.a, y + 0.145 * HH], [tcx + 2 * T.a, y + 0.145 * HH], [tcx + 2 * T.a, y + 0.155 * HH], [tcx - 2 * T.a, y + 0.155 * HH]], o.plaid, 0); } p.g.restore(); }
    if (o.chestStripe) p.poly([[tcx - 2 * T.a, chin + 0.2 * HH], [tcx + 2 * T.a, chin + 0.2 * HH], [tcx + 2 * T.a, chin + 0.31 * HH], [tcx - 2 * T.a, chin + 0.31 * HH]], o.chestStripe, 1.4 * u);
    if (o.vest) { // waistcoat panel + buttons + lapels of the open coat
      const vp: P2[] = [[ax - 0.38 * T.a, top], [ax + 0.38 * T.a, top], [ax + 0.3 * T.a, bot - 0.12 * HH], [ax, bot - 0.02 * HH], [ax - 0.3 * T.a, bot - 0.12 * HH]];
      p.poly(vp, o.vest, 1.6 * u);
      if (o.vestStripe) p.clip(vp, () => { for (let i = -6; i < 6; i++) p.poly([[ax + i * 6 * u, top], [ax + i * 6 * u + 2 * u, top], [ax + i * 6 * u + 2 * u, bot], [ax + i * 6 * u, bot]], o.vestStripe!, 0); });
      if (o.vestCheck) p.clip(vp, () => { for (let i = -6; i < 6; i++) { p.poly([[ax + i * 7 * u, top], [ax + i * 7 * u + 3 * u, top], [ax + i * 7 * u + 3 * u, bot], [ax + i * 7 * u, bot]], o.vestCheck!, 0); }
        for (let i = 0; i < 12; i++) p.poly([[ax - T.a, top + i * 7 * u], [ax + T.a, top + i * 7 * u], [ax + T.a, top + i * 7 * u + 3 * u], [ax - T.a, top + i * 7 * u + 3 * u]], o.vestCheck!, 0);
        p.poly(vp, null, 1.6 * u); });
      for (let i = 0; i < 3; i++) { p.dot(ax, chin + 0.18 * HH + i * 0.17 * HH, 2.8 * u); p.dot(ax, chin + 0.18 * HH + i * 0.17 * HH, 2 * u, o.buttons ?? "#e8c14a"); }
      for (const s of [-1, 1]) p.poly([[ax + s * 0.36 * T.a, top], [ax + s * 0.7 * T.a, chin + 0.22 * HH], [ax + s * 0.5 * T.a, chin + 0.3 * HH], [ax + s * 0.42 * T.a, chin + 0.62 * HH]], o.lapel ?? shade(base, 0.82), 1.6 * u);
      if (o.chain) p.stroke(curve([ax + 2 * u, chin + 0.45 * HH], [ax + 0.25 * T.a, chin + 0.58 * HH], [ax + 0.42 * T.a, chin + 0.46 * HH]), 1.6 * u, "#e8c14a");
    } else if (o.lapels && !BK) { // open jacket over a white shirt: shirt V, two lapels, two buttons below the V
      p.poly([[ax - 0.34 * T.a, top], [ax + 0.34 * T.a, top], [ax + 0.02 * T.a, chin + 0.46 * HH]], o.shirt ?? "#ffffff", 1.3 * u);
      for (const s2 of [-1, 1]) p.poly([[ax + s2 * 0.32 * T.a, top], [ax + s2 * 0.66 * T.a, chin + 0.2 * HH], [ax + s2 * 0.46 * T.a, chin + 0.27 * HH], [ax + s2 * 0.04 * T.a, chin + 0.5 * HH]], o.lapel ?? shade(base, 0.86), 1.5 * u);
      for (let i = 0; i < 2; i++) { p.dot(ax + 0.06 * T.a, chin + 0.6 * HH + i * 0.17 * HH, 2.8 * u); p.dot(ax + 0.06 * T.a, chin + 0.6 * HH + i * 0.17 * HH, 2 * u, o.buttons ?? shade(base, 0.7)); }
    } else if (!BK && !o.kurta && !dress && !o.stripes && !o.singlet && !o.hoodie) for (let i = 0; i < 3; i++) { p.dot(ax, chin + 0.2 * HH + i * 0.2 * HH, 2.8 * u); p.dot(ax, chin + 0.2 * HH + i * 0.2 * HH, 2 * u, o.buttons ?? shade(base, 0.7)); }
    if (o.kurta) { p.stroke([[ax, top + 0.1 * HH], [ax, chin + 0.5 * HH]], 1.4 * u, shade(base, 0.7)); for (let i = 0; i < 3; i++) p.dot(ax + 3 * u, chin + 0.16 * HH + i * 0.12 * HH, 1.8 * u, o.buttons ?? "#e8c14a"); if (o.sash) p.poly([[tcx - 2 * T.a, bot - 0.08 * HH], [tcx + 2 * T.a, bot - 0.08 * HH], [tcx + 2 * T.a, bot - 0.0 * HH], [tcx - 2 * T.a, bot - 0.0 * HH]], o.sash, 0); }
    if (o.drape) { p.poly([[tcx - 1.1 * T.a, chin + 0.1 * HH], [tcx + 1.0 * T.a, top - 0.05 * HH], [tcx + 1.1 * T.a, chin + 0.35 * HH], [tcx - 0.9 * T.a, chin + 0.95 * HH]], o.drape, 1.6 * u); p.stroke([[tcx - 1.1 * T.a, chin + 0.1 * HH], [tcx + 1.0 * T.a, top - 0.05 * HH]], 1.6 * u, "#e8c14a"); }
    if (o.suspenders) for (const s of [-1, 1]) p.band([[ax + s * 0.4 * T.a, top], [ax + s * 0.36 * T.a, bot]], o.suspenders, 3 * u, 0.8 * u);
    if (o.apron) { const ap: P2[] = [[ax - 0.5 * T.a, chin + 0.12 * HH], [ax + 0.5 * T.a, chin + 0.12 * HH], [ax + 0.7 * T.a, bot + 0.1 * HH], [ax - 0.7 * T.a, bot + 0.1 * HH]]; p.poly(ap, o.apron, 2.2 * u);   /* r63 (AX row 4): an inked edge and a hem trim (a blank cream panel read as a pasted label) */
      p.stroke([[ax - 0.66 * T.a, bot + 0.035 * HH], [ax + 0.66 * T.a, bot + 0.035 * HH]], 2.4 * u, shade(o.apron, 0.72));
      // r5: the apron pocket differs per person (none / left patch / centre pouch with a rounded bottom), shaded, with stitching
      const pk = o.seed % 3, pw = (pk === 2 ? 0.26 : 0.17) * T.a, pxc = ax + (pk === 1 ? -0.24 : pk === 0 ? 0.26 : 0) * T.a, py0 = chin + (pk === 2 ? 0.58 : 0.42) * HH, ph = (pk === 2 ? 0.2 : 0.16) * HH;
      { const pts: P2[] = [[pxc - pw, py0], [pxc + pw, py0]]; for (let k = 0; k <= 6; k++) { const a2 = (k / 6) * Math.PI; pts.push([pxc + pw * Math.cos(a2), py0 + ph * 0.6 + ph * 0.4 * Math.sin(a2)]); }
        p.poly(pts, shade(o.apron, 0.86), 1.2 * u); p.stroke([[pxc - pw * 0.8, py0 + 0.03 * HH], [pxc + pw * 0.8, py0 + 0.03 * HH]], 0.8 * u, shade(o.apron, 0.65)); }
      p.stroke([[ax - 0.5 * T.a, chin + 0.16 * HH], [ax + 0.5 * T.a, chin + 0.16 * HH]], 1.0 * u, shade(o.apron, 0.7)); }
    if (o.belt) { p.poly([[tcx - 2 * T.a, bot - 0.28 * HH], [tcx + 2 * T.a, bot - 0.28 * HH], [tcx + 2 * T.a, bot - 0.2 * HH], [tcx - 2 * T.a, bot - 0.2 * HH]], o.belt, 0); p.poly([[ax - 4 * u, bot - 0.3 * HH], [ax + 4 * u, bot - 0.3 * HH], [ax + 4 * u, bot - 0.18 * HH], [ax - 4 * u, bot - 0.18 * HH]], "#e8c14a", 1.2 * u); }
    if (o.sash && !o.kurta) p.band([[tcx - 1.2 * T.a, chin], [tcx + 1.2 * T.a, bot - 0.1 * HH]], o.sash, 0.1 * HH, 1.2 * u);
    if (o.singlet && !BK) { // scooped neck + armholes show the (white) skin
      p.ell(ax, top, 0.42 * T.a, 0.17 * HH, HEAD, 1.8 * u);
      for (const s of [-1, 1]) p.ell(tcx + s * 1.06 * T.a, chin + 0.02 * HH, 0.42 * T.a, 0.3 * HH, HEAD, 1.8 * u);
    }
    // ---- 1968 costume detail ----
    if (o.hawaii && !BK) for (let i = 0; i < 14; i++) { // hibiscus print: 5-petal flowers + leaves, scattered (fixed per seed)
      const fx0 = tcx + (rnd(seed, 40 + i) * 2.2 - 1.1) * T.a, fy0 = top + rnd(seed, 60 + i) * (bot - top + 0.1 * HH), r = (4.2 + 2.2 * rnd(seed, 80 + i)) * u * (o.build === "kid" ? 0.8 : 1);
      p.ell(fx0 + r * 0.9, fy0 + r * 0.7, r * 0.75, r * 0.38, "rgba(40,110,60,0.55)", 0, 0, 360, 35);
      for (let j = 0; j < 5; j++) { const a = (j * two) / 5 + rnd(seed, 90 + i) * 2; p.ell(fx0 + Math.cos(a) * r * 0.55, fy0 + Math.sin(a) * r * 0.55, r * 0.5, r * 0.5, i % 3 === 2 ? "#fbf3dc" : o.hawaii!, 0); }
      p.dot(fx0, fy0, r * 0.28, "#f2c230");
    }
    if (o.batik && !BK) { // 1937 Java batik: kawung four-oval rosettes on a lattice + one parang wave band (fixed per seed)
      const kc = o.batik, dk = shade(base, 0.62);
      for (let i = 0; i < 16; i++) { const fx0 = tcx + (((i % 4) - 1.5) * 0.62 + (Math.floor(i / 4) % 2) * 0.31) * T.a, fy0 = top + 0.06 * HH + Math.floor(i / 4) * 0.24 * HH, r = 3.3 * u * (o.build === "kid" ? 0.8 : 1);
        if (fy0 > bot + 0.05 * HH) continue;
        for (let j = 0; j < 4; j++) { const a = (j * two) / 4 + 0.785; p.ell(fx0 + Math.cos(a) * r * 0.7, fy0 + Math.sin(a) * r * 0.7, r * 0.62, r * 0.36, kc, 0, 0, 360, (a * 180) / Math.PI); }
        p.dot(fx0, fy0, r * 0.26, dk); }
      for (let k = -3; k <= 3; k++) { const y0 = top + 0.62 * HH + k * 0.02 * HH; p.stroke([[tcx - 1.5 * T.a, y0], [tcx - 0.5 * T.a, y0 - 0.05 * HH], [tcx + 0.5 * T.a, y0], [tcx + 1.5 * T.a, y0 - 0.05 * HH]], 0.7 * u, k % 2 ? kc : dk); }
    }
    if (o.patches && !BK) { // donkey jacket: leather yoke across the shoulders with stitching
      const yb = chin + 0.17 * HH;
      p.poly([[tcx - 2 * T.a, top - HH], [tcx + 2 * T.a, top - HH], [tcx + 2 * T.a, yb + 2 * u], [tcx - 2 * T.a, yb]], o.patches, 1.6 * u);
      for (let i = -9; i <= 9; i++) p.dot(tcx + i * 0.11 * T.a, yb - 2.2 * u + i * 0.05 * u, 0.7 * u, shade(o.patches, 1.35));
    }
    if (o.sweaty && !BK) { // dark sweat patches under the arms and down the chest
      const sc = shade(base, 0.8);
      for (const s of [-1, 1]) p.ell(tcx + s * 0.86 * T.a, chin + 0.3 * HH, 0.26 * T.a, 0.17 * HH, sc, 0, 0, 360, s * 12);
      p.ell(ax, chin + 0.36 * HH, 0.2 * T.a, 0.15 * HH, sc, 0);
      p.ell(ax - 0.06 * T.a, chin + 0.5 * HH, 0.12 * T.a, 0.07 * HH, sc, 0);
    }
    if (o.pocketPro && !BK) { // shirt pocket on the far side with a plastic pocket protector + three pens
      const s = fs ? -fs : 1, px = ax + s * 0.42 * T.a, py = chin + 0.28 * HH, pw = 0.22 * T.a, ph = 0.16 * HH;
      for (const [i, c] of (["#c8352e", "#2f4fa0", "#2a2228"] as string[]).entries()) { const x = px - pw * 0.55 + i * pw * 0.55; p.band([[x, py - 0.02 * HH], [x, py - 0.11 * HH]], c, 2.6 * u, 0.8 * u, "round"); p.dot(x, py - 0.115 * HH, 1.4 * u, "#d9dde2"); }
      p.poly([[px - pw, py], [px + pw, py], [px + pw, py + ph], [px - pw, py + ph]], o.pocketPro, 1.4 * u);
      p.stroke([[px - pw, py + 0.04 * HH], [px + pw, py + 0.04 * HH]], 1 * u, shade(o.pocketPro, 0.7));
    }
    if (o.splats && !BK) for (let i = 0; i < 9; i++) { const c = ["#c8352e", "#2f6fc8", "#f2c230", "#3aa36a"][i % 4], x = tcx + (rnd(seed, 120 + i) * 2 - 1) * T.a, y = top + rnd(seed, 140 + i) * (bot - top), r = (1.8 + 2.4 * rnd(seed, 160 + i)) * u;
      p.ell(x, y, r, r * 0.85, c, 0); p.dot(x + r * 1.4, y - r * 0.8, r * 0.35, c); }
    if (wet > 0) p.poly([[tcx - 2 * T.a, bot - 0.35 * HH], [tcx + 2 * T.a, bot - 0.35 * HH], [tcx + 2 * T.a, bot + HH], [tcx - 2 * T.a, bot + HH]], `rgba(40,80,140,${0.28 * wet})`, 0);
  });
  if (!BK) { // v15 AX2 row 4: one smooth light-to-shadow gradient over the whole costume (about 0.62 on the far side) and a light
    // rim just inside the shadow edge (the old hard cel band read two-tone, and the apron and vest stayed flat over the coat's gradient)
    const g = p.g, lx = Math.cos(light) >= 0 ? 1 : -1, ym = (chin + torsoBot) / 2;
    const [ax, ay] = p.P(tcx + lx * 1.0 * T.a, ym), [bx, by] = p.P(tcx - lx * 1.04 * T.a, ym);
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, "rgba(34,20,52,0)"); gr.addColorStop(0.32, "rgba(34,20,52,0)"); gr.addColorStop(0.8, "rgba(34,20,52,0.3)"); gr.addColorStop(0.91, "rgba(34,20,52,0.34)"); gr.addColorStop(0.97, "rgba(255,238,220,0.16)"); gr.addColorStop(1, "rgba(255,238,220,0.05)");
    g.save(); p.path(body, true); g.fillStyle = gr; g.fill(); g.restore();
    /* r55: a faint cloth weave on the costume (reviewers: "every costume is a flat colour fill") - a diagonal twill and a
     *  speckle, clipped to the torso, under 6 % so the colour stays the AX colour */
    { const bb = body.map((q) => p.P(q[0], q[1])), x0 = Math.min(...bb.map((q) => q[0])), x1 = Math.max(...bb.map((q) => q[0])), y0 = Math.min(...bb.map((q) => q[1])), y1 = Math.max(...bb.map((q) => q[1]));
      let sd = ((o.seed ?? 7) * 9301 + 49297) % 233280; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
      g.save(); p.path(body, true); g.clip(); g.lineWidth = Math.max(0.6, 0.9 * u);
      /* r76i (both reviewers: flat colour fills against Rick's textured costumes): a weave per person - twill, check, herringbone or
       *  slub - at ~7 %, plus two soft fold shadows down the cloth; the AX colour still reads */
      const kind = (o.seed ?? 7) % 4, st = Math.max(2.5, 3.4 * u), ink = "rgba(20,12,30,0.075)", lite = "rgba(255,250,240,0.06)";
      if (kind === 0) { g.strokeStyle = ink; g.beginPath(); for (let d = x0 - (y1 - y0); d < x1; d += st) { g.moveTo(d, y1); g.lineTo(d + (y1 - y0), y0); } g.stroke(); }
      else if (kind === 1) { g.strokeStyle = "rgba(20,12,30,0.06)"; g.beginPath(); for (let x = x0; x < x1; x += st * 2.6) { g.moveTo(x, y0); g.lineTo(x, y1); } g.stroke(); g.strokeStyle = lite; g.beginPath(); for (let x = x0 + st * 1.3; x < x1; x += st * 2.6) { g.moveTo(x, y0); g.lineTo(x, y1); } g.stroke(); }   /* a soft pinstripe (the check read as graph paper) */
      else if (kind === 2) { g.strokeStyle = ink; g.beginPath(); const band = st * 4; for (let x = x0; x < x1; x += band) { const sgn = Math.round((x - x0) / band) % 2 ? 1 : -1; for (let y = y0 - band; y < y1; y += st) { g.moveTo(x, y); g.lineTo(x + band, y + sgn * band * 0.6); } } g.stroke(); }
      else { for (let i = 0; i < ((x1 - x0) * (y1 - y0)) / (st * st * 3); i++) { g.fillStyle = rnd() < 0.6 ? ink : lite; g.fillRect(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), st * (0.8 + rnd() * 1.6), Math.max(0.6, 0.8 * u)); } }
      for (const fx of [0.3 + 0.1 * rnd(), 0.62 + 0.1 * rnd()]) { const cx = x0 + fx * (x1 - x0), w2 = 0.07 * (x1 - x0), gf = g.createLinearGradient(cx - w2, 0, cx + w2, 0); gf.addColorStop(0, "rgba(20,12,30,0)"); gf.addColorStop(0.5, "rgba(20,12,30,0.07)"); gf.addColorStop(1, "rgba(20,12,30,0)"); g.fillStyle = gf; g.fillRect(cx - w2, y0 + 0.35 * (y1 - y0), 2 * w2, 0.65 * (y1 - y0)); }   /* r58: no speckle (it read as glitter on the taxman's coat) - the faint twill only */
      g.restore(); }
  }
  { /* c1 (AX2 row 4): the light-to-shadow gradient and the light rim go OVER the stripes and prints (drawn under them they vanished) */
    const dx = Math.cos(light), dy = Math.sin(light), n = body.length; let ccx = 0, ccy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of body) { ccx += x / n; ccy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = ccx * dx + ccy * dy, [ax2, ay2] = p.P(ccx + dx * (hi - dc), ccy + dy * (hi - dc)), [bx2, by2] = p.P(ccx + dx * (lo - dc), ccy + dy * (lo - dc));
    const g = p.g, gr = g.createLinearGradient(ax2, ay2, bx2, by2);
    gr.addColorStop(0, "rgba(255,246,230,0.10)"); gr.addColorStop(0.3, "rgba(40,24,70,0)"); gr.addColorStop(0.84, "rgba(40,24,70,0.26)");
    gr.addColorStop(0.9, "rgba(255,238,220,0.16)"); gr.addColorStop(0.95, "rgba(40,24,70,0.3)"); gr.addColorStop(1, "rgba(40,24,70,0.32)");
    g.save(); p.path(body, true); g.fillStyle = gr; g.fill(); g.restore(); }
  p.inkRing(body, ow, thick);
  if (opts.pocketsOut) for (const sd of [-1, 1]) {   /* r76i (both reviewers: nothing showed "broke"): two white pocket linings hanging out at the hips */
    const px = tcx + tsh * 0.4 + sd * 0.62 * T.a, py = torsoBot - 0.1 * HH, w2 = 0.13 * HH, h2 = 0.26 * HH, k = sd * 0.18;
    const pk: P2[] = [[px - w2, py], [px + w2, py], [px + w2 * 0.9 + k * h2, py + h2 * 0.8], [px + k * h2, py + h2], [px - w2 * 0.9 + k * h2, py + h2 * 0.8]];
    p.poly(pk, "#f4efe4", 2.6 * u); p.stroke([[px - w2 * 0.4, py + h2 * 0.15], [px + k * h2 * 0.6 - w2 * 0.1, py + h2 * 0.7]], 1.4 * u, "rgba(36,22,38,0.45)"); }
  if (o.scarf || o.collar) { // cravat / neckerchief / collar points under the chin
    const c = o.scarf ?? o.collar!;
    for (const s of [-1, 1]) p.poly([[tcx + 2 * u * fs + tsh, chin + 0.02 * HH], [tcx + tsh + s * 0.42 * T.a, chin - 0.04 * HH], [tcx + tsh + s * 0.22 * T.a, chin + 0.2 * HH]], c, 1.6 * u);
    if (o.scarf) p.poly([[tcx - 4 * u, chin + 0.08 * HH], [tcx + 4 * u, chin + 0.08 * HH], [tcx + 7 * u, chin + 0.36 * HH], [tcx - 6 * u, chin + 0.34 * HH]], shade(o.scarf, 0.92), 1.6 * u);
  }
  if (o.bowtie) { const bx = tcx + 2 * u * fs + tsh, by = chin + 0.05 * HH;
    for (const s of [-1, 1]) p.poly([[bx, by], [bx + s * 9 * u, by - 5 * u], [bx + s * 9 * u, by + 5 * u]], o.bowtie, 1.6 * u);
    p.ell(bx, by, 2.6 * u, 2.6 * u, shade(o.bowtie, 0.8), 1.4 * u); }
  // ---- 1968 neckwear + accessories ----
  if (o.tie && !BK) { // necktie (loosened: knot drops, collar opens, blade swings)
    const L = !!o.tieLoose, bx = tcx + 2 * u * fs + tsh + (L ? 2 * u : 0), by = chin + (L ? 0.13 : 0.04) * HH, ta = rad(L ? 9 : 2);
    const R2 = (pts: P2[]) => rotPts(pts, ta, bx, by);
    if (L) p.poly([[bx - 6 * u, chin - 0.01 * HH], [bx + 6 * u, chin - 0.01 * HH], [bx, by]], HEAD, 1.4 * u);
    const blade = R2([[bx - 4 * u, by + 2 * u], [bx + 4 * u, by + 2 * u], [bx + 8 * u, by + 0.42 * HH], [bx, by + 0.5 * HH], [bx - 8 * u, by + 0.42 * HH]]);
    p.poly(blade, o.tie, 1.5 * u);
    if (o.tieStripe) p.clip(blade, () => { for (let i = -2; i < 9; i++) p.band([[bx - 14 * u, by + i * 0.07 * HH], [bx + 14 * u, by + i * 0.07 * HH + 0.09 * HH]], o.tieStripe!, 0.026 * HH, 0); });
    p.poly(R2([[bx - 5 * u, by - 3 * u], [bx + 5 * u, by - 3 * u], [bx + 3.5 * u, by + 4 * u], [bx - 3.5 * u, by + 4 * u]]), shade(o.tie, 0.85), 1.4 * u);
  }
  if (o.bolo && !BK) { // bolo tie: braided cord, silver-rimmed stone slide at the throat, silver tips
    const bx = tcx + 2 * u * fs + tsh, by = chin + 0.1 * HH;
    for (const s of [-1, 1]) p.stroke(curve([bx + s * 0.18 * T.a, chin - 0.01 * HH], [bx + s * 2.5 * u, by - 4 * u], [bx + s * 1.4 * u, by], 8), 1.6 * u, "#3a2a2a");
    for (const s of [-1, 1]) { const end: P2 = [bx + s * 3 * u + fs * u, by + 0.36 * HH]; p.stroke(curve([bx + s * 1.4 * u, by + 5 * u], [bx + s * 2.2 * u, by + 0.2 * HH], end, 8), 1.6 * u, "#3a2a2a");
      p.poly([[end[0] - 1.3 * u, end[1]], [end[0] + 1.3 * u, end[1]], [end[0] + 0.8 * u, end[1] + 5 * u], [end[0] - 0.8 * u, end[1] + 5 * u]], "#d9dde2", 0.9 * u); }
    p.ell(bx, by, 6.6 * u, 7.6 * u, "#d9dde2", 1.6 * u); p.ell(bx, by, 4.6 * u, 5.6 * u, o.bolo, 1 * u);
    p.ell(bx - 1.4 * u, by - 2 * u, 1.4 * u, 1.8 * u, "rgba(255,255,255,0.65)", 0);
  }
  if (o.hoodie && !BK) { // drawstrings + kangaroo pocket + rib lines
    for (const s2 of [-1, 1]) p.stroke([[tcx + s2 * 0.2 * T.a + 2 * u * fs, chin + 0.02 * HH], [tcx + s2 * 0.22 * T.a + 2 * u * fs, chin + 0.42 * HH]], 2.4 * u, o.hoodie);
    const py = chin + 0.62 * HH, pw = 0.5 * T.a, ph = 0.26 * HH, px = tcx + 3 * u * fs + tsh;
    p.poly([[px - pw, py], [px + pw, py], [px + pw * 1.04, py + ph], [px - pw * 1.04, py + ph]], shade(o.coat, 0.86), 1.8 * u);
    for (const x of [-0.7, -0.35, 0, 0.35, 0.7]) p.stroke([[tcx + x * T.a + 2 * u * fs, chin + 0.08 * HH], [tcx + x * T.a + 2 * u * fs, chin + 0.95 * HH]], 0.9 * u, "rgba(120,70,10,0.18)");
  }
  if (o.carnation && !BK) { const cx = tcx - (fs || 1) * 0.5 * T.a, cy = chin + 0.2 * HH; p.ell(cx + 3 * u, cy + 4 * u, 3.4 * u, 1.6 * u, "#4e8a38", 0.9 * u, 0, 360, 40);
    for (let j = 0; j < 6; j++) { const a = (j * two) / 6; p.ell(cx + Math.cos(a) * 2.4 * u, cy + Math.sin(a) * 2.4 * u, 2.6 * u, 2.6 * u, o.carnation, 0.8 * u); } p.dot(cx, cy, 1.6 * u, shade(o.carnation, 0.7)); }
  if (o.pocketSq && !BK) { const s = fs ? -fs : 1, cx = tcx + s * 0.46 * T.a + 2 * u * fs, cy = chin + 0.3 * HH;
    p.poly([[cx - 5 * u, cy], [cx - 2 * u, cy - 5 * u], [cx, cy - 1.5 * u], [cx + 3 * u, cy - 5.5 * u], [cx + 5 * u, cy]], o.pocketSq, 1.2 * u); p.stroke([[cx - 6 * u, cy], [cx + 6 * u, cy]], 1.4 * u); }
  if (o.police && !BK) { for (const s of [-1, 1]) p.poly([[tcx + s * 0.2 * T.a, chin + 0.05 * HH], [tcx + s * 0.38 * T.a, chin + 0.03 * HH], [tcx + s * 0.36 * T.a, chin + 0.11 * HH], [tcx + s * 0.2 * T.a, chin + 0.12 * HH]], "#d9dde2", 1 * u);
    p.stroke(curve([tcx - 0.1 * T.a, chin + 0.34 * HH], [tcx - 0.45 * T.a, chin + 0.42 * HH], [tcx - 0.62 * T.a, chin + 0.3 * HH], 10), 1.4 * u, "#d9dde2"); p.dot(tcx - 0.62 * T.a, chin + 0.3 * HH, 2 * u, "#d9dde2"); }
  if (o.toolbelt && !BK) { // belt with two pouches, a tape measure and a hammer hanging at the hip
    const by = torsoBot - 0.2 * HH, s = fs ? -fs : 1;
    p.band([[tcx - 1.02 * T.a, by - 0.01 * HH], [tcx + 1.02 * T.a, by + 0.01 * HH]], o.toolbelt, 0.06 * HH, 1.2 * u);
    p.poly([[tcx - 4 * u, by - 0.04 * HH], [tcx + 4 * u, by - 0.04 * HH], [tcx + 4 * u, by + 0.04 * HH], [tcx - 4 * u, by + 0.04 * HH]], "#c9ced6", 1.2 * u);
    for (const x of [-0.62, 0.62]) { const q: P2[] = [[tcx + x * T.a - 0.18 * T.a, by], [tcx + x * T.a + 0.18 * T.a, by], [tcx + x * T.a + 0.16 * T.a, by + 0.17 * HH], [tcx + x * T.a - 0.16 * T.a, by + 0.17 * HH]];
      p.poly(q, shade(o.toolbelt, 1.12), 1.4 * u); p.stroke([[q[0][0], by + 0.05 * HH], [q[1][0], by + 0.05 * HH]], 1.1 * u, shade(o.toolbelt, 0.7)); }
    p.band([[tcx + s * 0.95 * T.a, by + 0.02 * HH], [tcx + s * 1.0 * T.a, by + 0.3 * HH]], "#b07a45", 2.8 * u, 0.9 * u, "round");
    p.poly([[tcx + s * 0.9 * T.a - 3 * u, by + 0.3 * HH], [tcx + s * 1.1 * T.a + 3 * u, by + 0.29 * HH], [tcx + s * 1.1 * T.a + 3 * u, by + 0.34 * HH], [tcx + s * 0.9 * T.a - 3 * u, by + 0.35 * HH]], "#5a606c", 1.2 * u);
    p.ell(tcx - s * 0.32 * T.a, by + 0.05 * HH, 4.2 * u, 4.2 * u, "#f2c230", 1.2 * u);
  }
  if (o.camStrap && !BK) { // camera on a neck strap, resting on the belly
    const cx = tcx + 3 * u * fs + tsh, cy = chin + 0.56 * HH;
    for (const s of [-1, 1]) p.stroke([[tcx + s * 0.5 * T.a, chin - 0.01 * HH], [cx + s * 8 * u, cy - 4 * u]], 1.8 * u, "#4a3426");
    p.poly([[cx - 13 * u, cy - 7 * u], [cx + 13 * u, cy - 7 * u], [cx + 13 * u, cy + 8 * u], [cx - 13 * u, cy + 8 * u]], "#3a3a44", 1.6 * u);
    p.poly([[cx - 13 * u, cy - 7 * u], [cx + 13 * u, cy - 7 * u], [cx + 13 * u, cy - 2 * u], [cx - 13 * u, cy - 2 * u]], "#c9ced6", 1.2 * u);
    p.ell(cx + 1 * u, cy + 2 * u, 6.4 * u, 6.4 * u, "#5a606c", 1.4 * u); p.ell(cx + 1 * u, cy + 2 * u, 3.6 * u, 3.6 * u, "#2c3550", 1 * u); p.dot(cx - 0.5 * u, cy + 0.5 * u, 1.2 * u, "rgba(255,255,255,0.8)");
    p.poly([[cx + 6 * u, cy - 10 * u], [cx + 11 * u, cy - 10 * u], [cx + 11 * u, cy - 7 * u], [cx + 6 * u, cy - 7 * u]], "#c9ced6", 1 * u);
  }
  if (o.mailbag) { // strap over the chest, satchel at the hip (far side)
    const bs = fs ? -fs : -1;
    p.band([[tcx - bs * 0.62 * T.a, chin + 0.02 * HH], [tcx + bs * 0.86 * T.a, torsoBot - 0.24 * HH]], shade(o.mailbag, 0.85), 4.2 * u, 1.1 * u);
  }
  if (o.bib) { // white cloth race bib, four pins, the number fitted inside
    const bx = tcx + 2 * u * fs + tsh, by = chin + 0.6 * HH, bw = 0.62 * T.a, bh = 0.4 * T.a, ba = rad(4 * (rnd(seed, 31) - 0.5));
    const bp = rotPts([[bx - bw, by - bh], [bx + bw, by - bh * 0.96], [bx + bw * 1.01, by + bh], [bx - bw * 0.98, by + bh * 1.02]], ba, bx, by);
    p.poly(bp, o.bibCol ?? "#fbf8ef", 1.8 * u);
    for (const [x, y] of bp) { const q: P2 = [x + (bx - x) * 0.14, y + (by - y) * 0.2]; p.dot(q[0], q[1], 1.3 * u, "#8a8f99"); }
    ptext(p, o.bib, [bx, by + 0.02 * bh], bw * 1.45, bh * 1.2, ba, INK, 800, CONDENSED);
  }
  if (o.mailbag) {
    const bs = fs ? -fs : -1, cx = tcx + bs * 0.84 * T.a, cy = torsoBot - 0.16 * HH;
    const bag: P2[] = [[cx - 0.36 * T.a, cy - 0.2 * HH], [cx + 0.36 * T.a, cy - 0.2 * HH], [cx + 0.38 * T.a, cy + 0.14 * HH], [cx - 0.38 * T.a, cy + 0.14 * HH]];
    p.gradFill(bag, o.mailbag, mul(o.mailbag, SH_CLOTH), light); p.poly(bag, null, ow * 0.7);
    p.poly([[cx - 0.36 * T.a, cy - 0.2 * HH], [cx + 0.36 * T.a, cy - 0.2 * HH], [cx + 0.34 * T.a, cy - 0.02 * HH], [cx - 0.34 * T.a, cy - 0.02 * HH]], shade(o.mailbag, 1.12), 1.6 * u);
    p.ell(cx, cy - 0.03 * HH, 2.6 * u, 2.6 * u, "#e8c14a", 1.2 * u);
  }
  if (o.medal || opts.medal) { // ribbon round the neck, big shiny gold disc on the chest
    const mx = tcx + 3 * u * fs + tsh, my = chin + 0.3 * HH;
    for (const s of [-1, 1]) p.poly([[tcx + s * 0.36 * T.a, chin - 0.02 * HH], [tcx + s * 0.22 * T.a, chin - 0.04 * HH], [mx + s * 1.5 * u, my - 0.06 * HH], [mx + s * 6 * u, my - 0.08 * HH]], s < 0 ? "#c8352e" : "#2f5d9a", 1.4 * u);
    medalDisc(p, [mx, my], 12.5 * u, u);
  }
  if (o.dummy && !BK) target(p, tcx + 4 * u * fs, chin + 0.32 * HH, 11 * u, u);
  const C2 = !!opts.carry2 && (opts.propR === "loaf" || opts.propR === "brick"), PO = !!opts.propsOver && !C2;
  if (armLFront && !opts.armLTop) drawArm(AL, C2 || PO ? undefined : opts.propL, opts.propLAng, -1);
  if (armRFront && !opts.armRTop) drawArm(AR, C2 || PO ? undefined : opts.propR, opts.propRAng, 1);
  if (PO) for (const [A, pr, ang, sd] of [[AL, opts.propL, opts.propLAng ?? 0, -1], [AR, opts.propR, opts.propRAng ?? 0, 1]] as [[P2, P2, P2], string | undefined, number, number][]) if (pr) {   /* r76i (reviewer): held blocks drawn over the arms, the dot on top (the arms ran across their faces like straps) */
    const dir = Math.sign(A[2][0] - A[0][0]) || sd; drawProp(p, pr, [A[2][0] + dir * 2 * u * Math.cos(ang), A[2][1] + dir * 2 * u * Math.sin(ang)], u, ang, opts.propK ?? 0);
    if (BOOKS.has(pr)) p.stroke(curve(A[0], A[1], A[2]).slice(4), 5.2 * u, armCol);   /* r76i (reviewer: the arm vanished behind the ledger): the forearm crosses the front of a held book to the thumb dot */
    p.dot(A[2][0], A[2][1], 4.8 * u); }
  if (C2) { const m: P2 = [(AL[2][0] + AR[2][0]) / 2, (AL[2][1] + AR[2][1]) / 2]; drawProp(p, opts.propR!, [m[0], m[1] + 1.5 * u], u, 0, opts.propK ?? 0); for (const h of [AL[2], AR[2]]) p.dot(h[0], h[1], 4.8 * u); }   /* r76h (AX row 5): the two-hand carry - the block centred over both dots (one dot on its corner read as pasted on) */
  if (opts.noHead) { // popped off: a stubby neck post with a bolt
    p.rot = A ? [rad(A), 300, hipY] : null;
    p.poly([[300 - 7 * u, chin + 4 * u], [300 + 7 * u, chin + 4 * u], [300 + 6 * u, chin - 12 * u], [300 - 6 * u, chin - 12 * u]], "#9aa0ac", 2.4 * u);
    p.ell(300, chin - 13 * u, 9 * u, 4 * u, "#c9ced6", 2.2 * u);
    p.rot = null; if (LIE) p.g.restore(); return;
  }
  // ---- head ----
  const Ah = A + headTilt;
  const cpx = 300 + (chin - hipY) * -Math.sin(rad(A)) + (LIE ? (H.a - T.a) * 0.9 : 0), cpy = hipY + (chin - hipY) * Math.cos(rad(A));
  p.rot = Ah || LIE ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  if (o.hat === "bonnet" || o.hairStyle === "bun") { // back parts
    if (o.hat === "bonnet") { const bb = blobPts(300, hc - 0.13 * HH, { ...H, a: H.a * 1.14, b: H.b * 1.04, asym: 0, egg: 0.04, seed: seed + 3 }); p.shadedFill(bb, o.hatCol ?? "#e9cf8f", mul(o.hatCol ?? "#e9cf8f", SH_CLOTH), light, H.a * 1.17); p.inkRing(bb, ow * 0.85, thick); }
  }
  if (o.hairStyle === "pigtails" && o.hair) for (const s of [-1, 1]) { // two bunches sticking out behind the head, with bows
    const bx = 300 + s * 1.02 * H.a, by = hc + 0.05 * H.b;
    const tail: P2[] = [[bx - s * 10 * u, by - 12 * u], [bx + s * 14 * u, by - 18 * u], [bx + s * 30 * u, by - 6 * u], [bx + s * 34 * u, by + 12 * u], [bx + s * 22 * u, by + 26 * u], [bx + s * 24 * u, by + 10 * u], [bx + s * 8 * u, by + 10 * u], [bx - s * 8 * u, by + 10 * u]];
    p.shadedFill(tail, o.hair, mul(o.hair, SH_FELT), light, 30 * u, 0.3); p.poly(tail, null, ow * 0.7);
    p.stroke(curve([bx + s * 6 * u, by - 10 * u], [bx + s * 22 * u, by - 6 * u], [bx + s * 26 * u, by + 10 * u], 8), 1.2 * u, shade(o.hair, 0.7));
    const kx = bx + s * 2 * u, ky = by - 2 * u, bc = o.bow ?? "#e84a6a";
    for (const t of [-1, 1]) p.poly([[kx, ky], [kx + t * 9 * u, ky - 7 * u], [kx + t * 9 * u, ky + 7 * u]], bc, 1.4 * u);
    p.ell(kx, ky, 3 * u, 3 * u, shade(bc, 0.85), 1.2 * u);
  }
  if (o.beard) { const tkB = Math.min(1, Math.abs(turnK(facing))), bp = blobPts(300 + 0.8 * TURN.mouth * u * turnK(facing), hc + (0.5 + 0.16 * tkB) * H.b, { ...H, a: H.a * (0.92 - 0.42 * tkB), b: H.b * (0.85 - 0.12 * tkB), egg: -0.3 - 0.35 * tkB, seed: seed + 5 });   /* r60 (AX row 6): narrower in 3/4 (the full-width beard wrapped the jaw and read as a hood) */ p.shadedFill(bp, o.beard, mul(o.beard, SH_FELT), light, H.a); p.inkRing(bp, ow * 0.8, thick); }
  const hp = blobPts(300, hc, H);
  const sick = opts.sick ?? (expr === "green" ? 0.5 : 0), purple = opts.purple ?? (expr === "rage" ? 1 : 0);
  const headCol = purple > 0 ? mix(HEAD, "#8f55c4", 0.8 * clamp(purple, 0, 1)) : sick > 0 ? mix(HEAD, "#a9d98a", 0.55 * clamp(sick, 0, 1)) : HEAD;
  p.shadedFill(hp, headCol, mul(headCol, [0.8, 0.79, 0.9]), light, H.a, 0.55, 0.82, 1.32);   /* c1: a wider, slightly deeper crescent (at 10 % over a thin band the head read flat white) */   /* r66 (AX1 row 1): a soft lavender crescent ~10 % darker on the side away from the light (the flat sticker head read unlit) */
  const fillK = clamp(opts.purpleFill ?? 0, 0, 1);
  if (fillK > 0 && purple <= 0) { // the rising purple: the egg clipped below a level that climbs from the chin to the crown
    const PUR = "#8f55c4", top = hc - H.b * 1.02, bot = hc + H.b * 1.02, lv = bot - (bot - top) * fillK, wob = (x: number) => lv + 1.6 * u * Math.sin(x / (7 * u) + fillK * 9);
    const cl: P2[] = [];
    for (let i = 0; i < hp.length; i++) { // Sutherland-Hodgman against the (gently wavy) fill line
      const a = hp[i], b = hp[(i + 1) % hp.length], ia = a[1] >= wob(a[0]), ib = b[1] >= wob(b[0]);
      if (ia) cl.push(a);
      if (ia !== ib) { const t = (wob(a[0]) - a[1]) / (b[1] - a[1] || 1e-6); cl.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    if (cl.length > 2) {
      p.shadedFill(cl, PUR, mul(PUR, SH_SKIN), light, H.a);
      if (fillK < 0.98) { const xs = cl.filter(([, y]) => Math.abs(y - lv) < 3 * u).map(([x]) => x); if (xs.length > 1) { const x0 = Math.min(...xs), x1 = Math.max(...xs); const pts: P2[] = []; for (let k = 0; k <= 16; k++) { const x = x0 + (x1 - x0) * k / 16; pts.push([x, wob(x)]); } p.stroke(pts, 2.2 * u, "rgba(196,160,236,0.95)"); }
        for (const [bx, by, br] of [[-0.3, 0.55, 3], [0.18, 0.7, 2.2], [0.36, 0.45, 2.6], [-0.05, 0.82, 1.8]] as [number, number, number][]) { const yy = hc + by * H.b; if (yy > lv + 5 * u) p.ell(300 + bx * H.a, yy, br * u, br * u, "rgba(205,175,240,0.85)", 0); } }
    }
  }
  p.inkRing(hp, ow, thick, 0.6);   /* c1 (AX1 row 1): heavier on the shadow side, lighter on top */
  hair(p, o, hp, H, hc, light, fs, u, ow, thick);
  if (o.chops) for (const s of [-1, 1]) { // mutton chops down the cheeks
    const x0 = 300 + 0.6 * TURN.mouth * u * turnK(facing);
    p.poly([[x0 + s * 0.8 * H.a, hc - 0.3 * H.b], [x0 + s * 0.97 * H.a, hc + 0.05 * H.b], [x0 + s * 0.86 * H.a, hc + 0.55 * H.b], [x0 + s * 0.56 * H.a, hc + 0.62 * H.b], [x0 + s * 0.42 * H.a, hc + 0.36 * H.b], [x0 + s * 0.66 * H.a, hc + 0.12 * H.b], [x0 + s * 0.68 * H.a, hc - 0.3 * H.b]], o.chops, 1.8 * u);
  }
  if (o.sideburns && !BK && o.hairStyle !== "tufts") for (const s of [-1, 1]) { // short tapered sideburns from under the temple curls down the cheek
    const ex = (k: number) => { const pts = hp.filter(([x, y]) => Math.sign(x - 300) === s && Math.abs(y - (hc + k * H.b)) < 0.09 * H.b); return pts.length ? Math.max(...pts.map(([x]) => Math.abs(x - 300))) : H.a * 0.95; };
    const y0 = hc - 0.36 * H.b, y1 = hc + 0.12 * H.b, w0 = ex(-0.36), w1 = ex(0.12);
    const sb: P2[] = [[300 + s * (w0 + 0.5 * u), y0], [300 + s * (w0 - 6.5 * u), y0 + 2 * u], [300 + s * (w1 - 3.2 * u), y1 - 1 * u], [300 + s * (w1 - 0.6 * u), y1 + 1.5 * u], [300 + s * (w1 + 0.4 * u), y1 - 2 * u]];
    p.poly(sb, o.sideburns, 1.1 * u);
    p.stroke([[300 + s * (w0 - 3 * u), y0 + 4 * u], [300 + s * (w1 - 1.6 * u), y1 - 3 * u]], 0.8 * u, shade(o.sideburns, 0.75));
  }
  if (o.pencilEar && !BK) { // yellow pencil tucked over the far ear
    const s = fs ? -fs : 1, x0 = 300 + s * 0.9 * H.a, y0 = hc - 0.12 * H.b, a = rad(s * 62);
    const R2 = (pts: P2[]) => rotPts(pts.map(([x, y]) => [x0 + x * u, y0 + y * u] as P2), a, x0, y0);
    p.poly(R2([[-3, -16], [3, -16], [3, 14], [-3, 14]]), "#f2c230", 1.3 * u);
    p.poly(R2([[-3, 14], [3, 14], [0, 21]]), "#f1d8b0", 1.1 * u); p.poly(R2([[-1, 19], [1, 19], [0, 21]]), INK, 0);
    p.poly(R2([[-3, -20], [3, -20], [3, -16], [-3, -16]]), "#e88a9a", 1.1 * u); p.poly(R2([[-3, -16], [3, -16], [3, -13], [-3, -13]]), "#c9ced6", 1 * u);
  }
  const brim = !!o.hat && o.hat !== "bonnet" && o.hat !== "none" && o.hat !== "headband" && o.hat !== "laurel" && !opts.noHat;
  if (BK) { // back of the head: short hair from under the cap band (or the crown) down to a rounded hairline above the nape
    const hcol = o.hair ?? "#e6ddd2", capped = !!o.hat && CAPS.has(o.hat) && !opts.noHat, top = capped ? hc - H.b + 0.36 * H.b : hc - 0.1 * H.b, line = hc + 0.7 * H.b;
    // v13: with hair and no flat cap, the back hair starts at the crown (any hat is drawn over it), so no white band shows
    // between a hat or the crown and the hair; bald or hairless characters keep the low fringe.
    const topB = !capped && o.hair && o.hairStyle !== "bald" ? hc - 1.3 * H.b : top;
    // v13 (AV2 fix): the hair runs down to the jaw line on both sides and only the nape stays white: a neck column about
    // 0.4 W wide with straight sides and a softly rounded top hairline, which ends in the coat collar drawn below. Hair,
    // white neck, collar reads as the back of a person; the old full-width white crescent under the hair read as a grin.
    const nw = 0.38 * H.a, nTop = line - 0.2 * H.b, low = hc + 1.4 * H.b;
    const shortBack = !o.hairStyle || ["short", "slick", "parted", "cowlick", "curl"].includes(o.hairStyle);   /* c1 (AX2 row 7): short hair from behind is a cap over the top half; the rest of the head stays white */
    const back: P2[] = [[300 - 1.3 * H.a, topB], [300 + 1.3 * H.a, topB]];
    if (shortBack) { const hl = hc + 0.12 * H.b; for (let i = 0; i <= 16; i++) { const x = -1.3 + (2.6 * i) / 16; back.push([300 - x * H.a, hl + 0.16 * H.b * (1 - Math.min(1, (x / 1.1) ** 2))]); } }
    else { back.push([300 + 1.3 * H.a, low], [300 + nw, low]);
      for (let i = 0; i <= 12; i++) { const a = rad(i * 15), c = Math.cos(a); back.push([300 + nw * c, nTop + 0.07 * H.b * Math.pow(Math.abs(c), 3) + (Math.abs(c) > 0.97 ? 0.05 * H.b : 0)]); }
      back.push([300 - nw, low], [300 - 1.3 * H.a, low]); }
    p.clip(hp, () => { p.shadedFill(back, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(back, null, ow * 0.6);
      const hlE = shortBack ? hc + 0.2 * H.b : line + 0.12 * H.b; for (const x of [-0.7, -0.5, 0.5, 0.7]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * 1.04 * H.a, hlE]], 1.2 * u, shade(hcol, 0.74));
      for (const x of [-0.2, 0.2]) p.stroke([[300 + x * H.a, top + 0.1 * H.b], [300 + x * H.a, shortBack ? hc + 0.25 * H.b : nTop - 0.05 * H.b]], 1.2 * u, shade(hcol, 0.74));
      if (!shortBack) { p.stroke([[300 - 0.55 * nw, nTop + 0.1 * H.b], [300 - 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)");   // soft neck creases
      p.stroke([[300 + 0.55 * nw, nTop + 0.1 * H.b], [300 + 0.5 * nw, hc + 0.84 * H.b]], 1.1 * u, "rgba(60,40,60,0.16)"); } });
    p.inkRing(hp, ow, thick, 0.6);
    if (!shortBack) { // the collar of whatever the body wears, drawn OVER the head outline so the neck runs into it
      const cc = shade(o.singlet ?? o.dress ?? o.drape ?? o.coat, 0.8), cy1 = hc + 0.8 * H.b, cy2 = hc + 1.14 * H.b;
      const col: P2[] = [[300 - 0.74 * H.a, cy2], [300 - 0.66 * H.a, cy1 + 0.07 * H.b], [300 - 0.52 * H.a, cy1 + 0.01 * H.b], [300, cy1 - 0.02 * H.b], [300 + 0.52 * H.a, cy1 + 0.01 * H.b], [300 + 0.66 * H.a, cy1 + 0.07 * H.b], [300 + 0.74 * H.a, cy2]];
      p.poly(col, cc, ow * 0.8);
      p.stroke([[300 - 0.55 * H.a, cy1 + 0.1 * H.b], [300 + 0.55 * H.a, cy1 + 0.1 * H.b]], 1.2 * u, shade(o.singlet ?? o.dress ?? o.drape ?? o.coat, 0.6));   // collar seam
    }
  } else face(p, 300, hc, W, expr, facing, look, Math.max(blink, opts.swapLid ?? 0), brim, o, (opts.mouth ?? opts.mouthX) as MouthK | undefined, Math.max(sweat, expr === "breakdown" || expr === "worry" ? 1 : 0), fillK > 0.62 ? mix(HEAD, "#8f55c4", 0.8) : headCol,
    (FACE_UP[expr] ?? 0) + 9 * clamp(opts.headBack ?? 0, 0, 1), opts.monoclePop ?? 0, phase, opts.brow, clamp(opts.steam ?? (expr === "rage" ? 1 : 0), 0, 1));
  if (o.dummy && !BK) { for (const sd of (fs ? [-fs] : [-1, 1])) target(p, 300 + sd * 0.62 * H.a, hc - 0.42 * H.b, 8 * u, u); }
  if (!opts.noHat) hat(p, o, H, hc, light, seed, facing, u, ow, thick, hatLift, hatTilt);
  if (o.monocle && !BK && (opts.monoclePop ?? 0) > 0) monoclePop(p, 300, hc, W, expr, facing, (FACE_UP[expr] ?? 0) + 9 * clamp(opts.headBack ?? 0, 0, 1), opts.monoclePop!);
  if (o.goggles && !BK && !opts.noHat && o.hat && CAPS.has(o.hat)) { // driving goggles pushed up on the cap
    const gy = hc - H.b + 0.3 * HH - hatLift * HH, gx = 300 + 10 * u * facing;
    p.band([[gx - 0.46 * W, gy + 2 * u], [gx + 0.46 * W, gy + 2 * u]], "#5a3a1e", 3 * u, 0.9 * u);
    for (const s of [-1, 1]) { p.ell(gx + s * 13 * u, gy, 10 * u, 8.5 * u, "#8a6a3a", 2 * u); p.ell(gx + s * 13 * u, gy, 7 * u, 5.8 * u, "#9ad7e8", 1.2 * u); p.arc(gx + s * 13 * u - 2 * u, gy - 2 * u, 3 * u, 2.4 * u, 190, 260, 1.6 * u, "rgba(255,255,255,0.9)"); }
  }
  if (opts.armLTop || opts.armRTop) { // arms (and their props) in front of the face: camera to the eye, paper up to the nose
    p.rot = A ? [rad(A), 300, hipY] : null;
    if (opts.armLTop) drawArm(AL, opts.propL, opts.propLAng, -1);
    if (opts.armRTop) drawArm(AR, opts.propR, opts.propRAng, 1);
  }
  p.rot = null;
  if (LIE) p.g.restore();
};

/** crash-test target decal: a circle in black / yellow quarters with an ink ring */
const target = (p: Pen, x: number, y: number, r: number, u: number) => {
  for (let q = 0; q < 4; q++) { const a0 = (q * Math.PI) / 2, pts: P2[] = [[x, y]]; for (let k = 0; k <= 8; k++) { const a = a0 + (k / 8) * (Math.PI / 2); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } p.poly(pts, q % 2 ? "#f2c230" : "#26222c", 0); }
  p.ell(x, y, r, r, null, 1.8 * u);
};
const hair = (p: Pen, o: Look, hp: P2[], H: Blob, hc: number, light: number, fs: number, u: number, ow: number, thick: number) => {
  const col = o.hair; if (!col || o.hairStyle === "bald") return;
  const crown = hc - H.b;
  if (o.hairStyle === "tufts") {
    const y0 = crown + 0.4 * H.b;   // just under the cap band
    for (const s of (fs ? [-fs] : [-1, 1])) {
      const edge = Math.max(...hp.filter(([x, y]) => Math.sign(x - 300) === s && Math.abs(y - (y0 + 0.25 * H.b)) < 0.12 * H.b).map(([x]) => Math.abs(x - 300)), 0.9 * H.a);
      const big = fs ? 1.55 : 1, cx0 = 300 + s * (edge + 0.02 * H.a), cy0 = y0 + 0.24 * H.b * big;
      const patch = ellPts(cx0, cy0, 0.24 * H.a * big, 0.36 * H.b * big);
      p.clip(hp, () => { p.shadedFill(patch, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(patch, null, ow * 0.75);
        for (const k of [0, 1]) p.stroke([[cx0 - s * (0.16 + 0.06 * k) * H.a * big, cy0 - 0.24 * H.b * big], [cx0 - s * (0.1 + 0.04 * k) * H.a * big, cy0 + 0.2 * H.b * big]], 1.1 * u, shade(col, 0.72)); });
    }
    p.inkRing(hp, ow, thick);
    return;
  }
  if (o.hairStyle === "bob") { // 1960s bob: full helmet of hair to the jaw, straight fringe, face window cut out
    const ys = hc + 0.5 * H.b, fr = hc - 0.58 * H.b, wx = 0.74 * H.a, sc = 1.1;   /* r76i (AX rows 1-3): the fringe well above the brows (it sat on the eye line) */
    const outer = hp.filter(([, y]) => y < ys).map(([x, y]) => [300 + (x - 300) * sc, hc + (y - hc) * sc] as P2);
    outer.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300));
    // sorted from the left lower side (angle ~ -180+) over the top to the right lower side: close with the face window
    const L = outer.filter(([x]) => x < 300).sort((a, b) => b[1] - a[1]), Rr = outer.filter(([x]) => x >= 300).sort((a, b) => a[1] - b[1]);
    const wc = 300 + 0.6 * TURN.eye * u * turnK(fs);   // v13: the face window slides with the 3/4 turn, so the far-side hair grows
    const rE = Rr[Rr.length - 1] ?? [300 + H.a, ys] as P2, lE = L[0] ?? [300 - H.a, ys] as P2;   /* r76i (AX row 3: spikes at the jaw corners): the hair ends round off between the outer arc and the face window, inside the head line */
    const ring: P2[] = [...L, ...Rr, [(rE[0] + wc + wx) / 2, Math.max(rE[1], ys) + 0.08 * H.b], [wc + wx, ys], [wc + wx * 0.99, fr + 16 * u], [wc + wx * 0.9, fr + 5 * u], [wc + wx * 0.7, fr + 1 * u], [wc, fr + 2 * u], [wc - wx * 0.7, fr + 1 * u], [wc - wx * 0.9, fr + 5 * u], [wc - wx * 0.99, fr + 16 * u], [wc - wx, ys], [(lE[0] + wc - wx) / 2, Math.max(lE[1], ys) + 0.08 * H.b]];
    p.shadedFill(ring, col, mul(col, SH_FELT), light, H.a, 0.35); p.inkRing(ring, ow * 0.85, thick, 0.35);
    p.stroke(curve([300 - 0.5 * H.a, crown + 0.2 * H.b], [300 - 0.1 * H.a, crown + 0.06 * H.b], [300 + 0.4 * H.a, crown + 0.16 * H.b], 8), 2.2 * u, "rgba(255,255,255,0.25)");
    for (const x of [-0.4, -0.1, 0.25, 0.5]) p.stroke([[300 + x * wx, fr + 1 * u], [300 + x * wx + 1 * u, fr - 7 * u]], 1.1 * u, shade(col, 1.6));
    return;
  }
  if (o.hairStyle === "spiky") { // a full fringe cap of hair to the brow whose crown breaks into messy spikes (Loophole Lou)
    const cut = hc - 0.5 * H.b, sc = 1.06;
    const arc = hp.filter(([, y]) => y < cut).map(([x, y]) => [300 + (x - 300) * sc, hc + (y - hc) * sc] as P2);
    if (arc.length > 3) {
      arc.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300));
      // resample the cap outline evenly, then push the crown out radially in five uneven, slightly swept teeth
      const L: number[] = [0]; for (let i = 1; i < arc.length; i++) L.push(L[i - 1] + Math.hypot(arc[i][0] - arc[i - 1][0], arc[i][1] - arc[i - 1][1]));
      const N = 120, cap: P2[] = [];
      for (let i = 0; i < N; i++) { const d = (i / (N - 1)) * L[L.length - 1]; let j = 1; while (j < L.length - 1 && L[j] < d) j++; const k = (d - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]); cap.push([arc[j - 1][0] + (arc[j][0] - arc[j - 1][0]) * k, arc[j - 1][1] + (arc[j][1] - arc[j - 1][1]) * k]); }
      const AMP = [0.1, 0.24, 0.32, 0.26, 0.13], T0 = 0.1, T1 = 0.92;
      const hair2 = cap.map(([x, y], i) => {
        const u = i / (N - 1); if (u < T0 || u > T1) return [x, y] as P2;
        const w = (u - T0) / (T1 - T0) * AMP.length, k = Math.min(AMP.length - 1, Math.floor(w)), fr = w - k;
        const tooth = Math.pow(Math.max(0, 1 - Math.abs((fr - 0.62) / (fr < 0.62 ? 0.62 : 0.38))), 1.7);
        const g = 1 + AMP[k] * tooth; return [300 + (x - 300) * (1 + (g - 1) * 0.55) + (g - 1) * 0.3 * H.a, hc + (y - hc) * g] as P2;
      });
      p.shadedFill(hair2, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(hair2, null, ow * 0.85);
      for (const x of [-0.62, -0.38, -0.14, 0.1, 0.34, 0.58]) p.stroke(curve([300 + x * H.a, crown + 0.12 * H.b], [300 + (x - 0.04) * H.a, crown + 0.32 * H.b], [300 + (x - 0.02) * H.a, cut - 2 * u], 6), 1.2 * u, "rgba(255,255,255,0.22)");
    }
    return;
  }
  if (o.hairStyle === "bun" || o.hairStyle === "topknot" || o.hairStyle === "short" || o.hairStyle === "cowlick" || o.hairStyle === "parted" || o.hairStyle === "curl"
    || o.hairStyle === "pigtails" || o.hairStyle === "slick") {
    const cut = crown + 0.4 * H.b * 2 * 0.5;
    const arc = hp.filter(([, y]) => y < cut).map(([x, y]) => [300 + (x - 300) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length > 3) { arc.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300)); p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.8); }
    if (o.hairStyle === "bun") p.ell(300 + 4 * u * fs, crown - 9 * u, 16 * u, 13 * u, col, ow * 0.8);
    if (o.hairStyle === "topknot") p.ell(300, crown - 8 * u, 10 * u, 10 * u, col, ow * 0.8);
    if (o.hairStyle === "curl") { // a cheeky curled lock springing up off the crown
      const c0: P2 = [300 + 10 * u * (fs || 1), crown - 4 * u], lk: P2[] = [];
      for (let i = 0; i <= 18; i++) { const t = (i / 18) * 1.7 * Math.PI, r = 10 * u * (1 - 0.55 * i / 18); lk.push([c0[0] + (fs || 1) * Math.cos(t + 2.6) * r, c0[1] + Math.sin(t + 2.6) * r]); }
      lk.unshift([300 + 2 * u * (fs || 1), crown + 6 * u]);
      p.stroke(lk, 6.4 * u, INK); p.stroke(lk, 3 * u, col);
    }
    if (o.hairStyle === "parted") { // centre parting + two combed locks
      const px = 300 + 3 * u * fs;
      p.stroke([[px, crown + 2 * u], [px + u, cut - 1 * u]], 1.8 * u);
      for (const s of [-1, 1]) p.stroke(curve([px + s * 3 * u, crown + 6 * u], [px + s * 16 * u, crown + 10 * u], [px + s * 26 * u, cut + 1 * u], 8), 1.3 * u, shade(col, 0.7));
    }
    if (o.hairStyle === "cowlick") p.poly([[300 - 6 * u, crown + 4 * u], [300 + 10 * u, crown - 22 * u], [300 + 14 * u, crown + 4 * u]], col, ow * 0.7);
    if (o.hairStyle === "slick") { // slicked back with oil: comb lines, a hard side parting, a glossy highlight
      const px = 300 - 14 * u * (fs || 1);
      p.stroke([[px, crown + 4 * u], [px - 2 * u * (fs || 1), cut - 1 * u]], 1.6 * u);
      for (const k of [6, 12, 18, 24]) p.stroke(curve([px + (fs || 1) * 2 * u, crown + k * 0.4 * u + 3 * u], [300 + (fs || 1) * k * 1.2 * u, crown + k * 0.2 * u + 2 * u], [300 + (fs || 1) * (16 + k) * u, cut - 2 * u], 8), 1.1 * u, shade(col, 1.9));
      p.stroke(curve([300 - 20 * u, crown + 6 * u], [300, crown + 2.5 * u], [300 + 22 * u, crown + 7 * u], 8), 3 * u, "rgba(255,255,255,0.4)");
    }
    if (o.hairStyle === "pigtails") p.stroke([[300 + 2 * u * fs, crown + 2 * u], [300 + 3 * u * fs, cut - 1 * u]], 1.6 * u);
  }
};

/** v13 3/4 turn (board AO: in Rick's 3/4 deadpan both eyes sit in the near half of the face). Per unit of `facing`
 *  the eyes slide TURN.eye % of the head width toward the facing side, the mouth TURN.mouth %, and the eye gap
 *  narrows by TURN.gap (foreshortening). At facing 0.7: far eye ~+8 % W, near eye ~+31 % W from the head centre.
 *  The slide stops growing past |facing| 0.75 (turnK) so a full side view keeps glasses and brows inside the head. */
export const TURN = { eye: 34, mouth: 28, gap: 0.1 };   // r6: a clearer 3/4 turn; r7: the eye gap barely narrows (eyes 26-31% W apart, never "sunglasses")
export const turnK = (facing: number) => clamp(facing, -0.72, 0.72);   /* r76e (AX row 6): the far eye stays inside the outline at a 0.8 turn */
/** c1: a brow as a short arched brush stroke: wa thick at a (inner end), tapering to wb at b, bowed up by `lift` */
const browBrush = (p: Pen, a: P2, b: P2, lift: number, wa: number, wb: number) => {
  const N = 12, top: P2[] = [], bot: P2[] = [], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 2 * lift;
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = (1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * mx + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * my + t * t * b[1];
    const dx = 2 * (1 - t) * (mx - a[0]) + 2 * t * (b[0] - mx), dy = 2 * (1 - t) * (my - a[1]) + 2 * t * (b[1] - my), l = Math.hypot(dx, dy) || 1;
    const w = (wa + (wb - wa) * Math.pow(t, 0.8)) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.6))) / 2, nx = -dy / l, ny = dx / l;
    top.push([x + nx * w, y + ny * w]); bot.push([x - nx * w, y - ny * w]);
  }
  p.poly([...top, ...bot.reverse()], INK, 0); p.dot(b[0], b[1], wb / 2, INK);
};
const face = (p: Pen, cx: number, cy0: number, W: number, expr: Face, facing: number, look: number, blink: number, brim: boolean, o: Look, mo: MouthK | undefined, sweat: number, skin = HEAD,
  up = 0, mpop = 0, phase = 0, browOv?: [number, number], steamK = 0) => {
  const u = W / 100, F0 = faceOf(expr), F = browOv ? { ...F0, brow: browOv } : F0, fx = cx + TURN.eye * u * turnK(facing), cy = cy0 - up * u + 4 * u;   /* v15 AX1 row 1/3: the face sits a little lower so a hat can cover the top quarter-third of the head with the brows clear */
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u, ey = cy, exN = ex * (1 - TURN.gap * Math.abs(facing));
  const capped = !!o.hat && CAPS.has(o.hat);
  for (const side of [-1, 1]) {
    const x = fx + side * exN;   // v13: a 3/4 turn slides the eyes to the near half and narrows the gap
    const k0 = F.eye[(facing ? side === Math.sign(facing) : side > 0) ? 1 : 0];
    const kind: XEye = k0 === "x" || k0 === "closed" ? k0 : k0 === "huge" ? (blink >= 1 ? "dash" : blink > 0 ? "shockHalf" : "huge")
      : k0 === "stare" ? (blink >= 1 ? "dash" : "stare") : eyeKind(k0, blink);
    if (o.shades) { p.poly([[x - 11 * u, ey - 7 * u], [x + 11 * u, ey - 7 * u], [x + 10 * u, ey + 6 * u], [x - 10 * u, ey + 6 * u]], "#1d2433", 1.6 * u); continue; }
    if (o.catEye) { // cat-eye sunglasses: upswept outer corners, dark lenses, coloured frames
      const lens: P2[] = [[x - side * 10 * u, ey - 4 * u], [x + side * 6 * u, ey - 6 * u], [x + side * 14 * u, ey - 10 * u], [x + side * 12 * u, ey + 2 * u], [x + side * 4 * u, ey + 7 * u], [x - side * 7 * u, ey + 6 * u]];
      p.poly(lens, o.catEye, 2 * u); p.poly(lens.map(([lx, ly]) => [x + (lx - x) * 0.72, ey + (ly - ey) * 0.7] as P2), "#2a2a3c", 0);
      p.stroke([[x - side * 3 * u, ey - 2 * u], [x + side * 1 * u, ey - 3.5 * u]], 1.4 * u, "rgba(255,255,255,0.6)");
      const [dI, dO] = F.brow, by = ey - (brim ? 18 : 21) * u; taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
      continue;
    }
    if (kind === "x") for (const s of [-1, 1]) p.stroke([[x - 6 * u, ey - 6 * u * s], [x + 6 * u, ey + 6 * u * s]], 3.6 * u);
    else if (kind === "closed") p.arc(x, ey - 2 * u, 8 * u, 5 * u, 20, 160, 3.8 * u);
    else if (kind === "huge") { p.ell(x, ey, 12.5 * u, 13.5 * u, "#ffffff", 2.6 * u); p.dot(x + look * 2 * u, ey + u, 1.9 * u); }
    else if (kind === "stare") { // wide flat stare: white below a dead-level heavy lid, pupil hanging under the lid
      /* r63 (AX row 2): narrower, separate lids (the two flat lids met across the nose and read as spectacles) */
      const er: P2[] = [[x - 8.5 * u, ey - 3 * u], ...ellPts(x, ey - 3 * u, 8.5 * u, 9 * u, 0, 180, 0, 20).reverse().reverse()];
      p.poly(er, "#ffffff", 0); p.dot(x + look * 2.6 * u, ey + 1.6 * u, 3 * u);
      p.ell(x, ey - 3 * u, 8.5 * u, 9 * u, null, 2.4 * u, 0, 180);
      p.stroke([[x - 9.5 * u * side, ey - 3.6 * u], [x + 9.5 * u * side, ey - 2.4 * u]], 4 * u);
    }
    else eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - 17 * u; void brim;   /* v15 7.6: brows about 15 % W above the eyes (20.5 sat them at the crown, under every hat) */   // r26h: a clear gap over half-lidded eyes   // r24: brows ~15 % W clear of the eye (they read as a second lid)
    if (kind === "shock" || kind === "shockHalf" || kind === "huge") p.arc(x, by - 2 * u, 9 * u, 3 * u, 200, 340, 4 * u);   /* r36: lower (the tricorn brim cut the raised brow) */
    else { const tk = Math.abs(turnK(facing)), inner = x - side * 5.5 * u * (1 - 0.3 * tk), outer = side > 0 ? Math.min(x + 7 * u, cx + 43 * u) : Math.max(x - 7 * u, cx - 43 * u);   /* r44: the outer end clamps inside the head and the inner end shortens on turns (shifting the far brow inward merged the pair into one bar) */
      browBrush(p, [inner, by + dI * u], [outer, by + dO * u], 1.6 * u, 7.6 * u, 3 * u); }   /* c1 (AX1 rows 1-2): short arched brush strokes, thick at the inner end (the long flat bars read heavy and stiff) */
    if (o.glasses) { if (o.bigGlasses) { p.ell(x, ey, 14.5 * u, 13.5 * u, "rgba(220,240,255,0.25)", 0); p.ell(x, ey, 14.5 * u, 13.5 * u, null, 2.8 * u); p.arc(x - 4 * u, ey - 5 * u, 7 * u, 5 * u, 200, 250, 1.6 * u, "rgba(255,255,255,0.9)"); }
      else p.ell(x, ey, 12 * u, 11 * u, null, 1.8 * u); }
    if (o.monocle && side > 0 && mpop <= 0) p.ell(x, ey, 12 * u, 12 * u, null, 2.2 * u);
  }
  if (o.glasses) { const gw = o.bigGlasses ? 14.5 : 12; p.stroke([[fx - exN + gw * u, ey - (o.bigGlasses ? 2 : 0) * u], [fx + exN - gw * u, ey - (o.bigGlasses ? 2 : 0) * u]], (o.bigGlasses ? 2.4 : 1.6) * u); }
  if (o.catEye) p.stroke([[fx - exN + 10 * u, ey - 3 * u], [fx + exN - 10 * u, ey - 3 * u]], 1.8 * u, o.catEye);
  if (o.shades) p.stroke([[fx - exN + 11 * u, ey - 3 * u], [fx + exN - 11 * u, ey - 3 * u]], 1.8 * u);
  if (o.goggles && !capped) for (const side of [-1, 1]) p.ell(fx + side * exN, ey - 32 * u, 10 * u, 8 * u, "#9ad7e8", 2 * u);
  const mx = cx + TURN.mouth * u * turnK(facing), my = cy + 20 * u;
  const mk = (mo ?? F.mouth) as XMouth;
  const talkK = typeof mk === "string" && /^t[A-Z]/.test(mk) ? (mk as TalkK) : null;
  const moDy = talkK ? (talkK === "tClosed" ? 0 : talkK === "tWide" || talkK === "tO" ? -2.2 : -1.2) : 0; // the moustache rides the upper lip as the jaw works
  if (talkK) talkMouth(p, talkK, mx, cy + (o.moustache ? 17.5 : 15) * u, u);
  else if (mk === "queasy") { const s: P2[] = []; for (let i = 0; i <= 14; i++) s.push([mx - 10 * u + i * 1.45 * u, my + 2.4 * u * Math.sin(i * 1.15)]); p.stroke(s, 3.4 * u); p.ell(mx + 6 * u, my + 4.5 * u, 3 * u, 3.6 * u, "#a9d98a", 1.6 * u); }
  else if (mk === "puff") { for (const s of [-1, 1]) { const qx = cx + s * 36 * u + 4 * u * facing, qy = cy + 16 * u; p.ell(qx, qy, 15 * u, 13 * u, skin, 0); p.arc(qx, qy, 15 * u, 13 * u, s > 0 ? -95 : 85, s > 0 ? 95 : 275, 4.4 * u); p.ell(qx - s * 2 * u, qy + 2 * u, 6 * u, 3.4 * u, "rgba(242,170,170,0.45)", 0); }
    p.stroke([[mx - 4 * u, my + 1 * u], [mx + 4 * u, my + 1 * u]], 3.4 * u); }
  else if (mk === "teethWide") mouth(p, "teeth", mx, my, u, 1.45);
  else if (mk === "tongue") { p.ell(mx, my, 6 * u, 3 * u, "#5a1e28", 2.6 * u); p.ell(mx + 3 * u, my + 6 * u, 4 * u, 5.5 * u, "#e86e78", 2.2 * u); }
  else if (mk === "guffaw") dmouth(p, mx, my - 1 * u, 19 * u, 17 * u, u, true);
  else if (mk === "beam") dmouth(p, mx, my - 2 * u, 15.5 * u, 10 * u, u);
  else if (mk === "content") p.arc(mx, my - 3 * u, 6 * u, 3.4 * u, 25, 155, 3.6 * u);
  else if (mk === "flat") p.stroke([[mx - 7 * u, my], [mx + 7 * u, my]], 3.8 * u);
  else if (mk === "tache" || mk === "tacheUp") { // a wide arc with curled ends that reads like a handlebar moustache
    const up = mk === "tacheUp", w = 14 * u, cyM = up ? my - 4 * u : my + 5 * u;
    p.arc(mx, cyM, w, 6.5 * u, up ? 18 : 198, up ? 162 : 342, 4.4 * u);
    for (const sd of [-1, 1]) { const ex0 = mx + sd * w * 0.95, ey0 = up ? cyM + 2 * u : cyM - 2.2 * u;
      p.stroke(up ? [[ex0, ey0], [ex0 + sd * 2.6 * u, ey0 - 1.5 * u], [ex0 + sd * 3.6 * u, ey0 - 4.5 * u], [ex0 + sd * 2 * u, ey0 - 6.5 * u]]
        : [[ex0, ey0], [ex0 + sd * 2.8 * u, ey0 + 2.4 * u], [ex0 + sd * 4.6 * u, ey0 + 1.2 * u], [ex0 + sd * 4.2 * u, ey0 - 1.8 * u]], 3.4 * u); } }
  else if (mk === "grit") { // gritted teeth drawn as a grid in a rounded rectangle
    const w = 12 * u, h = 5 * u;
    p.poly([[mx - w, my - h], [mx + w, my - h], [mx + w * 0.94, my + h], [mx - w * 0.94, my + h]], WHITE, 3 * u);
    p.stroke([[mx - w * 0.97, my], [mx + w * 0.97, my]], 1.5 * u);
    for (const j of [-2, -1, 0, 1, 2]) p.stroke([[mx + j * 4.6 * u, my - h], [mx + j * 4.6 * u, my + h]], 1.5 * u); }
  else mouth(p, mk as MouthK, mx, my + (o.moustache ? 3 * u : 0), u);   /* c1: clear of the moustache (the two shapes merged into a pair of lips) */
  if (o.moustache) {
    const st = o.moStyle, mY = (y: number) => cy + (y + moDy - (talkK && st === "walrus" ? 4 : 0)) * u, half = (pts: P2[]) => { const R: P2[] = pts.map(([x, y]) => [mx + x * u, mY(y)]), L: P2[] = pts.map(([x, y]) => [mx - x * u, mY(y)]); return [...L.reverse(), ...R]; };
    if (st === "neat") { const top = half([[0.5, 12.4], [3, 10.8], [8, 10.2], [14, 11.6], [16.5, 13.4]]), bot = half([[0.5, 16], [7, 16.4], [13.5, 15.6], [16.5, 14.2]]); p.poly([...top, ...bot.reverse()], o.moustache, 2.3 * u); }   /* r76i (reviewer: an unoutlined brown bar read as dirt): a shaped moustache with a centre notch and a full plum outline */
    else if (st === "handlebar") for (const s of [-1, 1]) { const pts: P2[] = [[0.5, 11], [9, 9.6], [16, 11], [21.5, 10.6], [25, 9], [25.6, 6.4], [23.4, 6.2], [23.2, 8.4], [20.5, 10], [16, 15.4], [9, 16.8], [0.5, 15.8]];   /* r76b (AX row 1): shorter, lower curls (they climbed to eye height and framed the eyes) */
      p.poly(pts.map(([x, y]) => [mx + s * x * u, mY(y)] as P2), o.moustache, 1.4 * u); p.stroke([[mx + s * 6 * u, mY(13)], [mx + s * 17 * u, mY(12.5)]], 1 * u, shade(o.moustache, 0.72)); }
    else if (st === "walrus") { const top = half([[1, 10], [10, 9], [18, 12], [21.5, 20]]), bot = half([[1, 17], [7, 16], [12, 17.4], [17, 21.6]]); p.poly([...top, ...bot.reverse()], o.moustache, 1.4 * u); }
    else for (const s of [-1, 1]) taper(p, [mx + s * 1.5 * u, cy + (12.5 + moDy) * u], [mx + s * 17 * u, cy + (13 + moDy) * u], 5.5 * u, 1.8 * u, o.moustache);
  }
  if (o.mask) { // the surgical mask: worn over nose-to-chin, or slipped off and dangling from the right ear loop
    const k = MASKK, ear: P2 = [cx + 44 * u * (1 - 0.3 * Math.abs(facing)), cy - 2 * u], c0: P2 = [mx, cy + 22 * u], c1: P2 = [cx + 46 * u, cy + 50 * u];
    const ccx = c0[0] + (c1[0] - c0[0]) * k, ccy = c0[1] + (c1[1] - c0[1]) * k + 10 * u * Math.sin(Math.PI * k), rot = 1.25 * k;
    const RM = (pts: P2[]) => rotPts(pts.map(([x, y]) => [ccx + x * u, ccy + y * u] as P2), rot, ccx, ccy);
    const hw = 30 * (1 - 0.25 * Math.abs(facing)) * (1 - 0.25 * k);
    if (k < 0.98) p.stroke([[ccx - hw * u, ccy - 10 * u], [cx - 44 * u * (1 - 0.3 * Math.abs(facing)) * (1 - k), cy - 2 * u + 40 * u * k]], 1.2 * u, "#d8e4ec");
    p.stroke([[ear[0], ear[1]], RM([[hw, -10]])[0]], 1.2 * u, "#d8e4ec");
    p.poly(RM([[-hw, -14], [hw, -14], [hw - 2, 12], [0, 16], [-hw + 2, 12]]), o.mask, 2.2 * u);
    for (const y of [-6, 1, 8]) p.stroke(RM([[-hw + 4, y], [hw - 4, y]]), 0.9 * u, "rgba(40,70,100,0.35)");
  }
  if (expr === "mock" || expr === "glow") for (const sd of [-1, 1]) p.ell(cx + sd * 24 * u * (1 - TURN.gap * Math.abs(facing)) + TURN.mouth * u * turnK(facing), cy + 10 * u, 7 * u, 3.6 * u, "rgba(240,120,130,0.45)", 0);   // blush
  if (steamK > 0) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { // steam out of the ears: pops in on the key word, then puffs upward on the phase
    const t = ((phase * 1.4 + k / 3) % 1 + 1) % 1, pop = clamp(steamK * 3 - k, 0, 1), sx = cx + sd * (50 + 10 * t) * u, sy = cy - (4 + 26 * t) * u, r = (5 + 6 * t) * u * pop;
    if (pop > 0.05) p.ell(sx, sy, r, r * 0.85, "rgba(248,248,252," + ((0.95 - 0.6 * t) * Math.min(1, pop * 1.5)).toFixed(2) + ")", 1.6 * u); }
  if (sweat > 0) { const sx = cx + (facing >= 0 ? -36 : 36) * u, sy = cy - 22 * u + sweat * 6 * u; p.poly([[sx, sy - 7 * u], [sx + 4 * u, sy + 2 * u], [sx, sy + 5 * u], [sx - 4 * u, sy + 2 * u]], "#8fd0f6", 1.4 * u); }
  if (o.sweaty) for (const [k, dx, dy] of [[0, -44, -10], [0.37, 44, -24], [0.71, 40, 8]] as [number, number, number][]) { // flying sweat drops (slide with phase)
    const t = ((phase * 1.5 + k) % 1 + 1) % 1, sx = cx + (dx + Math.sign(dx) * 8 * t) * u, sy = cy + (dy + 12 * t) * u, r = 1.1 - 0.3 * t;
    p.poly([[sx, sy - 7 * u * r], [sx + 4 * u * r, sy + 2 * u * r], [sx, sy + 5 * u * r], [sx - 4 * u * r, sy + 2 * u * r]], "#8fd0f6", 1.4 * u);
  }
  if (o.monocle && mpop > 0) { /* drawn by monoclePop() after the hat */   } else if (o.monocle && o.monoCord && !o.glasses) { // cord from the monocle down to the lapel
    const P: P2 = [fx + exN, ey + 12 * u], A: P2 = [fx + exN - 8 * u, cy0 + 58 * u];
    p.stroke(curve(P, [P[0] + 12 * u, (P[1] + A[1]) / 2], A, 12), 1.2 * u, "#e8c14a");
  }
};

/** the popped monocle (FigOpts.monoclePop > 0): flies up off the eye, drops and dangles on its gold cord; drawn after the hat */
const monoclePop = (p: Pen, cx: number, cy0: number, W: number, expr: Face, facing: number, up: number, mpop: number) => {
  const u = W / 100, F = faceOf(expr), fx = cx + TURN.eye * u * turnK(facing), cy = cy0 - up * u;
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 13 : 14) * u * (1 - TURN.gap * Math.abs(facing)), ey = cy;
    const ex0: [number, number] = [fx + ex, ey], A: P2 = [fx + ex - 8 * u, cy0 + 58 * u], D: P2 = [fx + ex - 3 * u, cy0 + 84 * u];
    const t1 = clamp(mpop / 0.35, 0, 1), t2 = clamp((mpop - 0.35) / 0.65, 0, 1), top: P2 = [ex0[0] + 15 * u, ex0[1] - 32 * u];
    let P: P2 = mpop < 0.35 ? [ex0[0] + 15 * u * Math.sin(t1 * Math.PI / 2), ex0[1] - 32 * u * Math.sin(t1 * Math.PI / 2)] : lerp2(top, D, Math.min(1, (t2 / 0.3) ** 2));
    if (t2 > 0.3) P = [P[0] + 11 * u * Math.sin((t2 - 0.3) * 16) * (1 - t2) ** 1.2, P[1] - 2 * u * Math.abs(Math.sin((t2 - 0.3) * 16)) * (1 - t2)];
    const spin = Math.cos(mpop * 26), rx = 11 * u * (0.35 + 0.65 * Math.abs(spin));
    const bot: P2 = [P[0], P[1] + 11 * u], sag = Math.max(0, 22 * u - Math.hypot(bot[0] - A[0], bot[1] - A[1]) * 0.5);
    p.stroke(curve(A, [(A[0] + bot[0]) / 2 + 6 * u, (A[1] + bot[1]) / 2 + sag], bot, 12), 1.2 * u, "#e8c14a");
    p.ell(P[0], P[1], rx, 11 * u, "rgba(220,240,255,0.4)", 0); p.ell(P[0], P[1], rx, 11 * u, null, 4.2 * u); p.arc(P[0], P[1], rx, 11 * u, 0, 360, 1.8 * u, "#e8c14a");
    p.arc(P[0] - rx * 0.35, P[1] - 4 * u, rx * 0.4, 4 * u, 200, 260, 1.4 * u, "rgba(255,255,255,0.9)");
    p.dot(A[0], A[1], 1.6 * u, "#e8c14a");
};

const hat = (p: Pen, o: Look, H: Blob, hc: number, light: number, seed: number, turn: number, u: number, ow0: number, thick: number, lift: number, tiltDeg: number) => {
  const k = o.hat; if (!k || k === "none") return;
  const fs = Math.sign(turn), lit = Math.cos(light) >= 0 ? 1 : -1;   // turn: -1..1 (3/4 at +-1); lit: the screen side the light is on
  const W = 2 * H.a, HH = 2 * H.b, cx = 300, crown = hc - H.b - (lift + (o.hatUp ?? 0)) * HH, ow = 0.85 * ow0;   /* r76i: per-look hat seat (drk1: the bowler brim sat on his brows) */
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5) + tiltDeg);
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const col = o.hatCol ?? "#2e2a36", deg = (a * 180) / Math.PI;
  const sag = (yb: number, wb: number): P2[] => { const b: P2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12; b.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); } return b; };
  const lowCap = (cut: number, c: string, n = 1.03) => { // a cap that follows the skull above `cut`
    const pts = blobPts(cx, hc - lift * HH, { ...H, a: H.a * n, b: H.b * n, seed: seed + 2 }).filter(([, y]) => y < cut);
    pts.sort((p1, p2) => Math.atan2(p1[1] - hc, p1[0] - cx) - Math.atan2(p2[1] - hc, p2[0] - cx));
    return R(pts);
  };
  // v10.16 A3: volume. Brim = a curled ellipse (sides lift) drawn behind the crown and shifted with the 3/4 turn;
  // crown bottom and band follow the brim's ellipse so they wrap round; an elliptical lit top; a highlight streak.
  const curled = (y: number, rx: number, ry: number, curl: number, dx = 0): P2[] => ellPts(cx + dx, y, rx, ry, 0, 360, 0, 40).map(([x, yy]) => [x, yy - curl * ((x - cx - dx) / rx) ** 4] as P2);
  const lowerArc = (y: number, rx: number, ry: number, dx = 0): P2[] => ellPts(cx + dx, y, rx, ry, 0, 180, 0, 20);   // left <- right along the front
  if (k === "tophat") {
    const yb = crown + 0.14 * HH /* r71: between - seated deeper (at 0.12 it perched on the crown) with a gap over the brows (at 0.165 they touched the brim) */, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.34 * W, ry = 0.05 * HH, bdx = 7 * u * turn, cdx = 2.5 * u * turn;
    const brim = R(curled(yb + u, 0.47 * W, 0.085 * HH, 0.07 * HH, bdx));
    p.shadedFill(brim, shade(col, 0.9), mul(shade(col, 0.9), SH_FELT), light, 0.47 * W, 0.3); p.poly(brim, null, ow);
    const front = lowerArc(yb, wb, ry, cdx);   // runs right -> left
    const body = R([[cx + cdx + wb, yb], [cx + cdx + wt, yb - ht], [cx + cdx - wt, yb - ht], [cx + cdx - wb, yb], ...front.slice().reverse()]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => {
      const b0 = lowerArc(yb - 0.015 * HH, wb + 2 * u, ry, cdx), b1 = lowerArc(yb - 0.145 * HH, wb + 3 * u, ry, cdx);
      p.poly(R([...b0, ...b1.slice().reverse()]), o.band ?? "#a3262a", 0);
      p.stroke(R(lowerArc(yb - 0.145 * HH, wb + 3 * u, ry, cdx)), 0.9 * u, "rgba(255,255,255,0.18)");
      p.stroke(R([[cx + cdx + lit * 0.19 * W, yb - ht + 0.07 * HH], [cx + cdx + lit * 0.175 * W, yb - 0.2 * HH]]), 3.2 * u, "rgba(255,255,255,0.32)");   // highlight streak
      p.stroke(R([[cx + cdx + lit * 0.25 * W, yb - ht + 0.1 * HH], [cx + cdx + lit * 0.235 * W, yb - 0.3 * HH]]), 1.4 * u, "rgba(255,255,255,0.2)");
    });
    p.poly(body, null, ow);
    const top = R(ellPts(cx + cdx, yb - ht, wt, ry, 0, 360, 0, 32));
    p.poly(top, shade(col, 1.25), ow * 0.8);
    p.stroke(R(ellPts(cx + cdx, yb - ht, wt * 0.8, ry * 0.6, lit > 0 ? 200 : 250, lit > 0 ? 290 : 340, 0, 10)), 1.4 * u, "rgba(255,255,255,0.35)");
  } else if (k === "bowler") {
    const yb = crown + 0.185 * HH,   /* r20: higher - the brim never hides the brows */ bdx = 6 * u * turn, cdx = 2 * u * turn;   /* r53: a clear gap between brim and brows (reviewers: brows pressed under the brims) */
    const brim = R(curled(yb + u, 0.45 * W, 0.075 * HH, 0.06 * HH, bdx));
    p.shadedFill(brim, shade(col, 0.9), mul(shade(col, 0.9), SH_FELT), light, 0.45 * W, 0.3); p.poly(brim, null, ow);
    const dome = R([...lowerArc(yb, 0.33 * W, 0.045 * HH, cdx), ...ellPts(cx + cdx, yb, 0.33 * W, 0.42 * HH, 180, 360)]);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.33 * W, 0.35);
    p.clip(dome, () => {
      const b0 = lowerArc(yb - 0.01 * HH, 0.35 * W, 0.045 * HH, cdx), b1 = lowerArc(yb - 0.09 * HH, 0.35 * W, 0.045 * HH, cdx);
      p.poly(R([...b0, ...b1.slice().reverse()]), o.band ?? shade(col, 0.7), 0);
      /* r53: no glossy highlight arc on the dome (AX1 row 3: hats are flat and matte) */
    });
    p.poly(dome, null, ow);
  } else if (k === "flatcap" || k === "stripecap") {
    // v13 (Rick's newsboy / railroad caps, boards AO + AT): the cap sits HIGH - its band is ~20 % down the head so both brows
    // show under it - and the soft crown puffs up above the skull and overhangs toward the facing side. Panel seams run from
    // a top button, a darker band wraps the bottom edge, and a dark crescent peak hangs under the band toward the face.
    const d = fs || 0, cut = crown + 0.175 * HH, cutL = hc - lift * HH;   /* r68b (AX row 3): a touch higher and a lower, softer crown - it read as a lampshade with the brows squashed under a black peak */   /* r67 (AX row 3): deeper, ~25 % of the head (at 13.5 % the cap sat on the crown like a lid) */   /* v15 AX1 row 3: the cap sits low over the top of the head (the face moved down to keep the brows clear) */   /* r26h: (y runs down) a smaller cut sits the cap HIGHER: brows clear */   /* r26: higher again (the orange cap hid the brows); r20: the peak clears the brows */   /* r53: a clear gap between brim and brows (reviewers: brows pressed under the brims) */
    const raw = blobPts(cx, cutL, { ...H, a: H.a * 1.06, b: H.b * 1.05, seed: seed + 2 }).filter(([, y]) => y < cut);
    raw.sort((p1, p2) => Math.atan2(p1[1] - cutL, p1[0] - cx) - Math.atan2(p2[1] - cutL, p2[0] - cx));
    const top0 = Math.min(...raw.map(([, y]) => y)), span = Math.max(1, cut - top0);
    const hw = Math.max(...raw.map(([x]) => Math.abs(x - cx)));   // the skull's half-width at the band
    const dome = raw.map(([x, y]) => { const h = (cut - y) / span, sx = 1.03;   /* r76i (AX row 3: the cap hung past the head like a lid): head-width */   // band = the skull width there (+5 %, so it wraps), the soft crown balloons out above it
      return [cx + (x - cx) * sx * (1 + 0.08 * Math.sin(Math.PI * Math.min(1, h * 1.8))) + d * 0.08 * W * h * h, cut - (cut - y) * 1.4] as P2; });
    void hw;
    if (dome.length < 3) return;
    const cap = R(dome), topY = cut - span * 1.4, btn: P2 = [cx + d * 0.08 * W, topY + 0.035 * HH];
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(cap, () => {
      for (const t of [-0.75, -0.38, 0, 0.38, 0.75]) { // panel seams fanning out from the top button
        const end: P2 = [cx + d * 0.05 * W + t * 0.56 * W, cut + 2 * u], mid: P2 = [(btn[0] + end[0]) / 2 + t * 0.12 * W, (btn[1] + end[1]) / 2 - 0.02 * HH];
        if (k === "stripecap") p.band(R(curve(btn, mid, end, 10)), o.band ?? "#e8eef4", 0.055 * W, 0);
        else p.stroke(R(curve(btn, mid, end, 10)), 1.3 * u, shade(col, 0.74));
      }
      p.band(R([[cx - 0.7 * W, cut - 0.028 * HH], [cx + 0.7 * W, cut - 0.028 * HH]]), shade(col, k === "stripecap" ? 0.55 : 0.72), 0.056 * HH, 0);   // the band
      p.stroke(R(curve([cx - 0.42 * W, topY + 0.12 * HH], [cx - 0.12 * W - d * 0.05 * W, topY + 0.03 * HH], [cx + 0.18 * W, topY + 0.05 * HH], 10)), 2.6 * u, "rgba(255,255,255,0.34)");   // highlight streak
    });
    p.clip(cap, () => p.stroke(R([[cx - 0.6 * W, cut - 0.056 * HH], [cx + 0.6 * W, cut - 0.056 * HH]]), 1.4 * u, shade(col, 0.45)));
    p.poly(cap, null, ow);
    const [bx, by] = R([btn])[0]; p.ell(bx, by, 0.035 * W, 0.03 * W, shade(col, 0.82), 1.4 * u);
    const [vx, vy] = R([[cx + d * 0.13 * W, cut - 0.5 * u]])[0];   // the peak
    p.ell(vx, vy, 0.36 * W, 0.055 * HH, shade(col, k === "stripecap" ? 0.5 : 0.78), ow, 0, 180, deg);
    p.stroke(R([[cx + d * 0.13 * W - 0.24 * W, cut + 1.5 * u], [cx + d * 0.13 * W + 0.24 * W, cut + 1.5 * u]]), 1.6 * u, "rgba(255,255,255,0.22)");
  } else if (k === "toque") {   // r76i (AX row 3): a baker's tall white toque - a pleated band and a puffed crown (the low disc read as a beret)
    const cut = crown + 0.16 * HH, bw = 0.4 * W, bh = 0.13 * HH;
    const band = R([[cx - bw, cut], [cx + bw, cut], [cx + bw * 1.02, cut - bh], [cx - bw * 1.02, cut - bh]]);
    const puffs: [number, number, number, number][] = [[-0.26, -0.3, 0.22, 0.17], [0.24, -0.3, 0.22, 0.17], [0, -0.38, 0.27, 0.2], [-0.12, -0.24, 0.2, 0.14], [0.13, -0.24, 0.2, 0.14]];
    for (const [dx, dy, rx, ry] of puffs) { const pts = R(ellPts(cx + dx * W, cut + dy * HH, rx * W, ry * HH, 0, 360)); p.shadedFill(pts, col, mul(col, SH_FELT), light, rx * W, 0.35); p.poly(pts, null, ow); }
    p.shadedFill(band, col, mul(col, SH_FELT), light, bw, 0.35); p.poly(band, null, ow);
    for (let i = 1; i < 6; i++) p.stroke(R([[cx - bw + i * bw / 3, cut - 2 * u], [cx - bw + i * bw / 3, cut - bh + 2 * u]]), 1.1 * u, "rgba(120,110,100,0.5)");
  } else if (k === "beanie") {
    const cut = crown + 0.2 * HH;   /* v15 AX1 row 3 */ /* r48: back (raised, the straight turn-up stuck out past the head) */   /* r26h: higher for the raised brows; r20: the turn-up sits above the brows */
    const cap = lowCap(cut, col, k === "beanie" ? 1.06 : 1.04);
    if (cap.length < 3) return;
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    if (o.band) p.clip(cap, () => { for (let i = 0; i < 7; i++) { const y = crown - 0.1 * HH + i * 0.08 * HH; if (k === "beanie") p.band(R([[cx - W, y], [cx + W, y]]), o.band!, 0.035 * HH, 0); else p.band(R([[cx - 0.6 * W + i * 0.16 * W, cut], [cx - 0.3 * W + i * 0.1 * W, crown - 0.05 * HH]]), o.band!, 0.03 * HH, 0); } });
    p.poly(cap, null, ow);
    if (k === "beanie") p.poly(R([[cx - 0.52 * W, cut - 0.07 * HH], [cx + 0.52 * W, cut - 0.07 * HH], [cx + 0.53 * W, cut + 0.02 * HH], [cx - 0.53 * W, cut + 0.02 * HH]]), shade(col, 0.85), ow * 0.8);
    else { const [px, py] = R([[cx + 6 * u * (fs || 1), cut + 1.5 * u]])[0]; p.ell(px, py, 0.34 * W, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg); }
  } else if (k === "nightcap") { // long floppy night cap with a pompom, the tail drooping behind the head
    const cut = crown + 0.34 * HH, d = fs || 1;
    const tail = R([[cx - 0.34 * W, crown + 0.08 * HH], [cx + 0.2 * W, crown - 0.02 * HH], [cx - d * 0.6 * W, crown + 0.02 * HH], [cx - d * 0.82 * W, crown + 0.42 * HH], [cx - d * 0.66 * W, crown + 0.12 * HH]]);
    p.shadedFill(tail, col, mul(col, SH_FELT), light, H.a, 0.35); if (o.band) p.clip(tail, () => { for (let i = 0; i < 5; i++) p.band(R([[cx - d * (0.2 + i * 0.13) * W, crown - 0.2 * HH], [cx - d * (0.28 + i * 0.13) * W, crown + 0.5 * HH]]), o.band!, 0.035 * HH, 0); });
    p.poly(tail, null, ow);
    const cap = lowCap(cut, col, 1.06); if (cap.length < 3) return;
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    if (o.band) p.clip(cap, () => { for (let i = 0; i < 6; i++) { const x0 = cx - 0.7 * W + i * 0.28 * W; p.band(R([[x0, cut], [x0 + 0.12 * W, crown - 0.05 * HH]]), o.band!, 0.035 * HH, 0); } });
    p.poly(cap, null, ow);
    p.poly(R([[cx - 0.53 * W, cut - 0.06 * HH], [cx + 0.53 * W, cut - 0.06 * HH], [cx + 0.54 * W, cut + 0.02 * HH], [cx - 0.54 * W, cut + 0.02 * HH]]), "#f4efe4", ow * 0.8);
    const [qx, qy] = R([[cx - d * 0.82 * W, crown + 0.45 * HH]])[0]; p.ell(qx, qy, 0.075 * W, 0.075 * W, "#f4efe4", ow * 0.8);
  } else if (k === "straw") {
    const yb = crown + 0.145 * HH;   // r39: higher again (one brow hid under the brim on 3/4 turns); r26h: higher still (the raised brows tucked under the brim); r12/r23/r25: sits higher so both brows show under the brim, raised brows included (board A)   /* r53: a clear gap between brim and brows (reviewers: brows pressed under the brims) */
    const top = R([...sag(yb, 0.3 * W).reverse(), [cx - 0.28 * W, yb - 0.2 * HH], [cx + 0.28 * W, yb - 0.2 * HH]]);
    const [bx, by] = R([[cx, yb + u]])[0];
    p.ell(bx, by, 0.6 * W, 0.08 * HH, col, ow, 0, 360, deg);
    p.shadedFill(top, col, mul(col, SH_FELT), light, 0.3 * W, 0.35); p.poly(top, null, ow);
    p.band(R([[cx - 0.29 * W, yb - 0.06 * HH], [cx + 0.29 * W, yb - 0.06 * HH]]), o.band ?? "#b5282e", 0.07 * HH, 0.6 * u);
  } else if (k === "madras" || k === "turban") {
    const cut = crown + 0.42 * HH;
    const wrap = lowCap(cut, col, 1.12);
    if (wrap.length < 3) return;
    p.shadedFill(wrap, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(wrap, () => {
      if (k === "madras") for (let i = -8; i < 8; i++) { p.band([[cx + i * 0.1 * W, crown - HH], [cx + i * 0.1 * W, cut]], "rgba(196,40,40,0.55)", 0.025 * W, 0); p.band([[cx - W, crown + i * 0.06 * HH], [cx + W, crown + i * 0.06 * HH]], "rgba(196,40,40,0.45)", 0.02 * HH, 0); }
      else for (let i = 0; i < 4; i++) p.stroke(R(curve([cx - 0.6 * W, cut - i * 0.1 * HH], [cx + 0.05 * W, cut - 0.14 * HH - i * 0.1 * HH], [cx + 0.6 * W, cut - 0.05 * HH - i * 0.09 * HH])), 1.6 * u, shade(col, 0.78));
    });
    p.poly(wrap, null, ow);
    if (k === "madras") p.poly(R([[cx + 0.12 * W, crown + 0.02 * HH], [cx + 0.26 * W, crown - 0.22 * HH], [cx + 0.34 * W, crown - 0.1 * HH], [cx + 0.26 * W, crown + 0.06 * HH]]), col, ow * 0.8);
    if (k === "turban" && o.jewel) { const [jx, jy] = R([[cx, crown + 0.16 * HH]])[0]; p.ell(jx, jy, 4 * u, 5 * u, o.jewel, 1.4 * u); }
  } else if (k === "bicorne" || k === "tricorn") {
    const yb = crown + 0.215 * HH;   /* r71 (AX row 3): a touch lower - it perched on the crown covering ~14 % (brows still clear) */   /* r44: higher again (the brim hid his shocked brows) */   /* r26h: a touch higher for the raised brows */   /* r53: a clear gap between brim and brows (reviewers: brows pressed under the brims) */
    /* r62 (AX row 6): the tricorn turns with the head - its front point and peaks slide toward the face, the far wing drops back (a fixed front shape slid over the turned face) */
    const tt = clamp(turn, -0.85, 0.85), fl = 0.08 * Math.max(tt, 0), fr = 0.08 * Math.max(-tt, 0);
    const pts = R([[cx - 0.62 * W + 0.1 * W * tt, yb + 0.02 * HH], [cx - 0.4 * W + 0.16 * W * tt, yb - (0.38 - fl) * HH], [cx + 0.2 * W * tt, yb - 0.26 * HH], [cx + 0.4 * W + 0.16 * W * tt, yb - (0.38 - fr) * HH], [cx + 0.62 * W + 0.1 * W * tt, yb + 0.02 * HH], [cx + 0.26 * W * tt, yb - 0.06 * HH]]);
    p.shadedFill(pts, col, mul(col, SH_FELT), light, 0.6 * W, 0.35); p.poly(pts, null, ow);
    p.stroke(R([[cx - 0.56 * W + 0.1 * W * tt, yb - 0.01 * HH], [cx - 0.38 * W + 0.16 * W * tt, yb - (0.33 - fl) * HH], [cx + 0.2 * W * tt, yb - 0.22 * HH], [cx + 0.38 * W + 0.16 * W * tt, yb - (0.33 - fr) * HH], [cx + 0.56 * W + 0.1 * W * tt, yb - 0.01 * HH]]), 1.8 * u, o.band ?? "#e8c14a");
    /* r63 (AX row 3): a felt sheen along the cocked crown and a shadow under the front point (the tricorn read as one flat tone) */
    p.stroke(R([[cx - 0.36 * W + 0.16 * W * tt, yb - (0.3 - fl) * HH], [cx - 0.12 * W + 0.18 * W * tt, yb - 0.25 * HH]]), 2.4 * u, mix(col, "#ffffff", 0.32));
    p.stroke(R([[cx - 0.28 * W + 0.24 * W * tt, yb - 0.02 * HH], [cx + 0.26 * W * tt, yb - 0.07 * HH], [cx + 0.28 * W + 0.24 * W * tt, yb - 0.02 * HH]]), 2.2 * u, mul(col, SH_FELT));
    if (k === "bicorne") { const [bx, by] = R([[cx + 0.05 * W, yb - 0.2 * HH]])[0]; p.ell(bx, by, 4.5 * u, 4.5 * u, "#e8c14a", 1.4 * u); }
  } else if (k === "crown") {
    const yb = crown + 0.2 * HH;
    const pts = R([[cx - 0.3 * W, yb], [cx - 0.34 * W, yb - 0.3 * HH], [cx - 0.17 * W, yb - 0.16 * HH], [cx, yb - 0.38 * HH], [cx + 0.17 * W, yb - 0.16 * HH], [cx + 0.34 * W, yb - 0.3 * HH], [cx + 0.3 * W, yb]]);
    p.shadedFill(pts, "#f2c94c", "#c08a1c", light, 0.34 * W, 0.35); p.poly(pts, null, ow);
    for (const [x, y] of [[-0.34, -0.3], [0, -0.38], [0.34, -0.3]] as P2[]) { const [c] = R([[cx + x * W, yb + y * HH]]); p.poly([[c[0], c[1] - 8 * u], [c[0] + 4 * u, c[1] - 1 * u], [c[0], c[1] + 3 * u], [c[0] - 4 * u, c[1] - 1 * u]], "#c8f1ff", 1.2 * u); }
    const [jx, jy] = R([[cx, yb - 0.09 * HH]])[0]; p.ell(jx, jy, 4 * u, 4 * u, "#c8352e", 1.2 * u);
  } else if (k === "hood") {   // plague video: a hunter's pointed cloth hood that frames the face
    const cut = crown + 0.34 * HH, cap = lowCap(cut, col, 1.12);
    if (cap.length < 3) return;
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(cap, null, ow);
    const tip = R([[cx - 0.2 * W, crown - 0.02 * HH], [cx + 0.05 * W, crown - 0.02 * HH], [cx - 0.32 * W, crown - 0.3 * HH]]);
    p.shadedFill(tip, col, mul(col, SH_FELT), light, 0.2 * W, 0.35); p.poly(tip, null, ow);
    p.band(R([[cx - 0.62 * W, cut - 0.02 * HH], [cx + 0.62 * W, cut - 0.02 * HH]]), shade(col, 0.7), 0.05 * HH, 0);
  } else if (k === "helm") {   // plague video: a steel knight's helm with a nose guard and rivets
    const cut = crown + 0.3 * HH, cap = lowCap(cut, col, 1.08);
    if (cap.length < 3) return;
    p.shadedFill(cap, col, shade(col, 0.62), light, H.a, 0.55); p.poly(cap, null, ow);
    p.stroke(R([[cx - 0.18 * W, crown + 0.06 * HH], [cx + 0.1 * W, crown + 0.02 * HH]]), 3 * u, "rgba(255,255,255,0.5)");
    p.band(R([[cx - 0.66 * W, cut - 0.03 * HH], [cx + 0.66 * W, cut - 0.03 * HH]]), shade(col, 0.6), 0.07 * HH, ow * 0.6);
    p.band(R([[cx + 0.02 * W * fs, cut - 0.03 * HH], [cx + 0.02 * W * fs, cut + 0.16 * HH]]), shade(col, 0.75), 0.05 * W, ow * 0.6);
    for (const dx of [-0.45, -0.22, 0.22, 0.45]) { const [c] = R([[cx + dx * W, cut - 0.03 * HH]]); p.ell(c[0], c[1], 2.2 * u, 2.2 * u, shade(col, 1.2), 0.8 * u); }
  } else if (k === "horns") {  // plague video: the boss's dark cowl with two curled horns
    const cut = crown + 0.36 * HH, cap = lowCap(cut, col, 1.14);
    if (cap.length < 3) return;
    for (const sd of [-1, 1]) { const hn = R([[cx + sd * 0.3 * W, crown + 0.08 * HH], [cx + sd * 0.62 * W, crown - 0.16 * HH], [cx + sd * 0.72 * W, crown - 0.42 * HH], [cx + sd * 0.54 * W, crown - 0.22 * HH], [cx + sd * 0.16 * W, crown + 0.02 * HH]]);
      p.shadedFill(hn, "#e8dcc0", "#a8946a", light, 0.2 * W, 0.4); p.poly(hn, null, ow); }
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(cap, null, ow);
  } else if (k === "jester") { // plague video: a two-pointed jester cap with bells
    const cut = crown + 0.22 * HH, cap = lowCap(cut, col, 1.06);
    if (cap.length < 3) return;
    for (const sd of [-1, 1]) { const pt = R([[cx + sd * 0.05 * W, crown + 0.02 * HH], [cx + sd * 0.5 * W, crown - 0.22 * HH], [cx + sd * 0.78 * W, crown + 0.06 * HH], [cx + sd * 0.42 * W, crown + 0.08 * HH]]);
      p.shadedFill(pt, sd < 0 ? col : (o.band ?? "#f4c430"), mul(sd < 0 ? col : (o.band ?? "#f4c430"), SH_FELT), light, 0.3 * W, 0.35); p.poly(pt, null, ow);
      const [b] = R([[cx + sd * 0.78 * W, crown + 0.1 * HH]]); p.ell(b[0], b[1], 4.5 * u, 4.5 * u, "#f2c94c", 1.2 * u); }
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(cap, null, ow);
  } else if (k === "fedora") { // pinched crown, wide brim, ribbon band
    const yb = crown + 0.24 * HH;
    const [bx, by] = R([[cx + 3 * u * fs, yb + u]])[0];
    p.ell(bx, by, 0.6 * W, 0.075 * HH, shade(col, 0.9), ow, 0, 360, deg);
    const body = R([...sag(yb, 0.31 * W).reverse(), [cx - 0.27 * W, yb - 0.34 * HH], [cx - 0.1 * W, yb - 0.4 * HH], [cx, yb - 0.3 * HH], [cx + 0.1 * W, yb - 0.4 * HH], [cx + 0.27 * W, yb - 0.34 * HH]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.3 * W, 0.4);
    p.clip(body, () => p.band(R([[cx - 0.4 * W, yb - 0.07 * HH], [cx + 0.4 * W, yb - 0.07 * HH]]), o.band ?? shade(col, 0.6), 0.09 * HH, 0.6 * u));
    p.poly(body, null, ow);
  } else if (k === "kepi") { // gendarme kepi: stiff cylinder, coloured top, black visor
    const yb = crown + 0.3 * HH, ht = 0.42 * HH;
    const body = R([...sag(yb, 0.31 * W).reverse(), [cx - 0.27 * W, yb - ht], [cx + 0.27 * W, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.3 * W, 0.4);
    p.clip(body, () => { p.band(R([[cx - 0.4 * W, yb - 0.08 * HH], [cx + 0.4 * W, yb - 0.08 * HH]]), o.band ?? "#c9a227", 0.05 * HH, 0); p.band(R([[cx - 0.4 * W, yb - ht + 0.04 * HH], [cx + 0.4 * W, yb - ht + 0.04 * HH]]), "#b3262e", 0.1 * HH, 0); });
    p.poly(body, null, ow);
    const [tx, ty] = R([[cx, yb - ht]])[0]; p.ell(tx, ty, 0.27 * W, 0.05 * HH, "#b3262e", ow, 0, 360, deg);
    const [vx, vy] = R([[cx + 4 * u * (fs || 1), yb + 2 * u]])[0]; p.ell(vx, vy, 0.32 * W, 0.08 * HH, "#1e1c26", ow, 0, 180, deg);
  } else if (k === "cloche") { // 1920s bell hat pulled low, flower on the band
    const cut = crown + 0.26 * HH;   /* r68 (AX row 3): the band sat on the brows at 0.34 */   /* r52 (AX1 row 3): above the brows (at 0.5 it hid them) */
    const bell = lowCap(cut, col, 1.1);
    if (bell.length < 3) return;
    p.shadedFill(bell, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(bell, () => p.band(R([[cx - W, cut - 0.1 * HH], [cx + W, cut - 0.1 * HH]]), o.band ?? shade(col, 0.7), 0.06 * HH, 0));
    p.poly(bell, null, ow);
    const [fx, fy] = R([[cx + 0.32 * W * (fs || 1), cut - 0.1 * HH]])[0]; p.ell(fx, fy, 6 * u, 6 * u, o.jewel ?? "#f2c230", 1.2 * u); p.dot(fx, fy, 2 * u, "#b3262e");
  } else if (k === "beret" && o.band) { // r69 (AX row 3): a baker's puffed cloth cap - a band that wraps round the skull (curved, shifts with the turn) under a lumpy soft crown leaning to the facing side (the flat disc read as a plate)
    const cdx = 4 * u * turn, yb = crown + 0.21 * HH, bw = 0.47 * W, ry = 0.055 * HH, bh = 0.085 * HH;
    const b0 = lowerArc(yb, bw, ry, cdx), b1 = lowerArc(yb - bh, bw * 1.02, ry, cdx);
    const dome: P2[] = [];
    for (let i = 0; i <= 24; i++) { const t = Math.PI * (1 - i / 24), lump = 1 + 0.07 * Math.sin(t * 5 + 0.6); dome.push([cx + cdx * 1.8 + 0.04 * W * turn + Math.cos(t) * 0.56 * W * lump, yb - bh - Math.sin(t) * 0.36 * HH * lump]); }
    const domeP = R([...dome, ...b1]);
    p.shadedFill(domeP, col, mul(col, SH_FELT), light, 0.56 * W, 0.4); p.poly(domeP, null, ow);
    for (const t of [0.3, 0.55, 0.8]) { const x = cx + cdx * 1.8 + Math.cos(Math.PI * t) * 0.4 * W; p.stroke(R(curve([x, yb - bh - 0.03 * HH], [x + 0.03 * W, yb - bh - 0.17 * HH], [x - 0.02 * W, yb - bh - 0.27 * HH], 8)), 1.6 * u, shade(col, 0.8)); }
    p.stroke(R(curve([cx - 0.28 * W, yb - bh - 0.22 * HH], [cx - 0.08 * W, yb - bh - 0.32 * HH], [cx + 0.14 * W, yb - bh - 0.3 * HH], 10)), 2.6 * u, "rgba(255,255,255,0.4)");
    const bandP = R([...b0, ...b1.slice().reverse()]); p.poly(bandP, o.band, ow * 0.8);
    p.stroke(R(lowerArc(yb - bh * 0.5, bw * 1.01, ry, cdx)), 1.1 * u, "rgba(255,255,255,0.25)");
  } else if (k === "beret") { // painter's beret, tipped to one side
    const [bx, by] = R([[cx + 0.06 * W, crown + 0.08 * HH]])[0];
    p.ell(bx, by, 0.46 * W, 0.14 * HH, col, ow, 0, 360, deg - 8);
    p.stroke(R([[cx + 0.08 * W, crown - 0.06 * HH], [cx + 0.1 * W, crown - 0.14 * HH]]), 3 * u, shade(col, 0.7));
  } else if (k === "bonnet") {
    // r14: a filled, outlined cloth cap with a ruffled front edge (the open arc read as a see-through halo)
    const cap = lowCap(crown + 0.075 * HH, col, 1.08);   /* r47: higher (her brows were under the ruffle) */   /* r36: higher again (her brows were lost in the ruffle); r26: higher (a brow was under it); r20: the ruffle sits above the brows */
    if (cap.length >= 3) { p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(cap, null, ow); }
    const [bx, by] = R([[cx, crown + 0.11 * HH]])[0];
    /* r76b (AX row 3): the ruffle as a row of small outlined scallops inside the head (the thick open strokes ran past the outline) */
    for (let i = 0; i <= 8; i++) { const a = rad(194 + i * 19); p.ell(bx + 0.42 * W * Math.cos(a), by + 0.07 * HH * Math.sin(a), 4.4 * u, 3.6 * u, shade(col, 0.93), 1.2 * u); }
    /* r52 (AX1 row 3): no tie on the cheek (in 3/4 it landed on the face and read as an earpiece) */   /* v15 7.6: the tie in the bonnet's own colour (a red dot at the cheek read as a coloured ear) */
  } else if (k === "headband") { // cloth band round the forehead, knot + two tails at the back side
    const hb = blobPts(cx, hc - lift * HH, { ...H, a: H.a * 1.035, b: H.b * 1.035, seed: seed + 2 });
    const halfW = (y: number) => Math.max(0, ...hb.filter(([, yy]) => Math.abs(yy - y) < 0.05 * HH).map(([x]) => Math.abs(x - cx)));
    const y1 = crown + 0.17 * HH, y2 = crown + 0.29 * HH, w1 = halfW(y1), w2 = halfW(y2), top: P2[] = [], bot: P2[] = [];
    for (let i = 0; i <= 14; i++) { const t = (2 * i) / 14 - 1; top.push([cx + w1 * t, y1 + 4 * u * (1 - t * t)]); bot.push([cx + w2 * t, y2 + 4.5 * u * (1 - t * t)]); }
    const bandP = R([...top, ...bot.reverse()]);
    const s2 = fs ? -fs : -1, [kx, ky] = R([[cx + s2 * w1 * 0.98, (y1 + y2) / 2]])[0];
    for (const d of [0.5, 1.15]) p.poly(R([[cx + s2 * w1 * 0.95, y1 + 4 * u], [cx + s2 * (w1 + 16 * u), y1 + d * 22 * u], [cx + s2 * (w1 + 12 * u), y1 + d * 22 * u + 8 * u], [cx + s2 * w1 * 0.95, y2]]), shade(col, 0.88), ow * 0.7);
    p.shadedFill(bandP, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(bandP, null, ow * 0.8);
    p.ell(kx, ky, 5 * u, 6 * u, shade(col, 0.92), ow * 0.6);
    if (o.band) p.clip(bandP, () => p.band(R([[cx - W, (y1 + y2) / 2 + 3 * u], [cx + W, (y1 + y2) / 2 + 3 * u]]), o.band!, 0.03 * HH, 0));
  } else if (k === "mailcap") { // postman's peaked cap: soft flared crown, band, black visor, small brass badge
    const yb = crown + 0.3 * HH, ht = 0.3 * HH;
    const body = R([...sag(yb, 0.32 * W).reverse(), [cx - 0.37 * W, yb - ht + 0.03 * HH], [cx - 0.3 * W, yb - ht], [cx + 0.3 * W, yb - ht], [cx + 0.37 * W, yb - ht + 0.03 * HH]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.34 * W, 0.4);
    p.clip(body, () => p.band(R([[cx - 0.45 * W, yb - 0.06 * HH], [cx + 0.45 * W, yb - 0.06 * HH]]), o.band ?? shade(col, 0.62), 0.09 * HH, 0.6 * u));
    p.poly(body, null, ow);
    const [vx, vy] = R([[cx + 5 * u * (fs || 1), yb + 2 * u]])[0]; p.ell(vx, vy, 0.34 * W, 0.075 * HH, "#1e1c26", ow, 0, 180, deg);
    const [bx, by] = R([[cx + 4 * u * fs, yb - 0.17 * HH]])[0];
    p.ell(bx, by, 6 * u, 5 * u, "#e8c14a", 1.4 * u, 0, 360, deg); p.arc(bx, by, 2.6 * u, 2 * u, 200, 520, 1.1 * u);
  } else if (k === "laurel") { // green laurel wreath round the crown
    const ry = 0.1 * HH, rx = 0.5 * W, yc = crown + 0.2 * HH - lift * HH;
    const leaf = (t: number, front: boolean, out: number) => {
      const a0 = rad(t), x = cx + Math.cos(a0) * rx, y = yc + Math.sin(a0) * ry, tang = Math.atan2(Math.cos(a0) * ry, -Math.sin(a0) * rx);
      const [c] = R([[x, y]]); p.ell(c[0] + Math.cos(tang + out) * 3 * u, c[1] + Math.sin(tang + out) * 3 * u, 7 * u, 3.2 * u, front ? "#6fae4a" : "#4e8a38", 1.4 * u, 0, 360, deg + (tang + out * 0.6) * 180 / Math.PI);
    };
    p.stroke(R(ellPts(cx, yc, rx, ry, 190, 350)), 1.6 * u, "#6b4a2f");
    for (let t = 196; t <= 344; t += 14) leaf(t, false, (t / 14) % 2 ? 0.7 : -0.7);
    p.stroke(R(ellPts(cx, yc, rx, ry, 10, 170)), 1.8 * u, "#6b4a2f");
    for (let t = 8; t <= 172; t += 13) if (Math.abs(t - 90) > 9) leaf(t, true, (t / 13) % 2 ? 0.7 : -0.7);
    const [bx, by] = R([[cx, yc + ry]])[0]; p.ell(bx, by, 3.4 * u, 3.4 * u, "#f2c230", 1.2 * u);
  } else if (k === "picture") { // 1904 lady's wide picture hat: big brim, low crown, ribbon, flowers, a feather
    const yb = crown + 0.2 * HH;
    const [bx, by] = R([[cx + 3 * u * fs, yb + u]])[0];
    p.ell(bx, by, 0.8 * W, 0.11 * HH, shade(col, 0.95), ow, 0, 360, deg - 3);
    const top = R([...sag(yb, 0.3 * W).reverse(), ...ellPts(cx, yb, 0.3 * W, 0.26 * HH, 180, 360)]);
    p.shadedFill(top, col, mul(col, SH_FELT), light, 0.3 * W, 0.35);
    p.clip(top, () => p.band(R([[cx - 0.4 * W, yb - 0.05 * HH], [cx + 0.4 * W, yb - 0.05 * HH]]), o.band ?? "#b3262e", 0.08 * HH, 0.6 * u));
    p.poly(top, null, ow);
    const fside = fs ? -fs : 1;
    p.poly(R([[cx + fside * 0.12 * W, yb - 0.1 * HH], [cx + fside * 0.28 * W, yb - 0.5 * HH], [cx + fside * 0.5 * W, yb - 0.56 * HH], [cx + fside * 0.34 * W, yb - 0.3 * HH], [cx + fside * 0.22 * W, yb - 0.08 * HH]]), "#f6f1e6", ow * 0.6);
    for (const [dx, dy, r] of [[0.22, -0.08, 7], [0.32, -0.04, 6], [0.13, -0.03, 5.5]] as [number, number, number][]) { const [c] = R([[cx + fside * dx * W, yb + dy * HH]]); p.ell(c[0], c[1], r * u, r * u, o.jewel ?? "#e05a7a", 1.4 * u); p.dot(c[0], c[1], 1.8 * u, "#f2c230"); }
  } else hat68(p, o, H, hc, light, seed, fs, u, ow, thick, lift, R, sag, lowCap, crown, col, deg);
};

/** 1968 bridge hats: cowboy, hardhat, custodian, trilby, headscarf, baseball, sunhat, bucket */
const hat68 = (p: Pen, o: Look, H: Blob, hc: number, light: number, seed: number, fs: number, u: number, ow: number, thick: number, lift: number,
  R: (pts: P2[]) => P2[], sag: (yb: number, wb: number) => P2[], lowCap: (cut: number, c: string, n?: number) => P2[], crown: number, col: string, deg: number) => {
  const k = o.hat, W = 2 * H.a, HH = 2 * H.b, cx = 300, d = fs || 0;
  void seed; void thick; void lift;
  if (k === "cowboy") { // white straw cattleman: crown with a centre crease, wide brim curling up at the sides, band + silver concho
    const yb = crown + 0.165 * HH, bw = 0.84 * W, ox = d * 3 * u;
    const bot = (t: number) => yb + 0.075 * HH * (1 - t * t) - 0.17 * HH * Math.abs(t) ** 4.5;
    const top = (t: number) => yb - 0.03 * HH * (1 - t * t) - 0.17 * HH * Math.abs(t) ** 4.5 - 0.028 * HH * t * t;
    const N = 24, brimP: P2[] = [];
    for (let i = 0; i <= N; i++) { const t = -1 + (2 * i) / N; brimP.push([cx + ox + t * bw, bot(t)]); }
    for (let i = N; i >= 0; i--) { const t = -1 + (2 * i) / N; brimP.push([cx + ox + t * bw * 0.985, top(t)]); }
    const br = R(brimP);
    p.shadedFill(br, col, mul(col, SH_FELT), light, 0.8 * W, 0.25); p.poly(br, null, ow);
    const lip: P2[] = []; for (let i = 0; i <= N; i++) { const t = -1 + (2 * i) / N; lip.push([cx + ox + t * bw * 0.97, bot(t) - 0.022 * HH * (1 - t * t)]); }
    p.stroke(R(lip.slice(2, N - 1)), 1.2 * u, shade(col, 0.78)); // the rolled edge
    const wb = 0.3 * W, wt = 0.26 * W, ht = 0.38 * HH;
    const crownP = R([...sag(yb - 0.02 * HH, wb).reverse(),
      ...curve([cx - wb, yb - 0.02 * HH], [cx - 0.29 * W, yb - ht * 0.6], [cx - wt, yb - ht * 0.92], 8),
      ...curve([cx - wt, yb - ht * 0.92], [cx - 0.22 * W, yb - ht * 1.06], [cx - 0.1 * W, yb - ht * 1.02], 6).slice(1),
      ...curve([cx - 0.1 * W, yb - ht * 1.02], [cx, yb - ht * 0.84], [cx + 0.1 * W, yb - ht * 1.02], 6).slice(1),
      ...curve([cx + 0.1 * W, yb - ht * 1.02], [cx + 0.22 * W, yb - ht * 1.06], [cx + wt, yb - ht * 0.92], 6).slice(1),
      ...curve([cx + wt, yb - ht * 0.92], [cx + 0.29 * W, yb - ht * 0.6], [cx + wb, yb - 0.02 * HH], 8).slice(1)]);
    p.shadedFill(crownP, col, mul(col, SH_FELT), light, 0.3 * W, 0.4);
    p.clip(crownP, () => {
      for (let i = 1; i <= 4; i++) p.stroke(R(curve([cx - 0.32 * W, yb - 0.08 * HH - i * 0.065 * HH], [cx, yb - 0.06 * HH - i * 0.065 * HH], [cx + 0.32 * W, yb - 0.08 * HH - i * 0.065 * HH], 10)), 0.7 * u, shade(col, 0.88)); // straw rows
      p.band(R(curve([cx - 0.4 * W, yb - 0.065 * HH], [cx, yb - 0.04 * HH], [cx + 0.4 * W, yb - 0.065 * HH], 10)), o.band ?? "#22C7E0", 0.08 * HH, 0.7 * u);
      p.stroke(R(curve([cx - 0.4 * W, yb - 0.095 * HH], [cx, yb - 0.075 * HH], [cx + 0.4 * W, yb - 0.095 * HH], 10)), 0.9 * u, "rgba(255,255,255,0.55)");
      p.stroke(R(curve([cx - 0.2 * W, yb - ht * 0.85], [cx - 0.23 * W, yb - ht * 0.5], [cx - 0.21 * W, yb - ht * 0.25], 6)), 2.4 * u, "rgba(255,255,255,0.6)");
    });
    p.poly(crownP, null, ow);
    p.stroke(R(curve([cx, yb - ht * 0.86], [cx + 0.01 * W, yb - ht * 0.66], [cx + 0.02 * W, yb - ht * 0.48], 6)), 1.5 * u, shade(col, 0.68)); // centre crease
    const [kx, ky] = R([[cx + 0.22 * W * (d || 1), yb - 0.06 * HH]])[0]; p.ell(kx, ky, 4.4 * u, 4.4 * u, "#d9dde2", 1.2 * u); p.dot(kx, ky, 1.6 * u, "#8a919c");
  } else if (k === "hardhat") { // 1960s hard hat: dome with a centre ridge, all-round brim, small front peak
    const yb = crown + 0.26 * HH, wb = 0.36 * W;
    const dome = R([...sag(yb, wb).reverse(), ...ellPts(cx, yb, wb, 0.42 * HH, 180, 360)]);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, wb, 0.35);
    p.clip(dome, () => { p.band(R([[cx + 2 * u * d, yb - 0.44 * HH], [cx + 2 * u * d, yb]]), shade(col, 1.08), 0.07 * HH, 0.7 * u);
      for (const s of [-1, 1]) p.stroke(R(curve([cx + s * 0.16 * W, yb - 0.38 * HH], [cx + s * 0.2 * W, yb - 0.2 * HH], [cx + s * 0.22 * W, yb], 8)), 1.1 * u, shade(col, 0.78)); });
    p.poly(dome, null, ow);
    p.stroke(R([[cx - 0.24 * W, yb - 0.3 * HH], [cx - 0.12 * W, yb - 0.37 * HH]]), 2.6 * u, "rgba(255,255,255,0.55)");
    const [bx, by] = R([[cx + 3 * u * d, yb + u]])[0];
    p.ell(bx, by, 0.47 * W, 0.06 * HH, shade(col, 0.88), ow, 0, 360, deg);
    const [vx, vy] = R([[cx + (d ? d * 0.18 * W : 0), yb + 2 * u]])[0]; p.ell(vx, vy, 0.24 * W, 0.075 * HH, shade(col, 0.82), ow * 0.9, 0, 180, deg);
  } else if (k === "custodian") { // London bobby helmet: tall dome, comb, rose knob, star badge, chin strap
    const yb = crown + 0.27 * HH, ht = 0.92 * HH;
    const shell = R([...sag(yb, 0.34 * W).reverse(), ...curve([cx - 0.34 * W, yb], [cx - 0.32 * W, yb - ht * 0.75], [cx - 0.06 * W, yb - ht], 10),
      ...curve([cx - 0.06 * W, yb - ht], [cx, yb - ht * 1.02], [cx + 0.06 * W, yb - ht], 4).slice(1), ...curve([cx + 0.06 * W, yb - ht], [cx + 0.32 * W, yb - ht * 0.75], [cx + 0.34 * W, yb], 10).slice(1)]);
    for (const s of [-1, 1]) p.stroke(R(curve([cx + s * 0.33 * W, yb + 0.02 * HH], [cx + s * 0.4 * W, hc + 0.5 * H.b], [cx + 6 * u * d, hc + 0.96 * H.b], 10)), 2.2 * u, INK); // chin strap
    p.shadedFill(shell, col, mul(col, SH_FELT), light, 0.34 * W, 0.4);
    p.clip(shell, () => { p.band(R([[cx - 0.5 * W, yb - 0.05 * HH], [cx + 0.5 * W, yb - 0.05 * HH]]), shade(col, 0.8), 0.07 * HH, 0.6 * u);
      p.stroke(R([[cx + 2 * u * d, yb - ht], [cx + 2 * u * d, yb - 0.12 * HH]]), 1.4 * u, shade(col, 0.72)); });
    p.poly(shell, null, ow);
    p.stroke(R([[cx - 0.22 * W, yb - ht * 0.66], [cx - 0.16 * W, yb - ht * 0.84]]), 2.6 * u, "rgba(255,255,255,0.35)");
    const [tx, ty] = R([[cx, yb - ht - 3 * u]])[0]; p.ell(tx, ty, 5 * u, 4.5 * u, "#d9dde2", 1.4 * u);
    const [sx, sy] = R([[cx + 4 * u * d, yb - 0.27 * HH]])[0]; const star: P2[] = [];
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 8 + rad(deg), r = (i % 2 ? 5.5 : 11) * u; star.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r * 1.1]); }
    p.poly(star, "#e8ecf0", 1.4 * u); p.ell(sx, sy, 4 * u, 4.4 * u, "#c9ced6", 1 * u, 0, 360, deg);
    const [bx, by] = R([[cx + 3 * u * d, yb + u]])[0]; p.ell(bx, by, 0.4 * W, 0.055 * HH, shade(col, 0.85), ow, 0, 360, deg);
  } else if (k === "trilby") { // short-brimmed trilby: pinched crown, narrow brim snapped down at the front
    const yb = crown + 0.24 * HH;
    const [bx, by] = R([[cx + 3 * u * d, yb + u]])[0];
    p.ell(bx, by, 0.46 * W, 0.06 * HH, shade(col, 0.9), ow, 0, 360, deg);
    const body = R([...sag(yb, 0.3 * W).reverse(), [cx - 0.27 * W, yb - 0.27 * HH], [cx - 0.12 * W, yb - 0.33 * HH], [cx, yb - 0.25 * HH], [cx + 0.12 * W, yb - 0.33 * HH], [cx + 0.27 * W, yb - 0.27 * HH]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.3 * W, 0.4);
    p.clip(body, () => p.band(R([[cx - 0.4 * W, yb - 0.06 * HH], [cx + 0.4 * W, yb - 0.06 * HH]]), o.band ?? shade(col, 0.6), 0.075 * HH, 0.6 * u));
    p.poly(body, null, ow);
    const [fx, fy] = R([[cx - 0.22 * W * (d || 1), yb - 0.09 * HH]])[0]; p.poly([[fx, fy], [fx - (d || 1) * 7 * u, fy - 10 * u], [fx - (d || 1) * 2 * u, fy - 1 * u]], o.jewel ?? "#c8352e", 1 * u);
  } else if (k === "headscarf") { // knotted headscarf: covers the crown and frames the face, knot + tails under the chin
    const cut = crown + 0.36 * HH, sc2 = lowCap(cut, col, 1.07);
    const side = (s: number): P2[] => R([[cx + s * 0.93 * H.a, cut - 0.04 * HH], [cx + s * 1.05 * H.a, hc + 0.15 * H.b], [cx + s * 0.78 * H.a, hc + 0.78 * H.b], [cx + s * 0.3 * H.a, hc + 0.98 * H.b], [cx + s * 0.38 * H.a, hc + 0.84 * H.b], [cx + s * 0.72 * H.a, hc + 0.5 * H.b], [cx + s * 0.8 * H.a, cut + 0.02 * HH]]);
    for (const s of [-1, 1]) { const sp = side(s); p.shadedFill(sp, shade(col, 0.95), mul(col, SH_FELT), light, H.a, 0.3); p.poly(sp, null, ow * 0.8); }
    if (sc2.length < 3) return;
    p.shadedFill(sc2, col, mul(col, SH_FELT), light, H.a, 0.35);
    const dots = o.band ?? "#fbf3e3";
    p.clip(sc2, () => { for (let i = -6; i <= 6; i++) for (let j = 0; j < 4; j++) { const [q] = R([[cx + i * 0.1 * W + (j % 2) * 0.05 * W, crown + 0.02 * HH + j * 0.09 * HH]]); p.dot(q[0], q[1], 2.2 * u, dots); } });
    p.poly(sc2, null, ow);
    p.stroke(R(curve([cx - 0.88 * H.a, cut - 0.01 * HH], [cx, cut + 0.03 * HH], [cx + 0.88 * H.a, cut - 0.01 * HH], 10)), 2.6 * u, shade(col, 0.8)); // folded front edge
    const [kx, ky] = R([[cx + 6 * u * d, hc + 1.0 * H.b]])[0];
    for (const t of [-1, 1]) p.poly([[kx, ky], [kx + t * 12 * u, ky + 10 * u], [kx + t * 7 * u, ky + 16 * u]], shade(col, 0.9), 1.4 * u);
    p.ell(kx, ky, 5 * u, 4 * u, col, 1.4 * u);
  } else if (k === "baseball") { // baseball / painter's cap: low crown, button, panel seams, visor to the facing side
    const cut = crown + 0.33 * HH, cap = lowCap(cut, col, 1.05);
    if (cap.length < 3) return;
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(cap, () => { for (const s of [-0.45, 0.45]) p.stroke(R(curve([cx + s * 0.1 * W, crown - 0.02 * HH], [cx + s * 0.5 * W, crown + 0.1 * HH], [cx + s * 0.9 * W, cut], 8)), 1.1 * u, shade(col, 0.75));
      if (o.band) p.band(R([[cx - W, cut - 0.04 * HH], [cx + W, cut - 0.04 * HH]]), o.band, 0.05 * HH, 0); });
    p.poly(cap, null, ow);
    const [tx, ty] = R([[cx, crown - 0.01 * HH - lift * HH]])[0]; p.ell(tx, ty, 3.4 * u, 2.4 * u, shade(col, 0.85), 1.2 * u, 0, 360, deg);
    if (o.jewel) { const [jx, jy] = R([[cx + 4 * u * d, crown + 0.17 * HH]])[0]; const st: P2[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 3 : 7) * u; st.push([jx + Math.cos(a) * r, jy + Math.sin(a) * r]); } p.poly(st, o.jewel, 1 * u); }
    const vc = d ? cx + d * 0.42 * W : cx, [vx, vy] = R([[vc, cut + 1.5 * u]])[0];
    p.ell(vx, vy, d ? 0.42 * W : 0.38 * W, 0.08 * HH, shade(col, 0.82), ow, 0, 180, deg + d * 4);
  } else if (k === "sunhat" || k === "bucket") { // sun hat: soft low crown + wide floppy brim; bucket: short sloping brim
    const yb = crown + 0.22 * HH, wide = k === "sunhat";
    const brim: P2[] = [];
    for (let i = 0; i <= 24; i++) { const t = -1 + i / 12, x = t * (wide ? 0.78 : 0.5) * W; brim.push([cx + x + d * 3 * u, yb + (wide ? 0.11 : 0.1) * HH * (1 - 0.3 * t * t) + (wide ? 0.03 * HH * Math.sin(t * 5) : 0)]); }
    for (let i = 24; i >= 0; i--) { const t = -1 + i / 12, x = t * (wide ? 0.62 : 0.36) * W; brim.push([cx + x + d * 3 * u, yb - 0.04 * HH * (1 - t * t)]); }
    const bp = R(brim); p.shadedFill(bp, shade(col, 0.95), mul(col, SH_FELT), light, 0.7 * W, 0.3); p.poly(bp, null, ow);
    const top = R([...sag(yb, (wide ? 0.33 : 0.35) * W).reverse(), ...ellPts(cx, yb, (wide ? 0.33 : 0.32) * W, (wide ? 0.3 : 0.34) * HH, 180, 360)]);
    p.shadedFill(top, col, mul(col, SH_FELT), light, 0.33 * W, 0.35);
    p.clip(top, () => { p.band(R([[cx - 0.45 * W, yb - 0.05 * HH], [cx + 0.45 * W, yb - 0.05 * HH]]), o.band ?? shade(col, 0.7), 0.07 * HH, 0.6 * u);
      if (!wide) for (let i = 1; i < 4; i++) p.stroke(R([[cx - 0.4 * W, yb - 0.09 * HH - i * 0.06 * HH], [cx + 0.4 * W, yb - 0.09 * HH - i * 0.06 * HH]]), 0.9 * u, shade(col, 0.8)); });
    p.poly(top, null, ow);
    if (wide && o.jewel) { const [fx, fy] = R([[cx - 0.24 * W * (d || 1), yb - 0.06 * HH]])[0]; for (let j = 0; j < 5; j++) { const a = (j * Math.PI * 2) / 5; p.ell(fx + Math.cos(a) * 3.4 * u, fy + Math.sin(a) * 3.4 * u, 3.4 * u, 3.4 * u, o.jewel, 0.9 * u); } p.dot(fx, fy, 2 * u, "#f2c230"); }
  } else if (k === "caping") { // Javanese caping: a wide, shallow woven bamboo cone sitting on the crown, chin cord
    const yb = crown + 0.2 * HH, dx = (fs || 0) * 3 * u, apex: P2 = [cx + dx * 0.5, yb - 0.36 * HH];
    const cone: P2[] = [apex]; for (let i = 0; i <= 24; i++) { const t = -1 + i / 12; cone.push([cx + dx + t * 0.82 * W, yb + 0.07 * HH * (1 - t * t) - 0.02 * HH * t * t]); }
    const cp = R(cone); p.shadedFill(cp, col, mul(col, SH_FELT), light, 0.7 * W, 0.4);
    p.clip(cp, () => { for (let i = -10; i <= 10; i++) p.stroke(R([apex, [cx + dx + (i / 10) * 0.85 * W, yb + 0.09 * HH]]), 0.8 * u, shade(col, 0.72));
      for (let r2 = 1; r2 < 4; r2++) { const f2 = r2 / 4; p.stroke(R(ellPts(cx + dx * (0.5 + 0.5 * f2), apex[1] + f2 * 0.42 * HH, f2 * 0.82 * W, f2 * 0.08 * HH, 0, 180, 0, 18)), 0.9 * u, shade(col, 0.78)); } });
    p.poly(cp, null, ow); p.band(R([[cx + dx - 0.8 * W, yb + 0.06 * HH], [cx + dx + 0.8 * W, yb + 0.06 * HH]]), shade(col, 0.6), 0.025 * HH, 0);
  } else if (k === "pith") { // 1930s pith helmet: tall rounded dome, a sloping brim all round (deeper at the back), a dark band
    const yb = crown + 0.24 * HH, dx = (fs || 0) * 3 * u;
    const brim: P2[] = []; for (let i = 0; i <= 24; i++) { const t = -1 + i / 12; brim.push([cx + dx + t * 0.66 * W, yb + 0.1 * HH * (1 - 0.4 * t * t) + 0.02 * HH * (fs || 0) * t]); }
    for (let i = 24; i >= 0; i--) { const t = -1 + i / 12; brim.push([cx + dx + t * 0.46 * W, yb - 0.03 * HH * (1 - t * t)]); }
    const bp = R(brim); p.shadedFill(bp, shade(col, 0.95), mul(col, SH_FELT), light, 0.6 * W, 0.3); p.poly(bp, null, ow);
    const dome = R([...sag(yb, 0.42 * W).reverse(), ...ellPts(cx + dx * 0.4, yb, 0.42 * W, 0.46 * HH, 180, 360)]);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.42 * W, 0.4);
    p.clip(dome, () => { p.band(R([[cx - 0.5 * W, yb - 0.06 * HH], [cx + 0.5 * W, yb - 0.06 * HH]]), o.band ?? "#5a4a34", 0.08 * HH, 0.6 * u);
      for (let i = -2; i <= 2; i++) p.stroke(R(curve([cx + dx * 0.4 + i * 0.16 * W, yb - 0.1 * HH], [cx + dx * 0.4 + i * 0.1 * W, yb - 0.32 * HH], [cx + dx * 0.4, yb - 0.46 * HH])), 0.8 * u, shade(col, 0.8)); });
    p.poly(dome, null, ow); const [kx, ky] = R([[cx + dx * 0.4, yb - 0.46 * HH]])[0]; p.ell(kx, ky, 3.2 * u, 2.2 * u, shade(col, 0.8), ow * 0.7);
  } else if (k === "peci") { // songkok / peci: a black velvet oval cap, flat top, slightly tapered, sitting high on the crown
    const yb = crown + 0.2 * HH, ht = 0.3 * HH, dx = (fs || 0) * 2 * u;
    const body = R([...sag(yb, 0.36 * W).reverse(), [cx + dx - 0.32 * W, yb - ht], [cx + dx + 0.32 * W, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.34 * W, 0.4);
    p.clip(body, () => { p.band(R([[cx - 0.4 * W, yb - ht * 0.55], [cx + 0.4 * W, yb - ht * 0.55]]), "rgba(255,255,255,0.12)", 0.03 * HH, 0); });
    p.poly(body, null, ow); const [tx, ty] = R([[cx + dx, yb - ht]])[0]; p.ell(tx, ty, 0.32 * W, 0.045 * HH, shade(col, 1.25), ow, 0, 360, deg);
  }
};

// ---------------- non-human cast: species "dog" | "rat" (same ink + flat paint), profile, facing right unless facing < 0 ----------------
/** union of shapes outlined as one silhouette (double pass: thick ink under, fills on top) */
const union = (p: Pen, shapes: { pts: P2[]; fill: string }[], ol: number) => { for (const s of shapes) p.poly(s.pts, s.fill, ol * 2); for (const s of shapes) p.poly(s.pts, s.fill, 0); };
const critterEye = (p: Pen, expr: Face, x: number, y: number, u: number, blink: number, bg: string) => {
  const k = faceOf(expr).eye[1] as XEye;
  if (k === "x") { for (const s of [-1, 1]) p.stroke([[x - 6 * u, y - 6 * u * s], [x + 6 * u, y + 6 * u * s]], 3.4 * u); return k; }
  if (k === "closed") { p.arc(x, y - 2 * u, 7 * u, 4.5 * u, 20, 160, 3.4 * u); return k; }
  const kk: EyeK = k === "huge" ? "shock" : k === "lid" || k === "slit" ? (blink >= 1 ? "dash" : "dot") : eyeKind(k as EyeK, blink);
  eye(p, kk, x, y, u, 1, 0.5, bg);
  return kk;
};
const creature = (p: Pen, o: Look, opts: FigOpts) => {
  const fsx = Math.sign(opts.facing ?? 1) || 1, g = p.g;
  p.rot = null; g.save();
  if (fsx < 0) { g.translate(600, 0); g.scale(-1, 1); }
  const L0 = opts.light ?? rad(-120), light = fsx < 0 ? Math.PI - L0 : L0;
  if (o.species === "dog") dog(p, o, opts, light); else if (o.species === "rat") rat(p, o, opts, light); else critter68(p, o, opts, light);
  g.restore();
};

/** scruffy farm dog, ~0.6 m at the shoulder (card scale 1). Modes: stand (tail wags with phase), run (gallop, phase-driven,
 *  panting tongue), sit. Barks (open jaw, fangs) with mouth "O" or expr angry / talk / shock / laugh / joy. */
const dog = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 5 * u, thick = thickAngle(light), two = Math.PI * 2;
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const fur = o.fur ?? "#c39257", dark = o.patch ?? "#6e4a2a", muzz = "#f0e2c6", legN = mix(fur, INK, 0.12), legF = mix(fur, INK, 0.42);
  const RUN = mode === "run", SIT = mode === "sit", t = two * phase;
  const pitch = RUN ? 0.09 * Math.sin(t + 0.6) : SIT ? -0.6 : -0.03;
  const bc: P2 = SIT ? [250, 812] : [280, 774 + (RUN ? 8 - 20 * Math.max(0, Math.sin(t + 0.9)) : 0)];
  const at = (x: number, y: number): P2 => [bc[0] + x * Math.cos(pitch) - y * Math.sin(pitch), bc[1] + x * Math.sin(pitch) + y * Math.cos(pitch)];
  const B: Blob = { a: 130, b: 72, nTop: 2.3, nBot: 2.2, egg: 0.04, asym: 0.07, rot: pitch, noise: 0.012, seed: o.seed + 3 };
  const bp = blobPts(bc[0], bc[1], B);
  const ground = 971;
  // ---- tail (behind) ----
  const wag = RUN ? 0.2 * Math.sin(2 * t) : 0.5 * Math.sin(2 * t);
  const tb = at(-118, -24), tr = (x: number, y: number): P2 => { const a = wag + pitch; return [tb[0] + x * Math.cos(a) - y * Math.sin(a), tb[1] + x * Math.sin(a) + y * Math.cos(a)]; };
  const tailPts = RUN ? curve(tb, tr(-56, -22), tr(-104, -40), 10) : curve(tb, tr(-34, -42), tr(-40, -98), 10);
  tube(p, tailPts, 22, 9, fur, ow * 0.7);
  const tip = tailPts[tailPts.length - 1];
  p.poly([[tip[0] - 9, tip[1] + 4], [tip[0] - 16, tip[1] - 12], [tip[0] - 2, tip[1] - 4], [tip[0] + 2, tip[1] - 18], [tip[0] + 8, tip[1] + 2]], fur, ow * 0.6);
  // ---- legs (all behind the body: far pair darker) ----
  const leg = (front: boolean, near: boolean) => {
    const A = at(front ? 78 : -86, 20), col = near ? legN : legF, dx = near ? 0 : -14;
    let P: P2;
    if (RUN) { const th = t + (front ? 0 : Math.PI) + (near ? 0 : 0.6); P = [A[0] + dx + 54 * Math.cos(th), Math.min(ground, A[1] + 185 - 58 * Math.max(0, -Math.sin(th)))]; }
    else if (SIT) P = front ? [bc[0] + 92 + dx, ground] : [bc[0] - 4 + dx, ground];
    else P = [A[0] + dx + (front ? 8 : -6), ground];
    let pts: P2[];
    if (front) { const [k, f] = ik(A, P, 94, 94, -1); pts = curve(A, k, f, 10); P = f; }
    else if (SIT) { pts = curve(A, [A[0] + 40, A[1] + 30], P, 10); }
    else { const hock: P2 = [P[0] - 16, P[1] - 46], [k, h] = ik(A, hock, 70, 70, 1); pts = [...curve(A, k, h, 10), P]; P = [P[0], P[1]]; }
    p.band(pts, col, 19, 2.8, "round");
    p.ell(P[0] + 8, P[1] - 4, 15, 8.5, near ? shade(fur, 0.95) : legF, 2.6);
  };
  leg(true, false); leg(false, false); leg(false, true); leg(true, true);
  // ---- scruff spikes (under the body fill: only their tips stick out) ----
  const spike = (x: number, y: number, dx: number, dy: number, w: number, col: string) => { const a = at(x - w, y), b = at(x + w, y), c = at(x + dx, y + dy); p.poly([a, c, b], col, ow * 0.6); };
  for (const [x, s] of [[-84, 0.8], [-58, 1], [-34, 0.7]] as [number, number][]) spike(x, -54, -14 * s, -22 * s, 12, fur);
  for (const x of [-40, 10]) spike(x, 56, -8, 16, 10, fur);
  spike(112, 18, 22, 22, 14, muzz);
  // ---- body ----
  p.gradFill(bp, fur, mul(fur, SH_CLOTH), light);
  p.clip(bp, () => {
    p.ell(...at(-46, -32), 54, 30, dark, 0);
    p.ell(...at(96, 34), 44, 38, muzz, 0);
    for (const [x, y] of [[-80, 6], [-40, 18], [20, -20], [60, -4]] as P2[]) { const q = at(x, y); p.stroke([[q[0] - 8, q[1] - 4], [q[0], q[1] + 4], [q[0] + 8, q[1] - 4]], 1.4 * u, shade(fur, 0.78)); }
  });
  p.inkRing(bp, ow, thick);
  if (SIT) { const hq = at(-62, 22); const hb = blobPts(hq[0], hq[1], { a: 56, b: 44, nTop: 2.2, nBot: 2.2, egg: 0, asym: 0, rot: 0.3, noise: 0.01, seed: o.seed + 8 }); p.gradFill(hb, fur, mul(fur, SH_CLOTH), light); p.inkRing(hb, ow * 0.8, thick); }
  if (o.collar) { p.band([at(92, -56), at(116, -4)], o.collar, 11, 1.6); const tg = at(112, 2); p.ell(tg[0], tg[1] + 8, 6, 6, "#e8c14a", 1.6); }
  // ---- head ----
  const N = at(98, -44), bob = RUN ? 5 * Math.sin(t + 1.2) : 0;
  const hx = N[0] + 40, hy = N[1] - (SIT ? 58 : 44) + bob;
  const bark = opts.mouth === "O" || ["angry", "talk", "shock", "laugh", "joy"].includes(expr), open = bark || RUN;
  const flop = RUN ? -0.45 + 0.28 * Math.sin(t + 2) : bark ? -0.2 : 0;
  const ear = (near: boolean) => {
    const ax = hx + (near ? -30 : -12), ay = hy - 38, R = (x: number, y: number): P2 => [ax + x * Math.cos(flop) - y * Math.sin(flop), ay + x * Math.sin(flop) + y * Math.cos(flop)];
    const ep = [R(-10, -6), R(16, -6), R(12, 30), R(0, 62), R(-16, 64), R(-26, 36), R(-22, 6)];
    if (near) { p.shadedFill(ep, dark, mul(dark, SH_FELT), light, 40, 0.35); p.poly(ep, null, ow * 0.75); } else p.poly(ep, mix(dark, INK, 0.3), ow * 0.75);
  };
  ear(false);
  for (const [x, l] of [[-26, 26], [-8, 32], [10, 22]] as P2[]) p.poly([[hx + x - 10, hy - 46], [hx + x - 8, hy - 50 - l], [hx + x + 10, hy - 48]], fur, ow * 0.6);
  const HB: Blob = { a: 66, b: 58, nTop: 2.0, nBot: 2.5, egg: 0.06, asym: 0.04, rot: -0.05, noise: 0.012, seed: o.seed + 5 };
  const hp = blobPts(hx, hy, HB);
  p.shadedFill(hp, fur, mul(fur, SH_SKIN), light, HB.a); p.inkRing(hp, ow, thick);
  const sy = open ? -6 : 0;
  if (open) { // cavity + lower jaw under the muzzle
    p.poly([[hx + 34, hy + 26], [hx + 98, hy + 18], [hx + 92, hy + 62], [hx + 44, hy + 62]], "#5a1e28", ow * 0.7);
    if (!RUN) p.ell(hx + 62, hy + 54, 15, 7, "#e86e78", 0);
    const jw = blobPts(hx + 64, hy + 68, { a: 34, b: 11, nTop: 2.2, nBot: 2.2, egg: 0, asym: 0, rot: 0.12, noise: 0.01, seed: o.seed + 6 });
    p.shadedFill(jw, muzz, mul(muzz, SH_SKIN), light, 34); p.inkRing(jw, ow * 0.7, thick);
  } else p.stroke(curve([hx + 40, hy + 40], [hx + 62, hy + 47], [hx + 84, hy + 36]), 3.2 * u);
  const sn = blobPts(hx + 60, hy + 20 + sy, { a: 40, b: 26, nTop: 2.1, nBot: 2.4, egg: 0.08, asym: 0.05, rot: -0.06, noise: 0.01, seed: o.seed + 4 });
  const mz = mix(fur, muzz, 0.65); p.shadedFill(sn, mz, mul(mz, SH_SKIN), light, 40); p.inkRing(sn, ow * 0.8, thick);
  if (open) for (const x of [hx + 54, hx + 86]) p.poly([[x - 5, hy + 40 + sy], [x + 5, hy + 39 + sy], [x, hy + 54 + sy]], "#ffffff", 1.2 * u);
  if (RUN) { const tg = curve([hx + 44, hy + 54], [hx + 36, hy + 74], [hx + 26 + 6 * Math.sin(t), hy + 92], 8); tube(p, tg, 16, 14, "#e86e78", 1.8 * u); p.stroke(tg.slice(1, 6), 1.2 * u, "#b84a56"); }
  p.ell(hx + 96, hy + 7 + sy, 13, 10, "#2a1f2a", 0); p.ell(hx + 92, hy + 3 + sy, 4, 2.6, "rgba(255,255,255,0.7)", 0);
  for (const [x, y] of [[74, 24], [82, 28]] as P2[]) p.dot(hx + x, hy + y + sy, 1.1 * u, shade(mz, 0.55));
  const ek = critterEye(p, expr, hx + 24, hy - 12, u, blink, fur);
  if (ek !== "x" && ek !== "shock") { const ang = expr === "angry" ? 5 : expr === "dismay" || expr === "nervous" ? -4 : 0; taper(p, [hx + 34, hy - 30 + ang * u], [hx + 12, hy - 33 - ang * 0.4 * u], 5 * u, 2.5 * u); }
  ear(true);
};

/** a small rat, drawn ~5x life size: place it with CastPlace scale ~0.2 (a 25 cm rat). Modes: stand (sniffing: nose and
 *  whiskers twitch with phase), run (scurry), lie (keeled over on its back, legs up; use expr "dead" for X eyes or "dizzy"). */
const rat = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 7 * u, thick = thickAngle(light), two = Math.PI * 2;
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const fur = o.fur ?? "#8f8a98", belly = "#d6cfd3", pink = "#eda6ae", t = two * phase;
  const LIE = mode === "lie", RUN = mode === "run";
  if (LIE) {
    tube(p, curve([190, 935], [96, 975], [34, 950], 10), 22, 6, pink, ow * 0.55);
    for (const [x, dx] of [[220, -18], [262, -6], [352, 6], [388, 16]] as P2[]) { const top: P2 = [x + dx, 790 + Math.abs(dx) * 0.6]; p.band([[x, 890], top], pink, 13, 3, "round"); for (const s of [-1, 0, 1]) p.dot(top[0] + s * 6, top[1] - 6, 3.4); }
    const bp = blobPts(300, 912, { a: 122, b: 60, nTop: 2.2, nBot: 2.4, egg: -0.05, asym: -0.06, rot: 0, noise: 0.01, seed: o.seed });
    p.gradFill(bp, fur, mul(fur, SH_CLOTH), light);
    p.clip(bp, () => p.ell(300, 868, 104, 44, belly, 0));
    p.inkRing(bp, ow, thick);
    const hx = 420, hy = 900, a = -0.55;
    const R = (x: number, y: number): P2 => [hx + x * Math.cos(a) - y * Math.sin(a), hy + x * Math.sin(a) + y * Math.cos(a)];
    const head = blobPts(hx, hy, { a: 62, b: 48, nTop: 2.2, nBot: 2.4, egg: 0, asym: 0, rot: a, noise: 0.01, seed: o.seed + 2 });
    const cone = [R(20, -40), R(110, -2), R(20, 42)];
    p.ell(...R(-14, 40), 26, 22, fur, ow * 0.7); p.ell(...R(-14, 40), 15, 12, pink, 0);
    union(p, [{ pts: cone, fill: fur }, { pts: head, fill: fur }], ow * 0.5);
    p.ell(...R(108, -2), 9, 8, pink, 2 * u);
    tube(p, curve(R(78, 18), R(84, 40), R(70, 56), 6), 14, 13, "#e86e78", 1.6 * u);
    critterEye(p, expr === "neutral" ? "dead" : expr, ...R(52, -14), u, 0, fur);
    for (const s of [-1, 1]) p.stroke([R(96, 6), R(118, 6 + s * 26)], 1.4 * u);
    return;
  }
  const sniff = RUN ? 0 : Math.sin(3 * t), bob = RUN ? -10 * Math.abs(Math.sin(t)) : 0;
  // tail
  tube(p, RUN ? curve([180, 920 + bob], [96, 900], [34, 925 + 12 * Math.sin(t)], 12) : curve([180, 928], [90, 972], [36, 920 + 6 * Math.sin(t * 0.5)], 12), 24, 6, pink, ow * 0.55);
  // feet
  const fy = 968;
  const fx = (base: number, k: number) => base + (RUN ? 26 * Math.cos(t + k) : 0), fl = (k: number) => (RUN ? 12 * Math.max(0, -Math.sin(t + k)) : 0);
  for (const [x, k, rx] of [[222, 0, 24], [252, Math.PI, 20], [378, Math.PI, 13], [410, 0, 13]] as [number, number, number][]) p.ell(fx(x, k), fy - fl(k), rx, 8, pink, 2.2 * u);
  // body
  const bp = blobPts(282, 902 + bob, { a: 124, b: 64, nTop: 2.1, nBot: 2.4, egg: 0.08, asym: -0.08, rot: RUN ? 0.04 : -0.03, noise: 0.012, seed: o.seed });
  p.gradFill(bp, fur, mul(fur, SH_CLOTH), light);
  p.clip(bp, () => { p.ell(320, 960 + bob, 110, 30, belly, 0); for (const [x, y] of [[200, 870], [250, 858], [300, 860]] as P2[]) p.stroke([[x - 8, y + bob], [x + 6, y + 6 + bob]], 1.4 * u, shade(fur, 0.75)); });
  p.inkRing(bp, ow, thick);
  // head with a pointed snout (one silhouette), ear, eye, pink nose, whiskers
  const hx = 408, hy = 886 + bob, a = (RUN ? 0.08 : -0.06) + 0.04 * sniff;
  const R = (x: number, y: number): P2 => [hx + x * Math.cos(a) - y * Math.sin(a), hy + x * Math.sin(a) + y * Math.cos(a)];
  p.ell(...R(-24, -40), 30, 28, fur, ow * 0.7); p.ell(...R(-22, -38), 18, 16, pink, 0);
  const head = blobPts(hx, hy, { a: 64, b: 48, nTop: 2.2, nBot: 2.4, egg: 0, asym: 0, rot: a, noise: 0.01, seed: o.seed + 2 });
  const tipY = 18 + 3 * sniff;
  union(p, [{ pts: [R(20, -38), R(112, tipY), R(20, 44)], fill: fur }, { pts: head, fill: fur }], ow * 0.5);
  p.ell(...R(110, tipY), 10, 8.5, pink, 2 * u);
  if (o.shades) { // cool-rat sunglasses: a dark lens over the eye + an arm back to the ear, with a glint
    p.poly([R(18, -26), R(70, -24), R(66, 8), R(22, 6)], "#1d2433", 2.2 * u); p.stroke([R(18, -18), R(-14, -26)], 3 * u);
    p.stroke([R(30, -18), R(44, -14)], 3 * u, "rgba(255,255,255,0.75)");
  } else critterEye(p, expr, ...R(42, -8), u, blink, fur);
  for (const s of [-1, 0, 1]) p.stroke([R(96, tipY + 4), R(130 + 4 * sniff, tipY + 4 + s * 22 + 4 * sniff)], 1.4 * u);
  if (opts.mouth === "O" || expr === "shock") p.ell(...R(84, 34), 8, 7, "#5a1e28", 2 * u);
};
