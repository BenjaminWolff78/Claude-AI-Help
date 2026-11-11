// The 1833 voyage as an in-world cutaway diorama at sea: the brig TUSCANY cut open on the camera side (+z), the hold
// packed with big ice blocks in golden sawdust, a lantern and a wall calendar whose BIG month flips (c.month 0..3 =
// JUN JUL AUG SEP). The sea is cut too (a translucent deep-blue section in front of the hull). A red-and-white EQUATOR
// buoy and a red dashed line across the water at x = 0; the ship rides at x = c.shipX (-6 .. +6).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, beamHD, planksHD } from "../paint";
import { type Ice, brig, lamp, flicker, glow, iceBlock, waterPlane, sawdustTex, barrel, ropeCoil, sign } from "../setkit";
import { gullFlock, hill, sm, TAU, fitText } from "./portkit_common";
import { braceYards, wake, stripLids, buoy } from "./portkit_ship";
import type { SetDef, V3 } from "./types";

const MONTHS = ["JUN", "JUL", "AUG", "SEP"];
const calTex = (i: number) => ctex("calendar" + i, 512, 640, (g, r) => {
  g.fillStyle = "#fbf3df"; g.fillRect(0, 0, 512, 640);
  for (let k = 0; k < 14; k++) { const gr = g.createRadialGradient(r() * 512, r() * 640, 0, r() * 512, r() * 640, 90); gr.addColorStop(0, "rgba(170,130,70,0.10)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 640); }
  g.fillStyle = "#c8352e"; g.fillRect(0, 0, 512, 92); g.fillStyle = "#fbf3df"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "1833", 256, 50, 300, 58);
  g.fillStyle = "#2a1a14"; fitText(g, MONTHS[i], 256, 205, 470, 190);
  g.strokeStyle = "rgba(60,40,30,0.7)"; g.lineWidth = 3; g.strokeRect(14, 14, 484, 612);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
    const px = 36 + x * 64, py = 330 + y * 56; g.strokeStyle = "rgba(60,40,30,0.55)"; g.lineWidth = 2; g.strokeRect(px, py, 56, 48);
    if (y * 7 + x < 10 + i * 4) { g.strokeStyle = "#c8352e"; g.lineWidth = 5; g.beginPath(); g.moveTo(px + 8, py + 8); g.lineTo(px + 48, py + 40); g.moveTo(px + 48, py + 8); g.lineTo(px + 8, py + 40); g.stroke(); }
  }
  for (const x of [150, 362]) { g.fillStyle = "#6b5a4e"; g.beginPath(); g.arc(x, 20, 12, 0, TAU); g.fill(); }
});
const sectionRimTex = () => ctex("sectionRim", 256, 256, (g, r) => {
  g.fillStyle = "#ecd3a2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.strokeStyle = r() < 0.5 ? "rgba(170,120,70,0.35)" : "rgba(255,245,220,0.4)"; g.lineWidth = 1.5; g.beginPath(); const y = r() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + (r() - 0.5) * 10, 170, y + (r() - 0.5) * 10, 256, y); g.stroke(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(120,80,40,0.5)"; g.fillRect(0, i * 43, 256, 3); }
});
const seaSectionTex = () => ctex("seaSection", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#36a7d8"); gr.addColorStop(0.12, "#1f86c6"); gr.addColorStop(0.6, "#145ea6"); gr.addColorStop(1, "#0f3f80");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) { const x = r() * 512; const rg = g.createLinearGradient(x, 0, x + 60, 512); rg.addColorStop(0, "rgba(120,200,255,0.18)"); rg.addColorStop(1, "rgba(120,200,255,0)"); g.fillStyle = rg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 140, 512); g.lineTo(x + 60, 512); g.fill(); }
  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 512, rr = 2 + r() * 6; g.strokeStyle = "rgba(220,245,255,0.7)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); }
  for (let i = 0; i < 6; i++) { // little fish
    const x = r() * 480 + 16, y = 120 + r() * 360, s = 8 + r() * 8; g.fillStyle = ["#f2a03a", "#f2d16a", "#e8634a"][i % 3];
    g.beginPath(); g.ellipse(x, y, s * 1.6, s, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - s * 1.4, y); g.lineTo(x - s * 2.6, y - s); g.lineTo(x - s * 2.6, y + s); g.fill();
    g.strokeStyle = "rgba(20,30,60,0.7)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, s * 1.6, s, 0, 0, TAU); g.stroke(); g.fillStyle = "#1a2030"; g.beginPath(); g.arc(x + s * 0.8, y - s * 0.2, 2, 0, TAU); g.fill();
  }
  g.fillStyle = "rgba(255,255,255,0.75)"; g.fillRect(0, 0, 512, 6); // surface line
});

