// TODAY: A WILDFIRE BACKBURN at golden dusk ("They Blew Up Houses to Stop a Fire", scene 9). Rolling dry golden grass,
// a dirt FIRE ROAD running along x (z -1..1), pines dotted over the hills, the WILDFIRE on the ridge behind the road
// (north, z -18..-30) as a long wall of flame under a towering smoke column, the firefighter's BACKBURN line lit along the
// road's north verge, a red fire engine (invented "COUNTY FIRE 7"), a yellow tape barrier on the south side where the
// onlooker stands, traffic cones, a road sign. Controls: c.burnTo = x up to which the backburn line is lit (it grows as
// the drip torch walks), c.wild 0..1 the wildfire, c.meet 0..1 the backburn and the wildfire meet and both shrink,
// c.wind 0..1 smoke lean.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rng, rep, grassHD, planksHD } from "../paint";
import { glow } from "../setkit";
import { NOINK } from "../ink";
import { flameSprite, flameSet, smokeSprite, smokeSet, embers } from "./firekit";
import type { SetBuilder, V3 } from "./types";

const SANS = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';
const cl = (x: number) => Math.max(0, Math.min(1, x));
const hillY = (x: number, z: number) => (z < -3 ? Math.min(9, ((-z - 3) / 16) ** 1.6 * 6) * (0.85 + 0.15 * Math.sin(x * 0.07)) : z > 3 ? ((z - 3) / 30) * 1.2 : 0);

