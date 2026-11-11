// Shared props for the port / sea sets (martinique, sea, voyage, calcutta): painted canvases with grain, seams and
// wear; palms, fruit, baskets, market stall, Caribbean plaster houses, hills, gulls, foam, boats, string lights,
// torches, sparkles. Everything world-side is two-tone lam(); glows / flames / mist / sparkles are on NOINK.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../build";
import { ctex, rng, roofHD, facadeHD, beamHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, mist, rod } from "../setkit";
import type { V3 } from "./types";

export const TAU = Math.PI * 2;
export const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
};

// ---------------- painted textures ----------------
/** sun-bleached dock planks: silver-cream boards, dark seams, nails, grain, salt + tar stains (1024 px = 2 m) */
export const bleachedPlanks = () => ctex("bleachedPlanks", 1024, 1024, (g, r) => {
  const B = 128, fills = ["#e9d6b4", "#e2cca6", "#efdcbc", "#dcc39c", "#e6d2ae"];
  for (let i = 0; i < 8; i++) {
    const y = i * B; g.fillStyle = pick(r, fills); g.fillRect(0, y, 1024, B);
    for (let k = 0; k < 4; k++) blot(g, r() * 1024, y + B / 2, 60 + r() * 120, r() > 0.5 ? "rgba(255,248,230,0.35)" : "rgba(150,110,70,0.18)");
    g.lineWidth = 1.5;
    for (let k = 0; k < 14; k++) { // grain
      g.strokeStyle = r() < 0.3 ? "rgba(255,250,235,0.35)" : "rgba(130,92,58,0.32)";
      let x = r() * 1024, yy = y + 10 + r() * (B - 20); g.beginPath(); g.moveTo(x, yy);
      for (let s = 0; s < 8; s++) { x += 40 + r() * 60; yy += (r() - 0.5) * 6; g.lineTo(x, yy); } g.stroke();
    }
    if (r() < 0.4) { const kx = r() * 1024, ky = y + 30 + r() * 60; g.strokeStyle = "rgba(110,72,40,0.5)"; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(kx, ky, 8 + k * 6, 4 + k * 3, 0, 0, TAU); g.stroke(); } }
    const jx = r() * 1024; g.fillStyle = "#6b4a30"; g.fillRect(jx, y, 4, B); // butt joint
    for (const ny of [0.25, 0.75]) for (const dx of [-9, 11]) { g.fillStyle = "#5a4636"; g.beginPath(); g.arc(jx + dx, y + B * ny, 4, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(jx + dx - 2, y + B * ny - 2, 2, 2); }
    g.fillStyle = "rgba(255,250,235,0.45)"; g.fillRect(0, y + 4, 1024, 2);       // sunlit lip
    const sh = g.createLinearGradient(0, y + B - 14, 0, y + B); sh.addColorStop(0, "rgba(90,60,40,0)"); sh.addColorStop(1, "rgba(90,60,40,0.35)"); g.fillStyle = sh; g.fillRect(0, y + B - 14, 1024, 14);
    g.fillStyle = "#6e4c34"; g.fillRect(0, y, 1024, 4);                          // gap
  }
  for (let i = 0; i < 10; i++) blot(g, r() * 1024, r() * 1024, 30 + r() * 70, "rgba(90,70,60,0.16)"); // tar / water stains
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(r() * 1024, r() * 1024, 2, 2); } // salt
});
/** striped awning cloth with a scalloped, darker hem line and fold shading */
export const stripeTex = (c1: string, c2: string, n = 8) => ctex(`stripe|${c1}|${c2}|${n}`, 512, 512, (g, r) => {
  const w = 512 / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * w, 0, w + 1, 512); }
  for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * w, 0, i * w + w, 0); gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(0.6, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(60,20,20,0.18)"); g.fillStyle = gr; g.fillRect(i * w, 0, w, 512); }
  for (let i = 0; i < 40; i++) blot(g, r() * 512, r() * 512, 20 + r() * 50, "rgba(255,240,220,0.12)"); // sun fade
  g.fillStyle = "rgba(60,30,30,0.35)"; for (let i = 0; i < 6; i++) g.fillRect(0, 60 + i * 80 + r() * 10, 512, 2); // stitch lines
});
export const weaveTex = (col: string) => ctex("weave" + col, 256, 256, (g, r) => {
  const c = new THREE.Color(col), d = "#" + c.clone().multiplyScalar(0.62).getHexString(), l = "#" + c.clone().lerp(new THREE.Color("#fff3d8"), 0.35).getHexString();
  g.fillStyle = d; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = (x + y) % 2 === 0; g.fillStyle = v ? col : l;
    if (v) g.fillRect(x * 16 + 3, y * 16 + 1, 10, 14); else g.fillRect(x * 16 + 1, y * 16 + 4, 14, 8);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x * 16 + 4, y * 16 + 3, 3, 3);
  }
  for (let i = 0; i < 20; i++) blot(g, r() * 256, r() * 256, 20, "rgba(60,40,20,0.12)");
});
export const pineTex = () => ctex("pineapple", 256, 256, (g) => {
  g.fillStyle = "#c98a2a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    const cx = x * 32 + (y % 2) * 16, cy = y * 30;
    g.fillStyle = "#e3a93a"; g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx + 14, cy); g.lineTo(cx, cy + 14); g.lineTo(cx - 14, cy); g.closePath(); g.fill();
    g.strokeStyle = "#7a4e18"; g.lineWidth = 2.5; g.stroke(); g.fillStyle = "#5e8a2a"; g.beginPath(); g.arc(cx, cy, 3, 0, TAU); g.fill();
  }
});
export const trunkTex = () => ctex("palmTrunk", 256, 512, (g, r) => {
  g.fillStyle = "#a07650"; g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 22 + r() * 8) {
    g.fillStyle = "rgba(70,45,28,0.6)"; g.fillRect(0, y, 256, 4);
    g.fillStyle = "rgba(255,230,190,0.22)"; g.fillRect(0, y + 5, 256, 3);
    for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(80,52,30,0.25)"; g.fillRect(x + r() * 8, y + 6, 2, 10); }
  }
  for (let i = 0; i < 20; i++) blot(g, r() * 256, r() * 512, 30, "rgba(60,40,25,0.15)");
});
/** palm frond: midrib + leaflets on a transparent canvas (alpha-tested, so the ink outlines the leaf shape) */
export const frondTex = (col = "#4f9a3a") => ctex("frond" + col, 512, 128, (g, r) => {
  const c = new THREE.Color(col), dk = "#" + c.clone().multiplyScalar(0.7).getHexString(), lt = "#" + c.clone().lerp(new THREE.Color("#d8f08a"), 0.35).getHexString();
  for (let i = 0; i < 46; i++) {
    const x = 12 + i * 10.6, len = 58 * Math.sin(Math.PI * (0.12 + 0.88 * (i / 46))) + 4;
    for (const s of [-1, 1]) {
      g.fillStyle = r() < 0.5 ? col : lt; g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x + 10, 64 + s * len * 0.5, x + 22, 64 + s * len); g.lineTo(x + 25, 64 + s * len * 0.94); g.quadraticCurveTo(x + 14, 64 + s * len * 0.4, x + 7, 64); g.closePath(); g.fill();
      g.strokeStyle = dk; g.lineWidth = 1; g.stroke();
    }
  }
  g.strokeStyle = "#8a7a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 64); g.lineTo(512, 64); g.stroke();
});
/** green hills: painted tree clumps, meadow patches, little red roofs (1024 px = whole hill) */
export const hillTex = (base = "#5fa548", key = "hill") => ctex(key + base, 1024, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
  const c = new THREE.Color(base);
  for (let i = 0; i < 30; i++) blot(g, r() * 1024, r() * 512, 60 + r() * 140, r() > 0.5 ? "rgba(170,215,110,0.35)" : "rgba(40,95,50,0.35)");
  for (let i = 0; i < 260; i++) { // tree clumps (round crowns with a lit top-left)
    const x = r() * 1024, y = r() * 512, rad = 8 + r() * 14;
    g.fillStyle = "#" + c.clone().multiplyScalar(0.62 + r() * 0.2).getHexString(); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
    g.fillStyle = "rgba(200,240,140,0.35)"; g.beginPath(); g.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.5, 0, TAU); g.fill();
    g.strokeStyle = "rgba(30,60,35,0.5)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke();
  }
  for (let i = 0; i < 14; i++) { const x = r() * 1024, y = 200 + r() * 300; g.fillStyle = pick(r, ["#d4673f", "#f2e3c4", "#e9a23b"]); g.fillRect(x, y, 14, 9); g.fillStyle = "#b5492f"; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + 7, y - 6); g.lineTo(x + 16, y); g.fill(); }
});
/** white foam marks for wakes / splashes (alpha) */
export const foamTex = () => ctex("foam", 512, 512, (g, r) => {
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, w = 20 + r() * 60, h = 6 + r() * 14;
    g.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.45})`; g.beginPath(); g.ellipse(x, y, w, h, (r() - 0.5) * 0.4, 0, TAU); g.fill();
  }
  for (let i = 0; i < 200; i++) { g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 4, 0, TAU); g.fill(); }
});
/** stream of pouring water (scrolls along v) */
export const streamTex = () => ctex("stream", 128, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "#5fb8e0"); gr.addColorStop(0.35, "#bff0ff"); gr.addColorStop(0.55, "#e9fbff"); gr.addColorStop(1, "#4aa6d6");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`; g.fillRect(10 + r() * 100, r() * 512, 4 + r() * 8, 20 + r() * 50); }
  for (let i = 0; i < 20; i++) { g.fillStyle = "rgba(30,110,160,0.35)"; g.fillRect(r() * 128, r() * 512, 3, 30 + r() * 40); }
});
export const sailTex = (col = "#f6eedb") => ctex("sailcloth" + col, 256, 256, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 1; i < 6; i++) { g.fillStyle = "rgba(120,90,60,0.28)"; g.fillRect(i * 43, 0, 2, 256); }
  for (let i = 0; i < 12; i++) blot(g, r() * 256, r() * 256, 30, "rgba(150,120,80,0.12)");
  for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(170,120,70,0.3)"; g.fillRect(r() * 200, r() * 200, 30 + r() * 20, 26 + r() * 10); } // patches
});
/** star sparkle for ice */
const starTex = () => ctex("sparkStar", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 20); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "white";
  for (const a of [0, Math.PI / 2]) { g.save(); g.translate(64, 64); g.rotate(a); g.beginPath(); g.moveTo(-62, 0); g.quadraticCurveTo(0, 4, 62, 0); g.quadraticCurveTo(0, -4, -62, 0); g.fill(); g.restore(); }
});

