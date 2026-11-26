// Props, painted boards and ground for "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25, master prompt v28).
// Everything here is original: the bounty shed's boards (price board, PIGS SEEN flip board, BASE HOG CONTROL sign),
// the newspaper, the boars' WANTED poster, the ranger's chalk family tree, hog tails, a reel mower, the padlock + chain,
// a ranch fence with a swinging gate, young corn, a splat-mapped terrain (Poly Haven photo layers) and an instanced herd.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ctex } from "../paint";
import { fitText } from "./portkit_common";
import { phMat, phTexture, phModel, type PhModel, type PhTex } from "../ph";
import { MB, TAU, cl, sm, hsh, col } from "./mailkit";
import { Pen } from "../toon";
import { NOINK } from "../ink";
import { critter68 } from "../critters68";
import type { Look } from "../fig";
import type { V3 } from "./types";
import { PC_A, PC_B, PC_C } from "./pinecards";

export const PAINT = "900 %spx 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const STEN = "900 %spx 'Courier New', 'Arial Black', monospace";

/** a hand-made plank board background (whitewashed or painted), grain + knots + nail heads */
const planksBg = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, base: string, n = 4) => {
  for (let i = 0; i < n; i++) { const y0 = (i * h) / n; g.fillStyle = base; g.fillRect(0, y0, w, h / n); g.fillStyle = `rgba(${i % 2 ? 120 : 90},${i % 2 ? 90 : 70},50,${0.05 + r() * 0.05})`; g.fillRect(0, y0, w, h / n);
    g.fillStyle = "rgba(40,28,18,0.55)"; g.fillRect(0, y0, w, 3); }
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(90,64,40,${0.05 + r() * 0.1})`; g.lineWidth = 1 + r() * 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.33, y + (r() - 0.5) * 8, w * 0.66, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 6); g.stroke(); }
  for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h; g.fillStyle = "rgba(80,50,30,0.25)"; g.beginPath(); g.ellipse(x, y, 7 + r() * 8, 4 + r() * 4, 0, 0, TAU); g.fill(); }
  for (const x of [26, w - 26]) for (let i = 0; i < n; i++) { g.fillStyle = "#3a3a40"; g.beginPath(); g.arc(x, (i + 0.5) * (h / n), 5, 0, TAU); g.fill(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(60,40,20,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 14, 1 + r() * 2); }
};
const brushText = (g: CanvasRenderingContext2D, txt: string, x: number, y: number, maxW: number, size: number, fill: string, r: () => number) => {
  g.fillStyle = fill; const fs = fitText(g, txt, x, y, maxW, size, PAINT);
  // dry-brush streaks across the letters
  g.save(); g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.12})`; g.fillRect(x - maxW / 2 + r() * maxW, y - fs * 0.5 + r() * fs, 6 + r() * 30, 1.5); } g.restore();
  return fs;
};

