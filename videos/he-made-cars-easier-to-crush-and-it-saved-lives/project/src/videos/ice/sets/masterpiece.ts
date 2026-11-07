// THE TITLE OBJECT of "He Saved His Life by Proving His Masterpiece Was Fake": an invented Dutch Golden Age style
// portrait ("the merry man in the black hat": white ruff, black hat, crimson sash, a raised glass, window light from
// the left, dark umber ground). Original composition; no real painting is copied.
// One canvas texture per quantised state, cached:
//   paint 0..1  stroke-by-stroke progress (sketch lines -> ground -> cloak -> face -> ruff -> hat -> glass -> highlights)
//   crack 0..1  the craquelure network spreads (fresh cracks show as pale hairlines)
//   ink   0..1  black ink rubbed into the cracks (they turn dark)
//   age   0..1  yellow-brown varnish (300 years)
//   wet   0..1  wet gloss streak (fresh paint)
//   blank 0..1  scraped old canvas showing through (the start of the fake)
// framedPainting() builds a gilded frame + the canvas plane; set its state with setPainting(mesh, state).
import * as THREE from "three";
import { rng } from "../paint";
import { NOINK } from "../ink";
import type { V3 } from "./types";

export type PaintState = { paint?: number; crack?: number; ink?: number; age?: number; wet?: number; blank?: number };
const W = 640, H = 800;
const q = (x: number | undefined, n: number) => Math.round(Math.max(0, Math.min(1, x ?? 0)) * n);
const cache = new Map<string, THREE.CanvasTexture>();
const sub = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/** the crack network: jittered cells, each edge is a short polyline; ordered from the centre outward */
type Seg = [number, number, number, number, number];
let CRACKS: Seg[] | null = null;
const cracks = (): Seg[] => {
  if (CRACKS) return CRACKS;
  const r = rng(707), out: Seg[] = [];
  const nx = 13, ny = 16, pts: [number, number][][] = [];
  for (let j = 0; j <= ny; j++) { const row: [number, number][] = []; for (let i = 0; i <= nx; i++) row.push([(i + (i && i < nx ? (r() - 0.5) * 0.8 : 0)) * (W / nx), (j + (j && j < ny ? (r() - 0.5) * 0.8 : 0)) * (H / ny)]); pts.push(row); }
  const add = (a: [number, number], b: [number, number]) => {
    const mx = (a[0] + b[0]) / 2 + (r() - 0.5) * 14, my = (a[1] + b[1]) / 2 + (r() - 0.5) * 14, d = Math.hypot(mx - W * 0.45, my - H * 0.42);
    out.push([a[0], a[1], mx, my, d], [mx, my, b[0], b[1], d + 1]);
  };
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    if (i < nx && r() < 0.86) add(pts[j][i], pts[j][i + 1]);
    if (j < ny && r() < 0.86) add(pts[j][i], pts[j + 1][i]);
    if (i < nx && j < ny && r() < 0.18) add(pts[j][i], pts[j + 1][i + 1]);
  }
  out.sort((a, b) => a[4] - b[4]);
  CRACKS = out;
  return out;
};

