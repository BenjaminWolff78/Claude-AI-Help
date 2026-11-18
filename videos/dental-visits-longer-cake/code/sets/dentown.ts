// "He Made Dental Visits Longer and Patients Brought Him Cake" (2026-11-17): ONE connected small-town street set with
// the two rival dental offices facing each other, plus a separate lab room (x 76..84). Local metres, y up.
//  STREET along x: asphalt y 0 (z -3..3); north sidewalk y 0.12 (z -5.5..-3); south sidewalk y 0.12 (z 3..5.5).
//  HAL'S DENTAL (north, x -7..7): mint clapboard front, outer face z -5.5 facing +z. Openings (no glass, so the camera can
//    glide through): WAITING window x -6.2..-1.8 and TREATMENT window x 0.8..6.2 (y 0.85..2.65), glazed door x -1.45..-0.25.
//    Inside floor y 0.12, ceiling 3.2, back wall z -12, partition x 0 with a doorway z -8.2..-9.8.
//    WAITING ROOM x -7..0: Mae's desk (x -3.2..-0.9, z -10.2..-9.5, top 1.05) with the appointment book, the egg timer,
//      pen cup, bell; the photo wall behind her (back wall); waiting chairs under the front window; the bench along the west
//      wall facing the TV on the partition; fish tank, rubber plant, magazine rack, coat stand, rug, wall clock.
//    TREATMENT ROOM x 0..7: the dental chair (head end at x 2.6, z -9.0, reclined), the round lamp on its arm, the tool tray
//      with the 3-minute hourglass, the sink, the cabinet with the locked drawer (Loophole Key), the corkboard with the long
//      pain strip and two photo pins, diplomas, a tooth poster, the instant camera on the counter.
//  VANCE'S DENTAL (south, x -7..7): navy and chrome, outer face z 5.5 facing -z. Window x -6.2..-1.8 into his waiting
//    room (rows of chrome chairs), door x 0.2..1.4, treatment window x 1.8..6.2 with venetian blinds.
//  STREET: Sal's barber (north x -15..-7, striped pole), the bakery (north x 7..15), Pratt's red truck parked at x 9..16
//    (north kerb), the diner (south x -16..-7), LUCKY LANES bowling (south x 7..18, pin + ball on the roof), houses beyond,
//    plane trees (spring blossoms), lamp posts, benches, hydrant, mailbox, newspaper box, bins, planters, a bicycle.
//  LAB (x 76..84, z -4..3): table with two tubs (60 s, 90 s), thermometer card 14/15 °C, beakers, wall chart, clock.
// Controls (pose c.*): hDoor 0..1 (Hal's door), bell (swing amount), hg (hourglass: turns, 0.5 = flipped once),
//  hgK (sand in the top bulb 0..1), drawer 0..1, keyIn 0/1, keyTurn 0..1, camOut 0..1 (instant camera on the counter),
//  ph1 / ph2 0 hidden, 1 sticking out of the camera, 2 pinned (strip), grey 0..1 (the strip's middle greys out),
//  tv 0 talking heads / 1 fireworks, wallN 0..36 (smiling photos on the reception wall), prattPin 0/1, egg (egg-timer
//  dial turns), book 0..1 (scribble), mag 0..1 (magazine falls), spring 0..1, petals, chalk 0..1 (DR. SLOWPOKE writes on),
//  blinds 0..1 (slats shut), blindPart 0..1, bagCake 0/1 (cake in Dot's tote), lampOn 0..1, cakeDesk 0/1 (cake on Mae's
//  desk at the end), vChairs 0/1, therm 14..15, tubB 0..1 (ripple), cardOn 0/1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad } from "../build";
import { ctex, rng, rep, planksHD, stoneHD, facadeHD, roofHD } from "../paint";
import { NOINK } from "../ink";
import { swayMaterial } from "../sway";
import { barkTex, leafyTree, leafCardMat } from "./brickyard";
import { sedan } from "./sedan";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("dt" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
const unlit = (map: THREE.Texture, k = 0.9) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: true });
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0: number, r1: number, h: number, n = 28) => new THREE.CylinderGeometry(r0, r1, h, n);
export const DT = {
  SW: 0.12,
  CHAIR: [3.6, 0.12, -9.0] as V3, HEAD: [2.75, 1.22, -9.0] as V3, HAL_CHAIR: [1.95, 0.12, -9.35] as V3, TRAY: [2.3, 1.02, -8.3] as V3, BAG: [4.55, 0.12, -8.15] as V3,
  DESK: [-2.05, 0.82, -9.85] as V3, MAE: [-2.05, 0.12, -10.55] as V3, EGG: [-2.75, 0.83, -9.7] as V3, BOOK: [-1.45, 0.83, -9.7] as V3,
  BOARD: [2.6, 1.85, -11.88] as V3, DRAWER: [2.6, 0.98, -11.45] as V3, CAM: [3.9, 1.12, -11.55] as V3, TV: [-0.08, 2.15, -6.9] as V3,
  ABOARD: [0.35, 0.12, -4.5] as V3, VWIN: [-4.0, 0.12, 6.25] as V3, BLINDS: [4.0, 1.75, 5.62] as V3,
  LAB: [80, 0, 0] as V3, TUB_A: [79.25, 0.9, -0.8] as V3, TUB_B: [80.75, 0.9, -0.8] as V3,
};

