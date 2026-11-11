// Shared helpers for the B sets (prison, lab, sawmill, micro, beach, cabin): candles, torches, painted textures
// composed on top of paint.ts HD canvases, dust motes, birds, round stylised trees, small props.
import * as THREE from "three";
import { lam, V, boxGeo, Batch } from "../build";
import { ctex, rng, planksHD, beamHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, rod } from "../setkit";
import type { V3 } from "./types";

export const INKC = "#241726";
const TAU = Math.PI * 2;
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------- textures ----------------
/** a new canvas texture painted on top of another (cached) canvas texture's image, scaled to fill */
export const over = (key: string, w: number, h: number, base: THREE.Texture | null, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rot = 0) =>
  ctex(key, w, h, (g, r) => {
    if (base) {
      const im = base.image as CanvasImageSource;
      if (rot) { g.save(); g.translate(w / 2, h / 2); g.rotate(rot); g.drawImage(im, -h / 2, -w / 2, h, w); g.restore(); }
      else g.drawImage(im, 0, 0, w, h);
    }
    draw(g, r);
  });
/** vertical boards (planksHD turned 90 deg), optionally stained with a multiply colour */
export const boardsV = (key: string, stain: string | null = null, a = 0.35) => over("bV_" + key, 1024, 1024, planksHD(), (g) => {
  if (stain) { g.globalCompositeOperation = "multiply"; g.globalAlpha = a; g.fillStyle = stain; g.fillRect(0, 0, 1024, 1024); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
}, Math.PI / 2);
/** horizontal boards stained */
export const boardsH = (key: string, stain: string | null = null, a = 0.35) => over("bH_" + key, 1024, 1024, planksHD(), (g) => {
  if (stain) { g.globalCompositeOperation = "multiply"; g.globalAlpha = a; g.fillStyle = stain; g.fillRect(0, 0, 1024, 1024); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
});
export const beamStain = (key: string, stain: string, a = 0.4) => over("bm_" + key, 1024, 512, beamHD(), (g) => {
  g.globalCompositeOperation = "multiply"; g.globalAlpha = a; g.fillStyle = stain; g.fillRect(0, 0, 1024, 512); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
});
/** painted straw (bed, floor dusting) */
export const strawTex = () => ctex("strawB", 512, 512, (g, r) => {
  g.fillStyle = "#d9b45a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, a = r() * TAU, l = 14 + r() * 40;
    g.strokeStyle = pickc(r, ["rgba(246,214,120,0.9)", "rgba(180,130,50,0.8)", "rgba(230,190,90,0.9)", "rgba(140,96,36,0.6)"]);
    g.lineWidth = 2 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
});
const pickc = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
/** canvas with hand-written text (IOUs, chalk, labels) */
export const handTex = (key: string, w: number, h: number, bg: string | null, draw: (g: CanvasRenderingContext2D, r: () => number) => void) =>
  ctex(key, w, h, (g, r) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } draw(g, r); });
/** paper with a few lines of text (used for IOUs / notes) */
export const paperTex = (key: string, lines: string[], tint = "#f1e6c8") => handTex("paper_" + key, 256, 320, tint, (g, r) => {
  g.fillStyle = "rgba(150,110,60,0.18)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(r() * 256, r() * 320, 20 + r() * 50, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(90,60,40,0.5)"; g.lineWidth = 4; g.strokeRect(6, 6, 244, 308);
  g.fillStyle = "#3a2216"; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((l, i) => { const fs = i === 0 ? 64 : 36; g.font = `italic 700 ${fs}px Georgia, serif`; let w = g.measureText(l).width; if (w > 220) { g.font = `italic 700 ${fs * 220 / w}px Georgia, serif`; } g.fillText(l, 128, 70 + i * 62); });
  g.strokeStyle = "#3a2216"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 285); g.bezierCurveTo(100, 260, 140, 300, 196, 270); g.stroke();
});