// ---------------- materials ----------------
let goldM: THREE.MeshPhongMaterial | undefined;
export const M = {
  bleach: () => lam("bleachDock", () => ({ map: bleachedPlanks() })),
  trunk: () => lam("palmTrunk", () => ({ map: trunkTex() })),
  beam: () => lam("pkBeam", () => ({ map: beamHD() })),
  iron: () => lam("pkIron", () => ({ color: "#4b5468" })),
  rope: () => lam("pkRope", () => ({ color: "#c9a96e" })),
  gold: () => (goldM ??= twoTone(new THREE.MeshPhongMaterial({ color: "#f2c24a", emissive: "#5a3a00", emissiveIntensity: 0.4, specular: "#fff2c0", shininess: 60 }))),
};

// ---------------- palm ----------------
export type Palm = { g: THREE.Group; fronds: THREE.Group[]; seed: number };
export const palm = (parent: THREE.Object3D, pos: V3, h = 6, lean: [number, number] = [0.8, 0], seed = 1, col = "#4f9a3a"): Palm => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const r = rng(seed * 7 + 3), tm = M.trunk();
  const top = V(lean[0], h, lean[1]);
  const P = (u: number) => V(lean[0] * u * u, h * u, lean[1] * u * u);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = P(i / n), b = P((i + 1) / n), rad0 = 0.2 - 0.07 * (i / n), rad1 = 0.2 - 0.07 * ((i + 1) / n);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad1, rad0 + 0.02, a.distanceTo(b) + 0.04, 9), tm);
    m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
  const nutM = lam("coconut", () => ({ color: "#7a5a2e" }));
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), nutM); const a = (i / 4) * TAU; c.position.set(Math.cos(a) * 0.17, -0.18, Math.sin(a) * 0.17); c.castShadow = true; crown.add(c); }
  const fm = twoTone(new THREE.MeshLambertMaterial({ map: frondTex(col), alphaTest: 0.5, side: THREE.DoubleSide }));
  const fronds: THREE.Group[] = [];
  const nf = 9;
  for (let i = 0; i < nf; i++) {
    const L = 2.3 + r() * 0.8, geo = new THREE.PlaneGeometry(L, 0.75, 12, 2); const p = geo.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k) + L / 2, y = p.getY(k); p.setXYZ(k, x, -0.55 * (x / L) ** 2 * L * 0.6 + Math.abs(y) * 0.25, y); }
    geo.computeVertexNormals();
    const f = new THREE.Mesh(geo, fm); f.castShadow = true; f.receiveShadow = true;
    const fg = new THREE.Group(); fg.rotation.y = (i / nf) * TAU + r() * 0.4; fg.rotation.z = 0.35 - r() * 0.35; fg.add(f); crown.add(fg);
    fronds.push(fg);
    f.rotation.x = (r() - 0.5) * 0.5;
  }
  return { g, fronds, seed };
};
export const swayPalm = (p: Palm, t: number, k = 1) => {
  p.fronds.forEach((f, i) => { f.rotation.x = Math.sin(t * 1.3 + i * 0.8 + p.seed) * 0.06 * k; f.children[0].rotation.z = Math.sin(t * 1.7 + i + p.seed) * 0.05 * k; });
};

