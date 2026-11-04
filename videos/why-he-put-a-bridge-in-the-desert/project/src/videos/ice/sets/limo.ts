// 1920s Paris town car ("coupé de ville" limousine): long louvred bonnet, upright chrome radiator with a mascot, big
// round drum headlamps on a bar, sweeping black wings into running boards, wooden artillery-spoke wheels, a side-
// mounted spare wheel (car's +x side), an OPEN chauffeur seat (right-hand drive) and a CLOSED rear cabin with windows,
// carriage lamps, a strapped trunk and chrome bumpers. Reusable: import { limo } from "./limo".
//
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Length 5.5 m (z -2.8..2.7),
// width 2.1 m over the running boards, height 2.08 m. yaw = 0 faces +z, yaw = PI faces -z.
// API: const car = limo(parent, [x, 0, z], yaw, "#6b1d2a");
//      car.set(dist, t, { bob, lights })  dist = metres driven (wheels turn dist / R), bob 0..1 = body bounce
//      (1 = driving on cobbles, ~0.2 = idling), lights 0..1 = headlamps / carriage lamps on.
//      car.g (move / yaw it), car.body (bobbing group), car.wheels (4 spinning groups), car.R, car.seat (driver seat
//      top, local), car.door (rear door handle, local; +x side).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import type { V3 } from "./types";

const TAU = Math.PI * 2;
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
/** lacquer / chrome / glass: two-tone Phong (keeps a soft painted highlight) */
const phong = (key: string, color: string, shininess = 40, specular = "#ffffff", side: THREE.Side = THREE.FrontSide) =>
  mat("limoP_" + key, () => twoTone(new THREE.MeshPhongMaterial({ color, specular, shininess, side })));

const grilleTex = () => ctex("limoGrille", 128, 160, (g) => {
  g.fillStyle = "#3a3c44"; g.fillRect(0, 0, 128, 160);
  for (let y = 0; y < 160; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 128; x += 8) { g.fillStyle = "#8e96a4"; g.fillRect(x + 1, y + 1, 5, 5); g.fillStyle = "#1e2026"; g.fillRect(x + 2, y + 2, 3, 3); }
  g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, 128, 40);
});
const glassTex = () => ctex("limoGlass", 256, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#8ea4c4"); gr.addColorStop(0.55, "#46557a"); gr.addColorStop(1, "#262c44");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "rgba(255,255,255,0.28)"; g.beginPath(); g.moveTo(40, 0); g.lineTo(110, 0); g.lineTo(60, 128); g.lineTo(-10, 128); g.fill();
  g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.moveTo(130, 0); g.lineTo(150, 0); g.lineTo(100, 128); g.lineTo(80, 128); g.fill();
  // tied-back cream curtains at both edges
  for (const x of [0, 226]) { g.fillStyle = "#efe2c4"; g.fillRect(x, 0, 30, 128); g.fillStyle = "rgba(150,120,80,0.35)"; for (let k = 4; k < 30; k += 8) g.fillRect(x + k, 0, 2, 128); }
  g.fillStyle = "#c7a24a"; g.fillRect(0, 70, 256, 6);
});
const lensTex = () => ctex("limoLens", 128, 128, (g) => {
  const gr = g.createRadialGradient(54, 50, 4, 64, 64, 64); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.5, "#e8ecef"); gr.addColorStop(1, "#aeb6c0");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(120,130,140,0.5)"; g.lineWidth = 2; for (let r = 14; r < 64; r += 12) { g.beginPath(); g.arc(64, 64, r, 0, TAU); g.stroke(); }
});

