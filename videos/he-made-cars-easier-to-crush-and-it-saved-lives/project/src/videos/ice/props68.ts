// 1968 "bridge in the desert" hand props, drawn around the hand point h (design coords, before the Pen's body rotation).
// Same conventions as fig.ts drawProp: prop units are u (1 % of the head width), +y = down, `ang` rotates the prop
// about the hand, `k` is a per-prop control (FigOpts.propK). Called from drawProp's default branch.
//
//  name            hold with                     k
//  umbrella        propR/L, arm hanging (crook)   colour 0 black, 1 red, 2 navy, 3 green
//  umbrellaOpen    propR/L, hand at chest height  colour (as umbrella)
//  giantCheque     propR, cheque spreads LEFT of the hand across the body (armRFront); giantChequeL for the left hand
//  pen             propR, hand at the writing point; nib under the hand
//  cake            propR (or both hands under it: carry pose), candles flicker with k (any number, e.g. frame / 3)
//  bridgePaper     propR + "paper" pose (both hands at the bottom edge): front page photo of the five-arch bridge,
//                  headline BRIDGE / FOR SALE
//  shoe            propR, held by the heel upside down; k = 0..1 sand pouring out
//  sandJar         propR, hand under the jar; "$1" tag
//  ruler           propR/L: 2 m surveyor's staff, the hand grips it ~1.1 m from its foot; k = slide (metres, + = up)
//  chart           propR, blueprint spreads LEFT of the hand (armRFront); chartL for the left hand
//  paintPot        propL/R hanging from the bail; paintBrush: brush with wet white paint
//  jigsawLid       propR, hand at the bottom edge, lid faces the camera; "10,000 PIECES"
//  camera          propR, hand under the camera (hold it up at the face with armR [[30,0],[10,-56]] style poses)
//  iceCream        propR/L, hand on the cone
//  pennant         propR/L, stick up from the hand; k = flutter phase
//  brochure        propR, hand at the bottom edge
//  numStone        propR/L carried stone block with its painted number k (integer)
//  paperHead       propR + paper pose: newspaper front page k (0 DUMBEST EXCUSE, 1 the review, 2 the poll)
//  plasticBook     propR, book held open toward the camera (PLASTIC INVENTED 1907)
//  resinBottle     propR by the neck; ang tips it, k = pour stream | rag | crowbar | gavel | testTube (k smoke) | scraper
import { Pen, INK, P2, rotPts, curve, ellPts, shade } from "./toon";

const SANS = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif', CONDENSED = '"DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans", sans-serif';
const SERIF = '"DejaVu Serif", "Liberation Serif", Georgia, serif';
/** text fitted inside maxW x maxH (design units), centred on c, rotated by ang (+ the Pen's body rotation) */
const txt = (p: Pen, s: string, c: P2, maxW: number, maxH: number, ang = 0, col: string = INK, weight = 800, fam = SANS) => {
  const g = p.g, [x, y] = p.P(c[0], c[1]), a = ang + (p.rot ? p.rot[0] : 0);
  g.save(); g.font = `${weight} 100px ${fam}`;
  const w100 = g.measureText(s).width || 1, size = Math.min((100 * maxW) / w100, maxH / 0.73);
  g.font = `${weight} ${size}px ${fam}`; g.translate(x, y); g.rotate(a);
  g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(s, 0, 0.365 * size);
  g.restore();
};
const UMB = ["#2a2733", "#c8352e", "#2f4fa0", "#2f7a5a"];

/** a little five-arch granite bridge over water inside the box [x0, y0, x1, y1] (prop units), for photos and box lids */
const bridgePic = (p: Pen, R: (pts: P2[]) => P2[], u: number, x0: number, y0: number, x1: number, y1: number, photo: boolean) => {
  const w = x1 - x0, h = y1 - y0, wl = y0 + h * 0.68;
  p.poly(R([[x0, y0], [x1, y0], [x1, wl], [x0, wl]]), photo ? "#c9ccc8" : "#9fd0ef", 0); // sky
  if (!photo) for (const [cx, cy, r] of [[0.2, 0.2, 0.07], [0.3, 0.18, 0.09], [0.75, 0.22, 0.08]] as [number, number, number][]) p.poly(R(ellPts(x0 + cx * w, y0 + cy * h, r * w, r * h * 0.9)), "#ffffff", 0);
  p.poly(R([[x0, wl], [x1, wl], [x1, y1], [x0, y1]]), photo ? "#8f9693" : "#3d7fc0", 0); // water
  const deck = y0 + h * 0.36, top = deck - h * 0.07, base = wl + h * 0.02;
  const stone = photo ? "#6e7270" : "#d8c9a8", dark = photo ? "#3c403e" : "#8a7a5e";
  p.poly(R([[x0 - 1, top], [x1 + 1, top], [x1 + 1, base], [x0 - 1, base]]), stone, 0);
  for (let i = 0; i < 5; i++) { // arches: the middle one is the biggest, like the 1831 bridge
    const sz = [0.62, 0.82, 1, 0.82, 0.62][i], cx = x0 + w * (0.1 + i * 0.2), rw = w * 0.085 * sz, rh = (base - deck) * 0.92 * sz;
    const arch: P2[] = [[cx - rw, base + 1], ...ellPts(cx, base, rw, rh, 180, 360, 0, 16), [cx + rw, base + 1]];
    p.poly(R(arch), photo ? "#2e3230" : "#2d5f8e", 0);
    p.poly(R(ellPts(cx, base + h * 0.03, rw * 0.9, h * 0.025, 0, 180, 0, 10)), photo ? "#b9bdb9" : "#7fb6e0", 0); // reflection
  }
  p.stroke(R([[x0, top], [x1, top]]), 1.1 * u, dark);
  for (let i = 0; i <= 24; i++) { const x = x0 + (i / 24) * w; p.stroke(R([[x, top - h * 0.03], [x, top]]), 0.6 * u, dark); }
  p.stroke(R([[x0, top - h * 0.03], [x1, top - h * 0.03]]), 0.8 * u, dark);
};

