// HÔTEL DU LYS, grand salon, Paris 1925 ("The Man Who Sold the Eiffel Tower"). Light keys: `salon` (day) and
// `salonNight` (the whisper scene). Room x -4.6..4.6, z -4.2 (window wall) .. 5.6 (door wall), ceiling 5.2.
// Three tall arched French windows on the back wall (x -3 / 0 / +3) look out over a park, two rows of zinc roofs and
// the Eiffel Tower (x 16, z -120, a painted-but-3D lattice backdrop on unlit materials that switch to night).
// The long mahogany table runs along z (x -0.62..0.62, z -1.5..1.9, top 0.78) with 6 chairs at the sides; the HEAD of
// the table faces the main window, with the 0.5 m lattice model of the tower on the table (x 0, z -0.95).
// Left wall: grand piano (back-left corner, keyboard toward +x), sideboard + mirror (z 0.6..2.8, the waiter's bar).
// Right wall: fireplace + trumeau mirror + mantel clock (z 0.3..2.1); back-right corner = the whisper corner
// (gueridon with a table lamp, lamp pool on the floor, right window behind). Double doors (outward) in the front wall
// centre, with the HÔTEL DU LYS cartouche above and a lit corridor behind.
//
// ctl (pose c):
//   curtain 0..1  main window curtains draw closed (0 open, 1 closed); its sun shaft, floor patch, dust and the window
//                 fill light fade, the general room fill dims ~45 % (the room gets a little darker)
//   night   0..1  window backdrop goes to night (deep blue sky, stars + moon, lit windows, street lamps, the tower with
//                 small lights and a sweeping beacon), window light off, moon-blue fill on, table lamps on, chandelier
//                 dimmed to 40 %. Use with light `salonNight`.
//   doors   0..1  the double doors swing open (outward, into the corridor)
// Ambient (always): chandelier sways + crystal glints, curtains breathe, mantel clock hands run, fire + candle
// flicker, dust motes in the window shafts, cigar smoke from the ashtrays, coffee-urn steam, a paper stirs on the
// table, palms sway, clouds drift, pigeons circle, chimney smoke, city lights twinkle at night.
//
// Keep-out boxes (camera must never enter): HOTEL_SOLIDS below (walls are the room bounds themselves).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit, cloudHD, CLOUD_DAY } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, shaft, rod } from "../setkit";
import { motes, flame, flameFlick, lamCustom, leafTex, roundTree, TAU } from "./innerkit_b";
import { palm, swayPalm, gullFlock, sparkles, sparkle, puff, risePuffs, fitText, cl, lerp, sm } from "./portkit_common";
import type { SetDef, V3 } from "./types";

export const HOTEL_SOLIDS: [V3, V3][] = [
  [[-0.75, 0, -1.6], [0.75, 0.95, 2.0]],      // table (+ the tower model up to 1.3 at z -0.95: see next)
  [[0.05, 0.78, -1.2], [0.55, 1.32, -0.7]],   // tower model
  [[-1.25, 0, -1.15], [-0.65, 1.1, 1.55]],    // left chairs
  [[0.65, 0, -1.15], [1.25, 1.1, 1.55]],      // right chairs
  [[-4.6, 0, -3.4], [-2.0, 1.75, -1.75]],     // grand piano + bench
  [[-4.6, 0, 0.55], [-4.0, 1.4, 2.85]],       // sideboard
  [[4.05, 0, 0.15], [4.6, 1.5, 2.25]],        // fireplace
  [[-4.6, 0, -1.4], [-3.8, 5.2, -0.6]], [[3.8, 0, -1.4], [4.6, 5.2, -0.6]], // columns
  [[-4.6, 0, 3.0], [-3.8, 5.2, 3.8]], [[3.8, 0, 3.0], [4.6, 5.2, 3.8]],
  [[-1.0, 3.3, -0.85], [1.0, 5.2, 1.25]],     // chandelier
  [[3.4, 0, -4.0], [4.15, 1.35, -3.25]],      // gueridon + lamp
  [[3.7, 0, -2.6], [4.5, 1.0, -1.8]],         // bergère
  [[-2.15, 0, -4.2], [-1.35, 2.0, -3.3]], [[1.35, 0, -4.2], [2.15, 2.0, -3.3]], // palms by the windows
  [[-2.0, 0, 4.7], [-1.2, 2.0, 5.6]], [[1.2, 0, 4.7], [2.0, 2.0, 5.6]],         // palms by the doors
];

// ---------------- small shared helpers (also used by ministry.ts) ----------------
const cylCache = new Map<number, THREE.BufferGeometry>();
const cylUnit = (rs: number) => { let g = cylCache.get(rs); if (!g) { g = new THREE.CylinderGeometry(1, 1, 1, rs, 1, true).translate(0, 0.5, 0); cylCache.set(rs, g); } return g; };
/** cylinder rod from a to c into a Batch */
export const seg = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, r: number, m: THREE.Material, rs = 6) => {
  const d = c.clone().sub(a), len = d.length(); if (len < 1e-5) return;
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.multiplyScalar(1 / len));
  b.add(cylUnit(rs), m, new THREE.Matrix4().compose(a, q, V(r, len, r)));
};
export const lathe = (pts: [number, number][], segs = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs);
export const GOLD = "#d6a443", GOLDL = "#f6d784", GOLDD = "#8a5a1c";
export const goldM = () => lamCustom("lysGoldM", () => twoTone(new THREE.MeshPhongMaterial({ color: "#e2ac48", emissive: "#4a3000", emissiveIntensity: 0.35, specular: "#fff0c0", shininess: 70 })));
export const brassM = () => lamCustom("lysBrassM", () => twoTone(new THREE.MeshPhongMaterial({ color: "#c99a45", emissive: "#2a1a00", emissiveIntensity: 0.3, specular: "#ffe6b0", shininess: 60 })));
export const silverM = () => lamCustom("lysSilverM", () => twoTone(new THREE.MeshPhongMaterial({ color: "#cfd4de", specular: "#ffffff", shininess: 90 })));
export const glassM = () => lamCustom("lysGlassM", () => twoTone(new THREE.MeshPhongMaterial({ color: "#e6f3ff", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.45, side: THREE.DoubleSide })));
export const basicNo = (color: THREE.ColorRepresentation, o: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, ...o });
/** painted wall clock / mantel clock dial (roman numerals) */
export const dialTex = (key: string, bg = "#f6eedb") => ctex("lysDial_" + key, 256, 256, (g) => {
  g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  g.strokeStyle = "#3a2216"; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 116, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 92, 0, TAU); g.stroke();
  g.fillStyle = "#2a1a14"; g.font = "700 26px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((s, i) => { const a = (i / 12) * TAU - Math.PI / 2; g.fillText(s, 128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); });
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; g.fillRect(128 + Math.cos(a) * 88 - 1.5, 128 + Math.sin(a) * 88 - 1.5, 3, i % 5 ? 3 : 6); }
});
/** clock hands on a dial group (dial faces +z of the group): returns a setter (hours) */
export const clockHands = (grp: THREE.Group, rad: number, z: number, col = "#1e1620") => {
  const m = lam("clockHand" + col, () => ({ color: col }));
  const hand = (len: number, w: number) => { const g = new THREE.Group(); g.position.z = z; const me = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.006).translate(0, len / 2 - len * 0.12, 0), m); g.add(me); grp.add(g); return g; };
  const hh = hand(rad * 0.55, rad * 0.11), mh = hand(rad * 0.82, rad * 0.07), sh = hand(rad * 0.88, rad * 0.025);
  sh.position.z = z + 0.003;
  return (hours: number, t: number) => { hh.rotation.z = -(hours / 12) * TAU; mh.rotation.z = -(hours % 1) * TAU; sh.rotation.z = -(Math.floor(t) / 60) * TAU; };
};
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
};
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
/** fleur-de-lys glyph (about 100 px tall at s = 1) */
export const drawLys = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(0, -50); g.bezierCurveTo(18, -30, 16, -5, 0, 10); g.bezierCurveTo(-16, -5, -18, -30, 0, -50); g.fill();
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 4, 6); g.bezierCurveTo(d * 18, -30, d * 50, -24, d * 42, 2); g.bezierCurveTo(d * 38, -10, d * 26, -8, d * 18, 10); g.closePath(); g.fill(); }
  g.fillRect(-24, 8, 48, 9);
  g.beginPath(); g.moveTo(-6, 17); g.lineTo(6, 17); g.lineTo(0, 44); g.closePath(); g.fill();
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 6, 17); g.bezierCurveTo(d * 22, 22, d * 26, 36, d * 14, 40); g.bezierCurveTo(d * 14, 30, d * 10, 24, d * 3, 17); g.closePath(); g.fill(); }
  g.restore();
};
const notchRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) => {
  g.beginPath(); g.moveTo(x + c, y); g.lineTo(x + w - c, y); g.arc(x + w, y, c, Math.PI, Math.PI / 2, true); g.lineTo(x + w, y + h - c);
  g.arc(x + w, y + h, c, -Math.PI / 2, Math.PI, true); g.lineTo(x + c, y + h); g.arc(x, y + h, c, 0, -Math.PI / 2, true); g.lineTo(x, y + c);
  g.arc(x, y, c, Math.PI / 2, 0, true); g.closePath();
};
const goldStroke = (g: CanvasRenderingContext2D, lw: number) => {
  g.lineWidth = lw * 1.3; g.strokeStyle = GOLDD; g.stroke(); g.lineWidth = lw; g.strokeStyle = GOLD; g.stroke(); g.lineWidth = lw * 0.3; g.strokeStyle = GOLDL; g.stroke();
};
export const marbleTex = (key: string, base: string, vein: string, alt: string, flutes = 0) => ctex("lysMarble_" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) blot(g, r() * 512, r() * 512, 40 + r() * 120, alt);
  for (let i = 0; i < 10; i++) {
    let x = r() * 512, y = r() * 512, a = r() * TAU; g.strokeStyle = vein; g.globalAlpha = 0.22 + r() * 0.35; g.lineWidth = 1 + r() * 3.5; g.lineCap = "round";
    g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 40; k++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); } g.stroke();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < flutes; i++) { const x = (i + 0.5) * 512 / flutes; const gr = g.createLinearGradient(x - 12, 0, x + 12, 0); gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(0.45, "rgba(90,70,60,0.28)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - 12, 0, 24, 512); }
});
/** polished wood (mahogany / walnut) with long soft grain */
export const woodTex = (key: string, base: string, dark: string, light: string) => ctex("lysWood_" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { const y = r() * 512, w = 2 + r() * 10; g.strokeStyle = r() < 0.6 ? dark : light; g.globalAlpha = 0.12 + r() * 0.2; g.lineWidth = w; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 30, 340, y + (r() - 0.5) * 30, 512, y); g.stroke(); }
  g.globalAlpha = 1; for (let i = 0; i < 6; i++) blot(g, r() * 512, r() * 512, 60 + r() * 90, "rgba(255,220,180,0.1)");
});
/** paper sheet with a title + scribbled lines (fits inside) */
export const docTex = (key: string, title: string, o: { tint?: string; stamp?: string; stampCol?: string; lines?: number } = {}) => ctex("lysDoc_" + key, 256, 340, (g, r) => {
  g.fillStyle = o.tint ?? "#f6efdc"; g.fillRect(0, 0, 256, 340);
  for (let i = 0; i < 5; i++) blot(g, r() * 256, r() * 340, 30 + r() * 60, "rgba(170,130,70,0.1)");
  g.fillStyle = "#2a1c18"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, title, 128, 40, 210, 30, "700 %spx Georgia, serif");
  g.strokeStyle = "rgba(40,30,30,0.55)"; g.lineWidth = 3;
  for (let i = 0; i < (o.lines ?? 9); i++) { const y = 84 + i * 24; g.beginPath(); g.moveTo(26, y); g.lineTo(26 + 150 + r() * 54, y); g.stroke(); }
  if (o.stamp) { g.save(); g.translate(150, 270); g.rotate(-0.22); g.strokeStyle = o.stampCol ?? "#c02a2a"; g.fillStyle = o.stampCol ?? "#c02a2a"; g.lineWidth = 6; g.strokeRect(-92, -26, 184, 52); fitText(g, o.stamp, 0, 2, 166, 36, "900 %spx Georgia, serif"); g.restore(); }
});