/** THE PRICE BOARD: "HOG TAILS / 1 TAIL = $40". k 0..1 paints "$50" over the price (white patch 0-0.35, the 5 0.35-0.7, the 0 0.7-1) */
export const priceTex = (k = 0) => { const q = Math.round(cl(k) * 16) / 16; return ctex("pgPrice" + q, 1024, 640, (g, r) => {
  planksBg(g, r, 1024, 640, "#ece4d0", 4);
  g.textAlign = "center"; g.textBaseline = "middle";
  brushText(g, "HOG TAILS", 512, 96, 760, 108, "#2a2420", r);
  brushText(g, "1 TAIL =", 512, 250, 820, 150, "#2a2420", r);
  g.font = PAINT.replace("%s", "250"); const dW = g.measureText("$").width, nW = g.measureText("40").width, x0 = 512 - (dW + nW) / 2;
  g.textAlign = "left"; g.fillStyle = "#c42a22"; g.fillText("$", x0, 460); g.fillText("40", x0 + dW, 460);
  if (q > 0) { // the paint-over: a rough white patch, then a fresh red 5 and 0 (revealed left to right like brush strokes)
    const px = x0 + dW - 14, pw = nW + 34, k1 = cl(q / 0.35);
    g.fillStyle = "#f6f2e6"; for (let i = 0; i < 10; i++) { const yy = 340 + i * 25; g.fillRect(px - 4 + r() * 8, yy, pw * k1 * (0.92 + r() * 0.1), 30); }
    const d5 = g.measureText("5").width;
    const rev = (ch: string, xx: number, kk: number) => { if (kk <= 0) return; g.save(); g.beginPath(); g.rect(xx - 6, 320, (g.measureText(ch).width + 12) * kk, 290); g.clip(); g.fillStyle = "#d8241a"; g.fillText(ch, xx, 462); g.restore(); };
    rev("5", x0 + dW, cl((q - 0.35) / 0.35)); rev("0", x0 + dW + d5, cl((q - 0.7) / 0.3));
    if (q >= 1) { g.fillStyle = "rgba(216,36,26,0.9)"; for (const dx of [40, 150]) { g.beginPath(); g.ellipse(x0 + dW + dx, 590, 5, 11, 0, 0, TAU); g.fill(); } } // two fresh drips
  }
}); };
/** THE PIGS SEEN flip board (n 0..999): green board, stencilled header, three white flip tiles */
export const seenTex = (n: number) => { const v = Math.max(0, Math.min(999, Math.round(n))); return ctex("pgSeen" + v, 512, 400, (g, r) => {
  g.fillStyle = "#2e4a34"; g.fillRect(0, 0, 512, 400); for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * 512, r() * 400, 2 + r() * 18, 1 + r() * 3); }
  g.strokeStyle = "#d8d2c0"; g.lineWidth = 8; g.strokeRect(10, 10, 492, 380);
  g.fillStyle = "#e8c24a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "BASE HOG CONTROL", 256, 44, 420, 40, STEN); g.fillStyle = "#f0ead8"; fitText(g, "PIGS SEEN", 256, 96, 440, 56, STEN);
  const s = String(v).padStart(3, "0");
  for (let i = 0; i < 3; i++) { const x = 46 + i * 144, y = 142; g.fillStyle = "#f4f0e4"; g.fillRect(x, y, 128, 220); g.fillStyle = "#1a1a1e"; g.font = "900 180px 'Arial Black', Arial"; g.fillText(s[i], x + 64, y + 116);
    g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x, y + 108, 128, 4); g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x, y + 112, 128, 108); }
}); };
/** BASE HOG CONTROL sign (olive drab board, stencil) */
export const hogSignTex = () => ctex("pgHogSign", 1024, 256, (g, r) => {
  g.fillStyle = "#59603e"; g.fillRect(0, 0, 1024, 256); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * 1024, r() * 256, 2 + r() * 30, 1 + r() * 2); }
  g.strokeStyle = "#e8dcb0"; g.lineWidth = 7; g.strokeRect(12, 12, 1000, 232);
  g.fillStyle = "#f0e6c0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "BASE HOG CONTROL", 512, 104, 920, 112, STEN);
  g.fillStyle = "#e8c24a"; fitText(g, "TAILS PAID HERE", 512, 196, 600, 54, STEN);
});
/** the newspaper on the wall (and held up): masthead, headline, a photo of a hunter with a hog, columns */
export const paperTex = () => ctex("pgPaper", 512, 680, (g, r) => {
  g.fillStyle = "#ece6d4"; g.fillRect(0, 0, 512, 680); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(80,70,50,${r() * 0.05})`; g.fillRect(r() * 512, r() * 680, 2 + r() * 20, 1 + r() * 2); }
  g.fillStyle = "#1c1a18"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "THE COUNTY GAZETTE", 256, 44, 460, 44, "900 %spx Georgia, 'Times New Roman', serif");
  g.fillRect(24, 72, 464, 4); g.fillRect(24, 80, 464, 1.5);
  fitText(g, "SMARTEST DEAL", 256, 130, 470, 70, "900 %spx 'Arial Black', Arial"); fitText(g, "IN THE COUNTY", 256, 196, 470, 70, "900 %spx 'Arial Black', Arial");
  // photo: grey halftone box with a hunter + hog silhouette
  g.fillStyle = "#9a968c"; g.fillRect(40, 240, 432, 230); g.fillStyle = "#5c5850";
  g.beginPath(); g.ellipse(310, 410, 110, 52, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(420, 392, 38, 32, 0, 0, TAU); g.fill();
  g.fillRect(140, 290, 40, 140); g.beginPath(); g.arc(160, 278, 26, 0, TAU); g.fill(); g.fillRect(176, 330, 70, 14);
  for (let y = 244; y < 470; y += 5) for (let x = 44; x < 472; x += 5) if (hsh(x * 3 + y, 2) < 0.18) { g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x, y, 2, 2); }
  g.fillStyle = "#4a463e"; for (let c = 0; c < 3; c++) for (let i = 0; i < 12; i++) g.fillRect(40 + c * 148, 494 + i * 14, 132 * (0.7 + 0.3 * hsh(i + c * 13, 4)), 5);
});
/** the boars' WANTED poster: the best hunter's face (orange cap, big beard), "REWARD: ACORNS", a hoof-print signature */
export const wantedTex = () => ctex("pgWanted", 512, 720, (g, r) => {
  g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, 512, 720);
  const gr = g.createRadialGradient(256, 360, 120, 256, 360, 460); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(110,70,30,0.45)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 720);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,60,30,${r() * 0.07})`; g.fillRect(r() * 512, r() * 720, 2 + r() * 20, 1 + r() * 3); }
  g.fillStyle = "#2a1a12"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "WANTED", 256, 82, 450, 128, "900 %spx Georgia, 'Times New Roman', serif");
  // the face
  g.lineWidth = 9; g.strokeStyle = "#1a1210"; g.fillStyle = "#fbf8f2";
  g.beginPath(); g.ellipse(256, 330, 112, 124, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = "#6a4426"; g.beginPath(); g.moveTo(150, 340); g.quadraticCurveTo(160, 470, 256, 486); g.quadraticCurveTo(352, 470, 362, 340); g.quadraticCurveTo(300, 390, 256, 392); g.quadraticCurveTo(212, 390, 150, 340); g.fill(); g.stroke();
  g.fillStyle = "#ee6a1a"; g.beginPath(); g.moveTo(150, 262); g.quadraticCurveTo(160, 176, 256, 172); g.quadraticCurveTo(352, 176, 362, 262); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(250, 262); g.quadraticCurveTo(330, 250, 400, 276); g.lineTo(392, 290); g.quadraticCurveTo(320, 276, 250, 282); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#1a1210"; for (const x of [216, 300]) { g.beginPath(); g.arc(x, 318, 11, 0, TAU); g.fill(); }
  g.lineWidth = 8; for (const [a, b, c, d] of [[190, 290, 236, 302], [322, 302, 368, 290]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.beginPath(); g.moveTo(236, 380); g.quadraticCurveTo(256, 372, 276, 380); g.stroke();
  g.fillStyle = "#2a1a12"; fitText(g, "REWARD: ACORNS", 256, 560, 440, 58, "900 %spx Georgia, 'Times New Roman', serif");
  // hoof-print signature
  g.fillStyle = "#3a2214"; for (const [x, y, a] of [[396, 652, -0.3], [424, 652, 0.3]] as number[][]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 11, 22, 0, 0, TAU); g.fill(); g.restore(); }
});

// ---------------- the ranger's chalk: tally marks that are really a family tree ----------------
type CStroke = { a: [number, number]; b: [number, number]; ring?: boolean };
/** the stroke list in drawing order: a root sow (ringed mark) -> 3 litters of tallies; two ringed daughters in each litter
 *  -> their litters -> two daughters each -> their litters (the last generation fills the wall). Lines link mother -> litter. */
