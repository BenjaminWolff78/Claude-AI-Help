// Shared toy / miniature kit for "Why He Put a Bridge in the Desert": the giant floor map (worldmap.ts) and the town
// model in the sales office (salesoffice.ts) both use these little painted models: the five-arch bridge in miniature,
// flat-roofed 1960s desert houses, tiny cars, FOR SALE / SOLD lot flags, the green roadside dinosaur, numbered granite
// blocks, cacti and palms, the toy cargo ship and the toy flatbed truck. Every model is built around its own origin
// (base at y = 0) and scaled by its size argument, so one model serves both scales.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lam, V, boxGeo, Batch } from "../build";
import { ctex, rng, jit } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { fitText } from "./portkit_common";
import { lamCustom } from "./innerkit_b";

export const TAU = Math.PI * 2;
export const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
export const center = (g: CanvasRenderingContext2D) => { g.textAlign = "center"; g.textBaseline = "middle"; };
export const noink = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };
export const phong = (key: string, p: THREE.MeshPhongMaterialParameters) => lamCustom("mk" + key, () => twoTone(new THREE.MeshPhongMaterial(p)));
/** a mesh added to a parent (shadows on) */
export const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, pos?: [number, number, number], cast = true) => {
  const me = new THREE.Mesh(geo, m); if (pos) me.position.set(...pos); me.castShadow = cast; me.receiveShadow = true; parent.add(me); return me;
};
/** rescale a geometry's uvs from shape metres to texture tiles */
export const uvMap = (geo: THREE.BufferGeometry, f: (x: number, y: number, z: number) => [number, number]) => {
  const p = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) { const [a, c] = f(p.getX(i), p.getY(i), p.getZ(i)); uv.setXY(i, a, c); }
  uv.needsUpdate = true; return geo;
};
export const smooth01 = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

