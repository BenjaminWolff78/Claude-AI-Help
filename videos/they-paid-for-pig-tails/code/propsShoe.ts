// "The Thieves Who Stole 200 Shoes Nobody Can Wear" (2026-11-23) hand props, drawn around the hand point h (design
// coords). Same conventions as fig.ts drawProp: u = 1 % of the head width, +y = down, `ang` rotates about the hand,
// `k` = FigOpts.propK. Called from props68's default branch.
//
//  name        hold with                                  k
//  snkR        propR/L by the heel collar: a RIGHT sneaker seen from its outer side (stripe): toe to screen RIGHT   colour index
//  snkL        the LEFT sneaker seen from its outer side: toe to screen LEFT                                      colour index
//  snkRx/snkLx the same, a bit bigger (close-ups)                                                                colour index
//  cutters     propR, hand on the grips: long bolt cutters pointing UP from the hand; k = jaws open 0..1
//  beer        propR/L by the body: a brown bottle with a cream label; k = foam 0..1
//  torch       propR: a flashlight pointing along +x (ang aims it); k = beam on 0..1
//  wad         propR: a fat fold of banknotes held at its end; k = the top note flicking 0..1
import { Pen, INK, P2, rotPts, curve, ellPts, shade } from "./toon";

export const SNK_COLS = ["#c8352e", "#2a5a9a", "#2f8a5a", "#e8a22e", "#3a3a44", "#8a3a8a", "#e86a2a", "#2a8a9a", "#d8d0c4", "#5a6a2a", "#b8235a", "#4a4ad0"];

/** a side-view sneaker in prop units with its heel collar at (0,0); dir -1 = toe to the left; s = scale */
const sneaker2D = (p: Pen, R: (pts: P2[]) => P2[], u: number, dir: number, col: string, s = 1) => {
  const X = (pts: P2[]) => R(pts.map(([x, y]) => [x * dir * s, y * s] as P2));
  const up: P2[] = [[14, -2], [10, -6], [2, -6], [-6, -1], [-12, -5], [-18, -4], [-30, 4], [-42, 8], [-50, 12], [-53, 17], [-50, 21], [-30, 22], [0, 22], [16, 21], [19, 14], [18, 4]];
  p.poly(X(up), col, 2.4 * u);
  p.clip(X(up), () => {
    p.poly(X([[20, 6], [4, 10], [-34, 16], [-40, 12], [2, 2], [20, -1]]), shade(col, 0.82), 0);              // the shadow side of the upper
    p.band(X(curve([12, 16], [-4, 10], [-26, 7], 8)), "#f6f4ee", 4.6 * u * s, 1.2 * u, "round");          // the stripe (outer side only)
    p.poly(X([[19, 2], [13, 2], [13, 18], [19, 18]]), "#f6f4ee", 0);                                      // heel tab
    for (let i = 0; i < 4; i++) p.band(X([[-8 - i * 6, -1 + i * 2.4], [-11 - i * 6, 2 + i * 2.4]]), "#f6f4ee", 1.8 * u * s, 0.5 * u, "round");   // laces
  });
  p.poly(X([[-6, -1], [2, -6], [10, -6], [14, -2], [8, -1]]), "#1c1a20", 1.2 * u);                         // the ankle opening
  const sole: P2[] = [[19, 20], [0, 21], [-30, 21], [-50, 20], [-55, 18], [-56, 23], [-48, 27], [-20, 28], [10, 28], [20, 27]];
  p.poly(X(sole), "#f4f1ea", 2.2 * u);
  p.stroke(X([[-52, 24], [18, 24]]), 1 * u * s, "rgba(60,60,70,0.35)");
};

/** two sneakers on the feet of a figure (shot "crams two right shoes on"): f = foot point, dir = toe direction (+1 right),
 *  wrong 0..1 = this foot wears the wrong shoe: it twists outwards, squashed, with a strain mark */