// ---------------- gulls ----------------
export const gullFlock = (parent: THREE.Object3D, n: number, c: V3, rad: number, col = "#f7f6f2") => {
  const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }), tip = new THREE.MeshBasicMaterial({ color: "#3d4252", side: THREE.DoubleSide });
  const gs = Array.from({ length: n }, () => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.name = s < 0 ? "L" : "R";
      const a = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.13).translate(s * 0.21, 0, 0), m); w.add(a);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08).translate(s * 0.5, 0, 0), tip); w.add(b);
      g.add(w);
    }
    const bd = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), m); bd.scale.set(1, 0.8, 2.2); g.add(bd);
    g.traverse((o) => o.layers.set(NOINK)); g.rotation.order = "YXZ"; parent.add(g); return g;
  });
  return (t: number) => gs.forEach((g, i) => {
    const sp = 0.22 + 0.05 * (i % 3), a = t * sp + i * 2.1, rr = rad * (0.7 + 0.3 * ((i * 7) % 5) / 5);
    g.position.set(c[0] + Math.cos(a) * rr, c[1] + i * 0.5 + Math.sin(t * 0.7 + i) * 0.35, c[2] + Math.sin(a) * rr * 0.6);
    g.rotation.y = -a; g.rotation.z = Math.sin(t * 0.7 + i) * 0.2;
    const f = Math.sin(t * 8 + i * 2) * 0.5;
    g.children.forEach((w) => { if (w.name === "L") w.rotation.z = f; if (w.name === "R") w.rotation.z = -f; });
  });
};

