// 1968 bridge animals (Look.species): lizard, duck, pigeon. Same ink + flat paint as the dog and rat in fig.ts.
// Profile view, facing right; fig.ts creature() mirrors the canvas for facing < 0. Card point / ground: y = 971.
//  lizard  ~1.1 m long on the card: place with CastPlace scale ~0.25 (a 28 cm desert lizard). Modes: stand (head bob,
//          tail curl), walk (phase-driven sprawling gait with a body wiggle; advance ~0.55 m x scale per phase unit).
//  duck    ~0.6 m long: scale ~0.75. Default = swimming (the waterline is y = 900 on the card: put the card 0.15 m x scale
//          below the water surface... i.e. pos.y = water - 0.155 * scale); phase = bob + paddle ripples. mode "walk" /
//          "stand" = on land with orange legs.
//  pigeon  ~0.65 m tall: scale ~0.45. Modes: stand (head bob with phase), walk (head pumps, feet step), hop / air =
//          flying (wing flap with phase). FigOpts.tilt ~30 = peck (body tips forward, head to the ground).
// Expressions: blink, "shock" / "yikes" / "aghast" (round startled eye), "sleep" (closed), "angry" (brow).
import { Pen, INK, P2, Blob, blobPts, thickAngle, mul, shade, mix, curve, SH_CLOTH, SH_SKIN, SH_FELT, eye, ellPts } from "./toon";
import type { Look, FigOpts } from "./fig";

const two = Math.PI * 2;
/** outlined tube along pts with a width per point */
const tubeW = (p: Pen, pts: P2[], ws: number[], fill: string, ol: number) => {
  const L: P2[] = [], R: P2[] = [], n = pts.length;
  pts.forEach((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = ws[i] / 2;
    L.push([q[0] - (dy / l) * w, q[1] + (dx / l) * w]); R.push([q[0] + (dy / l) * w, q[1] - (dx / l) * w]); });
  const poly = [...L, ...R.reverse()];
  p.poly(poly, fill, ol);
  return poly;
};
const critEye = (p: Pen, expr: string, x: number, y: number, u: number, blink: number, bg: string, r = 1) => {
  if (expr === "sleep" || blink >= 1) { p.stroke([[x - 6 * u * r, y], [x + 6 * u * r, y]], 3 * u); return; }
  if (expr === "shock" || expr === "yikes" || expr === "aghast") { p.ell(x, y, 9 * u * r, 9 * u * r, "#ffffff", 2.4 * u); p.dot(x + 1.5 * u, y + 1 * u, 2.6 * u * r); return; }
  eye(p, blink > 0 ? "lid" : "dot", x, y, u * r, 1, 0.4, bg);
  if (expr === "angry") p.stroke([[x - 8 * u * r, y - 11 * u * r], [x + 7 * u * r, y - 6 * u * r]], 3.4 * u * r);
};

export const critter68 = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  if (o.species === "lizard") lizard(p, o, opts, light);
  else if (o.species === "duck") duck(p, o, opts, light);
  else if (o.species === "pigeon") pigeon(p, o, opts, light);
  else if (o.species === "pig") pig(p, o, opts, light);
  else if (o.species === "cow") cow(p, o, opts, light);
  else if (o.species === "lion") lion(p, o, opts, light);
  else if (o.species === "impala") impala(p, o, opts, light);
};

const lizard = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 6.5 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const WALK = mode === "walk" || mode === "run" || mode === "stride", t = two * phase;
  const skin = o.fur ?? "#7fb069", spot = o.patch ?? "#4a7a3a", belly = "#ece2a8", legC = mix(skin, INK, 0.18), legF = mix(skin, INK, 0.45);
  const ground = 968;
  // spine from tail tip (s = 0) to snout (s = 1); the walk wiggles a travelling wave down the body
  const N = 26, spine: P2[] = [], ws: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, x = 40 + 500 * s;
    const wave = (WALK ? 7 : 2.5) * Math.sin(t * (WALK ? 1 : 0.5) * 2 - s * 7) * (1 - s) ** 1.3;
    const tailLift = s < 0.4 ? -38 * (0.4 - s) ** 1.6 * (1 + 0.4 * Math.sin(t * 0.5)) : 0;
    const y = 918 + wave + tailLift * 2.2 - (s > 0.82 ? 10 * (s - 0.82) / 0.18 : 0) + (WALK ? 3 * Math.sin(2 * t) : 0);
    spine.push([x, y]);
    ws.push(s < 0.45 ? 7 + (s / 0.45) ** 1.4 * 44 : s < 0.8 ? 51 + 8 * Math.sin(((s - 0.45) / 0.35) * Math.PI) : s < 0.86 ? 40 : 40 * (1 - ((s - 0.86) / 0.14) ** 2) + 12);
  }
  // legs (far pair first, darker), sprawled: elbow up beside the body, foot on the ground with three toes
  const leg = (s0: number, far: boolean, ph: number) => {
    const i = Math.round(s0 * N), A = spine[i], st = WALK ? Math.sin(t + ph) : 0, lift = WALK ? Math.max(0, Math.cos(t + ph)) * 16 : 0;
    const F: P2 = [A[0] + (far ? -6 : 8) + st * 30, ground - lift], K: P2 = [(A[0] + F[0]) / 2 + (s0 > 0.6 ? 18 : -18), A[1] - 6];
    p.band(curve(A, K, F, 8), far ? legF : legC, 11, 2.4, "round");
    for (const d of [-1, 0, 1]) p.band([F, [F[0] + 13 + d * 3, F[1] + d * 3 - 1]], far ? legF : legC, 4, 1.6, "round");
  };
  leg(0.5, true, 0); leg(0.75, true, Math.PI);
  // body
  const bp = tubeW(p, spine, ws, skin, 0);
  p.gradFill(bp, skin, mul(skin, SH_CLOTH), light);
  p.clip(bp, () => {
    for (let i = 3; i < N - 2; i++) { const q = spine[i], w = ws[i]; p.poly(ellPts(q[0], q[1] + w * 0.42, w * 0.32 + 6, w * 0.22, 0, 360, 0, 16), belly, 0); }
    for (let i = 4; i < N - 4; i += 2) { const q = spine[i], w = ws[i]; p.ell(q[0], q[1] - w * 0.22, w * 0.16 + 2, w * 0.12 + 2, spot, 0); p.dot(q[0] + w * 0.2, q[1] - w * 0.05, w * 0.05 + 1, shade(spot, 0.85)); }
    for (let i = 6; i < N - 6; i += 3) { const q = spine[i]; p.stroke([[q[0] - 5, q[1] - 2], [q[0] + 3, q[1] + 6]], 1.2 * u, shade(skin, 0.78)); }
  });
  p.inkRing(bp, ow, thick, 0.4);
  leg(0.5, false, Math.PI); leg(0.75, false, 0);
  // head: a flat wedge with a rounded snout, eye with a brow ridge, mouth line, nostril
  const hq = spine[N - 2], hx = hq[0] + 6, hy = hq[1] + (WALK ? 2 * Math.sin(t * 2 + 1) : 3 * Math.sin(t * 0.5));
  const HB: Blob = { a: 58, b: 30, nTop: 2.2, nBot: 2.6, egg: 0.0, asym: 0.12, rot: 0.06, noise: 0.01, seed: o.seed + 3 };
  const hp = blobPts(hx, hy, HB);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, 58); p.inkRing(hp, ow * 0.9, thick, 0.4);
  p.clip(hp, () => p.ell(hx + 6, hy + 26, 52, 14, belly, 0));
  p.stroke(curve([hx + 2, hy + 12], [hx + 32, hy + 16], [hx + 56, hy + 6], 8), 2.2 * u);
  p.dot(hx + 52, hy - 8, 2.2 * u);
  p.ell(hx + 6, hy - 14, 12, 10, shade(skin, 1.08), 2 * u);
  critEye(p, expr, hx + 6, hy - 14, u, blink, skin, 0.9);
};

