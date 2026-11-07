// THE SALT MINE, Austria, May 1945 ("a top Nazi's stash"; light `mine`): a long tunnel cut through pink-grey rock salt
// running along -z (the camera looks down it), timber frames every 2.6 m, a string of caged electric bulbs along the
// roof (the visible light source) + lanterns, narrow-gauge rails with a tipped mine cart, wooden crates stencilled with
// numbers, paintings leaning in cloth wraps, and in front the OPEN CRATE where the soldiers find THE PAINTING.
// Tunnel: floor y = 0, x -2.6..2.6, z 3 .. -30, vault 3.6 high. The open crate sits at x 0.3, z -0.6.
// Controls (c): lid 0..1 crate lid prised open | lift 0..1 the painting rises out of the crate into a soldier's hands
// | flip 0..1 the painting turns round to show the SOLD BY slip pinned on its back | bulbs 0..1 (default 1)
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, rng } from "../paint";
import { glow, rod } from "../setkit";
import { beamStain, metal, motes, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { framedPainting } from "./masterpiece";
import { NOINK } from "../ink";
import type { SetDef, SetBuilder, V3 } from "./types";

const saltTex = () => ctex("mnSalt", 1024, 1024, (g, r) => {
  g.fillStyle = "#c9a8a0"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) { const y = r() * 1024; g.fillStyle = ["rgba(150,110,110,0.35)", "rgba(230,210,200,0.35)", "rgba(180,140,150,0.3)"][i % 3]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 20 * Math.sin(x * 0.01 + i) + (r() - 0.5) * 10); g.lineTo(1024, y + 40); g.lineTo(0, y + 40); g.fill(); }
  for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.6 ? "rgba(255,255,255,0.55)" : "rgba(120,90,90,0.4)"; const x = r() * 1024, y = r() * 1024, s = 2 + r() * 6; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.fill(); }
  g.strokeStyle = "rgba(90,60,60,0.45)"; g.lineWidth = 3; for (let i = 0; i < 30; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 120; y += r() * 60; g.lineTo(x, y); } g.stroke(); }
});
const crateTex = (n: string) => ctex("mnCrate" + n, 512, 512, (g, r) => {
  g.fillStyle = "#b08452"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) { g.fillStyle = r() < 0.5 ? "#a07648" : "#bc9060"; g.fillRect(0, y + 4, 512, 120); g.fillStyle = "rgba(60,40,20,0.5)"; g.fillRect(0, y, 512, 4); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(90,60,30,0.3)"; g.lineWidth = 2; g.beginPath(); const y = r() * 512; g.moveTo(0, y); g.lineTo(512, y + (r() - 0.5) * 20); g.stroke(); }
  g.fillStyle = "rgba(40,24,16,0.85)"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 120px DejaVu Sans Mono, monospace"; fitText(g, n, 256, 260, 380, 150);
  g.strokeStyle = "#5a3a1e"; g.lineWidth = 26; g.strokeRect(13, 13, 486, 486);
});
const slipTex = () => ctex("mnSlip2k", 2048, 1536, (g) => {
  g.scale(5.12, 5.12); // drawn in 400x300 units at 5x resolution: the camera pushes right in onto the photo
  g.fillStyle = "#f2ead4"; g.fillRect(0, 0, 400, 300); g.strokeStyle = "#5a3a22"; g.lineWidth = 6; g.strokeRect(6, 6, 388, 288);
  // whole words above and below a centred photo: the push into the photo trims whole lines off the top and bottom
  // edges, never part of a word (v10.10 rule 5)
  g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "SOLD BY:", 200, 38, 300, 44);
  // the seller's photo: a little sketch of the painter (beret, smirk, thin moustache), centred
  const ox = 200 - 300, oy = 140 - 125;
  g.fillStyle = "#d8cdb4"; g.fillRect(130, 70, 140, 150); g.fillStyle = "#fbf6ea"; g.beginPath(); g.ellipse(300 + ox, 125 + oy, 46, 52, 0, 0, TAU); g.fill(); g.strokeStyle = "#2a1a10"; g.lineWidth = 5; g.beginPath(); g.ellipse(300 + ox, 125 + oy, 46, 52, 0, 0, TAU); g.stroke();
  g.fillStyle = "#f05a28"; g.beginPath(); g.ellipse(296 + ox, 78 + oy, 50, 18, -0.15, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#2a1a10"; g.beginPath(); g.arc(316 + ox, 62 + oy, 6, 0, TAU); g.fill();
  for (const x of [284, 318]) { g.beginPath(); g.arc(x + ox, 122 + oy, 5, 0, TAU); g.fill(); } g.lineWidth = 4; g.beginPath(); g.moveTo(286 + ox, 150 + oy); g.quadraticCurveTo(303 + ox, 146 + oy, 318 + ox, 140 + oy); g.stroke(); g.beginPath(); g.moveTo(282 + ox, 141 + oy); g.lineTo(322 + ox, 138 + oy); g.stroke();
  g.fillStyle = "rgba(40,30,30,0.5)"; for (let i = 0; i < 4; i++) { g.fillRect(24, 90 + i * 30, 90, 7); g.fillRect(286, 90 + i * 30, 90, 7); }
  g.fillStyle = "#2a1a10"; fitText(g, "SOLD 1943", 200, 260, 300, 40);
});