// ---------------- fruit, baskets ----------------
const FR = {
  mango: ["#f2a22a", "#e8752a", "#d9552e", "#9cc23a"], banana: "#f4d23c", lime: "#7fc23a", coconut: "#7a5a2e", papaya: "#f08a3a",
};
const fruitMat = (c: string) => lam("fruit" + c, () => ({ color: c }));
/** pyramid of round fruit (mango / orange / lime) on top of y */
export const fruitPile = (b: Batch, pos: V3, kind: "mango" | "lime" | "orange" | "coconut", w = 0.6, d = 0.4, rad = 0.07, seed = 1) => {
  const r = rng(seed);
  const cols = kind === "mango" ? FR.mango : kind === "lime" ? ["#7fc23a", "#93cf45", "#6aae30"] : kind === "orange" ? ["#f39a26", "#f7a93a", "#ea8a1e"] : ["#7a5a2e", "#6a4a26"];
  const sphere = new THREE.SphereGeometry(rad, 10, 8);
  for (let lv = 0; lv < 4; lv++) {
    const nx = Math.max(1, Math.floor(w / (rad * 2)) - lv), nz = Math.max(1, Math.floor(d / (rad * 2)) - lv);
    if (nx < 1 || nz < 1) break;
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const m = new THREE.Matrix4().compose(V(pos[0] + (i - (nx - 1) / 2) * rad * 2, pos[1] + rad + lv * rad * 1.55, pos[2] + (k - (nz - 1) / 2) * rad * 2),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r(), r())), kind === "mango" ? V(1.15, 0.9, 0.9) : V(1, 1, 1));
      b.add(sphere, fruitMat(pick(r, cols)), m);
    }
  }
};
/** bunch of bananas: curved fingers around a stem */
export const bananas = (b: Batch, pos: V3, yaw = 0, s = 1) => {
  const finger = new THREE.CapsuleGeometry(0.028 * s, 0.17 * s, 4, 8);
  const p = finger.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + (y / (0.12 * s)) ** 2 * 0.04 * s); }
  finger.computeVertexNormals();
  const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(...pos);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
    const a = (i - 2.5) * 0.22, m = base.clone().multiply(new THREE.Matrix4().compose(V(Math.sin(a) * 0.1 * s, 0.06 * s + row * 0.05 * s, row * 0.06 * s - 0.06 * s), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9 + row * 0.15, a, -0.4)), V(1, 1, 1)));
    b.add(finger, fruitMat(row === 2 ? "#e8c832" : FR.banana), m);
  }
  b.add(new THREE.CylinderGeometry(0.02 * s, 0.025 * s, 0.12 * s, 6).translate(0, 0.14 * s, 0), fruitMat("#6b8a2a"), base);
};
export const pineapple = (parent: THREE.Object3D, pos: V3, s = 1) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 14, 10), lam("pineBody", () => ({ map: pineTex() }))); body.scale.set(1, 1.45, 1); body.position.y = 0.14 * s; body.castShadow = true; g.add(body);
  const lm = lam("pineLeaf", () => ({ color: "#4f8f36" }));
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.2 * s, 4), lm); const a = (i / 7) * TAU; l.position.set(Math.cos(a) * 0.02 * s, 0.33 * s, Math.sin(a) * 0.02 * s); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(l); }
  return g;
};
export const basket = (parent: THREE.Object3D, pos: V3, rad = 0.3, h = 0.28, col = "#c99a52") => {
  const pts = [V(0, 0, 0), V(rad * 0.75, 0, 0), V(rad, h * 0.85, 0), V(rad * 1.05, h, 0), V(rad * 0.95, h, 0)].map((v) => new THREE.Vector2(v.x, v.y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), lam("basket" + col, () => ({ map: weaveTex(col), side: THREE.DoubleSide })));
  m.position.set(...pos); m.castShadow = true; m.receiveShadow = true; parent.add(m);
  return m;
};

// ---------------- market stall ----------------
export type Stall = { g: THREE.Group; hem: THREE.Mesh; cloth: THREE.Mesh };
/** wooden stall with a striped awning (fluttering hem), counter, fruit pyramids, bananas hanging */
export const stall = (parent: THREE.Object3D, pos: V3, yaw: number, w: number, c1: string, c2: string, seed = 1): Stall => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const b = new Batch(), wood = M.beam(), d = 1.4;
  // counter
  b.add(boxGeo(V(-w / 2, 0, -d / 2 + 0.6), V(w / 2, 0.9, d / 2), 1), lam("stallCounter", () => ({ map: beamHD() })));
  b.add(boxGeo(V(-w / 2 - 0.05, 0.9, -d / 2 + 0.55), V(w / 2 + 0.05, 0.96, d / 2 + 0.05), 1), lam("stallTop", () => ({ map: bleachedPlanks() })));
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) b.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, z > 0 ? 2.35 : 2.6, z + 0.05)), wood);
  // goods
  fruitPile(b, [-w / 2 + 0.45, 0.96, 0.2], "mango", 0.55, 0.4, 0.075, seed);
  fruitPile(b, [0.05, 0.96, 0.2], "lime", 0.4, 0.38, 0.055, seed + 1);
  fruitPile(b, [w / 2 - 0.45, 0.96, 0.25], "orange", 0.5, 0.4, 0.07, seed + 2);
  bananas(b, [-0.35, 0.96, -0.05], 0.3); bananas(b, [0.45, 0.96, -0.05], -0.4, 0.9);
  b.build(g);
  for (let i = 0; i < 3; i++) pineapple(g, [-w / 2 + 0.5 + i * 0.32, 0.96, -0.32], 1);
  // hanging bananas from the awning beam
  const hb = new Batch(); bananas(hb, [-w / 2 + 0.4, 1.75, d / 2 - 0.05], 0, 1.3); bananas(hb, [w / 2 - 0.4, 1.8, d / 2 - 0.05], 1, 1.2); hb.build(g);
  // awning (slopes down to the front) + hem
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, d + 0.6, 8, 4).rotateX(-Math.PI / 2 + 0.28), twoTone(new THREE.MeshLambertMaterial({ map: stripeTex(c1, c2, 10), side: THREE.DoubleSide })));
  cloth.position.set(0, 2.5, 0.05); cloth.castShadow = true; cloth.receiveShadow = true; g.add(cloth);
  const hemGeo = new THREE.PlaneGeometry(w + 0.5, 0.32, 16, 1); const hp = hemGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < hp.count; i++) if (hp.getY(i) < 0) { const x = hp.getX(i); const k = Math.round(x / ((w + 0.5) / 8)); hp.setY(i, -0.16 + (Math.abs(x - k * (w + 0.5) / 8) < 0.01 ? 0 : 0)); }
  const hem = new THREE.Mesh(hemGeo, twoTone(new THREE.MeshLambertMaterial({ map: scallopTex(c1, c2), alphaTest: 0.5, side: THREE.DoubleSide })));
  hem.position.set(0, 2.14, d / 2 + 0.36); hem.castShadow = true; g.add(hem);
  return { g, hem, cloth };
};
const scallopTex = (c1: string, c2: string) => ctex(`scallop|${c1}|${c2}`, 512, 64, (g) => {
  const n = 10, w = 512 / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w + w, 0); g.lineTo(i * w + w, 30); g.arc(i * w + w / 2, 30, w / 2, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = "rgba(60,25,25,0.6)"; g.lineWidth = 2; g.stroke(); }
});
export const flutterStall = (s: Stall, t: number) => {
  const p = s.hem.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y0 = i < p.count / 2 ? 0.16 : -0.16; p.setZ(i, (0.16 - y0) * 0.35 * Math.sin(t * 4 + x * 3)); }
  p.needsUpdate = true;
};