// ---------------- textures of the salon ----------------
const PPM = 256, BH = 1332; // wall canvases: 256 px per metre, 5.2 m tall
const Y = (m: number) => BH - m * PPM;
const wallBase = (g: CanvasRenderingContext2D, w: number) => {
  const gr = g.createLinearGradient(0, 0, 0, BH); gr.addColorStop(0, "#f4ebd5"); gr.addColorStop(0.7, "#eee2c6"); gr.addColorStop(1, "#e3d2ae"); g.fillStyle = gr; g.fillRect(0, 0, w, BH);
  // skirting + chair rail + frieze garlands + top band (geometry adds relief on top)
  g.fillStyle = "#d8c093"; g.fillRect(0, Y(0.2), w, 0.2 * PPM);
  g.fillStyle = GOLD; g.fillRect(0, Y(0.22), w, 6); g.fillRect(0, Y(1.03), w, 16); g.fillStyle = GOLDL; g.fillRect(0, Y(1.03) + 2, w, 3);
  const sh = g.createLinearGradient(0, Y(0.97), 0, Y(0.88)); sh.addColorStop(0, "rgba(90,60,30,0.25)"); sh.addColorStop(1, "rgba(90,60,30,0)"); g.fillStyle = sh; g.fillRect(0, Y(0.97), w, 0.09 * PPM);
  g.fillStyle = "#efe3c8"; g.fillRect(0, Y(4.85), w, 0.4 * PPM);
  g.fillStyle = GOLD; g.fillRect(0, Y(4.45), w, 5); g.fillRect(0, Y(4.85), w, 4);
  for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x + 8, Y(4.75)); g.quadraticCurveTo(x + 64, Y(4.52), x + 120, Y(4.75)); g.strokeStyle = GOLD; g.lineWidth = 7; g.stroke(); g.lineWidth = 2; g.strokeStyle = GOLDL; g.stroke(); g.fillStyle = GOLD; g.beginPath(); g.arc(x + 4, Y(4.76), 9, 0, TAU); g.fill(); }
};
/** boiserie bay (2 m wide): dado panel, chair rail, tall celadon silk panel in a notched gilded frame, frieze */
const bayTex = () => ctex("lysBay", 512, BH, (g, r) => {
  wallBase(g, 512);
  notchRect(g, 44, Y(0.86), 424, 0.56 * PPM, 18); goldStroke(g, 5);
  const px = 48, py = Y(4.22), pw = 416, ph = (4.22 - 1.32) * PPM;
  g.save(); notchRect(g, px, py, pw, ph, 34); g.clip();
  g.fillStyle = "#adc2a6"; g.fillRect(px, py, pw, ph);
  g.fillStyle = "rgba(236,246,226,0.32)"; for (let yy = py + 40; yy < py + ph; yy += 120) for (let xx = px + 50 + ((yy / 120) % 2 ? 60 : 0); xx < px + pw; xx += 120) drawLys(g, xx, yy, 0.42);
  const v = g.createRadialGradient(256, Y(2.8), 60, 256, Y(2.8), 520); v.addColorStop(0, "rgba(255,255,240,0.12)"); v.addColorStop(1, "rgba(40,60,40,0.3)"); g.fillStyle = v; g.fillRect(px, py, pw, ph);
  g.restore();
  notchRect(g, px, py, pw, ph, 34); goldStroke(g, 9);
  notchRect(g, px + 18, py + 18, pw - 36, ph - 36, 24); goldStroke(g, 3);
  g.fillStyle = GOLD; g.beginPath(); g.arc(256, py - 34, 22, 0, TAU); g.fill(); g.fillStyle = GOLDL; drawLys(g, 256, py - 40, 0.32);
  void r;
});
/** silk wall (window / door walls): horizontal mouldings + pale celadon stripes */
const silkTex = () => ctex("lysSilk", 512, BH, (g, r) => {
  wallBase(g, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(160,186,150,0.38)"; g.fillRect(x, Y(4.3), 30, (4.3 - 1.15) * PPM); g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(x + 30, Y(4.3), 3, (4.3 - 1.15) * PPM); }
  g.fillStyle = "rgba(255,250,236,0.35)"; for (let yy = Y(4.1); yy < Y(1.3); yy += 150) for (let xx = 48; xx < 512; xx += 128) drawLys(g, xx, yy, 0.22);
  g.fillStyle = GOLD; g.fillRect(0, Y(4.31), 512, 5); g.fillRect(0, Y(1.15), 512, 4);
  notchRect(g, 30, Y(0.86), 452, 0.56 * PPM, 18); goldStroke(g, 4);
  void r;
});
const ceilTex = () => ctex("lysCeil", 512, 512, (g) => {
  g.fillStyle = "#f2e8d2"; g.fillRect(0, 0, 512, 512);
  const v = g.createRadialGradient(256, 256, 20, 256, 256, 230); v.addColorStop(0, "#fbf4e2"); v.addColorStop(1, "#e6d6b4"); g.fillStyle = v; notchRect(g, 50, 50, 412, 412, 40); g.fill();
  notchRect(g, 50, 50, 412, 412, 40); goldStroke(g, 8); notchRect(g, 74, 74, 364, 364, 28); goldStroke(g, 3);
  g.fillStyle = GOLD; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.ellipse(256 + Math.cos(a) * 26, 256 + Math.sin(a) * 26, 22, 9, a, 0, TAU); g.fill(); }
  g.fillStyle = GOLDL; g.beginPath(); g.arc(256, 256, 12, 0, TAU); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(6, 6, 500, 500);
});
const parquetTex = () => ctex("lysParquet", 1024, 1024, (g, r) => {
  const W = 256, PH = 64, cols = ["#c98a4e", "#bb7c42", "#d49a5c", "#c58648", "#b4743c", "#d6a062"];
  g.fillStyle = "#6a3e20"; g.fillRect(0, 0, 1024, 1024);
  for (let c = 0; c < 4; c++) for (let row = -4; row < 1024 / PH + 1; row++) for (const side of [0, 1]) {
    const x0 = c * W + side * (W / 2), y = row * PH;
    g.beginPath();
    if (side === 0) { g.moveTo(x0, y + W / 2); g.lineTo(x0 + W / 2, y); g.lineTo(x0 + W / 2, y + PH); g.lineTo(x0, y + W / 2 + PH); }
    else { g.moveTo(x0, y); g.lineTo(x0 + W / 2, y + W / 2); g.lineTo(x0 + W / 2, y + W / 2 + PH); g.lineTo(x0, y + PH); }
    g.closePath(); g.fillStyle = jit(r, pick(r, cols), 0.07, 3, 0.1); g.fill();
    g.save(); g.clip();
    for (let k = 0; k < 6; k++) { const o = r() * PH; g.strokeStyle = `rgba(110,64,30,${0.12 + r() * 0.16})`; g.lineWidth = 1 + r() * 2; g.beginPath(); if (side === 0) { g.moveTo(x0, y + W / 2 + o); g.lineTo(x0 + W / 2, y + o); } else { g.moveTo(x0, y + o); g.lineTo(x0 + W / 2, y + W / 2 + o); } g.stroke(); }
    const sh = g.createLinearGradient(x0, y, x0 + W / 2, y + W / 2); sh.addColorStop(0, "rgba(255,240,210,0.16)"); sh.addColorStop(1, "rgba(80,40,10,0.1)"); g.fillStyle = sh; g.fillRect(x0, y - W, W / 2, W * 2);
    g.restore();
    g.strokeStyle = "rgba(60,32,14,0.6)"; g.lineWidth = 2.5; g.stroke();
  }
  for (let i = 0; i < 10; i++) blot(g, r() * 1024, r() * 1024, 80 + r() * 160, "rgba(255,236,200,0.12)");
});
const rugTex = () => ctex("lysRug", 1024, 1280, (g, r) => {
  g.fillStyle = "#1f2c58"; g.fillRect(0, 0, 1024, 1280);
  g.fillStyle = "#e0b65a"; g.fillRect(40, 40, 944, 1200); g.fillStyle = "#1f2c58"; g.fillRect(52, 52, 920, 1176);
  for (let x = 70; x < 960; x += 46) { g.fillStyle = "#d9a84a"; g.beginPath(); g.arc(x, 76, 9, 0, TAU); g.arc(x, 1204, 9, 0, TAU); g.fill(); }
  for (let y = 70; y < 1210; y += 46) { g.fillStyle = "#d9a84a"; g.beginPath(); g.arc(76, y, 9, 0, TAU); g.arc(948, y, 9, 0, TAU); g.fill(); }
  g.fillStyle = "#e0b65a"; g.fillRect(104, 104, 816, 1072);
  const fld = g.createRadialGradient(512, 640, 50, 512, 640, 700); fld.addColorStop(0, "#a8283a"); fld.addColorStop(1, "#7c1626"); g.fillStyle = fld; g.fillRect(114, 114, 796, 1052);
  g.strokeStyle = "rgba(230,180,90,0.32)"; g.lineWidth = 3; for (let x = 114; x < 910; x += 56) for (let y = 114; y < 1166; y += 56) { g.beginPath(); g.moveTo(x + 28, y + 8); g.lineTo(x + 48, y + 28); g.lineTo(x + 28, y + 48); g.lineTo(x + 8, y + 28); g.closePath(); g.stroke(); }
  const med = (rx: number, ry: number, c: string) => { g.fillStyle = c; g.beginPath(); g.ellipse(512, 640, rx, ry, 0, 0, TAU); g.fill(); };
  med(250, 330, "#e0b65a"); med(236, 316, "#1f2c58"); med(200, 270, "#f0e2c0"); med(170, 230, "#a8283a"); med(80, 110, "#e0b65a");
  g.fillStyle = "#1f2c58"; drawLys(g, 512, 640, 1.0);
  for (const [x, y] of [[114, 114], [910, 114], [114, 1166], [910, 1166]]) { g.fillStyle = "#e0b65a"; g.beginPath(); g.arc(x, y, 90, 0, TAU); g.fill(); g.fillStyle = "#1f2c58"; g.beginPath(); g.arc(x, y, 70, 0, TAU); g.fill(); }
  for (let i = 0; i < 14; i++) blot(g, r() * 1024, r() * 1280, 80 + r() * 140, "rgba(255,230,200,0.06)");
});
/** velvet curtain: ONE fold per texture repeat (highlight at u 0.25, matching sin() folds of the mesh); gold fringe */
const velvetTex = (key: string, dark: [number, number, number], mid: [number, number, number], light: [number, number, number]) => ctex("lysVelvet_" + key, 128, 512, (g, r) => {
  for (let x = 0; x < 128; x++) {
    const s = Math.sin((x / 128) * TAU), k = (s + 1) / 2, c = k < 0.5 ? dark.map((d, i) => d + (mid[i] - d) * k * 2) : mid.map((m, i) => m + (light[i] - m) * (k - 0.5) * 2);
    g.fillStyle = `rgb(${c.map(Math.round).join(",")})`; g.fillRect(x, 0, 1, 512);
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * 128, 0, 1 + r() * 3, 512); }
  const tg = g.createLinearGradient(0, 0, 0, 40); tg.addColorStop(0, "rgba(20,0,0,0.4)"); tg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = tg; g.fillRect(0, 0, 128, 40);
  g.fillStyle = GOLD; g.fillRect(0, 486, 128, 26); g.fillStyle = GOLDD; for (let x = 0; x < 128; x += 6) g.fillRect(x, 494, 2, 18); g.fillStyle = GOLDL; g.fillRect(0, 486, 128, 3);
});
const mirrorTex = () => ctex("lysMirror", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, "#e6edf2"); gr.addColorStop(0.5, "#bfcad6"); gr.addColorStop(1, "#9eacbe"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  blot(g, 90, 120, 90, "rgba(255,214,140,0.45)"); blot(g, 90, 120, 30, "rgba(255,245,220,0.8)");
  g.fillStyle = "rgba(255,255,255,0.35)"; for (const [x, w] of [[40, 40], [100, 14], [170, 26]]) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x + w, 512); g.lineTo(x + w + 160, 0); g.lineTo(x + 160, 0); g.fill(); }
  for (let i = 0; i < 30; i++) blot(g, r() < 0.5 ? r() * 20 : 236 + r() * 20, r() * 512, 10 + r() * 20, "rgba(90,80,70,0.25)");
});
const seineTex = () => ctex("lysPaintSeine", 512, 360, (g, r) => {
  const sk = g.createLinearGradient(0, 0, 0, 200); sk.addColorStop(0, "#7fa6d6"); sk.addColorStop(1, "#f6cf9a"); g.fillStyle = sk; g.fillRect(0, 0, 512, 210);
  for (let i = 0; i < 8; i++) blot(g, r() * 512, 40 + r() * 100, 40 + r() * 50, "rgba(255,240,230,0.35)");
  g.fillStyle = "#6f8a5a"; g.beginPath(); g.moveTo(0, 210); for (let x = 0; x <= 512; x += 32) g.lineTo(x, 180 - Math.sin(x * 0.02) * 16 - r() * 12); g.lineTo(512, 230); g.lineTo(0, 230); g.fill();
  g.fillStyle = "#d9c49a"; g.fillRect(0, 196, 512, 26);
  for (let x = 20; x < 512; x += 46) { g.fillStyle = "#4f6a8a"; g.fillRect(x, 170 - r() * 30, 30, 40); g.fillStyle = "#3a4a66"; g.beginPath(); g.moveTo(x - 4, 172 - 30); g.lineTo(x + 15, 150 - 30); g.lineTo(x + 34, 172 - 30); g.fill(); }
  const wt = g.createLinearGradient(0, 220, 0, 360); wt.addColorStop(0, "#9ab8d6"); wt.addColorStop(1, "#4a6a96"); g.fillStyle = wt; g.fillRect(0, 222, 512, 138);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,230,190,0.6)" : "rgba(40,60,100,0.4)"; g.fillRect(r() * 512, 230 + r() * 130, 10 + r() * 30, 3); }
  g.fillStyle = "#cdbb94"; g.fillRect(150, 214, 220, 18); for (let i = 0; i < 4; i++) { g.fillStyle = "#4a5a7a"; g.beginPath(); g.ellipse(180 + i * 55, 232, 20, 14, 0, Math.PI, 0); g.fill(); }
  g.fillStyle = "#5a3a2a"; g.beginPath(); g.moveTo(330, 300); g.lineTo(420, 300); g.lineTo(405, 316); g.lineTo(345, 316); g.fill(); g.fillStyle = "#f6eedb"; g.beginPath(); g.moveTo(372, 298); g.lineTo(372, 250); g.lineTo(400, 298); g.fill();
});
const flowersTex = () => ctex("lysPaintFlowers", 384, 480, (g, r) => {
  const bg = g.createRadialGradient(192, 220, 40, 192, 240, 320); bg.addColorStop(0, "#5a4a3a"); bg.addColorStop(1, "#231a20"); g.fillStyle = bg; g.fillRect(0, 0, 384, 480);
  g.fillStyle = "#8a5a3a"; g.fillRect(0, 400, 384, 80);
  g.fillStyle = "#3f6aa0"; g.beginPath(); g.ellipse(192, 360, 56, 70, 0, 0, TAU); g.fill(); g.fillRect(160, 280, 64, 40);
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI - Math.PI, d = 40 + r() * 110; g.fillStyle = "#3f7a3a"; g.beginPath(); g.ellipse(192 + Math.cos(a) * d * 0.9, 250 + Math.sin(a) * d * 0.8, 14, 6, a, 0, TAU); g.fill(); }
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI - Math.PI, d = 20 + r() * 110; g.fillStyle = pick(r, ["#e8505a", "#f6eedb", "#f2c24a", "#d86aa0", "#f08a5a"]); g.beginPath(); g.arc(192 + Math.cos(a) * d, 240 + Math.sin(a) * d * 0.85, 14 + r() * 10, 0, TAU); g.fill(); }
  blot(g, 130, 160, 60, "rgba(255,240,200,0.2)");
});
const hallTex = () => ctex("lysPaintHall", 512, 380, (g, r) => {
  const sk = g.createLinearGradient(0, 0, 0, 380); sk.addColorStop(0, "#9cc0e0"); sk.addColorStop(0.6, "#f2e2c0"); sk.addColorStop(1, "#7a9a5a"); g.fillStyle = sk; g.fillRect(0, 0, 512, 380);
  for (let i = 0; i < 6; i++) blot(g, r() * 512, 60 + r() * 60, 60, "rgba(255,255,255,0.4)");
  g.fillStyle = "#5f8a4a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(30 + i * 60, 250 + r() * 20, 40 + r() * 20, 0, TAU); g.fill(); }
  g.fillStyle = "#e8dcc0"; g.fillRect(200, 170, 120, 90); g.fillStyle = "#6a7a9a"; g.beginPath(); g.moveTo(190, 172); g.lineTo(260, 130); g.lineTo(330, 172); g.fill();
});
const keysTex = () => ctex("lysKeys", 1024, 64, (g) => {
  g.fillStyle = "#f8f4ea"; g.fillRect(0, 0, 1024, 64); g.fillStyle = "#6a6070"; for (let i = 0; i <= 52; i++) g.fillRect(i * (1024 / 52), 0, 2, 64);
  g.fillStyle = "#14121a"; for (let i = 0; i < 52; i++) { const n = i % 7; if (n === 2 || n === 6) continue; g.fillRect((i + 0.68) * (1024 / 52), 0, 1024 / 52 * 0.62, 38); }
});
const sheetTex = () => ctex("lysSheet", 256, 180, (g) => {
  g.fillStyle = "#f6efdc"; g.fillRect(0, 0, 256, 180); g.strokeStyle = "#3a2a2a"; g.lineWidth = 1.5;
  for (let s = 0; s < 3; s++) { for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(12, 30 + s * 52 + l * 6); g.lineTo(244, 30 + s * 52 + l * 6); g.stroke(); } for (let n = 0; n < 12; n++) { g.fillStyle = "#2a1a1a"; g.beginPath(); g.ellipse(28 + n * 18, 30 + s * 52 + ((n * 7) % 5) * 5, 3.5, 2.6, -0.4, 0, TAU); g.fill(); g.fillRect(31 + n * 18, 12 + s * 52 + ((n * 7) % 5) * 5, 1.5, 18); } }
});
const blueprintTex = () => ctex("lysBlueprint", 512, 360, (g) => {
  g.fillStyle = "#2b5896"; g.fillRect(0, 0, 512, 360); g.strokeStyle = "rgba(220,235,255,0.18)"; g.lineWidth = 1;
  for (let x = 0; x < 512; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 360); g.stroke(); } for (let y = 0; y < 360; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = "#eef6ff"; g.lineWidth = 3; g.beginPath(); g.moveTo(150, 330); g.quadraticCurveTo(230, 240, 250, 40); g.moveTo(350, 330); g.quadraticCurveTo(270, 240, 250, 40); g.stroke();
  g.beginPath(); g.moveTo(178, 260); g.lineTo(322, 260); g.moveTo(208, 190); g.lineTo(292, 190); g.moveTo(236, 90); g.lineTo(264, 90); g.stroke();
  g.lineWidth = 1.5; for (let y = 300; y > 60; y -= 18) { const w = 100 * Math.pow((y - 40) / 290, 1.6) + 6; g.beginPath(); g.moveTo(250 - w, y); g.lineTo(250 + w, y - 18); g.moveTo(250 + w, y); g.lineTo(250 - w, y - 18); g.stroke(); }
  g.beginPath(); g.arc(250, 330, 52, Math.PI, 0); g.stroke();
  g.strokeRect(380, 290, 120, 58); g.fillStyle = "#eef6ff"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "PLAN GÉNÉRAL", 440, 308, 108, 18, "700 %spx Georgia, serif"); fitText(g, "N° 7", 440, 332, 100, 16, "700 %spx Georgia, serif");
});
const doorGlassTex = () => ctex("lysDoorGlass", 256, 512, (g) => {
  g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 256, 512);
  const v = g.createRadialGradient(128, 256, 30, 128, 256, 300); v.addColorStop(0, "rgba(255,226,160,0.6)"); v.addColorStop(1, "rgba(200,170,120,0.2)"); g.fillStyle = v; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 5; g.strokeRect(20, 20, 216, 472); g.lineWidth = 2; g.strokeRect(34, 34, 188, 444);
  g.fillStyle = "rgba(255,255,255,0.85)"; drawLys(g, 128, 230, 1.2);
});
const cartoucheTex = () => ctex("lysCartouche", 1024, 300, (g) => {
  g.fillStyle = "#16244a"; g.fillRect(0, 0, 1024, 300);
  const v = g.createRadialGradient(512, 150, 50, 512, 150, 520); v.addColorStop(0, "rgba(80,110,180,0.45)"); v.addColorStop(1, "rgba(0,0,0,0.2)"); g.fillStyle = v; g.fillRect(0, 0, 1024, 300);
  notchRect(g, 18, 18, 988, 264, 34); goldStroke(g, 10); notchRect(g, 44, 44, 936, 212, 20); goldStroke(g, 3);
  g.fillStyle = GOLDL; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "HÔTEL DU LYS", 512, 156, 700, 120, "700 %spx Georgia, serif");
  g.fillStyle = GOLD; drawLys(g, 100, 150, 0.85); drawLys(g, 924, 150, 0.85);
});
const cigarLabelTex = () => ctex("lysCigarLbl", 256, 160, (g) => {
  g.fillStyle = "#f2e2b4"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#a8282a"; g.lineWidth = 8; g.strokeRect(10, 10, 236, 140);
  g.fillStyle = "#a8282a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "MAISON LYS", 128, 58, 200, 34, "900 %spx Georgia, serif");
  g.fillStyle = "#3a2216"; fitText(g, "CIGARES FINS", 128, 104, 190, 24, "700 %spx Georgia, serif");
});
const plaqueTex = () => ctex("lysPlaque", 256, 64, (g) => { g.fillStyle = "#d6a443"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#3a2410"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LA TOUR · 1889", 128, 34, 220, 34, "700 %spx Georgia, serif"); });
// ---- backdrop (outside the windows) ----
/** Haussmann facade tile: 6 m wide x 14 m tall, 3 window bays, 5 floors + shop floor; lit = only the lit panes */
export const hausTex = (key: string, stone: string, lit = false) => ctex(`lysHaus_${key}_${lit}`, 512, 1024, (g, r) => {
  if (!lit) {
    g.fillStyle = stone; g.fillRect(0, 0, 512, 1024);
    for (let y = 0; y < 1024; y += 26) { g.fillStyle = "rgba(120,100,80,0.12)"; g.fillRect(0, y, 512, 2); }
    const sh = g.createLinearGradient(0, 0, 0, 1024); sh.addColorStop(0, "rgba(255,255,255,0.1)"); sh.addColorStop(1, "rgba(60,50,40,0.12)"); g.fillStyle = sh; g.fillRect(0, 0, 512, 1024);
    g.fillStyle = "#4a3a34"; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 + i * 160, 1024); g.lineTo(40 + i * 160, 900); g.quadraticCurveTo(100 + i * 160, 860, 160 + i * 160, 900); g.lineTo(160 + i * 160, 1024); g.fill(); }
    g.fillStyle = pick(r, ["#2f6a4a", "#a8323a", "#2a4a7a"]); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(30 + i * 160, 880); g.lineTo(170 + i * 160, 880); g.lineTo(180 + i * 160, 920); g.lineTo(20 + i * 160, 920); g.fill(); }
  }
  for (let f = 0; f < 5; f++) {
    const y0 = 70 + f * 160, wh = f === 4 ? 100 : 128;
    for (let i = 0; i < 3; i++) {
      const x0 = 62 + i * 160, ww = 68;
      if (lit) { if (r() < 0.45) { const gl = g.createLinearGradient(0, y0, 0, y0 + wh); gl.addColorStop(0, "#ffe7a8"); gl.addColorStop(1, "#ffb860"); g.fillStyle = gl; g.fillRect(x0, y0, ww, wh); g.fillStyle = "rgba(90,50,20,0.6)"; g.fillRect(x0 + ww / 2 - 2, y0, 4, wh); g.fillRect(x0, y0 + wh * 0.4, ww, 3); } continue; }
      g.fillStyle = "#f2ead8"; g.fillRect(x0 - 8, y0 - 10, ww + 16, wh + 16);
      const gl = g.createLinearGradient(0, y0, 0, y0 + wh); gl.addColorStop(0, "#5a6e8e"); gl.addColorStop(1, "#33405e"); g.fillStyle = gl; g.fillRect(x0, y0, ww, wh);
      g.fillStyle = "rgba(220,235,255,0.35)"; g.beginPath(); g.moveTo(x0, y0 + wh * 0.6); g.lineTo(x0 + ww * 0.5, y0); g.lineTo(x0 + ww * 0.75, y0); g.lineTo(x0, y0 + wh * 0.9); g.fill();
      g.fillStyle = "#f2ead8"; g.fillRect(x0 + ww / 2 - 3, y0, 6, wh); g.fillRect(x0 - 14, y0 - 22, ww + 28, 12);
      if (f !== 1 && f !== 4) { g.fillStyle = "#1e1c26"; g.fillRect(x0 - 4, y0 + wh - 34, ww + 8, 4); for (let k = 0; k < 9; k++) g.fillRect(x0 - 2 + k * 9, y0 + wh - 34, 2, 30); }
    }
    if (!lit && (f === 1 || f === 4)) { const by = y0 + wh - 36; g.fillStyle = "#e6dcc6"; g.fillRect(0, by + 30, 512, 10); g.fillStyle = "#1e1c26"; g.fillRect(0, by, 512, 4); for (let x = 0; x < 512; x += 10) g.fillRect(x, by, 2, 30); for (let x = 5; x < 512; x += 30) { g.beginPath(); g.arc(x + 10, by + 15, 7, 0, TAU); g.lineWidth = 2; g.strokeStyle = "#1e1c26"; g.stroke(); } }
  }
});
export const zincTex = () => ctex("lysZinc", 256, 256, (g, r) => {
  g.fillStyle = "#8494ab"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(x, 0, 2, 256); g.fillStyle = "rgba(40,50,70,0.25)"; g.fillRect(x + 2, 0, 2, 256); }
  for (let i = 0; i < 8; i++) blot(g, r() * 256, r() * 256, 40 + r() * 50, "rgba(60,70,90,0.15)");
});
export const skyTex = (night: boolean) => ctex("lysSky_" + night, 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  if (!night) { gr.addColorStop(0, "#5f98e0"); gr.addColorStop(0.45, "#9cc4ee"); gr.addColorStop(0.63, "#e8eef4"); gr.addColorStop(0.68, "#f6e6cc"); gr.addColorStop(1, "#e8d4b8"); }
  else { gr.addColorStop(0, "#0a1032"); gr.addColorStop(0.4, "#16225a"); gr.addColorStop(0.62, "#2c3c7e"); gr.addColorStop(0.68, "#4a4e8e"); gr.addColorStop(1, "#22285a"); }
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  if (night) for (let i = 0; i < 260; i++) { const y = r() * 300, s = r() < 0.1 ? 2.2 : 1.2; g.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.6})`; g.beginPath(); g.arc(r() * 512, y, s, 0, TAU); g.fill(); }
});

// ---------------- the Eiffel tower (lattice, any size) ----------------
const PROF: [number, number][] = [[0, 0.215], [0.06, 0.18], [0.12, 0.148], [0.19, 0.118], [0.27, 0.09], [0.39, 0.062], [0.5, 0.047], [0.62, 0.036], [0.75, 0.027], [0.86, 0.02], [0.92, 0.017], [1, 0.017]];
const hwAt = (u: number) => { for (let i = 1; i < PROF.length; i++) if (u <= PROF[i][0]) { const [u0, a] = PROF[i - 1], [u1, c] = PROF[i]; return a + ((c - a) * (u - u0)) / (u1 - u0); } return PROF[PROF.length - 1][1]; };
/** 3D lattice tower H tall into a Batch: 4 legs (4 chords + X bracing), arches, 3 platforms, upper shaft, cupola,
 *  antenna. Returns sample points along the edges (for night lights) and the top point. */
export const eiffel = (b: Batch, H: number, main: THREE.Material, deck: THREE.Material, o: { rM?: number; rB?: number } = {}) => {
  const rM = (o.rM ?? 0.009) * H, rB = (o.rB ?? 0.0042) * H;
  const P = (x: number, u: number, z: number) => V(x * H, u * H, z * H);
  const pts: THREE.Vector3[] = [];
  const UL = 0.39, NL = 7, lw = (u: number) => 0.085 + (0.044 - 0.085) * (u / UL);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lvl = (k: number) => { const u = (k / NL) * UL, ou = hwAt(u), iu = ou - lw(u); return { u, c: [[ou, ou], [iu, ou], [iu, iu], [ou, iu]] }; };
    for (let k = 0; k < NL; k++) {
      const A = lvl(k), B = lvl(k + 1);
      for (let j = 0; j < 4; j++) {
        const j2 = (j + 1) % 4;
        const pa = P(sx * A.c[j][0], A.u, sz * A.c[j][1]), pb = P(sx * B.c[j][0], B.u, sz * B.c[j][1]);
        const qa = P(sx * A.c[j2][0], A.u, sz * A.c[j2][1]), qb = P(sx * B.c[j2][0], B.u, sz * B.c[j2][1]);
        seg(b, pa, pb, rM, main, 6); seg(b, pa, qb, rB, main, 4); seg(b, qa, pb, rB, main, 4); seg(b, pb, qb, rB, main, 4);
      }
      pts.push(P(sx * A.c[0][0], A.u, sz * A.c[0][1]));
    }
  }
  // decorative arches between the legs (one per face)
  for (let f = 0; f < 4; f++) {
    const a = hwAt(0.03) - lw(0.03) * 0.7, N = 14; let prev: THREE.Vector3 | null = null;
    for (let i = 0; i <= N; i++) {
      const x = -a + (2 * a * i) / N, u = 0.035 + 0.135 * Math.sqrt(Math.max(0, 1 - (x / a) ** 2)), d = hwAt(u) - lw(u) * 0.35;
      const p = f === 0 ? P(x, u, d) : f === 1 ? P(x, u, -d) : f === 2 ? P(d, u, x) : P(-d, u, x);
      if (prev) seg(b, prev, p, rM * 0.75, main, 5); prev = p;
    }
  }
  // upper shaft
  const NS = 9, U2 = 0.92, C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < NS; k++) {
    const u0 = UL + ((U2 - UL) * k) / NS, u1 = UL + ((U2 - UL) * (k + 1)) / NS, h0 = hwAt(u0), h1 = hwAt(u1);
    for (let j = 0; j < 4; j++) {
      const j2 = (j + 1) % 4;
      const pa = P(C[j][0] * h0, u0, C[j][1] * h0), pb = P(C[j][0] * h1, u1, C[j][1] * h1), qa = P(C[j2][0] * h0, u0, C[j2][1] * h0), qb = P(C[j2][0] * h1, u1, C[j2][1] * h1);
      seg(b, pa, pb, rM * 0.85, main, 6); seg(b, pa, qb, rB * 0.9, main, 4); seg(b, qa, pb, rB * 0.9, main, 4); seg(b, pb, qb, rB, main, 4);
      pts.push(pa);
    }
  }
  // platforms (deck + gallery band)
  const plat = (u: number, t: number, ext: number, band: number) => {
    const h = hwAt(u) + ext;
    b.add(boxGeo(P(-h, u - t, -h), P(h, u, h)), deck);
    for (const s of [-1, 1]) { b.add(boxGeo(P(-h, u, s * h - 0.002 * s), P(h, u + band, s * h)), main); b.add(boxGeo(P(s * h - 0.002 * s, u, -h), P(s * h, u + band, h)), main); }
    for (const [x, z] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) pts.push(P(x * h, u, z * h));
  };
  plat(0.19, 0.018, 0.022, 0.02); plat(0.39, 0.012, 0.014, 0.012);
  // top: cabin, cupola, antenna
  b.add(boxGeo(P(-0.024, U2 - 0.006, -0.024), P(0.024, U2, 0.024)), deck);
  b.add(boxGeo(P(-0.016, U2, -0.016), P(0.016, U2 + 0.03, 0.016)), main);
  b.add(new THREE.CylinderGeometry(0.007 * H, 0.013 * H, 0.025 * H, 10).translate(0, (U2 + 0.042) * H, 0), deck);
  b.add(new THREE.SphereGeometry(0.008 * H, 10, 6).translate(0, (U2 + 0.058) * H, 0), deck);
  seg(b, P(0, U2 + 0.06, 0), P(0, 1.0, 0), rB * 0.8, main, 4);
  return { pts, top: P(0, 1.0, 0) };
};

// ---------------- props ----------------
/** velvet curtain (moving mesh): anchored at x = ax, hangs from yTop, `width` runs in direction dir (+1/-1) */
type Curt = { mesh: THREE.Mesh; set: (width: number, t: number) => void };
const curtain = (parent: THREE.Object3D, mat: THREE.Material, ax: number, dir: number, z: number, yTop: number, h: number, ph: number, pinch = false): Curt => {
  const NX = 40, NY = 16, FOLDS = 7;
  const geo = new THREE.PlaneGeometry(1, 1, NX, NY), pos = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) uv.setX(iy * (NX + 1) + ix, (ix / NX) * FOLDS);
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; parent.add(mesh);
  return { mesh, set: (width, t) => {
    const amp0 = 0.04 + 0.1 * (1 - Math.min(1, width / 1.5));
    for (let iy = 0; iy <= NY; iy++) {
      const v = 1 - iy / NY, pin = pinch ? 1 - 0.55 * Math.exp(-(((v - 0.25) / 0.13) ** 2)) : 1, w = width * pin * (v < 0.08 ? 1 + (0.08 - v) * 0.8 : 1);
      const amp = amp0 * (pinch ? 1 + 0.6 * (1 - pin) : 1);
      for (let ix = 0; ix <= NX; ix++) {
        const u = ix / NX, k = iy * (NX + 1) + ix;
        const breathe = 0.025 * Math.sin(t * 0.7 + v * 2.2 + ph + u * 1.3) * (1 - v) + 0.01 * Math.sin(t * 1.3 + u * 6 + ph);
        pos.setXYZ(k, ax + dir * u * w + dir * 0.015 * Math.sin(t * 0.6 + v * 3 + ph) * (1 - v) * u, yTop - (1 - v) * h, z + amp * Math.sin(u * FOLDS * TAU) + breathe);
      }
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  } };
};
/** Louis XV chair (front toward local +z): gilded frame, crimson velvet cushion + oval back */
const chair = (b: Batch, parent: THREE.Object3D, pos: V3, yaw: number, gold: THREE.Material, velvet: THREE.Material) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const cb = new Batch();
  for (const [x, z] of [[-0.2, 0.19], [0.2, 0.19], [-0.19, -0.19], [0.19, -0.19]]) cb.add(lathe([[0.012, 0], [0.02, 0.03], [0.016, 0.2], [0.026, 0.36], [0.03, 0.42], [0, 0.42]], 8).translate(x, 0, z), gold);
  cb.add(boxGeo(V(-0.24, 0.4, -0.23), V(0.24, 0.45, 0.23)), gold);
  cb.add(new RoundedBoxGeometry(0.46, 0.08, 0.44, 2, 0.03).translate(0, 0.48, 0.0), velvet);
  for (const s of [-1, 1]) seg(cb, V(s * 0.19, 0.45, -0.21), V(s * 0.16, 0.98, -0.26), 0.018, gold, 6);
  cb.add(new THREE.TorusGeometry(1, 0.09, 6, 28).scale(0.19, 0.25, 0.19).translate(0, 0.76, -0.25), gold);
  cb.add(new THREE.CylinderGeometry(1, 1, 0.035, 24).rotateX(Math.PI / 2).scale(0.175, 0.23, 1).translate(0, 0.76, -0.25), velvet);
  cb.add(new THREE.SphereGeometry(0.03, 8, 6).scale(1.6, 1, 1).translate(0, 1.02, -0.25), gold);
  cb.build(g); void b;
  return g;
};
/** wine / champagne glass (lathe) with a little liquid */
const wineGlass = (parent: THREE.Object3D, pos: V3, liquid: string | null, flute = false) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const prof: [number, number][] = flute ? [[0.03, 0], [0.003, 0.006], [0.003, 0.08], [0.018, 0.1], [0.022, 0.16], [0.02, 0.2]] : [[0.034, 0], [0.003, 0.006], [0.003, 0.07], [0.03, 0.09], [0.038, 0.13], [0.03, 0.17]];
  const m = new THREE.Mesh(lathe(prof, 16), glassM()); g.add(m);
  if (liquid) { const l = new THREE.Mesh(flute ? new THREE.CylinderGeometry(0.019, 0.016, 0.07, 12).translate(0, 0.135, 0) : new THREE.CylinderGeometry(0.033, 0.024, 0.035, 14).translate(0, 0.1, 0), lam("lysLiquid" + liquid, () => ({ color: liquid }))); g.add(l); }
  return g;
};
const bottle = (b: Batch, x: number, y: number, z: number, h: number, col: string, label = "#f2e6c8") => {
  const gm = lamCustom("lysBottle" + col, () => twoTone(new THREE.MeshPhongMaterial({ color: col, specular: "#ffffff", shininess: 90 })));
  b.add(lathe([[0, 0], [0.04, 0], [0.042, h * 0.6], [0.016, h * 0.8], [0.014, h], [0, h]], 14).translate(x, y, z), gm);
  b.add(new THREE.CylinderGeometry(0.0425, 0.0425, h * 0.22, 14, 1, true).translate(x, y + h * 0.32, z), lam("lysLabel" + label, () => ({ color: label })));
  b.add(new THREE.CylinderGeometry(0.016, 0.016, h * 0.08, 10).translate(x, y + h * 0.98, z), goldM());
};

export const hotel = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const r = rng(1925);
  const X0 = -4.6, X1 = 4.6, ZB = -4.2, ZF = 5.6, H = 5.2, WT = 0.4;
  // ---- materials ----
  const floorM = lam("lysFloor", () => ({ map: parquetTex() }));
  const bayM = lam("lysBayM", () => ({ map: bayTex() }));
  const silkM = lam("lysSilkM", () => ({ map: silkTex() }));
  const ceilM = lam("lysCeilM", () => ({ map: ceilTex() }));
  const creamM = lam("lysCream", () => ({ color: "#f1e4c6" }));
  const paintM = lam("lysPaint", () => ({ color: "#f5ecd9" }));
  const gold = goldM(), silver = silverM(), brass = brassM();
  const marbleW = lam("lysMarbleW", () => ({ map: marbleTex("w", "#efe8dd", "#8a8290", "rgba(200,190,180,0.3)") }));
  const marbleCol = lam("lysMarbleCol", () => ({ map: marbleTex("col", "#ece2d2", "#8c7a6a", "rgba(214,196,170,0.35)", 12) }));
  const marbleRed = lam("lysMarbleRed", () => ({ map: marbleTex("red", "#9a3a32", "#f0d8c8", "rgba(120,30,30,0.4)") }));
  const marbleGreen = lam("lysMarbleGreen", () => ({ map: marbleTex("grn", "#2f5a4a", "#cfe6d8", "rgba(20,50,40,0.4)") }));
  const mahog = lamCustom("lysMahog", () => twoTone(new THREE.MeshPhongMaterial({ map: woodTex("mahog", "#7a3020", "#3e140c", "#c0603a"), specular: "#ffd8b0", shininess: 55 })));
  const lacq = lamCustom("lysLacq", () => twoTone(new THREE.MeshPhongMaterial({ color: "#2c2434", specular: "#d0d0f0", shininess: 95 })));
  const velvet = lam("lysVelvetM", () => ({ map: velvetTex("crimson", [86, 10, 24], [160, 30, 44], [222, 86, 92]), side: THREE.DoubleSide }));
  const cushion = lam("lysCushion", () => ({ color: "#b02a3a" }));
  const mirrorM = new THREE.MeshBasicMaterial({ map: mirrorTex(), color: new THREE.Color(0.95, 0.95, 0.97) });
  const sp: { s: THREE.Sprite[]; k: number }[] = [];

  // ---- shell: floor, walls, ceiling ----
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 2.4, (ZF - ZB) / 2.4), floorM);
  shell.add(quad(V(X0, 0, ZF), V(X0, 0, ZB), V(X0, H, ZB), V(X0, H, ZF), (ZF - ZB) / 2, 1), bayM);
  shell.add(quad(V(X1, 0, ZB), V(X1, 0, ZF), V(X1, H, ZF), V(X1, H, ZB), (ZF - ZB) / 2, 1), bayM);
  shell.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 2.4, (ZF - ZB) / 2.4), ceilM);
  // back wall with three arched window holes, front wall with the door hole (extruded, reveals show the thickness)
  const WINS = [{ x: -3.0, w: 1.6 }, { x: 0, w: 2.0 }, { x: 3.0, w: 1.6 }], WY0 = 0.3, WY1 = 3.6;
  const wallShape = () => { const s = new THREE.Shape(); s.moveTo(X0, 0); s.lineTo(X1, 0); s.lineTo(X1, H); s.lineTo(X0, H); s.closePath(); return s; };
  const bs = wallShape();
  for (const { x, w } of WINS) { const p = new THREE.Path(); p.moveTo(x - w / 2, WY0); p.lineTo(x + w / 2, WY0); p.lineTo(x + w / 2, WY1); p.absarc(x, WY1, w / 2, 0, Math.PI, false); p.lineTo(x - w / 2, WY0); bs.holes.push(p); }
  const DW = 0.95, DH = 3.4;
  const fs = wallShape(); { const p = new THREE.Path(); p.moveTo(-DW, 0); p.lineTo(DW, 0); p.lineTo(DW, DH); p.lineTo(-DW, DH); p.closePath(); fs.holes.push(p); }
  const wallGeo = (s: THREE.Shape, z: number) => {
    const geo = new THREE.ExtrudeGeometry(s, { depth: WT, bevelEnabled: false, curveSegments: 28 }); geo.translate(0, 0, z);
    const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 2, p.getY(i) / H);
    return geo;
  };
  const bw = new THREE.Mesh(wallGeo(bs, ZB - WT), silkM); bw.receiveShadow = true; root.add(bw);
  const fw = new THREE.Mesh(wallGeo(fs, ZF), silkM); fw.receiveShadow = true; root.add(fw);
  // cornice + skirting + chair rail relief all round
  const ring = (y0: number, y1: number, out: number, m: THREE.Material) => {
    b.add(boxGeo(V(X0, y0, ZB), V(X1, y1, ZB + out)), m); b.add(boxGeo(V(X0, y0, ZF - out), V(X1, y1, ZF)), m);
    b.add(boxGeo(V(X0, y0, ZB), V(X0 + out, y1, ZF)), m); b.add(boxGeo(V(X1 - out, y0, ZB), V(X1, y1, ZF)), m);
  };
  ring(H - 0.3, H, 0.24, creamM); ring(H - 0.42, H - 0.3, 0.14, gold); ring(H - 0.5, H - 0.42, 0.08, creamM);
  for (const [x0, x1] of [[X0, X0 + 0.04], [X1 - 0.04, X1]]) { b.add(boxGeo(V(x0, 0, ZB), V(x1, 0.2, ZF)), lam("lysSkirt", () => ({ color: "#dcc79e" }))); b.add(boxGeo(V(x0, 0.96, ZB), V(x1, 1.03, ZF)), gold); }
  // ceiling rose over the chandelier
  b.add(new THREE.CylinderGeometry(0.75, 0.85, 0.08, 40).translate(0, H - 0.04, 0.2), creamM); b.add(new THREE.TorusGeometry(0.8, 0.035, 6, 40).rotateX(Math.PI / 2).translate(0, H - 0.08, 0.2), gold);

  // ---- marble columns (side walls) + back-wall pilasters ----
  const column = (x: number, z: number) => {
    b.add(boxGeo(V(x - 0.38, 0, z - 0.38), V(x + 0.38, 0.42, z + 0.38)), marbleGreen);
    b.add(new THREE.CylinderGeometry(0.34, 0.36, 0.1, 28).translate(x, 0.47, z), gold);
    b.add(new THREE.CylinderGeometry(0.27, 0.29, 3.95, 28).translate(x, 0.52 + 1.975, z), marbleCol);
    b.add(new THREE.TorusGeometry(0.29, 0.025, 6, 28).rotateX(Math.PI / 2).translate(x, 0.56, z), gold);
    b.add(new THREE.TorusGeometry(0.28, 0.025, 6, 28).rotateX(Math.PI / 2).translate(x, 4.43, z), gold);
    b.add(new THREE.CylinderGeometry(0.4, 0.27, 0.36, 28).translate(x, 4.62, z), gold);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.add(new THREE.SphereGeometry(0.07, 8, 6).scale(1, 1.4, 0.6).translate(x + Math.cos(a) * 0.33, 4.68, z + Math.sin(a) * 0.33), gold); }
    b.add(boxGeo(V(x - 0.44, 4.8, z - 0.44), V(x + 0.44, 4.92, z + 0.44)), gold);
  };
  for (const z of [-1.0, 3.4]) { column(X0 + 0.4, z); column(X1 - 0.4, z); }
  for (const x of [-1.75, 1.75, -4.35, 4.35]) {
    const hw = x === -4.35 || x === 4.35 ? 0.2 : 0.3;
    b.add(boxGeo(V(x - hw, 0, ZB), V(x + hw, H - 0.5, ZB + 0.08)), marbleCol);
    b.add(boxGeo(V(x - hw - 0.04, 0, ZB), V(x + hw + 0.04, 0.35, ZB + 0.12)), marbleGreen);
    b.add(boxGeo(V(x - hw - 0.05, H - 0.9, ZB), V(x + hw + 0.05, H - 0.72, ZB + 0.14)), gold);
  }

  // ---- windows: frames, glazing bars, architraves, glass glints, balcony railing ----
  const glassStreak = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const { x, w } of WINS) {
    const hw = w / 2, zf = ZB - 0.22, fd = 0.05;
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * hw - (s > 0 ? 0.08 : 0), WY0, zf - fd), V(x + s * hw + (s < 0 ? 0.08 : 0), WY1, zf + fd)), paintM);
    b.add(boxGeo(V(x - hw, WY0, zf - fd), V(x + hw, WY0 + 0.1, zf + fd)), paintM);
    b.add(boxGeo(V(x - hw, WY1 - 0.05, zf - fd), V(x + hw, WY1 + 0.05, zf + fd)), paintM);
    b.add(new THREE.TorusGeometry(hw - 0.04, 0.045, 6, 28, Math.PI).translate(x, WY1, zf), paintM);
    b.add(boxGeo(V(x - 0.045, WY0, zf - fd), V(x + 0.045, WY1, zf + fd)), paintM);
    for (let y = WY0 + 0.6; y < WY1 - 0.2; y += 0.62) b.add(boxGeo(V(x - hw, y - 0.018, zf - 0.025), V(x + hw, y + 0.018, zf + 0.025)), paintM);
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * hw / 2 - 0.016, WY0, zf - 0.025), V(x + s * hw / 2 + 0.016, WY1, zf + 0.025)), paintM);
    for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI; seg(b, V(x, WY1, zf), V(x + Math.cos(a) * (hw - 0.04), WY1 + Math.sin(a) * (hw - 0.04), zf), 0.016, paintM, 5); }
    b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(-Math.PI / 2).translate(x, WY1, zf), paintM);
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * (hw / 2) - 0.32, WY0 + 0.1, zf - 0.02), V(x + s * (hw / 2) + 0.32, WY0 + 0.5, zf + 0.02)), paintM);
    // architrave (room side)
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * (hw + 0.1) - 0.08, 0.2, ZB), V(x + s * (hw + 0.1) + 0.08, WY1, ZB + 0.07)), gold);
    b.add(new THREE.TorusGeometry(hw + 0.1, 0.07, 6, 30, Math.PI).translate(x, WY1, ZB + 0.03), gold);
    b.add(boxGeo(V(x - 0.13, WY1 + hw + 0.0, ZB), V(x + 0.13, WY1 + hw + 0.3, ZB + 0.14)), gold);
    // window sill inside + balcony ledge + wrought-iron railing outside
    b.add(boxGeo(V(x - hw - 0.05, WY0 - 0.06, ZB - WT), V(x + hw + 0.05, WY0, ZB + 0.06)), marbleW);
    b.add(boxGeo(V(x - hw - 0.3, WY0 - 0.25, ZB - WT - 0.75), V(x + hw + 0.3, WY0 - 0.06, ZB - WT)), lam("lysStoneOut", () => ({ color: "#e4d8c0" })));
    const iron = lam("lysIronOut", () => ({ color: "#26222e" }));
    const rz = ZB - WT - 0.7;
    b.add(boxGeo(V(x - hw - 0.3, WY0 + 0.95, rz - 0.03), V(x + hw + 0.3, WY0 + 1.0, rz + 0.03)), iron);
    b.add(boxGeo(V(x - hw - 0.3, WY0 - 0.06, rz - 0.02), V(x + hw + 0.3, WY0 + 0.02, rz + 0.02)), iron);
    for (let xx = x - hw - 0.25; xx <= x + hw + 0.26; xx += 0.11) seg(b, V(xx, WY0, rz), V(xx, WY0 + 0.95, rz), 0.009, iron, 4);
    for (let xx = x - hw - 0.1; xx <= x + hw + 0.1; xx += 0.33) b.add(new THREE.TorusGeometry(0.09, 0.012, 4, 14).translate(xx, WY0 + 0.6, rz + 0.01), iron);
    for (const [gx, gy, gw] of [[-0.3, 1.9, 0.12], [0.2, 2.6, 0.06], [0.45, 1.2, 0.08]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(gw * w, 1.4), glassStreak); m.position.set(x + gx * w, gy, zf + 0.06); m.rotation.z = -0.5; m.layers.set(NOINK); root.add(m);
    }
  }
  // the window light (day): shafts + floor patches + dust, fill lights
  const patchTex = ctex("lysPatch", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const shafts: THREE.Mesh[] = [], patches: THREE.Mesh[] = [];
  for (const { x, w } of WINS) {
    shafts.push(shaft(root, [x + 0.15, 3.7, ZB + 0.05], [x + 0.6, 0.0, ZB + 3.3], w * 0.9, "#fff0cc", 0.15));
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.3, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: patchTex, color: new THREE.Color("#ffd9a0").multiplyScalar(0.45), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pm.position.set(x + 0.5, 0.012, ZB + 2.4); pm.layers.set(NOINK); root.add(pm); patches.push(pm);
  }
  const dust = motes(root, [-0.9, 0.4, ZB + 0.3], [1.4, 3.6, ZB + 3.2], 70, "#fff2d6", 0.03, 0.8, 9);
  const fillMain = new THREE.PointLight("#fff0da", 22, 10, 1.2); fillMain.position.set(0, 2.6, ZB + 1.0); root.add(fillMain);
  const fillRoom = new THREE.PointLight("#ffe6c4", 16, 14, 1.0); fillRoom.position.set(0.5, 3.4, 2.0); root.add(fillRoom);
  const fillSide = [-3, 3].map((x) => { const l = new THREE.PointLight("#fff0da", 10, 7, 1.2); l.position.set(x, 2.4, ZB + 0.9); root.add(l); return l; });
  const moonFill = new THREE.PointLight("#7f9cff", 0, 9, 1.0); moonFill.position.set(2.2, 2.8, ZB + 2.2); root.add(moonFill);
  const moonShaft = shaft(root, [3.0, 3.5, ZB + 0.05], [2.7, 0.0, ZB + 2.6], 1.3, "#9fb4ff", 0.0);

  // ---- curtains (main window draws closed; side windows tied back) + pelmets + cord ----
  const CT = 4.95, CZ = ZB + 0.18;
  const curtL = curtain(root, velvet, -1.45, 1, CZ, CT, CT, 0.3), curtR = curtain(root, velvet, 1.45, -1, CZ, CT, CT, 1.7);
  const sideCurts = [-3, 3].flatMap((x, i) => [curtain(root, velvet, x - 1.15, 1, CZ, CT, CT, 2.1 + i, true), curtain(root, velvet, x + 1.15, -1, CZ, CT, CT, 3.3 + i, true)]);
  for (const { x, w } of WINS) {
    const hw = w / 2 + 0.6;
    b.add(boxGeo(V(x - hw, CT - 0.02, ZB), V(x + hw, CT + 0.2, ZB + 0.3)), gold);
    for (let k = 0; k < 5; k++) { const sx = x - hw + ((k + 0.5) / 5) * hw * 2; b.add(new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale((hw * 2) / 5 / 2 + 0.02, 0.22, 0.08).translate(sx, CT - 0.02, ZB + 0.31), velvet); b.add(new THREE.ConeGeometry(0.03, 0.14, 8).rotateX(Math.PI).translate(sx + (hw * 2) / 10, CT - 0.12, ZB + 0.33), gold); }
    b.add(boxGeo(V(x - hw - 0.02, CT + 0.2, ZB), V(x + hw + 0.02, CT + 0.26, ZB + 0.34)), gold);
  }
  for (const x of [-3, 3]) for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(0.1, 0.022, 6, 16).rotateX(Math.PI / 2).scale(1.2, 1, 0.7).translate(x + s * 1.0, 1.33, CZ + 0.02), gold); b.add(new THREE.ConeGeometry(0.035, 0.2, 8).translate(x + s * 1.0, 1.15, CZ + 0.09), gold); }
  seg(b, V(1.62, CT, ZB + 0.36), V(1.62, 1.05, ZB + 0.36), 0.012, gold, 5);
  b.add(new THREE.ConeGeometry(0.045, 0.22, 10).translate(1.62, 0.95, ZB + 0.36), gold); b.add(new THREE.SphereGeometry(0.04, 8, 6).translate(1.62, 1.07, ZB + 0.36), gold);

  // ---- the view of Paris (unlit painted materials, day <-> night) ----
  const bdM: { m: THREE.MeshBasicMaterial; d: THREE.Color; n: THREE.Color }[] = [];
  const bmat = (map: THREE.Texture | null, day: string, night: string, o: THREE.MeshBasicMaterialParameters = {}) => { const m = new THREE.MeshBasicMaterial({ map, color: day, fog: false, ...o }); bdM.push({ m, d: new THREE.Color(day), n: new THREE.Color(night) }); return m; };
  const bb = new Batch(), SY = -14;
  const skyD = new THREE.Mesh(new THREE.PlaneGeometry(1000, 420), new THREE.MeshBasicMaterial({ map: skyTex(false), fog: false, transparent: true, depthWrite: false }));
  const skyN = new THREE.Mesh(new THREE.PlaneGeometry(1000, 420), new THREE.MeshBasicMaterial({ map: skyTex(true), fog: false, transparent: true, opacity: 0, depthWrite: false }));
  for (const s of [skyD, skyN]) { s.position.set(0, 60, -280); s.layers.set(NOINK); s.renderOrder = -2; root.add(s); }
  // horizon of v 0.35 at y = 60 - 210 + 0.35*420 = -3 ~ eye level at 280 m (the painted horizon haze sits there)
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("lysMoon", 128, 128, (g) => { g.fillStyle = "#fbf6e0"; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fill(); g.fillStyle = "rgba(200,190,170,0.5)"; g.beginPath(); g.arc(46, 52, 12, 0, TAU); g.arc(78, 80, 9, 0, TAU); g.fill(); }), color: new THREE.Color(1.5, 1.5, 1.4), fog: false, transparent: true, opacity: 0 }));
  moon.scale.set(14, 14, 1); moon.position.set(-40, 60, -270); moon.layers.set(NOINK); root.add(moon);
  const moonGlow = glow(root, [-40, 60, -271], "#8fa4ff", 70, 1);
  const clouds = [0, 1, 2, 3, 4].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudHD(i + 3, CLOUD_DAY), fog: false, transparent: true, depthWrite: false })); const w = 50 + i * 12; s.scale.set(w, w / 2.4, 1); s.position.set(-150 + i * 75, 30 + (i % 3) * 14, -240); s.layers.set(NOINK); s.renderOrder = -1; root.add(s); return s; });
  // park trees (row A), two rows of Haussmann blocks (B, C), far roofline + a dome (D)
  const leafM = bmat(leafTex("lysPark", "#5d9a48", "#8cc266", "#3f7a38"), "#ffffff", "#2a3a68"), barkM = bmat(null, "#6a5040", "#1a2040");
  for (let i = 0; i < 26; i++) { const x = -40 + i * 3.4 + r() * 1.5, z = -15 - r() * 10; roundTree(bb, x, z, 9 + r() * 3, i + 3, leafM, barkM, SY); }
  const stones = ["#efe2c8", "#e6d4b4", "#f2e8d6"], fac = stones.map((s, i) => bmat(hausTex("s" + i, s), "#ffffff", "#4c5690")), facS = stones.map((s, i) => bmat(hausTex("s" + i, s), "#cbbfb8", "#323a6c"));
  const zinc = bmat(zincTex(), "#ffffff", "#3c4674"), zincTop = bmat(zincTex(), "#c8d0dc", "#2c3460"), corn = bmat(null, "#f6eedc", "#5a64a0"), terra = bmat(null, "#c06a4a", "#3a2c4c"), dormF = bmat(null, "#f0e6d0", "#4c5690");
  const litMats: THREE.MeshBasicMaterial[] = [];
  const litTex = [hausTex("L1", "", true), hausTex("L22x", "#", true)];
  const smokes: THREE.Sprite[] = [];
  const block = (x0: number, x1: number, zf: number, depth: number, top: number, k: number, sm2 = false) => {
    const w = x1 - x0, ub = w / 6;
    bb.add(quad(V(x0, SY, zf), V(x1, SY, zf), V(x1, top, zf), V(x0, top, zf), ub, 1), fac[k % 3]);
    bb.add(quad(V(x1, SY, zf), V(x1, SY, zf - depth), V(x1, top, zf - depth), V(x1, top, zf), depth / 6, 1), facS[k % 3]);
    bb.add(quad(V(x0, SY, zf - depth), V(x0, SY, zf), V(x0, top, zf), V(x0, top, zf - depth), depth / 6, 1), facS[k % 3]);
    bb.add(boxGeo(V(x0 - 0.2, top, zf - depth), V(x1 + 0.2, top + 0.45, zf + 0.35)), corn);
    const rt = top + 0.45, rh = 3.2, rin = 1.3;
    bb.add(quad(V(x0, rt, zf), V(x1, rt, zf), V(x1, rt + rh, zf - rin), V(x0, rt + rh, zf - rin), w / 3, 1), zinc);
    bb.add(quad(V(x0, rt + rh, zf - rin), V(x1, rt + rh, zf - rin), V(x1, rt + rh, zf - depth), V(x0, rt + rh, zf - depth), w / 3, 1), zincTop);
    for (const [xa, s] of [[x0, -1], [x1, 1]] as [number, number][]) bb.add(quad(s < 0 ? V(xa, rt, zf - depth) : V(xa, rt, zf), s < 0 ? V(xa, rt, zf) : V(xa, rt, zf - depth), s < 0 ? V(xa, rt + rh, zf - rin) : V(xa, rt + rh, zf - depth), s < 0 ? V(xa, rt + rh, zf - depth) : V(xa, rt + rh, zf - rin), 1, 1), zincTop);
    for (let xx = x0 + 1.2; xx < x1 - 0.8; xx += 2.0) { bb.add(boxGeo(V(xx - 0.45, rt + 0.4, zf - 0.9), V(xx + 0.45, rt + 1.7, zf - 0.2)), dormF); bb.add(new THREE.ConeGeometry(0.66, 0.5, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.8).translate(xx, rt + 1.95, zf - 0.55), zinc); }
    const nc = 1 + Math.floor(r() * 3);
    for (let c = 0; c < nc; c++) { const cx = x0 + 0.8 + r() * (w - 1.6), cz = zf - rin - 0.4 - r() * (depth - rin - 1), ch = 1.2 + r() * 0.8; bb.add(boxGeo(V(cx - 0.6, rt + rh - 0.2, cz - 0.3), V(cx + 0.6, rt + rh + ch, cz + 0.3)), terra); for (let p = 0; p < 3; p++) bb.add(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 8).translate(cx - 0.36 + p * 0.36, rt + rh + ch + 0.22, cz), terra); if (sm2 && c === 0) smokes.push(puff(root, [cx, rt + rh + ch + 0.8, cz], 2.2, "#ebe6ee", 0.5)); }
    const lm = new THREE.MeshBasicMaterial({ map: litTex[k % 2], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: new THREE.Color(1.4, 1.2, 0.9) });
    litTex[k % 2].repeat.set(1, 1);
    const lp = new THREE.Mesh(quad(V(x0, SY, zf + 0.05), V(x1, SY, zf + 0.05), V(x1, top, zf + 0.05), V(x0, top, zf + 0.05), ub, 1), lm); lp.layers.set(NOINK); root.add(lp); litMats.push(lm);
  };
  { let x = -46; let k = 0; while (x < 52) { const w = 9 + r() * 8; block(x, x + w - 0.3, -36 - r() * 3, 12, -4.2 + r() * 1.4, k++, k % 3 === 0); x += w; } }
  { let x = -70; let k = 1; while (x < 80) { const w = 10 + r() * 10; block(x, x + w - 0.3, -62 - r() * 6, 12, -1.2 + r() * 1.8, k++); x += w; } }
  const farM = bmat(null, "#b8bccb", "#262e5c"), farRoof = bmat(null, "#9aa4bd", "#1e2552");
  for (let x = -160; x < 160; x += 14) { const h = 3 + r() * 4, z = -150 - r() * 20; bb.add(boxGeo(V(x, SY, z - 8), V(x + 13, h, z)), farM); bb.add(boxGeo(V(x + 1, h, z - 7), V(x + 12, h + 1.6, z - 1)), farRoof); }
  bb.add(new THREE.SphereGeometry(9, 24, 12, 0, TAU, 0, Math.PI / 2).scale(1, 1.3, 1).translate(-55, 13, -175), bmat(null, "#8f9cb8", "#2a3262")); bb.add(new THREE.CylinderGeometry(8.6, 8.6, 6, 24).translate(-55, 10, -175), farM); bb.add(boxGeo(V(-75, SY, -190), V(-35, 7, -165)), farM); bb.add(new THREE.CylinderGeometry(1.2, 1.6, 4, 12).translate(-55, 26.5, -175), bmat(null, "#d8b860", "#3a3a66"));
  // the tower outside (x 16, z -120, 46 m tall from below the roofs)
  const towerD = bmat(null, "#8f6c56", "#1c2246"), towerDeck = bmat(null, "#7a5a48", "#161c3c");
  const TW = new THREE.Group(); TW.position.set(10, SY - 2, -120); root.add(TW);
  const tb = new Batch(); const towerInfo = eiffel(tb, 35, towerD, towerDeck, { rM: 0.008, rB: 0.0035 }); tb.build(TW, false);
  const towerLights = towerInfo.pts.filter((_, i) => i % 2 === 0).map((p) => { const s = glow(TW, [p.x, p.y, p.z + 0.3], "#ffd890", 2.2, 1); return s; });
  const beaconG = glow(TW, [towerInfo.top.x, towerInfo.top.y - 2, towerInfo.top.z], "#fff2c0", 9, 1);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(90, 2.4).translate(45, 0, 0), new THREE.MeshBasicMaterial({ map: ctex("lysBeam", 256, 32, (g) => { const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 32); const g2 = g.createLinearGradient(0, 0, 0, 32); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(0.5, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = g2; g.fillRect(0, 0, 256, 32); }), color: "#fff0c0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const beamPivot = new THREE.Group(); beamPivot.position.set(towerInfo.top.x, towerInfo.top.y - 2, towerInfo.top.z); TW.add(beamPivot); beamPivot.add(beam); beam.layers.set(NOINK);
  // street lamps + city lights (night)
  const cityLights: THREE.Sprite[] = [];
  for (let x = -44; x < 52; x += 4.2) cityLights.push(glow(root, [x, -6.5 + r() * 0.4, -31], "#ffcf7a", 1.3, 1));
  for (let i = 0; i < 60; i++) cityLights.push(glow(root, [-150 + r() * 300, 0 + r() * 6, -148 - r() * 6], "#ffd48a", 1.5 + r(), 1));
  bb.build(root, false);
  const flockG = new THREE.Group(); flockG.position.set(4, 7, -28); flockG.scale.setScalar(2.4); root.add(flockG);
  const flock = gullFlock(flockG, 6, [0, 0, 0], 5, "#717486");

  // ---- the chandelier (crystal, glowing) ----
  const CHZ = 0.2, ch = new THREE.Group(); ch.position.set(0, H - 0.08, CHZ); root.add(ch);
  const crystal = lamCustom("lysCrystal", () => twoTone(new THREE.MeshPhongMaterial({ color: "#eef6ff", emissive: "#7a90b8", emissiveIntensity: 0.55, specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.9 })));
  const cb = new Batch();
  seg(cb, V(0, 0, 0), V(0, -0.85, 0), 0.025, gold, 8);
  for (let i = 0; i < 6; i++) cb.add(new THREE.TorusGeometry(0.035, 0.01, 4, 10).rotateY(i % 2 ? Math.PI / 2 : 0).translate(0, -0.1 - i * 0.12, 0), gold);
  cb.add(lathe([[0, -1.45], [0.05, -1.42], [0.16, -1.3], [0.14, -1.18], [0.07, -1.1], [0.1, -0.98], [0.05, -0.88], [0, -0.85]], 20), gold);
  cb.add(new THREE.SphereGeometry(0.05, 10, 8).translate(0, -1.5, 0), gold);
  const bulbs: [number, number, number][] = [];
  const arm = (n: number, R: number, y: number, a0: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU, c = Math.cos(a), s = Math.sin(a);
      const pts = [[0.1, y + 0.02], [R * 0.45, y - 0.16], [R * 0.85, y - 0.12], [R, y]].map(([d, yy]) => V(c * d, yy, s * d));
      for (let k = 0; k < 3; k++) seg(cb, pts[k], pts[k + 1], 0.016, gold, 6);
      cb.add(lathe([[0, 0], [0.05, 0.01], [0.055, 0.04], [0.03, 0.05], [0, 0.05]], 12).translate(c * R, y, s * R), gold);
      cb.add(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 10).translate(c * R, y + 0.1, s * R), lam("lysWax", () => ({ color: "#fbf3e2" })));
      bulbs.push([c * R, y + 0.18, s * R]);
      for (let d = 0; d < 3; d++) { const dy = y - 0.05 - d * 0.075; cb.add(new THREE.OctahedronGeometry(0.022, 0).scale(1, 1.8, 1).translate(c * R, dy, s * R), crystal); }
      // swag of beads to the next arm
      const a2 = a0 + ((i + 1) / n) * TAU, p0 = V(c * R, y - 0.02, s * R), p1 = V(Math.cos(a2) * R, y - 0.02, Math.sin(a2) * R);
      for (let k = 1; k < 10; k++) { const u = k / 10, p = p0.clone().lerp(p1, u); p.multiplyScalar(1).setY(y - 0.02 - Math.sin(u * Math.PI) * 0.16); const rr = Math.hypot(p.x, p.z); p.x *= (R * 0.98) / rr; p.z *= (R * 0.98) / rr; cb.add(new THREE.IcosahedronGeometry(0.014, 0).translate(p.x, p.y, p.z), crystal); }
    }
  };
  arm(8, 0.78, -1.22, 0); arm(6, 0.46, -0.92, 0.3);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; for (let k = 0; k < 8; k++) { const u = k / 7, rr = 0.3 * Math.sin((0.15 + u * 0.85) * Math.PI) + 0.02; cb.add(new THREE.IcosahedronGeometry(0.016, 0).translate(Math.cos(a) * rr, -1.3 - u * 0.5, Math.sin(a) * rr), crystal); } }
  cb.add(new THREE.OctahedronGeometry(0.05, 0).scale(1, 2, 1).translate(0, -1.9, 0), crystal);
  cb.build(ch);
  const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.3) });
  const bulbGlows = bulbs.map((p) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.5, 1), bulbM); m.position.set(...p); m.layers.set(NOINK); ch.add(m); return glow(ch, p, "#ffd08a", 0.5, 0.9); });
  const chGlow = glow(ch, [0, -1.25, 0], "#ffd59a", 3.4, 0.6);
  const chL = new THREE.PointLight("#ffd08a", 30, 13, 1.1); chL.position.set(0, -1.35, 0); ch.add(chL);
  sp.push({ s: sparkles(ch, 26, [0, -1.95, 0], 1.6, 1.1, 1.6, 12, 0.22), k: 1 });

  // ---- rug + the long table + chairs ----
  const rugM = lam("lysRugM", () => ({ map: rugTex() }));
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.6).rotateX(-Math.PI / 2), rugM); rug.position.set(0, 0.008, 0.25); rug.receiveShadow = true; root.add(rug);
  for (const z of [0.25 - 2.8, 0.25 + 2.8]) b.add(boxGeo(V(-2.2, 0, z - 0.04), V(2.2, 0.012, z + 0.04)), lam("lysFringe", () => ({ color: "#f2e4c0" })));
  const TX = 0.62, TZ0 = -1.5, TZ1 = 1.9, TY = 0.78;
  b.add(boxGeo(V(-TX, TY - 0.05, TZ0), V(TX, TY, TZ1), 1.6), mahog);
  b.add(boxGeo(V(-TX - 0.015, TY - 0.065, TZ0 - 0.015), V(TX + 0.015, TY - 0.04, TZ1 + 0.015)), gold);
  b.add(boxGeo(V(-TX + 0.05, TY - 0.17, TZ0 + 0.05), V(TX - 0.05, TY - 0.065, TZ1 - 0.05), 1.6), mahog);
  for (const x of [-TX + 0.09, TX - 0.09]) for (const z of [TZ0 + 0.1, (TZ0 + TZ1) / 2, TZ1 - 0.1]) {
    b.add(lathe([[0.03, 0], [0.045, 0.03], [0.032, 0.1], [0.05, 0.28], [0.034, 0.48], [0.055, 0.55], [0.055, TY - 0.17], [0, TY - 0.17]], 14).translate(x, 0, z), mahog);
    b.add(new THREE.TorusGeometry(0.05, 0.012, 6, 14).rotateX(Math.PI / 2).translate(x, 0.28, z), gold);
  }
  const chairZ = [-0.85, 0.2, 1.25];
  for (const z of chairZ) { chair(b, root, [-0.92, 0, z], Math.PI / 2, gold, cushion); chair(b, root, [0.92, 0, z], -Math.PI / 2, gold, cushion); }
  // the tower model (title object) on a marble plinth
  const MX = 0.3, MZ = -0.95, model = new THREE.Group(); model.position.set(MX, TY, MZ); root.add(model);
  const bronze = lamCustom("lysBronze", () => twoTone(new THREE.MeshPhongMaterial({ color: "#c8843c", emissive: "#4a2200", emissiveIntensity: 0.45, specular: "#ffe0b0", shininess: 70 })));
  const mb = new Batch();
  mb.add(new THREE.CylinderGeometry(0.2, 0.215, 0.04, 36).translate(0, 0.02, 0), marbleGreen);
  mb.add(new THREE.TorusGeometry(0.205, 0.01, 6, 36).rotateX(Math.PI / 2).translate(0, 0.04, 0), gold);
  mb.add(boxGeo(V(-0.13, 0.04, -0.13), V(0.13, 0.055, 0.13)), marbleW);
  const mt = new THREE.Group(); mt.position.y = 0.055; model.add(mt);
  const mtb = new Batch(); eiffel(mtb, 0.5, bronze, gold, { rM: 0.0095, rB: 0.0045 }); mtb.build(mt); mb.build(model);
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), new THREE.MeshBasicMaterial({ map: plaqueTex() })); plq.position.set(0, 0.022, 0.214); model.add(plq);
  sp.push({ s: sparkles(model, 7, [0, 0.12, 0], 0.22, 0.42, 0.22, 33, 0.07), k: 1 });
  // table dressing: blueprint + secret file at the head, blotters, papers, glasses, carafe, ashtrays, cigar box, roses
  const sheet = (w: number, d: number, x: number, z: number, yaw: number, tex: THREE.Texture, y = TY + 0.002) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), lam("lysSheet" + tex.uuid, () => ({ map: tex }))); m.position.set(x, y, z); m.rotation.y = yaw; m.receiveShadow = true; root.add(m); return m; };
  sheet(0.56, 0.4, -0.12, -1.28, 0.06, blueprintTex());
  sheet(0.22, 0.29, -0.4, -1.25, -0.25, docTex("secret", "LA TOUR", { stamp: "CONFIDENTIEL" }), TY + 0.004);
  for (let i = 0; i < 3; i++) b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12).rotateZ(Math.PI / 2).rotateY(0.15 * i).translate(0.38, TY + 0.03 + (i === 2 ? 0.05 : 0), -1.3 + i * 0.065 - (i === 2 ? 0.03 : 0)), lam("lysRoll" + (i % 2), () => ({ color: i % 2 ? "#dfe8f6" : "#f2e6c8" })));
  seg(b, V(-0.15, TY + 0.012, -1.42), V(0.42, TY + 0.012, -1.1), 0.006, lam("lysPointer", () => ({ color: "#3a2216" })), 6);
  const blotter = lam("lysBlotter", () => ({ color: "#2f5a46" }));
  const stir: THREE.Mesh[] = [];
  chairZ.forEach((z, i) => {
    for (const s of [-1, 1]) {
      b.add(boxGeo(V(s * 0.38 - 0.13, TY, z - 0.18), V(s * 0.38 + 0.13, TY + 0.008, z + 0.18)), blotter);
      const p = sheet(0.19, 0.25, s * 0.37, z - 0.02, s * 0.12 + (i - 1) * 0.05, docTex("d" + i + s, "CONTRAT", { lines: 7 }), TY + 0.011);
      if (i === 0 && s > 0) stir.push(p);
      wineGlass(root, [s * 0.5, TY, z + 0.24], i % 2 ? "#7a1a2a" : "#f0d070", i % 2 === 0);
      seg(b, V(s * 0.3, TY + 0.012, z + 0.12), V(s * 0.22, TY + 0.012, z - 0.06), 0.006, lam("lysPen", () => ({ color: "#1a1a28" })), 6);
    }
  });
  stir.forEach((p) => { const g = new THREE.Group(); g.position.copy(p.position); g.rotation.y = p.rotation.y; root.add(g); p.position.set(0, 0, 0); p.rotation.set(0, 0, 0); p.geometry.translate(0, 0, -0.125); g.add(p); g.position.z += 0.125; p.userData.pivot = g; });
  // carafe + roses (low centrepiece) + bell
  b.add(lathe([[0, 0], [0.07, 0.005], [0.085, 0.08], [0.05, 0.2], [0.03, 0.26], [0.04, 0.29], [0, 0.29]], 18).translate(-0.18, TY, 0.75), glassM());
  b.add(lathe([[0, 0], [0.1, 0], [0.12, 0.06], [0.09, 0.1], [0, 0.1]], 20).translate(0, TY, 0.45), silver);
  const roseCols = ["#d8344a", "#f2eedc", "#e86a80", "#c81e3a"];
  for (let i = 0; i < 16; i++) { const a = i * 2.4, d = 0.03 + (i % 5) * 0.022; b.add(new THREE.IcosahedronGeometry(0.035, 1).translate(Math.cos(a) * d, TY + 0.13 + (i % 3) * 0.02, 0.45 + Math.sin(a) * d), lam("lysRose" + (i % 4), () => ({ color: roseCols[i % 4] }))); }
  for (let i = 0; i < 10; i++) { const a = i * 0.63; b.add(new THREE.SphereGeometry(0.04, 6, 4).scale(1.6, 0.3, 0.8).rotateY(-a).translate(Math.cos(a) * 0.13, TY + 0.1, 0.45 + Math.sin(a) * 0.13), lam("lysLeaf", () => ({ color: "#3f7a3a" }))); }
  b.add(lathe([[0, 0], [0.04, 0], [0.04, 0.01], [0.03, 0.04], [0.006, 0.055], [0.006, 0.07], [0, 0.07]], 14).translate(-0.3, TY, -0.75), brass);
  // ashtrays with resting cigars + smoke
  const smoke: THREE.Sprite[] = [];
  for (const [x, z] of [[0.25, 0.75], [-0.3, -0.3], [0.05, 1.68]]) {
    b.add(lathe([[0, 0], [0.065, 0], [0.07, 0.02], [0.055, 0.025], [0.045, 0.012], [0, 0.012]], 18).translate(x, TY, z), glassM());
    seg(b, V(x + 0.01, TY + 0.025, z), V(x + 0.12, TY + 0.03, z + 0.05), 0.009, lam("lysCigar", () => ({ color: "#6a3e22" })), 8);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.8, 0.3) })); tip.position.set(x + 0.122, TY + 0.03, z + 0.051); tip.layers.set(NOINK); root.add(tip);
    for (let k = 0; k < 4; k++) smoke.push(puff(root, [x + 0.12, TY + 0.05, z + 0.05], 0.12, "#e8e2ee", 0.38));
  }
  // cigar box (open) with label inside the lid
  const cbx = new THREE.Group(); cbx.position.set(-0.3, TY, 0.95); cbx.rotation.y = 0.2; root.add(cbx);
  const cbb = new Batch();
  const cw = mahog;
  cbb.add(boxGeo(V(-0.13, 0, -0.085), V(0.13, 0.01, 0.085)), cw);
  for (const [a, c2] of [[V(-0.13, 0, -0.085), V(0.13, 0.065, -0.075)], [V(-0.13, 0, 0.075), V(0.13, 0.065, 0.085)], [V(-0.13, 0, -0.085), V(-0.12, 0.065, 0.085)], [V(0.12, 0, -0.085), V(0.13, 0.065, 0.085)]] as [THREE.Vector3, THREE.Vector3][]) cbb.add(boxGeo(a, c2), cw);
  for (let i = 0; i < 6; i++) { cbb.add(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 10).rotateZ(Math.PI / 2).translate(0, 0.05, -0.06 + i * 0.024), lam("lysCigar", () => ({ color: "#6a3e22" }))); cbb.add(new THREE.CylinderGeometry(0.0115, 0.0115, 0.02, 10).rotateZ(Math.PI / 2).translate(-0.06, 0.05, -0.06 + i * 0.024), gold); }
  cbb.build(cbx);
  const lid = new THREE.Group(); lid.position.set(0, 0.065, -0.085); lid.rotation.x = -1.95; cbx.add(lid);
  const lb2 = new Batch(); lb2.add(boxGeo(V(-0.13, 0, 0), V(0.13, 0.01, 0.17)), cw); lb2.build(lid);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: cigarLabelTex(), color: new THREE.Color(0.9, 0.85, 0.8) })); lbl.position.set(0, -0.002, 0.085); lbl.rotation.z = Math.PI; lid.add(lbl);

  // ---- sideboard + mirror (waiter's bar), left wall ----
  const SB = { x0: X0, x1: X0 + 0.55, z0: 0.6, z1: 2.8, y: 0.95 };
  b.add(boxGeo(V(SB.x0, 0.12, SB.z0), V(SB.x1, SB.y - 0.04, SB.z1)), mahog);
  b.add(boxGeo(V(SB.x0, SB.y - 0.04, SB.z0 - 0.04), V(SB.x1 + 0.04, SB.y, SB.z1 + 0.04)), marbleRed);
  for (let i = 0; i < 3; i++) { const z0 = SB.z0 + 0.08 + i * 0.7; b.add(boxGeo(V(SB.x1, 0.22, z0), V(SB.x1 + 0.015, SB.y - 0.12, z0 + 0.58)), gold); b.add(boxGeo(V(SB.x1 + 0.005, 0.26, z0 + 0.04), V(SB.x1 + 0.02, SB.y - 0.16, z0 + 0.54)), mahog); b.add(new THREE.SphereGeometry(0.02, 8, 6).translate(SB.x1 + 0.03, 0.55, z0 + 0.29), gold); }
  for (const z of [SB.z0 + 0.06, SB.z1 - 0.06]) b.add(lathe([[0.03, 0], [0.04, 0.06], [0.03, 0.12], [0, 0.12]], 10).translate(SB.x1 - 0.08, 0, z), gold);
  const urn = new THREE.Group(); urn.position.set(SB.x0 + 0.27, SB.y, 2.45); root.add(urn);
  const ub = new Batch(); ub.add(lathe([[0, 0], [0.09, 0], [0.06, 0.04], [0.06, 0.08], [0.12, 0.16], [0.13, 0.3], [0.09, 0.38], [0.05, 0.4], [0.06, 0.44], [0, 0.46]], 20), silver);
  ub.add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8).rotateZ(Math.PI / 2).translate(0.15, 0.12, 0), silver); ub.add(new THREE.SphereGeometry(0.025, 8, 6).translate(0, 0.48, 0), gold); ub.build(urn);
  const steam = [0, 1, 2].map(() => puff(root, [SB.x0 + 0.27, SB.y + 0.5, 2.45], 0.16, "#f2f0f6", 0.45));
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 28).translate(SB.x0 + 0.28, SB.y + 0.008, 1.75), silver);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; wineGlass(root, [SB.x0 + 0.28 + Math.cos(a) * 0.12, SB.y + 0.015, 1.75 + Math.sin(a) * 0.12], null, i % 2 === 0); }
  bottle(b, SB.x0 + 0.2, SB.y, 1.15, 0.32, "#2f5a34"); bottle(b, SB.x0 + 0.3, SB.y, 1.28, 0.28, "#8a4a1a"); bottle(b, SB.x0 + 0.18, SB.y, 1.38, 0.3, "#6a1a2a"); bottle(b, SB.x0 + 0.34, SB.y, 1.02, 0.26, "#cfd8d0", "#c8262e");
  b.add(lathe([[0, 0], [0.08, 0], [0.11, 0.2], [0.1, 0.22], [0, 0.22]], 18).translate(SB.x0 + 0.27, SB.y, 2.05), silver);
  b.add(lathe([[0, 0], [0.035, 0], [0.036, 0.16], [0.012, 0.24], [0, 0.24]], 12).rotateZ(0.25).translate(SB.x0 + 0.27, SB.y + 0.08, 2.05), lamCustom("lysBottle#2f5a34", () => twoTone(new THREE.MeshPhongMaterial({ color: "#2f5a34", specular: "#ffffff", shininess: 90 }))));
  b.add(lathe([[0, 0], [0.12, 0.0], [0.14, 0.06], [0, 0.06]], 18).translate(SB.x0 + 0.28, SB.y, 0.82), silver);
  for (let i = 0; i < 7; i++) b.add(new THREE.SphereGeometry(0.04, 10, 8).translate(SB.x0 + 0.28 + Math.cos(i) * 0.06 * (i % 3), SB.y + 0.08 + (i > 4 ? 0.05 : 0), 0.82 + Math.sin(i) * 0.06 * (i % 3)), lam("lysOrange", () => ({ color: "#f08a2a" })));
  // mirror above the sideboard
  const mirror = (x: number, z0: number, z1: number, y0: number, y1: number, face: number) => {
    const mg = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), mirrorM); mg.position.set(x + face * 0.03, (y0 + y1) / 2, (z0 + z1) / 2); mg.rotation.y = face * Math.PI / 2; root.add(mg);
    const fx = face > 0 ? x : x - 0.07, fx1 = face > 0 ? x + 0.07 : x;
    b.add(boxGeo(V(fx, y0 - 0.1, z0 - 0.1), V(fx1, y0, z1 + 0.1)), gold); b.add(boxGeo(V(fx, y1, z0 - 0.1), V(fx1, y1 + 0.12, z1 + 0.1)), gold);
    b.add(boxGeo(V(fx, y0, z0 - 0.1), V(fx1, y1, z0)), gold); b.add(boxGeo(V(fx, y0, z1), V(fx1, y1, z1 + 0.1)), gold);
    b.add(new THREE.TorusGeometry(0.28, 0.05, 6, 20, Math.PI).rotateY(Math.PI / 2).translate(x + face * 0.03, y1 + 0.12, (z0 + z1) / 2), gold);
    b.add(new THREE.SphereGeometry(0.07, 10, 8).translate(x + face * 0.04, y1 + 0.42, (z0 + z1) / 2), gold);
  };
  mirror(X0, SB.z0 + 0.15, SB.z1 - 0.15, 1.35, 3.7, 1);
  // sideboard lamp (on at night)
  const lampDef = (x: number, y: number, z: number, I: number) => {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const lb = new Batch(); lb.add(lathe([[0, 0], [0.08, 0], [0.09, 0.03], [0.05, 0.08], [0.09, 0.2], [0.06, 0.32], [0.015, 0.36], [0.015, 0.42], [0, 0.42]], 16), lamCustom("lysPorcelain", () => twoTone(new THREE.MeshPhongMaterial({ color: "#2a4a8a", specular: "#ffffff", shininess: 80 })))); lb.build(g);
    const shadeM = new THREE.MeshLambertMaterial({ color: "#f3e2c0", emissive: new THREE.Color("#ffb860"), emissiveIntensity: 0, side: THREE.DoubleSide }); twoTone(shadeM);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.22, 20, 1, true).translate(0, 0.5, 0), shadeM); g.add(shade);
    const L = new THREE.PointLight("#ffb866", 0, 4.5, 1.3); L.position.set(0, 0.42, 0); g.add(L);
    const gl = glow(g, [0, 0.45, 0], "#ffc070", 1.1, 1);
    return { set: (k: number) => { L.intensity = I * k; shadeM.emissiveIntensity = 0.9 * k; gl.material.opacity = k; } };
  };
  const lamps = [lampDef(SB.x0 + 0.27, SB.y, 0.95, 5)];

  // ---- grand piano, back-left corner (keyboard faces +x) ----
  const pno = new THREE.Group(); pno.position.set(-2.45, 0, -1.85); pno.rotation.y = Math.PI / 2; root.add(pno);
  const ps = new THREE.Shape(); ps.moveTo(0, 0); ps.lineTo(1.45, 0); ps.lineTo(1.45, 0.4); ps.bezierCurveTo(1.45, 0.9, 0.78, 0.9, 0.72, 1.4); ps.bezierCurveTo(0.66, 1.85, 0.3, 1.97, 0.1, 1.86); ps.lineTo(0, 1.7); ps.closePath();
  const pb = new Batch();
  pb.add(new THREE.ExtrudeGeometry(ps, { depth: 0.3, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2).translate(0, 0.6, 0), lacq);
  pb.add(new THREE.ExtrudeGeometry(ps, { depth: 0.012, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2).scale(0.97, 1, 0.97).translate(0.02, 0.86, -0.02), lam("lysPianoIn", () => ({ color: "#c8964a" })));
  pb.add(boxGeo(V(0.0, 0.62, 0), V(1.45, 0.72, 0.26)), lacq); pb.add(boxGeo(V(0.0, 0.72, 0.0), V(0.06, 0.86, 0.26)), lacq); pb.add(boxGeo(V(1.39, 0.72, 0.0), V(1.45, 0.86, 0.26)), lacq);
  pb.add(boxGeo(V(0.06, 0.72, 0.02), V(1.39, 0.745, 0.22)), lam("lysKeysM", () => ({ map: keysTex() })));
  pb.add(boxGeo(V(0.06, 0.745, -0.02), V(1.39, 0.86, 0.04)), lacq);
  for (const [x, z] of [[0.12, 0.12], [1.33, 0.12], [0.4, -1.65]]) pb.add(lathe([[0.05, 0], [0.06, 0.05], [0.04, 0.2], [0.07, 0.45], [0.08, 0.6], [0, 0.6]], 12).translate(x, 0, z), lacq);
  pb.add(boxGeo(V(0.62, 0.0, -0.25), V(0.82, 0.62, -0.2)), lacq); for (let i = 0; i < 3; i++) pb.add(boxGeo(V(0.64 + i * 0.06, 0.05, -0.2), V(0.68 + i * 0.06, 0.07, -0.08)), gold);
  pb.add(new THREE.BoxGeometry(0.7, 0.24, 0.015).rotateX(-0.25).translate(0.73, 0.98, -0.06), lacq);
  pb.build(pno);
  const music = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), lam("lysSheetM", () => ({ map: sheetTex() }))); music.position.set(0.73, 1.0, -0.045); music.rotation.x = -0.25; pno.add(music);
  const lidG = new THREE.Group(); lidG.position.set(0, 0.905, 0); lidG.rotation.z = 0.62; pno.add(lidG);
  const lidB = new Batch(); lidB.add(new THREE.ExtrudeGeometry(ps, { depth: 0.025, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2), lacq); lidB.build(lidG);
  seg(b, V(-2.45 - 0.95, 0.9, -1.85 - 1.2), V(-2.45 - 0.95, 1.62, -1.85 - 1.2 + 0.0), 0.012, lacq, 6);
  const bench = new Batch(); bench.add(boxGeo(V(-2.0, 0.42, -2.95), V(-1.7, 0.5, -2.15)), lacq); bench.add(new RoundedBoxGeometry(0.3, 0.06, 0.8, 2, 0.02).translate(-1.85, 0.53, -2.55), cushion);
  for (const [x, z] of [[-1.97, -2.92], [-1.73, -2.92], [-1.97, -2.18], [-1.73, -2.18]]) bench.add(lathe([[0.02, 0], [0.03, 0.2], [0.025, 0.42], [0, 0.42]], 8).translate(x, 0, z), lacq);
  bench.build(root);
  // candelabra on the piano
  const candles: THREE.Object3D[] = [];

  // ---- fireplace + trumeau mirror + mantel clock (right wall) ----
  const FZ0 = 0.3, FZ1 = 2.1, FX = X1;
  b.add(boxGeo(V(FX - 0.38, 0, FZ0), V(FX, 1.15, FZ0 + 0.4)), marbleRed); b.add(boxGeo(V(FX - 0.38, 0, FZ1 - 0.4), V(FX, 1.15, FZ1)), marbleRed);
  b.add(boxGeo(V(FX - 0.38, 0.85, FZ0 + 0.4), V(FX, 1.15, FZ1 - 0.4)), marbleRed);
  b.add(boxGeo(V(FX - 0.48, 1.15, FZ0 - 0.1), V(FX, 1.24, FZ1 + 0.1)), marbleRed);
  b.add(boxGeo(V(FX - 0.5, 1.12, FZ0 - 0.08), V(FX - 0.46, 1.15, FZ1 + 0.08)), gold);
  b.add(boxGeo(V(FX - 0.1, 0, FZ0 + 0.4), V(FX, 0.85, FZ1 - 0.4)), basicNo("#1a1014"));
  b.add(boxGeo(V(FX - 0.38, 0, FZ0 + 0.4), V(FX - 0.3, 0.85, FZ0 + 0.42)), basicNo("#2a1a1a")); b.add(boxGeo(V(FX - 0.38, 0, FZ1 - 0.42), V(FX - 0.3, 0.85, FZ1 - 0.4)), basicNo("#2a1a1a"));
  b.add(boxGeo(V(FX - 0.5, 0, FZ0 - 0.05), V(FX - 0.38, 0.02, FZ1 + 0.05)), marbleRed);
  for (let i = 0; i < 3; i++) b.add(new THREE.CylinderGeometry(0.05, 0.055, 0.6, 10).rotateX(Math.PI / 2).rotateY(0.3 * (i - 1)).translate(FX - 0.2, 0.08 + (i === 1 ? 0.08 : 0), 1.2 + (i - 1) * 0.08), lam("lysLog", () => ({ color: "#6a4228" })));
  for (const z of [FZ0 + 0.55, FZ1 - 0.55]) { seg(b, V(FX - 0.42, 0, z), V(FX - 0.42, 0.28, z), 0.018, brass, 6); b.add(new THREE.SphereGeometry(0.04, 10, 8).translate(FX - 0.42, 0.3, z), brass); }
  b.add(boxGeo(V(FX - 0.46, 0.02, FZ0 + 0.42), V(FX - 0.44, 0.14, FZ1 - 0.42)), brass);
  const fire = new THREE.Group(); root.add(fire); flame(fire, [FX - 0.2, 0.14, 1.2], 0.35, "#ff8a30", 6, 4.5);
  const embers = glow(root, [FX - 0.2, 0.2, 1.2], "#ff6a20", 1.2, 0.8);
  mirror(X1, FZ0 + 0.1, FZ1 - 0.1, 1.5, 3.9, -1);
  const clk = new THREE.Group(); clk.position.set(FX - 0.3, 1.24, 1.2); clk.rotation.y = -Math.PI / 2; root.add(clk);
  const clb = new Batch(); clb.add(boxGeo(V(-0.18, 0, -0.07), V(0.18, 0.05, 0.07)), gold); clb.add(new RoundedBoxGeometry(0.26, 0.3, 0.12, 2, 0.04).translate(0, 0.2, 0), gold); clb.add(new THREE.SphereGeometry(0.1, 14, 8, 0, TAU, 0, Math.PI / 2).translate(0, 0.35, 0), gold); clb.add(new THREE.SphereGeometry(0.03, 8, 6).translate(0, 0.47, 0), gold); clb.build(clk);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.09, 28), new THREE.MeshBasicMaterial({ map: dialTex("mantel"), color: new THREE.Color(0.95, 0.92, 0.85) })); dial.position.set(0, 0.2, 0.061); clk.add(dial);
  const dialG = new THREE.Group(); dialG.position.set(0, 0.2, 0.062); clk.add(dialG);
  const setClock = clockHands(dialG, 0.085, 0.002);
  for (const z of [FZ0 + 0.05, FZ1 - 0.05]) {
    const cg = new THREE.Group(); cg.position.set(FX - 0.28, 1.24, z); root.add(cg);
    const cbt = new Batch(); cbt.add(lathe([[0, 0], [0.07, 0], [0.04, 0.05], [0.02, 0.3], [0, 0.3]], 12), gold); for (const s of [-1, 1]) seg(cbt, V(0, 0.26, 0), V(0, 0.32, s * 0.12), 0.01, gold, 5); cbt.build(cg);
    for (const s of [-1, 0, 1]) candles.push(candleLite(cg, [0, s === 0 ? 0.3 : 0.32, s * 0.12]));
  }
  // ---- whisper corner: gueridon + table lamp + bergère + lamp pool ----
  const gue = new THREE.Group(); gue.position.set(3.78, 0, -3.62); root.add(gue);
  const gb = new Batch(); gb.add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 28).translate(0, 0.72, 0), marbleW); gb.add(new THREE.TorusGeometry(0.32, 0.015, 6, 28).rotateX(Math.PI / 2).translate(0, 0.72, 0), gold);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; seg(gb, V(Math.cos(a) * 0.05, 0.7, Math.sin(a) * 0.05), V(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26), 0.016, gold, 6); }
  gb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 20).translate(0, 0.3, 0), gold); gb.build(gue);
  lamps.push(lampDef(3.78, 0.74, -3.62, 9));
  book(root, [3.62, 0.74, -3.48], "#2f4a7a"); book(root, [3.64, 0.775, -3.5], "#8a2a2a");
  const ber = new THREE.Group(); ber.position.set(4.1, 0, -2.2); ber.rotation.y = -Math.PI / 2 - 0.4; root.add(ber);
  const brb = new Batch(); brb.add(new RoundedBoxGeometry(0.7, 0.18, 0.62, 3, 0.06).translate(0, 0.42, 0), cushion); brb.add(new RoundedBoxGeometry(0.7, 0.62, 0.14, 3, 0.06).translate(0, 0.8, -0.26), cushion);
  for (const s of [-1, 1]) brb.add(new RoundedBoxGeometry(0.12, 0.3, 0.6, 2, 0.05).translate(s * 0.33, 0.6, 0), cushion);
  brb.add(boxGeo(V(-0.37, 0.28, -0.33), V(0.37, 0.34, 0.33)), gold); for (const [x, z] of [[-0.3, 0.27], [0.3, 0.27], [-0.3, -0.27], [0.3, -0.27]]) brb.add(lathe([[0.015, 0], [0.03, 0.15], [0.03, 0.29], [0, 0.29]], 8).translate(x, 0, z), gold);
  brb.build(ber);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: patchTex, color: new THREE.Color("#ffb060").multiplyScalar(0.7), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.position.set(3.2, 0.014, -3.05); pool.layers.set(NOINK); root.add(pool);

  // ---- potted palms ----
  const palms = [[-1.75, -3.72, 1], [1.75, -3.72, 2], [-1.62, 5.12, 3], [1.62, 5.12, 4]].map(([x, z, s]) => {
    b.add(lathe([[0, 0], [0.2, 0], [0.24, 0.08], [0.3, 0.45], [0.33, 0.55], [0, 0.55]], 22).translate(x, 0, z), marbleGreen);
    b.add(new THREE.TorusGeometry(0.32, 0.025, 6, 22).rotateX(Math.PI / 2).translate(x, 0.55, z), gold);
    b.add(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 20).translate(x, 0.53, z), lam("lysSoil", () => ({ color: "#4a3426" })));
    const g = new THREE.Group(); g.position.set(x, 0.52, z); g.scale.setScalar(0.5); root.add(g);
    const pm = palm(g, [0, 0, 0], 1.9, [0.15 * (x < 0 ? 1 : -1), 0.08], s, "#3f8a3a");
    const nuts: THREE.Object3D[] = []; pm.g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry instanceof THREE.SphereGeometry) nuts.push(m); }); nuts.forEach((n) => n.removeFromParent());
    return pm;
  });

  // ---- sconces + paintings ----
  const sconces: THREE.Object3D[] = [];
  const sconce = (x: number, y: number, z: number, nx: number, nz: number) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(nx, nz); root.add(g);
    const sb = new Batch(); sb.add(new THREE.SphereGeometry(0.1, 10, 8).scale(0.6, 1.4, 0.3), gold);
    for (const s of [-1, 1]) { seg(sb, V(0, -0.05, 0.02), V(s * 0.16, 0.0, 0.14), 0.012, gold, 6); sb.add(lathe([[0, 0], [0.035, 0.005], [0.035, 0.03], [0, 0.03]], 10).translate(s * 0.16, 0.0, 0.14), gold); sb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8).translate(s * 0.16, 0.07, 0.14), lam("lysWax", () => ({ color: "#fbf3e2" }))); }
    sb.build(g);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 1.6, 1), bulbM); m.position.set(s * 0.16, 0.13, 0.14); m.layers.set(NOINK); g.add(m); glow(g, [s * 0.16, 0.13, 0.14], "#ffd08a", 0.5, 0.8); }
    const L = new THREE.PointLight("#ffcf8a", 3.5, 4, 1.3); L.position.set(0, 0.1, 0.3); g.add(L); sconces.push(g);
  };
  for (const z of [-2.5, 4.55]) { sconce(X0 + 0.02, 2.5, z, 1, 0); sconce(X1 - 0.02, 2.5, z, -1, 0); }
  for (const x of [-3.0, 3.0]) sconce(x, 2.5, ZF - 0.02, 0, -1);
  const painting = (tex: THREE.Texture, w: number, h: number, pos: V3, nx: number, nz: number) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = Math.atan2(nx, nz); root.add(g);
    const pb2 = new Batch(); const t = 0.09;
    pb2.add(boxGeo(V(-w / 2 - t, -h / 2 - t, 0), V(w / 2 + t, -h / 2, 0.08)), gold); pb2.add(boxGeo(V(-w / 2 - t, h / 2, 0), V(w / 2 + t, h / 2 + t, 0.08)), gold);
    pb2.add(boxGeo(V(-w / 2 - t, -h / 2, 0), V(-w / 2, h / 2, 0.08)), gold); pb2.add(boxGeo(V(w / 2, -h / 2, 0), V(w / 2 + t, h / 2, 0.08)), gold); pb2.build(g);
    const cv = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam("lysCanvas" + tex.uuid, () => ({ map: tex }))); cv.position.z = 0.03; g.add(cv);
  };
  painting(seineTex(), 1.9, 1.34, [X0 + 0.02, 2.75, -2.55], 1, 0);
  painting(flowersTex(), 0.95, 1.2, [X1 - 0.02, 2.6, -2.75], -1, 0);
  painting(hallTex(), 1.3, 0.96, [X0 + 0.02, 2.6, 4.55 - 0.0001], 1, 0);
  painting(seineTex(), 1.5, 1.05, [-3.0, 3.6, ZF - 0.02], 0, -1); painting(flowersTex(), 1.0, 1.25, [3.0, 3.65, ZF - 0.02], 0, -1);

  // ---- double doors + cartouche + corridor ----
  const doorM = lam("lysDoor", () => ({ color: "#f3e8d0" }));
  const glassD = new THREE.MeshBasicMaterial({ map: doorGlassTex(), color: new THREE.Color(1.0, 0.95, 0.85), transparent: true, opacity: 0.88 });
  const leaf = (hx: number, s: number) => {
    const g = new THREE.Group(); g.position.set(hx, 0, ZF + 0.12); root.add(g);
    const lb = new Batch(), x0 = s > 0 ? 0 : -DW, x1 = s > 0 ? DW : 0;
    lb.add(boxGeo(V(x0, 0, -0.03), V(x1, 0.12, 0.03)), doorM); lb.add(boxGeo(V(x0, DH - 0.12, -0.03), V(x1, DH, 0.03)), doorM);
    lb.add(boxGeo(V(x0, 0, -0.03), V(x0 + 0.12, DH, 0.03)), doorM); lb.add(boxGeo(V(x1 - 0.12, 0, -0.03), V(x1, DH, 0.03)), doorM);
    lb.add(boxGeo(V(x0 + 0.12, 0.12, -0.02), V(x1 - 0.12, 1.1, 0.02)), doorM); lb.add(boxGeo(V(x0, 1.1, -0.03), V(x1, 1.22, 0.03)), doorM);
    lb.add(boxGeo(V(x0 + 0.2, 0.25, -0.035), V(x1 - 0.2, 0.28, -0.025)), gold); lb.add(boxGeo(V(x0 + 0.2, 0.95, -0.035), V(x1 - 0.2, 0.98, -0.025)), gold);
    lb.add(boxGeo(V(x0 + 0.2, 0.25, -0.035), V(x0 + 0.23, 0.98, -0.025)), gold); lb.add(boxGeo(V(x1 - 0.23, 0.25, -0.035), V(x1 - 0.2, 0.98, -0.025)), gold);
    const hxl = s > 0 ? x1 - 0.1 : x0 + 0.1; lb.add(boxGeo(V(hxl - 0.02, 1.0, -0.06), V(hxl + 0.02, 1.25, -0.03)), gold); lb.add(new THREE.SphereGeometry(0.035, 8, 6).translate(hxl, 1.08, -0.08), gold);
    lb.build(g);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(DW - 0.24, DH - 1.34), glassD); gl.position.set((x0 + x1) / 2, (1.22 + DH - 0.12) / 2, 0); g.add(gl);
    return g;
  };
  const doorL = leaf(-DW, 1), doorR = leaf(DW, -1);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * (DW + 0.08) - 0.1, 0, ZF - 0.06), V(s * (DW + 0.08) + 0.1, DH + 0.1, ZF)), gold);
  b.add(boxGeo(V(-DW - 0.18, DH, ZF - 0.08), V(DW + 0.18, DH + 0.18, ZF)), gold);
  const cart = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.62), new THREE.MeshBasicMaterial({ map: cartoucheTex(), color: new THREE.Color(0.95, 0.92, 0.88) })); cart.position.set(0, DH + 0.62, ZF - 0.05); cart.rotation.y = Math.PI; root.add(cart);
  b.add(boxGeo(V(-1.12, DH + 0.27, ZF - 0.05), V(1.12, DH + 0.31, ZF)), gold); b.add(boxGeo(V(-1.12, DH + 0.93, ZF - 0.05), V(1.12, DH + 0.97, ZF)), gold);
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: ctex("lysCrest", 128, 128, (g) => { g.fillStyle = GOLD; drawLys(g, 64, 66, 1.05); }), transparent: true, alphaTest: 0.5 })); crest.position.set(0, DH + 1.25, ZF - 0.04); crest.rotation.y = Math.PI; root.add(crest);
  // corridor behind the doors (warm, deep)
  const CZ1 = ZF + WT + 4.2;
  shell.add(quad(V(-2, 0, CZ1), V(2, 0, CZ1), V(2, 0, ZF + WT), V(-2, 0, ZF + WT), 4 / 2.4, 4.2 / 2.4), floorM);
  b.add(boxGeo(V(-0.7, 0, ZF + WT), V(0.7, 0.01, CZ1)), lam("lysRunner", () => ({ color: "#9a2232" })));
  shell.add(quad(V(-2, 0, ZF + WT), V(-2, 0, CZ1), V(-2, 4, CZ1), V(-2, 4, ZF + WT), 2.1, 4 / H), silkM);
  shell.add(quad(V(2, 0, CZ1), V(2, 0, ZF + WT), V(2, 4, ZF + WT), V(2, 4, CZ1), 2.1, 4 / H), silkM);
  shell.add(quad(V(2, 0, CZ1), V(-2, 0, CZ1), V(-2, 4, CZ1), V(2, 4, CZ1), 2, 4 / H), silkM);
  shell.add(quad(V(-2, 4, ZF + WT), V(2, 4, ZF + WT), V(2, 4, CZ1), V(-2, 4, CZ1), 1, 1), creamM);
  painting(hallTex(), 1.4, 1.0, [0, 2.1, CZ1 - 0.02], 0, -1);
  b.add(boxGeo(V(-0.8, 0.85, CZ1 - 0.45), V(0.8, 0.9, CZ1)), marbleRed); for (const x of [-0.7, 0.7]) b.add(lathe([[0.03, 0], [0.05, 0.4], [0.03, 0.85], [0, 0.85]], 10).translate(x, 0, CZ1 - 0.3), gold);
  b.add(lathe([[0, 0], [0.1, 0], [0.13, 0.15], [0.08, 0.3], [0, 0.3]], 16).translate(0, 0.9, CZ1 - 0.22), lamCustom("lysPorcelain", () => twoTone(new THREE.MeshPhongMaterial({ color: "#2a4a8a", specular: "#ffffff", shininess: 80 }))));
  for (let i = 0; i < 9; i++) b.add(new THREE.IcosahedronGeometry(0.06, 1).translate(Math.cos(i * 2.4) * 0.1 * (i % 3), 1.3 + (i % 3) * 0.06, CZ1 - 0.22 + Math.sin(i * 2.4) * 0.1 * (i % 3)), lam("lysRose" + (i % 4), () => ({ color: roseCols[i % 4] })));
  const hallL = new THREE.PointLight("#ffc880", 9, 7, 1.2); hallL.position.set(0, 3.2, ZF + 2.4); root.add(hallL);
  for (const x of [-1.98, 1.98]) { const gS = glow(root, [x * 0.99, 2.6, ZF + 2.4], "#ffc880", 0.9, 0.9); void gS; }

  shell.build(root, false); b.build(root);

  // ---- marks + cams ----
  const marks: Record<string, V3> = {
    head: [0, 0, -2.3],                      // Lustig presenting at the head of the table (window + tower behind him)
    dealer1: [-1.62, 0, -0.85], dealer2: [1.62, 0, -0.85], dealer3: [-1.62, 0, 0.75], dealer4: [1.62, 0, 0.75], dealer5: [0, 0, 2.55],
    door: [0, 0, 4.85], hall: [0, 0, 7.2],   // just inside the double doors / out in the corridor (arrivals start)
    waiter: [-3.5, 0, 1.75],                 // at the sideboard (faces the room)
    pianist: [-1.55, 0, -2.55],              // at the piano bench (camera side of the bench)
    whisperA: [2.45, 0, -2.95], whisperB: [3.2, 0, -2.8], // the window corner, night (0.75 m apart)
    curtain: [1.45, 0, -3.45],               // by the cord of the main window
    model: [MX, TY + 0.055, MZ], tableTop: [0, TY, 0.2], window: [0, 1.8, ZB],
  };
  const cams: SetDef["cams"] = {
    wide: { pos: [2.75, 2.85, 5.05], look: [-0.35, 1.35, -2.4], fov: 44 },
    table: { pos: [-0.35, 1.95, 1.75], look: [0.05, 1.3, -2.2], fov: 38 },
    low: { pos: [1.45, 0.5, -0.85], look: [0.05, 1.5, -2.35], fov: 42 },
    high: { pos: [1.7, 4.4, 2.9], look: [0.0, 0.6, -0.5], fov: 42 },
    whisper: { pos: [3.05, 1.55, 0.4], look: [2.92, 1.38, -3.0], fov: 34 },
    doors: { pos: [0.55, 1.75, -1.7], look: [0.0, 1.35, 4.6], fov: 40 },
    model: { pos: [0.62, 1.12, -0.35], look: [0.3, 1.0, -0.95], fov: 38 },
  };
  return {
    name: "hotel", root, marks, cams,
    pose: (t, c) => {
      const cur = sm(cl(c.curtain ?? 0)), night = cl(c.night ?? 0), doors = sm(cl(c.doors ?? 0)), day = 1 - night;
      curtL.set(lerp(0.62, 1.5, cur), t); curtR.set(lerp(0.62, 1.5, cur), t + 0.4);
      sideCurts.forEach((s, i) => s.set(0.6, t + i));
      doorL.rotation.y = -doors * 1.5; doorR.rotation.y = doors * 1.5;
      // backdrop day <-> night
      for (const { m, d, n } of bdM) m.color.copy(d).lerp(n, night);
      (skyD.material as THREE.MeshBasicMaterial).opacity = 1 - night * 0.999; (skyN.material as THREE.MeshBasicMaterial).opacity = night;
      moon.material.opacity = night; moonGlow.material.opacity = night * 0.5;
      clouds.forEach((s, i) => { s.position.x = ((-150 + i * 75 + t * (0.6 + i * 0.15) + 200) % 400) - 200; s.material.opacity = day * 0.95; s.material.color.setRGB(lerp(1, 0.35, night), lerp(1, 0.4, night), lerp(1, 0.65, night)); });
      litMats.forEach((m, i) => (m.opacity = night * (0.85 + 0.15 * Math.sin(t * 0.3 + i * 1.7))));
      cityLights.forEach((s, i) => (s.material.opacity = night * (0.75 + 0.25 * Math.sin(t * 2.1 + i * 2.3))));
      towerLights.forEach((s, i) => (s.material.opacity = night * (0.7 + 0.3 * Math.sin(t * 3 + i * 1.1))));
      beaconG.material.opacity = night; (beam.material as THREE.MeshBasicMaterial).opacity = night * 0.5; beamPivot.rotation.y = t * 0.9;
      flockG.visible = night < 0.5; flock(t);
      risePuffs(smokes, t, 4, 0.08, 2.2, 1 - 0.6 * night); smokes.forEach((s) => s.material.color.setRGB(lerp(0.92, 0.35, night), lerp(0.9, 0.38, night), lerp(0.93, 0.55, night)));
      // interior light
      chL.intensity = 30 * lerp(1, 0.4, night); chGlow.material.opacity = 0.6 * lerp(1, 0.6, night); bulbGlows.forEach((g2, i) => (g2.material.opacity = (0.75 + 0.25 * Math.sin(t * 9 + i * 1.3) * Math.sin(t * 4.1 + i)) * lerp(1, 0.7, night)));
      ch.rotation.z = 0.006 * Math.sin(t * 0.7); ch.rotation.x = 0.005 * Math.sin(t * 0.55 + 1); ch.rotation.y = 0.02 * Math.sin(t * 0.25);
      sp.forEach(({ s, k }) => sparkle(s, t, k));
      fillMain.intensity = 22 * (1 - 0.85 * cur) * day; fillRoom.intensity = 16 * (1 - 0.45 * cur) * lerp(1, 0.25, night); fillSide.forEach((l) => (l.intensity = 10 * day));
      moonFill.intensity = 6 * night; (moonShaft.material as THREE.MeshBasicMaterial).opacity = 0.1 * night;
      shafts.forEach((s, i) => ((s.material as THREE.MeshBasicMaterial).opacity = (0.14 + 0.02 * Math.sin(t * 0.6 + i)) * day * (i === 1 ? 1 - cur : 1)));
      patches.forEach((p, i) => ((p.material as THREE.MeshBasicMaterial).opacity = day * (i === 1 ? 1 - cur : 1)));
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.8 * day * (1 - cur); dust.update(t);
      lamps.forEach((l) => l.set(night));
      (pool.material as THREE.MeshBasicMaterial).opacity = night * 0.85;
      flameFlick(fire, t); embers.material.opacity = 0.6 + 0.3 * Math.sin(t * 5.3) * Math.sin(t * 2.1);
      candles.forEach((cd) => flameFlick(cd, t));
      sconces.forEach((g2, i) => { const L = g2.children.find((o) => (o as THREE.PointLight).isPointLight) as THREE.PointLight; L.intensity = 3.5 * (0.92 + 0.08 * Math.sin(t * 7 + i)); });
      setClock(10 + t / 60, t);
      palms.forEach((p) => swayPalm(p, t, 0.6));
      stir.forEach((p, i) => { const g2 = p.userData.pivot as THREE.Group; g2.rotation.x = 0.03 + 0.04 * Math.max(0, Math.sin(t * 1.7 + i)); });
      risePuffs(smoke, t, 0.45, 0.22, 1.6, 0.8); risePuffs(steam, t, 0.35, 0.35, 1.5, 0.9);
    },
  };
};
// candle that is always lit (small, for candelabra)
const candleLite = (parent: THREE.Object3D, pos: V3) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8).translate(0, 0.05, 0), lam("lysWax", () => ({ color: "#fbf3e2" }))); g.add(w);
  const lg = new THREE.Group(); g.add(lg); flame(lg, [0, 0.105, 0], 0.045, "#ffb35a", 0.6, 2);
  g.userData = lg.userData; return g;
};
export const book = (parent: THREE.Object3D, pos: V3, col: string) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.27), lam("lysBook" + col, () => ({ color: col }))); m.position.set(pos[0], pos[1] + 0.0175, pos[2]); m.rotation.y = 0.3; m.castShadow = true; parent.add(m);
  return m;
};
