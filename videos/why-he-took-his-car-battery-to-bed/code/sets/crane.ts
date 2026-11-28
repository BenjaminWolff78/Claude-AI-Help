// 1960s truck crane ("BIG HORN 40", invented): a red-and-cream carrier truck with three axles and four outriggers on
// timber pads, a slewing house with a cab, counterweight and A-frame gantry, a long square lattice boom with pendant
// lines, a hoist cable and a hook block. Loads hang from `hook` (its origin is the hook's eye; loads go below it).
// Reusable: import { crane } from "./crane".
//
// Local frame: ground y = 0, origin on the slew axis (centre of the turntable) on the ground; the carrier's cab points
// to local +z. The house slews about local y (swing = yaw of the boom, 0 = boom toward local +z).
// API: const cr = crane(parent, { boomLen: 40 });
//      cr.g        group: place + yaw the whole machine
//      cr.set({ swing, el, cable, t, sway })
//        swing  radians, boom heading about the slew axis (0 = +z)
//        el     boom elevation (radians above horizontal)
//        cable  hoist line length in metres from the boom tip to the hook eye
//        sway   0..1 small pendulum swing of the hook (t drives it)
//      cr.hook     THREE.Group at the hook eye (child loads hang under it, they keep upright)
//      cr.tip(swing, el) -> local boom-tip point; cr.FOOT = [forward offset, height] of the boom foot pin; cr.L boom length
//      cr.SOLIDS (local, carrier + house, not the boom)
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V } from "../build";
import { ctex } from "../paint";
import { col, shiny, tex, rodGeo, TAU, SANS, mat } from "./desertkit";
import { fitText } from "./portkit_common";
import { twoTone } from "../shade";
import type { V3 } from "./types";

