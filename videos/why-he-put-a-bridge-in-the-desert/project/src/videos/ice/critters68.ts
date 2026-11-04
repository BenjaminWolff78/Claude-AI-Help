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
