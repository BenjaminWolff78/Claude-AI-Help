// Captain's cabin at night, 1833 (S17). Warm brass-lamp key + moon-blue porthole. The chart table (x -0.8..0.8,
// z -0.95..0.95, top 0.85) carries a LARGE painted map, north toward -z so the top cam reads it: Boston (top left),
// equator, Cape of Good Hope (bottom), Calcutta (top right). ctl route 0..1 sails a toy ship along the dotted route and
// draws the travelled part solid; ctl month 0..3 flips the wall calendar JUN / JUL / AUG / SEP.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, beamHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, glow, shaft, waterPlane, rod, barrel, stencilTex } from "../setkit";
import { boardsV, boardsH, beamStain, candle, flameFlick, motes, metal, book, handTex, TAU } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

// ---- the map: canvas 1200 x 1500 = table area 1.2 m (x) x 1.5 m (z); map uv u = x, v = z (v 0 = north = -z) ----
const MW = 1200, MH = 1500;
const P = { boston: [215, 300], eqA: [470, 700], cape: [640, 1260], eqB: [960, 700], calcutta: [1010, 410] } as const;
// route (map px): Boston -> SE across the Atlantic -> past the bulge -> Cape -> round -> up the Indian Ocean -> Calcutta
const ROUTE: [number, number][] = [[230, 318], [320, 390], [375, 480], [400, 600], [422, 700], [440, 820], [470, 960], [520, 1110], [600, 1275], [690, 1325], [790, 1250], [885, 1115], [925, 940], [945, 780], [962, 700], [985, 590], [1005, 500], [1012, 430]];
const mapTex = () => ctex("cabinMapB", MW, MH, (g, r) => {
  // parchment
  g.fillStyle = "#dcc392"; g.fillRect(0, 0, MW, MH);
  for (let i = 0; i < 60; i++) { const x = r() * MW, y = r() * MH, rr = 40 + r() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.6 ? "rgba(190,150,90,0.18)" : "rgba(255,245,215,0.3)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  // sea tint
  g.fillStyle = "rgba(120,170,190,0.28)"; g.fillRect(30, 30, MW - 60, MH - 60);
  for (let y = 60; y < MH; y += 46) { g.strokeStyle = "rgba(70,110,140,0.18)"; g.lineWidth = 2; g.beginPath(); for (let x = 40; x < MW - 40; x += 30) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 4); g.stroke(); }
  const land = (pts: [number, number][], col = "#cfb47a") => {
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = col; g.fill(); g.strokeStyle = "#5a3a22"; g.lineWidth = 6; g.lineJoin = "round"; g.stroke();
    g.save(); g.clip(); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(110,140,70,0.25)"; g.beginPath(); g.arc(r() * MW, r() * MH, 10 + r() * 30, 0, TAU); g.fill(); } g.restore();
  };
  // North America (top left), South America, Europe/Africa (middle), Arabia/India (top right), Madagascar
  land([[30, 30], [330, 30], [300, 120], [250, 200], [270, 260], [215, 300], [190, 360], [150, 420], [120, 520], [60, 560], [30, 560]]);
  land([[100, 640], [220, 600], [330, 660], [390, 720], [370, 820], [300, 930], [240, 1080], [190, 1250], [150, 1400], [120, 1470], [90, 1470], [80, 1100], [60, 800]]);
  land([[520, 30], [700, 30], [720, 160], [650, 230], [580, 300], [520, 360], [500, 430], [540, 520], [620, 560], [720, 600], [760, 680], [740, 800], [720, 940], [690, 1080], [660, 1200], [620, 1240], [580, 1180], [560, 1020], [520, 880], [480, 760], [440, 640], [420, 520], [450, 420], [480, 300], [500, 160]]);
  land([[760, 30], [1170, 30], [1170, 280], [1110, 330], [1060, 380], [1012, 420], [960, 470], [920, 560], [880, 520], [850, 440], [800, 400], [760, 300], [730, 200]]);
  land([[820, 960], [860, 930], [870, 1000], [840, 1080], [810, 1060]]);
  // equator: bold red line + label
  g.strokeStyle = "#c8262e"; g.lineWidth = 10; g.setLineDash([]); g.beginPath(); g.moveTo(30, 700); g.lineTo(MW - 30, 700); g.stroke();
  g.fillStyle = "#c8262e"; g.font = "900 46px Georgia, serif"; g.textAlign = "left"; g.textBaseline = "bottom"; g.fillText("EQUATOR", 780, 690);
  // dotted route (the full trip), drawn under the solid travelled part (a 3D ribbon on the table)
  g.strokeStyle = "#4a2a18"; g.lineWidth = 7; g.setLineDash([4, 18]); g.lineCap = "round";
  g.beginPath(); ROUTE.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]);
  // ports
  const port = (x: number, y: number) => { g.fillStyle = "#c8262e"; g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill(); g.strokeStyle = "#3a2216"; g.lineWidth = 5; g.stroke(); };
  port(P.boston[0], P.boston[1]); port(P.calcutta[0], P.calcutta[1]); port(640, 1250);
  const label = (t: string, x: number, y: number, fs: number, al: CanvasTextAlign = "left") => { g.font = `900 ${fs}px Georgia, serif`; g.textAlign = al; g.textBaseline = "middle"; g.lineWidth = 12; g.strokeStyle = "#f3e6c0"; g.strokeText(t, x, y); g.fillStyle = "#3a2216"; g.fillText(t, x, y); };
  label("BOSTON", 250, 245, 56); label("CALCUTTA", 1000, 350, 52, "right"); label("CAPE OF", 640, 1330, 46, "center"); label("GOOD HOPE", 640, 1385, 46, "center");
  // compass rose + sea monster doodle + border
  const cx = 320, cy = 1150; g.strokeStyle = "#5a3a22"; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 70, 0, TAU); g.stroke();
  g.fillStyle = "#5a3a22"; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU - Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95); g.lineTo(cx + Math.cos(a + 0.5) * 22, cy + Math.sin(a + 0.5) * 22); g.lineTo(cx + Math.cos(a - 0.5) * 22, cy + Math.sin(a - 0.5) * 22); g.fill(); }
  label("N", cx, cy - 120, 40, "center");
  g.strokeStyle = "#5a3a22"; g.lineWidth = 5; g.beginPath(); for (let k = 0; k < 3; k++) g.arc(1000 + k * 50, 1180, 22, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(1150, 1170, 12, 0, TAU); g.stroke();
  g.strokeStyle = "#5a3a22"; g.lineWidth = 14; g.strokeRect(14, 14, MW - 28, MH - 28); g.lineWidth = 3; g.strokeRect(34, 34, MW - 68, MH - 68);
});
const calTex = (m: string) => ctex("cabinCal_" + m, 256, 320, (g) => {
  g.fillStyle = "#f6ecd2"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#b8302e"; g.fillRect(0, 0, 256, 120);
  g.fillStyle = "#fff6e0"; g.font = "900 96px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(m, 128, 66);
  g.fillStyle = "#3a2216"; g.font = "700 30px Georgia, serif"; g.fillText("1833", 128, 148);
  g.strokeStyle = "rgba(58,34,22,0.5)"; g.lineWidth = 2; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) g.strokeRect(14 + c * 33, 174 + r * 34, 30, 30);
  g.strokeStyle = "#b8302e"; g.lineWidth = 4; for (let k = 0; k < 9; k++) { const c = k % 7, r = Math.floor(k / 7); g.beginPath(); g.moveTo(18 + c * 33, 178 + r * 34); g.lineTo(40 + c * 33, 200 + r * 34); g.moveTo(40 + c * 33, 178 + r * 34); g.lineTo(18 + c * 33, 200 + r * 34); g.stroke(); }
});
const globeTex = () => ctex("cabinGlobeB", 512, 256, (g, r) => {
  g.fillStyle = "#7fb0c0"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#d9c08a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 30 + r() * 50, 20 + r() * 40, r() * 3, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(60,40,30,0.4)"; g.lineWidth = 2; for (let x = 0; x < 512; x += 43) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } for (let y = 32; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
const compassTex = () => ctex("cabinCompassB", 256, 256, (g) => {
  g.fillStyle = "#f3e6c0"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  g.strokeStyle = "#3a2216"; g.lineWidth = 4; g.beginPath(); g.arc(128, 128, 110, 0, TAU); g.stroke();
  g.fillStyle = "#c8262e"; g.beginPath(); g.moveTo(128, 30); g.lineTo(144, 128); g.lineTo(112, 128); g.fill(); g.fillStyle = "#3a2216"; g.beginPath(); g.moveTo(128, 226); g.lineTo(144, 128); g.lineTo(112, 128); g.fill();
  g.font = "900 30px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("N", 128, 20 + 12); g.fillText("S", 128, 236 - 8); g.fillText("E", 236 - 8, 128); g.fillText("W", 22, 128);
});

export const cabin = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const r = rng(555);
  const panel = lam("cabinPanel", () => ({ map: boardsV("cabinPanel", "#a0583a", 0.5) }));
  const wain = lam("cabinWain", () => ({ map: boardsH("cabinWain", "#6a3a2a", 0.6) }));
  const floor = lam("cabinFloor", () => ({ map: boardsH("cabinFloor", "#b0704a", 0.35) }));
  const beam = lam("cabinBeam", () => ({ map: beamStain("cabinBeam", "#7a4a3a", 0.45) }));
  const ceil = lam("cabinCeil", () => ({ map: boardsH("cabinCeil", "#8a5a48", 0.5) }));
  const trimM = lam("cabinTrim", () => ({ map: beamStain("cabinTrim", "#d0a070", 0.1) }));
  const brass = metal("cabinBrass", "#d9a640", 60);
  const iron = metal("cabinIron", "#4b5468", 40);
  const X0 = -2.3, X1 = 2.3, ZB = -2.3, ZF = 3.0, H = 2.45;
  // ---- floor, walls (panelled, dark wainscot), low ceiling with heavy beams ----
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 2, (ZF - ZB) / 2), floor);
  const PX = 1.25, PY = 1.55, PR = 0.3; // porthole centre on the back wall
  // back wall with a round porthole hole (extruded shape)
  const sh = new THREE.Shape(); sh.moveTo(X0, 0); sh.lineTo(X1, 0); sh.lineTo(X1, H); sh.lineTo(X0, H); sh.closePath();
  const hole = new THREE.Path(); hole.absarc(PX, PY, PR, 0, TAU, true); sh.holes.push(hole);
  const bwG = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false, curveSegments: 36 }); bwG.translate(0, 0, ZB - 0.25);
  { const uv = bwG.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); }
  const bw = new THREE.Mesh(bwG, panel); bw.receiveShadow = true; root.add(bw);
  shell.add(boxGeo(V(X0 - 0.25, 0, ZB), V(X0, H, ZF), 2), panel);
  shell.add(boxGeo(V(X1, 0, ZB), V(X1 + 0.25, H, ZF), 2), panel);
  shell.add(boxGeo(V(X0, 0, ZF), V(X1, H, ZF + 0.25), 2), panel);
  b.add(boxGeo(V(X0, 0, ZB), V(X1, 0.9, ZB + 0.05), 2), wain); b.add(boxGeo(V(X0, 0, ZB), V(X0 + 0.05, 0.9, ZF), 2), wain); b.add(boxGeo(V(X1 - 0.05, 0, ZB), V(X1, 0.9, ZF), 2), wain);
  b.add(boxGeo(V(X0, 0.88, ZB), V(X1, 0.96, ZB + 0.09)), trimM); b.add(boxGeo(V(X0, 0.88, ZB), V(X0 + 0.09, 0.96, ZF)), trimM); b.add(boxGeo(V(X1 - 0.09, 0.88, ZB), V(X1, 0.96, ZF)), trimM);
  shell.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 2, (ZF - ZB) / 2), ceil);
  for (let z = ZB + 0.35; z < ZF; z += 0.9) b.add(boxGeo(V(X0, H - 0.2, z - 0.1), V(X1, H, z + 0.1), 2), beam);
  for (const x of [X0 + 0.1, X1 - 0.1]) for (const z of [ZB + 0.1, 0.0]) b.add(boxGeo(V(x - 0.1, 0, z - 0.1), V(x + 0.1, H, z + 0.1), 2), beam); // ribs / knees
  // ---- the porthole: brass rim, glass, moonlit sea outside + moon, a moonbeam onto the table ----
  const rim = new THREE.Mesh(new THREE.TorusGeometry(PR + 0.04, 0.06, 12, 40), brass); rim.position.set(PX, PY, ZB + 0.03); root.add(rim);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), brass); bolt.position.set(PX + Math.cos(a) * (PR + 0.13), PY + Math.sin(a) * (PR + 0.13), ZB + 0.02); root.add(bolt); }
  const glass = new THREE.Mesh(new THREE.CircleGeometry(PR, 32), new THREE.MeshBasicMaterial({ color: "#a8c0ff", transparent: true, opacity: 0.12, depthWrite: false })); glass.position.set(PX, PY, ZB - 0.12); glass.layers.set(NOINK); root.add(glass);
  const gl1 = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.4), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, depthWrite: false })); gl1.position.set(PX - 0.1, PY + 0.05, ZB - 0.11); gl1.rotation.z = -0.6; gl1.layers.set(NOINK); root.add(gl1);
  waterPlane(root, -40, 60, -200, ZB - 0.3, -1.2);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("moonB", 128, 128, (g) => { g.fillStyle = "#f6f2dc"; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); }), color: new THREE.Color(1.6, 1.6, 1.5), fog: false, transparent: true }));
  moon.scale.set(2.2, 2.2, 1); moon.position.set(PX + 3.4, PY + 3.0, -26); moon.layers.set(NOINK); root.add(moon);
  glow(root, [PX + 3.4, PY + 3.0, -26.2], "#9fb4ff", 9, 0.6);
  const sparkle = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + (i % 3) * 0.3, 0.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#e6eeff", transparent: true, opacity: 0.8, depthWrite: false, fog: false })); m.position.set(PX + 2.0 + (i % 4) * 0.4 - 0.8, -1.15, -8 - i * 1.6); m.layers.set(NOINK); root.add(m); return m; });
  const beamS = shaft(root, [PX, PY, ZB + 0.05], [0.5, 0.86, -0.2], 0.55, "#a8bcff", 0.18);
  const moonL = new THREE.SpotLight("#9ab0ff", 6, 6, 0.4, 0.7, 1.2); moonL.position.set(PX, PY, ZB + 0.1); moonL.target.position.set(0.4, 0.85, 0); root.add(moonL, moonL.target);
  const dust = motes(root, [0.4, 0.9, -2.1], [1.4, 1.8, -0.4], 30, "#c8d6ff", 0.025, 0.7, 4);
  // ---- the chart table with the big map ----
  const TX = 0.8, TZ = 0.95, TY = 0.85;
  b.add(boxGeo(V(-TX - 0.06, TY - 0.08, -TZ - 0.06), V(TX + 0.06, TY - 0.005, TZ + 0.06), 1.5), trimM);
  b.add(boxGeo(V(-TX - 0.06, TY - 0.24, -TZ - 0.06), V(TX + 0.06, TY - 0.08, TZ + 0.06), 1.5), beam);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.06, 0.05, TY - 0.24, 10).translate(sx * (TX - 0.1), (TY - 0.24) / 2, sz * (TZ - 0.1)), beam);
  for (const sx of [-1, 1]) b.add(boxGeo(V(-TX - 0.07, TY - 0.005, sx * TZ - 0.03), V(TX + 0.07, TY + 0.03, sx * TZ + 0.03)), trimM); // fiddle rails
  const mapW = 1.2, mapD = 1.5;
  const map = new THREE.Mesh(new THREE.PlaneGeometry(mapW, mapD).rotateX(-Math.PI / 2), lam("cabinMap", () => ({ map: mapTex() })));
  map.position.set(0, TY + 0.002, 0); map.receiveShadow = true; root.add(map);
  const toW = (px: number, py: number) => V(-mapW / 2 + (px / MW) * mapW, TY + 0.006, -mapD / 2 + (py / MH) * mapD);
  // the route as a curve on the table; the travelled part = a ribbon drawn up to ctl route
  const curve = new THREE.CatmullRomCurve3(ROUTE.map(([x, y]) => toW(x, y)), false, "centripetal");
  const NS = 200, rw = 0.012, rpos: number[] = [], ridx: number[] = [];
  for (let i = 0; i <= NS; i++) { const p = curve.getPointAt(i / NS), tg = curve.getTangentAt(i / NS), n = V(-tg.z, 0, tg.x).normalize(); rpos.push(p.x + n.x * rw, p.y + 0.002, p.z + n.z * rw, p.x - n.x * rw, p.y + 0.002, p.z - n.z * rw); if (i < NS) { const k = i * 2; ridx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(rpos, 3)); rg.setIndex(ridx);
  const ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: new THREE.Color("#b0242a").multiplyScalar(0.85) })); ribbon.layers.set(NOINK); root.add(ribbon);
  // toy ship (hull, two masts, sails, pennant) that rides the route
  const toy = new THREE.Group(); root.add(toy);
  const tb = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.07, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 1), lam("cabinToyHull", () => ({ color: "#6a3a22" }))); tb.position.y = 0.018; toy.add(tb);
  const tdeck = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.008, 0.03), lam("cabinToyDeck", () => ({ color: "#e0b070" }))); tdeck.position.y = 0.032; toy.add(tdeck);
  const sailM = lam("cabinToySail", () => ({ color: "#fbf3de", side: THREE.DoubleSide }));
  for (const mx of [-0.02, 0.025]) { rod(toy, [mx, 0.03, 0], [mx, 0.13, 0], 0.003, lam("cabinToyMast", () => ({ color: "#4a2a18" }))); const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.06), sailM); sl.scale.set(1, 1, 1); const sail = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.065, 0.045), sailM); sail.position.set(mx + 0.004, 0.085, 0); toy.add(sail); void sl; }
  const pen = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.012), lam("cabinToyFlag", () => ({ color: "#c8262e", side: THREE.DoubleSide }))); pen.position.set(0.037, 0.14, 0); toy.add(pen);
  // instruments on the table: compass, sextant, dividers, candle, books, rolled charts, a mug
  const comp = new THREE.Group(); comp.position.set(-0.55, TY, 0.75); root.add(comp);
  comp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.06, 24), brass).translateY(0.03));
  const cface = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: compassTex(), color: new THREE.Color(0.95, 0.85, 0.7) })); cface.position.y = 0.062; comp.add(cface);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.004, 0.14), lam("cabinNeedle", () => ({ color: "#c8262e" }))); needle.position.y = 0.066; comp.add(needle);
  const sext = new THREE.Group(); sext.position.set(0.55, TY + 0.01, 0.62); sext.rotation.set(-Math.PI / 2, 0, 0.6); root.add(sext);
  sext.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 20, Math.PI / 3), brass));
  rod(sext, [0, 0, 0], [0.16, 0, 0], 0.006, brass); rod(sext, [0, 0, 0], [0.08, 0.14, 0], 0.006, brass); rod(sext, [0, 0, 0], [0.13, 0.09, 0], 0.005, iron);
  rod(root, [-0.2, TY + 0.005, 0.55], [-0.05, TY + 0.005, 0.68], 0.004, brass); rod(root, [-0.2, TY + 0.005, 0.55], [-0.08, TY + 0.005, 0.5], 0.004, brass); // dividers
  const cand = candle(root, [0.62, TY, -0.78], 1.1, 4.5, 4);
  book(root, [-0.62, TY, -0.72], 0.24, 0.05, 0.32, "#2f5d9a", 0.2); book(root, [-0.6, TY + 0.05, -0.74], 0.22, 0.04, 0.3, "#8a2a2a", -0.1);
  for (let i = 0; i < 3; i++) { const rc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12).rotateZ(Math.PI / 2), lam("cabinChart", () => ({ color: "#efdcae" }))); rc.position.set(-0.3 + i * 0.05, TY + 0.035 + (i === 1 ? 0.06 : 0), -0.85 - (i % 2) * 0.03); rc.rotation.y = 0.1 * i; root.add(rc); }
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14), lam("cabinMug", () => ({ color: "#3f6a8a" }))); mug.position.set(0.7, TY + 0.05, 0.25); root.add(mug);
  // ---- hanging brass lantern over the table (swings with the ship) ----
  const pv = new THREE.Group(); pv.position.set(-0.95, H - 0.2, 0.75); root.add(pv);
  rod(pv, [0, 0, 0], [0, -0.45, 0], 0.008, iron);
  const lan = lamp(pv, [0, -0.7, 0], "#ffb24f", 7, 7, "hang");
  lan.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.Material) === lam("lampIron", () => ({}))) m.material = brass; });
  // ---- wall dressing: calendar (month), framed ship picture, coat + hat hooks, shelves of books, globe, sea chest ----
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ map: calTex("JUN"), color: new THREE.Color(0.9, 0.82, 0.7) }));
  cal.position.set(0.0, 1.92, ZB + 0.012); cal.rotation.z = 0.03; root.add(cal);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), iron); nail.position.set(0.0, 2.2, ZB + 0.02); root.add(nail);
  const months = ["JUN", "JUL", "AUG", "SEP"].map((m) => calTex(m));
  const pic = new THREE.Group(); pic.position.set(-0.95, 1.6, ZB + 0.03); root.add(pic);
  const pf = new Batch(); for (const [x0, y0, x1, y1] of [[-0.24, -0.18, 0.24, -0.14], [-0.24, 0.14, 0.24, 0.18], [-0.24, -0.18, -0.2, 0.18], [0.2, -0.18, 0.24, 0.18]]) pf.add(boxGeo(V(x0, y0, 0), V(x1, y1, 0.04)), brass); pf.build(pic);
  const pim = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), new THREE.MeshBasicMaterial({ map: handTex("cabinPicB", 256, 180, "#9cc0d8", (g) => { g.fillStyle = "#2f5d9a"; g.fillRect(0, 120, 256, 60); g.fillStyle = "#5a3a22"; g.beginPath(); g.moveTo(70, 120); g.lineTo(190, 120); g.lineTo(175, 140); g.lineTo(85, 140); g.fill(); g.fillStyle = "#fbf3de"; g.beginPath(); g.moveTo(100, 115); g.lineTo(100, 40); g.lineTo(140, 115); g.fill(); g.beginPath(); g.moveTo(150, 115); g.lineTo(150, 30); g.lineTo(185, 115); g.fill(); }), color: new THREE.Color(0.85, 0.8, 0.75) })); pim.position.z = 0.02; pic.add(pim);
  for (const x of [-1.9, -1.6]) { const hk = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 5, 10, Math.PI), brass); hk.position.set(x, 1.75, ZB + 0.04); hk.rotation.z = Math.PI; root.add(hk); }
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 10).scale(1, 1, 0.35), lam("cabinCoat", () => ({ color: "#26386a" }))); coat.position.set(-1.9, 1.35, ZB + 0.1); root.add(coat);
  const bic = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 3, 1).rotateZ(Math.PI / 2).scale(1, 1, 0.3), lam("cabinHat", () => ({ color: "#1f2b4a" }))); bic.position.set(-1.6, 1.72, ZB + 0.08); root.add(bic);
  // book shelves on the left wall
  const shelfM = lam("cabinShelf", () => ({ map: beamHD() }));
  const bookCols = ["#8a2a2a", "#2f5d9a", "#3f7a4a", "#c9a04a", "#6a3a6a", "#b85a2a"];
  for (const y of [1.1, 1.5, 1.9]) { b.add(boxGeo(V(X0, y - 0.03, -1.6), V(X0 + 0.3, y, 0.4)), shelfM); b.add(boxGeo(V(X0 + 0.27, y, -1.6), V(X0 + 0.3, y + 0.06, 0.4)), trimM); let z = -1.55; while (z < 0.3) { const w = 0.04 + r() * 0.04, h = 0.2 + r() * 0.12; const bk = book(root, [X0 + 0.15, y, z + w / 2], 0.22, h, w, bookCols[Math.floor(r() * 6)], 0); bk.rotation.z = r() < 0.15 ? 0.25 : 0; z += w + 0.005; } }
  // globe on a stand (back right corner) + sea chest + a barrel
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), lam("cabinGlobe", () => ({ map: globeTex() }))); globe.position.set(1.75, 1.22, -1.6); globe.rotation.z = 0.4; root.add(globe);
  const gm = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.012, 6, 30, Math.PI * 1.2), brass); gm.position.copy(globe.position); gm.rotation.set(0, Math.PI / 2, 0.4); root.add(gm);
  rod(root, [1.75, 0.0, -1.6], [1.75, 0.98, -1.6], 0.03, beam);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rod(root, [1.75, 0.15, -1.6], [1.75 + Math.cos(a) * 0.25, 0, -1.6 + Math.sin(a) * 0.25], 0.02, beam); }
  const chest = lam("cabinChest", () => ({ map: beamStain("cabinChestT", "#7a3a2a", 0.4) }));
  b.add(boxGeo(V(-1.95, 0, -2.2), V(-1.05, 0.5, -1.65), 1), chest);
  const chestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.5, 1), chest); chestLid.position.set(-1.5, 0.5, -1.925); chestLid.rotation.x = -Math.PI / 2; root.add(chestLid);
  for (const x of [-1.8, -1.2]) b.add(boxGeo(V(x - 0.03, 0, -1.65), V(x + 0.03, 0.62, -1.62)), iron);
  barrel(root, [1.85, 0, 1.2], 0.36);
  // hammock rolled on hooks (sways)
  const ham = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.4, 4, 10).rotateZ(Math.PI / 2), lam("cabinHammock", () => ({ color: "#d8c8a0" }))); ham.position.set(0.2, H - 0.35, 2.3); root.add(ham);
  shell.build(root, false); b.build(root);
  const marks: Record<string, V3> = { captain: [-0.48, 0, -1.3], tudor: [0.48, 0, -1.3], table: [0, TY, 0], boston: toW(P.boston[0], P.boston[1]).toArray() as V3, calcutta: toW(P.calcutta[0], P.calcutta[1]).toArray() as V3 };
  const p0 = curve.getPointAt(0.12);
  const cams = {
    two: { pos: [0.0, 1.62, 2.15] as V3, look: [0.0, 1.15, -0.8] as V3, fov: 50 },
    top: { pos: [0.0, 2.2, 0.32] as V3, look: [0.0, TY, 0.0] as V3, fov: 64 },
    toy: { pos: [p0.x + 0.12, TY + 0.32, p0.z + 0.42] as V3, look: [p0.x, TY + 0.05, p0.z] as V3, fov: 40 },
  };
  const tmp = new THREE.Vector3();
  return {
    name: "cabin", root, marks, cams,
    pose: (t, c) => {
      flicker(lan, t); flameFlick(cand, t); dust.update(t);
      pv.rotation.z = 0.07 * Math.sin(t * 0.9); pv.rotation.x = 0.03 * Math.sin(t * 0.7 + 1);
      ham.rotation.x = 0.05 * Math.sin(t * 0.9);
      moonL.intensity = 6 * (0.9 + 0.1 * Math.sin(t * 0.5)); (beamS.material as THREE.MeshBasicMaterial).opacity = 0.16 + 0.03 * Math.sin(t * 0.8);
      sparkle.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.4 * Math.sin(t * 2 + i * 1.7)));
      needle.rotation.y = 0.15 * Math.sin(t * 0.8);
      // route + toy ship
      const u = Math.min(1, Math.max(0, c.route ?? 0));
      rg.setDrawRange(0, Math.floor(u * NS) * 6);
      const p = curve.getPointAt(u), tg = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)));
      toy.position.set(p.x, TY + 0.004 + 0.004 * Math.abs(Math.sin(t * 3)), p.z);
      toy.rotation.set(0.12 * Math.sin(t * 2.2), Math.atan2(-tg.z, tg.x), 0.08 * Math.sin(t * 1.7));
      void tmp;
      // calendar month
      const mi = Math.max(0, Math.min(3, Math.round(c.month ?? 0)));
      (cal.material as THREE.MeshBasicMaterial).map = months[mi];
    },
  };
};
