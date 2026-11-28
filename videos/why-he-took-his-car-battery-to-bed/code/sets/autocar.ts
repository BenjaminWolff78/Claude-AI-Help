// 1904 open motor car (a "touring tonneau"): high wooden artillery wheels with cream spokes, a short front bonnet with
// a brass honeycomb radiator, brass drum headlamps + brass side oil lamps, a brass bulb horn on the driver's side,
// buttoned leather benches (front bench + a raised rear tonneau), sweeping mudguards into running boards, no roof.
// Reusable by any set: import { autocar } from "./autocar".
//
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Length 3.9 m (z -1.95..1.98),
// width 1.82 m over the running boards / hubs, height 1.75 m (rear backrest). Right-hand drive: the driver sits on the
// car's RIGHT, which is local -x (forward +z, up +y => right = -x).
// API: const car = autocar(parent, { colour: "red" | "green" | "blue" | "#hex", flag?: "JUDGES", door?: true });
//      car.g      outer group: place it (position) and orient it (rotation.set(pitch, yaw, 0, "YXZ"))
//      car.set({ dist, t, bob, steer, horn, door })
//        dist  metres driven (wheels turn dist / R)      bob   0..1 body bounce (1 = rutted dirt road, 0.15 = idling)
//        steer -1..1 front wheels + steering wheel       horn  0..1 bulb squeeze (1 = squashed flat)
//        door  0..1 rear tonneau door (only when built with door: true; opens to the car's left, local +x)
//      car.SEATS  seat-top marks (local) for card characters (mode "sit"): driver (-x, front), front (+x, front),
//                 rear (centre of the tonneau), rearL (+x), rearR (-x).  car.R wheel radius, car.length.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow } from "../setkit";
import { fitText } from "./portkit_common";
import type { V3 } from "./types";

const TAU = Math.PI * 2;
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const phong = (key: string, color: string, shininess = 40, specular = "#ffffff", side: THREE.Side = THREE.FrontSide, map?: THREE.Texture) =>
  mat("acP_" + key, () => twoTone(new THREE.MeshPhongMaterial({ color, specular, shininess, side, map: map ?? null })));

export const CAR_COLOURS: Record<string, { body: string; trim: string; leather: string; wheel: string }> = {
  red: { body: "#c8282e", trim: "#7a1420", leather: "#3a2a3e", wheel: "#f0d68a" },   // the officials' car
  green: { body: "#2f7a4a", trim: "#1d4a30", leather: "#a8582e", wheel: "#e8c46a" }, // the coach's car
  blue: { body: "#2c5aa8", trim: "#1c3468", leather: "#7a2a26", wheel: "#f2e2b4" },  // the third car
};

