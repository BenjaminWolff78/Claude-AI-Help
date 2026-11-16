// THE CRASH HALL, 1959 (home base for the hook, the first crash test, the explanation and the tank-car payoff).
// A tall factory test hall: a massive concrete CRASH WALL on the back wall (z -6) with yellow/black hazard stripes, a
// steel guide rail down the middle of the floor (z 6 -> wall) the cars are winched along, the big STOPPING TIME clock
// (THE MECHANISM OBJECT: a white dial on the back wall with a red sweep hand and an engraved brass plate), the release
// LEVER on a post (left), a TEST LOG chalkboard, a sign board "CRASH TEST No. 1 - 1959", high windows with daylight
// shafts, hanging factory lamps, two floodlights on stands, tyres, oil drums, a tool cart, spare dummies on a bench.
// Room x -7..7, z -6..8, height 7. Cars on the rail face the wall (yaw PI).
// Controls: pz (paper car nose distance from the wall, m), pcrush, pdoor, pdent, pshake, psteam, paside (0 on the rail,
//           1 parked at the left bay), tz / tshake (tank car on the rail, distance), tside (1 = tank parked at right bay),
//           hand (STOPPING TIME hand 0..1 of a turn), lever (0..1 pulled), flood (floodlights 0..1), dusk (0 day, 1 blue)
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep } from "../paint";
import { glow, rod } from "../setkit";
import { metal, motes } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { col, shiny, SANS } from "./desertkit";
import { sedan, CAGE_YELLOW } from "./sedan";
import type { SetDef, SetBuilder, V3 } from "./types";

const TAU = Math.PI * 2;
export const concreteTex = (key: string, base = "#b9b2a6") => ctex("chConc" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(80,70,60,${0.05 + 0.08 * r()})` : `rgba(255,250,240,${0.05 + 0.07 * r()})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 10, 2 + r() * 10); }
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = r() * 1024; const gr = g.createRadialGradient(x, y, 0, x, y, 40 + r() * 90); gr.addColorStop(0, "rgba(70,60,50,0.18)"); gr.addColorStop(1, "rgba(70,60,50,0)"); g.fillStyle = gr; g.fillRect(x - 140, y - 140, 280, 280); }
  g.strokeStyle = "rgba(60,50,45,0.45)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 256); g.lineTo(1024, i * 256); g.stroke(); g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, 1024); g.stroke(); }
  g.strokeStyle = "rgba(60,50,45,0.3)"; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 70; y += (r() - 0.3) * 50; g.lineTo(x, y); } g.stroke(); }
});
const hazardTex = () => ctex("chHazard", 1024, 256, (g, r) => {
  g.fillStyle = "#26222c"; g.fillRect(0, 0, 1024, 256); g.fillStyle = CAGE_YELLOW;
  for (let x = -256; x < 1024 + 256; x += 128) { g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 64, 256); g.lineTo(x + 64 + 256, 0); g.lineTo(x + 256, 0); g.closePath(); g.fill(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(30,25,30,${0.15 * r()})`; g.fillRect(r() * 1024, r() * 256, 4 + r() * 18, 2 + r() * 6); }
});
const brickTex = () => ctex("chBrick", 1024, 1024, (g, r) => {
  g.fillStyle = "#7a4a3e"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 48) for (let x = (y / 48) % 2 ? -64 : 0; x < 1024; x += 128) { const c = ["#9a5a44", "#8e5240", "#a8644a", "#87503f"][Math.floor(r() * 4)]; g.fillStyle = c; g.fillRect(x + 4, y + 4, 120, 40); g.fillStyle = "rgba(255,220,190,0.1)"; g.fillRect(x + 4, y + 4, 120, 8); }
});
const painted = (key: string, base: string) => ctex("chPaint" + key, 512, 512, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "60,60,70" : "255,255,250"},${0.04 * r()})`; g.fillRect(r() * 512, r() * 512, 6 + r() * 30, 2 + r() * 8); } });
/** the STOPPING TIME dial: cream face, 0-10 numerals, ticks, "SECONDS x 0.1" small print */
export const dialTex = () => ctex("chDial", 1024, 1024, (g) => {
  g.fillStyle = "#f6efdc"; g.beginPath(); g.arc(512, 512, 500, 0, TAU); g.fill();
  g.strokeStyle = "#2a2230"; g.lineWidth = 26; g.beginPath(); g.arc(512, 512, 486, 0, TAU); g.stroke();
  for (let k = 0; k < 50; k++) { const a = (k / 50) * TAU - Math.PI / 2, big = k % 5 === 0; g.lineWidth = big ? 12 : 5; g.beginPath(); g.moveTo(512 + Math.cos(a) * (big ? 380 : 420), 512 + Math.sin(a) * (big ? 380 : 420)); g.lineTo(512 + Math.cos(a) * 456, 512 + Math.sin(a) * 456); g.stroke(); }
  g.fillStyle = "#2a2230"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let n = 0; n < 10; n++) { const a = (n / 10) * TAU - Math.PI / 2; g.font = "900 84px Arial Black, Arial"; g.fillText(String(n), 512 + Math.cos(a) * 300, 512 + Math.sin(a) * 300); }
  // the "OUCH" band right after zero (a blink of a stop) in red, the "SAFE" band in green
  g.lineWidth = 34; g.strokeStyle = "rgba(210,50,40,0.85)"; g.beginPath(); g.arc(512, 512, 432, -Math.PI / 2, -Math.PI / 2 + TAU * 0.08); g.stroke();
  g.strokeStyle = "rgba(60,160,80,0.85)"; g.beginPath(); g.arc(512, 512, 432, -Math.PI / 2 + TAU * 0.5, -Math.PI / 2 + TAU * 0.92); g.stroke();
  g.fillStyle = "#c8352e"; fitText(g, "OUCH", 590, 214, 120, 44, SANS); g.fillStyle = "#2f8a4a"; fitText(g, "SAFE", 420, 792, 160, 50, SANS);
});

