// THE WORKS (scenes 4-5): the engineer's design office looking through a big glass partition onto the factory floor.
// OFFICE x -6..-1.2, z -3..3 (window wall at x = -1.2, door at z 1.8..2.8): a tilted DRAFTING BOARD with the drawing
// that appears under his pencil (`draw` 0..1: car outline, then the soft nose + soft tail pleats with "SOFT", then the
// yellow STEEL CAGE box), a green banker's desk lamp + an anglepoise over the board, a pin board with sketches, a coat
// stand, a filing cabinet, a model car on a shelf, a coffee mug, venetian blinds.
// FACTORY FLOOR x -1.2..10, z -5..6, skylights: THE PAPER CAR prototype on the floor (yaw PI: its driver's door faces the
// office), a hoist with a hook, a workbench with tools, welding sparks (a mechanic), stacked tyres, a sign
// "PROTOTYPE - DO NOT TOUCH", tall windows, hanging lamps. `paint` brushes PAPER CAR onto the door; `night` 0..1 turns
// the floor dark blue with one work lamp over the car (scene 5).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep } from "../paint";
import { glow, rod } from "../setkit";
import { metal, motes, boardsV } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { col, shiny, SANS } from "./desertkit";
import { sedan, CAGE_YELLOW } from "./sedan";
import { concreteTex } from "./crashhall";
import type { SetDef, SetBuilder, V3 } from "./types";

const TAU = Math.PI * 2;
/** the drawing on the board, revealed by k (0..1) as pencil strokes (quantised so the texture cache stays small) */
const drawingTex = (k: number) => ctex("wkDraw" + Math.round(k * 30), 1024, 768, (g) => {
  g.fillStyle = "#f6f1e2"; g.fillRect(0, 0, 1024, 768);
  g.strokeStyle = "rgba(120,150,190,0.25)"; g.lineWidth = 1; for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 768); g.stroke(); } for (let y = 0; y < 768; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  const seg = (a: number, b: number) => Math.max(0, Math.min(1, (k - a) / (b - a)));
  const path = (pts: [number, number][], t: number, w = 7, c = "#2a2a3a") => { if (t <= 0) return; const n = Math.max(2, Math.ceil(pts.length * t)); g.strokeStyle = c; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); for (let i = 0; i < n; i++) { const [x, y] = pts[Math.min(i, pts.length - 1)]; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
  // car side outline (body + greenhouse + wheels)
  const body: [number, number][] = []; for (let i = 0; i <= 40; i++) { const x = 120 + i * 20; body.push([x, 420 - (i > 4 && i < 36 ? 10 : 0)]); }
  const out: [number, number][] = [[110, 520], [110, 430], [130, 410], [900, 410], [920, 430], [920, 520], [110, 520]];
  path(out, seg(0, 0.18));
  path([[330, 410], [400, 300], [640, 300], [720, 410]], seg(0.12, 0.26));
  for (const cx of [250, 780]) { const c: [number, number][] = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; c.push([cx + Math.cos(a) * 58, 520 + Math.sin(a) * 58]); } path(c, seg(0.2, 0.32)); }
  // soft nose + soft tail: zig-zag pleats, "SOFT" labels with arrows
  const zig = (x0: number, x1: number): [number, number][] => { const p: [number, number][] = []; for (let i = 0; i <= 8; i++) p.push([x0 + ((x1 - x0) * i) / 8, i % 2 ? 440 : 500]); return p; };
  path(zig(730, 905), seg(0.36, 0.5), 6, "#c8352e"); path(zig(125, 300), seg(0.48, 0.62), 6, "#c8352e");
  g.fillStyle = "#c8352e"; g.textAlign = "center"; g.textBaseline = "middle";
  if (k > 0.44) fitText(g, "SOFT", 820, 610, 160, 54, SANS); if (k > 0.58) fitText(g, "SOFT", 210, 610, 160, 54, SANS);
  // the STEEL CAGE: a thick yellow box round the passenger cell + label
  const cage = seg(0.7, 0.88);
  if (cage > 0) { g.strokeStyle = CAGE_YELLOW; g.lineWidth = 16; g.lineJoin = "round"; const p: [number, number][] = [[320, 520], [320, 410], [395, 290], [650, 290], [730, 410], [730, 520], [320, 520]]; path(p, cage, 16, CAGE_YELLOW); }
  if (k > 0.86) { g.fillStyle = "#2a2a3a"; fitText(g, "STEEL CAGE", 525, 210, 360, 64, SANS); g.strokeStyle = "#2a2a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(525, 240); g.lineTo(525, 285); g.stroke(); }
  // title block
  g.strokeStyle = "#2a2a3a"; g.lineWidth = 4; g.strokeRect(700, 660, 300, 90); g.fillStyle = "#2a2a3a"; g.textAlign = "left"; g.font = "700 30px Georgia"; g.fillText("SAFETY BODY", 716, 692); g.font = "400 24px Georgia"; g.fillText("SHEET 1 OF 1", 716, 730);
});