// ---------------- Caribbean plaster house (hipped tile roof, balcony, shutters) ----------------
export type HouseStyle = { wall: string; shutter: string; roof: string; rail?: string };
export const TROPIC_HOUSES: HouseStyle[] = [
  { wall: "#f0b04a", shutter: "#2f8a5a", roof: "#cf6440", rail: "#f5efe0" }, // sunflower
  { wall: "#ec8f78", shutter: "#2a6fb0", roof: "#c75a3a", rail: "#f5efe0" }, // coral pink
  { wall: "#4cbcb0", shutter: "#f2d16a", roof: "#d4703e", rail: "#f5efe0" }, // turquoise
  { wall: "#f3d8a0", shutter: "#c0443a", roof: "#c75a3a", rail: "#3f7f5a" }, // cream
  { wall: "#9ccf7a", shutter: "#2a6fb0", roof: "#d4703e", rail: "#f5efe0" }, // lime
  { wall: "#f49a5a", shutter: "#2f6f8a", roof: "#b8543a", rail: "#f5efe0" }, // mango
];
/** front facade on local +z; hipped roof; optional first-floor balcony across the front */
export const tropicHouse = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, st: HouseStyle, balcony = true, key = "") => {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const k = `${key}${st.wall}_${w}_${h}`;
  const front = lam("thf" + k, () => ({ map: facadeHD("thf" + k, w, h, { wall: st.wall, shutter: st.shutter, door: true }) }));
  const side = lam("ths" + st.wall + h, () => ({ map: facadeHD("ths" + st.wall + h, 8, h, { wall: st.wall, shutter: st.shutter }) }));
  const hw = w / 2, hd = d / 2;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), side, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  const trim = lam("thTrim", () => ({ color: "#f6eedc" }));
  b.add(boxGeo(V(-hw - 0.1, h - 0.3, -hd - 0.1), V(hw + 0.1, h, hd + 0.1)), trim, m);      // cornice
  b.add(boxGeo(V(-hw - 0.05, 0, -hd - 0.05), V(hw + 0.05, 0.4, hd + 0.05)), lam("thPlinth", () => ({ color: "#b9a68a" })), m);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * hw - 0.12, 0, hd - 0.02), V(s * hw + 0.12, h, hd + 0.1)), trim, m); // corner pilasters
  // hipped roof
  const o = 0.45, rh = Math.min(w, d) * 0.38, rm = lam("thRoof" + st.roof, () => ({ map: roofHD(st.roof), side: THREE.DoubleSide }));
  const rx = Math.max(0.01, hw - hd);
  const A = V(-hw - o, h, hd + o), B = V(hw + o, h, hd + o), C = V(hw + o, h, -hd - o), D = V(-hw - o, h, -hd - o), R1 = V(-rx, h + rh, 0), R2 = V(rx, h + rh, 0);
  const uw = (w + 2 * o) / 3, uv = (hd + o) / 3;
  b.add(quad(A, B, R2, R1, uw, uv), rm, m); b.add(quad(C, D, R1, R2, uw, uv), rm, m);
  b.add(tri(B, C, R2), rm, m); b.add(tri(D, A, R1), rm, m);
  b.add(boxGeo(V(-rx - 0.08, h + rh - 0.05, -0.08), V(rx + 0.08, h + rh + 0.08, 0.08)), lam("thRidge", () => ({ color: "#a64a30" })), m);
  if (balcony && h > 5) {
    const y = 2.95, rail = lam("thRail" + (st.rail ?? "#f5efe0"), () => ({ color: st.rail ?? "#f5efe0" }));
    b.add(boxGeo(V(-hw + 0.2, y - 0.12, hd), V(hw - 0.2, y + 0.04, hd + 0.95), 1, true), lam("thBalc", () => ({ map: beamHD() })), m);
    b.add(boxGeo(V(-hw + 0.2, y + 0.95, hd + 0.88), V(hw - 0.2, y + 1.0, hd + 0.98)), rail, m);
    b.add(boxGeo(V(-hw + 0.2, y + 0.08, hd + 0.88), V(hw - 0.2, y + 0.13, hd + 0.98)), rail, m);
    for (let px = -hw + 0.25; px <= hw - 0.2; px += 0.18) b.add(boxGeo(V(px - 0.022, y + 0.04, hd + 0.9), V(px + 0.022, y + 0.96, hd + 0.96)), rail, m);
    for (const s of [-1, 1]) b.add(boxGeo(V(s * (hw - 0.3) - 0.05, y - 0.7, hd), V(s * (hw - 0.3) + 0.05, y - 0.1, hd + 0.8)), rail, m); // brackets
  }
};

