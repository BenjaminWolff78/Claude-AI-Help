// Desert kit ("Why He Put a Bridge in the Desert"): painted canvas textures and small builders for the late-1960s
// Arizona lakeshore desert (desert.ts). Everything world-side is two-tone lam()/phong; sign faces are UNLIT (readable);
// glows, dust, shimmer and crowd cards live on the NOINK layer.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rng, roofHD, beamHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { mist } from "../setkit";
import { fitText } from "./portkit_common";
import type { V3 } from "./types";

export const TAU = Math.PI * 2;
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- materials ----------------
const cache = new Map<string, THREE.Material>();
export const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
export const col = (c: string) => lam("dsC" + c, () => ({ color: c }));
export const tex = (key: string, t: () => THREE.Texture) => lam("dsT" + key, () => ({ map: t() }));
export const cut = (key: string, t: () => THREE.Texture) => mat("dsCut" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: t(), alphaTest: 0.5, side: THREE.DoubleSide })));
export const shiny = (key: string, c: string, sh = 60, spec = "#ffffff") => mat("dsSh" + key + c, () => twoTone(new THREE.MeshPhongMaterial({ color: c, specular: spec, shininess: sh })));
export const unlit = (key: string, t: () => THREE.Texture, transparent = false) => mat("dsU" + key, () => new THREE.MeshBasicMaterial({ map: t(), transparent, alphaTest: transparent ? 0.35 : 0, side: THREE.DoubleSide }));
export const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
/** draw at (x, y) and its wrapped copies so a tile repeats seamlessly */
export const wrap = (S: number, x: number, y: number, rad: number, f: (x: number, y: number) => void, H = S) => {
  for (const dx of [-S, 0, S]) for (const dy of [-H, 0, H]) { const xx = x + dx, yy = y + dy; if (xx > -rad && xx < S + rad && yy > -rad && yy < H + rad) f(xx, yy); }
};
export const rodGeo = (a: V3, c: V3, r: number, seg = 6, r2 = r) => {
  const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r2, r, A.distanceTo(C), seg);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); return geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2);
};
export const beamGeo = (a: THREE.Vector3, b: THREE.Vector3, w: number, h: number) => {
  const len = a.distanceTo(b), g = new THREE.BoxGeometry(w, h, len);
  const m = new THREE.Matrix4().lookAt(a, b, V(0, 1, 0)); g.applyMatrix4(m); const mid = a.clone().add(b).multiplyScalar(0.5); return g.translate(mid.x, mid.y, mid.z);
};
export const SANS = "900 %spx 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "900 %spx Georgia, 'Times New Roman', serif";
export const SCRIPT = "italic 900 %spx Georgia, 'Times New Roman', serif";

