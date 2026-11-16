// "He Covered His Oranges in Ice": the root cellar under Earl's farmhouse (the everyday comparison, scene 8).
// A low stone room (x -2.6..2.6, z -2.1..2.1, ceiling 2.4 m on two heavy beams), packed-earth floor with flagstones,
// shelves of orange marmalade jars on the back wall (z -2.1), a galvanized washtub of water in the middle (0, 0, 0.1),
// an oil lamp hanging from the beam, steps up to the hatch on the right (x 1.4..2.4, rising toward -z), sacks, a crate
// of potatoes, a barrel. Controls: c.tubIce 0..1 (an ice skin grows from the rim inward, crackle lines), c.wallFrost
// 0..1 (rime creeps down the left wall and the left half of the back wall, stopping short of the shelf), c.lamp (oil
// lamp, default 1), c.hatch 0..1 (the hatch at the top of the steps opens: cold moonlight spills in), c.jarOut 0/1 (one
// jar taken off the shelf).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, rep, beamHD, planksHD, stoneHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, crate, barrel, sack, mist } from "../setkit";
import { jar } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const TAU = Math.PI * 2;
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const frostWall = () => ctex("clFrost", 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512);
  // denser at the top (it creeps down from the cold hatch side)
  for (let i = 0; i < 160; i++) { const y = r() ** 1.6 * 512; blot(g, r() * 512, y, 20 + r() * 50, `rgba(236,246,255,${0.25 + 0.3 * (1 - y / 512)})`); }
  g.strokeStyle = "rgba(250,253,255,0.9)";
  for (let i = 0; i < 700; i++) { const x = r() * 512, y = r() ** 1.4 * 512, a = r() * TAU, L = 3 + r() * 10; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
});
const iceSkin = () => ctex("clIceSkin", 512, 512, (g, r) => {
  const gr = g.createRadialGradient(256, 256, 40, 256, 256, 256); gr.addColorStop(0, "rgba(214,238,250,0.55)"); gr.addColorStop(0.8, "rgba(236,248,255,0.85)"); gr.addColorStop(1, "rgba(250,253,255,0.95)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { let x = 256, y = 256, a = r() * TAU; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * (30 + r() * 30); y += Math.sin(a) * (30 + r() * 30); g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 1.5; g.beginPath(); g.arc(r() * 512, r() * 512, 4 + r() * 10, 0, TAU); g.stroke(); }
});
const labelTex = () => ctex("clJarLabel", 256, 128, (g) => { g.fillStyle = "#f6ead2"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#c8261e"; g.lineWidth = 8; g.strokeRect(8, 8, 240, 112); g.fillStyle = "#7a2a1a"; g.font = "italic 900 36px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Marmalade", 128, 64); });

export const CELLAR = { TUB: [0, 0, 0.1] as V3, WATER_Y: 0.27, SHELF_Z: -1.85, JAR: [-0.55, 1.12, -1.82] as V3 };

export const cellar = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const stone = lam("clStone", () => ({ map: rep(stoneHD("clStoneT", ["#a89c8a", "#9a8e7c", "#b4a896", "#8e8270"], "#6a5e50"), 1, 1) }));
  const flags = lam("clFlags", () => ({ map: rep(stoneHD("clFlagT", ["#8a7e6c", "#7e7262", "#968a78", "#746856"], "#4e4438"), 1, 1) }));
  const beam = lam("clBeam", () => ({ map: beamHD(), color: "#a08060" })), plank = lam("clPlank", () => ({ map: planksHD(), color: "#b89878" }));
  // floor, walls, ceiling
  b.add(quad(V(-2.6, 0, 2.1), V(2.6, 0, 2.1), V(2.6, 0, -2.1), V(-2.6, 0, -2.1), 3, 3), flags);
  b.add(boxGeo(V(-2.9, 0, -2.4), V(2.9, 2.4, -2.1), 1), stone);   // back
  b.add(boxGeo(V(-2.9, 0, -2.4), V(-2.6, 2.4, 2.4), 1), stone);   // left
  b.add(boxGeo(V(2.6, 0, -2.4), V(2.9, 2.4, 2.4), 1), stone);     // right
  b.add(boxGeo(V(-2.9, 0, 2.1), V(2.9, 2.4, 2.4), 1), stone);     // front (behind camera)
  b.add(boxGeo(V(-2.9, 2.4, -2.4), V(2.9, 2.5, 2.4), 1), plank);  // ceiling boards
  for (const x of [-1.2, 1.0]) b.add(boxGeo(V(x - 0.13, 2.18, -2.1), V(x + 0.13, 2.4, 2.1), 1), beam);
  // shelves on the back wall with marmalade jars (orange glass, gold lids, labels on the front row)
  const jarM = lam("clJarGlass", () => ({ color: "#f08a26", emissive: "#5a2a08", emissiveIntensity: 0.25 })), lidM = lam("clLid", () => ({ color: "#d8b24a" }));
  const lblM = new THREE.MeshBasicMaterial({ map: labelTex(), toneMapped: true });
  const jars: THREE.Group = new THREE.Group(); root.add(jars);
  const jb = new Batch();
  for (const y of [0.45, 1.0, 1.55]) {
    b.add(boxGeo(V(-1.8, y, -2.1), V(1.0, y + 0.05, -1.68)), plank);
    for (let i = 0; i < 9; i++) { const x = -1.65 + i * 0.3, h = 0.16 + ((i * 7 + y * 10) % 3) * 0.02; if (Math.abs(x - CELLAR.JAR[0]) < 0.1 && y === 1.0) continue; jar(jb, x, y + 0.05, -1.86, h, jarM, lidM); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.06), lblM); l.position.set(x, y + 0.05 + h * 0.45, -1.86 + 0.071); root.add(l); }
  }
  for (const x of [-1.8, -0.4, 1.0]) b.add(boxGeo(V(x - 0.03, 0, -2.1), V(x + 0.03, 1.65, -1.66)), beam);
  jb.build(jars);
  const takeJar = new THREE.Group(); takeJar.position.set(...CELLAR.JAR); root.add(takeJar);
  { const tb = new Batch(); jar(tb, 0, 0, 0, 0.18, jarM, lidM); tb.build(takeJar); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.06), lblM); l.position.set(0, 0.08, 0.071); takeJar.add(l); }
  // the washtub: galvanized, ribbed, two handles; water + the growing ice skin
  const galv = new THREE.MeshStandardMaterial({ color: "#a4aab2", roughness: 0.32, metalness: 0.78 });
  const tub = new THREE.Group(); tub.position.set(...CELLAR.TUB); root.add(tub);
  { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.36 + 0.08 * t + (i % 3 === 0 ? 0.008 : 0), t * 0.32)); }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), galv); body.material.side = THREE.DoubleSide; body.castShadow = true; body.receiveShadow = true; tub.add(body);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32).rotateX(-Math.PI / 2), galv); bottom.position.y = 0.01; tub.add(bottom);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.014, 6, 40).rotateX(Math.PI / 2), galv); rim.position.y = 0.32; tub.add(rim);
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 16, Math.PI), galv); h.position.set(s * 0.46, 0.28, 0); h.rotation.set(0, Math.PI / 2, s > 0 ? -Math.PI / 2 : Math.PI / 2); tub.add(h); } }
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.425, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#46707e", roughness: 0.05, metalness: 0.3 })); water.position.y = CELLAR.WATER_Y; tub.add(water);
  const skinT = iceSkin(); const skinM = new THREE.MeshStandardMaterial({ map: skinT, color: "#f2fbff", emissive: "#6a90b0", emissiveIntensity: 0.15, roughness: 0.12, metalness: 0.05, transparent: true, depthWrite: false });
  let skin = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.425, 40).rotateX(-Math.PI / 2), skinM); skin.position.y = CELLAR.WATER_Y + 0.004; tub.add(skin); let skinQ = -1;
  // a ladle hanging on a nail by the tub, stool, potatoes, sacks, barrel
  crate(b, root, [-1.7, 0, 1.2], 0.55, "POTATOES", 0.4, { seed: 11 });
  barrel(root, [-2.1, 0, -0.4], 0.36); sack(root, [1.9, 0, 1.5], 0.3); sack(root, [2.2, 0, 1.0], 0.28, "#b89a62");
  // steps up to the hatch (right side, rising toward -z) and the hatch frame in the ceiling
  for (let i = 0; i < 7; i++) b.add(boxGeo(V(1.45, i * 0.32, 1.2 - i * 0.42), V(2.5, i * 0.32 + 0.06, 1.62 - i * 0.42)), plank);
  for (const x of [1.42, 2.5]) b.add(boxGeo(V(x - 0.04, 0, -1.9), V(x + 0.04, 2.3, 1.7)).rotateX(0), beam);
  const hatch = new THREE.Group(); hatch.position.set(1.45, 2.42, -1.55); root.add(hatch);
  { const hm = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.0).translate(0.52, 0, 0), plank); hm.castShadow = true; hatch.add(hm); }
  const moonSpill = new THREE.SpotLight("#9ab4ff", 0, 6, 0.6, 0.6, 1.2); moonSpill.position.set(1.95, 3.2, -1.55); moonSpill.target.position.set(1.9, 0, -0.5); root.add(moonSpill, moonSpill.target);
  // frost on the left wall + left half of the back wall (stops at x -1.95, short of the shelf)
  const frostM = new THREE.MeshStandardMaterial({ map: frostWall(), color: "#f4fbff", transparent: true, opacity: 0, roughness: 0.3, depthWrite: false });
  const fL = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4).rotateY(Math.PI / 2), frostM); fL.position.set(-2.59, 1.2, 0); root.add(fL);
  const fB = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 2.4), frostM); fB.position.set(-2.22, 1.2, -2.09); root.add(fB);
  const breath = [0, 1, 2].map((i) => mist(root, [0.1 + i * 0.1, 0.45, 0.1], 0.5, "#e6f2ff", 0));
  // the oil lamp on the beam + a faint fill
  const oil = lamp(root, [0.55, 1.95, -0.2], "#ffb24e", 9, 7, "hang");
  const fill = new THREE.PointLight("#ffcf8a", 1.2, 9, 1.2); fill.position.set(-1.0, 1.8, 1.4); root.add(fill);
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { m.receiveShadow = true; if (!(m.material as THREE.Material).transparent) m.castShadow = true; } });
  const marks: Record<string, V3> = { june: [0.75, 0, 0.55], juneShelf: [-0.5, 0, -1.2], stairs: [1.95, 0, 1.0], stairsTop: [1.95, 1.92, -1.1] };
  const cams = {
    top: { pos: [0.02, 2.3, 0.14] as V3, look: [0, 0.27, 0.1] as V3, fov: 40 },
    room: { pos: [-0.6, 1.45, 1.95] as V3, look: [0.2, 0.9, -0.8] as V3, fov: 52 },
    shelf: { pos: [-0.3, 1.3, -0.6] as V3, look: [-0.55, 1.15, -1.85] as V3, fov: 36 },
  };
  return {
    name: "cellar", root, marks, cams, title: [tub],
    pose: (t, c) => {
      flicker(oil, t); oil.visible = (c.lamp ?? 1) > 0.5;
      const k = Math.round(sm(c.tubIce ?? 0) * 30) / 30;
      if (k !== skinQ) { skinQ = k; skin.geometry.dispose(); skin.geometry = new THREE.RingGeometry(Math.max(0.001, 0.425 * (1 - k)), 0.425, 40).rotateX(-Math.PI / 2); skin.visible = k > 0.01; }
      frostM.opacity = 0.85 * cl(c.wallFrost ?? 0);
      hatch.rotation.z = -1.9 * sm(c.hatch ?? 0); moonSpill.intensity = 20 * sm(c.hatch ?? 0);
      takeJar.visible = (c.jarOut ?? 0) < 0.5;
      breath.forEach((m, i) => { const u = (t * 0.35 + i / 3) % 1; (m.material as THREE.SpriteMaterial).opacity = 0.25 * cl(c.tubIce ?? 0) * Math.sin(Math.PI * u); m.position.set(-0.1 + i * 0.12, 0.35 + u * 0.4, 0.1); });
    },
  };
};
