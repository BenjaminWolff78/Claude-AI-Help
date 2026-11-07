// 1960s American station wagon ("the family wagon"): long low body with crisp fins, wood-panel sides (varnished
// woodgrain in blond trim), chrome bumpers + grille with quad headlamps, whitewall tyres with chrome hubcaps, a roof
// rack with strapped luggage, big glass house. Also used plain (woody: false, rack: false) for the parked cars.
// Reusable by any set: import { wagon } from "./wagon".
//
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Length 5.5 m (z -2.75..2.75),
// width 2.0 m, roof 1.45 m (rack + luggage to ~1.95). Left-hand drive: the driver sits on the car's LEFT = local +x
// (forward +z, up +y => right = -x).
// API: const w = wagon(parent, { colour?: "#hex", woody?: true, rack?: true, roof?: "#hex" });
//      w.g      outer group: place it and orient it (rotation.y = yaw, local +z -> travel direction)
//      w.set({ dist, t, bob, steer, door, brake })
//        dist  metres driven (wheels turn dist / R)      bob   0..1 body bounce (1 = moving on a road, 0.1 idling)
//        steer -1..1 front wheels (+ = toward the car's left / +x)
//        door  0..1 the front passenger door (car's right, -x side) swings open
//        brake 0..1 nose dip (pull-up stop) + red brake-lamp glow
//      w.SEATS  seat-top marks (local) for card characters (mode "sit"): driver (+x front), front (-x front),
//               rearL (+x rear bench), rearR (-x rear bench), back (the rear-facing way-back seat, centre).
//      w.R wheel radius, w.length.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V } from "../build";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { woodPanelTex, mat, col, tex, shiny, TAU, cl } from "./desertkit";
import { ctex } from "../paint";
import type { V3 } from "./types";

const chrome = () => shiny("wgChrome", "#e6e8f0", 110, "#ffffff");
const glassM = () => mat("wgGlass", () => twoTone(new THREE.MeshPhongMaterial({ color: "#a8d0ec", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.32, depthWrite: false })));
const wwTex = () => ctex("wgWhitewall", 128, 128, (g) => {
  g.fillStyle = "#2e2a36"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#f4f0e6"; g.beginPath(); g.arc(64, 64, 50, 0, TAU); g.fill();
  g.fillStyle = "#2e2a36"; g.beginPath(); g.arc(64, 64, 38, 0, TAU); g.fill();
  const gr = g.createRadialGradient(56, 54, 4, 64, 64, 34); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.6, "#cfd2dc"); gr.addColorStop(1, "#8a8ea0"); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 32, 0, TAU); g.fill();
  g.strokeStyle = "#7a7e90"; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(64 + Math.cos(a) * 10, 64 + Math.sin(a) * 10); g.lineTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30); g.stroke(); }
  g.fillStyle = "#c8352e"; g.beginPath(); g.arc(64, 64, 7, 0, TAU); g.fill();
});
const grilleTex = () => ctex("wgGrille", 256, 64, (g) => {
  g.fillStyle = "#3a3846"; g.fillRect(0, 0, 256, 64);
  for (let x = 4; x < 256; x += 10) { g.fillStyle = "#d8dae4"; g.fillRect(x, 4, 4, 56); }
  g.fillStyle = "#f2f2f6"; g.fillRect(0, 0, 256, 6); g.fillRect(0, 58, 256, 6);
});

export type Wagon = {
  g: THREE.Group; body: THREE.Group; R: number; length: number;
  SEATS: { driver: V3; front: V3; rearL: V3; rearR: V3; back: V3 };
  set: (o: { dist?: number; t?: number; bob?: number; steer?: number; door?: number; brake?: number }) => void;
};

