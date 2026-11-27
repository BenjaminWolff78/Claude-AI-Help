// 1960s crawler bulldozer ("TERRA KING D-9", invented): school-bus yellow, worn and dented, a long engine hood with a
// radiator grille, a tall exhaust stack with a rain cap, an open operator seat under a steel canopy, two crawler tracks
// (pads that really run around the loop), a curved dozer blade on push arms with a hydraulic ram each side, a rear ripper.
// Reusable: import { dozer } from "./dozer".
//
// Local frame: forward = +z, ground y = 0 (track pads touch it), origin between the tracks under the seat.
// Length 6.3 m over blade + ripper (z -2.9..3.4), width 3.9 m over the blade (tracks 3.0 m), canopy top 3.25 m.
// API: const dz = dozer(parent);
//      dz.g       group: place + yaw it (local +z -> travel)
//      dz.set({ dist, t, blade, rumble })
//        dist    metres driven (pads run around the loop, sprockets turn)
//        blade   0..1 blade height (0 = cutting edge 0.12 m below the track line: biting the sand; 1 = raised 1.0 m)
//        rumble  0..1 engine shake (0.3 idle, 1 working)
//      dz.BLADE (local point mid cutting edge at blade 0), dz.EXHAUST (local top of the stack, for smoke puffs),
//      dz.SEAT (seat-top mark for the operator card, mode "sit"), dz.length
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V } from "../build";
import { ctex } from "../paint";
import { mat, col, shiny, rodGeo, TAU, cl, SANS } from "./desertkit";
import { fitText } from "./portkit_common";
import { twoTone } from "../shade";
import type { V3 } from "./types";

