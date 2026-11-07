// Kit for the Eiffel Tower set (tower.ts): the tower profile (K-scaled real curve), riveted lattice members built as
// real 3D criss-cross girders (Batch), the live "tower brown" paint (rust / 1889 paint repainted on a canvas when the
// controls change), painted textures (frieze, lambrequin, railings, gravel, kiosk, posters, Haussmann facades,
// mansard roofs, gilded dome, flags, banner, sunburst) and small Paris props (benches, lamp posts, Morris column,
// hoop edging, flower / balloon cart, swaying chestnut trees, birds, a barge). Every key is prefixed "twr".
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, roofHD, planksHD, beamHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { leafTex, over } from "./innerkit_b";
import { stripeTex, fitText } from "./portkit_common";
import type { V3 } from "./types";

export const TAU = Math.PI * 2;
// ---------------- the profile (real Eiffel numbers x K) ----------------
export const K = 0.55;
export const Y1 = 57.6 * K, Y2 = 115.7 * K, Y3 = 276 * K, YTOP = 300 * K;
/** outer half-width of the tower at height y (exponential curve, 62.5 m real at the ground) */
export const W = (y: number) => K * (4 + 58.5 * Math.exp(-(y / K) / 88));
/** inner corner of the legs at height y (the legs meet at the second floor) */
export const I = (y: number) => { const u = y / K / 115.7; return u >= 1 ? 0 : K * 37.5 * Math.pow(1 - u, 1.3); };

const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)"));
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
};
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const canvas = (w: number, h: number, seed: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, rng(seed)); return c;
};
const rivet = (g: CanvasRenderingContext2D, x: number, y: number, rr: number) => {
  g.fillStyle = "rgba(25,12,6,0.6)"; g.beginPath(); g.arc(x + rr * 0.25, y + rr * 0.3, rr, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,226,190,0.38)"; g.beginPath(); g.arc(x - rr * 0.15, y - rr * 0.15, rr * 0.7, 0, TAU); g.fill();
};

// ---------------- live paint (rust 0..1, fair 0..1) ----------------
type Live = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; detail: HTMLCanvasElement; rust: HTMLCanvasElement };
const mkLive = (w: number, h: number, detail: HTMLCanvasElement, rust: HTMLCanvasElement): Live => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return { cv, tex, detail, rust };
};
// u = across the member, v = along it (canvas top = upper end, so rust drips run down the canvas)
const paintDetail = () => canvas(512, 1024, 11, (g, r) => {
  for (let i = 0; i < 34; i++) blot(g, r() * 512, r() * 1024, 60 + r() * 150, r() < 0.5 ? "rgba(255,225,190,0.10)" : "rgba(40,20,10,0.13)");
  for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,230,200,0.07)" : "rgba(30,15,8,0.08)"; g.fillRect(r() * 512, r() * 1024, 2 + r() * 4, 80 + r() * 300); }
  const e = g.createLinearGradient(0, 0, 512, 0);
  e.addColorStop(0, "rgba(20,10,5,0.4)"); e.addColorStop(0.07, "rgba(20,10,5,0)"); e.addColorStop(0.1, "rgba(255,230,200,0.16)"); e.addColorStop(0.2, "rgba(255,230,200,0)");
  e.addColorStop(0.9, "rgba(20,10,5,0)"); e.addColorStop(1, "rgba(20,10,5,0.4)"); g.fillStyle = e; g.fillRect(0, 0, 512, 1024);
  for (const x of [46, 466]) for (let y = 18; y < 1024; y += 34) rivet(g, x, y, 7);
  for (let k = 0; k < 3; k++) {
    const y = 100 + r() * 820; g.fillStyle = "rgba(25,12,6,0.55)"; g.fillRect(0, y, 512, 4); g.fillStyle = "rgba(255,230,200,0.2)"; g.fillRect(0, y + 4, 512, 2);
    for (let x = 90; x < 440; x += 44) { rivet(g, x, y - 16, 6); rivet(g, x, y + 20, 6); }
  }
});
const rustLayer = (w: number, h: number, n: number, seed: number) => canvas(w, h, seed, (g, r) => {
  const s = w / 512;
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = (20 + r() * 50) * s;
    for (let k = 0; k < 2 + r() * 3; k++) { // drips under the patch
      const sx = x + (r() - 0.5) * rad * 1.4, L = (80 + r() * 320) * s, gr = g.createLinearGradient(0, y, 0, y + L);
      gr.addColorStop(0, "rgba(186,96,44,0.6)"); gr.addColorStop(1, "rgba(196,98,40,0)"); g.fillStyle = gr; g.fillRect(sx, y, (3 + r() * 7) * s, L);
    }
    for (let k = 0; k < 7; k++) {
      const cx = x + (r() - 0.5) * rad, cy = y + (r() - 0.5) * rad * 0.8, rr = rad * (0.3 + r() * 0.5);
      blot(g, cx, cy, rr * 1.35, "rgba(140,58,20,0.55)");
      g.fillStyle = pick(r, ["#b8642e", "#c87436", "#a85a2c", "#cf8040"]); g.globalAlpha = 0.72; g.beginPath(); g.ellipse(cx, cy, rr * 0.7, rr * 0.55, r() * 3, 0, TAU); g.fill(); g.globalAlpha = 1;
    }
    for (let k = 0; k < 10; k++) { g.fillStyle = "rgba(90,36,14,0.7)"; g.beginPath(); g.arc(x + (r() - 0.5) * rad, y + (r() - 0.5) * rad, (1.5 + r() * 3) * s, 0, TAU); g.fill(); }
  }
  for (let i = 0; i < n * 2; i++) blot(g, r() * w, r() * h, (40 + r() * 90) * s, "rgba(160,84,40,0.12)");
});
const plateDetail = () => canvas(256, 256, 17, (g, r) => {
  for (let i = 0; i < 8; i++) blot(g, r() * 256, r() * 256, 40 + r() * 60, r() < 0.5 ? "rgba(255,225,190,0.1)" : "rgba(40,20,10,0.12)");
  g.strokeStyle = "rgba(20,10,5,0.55)"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250);
  g.strokeStyle = "rgba(255,230,200,0.22)"; g.lineWidth = 3; g.strokeRect(9, 9, 238, 238);
  for (let y = 28; y < 240; y += 33) for (let x = 28; x < 240; x += 33) rivet(g, x, y, 6.5);
});
export const PAINT = { brown: new THREE.Color("#73503f"), fair: new THREE.Color("#9c4a2e") };
export type TowerPaint = { main: THREE.MeshLambertMaterial; lace: THREE.MeshLambertMaterial; plate: THREE.MeshLambertMaterial; frieze: THREE.MeshLambertMaterial; trims: THREE.MeshLambertMaterial[]; set: (rust: number, fair: number, glow: number) => void };
let paint: TowerPaint | null = null;
export const towerPaint = (): TowerPaint => {
  if (paint) return paint;
  const L1 = mkLive(512, 1024, paintDetail(), rustLayer(512, 1024, 7, 23)), L2 = mkLive(256, 256, plateDetail(), rustLayer(256, 256, 3, 29));
  const main = lam("twrPaintMain", () => ({ map: L1.tex })), lace = lam("twrPaintLace", () => ({ map: L1.tex, color: "#ddd2cc" })), plate = lam("twrPaintPlate", () => ({ map: L2.tex, color: "#f2ebe6" }));
  const frieze = lam("twrFrieze", () => ({ map: friezeTex() }));
  const trims = [lam("twrLambrequin", () => ({ map: lambrequinTex(), alphaTest: 0.5, side: THREE.DoubleSide })), lam("twrRailing", () => ({ map: railingTex(), alphaTest: 0.5, side: THREE.DoubleSide }))];
  let last = "";
  const c = new THREE.Color(), gold = new THREE.Color("#ffb04a");
  const set = (rust: number, fair: number, gl: number) => {
    const rq = Math.round(rust * 20) / 20, fq = Math.round(fair * 20) / 20, key = rq + "|" + fq;
    if (key !== last) {
      last = key;
      c.copy(PAINT.brown).lerp(PAINT.fair, fq);
      const hex = "#" + c.getHexString();
      for (const L of [L1, L2]) {
        const g = L.cv.getContext("2d")!; g.globalAlpha = 1; g.fillStyle = hex; g.fillRect(0, 0, L.cv.width, L.cv.height);
        g.drawImage(L.detail, 0, 0);
        if (rq > 0) { g.globalAlpha = rq; g.drawImage(L.rust, 0, 0); g.globalAlpha = 1; }
        if (fq > 0) { g.globalAlpha = 0.12 * fq; g.fillStyle = "#fff0e0"; g.fillRect(0, 0, L.cv.width, L.cv.height); g.globalAlpha = 1; } // fresh gloss
        L.tex.needsUpdate = true;
      }
      const fc = new THREE.Color("#ffffff").lerp(new THREE.Color("#ffb8a0"), 0.6 * fq);
      frieze.color.copy(fc); for (const m of trims) m.color.copy(fc);
    }
    for (const m of [main, lace, plate, frieze, ...trims]) m.emissive.copy(gold).multiplyScalar(0.22 * gl);
  };
  paint = { main, lace, plate, frieze, trims, set };
  return paint;
};