// ---------------- hills / islands ----------------
export const hill = (parent: THREE.Object3D, pos: V3, sx: number, sy: number, sz: number, base = "#5fa548", rep = 6) => {
  const geo = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2);
  const p = geo.attributes.position as THREE.BufferAttribute; const r = rng(Math.round(pos[0] * 13 + pos[2] * 7));
  const bumps = Array.from({ length: 5 }, () => [r() * TAU, 0.06 + r() * 0.08, 1 + Math.floor(r() * 3)]);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x); let k = 1; for (const [ph, amp, f] of bumps) k += amp * Math.sin(a * f + ph); p.setY(i, p.getY(i) * k); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, lam(`hillM${base}_${rep}`, () => { const t = hillTex(base).clone(); t.repeat.set(rep, Math.max(1, rep / 4)); t.needsUpdate = true; return { map: t }; }));
  m.scale.set(sx, sy, sz); m.position.set(...pos); m.receiveShadow = true; parent.add(m); return m;
};

// ---------------- water pieces ----------------
/** flat foam patch on the water (NOINK) whose texture scrolls in pose */
export const foamPatch = (parent: THREE.Object3D, w: number, d: number, pos: V3, yaw = 0, op = 0.85) => {
  const t = foamTex().clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, w / 2), Math.max(1, d / 3));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: op, depthWrite: false, color: "#ffffff" }));
  m.position.set(...pos); m.rotation.y = yaw; m.layers.set(NOINK); m.renderOrder = 2; parent.add(m); return m;
};
/** an arcing stream of water from a (spout) to b (landing): a flattened tube along a parabola whose painted
 *  streaks scroll along it, a white core, and spray drops that run down the arc; call .run(t, k) from pose */
export const waterStream = (parent: THREE.Object3D, a: V3, b: V3, lift: number, rad: number) => {
  const A = V(...a), B = V(...b), mid = A.clone().lerp(B, 0.3); mid.y = Math.max(A.y, B.y) + lift;
  const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
  const tx = streamTex().clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1, 3);
  const mat = twoTone(new THREE.MeshPhongMaterial({ map: tx, color: "#ffffff", emissive: "#3aa8d8", emissiveIntensity: 0.5, specular: "#ffffff", shininess: 100, transparent: true, opacity: 0.88 }), 0.5);
  const geo = new THREE.TubeGeometry(curve, 28, rad, 10, false);
  { const p = geo.attributes.position as THREE.BufferAttribute; const n = 11; for (let i = 0; i < p.count; i++) { const seg = Math.floor(i / n) / 28, c = curve.getPoint(seg), v = V(p.getX(i), p.getY(i), p.getZ(i)).sub(c); const w = 1 + 1.4 * seg; v.multiplyScalar(w); p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z); } geo.computeVertexNormals(); }
  const m = new THREE.Mesh(geo, mat); m.castShadow = false; parent.add(m);
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, rad * 0.35, 6, false), new THREE.MeshBasicMaterial({ color: "#f4fdff", transparent: true, opacity: 0.8, depthWrite: false })); core.layers.set(NOINK); parent.add(core);
  const dropM = new THREE.MeshBasicMaterial({ color: "#e8fbff" }), r = rng(Math.round(a[2] * 100 + b[0] * 10 + 7));
  const drops = Array.from({ length: 12 }, () => { const d = new THREE.Mesh(new THREE.SphereGeometry(rad * (0.25 + r() * 0.35), 6, 5), dropM); d.userData = { ph: r(), off: V((r() - 0.5) * rad * 5, (r() - 0.5) * rad * 4, (r() - 0.5) * rad * 5) }; d.layers.set(NOINK); parent.add(d); return d; });
  const run = (t: number, k = 1) => { tx.offset.y = -t * 2.6; drops.forEach((d) => { const u = (t * 0.9 + d.userData.ph) % 1; d.position.copy(curve.getPoint(u)).addScaledVector(d.userData.off, 0.4 + u * 1.6); d.visible = k > 0.2; }); };
  return { m, tx, run };
};