const yellowTex = () => ctex("dzYellow", 512, 512, (g, r) => {
  g.fillStyle = "#f2b824"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(255,226,120,0.35)" : "rgba(200,130,40,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  // scuffs, chips to grey primer, dust at the bottom, a dent ring
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,110,120,0.55)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 7, 1 + r() * 3, r() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = "rgba(130,80,40,0.4)"; g.lineWidth = 1.5; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 40, y + (r() - 0.5) * 10); g.stroke(); }
  const gr = g.createLinearGradient(0, 330, 0, 512); gr.addColorStop(0, "rgba(206,140,100,0)"); gr.addColorStop(1, "rgba(206,140,100,0.55)"); g.fillStyle = gr; g.fillRect(0, 330, 512, 182);
  for (let i = 0; i < 6; i++) { const x = r() * 512, y = r() * 300; g.strokeStyle = "rgba(160,110,30,0.4)"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 10 + r() * 14, 0, TAU); g.stroke(); }
});
const decalTex = () => ctex("dzDecal", 512, 128, (g) => {
  g.clearRect(0, 0, 512, 128); g.fillStyle = "#2e2a34"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "TERRA KING", 256, 52, 470, 70, SANS);
  g.fillRect(40, 96, 432, 8); g.font = "900 24px Arial"; g.fillText("D-9  DIESEL", 256, 116);
});
const grilleTex = () => ctex("dzGrille", 256, 256, (g) => { g.fillStyle = "#2e2a34"; g.fillRect(0, 0, 256, 256); for (let y = 8; y < 256; y += 16) { g.fillStyle = "#4a4452"; g.fillRect(8, y, 240, 8); g.fillStyle = "#6a6474"; g.fillRect(8, y, 240, 2); } g.strokeStyle = "#f2b824"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246); });
const padTex = () => ctex("dzPad", 64, 64, (g) => { g.fillStyle = "#4a4452"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#6e6878"; g.fillRect(0, 22, 64, 14); g.fillStyle = "rgba(210,150,110,0.45)"; g.fillRect(0, 44, 64, 20); });

export type Dozer = { g: THREE.Group; set: (o: { dist?: number; t?: number; blade?: number; rumble?: number }) => void; BLADE: V3; EXHAUST: V3; SEAT: V3; length: number };

export const dozer = (parent: THREE.Object3D): Dozer => {
  const g = new THREE.Group(); parent.add(g);
  const body = new THREE.Group(); g.add(body);
  const Y = mat("dzYellowM", () => twoTone(new THREE.MeshPhongMaterial({ map: yellowTex(), specular: "#fff0c0", shininess: 30 })));
  const steel = col("#4a4452"), dark = col("#2e2a34"), iron = shiny("dzIron", "#8a8696", 60);
  const b = new Batch();
  const rbox = (w: number, h: number, d: number, r: number, x: number, y: number, z: number, m: THREE.Material) => b.add(new RoundedBoxGeometry(w, h, d, 2, r).translate(x, y, z), m);
  // ---- track frames (static part: road wheels, idler, raised sprocket, frame) ----
  const TXS = 1.18, TW = 0.62, ZB = -1.85, ZF = 1.75, RT = 0.48;
  for (const s of [-1, 1]) {
    const x = s * TXS;
    rbox(TW * 0.7, 0.5, ZF - ZB, 0.12, x, 0.55, (ZF + ZB) / 2, Y);
    for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.19, 0.19, TW * 0.8, 14).rotateZ(Math.PI / 2).translate(x, 0.27, ZB + 0.35 + k * 0.62), steel);
    b.add(new THREE.CylinderGeometry(RT - 0.06, RT - 0.06, TW * 0.82, 18).rotateZ(Math.PI / 2).translate(x, RT, ZF), steel);
    b.add(new THREE.CylinderGeometry(0.09, 0.09, TW * 0.86, 10).rotateZ(Math.PI / 2).translate(x, RT, ZF), Y);
    b.add(new THREE.CylinderGeometry(0.1, 0.1, TW * 0.9, 10).rotateZ(Math.PI / 2).translate(x, RT, ZB), Y);
  }
  b.build(g);
  // ---- body (shakes) ----
  // main frame + belly, engine hood with louvres, radiator + grille, fuel tank, seat deck
  rbox(1.9, 0.5, 4.0, 0.1, 0, 0.95, -0.05, Y);
  rbox(1.55, 1.05, 2.3, 0.14, 0, 1.68, 0.95, Y);
  rbox(1.62, 0.07, 2.35, 0.03, 0, 2.22, 0.95, Y);
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.02, 0.5, 0.12).translate(s * 0.785, 1.72, 0.25 + k * 0.22), dark);
  rbox(1.6, 1.25, 0.35, 0.08, 0, 1.6, 2.2, Y);
  b.add(new THREE.PlaneGeometry(1.25, 0.95).translate(0, 1.62, 2.38), mat("dzGrilleM", () => twoTone(new THREE.MeshLambertMaterial({ map: grilleTex() }))));
  rbox(1.7, 0.9, 0.8, 0.12, 0, 1.55, -1.55, Y);                 // fuel tank behind the seat
  rbox(1.9, 0.08, 1.5, 0.03, 0, 1.24, -0.45, col("#3a3640"));    // operator deck
  // seat + backrest, levers, steering clutch handles, decal panels
  rbox(0.62, 0.14, 0.55, 0.05, 0, 1.55, -0.55, col("#3a3640")); rbox(0.62, 0.5, 0.12, 0.05, 0, 1.85, -0.85, col("#3a3640"));
  for (const x of [-0.34, -0.14, 0.14, 0.34]) b.add(rodGeo([x, 1.28, 0.05], [x * 1.1, 1.95, -0.05], 0.018), dark);
  for (const x of [-0.34, -0.14, 0.14, 0.34]) b.add(new THREE.SphereGeometry(0.04, 8, 6).translate(x * 1.1, 1.97, -0.05), col("#c8352e"));
  for (const s of [-1, 1]) b.add(new THREE.PlaneGeometry(1.5, 0.38).rotateY(s * Math.PI / 2).translate(s * 0.79, 1.7, 0.95), mat("dzDecalM", () => twoTone(new THREE.MeshLambertMaterial({ map: decalTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }))));
  // exhaust stack (rain cap) + air precleaner bowl
  b.add(new THREE.CylinderGeometry(0.085, 0.1, 1.15, 10).translate(-0.45, 2.75, 1.45), dark);
  b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 10).translate(-0.45, 3.34, 1.45), dark);
  b.add(new THREE.CylinderGeometry(0.11, 0.09, 0.4, 10).translate(0.45, 2.42, 1.65), Y);
  b.add(new THREE.SphereGeometry(0.16, 10, 6, 0, TAU, 0, Math.PI / 2).translate(0.45, 2.62, 1.65), shiny("dzBowl", "#d8d6e0", 80));
  // canopy (ROPS): four posts + a roof sheet
  for (const [x, z] of [[-0.88, -1.15], [0.88, -1.15], [-0.88, 0.15], [0.88, 0.15]]) b.add(new THREE.BoxGeometry(0.09, 1.95, 0.09).translate(x, 2.2, z), Y);
  rbox(1.95, 0.08, 1.5, 0.03, 0, 3.2, -0.5, Y);
  b.add(new THREE.BoxGeometry(1.86, 0.04, 0.05).translate(0, 3.12, 0.22), dark);
  // rear ripper (shank + tooth)
  b.add(boxGeo(V(-0.9, 0.8, -2.25), V(0.9, 1.1, -2.0)), Y);
  b.add(boxGeo(V(-0.08, 0.15, -2.6), V(0.08, 1.05, -2.35)), steel);
  b.add(new THREE.ConeGeometry(0.1, 0.3, 4).rotateX(Math.PI).translate(0, 0.05, -2.48), iron);
  // headlamps on the hood corners
  for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 10).rotateX(Math.PI / 2).translate(s * 0.6, 2.38, 2.25), dark); b.add(new THREE.CircleGeometry(0.075, 12).translate(s * 0.6, 2.38, 2.325), mat("dzLamp", () => new THREE.MeshBasicMaterial({ color: "#fff4d8" }))); }
  b.build(body);
  body.traverse((m) => { (m as THREE.Mesh).castShadow = true; m.receiveShadow = true; });
  // ---- blade on push arms (pivot on the track frames, mid-length) ----
  const arm = new THREE.Group(); arm.position.set(0, 0.62, -0.3); g.add(arm);
  { const ab = new Batch();
    for (const s of [-1, 1]) ab.add(beamBox(V(s * 1.58, 0, 0), V(s * 1.58, -0.12, 2.95), 0.16, 0.22), Y);
    // curved moldboard: a cylinder segment, concave toward +z
    const mb = new THREE.CylinderGeometry(0.9, 0.9, 3.9, 16, 1, true, -Math.PI * 0.26, Math.PI * 0.62); mb.rotateZ(Math.PI / 2); mb.rotateY(Math.PI);
    mb.translate(0, 0.1, 3.85); ab.add(mb, mat("dzBladeM", () => twoTone(new THREE.MeshPhongMaterial({ map: yellowTex(), specular: "#fff0c0", shininess: 30, side: THREE.DoubleSide }))));
    ab.add(boxGeo(V(-1.95, -0.62, 3.2), V(1.95, -0.47, 3.4)), iron);         // cutting edge
    for (const s of [-1, 1]) ab.add(boxGeo(V(s * 1.95 - 0.06, -0.62, 2.75), V(s * 1.95 + 0.06, 1.15, 3.38)), Y); // end bits
    ab.add(boxGeo(V(-1.9, 0.86, 3.3), V(1.9, 0.98, 3.52)), Y);
    for (let k = -3; k <= 3; k++) ab.add(boxGeo(V(k * 0.5 - 0.05, -0.4, 2.8), V(k * 0.5 + 0.05, 0.85, 2.96)), Y); // ribs on the back
    ab.build(arm); arm.traverse((m) => { (m as THREE.Mesh).castShadow = true; }); }
  // hydraulic lift rams (cylinder from the hood side to the blade top): rebuilt each set()
  const ramM = shiny("dzRam", "#c8c6d4", 90), rams = [-1, 1].map((s) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 8), ramM); m.castShadow = true; g.add(m); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 8), Y); c.castShadow = true; g.add(c); return { s, m, c }; });
  // ---- track pads that run around the loop ----
  const padM = mat("dzPadM", () => twoTone(new THREE.MeshLambertMaterial({ map: padTex() })));
  const loopLen = 2 * (ZF - ZB) + TAU * RT, NP = 34, pitch = loopLen / NP;
  const padGeo = new THREE.BoxGeometry(TW, 0.08, pitch * 0.86);
  const pads = [-1, 1].map((s) => Array.from({ length: NP }, () => { const m = new THREE.Mesh(padGeo, padM); m.castShadow = true; m.receiveShadow = true; m.position.x = s * TXS; g.add(m); return m; }));
  const loopAt = (u: number, m: THREE.Mesh) => {
    let d = ((u % loopLen) + loopLen) % loopLen; const L = ZF - ZB;
    if (d < L) { m.position.y = 0.04; m.position.z = ZB + d; m.rotation.x = 0; return; }                // bottom run, forward
    d -= L; if (d < Math.PI * RT) { const a = d / RT; m.position.y = RT - Math.cos(a) * (RT - 0.04); m.position.z = ZF + Math.sin(a) * (RT - 0.04); m.rotation.x = -a; return; }
    d -= Math.PI * RT; if (d < L) { m.position.y = 2 * RT - 0.04; m.position.z = ZF - d; m.rotation.x = Math.PI; return; }  // top run, back
    d -= L; const a = d / RT; m.position.y = RT + Math.cos(a) * (RT - 0.04); m.position.z = ZB - Math.sin(a) * (RT - 0.04); m.rotation.x = Math.PI - a;
  };
  const Pa = new THREE.Vector3(), Pb = new THREE.Vector3();
  return {
    g, length: 6.3, BLADE: [0, -0.1, 3.3], EXHAUST: [-0.45, 3.4, 1.45], SEAT: [0, 1.62, -0.55],
    set: ({ dist = 0, t = 0, blade = 0, rumble = 0.3 }) => {
      // the pads stay put on the ground while the machine moves: they run backwards relative to the body
      pads.forEach((row) => row.forEach((m, i) => loopAt(i * pitch - dist, m)));
      const k = cl(rumble);
      body.position.y = k * 0.012 * Math.sin(t * 31) + k * 0.006 * Math.sin(t * 17 + 1); body.rotation.x = k * 0.004 * Math.sin(t * 9);
      // blade: arms rotate about the pivot; blade 0 -> cutting edge just under the ground
      arm.rotation.x = 0.03 - 0.34 * cl(blade);
      // rams from the hood side (0, 2.0, 1.6) to the blade top back
      for (const r of rams) {
        Pa.set(r.s * 0.95, 1.95, 1.7);
        Pb.set(r.s * 1.2, 0.8, 2.85).applyEuler(arm.rotation).add(arm.position);
        const len = Pa.distanceTo(Pb), mid = Pa.clone().add(Pb).multiplyScalar(0.5), dir = Pb.clone().sub(Pa).normalize();
        r.m.scale.set(1, len, 1); r.m.position.copy(mid); r.m.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
        r.c.position.copy(Pa.clone().addScaledVector(dir, 0.4)); r.c.quaternion.copy(r.m.quaternion);
      }
    },
  };
};
/** a box beam from a to b (w x h section) */
const beamBox = (a: THREE.Vector3, c: THREE.Vector3, w: number, h: number) => {
  const len = a.distanceTo(c), geo = new THREE.BoxGeometry(w, h, len);
  geo.applyMatrix4(new THREE.Matrix4().lookAt(a, c, V(0, 1, 0))); const mid = a.clone().add(c).multiplyScalar(0.5); return geo.translate(mid.x, mid.y, mid.z);
};
