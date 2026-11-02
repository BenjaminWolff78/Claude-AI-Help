// Our cast for "Why Boston Shipped Ice to India", built on toon.ts's measured primitives (characters.md):
// bean heads (H/W .94, crown/jaw exponents, chin taper, side bulge, tilt), plum thick-thin ink (5 % W, x3 on the shadow
// side), 3.5 head-heights, single-stroke limbs ~.055 W, ink-dot hands, short stroke feet, crescent/gradient shading.
// Master prompt v10 overrides: heads are WHITE / off-white (never skin-coloured), no blush, hats/hair sit ON the head as
// separate outlined shapes, bodies are beans with costume detail, every arm pose is free so every verb can be acted.
import {
  Pen, INK, P2, Blob, blobPts, headBlob, thickAngle, mul, shade, mix, rad, clamp, rnd, rotPts, lerp2, curve, ellPts, taper,
  SH_SKIN, SH_CLOTH, SH_FELT, FACE, eye, eyeKind, lidOf, mouth, footStroke, Expr, EyeK, MouthK,
} from "./toon";

export const HEAD = "#fbf8f3"; // off-white head (v10 character spec 1)
const WHITE = "#ffffff";

export type HatK = "tophat" | "bowler" | "beanie" | "stripecap" | "flatcap" | "straw" | "madras" | "turban" | "bicorne" | "tricorn" | "crown" | "bonnet" | "none";
export type Look = {
  coat: string; lapel?: string; vest?: string; vestStripe?: string; scarf?: string; collar?: string; buttons?: string; chain?: boolean;
  apron?: string; stripes?: string; belt?: string; sash?: string; cape?: string; kurta?: boolean; drape?: string; dress?: string; suspenders?: string;
  legs?: string; boots?: string; hat?: HatK; hatCol?: string; band?: string; jewel?: string;
  hair?: string; hairStyle?: "tufts" | "bun" | "topknot" | "cowlick" | "short" | "bald";
  moustache?: string; beard?: string; glasses?: boolean; monocle?: boolean; shades?: boolean; goggles?: boolean;
  build?: "adult" | "stout" | "kid" | "tall"; seed: number;
};
// our extra faces on top of toon.ts FACE (eyes [back, front], brows [inner, outer] in u, mouth)
export type Face = Expr | "smug" | "dismay" | "sheepish" | "strain" | "eureka" | "sly" | "joy" | "angry" | "determined" | "cold" | "blank" | "talk";
const XFACE: Record<string, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
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
};
const faceOf = (e: Face) => (FACE as Record<string, typeof XFACE[string]>)[e] ?? XFACE[e] ?? FACE.neutral;

export type Arm = [P2, P2]; // elbow, hand: offsets in u from the shoulder (+x = screen right, +y = down)
export type FigOpts = {
  expr?: Face; facing?: number; look?: number; blink?: number; tilt?: number; headTilt?: number;
  mode?: "stand" | "walk" | "sit" | "brace" | "air" | "kick"; phase?: number; bob?: number;
  armL?: Arm; armR?: Arm; armLFront?: boolean; armRFront?: boolean;
  propL?: string; propR?: string; propLAng?: number; propRAng?: number; propK?: number;
  mouth?: MouthK; sweat?: number; wet?: number; hatLift?: number; hatTilt?: number; squash?: number; light?: number;
  noHat?: boolean;
};
const BUILDS = { adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 }, stout: { a: 120, torso: 1.15, legs: 1.3, tw: 0.94 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 }, tall: { a: 116, torso: 1.15, legs: 1.5, tw: 0.76 } };

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
      p.poly(R([[-38, -32], [-6, -33], [-6, -8], [-38, -7]]), "#9fd8ea", 1.2 * u); // ice block engraving
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
    case "purse": E(0, 8, 10, 11, "#b88446", 2); p.band(R([[-4, -2], [4, -2]]), "#7a5426", 2 * u, 0.6 * u, "round"); break;
  }
};