// ---------------- painted textures ----------------
/** the first-floor frieze (8 m x 4.2 m): cornice, gilded name panel, a row of small arcade arches, dentils */
export const friezeTex = () => ctex("twrFriezeTex", 1024, 512, (g, r) => {
  g.fillStyle = "#6e4734"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 20; i++) blot(g, r() * 1024, r() * 512, 40 + r() * 90, r() < 0.5 ? "rgba(255,225,190,0.08)" : "rgba(30,15,8,0.1)");
  g.fillStyle = "#875a40"; g.fillRect(0, 0, 1024, 46); g.fillStyle = "rgba(20,10,5,0.5)"; g.fillRect(0, 46, 1024, 6);
  for (let x = 0; x < 1024; x += 24) { g.fillStyle = "#8e6046"; g.fillRect(x + 4, 56, 14, 18); g.fillStyle = "rgba(20,10,5,0.45)"; g.fillRect(x + 4, 72, 14, 3); }
  // gilded name band (illegible engraved names, like the 72 scientists)
  g.fillStyle = "#5a3828"; g.fillRect(0, 86, 1024, 70); g.strokeStyle = "#d9a944"; g.lineWidth = 3; g.strokeRect(6, 92, 1012, 58);
  g.fillStyle = "#e6b850";
  for (let x = 30; x < 1000; x += 128) for (let k = 0; k < 5 + r() * 3; k++) g.fillRect(x + k * 13, 112 + (r() - 0.5) * 2, 9, 18);
  // arcade: small round arches with keystones
  const aw = 64;
  for (let i = 0; i < 1024 / aw; i++) {
    const x = i * aw, cx = x + aw / 2;
    g.fillStyle = "#3e2a22"; g.beginPath(); g.moveTo(x + 10, 470); g.lineTo(x + 10, 250); g.arc(cx, 250, aw / 2 - 10, Math.PI, 0); g.lineTo(x + aw - 10, 470); g.closePath(); g.fill();
    g.strokeStyle = "#946448"; g.lineWidth = 7; g.stroke();
    g.strokeStyle = "rgba(255,230,200,0.25)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, 250, aw / 2 - 14, Math.PI, 0); g.stroke();
    g.fillStyle = "#a87850"; g.fillRect(cx - 5, 214, 10, 16);
    g.fillStyle = "rgba(130,170,230,0.25)"; g.fillRect(x + 18, 260, 8, 200);
  }
  g.fillStyle = "#875a40"; g.fillRect(0, 470, 1024, 42); g.fillStyle = "rgba(20,10,5,0.5)"; g.fillRect(0, 470, 1024, 5);
  for (let x = 16; x < 1024; x += 32) rivet(g, x, 492, 5);
});
/** scalloped iron lambrequin hung under the frieze (alpha) */
export const lambrequinTex = () => ctex("twrLambrequinTex", 512, 128, (g) => {
  const n = 8, w = 512 / n;
  g.fillStyle = "#6e4734"; g.fillRect(0, 0, 512, 34);
  for (let i = 0; i < n; i++) {
    const cx = i * w + w / 2;
    g.beginPath(); g.moveTo(i * w, 30); g.lineTo(i * w + w, 30); g.lineTo(cx + 6, 112); g.lineTo(cx - 6, 112); g.closePath(); g.fill();
    g.beginPath(); g.arc(cx, 112, 12, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) { const cx = i * w + w / 2; g.beginPath(); g.arc(cx, 58, 13, 0, TAU); g.fill(); g.beginPath(); g.arc(i * w + 10, 40, 6, 0, TAU); g.fill(); }
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "rgba(255,225,190,0.3)"; g.fillRect(0, 4, 512, 4);
});
/** gallery railing (4 m x 1.15 m): rails, balusters, a St Andrew's cross band (alpha) */
export const railingTex = () => ctex("twrRailingTex", 512, 160, (g) => {
  g.fillStyle = "#5c3c2c";
  g.fillRect(0, 0, 512, 14); g.fillRect(0, 146, 512, 14); g.fillRect(0, 96, 512, 7);
  for (let x = 0; x < 512; x += 16) g.fillRect(x, 0, 4, 160);
  g.lineWidth = 5; g.strokeStyle = "#5c3c2c";
  for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 64, 96); g.moveTo(x + 64, 14); g.lineTo(x, 96); g.stroke(); }
  g.fillStyle = "rgba(255,225,190,0.25)"; g.fillRect(0, 2, 512, 3);
});
export const gravelTex = () => ctex("twrGravel", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9c49e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) blot(g, r() * 1024, r() * 1024, 80 + r() * 200, r() < 0.5 ? "rgba(255,245,225,0.25)" : "rgba(150,120,80,0.16)");
  for (let i = 0; i < 5200; i++) {
    const x = r() * 1024, y = r() * 1024, s = 2 + r() * 5;
    g.fillStyle = pick(r, ["#c6ad84", "#e8d8b8", "#b89c74", "#efe2c8", "#a88e6a", "#d2bb92"]);
    g.beginPath(); g.ellipse(x, y, s, s * (0.6 + r() * 0.4), r() * 3, 0, TAU); g.fill();
    if (r() < 0.25) { g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x - s * 0.4, y - s * 0.4, 2, 2); }
  }
  g.strokeStyle = "rgba(140,110,70,0.12)"; g.lineWidth = 3; // faint rake lines
  for (let y = 20; y < 1024; y += 26) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + y) * 3); g.stroke(); }
});
/** Haussmann facade module: 3 window bays x 6 floors (10.5 m x 21 m), shops, balconies on 2 and 5, cornice */
export const haussTex = (style: number) => ctex("twrHauss" + style, 512, 1024, (g, r) => {
  const wall = ["#efe2c6", "#e9d8b6", "#f3e8d2", "#e4d2ae"][style % 4], shop = ["#3f5a4a", "#6a2f2a", "#2f3f5e", "#5a4632"][style % 4];
  g.fillStyle = wall; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 14; i++) blot(g, r() * 512, r() * 1024, 50 + r() * 120, r() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(120,95,60,0.08)");
  for (let y = 180; y < 1024; y += 22) { g.fillStyle = "rgba(120,95,60,0.13)"; g.fillRect(0, y, 512, 2); } // stone courses
  const fy = [880, 718, 572, 430, 290, 160]; // floor sill lines (bottom of each window), ground floor first
  // ground floor shops
  g.fillStyle = "rgba(120,95,60,0.25)"; g.fillRect(0, 850, 512, 6);
  for (let b = 0; b < 3; b++) {
    const x = 18 + b * 168; g.fillStyle = shop; g.fillRect(x, 892, 132, 132);
    g.fillStyle = "#93a6d6"; g.fillRect(x + 12, 904, 108, 80); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 22, 908, 10, 70);
    const aw = pick(r, ["#c8352e", "#2f6b4f", "#e0a83a", "#2c5aa0"]); g.fillStyle = aw; g.beginPath(); g.moveTo(x - 6, 868); g.lineTo(x + 138, 868); g.lineTo(x + 146, 900); g.lineTo(x - 14, 900); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.7)"; for (let s = 0; s < 6; s++) g.fillRect(x - 10 + s * 26, 870, 12, 30);
  }
  for (let f = 1; f < 6; f++) {
    const sill = fy[f], h = f === 5 ? 92 : 112;
    for (let b = 0; b < 3; b++) {
      const cx = 85 + b * 171, w = 70;
      g.fillStyle = "#f8f0e0"; g.fillRect(cx - w / 2 - 8, sill - h - 8, w + 16, h + 14);
      const gl = g.createLinearGradient(0, sill - h, 0, sill); gl.addColorStop(0, "#8d9cdb"); gl.addColorStop(1, "#5761a8"); g.fillStyle = gl; g.fillRect(cx - w / 2, sill - h, w, h);
      g.fillStyle = "#f8f0e0"; g.fillRect(cx - 2, sill - h, 4, h); g.fillRect(cx - w / 2, sill - h * 0.62, w, 4);
      g.fillStyle = "rgba(255,255,255,0.4)"; g.save(); g.beginPath(); g.rect(cx - w / 2, sill - h, w, h); g.clip(); g.translate(cx - 10, sill - h / 2); g.rotate(0.7); g.fillRect(-4, -h, 7, h * 2); g.restore();
      if (r() < 0.3) { g.fillStyle = pick(r, ["#f5c4c8", "#f3e3c6"]); g.fillRect(cx - w / 2, sill - h, w * 0.25, h * 0.8); }
      g.strokeStyle = "rgba(60,45,40,0.5)"; g.lineWidth = 2; g.strokeRect(cx - w / 2 - 8, sill - h - 8, w + 16, h + 14);
      g.fillStyle = "rgba(120,95,60,0.35)"; g.fillRect(cx - w / 2 - 14, sill - h - 22, w + 28, 10); // lintel hood
      if (f !== 2 && f !== 5) { g.strokeStyle = "#2a2730"; g.lineWidth = 3; g.strokeRect(cx - w / 2, sill - 26, w, 22); for (let x = cx - w / 2; x < cx + w / 2; x += 8) { g.beginPath(); g.moveTo(x, sill - 26); g.lineTo(x, sill - 4); g.stroke(); } }
    }
    if (f === 2 || f === 5) { // continuous wrought-iron balcony
      g.fillStyle = "rgba(120,95,60,0.4)"; g.fillRect(0, sill + 2, 512, 10);
      g.strokeStyle = "#26232c"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, sill - 30); g.lineTo(512, sill - 30); g.stroke();
      g.lineWidth = 2; for (let x = 4; x < 512; x += 10) { g.beginPath(); g.moveTo(x, sill - 30); g.lineTo(x, sill + 2); g.stroke(); }
      g.lineWidth = 2; for (let x = 0; x < 512; x += 40) { g.beginPath(); g.arc(x + 20, sill - 14, 9, 0, TAU); g.stroke(); }
    }
  }
  g.fillStyle = "#f6eedd"; g.fillRect(0, 0, 512, 34); g.fillStyle = "rgba(90,70,50,0.45)"; g.fillRect(0, 34, 512, 8); // cornice
  for (let x = 0; x < 512; x += 20) { g.fillStyle = "rgba(90,70,50,0.3)"; g.fillRect(x + 4, 42, 10, 10); }
});
/** blue-grey slate mansard with zinc dormers */
export const mansardTex = () => over("twrMansard", 1024, 512, roofHD("#7b879c", true), (g, r) => {
  for (let i = 0; i < 6; i++) {
    const cx = 85 + i * 171, y = 150;
    g.fillStyle = "#e8e2d4"; g.beginPath(); g.moveTo(cx - 44, y + 240); g.lineTo(cx - 44, y + 40); g.arc(cx, y + 40, 44, Math.PI, 0); g.lineTo(cx + 44, y + 240); g.closePath(); g.fill();
    g.fillStyle = "#6a76b0"; g.fillRect(cx - 30, y + 50, 60, 170); g.fillStyle = "#e8e2d4"; g.fillRect(cx - 3, y + 50, 6, 170);
    g.strokeStyle = "rgba(40,40,50,0.55)"; g.lineWidth = 3; g.strokeRect(cx - 30, y + 50, 60, 170);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(cx - 24, y + 56, 8, 150);
  }
  g.fillStyle = "#9ea7b4"; g.fillRect(0, 0, 1024, 18); g.fillStyle = "rgba(20,25,35,0.4)"; g.fillRect(0, 18, 1024, 5);
  for (let i = 0; i < 10; i++) blot(g, r() * 1024, r() * 512, 60 + r() * 90, "rgba(40,50,60,0.12)");
});
export const domeTex = () => ctex("twrDomeGilt", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#c8963a"); gr.addColorStop(0.5, "#f2cc68"); gr.addColorStop(1, "#c8963a");
  g.fillStyle = "#3f4f62"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = gr; g.fillRect(i * 32 + 2, 0, 10, 512); } // gilded ribs on dark lead
  for (let y = 40; y < 512; y += 90) for (let i = 0; i < 16; i++) { g.fillStyle = "#e9c060"; g.beginPath(); g.arc(i * 32 + 22, y, 6, 0, TAU); g.fill(); }
  for (let i = 0; i < 8; i++) blot(g, r() * 512, r() * 512, 60, "rgba(255,240,200,0.12)");
});
export const tricolourTex = () => ctex("twrTricolour", 256, 168, (g) => {
  g.fillStyle = "#2a4aa6"; g.fillRect(0, 0, 86, 168); g.fillStyle = "#f6f2ea"; g.fillRect(86, 0, 85, 168); g.fillStyle = "#d8352e"; g.fillRect(171, 0, 85, 168);
  for (let i = 0; i < 4; i++) { const gr = g.createLinearGradient(i * 64, 0, i * 64 + 64, 0); gr.addColorStop(0, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0.1)"); g.fillStyle = gr; g.fillRect(i * 64, 0, 64, 168); }
  g.strokeStyle = "rgba(60,30,40,0.5)"; g.lineWidth = 3; g.strokeRect(1, 1, 254, 166);
});
/** the 1889 banner: cream cloth, tricolour borders, gold fringe, "EXPOSITION 1889" fitted inside its frame */
export const bannerTex = () => ctex("twrBanner1889", 1024, 208, (g, r) => {
  g.fillStyle = "#f7efd8"; g.fillRect(0, 0, 1024, 208);
  for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(i * 128, 0, i * 128 + 128, 0); gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(120,90,60,0.12)"); g.fillStyle = gr; g.fillRect(i * 128, 0, 128, 208); }
  const band = (y: number) => { g.fillStyle = "#2a4aa6"; g.fillRect(0, y, 1024, 9); g.fillStyle = "#f6f2ea"; g.fillRect(0, y + 9, 1024, 7); g.fillStyle = "#d8352e"; g.fillRect(0, y + 16, 1024, 9); };
  band(6); band(166);
  g.fillStyle = "#e0b04a"; for (let x = 4; x < 1024; x += 14) { g.fillRect(x, 192, 6, 14); }
  g.strokeStyle = "#c79a3a"; g.lineWidth = 4; g.strokeRect(26, 40, 972, 120);
  g.fillStyle = "#1f3270"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "EXPOSITION  1889", 512, 102, 900, 96, "900 %spx Georgia, serif");
  for (const x of [56, 968]) { g.fillStyle = "#d8352e"; g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? 9 : 20; g.lineTo(x + Math.cos(a) * rr, 100 + Math.sin(a) * rr); } g.fill(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(120,90,60,0.05)"; g.fillRect(r() * 1024, r() * 208, 30, 2); }
});
/** sunburst: soft gold core + alternating rays (additive) */
export const burstTex = () => ctex("twrBurst", 512, 512, (g) => {
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = a0 + (TAU / n) * 0.42, gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    gr.addColorStop(0, "rgba(255,240,200,0.9)"); gr.addColorStop(0.35, "rgba(255,210,130,0.45)"); gr.addColorStop(1, "rgba(255,180,90,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 256, a0, a1); g.closePath(); g.fill();
  }
  const c = g.createRadialGradient(256, 256, 0, 256, 256, 200); c.addColorStop(0, "rgba(255,248,225,1)"); c.addColorStop(0.3, "rgba(255,220,150,0.6)"); c.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = c; g.fillRect(0, 0, 512, 512);
});

// ---------------- members ----------------
const _m = new THREE.Matrix4(), _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0), UP = V(0, 1, 0);
let barSeed = 0;
/** a box beam from a to c: w wide in the plane whose normal is nrm, d deep along nrm; texture tiled every `tile` m
 *  along it (v), random v offset so rust patches differ from member to member */
