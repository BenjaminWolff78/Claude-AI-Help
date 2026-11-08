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
import { critter68 } from "./critters68";

export const HEAD = "#fbf8f3"; // off-white head (v10 character spec 1)
const WHITE = "#ffffff";

export type HatK = "tophat" | "bowler" | "beanie" | "stripecap" | "flatcap" | "straw" | "madras" | "turban" | "bicorne" | "tricorn" | "crown" | "bonnet" | "fedora" | "kepi" | "cloche" | "beret"
  | "headband" | "mailcap" | "laurel" | "picture"
  // ---- 1968 bridge additions ----
  | "cowboy" | "hardhat" | "custodian" | "trilby" | "headscarf" | "baseball" | "sunhat" | "bucket" | "nightcap" | "none";
export type Look = {
  coat: string; lapel?: string; vest?: string; vestStripe?: string; scarf?: string; collar?: string; buttons?: string; chain?: boolean;
  apron?: string; stripes?: string; belt?: string; sash?: string; cape?: string; kurta?: boolean; drape?: string; dress?: string; suspenders?: string;
  legs?: string; boots?: string; hat?: HatK; hatCol?: string; band?: string; jewel?: string;
  hair?: string; hairStyle?: "tufts" | "bun" | "topknot" | "cowlick" | "short" | "bald" | "parted" | "curl" | "bob" | "pigtails" | "slick" | "spiky";
  /** hoodie: two drawstrings in this colour from the neck + a kangaroo pocket + soft rib lines (coat = the hoodie colour) */ hoodie?: string;
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
  /** non-human cast member drawn by creature(): fur / patch colours */ species?: "dog" | "rat" | "lizard" | "duck" | "pigeon" | "pig" | "cow" | "lion" | "impala"; fur?: string; patch?: string; /** cow: big painted eyes on the rump */ painted?: boolean;
};
// our extra faces on top of toon.ts FACE (eyes [back, front], brows [inner, outer] in u, mouth)
export type Face = Expr | "smug" | "dismay" | "sheepish" | "strain" | "eureka" | "sly" | "joy" | "angry" | "determined" | "cold" | "blank" | "talk"
  | "dizzy" | "green" | "sleep" | "gulp" | "wired" | "dead"
  // ---- 1968 bridge additions ----
  | "guffaw" | "beam" | "stare" | "yikes" | "calm" | "aghast" | "pitch" | "bored" | "proud";
type XEye = EyeK | "x" | "huge" | "closed" | "stare";
type XMouth = MouthK | "queasy" | "puff" | "teethWide" | "tongue" | "beam" | "guffaw" | "content" | "flat" | TalkK;
/** v10.10 lip-sync shapes (board AG): big talking mouths, 40-50 % of the face width, dark inside, teeth + tongue.
 *  tClosed lips together (m/b/p) | tSmall small open | tWide wide open, both rows of teeth | tTongue open with tongue
 *  (l/t/d/n/th) | tO round O (o/w) | tE wide flat with clenched teeth (e/i/s) | tSmile smile-talk | tFrown frown-talk */
export type TalkK = "tClosed" | "tSmall" | "tWide" | "tTongue" | "tO" | "tE" | "tSmile" | "tFrown";
const TALK: Record<string, [number, number, number, number, number, number]> = {
  // half width, depth, upper-lip curve (+ = corners down), top teeth, bottom teeth, tongue (all in u)
  tSmall: [15, 9.5, 0.5, 0, 0, 0], tWide: [22, 16, -1, 3.6, 3.2, 0], tTongue: [19, 13, 0, 3.4, 0, 1], tE: [23, 8.5, 0, 3.4, 3.2, 0],
  tSmile: [22, 12.5, 3, 3.6, 0, 1], tFrown: [20, 9, -3.5, 0, 3.2, 0],
};
const talkMouth = (p: Pen, k: TalkK, mx: number, top: number, u: number) => {
  const INKM = "#241726", DARK = "#4a1420", TEETH = "#fbf8f0", TONG = "#e0646e";
  if (k === "tClosed") { const pts: P2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 6 - 1; pts.push([mx + t * 17 * u, top + 3 * u - 3.2 * u * (1 - t * t)]); } p.stroke(pts, 4.2 * u, INKM); return; }
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
  stare: { eye: ["stare", "stare"], brow: [-2, -2], mouth: "flat" },
  yikes: { eye: ["huge", "huge"], brow: [-10, -8], mouth: "teethWide" },
  calm: { eye: ["happy", "happy"], brow: [-1, 0], mouth: "content" },
  aghast: { eye: ["shock", "shock"], brow: [-8, -4], mouth: "O" },
  pitch: { eye: ["dot", "dot"], brow: [-4, -5], mouth: "smileWide" },
  bored: { eye: ["slit", "slit"], brow: [1, 1], mouth: "flat" },
  proud: { eye: ["lid", "lid"], brow: [-3, -4], mouth: "smile" },
};
/** features slide up by this much (u) for expressions that tip the head back */
const FACE_UP: Record<string, number> = { guffaw: 9, proud: 3 };
export const faceOf = (e: Face) => (FACE as Record<string, typeof XFACE[string]>)[e] ?? XFACE[e] ?? FACE.neutral;