// ---------------- flames ----------------
const flameTex = () => ctex("flameB", 64, 128, (g) => {
  const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60);
  gr.addColorStop(0, "#fffbe8"); gr.addColorStop(0.35, "#ffd36a"); gr.addColorStop(0.7, "#ff8a2a"); gr.addColorStop(1, "rgba(255,90,20,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(52, 50, 60, 84, 32, 124); g.bezierCurveTo(4, 84, 12, 50, 32, 4); g.fill();
});
/** emissive flame card + glow + warm point light; userData compatible with setkit flicker() (+ flame wobble via flameFlick) */
export const flame = (g: THREE.Object3D, pos: V3, s: number, color: string, intensity: number, dist: number) => {
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), color: new THREE.Color(2.2, 1.7, 1.1), transparent: true, depthWrite: false, fog: false }));
  f.center.set(0.5, 0.05); f.scale.set(s * 0.5, s, 1); f.position.set(...pos); f.layers.set(NOINK); g.add(f);
  const gl = glow(g, [pos[0], pos[1] + s * 0.4, pos[2]], color, s * 7, 0.9);
  const L = new THREE.PointLight(color, intensity, dist, 1.4); L.position.set(pos[0], pos[1] + s * 0.5, pos[2]); g.add(L);
  g.userData = { light: L, glow: gl, base: intensity, seed: rnd(pos[0] * 7 + pos[2] * 3 + intensity) * 10, flame: f, fs: s };
  return g;
};
export const flameFlick = (l: THREE.Object3D, t: number) => {
  const u = l.userData; const f = 0.88 + 0.12 * Math.sin(t * 13 + u.seed) * Math.sin(t * 5.3 + u.seed * 2);
  u.light.intensity = u.base * f; (u.glow.material as THREE.SpriteMaterial).opacity = 0.7 + 0.3 * f;
  if (u.flame) { const fl = u.flame as THREE.Sprite; fl.scale.set(u.fs * 0.5 * (1.05 - 0.1 * f), u.fs * (0.85 + 0.25 * f + 0.05 * Math.sin(t * 21 + u.seed)), 1); fl.material.rotation = 0.08 * Math.sin(t * 7 + u.seed); }
};
/** candle in a brass dish (top of the wax at y = 0.16 s) */
export const candle = (parent: THREE.Object3D, pos: V3, s = 1, intensity = 4, dist = 5, color = "#ffb35a") => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const brass = lam("brassB", () => ({ color: "#d9a640" })), wax = lam("waxB", () => ({ color: "#f6ecd8" }));
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(0.075 * s, 0.085 * s, 0.02 * s, 18).translate(0, 0.01 * s, 0), brass);
  add(new THREE.TorusGeometry(0.03 * s, 0.008 * s, 6, 12).rotateY(Math.PI / 2).translate(0.09 * s, 0.03 * s, 0), brass);
  const w = add(new THREE.CylinderGeometry(0.028 * s, 0.03 * s, 0.15 * s, 12).translate(0, 0.095 * s, 0), wax);
  add(new THREE.SphereGeometry(0.018 * s, 8, 6).scale(1, 1.5, 1).translate(0.024 * s, 0.13 * s, 0.01 * s), wax); // wax drip
  void w;
  const lg = new THREE.Group(); g.add(lg);
  flame(lg, [0, 0.172 * s, 0], 0.085 * s, color, intensity, dist);
  g.userData = lg.userData;
  return g;
};
/** wall torch on an iron bracket; the flame sits at pos */
export const torch = (parent: THREE.Object3D, pos: V3, yaw = 0, intensity = 7, dist = 7) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const iron = lam("lampIron", () => ({ color: "#3a3440" })), wood = lam("torchWood", () => ({ color: "#6a4527" }));
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(0.12, 0.22, 0.03).translate(0, -0.42, -0.2), iron);
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6).rotateX(Math.PI / 2 - 0.5).translate(0, -0.38, -0.1), iron);
  add(new THREE.CylinderGeometry(0.035, 0.025, 0.5, 8).rotateX(0.35).translate(0, -0.22, 0.03), wood);
  add(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 8).translate(0, -0.02, 0.06), iron);
  const lg = new THREE.Group(); g.add(lg);
  flame(lg, [0, 0.0, 0.06], 0.32, "#ff9a3a", intensity, dist);
  g.userData = lg.userData;
  return g;
};

