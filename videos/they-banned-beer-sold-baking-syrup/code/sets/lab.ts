// Tudor's ice-house laboratory (S10, S11, S16). Warm amber wood interior (two hanging lanterns) against cold blue
// daylight from the open barn door (snow + bare trees outside). Room x -3..3.2, z -4..3.2; back wall z = -4 with the
// barn door x 0.9..2.9; the long bench along x at z -1.05..-0.25 with three test crates + a bare control block.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../build";
import { planksHD, beamHD, ctex, rng } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { lamp, flicker, glow, shaft, iceBlock, sawdustTex, stencilTex, sack, barrel, rod, crate, type Ice } from "../setkit";
import { glossDrips, over, boardsV, boardsH, beamStain, motes, bareTree, metal, jar, openBox, curlGeo, handTex, dotTex, TAU } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const floorTex = () => over("labFloorB", 1024, 1024, planksHD(), (g, r) => {
  for (let i = 0; i < 18; i++) { const x = r() * 1024, y = r() * 1024, rr = 40 + r() * 110; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(226,178,96,0.55)"); gr.addColorStop(1, "rgba(226,178,96,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 700; i++) { const x = r() * 1024, y = r() * 1024, a = r() * TAU, l = 8 + r() * 26; g.strokeStyle = r() < 0.5 ? "rgba(240,206,120,0.85)" : "rgba(180,130,60,0.7)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 25; i++) { g.fillStyle = "rgba(80,50,30,0.14)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 30 + r() * 60, 15 + r() * 30, r() * 3, 0, TAU); g.fill(); } // wet stains
});
const huskTex = () => ctex("huskFillB", 512, 512, (g, r) => {
  g.fillStyle = "#c9a45a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1300; i++) {
    const x = r() * 512, y = r() * 512, a = r() * TAU, l = 9 + r() * 6;
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = ["#e3c27a", "#d4ae62", "#bf9550", "#ecd298"][Math.floor(r() * 4)]; g.beginPath(); g.ellipse(0, 0, l, l * 0.42, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(110,70,30,0.6)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-l * 0.8, 0); g.lineTo(l * 0.8, 0); g.stroke();
    g.restore();
  }
});
const shavTex = () => ctex("shavFillB", 512, 512, (g, r) => {
  g.fillStyle = "#e8cc96"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, rr = 8 + r() * 18;
    g.strokeStyle = ["#f6e2b6", "#d6ae70", "#c49456", "#f2d9a4"][Math.floor(r() * 4)]; g.lineWidth = 4 + r() * 4; g.lineCap = "round";
    g.beginPath(); g.arc(x, y, rr, r() * TAU, r() * TAU + 3.5); g.stroke();
    g.strokeStyle = "rgba(120,80,40,0.35)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, rr + 2, 0, 2.5); g.stroke();
  }
});
const curlTex = () => ctex("curlWoodB", 256, 64, (g, r) => {
  g.fillStyle = "#f2d8a2"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(170,110,50,${0.2 + r() * 0.3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const y = r() * 64; g.moveTo(0, y); g.bezierCurveTo(80, y + (r() - 0.5) * 20, 170, y + (r() - 0.5) * 20, 256, y); g.stroke(); }
});
const chalkTex = () => handTex("labChalkB", 1024, 640, "#2f3d36", (g, r) => {
  g.fillStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * 1024, r() * 640, 60 + r() * 120, 20 + r() * 40, r(), 0, TAU); g.fill(); } // smudges
  g.strokeStyle = "#f2f2ea"; g.fillStyle = "#f2f2ea"; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
  // ice block cube
  const cube = (x: number, y: number, s: number) => { g.strokeRect(x, y, s, s); g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.35, y - s * 0.3); g.lineTo(x + s * 1.35, y - s * 0.3); g.lineTo(x + s, y); g.moveTo(x + s * 1.35, y - s * 0.3); g.lineTo(x + s * 1.35, y + s * 0.7); g.lineTo(x + s, y + s); g.stroke(); };
  cube(380, 300, 170);
  // sun + wavy heat arrows pointing at it
  g.beginPath(); g.arc(120, 140, 55, 0, TAU); g.stroke();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.beginPath(); g.moveTo(120 + Math.cos(a) * 70, 140 + Math.sin(a) * 70); g.lineTo(120 + Math.cos(a) * 95, 140 + Math.sin(a) * 95); g.stroke(); }
  for (let k = 0; k < 3; k++) { const y0 = 260 + k * 70; g.beginPath(); g.moveTo(110, y0); for (let x = 110; x < 330; x += 20) g.lineTo(x + 10, y0 + (((x / 20) % 2) ? -12 : 12)); g.stroke(); g.beginPath(); g.moveTo(345, y0); g.lineTo(320, y0 - 16); g.moveTo(345, y0); g.lineTo(320, y0 + 16); g.stroke(); }
  // drip + puddle under the cube
  g.beginPath(); g.ellipse(470, 520, 160, 26, 0, 0, TAU); g.stroke();
  g.font = "italic 900 120px Georgia, serif"; g.textAlign = "center"; g.fillText("HEAT?", 800, 170);
  g.font = "italic 700 64px Georgia, serif"; g.fillText("husks  X", 800, 330); g.fillText("shavings  X", 800, 420); g.fillText("sawdust  ?", 800, 510);
  g.beginPath(); g.moveTo(640, 360); g.lineTo(960, 350); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(640, 450); g.lineTo(960, 440); g.stroke();
});
const clockTex = () => ctex("labClockB", 256, 256, (g) => {
  g.fillStyle = "#f4ead2"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  g.strokeStyle = "#3a2216"; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 118, 0, TAU); g.stroke();
  g.fillStyle = "#3a2216"; g.font = "900 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ["XII", "III", "VI", "IX"].forEach((s, i) => { const a = (i / 4) * TAU - Math.PI / 2; g.fillText(s, 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.fillRect(128 + Math.cos(a) * 106 - 3, 128 + Math.sin(a) * 106 - 3, 6, 6); }
});
const sawTex = () => ctex("labSawB", 512, 128, (g) => {
  g.fillStyle = "#c7ccd6"; g.beginPath(); g.moveTo(0, 20); g.lineTo(512, 40); g.lineTo(512, 100); g.lineTo(0, 120); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(20, 40, 470, 8);
  g.clearRect(0, 108, 512, 20); g.fillStyle = "#c7ccd6"; for (let x = 0; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 100); g.lineTo(x + 8, 120); g.lineTo(x + 16, 100); g.fill(); }
});

