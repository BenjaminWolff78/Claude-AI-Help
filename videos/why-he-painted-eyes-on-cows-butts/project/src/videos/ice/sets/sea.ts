// The open Atlantic at blazing noon: the brig FAVORITE under full sail (bow +x, name side +z), bobbing and pitching
// on a pivot under Tudor's mark so the cast stays put. On deck a barrel whose crisp ice block turns into a steaming
// bowl of soup (c.soup), water spouts from the scuppers (c.spout). Gulls, wake, a distant island. Sun: world.ts.
import * as THREE from "three";
import { Batch, V, lam } from "../build";
import { brig, crate, barrel, sack, ropeCoil, iceBlock, waterPlane } from "../setkit";
import { palm, swayPalm, gullFlock, hill, waterStream, sailBoat, sm, puff, risePuffs, sparkles, sparkle } from "./portkit_common";
import { braceYards, wake, soupBowl } from "./portkit_ship";
import type { SetDef, V3 } from "./types";

export const sea = (): SetDef => {
  const root = new THREE.Group();
  const WY = 0;
  waterPlane(root, -500, 500, -600, 300, WY);
  // ---- ship on a pivot rig (pivot = Tudor's mark, so marks barely move while the ship bobs) ----
  const PV = V(0, 1.25, 0.6);
  const rig = new THREE.Group(); rig.position.copy(PV); root.add(rig);
  const ship = brig(rig, "FAVORITE", { sails: "set" }); ship.g.position.set(-PV.x, WY - 0.05 - PV.y, -PV.z);
  braceYards(ship, -0.55);
  ship.shrouds[1].forEach((m) => (m.visible = false)); // camera-side shrouds would cross Tudor in the deck shot
  const deckY = WY - 0.05 + ship.deckY + 0.06;
  // deck cargo (in the ship group, so it rides along); positions in ship-local coordinates
  const sg = ship.g, b = new Batch(), dk = ship.deckY + 0.06;
  crate(b, sg, [-2.4, dk, -0.9], 0.7, "TUDOR\nICE CO.", 0.1); crate(b, sg, [-2.4, dk + 0.7, -0.9], 0.55, undefined, -0.2); crate(b, sg, [3.6, dk, -0.8], 0.65, "BOSTON", 0.3);
  b.build(sg);
  barrel(sg, [-0.9, dk, -1.0], 0.38); barrel(sg, [4.4, dk, 0.9], 0.36, 1); sack(sg, [-1.8, dk, 1.1], 0.3); ropeCoil(sg, [3.4, dk, 1.0], 0.36); ropeCoil(sg, [-3.4, dk, 0.9], 0.32);
  // soup barrel (story prop): crisp ice block on top that becomes a bowl of soup
  const sbx = 1.3, sbz = 0.45, bs = 0.4, bTop = dk + bs * 2.3;
  barrel(sg, [sbx, dk, sbz], bs, 0.6);
  const cloth = new THREE.Mesh(new THREE.CylinderGeometry(bs * 0.9, bs * 0.95, 0.03, 20), lam("seaCloth", () => ({ color: "#d8432e" }))); cloth.position.set(sbx, bTop + 0.01, sbz); sg.add(cloth);
  const blockG = new THREE.Group(); blockG.position.set(sbx, bTop + 0.02, sbz); sg.add(blockG);
  const blk = iceBlock(blockG, 0.64, 0.56, 0.6, [0, 0, 0], { mist: true, seed: 2 });
  const bowl = soupBowl(sg, [sbx, bTop + 0.02, sbz], 1.25);
  const steam = [0, 1, 2, 3].map((i) => puff(sg, [sbx + (i - 1.5) * 0.06, bTop + 0.3, sbz], 0.5, "#ffffff", 0.7));
  const poof = [0, 1, 2, 3, 4].map((i) => puff(sg, [sbx + 0.15 + (i - 2) * 0.1, bTop + 0.15, sbz + 0.25], 0.6, "#f4fbff", 0.85));
  const sp = sparkles(sg, 8, [sbx, bTop + 0.05, sbz], 0.7, 0.6, 0.7, 4, 0.3);
  // scupper spouts (ship-local, +z side)
  const scupM = lam("scupper", () => ({ color: "#3e2c30" }));
  const spouts = [-2.6, -0.6, 1.6, 3.4].map((x, i) => {
    const sc = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.06), scupM); sc.position.set(x, ship.deckY - 0.02, ship.W / 2 + 0.3); sg.add(sc);
    const g = new THREE.Group(); g.position.set(x, ship.deckY - 0.02, ship.W / 2 + 0.33); sg.add(g);
    const s = waterStream(g, [0, 0, 0], [0.15 * (i % 2 ? 1 : -1), -ship.deckY - 0.15, 1.0], 0.15, 0.07); return { g, s };
  });
  const splash = [-2.6, -0.6, 1.6, 3.4].map((x) => puff(sg, [x, 0.1, ship.W / 2 + 1.4], 0.8, "#ffffff", 0.6));
  const wk = wake(sg, ship.L, ship.W, 0.14);
  // ---- far: islands with palms, another sail, gulls ----
  hill(root, [-75, WY - 1, -140], 38, 14, 18, "#5aa04a"); hill(root, [-48, WY - 1, -158], 22, 22, 16, "#4e9444"); hill(root, [-120, WY - 1, -260], 50, 12, 20, "#62a650");
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(42, 46, 1.2, 40), lam("seaSand", () => ({ color: "#f2dca0" }))); sand.scale.set(1, 1, 0.5); sand.position.set(-68, WY - 0.5, -138); root.add(sand);
  const palms = [palm(root, [-92, WY, -130], 7, [0.6, 0], 11), palm(root, [-86, WY, -126], 8, [-0.8, 0.2], 12), palm(root, [-58, WY, -132], 6.5, [0.5, 0], 13)];
  const far = [sailBoat(root, [-40, WY - 0.3, -120], 0.4, 2.2, "#3a2c34", "#f6eedb", "#f2c230"), sailBoat(root, [90, WY - 0.3, -60], -2.6, 1.8, "#2a6fb0", "#fff3d6", "#f2f2f2")];
  const gulls = gullFlock(root, 4, [1, 11, 0], 6);
  const marks: Record<string, V3> = { tudorDeck: [PV.x, deckY, PV.z], soupBarrel: [sbx, deckY, sbz] };
  const cams = {
    ride: { pos: [9.5, 0.9, 10.5] as V3, look: [0.5, 4.2, 0] as V3, fov: 46 },
    deck: { pos: [0.65, 2.35, 5.0] as V3, look: [0.65, 2.0, 0.5] as V3, fov: 40 },
    wide: { pos: [17, 4, 25] as V3, look: [0, 4.2, 0] as V3, fov: 36 },
  };
  return {
    name: "sea", root, marks, cams,
    pose: (t, c) => {
      ship.pose(t, 0); braceSway(rig, t); wk(t); gulls(t); palms.forEach((p) => swayPalm(p, t, 0.6));
      far.forEach((f, i) => { f.rotation.z = Math.sin(t * 0.8 + i) * 0.05; f.position.y = WY - 0.3 + Math.sin(t + i) * 0.1; });
      // soup morph: block shrinks + vanishes in a cold poof, the bowl grows out of it
      const s = c.soup ?? 0, kb = 1 - sm(s / 0.55), kw = sm((s - 0.35) / 0.5);
      blockG.visible = kb > 0.01; blockG.scale.setScalar(Math.max(0.01, kb)); blk.set(0, t);
      bowl.visible = kw > 0.01; bowl.scale.setScalar(Math.max(0.01, kw));
      const pf = Math.sin(Math.PI * Math.min(1, Math.max(0, (s - 0.2) / 0.5)));
      risePuffs(poof, t, 0.25, 0.8, 1.3, pf); risePuffs(steam, t, 0.9, 0.35, 1.5, kw);
      sparkle(sp, t, kb);
      const k = sm(c.spout ?? 0);
      spouts.forEach((o, i) => { const kk = sm((c.spout ?? 0) * 1.5 - i * 0.12); o.g.visible = kk > 0.01; o.g.scale.setScalar(Math.max(0.01, kk) * (1 + 0.06 * Math.sin(t * 9 + i))); o.s.run(t + i * 0.4, kk); });
      risePuffs(splash, t, 0.5, 1.0, 1.4, k);
    },
  };
};
/** heave + pitch + roll around the rig pivot (the ship moves, never the camera) */
const braceSway = (rig: THREE.Group, t: number) => {
  rig.rotation.z = 0.022 * Math.sin(t * 0.9); rig.rotation.x = 0.014 * Math.sin(t * 0.7 + 1); rig.position.y = 1.25 + 0.05 * Math.sin(t * 0.9 + 0.6);
};
