// Ship helpers for the sea / voyage / calcutta sets: braced yards (so square sails show their face from the side),
// bob / pitch rig, hull wake, scupper spouts, a barrel-top soup bowl, buoy.
import * as THREE from "three";
import { V, lam } from "../build";
import { ctex } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import type { Ship } from "../setkit";
import { foamPatch, TAU } from "./portkit_common";
import type { V3 } from "./types";

/** turn every yard + sail of a brig about the mast by `a` (rad) so the sails show their face to a side camera */
export const braceYards = (ship: Ship, a: number) => {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  ship.g.children.forEach((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    const geo = m.geometry as THREE.BufferGeometry & { parameters?: Record<string, number> }; const ty = geo.type;
    const isSail = ty === "PlaneGeometry" && m !== ship.flag && (m.material as THREE.Material).side === THREE.DoubleSide;
    const isYard = ty === "CylinderGeometry" && Math.abs(m.rotation.x - Math.PI / 2) < 1e-3 && (geo.parameters?.radiusTop ?? 1) < 0.07;
    if (!isSail && !isYard) return;
    const mx = Math.abs(m.position.x - 2.4) < 0.4 ? 2.4 : Math.abs(m.position.x + 1.6) < 0.4 ? -1.6 : null; if (mx === null) return;
    const p = m.position.clone().sub(V(mx, 0, m.position.z)); p.applyQuaternion(q); m.position.set(mx + p.x, m.position.y, m.position.z + p.z);
    m.quaternion.premultiply(q);
  });
};
/** remove a mesh's ExtrudeGeometry lids (front/back caps) so it becomes an open shell (for the cutaway hull) */
export const stripLids = (m: THREE.Mesh) => {
  const g = m.geometry as THREE.BufferGeometry; const side = g.groups.find((x) => x.materialIndex === 1); if (!side) return;
  const out = new THREE.BufferGeometry();
  for (const k of ["position", "normal", "uv"]) { const a = g.getAttribute(k) as THREE.BufferAttribute; out.setAttribute(k, new THREE.BufferAttribute((a.array as Float32Array).slice(side.start * a.itemSize, (side.start + side.count) * a.itemSize), a.itemSize)); }
  m.geometry = out;
};

/** hull wake: bow waves on both sides, foam along the hull, a widening V behind the stern; returns scroll fn */
export const wake = (parent: THREE.Object3D, L: number, W: number, y: number, sides = [-1, 1]) => {
  const ps = [
    foamPatch(parent, 3.6, 0.9, [L / 2 - 0.6, y, W / 2 + 0.55], -0.25, 0.9), foamPatch(parent, 3.6, 0.9, [L / 2 - 0.6, y, -W / 2 - 0.55], 0.25, 0.9),
    foamPatch(parent, L, 0.55, [-0.2, y, W / 2 + 0.35], 0, 0.75), foamPatch(parent, L, 0.55, [-0.2, y, -W / 2 - 0.35], 0, 0.75),
    foamPatch(parent, 16, 1.4, [-L / 2 - 7, y, W / 2 + 1.6], 0.14, 0.6), foamPatch(parent, 16, 1.4, [-L / 2 - 7, y, -W / 2 - 1.6], -0.14, 0.6),
    foamPatch(parent, 12, 2.2, [-L / 2 - 5.5, y, 0], 0, 0.5),
  ];
  // cartoon foam blobs (inked) along the waterline, a bow wave and a trail behind the stern
  const fm = lam("foamBlob", () => ({ color: "#f6fdff", emissive: "#bfeaff", emissiveIntensity: 0.3 }));
  const blobs: { m: THREE.Mesh; ph: number; s: number }[] = [];
  const add = (x: number, z: number, s: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), fm); m.position.set(x, y - 0.06, z); m.scale.set(s * 1.6, s * 0.35, s); parent.add(m); blobs.push({ m, ph: x * 1.7 + z, s }); };
  for (const sd of sides) {
    for (let x = -L / 2 + 0.2; x < L / 2 + 0.6; x += 0.75) add(x, sd * (W / 2 + 0.32), 0.22 + 0.1 * Math.max(0, x / L));
    for (let k = 0; k < 4; k++) add(L / 2 + 0.3 - k * 0.5, sd * (W / 2 + 0.45 + k * 0.18), 0.32 - k * 0.04);
    for (let k = 0; k < 9; k++) add(-L / 2 - 0.6 - k * 1.3, sd * (W / 2 + 0.2 + k * 0.32), 0.3 - k * 0.02);
  }
  if (sides.length > 1) for (let k = 0; k < 6; k++) add(-L / 2 - 0.8 - k * 1.5, (k % 2 ? 0.35 : -0.35), 0.34);
  ps.forEach((p) => { if (sides.length < 2 && p.position.z > 0) p.visible = false; });
  return (t: number) => {
    ps.forEach((p, i) => { (p.material as THREE.MeshBasicMaterial).map!.offset.set(t * (i < 2 ? 0.5 : 0.28), Math.sin(t * 0.7 + i) * 0.03); });
    blobs.forEach((b) => { const k = 1 + 0.25 * Math.sin(t * 3 + b.ph); b.m.scale.set(b.s * 1.6 * k, b.s * 0.35, b.s * k); });
  };
};

