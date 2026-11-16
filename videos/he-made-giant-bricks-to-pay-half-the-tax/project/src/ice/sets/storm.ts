// The North Atlantic at night in a gale: an overloaded coffin ship (the PROSPERITY's twin, decks piled with cargo)
// wallowing in big seas, rain driving across, lightning, and a lifeboat with three sailors pulling away. Waves are a
// displaced PBR ocean (CPU sum of swells, crest foam in the vertex colours). Story controls: sink (0 afloat .. 1 decks
// awash .. 2.4 gone, bow first), flash (lightning 0..1), boatX (lifeboat pull-away 0..1), spray.
import * as THREE from "three";
import { V, lam } from "../build";
import { ctex, rng } from "../paint";
import { NOINK } from "../ink";
import { brig, crate, mist, rod } from "../setkit";
import { Batch } from "../build";
import type { SetDef, V3 } from "./types";

const SW: [number, number, number, number, number][] = [ // dirX, dirZ, wavelength, amplitude, speed
  [1, 0.3, 26, 0.85, 1.0], [0.7, -0.7, 15, 0.45, 1.25], [0.2, 1, 9, 0.22, 1.6], [-0.6, 0.8, 5.5, 0.1, 2.1], [0.9, -0.2, 3.4, 0.05, 2.6],
];
/** sea surface height at (x, z, t) */
export const seaH = (x: number, z: number, t: number) => {
  let h = 0;
  for (const [dx, dz, L, A, sp] of SW) { const n = Math.hypot(dx, dz), k = (Math.PI * 2) / L; h += A * Math.sin(k * ((dx * x + dz * z) / n) - sp * t * Math.sqrt(9.8 * k) * 0.35); }
  return h;
};
/** where the lifeboat is (set-local) at time t for pull-away u (0..1) */
export const boatAt = (t: number, u: number): V3 => { const x = -3.2 - 5.5 * u, z = 3.4 + 1.8 * u; return [x, seaH(x, z, t) - 0.05, z]; };

