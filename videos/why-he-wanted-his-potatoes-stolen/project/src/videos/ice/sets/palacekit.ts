// Palace kit for "Why He Wanted His Potatoes Stolen": painted textures + furniture pieces (throne, chandelier,
// candelabra, banner, curtain, gilded chair, easel menu, dishes with cloches). Invented heraldry only (a plain gold
// fleur-de-lis on royal blue), no real arms or brands.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, jit } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { flame, lamCustom, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { seg, lathe, drawLys, GOLD, GOLDL, GOLDD } from "./hotel";
import type { V3 } from "./types";

const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
};
const vein = (g: CanvasRenderingContext2D, r: () => number, x: number, y: number, col: string, n = 30, step = 10) => {
  let a = r() * TAU; g.strokeStyle = col; g.lineWidth = 0.8 + r() * 2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y);
  for (let k = 0; k < n; k++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * step; y += Math.sin(a) * step; g.lineTo(x, y); } g.stroke();
};

// ---------------- textures ----------------
/** cream + rose checker marble: 1024 px = 1.6 m (2 x 2 tiles of 0.8 m), veins, polish blots, worn grout */
export const checkerTex = () => ctex("palChecker", 1024, 1024, (g, r) => {
  const s = 512;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const rose = (i + j) % 2 === 1;
    g.fillStyle = rose ? "#d9928c" : "#f3e9dc"; g.fillRect(i * s, j * s, s, s);
    for (let k = 0; k < 10; k++) blot(g, i * s + r() * s, j * s + r() * s, 40 + r() * 110, rose ? "rgba(170,90,90,0.25)" : "rgba(220,200,180,0.35)");
    g.save(); g.beginPath(); g.rect(i * s, j * s, s, s); g.clip();
    for (let k = 0; k < 5; k++) { g.globalAlpha = 0.25 + r() * 0.35; vein(g, r, i * s + r() * s, j * s + r() * s, rose ? "#f4dcd2" : "#a89aa6"); }
    g.restore(); g.globalAlpha = 1;
    blot(g, i * s + s * 0.3, j * s + s * 0.28, s * 0.35, "rgba(255,255,255,0.18)");
  }
  g.fillStyle = "rgba(110,80,80,0.55)"; for (const p of [0, 512, 1024]) { g.fillRect(p - 2, 0, 4, 1024); g.fillRect(0, p - 2, 1024, 4); }
  for (let k = 0; k < 60; k++) { g.strokeStyle = "rgba(90,60,60,0.18)"; g.lineWidth = 1; const x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 50, y + (r() - 0.5) * 20); g.stroke(); }
});
/** wall bay (4 m wide x 7.5 m tall): pale duck-egg plaster with gilt-framed panels above a rose-marble wainscot */
export const wallTex = () => ctex("palWall", 1024, 1920, (g, r) => {
  const ppm = 1920 / 7.5, Y = (m: number) => 1920 - m * ppm;
  const gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, "#9fbfcc"); gr.addColorStop(1, "#b8d0d0"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1920);
  for (let k = 0; k < 40; k++) blot(g, r() * 1024, r() * 1920, 60 + r() * 140, r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(120,140,160,0.08)");
  // wainscot
  g.fillStyle = "#c98d84"; g.fillRect(0, Y(1.15), 1024, 1.15 * ppm);
  for (let k = 0; k < 8; k++) { g.globalAlpha = 0.3; vein(g, r, r() * 1024, Y(0.2 + r() * 0.8), "#f2d6cc", 20, 9); } g.globalAlpha = 1;
  g.fillStyle = GOLD; g.fillRect(0, Y(1.15), 1024, 10); g.fillStyle = GOLDL; g.fillRect(0, Y(1.15), 1024, 3); g.fillStyle = "#8a4a44"; g.fillRect(0, Y(0.16), 1024, 0.16 * ppm);
  // two tall framed panels
  for (const x0 of [70, 560]) {
    const x = x0, y = Y(6.6), w = 394, h = Y(1.6) - Y(6.6);
    g.fillStyle = "#b2ccd2"; g.fillRect(x, y, w, h);
    g.lineWidth = 14; g.strokeStyle = GOLDD; g.strokeRect(x, y, w, h); g.lineWidth = 9; g.strokeStyle = GOLD; g.strokeRect(x, y, w, h); g.lineWidth = 3; g.strokeStyle = GOLDL; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
    g.lineWidth = 4; g.strokeStyle = GOLD; g.strokeRect(x + 28, y + 28, w - 56, h - 56);
    g.fillStyle = GOLD; for (const [cx, cy] of [[x + 28, y + 28], [x + w - 28, y + 28], [x + 28, y + h - 28], [x + w - 28, y + h - 28]]) { g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.fill(); }
    g.fillStyle = "rgba(214,164,67,0.55)"; drawLys(g, x + w / 2, y + 120, 0.7);
  }
  // cornice band
  g.fillStyle = "#f4ecdc"; g.fillRect(0, 0, 1024, Y(7.0)); g.fillStyle = GOLD; g.fillRect(0, Y(7.0) - 6, 1024, 12);
  for (let x = 10; x < 1024; x += 36) { g.fillStyle = GOLDD; g.fillRect(x, Y(7.25), 18, 16); }
});
/** red runner carpet: 512 x 2048 = 2.4 m x 11.2 m, gold border + lattice + medallions */
export const carpetTex = () => ctex("palCarpet", 512, 2048, (g, r) => {
  g.fillStyle = "#a8203a"; g.fillRect(0, 0, 512, 2048);
  for (let k = 0; k < 30; k++) blot(g, r() * 512, r() * 2048, 60 + r() * 120, r() < 0.5 ? "rgba(70,0,20,0.18)" : "rgba(220,90,100,0.12)");
  g.fillStyle = GOLD; g.fillRect(0, 0, 44, 2048); g.fillRect(468, 0, 44, 2048); g.fillStyle = "#6a1022"; g.fillRect(44, 0, 10, 2048); g.fillRect(458, 0, 10, 2048);
  g.fillStyle = GOLDD; for (let y = 8; y < 2048; y += 30) { g.fillRect(12, y, 20, 12); g.fillRect(480, y, 20, 12); }
  g.strokeStyle = "rgba(240,190,90,0.45)"; g.lineWidth = 4;
  for (let y = 0; y < 2048; y += 128) { g.beginPath(); g.moveTo(256, y); g.lineTo(400, y + 64); g.lineTo(256, y + 128); g.lineTo(112, y + 64); g.closePath(); g.stroke(); }
  for (let y = 64; y < 2048; y += 256) { g.fillStyle = "rgba(240,190,90,0.6)"; drawLys(g, 256, y, 0.55); }
  for (let k = 0; k < 2500; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,200,200,0.06)" : "rgba(40,0,10,0.08)"; g.fillRect(r() * 512, r() * 2048, 2, 2); }
});
/** royal-blue velvet field with a gold fleur-de-lis powdering (banners, throne drape) */
export const lysFieldTex = (key: string, n = 3, bg = "#1f3a8a") => ctex("palLys_" + key, 512, 1024, (g, r) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 1024);
  for (let k = 0; k < 20; k++) blot(g, r() * 512, r() * 1024, 60 + r() * 120, r() < 0.5 ? "rgba(10,20,70,0.3)" : "rgba(90,120,220,0.15)");
  const dx = 512 / n, dy = dx * 1.15;
  for (let j = 0; j * dy < 1024 + dy; j++) for (let i = 0; i <= n; i++) { g.fillStyle = GOLD; drawLys(g, (i + (j % 2) * 0.5) * dx, j * dy + 40, dx / 260); }
});
/** a banner: blue field, gold border, one big lys, swallow-tail cut by alpha */
export const bannerTex = () => ctex("palBanner", 256, 640, (g, r) => {
  g.fillStyle = "#213c8e"; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 640); g.lineTo(128, 540); g.lineTo(0, 640); g.closePath(); g.fill();
  for (let k = 0; k < 10; k++) blot(g, r() * 256, r() * 600, 40 + r() * 70, "rgba(10,20,70,0.3)");
  g.strokeStyle = GOLD; g.lineWidth = 14; g.beginPath(); g.moveTo(10, 8); g.lineTo(246, 8); g.lineTo(246, 618); g.lineTo(128, 526); g.lineTo(10, 618); g.closePath(); g.stroke();
  g.strokeStyle = GOLDL; g.lineWidth = 3; g.stroke();
  g.fillStyle = GOLD; drawLys(g, 128, 250, 1.5); g.fillStyle = GOLDL; drawLys(g, 126, 246, 1.42);
  g.fillStyle = GOLD; drawLys(g, 128, 250, 1.4);
});
/** gold velvet curtain: one fold per texture repeat + fringe */
export const goldVelvetTex = () => ctex("palGoldVelvet", 128, 512, (g, r) => {
  const dark = [120, 70, 20], mid = [200, 140, 50], light = [250, 214, 120];
  for (let x = 0; x < 128; x++) {
    const s = Math.sin((x / 128) * TAU), k = (s + 1) / 2, c = k < 0.5 ? dark.map((d, i) => d + (mid[i] - d) * k * 2) : mid.map((m, i) => m + (light[i] - m) * (k - 0.5) * 2);
    g.fillStyle = `rgb(${c.map(Math.round).join(",")})`; g.fillRect(x, 0, 1, 512);
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,30,0,${r() * 0.07})`; g.fillRect(r() * 128, 0, 1 + r() * 3, 512); }
  g.fillStyle = "#8a1e2e"; g.fillRect(0, 480, 128, 32); g.fillStyle = GOLDL; for (let x = 0; x < 128; x += 6) g.fillRect(x, 488, 2, 24);
});
/** the garden seen through the windows: sky, clouds, a formal parterre, clipped trees, a fountain (unlit backdrop) */
export const gardenTex = () => ctex("palGarden", 1024, 1024, (g, r) => {
  const sk = g.createLinearGradient(0, 0, 0, 600); sk.addColorStop(0, "#3d82d8"); sk.addColorStop(1, "#cfe5f6"); g.fillStyle = sk; g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 9; i++) { const cx = r() * 1024, cy = 90 + r() * 300; for (let k = 0; k < 7; k++) blot(g, cx + (r() - 0.5) * 160, cy + (r() - 0.5) * 40, 40 + r() * 50, "rgba(255,255,255,0.75)"); }
  g.fillStyle = "#9cb4cf"; g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, 560 - 30 * Math.sin(x * 0.01) - r() * 20); g.lineTo(1024, 640); g.lineTo(0, 640); g.fill();
  g.fillStyle = "#6fae5a"; g.fillRect(0, 620, 1024, 404);
  for (let y = 650; y < 1024; y += 60) { g.fillStyle = y % 120 ? "#5c9a4c" : "#82be62"; g.fillRect(0, y, 1024, 30); }
  g.fillStyle = "#e9dcc2"; g.fillRect(470, 620, 84, 404); for (let y = 700; y < 1024; y += 120) g.fillRect(0, y, 1024, 12);
  for (let x = 40; x < 1024; x += 110) { g.fillStyle = "#3f7d3e"; g.beginPath(); g.moveTo(x, 640); g.lineTo(x + 22, 560); g.lineTo(x + 44, 640); g.fill(); g.fillStyle = "#4e8f45"; g.beginPath(); g.moveTo(x + 22, 560); g.lineTo(x + 44, 640); g.lineTo(x + 30, 640); g.fill(); }
  g.fillStyle = "#e6e2da"; g.beginPath(); g.ellipse(512, 860, 120, 36, 0, 0, TAU); g.fill(); g.fillStyle = "#7cc6e6"; g.beginPath(); g.ellipse(512, 856, 104, 28, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.moveTo(500, 850); g.quadraticCurveTo(512, 720, 524, 850); g.fill();
});
/** painted ceiling: cream coffers with gold ribs and a central sky oval */
export const ceilTex = () => ctex("palCeil", 1024, 1024, (g, r) => {
  g.fillStyle = "#efe4cc"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = "#e2d2ae"; g.fillRect(i * 256 + 22, j * 256 + 22, 212, 212); g.fillStyle = "#f6eedc"; g.fillRect(i * 256 + 40, j * 256 + 40, 176, 176); g.fillStyle = "rgba(214,164,67,0.5)"; drawLys(g, i * 256 + 128, j * 256 + 128, 0.5); }
  g.fillStyle = GOLD; for (let p = 0; p <= 1024; p += 256) { g.fillRect(p - 5, 0, 10, 1024); g.fillRect(0, p - 5, 1024, 10); }
  for (let k = 0; k < 14; k++) blot(g, r() * 1024, r() * 1024, 80 + r() * 140, "rgba(170,130,80,0.08)");
});
/** the menu board: chalk-black slate in a gilt frame (front) */
export const menuTex = () => ctex("palMenu", 512, 640, (g, r) => {
  g.fillStyle = "#2c3a3a"; g.fillRect(0, 0, 512, 640);
  for (let k = 0; k < 30; k++) blot(g, r() * 512, r() * 640, 40 + r() * 90, "rgba(200,220,220,0.07)");
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#f6d784"; fitText(g, "MENU", 256, 90, 300, 84, "900 %spx Georgia, serif");
  g.strokeStyle = "#f6d784"; g.lineWidth = 4; g.beginPath(); g.moveTo(120, 150); g.lineTo(392, 150); g.stroke();
  g.fillStyle = "#fbf6ea"; fitText(g, "HACHIS", 256, 230, 420, 70, "900 %spx Georgia, serif"); fitText(g, "PARMENTIER", 256, 305, 440, 70, "900 %spx Georgia, serif");
  g.fillStyle = "#f6d784"; g.font = "700 40px Georgia, serif"; g.fillText("~", 256, 368);
  g.fillStyle = "#fbf6ea"; fitText(g, "POTAGE", 256, 430, 420, 70, "900 %spx Georgia, serif"); fitText(g, "PARMENTIER", 256, 505, 440, 70, "900 %spx Georgia, serif");
  g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 300; i++) { g.globalAlpha = 0.25 * r(); g.fillRect(r() * 512, r() * 640, 2 + r() * 5, 1 + r() * 2); } g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
});
/** white damask tablecloth */
export const clothTex = () => ctex("palCloth", 512, 512, (g, r) => {
  g.fillStyle = "#fbf8f0"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(200,190,170,0.35)"; g.lineWidth = 3; for (let x = 0; x < 512; x += 64) for (let y = 0; y < 512; y += 64) { g.beginPath(); g.moveTo(x + 32, y + 6); g.lineTo(x + 58, y + 32); g.lineTo(x + 32, y + 58); g.lineTo(x + 6, y + 32); g.closePath(); g.stroke(); }
  for (let k = 0; k < 10; k++) blot(g, r() * 512, r() * 512, 40 + r() * 80, "rgba(220,210,190,0.18)");
});
/** a generic invented landscape painting (corridor portrait frame) */
export const landscapeTex = () => ctex("palLandscape", 512, 384, (g, r) => {
  const sk = g.createLinearGradient(0, 0, 0, 240); sk.addColorStop(0, "#f2c58e"); sk.addColorStop(1, "#f8e6c4"); g.fillStyle = sk; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#9aa6c8"; g.beginPath(); g.moveTo(0, 230); g.lineTo(140, 120); g.lineTo(260, 210); g.lineTo(380, 130); g.lineTo(512, 220); g.lineTo(512, 384); g.lineTo(0, 384); g.fill();
  g.fillStyle = "#7aa25c"; g.beginPath(); g.moveTo(0, 270); g.quadraticCurveTo(256, 220, 512, 280); g.lineTo(512, 384); g.lineTo(0, 384); g.fill();
  g.fillStyle = "#5a8a4a"; for (let x = 30; x < 512; x += 70) { g.beginPath(); g.arc(x, 280 + r() * 20, 22 + r() * 10, 0, TAU); g.fill(); }
  g.fillStyle = "#6ab2d0"; g.beginPath(); g.ellipse(300, 330, 120, 20, 0, 0, TAU); g.fill();
  for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(r() * 512, r() * 384, 8, 3); }
});
/** lavender corridor wall (3 m bay): panel mouldings, chair rail */
export const lavWallTex = () => ctex("palLavWall", 1024, 1024, (g, r) => {
  g.fillStyle = "#b9a6d6"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 30; k++) blot(g, r() * 1024, r() * 1024, 60 + r() * 120, r() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(80,50,120,0.08)");
  const Y = (m: number) => 1024 - (m / 3.8) * 1024;
  g.fillStyle = "#8f78b4"; g.fillRect(0, Y(0.95), 1024, Y(0) - Y(0.95));
  g.fillStyle = "#f2ecf6"; g.fillRect(0, Y(0.98), 1024, 12); g.fillRect(0, Y(0.15), 1024, Y(0) - Y(0.15));
  g.strokeStyle = "#e8def4"; g.lineWidth = 8;
  for (const x of [60, 560]) { g.strokeRect(x, Y(3.3), 404, Y(1.3) - Y(3.3)); g.strokeRect(x, Y(0.82), 404, Y(0.25) - Y(0.82)); }
  g.strokeStyle = "rgba(90,60,130,0.35)"; g.lineWidth = 3; for (const x of [60, 560]) g.strokeRect(x + 6, Y(3.3) + 6, 404, Y(1.3) - Y(3.3));
});
export const parquetTex = () => ctex("palParquet", 1024, 1024, (g, r) => {
  const s = 128;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const base = jit(r, "#a86a3e", 0.08, 4, 0.1), hor = (i + j) % 2 === 0;
    for (let k = 0; k < 4; k++) { g.fillStyle = jit(r, base, 0.05); if (hor) g.fillRect(i * s, j * s + k * 32, s, 32); else g.fillRect(i * s + k * 32, j * s, 32, s); }
    g.strokeStyle = "rgba(50,24,10,0.45)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); if (hor) { g.moveTo(i * s, j * s + k * 32); g.lineTo(i * s + s, j * s + k * 32); } else { g.moveTo(i * s + k * 32, j * s); g.lineTo(i * s + k * 32, j * s + s); } g.stroke(); }
  }
  g.fillStyle = "rgba(40,20,8,0.5)"; for (let p = 0; p <= 1024; p += s) { g.fillRect(p - 1, 0, 2, 1024); g.fillRect(0, p - 1, 1024, 2); }
  for (let k = 0; k < 16; k++) blot(g, r() * 1024, r() * 1024, 80 + r() * 120, "rgba(255,220,170,0.1)");
});

// ---------------- materials ----------------
export const gilt = () => lamCustom("palGilt", () => twoTone(new THREE.MeshPhongMaterial({ color: "#e4ad46", emissive: "#4a3000", emissiveIntensity: 0.32, specular: "#fff0c0", shininess: 70 })));
export const silver = () => lamCustom("palSilver", () => twoTone(new THREE.MeshPhongMaterial({ color: "#d2d8e2", emissive: "#20242c", emissiveIntensity: 0.2, specular: "#ffffff", shininess: 95 })));
const crystalM = () => lamCustom("palCrystal", () => twoTone(new THREE.MeshPhongMaterial({ color: "#eef6ff", emissive: "#7a90b8", emissiveIntensity: 0.6, specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.9 })));
const waxM = () => lam("palWax", () => ({ color: "#fbf3e2" }));

// ---------------- pieces ----------------
/** crystal chandelier hanging from y = top at (x, z); returns the group, flames (for flicker) and sparkle-able bulbs */
export const chandelier = (parent: THREE.Object3D, x: number, z: number, top: number, R = 1.0, drop = 1.8, intensity = 26, dist = 16) => {
  const ch = new THREE.Group(); ch.position.set(x, top, z); parent.add(ch);
  const gold = gilt(), cr = crystalM(), cb = new Batch();
  seg(cb, V(0, 0, 0), V(0, -drop * 0.55, 0), 0.03, gold, 8);
  for (let i = 0; i < 6; i++) cb.add(new THREE.TorusGeometry(0.045, 0.012, 4, 10).rotateY(i % 2 ? Math.PI / 2 : 0).translate(0, -0.12 - i * 0.14, 0), gold);
  const yb = -drop;
  cb.add(lathe([[0, yb - 0.3], [0.06, yb - 0.27], [0.2 * R, yb - 0.12], [0.18 * R, yb + 0.02], [0.09, yb + 0.12], [0.12, yb + 0.26], [0.06, yb + 0.4], [0, yb + 0.45]], 22), gold);
  const bulbs: V3[] = [];
  const ring = (n: number, Rr: number, y: number, a0: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU, c = Math.cos(a), s = Math.sin(a);
      const pts = [[0.12, y + 0.02], [Rr * 0.45, y - 0.2], [Rr * 0.85, y - 0.14], [Rr, y]].map(([d, yy]) => V(c * d, yy, s * d));
      for (let k = 0; k < 3; k++) seg(cb, pts[k], pts[k + 1], 0.02, gold, 6);
      cb.add(lathe([[0, 0], [0.06, 0.01], [0.065, 0.05], [0.035, 0.06], [0, 0.06]], 12).translate(c * Rr, y, s * Rr), gold);
      cb.add(new THREE.CylinderGeometry(0.022, 0.022, 0.13, 10).translate(c * Rr, y + 0.12, s * Rr), waxM());
      bulbs.push([c * Rr, y + 0.24, s * Rr]);
      for (let d = 0; d < 3; d++) cb.add(new THREE.OctahedronGeometry(0.028, 0).scale(1, 1.8, 1).translate(c * Rr, y - 0.07 - d * 0.09, s * Rr), cr);
      const a2 = a0 + ((i + 1) / n) * TAU;
      for (let k = 1; k < 10; k++) { const u = k / 10, aa = a + (a2 - a) * u, rr = Rr * 0.98; cb.add(new THREE.IcosahedronGeometry(0.018, 0).translate(Math.cos(aa) * rr, y - 0.03 - Math.sin(u * Math.PI) * 0.2, Math.sin(aa) * rr), cr); }
    }
  };
  ring(8, R, yb + 0.08, 0); ring(6, R * 0.58, yb + 0.42, 0.3);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; for (let k = 0; k < 7; k++) { const u = k / 6, rr = 0.36 * R * Math.sin((0.15 + u * 0.85) * Math.PI) + 0.02; cb.add(new THREE.IcosahedronGeometry(0.02, 0).translate(Math.cos(a) * rr, yb - 0.1 - u * 0.55, Math.sin(a) * rr), cr); } }
  cb.add(new THREE.OctahedronGeometry(0.06, 0).scale(1, 2, 1).translate(0, yb - 0.78, 0), cr);
  cb.build(ch);
  const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.3) });
  const glows = bulbs.map((p) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8).scale(1, 1.5, 1), bulbM); m.position.set(...p); m.layers.set(NOINK); ch.add(m); return glow(ch, p, "#ffd08a", 0.6, 0.9); });
  glows.push(glow(ch, [0, yb + 0.1, 0], "#ffd59a", 4.2 * R, 0.55));
  const L = new THREE.PointLight("#ffd08a", intensity, dist, 1.1); L.position.set(0, yb, 0); ch.add(L);
  return { g: ch, glows, light: L, base: intensity };
};
/** five-candle gold candelabrum standing at pos (base on a table top or floor); returns flame groups */
export const candelabra = (parent: THREE.Object3D, pos: V3, s = 1, light = 2.5) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const gold = gilt(), b = new Batch();
  b.add(lathe([[0, 0], [0.14 * s, 0.01], [0.15 * s, 0.04], [0.06 * s, 0.08], [0.04 * s, 0.3 * s], [0.07 * s, 0.34 * s], [0.03 * s, 0.4 * s], [0, 0.42 * s]], 18), gold);
  const tips: V3[] = [[0, 0.62 * s, 0]];
  for (const d of [-1, 1]) for (const w of [0.16, 0.3]) {
    const xs = d * w * s, h = (0.5 - w * 0.4) * s;
    seg(b, V(0, 0.4 * s, 0), V(xs * 0.5, 0.36 * s, 0), 0.014 * s, gold, 6); seg(b, V(xs * 0.5, 0.36 * s, 0), V(xs, h, 0), 0.014 * s, gold, 6);
    tips.push([xs, h, 0]);
  }
  seg(b, V(0, 0.42 * s, 0), V(0, 0.62 * s, 0), 0.016 * s, gold, 6);
  const fl: THREE.Object3D[] = [];
  for (const [x, y, z] of tips) {
    b.add(lathe([[0, 0], [0.04 * s, 0.005], [0.045 * s, 0.025], [0, 0.03 * s]], 10).translate(x, y, z), gold);
    b.add(new THREE.CylinderGeometry(0.016 * s, 0.017 * s, 0.13 * s, 10).translate(x, y + 0.095 * s, z), waxM());
    const lg = new THREE.Group(); g.add(lg); flame(lg, [x, y + 0.165 * s, z], 0.07 * s, "#ffb35a", light, 4); fl.push(lg);
  }
  b.build(g);
  return fl;
};
/** a wall sconce (gilt back plate + 2 candles) on a wall facing `yaw` */
export const sconce = (parent: THREE.Object3D, pos: V3, yaw: number, light = 4) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const gold = gilt(), b = new Batch();
  b.add(new THREE.SphereGeometry(0.16, 16, 10).scale(0.8, 1.4, 0.25), gold);
  const fl: THREE.Object3D[] = [];
  for (const d of [-1, 1]) {
    seg(b, V(0, -0.08, 0.03), V(d * 0.12, -0.04, 0.16), 0.012, gold, 6); seg(b, V(d * 0.12, -0.04, 0.16), V(d * 0.16, 0.04, 0.2), 0.012, gold, 6);
    b.add(lathe([[0, 0], [0.04, 0.005], [0.045, 0.025], [0, 0.03]], 10).translate(d * 0.16, 0.04, 0.2), gold);
    b.add(new THREE.CylinderGeometry(0.016, 0.017, 0.12, 10).translate(d * 0.16, 0.13, 0.2), waxM());
    const lg = new THREE.Group(); g.add(lg); flame(lg, [d * 0.16, 0.2, 0.2], 0.075, "#ffb35a", light, 6); fl.push(lg);
  }
  b.build(g);
  return fl;
};
/** a hanging banner (flat plane with a gentle wave) at pos, facing +z of the group (yaw) */
export const banner = (parent: THREE.Object3D, pos: V3, yaw: number, w = 1.1, h = 2.75) => {
  const geo = new THREE.PlaneGeometry(w, h, 8, 16), p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.04 * Math.sin(p.getY(i) * 2.2 + p.getX(i) * 3));
  geo.computeVertexNormals(); geo.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(geo, lam("palBannerM", () => ({ map: bannerTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })));
  m.position.set(...pos); m.rotation.y = yaw; m.castShadow = true; m.receiveShadow = true; parent.add(m);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, w + 0.3, 8).rotateZ(Math.PI / 2), gilt()); rod.position.set(...pos); rod.rotation.y = yaw; parent.add(rod);
  for (const d of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gilt()); k.position.set(pos[0] + Math.cos(yaw) * d * (w / 2 + 0.15), pos[1], pos[2] - Math.sin(yaw) * d * (w / 2 + 0.15)); parent.add(k); }
  return m;
};
/** static folded curtain (gold velvet) hanging from yTop between u0..u1 along an axis; `side` = ±1 for x or z axis walls */
export const curtainGeo = (w: number, h: number, folds: number, amp = 0.08, pinchY = -1) => {
  const NX = 40, NY = 14, geo = new THREE.PlaneGeometry(w, h, NX, NY), p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
    const k = iy * (NX + 1) + ix, u = ix / NX, v = iy / NY, y = p.getY(k);
    const pin = pinchY >= 0 ? 1 - 0.5 * Math.exp(-(((v - pinchY) / 0.12) ** 2)) : 1;
    p.setX(k, (u - 0.5) * w * pin + (pinchY >= 0 ? -0.5 * w * (1 - pin) : 0)); p.setY(k, y - h / 2);
    p.setZ(k, amp * Math.sin(u * folds * TAU) * (pinchY >= 0 ? 1 + (1 - pin) : 1)); uv.setX(k, u * folds);
  }
  geo.computeVertexNormals(); return geo;
};
/** gilded chair with a red seat, facing +z of the group */
export const chair = (b: Batch, pos: V3, yaw: number, red: THREE.Material) => {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(...pos), gold = gilt();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => b.add(geo, mat, m);
  for (const [x, z] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]]) add(new THREE.CylinderGeometry(0.025, 0.018, 0.46, 8).translate(x, 0.23, z), gold);
  add(boxGeo(V(-0.25, 0.44, -0.24), V(0.25, 0.52, 0.24)), red);
  add(boxGeo(V(-0.26, 0.42, -0.25), V(0.26, 0.45, 0.25)), gold);
  for (const x of [-0.22, 0.22]) add(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 8).translate(x, 0.8, -0.23), gold);
  add(boxGeo(V(-0.2, 0.58, -0.25), V(0.2, 1.0, -0.21)), red);
  add(new THREE.TorusGeometry(0.22, 0.025, 6, 20, Math.PI).translate(0, 1.07, -0.23), gold);
};
/** silver platter + food; returns { food, cloche } groups so the set can reveal them */
export const dish = (parent: THREE.Object3D, pos: V3, kind: "gratin" | "mash" | "roast", s = 1) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const sv = silver(), b = new Batch();
  b.add(lathe([[0, 0], [0.42 * s, 0], [0.48 * s, 0.03 * s], [0.46 * s, 0.05 * s], [0, 0.04 * s]], 32), sv);
  const food = new THREE.Group(); g.add(food); const fb = new Batch();
  const crust = lam("palCrust", () => ({ color: "#e0a44a" })), mash = lam("palMash", () => ({ color: "#fbecc2" })), roast = lam("palRoast", () => ({ color: "#d88a3a" })), butter = lam("palButter", () => ({ color: "#ffe27a" })), herb = lam("palHerb", () => ({ color: "#4f9a3a" }));
  const pot = lam("palPot", () => ({ color: "#e7ddc8" }));
  if (kind === "gratin") {
    fb.add(boxGeo(V(-0.34 * s, 0.04 * s, -0.22 * s), V(0.34 * s, 0.16 * s, 0.22 * s)), pot);
    fb.add(boxGeo(V(-0.31 * s, 0.15 * s, -0.19 * s), V(0.31 * s, 0.19 * s, 0.19 * s)), crust);
    for (let i = 0; i < 18; i++) fb.add(new THREE.SphereGeometry(0.045 * s, 8, 6).scale(1.3, 0.45, 1).translate((((i * 37) % 11) / 10 - 0.5) * 0.5 * s, 0.19 * s, (((i * 53) % 7) / 6 - 0.5) * 0.3 * s), lam("palCrustD", () => ({ color: "#b86e2a" })));
  } else if (kind === "mash") {
    fb.add(lathe([[0, 0.04 * s], [0.36 * s, 0.05 * s], [0.3 * s, 0.2 * s], [0.2 * s, 0.38 * s], [0.1 * s, 0.5 * s], [0, 0.56 * s]], 20), mash);
    fb.add(boxGeo(V(-0.07 * s, 0.54 * s, -0.05 * s), V(0.07 * s, 0.6 * s, 0.05 * s)), butter);
    for (let i = 0; i < 6; i++) { const a = i * 1.1; fb.add(new THREE.SphereGeometry(0.02 * s, 6, 4).translate(Math.cos(a) * 0.22 * s, 0.26 * s, Math.sin(a) * 0.22 * s), herb); }
  } else {
    let i = 0; for (let ly = 0; ly < 4; ly++) { const n = [9, 6, 3, 1][ly]; for (let k = 0; k < n; k++, i++) { const a = (k / n) * TAU + ly, rr = [0.3, 0.2, 0.1, 0][ly] * s; fb.add(new THREE.SphereGeometry(0.075 * s, 10, 8).scale(1.25, 0.9, 1).translate(Math.cos(a) * rr, (0.1 + ly * 0.1) * s, Math.sin(a) * rr), roast); } }
    for (let k = 0; k < 8; k++) fb.add(new THREE.SphereGeometry(0.02 * s, 6, 4).translate(Math.cos(k) * 0.34 * s, 0.07 * s, Math.sin(k) * 0.34 * s), herb);
  }
  fb.build(food); b.build(g);
  const cloche = new THREE.Group(); g.add(cloche); const cbb = new Batch();
  cbb.add(lathe([[0.44 * s, 0], [0.43 * s, 0.12 * s], [0.36 * s, 0.34 * s], [0.22 * s, 0.5 * s], [0.06 * s, 0.56 * s], [0, 0.57 * s]], 32), sv);
  cbb.add(new THREE.SphereGeometry(0.05 * s, 10, 8).translate(0, 0.62 * s, 0), gilt());
  cbb.build(cloche);
  return { g, food, cloche };
};
