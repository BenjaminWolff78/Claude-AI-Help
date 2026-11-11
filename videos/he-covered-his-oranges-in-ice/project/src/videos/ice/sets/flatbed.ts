// 1960s flatbed truck ("the bridge truck"): a rounded-fender turquoise cab with a chrome grille and round headlamps, a long
// timber flat deck with stake pockets and a low headboard, dual rear wheels, loaded with stencilled timber crates
// "BRIDGE - THIS SIDE UP" (arrows, numbers, rope lashings) and a few numbered granite blocks strapped on pallets.
// Reusable: import { flatbed } from "./flatbed".
//
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Length 8.6 m (z -4.6..4.0),
// width 2.5 m, cab roof 2.55 m, crate tops ~3.3 m. Left-hand drive (driver on local +x).
// API: const tr = flatbed(parent);
//      tr.g  group (place + yaw it)
//      tr.set({ dist, t, bob, steer, brake })  dist metres driven; bob 0..1 bounce; steer -1..1 (+ = car's left);
//                                               brake 0..1 nose dip + brake lamps
//      tr.SEATS { driver, front } seat-top marks (local, mode "sit"); tr.DECK deck-top height; tr.length
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V } from "../build";
import { ctex, beamHD } from "../paint";
import { col, shiny, tex, mat, rodGeo, TAU, cl, SANS } from "./desertkit";
import { fitText } from "./portkit_common";
import { glow } from "../setkit";
import { twoTone } from "../shade";
import type { V3 } from "./types";

/** timber crate face with the stencil (text fitted inside the board margins) */
export const crateFaceTex = (n: number) => ctex("fbCrate" + n, 512, 384, (g, r) => {
  for (let i = 0; i < 6; i++) { g.fillStyle = ["#d8a86a", "#cf9e60", "#e0b274", "#c89458"][i % 4]; g.fillRect(0, i * 64, 512, 64); g.fillStyle = "rgba(90,50,24,0.75)"; g.fillRect(0, i * 64, 512, 3); }
  for (let i = 0; i < 80; i++) { g.strokeStyle = "rgba(120,70,30,0.3)"; g.lineWidth = 1.5; const y = r() * 384; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + 4, 340, y - 4, 512, y + 2); g.stroke(); }
  g.fillStyle = "#b88a50"; g.fillRect(0, 0, 512, 34); g.fillRect(0, 350, 512, 34); g.fillRect(0, 0, 34, 384); g.fillRect(478, 0, 34, 384);
  g.save(); g.translate(256, 192); g.rotate(-0.02); g.fillStyle = "rgba(40,30,40,0.88)"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "BRIDGE", 0, -78, 400, 96, SANS);
  g.font = "900 40px Arial"; fitText(g, "THIS SIDE UP", 0, 4, 330, 46, SANS);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 196, 22); g.lineTo(s * 176, 22); g.lineTo(s * 176, -12); g.lineTo(s * 162, -12); g.lineTo(s * 186, -42); g.lineTo(s * 210, -12); g.lineTo(s * 196, -12); g.closePath(); g.fill(); }
  fitText(g, `No. ${100 + n * 37}  LONDON - ARIZ.`, 0, 72, 380, 34, SANS);
  g.restore();
  g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 160; i++) { g.globalAlpha = 0.25 * r(); g.fillRect(r() * 512, r() * 384, 2 + r() * 6, 1 + r() * 3); } g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
});
const plain = (n: number) => ctex("fbCrateSide" + n, 256, 256, (g, r) => { for (let i = 0; i < 4; i++) { g.fillStyle = ["#d8a86a", "#cf9e60", "#e0b274", "#c89458"][(i + n) % 4]; g.fillRect(0, i * 64, 256, 64); g.fillStyle = "rgba(90,50,24,0.75)"; g.fillRect(0, i * 64, 256, 3); } g.fillStyle = "#b88a50"; g.fillRect(0, 0, 256, 18); g.fillRect(0, 238, 256, 18); g.fillRect(0, 0, 18, 256); g.fillRect(238, 0, 18, 256); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(120,70,30,0.3)"; g.fillRect(r() * 256, r() * 256, 40, 1.5); } });
/** a labelled crate into a batch (front label on local +z and -z faces), centre bottom at (x, y, z) */
export const bridgeCrate = (b: Batch, x: number, y: number, z: number, w: number, h: number, d: number, n: number, yaw = 0) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z), add = (g: THREE.BufferGeometry, m: THREE.Material) => b.add(g.applyMatrix4(M), m);
  const side = tex("fbSide" + (n % 3), () => plain(n % 3)), face = tex("fbFace" + (n % 4), () => crateFaceTex(n % 4));
  add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), side);
  add(new THREE.PlaneGeometry(w * 0.98, h * 0.98).translate(0, h / 2, d / 2 + 0.01), face);
  add(new THREE.PlaneGeometry(w * 0.98, h * 0.98).rotateY(Math.PI).translate(0, h / 2, -d / 2 - 0.01), face);
  const strap = col("#4a3a40");
  for (const xx of [-w * 0.3, w * 0.3]) { add(boxGeo(V(xx - 0.04, -0.01, -d / 2 - 0.02), V(xx + 0.04, h + 0.02, -d / 2)), strap); add(boxGeo(V(xx - 0.04, h, -d / 2 - 0.02), V(xx + 0.04, h + 0.02, d / 2 + 0.02)), strap); add(boxGeo(V(xx - 0.04, -0.01, d / 2), V(xx + 0.04, h + 0.02, d / 2 + 0.02)), strap); }
};

