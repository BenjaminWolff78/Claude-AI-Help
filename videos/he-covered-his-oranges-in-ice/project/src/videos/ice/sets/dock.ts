// "Owners Sank Their Own Ships, So He Painted a Line": a Victorian Liverpool dock (1870s), the home base of the story.
// Cobbled quay along z (x < 6.6) with brick warehouses behind it (the MARINE INSURANCE office, the MAGISTRATES' COURT),
// the auxiliary steamer PROSPERITY moored on the right (x ~ 9.7, bow toward -z), her sisters GOOD FORTUNE and SURE
// THING further along, a cargo derrick, lamp posts, a rain barrel with a toy boat (the in-world demo) and the 1876
// notice post. Story controls (c.*): shipY (how deep she sits), cargo (deck crates), crane*, line (Plimsoll's lime
// stripe), funnelLine, mark (the 1890 circle), wave (a wave walking over the deck), toy / pen (the toy boat + pennies),
// notice, stopSign, ladder, lamps. v10.14: every surface is textured (realify turns them into lit PBR materials).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, quad } from "../build";
import { planksHD, beamHD, stoneHD, cobbleHD, ctex, rng, rep, brick } from "../paint";
import { NOINK } from "../ink";
import { brig, lamp, flicker, crate, barrel, sack, ropeCoil, sign, waterPlane, rod, mist, stencilTex } from "../setkit";
import { gullFlock } from "./portkit_common";
import type { SetDef, V3 } from "./types";

export const LIME = "#8bd435";
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