export const footSneaker = (p: Pen, f: P2, dir: number, u: number, col: string, wrong = 0) => {
  const R = (pts: P2[]) => rotPts(pts.map(([x, y]) => [f[0] + x * u * 0.6, f[1] + y * u * 0.6 - 15 * u] as P2), dir * wrong * 0.35, f[0], f[1]);
  sneaker2D(p, R, u * 0.6, dir, col, 1);
  if (wrong > 0.2) { const [x, y] = R([[dir * -20, -6]])[0]; for (let i = 0; i < 3; i++) p.stroke([[x + (i - 1) * 4 * u, y - 4 * u], [x + (i - 1) * 6 * u, y - 10 * u]], 1.3 * u, INK); }
};

export const drawPropShoe = (p: Pen, name: string, h: P2, u: number, ang = 0, k = 0) => {
  const R = (pts: P2[]) => rotPts(pts.map(([x, y]) => [h[0] + x * u, h[1] + y * u] as P2), ang, h[0], h[1]);
  const E = (x: number, y: number, rx: number, ry: number, fill: string | null, ol: number) => { const [c] = R([[x, y]]); p.ell(c[0], c[1], rx * u, ry * u, fill, ol * u, 0, 360, (ang * 180) / Math.PI); };
  switch (name) {
    case "snkR": case "snkL": case "snkRx": case "snkLx": {
      const col = SNK_COLS[Math.abs(Math.round(k)) % SNK_COLS.length], big = name.endsWith("x") ? 1.25 : 1;
      sneaker2D(p, (pts) => R(pts.map(([x, y]) => [x, y + 2] as P2)), u, name.startsWith("snkR") ? -1 : 1, col, big);
      break;
    }
    case "cutters": {   // long red-gripped bolt cutters: grips in the hand, handles up to the pivot, short jaws on top
      const o = Math.max(0, Math.min(1, k)), RC = (pts: P2[]) => R(pts.map(([x, y]) => [x, y * 1.45] as P2));
      for (const s of [-1, 1]) {
        p.band(RC([[s * 3, 6], [s * 2.5, -18]]), "#c8352e", 6 * u, 1.4 * u, "round");                       // rubber grip
        p.band(RC([[s * 2.5, -18], [s * (1.5 + o * 4), -92]]), "#5a5e68", 3.4 * u, 1.1 * u, "butt");         // steel handle
        p.poly(RC([[s * (1 + o * 4), -92], [s * (6 + o * 9), -100], [s * (2 + o * 8), -114], [s * (0.5 + o * 3), -104]]), "#3a3e48", 1.6 * u);   // jaw
      }
      { const [c] = RC([[0, -94]]); p.ell(c[0], c[1], 4.5 * u, 4.5 * u, "#8a8e98", 1.4 * u, 0, 360, 0); }
      break;
    }
    case "beer": {
      const body = R([[-6.5, 0], [6.5, 0], [6.5, -26], [4, -32], [2.6, -44], [-2.6, -44], [-4, -32], [-6.5, -26]]);
      p.poly(body, "#6a3a18", 2.2 * u);
      p.clip(body, () => { p.poly(R([[-7, -6], [7, -6], [7, -20], [-7, -20]]), "#f2e6c4", 0); p.stroke(R([[-3.5, -40], [-4.5, -4]]), 1.6 * u, "rgba(255,255,255,0.35)"); });
      p.poly(R([[-3, -44], [3, -44], [3, -47], [-3, -47]]), "#c8a03a", 1.2 * u);
      if (k > 0) for (let i = 0; i < 3; i++) E(-1 + i * 1.5, -50 - i * 3 - k * 3, 2.5 + i * 0.5, 2.2, "#fbf7ee", 0.8);
      break;
    }
    case "torch": {
      if (k > 0) { const g = p.g; g.save(); g.globalAlpha = 0.28 * Math.min(1, k); p.poly(R([[18, -4], [118, -34], [118, 34], [18, 4]]), "#fff2c4", 0); g.restore(); }
      p.poly(R([[-12, -3.5], [10, -3.5], [18, -6.5], [18, 6.5], [10, 3.5], [-12, 3.5]]), "#2a2c34", 2 * u);
      E(18, 0, 1.6, 6.2, k > 0 ? "#fff6d0" : "#b8bcc4", 1);
      break;
    }
    case "wad": {
      const f = Math.sin(Math.max(0, Math.min(1, k)) * Math.PI);
      for (let i = 0; i < 3; i++) p.poly(R([[-4, -2 - i * 2], [26, -2 - i * 2], [26, -14 - i * 2], [-4, -14 - i * 2]]), i === 2 ? "#a8d58a" : "#8cc070", 1.6 * u);
      p.poly(R([[26, -8], [26 - 22 * (1 - f * 0.6), -8 - 16 * f], [26 - 22 * (1 - f * 0.6), -20 - 14 * f], [26, -20]]), "#b8e09a", 1.4 * u);
      p.band(R([[8, -1], [8, -21]]), "#e8d8a0", 2.6 * u, 0.8 * u, "butt");
      break;
    }
    // ---- "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25) ----
    case "rifle": { // a scoped hunting rifle held at the grip: walnut stock back (-x), black barrel forward (+x); ang aims it
      p.poly(R([[-4, 2], [-58, 8], [-64, 20], [-60, 24], [-30, 14], [-6, 12], [6, 6], [10, -2], [-2, -4]]), "#8a5430", 2.0 * u);    // stock + grip
      p.poly(R([[4, -6], [62, -6], [62, 0], [6, 2]]), "#6a4228", 1.8 * u);                                                       // fore-end
      p.band(R([[2, -6], [128, -6]]), "#2a2a30", 3.0 * u, 0.9 * u, "butt");                                                      // barrel
      p.poly(R([[6, -10], [52, -10], [54, -15], [4, -15]]), "#1e1e24", 1.4 * u); E(4, -12.5, 3.6, 4.2, "#5a7090", 1); E(54, -12.5, 3, 3.6, "#5a7090", 1); // scope
      p.stroke(R([[2, 2], [-2, 10], [4, 10]]), 1.4 * u, "#1e1e24");                                                               // trigger guard
      break;
    }
    case "tail": { // a wild hog's tail held between the fingers: bristly dark rope hanging down, a black tuft
      const sw = 6 * Math.sin(k * 6.283);
      p.band(R(curve([0, 2], [4 + sw * 0.4, 24], [sw, 46], 8)), "#4a3428", 3.0 * u, 0.9 * u, "round");
      p.poly(R([[sw - 3, 42], [sw - 7, 60], [sw + 1, 64], [sw + 6, 58], [sw + 4, 42]]), INK, 0.8 * u);
      p.stroke(R([[-2, 2], [3, 2]]), 2.4 * u, "#c8a888");
      break;
    }
    case "twenties": { // two twenty-dollar bills fanned in the fingers (k 0..1 = the second bill slides out)
      for (let i = 0; i < 2; i++) { const a = i * (0.18 + 0.2 * k); const b = rotPts(R([[-4, -2], [40, -2], [40, -22], [-4, -22]]), a, R([[0, -2]])[0][0], R([[0, -2]])[0][1]);
        p.poly(b, i ? "#b8dca0" : "#a8d090", 1.6 * u); const c = rotPts(R([[18, -12]]), a, R([[0, -2]])[0][0], R([[0, -2]])[0][1])[0]; p.ell(c[0], c[1], 6 * u, 6 * u, "#e8f2dc", 1 * u); p.g.save(); p.g.fillStyle = "#2a5a2a"; p.g.font = `900 ${8 * u}px Arial`; p.g.textAlign = "center"; p.g.textBaseline = "middle"; p.g.fillText("20", c[0], c[1]); p.g.restore(); }
      break;
    }
  }
  void curve; void ellPts;
};