export type Arm = [P2, P2]; // elbow, hand: offsets in u from the shoulder (+x = screen right, +y = down)
export type FigOpts = {
  expr?: Face; facing?: number; look?: number; blink?: number; tilt?: number; headTilt?: number;
  mode?: "stand" | "walk" | "sit" | "brace" | "air" | "kick" | "run" | "stagger" | "lie" | "carried"
    | "stride" | "kneel" | "push" | "hop"; phase?: number; bob?: number;
  // ---- 1968 bridge additions ----
  /** 0..1 laugh shake: upper body rocks + bounces, head wobbles, driven by `phase` (1 phase unit = one shake cycle;
   *  advance phase ~2-3 per second). Feet stay planted. */
  shake?: number;
  /** 0..1 head tipped back (features slide up, chin up); expr "guffaw" implies 1 */ headBack?: number;
  /** mode "sit": 0 = feet on the floor, 1 = legs stretched out level toward the facing side (feet up on a desk) */ feetUp?: number;
  /** mode "hop": 0..1 height of the jump (1 = feet 0.3 head-heights off the ground) */ lift?: number;
  /** mode "kneel": 0 = standing, 1 = full kneel (in-between for kneeling down / standing up). Lion: crouchK, mode "stride": 0 = stalk, 1 = crouch */
  kneelK?: number; crouchK?: number;
  /** mode "brace": 0 = plain standing legs, 1 = full wide knees-bent brace (default 1); blend it to bend the knees smoothly */ braceK?: number;
  /** mode "stride": step length in design units (default 0.55 HH ~ 120); bobK = vertical bob, fraction of the height
   *  (peak-to-peak, default 0.05). Feet are planted: move the card forward strideM() metres per phase unit. */
  stride?: number; bobK?: number;
  /** 0..1 monocle pops off the eye (0-0.35 flies up), drops and dangles on its cord (0.35-1, damped swing) */ monoclePop?: number;
  armL?: Arm; armR?: Arm; armLFront?: boolean; armRFront?: boolean;
  propL?: string; propR?: string; propLAng?: number; propRAng?: number; propK?: number;
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
  /** mode "lie": 0 = legs flat on the ground, 1 = legs straight up in the air (default 0.35) */ legsUp?: number;
  /** rotate (deg) / scale the whole drawing about the card point (300, 600): 2D sheets and insets only */ turn?: number; zoom?: number;
};
const BUILDS = { adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 }, stout: { a: 120, torso: 1.15, legs: 1.3, tw: 0.94 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 }, tall: { a: 116, torso: 1.15, legs: 1.5, tw: 0.76 },
  thin: { a: 114, torso: 1.12, legs: 1.45, tw: 0.62 }, lanky: { a: 110, torso: 1.25, legs: 1.62, tw: 0.6 },
  plump: { a: 120, torso: 1.12, legs: 1.2, tw: 1.06 } };
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
    case "juiceGlass": { // short tumbler of purple grape "juice"
      p.poly(R([[-18, -46], [18, -46], [15, 5], [-15, 5]]), "rgba(214,240,252,0.75)", ow * u);
      p.poly(R([[-16, -27], [16, -27], [14, 4], [-14, 4]]), "#7a2a96", 0);
      p.poly(R([[-16, -27], [16, -27], [16, -22], [-16, -22]]), "#a54cc4", 0);
      p.stroke(R([[-11, -38], [-9, -8]]), 2.8 * u, "rgba(255,255,255,0.7)");
      break;
    }
    case "magnifier":
      p.band(R([[0, 6], [0, -34]]), "#7a4a24", 4.6 * u, 1.2 * u, "round");
      E(0, -58, 26, 26, "rgba(200,238,255,0.35)", 0); E(0, -58, 26, 26, null, 5.5); E(0, -58, 23, 23, null, 1.2);
      p.stroke(R([[-14, -70], [-6, -78]]), 2.4 * u, "rgba(255,255,255,0.85)");
      break;
    case "shovel":
      p.band(R([[0, -40], [0, 34]]), "#9a6a3a", 3.6 * u, 1.1 * u, "round");
      p.band(R([[-7, -42], [7, -42]]), "#9a6a3a", 3.4 * u, 1.1 * u, "round");
      p.poly(R([[-12, 34], [12, 34], [10, 58], [0, 64], [-10, 58]]), "#9aa3ad", ow * u);
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
    case "lantern":
      p.stroke(R([[0, 0], [0, 10]]), 1.4 * u);
      p.poly(R([[-8, 10], [8, 10], [8, 30], [-8, 30]]), "#ffd36a", 2 * u);
      break;
    case "crate": { const b = R([[-24, -34], [24, -34], [24, 8], [-24, 8]]); p.poly(b, "#b07a45", ow * u); for (const y of [-20, -6]) p.stroke(R([[-22, y], [22, y]]), 1.6 * u, "#6e4422"); p.stroke(R([[-22, -32], [22, 6]]), 1.6 * u, "#6e4422"); break; }
    case "sack": { const b = R([[-6, -40], [6, -40], [20, -24], [22, 4], [0, 10], [-22, 4], [-20, -24]]); p.poly(b, "#d8bf86", ow * u); p.band(R([[-7, -34], [7, -34]]), "#8a6a3a", 2.4 * u, 0.8 * u, "round"); break; }
    case "broom": p.band(R([[0, -50], [0, 40]]), "#9a6a3a", 3.2 * u, 1.1 * u, "round"); p.poly(R([[-12, 40], [12, 40], [18, 62], [-18, 62]]), "#e2c06a", ow * u); break;
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
      const b = R([[8, -46], [36, -46], [40, -38], [44, -20], [42, -2], [6, -2], [4, -20], [8, -38]]);
      p.band(R(curve([8, -38], [-6, -24], [6, -8], 8)), "#e9e3d6", 4 * u, 1.2 * u, "round");
      p.poly(b, "#ece6da", ow * u);
      p.poly(R([[36, -46], [48, -52], [42, -40]]), "#ece6da", 1.8 * u);
      p.clip(b, () => p.poly(R([[0, -30], [50, -30], [50, -22], [0, -22]]), "#3d6fa8", 0));
      p.stroke(R([[13, -36], [12, -10]]), 2.4 * u, "rgba(255,255,255,0.8)");
      E(24, -46, 14, 2.6, "#8fc6e8", 1.2);
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
export const figure = (p: Pen, o0: Look, opts: FigOpts) => {
  const g0 = p.g, wrap = !!opts.turn || (opts.zoom !== undefined && opts.zoom !== 1);
  if (wrap) { g0.save(); g0.translate(300, 600); g0.rotate(rad(opts.turn ?? 0)); g0.scale(opts.zoom ?? 1, opts.zoom ?? 1); g0.translate(-300, -600); }
  if (o0.species) creature(p, o0, opts); else person(p, o0, opts);
  if (wrap) g0.restore();
};