export const drawProp68 = (p: Pen, name: string, h: P2, u: number, ang = 0, k = 0) => {
  const R = (pts: P2[]) => rotPts(pts.map(([x, y]) => [h[0] + x * u, h[1] + y * u] as P2), ang, h[0], h[1]), R0 = R;
  const Q = (x: number, y: number): P2 => R([[x, y]])[0];
  const E = (x: number, y: number, rx: number, ry: number, fill: string | null, ol: number, a0 = 0, a1 = 360) => { const c = Q(x, y); p.ell(c[0], c[1], rx * u, ry * u, fill, ol * u, a0, a1, (ang * 180) / Math.PI); };
  const T = (s: string, x: number, y: number, mw: number, mh: number, col: string = INK, w = 800, fam = SANS) => txt(p, s, Q(x, y), mw * u, mh * u, ang, col, w, fam);
  const ow = 2.6;
  switch (name) {
    case "umbrella": { // rolled city umbrella: crook handle in the hand, slim furled canopy, ferrule at the foot
      const c = UMB[Math.abs(Math.round(k)) % 4];
      p.band(R(curve([0, 4], [-3, -14], [10, -12], 10)), "#7a4a24", 3.6 * u, 1.1 * u, "round");
      p.band(R(curve([10, -12], [15, -10], [13, -2], 6)), "#7a4a24", 3.6 * u, 1.1 * u, "round");
      p.band(R([[0, 2], [0, 112]]), "#5a5e68", 1.8 * u, 0.8 * u, "butt");
      const fur = R([[-1.5, 16], [1.5, 16], [6, 58], [3.5, 96], [0.6, 104], [-0.6, 104], [-3.5, 96], [-6, 58]]);
      p.poly(fur, c, 2 * u);
      p.clip(fur, () => { for (let i = 0; i < 6; i++) p.stroke(R([[-7, 30 + i * 12], [7, 24 + i * 12]]), 1 * u, shade(c, 0.6)); p.stroke(R([[-2.5, 22], [-3, 94]]), 1.6 * u, "rgba(255,255,255,0.22)"); });
      p.poly(R([[-5.5, 52], [5.5, 51], [5.8, 57], [-5.8, 58]]), shade(c, 0.75), 1 * u); E(5.5, 54.5, 1.4, 1.4, "#c9ced6", 0.6);
      p.band(R([[0, 104], [0, 116]]), "#c9ced6", 1.8 * u, 0.8 * u, "round");
      break;
    }
    case "umbrellaOpen": {
      const c = UMB[Math.abs(Math.round(k)) % 4];
      p.band(R(curve([0, 6], [-3, 14], [6, 16], 6)), "#7a4a24", 3.4 * u, 1 * u, "round");
      p.band(R([[0, 6], [0, -118]]), "#5a5e68", 1.8 * u, 0.8 * u, "butt");
      const top: P2[] = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; top.push([Math.cos(a) * 66, -100 + Math.sin(a) * 34]); }
      const scal: P2[] = []; for (let i = 0; i <= 8; i++) { const x = 66 - i * 16.5; scal.push([x, -100]); if (i < 8) scal.push([x - 8.25, -93]); }
      const cp = R([...top, ...scal.slice(1)]);
      p.poly(cp, c, ow * u);
      p.clip(cp, () => { for (const x of [-33, 0, 33]) p.stroke(R(curve([x * 0.15, -134], [x * 0.75, -126], [x * 1.0, -96], 8)), 1.4 * u, shade(c, 0.6));
        p.stroke(R(curve([-50, -110], [-34, -128], [-8, -132], 8)), 3 * u, "rgba(255,255,255,0.2)"); });
      E(0, -135, 2.4, 3.4, "#c9ced6", 1);
      break;
    }
    case "giantCheque": case "giantChequeL": { // big presentation cheque, $2,460,000 (text fitted inside its boxes)
      const s = name === "giantChequeL" ? 1 : -1, X = (x: number) => s * x; // spreads away from the hand across the body
      const box = (x0: number, y0: number, x1: number, y1: number) => R([[X(x0), y0], [X(x1), y0], [X(x1), y1], [X(x0), y1]]);
      p.poly(box(-10, -68, 150, 6), "#eef4de", ow * u);
      p.poly(box(-6, -64, 146, 2), null, 1 * u);
      p.clip(box(-6, -64, 146, 2), () => { for (let i = 0; i < 26; i++) p.stroke(R(curve([X(-6 + i * 6), -64], [X(-2 + i * 6), -31], [X(-6 + i * 6), 2], 6)), 0.5 * u, "rgba(90,140,110,0.25)"); });
      p.poly(box(-6, -64, 146, -52), "#3f8a6a", 0);
      T("FIRST DESERT BANK", X(70), -58, 120, 7.4, "#f4f1e4", 800, CONDENSED);
      T("PAY TO", X(14), -43, 20, 4.6, "#3a4a40", 700, CONDENSED); p.stroke(R([[X(26), -40], [X(140), -40]]), 0.8 * u, "#3a4a40");
      T("THE CITY OF LONDON", X(78), -45.5, 96, 6, INK, 700, SERIF);
      p.poly(box(22, -34, 140, -10), "#ffffff", 1.6 * u);
      T("$2,460,000", X(81), -22, 112, 18, "#1f3a2c", 900, SANS);
      p.stroke(R(curve([X(84), -1], [X(100), -10], [X(118), -2], 10)), 1.4 * u, "#1f2a5a"); p.stroke(R([[X(80), 1], [X(140), 1]]), 0.8 * u, "#3a4a40");
      T("1968", X(8), -2, 16, 5, "#3a4a40", 700, CONDENSED);
      break;
    }
    case "pen": { // fountain pen: black barrel, gold clip + band, silver nib under the hand
      p.poly(R([[-3, -30], [3, -30], [3.2, 2], [-3.2, 2]]), "#2a2733", 1.6 * u);
      p.poly(R([[-3.4, -6], [3.4, -6], [3.4, -3], [-3.4, -3]]), "#e8c14a", 1 * u);
      p.stroke(R([[1.5, -28], [1.5, -14]]), 1.2 * u, "#e8c14a");
      p.poly(R([[-3, 2], [3, 2], [0.4, 12], [-0.4, 12]]), "#c9ced6", 1.2 * u);
      break;
    }
    case "cake": { // big birthday cake on a plate, MANY lit candles (flames flicker with k)
      E(0, 0, 46, 8, "#f4f1ea", 2.2);
      const body = R([[-38, -36], [38, -36], [38, -6], [-38, -6]]);
      p.poly(body, "#f6d9a8", 0); E(0, -6, 38, 9, "#f6d9a8", 0, 0, 180);
      p.poly(R([[-38, -36], [-38, -6]]), null, 2.4 * u); p.poly(R([[38, -36], [38, -6]]), null, 2.4 * u); E(0, -6, 38, 9, null, 2.4, 0, 180);
      p.poly(R([[-38, -22], [38, -22], [38, -17], [-38, -17]]), "#c8352e", 0); // jam layer
      const drip: P2[] = [[-38, -36]]; for (let i = 0; i <= 16; i++) { const x = -38 + i * 4.75; drip.push([x, -30 + (i % 3 === 1 ? 6 : i % 3 === 2 ? 2 : 0)]); } drip.push([38, -36]);
      p.poly(R(drip), "#f7b9cc", 1.6 * u);
      E(0, -36, 38, 9.5, "#fbd3df", 2.2);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI; E(Math.cos(a) * 34, -6 + Math.sin(a) * 8, 2.4, 2.4, ["#f2c230", "#3d7fc0", "#3aa36a"][i % 3], 0.8); }
      const cands: [number, number][] = [];
      for (const [rr, n, off] of [[0.84, 15, 0], [0.56, 10, 0.3], [0.26, 5, 0.1], [0, 1, 0]] as [number, number, number][]) for (let i = 0; i < n; i++) { const a = ((i + off) / n) * Math.PI * 2; cands.push([Math.cos(a) * 34 * rr, -36 + Math.sin(a) * 8.5 * rr]); }
      cands.sort((a, b) => a[1] - b[1]);
      const cc = ["#f4f1ea", "#7fc6ee", "#f2b4c4", "#f2c230"];
      cands.forEach(([x, y], i) => {
        p.band(R([[x, y], [x, y - 11]]), cc[i % 4], 2 * u, 0.7 * u, "butt");
        p.stroke(R([[x - 1, y - 3], [x + 1, y - 5]]), 0.6 * u, "#c8352e");
        const fl = Math.sin(k * 2.1 + i * 1.7) * 0.9, fx = x + fl * 0.6;
        p.poly(R([[fx, y - 19 + Math.abs(fl)], [fx + 2.4, y - 13], [fx, y - 11], [fx - 2.4, y - 13]]), "#f6a623", 0.9 * u);
        p.poly(R([[fx, y - 16.5 + Math.abs(fl)], [fx + 1.1, y - 13], [fx, y - 12], [fx - 1.1, y - 13]]), "#fff1a6", 0);
      });
      break;
    }
    case "bridgePaper": { // front page: masthead, BRIDGE / FOR SALE, photo of the five-arch bridge, columns
      const pg = R([[-52, -136], [50, -139], [52, 4], [-50, 6]]);
      p.poly(pg, "#f3ecd6", ow * u);
      T("THE SUN VALLEY HERALD", 0, -128, 90, 7, "#2a2228", 800, SERIF);
      p.stroke(R([[-45, -121], [45, -122.5]]), 1.6 * u, "#2a2228"); p.stroke(R([[-45, -119], [45, -120.5]]), 0.7 * u, "#2a2228");
      T("BRIDGE", 0, -106, 88, 22, "#1d1620", 900, CONDENSED);
      T("FOR SALE", 0, -85, 88, 19, "#b3262e", 900, CONDENSED);
      p.poly(R([[-44, -72], [44, -73], [44, -30], [-44, -29]]), "#9fa5a2", 1.4 * u);
      bridgePic(p, R, u, -43, -72, 43, -30.5, true);
      p.poly(R([[-44, -72], [44, -73], [44, -30], [-44, -29]]), null, 1.4 * u);
      T("LONDON'S OLD BRIDGE GOES ON THE MARKET", 0, -24, 86, 4.4, "#2a2228", 700, CONDENSED);
      for (let c = 0; c < 3; c++) for (let i = 0; i < 6; i++) { const x0 = -44 + c * 30, l = i === 5 ? 16 : 26; p.stroke(R([[x0, -16 + i * 3.6], [x0 + l, -16 + i * 3.6]]), 1.1 * u, "#8a8070"); }
      break;
    }
    case "shoe": { // brown oxford held upside down by the heel (sole up, opening down), sand pouring out (k = 0..1)
      u *= 1.3; // a big clown-ish shoe so it reads at medium size
      const up: P2[] = [[-4, -6], [10, -8], [30, -7], [46, -5], [57, -1], [62, 6], [58, 14], [46, 16], [34, 16], [27, 20], [10, 23], [-2, 21], [-7, 8]];
      p.poly(R(up), "#8a5232", ow * u);
      p.clip(R(up), () => { p.stroke(R(curve([44, -4], [40, 6], [46, 16], 8)), 1.2 * u, "#5a3420"); // toe cap seam
        for (let i = 0; i < 5; i++) E(48 + i * 2.4, 3 + i * 2, 0.7, 0.7, "#5a3420", 0); // brogue dots
        p.stroke(R([[2, 1], [40, 3]]), 1.6 * u, "rgba(255,255,255,0.25)"); });
      p.poly(R([[-6, -6], [12, -9], [32, -8], [48, -6], [58, -2], [62, 5], [59, 5], [56, 1], [46, -1], [30, -2], [10, -3], [-5, -1]]), "#3a2416", 1.4 * u); // sole on top
      p.poly(R([[-7, -7], [9, -9], [9, -1], [-6, 0]]), "#2a1a10", 1.2 * u); // heel block
      const tg = R([[22, 18], [34, 22], [33, 28], [24, 27]]); p.poly(tg, "#9a6040", 1.2 * u); // tongue flopping down
      for (const [x, y] of [[27, 15], [32, 14], [37, 13.5]] as P2[]) { E(x, y, 1.1, 1.1, "#e8c14a", 0.6); }
      p.stroke(R([[27, 15], [32, 17.5], [37, 13.5]]), 1.1 * u, "#f1e2c0"); p.stroke(R([[32, 14], [27, 18]]), 1.1 * u, "#f1e2c0");
      E(12, 21.5, 11, 3.6, "#24160e", 1.2); // the opening, facing down
      if (k > 0) { const len = 64 * Math.min(1, k);
        p.poly(R([[4, 22], [20, 22], [17, 28], [14, 28 + len * 0.5], [13, 28 + len], [9, 28 + len], [9, 28 + len * 0.5], [7, 28]]), "#e8b866", 1.2 * u);
        for (let i = 0; i < 9; i++) { const t = (i / 9 + k * 2.7) % 1; E(11 + 9 * Math.sin(i * 2.3) * (0.4 + t), 28 + t * (len + 8), 1.2, 1.2, "#c98e44", 0); }
      }
      break;
    }
    case "sandJar": { // glass jar of sand, tin lid, a "$1" tag on a string
      const jar = R([[-17, -46], [17, -46], [19, -38], [19, -2], [15, 2], [-15, 2], [-19, -2], [-19, -38]]);
      p.poly(jar, "rgba(214,236,248,0.55)", 0);
      p.clip(jar, () => { p.poly(R([[-20, -28], [-6, -31], [8, -27], [20, -30], [20, 4], [-20, 4]]), "#e8b866", 0);
        for (let i = 0; i < 14; i++) E(-15 + (i * 7.3) % 30, -22 + (i * 5.1) % 22, 0.9, 0.9, "#c48a3e", 0);
        p.stroke(R([[-13, -38], [-13, -6]]), 2.4 * u, "rgba(255,255,255,0.7)"); });
      p.poly(jar, null, ow * u);
      p.poly(R([[-15, -52], [15, -52], [15, -45], [-15, -45]]), "#b8bec6", 2 * u);
      for (let i = 0; i < 6; i++) p.stroke(R([[-12 + i * 5, -51], [-12 + i * 5, -46]]), 0.8 * u, "#7d838f");
      p.stroke(R(curve([12, -46], [22, -44], [24, -36], 6)), 0.9 * u, "#6b4a2f");
      const tg = R([[19, -38], [33, -40], [36, -30], [36, -24], [22, -22], [19, -28]]); p.poly(tg, "#f6e7b8", 1.4 * u);
      E(22.5, -33, 1.4, 1.4, "#ffffff", 0.7);
      T("$1", 29, -31, 11, 9, "#b3262e", 900);
      break;
    }
    case "ruler": { // 2 m surveyor's levelling staff: wood, inch ticks, E-blocks, a red number every foot
      const L = 926 / u, y1 = 0.55 * L - k * 463 / u, y0 = y1 - L, w = 6.4; // grip 0.55 L (~1.1 m) above the foot; k metres slide up
      p.poly(R([[-w, y0], [w, y0], [w, y1], [-w, y1]]), "#f2dc9a", 2.2 * u);
      p.stroke(R([[-w + 1.4, y0 + 2], [-w + 1.4, y1 - 2]]), 1.2 * u, "rgba(255,255,255,0.6)");
      p.stroke(R([[w - 1.2, y0 + 2], [w - 1.2, y1 - 2]]), 1.4 * u, "rgba(120,80,30,0.35)");
      const inch = 11.76 / u;
      for (let i = 0; y1 - i * inch > y0 + 1; i++) {
        const y = y1 - i * inch, big = i % 12 === 0, mid = i % 6 === 0;
        p.stroke(R([[-w + 0.5, y], [-w + (big ? 9 : mid ? 6.5 : 3.8), y]]), (big ? 1.3 : 0.8) * u, "#2a2228");
        if (i % 2 === 0 && !big) p.poly(R([[w - 3.4, y - inch], [w - 0.6, y - inch], [w - 0.6, y], [w - 3.4, y]]), "#2a2228", 0);
        if (big && i > 0) T(String(i / 12), 1, y - inch * 2.2, 7, 7, "#c8352e", 900);
      }
      p.poly(R([[-w, y1 - 3], [w, y1 - 3], [w, y1], [-w, y1]]), "#8a919c", 1 * u); // metal shoe
      break;
    }
    case "chart": case "chartL": { // big unrolled blueprint: elevation of the bridge, every stone numbered
      const s = name === "chartL" ? 1 : -1, X = (x: number) => s * x, R = (pts: P2[]) => R0(pts.map(([x, y]) => [x, y + 84] as P2));
      const T = (str: string, x: number, y: number, mw: number, mh: number, col: string, w = 800, fam = SANS) => txt(p, str, R([[x, y]])[0], mw * u, mh * u, ang, col, w, fam);
      const sheet = R([[X(-4), -84], [X(136), -84], [X(136), 4], [X(-4), 4]]);
      p.poly(sheet, "#2f63a8", ow * u);
      p.clip(sheet, () => {
        for (let i = 0; i < 15; i++) p.stroke(R([[X(-4 + i * 10), -84], [X(-4 + i * 10), 4]]), 0.4 * u, "rgba(255,255,255,0.18)");
        for (let i = 0; i < 9; i++) p.stroke(R([[X(-4), -84 + i * 10], [X(136), -84 + i * 10]]), 0.4 * u, "rgba(255,255,255,0.18)");
        T("STONE PLAN - ARCH 3", X(66), -76, 110, 6.2, "#eaf3ff", 800, CONDENSED);
        const base = -12, cxs = [12, 39, 66, 93, 120];
        p.stroke(R([[X(2), -50], [X(130), -50]]), 1.2 * u, "#eaf3ff"); p.stroke(R([[X(2), base], [X(130), base]]), 1.2 * u, "#eaf3ff");
        cxs.forEach((c, j) => { const sz = [0.62, 0.82, 1, 0.82, 0.62][j], rw = 12 * sz, rh = 30 * sz;
          p.stroke(R(ellPts(X(c), base, rw, rh, 180, 360, 0, 14).map(([x, y]) => [x, y] as P2)), 1.2 * u, "#eaf3ff");
        });
        let n = 1;
        for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) { const x0 = 4 + i * 10.6 + (r % 2) * 5, y0 = -50 + r * 8; if (x0 > 126) continue;
          p.poly(R([[X(x0), y0], [X(x0 + 9.4), y0], [X(x0 + 9.4), y0 + 7], [X(x0), y0 + 7]]), "rgba(255,255,255,0.08)", 0.6 * u);
          T(String(n++), X(x0 + 4.7), y0 + 3.6, 7.6, 4.2, "#eaf3ff", 700, CONDENSED); }
      });
      for (const x of [-4, 136]) { const r = R([[X(x) - 4, -88], [X(x) + 4, -88], [X(x) + 4, 8], [X(x) - 4, 8]]); p.poly(r, "#3a6fb4", 2 * u); p.stroke(R([[X(x) - 1.5, -86], [X(x) - 1.5, 6]]), 1.4 * u, "rgba(255,255,255,0.35)"); }
      break;
    }
    case "paintPot": { // small tin of white paint hanging from its wire bail, a drip down the side
      p.stroke(R(curve([-15, 22], [0, -4], [15, 22], 12)), 1.6 * u, "#8a919c");
      const pot = R([[-16, 20], [16, 20], [15, 50], [-15, 50]]);
      p.poly(pot, "#b8bec6", ow * u);
      p.poly(R([[-15.6, 28], [15.6, 28], [15.3, 42], [-15.3, 42]]), "#c8352e", 1.2 * u);
      T("PAINT", 0, 35, 22, 7, "#f4f1ea", 900, CONDENSED);
      E(0, 20, 16, 4, "#f4f1ea", 2);
      p.poly(R([[6, 20], [10, 20], [9.5, 30], [8, 32], [6.5, 30]]), "#f4f1ea", 1 * u);
      break;
    }
    case "paintBrush": // flat brush, wet white paint on the bristles
      p.band(R([[0, -34], [0, 10]]), "#b07a45", 3 * u, 1 * u, "round");
      p.poly(R([[-6, -34], [6, -34], [7, -46], [-7, -46]]), "#c9ced6", ow * u);
      p.poly(R([[-7, -46], [7, -46], [6, -58], [-6, -58]]), "#f4f1ea", 1.4 * u);
      p.stroke(R([[-3, -48], [-3, -56]]), 0.9 * u, "#d9d4c8"); p.stroke(R([[2, -48], [2, -56]]), 0.9 * u, "#d9d4c8");
      break;
    case "jigsawLid": { // puzzle box lid: the bridge picture, piece lines, "10,000 PIECES"
      const lid = R([[-52, -74], [52, -74], [52, 2], [-52, 2]]);
      p.poly(lid, "#f2c230", ow * u);
      p.poly(R([[-47, -69], [47, -69], [47, -14], [-47, -14]]), "#9fd0ef", 1.4 * u);
      bridgePic(p, R, u, -47, -69, 47, -14, false);
      p.clip(R([[-47, -69], [47, -69], [47, -14], [-47, -14]]), () => {
        for (let i = 1; i < 8; i++) { const x = -47 + i * 11.75; const pts: P2[] = []; for (let j = 0; j <= 10; j++) { const y = -69 + j * 5.5; pts.push([x + ((j % 2) ? 2 : -2) * (j % 4 < 2 ? 1 : -1), y]); } p.stroke(R(pts), 0.6 * u, "rgba(40,30,40,0.35)"); }
        for (let j = 1; j < 5; j++) { const y = -69 + j * 11; const pts: P2[] = []; for (let i = 0; i <= 16; i++) pts.push([-47 + i * 5.9, y + ((i % 2) ? 2 : -2) * (i % 4 < 2 ? 1 : -1)]); p.stroke(R(pts), 0.6 * u, "rgba(40,30,40,0.35)"); }
      });
      p.poly(R([[-47, -69], [47, -69], [47, -14], [-47, -14]]), null, 1.4 * u);
      p.poly(R([[-47, -11], [47, -11], [47, -2], [-47, -2]]), "#c8352e", 1.2 * u);
      T("10,000 PIECES", 0, -6.5, 86, 8, "#fbf6e8", 900, CONDENSED);
      T("LONDON BRIDGE", -22, -64, 36, 5, "#1d2a4a", 800, CONDENSED);
      break;
    }
    case "camera": { // 1960s camera: silver top plate, black body, big lens toward the viewer, flash cube
      p.poly(R([[-20, -26], [20, -26], [20, -2], [-20, -2]]), "#33343e", ow * u);
      p.poly(R([[-20, -26], [20, -26], [20, -19], [-20, -19]]), "#c9ced6", 1.4 * u);
      E(2, -12, 9.5, 9.5, "#5a606c", 2); E(2, -12, 6, 6, "#26314a", 1.4); E(0, -14, 2.2, 2.2, "rgba(255,255,255,0.8)", 0);
      p.poly(R([[-17, -24], [-10, -24], [-10, -21], [-17, -21]]), "#2a2228", 0);
      p.poly(R([[8, -34], [17, -34], [17, -26], [8, -26]]), "#eef6ff", 1.4 * u);
      p.stroke(R([[10, -32], [15, -28]]), 0.8 * u, "#b8c4d4");
      break;
    }
    case "iceCream": // two scoops on a waffle cone, a drip
      p.poly(R([[-9, -18], [9, -18], [0, 10]]), "#e2a75a", 2.2 * u);
      for (let i = 0; i < 3; i++) p.stroke(R([[-7 + i * 5, -17], [1 + i * 3, -2]]), 0.8 * u, "#b8823e");
      E(0, -22, 10.5, 8, "#9ad9b9", 2); E(-1, -34, 9, 8, "#f7a8c2", 2); E(-4, -37, 2.4, 1.6, "rgba(255,255,255,0.7)", 0);
      E(6, -16, 1.8, 2.8, "#9ad9b9", 0.8); E(-2, -42, 2.6, 2.4, "#c8352e", 1);
      break;
    case "pennant": { // felt souvenir pennant on a stick: HAVASU
      p.band(R([[0, 10], [0, -66]]), "#b07a45", 2.4 * u, 0.8 * u, "round");
      const fl = Math.sin(k * 6.283) * 3;
      const pn = R([[1, -66], [56, -54 + fl], [1, -40]]);
      p.poly(pn, "#c8352e", 2 * u);
      p.stroke(R([[2, -62], [48, -54 + fl * 0.9]]), 1 * u, "#fbf3e3"); p.stroke(R([[2, -44], [48, -54 + fl * 0.9]]), 1 * u, "#fbf3e3");
      txt(p, "HAVASU", Q(22, -53 + fl * 0.4), 30 * u, 7 * u, ang + Math.atan2(fl * 0.2, 56), "#fbf3e3", 900, CONDENSED);
      E(0, -67, 2, 2, "#e8c14a", 0.8);
      break;
    }
    case "brochure": { // fold-out land brochure: sun, lots grid, BUY A LOT!
      const b = R([[-22, -56], [22, -58], [23, 2], [-21, 4]]);
      p.poly(b, "#fbf6e8", 2 * u);
      p.poly(R([[-18, -52], [18, -53.5], [18.5, -28], [-17.5, -27]]), "#f2b25a", 1 * u);
      E(8, -45, 5, 5, "#f7e36a", 0.8);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.poly(R([[-15 + i * 10.5, -40 + j * 6], [-7 + i * 10.5, -40 + j * 6], [-7 + i * 10.5, -35.5 + j * 6], [-15 + i * 10.5, -35.5 + j * 6]]), "rgba(255,255,255,0.55)", 0.6 * u);
      T("BUY A LOT!", 0, -20, 36, 7.5, "#b3262e", 900, CONDENSED);
      for (let i = 0; i < 4; i++) p.stroke(R([[-16, -12 + i * 4], [i === 3 ? 4 : 16, -12 + i * 4]]), 1 * u, "#9a8f80");
      p.stroke(R([[0.5, -57], [0.5, 3]]), 0.8 * u, "rgba(120,100,80,0.4)");
      break;
    }
    case "numStone": { // carried granite block with its painted number
      const st = R([[-24, -36], [24, -38], [26, 6], [-25, 8]]);
      p.poly(st, "#a39d8f", ow * u);
      p.clip(st, () => { for (const [x, y, r] of [[-14, -24, 3], [10, -8, 2.4], [16, -28, 2], [-8, 0, 2.2]] as [number, number, number][]) E(x, y, r, r * 0.7, "#a9a292", 0);
        p.stroke(R([[-22, -32], [-22, 2]]), 2 * u, "rgba(255,255,255,0.35)"); });
      T(String(Math.max(1, Math.round(k || 1))), 1, -15, 34, 22, "#f8f6ef", 900, CONDENSED);
      break;
    }
    // ---------------- potato short ----------------
    case "potato": { // a lumpy brown potato held in the fingers (k > 0.5 = polished: a highlight + sparkle tick)
      const b = R([[-13, -24], [-2, -29], [11, -26], [16, -16], [14, -5], [4, 1], [-9, 0], [-16, -9], [-17, -18]]);
      p.poly(b, "#b88552", ow * u);
      p.clip(b, () => { E(4, -8, 12, 7, "#9a6a3c", 0); for (const [x, y] of [[-8, -18], [6, -20], [-2, -9], [9, -12]]) E(x, y, 1.4, 1.1, "#6e4a2a", 0); });
      if (k > 0.5) { E(-6, -21, 4, 2.4, "#f4dcb0", 0); p.stroke(R([[18, -30], [24, -36]]), 1.2 * u, "#fff4c8"); p.stroke(R([[21, -27], [27, -29]]), 1.2 * u, "#fff4c8"); }
      break;
    }
    case "potatoFlower": { // a potato blossom: five violet-white petals, yellow centre, a green stem + leaf
      p.band(R([[0, 2], [0, -26]]), "#4f8a3a", 2.2 * u, 0.8 * u, "round");
      p.poly(R([[0, -12], [9, -18], [12, -10]]), "#6aa64a", 1.2 * u);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; E(Math.cos(a) * 7, -30 + Math.sin(a) * 7, 6, 4.6, i % 2 ? "#c9b4f6" : "#ece4ff", 1.2); }
      E(0, -30, 3.6, 3.6, "#f6c430", 1.1);
      break;
    }
    case "musket": { // a soldier's musket shouldered upright: walnut stock in the hand, long barrel up, bayonet tip
      p.band(R([[0, 22], [0, -118]]), "#7d838f", 2.6 * u, 0.9 * u, "butt");
      p.poly(R([[-5, 30], [5, 30], [6, -40], [-3, -40]]), "#8a5a32", 1.6 * u);
      p.band(R([[0, -118], [0, -138]]), "#c9ced6", 1.4 * u, 0.6 * u, "butt");
      p.stroke(R([[-4, -10], [4, -10]]), 1.2 * u, "#c9a227");
      break;
    }
    case "goblet": { // a gold goblet (k = tilt of the wine surface)
      p.poly(R([[-11, -30], [11, -30], [8, -16], [2, -12], [2, -2], [8, 2], [-8, 2], [-2, -2], [-2, -12], [-8, -16]]), "#e8c14a", ow * u);
      E(0, -29, 10, 2.6, "#8a2638", 1);
      break;
    }
    case "scroll": { // an unrolled field plan: parchment with green rows + a red square
      const b = R([[-30, -40], [30, -40], [30, 2], [-30, 2]]); p.poly(b, "#f2e6c4", ow * u);
      p.clip(b, () => { for (let i = 0; i < 5; i++) p.stroke(R([[-24, -34 + i * 7], [24, -34 + i * 7]]), 1.4 * u, "#6aa64a"); p.poly(R([[-26, -36], [26, -36], [26, -4], [-26, -4]]), null, 1.6 * u); });
      E(-30, -40, 3.4, 3.4, "#d8c49a", 1.2); E(30, 2, 3.4, 3.4, "#d8c49a", 1.2);
      break;
    }
    case "dice": { // two dice + a coin in a cupped hand
      p.poly(R([[-10, -10], [0, -12], [2, -2], [-8, 0]]), "#fbf8f1", 1.6 * u); E(-4, -6, 1.2, 1.2, INK, 0);
      p.poly(R([[3, -12], [13, -10], [12, 0], [3, -1]]), "#fbf8f1", 1.6 * u); E(6, -9, 1, 1, INK, 0); E(10, -4, 1, 1, INK, 0);
      E(0, 4, 7, 3, "#e8c14a", 1.2);
      break;
    }
    case "potatoTray": { // a servant's silver tray piled with a mountain of roast potatoes (k = steam phase)
      E(0, 0, 40, 9, "#d8dce4", ow);
      for (let i = 0; i < 11; i++) { const x = -28 + (i * 13.7) % 56, y = -6 - ((i * 7) % 4) * 7 - (Math.abs(x) < 16 ? 10 : 0); E(x, y, 8, 6, i % 3 ? "#d99a44" : "#e8b45c", 1.4); }
      for (let j = 0; j < 3; j++) p.stroke(R(curve([-10 + j * 10, -40], [-14 + j * 10 + 4 * Math.sin(k * 6 + j), -52], [-8 + j * 10, -64], 8)), 1.4 * u, "rgba(255,255,255,0.75)");
      break;
    }
    // ---------------- cow butt eyes short ----------------
    case "slate": { // a chalk slate held up in both hands, the chalk number = k (painted-eye or plain-cow icon by sign of k: k < 0 = plain)
      const b = R([[-30, -50], [30, -50], [30, 2], [-30, 2]]); p.poly(b, "#8a5a32", ow * u); p.poly(R([[-26, -46], [26, -46], [26, -2], [-26, -2]]), "#2e3a38", 0);
      T(String(Math.abs(Math.round(k))), 0, -30, 34, 26, "#fbf8f0", 900);
      if (k < 0) E(0, -10, 12, 6, "#c8875a", 1); else { E(-7, -10, 6, 4, "#fbf8f0", 1); E(7, -10, 6, 4, "#fbf8f0", 1); E(-6, -10, 2.4, 2.4, "#2a2030", 0); E(8, -10, 2.4, 2.4, "#2a2030", 0); }
      break;
    }
    case "picassoSign": { // a cardboard sign held up over the head: BUTT PICASSO
      p.band(R([[0, 10], [0, -40]]), "#b07a45", 2.6 * u, 0.9 * u, "round");
      const b = R([[-46, -78], [46, -78], [44, -40], [-44, -40]]); p.poly(b, "#e8cfa0", ow * u);
      T("BUTT", 0, -68, 76, 14, "#c8352e", 900); T("PICASSO", 0, -50, 80, 14, "#2f6fc8", 900);
      break;
    }

    case "paintbrush": { // a house-painter's brush: wooden handle in the fist, steel ferrule, bristles dipped in teal (k = paint load 0..1)
      p.band(R([[0, 18], [0, -22]]), "#b07a45", 3.4 * u, 1.1 * u, "round");
      p.poly(R([[-6, -22], [6, -22], [6, -34], [-6, -34]]), "#c9ced6", 1.4 * u);
      p.poly(R([[-7, -34], [7, -34], [6, -52], [-6, -52]]), "#e8d8b0", ow * u);
      if (k > 0) p.poly(R([[-6.6, -40], [6.6, -40], [6, -52], [-6, -52]]), "#19b7b0", 1.2 * u);
      break;
    }
    case "paintPot": { // a tin of paint held by its wire handle (white paint, teal drips)
      p.stroke(R(curve([-14, -20], [0, -38], [14, -20], 8)), 1.4 * u, "#5a5e68");
      p.poly(R([[-15, -20], [15, -20], [13, 8], [-13, 8]]), "#d8dce2", ow * u);
      E(0, -20, 15, 4, "#fbf8f0", 1.2); p.stroke(R([[8, -18], [8, -6]]), 2.2 * u, "#19b7b0");
      break;
    }
    case "binoculars": { // field binoculars raised to the eyes (two barrels, strap)
      for (const x of [-9, 9]) { p.poly(R([[x - 7, -6], [x + 7, -6], [x + 8, 16], [x - 8, 16]]), "#3a3e48", ow * u); E(x, -6, 7, 3, "#9ac8e8", 1.2); }
      p.poly(R([[-3, 0], [3, 0], [3, 8], [-3, 8]]), "#5a5e68", 1 * u);
      break;
    }
    case "chalk": { // a stick of chalk between the fingers
      p.band(R([[0, 0], [0, -16]]), "#fbf8f0", 3.4 * u, 1 * u, "round");
      break;
    }
    case "notebook": { // a little field notebook held open (two pages with tick marks)
      const b = R([[-22, -30], [22, -30], [22, 2], [-22, 2]]); p.poly(b, "#fbf3dc", ow * u);
      p.stroke(R([[0, -30], [0, 2]]), 1.2 * u, "#c9b48a");
      for (let i = 0; i < 4; i++) { p.stroke(R([[-18, -24 + i * 7], [-4, -24 + i * 7]]), 1 * u, "#8a9ab0"); p.stroke(R([[4, -24 + i * 7], [18, -24 + i * 7]]), 1 * u, "#8a9ab0"); }
      p.stroke(R([[8, -6], [11, -2], [17, -12]]), 1.6 * u, "#c8352e");
      break;
    }
    case "rifle": { // a farmer's hunting rifle held across the body (k = 1 aimed: the barrel points forward)
      p.band(R([[0, 10], [k > 0.5 ? 120 : 30, k > 0.5 ? -4 : -110]]), "#5a5e68", 2.4 * u, 0.9 * u, "butt");
      p.poly(R(k > 0.5 ? [[-28, 4], [10, -2], [12, 8], [-26, 16]] : [[-6, 34], [6, 34], [8, -10], [-4, -10]]), "#8a5a32", 1.6 * u);
      break;
    }
    case "cookie": { // a round chocolate-chip cookie
      E(0, -10, 12, 12, "#d9a050", ow); for (const [x, y] of [[-4, -14], [5, -9], [-2, -5], [4, -16]]) E(x, y, 1.8, 1.8, "#4a2a1a", 0);
      break;
    }
    case "bakedPotato": { // a baked potato split open with a butter pat
      E(0, -10, 16, 10, "#b07a45", ow); E(0, -14, 11, 5, "#fbe9b0", 1.2); p.poly(R([[-4, -19], [4, -19], [4, -14], [-4, -14]]), "#ffe16a", 1);
      break;
    }
    // ---------------- "He Labeled Grape Bricks 'Don't Make Wine'" (1920s) ----------------
    case "grapeBrick": { // a block of pressed grape concentrate (size of a pound of butter) with a cream paper label; k = 1 shows the
      // WARNING line big (the "read the label" lift); hand under the brick
      const top = R([[-24, -34], [24, -34], [30, -40], [-18, -40]]), front = R([[-24, -34], [24, -34], [24, -2], [-24, -2]]), side = R([[24, -34], [30, -40], [30, -8], [24, -2]]);
      p.poly(side, "#4e1f5e", 2 * u); p.poly(top, "#8a4aa0", 2 * u); p.poly(front, "#6a2c7e", ow * u);
      p.clip(front, () => { for (let i = 0; i < 9; i++) E(-20 + (i * 11.3) % 42, -30 + (i * 7.7) % 26, 1.6, 1.2, "#8e4fa8", 0); });
      const lab = R([[-19, -29], [19, -29], [19, -7], [-19, -7]]); p.poly(lab, "#fbf3dc", 1.4 * u);
      T("GRAPE", 0, -24, 32, 6, "#5a1f6e", 900); T("BRICK", 0, -17.5, 32, 6, "#5a1f6e", 900);
      p.band(R([[-15, -13.4], [15, -13.4]]), "#c8352e", 2.6 * u, 0, "butt"); T(k > 0.5 ? "WARNING!" : "warning", 0, -10, 28, 4, "#fbf3dc", 900);
      break;
    }
    case "legalStamp": { // a big rubber stamp: wooden knob handle in the hand, rubber face DOWN printed LEGAL (k = 1 adds wet red ink)
      E(0, -6, 9, 7, "#8a5a32", ow); p.poly(R([[-3, 0], [3, 0], [3, 16], [-3, 16]]), "#6e4626", 1.8 * u);
      p.poly(R([[-22, 16], [22, 16], [22, 24], [-22, 24]]), "#c9a24a", ow * u); p.poly(R([[-24, 24], [24, 24], [24, 30], [-24, 30]]), k > 0.5 ? "#c8352e" : "#3a2a24", 1.6 * u);
      T("LEGAL", 0, 20, 36, 6, "#3a2a1a", 900);
      break;
    }
    case "cakeBox": { // a 1920s cake-mix box held up face out: "DO NOT BAKE AT 350" warning band, a little cake drawing
      const box = R([[-22, -62], [22, -62], [22, 0], [-22, 0]]); p.poly(box, "#f2c230", ow * u);
      p.poly(R([[-22, -62], [22, -62], [26, -66], [-18, -66]]), "#f7d860", 1.6 * u);
      T("CAKE", 0, -54, 36, 9, "#c8352e", 900); T("MIX", 0, -45, 36, 8, "#c8352e", 900);
      E(0, -30, 12, 6, "#fbf3dc", 1.4); p.poly(R([[-12, -30], [12, -30], [12, -22], [-12, -22]]), "#e88aa0", 1.4 * u); E(0, -36, 2, 3, "#c8352e", 0.8);
      p.poly(R([[-22, -16], [22, -16], [22, -5], [-22, -5]]), "#c8352e", 1.4 * u); T("DO NOT BAKE AT 350°", 0, -10.5, 40, 5, "#fbf3dc", 900);
      break;
    }
    case "wineBottle": { // a dark green bottle with a cream label, hand round the neck... body hanging below; k = 1 corked + red wax
      const b = R([[-3, -6], [3, -6], [3, 10], [9, 20], [9, 64], [-9, 64], [-9, 20], [-3, 10]]);
      p.poly(b, "#24503a", ow * u); p.poly(R([[-9, 34], [9, 34], [9, 50], [-9, 50]]), "#fbf3dc", 1.2 * u); E(0, 42, 4, 4, "#7a2a6e", 0.6);
      p.poly(R([[-3.4, -10], [3.4, -10], [3.4, -4], [-3.4, -4]]), k > 0.5 ? "#c8352e" : "#c9a27a", 1.2 * u);
      p.stroke(R([[-6, 24], [-6, 60]]), 1.6 * u, "rgba(255,255,255,0.35)");
      break;
    }
    case "vineYank": { // an uprooted grape vine held by the trunk: gnarled brown trunk, leaves on top, dirt-clotted roots hanging down
      p.band(R(curve([0, -40], [-4, -10], [3, 20], 8)), "#6e4626", 5 * u, 1.4 * u, "round");
      for (const [x, y] of [[-14, -48], [0, -56], [13, -46], [-6, -40], [8, -38]] as P2[]) E(x, y, 9, 7, "#4f8a3a", 1.4);
      E(-4, -44, 3, 3, "#6a2c7e", 0.8); E(1, -42, 3, 3, "#6a2c7e", 0.8); E(-1, -38, 3, 3, "#6a2c7e", 0.8);
      for (const dx of [-8, -2, 5, 10]) p.band(R(curve([3, 20], [dx, 30], [dx * 1.4, 40], 6)), "#8a6a4a", 1.6 * u, 0.6 * u, "round");
      E(3, 22, 7, 4, "#7a5a3a", 1.2);
      break;
    }
    // ===== "He Saved His Life by Proving His Masterpiece Was Fake" =====
    case "paperHead": { // newspaper held open at the bottom edge, front page faces the camera; k picks the front page:
      // 0 DUMBEST EXCUSE OF THE WAR (1945 daily), 1 the art review EVERY VIRTUE EXCEPT ORIGINALITY, 2 the poll (FAVOURITE MEN: 1 PRIME MINISTER, 2 THE PAINTER)
      const pg = R([[-46, -116], [46, -118], [48, 4], [-46, 6]]);
      p.poly(pg, "#f3ecd6", ow * u);
      const kk = Math.round(k);
      T(kk === 1 ? "DE KUNSTKRANT" : "HET DAGBLAD", 0, -108, 80, 7, "#2a2228", 800, SERIF);
      p.stroke(R([[-40, -101], [40, -102.5]]), 1.4 * u, "#2a2228");
      if (kk === 0) { T("DUMBEST", 0, -88, 82, 17, "#1d1620", 900, CONDENSED); T("EXCUSE", 0, -70, 82, 17, "#1d1620", 900, CONDENSED); T("OF THE WAR", 0, -52, 82, 13, "#b3262e", 900, CONDENSED); }
      else if (kk === 1) { T("EVERY VIRTUE", 0, -86, 84, 14, "#b3262e", 900, CONDENSED); T("EXCEPT", 0, -70, 60, 13, "#b3262e", 900, CONDENSED); T("ORIGINALITY", 0, -54, 84, 14, "#b3262e", 900, CONDENSED); }
      else { T("FAVOURITE MEN", 0, -88, 82, 12, "#1d1620", 900, CONDENSED); T("1. PRIME MINISTER", 0, -72, 80, 9, "#2a2228", 800, CONDENSED); T("2. THE PAINTER", 0, -58, 80, 11, "#b3262e", 900, CONDENSED); }
      for (let c = 0; c < 3; c++) for (let i = 0; i < 7; i++) { const x0 = -40 + c * 28, l = i === 6 ? 14 : 24; p.stroke(R([[x0, -38 + i * 5], [x0 + l, -38 + i * 5]]), 1.1 * u, "#8a8070"); }
      break;
    }
    case "paperBall": { // the review being crumpled in the hand: k 0 = a crushed sheet, 1 = a tight ball (red headline scraps show)
      const kk = Math.max(0, Math.min(1, k)), rr = 50 - 38 * kk, pts: P2[] = [];
      for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283, j = (i % 2 ? 0.72 : 1) * (1 - 0.15 * kk); pts.push([Math.cos(a) * rr * j * 1.25, -rr + Math.sin(a) * rr * j]); }
      p.poly(R(pts), "#f3ecd6", ow * u);
      for (const [x, y, l] of [[-0.5, -1.2, 0.8], [0.3, -0.6, 0.7], [-0.2, -1.6, 0.6]] as [number, number, number][]) p.stroke(R([[x * rr, y * rr], [(x + l) * rr, (y + 0.25) * rr]]), 1.3 * u, "#8a8070");
      p.stroke(R([[-0.6 * rr, -0.9 * rr], [0.1 * rr, -0.8 * rr]]), 2.2 * u, "#b3262e");
      break;
    }
    case "plasticBook": { // a thick reference book held open toward the camera: PLASTIC / INVENTED 1907 + a sketch of a plastic disc
      p.poly(R([[-56, -84], [56, -84], [58, 4], [-58, 4]]), "#6a2a2a", ow * u);
      for (const sd of [-1, 1]) p.poly(R([[0, -80], [sd * 52, -82], [sd * 54, 0], [0, 2]]), "#f6efdc", 1.4 * u);
      T("PLASTIC", -26, -66, 44, 11, "#1d1620", 900, CONDENSED); T("INVENTED", 27, -66, 44, 10, "#1d1620", 900, CONDENSED); T("1907", 27, -46, 44, 18, "#b3262e", 900, CONDENSED);
      E(-26, -36, 14, 9, "#7a4a2a", 1.4); E(-26, -38, 6, 3, "#a86a3a", 0.8);
      for (let i = 0; i < 4; i++) { p.stroke(R([[-48, -18 + i * 4], [-6, -18 + i * 4]]), 0.9 * u, "#8a8070"); p.stroke(R([[6, -26 + i * 4], [48, -26 + i * 4]]), 0.9 * u, "#8a8070"); }
      p.stroke(R([[0, -80], [0, 2]]), 1.4 * u, "#8a7a62");
      break;
    }
    case "resinBottle": { // amber bottle held by the neck, tipped by ang to pour; k 0..1 = a stream pouring out of the mouth
      p.poly(R([[-3, -6], [3, -6], [4, 6], [12, 14], [12, 52], [-12, 52], [-12, 14], [-4, 6]]), "#c9a24a", ow * u);
      p.poly(R([[-8, 24], [8, 24], [8, 40], [-8, 40]]), "#f2ead2", 1.2 * u); T("RESIN", 0, 32, 14, 6, "#2a1a10", 900, CONDENSED);
      p.poly(R([[-3.5, -12], [3.5, -12], [3.5, -6], [-3.5, -6]]), "#b98a52", 1.2 * u);
      if (k > 0) p.band(R([[0, -12], [-1, -30 * k], [-2, -46 * k]]), "rgba(230,190,90,0.9)", 2.6 * u, 0.6 * u, "round");
      break;
    }
    case "rag": { // a paint- and ink-smeared rag bunched in the hand
      p.poly(R([[-12, -8], [6, -12], [14, -2], [10, 10], [-6, 12], [-14, 4]]), "#e8e0cc", ow * u);
      E(-4, -2, 4, 3, "#1e2030", 0); E(5, 4, 3, 2.5, "#1e2030", 0); E(-6, 6, 2.5, 2, "#c8262e", 0);
      p.stroke(R(curve([-12, -8], [-14, -14], [-8, -18], 6)), 2.4 * u, "#e8e0cc");
      break;
    }
    case "wrench": { // steel spanner held by the handle, open jaw up (ang swings it)
      p.band(R([[0, 12], [0, -30]]), "#9aa0ac", 4.2 * u, 1.2 * u, "round");
      p.poly(R([[-9, -30], [9, -30], [11, -44], [5, -48], [3, -38], [-3, -38], [-5, -48], [-11, -44]]), "#9aa0ac", ow * 0.8 * u);
      p.stroke(R([[-1, -6], [-1, -24]]), 0.9 * u, "rgba(255,255,255,0.8)");
      break;
    }
    case "balloon": { // water balloon resting in the hand: k = 0 round, + squash (lands), - stretch (wobble); red rubber + knot
      const sq = Math.max(-0.4, Math.min(0.6, k)), rx = 15 * (1 + 0.35 * sq), ry = 15 * (1 - 0.35 * sq);
      E(0, -ry, rx, ry, "#e8463a", 2.2); E(-rx * 0.35, -ry * 1.45, rx * 0.28, ry * 0.2, "rgba(255,255,255,0.75)", 0);
      p.poly(R([[-3, -ry * 2 + 1], [3, -ry * 2 + 1], [0, -ry * 2 - 5]]), "#c8352e", 1.2 * u);
      break;
    }
    case "coffeeCup": { // paper take-away cup with a lid and a sleeve; k = steam phase
      p.poly(R([[-9, -30], [9, -30], [7, 2], [-7, 2]]), "#f4f1ea", ow * 0.8 * u);
      p.poly(R([[-8.4, -20], [8.4, -20], [7.6, -8], [-7.6, -8]]), "#a8703a", 1.2 * u);
      p.poly(R([[-11, -34], [11, -34], [10, -29], [-10, -29]]), "#2f3440", 1.4 * u);
      for (let i = 0; i < 2; i++) p.stroke(R(curve([-3 + i * 6, -38], [-6 + i * 6 + 4 * Math.sin(k + i), -46], [-2 + i * 6, -54], 6)), 1.4 * u, "rgba(255,255,255,0.7)");
      break;
    }
    case "cane": { // walking stick, crook at the hand, tip on the ground
      p.band(R(curve([0, 0], [0, -12], [-12, -10], 8)), "#6a3a1e", 3.4 * u, 1 * u, "round");
      p.band(R([[0, 0], [0, 150]]), "#6a3a1e", 3.4 * u, 1 * u, "round");
      p.poly(R([[-3, 150], [3, 150], [3, 156], [-3, 156]]), "#2a2228", 0);
      break;
    }
    case "dummyHead": { // the crash dummy's popped-off head held up by the hand under it: white egg, target decals, blank face
      E(0, -26, 24, 25, "#f4f1ea", 2.6);
      for (const [x, y] of [[-14, -36], [14, -36]] as [number, number][]) { for (let q = 0; q < 4; q++) { const a0 = (q * Math.PI) / 2, pts: P2[] = [[x, y]]; for (let kk = 0; kk <= 6; kk++) { const a = a0 + (kk / 6) * (Math.PI / 2); pts.push([x + Math.cos(a) * 6, y + Math.sin(a) * 6]); } p.poly(R(pts), q % 2 ? "#f2c230" : "#26222c", 0); } }
      E(-7, -26, 2.4, 3.2, INK, 0); E(7, -26, 2.4, 3.2, INK, 0); p.stroke(R([[-6, -14], [6, -14]]), 1.6 * u, INK);
      p.poly(R([[-5, -2], [5, -2], [4, 4], [-4, 4]]), "#9aa0ac", 1.2 * u);
      break;
    }
    case "leverGrip": // nothing to draw: the hand is on the set's lever knob
      break;
    case "crowbar": { // iron crowbar held in the middle, hooked end up
      p.band(R([[0, 40], [0, -34]]), "#4a4c56", 3.4 * u, 1 * u, "round");
      p.band(R(curve([0, -34], [0, -46], [-10, -46], 8)), "#4a4c56", 3.4 * u, 1 * u, "round");
      p.band(R([[0, 40], [4, 46]]), "#4a4c56", 3 * u, 1 * u, "round");
      break;
    }
    case "gavel": { // judge's gavel: hand round the handle, head on top (ang swings it)
      p.band(R([[0, 8], [0, -26]]), "#8a4e28", 3 * u, 1 * u, "round");
      p.poly(R([[-12, -36], [12, -36], [12, -24], [-12, -24]]), "#6a3a1e", ow * u);
      p.poly(R([[-13, -34], [-10, -34], [-10, -26], [-13, -26]]), "#c99a3a", 0.8 * u); p.poly(R([[10, -34], [13, -34], [13, -26], [10, -26]]), "#c99a3a", 0.8 * u);
      break;
    }
    case "testTube": { // glass test tube held at the rim; k 0..1 = a little brown flake + a puff of smoke
      p.poly(R([[-4, -40], [4, -40], [4, 0], [0, 5], [-4, 0]]), "rgba(220,240,255,0.55)", 1.6 * u);
      E(0, -2, 3, 3, "#7a4a2a", 0.8);
      if (k > 0) for (let i = 0; i < 3; i++) E(2 * Math.sin(i * 2 + k * 6), -46 - i * 7 - k * 6, 4 + i * 2, 3 + i * 1.5, `rgba(240,240,250,${0.7 * (1 - i * 0.25)})`, 0);
      break;
    }
    case "scraper": { // a little palette knife / scalpel for taking a paint flake
      p.band(R([[0, 10], [0, -10]]), "#3a2a20", 3 * u, 0.9 * u, "round");
      p.poly(R([[-2, -10], [2, -10], [1.2, -28], [0, -32], [-1.2, -28]]), "#d9dde4", 1 * u);
      break;
    }
  }
};