// ---------------- the five-arch granite bridge in miniature ----------------
/** arch layout of the 1831 bridge, as fractions of the length: five shallow elliptical spans, the centre one largest */
const SPANW = [0.8, 0.92, 1.0, 0.92, 0.8];
const archLayout = (L: number) => {
  const pier = 0.045 * L, tot = 0.76 * L, k = tot / SPANW.reduce((a, b) => a + b, 0);
  const abut = (L - tot - 4 * pier) / 2;
  let x = -L / 2 + abut; const arches: { c: number; a: number }[] = [];
  for (const w of SPANW) { const sp = w * k; arches.push({ c: x + sp / 2, a: sp / 2 }); x += sp + pier; }
  return arches;
};
const bridgeFaceTex = (col: string) => ctex("mkBridgeFace" + col, 1024, 256, (g, r) => {
  const L = 1024, H = 256, ar = archLayout(1);
  g.fillStyle = col; g.fillRect(0, 0, L, H);
  // ashlar courses
  for (let y = 0; y < H; y += 18) { let x = (y / 18) % 2 ? -12 : 0; while (x < L) { const w = 26 + r() * 22; g.fillStyle = jit(r, col, 0.07, 4, 0.12); g.fillRect(x + 1, y + 1, w - 2, 16); x += w; } }
  g.fillStyle = "rgba(70,60,70,0.35)"; for (let y = 0; y < H; y += 18) g.fillRect(0, y, L, 2);
  // voussoir rings + spandrel shading around each arch (arch spring at 0.34 H from the base, rise 0.36 span)
  for (const a of ar) {
    const cx = (a.c + 0.5) * L, ra = a.a * L, rb = 0.72 * a.a * L * 0.5 * 2, sy = H - 0.34 * H;
    g.save(); g.strokeStyle = jit(r, col, 0.04); g.lineWidth = 22; g.beginPath(); g.ellipse(cx, sy, ra + 10, rb + 10, 0, Math.PI, TAU); g.stroke();
    g.strokeStyle = "rgba(70,60,70,0.4)"; g.lineWidth = 2; for (let k = 0; k <= 16; k++) { const t = Math.PI + (k / 16) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(t) * ra, sy + Math.sin(t) * rb); g.lineTo(cx + Math.cos(t) * (ra + 21), sy + Math.sin(t) * (rb + 21)); g.stroke(); }
    g.beginPath(); g.ellipse(cx, sy, ra + 21, rb + 21, 0, Math.PI, TAU); g.stroke(); g.restore();
  }
  // cornice band under the parapet + soft weathering
  g.fillStyle = "rgba(255,250,235,0.35)"; g.fillRect(0, 8, L, 8); g.fillStyle = "rgba(60,50,60,0.35)"; g.fillRect(0, 16, L, 3);
  for (let k = 0; k < 30; k++) blot(g, r() * L, H * 0.5 + r() * H * 0.5, 10 + r() * 30, "rgba(80,70,60,0.12)");
});
const balustradeTex = (col: string) => ctex("mkBalus" + col, 512, 64, (g) => {
  g.clearRect(0, 0, 512, 64); g.fillStyle = col; g.fillRect(0, 0, 512, 12); g.fillRect(0, 52, 512, 12);
  for (let x = 6; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 12); g.quadraticCurveTo(x - 5, 32, x, 52); g.lineTo(x + 8, 52); g.quadraticCurveTo(x + 13, 32, x + 8, 12); g.closePath(); g.fill(); }
  g.strokeStyle = "rgba(60,50,60,0.5)"; g.lineWidth = 2; g.strokeRect(0, 1, 512, 11); g.strokeRect(0, 52, 512, 11);
});
/** the five-arch bridge, length L along local x, width W along z, deck at H. Returns the group (base y = 0). */
export const tinyBridge = (parent: THREE.Object3D, L: number, o: { W?: number; H?: number; col?: string; lamps?: boolean } = {}) => {
  const W = o.W ?? 0.16 * L, H = o.H ?? 0.15 * L, col = o.col ?? "#d9cbb0", g = new THREE.Group(); parent.add(g);
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, 0); sh.lineTo(L / 2, 0); sh.lineTo(L / 2, H); sh.lineTo(-L / 2, H); sh.closePath();
  const sy = 0.34 * H;
  for (const a of archLayout(L)) {
    const rise = Math.min(0.36 * a.a, H - sy - 0.12 * H), p = new THREE.Path();
    p.moveTo(a.c - a.a, 0); p.lineTo(a.c + a.a, 0); p.lineTo(a.c + a.a, sy);
    for (let k = 1; k < 18; k++) { const t = (k / 18) * Math.PI; p.lineTo(a.c + Math.cos(t) * a.a, sy + Math.sin(t) * rise); }
    p.lineTo(a.c - a.a, sy); p.closePath(); sh.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 4 }); geo.translate(0, 0, -W / 2);
  uvMap(geo, (x, y) => [x / L + 0.5, y / H]);
  const face = lam("mkBridgeM" + col, () => ({ map: bridgeFaceTex(col) }));
  mesh(g, geo, face);
  const dk = lam("mkBridgeDeck", () => ({ color: "#8e8a92" })), cope = lam("mkBridgeCope" + col, () => ({ color: col }));
  mesh(g, boxGeo(V(-L / 2 - 0.005, H, -W / 2 - 0.006), V(L / 2 + 0.005, H + 0.012 * L, W / 2 + 0.006)), cope);
  mesh(g, boxGeo(V(-L / 2, H + 0.012 * L, -W / 2 + 0.02 * L), V(L / 2, H + 0.014 * L, W / 2 - 0.02 * L)), dk);
  const bh = 0.045 * L, bm = lamCustom("mkBalusM" + col, () => twoTone(new THREE.MeshLambertMaterial({ map: balustradeTex(col), alphaTest: 0.5, side: THREE.DoubleSide })));
  for (const s of [-1, 1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(L, bh), bm); pl.position.set(0, H + 0.012 * L + bh / 2, s * (W / 2 - 0.008 * L)); pl.castShadow = true; g.add(pl);
    uvMap(pl.geometry, (x, y) => [(x / L + 0.5) * (L / (0.2 * W + 0.06 * L)) , y / bh + 0.5]);
    for (const a of [-0.5, ...archLayout(L).map((q, i, arr) => (i < arr.length - 1 ? (q.c + q.a + arr[i + 1].c - arr[i + 1].a) / 2 / L : NaN)).filter((v) => !isNaN(v)), 0.5])
      mesh(g, boxGeo(V(a * L - 0.012 * L, H, s * (W / 2) - 0.012 * L), V(a * L + 0.012 * L, H + 0.012 * L + bh * 1.1, s * (W / 2) + 0.004 * L)), cope);
  }
  if (o.lamps !== false) for (const a of [-0.3, 0, 0.3]) for (const s of [-1, 1]) {
    mesh(g, new THREE.CylinderGeometry(0.0025 * L, 0.0035 * L, 0.09 * L, 6).translate(a * L, H + 0.012 * L + 0.045 * L + bh, s * (W / 2 - 0.008 * L)), lam("mkLampIron", () => ({ color: "#3a3446" })), undefined, false);
    mesh(g, new THREE.SphereGeometry(0.008 * L, 8, 6).translate(a * L, H + 0.012 * L + 0.09 * L + bh, s * (W / 2 - 0.008 * L)), lam("mkLampGlobe", () => ({ color: "#fff2c8" })), undefined, false);
  }
  g.userData = { L, W, H };
  return g;
};