const person = (p: Pen, o0: Look, opts: FigOpts) => {
  const BK = !!opts.back;
  const o: Look = BK ? { ...o0, vest: undefined, vestStripe: undefined, apron: undefined, chain: false, scarf: undefined, collar: undefined, lapel: undefined, glasses: false, monocle: false, shades: false, goggles: false, moustache: undefined, beard: undefined, kurta: false, sash: undefined, drape: undefined,
    bib: undefined, medal: false, chestStripe: undefined, bowtie: undefined, chops: undefined, vestCheck: undefined } : o0;
  const { expr = "neutral", look = 0, blink = 0, tilt = 0, mode = "stand", phase = 0, bob = 0,
    sweat = 0, wet = 0, hatLift = 0, hatTilt = 0, squash = 0 } = opts;
  const LIE = mode === "lie", RUN = mode === "run", STAG = mode === "stagger", CARR = mode === "carried", NEW = LIE || RUN || STAG || CARR;
  const STRIDE = mode === "stride", KNEEL = mode === "kneel", PUSH = mode === "push", HOP = mode === "hop";
  const KK = KNEEL ? clamp(opts.kneelK ?? 1, 0, 1) : 0;
  const facing = LIE && !opts.facing ? 1 : opts.facing ?? 0;
  const light = (opts.light ?? rad(-120)) + (LIE ? Math.PI / 2 : 0);
  const shake = clamp(opts.shake ?? 0, 0, 1), shT = Math.PI * 2 * phase;
  const headTilt = (opts.headTilt ?? (LIE ? -6 : STAG ? 7 * Math.sin(Math.PI * 2 * phase - 1.1) : CARR ? 6 * Math.sin(Math.PI * 2 * phase * 0.5) : 0))
    + shake * 6 * Math.sin(2 * shT + 0.8);
  const Bd = BUILDS[o.build ?? "adult"], seed = o.seed, two = Math.PI * 2;
  const fs = Math.sign(facing) as -1 | 0 | 1;
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
  const torsoBot = (mode === "sit" ? sole - 0.25 * HH : sole - Bd.legs * HH * (mode === "brace" ? 1 - 0.12 * clamp(opts.braceK ?? 1, 0, 1) : 1)) + walkBob + bob * u + drop + shakeBob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const bare = !!o.shorts || !!o.ragged;
  const legCol = bare ? INK : o.legs ?? mix(o.coat, INK, 0.6), armCol = o.singlet ? INK : mix(o.coat, INK, 0.5), footCol = o.shoes ?? o.boots ?? INK;
  const legW = 5.8 * u, footW = 7.5 * u;
  const Ta = ((Bd.tw / 2) * W) / 1.06, Ltot = (Bd.legs + 0.12) * HH;
  // lying on the back: the whole drawing slides right so the back rests on the card's centre line (the ground)
  const lieDx = LIE ? 300 + 2 * u + 0.5 * ow - (300 + 3 * u * fs - Ta) : 0;
  if (LIE) { p.g.save(); p.g.translate(lieDx, 0); }
  p.rot = null;
  // ---- legs ----
  const dress = !!o.dress || !!o.drape;
  const legs: { hip: P2; pts: P2[] }[] = [];
  for (const side of [-1, 1]) {
    let k: P2, f: P2; const hx = 300 + side * 15 * u; let toe: P2 | null = null;
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
      f = [300 + side * 22 * u + Math.sin(two * (phase + (side > 0 ? 0.5 : 0))) * 8 * u * fs, sole - 4 * u - up];
      k = [(hx + f[0]) / 2 + side * (1.5 * u + up * 0.16), (hipY + f[1]) / 2 - up * 0.08];
    } else { f = [300 + side * 22 * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * 1.5 * u, (hipY + f[1]) / 2]; }
    let lp: P2[] = [];
    if (dress && !o.mini && mode !== "sit" && !NEW && !STRIDE && !KNEEL && !PUSH && !HOP) { f = [300 + side * 12 * u, sole - 4 * u]; lp = [[f[0], sole - 0.4 * HH], [f[0], (sole - 0.4 * HH + f[1]) / 2], f]; p.stroke(lp, legW, o.capri || o.tallBoots ? INK : legCol); lp = []; }
    else { lp = curve([hx, hipY], k, f); p.stroke(lp, legW, o.capri || (o.tallBoots && !o.legs) ? INK : legCol); }
    if (o.socks && lp.length) p.band(lp.slice(6), o.socks, legW, 1.2 * u, "round");
    if (o.capri && lp.length) p.band(lp.slice(0, 7), o.capri, legW * 1.6, 1.1 * u, "round");
    if (o.tallBoots) { const lb = lp.length ? lp.slice(6) : [[f[0], sole - 0.3 * HH], f] as P2[]; p.band(lb, o.tallBoots, legW * 1.5, 1.2 * u, "round"); }
    legs.push({ hip: [hx, hipY], pts: lp });
    const dir = fs || side;
    if (toe) footStroke(p, [f[0] - toe[0] * 3 * u, f[1] - toe[1] * 3 * u], [f[0] + toe[0] * 13 * u, f[1] + toe[1] * 13 * u], footW, footCol);
    else footStroke(p, [f[0] - dir * 3 * u, f[1]], [f[0] + dir * 13 * u, f[1] + 0.5 * u], footW, footCol);
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
  const T: Blob = { a: Ta, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * fs, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * fs, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
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
    return [[side * (0.27 * T.a / u + 4), 0.48 * HH / u], [side * (0.27 * T.a / u + 7) - side * 6 * sw, 1.02 * HH / u - Math.abs(sw) * 9]];
  };
  const armL = opts.armL ?? hangArm(-1), armR = opts.armR ?? hangArm(1);
  const armRFront = opts.armRFront ?? (LIE && !opts.armR);
  const toAbs = (side: number, a: Arm): [P2, P2, P2] => { const S = sh(side); return [S, [S[0] + a[0][0] * u, S[1] + a[0][1] * u], [S[0] + a[1][0] * u, S[1] + a[1][1] * u]]; };
  const AL = toAbs(-1, armL), AR = toAbs(1, armR);
  const drawArm = (a: [P2, P2, P2], prop?: string, ang = 0, side = 1) => {
    const ap = curve(a[0], a[1], a[2]);
    p.stroke(ap, 5.2 * u, armCol);
    if (o.rolled) { p.stroke(ap.slice(5), 5.2 * u, INK); p.band(ap.slice(4, 6), mix(o.coat, "#ffffff", 0.2), 6.8 * u, 1.1 * u, "butt"); }
    if (o.shortSleeve) { p.stroke(ap.slice(3), 5.2 * u, INK); p.band(ap.slice(0, 4), o.coat, 9 * u, 1.2 * u, "round"); p.band(ap.slice(3, 5), shade(o.coat, 0.92), 9.4 * u, 1.2 * u, "butt"); }
    if (o.watch && side < 0) { const q = ap[ap.length - 3], r = ap[ap.length - 2], dx = r[0] - q[0], dy = r[1] - q[1], l = Math.hypot(dx, dy) || 1;
      p.band([[q[0] - (dy / l) * 4 * u, q[1] + (dx / l) * 4 * u], [q[0] + (dy / l) * 4 * u, q[1] - (dx / l) * 4 * u]], "#5a3a22", 3.4 * u, 0.9 * u, "butt");
      p.ell(q[0], q[1], 3.6 * u, 3.6 * u, "#e8c14a", 1.2 * u); p.ell(q[0], q[1], 2.2 * u, 2.2 * u, "#fbf8ef", 0); }
    if (prop) drawProp(p, prop, a[2], u, ang, opts.propK ?? 0);
    if (o.gloves) { const q = ap[ap.length - 3]; p.band([q, a[2]], shade(o.gloves, 0.9), 8 * u, 1.2 * u, "round"); p.ell(a[2][0], a[2][1], 7 * u, 6.5 * u, o.gloves, 1.4 * u); p.stroke([[a[2][0] - 3 * u, a[2][1] - 1 * u], [a[2][0] + 2 * u, a[2][1] + 3 * u]], 1.1 * u, shade(o.gloves, 0.7)); }
    else p.dot(a[2][0], a[2][1], 5.5 * u);
  };
  // cape behind
  if (o.cape) {
    const cp: P2[] = [[tcx - 0.8 * T.a, chin + 0.05 * HH], [tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 0.8 * T.a, chin + 0.05 * HH]];
    p.gradFill(cp, o.cape, mul(o.cape, SH_CLOTH), light); p.inkRing(cp, ow * 0.8, thick, 0.3);
    p.poly([[tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.45 * T.a, sole - 0.09 * HH], [tcx - 1.45 * T.a, sole - 0.09 * HH]], "#f7f3ea", 1.6 * u);
    for (let i = 0; i < 7; i++) p.dot(tcx - 1.2 * T.a + i * 0.4 * T.a, sole - 0.135 * HH, 1.6 * u);
  }
  if (!opts.armLFront && !opts.armLTop) drawArm(AL, opts.propL, opts.propLAng, -1);
  if (!armRFront && !opts.armRTop) drawArm(AR, opts.propR, opts.propRAng, 1);
  // ---- torso / dress ----
  const body = o.mini && !NEW ? (() => { // A-line mini dress: ends just below the hips, legs show
    const bot = torsoBot + 0.2 * HH, D: Blob = { a: Ta * 1.08, b: 0.5 * (bot - (chin - 0.22 * HH)), nTop: 2.0, nBot: 3.2, egg: 0.3, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(tcx, bot - D.b, D);
  })() : dress && !NEW && !STRIDE && !KNEEL && !PUSH && !HOP ? (() => {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(300, sole - 0.35 * HH - D.b, D);
  })() : dress && !NEW ? (() => { // seated / kneeling / striding dress: skirt to the knees
    const bot = torsoBot + 0.34 * HH, D: Blob = { a: Ta * 1.12, b: 0.5 * (bot - (chin - 0.22 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.3, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(tcx, bot - D.b, D);
  })() : tp;
  const base = o.singlet ?? o.dress ?? o.coat;
  p.gradFill(body, base, mul(base, SH_CLOTH), light);
  p.clip(body, () => {
    const ax = tcx + 2 * u * fs, top = chin - 0.1 * HH, bot = torsoBot;
    if (o.stripes) for (let i = 0; i < 12; i++) p.poly([[tcx - 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH + 0.05 * HH], [tcx - 2 * T.a, top + i * 0.11 * HH + 0.05 * HH]], o.stripes, 0);
    if (o.vstripes) for (let i = -8; i <= 8; i++) { const x = ax + i * 0.24 * T.a; p.poly([[x, top - HH], [x + 0.09 * T.a, top - HH], [x + 0.09 * T.a, bot + HH], [x, bot + HH]], o.vstripes, 0); }
    if (o.plaid) { for (let i = -8; i <= 8; i++) { const x = ax + i * 0.3 * T.a; p.poly([[x, top - HH], [x + 0.1 * T.a, top - HH], [x + 0.1 * T.a, bot + HH], [x, bot + HH]], o.plaid, 0); }
      for (let i = 0; i < 10; i++) { const y = top + i * 0.13 * HH; p.poly([[tcx - 2 * T.a, y], [tcx + 2 * T.a, y], [tcx + 2 * T.a, y + 0.045 * HH], [tcx - 2 * T.a, y + 0.045 * HH]], o.plaid, 0); } }
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
    if (o.apron) { const ap: P2[] = [[ax - 0.5 * T.a, chin + 0.12 * HH], [ax + 0.5 * T.a, chin + 0.12 * HH], [ax + 0.7 * T.a, bot + 0.1 * HH], [ax - 0.7 * T.a, bot + 0.1 * HH]]; p.poly(ap, o.apron, 1.6 * u); p.poly([[ax - 0.22 * T.a, chin + 0.55 * HH], [ax + 0.22 * T.a, chin + 0.55 * HH], [ax + 0.22 * T.a, chin + 0.75 * HH], [ax - 0.22 * T.a, chin + 0.75 * HH]], null, 1.2 * u); }
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
  p.inkRing(body, ow, thick);
  if (o.scarf || o.collar) { // cravat / neckerchief / collar points under the chin
    const c = o.scarf ?? o.collar!;
    for (const s of [-1, 1]) p.poly([[tcx + 2 * u * fs, chin + 0.02 * HH], [tcx + s * 0.42 * T.a, chin - 0.04 * HH], [tcx + s * 0.22 * T.a, chin + 0.2 * HH]], c, 1.6 * u);
    if (o.scarf) p.poly([[tcx - 4 * u, chin + 0.08 * HH], [tcx + 4 * u, chin + 0.08 * HH], [tcx + 7 * u, chin + 0.36 * HH], [tcx - 6 * u, chin + 0.34 * HH]], shade(o.scarf, 0.92), 1.6 * u);
  }
  if (o.bowtie) { const bx = tcx + 2 * u * fs, by = chin + 0.05 * HH;
    for (const s of [-1, 1]) p.poly([[bx, by], [bx + s * 9 * u, by - 5 * u], [bx + s * 9 * u, by + 5 * u]], o.bowtie, 1.6 * u);
    p.ell(bx, by, 2.6 * u, 2.6 * u, shade(o.bowtie, 0.8), 1.4 * u); }
  // ---- 1968 neckwear + accessories ----
  if (o.tie && !BK) { // necktie (loosened: knot drops, collar opens, blade swings)
    const L = !!o.tieLoose, bx = tcx + 2 * u * fs + (L ? 2 * u : 0), by = chin + (L ? 0.13 : 0.04) * HH, ta = rad(L ? 9 : 2);
    const R2 = (pts: P2[]) => rotPts(pts, ta, bx, by);
    if (L) p.poly([[bx - 6 * u, chin - 0.01 * HH], [bx + 6 * u, chin - 0.01 * HH], [bx, by]], HEAD, 1.4 * u);
    const blade = R2([[bx - 4 * u, by + 2 * u], [bx + 4 * u, by + 2 * u], [bx + 8 * u, by + 0.42 * HH], [bx, by + 0.5 * HH], [bx - 8 * u, by + 0.42 * HH]]);
    p.poly(blade, o.tie, 1.5 * u);
    if (o.tieStripe) p.clip(blade, () => { for (let i = -2; i < 9; i++) p.band([[bx - 14 * u, by + i * 0.07 * HH], [bx + 14 * u, by + i * 0.07 * HH + 0.09 * HH]], o.tieStripe!, 0.026 * HH, 0); });
    p.poly(R2([[bx - 5 * u, by - 3 * u], [bx + 5 * u, by - 3 * u], [bx + 3.5 * u, by + 4 * u], [bx - 3.5 * u, by + 4 * u]]), shade(o.tie, 0.85), 1.4 * u);
  }
  if (o.bolo && !BK) { // bolo tie: braided cord, silver-rimmed stone slide at the throat, silver tips
    const bx = tcx + 2 * u * fs, by = chin + 0.1 * HH;
    for (const s of [-1, 1]) p.stroke(curve([bx + s * 0.18 * T.a, chin - 0.01 * HH], [bx + s * 2.5 * u, by - 4 * u], [bx + s * 1.4 * u, by], 8), 1.6 * u, "#3a2a2a");
    for (const s of [-1, 1]) { const end: P2 = [bx + s * 3 * u + fs * u, by + 0.36 * HH]; p.stroke(curve([bx + s * 1.4 * u, by + 5 * u], [bx + s * 2.2 * u, by + 0.2 * HH], end, 8), 1.6 * u, "#3a2a2a");
      p.poly([[end[0] - 1.3 * u, end[1]], [end[0] + 1.3 * u, end[1]], [end[0] + 0.8 * u, end[1] + 5 * u], [end[0] - 0.8 * u, end[1] + 5 * u]], "#d9dde2", 0.9 * u); }
    p.ell(bx, by, 6.6 * u, 7.6 * u, "#d9dde2", 1.6 * u); p.ell(bx, by, 4.6 * u, 5.6 * u, o.bolo, 1 * u);
    p.ell(bx - 1.4 * u, by - 2 * u, 1.4 * u, 1.8 * u, "rgba(255,255,255,0.65)", 0);
  }
  if (o.hoodie && !BK) { // drawstrings + kangaroo pocket + rib lines
    for (const s2 of [-1, 1]) p.stroke([[tcx + s2 * 0.2 * T.a + 2 * u * fs, chin + 0.02 * HH], [tcx + s2 * 0.22 * T.a + 2 * u * fs, chin + 0.42 * HH]], 2.4 * u, o.hoodie);
    const py = chin + 0.62 * HH, pw = 0.5 * T.a, ph = 0.26 * HH, px = tcx + 3 * u * fs;
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
    const cx = tcx + 3 * u * fs, cy = chin + 0.56 * HH;
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
    const bx = tcx + 2 * u * fs, by = chin + 0.6 * HH, bw = 0.62 * T.a, bh = 0.4 * T.a, ba = rad(4 * (rnd(seed, 31) - 0.5));
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
    const mx = tcx + 3 * u * fs, my = chin + 0.3 * HH;
    for (const s of [-1, 1]) p.poly([[tcx + s * 0.36 * T.a, chin - 0.02 * HH], [tcx + s * 0.22 * T.a, chin - 0.04 * HH], [mx + s * 1.5 * u, my - 0.06 * HH], [mx + s * 6 * u, my - 0.08 * HH]], s < 0 ? "#c8352e" : "#2f5d9a", 1.4 * u);
    medalDisc(p, [mx, my], 12.5 * u, u);
  }
  if (o.dummy && !BK) target(p, tcx + 4 * u * fs, chin + 0.32 * HH, 11 * u, u);
  if (opts.armLFront && !opts.armLTop) drawArm(AL, opts.propL, opts.propLAng, -1);
  if (armRFront && !opts.armRTop) drawArm(AR, opts.propR, opts.propRAng, 1);
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
    if (o.hat === "bonnet") { const bb = blobPts(300, hc - 0.07 * HH, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: seed + 3 }); p.shadedFill(bb, o.hatCol ?? "#e9cf8f", mul(o.hatCol ?? "#e9cf8f", SH_CLOTH), light, H.a * 1.17); p.inkRing(bb, ow * 0.85, thick); }
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
  if (o.beard) { const bp = blobPts(300 + 6 * u * fs, hc + 0.5 * H.b, { ...H, a: H.a * 0.92, b: H.b * 0.85, egg: -0.3, seed: seed + 5 }); p.shadedFill(bp, o.beard, mul(o.beard, SH_FELT), light, H.a); p.inkRing(bp, ow * 0.8, thick); }
  const hp = blobPts(300, hc, H);
  const sick = opts.sick ?? (expr === "green" ? 0.5 : 0), headCol = sick > 0 ? mix(HEAD, "#a9d98a", 0.55 * clamp(sick, 0, 1)) : HEAD;
  p.shadedFill(hp, headCol, mul(headCol, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hair(p, o, hp, H, hc, light, fs, u, ow, thick);
  if (o.chops) for (const s of [-1, 1]) { // mutton chops down the cheeks
    const x0 = 300 + 6 * u * fs;
    p.poly([[x0 + s * 0.8 * H.a, hc - 0.3 * H.b], [x0 + s * 0.97 * H.a, hc + 0.05 * H.b], [x0 + s * 0.86 * H.a, hc + 0.55 * H.b], [x0 + s * 0.56 * H.a, hc + 0.62 * H.b], [x0 + s * 0.42 * H.a, hc + 0.36 * H.b], [x0 + s * 0.66 * H.a, hc + 0.12 * H.b], [x0 + s * 0.68 * H.a, hc - 0.3 * H.b]], o.chops, 1.8 * u);
  }
  if (o.sideburns && !BK) for (const s of [-1, 1]) { // short tapered sideburns from under the temple curls down the cheek
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
  if (BK) { // back of the head: hair (or a darker nape) over the lower part of the egg, a centre seam on the coat
    const nape = hp.filter(([, y]) => y > hc - 0.1 * H.b);
    if (nape.length > 3) { nape.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300)); p.shadedFill(nape, o.hair ?? "#e6ddd2", mul(o.hair ?? "#e6ddd2", SH_FELT), light, H.a, 0.35); p.poly(nape, null, ow * 0.6); }
  } else face(p, 300, hc, W, expr, facing, look, Math.max(blink, opts.swapLid ?? 0), brim, o, (opts.mouth ?? opts.mouthX) as MouthK | undefined, sweat, headCol,
    (FACE_UP[expr] ?? 0) + 9 * clamp(opts.headBack ?? 0, 0, 1), opts.monoclePop ?? 0, phase, opts.brow);
  if (o.dummy && !BK) { for (const sd of (fs ? [-fs] : [-1, 1])) target(p, 300 + sd * 0.62 * H.a, hc - 0.42 * H.b, 8 * u, u); }
  if (!opts.noHat) hat(p, o, H, hc, light, seed, fs, u, ow, thick, hatLift, hatTilt);
  if (o.monocle && !BK && (opts.monoclePop ?? 0) > 0) monoclePop(p, 300, hc, W, expr, facing, (FACE_UP[expr] ?? 0) + 9 * clamp(opts.headBack ?? 0, 0, 1), opts.monoclePop!);
  if (o.goggles && !BK && !opts.noHat && o.hat && CAPS.has(o.hat)) { // driving goggles pushed up on the cap
    const gy = hc - H.b + 0.3 * HH - hatLift * HH, gx = 300 + 6 * u * fs;
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
  if (o.hairStyle === "tufts") { // curls peeking out under a hat brim at both temples
    for (const s of [-1, 1]) {
      const x0 = 300 + s * 0.86 * H.a, y0 = hc - 0.42 * H.b;
      const pts: P2[] = [[x0 - s * 14 * u, y0 - 8 * u], [x0 + s * 6 * u, y0 - 10 * u], [x0 + s * 9 * u, y0], [x0 + s * 4 * u, y0 + 3 * u], [x0 + s * 7 * u, y0 + 11 * u], [x0, y0 + 9 * u], [x0 - s * 6 * u, y0 + 2 * u]];
      p.poly(pts, col, 1.6 * u);
    }
    return;
  }
  if (o.hairStyle === "bob") { // 1960s bob: full helmet of hair to the jaw, straight fringe, face window cut out
    const ys = hc + 0.5 * H.b, fr = hc - 0.36 * H.b, wx = 0.74 * H.a, sc = 1.1;
    const outer = hp.filter(([, y]) => y < ys).map(([x, y]) => [300 + (x - 300) * sc, hc + (y - hc) * sc] as P2);
    outer.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300));
    // sorted from the left lower side (angle ~ -180+) over the top to the right lower side: close with the face window
    const L = outer.filter(([x]) => x < 300).sort((a, b) => b[1] - a[1]), Rr = outer.filter(([x]) => x >= 300).sort((a, b) => a[1] - b[1]);
    const ring: P2[] = [...L, ...Rr, [300 + 1.04 * H.a, ys + 0.06 * H.b], [300 + wx, ys], [300 + wx * 0.98, fr + 6 * u], [300 + wx * 0.7, fr], [300, fr + 2 * u], [300 - wx * 0.7, fr], [300 - wx * 0.98, fr + 6 * u], [300 - wx, ys], [300 - 1.04 * H.a, ys + 0.06 * H.b]];
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

const face = (p: Pen, cx: number, cy0: number, W: number, expr: Face, facing: number, look: number, blink: number, brim: boolean, o: Look, mo: MouthK | undefined, sweat: number, skin = HEAD,
  up = 0, mpop = 0, phase = 0, browOv?: [number, number]) => {
  const u = W / 100, F0 = faceOf(expr), F = browOv ? { ...F0, brow: browOv } : F0, fx = cx + 7 * u * facing, cy = cy0 - up * u;
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 12 : 13) * u, ey = cy;
  const capped = !!o.hat && CAPS.has(o.hat);
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
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
      const er: P2[] = [[x - 11 * u, ey - 3 * u], ...ellPts(x, ey - 3 * u, 11 * u, 10 * u, 0, 180, 0, 20).reverse().reverse()];
      p.poly(er, "#ffffff", 0); p.dot(x + look * 3.5 * u, ey + 1.6 * u, 3 * u);
      p.ell(x, ey - 3 * u, 11 * u, 10 * u, null, 2.4 * u, 0, 180);
      p.stroke([[x - 12.5 * u, ey - 3 * u], [x + 12.5 * u, ey - 3 * u]], 4 * u);
    }
    else eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf" || kind === "huge") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
    if (o.glasses) { if (o.bigGlasses) { p.ell(x, ey, 14.5 * u, 13.5 * u, "rgba(220,240,255,0.25)", 0); p.ell(x, ey, 14.5 * u, 13.5 * u, null, 2.8 * u); p.arc(x - 4 * u, ey - 5 * u, 7 * u, 5 * u, 200, 250, 1.6 * u, "rgba(255,255,255,0.9)"); }
      else p.ell(x, ey, 12 * u, 11 * u, null, 1.8 * u); }
    if (o.monocle && side > 0 && mpop <= 0) p.ell(x, ey, 12 * u, 12 * u, null, 2.2 * u);
  }
  if (o.glasses) { const gw = o.bigGlasses ? 14.5 : 12; p.stroke([[fx - ex + gw * u, ey - (o.bigGlasses ? 2 : 0) * u], [fx + ex - gw * u, ey - (o.bigGlasses ? 2 : 0) * u]], (o.bigGlasses ? 2.4 : 1.6) * u); }
  if (o.catEye) p.stroke([[fx - ex + 10 * u, ey - 3 * u], [fx + ex - 10 * u, ey - 3 * u]], 1.8 * u, o.catEye);
  if (o.shades) p.stroke([[fx - ex + 11 * u, ey - 3 * u], [fx + ex - 11 * u, ey - 3 * u]], 1.8 * u);
  if (o.goggles && !capped) for (const side of [-1, 1]) p.ell(fx + side * ex, ey - 32 * u, 10 * u, 8 * u, "#9ad7e8", 2 * u);
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
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
  else mouth(p, mk as MouthK, mx, my, u);
  if (o.moustache) {
    const st = o.moStyle, mY = (y: number) => cy + (y + moDy - (talkK && st === "walrus" ? 4 : 0)) * u, half = (pts: P2[]) => { const R: P2[] = pts.map(([x, y]) => [mx + x * u, mY(y)]), L: P2[] = pts.map(([x, y]) => [mx - x * u, mY(y)]); return [...L.reverse(), ...R]; };
    if (st === "neat") { const top = half([[1, 11.5], [8, 10.6], [14, 12.2]]), bot = half([[1, 16], [7, 15.8], [13.5, 15.4]]); p.poly([...top, ...bot.reverse()], o.moustache, 1.3 * u); }
    else if (st === "handlebar") for (const s of [-1, 1]) { const pts: P2[] = [[0.5, 11], [9, 9.6], [16, 11], [22, 10], [26.5, 5.5], [27, 0.5], [24.4, 0.2], [24.6, 4.6], [21, 8.4], [16, 15.4], [9, 16.8], [0.5, 15.8]];
      p.poly(pts.map(([x, y]) => [mx + s * x * u, mY(y)] as P2), o.moustache, 1.4 * u); p.stroke([[mx + s * 6 * u, mY(13)], [mx + s * 17 * u, mY(12.5)]], 1 * u, shade(o.moustache, 0.72)); }
    else if (st === "walrus") { const top = half([[1, 10], [10, 9], [18, 12], [21.5, 20]]), bot = half([[1, 17], [7, 16], [12, 17.4], [17, 21.6]]); p.poly([...top, ...bot.reverse()], o.moustache, 1.4 * u); }
    else for (const s of [-1, 1]) taper(p, [mx + s * 1.5 * u, cy + (12.5 + moDy) * u], [mx + s * 17 * u, cy + (13 + moDy) * u], 5.5 * u, 1.8 * u, o.moustache);
  }
  if (sweat > 0) { const sx = cx + (facing >= 0 ? -36 : 36) * u, sy = cy - 22 * u + sweat * 6 * u; p.poly([[sx, sy - 7 * u], [sx + 4 * u, sy + 2 * u], [sx, sy + 5 * u], [sx - 4 * u, sy + 2 * u]], "#8fd0f6", 1.4 * u); }
  if (o.sweaty) for (const [k, dx, dy] of [[0, -44, -10], [0.37, 44, -24], [0.71, 40, 8]] as [number, number, number][]) { // flying sweat drops (slide with phase)
    const t = ((phase * 1.5 + k) % 1 + 1) % 1, sx = cx + (dx + Math.sign(dx) * 8 * t) * u, sy = cy + (dy + 12 * t) * u, r = 1.1 - 0.3 * t;
    p.poly([[sx, sy - 7 * u * r], [sx + 4 * u * r, sy + 2 * u * r], [sx, sy + 5 * u * r], [sx - 4 * u * r, sy + 2 * u * r]], "#8fd0f6", 1.4 * u);
  }
  if (o.monocle && mpop > 0) { /* drawn by monoclePop() after the hat */   } else if (o.monocle && o.monoCord && !o.glasses) { // cord from the monocle down to the lapel
    const P: P2 = [fx + ex, ey + 12 * u], A: P2 = [fx + ex - 8 * u, cy0 + 58 * u];
    p.stroke(curve(P, [P[0] + 12 * u, (P[1] + A[1]) / 2], A, 12), 1.2 * u, "#e8c14a");
  }
};

/** the popped monocle (FigOpts.monoclePop > 0): flies up off the eye, drops and dangles on its gold cord; drawn after the hat */
const monoclePop = (p: Pen, cx: number, cy0: number, W: number, expr: Face, facing: number, up: number, mpop: number) => {
  const u = W / 100, F = faceOf(expr), fx = cx + 7 * u * facing, cy = cy0 - up * u;
  const ex = (F.eye[0] === "shock" || F.eye[0] === "huge" ? 12 : 13) * u, ey = cy;
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

const hat = (p: Pen, o: Look, H: Blob, hc: number, light: number, seed: number, fs: number, u: number, ow0: number, thick: number, lift: number, tiltDeg: number) => {
  const k = o.hat; if (!k || k === "none") return;
  const W = 2 * H.a, HH = 2 * H.b, cx = 300, crown = hc - H.b - lift * HH, ow = 0.85 * ow0;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5) + tiltDeg);
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const col = o.hatCol ?? "#2e2a36", deg = (a * 180) / Math.PI;
  const sag = (yb: number, wb: number): P2[] => { const b: P2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12; b.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); } return b; };
  const lowCap = (cut: number, c: string, n = 1.03) => { // a cap that follows the skull above `cut`
    const pts = blobPts(cx, hc - lift * HH, { ...H, a: H.a * n, b: H.b * n, seed: seed + 2 }).filter(([, y]) => y < cut);
    pts.sort((p1, p2) => Math.atan2(p1[1] - hc, p1[0] - cx) - Math.atan2(p2[1] - hc, p2[0] - cx));
    return R(pts);
  };
  if (k === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.82 * HH, wb = 0.31 * W, wt = 0.34 * W;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.12 * HH], [cx + wt + 4 * u, yb - 0.12 * HH]]), o.band ?? "#a3262a", 0.13 * HH, 0.8 * u));
    p.poly(body, null, ow);
    p.stroke(R([[cx - 0.2 * W, yb - ht + 8 * u], [cx - 0.19 * W, yb - 0.22 * HH]]), 2.4 * u, "rgba(255,255,255,0.22)");
    const [bx, by] = R([[cx + 3 * u * fs, yb + u]])[0];
    p.ell(bx, by, 0.46 * W, 0.055 * HH, shade(col, 0.85), ow, 0, 360, deg);
  } else if (k === "bowler") {
    const yb = crown + 0.26 * HH;
    const dome = R([...sag(yb, 0.33 * W).reverse(), ...ellPts(cx, yb, 0.33 * W, 0.42 * HH, 180, 360).slice(0)]);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.33 * W, 0.35);
    p.clip(dome, () => p.band(R([[cx - 0.4 * W, yb - 0.06 * HH], [cx + 0.4 * W, yb - 0.06 * HH]]), o.band ?? shade(col, 0.7), 0.08 * HH, 0.6 * u));
    p.poly(dome, null, ow);
    const [bx, by] = R([[cx + 3 * u * fs, yb + u]])[0];
    p.ell(bx, by, 0.44 * W, 0.06 * HH, shade(col, 0.9), ow, 0, 360, deg);
  } else if (k === "beanie" || k === "flatcap" || k === "stripecap") {
    const cut = crown + 0.36 * HH;
    const cap = lowCap(cut, col, k === "beanie" ? 1.06 : 1.04);
    if (cap.length < 3) return;
    p.shadedFill(cap, col, mul(col, SH_FELT), light, H.a, 0.35);
    if (k !== "flatcap" && o.band) p.clip(cap, () => { for (let i = 0; i < 7; i++) { const y = crown - 0.1 * HH + i * 0.08 * HH; if (k === "beanie") p.band(R([[cx - W, y], [cx + W, y]]), o.band!, 0.035 * HH, 0); else p.band(R([[cx - 0.6 * W + i * 0.16 * W, cut], [cx - 0.3 * W + i * 0.1 * W, crown - 0.05 * HH]]), o.band!, 0.03 * HH, 0); } });
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
    const yb = crown + 0.24 * HH;
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
    const yb = crown + 0.2 * HH;
    const pts = R([[cx - 0.62 * W, yb + 0.02 * HH], [cx - 0.4 * W, yb - 0.38 * HH], [cx, yb - 0.26 * HH], [cx + 0.4 * W, yb - 0.38 * HH], [cx + 0.62 * W, yb + 0.02 * HH], [cx, yb - 0.06 * HH]]);
    p.shadedFill(pts, col, mul(col, SH_FELT), light, 0.6 * W, 0.35); p.poly(pts, null, ow);
    p.stroke(R([[cx - 0.56 * W, yb - 0.01 * HH], [cx - 0.38 * W, yb - 0.33 * HH], [cx, yb - 0.22 * HH], [cx + 0.38 * W, yb - 0.33 * HH], [cx + 0.56 * W, yb - 0.01 * HH]]), 1.8 * u, o.band ?? "#e8c14a");
    if (k === "bicorne") { const [bx, by] = R([[cx + 0.05 * W, yb - 0.2 * HH]])[0]; p.ell(bx, by, 4.5 * u, 4.5 * u, "#e8c14a", 1.4 * u); }
  } else if (k === "crown") {
    const yb = crown + 0.2 * HH;
    const pts = R([[cx - 0.3 * W, yb], [cx - 0.34 * W, yb - 0.3 * HH], [cx - 0.17 * W, yb - 0.16 * HH], [cx, yb - 0.38 * HH], [cx + 0.17 * W, yb - 0.16 * HH], [cx + 0.34 * W, yb - 0.3 * HH], [cx + 0.3 * W, yb]]);
    p.shadedFill(pts, "#f2c94c", "#c08a1c", light, 0.34 * W, 0.35); p.poly(pts, null, ow);
    for (const [x, y] of [[-0.34, -0.3], [0, -0.38], [0.34, -0.3]] as P2[]) { const [c] = R([[cx + x * W, yb + y * HH]]); p.poly([[c[0], c[1] - 8 * u], [c[0] + 4 * u, c[1] - 1 * u], [c[0], c[1] + 3 * u], [c[0] - 4 * u, c[1] - 1 * u]], "#c8f1ff", 1.2 * u); }
    const [jx, jy] = R([[cx, yb - 0.09 * HH]])[0]; p.ell(jx, jy, 4 * u, 4 * u, "#c8352e", 1.2 * u);
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
    const cut = crown + 0.5 * HH;
    const bell = lowCap(cut, col, 1.1);
    if (bell.length < 3) return;
    p.shadedFill(bell, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.clip(bell, () => p.band(R([[cx - W, cut - 0.1 * HH], [cx + W, cut - 0.1 * HH]]), o.band ?? shade(col, 0.7), 0.06 * HH, 0));
    p.poly(bell, null, ow);
    const [fx, fy] = R([[cx + 0.32 * W * (fs || 1), cut - 0.1 * HH]])[0]; p.ell(fx, fy, 6 * u, 6 * u, o.jewel ?? "#f2c230", 1.2 * u); p.dot(fx, fy, 2 * u, "#b3262e");
  } else if (k === "beret") { // painter's beret, tipped to one side
    const [bx, by] = R([[cx + 0.06 * W, crown + 0.08 * HH]])[0];
    p.ell(bx, by, 0.46 * W, 0.14 * HH, col, ow, 0, 360, deg - 8);
    p.stroke(R([[cx + 0.08 * W, crown - 0.06 * HH], [cx + 0.1 * W, crown - 0.14 * HH]]), 3 * u, shade(col, 0.7));
  } else if (k === "bonnet") {
    const [bx, by] = R([[cx, crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, shade(o.hatCol ?? "#e9cf8f", 0.9));
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const [rx, ry] = R([[cx + 0.42 * W, hc + 0.1 * HH]])[0]; p.ell(rx, ry, 5 * u, 3.5 * u, o.band ?? "#b3262e", 1.2 * u);
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