/** a painted notice on a post: the 1876 Act */
const noticeTex = () => ctex("notice1876", 512, 680, (g, r) => {
  g.fillStyle = "#f3e9cf"; g.fillRect(0, 0, 512, 680);
  for (let k = 0; k < 30; k++) { const gr = g.createRadialGradient(r() * 512, r() * 680, 0, r() * 512, r() * 680, 80); gr.addColorStop(0, "rgba(150,110,60,0.10)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 680); }
  g.fillStyle = "#2a1a12"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "700 40px Georgia, serif"; g.fillText("MERCHANT SHIPPING", 256, 70); g.fillText("ACT, 1876", 256, 118);
  g.fillRect(70, 150, 372, 4);
  g.font = "900 64px Georgia, serif"; ["EVERY SHIP", "MUST CARRY", "A LOAD LINE"].forEach((t, i) => g.fillText(t, 256, 240 + i * 92));
  g.fillStyle = LIME; g.fillRect(96, 540, 320, 22);
  g.fillStyle = "#2a1a12"; g.font = "italic 30px Georgia, serif"; g.fillText("By Order", 256, 620);
});
/** the 1890 load-line mark: a ring, a bar through it, the side lines */
const markTex = () => ctex("plimsollMark", 512, 384, (g) => {
  g.clearRect(0, 0, 512, 384); g.strokeStyle = "#f6f3ea"; g.fillStyle = "#f6f3ea";
  g.lineWidth = 20; g.beginPath(); g.arc(170, 192, 112, 0, Math.PI * 2); g.stroke();
  g.fillRect(28, 182, 284, 22);
  g.fillRect(352, 70, 16, 260); for (const y of [70, 140, 210, 314]) g.fillRect(352, y, 120, 16);
  g.font = "900 54px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("L", 110, 120); g.fillText("R", 232, 120);
});
const foamTex = () => ctex("deckFoam", 512, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.35, "rgba(220,240,250,0.7)"); gr.addColorStop(1, "rgba(120,170,200,0.0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.beginPath(); g.arc(r() * 512, r() * 90, 2 + r() * 9, 0, Math.PI * 2); g.fill(); }
});

export const dock = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  // ---- the quay: cobbles, granite coping, quay wall down to the water ----
  const cob = lam("dockCobble", () => ({ map: cobbleHD(), color: "#b3a896" }));
  b.add(quad(V(-16, 0, 14), V(6.4, 0, 14), V(6.4, 0, -44), V(-16, 0, -44), 9, 23), cob);
  const gran = lam("dockGranite", () => ({ map: stoneHD("graniteHD", ["#a7a29a", "#9c978f", "#b1aca3", "#938e86"], "#6d6862") }));
  b.add(boxGeo(V(6.0, -0.02, -44), V(6.75, 0.12, 14), 2), gran);
  b.add(boxGeo(V(6.35, -3.0, -44), V(6.8, -0.02, 14), 2), gran);
  const iron = lam("dockIron", () => ({ color: "#34373c" }));
  for (let z = -40; z < 12; z += 4.3) { b.add(new THREE.CylinderGeometry(0.17, 0.22, 0.5, 14).translate(6.2, 0.37, z), iron); b.add(new THREE.SphereGeometry(0.2, 14, 8).translate(6.2, 0.63, z), iron); }
  // ---- warehouses: brick and plaster, facing the water; second row and the town behind ----
  const H: [number, number, number, number][] = [[6.5, 8.6, 6.2, 7], [-0.5, 9.6, 6.6, 3], [-7.6, 8.2, 6.2, 7], [-15, 10.2, 6.8, 2], [-22.4, 8.8, 6.2, 7], [-29.6, 9.4, 6.4, 3]];
  H.forEach(([z, h, w, si]) => house(b, -12.5, z, Math.PI / 2, w, 6.4, h, si, 0));
  for (let i = 0; i < 7; i++) house(b, -24.5, 6 - i * 7.6, Math.PI / 2, 6.8, 6.2, 7.5 + (i % 3) * 1.6, i + 4, 0);
  b.add(quad(V(-16.5, 0.004, 14), V(-16.5, 0.004, -44), V(-28, 0.004, -44), V(-28, 0.004, 14), 6, 24), cob);
  // the insurance office porch (z ~ -0.5) and the magistrates' court portico (z ~ -15)
  const stoneM = lam("porticoStone", () => ({ map: stoneHD("porticoHD", ["#ddd4c4", "#d3c9b8", "#e4dccd", "#cbc1af"], "#a89d8a") }));
  for (const dz of [-1.3, 1.3]) b.add(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 16).translate(-8.6, 2.1, -15 + dz), stoneM);
  b.add(boxGeo(V(-9.4, 4.2, -16.8), V(-8.2, 4.7, -13.2), 1), stoneM); b.add(boxGeo(V(-9.4, 0, -16.8), V(-8.0, 0.22, -13.2), 1), stoneM);
  sign(root, "MAGISTRATES' COURT", 3.0, 0.5, [-8.1, 5.1, -15], Math.PI / 2, "#2c3a4a", "#f1e2b4");
  sign(root, "MARINE INSURANCE CO.", 3.4, 0.6, [-9.2, 4.4, -0.5], Math.PI / 2, "#1f3d2e", "#f1d98a");
  sign(root, "PRINCE'S DOCK", 2.8, 0.52, [-9.2, 6.9, 6.5], Math.PI / 2, "#5a1e18", "#f3dfa0");
  // ---- props on the quay ----
  crate(b, root, [-2.2, 0, -9.6], 0.9, "TEA", 0.2); crate(b, root, [-2.2, 0.9, -9.6], 0.75, undefined, -0.1); crate(b, root, [-1.2, 0, -10.4], 0.85, "COTTON", -0.15);
  crate(b, root, [-5.6, 0, 3.2], 0.85, "LIVERPOOL", 0.1); crate(b, root, [1.2, 0, -16.8], 0.9, "SUGAR", 0.3); crate(b, root, [2.2, 0, -17.4], 0.8, undefined, -0.2);
  crate(b, root, [-6.2, 0, -21], 0.9, "COAL", 0.1);
  barrel(root, [-4.6, 0, -4.6], 0.42); barrel(root, [-5.3, 0, -5.4], 0.42, 1); barrel(root, [0.6, 0, -18.6], 0.4, 2); barrel(root, [-3.2, 0, 5.6], 0.42);
  sack(root, [-3.6, 0, -11.4], 0.34); sack(root, [-3.1, 0, -12.1], 0.3, "#bfa070"); ropeCoil(root, [5.2, 0, -12.2], 0.42); ropeCoil(root, [4.8, 0, 2.6], 0.36);
  // ---- the derrick (cargo crane) on the quay ----
  const crane = new THREE.Group(); crane.position.set(4.4, 0, -12.6); root.add(crane);
  const cw = lam("craneWood", () => ({ map: beamHD() }));
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 7.2, 10), cw); post.position.y = 3.6; post.castShadow = true; crane.add(post);
  for (const a of [0.6, 2.7, 4.8]) rod(crane, [0, 6.2, 0], [Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2], 0.03, lam("rope", () => ({ color: "#c2a46a" })));
  const jibG = new THREE.Group(); jibG.position.y = 1.0; crane.add(jibG);
  const jib = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 7.6, 8).rotateZ(-Math.PI / 2 + 0.62).translate(3.05, 2.2, 0), cw); jib.castShadow = true; jibG.add(jib);
  const tipLocal = V(6.1, 4.4, 0);
  const fall = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 5), lam("rope", () => ({ color: "#c2a46a" }))); fall.castShadow = true; jibG.add(fall);
  const load = new THREE.Group(); jibG.add(load);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12, Math.PI * 1.4), iron); load.add(hook);
  const net = new THREE.Group(); net.position.y = -0.75; load.add(net);
  const netB = new Batch(); crate(netB, net, [-0.42, -0.35, -0.3], 0.7, "COTTON", 0.1); crate(netB, net, [0.38, -0.35, 0.25], 0.7, undefined, -0.2); netB.build(net);
  // ---- the ships ----
  const ship = brig(root, "", { hull: "#4a6a5c", trim: "#c9a646", sails: "furled", flag: "red" }); ship.g.rotation.y = Math.PI / 2; ship.g.position.set(10.4, -1.0, -6);
  ship.shrouds[0].forEach((m) => (m.visible = false)); // quay-side ropes would cross faces on the quay
  const deckY = ship.deckY, W = ship.W, side = -(W / 2 + 0.31); // local -z = the quay side
  // funnel (the smokestack) between the masts, black with a red band
  const funM = lam("funnelBlack", () => ({ color: "#222428" })), bandM = lam("funnelBand", () => ({ color: "#b5342c" }));
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 3.6, 20), funM); fun.position.set(0.4, deckY + 1.8, 0); fun.castShadow = true; ship.g.add(fun);
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.42, 20), bandM); fb.position.set(0.4, deckY + 3.2, 0); ship.g.add(fb);
  // the lime ring an owner paints round the funnel (thetaLength grows as the brush goes round, starting on the quay side)
  const funnelRing = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.13, 32, 1, true), lam("limeLine", () => ({ color: LIME, emissive: "#2a4a10", emissiveIntensity: 0.25 })));
  funnelRing.position.set(0.4, deckY + 2.55, 0); ship.g.add(funnelRing); let ringQ = -1;
  // name boards on both quarters
  for (const z of [side - 0.005, -side + 0.005]) {
    const nb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.42), new THREE.MeshBasicMaterial({ map: stencilTex("PROSPERITY", "#f1d36b", null, 768, 124), transparent: true }));
    nb.position.set(-3.8, 1.02, z); nb.rotation.y = z < 0 ? Math.PI : 0; ship.g.add(nb);
  }
  // rot and patches on the hull (an old coffin ship)
  const patchM = lam("hullPatch", () => ({ map: rep(planksHD(), 0.6, 0.4), color: "#8a7a5c" }));
  for (const [x, y, w, h] of [[2.6, 0.35, 0.9, 0.5], [-1.2, 0.75, 0.7, 0.4], [-2.8, 0.2, 0.6, 0.45]] as [number, number, number, number][]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), patchM); p.position.set(x, y, side - 0.012); p.rotation.y = Math.PI; ship.g.add(p);
  }
  // Plimsoll's lime stripe (revealed along x as the brush moves) and the 1890 mark
  const lineG = new THREE.Group(); lineG.position.set(1.9, 0.62, side - 0.02); ship.g.add(lineG);
  const lineM = lam("limeLine", () => ({ color: LIME, emissive: "#2a4a10", emissiveIntensity: 0.25 }));
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.18).translate(-0.5, 0, 0), lineM); stripe.name = "loadLine"; stripe.rotation.y = Math.PI; lineG.add(stripe);
  const markM = new THREE.MeshBasicMaterial({ map: markTex(), transparent: true, alphaTest: 0.3 });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), markM); mark.name = "plimsollMark"; mark.position.set(-0.9, 0.55, side - 0.025); mark.rotation.y = Math.PI; ship.g.add(mark);
  // under-water "ghosts" of the line and the mark (gate check 5: the viewer keeps seeing the line as the water climbs
  // over it): drawn after the water without a depth test, water-tinted, only when a shot asks for them (c.ghost)
  const ghostL = new THREE.Mesh(stripe.geometry, new THREE.MeshBasicMaterial({ color: "#7fc046", transparent: true, opacity: 0.6, depthTest: false, depthWrite: false }));
  ghostL.rotation.y = Math.PI; ghostL.renderOrder = 20; ghostL.layers.set(NOINK); lineG.add(ghostL);
  const ghostM = new THREE.Mesh(mark.geometry, new THREE.MeshBasicMaterial({ map: markM.map, color: "#bfe6ee", transparent: true, opacity: 0.55, depthTest: false, depthWrite: false, alphaTest: 0.3 }));
  ghostM.position.copy(mark.position); ghostM.rotation.y = Math.PI; ghostM.renderOrder = 20; ghostM.layers.set(NOINK); ship.g.add(ghostM);
  // a white foam line where the water meets the quay-side hull: the waterline reads in every hull shot
  const foamT = ctex("hullFoam", 1024, 32, (g, r) => { for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.6})`; g.beginPath(); g.ellipse(r() * 1024, 16 + (r() - 0.5) * 14, 3 + r() * 14, 1.5 + r() * 3, 0, 0, 7); g.fill(); } });
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 0.16).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamT, transparent: true, depthWrite: false, color: "#f4fbff" }));
  foam.position.set(8.4, -0.935, -6.0); foam.renderOrder = 6; foam.layers.set(NOINK); root.add(foam);
  // deck cargo: crates and barrels in two layers (c.cargo = how many show)
  const cargo: THREE.Object3D[] = [];
  const cgRoot = new THREE.Group(); ship.g.add(cgRoot);
  // varied cargo: each column stacks crates of its own sizes (0.58-0.86 m, not cubes), the top layer mixes in barrels
  const CR = rng(77), colTop = new Map<string, number>();
  const slots: { x: number; z: number; lay: number; w: number; h: number; d: number; barrel: boolean }[] = [];
  for (const lay of [0, 1, 2]) for (const x of [3.6, 2.6, -0.8, -1.9, -3.0]) for (const z of [-0.75, 0.75]) {
    const w = 0.66 + CR() * 0.22, d = 0.62 + CR() * 0.24, h = 0.56 + CR() * 0.26;
    slots.push({ x: x + (lay % 2) * 0.12 + (CR() - 0.5) * 0.08, z: z + (CR() - 0.5) * 0.1, lay, w: Math.min(w, 0.88), h, d: Math.min(d, 1.3), barrel: lay === 2 && CR() < 0.35 });
  }
  slots.forEach((sl, i) => {
    const key = `${Math.round(sl.x - (sl.lay % 2) * 0.12)}_${sl.z > 0 ? 1 : 0}`, y = colTop.get(key) ?? deckY + 0.06;
    const g = new THREE.Group(); cgRoot.add(g);
    if (sl.barrel) { barrel(g, [sl.x, y, sl.z], 0.3, i * 0.7); colTop.set(key, y + 0.69); }
    else { const lb = new Batch(); crate(lb, g, [sl.x, y, sl.z], 0.8, i % 5 === 0 ? "COTTON" : i % 7 === 3 ? "TEA" : undefined, (i * 0.37) % 0.4 - 0.2, { w: sl.w, h: sl.h, d: sl.d, seed: i * 31 + 7 }); lb.build(g); colTop.set(key, y + sl.h + 0.035); }
    cargo.push(g);
  });
  // ladder up the funnel (the smokestack scene)
  const ladder = new THREE.Group(); ladder.position.set(0.4, deckY, side + 0.95); ship.g.add(ladder);
  for (const s of [-0.22, 0.22]) rod(ladder, [s, 0, -0.55], [s, 3.0, 0.02], 0.03, cw);
  for (let i = 1; i < 9; i++) { const t = i / 9; rod(ladder, [-0.22, t * 3.0, -0.55 + t * 0.57], [0.22, t * 3.0, -0.55 + t * 0.57], 0.022, cw); }
  // the wave that walks over the deck (mechanism shot)
  const waveM = new THREE.MeshStandardMaterial({ map: foamTex(), color: "#bfe6f2", transparent: true, opacity: 0.9, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  const waveG = new THREE.PlaneGeometry(9.5, 1.2, 24, 6); { const p = waveG.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, 0.5 * Math.cos(((y + 0.6) / 1.2) * Math.PI * 0.9)); } waveG.computeVertexNormals(); }
  const wave = new THREE.Mesh(waveG, waveM); wave.rotation.x = -Math.PI / 2; wave.layers.set(NOINK); ship.g.add(wave);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(9.6, W - 0.1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#3d7d96", transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0, depthWrite: false }));
  sheet.position.set(0.1, deckY + 0.1, 0); sheet.layers.set(NOINK); ship.g.add(sheet);
  // her sisters further along the quay, and masts across the dock
  const s2 = brig(root, "", { hull: "#3b2a24", trim: "#b8963c", sails: "furled", flag: "red" }); s2.g.rotation.y = Math.PI / 2; s2.g.position.set(11.0, -1.3, -24); s2.shrouds[0].forEach((m) => (m.visible = false));
  const s3 = brig(root, "", { hull: "#23313f", trim: "#c9a646", sails: "furled", flag: "red" }); s3.g.rotation.y = Math.PI / 2; s3.g.position.set(10.9, -1.25, 11); s3.shrouds[0].forEach((m) => (m.visible = false));
  for (const [sh, nm] of [[s2, "GOOD FORTUNE"], [s3, "SURE THING"]] as const) {
    const nb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.42), new THREE.MeshBasicMaterial({ map: stencilTex(nm, "#f1d36b", null, 768, 124), transparent: true }));
    nb.position.set(-3.8, 1.02, -(sh.W / 2 + 0.315)); nb.rotation.y = Math.PI; sh.g.add(nb);
  }
  for (let i = 0; i < 4; i++) { const sx = brig(root, "", { hull: "#2e2a2a", sails: "furled", flag: "red" }); sx.g.scale.setScalar(0.8); sx.g.rotation.y = 0.3 + i * 0.7; sx.g.position.set(28 + i * 10, -1.0, -30 + i * 14); }
  // the far bank: warehouses and chimneys across the dock basin
  for (let i = 0; i < 10; i++) house(b, 44, -50 + i * 9, -Math.PI / 2, 8, 7, 7 + (i % 4) * 2, i + 1, 0);
  for (const [x, z, h] of [[47, -30, 16], [49, 6, 19], [46, 30, 14]] as [number, number, number][]) b.add(new THREE.CylinderGeometry(0.7, 1.0, h, 12).translate(x, h / 2, z), lam("millBrick", () => ({ map: rep(brick(), 1, 4) })));
  // the painter's punt in the gap between the quay wall and the hull (Plimsoll and the 1890 inspector paint from it)
  const punt = new THREE.Group(); punt.position.set(7.6, -0.95, -5.0); root.add(punt);
  const puntM = lam("puntWood", () => ({ map: rep(planksHD(), 1.2, 0.4), color: "#9a7a58" }));
  const pb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 3.4), puntM); pb.position.y = 0.06; pb.castShadow = pb.receiveShadow = true; punt.add(pb);
  for (const sx of [-0.52, 0.52]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 3.4), puntM); sd.position.set(sx, 0.17, 0); sd.castShadow = true; punt.add(sd); }
  const paintPot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.2, 16), lam("potTin", () => ({ color: "#8a8e96" }))); paintPot.position.set(-0.2, 0.27, 0.9); punt.add(paintPot);
  const potTop = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16).rotateX(-Math.PI / 2), lineM); potTop.position.set(-0.2, 0.375, 0.9); punt.add(potTop);
  // ---- water ----
  waterPlane(root, 6.6, 140, -140, 60, -0.95);
  // ---- gangplank (re-aimed every frame at the deck) ----
  const gp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.85), lam("gang", () => ({ map: planksHD() }))); gp.castShadow = gp.receiveShadow = true; root.add(gp);
  const stopSign = sign(root, "NOT SAILING", 1.05, 0.42, [5.95, 0.95, -6.7], -Math.PI / 2, "#a8261e", "#fbf1d6");
  // ---- the rain barrel and the toy boat (in-world demo) + the notice post ----
  const rb = barrel(root, [3.0, 0, -0.6], 0.5); rb.children.forEach((c) => { if ((c as THREE.Mesh).geometry instanceof THREE.CircleGeometry) c.visible = false; });
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#2f5d74", roughness: 0.08, metalness: 0.1 }));
  water.position.set(3.0, 1.08, -0.6); root.add(water);
  const toy = new THREE.Group(); toy.position.set(3.0, 1.08, -0.6); root.add(toy);
  // v10.16 (the toy boat is now a full-frame mechanism insert): a real little hull - rounded stern, pointed bow, bevelled
  // edges - with Plimsoll's lime line wrapping round it, instead of a box with a cone stuck on
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.2, -0.07); hullShape.quadraticCurveTo(-0.235, 0, -0.2, 0.07); hullShape.lineTo(0.1, 0.085);
  hullShape.quadraticCurveTo(0.26, 0.07, 0.315, 0); hullShape.quadraticCurveTo(0.26, -0.07, 0.1, -0.085); hullShape.lineTo(-0.2, -0.07);
  const hullGeo = (d: number) => new THREE.ExtrudeGeometry(hullShape, { depth: d, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 3, curveSegments: 14 }).rotateX(-Math.PI / 2);
  const toyHull = new THREE.Mesh(hullGeo(0.09), lam("toyHull", () => ({ color: "#2c3a33" }))); toyHull.position.y = -0.03; toyHull.castShadow = true; toy.add(toyHull);
  const toyRail = new THREE.Mesh(hullGeo(0.012), lam("toyRail", () => ({ color: "#8a5a32" }))); toyRail.position.y = 0.065; toyRail.scale.set(1.03, 1, 1.06); toy.add(toyRail);
  const toyLine = new THREE.Mesh(hullGeo(0.014), lineM); toyLine.position.y = 0.028; toyLine.scale.set(1.02, 1, 1.05); toy.add(toyLine);
  rod(toy, [0, 0.07, 0], [0, 0.36, 0], 0.008, cw);
  const toySail = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), lam("toySail", () => ({ color: "#f3ead6", side: THREE.DoubleSide, emissive: "#5a5244", emissiveIntensity: 0.6 }))); toySail.position.set(0.0, 0.24, 0.0); toySail.rotation.y = Math.PI / 2; toy.add(toySail);
  const pennyM = lam("penny", () => ({ color: "#b8743a", emissive: "#3a1c06", emissiveIntensity: 0.2 }));
  const pennies = Array.from({ length: 6 }, (_, i) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 14), pennyM); p.position.set(-0.12 + (i % 3) * 0.09, 0.083 + Math.floor(i / 3) * 0.009, (i % 2 ? 0.03 : -0.03)); toy.add(p); return p; });
  // v10.16 (board AO: no pole through the middle of a shot): a framed notice board on two short legs, only once the
  // 1876 Act exists (c.notice), instead of a tall bare post standing on the quay in every shot
  const npost = new THREE.Group(); npost.position.set(3.6, 0, -7.6); root.add(npost);
  for (const sx of [-0.42, 0.42]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.32, 0.09), cw); leg.position.set(sx, 0.66, 0); leg.castShadow = true; npost.add(leg); }
  const nboard = new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.0, 0.05), cw); nboard.position.set(0, 1.76, 0); nboard.castShadow = true; npost.add(nboard);
  const nroof = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.2), cw); nroof.position.set(0, 2.3, 0.03); nroof.rotation.x = -0.12; npost.add(nroof);
  const notice = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.82), lam("noticePaper", () => ({ map: noticeTex() }))); notice.position.set(3.6, 1.75, -7.51); root.add(notice);
  // ---- lamps (night), gulls, chimney smoke ----
  // the reveal (f1700): a warm sunbeam on the 1890 mark so the close-up reads bright, as if the circle comes up into the sun
  const markSun = new THREE.SpotLight("#fff1d2", 0, 9, 0.5, 0.55, 1.0);
  markSun.position.set(6.3, 2.2, -3.2); markSun.target.position.set(8.47, -0.75, -5.1); root.add(markSun, markSun.target);
  // the toy-boat insert (scene 8, evening): a warm lantern glow over the barrel so the demo reads
  const toyLamp = new THREE.PointLight("#ffc27a", 0, 3.2, 1.2); toyLamp.position.set(3.45, 1.95, -0.15); root.add(toyLamp);
  const lamps = [lamp(root, [5.2, 3.0, -0.4], "#ffb45a", 14, 11), lamp(root, [5.2, 3.0, -9.6], "#ffb45a", 12, 11), lamp(root, [5.2, 3.0, -19], "#ffc36a", 10, 11), lamp(root, [-8.9, 3.6, -3.6], "#ffb45a", 8, 9, "wall")];
  const gulls = gullFlock(root, 5, [14, 9, -10], 9);
  const smoke = [0, 1, 2, 3, 4].map((i) => mist(root, [44, 15, -30 + i * 14], 3, "#9a9894", 0.4));
  const funSmoke = [0, 1, 2].map(() => mist(root, [0, 0, 0], 1.2, "#7c7a78", 0.35));
  b.build(root);

  const marks: Record<string, V3> = {
    owner: [5.0, 0, -4.4], insurer: [3.6, 0, -5.6], gang: [5.6, 0, -2.6], sailor1: [4.9, 0, -1.4], sailor2: [3.7, 0, -2.6], sailor3: [4.4, 0, -0.2],
    plim: [5.3, 0, -6.4], puntA: [7.6, -0.73, -5.6], puntB: [7.6, -0.73, -4.2], barrel: [3.0, 0, -0.6], notice: [3.6, 0, -7.6], crane: [4.4, 0, -12.6], court: [-7.6, 0, -15], office: [-8.6, 0, -0.5],
  };
  const cams = {
    hook: { pos: [2.6, 1.15, 2.6] as V3, look: [6.6, 1.2, -5.0] as V3, fov: 42 },
    wide: { pos: [-3.5, 3.2, 8.0] as V3, look: [6.0, 1.4, -8] as V3, fov: 48 },
    hull: { pos: [7.4, 0.45, -13.0] as V3, look: [8.3, -0.2, -5.2] as V3, fov: 40 },
    barrel: { pos: [2.2, 2.05, 0.75] as V3, look: [3.0, 1.1, -0.6] as V3, fov: 34 },
    funnel: { pos: [3.0, 1.0, 1.0] as V3, look: [9.6, 3.6, -5.8] as V3, fov: 44 },
  };
  const tipW = new THREE.Vector3(), base = new THREE.Vector3(), deckW = new THREE.Vector3();
  return {
    name: "dock", root, marks, cams,
    title: [...ship.g.children.filter((o) => (o as THREE.Mesh).geometry?.type === "ExtrudeGeometry").map((o) => { o.name = "hull"; return o; }), stripe, mark],
    pose: (t, c) => {
      const lampOn = (c.lamps ?? 0) > 0.5;
      lamps.forEach((l) => { l.visible = lampOn; flicker(l, t); });
      // ship: how deep (shipY), a slow bob and roll; deeper ships wallow more
      const sink = c.shipY ?? 0, rough = 1 + (c.rough ?? 0) * 3;
      ship.pose(t, (0.006 + sink * 0.01) * rough * Math.sin(t * 0.9));
      ship.g.position.y = -1.0 - sink + 0.03 * rough * Math.sin(t * 1.3);
      ship.g.rotation.z = 0.004 * rough * Math.sin(t * 0.7 + 1);
      s2.pose(t + 2, 0.008 * Math.sin(t * 0.8)); s3.pose(t + 4, 0.008 * Math.sin(t * 0.85 + 2));
      const nC = Math.round(c.cargo ?? 0); cargo.forEach((g, i) => (g.visible = i < nC));
      // derrick: craneA 0 = over the quay, 1 = over the ship's hatch; craneH = hook height above the deck; craneLoad 0/1
      jibG.rotation.y = THREE.MathUtils.lerp(0.9, -0.6, sm(c.craneA ?? 0));
      const hookY = c.craneH ?? 2.6;
      const tip = tipLocal.clone(); load.position.set(tip.x, hookY - 1.0, tip.z);
      fall.position.set(tip.x, (tip.y + hookY - 1.0) / 2, tip.z); fall.scale.y = Math.max(0.05, tip.y - (hookY - 1.0));
      net.visible = (c.craneLoad ?? 0) > 0.5; load.rotation.y = Math.sin(t * 0.8) * 0.15;
      // paint: Plimsoll's stripe, the funnel ring, the 1890 mark
      stripe.scale.x = Math.max(0.001, 1.7 * sm(c.line ?? 0)); stripe.visible = (c.line ?? 0) > 0.001;
      const fr = Math.round(sm(c.funnelLine ?? 0) * 40) / 40; funnelRing.visible = fr > 0.02;
      if (fr !== ringQ && fr > 0.02) { ringQ = fr; funnelRing.geometry.dispose(); funnelRing.geometry = new THREE.CylinderGeometry(0.47, 0.47, 0.13, 32, 1, true, Math.PI - fr * Math.PI, fr * Math.PI * 2); }
      mark.visible = (c.mark ?? 0) > 0.01; markM.opacity = sm(c.mark ?? 0); markM.transparent = true;
      ghostL.scale.copy(stripe.scale); ghostL.visible = (c.ghost ?? 0) > 0.5 && stripe.visible; ghostM.visible = (c.ghostMark ?? 0) > 0.5 && mark.visible;
      ladder.visible = (c.ladder ?? 0) > 0.5;
      markSun.intensity = 38 * (c.markSun ?? 0);
      toyLamp.intensity = 9 * (c.toyLamp ?? 0);
      // the wave walking over the deck (wave 0..1 crosses from the seaward rail to the quay rail)
      const wv = c.wave ?? 0; wave.visible = wv > 0.01 && wv < 0.99; sheet.visible = (c.awash ?? 0) > 0.01;
      (sheet.material as THREE.MeshStandardMaterial).opacity = 0.55 * sm(c.awash ?? 0);
      wave.position.set(0.1, deckY + 0.15, THREE.MathUtils.lerp(W / 2 + 0.5, -W / 2 - 0.5, wv)); wave.scale.set(1, 1, 0.6 + 0.4 * Math.sin(wv * Math.PI));
      // gangplank: quay edge -> the ship's rail
      ship.g.updateMatrixWorld(true); deckW.set(1.4, deckY + 0.1, side + 0.3).applyMatrix4(ship.g.matrix); base.set(6.0, 0.08, deckW.z);
      gp.position.copy(base).add(deckW).multiplyScalar(0.5); gp.scale.x = base.distanceTo(deckW); gp.rotation.set(0, 0, Math.atan2(deckW.y - base.y, deckW.x - base.x));
      gp.visible = (c.gang ?? 1) > 0.5;
      stopSign.visible = (c.stopSign ?? 0) > 0.01; stopSign.position.y = 0.95 + 0.62 * (1 - sm(c.stopSign ?? 0));
      // toy boat: toy 0 = floating high .. 1 = water over its line (tips and swamps past 1)
      const ty = c.toy ?? 0; toy.position.y = 1.08 + 0.03 - 0.06 * ty + 0.004 * Math.sin(t * 3); toy.rotation.z = 0.05 * Math.sin(t * 2.1) + (ty > 1 ? 0.25 * (ty - 1) : 0); toy.rotation.y = 0.4;
      const np = Math.round(c.pen ?? 0); pennies.forEach((p, i) => (p.visible = i < np));
      notice.visible = (c.notice ?? 0) > 0.5; npost.visible = notice.visible || (c.noticeBoard ?? 0) > 0.5;
      punt.visible = (c.punt ?? 0) > 0.5; punt.position.z = c.puntZ ?? -5.0; punt.position.y = -0.95 + 0.02 * Math.sin(t * 1.7); punt.rotation.z = 0.02 * Math.sin(t * 1.3);
      // gulls, smoke
      gulls(t);
      smoke.forEach((m, i) => { const u = (t * 0.08 + i * 0.21) % 1; m.position.set(44 + u * 4, 15 + u * 9, -30 + i * 14); (m.material as THREE.SpriteMaterial).opacity = 0.35 * (1 - u); m.scale.set(2.5 + u * 6, (2.5 + u * 6) * 0.7, 1); });
      tipW.set(0.4, deckY + 3.7, 0).applyMatrix4(ship.g.matrix);
      funSmoke.forEach((m, i) => { const u = (t * 0.25 + i / 3) % 1; m.position.set(tipW.x - u * 1.5, tipW.y + u * 2.6, tipW.z + u * 0.6); (m.material as THREE.SpriteMaterial).opacity = (c.steam ?? 0.6) * 0.45 * (1 - u); m.scale.set(0.8 + u * 2.2, (0.8 + u * 2.2) * 0.75, 1); });
    },
  };
};
