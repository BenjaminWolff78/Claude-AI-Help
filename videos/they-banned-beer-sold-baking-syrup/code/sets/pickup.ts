// A dusty 1990s pickup truck (the best hunter's): boxy cab with rounded edges, short bed with low sides and a tailgate,
// round headlamps in a black grille, chrome bumpers, a roll bar with two lamps, mud on the sills. PBR paint (MeshStandard)
// so it sits in the Poly Haven world. Reusable: import { pickup } from "./pickup".
//
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Length 5.2 m (z -2.75..2.45),
// width 1.9 m, cab roof 1.86 m, bed floor 0.92 m. Left-hand drive (driver on local +x).
// API: const pk = pickup(parent, { paint });
//      pk.g  group (place + yaw it)
//      pk.set({ dist, t, bob, steer, brake, doorL })  dist metres driven (wheels turn), bob 0..1 engine / road shake,
//                                                     steer -1..1 (+ = toward local +x), brake 0..1, doorL 0..1 (driver door)
//      pk.SEAT driver seat-top mark (local, for a "sit" card), pk.BED bed-floor centre, pk.HOOD hood-top front point
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { col, cl, TAU } from "./mailkit";
import { phMat } from "../ph";
import { glow } from "../setkit";
import type { V3 } from "./types";

export type Pickup = { g: THREE.Group; length: number; SEAT: V3; BED: V3; HOOD: V3; set: (o: { dist?: number; t?: number; bob?: number; steer?: number; brake?: number; doorL?: number; lamps?: number }) => void };

class GB { private m = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(g: THREE.BufferGeometry, mt: THREE.Material) { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!["position", "normal", "uv"].includes(k)) x.deleteAttribute(k); if (!x.attributes.uv) x.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); (this.m.get(mt) ?? this.m.set(mt, []).get(mt)!).push(x); }
  build(p: THREE.Object3D) { for (const [mt, l] of this.m) { const me = new THREE.Mesh(mergeGeometries(l, false), mt); me.castShadow = true; me.receiveShadow = true; p.add(me); } this.m.clear(); } }