/** one artillery wheel (axis along x, centre at origin) into a batch */
const wheelInto = (b: Batch, R: number, body: THREE.Material, m?: THREE.Matrix4) => {
  const tyre = lam("limoTyre", () => ({ color: "#26232b" })), rim = phong("rim", "#20202a", 30, "#888888"), spoke = lam("limoSpoke", () => ({ color: "#e9d8b0" }));
  const chrome = phong("chrome", "#dfe4ec", 80, "#ffffff");
  const add = (g: THREE.BufferGeometry, mm: THREE.Material) => { if (m) g.applyMatrix4(m); b.add(g, mm); };
  add(new THREE.TorusGeometry(R - 0.075, 0.075, 10, 30).rotateY(Math.PI / 2), tyre);
  add(new THREE.TorusGeometry(R - 0.15, 0.03, 6, 26).rotateY(Math.PI / 2), rim);
  add(new THREE.CylinderGeometry(R - 0.15, R - 0.15, 0.03, 24).rotateZ(Math.PI / 2), body); // painted disc behind the spokes (reads as a wheel at any speed)
  for (let i = 0; i < 12; i++) add(new THREE.BoxGeometry(0.075, R - 0.2, 0.04).translate(0, (R - 0.2) / 2 + 0.07, 0).rotateX((i / 12) * TAU), spoke);
  add(new THREE.CylinderGeometry(0.1, 0.12, 0.17, 16).rotateZ(Math.PI / 2), chrome);
  add(new THREE.CylinderGeometry(0.055, 0.07, 0.24, 12).rotateZ(Math.PI / 2), chrome);
};

export type Limo = {
  g: THREE.Group; body: THREE.Group; wheels: THREE.Group[]; R: number; length: number; seat: V3; door: V3;
  set: (dist: number, t: number, o?: { bob?: number; lights?: number }) => void;
};