/** a figure, front / three-quarter view, in the 600 x 1000 design space, soles at y = 975 */
export const figure = (p: Pen, o: Look, opts: FigOpts) => {
  const { expr = "neutral", facing = 0, look = 0, blink = 0, tilt = 0, headTilt = 0, mode = "stand", phase = 0, bob = 0,
    light = rad(-120), sweat = 0, wet = 0, hatLift = 0, hatTilt = 0, squash = 0 } = opts;
  const Bd = BUILDS[o.build ?? "adult"], seed = o.seed, two = Math.PI * 2;
  const fs = Math.sign(facing) as -1 | 0 | 1;
  const H0 = headBlob(seed, Bd.a, fs);
  const H: Blob = { ...H0, a: H0.a * (1 - 0.06 * squash), b: H0.b * (1 + 0.1 * squash) };
  const W = 2 * H0.a, HH = 2 * H0.b, u = W / 100, sole = 975;
  const tall = (1 + Bd.torso + Bd.legs) * HH;
  const walkBob = mode === "walk" ? 0.025 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = (mode === "sit" ? sole - 0.25 * HH : sole - Bd.legs * HH * (mode === "brace" ? 0.88 : 1)) + walkBob + bob * u;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = o.legs ?? mix(o.coat, INK, 0.6), armCol = mix(o.coat, INK, 0.5), footCol = o.boots ?? INK;
  const legW = 5.8 * u, footW = 7.5 * u;
  p.rot = null;
  // ---- legs ----
  const dress = !!o.dress || !!o.drape;
  for (const side of [-1, 1]) {
    let k: P2, f: P2; const hx = 300 + side * 15 * u;
    if (mode === "sit") { k = [300 + side * 32 * u, hipY + 0.18 * HH]; f = [300 + side * 40 * u, sole - 6 * u]; }
    else if (mode === "brace") { f = [300 + side * 46 * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * 10 * u, (hipY + f[1]) / 2]; }
    else if (mode === "air") { f = [300 + side * 40 * u, hipY + 0.9 * HH]; k = [300 + side * 46 * u, hipY + 0.45 * HH]; }
    else if (mode === "kick") { const ph = phase * two + (side > 0 ? 2 : 0); f = [300 + side * 34 * u + Math.sin(ph) * 20 * u, hipY + 1.0 * HH - Math.abs(Math.cos(ph)) * 30 * u]; k = [300 + side * 44 * u, hipY + 0.5 * HH]; }
    else if (mode === "walk") {
      const up = Math.max(0, Math.sin(two * (phase + (side > 0 ? 0.5 : 0)))) * 0.28 * HH;
      f = [300 + side * 22 * u + Math.sin(two * (phase + (side > 0 ? 0.5 : 0))) * 8 * u * fs, sole - 4 * u - up];
      k = [(hx + f[0]) / 2 + side * (1.5 * u + up * 0.16), (hipY + f[1]) / 2 - up * 0.08];
    } else { f = [300 + side * 22 * u, sole - 4 * u]; k = [(hx + f[0]) / 2 + side * 1.5 * u, (hipY + f[1]) / 2]; }
    if (dress && mode !== "sit") { f = [300 + side * 12 * u, sole - 4 * u]; p.stroke([[f[0], sole - 0.4 * HH], f], legW, legCol); }
    else p.stroke(curve([hx, hipY], k, f), legW, legCol);
    const dir = fs || side;
    footStroke(p, [f[0] - dir * 3 * u, f[1]], [f[0] + dir * 13 * u, f[1] + 0.5 * u], footW, footCol);
  }
  // ---- upper body rotates about the hips ----
  const sway = mode === "walk" ? 1.4 * Math.sin(two * phase) : 0, A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * fs, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * fs, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hangArm = (side: number): Arm => {
    const sw = mode === "walk" ? Math.sin(two * phase) * side : 0;
    return [[side * (0.27 * T.a / u + 4), 0.48 * HH / u], [side * (0.27 * T.a / u + 7) - side * 6 * sw, 1.02 * HH / u - Math.abs(sw) * 9]];
  };
  const armL = opts.armL ?? hangArm(-1), armR = opts.armR ?? hangArm(1);
  const toAbs = (side: number, a: Arm): [P2, P2, P2] => { const S = sh(side); return [S, [S[0] + a[0][0] * u, S[1] + a[0][1] * u], [S[0] + a[1][0] * u, S[1] + a[1][1] * u]]; };
  const AL = toAbs(-1, armL), AR = toAbs(1, armR);
  const drawArm = (a: [P2, P2, P2], prop?: string, ang = 0) => {
    p.stroke(curve(a[0], a[1], a[2]), 5.2 * u, armCol);
    if (prop) drawProp(p, prop, a[2], u, ang, opts.propK ?? 0);
    p.dot(a[2][0], a[2][1], 5.5 * u);
  };
  // cape behind
  if (o.cape) {
    const cp: P2[] = [[tcx - 0.8 * T.a, chin + 0.05 * HH], [tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 0.8 * T.a, chin + 0.05 * HH]];
    p.gradFill(cp, o.cape, mul(o.cape, SH_CLOTH), light); p.inkRing(cp, ow * 0.8, thick, 0.3);
    p.poly([[tcx - 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.5 * T.a, sole - 0.18 * HH], [tcx + 1.45 * T.a, sole - 0.09 * HH], [tcx - 1.45 * T.a, sole - 0.09 * HH]], "#f7f3ea", 1.6 * u);
    for (let i = 0; i < 7; i++) p.dot(tcx - 1.2 * T.a + i * 0.4 * T.a, sole - 0.135 * HH, 1.6 * u);
  }
  if (!opts.armLFront) drawArm(AL, opts.propL, opts.propLAng);
  if (!opts.armRFront) drawArm(AR, opts.propR, opts.propRAng);
  // ---- torso / dress ----
  const body = dress ? (() => {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * fs, rot: 0, noise: 0.006, seed: seed + 9 };
    return blobPts(300, sole - 0.35 * HH - D.b, D);
  })() : tp;
  const base = o.dress ?? o.coat;
  p.gradFill(body, base, mul(base, SH_CLOTH), light);
  p.clip(body, () => {
    const ax = tcx + 2 * u * fs, top = chin - 0.1 * HH, bot = torsoBot;
    if (o.stripes) for (let i = 0; i < 12; i++) p.poly([[tcx - 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH], [tcx + 2 * T.a, top + i * 0.11 * HH + 0.05 * HH], [tcx - 2 * T.a, top + i * 0.11 * HH + 0.05 * HH]], o.stripes, 0);
    if (o.vest) { // waistcoat panel + buttons + lapels of the open coat
      const vp: P2[] = [[ax - 0.38 * T.a, top], [ax + 0.38 * T.a, top], [ax + 0.3 * T.a, bot - 0.12 * HH], [ax, bot - 0.02 * HH], [ax - 0.3 * T.a, bot - 0.12 * HH]];
      p.poly(vp, o.vest, 1.6 * u);
      if (o.vestStripe) p.clip(vp, () => { for (let i = -6; i < 6; i++) p.poly([[ax + i * 6 * u, top], [ax + i * 6 * u + 2 * u, top], [ax + i * 6 * u + 2 * u, bot], [ax + i * 6 * u, bot]], o.vestStripe!, 0); });
      for (let i = 0; i < 3; i++) { p.dot(ax, chin + 0.18 * HH + i * 0.17 * HH, 2.8 * u); p.dot(ax, chin + 0.18 * HH + i * 0.17 * HH, 2 * u, o.buttons ?? "#e8c14a"); }
      for (const s of [-1, 1]) p.poly([[ax + s * 0.36 * T.a, top], [ax + s * 0.7 * T.a, chin + 0.22 * HH], [ax + s * 0.5 * T.a, chin + 0.3 * HH], [ax + s * 0.42 * T.a, chin + 0.62 * HH]], o.lapel ?? shade(base, 0.82), 1.6 * u);
      if (o.chain) p.stroke(curve([ax + 2 * u, chin + 0.45 * HH], [ax + 0.25 * T.a, chin + 0.58 * HH], [ax + 0.42 * T.a, chin + 0.46 * HH]), 1.6 * u, "#e8c14a");
    } else if (!o.kurta && !dress && !o.stripes) for (let i = 0; i < 3; i++) { p.dot(ax, chin + 0.2 * HH + i * 0.2 * HH, 2.8 * u); p.dot(ax, chin + 0.2 * HH + i * 0.2 * HH, 2 * u, o.buttons ?? shade(base, 0.7)); }
    if (o.kurta) { p.stroke([[ax, top + 0.1 * HH], [ax, chin + 0.5 * HH]], 1.4 * u, shade(base, 0.7)); for (let i = 0; i < 3; i++) p.dot(ax + 3 * u, chin + 0.16 * HH + i * 0.12 * HH, 1.8 * u, o.buttons ?? "#e8c14a"); if (o.sash) p.poly([[tcx - 2 * T.a, bot - 0.08 * HH], [tcx + 2 * T.a, bot - 0.08 * HH], [tcx + 2 * T.a, bot - 0.0 * HH], [tcx - 2 * T.a, bot - 0.0 * HH]], o.sash, 0); }
    if (o.drape) { p.poly([[tcx - 1.1 * T.a, chin + 0.1 * HH], [tcx + 1.0 * T.a, top - 0.05 * HH], [tcx + 1.1 * T.a, chin + 0.35 * HH], [tcx - 0.9 * T.a, chin + 0.95 * HH]], o.drape, 1.6 * u); p.stroke([[tcx - 1.1 * T.a, chin + 0.1 * HH], [tcx + 1.0 * T.a, top - 0.05 * HH]], 1.6 * u, "#e8c14a"); }
    if (o.suspenders) for (const s of [-1, 1]) p.band([[ax + s * 0.4 * T.a, top], [ax + s * 0.36 * T.a, bot]], o.suspenders, 3 * u, 0.8 * u);
    if (o.apron) { const ap: P2[] = [[ax - 0.5 * T.a, chin + 0.12 * HH], [ax + 0.5 * T.a, chin + 0.12 * HH], [ax + 0.7 * T.a, bot + 0.1 * HH], [ax - 0.7 * T.a, bot + 0.1 * HH]]; p.poly(ap, o.apron, 1.6 * u); p.poly([[ax - 0.22 * T.a, chin + 0.55 * HH], [ax + 0.22 * T.a, chin + 0.55 * HH], [ax + 0.22 * T.a, chin + 0.75 * HH], [ax - 0.22 * T.a, chin + 0.75 * HH]], null, 1.2 * u); }
    if (o.belt) { p.poly([[tcx - 2 * T.a, bot - 0.28 * HH], [tcx + 2 * T.a, bot - 0.28 * HH], [tcx + 2 * T.a, bot - 0.2 * HH], [tcx - 2 * T.a, bot - 0.2 * HH]], o.belt, 0); p.poly([[ax - 4 * u, bot - 0.3 * HH], [ax + 4 * u, bot - 0.3 * HH], [ax + 4 * u, bot - 0.18 * HH], [ax - 4 * u, bot - 0.18 * HH]], "#e8c14a", 1.2 * u); }
    if (o.sash && !o.kurta) p.band([[tcx - 1.2 * T.a, chin], [tcx + 1.2 * T.a, bot - 0.1 * HH]], o.sash, 0.1 * HH, 1.2 * u);
    if (wet > 0) p.poly([[tcx - 2 * T.a, bot - 0.35 * HH], [tcx + 2 * T.a, bot - 0.35 * HH], [tcx + 2 * T.a, bot + HH], [tcx - 2 * T.a, bot + HH]], `rgba(40,80,140,${0.28 * wet})`, 0);
  });
  p.inkRing(body, ow, thick);
  if (o.scarf || o.collar) { // cravat / neckerchief / collar points under the chin
    const c = o.scarf ?? o.collar!;
    for (const s of [-1, 1]) p.poly([[tcx + 2 * u * fs, chin + 0.02 * HH], [tcx + s * 0.42 * T.a, chin - 0.04 * HH], [tcx + s * 0.22 * T.a, chin + 0.2 * HH]], c, 1.6 * u);
    if (o.scarf) p.poly([[tcx - 4 * u, chin + 0.08 * HH], [tcx + 4 * u, chin + 0.08 * HH], [tcx + 7 * u, chin + 0.36 * HH], [tcx - 6 * u, chin + 0.34 * HH]], shade(o.scarf, 0.92), 1.6 * u);
  }
  if (opts.armLFront) drawArm(AL, opts.propL, opts.propLAng);
  if (opts.armRFront) drawArm(AR, opts.propR, opts.propRAng);
  // ---- head ----
  const Ah = A + headTilt;
  const cpx = 300 + (chin - hipY) * -Math.sin(rad(A)), cpy = hipY + (chin - hipY) * Math.cos(rad(A));
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  if (o.hat === "bonnet" || o.hairStyle === "bun") { // back parts
    if (o.hat === "bonnet") { const bb = blobPts(300, hc - 0.07 * HH, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: seed + 3 }); p.shadedFill(bb, o.hatCol ?? "#e9cf8f", mul(o.hatCol ?? "#e9cf8f", SH_CLOTH), light, H.a * 1.17); p.inkRing(bb, ow * 0.85, thick); }
  }
  if (o.beard) { const bp = blobPts(300 + 6 * u * fs, hc + 0.5 * H.b, { ...H, a: H.a * 0.92, b: H.b * 0.85, egg: -0.3, seed: seed + 5 }); p.shadedFill(bp, o.beard, mul(o.beard, SH_FELT), light, H.a); p.inkRing(bp, ow * 0.8, thick); }
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, HEAD, mul(HEAD, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hair(p, o, hp, H, hc, light, fs, u, ow, thick);
  const brim = !!o.hat && o.hat !== "bonnet" && o.hat !== "none" && !opts.noHat;
  face(p, 300, hc, W, expr, facing, look, blink, brim, o, opts.mouth, sweat);
  if (!opts.noHat) hat(p, o, H, hc, light, seed, fs, u, ow, thick, hatLift, hatTilt);
  p.rot = null;
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
  if (o.hairStyle === "bun" || o.hairStyle === "topknot" || o.hairStyle === "short" || o.hairStyle === "cowlick") {
    const cut = crown + 0.4 * H.b * 2 * 0.5;
    const arc = hp.filter(([, y]) => y < cut).map(([x, y]) => [300 + (x - 300) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length > 3) { arc.sort((a, b) => Math.atan2(a[1] - hc, a[0] - 300) - Math.atan2(b[1] - hc, b[0] - 300)); p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.8); }
    if (o.hairStyle === "bun") p.ell(300 + 4 * u * fs, crown - 9 * u, 16 * u, 13 * u, col, ow * 0.8);
    if (o.hairStyle === "topknot") p.ell(300, crown - 8 * u, 10 * u, 10 * u, col, ow * 0.8);
    if (o.hairStyle === "cowlick") p.poly([[300 - 6 * u, crown + 4 * u], [300 + 10 * u, crown - 22 * u], [300 + 14 * u, crown + 4 * u]], col, ow * 0.7);
  }
};