export const pickup = (parent: THREE.Object3D, o: { paint?: string } = {}): Pickup => {
  const g = new THREE.Group(); parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const paintC = o.paint ?? "#9a3a30";
  const paint = new THREE.MeshStandardMaterial({ color: paintC, roughness: 0.42, metalness: 0.35, envMapIntensity: 1.0 });
  const paintDull = new THREE.MeshStandardMaterial({ color: new THREE.Color(paintC).multiplyScalar(0.78), roughness: 0.75, metalness: 0.2, envMapIntensity: 0.8 });
  const chrome = col("#d4d6dc", 0.18, 1.0, 1.6), black = col("#1e1e22", 0.6, 0.1, 0.6), rubber = col("#26252a", 0.9, 0, 0.4);
  const glassM = new THREE.MeshStandardMaterial({ color: "#6a8098", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.38, envMapIntensity: 1.8, depthWrite: false });
  const mud = phMat("brown_mud_dry", 1 / 0.8, 1 / 0.8, { tint: "#b09070", rough: 1, env: 0.4, key: "pkMud" });
  const bedFloor = phMat("rusty_metal", 1 / 0.9, 1 / 0.9, { tint: "#8a7a6a", rough: 0.9, metal: 0.4, env: 0.6, key: "pkBed" });
  const b = new GB();
  const rb = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 3, r).translate(x, y, z), m);
  const R = 0.38, BEDY = 0.92;
  // chassis + sills
  rb(1.5, 0.22, 4.7, 0.05, 0, 0.5, -0.1, black);
  for (const s of [-1, 1]) rb(0.16, 0.16, 2.4, 0.05, s * 0.86, 0.47, 0.25, mud);
  // hood + front fenders, cab, roof
  rb(1.86, 0.5, 1.45, 0.12, 0, 0.95, 1.65, paint);
  rb(1.78, 0.06, 1.3, 0.03, 0, 1.22, 1.6, paint);
  rb(1.88, 0.66, 1.55, 0.14, 0, 1.0, 0.25, paint);                     // cab lower + doors
  rb(1.76, 0.12, 1.25, 0.06, 0, 1.8, 0.12, paint);                     // roof
  for (const [x, z, w, d] of [[0.86, 0.72, 0.06, 0.07], [-0.86, 0.72, 0.06, 0.07], [0.86, -0.46, 0.06, 0.08], [-0.86, -0.46, 0.06, 0.08]] as number[][]) rb(w, 0.5, d, 0.02, x, 1.56, z, paint); // pillars
  b.add(new THREE.BoxGeometry(1.66, 0.5, 0.04).rotateX(-0.42).translate(0, 1.56, 0.82), glassM);   // windscreen
  b.add(new THREE.BoxGeometry(1.5, 0.36, 0.04).translate(0, 1.56, -0.52), glassM);                 // rear window
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.03, 0.44, 1.12).translate(s * 0.9, 1.54, 0.15), glassM); // side windows
  // grille, headlamps, bumpers, mirrors
  rb(1.5, 0.36, 0.08, 0.03, 0, 0.92, 2.38, black);
  for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(1.0, 0.025, 0.03).translate(0, 0.82 + k * 0.07, 2.43), chrome);
  for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16).rotateX(Math.PI / 2).translate(s * 0.62, 0.95, 2.42), chrome); }
  rb(1.96, 0.16, 0.2, 0.05, 0, 0.6, 2.47, chrome);
  rb(1.96, 0.14, 0.18, 0.05, 0, 0.6, -2.72, chrome);
  for (const s of [-1, 1]) { b.add(new THREE.BoxGeometry(0.2, 0.03, 0.03).translate(s * 1.02, 1.48, 0.72), black); b.add(new THREE.BoxGeometry(0.05, 0.22, 0.14).translate(s * 1.12, 1.5, 0.72), black); }
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.02, 0.04, 0.2).translate(s * 0.95, 1.2, 0.35), black);   // door handles
  // the bed: floor, sides, wheel arches, tailgate
  b.add(new THREE.BoxGeometry(1.6, 0.06, 2.05).translate(0, BEDY, -1.62), bedFloor);
  for (const s of [-1, 1]) { rb(0.1, 0.55, 2.15, 0.03, s * 0.88, BEDY + 0.24, -1.62, paint); rb(0.14, 0.05, 2.15, 0.02, s * 0.88, BEDY + 0.53, -1.62, paintDull); rb(0.12, 0.5, 2.15, 0.04, s * 0.88, 0.78, -1.62, paint); }
  rb(1.86, 0.62, 0.08, 0.03, 0, BEDY + 0.2, -0.57, paint);           // front of bed
  rb(1.78, 0.6, 0.08, 0.03, 0, BEDY + 0.2, -2.68, paint);            // tailgate
  for (const s of [-1, 1]) rb(0.3, 0.3, 0.9, 0.12, s * 0.72, BEDY + 0.1, -1.95, paintDull);   // wheel tubs
  // roll bar + two lamps
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10).translate(s * 0.78, BEDY + 0.88, -0.7), black);
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 1.56, 10).rotateZ(Math.PI / 2).translate(0, BEDY + 1.24, -0.7), black);
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.085, 0.07, 0.1, 14).rotateX(Math.PI / 2).translate(s * 0.4, BEDY + 1.34, -0.66), black);
  // mud splash on the lower body
  for (const s of [-1, 1]) for (const z of [1.65, -1.62]) b.add(new THREE.BoxGeometry(0.02, 0.18, 1.0).translate(s * 0.945, 0.66, z), mud);
  b.build(body);
  // lenses (unlit) + tail lamps
  const lensM = new THREE.MeshBasicMaterial({ color: "#fff4d8" }), lens: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.095, 18), lensM); m.position.set(s * 0.62, 0.95, 2.455); body.add(m); lens.push(m); }
  const tailM = new THREE.MeshStandardMaterial({ color: "#b0201c", roughness: 0.3, emissive: "#ff2010", emissiveIntensity: 0 });
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.03), tailM); m.position.set(s * 0.86, BEDY + 0.24, -2.74); body.add(m); }
  const brakeG = [-1, 1].map((s) => glow(body, [s * 0.86, BEDY + 0.24, -2.78], "#ff3020", 0.5, 0));
  // the driver door (hinged at the front edge, local +x side)
  const door = new THREE.Group(); door.position.set(0.945, 0, 0.98); body.add(door);
  { const db = new GB(); db.add(new RoundedBoxGeometry(0.06, 0.62, 1.08, 2, 0.02).translate(0, 1.0, -0.56), paint); db.add(new THREE.BoxGeometry(0.03, 0.42, 0.98).translate(0, 1.53, -0.55), glassM); db.build(door); }
  // wheels
  const spin: THREE.Group[] = [], steerG: THREE.Group[] = [];
  for (const [x, z] of [[0.8, 1.62], [-0.8, 1.62], [0.8, -1.62], [-0.8, -1.62]] as [number, number][]) {
    const holder = new THREE.Group(); holder.position.set(x, R, z); g.add(holder); const w = new THREE.Group(); holder.add(w);
    const wb = new GB();
    wb.add(new THREE.TorusGeometry(R - 0.1, 0.11, 10, 28).rotateY(Math.PI / 2).scale(1.6, 1, 1), rubber);
    wb.add(new THREE.CylinderGeometry(R - 0.12, R - 0.12, 0.26, 24).rotateZ(Math.PI / 2), rubber);
    wb.add(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 18).rotateZ(Math.PI / 2), chrome);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; wb.add(new THREE.BoxGeometry(0.3, 0.035, 0.035).translate(0, Math.cos(a) * 0.1, Math.sin(a) * 0.1), black); }
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; wb.add(new THREE.BoxGeometry(0.28, 0.06, 0.05).rotateX(-a).translate(0, Math.cos(a) * (R - 0.01), Math.sin(a) * (R - 0.01)), rubber); } // tread blocks
    wb.build(w); spin.push(w); if (z > 0) steerG.push(holder);
  }
  // fender arches over the wheels (dark, read as the wheel wells)
  { const ab = new GB(); for (const [x, z] of [[0.8, 1.62], [-0.8, 1.62], [0.8, -1.62], [-0.8, -1.62]] as [number, number][]) ab.add(new THREE.TorusGeometry(R + 0.06, 0.06, 6, 16, Math.PI).rotateY(Math.PI / 2).translate(x * 1.16, R + 0.08, z), paintDull); ab.build(body); }
  return {
    g, length: 5.2, SEAT: [0.42, 1.0, 0.18], BED: [0, BEDY + 0.03, -1.62], HOOD: [0, 1.25, 2.1],
    set: ({ dist = 0, t = 0, bob = 0, steer = 0, brake = 0, doorL = 0, lamps = 0 }) => {
      spin.forEach((w) => { w.rotation.x = dist / R; }); steerG.forEach((h) => { h.rotation.y = steer * 0.42; });
      const bk = cl(brake);
      body.position.y = bob * (0.012 * Math.sin(t * 7.3) + 0.007 * Math.sin(t * 13.1 + 1)) - bk * 0.03; body.rotation.x = bob * 0.006 * Math.sin(t * 4.1) + bk * 0.022; body.rotation.z = bob * 0.004 * Math.sin(t * 3.3 + 2);
      brakeG.forEach((s) => { (s.material as THREE.SpriteMaterial).opacity = bk; }); tailM.emissiveIntensity = bk * 2.2;
      door.rotation.y = cl(doorL) * 1.1;
      lensM.color.setRGB(1 + lamps * 2, 0.95 + lamps * 1.9, 0.85 + lamps * 1.6);
    },
  };
};