export const limo = (parent: THREE.Object3D, pos: V3, yaw = 0, colour = "#6b1d2a"): Limo => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const R = 0.43, ZF = 1.62, ZR = -1.74, TX = 0.77;
  const paint = phong("paint" + colour, colour, 60, "#ffe8e0");
  const black = phong("black", "#1f1d27", 50, "#9a9ab0"), blackDS = phong("blackDS", "#1f1d27", 50, "#9a9ab0", THREE.DoubleSide);
  const chrome = phong("chrome", "#dfe4ec", 80, "#ffffff"), brass = phong("brass", "#e0b04a", 70, "#fff0c0");
  const leather = lam("limoLeather", () => ({ color: "#6a3424" })), dark = lam("limoDark", () => ({ color: "#2c2830" }));
  const glass = phong("glass", "#ffffff", 90, "#ffffff"); (glass as THREE.MeshPhongMaterial).map = glassTex();
  const shield = mat("limoShield", () => new THREE.MeshPhongMaterial({ color: "#bcd0e6", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.3, depthWrite: false }));
  const b = new Batch();
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 2, r).translate(x, y, z), m);
  const rod = (a: V3, c: V3, r: number, m: THREE.Material) => {
    const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r, r, A.distanceTo(C), 8);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); b.add(geo, m);
  };
  // chassis + running boards (aluminium edged)
  box(-0.44, 0.36, -2.5, 0.44, 0.52, 2.35, dark);
  for (const s of [-1, 1]) {
    const xi = s * 0.8, xo = s * 1.05;
    box(Math.min(xi, xo), 0.4, -1.24, Math.max(xi, xo), 0.46, 1.1, black);
    box(Math.min(xo, xo - s * 0.03), 0.4, -1.24, Math.max(xo, xo - s * 0.03), 0.47, 1.1, chrome);
    // wings: open shells over the wheels (front sweeps down in front, rear sweeps down behind)
    b.add(new THREE.CylinderGeometry(0.53, 0.53, 0.34, 20, 1, true, -0.62, Math.PI + 0.62).rotateZ(Math.PI / 2).translate(s * 0.8, R, ZF), blackDS);
    b.add(new THREE.CylinderGeometry(0.53, 0.53, 0.34, 20, 1, true, 0, Math.PI + 0.66).rotateZ(Math.PI / 2).translate(s * 0.8, R, ZR), blackDS);
  }
  // bonnet with louvres + hinge strip, cowl, radiator, mascot
  rbox(0.94, 0.68, 1.62, 0.07, 0, 0.98, 1.52, paint);
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) box(s * 0.472 - 0.008, 0.86, 1.02 + k * 0.14, s * 0.472 + 0.008, 1.14, 1.06 + k * 0.14, dark);
  box(-0.02, 1.31, 0.72, 0.02, 1.335, 2.32, chrome);
  box(-0.64, 0.56, 0.5, 0.64, 1.37, 0.78, paint);
  box(-0.37, 0.54, 2.31, 0.37, 1.42, 2.44, chrome);
  b.add(new THREE.PlaneGeometry(0.6, 0.74).translate(0, 0.97, 2.445), lam("limoGrilleM", () => ({ map: grilleTex() })));
  b.add(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 12).translate(0, 1.46, 2.37), chrome);
  b.add(new THREE.ConeGeometry(0.035, 0.16, 8).rotateX(-0.5).translate(0, 1.56, 2.38), chrome);
  b.add(new THREE.SphereGeometry(0.035, 8, 6).translate(0, 1.52, 2.42), chrome);
  // headlamps on a bar between the wings, side lamps on the cowl, bumpers
  box(-0.8, 0.95, 2.38, 0.8, 0.99, 2.42, chrome);
  const lensM = mat("limoLensM", () => new THREE.MeshBasicMaterial({ map: lensTex(), color: new THREE.Color(0.9, 0.9, 0.9) }));
  const lamps: THREE.Vector3[] = [];
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.175, 0.15, 0.24, 20).rotateX(Math.PI / 2).translate(s * 0.62, 1.12, 2.4), chrome);
    box(s * 0.62 - 0.03, 0.97, 2.37, s * 0.62 + 0.03, 1.0, 2.43, chrome);
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6).translate(s * 0.62, 1.0, 2.4), chrome);
    b.add(new THREE.CylinderGeometry(0.075, 0.065, 0.14, 12).rotateX(Math.PI / 2).translate(s * 0.69, 1.45, 0.7), chrome);
    lamps.push(V(s * 0.62, 1.12, 2.525));
  }
  box(-0.86, 0.46, 2.58, 0.86, 0.54, 2.66, chrome); for (const s of [-1, 1]) box(s * 0.42 - 0.03, 0.44, 2.3, s * 0.42 + 0.03, 0.52, 2.6, chrome);
  box(-0.86, 0.46, -2.86, 0.86, 0.54, -2.78, chrome); for (const s of [-1, 1]) box(s * 0.42 - 0.03, 0.44, -2.8, s * 0.42 + 0.03, 0.52, -2.45, chrome);
  // windscreen (open chauffeur compartment, right-hand drive)
  for (const s of [-1, 1]) box(s * 0.6 - 0.025, 1.36, 0.56, s * 0.6 + 0.025, 1.98, 0.6, chrome);
  box(-0.62, 1.95, 0.56, 0.62, 1.99, 0.6, chrome);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.58).translate(0, 1.66, 0.58), shield); body.add(ws);
  for (const s of [-1, 1]) box(s * 0.8 - 0.04, 0.5, -0.38, s * 0.8 + 0.04, 1.3, 0.52, paint);
  box(-0.84, 0.56, -0.38, 0.84, 0.64, 0.52, dark);
  box(-0.72, 0.64, -0.28, 0.72, 0.96, 0.18, leather);  // bench
  box(-0.76, 0.96, -0.36, 0.76, 1.42, -0.24, leather); // backrest against the cabin
  rod([-0.36, 0.7, 0.5], [-0.36, 1.2, 0.18], 0.025, dark);
  b.add(new THREE.TorusGeometry(0.19, 0.022, 6, 20).rotateX(-1.0).translate(-0.36, 1.21, 0.17), dark);
  rod([0.88, 0.6, 0.15], [0.88, 1.15, 0.0], 0.02, brass); // brake lever
  // brass bulb horn along the bonnet (+x side)
  b.add(new THREE.ConeGeometry(0.08, 0.26, 12, 1, true).rotateX(Math.PI / 2).translate(0.56, 1.22, 2.36), brass);
  rod([0.56, 1.22, 2.22], [0.56, 1.22, 0.9], 0.018, brass); b.add(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 1, 1.4).translate(0.56, 1.22, 0.86), dark);
  // closed rear cabin: painted lower body, black window band, glass, roof, belt line, door seams, handles
  rbox(1.68, 0.88, 1.98, 0.05, 0, 0.94, -1.37, paint);
  box(-0.8, 1.37, -2.32, 0.8, 1.98, -0.4, black);
  rbox(1.74, 0.12, 2.12, 0.05, 0, 2.02, -1.38, black);
  for (const s of [-1, 1]) {
    box(s * 0.845 - 0.012, 1.34, -2.34, s * 0.845 + 0.012, 1.38, -0.38, chrome);
    for (const z of [-0.52, -1.3]) box(s * 0.845 - 0.012, 0.55, z - 0.012, s * 0.845 + 0.012, 1.98, z + 0.012, dark);
    box(s * 0.85 - 0.015, 1.24, -1.22, s * 0.85 + 0.015, 1.27, -1.08, chrome);
    for (const [z0, z1] of [[-0.56, -1.24], [-1.38, -2.2]]) {
      const pl = new THREE.PlaneGeometry(Math.abs(z1 - z0), 0.46).rotateY(s * Math.PI / 2).translate(s * 0.805, 1.67, (z0 + z1) / 2);
      b.add(pl, glass);
    }
    // carriage lamps on the cabin's front corners
    box(s * 0.87 - 0.06, 1.52, -0.46, s * 0.87 + 0.06, 1.72, -0.36, brass);
    b.add(new THREE.ConeGeometry(0.07, 0.08, 4).rotateY(Math.PI / 4).translate(s * 0.87, 1.76, -0.41), brass);
  }
  b.add(new THREE.PlaneGeometry(1.36, 0.46).translate(0, 1.67, -0.395), glass);
  b.add(new THREE.PlaneGeometry(0.6, 0.3).rotateY(Math.PI).translate(0, 1.72, -2.325), glass);
  // trunk on a rack + straps
  box(-0.64, 0.72, -2.74, 0.64, 1.3, -2.38, black); box(-0.66, 0.66, -2.78, 0.66, 0.72, -2.36, dark);
  for (const x of [-0.35, 0.35]) box(x - 0.04, 0.7, -2.76, x + 0.04, 1.32, -2.72, leather);
  // side-mounted spare wheel (+x side, beside the cowl) with its strap
  wheelInto(b, R, paint, new THREE.Matrix4().makeTranslation(1.02, 0.95, 0.42));
  box(0.86, 1.36, 0.38, 1.06, 1.4, 0.46, dark);
  b.build(body);
  body.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  // lenses (unlit, so they can be switched on), glow cards
  const lensMeshes = lamps.map((p) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), lensM); m.position.copy(p); m.layers.set(NOINK); body.add(m); return m; });
  const glows = lamps.map((p) => glow(body, [p.x, p.y, p.z + 0.08], "#ffe2a8", 1.4, 1));
  const cGlows = [-1, 1].map((s) => glow(body, [s * 0.87, 1.62, -0.36], "#ffc070", 0.6, 1));
  // wheels (spin about local x)
  const wheels = [[TX, ZF], [-TX, ZF], [TX, ZR], [-TX, ZR]].map(([x, z]) => {
    const w = new THREE.Group(); w.position.set(x, R, z); g.add(w);
    const wb = new Batch(); wheelInto(wb, R, paint); wb.build(w); return w;
  });
  return {
    g, body, wheels, R, length: 5.5, seat: [-0.36, 0.96, -0.05], door: [0.86, 0, -1.15],
    set: (dist, t, o = {}) => {
      const bob = o.bob ?? 0, li = o.lights ?? 0;
      wheels.forEach((w) => { w.rotation.x = dist / R; });
      body.position.y = bob * (0.012 * Math.sin(t * 9.1) + 0.008 * Math.sin(t * 14.3 + 1)) + bob * 0.006;
      body.rotation.x = bob * 0.006 * Math.sin(t * 5.3); body.rotation.z = bob * 0.004 * Math.sin(t * 4.1 + 2);
      lensM.color.setScalar(0.9 + li * 1.6);
      glows.forEach((s) => ((s.material as THREE.SpriteMaterial).opacity = li));
      cGlows.forEach((s) => ((s.material as THREE.SpriteMaterial).opacity = li * 0.9));
      lensMeshes.forEach((m) => (m.visible = true));
    },
  };
};