// ---------------- painted textures ----------------
/** desert sand (orange-pink): broad soft blotches, wind ripples, pebbles, a few scuffs (tiles every ~9 m) */
export const sandTex = () => ctex("dsSand", 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = "#eec4b0"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 34; i++) { const x = r() * S, y = r() * S, rr = 80 + r() * 220; wrap(S, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(252,220,190,0.36)" : "rgba(214,140,130,0.24)")); }
  // wind ripples: long wavy crests, light on the sun side, a violet-rose trough under them
  for (let k = 0; k < 64; k++) {
    const y0 = (k / 64) * S + r() * 6, amp = 4 + r() * 5, ph = r() * TAU, f = 1 + Math.floor(r() * 3);
    const x0 = r() * S, len = 160 + r() * 420;
    g.lineCap = "round";
    for (const [dy, c, w] of [[3, "rgba(176,104,118,0.34)", 5], [0, "rgba(255,238,214,0.6)", 2.6]] as [number, string, number][]) {
      g.strokeStyle = c; g.lineWidth = w; g.beginPath();
      for (let x = 0; x <= len; x += 8) { const xx = x0 + x, yy = y0 + dy + amp * Math.sin((TAU * f * xx) / S + ph) + 2 * Math.sin(xx * 0.05 + k); if (x === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      g.stroke();
      g.save(); g.translate(-S, 0); g.stroke(); g.restore();
    }
  }
  // pebbles (lit top, violet shadow)
  for (let i = 0; i < 260; i++) { const x = r() * S, y = r() * S, rr = 1.5 + r() * 3.5; wrap(S, x, y, rr + 2, (xx, yy) => { g.fillStyle = "rgba(150,92,104,0.45)"; g.beginPath(); g.ellipse(xx + 1.2, yy + 1.4, rr, rr * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = r() < 0.5 ? "#f2c49a" : "#c88a6c"; g.beginPath(); g.ellipse(xx, yy, rr, rr * 0.72, 0, 0, TAU); g.fill(); }); }
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,232,200,0.35)" : "rgba(170,100,90,0.18)"; g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
});
/** compacted graded street (lighter, tyre ruts along v) */
export const gradedTex = () => ctex("dsGraded", 512, 1024, (g, r) => {
  const W = 512, H = 1024;
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#e3aa82"); gr.addColorStop(0.5, "#efc29a"); gr.addColorStop(1, "#e3aa82"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H, rr = 40 + r() * 90; wrap(W, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(255,226,190,0.3)" : "rgba(196,128,104,0.18)"), H); }
  for (const u of [0.3, 0.7]) for (let y = 0; y < H; y += 2) { const x = u * W + 4 * Math.sin((y / H) * TAU * 2 + u * 9); g.fillStyle = "rgba(170,104,96,0.22)"; g.fillRect(x - 14, y, 12, 2); g.fillStyle = "rgba(255,236,206,0.32)"; g.fillRect(x + 1, y, 6, 2); }
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,236,210,0.4)" : "rgba(160,100,90,0.25)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
});
/** two-lane asphalt (u across 0..1 = 9 m, v along every 12 m): violet-grey, white edge lines, yellow dashed centre */
export const asphaltTex = (dashed = true) => ctex("dsAsph" + dashed, 512, 1024, (g, r) => {
  const W = 512, H = 1024;
  g.fillStyle = "#6e6a7a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, rr = 30 + r() * 80; wrap(W, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(140,134,150,0.35)" : "rgba(80,74,92,0.3)"), H); }
  // oil stain down the middle of each lane, worn tyre paths (lighter)
  for (const u of [0.25, 0.75]) { const gg = g.createLinearGradient((u - 0.08) * W, 0, (u + 0.08) * W, 0); gg.addColorStop(0, "rgba(0,0,0,0)"); gg.addColorStop(0.5, "rgba(60,54,70,0.35)"); gg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gg; g.fillRect((u - 0.08) * W, 0, 0.16 * W, H); }
  for (const u of [0.13, 0.37, 0.63, 0.87]) { const gg = g.createLinearGradient((u - 0.05) * W, 0, (u + 0.05) * W, 0); gg.addColorStop(0, "rgba(0,0,0,0)"); gg.addColorStop(0.5, "rgba(170,164,178,0.25)"); gg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gg; g.fillRect((u - 0.05) * W, 0, 0.1 * W, H); }
  // cracks + tar patches
  g.strokeStyle = "rgba(48,42,58,0.7)"; g.lineWidth = 2;
  for (let i = 0; i < 26; i++) { let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += (r() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(60,54,72,0.22)"; g.beginPath(); g.ellipse(r() * W, r() * H, 12 + r() * 18, 20 + r() * 34, r(), 0, TAU); g.fill(); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? "rgba(190,186,200,0.35)" : "rgba(50,44,60,0.35)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  // sand blown onto the edges
  for (const e of [0, 1]) { const gg = g.createLinearGradient(e ? W : 0, 0, e ? W - 40 : 40, 0); gg.addColorStop(0, "rgba(232,170,126,0.85)"); gg.addColorStop(1, "rgba(232,170,126,0)"); g.fillStyle = gg; g.fillRect(e ? W - 40 : 0, 0, 40, H); }
  g.fillStyle = "#f4f0e6"; for (const x of [0.055, 0.945]) g.fillRect(x * W - 5, 0, 10, H);
  if (dashed) { g.fillStyle = "#f2c230"; for (let y = 0; y < H; y += 256) g.fillRect(W / 2 - 6, y + 40, 12, 140); }
  else { g.fillStyle = "#f2c230"; g.fillRect(W / 2 - 14, 0, 9, H); g.fillRect(W / 2 + 5, 0, 9, H); }
  for (let i = 0; i < 400; i++) { g.fillStyle = "rgba(110,106,122,0.5)"; g.fillRect(r() * W, r() * H, 2, 2); } // wear on the paint
});
/** red sandstone rock (strata, cracks) */
export const rockTex = () => ctex("dsRock", 512, 512, (g, r) => {
  for (let y = 0; y < 512; y += 6 + Math.floor(r() * 18)) { g.fillStyle = ["#b8645a", "#c4705e", "#a85a56", "#cf7d64", "#9e5258"][Math.floor(r() * 5)]; g.fillRect(0, y, 512, 30); }
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 80; wrap(512, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(240,170,130,0.3)" : "rgba(110,60,80,0.25)")); }
  g.strokeStyle = "rgba(90,46,66,0.6)"; g.lineWidth = 2;
  for (let i = 0; i < 24; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += r() * 40; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,200,170,0.3)" : "rgba(100,50,60,0.25)"; g.fillRect(r() * 512, r() * 512, 2, 2); }
});
/** far mountain range face: purple-red with strata, lighter crest, hazy foot (u wraps around the ring) */
export const mountainTex = (key: string, top: string, mid: string, foot: string, strata: string) => ctex("dsMtn" + key, 2048, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.45, mid); gr.addColorStop(1, foot); g.fillStyle = gr; g.fillRect(0, 0, 2048, 512);
  for (let k = 0; k < 14; k++) { const y0 = 80 + k * 28 + r() * 10; g.strokeStyle = strata; g.globalAlpha = 0.25 + r() * 0.2; g.lineWidth = 3 + r() * 5; g.beginPath(); for (let x = 0; x <= 2048; x += 16) { const y = y0 + 6 * Math.sin(x * 0.006 + k) + 3 * Math.sin(x * 0.02 + k * 2); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  g.globalAlpha = 1;
  // gullies (vertical shade streaks) + sunlit ridges
  for (let i = 0; i < 26; i++) { const x = r() * 2048, w = 30 + r() * 60, h = 80 + r() * 160; const gg = g.createLinearGradient(x, 0, x + w, 0); gg.addColorStop(0, "rgba(70,40,90,0)"); gg.addColorStop(0.5, "rgba(70,40,90,0.16)"); gg.addColorStop(1, "rgba(70,40,90,0)"); g.fillStyle = gg; g.fillRect(x, 20 + r() * 60, w, h); }
  for (let i = 0; i < 40; i++) { const x = r() * 2048, w = 40 + r() * 90, y = 10 + r() * 40; const gg = g.createLinearGradient(x, 0, x + w, 0); gg.addColorStop(0, "rgba(255,214,190,0)"); gg.addColorStop(0.5, "rgba(255,214,190,0.2)"); gg.addColorStop(1, "rgba(255,214,190,0)"); g.fillStyle = gg; g.beginPath(); g.moveTo(x, y + 200); g.lineTo(x + w * 0.5, y); g.lineTo(x + w, y + 200); g.fill(); }
});
/** saguaro skin: vertical ribs (light / dark), spine dots */
export const cactusTex = () => ctex("dsCactus", 256, 256, (g, r) => {
  for (let i = 0; i < 16; i++) { const x = i * 16; const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "#3f7a4a"); gr.addColorStop(0.45, "#6aa45e"); gr.addColorStop(0.55, "#72ac62"); gr.addColorStop(1, "#3f7a4a"); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
  for (let i = 0; i < 16; i++) for (let y = 4; y < 256; y += 10) { g.fillStyle = "rgba(250,240,210,0.8)"; g.fillRect(i * 16 + 7, y + (i % 2) * 5, 2, 2); }
  for (let i = 0; i < 80; i++) { g.fillStyle = "rgba(40,70,40,0.25)"; g.fillRect(r() * 256, r() * 256, 1, 6 + r() * 10); }
});
/** barrel cactus ribs (horizontal stripes become meridians on a sphere) */
export const barrelTex = () => ctex("dsBarrel", 256, 128, (g) => {
  for (let i = 0; i < 20; i++) { const x = (i / 20) * 256; const gr = g.createLinearGradient(x, 0, x + 12.8, 0); gr.addColorStop(0, "#3c7448"); gr.addColorStop(0.5, "#7cb468"); gr.addColorStop(1, "#3c7448"); g.fillStyle = gr; g.fillRect(x, 0, 12.8, 128); }
  for (let i = 0; i < 20; i++) for (let y = 6; y < 128; y += 9) { g.fillStyle = "#f2c070"; g.fillRect((i / 20) * 256 + 5, y, 3, 3); }
});
/** creosote / brittlebush leaves (blotchy olive) */
export const scrubTex = () => ctex("dsScrub", 256, 256, (g, r) => {
  g.fillStyle = "#7f9a58"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) { g.fillStyle = ["#6a8648", "#93ad66", "#a3b874", "#5c7444"][Math.floor(r() * 4)]; g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 7, 0, TAU); g.fill(); }
});
/** stucco wall with a darker skirting splash and hairline cracks */
export const stuccoTex = (c: string) => ctex("dsStucco" + c, 512, 512, (g, r) => {
  g.fillStyle = c; g.fillRect(0, 0, 512, 512);
  const cc = new THREE.Color(c);
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 70; wrap(512, x, y, rr, (xx, yy) => blot(g, xx, yy, rr, r() < 0.5 ? "rgba(255,250,236,0.22)" : `rgba(${Math.round(cc.r * 160)},${Math.round(cc.g * 140)},${Math.round(cc.b * 150)},0.14)`)); }
  for (let i = 0; i < 2400; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(90,60,70,0.1)"; g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  g.strokeStyle = "rgba(110,80,90,0.35)"; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += r() * 26; g.lineTo(x, y); } g.stroke(); }
});
/** corrugated metal sheet (vertical flutes, rust streaks) */
export const tinTex = (c = "#b8b6c2") => ctex("dsTin" + c, 512, 512, (g, r) => {
  const cc = new THREE.Color(c), lt = "#" + cc.clone().lerp(new THREE.Color("#ffffff"), 0.35).getHexString(), dk = "#" + cc.clone().multiplyScalar(0.62).getHexString();
  for (let x = 0; x < 512; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, dk); gr.addColorStop(0.35, lt); gr.addColorStop(0.7, c); gr.addColorStop(1, dk); g.fillStyle = gr; g.fillRect(x, 0, 16, 512); }
  for (let i = 0; i < 16; i++) { const x = r() * 512, gg = g.createLinearGradient(0, 0, 0, 512); gg.addColorStop(0, "rgba(176,92,50,0.45)"); gg.addColorStop(1, "rgba(176,92,50,0)"); g.fillStyle = gg; g.fillRect(x, r() * 100, 3 + r() * 6, 150 + r() * 260); }
  g.fillStyle = "rgba(60,50,60,0.5)"; for (let y = 0; y < 512; y += 128) g.fillRect(0, y, 512, 3);
  for (let y = 10; y < 512; y += 128) for (let x = 8; x < 512; x += 32) { g.fillStyle = "#4a4250"; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); }
});
/** 1960s varnished wood-panel siding (station wagon sides, kiosk): horizontal grain, framed in blond trim */
export const woodPanelTex = () => ctex("dsWoodPanel", 1024, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#9a5a32"); gr.addColorStop(0.5, "#b06c3c"); gr.addColorStop(1, "#8a4c2a"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 70; i++) { const y0 = r() * 256, a = 2 + r() * 5; g.strokeStyle = r() < 0.5 ? "rgba(70,32,16,0.35)" : "rgba(210,140,90,0.3)"; g.lineWidth = 1 + r() * 2; g.beginPath(); for (let x = 0; x <= 1024; x += 16) { const y = y0 + a * Math.sin(x * 0.01 + i) + 2 * Math.sin(x * 0.043 + i * 2); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  for (let i = 0; i < 8; i++) { const x = r() * 1024, y = r() * 256; g.strokeStyle = "rgba(70,32,16,0.4)"; g.lineWidth = 1.5; for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(x, y, k * 8, k * 3, 0, 0, TAU); g.stroke(); } }
  g.fillStyle = "rgba(255,240,210,0.12)"; g.fillRect(0, 20, 1024, 30);
  // blond ash frame
  g.fillStyle = "#e8c890"; g.fillRect(0, 0, 1024, 18); g.fillRect(0, 238, 1024, 18); for (const x of [0, 500, 1006]) g.fillRect(x, 0, 18, 256);
  g.fillStyle = "rgba(150,100,50,0.5)"; g.fillRect(0, 16, 1024, 2); g.fillRect(0, 238, 1024, 2);
});
/** a window seen from outside: sky reflection, frame, venetian blinds (warm stucco houses) */
export const winTex = () => ctex("dsWin", 256, 256, (g) => {
  g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 256, 256);
  const gr = g.createLinearGradient(0, 16, 0, 240); gr.addColorStop(0, "#8fb8e4"); gr.addColorStop(0.55, "#4a6ea8"); gr.addColorStop(1, "#30487a"); g.fillStyle = gr; g.fillRect(16, 16, 224, 224);
  g.fillStyle = "rgba(240,232,210,0.85)"; for (let y = 20; y < 120; y += 9) g.fillRect(18, y, 220, 5);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(30, 236); g.lineTo(110, 130); g.lineTo(140, 130); g.lineTo(60, 236); g.fill();
  g.fillStyle = "#f4efe4"; g.fillRect(124, 16, 8, 224);
});
/** 3-colour painted sky-lit lake water strip for far shore glints is handled by waterMaterial; this is the wet shore band */
export const foamTexD = () => ctex("dsFoam", 512, 128, (g, r) => {
  g.clearRect(0, 0, 512, 128);
  for (let i = 0; i < 160; i++) { const x = r() * 512, y = 30 + r() * 70, rr = 6 + r() * 18; g.fillStyle = `rgba(255,255,255,${0.5 + r() * 0.5})`; g.beginPath(); g.ellipse(x, y, rr * 1.6, rr * 0.7, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(210,246,250,0.8)"; g.beginPath(); g.arc(r() * 512, 20 + r() * 90, 2 + r() * 4, 0, TAU); g.fill(); }
});
/** V-shaped boat wake (alpha) */
export const wakeTex = () => ctex("dsWake", 256, 512, (g, r) => {
  g.clearRect(0, 0, 256, 512);
  for (let k = 0; k < 9; k++) { const y = 20 + k * 52; const w = 30 + k * 26; g.strokeStyle = `rgba(255,255,255,${0.85 - k * 0.08})`; g.lineWidth = 7 - k * 0.5; g.beginPath(); g.moveTo(128 - w, y + 30); g.quadraticCurveTo(128, y - 10, 128 + w, y + 30); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr;
  g.beginPath(); g.moveTo(110, 0); g.lineTo(146, 0); g.lineTo(170, 512); g.lineTo(86, 512); g.closePath(); g.globalAlpha = 0.55; g.fill(); g.globalAlpha = 1;
  for (let i = 0; i < 120; i++) { const y = r() * 512, s = (y / 512) * 110; g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(128 + (r() - 0.5) * 2 * s, y, 1.5 + r() * 3, 0, TAU); g.fill(); }
});
/** heat-shimmer streaks (very low alpha, wobbled in pose) */
export const shimmerTex = () => ctex("dsShimmer", 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128);
  for (let k = 0; k < 7; k++) { const y = 20 + k * 14; g.strokeStyle = `rgba(255,255,255,${0.5 - k * 0.04})`; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 256; x += 8) { const yy = y + 3 * Math.sin(x * 0.09 + k); if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
  g.globalCompositeOperation = "destination-in"; const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.25, "rgba(0,0,0,1)"); gr.addColorStop(0.75, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
});
/** tyre-tread / crawler-track decal strip (alpha), v along the track */
export const treadTex = (kind: "tyre" | "crawler") => ctex("dsTread" + kind, 128, 512, (g) => {
  g.clearRect(0, 0, 128, 512);
  if (kind === "crawler") { for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(150,84,86,0.55)"; g.fillRect(6, y, 116, 16); g.fillStyle = "rgba(255,226,190,0.45)"; g.fillRect(6, y + 16, 116, 5); } g.fillStyle = "rgba(150,84,86,0.3)"; g.fillRect(0, 0, 6, 512); g.fillRect(122, 0, 6, 512); }
  else { g.fillStyle = "rgba(150,90,92,0.32)"; g.fillRect(30, 0, 68, 512); for (let y = 0; y < 512; y += 24) { g.fillStyle = "rgba(130,74,80,0.45)"; g.beginPath(); g.moveTo(30, y); g.lineTo(64, y + 10); g.lineTo(98, y); g.lineTo(98, y + 7); g.lineTo(64, y + 17); g.lineTo(30, y + 7); g.fill(); } }
});

// ---------------- sign / board faces (text always fits) ----------------
export type Face = { bg?: string; fg?: string; border?: string; font?: string; sub?: string; subFg?: string; star?: boolean };
export const faceTex = (key: string, lines: string[], w: number, h: number, o: Face = {}) => ctex("dsFace" + key, w, h, (g, r) => {
  g.fillStyle = o.bg ?? "#f6efdc"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(120,80,60,0.08)"; g.fillRect(r() * w, r() * h, 3 + r() * 30, 1 + r() * 3); }
  const bw = Math.max(6, Math.round(Math.min(w, h) * 0.045));
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = bw; g.strokeRect(bw * 1.2, bw * 1.2, w - bw * 2.4, h - bw * 2.4); }
  g.fillStyle = o.fg ?? "#b8282e"; g.textAlign = "center"; g.textBaseline = "middle";
  const n = lines.length + (o.sub ? 0.6 : 0), lh = (h * (o.border ? 0.74 : 0.84)) / n, top = (h - lh * n) / 2;
  lines.forEach((l, i) => fitText(g, l, w / 2, top + lh * (i + 0.55), w * (o.border ? 0.8 : 0.88), lh * 0.86, o.font ?? SANS));
  if (o.sub) { g.fillStyle = o.subFg ?? o.fg ?? "#3a2a30"; fitText(g, o.sub, w / 2, top + lh * (lines.length + 0.3), w * 0.78, lh * 0.42, SANS); }
  // weathering: faded corners + chips
  const gw = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); gw.addColorStop(0, "rgba(0,0,0,0)"); gw.addColorStop(1, "rgba(120,70,50,0.16)"); g.fillStyle = gw; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(236,226,206,0.55)"; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 5, 1 + r() * 3, r(), 0, TAU); g.fill(); }
});
/** a painted panel on posts with an unlit face. Returns the group (face toward local +z). */
export const board = (b: Batch, parent: THREE.Object3D, pos: V3, yaw: number, w: number, h: number, y0: number, face: THREE.Texture, o: { posts?: number; postCol?: string; back?: string; lamps?: boolean; catwalk?: boolean } = {}) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(...pos);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => b.add(geo.applyMatrix4(M), m);
  const post = o.postCol ? col(o.postCol) : tex("dsBeam", () => beamHD());
  const n = o.posts ?? 2;
  for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : -w / 2 + w * 0.12 + (i * (w * 0.76)) / (n - 1); add(new THREE.BoxGeometry(0.22, y0 + h * 0.85, 0.22).translate(x, (y0 + h * 0.85) / 2, -0.16), post); }
  add(boxGeo(V(-w / 2 - 0.1, y0 - 0.1, -0.12), V(w / 2 + 0.1, y0 + h + 0.1, -0.04)), col(o.back ?? "#6a5a6e"));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat("dsFaceM" + face.uuid, () => new THREE.MeshBasicMaterial({ map: face })));
  f.position.set(0, y0 + h / 2, -0.03); g.add(f);
  if (o.catwalk) { add(boxGeo(V(-w / 2, y0 - 0.25, -0.1), V(w / 2, y0 - 0.17, 0.75)), col("#7a7488")); for (let k = 0; k <= 8; k++) add(new THREE.BoxGeometry(0.03, 0.8, 0.03).translate(-w / 2 + (k * w) / 8, y0 + 0.2, 0.72), col("#7a7488")); add(new THREE.BoxGeometry(w, 0.04, 0.04).translate(0, y0 + 0.6, 0.72), col("#7a7488")); }
  if (o.lamps) for (let k = 0; k < 3; k++) { const x = -w / 3 + (k * w) / 3; add(rodGeo([x, y0 + h + 0.1, -0.08], [x, y0 + h + 0.5, 0.9], 0.03), col("#3e3a4a")); add(new THREE.ConeGeometry(0.2, 0.28, 10, 1, true).rotateX(Math.PI * 0.75).translate(x, y0 + h + 0.45, 0.95), col("#3e3a4a")); }
  return g;
};

