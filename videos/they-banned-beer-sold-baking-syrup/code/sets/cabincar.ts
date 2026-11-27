// cabincar.ts (v34.1, Nov 27): a modern hatchback with a REAL, HOLLOW CABIN so card drivers and passengers can be seen the
// three ways Rick shows them (board CB1, master prompt 7.18): through the side window (the door hides the body below the
// chest, hands on the wheel), through the windshield (dashboard and wheel in front of the chest), and from inside the cabin
// (bucket seat, belt across the chest, a foot on the pedal). Every earlier car in this repo was a solid painted box
// (carlot.ts, pickup.ts): a card inside it was hidden, and "lean the driver out" was the only fix.
// Proportioned for our big-headed cards, as Rick's cartoon cars are: the belt line sits at a seated card's chest, the
// glasshouse is tall enough for the head, and the wheel sits within the card's short arm reach (0.32 m x scale).
// Local frame: forward = +z, ground y = 0, origin on the ground midway between the axles. Left-hand drive: the driver sits
// on local +x. API:
//   const car = cabinCar(parent, { paint });  car.g: place + yaw it;  car.set({ dist, t, bob, steer, brake })
//   CABIN (exported numbers, so acts can use them without building the car): FLOOR, ROOF_IN, BELT, SEAT (driver seat-top
//   centre), SEAT_P (front passenger), SEAT_HALF, WHEEL (centre), WHEEL_R, WHEEL_TILT, PEDAL (brake pad), GRIPS(steer).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { V3 } from "./types";

export const CABIN = {
  FLOOR: 0.3, ROOF_IN: 1.52, ROOF: 1.56, BELT: 0.84, LEN: 4.1, W: 1.78, R: 0.31, AXLE: 1.32,
  SEAT: [0.4, 0.58, -0.3] as V3, SEAT_P: [-0.4, 0.58, -0.3] as V3, SEAT_HALF: 0.25, REAR: [0, 0.6, -1.12] as V3, BPILLAR: -0.7,
  WHEEL: [0.4, 0.9, -0.03] as V3, WHEEL_R: 0.17, WHEEL_TILT: 0.44, PEDAL: [0.36, 0.42, 0.24] as V3, DASH_TOP: 0.84,
  DASH_Z: 0.13, COWL: [1.1, 0.88] as [number, number], HEADER: [0.2, 1.53] as [number, number],   // v34.1 r2: the windscreen ahead of the driver's big head (r1 put the header behind it: the head poked through the glass)
};
/** the two steering-wheel grips (10 and 2 o'clock) in car-local space; steer -1..1 turns them with the wheel */
export const cabinGrips = (steer = 0): [V3, V3] => {
  const [cx, cy, cz] = CABIN.WHEEL, r = CABIN.WHEEL_R, tl = CABIN.WHEEL_TILT, out: V3[] = [];
  for (const side of [1, -1]) {
    const a = side * (Math.PI / 3) - steer * 1.6;                   // from 12 o'clock; +x = the driver's left (local +x)
    const lx = Math.sin(a) * r, lu = Math.cos(a) * r;              // in the wheel plane: lx along x, lu along the tilted "up"
    out.push([cx + lx, cy + lu * Math.cos(tl), cz - lu * Math.sin(tl)]);
  }
  return [out[0], out[1]];
};

class GB { private m = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(g: THREE.BufferGeometry, mt: THREE.Material) { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!["position", "normal", "uv"].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) x.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); const l = this.m.get(mt) ?? []; l.push(x); this.m.set(mt, l); }
  build(p: THREE.Object3D, shadow = true) { for (const [mt, l] of this.m) { const me = new THREE.Mesh(mergeGeometries(l, false), mt); me.castShadow = shadow; me.receiveShadow = true; p.add(me); } this.m.clear(); } }
const std = (c: string, r: number, m = 0, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(c), roughness: r, metalness: m, ...o });
/** a flat slab between two points (a pillar, a glass strip): thickness t across, width w */
const slab = (a: V3, b: V3, w: number, t: number) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.BoxGeometry(t, L, w); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.applyQuaternion(q); const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
};
/** a quad from four corners (glass, roof skins) */
const quad4 = (p: V3[]) => { const g = new THREE.BufferGeometry(); const v = [p[0], p[1], p[2], p[0], p[2], p[3]].flat(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); g.computeVertexNormals(); return g; };

