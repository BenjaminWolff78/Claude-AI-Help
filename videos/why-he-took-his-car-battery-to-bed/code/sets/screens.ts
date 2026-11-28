// screens.ts — IN-WORLD MOTION GRAPHICS, Rick's way (master prompt 9.4; kit v6.1 template, tested Nov 27 on the bistro set).
// Rick never floats graphics over the picture: the number, the countdown, the name of the trick live ON a thing in the world
// and change there (a wall screen counting down, a sign flipping GO -> NO GO, DAYS SINCE LAST CRASH dropping to 0, a scale
// needle swinging, a gauge filling). Each helper is a real lit object with its own canvas that is redrawn only when its
// quantised value changes (a canvas cached by a fixed key freezes; one redrawn every frame costs time).
//   LiveSign      the base: a board/screen mesh + its canvas; set(value) redraws on change
//   countdown     an LED wall clock / timer (MM:SS or SS.s), glowing
//   counter       a printed board with a big changing number ("DAYS SINCE LAST CRASH" / "PIGS" / "TONS")
//   splitFlap     a departure-board word that flips letter by letter to a new word
//   dial          a round gauge with a needle (scale, oven, pressure), labelled ticks
//   tube          a tube gauge filling (rain gauge, thermometer, tank level) with printed marks
//   tally         chalk tally marks on a board, n strokes
// Text always FITS its board (fitText shrinks the font): a cropped word reading as another word is a hard fail.
import * as THREE from "three";
import type { V3 } from "./types";

const FONT = `"DejaVu Sans", Montserrat, Arial, sans-serif`;
/** draw text centred at (x, y), shrinking the font until it fits maxW */
export const fitText = (g: CanvasRenderingContext2D, t: string, x: number, y: number, maxW: number, px: number, weight = "900", font = FONT) => {
  let s = px; g.font = `${weight} ${s}px ${font}`;
  while (g.measureText(t).width > maxW && s > 6) { s *= 0.94; g.font = `${weight} ${s}px ${font}`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y); return s;
};

export class LiveSign {
  mesh: THREE.Mesh; private cv: HTMLCanvasElement; private g: CanvasRenderingContext2D; private tex: THREE.CanvasTexture; private last = "\u0000";
  constructor(public w: number, public h: number, private draw: (g: CanvasRenderingContext2D, v: number | string, W: number, H: number) => void,
    o: { px?: number; glow?: number; frame?: string; depth?: number; round?: boolean } = {}) {
    const W = o.px ?? 512, H = Math.round(W * h / w);
    this.cv = document.createElement("canvas"); this.cv.width = W; this.cv.height = H; this.g = this.cv.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const face = o.glow
      ? new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: this.tex, emissiveIntensity: o.glow, roughness: 0.35 })
      : new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.8 });
    const side = new THREE.MeshStandardMaterial({ color: o.frame ?? "#2a2a2a", roughness: 0.6, metalness: 0.3 });
    // a thin box: the face is +z (material index 4); the frame shows on the edges
    if (o.round) {   // a round dial: a short cylinder whose front cap carries the canvas (its UVs inscribe the disc)
      const geo = new THREE.CylinderGeometry(w / 2, w / 2, o.depth ?? 0.05, 48); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2);   // cap UVs come in turned 90 deg (tested: -90 reads upside down)
      this.mesh = new THREE.Mesh(geo, [side, face, side]);
    } else this.mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, o.depth ?? 0.03), [side, side, side, side, face, side]);
    this.mesh.castShadow = false; this.mesh.receiveShadow = true;
  }
  set(v: number | string) {
    const k = String(v); if (k === this.last) return;
    this.draw(this.g, v, this.cv.width, this.cv.height); this.tex.needsUpdate = true; this.last = k;
  }
  place(parent: THREE.Object3D, at: V3, rotY = 0, tilt = 0) { this.mesh.position.set(...at); this.mesh.rotation.set(0, rotY, tilt); parent.add(this.mesh); return this; }
}