const duck = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 5.5 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const LAND = mode === "walk" || mode === "run", t = two * phase;
  const body = o.fur ?? "#c9c5c0", headC = o.patch ?? "#2f8a5a", chest = "#8a4a32", bill = "#f2c230", wl = 900;
  const by = (LAND ? 820 : wl - 14) + (LAND ? 4 * Math.abs(Math.sin(t)) : 4 * Math.sin(t));
  // legs on land (orange webbed feet)
  if (LAND) for (const [x, ph] of [[278, 0], [300, Math.PI]] as [number, number][]) {
    const st = mode === "walk" ? Math.sin(t + ph) * 18 : 0, F: P2 = [x + st, 966 - Math.max(0, Math.cos(t + ph)) * 10];
    p.band([[x, by + 50], F], "#f08a2c", 8, 2, "round");
    p.poly([[F[0] - 8, F[1] + 2], [F[0] + 22, F[1] - 2], [F[0] + 20, F[1] + 5], [F[0] - 6, F[1] + 6]], "#f08a2c", 2 * u);
  }
  // body: boat-shaped blob with an upturned tail point
  const B: Blob = { a: 128, b: 66, nTop: 2.2, nBot: 2.2, egg: -0.05, asym: 0.06, rot: -0.04, noise: 0.01, seed: o.seed + 1 };
  const bc: P2 = [292, by];
  const bp0 = blobPts(bc[0], bc[1], B);
  const tail: P2[] = [[bc[0] - 96, bc[1] - 30], [bc[0] - 156, bc[1] - 58 - 6 * Math.sin(t * 1.5)], [bc[0] - 112, bc[1] + 4]];
  const shapeClip = (fn: () => void) => { if (LAND) fn(); else p.clip([[0, 0], [600, 0], [600, wl], [0, wl]], fn); };
  shapeClip(() => {
    p.poly(tail, body, ow * 2); p.poly(bp0, body, ow * 2); p.poly(tail, shade(body, 0.92), 0);
    p.gradFill(bp0, body, mul(body, SH_CLOTH), light);
    p.poly([[bc[0] - 150, bc[1] - 54 - 6 * Math.sin(t * 1.5)], [bc[0] - 128, bc[1] - 40], [bc[0] - 138, bc[1] - 34]], "#2a2733", 0); // black curl
    p.clip(bp0, () => {
      p.ell(bc[0] + 96, bc[1] - 6, 62, 62, chest, 0);
      const wing = [[bc[0] - 70, bc[1] - 40], [bc[0] + 40, bc[1] - 44], [bc[0] + 66, bc[1] - 18], [bc[0] + 10, bc[1] + 10], [bc[0] - 86, bc[1] - 4]] as P2[];
      p.poly(wing, shade(body, 0.86), 1.6 * u);
      p.poly([[bc[0] - 40, bc[1] - 14], [bc[0] + 4, bc[1] - 16], [bc[0] + 2, bc[1] - 4], [bc[0] - 40, bc[1] - 2]], "#3a5ab4", 1.2 * u); // speculum
      for (const x of [-56, -30, -4, 22]) p.stroke([[bc[0] + x, bc[1] - 38], [bc[0] + x + 20, bc[1] - 18]], 1.1 * u, shade(body, 0.7));
    });
  });
  // neck + head
  const hx = bc[0] + 118 + (LAND ? 6 * Math.sin(t * 2) : 3 * Math.sin(t)), hy = bc[1] - 112;
  const neck = tubeW(p, curve([bc[0] + 96, bc[1] - 30], [hx - 10, hy + 60], [hx, hy + 20], 8), [62, 58, 52, 48, 46, 44, 44, 44, 44], headC, 0);
  p.poly(neck, headC, ow * 1.6); p.poly(neck, headC, 0);
  p.band([[hx - 30, hy + 52], [hx + 22, hy + 48]], "#fbf8f0", 7, 1.6, "butt"); // white neck ring
  const HB: Blob = { a: 50, b: 44, nTop: 2.0, nBot: 2.3, egg: 0.05, asym: 0.08, rot: 0, noise: 0.01, seed: o.seed + 2 };
  const hp = blobPts(hx, hy, HB);
  const bl: P2[] = [[hx + 34, hy - 2], [hx + 82, hy + 4], [hx + 88, hy + 14], [hx + 78, hy + 20], [hx + 36, hy + 18]];
  p.poly(bl, bill, ow * 1.2); p.poly(bl, bill, 0); p.stroke([[hx + 40, hy + 10], [hx + 84, hy + 13]], 1.6 * u, shade(bill, 0.6));
  p.dot(hx + 62, hy + 3, 1.4 * u, shade(bill, 0.5));
  p.shadedFill(hp, headC, mul(headC, SH_FELT), light, 50); p.inkRing(hp, ow * 0.9, thick, 0.4);
  p.stroke(curve([hx - 24, hy - 26], [hx, hy - 38], [hx + 22, hy - 28], 8), 3 * u, "rgba(160,230,190,0.45)"); // sheen
  critEye(p, expr, hx + 10, hy - 8, u, blink, headC, 0.85);
  // water: ripple rings + paddle wake at the waterline
  if (!LAND) {
    p.stroke(ellPts(bc[0] + 10, wl + 2, 168 + 8 * Math.sin(t), 13, 0, 180, 0, 24), 3 * u, "rgba(255,255,255,0.75)");
    p.stroke(ellPts(bc[0] - 4, wl + 6, 210 + 12 * ((phase * 2) % 1), 20, 20, 160, 0, 24), 2 * u, `rgba(255,255,255,${0.5 * (1 - ((phase * 2) % 1))})`);
    p.stroke([[bc[0] - 128, wl - 1], [bc[0] + 120, wl - 1]], 2.6 * u);
  }
};