export const ridge: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  // terrain: one displaced plane of dry golden grass
  const geo = new THREE.PlaneGeometry(160, 120, 80, 60).rotateX(-Math.PI / 2);
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, hillY(p.getX(i), p.getZ(i) - 20));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, lam("rgGrass", () => ({ map: rep(grassHD(), 30, 22), color: "#f0cf86", emissive: "#4a3414" })));
  ground.receiveShadow = true; ground.position.z = -20; root.add(ground);
  // the fire road (packed dirt) + ruts
  b.add(boxGeo(V(-80, -0.04, -1.3), V(80, 0.03, 1.3)), lam("rgRoad", () => ({ map: rep(grassHD(), 40, 1), color: "#b48a62" })));
  for (const z of [-0.55, 0.55]) b.add(boxGeo(V(-80, 0.03, z - 0.12), V(80, 0.04, z + 0.12)), lam("rgRut", () => ({ color: "#94704e" })));
  // the burnt strip north of the road (the backburn eats it): dark char that grows with c.burnTo
  const charM = new THREE.MeshLambertMaterial({ color: "#2e2426" });
  const charStrip = new THREE.Mesh(new THREE.PlaneGeometry(1, 5.2).rotateX(-Math.PI / 2).translate(0.5, 0.05, -4.1), charM); charStrip.receiveShadow = true; root.add(charStrip);
  // pines
  const pineM = lam("rgPine", () => ({ color: "#3e6a4a" })), pineD = lam("rgPineD", () => ({ color: "#2e5240" })), trunk = lam("rgTrunk", () => ({ color: "#6a4430" }));
  const pine = (x: number, z: number, h: number) => {
    const y = hillY(x, z - 0 + 20 - 20);
    b.add(new THREE.CylinderGeometry(0.12 * h / 6, 0.18 * h / 6, h * 0.3, 6).translate(x, y + h * 0.15, z), trunk);
    for (let k = 0; k < 3; k++) b.add(new THREE.ConeGeometry(h * (0.3 - k * 0.07), h * 0.42, 8).translate(x, y + h * (0.32 + k * 0.2), z), k % 2 ? pineD : pineM);
  };
  const r = rng(9);
  for (let k = 0; k < 70; k++) { const x = -70 + r() * 140, z = -6 - r() * 40; if (Math.abs(z + 4) < 2) continue; pine(x, z, 4 + r() * 5); }
  for (let k = 0; k < 24; k++) { const x = -70 + r() * 140, z = 6 + r() * 30; pine(x, z, 4 + r() * 4); }
  // fire engine on the road (south lane), invented livery
  const red = lam("rgRed", () => ({ color: "#c8352e" })), chrome = lam("rgChrome", () => ({ color: "#d8dde4" })), dark = lam("rgDark", () => ({ color: "#2a2e36" }));
  const TX = 9.5;
  b.add(boxGeo(V(TX - 4, 0.7, 0.5), V(TX + 2.4, 3.1, 2.9)), red); b.add(boxGeo(V(TX + 2.4, 0.7, 0.5), V(TX + 4.6, 2.7, 2.9)), red);
  b.add(boxGeo(V(TX + 2.6, 1.7, 0.48), V(TX + 4.4, 2.5, 2.92)), lam("rgGlass", () => ({ color: "#7aa8c8" })));
  b.add(boxGeo(V(TX - 4, 3.1, 0.7), V(TX + 2.2, 3.3, 2.7)), chrome); b.add(boxGeo(V(TX - 4.2, 0.6, 0.45), V(TX + 4.7, 0.75, 2.95)), dark);
  for (const x of [TX - 2.8, TX - 1.3, TX + 3.4]) for (const z of [0.45, 2.95]) b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16).rotateX(Math.PI / 2).translate(x, 0.55, z), dark);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.7), new THREE.MeshLambertMaterial({ map: ctex("rgLabel", 512, 100, (g) => { g.fillStyle = "#c8352e"; g.fillRect(0, 0, 512, 100); g.fillStyle = "#f4f1ea"; g.font = `900 64px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("COUNTY FIRE 7", 256, 52); }) }));
  lbl.position.set(TX - 0.8, 2.1, 0.47); lbl.rotation.y = Math.PI; root.add(lbl);
  const beacons = [glow(root, [TX + 3.2, 2.85, 1.0], "#ff3a2a", 1.0, 0.8), glow(root, [TX + 3.2, 2.85, 2.4], "#3a7aff", 1.0, 0.8)];
  // yellow tape barrier on posts (south verge) + cones + sign
  const post = lam("rgPost", () => ({ color: "#e8e2d6" }));
  for (let k = 0; k < 8; k++) b.add(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6).translate(-9 + k * 2.4, 0.55, 2.2), post);
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(16.8, 0.12), new THREE.MeshBasicMaterial({ map: ctex("rgTape", 512, 32, (g) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, 512, 32); g.fillStyle = "#1a1a1a"; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 24, 0); g.lineTo(x + 8, 32); g.lineTo(x - 16, 32); g.fill(); } }), side: THREE.DoubleSide }));
  tape.position.set(-0.6, 1.0, 2.2); root.add(tape);
  const cone = lam("rgCone", () => ({ color: "#ff7a2a" }));
  for (const x of [-11, -6.5, 4.5]) b.add(new THREE.ConeGeometry(0.2, 0.55, 10).translate(x, 0.28, 1.6), cone);
  b.add(boxGeo(V(-13.05, 0, 2.6), V(-12.95, 2.0, 2.7)), post);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshLambertMaterial({ map: ctex("rgSign", 320, 200, (g) => { g.fillStyle = "#e86a2a"; g.fillRect(0, 0, 320, 200); g.strokeStyle = "#1a1a1a"; g.lineWidth = 10; g.strokeRect(8, 8, 304, 184); g.fillStyle = "#1a1a1a"; g.font = `900 52px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FIRE", 160, 70); g.fillText("CREW AHEAD", 160, 136); }) }));
  sg.position.set(-13, 2.3, 2.68); root.add(sg);
  b.build(root);
  // the wildfire wall on the ridge + smoke column
  const wild: THREE.Sprite[] = [];
  for (let k = 0; k < 40; k++) { const x = -60 + k * 3.1, z = -20 - (k % 3) * 2.4; wild.push(flameSprite(root, [x, hillY(x, z) - 0.2, z], 5.5 + (k % 4), 200 + k)); }
  const wildSmoke = Array.from({ length: 12 }, (_, k) => smokeSprite(root, [-50 + k * 9, hillY(0, -24) + 4, -26], 16, k, 34));
  // the backburn line along the north verge (z -2.2 .. -6), lit up to c.burnTo
  const bb: { s: THREE.Sprite; x: number; z: number }[] = [];
  for (let k = 0; k < 44; k++) { const x = -22 + k * 0.85, z = -2.1 - (k % 3) * 0.9 - (k % 2) * 0.4; bb.push({ s: flameSprite(root, [x, 0.05, z], 1.4 + (k % 3) * 0.35, 300 + k), x, z }); }
  const bbSmoke = Array.from({ length: 10 }, (_, k) => ({ m: smokeSprite(root, [-20 + k * 4, 1.2, -4], 4, k, 12), x: -20 + k * 4 }));
  const em = embers(root, 160);
  const lights = [0, 1, 2].map((k) => { const l = new THREE.PointLight("#ff8a3a", 0, 20, 1.4); l.position.set(-8 + k * 8, 3, -4); root.add(l); return l; });
  const marks: Record<string, V3> = { ff: [-3.0, 0, -1.4], ffEnd: [6.0, 0, -1.4], onlooker: [1.2, 0, 3.0], onlooker2: [-2.6, 0, 3.3], crew2: [12.5, 0, -0.6] };
  const cams = { main: { pos: [-6, 1.8, 7] as V3, look: [0, 1.5, -2] as V3, fov: 46 } };
  return {
    name: "ridge", root, marks, cams,
    pose: (t, c) => {
      const frame = Math.round(t * 30), to = c.burnTo ?? -99, wildK = cl(c.wild ?? 1), meet = cl(c.meet ?? 0), wind = c.wind ?? 0.5;
      wild.forEach((s, k) => flameSet(s, frame + k * 3, wildK * (1 - 0.75 * meet) * (0.8 + 0.2 * Math.sin(k))));
      wildSmoke.forEach((m) => smokeSet(m, t, wildK, -0.6 * wind, 0.05));
      for (const f of bb) flameSet(f.s, frame + f.x * 7, f.x <= to ? cl((to - f.x) / 1.2) * (1 - 0.8 * meet) : 0);
      for (const s of bbSmoke) smokeSet(s.m, t, s.x <= to ? 0.8 : 0, -0.4 * wind, 0.12);
      const len = Math.max(0, to + 22); charStrip.visible = len > 0.1; charStrip.scale.set(len, 1, 1); charStrip.position.x = -22;
      em.set(t, (i, rr) => (rr < 0.6 ? [-60 + rr * 200, hillY(0, -22) + 2, -22] : to > -22 ? [-22 + rr * Math.max(0, to + 22), 0.6, -3] : null), -1.2 * wind, 0.7 * wildK);
      lights.forEach((l, k) => { l.intensity = (to > -8 + k * 8 ? 10 : 2) * (1 - 0.6 * meet) * (0.9 + 0.1 * Math.sin(t * 11 + k)); });
      beacons.forEach((g, k) => ((g.material as THREE.SpriteMaterial).opacity = Math.sin(t * 6 + k * Math.PI) > 0 ? 0.9 : 0.15));
      void NOINK; void planksHD;
    },
  };
};