export const wagon = (parent: THREE.Object3D, o: { colour?: string; woody?: boolean; rack?: boolean; roof?: string; convertible?: boolean } = {}): Wagon => {
  const c = o.colour ?? "#5fb0b4", woody = o.woody ?? true, rack = o.rack ?? woody;
  const g = new THREE.Group(); parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const R = 0.36, ZF = 1.55, ZR = -1.55, TX = 0.82;
  const paint = shiny("wgPaint" + c, c, 70, "#ffffff"), roofP = shiny("wgRoof" + (o.roof ?? "#f4efe4"), o.roof ?? "#f4efe4", 70);
  const b = new Batch();
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 3, r).translate(x, y, z), m);
  // lower body (long slab), hood + deck dip, fins
  rbox(2.0, 0.62, 5.4, 0.12, 0, 0.66, 0, paint);
  rbox(1.96, 0.1, 1.5, 0.04, 0, 1.0, 1.95, paint);                   // hood
  for (const s of [-1, 1]) rbox(0.16, 0.2, 1.3, 0.06, s * 0.92, 1.02, -2.0, paint); // rear fins
  // greenhouse: pillars + roof over the long cabin
  const gl = glassM();
  if (!o.convertible) {
    rbox(1.92, 0.08, 3.62, 0.04, 0, 1.52, -0.62, roofP);
    for (const z of [1.12, 0.0, -1.2, -2.38]) for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.07, 0.5, 0.1).translate(s * 0.925, 1.24, z), roofP);
    b.add(new THREE.BoxGeometry(1.8, 0.46, 0.04).rotateX(-0.12).translate(0, 1.22, -2.44), gl);
  } else {
    // convertible: low windscreen frame, folded top behind the rear bench
    for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.06, 0.42, 0.08).translate(s * 0.9, 1.18, 1.16), roofP);
    rbox(1.8, 0.2, 0.5, 0.08, 0, 1.08, -1.75, roofP);
  }
  const ws = new THREE.BoxGeometry(1.8, o.convertible ? 0.4 : 0.56, 0.04); ws.rotateX(0.5); ws.translate(0, o.convertible ? 1.16 : 1.2, 1.24); b.add(ws, gl);
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.06, 0.04, 3.6).translate(s * 0.96, 0.99, -0.62), chrome());
  // wood panels along the sides (or a chrome spear on plain cars)
  if (woody) { const wp = tex("woodPanel", woodPanelTex); for (const s of [-1, 1]) b.add(new THREE.PlaneGeometry(4.9, 0.4).rotateY(s * Math.PI / 2).translate(s * 1.005, 0.7, -0.15), wp); b.add(new THREE.PlaneGeometry(1.6, 0.38).rotateY(Math.PI).translate(0, 0.72, -2.705), wp); }
  else for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.03, 0.05, 4.6).translate(s * 1.005, 0.86, 0), chrome());
  // chrome: bumpers, grille, trim, door handles; quad headlamps; tail lamps
  const ch = chrome();
  rbox(2.06, 0.18, 0.22, 0.07, 0, 0.42, 2.72, ch); rbox(2.06, 0.18, 0.22, 0.07, 0, 0.42, -2.72, ch);
  b.add(new THREE.PlaneGeometry(1.5, 0.3).translate(0, 0.72, 2.705), tex("grille", grilleTex));
  const lens = mat("wgLens", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.98, 0.9) }));
  for (const s of [-1, 1]) for (const k of [0.62, 0.84]) { b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14).rotateX(Math.PI / 2).translate(s * k, 0.74, 2.71), ch); }
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.06, 0.03, 0.16).translate(s * 1.02, 0.86, 0.6), ch);
  b.add(new THREE.BoxGeometry(2.0, 0.03, 0.03).translate(0, 0.96, 2.7), ch);
  b.add(new THREE.BoxGeometry(0.4, 0.06, 0.2).translate(0, 1.07, 2.5), ch); // hood ornament bar
  // interior: dash, bench seats (front, rear, way-back), steering wheel on the left (+x)
  const vinyl = col("#c8352e"), cream = col("#f4efe4");
  rbox(1.7, 0.14, 0.62, 0.05, 0, 0.9, 0.35, vinyl); rbox(1.7, 0.42, 0.14, 0.06, 0, 1.14, 0.02, vinyl);
  rbox(1.7, 0.14, 0.62, 0.05, 0, 0.9, -0.95, vinyl); rbox(1.7, 0.42, 0.14, 0.06, 0, 1.14, -1.28, vinyl);
  rbox(1.5, 0.12, 0.5, 0.05, 0, 0.88, -2.1, cream);
  rbox(1.8, 0.2, 0.3, 0.06, 0, 1.02, 0.98, col("#3a3846"));
  const wheel = new THREE.TorusGeometry(0.19, 0.022, 8, 22); wheel.rotateX(0.5); wheel.translate(0.42, 1.16, 0.78); b.add(wheel, cream);
  // roof rack: chrome rails + slats + strapped luggage (suitcases, a canvas bundle, a cooler)
  if (rack) {
    for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.05, 0.06, 2.9).translate(s * 0.82, 1.62, -0.6), ch);
    for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(1.7, 0.04, 0.06).translate(0, 1.6, -1.9 + k * 0.65), ch);
    const bags: [number, number, number, number, number, number, string][] = [
      [0.95, 0.32, 0.65, -0.32, 1.82, -1.4, "#c8823a"], [0.7, 0.36, 0.5, 0.42, 1.84, -1.45, "#3f6a9a"], [0.75, 0.24, 0.55, 0.38, 1.79, -0.7, "#e2c27a"],
      [1.0, 0.3, 0.6, -0.28, 1.81, -0.55, "#7a4a3a"], [0.6, 0.28, 0.45, 0.1, 2.1, -1.2, "#d8504a"],
    ];
    for (const [w, h, d, x, y, z, cc] of bags) { rbox(w, h, d, 0.05, x, y, z, col(cc)); b.add(new THREE.BoxGeometry(w + 0.02, h * 0.5, 0.05).translate(x, y + h * 0.05, z - d * 0.3), col("#4a3a30")); }
    b.add(new THREE.CylinderGeometry(0.18, 0.18, 1.3, 12).rotateZ(Math.PI / 2).translate(0.05, 1.82, 0.25), col("#8a9a6a"));
    for (const z of [-1.1, 0.0]) b.add(new THREE.BoxGeometry(1.75, 0.03, 0.05).translate(0, 2.0, z), col("#3a3444"));
  }
  b.build(body);
  body.traverse((m) => { (m as THREE.Mesh).castShadow = true; });
  // headlamp lenses (unlit), brake lamps (glow)
  const lensG = new THREE.Group(); body.add(lensG);
  for (const s of [-1, 1]) for (const k of [0.62, 0.84]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.085, 14), lens); m.position.set(s * k, 0.74, 2.745); m.layers.set(NOINK); lensG.add(m); }
  const tailM = mat("wgTail", () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#e0302a") }));
  const tails: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.04), tailM); m.position.set(s * 0.92, 1.0, -2.67); body.add(m); tails.push(m); }
  const brakeGlow = [-1, 1].map((s) => glow(body, [s * 0.92, 1.0, -2.76], "#ff4030", 0.7, 0));
  // passenger door (car's right, -x), hinged at its front edge
  const doorG = new THREE.Group(); doorG.position.set(-1.0, 0.36, 1.05); body.add(doorG);
  { const db = new Batch(); db.add(new RoundedBoxGeometry(0.08, 0.62, 1.15, 2, 0.03).translate(0, 0.32, -0.58), paint); if (woody) db.add(new THREE.PlaneGeometry(1.05, 0.38).rotateY(-Math.PI / 2).translate(-0.045, 0.34, -0.58), tex("woodPanel", woodPanelTex)); db.build(doorG); doorG.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); }
  // wheels (whitewalls + hubcaps)
  const spin: THREE.Group[] = [], steerG: THREE.Group[] = [];
  const tyre = col("#2e2a36"), wwM = mat("wgWW", () => twoTone(new THREE.MeshLambertMaterial({ map: wwTex() })));
  for (const [x, z] of [[TX, ZF], [-TX, ZF], [TX, ZR], [-TX, ZR]]) {
    const holder = new THREE.Group(); holder.position.set(x, R, z); g.add(holder);
    const w = new THREE.Group(); holder.add(w);
    const wb = new Batch(); wb.add(new THREE.CylinderGeometry(R, R, 0.24, 20).rotateZ(Math.PI / 2), tyre);
    wb.add(new THREE.CircleGeometry(R * 0.98, 20).rotateY(Math.sign(x) * Math.PI / 2).translate(Math.sign(x) * 0.121, 0, 0), wwM);
    wb.build(w); spin.push(w); if (z > 0) steerG.push(holder);
  }
  // wheel arches (dark) so the wheels sit in the body
  { const ab = new Batch(); for (const [x, z] of [[TX, ZF], [-TX, ZF], [TX, ZR], [-TX, ZR]]) ab.add(new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.22, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).translate(x, R + 0.02, z), col("#2a2632")); ab.build(body); }
  const SEATS = { driver: [0.42, 0.97, 0.38] as V3, front: [-0.42, 0.97, 0.38] as V3, rearL: [0.42, 0.97, -0.92] as V3, rearR: [-0.42, 0.97, -0.92] as V3, back: [0, 0.94, -2.05] as V3 };
  return {
    g, body, R, length: 5.5, SEATS,
    set: ({ dist = 0, t = 0, bob = 0, steer = 0, door = 0, brake = 0 }) => {
      spin.forEach((w) => { w.rotation.x = dist / R; });
      steerG.forEach((h) => { h.rotation.y = steer * 0.42; });
      const bk = cl(brake);
      body.position.y = bob * (0.012 * Math.sin(t * 7.1) + 0.007 * Math.sin(t * 12.3 + 1)) - bk * 0.03;
      body.rotation.x = bob * 0.006 * Math.sin(t * 4.3) + bk * 0.035; body.rotation.z = bob * 0.005 * Math.sin(t * 3.1 + 2);
      doorG.rotation.y = cl(door) * 1.15;
      brakeGlow.forEach((s) => { (s.material as THREE.SpriteMaterial).opacity = bk; });
    },
  };
};
