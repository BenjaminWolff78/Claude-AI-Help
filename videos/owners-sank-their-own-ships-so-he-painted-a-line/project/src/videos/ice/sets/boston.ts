// Boston Long Wharf (1806). Used at snowy dusk (S01-S03), winter sunset (S08) and summer (S22, snow off via c.snow).
// Dock runs along z; brick warehouses on the left (x < -4), the brig moored on the right (x > 6), the town behind (-z).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, quad } from "../build";
import { planksHD, beamHD, stoneHD, cobbleHD, ctex, rng } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { tongs3D, brig, lamp, flicker, glow, crate, barrel, sack, ropeCoil, sign, iceBlock, waterPlane, rod, mist, stencilTex } from "../setkit";
import type { SetDef, V3 } from "./types";

export const boston = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  // ---- wet dock planks (glossy two-tone Phong so lamps leave a sheen), quay wall + pilings ----
  const deckTex = planksHD(); deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
  const wet = twoTone(new THREE.MeshPhongMaterial({ map: deckTex, color: "#c7a07a", specular: "#5a5068", shininess: 40 }), 0.6);
  const dk = new THREE.Mesh(new THREE.PlaneGeometry(22, 34, 1, 1).rotateX(-Math.PI / 2), wet);
  (dk.geometry.attributes.uv as THREE.BufferAttribute).array.forEach((_, i, a) => { (a as Float32Array)[i] *= i % 2 ? 6 : 4; });
  dk.position.set(-5, 0, -9); dk.receiveShadow = true; root.add(dk);
  const stone = lam("quayStone", () => ({ map: stoneHD("quayHD", ["#a9a39c", "#9d968e", "#b3ada4", "#948d86"], "#6f6862") }));
  b.add(boxGeo(V(6, -2.2, -26), V(6.6, 0.02, 8), 2), stone);
  const pile = lam("pile", () => ({ map: beamHD() }));
  for (let z = -24; z < 8; z += 1.7) b.add(new THREE.CylinderGeometry(0.2, 0.22, 3.2, 10).translate(6.75, -1.0, z), pile);
  for (let z = -22; z < 6; z += 4.2) { b.add(new THREE.CylinderGeometry(0.17, 0.22, 0.55, 12).translate(5.7, 0.27, z), lam("bollard", () => ({ color: "#3a3644" }))); b.add(new THREE.SphereGeometry(0.19, 12, 8).translate(5.7, 0.56, z), lam("bollard", () => ({ color: "#3a3644" }))); }
  // ---- warehouses (gabled brick/plaster with painted facades and 3D relief), facing the dock (+x) ----
  const H: [number, number, number, number][] = [[3, 7.0, 6, 7], [-3.6, 8.4, 6.4, 2], [-10.2, 7.0, 6, 7], [-16.6, 9.8, 6.4, 2], [-23, 8.4, 6, 7]];
  H.forEach(([z, h, w, si]) => house(b, -10, z, Math.PI / 2, w, 6, h, si, 0));
  // street behind the warehouses + a second row (depth through the gaps)
  const cob = lam("cobble", () => ({ map: cobbleHD() }));
  b.add(quad(V(-13, 0.005, 10), V(-13, 0.005, -40), V(-27, 0.005, -40), V(-27, 0.005, 10), 6, 24), cob);
  for (let i = 0; i < 6; i++) house(b, -22, 4 - i * 7.4, Math.PI / 2, 6.6, 6, 7 + (i % 3) * 1.4, i + 2, 0);
  // town across the harbour: houses, steeple (depth to the horizon)
  for (let i = 0; i < 9; i++) house(b, -30 + i * 7.5, -46 - (i % 2) * 4, 0, 6.5, 6, 6.5 + (i % 3) * 1.6, i, 0);
  const tower = lam("steeple", () => ({ map: stoneHD("steepleHD", ["#e6dccb", "#ddd2bf", "#ece3d4", "#d4c8b4"], "#b3a693") }));
  b.add(boxGeo(V(-1.5, 0, -58), V(1.5, 13, -55), 2), tower);
  b.add(new THREE.ConeGeometry(1.9, 7, 4).rotateY(Math.PI / 4).translate(0, 16.5, -56.5), lam("steepleRoof", () => ({ color: "#4f6a8f" })));
  b.add(new THREE.ConeGeometry(0.08, 1.4, 6).translate(0, 20.7, -56.5), lam("gold", () => ({ color: "#e0b448" })));
  // ---- crates, barrels, sacks, rope (props carry the story: TUDOR ICE CO.) ----
  crate(b, root, [-3.4, 0, -6.2], 0.85, "TUDOR\nICE CO.", 0.15); crate(b, root, [-3.4, 0.85, -6.2], 0.7, undefined, -0.1); crate(b, root, [-2.4, 0, -7.0], 0.8, "BOSTON", -0.2);
  crate(b, root, [-6.2, 0, -1.6], 0.9, "TUDOR\nICE CO.", 0.05); crate(b, root, [-6.4, 0, -12.5], 0.8, "SAWYER\n& SONS", 0.3); crate(b, root, [3.8, 0, -9.0], 0.75, "FRAGILE", 0.4);
  barrel(root, [-5.0, 0, -4.2], 0.42); barrel(root, [-5.6, 0, -5.0], 0.42, 1); barrel(root, [-4.6, 0, 1.8], 0.4, 2); barrel(root, [4.6, 0, -12.2], 0.42);
  sack(root, [-4.2, 0, -7.6], 0.34); sack(root, [-3.7, 0, -8.2], 0.3, "#bfa070"); ropeCoil(root, [4.4, 0, -4.2], 0.42); ropeCoil(root, [-1.6, 0, -11.0], 0.36);
  // ice stacked waiting to be loaded (title thing, seen behind the hook)
  const stack = [[0, 0], [1.05, 0], [2.1, 0], [0.5, 0.82], [1.55, 0.82]].map(([dx, dy], i) => iceBlock(root, 0.95, 0.8, 0.8, [1.2 + dx, dy, -8.6 - (i % 2) * 0.1], { mist: i > 2, seed: i }));
  tongs3D(root, [1.72, 0.72, -8.62], 0, 0.95, 1.02); // iron tongs biting the top block
  // hand cart with an ice block
  const cart = new THREE.Group(); cart.position.set(-4.6, 0, -9.6); cart.rotation.y = 0.5; root.add(cart);
  const cw = lam("cartWood", () => ({ map: beamHD() }));
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.9), cw); cb.position.y = 0.6; cb.castShadow = true; cart.add(cb);
  for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 18), lam("wheel", () => ({ color: "#5a3a24" }))); wh.rotation.x = Math.PI / 2; wh.position.set(-0.25, 0.34, s * 0.5); cart.add(wh); }
  rod(cart, [0.8, 0.6, -0.3], [1.6, 0.3, -0.3], 0.03, cw); rod(cart, [0.8, 0.6, 0.3], [1.6, 0.3, 0.3], 0.03, cw);
  iceBlock(cart, 0.7, 0.55, 0.6, [0.1, 0.65, 0], { seed: 9 });
  // ---- the hero block on its sled (title thing #1), moved by the shots ----
  const hero = new THREE.Group(); root.add(hero);
  const sled = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.5), lam("sled", () => ({ map: beamHD() }))); sled.position.y = 0.08; sled.castShadow = true; hero.add(sled);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.7), lam("runner", () => ({ color: "#3a3440" }))); r.position.set(s * 0.42, 0.03, 0.05); hero.add(r); }
  const heroIce = iceBlock(hero, 1.0, 1.05, 1.3, [0, 0.13, 0], { mist: true, seed: 4 });
  const sten = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.18), new THREE.MeshBasicMaterial({ map: stencilTex("F. TUDOR", "#2a1a10", "#d8b47a", 512, 102) }));
  sten.position.set(0, 0.08, 0.76); hero.add(sten);
  const purse = new THREE.Group(); hero.add(purse); purse.visible = false;
  const pm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), lam("purse", () => ({ color: "#b88446" }))); pm.scale.set(1, 1.15, 0.9); pm.position.y = 0.1; pm.castShadow = true; purse.add(pm);
  const tow = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), lam("rope", () => ({ color: "#c2a46a" }))); tow.visible = false; root.add(tow);
  // coins (lost money, S08)
  const coinM = twoTone(new THREE.MeshPhongMaterial({ color: "#f2c24a", emissive: "#6a4300", emissiveIntensity: 0.4, specular: "#fff2c0", shininess: 70 }));
  const coins = Array.from({ length: 14 }, () => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 14), coinM); c.visible = false; root.add(c); return c; });
  // ---- the brig, moored (rigging, furled sails), gangplank ----
  const ship = brig(root, "FAVORITE", { sails: "furled" }); ship.g.rotation.y = Math.PI / 2; ship.g.position.set(9.4, -1.0, -6); ship.shrouds[1].forEach((m) => (m.visible = false)); // starboard ropes would cross faces in S01-S02
  const gp = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.9), lam("gang", () => ({ map: planksHD() }))); gp.position.set(7.0, 0.12, -1.2); gp.rotation.z = 0.06; gp.castShadow = true; root.add(gp);
  // other ships at anchor (masts on the skyline)
  for (let i = 0; i < 3; i++) { const s2 = brig(root, "", { hull: "#3a2c34", sails: "furled" }); s2.g.scale.setScalar(0.75); s2.g.rotation.y = 0.5 + i * 0.6; s2.g.position.set(20 + i * 9, -1.0, -26 - i * 8); }
  // ---- water ----
  waterPlane(root, 6.6, 120, -120, 40, -0.95);
  // ---- lamps: glow + real light pools on the wet planks, reflection streaks ----
  const lamps = [lamp(root, [-5.6, 2.7, 0.6], "#ffb45a", 9, 9), lamp(root, [-5.6, 2.7, -8.0], "#ffb45a", 8, 9), lamp(root, [5.3, 2.5, -3.2], "#ffc36a", 8, 8), lamp(root, [5.3, 2.5, -14], "#ffc36a", 6, 8), lamp(root, [-7.0, 3.4, -15.5], "#ffb45a", 5, 8, "wall")];
  const streak = ctex("streak", 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const g2 = g.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(0.5, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = g2; g.fillRect(0, 0, 64, 256); });
  const streaks = lamps.slice(0, 4).map((l) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: streak, color: new THREE.Color("#ffb45a").multiplyScalar(0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(l.position.x + 0.34, 0.012, l.position.z + 1.3); m.layers.set(NOINK); root.add(m); return m; });
  sign(root, "TUDOR ICE CO.", 3.4, 0.62, [-6.88, 5.6, 3.0], Math.PI / 2, "#f2e2b0", "#5a1e10");
  sign(root, "LONG WHARF", 3.0, 0.56, [-6.88, 6.9, -3.6], Math.PI / 2, "#2f4a3a", "#f3dfa0");
  // ---- snow: drifts on the edges and roofs-tops of crates, falling snow (outdoor winter only) ----
  const snowM = lam("snow", () => ({ color: "#f3f7ff" }));
  const drifts = new THREE.Group(); root.add(drifts);
  const r = rng(5);
  for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 + r() * 0.6, 12, 8), snowM); s.scale.set(1.5, 0.35, 1); s.position.set(-8.8 + r() * 2.2, -0.12, -22 + i * 1.1); s.receiveShadow = true; drifts.add(s); }
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.45 + r() * 0.4, 12, 8), snowM); s.scale.set(1.4, 0.3, 1); s.position.set(4.6 + r() * 1.2, -0.1, -20 + i * 2.2); drifts.add(s); }
  for (const [x, y, z, w] of [[-3.4, 1.56, -6.2, 0.72], [-2.4, 0.81, -7.0, 0.8], [-6.2, 0.91, -1.6, 0.9]] as [number, number, number, number][]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.07, w + 0.02), snowM); s.position.set(x, y, z); drifts.add(s); }
  // snow lying on the planks: soft irregular patches along the walls, round the crates and in the plank gaps
  const patch = ctex("snowPatch2", 256, 256, (g, r2) => { g.fillStyle = "#f2f6ff"; for (let i = 0; i < 40; i++) { const x = 30 + r2() * 196, y = 70 + r2() * 116, rx = 10 + r2() * 30, ry = 5 + r2() * 12; g.beginPath(); g.ellipse(x, y, rx, ry, (r2() - 0.5) * 0.6, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#d9e2f4"; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(30 + r2() * 196, 80 + r2() * 100, 4 + r2() * 10, 2 + r2() * 3, 0, 0, Math.PI * 2); g.fill(); } });
  const patchM = twoTone(new THREE.MeshLambertMaterial({ map: patch, transparent: true, alphaTest: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  // thin crusts of snow caught in the plank seams, along the warehouse walls and the quay edge (kept clear of the walkway)
  for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), patchM); const side = i % 2 === 0; s.position.set(side ? -8.6 + r() * 2.4 : 4.0 + r() * 1.6, 0.008 + i * 0.0003, -22 + r() * 22); s.scale.set(0.9 + r() * 1.3, 1, 0.8 + r() * 1.0); s.rotation.y = (r() - 0.5) * 0.5; s.renderOrder = 0.2; drifts.add(s); }
  const flakes = new THREE.BufferGeometry(); const N = 700, fp = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { fp.set([-9 + r() * 18, r() * 10, -24 + r() * 21], i * 3); seeds[i] = r(); }
  flakes.setAttribute("position", new THREE.BufferAttribute(fp.slice(), 3));
  const flakeTex = ctex("flake", 32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const snowPts = new THREE.Points(flakes, new THREE.PointsMaterial({ map: flakeTex, size: 0.07, transparent: true, depthWrite: false, color: "#ffffff" }));
  snowPts.layers.set(NOINK); root.add(snowPts);
  // gulls
  const gulls = [0, 1, 2].map((i) => { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: "#f4f4f8", side: THREE.DoubleSide }); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12).translate(s * 0.25, 0, 0), m); w.name = s < 0 ? "L" : "R"; g.add(w); } const bd = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), m); bd.scale.set(1, 0.8, 2); g.add(bd); g.layers.set(NOINK); root.add(g); return g; });
  // chimney smoke puffs (ambient loop)
  const smoke = [0, 1, 2, 3].map((i) => mist(root, [-12 + (i % 2) * 0.4, 9, 3 - i * 6.4], 1.4, "#c9c3d8", 0.45));
  b.build(root);
  const marks: Record<string, V3> = {
    tudor: [0.6, 0, -1.4], hero: [0.5, 0, -3.0], crowd1: [-2.6, 0, -4.8], crowd2: [-1.5, 0, -5.4], crowd3: [-3.4, 0, -4.0], crowd4: [-0.7, 0, -4.6],
    gazette: [-1.9, 0, -3.6], banker: [-0.8, 0, -4.2], sailor1: [4.3, 0, -6.8], sailor2: [7.6, 0.3, -4.0], gang: [6.2, 0, -1.2],
  };
  const cams = {
    hook: { pos: [1.3, 0.75, 1.1] as V3, look: [0.6, 1.0, -1.6] as V3, fov: 40 },
    crowd: { pos: [-0.6, 1.25, -0.4] as V3, look: [-2.2, 1.0, -4.8] as V3, fov: 40 },
    wide: { pos: [-3.5, 2.2, 5.5] as V3, look: [3.0, 1.6, -6] as V3, fov: 46 },
    ship: { pos: [2.0, 1.4, 3.0] as V3, look: [7.5, 1.6, -4.5] as V3, fov: 40 },
  };
  return {
    name: "boston", root, marks, cams,
    pose: (t, c) => {
      lamps.forEach((l) => flicker(l, t)); ship.pose(t);
      stack.forEach((s, i) => s.set(0, t + i));
      heroIce.set(c.heroMelt ?? 0, t); sten.visible = (c.heroMelt ?? 0) < 0.2;
      const snowOn = (c.snow ?? 1) > 0.5; snowPts.visible = drifts.visible = snowOn;
      streaks.forEach((s) => (s.visible = (c.lamps ?? 1) > 0.5)); lamps.forEach((l) => (l.visible = (c.lamps ?? 1) > 0.5));
      if (snowOn) { const a = snowPts.geometry.attributes.position.array as Float32Array; for (let i = 0; i < N; i++) { a[i * 3] = fp[i * 3] + Math.sin(t * 0.7 + seeds[i] * 20) * 0.35; a[i * 3 + 1] = ((fp[i * 3 + 1] - t * (0.55 + seeds[i] * 0.4)) % 10 + 10) % 10; } snowPts.geometry.attributes.position.needsUpdate = true; }
      gulls.forEach((g, i) => { g.position.set(Math.sin(t * 0.25 + i * 2) * 6 + 2, 7.5 + i * 0.8 + Math.sin(t * 0.8 + i) * 0.3, -12 - i * 4); g.rotation.y = Math.cos(t * 0.25 + i * 2) > 0 ? Math.PI / 2 : -Math.PI / 2; const a = Math.sin(t * 9 + i * 2) * 0.55; g.children.forEach((w) => { if (w.name === "L") w.rotation.z = a; if (w.name === "R") w.rotation.z = -a; }); });
      smoke.forEach((m, i) => { const u = (t * 0.12 + i * 0.25) % 1; m.position.y = 9 + u * 5; m.position.x = -12 + (i % 2) * 0.4 + u * 2; (m.material as THREE.SpriteMaterial).opacity = 0.5 * (1 - u); m.scale.set(1.2 + u * 3, (1.2 + u * 3) * 0.7, 1); });
      // story controls: hero block position, tow rope, purse, coins
      hero.position.set(c.heroX ?? 0.5, c.heroY ?? 0, c.heroZ ?? -3.0); hero.scale.setScalar(c.heroS ?? 1); hero.rotation.y = c.heroYaw ?? 0; hero.visible = (c.hero ?? 1) > 0.5;
      purse.visible = (c.purse ?? 0) > 0.5; purse.position.set(c.purseX ?? 0, c.purseY ?? 1.2, c.purseZ ?? 0); purse.scale.set(1 + (c.purseSq ?? 0), 1 - (c.purseSq ?? 0), 1 + (c.purseSq ?? 0));
      if ((c.tow ?? 0) > 0.5) { const A = V(c.towAx, c.towAy, c.towAz), B = V(c.towBx, c.towBy, c.towBz); tow.position.copy(A.clone().add(B).multiplyScalar(0.5)); tow.scale.set(1, A.distanceTo(B), 1); tow.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()); tow.visible = true; } else tow.visible = false;
      coins.forEach((m, i) => { const k = c["coin" + i]; m.visible = k !== undefined; if (k !== undefined) { m.position.set(c["coinX" + i], c["coinY" + i], c["coinZ" + i]); m.rotation.set(c["coinR" + i] ?? 0, i, 0); } });
    },
  };
};