// ---------------- lights: torches, string lights ----------------
const flameTex = () => ctex("flameCard", 128, 256, (g) => {
  const gr = g.createRadialGradient(64, 180, 4, 64, 160, 110); gr.addColorStop(0, "rgba(255,255,220,1)"); gr.addColorStop(0.3, "rgba(255,210,90,1)"); gr.addColorStop(0.65, "rgba(255,120,30,0.9)"); gr.addColorStop(1, "rgba(255,80,20,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(64, 10); g.bezierCurveTo(100, 90, 120, 160, 100, 210); g.quadraticCurveTo(64, 250, 28, 210); g.bezierCurveTo(8, 160, 28, 90, 64, 10); g.fill();
});
export type Torch = { g: THREE.Group; flame: THREE.Sprite; light: THREE.PointLight | null; glow: THREE.Sprite; seed: number; base: number };
/** standing torch: wooden pole, iron bowl, flame card (NOINK), glow, optional real point light */
export const torch = (parent: THREE.Object3D, pos: V3, h = 2.2, light = true, intensity = 7, dist = 9): Torch => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, h, 8).translate(0, h / 2, 0), M.beam()); pole.castShadow = true; g.add(pole);
  for (const y of [0.3, h - 0.5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12).rotateX(Math.PI / 2), M.gold()); ring.position.y = y; g.add(ring); }
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 0.18, 12, 1, true), lam("torchBowl", () => ({ color: "#5d4a3e", side: THREE.DoubleSide }))); bowl.position.y = h + 0.06; g.add(bowl);
  const coal = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff8a2a").multiplyScalar(1.6) })); coal.position.y = h + 0.12; coal.layers.set(NOINK); g.add(coal);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), color: new THREE.Color(1.6, 1.3, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  flame.center.set(0.5, 0.08); flame.position.y = h + 0.1; flame.scale.set(0.42, 0.75, 1); flame.layers.set(NOINK); flame.renderOrder = 4; g.add(flame);
  const gl = glow(g, [0, h + 0.4, 0], "#ffa040", 2.2, 1);
  let L: THREE.PointLight | null = null;
  if (light) { L = new THREE.PointLight("#ff9c48", intensity, dist, 1.4); L.position.set(0, h + 0.45, 0); g.add(L); }
  return { g, flame, light: L, glow: gl, seed: pos[0] * 3.1 + pos[2] * 1.7, base: intensity };
};
export const flickerTorch = (tc: Torch, t: number) => {
  const f = 0.85 + 0.15 * Math.sin(t * 17 + tc.seed) * Math.sin(t * 6.3 + tc.seed * 2);
  tc.flame.scale.set(0.42 * (0.95 + 0.1 * Math.sin(t * 11 + tc.seed)), 0.75 * f * (0.95 + 0.08 * Math.sin(t * 23 + tc.seed)), 1);
  if (tc.light) tc.light.intensity = tc.base * f; (tc.glow.material as THREE.SpriteMaterial).opacity = 0.7 + 0.3 * f;
};
/** a catenary string of warm bulbs between a and b; returns bulbs + glow sprites for twinkle */
export const stringLights = (parent: THREE.Object3D, a: V3, b: V3, sag: number, n: number, col = "#ffd27a", cols?: string[]) => {
  const A = V(...a), B = V(...b), P = (u: number) => A.clone().lerp(B, u).add(V(0, -sag * 4 * u * (1 - u), 0));
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => P(i / 11))), 24, 0.012, 4, false), lam("wire", () => ({ color: "#3d3640" })));
  parent.add(wire);
  const geo = new THREE.SphereGeometry(0.055, 8, 6);
  const bulbs: THREE.Mesh[] = [], glows: THREE.Sprite[] = [];
  for (let i = 1; i < n; i++) {
    const c = cols ? cols[i % cols.length] : col;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.0) })); const p = P(i / n); m.position.copy(p).add(V(0, -0.06, 0)); m.layers.set(NOINK); parent.add(m); bulbs.push(m);
    glows.push(glow(parent, [p.x, p.y - 0.06, p.z], c, 0.55, 0.9));
  }
  return { bulbs, glows };
};
export const twinkle = (glows: THREE.Sprite[], t: number) => glows.forEach((s, i) => { (s.material as THREE.SpriteMaterial).opacity = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7); });
/** additive twinkling star sparkles (ice glints) */
export const sparkles = (parent: THREE.Object3D, n: number, c: V3, sx: number, sy: number, sz: number, seed = 1, size = 0.35) => {
  const r = rng(seed), tex = starTex();
  return Array.from({ length: n }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(1.6, 1.7, 1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.position.set(c[0] + (r() - 0.5) * sx, c[1] + r() * sy, c[2] + (r() - 0.5) * sz); s.userData = { ph: r() * TAU, sp: 1.5 + r() * 2.5, sz: size * (0.5 + r()) };
    s.layers.set(NOINK); s.renderOrder = 6; parent.add(s); return s;
  });
};
export const sparkle = (ss: THREE.Sprite[], t: number, k = 1) => ss.forEach((s) => { const u = s.userData, a = Math.max(0, Math.sin(t * u.sp + u.ph)) ** 6; s.scale.setScalar(u.sz * a * k + 0.001); s.material.rotation = t * 0.6 + u.ph; });
/** puff of mist that rises + fades on a loop (steam / frost vapour / smoke) */
export const puff = (parent: THREE.Object3D, pos: V3, size: number, col: string, op: number) => { const m = mist(parent, pos, size, col, op); m.userData = { p: pos, size, op }; return m; };
export const risePuffs = (ms: THREE.Sprite[], t: number, rise = 1.2, speed = 0.3, grow = 1.6, k = 1) => ms.forEach((m, i) => {
  const u = (t * speed + i / ms.length) % 1, d = m.userData;
  m.position.set(d.p[0] + Math.sin(i * 3 + t * 0.5) * 0.1, d.p[1] + u * rise, d.p[2]);
  (m.material as THREE.SpriteMaterial).opacity = d.op * Math.sin(Math.PI * u) * k; const s = d.size * (0.6 + grow * u); m.scale.set(s, s * 0.7, 1);
});