// ---------------- 1960s desert houses ----------------
const houseFaceTex = () => ctex("mkHouseFace", 256, 128, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "rgba(0,0,0,0.06)"; for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 256, 1);
  const win = (x: number, w: number) => { g.fillStyle = "#3d4f7a"; g.fillRect(x, 40, w, 40); g.fillStyle = "rgba(190,220,255,0.55)"; g.beginPath(); g.moveTo(x, 70); g.lineTo(x + w * 0.45, 40); g.lineTo(x + w * 0.65, 40); g.lineTo(x, 80); g.fill(); g.fillStyle = "#f6f1e6"; g.fillRect(x - 4, 80, w + 8, 5); g.strokeStyle = "#2a2232"; g.lineWidth = 3; g.strokeRect(x, 40, w, 40); };
  win(22, 58); win(176, 58); g.fillStyle = "#c0603a"; g.fillRect(108, 34, 40, 94); g.strokeStyle = "#2a2232"; g.lineWidth = 3; g.strokeRect(108, 34, 40, 94); g.fillStyle = "#f2d27a"; g.beginPath(); g.arc(140, 84, 3, 0, TAU); g.fill();
  g.fillStyle = "rgba(90,60,40,0.25)"; g.fillRect(0, 118, 256, 10);
});
export const HOUSE_COLS = ["#f2e2c2", "#e9c9a0", "#cfe3dc", "#f0d0b8", "#e6dcc8", "#f4ead2", "#d9e6ea"];
/** a flat-roofed ranch house (front faces +z), size w x d x h; returned as geometry pieces in a batch */
export const tinyHouse = (b: Batch, x: number, z: number, w: number, d: number, h: number, ci: number, yaw = 0) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const wall = lam("mkHouseW" + ci, () => ({ color: HOUSE_COLS[ci % HOUSE_COLS.length] }));
  const face = lam("mkHouseF" + ci, () => ({ map: houseFaceTex(), color: HOUSE_COLS[ci % HOUSE_COLS.length] }));
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2 - 0.001)), wall, M);
  b.add(new THREE.PlaneGeometry(w, h).translate(0, h / 2, d / 2), face, M);
  b.add(new THREE.PlaneGeometry(w, h).rotateY(Math.PI).translate(0, h / 2, -d / 2), face, M);
  const roof = lam("mkHouseRoof" + (ci % 3), () => ({ color: ["#c8735a", "#8a95a8", "#e8e2d4"][ci % 3] }));
  b.add(boxGeo(V(-w / 2 - 0.12 * h, h, -d / 2 - 0.12 * h), V(w / 2 + 0.12 * h, h * 1.1, d / 2 + 0.16 * h)), roof, M);
  b.add(boxGeo(V(w * 0.15, 0, d / 2), V(w * 0.48, 0.02 * h, d / 2 + 0.35 * h)), lam("mkDrive", () => ({ color: "#b9b2a6" })), M);
};