// ---------------- particles ----------------
export const dotTex = () => ctex("dotB", 32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
/** slow floating motes inside a box (dust in a beam). update(t) */
export const motes = (parent: THREE.Object3D, min: V3, max: V3, n: number, color: string, size = 0.025, op = 0.8, seed = 1) => {
  const r = rng(seed * 17 + n), base = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { base.set([min[0] + r() * (max[0] - min[0]), min[1] + r() * (max[1] - min[1]), min[2] + r() * (max[2] - min[2])], i * 3); ph[i] = r() * 100; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex(), size, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.layers.set(NOINK); pts.frustumCulled = false; parent.add(pts);
  const H = max[1] - min[1];
  return { pts, update: (t: number) => {
    const a = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < n; i++) {
      a[i * 3] = base[i * 3] + Math.sin(t * 0.3 + ph[i]) * 0.12;
      a[i * 3 + 1] = min[1] + ((((base[i * 3 + 1] - min[1]) + Math.sin(t * 0.21 + ph[i] * 1.3) * 0.15 + t * 0.03 * (0.5 + (ph[i] % 1))) % H) + H) % H;
      a[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.25 + ph[i]) * 0.1;
    }
    geo.attributes.position.needsUpdate = true;
  } };
};
/** flapping white birds circling (outdoors) */
export const birds = (parent: THREE.Object3D, n: number, c: V3, rad: number, col = "#f4f4f8", s = 1) => {
  const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
  const list = Array.from({ length: n }, () => {
    const g = new THREE.Group();
    for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * s, 0.13 * s).translate(sd * 0.25 * s, 0, 0), m); w.name = sd < 0 ? "L" : "R"; g.add(w); }
    const bd = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 8, 6), m); bd.scale.set(1, 0.8, 2); g.add(bd);
    parent.add(g); return g;
  });
  return (t: number) => list.forEach((g, i) => {
    const a = t * 0.22 + i * 2.1;
    g.position.set(c[0] + Math.sin(a) * rad * (1 - i * 0.12), c[1] + i * 0.7 + Math.sin(t * 0.8 + i) * 0.3, c[2] + Math.cos(a) * rad * 0.5 - i * 1.5);
    g.rotation.y = a + Math.PI / 2;
    const k = Math.sin(t * 8 + i * 2) * 0.6; g.children.forEach((w) => { if (w.name === "L") w.rotation.z = k; if (w.name === "R") w.rotation.z = -k; });
  });
};

// ---------------- trees / greenery ----------------
export const leafTex = (key: string, base: string, light: string, dark: string) => ctex("leaf_" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, s = 10 + r() * 22, d = r() < 0.5;
    g.fillStyle = d ? dark : light; g.globalAlpha = 0.55;
    g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
});
/** round stylised tree: trunk + 3-5 lumpy spheres (pass a Batch so it merges) */
export const roundTree = (b: Batch, x: number, z: number, h: number, seed: number, leaf: THREE.Material, bark: THREE.Material, y = 0) => {
  const r = rng(seed * 13 + 7);
  b.add(new THREE.CylinderGeometry(0.05 * h, 0.08 * h, h * 0.6, 8).translate(x, y + h * 0.3, z), bark);
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const rr = h * (0.26 + r() * 0.14), a = r() * TAU, d = i === 0 ? 0 : h * 0.18;
    b.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.9, 1).translate(x + Math.cos(a) * d, y + h * (0.68 + r() * 0.22), z + Math.sin(a) * d), leaf);
  }
};
/** bare winter tree from rods (outside the lab) */
export const bareTree = (parent: THREE.Object3D, x: number, z: number, h: number, seed: number, m: THREE.Material) => {
  const r = rng(seed * 31 + 3);
  const branch = (a: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
    const b = a.clone().addScaledVector(dir, len);
    rod(parent, [a.x, a.y, a.z], [b.x, b.y, b.z], rad, m);
    if (depth <= 0) return;
    const k = depth > 2 ? 3 : 2;
    for (let i = 0; i < k; i++) {
      const d = dir.clone().add(V((r() - 0.5) * 1.4, 0.15 + r() * 0.4, (r() - 0.5) * 1.4)).normalize();
      branch(b, d, len * (0.55 + r() * 0.2), rad * 0.62, depth - 1);
    }
  };
  branch(V(x, 0, z), V(0, 1, 0), h * 0.42, 0.08 * h / 4, 3);
};