const stoolTop = () => lam("labStool", () => ({ map: beamHD() }));
export const lab = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const floor = lam("labFloorDim", () => ({ map: floorTex(), color: "#4c5576" }));
  const wall = lam("labWallCool2", () => ({ map: boardsV("labWallCool2", "#34466e", 1.0), side: THREE.DoubleSide }));
  const roofM = lam("labRoofCool2", () => ({ map: boardsH("labRoofCool2", "#3e4c78", 0.8), side: THREE.DoubleSide }));
  const beam = lam("labBeamCool2", () => ({ map: beamStain("labBeamCool2", "#5e6c94", 0.7) }));
  const post = lam("labPostCool2", () => ({ map: beamStain("labPostCool2", "#5a6890", 0.7) }));
  const iron = metal("labIron", "#4b5468", 40);
  const tin = metal("labTin", "#a9b2c2", 70);
  const X0 = -3.0, X1 = 3.2, ZB = -4.0, ZF = 3.2, H = 3.0, RH = 4.7, RX = 0.1, T = 0.45; // thick insulated walls
  // ---- floor, walls, gabled roof with rafters ----
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 2, (ZF - ZB) / 2), floor);
  const DX0 = 0.9, DX1 = 2.9, DY = 2.75;
  shell.add(boxGeo(V(X0 - T, 0, ZB - T), V(DX0, H, ZB), 2.5), wall);
  shell.add(boxGeo(V(DX0, DY, ZB - T), V(DX1, H, ZB), 2.5), wall);
  shell.add(boxGeo(V(DX1, 0, ZB - T), V(X1 + T, H, ZB), 2.5), wall);
  shell.add(boxGeo(V(X0 - T, 0, ZF), V(X1 + T, H, ZF + T), 2.5), wall);
  shell.add(boxGeo(V(X0 - T, 0, ZB), V(X0, H, ZF), 2.5), wall);
  shell.add(boxGeo(V(X1, 0, ZB), V(X1 + T, H, ZF), 2.5), wall);
  for (const z of [ZB, ZF]) shell.add(z === ZB ? tri(V(X0, H, z), V(X1, H, z), V(RX, RH, z)) : tri(V(X1, H, z), V(X0, H, z), V(RX, RH, z)), wall);
  shell.add(quad(V(X0, H, ZB), V(X0, H, ZF), V(RX, RH, ZF), V(RX, RH, ZB), 3.6, 2.2), roofM);
  shell.add(quad(V(X1, H, ZF), V(X1, H, ZB), V(RX, RH, ZB), V(RX, RH, ZF), 3.6, 2.2), roofM);
  for (let z = ZB + 0.6; z < ZF; z += 1.3) { // rafters + tie beams
    const ra = (x0: number, y0: number, x1: number, y1: number) => { const len = Math.hypot(x1 - x0, y1 - y0); const g = new THREE.BoxGeometry(len, 0.18, 0.14).rotateZ(Math.atan2(y1 - y0, x1 - x0)).translate((x0 + x1) / 2, (y0 + y1) / 2 - 0.1, z); b.add(g, beam); };
    ra(X0, H, RX, RH); ra(RX, RH, X1, H);
  }
  b.add(boxGeo(V(X0, H - 0.22, -0.82), V(X1, H, -0.62), 3), beam); // tie beam over the bench (lanterns hang here)
  b.add(boxGeo(V(X0, H - 0.22, -3.0), V(X1, H, -2.8), 3), beam);
  b.add(boxGeo(V(X0, H - 0.22, 1.9), V(X1, H, 2.1), 3), beam);
  b.add(boxGeo(V(RX - 0.1, RH - 0.3, ZB), V(RX + 0.1, RH - 0.1, ZF), 3), beam); // ridge
  for (const [x, z] of [[X0 + 0.12, ZB + 0.12], [X1 - 0.12, ZB + 0.12], [DX0 - 0.12, ZB + 0.12], [DX1 + 0.12, ZB + 0.12], [X0 + 0.12, ZF - 0.12], [X1 - 0.12, ZF - 0.12], [X0 + 0.12, -0.72], [X1 - 0.12, -0.72]]) b.add(boxGeo(V(x - 0.12, 0, z - 0.12), V(x + 0.12, H, z + 0.12), 3), post);
  b.add(boxGeo(V(DX0 - 0.24, DY - 0.05, ZB - 0.02), V(DX1 + 0.24, DY + 0.2, ZB + 0.12), 3), post); // door header
  // ---- the open barn door: leaves swung outward, snow + bare trees outside ----
  const leafM = lam("labDoorLeaf", () => ({ map: boardsV("labDoorLeaf", "#b06a48", 0.4) }));
  for (const [hx, s] of [[DX0, -1], [DX1, 1]] as [number, number][]) {
    const g = new THREE.Group(); g.position.set(hx, 0, ZB - T); g.rotation.y = s * -1.95; root.add(g);
    const lb = new Batch(); lb.add(boxGeo(V(s < 0 ? 0 : -1.0, 0.04, -0.06), V(s < 0 ? 1.0 : 0, DY - 0.05, 0), 2.5), leafM);
    lb.add(boxGeo(V(s < 0 ? 0.05 : -0.95, 0.3, 0), V(s < 0 ? 0.95 : -0.05, 0.42, 0.04)), post); lb.add(boxGeo(V(s < 0 ? 0.05 : -0.95, 2.2, 0), V(s < 0 ? 0.95 : -0.05, 2.32, 0.04)), post);
    lb.build(g);
  }
  const snowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.93, 0.97, 1.08), map: ctex("labSnowTex", 512, 512, (g, r) => { g.fillStyle = "#eef3fb"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(190,206,236,0.35)" : "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 40 + r() * 80, 10 + r() * 20, 0, 0, TAU); g.fill(); } }) });
  shell.add(quad(V(-14, 0, ZB - T), V(16, 0, ZB - T), V(16, 0, -60), V(-14, 0, -60), 15, 28), snowM);
  const sr = rng(41);
  const hills = new THREE.MeshBasicMaterial({ color: new THREE.Color("#d2e0f6").multiplyScalar(0.95) });
  for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2).scale(9 + sr() * 6, 3 + sr() * 3, 6).translate(-20 + i * 9, 0, -45 - sr() * 8), hills);
  const bark = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5a5068").multiplyScalar(0.7) });
  for (const [x, z, h] of [[-1.5, -11, 4.5], [3.2, -9, 5.2], [6.5, -14, 4.8], [0.8, -17, 5.5], [-4.5, -16, 5], [9, -20, 6]] as [number, number, number][]) bareTree(root, x, z, h, Math.round(x * 7 + z), bark);
  const fenceM = new THREE.MeshBasicMaterial({ map: beamHD(), color: new THREE.Color("#a8b8e0").multiplyScalar(0.75) });
  for (let x = -6; x < 10; x += 1.4) { b.add(boxGeo(V(x - 0.06, 0, -7.06), V(x + 0.06, 1.1, -6.94)), fenceM); b.add(boxGeo(V(x - 0.07, 1.1, -7.07), V(x + 0.07, 1.16, -6.93)), snowM); }
  for (const y of [0.45, 0.9]) b.add(boxGeo(V(-6, y, -7.03), V(10, y + 0.1, -6.97), 3), fenceM);
  // ice blocks stacked outside under snow, a sled
  iceBlock(root, 0.8, 0.6, 0.6, [2.6, 0, -6.0], { seed: 21 }); iceBlock(root, 0.8, 0.6, 0.6, [3.5, 0, -6.1], { seed: 22 }); iceBlock(root, 0.8, 0.6, 0.6, [3.05, 0.6, -6.05], { seed: 23 });
  b.add(boxGeo(V(2.15, 1.2, -6.4), V(3.95, 1.3, -5.7)), snowM);
  // falling snow outside only (never indoors)
  const flakeN = 260, fp = new Float32Array(flakeN * 3), seeds = new Float32Array(flakeN);
  for (let i = 0; i < flakeN; i++) { fp.set([-3 + sr() * 9, sr() * 6, -4.6 - sr() * 10], i * 3); seeds[i] = sr(); }
  const flakes = new THREE.BufferGeometry(); flakes.setAttribute("position", new THREE.BufferAttribute(fp.slice(), 3));
  const snowPts = new THREE.Points(flakes, new THREE.PointsMaterial({ size: 0.05, color: "#ffffff", transparent: true, depthWrite: false, map: dotTex() }));
  snowPts.layers.set(NOINK); snowPts.frustumCulled = false; root.add(snowPts);
  // cold daylight spilling in: shaft + blue point light + dust in the beam
  const dayShaft = shaft(root, [1.9, 2.7, ZB - 0.3], [1.0, 0, -1.2], 2.3, "#d6e6ff", 0.42);
  const dayL = new THREE.SpotLight("#a8c8ff", 40, 12, 0.55, 0.5, 1.1); dayL.position.set(1.9, 2.6, ZB - 1.2); dayL.target.position.set(1.0, 0, -1.2); root.add(dayL, dayL.target);
  const dayPatch = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ctex("labDayPatch", 128, 128, (g) => { const gr = g.createRadialGradient(64, 40, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), color: new THREE.Color("#6f9ae8").multiplyScalar(0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  dayPatch.position.set(1.4, 0.008, -2.2); dayPatch.scale.set(1.1, 1, 1.4); dayPatch.layers.set(NOINK); root.add(dayPatch);
  glow(root, [1.9, 1.4, ZB - 0.3], "#cfe2ff", 3.2, 0.25);
  const dust = motes(root, [0.6, 0.4, -3.8], [2.6, 2.5, -1.6], 60, "#fff1d6", 0.03, 0.7, 5);
  // ---- the long workbench ----
  const benchTop = lam("labBench", () => ({ map: beamStain("labBench", "#c59a6a", 0.2) }));
  const BX0 = -1.45, BX1 = 1.5, BZ0 = -1.05, BZ1 = -0.25, BY = 0.9;
  b.add(boxGeo(V(BX0, BY - 0.07, BZ0), V(BX1, BY, BZ1), 1.5), benchTop);
  for (const x of [BX0 + 0.08, BX1 - 0.08]) for (const z of [BZ0 + 0.08, BZ1 - 0.08]) b.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, BY - 0.07, z + 0.06)), post);
  b.add(boxGeo(V(BX0 + 0.05, 0.25, BZ0 + 0.05), V(BX1 - 0.05, 0.3, BZ1 - 0.05), 1.5), benchTop); // lower shelf
  sack(root, [-1.2, 0.3, -0.65], 0.17, "#c9a870"); sack(root, [-0.8, 0.3, -0.7], 0.15, "#b89a68");
  jar(b, 0.6, 0.3, -0.6, 0.3, lam("labJarG", () => ({ color: "#7ab8a0" })), lam("labCork", () => ({ color: "#b07a4a" })));
  // three test crates (open) with fills and ice; bare control block on a tin tray
  const crateW = lam("labCrate", () => ({ map: beamHD() }));
  const fills = { husks: lam("labHusk", () => ({ map: huskTex() })), shavings: lam("labShav", () => ({ map: shavTex() })), sawdust: lam("labSawdust", () => ({ map: sawdustTex() })) };
  const curlM = lam("labCurl", () => ({ map: curlTex(), side: THREE.DoubleSide }));
  const glossy = twoTone(new THREE.MeshPhongMaterial({ color: "#8fd0ee", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.72 }));
  const CW = 0.56, CD = 0.46, CH = 0.3;
  const crates: { ice: Ice; puddle: THREE.Object3D | undefined; spill: THREE.Mesh; x: number }[] = [];
  const labels: [keyof typeof fills, string, number][] = [["husks", "RICE HUSKS", -1.05], ["shavings", "WOOD SHAVINGS", -0.39], ["sawdust", "SAWDUST", 0.27]];
  labels.forEach(([k, text, x], i) => {
    openBox(b, V(x - CW / 2, BY, -0.65 - CD / 2), V(x + CW / 2, BY + CH, -0.65 + CD / 2), 0.035, crateW);
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * CW / 2 - 0.03, BY, -0.65 - CD / 2 - 0.02), V(x + s * CW / 2 + 0.03, BY + CH + 0.01, -0.65 + CD / 2 + 0.02)), post);
    b.add(boxGeo(V(x - CW / 2 + 0.03, BY + 0.03, -0.65 - CD / 2 + 0.03), V(x + CW / 2 - 0.03, BY + CH - 0.06, -0.65 + CD / 2 - 0.03)), fills[k]);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, Math.PI / 2), fills[k]); mound.scale.set(CW * 0.45, 0.07, CD * 0.42); mound.position.set(x, BY + CH - 0.06, -0.65); mound.receiveShadow = true; root.add(mound);
    if (k === "shavings") for (let j = 0; j < 9; j++) { const cg = new THREE.Mesh(curlGeo(0.035, 0.03, 1.6, 0.03), curlM); cg.position.set(x - 0.24 + (j % 3) * 0.24 + sr() * 0.05, BY + CH - 0.01, -0.82 + Math.floor(j / 3) * 0.16); cg.rotation.set(sr() * 3, sr() * 3, sr() * 3); cg.castShadow = true; root.add(cg); }
    if (k === "husks") for (let j = 0; j < 30; j++) { const hm = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), lam("labHuskBit", () => ({ color: "#d9b46a" }))); hm.scale.set(1.8, 0.6, 0.8); hm.position.set(x + (sr() - 0.5) * CW * 0.85, BY + CH - 0.02 + sr() * 0.02, -0.65 + (sr() - 0.5) * CD * 0.8); hm.rotation.y = sr() * 3; root.add(hm); }
    const ice = iceBlock(root, 0.28, 0.27, 0.27, [x, BY + CH + 0.0, -0.66], { mist: k === "sawdust", seed: 30 + i });
    glossDrips(ice); const puddle = ice.g.children.find((c) => (c as THREE.Mesh).geometry instanceof THREE.CircleGeometry);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(CW * 0.92, 0.16), new THREE.MeshBasicMaterial({ map: stencilTex(text, "#2a1a10", "#f0dfb4", 768, 186) }));
    tag.position.set(x, BY + CH * 0.5, -0.65 + CD / 2 + 0.024); root.add(tag);
    for (const s of [-1, 1]) { const nl = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), iron); nl.position.set(x + s * CW * 0.42, BY + CH * 0.5, -0.65 + CD / 2 + 0.03); root.add(nl); }
    const spill = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), glossy); spill.position.set(x + 0.05, BY + 0.003, -0.38); spill.visible = false; root.add(spill);
    crates.push({ ice, puddle, spill, x });
  });
  const BXc = 1.08;
  b.add(boxGeo(V(BXc - 0.24, BY, -0.86), V(BXc + 0.24, BY + 0.02, -0.44)), tin);
  const bare = iceBlock(root, 0.3, 0.28, 0.28, [BXc, BY + 0.02, -0.65], { mist: true, seed: 40 });
  glossDrips(bare); const bareP = bare.g.children.find((c) => (c as THREE.Mesh).geometry instanceof THREE.CircleGeometry);
  const floorP = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), glossy); floorP.position.set(BXc + 0.05, 0.004, -0.05); floorP.visible = false; root.add(floorP);
  const drops = [0, 1, 2].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), glossy); d.scale.set(1, 1.5, 1); d.visible = false; root.add(d); return d; });
  // thermometer between the sawdust crate and the bare block
  const th = new THREE.Group(); th.position.set(0.68, BY, -0.92); root.add(th);
  const thb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.02), lam("labThermo", () => ({ map: ctex("thermoB", 64, 320, (g) => { g.fillStyle = "#efe2c0"; g.fillRect(0, 0, 64, 320); g.fillStyle = "#3a2216"; for (let i = 0; i < 14; i++) g.fillRect(8, 30 + i * 18, i % 2 ? 10 : 18, 3); }) }))); thb.position.y = 0.29; th.add(thb);
  b.add(boxGeo(V(0.6, BY, -0.97), V(0.76, BY + 0.03, -0.87)), post);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), new THREE.MeshPhongMaterial({ color: "#ffffff", transparent: true, opacity: 0.6 })); tube.position.set(0.012, 0.3, 0.02); th.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), lam("labRed", () => ({ color: "#d8352e" }))); bulb.position.set(0.012, 0.08, 0.02); th.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 6).translate(0, 0.5, 0), lam("labRed", () => ({ color: "#d8352e" }))); col.position.set(0.012, 0.09, 0.02); th.add(col);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rod(root, [-0.2 + Math.cos(a) * 0.13, 0.54, -1.75 + Math.sin(a) * 0.13], [-0.2 + Math.cos(a) * 0.2, 0, -1.75 + Math.sin(a) * 0.2], 0.02, post); }
  // tongs + a hammer + notebook on the bench
  const tongs = new THREE.Group(); tongs.position.set(-1.35, BY + 0.01, -0.33); tongs.rotation.y = 0.3; root.add(tongs);
  for (const s of [-1, 1]) { const tg = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 5, 16, Math.PI * 0.8), iron); tg.rotation.set(Math.PI / 2, 0, s * 0.3); tg.position.set(0, 0.012, s * 0.02); tongs.add(tg); }
  const note = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.28), lam("labNote", () => ({ map: handTex("labNoteTex", 128, 160, "#f3e6c4", (g) => { g.strokeStyle = "#3a2a20"; g.lineWidth = 3; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(14, 24 + i * 18); g.lineTo(100 + (i % 3) * 8, 24 + i * 18); g.stroke(); } }) })));
  note.position.set(-0.75, BY + 0.01, -0.95); note.rotation.y = -0.2; root.add(note);
  // ---- back wall: chalkboard, clock with pendulum, tool rack, shelves ----
  const cb = new THREE.Group(); cb.position.set(-0.85, 1.65, ZB + 0.05); root.add(cb);
  const cbf = new Batch(); for (const [x0, y0, x1, y1] of [[-0.72, -0.48, 0.72, -0.4], [-0.72, 0.4, 0.72, 0.48], [-0.72, -0.48, -0.64, 0.48], [0.64, -0.48, 0.72, 0.48]]) cbf.add(boxGeo(V(x0, y0, 0), V(x1, y1, 0.06)), post);
  cbf.add(boxGeo(V(-0.7, -0.52, 0), V(0.7, -0.48, 0.12)), post); cbf.build(cb);
  const cface = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.8), new THREE.MeshBasicMaterial({ map: chalkTex(), color: new THREE.Color(0.95, 0.92, 0.85) })); cface.position.z = 0.03; cb.add(cface);
  const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.015), lam("labChalk", () => ({ color: "#f4f4ee" }))); chalk.position.set(0.3, -0.47, 0.08); cb.add(chalk);
  const clk = new THREE.Group(); clk.position.set(-0.85, 2.6, ZB + 0.06); root.add(clk);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 28).rotateX(Math.PI / 2), post); clk.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 28), new THREE.MeshBasicMaterial({ map: clockTex(), color: new THREE.Color(0.92, 0.88, 0.8) })); face.position.z = 0.037; clk.add(face);
  const hand = (len: number, w: number) => { const g = new THREE.Group(); g.position.z = 0.045; const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.008).translate(0, len / 2 - 0.02, 0), lam("labHand", () => ({ color: "#2a2030" }))); g.add(m); clk.add(g); return g; };
  const hh = hand(0.11, 0.022), mh = hand(0.16, 0.014);
  const pend = new THREE.Group(); pend.position.set(0, -0.22, 0.02); clk.add(pend);
  const pr = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.36, 0.01).translate(0, -0.18, 0), lam("brassB", () => ({ color: "#d9a640" }))); pend.add(pr);
  const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 18).rotateX(Math.PI / 2), lam("brassB", () => ({ color: "#d9a640" }))); pb.position.y = -0.38; pend.add(pb);
  // tool rack between chalkboard and door: saw, axe, shovel, iron tongs
  b.add(boxGeo(V(-0.45 + 0.6, 1.85, ZB), V(0.85, 1.95, ZB + 0.08)), post);
  for (let i = 0; i < 4; i++) b.add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6).rotateX(Math.PI / 2).translate(0.25 + i * 0.2, 1.9, ZB + 0.13), iron);
  const saw = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshLambertMaterial({ map: sawTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); saw.position.set(0.28, 1.6, ZB + 0.1); saw.rotation.z = -1.45; root.add(saw);
  b.add(boxGeo(V(0.22, 1.85, ZB + 0.06), V(0.36, 1.98, ZB + 0.12)), lam("labHandle", () => ({ color: "#8a4a2a" })));
  rod(root, [0.5, 1.88, ZB + 0.14], [0.53, 1.05, ZB + 0.14], 0.022, lam("labHandle", () => ({ color: "#8a4a2a" })));
  b.add(boxGeo(V(0.45, 1.0, ZB + 0.1), V(0.64, 1.14, ZB + 0.18)), iron); // axe head
  // shelves (back-left + left wall) with jars and sacks
  const shelfM = lam("labShelf", () => ({ map: beamStain("labShelf", "#b08060", 0.25) }));
  const jarCols = ["#7ab8a0", "#c96a4a", "#e6c86a", "#7a8ec8", "#b88ac0", "#9ac87a"].map((c) => lam("labJar" + c, () => ({ color: c })));
  const cork = lam("labCork", () => ({ color: "#b07a4a" }));
  // sawdust-packed ice stacks along the walls (the ice house proper): blocks in courses with sawdust between
  const sdM = lam("labSawdust", () => ({ map: sawdustTex() }));
  const stack = (x0: number, z0: number, along: "x" | "z", n: number, rows: number) => {
    const bw = 0.62, bh = 0.5, gap = 0.08;
    for (let row = 0; row < rows; row++) {
      for (let k = 0; k < n - (row === rows - 1 ? 1 : 0); k++) {
        const o = k * (bw + gap) + (row % 2) * 0.3, x = along === "x" ? x0 + o : x0, z = along === "z" ? z0 + o : z0;
        iceBlock(root, along === "x" ? bw : 0.55, bh, along === "z" ? bw : 0.55, [x, row * (bh + 0.06), z], { seed: 60 + row * 10 + k });
      }
      const len = n * (bw + gap);
      b.add(along === "x" ? boxGeo(V(x0 - 0.35, row * (bh + 0.06) + bh, z0 - 0.33), V(x0 + len - 0.2, row * (bh + 0.06) + bh + 0.06, z0 + 0.33)) : boxGeo(V(x0 - 0.33, row * (bh + 0.06) + bh, z0 - 0.35), V(x0 + 0.33, row * (bh + 0.06) + bh + 0.06, z0 + len - 0.2)), sdM);
    }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, Math.PI / 2), sdM);
    const len = n * (bw + gap); if (along === "x") { cap.scale.set(len / 2, 0.3, 0.4); cap.position.set(x0 - 0.3 + len / 2, rows * (bh + 0.06), z0); } else { cap.scale.set(0.4, 0.3, len / 2); cap.position.set(x0, rows * (bh + 0.06), z0 - 0.3 + len / 2); }
    root.add(cap);
  };
  stack(-2.65, ZB + 0.45, "x", 2, 3);
  stack(X0 + 0.45, -3.2, "z", 4, 3);
  stack(X1 - 0.45, -0.6, "z", 4, 2);
  // frost on the beams + icicles under the tie beams
  const frost = lam("labFrost", () => ({ color: "#eef6ff" }));
  for (const z of [-0.72, -2.9, 2.0]) {
    b.add(boxGeo(V(X0, H, z - 0.11), V(X1, H + 0.035, z + 0.11)), frost);
    for (let k = 0; k < 14; k++) { const x = X0 + 0.3 + k * 0.43 + sr() * 0.15, l = 0.08 + sr() * 0.18; b.add(new THREE.ConeGeometry(0.022, l, 6).rotateX(Math.PI).translate(x, H - 0.22 - l / 2, z + (sr() - 0.5) * 0.12), frost); }
  }
  b.add(boxGeo(V(RX - 0.11, RH - 0.1, ZB), V(RX + 0.11, RH - 0.07, ZF)), frost);
  // sawdust heap in front of the chalkboard with a shovel stuck in it; ice stacked by the door packed in straw
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.6, 22, 4), lam("labSawdust", () => ({ map: sawdustTex() })));
  { const hp = heap.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < hp.count; i++) { const y = hp.getY(i); const k = 1 + 0.12 * Math.sin(hp.getX(i) * 9) * (0.3 - y); hp.setXYZ(i, hp.getX(i) * k, y, hp.getZ(i) * k); } heap.geometry.computeVertexNormals(); }
  heap.position.set(-1.55, 0.3, -2.9); heap.scale.set(1.2, 1, 0.9); heap.castShadow = heap.receiveShadow = true; root.add(heap);
  rod(root, [-1.4, 0.45, -2.85], [-1.15, 1.35, -2.6], 0.022, lam("labHandle", () => ({ color: "#8a4a2a" })));
  b.add(new THREE.BoxGeometry(0.2, 0.26, 0.03).rotateZ(-0.25).rotateX(0.2).translate(-1.43, 0.38, -2.88), iron);
  iceBlock(root, 0.7, 0.55, 0.55, [2.55, 0, -2.6], { seed: 11 }); iceBlock(root, 0.7, 0.55, 0.55, [2.55, 0, -1.9], { seed: 12 }); iceBlock(root, 0.65, 0.5, 0.5, [2.55, 0.55, -2.25], { seed: 13, mist: true });
  barrel(root, [-2.3, 0, 1.0], 0.36, 1);
  const sled = new THREE.Group(); sled.position.set(1.15, 0, -2.3); sled.rotation.y = 0.4; root.add(sled);
  const sb = new Batch(); sb.add(boxGeo(V(-0.5, 0.1, -0.35), V(0.5, 0.17, 0.35)), benchTop); for (const sz of [-0.3, 0.3]) sb.add(boxGeo(V(-0.6, 0, sz - 0.03), V(0.55, 0.06, sz + 0.03)), iron); sb.build(sled);
  iceBlock(sled, 0.6, 0.5, 0.5, [0, 0.17, 0], { seed: 14, mist: true });
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14).translate(-0.2, 0.55, -1.75), stoolTop()); crate(b, root, [-1.6, 0, 2.5], 0.7, "TUDOR\nICE CO.", 0.3); crate(b, root, [1.7, 0, 2.5], 0.8, "SAWDUST", -0.2);
  // front wall (seen from the barn door): shelf of sacks, hanging rope coils, a small window with frost
  for (const y of [1.2, 1.8]) b.add(boxGeo(V(-1.6, y - 0.04, ZF - 0.35), V(0.4, y, ZF)), shelfM);
  for (let i = 0; i < 4; i++) sack(root, [-1.4 + i * 0.5, 1.2, ZF - 0.18], 0.13, i % 2 ? "#c8aa76" : "#a8906a");
  for (let i = 0; i < 5; i++) jar(b, -1.45 + i * 0.4, 1.8, ZF - 0.18, 0.2, jarCols[i], cork);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: ctex("labWinB", 256, 200, (g) => { const gr = g.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, "#bcd8f6"); gr.addColorStop(1, "#eef5ff"); g.fillStyle = gr; g.fillRect(0, 0, 256, 200); g.fillStyle = "#6a4a32"; g.fillRect(122, 0, 12, 200); g.fillRect(0, 94, 256, 12); g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.ellipse(30, 190, 60, 30, 0, 0, TAU); g.ellipse(230, 190, 60, 30, 0, 0, TAU); g.fill(); }), color: new THREE.Color(1.05, 1.05, 1.1) }));
  win.position.set(1.6, 1.7, ZF - 0.01); win.rotation.y = Math.PI; root.add(win);
  b.add(boxGeo(V(1.1, 1.3, ZF - 0.08), V(2.1, 1.36, ZF)), post);
  // ---- lanterns on the tie beam (swing a little) ----
  const lantern = (x: number, z = -0.72) => { const pv = new THREE.Group(); pv.position.set(x, H - 0.22, z); root.add(pv); rod(pv, [0, 0, 0], [0, -0.55, 0], 0.008, iron); const l = lamp(pv, [0, -0.9, 0], "#ffa040", 14, 5, "hang"); return { pv, l }; };
  const lanterns = [lantern(-1.25), lantern(1.25), lantern(-1.9, -2.9)];
  shell.build(root, true); b.build(root);
  const marks: Record<string, V3> = {
    tudor: [0.15, 0, -1.55], crateHusks: [-1.2, BY + CH, -0.65], crateShavings: [-0.38, BY + CH, -0.65], crateSawdust: [0.45, BY + CH, -0.65], bare: [BXc, BY + 0.02, -0.65], door: [1.9, 0, -3.5],
  };
  const cams = {
    wide: { pos: [-1.35, 1.95, 3.05] as V3, look: [0.2, 1.3, -1.7] as V3, fov: 56 },
    bench: { pos: [-0.75, 1.45, 0.95] as V3, look: [-0.5, 1.12, -0.7] as V3, fov: 44 },
    sawdust: { pos: [2.05, 1.42, 0.3] as V3, look: [0.3, 1.02, -0.7] as V3, fov: 42 },
    door: { pos: [1.9, 1.65, -5.6] as V3, look: [0.1, 1.2, 0.6] as V3, fov: 50 },
  };
  return {
    name: "lab", root, marks, cams,
    pose: (t, c) => {
      lanterns.forEach(({ pv, l }, i) => { flicker(l, t); pv.rotation.z = 0.05 * Math.sin(t * 1.1 + i * 1.7); pv.rotation.x = 0.03 * Math.sin(t * 0.8 + i); });
      dust.update(t); (dayShaft.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.03 * Math.sin(t * 0.6);
      // snow outside
      const a = snowPts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < flakeN; i++) { a[i * 3] = fp[i * 3] + Math.sin(t * 0.7 + seeds[i] * 20) * 0.3; a[i * 3 + 1] = ((fp[i * 3 + 1] - t * (0.4 + seeds[i] * 0.3)) % 6 + 6) % 6; }
      snowPts.geometry.attributes.position.needsUpdate = true;
      // clock: c.clock = hours on the dial; pendulum always swings
      const hrs = c.clock ?? 2 + t * 0.02;
      hh.rotation.z = -(hrs / 12) * TAU; mh.rotation.z = -(hrs % 1) * TAU; pend.rotation.z = 0.22 * Math.sin(t * Math.PI);
      col.scale.y = 0.15 + 0.17 * (c.temp ?? 0.6) + 0.004 * Math.sin(t * 2);
      // melt controls
      const melts = [c.husks ?? 0, c.shavings ?? 0, c.sawdust ?? 0];
      crates.forEach(({ ice, puddle, spill }, i) => {
        const m = melts[i]; ice.set(m, t + i * 0.3);
        if (puddle) { const s = puddle.scale.x; puddle.scale.set(Math.min(s, 0.3), Math.min(s, 0.21), 1); }
        spill.visible = m > 0.25; spill.scale.set(0.05 + 0.2 * m, 1, 0.04 + 0.1 * m);
      });
      const mb = c.bare ?? 0; bare.set(mb, t + 1.7);
      if (bareP) { const s = bareP.scale.x; bareP.scale.set(Math.min(s, 0.36), Math.min(s, 0.3), 1); }
      floorP.visible = mb > 0.3; floorP.scale.set(0.1 + 0.4 * mb, 1, 0.08 + 0.25 * mb);
      drops.forEach((d, i) => { const u = (t * 1.3 + i / 3) % 1; d.visible = mb > 0.3; d.position.set(BXc + 0.05 + (i - 1) * 0.05, BY - u * BY, BZ1 + 0.03); });
    },
  };
};