// ---------------- tiny cars ----------------
export const tinyCar = (parent: THREE.Object3D, len: number, body: string, o: { wagon?: boolean; roof?: string } = {}) => {
  const g = new THREE.Group(); parent.add(g);
  const w = 0.42 * len, bh = 0.2 * len, bm = phong("CarBody" + body, { color: body, specular: "#ffffff", shininess: 70 });
  const glass = phong("CarGlass", { color: "#9fc6e8", emissive: "#24406a", emissiveIntensity: 0.25, specular: "#ffffff", shininess: 100 });
  const chrome = phong("CarChrome", { color: "#e6e8ee", specular: "#ffffff", shininess: 120 });
  const tyre = lam("mkTyre", () => ({ color: "#2c2834" }));
  mesh(g, new RoundedBoxGeometry(len, bh, w, 2, bh * 0.35).translate(0, 0.11 * len + bh / 2, 0), bm);
  const cl = o.wagon ? 0.66 * len : 0.46 * len, cx = o.wagon ? -0.08 * len : -0.04 * len;
  mesh(g, new RoundedBoxGeometry(cl, 0.16 * len, w * 0.9, 2, 0.04 * len).translate(cx, 0.11 * len + bh + 0.07 * len, 0), glass);
  mesh(g, new RoundedBoxGeometry(cl * 1.02, 0.03 * len, w * 0.92, 1, 0.012 * len).translate(cx, 0.11 * len + bh + 0.155 * len, 0), o.roof ? phong("CarRoof" + o.roof, { color: o.roof, shininess: 40 }) : bm);
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.012 * len, 0.16 * len, w * 0.92).translate(cx + s * cl * 0.18, 0.11 * len + bh + 0.07 * len, 0), bm, undefined, false);
  mesh(g, new THREE.BoxGeometry(0.03 * len, 0.05 * len, w * 1.02).translate(len / 2, 0.15 * len, 0), chrome);
  mesh(g, new THREE.BoxGeometry(0.03 * len, 0.05 * len, w * 1.02).translate(-len / 2, 0.15 * len, 0), chrome);
  for (const s of [-1, 1]) mesh(g, new THREE.SphereGeometry(0.03 * len, 8, 6).translate(len / 2 - 0.01 * len, 0.23 * len, s * w * 0.32), lam("mkHeadlamp", () => ({ color: "#fff4cc" })), undefined, false);
  const wheels: THREE.Mesh[] = [];
  for (const sx of [-0.31, 0.31]) for (const sz of [-1, 1]) { const wm = mesh(g, new THREE.CylinderGeometry(0.11 * len, 0.11 * len, 0.07 * len, 14).rotateX(Math.PI / 2), tyre); wm.position.set(sx * len, 0.11 * len, sz * (w / 2 - 0.02 * len)); wheels.push(wm);
    mesh(wm, new THREE.CylinderGeometry(0.055 * len, 0.055 * len, 0.074 * len, 12).rotateX(Math.PI / 2), chrome, undefined, false); }
  g.userData = { wheels, len };
  return g;
};

// ---------------- lot flags (FOR SALE / SOLD) ----------------
const lotSignTex = (sold: boolean) => ctex("mkLotSign" + sold, 128, 96, (g) => {
  g.fillStyle = sold ? "#2f8a4a" : "#f6f1e6"; g.fillRect(0, 0, 128, 96); g.strokeStyle = sold ? "#f6f1e6" : "#c8352e"; g.lineWidth = 8; g.strokeRect(5, 5, 118, 86);
  g.fillStyle = sold ? "#ffffff" : "#c8352e"; center(g);
  if (sold) fitText(g, "SOLD", 64, 50, 104, 54, "900 %spx Georgia, serif");
  else { fitText(g, "FOR", 64, 30, 90, 30, "900 %spx Georgia, serif"); fitText(g, "SALE", 64, 66, 104, 38, "900 %spx Georgia, serif"); }
});
export type LotFlag = { g: THREE.Group; set: (sold: number) => void };
/** a lot stake with a little sign on top (h = total height), faces +z */
export const lotFlag = (parent: THREE.Object3D, h: number): LotFlag => {
  const g = new THREE.Group(); parent.add(g);
  mesh(g, new THREE.CylinderGeometry(0.03 * h, 0.03 * h, h, 5).translate(0, h / 2, 0), lam("mkStake", () => ({ color: "#8a5a34" })), undefined, false);
  const sw = 0.62 * h, shh = 0.46 * h;
  const fa = new THREE.Mesh(new THREE.PlaneGeometry(sw, shh), new THREE.MeshBasicMaterial({ map: lotSignTex(false), side: THREE.DoubleSide }));
  const so = new THREE.Mesh(new THREE.PlaneGeometry(sw, shh), new THREE.MeshBasicMaterial({ map: lotSignTex(true), side: THREE.DoubleSide }));
  for (const m of [fa, so]) { m.position.set(0, h - shh / 2, 0.035 * h); g.add(m); }
  mesh(g, new THREE.BoxGeometry(sw * 1.06, shh * 1.06, 0.03 * h).translate(0, h - shh / 2, 0.012 * h), lam("mkSignBack", () => ({ color: "#efe6d2" })), undefined, false);
  const set = (s: number) => { const k = smooth01(s); fa.visible = k < 0.5; so.visible = k >= 0.5; const f = Math.abs(Math.cos(k * Math.PI)); fa.scale.x = so.scale.x = Math.max(0.05, f); };
  set(0);
  return { g, set };
};