const draw = (g: CanvasRenderingContext2D, s: PaintState) => {
  const p = s.paint ?? 1, r = rng(31);
  // old canvas (scraped): mottled brown linen
  g.fillStyle = "#8a6a48"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,40,24,0.10)" : "rgba(190,160,120,0.10)"; g.fillRect(r() * W, r() * H, 2 + r() * 30, 1 + r() * 3); }
  for (let y = 0; y < H; y += 4) { g.fillStyle = "rgba(255,240,210,0.04)"; g.fillRect(0, y, W, 1); }
  // sketch (umber lines)
  const sk = sub(p, 0, 0.16);
  if (sk > 0) {
    g.save(); g.globalAlpha = Math.min(1, sk * 1.5); g.strokeStyle = "#3a2214"; g.lineWidth = 5; g.lineCap = "round";
    const L = (pts: [number, number][]) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
    g.beginPath(); g.ellipse(352, 300, 92, 112, 0.08, 0, 6.3 * sk); g.stroke();
    L([[200, 800], [230, 520], [300, 440], [420, 430], [520, 520], [560, 800]]);
    L([[220, 230], [480, 210]]); L([[150, 520], [130, 380], [150, 300]]);
    g.restore();
  }
  // ground: warm umber with a glow behind the head
  const gr0 = sub(p, 0.12, 0.34);
  if (gr0 > 0) {
    g.save(); g.globalAlpha = gr0;
    const gr = g.createRadialGradient(360, 300, 40, 360, 330, 520); gr.addColorStop(0, "#b8834a"); gr.addColorStop(0.45, "#6a4426"); gr.addColorStop(1, "#33200f");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // window light on the left (leaded panes)
    g.fillStyle = "rgba(220,200,150,0.22)"; g.fillRect(28, 60, 120, 300);
    g.strokeStyle = "rgba(60,40,24,0.6)"; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(28, 60 + k * 50); g.lineTo(148, 60 + k * 50); g.stroke(); } g.beginPath(); g.moveTo(88, 60); g.lineTo(88, 360); g.stroke();
    g.restore();
  }
  // table + white cloth with bread and a lemon (lower right)
  const tb = sub(p, 0.3, 0.46);
  if (tb > 0) {
    g.save(); g.globalAlpha = tb;
    g.fillStyle = "#5a3a22"; g.fillRect(420, 640, 220, 160);
    const cl = g.createLinearGradient(420, 640, 640, 760); cl.addColorStop(0, "#efe6d2"); cl.addColorStop(1, "#b8ab92");
    g.fillStyle = cl; g.beginPath(); g.moveTo(430, 650); g.lineTo(640, 640); g.lineTo(640, 800); g.lineTo(470, 800); g.closePath(); g.fill();
    g.fillStyle = "#c08a44"; g.beginPath(); g.ellipse(560, 655, 48, 26, -0.1, 0, 6.3); g.fill(); g.fillStyle = "rgba(255,230,170,0.5)"; g.beginPath(); g.ellipse(548, 646, 26, 10, -0.1, 0, 6.3); g.fill();
    g.fillStyle = "#e8c23a"; g.beginPath(); g.ellipse(486, 676, 22, 16, 0.3, 0, 6.3); g.fill();
    g.restore();
  }
  // body: black doublet + crimson sash
  const bd = sub(p, 0.34, 0.52);
  if (bd > 0) {
    g.save(); g.globalAlpha = bd;
    const cg = g.createLinearGradient(220, 440, 560, 800); cg.addColorStop(0, "#4a3e48"); cg.addColorStop(1, "#1e1820");
    g.fillStyle = cg; g.beginPath(); g.moveTo(190, 800); g.bezierCurveTo(200, 560, 250, 470, 340, 440); g.bezierCurveTo(440, 430, 520, 500, 560, 800); g.closePath(); g.fill();
    g.fillStyle = "#9a1f2a"; g.beginPath(); g.moveTo(260, 500); g.lineTo(300, 470); g.lineTo(540, 760); g.lineTo(500, 800); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,120,120,0.25)"; g.beginPath(); g.moveTo(290, 490); g.lineTo(300, 478); g.lineTo(470, 690); g.lineTo(458, 700); g.closePath(); g.fill();
    for (let k = 0; k < 5; k++) { g.fillStyle = "#c9a04a"; g.beginPath(); g.arc(352 + k * 6, 520 + k * 52, 7, 0, 6.3); g.fill(); }
    g.restore();
  }
  // face (warm light from the left), merry smile
  const fc = sub(p, 0.46, 0.64);
  if (fc > 0) {
    g.save(); g.globalAlpha = fc;
    const fg = g.createRadialGradient(320, 280, 20, 352, 305, 130); fg.addColorStop(0, "#f2c8a0"); fg.addColorStop(0.7, "#cf8e66"); fg.addColorStop(1, "#7a4a32");
    g.fillStyle = fg; g.beginPath(); g.ellipse(352, 305, 90, 108, 0.08, 0, 6.3); g.fill();
    g.fillStyle = "rgba(220,90,80,0.35)"; for (const [x, y] of [[312, 340], [402, 336]]) { g.beginPath(); g.ellipse(x, y, 24, 14, 0, 0, 6.3); g.fill(); }
    g.strokeStyle = "#3a2014"; g.lineWidth = 7; g.lineCap = "round";
    for (const x of [318, 390]) { g.beginPath(); g.arc(x, 292, 13, 3.6, 5.8); g.stroke(); }
    g.lineWidth = 6; g.beginPath(); g.arc(356, 340, 36, 0.35, 2.7); g.stroke();
    g.fillStyle = "#5a2a1a"; g.beginPath(); g.moveTo(330, 368); g.quadraticCurveTo(356, 362, 384, 368); g.quadraticCurveTo(356, 382, 330, 368); g.fill();
    g.strokeStyle = "#6a4024"; g.lineWidth = 9; g.beginPath(); g.moveTo(312, 354); g.quadraticCurveTo(352, 334, 400, 352); g.stroke();
    g.restore();
  }
  // white ruff (pleats)
  const rf = sub(p, 0.6, 0.76);
  if (rf > 0) {
    g.save(); g.globalAlpha = rf;
    for (let k = 0; k < 22; k++) { const a = Math.PI * (k / 21), x = 352 + Math.cos(a) * 128, y = 430 + Math.sin(a) * 26 - 8; g.fillStyle = k % 2 ? "#f2eee4" : "#d8d2c4"; g.beginPath(); g.ellipse(x, y, 22, 30, a, 0, 6.3); g.fill(); }
    g.restore();
  }
  // black hat with a wide brim
  const ht = sub(p, 0.7, 0.84);
  if (ht > 0) {
    g.save(); g.globalAlpha = ht;
    g.fillStyle = "#1a1416"; g.beginPath(); g.ellipse(350, 214, 190, 44, -0.06, 0, 6.3); g.fill();
    g.beginPath(); g.moveTo(262, 210); g.quadraticCurveTo(270, 104, 352, 96); g.quadraticCurveTo(436, 104, 440, 206); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.ellipse(300, 190, 70, 10, -0.1, 0, 6.3); g.fill();
    g.restore();
  }
  // raised wine glass in his hand (left)
  const gl = sub(p, 0.8, 0.94);
  if (gl > 0) {
    g.save(); g.globalAlpha = gl;
    g.fillStyle = "#d9a07a"; g.beginPath(); g.ellipse(170, 470, 34, 40, 0.2, 0, 6.3); g.fill();
    g.strokeStyle = "rgba(240,240,230,0.85)"; g.lineWidth = 4; g.beginPath(); g.moveTo(140, 300); g.lineTo(150, 420); g.lineTo(196, 420); g.lineTo(204, 300); g.stroke();
    g.fillStyle = "rgba(170,40,50,0.8)"; g.beginPath(); g.moveTo(144, 340); g.lineTo(150, 418); g.lineTo(196, 418); g.lineTo(201, 340); g.closePath(); g.fill();
    g.strokeStyle = "rgba(240,240,230,0.85)"; g.beginPath(); g.moveTo(173, 420); g.lineTo(173, 450); g.stroke();
    g.restore();
  }
  // highlights (the "master's touch")
  const hl = sub(p, 0.9, 1);
  if (hl > 0) {
    g.save(); g.globalAlpha = hl;
    g.fillStyle = "rgba(255,240,210,0.7)"; for (const [x, y, rx, ry] of [[300, 262, 22, 9], [186, 330, 5, 30], [330, 412, 30, 6], [356, 300, 7, 5]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.3); g.fill(); }
    g.restore();
  }
  // wet gloss streak
  if ((s.wet ?? 0) > 0) { g.save(); g.globalAlpha = 0.35 * (s.wet ?? 0); const wg = g.createLinearGradient(0, 0, W, H); wg.addColorStop(0.35, "rgba(255,255,255,0)"); wg.addColorStop(0.5, "rgba(255,255,255,0.9)"); wg.addColorStop(0.65, "rgba(255,255,255,0)"); g.fillStyle = wg; g.fillRect(0, 0, W, H); g.restore(); }
  // age: yellow-brown varnish + darker edges
  const ag = s.age ?? 0;
  if (ag > 0) {
    g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = ag;
    g.fillStyle = "#d6b06a"; g.fillRect(0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560); vg.addColorStop(0, "rgba(255,255,255,1)"); vg.addColorStop(1, "rgba(120,80,40,1)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    g.restore();
  }
  // cracks
  const ck = s.crack ?? 0, ik = s.ink ?? 0;
  if (ck > 0) {
    const C = cracks(), n = Math.floor(C.length * ck);
    g.save(); g.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const [x0, y0, x1, y1] = C[i];
      g.strokeStyle = `rgba(${Math.round(250 - 220 * ik)},${Math.round(240 - 215 * ik)},${Math.round(220 - 200 * ik)},${0.5 + 0.22 * ik})`;
      g.lineWidth = 1.3 + 0.5 * ik; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    g.restore();
  }
  // blank: scraped patches of the old picture showing (start of the fake)
  if ((s.blank ?? 0) > 0) { g.save(); g.globalAlpha = s.blank ?? 0; g.fillStyle = "#8a6a48"; g.fillRect(0, 0, W, H); g.restore(); }
};