export const CHALK: CStroke[] = (() => {
  const out: CStroke[] = []; const W = 1024;
  const litter = (cx: number, cy: number, n: number, sc: number) => { const marks: [number, number][] = [];
    for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * 15 * sc + (hsh(cx + i, 3) - 0.5) * 3, y = cy + (hsh(cy + i, 5) - 0.5) * 4; out.push({ a: [x, y - 16 * sc], b: [x + 2, y + 16 * sc] }); marks.push([x, y]); }
    if (n >= 5) out.push({ a: [cx - (n / 2) * 15 * sc, cy + 10 * sc], b: [cx + (n / 2) * 15 * sc, cy - 10 * sc] });   // the slash across a group (looks like counting)
    return marks; };
  const ring = (x: number, y: number, _sc: number) => { out.push({ a: [x, y], b: [x, y], ring: true }); };
  const gen = (x: number, y: number, depth: number, span: number) => {
    const kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const kx = x + (k - (kids - 1) / 2) * span, ky = y + 150 - depth * 18, sc = 1 - depth * 0.18;
      out.push({ a: [x, y + 22], b: [kx, ky - 26 * sc] });   // the branch
      const marks = litter(kx, ky, depth === 0 ? 8 : 6, sc);
      if (depth < 2) for (const j of [1, marks.length - 2]) { ring(marks[j][0], marks[j][1], sc); gen(marks[j][0], marks[j][1] + 12, depth + 1, span / (depth === 0 ? 3.1 : 2.6)); }
    } };
  out.push({ a: [W / 2, 40], b: [W / 2 + 2, 76] }); ring(W / 2, 58, 1);
  gen(W / 2, 58, 0, 330);
  return out;
})();
export const chalkTex = (n: number) => { const v = Math.max(0, Math.min(CHALK.length, Math.round(n))); return ctex("pgChalk" + v, 1024, 640, (g) => {
  g.clearRect(0, 0, 1024, 640); g.lineCap = "round";
  for (let i = 0; i < v; i++) { const s = CHALK[i];
    for (let k = 0; k < 3; k++) { const j = (hsh(i * 3 + k, 9) - 0.5) * 2.2; g.strokeStyle = `rgba(244,242,232,${0.26 + 0.16 * hsh(i + k, 2)})`; g.lineWidth = 1.6 + k * 0.5;
      g.beginPath(); if (s.ring) g.ellipse(s.a[0] + j, s.a[1] + j, 13, 22, 0, 0, TAU); else { g.moveTo(s.a[0] + j, s.a[1] + j); g.lineTo(s.b[0] - j, s.b[1] + j); } g.stroke(); } }
}); };

// ---------------- hog tails (straight, bristly, a dark tuft) ----------------
export const tailGeo = (() => { let G: THREE.BufferGeometry | null = null; return () => {
  if (G) return G;
  const pts = [0, 0.06, 0.12, 0.18, 0.24].map((y, i) => new THREE.Vector3(Math.sin(i * 0.9) * 0.012, -y, Math.cos(i * 1.3) * 0.006));
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.011, 6, false);
  const p = tube.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 - 0.55 * cl(-y / 0.24), cx = Math.sin((-y / 0.06) * 0.9) * 0.012; p.setX(i, cx + (p.getX(i) - cx) * k); p.setZ(i, p.getZ(i) * k); }
  tube.computeVertexNormals();
  const tufts = [-0.5, -0.2, 0.15, 0.45, 0.0].map((a, i) => new THREE.ConeGeometry(0.006, 0.075 - i * 0.004, 4).rotateX(Math.PI).translate(0, -0.0375, 0).rotateZ(a * 0.55).rotateX((i % 2 - 0.5) * 0.4).translate(0.004, -0.235, 0));   // a splayed brush of hair, not an arrowhead
  const nail = new THREE.CylinderGeometry(0.008, 0.008, 0.012, 8).rotateX(Math.PI / 2).translate(0, 0.004, 0.012);
  const clean = (x: THREE.BufferGeometry) => { const y = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(y.attributes)) if (!["position", "normal", "uv"].includes(k)) y.deleteAttribute(k); return y; };
  G = mergeGeometries([clean(tube), ...tufts.map(clean), clean(nail)], false)!; return G; }; })();
export const tailMat = () => new THREE.MeshStandardMaterial({ color: "#6a4630", roughness: 0.95, envMapIntensity: 0.5 });
/** the hero tail for the hook close-up (BI2: "fill the frame with it"): a tapered corkscrew, 2.25 turns, base at the origin
 *  hanging down -y (same frame as tailGeo); the coil's local z becomes vertical when it lies on the counter. Returns
 *  [tube, tuft] geometries (two materials). Outer coil radius 0.025 (x the scale). */
export const curlyTailGeo = (() => { let G: [THREE.BufferGeometry, THREE.BufferGeometry] | null = null; return () => {
  if (G) return G;
  const L = 0.2, N = 72, pts: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) { const t = i / N, r = 0.017 * cl((t - 0.1) / 0.22), a = TAU * 3.0 * t; pts.push(new THREE.Vector3(r * Math.cos(a) - r, -L * t, r * Math.sin(a))); }
  const curve = new THREE.CatmullRomCurve3(pts), TS = 140, RS = 12, tube = new THREE.TubeGeometry(curve, TS, 1, RS, false);
  const p = tube.attributes.position as THREE.BufferAttribute, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= TS; i++) { const t = i / TS, rad = 0.0078 * (1 - 0.55 * t) * (t < 0.04 ? 0.8 + 5 * t : 1); curve.getPointAt(t, c);
    for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(rad).add(c); p.setXYZ(k, v.x, v.y, v.z); } }
  tube.computeVertexNormals();
  const tip = curve.getPointAt(1), dir = curve.getTangentAt(1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const tufts = [-0.7, -0.25, 0.2, 0.65, 0].map((a, i) => { const g = new THREE.ConeGeometry(0.0068, 0.058 - i * 0.004, 5).rotateX(Math.PI).translate(0, -0.02, 0).rotateZ(a * 0.7).rotateX((i % 2 - 0.5) * 0.7);
    g.applyQuaternion(q); g.translate(tip.x, tip.y, tip.z); const y = g.toNonIndexed(); for (const k of Object.keys(y.attributes)) if (!["position", "normal", "uv"].includes(k)) y.deleteAttribute(k); return y; });
  const tb = tube.toNonIndexed(); for (const k of Object.keys(tb.attributes)) if (!["position", "normal", "uv"].includes(k)) tb.deleteAttribute(k);
  G = [tb, mergeGeometries(tufts, false)!]; return G; }; })();