// ---------------- small props ----------------
export const metal = (key: string, col: string, shin = 50) => {
  const k = "metalB_" + key;
  return lamCustom(k, () => twoTone(new THREE.MeshPhongMaterial({ color: col, specular: "#ffffff", shininess: shin })));
};
const custom = new Map<string, THREE.Material>();
export const lamCustom = (key: string, make: () => THREE.Material) => { let m = custom.get(key); if (!m) { m = make(); custom.set(key, m); } return m; };
/** a book (spine colour) lying or standing; returns mesh */
export const book = (parent: THREE.Object3D, pos: V3, w: number, h: number, d: number, col: string, yaw = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam("book" + col, () => ({ color: col })));
  m.position.set(pos[0], pos[1] + h / 2, pos[2]); m.rotation.y = yaw; m.castShadow = m.receiveShadow = true; parent.add(m);
  const pg = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.9, d * 1.02), lam("pages", () => ({ color: "#f3e8cc" })));
  pg.position.set(0.01, 0, 0); m.add(pg); pg.scale.set(0.98, 1, 0.94);
  return m;
};
/** glass jar with a cork / tin lid */
export const jar = (b: Batch, x: number, y: number, z: number, h: number, col: THREE.Material, lid: THREE.Material) => {
  b.add(new THREE.CylinderGeometry(h * 0.33, h * 0.36, h * 0.85, 12).translate(x, y + h * 0.425, z), col);
  b.add(new THREE.CylinderGeometry(h * 0.25, h * 0.27, h * 0.16, 12).translate(x, y + h * 0.92, z), lid);
};
/** open-top box (bucket / crate / cooler body) built from 5 boxes into a Batch */
export const openBox = (b: Batch, min: THREE.Vector3, max: THREE.Vector3, t: number, m: THREE.Material, tile = 0) => {
  b.add(boxGeo(V(min.x, min.y, min.z), V(max.x, min.y + t, max.z), tile), m);
  b.add(boxGeo(V(min.x, min.y, min.z), V(max.x, max.y, min.z + t), tile), m);
  b.add(boxGeo(V(min.x, min.y, max.z - t), V(max.x, max.y, max.z), tile), m);
  b.add(boxGeo(V(min.x, min.y, min.z), V(min.x + t, max.y, max.z), tile), m);
  b.add(boxGeo(V(max.x - t, min.y, min.z), V(max.x, max.y, max.z), tile), m);
};
/** curved ribbon (a wood shaving / curl): spiral strip, width w, radius rad, turns, pitch along the axis */
export const curlGeo = (w: number, rad: number, turns: number, pitch: number, segs = 48, taper = 0.4) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, a = u * turns * TAU, r = rad * (1 - taper * u), x = Math.cos(a) * r, y = Math.sin(a) * r, z = u * pitch;
    for (const s of [-0.5, 0.5]) { pos.push(x, y, z + s * w * (1 - 0.5 * u)); uv.push(u * turns * 2, s + 0.5); }
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
};
/** iron bars (cell door, window grille) as rods into a Batch */
export const bars = (b: Batch, x0: number, x1: number, y0: number, y1: number, z: number, n: number, r: number, m: THREE.Material, cross: number[] = []) => {
  for (let i = 0; i < n; i++) { const x = x0 + ((i + 0.5) / n) * (x1 - x0); b.add(new THREE.CylinderGeometry(r, r, y1 - y0, 8).translate(x, (y0 + y1) / 2, z), m); }
  for (const y of cross) b.add(boxGeo(V(x0, y - 0.03, z - r * 1.6), V(x1, y + 0.03, z + r * 1.6)), m);
};
/** iceBlock drips use a plain Phong (dark under the black sun): swap them for a two-tone glossy drop on this block */
let dripM: THREE.Material | null = null;
export const glossDrips = (ice: { g: THREE.Group }) => {
  if (!dripM) dripM = twoTone(new THREE.MeshPhongMaterial({ color: "#bfeaff", emissive: "#5fc4e8", emissiveIntensity: 0.3, specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.85 }), 0.4);
  ice.g.children.forEach((c) => { const m = c as THREE.Mesh; if (m.isMesh && m.geometry instanceof THREE.SphereGeometry) m.material = dripM!; });
};
export { TAU, rnd };