// ---------------- desert plants + rocks ----------------
/** saguaro: ribbed column with 0-3 upturned arms, rounded tops (into a batch) */
export const saguaro = (b: Batch, x: number, y: number, z: number, h: number, seed: number) => {
  const m = tex("cactus", cactusTex), r = rng(seed * 13 + 5), R = 0.22 + h * 0.035;
  b.add(new THREE.CylinderGeometry(R, R * 1.08, h, 14).translate(x, y + h / 2, z), m);
  b.add(new THREE.SphereGeometry(R, 14, 7, 0, TAU, 0, Math.PI / 2).translate(x, y + h, z), m);
  const arms = Math.floor(r() * 3.2);
  for (let i = 0; i < arms; i++) {
    const a = r() * TAU, hy = h * (0.35 + r() * 0.3), out = 0.5 + r() * 0.5, up = h * (0.18 + r() * 0.22), ra = R * 0.72;
    const dx = Math.cos(a), dz = Math.sin(a);
    const curve = new THREE.CatmullRomCurve3([V(x, y + hy, z), V(x + dx * out * 0.7, y + hy - 0.05, z + dz * out * 0.7), V(x + dx * out, y + hy + 0.35, z + dz * out), V(x + dx * out, y + hy + up, z + dz * out)]);
    b.add(new THREE.TubeGeometry(curve, 10, ra, 10, false), m);
    b.add(new THREE.SphereGeometry(ra, 10, 6, 0, TAU, 0, Math.PI / 2).translate(x + dx * out, y + hy + up, z + dz * out), m);
  }
};
export const barrelCactus = (b: Batch, x: number, y: number, z: number, rr: number, seed: number) => {
  b.add(new THREE.SphereGeometry(rr, 16, 10).scale(1, 1.15, 1).translate(x, y + rr * 0.95, z), tex("barrel", barrelTex));
  const fl = col(seed % 2 ? "#f2c230" : "#e8534a");
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + seed; b.add(new THREE.SphereGeometry(rr * 0.16, 6, 5).translate(x + Math.cos(a) * rr * 0.22, y + rr * 2.08, z + Math.sin(a) * rr * 0.22), fl); }
};
export const pricklyPear = (b: Batch, x: number, y: number, z: number, s: number, seed: number) => {
  const m = tex("pear", () => ctex("dsPear", 128, 128, (g, r) => { g.fillStyle = "#6aa05a"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { g.fillStyle = "#e8e0b0"; g.fillRect(r() * 128, r() * 128, 2, 2); } blot(g, 50, 40, 50, "rgba(160,210,120,0.4)"); }));
  const r = rng(seed * 7 + 1);
  for (let k = 0; k < 6; k++) { const a = r() * TAU, h = 0.3 + r() * 0.5, l = 0.1 + r() * 0.3; b.add(new THREE.SphereGeometry(0.24 * s, 10, 8).scale(1, 1.3, 0.28).rotateY(a).rotateZ((r() - 0.5) * 0.8).translate(x + Math.cos(a) * l * s, y + h * s, z + Math.sin(a) * l * s), m); }
  b.add(new THREE.SphereGeometry(0.05 * s, 6, 5).translate(x, y + 0.95 * s, z), col("#d8405a"));
};
export const scrub = (b: Batch, x: number, y: number, z: number, s: number, seed: number) => {
  const m = tex("scrub", scrubTex), r = rng(seed * 5 + 9);
  for (let k = 0; k < 5; k++) { const a = r() * TAU, d = r() * 0.4 * s; b.add(new THREE.IcosahedronGeometry((0.28 + r() * 0.22) * s, 0).scale(1, 0.7, 1).translate(x + Math.cos(a) * d, y + (0.22 + r() * 0.2) * s, z + Math.sin(a) * d), m); }
  for (let k = 0; k < 4; k++) { const a = r() * TAU; b.add(rodGeo([x, y, z], [x + Math.cos(a) * 0.3 * s, y + 0.35 * s, z + Math.sin(a) * 0.3 * s], 0.025 * s, 4), col("#6a4a3e")); }
};
export const rock = (b: Batch, x: number, y: number, z: number, s: number, seed: number) => {
  const r = rng(seed * 3 + 2), geo = new THREE.DodecahedronGeometry(s, 0); geo.scale(1 + r() * 0.6, 0.55 + r() * 0.35, 1 + r() * 0.5); geo.rotateY(r() * TAU);
  b.add(geo.translate(x, y + s * 0.25, z), tex("rock", rockTex));
};