// ---------------- the ranger's reel push mower ----------------
export type Mower = { g: THREE.Group; set: (spin: number, tilt?: number) => void; HANDLE: V3 };
export const mower = (parent: THREE.Object3D): Mower => {
  const g = new THREE.Group(); parent.add(g);
  const green = col("#3e6a3a", 0.5, 0.4, 1.0), steel = col("#b8bcc4", 0.3, 0.9, 1.4), black = col("#1e1e22", 0.7, 0.1, 0.5), wood = phMat("rough_wood", 4, 4, { tint: "#c8a070", rough: 0.8, env: 0.7, key: "pgMowWood" });
  const mb = new MB(); const R = 0.13;
  for (const s of [-1, 1]) { mb.add(new THREE.CylinderGeometry(R, R, 0.05, 20).rotateZ(Math.PI / 2), black, [s * 0.24, R, 0]); mb.add(new THREE.CylinderGeometry(0.07, 0.07, 0.055, 14).rotateZ(Math.PI / 2), green, [s * 0.24, R, 0]); }
  mb.box(0.46, 0.03, 0.03, green, [0, 0.05, -0.12]); mb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 10).rotateZ(Math.PI / 2), steel, [0, 0.03, -0.2]);
  // the handle: two arms up to a wooden crossbar
  for (const s of [-1, 1]) { const a = new THREE.Vector3(s * 0.2, R, -0.02), b = new THREE.Vector3(s * 0.12, 0.92, -0.72); const d = b.clone().sub(a); const cyl = new THREE.CylinderGeometry(0.012, 0.012, d.length(), 8); cyl.translate(0, d.length() / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); cyl.applyQuaternion(q); mb.add(cyl, green, [a.x, a.y, a.z]); }
  mb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 10).rotateZ(Math.PI / 2), wood, [0, 0.92, -0.72]);
  mb.flush(g);
  const reel = new THREE.Group(); reel.position.set(0, R, 0); g.add(reel);
  { const rb = new MB(); rb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8).rotateZ(Math.PI / 2), steel);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; for (let j = 0; j < 6; j++) { const x = -0.2 + j * 0.08, aa = a + j * 0.14; rb.add(new THREE.BoxGeometry(0.085, 0.012, 0.004).rotateX(-aa), steel, [x, Math.cos(aa) * 0.09, Math.sin(aa) * 0.09]); } }
    rb.flush(reel); }
  return { g, HANDLE: [0, 0.92, -0.72], set: (spin, tilt = 0) => { reel.rotation.x = spin; g.rotation.x = tilt; } };
};

// ---------------- the padlock + chain on the gate ----------------
export type Lock = { g: THREE.Group; set: (open: number, drop: number) => void };
export const padlock = (parent: THREE.Object3D, pos: V3, yaw = 0): Lock => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const brass = col("#c49a48", 0.3, 0.9, 1.5), steel = col("#a8acb4", 0.28, 0.95, 1.4);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.032), brass); body.position.y = -0.05; body.castShadow = true; g.add(body);
  const kh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 10).rotateX(Math.PI / 2), col("#2a2420", 0.6)); kh.position.set(0, -0.06, 0.018); g.add(kh);
  const shackle = new THREE.Group(); shackle.position.set(0.02, -0.008, 0); g.add(shackle);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0065, 8, 16, Math.PI), steel); sh.position.set(-0.02, 0.012, 0); shackle.add(sh);
  for (const x of [-0.042, 0.002]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.024, 8), steel); leg.position.set(x, 0.0, 0); shackle.add(leg); }
  // chain: links round the gate post (in the lock's local frame the post is at z -0.07)
  const chain = new THREE.Group(); g.add(chain); const L: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, m = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 6, 12), steel); m.position.set(Math.cos(a) * 0.085, 0.02 + Math.sin(i * 2.1) * 0.006, -0.07 + Math.sin(a) * 0.085); m.rotation.set(i % 2 ? Math.PI / 2 : 0, a, 0); m.castShadow = true; chain.add(m); L.push(m); }
  return { g, set: (open, drop) => { shackle.position.y = -0.008 + cl(open) * 0.03; shackle.rotation.y = cl((open - 0.4) / 0.6) * 1.4;
    const d = sm(cl(drop)); chain.position.y = -d * 1.05; chain.rotation.z = d * 0.6; body.position.y = -0.05 - d * 1.05; body.rotation.z = d * 1.2; kh.position.y = -0.06 - d * 1.05; shackle.visible = true; shackle.position.y -= d * 1.05; } };
};

// ---------------- a ranch fence (posts + three rails) and a swinging gate ----------------
export const fenceMat = () => phMat("weathered_brown_planks", 1 / 1.2, 1 / 1.2, { tint: "#c8b8a0", rough: 1, env: 0.6, key: "pgFence" });
export const fence = (mb: MB, pts: V3[], hf: (x: number, z: number) => number, skip: (x: number, z: number) => boolean = () => false, gap = 2.4) => {
  const m = fenceMat();
  for (let s = 0; s < pts.length - 1; s++) { const a = pts[s], b = pts[s + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / gap)), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
    for (let i = 0; i <= n; i++) { const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[2] + ((b[2] - a[2]) * i) / n; if (skip(x, z)) continue; mb.box(0.13, 1.35, 0.13, m, [x, hf(x, z) + 0.6, z], [(hsh(x + z, 3) - 0.5) * 0.04, yaw, (hsh(x, z) - 0.5) * 0.05]); }
    for (let i = 0; i < n; i++) { const x0 = a[0] + ((b[0] - a[0]) * i) / n, z0 = a[2] + ((b[2] - a[2]) * i) / n, x1 = a[0] + ((b[0] - a[0]) * (i + 1)) / n, z1 = a[2] + ((b[2] - a[2]) * (i + 1)) / n;
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; if (skip(mx, mz)) continue; const ll = Math.hypot(x1 - x0, z1 - z0), y0 = hf(x0, z0), y1 = hf(x1, z1), pitch = Math.atan2(y1 - y0, ll);
      for (const h of [0.32, 0.68, 1.04]) mb.box(0.05, 0.13, ll + 0.12, m, [mx + Math.cos(yaw) * 0.075, (y0 + y1) / 2 + h + (hsh(i + h * 10, s) - 0.5) * 0.04, mz - Math.sin(yaw) * 0.075], [-pitch, yaw, 0]); }
  }
};
export type Gate = { g: THREE.Group; leaf: THREE.Group; set: (open: number) => void; W: number };
/** a farm gate hung on a post at `hinge`, closing along +local z (width W); open 0 shut .. 1 swung ~100 degrees (inward = +yaw) */
export const farmGate = (parent: THREE.Object3D, hinge: V3, yaw: number, W = 2.4): Gate => {
  const g = new THREE.Group(); g.position.set(...hinge); g.rotation.y = yaw; parent.add(g);
  const m = phMat("wooden_gate", 1 / 1.4, 1 / 1.4, { tint: "#d0c0a4", rough: 1, env: 0.6, key: "pgGate" }), fm = fenceMat();
  const mb = new MB(); mb.box(0.18, 1.6, 0.18, fm, [0, 0.7, 0]); mb.box(0.18, 1.6, 0.18, fm, [0, 0.7, W + 0.2]); mb.flush(g);
  const leaf = new THREE.Group(); leaf.position.set(0, 0, 0.12); g.add(leaf);
  const lb = new MB();
  for (const h of [0.3, 0.62, 0.94, 1.22]) lb.box(0.05, 0.12, W - 0.06, m, [0.06, h, W / 2]);
  for (const z of [0.05, W / 2, W - 0.08]) lb.box(0.06, 1.05, 0.11, m, [0.06, 0.76, z]);
  { const d = Math.hypot(W - 0.2, 0.9), a = Math.atan2(0.9, W - 0.2); lb.box(0.05, 0.11, d, m, [0.09, 0.76, W / 2], [a, 0, 0]); }
  lb.box(0.08, 0.05, 0.12, col("#2a2a2e", 0.5, 0.7), [0.06, 1.0, 0.0]); lb.box(0.08, 0.05, 0.12, col("#2a2a2e", 0.5, 0.7), [0.06, 0.5, 0.0]);   // hinges
  lb.flush(leaf);
  return { g, leaf, W, set: (open) => { leaf.rotation.y = sm(cl(open)) * 1.75; } };
};