export type CabinCar = { g: THREE.Group; set: (o: { dist?: number; t?: number; bob?: number; steer?: number; brake?: number; cut?: number }) => void };
export const cabinCar = (parent: THREE.Object3D, o: { paint?: string; seat?: string } = {}): CabinCar => {
  const C = CABIN, g = new THREE.Group(); parent.add(g); const body = new THREE.Group(); g.add(body);
  const paint = std(o.paint ?? "#2f6fb4", 0.32, 0.45, { envMapIntensity: 1.1, side: THREE.DoubleSide }), trim = std("#202226", 0.6, 0.1), chrome = std("#d8dade", 0.15, 1.0);
  const plastic = std("#2a2c31", 0.75, 0.0), plastic2 = std("#3a3d44", 0.7), carpet = std("#24252a", 0.95), seatM = std(o.seat ?? "#3b3f49", 0.9), seatM2 = std("#2c2f37", 0.9);
  const glass = new THREE.MeshStandardMaterial({ color: "#9fb8c8", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.05, envMapIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide });   // r2: at opacity 0.2 / env 1.6 the driver behind it read milky; Rick's drivers read clearly through the glass
  const b = new GB(), ib = new GB(), pb = new GB(), pgl = new GB(), ps = new GB();   // pb/pgl/ps: passenger door, glass, seat (cutaway)
  const rb = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material, B = b) => B.add(new RoundedBoxGeometry(w, h, d, 3, r).translate(x, y, z), m);
  const hw = C.W / 2, xs = hw - 0.02;                                   // outer skin x
  // ---- lower body: sills, the floor pan, front and rear ends, fenders (wheel arches are cut by leaving gaps) ----
  rb(C.W - 0.04, 0.1, 2.0, 0.04, 0, 0.27, -0.2, trim);                  // floor pan underside
  for (const s of [-1, 1]) rb(0.08, 0.14, 1.7, 0.04, s * (hw - 0.04), 0.3, -0.12, paint);   // sills between the arches
  rb(C.W - 0.04, 0.22, 0.95, 0.08, 0, 0.73, 1.58, paint);              // front end above the front wheels (engine bay), under the hood
  rb(1.2, 0.3, 0.9, 0.08, 0, 0.5, 1.55, trim);                         // engine underside between the front wheels
  rb(C.W, 0.22, 0.2, 0.08, 0, 0.42, 2.0, paint);                       // front bumper
  rb(C.W - 0.04, 0.3, 0.8, 0.08, 0, 0.8, -1.62, paint);                // rear end above the rear wheels
  rb(1.2, 0.3, 0.7, 0.08, 0, 0.5, -1.62, trim);                        // boot floor between the rear wheels
  rb(C.W, 0.22, 0.2, 0.08, 0, 0.42, -2.0, paint);                      // rear bumper
  // the hood slopes from the cowl down to the nose
  b.add(quad4([[-hw + 0.04, C.COWL[1] - 0.04, C.COWL[0]], [hw - 0.04, C.COWL[1] - 0.04, C.COWL[0]], [hw - 0.06, 0.86, 2.02], [-hw + 0.06, 0.86, 2.02]]), paint);
  for (const s of [-1, 1]) b.add(quad4([[s * xs, 0.86, 2.02], [s * xs, 0.62, 2.04], [s * xs, 0.62, C.COWL[0]], [s * xs, C.COWL[1] - 0.04, C.COWL[0]]].map((p, i) => (s > 0 ? p : [p[0], p[1], p[2]]) as V3)), paint);
  rb(1.3, 0.16, 0.05, 0.03, 0, 0.66, 2.08, trim);                      // grille
  for (const s of [-1, 1]) rb(0.34, 0.1, 0.06, 0.04, s * 0.6, 0.78, 2.06, chrome);   // headlamps
  for (const s of [-1, 1]) rb(0.08, 0.16, 0.05, 0.03, s * 0.78, 0.86, -2.07, std("#b01c1c", 0.3, 0.1, { emissive: "#ff2010", emissiveIntensity: 0.15 }));
  // ---- the doors (skins + inner trim), so a card in a seat is hidden below the chest from outside ----
  for (const s of [-1, 1]) { const B0 = s < 0 ? pb : b, I0 = s < 0 ? pb : ib;   // the passenger side (-x) in its own group: hidden for a cutaway shot
    B0.add(new THREE.BoxGeometry(0.04, C.BELT - 0.34, 1.55).translate(s * xs, (C.BELT + 0.34) / 2, -0.175), paint);         // door skins, both doors (between the arches)
    B0.add(new THREE.BoxGeometry(0.03, C.BELT - 0.62, 0.7).translate(s * xs, (C.BELT + 0.62) / 2, 0.92), paint);            // front fender top
    B0.add(new THREE.BoxGeometry(0.03, 0.95 - 0.62, 1.07).translate(s * xs, (0.95 + 0.62) / 2, -1.48), paint);             // rear quarter over the arch
    rb(0.05, 0.36, 1.85, 0.02, s * (xs - 0.05), 0.62, -0.38, plastic2, I0);                                               // inner door trim
    rb(0.09, 0.05, 0.5, 0.02, s * (xs - 0.08), 0.7, 0.05, plastic, I0);                                                   // armrest
    B0.add(new THREE.BoxGeometry(0.02, 0.02, 0.18).translate(s * (xs + 0.025), C.BELT - 0.12, 0.42), chrome);             // handle
    B0.add(new THREE.BoxGeometry(0.06, 0.04, 2.1).translate(s * xs, C.BELT, -0.45), trim);                                // window sill strip
    B0.add(new THREE.BoxGeometry(0.02, 0.36, 0.9).translate(s * (xs + 0.012), 0.5, -0.05), std("#000000", 0.5, 0, { transparent: true, opacity: 0.25 }));   // door shut-line shadow
  }
  // ---- pillars and roof (a hollow glasshouse) ----
  const hdrZ = C.HEADER[0], rearZ = -1.42, tailZ = -1.98;
  for (const s of [-1, 1]) {
    b.add(slab([s * (xs - 0.02), C.COWL[1], C.COWL[0] - 0.02], [s * (xs - 0.06), C.ROOF - 0.03, hdrZ], 0.07, 0.05), paint);   // A pillar
    b.add(slab([s * (xs - 0.01), C.BELT, C.BPILLAR], [s * (xs - 0.06), C.ROOF - 0.03, C.BPILLAR], 0.09, 0.05), trim);      // B pillar
    b.add(slab([s * (xs - 0.01), 0.95, tailZ + 0.04], [s * (xs - 0.06), C.ROOF - 0.03, rearZ], 0.22, 0.05), paint);         // C pillar
  }
  rb(C.W - 0.16, 0.05, rearZ - hdrZ - 0.02 < 0 ? hdrZ - rearZ + 0.04 : 1.4, 0.02, 0, C.ROOF - 0.02, (hdrZ + rearZ) / 2, paint);   // roof skin
  ib.add(new THREE.BoxGeometry(C.W - 0.22, 0.02, hdrZ - rearZ).translate(0, C.ROOF_IN + 0.005, (hdrZ + rearZ) / 2), std("#c9c4b8", 0.95));   // headliner
  // ---- glass: windscreen, side windows, rear glass (see-through, depthWrite off) ----
  const gl = new GB();
  gl.add(quad4([[-xs + 0.07, C.COWL[1], C.COWL[0] - 0.02], [xs - 0.07, C.COWL[1], C.COWL[0] - 0.02], [xs - 0.1, C.ROOF - 0.04, hdrZ], [-xs + 0.1, C.ROOF - 0.04, hdrZ]]), glass);
  gl.add(quad4([[-xs + 0.1, C.ROOF - 0.04, rearZ], [xs - 0.1, C.ROOF - 0.04, rearZ], [xs - 0.08, 0.97, tailZ + 0.05], [-xs + 0.08, 0.97, tailZ + 0.05]]), glass);
  for (const s of [-1, 1]) {
    const fz = (y: number) => C.COWL[0] - 0.05 - ((y - C.BELT) / (C.ROOF - 0.04 - C.BELT)) * (C.COWL[0] - 0.05 - hdrZ);   // the front edge follows the A pillar
    (s < 0 ? pgl : gl).add(quad4([[s * (xs - 0.035), C.BELT + 0.02, C.BPILLAR + 0.04], [s * (xs - 0.035), C.BELT + 0.02, fz(C.BELT)], [s * (xs - 0.055), C.ROOF - 0.05, hdrZ + 0.02], [s * (xs - 0.055), C.ROOF - 0.05, C.BPILLAR + 0.04]]), glass);
    (s < 0 ? pgl : gl).add(quad4([[s * (xs - 0.035), C.BELT + 0.02, -1.36], [s * (xs - 0.035), C.BELT + 0.02, C.BPILLAR - 0.04], [s * (xs - 0.055), C.ROOF - 0.05, C.BPILLAR - 0.04], [s * (xs - 0.055), C.ROOF - 0.05, rearZ + 0.08]]), glass);
  }
  gl.build(body, false);
  const pax = new THREE.Group(); body.add(pax); pgl.build(pax, false);
  // ---- the cabin: floor, seats, dashboard, wheel, pedals, mirror ----
  ib.add(new THREE.BoxGeometry(C.W - 0.24, 0.03, 2.25).translate(0, C.FLOOR, -0.25), carpet);                              // carpet
  rb(0.22, 0.12, 1.1, 0.04, 0, C.FLOOR + 0.06, -0.15, plastic, ib);                                                         // tunnel + console, LOW (r3: level with the cushions it hid the driver's thighs in the cutaway)
  rb(0.16, 0.05, 0.3, 0.02, 0, C.FLOOR + 0.15, -0.45, plastic2, ib);                                                        // armrest lid
  const seat = (x: number, z: number, top: number, ib: GB) => {
    rb(0.5, 0.12, 2 * C.SEAT_HALF, 0.05, x, top - 0.06, z, seatM, ib);                                                     // cushion (top = seat top)
    rb(0.36, top - 0.06 - C.FLOOR, 0.34, 0.02, x, (top - 0.06 + C.FLOOR) / 2, z - 0.02, trim, ib);                        // base
    for (const s of [-1, 1]) rb(0.07, 0.1, 2 * C.SEAT_HALF - 0.04, 0.035, x + s * 0.22, top + 0.01, z, seatM2, ib);         // side bolsters
    const back = new RoundedBoxGeometry(0.5, 0.66, 0.11, 3, 0.05); back.translate(0, 0.33, 0); back.rotateX(-0.2); back.translate(x, top - 0.04, z - C.SEAT_HALF + 0.02); ib.add(back, seatM);
    const head = new RoundedBoxGeometry(0.28, 0.17, 0.09, 3, 0.04); head.translate(0, 0.78, -0.02); head.rotateX(-0.2); head.translate(x, top - 0.04, z - C.SEAT_HALF + 0.02); ib.add(head, seatM2);
  };
  seat(C.SEAT[0], C.SEAT[2], C.SEAT[1], ib); seat(C.SEAT_P[0], C.SEAT_P[2], C.SEAT_P[1], ps);
  rb(1.42, 0.12, 0.5, 0.05, 0, C.REAR[1] - 0.06, C.REAR[2], seatM, ib);                                                     // rear bench
  { const bk = new RoundedBoxGeometry(1.42, 0.56, 0.12, 3, 0.05); bk.translate(0, 0.28, 0); bk.rotateX(-0.22); bk.translate(0, C.REAR[1] - 0.04, C.REAR[2] - 0.26); ib.add(bk, seatM); }
  rb(C.W - 0.2, 0.3, 0.14, 0.04, 0, C.REAR[1] - 0.2, C.REAR[2] - 0.2, trim, ib);
  // dashboard: a padded top under the windscreen, the instrument hood over the driver, a centre screen, vents
  rb(C.W - 0.22, 0.18, C.COWL[0] - C.DASH_Z, 0.06, 0, C.DASH_TOP - 0.09, (C.COWL[0] + C.DASH_Z) / 2, plastic, ib);       // padded top (top = DASH_TOP)
  rb(C.W - 0.3, 0.2, 0.22, 0.05, 0, C.DASH_TOP - 0.26, C.DASH_Z + 0.14, plastic2, ib);                                    // lower dash (clear of the shins)
  rb(0.36, 0.07, 0.16, 0.03, C.WHEEL[0], C.DASH_TOP + 0.03, C.DASH_Z + 0.07, plastic, ib);                                  // instrument hood
  rb(0.24, 0.14, 0.03, 0.01, 0, C.DASH_TOP - 0.06, C.DASH_Z - 0.0, std("#101216", 0.3), ib);                                // screen bezel
  for (const s of [-1, 1]) rb(0.12, 0.04, 0.02, 0.01, s * 0.62, C.DASH_TOP - 0.04, C.DASH_Z - 0.005, trim, ib);             // vents
  // steering column + wheel (a group so it can turn)
  const col = slab([C.WHEEL[0], C.DASH_TOP - 0.1, C.DASH_Z + 0.04], C.WHEEL, 0.06, 0.06); ib.add(col, plastic);
  ib.build(body); b.build(body); pb.build(pax); ps.build(pax);
  const wheelG = new THREE.Group(); wheelG.position.set(...C.WHEEL); wheelG.rotation.x = -C.WHEEL_TILT; body.add(wheelG);
  { const wb = new GB(); wb.add(new THREE.TorusGeometry(C.WHEEL_R, 0.022, 10, 36), plastic); wb.add(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20).rotateX(Math.PI / 2), plastic2);
    for (const a of [Math.PI / 2, -Math.PI / 6, Math.PI + Math.PI / 6]) wb.add(new THREE.BoxGeometry(C.WHEEL_R, 0.03, 0.02).translate(C.WHEEL_R / 2, 0, 0).rotateZ(a), plastic2);
    wb.build(wheelG); }
  // gauges and the centre screen glow (unlit faces toward the driver)
  const gaugeM = new THREE.MeshBasicMaterial({ color: "#7fe0ff" }), screenM = new THREE.MeshBasicMaterial({ color: "#3a7fd8" });
  for (const dx of [-0.08, 0.08]) { const m = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.045, 24), gaugeM); m.position.set(C.WHEEL[0] + dx, C.DASH_TOP - 0.03, C.DASH_Z - 0.003); m.rotation.y = Math.PI; body.add(m); }
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), screenM); m.position.set(0, C.DASH_TOP - 0.06, C.DASH_Z - 0.02); m.rotation.y = Math.PI; body.add(m); }
  // pedals (brake + accelerator) in the footwell
  for (const [dx, h] of [[0, 0.1], [0.14, 0.13]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.02), chrome); m.position.set(C.PEDAL[0] + dx, C.PEDAL[1], C.PEDAL[2]); m.rotation.x = -0.5; body.add(m); }
  // rear-view mirror and a hanging air freshener (it swings)
  { const m = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.07, 0.03, 2, 0.015), plastic); m.position.set(0, 1.42, 0.3); body.add(m); }
  const fresh = new THREE.Group(); fresh.position.set(0, 1.38, 0.31); body.add(fresh);
  { const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), trim); str.position.y = -0.06; fresh.add(str);
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 3), std("#2fa84a", 0.8)); tree.position.y = -0.15; fresh.add(tree); }
  // wheels
  const spin: THREE.Group[] = [], steerG: THREE.Group[] = [], tyre = std("#1d1d20", 0.9), rim = std("#c4c8cf", 0.25, 0.9);
  for (const [x, z] of [[0.76, C.AXLE], [-0.76, C.AXLE], [0.76, -C.AXLE], [-0.76, -C.AXLE]] as [number, number][]) {
    const h = new THREE.Group(); h.position.set(x, C.R, z); g.add(h); const w = new THREE.Group(); h.add(w); const wb = new GB();
    wb.add(new THREE.TorusGeometry(C.R - 0.08, 0.085, 12, 30).rotateY(Math.PI / 2).scale(1.25, 1, 1), tyre);
    wb.add(new THREE.CylinderGeometry(C.R - 0.1, C.R - 0.1, 0.2, 26).rotateZ(Math.PI / 2), rim);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; wb.add(new THREE.BoxGeometry(0.22, 0.04, 0.03).translate(0, Math.cos(a) * 0.11, Math.sin(a) * 0.11), trim); }
    wb.build(w); spin.push(w); if (z > 0) steerG.push(h);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(C.R + 0.05, 0.05, 6, 18, Math.PI).rotateY(Math.PI / 2), trim); arch.position.set(x * 1.13, C.R + 0.02, z); g.add(arch);
  }
  return {
    g,
    set: ({ dist = 0, t = 0, bob = 0, steer = 0, brake = 0, cut = 0 }) => {
      pax.visible = cut < 0.5;   // cutaway: the passenger door, its glass and the passenger seat go, for a profile shot of the driver from inside
      spin.forEach((w) => { w.rotation.x = dist / C.R; }); steerG.forEach((h) => { h.rotation.y = steer * 0.42; });
      wheelG.rotation.set(-C.WHEEL_TILT, 0, 0); wheelG.rotateZ(-steer * 1.6);
      body.position.y = bob * (0.01 * Math.sin(t * 7.3) + 0.006 * Math.sin(t * 13.1 + 1)) - brake * 0.02; body.rotation.x = bob * 0.005 * Math.sin(t * 4.1) + brake * 0.018;
      fresh.rotation.z = 0.12 * Math.sin(t * 2.1) + bob * 0.2 * Math.sin(t * 5.3); fresh.rotation.x = 0.06 * Math.sin(t * 1.7 + 1) - brake * 0.3;
    },
  };
};
