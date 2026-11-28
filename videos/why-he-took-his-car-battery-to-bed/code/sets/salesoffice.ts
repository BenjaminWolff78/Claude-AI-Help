// The shared late-1960s desert land-sales office, "Why He Put a Bridge in the Desert" (LAKESIDE LAND CO., invented).
// Home base of three scenes: exterior on the street, interior (the camera flies in through the open double door), the
// town model, the front counter, and the same room at night.
//
// Local frame: ground y = 0 (interior floor top y = 0.01, the walk slab top y = 0.02), the glass storefront faces local
// +z (the street) at z = 4, back wall at z = -3.8 (inside face), side walls x = -4.8 / +4.8 (inside faces), ceiling 3.1,
// roof top 3.4 (fascia to 3.65). Footprint x -5.2..5.0, z -4.0..4.1; the flat roof's DEEP OVERHANG runs out to z = 6.45
// over a concrete walk (x -5.2..5.7, z 4.1..6.6) on thin steel posts at x -2.9 / 3.6 / 5.5 (z 6.15); the left end is a
// stone-veneer fin wall (x -5.2..-4.8) that runs out under the overhang to z 6.4.
//   * Storefront: bulkheads + big glass panes x -4.8..-0.75 (gold-leaf "LAKESIDE LAND CO.") and x 2.55..4.8 (venetian
//     blinds inside), a pair of glazed doors x -0.6..2.4 (leaves hinged at -0.6 and 2.4, open INWARD), transom glass.
//   * Walk: slatted bench x -4.35..-3.05 (against the left bulkhead), sand-filled ashtray urn x -1.5, brochure rack
//     x 3.05 (right of the door). Roof: "LOTS FOR SALE" sign on steel legs (x -0.4..4.6, z 1.5, y 3.9..5.3, bulbs),
//     swamp cooler (x -3.2, z -1.8). Right wall: stucco with a side window (z -0.75..0.75, blinds inside).
//   * Interior (x -4.8..4.8, z -3.8..3.9, walnut veneer panelling, vinyl tile floor, acoustic tile ceiling):
//     boss's walnut desk x -2.4..-0.4, z -2.1..-1.2 (top 0.78) with nameplate PRESIDENT, telephone, ashtray + cigar,
//     green banker's lamp, desk fan (front-left), blotter, framed photo; leather swivel chair (reclined) at
//     bossDesk; the wall map of the town lots behind him (coloured pins, two sold), framed photo + calendar 1968;
//     filing cabinets x 1.55..2.55 on the back wall, water cooler + cup dispenser in the back-right corner; salesman A's
//     steel desk x -4.5..-3.1, z -1.0..-0.3 and salesman B's x 2.9..4.3, z -2.0..-1.3 (typewriters); the town model on
//     its table x -3.6..-1.2, z 0.6..2.2 (top 0.9); the front counter x 2.75..4.75, z 0.85..1.45 (top 1.02) with the
//     lot map, a pen on a chain and the SOLD stamp; coat stand x -1.0 z 3.45; cactus pot x -4.4 z 3.5; ceiling fan
//     x 0.9 z -0.4; a little sand on the floor inside the door; rug under the boss's desk.
//
// API: const so = salesOffice(parent);
//   so.g  group;  so.set({ door, fan, sweat, night, modelBridge, modelLots, modelCars, t })
//     door        0..1 both glazed door leaves swing open inward (1 = 88 deg, the camera lane is clear)
//     fan         0..1 desk fan speed (blades blur + gentle oscillation)
//     sweat       0..1 the heat: wall thermometer column 90 -> 115, the cooler bottle gurgles a bubble, the cactus droops
//     night       0..1 night version: deep night-blue street outside the windows (lit street lamp, a few lit windows
//                 across the street), ceiling lights off, green desk lamp brighter (warm pool), blinds half closed,
//                 sun shafts swap for faint cool street-lamp stripes. Use light preset officeNight with it.
//     modelBridge 0..1 the tiny bridge on the town model: 0 hovering 25 cm above its spot, 1 seated (smooth)
//     modelLots   0..1 the model's lots light up and their FOR SALE flags flip to SOLD one by one, outward from the bridge
//     modelCars   0..1 tiny station wagon: highway -> pulls off at the tiny dinosaur (0.25..0.45 parked) -> into town to
//                 the bridge; a second tiny car drives along the highway the other way
//     t           seconds (ambient: ceiling fan, cigar smoke, dust motes, lamp, sun shafts breathe)
//   so.MARKS (local feet positions, y = 0 unless noted):
//     bossDesk [-1.4,0,-2.5] the boss in his chair behind the desk (bossSeat [-1.4,0.72,-2.5] = the card origin for mode
//     "sit" + feetUp 1 + facing 1: his level legs then land on the desk top (0.74) to screen right; bossFeet
//     [-0.9,0.77,-2.0] where his heels rest, kept clear), agentDoor [1.0,0,2.6] just
//     inside the door, salesA [-3.8,0,-1.35] / salesB [3.6,0,-2.45] behind their desks, window [-2.6,0,5.4] outside the
//     storefront on the walk, walkA [-3.7,0,5.2] in front of the bench (benchSeat [-3.7,0.45,4.62] sitting on it),
//     walkB [3.7,0,5.3] by the brochure rack, doorOut [1.0,0,5.6] outside the door, modelSide [-2.4,0,0.22] boss at the
//     model table (back edge) with his hands over the tiny bridge, modelBridge [-2.4,0.94,1.05] the bridge's seat on
//     the model, counterSales [3.75,0,0.42] behind the counter, counterDad [3.0,0,2.0], counterMom [3.85,0,2.05],
//     counterKid1 [4.45,0,2.2], counterKid2 [3.4,0,2.55] the family in front of it.
//   so.SOLIDS [min, max][] local (walls, roof, posts, furniture; NOT the door lane x -0.6..2.4, y 0..2.65 at z 3.9..4.1
//     and the room inside it).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import { glow, shaft } from "../setkit";
import { motes, lamCustom } from "./innerkit_b";
import { fitText, cl, sm, lerp, puff, risePuffs } from "./portkit_common";
import { seg, lathe, brassM, silverM } from "./hotel";
import { blot, center, noink, phong, mesh, TAU, tinyBridge, tinyHouse, tinyCar, lotFlag, dino, tinyCactus, tinyPalm, smooth01, LotFlag } from "./mapkit";
import type { V3 } from "./types";

export type SalesOffice = { g: THREE.Group; set: (c: { door?: number; fan?: number; sweat?: number; night?: number; modelBridge?: number; modelLots?: number; modelCars?: number; t?: number }) => void; MARKS: Record<string, V3>; SOLIDS: [V3, V3][] };

const X0 = -4.8, X1 = 4.8, ZB = -3.8, ZF = 4.0, CH = 3.1;
const DL = -0.6, DR = 2.4, DH = 2.68; // door opening
const MT = { x0: -3.6, x1: -1.2, z0: 0.6, z1: 2.2, y: 0.9 }; // model table
const MC = { u: (MT.x0 + MT.x1) / 2, w: (MT.z0 + MT.z1) / 2 };