// ---------------- young corn (instanced) ----------------
export const cornGeo = (() => { let G: THREE.BufferGeometry | null = null; return () => {
  if (G) return G; const parts: THREE.BufferGeometry[] = [];
  const clean = (x: THREE.BufferGeometry) => { const y = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(y.attributes)) if (!["position", "normal", "uv"].includes(k)) y.deleteAttribute(k); return y; };
  parts.push(clean(new THREE.CylinderGeometry(0.012, 0.02, 1.25, 6).translate(0, 0.62, 0)));
  for (let i = 0; i < 7; i++) { const y0 = 0.18 + i * 0.15, a = i * 2.4, L = 0.55 - i * 0.04;
    const leaf = new THREE.PlaneGeometry(L, 0.06, 6, 1); const p = leaf.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j < p.count; j++) { const x = p.getX(j) + L / 2, k = x / L; p.setX(j, x); p.setY(j, p.getY(j) * (1 - 0.7 * k) + 0.25 * x - 0.55 * x * x); }
    leaf.rotateY(a).translate(0, y0, 0); parts.push(clean(leaf)); }
  parts.push(clean(new THREE.ConeGeometry(0.03, 0.16, 5).translate(0, 1.32, 0)));
  G = mergeGeometries(parts, false)!; G.computeVertexNormals(); return G; }; })();
export const cornMat = () => { const m = new THREE.MeshStandardMaterial({ color: "#7a9a44", roughness: 0.75, side: THREE.DoubleSide, envMapIntensity: 0.7 }); return m; };

// ---------------- Poly Haven model instancing (grass, weeds, flowers, far trees) ----------------
/** one InstancedMesh per mesh of the model, at the given placements (pos, yaw, scale). Shares the model's materials. */
export const phInst = (root: THREE.Object3D, name: PhModel, spots: { p: V3; yaw: number; s: number; tilt?: number }[], o: { filt?: string; cast?: boolean } = {}) => {
  const src = phModel(name, { filt: o.filt, center: true }); src.updateMatrixWorld(true);
  const out: THREE.InstancedMesh[] = []; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  src.traverse((c) => { const me = c as THREE.Mesh; if (!me.isMesh || !spots.length) return;
    const im = new THREE.InstancedMesh(me.geometry, me.material, spots.length);
    spots.forEach((s, i) => { M.compose(new THREE.Vector3(...s.p), Q.setFromEuler(E.set(s.tilt ?? 0, s.yaw, 0)), new THREE.Vector3(s.s, s.s, s.s)); im.setMatrixAt(i, M.clone().multiply(me.matrixWorld)); });
    im.name = "inst:" + name; im.castShadow = !!o.cast; im.receiveShadow = true; im.computeBoundingSphere(); root.add(im); out.push(im); });
  return out;
};

// ---------------- the splat-mapped ground ----------------
export type Splat = { name: PhTex; tile: number; tint?: string };
/** a height-field terrain whose colour blends Poly Haven photo layers over [x0..x1] x [z0..z1]: layer 0 everywhere, then
 *  layers 1..6 mixed on in order by grey masks painted with paints[i-1] (white = that layer), packed into two RGB masks. */