/** buttoned (tufted) leather: diamond pleats with a button at every crossing */
const tuftTex = (col: string) => ctex("acTuft" + col, 256, 256, (g) => {
  const c = new THREE.Color(col), lt = "#" + c.clone().lerp(new THREE.Color("#fff2dc"), 0.18).getHexString(), dk = "#" + c.clone().lerp(new THREE.Color("#1e1424"), 0.28).getHexString();
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  const S = 64;
  for (let y = -S; y <= 256 + S; y += S) for (let x = -S; x <= 256 + S; x += S) for (const o of [0, S / 2]) {
    const cx = x + o, cy = y + o;
    const gr = g.createRadialGradient(cx - 8, cy - 10, 2, cx, cy, S * 0.55); gr.addColorStop(0, lt); gr.addColorStop(0.7, col); gr.addColorStop(1, dk);
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy - S / 2); g.lineTo(cx + S / 2, cy); g.lineTo(cx, cy + S / 2); g.lineTo(cx - S / 2, cy); g.closePath(); g.fill();
  }
  g.strokeStyle = dk; g.lineWidth = 1.5;
  for (let k = -256; k < 512; k += S / 2) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k + 256, 0); g.lineTo(k, 256); g.stroke(); }
  for (let y = 0; y <= 256; y += S / 2) for (let x = (y / (S / 2)) % 2 ? S / 4 : 0; x <= 256; x += S / 2) {
    g.fillStyle = dk; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.fillStyle = lt; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2, 0, TAU); g.fill();
  }
});
/** brass honeycomb radiator */
const honeyTex = () => ctex("acHoney", 128, 160, (g) => {
  g.fillStyle = "#6a4a20"; g.fillRect(0, 0, 128, 160);
  for (let y = 0; y < 170; y += 9) for (let x = (y / 9) % 2 ? 5 : 0; x < 135; x += 10) { g.fillStyle = "#e8b850"; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(x + 4.4 * Math.cos(a), y + 4.4 * Math.sin(a)); } g.fill(); g.fillStyle = "#4a3418"; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(x + 2.6 * Math.cos(a), y + 2.6 * Math.sin(a)); } g.fill(); }
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "rgba(255,240,190,0.35)"); gr.addColorStop(0.4, "rgba(255,240,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
});
const lensTex = () => ctex("acLens", 128, 128, (g) => {
  const gr = g.createRadialGradient(50, 48, 4, 64, 64, 64); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.5, "#f2ecd8"); gr.addColorStop(1, "#b8a888");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(150,120,80,0.5)"; g.lineWidth = 3; for (let r = 16; r < 64; r += 12) { g.beginPath(); g.arc(64, 64, r, 0, TAU); g.stroke(); }
});
/** varnished wooden dash with a brass oiler and two gauges */
const dashTex = () => ctex("acDash", 256, 128, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#b8743a"); gr.addColorStop(1, "#8a4e26"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "rgba(90,46,20,0.55)"; g.lineWidth = 2; for (let y = 6; y < 128; y += 7 + r() * 6) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + r() * 6 - 3, 170, y + r() * 6 - 3, 256, y); g.stroke(); }
  for (const x of [70, 186]) { g.fillStyle = "#e0b04a"; g.beginPath(); g.arc(x, 60, 22, 0, TAU); g.fill(); g.fillStyle = "#f6efdc"; g.beginPath(); g.arc(x, 60, 16, 0, TAU); g.fill(); g.strokeStyle = "#3a2420"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 9, 52); g.stroke(); }
  g.fillStyle = "#e0b04a"; g.fillRect(118, 30, 20, 60); g.fillStyle = "rgba(255,245,200,0.6)"; g.fillRect(121, 34, 5, 52);
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(0, 0, 256, 14);
});
const pennantTex = (text: string, col: string) => ctex("acPennant" + text + col, 512, 160, (g) => {
  g.clearRect(0, 0, 512, 160); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.lineTo(512, 80); g.lineTo(0, 160); g.closePath(); g.fill();
  g.fillStyle = "#f8eccc"; g.fillRect(0, 0, 18, 160);
  g.fillStyle = "#fff4d6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, text, 190, 82, 250, 64, "900 %spx Georgia, serif");
});

/** one artillery wheel (axis along x, centre at origin) into a batch */
const wheelInto = (b: Batch, R: number, spokeCol: string, m?: THREE.Matrix4) => {
  const tyre = lam("acTyre", () => ({ color: "#3a3440" })), rim = phong("rim", "#4a3a2e", 20, "#886655"), spoke = lam("acSpoke" + spokeCol, () => ({ color: spokeCol }));
  const brass = phong("brass", "#e8b84e", 70, "#fff0c0"), felloe = lam("acFelloe" + spokeCol, () => ({ color: new THREE.Color(spokeCol).multiplyScalar(0.8).getStyle() }));
  const add = (g: THREE.BufferGeometry, mm: THREE.Material) => { if (m) g.applyMatrix4(m); b.add(g, mm); };
  add(new THREE.TorusGeometry(R - 0.045, 0.045, 10, 32).rotateY(Math.PI / 2), tyre);   // thin 1904 tyre
  add(new THREE.TorusGeometry(R - 0.1, 0.032, 6, 30).rotateY(Math.PI / 2), felloe);   // wooden felloe
  add(new THREE.TorusGeometry(R - 0.1, 0.012, 4, 30).rotateY(Math.PI / 2).translate(0.035, 0, 0), rim);
  for (let i = 0; i < 12; i++) add(new THREE.BoxGeometry(0.045, R - 0.16, 0.03).translate(0, (R - 0.16) / 2 + 0.06, 0).rotateX((i / 12) * TAU), spoke);
  add(new THREE.CylinderGeometry(0.085, 0.1, 0.12, 14).rotateZ(Math.PI / 2), spoke);
  add(new THREE.CylinderGeometry(0.05, 0.062, 0.2, 12).rotateZ(Math.PI / 2), brass); // hub cap
};

export type AutoCar = {
  g: THREE.Group; body: THREE.Group; R: number; length: number;
  SEATS: { driver: V3; front: V3; rear: V3; rearL: V3; rearR: V3 };
  set: (o: { dist?: number; t?: number; bob?: number; steer?: number; horn?: number; door?: number }) => void;
};