export const bar = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, w: number, d: number, nrm: THREE.Vector3, mat: THREE.Material, tile = 3) => {
  if (a.y > c.y) { const t = a; a = c; c = t; }
  const len = a.distanceTo(c); if (len < 1e-3) return;
  _y.subVectors(c, a).normalize();
  _z.copy(nrm).addScaledVector(_y, -nrm.dot(_y));
  if (_z.lengthSq() < 1e-6) { _z.set(0, 0, 1).addScaledVector(_y, -_y.z); if (_z.lengthSq() < 1e-6) _z.set(1, 0, 0); }
  _z.normalize(); _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z).setPosition((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
  const g = new THREE.BoxGeometry(w, len, d), uv = g.attributes.uv as THREE.BufferAttribute, off = ((barSeed++ * 0.6180339) % 1);
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len / tile + off);
  b.add(g, mat, _m);
};
/** a riveted lattice girder in a face plane: detail 0 = solid bar, 1 = two flanges + zigzag web, 2 = flanges + X web */
export const girder = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, w: number, d: number, nrm: THREE.Vector3, P: TowerPaint, detail: number) => {
  if (detail <= 0) { bar(b, a, c, w, d, nrm, P.main); return; }
  const dir = c.clone().sub(a), len = dir.length(); dir.normalize();
  const n = nrm.clone().addScaledVector(dir, -nrm.dot(dir)).normalize(), side = dir.clone().cross(n).normalize();
  const fw = Math.max(0.09, w * 0.2), off = w / 2 - fw / 2;
  for (const s of [-1, 1]) bar(b, a.clone().addScaledVector(side, s * off), c.clone().addScaledVector(side, s * off), fw, d, n, P.main);
  const inner = w - 2 * fw, cnt = Math.max(1, Math.round(len / (inner * (detail === 2 ? 1.25 : 0.9)))), lw = Math.max(0.045, w * 0.07);
  for (let k = 0; k < cnt; k++) {
    const p0 = a.clone().addScaledVector(dir, (len * k) / cnt), p1 = a.clone().addScaledVector(dir, (len * (k + 1)) / cnt), h = inner / 2;
    const z = k % 2 ? 1 : -1;
    bar(b, p0.clone().addScaledVector(side, z * h), p1.clone().addScaledVector(side, -z * h), lw, d * 0.55, n, P.lace, 1.5);
    if (detail === 2) bar(b, p0.clone().addScaledVector(side, -z * h), p1.clone().addScaledVector(side, z * h), lw, d * 0.55, n, P.lace, 1.5);
  }
};
/** a corner chord segment (box-section column): detail 0 solid, else 4 angles + zigzag lacing on its 4 sides */
export const chordSeg = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, s: number, P: TowerPaint, detail: number, out: THREE.Vector3) => {
  if (detail <= 0) { bar(b, a, c, s, s, out, P.main); return; }
  const dir = c.clone().sub(a), len = dir.length(); dir.normalize();
  const e1 = V(1, 0, 0).addScaledVector(dir, -dir.x).normalize(), e2 = dir.clone().cross(e1).normalize();
  const aw = s * 0.24, o = s / 2 - aw / 2;
  for (const [s1, s2] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const off = e1.clone().multiplyScalar(s1 * o).addScaledVector(e2, s2 * o);
    bar(b, a.clone().add(off), c.clone().add(off), aw, aw, e1, P.main);
  }
  const inner = s - 2 * aw, cnt = Math.max(2, Math.round(len / (inner * 1.1))), lw = Math.max(0.05, s * 0.06);
  for (const [nv, sv] of [[e1, e2], [e1.clone().negate(), e2], [e2, e1], [e2.clone().negate(), e1]] as [THREE.Vector3, THREE.Vector3][]) {
    const face = nv.clone().multiplyScalar(o);
    for (let k = 0; k < cnt; k++) {
      const z = k % 2 ? 1 : -1, p0 = a.clone().add(face).addScaledVector(dir, (len * k) / cnt), p1 = a.clone().add(face).addScaledVector(dir, (len * (k + 1)) / cnt);
      bar(b, p0.addScaledVector(sv, z * inner / 2), p1.addScaledVector(sv, -z * inner / 2), lw, aw * 0.5, nv, P.lace, 1.5);
    }
  }
};
/** riveted gusset plate centred on p in the plane with normal n (proud of the face by `lift`) */
export const plate = (b: Batch, p: THREE.Vector3, n: THREE.Vector3, size: number, lift: number, P: TowerPaint, up = UP) => {
  const nn = n.clone().normalize(), u = up.clone().addScaledVector(nn, -up.dot(nn)).normalize(), c = p.clone().addScaledVector(nn, lift);
  const g = new THREE.BoxGeometry(size, size, 0.06);
  _z.copy(nn); _y.copy(u); _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z).setPosition(c.x, c.y, c.z);
  b.add(g, P.plate, _m);
};