export const splatGround = (root: THREE.Object3D, b: { x0: number; x1: number; z0: number; z1: number; nx: number; nz: number }, hf: (x: number, z: number) => number,
  layers: Splat[], paints: ((g: CanvasRenderingContext2D, px: (x: number, z: number) => [number, number], s: number) => void)[], key: string) => {
  const geo = new THREE.PlaneGeometry(b.x1 - b.x0, b.z1 - b.z0, b.nx, b.nz); geo.rotateX(-Math.PI / 2); geo.translate((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
  const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, hf(x, z)); uv.setXY(i, x / layers[0].tile, z / layers[0].tile); }
  geo.computeVertexNormals(); geo.setAttribute("uv1", uv.clone());
  const MS = 1024, sx = MS / (b.x1 - b.x0), sz = MS / (b.z1 - b.z0), px = (x: number, z: number): [number, number] => [(x - b.x0) * sx, (z - b.z0) * sz];
  const grey = paints.map((f) => { const c = document.createElement("canvas"); c.width = c.height = MS; const g = c.getContext("2d")!; g.fillStyle = "#000"; g.fillRect(0, 0, MS, MS); g.fillStyle = "#fff"; g.strokeStyle = "#fff"; f(g, px, Math.min(sx, sz)); return g.getImageData(0, 0, MS, MS).data; });
  const pack = (k: string, o: number) => { const t = ctex(key + k, MS, MS, (g) => { const im = g.createImageData(MS, MS); for (let i = 0; i < MS * MS; i++) { for (let c = 0; c < 3; c++) im.data[i * 4 + c] = grey[o + c] ? grey[o + c][i * 4] : 0; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); });
    t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.needsUpdate = true; return t; };
  const mA = pack("A", 0), mB = pack("B", 3);
  const base = phMat(layers[0].name, 1, 1, { tint: layers[0].tint ?? "#ffffff", rough: 1, env: 0.5, nor: 0.3, key: key + "base" }).clone();
  const tx = layers.slice(1).map((l) => phTexture(l.name, "diff"));
  const noiseT = ctex("pgNoise", 512, 512, (g, r) => { g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512); g.filter = "blur(14px)";
    for (let i = 0; i < 420; i++) { const v = Math.round(40 + r() * 175); g.fillStyle = `rgb(${v},${Math.round(40 + r() * 175)},${v})`; const x = r() * 512, y = r() * 512, rr = 12 + r() * 46;
      for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) { g.beginPath(); g.arc(x + dx, y + dy, rr, 0, TAU); g.fill(); } } });
  noiseT.wrapS = noiseT.wrapT = THREE.RepeatWrapping; noiseT.colorSpace = THREE.NoColorSpace; noiseT.needsUpdate = true;
  const U: Record<string, THREE.IUniform> = { mA: { value: mA }, mB: { value: mB }, bnd: { value: new THREE.Vector4(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0) }, noiseT: { value: noiseT }, kB: { value: 1 / layers[0].tile } };
  tx.forEach((t, i) => { U["t" + i] = { value: t }; U["k" + i] = { value: 1 / layers[i + 1].tile }; U["c" + i] = { value: new THREE.Color(layers[i + 1].tint ?? "#ffffff") }; });
  base.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vLP;").replace("#include <begin_vertex>", "#include <begin_vertex>\n  vLP = transformed;");
    const decl = tx.map((_, i) => `uniform sampler2D t${i}; uniform float k${i}; uniform vec3 c${i};`).join("\n");
    const mixes = tx.map((_, i) => `{ vec3 c = texture2D(t${i}, vLP.xz * k${i}).rgb * c${i}; float w = ${i < 3 ? `mA_.${"rgb"[i]}` : `mB_.${"rgb"[i - 3]}`}; col = mix(col, c, w); }`).join("\n");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 vLP; uniform sampler2D mA; uniform sampler2D mB; uniform vec4 bnd; uniform sampler2D noiseT; uniform float kB;