export const storm = (): SetDef => {
  const root = new THREE.Group();
  // ---- ocean ----
  const N = 150, S = 260;
  const og = new THREE.PlaneGeometry(S, S, N, N).rotateX(-Math.PI / 2);
  const pos = og.attributes.position as THREE.BufferAttribute, base = Float32Array.from(pos.array as Float32Array);
  const col = new Float32Array(pos.count * 3); og.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const foamT = ctex("seaFoamStreaks", 512, 512, (g, r) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.18})`; g.lineWidth = 1 + r() * 3; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.bezierCurveTo(x + 20, y + (r() - 0.5) * 12, x + 40, y + (r() - 0.5) * 12, x + 60 + r() * 60, y); g.stroke(); }
  });
  foamT.repeat.set(26, 26);
  const om = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, map: foamT, roughness: 0.22, metalness: 0.05 });
  const ocean = new THREE.Mesh(og, om); ocean.receiveShadow = true; root.add(ocean);
  // ---- the ship, loaded to the gunwales ----
  const ship = brig(root, "", { hull: "#4a6a5c", trim: "#c9a646", sails: "furled", flag: "red" });
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 3.6, 20), lam("funnelBlack", () => ({ color: "#222428" }))); fun.position.set(0.4, ship.deckY + 1.8, 0); ship.g.add(fun);
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.42, 20), lam("funnelBand", () => ({ color: "#b5342c" }))); fb.position.set(0.4, ship.deckY + 3.2, 0); ship.g.add(fb);
  const cb = new Batch();
  for (const lay of [0, 1, 2]) for (const x of [3.6, 2.6, -0.8, -1.9, -3.0]) for (const z of [-0.75, 0.75]) crate(cb, ship.g, [x + (lay % 2) * 0.15, ship.deckY + 0.06 + lay * 0.82, z], 0.8, undefined, ((x * 7 + z) % 0.4) - 0.2);
  cb.build(ship.g);
  // a lantern swinging in the rigging (warm light against the blue night)
  const lan = new THREE.PointLight("#ffb45a", 6, 9, 1.6); lan.position.set(-3.6, ship.deckY + 2.3, 0); ship.g.add(lan);
  const lanG = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb45a").multiplyScalar(3) })); lanG.position.copy(lan.position); lanG.layers.set(NOINK); ship.g.add(lanG);
  // ---- the lifeboat ----
  const boat = new THREE.Group(); root.add(boat);
  const bm = lam("lifeboat", () => ({ color: "#e9e2d2" })), bt = lam("lifeboatTrim", () => ({ color: "#b5342c" }));
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.2, 16, 1, false, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), bm); hull.scale.set(1, 0.55, 1); hull.castShadow = true; boat.add(hull);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.62), bt); trim.position.y = 0.0; boat.add(trim);
  for (const sx of [-0.7, 0.2, 1.0]) { const th = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 1.5), lam("thwart", () => ({ color: "#8a6a48" }))); th.position.set(sx, -0.15, 0); boat.add(th); }
  const oars = [-1, 1].map((s) => { const o = new THREE.Group(); o.position.set(0.2, 0.05, s * 0.8); boat.add(o); rod(o, [0, 0, 0], [0, -0.6, s * 1.6], 0.025, lam("oar", () => ({ color: "#c9a274" }))); return o; });
  // ---- rain (driving streaks), spray, the lightning bolt ----
  const R = rng(11), NR = 1600, rp = new Float32Array(NR * 6), rs = new Float32Array(NR);
  for (let i = 0; i < NR; i++) { rs[i] = R(); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: "#a8bcd8", transparent: true, opacity: 0.45, depthWrite: false })); rain.layers.set(NOINK); rain.frustumCulled = false; root.add(rain);
  const spray = [0, 1, 2, 3].map(() => mist(root, [0, 0, 0], 2.2, "#d6e4f0", 0.0));
  const boltT = ctex("bolt", 256, 1024, (g, r) => {
    g.strokeStyle = "rgba(255,255,255,1)"; g.shadowColor = "#bcd4ff"; g.shadowBlur = 28; g.lineWidth = 7; g.lineJoin = "round";
    let x = 128, y = 0; g.beginPath(); g.moveTo(x, y); while (y < 1024) { x += (r() - 0.5) * 90; y += 40 + r() * 50; g.lineTo(Math.max(20, Math.min(236, x)), y); } g.stroke();
  });
  const bolt = new THREE.Mesh(new THREE.PlaneGeometry(9, 36), new THREE.MeshBasicMaterial({ map: boltT, color: new THREE.Color(4, 4.4, 5.2), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  bolt.position.set(48, 17, -38); bolt.lookAt(-13, 3, 10); bolt.layers.set(NOINK); root.add(bolt);
  const flashL = new THREE.DirectionalLight("#dbe6ff", 0); flashL.position.set(40, 50, -40); root.add(flashL);

  const marks: Record<string, V3> = { boat: [-3.2, 0, 3.4] };
  const cams = {
    wide: { pos: [-11, 3.2, 13] as V3, look: [0, 1.0, 0] as V3, fov: 44 },
    deck: { pos: [-6.5, 2.4, 6.0] as V3, look: [-1.0, 1.2, 0.5] as V3, fov: 46 },
  };
  const tmp = new THREE.Vector3();
  return {
    name: "storm", root, marks, cams,
    pose: (t, c) => {
      // ocean surface + crest foam colours
      const a = pos.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2], h = seaH(x, z, t); a[i * 3 + 1] = h;
        const f = Math.max(0, Math.min(1, (h - 0.55) / 0.6)), d = 0.24 + 0.09 * Math.max(-1, Math.min(1, h));
        col[i * 3] = d * 0.62 + f * 0.85; col[i * 3 + 1] = d * 1.2 + f * 0.85; col[i * 3 + 2] = d * 1.65 + f * 0.85;
      }
      pos.needsUpdate = true; (og.attributes.color as THREE.BufferAttribute).needsUpdate = true; og.computeVertexNormals();
      // the ship rides the swell; sink takes her down by the bow
      const sink = c.sink ?? 0, h0 = seaH(0, 0, t), hb = seaH(5, 0, t), hs = seaH(-5, 0, t), hp = seaH(0, 1.6, t), hq = seaH(0, -1.6, t);
      ship.g.position.set(0, h0 - 0.95 - 0.55 * Math.min(1, sink) - 1.6 * Math.max(0, sink - 1), 0);
      ship.g.rotation.set(Math.atan2(hp - hq, 3.2) * 0.8 + 0.05 * Math.sin(t * 1.1), 0, Math.atan2(hb - hs, 10) * 0.9 - 0.32 * Math.max(0, sink - 0.6));
      ship.pose(t, ship.g.rotation.x);
      lan.intensity = 6 * (0.85 + 0.15 * Math.sin(t * 9)) * (sink < 2 ? 1 : 0);
      // lifeboat
      const bu = c.boatX ?? 0, bp = boatAt(t, bu); boat.visible = (c.boat ?? 1) > 0.5;
      boat.position.set(...bp); boat.rotation.set((seaH(bp[0], bp[2] + 0.8, t) - seaH(bp[0], bp[2] - 0.8, t)) * 0.5, -0.5, (seaH(bp[0] + 1.6, bp[2], t) - seaH(bp[0] - 1.6, bp[2], t)) * 0.35);
      oars.forEach((o, i) => { o.rotation.z = 0.5 * Math.sin(t * 4.2 + i * 0.2); o.rotation.y = 0.25 * Math.cos(t * 4.2); });
      // rain streaks driving down-left
      for (let i = 0; i < NR; i++) {
        const s = rs[i], fall = ((t * (14 + s * 5) + s * 40) % 20), x = -16 + ((s * 9301) % 1) * 32 - fall * 0.35, z = -10 + ((s * 4973) % 1) * 26, y = 16 - fall;
        rp.set([x, y, z, x - 0.12, y - 0.55, z + 0.02], i * 6);
      }
      rg.attributes.position.needsUpdate = true;
      // spray at the bow when she ploughs in
      spray.forEach((m, i) => { const u = (t * 0.9 + i / 4) % 1; tmp.set(4.8, 0.6 + u * 2.2, -1 + i * 0.6).applyMatrix4(ship.g.matrix); m.position.copy(tmp); (m.material as THREE.SpriteMaterial).opacity = (c.spray ?? 0.6) * 0.5 * (1 - u) * Math.max(0, Math.sin(t * 1.3 + i)); m.scale.set(1.5 + u * 3, (1.5 + u * 3) * 0.7, 1); });
      // lightning
      const fl = c.flash ?? 0; bolt.visible = fl > 0.05; (bolt.material as THREE.MeshBasicMaterial).opacity = fl; flashL.intensity = 2.6 * fl;
    },
  };
};