// ---------------- the green roadside dinosaur ----------------
export const dino = (parent: THREE.Object3D, s: number, col = "#5aa84a") => {
  const g = new THREE.Group(); parent.add(g);
  const sh = new THREE.Shape();
  sh.moveTo(-1.0, 0.42); sh.quadraticCurveTo(-0.7, 0.42, -0.45, 0.5); sh.quadraticCurveTo(-0.1, 0.82, 0.25, 0.62);
  sh.quadraticCurveTo(0.42, 0.78, 0.5, 1.15); sh.quadraticCurveTo(0.54, 1.38, 0.68, 1.4); sh.quadraticCurveTo(0.84, 1.42, 0.82, 1.32);
  sh.quadraticCurveTo(0.7, 1.3, 0.62, 1.2); sh.quadraticCurveTo(0.56, 0.9, 0.46, 0.5); sh.quadraticCurveTo(0.4, 0.3, 0.2, 0.28);
  sh.quadraticCurveTo(-0.2, 0.24, -0.45, 0.32); sh.quadraticCurveTo(-0.75, 0.38, -1.0, 0.42);
  const body = new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 });
  body.translate(0, 0, -0.13); body.scale(s, s, s);
  const m = phong("Dino" + col, { color: col, specular: "#d8ffc0", shininess: 30 });
  mesh(g, body, m);
  for (const [lx, lz] of [[-0.3, -0.1], [-0.3, 0.1], [0.28, -0.1], [0.28, 0.1]]) mesh(g, new THREE.CylinderGeometry(0.07 * s, 0.085 * s, 0.4 * s, 8).translate(lx * s, 0.2 * s, lz * s), m);
  mesh(g, new THREE.SphereGeometry(0.025 * s, 8, 6).translate(0.74 * s, 1.36 * s, 0.1 * s), lam("mkDinoEye", () => ({ color: "#f6f1e6" })), undefined, false);
  for (let k = 0; k < 6; k++) { const u = k / 5; mesh(g, new THREE.ConeGeometry(0.035 * s, 0.08 * s, 4).translate((-0.35 + u * 0.75) * s, (0.62 + Math.sin(u * Math.PI) * 0.18 + (u > 0.75 ? (u - 0.75) * 1.4 : 0)) * s, 0), lam("mkDinoSpike", () => ({ color: "#e8b84a" })), undefined, false); }
  return g;
};

// ---------------- numbered granite blocks (the bridge stones as cargo) ----------------
const NUMS = ["1-14-07", "2-03-11", "3-22-05", "4-08-16", "1-31-02", "5-17-09", "2-26-13", "3-09-20"];
const stoneNumTex = (i: number) => ctex("mkStoneNum" + i, 128, 128, (g, r) => {
  g.fillStyle = "#cfc2aa"; g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 14; k++) blot(g, r() * 128, r() * 128, 10 + r() * 30, r() < 0.5 ? "rgba(255,250,235,0.3)" : "rgba(110,95,80,0.22)");
  for (let k = 0; k < 120; k++) { g.fillStyle = r() < 0.5 ? "rgba(90,80,80,0.35)" : "rgba(255,255,255,0.35)"; g.fillRect(r() * 128, r() * 128, 2, 2); }
  g.strokeStyle = "rgba(80,66,60,0.6)"; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122);
  g.fillStyle = "#f8f6f0"; center(g); fitText(g, NUMS[i % NUMS.length], 64, 66, 108, 34, "900 %spx 'DejaVu Sans', Arial, sans-serif");
});
export const stoneBlock = (parent: THREE.Object3D, s: number, i: number) => {
  const m = lam("mkStoneB" + (i % NUMS.length), () => ({ map: stoneNumTex(i) }));
  return mesh(parent, new THREE.BoxGeometry(s, s * 0.62, s * 0.7).translate(0, s * 0.31, 0), m);
};

