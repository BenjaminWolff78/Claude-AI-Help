// The House of Commons chamber, 1875 (an original take, not a copy of any photo): green leather benches in tiers on
// both sides of a long carpeted floor, oak panelling, tall pointed windows letting in daylight, brass lamps, the table
// with the dispatch boxes and a canopied Speaker's chair on a dais at the far end (-z). Story controls: bill (the
// PLIMSOLL'S BILL paper: 1 in the Speaker's hand ... dropped into the basket by 0), papers (newspapers waving).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { planksHD, beamHD, ctex, rep, stoneHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, shaft, rod } from "../setkit";
import type { SetDef, V3 } from "./types";

const leatherTex = () => ctex("greenLeather", 512, 256, (g, r) => {
  g.fillStyle = "#2f6a48"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + r() * 0.05})`; g.fillRect(r() * 512, r() * 256, 2, 2); }
  for (let y = 32; y < 256; y += 64) for (let x = 32 + ((y / 64) % 2) * 32; x < 512; x += 64) {
    const gr = g.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - 22, y - 22, 44, 44);
    g.fillStyle = "#1f4a32"; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
  }
});
const carpetTex = () => ctex("commonsCarpet", 512, 512, (g, r) => {
  g.fillStyle = "#2b5e43"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c9a646"; g.lineWidth = 10; g.strokeRect(24, -10, 464, 540); g.lineWidth = 3; g.strokeRect(44, -10, 424, 540);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.025 + r() * 0.04})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  g.fillStyle = "rgba(201,166,70,0.5)"; for (let y = 40; y < 512; y += 80) for (let x = 120; x < 400; x += 90) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 12, y); g.lineTo(x, y + 14); g.lineTo(x - 12, y); g.fill(); }
});
const panelTex = () => ctex("oakPanel", 512, 512, (g, r) => {
  g.fillStyle = "#6e4426"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? "40,20,8" : "160,110,60"},${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 30, 170, x + (r() - 0.5) * 30, 340, x + (r() - 0.5) * 20, 512); g.stroke(); }
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "rgba(30,14,6,0.55)"; g.fillRect(x, 0, 6, 512); g.strokeStyle = "rgba(30,14,6,0.45)"; g.lineWidth = 5; g.strokeRect(x + 20, 30, 88, 200); g.strokeRect(x + 20, 270, 88, 210); g.strokeStyle = "rgba(220,170,110,0.25)"; g.lineWidth = 2; g.strokeRect(x + 24, 34, 80, 192); g.strokeRect(x + 24, 274, 80, 202); }
});
const windowTex = () => ctex("gothicWindow", 256, 512, (g) => {
  g.fillStyle = "#3a2a1c"; g.fillRect(0, 0, 256, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#fff8e6"); gr.addColorStop(1, "#dbe8f4"); g.fillStyle = gr;
  g.beginPath(); g.moveTo(24, 512); g.lineTo(24, 150); g.quadraticCurveTo(24, 30, 128, 14); g.quadraticCurveTo(232, 30, 232, 150); g.lineTo(232, 512); g.fill();
  g.strokeStyle = "#3a2a1c"; g.lineWidth = 8; for (const x of [85, 171]) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x, 120); g.stroke(); } for (const y of [200, 300, 400]) { g.beginPath(); g.moveTo(24, y); g.lineTo(232, y); g.stroke(); }
  g.lineWidth = 4; for (let y = 230; y < 512; y += 22) { g.beginPath(); g.moveTo(24, y); g.lineTo(232, y); g.globalAlpha = 0.25; g.stroke(); g.globalAlpha = 1; }
});
const billTex = () => ctex("plimsollBill", 384, 512, (g, r) => {
  g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 384, 512); for (let k = 0; k < 18; k++) { const gr = g.createRadialGradient(r() * 384, r() * 512, 0, r() * 384, r() * 512, 60); gr.addColorStop(0, "rgba(150,110,60,0.10)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 384, 512); }
  g.fillStyle = "#2a1a12"; g.textAlign = "center"; g.font = "900 46px Georgia, serif"; g.fillText("PLIMSOLL'S", 192, 90); g.fillText("BILL", 192, 142);
  g.font = "italic 26px Georgia, serif"; g.fillText("Merchant Shipping", 192, 190); g.fillStyle = "rgba(40,26,18,0.55)"; for (let y = 230; y < 470; y += 22) g.fillRect(48, y, 288 - (y % 3) * 20, 5);
  g.strokeStyle = "#a8261e"; g.lineWidth = 12; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(40, 470); g.lineTo(344, 230); g.stroke(); g.globalAlpha = 1;
});

export const commons = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const oak = lam("commonsOak", () => ({ map: panelTex() })), floorW = lam("commonsFloor", () => ({ map: rep(planksHD(), 2, 4), color: "#a87c56" }));
  const leather = lam("greenLeather", () => ({ map: leatherTex() })), beamM = lam("commonsBeam", () => ({ map: beamHD(), color: "#7a5236" }));
  // floor + the carpeted aisle
  b.add(quad(V(-9, 0, 8), V(9, 0, 8), V(9, 0, -16), V(-9, 0, -16), 4, 6), floorW);
  b.add(quad(V(-2.1, 0.012, 8), V(2.1, 0.012, 8), V(2.1, 0.012, -13), V(-2.1, 0.012, -13), 1, 4), lam("commonsCarpet", () => ({ map: carpetTex() })));
  // the benches: 4 tiers per side, each a riser + seat + back
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const x0 = s * (2.5 + k * 1.05), y0 = k * 0.42;
    b.add(boxGeo(V(Math.min(x0, x0 + s * 1.05), 0, -10.5), V(Math.max(x0, x0 + s * 1.05), y0 + 0.02, 5.5), 2), oak);
    b.add(boxGeo(V(Math.min(x0 + s * 0.05, x0 + s * 0.65), y0 + 0.02, -10.4), V(Math.max(x0 + s * 0.05, x0 + s * 0.65), y0 + 0.46, 5.4), 1), leather);
    b.add(boxGeo(V(Math.min(x0 + s * 0.62, x0 + s * 0.78), y0 + 0.4, -10.4), V(Math.max(x0 + s * 0.62, x0 + s * 0.78), y0 + 1.02, 5.4), 1), leather);
  }
  // rounded leather rolls on every seat front and back top + brass studs, so the benches read as upholstered, not slabs
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const x0 = s * (2.5 + k * 1.05), y0 = k * 0.42;
    b.add(new THREE.CylinderGeometry(0.075, 0.075, 15.8, 14).rotateX(Math.PI / 2).translate(x0 + s * 0.08, y0 + 0.44, -2.5), leather);
    b.add(new THREE.CylinderGeometry(0.09, 0.09, 15.8, 14).rotateX(Math.PI / 2).translate(x0 + s * 0.7, y0 + 1.02, -2.5), leather);
    for (let z = -10.2; z <= 5.2; z += 0.5) b.add(new THREE.SphereGeometry(0.022, 8, 6).translate(x0 + s * 0.02, y0 + 0.37, z), lam("brass", () => ({ color: "#c9a646" })));
  }
  // the table: a rounded oak edge and turned legs at the corners
  for (const x of [-0.78, 0.78]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 4.32, 12).rotateX(Math.PI / 2).translate(x, 0.88, -6.5), oak);
  for (const [x, z] of [[-0.68, -8.5], [0.68, -8.5], [-0.68, -4.5], [0.68, -4.5]]) b.add(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 12).translate(x, 0.15, z), oak);
  // walls: oak panelling to 4.2 m, stone above with tall pointed windows; the far wall behind the Speaker; ceiling beams
  const stone = lam("commonsStone", () => ({ map: stoneHD("commonsStoneHD", ["#cfc4b0", "#c6baa5", "#d6ccb9", "#bfb39e"], "#9e927e") }));
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(s > 0 ? 7.3 : -7.6, 0, -16), V(s > 0 ? 7.6 : -7.3, 4.2, 8), 3), oak);
    b.add(boxGeo(V(s > 0 ? 7.3 : -7.6, 4.2, -16), V(s > 0 ? 7.6 : -7.3, 10, 8), 3), stone);
  }
  b.add(boxGeo(V(-7.6, 0, -16.3), V(7.6, 10, -16), 3), oak);
  b.add(boxGeo(V(-7.6, 0, 8), V(7.6, 10, 8.3), 3), oak);
  for (let z = -15; z <= 7; z += 2.2) b.add(boxGeo(V(-7.6, 9.6, z - 0.15), V(7.6, 10.0, z + 0.15), 2), beamM);
  b.add(boxGeo(V(-7.6, 10, -16.3), V(7.6, 10.3, 8.3), 2), beamM);
  const winM = new THREE.MeshBasicMaterial({ map: windowTex(), color: new THREE.Color(1.6, 1.55, 1.45) });
  for (const s of [-1, 1]) for (let z = -13; z <= 5; z += 3.6) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.6), winM); w.position.set(s * 7.28, 6.6, z); w.rotation.y = -s * Math.PI / 2; root.add(w); }
  for (let z = -13; z <= 5; z += 3.6) shaft(root, [-7.2, 7.4, z], [-1.5, 0.2, z + 1.4], 1.4, "#fff2d4", 0.12);
  // the gallery rail at the back (+z) and the bar of the House
  b.add(boxGeo(V(-7.3, 4.4, 5.8), V(7.3, 4.6, 6.2), 1), beamM); b.add(boxGeo(V(-7.3, 3.4, 5.9), V(7.3, 4.4, 6.0), 1), oak);
  // the table + dispatch boxes + papers
  b.add(boxGeo(V(-0.75, 0, -8.6), V(0.75, 0.86, -4.4), 1), oak);
  b.add(boxGeo(V(-0.8, 0.86, -8.65), V(0.8, 0.9, -4.35), 1), lam("tableCloth", () => ({ color: "#2b5e43" })));
  for (const s of [-1, 1]) { b.add(boxGeo(V(s * 0.55 - 0.2, 0.9, -6.9), V(s * 0.55 + 0.2, 1.14, -6.1), 1), lam("dispatchBox", () => ({ map: beamHD(), color: "#5a3820" }))); b.add(boxGeo(V(s * 0.55 - 0.21, 1.14, -6.92), V(s * 0.55 + 0.21, 1.17, -6.08), 1), lam("brass", () => ({ color: "#c9a646" }))); }
  for (let i = 0; i < 6; i++) b.add(boxGeo(V(-0.5 + (i % 3) * 0.32, 0.9, -5.4 - Math.floor(i / 3) * 0.5), V(-0.3 + (i % 3) * 0.32, 0.96 + (i % 2) * 0.03, -5.1 - Math.floor(i / 3) * 0.5), 1), lam("books", () => ({ color: i % 2 ? "#7a2a24" : "#2a3a5a" })));
  // the Speaker's chair on its dais: tall carved back with a canopy and a pinnacle
  b.add(boxGeo(V(-1.6, 0, -15.6), V(1.6, 0.5, -12.6), 1), oak);
  b.add(boxGeo(V(-0.85, 0.5, -14.6), V(0.85, 1.05, -13.6), 1), leather);
  b.add(boxGeo(V(-0.95, 0.5, -15.1), V(0.95, 3.6, -14.6), 1), oak);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * 0.95 - 0.12, 0.5, -15.1), V(s * 0.95 + 0.12, 1.6, -13.4), 1), oak);
  b.add(boxGeo(V(-1.2, 3.6, -15.4), V(1.2, 3.9, -13.4), 1), beamM);
  b.add(new THREE.ConeGeometry(0.9, 1.6, 4).rotateY(Math.PI / 4).translate(0, 4.7, -14.4), beamM);
  b.add(new THREE.ConeGeometry(0.08, 0.5, 6).translate(0, 5.7, -14.4), lam("brass", () => ({ color: "#c9a646" })));
  const royal = ctex("commonsCrest", 256, 256, (g) => { g.fillStyle = "#6e4426"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#c9a646"; g.beginPath(); g.moveTo(128, 28); g.lineTo(212, 70); g.lineTo(200, 170); g.lineTo(128, 230); g.lineTo(56, 170); g.lineTo(44, 70); g.closePath(); g.fill(); g.fillStyle = "#8a2a24"; g.fillRect(84, 90, 88, 80); g.fillStyle = "#c9a646"; g.fillRect(124, 90, 8, 80); g.fillRect(84, 126, 88, 8); });
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), lam("commonsCrest", () => ({ map: royal }))); crest.position.set(0, 2.7, -14.58); root.add(crest);
  // brass wall lamps (warm pools) + a waste-paper basket by the chair
  const lamps = [[-7.2, 3.6, -9], [-7.2, 3.6, -2], [7.2, 3.6, -9], [7.2, 3.6, -2], [-1.4, 2.6, -15.9], [1.4, 2.6, -15.9]].map(([x, y, z]) => lamp(root, [x, y, z], "#ffc070", 7, 7, "wall"));
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 14, 1, true), lam("basket", () => ({ map: rep(beamHD(), 2, 1), color: "#a07a48", side: THREE.DoubleSide }))); basket.position.set(1.15, 0.71, -12.9); root.add(basket);
  // the bill (a paper that falls from the Speaker's hand into the basket)
  const bill = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), lam("bill", () => ({ map: billTex(), side: THREE.DoubleSide }))); root.add(bill);
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.userData.noCast = true; });
  void rod; void NOINK;

  const marks: Record<string, V3> = { speaker: [0, 0.5, -13.9], aisleFar: [0, 0, -11.2], aisleMid: [0, 0, -3.0], aisleNear: [0, 0, 3.0], table: [0, 0, -6.5] };
  /** MP seats: [x, y(seat), z] per tier and side */
  const seat = (side: number, tier: number, z: number): V3 => [side * (2.5 + tier * 1.05 + 0.35), tier * 0.42 + 0.46, z];
  const cams = {
    aisle: { pos: [0, 1.7, 5.5] as V3, look: [0, 1.6, -12] as V3, fov: 46 },
    speaker: { pos: [-1.4, 1.6, -9.2] as V3, look: [0.2, 1.6, -13.8] as V3, fov: 42 },
  };
  return {
    name: "commons", root, marks: { ...marks, s1: seat(-1, 0, -2), s2: seat(-1, 1, -3), s3: seat(1, 0, -4), s4: seat(1, 1, -1) }, cams,
    pose: (t, c) => {
      lamps.forEach((l) => flicker(l, t));
      // bill: 1 = held up by the Speaker (near his right hand), 0 = in the basket; in between it flutters down
      const k = c.bill ?? 1, fall = 1 - k;
      const hx = c.billX ?? 0.45, hy = c.billY ?? 1.75, hz = c.billZ ?? -13.4;
      bill.position.set(THREE.MathUtils.lerp(hx, 1.15, fall), THREE.MathUtils.lerp(hy, 0.95, fall) + 0.08 * Math.sin(fall * Math.PI * 3), THREE.MathUtils.lerp(hz, -12.9, fall));
      bill.rotation.set(-0.2 + fall * 1.2, Math.sin(fall * 9) * 0.6, Math.sin(fall * 7) * 0.5); bill.visible = (c.billOn ?? 1) > 0.5 && fall < 0.97;
    },
  };
};