// ---------------- town pieces ----------------
/** wooden survey stake with a fluttering-orange ribbon top (static) */
export const stake = (b: Batch, x: number, y: number, z: number, seed = 0) => {
  b.add(new THREE.BoxGeometry(0.06, 0.7, 0.06).translate(x, y + 0.35, z), col("#d8b27a"));
  b.add(new THREE.BoxGeometry(0.075, 0.1, 0.075).translate(x, y + 0.66, z), col("#f06a2a"));
  b.add(new THREE.PlaneGeometry(0.22, 0.06).rotateY(hash(seed) * TAU).translate(x + 0.1, y + 0.66, z), mat("dsRibbon", () => twoTone(new THREE.MeshLambertMaterial({ color: "#ff7a30", side: THREE.DoubleSide }))));
};
/** wooden power pole with a crossarm + glass insulators; returns the wire tie points (left, right) */
export const powerPole = (b: Batch, x: number, y: number, z: number, yaw: number, h = 9): [V3, V3] => {
  const wood = tex("pole", () => ctex("dsPoleT", 128, 512, (g, r) => { g.fillStyle = "#7a5a4a"; g.fillRect(0, 0, 128, 512); for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(50,30,30,0.3)" : "rgba(200,160,130,0.2)"; g.fillRect(r() * 128, r() * 512, 2, 20 + r() * 80); } }));
  b.add(new THREE.CylinderGeometry(0.13, 0.17, h, 8).translate(x, y + h / 2, z), wood);
  const c = Math.cos(yaw), s = Math.sin(yaw), arm = beamGeo(V(x - c * 1.2, y + h - 0.6, z + s * 1.2), V(x + c * 1.2, y + h - 0.6, z - s * 1.2), 0.12, 0.14);
  b.add(arm, wood);
  const glass = shiny("insul", "#7ac8b0", 80);
  const L: V3 = [x - c * 1.05, y + h - 0.42, z + s * 1.05], R: V3 = [x + c * 1.05, y + h - 0.42, z - s * 1.05];
  for (const p of [L, R, [x, y + h - 0.42, z] as V3]) b.add(new THREE.CylinderGeometry(0.05, 0.07, 0.14, 8).translate(p[0], p[1], p[2]), glass);
  return [L, R];
};
/** sagging wire between two points (tube into a batch) */
export const wire = (b: Batch, a: V3, c: V3, sag = 0.6) => {
  const A = V(...a), C = V(...c), pts = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return A.clone().lerp(C, u).add(V(0, -sag * 4 * u * (1 - u), 0)); });
  b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.018, 3, false), col("#3a3444"));
};
/** a low 1960s ranch house (long, low-pitch roof, wide eaves, carport, picture window, chimney). Front = local +z. */
export type RanchStyle = { wall: string; trim: string; roof: string; door: string };
export const RANCH: RanchStyle[] = [
  { wall: "#f3e3c4", trim: "#3f8f9a", roof: "#8a6a5c", door: "#e2623a" },
  { wall: "#9fd6cc", trim: "#f4efe4", roof: "#7a6a7a", door: "#f2c230" },
  { wall: "#f6c6a6", trim: "#f4efe4", roof: "#8f5c4a", door: "#3f7fbf" },
  { wall: "#f2df8a", trim: "#7a5a3a", roof: "#6c7a8c", door: "#c8352e" },
  { wall: "#e8ecf2", trim: "#d86a4a", roof: "#9a7060", door: "#4aa070" },
];
export const ranchHouse = (b: Batch, x: number, y: number, z: number, yaw: number, st: RanchStyle, seed = 0, w = 13, d = 7.5) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => b.add(geo.applyMatrix4(M), m);
  const wall = tex("stucco" + st.wall, () => stuccoTex(st.wall)), trim = col(st.trim), roof = tex("roof" + st.roof, () => roofHD(st.roof)), H = 2.8;
  add(boxGeo(V(-w / 2, 0.0, -d / 2), V(w / 2, 0.35, d / 2)), col("#c9b8b0"));
  add(boxGeo(V(-w / 2 + 0.1, 0.35, -d / 2 + 0.1), V(w / 2 - 0.1, H, d / 2 - 0.1), 3), wall);
  // low-pitch roof (two slabs), wide eaves, fascia
  const pitch = 0.2, half = d / 2 + 1.0, run = half / Math.cos(pitch);
  for (const s of [-1, 1]) { const sl = new THREE.BoxGeometry(w + 1.6, 0.16, run); sl.rotateX(-s * pitch); sl.translate(0, H + 0.08 + Math.tan(pitch) * half / 2, s * half / 2); add(sl, roof); }
  add(boxGeo(V(-w / 2 - 0.8, H - 0.12, -half - 0.02), V(w / 2 + 0.8, H + 0.08, -half + 0.12)), trim);
  add(boxGeo(V(-w / 2 - 0.8, H - 0.12, half - 0.12), V(w / 2 + 0.8, H + 0.08, half + 0.02)), trim);
  // gable ends
  for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); const xx = s * (w / 2 - 0.1); g.setAttribute("position", new THREE.Float32BufferAttribute([xx, H, -d / 2, xx, H, d / 2, xx, H + Math.tan(pitch) * half, 0], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 1, 0.3], 2)); g.setIndex(s < 0 ? [0, 1, 2] : [0, 2, 1]); g.computeVertexNormals(); add(g, wall); }
  // picture window + two small windows, shutters, door, planter
  const win = tex("win", winTex);
  add(new THREE.PlaneGeometry(3.2, 1.5).translate(-2.2, 1.6, d / 2 - 0.08), win);
  add(new THREE.PlaneGeometry(1.2, 1.1).translate(3.6, 1.7, d / 2 - 0.08), win);
  for (const sx of [-1, 1]) add(boxGeo(V(3.6 + sx * 0.68 - 0.2, 1.1, d / 2 - 0.1), V(3.6 + sx * 0.68 + 0.2, 2.3, d / 2 - 0.04)), trim);
  add(boxGeo(V(0.4, 0.35, d / 2 - 0.12), V(1.4, 2.4, d / 2 - 0.04)), col(st.door));
  add(new THREE.SphereGeometry(0.05, 6, 5).translate(1.25, 1.35, d / 2 - 0.02), shiny("knob", "#e8c060", 80));
  add(boxGeo(V(-4.0, 0.35, d / 2 - 0.1), V(-0.4, 0.75, d / 2 + 0.45)), tex("brickP", () => stuccoTex("#c8845e")));
  add(new THREE.PlaneGeometry(1.0, 1.0).rotateY(-Math.PI / 2).translate(-w / 2 + 0.06, 1.7, 0), win);
  // chimney (slump block) + TV antenna
  add(boxGeo(V(w / 2 - 3.2, H, -1.8), V(w / 2 - 2.4, H + 1.6, -1.0)), tex("brickC", () => stuccoTex("#b87a62")));
  add(rodGeo([-w / 4, H + 0.4, -0.6], [-w / 4, H + 2.6, -0.6], 0.025), col("#6a6478"));
  for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(1.2 - k * 0.2, 0.03, 0.03).translate(-w / 4, H + 1.8 + k * 0.22, -0.6), col("#6a6478"));
  // carport (flat roof on thin steel posts) on the +x end
  if (seed % 2 === 0) {
    add(boxGeo(V(w / 2, H - 0.2, -d / 2 + 0.3), V(w / 2 + 4.2, H - 0.05, d / 2 + 0.6)), trim);
    for (const zz of [-d / 2 + 0.5, d / 2 + 0.4]) add(new THREE.CylinderGeometry(0.06, 0.06, H - 0.2, 6).translate(w / 2 + 4.0, (H - 0.2) / 2, zz), col("#f4efe4"));
  }
  // mailbox on a post at the curb + gravel yard + cactus garden
  add(new THREE.BoxGeometry(0.08, 1.1, 0.08).translate(w / 2 - 1, 0.55, d / 2 + 4.6), col("#e8e2d6"));
  add(new RoundedBoxGeometry(0.28, 0.24, 0.5, 2, 0.08).translate(w / 2 - 1, 1.2, d / 2 + 4.6), col("#6a7a9a"));
  add(new THREE.PlaneGeometry(w + 2, 4).rotateX(-Math.PI / 2).translate(0, 0.02, d / 2 + 2.2), tex("gravel", () => ctex("dsGravel", 256, 256, (g, r) => { g.fillStyle = "#d8b8a4"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = ["#f2dccc", "#b89484", "#c8a090", "#ecd2c0"][Math.floor(r() * 4)]; g.beginPath(); g.arc(r() * 256, r() * 256, 1.5 + r() * 2.5, 0, TAU); g.fill(); } })));
  const P = (lx: number, lz: number) => V(lx, 0, lz).applyMatrix4(M);
  { const p = P(-4.8, d / 2 + 2.4); saguaro(b, p.x, y, p.z, 2.6 + (seed % 3) * 0.6, seed + 30); }
  { const p = P(-1.2, d / 2 + 1.8); barrelCactus(b, p.x, y, p.z, 0.32, seed); }
  { const p = P(2.6, d / 2 + 2.5); pricklyPear(b, p.x, y, p.z, 1, seed); }
};
/** flat-roof storefront with a striped awning and a name board (payoff growth). Front = local +z. */
export const shop = (b: Batch, parent: THREE.Object3D, x: number, y: number, z: number, yaw: number, name: string, wallC: string, awn: [string, string], w = 9, d = 9) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => b.add(geo.applyMatrix4(M), m);
  const H = 4.2;
  add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, H, d / 2), 3), tex("stucco" + wallC, () => stuccoTex(wallC)));
  add(boxGeo(V(-w / 2 - 0.1, H, -d / 2 - 0.1), V(w / 2 + 0.1, H + 0.9, d / 2 + 0.1)), tex("stucco" + wallC, () => stuccoTex(wallC)));
  add(boxGeo(V(-w / 2 - 0.15, H + 0.85, -d / 2 - 0.15), V(w / 2 + 0.15, H + 1.0, d / 2 + 0.15)), col("#f4efe4"));
  add(new THREE.PlaneGeometry(w - 1.6, 2.2).translate(0, 1.55, d / 2 + 0.01), tex("shopWin", () => ctex("dsShopWin", 512, 256, (g) => { g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#9cc4ea"); gr.addColorStop(1, "#3a5a8e"); g.fillStyle = gr; g.fillRect(10, 10, 492, 236); g.fillStyle = "#f4efe4"; g.fillRect(250, 10, 12, 236); g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(30, 246); g.lineTo(140, 10); g.lineTo(190, 10); g.lineTo(80, 246); g.fill(); g.fillStyle = "#c8352e"; g.fillRect(270, 150, 60, 80); g.fillStyle = "#f2c230"; g.fillRect(350, 170, 50, 60); g.fillStyle = "#3aa36a"; g.fillRect(60, 160, 50, 70); })));
  // striped awning (tilted slab)
  const aw = new THREE.BoxGeometry(w - 0.4, 0.06, 1.8); aw.rotateX(0.35); aw.translate(0, 3.05, d / 2 + 0.85);
  add(aw, tex("awn" + awn[0] + awn[1], () => ctex("dsAwn" + awn[0] + awn[1], 512, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? awn[1] : awn[0]; g.fillRect(i * 64, 0, 64, 128); } g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 100, 512, 28); })));
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.0, 0.8), mat("dsShopSign" + name, () => new THREE.MeshBasicMaterial({ map: faceTex("shop" + name, [name], 768, Math.round((768 * 0.8) / (w - 1)), { bg: "#fff6e0", fg: awn[0] === "#f4efe4" ? awn[1] : awn[0], font: SERIF }) })));
  sg.position.copy(V(0, H + 0.45, d / 2 + 0.12).applyMatrix4(M)); sg.rotation.y = yaw; parent.add(sg);
};