export const works: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const PX = -1.2;                                    // the glass partition
  // floors: office wood, factory concrete
  { const of = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.4).rotateX(-Math.PI / 2), lam("wkWood", () => ({ map: rep(boardsV("wkFloor", "#8a5a32", 0.35), 2, 2) }))); of.position.set(-3.6, 0.001, 0); of.receiveShadow = true; root.add(of);
    const ff = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 11).rotateX(-Math.PI / 2), lam("wkConc", () => ({ map: rep(concreteTex("Wk", "#b0a99c"), 3, 3) }))); ff.position.set(4.6, 0, 0.5); ff.receiveShadow = true; root.add(ff); }
  // office walls (warm cream + wood dado), ceiling
  const cream = lam("wkCream", () => ({ color: "#efe1c0" })), dado = lam("wkDado", () => ({ color: "#7a4a2a" })), steel = metal("wkSteel", "#4a5a74", 40);
  const owall = (x0: number, z0: number, x1: number, z1: number) => { b.add(boxGeo(V(x0, 0, z0), V(x1, 1.0, z1), 1), dado); b.add(boxGeo(V(x0, 1.0, z0), V(x1, 3.2, z1), 1), cream); };
  owall(-6.2, -3.2, PX, -3.0); owall(-6.2, -3.0, -6.0, 3.2); owall(-6.2, 3.0, PX, 3.2);
  b.add(boxGeo(V(-6.2, 3.2, -3.2), V(PX, 3.35, 3.2)), lam("wkCeil", () => ({ color: "#e8dcc0" })));
  // the partition: low wood wall, steel-framed glass, door frame at z 1.8..2.8
  b.add(boxGeo(V(PX - 0.1, 0, -3.0), V(PX + 0.02, 0.95, 1.8), 1), dado);
  b.add(boxGeo(V(PX - 0.1, 2.75, -3.0), V(PX + 0.02, 3.2, 3.0), 1), cream);
  for (let z = -3.0; z <= 1.81; z += 1.2) b.add(boxGeo(V(PX - 0.08, 0.95, z - 0.03), V(PX, 2.75, z + 0.03)), steel);
  b.add(boxGeo(V(PX - 0.08, 0.95, -3.0), V(PX, 1.0, 1.8)), steel); b.add(boxGeo(V(PX - 0.08, 2.7, -3.0), V(PX, 2.75, 3.0)), steel);
  for (const z of [1.8, 2.85]) b.add(boxGeo(V(PX - 0.1, 0, z - 0.04), V(PX + 0.02, 2.75, z + 0.04)), steel);
  { const gm = new THREE.MeshPhongMaterial({ color: "#bfe0f0", transparent: true, opacity: 0.12, depthWrite: false, shininess: 120 }); const gp = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.75), gm); gp.position.set(PX - 0.04, 1.85, -0.6); gp.rotation.y = Math.PI / 2; root.add(gp); }
  // "DESIGN OFFICE" door sign + blinds (raised) at the top of the glass
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), new THREE.MeshBasicMaterial({ map: ctex("wkDoorSign", 512, 112, (g) => { g.fillStyle = "#2f4a6a"; g.fillRect(0, 0, 512, 112); g.fillStyle = "#f4ead0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "DESIGN OFFICE", 256, 58, 470, 64, SANS); }) })); m.position.set(PX + 0.03, 2.95, 2.33); m.rotation.y = Math.PI / 2; root.add(m); }
  for (let z = -2.9; z < 1.8; z += 0.06) b.add(boxGeo(V(PX - 0.13, 2.45, z), V(PX - 0.11, 2.7, z + 0.05)), lam("wkBlind", () => ({ color: "#e8dcc0" })));
  // THE DRAFTING BOARD (tilted ~35 deg, facing +x toward the window), stool, lamps
  const DB: V3 = [-3.6, 0, -1.2];
  const board = new THREE.Group(); board.position.set(DB[0], 1.05, DB[2]); board.rotation.set(0, Math.PI / 2, 0); root.add(board);
  const drawM = new THREE.MeshBasicMaterial({ map: drawingTex(0) });
  { const plate = new THREE.Group(); plate.rotation.x = -0.62; board.add(plate);
    plate.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.08, 0.05).translate(0, 0.54, -0.03), lam("wkBoard", () => ({ color: "#5a6e5a" }))));
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.0), drawM); paper.position.set(0, 0.54, 0.0); plate.add(paper);
    plate.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.06).translate(0, 0.02, 0.03), metal("wkRuler", "#c9ced6", 70))); }
  for (const s of [-1, 1]) rod(root, [DB[0] - 0.3, 0, DB[2] + s * 0.6], [DB[0], 1.05, DB[2] + s * 0.6], 0.03, steel);
  b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 18).translate(DB[0] - 1.0, 0.72, DB[2]), lam("wkStool", () => ({ color: "#b8352e" }))); rod(root, [DB[0] - 1.0, 0, DB[2]], [DB[0] - 1.0, 0.72, DB[2]], 0.025, steel);
  // anglepoise lamp clamped to the board (warm light you can see) + banker's lamp on the desk
  rod(root, [DB[0] + 0.1, 1.85, DB[2] - 0.8], [DB[0] + 0.5, 2.3, DB[2] - 0.5], 0.02, steel); rod(root, [DB[0] + 0.5, 2.3, DB[2] - 0.5], [DB[0] + 0.3, 2.1, DB[2] - 0.1], 0.02, steel);
  b.add(new THREE.ConeGeometry(0.14, 0.18, 14, 1, true).translate(DB[0] + 0.3, 2.05, DB[2] - 0.1), shiny("wkLampG", "#2f6b5a", 40));
  const boardLamp = glow(root, [DB[0] + 0.3, 1.97, DB[2] - 0.1], "#ffe2a8", 0.7, 0.9);
  { const pl = new THREE.PointLight("#ffd9a0", 6, 5, 1.2); pl.position.set(DB[0] + 0.3, 1.9, DB[2] - 0.1); root.add(pl); }
  const desk: V3 = [-5.3, 0, 1.4];
  b.add(boxGeo(V(desk[0] - 0.55, 0, desk[2] - 1.0), V(desk[0] + 0.55, 0.78, desk[2] + 1.0), 1), lam("wkDesk", () => ({ color: "#6a3a1e" })));
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 10).translate(desk[0], 0.93, desk[2] - 0.6), metal("wkBrass", "#c99a3a", 60));
  b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(desk[0], 1.12, desk[2] - 0.6), shiny("wkBank", "#2f8a5a", 60));
  glow(root, [desk[0], 1.05, desk[2] - 0.6], "#fff0b8", 0.5, 0.7);
  b.add(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 12).translate(desk[0] + 0.1, 0.83, desk[2] + 0.3), col("#f4f1ea"));   // coffee mug
  // pin board with sketches + a calendar (1958), a filing cabinet, coat stand, shelf with a little model car
  { const pb = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: ctex("wkPins", 1024, 640, (g, r) => { g.fillStyle = "#b88a5a"; g.fillRect(0, 0, 1024, 640); for (let i = 0; i < 7; i++) { const x = 40 + (i % 4) * 245, y = 40 + Math.floor(i / 4) * 300, w = 200, h = 240; g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((r() - 0.5) * 0.15); g.fillStyle = i === 3 ? "#f6e8b8" : "#f6f1e2"; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = "#2a2a3a"; g.lineWidth = 4; g.strokeRect(-70, -10, 140, 50); g.beginPath(); g.arc(-40, 50, 18, 0, TAU); g.arc(40, 50, 18, 0, TAU); g.stroke(); g.fillStyle = "#c8352e"; g.beginPath(); g.arc(0, -h / 2 + 14, 8, 0, TAU); g.fill(); if (i === 3) { g.fillStyle = "#2a2a3a"; g.font = "900 30px Georgia"; g.textAlign = "center"; g.fillText("1958", 0, -60); } g.restore(); } }) }));
    pb.position.set(-6.0 + 0.02, 2.0, -0.6); pb.rotation.y = Math.PI / 2; root.add(pb); }
  b.add(boxGeo(V(-6.0, 0, -2.9), V(-5.45, 1.35, -2.25), 1), metal("wkCab", "#6a7a6a", 40));
  rod(root, [-5.7, 0, 2.6], [-5.7, 1.9, 2.6], 0.03, lam("wkStand", () => ({ color: "#4a2a14" })));
  b.add(new THREE.SphereGeometry(0.16, 10, 8).scale(1, 1.4, 1).translate(-5.62, 1.65, 2.6), lam("wkCoat", () => ({ color: "#5a6a8a" })));
  b.add(boxGeo(V(-6.0, 1.7, 0.6), V(-5.7, 1.74, 2.0)), dado);
  { const mc = new THREE.Group(); mc.position.set(-5.85, 1.74, 1.3); mc.scale.setScalar(0.12); mc.rotation.y = Math.PI / 2; root.add(mc); sedan(mc, { style: "fin" }); }
  // ---------------- the factory floor ----------------
  const FX1 = 10, FZ0 = -5, FZ1 = 6, FH = 6.5;
  const brick = lam("wkBrick", () => ({ color: "#9a5a44" })), fpaint = lam("wkFPaint", () => ({ color: "#d9d2bf" }));
  b.add(boxGeo(V(PX, 0, FZ0 - 0.3), V(FX1, 2.2, FZ0), 1), brick); b.add(boxGeo(V(PX, 2.2, FZ0 - 0.3), V(FX1, FH, FZ0), 1), fpaint);
  b.add(boxGeo(V(FX1, 0, FZ0), V(FX1 + 0.3, 2.2, FZ1), 1), brick); b.add(boxGeo(V(FX1, 2.2, FZ0), V(FX1 + 0.3, FH, FZ1), 1), fpaint);
  b.add(boxGeo(V(PX, 0, FZ1), V(FX1, 2.2, FZ1 + 0.3), 1), brick); b.add(boxGeo(V(PX, 2.2, FZ1), V(FX1, FH, FZ1 + 0.3), 1), fpaint);
  b.add(boxGeo(V(PX - 0.1, 3.2, -3.2), V(PX + 0.02, FH, 3.2), 1), fpaint); b.add(boxGeo(V(PX - 0.1, 0, FZ0), V(PX + 0.02, FH, -3.0), 1), fpaint); b.add(boxGeo(V(PX - 0.1, 0, 3.0), V(PX + 0.02, FH, FZ1), 1), fpaint);
  b.add(boxGeo(V(PX, FH, FZ0), V(FX1, FH + 0.2, FZ1)), col("#5a5866"));
  // tall windows on the back wall (day: blue sky; night: dark blue), hanging lamps
  const dayWin = new THREE.MeshBasicMaterial({ color: new THREE.Color("#dceeff") }), nightWin = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1c2a5a") });
  const fwins: THREE.Mesh[] = [];
  for (let x = 1.0; x < 9.5; x += 2.2) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), dayWin); w.position.set(x, 3.9, FZ0 + 0.02); root.add(w); fwins.push(w); for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - 0.7, 2.6 + k * 0.86, FZ0), V(x + 0.7, 2.64 + k * 0.86, FZ0 + 0.05)), steel); b.add(boxGeo(V(x - 0.02, 2.6, FZ0), V(x + 0.02, 5.2, FZ0 + 0.05)), steel); }
  const flamps: THREE.Sprite[] = [], flampL: THREE.PointLight[] = [];
  for (const [x, z] of [[2.2, -1.5], [6.4, -1.5], [2.2, 3.2], [6.4, 3.2]] as [number, number][]) { rod(root, [x, FH, z], [x, 4.2, z], 0.012, steel); b.add(new THREE.ConeGeometry(0.4, 0.28, 18, 1, true).translate(x, 4.1, z), shiny("wkShade", "#2f6b5a", 40)); flamps.push(glow(root, [x, 3.94, z], "#ffe9b8", 1.0, 0.85)); const pl = new THREE.PointLight("#ffe2b0", 6, 10, 1.2); pl.position.set(x, 3.8, z); root.add(pl); flampL.push(pl); }
  // THE PROTOTYPE (paper car), yaw PI: nose toward -z, driver's door (+x local) faces the office (-x world)
  const CAR: V3 = [3.4, 0, 0.6];
  const car = sedan(root, { style: "fin" }); car.g.position.set(CAR[0], 0, CAR[2]); car.g.rotation.y = Math.PI;
  // the one work lamp over the car at night (on a tall stand), visible bulb + cone of light
  rod(root, [CAR[0] - 1.6, 0, CAR[2] - 1.6], [CAR[0] - 1.6, 2.9, CAR[2] - 1.6], 0.03, steel); rod(root, [CAR[0] - 1.6, 2.9, CAR[2] - 1.6], [CAR[0] - 0.9, 2.8, CAR[2] - 1.0], 0.02, steel);
  b.add(new THREE.ConeGeometry(0.22, 0.26, 16, 1, true).translate(CAR[0] - 0.9, 2.7, CAR[2] - 1.0), shiny("wkWork", "#c8352e", 40));
  const workG = glow(root, [CAR[0] - 0.9, 2.6, CAR[2] - 1.0], "#ffe2a8", 1.0, 0.0);
  const workL = new THREE.SpotLight("#ffd9a0", 0, 8, 0.8, 0.6, 1.2); workL.position.set(CAR[0] - 0.9, 2.65, CAR[2] - 1.0); workL.target.position.set(CAR[0], 0.6, CAR[2]); root.add(workL, workL.target);
  // hoist + hook, workbench + tools, tyres, PROTOTYPE sign on a stand, an oil drum, welding corner
  b.add(boxGeo(V(0.5, 5.6, -0.15), V(8.5, 5.8, 0.15)), steel); b.add(boxGeo(V(5.6, 5.3, -0.2), V(6.0, 5.6, 0.2)), metal("wkHoist", "#c8352e", 40)); rod(root, [5.8, 5.3, 0], [5.8, 3.2, 0], 0.012, metal("wkChain", "#3a3a40", 30));
  b.add(new THREE.TorusGeometry(0.12, 0.03, 6, 14, Math.PI * 1.5).translate(5.8, 3.1, 0), steel);
  b.add(boxGeo(V(6.8, 0, -4.6), V(9.6, 0.9, -3.8), 1), lam("wkBench", () => ({ color: "#7a5a3a" })));
  for (let k = 0; k < 6; k++) b.add(new THREE.BoxGeometry(0.06, 0.03, 0.32).translate(7.0 + k * 0.4, 0.93, -4.2), metal("wkTool", "#9aa0ac", 60));
  { const tb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), new THREE.MeshBasicMaterial({ map: ctex("wkTools", 1024, 400, (g) => { g.fillStyle = "#c9b48a"; g.fillRect(0, 0, 1024, 400); g.strokeStyle = "#3a3440"; g.lineWidth = 10; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(80 + i * 120, 60); g.lineTo(80 + i * 120, 300); g.stroke(); g.beginPath(); g.arc(80 + i * 120, 60, 22, 0, TAU); g.stroke(); } }) })); tb.position.set(8.2, 1.7, FZ0 + 0.02); root.add(tb); }
  for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(0.3, 0.12, 8, 18).rotateX(Math.PI / 2).translate(9.2, 0.12 + k * 0.24, 4.9), col("#2b2733"));
  b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16).translate(9.3, 0.45, 3.9), shiny("wkDrum", "#3f6aa0", 30));
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.55), new THREE.MeshBasicMaterial({ map: ctex("wkProto", 640, 270, (g) => { g.fillStyle = CAGE_YELLOW; g.fillRect(0, 0, 640, 270); g.strokeStyle = "#26222c"; g.lineWidth = 16; g.strokeRect(8, 8, 624, 254); g.fillStyle = "#26222c"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "PROTOTYPE", 320, 100, 560, 100, SANS); fitText(g, "DO NOT TOUCH", 320, 196, 500, 64, SANS); }) }));
    sg.position.set(CAR[0] + 0.2, 1.25, CAR[2] + 3.1); sg.rotation.y = -Math.PI / 2 + 0.5; root.add(sg); rod(root, [CAR[0] + 0.2, 0, CAR[2] + 3.1], [CAR[0] + 0.2, 0.98, CAR[2] + 3.1], 0.025, steel); }
  const sparksG = glow(root, [7.8, 1.0, -3.0], "#bfe6ff", 0.7, 0);
  const dust = motes(root, [0, 0.5, -4.5], [9.5, 5.5, 5.5], 50, "#fff6e0", 0.022, 0.55, 5);
  b.build(root);
  const marks: Record<string, V3> = {
    stool: [DB[0] - 0.95, 0, DB[2]], board: [DB[0], 1.3, DB[2]], boardEye: [DB[0] - 0.85, 0, DB[2] + 0.05], desk: desk, officeDoor: [PX - 0.6, 0, 2.35], doorOut: [PX + 1.0, 0, 2.35],
    car: CAR, carDoor: [CAR[0] - 1.15, 0, CAR[2] + 0.35], painter: [CAR[0] - 1.3, 0, CAR[2] - 0.8], welder: [7.6, 0, -3.3],
    sales1: [0.95, 0, -0.9], sales2: [1.1, 0, 0.7], mech2: [5.6, 0, 2.6], nightEng: [CAR[0] - 1.25, 0, CAR[2] - 0.9],
  };
  const cams = {
    office: { pos: [-1.8, 1.7, 1.6] as V3, look: [-3.8, 1.3, -1.0] as V3, fov: 42 },
    floor: { pos: [-0.2, 1.8, 4.5] as V3, look: [3.2, 1.1, 0.4] as V3, fov: 44 },
  };
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  let lastDraw = -1;
  return {
    name: "works", root, marks, cams,
    pose: (t, c) => {
      dust.update(t);
      const dq = Math.round(cl(c.draw ?? 1) * 30) / 30; if (dq !== lastDraw) { lastDraw = dq; drawM.map = drawingTex(dq); drawM.needsUpdate = true; }
      car.set({ paint: c.paint ?? 0, door: c.door ?? 0, t });
      const nt = cl(c.night ?? 0);
      fwins.forEach((w) => { w.material = nt > 0.5 ? nightWin : dayWin; });
      flamps.forEach((s) => { (s.material as THREE.SpriteMaterial).opacity = 0.85 * (1 - nt); }); flampL.forEach((l) => { l.intensity = 6 * (1 - nt); });
      (workG.material as THREE.SpriteMaterial).opacity = 0.95 * nt; workL.intensity = 18 * nt;
      (boardLamp.material as THREE.SpriteMaterial).opacity = 0.9;
      const wk = c.weld ?? 1; (sparksG.material as THREE.SpriteMaterial).opacity = wk * (Math.sin(t * 37) > 0.2 ? 0.9 : 0.15) * (1 - nt);
    },
  };
};