export const mine: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch(), r = rng(45);
  const XW = 2.6, ZN = 9, ZF = -30, VH = 3.6;
  const salt = lam("mnSaltM", () => ({ map: rep(saltTex(), 4, 1.5) })), saltF = lam("mnSaltF", () => ({ map: rep(saltTex(), 2, 8), color: "#d8c0b8" }));
  const timber = lam("mnTimber", () => ({ map: beamStain("mnTimber", "#5a3a22", 0.5) })), iron = metal("mnIron", "#4a4c56", 40), rust = lam("mnRust", () => ({ color: "#7a4a32" }));
  // floor + walls + vault (a lathe-like half pipe along z, slightly irregular)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(XW * 2, ZN - ZF).rotateX(-Math.PI / 2), saltF); floor.position.set(0, 0, (ZN + ZF) / 2); floor.receiveShadow = true; root.add(floor);
  const segs = 22, rows = 60, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= rows; j++) { const z = ZN + (ZF - ZN) * (j / rows); for (let i = 0; i <= segs; i++) { const a = Math.PI * (i / segs), bump = 1 + 0.06 * Math.sin(i * 1.7 + j * 0.9) + 0.04 * Math.sin(i * 3.1 - j * 1.3); const x = -Math.cos(a) * XW * bump, y = Math.min(VH, 1.2 + Math.sin(a) * (VH - 1.2) * bump) * (a < 0.3 || a > Math.PI - 0.3 ? Math.sin(a) / Math.sin(0.3) : 1); pos.push(x, Math.max(0, y), z); uv.push(i / segs, j / 6); } }
  for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) { const a = j * (segs + 1) + i, c = a + segs + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); vg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); vg.setIndex(idx); vg.computeVertexNormals();
  const vault = new THREE.Mesh(vg, salt); vault.receiveShadow = true; root.add(vault);
  // end wall far away (dark)
  b.add(boxGeo(V(-XW, 0, ZF - 0.2), V(XW, VH, ZF)), salt);
  // timber frames
  for (let z = ZN - 1; z > ZF; z -= 2.6) { for (const s of [-1, 1]) b.add(boxGeo(V(s * (XW - 0.25) - 0.11, 0, z - 0.11), V(s * (XW - 0.25) + 0.11, 2.85, z + 0.11)), timber); b.add(boxGeo(V(-XW + 0.1, 2.75, z - 0.12), V(XW - 0.1, 2.97, z + 0.12)), timber); }
  // rails + sleepers
  for (const x of [-0.95, -0.45]) b.add(boxGeo(V(x - 0.025, 0.06, ZF), V(x + 0.025, 0.11, ZN)), iron);
  for (let z = ZN; z > ZF; z -= 0.6) b.add(boxGeo(V(-1.2, 0, z - 0.08), V(-0.2, 0.06, z + 0.08)), timber);
  // a mine cart (tipped a little) further down the rails
  { const cart = new THREE.Group(); cart.position.set(-0.7, 0.12, -7.5); cart.rotation.y = 0.05; root.add(cart);
    cart.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 1.1).translate(0, 0.45, 0), rust)); for (const [x, zz] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.35], [0.3, 0.35]]) cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12).rotateZ(Math.PI / 2).translate(x * 1.25, 0.12, zz), iron)); }
  // crates (stencilled numbers) + cloth-wrapped paintings along both walls, deeper and deeper
  const numbers = ["A-14", "B-07", "K-33", "M-21", "R-02", "S-19", "T-88", "V-41"];
  for (let k = 0; k < 18; k++) {
    const s = k % 2 ? 1 : -1, z = -1.5 - k * 1.5 - r() * 0.6, w = 0.6 + r() * 0.5, h = 0.5 + r() * 0.5, d = 0.6 + r() * 0.3;
    const x = s * (XW - 0.55 - r() * 0.3);
    const m = lam("mnCr" + (k % 8), () => ({ map: crateTex(numbers[k % 8]) }));
    b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2)), m);
    if (r() < 0.5) b.add(boxGeo(V(x - w / 2 + 0.05, h, z - d / 2 + 0.05), V(x + w / 2 - 0.05, h + 0.4, z + d / 2 - 0.05)), lam("mnCr" + ((k + 3) % 8), () => ({ map: crateTex(numbers[(k + 3) % 8]) })));
  }
  const cloth = lam("mnCloth", () => ({ color: "#d8ccb4" }));
  for (let k = 0; k < 10; k++) { const s = k % 2 ? -1 : 1, z = -3 - k * 2.3; const g = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9 + (k % 3) * 0.2, 0.7 + (k % 2) * 0.2), cloth); g.position.set(s * (XW - 0.3), 0.5, z); g.rotation.z = s * 0.18; g.castShadow = true; root.add(g); }
  // a few unwrapped frames (backs of paintings) leaning on the left near the camera
  for (let k = 0; k < 3; k++) { const fp = framedPainting(root, [-1.95 + k * 0.12, 0.62, 0.8 - k * 0.5], Math.PI / 2 - 0.3, 0.7, 0.9, 0.08, [0, 2, 5][k]); fp.g.rotation.z = 0.15; }
  // electric bulbs on a cable along the roof (caged) + lanterns on crates
  const bulbs: { m: THREE.Mesh; l?: THREE.PointLight }[] = [];
  const cableY = 3.2;
  const cpts: THREE.Vector3[] = []; for (let z = ZN; z >= ZF; z -= 1) cpts.push(V(0.6 + 0.05 * Math.sin(z), cableY - 0.12 * Math.abs(Math.sin(z * 0.6)), z));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpts), 80, 0.012, 5), lam("mnCable", () => ({ color: "#2a2420" }))));
  for (let k = 0; k < 9; k++) { const z = ZN - 2.2 - k * 3.4; const bm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe0a0").multiplyScalar(2.0) })); bm.position.set(0.6, cableY - 0.3, z); bm.layers.set(NOINK); root.add(bm);
    const cage = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: "#2a2420", wireframe: true })); cage.position.copy(bm.position); root.add(cage);
    rod(root, [0.6, cableY - 0.05, z], [0.6, cableY - 0.22, z], 0.008, lam("mnCable", () => ({ color: "#2a2420" })));
    glow(root, [0.6, cableY - 0.3, z], "#ffd890", 1.0, 0.75);
    const l = k < 5 ? new THREE.PointLight("#ffcf88", 5, 7, 1.3) : undefined; if (l) { l.position.set(0.6, cableY - 0.4, z); root.add(l); } bulbs.push({ m: bm, l }); }
  // ================= the OPEN CRATE in front (x 0.3, z -0.6) + its lid =================
  const CX = 0.35, CZ = -0.7, CW2 = 1.2, CH2 = 0.62, CD = 0.5;
  const crM = lam("mnCrMain", () => ({ map: crateTex("K-33") }));
  b.add(boxGeo(V(CX - CW2 / 2, 0, CZ - CD / 2), V(CX + CW2 / 2, 0.06, CZ + CD / 2)), crM);
  b.add(boxGeo(V(CX - CW2 / 2, 0, CZ + CD / 2 - 0.04), V(CX + CW2 / 2, CH2, CZ + CD / 2)), crM);
  b.add(boxGeo(V(CX - CW2 / 2, 0, CZ - CD / 2), V(CX + CW2 / 2, CH2, CZ - CD / 2 + 0.04)), crM);
  b.add(boxGeo(V(CX - CW2 / 2, 0, CZ - CD / 2), V(CX - CW2 / 2 + 0.04, CH2, CZ + CD / 2)), crM); b.add(boxGeo(V(CX + CW2 / 2 - 0.04, 0, CZ - CD / 2), V(CX + CW2 / 2, CH2, CZ + CD / 2)), crM);
  // straw packing
  const straw = lam("mnStraw", () => ({ color: "#e6c46a" }));
  b.add(boxGeo(V(CX - CW2 / 2 + 0.05, CH2 - 0.12, CZ - CD / 2 + 0.05), V(CX + CW2 / 2 - 0.05, CH2 - 0.04, CZ + CD / 2 - 0.05)), straw);
  const lid = new THREE.Group(); lid.position.set(CX, CH2, CZ - CD / 2); root.add(lid);
  lid.add(new THREE.Mesh(new THREE.BoxGeometry(CW2 + 0.04, 0.04, CD + 0.04).translate(0, 0.02, CD / 2), crM));
  // THE PAINTING inside: rises up (lift), turns round (flip) to show the slip on its back
  const PAINT = framedPainting(root, [CX, 0.55, CZ], 0, 0.86, 1.06, 0.11);
  const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshBasicMaterial({ map: slipTex() })); slip.position.set(0, 0.05, -0.04); slip.rotation.y = Math.PI; PAINT.g.add(slip);
  const dust = motes(root, [-2, 0.3, -8], [2, 3.0, 1.5], 50, "#ffe8c8", 0.022, 0.7, 6);
  b.build(root);

  const marks: Record<string, V3> = {
    soldier1: [CX - 0.95, 0, CZ + 0.55], soldier2: [CX + 1.05, 0, CZ + 0.35], officer: [CX + 0.2, 0, CZ + 1.35], crate: [CX, CH2, CZ],
    painting: [CX, 1.55, CZ + 0.05], slip: [CX, 1.6, CZ],
  };
  const cams = {
    tunnel: { pos: [0.2, 1.7, 3.0] as V3, look: [0.1, 1.2, -8] as V3, fov: 46 },
    crate: { pos: [0.5, 1.7, 2.0] as V3, look: [CX, 1.2, CZ] as V3, fov: 40 },
    slip: { pos: [CX, 1.6, CZ + 1.1] as V3, look: [CX, 1.6, CZ] as V3, fov: 40 },
  };
  const cl = (x: number) => Math.max(0, Math.min(1, x)), ss = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
  return {
    name: "mine", root, marks, cams,
    pose: (t, c) => {
      dust.update(t);
      const bk = c.bulbs ?? 1;
      bulbs.forEach((bb, i) => { const f = bk * (0.92 + 0.08 * Math.sin(t * (17 + i) + i * 3) * Math.sin(t * 3.1 + i)); (bb.m.material as THREE.MeshBasicMaterial).color.setRGB(2.0 * f, 1.75 * f, 1.25 * f); if (bb.l) bb.l.intensity = 5 * f; });
      lid.rotation.x = -1.9 * ss(c.lid ?? 0);
      const lf = ss(c.lift ?? 0), fl = ss(c.flip ?? 0);
      PAINT.g.position.set(CX, 0.55 + 1.0 * lf, CZ + 0.05 + 0.15 * lf); PAINT.g.rotation.set(-0.05 * (1 - lf), Math.PI * fl, 0);
      PAINT.set({ paint: 1, age: 1, crack: 1, ink: 1 });
    },
  };
};
