// CHANNEL ART v2 (Loophole Lou, master prompt part 14 look): the original banner's layout - Lou on a wall at the left,
// the title over a sunset skyline, two certificates with red seals, gold coins, a key, the rat on his chest at the
// right, sparkles - rebuilt as a real, lit, textured old-town skyline at golden hour: plaster and brick facades with
// windows, terracotta and slate roofs, chimneys, a stone wall walk, a round tower with a slate cone, a low sun with
// bloom behind the roofs, puffy cumulus. No ink lines on the world; characters keep their drawn outline.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house } from "../build";
import { ctex, stoneHD, roofHD, rep } from "../paint";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { cumulusTex } from "../real";
import type { SetBuilder, V3 } from "./types";

// the banner camera (2560 x 1440): pos (0, 8.2, 36) looking straight ahead (-z), vertical fov 30 deg
const CAM_Y = 8.2, CAM_Z = 36, TV = Math.tan((15 * Math.PI) / 180), ASP = 16 / 9;
const at = (u: number, v: number, z: number): V3 => { const d = CAM_Z - z; return [(2 * u - 1) * d * TV * ASP, CAM_Y + (1 - 2 * v) * d * TV, z]; };

export const loutown: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const stone = lam("ltStone", () => ({ map: rep(stoneHD("ltStoneHD", ["#d9c6a8", "#cdb998", "#e2d0b4", "#c4ae8c"], "#9c8a70"), 2, 2) }));
  const stoneDark = lam("ltStone2", () => ({ map: rep(stoneHD("ltStoneHD2", ["#bfa98a", "#b39d7e", "#c8b294", "#a8927a"], "#8a7660"), 2, 2) }));
  const slate = lam("ltSlate", () => ({ map: roofHD("#7d8796", true), side: THREE.DoubleSide }));
  // ground: a cobbled square far below the roofline (hidden by the wall walk in front)
  b.add(boxGeo(V(-90, -0.2, -60), V(90, 0, 30)), lam("ltGround", () => ({ color: "#8a7a66" })));
  // ---- the town: three rows of gabled houses at different depths (fronts face the camera) ----
  const row = (z: number, xs: [number, number, number, number][]) => xs.forEach(([x, w, h, si], i) => house(b, x, z, 0, w, 6 + (i % 2), h, si, 0));
  row(-14, [[-30, 7, 9, 2], [-22, 6, 11, 5], [-15, 7, 8, 0], [-8, 6, 10, 6], [-1, 7, 9, 3], [6, 6, 11, 1], [13, 7, 8, 7], [20, 6, 10, 4], [28, 7, 9, 2]]);
  row(-4, [[-26, 6, 7, 1], [-19.5, 6.5, 6, 3], [-12.5, 6, 7.5, 4], [-5.5, 7, 6.5, 0], [1.5, 6, 7, 6], [8.5, 6.5, 6, 2], [15.5, 6, 7.5, 5], [22.5, 6.5, 6.5, 7]]);
  // ---- the round tower with a slate cone (right of centre, like the original's pointed towers) ----
  const tower = (x: number, z: number, r: number, h: number, cone: number) => {
    b.add(new THREE.CylinderGeometry(r, r * 1.05, h, 28, 1).translate(x, h / 2, z), stone);
    b.add(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.35, 28).translate(x, h + 0.17, z), stoneDark);
    b.add(new THREE.ConeGeometry(r * 1.25, cone, 28, 1, true).translate(x, h + 0.35 + cone / 2, z), slate);
    b.add(new THREE.ConeGeometry(0.08, 0.9, 8).translate(x, h + 0.35 + cone + 0.4, z), lam("ltFinial", () => ({ color: "#c9a646" })));
  };
  tower(10.5, -9, 2.4, 13.5, 5.5); tower(-24, -10, 2.0, 12, 4.6);
  // ---- the foreground wall walk (stone parapet with crenellations) across the bottom; Lou stands on its left end ----
  const LOU = at(0.24, 0.75, 18), RT = at(0.82, 0.73, 14);
  const wall = (x0: number, x1: number, z: number, top: number, d = 1.6) => {
    b.add(boxGeo(V(x0, -0.2, z - d / 2), V(x1, top, z + d / 2), 2), stone);
    const n = Math.max(2, Math.round((x1 - x0) / 0.9));
    for (let k = 0; k < n; k++) if (k % 2 === 0) b.add(boxGeo(V(x0 + (k * (x1 - x0)) / n, top, z + d / 2 - 0.45), V(x0 + ((k + 1) * (x1 - x0)) / n, top + 0.55, z + d / 2), 1), stoneDark);
  };
  wall(LOU[0] - 3.2, LOU[0] + 1.6, 18, LOU[1]);                    // Lou's wall
  wall(-26, LOU[0] - 3.2, 16, LOU[1] - 0.6, 2.4);                  // the wall runs on to the left edge
  // the rat's round turret at the right with the chest on top
  b.add(new THREE.CylinderGeometry(1.25, 1.35, RT[1] + 0.2, 24).translate(RT[0], (RT[1] - 0.2) / 2, 14), stone);
  b.add(new THREE.CylinderGeometry(1.42, 1.42, 0.3, 24).translate(RT[0], RT[1] - 0.1, 14), stoneDark);
  wall(RT[0] + 1.2, 26, 14.6, RT[1] - 0.9, 2.2);
  b.build(root);
  // chest (wood + iron bands + gold lock)
  const chest = new Batch(), wood = lam("ltChest", () => ({ color: "#9a5a32" })), band = lam("ltBand", () => ({ color: "#3e2e26" })), goldL = lam("ltGold", () => ({ color: "#e0a830" }));
  chest.add(boxGeo(V(RT[0] - 0.55, RT[1], 13.65), V(RT[0] + 0.55, RT[1] + 0.55, 14.35)), wood);
  chest.add(boxGeo(V(RT[0] - 0.58, RT[1] + 0.55, 13.6), V(RT[0] + 0.58, RT[1] + 0.72, 14.4)), band);
  chest.add(boxGeo(V(RT[0] - 0.08, RT[1] + 0.22, 14.35), V(RT[0] + 0.08, RT[1] + 0.48, 14.42)), goldL); chest.build(root);
  // ---- the low sun behind the roofs (hot disc + bloom halo + soft rays) ----
  const SUN: V3 = at(0.5, 0.6, -60);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff1c8").multiplyScalar(2.6), fog: false, toneMapped: true }));
  sun.position.set(...SUN); sun.layers.set(NOINK); root.add(sun);
  glow(root, [SUN[0], SUN[1], SUN[2] + 1], "#ffc777", 30, 0.8);
  glow(root, [SUN[0], SUN[1], SUN[2] + 2], "#ffe2a8", 18, 1.2);
  const rayTex = ctex("ltRays", 1024, 1024, (g) => {
    for (let k = 0; k < 16; k++) { const a0 = (k / 16) * Math.PI * 2, a1 = a0 + Math.PI / 22; const gr = g.createRadialGradient(512, 512, 30, 512, 512, 512); gr.addColorStop(0, "rgba(255,232,190,0.20)"); gr.addColorStop(1, "rgba(255,232,190,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(512, 512); g.arc(512, 512, 520, a0, a1); g.closePath(); g.fill(); }
  });
  const rays = new THREE.Mesh(new THREE.PlaneGeometry(190, 190), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  rays.position.set(SUN[0], SUN[1], SUN[2] - 2); rays.layers.set(NOINK); root.add(rays);
  // ---- cumulus around the title (lit from the low sun: warm tops, cool grey bases) ----
  const pal = { lit: "#fff6e8", mid: "#ffe0c0", shade: "#8e96ac" };
  for (const [u, v, w, k] of [[0.13, 0.15, 13, 0], [0.37, 0.07, 9, 1], [0.7, 0.2, 10, 2], [0.88, 0.11, 14, 3]] as number[][]) {
    const p = at(u, v, -30), m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: cumulusTex(k, pal), transparent: true, depthWrite: false, fog: false }));
    m.position.set(...p); m.layers.set(NOINK); root.add(m);
  }
  // ---- floating treasures: certificates with red wax seals, gold coins, a gold key; soft glints ----
  const certTex = ctex("ltCert", 512, 660, (g, r) => {
    g.fillStyle = "#f3e6c6"; g.fillRect(0, 0, 512, 660);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(150,110,60,${r() * 0.05})`; g.fillRect(r() * 512, r() * 660, 2 + r() * 6, 2 + r() * 6); }
    g.strokeStyle = "#b08a52"; g.lineWidth = 10; g.strokeRect(22, 22, 468, 616);
    g.fillStyle = "#4a3a2c"; g.font = "700 46px Georgia, serif"; g.textAlign = "center"; g.fillText("CERTIFICATE", 256, 110);
    g.fillStyle = "rgba(74,58,44,0.75)"; for (let k = 0; k < 7; k++) g.fillRect(70, 170 + k * 46, k === 6 ? 220 : 372, 10);
    const gr = g.createRadialGradient(380, 540, 6, 392, 552, 62); gr.addColorStop(0, "#e2584a"); gr.addColorStop(1, "#8e1e1a"); g.fillStyle = gr; g.beginPath(); g.arc(392, 552, 58, 0, 6.3); g.fill();
    g.strokeStyle = "rgba(255,200,180,0.45)"; g.lineWidth = 5; g.beginPath(); g.arc(392, 552, 36, 0, 6.3); g.stroke();
  });
  const certM = lam("ltCertM", () => ({ map: certTex }));
  const cert = (p: V3, rz: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.2, 0.05), certM); m.position.set(...p); m.rotation.set(0.12, -0.25 * Math.sign(p[0]), rz); root.add(m); };
  cert(at(0.09, 0.36, 10), 0.3); cert(at(0.91, 0.39, 10), -0.24);
  const gold = new THREE.MeshStandardMaterial({ color: "#f0b437", metalness: 0.85, roughness: 0.28, emissive: "#3a2400" });
  const coins: THREE.Object3D[] = [];
  for (const [u, v] of [[0.16, 0.6], [0.78, 0.31], [0.85, 0.54]]) {
    const g = new THREE.Group(); g.position.set(...at(u, v, 12)); root.add(g);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.09, 36).rotateX(Math.PI / 2), gold));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 36), gold); rim.position.z = 0.05; g.add(rim); coins.push(g);
  }
  const key = new THREE.Group(); key.position.set(...at(0.9, 0.69, 12)); key.rotation.z = 0.42; key.scale.setScalar(0.5); root.add(key);
  key.add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 12, 32), gold)); key.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 16).rotateZ(Math.PI / 2).translate(1.95, 0, 0), gold));
  for (const x of [2.7, 3.15]) key.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.24).translate(x, -0.4, 0), gold));
  // crisp four-point glints (no soft blobs): a sharp white star with a warm core
  const starTex = ctex("ltStar", 128, 128, (g) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 9 : 62; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath();
    const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62); gr.addColorStop(0, "#fffbe8"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(1, "rgba(255,255,255,0.85)"); g.fillStyle = gr; g.fill(); });
  for (const [u, v, z, sz] of [[0.27, 0.27, 10, 0.7], [0.5, 0.2, 10, 0.55], [0.73, 0.26, 10, 0.8], [0.06, 0.6, 10, 0.55], [0.94, 0.62, 10, 0.6]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, fog: false })); sp.position.set(...at(u, v, z)); sp.scale.setScalar(sz); sp.layers.set(NOINK); root.add(sp);
  }
  // ---- profile-picture stage at x = 200: the orange sunburst wall + navy disc (the original avatar), lit for real ----
  const burst = ctex("ltBurst", 1024, 1024, (g) => {
    const gr = g.createRadialGradient(512, 560, 40, 512, 560, 720); gr.addColorStop(0, "#fbc964"); gr.addColorStop(1, "#e88a30"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 16; k++) { const a0 = (k / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16; g.fillStyle = "rgba(255,238,196,0.2)"; g.beginPath(); g.moveTo(512, 560); g.arc(512, 560, 900, a0, a1); g.closePath(); g.fill(); }
  });
  const wallPP = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: burst, fog: false })); wallPP.position.set(200, 2.0, -3); wallPP.layers.set(NOINK); root.add(wallPP);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.12, 72).rotateX(Math.PI / 2), lam("ltNavy", () => ({ color: "#5872c4" }))); disc.position.set(200, 1.5, -1.6); root.add(disc);
  const discRim = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.05, 12, 72), lam("ltNavyRim", () => ({ color: "#3e54a0" }))); discRim.position.set(200, 1.5, -1.53); root.add(discRim);
  const marks: Record<string, V3> = { lou: [LOU[0], LOU[1], 18], rat: [RT[0], RT[1] + 0.72, 13.95], louPP: [200, -0.25, 0.4] };
  const cams = { banner: { pos: [0, CAM_Y, CAM_Z] as V3, look: [0, CAM_Y, 0] as V3, fov: 30 }, pp: { pos: [200, 1.98, 3.2] as V3, look: [200, 1.86, 0] as V3, fov: 39 } };
  return { name: "loutown", root, marks, cams, pose: (t) => { coins.forEach((c, i) => (c.rotation.y = 0.35 * Math.sin(i * 1.7 + t))); } };
};