// ---------------- little plants ----------------
export const tinyCactus = (b: Batch, x: number, z: number, h: number, seed = 1) => {
  const m = lam("mkCactus", () => ({ color: "#5f9a4a" })), r = rng(seed * 13 + 7);
  b.add(new THREE.CapsuleGeometry(0.1 * h, 0.8 * h, 4, 8).translate(x, 0.5 * h, z), m);
  for (const s of [-1, 1]) if (r() < 0.8) { const ay = (0.35 + r() * 0.25) * h; b.add(new THREE.CapsuleGeometry(0.07 * h, 0.18 * h, 3, 6).rotateZ(s * Math.PI / 2).translate(x + s * 0.17 * h, ay, z), m); b.add(new THREE.CapsuleGeometry(0.07 * h, 0.28 * h, 3, 6).translate(x + s * 0.3 * h, ay + 0.18 * h, z), m); }
};
export const tinyPalm = (b: Batch, x: number, z: number, h: number) => {
  b.add(new THREE.CylinderGeometry(0.03 * h, 0.05 * h, h, 6).translate(x, h / 2, z), lam("mkPalmTrunk", () => ({ color: "#9a7a52" })));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; b.add(new THREE.ConeGeometry(0.06 * h, 0.5 * h, 4).rotateZ(Math.PI / 2 + 0.5).rotateY(a).translate(x + Math.cos(a) * 0.2 * h, h * 0.96, z - Math.sin(a) * 0.2 * h), lam("mkPalmLeaf", () => ({ color: "#4f9a3a" }))); }
};