export const autocar = (parent: THREE.Object3D, o: { colour?: string; flag?: string; door?: boolean } = {}): AutoCar => {
  const pal = CAR_COLOURS[o.colour ?? "red"] ?? { body: o.colour!, trim: new THREE.Color(o.colour!).multiplyScalar(0.55).getStyle(), leather: "#7a2a26", wheel: "#f0d68a" };
  const g = new THREE.Group(); parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const R = 0.47, ZF = 1.12, ZR = -1.12, TX = 0.71;
  const paint = phong("paint" + pal.body, pal.body, 55, "#ffe8e0"), paintDS = phong("paintDS" + pal.body, pal.body, 55, "#ffe8e0", THREE.DoubleSide);
  const trim = phong("trim" + pal.trim, pal.trim, 50, "#ffd8d0");
  const brass = phong("brass", "#e8b84e", 70, "#fff0c0"), blackDS = phong("guard", "#2e2a38", 45, "#9a9ab0", THREE.DoubleSide);
  const iron = lam("acIron", () => ({ color: "#3a3644" })), board = lam("acBoard", () => ({ color: "#6a5040" }));
  const leather = lam("acLeather" + pal.leather, () => ({ map: tuftTex(pal.leather) })), leatherP = lam("acLeatherP" + pal.leather, () => ({ color: pal.leather }));
  const dash = lam("acDashM", () => ({ map: dashTex() }));
  const b = new Batch();
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 2, r).translate(x, y, z), m);
  const rod = (a: V3, c: V3, r: number, m: THREE.Material, bb = b) => {
    const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r, r, A.distanceTo(C), 8);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2); bb.add(geo, m);
  };
  // chassis rails, axles, springs
  for (const s of [-1, 1]) { box(s * 0.44 - 0.04, 0.5, -1.7, s * 0.44 + 0.04, 0.64, 1.9, iron); for (const z of [ZF, ZR]) rbox(0.06, 0.06, 0.9, 0.02, s * 0.44, 0.5, z, iron); }
  for (const z of [ZF, ZR]) rod([-TX, R, z], [TX, R, z], 0.03, iron);
  // bonnet (with louvres), brass radiator, starting handle
  rbox(0.78, 0.5, 0.92, 0.07, 0, 0.95, 1.42, paint);
  rbox(0.8, 0.05, 0.94, 0.02, 0, 1.21, 1.42, trim);
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) box(s * 0.392 - 0.006, 0.82, 1.08 + k * 0.11, s * 0.392 + 0.006, 1.06, 1.12 + k * 0.11, trim);
  rbox(0.86, 0.74, 0.1, 0.03, 0, 0.93, 1.93, brass);
  b.add(new THREE.PlaneGeometry(0.7, 0.58).translate(0, 0.93, 1.985), lam("acHoneyM", () => ({ map: honeyTex() })));
  b.add(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10).translate(0, 1.34, 1.92), brass);  // filler cap
  rod([0, 0.62, 1.95], [0, 0.62, 2.12], 0.018, iron); rod([0, 0.62, 2.12], [0, 0.48, 2.14], 0.016, iron);
  // front apron + scuttle (dash) with the varnished panel
  box(-0.66, 0.66, 0.84, 0.66, 1.18, 0.92, paint);
  b.add(new THREE.PlaneGeometry(1.0, 0.36).rotateY(Math.PI).translate(0, 1.0, 0.835), dash);
  rbox(1.36, 0.06, 0.12, 0.025, 0, 1.2, 0.88, trim);
  // the tub: low front body sides, raised rear tonneau (rounded), brass belt line, floor
  box(-0.62, 0.62, -1.6, 0.62, 0.7, 0.84, board);
  for (const s of [-1, 1]) {
    rbox(0.07, 0.42, 1.0, 0.03, s * 0.635, 0.9, 0.34, paint);                         // front door-less side
    rbox(0.08, 0.035, 1.0, 0.015, s * 0.64, 1.115, 0.34, brass);
  }
  rbox(1.34, 0.7, 1.28, 0.16, 0, 1.03, -0.98, paint);                                  // rear tonneau tub
  rbox(1.38, 0.05, 1.32, 0.03, 0, 1.39, -0.98, trim);
  for (const s of [-1, 1]) rbox(0.03, 0.03, 1.12, 0.012, s * 0.685, 1.2, -0.98, brass);
  // front bench (buttoned leather) + backrest
  box(-0.6, 0.7, 0.06, 0.6, 0.98, 0.62, leatherP);
  rbox(1.18, 0.1, 0.58, 0.04, 0, 1.0, 0.34, leather);
  rbox(1.2, 0.5, 0.12, 0.05, 0, 1.25, 0.02, leather);
  // rear tonneau bench (higher) + curved backrest shell
  rbox(1.12, 0.1, 0.56, 0.04, 0, 1.43, -0.86, leather);
  rbox(1.24, 0.5, 0.16, 0.07, 0, 1.72, -1.38, leather);                                // rear backrest (buttoned)
  rbox(1.3, 0.07, 0.22, 0.03, 0, 1.98, -1.38, trim);
  for (const sx of [-1, 1]) { rbox(0.14, 0.3, 0.7, 0.06, sx * 0.6, 1.58, -1.02, leather); rbox(0.035, 0.035, 0.72, 0.015, sx * 0.6, 1.745, -1.02, brass); }
  // mudguards (open shells) + running boards with a tool box
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.58, 0.58, 0.22, 20, 1, true, -0.2, Math.PI * 0.95).rotateZ(Math.PI / 2).translate(s * TX, R, ZF), blackDS);
    b.add(new THREE.CylinderGeometry(0.58, 0.58, 0.22, 20, 1, true, Math.PI * 0.25, Math.PI * 0.95).rotateZ(Math.PI / 2).translate(s * TX, R, ZR), blackDS);
    box(Math.min(s * 0.62, s * 0.86), 0.5, -0.6, Math.max(s * 0.62, s * 0.86), 0.54, 0.6, blackDS);
    box(Math.min(s * 0.62, s * 0.86), 0.49, -0.6, Math.max(s * 0.62, s * 0.86), 0.5, 0.6, brass);
  }
  rbox(0.2, 0.18, 0.4, 0.03, 0.74, 0.64, 0.0, trim);
  // brass drum headlamps on forks, side oil lamps on the dash, tail lamp
  const lampPts: THREE.Vector3[] = [];
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.11, 0.1, 0.2, 18).rotateX(Math.PI / 2).translate(s * 0.55, 1.02, 1.9), brass);
    b.add(new THREE.CylinderGeometry(0.05, 0.07, 0.08, 10).translate(s * 0.55, 1.16, 1.88), brass);
    rod([s * 0.55, 0.92, 1.9], [s * 0.44, 0.66, 1.8], 0.016, brass);
    lampPts.push(V(s * 0.55, 1.02, 2.005));
    box(s * 0.7 - 0.06, 1.12, 0.84, s * 0.7 + 0.06, 1.3, 0.94, brass);
    b.add(new THREE.ConeGeometry(0.075, 0.1, 4).rotateY(Math.PI / 4).translate(s * 0.7, 1.35, 0.89), brass);
    b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6).translate(s * 0.7, 1.42, 0.89), brass);
  }
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12).rotateX(Math.PI / 2).translate(-0.5, 0.95, -1.66), lam("acTail", () => ({ color: "#d8402e" })));
  // steering column (driver = local -x)
  rod([-0.32, 0.72, 0.8], [-0.32, 1.38, 0.42], 0.025, iron);
  // the bulb horn: brass trumpet along the driver's side, rubber bulb by the wheel
  const hornPath = new THREE.CatmullRomCurve3([V(-0.7, 1.22, 0.6), V(-0.72, 1.2, 0.95), V(-0.7, 1.12, 1.35), V(-0.66, 1.1, 1.72)]);
  b.add(new THREE.TubeGeometry(hornPath, 20, 0.018, 6, false), brass);
  b.add(new THREE.ConeGeometry(0.1, 0.24, 14, 1, true).rotateX(Math.PI / 2).translate(-0.66, 1.1, 1.84), brass);
  // optional pennant staff on the right front mudguard
  b.build(body);
  body.traverse((m) => { (m as THREE.Mesh).castShadow = true; });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10).scale(1, 1, 1.35), lam("acBulb", () => ({ color: "#3a2a34" })));
  bulb.position.set(-0.7, 1.22, 0.52); bulb.castShadow = true; body.add(bulb);
  // steering wheel (wood rim, brass spokes) tilts back with the column
  const wheelG = new THREE.Group(); wheelG.position.set(-0.32, 1.4, 0.4); wheelG.rotation.x = -0.9; body.add(wheelG);
  { const sb = new Batch(); sb.add(new THREE.TorusGeometry(0.19, 0.022, 8, 26).rotateX(Math.PI / 2), lam("acWheelWood", () => ({ color: "#8a4e26" }))); for (let k = 0; k < 4; k++) sb.add(new THREE.BoxGeometry(0.36, 0.014, 0.02).rotateY((k * Math.PI) / 4), brass); sb.build(wheelG); }
  // lamp lenses + soft glints (lamps are unlit by day: the glint is a sun sparkle on the brass/glass)
  const lensM = mat("acLensM", () => new THREE.MeshBasicMaterial({ map: lensTex(), color: new THREE.Color(0.95, 0.95, 0.95) }));
  lampPts.forEach((p) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.095, 18), lensM); m.position.copy(p); m.layers.set(NOINK); body.add(m); });
  const glints = lampPts.map((p) => glow(body, [p.x + 0.04, p.y + 0.04, p.z + 0.03], "#fff2c8", 0.32, 0.7));
  // rear door (tonneau entrance at the back), hinged on the car's left (+x) edge
  const doorG = new THREE.Group(); doorG.position.set(0.3, 0.72, -1.64); body.add(doorG);
  if (o.door) {
    const db = new Batch(); db.add(new RoundedBoxGeometry(0.6, 0.6, 0.06, 2, 0.02).translate(-0.3, 0.3, 0), paint); db.add(boxGeo(V(-0.56, 0.5, -0.04), V(-0.48, 0.53, 0.04)), brass); db.build(doorG);
    doorG.traverse((m) => { (m as THREE.Mesh).castShadow = true; });
  }
  // pennant
  let pen: THREE.Mesh | null = null, penBase: Float32Array | null = null;
  if (o.flag) {
    rod([-0.78, 0.7, 1.35], [-0.78, 1.75, 1.35], 0.012, brass, b); b.build(body);
    const geo = new THREE.PlaneGeometry(0.62, 0.2, 10, 2).translate(0.31, 0, 0).rotateY(Math.PI / 2);
    pen = new THREE.Mesh(geo, mat("acPenM" + o.flag, () => twoTone(new THREE.MeshLambertMaterial({ map: pennantTex(o.flag!, pal.trim === "#7a1420" ? "#f2c230" : pal.trim), alphaTest: 0.5, side: THREE.DoubleSide }))));
    pen.position.set(-0.78, 1.63, 1.35); pen.castShadow = true; body.add(pen); penBase = (geo.attributes.position.array as Float32Array).slice();
  }
  // wheels: rear spin groups, front steer groups holding spin groups
  const spin: THREE.Group[] = [], steerG: THREE.Group[] = [];
  for (const [x, z] of [[TX, ZF], [-TX, ZF], [TX, ZR], [-TX, ZR]]) {
    const holder = new THREE.Group(); holder.position.set(x, R, z); g.add(holder);
    const w = new THREE.Group(); holder.add(w); const wb = new Batch(); wheelInto(wb, R, pal.wheel); wb.build(w);
    spin.push(w); if (z > 0) steerG.push(holder);
  }
  const SEATS = { driver: [-0.3, 1.05, 0.4] as V3, front: [0.3, 1.05, 0.4] as V3, rear: [0, 1.48, -0.8] as V3, rearL: [0.32, 1.48, -0.8] as V3, rearR: [-0.32, 1.48, -0.8] as V3 };
  return {
    g, body, R, length: 3.9, SEATS,
    set: ({ dist = 0, t = 0, bob = 0, steer = 0, horn = 0, door = 0 }) => {
      spin.forEach((w) => { w.rotation.x = dist / R; });
      steerG.forEach((h) => { h.rotation.y = -steer * 0.45; });
      wheelG.rotation.set(-0.9, 0, 0); wheelG.rotateY(steer * 2.2);
      body.position.y = bob * (0.016 * Math.sin(t * 8.3) + 0.01 * Math.sin(t * 13.7 + 1)) + bob * 0.008;
      body.rotation.x = bob * 0.01 * Math.sin(t * 5.1); body.rotation.z = bob * 0.008 * Math.sin(t * 3.7 + 2);
      const h = Math.max(0, Math.min(1, horn)); bulb.scale.set(1 + 0.35 * h, 1 + 0.25 * h, 1 - 0.55 * h);
      doorG.rotation.y = -Math.max(0, Math.min(1, door)) * 1.6;
      glints.forEach((s, i) => { (s.material as THREE.SpriteMaterial).opacity = 0.55 + 0.45 * Math.max(0, Math.sin(t * 1.3 + i * 2.1)) ** 4; });
      if (pen && penBase) {
        const p = pen.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array;
        for (let i = 0; i < p.count; i++) { const zz = -penBase[i * 3 + 2]; a[i * 3] = penBase[i * 3] + Math.sin(t * 9 - zz * 7) * 0.05 * (zz / 0.62); }
        p.needsUpdate = true; pen.geometry.computeVertexNormals();
      }
    },
  };
};