export const voyage = (): SetDef => {
  const root = new THREE.Group();
  const WY = 0, ZC = 0.36; // sea level, z of the sea section (cut) face
  waterPlane(root, -400, 400, -500, -1.98, WY); // the strip under the hull rides with the ship (below)
  const sec = new THREE.Mesh(new THREE.PlaneGeometry(120, 6), new THREE.MeshBasicMaterial({ map: seaSectionTex(), transparent: true, opacity: 0.72, depthWrite: false }));
  (sec.material.map as THREE.Texture).repeat.set(10, 1); sec.position.set(0, WY - 3, ZC); sec.renderOrder = 3; root.add(sec);
  const secLip = new THREE.Mesh(new THREE.BoxGeometry(120, 0.08, 0.06), lam("seaLip", () => ({ color: "#bff0ff" }))); secLip.position.set(0, WY - 0.03, ZC); root.add(secLip);
  // ---- equator: red dashed line on the water + down the section, buoy with sign ----
  const red = new THREE.MeshBasicMaterial({ color: "#e0352c" });
  for (let z = ZC - 0.6; z > -90; z -= 1.7) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.0).rotateX(-Math.PI / 2), red); d.position.set(0, WY + 0.03, z); d.renderOrder = 2; root.add(d); }
  for (let y = -0.4; y > -5.5; y -= 0.9) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.55), red); d.position.set(0, WY + y, ZC + 0.01); d.renderOrder = 4; root.add(d); }
  const by = buoy(root, [0, WY + 0.15, -4.6], 1.3);
  const bsign = sign(root, "EQUATOR", 2.6, 0.62, [0, 3.35, -4.6], 0, "#fff3d6", "#c8352e");
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), lam("bpole", () => ({ color: "#4b5468" }))); pole.position.set(0, 2.55, -4.6); root.add(pole);
  // ---- ship (cutaway) on a rig moved by shipX ----
  const rig = new THREE.Group(); root.add(rig);
  const strips = new THREE.Group(); root.add(strips);
  for (const [a, c] of [[-400, -5.68], [6.35, 400]]) waterPlane(strips, a, c, -1.98, ZC, WY);
  const ship = brig(rig, "TUSCANY", { sails: "set", cutaway: true }); ship.g.position.y = WY - 0.05;
  braceYards(ship, -0.5);
  const sg = ship.g, hullCol = "#4a3226";
  const hullMesh = sg.children.find((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.type === "ExtrudeGeometry") as THREE.Mesh;
  if (hullMesh) stripLids(hullMesh);
  sg.children.forEach((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry.type === "ShapeGeometry") m.visible = false; }); // the cream cut face
  // the trim band + waterline stripe boxes would cross the open hold: hide them, re-paint them on the section face
  sg.children.forEach((o) => { const m = o as THREE.Mesh; const pr = (m.geometry as THREE.BoxGeometry)?.parameters as { width?: number; height?: number } | undefined; if (m.isMesh && m.geometry.type === "BoxGeometry" && pr && (pr.width ?? 0) > 11 && (pr.height ?? 1) < 0.35) m.visible = false; });
  // section face: the hull outline (same shape as brig()) with the hold cut out, + a cream rim of cut planking
  const L = ship.L, H = 2.0;
  const outline = () => { const s = new THREE.Shape(); s.moveTo(-L / 2, H * 0.55); s.lineTo(L / 2 - 0.4, H * 0.62); s.quadraticCurveTo(L / 2 + 0.6, H * 0.7, L / 2 + 1.0, H * 1.0); s.quadraticCurveTo(L / 2 - 0.2, -H * 0.3, L / 2 - 1.8, -H * 0.45); s.lineTo(-L / 2 + 0.7, -H * 0.45); s.quadraticCurveTo(-L / 2 - 0.15, -H * 0.2, -L / 2, H * 0.55); return s; };
  const X0 = -2.9, X1 = 4.3, Y0 = -0.55, Y1 = 0.94, ZB = -1.25, ZF = 0.3;
  const cav = (e: number) => { const p = new THREE.Path(); p.moveTo(X0 - e, Y1 + e); p.lineTo(X0 - e, Y0 + 0.25); p.quadraticCurveTo(X0 - e, Y0 - e, X0 + 0.5, Y0 - e); p.lineTo(X1 - 0.6, Y0 - e); p.quadraticCurveTo(X1 + e, Y0 - e, X1 + e, Y0 + 0.3); p.lineTo(X1 + e, Y1 + e); p.closePath(); return p; };
  const face = outline(); face.holes.push(cav(0.11));
  const fg = new THREE.ShapeGeometry(face, 12); const fuv = fg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) / 6, fuv.getY(i) / 3);
  const faceM = new THREE.Mesh(fg, lam("hull" + hullCol, () => ({ color: "#ffffff" }))); faceM.position.z = ZF; faceM.receiveShadow = true; sg.add(faceM);
  const rimShape = new THREE.Shape(cav(0.11).getPoints(24)); rimShape.holes = [new THREE.Path(cav(0).getPoints(24))];
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(rimShape, 12), lam("secRim", () => ({ map: sectionRimTex() }))); rim.position.z = ZF + 0.01; sg.add(rim);
  for (const [y0, y1, col] of [[0.73, 0.87, "#d4a72c"], [0.05, 0.35, "#2a2633"]] as [number, number, string][]) {
    for (const [xa, xb] of [[-5.6, X0 - 0.2], [X1 + 0.2, 5.4]]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, y1 - y0), lam("secBand" + col, () => ({ color: col }))); st.position.set((xa + xb) / 2, (y0 + y1) / 2, ZF + 0.015); sg.add(st); }
  }
  // hold interior: back wall, floor, ceiling + deck beams, bulkheads, ribs
  const hb = new Batch();
  const wallM = lam("holdWall", () => ({ map: beamHD() })), floorM = lam("holdFloor", () => ({ map: planksHD() }));
  hb.add(quad(V(X0, Y0, ZB), V(X1, Y0, ZB), V(X1, Y1, ZB), V(X0, Y1, ZB), (X1 - X0) / 3, (Y1 - Y0) / 1), wallM);
  hb.add(quad(V(X0, Y0, ZF), V(X1, Y0, ZF), V(X1, Y0, ZB), V(X0, Y0, ZB), (X1 - X0) / 2, 0.8), floorM);
  hb.add(quad(V(X0, Y1, ZB), V(X1, Y1, ZB), V(X1, Y1, ZF), V(X0, Y1, ZF), (X1 - X0) / 2, 0.8), floorM);
  hb.add(quad(V(X0, Y0, ZF), V(X0, Y0, ZB), V(X0, Y1, ZB), V(X0, Y1, ZF), 0.5, 0.6), wallM);
  hb.add(quad(V(X1, Y0, ZB), V(X1, Y0, ZF), V(X1, Y1, ZF), V(X1, Y1, ZB), 0.5, 0.6), wallM);
  const beamM = lam("holdBeam", () => ({ map: beamHD() }));
  for (let x = X0 + 0.6; x < X1; x += 1.2) { hb.add(boxGeo(V(x - 0.08, Y1 - 0.16, ZB), V(x + 0.08, Y1, ZF)), beamM); hb.add(boxGeo(V(x - 0.07, Y0, ZB), V(x + 0.07, Y1, ZB + 0.1)), beamM); }
  // ---- cargo: 2 rows x 4 big blocks bedded in sawdust (left), an aisle with the calendar + lantern (right) ----
  const dustM = lam("holdDust", () => ({ map: sawdustTex() }));
  const CX = 2.35; // right edge of the cargo
  hb.add(boxGeo(V(X0, Y0, ZB), V(CX, 0.8, -0.02), 1.2), dustM);
  for (let i = 0; i < 9; i++) { const x = X0 + 0.4 + i * ((CX - X0 - 0.8) / 8); hb.add(new THREE.SphereGeometry(0.42, 12, 8).scale(1.3, 0.2, 1).translate(x, 0.8, -0.55), dustM); }
  hb.add(new THREE.SphereGeometry(0.5, 12, 8).scale(1.0, 0.5, 1.2).translate(CX + 0.05, Y0, -0.6), dustM); // spill into the aisle
  hb.build(sg);
  const blocks: Ice[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) blocks.push(iceBlock(sg, 0.95, 0.6, 0.92, [X0 + 0.75 + i * 1.22, Y0 + 0.06 + row * 0.68, -0.44], { seed: row * 4 + i, mist: row === 1 && i % 2 === 0 }));
  // aisle props
  barrel(sg, [3.85, Y0, -0.75], 0.3, 0.4); ropeCoil(sg, [3.0, Y0, -0.1], 0.3);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 14, 1, true), lam("bucket", () => ({ color: "#8a5a34", side: THREE.DoubleSide }))); bucket.position.set(2.85, Y0 + 0.15, -0.75); sg.add(bucket);
  const shovel = new THREE.Group(); shovel.position.set(2.5, Y0, -1.0); shovel.rotation.z = 0.3; sg.add(shovel);
  const sh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6).translate(0, 0.75, 0), lam("holdBeam", () => ({ map: beamHD() }))); shovel.add(sh1);
  const sh2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.02).translate(0, 0.14, 0), lam("pkIron", () => ({ color: "#4b5468" }))); shovel.add(sh2);
  const holdLamp = lamp(sg, [3.95, 0.5, -0.35], "#ffb45a", 12, 7, "hang"), holdLamp2 = lamp(sg, [-0.9, 0.55, 0.0], "#ffb45a", 7, 7, "hang");
  const fill = new THREE.PointLight("#ffc27a", 4, 7, 1.2); fill.position.set(0.6, 0.4, 0.25); sg.add(fill);
  // calendar on the back wall (unlit paper so the month always reads), page flips about its top edge
  const cal = new THREE.Group(); cal.position.set(3.1, 0.86, ZB + 0.03); sg.add(cal);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.2, 0.03).translate(0, -0.55, 0), lam("calBoard", () => ({ map: beamHD() }))); cal.add(board);
  const pageG = new THREE.PlaneGeometry(0.86, 1.075).translate(0, -0.56, 0);
  const pageMats = MONTHS.map((_, i) => new THREE.MeshBasicMaterial({ map: calTex(i), color: "#f3e6cc", side: THREE.DoubleSide }));
  const under = new THREE.Mesh(pageG, pageMats[0]); under.position.z = 0.02; cal.add(under);
  const flip = new THREE.Group(); flip.position.z = 0.03; cal.add(flip);
  const top = new THREE.Mesh(pageG, pageMats[0]); flip.add(top);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), lam("pkIron", () => ({ color: "#4b5468" }))); nail.position.set(0, 0.02, 0.04); cal.add(nail);
  // wake + gulls + far islands
  const wk = wake(sg, ship.L, ship.W, 0.14, [-1]);
  const gulls = gullFlock(root, 4, [0, 11, -3], 7);
  hill(root, [-90, WY - 1, -220], 46, 12, 20, "#5aa04a"); hill(root, [120, WY - 1, -260], 60, 16, 24, "#62a650");
  const glowHold = glow(sg, [3.95, 0.53, -0.3], "#ffb45a", 1.4, 0.6);
  const marks: Record<string, V3> = { sailor1: [1.0, ship.deckY + 0.06 + WY - 0.05, -0.85], sailor2: [3.25, ship.deckY + 0.06 + WY - 0.05, -0.9], calendar: [3.1, 0.3, ZB], hold: [0.7, 0.2, -0.4], buoy: [0, WY, -4.6] };
  const cams = {
    side: { pos: [2.35, 1.25, 8.4] as V3, look: [2.35, 1.15, -0.6] as V3, fov: 40 },
    close: { pos: [2.95, 0.45, 3.0] as V3, look: [3.05, 0.3, -1.0] as V3, fov: 40 },
    wide: { pos: [6, 3.0, 22] as V3, look: [0, 2.6, -2] as V3, fov: 44 },
  };
  return {
    name: "voyage", root, marks, cams,
    pose: (t, c) => {
      const sx = c.shipX ?? 0;
      rig.position.set(sx, 0.04 * Math.sin(t * 0.9), 0); strips.position.x = sx; rig.rotation.z = 0.012 * Math.sin(t * 0.9 + 0.5);
      ship.pose(t, 0); flicker(holdLamp, t); flicker(holdLamp2, t + 3); wk(t); gulls(t);
      (glowHold.material as THREE.SpriteMaterial).opacity = 0.5 + 0.1 * Math.sin(t * 7);
      blocks.forEach((bk, i) => bk.set(0, t + i));
      by.position.y = WY + 0.15 + Math.sin(t * 1.3) * 0.08; by.rotation.z = Math.sin(t * 1.1) * 0.06; bsign.position.y = 3.35 + Math.sin(t * 1.3) * 0.08; pole.position.y = 2.55 + Math.sin(t * 1.3) * 0.08;
      const m = Math.max(0, Math.min(3, c.month ?? 0)), i = Math.min(3, Math.floor(m)), u = sm((m - i) / 0.85);
      top.material = pageMats[i]; under.material = pageMats[Math.min(3, i + 1)];
      flip.rotation.x = -u * Math.PI * 0.92; flip.visible = !(i === 3);
      if (i === 3) under.material = pageMats[3];
    },
  };
};