// ---------------- the toy cargo ship (map scene) ----------------
export type ToyShip = { g: THREE.Group; crates: THREE.Group; L: number; pose: (t: number) => void };
const hullStripeTex = () => ctex("mkHullStripe", 512, 128, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#e8462a"); gr.addColorStop(1, "#c8321e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 512, 10); g.fillStyle = "#2e2a3a"; g.fillRect(0, 100, 512, 28); // boot topping
  for (let x = 30; x < 480; x += 46) { g.fillStyle = "#2e2a3a"; g.beginPath(); g.arc(x, 34, 5, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(60,10,10,0.3)"; g.lineWidth = 2; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 100); g.stroke(); }
  for (let k = 0; k < 20; k++) blot(g, r() * 512, 60 + r() * 40, 8 + r() * 16, "rgba(90,20,20,0.15)");
  g.fillStyle = "#f6f1e6"; center(g); fitText(g, "PORT HAVEN", 380, 62, 150, 24, "900 %spx Georgia, serif");
});
export const toyShip = (parent: THREE.Object3D, L = 1.2): ToyShip => {
  const g = new THREE.Group(); parent.add(g);
  const B = 0.27 * L, D = 0.14 * L;
  // hull: a pointed-bow plan extruded down, top at deck level D
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, -B / 2); sh.lineTo(L * 0.22, -B / 2); sh.quadraticCurveTo(L * 0.44, -B / 2, L / 2, 0); sh.quadraticCurveTo(L * 0.44, B / 2, L * 0.22, B / 2); sh.lineTo(-L / 2, B / 2); sh.quadraticCurveTo(-L / 2 - 0.04 * L, 0, -L / 2, -B / 2);
  const hg = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: true, bevelThickness: 0.012 * L, bevelSize: 0.012 * L, bevelSegments: 2, curveSegments: 12 });
  hg.rotateX(-Math.PI / 2); // extrude along +y
  // uv: u along the length, v up the side (texture: red hull, white sheer line on top, dark boot topping below)
  uvMap(hg, (x, y) => [x / L + 0.5, 1 - y / D]);
  const hullM = lam("mkHullM", () => ({ map: hullStripeTex() }));
  mesh(g, hg, hullM);
  const deck = lam("mkShipDeck", () => ({ color: "#b98a5a" })), white = phong("ShipWhite", { color: "#f4f1ea", specular: "#ffffff", shininess: 50 });
  mesh(g, new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, D + 0.013 * L, 0), deck, undefined, false);
  // bulwark rail
  const rail = lam("mkShipRail", () => ({ color: "#f4f1ea" }));
  for (const s of [-1, 1]) mesh(g, boxGeo(V(-L / 2 + 0.02 * L, D + 0.012 * L, s * B / 2 - 0.008 * L), V(L * 0.3, D + 0.04 * L, s * B / 2 + 0.004 * L)), rail, undefined, false);
  // bridge house at the stern (white, windows), funnel with a band
  const bx0 = -L / 2 + 0.04 * L, bx1 = -L / 2 + 0.24 * L;
  mesh(g, boxGeo(V(bx0, D, -B * 0.4), V(bx1, D + 0.12 * L, B * 0.4)), white);
  mesh(g, boxGeo(V(bx0 + 0.02 * L, D + 0.12 * L, -B * 0.46), V(bx1 - 0.01 * L, D + 0.19 * L, B * 0.46)), white);
  mesh(g, boxGeo(V(bx0 + 0.015 * L, D + 0.19 * L, -B * 0.48), V(bx1, D + 0.205 * L, B * 0.48)), lam("mkShipRoof", () => ({ color: "#2e5a7a" })));
  const winM = new THREE.MeshBasicMaterial({ color: "#2a3a5e" });
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.028 * L, 0.028 * L), winM); w.position.set(bx0 + 0.04 * L + k * 0.045 * L, D + 0.155 * L, s * (B * 0.46 + 0.001)); w.rotation.y = s > 0 ? 0 : Math.PI; g.add(w); }
  for (let k = 0; k < 5; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.028 * L, 0.03 * L), winM); w.position.set(bx1 - 0.009 * L, D + 0.155 * L, (k - 2) * 0.05 * L); w.rotation.y = Math.PI / 2; g.add(w); }
  mesh(g, new THREE.CylinderGeometry(0.04 * L, 0.046 * L, 0.12 * L, 14).translate(bx0 + 0.07 * L, D + 0.26 * L, 0), lam("mkFunnel", () => ({ color: "#2c2a38" })));
  mesh(g, new THREE.CylinderGeometry(0.0465 * L, 0.0465 * L, 0.035 * L, 14).translate(bx0 + 0.07 * L, D + 0.245 * L, 0), lam("mkFunnelBand", () => ({ color: "#f2c230" })), undefined, false);
  // foremast with derricks + a forecastle
  mesh(g, new THREE.CylinderGeometry(0.008 * L, 0.01 * L, 0.3 * L, 6).translate(L * 0.3, D + 0.15 * L, 0), white);
  mesh(g, new THREE.CylinderGeometry(0.005 * L, 0.005 * L, 0.24 * L, 5).rotateZ(1.1).translate(L * 0.2, D + 0.13 * L, 0), white);
  mesh(g, boxGeo(V(L * 0.34, D, -B * 0.42), V(L * 0.46, D + 0.035 * L, B * 0.42)), white);
  // cargo: numbered granite blocks in two stacks on the well deck
  const crates = new THREE.Group(); crates.position.set(-0.02 * L, D + 0.013 * L, 0); g.add(crates);
  let i = 0; const s = 0.085 * L;
  for (const cx of [-0.2, -0.08, 0.04, 0.16]) for (const cz of [-0.06, 0.06]) { const st = stoneBlock(crates, s, i++); st.position.set(cx * L, 0, cz * L); st.rotation.y = (i % 3 - 1) * 0.05; }
  for (const cx of [-0.14, 0.0, 0.12]) { const st = stoneBlock(crates, s, i++); st.position.set(cx * L, s * 0.62, ((i % 2) - 0.5) * 0.05 * L); st.rotation.y = (i % 2) * 0.12 - 0.06; }
  // smoke puff from the funnel (soft card)
  const smoke = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("mkSmoke", 128, 128, (q) => { blot(q, 64, 64, 60, "rgba(255,255,255,0.8)"); }), color: "#e8e4ee", transparent: true, opacity: 0.6, depthWrite: false }));
  smoke.position.set(bx0 + 0.07 * L, D + 0.38 * L, 0); smoke.scale.setScalar(0.12 * L); smoke.layers.set(NOINK); g.add(smoke);
  return { g, crates, L, pose: (t) => { const u = (t * 0.6) % 1; smoke.position.set(bx0 + 0.07 * L - u * 0.12 * L, D + (0.36 + u * 0.18) * L, 0); smoke.scale.setScalar((0.08 + u * 0.12) * L); smoke.material.opacity = 0.55 * Math.sin(Math.PI * u); } };
};