const paintTex = (c: string) => ctex("crPaint" + c, 512, 256, (g, r) => {
  g.fillStyle = c; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(60,30,40,0.14)"; g.beginPath(); g.ellipse(r() * 512, r() * 256, 10 + r() * 40, 5 + r() * 20, r(), 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(90,80,90,0.45)"; g.fillRect(r() * 512, r() * 256, 2 + r() * 6, 1 + r() * 2); }
  const gr = g.createLinearGradient(0, 170, 0, 256); gr.addColorStop(0, "rgba(206,140,100,0)"); gr.addColorStop(1, "rgba(206,140,100,0.45)"); g.fillStyle = gr; g.fillRect(0, 170, 512, 86);
});
const houseDecal = () => ctex("crDecal", 512, 160, (g) => {
  g.clearRect(0, 0, 512, 160); g.fillStyle = "#f4efe4"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "BIG HORN", 256, 62, 460, 84, SANS);
  g.font = "900 34px Arial"; g.fillText("40-TON CRANE", 256, 128);
});
const hazardTex = () => ctex("crHazard", 256, 64, (g) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#2e2a34"; for (let x = -64; x < 256; x += 40) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 20, 64); g.lineTo(x + 84, 0); g.lineTo(x + 64, 0); g.fill(); } });

export type Crane = {
  g: THREE.Group; hook: THREE.Group; L: number; FOOT: [number, number]; SOLIDS: [V3, V3][];
  tip: (swing: number, el: number) => THREE.Vector3;
  set: (o: { swing?: number; el?: number; cable?: number; t?: number; sway?: number }) => void;
};

export const crane = (parent: THREE.Object3D, o: { boomLen?: number } = {}): Crane => {
  const L = o.boomLen ?? 40, FOOT: [number, number] = [1.3, 3.4];
  const g = new THREE.Group(); parent.add(g);
  const red = mat("crRed", () => twoTone(new THREE.MeshPhongMaterial({ map: paintTex("#c8352e"), specular: "#ffd8d0", shininess: 30 })));
  const cream = mat("crCream", () => twoTone(new THREE.MeshPhongMaterial({ map: paintTex("#efe4c8"), specular: "#ffffff", shininess: 30 })));
  const dark = col("#3a3640"), steel = col("#5a5664"), glassM = shiny("crGlass", "#7fa6cc", 110);
  const b = new Batch();
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 2, r).translate(x, y, z), m);
  // ---- carrier ----
  rbox(2.5, 0.55, 10.5, 0.08, 0, 1.25, -0.3, red);
  b.add(new THREE.PlaneGeometry(10.4, 0.3).rotateY(Math.PI / 2).translate(1.26, 1.2, -0.3), tex("hazard", hazardTex));
  b.add(new THREE.PlaneGeometry(10.4, 0.3).rotateY(-Math.PI / 2).translate(-1.26, 1.2, -0.3), tex("hazard", hazardTex));
  // cab (front, +z): cream with a red stripe, windscreen
  rbox(2.5, 1.7, 2.0, 0.18, 0, 2.15, 4.3, cream);
  rbox(2.52, 0.25, 2.02, 0.05, 0, 1.7, 4.3, red);
  b.add(new THREE.BoxGeometry(2.2, 0.75, 0.05).translate(0, 2.55, 5.31), glassM);
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.05, 0.6, 1.2).translate(s * 1.26, 2.55, 4.4), glassM);
  rbox(2.3, 0.6, 0.2, 0.05, 0, 1.25, 5.35, steel);
  // wheels (3 axles) + outriggers with timber pads
  const tyre = col("#2e2a36");
  for (const z of [4.0, -2.2, -3.6]) for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 18).rotateZ(Math.PI / 2).translate(s * 1.05, 0.55, z), tyre); b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.47, 12).rotateZ(Math.PI / 2).translate(s * 1.05, 0.55, z), steel); }
  for (const z of [2.6, -4.6]) for (const s of [-1, 1]) {
    b.add(boxGeo(V(Math.min(s * 1.2, s * 3.4), 0.95, z - 0.2), V(Math.max(s * 1.2, s * 3.4), 1.25, z + 0.2)), red);
    b.add(new THREE.BoxGeometry(0.3, 0.95, 0.3).translate(s * 3.3, 0.5, z), steel);
    for (let k = 0; k < 3; k++) b.add(new THREE.BoxGeometry(1.2, 0.18, 0.36).translate(s * 3.3, 0.09 + 0, z - 0.4 + k * 0.4), tex("crTimber", () => ctex("crTimberT", 256, 64, (gg, r) => { gg.fillStyle = "#a8724a"; gg.fillRect(0, 0, 256, 64); for (let i = 0; i < 20; i++) { gg.strokeStyle = "rgba(90,50,30,0.4)"; gg.lineWidth = 2; gg.beginPath(); const y = r() * 64; gg.moveTo(0, y); gg.bezierCurveTo(80, y + 4, 170, y - 4, 256, y); gg.stroke(); } })));
  }
  b.add(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 24).translate(0, 1.65, 0), steel); // turntable ring
  b.build(g);
  g.traverse((m) => { (m as THREE.Mesh).castShadow = true; m.receiveShadow = true; });
  // ---- slewing house ----
  const house = new THREE.Group(); house.position.y = 1.8; g.add(house);
  const hb = new Batch();
  hb.add(new RoundedBoxGeometry(2.8, 1.9, 4.4, 2, 0.12).translate(0, 0.95, -0.9), red);
  hb.add(new THREE.PlaneGeometry(3.6, 1.1).rotateY(Math.PI / 2).translate(1.41, 1.1, -1.2), mat("crDecalM", () => twoTone(new THREE.MeshLambertMaterial({ map: houseDecal(), transparent: true, alphaTest: 0.3 }))));
  hb.add(new THREE.PlaneGeometry(3.6, 1.1).rotateY(-Math.PI / 2).translate(-1.41, 1.1, -1.2), mat("crDecalM2", () => twoTone(new THREE.MeshLambertMaterial({ map: houseDecal(), transparent: true, alphaTest: 0.3 }))));
  hb.add(new RoundedBoxGeometry(1.2, 1.9, 1.5, 2, 0.1).translate(0.85, 1.1, 1.5), cream);   // operator cab, front right
  hb.add(new THREE.BoxGeometry(1.0, 1.0, 0.05).translate(0.85, 1.45, 2.26), glassM);
  hb.add(new THREE.BoxGeometry(0.05, 0.9, 1.1).translate(1.46, 1.45, 1.5), glassM);
  hb.add(new RoundedBoxGeometry(2.9, 1.3, 1.1, 2, 0.1).translate(0, 0.75, -3.5), dark);  // counterweight
  hb.add(new THREE.PlaneGeometry(2.6, 0.3).rotateY(Math.PI).translate(0, 0.75, -4.06), tex("hazard", hazardTex));
  // A-frame gantry
  for (const s of [-1, 1]) { hb.add(rodGeo([s * 1.2, 1.9, 0.6], [s * 0.8, 4.6, -1.6], 0.08), steel); hb.add(rodGeo([s * 1.2, 1.9, -3.0], [s * 0.8, 4.6, -1.6], 0.08), steel); }
  hb.add(rodGeo([-0.8, 4.6, -1.6], [0.8, 4.6, -1.6], 0.09), steel);
  hb.add(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8).translate(0.3, 2.05, -1.8), dark); // exhaust
  // boom foot lugs
  for (const s of [-1, 1]) hb.add(boxGeo(V(s * 0.75 - 0.1, 1.0, FOOT[0] - 0.4), V(s * 0.75 + 0.1, FOOT[1] - 1.8 + 0.35, FOOT[0] + 0.4)), red);
  hb.build(house); house.traverse((m) => { (m as THREE.Mesh).castShadow = true; });
  // ---- lattice boom (built along local +z of the boom group, pivot at the foot) ----
  const boom = new THREE.Group(); boom.position.set(0, FOOT[1] - 1.8, FOOT[0]); house.add(boom);
  { const bb = new Batch(), cm = red, lm = cream;
    const sec = (z: number) => { const taper = z < 4 ? 0.3 + (z / 4) * 0.4 : z > L - 3 ? 0.7 - ((z - (L - 3)) / 3) * 0.35 : 0.7; return taper; };
    const N = Math.round(L / 1.6);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (let i = 0; i < N; i++) { const z0 = (i * L) / N, z1 = ((i + 1) * L) / N; bb.add(rodGeo([sx * sec(z0), sy * sec(z0), z0], [sx * sec(z1), sy * sec(z1), z1], 0.055, 5), cm); }
    for (let i = 0; i <= N; i++) { const z = (i * L) / N, w = sec(z); for (const [a, c] of [[[-w, -w], [w, -w]], [[w, -w], [w, w]], [[w, w], [-w, w]], [[-w, w], [-w, -w]]] as [number, number][][]) bb.add(rodGeo([a[0], a[1], z], [c[0], c[1], z], 0.025, 4), lm); }
    for (let i = 0; i < N; i++) { const z0 = (i * L) / N, z1 = ((i + 1) * L) / N, w0 = sec(z0), w1 = sec(z1), f = i % 2 ? 1 : -1;
      bb.add(rodGeo([-w0, f * w0, z0], [w1, f * w1, z1], 0.022, 4), lm); bb.add(rodGeo([f * w0, -w0, z0], [f * w1, w1, z1], 0.022, 4), lm); bb.add(rodGeo([f * w0, w0, z0], [-f * w1, w1, z1], 0.022, 4), lm); }
    bb.add(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 16).rotateZ(Math.PI / 2).translate(0, 0, L + 0.1), steel); // tip sheave
    bb.add(new THREE.BoxGeometry(0.8, 0.6, 0.9).translate(0, 0.1, L - 0.2), red);
    bb.add(new THREE.PlaneGeometry(0.7, 0.5).rotateY(Math.PI / 2).translate(0.41, 0.1, L - 0.2), tex("hazard", hazardTex));
    bb.build(boom); boom.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); }
  // pendant lines (gantry top -> boom tip) + hoist cable + hook block
  const lineM = col("#3a3444");
  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 4), lineM); pendant.castShadow = true; house.add(pendant);
  const pendant2 = pendant.clone(); house.add(pendant2);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 5), lineM); cable.castShadow = true; g.add(cable);
  const cable2 = cable.clone(); g.add(cable2);
  const hook = new THREE.Group(); g.add(hook);
  { const kb = new Batch();
    kb.add(new RoundedBoxGeometry(0.55, 0.8, 0.35, 2, 0.08).translate(0, 0.95, 0), mat("crBlock", () => twoTone(new THREE.MeshPhongMaterial({ map: hazardTex(), specular: "#ffffff", shininess: 30 }))));
    kb.add(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8).translate(0, 0.42, 0), steel);
    const hk = new THREE.TorusGeometry(0.16, 0.05, 6, 14, Math.PI * 1.5); hk.rotateZ(Math.PI * 0.75); hk.translate(0, 0.12, 0); kb.add(hk, steel);
    kb.build(hook); hook.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); }
  const tip = (swing: number, el: number) => {
    const f = V(Math.sin(swing), 0, Math.cos(swing));
    return V(0, 1.8 + FOOT[1] - 1.8, 0).addScaledVector(f, FOOT[0] + Math.cos(el) * (L + 0.1)).add(V(0, Math.sin(el) * (L + 0.1) - 0.42, 0));
  };
  const SOLIDS: [V3, V3][] = [[[-3.9, 0, -5.2], [3.9, 3.0, 5.4]], [[-2.2, 1.8, -4.4], [2.2, 6.5, 2.6]]];
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  const stretch = (m: THREE.Mesh, a: THREE.Vector3, c: THREE.Vector3) => { m.scale.set(1, Math.max(0.01, a.distanceTo(c)), 1); m.position.copy(a).add(c).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()); };
  return {
    g, hook, L, FOOT, SOLIDS, tip,
    set: ({ swing = 0, el = 0.6, cable: cl = 8, t = 0, sway = 0 }) => {
      house.rotation.y = swing; boom.rotation.x = -el;
      // pendants: gantry top (house local) -> boom tip (house local)
      const tipH = V(0, FOOT[1] - 1.8 + Math.sin(el) * L, FOOT[0] + Math.cos(el) * L);
      for (const [m, s] of [[pendant, -1], [pendant2, 1]] as [THREE.Mesh, number][]) stretch(m, V(s * 0.8, 4.6, -1.6), tipH.clone().add(V(s * 0.3, 0.25, 0)));
      const T = tip(swing, el);
      const sw = sway * 0.25 * Math.sin(t * 1.7), sw2 = sway * 0.18 * Math.sin(t * 1.3 + 1);
      B.set(T.x + sw, T.y - cl, T.z + sw2);
      hook.position.copy(B);
      A.copy(T); stretch(cable, A.clone().add(V(-0.12, 0, 0)), B.clone().add(V(-0.12, 1.3, 0))); stretch(cable2, A.clone().add(V(0.12, 0, 0)), B.clone().add(V(0.12, 1.3, 0)));
    },
  };
};
