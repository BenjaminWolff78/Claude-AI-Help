// CHANNEL ART (Loophole Lou): the banner's sunset rooftop skyline rebuilt as a lit, ink-outlined 3D set in the short's style.
// Same pieces as the original vector banner: plum rooftops (castle walls with crenellations, gables, a pagoda roof, pointed
// towers), a low sun with soft rays, puffy clouds, two certificates with red seals, gold coins, a gold key, a chest for the
// rat in sunglasses, white sparkles. Lou stands on the left castle wall. A second little stage at x = 200 holds the
// profile-picture backdrop (orange sunburst + navy disc). Marks: lou, rat, louPP. Cameras: banner, pp.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex } from "../paint";
import { NOINK } from "../ink";
import type { SetBuilder, V3 } from "./types";

const INKC = "#241726";
// the banner camera (2560 x 1440): pos (0, 8.2, 36) looking straight ahead (-z), vertical fov 30 deg
const CAM_Y = 8.2, CAM_Z = 36, TV = Math.tan((15 * Math.PI) / 180), ASP = 16 / 9;
/** the world point at depth z that the banner camera sees at frame fractions (u across, v down) */
const at = (u: number, v: number, z: number): V3 => { const d = CAM_Z - z; return [(2 * u - 1) * d * TV * ASP, CAM_Y + (1 - 2 * v) * d * TV, z]; };
export const skyline: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const P = ["#4a2c4c", "#5a3658", "#6a4064", "#3c2440", "#734a6c"].map((c, i) => lam("skP" + i, () => ({ color: c })));
  const roofM = ["#3a2140", "#4e2c4e", "#62385c"].map((c, i) => lam("skR" + i, () => ({ color: c })));
  // ground band (the flat dark street in front of the rooftops)
  b.add(boxGeo(V(-80, -0.2, -40), V(80, 0, 30)), lam("skG", () => ({ color: "#3a2238" })));
  const box = (x: number, z: number, w: number, d: number, h: number, m: THREE.Material) => b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2)), m);
  const castle = (x: number, z: number, w: number, d: number, h: number, i: number) => {
    box(x, z, w, d, h, P[i % 5]);
    const n = Math.max(2, Math.round(w / 1.1));
    for (let k = 0; k < n; k++) if (k % 2 === 0) b.add(boxGeo(V(x - w / 2 + (k * w) / n, h, z + d / 2 - 0.5), V(x - w / 2 + ((k + 1) * w) / n, h + 0.55, z + d / 2)), P[(i + 1) % 5]);
  };
  const gable = (x: number, z: number, w: number, d: number, h: number, i: number) => {
    box(x, z, w, d, h, P[i % 5]);
    const g = new THREE.BufferGeometry(); const hw = w / 2 + 0.25, hd = d / 2 + 0.25, rh = w * 0.5;
    const v = [[-hw, h, hd], [hw, h, hd], [0, h + rh, hd], [-hw, h, -hd], [hw, h, -hd], [0, h + rh, -hd]].map(([a, c, e]) => [a + x, c, e + z]);
    const tri = [0, 1, 2, 4, 3, 5, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2];
    g.setAttribute("position", new THREE.Float32BufferAttribute(tri.flatMap((k) => v[k]), 3)); g.computeVertexNormals();
    b.add(g, roofM[i % 3]);
  };
  const spire = (x: number, z: number, w: number, h: number, sh: number, i: number) => {
    box(x, z, w, w, h, P[i % 5]);
    b.add(new THREE.ConeGeometry(w * 0.82, sh, 4).rotateY(Math.PI / 4).translate(x, h + sh / 2, z), roofM[(i + 1) % 3]);
  };
  const pagoda = (x: number, z: number, w: number, h: number, i: number) => {
    box(x, z, w, w, h, P[i % 5]);
    for (let t = 0; t < 2; t++) {
      const y = h + t * 1.5, ww = w * (1.25 - t * 0.3);
      b.add(new THREE.CylinderGeometry(ww * 0.35, ww * 0.85, 0.9, 4, 1).rotateY(Math.PI / 4).translate(x, y + 0.45, z), roofM[(i + t) % 3]);
      if (t === 0) box(x, z, w * 0.6, w * 0.6, y + 1.5, P[(i + 2) % 5]);
    }
    b.add(new THREE.ConeGeometry(0.2, 1.4, 6).translate(x, h + 3.6, z), roofM[0]);
  };
  // back row (far, lower contrast)
  [[-26, 3.5, 6], [-21, 5, 5], [-15, 4, 7], [-8, 6, 5], [-2, 4.5, 6], [4, 5.5, 5], [10, 4, 6], [16, 6.5, 5], [22, 4.5, 6], [28, 5, 5]].forEach(([x, w, h], i) => (i % 3 === 0 ? gable : castle)(x, -14, w, 4, h, i + 2));
  spire(6.5, -12, 3.2, 7.5, 4.5, 1); spire(-17, -12, 2.6, 6.5, 3.6, 3);
  // middle row
  castle(-22, -6, 6, 4, 6.2, 0); gable(-15.5, -6, 5, 4, 5, 1); gable(-9.5, -6, 4.4, 4, 4.4, 2); pagoda(-3.2, -6, 4.2, 4.6, 3); gable(2.6, -6, 5, 4, 5.2, 4);
  castle(8.6, -6, 5, 4, 6.6, 1); spire(12.5, -5, 3, 8.2, 5.2, 2); gable(17, -6, 4.6, 4, 5, 3); castle(23, -6, 6, 4, 4.6, 4); pagoda(28, -6, 4, 4.2, 0);
  // foreground towers: Lou's (left) and the rat's (right), nearer the lens so both read big like the original
  { const L = at(0.24, 0.75, 18); castle(L[0], 18, 2.6, 2.4, L[1], 3); const R = at(0.82, 0.73, 14); castle(R[0], 14, 2.2, 2.2, R[1], 1); }
  // front row
  castle(-13.2, 3, 7.2, 3, 3.6, 3); gable(-21, 2, 6, 3, 3.4, 0); gable(-6.8, 1.2, 4.2, 3, 2.6, 2); gable(7.2, 1.2, 4.2, 3, 2.6, 1);
  castle(13.2, 3, 7.2, 3, 3.2, 3); gable(20.5, 2, 6, 3, 3.8, 4); castle(0.2, -0.2, 5.4, 3, 1.8, 0);
  b.build(root);
  // the sun (low, behind the middle of the skyline) + soft rays fanning out of it (painted, no ink)
  const SUN: V3 = at(0.5, 0.63, -40);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5.6, 48), new THREE.MeshBasicMaterial({ color: "#ffe6a6", fog: false })); sun.position.set(...SUN); sun.layers.set(NOINK); root.add(sun);
  const rayTex = ctex("skRays", 1024, 1024, (g) => {
    for (let k = 0; k < 18; k++) { const a0 = (k / 18) * Math.PI * 2, a1 = a0 + Math.PI / 18; const gr = g.createRadialGradient(512, 512, 40, 512, 512, 512); gr.addColorStop(0, "rgba(255,240,210,0.34)"); gr.addColorStop(1, "rgba(255,240,210,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(512, 512); g.arc(512, 512, 520, a0, a1); g.closePath(); g.fill(); }
  });
  const rays = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  rays.position.set(SUN[0], SUN[1], SUN[2] - 1); rays.layers.set(NOINK); root.add(rays);
  // clouds: soft puffs (lit, inked)
  const cloudM = lam("skCloud", () => ({ color: "#f0dcdc" }));
  const cloud = (x: number, y: number, z: number, s: number) => { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); root.add(g);
    for (const [dx, dy, r] of [[-1.3, 0, 1.0], [0, 0.45, 1.35], [1.3, 0.05, 1.05], [0.6, -0.25, 0.9], [-0.6, -0.25, 0.9]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14).scale(1, 0.82, 0.7), cloudM); m.position.set(dx, dy, 0); g.add(m); } };
  for (const [u, v, sc] of [[0.15, 0.17, 1.55], [0.37, 0.09, 1.25], [0.72, 0.22, 1.1], [0.88, 0.14, 1.55]]) { const c = at(u, v, -30); cloud(c[0], c[1], c[2], sc); }
  // floating treasures: certificates with red seals, coins, a key, sparkles
  const certTex = ctex("skCert", 256, 330, (g) => { g.fillStyle = "#f6ecd2"; g.fillRect(0, 0, 256, 330); g.strokeStyle = INKC; g.lineWidth = 12; g.strokeRect(6, 6, 244, 318); g.fillStyle = "#3a2a3a";
    for (let k = 0; k < 6; k++) g.fillRect(40, 60 + k * 34, k === 5 ? 110 : 176, 9); g.fillStyle = "#d8352e"; g.beginPath(); g.arc(196, 268, 30, 0, 6.3); g.fill(); g.lineWidth = 7; g.stroke(); });
  const certM = lam("skCertM", () => ({ map: certTex }));
  const cert = (x: number, y: number, z: number, rz: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.2, 0.06), [certM, certM, certM, certM, certM, certM]); m.position.set(x, y, z); m.rotation.set(0.1, -0.2 * Math.sign(x), rz); m.castShadow = true; root.add(m); };
  { const a = at(0.09, 0.36, 10), c = at(0.91, 0.39, 10); cert(a[0], a[1], 10, 0.3); cert(c[0], c[1], 10, -0.24); }
  const gold = new THREE.MeshPhongMaterial({ color: "#f2b632", specular: "#fff2b0", shininess: 60, emissive: "#8a5a10" });
  const coins: THREE.Object3D[] = [];
  const coin = (x: number, y: number, z: number) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 28).rotateX(Math.PI / 2), gold); c.castShadow = true; g.add(c);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 24), new THREE.MeshBasicMaterial({ color: "#c98a22" })); r.position.z = 0.055; g.add(r); coins.push(g); };
  for (const [u, v] of [[0.16, 0.6], [0.78, 0.32], [0.84, 0.54]]) coin(...at(u, v, 12));
  const key = new THREE.Group(); key.position.set(...at(0.9, 0.7, 12)); key.rotation.z = 0.42; key.scale.setScalar(0.5); root.add(key);
  key.add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 10, 28), gold)); key.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 0.26).translate(1.95, 0, 0), gold));
  for (const x of [2.7, 3.15]) key.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.24).translate(x, -0.4, 0), gold));
  // the rat's chest on the right tower
  const chestM = lam("skChest", () => ({ color: "#b8642e" })), bandM = lam("skBand", () => ({ color: "#5a3424" }));
  const RT = at(0.82, 0.73, 14), extra = new Batch();
  extra.add(boxGeo(V(RT[0] - 0.55, RT[1], 13.6), V(RT[0] + 0.55, RT[1] + 0.55, 14.3)), chestM); extra.add(boxGeo(V(RT[0] - 0.58, RT[1] + 0.55, 13.56), V(RT[0] + 0.58, RT[1] + 0.72, 14.34)), bandM);
  extra.add(boxGeo(V(RT[0] - 0.08, RT[1] + 0.22, 14.3), V(RT[0] + 0.08, RT[1] + 0.48, 14.36)), lam("skLock", () => ({ color: "#f2b632" }))); extra.build(root);
  // sparkles (white 4-point stars, inked)
  const sparkTex = ctex("skSpark", 128, 128, (g) => { const st = (r1: number, r2: number) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? r2 : r1; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); };
    st(60, 13); g.fillStyle = INKC; g.fill(); st(50, 8); g.fillStyle = "#ffffff"; g.fill(); });
  const sparks: THREE.Sprite[] = [];
  for (const [x, y, z, s] of [[...at(0.27, 0.27, 10), 0.75], [...at(0.5, 0.21, 10), 0.6], [...at(0.73, 0.26, 10), 0.9], [...at(0.055, 0.6, 10), 0.6], [...at(0.945, 0.62, 10), 0.7], [200.86, 2.6, -1.2, 0.34], [199.12, 2.32, -1.2, 0.22]] as number[][]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, depthWrite: true, alphaTest: 0.3 })); sp.position.set(x, y, z); sp.scale.setScalar(s); sp.layers.set(NOINK); root.add(sp); sparks.push(sp);
  }
  // ---- profile-picture stage at x = 200: an orange sunburst wall, a navy disc behind the head ----
  const burst = ctex("skBurst", 1024, 1024, (g) => {
    const gr = g.createRadialGradient(512, 560, 40, 512, 560, 720); gr.addColorStop(0, "#f9c25a"); gr.addColorStop(1, "#e8892e"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 16; k++) { const a0 = (k / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16; g.fillStyle = "rgba(255,236,190,0.22)"; g.beginPath(); g.moveTo(512, 560); g.arc(512, 560, 900, a0, a1); g.closePath(); g.fill(); }
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: burst, fog: false })); wall.position.set(200, 2.0, -3); wall.layers.set(NOINK); root.add(wall);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.1, 64).rotateX(Math.PI / 2), lam("skNavy", () => ({ color: "#3c4a7e" }))); disc.position.set(200, 1.5, -1.6); root.add(disc);
  const marks: Record<string, V3> = { lou: at(0.24, 0.75, 18), rat: [RT[0], RT[1] + 0.72, 13.95], louPP: [200, -0.25, 0.4] };
  const cams = { banner: { pos: [0, CAM_Y, CAM_Z] as V3, look: [0, CAM_Y, 0] as V3, fov: 30 }, pp: { pos: [200, 1.98, 3.2] as V3, look: [200, 1.86, 0] as V3, fov: 39 } };
  return {
    name: "skyline", root, marks, cams,
    pose: (t) => { coins.forEach((c, i) => (c.rotation.y = 0.35 * Math.sin(i * 1.7 + t))); void sparks; },
  };
};