// ---------------- Paris buildings ----------------
const facM = (s: number) => lam("twrHaussM" + s, () => ({ map: haussTex(s) }));
const roofM = () => lam("twrMansardM", () => ({ map: mansardTex() }));
const capM = () => lam("twrRoofCap", () => ({ color: "#8994a6" }));
const chimM = () => lam("twrChim", () => ({ color: "#d9c3a0" }));
const potM = () => lam("twrPot", () => ({ color: "#b8684a" }));
/** Haussmann block: cream stone facades (3-bay modules tiled), blue-grey mansard with dormers, chimney stacks.
 *  Front faces +z before yaw. */
export const hauss = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, style: number, seed = 1) => {
  const r = rng(seed * 31 + 7), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z), f = facM(style);
  const hw = w / 2, hd = d / 2, ru = Math.max(1, Math.round(w / 10.5)), rd = Math.max(1, Math.round(d / 10.5));
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd), ru, 1), f, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd), ru, 1), f, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd), rd, 1), f, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd), rd, 1), f, m);
  const mh = 4.2, ins = 1.6, rm = roofM(), o = 0.25;
  const A = (sx: number, sz: number, y: number, k: number) => V(sx * (hw + o - k), y, sz * (hd + o - k));
  b.add(quad(A(-1, 1, h, 0), A(1, 1, h, 0), A(1, 1, h + mh, ins), A(-1, 1, h + mh, ins), ru, 1), rm, m);
  b.add(quad(A(1, -1, h, 0), A(-1, -1, h, 0), A(-1, -1, h + mh, ins), A(1, -1, h + mh, ins), ru, 1), rm, m);
  b.add(quad(A(-1, -1, h, 0), A(-1, 1, h, 0), A(-1, 1, h + mh, ins), A(-1, -1, h + mh, ins), rd, 1), rm, m);
  b.add(quad(A(1, 1, h, 0), A(1, -1, h, 0), A(1, -1, h + mh, ins), A(1, 1, h + mh, ins), rd, 1), rm, m);
  b.add(quad(A(-1, 1, h + mh, ins), A(1, 1, h + mh, ins), A(1, -1, h + mh, ins), A(-1, -1, h + mh, ins)), capM(), m);
  b.add(boxGeo(V(-hw - 0.35, h - 0.6, -hd - 0.35), V(hw + 0.35, h, hd + 0.35)), chimM(), m); // cornice
  for (let i = 0; i < 2 + Math.floor(w / 9); i++) {
    const cx = -hw + 2 + r() * (w - 4), cz = (r() - 0.5) * (d - 2 * ins - 1);
    b.add(boxGeo(V(cx - 0.9, h + mh - 0.2, cz - 0.4), V(cx + 0.9, h + mh + 1.6, cz + 0.4)), chimM(), m);
    for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 6).translate(cx - 0.5 + k * 0.5, h + mh + 1.85, cz), potM(), m);
  }
};
/** domed church (gilded ribbed dome on a colonnaded drum, lantern, spire) */
export const domeChurch = (b: Batch, x: number, z: number, s = 1) => {
  const stone = lam("twrDomeStone", () => ({ color: "#ece2cc" })), col = lam("twrDomeCol", () => ({ color: "#d9ccb0" }));
  b.add(boxGeo(V(x - 26 * s, 0, z - 26 * s), V(x + 26 * s, 20 * s, z + 26 * s)), lam("twrDomeBase", () => ({ map: haussTex(2) })));
  b.add(new THREE.CylinderGeometry(12 * s, 12.5 * s, 12 * s, 32).translate(x, 26 * s, z), stone);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; b.add(new THREE.CylinderGeometry(0.55 * s, 0.6 * s, 10 * s, 8).translate(x + Math.cos(a) * 13.3 * s, 26 * s, z + Math.sin(a) * 13.3 * s), col); }
  b.add(new THREE.CylinderGeometry(14 * s, 14 * s, 1.2 * s, 32).translate(x, 31.6 * s, z), stone);
  b.add(new THREE.SphereGeometry(11.5 * s, 32, 16, 0, TAU, 0, Math.PI / 2).scale(1, 1.35, 1).translate(x, 32 * s, z), lam("twrDomeGiltM", () => ({ map: domeTex() })));
  b.add(new THREE.CylinderGeometry(2 * s, 2.2 * s, 5 * s, 12).translate(x, 49.5 * s, z), stone);
  b.add(new THREE.ConeGeometry(1.4 * s, 9 * s, 12).translate(x, 56 * s, z), lam("twrGold", () => ({ color: "#eec258" })));
};