/** LED countdown: secs >= 60 -> MM:SS, else SS.s; label above the digits */
export const countdown = (w: number, h: number, label = "", color = "#ff3b2f") => new LiveSign(w, h, (g, v, W, H) => {
  const s = Math.max(0, Number(v));
  g.fillStyle = "#0b0b0d"; g.fillRect(0, 0, W, H);
  const txt = s >= 60 ? `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}` : s.toFixed(1).padStart(4, "0");
  g.fillStyle = "rgba(255,60,40,0.10)"; fitText(g, s >= 60 ? "88:88" : "88.8", W / 2, H * 0.6, W * 0.86, H * 0.62, "700", `"DejaVu Sans Mono", monospace`);   // unlit segments
  g.fillStyle = color; g.shadowColor = color; g.shadowBlur = H * 0.06;
  fitText(g, txt, W / 2, H * 0.6, W * 0.86, H * 0.62, "700", `"DejaVu Sans Mono", monospace`); g.shadowBlur = 0;
  if (label) { g.fillStyle = "#e8e2d0"; fitText(g, label, W / 2, H * 0.15, W * 0.9, H * 0.16, "800"); }
}, { glow: 1.4, frame: "#1a1a1a" });

/** a printed board with a big changing number: top line, the number on a hanging card, bottom line */
export const counter = (w: number, h: number, top: string, bottom = "", bg = "#f4efe2", ink = "#b3261e") => new LiveSign(w, h, (g, v, W, H) => {
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = ink; g.lineWidth = W * 0.02; g.strokeRect(g.lineWidth, g.lineWidth, W - 2 * g.lineWidth, H - 2 * g.lineWidth);
  g.fillStyle = ink; fitText(g, top, W / 2, H * 0.17, W * 0.84, H * 0.13);
  const cw = W * 0.5, ch = H * 0.48, cx = (W - cw) / 2, cy = H * 0.3;
  g.fillStyle = "#ffffff"; g.fillRect(cx, cy, cw, ch); g.strokeStyle = "#333"; g.lineWidth = 3; g.strokeRect(cx, cy, cw, ch);
  g.fillStyle = "#151515"; fitText(g, String(v), W / 2, cy + ch * 0.53, cw * 0.86, ch * 0.8);
  if (bottom) { g.fillStyle = "#333"; fitText(g, bottom, W / 2, H * 0.89, W * 0.84, H * 0.1, "800"); }
}, { frame: "#5a3a22" });

/** split-flap word: v = "WORD|k" where k 0..1 flips letter by letter from the previous word (call with flipTo) */
export const splitFlap = (w: number, h: number, n: number) => {
  let from = "", to = "";
  const sign = new LiveSign(w, h, (g, v, W, H) => {
    const k = Number(String(v).split("|")[1] ?? 1);
    g.fillStyle = "#111"; g.fillRect(0, 0, W, H);
    const tw = W / n, pad = tw * 0.08;
    for (let i = 0; i < n; i++) {
      const done = k * (n + 2) - i;                       // letters flip left to right
      const a = (from[i] ?? " "), b = (to[i] ?? " "), ch = done >= 1 ? b : done > 0 ? String.fromCharCode(65 + Math.floor((done * 26 + i * 7) % 26)) : a;
      const x = i * tw + pad, y = H * 0.1, cw = tw - 2 * pad, chh = H * 0.8;
      g.fillStyle = "#262626"; g.fillRect(x, y, cw, chh); g.fillStyle = "#0a0a0a"; g.fillRect(x, y + chh / 2 - 1.5, cw, 3);
      g.fillStyle = "#f2f2f2"; fitText(g, ch, x + cw / 2, y + chh * 0.53, cw * 0.86, chh * 0.78, "800", `"DejaVu Sans Mono", monospace`);
    }
  }, { glow: 0, frame: "#0d0d0d" });
  return { sign, flip: (a: string, b: string, k: number) => { from = a.padEnd(n).slice(0, n); to = b.padEnd(n).slice(0, n); sign.set(`${to}|${Math.round(Math.min(1, Math.max(0, k)) * 40) / 40}`); } };
};