${decl}
vec3 tri(sampler2D t, vec2 p, float k, float n) { vec3 a = texture2D(t, p * k).rgb; vec3 b = texture2D(t, mat2(0.8, -0.6, 0.6, 0.8) * p * k * 0.43 + 0.37).rgb; return mix(a, b, n); }`)
      .replace("#include <map_fragment>", `
  float nz = texture2D(noiseT, vLP.xz * 0.013).r; float nm = smoothstep(0.32, 0.68, nz);
  #ifdef USE_MAP
    diffuseColor *= mix(texture2D(map, vLP.xz * kB), texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * vLP.xz * kB * 0.43 + 0.37), nm);
  #endif
  { vec2 mu = (vLP.xz - bnd.xy) / bnd.zw; vec3 mA_ = texture2D(mA, mu).rgb; vec3 mB_ = texture2D(mB, mu).rgb;
    vec3 col = diffuseColor.rgb;
    ${mixes}
    float mac = texture2D(noiseT, vLP.xz * 0.034 + 0.5).g; col *= 0.84 + 0.32 * mac;
    diffuseColor.rgb = col; }`);
  };
  base.customProgramCacheKey = () => "pgSplat" + key + tx.length;
  const me = new THREE.Mesh(geo, base); me.receiveShadow = true; me.castShadow = false; me.name = "ground"; root.add(me);
  return me;
};

// ---------------- the herd: instanced pig billboards (an atlas of the critter68 wild hog in walk phases) ----------------
export const HERD_KINDS = 6, HERD_PH = 4;   // kinds: 0-1 sows (brown / grey-black), 2-3 piglets (striped), 4 boar, 5 sow (dark)
const HL: Look[] = [
  { seed: 2101, species: "pig", coat: "#5e4434", fur: "#5e4434", wild: true },
  { seed: 2103, species: "pig", coat: "#4a4446", fur: "#4a4446", wild: true },
  { seed: 2105, species: "pig", coat: "#7a5a40", fur: "#7a5a40", wild: true, piglet: true },
  { seed: 2107, species: "pig", coat: "#6a4c38", fur: "#6a4c38", wild: true, piglet: true },
  { seed: 2109, species: "pig", coat: "#3e302a", fur: "#3e302a", wild: true, tusks: true },
  { seed: 2111, species: "pig", coat: "#4e3a30", fur: "#4e3a30", wild: true },
] as Look[];
const TW = 256, TH = 160;
export const herdAtlas = () => { const t = ctex("pgHerdAtlas", TW * HERD_PH, TH * HERD_KINDS, (g) => {
  g.clearRect(0, 0, TW * HERD_PH, TH * HERD_KINDS);
  for (let k = 0; k < HERD_KINDS; k++) for (let f = 0; f < HERD_PH; f++) { g.save(); g.translate(f * TW, k * TH); g.beginPath(); g.rect(0, 0, TW, TH); g.clip();
    const sc = TW / 700; g.scale(sc, sc); g.translate(60, -560);
    critter68(new Pen(g), HL[k], { mode: "walk", phase: f / HERD_PH, expr: "neutral" } as never, 0.6); g.restore(); }
}); t.generateMipmaps = true; t.anisotropy = 4; return t; };
export type Herd = { mesh: THREE.InstancedMesh; set: (list: { p: V3; kind: number; ph: number; flip: boolean; s: number; on: boolean }[], tint: THREE.Color) => void; N: number };
/** camera-facing (yaw-only) pig cards, ground point at the card's bottom middle; size 1 = a 1.15 m sow */
export const herd = (root: THREE.Object3D, N: number): Herd => {
  const geo = new THREE.PlaneGeometry(1, TH / TW).translate(0, (TH / TW) / 2, 0);
  const atl = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); geo.setAttribute("atl", atl);
  const m = new THREE.MeshBasicMaterial({ map: herdAtlas(), alphaTest: 0.5, side: THREE.DoubleSide, color: "#fefefe" });   // not pure white: realify() would swap it for a lit standard material
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec3 atl;")
      .replace("#include <uv_vertex>", `#include <uv_vertex>
  { float fl = atl.z > 0.5 ? -1.0 : 1.0; vec2 u0 = vec2(uv.x, uv.y); if (fl < 0.0) u0.x = 1.0 - u0.x; vMapUv = vec2((atl.x + u0.x) / ${HERD_PH.toFixed(1)}, 1.0 - (atl.y + 1.0 - u0.y) / ${HERD_KINDS.toFixed(1)}); }`)
      .replace("#include <project_vertex>", `
  vec4 c0 = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec3 toC = cameraPosition - c0.xyz; toC.y = 0.0; toC = normalize(toC); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), toC));
  float sc = length(instanceMatrix[0].xyz);
  vec3 wp = c0.xyz + rt * transformed.x * sc * 1.25 + vec3(0.0, 1.0, 0.0) * transformed.y * sc * 1.25;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;`);
  };
  m.customProgramCacheKey = () => "pgHerd1";
  const mesh = new THREE.InstancedMesh(geo, m, N); mesh.name = "herd"; mesh.layers.set(NOINK); mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.count = 0; root.add(mesh);
  const M = new THREE.Matrix4();
  return { mesh, N, set: (list, tint) => { let k = 0;
    for (const h of list) { if (!h.on || k >= N) continue; M.makeScale(h.s, h.s, h.s); M.setPosition(h.p[0], h.p[1], h.p[2]); mesh.setMatrixAt(k, M); atl.setXYZ(k, Math.floor(((h.ph % 1) + 1) % 1 * HERD_PH), h.kind, h.flip ? 1 : 0); k++; }
    mesh.count = k; mesh.instanceMatrix.needsUpdate = true; atl.needsUpdate = true; m.color.copy(tint); } };
};
void PAINT; void hsh;

// ---------------- far trees: impostor cards rendered once from the real models (a throwaway WebGL context) ----------------
type Imp = { tex: THREE.Texture; hw: number[]; h: number[]; n: number };
const IMP: Record<string, Imp> = {};
/** render each root node (filts) of a Poly Haven tree side-on into one atlas tile (1:2), lit like late afternoon */
export const impostor = (make: (i: number) => THREE.Object3D, n: number, key: string): Imp => {
  if (IMP[key]) return IMP[key];
  const TWp = 320, THp = 640;
  const cv = document.createElement("canvas"); cv.width = TWp * n; cv.height = THp; const g2 = cv.getContext("2d")!;
  const rc = document.createElement("canvas"); rc.width = TWp; rc.height = THp;
  const hw: number[] = [], hh: number[] = [];
  let R: THREE.WebGLRenderer | null = null;
  try { R = new THREE.WebGLRenderer({ canvas: rc, alpha: true, antialias: true, preserveDrawingBuffer: true }); } catch { R = null; }
  for (let i = 0; i < n; i++) {
    const sc = new THREE.Scene(); const m = make(i); sc.add(m); m.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3());
    const w2 = Math.max(Math.max(sz.x, sz.z) * 0.53, sz.y * 0.25); hw.push(w2); hh.push(4 * w2);
    if (!R) continue;
    sc.add(new THREE.HemisphereLight("#d0dcf0", "#6a5a40", 1.5)); const d = new THREE.DirectionalLight("#fff0d8", 2.4); d.position.set(4, 7, 5); sc.add(d);
    const cam = new THREE.OrthographicCamera(-w2, w2, 4 * w2, 0, 0.1, 300); cam.position.set(0, 0, 60); cam.lookAt(0, 0, 0);
    R.setClearColor(0x000000, 0); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NoToneMapping;
    R.clear(); R.render(sc, cam); g2.drawImage(rc, i * TWp, 0);
  }
  if (R) { R.dispose(); R.forceContextLoss(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
  IMP[key] = { tex, hw, h: hh, n }; return IMP[key];
};
export type Forest = { mesh: THREE.InstancedMesh; mat: THREE.MeshBasicMaterial };
/** far trees as instanced crossed quads from an impostor atlas: spots { p, s (height scale), v (variant), yaw } */
export const forest = (root: THREE.Object3D, imp: Imp, spots: { p: V3; s: number; v: number; yaw: number }[], matIn?: THREE.MeshBasicMaterial): Forest => {
  const quads: THREE.BufferGeometry[] = [];
  for (let v = 0; v < imp.n; v++) { const w = imp.hw[v] * 2, h = imp.h[v];
    for (const a of [0, Math.PI / 2]) { const q = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0).rotateY(a); const uvA = q.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uvA.count; i++) uvA.setX(i, (v + uvA.getX(i)) / imp.n); quads.push(q); } }
  // one geometry per variant (two crossed quads), instanced separately
  const mat = matIn ?? new THREE.MeshBasicMaterial({ map: imp.tex, alphaTest: 0.45, side: THREE.DoubleSide, color: "#fefefe" });
  const group = new THREE.Group(); group.name = "forest"; root.add(group); let first: THREE.InstancedMesh | null = null;
  for (let v = 0; v < imp.n; v++) {
    const geo = mergeGeometries([quads[v * 2], quads[v * 2 + 1]].map((q) => { for (const k of Object.keys(q.attributes)) if (!["position", "normal", "uv"].includes(k)) q.deleteAttribute(k); return q; }), false)!;
    const list = spots.filter((s) => s.v === v); if (!list.length) continue;
    const im = new THREE.InstancedMesh(geo, mat, list.length); const M = new THREE.Matrix4(), Q = new THREE.Quaternion();
    list.forEach((s, i) => { M.compose(new THREE.Vector3(...s.p), Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw), new THREE.Vector3(s.s, s.s, s.s)); im.setMatrixAt(i, M); });
    im.castShadow = false; im.receiveShadow = false; im.computeBoundingSphere(); group.add(im); if (!first) first = im;
  }
  return { mesh: first!, mat };
};

// ---------------- pines: the real trunk + branches (pine_bare) wearing alpha needle cards at the real twig positions ----------------
const PC = [PC_A, PC_B, PC_C];
export const PINE_NODES = ["pine_tree_01_a_LOD0", "pine_tree_01_b_LOD0", "pine_tree_01_c_LOD0"];
/** a 2 x 2 atlas of pine twigs: a brown stem with dense paired needles (dark green, lighter tips) */
export const needleTex = () => { const t = ctex("pgNeedles", 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512); g.lineCap = "round";
  for (let cell = 0; cell < 4; cell++) { const ox = (cell % 2) * 256, oy = Math.floor(cell / 2) * 256;
    g.save(); g.beginPath(); g.rect(ox, oy, 256, 256); g.clip();
    const bend = (r() - 0.5) * 60, stem = (k: number): [number, number] => [ox + 128 + bend * k * k, oy + 250 - k * 225];
    const twigs: [number, number, number][] = [[0, 0, 1]]; for (let i = 0; i < 3; i++) twigs.push([0.25 + r() * 0.4, (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5), 0.45 + r() * 0.3]);
    for (const [k0, side, len] of twigs) {
      const p0 = stem(k0), a0 = side === 0 ? -Math.PI / 2 : -Math.PI / 2 + side * 0.9; const pt = (k: number): [number, number] => side === 0 ? stem(k) : [p0[0] + Math.cos(a0) * k * 200 * len, p0[1] + Math.sin(a0) * k * 200 * len];
      g.strokeStyle = "#5a4232"; g.lineWidth = side === 0 ? 5 : 3; g.beginPath(); g.moveTo(...pt(side === 0 ? 0 : 0)); for (let k = 0.05; k <= 1.0001; k += 0.05) g.lineTo(...pt(side === 0 ? k : k)); g.stroke();
      for (let k = 0.08; k < 1; k += 0.022) { const [x, y] = pt(side === 0 ? k : k); const dirA = side === 0 ? -Math.PI / 2 : a0;
        for (const sgn of [-1, 1]) { const a = dirA + sgn * (0.55 + r() * 0.5) - 0.15, L = (side === 0 ? 46 : 34) * (0.65 + r() * 0.5) * (1 - 0.35 * k);
          const gc = 52 + r() * 40; g.strokeStyle = `rgb(${Math.round(gc * 0.62)},${Math.round(gc)},${Math.round(gc * 0.5)})`; g.lineWidth = 2.2 + r() * 1.2;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
          g.strokeStyle = "rgba(160,190,110,0.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + Math.cos(a) * L * 0.7, y + Math.sin(a) * L * 0.7); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } } }
    g.restore(); }
}); t.anisotropy = 8; return t; };
const canopyGeo: (THREE.BufferGeometry | null)[] = [null, null, null];
/** all needle cards of one pine variant as one geometry (node-local): per anchor a tilted horizontal card + a vertical one */
export const pineCanopy = (v: number) => { if (canopyGeo[v]) return canopyGeo[v]!;
  const A = PC[v], pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = []; let vi = 0;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < A.length; i += 6) { const c = new THREE.Vector3(A[i], A[i + 1], A[i + 2]), out = new THREE.Vector3(A[i + 3], -0.22, A[i + 4]).normalize(), s = A[i + 5] * 1.35;
    const side = new THREE.Vector3().crossVectors(up, out).normalize(), cell = Math.floor(hsh(i, 13) * 4), u0 = (cell % 2) * 0.5, v0 = Math.floor(cell / 2) * 0.5;
    const n = out.clone().multiplyScalar(0.45).add(up.clone().multiplyScalar(0.9)).normalize();
    const base = c.clone().addScaledVector(out, -0.35 * s);
    for (const [ax2, tilt] of [[side, 0.35], [up, 0]] as [THREE.Vector3, number][]) {
      const w = ax2 === side ? side.clone().multiplyScalar(0.5 * s * 0.85) : up.clone().multiplyScalar(0.5 * s * 0.75), L = out.clone().multiplyScalar(s * 1.1).addScaledVector(up, tilt * s);
      const p = [base.clone().sub(w), base.clone().add(w), base.clone().add(w).add(L), base.clone().sub(w).add(L)];
      for (const q of p) { pos.push(q.x, q.y, q.z); nor.push(n.x, n.y, n.z); }
      uv.push(u0, 1 - (v0 + 0.5), u0 + 0.5, 1 - (v0 + 0.5), u0 + 0.5, 1 - v0, u0, 1 - v0);
      idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  canopyGeo[v] = g; return g; };
let needleM: THREE.MeshLambertMaterial | null = null;
/** Lambert (cheap per-pixel light: the alpha cards were 13 s of a 23 s frame with PBR); an own onBeforeCompile keeps realify() off it */
export const needleMat = () => { if (!needleM) { needleM = new THREE.MeshLambertMaterial({ map: needleTex(), alphaTest: 0.5, side: THREE.DoubleSide, color: "#c4cca8" }); needleM.onBeforeCompile = () => undefined; needleM.customProgramCacheKey = () => "pgNeedle1"; needleM.userData.noMacro = true; } return needleM; };
/** a whole pine: trunk + branches (pine_bare) + the needle cards, h metres tall; cast = throws the sun's shadow */
export const pineTree = (v: number, h: number, cast: boolean) => {
  const t = phModel("pine_bare", { filt: PINE_NODES[v].replace("_LOD0", ""), center: true, h, noCast: !cast });
  let node: THREE.Object3D | undefined; t.traverse((o) => { if (o.name === PINE_NODES[v]) node = o; });
  const can = new THREE.Mesh(pineCanopy(v), needleMat()); can.name = "canopy"; can.castShadow = cast; can.receiveShadow = false;
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: needleMat().map, alphaTest: 0.5 }); can.customDepthMaterial = dm;
  (node ?? t).add(can); return t;
};

/** a pine that turns into its impostor card beyond `far` m from the camera (THREE.LOD picks per frame) */
let pineImpM: THREE.MeshBasicMaterial | null = null;
export const pineImpMat = (imp: Imp) => { if (!pineImpM) pineImpM = new THREE.MeshBasicMaterial({ map: imp.tex, alphaTest: 0.45, side: THREE.DoubleSide, color: "#fefefe" }); return pineImpM; };
const impGeo: (THREE.BufferGeometry | null)[] = [null, null, null];
export const pineLOD = (v: number, h: number, cast: boolean, imp: Imp, far = 38) => {
  const lod = new THREE.LOD(); lod.addLevel(pineTree(v, h, cast), 0);
  if (!impGeo[v]) { const w = imp.hw[v] * 2, hh = imp.h[v], qs = [0, Math.PI / 2].map((a) => { const q = new THREE.PlaneGeometry(w, hh).translate(0, hh / 2, 0).rotateY(a); const uv = q.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, (v + uv.getX(i)) / imp.n); for (const k of Object.keys(q.attributes)) if (!["position", "normal", "uv"].includes(k)) q.deleteAttribute(k); return q; });
    impGeo[v] = mergeGeometries(qs, false)!; }
  const card = new THREE.Mesh(impGeo[v]!, pineImpMat(imp)); card.scale.setScalar(h / 20); card.name = "impcard"; lod.addLevel(card, far);
  return lod;
};