// ---------------- props ----------------
export const ironGreen = () => lam("twrIronGreen", () => ({ color: "#2e4a3c" }));
export const ironDark = () => lam("twrIronDark", () => ({ color: "#2c2a30" }));
/** Paris bench: green slats on cast-iron legs, facing +z before yaw */
export const bench = (b: Batch, x: number, z: number, yaw: number) => {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z), slat = lam("twrSlat", () => ({ color: "#4f7d5a" })), ir = ironDark();
  for (let i = 0; i < 4; i++) b.add(boxGeo(V(-0.95, 0.44, -0.2 + i * 0.12), V(0.95, 0.48, -0.12 + i * 0.12)), slat, m);
  for (let i = 0; i < 3; i++) b.add(new THREE.BoxGeometry(1.9, 0.08, 0.035).rotateX(-0.25).translate(0, 0.62 + i * 0.13, -0.27 - i * 0.03), slat, m);
  for (const sx of [-0.8, 0.8]) {
    b.add(boxGeo(V(sx - 0.03, 0, -0.22), V(sx + 0.03, 0.46, -0.16)), ir, m); b.add(boxGeo(V(sx - 0.03, 0, 0.14), V(sx + 0.03, 0.46, 0.2)), ir, m);
    b.add(new THREE.BoxGeometry(0.05, 0.5, 0.05).rotateX(-0.25).translate(sx, 0.7, -0.3), ir, m);
    b.add(boxGeo(V(sx - 0.03, 0.58, -0.2), V(sx + 0.03, 0.62, 0.2)), ir, m);
  }
};
/** cast-iron candelabra lamp post (glass lantern glows a little) */
export const lampPost = (b: Batch, parent: THREE.Object3D, x: number, z: number, h = 4.2) => {
  const ir = ironGreen();
  b.add(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 10).translate(x, 0.3, z), ir);
  b.add(new THREE.CylinderGeometry(0.07, 0.12, h - 0.6, 10).translate(x, 0.6 + (h - 0.6) / 2, z), ir);
  for (const y of [1.0, h - 0.5]) b.add(new THREE.TorusGeometry(0.11, 0.03, 6, 12).rotateX(Math.PI / 2).translate(x, y, z), ir);
  b.add(new THREE.CylinderGeometry(0.2, 0.12, 0.12, 8).translate(x, h + 0.05, z), ir);
  b.add(new THREE.ConeGeometry(0.28, 0.3, 8).translate(x, h + 0.75, z), ir);
  b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(x, h + 0.95, z), lam("twrGold", () => ({ color: "#eec258" })));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.5, 8).translate(x, h + 0.36, z), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2a8").multiplyScalar(1.3) }));
  glass.layers.set(NOINK); parent.add(glass);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; b.add(new THREE.BoxGeometry(0.025, 0.55, 0.025).translate(x + Math.cos(a) * 0.2, h + 0.36, z + Math.sin(a) * 0.2), ir); }
  return glow(parent, [x, h + 0.36, z], "#ffcf80", 1.4, 0.35);
};
/** low iron hoop edging along a line */
export const hoops = (b: Batch, a: V3, c: V3, step = 0.55) => {
  const A = V(...a), C = V(...c), L = A.distanceTo(C), n = Math.floor(L / step), yaw = Math.atan2(C.x - A.x, C.z - A.z) - Math.PI / 2, ir = ironGreen();
  const geo = new THREE.TorusGeometry(0.3, 0.018, 4, 10, Math.PI);
  for (let i = 0; i <= n; i++) { const p = A.clone().lerp(C, i / n), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(p.x, 0, p.z); b.add(geo, ir, m); }
};
/** Morris advertising column with invented posters */
export const posterTex = () => ctex("twrPosters", 1024, 384, (g, r) => {
  g.fillStyle = "#2e4a3c"; g.fillRect(0, 0, 1024, 384);
  const P: [string, string, string, string][] = [["#f2c94c", "#c8352e", "LE GRAND BAL", "SAMEDI"], ["#f4efe2", "#2a4aa6", "CIRQUE ETOILE", "CLOWNS"], ["#d8352e", "#fff3d6", "OPERETTE", "CE SOIR"], ["#7fb6d8", "#1f2a44", "BAINS DU LAC", "ETE 1925"]];
  P.forEach(([bg, fg, t1, t2], i) => {
    const x = 14 + i * 254, w = 226; g.fillStyle = bg; g.fillRect(x, 24, w, 336);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    fitText(g, t1, x + w / 2, 92, w - 26, 44); fitText(g, t2, x + w / 2, 300, w - 40, 34);
    g.beginPath(); g.arc(x + w / 2, 196, 46, 0, TAU); g.fill(); g.fillStyle = bg; g.beginPath(); g.arc(x + w / 2 - 14, 186, 14, 0, TAU); g.fill();
    g.strokeStyle = "rgba(40,30,30,0.35)"; g.lineWidth = 3; g.strokeRect(x, 24, w, 336);
    for (let k = 0; k < 8; k++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(x + r() * w, 24 + r() * 300, 30, 3); }
  });
});
export const morris = (b: Batch, x: number, z: number) => {
  const ir = ironGreen();
  b.add(new THREE.CylinderGeometry(0.75, 0.8, 0.4, 20).translate(x, 0.2, z), ir);
  b.add(new THREE.CylinderGeometry(0.62, 0.62, 2.6, 24).translate(x, 1.7, z), lam("twrPosterM", () => ({ map: posterTex() })));
  b.add(new THREE.CylinderGeometry(0.78, 0.66, 0.3, 20).translate(x, 3.15, z), ir);
  b.add(new THREE.SphereGeometry(0.62, 20, 8, 0, TAU, 0, Math.PI / 2).scale(1, 0.8, 1).translate(x, 3.3, z), ir);
  b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, 3.85, z), lam("twrGold", () => ({ color: "#eec258" })));
};
/** swaying chestnut tree: trunk batched, crown its own group */
export type Tree = { crown: THREE.Group; seed: number };
export const tree = (b: Batch, parent: THREE.Object3D, x: number, z: number, h: number, seed: number): Tree => {
  const r = rng(seed * 13 + 5), bark = lam("twrBark", () => ({ color: "#6e5040" })), leaf = lam("twrLeafChest", () => ({ map: leafTex("twrChest", "#5e9a46", "#82b85a", "#3f7a36") }));
  b.add(new THREE.CylinderGeometry(0.05 * h, 0.08 * h, h * 0.62, 8).translate(x, h * 0.31, z), bark);
  const crown = new THREE.Group(); crown.position.set(x, h * 0.55, z); parent.add(crown);
  const cb = new Batch(), n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const rr = h * (0.24 + r() * 0.12), a = r() * TAU, d = i === 0 ? 0 : h * 0.17;
    cb.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.85, 1).translate(Math.cos(a) * d, h * (0.18 + r() * 0.2), Math.sin(a) * d), leaf);
  }
  cb.build(crown);
  return { crown, seed };
};
export const swayTree = (tr: Tree, t: number, k = 1) => { tr.crown.rotation.set(Math.sin(t * 0.9 + tr.seed) * 0.018 * k, 0, Math.sin(t * 0.7 + tr.seed * 2) * 0.025 * k); };
/** fluttering cloth (flag / banner): a segmented plane; set(t) waves it */
export type Cloth = { m: THREE.Mesh; base: Float32Array; w: number; amp: number; seed: number };
export const cloth = (parent: THREE.Object3D, w: number, h: number, mat: THREE.Material, amp = 0.2, seed = 0, nx = 12): Cloth => {
  const g = new THREE.PlaneGeometry(w, h, nx, 3).translate(w / 2, -h / 2, 0), m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true; parent.add(m);
  return { m, base: (g.attributes.position.array as Float32Array).slice(), w, amp, seed };
};
export const wave = (c: Cloth, t: number, speed = 6) => {
  const p = c.m.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array;
  for (let i = 0; i < p.count; i++) { const x = c.base[i * 3], y = c.base[i * 3 + 1], u = x / c.w; a[i * 3 + 2] = Math.sin(t * speed - x * 2.4 + c.seed + y * 0.6) * c.amp * (0.25 + u); a[i * 3 + 1] = y - Math.abs(Math.sin(t * speed * 0.5 + x)) * c.amp * 0.15 * u; }
  p.needsUpdate = true; c.m.geometry.computeVertexNormals();
};
/** bunting: a catenary rope with triangular pennants (vertex colours), pennant tips flutter */
export type Bunting = { mesh: THREE.Mesh; tips: { i: number; base: THREE.Vector3; n: THREE.Vector3; ph: number }[] };
export const bunting = (parent: THREE.Object3D, a: V3, c: V3, sag: number, cols: string[], size = 0.55): Bunting => {
  const A = V(...a), C = V(...c), P = (u: number) => A.clone().lerp(C, u).add(V(0, -sag * 4 * u * (1 - u), 0));
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 14 }, (_, i) => P(i / 13))), 28, 0.025, 4, false), lam("twrRope", () => ({ color: "#d8c8a0" })));
  rope.castShadow = true; parent.add(rope);
  const L = A.distanceTo(C), n = Math.floor(L / (size * 1.5)), pos: number[] = [], col: number[] = [], tips: Bunting["tips"] = [];
  const side = C.clone().sub(A).cross(UP).normalize(), cc = new THREE.Color();
  for (let k = 0; k < n; k++) {
    const u0 = (k + 0.2) / n, u1 = u0 + (size / L), p0 = P(u0), p1 = P(Math.min(1, u1)), tip = p0.clone().lerp(p1, 0.5).add(V(0, -size * 1.25, 0));
    cc.set(cols[k % cols.length]);
    tips.push({ i: pos.length / 3 + 2, base: tip.clone(), n: side, ph: k * 0.7 });
    for (const p of [p0, p1, tip]) { pos.push(p.x, p.y, p.z); col.push(cc.r, cc.g, cc.b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, lam("twrPennant", () => ({ vertexColors: true, side: THREE.DoubleSide }))); mesh.castShadow = true; parent.add(mesh);
  return { mesh, tips };
};
export const flutter = (bt: Bunting, t: number) => {
  const p = bt.mesh.geometry.attributes.position as THREE.BufferAttribute;
  for (const tp of bt.tips) { const s = Math.sin(t * 5 + tp.ph) * 0.22; p.setXYZ(tp.i, tp.base.x + tp.n.x * s, tp.base.y + Math.abs(s) * 0.15, tp.base.z + tp.n.z * s); }
  p.needsUpdate = true;
};
/** dark pigeons circling (flapping) */
export const pigeons = (parent: THREE.Object3D, n: number, c: V3, rad: number, ySpread: number, s = 1, seed = 1) => {
  const r = rng(seed), m = lam("twrPigeon", () => ({ color: "#5a5e6e", side: THREE.DoubleSide })), mw = lam("twrPigeonW", () => ({ color: "#8a90a2", side: THREE.DoubleSide }));
  const list = Array.from({ length: n }, () => {
    const g = new THREE.Group();
    for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.55 * s, 0.18 * s).rotateX(-Math.PI / 2).translate(sd * 0.3 * s, 0, 0), mw); w.name = sd < 0 ? "L" : "R"; g.add(w); }
    const bd = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), m); bd.scale.set(1, 0.8, 2.2); g.add(bd);
    g.userData = { a0: r() * TAU, sp: (0.12 + r() * 0.08) * (r() < 0.2 ? -1 : 1), rr: rad * (0.75 + r() * 0.5), y: c[1] + (r() - 0.5) * ySpread, ph: r() * 10 };
    parent.add(g); return g;
  });
  return (t: number) => list.forEach((g) => {
    const u = g.userData, a = u.a0 + t * u.sp;
    g.position.set(c[0] + Math.cos(a) * u.rr, u.y + Math.sin(t * 0.6 + u.ph) * 1.2, c[2] + Math.sin(a) * u.rr);
    g.rotation.set(0, -a - (u.sp > 0 ? 0 : Math.PI), Math.sin(t * 0.5 + u.ph) * 0.25 * Math.sign(u.sp));
    const k = Math.sin(t * 9 + u.ph) * 0.7; g.children.forEach((w) => { if (w.name === "L") w.rotation.z = k; if (w.name === "R") w.rotation.z = -k; });
  });
};
/** flower + balloon seller's cart (two big wheels, striped umbrella, buckets of flowers, a bunch of balloons) */
export const cart = (b: Batch, parent: THREE.Object3D, x: number, z: number, yaw: number) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; parent.add(g);
  const cb = new Batch(), wood = lam("twrCartWood", () => ({ map: planksHD(), color: "#e8a070" })), ir = ironDark(), trim = lam("twrCartTrim", () => ({ color: "#2f5d8a" }));
  cb.add(boxGeo(V(-0.9, 0.62, -0.5), V(0.9, 0.7, 0.5), 1), wood);
  for (const sz of [-0.5, 0.46]) cb.add(boxGeo(V(-0.9, 0.7, sz), V(0.9, 1.05, sz + 0.04), 1), wood);
  for (const sx of [-0.9, 0.86]) cb.add(boxGeo(V(sx, 0.7, -0.5), V(sx + 0.04, 1.05, 0.5), 1), wood);
  cb.add(boxGeo(V(-0.92, 1.02, -0.52), V(0.92, 1.08, 0.52)), trim);
  for (const sz of [-0.58, 0.58]) cb.add(new THREE.TorusGeometry(0.52, 0.04, 6, 20).translate(-0.1, 0.52, sz), ir);
  for (const sz of [-0.58, 0.58]) for (let k = 0; k < 6; k++) cb.add(new THREE.BoxGeometry(0.03, 1.0, 0.03).rotateZ((k / 6) * Math.PI).translate(-0.1, 0.52, sz), wood);
  cb.add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6).rotateZ(Math.PI / 2).translate(-0.1, 0.52, 0), ir);
  for (const sz of [-0.35, 0.35]) cb.add(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6).rotateZ(Math.PI / 2 - 0.25).translate(1.35, 0.78, sz), wood);
  cb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6).translate(0.85, 0.3, 0), wood);
  cb.add(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6).translate(-0.4, 1.8, 0), wood);
  const zinc = lam("twrZinc", () => ({ color: "#a9b4bc" })), fl = ["#e8455a", "#f4d24a", "#f7f3e8", "#e86aa8", "#f08a3a", "#9a6ad8"];
  const fr = rng(41);
  for (let i = 0; i < 4; i++) {
    const bx = -0.62 + i * 0.4; cb.add(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 10).translate(bx, 0.85, 0.05), zinc);
    for (let k = 0; k < 9; k++) cb.add(new THREE.SphereGeometry(0.06, 6, 5).translate(bx + (fr() - 0.5) * 0.22, 1.05 + fr() * 0.14, 0.05 + (fr() - 0.5) * 0.22), lam("twrFlower" + fl[(i + k) % 6], () => ({ color: fl[(i + k) % 6] })));
    for (let k = 0; k < 5; k++) cb.add(new THREE.ConeGeometry(0.05, 0.16, 5).translate(bx + (fr() - 0.5) * 0.2, 0.98, 0.05 + (fr() - 0.5) * 0.2), lam("twrLeafG", () => ({ color: "#4f8a3a" })));
  }
  cb.build(g);
  const um = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.45, 12, 1, true), twoTone(new THREE.MeshLambertMaterial({ map: stripeTex("#f4efe2", "#d8352e", 12), side: THREE.DoubleSide })));
  um.position.set(-0.4, 2.62, 0); um.castShadow = true; g.add(um);
  // balloons on strings, tied to the cart corner
  const bg = new THREE.Group(); bg.position.set(0.8, 1.05, -0.4); g.add(bg);
  const bc = ["#e8455a", "#f4d24a", "#3a8ad8", "#5ac06a", "#f08a3a", "#b46ad8", "#e8455a", "#3ac0c0"], br = rng(7);
  const balloons: THREE.Group[] = [];
  bc.forEach((c, i) => {
    const h = 1.5 + br() * 0.9, a = (i / bc.length) * TAU, d = 0.25 + br() * 0.25, tip = V(Math.cos(a) * d, h, Math.sin(a) * d);
    const sg = new THREE.Group(); bg.add(sg);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, tip.length(), 3).translate(0, tip.length() / 2, 0), lam("twrString", () => ({ color: "#f0ece0" })));
    s.quaternion.setFromUnitVectors(UP, tip.clone().normalize()); sg.add(s);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), twoTone(new THREE.MeshPhongMaterial({ color: c, specular: "#ffffff", shininess: 70 })));
    ball.scale.set(1, 1.18, 1); ball.position.copy(tip).add(V(0, 0.2, 0)); ball.castShadow = true; sg.add(ball);
    sg.userData = { ph: br() * 10 }; balloons.push(sg);
  });
  return (t: number) => balloons.forEach((s) => { const p = s.userData.ph; s.rotation.set(Math.sin(t * 0.9 + p) * 0.06, 0, Math.sin(t * 0.7 + p * 1.3) * 0.08); });
};
/** a Seine barge (péniche) with a cabin and a little smoke stack */
export const barge = (parent: THREE.Object3D, s = 1, hullCol = "#2f3f4a") => {
  const g = new THREE.Group(); g.scale.setScalar(s); parent.add(g);
  const bb = new Batch(), hull = lam("twrBarge" + hullCol, () => ({ color: hullCol })), deck = lam("twrBargeDeck", () => ({ map: beamHD() })), cab = lam("twrBargeCab", () => ({ color: "#f2e6cc" })), red = lam("twrBargeRed", () => ({ color: "#c8352e" }));
  bb.add(boxGeo(V(-19, -0.6, -2.5), V(19, 1.0, 2.5)), hull);
  bb.add(new THREE.CylinderGeometry(2.5, 2.5, 1.6, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale(0.8, 1, 1).translate(19, 0.2, 0), hull);
  bb.add(boxGeo(V(-19, 0.98, -2.4), V(19, 1.02, 2.4), 1), red);
  bb.add(boxGeo(V(-12, 1.0, -2.0), V(10, 1.9, 2.0), 3), deck);
  bb.add(boxGeo(V(-18, 1.0, -1.8), V(-13.5, 3.4, 1.8)), cab);
  bb.add(boxGeo(V(-18.3, 3.4, -2.1), V(-13.2, 3.6, 2.1)), red);
  bb.add(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 8).translate(-15, 4.2, 0), lam("twrStack", () => ({ color: "#2c2a30" })));
  bb.build(g);
  return g;
};