const pigeon = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 5.5 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const t = two * phase, WALK = mode === "walk" || mode === "stride", FLY = mode === "hop" || mode === "air";
  const grey = o.fur ?? "#9aa0b4", dark = shade(grey, 0.72), neckG = "#5aa38a", neckP = "#9a6ab8";
  const peck = Math.max(0, Math.min(1, (opts.tilt ?? 0) / 30));
  const bob = WALK ? Math.sin(2 * t) : Math.sin(t) * 0.4;
  const bc: P2 = [290, FLY ? 700 : 840 + peck * 10];
  const rot = -0.25 + peck * 0.45;
  // feet
  if (!FLY) for (const [x, ph] of [[270, 0], [304, Math.PI]] as [number, number][]) {
    const st = WALK ? Math.sin(t + ph) * 16 : 0, F: P2 = [x + st, 966 - (WALK ? Math.max(0, Math.cos(t + ph)) * 12 : 0)];
    p.band([[x, bc[1] + 40], F], "#e8828e", 7, 2, "round");
    for (const d of [-1, 0, 1]) p.band([F, [F[0] + 14 + d * 2, F[1] + d * 4]], "#e8828e", 4, 1.4, "round");
  }
  // far wing (flying)
  const flap = FLY ? Math.sin(t * 2) : 0;
  const wing = (far: boolean) => { // feathered wing: curved leading edge, scalloped primaries, raised with the flap
    const root: P2 = [bc[0] + (far ? 10 : 0), bc[1] - 30], tip: P2 = [bc[0] - 70 + (far ? 20 : 0), bc[1] - 170 - 90 * flap];
    const lead = curve(root, [root[0] + 30, (root[1] + tip[1]) / 2 - 20], tip, 10), trail: P2[] = [];
    for (let i = 1; i <= 6; i++) { const t = i / 6, x = tip[0] + (root[0] - 60 - tip[0]) * t, y = tip[1] + (root[1] + 10 - tip[1]) * t; trail.push([x - 16, y + 6], [x, y]); }
    const w: P2[] = [...lead, ...trail, [root[0] - 40, root[1] + 14]];
    p.poly(w, far ? dark : shade(grey, 0.95), ow * 0.8);
    for (let i = 1; i < 5; i++) { const t = i / 6; p.stroke([[tip[0] + (root[0] - 60 - tip[0]) * t, tip[1] + (root[1] + 10 - tip[1]) * t], [tip[0] + (root[0] - tip[0]) * t + 14, tip[1] + (root[1] - tip[1]) * t]], 1.2 * u, shade(grey, 0.62)); }
    p.band([[root[0] - 30, root[1] - 30 - 20 * flap], [root[0] - 6, root[1] - 20 - 10 * flap]], "#4a4f62", 6, 0, "butt");
  };
  if (FLY) wing(true);
  // tail fan
  const tl: P2[] = [[bc[0] - 70, bc[1] - 10], [bc[0] - 150, bc[1] + 4 + peck * -30], [bc[0] - 146, bc[1] + 30 + peck * -24], [bc[0] - 60, bc[1] + 30]];
  p.poly(tl, dark, ow); p.stroke([[bc[0] - 148, bc[1] + 12 - peck * 28], [bc[0] - 140, bc[1] + 24 - peck * 26]], 6, "#2a2733");
  // body
  const B: Blob = { a: 104, b: 70, nTop: 2.1, nBot: 2.2, egg: 0.1, asym: 0.1, rot, noise: 0.01, seed: o.seed + 1 };
  const bp = blobPts(bc[0], bc[1], B);
  p.gradFill(bp, grey, mul(grey, SH_CLOTH), light);
  p.clip(bp, () => {
    p.ell(bc[0] + 70, bc[1] - 34, 50, 46, neckG, 0); p.ell(bc[0] + 80, bc[1] - 12, 40, 34, neckP, 0);
    const wing: P2[] = [[bc[0] - 76, bc[1] - 12], [bc[0] + 20, bc[1] - 40], [bc[0] + 50, bc[1] + 4], [bc[0] - 20, bc[1] + 36]];
    p.poly(wing, shade(grey, 0.9), 1.6 * u);
    for (const x of [-30, 0]) p.band([[bc[0] + x - 16, bc[1] - 2], [bc[0] + x + 14, bc[1] + 8]], "#4a4f62", 6, 0, "butt"); // wing bars
  });
  p.inkRing(bp, ow, thick, 0.4);
  // head (bobs back and forth on the walk, dips to the ground on a peck)
  const hx = bc[0] + 96 + 16 * bob + peck * 40, hy = bc[1] - 96 + peck * 150;
  const neck = tubeW(p, curve([bc[0] + 60, bc[1] - 30], [hx - 10, (hy + bc[1]) / 2], [hx, hy + 14], 8), [70, 62, 52, 44, 40, 38, 38, 38, 38], neckG, 0);
  p.poly(neck, neckG, ow * 1.6); p.poly(neck, neckG, 0);
  p.clip(neck, () => p.ell(hx - 6, hy + 46, 32, 30, neckP, 0));
  const HB: Blob = { a: 40, b: 36, nTop: 2.0, nBot: 2.3, egg: 0.0, asym: 0.08, rot: peck * 0.6, noise: 0.01, seed: o.seed + 2 };
  const hp = blobPts(hx, hy, HB);
  const bk: P2[] = [[hx + 30, hy - 4 + peck * 10], [hx + 58, hy + 6 + peck * 22], [hx + 30, hy + 10 + peck * 10]];
  p.poly(bk, "#4a4048", ow * 0.7); p.ell(hx + 32, hy - 6 + peck * 10, 7, 5, "#f4f1ea", 1.2 * u);
  p.shadedFill(hp, grey, mul(grey, SH_SKIN), light, 40); p.inkRing(hp, ow * 0.85, thick, 0.4);
  p.ell(hx + 8, hy - 8 + peck * 6, 10, 10, "#f08a2c", 1.6 * u);
  critEye(p, expr, hx + 8, hy - 8 + peck * 6, u, blink, "#f08a2c", 0.55);
  if (FLY) wing(false);
};