const face = (p: Pen, cx: number, cy: number, W: number, expr: Face, facing: number, look: number, blink: number, brim: boolean, o: Look, mo: MouthK | undefined, sweat: number) => {
  const u = W / 100, F = faceOf(expr), fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === Math.sign(facing) : side > 0) ? 1 : 0], blink);
    if (o.shades) { p.poly([[x - 11 * u, ey - 7 * u], [x + 11 * u, ey - 7 * u], [x + 10 * u, ey + 6 * u], [x - 10 * u, ey + 6 * u]], "#1d2433", 1.6 * u); continue; }
    eye(p, kind, x, ey, u, side, look, HEAD);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
    if (o.glasses) p.ell(x, ey, 12 * u, 11 * u, null, 1.8 * u);
    if (o.monocle && side > 0) p.ell(x, ey, 12 * u, 12 * u, null, 2.2 * u);
  }
  if (o.glasses) p.stroke([[fx - ex + 12 * u, ey], [fx + ex - 12 * u, ey]], 1.6 * u);
  if (o.shades) p.stroke([[fx - ex + 11 * u, ey - 3 * u], [fx + ex - 11 * u, ey - 3 * u]], 1.8 * u);
  if (o.goggles) for (const side of [-1, 1]) p.ell(fx + side * ex, ey - 32 * u, 10 * u, 8 * u, "#9ad7e8", 2 * u);
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, mo ?? F.mouth, mx, my, u);
  if (o.moustache) for (const s of [-1, 1]) taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * 17 * u, cy + 13 * u], 5.5 * u, 1.8 * u, o.moustache);
  if (sweat > 0) { const sx = cx + (facing >= 0 ? -36 : 36) * u, sy = cy - 22 * u + sweat * 6 * u; p.poly([[sx, sy - 7 * u], [sx + 4 * u, sy + 2 * u], [sx, sy + 5 * u], [sx - 4 * u, sy + 2 * u]], "#8fd0f6", 1.4 * u); }
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
  } else if (k === "bonnet") {
    const [bx, by] = R([[cx, crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, shade(o.hatCol ?? "#e9cf8f", 0.9));
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const [rx, ry] = R([[cx + 0.42 * W, hc + 0.1 * HH]])[0]; p.ell(rx, ry, 5 * u, 3.5 * u, o.band ?? "#b3262e", 1.2 * u);
  }
};