// ---------------- ambient things ----------------
/** a tumbleweed: a tangle of thin curved twigs in a ball (group; roll it in pose) */
export const tumbleweed = (parent: THREE.Object3D, R = 0.5, seed = 3) => {
  const g = new THREE.Group(); parent.add(g);
  const b = new Batch(), r = rng(seed * 11), m = col("#b89062"), m2 = col("#8a6a4a");
  for (let k = 0; k < 26; k++) {
    const ax = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), ref = Math.abs(ax.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0), u = ax.clone().cross(ref).normalize(), w = ax.clone().cross(u);
    const a0 = r() * TAU, len = 1.2 + r() * 2.4, rr = R * (0.65 + r() * 0.35), pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * len; pts.push(u.clone().multiplyScalar(Math.cos(a) * rr).addScaledVector(w, Math.sin(a) * rr).addScaledVector(ax, (r() - 0.5) * 0.1)); }
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.012 + r() * 0.01, 3, false), k % 3 ? m : m2);
  }
  b.build(g);
  g.userData.R = R;
  return g;
};
/** the hawk: dark brown, wide fingered wings, slow circling glide (group; pose with hawkPose) */
export const hawk = (parent: THREE.Object3D) => {
  const g = new THREE.Group(); parent.add(g);
  const m = mat("dsHawk", () => new THREE.MeshBasicMaterial({ color: "#4a3036", side: THREE.DoubleSide })), m2 = mat("dsHawk2", () => new THREE.MeshBasicMaterial({ color: "#a86a4a", side: THREE.DoubleSide }));
  const wing = (s: number) => {
    const w = new THREE.Group(); w.name = s < 0 ? "L" : "R";
    const sh = new THREE.Shape(); sh.moveTo(0, 0.12); sh.lineTo(s * 0.5, 0.16); sh.lineTo(s * 0.95, 0.06); sh.lineTo(s * 1.05, -0.06); sh.lineTo(s * 0.9, -0.12); sh.lineTo(s * 0.8, -0.05); sh.lineTo(s * 0.7, -0.14); sh.lineTo(s * 0.4, -0.16); sh.lineTo(0, -0.12); sh.closePath();
    const me = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), m); w.add(me); g.add(w); return w;
  };
  wing(-1); wing(1);
  const bd = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6).scale(1, 0.8, 3.2), m2); g.add(bd);
  const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3).rotateX(-Math.PI / 2).translate(0, 0, -0.38), m2); g.add(tl);
  g.rotation.order = "YXZ"; g.scale.setScalar(1.3);
  return g;
};
export const hawkPose = (g: THREE.Group, t: number, c: V3, rad: number) => {
  const a = t * 0.16;
  g.position.set(c[0] + Math.cos(a) * rad, c[1] + Math.sin(t * 0.3) * 1.5, c[2] + Math.sin(a) * rad);
  g.rotation.set(0, -a, 0.32);
  const flap = Math.max(0, Math.sin(t * 0.55)) ** 8 * Math.sin(t * 9) * 0.45 + 0.12;
  g.children.forEach((w) => { if (w.name === "L") w.rotation.z = -flap; if (w.name === "R") w.rotation.z = flap; });
};
/** far dust devil: a stack of rotating tan mist cards in a tall funnel (NOINK) */
export const dustDevil = (parent: THREE.Object3D, pos: V3, h = 22) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const cards = Array.from({ length: 11 }, (_, i) => { const u = i / 10, m = mist(g, [0, u * h, 0], 2 + u * 7, "#f0c8a0", 0.32 - u * 0.15); m.userData = { u, h }; return m; });
  return (t: number) => { g.position.x = pos[0] + Math.sin(t * 0.11) * 6; g.position.z = pos[2] + Math.cos(t * 0.07) * 4; cards.forEach((m, i) => { const u = m.userData.u; m.position.set(Math.sin(t * 1.3 + i * 0.9) * (0.4 + u * 1.8), u * h, Math.cos(t * 1.3 + i * 0.9) * (0.4 + u * 1.8)); m.material.rotation = t * 0.8 + i; }); };
};
/** a static crowd card: a wide band of painted bean-people (white heads, plum outline, varied coats), NOINK */
export const crowdTex = (seed: number) => ctex("dsCrowd" + seed, 1024, 256, (g, r) => {
  g.clearRect(0, 0, 1024, 256);
  const coats = ["#e2453c", "#2f7fd1", "#3aa36a", "#f2c230", "#8a6ad1", "#ff7a3d", "#f4efe6", "#3a8f9a", "#d8508a", "#6a8f3a"];
  for (const row of [0, 1]) for (let x = 14 + row * 12; x < 1010; x += 24 + r() * 8) {
    const base = 248 - row * 26 - r() * 6, s = 0.9 + r() * 0.25, hw = 11 * s, hy = base - 70 * s;
    g.fillStyle = coats[Math.floor(r() * coats.length)]; g.strokeStyle = "#3a2236"; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, base - 30 * s, 13 * s, 34 * s, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#fbf7f2"; g.beginPath(); g.ellipse(x, hy, hw, hw * 1.12, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#3a2236"; g.fillRect(x - 5 * s, hy - 1, 2.2, 2.6); g.fillRect(x + 3 * s, hy - 1, 2.2, 2.6);
    g.beginPath(); g.arc(x, hy + 4 * s, 3.5 * s, 0.1, Math.PI - 0.1); g.lineWidth = 1.6; g.stroke();
    if (r() < 0.45) { g.fillStyle = ["#e8d09a", "#3a3444", "#c8352e", "#f4efe6"][Math.floor(r() * 4)]; g.fillRect(x - 13 * s, hy - hw - 2, 26 * s, 5); g.fillRect(x - 8 * s, hy - hw - 9, 16 * s, 8); }
    if (r() < 0.3) { g.strokeStyle = "#3a2236"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 10 * s, base - 46 * s); g.lineTo(x + 18 * s, hy - 14 * s); g.stroke(); }
  }
});
export const crowdCard = (parent: THREE.Object3D, pos: V3, yaw: number, w: number, h: number, seed: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), mat("dsCrowdM" + seed, () => twoTone(new THREE.MeshLambertMaterial({ map: crowdTex(seed), alphaTest: 0.4, side: THREE.DoubleSide }))));
  m.position.set(...pos); m.rotation.y = yaw; m.layers.set(NOINK); parent.add(m); return m;
};
/** a small 1960s runabout motorboat (fibreglass, stripe, windscreen, outboard) + a wake card. Forward = local +z. */
export type Boat = { g: THREE.Group; wake: THREE.Mesh; bow: THREE.Mesh };
export const motorboat = (parent: THREE.Object3D, hull: string, stripe: string, seed: number): Boat => {
  const g = new THREE.Group(); parent.add(g);
  const b = new Batch(), hm = shiny("boatH" + hull, hull, 70), st = col(stripe);
  const sh = new THREE.Shape(); sh.moveTo(-0.95, -2.4); sh.lineTo(0.95, -2.4); sh.lineTo(1.0, 0.4); sh.quadraticCurveTo(0.9, 1.9, 0, 2.6); sh.quadraticCurveTo(-0.9, 1.9, -1.0, 0.4); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.75, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2); geo.translate(0, -0.25, 0);
  b.add(geo, hm);
  b.add(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).rotateX(-Math.PI / 2).scale(1.03, 1, 1.01).translate(0, 0.28, 0), st);
  b.add(boxGeo(V(-0.78, 0.4, -2.2), V(0.78, 0.48, 0.6)), tex("boatDeck", () => beamHD()));
  b.add(new RoundedBoxGeometry(1.2, 0.35, 0.5, 2, 0.1).translate(0, 0.6, -1.5), col("#f4efe4"));
  b.add(new RoundedBoxGeometry(1.2, 0.35, 0.5, 2, 0.1).translate(0, 0.6, -0.4), col("#f4efe4"));
  const ws = new THREE.BoxGeometry(1.7, 0.45, 0.04); ws.rotateX(-0.45); ws.translate(0, 0.85, 0.75); b.add(ws, mat("dsWS", () => twoTone(new THREE.MeshPhongMaterial({ color: "#bfe6f2", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.7 }))));
  b.add(new RoundedBoxGeometry(0.42, 0.55, 0.42, 2, 0.1).translate(0, 0.75, -2.55), col(seed % 2 ? "#3a3c4c" : "#e8e2d6"));
  b.add(new THREE.BoxGeometry(0.08, 0.7, 0.14).translate(0, 0.25, -2.6), col("#3a3c4c"));
  b.add(rodGeo([0, 0.5, -2.2], [0, 1.6, -2.3], 0.02), col("#d8d8e0"));
  b.build(g);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3).translate(0.25, 0, 0), mat("dsBoatFlag" + stripe, () => twoTone(new THREE.MeshLambertMaterial({ color: stripe, side: THREE.DoubleSide })))); fl.position.set(0, 1.45, -2.3); g.add(fl);
  const wm = mat("dsWakeM", () => new THREE.MeshBasicMaterial({ map: wakeTex(), transparent: true, depthWrite: false, opacity: 0.85 }));
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(7, 14).rotateX(-Math.PI / 2).translate(0, 0, -7.4), wm); wake.layers.set(NOINK); wake.renderOrder = 3; parent.add(wake);
  const bow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6).rotateX(-Math.PI / 2), mat("dsBowFoam", () => new THREE.MeshBasicMaterial({ map: foamTexD(), transparent: true, depthWrite: false }))); bow.layers.set(NOINK); bow.renderOrder = 3; parent.add(bow);
  return { g, wake, bow };
};