/** a round dial: v 0..1 swings the needle from -120 to +120 deg; ticks labelled */
export const dial = (d: number, ticks: string[], label = "", face = "#f6f1e4") => new LiveSign(d, d, (g, v, W, H) => {
  const k = Math.min(1.05, Math.max(0, Number(v))), cx = W / 2, cy = H / 2, R = W * 0.44;
  g.clearRect(0, 0, W, H); g.fillStyle = "#2b2b2b"; g.beginPath(); g.arc(cx, cy, W * 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = face; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  const ang = (t: number) => (-120 + 240 * t) * Math.PI / 180 - Math.PI / 2;
  g.strokeStyle = "#222"; g.fillStyle = "#222";
  ticks.forEach((tx, i) => { const t = i / Math.max(1, ticks.length - 1), a = ang(t);
    g.lineWidth = W * 0.012; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); g.lineTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78); g.stroke();
    fitText(g, tx, cx + Math.cos(a) * R * 0.62, cy + Math.sin(a) * R * 0.62, R * 0.4, W * 0.075, "800"); });
  if (label) { g.fillStyle = "#b3261e"; fitText(g, label, cx, cy + R * 0.45, R * 1.1, W * 0.08, "900"); }
  const a = ang(k); g.strokeStyle = "#c0201a"; g.lineWidth = W * 0.022; g.lineCap = "round";
  g.beginPath(); g.moveTo(cx - Math.cos(a) * R * 0.12, cy - Math.sin(a) * R * 0.12); g.lineTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); g.stroke();
  g.fillStyle = "#333"; g.beginPath(); g.arc(cx, cy, W * 0.04, 0, Math.PI * 2); g.fill();
}, { px: 512, frame: "#2b2b2b", round: true });

/** a tube gauge: v 0..1 fills; marks = printed labels from bottom to top (e.g. ["1 IN","2","3",...]) */
export const tube = (w: number, h: number, marks: string[], liquid = "#3f8fd8", title = "") => new LiveSign(w, h, (g, v, W, H) => {
  const k = Math.min(1, Math.max(0, Number(v)));
  g.fillStyle = "#eef1f2"; g.fillRect(0, 0, W, H);
  const top = title ? H * 0.12 : H * 0.04, bot = H * 0.96, tx = W * 0.34, tw = W * 0.3;
  if (title) { g.fillStyle = "#1b1b1b"; fitText(g, title, W / 2, H * 0.06, W * 0.92, H * 0.07); }
  g.fillStyle = "#cfd8dc"; g.fillRect(tx, top, tw, bot - top);
  const ly = bot - (bot - top) * k; g.fillStyle = liquid; g.fillRect(tx, ly, tw, bot - ly);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(tx + tw * 0.12, top, tw * 0.12, bot - top);
  g.strokeStyle = "#222"; g.fillStyle = "#222"; g.lineWidth = 3;
  marks.forEach((m, i) => { const y = bot - (bot - top) * (i + 1) / marks.length; g.beginPath(); g.moveTo(tx + tw, y); g.lineTo(tx + tw + W * 0.08, y); g.stroke();
    g.textAlign = "left"; fitText(g, m, tx + tw + W * 0.2, y, W * 0.32, H * 0.06, "800"); });
}, { px: 256, frame: "#9aa3a8" });

/** chalk tally marks on a slate: v = count */
export const tally = (w: number, h: number, title = "") => new LiveSign(w, h, (g, v, W, H) => {
  const n = Math.max(0, Math.floor(Number(v)));
  g.fillStyle = "#26302b"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(240,240,230,0.9)"; g.lineCap = "round"; g.lineWidth = W * 0.012;
  if (title) { g.fillStyle = "rgba(240,240,230,0.92)"; fitText(g, title, W / 2, H * 0.13, W * 0.86, H * 0.13, "700"); }
  const per = 5, gw = W * 0.17, y0 = H * (title ? 0.32 : 0.15), y1 = y0 + H * 0.26, cols = 5;
  for (let i = 0; i < n; i++) {
    const grp = Math.floor(i / per), j = i % per, gx = W * 0.07 + (grp % cols) * gw * 1.08, row = Math.floor(grp / cols), dy = row * H * 0.34;
    const jit = ((i * 37) % 7 - 3) * 0.8;
    g.beginPath();
    if (j < 4) { const x = gx + j * gw * 0.22; g.moveTo(x + jit, y0 + dy); g.lineTo(x - jit, y1 + dy); }
    else { g.moveTo(gx - gw * 0.08, y1 + dy - H * 0.04); g.lineTo(gx + gw * 0.78, y0 + dy + H * 0.05); }
    g.stroke();
  }
}, { frame: "#6b4a30" });