/** cold inner glow around a big ice block (additive shell + cyan glow card, NOINK) so it glistens in warm light */
export const iceHalo = (parent: THREE.Object3D, w: number, h: number, d: number, k = 1) => {
  const shell = new THREE.Mesh(new THREE.BoxGeometry(w * 1.03, h * 1.03, d * 1.03).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color("#7fdcff").multiplyScalar(0.16 * k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  shell.layers.set(NOINK); shell.renderOrder = 4; parent.add(shell);
  const gl = glow(parent, [0, h * 0.55, 0], "#8fe2ff", Math.max(w, h) * 2.0, 0.22 * k);
  return { shell, gl };
};
// ---------------- dashed ghost box (original block size) ----------------
export const ghostBox = (parent: THREE.Object3D, w: number, h: number, d: number, pos: V3, col = "#eafcff") => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false });
  const T = 0.022, dash = 0.07, gap = 0.05;
  const edge = (a: THREE.Vector3, b: THREE.Vector3) => {
    const L = a.distanceTo(b), dir = b.clone().sub(a).normalize();
    for (let s = 0; s < L; s += dash + gap) {
      const e = Math.min(L, s + dash), me = new THREE.Mesh(new THREE.BoxGeometry(T, e - s, T), m);
      me.position.copy(a.clone().addScaledVector(dir, (s + e) / 2)); me.quaternion.setFromUnitVectors(V(0, 1, 0), dir); me.layers.set(NOINK); me.renderOrder = 5; g.add(me);
    }
  };
  const hw = w / 2, hd = d / 2, c = [V(-hw, 0, -hd), V(hw, 0, -hd), V(hw, 0, hd), V(-hw, 0, hd)];
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; edge(a, b); edge(a.clone().setY(h), b.clone().setY(h)); edge(a, a.clone().setY(h)); }
  const fill = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color: "#bfefff", transparent: true, opacity: 0.12, depthWrite: false }));
  fill.layers.set(NOINK); fill.renderOrder = 5; g.add(fill);
  return g;
};

// ---------------- small boat with a lateen sail ----------------
export const sailBoat = (parent: THREE.Object3D, pos: V3, yaw: number, s = 1, hull = "#8a4a2e", sail = "#f3e6c8", stripe = "#c8352e") => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; g.scale.setScalar(s); parent.add(g);
  const sh = new THREE.Shape(); sh.moveTo(-2.2, 0.55); sh.quadraticCurveTo(0, 0.45, 2.4, 0.85); sh.quadraticCurveTo(1.6, -0.3, 0.6, -0.35); sh.lineTo(-1.6, -0.35); sh.quadraticCurveTo(-2.3, -0.1, -2.2, 0.55);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 2 }); geo.translate(0, 0, -0.55);
  const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 1);
  const hm = new THREE.Mesh(geo, lam("boatHull" + hull, () => ({ map: boatTex(hull, stripe) }))); hm.castShadow = true; hm.receiveShadow = true; g.add(hm);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 1.0), lam("boatFloor", () => ({ map: beamHD() }))); inner.position.set(0.1, 0.42, 0); g.add(inner);
  const mast = lam("boatMast", () => ({ color: "#6e4b33" }));
  rod(g, [0.3, 0.4, 0], [0.3, 3.4, 0], 0.05, mast);
  const yard: V3[] = [[-1.9, 1.1, 0], [1.9, 4.2, 0]]; rod(g, yard[0], yard[1], 0.035, mast);
  const sg = new THREE.BufferGeometry(); const S = (x: number, y: number, z: number) => [x, y, z];
  const pts = [S(-1.8, 1.15, 0.02), S(1.85, 4.12, 0.02), S(1.3, 0.75, 0.02)];
  sg.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3)); sg.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0], 2)); sg.computeVertexNormals();
  const sm2 = new THREE.Mesh(sg, twoTone(new THREE.MeshLambertMaterial({ map: sailTex(sail), side: THREE.DoubleSide }))); sm2.castShadow = true; g.add(sm2);
  return g;
};
const boatTex = (col: string, stripe: string) => ctex(`boatTex|${col}|${stripe}`, 512, 256, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = col; g.fillRect(0, i * 32, 512, 32); g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.06})`; g.fillRect(0, i * 32, 512, 32); g.fillStyle = "rgba(30,15,8,0.55)"; g.fillRect(0, i * 32, 512, 3); }
  g.fillStyle = stripe; g.fillRect(0, 40, 512, 18); g.fillStyle = "#f2d16a"; for (let x = 10; x < 512; x += 40) { g.beginPath(); g.arc(x, 49, 5, 0, TAU); g.fill(); }
  for (let i = 0; i < 200; i++) { g.fillStyle = "rgba(20,10,6,0.2)"; g.fillRect(r() * 512, r() * 256, 20 + r() * 50, 1); }
});

/** painted text board face as a texture (multi-line, auto-fit), used for in-world graphics */
export const boardTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => ctex("board|" + key, w, h, draw);
export const fitText = (g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, size: number, font = "900 %spx Georgia, serif") => {
  let fs = size; g.font = font.replace("%s", String(fs)); const mw = g.measureText(text).width; if (mw > maxW) { fs *= maxW / mw; g.font = font.replace("%s", String(fs)); }
  g.fillText(text, x, y); return fs;
};
export { rod, glow, mist };