export const paintingTex = (s: PaintState) => {
  const key = [q(s.paint ?? 1, 40), q(s.crack, 24), q(s.ink, 10), q(s.age, 10), q(s.wet, 4), q(s.blank, 4)].join("_");
  let t = cache.get(key);
  if (!t) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    draw(cv.getContext("2d")!, s);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    cache.set(key, t);
  }
  return t;
};

/** other old paintings for the walls (simple invented subjects): 0 landscape, 1 still life, 2 seascape, 3 portrait lady,
 *  4 windmill, 5 cows at dusk, 6 tulips, 7 church interior */
export const otherTex = (kind: number) => {
  const key = "other" + kind;
  let t = cache.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 320; cv.height = 400; const g = cv.getContext("2d")!, r = rng(91 + kind * 13);
  const k = kind % 8;
  const sky = (a: string, b: string, y = 240) => { const gr = g.createLinearGradient(0, 0, 0, y); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, 320, y); };
  if (k === 0 || k === 4 || k === 5) {
    sky(k === 5 ? "#5a6a9a" : "#7a9ac8", k === 5 ? "#e8a06a" : "#efe2c0", 250);
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(r() * 320, 40 + r() * 120, 40 + r() * 40, 14 + r() * 10, 0, 0, 6.3); g.fill(); }
    g.fillStyle = k === 5 ? "#3a4a2a" : "#5a7a3a"; g.fillRect(0, 250, 320, 150);
    g.fillStyle = "#3a2a1a"; g.fillRect(0, 240, 320, 14);
    if (k === 4) { g.fillStyle = "#4a3424"; g.beginPath(); g.moveTo(150, 250); g.lineTo(170, 130); g.lineTo(190, 250); g.fill(); g.strokeStyle = "#e8dcc0"; g.lineWidth = 6; for (let a = 0; a < 4; a++) { g.beginPath(); g.moveTo(170, 140); g.lineTo(170 + Math.cos(a * 1.57 + 0.4) * 70, 140 + Math.sin(a * 1.57 + 0.4) * 70); g.stroke(); } }
    if (k === 5) for (let i = 0; i < 3; i++) { g.fillStyle = "#e8e0d0"; g.beginPath(); g.ellipse(70 + i * 80, 300 + i * 12, 34, 18, 0, 0, 6.3); g.fill(); g.fillStyle = "#2a2020"; g.beginPath(); g.ellipse(60 + i * 80, 296 + i * 12, 12, 8, 0, 0, 6.3); g.fill(); }
  } else if (k === 1 || k === 6) {
    g.fillStyle = "#24170e"; g.fillRect(0, 0, 320, 400); g.fillStyle = "#5a3a22"; g.fillRect(0, 300, 320, 100);
    if (k === 1) { for (const [x, y, c] of [[110, 270, "#c8262e"], [170, 280, "#e8c23a"], [220, 262, "#6a8a3a"]] as [number, number, string][]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 30, 0, 6.3); g.fill(); } g.fillStyle = "#c9c2b0"; g.beginPath(); g.ellipse(160, 200, 40, 70, 0, 0, 6.3); g.fill(); }
    else { g.fillStyle = "#3a6a3a"; g.fillRect(150, 160, 20, 140); for (let i = 0; i < 9; i++) { g.fillStyle = ["#c8262e", "#e8c23a", "#f2f0e8", "#c0476a"][i % 4]; g.beginPath(); g.ellipse(90 + r() * 140, 80 + r() * 110, 20, 28, r(), 0, 6.3); g.fill(); } g.fillStyle = "#7a8aa0"; g.beginPath(); g.ellipse(160, 300, 50, 30, 0, 0, 6.3); g.fill(); }
  } else if (k === 2) {
    sky("#8aa6c8", "#e8dcc0", 230); g.fillStyle = "#3a5a7a"; g.fillRect(0, 230, 320, 170);
    for (let i = 0; i < 20; i++) { g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 2; g.beginPath(); const y = 240 + r() * 150; g.moveTo(r() * 320, y); g.lineTo(r() * 320, y + 2); g.stroke(); }
    g.fillStyle = "#4a3020"; g.beginPath(); g.moveTo(110, 250); g.lineTo(220, 250); g.lineTo(200, 275); g.lineTo(125, 275); g.fill(); g.fillStyle = "#efe6d0"; g.beginPath(); g.moveTo(165, 120); g.lineTo(165, 245); g.lineTo(225, 245); g.fill();
  } else if (k === 3) {
    const gr = g.createRadialGradient(160, 160, 20, 160, 200, 260); gr.addColorStop(0, "#4a3a2a"); gr.addColorStop(1, "#140e0a"); g.fillStyle = gr; g.fillRect(0, 0, 320, 400);
    g.fillStyle = "#1a1a24"; g.beginPath(); g.moveTo(70, 400); g.quadraticCurveTo(160, 240, 250, 400); g.fill();
    g.fillStyle = "#f2eee4"; g.beginPath(); g.ellipse(160, 270, 64, 16, 0, 0, 6.3); g.fill();
    g.fillStyle = "#e8b890"; g.beginPath(); g.ellipse(160, 190, 46, 58, 0, 0, 6.3); g.fill();
    g.fillStyle = "#f4f0e6"; g.beginPath(); g.ellipse(160, 140, 52, 30, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#3a2014"; for (const x of [144, 176]) { g.beginPath(); g.arc(x, 186, 4, 0, 6.3); g.fill(); }
  } else {
    g.fillStyle = "#d8ccb0"; g.fillRect(0, 0, 320, 400); g.fillStyle = "#b8a888";
    for (let i = 0; i < 4; i++) { g.fillRect(30 + i * 75, 60, 26, 300); g.beginPath(); g.arc(43 + i * 75, 60, 40, Math.PI, 0); g.fill(); }
    g.fillStyle = "#8a7a62"; g.fillRect(0, 340, 320, 60); for (let i = 0; i < 4; i++) { g.fillStyle = "#3a2a24"; g.beginPath(); g.ellipse(60 + i * 60, 330, 6, 16, 0, 0, 6.3); g.fill(); }
  }
  g.globalCompositeOperation = "multiply"; g.fillStyle = "rgba(214,176,106,0.55)"; g.fillRect(0, 0, 320, 400);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(key, t);
  return t;
};