// ---------------- pig (potato short): round pink barrel body, big snout disk, floppy ears, curly tail ----------------
// ~1.15 m long at scale 1 (place with CastPlace scale ~0.75 next to people). Modes: stand, walk (phase), FigOpts.tilt > 0
// lowers the head into the trough (eating: 0..25), mouth "O" / "teeth" = open (chomping), expr "joy" / "grin" = ^^ eyes,
// "dismay" / "sad" / "sheepish" = sad brows + droopy ears, "shock" = round eyes, phase drives the walk + tail + ear flick.
const pig = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 6.4 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0, tilt = 0 } = opts;
  const WALK = mode === "walk" || mode === "run" || mode === "stride", t = two * phase;
  const pink = o.fur ?? "#f4a7b4", dark = mix(pink, INK, 0.22), snoutC = shade(pink, 1.06), hoof = "#5a3a4a";
  const SAD = expr === "dismay" || expr === "sheepish", HAPPY = expr === "joy" || expr === "grin" || expr === "laugh";
  const ground = 968, bob = WALK ? 4 * Math.sin(2 * t) : 0;
  p.g.save(); p.g.translate(-56, 0);
  // legs: far pair first (darker), short stubs with hooves
  const leg = (x: number, far: boolean, ph: number) => {
    const sw = WALK ? 16 * Math.sin(t + ph) : 0, lift = WALK ? Math.max(0, Math.cos(t + ph)) * 10 : 0;
    const top: P2 = [x, 870 + bob], ft: P2 = [x + sw, ground - lift];
    p.band([top, ft], far ? dark : pink, 34, ow * 0.8, "round");
    p.ell(ft[0] + 2, ft[1] - 5, 19, 9, hoof, ow * 0.5);
  };
  leg(170, true, Math.PI); leg(400, true, 0);
  // tail: a little curl on the rump
  const tw = 4 * Math.sin(t * 1.5);
  p.stroke([[84, 800 + bob], [62, 790 + bob + tw], [52, 808 + bob], [66, 818 + bob], [72, 800 + bob - tw]], 3.4 * u, INK);
  // body barrel
  const bp = blobPts(300, 800 + bob, { a: 228, b: 118, nTop: 2.2, nBot: 2.1, egg: -0.06, asym: 0.05, rot: -0.03, noise: 0.012, seed: o.seed });
  p.shadedFill(bp, pink, mul(pink, SH_SKIN), light, 70);
  p.clip(bp, () => { p.ell(300, 900 + bob, 190, 40, shade(pink, 1.07), 0); for (const [x, y] of [[230, 720], [300, 712], [370, 724]] as P2[]) p.stroke([[x - 6, y + bob], [x + 6, y + 8 + bob]], 1.3 * u, shade(pink, 0.8)); });
  p.inkRing(bp, ow, thick, 0.4);
  leg(200, false, 0); leg(430, false, Math.PI);
  // head (lowers with tilt for eating)
  const dn = Math.max(0, Math.min(1, tilt / 25)), hx = 500 + 14 * dn, hy = 742 + bob + 110 * dn;
  const hp = blobPts(hx, hy, { a: 92, b: 84, nTop: 2.1, nBot: 2.3, egg: 0.04, asym: 0.08, rot: 0.1 + 0.5 * dn, noise: 0.012, seed: o.seed + 5 });
  // far ear behind the head
  const earDroop = SAD ? 22 : 0, flick = 6 * Math.sin(t * 0.7);
  p.poly([[hx - 40, hy - 60], [hx - 70, hy - 118 + earDroop + flick], [hx - 2, hy - 80]], dark, ow * 0.7);
  p.shadedFill(hp, pink, mul(pink, SH_SKIN), light, 50); p.inkRing(hp, ow * 0.95, thick, 0.4);
  // near ear (floppy, folds forward)
  p.poly([[hx + 2, hy - 70], [hx + 28, hy - 132 + earDroop - flick], [hx + 52, hy - 58]], shade(pink, 1.04), ow * 0.8);
  // snout disk with nostrils, mouth
  const sx = hx + 86, sy = hy + 22 + 10 * dn;
  p.ell(sx, sy, 30, 38, snoutC, ow * 0.85);
  p.ell(sx - 2, sy - 12, 6, 10, "#a8566a", 0); p.ell(sx - 2, sy + 12, 6, 10, "#a8566a", 0);
  const mo = opts.mouth, open = mo === "O" || mo === "teeth" || mo === "smileWide" || mo === "o";
  if (open) { const d = mo === "o" ? 12 : 26; p.poly([[sx - 66, sy + 30], [sx - 22, sy + 34], [sx - 30, sy + 34 + d], [sx - 60, sy + 38 + d * 0.6]], "#7a2e44", 2.6 * u); p.poly([[sx - 58, sy + 32], [sx - 30, sy + 35], [sx - 34, sy + 42], [sx - 56, sy + 40]], "#fbf8f1", 0); }
  else if (HAPPY) p.stroke(curve([sx - 62, sy + 26], [sx - 40, sy + 46], [sx - 18, sy + 34], 8), 3 * u);
  else if (SAD) p.stroke(curve([sx - 60, sy + 42], [sx - 40, sy + 30], [sx - 20, sy + 40], 8), 3 * u);
  else p.stroke([[sx - 58, sy + 34], [sx - 24, sy + 36]], 3 * u);
  // eye + brow
  const ex = hx + 34, ey = hy - 18;
  if (HAPPY && blink < 1) p.stroke(curve([ex - 10, ey + 4], [ex, ey - 8], [ex + 10, ey + 4], 6), 3.4 * u);
  else critEye(p, expr, ex, ey, u, blink, pink, 1.05);
  if (SAD) p.stroke([[ex - 14, ey - 22], [ex + 12, ey - 14]], 3.2 * u);
  p.g.restore();
};