// ---------------- textures ----------------
const asphalt = () => ctex("dtAsph", 1024, 1024, (g, r) => { g.fillStyle = "#6e6a66"; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 18000; i++) { const v = 80 + r() * 60; g.fillStyle = `rgba(${v + 4},${v},${v - 4},${0.25 + r() * 0.3})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
  for (let i = 0; i < 22; i++) { g.strokeStyle = "rgba(36,36,40,0.4)"; g.lineWidth = 2 + r() * 3; g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(40,40,46,0.35)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 40 + r() * 60, 20 + r() * 30, r() * 3, 0, TAU); g.fill(); } });
const pave = () => ctex("dtPave", 512, 512, (g, r) => { g.fillStyle = "#b8ae9e"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { const v = (r() - 0.5) * 20; g.fillStyle = `rgb(${186 + v},${178 + v},${162 + v})`; g.fillRect(x + 2, y + 2, 60, 60); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(80,70,60,${r() * 0.14})`; g.fillRect(r() * 512, r() * 512, 2, 2); } });
const clapboard = (key: string, base: string, line: string) => ctex("dtClap" + key, 512, 512, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { g.fillStyle = line; g.fillRect(0, y + 28, 512, 4); g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(0, y, 512, 5); for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * 512, y + r() * 26, 30 + r() * 90, 2); } } });
const wallpaper = (key: string, base: string, dot: string, stripe: string) => ctex("dtPaper" + key, 512, 512, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = stripe; g.fillRect(x + 28, 0, 8, 512); }
  for (let y = 16; y < 512; y += 48) for (let x = 0; x < 512; x += 64) { g.fillStyle = dot; g.beginPath(); g.arc(x + (y % 96 ? 0 : 32) + 10, y, 5, 0, TAU); g.fill(); }
  for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.03})`; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const lino = (key: string, a: string, b: string) => ctex("dtLino" + key, 512, 512, (g, r) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 64, y * 64, 64, 64); }
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * 512, r() * 512, 2, 2); } g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 2; for (let k = 0; k <= 512; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); } });
const rugTex = (key: string, a: string, b: string, c: string) => ctex("dtRug" + key, 512, 320, (g) => { g.fillStyle = a; g.fillRect(0, 0, 512, 320); g.strokeStyle = b; g.lineWidth = 18; g.strokeRect(24, 24, 464, 272); g.strokeStyle = c; g.lineWidth = 6; g.strokeRect(52, 52, 408, 216);
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? b : c; g.beginPath(); g.moveTo(256, 90 + i * 30); g.lineTo(300 - i * 4, 160); g.lineTo(256, 230 - i * 30); g.lineTo(212 + i * 4, 160); g.closePath(); g.fill(); } });
const sign = (key: string, w: number, h: number, bg: string, fg: string, txt: string, font: string, sub?: string, subCol?: string) => ctex("dtSign" + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = h * 0.06; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.font = font; g.fillText(txt, w / 2, sub ? h * 0.4 : h * 0.54);
  if (sub) { g.fillStyle = subCol ?? fg; g.font = `700 ${Math.round(h * 0.22)}px Georgia, serif`; g.fillText(sub, w / 2, h * 0.76); } });
const toothPoster = () => ctex("dtToothPoster", 384, 512, (g) => { g.fillStyle = "#cfe8de"; g.fillRect(0, 0, 384, 512); g.strokeStyle = "#3a7a6a"; g.lineWidth = 14; g.strokeRect(7, 7, 370, 498);
  g.fillStyle = "#f4efe2"; g.strokeStyle = "#2a3a3a"; g.lineWidth = 8; g.beginPath(); g.moveTo(110, 150); g.bezierCurveTo(110, 80, 170, 80, 192, 110); g.bezierCurveTo(214, 80, 274, 80, 274, 150); g.bezierCurveTo(274, 230, 250, 300, 236, 360); g.lineTo(214, 300); g.lineTo(170, 300); g.lineTo(148, 360); g.bezierCurveTo(134, 300, 110, 230, 110, 150); g.fill(); g.stroke();
  g.fillStyle = "#2a3a3a"; g.beginPath(); g.arc(165, 165, 9, 0, TAU); g.arc(220, 165, 9, 0, TAU); g.fill(); g.lineWidth = 6; g.beginPath(); g.arc(192, 195, 28, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = "#3a7a6a"; g.font = "900 52px Arial Black, Arial"; g.textAlign = "center"; g.fillText("BRUSH", 192, 430); g.font = "700 30px Georgia"; g.fillText("& smile!", 192, 474); });
const diploma = (i: number) => ctex("dtDiploma" + i, 320, 240, (g) => { g.fillStyle = "#efe6cc"; g.fillRect(0, 0, 320, 240); g.strokeStyle = "#8a6a3a"; g.lineWidth = 8; g.strokeRect(10, 10, 300, 220);
  g.fillStyle = "#3a2a1a"; g.font = "700 30px Georgia"; g.textAlign = "center"; g.fillText(i ? "Gentle Hands" : "Doctor of", 160, 70); g.fillText(i ? "Award" : "Dentistry", 160, 110);
  for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(60,40,20,0.4)"; g.fillRect(60, 140 + k * 18, 200, 4); } g.fillStyle = "#c8352e"; g.beginPath(); g.arc(250, 195, 20, 0, TAU); g.fill(); });
/** the pain strip: a long paper strip with a jagged pain line, the peak early, a long dull middle, a gentle end */
const stripTex = () => ctex("dtStrip", 2048, 256, (g, r) => { g.fillStyle = "#f2ead6"; g.fillRect(0, 0, 2048, 256);
  for (let x = 0; x < 2048; x += 64) { g.fillStyle = "rgba(90,120,140,0.18)"; g.fillRect(x, 0, 2, 256); } for (let y = 0; y < 256; y += 32) { g.fillStyle = "rgba(90,120,140,0.14)"; g.fillRect(0, y, 2048, 2); }
  g.strokeStyle = "#c8352e"; g.lineWidth = 10; g.lineJoin = "round"; g.beginPath();
  const pts: [number, number][] = []; for (let x = 20; x <= 2028; x += 22) { const u = x / 2048; let y = 150 + (r() - 0.5) * 34;
    if (u > 0.12 && u < 0.24) y = 210 - 190 * Math.sin(Math.PI * (u - 0.12) / 0.12) + (r() - 0.5) * 20;   // the peak (the scream)
    if (u > 0.82) y = 150 + 80 * (u - 0.82) / 0.18;                                                          // the gentle end
    pts.push([x, y]); }
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.fillStyle = "#3a2a1a"; g.font = "900 34px Arial Black, Arial"; g.textAlign = "left"; g.fillText("OUCH", 300, 36); g.textAlign = "right"; g.fillText("AHH", 2010, 36); });
const tvTex = (k: number) => ctex("dtTV" + k, 512, 300, (g, r) => {
  if (k === 0) { g.fillStyle = "#6a7a8a"; g.fillRect(0, 0, 512, 300); g.fillStyle = "#8a8a7a"; g.fillRect(0, 200, 512, 100);   // a dull talk: two grey heads
    for (const x of [170, 350]) { g.fillStyle = "#4a5260"; g.fillRect(x - 50, 130, 100, 130); g.fillStyle = "#d8d0c0"; g.beginPath(); g.arc(x, 110, 38, 0, TAU); g.fill(); }
    g.fillStyle = "rgba(255,255,255,0.08)"; for (let y = 0; y < 300; y += 6) g.fillRect(0, y, 512, 2); return; }
  g.fillStyle = "#1a1640"; g.fillRect(0, 0, 512, 300);                                                     // the big ending: fireworks + a heart
  for (let b = 0; b < 4; b++) { const cx = 90 + b * 110 + (k * 37) % 40, cy = 70 + ((b * 53 + k * 29) % 90), col = ["#ff6a4a", "#f4c430", "#5ad0f0", "#ff7ac0"][(b + k) % 4], R = 30 + ((k + b) % 3) * 14;
    g.strokeStyle = col; g.lineWidth = 5; for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); } }
  g.fillStyle = "#e8384a"; g.beginPath(); g.moveTo(256, 270); g.bezierCurveTo(170, 210, 190, 150, 236, 165); g.bezierCurveTo(246, 168, 252, 175, 256, 182); g.bezierCurveTo(260, 175, 266, 168, 276, 165); g.bezierCurveTo(322, 150, 342, 210, 256, 270); g.fill();
  g.fillStyle = "#f4e6b8"; g.font = "900 40px Georgia"; g.textAlign = "center"; g.fillText("THE END", 256, 40); });
/** the A-board: DR. SLOWPOKE + a snail, revealed left to right by k (0..1) over "OPEN TODAY" */
const chalkTex = (k: number) => ctex("dtChalk" + Math.round(k * 12), 512, 640, (g, r) => {
  g.fillStyle = "#2a302c"; g.fillRect(0, 0, 512, 640); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * 512, r() * 640, 30, 2); }
  g.strokeStyle = "#a8743e"; g.lineWidth = 26; g.strokeRect(13, 13, 486, 614);
  g.fillStyle = "#e8e4d8"; g.font = "700 54px 'Comic Sans MS', cursive"; g.textAlign = "center"; g.fillText("Dr. Hal", 256, 96); g.font = "700 40px 'Comic Sans MS', cursive"; g.fillText("open today", 256, 150);
  if (k <= 0) return; g.save(); g.beginPath(); g.rect(0, 170, 40 + 450 * k, 470); g.clip();
  g.fillStyle = "#f4c8d8"; g.font = "900 80px 'Comic Sans MS', cursive"; g.fillText("DR.", 256, 270); g.fillText("SLOWPOKE", 256, 360);
  g.strokeStyle = "#f4c8d8"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); for (let a = 0; a < 5 * Math.PI; a += 0.2) { const rr = 8 + a * 6; const x = 300 + Math.cos(a) * rr, y = 500 + Math.sin(a) * rr; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
  g.beginPath(); g.moveTo(190, 560); g.lineTo(380, 560); g.moveTo(190, 560); g.quadraticCurveTo(170, 520, 200, 500); g.moveTo(200, 500); g.lineTo(190, 470); g.moveTo(208, 500); g.lineTo(214, 470); g.stroke(); g.restore(); });
const thermTex = (deg: number) => ctex("dtTherm" + deg, 256, 160, (g) => { g.fillStyle = "#2a3238"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#cfd6dc"; g.lineWidth = 8; g.strokeRect(6, 6, 244, 148);
  g.fillStyle = deg >= 15 ? "#f4c430" : "#7ad0f0"; g.font = "900 88px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(`${deg}°C`, 128, 84); });
const labelTex = (t: string, bg: string, fg: string) => ctex("dtLabel" + t, 256, 128, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 256, 128); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116); g.fillStyle = fg; g.font = "900 64px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 128, 68); });
const poleTex = () => ctex("dtPole", 128, 256, (g) => { g.fillStyle = "#ece6da"; g.fillRect(0, 0, 128, 256); g.lineWidth = 30; for (let i = -4; i < 8; i++) { g.strokeStyle = i % 2 ? "#c8352e" : "#2f5d9a"; g.beginPath(); g.moveTo(0, i * 64); g.lineTo(128, i * 64 + 128); g.stroke(); } });
const awningTex = (a: string, b: string) => ctex("dtAwn" + a + b, 512, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 64, 0, 64, 256); } g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, 200, 512, 56); });
const photoTex = (i: number) => ctex("dtPhoto" + i, 128, 152, (g) => { const bg = ["#8ad8b4", "#f4c88a", "#a8c8f0", "#f4a8c0", "#c8e08a"][i % 5]; g.fillStyle = "#efe8d8"; g.fillRect(0, 0, 128, 152); g.fillStyle = bg; g.fillRect(10, 10, 108, 104);
  g.fillStyle = "#f6f0e2"; g.beginPath(); g.arc(64, 64, 30, 0, TAU); g.fill(); g.strokeStyle = "#2a2028"; g.lineWidth = 4; g.stroke(); const hairC = ["#2a1d14", "#a8482a", "#e0c070", "#6a4226", "#9a948a"][(i * 3) % 5]; g.fillStyle = hairC; g.fillRect(36, 30, 56, 12);
  g.lineWidth = 4; g.beginPath(); g.arc(52, 60, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(76, 60, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(64, 70, 14, 0.2, Math.PI - 0.2); g.stroke(); });
const scribbleTex = (k: number) => ctex("dtBook" + Math.round(k * 8), 512, 320, (g, r) => { g.fillStyle = "#f2ead6"; g.fillRect(0, 0, 512, 320); g.fillStyle = "#c8beac"; g.fillRect(252, 0, 8, 320);
  for (let y = 40; y < 320; y += 34) { g.fillStyle = "rgba(90,120,160,0.35)"; g.fillRect(20, y, 220, 2); g.fillRect(272, y, 220, 2); }
  g.strokeStyle = "#2f4a8a"; g.lineWidth = 4; for (let row = 0; row < 6; row++) { g.beginPath(); let x = 30; g.moveTo(x, 34 + row * 34); for (; x < 220; x += 8) g.lineTo(x, 30 + row * 34 + (r() - 0.5) * 10); g.stroke(); }
  const n = Math.round(k * 8); for (let row = 0; row < Math.min(6, n); row++) { g.beginPath(); let x = 282; g.moveTo(x, 34 + row * 34); for (; x < 470; x += 8) g.lineTo(x, 30 + row * 34 + (r() - 0.5) * 12); g.stroke(); }
  if (n >= 7) { g.fillStyle = "#c8352e"; g.font = "900 40px 'Comic Sans MS', cursive"; g.fillText("PRATT ✓", 300, 290); } });
const chartTex = () => ctex("dtChart", 512, 384, (g) => { g.fillStyle = "#eef0e8"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#3a4a5a"; g.lineWidth = 8; g.strokeRect(6, 6, 500, 372);
  g.fillStyle = "#2a3a4a"; g.font = "900 40px Arial Black, Arial"; g.textAlign = "center"; g.fillText("COLD WATER", 256, 62);
  g.fillStyle = "#5aa0d0"; g.fillRect(70, 150, 150, 190); g.fillRect(290, 110, 150, 230); g.fillStyle = "#f4c430"; g.fillRect(290, 110, 150, 60);
  g.fillStyle = "#2a3a4a"; g.font = "900 40px Arial Black"; g.fillText("A", 145, 130); g.fillText("B", 365, 96); });

// ---------------- builders ----------------
const chromeM = () => M("Chrome", "#c8cdd4"), darkM = () => M("Dark", "#2a2a30");
/** a park bench (seat along local x) */
const bench = (b: Batch, x: number, y: number, z: number, yaw: number, col = "#8a5a34") => {
  const g = new THREE.Group(); const wood = M("Bench" + col, col, rep(planksHD(), 0.4, 0.2)), iron = M("Iron", "#2e3238");
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { geo.rotateY(yaw); geo.translate(x, y, z); b.add(geo, m); };
  for (let k = 0; k < 3; k++) add(bx(1.7, 0.05, 0.12).translate(0, 0.45, -0.14 + k * 0.14), wood);
  for (let k = 0; k < 2; k++) add(bx(1.7, 0.1, 0.04).translate(0, 0.66 + k * 0.16, -0.26).rotateX(0), wood);
  for (const s of [-0.75, 0.75]) { add(bx(0.06, 0.45, 0.06).translate(s, 0.22, 0.16), iron); add(bx(0.06, 0.9, 0.06).translate(s, 0.45, -0.24), iron); add(bx(0.06, 0.05, 0.44).translate(s, 0.44, -0.04), iron); }
  void g;
};
const lampPost = (b: Batch, x: number, z: number) => { const lp = M("LampPost", "#2e3238"); b.add(cyl(0.06, 0.09, 3.8, 16).translate(x, DT.SW + 1.9, z), lp); b.add(cyl(0.16, 0.16, 0.12, 20).translate(x, DT.SW + 0.06, z), lp);
  b.add(cyl(0.05, 0.05, 0.6, 12).rotateZ(Math.PI / 2).translate(x, DT.SW + 3.75, z), lp); b.add(new THREE.SphereGeometry(0.2, 24, 16).translate(x, DT.SW + 3.95, z), M("LampG", "#f2e6c8", undefined, { emissive: "#4a3a20" })); };
const hydrant = (b: Batch, x: number, z: number) => { const r = M("Hydrant", "#c8352e"); b.add(cyl(0.12, 0.14, 0.6, 24).translate(x, DT.SW + 0.3, z), r); b.add(new THREE.SphereGeometry(0.13, 24, 12, 0, TAU, 0, Math.PI / 2).translate(x, DT.SW + 0.6, z), r);
  for (const s of [-1, 1]) b.add(cyl(0.05, 0.05, 0.12, 16).rotateZ(Math.PI / 2).translate(x + s * 0.16, DT.SW + 0.42, z), r); b.add(cyl(0.18, 0.18, 0.05, 24).translate(x, DT.SW + 0.04, z), r); };
const planter = (b: Batch, x: number, z: number, i: number) => { b.add(cyl(0.32, 0.26, 0.5, 24).translate(x, DT.SW + 0.25, z), M("Planter", "#a8643a")); const r = rng(500 + i);
  for (let k = 0; k < 9; k++) b.add(new THREE.IcosahedronGeometry(0.13 + r() * 0.05, 1).translate(x + (r() - 0.5) * 0.4, DT.SW + 0.6 + r() * 0.15, z + (r() - 0.5) * 0.4), M("Flower" + (k % 4), ["#e8484a", "#f4c430", "#f2a8c4", "#9a6ac8"][k % 4]));
  b.add(new THREE.IcosahedronGeometry(0.3, 1).scale(1, 0.6, 1).translate(x, DT.SW + 0.55, z), M("Shrub", "#4a8a3e")); };
const bicycle = (root: THREE.Object3D, x: number, z: number, yaw: number) => { const g = new THREE.Group(); g.position.set(x, DT.SW, z); g.rotation.y = yaw; root.add(g); const fr = M("Bike", "#2f8a8a"), ty = M("Tyre", "#26242a");
  for (const s of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 36), ty); w.position.set(s, 0.34, 0); g.add(w); const hub = new THREE.Mesh(cyl(0.03, 0.03, 0.08, 12).rotateX(Math.PI / 2), fr); hub.position.set(s, 0.34, 0); g.add(hub); }
  const tube = (a: V3, c: V3) => { const d = V(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const m = new THREE.Mesh(cyl(0.022, 0.022, d.length(), 8), fr); m.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(m); };
  tube([-0.5, 0.34, 0], [-0.05, 0.36, 0]); tube([-0.05, 0.36, 0], [0.4, 0.82, 0]); tube([-0.5, 0.34, 0], [-0.15, 0.8, 0]); tube([-0.15, 0.8, 0], [0.4, 0.82, 0]); tube([0.4, 0.82, 0], [0.5, 0.34, 0]); tube([-0.05, 0.36, 0], [-0.15, 0.8, 0]);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.05, 0.1, 2, 0.02), M("BikeSeat", "#3a2a24")); seat.position.set(-0.17, 0.86, 0); g.add(seat); tube([0.4, 0.82, 0], [0.38, 1.0, 0]); tube([0.38, 1.0, -0.22], [0.38, 1.0, 0.22]);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.18, 20, 1, true), M("Basket", "#c8955a", undefined, { side: THREE.DoubleSide })); basket.position.set(0.55, 0.92, 0); g.add(basket); };
const treeTex = () => barkTex();

export const dentown = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), nc = new Batch(), bc = new Batch();   // nc: shells that do NOT cast shadows (sunlit interiors)
  const SW = DT.SW;
  // ===================== GROUND =====================
  { b.add(quad(V(-70, 0, 3), V(70, 0, 3), V(70, 0, -3), V(-70, 0, -3), 1, 1), M("Asphalt", "#ffffff", rep(asphalt(), 14, 2)));
    const pv = M("Pave", "#ffffff", rep(pave(), 70, 1.25)); b.add(bx(140, SW, 2.5).translate(0, SW / 2, -4.25), pv); b.add(bx(140, SW, 2.5).translate(0, SW / 2, 4.25), pv);
    const kerb = M("Kerb", "#c8c0b0"); for (const z of [-3.04, 3.04]) b.add(bx(140, SW + 0.02, 0.16).translate(0, (SW + 0.02) / 2, z), kerb);
    const paint = M("Paint", "#e8d070", undefined, { emissive: "#2a2410" }); for (let x = -68; x < 70; x += 4) b.add(bx(2, 0.005, 0.12).translate(x, 0.004, 0), paint);
    // a zebra crossing in front of the two offices
    const zeb = M("Zebra", "#e2ddd0"); for (let k = 0; k < 7; k++) b.add(bx(0.5, 0.006, 5.6).translate(-9.4 + k * 0.9 * 0 + (k - 3) * 0.9 - 9.4 * 0, 0.005, 0), zeb);
    b.add(quad(V(-140, 0, -70), V(140, 0, -70), V(140, 0, 70), V(-140, 0, 70), 1, 1).translate(0, -0.02, 0), M("Far", "#8aa070"));
    b.add(bx(140, SW, 40).translate(0, SW / 2 - 0.01, -26), M("BackLot", "#8a9a72")); b.add(bx(140, SW, 40).translate(0, SW / 2 - 0.01, 26), M("BackLot", "#8a9a72"));
  }
  // ===================== HAL'S DENTAL (north) =====================
  const mint = M("HalClap", "#ffffff", rep(clapboard("Hal", "#8ec8b0", "rgba(40,80,70,0.35)"), 3, 1.6)), trim = M("HalTrim", "#ece6d6"), sideW = M("HalSide", "#ffffff", rep(clapboard("HalS", "#86bea8", "rgba(40,80,70,0.3)"), 3, 1.6));
  { const zf = -5.5, t = 0.2, H = 3.4;
    // front wall pieces around the openings (outer face z -5.5)
    const panel = (x0: number, x1: number, y0: number, y1: number) => nc.add(bx(x1 - x0, y1 - y0, t).translate((x0 + x1) / 2, (y0 + y1) / 2, zf - t / 2), mint);
    panel(-7, -6.2, 0, H); panel(-1.8, -1.45, 0, H); panel(-0.25, 0.8, 0, H); panel(6.2, 7, 0, H);
    panel(-6.2, -1.8, 0, 0.85); panel(0.8, 6.2, 0, 0.85); panel(-6.2, -1.8, 2.65, H); panel(0.8, 6.2, 2.65, H); panel(-1.45, -0.25, 2.45, H);
    // window frames + mullions (no glass) + sills + flower boxes
    for (const [x0, x1] of [[-6.2, -1.8], [0.8, 6.2]] as [number, number][]) { const cx = (x0 + x1) / 2, w = x1 - x0;
      for (const y of [0.85, 2.65]) b.add(bx(w + 0.16, 0.1, 0.28).translate(cx, y, zf - 0.02), trim);
      for (const x of [x0, x1]) b.add(bx(0.1, 1.9, 0.28).translate(x, 1.75, zf - 0.02), trim);
      b.add(bx(0.06, 1.8, 0.08).translate(cx, 1.75, zf + 0.02), trim); b.add(bx(w, 0.06, 0.08).translate(cx, 2.2, zf + 0.02), trim);
      b.add(bx(w - 0.4, 0.22, 0.3).translate(cx, 0.68, zf + 0.2), M("WinBox", "#6a4a32")); const r = rng(Math.round(x0 * 10) + 99);
      for (let k = 0; k < Math.round(w * 3); k++) b.add(new THREE.IcosahedronGeometry(0.08 + r() * 0.05, 1).translate(x0 + 0.3 + r() * (w - 0.6), 0.86, zf + 0.2 + (r() - 0.5) * 0.15), M("Flower" + (k % 4), ["#e8484a", "#f4c430", "#f2a8c4", "#9a6ac8"][k % 4])); }
    // the door frame + transom
    b.add(bx(0.1, 2.45, 0.26).translate(-1.45, 1.225, zf - 0.02), trim); b.add(bx(0.1, 2.45, 0.26).translate(-0.25, 1.225, zf - 0.02), trim); b.add(bx(1.3, 0.1, 0.26).translate(-0.85, 2.45, zf - 0.02), trim);
    // upper storey: the façade texture with two windows, the roof cornice
    const up = M("HalUp", "#ffffff", facadeHD("dtHalUp", 14, 3.0, { wall: "#8ec8b0", shutter: "#3f6a8a", door: false }));
    nc.add(quad(V(-7, H, zf), V(7, H, zf), V(7, H + 3.0, zf), V(-7, H + 3.0, zf), 1, 1), up);
    nc.add(bx(14, 3.0, 6.5).translate(0, H + 1.5, zf - 3.27), sideW);
    nc.add(bx(14.6, 0.3, 0.6).translate(0, H + 3.15, zf + 0.1), trim); b.add(bx(14.2, 0.18, 0.4).translate(0, H + 0.05, zf + 0.12), trim);
    // the big sign band + hanging tooth sign
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.62), unlit(sign("Hal", 1280, 124, "#2f6a5a", "#f4e6b8", "DR. HAL · GENTLE DENTISTRY", "900 74px Georgia, serif"), 0.92)); sg.position.set(0, 3.05, zf + 0.03); root.add(sg);
    b.add(bx(0.05, 0.05, 0.9).translate(-0.85, 2.95, zf + 0.45), darkM());
    { const tooth = new THREE.Shape(); tooth.moveTo(-0.22, 0.2); tooth.bezierCurveTo(-0.22, 0.38, -0.05, 0.38, 0, 0.3); tooth.bezierCurveTo(0.05, 0.38, 0.22, 0.38, 0.22, 0.2); tooth.bezierCurveTo(0.22, 0.0, 0.16, -0.22, 0.12, -0.3); tooth.lineTo(0.04, -0.12); tooth.lineTo(-0.04, -0.12); tooth.lineTo(-0.12, -0.3); tooth.bezierCurveTo(-0.16, -0.22, -0.22, 0.0, -0.22, 0.2);
      const tg = new THREE.ExtrudeGeometry(tooth, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 }).rotateY(Math.PI / 2).translate(-0.88, 2.55, zf + 0.75);
      const tm = new THREE.Mesh(tg, M("ToothSign", "#ece6d6")); tm.castShadow = true; root.add(tm); }
    // ---- interior shell ----
    const iw = M("HalPaperW", "#ffffff", rep(wallpaper("HalW", "#d0b48a", "#8a6038", "rgba(110,70,30,0.32)"), 3, 1.2)), it = M("HalPaperT", "#ffffff", rep(wallpaper("HalT", "#9cc4b0", "#4e8670", "rgba(30,80,60,0.3)"), 3, 1.2));
    nc.add(bx(7, 3.2, 0.1).translate(-3.5, 1.6 + SW, -12.05), iw); nc.add(bx(7, 3.2, 0.1).translate(3.5, 1.6 + SW, -12.05), it);
    nc.add(bx(0.1, 3.2, 6.5).translate(-7.05, 1.6 + SW, -8.75), iw); nc.add(bx(0.1, 3.2, 6.5).translate(7.05, 1.6 + SW, -8.75), it);
    // inner face of the front wall (wallpaper) is the same panels: add a thin papered skin behind them
    for (const [x0, x1, y0, y1, m] of [[-7, -6.2, 0, 3.32, iw], [-1.8, -1.45, 0, 3.32, iw], [-0.25, 0, 0, 3.32, iw], [0, 0.8, 0, 3.32, it], [6.2, 7, 0, 3.32, it], [-6.2, -1.8, 0, 0.85, iw], [0.8, 6.2, 0, 0.85, it], [-6.2, -1.8, 2.65, 3.32, iw], [0.8, 6.2, 2.65, 3.32, it], [-1.45, -0.25, 2.45, 3.32, iw]] as [number, number, number, number, THREE.Material][])
      nc.add(bx(x1 - x0, y1 - y0, 0.02).translate((x0 + x1) / 2, (y0 + y1) / 2, -5.72), m);
    // partition x 0 with the doorway (z -8.2..-9.8, h 2.35)
    for (const [z0, z1] of [[-5.7, -7.6], [-10.4, -12]] as [number, number][]) { nc.add(bx(0.06, 3.2, z0 - z1).translate(-0.04, 1.6 + SW, (z0 + z1) / 2), iw); nc.add(bx(0.06, 3.2, z0 - z1).translate(0.04, 1.6 + SW, (z0 + z1) / 2), it); }
    nc.add(bx(0.14, 0.6, 2.8).translate(0, SW + 2.6 + 0.3, -9.0), trim); for (const z of [-7.6, -10.4]) b.add(bx(0.18, 2.6, 0.08).translate(0, SW + 1.3, z), trim);
    // wood wainscot (panelled, 1.0 m) round both rooms: rails + panels give the walls detail at every distance
    { const wn = M("Wainscot", "#ffffff", rep(planksHD(), 2, 0.4)), rail = M("WRail", "#6a4a32");
      for (const [x0, x1, z, nx] of [[-7, 0, -11.98, 0], [0, 7, -11.98, 0]] as number[][]) { b.add(bx(x1 - x0, 1.0, 0.04).translate((x0 + x1) / 2, SW + 0.5, z), wn); b.add(bx(x1 - x0, 0.06, 0.07).translate((x0 + x1) / 2, SW + 1.02, z + 0.02), rail); void nx; }
      for (const [x, z0, z1] of [[-6.98, -5.7, -12], [6.98, -5.7, -12], [-0.07, -5.7, -7.6], [-0.07, -10.4, -12], [0.07, -5.7, -7.6], [0.07, -10.4, -12]] as number[][]) { b.add(bx(0.04, 1.0, Math.abs(z1 - z0)).translate(x, SW + 0.5, (z0 + z1) / 2), wn); b.add(bx(0.07, 0.06, Math.abs(z1 - z0)).translate(x, SW + 1.02, (z0 + z1) / 2), rail); }
      for (let k = 0; k < 14; k++) b.add(bx(0.04, 0.8, 0.06).translate(-6.75 + k * 0.5 + (k >= 7 ? 0.5 : 0), SW + 0.5, -11.95), rail); }
    // floors, ceiling, skirting, rugs
    nc.add(bx(7, 0.02, 6.4).translate(-3.5, SW + 0.005, -8.85), M("LinoW", "#ffffff", rep(lino("W", "#c8a882", "#8a6a4e"), 5, 4.5)));
    nc.add(bx(7, 0.02, 6.4).translate(3.5, SW + 0.005, -8.85), M("LinoT", "#ffffff", rep(lino("T", "#bcd8cc", "#8ab4a4"), 5, 4.5)));
    nc.add(bx(14.2, 0.1, 6.6).translate(0, SW + 3.25, -8.85), M("Ceil", "#d8d0bc"));
    for (const [x, z, w, d] of [[-3.5, -12.0, 7, 0.04], [3.5, -12.0, 7, 0.04], [-6.98, -8.85, 0.04, 6.3], [6.98, -8.85, 0.04, 6.3]] as number[][]) b.add(bx(w, 0.14, d).translate(x, SW + 0.07, z), M("Skirt", "#7a5a3e"));
    { const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.1), M("RugW", "#ffffff", rugTex("W", "#a8343a", "#e0aa3c", "#2f5d9a"))); rug.rotation.x = -Math.PI / 2; rug.position.set(-3.6, SW + 0.02, -8.0); rug.receiveShadow = true; root.add(rug);
      const rug2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), M("RugT", "#ffffff", rugTex("T", "#2f6a5a", "#e8d070", "#cfe4da"))); rug2.rotation.x = -Math.PI / 2; rug2.position.set(4.5, SW + 0.02, -7.2); root.add(rug2); }
    // ceiling lamps (warm globes)
    for (const [x, z] of [[-3.5, -8.6], [3.5, -7.4]]) { b.add(cyl(0.01, 0.01, 0.5, 6).translate(x, SW + 3.0, z), darkM()); b.add(new THREE.SphereGeometry(0.22, 28, 18).translate(x, SW + 2.65, z), M("Globe", "#f2e2b8", undefined, { emissive: "#6a5430" })); }
  }
  // ---- waiting room furniture ----
  const eggG = new THREE.Group(), book = new THREE.Group(), penCup = new THREE.Group(), photoWall = new THREE.Group(), tvG = new THREE.Group(), magG = new THREE.Group(), fishes: THREE.Mesh[] = [];
  const tvMats = [0, 1, 2, 3].map((k) => new THREE.MeshBasicMaterial({ map: tvTex(k), color: new THREE.Color(0.85, 0.85, 0.85) }));
  let tvScreen: THREE.Mesh;
  const bookMat = new THREE.MeshBasicMaterial({ map: scribbleTex(0), color: new THREE.Color(0.9, 0.9, 0.9) });
  const deskCake = new THREE.Group();
  { const wood = M("Desk", "#8a5a34", rep(planksHD(), 0.6, 0.3)), top = M("DeskTop", "#5a3a24");
    b.add(bx(2.3, 0.7, 0.7).translate(DT.DESK[0], SW + 0.35, DT.DESK[2]), wood); b.add(bx(2.45, 0.06, 0.85).translate(DT.DESK[0], DT.DESK[1] - 0.02, DT.DESK[2]), top);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.28), unlit(sign("Recep", 512, 102, "#e8d070", "#3a2a1a", "RECEPTION", "900 62px Georgia, serif"), 0.9)); front.position.set(DT.DESK[0], SW + 0.42, DT.DESK[2] + 0.356); root.add(front);
    // Mae's chair (behind the desk)
    b.add(cyl(0.26, 0.26, 0.08, 24).translate(DT.MAE[0], SW + 0.5, DT.MAE[2]), M("ChairSeat", "#6a4a8a")); b.add(cyl(0.03, 0.03, 0.45, 10).translate(DT.MAE[0], SW + 0.25, DT.MAE[2]), chromeM());
    b.add(new RoundedBoxGeometry(0.5, 0.5, 0.08, 2, 0.03).translate(DT.MAE[0], SW + 0.95, DT.MAE[2] - 0.28), M("ChairSeat", "#6a4a8a"));
    // the egg timer on the desk (eggG rotates the dial band)
    eggG.position.set(DT.EGG[0], DT.EGG[1], DT.EGG[2]); root.add(eggG);
    { const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 28, 18).scale(1, 1.25, 1).translate(0, 0.09, 0), M("EggT", "#f2e6c8")); body.castShadow = true; eggG.add(body);
      const dial = new THREE.Mesh(cyl(0.068, 0.072, 0.04, 28).translate(0, 0.15, 0), M("EggDial", "#d8352e")); dial.name = "dial"; eggG.add(dial);
      for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(bx(0.006, 0.03, 0.006), M("EggTick", "#f2e6c8")); const a = (i / 12) * TAU; tk.position.set(Math.cos(a) * 0.071, 0.15, Math.sin(a) * 0.071); dial.add(tk); } }
    // the appointment book (open, scribble texture), the pen cup, a bell, a plant, a lamp
    book.position.set(DT.BOOK[0], DT.BOOK[1], DT.BOOK[2]); root.add(book);
    { const cover = new THREE.Mesh(bx(0.62, 0.03, 0.42), M("BookC", "#2f4a8a")); cover.position.y = 0.015; book.add(cover); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.38), bookMat); pg.rotation.x = -Math.PI / 2; pg.position.y = 0.034; pg.layers.set(NOINK); book.add(pg); }
    penCup.position.set(-0.95, DT.DESK[1] + 0.005, -9.72); root.add(penCup);
    { const cup = new THREE.Mesh(cyl(0.05, 0.045, 0.12, 24).translate(0, 0.06, 0), M("PenCup", "#2f6a5a")); penCup.add(cup); for (const [x, c] of [[-0.015, "#c8352e"], [0.02, "#f4c430"]] as [number, string][]) { const pn = new THREE.Mesh(cyl(0.007, 0.007, 0.18, 8).translate(x, 0.16, 0), M("Pen" + c, c)); penCup.add(pn); } }
    b.add(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, Math.PI / 2).translate(-3.05, DT.DESK[1], -10.0), M("Bell", "#d8a83a", undefined, { emissive: "#3a2a08" }));
    b.add(cyl(0.09, 0.07, 0.14, 24).translate(-1.05, DT.DESK[1] + 0.07, -10.05), M("PotD", "#a8643a")); { const r = rng(808); for (let k = 0; k < 7; k++) b.add(new THREE.ConeGeometry(0.04, 0.3, 6).rotateZ((r() - 0.5) * 0.8).translate(-1.05 + (r() - 0.5) * 0.08, DT.DESK[1] + 0.3, -10.05 + (r() - 0.5) * 0.08), M("Leaf", "#4a8a3e")); }
    // the cake Vance brings at the end (cakeDesk): on Mae's desk? no: on Vance's lap (prop); this desk cake is the earlier one from Dot
    deskCake.position.set(-2.1, DT.DESK[1], -10.1); root.add(deskCake);
    { const pl = new THREE.Mesh(cyl(0.2, 0.2, 0.015, 32), M("Plate", "#e8e2d6")); deskCake.add(pl); const ck = new THREE.Mesh(cyl(0.16, 0.16, 0.16, 36).translate(0, 0.09, 0), M("CakePink", "#ee9ab2")); ck.castShadow = true; deskCake.add(ck);
      const fr = new THREE.Mesh(cyl(0.165, 0.165, 0.025, 36).translate(0, 0.165, 0), M("Frost", "#f6dfe6")); deskCake.add(fr); for (let i = 0; i < 3; i++) { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 10), M("Cherry", "#d8283a")); ch.position.set(Math.cos(i * 2.1) * 0.08, 0.2, Math.sin(i * 2.1) * 0.08); deskCake.add(ch); } }
    // the photo wall behind Mae: 36 polaroid slots (wallN shows the first n)
    photoWall.position.set(-3.6, SW + 1.25, -11.98); root.add(photoWall);
    { const cork = new THREE.Mesh(bx(4.2, 1.55, 0.04).translate(0, 0.7, 0), M("Cork", "#c8955a")); photoWall.add(cork); const frame = M("CorkF", "#6a4a32"); for (const [x, y, w, h] of [[0, -0.07, 4.3, 0.08], [0, 1.47, 4.3, 0.08], [-2.13, 0.7, 0.08, 1.6], [2.13, 0.7, 0.08, 1.6]]) photoWall.add(new THREE.Mesh(bx(w, h, 0.06).translate(x, y, 0.01), frame));
      const hdr = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3), unlit(sign("Happy", 640, 80, "#c8352e", "#f4e6b8", "OUR HAPPY PATIENTS", "900 52px Georgia, serif"), 0.9)); hdr.position.set(0, 1.7, 0.02); photoWall.add(hdr);
      const r = rng(4242); for (let i = 0; i < 36; i++) { const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.31), new THREE.MeshLambertMaterial({ map: photoTex(i) })); const col = i % 12, row = Math.floor(i / 12);
        ph.position.set(-1.85 + col * 0.335 + (r() - 0.5) * 0.04, 1.15 - row * 0.42 + (r() - 0.5) * 0.04, 0.03); ph.rotation.z = (r() - 0.5) * 0.18; ph.layers.set(NOINK); photoWall.add(ph); ph.userData.slot = i; } }
    // the TV on the partition (faces -x into the waiting room) on a bracket
    tvG.position.set(DT.TV[0], DT.TV[1] + SW, DT.TV[2]); tvG.rotation.y = -Math.PI / 2; root.add(tvG);
    { const shell = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.66, 0.12, 2, 0.03), M("TVShell", "#2a2a30")); shell.position.z = 0.1; tvG.add(shell); tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.55), tvMats[0]); tvScreen.position.z = 0.165; tvScreen.layers.set(NOINK); tvG.add(tvScreen); }
    // waiting chairs under the front window (facing the room) + the bench along the west wall + side table + magazines
    const seat = M("WaitSeat", "#c8352e"), legs = chromeM();
    for (let k = 0; k < 4; k++) { const x = -5.7 + k * 1.05, z = -6.2; b.add(new RoundedBoxGeometry(0.5, 0.1, 0.5, 2, 0.03).translate(x, SW + 0.48, z), seat); b.add(new RoundedBoxGeometry(0.5, 0.5, 0.08, 2, 0.03).translate(x, SW + 0.78, z + 0.24), seat);
      for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) b.add(cyl(0.018, 0.018, 0.46, 8).translate(x + dx, SW + 0.23, z + dz), legs); }
    { const bw = M("BenchIn", "#5a3a24", rep(planksHD(), 0.5, 0.2)); b.add(bx(0.55, 0.1, 3.0).translate(-6.6, SW + 0.48, -8.6), bw); b.add(bx(0.1, 0.6, 3.0).translate(-6.88, SW + 0.85, -8.6), bw); for (const z of [-7.25, -9.95]) b.add(bx(0.5, 0.48, 0.08).translate(-6.6, SW + 0.24, z), bw);
      b.add(new RoundedBoxGeometry(0.5, 0.08, 2.9, 2, 0.03).translate(-6.6, SW + 0.56, -8.6), M("Cushion", "#e0aa3c")); }
    magG.position.set(-5.9, SW + 0.55, -10.6); root.add(magG);
    { b.add(cyl(0.3, 0.3, 0.04, 28).translate(-5.9, SW + 0.55, -10.6), M("SideT", "#8a5a34")); b.add(cyl(0.03, 0.03, 0.55, 10).translate(-5.9, SW + 0.27, -10.6), darkM());
      for (let i = 0; i < 3; i++) { const mg = new THREE.Mesh(bx(0.22, 0.012, 0.3), M("Mag" + i, ["#3aa3b8", "#e0aa3c", "#c0476a"][i])); mg.position.set((i - 1) * 0.06, 0.03 + i * 0.013, (i - 1) * 0.04); mg.rotation.y = i * 0.4; magG.add(mg); } }
    // fish tank (fishes swim), rubber plant, coat stand, wall clock, a framed picture, magazine rack
    { b.add(bx(1.2, 0.7, 0.45).translate(-6.4, SW + 0.35, -11.3), M("TankStand", "#5a3a24")); b.add(bx(1.1, 0.6, 0.4).translate(-6.4, SW + 1.0, -11.3), M("TankWater", "#5ab8c8", undefined, { emissive: "#14343a", transparent: true, opacity: 0.75 }));
      b.add(bx(1.14, 0.05, 0.44).translate(-6.4, SW + 1.32, -11.3), darkM()); b.add(bx(1.1, 0.08, 0.4).translate(-6.4, SW + 0.74, -11.3), M("Gravel", "#d8c088"));
      for (let i = 0; i < 4; i++) { const fi = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10).scale(1.6, 1, 0.5), M("Fish" + i, ["#f28a1e", "#f4c430", "#e8484a", "#5ad0f0"][i], undefined, { emissive: "#3a2008" })); root.add(fi); fishes.push(fi); }
      b.add(cyl(0.22, 0.18, 0.42, 24).translate(-6.4, SW + 0.21, -6.3), M("PotB", "#2f5d9a")); { const r = rng(77); for (let k = 0; k < 9; k++) b.add(new THREE.SphereGeometry(0.2, 12, 8).scale(1, 0.35, 0.6).rotateZ((r() - 0.5) * 1.2).translate(-6.4 + (r() - 0.5) * 0.4, SW + 0.8 + k * 0.14, -6.3 + (r() - 0.5) * 0.4), M("RubberLeaf", "#2f6a3a")); }
      b.add(cyl(0.025, 0.03, 1.8, 10).translate(-0.7, SW + 0.9, -11.6), M("CoatS", "#5a3a24")); for (let k = 0; k < 4; k++) b.add(cyl(0.012, 0.012, 0.3, 6).rotateZ(1.0).rotateY(k * 1.57).translate(-0.7, SW + 1.75, -11.6), M("CoatS", "#5a3a24"));
      b.add(new RoundedBoxGeometry(0.35, 0.7, 0.18, 2, 0.06).translate(-0.62, SW + 1.4, -11.52), M("Coat", "#c26a2c"));
      const clk = new THREE.Mesh(new THREE.CircleGeometry(0.24, 36), M("ClockF", "#f2ead6")); clk.position.set(-5.0, SW + 2.6, -11.97); root.add(clk); b.add(new THREE.TorusGeometry(0.25, 0.025, 8, 36).translate(-5.0, SW + 2.6, -11.96), darkM());
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), unlit(toothPoster(), 0.86)); pic.position.set(-6.97, SW + 1.9, -10.5); pic.rotation.y = Math.PI / 2; root.add(pic); }
  }
  // ---- treatment room ----
  const chair = new THREE.Group(), lamp = new THREE.Group(), hg = new THREE.Group(), hgSandT: THREE.Mesh[] = [], drawer = new THREE.Group(), keyG = new THREE.Group(), instCam = new THREE.Group();
  const ph1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), new THREE.MeshLambertMaterial({ map: ctex("dtPhA", 128, 152, (g) => { g.fillStyle = "#efe8d8"; g.fillRect(0, 0, 128, 152); g.fillStyle = "#f08a4a"; g.fillRect(10, 10, 108, 104); g.fillStyle = "#f6f0e2"; g.beginPath(); g.arc(64, 64, 30, 0, TAU); g.fill(); g.strokeStyle = "#2a2028"; g.lineWidth = 4; g.stroke(); g.fillStyle = "#d8352e"; g.fillRect(34, 30, 60, 10); g.fillStyle = "#3a1414"; g.beginPath(); g.ellipse(64, 78, 13, 16, 0, 0, TAU); g.fill(); g.fillStyle = "#2a2028"; g.beginPath(); g.arc(52, 58, 5, 0, TAU); g.arc(76, 58, 5, 0, TAU); g.fill(); }) }));
  const ph2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), new THREE.MeshLambertMaterial({ map: photoTex(0) }));
  const greyBar = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.36), new THREE.MeshBasicMaterial({ color: "#8a8a8a", transparent: true, opacity: 0 }));
  const prattPin = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.31), new THREE.MeshLambertMaterial({ map: photoTex(0) }));
  { // the dental chair: base column, seat, reclined back, headrest, foot rest, armrests (vinyl teal)
    chair.position.set(DT.CHAIR[0], SW, DT.CHAIR[2]); root.add(chair); const vin = M("Vinyl", "#3a9a92"), base = M("ChairBase", "#d8dcd8");
    const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; chair.add(me); return me; };
    add(cyl(0.42, 0.48, 0.08, 36).translate(0, 0.04, 0), base); add(cyl(0.14, 0.16, 0.48, 28).translate(0, 0.3, 0), base);
    add(new RoundedBoxGeometry(0.95, 0.16, 0.62, 3, 0.06).translate(0.05, 0.6, 0), vin);                                                         // seat
    { const A = V(-0.12, 0.68, 0), B = V(-0.5, 0.92, 0), d = B.clone().sub(A); const bk = add(new RoundedBoxGeometry(0.62, d.length() + 0.12, 0.14, 3, 0.06), vin); bk.position.copy(A.clone().add(B).multiplyScalar(0.5)); bk.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); bk.rotateY(Math.PI / 2); }   // back (reclined toward -x)
    add(new RoundedBoxGeometry(0.22, 0.12, 0.3, 3, 0.05).rotateZ(-0.5).translate(-0.6, 1.0, 0), vin);                       // headrest
    add(new RoundedBoxGeometry(0.6, 0.12, 0.5, 3, 0.05).rotateZ(-0.35).translate(0.65, 0.5, 0), vin);                                          // leg rest
    for (const s of [-1, 1]) { add(new RoundedBoxGeometry(0.6, 0.07, 0.1, 2, 0.03).translate(0.05, 0.84, s * 0.36), vin); add(bx(0.05, 0.22, 0.05).translate(0.25, 0.73, s * 0.36), base); }
    // the spittoon / water unit on the far side
    add(cyl(0.05, 0.05, 0.9, 16).translate(0.1, 0.45, -0.75), base); add(cyl(0.16, 0.1, 0.12, 28).translate(0.1, 0.95, -0.75), M("Spit", "#cfe4da"));
    // the lamp: a pole at the back, an arm, the round head (48 segments) with a warm face
    lamp.position.set(4.15, SW, -10.55); root.add(lamp); const lm = M("LampArm", "#e6e8e4");
    { const p1 = new THREE.Mesh(cyl(0.05, 0.06, 2.4, 20).translate(0, 1.2, 0), lm); lamp.add(p1);
      const A = V(0, 2.4, 0), H = V(-1.15, 2.32, 1.5), d = H.clone().sub(A); const arm = new THREE.Mesh(cyl(0.035, 0.035, d.length(), 16), lm); arm.position.copy(A.clone().add(H).multiplyScalar(0.5)); arm.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); lamp.add(arm);
      const head = new THREE.Group(); head.position.copy(H); lamp.add(head); const sh = new THREE.Mesh(cyl(0.24, 0.3, 0.12, 48).rotateX(0.35), lm); head.add(sh);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.24, 48).rotateX(Math.PI / 2 + 0.35).translate(0, -0.065, 0.02), M("LampFace", "#f6e8c0", undefined, { emissive: "#8a7440" })); face.name = "face"; head.add(face); }
    // the tool tray on its swing arm: hourglass, paste tube, mirrors, a cup
    const tray = M("Tray", "#c8cdd4"); b.add(new RoundedBoxGeometry(0.62, 0.03, 0.42, 2, 0.01).translate(DT.TRAY[0], DT.TRAY[1], DT.TRAY[2]), tray); b.add(cyl(0.025, 0.025, 0.9, 12).translate(DT.TRAY[0] - 0.2, SW + 0.45, DT.TRAY[2] - 0.12), tray);
    b.add(cyl(0.3, 0.3, 0.05, 28).translate(DT.TRAY[0] - 0.2, SW + 0.03, DT.TRAY[2] - 0.12), tray);
    for (let k = 0; k < 4; k++) b.add(bx(0.012, 0.01, 0.2).translate(DT.TRAY[0] + 0.05 + k * 0.05, DT.TRAY[1] + 0.02, DT.TRAY[2] + 0.05), M("Tool", "#9aa0aa"));
    b.add(cyl(0.035, 0.03, 0.08, 20).translate(DT.TRAY[0] - 0.18, DT.TRAY[1] + 0.055, DT.TRAY[2] + 0.1), M("Cup2", "#e8c06a"));
    b.add(new RoundedBoxGeometry(0.04, 0.03, 0.16, 2, 0.01).translate(DT.TRAY[0] + 0.22, DT.TRAY[1] + 0.03, DT.TRAY[2] - 0.1), M("Tube", "#e4efe8"));
    hg.position.set(DT.TRAY[0] - 0.16, DT.TRAY[1] + 0.015 + 0.11, DT.TRAY[2] - 0.08); root.add(hg);
    { const wd = M("HgWood", "#a8743e"); for (const y of [-0.105, 0.105]) { const pl = new THREE.Mesh(cyl(0.07, 0.07, 0.02, 28).translate(0, y, 0), wd); pl.castShadow = true; hg.add(pl); } for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; hg.add(new THREE.Mesh(cyl(0.008, 0.008, 0.2, 8).translate(Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06), wd)); }
      const gl = M("HgGlass", "#d8ecf0", undefined, { transparent: true, opacity: 0.55 }); hg.add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 28).rotateX(Math.PI).translate(0, 0.05, 0), gl)); hg.add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 28).translate(0, -0.05, 0), gl));
      const sand = M("Sand", "#e8c06a"); const st = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.075, 24).rotateX(Math.PI).translate(0, 0.04, 0), sand), sb = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.075, 24).translate(0, -0.06, 0), sand); hg.add(st, sb); hgSandT.push(st, sb); }
    // the sink + cabinet (with the locked drawer and the instant camera on top), corkboard + strip, diplomas, poster, window plant
    const cab = M("Cab", "#e0e6e0"), cabT = M("CabTop", "#8a6a4e");
    b.add(bx(3.2, 0.95, 0.6).translate(2.6, SW + 0.475, -11.65), cab); b.add(bx(3.3, 0.05, 0.66).translate(2.6, SW + 0.98, -11.65), cabT);
    for (const x of [1.45, 3.75]) { b.add(bx(0.8, 0.7, 0.02).translate(x, SW + 0.42, -11.34), M("CabDoor", "#d0d8d0")); b.add(bx(0.08, 0.02, 0.03).translate(x + (x < 2.6 ? 0.3 : -0.3), SW + 0.6, -11.32), chromeM()); }
    drawer.position.set(DT.DRAWER[0], SW + 0.78, -11.35); root.add(drawer);
    { const dr = new THREE.Mesh(bx(0.9, 0.26, 0.5).translate(0, 0, -0.25), M("Drawer", "#d0d8d0")); drawer.add(dr); const hd = new THREE.Mesh(bx(0.14, 0.03, 0.04).translate(-0.25, 0.04, 0.02), chromeM()); drawer.add(hd);
      const lk = new THREE.Mesh(cyl(0.035, 0.035, 0.02, 24).rotateX(Math.PI / 2).translate(0.12, 0.04, 0.012), M("Lock", "#d8a83a", undefined, { emissive: "#3a2a08" })); drawer.add(lk); }
    const drPh: THREE.Mesh[] = []; for (const [i, x] of [[0, -0.16], [1, 0.16]] as [number, number][]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.19), i ? ph2.material : ph1.material); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.135, -0.25); m.layers.set(NOINK); drawer.add(m); drPh.push(m); }
    drawer.userData.ph = drPh;
    keyG.position.set(DT.DRAWER[0] + 0.12, SW + 0.82, -11.32); root.add(keyG);
    { const km = M("Key", "#e0b040", undefined, { emissive: "#4a3410" }); keyG.add(new THREE.Mesh(cyl(0.006, 0.006, 0.08, 8).rotateX(Math.PI / 2).translate(0, 0, 0.04), km)); keyG.add(new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 24).translate(0, 0, 0.095), km)); keyG.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 24).translate(0.03, -0.05, 0.1), M("KeyString", "#c8352e"))); }
    instCam.position.set(DT.CAM[0], SW + 1.0, DT.CAM[2]); root.add(instCam);
    { const body = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.18, 0.2, 2, 0.03).translate(0, 0.09, 0), M("ICam", "#2e2c34")); body.castShadow = true; instCam.add(body); for (const [y, c] of [[0.1, "#d8352e"], [0.08, "#f4c430"], [0.06, "#3aa36a"]] as [number, string][]) instCam.add(new THREE.Mesh(bx(0.262, 0.016, 0.202).translate(0, y, 0), M("ICS" + c, c)));
      instCam.add(new THREE.Mesh(cyl(0.05, 0.05, 0.03, 28).rotateX(Math.PI / 2).translate(0, 0.1, 0.11), M("ICLens", "#1a1a22"))); }
    // the corkboard with the long pain strip; the two photos pin onto it
    const board = new THREE.Group(); board.position.set(DT.BOARD[0], DT.BOARD[1] + SW * 0, DT.BOARD[2]); root.add(board);
    { board.add(new THREE.Mesh(bx(3.3, 1.1, 0.04), M("Cork2", "#c8955a"))); const fr = M("CorkF", "#6a4a32"); for (const [x, y, w, h] of [[0, -0.57, 3.4, 0.07], [0, 0.57, 3.4, 0.07], [-1.67, 0, 0.07, 1.2], [1.67, 0, 0.07, 1.2]]) board.add(new THREE.Mesh(bx(w, h, 0.06).translate(x, y, 0.01), fr));
      const st = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.38), new THREE.MeshLambertMaterial({ map: stripTex() })); st.position.set(0, -0.15, 0.025); st.layers.set(NOINK); board.add(st);
      greyBar.position.set(0.05, -0.15, 0.03); greyBar.layers.set(NOINK); board.add(greyBar);
      for (const pp of [ph1, ph2]) { pp.layers.set(NOINK); board.add(pp); } ph1.position.set(-0.95, 0.22, 0.035); ph2.position.set(1.15, 0.22, 0.035);
      const pinM = M("Pin", "#d8352e"); for (const x of [-0.95, 1.15]) { const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 10), pinM); pin.position.set(x, 0.33, 0.05); pin.name = "pin" + x; board.add(pin); }
      const hdr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.2), unlit(sign("Visit", 600, 80, "#2f6a5a", "#f4e6b8", "ONE VISIT", "900 54px Georgia, serif"), 0.9)); hdr.position.set(0, 0.45, 0.025); board.add(hdr); }
    // the sink (corner), diplomas, poster, a radio, a window plant, the gloves box
    b.add(bx(0.9, 0.85, 0.55).translate(6.5, SW + 0.425, -6.6), cab); b.add(cyl(0.2, 0.16, 0.12, 28).translate(6.5, SW + 0.88, -6.6), M("SinkB", "#c8d8d4")); b.add(cyl(0.015, 0.015, 0.3, 8).rotateZ(0.5).translate(6.62, SW + 1.05, -6.6), chromeM());
    for (const [i, z] of [[0, -8.0], [1, -9.4]] as [number, number][]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), unlit(diploma(i), 0.86)); d.position.set(6.97, SW + 1.9, z); d.rotation.y = -Math.PI / 2; root.add(d); b.add(bx(0.03, 0.52, 0.68).translate(6.99, SW + 1.9, z), M("DipF", "#6a4a32")); }
    { const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.06), unlit(toothPoster(), 0.86)); ps.position.set(6.2, SW + 1.95, -11.98); root.add(ps); }
    b.add(new RoundedBoxGeometry(0.3, 0.18, 0.12, 2, 0.03).translate(1.3, SW + 1.07, -11.55), M("Radio", "#c8352e")); b.add(cyl(0.04, 0.04, 0.02, 20).rotateX(Math.PI / 2).translate(1.25, SW + 1.07, -11.48), M("Spk", "#2a2a30"));
    b.add(bx(0.3, 0.12, 0.16).translate(1.75, SW + 1.04, -11.55), M("Gloves", "#7ab8e8")); b.add(cyl(0.1, 0.08, 0.18, 24).translate(6.4, SW + 1.09, -11.6), M("Pot3", "#a8643a")); b.add(bx(1.6, 0.9, 0.5).translate(6.1, SW + 0.45, -11.7), cab); b.add(bx(1.7, 0.05, 0.56).translate(6.1, SW + 0.92, -11.7), cabT); { const r = rng(31); for (let k = 0; k < 6; k++) b.add(new THREE.ConeGeometry(0.035, 0.32, 6).rotateZ((r() - 0.5) * 0.9).translate(6.4, SW + 1.3, -11.6), M("Leaf", "#4a8a3e")); }
    { const sh = M("Shelf2", "#6a4a32"); b.add(bx(1.4, 0.04, 0.24).translate(5.9, SW + 1.75, -11.86), sh); b.add(bx(1.4, 0.04, 0.24).translate(5.9, SW + 2.2, -11.86), sh);
      const r = rng(71); for (let k = 0; k < 10; k++) { const x = 5.3 + (k % 5) * 0.28, y = SW + (k < 5 ? 1.77 : 2.22), h = 0.12 + r() * 0.1, col = ["#e8484a", "#5aa0d0", "#f4c430", "#3aa36a", "#c87ae8"][k % 5];
        b.add(cyl(0.05, 0.05, h, 24).translate(x, y + h / 2, -11.86), M("Jar" + col, col)); b.add(cyl(0.055, 0.055, 0.02, 24).translate(x, y + h + 0.01, -11.86), M("JarLid", "#e8e4dc")); }
      for (const [x, y, c] of [[0.6, 2.55, "#c8352e"], [6.9, 2.6, "#2f5d9a"]] as [number, number, string][]) { b.add(bx(0.5, 0.4, 0.03).translate(x, SW + y, -11.97), M("Frame" + c, "#6a4a32")); b.add(bx(0.42, 0.32, 0.01).translate(x, SW + y, -11.95), M("Pic" + c, c)); } }
    // a stool for Hal (rolling), behind the head end
    b.add(cyl(0.22, 0.22, 0.08, 28).translate(DT.HAL_CHAIR[0] - 0.75, SW + 0.55, DT.HAL_CHAIR[2] - 0.75), M("Stool", "#2f6a5a")); b.add(cyl(0.03, 0.03, 0.5, 10).translate(DT.HAL_CHAIR[0] - 0.75, SW + 0.27, DT.HAL_CHAIR[2] - 0.75), chromeM());
    // the reception wall pin for Pratt's own photo (prattPin), over the waiting-room photo wall's free corner
    prattPin.position.set(-3.6 + 1.85, SW + 1.25 + 0.31, -11.94); prattPin.layers.set(NOINK); root.add(prattPin);
  }
  // Mrs. Dot's tote bag beside the chair: a pink cake top shows in it until she lifts the cake out (bagCake)
  const bag = new THREE.Group(); bag.position.set(DT.BAG[0], DT.BAG[1], DT.BAG[2]); root.add(bag);
  { const bm = M("Tote", "#c86a8a"); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.38, 28, 1, true).scale(1.3, 1, 0.8).translate(0, 0.19, 0), M("Tote2", "#c86a8a", undefined, { side: THREE.DoubleSide })); body.castShadow = true; bag.add(body);
    bag.add(new THREE.Mesh(new THREE.CircleGeometry(0.21, 28).scale(1.3, 0.8, 1).rotateX(-Math.PI / 2).translate(0, 0.01, 0), bm));
    for (const s2 of [-1, 1]) bag.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 24, Math.PI).translate(s2 * 0.1, 0.38, 0), M("ToteH", "#8a3a5a")));
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 36).translate(0, 0.36, 0), M("CakePink", "#ee9ab2")); top.name = "cakeTop"; bag.add(top);
    const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.02, 36).translate(0, 0.4, 0), M("Frost", "#f6dfe6")); fr.name = "cakeTop2"; bag.add(fr); }
  // Hal's glazed door (hinged at x -1.45, opens inward)
  const hDoor = new THREE.Group(); hDoor.position.set(-1.45, SW, -5.6); root.add(hDoor);
  { const dm = M("HDoor", "#2f6a5a"); const d = new Batch(); d.add(bx(1.15, 0.18, 0.06).translate(0.575, 0.09, 0), dm); d.add(bx(1.15, 0.6, 0.06).translate(0.575, 0.9, 0), dm); d.add(bx(1.15, 0.16, 0.06).translate(0.575, 2.24, 0), dm); d.add(bx(0.12, 2.3, 0.06).translate(0.06, 1.15, 0), dm); d.add(bx(0.12, 2.3, 0.06).translate(1.09, 1.15, 0), dm); d.build(hDoor);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.9), M("HDoorGlass", "#bcd8d0", undefined, { emissive: "#14302a", transparent: true, opacity: 0.35, depthWrite: false })); glass.position.set(0.575, 1.66, 0); glass.layers.set(NOINK); hDoor.add(glass);
    const op = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), unlit(sign("Open", 256, 76, "#c8352e", "#f4e6b8", "OPEN", "900 50px Arial Black"), 0.9)); op.position.set(0.575, 1.4, 0.04); hDoor.add(op);
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10), M("Knob", "#d8a83a")); kn.position.set(1.0, 1.05, 0.06); hDoor.add(kn); }
  const bellG = new THREE.Group(); bellG.position.set(-0.4, SW + 2.38, -5.75); root.add(bellG);
  { const bm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI).translate(0, -0.06, 0), M("Bell", "#d8a83a", undefined, { emissive: "#3a2a08" })); bellG.add(bm); bellG.add(new THREE.Mesh(cyl(0.004, 0.004, 0.06, 4).translate(0, -0.03, 0), darkM())); }
  // the chalk A-board on the sidewalk (chalk 0..1)
  const aboard = new THREE.Group(); aboard.position.set(DT.ABOARD[0], SW, DT.ABOARD[2]); aboard.rotation.y = -0.2; root.add(aboard);
  const boardFace = new THREE.MeshBasicMaterial({ map: chalkTex(0), color: new THREE.Color(0.88, 0.88, 0.88) });
  { const wood = M("ABoard", "#a8743e"); const fr = new THREE.Mesh(bx(0.66, 0.9, 0.04).rotateX(0.18).translate(0, 0.52, 0.08), wood); fr.castShadow = true; aboard.add(fr); const bk2 = new THREE.Mesh(bx(0.66, 0.9, 0.04).rotateX(-0.18).translate(0, 0.52, -0.08), wood); bk2.castShadow = true; aboard.add(bk2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.74), boardFace); face.position.set(0, 0.53, 0.112); face.rotation.x = -0.18; face.layers.set(NOINK); aboard.add(face); }
  // ===================== VANCE'S DENTAL (south) =====================
  const navy = M("VanceWall", "#ffffff", rep(stoneHD("dtVance", ["#4a5a7a", "#465676", "#4e5e80", "#42526e"], "#2a3448"), 4, 2)), vTrim = M("VTrim", "#c8cdd4");
  const slats: THREE.Mesh[] = [];
  { const zf = 5.5, t = 0.2, H = 3.4;
    const panel = (x0: number, x1: number, y0: number, y1: number) => nc.add(bx(x1 - x0, y1 - y0, t).translate((x0 + x1) / 2, (y0 + y1) / 2, zf + t / 2), navy);
    panel(-7, -6.2, 0, H); panel(-1.8, 0.2, 0, H); panel(1.4, 1.8, 0, H); panel(6.2, 7, 0, H); panel(-6.2, -1.8, 0, 0.85); panel(1.8, 6.2, 0, 0.85); panel(-6.2, -1.8, 2.65, H); panel(1.8, 6.2, 2.65, H); panel(0.2, 1.4, 2.45, H);
    for (const [x0, x1] of [[-6.2, -1.8], [1.8, 6.2]] as [number, number][]) { const cx = (x0 + x1) / 2, w = x1 - x0; for (const y of [0.85, 2.65]) b.add(bx(w + 0.16, 0.08, 0.26).translate(cx, y, zf + 0.02), vTrim); for (const x of [x0, x1]) b.add(bx(0.08, 1.9, 0.26).translate(x, 1.75, zf + 0.02), vTrim); }
    b.add(bx(1.2, 2.45, 0.06).translate(0.8, 1.225, zf + 0.12), M("VDoor", "#c8cdd4")); b.add(bx(0.9, 1.4, 0.02).translate(0.8, 1.5, zf + 0.08), M("VDoorG", "#8aa8c0", undefined, { emissive: "#18243a" }));
    const up = M("VanceUp", "#ffffff", facadeHD("dtVanceUp", 14, 3.0, { wall: "#5a6a8a", shutter: "#2a3448", door: false })); nc.add(quad(V(7, H, zf), V(-7, H, zf), V(-7, H + 3.0, zf), V(7, H + 3.0, zf), 1, 1), up); nc.add(bx(14, 3.0, 6.5).translate(0, H + 1.5, zf + 3.27), navy);
    nc.add(bx(14.6, 0.3, 0.6).translate(0, H + 3.15, zf - 0.1), vTrim);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.62), unlit(sign("Vance", 1280, 128, "#1e2a48", "#5ad0f0", "VANCE DENTAL ⚡ FAST!", "900 76px Arial Black, Arial"), 0.92)); sg.position.set(0, 3.05, zf - 0.03); sg.rotation.y = Math.PI; root.add(sg);
    // interior: cold blue-grey walls, rows of chrome chairs, water cooler, poster, clock; the treatment room behind the blinds
    const vw = M("VInW", "#ffffff", rep(wallpaper("V", "#8a9cb0", "#728498", "rgba(40,60,90,0.14)"), 3, 1.2));
    nc.add(bx(14, 3.2, 0.1).translate(0, 1.6 + SW, 11.05), vw); nc.add(bx(0.1, 3.2, 5.5).translate(-7.05, 1.6 + SW, 8.25), vw); nc.add(bx(0.1, 3.2, 5.5).translate(7.05, 1.6 + SW, 8.25), vw); nc.add(bx(0.1, 3.2, 5.5).translate(0.0, 1.6 + SW, 8.4), vw);
    nc.add(bx(14, 0.02, 5.6).translate(0, SW + 0.005, 8.25), M("VFloor", "#ffffff", rep(lino("V", "#8a96a4", "#6a7684"), 8, 3))); nc.add(bx(14.2, 0.1, 5.8).translate(0, SW + 3.25, 8.25), M("VCeil", "#a8b0b8"));
    for (let row = 0; row < 2; row++) for (let k = 0; k < 5; k++) { const x = -6.0 + k * 0.85, z = 7.5 + row * 1.5; b.add(new RoundedBoxGeometry(0.5, 0.08, 0.48, 2, 0.02).translate(x, SW + 0.46, z), M("VSeat", "#2f6fd1")); b.add(new RoundedBoxGeometry(0.5, 0.5, 0.06, 2, 0.02).translate(x, SW + 0.75, z + 0.24), M("VSeat", "#2f6fd1"));
      for (const dx of [-0.2, 0.2]) b.add(cyl(0.015, 0.015, 0.46, 8).translate(x + dx, SW + 0.23, z), chromeM()); }
    b.add(cyl(0.16, 0.16, 0.9, 24).translate(-1.0, SW + 0.45, 10.4), M("Cooler", "#d0d8e0")); b.add(cyl(0.13, 0.13, 0.4, 24).translate(-1.0, SW + 1.1, 10.4), M("CoolerW", "#7ab8e8", undefined, { transparent: true, opacity: 0.8 }));
    { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), unlit(sign("Drill", 400, 520, "#1e2a48", "#f4c430", "IN & OUT", "900 70px Arial Black", "5 MIN!", "#5ad0f0"), 0.86)); p.position.set(-4.0, SW + 1.9, 10.98); p.rotation.y = Math.PI; root.add(p); }
    const vclk = new THREE.Mesh(new THREE.CircleGeometry(0.24, 36), M("ClockF", "#f2ead6")); vclk.position.set(-2.2, SW + 2.6, 10.97); vclk.rotation.y = Math.PI; root.add(vclk);
    b.add(cyl(0.18, 0.15, 0.35, 24).translate(-6.5, SW + 0.17, 10.5), M("VPot", "#6a7684")); b.add(new THREE.ConeGeometry(0.08, 0.6, 5).rotateZ(0.6).translate(-6.4, SW + 0.6, 10.5), M("SadLeaf", "#8a8a4a"));
    // treatment side: a chair and a drill stand
    b.add(new RoundedBoxGeometry(1.0, 0.16, 0.6, 3, 0.05).translate(4.2, SW + 0.62, 8.8), M("VVinyl", "#2f4a8a")); b.add(cyl(0.14, 0.16, 0.5, 24).translate(4.2, SW + 0.3, 8.8), chromeM()); b.add(cyl(0.03, 0.03, 1.4, 12).translate(3.0, SW + 0.7, 9.5), chromeM());
    // venetian blinds in the treatment window (slats tilt: blinds 0 open .. 1 shut; blindPart opens a finger gap)
    for (let k = 0; k < 16; k++) { const s = new THREE.Mesh(bx(4.3, 0.012, 0.1), M("Slat", "#d8d4c8")); s.position.set(DT.BLINDS[0], SW + 0.85 + 0.11 * k + 0.1, 5.42); root.add(s); slats.push(s); }
  }
  // ===================== THE REST OF THE STREET =====================
  // Sal's barber (north x -15..-7) with the striped pole; the bakery (north x 7..15)
  const poleMat = new THREE.MeshLambertMaterial({ map: poleTex() });
  { const fac = M("BarberFac", "#ffffff", facadeHD("dtBarber", 8, 5.0, { wall: "#e8d8c0", shutter: "#c8352e", door: true })); nc.add(quad(V(-15, 0, -5.5), V(-7.01, 0, -5.5), V(-7.01, 5.0, -5.5), V(-15, 5.0, -5.5), 1, 1), fac); nc.add(bx(8, 5, 6).translate(-11, 2.5, -8.51), M("SideB", "#d8c8b0"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), unlit(sign("Barber", 680, 100, "#f4e6b8", "#c8352e", "SAL'S BARBER", "900 64px Georgia, serif"), 0.9)); sg.position.set(-11, 3.2, -5.47); root.add(sg);
    const pole = new THREE.Mesh(cyl(0.12, 0.12, 0.9, 32), poleMat); pole.position.set(-7.6, 1.9, -5.32); pole.name = "pole"; root.add(pole); for (const y of [1.42, 2.38]) b.add(new THREE.SphereGeometry(0.15, 24, 12).translate(-7.6, y, -5.32), M("PoleCap", "#c8cdd4"));
    const awn = new THREE.Mesh(quad(V(-14.6, 2.9, -5.45), V(-7.4, 2.9, -5.45), V(-7.4, 2.5, -4.3), V(-14.6, 2.5, -4.3), 1, 1), M("BarberAwn", "#ffffff", awningTex("#c8352e", "#ece6da"), { side: THREE.DoubleSide })); awn.castShadow = true; root.add(awn); }
  { const fac = M("BakeFac", "#ffffff", facadeHD("dtBake", 8, 4.6, { wall: "#f2dcc0", shutter: "#8a5a34", door: true })); nc.add(quad(V(7.01, 0, -5.5), V(15, 0, -5.5), V(15, 4.6, -5.5), V(7.01, 4.6, -5.5), 1, 1), fac); nc.add(bx(8, 4.6, 6).translate(11, 2.3, -8.51), M("SideK", "#e2ccae"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.5), unlit(sign("Bake", 600, 100, "#8a5a34", "#f4e6b8", "BAKERY", "900 70px Georgia, serif"), 0.9)); sg.position.set(11, 3.25, -5.47); root.add(sg);
    const awn = new THREE.Mesh(quad(V(7.4, 2.9, -5.45), V(14.6, 2.9, -5.45), V(14.6, 2.5, -4.3), V(7.4, 2.5, -4.3), 1, 1), M("BakeAwn", "#ffffff", awningTex("#e8b04a", "#f2e6c8"), { side: THREE.DoubleSide })); awn.castShadow = true; root.add(awn);
    for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.12, 16, 10).scale(1.6, 0.8, 1).translate(8.6 + k * 0.55, 1.2, -5.4), M("Bread", "#c88a4a")); }
  // the diner (south x -16..-7) and LUCKY LANES (south x 7..18): sign, pin + ball on the roof
  { const fac = M("DinerFac", "#ffffff", facadeHD("dtDiner", 9, 4.4, { wall: "#e8c8a0", shutter: "#2f6a5a", door: true })); nc.add(quad(V(-7.01, 0, 5.5), V(-16, 0, 5.5), V(-16, 4.4, 5.5), V(-7.01, 4.4, 5.5), 1, 1), fac); nc.add(bx(9, 4.4, 6).translate(-11.5, 2.2, 8.51), M("SideD", "#d8b890"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.55), unlit(sign("Diner", 680, 110, "#c8352e", "#f4e6b8", "MOM'S DINER", "900 70px Georgia, serif"), 0.9)); sg.position.set(-11.5, 3.3, 5.47); sg.rotation.y = Math.PI; root.add(sg); }
  { const fac = M("BowlFac", "#ffffff", facadeHD("dtBowl", 11, 5.0, { wall: "#d8a070", shutter: "#2a3448", door: true })); nc.add(quad(V(18, 0, 5.5), V(7.01, 0, 5.5), V(7.01, 5.0, 5.5), V(18, 5.0, 5.5), 1, 1), fac); nc.add(bx(11, 5, 8).translate(12.5, 2.5, 9.51), M("SideL", "#c89060"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.8), unlit(sign("Lanes", 1000, 160, "#2a3448", "#e8762a", "LUCKY LANES", "900 110px Arial Black, Arial"), 0.92)); sg.position.set(12.5, 4.1, 5.47); sg.rotation.y = Math.PI; root.add(sg);
    const pinPts: THREE.Vector2[] = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pinPts.push(new THREE.Vector2(0.05 + 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (u < 0.55 ? 1 : 0.55 + 0.45 * Math.cos((u - 0.55) * 5)) + (u > 0.8 ? 0.12 * Math.sin((u - 0.8) * 15) : 0), u * 2.2)); }
    const pin = new THREE.Mesh(new THREE.LatheGeometry(pinPts, 32), M("BowlPin", "#ece6da")); pin.position.set(15.6, 5.0, 7.0); pin.castShadow = true; root.add(pin); b.add(cyl(0.3, 0.3, 0.06, 32).translate(15.6, 5.78, 7.0), M("PinStripe", "#c8352e"));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.62, 36, 24), M("BowlBall", "#2f4a8a")); ball.position.set(14.2, 5.62, 7.0); ball.castShadow = true; root.add(ball);
    for (const [x, y] of [[-0.2, 0.25], [0.05, 0.32], [-0.05, 0.08]]) b.add(new THREE.SphereGeometry(0.07, 16, 10).translate(14.2 + x, 5.62 + y, 6.42), darkM()); }
  // houses beyond (north and south)
  const roofM = M("Roof", "#ffffff", roofHD("#8a4a3a"));
  const cream = ["#efe3c8", "#d8c0a0", "#e6dcc8", "#c8d8c0", "#e8d4b8", "#d0c8d8"], shut = ["#3f7a5a", "#4a6aa0", "#7a4a6a", "#3f7a5a", "#8a5a34", "#5a8aa0"];
  const house = (x0: number, x1: number, zf: number, face: 1 | -1, h: number, i: number) => { const w = x1 - x0, cx = (x0 + x1) / 2, fac = M("Fac" + i, "#ffffff", facadeHD("dtFac" + i, w, h, { wall: cream[i % 6], shutter: shut[i % 6], door: true }));
    if (face > 0) nc.add(quad(V(x0, 0, zf), V(x1, 0, zf), V(x1, h, zf), V(x0, h, zf), 1, 1), fac); else nc.add(quad(V(x1, 0, zf), V(x0, 0, zf), V(x0, h, zf), V(x1, h, zf), 1, 1), fac);
    nc.add(bx(w, h, 7).translate(cx, h / 2, zf - face * 3.51), M("HSide" + (i % 3), ["#d8ccb4", "#c8b8a0", "#d0c4b0"][i % 3]));
    const rh = 2.0, z0 = zf + face * 0.3, z1 = zf - face * 7.3, zm = (z0 + z1) / 2; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([x0 - 0.3, h, z0, x1 + 0.3, h, z0, x1 + 0.3, h + rh, zm, x0 - 0.3, h, z0, x1 + 0.3, h + rh, zm, x0 - 0.3, h + rh, zm, x1 + 0.3, h, z1, x0 - 0.3, h, z1, x0 - 0.3, h + rh, zm, x1 + 0.3, h, z1, x0 - 0.3, h + rh, zm, x1 + 0.3, h + rh, zm], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 3, 0, 3, 1, 0, 0, 3, 1, 0, 1, 0, 0, 3, 0, 3, 1, 0, 0, 3, 1, 0, 1], 2)); g.computeVertexNormals(); if (face < 0) g.scale(1, 1, 1); nc.add(g, roofM);
    b.add(bx(0.5, 1.0, 0.5).translate(x0 + w * 0.7, h + rh - 0.2, zm), M("Chimney", "#a8846a")); };
  [[-40, -32, 4.6], [-32, -24, 5.2], [-24, -15, 4.4], [15, 23, 5.0], [23, 31, 4.6], [31, 40, 5.2]].forEach(([a, c, h], i) => house(a, c, -5.5, 1, h, i));
  [[-40, -31, 4.8], [-31, -24, 4.4], [-24, -16, 5.0], [18, 26, 4.6], [26, 34, 5.0], [34, 42, 4.4]].forEach(([a, c, h], i) => house(a, c, 5.5, -1, h, i + 6));
  // trees (spring blossoms), lamp posts, benches, hydrant, mailbox, newspaper box, bins, planters, bicycle
  const barkM = lam("byBarkM", () => ({ map: treeTex() }));
  const leafM = swayMaterial(lam("dtLeafMS", () => ({ color: "#6aa64e", vertexColors: true }) as THREE.MeshLambertMaterialParameters)), coreM = swayMaterial(lam("dtCore", () => ({ color: "#3e7034", emissive: "#14300e" })));
  const treeAt: V3[] = [[-9.0, SW, -4.4], [8.6, SW, -4.4], [-20, SW, -4.4], [19.5, SW, -4.4], [-8.8, SW, 4.5], [7.6, SW, 4.5], [-21, SW, 4.5], [21, SW, 4.5], [-30, SW, -4.4], [30, SW, 4.5]];
  treeAt.forEach((p, i) => { leafyTree(bc, root, p, 6.6, 80 + i, leafM, coreM, barkM, 14, leafCardMat("vbLeafCardM")); b.add(bx(1.1, 0.04, 1.1).translate(p[0], SW + 0.01, p[2]), M("Pit", "#5a4a3a")); });
  const blossoms: THREE.Mesh[] = []; const blossomM = M("Blossom", "#f2a8c4", undefined, { emissive: "#3a1a26" });
  treeAt.forEach((p, i) => { const r = rng(600 + i); for (let k = 0; k < 18; k++) { const th = r() * TAU, d = 6.6 * 0.28 * (0.5 + r() * 0.6); const me = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + r() * 0.35, 1), blossomM); me.position.set(p[0] + Math.cos(th) * d, p[1] + 6.6 * (0.55 + r() * 0.35), p[2] + Math.sin(th) * d); me.userData.k0 = r() * 0.6; me.visible = false; root.add(me); blossoms.push(me); } });
  const petals: THREE.Mesh[] = []; { const pm = new THREE.MeshBasicMaterial({ color: "#f6b8cc", side: THREE.DoubleSide }); const r = rng(909); for (let i = 0; i < 70; i++) { const me = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), pm); me.userData = { x: -14 + r() * 28, z: -5 + r() * 10, y: 0.5 + r() * 5, s: r() }; me.visible = false; root.add(me); petals.push(me); } }
  for (const x of [-16, -6.9, 6.9, 17]) lampPost(b, x, -3.45); for (const x of [-15, -7.6, 7.6, 16]) lampPost(b, x, 3.45);
  bench(b, 4.0, SW, -3.75, 0, "#8a5a34"); bench(b, -12.2, SW, 3.75, 0, "#2f6a5a"); bench(b, 10.5, SW, 3.75, 0, "#8a5a34");
  hydrant(b, -5.4, -3.5); hydrant(b, 6.4, 3.5);
  { const mb = M("Mailbox", "#2f4a8a"); b.add(new RoundedBoxGeometry(0.5, 0.9, 0.45, 3, 0.12).translate(-6.6, SW + 0.75, -3.55), mb); b.add(cyl(0.225, 0.225, 0.5, 28).rotateZ(Math.PI / 2).translate(-6.6, SW + 1.2, -3.55), mb); for (const dx of [-0.2, 0.2]) b.add(bx(0.05, 0.3, 0.05).translate(-6.6 + dx, SW + 0.15, -3.55), mb);
    b.add(bx(0.5, 0.9, 0.4).translate(1.6, SW + 0.45, 3.6), M("NewsBox", "#c8352e")); b.add(bx(0.42, 0.3, 0.02).translate(1.6, SW + 0.75, 3.39), M("NewsWin", "#d8e0e4")); }
  for (const [x, z, i] of [[-4.6, -4.9, 0], [5.9, -4.9, 1], [-6.4, 4.9, 2], [6.6, 4.9, 3], [-14, -4.9, 4], [13.6, 4.9, 5]] as [number, number, number][]) planter(b, x, z, i);
  for (const [x, z] of [[-8.2, -3.5], [7.8, 3.5]] as [number, number][]) { b.add(cyl(0.28, 0.24, 0.85, 24).translate(x, SW + 0.42, z), M("Bin", "#3f6a5a")); b.add(cyl(0.3, 0.3, 0.05, 24).translate(x, SW + 0.86, z), darkM()); }
  bicycle(root, -13.2, -3.7, 0.1);
  // parked cars + Pratt's red truck cab (north kerb x 9..16)
  for (const [x, col, z] of [[-24, "#2a5a8a", 2.0], [24, "#e0b84a", -2.0], [-34, "#8a8a92", -2.0]] as [number, string, number][]) { const s = sedan(root, { style: "modern", body: col }); s.g.rotation.y = z > 0 ? -Math.PI / 2 : Math.PI / 2; s.g.position.set(x, 0, z); }
  const truck = new THREE.Group(); truck.position.set(12.5, 0, -1.95); root.add(truck);
  { const red = M("TruckR", "#c8352e"), chr = chromeM(), ty = M("Tyre", "#26242a"), gl = M("TGlass", "#a8c0d0", undefined, { emissive: "#18242c" });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; truck.add(me); };
    add(new RoundedBoxGeometry(2.6, 1.6, 2.3, 3, 0.15).translate(1.6, 1.7, 0), red); add(new RoundedBoxGeometry(2.0, 1.3, 2.3, 3, 0.15).translate(-0.6, 1.95, 0), red); add(new RoundedBoxGeometry(2.0, 0.5, 2.3, 3, 0.1).translate(-0.6, 3.0, 0), red);
    add(bx(0.06, 0.9, 2.0).translate(0.42, 2.2, 0), gl); add(bx(1.4, 0.7, 0.04).translate(-0.6, 2.25, -1.16), gl); add(bx(1.4, 0.7, 0.04).translate(-0.6, 2.25, 1.16), gl);
    add(bx(0.1, 1.0, 1.7).translate(2.92, 1.6, 0), chr); for (let k = 0; k < 6; k++) add(bx(0.12, 0.05, 1.6).translate(2.95, 1.2 + k * 0.16, 0), M("Grille", "#5a5a62"));
    for (const s of [-1, 1]) { add(cyl(0.09, 0.09, 2.6, 20).translate(-1.75, 2.6, s * 0.95), chr); add(cyl(0.13, 0.13, 0.06, 24).rotateZ(Math.PI / 2).translate(2.95, 1.2, s * 0.85), M("THead", "#f6e8c0", undefined, { emissive: "#6a5a3a" })); }
    add(bx(5.2, 0.35, 1.9).translate(0.3, 0.75, 0), M("Chassis", "#2a2a30")); add(bx(0.4, 0.3, 2.4).translate(3.0, 0.7, 0), chr);
    for (const [x, s] of [[1.9, -1], [1.9, 1], [-1.4, -1], [-1.4, 1], [-2.5, -1], [-2.5, 1]] as [number, number][]) { add(cyl(0.55, 0.55, 0.36, 32).rotateX(Math.PI / 2).translate(x, 0.55, s * 1.0), ty); add(cyl(0.28, 0.28, 0.38, 24).rotateX(Math.PI / 2).translate(x, 0.55, s * 1.0), chr); }
    const pt = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), unlit(sign("Pratt", 512, 112, "#c8352e", "#f4e6b8", "PRATT HAULING", "900 60px Arial Black"), 0.9)); pt.position.set(1.6, 1.9, 1.16); truck.add(pt); }
  // ===================== THE LAB (x 76..84) =====================
  const tubRipple: THREE.Mesh[] = [], thermMat = new THREE.MeshBasicMaterial({ map: thermTex(14), color: new THREE.Color(0.9, 0.9, 0.9) });
  let cardB: THREE.Mesh;
  { const L = DT.LAB[0], tile = M("LabTile", "#ffffff", rep(lino("Lab", "#8a9892", "#6e7c76"), 8, 7)), lw = M("LabWall", "#ffffff", rep(wallpaper("Lab", "#7e968c", "#6c8478", "rgba(80,110,100,0.12)"), 4, 1.5));
    nc.add(bx(8, 0.02, 7).translate(L, 0.005, -0.5), tile); nc.add(bx(8, 3.0, 0.1).translate(L, 1.5, -4.05), lw); nc.add(bx(0.1, 3.0, 7).translate(L - 4.05, 1.5, -0.5), lw); nc.add(bx(0.1, 3.0, 7).translate(L + 4.05, 1.5, -0.5), lw); nc.add(bx(8.2, 0.1, 7).translate(L, 3.05, -0.5), M("LabCeil", "#b8c0bc"));
    b.add(bx(1.4, 0.06, 0.3).translate(L, 2.96, -1.0), M("Fluor", "#f2ecd0", undefined, { emissive: "#6a6448" }));
    const tbl = M("LabTable", "#e0e4e0"), leg = chromeM(); b.add(bx(3.4, 0.06, 1.2).translate(L, 0.85, -1.05), tbl); for (const [dx, dz] of [[-1.6, -0.5], [1.6, -0.5], [-1.6, 0.5], [1.6, 0.5]]) b.add(cyl(0.025, 0.025, 0.85, 10).translate(L + dx, 0.42, -1.05 + dz), leg);
    for (const [i, p] of [[0, DT.TUB_A], [1, DT.TUB_B]] as [number, V3][]) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.3, 32, 1, true).translate(p[0], p[1] + 0.03 + 0.15, p[2]), M("Tub", "#e8e4dc", undefined, { side: THREE.DoubleSide })); tb.castShadow = true; root.add(tb);
      b.add(cyl(0.22, 0.22, 0.01, 32).translate(p[0], p[1] + 0.035, p[2]), M("TubB", "#d8d4cc")); const w = new THREE.Mesh(new THREE.CircleGeometry(0.245, 32).rotateX(-Math.PI / 2).translate(p[0], p[1] + 0.27, p[2]), M("Water", "#5ab0d8", undefined, { emissive: "#10304a" })); root.add(w); tubRipple.push(w);
      for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(0.06, 0.05, 0.06).rotateY(k).translate(p[0] + (k - 2) * 0.07, p[1] + 0.29, p[2] + ((k * 37) % 5 - 2) * 0.04), M("Ice", "#d8ecf4", undefined, { transparent: true, opacity: 0.8 }));
      const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), unlit(labelTex(i ? "90 s" : "60 s", i ? "#f4c430" : "#7ad0f0", "#1a2a3a"), 0.9)); lb.position.set(p[0], p[1] + 0.17, p[2] + 0.255); root.add(lb); }
    // the thermometer stick in tub B + its readout card on a stand
    b.add(cyl(0.012, 0.012, 0.55, 10).rotateZ(0.2).translate(DT.TUB_B[0] + 0.12, DT.TUB_B[1] + 0.45, DT.TUB_B[2] - 0.1), M("ThermStick", "#e8e4dc")); b.add(cyl(0.006, 0.006, 0.3, 8).rotateZ(0.2).translate(DT.TUB_B[0] + 0.105, DT.TUB_B[1] + 0.38, DT.TUB_B[2] - 0.085), M("ThermRed", "#d8352e"));
    const tc = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.35), thermMat); tc.position.set(DT.TUB_B[0] - 0.5, DT.TUB_B[1] + 0.62, DT.TUB_B[2] - 0.15); tc.layers.set(NOINK); root.add(tc); b.add(bx(0.62, 0.41, 0.03).translate(DT.TUB_B[0] - 0.5, DT.TUB_B[1] + 0.62, DT.TUB_B[2] - 0.17), darkM()); b.add(bx(0.04, 0.3, 0.04).translate(DT.TUB_B[0] + 0.7, DT.TUB_B[1] + 0.12, DT.TUB_B[2] - 0.18), darkM());
    cardB = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), unlit(labelTex("B ✓", "#f4c430", "#1a2a3a"), 0.9)); cardB.position.set(DT.TUB_B[0] - 0.05, DT.TUB_B[1] + 0.6, DT.TUB_B[2] + 0.15); root.add(cardB);
    // shelves of beakers, the wall chart, a window with blinds, a clock, a stool, a plant
    const sh = M("Shelf", "#8a6a4e"); for (const y of [1.3, 1.8, 2.3]) b.add(bx(2.6, 0.04, 0.32).translate(L + 2.4, y, -3.85), sh);
    { const r = rng(123); for (let k = 0; k < 18; k++) { const x = L + 1.25 + (k % 6) * 0.42, y = 1.32 + Math.floor(k / 6) * 0.5, h = 0.14 + r() * 0.16, col = ["#5ad0a0", "#f4c430", "#e8484a", "#5aa0f0", "#c87ae8"][k % 5];
      b.add(cyl(0.06, 0.07, h, 24).translate(x, y + h / 2, -3.85), M("BeakerG", "#d8e8ec", undefined, { transparent: true, opacity: 0.6 })); b.add(cyl(0.055, 0.065, h * 0.6, 24).translate(x, y + h * 0.3, -3.85), M("Liq" + col, col, undefined, { emissive: "#101010" })); } }
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), unlit(chartTex(), 0.86)); ch.position.set(L - 1.6, 1.9, -3.98); root.add(ch);
    b.add(bx(1.4, 1.2, 0.04).translate(L + 0.3, 1.9, -3.99), M("LabWin", "#a8c8e0", undefined, { emissive: "#24384a" })); for (let k = 0; k < 10; k++) b.add(bx(1.4, 0.015, 0.06).translate(L + 0.3, 1.35 + k * 0.12, -3.95), M("Slat", "#d8d4c8"));
    const lc = new THREE.Mesh(new THREE.CircleGeometry(0.22, 36), M("ClockF", "#f2ead6")); lc.position.set(L - 3.2, 2.4, -3.98); root.add(lc); b.add(new THREE.TorusGeometry(0.23, 0.02, 8, 36).translate(L - 3.2, 2.4, -3.97), darkM());
    b.add(cyl(0.2, 0.2, 0.05, 28).translate(DT.TUB_B[0] + 1.25, 0.62, 0.35), M("Stool2", "#2f6fd1")); b.add(cyl(0.025, 0.025, 0.6, 10).translate(DT.TUB_B[0] + 1.25, 0.3, 0.35), chromeM());
    b.add(cyl(0.2, 0.16, 0.36, 24).translate(L - 3.4, 0.18, -3.4), M("LPot", "#a8643a")); { const r = rng(5); for (let k = 0; k < 8; k++) b.add(new THREE.SphereGeometry(0.18, 12, 8).scale(1, 0.3, 0.55).rotateZ((r() - 0.5) * 1.2).translate(L - 3.4 + (r() - 0.5) * 0.3, 0.55 + k * 0.1, -3.4), M("RubberLeaf", "#2f6a3a")); }
    b.add(new RoundedBoxGeometry(0.4, 0.06, 0.3, 2, 0.02).translate(L - 1.2, 0.9, -1.2), M("Clip", "#8a6a4e")); b.add(cyl(0.1, 0.1, 0.03, 24).rotateX(Math.PI / 2).translate(L - 0.7, 0.95, -1.4), M("Timer", "#c9ced6"));
  }
  // warm room lamps (no shadows): the fill inside the offices and the lab comes from them, not from the blue sky
  for (const [x, y, z, i, d] of [[-3.5, 2.75, -8.4, 1.7, 7.5], [3.2, 2.75, -7.6, 1.6, 7], [3.8, 2.75, -10.6, 1.3, 6.5], [-3.5, 2.75, 8.2, 1.4, 7.5], [3.5, 2.75, 8.2, 1.0, 6.5], [80, 2.7, -0.8, 1.2, 8]] as number[][]) {
    const pl = new THREE.PointLight("#ffd2a0", i, d, 2); pl.position.set(x, y, z); root.add(pl); }
  b.build(root); bc.build(root);
  // REAL mode (real.ts) turns every opaque mesh into a shadow caster unless userData.noCast: the shells of the offices,
  // the lab and the big street buildings must let the sun through, or the interiors are lit by the blue sky fill alone
  { const ncG = new THREE.Group(); root.add(ncG); nc.build(ncG, false); ncG.traverse((o) => { o.userData.noCast = true; }); }

  const marks: Record<string, V3> = { halChair: DT.HAL_CHAIR, mae: DT.MAE, vanceWin: DT.VWIN };
  const cams: SetDef["cams"] = {
    chair: { pos: [2.4, 1.55, -6.3], look: [2.6, 1.3, -9.6], fov: 50 },
    street: { pos: [0, 1.6, 2.0], look: [0, 1.5, -5.5], fov: 56 },
    vance: { pos: [-4.0, 1.7, 0.5], look: [-4.0, 1.6, 6.3], fov: 48 },
    desk: { pos: [-2.0, 1.55, -7.3], look: [-2.1, 1.3, -10.2], fov: 50 },
    waiting: { pos: [-1.0, 1.7, -6.3], look: [-5.6, 1.1, -9.0], fov: 56 },
    board: { pos: [2.2, 1.75, -8.6], look: [2.2, 1.75, -11.9], fov: 52 },
    lab: { pos: [80.2, 1.45, 1.8], look: [80.3, 1.0, -1.2], fov: 50 },
  };
  let lastChalk = -1, lastBook = -1, lastTherm = -1, lastTv = -1;
  return {
    name: "dentown", root, marks, cams, title: [chair],
    pose: (t, c) => {
      hDoor.rotation.y = 1.4 * sm(c.hDoor ?? 0); bellG.rotation.z = (c.bell ?? 0) * 0.5 * Math.sin(t * 22) * Math.exp(-0) ;
      // hourglass: hg turns (0.5 = flipped), sand top share hgK
      hg.rotation.z = Math.PI * 2 * (c.hg ?? 0); { const k = cl(c.hgK ?? 0.2), flipped = Math.round(((c.hg ?? 0) * 2) % 2) === 1;
        const top = flipped ? hgSandT[1] : hgSandT[0], bot = flipped ? hgSandT[0] : hgSandT[1]; top.scale.set(Math.sqrt(Math.max(0.02, k)), Math.max(0.02, k), Math.sqrt(Math.max(0.02, k))); bot.scale.set(Math.sqrt(Math.max(0.02, 1 - k)), Math.max(0.02, 1 - k), Math.sqrt(Math.max(0.02, 1 - k))); }
      drawer.position.z = -11.35 + 0.35 * sm(c.drawer ?? 0); keyG.visible = (c.keyIn ?? 0) > 0; keyG.rotation.z = -1.4 * sm(c.keyTurn ?? 0); keyG.position.z = -11.32 + 0.35 * sm(c.drawer ?? 0);
      instCam.visible = (c.camOn ?? 1) > 0; instCam.position.z = DT.CAM[2] + 0.0 * (c.camOut ?? 0);
      ph1.visible = (c.ph1 ?? 0) >= 2; ph2.visible = (c.ph2 ?? 0) >= 2; (drawer.userData.ph as THREE.Mesh[]).forEach((m, i) => { m.visible = Math.round((i ? c.ph2 : c.ph1) ?? 0) === 1; });
      { const on = (c.bagCake ?? 1) > 0; (bag.getObjectByName("cakeTop") as THREE.Mesh).visible = on; (bag.getObjectByName("cakeTop2") as THREE.Mesh).visible = on; bag.visible = (c.bagOn ?? 1) > 0; } (greyBar.material as THREE.MeshBasicMaterial).opacity = 0.62 * sm(c.grey ?? 0);
      for (const [pp, x] of [[ph1, -0.95], [ph2, 1.15]] as [THREE.Mesh, number][]) { const pin = pp.parent?.getObjectByName("pin" + x); if (pin) pin.visible = pp.visible; }
      { const tv = c.tv ?? 0, k = tv < 0.5 ? 0 : 1 + (Math.floor(t * 5) % 3); if (k !== lastTv) { tvScreen.material = tvMats[k]; lastTv = k; } }
      { const n = Math.round(c.wallN ?? 36); photoWall.children.forEach((m) => { const s = m.userData.slot; if (s !== undefined) m.visible = s < n; }); }
      prattPin.visible = (c.prattPin ?? 0) > 0;
      (eggG.getObjectByName("dial") as THREE.Mesh).rotation.y = TAU * (c.egg ?? 0); eggG.visible = (c.eggOn ?? 1) > 0;
      { const k = Math.round((c.book ?? 0) * 8); if (k !== lastBook) { bookMat.map = scribbleTex(k / 8); bookMat.needsUpdate = true; lastBook = k; } }
      { const m = c.mag ?? 0, top = magG.children[2] as THREE.Mesh; if (top) { const u = sm(m); top.position.set(0.0 + 0.5 * u, 0.06 - 0.55 * u * u + 0.25 * Math.sin(Math.PI * u), 0.04 + 0.4 * u); top.rotation.set(1.2 * u, 0.8 + 2.4 * u, 0.6 * Math.sin(u * 6)); } }
      fishes.forEach((fi, i) => { const a = t * (0.6 + i * 0.15) + i * 1.7; fi.position.set(-6.4 + 0.42 * Math.sin(a), SW + 0.9 + 0.08 * i + 0.03 * Math.sin(a * 2.3), -11.3 + 0.1 * Math.cos(a)); fi.rotation.y = Math.cos(a) > 0 ? 0 : Math.PI; });
      { const k = Math.round(cl(c.chalk ?? 0) * 12); if (k !== lastChalk) { boardFace.map = chalkTex(k / 12); boardFace.needsUpdate = true; lastChalk = k; } }
      { const sh = sm(c.blinds ?? 0), part = sm(c.blindPart ?? 0); slats.forEach((s, k) => { s.rotation.x = 1.35 * sh * 0 + (0.15 + 1.25 * sh); s.position.z = 5.42; if (k === 7 || k === 8) { s.rotation.x += (k === 7 ? 0.7 : -0.7) * part; s.position.y = SW + 0.85 + 0.11 * k + 0.1 + (k === 7 ? -0.05 : 0.05) * part; } }); }
      deskCake.visible = (c.deskCake ?? 0) > 0;
      const sp = c.spring ?? 0; blossoms.forEach((m) => { const k = sm((sp - (m.userData.k0 as number)) / 0.25); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.01, k)); });
      const pe = c.petals ?? sp; petals.forEach((m) => { const d = m.userData as { x: number; z: number; y: number; s: number }; m.visible = pe > 0.05; if (!m.visible) return; const u = (t * 0.22 + d.s) % 1; m.position.set(d.x + Math.sin(t + d.s * 9) * 0.6 + u * 1.5, d.y * (1 - u) + 0.15, d.z + Math.cos(t * 0.7 + d.s * 7) * 0.4); m.rotation.set(t * 2 + d.s * 9, t * 1.3, d.s * 6); });
      { const pole = root.getObjectByName("pole"); if (pole) (poleMat.map as THREE.Texture).offset.y = (t * 0.35) % 1; }
      const lf = (lamp.children[2] as THREE.Group)?.getObjectByName("face") as THREE.Mesh | undefined; if (lf) ((lf.material as THREE.MeshLambertMaterial).emissive as THREE.Color).setStyle((c.lampOn ?? 1) > 0.5 ? "#8a7440" : "#2a2418");
      { const th = Math.round(c.therm ?? 14); if (th !== lastTherm) { thermMat.map = thermTex(th); thermMat.needsUpdate = true; lastTherm = th; } }
      tubRipple.forEach((w, i) => { const k = i === 1 ? c.tubB ?? 0 : c.tubA ?? 0; w.position.y = 0.02 * k * Math.sin(t * 14 + i); w.rotation.z = 0.04 * k * Math.sin(t * 11); });
      cardB.visible = (c.cardOn ?? 0) > 0;
    },
  };
};