export type Flatbed = { g: THREE.Group; length: number; DECK: number; SEATS: { driver: V3; front: V3 }; set: (o: { dist?: number; t?: number; bob?: number; steer?: number; brake?: number }) => void };

export const flatbed = (parent: THREE.Object3D, o: { load?: boolean; cab?: string; doorText?: string } = {}): Flatbed => {
  const g = new THREE.Group(); parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const cabC = shiny("fbCab" + (o.cab ?? ""), o.cab ?? "#3fa6a0", 60), ch = shiny("fbChrome", "#e6e8f0", 110), dark = col("#3a3640"), glassM = shiny("fbGlass", "#7fa6cc", 110);
  const b = new Batch();
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 3, r).translate(x, y, z), m);
  const R = 0.5, DECK = 1.35;
  // chassis, cab, hood with rounded fenders, grille
  b.add(boxGeo(V(-0.5, 0.55, -4.4), V(0.5, 0.85, 3.6)), dark);
  rbox(2.2, 1.45, 1.7, 0.3, 0, 1.75, 1.75, cabC);
  rbox(2.25, 0.08, 1.75, 0.04, 0, 2.5, 1.75, cabC);
  b.add(new THREE.BoxGeometry(1.9, 0.6, 0.05).translate(0, 2.05, 2.62), glassM);
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.05, 0.55, 1.0).translate(s * 1.1, 2.05, 1.7), glassM);
  rbox(1.4, 0.95, 1.55, 0.25, 0, 1.3, 3.25, cabC);                                     // hood
  for (const s of [-1, 1]) { rbox(0.55, 0.6, 1.6, 0.26, s * 0.95, 1.0, 3.15, cabC); b.add(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14).rotateX(Math.PI / 2).translate(s * 0.95, 1.28, 3.95), ch); }
  for (const s of [-1, 1]) b.add(new THREE.CircleGeometry(0.11, 14).translate(s * 0.95, 1.28, 4.015), mat("fbLens", () => new THREE.MeshBasicMaterial({ color: "#fff6dc" })));
  rbox(1.0, 0.65, 0.12, 0.05, 0, 1.25, 4.02, ch);
  for (let k = 0; k < 6; k++) b.add(new THREE.BoxGeometry(0.85, 0.04, 0.04).translate(0, 1.0 + k * 0.1, 4.09), dark);
  rbox(2.3, 0.16, 0.22, 0.06, 0, 0.62, 4.1, ch);                                       // bumper
  for (const s of [-1, 1]) { b.add(rodGeo([s * 1.12, 2.2, 2.0], [s * 1.35, 2.25, 2.1], 0.02), ch); b.add(new THREE.BoxGeometry(0.06, 0.28, 0.18).translate(s * 1.38, 2.25, 2.1), ch); } // mirrors
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 8).translate(-0.95, 2.1, 0.75), ch);  // exhaust stack
  b.add(new THREE.PlaneGeometry(1.0, 0.25).rotateY(Math.PI / 2).translate(1.105, 1.75, 1.8), mat("fbDoor" + (o.doorText ?? ""), () => new THREE.MeshBasicMaterial({ map: ctex("fbDoorT" + (o.doorText ?? ""), 256, 64, (gg) => { gg.fillStyle = o.cab ?? "#3fa6a0"; gg.fillRect(0, 0, 256, 64); gg.fillStyle = "#f4efe4"; gg.textAlign = "center"; gg.textBaseline = "middle"; fitText(gg, o.doorText ?? "MIRAGE HAULING", 128, 32, 236, 34, SANS); }) })));
  // deck: timber boards, stake pockets, headboard, mudflaps
  b.add(boxGeo(V(-1.25, DECK - 0.15, -4.6), V(1.25, DECK, 0.85)), tex("fbDeck", () => beamHD()));
  for (let k = 0; k < 8; k++) for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.08, 0.22, 0.1).translate(s * 1.27, DECK - 0.1, -4.3 + k * 0.7), dark);
  b.add(boxGeo(V(-1.25, DECK, 0.7), V(1.25, DECK + 1.2, 0.85)), tex("fbDeck", () => beamHD()));
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.5, 0.55, 0.03).translate(s * 0.95, 0.55, -4.45), dark);
  if (o.load !== false) {
  // load: three stencilled crates + a pallet of numbered granite blocks, rope lashings
  bridgeCrate(b, 0, DECK, -0.35, 2.2, 1.6, 1.4, 1);
  bridgeCrate(b, -0.55, DECK, -2.05, 1.2, 1.2, 1.7, 2, Math.PI / 2);
  bridgeCrate(b, 0.6, DECK, -2.05, 1.0, 1.0, 1.0, 3);
  b.add(boxGeo(V(-1.1, DECK, -4.4), V(1.1, DECK + 0.14, -3.2)), tex("fbDeck", () => beamHD()));
  b.add(new RoundedBoxGeometry(1.0, 0.6, 1.0, 2, 0.04).translate(-0.5, DECK + 0.44, -3.8), col("#c9bda4"));
  b.add(new RoundedBoxGeometry(0.95, 0.6, 1.0, 2, 0.04).translate(0.52, DECK + 0.44, -3.8), col("#bfb39a"));
  for (const z of [-0.6, -2.0, -3.8]) b.add(new THREE.TorusGeometry(1.3, 0.02, 4, 24, Math.PI).rotateY(Math.PI / 2).scale(1, 1.25, 1).translate(0, DECK, z), col("#c2a46a"));
  }
  b.build(body);
  body.traverse((m) => { (m as THREE.Mesh).castShadow = true; m.receiveShadow = true; });
  if (o.load !== false) {
  const numM = mat("fbNum", () => new THREE.MeshBasicMaterial({ map: ctex("fbNumT", 256, 128, (gg) => { gg.clearRect(0, 0, 256, 128); gg.fillStyle = "#f4f2ec"; gg.textAlign = "center"; gg.textBaseline = "middle"; fitText(gg, "4-12-88", 128, 64, 220, 60, SANS); }), transparent: true }));
  for (const x of [-0.5, 0.52]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), numM); m.position.set(x, DECK + 0.44, -3.29); body.add(m); }
  }
  const tails = [-1, 1].map((s) => glow(body, [s * 1.1, 1.0, -4.62], "#ff4030", 0.7, 0));
  { const tb = new Batch(); for (const s of [-1, 1]) tb.add(new THREE.BoxGeometry(0.16, 0.12, 0.04).translate(s * 1.1, 1.0, -4.6), col("#d8302a")); tb.build(body); }
  // wheels: front single, rear dual
  const spin: THREE.Group[] = [], steerG: THREE.Group[] = [], tyre = col("#2e2a36"), hub = shiny("fbHub", "#d8dae4", 90);
  for (const [x, z, dual] of [[0.95, 3.15, 0], [-0.95, 3.15, 0], [0.95, -2.9, 1], [-0.95, -2.9, 1]] as [number, number, number][]) {
    const holder = new THREE.Group(); holder.position.set(x, R, z); g.add(holder); const w = new THREE.Group(); holder.add(w);
    const wb = new Batch(); wb.add(new THREE.CylinderGeometry(R, R, dual ? 0.6 : 0.3, 20).rotateZ(Math.PI / 2).translate(dual ? Math.sign(x) * 0.12 : 0, 0, 0), tyre);
    wb.add(new THREE.CylinderGeometry(0.24, 0.24, (dual ? 0.6 : 0.3) + 0.02, 12).rotateZ(Math.PI / 2).translate(dual ? Math.sign(x) * 0.12 : 0, 0, 0), hub);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; wb.add(new THREE.BoxGeometry(0.02, 0.06, 0.06).translate(Math.sign(x) * (dual ? 0.44 : 0.17), Math.cos(a) * 0.16, Math.sin(a) * 0.16), dark); }
    wb.build(w); w.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); spin.push(w); if (z > 0) steerG.push(holder);
  }
  return {
    g, length: 8.6, DECK, SEATS: { driver: [0.45, 1.5, 1.6], front: [-0.45, 1.5, 1.6] },
    set: ({ dist = 0, t = 0, bob = 0, steer = 0, brake = 0 }) => {
      spin.forEach((w) => { w.rotation.x = dist / R; }); steerG.forEach((h) => { h.rotation.y = steer * 0.4; });
      const bk = cl(brake);
      body.position.y = bob * (0.016 * Math.sin(t * 6.3) + 0.008 * Math.sin(t * 11.1 + 1)) - bk * 0.035; body.rotation.x = bob * 0.006 * Math.sin(t * 3.7) + bk * 0.025;
      tails.forEach((s) => { (s.material as THREE.SpriteMaterial).opacity = bk; });
    },
  };
};
void twoTone;