const soupTex = () => ctex("soupTop", 256, 256, (g, r) => {
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "#f2a248"); gr.addColorStop(1, "#d9772e"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { g.fillStyle = ["#f26a2a", "#7cc24a", "#f4e1a0", "#c8452e"][i % 4]; g.beginPath(); g.arc(30 + r() * 196, 30 + r() * 196, 6 + r() * 7, 0, TAU); g.fill(); g.strokeStyle = "rgba(90,40,20,0.6)"; g.lineWidth = 2; g.stroke(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,240,200,0.5)"; g.beginPath(); g.arc(r() * 256, r() * 256, 2 + r() * 4, 0, TAU); g.fill(); }
});
const bowlTex = () => ctex("bowlTex", 512, 128, (g) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 512, 128); g.fillStyle = "#2f63b0"; g.fillRect(0, 10, 512, 12); g.fillRect(0, 100, 512, 6);
  for (let x = 16; x < 512; x += 48) { g.fillStyle = "#2f63b0"; g.beginPath(); g.arc(x, 60, 10, 0, TAU); g.fill(); g.fillStyle = "#f6f1e6"; g.beginPath(); g.arc(x, 60, 5, 0, TAU); g.fill(); }
});
/** a steaming bowl of soup with a spoon (grows from scale 0) */
export const soupBowl = (parent: THREE.Object3D, pos: V3, s = 1) => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const pts = [[0, 0], [0.12, 0], [0.14, 0.02], [0.24, 0.1], [0.29, 0.2], [0.3, 0.22], [0.28, 0.22], [0.26, 0.18]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), twoTone(new THREE.MeshPhongMaterial({ map: bowlTex(), specular: "#ffffff", shininess: 60, side: THREE.DoubleSide }), 0.6)); bowl.castShadow = true; g.add(bowl);
  const soup = new THREE.Mesh(new THREE.CircleGeometry(0.265 * s, 28).rotateX(-Math.PI / 2), twoTone(new THREE.MeshPhongMaterial({ map: soupTex(), specular: "#fff0d0", shininess: 80, emissive: "#5a2a00", emissiveIntensity: 0.25 }), 0.6)); soup.position.y = 0.18 * s; g.add(soup);
  const sp = new THREE.Group(); sp.position.set(0.12 * s, 0.2 * s, 0.05 * s); sp.rotation.set(0.2, 0.4, -0.9); g.add(sp);
  const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#c9cfd8", specular: "#ffffff", shininess: 90 }), 0.6);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.016 * s, 0.32 * s, 6).translate(0, 0.16 * s, 0), steel); sp.add(h);
  const bw = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 10, 8), steel); bw.scale.set(1, 0.4, 1.4); sp.add(bw);
  return g;
};

const buoyTex = () => ctex("buoyStripes", 256, 256, (g) => { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#d8342c"; g.fillRect(0, i * 256 / 6, 256, 256 / 6 + 1); } g.fillStyle = "rgba(60,30,30,0.25)"; for (let i = 0; i < 6; i++) g.fillRect(0, i * 256 / 6, 256, 3); });
/** red-and-white striped buoy with a cage top; returns the group (bob it in pose) */
export const buoy = (parent: THREE.Object3D, pos: V3, s = 1) => {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const pts = [[0, -0.6], [0.5, -0.55], [0.72, -0.2], [0.75, 0.15], [0.55, 0.55], [0.3, 0.8], [0, 0.82]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), lam("buoyBody", () => ({ map: buoyTex() }))); body.castShadow = true; g.add(body);
  const iron = lam("buoyIron", () => ({ color: "#4b5468" }));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), iron); leg.position.set(Math.cos(a) * 0.18, 1.25, Math.sin(a) * 0.18); leg.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); g.add(leg); }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lam("buoyCap", () => ({ color: "#d8342c" }))); cap.position.y = 1.78; g.add(cap);
  const lampG = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff6a4a").multiplyScalar(1.8) })); lampG.position.y = 1.98; lampG.layers.set(NOINK); g.add(lampG);
  return g;
};