// ---------------- textures ----------------
/** vinyl tile floor: 1024 px = 2.4 m (8 x 8 tiles of 0.3 m), cream speckled tiles with terracotta + teal accents */
const floorTex = () => ctex("soFloor", 1024, 1024, (g, r) => {
  const n = 8, s = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const acc = (i + 2 * j) % 7 === 0 ? "#c8734e" : (i * 3 + j) % 11 === 0 ? "#5e9a92" : null;
    g.fillStyle = jit(r, acc ?? "#e8dcc0", 0.04, 3, 0.08); g.fillRect(i * s, j * s, s, s);
    for (let k = 0; k < 90; k++) { g.fillStyle = r() < 0.5 ? "rgba(120,96,70,0.28)" : "rgba(255,255,245,0.35)"; g.fillRect(i * s + r() * s, j * s + r() * s, 1.5 + r() * 3, 1.5 + r() * 2); }
    blot(g, i * s + s * (0.3 + r() * 0.4), j * s + s * (0.3 + r() * 0.4), s * 0.5, "rgba(255,250,235,0.25)");
  }
  g.fillStyle = "rgba(90,70,50,0.45)"; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1, 0, 2, 1024); g.fillRect(0, i * s - 1, 1024, 2); }
  for (let k = 0; k < 20; k++) blot(g, r() * 1024, r() * 1024, 50 + r() * 120, "rgba(110,80,50,0.08)");
  g.strokeStyle = "rgba(80,60,40,0.22)"; g.lineCap = "round"; for (let k = 0; k < 40; k++) { const x = r() * 1024, y = r() * 1024; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 6, x + 24 + r() * 30, y + (r() - 0.5) * 8); g.stroke(); }
});
/** walnut veneer panelling: 1024 x 1024 = 2.4 m wide x CH tall: random-width boards, V-grooves, grain, base + top trim */
const panelTex = () => ctex("soPanel", 1024, 1024, (g, r) => {
  let x = 0;
  while (x < 1024) {
    const w = 60 + r() * 50, base = jit(r, "#7a4a2c", 0.09, 4, 0.12);
    const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, base); gr.addColorStop(0.5, jit(r, base, 0.06)); gr.addColorStop(1, base); g.fillStyle = gr; g.fillRect(x, 0, w, 1024);
    for (let k = 0; k < 7; k++) { g.strokeStyle = r() < 0.5 ? "rgba(40,18,8,0.28)" : "rgba(190,120,70,0.18)"; g.lineWidth = 1 + r() * 2.5; const xx = x + 6 + r() * (w - 12); g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + (r() - 0.5) * 16, 300, xx + (r() - 0.5) * 16, 700, xx + (r() - 0.5) * 10, 1024); g.stroke(); }
    if (r() < 0.4) { const cy = 200 + r() * 600; g.strokeStyle = "rgba(40,18,8,0.3)"; g.lineWidth = 1.5; for (let q = 1; q < 5; q++) { g.beginPath(); g.ellipse(x + w / 2, cy, q * 4, q * 14, 0, 0, TAU); g.stroke(); } }
    g.fillStyle = "rgba(30,12,6,0.75)"; g.fillRect(x, 0, 3, 1024); g.fillStyle = "rgba(255,200,150,0.14)"; g.fillRect(x + 3, 0, 2, 1024);
    x += w;
  }
  const ppm = 1024 / CH, Y = (m: number) => 1024 - m * ppm;
  g.fillStyle = "#3e2414"; g.fillRect(0, Y(0.12), 1024, 0.12 * ppm); g.fillStyle = "rgba(255,210,160,0.2)"; g.fillRect(0, Y(0.12), 1024, 3);
  g.fillStyle = "#4a2c18"; g.fillRect(0, 0, 1024, 0.07 * ppm);
  for (let k = 0; k < 10; k++) blot(g, r() * 1024, Y(0.2 + r() * 0.8), 30 + r() * 60, "rgba(30,15,8,0.14)");
});
/** acoustic ceiling tile: 512 px = 1.2 m (2 x 2 tiles of 0.6 m) with pinholes and a white grid */
const ceilTex = () => ctex("soCeil", 512, 512, (g, r) => {
  g.fillStyle = "#efe8d6"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 1500; k++) { g.fillStyle = "rgba(120,110,90,0.35)"; g.beginPath(); g.arc(r() * 512, r() * 512, 0.9 + r() * 1.2, 0, TAU); g.fill(); }
  for (let k = 0; k < 6; k++) blot(g, r() * 512, r() * 512, 60 + r() * 80, "rgba(160,130,90,0.1)");
  g.fillStyle = "#faf7ee"; for (const p of [0, 256]) { g.fillRect(p, 0, 6, 512); g.fillRect(0, p, 512, 6); }
  g.fillStyle = "rgba(90,80,60,0.25)"; for (const p of [6, 262]) { g.fillRect(p, 0, 2, 512); g.fillRect(0, p, 512, 2); }
});
/** exterior stucco (pale desert peach): 512 px = 2 m */
const stuccoTex = () => ctex("soStucco", 512, 512, (g, r) => {
  g.fillStyle = "#ecd2b0"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 4000; k++) { g.fillStyle = r() < 0.5 ? "rgba(150,110,80,0.16)" : "rgba(255,248,235,0.3)"; g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3); }
  for (let k = 0; k < 24; k++) blot(g, r() * 512, r() * 512, 30 + r() * 90, r() < 0.5 ? "rgba(170,120,80,0.1)" : "rgba(255,240,220,0.12)");
  g.strokeStyle = "rgba(120,80,60,0.25)"; g.lineWidth = 1.2; for (let k = 0; k < 5; k++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 4; q++) { x += (r() - 0.5) * 40; y += r() * 30; g.lineTo(x, y); } g.stroke(); }
});
/** random-ashlar flagstone veneer in desert tones: 1024 px = 2 m, deep mortar gaps */
const stoneVeneerTex = () => ctex("soStone", 1024, 1024, (g, r) => {
  g.fillStyle = "#6a5048"; g.fillRect(0, 0, 1024, 1024);
  const cols = ["#c9a27a", "#b8845e", "#d6b994", "#a88a74", "#c8b49a", "#b07258", "#9c8a80"];
  let y = 0;
  while (y < 1024) {
    const h = 34 + r() * 46; let x = -r() * 60;
    while (x < 1024) {
      const w = 60 + r() * 120, c = jit(r, cols[Math.floor(r() * cols.length)], 0.08, 4, 0.12);
      const x0 = x + 5, y0 = y + 5, x1 = x + w - 5, y1 = y + h - 5;
      g.fillStyle = c; g.beginPath(); g.moveTo(x0 + r() * 6, y0); g.lineTo(x1 - r() * 6, y0 + r() * 4); g.lineTo(x1, y1 - r() * 5); g.lineTo(x0 + r() * 4, y1); g.closePath(); g.fill();
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, "rgba(255,245,225,0.28)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(60,30,20,0.25)"); g.fillStyle = gr; g.fill();
      for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(80,50,40,0.25)"; g.lineWidth = 1.2; g.beginPath(); const sx = x0 + r() * (x1 - x0); g.moveTo(sx, y0 + 2); g.lineTo(sx + (r() - 0.5) * 30, y0 + (y1 - y0) * (0.3 + r() * 0.6)); g.stroke(); }
      x += w;
    }
    y += h;
  }
});
/** concrete walk with expansion joints (1024 px = 4 m) */
const concreteTex = () => ctex("soConcrete", 1024, 1024, (g, r) => {
  g.fillStyle = "#d8cdb8"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 6000; k++) { g.fillStyle = r() < 0.5 ? "rgba(130,110,90,0.18)" : "rgba(255,250,240,0.25)"; g.fillRect(r() * 1024, r() * 1024, 1.5, 1.5); }
  for (let k = 0; k < 30; k++) blot(g, r() * 1024, r() * 1024, 40 + r() * 120, "rgba(150,120,90,0.1)");
  g.fillStyle = "rgba(90,70,60,0.45)"; for (let p = 0; p <= 1024; p += 256) { g.fillRect(p - 1.5, 0, 3, 1024); g.fillRect(0, p - 1.5, 1024, 3); }
  for (let k = 0; k < 14; k++) blot(g, r() * 1024, r() * 1024, 14 + r() * 26, "rgba(70,55,50,0.2)"); // gum + drips
});
const sandDriftTex = () => ctex("soSandDrift", 512, 256, (g, r) => {
  g.clearRect(0, 0, 512, 256);
  for (let k = 0; k < 40; k++) blot(g, 40 + r() * 432, 160 + r() * 96, 30 + r() * 60, "rgba(222,184,124,0.55)");
  for (let k = 0; k < 2500; k++) { const x = r() * 512, y = 100 + r() * 156; if (r() < (y - 100) / 156) { g.fillStyle = r() < 0.5 ? "rgba(196,150,92,0.8)" : "rgba(240,212,160,0.8)"; g.fillRect(x, y, 2, 2); } }
  g.strokeStyle = "rgba(170,128,80,0.4)"; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const y = 170 + k * 10; g.beginPath(); g.moveTo(60 + r() * 60, y); g.bezierCurveTo(200, y - 8, 320, y + 8, 450 - r() * 60, y); g.stroke(); }
});
const rugTex = () => ctex("soRug", 1024, 768, (g, r) => {
  g.fillStyle = "#b8562e"; g.fillRect(0, 0, 1024, 768);
  g.strokeStyle = "#e8b04a"; g.lineWidth = 26; g.strokeRect(40, 40, 944, 688); g.strokeStyle = "#3e5a6a"; g.lineWidth = 12; g.strokeRect(84, 84, 856, 600);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = 170 + i * 137, y = 170 + j * 142; g.fillStyle = (i + j) % 2 ? "#e8b04a" : "#3e5a6a"; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 40, y); g.lineTo(x, y + 40); g.lineTo(x - 40, y); g.closePath(); g.fill(); }
  for (let k = 0; k < 8000; k++) { g.fillStyle = r() < 0.5 ? "rgba(60,20,10,0.15)" : "rgba(255,220,180,0.12)"; g.fillRect(r() * 1024, r() * 768, 2, 2); }
  for (let k = 0; k < 10; k++) blot(g, r() * 1024, r() * 768, 60 + r() * 100, "rgba(60,25,10,0.14)");
});
/** the wall map of the town lots ("LAKESIDE - TOWN LOTS"): 1600 x 1000 = 3.2 x 2.0 m */
const lotMapTex = () => ctex("soLotMap", 1600, 1000, (g, r) => {
  g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, 1600, 1000);
  for (let k = 0; k < 30; k++) blot(g, r() * 1600, r() * 1000, 60 + r() * 160, "rgba(180,140,90,0.08)");
  // the lake along the left, a channel, the peninsula
  g.fillStyle = "#8cc4d8"; g.beginPath(); g.moveTo(0, 0); g.lineTo(330, 0); g.bezierCurveTo(260, 200, 380, 330, 300, 520); g.bezierCurveTo(240, 680, 340, 820, 280, 1000); g.lineTo(0, 1000); g.closePath(); g.fill();
  g.strokeStyle = "#3a6a8a"; g.lineWidth = 4; g.stroke();
  g.fillStyle = "rgba(255,255,255,0.4)"; for (let k = 0; k < 20; k++) { const x = 40 + r() * 200, y = 40 + r() * 900; g.fillRect(x, y, 24, 3); }
  // streets (curving 1960s planned grid) + lot rectangles
  g.strokeStyle = "#c9b48e"; g.lineWidth = 18; g.lineCap = "round";
  const streetsY = [150, 330, 510, 690, 870];
  for (const y of streetsY) { g.beginPath(); g.moveTo(360, y); g.bezierCurveTo(800, y - 40, 1100, y + 40, 1560, y); g.stroke(); }
  for (const x of [520, 820, 1120, 1420]) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 20, 960); g.stroke(); }
  g.strokeStyle = "#3a2a24"; g.lineWidth = 2;
  for (let j = 0; j < streetsY.length - 1; j++) for (let x = 380; x < 1540; x += 52) {
    const y0 = streetsY[j] + 16, y1 = streetsY[j + 1] - 16, ym = (y0 + y1) / 2;
    g.strokeRect(x, y0, 48, ym - y0 - 2); g.strokeRect(x, ym + 2, 48, y1 - ym - 2);
  }
  // title cartouche
  g.fillStyle = "#1f4a5a"; g.fillRect(980, 24, 560, 96); g.strokeStyle = "#e8b04a"; g.lineWidth = 6; g.strokeRect(988, 32, 544, 80);
  g.fillStyle = "#f4ead0"; center(g); fitText(g, "LAKESIDE · TOWN LOTS", 1260, 74, 500, 50, "900 %spx Georgia, serif");
  g.fillStyle = "#1f4a5a"; fitText(g, "LAKE", 150, 500, 220, 70, "italic 700 %spx Georgia, serif");
  // legend
  g.fillStyle = "#f4ead0"; g.fillRect(1240, 900, 330, 80); g.strokeStyle = "#3a2a24"; g.lineWidth = 2; g.strokeRect(1240, 900, 330, 80);
  g.fillStyle = "#c8352e"; g.beginPath(); g.arc(1270, 926, 10, 0, TAU); g.fill(); g.fillStyle = "#f2e6c8"; g.strokeStyle = "#3a2a24"; g.beginPath(); g.arc(1270, 956, 10, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = "#3a2a24"; g.textAlign = "left"; fitText(g, "SOLD", 1295, 928, 240, 26, "700 %spx Georgia, serif"); fitText(g, "AVAILABLE", 1295, 958, 240, 26, "700 %spx Georgia, serif");
  g.strokeStyle = "#5a3a24"; g.lineWidth = 14; g.strokeRect(7, 7, 1586, 986);
});
const calendarTex = () => ctex("soCalendar", 256, 380, (g) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 256, 380);
  // picture: a sunset over the lake
  const gr = g.createLinearGradient(0, 0, 0, 150); gr.addColorStop(0, "#f4a35c"); gr.addColorStop(1, "#f2d38a"); g.fillStyle = gr; g.fillRect(12, 12, 232, 140);
  g.fillStyle = "#ffe8a8"; g.beginPath(); g.arc(128, 110, 26, 0, TAU); g.fill(); g.fillStyle = "#3a7aa0"; g.fillRect(12, 112, 232, 40); g.fillStyle = "#8a5a3a"; g.beginPath(); g.moveTo(12, 112); g.lineTo(80, 82); g.lineTo(130, 112); g.fill();
  g.fillStyle = "#c8352e"; center(g); fitText(g, "JULY 1968", 128, 178, 220, 36, "900 %spx Georgia, serif");
  g.strokeStyle = "#7a6a5a"; g.lineWidth = 1.5; for (let i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(14 + i * 32.6, 202); g.lineTo(14 + i * 32.6, 366); g.stroke(); } for (let j = 0; j <= 5; j++) { g.beginPath(); g.moveTo(14, 202 + j * 32.8); g.lineTo(242, 202 + j * 32.8); g.stroke(); }
  g.fillStyle = "#3a2a24"; let d = 1; for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) { if ((j === 0 && i < 1) || d > 31) continue; fitText(g, String(d++), 30 + i * 32.6, 218 + j * 32.8, 24, 16, "700 %spx Georgia, serif"); }
  g.strokeStyle = "#c8352e"; g.lineWidth = 3; g.beginPath(); g.ellipse(160, 284, 14, 12, 0, 0, TAU); g.stroke();
});
const photoTex = () => ctex("soPhoto", 320, 240, (g, r) => {
  // a faded aerial photo of the empty desert town plan (sepia), the founder's "before" picture
  const gr = g.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, "#cdb48c"); gr.addColorStop(1, "#a8895e"); g.fillStyle = gr; g.fillRect(0, 0, 320, 240);
  g.fillStyle = "#6e8aa0"; g.beginPath(); g.moveTo(0, 0); g.lineTo(90, 0); g.bezierCurveTo(60, 80, 110, 150, 70, 240); g.lineTo(0, 240); g.fill();
  g.strokeStyle = "rgba(250,240,220,0.7)"; g.lineWidth = 3; for (let y = 40; y < 240; y += 44) { g.beginPath(); g.moveTo(100, y); g.lineTo(320, y + 8); g.stroke(); } for (let x = 140; x < 320; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 240); g.stroke(); }
  for (let k = 0; k < 8; k++) { g.fillStyle = "rgba(240,230,210,0.85)"; g.fillRect(130 + r() * 170, 30 + r() * 190, 6, 5); }
  for (let k = 0; k < 600; k++) { g.fillStyle = "rgba(70,50,30,0.12)"; g.fillRect(r() * 320, r() * 240, 2, 2); }
  g.strokeStyle = "#f6efe0"; g.lineWidth = 14; g.strokeRect(0, 0, 320, 240);
});
const nameplateTex = () => ctex("soNameplate", 512, 96, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, "#f2d27a"); gr.addColorStop(0.5, "#c9973e"); gr.addColorStop(1, "#8a5a1c"); g.fillStyle = gr; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = "rgba(60,36,10,0.8)"; g.lineWidth = 6; g.strokeRect(5, 5, 502, 86);
  g.fillStyle = "#2a1a10"; center(g); fitText(g, "PRESIDENT", 256, 50, 440, 62, "900 %spx Georgia, serif");
});
const glassLetterTex = () => ctex("soGlassLetters", 2048, 640, (g) => {
  g.clearRect(0, 0, 2048, 640); g.lineJoin = "round"; center(g);
  const text = "LAKESIDE", R = 1700, cx = 1024, cy = 230 + R, span = 0.62;
  g.font = "900 200px Georgia, serif";
  const ws = [...text].map((ch) => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) * 1.08, k = (span * R) / tot;
  let a = -span / 2;
  [...text].forEach((ch, i) => {
    const w = ws[i] * 1.08 * k; a += w / R / 2; g.save(); g.translate(cx + Math.sin(a) * R, cy - Math.cos(a) * R); g.rotate(a); g.scale(k, 1);
    g.lineWidth = 22; g.strokeStyle = "rgba(40,24,20,0.92)"; g.strokeText(ch, 0, 0);
    const gr = g.createLinearGradient(0, -95, 0, 95); gr.addColorStop(0, "#fff2b8"); gr.addColorStop(0.45, "#e8b44a"); gr.addColorStop(0.55, "#b8822a"); gr.addColorStop(1, "#f6d784"); g.fillStyle = gr; g.fillText(ch, 0, 0);
    g.restore(); a += w / R / 2;
  });
  const line = (t: string, y: number, mw: number, s: number, fill: string) => { g.font = `900 ${s}px Georgia, serif`; const w = g.measureText(t).width; const fs = w > mw ? s * mw / w : s; g.font = `900 ${fs}px Georgia, serif`; g.lineWidth = fs * 0.13; g.strokeStyle = "rgba(40,24,20,0.92)"; g.strokeText(t, 1024, y); g.fillStyle = fill; g.fillText(t, 1024, y); };
  line("LAND CO.", 408, 900, 130, "#f2c860"); line("HOMESITES  ·  LOTS  ·  EASY TERMS", 548, 1560, 70, "#f6f1e6");
});
const openSignTex = () => ctex("soOpen", 256, 128, (g) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#c8352e"; g.lineWidth = 10; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = "#c8352e"; center(g); fitText(g, "OPEN", 128, 54, 200, 64, "900 %spx Georgia, serif"); g.fillStyle = "#3a2a24"; fitText(g, "COME IN", 128, 100, 160, 24, "700 %spx Georgia, serif");
});
const pushTex = () => ctex("soPush", 192, 64, (g) => { g.clearRect(0, 0, 192, 64); g.fillStyle = "#f6f1e6"; center(g); fitText(g, "PUSH", 96, 34, 170, 44, "900 %spx Georgia, serif"); });
const roofSignTex = () => ctex("soRoofSign", 2048, 560, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, "#f6f1e0"); gr.addColorStop(1, "#ead8b0"); g.fillStyle = gr; g.fillRect(0, 0, 2048, 560);
  g.fillStyle = "#1e8a86"; g.fillRect(0, 0, 2048, 70); g.fillRect(0, 490, 2048, 70);
  g.fillStyle = "#f2b33a"; for (let x = 0; x < 2048; x += 80) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 40, 100); g.lineTo(x + 80, 70); g.fill(); }
  center(g); g.lineJoin = "round";
  g.font = "900 300px Georgia, serif"; let fs = 300; const w = g.measureText("LOTS FOR SALE").width; if (w > 1880) fs = (300 * 1880) / w; g.font = `900 ${fs}px Georgia, serif`;
  g.lineWidth = fs * 0.1; g.strokeStyle = "#5a1a16"; g.strokeText("LOTS FOR SALE", 1024, 300); g.fillStyle = "#d8362a"; g.fillText("LOTS FOR SALE", 1024, 300);
  g.fillStyle = "#f6f1e0"; fitText(g, "LAKESIDE LAND CO.  ·  INQUIRE BELOW", 1024, 526, 1500, 46, "900 %spx Georgia, serif");
  for (let k = 0; k < 40; k++) blot(g, r() * 2048, r() * 560, 30 + r() * 80, "rgba(150,110,70,0.1)");
});
const coolerTex = () => ctex("soCoolerSide", 256, 256, (g) => {
  g.fillStyle = "#b8bcc4"; g.fillRect(0, 0, 256, 256);
  for (let y = 24; y < 236; y += 16) { g.fillStyle = "#6a6e7a"; g.fillRect(18, y, 220, 8); g.fillStyle = "#e4e6ea"; g.fillRect(18, y + 8, 220, 3); }
  g.strokeStyle = "#4a4e5a"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248);
  g.fillStyle = "rgba(150,90,50,0.35)"; g.fillRect(0, 220, 256, 36);
});
const brochureTex = () => ctex("soBrochures", 512, 256, (g, r) => {
  const cols = ["#e8573a", "#2f8fb8", "#f2c230", "#3aa36a", "#d8362a", "#1e8a86"];
  for (let i = 0; i < 8; i++) { const x = (i % 4) * 128, y = Math.floor(i / 4) * 128; g.fillStyle = cols[i % cols.length]; g.fillRect(x + 4, y + 4, 120, 120); g.fillStyle = "#f6f1e6"; g.fillRect(x + 14, y + 60, 100, 54); g.fillStyle = "#ffe8a8"; g.beginPath(); g.arc(x + 64, y + 40, 16, 0, TAU); g.fill(); g.fillStyle = "#3a2a24"; center(g); fitText(g, i % 2 ? "LAKESIDE" : "OWN A LOT", x + 64, y + 86, 92, 18, "900 %spx Georgia, serif"); g.fillRect(x + 24, y + 100, 80, 3); void r; }
});
const typeKeysTex = () => ctex("soKeys", 256, 128, (g) => {
  g.fillStyle = "#4a5a56"; g.fillRect(0, 0, 256, 128);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 11; i++) { g.fillStyle = "#1e2226"; g.beginPath(); g.arc(18 + i * 22 + j * 6, 22 + j * 26, 9, 0, TAU); g.fill(); g.fillStyle = "#f6f1e6"; g.fillRect(15 + i * 22 + j * 6, 20 + j * 26, 6, 3); }
  g.fillStyle = "#1e2226"; g.fillRect(60, 112, 140, 10);
});
const thermoTex = () => ctex("soThermo", 96, 384, (g) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, 96, 384); g.strokeStyle = "#c8352e"; g.lineWidth = 6; g.strokeRect(3, 3, 90, 378);
  g.fillStyle = "#3a2a24"; center(g); for (let k = 0; k <= 5; k++) { const y = 330 - k * 52; g.fillRect(56, y, 20, 3); fitText(g, String(70 + k * 10), 30, y + 2, 36, 18, "700 %spx Georgia, serif"); }
  g.fillStyle = "#c8352e"; fitText(g, "°F", 48, 22, 60, 20, "900 %spx Georgia, serif");
});
/** the painted night street seen through the windows (deep night blue, a row of low buildings, a few lit windows) */
const nightStreetTex = () => ctex("soNightStreet", 2048, 768, (g, r) => {
  const sky = g.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, "#0c1440"); sky.addColorStop(1, "#2a3a7a"); g.fillStyle = sky; g.fillRect(0, 0, 2048, 768);
  for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.5})`; g.beginPath(); g.arc(r() * 2048, r() * 300, 0.8 + r() * 1.6, 0, TAU); g.fill(); }
  g.fillStyle = "#1a2050"; g.beginPath(); g.moveTo(0, 420); for (let x = 0; x <= 2048; x += 128) g.lineTo(x, 380 + Math.sin(x * 0.004) * 30 + r() * 14); g.lineTo(2048, 768); g.lineTo(0, 768); g.fill(); // far mesas
  let x = 0;
  while (x < 2048) { const w = 160 + r() * 200, h = 120 + r() * 80, top = 560 - h; g.fillStyle = jit(r, "#262c62", 0.08); g.fillRect(x, top, w, 560 - top); g.fillStyle = "#1a1f4a"; g.fillRect(x - 6, top - 10, w + 12, 12);
    for (let i = 0; i < Math.floor(w / 60); i++) { const wx = x + 20 + i * 60, lit = r() < 0.35; g.fillStyle = lit ? "#ffcf7a" : "#141a40"; g.fillRect(wx, top + 34, 34, 40); if (lit) { blot(g, wx + 17, top + 54, 40, "rgba(255,200,110,0.35)"); g.fillStyle = "rgba(140,80,40,0.6)"; g.fillRect(wx + 15, top + 34, 3, 40); } }
    x += w + 30 + r() * 60; }
  g.fillStyle = "#2c3266"; g.fillRect(0, 560, 2048, 208); g.fillStyle = "#3a427a"; for (let k = 0; k < 2048; k += 120) g.fillRect(k, 660, 60, 6); // road + lane dashes
});
const poolTex = () => ctex("soPool", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
/** soft-edged venetian-blind stripes (light patch on the floor / a beam card) */
const stripeLightTex = (n: number) => ctex("soStripeLight" + n, 256, 512, (g) => {
  g.clearRect(0, 0, 256, 512);
  for (let i = 0; i < n; i++) { const y = (i + 0.2) * (512 / n), h = (512 / n) * 0.55; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.3, "rgba(255,255,255,1)"); gr.addColorStop(0.7, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, y, 256, h); }
  g.globalCompositeOperation = "destination-in"; const e = g.createLinearGradient(0, 0, 256, 0); e.addColorStop(0, "rgba(0,0,0,0)"); e.addColorStop(0.15, "rgba(0,0,0,1)"); e.addColorStop(0.85, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = e; g.fillRect(0, 0, 256, 512);
  g.globalCompositeOperation = "source-over";
});
const glassReflTex = () => ctex("soGlassRefl", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  const sky = g.createLinearGradient(0, 0, 0, 512); sky.addColorStop(0, "rgba(200,230,255,0.55)"); sky.addColorStop(0.55, "rgba(220,235,250,0.18)"); sky.addColorStop(0.7, "rgba(240,220,180,0.1)"); sky.addColorStop(1, "rgba(230,200,150,0.22)"); g.fillStyle = sky; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.55)"; for (const [x, w] of [[60, 70], [170, 22], [330, 90], [450, 18]]) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x + 300, 0); g.lineTo(x + 300 + w, 0); g.lineTo(x + w, 512); g.closePath(); g.fill(); }
});
// ---- the town model's painted base board: 4096 x 2668 = 2.3 x 1.5 m (u = x across, w = z toward the front) ----
const MW = 2.3, MD = 1.5, MPX = 4096 / MW;
/** model-local layout (metres, origin at the board centre; +w toward the front edge / the highway) */
const ML = { bridgeW: -0.43, lakeW: -0.62, chanW: 0.28, chanEnd: -0.22, hwyW: 0.62, mainU: 0.38, cross: [-0.12, 0.13, 0.38], dinoU: -0.78 };
const modelBaseTex = () => ctex("soModelBase", 4096, 2668, (g, r) => {
  const P = (u: number) => (u + MW / 2) * MPX, Q = (w: number) => (w + MD / 2) * MPX;
  // desert ground
  const gr = g.createLinearGradient(0, 0, 0, 2668); gr.addColorStop(0, "#e9b77c"); gr.addColorStop(1, "#dca066"); g.fillStyle = gr; g.fillRect(0, 0, 4096, 2668);
  for (let k = 0; k < 160; k++) blot(g, r() * 4096, r() * 2668, 40 + r() * 160, r() < 0.5 ? "rgba(255,225,170,0.18)" : "rgba(170,100,50,0.14)");
  for (let k = 0; k < 9000; k++) { g.fillStyle = r() < 0.5 ? "rgba(150,90,45,0.35)" : "rgba(255,235,190,0.4)"; g.fillRect(r() * 4096, r() * 2668, 3, 3); }
  // the lake along the back with a soft shore, the channel cut under the bridge into a round marina
  const lake = () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(4096, 0); g.lineTo(4096, Q(ML.lakeW + 0.06)); for (let x = 4096; x >= 0; x -= 64) g.lineTo(x, Q(ML.lakeW) + Math.sin(x * 0.006) * 34 + Math.sin(x * 0.017) * 14); g.closePath(); };
  const chan = () => { g.beginPath(); g.moveTo(P(-ML.chanW / 2), Q(ML.lakeW - 0.05)); g.lineTo(P(-ML.chanW / 2), Q(ML.chanEnd - ML.chanW / 2)); g.arc(P(0), Q(ML.chanEnd - ML.chanW / 2), (ML.chanW / 2) * MPX, Math.PI, 0, true); g.lineTo(P(ML.chanW / 2), Q(ML.lakeW - 0.05)); g.closePath(); };
  for (const [f, wcol] of [[lake, "#3a8fb8"], [chan, "#3a8fb8"]] as [() => void, string][]) {
    f(); g.save(); g.strokeStyle = "#f4dcae"; g.lineWidth = 40; g.stroke(); g.fillStyle = wcol; g.fill(); g.restore();
  }
  g.fillStyle = "rgba(255,255,255,0.5)"; for (let k = 0; k < 60; k++) { const x = r() * 4096, y = r() * (Q(ML.lakeW) - 60); g.fillRect(x, y, 30 + r() * 40, 5); }
  // the highway along the front edge + the main street + three cross streets (asphalt with painted centre lines)
  const road = (x0: number, y0: number, x1: number, y1: number, w: number, dash = true) => { g.strokeStyle = "#5e5a62"; g.lineWidth = w * MPX; g.lineCap = "butt"; g.beginPath(); g.moveTo(P(x0), Q(y0)); g.lineTo(P(x1), Q(y1)); g.stroke(); if (dash) { g.strokeStyle = "#f2d27a"; g.lineWidth = 6; g.setLineDash([30, 26]); g.beginPath(); g.moveTo(P(x0), Q(y0)); g.lineTo(P(x1), Q(y1)); g.stroke(); g.setLineDash([]); } };
  road(-MW / 2, ML.hwyW, MW / 2, ML.hwyW, 0.1);
  road(ML.mainU, ML.bridgeW, ML.mainU, ML.hwyW - 0.05, 0.075);
  for (const w of ML.cross) road(-1.05, w, 1.05, w, 0.055, false);
  road(ML.dinoU - 0.12, ML.hwyW - 0.05, ML.dinoU + 0.14, ML.hwyW - 0.05, 0.08, false); // the pull-off at the dinosaur
  // the bridge approach road across the channel (the bridge sits on it)
  road(-0.5, ML.bridgeW, -ML.chanW / 2 - 0.02, ML.bridgeW, 0.06, false); road(ML.chanW / 2 + 0.02, ML.bridgeW, ML.mainU + 0.04, ML.bridgeW, 0.06, false);
  // lot outlines: chalk-white rectangles with corner stakes
  g.strokeStyle = "rgba(255,248,230,0.85)"; g.lineWidth = 4;
  for (const lot of modelLots()) { g.strokeRect(P(lot.u - lot.hu), Q(lot.w - lot.hw), lot.hu * 2 * MPX, lot.hw * 2 * MPX); }
  // tiny shrubs (painted dots) and tyre tracks
  for (let k = 0; k < 260; k++) { const x = r() * 4096, y = Q(ML.lakeW + 0.08) + r() * (2668 - Q(ML.lakeW + 0.08)); g.fillStyle = "#8a9a4a"; g.beginPath(); g.arc(x, y, 4 + r() * 5, 0, TAU); g.fill(); g.fillStyle = "rgba(60,40,20,0.3)"; g.beginPath(); g.arc(x + 3, y + 3, 4, 0, TAU); g.fill(); }
  // frame border painted on the board edge
  g.strokeStyle = "#5a3a24"; g.lineWidth = 24; g.strokeRect(12, 12, 4072, 2644);
});
type Lot = { u: number; w: number; hu: number; hw: number; d: number; house: boolean };
let LOTS: Lot[] | null = null;
const modelLots = (): Lot[] => {
  if (LOTS) return LOTS;
  const out: Lot[] = [], r = rng(68);
  const bands: [number, number][] = [[-0.25, -0.15], [0.0, 0.07], [0.25, 0.32], [0.48, 0.52]];
  for (const [w0] of bands) for (let u = -1.0; u <= 1.0001; u += 0.14) {
    if (Math.abs(u - ML.mainU) < 0.1) continue;
    const w = w0 + 0.055; if (w < -0.1 && Math.abs(u) < 0.42) continue; // keep the bridge + marina clear
    out.push({ u, w, hu: 0.055, hw: 0.05, d: Math.hypot(u - 0.1, (w - ML.bridgeW) * 1.2), house: false });
  }
  // a handful already built near the main street (the town of a few hundred)
  for (const l of out) if (l.d < 0.55 && r() < 0.35) l.house = true;
  LOTS = out; return out;
};

// ---------------- the module ----------------
export const salesOffice = (parent: THREE.Object3D): SalesOffice => {
  const g = new THREE.Group(); parent.add(g);
  const shell = new Batch(), b = new Batch(), r = rng(1968);
  const add = <T extends THREE.Object3D>(o: T) => { g.add(o); return o; };
  const floorM = lam("soFloorM", () => ({ map: floorTex() }));
  const panelM = lam("soPanelM", () => ({ map: panelTex() }));
  const ceilM = lam("soCeilM", () => ({ map: ceilTex() }));
  const stuccoM = lam("soStuccoM", () => ({ map: stuccoTex() }));
  const stoneM = lam("soStoneM", () => ({ map: stoneVeneerTex() }));
  const concM = lam("soConcM", () => ({ map: concreteTex() }));
  const alu = phong("soAlu", { color: "#c9ccd2", specular: "#ffffff", shininess: 80 });
  const aluD = phong("soAluD", { color: "#8e929c", specular: "#ffffff", shininess: 60 });
  const steelPost = lam("soPost", () => ({ color: "#3e4a5a" }));
  const fasciaM = lam("soFascia", () => ({ color: "#f4efe2" })), tealM = lam("soTeal", () => ({ color: "#1e8a86" }));
  const walnut = phong("soWalnut", { color: "#6a3c22", specular: "#ffd0a0", shininess: 30 });
  const walnutD = phong("soWalnutD", { color: "#46261a", specular: "#ffd0a0", shininess: 25 });
  const steelDesk = phong("soSteelDesk", { color: "#8a9e94", specular: "#ffffff", shininess: 40 });
  const steelDark = phong("soSteelDark", { color: "#5a6a66", specular: "#ffffff", shininess: 40 });
  const linoTop = lam("soLino", () => ({ color: "#d8cdb0" }));
  const leather = phong("soLeather", { color: "#7a2a22", specular: "#ffc0a0", shininess: 45 });
  const black = phong("soBlack", { color: "#2a2632", specular: "#ffffff", shininess: 70 });
  const chrome = silverM(), brass = brassM();
  const paper = lam("soPaper", () => ({ color: "#f6f1e6" }));
  const glassTint = new THREE.MeshPhongMaterial({ color: "#bfe6e4", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const reflM = new THREE.MeshBasicMaterial({ map: glassReflTex(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const fl = (o: THREE.Object3D) => noink(o);

  // ================= SHELL =================
  // interior floor, ceiling, panelled walls (no shadow casting: the room takes the two-tone light like the other interiors)
  shell.add(quad(V(X0, 0.01, ZF - 0.1), V(X1, 0.01, ZF - 0.1), V(X1, 0.01, ZB), V(X0, 0.01, ZB), (X1 - X0) / 2.4, (ZF - 0.1 - ZB) / 2.4), floorM);
  shell.add(quad(V(X0, CH, ZB), V(X1, CH, ZB), V(X1, CH, ZF), V(X0, CH, ZF), (X1 - X0) / 1.2, (ZF - ZB) / 1.2), ceilM);
  shell.add(quad(V(X0, 0, ZB), V(X1, 0, ZB), V(X1, CH, ZB), V(X0, CH, ZB), (X1 - X0) / 2.4, 1), panelM);
  // the left wall inside is the stone fin wall itself (a mid-century stone feature wall)
  // right wall inside with the side window hole (z -0.75..0.75, y 1.1..2.6)
  const SW = { z0: -0.75, z1: 0.75, y0: 1.1, y1: 2.6 };
  for (const [za, zb, ya, yb] of [[ZB, SW.z0, 0, CH], [SW.z1, ZF, 0, CH], [SW.z0, SW.z1, 0, SW.y0], [SW.z0, SW.z1, SW.y1, CH]])
    shell.add(quad(V(X1, ya, za), V(X1, ya, zb), V(X1, yb, zb), V(X1, yb, za), (zb - ZB) / 2.4, yb / CH, (za - ZB) / 2.4, ya / CH), panelM);
  // walk slab + curb, exterior walls
  b.add(boxGeo(V(-5.2, -0.14, ZF + 0.05), V(5.7, 0.02, 6.6), 4), concM);
  b.add(boxGeo(V(-5.2, -0.16, 6.6), V(5.7, 0.0, 6.75)), lam("soCurb", () => ({ color: "#c8bca6" })));
  b.add(boxGeo(V(-5.2, -0.14, -4.05), V(5.0, 0.0, ZF + 0.05), 4), concM); // foundation slab (seen at the edges)
  b.add(boxGeo(V(DL, 0, ZF - 0.12), V(DR, 0.025, ZF + 0.1)), alu); // door threshold
  // back + right exterior walls (stucco), left fin wall (stone veneer both faces) running out under the overhang
  b.add(boxGeo(V(-4.8, 0, -4.0), V(5.0, CH, ZB - 0.02), 2), stuccoM);
  b.add(boxGeo(V(X1 + 0.02, 0, 3.9), V(5.0, CH, 4.1), 2), stuccoM);
  b.add(boxGeo(V(X1, SW.y1, SW.z0), V(5.0, SW.y1 + 0.02, SW.z1)), stuccoM); for (const zz of [SW.z0, SW.z1]) b.add(boxGeo(V(X1, SW.y0, zz - 0.01), V(5.0, SW.y1, zz + 0.01)), stuccoM);
  for (const [za, zb, ya, yb] of [[-4.0, SW.z0, 0, 3.15], [SW.z1, 4.05, 0, 3.15], [SW.z0, SW.z1, 0, SW.y0], [SW.z0, SW.z1, SW.y1, 3.15]])
    shell.add(quad(V(5.0, ya, zb), V(5.0, ya, za), V(5.0, yb, za), V(5.0, yb, zb), (zb - za) / 2, (yb - ya) / 2), stuccoM);
  b.add(boxGeo(V(4.8, 0, SW.z0 - 0.02), V(5.0, SW.y0, SW.z0)), stuccoM);
  b.add(boxGeo(V(4.78, SW.y0 - 0.04, SW.z0 - 0.06), V(5.08, SW.y0, SW.z1 + 0.06)), fasciaM); // sill
  b.add(boxGeo(V(-5.2, 0, -4.2), V(-4.8, 3.2, 6.4), 2), stoneM);
  b.add(boxGeo(V(-5.26, 3.18, -4.26), V(-4.74, 3.26, 6.46)), lam("soCap", () => ({ color: "#b8a68c" })));
  // the flat roof: slab, deep overhang, white fascia with a teal stripe, gravel top, low parapet
  b.add(boxGeo(V(-5.2, CH, -4.3), V(5.7, 3.38, 6.45)), fasciaM);
  b.add(boxGeo(V(-5.22, 3.3, 6.45), V(5.72, 3.65, 6.52)), fasciaM); b.add(boxGeo(V(-5.22, 3.4, 6.52), V(5.72, 3.47, 6.53)), tealM);
  b.add(boxGeo(V(5.7, 3.3, -4.32), V(5.77, 3.65, 6.52)), fasciaM); b.add(boxGeo(V(5.77, 3.4, -4.32), V(5.78, 3.47, 6.52)), tealM);
  b.add(boxGeo(V(-5.22, 3.3, -4.37), V(5.77, 3.65, -4.3)), fasciaM);
  b.add(quad(V(-5.2, 3.39, 6.45), V(5.7, 3.39, 6.45), V(5.7, 3.39, -4.3), V(-5.2, 3.39, -4.3), 6, 6), lam("soGravel", () => ({ map: ctex("soGravelT", 256, 256, (q, rr) => { q.fillStyle = "#b8ab98"; q.fillRect(0, 0, 256, 256); for (let k = 0; k < 2200; k++) { q.fillStyle = jit(rr, "#a8988a", 0.2); q.beginPath(); q.arc(rr() * 256, rr() * 256, 1.5 + rr() * 2, 0, TAU); q.fill(); } }) })));
  // overhang soffit (seen from the walk): painted boards
  b.add(quad(V(-4.8, CH - 0.005, 6.45), V(-4.8, CH - 0.005, ZF), V(5.7, CH - 0.005, ZF), V(5.7, CH - 0.005, 6.45), 1, 1), lam("soSoffit", () => ({ map: ctex("soSoffitT", 512, 128, (q, rr) => { q.fillStyle = "#f0e6d0"; q.fillRect(0, 0, 512, 128); for (let x = 0; x < 512; x += 16) { q.fillStyle = "rgba(120,90,60,0.25)"; q.fillRect(x, 0, 2, 128); } void rr; }) })));
  // steel posts carrying the overhang
  for (const x of [-2.9, 3.6, 5.5]) { b.add(boxGeo(V(x - 0.05, 0, 6.1), V(x + 0.05, CH, 6.2)), steelPost); b.add(boxGeo(V(x - 0.12, 0.0, 6.03), V(x + 0.12, 0.04, 6.27)), steelPost); }
  // ceiling recess at the storefront head (inside) + soffit band above the glass (outside)
  b.add(boxGeo(V(-4.8, 2.95, ZF - 0.08), V(4.8, CH, ZF + 0.12)), fasciaM);

  // ================= STOREFRONT =================
  const GZ = ZF; // glass plane
  // bulkheads (stone veneer outside, panelled inside)
  for (const [a, c] of [[X0, -0.75], [2.55, X1]]) { b.add(boxGeo(V(a, 0, GZ - 0.1), V(c, 0.55, GZ + 0.12), 1.5), stoneM); b.add(boxGeo(V(a, 0.55, GZ - 0.12), V(c, 0.6, GZ + 0.14)), alu); }
  // aluminium mullions + transom bars + head
  for (const x of [X0 + 0.03, -2.75, -0.72, -0.6, DR, 2.55, 3.7, X1 - 0.03]) b.add(boxGeo(V(x - 0.035, 0.55, GZ - 0.05), V(x + 0.035, 2.95, GZ + 0.05)), alu);
  b.add(boxGeo(V(X0, 2.72, GZ - 0.05), V(X1, 2.8, GZ + 0.05)), alu);
  b.add(boxGeo(V(DL, DH, GZ - 0.06), V(DR, 2.72, GZ + 0.06)), alu);
  const panes: [number, number, number, number][] = [[X0 + 0.06, -2.79, 0.6, 2.72], [-2.71, -0.76, 0.6, 2.72], [2.59, 3.66, 0.6, 2.72], [3.74, X1 - 0.06, 0.6, 2.72], [X0, X1, 2.8, 2.95]];
  for (const [x0, x1, y0, y1] of panes) {
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), glassTint); gm.position.set((x0 + x1) / 2, (y0 + y1) / 2, GZ); fl(gm); add(gm);
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), reflM); rm.position.set((x0 + x1) / 2, (y0 + y1) / 2, GZ + 0.012); fl(rm); add(rm);
  }
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.125), new THREE.MeshBasicMaterial({ map: glassLetterTex(), transparent: true, depthWrite: false, color: new THREE.Color(1.05, 1.0, 0.9), side: THREE.DoubleSide }));
  letters.position.set(-2.77, 1.95, GZ + 0.006); fl(letters); add(letters);
  // door leaves (hinged at the jambs, swing inward)
  const leaves: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(side < 0 ? DL : DR, 0.02, GZ); add(lg); leaves.push(lg);
    const s = side < 0 ? 1 : -1, w = (DR - DL) / 2 - 0.01, db = new Batch(), L0 = (x: number) => s * x;
    const box = (xa: number, xb: number, ya: number, yb: number, m: THREE.Material, za = -0.025, zb = 0.025) => db.add(boxGeo(V(Math.min(L0(xa), L0(xb)), ya, za), V(Math.max(L0(xa), L0(xb)), yb, zb)), m);
    box(0, 0.07, 0, DH - 0.04, alu); box(w - 0.07, w, 0, DH - 0.04, alu); box(0, w, 0, 0.22, alu); box(0, w, DH - 0.13, DH - 0.04, alu);
    box(0.1, w - 0.1, 1.0, 1.04, chrome, 0.025, 0.06); box(0.12, 0.15, 0.98, 1.06, chrome, 0.0, 0.06); box(w - 0.15, w - 0.12, 0.98, 1.06, chrome, 0.0, 0.06); // push bar (street side)
    box(0.1, w - 0.1, 1.0, 1.04, chrome, -0.06, -0.025);
    db.build(lg);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, DH - 0.39), glassTint); pane.position.set(L0(w / 2), 0.22 + (DH - 0.39) / 2, 0); fl(pane); lg.add(pane);
    const rp = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, DH - 0.39), reflM); rp.position.set(L0(w / 2), 0.22 + (DH - 0.39) / 2, 0.006); fl(rp); lg.add(rp);
    const push = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), new THREE.MeshBasicMaterial({ map: pushTex(), transparent: true, depthWrite: false })); push.position.set(L0(w / 2), 1.22, 0.008); fl(push); lg.add(push);
    if (side > 0) { const op = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({ map: openSignTex(), side: THREE.DoubleSide })); op.position.set(L0(w / 2), 1.62, -0.01); lg.add(op); }
  }
  // venetian blinds: right storefront panes + the side window (slats tilt and lower with night)
  type Blind = { slats: THREE.Mesh[]; y0: number; y1: number; dirX: boolean };
  const blinds: Blind[] = [];
  const slatM = lam("soSlat", () => ({ color: "#efe8d8" }));
  const blind = (cx: number, cz: number, wdt: number, y0: number, y1: number, alongZ: boolean) => {
    const n = Math.round((y1 - y0) / 0.055), geo = alongZ ? new THREE.BoxGeometry(0.004, 0.05, wdt) : new THREE.BoxGeometry(wdt, 0.05, 0.004), slats: THREE.Mesh[] = [];
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, slatM); m.position.set(cx, y1 - 0.03 - i * 0.055, cz); m.castShadow = true; add(m); slats.push(m); }
    b.add(boxGeo(V(cx - (alongZ ? 0.04 : wdt / 2 + 0.02), y1, cz - (alongZ ? wdt / 2 + 0.02 : 0.04)), V(cx + (alongZ ? 0.04 : wdt / 2 + 0.02), y1 + 0.06, cz + (alongZ ? wdt / 2 + 0.02 : 0.04))), fasciaM);
    blinds.push({ slats, y0, y1, dirX: !alongZ });
  };
  blind(3.13, GZ - 0.1, 1.05, 0.62, 2.7, false); blind(4.25, GZ - 0.1, 1.05, 0.62, 2.7, false);
  blind(X1 - 0.08, 0, SW.z1 - SW.z0, SW.y0 + 0.02, SW.y1 - 0.02, true);
  { const gm = new THREE.Mesh(new THREE.PlaneGeometry(SW.z1 - SW.z0, SW.y1 - SW.y0), glassTint); gm.rotation.y = Math.PI / 2; gm.position.set(4.95, (SW.y0 + SW.y1) / 2, 0); fl(gm); add(gm);
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(SW.z1 - SW.z0, SW.y1 - SW.y0), reflM); rm.rotation.y = Math.PI / 2; rm.position.set(4.97, (SW.y0 + SW.y1) / 2, 0); fl(rm); add(rm);
    b.add(boxGeo(V(4.88, SW.y0, -0.02), V(5.0, SW.y1, 0.02)), alu); }

  // ================= WALK: bench, ashtray urn, brochure rack =================
  { const bx0 = -4.35, bx1 = -3.05, bz = 4.5;
    for (const x of [bx0 + 0.1, bx1 - 0.1]) b.add(boxGeo(V(x - 0.04, 0, bz - 0.22), V(x + 0.04, 0.42, bz + 0.2)), steelPost);
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(bx0, 0.42, bz - 0.2 + k * 0.105), V(bx1, 0.45, bz - 0.12 + k * 0.105)), lam("soBenchWood", () => ({ color: "#b87a44" })));
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(bx0, 0.55 + k * 0.12, bz - 0.27), V(bx1, 0.63 + k * 0.12, bz - 0.23)), lam("soBenchWood", () => ({ color: "#b87a44" })));
    for (const x of [bx0 + 0.1, bx1 - 0.1]) b.add(boxGeo(V(x - 0.03, 0.42, bz - 0.27), V(x + 0.03, 0.92, bz - 0.22)), steelPost); }
  { const ux = -1.5, uz = 4.55;
    b.add(lathe([[0, 0], [0.18, 0], [0.2, 0.06], [0.16, 0.12], [0.14, 0.55], [0.2, 0.62], [0.2, 0.66], [0, 0.66]], 20).translate(ux, 0, uz), phong("soUrn", { color: "#d8d4cc", specular: "#ffffff", shininess: 60 }));
    b.add(new THREE.CylinderGeometry(0.185, 0.185, 0.01, 20).translate(ux, 0.655, uz), lam("soUrnSand", () => ({ color: "#e2c08a" })));
    for (let k = 0; k < 5; k++) { const a = r() * TAU, d = r() * 0.12; b.add(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6).rotateZ(1.2).rotateY(a).translate(ux + Math.cos(a) * d, 0.665, uz + Math.sin(a) * d), lam("soButt", () => ({ color: k % 2 ? "#f4f0e6" : "#e8b07a" }))); } }
  { const rx = 3.05, rz = 4.45, rg = new THREE.Group(); rg.position.set(rx, 0, rz); rg.rotation.y = -0.25; add(rg); const rb = new Batch();
    for (const s of [-1, 1]) rb.add(boxGeo(V(s * 0.24 - 0.012, 0, -0.012), V(s * 0.24 + 0.012, 1.35, 0.012)), chrome);
    for (let k = 0; k < 3; k++) { const y = 0.55 + k * 0.3; rb.add(boxGeo(V(-0.25, y, -0.02), V(0.25, y + 0.012, 0.08)), chrome); rb.add(boxGeo(V(-0.25, y, 0.07), V(0.25, y + 0.07, 0.08)), chrome); }
    rb.build(rg);
    const bm = lam("soBrochureM", () => ({ map: brochureTex() }));
    for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) { const pg = new THREE.PlaneGeometry(0.2, 0.26); const id = (k * 2 + i) % 8, uv = pg.attributes.uv as THREE.BufferAttribute; for (let q = 0; q < uv.count; q++) uv.setXY(q, ((id % 4) + uv.getX(q)) / 4, 1 - (Math.floor(id / 4) + 1) / 2 + uv.getY(q) / 2); const m = new THREE.Mesh(pg, bm); m.position.set(-0.12 + i * 0.24, 0.55 + k * 0.3 + 0.14, 0.04); m.rotation.x = -0.18; m.castShadow = true; rg.add(m); } }

  // ================= ROOF: sign + swamp cooler =================
  { const sx0 = -0.4, sx1 = 4.6, sz = 1.5, sy0 = 3.9, sy1 = 5.3;
    for (const x of [sx0 + 0.6, sx1 - 0.6]) { b.add(boxGeo(V(x - 0.06, 3.38, sz - 0.08), V(x + 0.06, sy0 + 0.6, sz - 0.04)), steelPost); seg(b, V(x, 3.38, sz - 1.0), V(x, sy0 + 0.4, sz - 0.06), 0.03, steelPost, 6); }
    b.add(boxGeo(V(sx0 - 0.06, sy0 - 0.06, sz - 0.04), V(sx1 + 0.06, sy1 + 0.06, sz + 0.02)), lam("soSignBack", () => ({ color: "#d8362a" })));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sx1 - sx0, sy1 - sy0), new THREE.MeshBasicMaterial({ map: roofSignTex(), color: new THREE.Color(0.92, 0.9, 0.86) })); face.position.set((sx0 + sx1) / 2, (sy0 + sy1) / 2, sz + 0.025); add(face);
    const bulbM = new THREE.MeshBasicMaterial({ color: "#fff0c0" });
    for (let x = sx0; x <= sx1 + 0.001; x += 0.25) for (const y of [sy0 - 0.03, sy1 + 0.03]) { const bm = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbM); bm.position.set(x, y, sz + 0.05); fl(bm); add(bm); }
    // swamp cooler: louvred box on a curb, a duct elbow down into the roof
    const cx = -3.2, cz = -1.8, cs = lam("soCoolerM", () => ({ map: coolerTex() }));
    b.add(boxGeo(V(cx - 0.55, 3.39, cz - 0.5), V(cx + 0.55, 3.47, cz + 0.5)), steelDark);
    b.add(boxGeo(V(cx - 0.5, 3.47, cz - 0.45), V(cx + 0.5, 4.37, cz + 0.45)), cs);
    b.add(boxGeo(V(cx - 0.54, 4.37, cz - 0.49), V(cx + 0.54, 4.45, cz + 0.49)), lam("soCoolerTop", () => ({ color: "#9a9ea8" })));
    b.add(boxGeo(V(cx + 0.5, 3.6, cz - 0.25), V(cx + 1.1, 4.0, cz + 0.25)), lam("soDuct", () => ({ color: "#c4c8ce" })));
    b.add(boxGeo(V(cx + 0.8, 3.39, cz - 0.25), V(cx + 1.2, 4.0, cz + 0.25)), lam("soDuct", () => ({ color: "#c4c8ce" })));
    b.add(boxGeo(V(2.6, 3.39, -3.2), V(3.4, 3.9, -2.6)), lam("soVent", () => ({ color: "#a8a49c" }))); }

  // ================= INTERIOR =================
  // rug + a drift of sand inside the door (and outside on the walk)
  { const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4).rotateX(-Math.PI / 2), lam("soRugM", () => ({ map: rugTex() }))); rug.position.set(-1.4, 0.014, -1.9); rug.receiveShadow = true; add(rug); b.add(boxGeo(V(-3.0, 0.0, -3.1), V(0.2, 0.012, -0.7)), lam("soRugM", () => ({ map: rugTex() }))); }
  const sandM = new THREE.MeshLambertMaterial({ map: sandDriftTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  twoTone(sandM);
  for (const [x, z, w, d, rot] of [[0.9, 3.45, 2.6, 1.1, Math.PI], [0.9, 4.35, 3.0, 0.8, 0], [-3.9, 4.15, 1.6, 0.6, 0.2], [4.2, 3.6, 1.2, 0.6, Math.PI]] as [number, number, number, number, number][]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).rotateY(rot), sandM); s.position.set(x, 0.022, z); s.receiveShadow = true; fl(s); add(s);
  }
  // ---- the boss's desk ----
  const BX0 = -2.4, BX1 = -0.4, BZ0 = -2.1, BZ1 = -1.2, BY = 0.74;
  b.add(boxGeo(V(BX0 - 0.06, BY - 0.05, BZ0 - 0.05), V(BX1 + 0.06, BY, BZ1 + 0.06)), walnut);
  b.add(boxGeo(V(BX0, 0, BZ0 + 0.05), V(BX0 + 0.55, BY - 0.05, BZ1)), walnut); b.add(boxGeo(V(BX1 - 0.55, 0, BZ0 + 0.05), V(BX1, BY - 0.05, BZ1)), walnut);
  b.add(boxGeo(V(BX0 + 0.55, 0.25, BZ1 - 0.06), V(BX1 - 0.55, BY - 0.05, BZ1 - 0.02)), walnutD); // modesty panel
  for (const px of [BX0, BX1 - 0.55]) for (let k = 0; k < 3; k++) { const y0 = 0.08 + k * 0.23; b.add(boxGeo(V(px + 0.03, y0, BZ0 + 0.02), V(px + 0.52, y0 + 0.2, BZ0 + 0.05)), walnutD); b.add(boxGeo(V(px + 0.22, y0 + 0.09, BZ0 - 0.0), V(px + 0.33, y0 + 0.11, BZ0 + 0.02)), brass); }
  for (const px of [BX0, BX1 - 0.55]) b.add(boxGeo(V(px - 0.01, 0, BZ1 - 0.01), V(px + 0.56, 0.06, BZ1 + 0.01)), walnutD);
  // front of the desk: raised panels facing the door
  for (const px of [BX0, BX1 - 0.55]) { b.add(boxGeo(V(px + 0.06, 0.1, BZ1), V(px + 0.49, BY - 0.12, BZ1 + 0.015)), walnutD); }
  b.add(boxGeo(V(-2.0, BY, -1.9), V(-0.9, BY + 0.008, -1.4)), lam("soBlotter", () => ({ color: "#2f5a4a" })));
  b.add(boxGeo(V(-1.75, BY + 0.008, -1.8), V(-1.35, BY + 0.012, -1.5)), paper);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.075), new THREE.MeshBasicMaterial({ map: nameplateTex(), color: new THREE.Color(0.95, 0.92, 0.85) }));
  { const pg = new THREE.Group(); pg.position.set(-1.35, BY, -1.3); add(pg); mesh(pg, new THREE.BoxGeometry(0.42, 0.04, 0.06).translate(0, 0.02, 0), walnutD); plate.position.set(0, 0.075, 0.012); plate.rotation.x = -0.25; pg.add(plate); mesh(pg, new THREE.BoxGeometry(0.41, 0.08, 0.012).rotateX(-0.25).translate(0, 0.075, 0.004), brass); }
  // telephone (two-tone rotary desk set)
  { const tg = new THREE.Group(); tg.position.set(-1.95, BY, -1.68); tg.rotation.y = 0.5; add(tg);
    mesh(tg, new THREE.CylinderGeometry(0.09, 0.12, 0.09, 4).rotateY(Math.PI / 4).scale(1, 1, 0.8).translate(0, 0.045, 0), black);
    mesh(tg, new THREE.CylinderGeometry(0.045, 0.045, 0.012, 18).rotateX(Math.PI / 2 - 0.5).translate(0, 0.075, 0.07), lam("soDial", () => ({ color: "#f4f0e6" })));
    mesh(tg, new THREE.CapsuleGeometry(0.028, 0.16, 4, 8).rotateZ(Math.PI / 2).translate(0, 0.12, -0.01), black);
    for (const s of [-1, 1]) mesh(tg, new THREE.SphereGeometry(0.038, 10, 8).scale(1, 0.7, 1).translate(s * 0.1, 0.115, -0.01), black);
    const cord = new THREE.CatmullRomCurve3([V(0.08, 0.04, -0.05), V(0.18, 0.02, -0.08), V(0.2, 0.005, 0.05), V(0.12, 0.1, -0.01)]); mesh(tg, new THREE.TubeGeometry(cord, 20, 0.006, 5), black, undefined, false); }
  // glass ashtray + cigar with smoke
  b.add(lathe([[0, 0], [0.08, 0], [0.09, 0.03], [0.07, 0.035], [0.05, 0.015], [0, 0.015]], 18).translate(-0.5, BY, -1.95), phong("soAshGlass", { color: "#a8d8d0", emissive: "#2a5a5a", emissiveIntensity: 0.3, specular: "#ffffff", shininess: 120 }));
  b.add(new THREE.CylinderGeometry(0.012, 0.013, 0.13, 8).rotateZ(Math.PI / 2 - 0.12).translate(-0.48, BY + 0.03, -1.95), lam("soCigar", () => ({ color: "#6a4024" })));
  const cigarTip = glow(g, [-0.415, BY + 0.038, -1.95], "#ff7a3a", 0.06, 0.9);
  const smoke = [0, 1, 2].map((i) => puff(g, [-0.41, BY + 0.12 + i * 0.12, -1.95], 0.16 + i * 0.06, "#e8e4ee", 0.38));
  // green banker's lamp (lit), framed photo on the desk, pen set
  const lampG = new THREE.Group(); lampG.position.set(-2.2, BY, -1.95); add(lampG);
  mesh(lampG, new THREE.CylinderGeometry(0.09, 0.1, 0.03, 18).translate(0, 0.015, 0), brass);
  mesh(lampG, new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8).translate(0, 0.2, 0), brass);
  const shadeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.36, 18, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2 + 0.5);
  mesh(lampG, shadeGeo.clone().translate(0, 0.38, 0), phong("soLampShade", { color: "#2f8a4a", emissive: "#0e3a1e", emissiveIntensity: 0.4, specular: "#d8ffd0", shininess: 90, side: THREE.DoubleSide }));
  const lampCore = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.24, 4, 8).rotateZ(Math.PI / 2).rotateY(0.5).translate(0, 0.35, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.7, 1.1) })); fl(lampCore); lampG.add(lampCore);
  const lampL = new THREE.PointLight("#ffcf86", 3, 3.2, 1.2); lampL.position.set(0.05, 0.25, 0.05); lampG.add(lampL);
  const lampGlow = glow(lampG, [0, 0.33, 0.04], "#ffd890", 0.7, 0.7);
  const lampPool = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffc070").multiplyScalar(0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); lampPool.position.set(-1.95, BY + 0.012, -1.7); fl(lampPool); add(lampPool);
  { const pf = new THREE.Group(); pf.position.set(-1.7, BY, -1.98); pf.rotation.y = 0.5; add(pf); mesh(pf, new THREE.BoxGeometry(0.2, 0.16, 0.015).translate(0, 0.08, 0).rotateX(-0.12), brass);
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), lam("soDeskPhoto", () => ({ map: photoTex() }))); ph.position.set(0, 0.08, 0.0085); ph.rotation.x = -0.12; ph.rotation.y = Math.PI; pf.add(ph); }
  b.add(boxGeo(V(-0.7, BY, -1.39), V(-0.5, BY + 0.03, -1.31)), walnutD); seg(b, V(-0.65, BY + 0.03, -1.35), V(-0.69, BY + 0.16, -1.37), 0.006, black, 5);
  // desk fan (front-left corner, aimed at the chair; the desk's right half stays clear for the feet)
  const fanG = new THREE.Group(); fanG.position.set(-2.22, BY, -1.36); add(fanG);
  mesh(fanG, new THREE.CylinderGeometry(0.08, 0.1, 0.04, 18).translate(0, 0.02, 0), steelDark);
  mesh(fanG, new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8).translate(0, 0.14, 0), chrome);
  const fanHead = new THREE.Group(); fanHead.position.set(0, 0.26, 0); fanG.add(fanHead);
  mesh(fanHead, new THREE.CylinderGeometry(0.035, 0.04, 0.09, 12).rotateX(Math.PI / 2).translate(0, 0, -0.06), steelDark);
  for (const rr of [0.12, 0.08]) mesh(fanHead, new THREE.TorusGeometry(rr, 0.004, 4, 24).translate(0, 0, 0.03), chrome, undefined, false);
  for (let k = 0; k < 8; k++) mesh(fanHead, new THREE.BoxGeometry(0.004, 0.24, 0.004).rotateZ((k / 8) * Math.PI).translate(0, 0, 0.032), chrome, undefined, false);
  const blades = new THREE.Group(); blades.position.z = 0.0; fanHead.add(blades);
  for (let k = 0; k < 4; k++) mesh(blades, new THREE.CircleGeometry(0.05, 10).scale(1, 0.55, 1).translate(0.055, 0, 0).rotateZ((k / 4) * TAU), phong("soFanBlade", { color: "#4a6a8a", specular: "#ffffff", shininess: 60, side: THREE.DoubleSide }), undefined, false);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), new THREE.MeshBasicMaterial({ color: "#a8b8d0", transparent: true, opacity: 0, depthWrite: false })); blur.position.z = 0.002; fl(blur); fanHead.add(blur);
  // ---- the leather swivel chair (reclined, pushed back) ----
  const chair = new THREE.Group(); chair.position.set(-1.4, 0, -2.5); add(chair);
  { const cb = new Batch();
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; seg(cb, V(0, 0.08, 0), V(Math.cos(a) * 0.32, 0.05, Math.sin(a) * 0.32), 0.02, chrome, 6); cb.add(new THREE.SphereGeometry(0.035, 8, 6).translate(Math.cos(a) * 0.32, 0.035, Math.sin(a) * 0.32), black); }
    cb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 10).translate(0, 0.34, 0), chrome); cb.add(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10).translate(0, 0.55, 0), black);
    cb.add(new RoundedBoxGeometry(0.58, 0.12, 0.5, 3, 0.05).translate(0, 0.69, -0.1), leather);
    const back = new RoundedBoxGeometry(0.6, 0.85, 0.13, 3, 0.06).translate(0, 0.42, 0).rotateX(-0.32).translate(0, 0.74, -0.3);
    cb.add(back, leather);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) cb.add(new THREE.SphereGeometry(0.012, 6, 5).translate(-0.18 + i * 0.18, 0.18 + j * 0.18, 0.068).rotateX(-0.32).translate(0, 0.74, -0.3), lam("soButton", () => ({ color: "#4a1810" })));
    for (const s of [-1, 1]) { cb.add(new RoundedBoxGeometry(0.08, 0.06, 0.34, 2, 0.025).translate(s * 0.31, 0.9, -0.2), leather); seg(cb, V(s * 0.31, 0.74, -0.06), V(s * 0.31, 0.88, -0.06), 0.015, chrome, 5); }
    cb.build(chair); }
  // ---- the wall map of the lots (behind the boss) + pins, framed photo, calendar ----
  { const mx = -1.4, my = 1.95, mw = 3.2, mh = 1.6, z = ZB + 0.025;
    b.add(boxGeo(V(mx - mw / 2 - 0.06, my - mh / 2 - 0.06, ZB), V(mx + mw / 2 + 0.06, my + mh / 2 + 0.06, ZB + 0.03)), walnutD);
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), lam("soLotMapM", () => ({ map: lotMapTex() }))); mp.position.set(mx, my, z + 0.01); mp.receiveShadow = true; add(mp);
    const pinW = lam("soPinW", () => ({ color: "#f6f1e6" })), pinY = lam("soPinY", () => ({ color: "#f2c230" })), pinR = phong("soPinR", { color: "#d8362a", specular: "#ffffff", shininess: 90 }), pinB = lam("soPinB", () => ({ color: "#2f6ab8" }));
    let n = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) { if (r() < 0.25) continue; const u = 0.3 + i * 0.075 + (r() - 0.5) * 0.02, v = 0.17 + j * 0.18 + (r() - 0.5) * 0.03; const m = n === 7 || n === 19 ? pinR : n % 9 === 4 ? pinB : n % 3 ? pinW : pinY; n++;
      b.add(new THREE.SphereGeometry(0.018, 8, 6).translate(mx - mw / 2 + u * mw, my - mh / 2 + (1 - v) * mh, z + 0.04), m); b.add(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4).rotateX(Math.PI / 2).translate(mx - mw / 2 + u * mw, my - mh / 2 + (1 - v) * mh, z + 0.022), chrome); } }
  { b.add(boxGeo(V(0.55, 1.95, ZB), V(1.25, 2.52, ZB + 0.04)), lam("soFrameGold", () => ({ color: "#c9973e" })));
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.49), lam("soPhotoM", () => ({ map: photoTex() }))); ph.position.set(0.9, 2.235, ZB + 0.045); add(ph);
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.5), lam("soCalM", () => ({ map: calendarTex() }))); cal.position.set(0.9, 1.35, ZB + 0.012); cal.rotation.z = 0.02; add(cal); b.add(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6).rotateX(Math.PI / 2).translate(0.9, 1.61, ZB + 0.015), chrome); }
  // ---- filing cabinets ----
  for (const cx of [1.8, 2.3]) {
    b.add(boxGeo(V(cx - 0.24, 0, ZB), V(cx + 0.24, 1.32, ZB + 0.66)), steelDesk);
    for (let k = 0; k < 4; k++) { const y0 = 0.04 + k * 0.32; b.add(boxGeo(V(cx - 0.22, y0, ZB + 0.66), V(cx + 0.22, y0 + 0.3, ZB + 0.68)), steelDesk); b.add(boxGeo(V(cx - 0.07, y0 + 0.17, ZB + 0.68), V(cx + 0.07, y0 + 0.2, ZB + 0.71)), chrome); b.add(boxGeo(V(cx - 0.05, y0 + 0.23, ZB + 0.68), V(cx + 0.05, y0 + 0.27, ZB + 0.69)), paper); }
  }
  b.add(boxGeo(V(1.65, 1.32, ZB + 0.12), V(1.95, 1.4, ZB + 0.45)), lam("soFolders", () => ({ color: "#d8b46a" })));
  b.add(lathe([[0, 0], [0.06, 0], [0.07, 0.18], [0, 0.18]], 12).translate(2.35, 1.32, ZB + 0.3), lam("soVase", () => ({ color: "#1e8a86" })));
  // ---- water cooler + paper-cup dispenser ----
  const coolX = 4.35, coolZ = ZB + 0.38;
  b.add(boxGeo(V(coolX - 0.2, 0, coolZ - 0.2), V(coolX + 0.2, 1.0, coolZ + 0.2)), phong("soCoolerBody", { color: "#f2efe8", specular: "#ffffff", shininess: 50 }));
  b.add(boxGeo(V(coolX - 0.08, 0.82, coolZ + 0.2), V(coolX + 0.08, 0.86, coolZ + 0.24)), chrome);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8).rotateX(Math.PI / 2).translate(coolX - 0.05, 0.9, coolZ + 0.22), lam("soTapBlue", () => ({ color: "#2f6ab8" })));
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8).rotateX(Math.PI / 2).translate(coolX + 0.05, 0.9, coolZ + 0.22), lam("soTapRed", () => ({ color: "#d8362a" })));
  const bottle = new THREE.Mesh(lathe([[0, 0], [0.05, 0], [0.05, 0.04], [0.16, 0.1], [0.17, 0.45], [0.15, 0.5], [0, 0.52]], 20).translate(coolX, 1.0, coolZ), phong("soBottle", { color: "#8ecde8", emissive: "#2a6a9a", emissiveIntensity: 0.35, specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.78 }));
  add(bottle);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: "#e8f8ff", transparent: true, opacity: 0.8 })); bubble.position.set(coolX, 1.1, coolZ + 0.05); fl(bubble); add(bubble);
  b.add(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 12).translate(X1 - 0.07, 1.35, coolZ + 0.45), chrome);
  b.add(new THREE.CylinderGeometry(0.04, 0.03, 0.08, 12).translate(X1 - 0.07, 1.14, coolZ + 0.45), paper);
  // ---- the salesmen's steel desks (typewriters, papers) + chairs ----
  const steelDeskAt = (x0: number, x1: number, z0: number, z1: number, tw: number, seed: number) => {
    const y = 0.74; b.add(boxGeo(V(x0 - 0.03, y - 0.04, z0 - 0.03), V(x1 + 0.03, y, z1 + 0.03)), steelDark); b.add(boxGeo(V(x0, y, z0), V(x1, y + 0.008, z1)), linoTop);
    b.add(boxGeo(V(x0, 0.05, z0), V(x0 + 0.42, y - 0.04, z1)), steelDesk); b.add(boxGeo(V(x1 - 0.06, 0.05, z0), V(x1, y - 0.04, z1)), steelDesk);
    b.add(boxGeo(V(x0 + 0.42, 0.3, z1 - 0.04), V(x1 - 0.06, y - 0.04, z1)), steelDesk);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(x0 + 0.05, 0.1 + k * 0.2, z0 - 0.015), V(x0 + 0.37, 0.27 + k * 0.2, z0)), steelDesk), b.add(boxGeo(V(x0 + 0.15, 0.2 + k * 0.2, z0 - 0.03), V(x0 + 0.27, 0.22 + k * 0.2, z0 - 0.015)), chrome);
    // typewriter
    const tx = (x0 + x1) / 2 + tw, tz = (z0 + z1) / 2 + 0.02;
    b.add(new RoundedBoxGeometry(0.4, 0.12, 0.34, 2, 0.03).translate(tx, y + 0.07, tz), phong("soTypeBody", { color: "#5e7a72", specular: "#ffffff", shininess: 60 }));
    b.add(new THREE.PlaneGeometry(0.34, 0.16).rotateX(-Math.PI / 2 + 0.45).translate(tx, y + 0.135, tz + 0.08), lam("soKeysM", () => ({ map: typeKeysTex() })));
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 12).rotateZ(Math.PI / 2).translate(tx, y + 0.16, tz - 0.1), black);
    b.add(new THREE.PlaneGeometry(0.22, 0.26).rotateX(-0.2).translate(tx, y + 0.28, tz - 0.13), paper);
    b.add(boxGeo(V(x0 + 0.1, y + 0.008, z1 - 0.32), V(x0 + 0.38, y + 0.03, z1 - 0.1)), paper);
    b.add(boxGeo(V(x1 - 0.3, y + 0.008, z0 + 0.06), V(x1 - 0.08, y + 0.1, z0 + 0.3)), lam("soInbox", () => ({ color: "#c9973e" })));
    void seed;
  };
  steelDeskAt(-4.5, -3.1, -1.0, -0.3, 0.1, 1); steelDeskAt(2.9, 4.3, -2.0, -1.3, -0.1, 2);
  const deskChair = (x: number, z: number, yaw: number) => { const cg = new THREE.Group(); cg.position.set(x, 0, z); cg.rotation.y = yaw; add(cg); const cb = new Batch();
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.4; seg(cb, V(0, 0.06, 0), V(Math.cos(a) * 0.25, 0.03, Math.sin(a) * 0.25), 0.016, chrome, 5); }
    cb.add(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8).translate(0, 0.24, 0), chrome); cb.add(new RoundedBoxGeometry(0.44, 0.08, 0.42, 2, 0.03).translate(0, 0.46, 0), lam("soChairSeat", () => ({ color: "#2f6a8a" })));
    cb.add(new RoundedBoxGeometry(0.42, 0.3, 0.06, 2, 0.025).translate(0, 0.72, -0.2), lam("soChairSeat", () => ({ color: "#2f6a8a" }))); seg(cb, V(0, 0.48, -0.15), V(0, 0.62, -0.2), 0.018, chrome, 5); cb.build(cg); };
  deskChair(-4.45, -1.75, 0.9); deskChair(3.0, -2.6, -0.7);
  deskChair(-3.4, 0.05, 2.9); // a visitor's chair facing salesman A's desk
  // ---- thermometer on the right wall ----
  b.add(new THREE.PlaneGeometry(0.16, 0.64).rotateY(-Math.PI / 2).translate(X1 - 0.01, 1.75, -2.2), lam("soThermoM", () => ({ map: thermoTex() })));
  const thermoCol = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1, 0.025).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: "#d8362a" })); thermoCol.position.set(X1 - 0.02, 1.5, -2.2 + 0.035); add(thermoCol);
  b.add(new THREE.SphereGeometry(0.025, 10, 8).translate(X1 - 0.025, 1.49, -2.2 + 0.035), lam("soThermoBulb", () => ({ color: "#d8362a" })));
  // ---- coat stand (hat + coat), cactus pot ----
  { const cx = -1.0, cz = 3.45; for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; seg(b, V(cx, 0.25, cz), V(cx + Math.cos(a) * 0.3, 0.01, cz + Math.sin(a) * 0.3), 0.02, walnutD, 6); }
    seg(b, V(cx, 0.0, cz), V(cx, 1.85, cz), 0.025, walnutD, 8);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.3; seg(b, V(cx, 1.7, cz), V(cx + Math.cos(a) * 0.18, 1.82, cz + Math.sin(a) * 0.18), 0.012, brass, 5); }
    b.add(lathe([[0, 0], [0.17, 0], [0.18, 0.01], [0.1, 0.02], [0.09, 0.13], [0, 0.14]], 16).translate(cx + 0.06, 1.83, cz + 0.05), lam("soHat", () => ({ color: "#8a7a5a" })));
    b.add(new THREE.CylinderGeometry(0.091, 0.092, 0.025, 16).translate(cx + 0.06, 1.865, cz + 0.05), lam("soHatBand", () => ({ color: "#3a2a24" })));
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 0.95, 12, 1, true, 0, Math.PI * 1.6).translate(0, -0.47, 0), lamCustom("soCoatM", () => twoTone(new THREE.MeshLambertMaterial({ color: "#c8a46a", side: THREE.DoubleSide })))); coat.position.set(cx + 0.12, 1.78, cz); coat.rotation.y = 2.2; coat.castShadow = true; add(coat); }
  const cactusPot = (x: number, z: number, k = 1) => { const cactus = new THREE.Group(); cactus.position.set(x, 0, z); cactus.scale.setScalar(k); add(cactus); mesh(cactus, lathe([[0, 0], [0.16, 0], [0.2, 0.32], [0.22, 0.34], [0.22, 0.38], [0, 0.38]], 16), lam("soPot", () => ({ color: "#c8603a" })));
    mesh(cactus, new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16).translate(0, 0.36, 0), lam("soPotSoil", () => ({ color: "#6a4a30" })), undefined, false);
    const cm = lam("soCactusM", () => ({ map: ctex("soCactusRib", 256, 128, (q) => { q.fillStyle = "#5a9a48"; q.fillRect(0, 0, 256, 128); for (let x = 0; x < 256; x += 21) { q.fillStyle = "#3e7a36"; q.fillRect(x, 0, 6, 128); q.fillStyle = "#f6f1d0"; for (let y = 8; y < 128; y += 16) q.fillRect(x + 2, y, 3, 3); } }) }));
    mesh(cactus, new THREE.CapsuleGeometry(0.1, 0.7, 6, 12).translate(0, 0.8, 0), cm); mesh(cactus, new THREE.CapsuleGeometry(0.065, 0.22, 4, 10).rotateZ(Math.PI / 2).translate(0.13, 0.85, 0), cm); mesh(cactus, new THREE.CapsuleGeometry(0.065, 0.3, 4, 10).translate(0.23, 1.02, 0), cm);
    mesh(cactus, new THREE.CapsuleGeometry(0.06, 0.16, 4, 10).rotateZ(Math.PI / 2).translate(-0.12, 0.7, 0), cm); mesh(cactus, new THREE.CapsuleGeometry(0.06, 0.2, 4, 10).translate(-0.2, 0.82, 0), cm);
    mesh(cactus, new THREE.SphereGeometry(0.04, 8, 6).translate(0, 1.27, 0), lam("soFlower", () => ({ color: "#e85a8a" })));  return cactus; };
  const cactus = cactusPot(-4.4, 3.5); cactusPot(5.15, 4.6, 1.35); cactusPot(-4.5, 5.95, 1.2); cactusPot(-0.95, 6.0, 0.9);
  // ---- ceiling fan + ceiling lights ----
  const cfan = new THREE.Group(); cfan.position.set(0.9, 2.78, -0.4); add(cfan);
  seg(b, V(0.9, CH, -0.4), V(0.9, 2.85, -0.4), 0.02, brass, 6); b.add(lathe([[0, 0], [0.12, 0.02], [0.14, 0.09], [0.08, 0.16], [0, 0.16]], 16).translate(0.9, 2.74, -0.4), brass);
  for (let k = 0; k < 4; k++) mesh(cfan, new THREE.BoxGeometry(0.62, 0.012, 0.14).translate(0.4, 0, 0).rotateX(0.1).rotateY((k / 4) * TAU), walnut);
  const ceilLights: { core: THREE.Mesh; L: THREE.PointLight; gl: THREE.Sprite }[] = [];
  for (const [x, z] of [[-2.4, -0.4], [3.2, -0.6], [0.9, 2.2]] as [number, number][]) {
    b.add(new THREE.CylinderGeometry(0.32, 0.3, 0.06, 24).translate(x, CH - 0.03, z), chrome);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.26, 0.1, 24).translate(x, CH - 0.09, z), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.42, 1.25) })); fl(core); add(core);
    const L = new THREE.PointLight("#fff0d8", 2.5, 5, 1.3); L.position.set(x, CH - 0.4, z); add(L);
    ceilLights.push({ core, L, gl: glow(g, [x, CH - 0.15, z], "#fff2dc", 1.0, 0.5) });
  }
  // ---- sun shafts through the blinds + striped light patches ----
  const stripeM = (n: number, op: number) => new THREE.MeshBasicMaterial({ map: stripeLightTex(n), color: new THREE.Color("#ffd8a0"), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  const patches: { m: THREE.Mesh; op: number }[] = [];
  const patch = (pos: V3, w: number, d: number, rotY: number, n: number, op: number, tilt = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2 + tilt), stripeM(n, op)); m.rotation.y = rotY; m.position.set(...pos); fl(m); add(m); patches.push({ m, op }); return m; };
  patch([3.3, 0.02, 0.0], 1.4, 2.0, Math.PI / 2 + 0.25, 14, 0.38);   // side window -> floor in front of the counter / salesman B
  patch([3.6, 0.025, 2.95], 2.0, 1.6, -0.1, 12, 0.3);                // right storefront -> floor where the family stands
  const shaftsM = [shaft(g, [4.8, 2.5, 0.0], [3.1, 0.0, 0.1], 1.3, "#ffd6a0", 0.07), shaft(g, [3.6, 2.7, 3.9], [3.6, 0.0, 2.6], 1.9, "#ffd6a0", 0.05)];
  // warm bounce from the sunlit floor (fills the room's violet shade a little)
  const fills = [[-2.0, 1.6, -0.5], [2.6, 1.6, 0.8]].map(([x, y, z]) => { const L = new THREE.PointLight("#ffc890", 3.2, 9, 1.0); L.position.set(x, y, z); add(L); return L; });
  const dust = motes(g, [2.0, 0.3, -0.8], [4.6, 2.6, 3.6], 70, "#ffe8c0", 0.022, 0.6, 3);

  // ================= THE FRONT COUNTER =================
  const KX0 = 2.75, KX1 = 4.75, KZ0 = 0.85, KZ1 = 1.45, KY = 1.02;
  b.add(boxGeo(V(KX0, 0, KZ0 + 0.05), V(KX1, KY - 0.04, KZ1 - 0.02)), walnut);
  b.add(boxGeo(V(KX0 - 0.04, KY - 0.04, KZ0), V(KX1, KY, KZ1 + 0.06)), lam("soCounterTop", () => ({ color: "#e8dcc0" })));
  b.add(boxGeo(V(KX0 - 0.045, KY - 0.06, KZ0 - 0.005), V(KX1, KY - 0.035, KZ1 + 0.065)), chrome);
  for (let x = KX0 + 0.1; x < KX1 - 0.2; x += 0.5) b.add(boxGeo(V(x, 0.12, KZ1 - 0.02), V(x + 0.4, KY - 0.14, KZ1)), walnutD); // front panels (customers' side)
  b.add(boxGeo(V(KX0, 0, KZ1 - 0.06), V(KX1, 0.1, KZ1 - 0.01)), walnutD);
  b.add(boxGeo(V(KX0 + 0.05, 0.4, KZ0 + 0.05), V(KX1 - 0.05, 0.43, KZ0 + 0.45)), walnutD); // shelf (salesman side)
  // the big lot map on the counter, pen on a chain, SOLD stamp + ink pad
  { const lm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5).rotateX(-Math.PI / 2), lam("soLotMapM", () => ({ map: lotMapTex() }))); lm.position.set(3.55, KY + 0.004, 1.17); lm.rotation.y = 0.04; lm.receiveShadow = true; add(lm);
    b.add(boxGeo(V(4.25, KY, 1.22), V(4.33, KY + 0.03, 1.3)), black); seg(b, V(4.3, KY + 0.035, 1.27), V(4.15, KY + 0.012, 1.33), 0.008, black, 5);
    const chain = new THREE.CatmullRomCurve3([V(4.29, KY + 0.03, 1.25), V(4.24, KY + 0.004, 1.3), V(4.18, KY + 0.004, 1.32), V(4.16, KY + 0.012, 1.33)]); mesh(g, new THREE.TubeGeometry(chain, 16, 0.003, 4), chrome, undefined, false);
    b.add(boxGeo(V(2.9, KY, 1.1), V(3.06, KY + 0.012, 1.22)), lam("soInkPad", () => ({ color: "#2a3a6a" })));
    b.add(boxGeo(V(3.1, KY, 1.12), V(3.18, KY + 0.025, 1.2)), lam("soStampRubber", () => ({ color: "#c8352e" })));
    b.add(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 10).translate(3.14, KY + 0.065, 1.16), walnut); b.add(new THREE.SphereGeometry(0.035, 10, 8).translate(3.14, KY + 0.12, 1.16), walnutD);
    b.add(boxGeo(V(4.45, KY, 0.95), V(4.7, KY + 0.15, 1.15)), lam("soBrochureBox", () => ({ color: "#d8b46a" })));
    b.add(boxGeo(V(2.85, KY, 0.92), V(3.15, KY + 0.012, 1.05)), paper); }

  // ================= THE TOWN MODEL =================
  const tb = new Batch();
  for (const [x, z] of [[MT.x0 + 0.06, MT.z0 + 0.06], [MT.x1 - 0.06, MT.z0 + 0.06], [MT.x0 + 0.06, MT.z1 - 0.06], [MT.x1 - 0.06, MT.z1 - 0.06]]) tb.add(boxGeo(V(x - 0.045, 0, z - 0.045), V(x + 0.045, MT.y - 0.06, z + 0.045)), walnutD);
  tb.add(boxGeo(V(MT.x0, MT.y - 0.12, MT.z0), V(MT.x1, MT.y - 0.03, MT.z1)), walnut);
  tb.add(boxGeo(V(MT.x0 - 0.02, MT.y - 0.03, MT.z0 - 0.02), V(MT.x1 + 0.02, MT.y, MT.z1 + 0.02)), walnutD);
  tb.add(boxGeo(V(MT.x0 + 0.08, 0.15, MT.z0 + 0.08), V(MT.x1 - 0.08, 0.18, MT.z1 - 0.08)), walnutD); // stretcher shelf
  tb.add(boxGeo(V(MT.x0 + 0.2, 0.18, MT.z0 + 0.2), V(MT.x0 + 0.7, 0.35, MT.z0 + 0.6)), lam("soPlanRolls", () => ({ color: "#efe2c4" })));
  tb.build(g);
  const model = new THREE.Group(); model.position.set(MC.u, MT.y + 0.04, MC.w); add(model);
  { const base = new THREE.Mesh(new THREE.BoxGeometry(MW, 0.04, MD).translate(0, -0.02, 0), [lam("soModelSide", () => ({ color: "#c98a52" })), lam("soModelSide", () => ({ color: "#c98a52" })), lam("soModelBaseM", () => ({ map: modelBaseTex() })), lam("soModelSide", () => ({ color: "#c98a52" })), lam("soModelSide", () => ({ color: "#c98a52" })), lam("soModelSide", () => ({ color: "#c98a52" }))]);
    base.receiveShadow = true; base.castShadow = true; model.add(base);
    // the plaque on the front edge
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.032), new THREE.MeshBasicMaterial({ map: ctex("soPlaque", 512, 32, (q) => { q.fillStyle = "#c9973e"; q.fillRect(0, 0, 512, 32); q.fillStyle = "#2a1a10"; center(q); fitText(q, "LAKESIDE  ·  MASTER PLAN", 256, 17, 480, 24, "900 %spx Georgia, serif"); }), color: new THREE.Color(0.9, 0.88, 0.82) }));
    pl.position.set(0, -0.02, MD / 2 + 0.001); model.add(pl);
    // glossy water over the painted lake + channel
    const wm = phong("soModelWater", { color: "#5ab0d8", emissive: "#1a4a6a", emissiveIntensity: 0.3, specular: "#ffffff", shininess: 140, transparent: true, opacity: 0.55 });
    const lakeW = new THREE.Mesh(new THREE.PlaneGeometry(MW - 0.03, ML.lakeW + MD / 2 - 0.02).rotateX(-Math.PI / 2), wm); lakeW.position.set(0, 0.004, (-MD / 2 + ML.lakeW) / 2 + 0.005); fl(lakeW); model.add(lakeW);
    const chL = ML.chanEnd - ML.chanW / 2 - ML.lakeW;
    const chW = new THREE.Mesh(new THREE.PlaneGeometry(ML.chanW - 0.01, chL).rotateX(-Math.PI / 2), wm); chW.position.set(0, 0.004, ML.lakeW + chL / 2); fl(chW); model.add(chW);
    const mar = new THREE.Mesh(new THREE.CircleGeometry(ML.chanW / 2 - 0.005, 24, 0, Math.PI).rotateX(-Math.PI / 2), wm); mar.position.set(0, 0.004, ML.chanEnd - ML.chanW / 2); fl(mar); model.add(mar);
  }
  const mb = new Batch();
  // houses on some lots, palms, cacti, a water tower, the billboard by the highway
  const lots = modelLots(), flags: { f: LotFlag; d: number; glow: THREE.Mesh }[] = [];
  const lotGlowM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd070"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  lots.forEach((l, i) => {
    if (l.house) { tinyHouse(mb, l.u, l.w - 0.005, 0.085, 0.065, 0.032, i); return; }
    const f = lotFlag(model, 0.07); f.g.position.set(l.u - l.hu + 0.012, 0.0, l.w + l.hw - 0.012);
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(l.hu * 2 - 0.01, l.hw * 2 - 0.01).rotateX(-Math.PI / 2), lotGlowM.clone()); gm.position.set(l.u, 0.003, l.w); fl(gm); model.add(gm);
    flags.push({ f, d: l.d, glow: gm });
  });
  const maxD = Math.max(...flags.map((f) => f.d));
  for (const [u, w] of [[-0.25, -0.3], [0.25, -0.28], [0.12, 0.62 - 0.1], [-0.12, 0.52], [0.6, -0.3], [-0.6, -0.32]] as [number, number][]) tinyPalm(mb, u, w, 0.12);
  for (let k = 0; k < 14; k++) tinyCactus(mb, -1.05 + r() * 2.1, 0.56 + r() * 0.0 + (k % 2 ? 0.17 : -0.04), 0.04 + r() * 0.02, k);
  { const wx = 0.85, wz = -0.25; for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.78; seg(mb, V(wx + Math.cos(a) * 0.04, 0, wz + Math.sin(a) * 0.04), V(wx + Math.cos(a) * 0.025, 0.16, wz + Math.sin(a) * 0.025), 0.004, steelPost, 4); }
    mb.add(new THREE.SphereGeometry(0.055, 14, 10).scale(1, 0.8, 1).translate(wx, 0.2, wz), lam("soTower", () => ({ color: "#e8e4dc" }))); }
  { const bx = 0.62, bz = ML.hwyW - 0.09; seg(mb, V(bx - 0.06, 0, bz), V(bx - 0.06, 0.08, bz), 0.004, walnutD, 4); seg(mb, V(bx + 0.06, 0, bz), V(bx + 0.06, 0.08, bz), 0.004, walnutD, 4);
    const bbm = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.054), new THREE.MeshBasicMaterial({ map: ctex("soTinyBill", 384, 128, (q) => { q.fillStyle = "#f2c230"; q.fillRect(0, 0, 384, 128); q.strokeStyle = "#c8352e"; q.lineWidth = 10; q.strokeRect(5, 5, 374, 118); q.fillStyle = "#c8352e"; center(q); fitText(q, "SEE THE BRIDGE!", 192, 66, 340, 60, "900 %spx Georgia, serif"); }), color: new THREE.Color(0.9, 0.9, 0.88) }));
    bbm.position.set(bx, 0.105, bz + 0.004); model.add(bbm); mb.add(boxGeo(V(bx - 0.085, 0.075, bz - 0.006), V(bx + 0.085, 0.135, bz)), walnutD); }
  mb.build(model);
  const dn = dino(model, 0.1); dn.position.set(ML.dinoU, 0, ML.hwyW - 0.13); dn.rotation.y = 0.35;
  const mBridge = tinyBridge(model, 0.5, { W: 0.08, H: 0.07 }); mBridge.rotation.y = 0; // the boss's piece (seated over the channel)
  const mBridgeSeat = V(0, 0, ML.bridgeW);
  const car1 = tinyCar(model, 0.09, "#3aa0c8", { wagon: true, roof: "#f4f0e6" }), car2 = tinyCar(model, 0.085, "#e8573a");
  // tiny street lamps (glow at night)
  const modelGlows: THREE.Sprite[] = [];
  for (const [u, w] of [[0.06, -0.2], [0.06, 0.05], [0.06, 0.3], [-0.06, 0.45], [0.3, ML.hwyW - 0.07], [-0.3, ML.hwyW - 0.07]] as [number, number][]) { seg(mb, V(u, 0, w), V(u, 0.07, w), 0.0025, steelPost, 4); const s = glow(model, [u, 0.075, w], "#ffd890", 0.05, 0.0); modelGlows.push(s); }
  mb.build(model);

  // architect's clamp lamp on the model table's back-left corner (warm practical, brighter at night)
  const mLampG = new THREE.Group(); mLampG.position.set(MT.x0 + 0.08, MT.y, MT.z0 + 0.08); add(mLampG);
  { const lb = new Batch(); lb.add(boxGeo(V(-0.04, -0.06, -0.04), V(0.04, 0.03, 0.04)), steelDark); seg(lb, V(0, 0.03, 0), V(0.12, 0.62, 0.1), 0.012, steelDark, 6); seg(lb, V(0.12, 0.62, 0.1), V(0.42, 0.58, 0.32), 0.012, steelDark, 6); lb.build(mLampG);
    const sh = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 16, 1, true).translate(0, -0.08, 0), phong("soMLampShade", { color: "#e8573a", specular: "#ffffff", shininess: 60, side: THREE.DoubleSide })); sh.position.set(0.42, 0.58, 0.32); sh.rotation.set(0.35, 0, -0.35); mLampG.add(sh);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.7, 1.1) })); bl.position.set(0.44, 0.5, 0.34); fl(bl); mLampG.add(bl); }
  const mLampL = new THREE.PointLight("#ffcf86", 1.2, 2.6, 1.2); mLampL.position.set(0.5, 0.42, 0.4); mLampG.add(mLampL);
  const mLampGlow = glow(mLampG, [0.44, 0.5, 0.34], "#ffd890", 0.45, 0.6);
  const mLampPool = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffc070").multiplyScalar(0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); mLampPool.position.set(MT.x0 + 0.6, MT.y + 0.046, MT.z0 + 0.5); fl(mLampPool); add(mLampPool);

  // ================= NIGHT: backdrop street + street lamp =================
  const nightG = new THREE.Group(); add(nightG);
  const backM = new THREE.MeshBasicMaterial({ map: nightStreetTex(), fog: false });
  { const bk = new THREE.Mesh(new THREE.PlaneGeometry(44, 16.5), backM); bk.position.set(0, 4.2, 17); bk.rotation.y = Math.PI; fl(bk); nightG.add(bk);
    const bs = new THREE.Mesh(new THREE.PlaneGeometry(30, 16.5), backM); bs.position.set(15, 4.2, 0); bs.rotation.y = -Math.PI / 2; fl(bs); nightG.add(bs);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#232a5a", fog: false })); ground.position.set(0, -0.2, 12); fl(ground); nightG.add(ground);
    const lp = new THREE.Group(); lp.position.set(-2.0, 0, 9.0); nightG.add(lp);
    const lm = lam("soLampPost", () => ({ color: "#3a3f5a" }));
    mesh(lp, lathe([[0.12, 0], [0.1, 0.3], [0.06, 0.4], [0.05, 4.5], [0, 4.5]], 10), lm); mesh(lp, new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6).rotateZ(Math.PI / 2).translate(0.65, 4.45, 0), lm);
    mesh(lp, new THREE.CylinderGeometry(0.12, 0.28, 0.2, 14).translate(1.3, 4.32, 0), lm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8).scale(1, 0.6, 1).translate(1.3, 4.22, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 1.3) })); fl(bulb); lp.add(bulb);
    glow(lp, [1.3, 4.2, 0], "#ffd890", 3.2, 1.0);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex(), color: new THREE.Color("#ffc070").multiplyScalar(0.45), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pool.position.set(1.3, 0.04, -1.0); fl(pool); lp.add(pool);
    const sl = new THREE.PointLight("#ffc880", 10, 14, 1.2); sl.position.set(1.3, 3.9, -0.5); lp.add(sl); }
  nightG.visible = false;
  const nightPatches = [patch([3.3, 0.021, 0.0], 1.4, 2.0, Math.PI / 2 + 0.25, 14, 0.0), patch([1.4, 0.022, 3.0], 2.6, 1.8, 0.15, 12, 0.0)];
  nightPatches.forEach((p) => (p.material as THREE.MeshBasicMaterial).color.set("#7a9aff"));
  const nightPatchOp = [0.16, 0.12];

  shell.build(g, false); b.build(g);

  const MARKS: Record<string, V3> = {
    bossDesk: [-1.4, 0, -2.5], bossSeat: [-1.4, 0.72, -2.5], bossFeet: [-0.9, BY + 0.03, -2.0],
    agentDoor: [1.0, 0, 2.6], salesA: [-3.8, 0, -1.35], salesB: [3.6, 0, -2.45],
    window: [-2.6, 0, 5.4], walkA: [-3.7, 0, 5.2], benchSeat: [-3.7, 0.45, 4.62], walkB: [3.7, 0, 5.3], doorOut: [1.0, 0, 5.6],
    modelSide: [MC.u, 0, MT.z0 - 0.38], modelBridge: [MC.u, MT.y + 0.04, MC.w + ML.bridgeW],
    counterSales: [3.75, 0, 0.42], counterDad: [3.0, 0, 2.0], counterMom: [3.85, 0, 2.05], counterKid1: [4.45, 0, 2.2], counterKid2: [3.4, 0, 2.55],
    wallMap: [-1.4, 1.95, ZB + 0.05], deskPhoto: [-1.7, BY + 0.08, -1.98], counterMap: [3.55, KY, 1.17], stamp: [3.14, KY, 1.16],
  };
  const SOLIDS: [V3, V3][] = [
    [[-5.2, 0, -4.05], [5.0, 3.7, ZB]], [[-5.2, 0, -4.2], [-4.8, 3.7, 6.4]], [[X1, 0, -4.05], [5.0, 3.7, 4.1]],
    [[X0, 0, 3.88], [-0.6, 3.4, 4.15]], [[DR, 0, 3.88], [X1, 3.4, 4.15]], [[-0.6, DH, 3.88], [DR, 3.4, 4.15]],
    [[-5.2, CH - 0.02, -4.4], [5.8, 3.7, 6.55]], [[-0.5, 3.38, 1.0], [4.7, 5.4, 1.6]], [[-3.75, 3.38, -2.35], [-1.95, 4.5, -1.25]],
    ...[-2.9, 3.6, 5.5].map((x) => [[x - 0.13, 0, 6.02], [x + 0.13, CH, 6.28]] as [V3, V3]),
    [[BX0 - 0.08, 0, BZ0 - 0.08], [BX1 + 0.08, 1.2, BZ1 + 0.1]], [[-1.8, 0, -2.95], [-1.0, 1.45, -2.1]],
    [[-4.55, 0, -1.05], [-3.05, 1.1, -0.25]], [[2.85, 0, -2.05], [4.35, 1.1, -1.25]], [[-4.75, 0, -2.0], [-4.15, 1.0, -1.5]], [[2.7, 0, -2.9], [3.3, 1.0, -2.3]], [[-3.7, 0, -0.25], [-3.1, 1.0, 0.35]],
    [[1.5, 0, ZB], [2.6, 1.55, ZB + 0.72]], [[4.1, 0, ZB], [X1, 1.6, ZB + 0.64]],
    [[MT.x0 - 0.03, 0, MT.z0 - 0.03], [MT.x1 + 0.03, MT.y + 0.32, MT.z1 + 0.03]], [[MT.x0 - 0.05, MT.y, MT.z0 - 0.05], [MT.x0 + 0.62, MT.y + 0.75, MT.z0 + 0.5]], [[KX0 - 0.05, 0, KZ0 - 0.02], [KX1 + 0.05, KY + 0.2, KZ1 + 0.08]],
    [[-1.32, 0, 3.13], [-0.68, 2.05, 3.77]], [[-4.65, 0, 3.25], [-4.1, 1.35, 3.75]], [[4.8, 0, 4.25], [5.5, 1.8, 4.95]], [[-4.85, 0, 5.6], [-4.15, 1.6, 6.3]], [[-1.22, 0, 5.73], [-0.68, 1.2, 6.27]],
    [[0.2, 2.6, -1.1], [1.6, CH, 0.3]],
    [[-4.4, 0, 4.15], [-3.0, 0.95, 4.78]], [[-1.72, 0, 4.33], [-1.28, 0.7, 4.77]], [[2.75, 0, 4.25], [3.35, 1.4, 4.65]],
  ];

  let lastT = 0;
  const set: SalesOffice["set"] = (c) => {
    const t = c.t ?? lastT; lastT = t;
    const night = cl(c.night ?? 0), day = 1 - night;
    // doors
    const dr = sm(cl(c.door ?? 0)), ang = 1.54 * dr; leaves[0].rotation.y = ang; leaves[1].rotation.y = -ang;
    // desk fan
    const fs = cl(c.fan ?? 0); blades.rotation.z -= 0; blades.rotation.z = -t * 38 * fs; (blur.material as THREE.MeshBasicMaterial).opacity = 0.35 * sm(fs * 1.5);
    fanHead.rotation.y = 2.5 + 0.45 * Math.sin(t * 0.9) * fs; fanHead.rotation.x = 0.05;
    // heat
    const sw = cl(c.sweat ?? 0); thermoCol.scale.y = 0.02 + (lerp(90, 115, sw) - 70) * 0.0086 + 0.002 * Math.sin(t * 0.7);
    const bu = (t * 0.5) % 1; bubble.visible = sw > 0.05 && bu < 0.6; bubble.position.y = 1.08 + bu * 0.7; bubble.scale.setScalar(0.6 + bu * 0.6);
    cactus.children.forEach((ch, i) => { if (i >= 3 && i <= 6) ch.rotation.z = -0.12 * sw * (i < 5 ? 1 : -1); });
    // ambient
    cfan.rotation.y = t * 2.4; dust.update(t); risePuffs(smoke, t, 0.5, 0.22, 1.8); (cigarTip.material as THREE.SpriteMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 2.3);
    const br = 0.92 + 0.08 * Math.sin(t * 0.45);
    patches.forEach((p) => { if (!(nightPatches as THREE.Object3D[]).includes(p.m)) (p.m.material as THREE.MeshBasicMaterial).opacity = p.op * br * day; });
    shaftsM.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = (i ? 0.05 : 0.07) * br * day));
    (dust.pts.material as THREE.PointsMaterial).opacity = 0.6 * day + 0.15 * night;
    nightPatches.forEach((p, i) => ((p.material as THREE.MeshBasicMaterial).opacity = nightPatchOp[i] * night));
    // lights: ceiling on by day, off at night; the green lamp brighter at night
    ceilLights.forEach(({ core, L, gl }) => { (core.material as THREE.MeshBasicMaterial).color.setRGB(lerp(1.5, 0.55, night), lerp(1.42, 0.6, night), lerp(1.25, 0.72, night)); L.intensity = 2.5 * day; gl.material.opacity = 0.5 * day; });
    mLampL.intensity = lerp(1.0, 5.5, night); (mLampGlow.material as THREE.SpriteMaterial).opacity = lerp(0.5, 1, night); (mLampPool.material as THREE.MeshBasicMaterial).color.set("#ffc070").multiplyScalar(lerp(0.12, 0.5, night));
    lampL.intensity = lerp(2.2, 7, night); fills.forEach((L) => (L.intensity = 3.2 * day)); (lampGlow.material as THREE.SpriteMaterial).opacity = lerp(0.55, 1, night);
    (lampPool.material as THREE.MeshBasicMaterial).color.set("#ffc070").multiplyScalar(lerp(0.22, 0.55, night));
    nightG.visible = night > 0.01; backM.color.setScalar(night);
    // blinds: tilt open by day, half closed at night (lowered to half the window, slats nearly shut)
    for (const bl of blinds) {
      const n = bl.slats.length, shown = Math.round(lerp(n * 0.45, n * 0.68, night)), tilt = lerp(1.05, 0.28, night), top = bl.y1 - 0.03;
      bl.slats.forEach((s, i) => { s.visible = i < shown; s.position.y = top - i * 0.055 * (i < shown ? 1 : 0); if (bl.dirX) s.rotation.x = tilt; else s.rotation.z = tilt; });
    }
    // the town model
    const mbk = smooth01(cl(c.modelBridge ?? 1)); mBridge.position.set(mBridgeSeat.x, (1 - mbk) * 0.25 + 0.002, mBridgeSeat.z); mBridge.rotation.z = (1 - mbk) * 0.06 * Math.sin(t * 1.3); mBridge.rotation.x = (1 - mbk) * 0.04 * Math.sin(t * 0.9);
    const ml = cl(c.modelLots ?? 0);
    flags.forEach(({ f, d, glow: gm }) => { const k = cl((ml * 1.15 - (d / maxD) * 0.95) / 0.12); f.set(k); (gm.material as THREE.MeshBasicMaterial).opacity = 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.0)) * 0.6 + 0.22 * k; });
    modelGlows.forEach((s) => (s.material.opacity = 0.9 * night));
    // tiny cars: the wagon comes along the highway from the left, pulls off at the dinosaur, then on into town
    const mc = cl(c.modelCars ?? 0), hw = ML.hwyW;
    const p1 = (u: number): [number, number, number] => {
      if (u < 0.25) { const k = sm(u / 0.25); return [lerp(-1.1, ML.dinoU + 0.02, k), hw - 0.025 - 0.025 * k, 0]; }
      if (u < 0.45) return [ML.dinoU + 0.02, hw - 0.05, 0];
      if (u < 0.7) { const k = sm((u - 0.45) / 0.25); return [lerp(ML.dinoU + 0.02, ML.mainU - 0.02, k), hw - 0.05 + 0.025 * k, 0]; }
      const k = sm((u - 0.7) / 0.3); return [ML.mainU - 0.02, lerp(hw - 0.025, ML.bridgeW + 0.09, k), -Math.PI / 2];
    };
    const [x1, z1, a1] = p1(mc); car1.position.set(x1, 0.002, z1); car1.rotation.y = mc > 0.7 ? lerp(0, Math.PI / 2, sm((mc - 0.7) / 0.06)) : a1;
    car2.position.set(lerp(1.1, -1.1, mc), 0.002, hw + 0.025); car2.rotation.y = Math.PI;
    for (const cc of [car1, car2]) (cc.userData.wheels as THREE.Mesh[]).forEach((w) => (w.rotation.z = -t * 12));
  };
  set({});
  return { g, set, MARKS, SOLIDS };
};