// ===================== "Why He Painted Eyes on Cows' Butts" animals =====================
// Same ink + painted flat shading as the pig. Profile cards face right (fig.ts mirrors for facing < 0); ground y = 968.
//  cow     ~2.3 m long at CastPlace scale 1.7. Look.painted = big painted eyes on the rump (white almond, black pupil,
//          lashes, in the accent teal outline). opts.back = the REAR view (rump to the camera: both painted eyes, tail
//          down the middle, the head peeking back over the shoulder). Modes: stand, walk (phase), graze (tilt > 0 lowers
//          the head). Faces: neutral, sheepish (embarrassed: eyes slide away + sweat), shock, dismay, smile, joy.
//  lion    ~2.4 m long at scale 1.75 (a big maned male). Modes: stand, walk (phase), stride = the stalk (body low, slow
//          creeping steps; play phase backwards to back away), kneel = crouched still before the pounce, sit, lie (sulk).
//          Faces: sly (slit eyes), shock (round), dismay, sheepish (+ sweat), joy, sleep.
//  impala  ~1.6 m long at scale 1.25. Modes: stand, walk, graze (tilt). opts.look < -0.5 = head turned back over the
//          shoulder (stares behind it); expr "stare" = wide dead-level stare.
const almondEye = (p: Pen, x: number, y: number, w: number, h: number, look: number, u: number, rim = "#19b7b0") => {
  const pts: P2[] = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * two; pts.push([x + Math.cos(a) * w, y + Math.sin(a) * h * (Math.sin(a) < 0 ? 1 : 0.85)]); }
  p.poly(pts, rim, 0);
  const inner = pts.map(([px, py]) => [x + (px - x) * 0.86, y + (py - y) * 0.8] as P2);
  p.poly(inner, "#fbf8f0", 2.2 * u);
  p.ell(x + look * w * 0.3, y + h * 0.05, h * 0.62, h * 0.66, "#2a2030", 0);
  p.dot(x + look * w * 0.3 - h * 0.2, y - h * 0.22, h * 0.16, "#ffffff");
  for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * 0.32; p.stroke([[x + Math.cos(a) * w * 0.86, y + Math.sin(a) * h * 0.8], [x + Math.cos(a) * w * 1.12, y + Math.sin(a) * h * 1.25]], 2.4 * u); }
};
const cow = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 6.2 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0, tilt = 0, look = 0 } = opts;
  const WALK = mode === "walk" || mode === "run" || mode === "stride", t = two * phase;
  const coat = o.fur ?? "#c8875a", patch = o.patch, dark = mix(coat, INK, 0.25), hoof = "#3a2a2e", muzzle = "#f2c6b6", horn = "#f4ead0";
  const SAD = expr === "dismay" || expr === "sheepish", HAPPY = expr === "joy" || expr === "smile" || expr === "grin";
  const ground = 968, bob = WALK ? 4 * Math.sin(2 * t) : 0;
  if (opts.back) { cowBack(p, o, opts, light); return; }
  const leg = (x: number, far: boolean, ph: number) => {
    const sw = WALK ? 22 * Math.sin(t + ph) : 0, lift = WALK ? Math.max(0, Math.cos(t + ph)) * 14 : 0;
    const top: P2 = [x, 812 + bob], knee: P2 = [x + sw * 0.5 + 4, 892], ft: P2 = [x + sw, ground - lift];
    p.band([top, knee, ft], far ? dark : coat, 26, ow * 0.75, "round");
    p.poly([[ft[0] - 13, ft[1] - 14], [ft[0] + 13, ft[1] - 14], [ft[0] + 15, ft[1] + 1], [ft[0] - 15, ft[1] + 1]], hoof, ow * 0.5);
  };
  leg(118, true, Math.PI); leg(400, true, 0);
  // tail: hangs from the rump with a dark tuft, swishes slowly
  const sw = 10 * Math.sin(t * 0.8 + 1);
  const tail = curve([66, 712 + bob], [36 + sw * 0.5, 800], [46 + sw, 884], 10);
  p.stroke(tail, 4 * u, INK); p.stroke(tail, 2 * u, coat);
  p.ell(tail[tail.length - 1][0], tail[tail.length - 1][1] + 14, 11, 22, mix(coat, INK, 0.55), 2 * u);
  // body barrel (deep chest, square-ish rump)
  const bp = blobPts(250, 744 + bob, { a: 205, b: 102, nTop: 2.6, nBot: 2.2, egg: -0.05, asym: 0.06, rot: -0.02, noise: 0.01, seed: o.seed });
  p.shadedFill(bp, coat, mul(coat, SH_SKIN), light, 70);
  p.clip(bp, () => {
    p.ell(260, 842 + bob, 170, 34, shade(coat, 1.08), 0);
    if (patch) for (const [x, y, rx, ry] of [[200, 700, 60, 42], [330, 760, 48, 36], [120, 780, 34, 26]] as [number, number, number, number][]) p.ell(x, y + bob, rx, ry, patch, 0, 0, 360, 0.3);
  });
  p.inkRing(bp, ow, thick, 0.4);
  // the painted eye on the haunch (side view: the near rump eye, the far one just peeks over the edge)
  const pk = opts.paintK ?? (o.painted ? 1 : 0);
  if (pk >= 0.5) almondEye(p, 108, 714 + bob, 40, 24, -0.6, u); if (pk >= 1) almondEye(p, 58, 722 + bob, 14, 20, -0.9, u * 0.8);
  leg(150, false, 0); leg(430, false, Math.PI);
  // udder hint
  p.ell(210, 846 + bob, 24, 14, muzzle, 2 * u);
  // head: on a short neck, lowers to graze with tilt
  const dn = Math.max(0, Math.min(1, tilt / 25)), hx = 492 + 10 * dn, hy = 664 + bob + 200 * dn;
  p.band([[420, 700 + bob], [hx - 30, hy + 20]], coat, 84, ow * 0.6, "round");
  const hp = blobPts(hx, hy, { a: 62, b: 70, nTop: 2.2, nBot: 2.0, egg: -0.1, asym: 0.06, rot: 0.25 + 0.6 * dn, noise: 0.01, seed: o.seed + 7 });
  // ears + horns behind the head
  p.poly([[hx - 40, hy - 40], [hx - 92, hy - 46 + (SAD ? 18 : 0)], [hx - 46, hy - 16]], dark, ow * 0.7);
  p.band(curve([hx - 18, hy - 56], [hx - 30, hy - 96], [hx - 4, hy - 112], 8), horn, 14, ow * 0.5, "round");
  p.shadedFill(hp, coat, mul(coat, SH_SKIN), light, 50); p.inkRing(hp, ow * 0.95, thick, 0.4);
  if (patch) p.clip(hp, () => p.ell(hx - 18, hy - 30, 30, 26, patch, 0));
  p.band(curve([hx + 10, hy - 58], [hx + 18, hy - 100], [hx + 44, hy - 110], 8), horn, 14, ow * 0.5, "round");
  p.poly([[hx + 20, hy - 46], [hx + 66, hy - 60 + (SAD ? 20 : 0)], [hx + 36, hy - 24]], shade(coat, 1.04), ow * 0.7);
  // muzzle with nostrils + mouth
  const mx = hx + 44 + 6 * dn, my = hy + 46 + 6 * dn;
  p.ell(mx, my, 40, 30, muzzle, ow * 0.85, 0, 360, 0.2 + 0.4 * dn);
  p.ell(mx + 14, my - 6, 6, 8, "#8a4a4a", 0); p.ell(mx - 10, my - 8, 5, 7, "#8a4a4a", 0);
  const mo = opts.mouth;
  if (mo === "O" || mo === "o" || mo === "teeth") p.ell(mx + 2, my + 18, mo === "o" ? 8 : 14, mo === "o" ? 6 : 11, "#6a2a3a", 2.4 * u);
  else if (HAPPY) p.stroke(curve([mx - 22, my + 14], [mx, my + 26], [mx + 22, my + 14], 8), 3 * u);
  else if (SAD) p.stroke(curve([mx - 20, my + 24], [mx, my + 14], [mx + 20, my + 24], 8), 3 * u);
  else p.stroke([[mx - 18, my + 18], [mx + 18, my + 18]], 3 * u);
  // eye (+ embarrassed: looks away, sweat drop)
  const ex = hx + 14, ey = hy - 12, lk = expr === "sheepish" ? -0.9 : look;
  if (HAPPY && blink < 1) p.stroke(curve([ex - 10, ey + 4], [ex, ey - 8], [ex + 10, ey + 4], 6), 3.4 * u);
  else { critEye(p, expr, ex + lk * 3, ey, u, blink, coat, 1.1); }
  if (SAD) p.stroke([[ex - 14, ey - 22], [ex + 12, ey - 16]], 3.2 * u);
  if ((opts.sweat ?? 0) > 0 || expr === "sheepish") { const sx = hx - 50, sy = hy - 60 + (opts.sweat ?? 1) * 8; p.poly([[sx, sy - 12], [sx + 7, sy + 3], [sx, sy + 9], [sx - 7, sy + 3]], "#8fd0f6", 1.6 * u); }
};
/** the cow from behind: the rump fills the card, two painted eyes stare at the camera, the head peeks back on the right */
const cowBack = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 6.2 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0, look = 0 } = opts;
  const WALK = mode === "walk", t = two * phase, coat = o.fur ?? "#c8875a", patch = o.patch, dark = mix(coat, INK, 0.25), hoof = "#3a2a2e", horn = "#f4ead0";
  const bob = WALK ? 4 * Math.sin(2 * t) : 0, ground = 968;
  // the head peeking round the right side, looking back at us
  const hx = 452, hy = 600 + bob;
  for (const s of [-1, 1]) p.band(curve([hx + s * 26, hy - 56], [hx + s * 46, hy - 90], [hx + s * 30, hy - 112], 8), horn, 13, ow * 0.5, "round");
  p.poly([[hx - 40, hy - 30], [hx - 92, hy - 26], [hx - 50, hy - 4]], dark, ow * 0.7);
  const hp = blobPts(hx, hy, { a: 60, b: 66, nTop: 2.2, nBot: 2.0, egg: -0.1, asym: 0.05, rot: -0.1, noise: 0.01, seed: o.seed + 9 });
  p.poly([[hx + 40, hy - 30], [hx + 92, hy - 26], [hx + 50, hy - 4]], dark, ow * 0.7);
  p.shadedFill(hp, coat, mul(coat, SH_SKIN), light, 50); p.inkRing(hp, ow * 0.95, thick, 0.4);
  p.ell(hx + 6, hy + 42, 34, 24, "#f2c6b6", ow * 0.8);
  const ex = hx - 4, ey = hy - 14;
  critEye(p, expr, ex, ey, u, blink, coat, 1.1);
  if (expr === "sheepish" || (opts.sweat ?? 0) > 0) { p.poly([[hx + 60, hy - 52], [hx + 67, hy - 37], [hx + 60, hy - 31], [hx + 53, hy - 37]], "#8fd0f6", 1.6 * u); p.stroke([[ex - 14, ey - 22], [ex + 12, ey - 16]], 3.2 * u); }
  // hind legs
  for (const [x, ph] of [[220, 0], [380, Math.PI]] as [number, number][]) {
    const lift = WALK ? Math.max(0, Math.cos(t + ph)) * 14 : 0;
    p.band([[x, 820 + bob], [x + (x < 300 ? -6 : 6), 900], [x, ground - lift]], dark, 34, ow * 0.75, "round");
    p.poly([[x - 16, ground - lift - 14], [x + 16, ground - lift - 14], [x + 18, ground - lift + 1], [x - 18, ground - lift + 1]], hoof, ow * 0.5);
  }
  // the rump: a wide heart-ish shape
  const rp = blobPts(300, 732 + bob, { a: 172, b: 150, nTop: 2.4, nBot: 2.0, egg: 0.08, asym: 0.03, rot: 0, noise: 0.012, seed: o.seed + 2 });
  p.shadedFill(rp, coat, mul(coat, SH_SKIN), light, 90); p.inkRing(rp, ow, thick, 0.4);
  if (patch) p.clip(rp, () => { p.ell(220, 660 + bob, 70, 50, patch, 0); p.ell(400, 800 + bob, 50, 40, patch, 0); });
  // the dip between the cheeks
  p.stroke(curve([300, 610 + bob], [296, 700 + bob], [300, 800 + bob], 8), 2 * u, mul(coat, SH_SKIN));
  // painted eyes, one on each cheek, staring straight out
  const pk = opts.paintK ?? (o.painted ? 1 : 0), lk = Math.max(-1, Math.min(1, look * 0));
  if (pk >= 1) { almondEye(p, 212, 720 + bob, 66, 40, lk, u); p.band([[160, 660 + bob], [262, 668 + bob]], "#2a2030", 9, 0, "round"); }
  if (pk >= 0.5) { almondEye(p, 388, 720 + bob, 66, 40, lk, u); p.band([[338, 668 + bob], [440, 660 + bob]], "#2a2030", 9, 0, "round"); }
  // tail down the middle with a tuft, swishing
  const sw = 14 * Math.sin(t * 0.8 + 0.5);
  const tail = curve([300, 600 + bob], [300 + sw * 0.4, 740], [300 + sw, 880], 10);
  p.stroke(tail, 4.2 * u, INK); p.stroke(tail, 2 * u, coat);
  p.ell(tail[tail.length - 1][0], tail[tail.length - 1][1] + 16, 12, 24, mix(coat, INK, 0.55), 2 * u);
};
const lion = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 6.2 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0 } = opts;
  const t = two * phase, fur = o.fur ?? "#d9a24a", mane = o.patch ?? "#a8582a", dark = mix(fur, INK, 0.22), belly = shade(fur, 1.12);
  const STALK = mode === "stride", CROUCH = mode === "kneel", SIT = mode === "sit", LIE = mode === "lie", WALK = mode === "walk" || STALK;
  const low = STALK ? 60 : CROUCH ? 92 : LIE ? 150 : 0, ground = 968, bob = WALK ? (STALK ? 2 : 4) * Math.sin(2 * t) : 0;
  const SAD = expr === "dismay" || expr === "sheepish", SHOCK = expr === "shock" || expr === "yikes" || expr === "aghast";
  const by = 760 + low * 0.9 + bob;
  const leg = (x: number, far: boolean, ph: number, front: boolean) => {
    if (LIE) { const fx = front ? x + 60 : x - 10; p.band([[x, by + 30], [fx, ground - 8]], far ? dark : fur, 30, ow * 0.7, "round"); p.ell(fx + 8, ground - 10, 22, 12, far ? dark : fur, ow * 0.6); return; }
    const amp = STALK ? 30 : 24, sw = WALK ? amp * Math.sin(t + ph) : 0, lift = WALK ? Math.max(0, Math.cos(t + ph)) * (STALK ? 8 : 14) : 0;
    const raise = front && !far ? Math.max(0, Math.min(1, opts.lift ?? 0)) : 0;
    if (raise > 0) { const top: P2 = [x, by + 50], knee: P2 = [x + 46 * raise + 10, by + 70 - 30 * raise], ft: P2 = [x + 70 * raise + 10, by + 120 - 40 * raise]; p.band([top, knee, ft], fur, 32, ow * 0.75, "round"); p.ell(ft[0] + 12, ft[1] + 4, 22, 13, fur, ow * 0.6); return; }
    const top: P2 = [x, by + 50], knee: P2 = [x + sw * 0.5 + (front ? 10 : -14) + (STALK || CROUCH ? (front ? 30 : -30) : 0), by + 50 + (ground - by - 50) * 0.5 - (STALK || CROUCH ? 10 : 0)], ft: P2 = [x + sw + (CROUCH ? (front ? 40 : -10) : 0), ground - lift];
    if (SIT && !front) { p.ell(x + 10, ground - 40, 60, 44, far ? dark : fur, ow * 0.7); p.ell(x + 60, ground - 8, 30, 12, far ? dark : fur, ow * 0.6); return; }
    p.band([top, knee, ft], far ? dark : fur, 32, ow * 0.75, "round");
    p.ell(ft[0] + 10, ft[1] - 8, 22, 12, far ? dark : fur, ow * 0.6);
  };
  const sitRot = SIT ? -0.5 : 0;
  leg(140, true, Math.PI, false); leg(420, true, 0, true);
  // tail: long, curving up, dark tuft; flicks
  const tf = 18 * Math.sin(t * (STALK || CROUCH ? 1.6 : 0.8));
  const tail = curve([70, by - 10], [10, by + 60 + tf * 0.4], [-20 + tf, by - 30 - (CROUCH ? 30 : 0)], 12);
  p.stroke(tail, 5 * u, INK); p.stroke(tail, 2.6 * u, fur);
  p.ell(tail[tail.length - 1][0], tail[tail.length - 1][1] - 8, 13, 20, mane, 2 * u);
  // body
  const bp = blobPts(270, by, { a: 200, b: 76, nTop: 2.2, nBot: 2.2, egg: 0.06, asym: 0.04, rot: sitRot + (CROUCH ? 0.06 : 0), noise: 0.01, seed: o.seed });
  p.shadedFill(bp, fur, mul(fur, SH_SKIN), light, 60);
  p.clip(bp, () => p.ell(270, by + 60, 170, 26, belly, 0));
  p.inkRing(bp, ow, thick, 0.4);
  leg(170, false, 0, false); leg(450, false, Math.PI, true);
  // head with a shaggy mane
  const hx = 486 + (SIT ? -20 : 0), hy = by - 54 - (SIT ? 90 : 0) + (CROUCH ? 24 : 0) + (LIE ? 40 : 0);
  const mp: P2[] = []; for (let i = 0; i < 26; i++) { const a = (i / 26) * two, rr = 104 + (i % 2 ? 18 : 0) + 6 * Math.sin(i * 1.7 + o.seed); mp.push([hx - 18 + Math.cos(a) * rr, hy + 8 + Math.sin(a) * rr * 0.95]); }
  p.shadedFill(mp, mane, mul(mane, SH_FELT), light, 80); p.inkRing(mp, ow, thick, 0.4);
  const hp = blobPts(hx + 6, hy + 6, { a: 66, b: 70, nTop: 2.2, nBot: 1.9, egg: -0.12, asym: 0.05, rot: 0.1, noise: 0.01, seed: o.seed + 4 });
  p.shadedFill(hp, fur, mul(fur, SH_SKIN), light, 50); p.inkRing(hp, ow * 0.95, thick, 0.4);
  // ears
  for (const [ex0, ey0] of [[hx - 26, hy - 56], [hx + 30, hy - 58]] as P2[]) p.ell(ex0, ey0, 16, 14, fur, ow * 0.7);
  // muzzle + nose + mouth
  const mx = hx + 46, my = hy + 34;
  p.ell(mx - 6, my, 34, 26, belly, ow * 0.8);
  p.poly([[mx + 6, my - 26], [mx + 26, my - 22], [mx + 16, my - 10]], "#6a3a3a", 2 * u);
  const mo = opts.mouth;
  if (mo === "O" || mo === "teeth" || mo === "smileWide") { p.poly([[mx - 30, my + 12], [mx + 10, my + 10], [mx - 2, my + 38], [mx - 26, my + 34]], "#6a2a3a", 2.6 * u); p.poly([[mx - 22, my + 12], [mx - 16, my + 22], [mx - 10, my + 12]], "#ffffff", 0); }
  else if (SAD) p.stroke(curve([mx - 30, my + 24], [mx - 10, my + 14], [mx + 8, my + 24], 8), 3 * u);
  else if (expr === "sly" || expr === "smug") p.stroke(curve([mx - 30, my + 14], [mx - 8, my + 22], [mx + 10, my + 10], 8), 3 * u);
  else p.stroke([[mx - 26, my + 16], [mx + 6, my + 16]], 3 * u);
  // eye + brow
  const ex = hx + 12, ey = hy - 12;
  if (expr === "sly" && blink < 1) { p.ell(ex, ey + 2, 11, 5, "#2a2030", 0); p.stroke([[ex - 14, ey - 4], [ex + 14, ey - 2]], 3.4 * u); p.stroke([[ex - 14, ey - 18], [ex + 12, ey - 10]], 3.4 * u); }
  else critEye(p, SHOCK ? "shock" : expr, ex, ey, u, blink, fur, 1.15);
  if (SAD) p.stroke([[ex - 14, ey - 22], [ex + 12, ey - 14]], 3.2 * u);
  if ((opts.sweat ?? 0) > 0) { const sx = hx - 70, sy = hy - 70 + (opts.sweat ?? 0) * 10; p.poly([[sx, sy - 13], [sx + 8, sy + 3], [sx, sy + 10], [sx - 8, sy + 3]], "#8fd0f6", 1.6 * u); }
};
const impala = (p: Pen, o: Look, opts: FigOpts, light: number) => {
  const u = 2.36, ow = 5.4 * u, thick = thickAngle(light);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0, tilt = 0, look = 0 } = opts;
  const WALK = mode === "walk" || mode === "run", t = two * phase, fur = o.fur ?? "#c67a46", belly = "#f6ecdc", dark = mix(fur, INK, 0.25);
  const ground = 968, bob = WALK ? 3 * Math.sin(2 * t) : 0, by = 740 + bob, BACK = look < -0.5;
  const leg = (x: number, far: boolean, ph: number) => {
    const sw = WALK ? 20 * Math.sin(t + ph) : 0, lift = WALK ? Math.max(0, Math.cos(t + ph)) * 14 : 0;
    p.band([[x, by + 40], [x + sw * 0.5 + 6, 880], [x + sw, ground - lift]], far ? dark : fur, 14, ow * 0.6, "round");
    p.ell(x + sw + 2, ground - lift - 4, 9, 6, "#2a2030", 0);
  };
  leg(180, true, Math.PI); leg(370, true, 0);
  p.ell(150, by - 20, 14, 26, "#ffffff", ow * 0.6); // white tail flag
  const bp = blobPts(275, by, { a: 135, b: 62, nTop: 2.2, nBot: 2.4, egg: 0.04, asym: 0.04, rot: -0.04, noise: 0.01, seed: o.seed });
  p.shadedFill(bp, fur, mul(fur, SH_SKIN), light, 50);
  p.clip(bp, () => { p.ell(280, by + 50, 130, 26, belly, 0); p.stroke(curve([160, by + 18], [270, by + 30], [390, by + 16], 10), 2.4 * u, mix(fur, INK, 0.4)); });
  p.inkRing(bp, ow, thick, 0.4);
  leg(200, false, 0); leg(392, false, Math.PI);
  // long neck + head (grazing lowers it; looking back turns the head round over the shoulder)
  const dn = Math.max(0, Math.min(1, tilt / 25));
  const nb: P2 = [385, by - 20], hx = BACK ? 330 : 446 + 10 * dn, hy = BACK ? by - 190 : by - 170 + 230 * dn;
  p.band([nb, [hx + (BACK ? 20 : -14), hy + 30]], fur, 44, ow * 0.6, "round");
  const fs = BACK ? -1 : 1;
  // lyre horns
  for (const s of [0, 1]) p.band(curve([hx - 6 * fs + s * 10 * fs, hy - 40], [hx - 40 * fs + s * 8 * fs, hy - 110], [hx - 10 * fs + s * 12 * fs, hy - 170], 10), "#3a2a2a", 9, 0, "round");
  // big ears
  p.ell(hx - 30 * fs, hy - 34, 30, 13, fur, ow * 0.6, 0, 360, -0.5 * fs); p.ell(hx - 30 * fs, hy - 34, 18, 6, "#f2d8c8", 0, 0, 360, -0.5 * fs);
  const hp = blobPts(hx + 18 * fs, hy, { a: 50, b: 34, nTop: 2.2, nBot: 2.2, egg: 0.1 * fs, asym: 0.05, rot: (0.2 + 0.7 * dn) * fs, noise: 0.01, seed: o.seed + 3 });
  p.shadedFill(hp, fur, mul(fur, SH_SKIN), light, 36); p.inkRing(hp, ow * 0.9, thick, 0.4);
  p.dot(hx + 58 * fs, hy + 6 + 10 * dn, 6, "#2a2030");
  // the eye: "stare" = wide white eye, dead-level lid, small pupil
  const ex = hx + 10 * fs, ey = hy - 8;
  if (expr === "stare" || expr === "shock") { p.ell(ex, ey, 15, 14, "#ffffff", 2.6 * u); p.dot(ex + 3 * fs, ey + 1, 5); p.stroke([[ex - 17, ey - 8], [ex + 17, ey - 8]], 3.6 * u); }
  else critEye(p, expr, ex, ey, u * 0.9, blink, fur, 1);
};