const goldTex = () => {
  const key = "frameGold"; let t = cache.get(key); if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "#f6d77a"); gr.addColorStop(0.35, "#c9932e"); gr.addColorStop(0.6, "#f2c45a"); gr.addColorStop(1, "#7a4e18"); g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
  for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(255,240,180,0.35)"; g.beginPath(); g.ellipse(x + 8, 30, 5, 9, 0, 0, 6.3); g.fill(); g.fillStyle = "rgba(90,50,10,0.35)"; g.beginPath(); g.ellipse(x + 10, 36, 4, 6, 0, 0, 6.3); g.fill(); }
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; cache.set(key, t); return t;
};

export type Painting = { g: THREE.Group; canvas: THREE.Mesh; frame: THREE.Group; set: (s: PaintState) => void };
/** a painting facing +z (local), centred at its middle; w x h is the canvas; frame 0 = bare stretcher (on the easel),
 *  else the gilded frame width. `other` >= 0 paints one of the wall pictures instead of the title painting. */
export const framedPainting = (parent: THREE.Object3D, pos: V3, yaw: number, w: number, h: number, frame = 0.1, other = -1): Painting => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const tex0 = other >= 0 ? otherTex(other) : paintingTex({ paint: 1 });
  // the canvas glows a little on its own so the picture reads in dim rooms (varnish catching the light)
  const mat = new THREE.MeshLambertMaterial({ map: tex0, emissiveMap: tex0, emissive: new THREE.Color(0.55, 0.5, 0.45) });
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); canvas.position.z = 0.012; g.add(canvas);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), new THREE.MeshLambertMaterial({ color: "#7a5a3a" })); back.position.z = -0.005; back.castShadow = true; g.add(back);
  const fr = new THREE.Group(); g.add(fr);
  if (frame > 0) {
    const gm = new THREE.MeshPhongMaterial({ map: goldTex(), specular: "#fff0c0", shininess: 60 });
    const bar = (x0: number, y0: number, x1: number, y1: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), 0.07), gm); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.02); m.castShadow = true; fr.add(m); };
    const a = w / 2, b = h / 2, f = frame;
    bar(-a - f, b, a + f, b + f); bar(-a - f, -b - f, a + f, -b); bar(-a - f, -b, -a, b); bar(a, -b, a + f, b);
    // inner bevel lip
    const lip = new THREE.MeshLambertMaterial({ color: "#5a3a1a" });
    for (const [x0, y0, x1, y1] of [[-a, b - 0.015, a, b], [-a, -b, a, -b + 0.015], [-a, -b, -a + 0.015, b], [a - 0.015, -b, a, b]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.03), lip); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.02); fr.add(m); }
  }
  let last = "";
  const set = (s: PaintState) => {
    if (other >= 0) return;
    const key = JSON.stringify(s); if (key === last) return; last = key;
    mat.map = paintingTex(s); mat.emissiveMap = mat.map; mat.needsUpdate = true;
  };
  return { g, canvas, frame: fr, set };
};

/** soft additive glow plane over the canvas (oven heat, the reveal shine) */
export const shineCard = (parent: THREE.Object3D, w: number, h: number) => {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const gg = cv.getContext("2d")!;
  const gr = gg.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,200,120,1)"); gr.addColorStop(1, "rgba(255,140,60,0)"); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, h * 1.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  m.position.z = 0.03; m.layers.set(NOINK); parent.add(m); return m;
};