export const crashhall: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const X0 = -7, X1 = 7, Z0 = -6, Z1 = 8, HT = 7;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), lam("chFloor", () => ({ map: rep(concreteTex("Floor", "#a9a39a"), 3, 3) }))); floor.position.set(0, 0, (Z0 + Z1) / 2); floor.receiveShadow = true; root.add(floor);
  const brick = lam("chBrickM", () => ({ map: rep(brickTex(), 3, 1) })), upper = lam("chUpper", () => ({ map: rep(painted("Up", "#d9d2bf"), 3, 2) })), trim = col("#3f5a7a");
  const wall = (x0: number, z0: number, x1: number, z1: number) => { b.add(boxGeo(V(x0, 0, z0), V(x1, 2.4, z1), 1), brick); b.add(boxGeo(V(x0, 2.4, z0), V(x1, HT, z1), 1), upper); b.add(boxGeo(V(x0, 2.38, z0), V(x1, 2.5, z1)), trim); };
  wall(X0, Z0 - 0.3, X1, Z0); wall(X0 - 0.3, Z0, X0, Z1); wall(X1, Z0, X1 + 0.3, Z1); wall(X0, Z1, X1, Z1 + 0.3);
  b.add(boxGeo(V(X0, HT, Z0), V(X1, HT + 0.2, Z1)), col("#5a5866"));
  // roof trusses + hanging lamps
  const steel = metal("chSteel", "#4a5a74", 40);
  for (let z = -4; z <= 7; z += 2.75) { b.add(boxGeo(V(X0, HT - 0.5, z - 0.08), V(X1, HT - 0.35, z + 0.08)), steel); for (let x = -6; x <= 6; x += 1.5) b.add(new THREE.BoxGeometry(0.06, 0.5, 0.06).translate(x, HT - 0.25, z), steel); }
  const lampHeads: THREE.Sprite[] = [];
  for (const [x, z] of [[-3.2, -2.5], [3.2, -2.5], [-3.2, 3], [3.2, 3], [0, 0.3]] as [number, number][]) {
    rod(root, [x, HT - 0.35, z], [x, 4.6, z], 0.012, metal("chCord", "#2a2a30", 20));
    b.add(new THREE.ConeGeometry(0.42, 0.3, 18, 1, true).translate(x, 4.5, z), shiny("chShade", "#2f6b5a", 40));
    lampHeads.push(glow(root, [x, 4.32, z], "#ffe9b8", 1.1, 0.85));
    const pl = new THREE.PointLight("#ffe2b0", 6, 11, 1.2); pl.position.set(x, 4.2, z); root.add(pl);
  }
  // high windows on both side walls (daylight you can see) + shafts
  const winM = new THREE.MeshBasicMaterial({ map: ctex("chWin", 256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#cfe8ff"); gr.addColorStop(1, "#f6fbff"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#3f5a7a"; g.lineWidth = 12; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } }) });
  const winDusk = new THREE.MeshBasicMaterial({ map: ctex("chWinD", 256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1c2a6a"); gr.addColorStop(1, "#4a5aa8"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#1a2236"; g.lineWidth = 12; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } }) });
  const wins: THREE.Mesh[] = [];
  for (const s of [-1, 1]) for (let z = -3.5; z <= 6; z += 3.2) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), winM); w.position.set(s * (X1 - 0.02), 4.9, z); w.rotation.y = -s * Math.PI / 2; root.add(w); wins.push(w); }
  const shafts: THREE.Mesh[] = [];
  { const sm = new THREE.MeshBasicMaterial({ color: "#fff4d8", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
    for (let z = -3.5; z <= 6; z += 3.2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 6.5), sm); m.position.set(X1 - 2.6, 2.9, z); m.rotation.set(0, Math.PI / 2, 0.62); root.add(m); shafts.push(m); } }
  const dust = motes(root, [2, 0.5, -4], [6.5, 5.5, 6], 60, "#fff6e0", 0.022, 0.6, 3);
  // THE CRASH WALL: a massive concrete block with hazard stripes, scuffs and the impact target
  const CW = { x0: -2.4, x1: 2.4, y1: 2.3, z0: Z0, z1: Z0 + 1.3 };
  b.add(boxGeo(V(CW.x0, 0, CW.z0), V(CW.x1, CW.y1, CW.z1), 1), lam("chBlock", () => ({ map: rep(concreteTex("Block", "#c7c0b2"), 1.5, 1) })));
  { const hz = new THREE.Mesh(new THREE.PlaneGeometry(CW.x1 - CW.x0, 0.55), lam("chHazM", () => ({ map: hazardTex() }))); hz.position.set(0, 0.32, CW.z1 + 0.005); root.add(hz); }
  { const tg = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: ctex("chTarget", 256, 256, (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? CAGE_YELLOW : "#26222c"; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 126, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2); g.fill(); } }) })); tg.position.set(0, 1.25, CW.z1 + 0.006); root.add(tg); }
  // sign boards (painted, in-world text): CRASH TEST No.1 1959, TEST LOG chalkboard
  const board = (key: string, w: number, h: number, pos: V3, yaw: number, draw: (g: CanvasRenderingContext2D) => void, cw = 1024, ch = 512) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ctex(key, cw, ch, (gg) => draw(gg)) })); m.position.set(...pos); m.rotation.y = yaw; root.add(m); return m; };
  // two lines, high on the wall: narrow enough to sit whole in the 9:16 wides and above the frame in the low shots
  board("chSignTest2", 2.6, 1.1, [0, 4.5, Z0 + 0.02], 0, (g) => { g.fillStyle = "#2f4a6a"; g.fillRect(0, 0, 1024, 434); g.strokeStyle = "#f4ead0"; g.lineWidth = 16; g.strokeRect(12, 12, 1000, 410); g.fillStyle = "#f4ead0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "CRASH TEST No. 1", 512, 150, 900, 150, SANS); g.fillStyle = "#f2c230"; fitText(g, "1959", 512, 305, 600, 150, SANS); }, 1024, 434);
  // THE STOPPING TIME CLOCK (mechanism object): dial + red hand + brass plate, on the back wall right of the block
  const CLK: V3 = [3.75, 3.8, Z0 + 0.06];   // raised: its brass plate (2.36-2.68) sits above the block top (2.3), never hidden by the block's side
  { const face = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), new THREE.MeshBasicMaterial({ map: dialTex() })); face.position.set(CLK[0], CLK[1], CLK[2]); root.add(face);
    b.add(new THREE.TorusGeometry(0.97, 0.07, 10, 48).translate(CLK[0], CLK[1], CLK[2] + 0.02), metal("chBrass", "#c99a3a", 70));
    b.add(new THREE.CylinderGeometry(0.98, 0.98, 0.1, 40).rotateX(Math.PI / 2).translate(CLK[0], CLK[1], CLK[2] - 0.04), col("#3a3440")); }
  board("chPlate", 1.7, 0.32, [CLK[0], CLK[1] - 1.28, Z0 + 0.04], 0, (g) => { const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#e8c062"); gr.addColorStop(1, "#b48a32"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 192); g.strokeStyle = "#6a4a1a"; g.lineWidth = 10; g.strokeRect(8, 8, 1008, 176); g.fillStyle = "#3a2410"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "STOPPING TIME", 512, 98, 900, 120, SANS); for (const x of [40, 984]) { g.beginPath(); g.arc(x, 96, 14, 0, TAU); g.fill(); } }, 1024, 192);
  const hand = new THREE.Group(); hand.position.set(CLK[0], CLK[1], CLK[2] + 0.04); root.add(hand);
  hand.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.82, 0.02).translate(0, 0.33, 0), col("#d8302a")));
  hand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16).rotateX(Math.PI / 2), col("#2a2230")));
  const clkLamp = glow(root, [CLK[0], CLK[1] + 1.25, CLK[2] + 0.3], "#ffe6b8", 0.8, 0.6);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8).rotateX(Math.PI / 2).translate(CLK[0], CLK[1] + 1.18, CLK[2] + 0.28), metal("chBrass", "#c99a3a", 70));
  // TEST LOG chalkboard (left of the block) with tally marks and a sketch of the cage
  board("chLog", 1.8, 1.25, [-4.1, 3.2, Z0 + 0.02], 0, (g) => { g.fillStyle = "#2c3a34"; g.fillRect(0, 0, 1024, 712); g.strokeStyle = "#8a5a32"; g.lineWidth = 30; g.strokeRect(15, 15, 994, 682); g.fillStyle = "#eef0e6"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = "900 78px Georgia"; g.fillText("TEST LOG", 70, 110); g.font = "700 54px Georgia"; g.fillText("CAR:  PAPER CAR", 70, 230); g.fillText("SPEED: 35 MPH", 70, 320); g.fillText("WALL:  CONCRETE", 70, 410);
    g.strokeStyle = "#eef0e6"; g.lineWidth = 8; g.strokeRect(560, 470, 380, 150); g.strokeStyle = CAGE_YELLOW; g.strokeRect(650, 440, 200, 120); g.strokeStyle = "#eef0e6"; for (const x of [600, 900]) { g.beginPath(); g.arc(x, 630, 40, 0, TAU); g.stroke(); } }, 1024, 712);
  // the guide rail + winch cable down the middle of the floor; lane lines
  const railM = metal("chRail", "#7a8296", 60);
  b.add(boxGeo(V(-0.06, 0, CW.z1), V(0.06, 0.08, Z1 - 0.6)), railM);
  for (const s of [-1, 1]) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.12, Z1 - CW.z1 - 0.6), new THREE.MeshBasicMaterial({ color: CAGE_YELLOW })); ln.rotation.x = -Math.PI / 2; ln.position.set(s * 1.25, 0.004, (CW.z1 + Z1 - 0.6) / 2); root.add(ln); }
  b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 18).rotateZ(Math.PI / 2).translate(0, 0.45, Z1 - 0.4), metal("chWinch", "#3f5a7a", 40));
  // the release LEVER on a post (left of the rail), a worker pulls it
  const LEV: V3 = [-2.05, 0, -0.6];   // beside the rail, mid-hall (in both crash wides)
  b.add(boxGeo(V(LEV[0] - 0.14, 0, LEV[2] - 0.14), V(LEV[0] + 0.14, 1.0, LEV[2] + 0.14)), col("#c8352e"));
  const lever = new THREE.Group(); lever.position.set(LEV[0], 1.0, LEV[2]); root.add(lever);
  lever.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8).translate(0, 0.35, 0), railM));
  lever.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8).translate(0, 0.72, 0), col("#26222c")));
  // floodlights on stands aimed at the wall
  const floods: THREE.Sprite[] = [], floodL: THREE.SpotLight[] = [];
  for (const [s, x, z] of [[-1, -5.6, -4.8], [1, 6.3, -4.6]]) {   // both in the back corners, out of the door shots and the clock insert; right in the corner past the parked tank, out of the clock insert's line of sight
    rod(root, [x, 0, z], [x, 2.6, z], 0.03, steel); for (const a of [0, 2.1, 4.2]) rod(root, [x, 0.05, z], [x + Math.cos(a) * 0.5, 0, z + Math.sin(a) * 0.5], 0.02, steel);
    b.add(new THREE.CylinderGeometry(0.28, 0.2, 0.4, 16).rotateX(Math.PI / 2 - 0.25).rotateY(-s * 0.55).translate(x, 2.75, z), metal("chFlood", "#2a2a30", 40));
    floods.push(glow(root, [x - s * 0.12, 2.72, z - 0.18], "#fff4dc", 1.0, 0.9));
    const sp = new THREE.SpotLight("#fff2d8", 16, 10, 0.55, 0.5, 1.2); sp.position.set(x, 2.75, z); sp.target.position.set(0, 0.8, CW.z1); root.add(sp, sp.target); floodL.push(sp); }
  // clutter with wear: tyre stacks, oil drums, a tool cart, cones, spare dummies on a bench, a thermos
  const tyreM = col("#2b2733");
  for (const [x, z, n] of [[-6.2, -4.6, 4], [-5.4, -4.9, 3], [6.1, 6.6, 5]] as [number, number, number][]) for (let k = 0; k < n; k++) b.add(new THREE.TorusGeometry(0.3, 0.12, 8, 18).rotateX(Math.PI / 2).translate(x, 0.12 + k * 0.24, z), tyreM);
  for (const [x, z, c] of [[6.2, -4.8, "#3f6aa0"], [6.0, -4.0, "#c8352e"], [-6.3, 6.4, "#3f8a5a"]] as [number, number, string][]) { b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16).translate(x, 0.45, z), shiny("chDrum" + c, c, 30)); b.add(new THREE.TorusGeometry(0.3, 0.02, 6, 18).rotateX(Math.PI / 2).translate(x, 0.3, z), col("#2a2230")); }
  { const cx = 4.3, cz = 4.6; b.add(boxGeo(V(cx - 0.5, 0.25, cz - 0.3), V(cx + 0.5, 0.9, cz + 0.3)), shiny("chCart", "#c8352e", 40)); for (const s of [-1, 1]) for (const t of [-1, 1]) b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10).rotateX(Math.PI / 2).translate(cx + s * 0.4, 0.08, cz + t * 0.25), tyreM);
    for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(0.06, 0.03, 0.3).translate(cx - 0.3 + k * 0.15, 0.92, cz), metal("chTool", "#9aa0ac", 60)); }
  for (const [x, z] of [[1.6, -3.4], [-1.6, -3.4], [1.6, 5.9]] as [number, number][]) { b.add(new THREE.ConeGeometry(0.16, 0.45, 14).translate(x, 0.23, z), col("#f07a2a")); b.add(new THREE.CylinderGeometry(0.11, 0.13, 0.07, 14).translate(x, 0.26, z), col("#f4f1ea")); }
  { const bx = -5.6, bz = 1.5; b.add(boxGeo(V(bx - 0.25, 0.42, bz - 1.0), V(bx + 0.25, 0.5, bz + 1.0)), lam("chBench", () => ({ color: "#7a5a3a" }))); for (const t of [-0.9, 0.9]) b.add(boxGeo(V(bx - 0.22, 0, bz + t - 0.05), V(bx + 0.22, 0.42, bz + t + 0.05)), col("#5a4030")); }
  const parked = new THREE.Group(); root.add(parked);
  b.build(root);
  // THE CARS (paper car on the rail, tank car parked right; controls move them)
  const paper = sedan(root, { style: "fin" }), tankC = sedan(root, { style: "tank" });
  const RAILX = 0, WALLZ = CW.z1;
  const marks: Record<string, V3> = {
    wall: [0, 0, WALLZ], clock: CLK, lever: [LEV[0] + 0.45, 0, LEV[2] + 0.2], leverTop: [LEV[0], 1.72, LEV[2]],
    gallery1: [-3.4, 0, 2.4], gallery2: [-3.2, 0, 3.0], gallery3: [-3.4, 0, 1.0], gallery4: [-4.0, 0, 1.0],
    clockFoot: [CLK[0] - 0.3, 0, Z0 + 1.6], bay: [-3.8, 0, 0.6], tankBay: [4.0, 0, 1.0], bench: [-5.6, 0.5, 1.5],
  };
  const cams = {
    wide: { pos: [0.4, 2.4, 9.2] as V3, look: [0, 1.4, -2] as V3, fov: 50 },
    clock: { pos: [3.0, 2.6, -1.0] as V3, look: [CLK[0], CLK[1] - 0.3, Z0] as V3, fov: 40 },
    car: { pos: [3.2, 1.6, 1.4] as V3, look: [0, 0.8, -3.0] as V3, fov: 42 },
  };
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  /** place a car on the rail (nose `d` m from the wall) or parked in a bay (k 0..1 blend) */
  const place = (car: ReturnType<typeof sedan>, d: number, bay: V3, k: number, bayYaw: number) => {
    const rz = WALLZ + d + car.NOSE, x = RAILX + (bay[0] - RAILX) * k, z = rz + (bay[2] - rz) * k;
    car.g.position.set(x, 0, z); car.g.rotation.y = Math.PI + (bayYaw - Math.PI) * k;
  };
  return {
    name: "crashhall", root, marks, cams,
    pose: (t, c) => {
      dust.update(t);
      const pd = c.pz ?? 3.5;
      place(paper, pd, [3.9, 0, 0.9], cl(c.paside ?? 0), Math.PI + 0.45);   // parked in the right bay for the payoff
      paper.set({ crush: c.pcrush ?? 0, dent: c.pdent ?? 0, door: c.pdoor ?? 0, dist: -pd, shake: c.pshake ?? 0, steam: c.psteam ?? 0, t });
      place(tankC, c.tz ?? 3.5, [5.3, 0, -1.0], cl(c.tside ?? 1), Math.PI);   // parked along the right wall
      tankC.set({ crush: 0, dist: -(c.tz ?? 3.5), shake: c.tshake ?? 0, steam: 0, t });
      hand.rotation.z = -TAU * (c.hand ?? 0);
      lever.rotation.x = -0.9 * cl(c.lever ?? 0);
      const fl = c.flood ?? 1; floods.forEach((s) => { (s.material as THREE.SpriteMaterial).opacity = 0.9 * fl; }); floodL.forEach((l) => { l.intensity = 16 * fl; });
      const dk = cl(c.dusk ?? 0); wins.forEach((w) => { w.material = dk > 0.5 ? winDusk : winM; }); shafts.forEach((s) => { s.visible = dk < 0.5; });
      lampHeads.forEach((h, i) => { (h.material as THREE.SpriteMaterial).opacity = 0.85 * (0.97 + 0.03 * Math.sin(t * 17 + i)); });
      (clkLamp.material as THREE.SpriteMaterial).opacity = 0.6;
    },
  };
};
export const PAPER_STYLE = "fin";
void parkedNoop;
function parkedNoop() { /* reserved */ }