// ---------------- the toy flatbed truck (map scene) ----------------
export type ToyTruck = { g: THREE.Group; bed: THREE.Group; wheels: THREE.Mesh[]; L: number };
export const toyTruck = (parent: THREE.Object3D, L = 1.0, cab = "#2f8fb8"): ToyTruck => {
  const g = new THREE.Group(); parent.add(g);
  const W = 0.3 * L, cabM = phong("TruckCab" + cab, { color: cab, specular: "#ffffff", shininess: 60 });
  const chrome = phong("CarChrome", { color: "#e6e8ee", specular: "#ffffff", shininess: 120 }), tyre = lam("mkTyre", () => ({ color: "#2c2834" }));
  const glass = phong("CarGlass", { color: "#9fc6e8", emissive: "#24406a", emissiveIntensity: 0.25, specular: "#ffffff", shininess: 100 });
  const wr = 0.075 * L, ch = wr * 1.05;
  // chassis + bed (wooden planks) + stake sides
  mesh(g, boxGeo(V(-L / 2, ch, -W * 0.36), V(L * 0.3, ch + 0.04 * L, W * 0.36)), lam("mkChassis", () => ({ color: "#2e2a36" })));
  const bed = new THREE.Group(); bed.position.set(-0.12 * L, ch + 0.04 * L, 0); g.add(bed);
  mesh(bed, boxGeo(V(-0.36 * L, 0, -W / 2), V(0.38 * L, 0.025 * L, W / 2)), lam("mkBedWood", () => ({ color: "#b07a48" })));
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) mesh(bed, boxGeo(V(-0.35 * L + k * 0.14 * L, 0.025 * L, s * W / 2 - 0.006 * L), V(-0.33 * L + k * 0.14 * L, 0.09 * L, s * W / 2 + 0.006 * L)), lam("mkStakes", () => ({ color: "#8a5a34" })), undefined, false);
  // cab: rounded hood + cabin
  const cx = 0.38 * L;
  mesh(g, new RoundedBoxGeometry(0.2 * L, 0.13 * L, W * 0.92, 2, 0.03 * L).translate(cx + 0.02 * L, ch + 0.1 * L, 0), cabM);
  mesh(g, new RoundedBoxGeometry(0.16 * L, 0.2 * L, W * 0.96, 2, 0.035 * L).translate(cx - 0.1 * L, ch + 0.14 * L, 0), cabM);
  mesh(g, new RoundedBoxGeometry(0.1 * L, 0.08 * L, W * 0.98, 1, 0.015 * L).translate(cx - 0.085 * L, ch + 0.19 * L, 0), glass, undefined, false);
  mesh(g, new THREE.BoxGeometry(0.03 * L, 0.06 * L, W).translate(cx + 0.12 * L, ch + 0.06 * L, 0), chrome);
  for (const s of [-1, 1]) mesh(g, new THREE.SphereGeometry(0.022 * L, 8, 6).translate(cx + 0.12 * L, ch + 0.11 * L, s * W * 0.33), lam("mkHeadlamp", () => ({ color: "#fff4cc" })), undefined, false);
  const wheels: THREE.Mesh[] = [];
  for (const sx of [0.36, -0.12, -0.3]) for (const sz of [-1, 1]) { const wm = mesh(g, new THREE.CylinderGeometry(wr, wr, 0.05 * L, 16).rotateX(Math.PI / 2), tyre); wm.position.set(sx * L, wr, sz * (W / 2 - 0.01 * L)); wheels.push(wm);
    mesh(wm, new THREE.CylinderGeometry(wr * 0.5, wr * 0.5, 0.054 * L, 10).rotateX(Math.PI / 2), chrome, undefined, false); }
  return { g, bed, wheels, L };
};
